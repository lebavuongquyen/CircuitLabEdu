import test from "node:test";
import assert from "node:assert/strict";
import { normalizeViewportConfig, resolveViewportSize } from "../packages/core/src/viewport.js";

test("auto viewport follows container dimensions", () => {
  assert.deepEqual(
    resolveViewportSize({ width: "auto", height: "auto", minHeight: 120 }, { width: 720, height: 420 }),
    { width: 720, height: 420, pixelRatio: null }
  );
});

test("fixed dimensions are preserved", () => {
  assert.deepEqual(
    resolveViewportSize({ width: 640, height: 360 }, { width: 300, height: 200 }),
    { width: 640, height: 360, pixelRatio: null }
  );
});

test("maintainAspectRatio derives height from measured width", () => {
  assert.deepEqual(
    resolveViewportSize({ width: "auto", height: "auto", minHeight: 100, aspectRatio: 2, maintainAspectRatio: true }, { width: 600, height: 500 }),
    { width: 600, height: 300, pixelRatio: null }
  );
});

test("auto sizing respects configured maximum bounds", () => {
  assert.deepEqual(
    resolveViewportSize({ width: "auto", height: "auto", minHeight: 100, maxWidth: 800, maxHeight: 400 }, { width: 1200, height: 700 }),
    { width: 800, height: 400, pixelRatio: null }
  );
});

test("explicit pixel ratio is retained", () => {
  assert.equal(resolveViewportSize({ devicePixelRatio: 2 }, { width: 500, height: 320 }).pixelRatio, 2);
});

test("invalid dimensions and contradictory bounds are rejected", () => {
  assert.throws(() => normalizeViewportConfig({ width: 0 }), /width must be/);
  assert.throws(() => normalizeViewportConfig({ aspectRatio: 0 }), /aspectRatio must be/);
  assert.throws(() => normalizeViewportConfig({ devicePixelRatio: 0 }), /devicePixelRatio must be/);
  assert.throws(() => normalizeViewportConfig({ minWidth: 500, maxWidth: 400 }), /Maximum viewport bounds/);
  assert.throws(() => resolveViewportSize({}, { width: -1 }), /container.width/);
});

test("default minimum height does not break a requested responsive aspect ratio", () => {
  assert.deepEqual(
    resolveViewportSize({ width: "auto", height: "auto", aspectRatio: 16 / 9, maintainAspectRatio: true }, { width: 320, height: 400 }),
    { width: 320, height: 180, pixelRatio: null }
  );
});


test("aspect ratio remains stable when maximum height constrains a responsive canvas", () => {
  assert.deepEqual(
    resolveViewportSize({ width: "auto", height: "auto", aspectRatio: 2, maintainAspectRatio: true, maxHeight: 200 }, { width: 1000, height: 700 }),
    { width: 400, height: 200, pixelRatio: null }
  );
});

test("contradictory aspect-ratio bounds are rejected", () => {
  assert.throws(
    () => resolveViewportSize({ width: "auto", height: "auto", aspectRatio: 2, maintainAspectRatio: true, minWidth: 500, maxHeight: 200 }, { width: 800, height: 500 }),
    /cannot satisfy the requested aspect ratio/
  );
});
