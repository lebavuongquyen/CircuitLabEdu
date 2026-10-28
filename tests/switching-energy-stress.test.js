import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

function twoSwitchStorageCircuit({ seriesClosed, bypassClosed, initialVoltage, initialCurrent }) {
  const components = [
    { id: "v", type: "battery", voltage: 9 },
    { id: "r", type: "resistor", resistance: 100 },
    { id: "s1", type: "switch", closed: seriesClosed },
    { id: "s2", type: "switch", closed: bypassClosed },
    { id: "c", type: "capacitor", capacitance: 0.001, initialVoltage },
    { id: "l", type: "inductor", inductance: 0.1, initialCurrent }
  ];
  const wires = [
    wire("v:a", "r:a"),
    wire("r:b", "s1:a"),
    wire("s1:b", "c:a"),
    wire("v:a", "s2:a"),
    wire("s2:b", "c:a"),
    wire("c:b", "l:a"),
    wire("l:b", "v:b")
  ];
  return { components, wires };
}

function energyLedger(result, components) {
  let sourceWork = 0;
  let resistorLoss = 0;
  let backwardEulerDissipation = 0;
  for (let i = 1; i < result.samples.length; i++) {
    const before = result.samples[i - 1];
    const after = result.samples[i];
    const dt = after.time - before.time;
    sourceWork += after.sourcePower * dt;
    for (const c of components) {
      const a = before.components[c.id];
      const b = after.components[c.id];
      if (c.type === "resistor") resistorLoss += b.signedVoltage * b.signedCurrent * dt;
      if (c.type === "switch" && c.closed) resistorLoss += b.signedVoltage * b.signedCurrent * dt;
      if (c.type === "capacitor") backwardEulerDissipation += 0.5 * c.capacitance * (b.signedVoltage - a.signedVoltage) ** 2;
      if (c.type === "inductor") backwardEulerDissipation += 0.5 * c.inductance * (b.signedCurrent - a.signedCurrent) ** 2;
    }
  }
  const stored = sample => components.reduce((sum, c) => {
    if (c.type === "capacitor") return sum + 0.5 * c.capacitance * sample.components[c.id].signedVoltage ** 2;
    if (c.type === "inductor") return sum + 0.5 * c.inductance * sample.components[c.id].signedCurrent ** 2;
    return sum;
  }, 0);
  const storedDelta = stored(result.samples.at(-1)) - stored(result.samples[0]);
  return { sourceWork, resistorLoss, storedDelta, backwardEulerDissipation, residual: sourceWork - resistorLoss - storedDelta };
}

test("two-switch transitions preserve capacitor voltage and inductor current across all four switch states", () => {
  const states = [
    [true, true],
    [false, true],
    [true, false],
    [true, true],
    [false, true]
  ];
  let initialVoltage = 1.25;
  let initialCurrent = 0.2;
  for (const [index, [seriesClosed, bypassClosed]] of states.entries()) {
    const circuit = twoSwitchStorageCircuit({ seriesClosed, bypassClosed, initialVoltage, initialCurrent });
    const result = simulateTransient(circuit.components, circuit.wires, { duration: 0.01, step: 0.0001 });
    assert.equal(result.ok, true, `state ${index} (${seriesClosed}, ${bypassClosed}): ${result.message}`);
    const first = result.samples[0];
    assert.equal(first.components.c.signedVoltage, initialVoltage, `capacitor voltage jumped at state ${index}`);
    assert.equal(first.components.l.signedCurrent, initialCurrent, `inductor current jumped at state ${index}`);
    for (const sample of result.samples) {
      assert.ok(Number.isFinite(sample.components.c.signedVoltage), `non-finite capacitor voltage at state ${index}, t=${sample.time}`);
      assert.ok(Number.isFinite(sample.components.l.signedCurrent), `non-finite inductor current at state ${index}, t=${sample.time}`);
    }
    for (const sample of result.samples.slice(1)) {
      assert.ok(Number.isFinite(sample.components.c.signedCurrent), `non-finite capacitor current at state ${index}, t=${sample.time}`);
      assert.ok(Number.isFinite(sample.components.l.signedVoltage), `non-finite inductor voltage at state ${index}, t=${sample.time}`);
      assert.ok(Math.abs(sample.components.c.signedCurrent - sample.components.l.signedCurrent) < 1e-6,
        `series storage current mismatch at state ${index}, t=${sample.time}`);
    }
    const ledger = energyLedger(result, circuit.components);
    assert.ok(Math.abs(ledger.residual - ledger.backwardEulerDissipation) < 1e-8,
      `energy ledger mismatch at state ${index}: ${JSON.stringify(ledger)}`);
    initialVoltage = result.samples.at(-1).components.c.signedVoltage;
    initialCurrent = result.samples.at(-1).components.l.signedCurrent;
  }
});

test("an isolated charged storage branch does not invent current when both source paths are open", () => {
  const circuit = twoSwitchStorageCircuit({ seriesClosed: false, bypassClosed: false, initialVoltage: 4, initialCurrent: 0 });
  const result = simulateTransient(circuit.components, circuit.wires, { duration: 0.01, step: 0.0001 });
  assert.equal(result.ok, true, result.message);
  for (const sample of result.samples) {
    assert.ok(Math.abs(sample.components.c.signedCurrent) < 1e-8, `isolated capacitor current should be zero, got ${sample.components.c.signedCurrent} at ${sample.time}`);
    assert.ok(Math.abs(sample.components.l.signedCurrent) < 1e-8, `isolated inductor current should be zero, got ${sample.components.l.signedCurrent} at ${sample.time}`);
    assert.ok(Math.abs(sample.components.c.signedVoltage - 4) < 1e-7, `isolated capacitor voltage drifted to ${sample.components.c.signedVoltage}`);
  }
});


test("opening every source path while an inductor carries current is rejected without fabricating a solution", () => {
  const circuit = twoSwitchStorageCircuit({ seriesClosed: false, bypassClosed: false, initialVoltage: 4, initialCurrent: 0.2 });
  const result = simulateTransient(circuit.components, circuit.wires, { duration: 0.01, step: 0.0001 });
  assert.equal(result.ok, false, "an ideal inductor with non-zero current needs a conducting path or a modeled flyback/clamp path");
  assert.equal(result.reason, "inductor-current-path-open", `expected a physical topology diagnosis, got ${result.reason}: ${result.message}`);
  assert.match(result.message, /freewheel|flyback|clamp/i);
  assert.equal(result.samples.length, 0, "failed simulation must not expose a partial trace as successful output");
});

test("non-zero inductor current is accepted when an alternate conducting return path remains", () => {
  const circuit = twoSwitchStorageCircuit({ seriesClosed: true, bypassClosed: false, initialVoltage: 1, initialCurrent: 0.2 });
  const result = simulateTransient(circuit.components, circuit.wires, { duration: 0.002, step: 0.0001 });
  assert.equal(result.ok, true, result.message);
  assert.ok(result.samples.length > 1);
  assert.ok(result.samples.every(sample => Number.isFinite(sample.components.l.signedCurrent)));
});


test("high stored-energy switching cases remain finite and close the energy ledger", () => {
  const initialStates = [
    { voltage: 50, current: 2 },
    { voltage: 200, current: 10 },
    { voltage: -80, current: -5 }
  ];
  for (const state of initialStates) {
    const circuit = twoSwitchStorageCircuit({
      seriesClosed: true,
      bypassClosed: true,
      initialVoltage: state.voltage,
      initialCurrent: state.current
    });
    const result = simulateTransient(circuit.components, circuit.wires, { duration: 0.001, step: 0.00001 });
    assert.equal(result.ok, true, `initial state ${JSON.stringify(state)}: ${result.message}`);
    for (const sample of result.samples.slice(1)) {
      for (const component of circuit.components) {
        const reading = sample.components[component.id];
        assert.ok(Number.isFinite(reading.signedVoltage), `non-finite voltage for ${component.id} at t=${sample.time} from ${JSON.stringify(state)}`);
        assert.ok(Number.isFinite(reading.signedCurrent), `non-finite current for ${component.id} at t=${sample.time} from ${JSON.stringify(state)}`);
      }
    }
    const ledger = energyLedger(result, circuit.components);
    const tolerance = Math.max(1e-8, Math.abs(ledger.sourceWork) * 1e-7, Math.abs(ledger.storedDelta) * 1e-7);
    assert.ok(Math.abs(ledger.residual - ledger.backwardEulerDissipation) <= tolerance,
      `high-energy ledger mismatch for ${JSON.stringify(state)}: ${JSON.stringify(ledger)}, tolerance=${tolerance}`);
  }
});
