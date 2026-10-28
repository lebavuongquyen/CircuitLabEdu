# Exercise Pack Authoring Guide

This guide defines how to author, validate, test and distribute exercise packs for CircuitLabEdu. An exercise pack is curriculum data plus explicit assessment rules; it must not implement its own circuit solver or depend on React components.

## 1. Package boundary

- `@circuitlabedu/core` owns topology validation and electrical simulation.
- `@circuitlabedu/exercise-pack-basic` is the reference pack and owns sample lesson definitions, lesson schema validation and lesson assessment.
- A ReactJS app owns rendering, drag/drop, SVG, animation, navigation, language selection and learner interaction.
- An exercise pack may depend on the public core API, but core must never import an exercise pack.

A third-party pack should be a normal ESM package with a unique package name, a version, a documented license, and an explicit exported entry point. Do not import files from another package's `src` directory; depend on its public exports instead.

## 2. Lesson record contract (schema version 1)

Each lesson is a plain JSON-compatible object with these fields:

| Field | Required | Meaning |
|---|---|---|
| `id` | Yes | Stable unique slug, 2–64 characters, lowercase letters/digits/hyphens recommended |
| `schemaVersion` | Yes | Currently `1` |
| `level` | Yes | `primary`, `middle`, or `high` |
| `title.vi`, `title.en` | Yes | Non-empty localized titles |
| `objective.vi`, `objective.en` | Yes | Observable learning objective in both languages |
| `hints.vi`, `hints.en` | No | Ordered progressive hints; each hint should be concise and actionable |
| `example` | Legacy adapter | Name of an application-provided starter circuit preset |
| `startingCircuit` | Recommended for portable packs | Self-contained circuit snapshot with `schemaVersion`, `components`, `wires`, and optional `junctions` |
| `expected` | Yes | Non-empty assessment rule object supported by the current validator |

The current validator accepts these `expected` keys: `componentTypes`, `requireClosedCircuit`, `relation`, `tolerance`, `minCurrent`, `maxCurrent`, `targetVoltage`, `targetResistance`, `comparison`, and `transientMode`. Supported values currently include `relation: "ohms-law"`, `comparison: "series-parallel-current"`, and transient modes `rc`, `rl`, `rlc`, `ac`, `ac-rc`. Do not invent new keys and assume the current grader understands them. Extend the schema and tests before using a new assessment rule.

## 3. Authoring process

1. Define one specific learning outcome. It should be testable by an action or a measurable circuit property.
2. Choose the learner level and provide a bilingual title and objective. Avoid putting the answer directly in the objective.
3. Create a valid starting circuit or explicitly reference a supported legacy `example` preset. Portable packs should include `startingCircuit` because application-local preset names are not portable.
4. Write 2–4 progressive hints. The first hint should orient the learner; later hints may identify the relevant physical relationship. Keep hints from contradicting the actual model assumptions.
5. Choose an assessment rule supported by the current schema. Specify numeric tolerances intentionally and in the unit of the compared quantity. Never use a broad tolerance to hide solver error.
6. Validate the lesson with `validateLesson` and validate its starting topology with `validateCircuit`.
7. Add positive, negative and boundary tests. Verify both a correct learner solution and plausible incorrect configurations.
8. Test the pack through the public package entry point, not by importing private source files.
9. Document model assumptions and any limitations relevant to the exercise.

## 4. Minimal lesson example

```js
export const lesson = {
  id: "middle-ohms-law-one-resistor",
  schemaVersion: 1,
  level: "middle",
  title: {
    vi: "Kiểm tra định luật Ohm",
    en: "Check Ohm's law"
  },
  objective: {
    vi: "Dự đoán dòng điện qua một điện trở rồi kiểm tra bằng mô phỏng.",
    en: "Predict current through a resistor, then verify it in simulation."
  },
  hints: {
    vi: ["Đọc điện áp nguồn và giá trị điện trở.", "Dùng I = U/R để dự đoán dòng điện."],
    en: ["Read the source voltage and resistance.", "Use I = V/R to predict the current."]
  },
  startingCircuit: {
    schemaVersion: 1,
    components: [
      { id: "source", type: "battery", voltage: 9, x: 100, y: 100 },
      { id: "load", type: "resistor", resistance: 3, x: 260, y: 100 }
    ],
    wires: [
      { id: "wire-1", from: "source:a", to: "load:a" },
      { id: "wire-2", from: "load:b", to: "source:b" }
    ],
    junctions: []
  },
  expected: {
    componentTypes: ["battery", "resistor"],
    requireClosedCircuit: true,
    relation: "ohms-law",
    tolerance: 0.01
  }
};
```

This example demonstrates the shape of a lesson record. The sample circuit's coordinates and terminal orientation must match the consuming editor's component geometry. Before shipping, run the circuit through `validateCircuit`, solve it through `solveCircuit`, and verify the grader with the exact result format. The current legacy lesson assessment is not yet a fully general learner-action engine: rules such as component presence and aggregate readings are simpler than checking every required wire or a sequence of learner actions.

## 5. Assessment design rules

- Grade results from the core solver or an explicitly requested transient simulation; do not calculate a second answer using hand-written physics in the pack.
- Distinguish malformed circuits, unsolved circuits, wrong mode, missing required components and wrong numeric results.
- Make direction conventions explicit when testing signed currents. UI magnitudes and signed solver values are not interchangeable.
- For AC exercises, state that amplitude is peak amplitude, not RMS, and specify the time window and time step when waveform samples matter.
- For transient exercises, account for initial capacitor voltage and inductor current. A test should not assume zero stored energy unless the initial condition is explicit.
- Never claim arbitrary RLC accuracy based only on finite outputs. Use analytical references where available and timestep-convergence tests for additional cases.
- Do not treat a warning as a pass or assume a valid topology necessarily has a unique physical solution.

## 6. Pack structure and exports

Recommended structure for an independently published pack:

```text
my-circuitlab-pack/
  package.json
  README.md
  src/index.js
  lessons/
    primary-closed-loop.js
    middle-ohms-law.js
  tests/
    schema.test.js
    assessment.test.js
```

Export stable public functions and lesson data from `src/index.js`. Keep source file names, UI labels and private implementation details out of the public contract. Do not put React components, DOM nodes, functions or class instances inside JSON lesson records.

## 7. Required tests before release

- Every lesson has a unique ID and passes schema validation.
- Every portable starting circuit passes core topology validation.
- IDs, terminal references, component types and parameter bounds are checked.
- Correct reference circuits pass the expected assessment.
- Incorrect topology, open switches, missing components, wrong simulation mode and out-of-tolerance values fail with a stable reason.
- Numeric tests include boundaries and non-finite inputs where applicable.
- Importing the package from a clean Node.js process works using only its declared public exports.
- At least one browser integration test confirms that the React adapter can load a pack without importing private source paths.

From this repository, run `npm test`, `npm run test:browser`, and `npm run test:all`. Do not publish if a test fails or if the full suite has not been run after a core/schema change.

## 8. Versioning and compatibility

- Increment `schemaVersion` only when the lesson document contract changes incompatibly.
- Use semantic versioning for packages. A backward-compatible lesson addition is generally a minor release; fixing a lesson or assessment bug is a patch; incompatible public API or schema changes require a major release.
- Keep a changelog for published packs and document which core API versions they support.
- Validate external pack data as untrusted input before loading it. Enforce size/count limits and reject unsupported schema versions.

## 9. Current limitations to resolve before broad third-party publishing

The current app's legacy lessons still use `example` names that are resolved by app-specific presets; those records are not fully portable across React applications. The current assessment engine does not yet express arbitrary graph constraints, learner action sequences, per-component measurement predicates, scoring rubrics or custom extension rules. Do not claim these capabilities until the schema, evaluator and negative tests exist. A future schema version should define portable circuit fixtures, graph-aware grading and explicit rule composition before external pack publishing is treated as stable.
