import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

function switchedStorageCircuit({ switchClosed, initialVoltage = 0, initialCurrent = 0 }) {
  const components = [
    { id: "v", type: "battery", voltage: 9 },
    { id: "r", type: "resistor", resistance: 100 },
    { id: "s", type: "switch", closed: switchClosed },
    { id: "c", type: "capacitor", capacitance: 0.001, initialVoltage },
    { id: "l", type: "inductor", inductance: 0.1, initialCurrent }
  ];
  const wires = [
    wire("v:a", "r:a"),
    wire("v:a", "s:a"),
    wire("r:b", "c:a"),
    wire("s:b", "c:a"),
    wire("c:b", "l:a"),
    wire("l:b", "v:b")
  ];
  return { components, wires };
}

test("switch transition preserves stored capacitor voltage and inductor current across simulation segments", () => {
  const first = switchedStorageCircuit({ switchClosed: true });
  const beforeSwitch = simulateTransient(first.components, first.wires, { duration: 0.02, step: 0.0001 });
  assert.equal(beforeSwitch.ok, true, beforeSwitch.message);
  const last = beforeSwitch.samples.at(-1);
  const storedVoltage = last.components.c.signedVoltage;
  const storedCurrent = last.components.l.signedCurrent;
  assert.ok(Math.abs(storedVoltage) > 1e-4, "capacitor must contain stored energy before switching");
  assert.ok(Math.abs(storedCurrent) > 1e-4, "inductor must contain stored energy before switching");

  const second = switchedStorageCircuit({
    switchClosed: false,
    initialVoltage: storedVoltage,
    initialCurrent: storedCurrent
  });
  const afterSwitch = simulateTransient(second.components, second.wires, { duration: 0.02, step: 0.0001 });
  assert.equal(afterSwitch.ok, true, afterSwitch.message);
  assert.equal(afterSwitch.samples[0].components.c.signedVoltage, storedVoltage);
  assert.equal(afterSwitch.samples[0].components.l.signedCurrent, storedCurrent);
  assert.equal(afterSwitch.samples[0].components.c.initialized, true);
  assert.equal(afterSwitch.samples[0].components.l.initialized, true);
  for (const sample of afterSwitch.samples.slice(1)) {
    assert.ok(Number.isFinite(sample.components.c.signedVoltage), `non-finite capacitor voltage at t=${sample.time}`);
    assert.ok(Number.isFinite(sample.components.l.signedCurrent), `non-finite inductor current at t=${sample.time}`);
    assert.ok(Math.abs(sample.components.r.signedCurrent + sample.components.s.signedCurrent - sample.components.c.signedCurrent) < 1e-7, `parallel-branch KCL mismatch at t=${sample.time}`);
    assert.ok(Math.abs(sample.components.c.signedCurrent - sample.components.l.signedCurrent) < 1e-7, `series current mismatch at t=${sample.time}`);
  }
});
