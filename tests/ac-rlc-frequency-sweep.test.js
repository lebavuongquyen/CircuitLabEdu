import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

test("AC series RLC frequency sweep matches independent phasor voltage and current references", () => {
  const amplitude = 9;
  const phaseDegrees = 23;
  const phase = phaseDegrees * Math.PI / 180;
  const frequencies = [10, 50, 200, 1000];
  const resistances = [10, 100];
  const inductances = [0.01, 0.05];
  const capacitances = [0.00001, 0.0001];
  let cases = 0;

  for (const frequency of frequencies) {
    const omega = 2 * Math.PI * frequency;
    for (const resistance of resistances) {
      for (const inductance of inductances) {
        for (const capacitance of capacitances) {
          const reactance = omega * inductance - 1 / (omega * capacitance);
          const impedance = Math.hypot(resistance, reactance);
          const currentAmplitude = amplitude / impedance;
          const currentPhaseLag = Math.atan2(reactance, resistance);
          const step = 1 / (frequency * 1000);
          const duration = Math.max(12 / frequency, 12 * inductance / resistance, 12 * resistance * capacitance);
          const components = [
            { id: "ac", type: "acSource", amplitude, frequency, phase: phaseDegrees, offset: 0 },
            { id: "r", type: "resistor", resistance },
            { id: "l", type: "inductor", inductance, initialCurrent: 0 },
            { id: "c", type: "capacitor", capacitance, initialVoltage: 0 }
          ];
          const wires = [
            wire("ac:a", "r:a"),
            wire("r:b", "l:a"),
            wire("l:b", "c:a"),
            wire("c:b", "ac:b")
          ];
          const result = simulateTransient(components, wires, { duration, step });
          const label = `f=${frequency}Hz, R=${resistance}ohm, L=${inductance}H, C=${capacitance}F`;
          assert.equal(result.ok, true, `${label}: ${result.message}`);

          const tailStart = duration - 2 / frequency;
          const tail = result.samples.filter(sample => sample.time >= tailStart);
          assert.ok(tail.length >= 399, `${label}: insufficient samples in steady-state window`);
          let maxCurrentError = 0;
          let sumSquaredCurrentError = 0;
          let maxResistorVoltageError = 0;
          let maxInductorVoltageError = 0;
          let maxCapacitorVoltageError = 0;
          let maxKvlResidual = 0;
          for (const sample of tail) {
            const angle = omega * sample.time + phase - currentPhaseLag;
            const expectedCurrent = currentAmplitude * Math.sin(angle);
            const expectedResistorVoltage = resistance * expectedCurrent;
            const expectedInductorVoltage = omega * inductance * currentAmplitude * Math.sin(angle + Math.PI / 2);
            const expectedCapacitorVoltage = currentAmplitude / (omega * capacitance) * Math.sin(angle - Math.PI / 2);
            const current = sample.components.r.signedCurrent;
            const currentError = Math.abs(current - expectedCurrent) / Math.max(1e-12, currentAmplitude);
            maxCurrentError = Math.max(maxCurrentError, currentError);
            sumSquaredCurrentError += currentError * currentError;
            maxResistorVoltageError = Math.max(maxResistorVoltageError, Math.abs(sample.components.r.signedVoltage - expectedResistorVoltage) / Math.max(1e-12, resistance * currentAmplitude));
            maxInductorVoltageError = Math.max(maxInductorVoltageError, Math.abs(sample.components.l.signedVoltage - expectedInductorVoltage) / Math.max(1e-12, omega * inductance * currentAmplitude));
            maxCapacitorVoltageError = Math.max(maxCapacitorVoltageError, Math.abs(sample.components.c.signedVoltage - expectedCapacitorVoltage) / Math.max(1e-12, currentAmplitude / (omega * capacitance)));
            const loadVoltage = sample.components.r.signedVoltage + sample.components.l.signedVoltage + sample.components.c.signedVoltage;
            const sourceVoltage = amplitude * Math.sin(omega * sample.time + phase);
            maxKvlResidual = Math.max(maxKvlResidual, Math.abs(loadVoltage - sourceVoltage));
            assert.ok(Number.isFinite(current) && Number.isFinite(sample.components.l.signedVoltage) && Number.isFinite(sample.components.c.signedVoltage), `${label}: non-finite reading at t=${sample.time}`);
            assert.ok(Math.abs(current - sample.components.l.signedCurrent) < 1e-7, `${label}: resistor/inductor current mismatch at t=${sample.time}`);
            assert.ok(Math.abs(current - sample.components.c.signedCurrent) < 1e-7, `${label}: resistor/capacitor current mismatch at t=${sample.time}`);
          }

          const rmsCurrentError = Math.sqrt(sumSquaredCurrentError / tail.length);
          assert.ok(maxCurrentError <= 0.035, `${label}: max current error ${(maxCurrentError * 100).toFixed(3)}% exceeds 3.5%`);
          assert.ok(rmsCurrentError <= 0.02, `${label}: RMS current error ${(rmsCurrentError * 100).toFixed(3)}% exceeds 2%`);
          assert.ok(maxResistorVoltageError <= 0.035, `${label}: resistor voltage error ${(maxResistorVoltageError * 100).toFixed(3)}% exceeds 3.5%`);
          assert.ok(maxInductorVoltageError <= 0.035, `${label}: inductor voltage error ${(maxInductorVoltageError * 100).toFixed(3)}% exceeds 3.5%`);
          assert.ok(maxCapacitorVoltageError <= 0.035, `${label}: capacitor voltage error ${(maxCapacitorVoltageError * 100).toFixed(3)}% exceeds 3.5%`);
          assert.ok(maxKvlResidual <= 1e-7, `${label}: KVL residual ${maxKvlResidual} V exceeds tolerance`);
          cases++;
        }
      }
    }
  }
  assert.equal(cases, 32);
});

test("series RLC exact-resonance waveforms match independent resonance limits", () => {
  const amplitude = 9;
  const phaseDegrees = 23;
  const phase = phaseDegrees * Math.PI / 180;
  let cases = 0;

  for (const resistance of [10, 100]) {
    for (const inductance of [0.01, 0.05]) {
      for (const capacitance of [0.00001, 0.0001]) {
        const omega = 1 / Math.sqrt(inductance * capacitance);
        const frequency = omega / (2 * Math.PI);
        const currentAmplitude = amplitude / resistance;
        const step = 1 / (frequency * 3000);
        const duration = Math.max(20 / frequency, 12 * inductance / resistance, 12 * resistance * capacitance);
        const components = [
          { id: "ac", type: "acSource", amplitude, frequency, phase: phaseDegrees, offset: 0 },
          { id: "r", type: "resistor", resistance },
          { id: "l", type: "inductor", inductance, initialCurrent: 0 },
          { id: "c", type: "capacitor", capacitance, initialVoltage: 0 }
        ];
        const wires = [
          wire("ac:a", "r:a"),
          wire("r:b", "l:a"),
          wire("l:b", "c:a"),
          wire("c:b", "ac:b")
        ];
        const result = simulateTransient(components, wires, { duration, step });
        const label = `resonance f=${frequency.toFixed(3)}Hz, R=${resistance}ohm, L=${inductance}H, C=${capacitance}F`;
        assert.equal(result.ok, true, `${label}: ${result.message}`);
        const tail = result.samples.filter(sample => sample.time >= duration - 2 / frequency);
        assert.ok(tail.length >= 1999, `${label}: insufficient steady-state samples`);

        let maxCurrentError = 0;
        let maxResistorVoltageError = 0;
        let maxInductorVoltageError = 0;
        let maxCapacitorVoltageError = 0;
        let maxResonantVoltageBalance = 0;
        let maxKvlResidual = 0;
        for (const sample of tail) {
          const angle = omega * sample.time + phase;
          const expectedCurrent = currentAmplitude * Math.sin(angle);
          const expectedResistorVoltage = amplitude * Math.sin(angle);
          const expectedInductorVoltage = omega * inductance * currentAmplitude * Math.sin(angle + Math.PI / 2);
          const expectedCapacitorVoltage = currentAmplitude / (omega * capacitance) * Math.sin(angle - Math.PI / 2);
          const actualCurrent = sample.components.r.signedCurrent;
          maxCurrentError = Math.max(maxCurrentError, Math.abs(actualCurrent - expectedCurrent) / currentAmplitude);
          maxResistorVoltageError = Math.max(maxResistorVoltageError, Math.abs(sample.components.r.signedVoltage - expectedResistorVoltage) / amplitude);
          maxInductorVoltageError = Math.max(maxInductorVoltageError, Math.abs(sample.components.l.signedVoltage - expectedInductorVoltage) / Math.max(1e-12, omega * inductance * currentAmplitude));
          maxCapacitorVoltageError = Math.max(maxCapacitorVoltageError, Math.abs(sample.components.c.signedVoltage - expectedCapacitorVoltage) / Math.max(1e-12, currentAmplitude / (omega * capacitance)));
          maxResonantVoltageBalance = Math.max(maxResonantVoltageBalance, Math.abs(sample.components.l.signedVoltage + sample.components.c.signedVoltage) / Math.max(1e-12, amplitude * omega * inductance / resistance));
          maxKvlResidual = Math.max(maxKvlResidual, Math.abs(sample.components.r.signedVoltage + sample.components.l.signedVoltage + sample.components.c.signedVoltage - sample.components.ac.signedVoltage));
          assert.ok(Math.abs(actualCurrent - sample.components.l.signedCurrent) < 1e-7, `${label}: inductor current mismatch at t=${sample.time}`);
          assert.ok(Math.abs(actualCurrent - sample.components.c.signedCurrent) < 1e-7, `${label}: capacitor current mismatch at t=${sample.time}`);
        }
        assert.ok(maxCurrentError <= 0.025, `${label}: max current error ${(maxCurrentError * 100).toFixed(3)}% exceeds 2.5%`);
        assert.ok(maxResistorVoltageError <= 0.025, `${label}: resistor voltage error ${(maxResistorVoltageError * 100).toFixed(3)}% exceeds 2.5%`);
        assert.ok(maxInductorVoltageError <= 0.035, `${label}: inductor voltage error ${(maxInductorVoltageError * 100).toFixed(3)}% exceeds 3.5%`);
        assert.ok(maxCapacitorVoltageError <= 0.035, `${label}: capacitor voltage error ${(maxCapacitorVoltageError * 100).toFixed(3)}% exceeds 3.5%`);
        assert.ok(maxResonantVoltageBalance <= 0.035, `${label}: inductor/capacitor voltage cancellation error ${(maxResonantVoltageBalance * 100).toFixed(3)}% exceeds 3.5%`);
        assert.ok(maxKvlResidual <= 1e-7, `${label}: KVL residual ${maxKvlResidual} V exceeds tolerance`);
        cases++;
      }
    }
  }
  assert.equal(cases, 8);
});
