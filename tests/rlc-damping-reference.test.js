import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

function seriesRlc(resistance, inductance, capacitance, voltage = 9) {
  return {
    components: [
      { id: "v", type: "battery", voltage },
      { id: "r", type: "resistor", resistance },
      { id: "c", type: "capacitor", capacitance, initialVoltage: 0 },
      { id: "l", type: "inductor", inductance, initialCurrent: 0 }
    ],
    wires: [
      wire("v:a", "r:a"),
      wire("r:b", "c:a"),
      wire("c:b", "l:a"),
      wire("l:b", "v:b")
    ]
  };
}

function analyticalStepCurrent({ resistance, inductance, capacitance, voltage, time }) {
  const alpha = resistance / (2 * inductance);
  const omega0Squared = 1 / (inductance * capacitance);
  const discriminant = alpha * alpha - omega0Squared;
  if (Math.abs(discriminant) <= omega0Squared * 1e-12) {
    return voltage / inductance * time * Math.exp(-alpha * time);
  }
  const beta = Math.sqrt(Math.abs(discriminant));
  if (discriminant < 0) {
    return voltage / (inductance * beta) * Math.exp(-alpha * time) * Math.sin(beta * time);
  }
  const root1 = -alpha + beta;
  const root2 = -alpha - beta;
  return voltage / (inductance * (root1 - root2)) * (Math.exp(root1 * time) - Math.exp(root2 * time));
}

test("critical and overdamped series RLC responses match independent closed-form references", () => {
  const inductance = 0.1;
  const capacitance = 0.001;
  const voltage = 9;
  const cases = [
    { resistance: 20, time: 0.005, kind: "critical" },
    { resistance: 30, time: 0.005, kind: "overdamped" },
    { resistance: 50, time: 0.005, kind: "overdamped" }
  ];

  for (const item of cases) {
    const params = { ...item, inductance, capacitance, voltage };
    const { components, wires } = seriesRlc(item.resistance, inductance, capacitance, voltage);
    const coarse = simulateTransient(components, wires, { duration: item.time, step: 0.00002 });
    const fine = simulateTransient(components, wires, { duration: item.time, step: 0.000002 });
    const label = `${item.kind}: R=${item.resistance}, L=${inductance}, C=${capacitance}`;
    assert.equal(coarse.ok, true, `${label}: coarse run failed: ${coarse.message}`);
    assert.equal(fine.ok, true, `${label}: fine run failed: ${fine.message}`);

    const expected = analyticalStepCurrent(params);
    const coarseCurrent = coarse.samples.at(-1).components.l.signedCurrent;
    const fineCurrent = fine.samples.at(-1).components.l.signedCurrent;
    const coarseError = Math.abs(coarseCurrent - expected);
    const fineError = Math.abs(fineCurrent - expected);
    assert.ok(fineError < coarseError, `${label}: time-step refinement did not reduce analytical error; coarse=${coarseError}, fine=${fineError}`);
    assert.ok(fineError <= Math.max(2e-5, Math.abs(expected) * 0.002), `${label}: fine error ${fineError} exceeds tolerance for expected ${expected}`);

    for (const sample of fine.samples) {
      const current = sample.components.l.signedCurrent;
      assert.ok(Number.isFinite(current), `${label}: non-finite inductor current at t=${sample.time}`);
      assert.ok(Math.abs(current - sample.components.r.signedCurrent) < 1e-7, `${label}: series current mismatch at t=${sample.time}`);
      assert.ok(Math.abs(current - sample.components.c.signedCurrent) < 1e-7, `${label}: capacitor current mismatch at t=${sample.time}`);
    }
  }
});
