# React UI Lab

The React UI Lab is a browser-based interaction and responsive-layout test surface for CircuitLabEdu. It intentionally reuses the existing `@circuitlabedu/core` solver and `@circuitlabedu/react` canvas adapter rather than implementing a second electrical solver.

## Start the lab

```sh
npm run dev:react-lab
```

Open `http://127.0.0.1:4174/react-lab/`. The lab is development/test tooling, not a production CAD application.

## What it checks manually and through Playwright

- React mounts with the existing core solver and the separately packaged basic exercise content. Selecting a lesson replaces the active circuit with that lesson’s own `startingCircuit`; legacy `example` names are handled by the lab as compatibility presets.
- The SVG canvas follows its parent width and remains usable at phone widths.
- A switch can be toggled by pointer or keyboard.
- The SVG canvas renders components, wires and junctions from circuit data rather than a fixed four-component template; component count and supported component type can vary by lesson.
- Selecting a component exposes its editable electrical parameter; changing a parameter or switch invalidates stale readings.
- Running simulation reuses the core DC solver or transient solver as appropriate, and lesson assessment reuses the exercise-pack assessment function.
- Editing a solved circuit clears stale readings until the next simulation run.
- Exercise content can be loaded from a JSON file without adding lesson sequencing or education workflow to the core package. The external pack is validated before it replaces the active pack, and duplicate IDs are rejected.
- Invalid external lesson data and duplicate lesson IDs are rejected without replacing the active pack.

Run the dedicated browser checks with `npm run test:react-ui`. Tests cover desktop and mobile viewports, selecting lessons, loading a pack-provided starting circuit, rendering variable component counts, editing values, solving, assessment, and rejection of invalid or duplicate pack data. They are also included in `npm run test:browser` and `npm run test:all`.

## External exercise pack format

The JSON file can contain either an array of lesson objects or an object with a `lessons` array. Each lesson is validated by `validateLesson` exported by the exercise-pack package. This lab uses that schema validator for the demo; the electrical core does not import or depend on exercise packs.

A production app may provide its own content provider, lesson selection, progress model, localization, and assessment UI. Those are intentionally kept outside `@circuitlabedu/core`.
