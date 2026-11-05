import { validateCircuit } from "@quyenlbv/circuitlab-core/solver";

const KNOWN_COMPONENTS = new Set([
  "battery", "acSource", "lamp", "resistor", "switch",
  "ammeter", "voltmeter", "capacitor", "inductor"
]);

export function validateLessonMetadata(lesson) {
  if (!lesson || lesson.schemaVersion !== 1 || typeof lesson.id !== "string" ||
      !/^[a-z0-9][a-z0-9-]{1,63}$/i.test(lesson.id) ||
      !["primary", "middle", "high"].includes(lesson.level)) {
    return "invalid-metadata";
  }
  if (!lesson.title || typeof lesson.title.vi !== "string" ||
      typeof lesson.title.en !== "string" || !lesson.title.vi.trim() || !lesson.title.en.trim()) {
    return "missing-localized-title";
  }
  if (!lesson.objective || typeof lesson.objective.vi !== "string" ||
      typeof lesson.objective.en !== "string" || !lesson.objective.vi.trim() || !lesson.objective.en.trim()) {
    return "missing-localized-objective";
  }
  if (lesson.hints !== undefined) {
    if (!lesson.hints || !Array.isArray(lesson.hints.vi) || !Array.isArray(lesson.hints.en) ||
        lesson.hints.vi.length > 10 || lesson.hints.en.length > 10 ||
        [...lesson.hints.vi, ...lesson.hints.en].some(h => typeof h !== "string" || h.length > 500)) {
      return "invalid-hints";
    }
  }
  return null;
}

export function validateStartingCircuit(start) {
  if (!start || start.schemaVersion !== 1 || !Array.isArray(start.components) ||
      !Array.isArray(start.wires) || (start.junctions !== undefined && !Array.isArray(start.junctions)) ||
      start.components.length > 500 || start.wires.length > 2000 || (start.junctions || []).length > 1000) {
    return "invalid-starting-circuit";
  }
  if (start.components.some(c => !c || typeof c.id !== "string" || !KNOWN_COMPONENTS.has(c.type) ||
      !Number.isFinite(c.x) || !Number.isFinite(c.y) || c.x < 0 || c.x > 900 || c.y < 0 || c.y > 510)) {
    return "invalid-starting-component";
  }
  if ((start.junctions || []).some(j => !j || !Number.isFinite(j.x) || !Number.isFinite(j.y) || j.x < 0 || j.x > 900 || j.y < 0 || j.y > 510)) {
    return "invalid-starting-junction";
  }
  const circuitValidation = validateCircuit(start.components, start.wires, start.junctions || []);
  return circuitValidation.valid ? null : "invalid-starting-topology";
}

export function validateExpectedRules(e) {
  const allowed = new Set(["componentTypes", "requireClosedCircuit", "relation", "tolerance", "minCurrent", "maxCurrent", "targetVoltage", "targetResistance", "comparison", "transientMode"]);
  if (Object.keys(e).some(k => !allowed.has(k)) || Object.keys(e).length === 0) return "unsupported-expectation";
  if (e.componentTypes !== undefined && (!Array.isArray(e.componentTypes) || e.componentTypes.length === 0 || e.componentTypes.some(t => !KNOWN_COMPONENTS.has(t)))) return "invalid-component-requirement";
  if (e.requireClosedCircuit !== undefined && typeof e.requireClosedCircuit !== "boolean") return "invalid-closed-circuit-rule";
  if (e.relation !== undefined && e.relation !== "ohms-law") return "unsupported-relation";
  if (e.comparison !== undefined && e.comparison !== "series-parallel-current") return "unsupported-comparison";
  if (e.transientMode !== undefined && !["rc", "rl", "rlc", "ac", "ac-rc"].includes(e.transientMode)) return "unsupported-transient-mode";
  for (const k of ["tolerance", "minCurrent", "maxCurrent", "targetVoltage", "targetResistance"]) {
    if (e[k] !== undefined && (!Number.isFinite(e[k]) || e[k] < 0)) return "invalid-numeric-expectation";
  }
  if (e.minCurrent !== undefined && e.maxCurrent !== undefined && e.minCurrent > e.maxCurrent) return "invalid-current-range";
  if (!e.componentTypes && !e.requireClosedCircuit && !e.relation && !e.comparison && !e.transientMode && e.minCurrent === undefined && e.maxCurrent === undefined && e.targetVoltage === undefined && e.targetResistance === undefined) return "empty-expectations";
  return null;
}

export function validateLesson(lesson) {
  const metaErr = validateLessonMetadata(lesson);
  if (metaErr) return { valid: false, reason: metaErr };
  if (lesson.startingCircuit !== undefined) {
    const circuitErr = validateStartingCircuit(lesson.startingCircuit);
    if (circuitErr) return { valid: false, reason: circuitErr };
  }
  if (!lesson.expected || typeof lesson.expected !== "object" || Array.isArray(lesson.expected)) {
    return { valid: false, reason: "missing-expectations" };
  }
  const expErr = validateExpectedRules(lesson.expected);
  if (expErr) return { valid: false, reason: expErr };
  return { valid: true };
}
