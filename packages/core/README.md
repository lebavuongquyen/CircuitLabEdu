# @circuitlabedu/core

Framework-independent electrical circuit validation and simulation primitives for Node.js and browser applications.

## Install

```sh
npm install @circuitlabedu/core
```

## Public API

```js
import { solveCircuit, validateCircuit, simulateTransient } from "@circuitlabedu/core";
```

- `validateCircuit(components, wires, junctions = [])` checks supported component data and topology. Returns `{ valid, errors, warnings }`.
- `solveCircuit(components, wires, junctions = [])` performs the supported static DC analysis and returns a structured result. Inspect `ok`, `reason`, `readings`, `errors` and `warnings`; do not infer success from readings alone.
- `simulateTransient(components, wires, options = {}, junctions = [])` runs the supported linear RLC time-domain solver. Options include `duration`, `step`, and supported initial conditions; see API documentation and tests before relying on specific fields.
- `routeOrthogonal(start, end, obstacles = [])` is an optional geometry helper. It does not alter electrical connectivity.

The package has no React, DOM, canvas, SVG or browser-global dependency. Pass plain data and treat returned values as simulation results, not as rendering instructions. Use virtual low-voltage circuits only; this is not a SPICE engine or safety-critical design tool.

## Development

From the repository root run `npm test`, `npm run test:browser`, or `npm run test:all`. Compatibility entry files at the application root re-export the package modules so the existing app can migrate without a flag-day rewrite.
