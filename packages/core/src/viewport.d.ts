export type ViewportDimension = number | "auto";

export interface ViewportConfig {
  width?: ViewportDimension;
  height?: ViewportDimension;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number | null;
  padding?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  devicePixelRatio?: number | "auto";
}

export interface NormalizedViewportConfig {
  width: ViewportDimension;
  height: ViewportDimension;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  aspectRatio: number | null;
  padding: number;
  responsive: boolean;
  maintainAspectRatio: boolean;
  devicePixelRatio: number | "auto";
}

export interface ViewportContainerSize {
  width?: number;
  height?: number;
}

export interface ResolvedViewportSize {
  width: number;
  height: number;
  pixelRatio: number | null;
}

export declare function normalizeViewportConfig(config?: ViewportConfig): Readonly<NormalizedViewportConfig>;
export declare function resolveViewportSize(config?: ViewportConfig, container?: ViewportContainerSize): Readonly<ResolvedViewportSize>;
