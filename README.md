# CircuitLab Edu

A bilingual browser-based educational circuit builder for primary, lower-secondary and upper-secondary learners.

## Reusable packages

The project is being separated into a framework-independent simulation package and a curriculum pack:

- `packages/core` — `@circuitlabedu/core`: topology validation, static DC solving, transient RLC simulation and optional orthogonal wire-routing helper. It has no React or DOM dependency.
- `packages/react` — `@circuitlabedu/react`: responsive React SVG viewport host with auto/fixed width and height, container resize observation and configurable aspect ratio/bounds. React is a peer dependency; TypeScript consumers also need `@types/react`.
- `packages/exercise-pack-basic` — `@circuitlabedu/exercise-pack-basic`: bilingual example lessons, lesson schema validation and assessment.
- Root-level `solver.js`, `transient.js`, `wire-router.js` and `lessons.js` remain compatibility entry points for the existing browser application during migration.

From the repository root, the workspace packages can be imported as:

```js
import { solveCircuit, validateCircuit, simulateTransient } from "@circuitlabedu/core";
import { lessons, validateLesson, assessCircuit } from "@circuitlabedu/exercise-pack-basic";
```

See [Core package guide](packages/core/README.md), [React viewport guide](packages/react/README.md), [Exercise pack authoring guide](docs/EXERCISE_PACK_AUTHORING.md) and [React UI Lab](docs/REACT-UI-LAB.md). Learning content and sequencing are application-level concerns: the core solver does not define lesson order or a required learning flow. Packs can be supplied by packages or loaded as JSON. The pack's legacy `example` preset references are still app-specific; use self-contained `startingCircuit` fixtures when authoring portable exercises.

## Run locally

Requires Node.js 20+.

```sh
npm test
npm run test:types
npm run test:browser
npm run test:react-ui
npm run test:all
npm start
npm run dev:react-lab
```

Open http://localhost:4173 for the existing workbench, or http://127.0.0.1:4174/react-lab/ for the React UI Lab.

## Current features

- Drag/drop placement and movement of SVG components.
- Rotate components by 90° using the inspector control or `R`; terminals and wires follow the orientation.
- When connecting terminals, components automatically rotate to face the connected component.
- Drag a component onto a long wire segment to insert it in series; the wire is split into two connections and the component aligns to the wire.
- Battery/DC source, configurable sinusoidal AC source, lamp, resistor, switch, ammeter, voltmeter, capacitor and inductor components.
- AC source settings: peak amplitude, frequency, phase and DC offset; AC analysis runs through the time-domain transient solver.
- Terminal-to-terminal wiring with orthogonal routing around component bounds. When wire paths overlap, active-current overlays are rendered above inactive paths so a gray open branch cannot hide a live branch. The DC/transient solver data model now accepts explicit junction nodes (`j:<id>`) so several wire endpoints can share one electrical node; the visual editor, wire-splitting gesture, persistence and junction hit-testing are still pending.
- Select wires and remove them with Delete; select components and delete them with Delete/Backspace.
- Keyboard activation for terminals and components, undo and redo.
- Vietnamese/English interface and learning-level selector.
- Preset simple, series and parallel DC circuits plus a grade-filtered library of 20 lesson circuits.
- Static DC modified nodal analysis for supported resistive circuits.
- Ammeters and voltmeters represented by documented approximate input resistance.
- Linear RLC transient MNA using backward Euler, configurable duration/time step, initial storage conditions (including explicit time-zero capacitor-voltage and inductor-current readings) and a time-series chart selectable by source/component voltage, current or power. Live digital readouts appear directly above ammeters and voltmeters; passive components show voltage and current while the simulation is active, and changing a component value recomputes a running DC circuit immediately. AC sources support sine waves with configurable peak amplitude, frequency, phase and DC offset; signed AC waveforms are plotted around zero, and AC-only resistive and AC-driven RC cases are tested.
- Versioned JSON circuit save/open with structural and terminal validation.
- 20 built-in Vietnamese/English simulation lessons grouped by learning level: 4 primary, 7 lower-secondary and 9 upper-secondary lessons. Topics include complete circuits, series/parallel loads, switch logic, voltage division, Ohm’s law, meter placement, RC/RL/RLC transients and AC excitation.
- An in-app custom lesson editor, progressive hints, reset-to-start, lesson checks, transient-mode grading and portable lesson JSON import/export.

## Model limitations

- The lamp is modeled as fixed resistance. Brightness is based on calculated power; it is not a thermal filament model.
- DC analysis supports ideal DC voltage sources, fixed resistors/lamps, switches and approximate meters. AC sources, capacitors and inductors require transient simulation. It is not SPICE.
- Transient analysis supports linear RLC networks using backward Euler. It is not a nonlinear/SPICE engine; accuracy depends on the time step. Automated tests compare RC capacitor voltage and RL inductor current against analytical references; mixed RLC has finite-value and step-refinement checks, but arbitrary RLC accuracy is not established.
- Meter placement guidance beyond the ammeter-parallel warning, comprehensive topology diagnostics, allowed-action rules for lessons, full accessibility verification and real-device testing are still outstanding.
- Tests include Node.js unit/static checks plus 2,451 deterministic circuit scenarios (DC, parallel loads, RC/RL analytical references, switch combinations, AC resistive waveforms, seeded random networks and bridge-network nodal references), metamorphic/negative-input checks, Playwright Chromium desktop/mobile coverage, console-error assertions and an axe scan for serious/critical accessibility issues. See [Testing Standard](docs/TESTING.md) for the verification process and limitations. Mobile emulation skips three download assertions, one wire-history test, and the desktop mouse-drag-to-wire insertion gesture; component rotation and terminal wiring are tested on mobile.
- Use only virtual low-voltage circuits. Do not use the application to validate mains wiring or safety-critical designs.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap and acceptance criteria](docs/ROADMAP.md)
- [Testing guide](docs/TESTING.md)

A milestone is not complete merely because implementation has started. See the roadmap for current status and release gates.
