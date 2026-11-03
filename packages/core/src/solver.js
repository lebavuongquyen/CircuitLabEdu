import {
  MIN_RESISTANCE,
  SWITCH_RESISTANCE,
  AMMETER_RESISTANCE,
  VOLTMETER_RESISTANCE,
} from "./constants.js";
import { gaussian, createUnionFind } from "./math-utils.js";

const KNOWN_TYPES = new Set([
  "battery", "acSource", "lamp", "resistor", "switch",
  "ammeter", "voltmeter", "capacitor", "inductor"
]);

function validateComponentParams(c, errors) {
  if (c.type === "battery" && (!Number.isFinite(Number(c.voltage)) || Number(c.voltage) < 0 || Number(c.voltage) > 1000)) {
    errors.push({ code: "invalid_voltage", componentId: c.id, message: "Source voltage must be a finite value between 0 and 1000 V." });
  }
  if (c.type === "acSource" && (![c.amplitude, c.frequency, c.phase, c.offset].every(v => Number.isFinite(Number(v))) || Number(c.amplitude) < 0 || Number(c.amplitude) > 1000 || Number(c.frequency) <= 0 || Number(c.frequency) > 100000 || Math.abs(Number(c.phase)) > 360000 || Math.abs(Number(c.offset)) > 1000)) {
    errors.push({ code: "invalid_ac_source", componentId: c.id, message: "AC source parameters are outside supported ranges." });
  }
  if (["resistor", "lamp"].includes(c.type) && (!Number.isFinite(Number(c.resistance)) || Number(c.resistance) < 1e-6 || Number(c.resistance) > 1e9)) {
    errors.push({ code: "invalid_resistance", componentId: c.id, message: "Resistance must be between 1e-6 and 1e9 ohms." });
  }
}

function validateComponentEntries(components, errors, ids, terminalKeys) {
  for (const c of components) {
    if (!c || typeof c.id !== "string" || !c.id) {
      errors.push({ code: "invalid_component_id", message: "Every component must have a non-empty string ID." });
      continue;
    }
    if (ids.has(c.id)) errors.push({ code: "duplicate_component_id", componentId: c.id, message: "Component IDs must be unique." });
    ids.add(c.id);
    if (!KNOWN_TYPES.has(c.type)) errors.push({ code: "unsupported_component", componentId: c.id, message: "Unsupported component type." });
    for (const side of ["a", "b"]) terminalKeys.add(c.id + ":" + side);
    validateComponentParams(c, errors);
  }
}

function validateJunctionEntries(junctions, errors, ids, terminalKeys, junctionKeys) {
  for (const j of junctions) {
    if (!j || typeof j.id !== "string" || !j.id || !Number.isFinite(j.x) || !Number.isFinite(j.y)) {
      errors.push({ code: "invalid_junction", junctionId: j?.id, message: "Each junction needs a unique ID and finite coordinates." });
      continue;
    }
    const key = "j:" + j.id;
    if (junctionKeys.has(key) || ids.has(key) || terminalKeys.has(key)) {
      errors.push({ code: "duplicate_junction_id", junctionId: j.id, message: "Junction IDs must be unique." });
    }
    junctionKeys.add(key);
  }
}

function validateWireList(wires, validNodeKeys, terminalDegree, uf, errors, warnings) {
  const wireIds = new Set(), connections = new Set();
  for (const w of wires) {
    if (!w || typeof w.from !== "string" || typeof w.to !== "string" || !validNodeKeys.has(w.from) || !validNodeKeys.has(w.to)) {
      errors.push({ code: "invalid_wire_terminal", wireId: w?.id, message: "A wire references a missing component terminal." });
      continue;
    }
    if (w.from === w.to) errors.push({ code: "self_wire", wireId: w.id, message: "A wire cannot connect a terminal to itself." });
    terminalDegree.set(w.from, (terminalDegree.get(w.from) || 0) + 1);
    terminalDegree.set(w.to, (terminalDegree.get(w.to) || 0) + 1);
    uf.union(w.from, w.to);
    const pair = [w.from, w.to].sort().join("|");
    if (connections.has(pair)) warnings.push({ code: "duplicate_wire", wireId: w.id, message: "Duplicate wire connection." });
    connections.add(pair);
    if (w.id && wireIds.has(w.id)) errors.push({ code: "duplicate_wire_id", wireId: w.id, message: "Wire IDs must be unique." });
    if (w.id) wireIds.add(w.id);
  }
}

function checkFloatingBranches(edges, warnings) {
  const adjacency = new Map();
  const linkNodes = (a, b) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a).add(b);
    adjacency.get(b).add(a);
  };
  for (const e of edges) if (!(e.c.type === "switch" && !e.c.closed)) linkNodes(e.a, e.b);
  const reachable = new Set(edges.filter(e => e.c.type === "battery" || e.c.type === "acSource").flatMap(e => [e.a, e.b]));
  const queue = [...reachable];
  while (queue.length) {
    for (const next of adjacency.get(queue.shift()) || []) {
      if (!reachable.has(next)) { reachable.add(next); queue.push(next); }
    }
  }
  for (const e of edges) {
    if (e.c.type !== "battery" && !reachable.has(e.a) && !reachable.has(e.b)) {
      warnings.push({ code: "floating_branch", componentId: e.c.id, message: "This component branch is disconnected from the voltage-source network." });
    }
  }
}

function checkMeterPlacements(edges, warnings) {
  for (const e of edges.filter(e => e.c.type === "ammeter")) {
    const isParallel = edges.some(other => other.c.id !== e.c.id && [e.a, e.b].sort().join("|") === [other.a, other.b].sort().join("|"));
    if (isParallel) warnings.push({ code: "ammeter_parallel_branch", componentId: e.c.id, message: "An ammeter appears to be connected in parallel. Place it in series with the branch being measured." });
  }
  for (const e of edges.filter(e => e.c.type === "voltmeter")) {
    const isAcross = edges.some(other => other.c.id !== e.c.id && [e.a, e.b].sort().join("|") === [other.a, other.b].sort().join("|"));
    if (!isAcross) warnings.push({ code: "voltmeter_not_across_component", componentId: e.c.id, message: "A voltmeter is not connected across a single component branch. Verify that it is placed in parallel with the intended component." });
  }
}

export function validateCircuit(components, wires, junctions = []) {
  if (!Array.isArray(components) || !Array.isArray(wires) || !Array.isArray(junctions)) {
    return { valid: false, errors: [{ code: "invalid-input", message: "Components, wires and junctions must all be arrays." }], warnings: [] };
  }
  const errors = [], warnings = [], ids = new Set(), terminalKeys = new Set(), junctionKeys = new Set();
  validateComponentEntries(components, errors, ids, terminalKeys);
  validateJunctionEntries(junctions, errors, ids, terminalKeys, junctionKeys);
  const validNodeKeys = new Set([...terminalKeys, ...junctionKeys]);
  const terminalDegree = new Map([...terminalKeys].map(key => [key, 0]));
  const uf = createUnionFind([...validNodeKeys]);
  validateWireList(wires, validNodeKeys, terminalDegree, uf, errors, warnings);
  for (const [terminal, degree] of terminalDegree) {
    if (degree === 0) warnings.push({ code: "unconnected_terminal", terminal, message: "A component terminal is not connected to any wire." });
  }
  const edges = components.filter(c => c && typeof c.id === "string").map(c => ({ c, a: uf.find(c.id + ":a"), b: uf.find(c.id + ":b") }));
  checkFloatingBranches(edges, warnings);
  checkMeterPlacements(edges, warnings);
  return { valid: errors.length === 0, errors, warnings };
}

function hasReturnPath(source, branches, sources) {
  const adjacency = new Map();
  const addAdj = (a, b) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a).push(b);
    adjacency.get(b).push(a);
  };
  for (const e of branches) addAdj(e.a, e.b);
  for (const e of sources) if (e !== source) addAdj(e.a, e.b);
  const seen = new Set(), pending = [source.a];
  while (pending.length) {
    const node = pending.pop();
    if (seen.has(node)) continue;
    seen.add(node);
    if (node === source.b) return true;
    for (const next of adjacency.get(node) || []) pending.push(next);
  }
  return false;
}

function branchResistance(c) {
  if (c.type === "switch") return SWITCH_RESISTANCE;
  if (c.type === "ammeter") return AMMETER_RESISTANCE;
  if (c.type === "voltmeter") return VOLTMETER_RESISTANCE;
  if (c.type === "resistor" || c.type === "lamp") return Math.max(MIN_RESISTANCE, Number(c.resistance));
  return null;
}

function buildMnaMatrix(branches, sources, index, n, m) {
  const size = n + m;
  const matrix = Array.from({ length: size }, () => Array(size + 1).fill(0));
  for (const e of branches) {
    const r = branchResistance(e.c);
    if (r === null) continue;
    const g = 1 / r, ia = index.get(e.a), ib = index.get(e.b);
    if (ia !== undefined) matrix[ia][ia] += g;
    if (ib !== undefined) matrix[ib][ib] += g;
    if (ia !== undefined && ib !== undefined) { matrix[ia][ib] -= g; matrix[ib][ia] -= g; }
  }
  sources.forEach((e, k) => {
    const row = n + k, ia = index.get(e.a), ib = index.get(e.b);
    if (ia !== undefined) { matrix[ia][row] += 1; matrix[row][ia] += 1; }
    if (ib !== undefined) { matrix[ib][row] -= 1; matrix[row][ib] -= 1; }
    matrix[row][size] = Number(e.c.voltage);
  });
  return matrix;
}

function computeComponentReadings(edges, sources, nodeV, solution, n) {
  const readings = {};
  let totalLoadPower = 0;
  for (const e of edges) {
    const c = e.c;
    let signedVoltage = nodeV(e.a) - nodeV(e.b), signedCurrent = 0, power = 0;
    if (c.type === "battery") {
      signedVoltage = Number(c.voltage);
      signedCurrent = solution[n + sources.indexOf(e)] || 0;
      power = -signedVoltage * signedCurrent;
    } else if (c.type === "switch" && !c.closed) {
      signedCurrent = 0;
    } else {
      const r = branchResistance(c);
      if (r !== null) {
        signedCurrent = signedVoltage / r;
        power = signedVoltage * signedCurrent;
        totalLoadPower += Math.max(0, power);
      }
    }
    readings[c.id] = { voltage: Math.abs(signedVoltage), signedVoltage, current: Math.abs(signedCurrent), signedCurrent, signedPower: power, power: Math.max(0, power) };
  }
  return { readings, totalLoadPower };
}

function verifyResiduals(sources, edges, nodeV, componentReadings, totalLoadPower) {
  const maxSrcRes = Math.max(0, ...sources.map(e => Math.abs(nodeV(e.a) - nodeV(e.b) - Number(e.c.voltage))));
  const maxSrcV = Math.max(0, ...sources.map(e => Math.abs(Number(e.c.voltage))));
  if (maxSrcRes > Math.max(1e-9, maxSrcV * 1e-8)) return false;
  const nodeCurrentBalance = new Map();
  let maxBranchI = 0;
  for (const e of edges) {
    const current = componentReadings[e.c.id]?.signedCurrent || 0;
    maxBranchI = Math.max(maxBranchI, Math.abs(current));
    nodeCurrentBalance.set(e.a, (nodeCurrentBalance.get(e.a) || 0) + current);
    nodeCurrentBalance.set(e.b, (nodeCurrentBalance.get(e.b) || 0) - current);
  }
  const kclResidual = Math.max(0, ...[...nodeCurrentBalance.values()].map(v => Math.abs(v)));
  if (kclResidual > Math.max(1e-15, maxBranchI * 1e-7)) return false;
  const totalSrcPower = sources.reduce((sum, e) => sum + (componentReadings[e.c.id]?.signedPower || 0), 0);
  if (Math.abs(totalSrcPower - totalLoadPower) > Math.max(1e-15, Math.max(Math.abs(totalSrcPower), totalLoadPower) * 1e-7)) return false;
  return true;
}

function computeSummary(sources, edges, componentReadings, totalLoadPower) {
  const totalCurrent = Math.max(0, ...sources.map(e => Math.abs(componentReadings[e.c.id]?.signedCurrent || 0)));
  const totalSourcePower = sources.reduce((sum, e) => sum + (componentReadings[e.c.id]?.signedPower || 0), 0);
  const nodeDegree = new Map();
  for (const e of edges) {
    nodeDegree.set(e.a, (nodeDegree.get(e.a) || 0) + 1);
    nodeDegree.set(e.b, (nodeDegree.get(e.b) || 0) + 1);
  }
  const seriesChain = sources.length === 1 || sources.every(e => nodeDegree.get(e.a) === 2 && nodeDegree.get(e.b) === 2);
  const summaryValid = seriesChain && (sources.length === 1 || totalCurrent > 1e-10);
  const voltage = sources.length === 1 ? Math.abs(Number(sources[0].c.voltage)) : summaryValid ? Math.max(0, totalSourcePower / totalCurrent) : null;
  const equivalent = summaryValid && totalCurrent > 1e-10 ? voltage / totalCurrent : (summaryValid ? Infinity : null);
  return {
    ok: true,
    reason: totalCurrent > 1e-10 ? "closed" : "open",
    readings: { voltage, current: summaryValid ? totalCurrent : null, power: totalLoadPower, sourcePower: totalSourcePower, resistance: equivalent, summaryValid, components: componentReadings },
    message: summaryValid ? (totalCurrent > 1e-10 ? "Circuit solved using the supported DC component models." : "No current flows through the loads.") : "Per-component readings are available, but aggregate voltage, current and equivalent resistance are not defined for this multi-source topology."
  };
}

export function solveCircuit(components, wires, junctions = []) {
  const validation = validateCircuit(components, wires, junctions);
  if (!validation.valid) return failure("invalid-topology", validation.errors[0].message, validation);
  if (components.some(c => c.type === "capacitor" || c.type === "inductor" || c.type === "acSource")) return failure("transient-required", "AC sources, capacitors and inductors require transient simulation.", validation);
  if (!components.some(c => c.type === "battery")) return failure("no-source", "Add a battery to power the circuit.", validation);
  const uf = createUnionFind([...components.flatMap(c => [c.id + ":a", c.id + ":b"]), ...junctions.map(j => "j:" + j.id)]);
  for (const w of wires) uf.union(w.from, w.to);
  const edges = components.map(c => ({ c, a: uf.find(c.id + ":a"), b: uf.find(c.id + ":b") }));
  const sources = edges.filter(e => e.c.type === "battery" || e.c.type === "acSource");
  if (sources.some(e => e.a === e.b)) return failure("short-source", "A voltage source is directly shorted by an ideal wire.", validation);
  const branches = edges.filter(e => e.c.type !== "battery" && !(e.c.type === "switch" && !e.c.closed) && e.a !== e.b);
  if (!sources.some(s => hasReturnPath(s, branches, sources))) return failure("open", "No complete path connects a source terminal back to the source.", validation, true, components);
  const reference = sources[0].b;
  const nodeList = [...new Set(edges.flatMap(e => [e.a, e.b]))].filter(n => n !== reference);
  const index = new Map(nodeList.map((n, i) => [n, i]));
  const matrix = buildMnaMatrix(branches, sources, index, nodeList.length, sources.length);
  const solution = gaussian(matrix);
  if (!solution) return failure("singular", "The circuit has a floating or inconsistent branch. Check the connections and voltage sources.", validation);
  const nodeV = node => node === reference ? 0 : (solution[index.get(node)] ?? 0);
  const { readings, totalLoadPower } = computeComponentReadings(edges, sources, nodeV, solution, nodeList.length);
  if (!verifyResiduals(sources, edges, nodeV, readings, totalLoadPower)) {
    return failure("numerical-instability", "The numerical solution does not satisfy Kirchhoff's laws or power conservation within the accuracy tolerance.", validation);
  }
  const summary = computeSummary(sources, edges, readings, totalLoadPower);
  summary.validation = validation;
  return summary;
}

function failure(reason, message, validation = { valid: true, errors: [], warnings: [] }, open = false, components = []) {
  const sources = open ? components.filter(c => c.type === "battery") : [];
  const componentReadings = Object.fromEntries(sources.map(c => [c.id, { voltage: Math.abs(Number(c.voltage)), signedVoltage: Number(c.voltage), current: 0, signedCurrent: 0, power: 0, signedPower: 0 }]));
  const summaryValid = sources.length === 1;
  return { ok: open, reason, message, validation, readings: open ? { voltage: summaryValid ? Math.abs(Number(sources[0].voltage)) : null, current: summaryValid ? 0 : null, power: 0, resistance: summaryValid ? Infinity : null, sourcePower: 0, summaryValid, components: componentReadings } : {} };
}
