import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [html, app, css] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8")
]);

test("all static DOM IDs queried by the app exist in the HTML", () => {
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const dynamicIds = new Set(["properties", "prop-closed", "deleteComponent", "rotateComponent", "redo"]);
  const selectors = [...app.matchAll(/\$\("#([A-Za-z][\w-]*)"\)/g)].map(m => m[1]);
  const missing = [...new Set(selectors)].filter(id => !htmlIds.has(id) && !dynamicIds.has(id));
  assert.deepEqual(missing, []);
});

test("UI exposes circuit editing, DC and transient simulation, persistence and lesson checks", () => {
  for (const id of ["circuit", "wires", "nodes", "run", "runTransient", "save", "open", "fileInput", "undo", "checkLesson", "resetLesson", "createLesson", "lessonEditor", "lessonEditorForm", "lessonId", "saveLesson", "exportLesson", "importLesson", "lessonFileInput", "transientPanel", "transientChart"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  for (const type of ["battery", "acSource", "lamp", "resistor", "switch", "ammeter", "voltmeter", "capacitor", "inductor"]) {
    assert.match(html, new RegExp('data-type="' + type + '"'));
  }
});

test("responsive styles define narrow viewport layouts and focusable controls", () => {
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(max-width:\s*420px\)/);
  assert.match(css, /:focus-visible/);
});
