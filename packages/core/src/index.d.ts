export type ComponentType = "battery" | "acSource" | "lamp" | "resistor" | "switch" | "ammeter" | "voltmeter" | "capacitor" | "inductor";
export type LearningLevel = "primary" | "middle" | "high";

export interface BaseComponent {
  id: string;
  type: ComponentType;
  x?: number;
  y?: number;
  rotation?: number;
  [property: string]: unknown;
}

export interface BatteryComponent extends BaseComponent {
  type: "battery";
  voltage: number;
}

export interface ACSourceComponent extends BaseComponent {
  type: "acSource";
  amplitude: number;
  frequency: number;
  phase: number;
  offset: number;
}

export interface ResistiveComponent extends BaseComponent {
  type: "resistor" | "lamp";
  resistance: number;
}

export interface SwitchComponent extends BaseComponent {
  type: "switch";
  closed: boolean;
}

export interface CapacitorComponent extends BaseComponent {
  type: "capacitor";
  capacitance: number;
  initialVoltage?: number;
}

export interface InductorComponent extends BaseComponent {
  type: "inductor";
  inductance: number;
  initialCurrent?: number;
}

export interface MeterComponent extends BaseComponent {
  type: "ammeter" | "voltmeter";
}

export type CircuitComponent = BatteryComponent | ACSourceComponent | ResistiveComponent | SwitchComponent | CapacitorComponent | InductorComponent | MeterComponent;

export interface Wire {
  id?: string;
  from: string;
  to: string;
}

export interface Junction {
  id: string;
  x: number;
  y: number;
}

export interface CircuitDiagnostic {
  code: string;
  message: string;
  componentId?: string;
  wireId?: string;
  junctionId?: string;
  terminal?: string;
}

export interface CircuitValidationResult {
  valid: boolean;
  errors: CircuitDiagnostic[];
  warnings: CircuitDiagnostic[];
}

export interface CircuitReadings {
  voltage?: number;
  current?: number;
  power?: number;
  resistance?: number;
  sourcePower?: number;
  summaryValid?: boolean;
  [reading: string]: unknown;
}

export interface CircuitSolveResult {
  ok: boolean;
  reason: string;
  message?: string;
  mode?: string;
  readings?: CircuitReadings;
  errors?: CircuitDiagnostic[];
  warnings?: CircuitDiagnostic[];
  components?: Record<string, unknown>;
  [resultField: string]: unknown;
}

export interface TransientOptions {
  duration?: number;
  step?: number;
  [option: string]: unknown;
}

export interface Point {
  x: number;
  y: number;
}

export interface Obstacle {
  l: number;
  r: number;
  t: number;
  b: number;
}

export function validateCircuit(components: CircuitComponent[], wires: Wire[], junctions?: Junction[]): CircuitValidationResult;
export function solveCircuit(components: CircuitComponent[], wires: Wire[], junctions?: Junction[]): CircuitSolveResult;
export function simulateTransient(components: CircuitComponent[], wires: Wire[], options?: TransientOptions, junctions?: Junction[]): CircuitSolveResult;
export function routeOrthogonal(start: Point, end: Point, obstacles?: Obstacle[], options?: { va?: Point | null; vb?: Point | null }): Point[];
export function getComponentObstacles(wire: Wire, components?: CircuitComponent[], junctions?: Junction[], options?: { excludeComponentId?: string | null }): Obstacle[];
export function trimSegmentObstacle(u: Point, v: Point, endpoints: Point[], thickness?: number): Obstacle | null;
export function getPriorWireObstacles(priorRoutes?: Array<{ points: Point[] }>, endpoints?: Point[], thickness?: number): Obstacle[];
export function routeWire(w: Wire, components?: CircuitComponent[], junctions?: Junction[], priorRoutes?: Array<{ points: Point[] }>, options?: { excludeComponentId?: string | null }): Point[];
export function rotatePoint(x: number, y: number, angle?: number): Point;
export function getTerminalCoord(c: CircuitComponent, s: "a" | "b" | string): Point;
export function terminalVector(c?: CircuitComponent | null, s?: "a" | "b" | string, length?: number): Point;

export { normalizeViewportConfig, resolveViewportSize } from "./viewport.js";
export type { ViewportConfig, NormalizedViewportConfig, ViewportContainerSize, ResolvedViewportSize, ViewportDimension } from "./viewport.js";
