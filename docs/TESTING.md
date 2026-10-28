# Testing and Numerical Verification Standard — CircuitLab Edu

## 1. Purpose and release principle

CircuitLab Edu is educational software. Electrical correctness takes priority over visual polish and feature count. A passing test suite is evidence for the tested cases only; it is not proof that every circuit is correct.

Never describe the simulator as SPICE-equivalent or engineering-grade unless that claim is independently validated. Keep documented solver assumptions visible to users and lesson authors.

## 2. Test commands

Run from the project root with the supported Node.js version:

- `npm test` — deterministic Node.js unit, numerical, property, negative-input and static checks.
- `npm run test:browser` — Playwright desktop/mobile Chromium regression suite.
- `npm run test:all` — required pre-merge and pre-release command; both suites must pass.
- `npm start` — start the local workbench for manual inspection.

If Chromium is not installed, run `npx playwright install chromium`.

## 3. Current automated verification inventory

### Numerical and solver cases

The deterministic numerical inventory contains **more than 2,500 circuit scenarios** across the enumerated matrices below. The listed matrix counts are a coverage inventory, not a count of every individual sample/assertion; focused regression cases are listed separately where appropriate:

- 400 DC series circuits checked against Ohm's law, voltage, current and power balance.
- 225 parallel-resistor circuits checked against conductance addition, branch currents and power balance.
- 100 RC transient cases checked against the analytical capacitor charging response.
- 100 RL transient cases checked against the analytical inductor-current response.
- 126 switch-state combinations across one to six series switches.
- 100 sinusoidal AC resistive circuits checked at every sampled instant.
- 500 seeded random parallel networks with 2–8 branches, independently calculated branch currents and power conservation.
- 300 seeded random series networks with 2–8 resistors, checked against Ohm's law, KVL voltage sums, branch currents and power balance.
- 500 seeded unbalanced bridge networks compared with independent 2-node nodal equations, including branch voltage/current, power and source/load balance.
- 100 balanced Wheatstone bridge networks checked for equal divider voltages and near-zero bridge current.
- 12 underdamped series-RLC parameter sets compared with closed-form step-response current; each compares coarse/fine backward-Euler steps and checks error reduction.
- 3 critically damped/overdamped series-RLC cases compared with independent closed-form step-response current, including full-trajectory finiteness, branch-current continuity and time-step refinement.
- 36 AC RL/RLC parameter sets compared against independent sinusoidal phasor references across the final two cycles, checking maximum and RMS waveform error, KVL residual and series-current continuity; acceptance limits are 1.2% normalized maximum error and 0.8% normalized RMS error.
- 16 AC RL frequency-sweep cases across 10–1,000 Hz, resistance and inductance scales, compared against independent phasor current and inductor-voltage references; checks peak/RMS error, KVL and current continuity.
- 24 AC RC frequency-sweep cases across 10–1,000 Hz, resistance and capacitance scales, compared against independent capacitor-voltage amplitude/phase and current phasor references; checks peak/RMS waveform error, KVL and current continuity.
- 32 AC series-RLC frequency-sweep cases across 10–1,000 Hz, resistance, inductance and capacitance scales, compared against independent complex-impedance phasors for current and each component voltage; checks maximum/RMS current error, per-component voltage error, KVL and series-current continuity. Simulation duration includes RC and RL settling-time estimates to avoid treating an incompletely settled waveform as steady state.
- 8 exact-resonance series-RLC cases at each tested circuit's calculated resonant frequency, across two resistance, inductance and capacitance scales; checks the expected current amplitude/phase, component voltage waveforms, cancellation of inductor and capacitor voltages, KVL and series-current continuity using a finer time step near resonance.
- A switch-state transition test transfers non-zero capacitor voltage and inductor current between simulation segments and checks the initial state plus KCL/series-current consistency after switching. This validates state handoff, not event-integrated switching inside a single transient run.
- An extreme but supported RC case with 1 micro-ohm resistance and 1 megafarad capacitance is checked against the exact backward-Euler recurrence, including every sample and series-current continuity.
- AC-driven RC steady-state waveforms compared with analytical capacitor-voltage amplitude and phase, including a 5 kHz case that compares coarse and fine time steps against an independent phasor reference and verifies the undersampling warning.
- Adversarial numerical-safety coverage rejects ill-conditioned extreme-resistance DC/transient networks, conflicting parallel ideal voltage sources, and electrically floating passive subnetworks; it also verifies exact simulation end time when the final step is shorter than the nominal step.
- Mutation checks confirm that reversing the inductor-current sign and reversing the capacitor-current update are detected by regression/property guards; the capacitor mutation is tested against a temporary isolated copy of the solver, never the working implementation.

Additional checks cover KCL and voltage-source residual rejection for ill-conditioned resistance ratios, transient completion at a non-divisible final time step, time-step warnings, unavailable initial-state readings, signed instantaneous power for AC sources and storage components, component/wire permutation invariance, malformed component/wire structures, invalid transient options, topology diagnostics, routing obstacles, lesson schemas and UI DOM contracts. The seeded random suite uses a fixed seed so failures are reproducible.

### Browser regression coverage

Playwright covers desktop and mobile Chromium: circuit editing and terminal wiring, wire routing and selection, switch click-versus-drag, DC measurements, transient charts, AC naming and waveform bounds, live meter values, undo/redo, import validation, lesson authoring and grading, responsive layout, browser/console errors and automated accessibility checks. AC transient UI regressions sample live wire overlays over time and verify signed direction changes with instantaneous current for resistive AC, series RL and series RLC circuits; the RL/RLC cases assert that every series wire displays both current directions. DC-offset AC cases whose positive and negative offsets exceed the amplitude verify that current neither falsely reverses nor keeps the same direction when the offset sign flips. Lifecycle regressions verify that editing a component invalidates transient flow overlays and that starting a DC run stops transient frame updates while preserving the correct DC direction. These checks validate the DOM direction state and do not claim literal arrowheads or prove every topology. A wall-clock playback regression verifies that the animation advances through simulation time at real-time speed rather than compressing/expanding time based on sample count. A desktop fake-clock regression verifies that the overlay becomes neutral at a deliberately aligned AC current zero crossing; it is excluded from mobile emulation because its fake performance clock is not aligned with interval advancement there. A high-frequency UI regression verifies that the 40 ms animation cadence displays an explicit limitation warning above 12.5 Hz; the animation can skip reversals and must not be treated as an accurate high-frequency direction trace. The parallel-switch regression deliberately puts the open branch after the live branch in render order and verifies that the shared source lead is geometrically coincident while the live-current overlay remains the final painted layer.

Some browser tests are intentionally skipped under mobile emulation when the gesture or download API cannot be faithfully represented. A skipped test is not a pass; its limitation must be documented and an equivalent test should be added when practical.

## 4. Required test layers

Every meaningful change should be covered at the lowest reliable layer, then checked at higher layers when relevant:

1. **Unit tests:** individual solver rules, validation, units, sign conventions and failure codes.
2. **Reference tests:** compare numerical results to independently derived analytical solutions or trusted reference outputs.
3. **Property tests:** enforce invariants such as KCL/KVL, power conservation, finite outputs, branch laws and bounds across many inputs.
4. **Metamorphic tests:** change component ordering, wire ordering, equivalent representation or scale without changing the expected physical result.
5. **Negative tests:** malformed input, unsupported topologies, missing terminals, source shorts, floating branches, invalid parameters, singular systems, ill-conditioned numerical solutions and complexity limits must fail safely. DC/transient results are withheld when computed branch currents violate KCL beyond `max(1e-15 A, 1e-7 × maximum branch current)`; DC source constraints use `max(1e-9 V, 1e-8 × maximum source voltage)`, and DC power balance uses `max(1e-15 W, 1e-7 × power scale).` Initial-state readings that the solver has not calculated are represented as unavailable, not zero. The time-step warning is a conservative component-value estimate, not a topology-aware accuracy guarantee; absence of a warning does not certify arbitrary-circuit accuracy.
6. **Regression tests:** every confirmed bug gets a focused test that fails before the fix and passes after it.
7. **Browser integration tests:** verify the UI uses the solver's current result and never shows stale measurements after a circuit edit.
8. **Manual educational review:** verify wording, units, sign conventions, assumptions and expected learner observations against the curriculum.

## 5. Numerical reference and tolerance policy

- Derive expected values independently from the implementation under test. Do not call the same solver to generate its own expected answer.
- State the reference equation and unit in the test name or test description.
- Use combined absolute and relative tolerances. Avoid one broad tolerance that hides large relative error near zero.
- Choose tolerance from the numerical method and physical scale. Document why it is suitable; do not loosen tolerance simply to make a failing test pass. The transient Gaussian elimination pivot guard is scaled to the active pivot row rather than the largest coefficient anywhere in the matrix; regression coverage must continue to prove both that valid high-conductance RC networks solve accurately and that singular/ill-conditioned networks fail safely.
- For transient integration, check the full trajectory where practical, not just the final sample. Check initial conditions, sample count, sample timestamps, monotonicity or bounds only where physics guarantees them, and convergence as the time step is refined.
- For backward Euler, account for its numerical damping and finite-step error. Do not compare finite-step output to an exact continuous solution using an unjustifiably tight tolerance.
- Check signed voltage/current separately from absolute meter display values.
- Check units explicitly: V, A, ohm, W, F, H, s and Hz.
- When an analytical solution is unavailable, use independent reference data, limiting cases, conservation laws, refinement studies and clearly label the remaining uncertainty.

## 6. Reproducible generated tests

- Use a fixed seed by default and print the seed plus case parameters on failure.
- Cover normal values, boundaries, logarithmically distributed scales and invalid values.
- Keep generated cases deterministic in CI; do not rely on unseeded randomness or external network access.
- Add shrinking/minimization or save the failing generated input as a permanent fixture when a generated case finds a defect.
- Track the number of circuit scenarios separately from the number of test functions and assertion count. A thousand generated scenarios do not imply a thousand independent physical laws have been verified.

## 7. Change workflow

1. Identify the physical rule or behavior being changed and write the expected equation/acceptance criterion.
2. Add a failing regression or reference test before changing implementation whenever practical.
3. Implement the smallest coherent fix.
4. Run the focused test file, then `npm test`.
5. Run `npm run test:browser` for UI, solver/UI integration, interaction or state-management changes.
6. Run `npm run test:all` before considering the work complete.
7. Review failures and skips; never hide a failure by weakening assertions or skipping the test without an explained limitation.
8. Review the final diff, docs, known limitations and CI output. Keep the working tree and test evidence auditable.

## 8. CI and release gates

The CI pipeline must install locked dependencies, install the required Chromium browser, and run `npm run test:all`. A change is not ready to merge or release if:

- any automated test fails;
- an unexplained skip or flaky test is introduced;
- a confirmed physics bug lacks a regression test;
- the browser reports an uncaught page or console error;
- the numerical tolerance or solver assumptions changed without documentation;
- a result is presented to learners without appropriate units or known limitations.

A green CI run is necessary but not sufficient. Review model limitations, curriculum correctness and unresolved risks before release.

## 9. Known limits that must remain visible

- DC solver support is limited to the implemented ideal voltage-source and linear resistive component model, including documented approximate meter/switch resistance.
- Transient analysis uses backward Euler and is not a nonlinear SPICE engine.
- RC and RL have analytical reference coverage. Series RLC now has closed-form step-response and AC phasor-sweep references, but this is not a comprehensive analytical oracle suite for arbitrary mixed topologies.
- Transient switch events/discontinuities need dedicated validation; current tests must not be interpreted as proving correct event handling in every circuit.
- Browser emulation does not replace testing on real Android devices and browsers.
- Automated accessibility checks do not prove complete WCAG conformance.
- This application is for education and virtual low-voltage experimentation, not mains wiring or safety-critical engineering.

## 10. Next coverage priorities

1. Finish end-to-end junction support in the editor: create/split a wire at a junction, connect terminals to junctions, render and hit-test junctions, and include them in save/load, lessons and undo/redo. Solver-level tests now cover shared electrical nodes and malformed junctions. Add a visual-crossing negative test before marking the feature complete.
2. Expand AC frequency-response coverage with additional component scales and combined RC/RL/RLC comparisons; dedicated AC RC, RL and series-RLC sweeps now cover 10–1,000 Hz, with further resonance-focused and high-dynamic-range cases still needed.
3. Event-integrated switch discontinuity tests inside a single transient run; the current regression validates explicit state handoff between separate simulation segments only.
4. More adversarial singular/floating topology, extreme component-scale and ill-conditioned matrix tests.
5. Expand mutation testing beyond the verified inductor-current sign mutation to voltage polarity, capacitor state updates, branch signs and units.
6. CI reporting for scenario counts, test duration, skipped tests and numerical failure details.
