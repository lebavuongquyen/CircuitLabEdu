# Architecture

## Product boundary

CircuitLab Edu is a standalone browser application. The core editor, static DC solver, lesson data and linear RLC transient solver (including a sinusoidal AC voltage source) do not require accounts, a backend or a third-party simulation API. Circuit files use a versioned JSON document format.

## Package boundaries

The repository uses npm workspaces for independently addressable packages:

- `@circuitlabedu/core` owns circuit validation, static DC and transient solvers, and a UI-independent orthogonal routing helper. It must not import React, DOM APIs, the application shell, or curriculum data.
- `@circuitlabedu/react` provides a responsive React SVG viewport host. It observes container changes and accepts fixed or automatic dimensions; it is a presentation adapter, not the circuit editor itself.
- `@circuitlabedu/exercise-pack-basic` owns sample lesson records, lesson schema validation and assessment. It depends on the core public API and must not be imported by core.
- The browser app remains at the repository root during the compatibility migration. Root-level module files re-export the package modules so existing app and test imports keep working while consumers move to package entry points.

The core exports DOM-free viewport configuration helpers (`normalizeViewportConfig` and `resolveViewportSize`) so non-React integrations can share the same size rules. The current pack still contains legacy `example` fields that are resolved by application presets. They are not portable circuit fixtures. Portable external packs should use `startingCircuit`; the authoring guide records the remaining schema and grading limitations.

## Runtime layers

- **Presentation:** `index.html` and `styles.css` provide the responsive workbench, SVG circuit view, component palette, measurements, level/language controls and transient chart.
- **Editor state and interaction:** `app.js` owns component/wire state, selection, undo/redo history, lessons, JSON persistence, SVG rendering, pointer and keyboard interactions. Component dragging tracks pointer movement at document scope so rerendering SVG nodes does not interrupt a drag. A switch toggles only on pointer release when movement stayed below the drag threshold; dragging it moves the component without toggling its state.
- **Circuit model and validation:** `solver.js` validates component IDs, supported component types, terminal references, wire duplication and component parameters before static analysis.
- **Static DC solver:** `solver.js` builds a modified nodal analysis matrix and solves it with Gaussian elimination. Supported DC elements are an ideal DC voltage source, fixed-resistance resistor/lamp, low-resistance closed switch, open switch, low-resistance ammeter and high-input-resistance voltmeter.
- **Wire routing:** `wire-router.js` calculates orthogonal routes with component obstacle bounds. Routing is a visual layer; wires remain terminal-to-terminal graph edges independent of path geometry.
- **Transient solver:** `transient.js` implements backward-Euler transient modified nodal analysis for linear RLC networks with ideal DC sources and sinusoidal AC sources, resistors/lamps, switches and approximate meters. The AC source uses peak amplitude, frequency, phase and DC offset. The solver supports capacitor initial voltages, inductor initial currents, configurable time step/duration and a sample-count cap. It is not a nonlinear or SPICE-compatible engine.
- **Lesson schema and checks:** `lessons.js` contains 20 versioned Vietnamese/English built-in lessons grouped by `primary`, `middle` and `high`, plus schema validation and assessment for component requirements, closed circuits, Ohm's law, comparison rules and transient solver modes. Each built-in lesson maps to a circuit preset; transient lessons run the transient solver and grade its returned mode. `app.js` filters the curriculum by selected level and provides custom lesson create/edit, progressive hints, reset, assessment and portable JSON import/export. The series/parallel comparison uses results from both built-in sample configurations.
- **Delivery:** `server.mjs` is a dependency-free static development server. Static hosting can serve the same application files.

## Electrical assumptions

- Battery is an ideal DC voltage source. The AC source is an ideal sinusoidal voltage source and must be analyzed in transient mode; its amplitude setting is peak amplitude, not RMS.
- Lamp is represented by fixed resistance. Brightness is an educational power indicator, not a thermal filament simulation.
- Resistor is fixed and ohmic.
- Closed switch is modeled as a small resistance; open switch is an open branch.
- Ammeter is modeled with a small series resistance; voltmeter with a very large input resistance. Placement guidance and formal invalid-placement detection remain incomplete.
- Wires are ideal and have no resistance.
- UI current/voltage readings are magnitudes; signed branch current follows the component's terminal-a-to-terminal-b reference direction. Source signed power is positive when delivering energy and negative when absorbing it; displayed power is a non-negative consumption value.
- The static solver reports direct source shorts, invalid terminal references, unsupported transient components, and singular/inconsistent networks.
- Transient simulation uses backward Euler for supported linear RLC networks. Numerical accuracy depends on time-step choice. Automated references cover RC capacitor voltage and RL inductor current, while mixed RLC currently has finite-value and time-step-refinement checks. Initial capacitor voltage and inductor current are exposed in the initial sample; other device readings at t=0 are marked uninitialized until the network solve runs; arbitrary RLC accuracy remains unverified. Transient switch-event/discontinuity handling is not implemented.
- The simulator is for virtual low-voltage education, not safety-critical engineering or validation of real-world wiring.

## State and persistence invariants

- A wire references two existing component terminals; visual routing never changes electrical connectivity.
- A component deletion removes wires attached to its terminals.
- Circuit edits invalidate stale simulation results. During a running DC simulation, changing a switch state recomputes the DC solution immediately without stopping the simulation.
- JSON import validates schema version, array shapes, item count limits, component IDs/positions, wire references and supported component types before replacing the live circuit.
- Undo/redo snapshots include component positions, properties, wires, IDs and selected learning level.
- Static DC and transient analysis are separate modes. AC sources, capacitors and inductors are rejected by the DC solver with a message directing the user to transient mode.

## Extension points

- Keep component rendering independent from electrical behavior.
- Keep routing independent from solver calculations.
- Expand diagnostics into a separate domain validation layer before adding nonlinear or larger networks.
- Extend the transient solver only after analytical fixtures, convergence checks and performance limits are defined.
- A future SPICE integration must be an explicit adapter with comparative validation fixtures, not a claim based on interface similarity.
