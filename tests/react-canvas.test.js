import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CircuitCanvas } from "@circuitlabedu/react";

test("CircuitCanvas renders a fixed logical SVG viewport", () => {
  const markup = renderToStaticMarkup(React.createElement(CircuitCanvas, { width: 600, height: 300, "data-testid": "canvas" }, React.createElement("circle", { cx: 20, cy: 20, r: 5 })));
  assert.match(markup, /viewBox="0 0 600 300"/);
  assert.match(markup, /width:600px/);
  assert.match(markup, /height:300px/);
  assert.match(markup, /<circle cx="20" cy="20" r="5"/);
});

test("CircuitCanvas uses a stable SSR fallback for auto responsive sizing", () => {
  const markup = renderToStaticMarkup(React.createElement(CircuitCanvas, { width: "auto", height: "auto", aspectRatio: 16 / 9, maintainAspectRatio: true }));
  assert.match(markup, /viewBox="0 0 640 360"/);
  assert.match(markup, /width:100%/);
});


test("CircuitCanvas accepts chart-style options and lets explicit props override them", () => {
  const markup = renderToStaticMarkup(React.createElement(CircuitCanvas, {
    options: { width: 500, height: 250, responsive: false },
    width: 320,
    "aria-label": "Options precedence",
  }));
  assert.match(markup, /viewBox="0 0 320 250"/);
  assert.match(markup, /width:320px/);
});
