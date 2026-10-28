import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

test("RC transient remains accurate for a valid high-conductance storage network", () => {
  const voltage = 9;
  const resistance = 1e-6;
  const capacitance = 1e6;
  const step = 0.001;
  const duration = 0.01;
  const components = [
    { id: "b", type: "battery", voltage },
    { id: "r", type: "resistor", resistance },
    { id: "c", type: "capacitor", capacitance, initialVoltage: 0 }
  ];
  const result = simulateTransient(components, [
    wire("b:a", "r:a"),
    wire("r:b", "c:a"),
    wire("c:b", "b:b")
  ], { duration, step });

  assert.equal(result.ok, true, `valid RC boundary case was rejected: ${result.reason}: ${result.message}`);
  const expected = voltage * (1 - Math.pow(resistance * capacitance / (resistance * capacitance + step), Math.round(duration / step)));
  const last = result.samples.at(-1);
  assert.ok(Math.abs(last.components.c.signedVoltage - expected) <= Math.max(1e-8, Math.abs(expected) * 1e-7), `capacitor voltage expected ${expected}, got ${last.components.c.signedVoltage}`);
  for (const sample of result.samples) {
    assert.ok(Number.isFinite(sample.components.c.signedVoltage), `non-finite capacitor voltage at t=${sample.time}`);
  }
  for (const sample of result.samples.slice(1)) {
    assert.ok(Number.isFinite(sample.components.r.signedCurrent), `non-finite resistor current at t=${sample.time}`);
    assert.ok(Number.isFinite(sample.components.c.signedCurrent), `non-finite capacitor current at t=${sample.time}`);
    assert.ok(Math.abs(sample.components.r.signedCurrent - sample.components.c.signedCurrent) <= Math.max(1e-8, Math.abs(sample.components.r.signedCurrent) * 1e-8), `series current mismatch at t=${sample.time}`);
  }
});
