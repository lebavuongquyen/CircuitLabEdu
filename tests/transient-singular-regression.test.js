import test from "node:test";
import assert from "node:assert/strict";
import { simulateTransient } from "../transient.js";

const wire = (from, to) => ({ from, to });

test("transient solver rejects conflicting parallel ideal voltage sources safely", () => {
  const components = [
    { id: "b1", type: "battery", voltage: 9 },
    { id: "b2", type: "battery", voltage: 3 },
    { id: "c", type: "capacitor", capacitance: 0.001, initialVoltage: 0 }
  ];
  const wires = [
    wire("b1:a", "b2:a"),
    wire("b1:a", "c:a"),
    wire("b1:b", "b2:b"),
    wire("b1:b", "c:b")
  ];

  const result = simulateTransient(components, wires, { duration: 0.002, step: 0.001 });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "singular");
  assert.deepEqual(result.samples, []);
});

test("transient solver rejects an electrically floating passive subnetwork safely", () => {
  const components = [
    { id: "b", type: "battery", voltage: 9 },
    { id: "r", type: "resistor", resistance: 10 },
    { id: "c", type: "capacitor", capacitance: 0.001, initialVoltage: 0 },
    { id: "floating", type: "resistor", resistance: 100 }
  ];
  const wires = [
    wire("b:a", "r:a"),
    wire("r:b", "c:a"),
    wire("c:b", "b:b")
  ];

  const result = simulateTransient(components, wires, { duration: 0.002, step: 0.001 });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "singular");
  assert.deepEqual(result.samples, []);
});
