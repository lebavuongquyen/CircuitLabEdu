import React from "react";
import { createRoot } from "react-dom/client";
import { CircuitCanvas } from "@circuitlabedu/react";

const parentRoot = createRoot(document.getElementById("parent"));
const fixedRoot = createRoot(document.getElementById("fixed"));
window.renderResponsiveCanvas = () => parentRoot.render(
  <CircuitCanvas options={{ width: "auto", height: "auto", minHeight: 0, aspectRatio: 16 / 9, maintainAspectRatio: true }} ariaLabel="Responsive circuit">
    {({ width, height }) => <g data-logical-size={`${width}x${height}`}><rect x="0" y="0" width={width} height={height} fill="none" stroke="currentColor" /></g>}
  </CircuitCanvas>
);
window.renderFixedCanvas = () => fixedRoot.render(
  <CircuitCanvas width={320} height={180} ariaLabel="Fixed circuit">
    {({ width, height }) => <g data-logical-size={`${width}x${height}`} />}
  </CircuitCanvas>
);
window.renderResponsiveCanvas();
window.renderFixedCanvas();
