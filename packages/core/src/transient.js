import { validateCircuit } from "./solver.js";
import {
  MIN_RESISTANCE,
  SWITCH_RESISTANCE,
  AMMETER_RESISTANCE,
  VOLTMETER_RESISTANCE,
} from "./constants.js";
import { gaussian, createUnionFind } from "./math-utils.js";

const SUPPORTED = new Set(["battery", "acSource", "resistor", "lamp", "switch", "ammeter", "voltmeter", "capacitor", "inductor"]);

function fail(reason, message, validation) {
  return { ok: false, reason, message, validation, samples: [] };
}

function sourceVoltage(source, time) {
  if (source.type === "battery") return Number(source.voltage);
  const phase = Number(source.phase ?? 0) * Math.PI / 180;
  return Number(source.offset ?? 0) + Number(source.amplitude) * Math.sin(2 * Math.PI * Number(source.frequency) * time + phase);
}

function validateBasicTransient(components, wires, options, junctions) {
  if (!Array.isArray(components) || !Array.isArray(wires) || !Array.isArray(junctions)) {
    return fail("invalid-input", "Components, wires and junctions must all be arrays.");
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    return fail("invalid-options", "Simulation options must be an object.");
  }
  if (components.length > 200 || wires.length > 1000) {
    return fail("complexity-limit", "Transient simulation is limited to 200 components and 1,000 wires.");
  }
  const duration = Number(options.duration ?? 1), step = Number(options.step ?? 0.001);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 1000) {
    return fail("invalid-duration", "Duration must be greater than 0 and at most 1000 seconds.");
  }
  if (!Number.isFinite(step) || step <= 0 || step > duration || Math.ceil(duration / step - Number.EPSILON * Math.max(1, duration / step) * 8) > 199999) {
    return fail("invalid-step", "Choose a positive time step no greater than the duration and no more than 200,000 samples, including the initial state.");
  }
  if (!components.length || components.some(c => !c || typeof c !== "object" || !SUPPORTED.has(c.type))) {
    return fail("unsupported-component", "This transient solver supports linear DC sources, resistive devices, capacitors and inductors.");
  }
  return null;
}

function validateStorageParams(capacitors, inductors, edges, components, prevCapV, prevIndI, validation) {
  for (const c of capacitors) {
    const v0 = prevCapV.get(c.id), val = Number(c.capacitance);
    if (!Number.isFinite(v0) || Math.abs(v0) > 1000 || !Number.isFinite(val) || val < 1e-9 || val > 1e6) {
      return fail("invalid-capacitance", "Capacitance must be between 1e-9 and 1e6 F, and initial voltage must be finite within ±1000 V.", validation);
    }
  }
  for (const c of inductors) {
    const i0 = prevIndI.get(c.id), val = Number(c.inductance);
    if (!Number.isFinite(i0) || Math.abs(i0) > 1000 || !Number.isFinite(val) || val < 1e-9 || val > 1e6) {
      return fail("invalid-inductance", "Inductance must be between 1e-9 and 1e6 H, and initial current must be finite within ±1000 A.", validation);
    }
    if (Math.abs(i0) > 1e-12 && !hasAlternateConductingPath(edges, edges.find(e => e.c.id === c.id), components)) {
      return fail("inductor-current-path-open", `Inductor ${c.id} has non-zero initial current but no closed conducting path. Add a freewheel/flyback diode, clamp, snubber, or another physically modeled current path before opening the circuit.`, validation);
    }
  }
  return null;
}

function computeTransientWarnings(components, sources, capacitors, inductors, step) {
  const resistances = components.filter(c => ["resistor", "lamp"].includes(c.type)).map(c => Number(c.resistance));
  const rcRates = capacitors.flatMap(c => resistances.map(r => 1 / (r * Number(c.capacitance))));
  const rlRates = inductors.flatMap(c => resistances.map(r => r / Number(c.inductance)));
  const rlcRates = capacitors.flatMap(c => inductors.map(l => Math.sqrt(1 / (Number(l.inductance) * Number(c.capacitance)))));
  const fastestDyn = Math.max(0, ...rcRates, ...rlRates, ...rlcRates);
  const fastestAc = Math.max(0, ...sources.filter(c => c.type === "acSource").map(c => 2 * Math.PI * Number(c.frequency)));
  const warnings = [];
  if (step * fastestDyn > 0.05) warnings.push("transientStepCoarse");
  if (step * fastestAc > 0.5) warnings.push("acSamplingCoarse");
  if (sources.length > 1) warnings.push("multiSourceTransientSummaryUnavailable");
  return warnings;
}

function buildInitialReadings(edges, sources, capacitors, inductors, prevCapV, prevIndI) {
  const readings = {};
  for (const { c } of edges) {
    const isCap = c.type === "capacitor", isInd = c.type === "inductor", isSrc = c.type === "battery" || c.type === "acSource";
    const initV = isCap ? prevCapV.get(c.id) : isSrc ? sourceVoltage(c, 0) : null;
    const initI = isInd ? prevIndI.get(c.id) : null;
    readings[c.id] = {
      voltage: Number.isFinite(initV) ? Math.abs(initV) : null, signedVoltage: initV,
      current: Number.isFinite(initI) ? Math.abs(initI) : null, signedCurrent: initI,
      signedPower: null, power: null, initialized: isCap || isInd || isSrc
    };
  }
  return readings;
}

function conductance(c) {
  if (c.type === "switch") return c.closed ? 1 / SWITCH_RESISTANCE : 0;
  if (c.type === "ammeter") return 1 / AMMETER_RESISTANCE;
  if (c.type === "voltmeter") return 1 / VOLTMETER_RESISTANCE;
  return 1 / Math.max(MIN_RESISTANCE, Number(c.resistance));
}

function buildStepMatrix(edges, sourceEdges, index, n, size, deltaTime, prevCapV, prevIndI, time) {
  const matrix = Array.from({ length: size }, () => Array(size + 1).fill(0));
  const addG = (a, b, g) => {
    if (!g) return;
    const ia = index.get(a), ib = index.get(b);
    if (ia !== undefined) matrix[ia][ia] += g;
    if (ib !== undefined) matrix[ib][ib] += g;
    if (ia !== undefined && ib !== undefined) { matrix[ia][ib] -= g; matrix[ib][ia] -= g; }
  };
  const addI = (a, b, current) => {
    const ia = index.get(a), ib = index.get(b);
    if (ia !== undefined) matrix[ia][size] -= current;
    if (ib !== undefined) matrix[ib][size] += current;
  };
  for (const e of edges) {
    const c = e.c;
    if (c.type === "battery" || c.type === "acSource" || (c.type === "switch" && !c.closed)) continue;
    if (["resistor", "lamp", "switch", "ammeter", "voltmeter"].includes(c.type)) addG(e.a, e.b, conductance(c));
    else if (c.type === "capacitor") { const g = Number(c.capacitance) / deltaTime; addG(e.a, e.b, g); addI(e.a, e.b, -g * prevCapV.get(c.id)); }
    else if (c.type === "inductor") { const g = deltaTime / Number(c.inductance); addG(e.a, e.b, g); addI(e.a, e.b, prevIndI.get(c.id)); }
  }
  sourceEdges.forEach((e, k) => {
    const row = n + k, ia = index.get(e.a), ib = index.get(e.b);
    if (ia !== undefined) { matrix[ia][row] += 1; matrix[row][ia] += 1; }
    if (ib !== undefined) { matrix[ib][row] -= 1; matrix[row][ib] -= 1; }
    matrix[row][size] = sourceVoltage(e.c, time);
  });
  return matrix;
}

function solveStepReadings(edges, sourceEdges, srcIdxMap, solution, index, reference, n, deltaTime, prevCapV, prevIndI, time) {
  const nodeV = node => node === reference ? 0 : (solution[index.get(node)] ?? 0);
  const readings = {};
  let sourcePower = 0, sourceCurrent = 0;
  for (const e of edges) {
    const c = e.c, v = nodeV(e.a) - nodeV(e.b);
    let current = 0;
    if (c.type === "battery" || c.type === "acSource") {
      current = solution[n + srcIdxMap.get(c.id)] || 0;
      sourcePower += -sourceVoltage(c, time) * current;
      sourceCurrent = Math.max(sourceCurrent, Math.abs(current));
    } else if (c.type === "switch" && !c.closed) {
      current = 0;
    } else if (["resistor", "lamp", "switch", "ammeter", "voltmeter"].includes(c.type)) {
      current = v * conductance(c);
    } else if (c.type === "capacitor") {
      current = Number(c.capacitance) / deltaTime * (v - prevCapV.get(c.id));
      prevCapV.set(c.id, v);
    } else if (c.type === "inductor") {
      current = prevIndI.get(c.id) + deltaTime / Number(c.inductance) * v;
      prevIndI.set(c.id, current);
    }
    const signedPower = c.type === "battery" || c.type === "acSource" ? -v * current : v * current;
    readings[c.id] = { voltage: Math.abs(v), signedVoltage: v, current: Math.abs(current), signedCurrent: current, signedPower, power: Math.max(0, signedPower) };
  }
  return { readings, sourcePower, sourceCurrent };
}

function checkStepKcl(edges, readings) {
  const nodeBal = new Map();
  let maxI = 0;
  for (const e of edges) {
    const cur = readings[e.c.id]?.signedCurrent || 0;
    maxI = Math.max(maxI, Math.abs(cur));
    nodeBal.set(e.a, (nodeBal.get(e.a) || 0) + cur);
    nodeBal.set(e.b, (nodeBal.get(e.b) || 0) - cur);
  }
  const kclResidual = Math.max(0, ...[...nodeBal.values()].map(v => Math.abs(v)));
  return kclResidual <= Math.max(1e-15, maxI * 1e-6);
}

function buildTransientTopology(components, wires, junctions) {
  const uf = createUnionFind([...components.flatMap(c => [c.id + ":a", c.id + ":b"]), ...junctions.map(j => "j:" + j.id)]);
  for (const w of wires) uf.union(w.from, w.to);
  const edges = components.map(c => ({ c, a: uf.find(c.id + ":a"), b: uf.find(c.id + ":b") }));
  const sources = components.filter(c => c.type === "battery" || c.type === "acSource");
  const capacitors = components.filter(c => c.type === "capacitor");
  const inductors = components.filter(c => c.type === "inductor");
  const sourceEdges = sources.map(c => edges.find(e => e.c.id === c.id));
  const srcIdxMap = new Map(sourceEdges.map((s, idx) => [s.c.id, idx]));
  const reference = sourceEdges[0]?.b;
  const nodeList = [...new Set(edges.flatMap(e => [e.a, e.b]))].filter(n => n !== reference);
  const index = new Map(nodeList.map((n, i) => [n, i]));
  return { edges, sources, capacitors, inductors, sourceEdges, srcIdxMap, reference, nodeList, index };
}

function executeTransientLoop(count, step, duration, topo, prevCapV, prevIndI, samples, validation) {
  const { edges, sourceEdges, srcIdxMap, reference, nodeList, index } = topo;
  const n = nodeList.length, m = sourceEdges.length, size = n + m;
  const firstCap = topo.capacitors[0], firstInd = topo.inductors[0];
  for (let sIdx = 1; sIdx <= count; sIdx++) {
    const time = Math.min(sIdx * step, duration), deltaTime = time - samples[samples.length - 1].time;
    const matrix = buildStepMatrix(edges, sourceEdges, index, n, size, deltaTime, prevCapV, prevIndI, time);
    const solution = gaussian(matrix);
    if (!solution) return fail("singular", "The transient network is floating or inconsistent. Check its topology and source constraints.", validation);
    const maxSrcRes = Math.max(0, ...sourceEdges.map(e => Math.abs((e.a === reference ? 0 : solution[index.get(e.a)] ?? 0) - (e.b === reference ? 0 : solution[index.get(e.b)] ?? 0) - sourceVoltage(e.c, time))));
    const maxSrcV = Math.max(0, ...sourceEdges.map(e => Math.abs(sourceVoltage(e.c, time))));
    if (maxSrcRes > Math.max(1e-9, maxSrcV * 1e-8)) return fail("numerical-instability", "The transient solution does not satisfy the voltage-source constraints within the accuracy tolerance.", validation);
    const stepRes = solveStepReadings(edges, sourceEdges, srcIdxMap, solution, index, reference, n, deltaTime, prevCapV, prevIndI, time);
    if (!checkStepKcl(edges, stepRes.readings)) return fail("numerical-instability", "The transient solution does not satisfy Kirchhoff's current law within the accuracy tolerance. Adjust component values or use a better-conditioned circuit model.", validation);
    for (const c of topo.capacitors) prevCapV.set(c.id, stepRes.readings[c.id].signedVoltage);
    for (const c of topo.inductors) prevIndI.set(c.id, stepRes.readings[c.id].signedCurrent);
    samples.push({
      time, voltage: sourceEdges.length === 1 ? sourceVoltage(sourceEdges[0].c, time) : null,
      current: sourceEdges.length === 1 ? stepRes.sourceCurrent : null,
      storageVoltage: firstCap ? stepRes.readings[firstCap.id].signedVoltage : 0,
      storageCurrent: firstInd ? stepRes.readings[firstInd.id].signedCurrent : 0,
      sourcePower: stepRes.sourcePower, components: stepRes.readings
    });
  }
  return null;
}

export function simulateTransient(components, wires, options = {}, junctions = []) {
  const err = validateBasicTransient(components, wires, options, junctions);
  if (err) return err;
  const validation = validateCircuit(components, wires, junctions);
  if (!validation.valid) return fail("invalid-topology", validation.errors[0].message, validation);
  const topo = buildTransientTopology(components, wires, junctions);
  if (!topo.sources.length) return fail("no-source", "Add a DC or AC voltage source.");
  if (!topo.capacitors.length && !topo.inductors.length && !topo.sources.some(c => c.type === "acSource")) return fail("no-storage", "Add an AC source, capacitor or inductor to run transient simulation.");
  if (topo.sourceEdges.some(e => e.a === e.b)) return fail("short-source", "A voltage source is directly shorted by an ideal wire.", validation);
  const prevCapV = new Map(topo.capacitors.map(c => [c.id, Number(c.initialVoltage ?? 0)]));
  const prevIndI = new Map(topo.inductors.map(c => [c.id, Number(c.initialCurrent ?? 0)]));
  const storageErr = validateStorageParams(topo.capacitors, topo.inductors, topo.edges, components, prevCapV, prevIndI, validation);
  if (storageErr) return storageErr;
  const duration = Number(options.duration ?? 1), step = Number(options.step ?? 0.001);
  const count = Math.ceil(duration / step - Number.EPSILON * Math.max(1, duration / step) * 8);
  if (Math.pow(Math.max(1, components.length), 3) * count > 50000000) return fail("complexity-limit", "This circuit and time step exceed the simulation work limit. Reduce circuit size or increase the time step.");
  const samples = [{
    time: 0, voltage: topo.sources.length === 1 ? sourceVoltage(topo.sources[0], 0) : null, current: null,
    storageVoltage: topo.capacitors[0] ? prevCapV.get(topo.capacitors[0].id) : 0, storageCurrent: topo.inductors[0] ? prevIndI.get(topo.inductors[0].id) : 0,
    sourcePower: null, components: buildInitialReadings(topo.edges, topo.sources, topo.capacitors, topo.inductors, prevCapV, prevIndI)
  }];
  const loopErr = executeTransientLoop(count, step, duration, topo, prevCapV, prevIndI, samples, validation);
  if (loopErr) return loopErr;
  const hasAc = topo.sources.some(c => c.type === "acSource"), hasC = topo.capacitors.length > 0, hasL = topo.inductors.length > 0;
  return {
    ok: true, mode: hasAc ? (hasC && hasL ? "ac-rlc" : hasC ? "ac-rc" : hasL ? "ac-rl" : "ac") : (hasC && hasL ? "rlc" : hasC ? "rc" : hasL ? "rl" : "dc"),
    summaryValid: topo.sources.length === 1,
    assumptions: { idealVoltageSources: true, idealWires: true, fixedResistance: true, integration: "backward-euler", duration, step, samples: samples.length },
    warnings: computeTransientWarnings(components, topo.sources, topo.capacitors, topo.inductors, step), samples
  };
}

function hasAlternateConductingPath(edges, targetBranch, components) {
  const adjacency = new Map();
  const connect = (a, b) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a).push(b);
    adjacency.get(b).push(a);
  };
  for (const edge of edges) {
    if (edge.c.id === targetBranch.c.id) continue;
    if (edge.c.type === "switch" && !edge.c.closed) continue;
    connect(edge.a, edge.b);
  }
  const visited = new Set([targetBranch.a]);
  const pending = [targetBranch.a];
  while (pending.length) {
    const node = pending.pop();
    if (node === targetBranch.b) return true;
    for (const next of adjacency.get(node) || []) {
      if (!visited.has(next)) {
        visited.add(next);
        pending.push(next);
      }
    }
  }
  return false;
}
