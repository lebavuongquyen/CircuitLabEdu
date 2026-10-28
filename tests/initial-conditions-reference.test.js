import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

test("RL transient honors a non-zero initial inductor current and backward-Euler recurrence", () => {
  const resistance = 10;
  const inductance = 1;
  const sourceVoltage = 10;
  const initialCurrent = 2;
  const step = 0.01;
  const result = simulateTransient([
    { id: "v", type: "battery", voltage: sourceVoltage },
    { id: "r", type: "resistor", resistance },
    { id: "l", type: "inductor", inductance, initialCurrent }
  ], [wire("v:a", "r:a"), wire("r:b", "l:a"), wire("l:b", "v:b")], { duration: 0.1, step });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.samples[0].components.l.signedCurrent, initialCurrent);
  assert.equal(result.samples[0].components.l.initialized, true);
  const factor = 1 / (1 + step * resistance / inductance);
  let expected = initialCurrent;
  for (let i = 1; i < result.samples.length; i++) {
    expected = factor * expected + (step * sourceVoltage / inductance) / (1 + step * resistance / inductance);
    assert.ok(Math.abs(result.samples[i].components.l.signedCurrent - expected) < 1e-8, `sample ${i}: expected ${expected}, got ${result.samples[i].components.l.signedCurrent}`);
    assert.ok(Math.abs(result.samples[i].components.r.signedCurrent - result.samples[i].components.l.signedCurrent) < 1e-8);
  }
});

test("RC transient honors a non-zero initial capacitor voltage and backward-Euler recurrence", () => {
  const resistance = 100;
  const capacitance = 0.001;
  const sourceVoltage = 10;
  const initialVoltage = 2;
  const step = 0.01;
  const result = simulateTransient([
    { id: "v", type: "battery", voltage: sourceVoltage },
    { id: "r", type: "resistor", resistance },
    { id: "c", type: "capacitor", capacitance, initialVoltage }
  ], [wire("v:a", "r:a"), wire("r:b", "c:a"), wire("c:b", "v:b")], { duration: 0.1, step });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.samples[0].components.c.signedVoltage, initialVoltage);
  assert.equal(result.samples[0].components.c.initialized, true);
  const ratio = step / (resistance * capacitance);
  let expected = initialVoltage;
  for (let i = 1; i < result.samples.length; i++) {
    expected = (expected + ratio * sourceVoltage) / (1 + ratio);
    assert.ok(Math.abs(result.samples[i].components.c.signedVoltage - expected) < 1e-8, `sample ${i}: expected ${expected}, got ${result.samples[i].components.c.signedVoltage}`);
    assert.ok(Math.abs(result.samples[i].components.r.signedCurrent - result.samples[i].components.c.signedCurrent) < 1e-8);
  }
});

test("invalid initial storage states fail explicitly instead of returning a successful simulation", () => {
  const baseWires = [wire("v:a", "r:a"), wire("r:b", "c:a"), wire("c:b", "v:b")];
  const invalid = simulateTransient([
    { id: "v", type: "battery", voltage: 10 },
    { id: "r", type: "resistor", resistance: 100 },
    { id: "c", type: "capacitor", capacitance: 0.001, initialVoltage: Number.NaN }
  ], baseWires, { duration: 0.1, step: 0.01 });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.reason, "invalid-capacitance");
});
