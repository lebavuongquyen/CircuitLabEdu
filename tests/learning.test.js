import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";
import { lessons, validateLesson, assessCircuit } from "../lessons.js";

const loop = (source, resistor, storage) => [
  { id: "b", type: "battery", voltage: 10 },
  { id: "r", type: "resistor", resistance: 1000 },
  { id: storage.id, ...storage }
];
const seriesWires = [
  { from: "b:a", to: "r:a" },
  { from: "r:b", to: "s:a" },
  { from: "s:b", to: "b:b" }
];

test("RC transient starts at initial capacitor voltage and approaches source voltage", () => {
  const components = loop(null, null, { id: "s", type: "capacitor", capacitance: 0.001, initialVoltage: 0 });
  const result = simulateTransient(components, seriesWires, { duration: 1, step: 0.01 });
  assert.equal(result.ok, true);
  assert.equal(result.mode, "rc");
  assert.equal(result.samples[0].storageVoltage, 0);
  assert.ok(result.samples.at(-1).storageVoltage > 6);
  assert.ok(result.samples.at(-1).storageVoltage < 10);
});

test("RL transient starts at initial current and rises toward steady state", () => {
  const components = loop(null, null, { id: "s", type: "inductor", inductance: 1, initialCurrent: 0 });
  const coarse = simulateTransient(components, seriesWires, { duration: 1, step: 0.01 });
  assert.equal(coarse.ok, true);
  assert.equal(coarse.samples[0].current, null);
  assert.ok(coarse.samples.slice(1).every(sample => Number.isFinite(sample.current)));
  assert.ok(coarse.samples.at(-1).current <= 0.0100001);
  const result = simulateTransient(components, seriesWires, { duration: 0.005, step: 0.0001 });
  assert.equal(result.ok, true);
  assert.equal(result.mode, "rl");
  assert.equal(result.samples[0].current, null);
  assert.ok(result.samples.at(-1).current > 0.009);
  assert.ok(result.samples.at(-1).current < 0.01);
});

test("transient simulator rejects too many samples", () => {
  const components = loop(null, null, { id: "s", type: "capacitor", capacitance: 0.001 });
  const result = simulateTransient(components, seriesWires, { duration: 10, step: 0.000001 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid-step");
});

test("transient simulator rejects unsupported topology", () => {
  const components = loop(null, null, { id: "s", type: "capacitor", capacitance: 0.001 });
  const result = simulateTransient(components, [], { duration: 1, step: 0.01 });
  assert.equal(result.ok, false);
});

test("built-in lessons have valid bilingual schema", () => {
  assert.equal(lessons.length, 20);
  for (const lesson of lessons) assert.equal(validateLesson(lesson).valid, true, lesson.id);
  assert.deepEqual(Object.fromEntries(["primary", "middle", "high"].map(level => [level, lessons.filter(lesson => lesson.level === level).length])), { primary: 4, middle: 7, high: 9 });
  assert.ok(lessons.every(lesson => typeof lesson.example === "string" && lesson.example.length > 0));
});

test("lesson assessment rejects unsolved circuit", () => {
  assert.deepEqual(assessCircuit(lessons[0], { ok: false }), { passed: false, reason: "circuit-not-solved" });
});

test("numeric lesson grading rejects undefined aggregate measurements for branched multi-source circuits", () => {
  const lesson = lessons.find(item => item.id === "ohms-law");
  const result = { ok: true, reason: "closed", readings: { summaryValid: false, voltage: null, current: null, resistance: null } };
  const assessment = assessCircuit(lesson, result, []);
  assert.equal(assessment.passed, false);
  assert.equal(assessment.reason, "aggregate-measurement-undefined");
});

test("Ohm's law lesson checks the calculated relationship", () => {
  const result = { ok: true, reason: "closed", readings: { current: 1.5, resistance: 6, voltage: 9 } };
  assert.equal(assessCircuit(lessons[2], result).passed, true);
});

test("transient solver supports a mixed RLC series loop", () => {
  const components = [
    { id: "b", type: "battery", voltage: 9 },
    { id: "r", type: "resistor", resistance: 10 },
    { id: "c", type: "capacitor", capacitance: 0.001, initialVoltage: 0 },
    { id: "l", type: "inductor", inductance: 0.1, initialCurrent: 0 }
  ];
  const wires = [
    { from: "b:a", to: "r:a" },
    { from: "r:b", to: "c:a" },
    { from: "c:b", to: "l:a" },
    { from: "l:b", to: "b:b" }
  ];
  const result = simulateTransient(components, wires, { duration: 0.02, step: 0.0001 });
  assert.equal(result.ok, true);
  assert.equal(result.mode, "rlc");
  assert.equal(result.samples.length, 201);
  assert.ok(result.samples.every(sample => Number.isFinite(sample.storageVoltage) && Number.isFinite(sample.storageCurrent)));
});

test("lesson schema rejects unsupported or empty grading rules", () => {
  const invalid = { schemaVersion: 1, id: "bad-rule", level: "primary", title: { vi: "Bai", en: "Lesson" }, objective: { vi: "Muc tieu", en: "Objective" }, expected: { script: "alert(1)" } };
  assert.equal(validateLesson(invalid).valid, false);
  const empty = { ...invalid, id: "empty-rule", expected: {} };
  assert.equal(validateLesson(empty).valid, false);
  const noTypes = { ...invalid, id: "no-types", expected: { componentTypes: [] } };
  assert.equal(validateLesson(noTypes).valid, false);
});

test("lesson assessment requires its specified component types", () => {
  const lesson = lessons[0];
  const result = { ok: true, reason: "closed", readings: { voltage: 9, current: 1.5, resistance: 6 } };
  assert.equal(assessCircuit(lesson, result, [{ id: "b", type: "battery" }]).reason, "required-components-missing");
});

test("transient solver rejects malformed API input without throwing", () => {
  const result = simulateTransient(null, []);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid-input");
});

test("sinusoidal AC source changes polarity over time and drives an RC network", () => {
  const components = [
    { id: "ac", type: "acSource", amplitude: 5, frequency: 50, phase: 0, offset: 0 },
    { id: "r", type: "resistor", resistance: 1000 },
    { id: "c", type: "capacitor", capacitance: 0.00001, initialVoltage: 0 }
  ];
  const wires = [
    { from: "ac:a", to: "r:a" },
    { from: "r:b", to: "c:a" },
    { from: "c:b", to: "ac:b" }
  ];
  const result = simulateTransient(components, wires, { duration: 0.02, step: 0.001 });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.mode, "ac-rc");
  assert.ok(Math.abs(result.samples[0].voltage) < 1e-9);
  assert.ok(Math.abs(result.samples[5].voltage - 5) < 1e-8);
  assert.ok(Math.abs(result.samples[10].voltage) < 1e-8);
  assert.ok(Math.abs(result.samples[15].voltage + 5) < 1e-8);
  assert.ok(Math.max(...result.samples.map(s => Math.abs(s.storageVoltage))) > 0.1);
});

test("AC source can simulate a resistive load without a storage component", () => {
  const components = [
    { id: "ac", type: "acSource", amplitude: 12, frequency: 60, phase: 0, offset: 0 },
    { id: "r", type: "resistor", resistance: 100 }
  ];
  const wires = [
    { from: "ac:a", to: "r:a" },
    { from: "r:b", to: "ac:b" }
  ];
  const result = simulateTransient(components, wires, { duration: 0.02, step: 0.001 });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.mode, "ac");
  assert.ok(result.samples.some(s => s.voltage > 0));
  assert.ok(result.samples.some(s => s.voltage < 0));
});

test("smaller backward-Euler time steps converge toward the analytical RC response", () => {
  const components = loop(null, null, { id: "s", type: "capacitor", capacitance: 0.001, initialVoltage: 0 });
  const coarse = simulateTransient(components, seriesWires, { duration: 1, step: 0.1 });
  const fine = simulateTransient(components, seriesWires, { duration: 1, step: 0.01 });
  const analytical = 10 * (1 - Math.exp(-1));
  assert.equal(coarse.ok, true);
  assert.equal(fine.ok, true);
  assert.ok(Math.abs(fine.samples.at(-1).storageVoltage - analytical) < Math.abs(coarse.samples.at(-1).storageVoltage - analytical));
});

test("built-in curriculum includes supported transient modes and validates them", () => {
  const transientLessons = lessons.filter(lesson => lesson.expected.transientMode);
  assert.ok(transientLessons.length >= 5);
  for (const lesson of transientLessons) {
    assert.equal(validateLesson(lesson).valid, true, lesson.id);
    assert.ok(["rc", "rl", "rlc", "ac", "ac-rc"].includes(lesson.expected.transientMode));
  }
  const lesson = transientLessons[0];
  assert.equal(assessCircuit(lesson, { ok: true, mode: lesson.expected.transientMode }, lesson.expected.componentTypes.map(type => ({ type }))).passed, true);
  assert.equal(assessCircuit(lesson, { ok: true, mode: "wrong-mode" }, lesson.expected.componentTypes.map(type => ({ type }))).reason, "transient-mode-mismatch");
});

test("curriculum has distinct, bilingual lesson IDs and content", () => {
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length);
  for (const lesson of lessons) {
    assert.ok(lesson.title.vi.trim());
    assert.ok(lesson.title.en.trim());
    assert.ok(lesson.objective.vi.trim());
    assert.ok(lesson.objective.en.trim());
    assert.ok(lesson.hints.vi.length > 0);
    assert.ok(lesson.hints.en.length > 0);
  }
});

test("smaller backward-Euler time steps converge toward the analytical RL current", () => {
  const components = loop(null, null, { id: "s", type: "inductor", inductance: 1, initialCurrent: 0 });
  const coarse = simulateTransient(components, seriesWires, { duration: 0.0005, step: 0.0001 });
  const fine = simulateTransient(components, seriesWires, { duration: 0.0005, step: 0.00001 });
  const analytical = 0.01 * (1 - Math.exp(-1000 * 0.0005));
  assert.equal(coarse.ok, true, coarse.message);
  assert.equal(fine.ok, true, fine.message);
  assert.ok(Math.abs(fine.samples.at(-1).current - analytical) < Math.abs(coarse.samples.at(-1).current - analytical));
  assert.ok(Math.abs(fine.samples.at(-1).current - analytical) < 0.0001);
});

test("RLC transient stays finite and refines consistently with a smaller time step", () => {
  const components = [
    { id: "b", type: "battery", voltage: 9 },
    { id: "r", type: "resistor", resistance: 10 },
    { id: "c", type: "capacitor", capacitance: 0.001, initialVoltage: 0 },
    { id: "l", type: "inductor", inductance: 0.1, initialCurrent: 0 }
  ];
  const wires = [
    { from: "b:a", to: "r:a" },
    { from: "r:b", to: "c:a" },
    { from: "c:b", to: "l:a" },
    { from: "l:b", to: "b:b" }
  ];
  const coarse = simulateTransient(components, wires, { duration: 0.02, step: 0.0005 });
  const fine = simulateTransient(components, wires, { duration: 0.02, step: 0.0001 });
  assert.equal(coarse.ok, true, coarse.message);
  assert.equal(fine.ok, true, fine.message);
  assert.ok(fine.samples.every(sample => Object.values(sample.components).every(reading => Object.values(reading).filter(value => typeof value === "number").every(Number.isFinite))));
  assert.ok(fine.samples.at(-1).storageVoltage >= 0);
  assert.ok(fine.samples.at(-1).storageVoltage <= 9);
  assert.ok(Math.abs(fine.samples.at(-1).storageVoltage - coarse.samples.at(-1).storageVoltage) < 0.1);
});

test("transient solver rejects non-finite and non-positive storage parameters", () => {
  const invalidCapacitance = loop(null, null, { id: "s", type: "capacitor", capacitance: 0 });
  const capResult = simulateTransient(invalidCapacitance, seriesWires, { duration: 1, step: 0.01 });
  assert.equal(capResult.ok, false);
  assert.equal(capResult.reason, "invalid-capacitance");
  const invalidInductance = loop(null, null, { id: "s", type: "inductor", inductance: Number.NaN });
  const inductorResult = simulateTransient(invalidInductance, seriesWires, { duration: 1, step: 0.01 });
  assert.equal(inductorResult.ok, false);
  assert.equal(inductorResult.reason, "invalid-inductance");
  const oversizedCapacitance = loop(null, null, { id: "s", type: "capacitor", capacitance: 1e7 });
  const oversizedCapResult = simulateTransient(oversizedCapacitance, seriesWires, { duration: 1, step: 0.01 });
  assert.equal(oversizedCapResult.ok, false);
  assert.equal(oversizedCapResult.reason, "invalid-capacitance");
  const excessiveInitialVoltage = loop(null, null, { id: "s", type: "capacitor", capacitance: 0.001, initialVoltage: 1001 });
  const initialVoltageResult = simulateTransient(excessiveInitialVoltage, seriesWires, { duration: 1, step: 0.01 });
  assert.equal(initialVoltageResult.ok, false);
  assert.equal(initialVoltageResult.reason, "invalid-capacitance");
  const excessiveInitialCurrent = loop(null, null, { id: "s", type: "inductor", inductance: 1, initialCurrent: 1001 });
  const initialCurrentResult = simulateTransient(excessiveInitialCurrent, seriesWires, { duration: 1, step: 0.01 });
  assert.equal(initialCurrentResult.ok, false);
  assert.equal(initialCurrentResult.reason, "invalid-inductance");
});

test("custom lesson starting circuits validate and preserve explicit junction topology", () => {
  const lesson = {
    schemaVersion: 1,
    id: "junction-start",
    level: "middle",
    title: { vi: "Mạch có điểm nối", en: "Junction circuit" },
    objective: { vi: "Quan sát nút điện.", en: "Inspect an electrical node." },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true },
    startingCircuit: {
      schemaVersion: 1,
      level: "middle",
      components: [
        { id: "b", type: "battery", voltage: 9, x: 100, y: 100 },
        { id: "r", type: "resistor", resistance: 10, x: 300, y: 100 }
      ],
      wires: [
        { id: "w1", from: "b:a", to: "j:j1" },
        { id: "w2", from: "j:j1", to: "r:a" },
        { id: "w3", from: "r:b", to: "j:j2" },
        { id: "w4", from: "j:j2", to: "b:b" }
      ],
      junctions: [{ id: "j1", x: 200, y: 100 }, { id: "j2", x: 400, y: 100 }]
    }
  };
  assert.equal(validateLesson(lesson).valid, true);
  assert.equal(validateLesson({ ...lesson, startingCircuit: { ...lesson.startingCircuit, junctions: [{ id: "j1", x: 901, y: 100 }] } }).reason, "invalid-starting-junction");
  assert.equal(validateLesson({ ...lesson, startingCircuit: { ...lesson.startingCircuit, wires: [{ id: "w1", from: "b:a", to: "j:missing" }] } }).reason, "invalid-starting-topology");
});

test("initial transient sample exposes capacitor voltage and inductor current at t=0", () => {
  const components = [
    { id: "b", type: "battery", voltage: 10 },
    { id: "r", type: "resistor", resistance: 1000 },
    { id: "c", type: "capacitor", capacitance: 0.001, initialVoltage: 3 },
    { id: "l", type: "inductor", inductance: 1, initialCurrent: 0.002 }
  ];
  const wires = [
    { from: "b:a", to: "r:a" },
    { from: "r:b", to: "c:a" },
    { from: "c:b", to: "l:a" },
    { from: "l:b", to: "b:b" }
  ];
  const result = simulateTransient(components, wires, { duration: 0.01, step: 0.001 });
  assert.equal(result.ok, true, result.message);
  const initial = result.samples[0];
  assert.equal(initial.time, 0);
  assert.equal(initial.storageVoltage, 3);
  assert.equal(initial.storageCurrent, 0.002);
  assert.equal(initial.components.c.signedVoltage, 3);
  assert.equal(initial.components.c.voltage, 3);
  assert.equal(initial.components.l.signedCurrent, 0.002);
  assert.equal(initial.components.l.current, 0.002);
  assert.equal(initial.components.c.initialized, true);
  assert.equal(initial.components.r.initialized, false);
  assert.equal(initial.components.b.signedVoltage, 10);
  assert.equal(initial.components.b.signedCurrent, null);
  assert.equal(initial.components.r.signedVoltage, null);
  assert.equal(initial.components.r.signedCurrent, null);
  assert.equal(initial.components.r.power, null);
  assert.equal(initial.components.c.signedCurrent, null);
  assert.equal(initial.components.l.signedVoltage, null);
  assert.equal(initial.current, null);
  assert.equal(initial.sourcePower, null);
});
