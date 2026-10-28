import test from "node:test";
import assert from "node:assert/strict";
import { solveCircuit, validateCircuit } from "../solver.js";

const battery = { id: "b", type: "battery", voltage: 9 };
const lamp = { id: "l", type: "lamp", resistance: 6 };
const wire = (from, to, id) => ({ id, from, to });

test("closed 9V, 6 ohm circuit gives 1.5A and 13.5W", () => {
  const r = solveCircuit([battery, lamp], [wire("b:a", "l:a"), wire("l:b", "b:b")]);
  assert.equal(r.ok, true);
  assert.equal(r.reason, "closed");
  assert.ok(Math.abs(r.readings.current - 1.5) < 1e-6);
  assert.ok(Math.abs(r.readings.power - 13.5) < 1e-6);
  assert.ok(Math.abs(r.readings.resistance - 6) < 1e-6);
  assert.ok(Math.abs(r.readings.sourcePower - r.readings.power) < 1e-6);
});

test("open switch interrupts current", () => {
  const s = { id: "s", type: "switch", closed: false };
  const r = solveCircuit([battery, lamp, s], [wire("b:a", "s:a"), wire("s:b", "l:a"), wire("l:b", "b:b")]);
  assert.equal(r.ok, true);
  assert.equal(r.reason, "open");
  assert.equal(r.readings.current, 0);
  assert.equal(r.readings.voltage, 9);
});

test("closed switch completes a circuit with a documented low resistance", () => {
  const s = { id: "s", type: "switch", closed: true };
  const r = solveCircuit([battery, lamp, s], [wire("b:a", "s:a"), wire("s:b", "l:a"), wire("l:b", "b:b")]);
  assert.equal(r.ok, true);
  assert.equal(r.reason, "closed");
  assert.ok(Math.abs(r.readings.current - 1.5) < 1e-3);
});

test("reports missing source", () => {
  const r = solveCircuit([lamp], [wire("l:a", "l:b")]);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "no-source");
});

test("detects direct battery short", () => {
  const r = solveCircuit([battery], [wire("b:a", "b:b")]);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "short-source");
});

test("reports disconnected circuit as open", () => {
  const r = solveCircuit([battery, lamp], []);
  assert.equal(r.ok, true);
  assert.equal(r.reason, "open");
  assert.equal(r.readings.current, 0);
  assert.equal(r.readings.voltage, 9);
  assert.equal(r.readings.components.b.voltage, 9);
});

test("parallel loads split current and calculate total power", () => {
  const l2 = { id: "l2", type: "lamp", resistance: 6 };
  const ws = [wire("b:a", "l:a"), wire("b:a", "l2:a"), wire("l:b", "b:b"), wire("l2:b", "b:b")];
  const r = solveCircuit([battery, lamp, l2], ws);
  assert.equal(r.ok, true);
  assert.equal(r.reason, "closed");
  assert.ok(Math.abs(r.readings.current - 3) < 1e-6);
  assert.ok(Math.abs(r.readings.power - 27) < 1e-6);
});

test("validates missing terminals before solver execution", () => {
  const r = solveCircuit([battery, lamp], [wire("b:a", "missing:a")]);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "invalid-topology");
  assert.equal(r.validation.errors[0].code, "invalid_wire_terminal");
});

test("rejects duplicate component identifiers", () => {
  const result = validateCircuit([battery, { ...lamp, id: "b" }], []);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.code === "duplicate_component_id"));
});

test("rejects non-finite and non-positive resistance", () => {
  const result = validateCircuit([battery, { ...lamp, resistance: 0 }], []);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.code === "invalid_resistance"));
});

test("two compatible series sources add their voltages", () => {
  const b2 = { id: "b2", type: "battery", voltage: 3 };
  const load = { id: "r", type: "resistor", resistance: 6 };
  const ws = [wire("b:b", "b2:a"), wire("b2:b", "r:a"), wire("r:b", "b:a")];
  const r = solveCircuit([battery, b2, load], ws);
  assert.equal(r.ok, true);
  assert.equal(r.reason, "closed");
  assert.ok(Math.abs(r.readings.current - 2) < 1e-6);
});

test("rejects conflicting ideal voltage sources", () => {
  const b2 = { id: "b2", type: "battery", voltage: 3 };
  const ws = [wire("b:a", "b2:a"), wire("b:b", "b2:b")];
  const r = solveCircuit([battery, b2], ws);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "singular");
});

test("ammeter models low series resistance and reports current", () => {
  const meter = { id: "a", type: "ammeter" };
  const ws = [wire("b:a", "a:a"), wire("a:b", "l:a"), wire("l:b", "b:b")];
  const r = solveCircuit([battery, lamp, meter], ws);
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.readings.components.a.current - 1.5) < 1e-3);
});

test("voltmeter models high input resistance across a load", () => {
  const meter = { id: "v", type: "voltmeter" };
  const ws = [wire("b:a", "l:a"), wire("l:b", "b:b"), wire("v:a", "l:a"), wire("v:b", "l:b")];
  const r = solveCircuit([battery, lamp, meter], ws);
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.readings.components.v.voltage - 9) < 1e-6);
});

test("opposing series sources use net voltage and signed source power", () => {
  const b2 = { id: "b2", type: "battery", voltage: 3 };
  const load = { id: "r", type: "resistor", resistance: 6 };
  const ws = [wire("b:b", "b2:b"), wire("b2:a", "r:a"), wire("r:b", "b:a")];
  const r = solveCircuit([battery, b2, load], ws);
  assert.equal(r.ok, true);
  assert.equal(r.reason, "closed");
  assert.ok(Math.abs(r.readings.voltage - 6) < 1e-6);
  assert.ok(Math.abs(r.readings.current - 1) < 1e-6);
  assert.ok(Math.abs(r.readings.resistance - 6) < 1e-6);
  assert.ok(Math.abs(r.readings.sourcePower - 6) < 1e-6);
});

test("branched multiple-source circuits do not publish misleading aggregate voltage/current/resistance", () => {
  const b1 = { id: "b1", type: "battery", voltage: 12 };
  const b2 = { id: "b2", type: "battery", voltage: 6 };
  const r1 = { id: "r1", type: "resistor", resistance: 10 };
  const r2 = { id: "r2", type: "resistor", resistance: 10 };
  const load = { id: "load", type: "resistor", resistance: 10 };
  const wires = [
    wire("b1:a", "r1:a"), wire("r1:b", "load:a"),
    wire("b2:a", "r2:a"), wire("r2:b", "load:a"),
    wire("b1:b", "b2:b"), wire("load:b", "b1:b")
  ];
  const result = solveCircuit([b1, b2, r1, r2, load], wires);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.reason, "closed");
  assert.equal(result.readings.summaryValid, false);
  assert.equal(result.readings.voltage, null);
  assert.equal(result.readings.current, null);
  assert.equal(result.readings.resistance, null);
  assert.ok(Math.abs(result.readings.components.load.voltage - 6) < 1e-7);
  assert.ok(Math.abs(result.readings.components.load.current - 0.6) < 1e-7);
  assert.ok(Math.abs(result.readings.power - 7.2) < 1e-7);
});

test("DC solver clearly rejects transient-only components", () => {
  const cap = { id: "c", type: "capacitor", capacitance: 0.001 };
  const r = solveCircuit([battery, lamp, cap], [wire("b:a", "l:a"), wire("l:b", "c:a"), wire("c:b", "b:b")]);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "transient-required");
});

test("warns when an ammeter is wired in parallel with a load", () => {
  const meter = { id: "a", type: "ammeter" };
  const ws = [
    wire("b:a", "l:a"),
    wire("b:a", "a:a"),
    wire("l:b", "b:b"),
    wire("a:b", "b:b")
  ];
  const result = validateCircuit([battery, lamp, meter], ws);
  assert.ok(result.warnings.some(w => w.code === "ammeter_parallel_branch"));
});

test("reversed battery polarity obeys KVL and reverses signed load current", () => {
  const r = solveCircuit([battery, lamp], [wire("b:a", "l:b"), wire("l:a", "b:b")]);
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.readings.current - 1.5) < 1e-6);
  const loopVoltage = r.readings.components.b.signedVoltage + r.readings.components.l.signedVoltage;
  assert.ok(Math.abs(loopVoltage) < 1e-6);
  assert.ok(r.readings.components.l.signedCurrent < 0);
});

test("source power balances load, switch and ammeter internal resistance losses", () => {
  const sw = { id: "s", type: "switch", closed: true };
  const meter = { id: "a", type: "ammeter" };
  const ws = [wire("b:a", "s:a"), wire("s:b", "a:a"), wire("a:b", "l:a"), wire("l:b", "b:b")];
  const r = solveCircuit([battery, lamp, sw, meter], ws);
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.readings.sourcePower - r.readings.power) < 1e-6);
  assert.ok(Math.abs(r.readings.power - ["l", "s", "a"].reduce((sum, id) => sum + r.readings.components[id].power, 0)) < 1e-6);
});

test("KCL holds at every node in a parallel-load circuit", () => {
  const l2 = { id: "l2", type: "lamp", resistance: 6 };
  const components = [battery, lamp, l2];
  const wires = [wire("b:a", "l:a"), wire("b:a", "l2:a"), wire("l:b", "b:b"), wire("l2:b", "b:b")];
  const result = solveCircuit(components, wires);
  assert.equal(result.ok, true);
  const parent = new Map();
  for (const c of components) for (const side of ["a", "b"]) parent.set(c.id + ":" + side, c.id + ":" + side);
  const find = key => {
    while (parent.get(key) !== key) key = parent.get(key);
    return key;
  };
  for (const w of wires) parent.set(find(w.to), find(w.from));
  const sums = new Map();
  for (const c of components) {
    const current = result.readings.components[c.id].signedCurrent;
    const a = find(c.id + ":a"), b = find(c.id + ":b");
    sums.set(a, (sums.get(a) || 0) + current);
    sums.set(b, (sums.get(b) || 0) - current);
  }
  for (const currentSum of sums.values()) assert.ok(Math.abs(currentSum) < 1e-6);
});

test("zero-volt source produces zero current and zero power", () => {
  const zeroBattery = { id: "b0", type: "battery", voltage: 0 };
  const result = solveCircuit([zeroBattery, lamp], [wire("b0:a", "l:a"), wire("l:b", "b0:b")]);
  assert.equal(result.ok, true);
  assert.equal(result.reason, "open");
  assert.ok(Math.abs(result.readings.current) < 1e-12);
  assert.ok(Math.abs(result.readings.power) < 1e-12);
});

test("reports unconnected terminals as diagnostics without invalidating the document", () => {
  const result = validateCircuit([battery], []);
  assert.equal(result.valid, true);
  assert.equal(result.warnings.filter(w => w.code === "unconnected_terminal").length, 2);
});

test("solver validation rejects non-array input without throwing", () => {
  const result = solveCircuit(null, []);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid-topology");
});

test("warns when a voltmeter is not across a single component branch", () => {
  const meter = { id: "v", type: "voltmeter" };
  const ws = [wire("b:a", "v:a"), wire("v:b", "l:a"), wire("l:b", "b:b")];
  const result = validateCircuit([battery, lamp, meter], ws);
  assert.ok(result.warnings.some(w => w.code === "voltmeter_not_across_component"));
});

test("does not warn when a voltmeter is connected in parallel across a load", () => {
  const meter = { id: "v", type: "voltmeter" };
  const ws = [wire("b:a", "l:a"), wire("l:b", "b:b"), wire("v:a", "l:a"), wire("v:b", "l:b")];
  const result = validateCircuit([battery, lamp, meter], ws);
  assert.ok(!result.warnings.some(w => w.code === "voltmeter_not_across_component"));
});

test("warns for an isolated subnetwork even when its terminals are wired together", () => {
  const isolated = { id: "r2", type: "resistor", resistance: 12 };
  const ws = [
    wire("b:a", "l:a"),
    wire("l:b", "b:b"),
    wire("r2:a", "r2:b")
  ];
  const result = validateCircuit([battery, lamp, isolated], ws);
  assert.equal(result.valid, true);
  assert.ok(result.warnings.some(w => w.code === "floating_branch" && w.componentId === "r2"));
});

test("does not report a source-connected load as a floating branch", () => {
  const ws = [wire("b:a", "l:a"), wire("l:b", "b:b")];
  const result = validateCircuit([battery, lamp], ws);
  assert.ok(!result.warnings.some(w => w.code === "floating_branch"));
});

test("reports every isolated component in a disconnected multi-component branch", () => {
  const r2 = { id: "r2", type: "resistor", resistance: 12 };
  const r3 = { id: "r3", type: "resistor", resistance: 18 };
  const ws = [
    wire("b:a", "l:a"),
    wire("l:b", "b:b"),
    wire("r2:a", "r3:a"),
    wire("r2:b", "r3:b")
  ];
  const result = validateCircuit([battery, lamp, r2, r3], ws);
  assert.ok(result.warnings.some(w => w.code === "floating_branch" && w.componentId === "r2"));
  assert.ok(result.warnings.some(w => w.code === "floating_branch" && w.componentId === "r3"));
});

test("warns when a component branch floats outside the source network", () => {
  const isolated = { id: "isolated", type: "resistor", resistance: 10 };
  const result = validateCircuit([battery, isolated], []);
  assert.equal(result.valid, true);
  assert.ok(result.warnings.some(w => w.code === "floating_branch" && w.componentId === "isolated"));
});

test("solves supported low and high resistance scales", () => {
  for (const resistance of [1e-6, 1e9]) {
    const load = { id: "scale-load", type: "resistor", resistance };
    const result = solveCircuit([battery, load], [wire("b:a", "scale-load:a"), wire("scale-load:b", "b:b")]);
    assert.equal(result.ok, true, `resistance scale ${resistance}`);
    assert.ok(Math.abs(result.readings.voltage - 9) < 1e-6);
    assert.ok(Math.abs(result.readings.current - 9 / resistance) / (9 / resistance) < 1e-6);
  }
});

test("rejects values outside documented DC source and resistance ranges", () => {
  const highVoltage = { ...battery, voltage: 1001 };
  const highResistance = { ...lamp, resistance: 1e10 };
  assert.ok(validateCircuit([highVoltage, lamp], []).errors.some(e => e.code === "invalid_voltage"));
  assert.ok(validateCircuit([battery, highResistance], []).errors.some(e => e.code === "invalid_resistance"));
});

test("an open switch in one parallel branch does not break the other closed branch", () => {
  const s1 = { id: "s1", type: "switch", closed: false };
  const s2 = { id: "s2", type: "switch", closed: true };
  const l1 = { id: "l1", type: "lamp", resistance: 6 };
  const l2 = { id: "l2", type: "lamp", resistance: 6 };
  const wires = [
    wire("b:a", "s1:a"), wire("b:a", "s2:a"),
    wire("s1:b", "l1:a"), wire("s2:b", "l2:a"),
    wire("l1:b", "b:b"), wire("l2:b", "b:b")
  ];
  const result = solveCircuit([battery, s1, s2, l1, l2], wires);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.reason, "closed");
  assert.ok(Math.abs(result.readings.components.l1.current) < 1e-9);
  assert.ok(Math.abs(result.readings.components.s1.current) < 1e-9);
  assert.ok(Math.abs(result.readings.components.l2.current - 9 / (6 + 1e-3)) < 1e-6);
  assert.ok(Math.abs(result.readings.current - result.readings.components.l2.current) < 1e-6);
});

test("multiple closed parallel switch branches share current without solver failure", () => {
  const s1 = { id: "s1", type: "switch", closed: true };
  const s2 = { id: "s2", type: "switch", closed: true };
  const l1 = { id: "l1", type: "lamp", resistance: 6 };
  const l2 = { id: "l2", type: "lamp", resistance: 6 };
  const wires = [
    wire("b:a", "s1:a"), wire("b:a", "s2:a"),
    wire("s1:b", "l1:a"), wire("s2:b", "l2:a"),
    wire("l1:b", "b:b"), wire("l2:b", "b:b")
  ];
  const result = solveCircuit([battery, s1, s2, l1, l2], wires);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.reason, "closed");
  assert.ok(Math.abs(result.readings.current - 2 * 9 / (6 + 1e-3)) < 1e-5);
});

test("multiple series switches require every switch to be closed", () => {
  const s1 = { id: "s1", type: "switch", closed: true };
  const s2 = { id: "s2", type: "switch", closed: false };
  const wires = [wire("b:a", "s1:a"), wire("s1:b", "s2:a"), wire("s2:b", "l:a"), wire("l:b", "b:b")];
  const result = solveCircuit([battery, s1, s2, lamp], wires);
  assert.equal(result.ok, true);
  assert.equal(result.reason, "open");
  assert.equal(result.readings.current, 0);
});

test("explicit junction nodes connect multiple branches electrically", () => {
  const components = [
    { id: "b", type: "battery", voltage: 9 },
    { id: "r1", type: "resistor", resistance: 10 },
    { id: "r2", type: "resistor", resistance: 10 }
  ];
  const junctions = [{ id: "j1", x: 200, y: 100 }, { id: "j2", x: 400, y: 100 }];
  const wires = [
    { id: "w1", from: "b:a", to: "j:j1" },
    { id: "w2", from: "j:j1", to: "r1:a" },
    { id: "w3", from: "j:j1", to: "r2:a" },
    { id: "w4", from: "r1:b", to: "j:j2" },
    { id: "w5", from: "r2:b", to: "j:j2" },
    { id: "w6", from: "j:j2", to: "b:b" }
  ];
  const result = solveCircuit(components, wires, junctions);
  assert.equal(result.ok, true, result.message);
  assert.ok(Math.abs(result.readings.current - 1.8) < 1e-6);
  assert.ok(Math.abs(result.readings.components.r1.current - 0.9) < 1e-6);
  assert.ok(Math.abs(result.readings.components.r2.current - 0.9) < 1e-6);
});

test("rejects numerically unstable extreme series resistance ratios instead of returning inaccurate readings", () => {
  const low = { id: "low", type: "resistor", resistance: 1e-6 };
  const high = { id: "high", type: "resistor", resistance: 1e9 };
  const result = solveCircuit([battery, low, high], [
    wire("b:a", "low:a"),
    wire("low:b", "high:a"),
    wire("high:b", "b:b")
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "numerical-instability");
  assert.deepEqual(result.readings, {});
});

test("junctions at identical coordinates remain separate nets unless wires share the same junction ID", () => {
  const components = [
    { id: "b", type: "battery", voltage: 10 },
    { id: "r1", type: "resistor", resistance: 10 },
    { id: "r2", type: "resistor", resistance: 10 },
    { id: "r3", type: "resistor", resistance: 10 },
    { id: "r4", type: "resistor", resistance: 20 }
  ];
  const junctions = [{ id: "top", x: 200, y: 200 }, { id: "bottom", x: 200, y: 200 }];
  const wires = [
    wire("b:a", "r1:a"), wire("r1:b", "j:top"), wire("j:top", "r2:a"), wire("r2:b", "b:b"),
    wire("b:a", "r3:a"), wire("r3:b", "j:bottom"), wire("j:bottom", "r4:a"), wire("r4:b", "b:b")
  ];
  const result = solveCircuit(components, wires, junctions);
  assert.equal(result.ok, true, result.message);
  assert.ok(Math.abs(result.readings.components.r1.current - 0.5) < 1e-7);
  assert.ok(Math.abs(result.readings.components.r2.current - 0.5) < 1e-7);
  assert.ok(Math.abs(result.readings.components.r3.current - 1 / 3) < 1e-7);
  assert.ok(Math.abs(result.readings.components.r4.current - 1 / 3) < 1e-7);
  assert.ok(Math.abs(result.readings.current - 5 / 6) < 1e-7);
});

test("junction coordinates and endpoint references are validated", () => {
  const components = [{ id: "b", type: "battery", voltage: 9 }];
  assert.equal(validateCircuit(components, [], [{ id: "j", x: NaN, y: 0 }]).valid, false);
  assert.equal(validateCircuit(components, [{ from: "b:a", to: "j:missing" }], []).valid, false);
  assert.equal(validateCircuit(components, [], [{ id: "j", x: 1, y: 2 }, { id: "j", x: 3, y: 4 }]).valid, false);
});
