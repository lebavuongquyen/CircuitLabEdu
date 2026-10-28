import test from "node:test";
import assert from "node:assert/strict";
import { solveCircuit } from "../solver.js";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });
const closeTo = (actual, expected, tolerance, label) => {
  assert.ok(Number.isFinite(actual), `${label}: expected a finite value, got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}, error ${Math.abs(actual - expected)}`);
};
const dcLoop = (voltage, resistance) => {
  const components = [
    { id: "b", type: "battery", voltage },
    { id: "r", type: "resistor", resistance }
  ];
  const wires = [wire("b:a", "r:a"), wire("r:b", "b:b")];
  return { components, wires };
};
const rcLoop = (voltage, resistance, capacitance) => ({
  components: [
    { id: "b", type: "battery", voltage },
    { id: "r", type: "resistor", resistance },
    { id: "c", type: "capacitor", capacitance, initialVoltage: 0 }
  ],
  wires: [wire("b:a", "r:a"), wire("r:b", "c:a"), wire("c:b", "b:b")]
});
const rlLoop = (voltage, resistance, inductance) => ({
  components: [
    { id: "b", type: "battery", voltage },
    { id: "r", type: "resistor", resistance },
    { id: "l", type: "inductor", inductance, initialCurrent: 0 }
  ],
  wires: [wire("b:a", "r:a"), wire("r:b", "l:a"), wire("l:b", "b:b")]
});

test("accuracy matrix: 400 DC series circuits satisfy Ohm's law and power conservation", () => {
  const voltages = [0.1, 0.25, 0.5, 1, 1.5, 2, 3, 4.5, 5, 6, 9, 12, 15, 18, 24, 36, 48, 60, 75, 100];
  const resistances = [0.1, 0.22, 0.47, 1, 2.2, 4.7, 10, 22, 47, 100, 220, 470, 1000, 2200, 4700, 10000, 22000, 47000, 100000, 1000000];
  let cases = 0;
  for (const voltage of voltages) for (const resistance of resistances) {
    const { components, wires } = dcLoop(voltage, resistance);
    const result = solveCircuit(components, wires);
    const label = `V=${voltage}, R=${resistance}`;
    assert.equal(result.ok, true, label + ": solver rejected valid loop");
    closeTo(result.readings.current, voltage / resistance, Math.max(1e-8, voltage / resistance * 1e-6), label + " current");
    closeTo(result.readings.voltage, voltage, Math.max(1e-7, voltage * 1e-6), label + " voltage");
    closeTo(result.readings.power, voltage * voltage / resistance, Math.max(1e-8, voltage * voltage / resistance * 1e-6), label + " load power");
    closeTo(result.readings.sourcePower, result.readings.power, Math.max(1e-8, result.readings.power * 1e-6), label + " power balance");
    cases++;
  }
  assert.equal(cases, 400);
});

test("accuracy matrix: 225 parallel-resistor networks match conductance addition", () => {
  const voltages = [1, 3, 5, 9, 12, 24, 48, 100, 230, 400, 1000, 0.5, 2, 6, 15];
  const resistances = [0.5, 1, 2, 3, 4.7, 6, 10, 15, 22, 47, 100, 220, 470, 1000, 10000];
  let cases = 0;
  for (const voltage of voltages) for (let i = 0; i < resistances.length; i++) {
    const r1 = resistances[i];
    const r2 = resistances[(i * 7 + cases) % resistances.length];
    const components = [
      { id: "b", type: "battery", voltage },
      { id: "r1", type: "resistor", resistance: r1 },
      { id: "r2", type: "resistor", resistance: r2 }
    ];
    const wires = [
      wire("b:a", "r1:a"), wire("b:a", "r2:a"),
      wire("r1:b", "b:b"), wire("r2:b", "b:b")
    ];
    const result = solveCircuit(components, wires);
    const expectedCurrent = voltage / r1 + voltage / r2;
    const expectedPower = voltage * voltage / r1 + voltage * voltage / r2;
    const label = `V=${voltage}, R1=${r1}, R2=${r2}`;
    assert.equal(result.ok, true, label + ": solver rejected valid parallel network");
    closeTo(result.readings.current, expectedCurrent, Math.max(1e-7, expectedCurrent * 2e-6), label + " total current");
    closeTo(result.readings.power, expectedPower, Math.max(1e-7, expectedPower * 2e-6), label + " total power");
    closeTo(result.readings.sourcePower, expectedPower, Math.max(1e-7, expectedPower * 2e-6), label + " source power");
    closeTo(result.readings.components.r1.current, voltage / r1, Math.max(1e-7, voltage / r1 * 2e-6), label + " branch 1 current");
    closeTo(result.readings.components.r2.current, voltage / r2, Math.max(1e-7, voltage / r2 * 2e-6), label + " branch 2 current");
    cases++;
  }
  assert.equal(cases, 225);
});

test("accuracy matrix: 100 RC transients approach the analytical capacitor voltage", () => {
  const voltages = [1, 3, 5, 9, 12, 24, 48, 100, 0.5, 2];
  const timeConstants = [0.0001, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2];
  let cases = 0;
  for (const voltage of voltages) for (const tau of timeConstants) {
    const resistance = 1000;
    const capacitance = tau / resistance;
    const step = tau / 100;
    const duration = 5 * tau;
    const { components, wires } = rcLoop(voltage, resistance, capacitance);
    const result = simulateTransient(components, wires, { duration, step });
    const label = `V=${voltage}, tau=${tau}`;
    assert.equal(result.ok, true, label + ": transient simulation failed");
    assert.equal(result.samples.length, 501, label + ": unexpected sample count");
    closeTo(result.samples.at(-1).time, duration, Math.max(1e-12, duration * 1e-12), label + " final sample time");
    const values = result.samples.map(sample => sample.components.c.signedVoltage);
    assert.ok(values.every(Number.isFinite), label + ": non-finite capacitor voltage");
    assert.ok(values.every((value, i) => i === 0 || value >= values[i - 1] - 1e-9), label + ": capacitor voltage should rise monotonically");
    const expected = voltage * (1 - Math.exp(-duration / tau));
    closeTo(values.at(-1), expected, Math.max(voltage * 0.006, 1e-7), label + " analytical endpoint");
    assert.ok(values.at(-1) <= voltage + Math.max(1e-7, voltage * 1e-6), label + ": capacitor overshot the DC source");
    cases++;
  }
  assert.equal(cases, 100);
});

test("accuracy matrix: 100 RL transients approach the analytical inductor current", () => {
  const voltages = [1, 3, 5, 9, 12, 24, 48, 100, 0.5, 2];
  const timeConstants = [0.0001, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2];
  let cases = 0;
  for (const voltage of voltages) for (const tau of timeConstants) {
    const resistance = 1000;
    const inductance = tau * resistance;
    const step = tau / 100;
    const duration = 5 * tau;
    const { components, wires } = rlLoop(voltage, resistance, inductance);
    const result = simulateTransient(components, wires, { duration, step });
    const label = `V=${voltage}, tau=${tau}`;
    assert.equal(result.ok, true, label + ": transient simulation failed");
    assert.equal(result.samples.length, 501, label + ": unexpected sample count");
    closeTo(result.samples.at(-1).time, duration, Math.max(1e-12, duration * 1e-12), label + " final sample time");
    const values = result.samples.map(sample => sample.components.l.signedCurrent);
    assert.ok(values.every(Number.isFinite), label + ": non-finite inductor current");
    assert.ok(values.every((value, i) => i === 0 || value >= values[i - 1] - 1e-9), label + ": inductor current should rise monotonically");
    const expected = voltage / resistance * (1 - Math.exp(-duration / tau));
    closeTo(values.at(-1), expected, Math.max(voltage / resistance * 0.006, 1e-9), label + " analytical endpoint");
    assert.ok(values.at(-1) <= voltage / resistance + Math.max(1e-9, voltage / resistance * 1e-6), label + ": inductor current overshot steady state");
    cases++;
  }
  assert.equal(cases, 100);
});

test("accuracy matrix: underdamped series RLC current matches the analytical step response", () => {
  const voltage = 9;
  let cases = 0;
  for (const resistance of [2, 5, 10]) for (const inductance of [0.05, 0.1]) for (const capacitance of [0.0005, 0.001]) {
    const alpha = resistance / (2 * inductance);
    const omega0Squared = 1 / (inductance * capacitance);
    assert.ok(alpha * alpha < omega0Squared, "fixture must be underdamped");
    const omegaD = Math.sqrt(omega0Squared - alpha * alpha);
    const duration = 0.02;
    const expected = voltage / (inductance * omegaD) * Math.exp(-alpha * duration) * Math.sin(omegaD * duration);
    const components = [
      { id: "b", type: "battery", voltage },
      { id: "r", type: "resistor", resistance },
      { id: "c", type: "capacitor", capacitance, initialVoltage: 0 },
      { id: "l", type: "inductor", inductance, initialCurrent: 0 }
    ];
    const wires = [wire("b:a", "r:a"), wire("r:b", "c:a"), wire("c:b", "l:a"), wire("l:b", "b:b")];
    const coarse = simulateTransient(components, wires, { duration, step: 0.0001 });
    const fine = simulateTransient(components, wires, { duration, step: 0.000005 });
    const label = `R=${resistance}, L=${inductance}, C=${capacitance}`;
    assert.equal(coarse.ok, true, label + ": coarse simulation failed");
    assert.equal(fine.ok, true, label + ": fine simulation failed");
    const coarseCurrent = coarse.samples.at(-1).components.l.signedCurrent;
    const fineCurrent = fine.samples.at(-1).components.l.signedCurrent;
    const coarseError = Math.abs(coarseCurrent - expected);
    const fineError = Math.abs(fineCurrent - expected);
    assert.ok(fineError < coarseError, label + ": refining the time step did not reduce analytical error");
    closeTo(fineCurrent, expected, Math.max(1e-4, Math.abs(expected) * 0.01), label + " analytical RLC current");
    cases++;
  }
  assert.equal(cases, 12);
});

test("accuracy matrix: 126 switch combinations obey series-circuit continuity", () => {
  let cases = 0;
  for (let count = 1; count <= 6; count++) {
    for (let mask = 0; mask < 2 ** count; mask++) {
      const switches = Array.from({ length: count }, (_, i) => ({
        id: `s${i}`, type: "switch", closed: Boolean(mask & (1 << i))
      }));
      const components = [
        { id: "b", type: "battery", voltage: 12 },
        ...switches,
        { id: "r", type: "resistor", resistance: 24 }
      ];
      const wires = [];
      let cursor = "b:a";
      for (const s of switches) {
        wires.push(wire(cursor, s.id + ":a"));
        cursor = s.id + ":b";
      }
      wires.push(wire(cursor, "r:a"), wire("r:b", "b:b"));
      const result = solveCircuit(components, wires);
      const allClosed = switches.every(s => s.closed);
      const label = `switches=${count}, mask=${mask}`;
      assert.equal(result.ok, true, label + ": solver rejected a valid circuit");
      if (allClosed) {
        assert.equal(result.reason, "closed", label);
        closeTo(result.readings.current, 12 / (24 + count * 1e-3), 1e-6, label + " current");
      } else {
        assert.equal(result.reason, "open", label);
        assert.equal(result.readings.current, 0, label + " open circuit current");
      }
      cases++;
    }
  }
  assert.equal(cases, 126);
});

test("transient solver reaches the requested duration when the final step is shorter than the nominal step", () => {
  const components = [
    { id: "ac", type: "acSource", amplitude: 9, frequency: 50, phase: 0, offset: 0 },
    { id: "r", type: "resistor", resistance: 100 }
  ];
  const result = simulateTransient(components, [wire("ac:a", "r:a"), wire("r:b", "ac:b")], { duration: 0.001, step: 0.0003 });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.samples.length, 5);
  closeTo(result.samples.at(-1).time, 0.001, 1e-15, "final time");
  closeTo(result.samples.at(-1).components.r.signedVoltage, 9 * Math.sin(2 * Math.PI * 50 * 0.001), 1e-7, "final AC voltage");
});

test("AC-driven RC transient matches the analytical steady-state capacitor waveform", () => {
  const amplitude = 9, frequency = 50, resistance = 100, capacitance = 0.00001, duration = 0.1;
  const components = [
    { id: "ac", type: "acSource", amplitude, frequency, phase: 0, offset: 0 },
    { id: "r", type: "resistor", resistance },
    { id: "c", type: "capacitor", capacitance, initialVoltage: 0 }
  ];
  const result = simulateTransient(components, [wire("ac:a", "r:a"), wire("r:b", "c:a"), wire("c:b", "ac:b")], { duration, step: 0.00002 });
  assert.equal(result.ok, true, result.message);
  const omega = 2 * Math.PI * frequency;
  const expectedAmplitude = amplitude / Math.sqrt(1 + Math.pow(omega * resistance * capacitance, 2));
  const expectedPhase = Math.atan(omega * resistance * capacitance);
  const expectedVoltage = expectedAmplitude * Math.sin(omega * duration - expectedPhase);
  closeTo(result.samples.at(-1).components.c.signedVoltage, expectedVoltage, 0.01, "steady-state capacitor voltage");
  closeTo(result.samples.at(-1).components.r.signedCurrent, result.samples.at(-1).components.c.signedCurrent, 1e-8, "series RC current continuity");
  const finalSample = result.samples.at(-1);
  closeTo(finalSample.components.c.signedPower, finalSample.components.c.signedVoltage * finalSample.components.c.signedCurrent, 1e-12, "capacitor signed power follows passive sign convention");
  closeTo(finalSample.components.ac.signedPower, -finalSample.components.ac.signedVoltage * finalSample.components.ac.signedCurrent, 1e-12, "AC source signed power follows source sign convention");
  closeTo(finalSample.sourcePower, finalSample.components.ac.signedPower, 1e-10, "source power summary matches component power");
  assert.ok(finalSample.components.c.power >= 0);
  assert.ok(finalSample.components.ac.power >= 0);
  assert.equal(result.warnings.length, 0);
});

test("transient solver warns when the requested time step undersamples circuit dynamics", () => {
  const rc = rcLoop(9, 1000, 0.000001);
  const rcResult = simulateTransient(rc.components, rc.wires, { duration: 0.01, step: 0.001 });
  assert.equal(rcResult.ok, true);
  assert.ok(rcResult.warnings.includes("transientStepCoarse"));
  const acComponents = [
    { id: "ac", type: "acSource", amplitude: 9, frequency: 1000, phase: 0, offset: 0 },
    { id: "r", type: "resistor", resistance: 100 }
  ];
  const acResult = simulateTransient(acComponents, [wire("ac:a", "r:a"), wire("r:b", "ac:b")], { duration: 0.01, step: 0.001 });
  assert.equal(acResult.ok, true);
  assert.ok(acResult.warnings.includes("acSamplingCoarse"));
});

test("transient solver with multiple source branches exposes per-component values without a false aggregate trace", () => {
  const components = [
    { id: "b1", type: "battery", voltage: 12 },
    { id: "b2", type: "battery", voltage: 6 },
    { id: "r1", type: "resistor", resistance: 10 },
    { id: "r2", type: "resistor", resistance: 10 },
    { id: "load", type: "resistor", resistance: 10 },
    { id: "cap", type: "capacitor", capacitance: 0.000001, initialVoltage: 0 }
  ];
  const wires = [
    wire("b1:a", "r1:a"), wire("r1:b", "load:a"),
    wire("b2:a", "r2:a"), wire("r2:b", "load:a"),
    wire("load:a", "cap:a"), wire("cap:b", "b1:b"),
    wire("b1:b", "b2:b"), wire("load:b", "b1:b")
  ];
  const result = simulateTransient(components, wires, { duration: 0.01, step: 0.001 });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.mode, "rc");
  assert.equal(result.summaryValid, false);
  assert.ok(result.warnings.includes("multiSourceTransientSummaryUnavailable"));
  assert.equal(result.samples.at(-1).voltage, null);
  assert.equal(result.samples.at(-1).current, null);
  closeTo(result.samples.at(-1).components.load.signedVoltage, 6, 1e-7, "branched-source load voltage");
  closeTo(result.samples.at(-1).components.load.signedCurrent, 0.6, 1e-7, "branched-source load current");
});

test("transient solver refuses extreme resistance ratios that cannot satisfy KCL accurately", () => {
  const components = [
    { id: "ac", type: "acSource", amplitude: 9, frequency: 50, phase: 0, offset: 0 },
    { id: "low", type: "resistor", resistance: 1e-6 },
    { id: "high", type: "resistor", resistance: 1e9 }
  ];
  const wires = [
    wire("ac:a", "low:a"),
    wire("low:b", "high:a"),
    wire("high:b", "ac:b")
  ];
  const result = simulateTransient(components, wires, { duration: 0.001, step: 0.0001 });
  assert.equal(result.ok, false);
  assert.equal(result.samples.length, 0);
});

test("high-frequency AC RC accuracy improves with finer time steps and warns on undersampling", () => {
  const amplitude = 9;
  const frequency = 5000;
  const resistance = 100;
  const capacitance = 1e-7;
  const duration = 12 / frequency;
  const omega = 2 * Math.PI * frequency;
  const tau = resistance * capacitance;
  const expectedAmplitude = amplitude / Math.hypot(1, omega * tau);
  const phaseLag = Math.atan(omega * tau);
  const components = [
    { id: "ac", type: "acSource", amplitude, frequency, phase: 17, offset: 0 },
    { id: "r", type: "resistor", resistance },
    { id: "c", type: "capacitor", capacitance, initialVoltage: 0 }
  ];
  const wires = [wire("ac:a", "r:a"), wire("r:b", "c:a"), wire("c:b", "ac:b")];
  const measureError = result => {
    assert.equal(result.ok, true, result.message);
    const tailStart = duration - 2 / frequency;
    const tail = result.samples.filter(sample => sample.time >= tailStart);
    let sumSquared = 0;
    for (const sample of tail) {
      const expected = expectedAmplitude * Math.sin(omega * sample.time + 17 * Math.PI / 180 - phaseLag);
      const normalizedError = (sample.components.c.signedVoltage - expected) / expectedAmplitude;
      sumSquared += normalizedError * normalizedError;
    }
    return Math.sqrt(sumSquared / tail.length);
  };
  const fine = simulateTransient(components, wires, { duration, step: 1 / (frequency * 200) });
  const coarse = simulateTransient(components, wires, { duration, step: 1 / (frequency * 10) });
  assert.ok(!fine.warnings.includes("acSamplingCoarse"), "fine time step should not trigger AC undersampling warning");
  assert.ok(coarse.warnings.includes("acSamplingCoarse"), "coarse time step must warn about AC undersampling");
  const fineError = measureError(fine);
  const coarseError = measureError(coarse);
  assert.ok(fineError < 0.02, `fine-step RMS normalized error ${(fineError * 100).toFixed(3)}% exceeds 2%`);
  assert.ok(coarseError > fineError * 2, `coarse-step error ${(coarseError * 100).toFixed(3)}% should be more than twice fine-step error ${(fineError * 100).toFixed(3)}%`);
});

test("accuracy matrix: 100 AC resistive circuits match the instantaneous sine-wave solution", () => {
  const amplitudes = [0.5, 1, 3, 5, 9, 12, 24, 48, 100, 230];
  const frequencies = [1, 5, 10, 20, 50, 60, 100, 400, 1000, 5000];
  let cases = 0;
  for (const amplitude of amplitudes) for (const frequency of frequencies) {
    const phase = ((cases % 7) - 3) * 15;
    const offset = (cases % 3) - 1;
    const resistance = 100 + (cases % 9) * 100;
    const components = [
      { id: "ac", type: "acSource", amplitude, frequency, phase, offset },
      { id: "r", type: "resistor", resistance }
    ];
    const step = 1 / (frequency * 100);
    const duration = step * 20;
    const wires = [wire("ac:a", "r:a"), wire("r:b", "ac:b")];
    const result = simulateTransient(components, wires, { duration, step });
    const label = `A=${amplitude}, f=${frequency}, phase=${phase}, offset=${offset}, R=${resistance}`;
    assert.equal(result.ok, true, label + ": AC simulation failed");
    for (let i = 1; i < result.samples.length; i++) {
      const t = result.samples[i].time;
      const expectedVoltage = offset + amplitude * Math.sin(2 * Math.PI * frequency * t + phase * Math.PI / 180);
      const reading = result.samples[i].components.r;
      closeTo(reading.signedVoltage, expectedVoltage, Math.max(1e-7, amplitude * 1e-6), label + ` voltage at t=${t}`);
      closeTo(reading.signedCurrent, expectedVoltage / resistance, Math.max(1e-8, amplitude / resistance * 1e-6), label + ` current at t=${t}`);
    }
    cases++;
  }
  assert.equal(cases, 100);
});
