import type { CircuitComponent, Wire, Junction, LearningLevel, CircuitSolveResult } from "@circuitlabedu/core";

export interface LocalizedText {
  vi: string;
  en: string;
}

export interface StartingCircuit {
  schemaVersion: 1;
  components: CircuitComponent[];
  wires: Wire[];
  junctions?: Junction[];
}

export interface LessonExpectations {
  componentTypes?: CircuitComponent["type"][];
  requireClosedCircuit?: boolean;
  relation?: "ohms-law";
  tolerance?: number;
  minCurrent?: number;
  maxCurrent?: number;
  targetVoltage?: number;
  targetResistance?: number;
  comparison?: "series-parallel-current";
  transientMode?: "rc" | "rl" | "rlc" | "ac" | "ac-rc";
}

export interface Lesson {
  id: string;
  schemaVersion: 1;
  level: LearningLevel;
  example?: string;
  title: LocalizedText;
  objective: LocalizedText;
  hints?: { vi: string[]; en: string[] };
  startingCircuit?: StartingCircuit;
  expected: LessonExpectations;
}

export interface LessonValidationResult {
  valid: boolean;
  reason?: string;
}

export interface LessonAssessmentResult {
  passed: boolean;
  reason: string;
}

export const lessons: Lesson[];
export function validateLesson(lesson: unknown): LessonValidationResult;
export function assessCircuit(lesson: Lesson, result: CircuitSolveResult | null | undefined, components?: CircuitComponent[]): LessonAssessmentResult;
