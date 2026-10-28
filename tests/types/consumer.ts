import type { ReactNode } from "react";
import { CircuitCanvas, type CircuitCanvasOptions, type CircuitCanvasProps } from "@circuitlabedu/react";
import { normalizeViewportConfig, resolveViewportSize, type ViewportConfig } from "@circuitlabedu/core";

const options: CircuitCanvasOptions = {
  width: "auto",
  height: "auto",
  responsive: true,
  aspectRatio: 16 / 9,
  maintainAspectRatio: true,
  minHeight: 240,
};
const props: CircuitCanvasProps = {
  options,
  width: 640,
  height: 360,
  onResize: size => { size.width.toFixed(); size.height.toFixed(); },
  children: ({ width, height }) => ({ width, height }) as unknown as ReactNode,
};
const coreConfig: ViewportConfig = { width: "auto", height: "auto", aspectRatio: 16 / 9 };
normalizeViewportConfig(coreConfig);
resolveViewportSize(coreConfig, { width: 640, height: 360 });
void CircuitCanvas;
void props;
