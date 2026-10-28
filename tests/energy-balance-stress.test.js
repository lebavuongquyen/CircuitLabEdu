import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

test("DC-driven series RLC remains numerically stable while approaching steady state", () => {
  const components = [
    { id: "v", type: "battery", voltage: 10 },
    { id: "r", type: "resistor", resistance: 10 },
    { id: "l", type: "inductor", inductance: 0.1, initialCurrent: 0 },
    { id: "c", type: "capacitor", capacitance: 0.001, initialVoltage: 0 }
  ];
  const wires = [
    wire("v:a", "r:a"),
    wire("r:b", "l:a"),
    wire("l:b", "c:a"),
    wire("c:b", "v:b")
  ];
  const result = simulateTransient(components, wires, { duration: 0.2, step: 0.0001 });
  assert.equal(result.ok, true, result.message);
  const final = result.samples.at(-1);
  assert.ok(Math.abs(final.components.c.signedVoltage - 10) < 0.02, `capacitor should approach 10 V, got ${final.components.c.signedVoltage}`);
  assert.ok(Math.abs(final.components.r.signedCurrent) < 0.001, `series current should decay toward zero, got ${final.components.r.signedCurrent}`);
});

test("RC energy balance residual matches backward-Euler numerical dissipation", () => {
  const resistance = 100;
  const capacitance = 0.001;
  const initialVoltage = 2;
  const step = 0.001;
  const result = simulateTransient([
    { id: "v", type: "battery", voltage: 10 },
    { id: "r", type: "resistor", resistance },
    { id: "c", type: "capacitor", capacitance, initialVoltage }
  ], [wire("v:a", "r:a"), wire("r:b", "c:a"), wire("c:b", "v:b")], { duration: 0.1, step });
  assert.equal(result.ok, true, result.message);
  let sourceWork = 0;
  let resistorLoss = 0;
  let expectedNumericalDissipation = 0;
  for (let i = 1; i < result.samples.length; i++) {
    const previous = result.samples[i - 1];
    const current = result.samples[i];
    const dt = current.time - previous.time;
    sourceWork += current.sourcePower * dt;
    resistorLoss += current.components.r.signedVoltage * current.components.r.signedCurrent * dt;
    const dv = current.components.c.signedVoltage - previous.components.c.signedVoltage;
    expectedNumericalDissipation += 0.5 * capacitance * dv * dv;
  }
  const firstEnergy = 0.5 * capacitance * initialVoltage ** 2;
  const finalVoltage = result.samples.at(-1).components.c.signedVoltage;
  const storedEnergyChange = 0.5 * capacitance * finalVoltage ** 2 - firstEnergy;
  const measuredResidual = sourceWork - resistorLoss - storedEnergyChange;
  assert.ok(Math.abs(measuredResidual - expectedNumericalDissipation) < 1e-10,
    `energy residual ${measuredResidual} should match backward-Euler dissipation ${expectedNumericalDissipation}`);
});

test("RL and RLC energy ledgers account for source work, resistor loss, stored energy, and backward-Euler dissipation", () => {
  const cases = [
    {
      name: "RL with stored initial magnetic energy",
      components: [
        { id: "v", type: "battery", voltage: 10 },
        { id: "r", type: "resistor", resistance: 10 },
        { id: "l", type: "inductor", inductance: 1, initialCurrent: 2 }
      ],
      wires: [wire("v:a", "r:a"), wire("r:b", "l:a"), wire("l:b", "v:b")],
      options: { duration: 0.1, step: 0.001 }
    },
    {
      name: "RLC with transient energy exchange",
      components: [
        { id: "v", type: "battery", voltage: 10 },
        { id: "r", type: "resistor", resistance: 10 },
        { id: "l", type: "inductor", inductance: 0.1, initialCurrent: 0 },
        { id: "c", type: "capacitor", capacitance: 0.001, initialVoltage: 0 }
      ],
      wires: [wire("v:a", "r:a"), wire("r:b", "l:a"), wire("l:b", "c:a"), wire("c:b", "v:b")],
      options: { duration: 0.05, step: 0.0001 }
    }
  ];

  for (const item of cases) {
    const result = simulateTransient(item.components, item.wires, item.options);
    assert.equal(result.ok, true, `${item.name}: ${result.message}`);
    let sourceWork = 0;
    let resistorLoss = 0;
    let expectedNumericalDissipation = 0;
    for (let i = 1; i < result.samples.length; i++) {
      const previous = result.samples[i - 1];
      const current = result.samples[i];
      const dt = current.time - previous.time;
      sourceWork += current.sourcePower * dt;
      for (const component of item.components) {
        const before = previous.components[component.id];
        const after = current.components[component.id];
        if (component.type === "resistor") {
          resistorLoss += after.signedVoltage * after.signedCurrent * dt;
        } else if (component.type === "capacitor") {
          expectedNumericalDissipation += 0.5 * component.capacitance * (after.signedVoltage - before.signedVoltage) ** 2;
        } else if (component.type === "inductor") {
          expectedNumericalDissipation += 0.5 * component.inductance * (after.signedCurrent - before.signedCurrent) ** 2;
        }
      }
    }
    const storedEnergy = sample => item.components.reduce((energy, component) => {
      if (component.type === "capacitor") return energy + 0.5 * component.capacitance * sample.components[component.id].signedVoltage ** 2;
      if (component.type === "inductor") return energy + 0.5 * component.inductance * sample.components[component.id].signedCurrent ** 2;
      return energy;
    }, 0);
    const storedEnergyChange = storedEnergy(result.samples.at(-1)) - storedEnergy(result.samples[0]);
    const measuredResidual = sourceWork - resistorLoss - storedEnergyChange;
    assert.ok(Math.abs(measuredResidual - expectedNumericalDissipation) < 1e-10,
      `${item.name}: energy residual ${measuredResidual} should match backward-Euler dissipation ${expectedNumericalDissipation}`);
  }
});
