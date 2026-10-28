import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

function runRC(step) {
  const voltage = 12, resistance = 1000, capacitance = 0.001;
  const tau = resistance * capacitance;
  const components = [
    { id: "v", type: "battery", voltage },
    { id: "r", type: "resistor", resistance },
    { id: "c", type: "capacitor", capacitance, initialVoltage: 0 }
  ];
  const result = simulateTransient(components, [wire("v:a", "r:a"), wire("r:b", "c:a"), wire("c:b", "v:b")], { duration: tau, step });
  assert.equal(result.ok, true, result.message);
  return { result, expected: voltage * (1 - Math.exp(-1)) };
}

function runRL(step) {
  const voltage = 12, resistance = 100, inductance = 1;
  const tau = inductance / resistance;
  const components = [
    { id: "v", type: "battery", voltage },
    { id: "r", type: "resistor", resistance },
    { id: "l", type: "inductor", inductance, initialCurrent: 0 }
  ];
  const result = simulateTransient(components, [wire("v:a", "r:a"), wire("r:b", "l:a"), wire("l:b", "v:b")], { duration: tau, step });
  assert.equal(result.ok, true, result.message);
  return { result, expected: voltage / resistance * (1 - Math.exp(-1)) };
}

test("RC endpoint error decreases monotonically under systematic time-step refinement", () => {
  const steps = [0.02, 0.01, 0.005, 0.0025];
  const errors = steps.map(step => {
    const { result, expected } = runRC(step);
    const actual = result.samples.at(-1).components.c.signedVoltage;
    assert.ok(result.samples.every(sample => Number.isFinite(sample.components.c.signedVoltage)));
    return Math.abs(actual - expected);
  });
  for (let i = 1; i < errors.length; i++) {
    assert.ok(errors[i] < errors[i - 1], `RC error did not decrease: ${errors.join(", ")}`);
  }
  assert.ok(errors.at(-1) < 0.04, `finest RC endpoint error too large: ${errors.at(-1)}`);
});

test("RL endpoint error decreases monotonically under systematic time-step refinement", () => {
  const steps = [0.002, 0.001, 0.0005, 0.00025, 0.000125];
  const errors = steps.map(step => {
    const { result, expected } = runRL(step);
    const actual = result.samples.at(-1).components.l.signedCurrent;
    assert.ok(result.samples.every(sample => Number.isFinite(sample.components.l.signedCurrent)));
    return Math.abs(actual - expected);
  });
  for (let i = 1; i < errors.length; i++) {
    assert.ok(errors[i] < errors[i - 1], `RL error did not decrease: ${errors.join(", ")}`);
  }
  assert.ok(errors.at(-1) < 0.0003, `finest RL endpoint error too large: ${errors.at(-1)}`);
});

test("inductor-current path diagnostic does not reject a valid alternate resistor return path", () => {
  const components = [
    { id: "v", type: "battery", voltage: 9 },
    { id: "s", type: "switch", closed: false },
    { id: "r1", type: "resistor", resistance: 100 },
    { id: "r2", type: "resistor", resistance: 220 },
    { id: "l", type: "inductor", inductance: 0.1, initialCurrent: 0.2 }
  ];
  const wires = [
    wire("v:a", "s:a"), wire("s:b", "r1:a"), wire("r1:b", "l:a"),
    wire("v:a", "r2:a"), wire("r2:b", "l:a"), wire("l:b", "v:b")
  ];
  const result = simulateTransient(components, wires, { duration: 0.002, step: 0.0001 });
  assert.equal(result.ok, true, `valid bypass path was rejected: ${result.reason} ${result.message}`);
  assert.ok(result.samples.length > 1);
  assert.ok(result.samples.slice(1).every(sample => Number.isFinite(sample.components.l.signedCurrent)));
});
