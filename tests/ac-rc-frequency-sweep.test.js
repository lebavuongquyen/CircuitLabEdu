import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

test("AC RC frequency sweep matches independent capacitor-voltage and current phasor references", () => {
  const amplitude = 9;
  const phaseDegrees = 31;
  const phase = phaseDegrees * Math.PI / 180;
  const frequencies = [10, 50, 200, 1000];
  const resistances = [10, 100];
  const capacitances = [0.00001, 0.0001, 0.001];
  let cases = 0;

  for (const frequency of frequencies) {
    const omega = 2 * Math.PI * frequency;
    for (const resistance of resistances) {
      for (const capacitance of capacitances) {
        const tau = resistance * capacitance;
        const step = 1 / (frequency * 200);
        const duration = Math.max(12 / frequency, 8 * tau);
        const components = [
          { id: "ac", type: "acSource", amplitude, frequency, phase: phaseDegrees, offset: 0 },
          { id: "r", type: "resistor", resistance },
          { id: "c", type: "capacitor", capacitance, initialVoltage: 0 }
        ];
        const wires = [
          wire("ac:a", "r:a"),
          wire("r:b", "c:a"),
          wire("c:b", "ac:b")
        ];
        const result = simulateTransient(components, wires, { duration, step });
        const label = `f=${frequency}Hz, R=${resistance}ohm, C=${capacitance}F`;
        assert.equal(result.ok, true, `${label}: ${result.message}`);

        const attenuation = 1 / Math.hypot(1, omega * tau);
        const expectedCapVoltageAmplitude = amplitude * attenuation;
        const capPhaseLag = Math.atan(omega * tau);
        const currentAmplitude = amplitude / resistance * (omega * tau) * attenuation;
        const currentPhaseLead = Math.atan(1 / (omega * tau));
        const tailStart = duration - 2 / frequency;
        const tail = result.samples.filter(sample => sample.time >= tailStart);
        assert.ok(tail.length >= 399, `${label}: insufficient samples in steady-state window`);

        let maxNormalizedCapVoltageError = 0;
        let sumSquaredCapVoltageError = 0;
        let maxNormalizedCurrentError = 0;
        let sumSquaredCurrentError = 0;
        let maxKvlResidual = 0;
        for (const sample of tail) {
          const angle = omega * sample.time + phase;
          const expectedCapVoltage = expectedCapVoltageAmplitude * Math.sin(angle - capPhaseLag);
          const expectedCurrent = currentAmplitude * Math.sin(angle + currentPhaseLead);
          const capVoltage = sample.components.c.signedVoltage;
          const current = sample.components.r.signedCurrent;
          const capCurrent = sample.components.c.signedCurrent;
          assert.ok(Number.isFinite(capVoltage) && Number.isFinite(current), `${label}: non-finite reading at t=${sample.time}`);
          const capError = Math.abs(capVoltage - expectedCapVoltage) / Math.max(1e-12, expectedCapVoltageAmplitude);
          const currentError = Math.abs(current - expectedCurrent) / Math.max(1e-12, currentAmplitude);
          maxNormalizedCapVoltageError = Math.max(maxNormalizedCapVoltageError, capError);
          sumSquaredCapVoltageError += capError * capError;
          maxNormalizedCurrentError = Math.max(maxNormalizedCurrentError, currentError);
          sumSquaredCurrentError += currentError * currentError;
          maxKvlResidual = Math.max(maxKvlResidual, Math.abs(sample.components.r.signedVoltage + capVoltage - sample.components.ac.signedVoltage));
          assert.ok(Math.abs(current - capCurrent) < 1e-7, `${label}: resistor/capacitor current mismatch at t=${sample.time}`);
        }

        const rmsCapVoltageError = Math.sqrt(sumSquaredCapVoltageError / tail.length);
        const rmsCurrentError = Math.sqrt(sumSquaredCurrentError / tail.length);
        assert.ok(maxNormalizedCapVoltageError <= 0.025, `${label}: max capacitor-voltage error ${(maxNormalizedCapVoltageError * 100).toFixed(3)}% exceeds 2.5%`);
        assert.ok(rmsCapVoltageError <= 0.015, `${label}: RMS capacitor-voltage error ${(rmsCapVoltageError * 100).toFixed(3)}% exceeds 1.5%`);
        assert.ok(maxNormalizedCurrentError <= 0.025, `${label}: max current error ${(maxNormalizedCurrentError * 100).toFixed(3)}% exceeds 2.5%`);
        assert.ok(rmsCurrentError <= 0.015, `${label}: RMS current error ${(rmsCurrentError * 100).toFixed(3)}% exceeds 1.5%`);
        assert.ok(maxKvlResidual <= 1e-7, `${label}: KVL residual ${maxKvlResidual} V exceeds tolerance`);
        cases++;
      }
    }
  }
  assert.equal(cases, 24);
});
