import React, { useEffect, useMemo, useRef, useState } from "react";
import { normalizeViewportConfig, resolveViewportSize } from "@circuitlabedu/core";

const px = value => typeof value === "number" ? `${value}px` : value;

export function CircuitCanvas({
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  aspectRatio,
  padding,
  responsive,
  maintainAspectRatio,
  devicePixelRatio,
  options = {},
  preserveAspectRatio = "xMidYMid meet",
  className,
  style,
  ariaLabel = "Circuit diagram",
  children,
  onResize,
  ...svgProps
}) {
  const viewportWidth = width ?? options.width ?? "auto";
  const viewportHeight = height ?? options.height ?? "auto";
  const viewportAspectRatio = aspectRatio ?? options.aspectRatio;
  const viewportMaintainRatio = maintainAspectRatio ?? options.maintainAspectRatio ?? false;
  const effectiveMinWidth = minWidth ?? options.minWidth ?? 0;
  const effectiveMinHeight = minHeight ?? options.minHeight ?? (
    viewportHeight !== "auto" || (viewportAspectRatio && viewportMaintainRatio) ? 0 : 320
  );
  const effectiveMaxWidth = maxWidth ?? options.maxWidth;
  const effectiveMaxHeight = maxHeight ?? options.maxHeight;
  const effectivePadding = padding ?? options.padding ?? 0;
  const effectiveResponsive = responsive ?? options.responsive ?? true;
  const effectivePixelRatio = devicePixelRatio ?? options.devicePixelRatio ?? "auto";

  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const config = useMemo(() => normalizeViewportConfig({
    width: viewportWidth,
    height: viewportHeight,
    minWidth: effectiveMinWidth,
    minHeight: effectiveMinHeight,
    maxWidth: effectiveMaxWidth,
    maxHeight: effectiveMaxHeight,
    aspectRatio: viewportAspectRatio,
    padding: effectivePadding,
    responsive: effectiveResponsive,
    maintainAspectRatio: viewportMaintainRatio,
    devicePixelRatio: effectivePixelRatio,
  }), [viewportWidth, viewportHeight, effectiveMinWidth, effectiveMinHeight, effectiveMaxWidth,
    effectiveMaxHeight, viewportAspectRatio, effectivePadding, effectiveResponsive,
    viewportMaintainRatio, effectivePixelRatio]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const next = {
        width: Math.max(0, rect.width - effectivePadding * 2),
        height: Math.max(0, rect.height - effectivePadding * 2),
      };
      setContainerSize(previous =>
        Math.abs(previous.width - next.width) < 0.5 && Math.abs(previous.height - next.height) < 0.5
          ? previous
          : next
      );
      onResize?.(next);
    };

    measure();
    if (!effectiveResponsive) return undefined;
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onResize, effectiveResponsive, effectivePadding]);

  const resolved = resolveViewportSize(config, containerSize);
  const resolvedWidth = resolved.width || (config.width === "auto" ? 640 : config.width);
  const resolvedHeight = resolved.height || (config.height === "auto"
    ? (config.aspectRatio && config.maintainAspectRatio
      ? resolvedWidth / config.aspectRatio
      : Math.max(config.minHeight, 320))
    : config.height);

  const wrapperStyle = {
    boxSizing: "border-box",
    position: "relative",
    display: "block",
    width: viewportWidth === "auto"
      ? (effectiveResponsive ? "100%" : px(containerSize.width || effectiveMinWidth || 640))
      : px(resolvedWidth),
    minWidth: px(effectiveMinWidth),
    maxWidth: effectiveMaxWidth === undefined ? undefined : px(effectiveMaxWidth),
    minHeight: px(effectiveMinHeight + effectivePadding * 2),
    maxHeight: effectiveMaxHeight === undefined ? undefined : px(effectiveMaxHeight),
    height: viewportHeight === "auto"
      ? (style?.height ?? (viewportAspectRatio && viewportMaintainRatio
        ? undefined
        : px(effectiveMinHeight + effectivePadding * 2)))
      : px(resolvedHeight),
    aspectRatio: viewportHeight === "auto" && viewportAspectRatio && viewportMaintainRatio
      ? String(viewportAspectRatio)
      : undefined,
    padding: px(effectivePadding),
    overflow: "hidden",
    ...style,
  };

  const content = typeof children === "function"
    ? children({ width: resolvedWidth, height: resolvedHeight, pixelRatio: resolved.pixelRatio, responsive: effectiveResponsive })
    : children;

  return React.createElement(
    "div",
    { ref: containerRef, className, style: wrapperStyle, "data-circuit-canvas": "true" },
    React.createElement("svg", {
      ...svgProps,
      xmlns: "http://www.w3.org/2000/svg",
      width: "100%",
      height: "100%",
      viewBox: `0 0 ${resolvedWidth} ${resolvedHeight}`,
      preserveAspectRatio,
      role: svgProps.role ?? "img",
      "aria-label": ariaLabel,
      style: { display: "block", width: "100%", height: "100%", touchAction: "none", ...svgProps.style },
    }, content)
  );
}
