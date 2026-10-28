import test from "node:test";
import assert from "node:assert/strict";
import { solveCircuit } from "../solver.js";

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function closeTo(actual, expected, relativeTolerance, label) {
  assert.ok(Number.isFinite(actual), label + ": expected finite value, received " + actual);
  const tolerance = Math.max(1e-9, Math.abs(expected) * relativeTolerance);
  assert.ok(Math.abs(actual - expected) <= tolerance, label + ": expected " + expected + ", received " + actual + ", tolerance " + tolerance);
}

function buildBridge(voltage, resistances) {
  const [r1, r2, r3, r4, r5] = resistances;
  const components = [
    { id: "source", type: "battery", voltage },
    { id: "r1", type: "resistor", resistance: r1 },
    { id: "r2", type: "resistor", resistance: r2 },
    { id: "r3", type: "resistor", resistance: r3 },
    { id: "r4", type: "resistor", resistance: r4 },
    { id: "bridge", type: "resistor", resistance: r5 }
  ];
  const wires = [
    { from: "source:a", to: "r1:a" },
    { from: "r1:b", to: "r2:a" },
    { from: "source:b", to: "r2:b" },
    { from: "source:a", to: "r3:a" },
    { from: "r3:b", to: "r4:a" },
    { from: "source:b", to: "r4:b" },
    { from: "r1:b", to: "bridge:a" },
    { from: "bridge:b", to: "r3:b" }
  ];
  return { components, wires };
}

function referenceBridge(voltage, [r1, r2, r3, r4, r5]) {
  const g1 = 1 / r1;
  const g2 = 1 / r2;
  const g3 = 1 / r3;
  const g4 = 1 / r4;
  const g5 = 1 / r5;
  const a = g1 + g2 + g5;
  const b = g3 + g4 + g5;
  const determinant = a * b - g5 * g5;
  const left = (g1 * voltage * b + g5 * g3 * voltage) / determinant;
  const right = (a * g3 * voltage + g5 * g1 * voltage) / determinant;
  const branchCurrents = [
    (voltage - left) / r1,
    left / r2,
    (voltage - right) / r3,
    right / r4,
    (left - right) / r5
  ];
  const branchVoltages = [
    voltage - left,
    left,
    voltage - right,
    right,
    left - right
  ];
  const totalCurrent = branchCurrents[0] + branchCurrents[2];
  const totalPower = branchCurrents.reduce((sum, current, index) => sum + current * current * [r1, r2, r3, r4, r5][index], 0);
  return { left, right, branchCurrents, branchVoltages, totalCurrent, totalPower };
}

test("property matrix: 500 seeded unbalanced bridge networks match independent nodal analysis", () => {
  const random = createRandom(0xB21D6E);
  for (let caseIndex = 0; caseIndex < 500; caseIndex++) {
    const voltage = 0.25 + random() * 99.75;
    const resistances = Array.from({ length: 5 }, () => 10 ** (-0.5 + random() * 5.5));
    const circuit = buildBridge(voltage, resistances);
    const actual = solveCircuit(circuit.components, circuit.wires);
    const expected = referenceBridge(voltage, resistances);
    const label = "bridge case=" + caseIndex + ", V=" + voltage + ", R=" + resistances.join(",");
    assert.equal(actual.ok, true, label + ": valid bridge rejected");
    for (let i = 0; i < 5; i++) {
      const id = i === 4 ? "bridge" : "r" + (i + 1);
      closeTo(actual.readings.components[id].signedVoltage, expected.branchVoltages[i], 8e-5, label + " " + id + " voltage");
      closeTo(actual.readings.components[id].signedCurrent, expected.branchCurrents[i], 8e-5, label + " " + id + " current");
      closeTo(actual.readings.components[id].power, expected.branchCurrents[i] ** 2 * resistances[i], 1e-4, label + " " + id + " power");
    }
    closeTo(actual.readings.current, expected.totalCurrent, 8e-5, label + " source current");
    closeTo(actual.readings.power, expected.totalPower, 1e-4, label + " total resistor power");
    closeTo(actual.readings.sourcePower, expected.totalPower, 1e-4, label + " source/load power balance");
    closeTo(expected.branchCurrents[0] - expected.branchCurrents[1] - expected.branchCurrents[4], 0, 2e-10, label + " left-node KCL");
    closeTo(expected.branchCurrents[2] - expected.branchCurrents[3] + expected.branchCurrents[4], 0, 2e-10, label + " right-node KCL");
  }
});

test("balanced Wheatstone bridge has zero bridge current across varied component scales", () => {
  const random = createRandom(0xA11CE);
  for (let caseIndex = 0; caseIndex < 100; caseIndex++) {
    const voltage = 1 + random() * 48;
    const topResistance = 10 ** (-1 + random() * 5);
    const bottomResistance = 10 ** (-1 + random() * 5);
    const bridgeResistance = 10 ** (-1 + random() * 5);
    const resistances = [topResistance, bottomResistance, topResistance, bottomResistance, bridgeResistance];
    const circuit = buildBridge(voltage, resistances);
    const result = solveCircuit(circuit.components, circuit.wires);
    const label = "balanced bridge case=" + caseIndex;
    assert.equal(result.ok, true, label + ": solver rejected balanced bridge");
    closeTo(result.readings.components.r1.signedVoltage, voltage * topResistance / (topResistance + bottomResistance), 1e-5, label + " left divider");
    closeTo(result.readings.components.r3.signedVoltage, voltage * topResistance / (topResistance + bottomResistance), 1e-5, label + " right divider");
    closeTo(result.readings.components.bridge.signedCurrent, 0, 1e-7, label + " bridge current");
  }
});
