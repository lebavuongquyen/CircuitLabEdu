import { validateLesson } from "./validator.js";

function checkStructuralExpectations(expected, result, components) {
  if (expected.transientMode && result.mode !== expected.transientMode) return "transient-mode-mismatch";
  if (expected.comparison) return result.comparisonPassed === true ? null : "comparison-requires-two-scenarios";
  if (expected.componentTypes && expected.componentTypes.some(t => !components.some(c => c.type === t))) return "required-components-missing";
  if (expected.requireClosedCircuit && result.reason !== "closed") return "circuit-not-closed";
  return null;
}

function checkReadingExpectations(expected, r) {
  if (r?.summaryValid === false && (expected.relation || expected.minCurrent !== undefined || expected.maxCurrent !== undefined || expected.targetVoltage !== undefined || expected.targetResistance !== undefined)) {
    return "aggregate-measurement-undefined";
  }
  if (expected.relation === "ohms-law") {
    if (!r) return "missing-readings";
    if (Math.abs(r.current * r.resistance - r.voltage) > (expected.tolerance ?? 0.01)) return "ohms-law-mismatch";
  }
  if (r && expected.minCurrent !== undefined && r.current < expected.minCurrent) return "current-below-target";
  if (r && expected.maxCurrent !== undefined && r.current > expected.maxCurrent) return "current-above-target";
  if (r && expected.targetVoltage !== undefined && Math.abs(r.voltage - expected.targetVoltage) > (expected.tolerance ?? 0.01)) return "voltage-mismatch";
  if (r && expected.targetResistance !== undefined && Math.abs(r.resistance - expected.targetResistance) > (expected.tolerance ?? 0.01)) return "resistance-mismatch";
  return null;
}

export function assessCircuit(lesson, result, components = []) {
  const schema = validateLesson(lesson);
  if (!schema.valid) return { passed: false, reason: schema.reason };
  if (!result || !result.ok) return { passed: false, reason: "circuit-not-solved" };
  const structErr = checkStructuralExpectations(lesson.expected, result, components);
  if (structErr) return { passed: false, reason: structErr };
  const readErr = checkReadingExpectations(lesson.expected, result.readings);
  if (readErr) return { passed: false, reason: readErr };
  return { passed: true, reason: "passed" };
}
