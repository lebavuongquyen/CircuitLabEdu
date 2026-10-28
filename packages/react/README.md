# @circuitlabedu/react

Responsive React SVG viewport adapter for CircuitLab Edu. The simulation engine remains framework-independent in `@circuitlabedu/core`; this package provides a responsive SVG host for React applications.

## Install

```sh
npm install @circuitlabedu/core @circuitlabedu/react react
```

React is a peer dependency. This package does not bundle React. TypeScript consumers should also have `@types/react` installed.

## Quick start

```jsx
import { CircuitCanvas } from "@circuitlabedu/react";

export function ExampleCircuit() {
  return (
    <section style={{ width: "100%", minWidth: 0 }}>
      <CircuitCanvas
        width="auto"
        height="auto"
        minHeight={280}
        aspectRatio={16 / 9}
        maintainAspectRatio
        ariaLabel="Example circuit"
      >
        {({ width, height }) => (
          <g>
            <path d={`M 40 40 H ${Math.max(40, width - 40)} V ${Math.max(40, height - 40)}`} fill="none" stroke="currentColor" strokeWidth="2" />
          </g>
        )}
      </CircuitCanvas>
    </section>
  );
}
```

## Sizing options

Options can be grouped into a chart-library-style `options` object. Explicit component props override matching option values.

```jsx
<CircuitCanvas
  options={{
    width: "auto",
    height: "auto",
    responsive: true,
    aspectRatio: 16 / 9,
    maintainAspectRatio: true,
    minHeight: 240,
    maxWidth: 1200,
  }}
>
  {({ width, height }) => <CircuitDrawing width={width} height={height} />}
</CircuitCanvas>
```


| Option | Default | Meaning |
| --- | --- | --- |
| `width` | `"auto"` | `"auto"` fills the parent content width; a number fixes CSS width in pixels. |
| `height` | `"auto"` | `"auto"` uses parent/ratio sizing or the minimum height; a number fixes height in pixels. |
| `minWidth` / `minHeight` | `0` / context-dependent | Lower size bounds in pixels. Auto-height defaults to `320` unless an aspect ratio is maintained; fixed-height canvases default to `0`. |
| `maxWidth` / `maxHeight` | unlimited | Optional upper size bounds in pixels. |
| `aspectRatio` | unset | Width divided by height, e.g. `16 / 9`. |
| `maintainAspectRatio` | `false` | With auto height and a ratio, derive height from the measured width. |
| `responsive` | `true` | Enables responsive sizing behavior. |
| `padding` | `0` | Inner wrapper padding in pixels. |
| `devicePixelRatio` | `"auto"` | Reserved sizing metadata for renderers that need a backing-store pixel ratio; SVG itself remains resolution-independent. |
| `onResize` | unset | Receives measured `{ width, height }` after container resize. |

The component uses `ResizeObserver` to respond to parent/container changes, including grid changes, sidebars, and tab layouts. It falls back to window resize events where `ResizeObserver` is unavailable. Use `minWidth: 0` on flex/grid ancestors to prevent intrinsic content width from forcing horizontal overflow.

The child render function receives the current logical `width`, `height`, `pixelRatio`, and `responsive` values. SVG coordinates should be drawn against these logical dimensions. Do not multiply SVG coordinates by device pixel ratio.

## Integration guidance

- Let the embedding page own the parent layout; this package does not impose viewport-wide positioning.
- For a panel that should fill available height, set the parent and canvas `style={{ height: "100%" }}` and ensure ancestors have a defined height.
- For a proportional diagram, use `aspectRatio` and `maintainAspectRatio`.
- For an editor that needs vertical room to grow, leave `maintainAspectRatio={false}` and set a suitable `minHeight`.
- The SVG host is a rendering surface, not a circuit editor by itself. Wire gestures, selection, pan/zoom, and electrical calculations remain application features.
- In SSR environments, browser measurement starts after mount; do not assume a meaningful container size during server rendering.

## Core sizing helper

Non-React integrations can use `normalizeViewportConfig` and `resolveViewportSize` from `@circuitlabedu/core` to normalize options and resolve measured dimensions without importing React or touching the DOM.
