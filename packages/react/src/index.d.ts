import type { CSSProperties, ReactElement, ReactNode, SVGProps } from "react";

export type CanvasDimension = number | "auto";

export interface CircuitCanvasRenderContext {
  width: number;
  height: number;
  pixelRatio: number | null;
  responsive: boolean;
}

export interface CircuitCanvasOptions {
  width?: CanvasDimension;
  height?: CanvasDimension;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  padding?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  devicePixelRatio?: number | "auto";
}

export interface CircuitCanvasProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height" | "children"> {
  width?: CanvasDimension;
  height?: CanvasDimension;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  padding?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  devicePixelRatio?: number | "auto";
  options?: CircuitCanvasOptions;
  preserveAspectRatio?: string;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  children?: ReactNode | ((context: CircuitCanvasRenderContext) => ReactNode);
  onResize?: (size: { width: number; height: number }) => void;
}

export declare function CircuitCanvas(props: CircuitCanvasProps): ReactElement;
