const AUTO = "auto";

function dimension(value, name) {
  if (value === undefined || value === null || value === AUTO) return AUTO;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive finite number or "auto".`);
  }
  return value;
}

function bound(value, name, fallback) {
  if (value === undefined || value === null) return fallback;
  if (value === Infinity && (name === "maxWidth" || name === "maxHeight")) return Infinity;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a finite non-negative number.`);
  }
  return value;
}

export function normalizeViewportConfig(config = {}) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new TypeError("Viewport config must be an object.");
  }

  const width = dimension(config.width, "width");
  const height = dimension(config.height, "height");
  const minWidth = bound(config.minWidth, "minWidth", 0);
  const aspectRatio = config.aspectRatio ?? null;
  const defaultMinHeight = config.height !== undefined && config.height !== null && config.height !== "auto"
    ? 0
    : (aspectRatio && config.maintainAspectRatio === true ? 0 : 320);
  const minHeight = bound(config.minHeight, "minHeight", defaultMinHeight);
  const maxWidth = bound(config.maxWidth, "maxWidth", Infinity);
  const maxHeight = bound(config.maxHeight, "maxHeight", Infinity);
  const padding = bound(config.padding, "padding", 0);

  if (maxWidth < minWidth || maxHeight < minHeight) {
    throw new RangeError("Maximum viewport bounds must be greater than or equal to minimum bounds.");
  }
  if (aspectRatio !== null && (typeof aspectRatio !== "number" || !Number.isFinite(aspectRatio) || aspectRatio <= 0)) {
    throw new TypeError("aspectRatio must be a positive finite number when provided.");
  }

  if (config.devicePixelRatio !== undefined && config.devicePixelRatio !== null && config.devicePixelRatio !== "auto" && config.devicePixelRatio <= 0) {
    throw new TypeError("devicePixelRatio must be a positive finite number or \"auto\".");
  }

  return Object.freeze({
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    aspectRatio,
    padding,
    responsive: config.responsive !== false,
    maintainAspectRatio: config.maintainAspectRatio === true,
    devicePixelRatio: config.devicePixelRatio === "auto" || config.devicePixelRatio === undefined
      ? "auto"
      : bound(config.devicePixelRatio, "devicePixelRatio", 1),
  });
}

export function resolveViewportSize(config = {}, container = {}) {
  const options = normalizeViewportConfig(config);
  const availableWidth = bound(container.width, "container.width", 0);
  const availableHeight = bound(container.height, "container.height", 0);

  let width = options.width === AUTO ? availableWidth : options.width;
  let height = options.height === AUTO
    ? (options.aspectRatio && options.maintainAspectRatio
      ? width / options.aspectRatio
      : availableHeight || options.minHeight)
    : options.height;

  if (options.aspectRatio && options.maintainAspectRatio && options.height === AUTO) {
    const ratioMinWidth = Math.max(options.minWidth, options.minHeight * options.aspectRatio);
    const ratioMaxWidth = Math.min(options.maxWidth, options.maxHeight * options.aspectRatio);
    if (ratioMaxWidth < ratioMinWidth) {
      throw new RangeError("Viewport bounds cannot satisfy the requested aspect ratio.");
    }
    width = Math.min(ratioMaxWidth, Math.max(ratioMinWidth, width));
    height = width / options.aspectRatio;
  } else {
    if (options.responsive && options.width === AUTO) width = Math.min(width, options.maxWidth);
    if (options.responsive && options.height === AUTO) height = Math.min(height, options.maxHeight);
    width = Math.max(options.minWidth, width);
    height = Math.max(options.minHeight, height);
    width = Math.min(options.maxWidth, width);
    height = Math.min(options.maxHeight, height);
  }

  return Object.freeze({
    width: Math.round(width),
    height: Math.round(height),
    pixelRatio: options.devicePixelRatio === "auto" ? null : options.devicePixelRatio,
  });
}
