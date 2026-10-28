# CircuitLab Edu — Product Roadmap

**Status date:** 2026-10-23  
**Current package version:** 0.1.0 (private development build)  
**Overall status:** Functional MVP with desktop/mobile browser coverage; not yet a release-complete educational simulator.

## 1. Product vision

CircuitLab Edu is a bilingual browser workbench for learning electricity by building and simulating circuits. Learners drag SVG devices onto a workbench, connect terminals, operate switches, inspect measurements, and relate a device-oriented view to the circuit's electrical behavior.

Learning levels:

- **Primary:** simple language, battery/lamp/switch, guided cause and effect.
- **Lower secondary:** series/parallel circuits, current, voltage, resistance, meters and guided experiments.
- **Upper secondary:** quantitative DC analysis, power, polarity, circuit validation and transient RLC behavior.

The learning level changes explanation, available guidance and task complexity. It must not silently change the electrical laws used by the solver.

## 2. Current implementation audit

### Implemented and verified

- [x] Browser workbench with Vietnamese/English labels and three learning levels.
- [x] SVG battery, AC source, lamp, resistor, switch, ammeter, voltmeter, capacitor and inductor.
- [x] Palette placement and component movement; palette placement chooses an available workbench position to reduce accidental overlap.
- [x] Rotate components in 90-degree increments with the inspector button or `R`; terminal coordinates and wire routing follow component orientation.
- [x] Auto-orient connected terminals toward one another when creating a wire.
- [x] Drag an existing component onto a sufficiently long wire segment to insert it in series, align it with the wire, and split the connection into two wires.
- [x] Switch interaction regression fixed: pointer drag moves the switch without toggling; a click toggles without moving. Verified in desktop and mobile Chromium.
- [x] Terminal-to-terminal wires, orthogonal routing and component-obstacle avoidance.
- [x] Wire selection by mouse and mobile touch; Delete removes the selected wire.
- [x] Keyboard activation for component nodes and terminals, Delete/Backspace component removal, undo and redo.
- [x] Versioned JSON save/open and import validation before replacing current state.
- [x] DC modified nodal analysis for supported resistive circuits, including Gaussian elimination, source polarity, multiple series sources and structured failure results.
- [x] Approximate ammeter/voltmeter models, ammeter-parallel warnings and a heuristic warning when a voltmeter is not across a single component branch.
- [x] Unconnected terminal diagnostics.
- [x] Backward-Euler transient MNA for linear resistor/capacitor/inductor circuits with ideal DC and sinusoidal AC voltage sources, switches and approximate meters.
- [x] Transient duration/step controls and response chart with selectable source/component voltage, current and power traces.
- [x] 20 bilingual built-in simulation lessons grouped by level (4 primary, 7 middle-school, 9 high-school), covering closed circuits, switches, series/parallel, mixed networks, voltage division, Ohm’s law, meters, RC/RL/RLC and AC.
- [x] Grade-filtered lesson catalog with localized objectives and hints, preset loading, transient-mode grading, in-app custom lesson create/edit/preview, reset-to-start and portable JSON import/export.
- [x] Automated Node.js unit/static tests, including 2,466 deterministic circuit scenarios across DC, parallel networks, RC/RL transients, switch combinations, AC resistive waveforms, seeded random networks and bridge-network nodal references; includes two adversarial numerical-safety scenarios, metamorphic checks and malformed-input tests.
- [x] Playwright Chromium tests for desktop/mobile including terminal wiring, wire selection/deletion, DC values, transient UI, undo/redo, import, lesson authoring and responsive checks.
- [x] Every browser test fails on uncaught page/console errors; axe blocks serious and critical accessibility violations.

### Latest verification checkpoint

- Unit/static suite: **90 passed, 0 failed**; this includes explicit-junction tests, KCL/source-voltage/power-balance guards, exact transient endpoint timing, analytical RLC and AC-RC references, storage-parameter boundaries, custom-lesson junction validation, honest initial-state readings, and undefined multi-source aggregate measurements. Deterministic numerical inventory: **2,466 scenarios**.
- Browser suite: **58 passed, 0 failed, 6 skipped** across desktop and mobile Chromium projects (64 total) at the latest junction-editor checkpoint. The new desktop wire-junction regression passes; its mobile counterpart is explicitly skipped until a touch-native junction gesture is implemented. Other skips cover download-event assertions under mobile emulation, mobile wire undo/redo history, and desktop-mouse drag-to-wire insertion.
- Curriculum QA: all **20 built-in lesson presets** open and pass their supported grading checks in desktop and mobile Chromium; RC, RL, RLC, AC-resistive and AC-RC presets each produce the expected transient mode. No page or console errors were observed during the curriculum sweep.
- Visual QA: desktop and mobile screenshots reviewed. Fixed the bench action toolbar wrapping and grade selector state so the selected level and visible lesson cards remain synchronized; page horizontal overflow stayed at zero at 412px mobile width.
- Added deterministic topology fixtures for isolated single-component branches and disconnected multi-component subnetworks, including a negative test proving source-connected loads do not trigger floating-branch warnings.
- Transient readings now expose `signedPower` separately from non-negative displayed `power`: source signed power follows the source-delivery convention, while capacitor/inductor signed power follows the passive sign convention. Added an AC-RC regression checking component sign conventions and source-power consistency.
- Fixed the lesson ID input pattern for Chromium's Unicode Sets (`v`) regular-expression behavior; the full browser suite passes after the fix.
- Switch drag-vs-click regression: **passed on desktop and mobile Chromium**; dragging preserves switch state, while a click toggles state without moving the component.
- Editor history regressions now cover component creation, deletion with attached-wire restoration, property edits, switch state/position and wire deletion undo/redo on desktop.
- DC solver verification added: reversed-polarity KVL fixture and source/load power balance including switch and ammeter internal resistance.
- Added a browser regression for reversed terminal polarity: wire animation reverses in desktop and mobile Chromium. The DC Gaussian pivot tolerance is now scaled using machine precision and matrix size; the low-resistance boundary regression passes.
- Added a configurable sinusoidal AC source (peak amplitude, frequency, phase and DC offset) to the palette and transient MNA solver. Unit tests verify source polarity changes over a cycle and AC operation with both RC and resistive-only loads; a browser test covers the AC-driven RC workflow. The DC solver directs AC-source circuits to transient simulation.
- Fixed AC palette nodes displaying `undefined` by adding the missing localized component label. Reworked the transient chart to display signed values around a zero baseline and added a signal selector for source voltage plus every component's voltage, current and power. The default time step is now 1 ms so a 50 Hz waveform is visually resolved. Added a desktop/mobile browser regression for AC naming, waveform bounds and selecting a component-current trace.
- Switch toggles during a running DC simulation now recalculate readings without stopping the simulation; desktop and mobile browser regressions cover opening and reclosing a switch. Fixed overlapping-wire paint order: base wire geometry and hit targets render first, then active-current overlays render above every base wire with pointer events disabled. A regression deliberately renders the open parallel branch after the live branch and verifies the shared source lead plus overlay stacking in desktop/mobile Chromium. Transient switch-event/discontinuity handling remains outstanding. Added analytical RL convergence and mixed-RLC finite/refinement regression checks; these do not establish accuracy for arbitrary RLC networks. The transient solver now returns capacitor initial voltage and inductor initial current in its time-zero component readings; the remaining passive-device readings at t=0 are explicitly marked as not initialized.
- Expanded the deterministic circuit verification inventory to 2,466 scenarios: 400 DC series circuits, 225 parallel-resistor networks, 100 RC analytical endpoints, 100 RL analytical endpoints, 126 switch combinations, 100 AC resistive waveforms, 500 seeded random parallel networks and 300 seeded random series networks. Added permutation-invariance and malformed-input/invalid-options checks. The generated suite found unsafe handling of malformed transient component/options inputs; the API now returns structured failures rather than throwing. Added 500 unbalanced bridge cases using independent nodal equations and 100 balanced Wheatstone cases; focused bridge tests pass. The earlier sample-count floating-point defect remains covered by final-time assertions.
- The tests do not establish engineering-grade accuracy, full accessibility conformance, or compatibility with every physical phone/browser. Mixed RLC currently has boundedness/refinement checks, not a comprehensive analytical reference suite.

## 3. Milestones

## M01 — Workbench interaction and visual foundation

**Status: Complete for the current MVP scope.**

- [x] Responsive bilingual workbench and learning-level selector.
- [x] SVG palette and device artwork.
- [x] Drag/drop placement, movement and terminal connections.
- [x] Orthogonal wire routing with component obstacles and previously routed wire segments as collision obstacles.
- [x] Click/touch-to-select wire and Delete-to-remove behavior.
- [x] Sample simple, series and parallel circuits.
- [x] Browser smoke tests at desktop and mobile viewport sizes.
- [x] Regression test for switch drag-vs-click behavior in desktop and mobile Chromium.

**Acceptance evidence:** Playwright tests pass for sample loading, DC measurements, wire selection/removal, terminal wiring, and mobile layout.

## M02 — Editor reliability and topology diagnostics

**Status: Partially complete.**

- [x] Undo and redo for recorded edits, with browser coverage for component creation.
- [x] Keyboard activation of terminals and components.
- [x] Delete/Backspace handling that does not intercept editable input fields.
- [x] Safe versioned import shape checks, item-count limits, duplicate component checks and wire-terminal validation.
- [x] Unconnected-terminal warnings and an ammeter-parallel warning.
- [x] Palette placement avoids common component overlap.
- [x] Add warnings for dangling terminals, isolated component branches and likely meter-placement errors.
- [ ] Complete graph validation for all disconnected branches, duplicate/conflicting connections and underdetermined topologies.
- [x] Add deterministic route-failure reporting and a red dashed fallback with an explicit warning.
- [x] Add dense-layout, boundary-coordinate and wire-crossing-obstacle route regressions; verify every segment is orthogonal and collision-free.
- [x] Route around previously drawn wire segments to reduce unrelated wire crossings.
- [x] Make clear-circuit reversible through undo history.
- [x] Restore keyboard focus after rerender and test keyboard terminal wiring.
- [x] Add undo/redo regressions for property edits, wire edits, movement, switch toggles and deletion.
- [x] Add an undo-after-import regression on desktop and mobile.
- [ ] Expand touch tests to every editor action.

**Acceptance criteria**

1. Invalid JSON must never partially replace the live circuit.
2. Every topology diagnostic must have a deterministic fixture.
3. Undo/redo must restore both circuit topology and component properties exactly.
4. Moving a component preserves existing electrical connectivity unless the user intentionally drops it onto a wire to insert it in series.
5. Routing must report when a collision-free path cannot be found rather than imply success.

## M03 — DC solver verification

**Status: Core implementation complete; verification remains incomplete.**

- [x] Modified nodal analysis and Gaussian elimination.
- [x] Fixed-resistance lamp/resistor, open/closed switch, ideal voltage source, ideal wire and approximate meter models.
- [x] Structured errors for missing source, source short, invalid terminal references, unsupported transient elements and singular networks.
- [x] Tests for open/closed circuits, parallel loads, source short, series sources, conflicting sources, meters and signed source power.
- [x] Add explicit KCL assertion for a parallel-load circuit.
- [x] Add a reversed-polarity KVL regression fixture.
- [x] Add zero-voltage source / zero-current fixture.
- [ ] Expand zero-current coverage to additional topologies and edge cases.
- [x] Add power-balance assertion including meter internal resistance and switch resistance.
- [ ] Extend power-balance coverage to all supported passive network topologies.
- [x] Document signed current, signed voltage and power conventions in the UI/help.
- [x] Define supported DC source/resistance ranges and test low/high resistance scales.
- [x] Verify post-solve KCL residuals and withhold DC readings when an extreme resistance ratio causes numerically inconsistent branch currents.
- [x] Preserve the known source voltage in open-circuit readings and withhold aggregate voltage/current/equivalent-resistance metrics for branched multi-source DC networks when they are not physically meaningful.
- [ ] Add a broader tolerance policy and fixtures for near-singular matrices.
- [x] Add per-component voltage/current/power display in the inspector.
- [x] Reverse wire-current animation for connections whose inferred branch-current direction opposes the wire path.
- [ ] Add explicit branch-current direction arrows and voltage-polarity markers; direction inference remains approximate at multi-branch junctions.
- [x] Add solver-level explicit junction nodes (`j:<id>`) and validate junction IDs/coordinates and wire endpoint references; DC and transient node assembly can union wire endpoints through shared junction IDs.
- [x] Add desktop junction creation by double-clicking a wire, junction rendering/terminal hit-testing, circuit JSON save/load and undo/redo snapshot support; desktop browser regression verifies that splitting adds an explicit junction and wire segment.
- [x] Prune orphaned junctions when deleting components or wires, and preserve pending junction selection in undo/redo snapshots.
- [ ] Add a dedicated mobile touch gesture for junction creation, persist junctions in custom lesson starting circuits, and add a regression proving geometric crossings alone do not connect nets.

**Acceptance criteria**

1. KCL/KVL and power-balance checks pass within documented tolerances.
2. Invalid or singular networks produce structured errors, not uncaught exceptions.
3. Measurements are cleared whenever circuit topology or parameters change.
4. Displayed quantities and sign conventions match the actual solver model.

## M04 — Measurement instruments

**Status: Basic models implemented; instructional rules incomplete.**

- [x] Ammeter component and low internal resistance model.
- [x] Voltmeter component and high input resistance model.
- [x] Warn when an ammeter appears parallel-connected or a voltmeter is not across a single component branch.
- [x] Provide explicit localized series/parallel connection instructions in the inspector.
- [ ] Improve placement diagnostics to reduce false positives for valid multi-component voltage measurements.
- [x] Show voltage/current/power readings for the selected component in the inspector.
- [ ] Show branch-level readings for selected wires.
- [ ] Add optional current-direction arrows and polarity markers.
- [x] Validate meter models against hand-calculated/reference fixtures.

**Acceptance criteria**

1. Meter placement warnings are tested against valid and invalid examples.
2. Readings match the documented idealized or finite-resistance model.
3. The UI explains how to correct invalid placement.

## M05 — Guided lessons and teacher content

**Status: Built-in/custom lesson authoring, import/export and basic assessment implemented; advanced rules incomplete.**

- [x] Versioned bilingual lesson objects for closed-circuit, series/parallel and Ohm's law topics.
- [x] Basic “check circuit” action.
- [x] Series/parallel preset comparison that checks the relative current result.
- [x] Add progressive bilingual hints and reset-to-start behavior.
- [x] Add component requirements, closed-circuit checks and numerical lesson rules.
- [x] Add a portable lesson import/export format separate from circuit JSON.
- [x] Add in-app teacher create/edit/preview/export workflow for custom lessons, including an optional starting circuit.
- [x] Add numeric tolerances and schema validation for imported lesson expectations.
- [ ] Add allowed-action rules and richer graph-topology constraints.
- [x] Add a broader lesson set covering current, voltage, resistance, switches, series/parallel, mixed networks, meters, power and AC/RLC behavior at appropriate levels.
- [ ] Add polarity-focused lessons with explicit signed-voltage and current-direction grading, plus richer topology-specific rubrics.
- [ ] Verify localization fallback for all lesson text and feedback.

**Acceptance criteria**

1. Lessons export/import deterministically and invalid lesson files are rejected safely.
2. Assessments verify required components, topology and numerical conditions.
3. Hints support learning without hard-coding a solver answer as the circuit result.

## M06 — Browser QA, accessibility and release readiness

**Status: Automated desktop/mobile browser tests implemented; full release QA incomplete.**

- [x] Playwright configured with desktop and mobile Chromium projects.
- [x] Browser tests for bilingual labels, level selection, sample currents, wire selection/deletion, terminal wiring, transient graph, undo/redo, valid/invalid import, switch click-vs-drag, custom lesson authoring/hints/reset/export and mobile overflow.
- [x] Unit/static and browser commands exposed through package scripts.
- [x] Add an automated axe scan that blocks serious and critical accessibility violations in desktop and mobile Chromium.
- [x] Add before/after browser checks for uncaught page errors and console errors across every critical interaction flow.
- [x] Add touch tests for wire selection/deletion and switch toggling/drag behavior; add keyboard terminal wiring and focus-restoration tests.
- [x] Visually inspect desktop and mobile curriculum/workbench layouts; verify the grade catalog and bench controls wrap without horizontal page overflow. Temporary screenshots are kept outside the project tree.
- [ ] Add persistent screenshot baselines and high-zoom/long-translation visual regression checks.
- [ ] Complete screen-reader, full keyboard-only and WCAG conformance audits beyond the automated axe gate.
- [ ] Test high zoom, long translations, dense circuits and reduced-motion settings.
- [x] Add GitHub Actions CI and document browser installation requirements.
- [ ] Run clean-checkout verification and finalize release notes before any public release.

**Acceptance criteria**

1. Unit/static and browser suites pass from a clean checkout.
2. Core flows have no uncaught errors or blocking visual defects.
3. Touch and keyboard behaviors are tested explicitly.
4. Release notes describe only behavior verified by tests.

## M07 — Transient physics and advanced models

**Status: Linear RLC transient foundation implemented; advanced physics remains incomplete.**

- [x] Backward-Euler transient MNA for supported linear RLC networks.
- [x] Multiple ideal DC/AC voltage sources, resistive loads, capacitors and inductors in the transient solver.
- [x] Configurable sinusoidal AC source with peak amplitude, frequency, phase and DC offset; AC circuits route through the transient solver rather than the DC solver.
- [x] Capacitor initial-voltage and inductor initial-current inputs.
- [x] Configurable duration and time step with sample-count limits; the solver now uses a shorter final integration step when duration is not divisible by the requested step and includes the exact requested end time.
- [x] Compare 12 underdamped series-RLC cases against closed-form current responses and verify finer backward-Euler steps reduce analytical error.
- [x] Compare AC-driven RC capacitor voltage with the closed-form sinusoidal steady-state amplitude and phase.
- [x] Mark unsolved t=0 component currents/voltages as unavailable instead of plotting artificial zeros; warn when estimated RC/RL/RLC dynamics or AC sampling may be too fast for the requested time step.
- [x] Selectable time-series chart for source voltage and each component's voltage, current or power; AC waveforms are centered around zero and stay inside chart bounds.
- [x] RC, RL and mixed RLC regression fixtures.
- [x] Add an analytical RC reference and a time-step convergence regression.
- [x] Add an analytical RL current reference and verify that reducing the backward-Euler step reduces the endpoint error.
- [x] Add mixed-RLC finite-value and step-refinement consistency checks.
- [ ] Add an analytical reference solution for mixed RLC waveforms and broader parameter sweeps.
- [ ] Add event-driven switch changes and discontinuity handling for transient simulation; current switch-preserving refresh is implemented for DC runs only.
- [ ] Plot selected wire/branch current values and expose simulation data for export.
- [ ] Benchmark larger networks and define supported circuit-size limits.
- [ ] Add nonlinear devices only with documented models and validated fixtures.
- [ ] Evaluate SPICE compatibility only if justified; do not claim SPICE equivalence without comparative tests.

**Acceptance criteria**

1. Transient results remain finite for supported cases and fail clearly for singular networks.
2. Time-step convergence is measured against analytical/reference circuits.
3. Performance limits and numerical assumptions are documented.
4. Any nonlinear/SPICE claim is supported by comparison fixtures.

## 4. Cross-cutting requirements

### Learning levels
- Level changes language, guidance, visibility and task complexity—not the electrical laws.
- Each new component/lesson must state which learning levels it supports.

### Localization
- All visible interface strings must be localized in Vietnamese and English.
- Solver/routing code must not contain hard-coded presentation text.

### Architecture
- Keep circuit topology independent of SVG rendering and wire routing.
- Validate external JSON before mutating editor state.
- Keep DC and transient solvers separate with explicit component-model boundaries.
- Add dependencies only for a documented need and keep the app usable as a static site.

### Safety and scope
- This is a virtual low-voltage educational simulator, not a safety-critical engineering tool.
- A fixed-resistance lamp is not a thermal filament model.
- The linear RLC transient solver is not a full SPICE engine.
- Never use this application to validate mains wiring or real-world electrical safety.

## 5. Definition of done

A feature is complete only when:

- [ ] Behavior, assumptions and limitations are documented.
- [ ] Unit tests cover normal cases, edge cases and failure paths.
- [ ] Browser tests cover user-visible behavior where applicable.
- [ ] Vietnamese and English UI strings are provided.
- [ ] Keyboard/touch and responsive behavior are verified.
- [ ] No stale measurements or misleading success states remain.
- [ ] README, architecture and roadmap match the implementation.
- [ ] Release notes list actual test evidence and remaining limitations.

## 6. Deferred scope

Not promised by the current 0.1.0 development build:

- Accounts, cloud sync, classrooms and collaboration.
- Mandatory backend services or external simulation APIs.
- Nonlinear semiconductor/device libraries and engineering-grade certification.
- Full SPICE compatibility.
- Advanced rubric-based grading beyond the current component-presence, closed-circuit, Ohm’s-law, comparison and transient-mode checks.
