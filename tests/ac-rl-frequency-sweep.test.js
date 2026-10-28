import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

test("AC RL frequency sweep matches independent phasor amplitude and phase references", () => {
  const amplitude = 9;
  const frequencies = [10, 50, 200, 1000];
  const resistances = [10, 100];
  const inductances = [0.01, 0.1];
  let cases = 0;

  for (const frequency of frequencies) {
    const omega = 2 * Math.PI * frequency;
    const step = 1 / (frequency * 200);
    const duration = Math.max(0.5, 20 / frequency);
    for (const resistance of resistances) {
      for (const inductance of inductances) {
        const components = [
          { id: "ac", type: "acSource", amplitude, frequency, phase: 23, offset: 0 },
          { id: "r", type: "resistor", resistance },
          { id: "l", type: "inductor", inductance, initialCurrent: 0 }
        ];
        const wires = [
          wire("ac:a", "r:a"),
          wire("r:b", "l:a"),
          wire("l:b", "ac:b")
        ];
        const result = simulateTransient(components, wires, { duration, step });
        const label = `f=${frequency}Hz, R=${resistance}ohm, L=${inductance}H`;
        assert.equal(result.ok, true, `${label}: ${result.message}`);

        const reactance = omega * inductance;
        const impedance = Math.hypot(resistance, reactance);
        const expectedAmplitude = amplitude / impedance;
        const sourcePhase = 23 * Math.PI / 180;
        const currentPhase = Math.atan2(reactance, resistance);
        const tailStart = duration - 2 / frequency;
        const tail = result.samples.filter(sample => sample.time >= tailStart);
        assert.ok(tail.length >= 399, `${label}: insufficient samples in steady-state window`);

        let maxNormalizedCurrentError = 0;
        let sumSquaredNormalizedCurrentError = 0;
        let maxNormalizedInductorVoltageError = 0;
        for (const sample of tail) {
          const expectedCurrent = expectedAmplitude * Math.sin(omega * sample.time + sourcePhase - currentPhase);
          const expectedInductorVoltage = expectedAmplitude * reactance * Math.sin(omega * sample.time + sourcePhase - currentPhase + Math.PI / 2);
          const current = sample.components.r.signedCurrent;
          const inductorCurrent = sample.components.l.signedCurrent;
          const inductorVoltage = sample.components.l.signedVoltage;
          assert.ok(Number.isFinite(current) && Number.isFinite(inductorVoltage), `${label}: non-finite waveform at t=${sample.time}`);
          const normalizedCurrentError = Math.abs(current - expectedCurrent) / expectedAmplitude;
          maxNormalizedCurrentError = Math.max(maxNormalizedCurrentError, normalizedCurrentError);
          sumSquaredNormalizedCurrentError += normalizedCurrentError * normalizedCurrentError;
          maxNormalizedInductorVoltageError = Math.max(maxNormalizedInductorVoltageError, Math.abs(inductorVoltage - expectedInductorVoltage) / Math.max(1e-12, expectedAmplitude * reactance));
          assert.ok(Math.abs(current - inductorCurrent) < 1e-7, `${label}: resistor/inductor current mismatch at t=${sample.time}`);
          assert.ok(Math.abs(sample.components.r.signedVoltage + inductorVoltage - sample.components.ac.signedVoltage) < 1e-7, `${label}: KVL residual at t=${sample.time}`);
        }

        const rmsNormalizedCurrentError = Math.sqrt(sumSquaredNormalizedCurrentError / tail.length);
        assert.ok(maxNormalizedCurrentError <= 0.025, `${label}: max current error ${(maxNormalizedCurrentError * 100).toFixed(3)}% exceeds 2.5%`);
        assert.ok(rmsNormalizedCurrentError <= 0.015, `${label}: RMS current error ${(rmsNormalizedCurrentError * 100).toFixed(3)}% exceeds 1.5%`);
        assert.ok(maxNormalizedInductorVoltageError <= 0.03, `${label}: max inductor-voltage error ${(maxNormalizedInductorVoltageError * 100).toFixed(3)}% exceeds 3%`);
        cases++;
      }
    }
  }
  assert.equal(cases, 16);
});
