import test from "node:test";
import assert from "node:assert/strict";
import { solveCircuit, validateCircuit, simulateTransient, routeOrthogonal } from "@circuitlabedu/core";
import { lessons, validateLesson, assessCircuit } from "@circuitlabedu/exercise-pack-basic";

test("core package exposes stable framework-independent entry points", () => {
  assert.equal(typeof solveCircuit, "function");
  assert.equal(typeof validateCircuit, "function");
  assert.equal(typeof simulateTransient, "function");
  assert.equal(typeof routeOrthogonal, "function");
});

test("basic exercise pack contains unique valid bilingual lessons", () => {
  assert.ok(Array.isArray(lessons) && lessons.length >= 1);
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length);
  for (const lesson of lessons) assert.equal(validateLesson(lesson).valid, true, `${lesson.id} should validate`);
});

test("package API computes a reference DC circuit", () => {
  const components = [{ id: "source", type: "battery", voltage: 9 }, { id: "load", type: "resistor", resistance: 3 }];
  const wires = [{ id: "w1", from: "source:a", to: "load:a" }, { id: "w2", from: "load:b", to: "source:b" }];
  const result = solveCircuit(components, wires);
  assert.equal(result.ok, true);
  assert.ok(Math.abs(result.readings.current - 3) < 1e-6);
});

test("lesson assessment rejects missing or failed simulation results", () => {
  const lesson = lessons.find(item => item.expected?.componentTypes?.includes("battery"));
  assert.ok(lesson);
  assert.equal(assessCircuit(lesson, { ok: false }, []).passed, false);
});
