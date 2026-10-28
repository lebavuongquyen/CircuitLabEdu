import test from "node:test";
import assert from "node:assert/strict";
import { solveCircuit, validateCircuit } from "../solver.js";
import { simulateTransient } from "../transient.js";

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function closeTo(actual, expected, relativeTolerance, label) {
  assert.ok(Number.isFinite(actual), `${label}: non-finite actual value ${actual}`);
  const tolerance = Math.max(1e-10, Math.abs(expected) * relativeTolerance);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}, tolerance ${tolerance}`);
}

function makeParallelCircuit(voltage, resistances) {
  const components = [
    { id: "source", type: "battery", voltage },
    ...resistances.map((resistance, index) => ({ id: `r${index}`, type: "resistor", resistance }))
  ];
  const wires = resistances.flatMap((_, index) => [
    { from: "source:a", to: `r${index}:a` },
    { from: `r${index}:b`, to: "source:b" }
  ]);
  return { components, wires };
}

test("property matrix: 500 seeded random parallel networks obey branch laws and power conservation", () => {
  const random = createRandom(0xC1AC017);
  let totalBranches = 0;
  for (let caseIndex = 0; caseIndex < 500; caseIndex++) {
    const voltage = 0.1 + random() * 99.9;
    const branchCount = 2 + Math.floor(random() * 7);
    const resistances = Array.from({ length: branchCount }, () => 10 ** (-1 + random() * 7));
    const { components, wires } = makeParallelCircuit(voltage, resistances);
    const result = solveCircuit(components, wires);
    const label = `case=${caseIndex}, V=${voltage}, R=${resistances.join(",")}`;
    assert.equal(result.ok, true, label + ": valid network rejected");
    let expectedTotalCurrent = 0;
    let expectedTotalPower = 0;
    for (let branch = 0; branch < branchCount; branch++) {
      const expectedCurrent = voltage / resistances[branch];
      const expectedPower = voltage * voltage / resistances[branch];
      closeTo(result.readings.components[`r${branch}`].signedVoltage, voltage, 2e-5, label + ` branch ${branch} voltage`);
      closeTo(result.readings.components[`r${branch}`].signedCurrent, expectedCurrent, 2e-5, label + ` branch ${branch} current`);
      closeTo(result.readings.components[`r${branch}`].power, expectedPower, 2e-5, label + ` branch ${branch} power`);
      expectedTotalCurrent += expectedCurrent;
      expectedTotalPower += expectedPower;
      totalBranches++;
    }
    closeTo(result.readings.current, expectedTotalCurrent, 2e-5, label + " total current");
    closeTo(result.readings.power, expectedTotalPower, 2e-5, label + " total load power");
    closeTo(result.readings.sourcePower, expectedTotalPower, 2e-5, label + " source/load power balance");
  }
  assert.equal(totalBranches >= 1000, true);
});

test("property matrix: 300 seeded random series networks obey Ohm's law and KVL", () => {
  const random = createRandom(0x5E21E5);
  for (let caseIndex = 0; caseIndex < 300; caseIndex++) {
    const voltage = 0.1 + random() * 99.9;
    const branchCount = 2 + Math.floor(random() * 7);
    const resistances = Array.from({ length: branchCount }, () => 10 ** (-1 + random() * 7));
    const components = [
      { id: "source", type: "battery", voltage },
      ...resistances.map((resistance, index) => ({ id: `r${index}`, type: "resistor", resistance }))
    ];
    const wires = [{ from: "source:a", to: "r0:a" }];
    for (let index = 0; index < branchCount - 1; index++) {
      wires.push({ from: `r${index}:b`, to: `r${index + 1}:a` });
    }
    wires.push({ from: `r${branchCount - 1}:b`, to: "source:b" });
    const result = solveCircuit(components, wires);
    const totalResistance = resistances.reduce((sum, value) => sum + value, 0);
    const expectedCurrent = voltage / totalResistance;
    const label = `series case=${caseIndex}, V=${voltage}, R=${resistances.join(",")}`;
    assert.equal(result.ok, true, label + ": valid series network rejected");
    closeTo(result.readings.current, expectedCurrent, 3e-5, label + " current");
    let voltageSum = 0;
    for (let branch = 0; branch < branchCount; branch++) {
      const expectedVoltage = expectedCurrent * resistances[branch];
      closeTo(result.readings.components[`r${branch}`].signedVoltage, expectedVoltage, 3e-5, label + ` branch ${branch} voltage`);
      closeTo(result.readings.components[`r${branch}`].signedCurrent, expectedCurrent, 3e-5, label + ` branch ${branch} current`);
      voltageSum += result.readings.components[`r${branch}`].signedVoltage;
    }
    closeTo(voltageSum, voltage, 3e-5, label + " KVL sum");
    closeTo(result.readings.power, expectedCurrent * expectedCurrent * totalResistance, 3e-5, label + " load power");
    closeTo(result.readings.sourcePower, result.readings.power, 3e-5, label + " power balance");
  }
});

test("metamorphic checks: component and wire order do not change parallel-circuit results", () => {
  const base = makeParallelCircuit(17.25, [3.3, 12, 470, 22000, 1e6]);
  const expected = solveCircuit(base.components, base.wires);
  const reversed = solveCircuit([...base.components].reverse(), [...base.wires].reverse());
  assert.equal(expected.ok, true);
  assert.equal(reversed.ok, true);
  for (const component of base.components) {
    const a = expected.readings.components[component.id];
    const b = reversed.readings.components[component.id];
    closeTo(b.signedVoltage, a.signedVoltage, 1e-7, component.id + " permutation voltage");
    closeTo(b.signedCurrent, a.signedCurrent, 1e-7, component.id + " permutation current");
  }
  closeTo(reversed.readings.power, expected.readings.power, 1e-7, "permutation total power");
  closeTo(reversed.readings.sourcePower, expected.readings.sourcePower, 1e-7, "permutation source power");
});

test("negative-input matrix: malformed circuit structures are rejected without throwing", () => {
  const malformedComponents = [null, undefined, 1, "resistor", {}, { id: "", type: "resistor", resistance: 10 }];
  for (const component of malformedComponents) {
    assert.doesNotThrow(() => validateCircuit([component], []));
    assert.equal(validateCircuit([component], []).valid, false);
  }
  const malformedWires = [null, undefined, 1, {}, { from: "missing:a", to: "missing:b" }, { from: "r:a", to: "r:a" }];
  for (const wire of malformedWires) {
    assert.doesNotThrow(() => validateCircuit([{ id: "r", type: "resistor", resistance: 10 }], [wire]));
    assert.equal(validateCircuit([{ id: "r", type: "resistor", resistance: 10 }], [wire]).valid, false);
  }
  assert.doesNotThrow(() => solveCircuit([null], []));
  assert.equal(solveCircuit([null], []).ok, false);
});

test("transient API rejects malformed components and invalid options without throwing", () => {
  const validCircuit = {
    components: [
      { id: "b", type: "battery", voltage: 5 },
      { id: "r", type: "resistor", resistance: 1000 },
      { id: "c", type: "capacitor", capacitance: 0.000001 }
    ],
    wires: [
      { from: "b:a", to: "r:a" },
      { from: "r:b", to: "c:a" },
      { from: "c:b", to: "b:b" }
    ]
  };
  for (const components of [[null], [undefined], [1], [{}]]) {
    assert.doesNotThrow(() => simulateTransient(components, []));
    assert.equal(simulateTransient(components, []).ok, false);
  }
  for (const options of [null, 1, "bad", [], { duration: NaN }, { duration: Infinity }, { duration: -1 }, { duration: 1, step: 0 }, { duration: 1, step: -0.1 }, { duration: 1, step: 2 }, { duration: 1, step: 1e-8 }]) {
    assert.doesNotThrow(() => simulateTransient(validCircuit.components, validCircuit.wires, options));
    assert.equal(simulateTransient(validCircuit.components, validCircuit.wires, options).ok, false);
  }
});
