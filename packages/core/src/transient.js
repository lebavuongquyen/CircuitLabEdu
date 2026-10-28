import { validateCircuit } from "./solver.js";

const MIN_RESISTANCE = 1e-9;
const SWITCH_RESISTANCE = 1e-3;
const AMMETER_RESISTANCE = 1e-3;
const VOLTMETER_RESISTANCE = 1e9;

export function simulateTransient(components, wires, options = {}, junctions = []) {
  if (!Array.isArray(components) || !Array.isArray(wires) || !Array.isArray(junctions)) return fail("invalid-input", "Components, wires and junctions must all be arrays.");
  if (options === null || typeof options !== "object" || Array.isArray(options)) return fail("invalid-options", "Simulation options must be an object.");
  if (components.length > 200 || wires.length > 1000) return fail("complexity-limit", "Transient simulation is limited to 200 components and 1,000 wires.");
  const duration = Number(options.duration ?? 1);
  const step = Number(options.step ?? 0.001);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 1000) return fail("invalid-duration", "Duration must be greater than 0 and at most 1000 seconds.");
  if (!Number.isFinite(step) || step <= 0 || step > duration || Math.ceil(duration / step - Number.EPSILON * Math.max(1, duration / step) * 8) > 199999) return fail("invalid-step", "Choose a positive time step no greater than the duration and no more than 200,000 samples, including the initial state.");
  const supported = new Set(["battery", "acSource", "resistor", "lamp", "switch", "ammeter", "voltmeter", "capacitor", "inductor"]);
  if (!components.length || components.some(c => !c || typeof c !== "object" || !supported.has(c.type))) return fail("unsupported-component", "This transient solver supports linear DC sources, resistive devices, capacitors and inductors.");
  const validation = validateCircuit(components, wires, junctions);
  if (!validation.valid) return fail("invalid-topology", validation.errors[0].message, validation);
  const sources = components.filter(c => c.type === "battery" || c.type === "acSource");
  const capacitors = components.filter(c => c.type === "capacitor");
  const inductors = components.filter(c => c.type === "inductor");
  if (!sources.length) return fail("no-source", "Add a DC or AC voltage source.");
  if (!capacitors.length && !inductors.length && !sources.some(c => c.type === "acSource")) return fail("no-storage", "Add an AC source, capacitor or inductor to run transient simulation.");

  const parent = new Map();
  for (const c of components) for (const side of ["a", "b"]) parent.set(c.id + ":" + side, c.id + ":" + side);
  for (const j of junctions) parent.set("j:" + j.id, "j:" + j.id);
  const find = key => {
    let x = key;
    while (parent.get(x) !== x) x = parent.get(x);
    let current = key;
    while (parent.get(current) !== current) {
      const next = parent.get(current);
      parent.set(current, x);
      current = next;
    }
    return x;
  };
  for (const w of wires) {
    const a = find(w.from), b = find(w.to);
    if (a !== b) parent.set(b, a);
  }
  const edges = components.map(c => ({ c, a: find(c.id + ":a"), b: find(c.id + ":b") }));
  if (edges.some(e => (e.c.type === "battery" || e.c.type === "acSource") && e.a === e.b)) return fail("short-source", "A voltage source is directly shorted by an ideal wire.", validation);

  const nodes = [...new Set(edges.flatMap(e => [e.a, e.b]))];
  const reference = edges.find(e => e.c.type === "battery" || e.c.type === "acSource").b;
  const nodeList = nodes.filter(n => n !== reference);
  const index = new Map(nodeList.map((n, i) => [n, i]));
  const n = nodeList.length, m = sources.length, size = n + m;
  const sourceEdges = sources.map(c => edges.find(e => e.c.id === c.id));
  const previousCapVoltage = new Map(capacitors.map(c => [c.id, Number(c.initialVoltage ?? 0)]));
  const previousInductorCurrent = new Map(inductors.map(c => [c.id, Number(c.initialCurrent ?? 0)]));
  for (const c of capacitors) if (!Number.isFinite(previousCapVoltage.get(c.id)) || Math.abs(previousCapVoltage.get(c.id)) > 1000 || !Number.isFinite(Number(c.capacitance)) || Number(c.capacitance) < 1e-9 || Number(c.capacitance) > 1e6) return fail("invalid-capacitance", "Capacitance must be between 1e-9 and 1e6 F, and initial voltage must be finite within ±1000 V.");
  for (const c of inductors) if (!Number.isFinite(previousInductorCurrent.get(c.id)) || Math.abs(previousInductorCurrent.get(c.id)) > 1000 || !Number.isFinite(Number(c.inductance)) || Number(c.inductance) < 1e-9 || Number(c.inductance) > 1e6) return fail("invalid-inductance", "Inductance must be between 1e-9 and 1e6 H, and initial current must be finite within ±1000 A.");
  for (const inductor of inductors) {
    if (Math.abs(previousInductorCurrent.get(inductor.id)) <= 1e-12) continue;
    const branch = edges.find(e => e.c.id === inductor.id);
    if (!hasAlternateConductingPath(edges, branch, components)) {
      return fail("inductor-current-path-open", `Inductor ${inductor.id} has non-zero initial current but no closed conducting path. Add a freewheel/flyback diode, clamp, snubber, or another physically modeled current path before opening the circuit.`, validation);
    }
  }
  for (const c of components) {
    if (c.type === "battery" && (!Number.isFinite(Number(c.voltage)) || Number(c.voltage) < 0)) return fail("invalid-voltage", "Source voltage must be finite and non-negative.");
    if (c.type === "acSource" && (![c.amplitude, c.frequency, c.phase, c.offset].every(v => Number.isFinite(Number(v))) || Number(c.amplitude) < 0 || Number(c.frequency) <= 0 || Number(c.frequency) > 100000 || Math.abs(Number(c.phase)) > 360000 || Math.abs(Number(c.offset)) > 1000 || Number(c.amplitude) > 1000)) return fail("invalid-ac-source", "AC amplitude and offset must be within 0–1000 V, frequency within (0, 100000] Hz, and phase within ±360000 degrees.");
    if (["resistor", "lamp"].includes(c.type) && (!Number.isFinite(Number(c.resistance)) || Number(c.resistance) <= 0)) return fail("invalid-resistance", "Resistance must be finite and positive.");
  }

  const resistances = components.filter(c => ["resistor", "lamp"].includes(c.type)).map(c => Number(c.resistance));
  const rcRates = capacitors.flatMap(c => resistances.map(r => 1 / (r * Number(c.capacitance))));
  const rlRates = inductors.flatMap(c => resistances.map(r => r / Number(c.inductance)));
  const rlcRates = capacitors.flatMap(c => inductors.map(l => Math.sqrt(1 / (Number(l.inductance) * Number(c.capacitance)))));
  const fastestDynamicRate = Math.max(0, ...rcRates, ...rlRates, ...rlcRates);
  const fastestAcAngularRate = Math.max(0, ...sources.filter(c => c.type === "acSource").map(c => 2 * Math.PI * Number(c.frequency)));
  const accuracyWarnings = [];
  if (step * fastestDynamicRate > 0.05) accuracyWarnings.push("transientStepCoarse");
  if (step * fastestAcAngularRate > 0.5) accuracyWarnings.push("acSamplingCoarse");
  if (sources.length > 1) accuracyWarnings.push("multiSourceTransientSummaryUnavailable");

  const nodeVoltage = (node, solution) => node === reference ? 0 : (solution[index.get(node)] ?? 0);
  const conductance = c => c.type === "switch" ? (c.closed ? 1 / SWITCH_RESISTANCE : 0) : c.type === "ammeter" ? 1 / AMMETER_RESISTANCE : c.type === "voltmeter" ? 1 / VOLTMETER_RESISTANCE : 1 / Math.max(MIN_RESISTANCE, Number(c.resistance));
  const storage = [...capacitors, ...inductors];
  const firstCap = capacitors[0], firstInductor = inductors[0];
  const initialReadings = Object.fromEntries(edges.map(({ c }) => {
    const isCapacitor = c.type === "capacitor";
    const isInductor = c.type === "inductor";
    const isSource = c.type === "battery" || c.type === "acSource";
    const initialVoltage = isCapacitor ? previousCapVoltage.get(c.id) : isSource ? sourceVoltage(c, 0) : null;
    const initialCurrent = isInductor ? previousInductorCurrent.get(c.id) : null;
    return [c.id, {
      voltage: Number.isFinite(initialVoltage) ? Math.abs(initialVoltage) : null,
      signedVoltage: initialVoltage,
      current: Number.isFinite(initialCurrent) ? Math.abs(initialCurrent) : null,
      signedCurrent: initialCurrent,
      signedPower: null,
      power: null,
      initialized: isCapacitor || isInductor || isSource
    }];
  }));
  const samples = [{
    time: 0,
    voltage: sources.length === 1 ? sourceVoltage(sources[0], 0) : null,
    current: null,
    storageVoltage: firstCap ? previousCapVoltage.get(firstCap.id) : 0,
    storageCurrent: firstInductor ? previousInductorCurrent.get(firstInductor.id) : 0,
    sourcePower: null,
    components: initialReadings
  }];

  const stepCount = duration / step;
  const count = Math.ceil(stepCount - Number.EPSILON * Math.max(1, stepCount) * 8);
  if (Math.pow(Math.max(1, components.length), 3) * count > 50000000) return fail("complexity-limit", "This circuit and time step exceed the simulation work limit. Reduce circuit size or increase the time step.");
  for (let sampleIndex = 1; sampleIndex <= count; sampleIndex++) {
    const time = Math.min(sampleIndex * step, duration);
    const deltaTime = time - samples[samples.length - 1].time;
    const matrix = Array.from({ length: size }, () => Array(size + 1).fill(0));
    const addConductance = (a, b, g) => {
      if (!g) return;
      const ia = index.get(a), ib = index.get(b);
      if (ia !== undefined) matrix[ia][ia] += g;
      if (ib !== undefined) matrix[ib][ib] += g;
      if (ia !== undefined && ib !== undefined) {
        matrix[ia][ib] -= g;
        matrix[ib][ia] -= g;
      }
    };
    const addCurrentSourceRhs = (a, b, current) => {
      const ia = index.get(a), ib = index.get(b);
      if (ia !== undefined) matrix[ia][size] -= current;
      if (ib !== undefined) matrix[ib][size] += current;
    };
    for (const e of edges) {
      const c = e.c;
      if (c.type === "battery" || c.type === "acSource" || (c.type === "switch" && !c.closed)) continue;
      if (["resistor", "lamp", "switch", "ammeter", "voltmeter"].includes(c.type)) {
        addConductance(e.a, e.b, conductance(c));
      } else if (c.type === "capacitor") {
        const g = Number(c.capacitance) / deltaTime;
        addConductance(e.a, e.b, g);
        addCurrentSourceRhs(e.a, e.b, -g * previousCapVoltage.get(c.id));
      } else if (c.type === "inductor") {
        const g = deltaTime / Number(c.inductance);
        addConductance(e.a, e.b, g);
        addCurrentSourceRhs(e.a, e.b, previousInductorCurrent.get(c.id));
      }
    }
    sourceEdges.forEach((e, k) => {
      const row = n + k, ia = index.get(e.a), ib = index.get(e.b);
      if (ia !== undefined) { matrix[ia][row] += 1; matrix[row][ia] += 1; }
      if (ib !== undefined) { matrix[ib][row] -= 1; matrix[row][ib] -= 1; }
      matrix[row][size] = sourceVoltage(e.c, time);
    });
    const solution = gaussian(matrix);
    if (!solution) return fail("singular", "The transient network is floating or inconsistent. Check its topology and source constraints.", validation);
    const maximumSourceVoltageResidual = Math.max(0, ...sourceEdges.map(e => Math.abs(nodeVoltage(e.a, solution) - nodeVoltage(e.b, solution) - sourceVoltage(e.c, time))));
    const maximumSourceVoltage = Math.max(0, ...sourceEdges.map(e => Math.abs(sourceVoltage(e.c, time))));
    if (maximumSourceVoltageResidual > Math.max(1e-9, maximumSourceVoltage * 1e-8)) return fail("numerical-instability", "The transient solution does not satisfy the voltage-source constraints within the accuracy tolerance.", validation);
    const readings = {};
    let sourcePower = 0;
    let sourceCurrent = 0;
    for (const e of edges) {
      const c = e.c;
      const v = nodeVoltage(e.a, solution) - nodeVoltage(e.b, solution);
      let current = 0;
      if (c.type === "battery" || c.type === "acSource") {
        current = solution[n + sourceEdges.findIndex(source => source.c.id === c.id)] || 0;
        sourcePower += -sourceVoltage(c, time) * current;
        sourceCurrent = Math.max(sourceCurrent, Math.abs(current));
      } else if (c.type === "switch" && !c.closed) {
        current = 0;
      } else if (["resistor", "lamp", "switch", "ammeter", "voltmeter"].includes(c.type)) {
        current = v * conductance(c);
      } else if (c.type === "capacitor") {
        current = Number(c.capacitance) / deltaTime * (v - previousCapVoltage.get(c.id));
        previousCapVoltage.set(c.id, v);
      } else if (c.type === "inductor") {
        current = previousInductorCurrent.get(c.id) + deltaTime / Number(c.inductance) * v;
        previousInductorCurrent.set(c.id, current);
      }
      const signedPower = c.type === "battery" || c.type === "acSource" ? -v * current : v * current;
      readings[c.id] = { voltage: Math.abs(v), signedVoltage: v, current: Math.abs(current), signedCurrent: current, signedPower, power: Math.max(0, signedPower) };
    }
    const nodeCurrentBalance = new Map();
    let maximumBranchCurrent = 0;
    for (const e of edges) {
      const current = readings[e.c.id]?.signedCurrent || 0;
      maximumBranchCurrent = Math.max(maximumBranchCurrent, Math.abs(current));
      nodeCurrentBalance.set(e.a, (nodeCurrentBalance.get(e.a) || 0) + current);
      nodeCurrentBalance.set(e.b, (nodeCurrentBalance.get(e.b) || 0) - current);
    }
    const kclResidual = Math.max(0, ...[...nodeCurrentBalance.values()].map(value => Math.abs(value)));
    const kclTolerance = Math.max(1e-15, maximumBranchCurrent * 1e-6);
    if (kclResidual > kclTolerance) {
      return fail("numerical-instability", "The transient solution does not satisfy Kirchhoff's current law within the accuracy tolerance. Adjust component values or use a better-conditioned circuit model.", validation);
    }
    for (const c of capacitors) previousCapVoltage.set(c.id, readings[c.id].signedVoltage);
    for (const c of inductors) previousInductorCurrent.set(c.id, readings[c.id].signedCurrent);
    samples.push({
      time,
      voltage: sources.length === 1 ? sourceVoltage(sources[0], time) : null,
      current: sources.length === 1 ? sourceCurrent : null,
      storageVoltage: firstCap ? readings[firstCap.id].signedVoltage : 0,
      storageCurrent: firstInductor ? readings[firstInductor.id].signedCurrent : 0,
      sourcePower,
      components: readings
    });
  }
  return {
    ok: true,
    mode: sources.some(c => c.type === "acSource") ? (capacitors.length && inductors.length ? "ac-rlc" : capacitors.length ? "ac-rc" : inductors.length ? "ac-rl" : "ac") : capacitors.length && inductors.length ? "rlc" : capacitors.length ? "rc" : inductors.length ? "rl" : "dc",
    summaryValid: sources.length === 1,
    assumptions: { idealVoltageSources: true, idealWires: true, fixedResistance: true, integration: "backward-euler", duration, step, samples: samples.length },
    warnings: accuracyWarnings,
    samples
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

function sourceVoltage(source, time) {
  if (source.type === "battery") return Number(source.voltage);
  const phase = Number(source.phase ?? 0) * Math.PI / 180;
  return Number(source.offset ?? 0) + Number(source.amplitude) * Math.sin(2 * Math.PI * Number(source.frequency) * time + phase);
}

function fail(reason, message, validation) {
  return { ok: false, reason, message, validation, samples: [] };
}

function gaussian(a) {
  const n = a.length;
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(a[r][i]) > Math.abs(a[max][i])) max = r;
    const pivotRowScale = Math.max(0, ...a[max].slice(i, n).map(value => Math.abs(value)));
    const tolerance = pivotRowScale * Number.EPSILON * Math.max(1, n) * 16;
    if (!Number.isFinite(a[max][i]) || Math.abs(a[max][i]) <= tolerance) return null;
    [a[i], a[max]] = [a[max], a[i]];
    const pivot = a[i][i];
    for (let c = i; c <= n; c++) a[i][c] /= pivot;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = a[r][i];
      if (Math.abs(factor) <= 1e-15) continue;
      for (let c = i; c <= n; c++) a[r][c] -= factor * a[i][c];
    }
  }
  return a.map(row => row[n]);
}
