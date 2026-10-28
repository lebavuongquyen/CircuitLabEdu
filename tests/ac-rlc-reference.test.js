import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

function seriesCircuit(resistance, inductance, capacitance) {
  const components = [
    { id: "ac", type: "acSource", amplitude: 9, frequency: 50, phase: 17, offset: 0 },
    { id: "r", type: "resistor", resistance },
    { id: "l", type: "inductor", inductance, initialCurrent: 0 }
  ];
  const wires = [wire("ac:a", "r:a"), wire("r:b", "l:a")];
  if (capacitance !== null) {
    components.push({ id: "c", type: "capacitor", capacitance, initialVoltage: 0 });
    wires.push(wire("l:b", "c:a"), wire("c:b", "ac:b"));
  } else {
    wires.push(wire("l:b", "ac:b"));
  }
  return { components, wires };
}

test("AC RL and RLC steady-state waveforms match independent phasor references", () => {
  const amplitude = 9;
  const frequency = 50;
  const phase = 17 * Math.PI / 180;
  const omega = 2 * Math.PI * frequency;
  const step = 0.00001;
  const duration = 0.2;
  const cases = [];
  for (const resistance of [10, 47, 100]) {
    for (const inductance of [0.01, 0.05, 0.1]) {
      cases.push({ resistance, inductance, capacitance: null });
      for (const capacitance of [0.00001, 0.0001, 0.001]) {
        cases.push({ resistance, inductance, capacitance });
      }
    }
  }

  for (const item of cases) {
    const { resistance, inductance, capacitance } = item;
    const { components, wires } = seriesCircuit(resistance, inductance, capacitance);
    const result = simulateTransient(components, wires, { duration, step });
    const label = `R=${resistance}, L=${inductance}, C=${capacitance}`;
    assert.equal(result.ok, true, `${label}: ${result.message}`);
    const reactance = omega * inductance - (capacitance === null ? 0 : 1 / (omega * capacitance));
    const impedance = Math.hypot(resistance, reactance);
    const currentAmplitude = amplitude / impedance;
    const currentPhase = Math.atan2(reactance, resistance);
    const tail = result.samples.filter(sample => sample.time >= duration - 0.04);
    assert.ok(tail.length >= 3999, `${label}: insufficient steady-state samples`);
    let maximumNormalizedError = 0;
    let squaredNormalizedError = 0;
    let maximumKvlResidual = 0;
    for (const sample of tail) {
      const expectedCurrent = currentAmplitude * Math.sin(omega * sample.time + phase - currentPhase);
      const actualCurrent = sample.components.r.signedCurrent;
      const normalizedError = Math.abs(actualCurrent - expectedCurrent) / currentAmplitude;
      maximumNormalizedError = Math.max(maximumNormalizedError, normalizedError);
      squaredNormalizedError += normalizedError * normalizedError;
      const loadVoltage = sample.components.r.signedVoltage + sample.components.l.signedVoltage + (capacitance === null ? 0 : sample.components.c.signedVoltage);
      const sourceVoltage = amplitude * Math.sin(omega * sample.time + phase);
      maximumKvlResidual = Math.max(maximumKvlResidual, Math.abs(loadVoltage - sourceVoltage));
      assert.ok(Number.isFinite(actualCurrent), `${label}: non-finite current at t=${sample.time}`);
      assert.ok(Math.abs(actualCurrent - sample.components.l.signedCurrent) < 1e-7, `${label}: series current mismatch at t=${sample.time}`);
      if (capacitance !== null) {
        assert.ok(Math.abs(actualCurrent - sample.components.c.signedCurrent) < 1e-7, `${label}: capacitor current mismatch at t=${sample.time}`);
      }
    }
    const normalizedRmsError = Math.sqrt(squaredNormalizedError / tail.length);
    assert.ok(maximumNormalizedError <= 0.012, `${label}: max waveform error ${(maximumNormalizedError * 100).toFixed(3)}% exceeds 1.2%`);
    assert.ok(normalizedRmsError <= 0.008, `${label}: RMS waveform error ${(normalizedRmsError * 100).toFixed(3)}% exceeds 0.8%`);
    assert.ok(maximumKvlResidual <= 1e-7, `${label}: KVL residual ${maximumKvlResidual} V exceeds tolerance`);
  }
  assert.equal(cases.length, 36);
});
