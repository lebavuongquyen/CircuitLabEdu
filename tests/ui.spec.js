import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  const runtimeErrors = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") runtimeErrors.push(message.text()); });
  page.__runtimeErrors = runtimeErrors;
});

test.afterEach(async ({ page }) => {
  expect(page.__runtimeErrors || []).toEqual([]);
});

test("loads the bilingual workbench without runtime errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#circuit")).toBeVisible();
  await expect(page.locator('[data-type="capacitor"]')).toBeVisible();
  await page.locator("#language").selectOption("en");
  await expect(page.locator("h1")).toHaveText("Build a circuit. Discover why.");
  await page.locator("#level").selectOption("high");
  await expect(page.locator("#levelCaption")).toHaveText("Advanced analysis");
  expect(errors).toEqual([]);
});

test("series and parallel presets produce expected DC currents", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="series"]').click();
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
  await expect(page.locator(".component-reading")).toBeVisible();
  const seriesCurrent = Number((await page.locator("#currentMetric").innerText()).match(/[\d.]+/)[0]);
  await page.locator('.lesson[data-example="parallel"]').click();
  const parallelCurrent = Number((await page.locator("#currentMetric").innerText()).match(/[\d.]+/)[0]);
  expect(seriesCurrent).toBeCloseTo(0.75, 2);
  expect(parallelCurrent).toBeCloseTo(3, 2);
  expect(parallelCurrent).toBeGreaterThan(seriesCurrent);
});

test("wire click selects without deleting and Delete removes only selected wire", async ({ page }) => {
  await page.goto("/");
  await page.locator('.lesson[data-example="simple"]').click();
  const wires = page.locator("[data-wire]");
  await expect(wires).toHaveCount(3);
  const hit = wires.nth(test.info().project.name === "chromium-mobile" ? 1 : 0);
  await hit.scrollIntoViewIfNeeded();
  const point = await hit.evaluate(el => {
    const p = el.getPointAtLength(el.getTotalLength() * 0.5);
    const m = el.ownerSVGElement.createSVGPoint();
    m.x = p.x;
    m.y = p.y;
    const client = m.matrixTransform(el.getScreenCTM());
    return { x: client.x, y: client.y };
  });
  if (test.info().project.name === "chromium-mobile") await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  await expect(page.locator(".wire-selected")).toHaveCount(1);
  await expect(page.locator("[data-wire]")).toHaveCount(3);
  await page.keyboard.press("Delete");
  await expect(page.locator("[data-wire]")).toHaveCount(2);
});

test("transient UI calculates an RC charging curve and rejects unstable steps", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-type="battery"]').click();
  await page.locator('[data-type="resistor"]').click();
  await page.locator('[data-type="capacitor"]').click();
  const terminalClick = async index => page.locator("[data-terminal]").nth(index).click();
  await terminalClick(0);
  await terminalClick(2);
  await terminalClick(3);
  await terminalClick(4);
  await terminalClick(5);
  await terminalClick(1);
  await page.locator("#transientDuration").fill("0.05");
  await page.locator("#transientStep").fill("0.001");
  await page.locator("#runTransient").click();
  await expect(page.locator("#transientPanel")).toBeVisible();
  await expect(page.locator("#transientMessage")).toContainText("rc");
  await expect(page.locator("#transientChart polyline")).toHaveCount(1);
  await expect(page.locator(".component-reading")).toBeVisible();
  await page.locator("#transientStep").fill("0.1");
  await page.locator("#runTransient").click();
  await expect(page.locator("#transientMessage")).toContainText("time step");
  await expect(page.locator("#transientChart polyline")).toHaveCount(0);
});

test("wire current animation reverses when a load is wired with reversed terminal polarity", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "primary",
    components: [
      { id: "b", type: "battery", x: 200, y: 250, voltage: 9 },
      { id: "r", type: "resistor", x: 600, y: 250, resistance: 10 }
    ],
    wires: [
      { id: "w1", from: "b:b", to: "r:a" },
      { id: "w2", from: "r:b", to: "b:a" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({
    name: "reversed-polarity.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#run").click();
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
  await expect(page.locator(".wire-group.flow-reverse")).toHaveCount(2);
  await expect(page.locator(".wire.live")).toHaveCount(2);
});

test("opening and closing a switch updates current without stopping the DC simulation", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="simple"]').click();
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
  let sw = page.locator('[data-node]').filter({ has: page.locator(".switch-on") });
  await sw.scrollIntoViewIfNeeded();
  let body = await sw.locator(".body-wrap").boundingBox();
  if (test.info().project.name === "chromium-mobile") await page.touchscreen.tap(body.x + body.width / 2, body.y + body.height / 2);
  else await page.mouse.click(body.x + body.width / 2, body.y + body.height / 2);
  await expect(page.locator("#statusText")).toContainText("open");
  await expect(page.locator("#voltageMetric")).toContainText("9");
  await expect(page.locator("#currentMetric")).toContainText("0");
  await expect(page.locator("#statusText")).not.toContainText("not run");
  sw = page.locator('[data-node]').filter({ has: page.locator(".switch-off") });
  await sw.scrollIntoViewIfNeeded();
  body = await sw.locator(".body-wrap").boundingBox();
  if (test.info().project.name === "chromium-mobile") await page.touchscreen.tap(body.x + body.width / 2, body.y + body.height / 2);
  else await page.mouse.click(body.x + body.width / 2, body.y + body.height / 2);
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
  await expect(page.locator("#currentMetric")).not.toContainText("0 A");
});

test("multiple switches animate only conducting branches and update independently", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "primary",
    components: [
      { id: "b", type: "battery", x: 150, y: 250, voltage: 9 },
      { id: "s1", type: "switch", x: 350, y: 165, closed: false },
      { id: "l1", type: "lamp", x: 600, y: 165, resistance: 6 },
      { id: "s2", type: "switch", x: 350, y: 335, closed: true },
      { id: "l2", type: "lamp", x: 600, y: 335, resistance: 6 }
    ],
    wires: [
      { id: "w4", from: "b:a", to: "s2:a" },
      { id: "w5", from: "s2:b", to: "l2:a" },
      { id: "w6", from: "l2:b", to: "b:b" },
      { id: "w1", from: "b:a", to: "s1:a" },
      { id: "w2", from: "s1:b", to: "l1:a" },
      { id: "w3", from: "l1:b", to: "b:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({
    name: "parallel-switches.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#run").click();
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
  await expect(page.locator(".wire.live")).toHaveCount(3);
  await expect(page.locator("#wires > .wire-flow-overlay")).toHaveCount(3);
  const closedLead = await page.locator('[data-wire-group="w4"] .wire').getAttribute("d");
  const openLead = await page.locator('[data-wire-group="w1"] .wire').getAttribute("d");
  expect(closedLead.split(" L ").slice(0, 2)).toEqual(openLead.split(" L ").slice(0, 2));
  expect(await page.locator("#wires").evaluate(el => [...el.children].slice(-3).every(node => node.matches(".wire-flow-overlay")))).toBe(true);
  await expect(page.locator('[data-node="l1"]')).not.toHaveClass(/lit/);
  await expect(page.locator('[data-node="l2"]')).toHaveClass(/lit/);
  await page.locator('[data-node="s1"] .body-wrap').click();
  await expect(page.locator(".wire.live")).toHaveCount(6);
  await expect(page.locator('[data-node="l1"]')).toHaveClass(/lit/);
  await expect(page.locator('[data-node="l2"]')).toHaveClass(/lit/);
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
});

test("AC source drives a time-varying RC transient response", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "high",
    components: [
      { id: "ac", type: "acSource", x: 150, y: 250, amplitude: 5, frequency: 50, phase: 0, offset: 0 },
      { id: "r", type: "resistor", x: 400, y: 250, resistance: 1000 },
      { id: "c", type: "capacitor", x: 650, y: 250, capacitance: 0.00001, initialVoltage: 0 }
    ],
    wires: [
      { id: "w1", from: "ac:a", to: "r:a" },
      { id: "w2", from: "r:b", to: "c:a" },
      { id: "w3", from: "c:b", to: "ac:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({
    name: "ac-rc.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#transientDuration").fill("0.1");
  await page.locator("#transientStep").fill("0.001");
  await page.locator("#runTransient").click();
  await expect(page.locator("#transientPanel")).toBeVisible();
  await expect(page.locator("#transientMessage")).toContainText("ac-rc");
  await expect(page.locator("#transientChart polyline")).toHaveCount(1);
  await expect(page.locator("[data-node]")).toHaveCount(3);
});

test("mobile layout keeps workbench controls available", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#run")).toBeVisible();
  await expect(page.locator("#runTransient")).toBeVisible();
  await expect(page.locator("#circuit")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("undo and redo restore component creation", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-type="battery"]').click();
  await expect(page.locator("[data-node]")).toHaveCount(1);
  await page.locator("#undo").click();
  await expect(page.locator("[data-node]")).toHaveCount(0);
  await page.locator("#redo").click();
  await expect(page.locator("[data-node]")).toHaveCount(1);
});

test("saving and importing a versioned circuit preserves a valid circuit", async ({ page }) => {
  test.skip(test.info().project.name === "chromium-mobile", "Browser download events are not supported in this mobile emulation project");
  await page.goto("/");
  await page.locator('.lesson[data-example="simple"]').click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#save").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("circuitlab-edu-circuit.json");
  const valid = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "primary",
    components: [
      { id: "b", type: "battery", x: 150, y: 255, voltage: 9 },
      { id: "l", type: "lamp", x: 350, y: 255, resistance: 6 }
    ],
    wires: [
      { id: "w1", from: "b:a", to: "l:a" },
      { id: "w2", from: "l:b", to: "b:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({ name: "circuit.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(valid)) });
  await expect(page.locator("[data-node]")).toHaveCount(2);
  await expect(page.locator("[data-wire]")).toHaveCount(2);
});

test("invalid circuit import does not replace the current circuit", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="simple"]').click();
  await page.locator("#fileInput").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, components: [{ id: "x", type: "battery", x: 1, y: 1, voltage: 9 }], wires: [{ from: "x:a", to: "missing:a" }] }))
  });
  await expect(page.locator("#statusText")).toContainText("Could not read circuit file");
  await expect(page.locator("[data-node]")).toHaveCount(3);
  await expect(page.locator("[data-wire]")).toHaveCount(3);
});


test("switch can be dragged without toggling, and click toggles without moving", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-type="switch"]').click();
  const sw = page.locator('[data-node]').filter({ has: page.locator('.switch-off') });
  await expect(sw).toHaveCount(1);
  await sw.scrollIntoViewIfNeeded();
  const before = await sw.getAttribute("transform");
  const box = await sw.locator(".body-wrap").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2 + 35, { steps: 8 });
  await page.mouse.up();
  const moved = page.locator('[data-node]').filter({ has: page.locator('.switch-off') });
  await expect(moved).toHaveCount(1);
  expect(await moved.getAttribute("transform")).not.toBe(before);
  const movedTransform = await moved.getAttribute("transform");
  const movedBox = await moved.locator(".body-wrap").boundingBox();
  await page.mouse.click(movedBox.x + movedBox.width / 2, movedBox.y + movedBox.height / 2);
  const closed = page.locator('[data-node]').filter({ has: page.locator('.switch-on') });
  await expect(closed).toHaveCount(1);
  expect(await closed.getAttribute("transform")).toBe(movedTransform);
});


test("undo restores switch state and position after interaction", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-type="switch"]').click();
  let sw = page.locator('[data-node]').filter({ has: page.locator('.switch-off') });
  await sw.scrollIntoViewIfNeeded();
  const initialTransform = await sw.getAttribute("transform");
  let body = await sw.locator(".body-wrap").boundingBox();
  await page.mouse.click(body.x + body.width / 2, body.y + body.height / 2);
  await expect(page.locator('[data-node] .switch-on')).toHaveCount(1);
  await page.locator("#undo").click();
  sw = page.locator('[data-node]').filter({ has: page.locator('.switch-off') });
  await expect(sw).toHaveCount(1);
  expect(await sw.getAttribute("transform")).toBe(initialTransform);
  body = await sw.locator(".body-wrap").boundingBox();
  await page.mouse.move(body.x + body.width / 2, body.y + body.height / 2);
  await page.mouse.down();
  await page.mouse.move(body.x + body.width / 2 + 65, body.y + body.height / 2 + 20, { steps: 6 });
  await page.mouse.up();
  sw = page.locator('[data-node]').filter({ has: page.locator('.switch-off') });
  await expect(sw).toHaveCount(1);
  expect(await sw.getAttribute("transform")).not.toBe(initialTransform);
  await page.locator("#undo").click();
  sw = page.locator('[data-node]').filter({ has: page.locator('.switch-off') });
  await expect(sw).toHaveCount(1);
  expect(await sw.getAttribute("transform")).toBe(initialTransform);
});

test("valid JSON import works on desktop and mobile and can be undone", async ({ page }) => {
  await page.goto("/");
  await page.locator('.lesson[data-example="simple"]').click();
  const valid = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "primary",
    components: [
      { id: "b", type: "battery", x: 150, y: 255, voltage: 9 },
      { id: "l", type: "lamp", x: 350, y: 255, resistance: 6 }
    ],
    wires: [
      { id: "w1", from: "b:a", to: "l:a" },
      { id: "w2", from: "l:b", to: "b:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({ name: "circuit.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(valid)) });
  await expect(page.locator("[data-node]")).toHaveCount(2);
  await expect(page.locator("[data-wire]")).toHaveCount(2);
  await page.locator("#undo").click();
  await expect(page.locator("[data-node]")).toHaveCount(3);
  await expect(page.locator("[data-wire]")).toHaveCount(3);
});

test("custom bilingual lesson JSON imports and runs its grading rule", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="simple"]').click();
  const lesson = {
    schemaVersion: 1,
    id: "custom-ohms",
    level: "high",
    title: { vi: "Định luật Ohm tùy chỉnh", en: "Custom Ohm lesson" },
    objective: { vi: "Kiểm tra định luật Ohm", en: "Check Ohm's law" },
    hints: { vi: ["Dùng U = IR"], en: ["Use V = IR"] },
    expected: { relation: "ohms-law", tolerance: 0.01 }
  };
  await page.locator("#lessonFileInput").setInputFiles({ name: "custom-ohms.lesson.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(lesson)) });
  await expect(page.locator("#statusText")).toHaveText("Lesson imported.");
  await expect(page.locator("#challengeText")).toHaveText("TASK: Check Ohm's law");
  await page.locator("#checkLesson").click();
  await expect(page.locator("#explanation")).toContainText("Lesson requirements met.");
});

test("built-in lesson exports as a portable JSON file", async ({ page }) => {
  test.skip(test.info().project.name === "chromium-mobile", "Browser download events are not supported in this mobile emulation project");
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportLesson").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("closed-loop.lesson.json");
});

test("teacher can create, grade, reset and export a custom lesson", async ({ page }) => {
  test.skip(test.info().project.name === "chromium-mobile", "Browser download assertions are desktop-only in this emulation");
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="simple"]').click();
  await page.locator("#createLesson").click();
  await expect(page.locator("#lessonEditor")).toBeVisible();
  await page.locator("#lessonId").fill("class-ohms");
  await page.locator("#lessonLevel").selectOption("high");
  await page.locator("#lessonTitleVi").fill("Định luật Ohm");
  await page.locator("#lessonTitleEn").fill("Class Ohm lesson");
  await page.locator("#lessonObjectiveVi").fill("Kiểm tra định luật Ohm.");
  await page.locator("#lessonObjectiveEn").fill("Check Ohm's law.");
  await page.locator("#lessonHintsVi").fill("Đo điện áp.\nĐo dòng điện.");
  await page.locator("#lessonHintsEn").fill("Measure voltage.\nMeasure current.");
  await page.locator("#lessonExpected").fill('{"relation":"ohms-law","tolerance":0.01}');
  await page.locator("#saveLesson").click();
  await expect(page.locator("#statusText")).toHaveText("Lesson saved.");
  await expect(page.locator("#challengeText")).toHaveText("TASK: Check Ohm's law.");
  await page.locator("#challenge").click();
  await expect(page.locator("#explanation")).toContainText("Measure voltage.");
  await page.locator("#challenge").click();
  await expect(page.locator("#explanation")).toContainText("Measure current.");
  await page.locator("#checkLesson").click();
  await expect(page.locator("#explanation")).toContainText("Lesson requirements met.");
  await page.locator("#resetLesson").click();
  await expect(page.locator("[data-node]")).toHaveCount(3);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportLesson").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("class-ohms.lesson.json");
});

test("teacher editor rejects unsupported grading rules", async ({ page }) => {
  await page.goto("/");
  await page.locator("#createLesson").click();
  await page.locator("#lessonId").fill("bad-grading");
  await page.locator("#lessonExpected").fill('{"arbitraryCode":"not-supported"}');
  await page.locator("#saveLesson").click();
  await expect(page.locator("#statusText")).toHaveText("Tệp bài học không hợp lệ.");
  await expect(page.locator("#lessonEditor")).toBeVisible();
});

test("undo and redo restore component deletion and attached wires", async ({ page }) => {
  await page.goto("/");
  await page.locator('.lesson[data-example="simple"]').click();
  await expect(page.locator("[data-node]")).toHaveCount(3);
  await expect(page.locator("[data-wire]")).toHaveCount(3);
  await page.locator("[data-node]").first().click();
  await page.keyboard.press("Delete");
  await expect(page.locator("[data-node]")).toHaveCount(2);
  await expect(page.locator("[data-wire]")).toHaveCount(1);
  await page.locator("#undo").click();
  await expect(page.locator("[data-node]")).toHaveCount(3);
  await expect(page.locator("[data-wire]")).toHaveCount(3);
  await page.locator("#redo").click();
  await expect(page.locator("[data-node]")).toHaveCount(2);
  await expect(page.locator("[data-wire]")).toHaveCount(1);
});

test("undo and redo restore wire deletion without changing other connections", async ({ page }) => {
  test.skip(test.info().project.name === "chromium-mobile", "Mobile wire deletion is covered by the dedicated touch regression");
  await page.goto("/");
  await page.locator('.lesson[data-example="simple"]').click();
  const hit = page.locator("[data-wire]").nth(test.info().project.name === "chromium-mobile" ? 1 : 0);
  await hit.scrollIntoViewIfNeeded();
  const point = await hit.evaluate(el => {
    const p = el.getPointAtLength(el.getTotalLength() * 0.5);
    const m = el.ownerSVGElement.createSVGPoint();
    m.x = p.x;
    m.y = p.y;
    const client = m.matrixTransform(el.getScreenCTM());
    return { x: client.x, y: client.y };
  });
  await page.mouse.click(point.x, point.y);
  await expect(page.locator(".wire-selected")).toHaveCount(1);
  await page.keyboard.press("Delete");
  await expect(page.locator("[data-wire]")).toHaveCount(2);
  await page.locator("#undo").click();
  await expect(page.locator("[data-wire]")).toHaveCount(3);
  await page.locator("#redo").click();
  await expect(page.locator("[data-wire]")).toHaveCount(2);
});

test("undo and redo restore component property edits", async ({ page }) => {
  await page.goto("/");
  await page.locator('.lesson[data-example="simple"]').click();
  await page.locator("[data-node]").first().locator(".body-wrap").click();
  await expect(page.locator('[data-prop="voltage"]')).toHaveValue("9");
  const voltage = page.locator('[data-prop="voltage"]');
  await voltage.fill("12");
  await expect(page.locator('[data-prop="voltage"]')).toHaveValue("12");
  await page.locator("#undo").click();
  await page.locator("[data-node]").first().click();
  await expect(page.locator('[data-prop="voltage"]')).toHaveValue("9");
  await page.locator("#redo").click();
  await page.locator("[data-node]").first().click();
  await expect(page.locator('[data-prop="voltage"]')).toHaveValue("12");
});

test("series-parallel assessment uses current sample runs and rejects stale comparison state", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="series"]').click();
  await page.locator('.lesson[data-example="parallel"]').click();
  await page.locator("#checkLesson").click();
  await expect(page.locator("#explanation")).toContainText("Lesson requirements met.");
  await page.locator('[data-type="resistor"]').click();
  await page.locator("#checkLesson").click();
  await expect(page.locator("#explanation")).toContainText("Not yet.");
});

test("keyboard users can wire terminals and retain focus after rerender", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("vi");
  await page.locator('[data-type="battery"]').click();
  await page.locator('[data-type="lamp"]').click();
  const terminals = page.locator("[data-terminal]");
  await terminals.nth(0).focus();
  await expect(terminals.nth(0)).toHaveAttribute("aria-label", "Chân A");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-terminal]").nth(0)).toBeFocused();
  await page.locator("[data-terminal]").nth(2).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-wire]")).toHaveCount(1);
  await expect(page.locator("[data-terminal]").nth(2)).toBeFocused();
  await page.locator("#language").selectOption("en");
  await expect(page.locator("[data-terminal]").nth(0)).toHaveAttribute("aria-label", "Terminal A");
});

test("components rotate manually and auto-orient when terminals are connected", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('[data-type="battery"]').click();
  await page.locator('[data-type="lamp"]').click();
  await page.locator('[data-terminal="c1:b"]').click();
  await page.locator('[data-terminal="c2:a"]').click();
  await expect(page.locator('[data-node="c1"] .body-wrap')).toHaveAttribute("transform", "rotate(0)");
  await expect(page.locator('[data-node="c2"] .body-wrap')).toHaveAttribute("transform", "rotate(0)");
  await page.locator("#rotateComponent").click();
  await expect(page.locator('[data-node="c2"] .body-wrap')).toHaveAttribute("transform", "rotate(90)");
  await expect(page.locator('[data-terminal="c2:a"]')).toHaveAttribute("cy", "-36");
  await expect(page.locator('[data-terminal="c2:b"]')).toHaveAttribute("cy", "36");
  await page.keyboard.press("r");
  await expect(page.locator('[data-node="c2"] .body-wrap')).toHaveAttribute("transform", "rotate(180)");
  await page.locator('[data-node="c2"] [data-action="rotate"]').click();
  await expect(page.locator('[data-node="c2"] .body-wrap')).toHaveAttribute("transform", "rotate(270)");
});

test("dragging a component onto a wire inserts it in series and splits the wire", async ({ page }) => {
  test.skip(test.info().project.name === "chromium-mobile", "This drag gesture is exercised with desktop pointer input; rotation and wiring have separate mobile coverage.");
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="simple"]').click();
  await page.locator('[data-type="resistor"]').click();
  const paths = page.locator("[data-wire]");
  await expect(paths).toHaveCount(3);
  const target = await paths.evaluateAll(elements => {
    const candidates = elements.map(el => {
      const length = el.getTotalLength();
      const point = el.getPointAtLength(length / 2);
      const matrix = point.matrixTransform(el.getScreenCTM());
      return { length, x: matrix.x, y: matrix.y };
    }).sort((a, b) => b.length - a.length);
    return candidates[0];
  });
  const start = await page.locator(".node.selected .body-wrap").evaluate(el => {
    const matrix = el.getScreenCTM();
    return { x: matrix.e, y: matrix.f };
  });
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator("[data-node]")).toHaveCount(4);
  await expect(page.locator("[data-wire]")).toHaveCount(4);
  await expect(page.locator("#statusText")).toContainText("not run");
});

test("double-clicking a wire creates a junction and splits the wire", async ({ page }) => {
  test.skip(test.info().project.name === "chromium-mobile", "Double-click gesture is desktop-only; touch junction creation needs a dedicated gesture.");
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="simple"]').click();
  const point = await page.locator("[data-wire]").evaluateAll(elements => { const el = elements.sort((a,b)=>b.getTotalLength()-a.getTotalLength())[0]; const p = el.getPointAtLength(el.getTotalLength()*0.25).matrixTransform(el.getScreenCTM()); return {x:p.x,y:p.y}; });
  if (test.info().project.name === "chromium-mobile") {
    await page.touchscreen.tap(point.x, point.y);
    await page.waitForTimeout(80);
    await page.touchscreen.tap(point.x, point.y);
  } else {
    await page.mouse.dblclick(point.x, point.y);
  }
  await expect(page.locator(".junction-terminal")).toHaveCount(1);
  await expect(page.locator("[data-wire]")).toHaveCount(4);
  await page.locator("#run").click();
  await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(4);
  await page.locator('[data-type="resistor"]').click();
  const nodeId = await page.locator("[data-node]").last().getAttribute("data-node");
  await page.locator(".junction-terminal").click();
  await page.locator(`[data-terminal="${nodeId}:a"]`).click();
  await expect(page.locator("[data-wire]")).toHaveCount(5);
  await page.locator("#undo").click();
  await expect(page.locator("[data-wire]")).toHaveCount(4);
  await expect(page.locator(".junction-terminal")).toHaveCount(1);
  await page.locator("#undo").click();
  await expect(page.locator("[data-wire]")).toHaveCount(4);
  await expect(page.locator(".junction-terminal")).toHaveCount(1);
  await page.locator("#undo").click();
  await expect(page.locator("[data-wire]")).toHaveCount(3);
  await expect(page.locator(".junction-terminal")).toHaveCount(0);
  await page.locator("#redo").click();
  await expect(page.locator("[data-wire]")).toHaveCount(4);
  await expect(page.locator(".junction-terminal")).toHaveCount(1);
  await page.locator("#redo").click();
  await expect(page.locator("[data-wire]")).toHaveCount(4);
  await expect(page.locator(".junction-terminal")).toHaveCount(1);
  await page.locator("#redo").click();
  await expect(page.locator("[data-wire]")).toHaveCount(5);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#save").click();
  const download = await downloadPromise;
  const json = await readFile(await download.path(), "utf8");
  expect(JSON.parse(json).junctions).toHaveLength(1);
  await page.locator("#clear").click();
  await expect(page.locator(".junction-terminal")).toHaveCount(0);
  await page.locator("#fileInput").setInputFiles({ name: "junction-circuit.json", mimeType: "application/json", buffer: Buffer.from(json) });
  await expect(page.locator(".junction-terminal")).toHaveCount(1);
  await expect(page.locator("[data-wire]")).toHaveCount(5);
  await page.locator("#createLesson").click();
  await page.locator("#saveLesson").click();
  await expect(page.locator("#statusText")).toHaveText("Lesson saved.");
  const lessonDownloadPromise = page.waitForEvent("download");
  await page.locator("#exportLesson").click();
  const lessonDownload = await lessonDownloadPromise;
  const lessonJson = await readFile(await lessonDownload.path(), "utf8");
  expect(JSON.parse(lessonJson).startingCircuit.junctions).toHaveLength(1);
  await page.locator("#clear").click();
  await page.locator("#lessonFileInput").setInputFiles({ name: "junction-lesson.json", mimeType: "application/json", buffer: Buffer.from(lessonJson) });
  await expect(page.locator(".junction-terminal")).toHaveCount(1);
  await page.locator("#resetLesson").click();
  await expect(page.locator(".junction-terminal")).toHaveCount(1);
  await expect(page.locator("[data-wire]")).toHaveCount(5);
});

test("dragging a wire reshapes it with a new junction, and dragging a junction repositions it", async ({ page }) => {
  test.skip(test.info().project.name === "chromium-mobile", "Drag reshaping requires desktop mouse drag gestures");
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="simple"]').click();

  const wirePoint = await page.locator("[data-wire]").evaluateAll(elements => {
    const el = elements.sort((a, b) => b.getTotalLength() - a.getTotalLength())[0];
    const p = el.getPointAtLength(el.getTotalLength() * 0.35);
    const m = el.ownerSVGElement.createSVGPoint();
    m.x = p.x;
    m.y = p.y;
    const client = m.matrixTransform(el.getScreenCTM());
    return { x: client.x, y: client.y };
  });

  await page.mouse.move(wirePoint.x, wirePoint.y);
  await page.mouse.down();
  await page.mouse.move(wirePoint.x, wirePoint.y + 60, { steps: 5 });
  await page.mouse.up();

  await expect(page.locator(".junction-terminal")).toHaveCount(1);
  await expect(page.locator("[data-wire]")).toHaveCount(4);

  await page.locator("#run").click();
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
  await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(4);

  const junctionBox = await page.locator(".junction-terminal").boundingBox();
  expect(junctionBox).toBeTruthy();
  const jCenterX = junctionBox.x + junctionBox.width / 2;
  const jCenterY = junctionBox.y + junctionBox.height / 2;

  await page.mouse.move(jCenterX, jCenterY);
  await page.mouse.down();
  await page.mouse.move(jCenterX + 40, jCenterY + 30, { steps: 5 });
  await page.mouse.up();

  const newJunctionBox = await page.locator(".junction-terminal").boundingBox();
  expect(Math.abs(newJunctionBox.x - junctionBox.x)).toBeGreaterThan(20);

  await page.locator("#run").click();
  await expect(page.locator("#statusText")).toContainText("Closed circuit");

  await page.locator("#undo").click();
  const undoneBox = await page.locator(".junction-terminal").boundingBox();
  expect(Math.abs(undoneBox.x - junctionBox.x)).toBeLessThan(10);
});

test("grade curriculum filters lessons, opens every circuit and checks lesson requirements", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const expectations = { primary: 4, middle: 7, high: 9 };
  for (const level of ["primary", "middle", "high"]) {
    await page.locator("#level").selectOption(level);
    const cards = page.locator("[data-curriculum-lesson]");
    await expect(cards).toHaveCount(expectations[level]);
    await expect(cards.first()).toHaveAttribute("aria-current", "true");
    const ids = await cards.evaluateAll(elements => elements.map(element => element.dataset.curriculumLesson));
    for (const id of ids) {
      await page.locator('[data-curriculum-lesson="' + id + '"]').click();
      await expect(page.locator("[data-node]").first()).toBeVisible();
      await expect(page.locator("[data-wire]").first()).toBeAttached();
      if (["high-rc", "high-rl", "high-rlc", "high-ac-resistor", "high-ac-rc"].includes(id)) {
        const expectedMode = ({ "high-rc": "rc", "high-rl": "rl", "high-rlc": "rlc", "high-ac-resistor": "ac", "high-ac-rc": "ac-rc" })[id];
        await expect(page.locator("#transientMessage")).toContainText(expectedMode);
        await expect(page.locator("#statusText")).toContainText("Transient simulation complete");
      }
      if (id !== "series-vs-parallel") {
        await page.locator("#checkLesson").click();
        await expect(page.locator("#explanation")).toContainText("Lesson requirements met.", { timeout: 3000 });
      }
    }
  }
  expect(errors).toEqual([]);
});

test("main workbench has no serious or critical automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(item => item.impact === "critical" || item.impact === "serious");
  expect(blocking.map(item => ({ id: item.id, help: item.help, nodes: item.nodes.length }))).toEqual([]);
});

test("AC source has a localized fallback name and transient sine-wave plot stays inside chart bounds", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('[data-type="acSource"]').click();
  await expect(page.locator("[data-node] .node-label").first()).toHaveText("AC source");
  await expect(page.locator("[data-node]").first()).not.toContainText("undefined");
  await page.locator("#level").selectOption("high");
  await page.locator('[data-curriculum-lesson="high-ac-resistor"]').click();
  await page.locator("#transientStep").fill("0.001");
  await page.locator("#runTransient").click();
  await expect(page.locator("#transientMessage")).toContainText("ac");
  const points = await page.locator("#transientChart polyline").getAttribute("points");
  expect(points).toBeTruthy();
  const yValues = points.trim().split(/\s+/).map(point => Number(point.split(",")[1]));
  expect(yValues.length).toBeGreaterThan(100);
  expect(Math.min(...yValues)).toBeGreaterThanOrEqual(29);
  expect(Math.max(...yValues)).toBeLessThanOrEqual(175);
  expect(Math.max(...yValues) - Math.min(...yValues)).toBeGreaterThan(100);
  await expect(page.locator("#transientSignal option[value=\"c2:voltage\"]")).toHaveCount(1);
  await expect(page.locator("#transientSignal option[value=\"c2:current\"]")).toHaveCount(1);
  await page.locator("#transientSignal").selectOption("c2:current");
  await expect(page.locator("#transientChart polyline")).toBeAttached();
});


test("meters and passive components show live values and update after resistor changes", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator("#level").selectOption("high");
  await page.locator('[data-curriculum-lesson="high-meter"]').click();
  const ammeter = page.locator('[data-node="c2"]');
  await expect(ammeter.locator(".instrument-display text")).toContainText("A");
  await expect(page.locator('[data-node="c3"] .instrument-display text')).toContainText("U");
  const before = (await ammeter.locator(".instrument-display text").textContent()).trim();
  await page.locator('[data-node="c3"] .body-wrap').click();
  const resistance = page.locator('[data-prop="resistance"]');
  await resistance.fill("200");
  await resistance.dispatchEvent("change");
  const after = (await page.locator('[data-node="c2"] .instrument-display text').textContent()).trim();
  expect(after).not.toBe(before);
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
});

test("switch toggling recomputes live measurements without pressing Run again", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="simple"]').click();
  await expect(page.locator("#currentMetric")).toContainText("1.5");
  await page.locator('[data-node="c2"] .body-wrap').click();
  await expect(page.locator("#currentMetric")).toContainText("0");
  await expect(page.locator("#statusText")).toContainText("open");
  await page.locator('[data-node="c2"] .body-wrap').click();
  await expect(page.locator("#currentMetric")).toContainText("1.5");
});

test("AC transient animates wire current direction and reverses with the instantaneous waveform", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "high",
    components: [
      { id: "ac", type: "acSource", x: 200, y: 250, amplitude: 5, frequency: 5, phase: 0, offset: 0 },
      { id: "r", type: "resistor", x: 600, y: 250, resistance: 100 }
    ],
    wires: [
      { id: "w1", from: "ac:a", to: "r:a" },
      { id: "w2", from: "r:b", to: "ac:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({
    name: "ac-resistor.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#transientDuration").fill("0.6");
  await page.locator("#transientStep").fill("0.001");
  await page.locator("#runTransient").click();
  await expect(page.locator("#transientMessage")).toContainText("ac");
  await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(2);
  const directions = await page.evaluate(async () => {
    const observed = new Set();
    const collect = () => {
      for (const element of document.querySelectorAll("[data-wire-flow-overlay]")) {
        const direction = Number(element.dataset.wireDirection);
        if (direction !== 0) observed.add(direction);
      }
    };
    collect();
    const timer = setInterval(collect, 20);
    await new Promise(resolve => setTimeout(resolve, 1250));
    clearInterval(timer);
    collect();
    return [...observed];
  });
  expect(directions).toContain(1);
  expect(directions).toContain(-1);
  const reverseCount = await page.locator("[data-wire-flow-overlay].flow-reverse").count();
  expect([0, 2]).toContain(reverseCount);
});


test("AC RL and series-RLC transients reverse every series wire with signed current", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const cases = [
    {
      name: "ac-rl.json",
      components: [
        { id: "ac", type: "acSource", x: 150, y: 250, amplitude: 5, frequency: 5, phase: 0, offset: 0 },
        { id: "r", type: "resistor", x: 400, y: 250, resistance: 100 },
        { id: "l", type: "inductor", x: 650, y: 250, inductance: 0.1, initialCurrent: 0 }
      ],
      wires: [
        { id: "w1", from: "ac:a", to: "r:a" },
        { id: "w2", from: "r:b", to: "l:a" },
        { id: "w3", from: "l:b", to: "ac:b" }
      ]
    },
    {
      name: "ac-rlc.json",
      components: [
        { id: "ac", type: "acSource", x: 150, y: 250, amplitude: 5, frequency: 5, phase: 0, offset: 0 },
        { id: "r", type: "resistor", x: 350, y: 250, resistance: 10 },
        { id: "l", type: "inductor", x: 550, y: 250, inductance: 0.1, initialCurrent: 0 },
        { id: "c", type: "capacitor", x: 750, y: 250, capacitance: 0.0001, initialVoltage: 0 }
      ],
      wires: [
        { id: "w1", from: "ac:a", to: "r:a" },
        { id: "w2", from: "r:b", to: "l:a" },
        { id: "w3", from: "l:b", to: "c:a" },
        { id: "w4", from: "c:b", to: "ac:b" }
      ]
    }
  ];
  for (const circuit of cases) {
    await page.locator("#fileInput").setInputFiles({
      name: circuit.name,
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, app: "CircuitLab Edu", level: "high", components: circuit.components, wires: circuit.wires }))
    });
    await page.locator("#transientDuration").fill("0.6");
    await page.locator("#transientStep").fill("0.001");
    await page.locator("#runTransient").click();
    await expect(page.locator("#transientPanel")).toBeVisible();
    await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(circuit.wires.length);
    const directions = await page.evaluate(async () => {
      const seen = new Map();
      const collect = () => {
        for (const element of document.querySelectorAll("[data-wire-flow-overlay]")) {
          const id = element.dataset.wireFlowOverlay;
          const direction = Number(element.dataset.wireDirection);
          if (direction !== 0) {
            if (!seen.has(id)) seen.set(id, new Set());
            seen.get(id).add(direction);
          }
        }
      };
      collect();
      const timer = setInterval(collect, 20);
      await new Promise(resolve => setTimeout(resolve, 1400));
      clearInterval(timer);
      collect();
      return [...seen].map(([id, values]) => [id, [...values]]);
    });
    expect(directions).toHaveLength(circuit.wires.length);
    for (const [wireId, values] of directions) {
      expect(values, `${circuit.name} ${wireId} should show both current directions`).toContain(1);
      expect(values, `${circuit.name} ${wireId} should show both current directions`).toContain(-1);
    }
  }
});


test("AC source with positive and negative DC offsets larger than amplitude keeps the correct direction", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const observedByOffset = new Map();
  for (const offset of [2, -2]) {
    const circuit = {
      schemaVersion: 1,
      app: "CircuitLab Edu",
      level: "high",
      components: [
        { id: "ac", type: "acSource", x: 200, y: 250, amplitude: 1, frequency: 50, phase: 0, offset },
        { id: "r", type: "resistor", x: 600, y: 250, resistance: 100 }
      ],
      wires: [
        { id: "w1", from: "ac:a", to: "r:a" },
        { id: "w2", from: "r:b", to: "ac:b" }
      ]
    };
    await page.locator("#fileInput").setInputFiles({
      name: `ac-offset-${offset}.json`,
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(circuit))
    });
    await page.locator("#transientDuration").fill("0.1");
    await page.locator("#transientStep").fill("0.001");
    await page.locator("#runTransient").click();
    await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(2);
    const directions = await page.evaluate(async () => {
      const seen = new Map();
      const collect = () => {
        for (const element of document.querySelectorAll("[data-wire-flow-overlay]")) {
          const id = element.dataset.wireFlowOverlay;
          const direction = Number(element.dataset.wireDirection);
          if (direction !== 0) {
            if (!seen.has(id)) seen.set(id, new Set());
            seen.get(id).add(direction);
          }
        }
      };
      collect();
      const timer = setInterval(collect, 20);
      await new Promise(resolve => setTimeout(resolve, 1100));
      clearInterval(timer);
      collect();
      return [...seen].map(([id, values]) => [id, [...values]]);
    });
    expect(directions).toHaveLength(2);
    for (const [wireId, values] of directions) {
      expect(values.length, `${wireId} should keep a stable signed direction for offset ${offset}`).toBe(1);
    }
    observedByOffset.set(offset, new Map(directions.map(([wireId, values]) => [wireId, values[0]])));
  }
  for (const wireId of ["w1", "w2"]) {
    expect(observedByOffset.get(-2).get(wireId), `${wireId} should reverse when the DC offset changes sign`).toBe(-observedByOffset.get(2).get(wireId));
  }
});


test("editing a component invalidates AC transient flow and prevents stale animation frames", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "high",
    components: [
      { id: "ac", type: "acSource", x: 200, y: 250, amplitude: 5, frequency: 50, phase: 0, offset: 0 },
      { id: "r", type: "resistor", x: 600, y: 250, resistance: 100 }
    ],
    wires: [
      { id: "w1", from: "ac:a", to: "r:a" },
      { id: "w2", from: "r:b", to: "ac:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({
    name: "ac-edit-invalidation.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#transientDuration").fill("0.1");
  await page.locator("#transientStep").fill("0.001");
  await page.locator("#runTransient").click();
  await expect(page.locator("#transientPanel")).toBeVisible();
  await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(2);
  await page.locator('[data-node="r"]').click();
  const resistance = page.locator('[data-prop="resistance"]');
  await resistance.fill("200");
  await resistance.dispatchEvent("change");
  await expect(page.locator("#transientPanel")).toBeHidden();
  await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(0);
  await page.waitForTimeout(180);
  await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(0);
});

test("AC wire-flow animation follows simulation time instead of slowing with sample count", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "high",
    components: [
      { id: "ac", type: "acSource", x: 200, y: 250, amplitude: 5, frequency: 1, phase: 0, offset: 0 },
      { id: "r", type: "resistor", x: 600, y: 250, resistance: 100 }
    ],
    wires: [
      { id: "w1", from: "ac:a", to: "r:a" },
      { id: "w2", from: "r:b", to: "ac:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({
    name: "ac-realtime-animation.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#transientDuration").fill("1");
  await page.locator("#transientStep").fill("0.001");
  await page.locator("#runTransient").click();
  await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(2);
  const sampleAt = async delay => {
    await page.waitForTimeout(delay);
    return page.locator('[data-wire-flow-overlay="w1"]').getAttribute("data-wire-direction");
  };
  const atQuarterCycle = await sampleAt(200);
  const atThreeQuarterCycle = await sampleAt(400);
  expect(Number(atQuarterCycle)).toBe(1);
  expect(Number(atThreeQuarterCycle)).toBe(-1);
});

test("wire-flow direction becomes neutral at an AC current zero crossing", async ({ page }) => {
  test.skip(test.info().project.name === "chromium-mobile", "Mobile emulation does not keep performance.now aligned with fake-clock interval advancement for this timing-specific assertion.");
  await page.clock.install();
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "high",
    components: [
      { id: "ac", type: "acSource", x: 200, y: 250, amplitude: 5, frequency: 1, phase: -3.6, offset: 5 },
      { id: "r", type: "resistor", x: 600, y: 250, resistance: 100 }
    ],
    wires: [
      { id: "w1", from: "ac:a", to: "r:a" },
      { id: "w2", from: "r:b", to: "ac:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({
    name: "ac-zero-crossing.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#transientDuration").fill("1");
  await page.locator("#transientStep").fill("0.001");
  await page.locator("#runTransient").click();
  await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(2);
  await page.clock.runFor(760);
  await expect(page.locator('[data-wire-flow-overlay="w1"]')).toHaveAttribute("data-wire-direction", "0");
  await expect(page.locator('[data-wire-flow-overlay="w1"]')).toHaveCSS("display", "none");
});

test("high-frequency AC transient warns that the wire animation may skip reversals", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "high",
    components: [
      { id: "ac", type: "acSource", x: 200, y: 250, amplitude: 5, frequency: 50, phase: 0, offset: 0 },
      { id: "r", type: "resistor", x: 600, y: 250, resistance: 100 }
    ],
    wires: [
      { id: "w1", from: "ac:a", to: "r:a" },
      { id: "w2", from: "r:b", to: "ac:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({
    name: "ac-high-frequency-animation.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#transientDuration").fill("0.1");
  await page.locator("#transientStep").fill("0.0001");
  await page.locator("#runTransient").click();
  await expect(page.locator("#transientMessage")).toContainText("updates every 40 ms");
  await expect(page.locator("#transientMessage")).toContainText("above 12.5 Hz");
  await expect(page.locator("#transientChart")).toContainText("Time (s)");
});

test("starting DC simulation replaces transient flow without retaining transient direction frames", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "high",
    components: [
      { id: "battery", type: "battery", x: 200, y: 250, voltage: 9 },
      { id: "r", type: "resistor", x: 600, y: 250, resistance: 100 }
    ],
    wires: [
      { id: "w1", from: "battery:a", to: "r:a" },
      { id: "w2", from: "r:b", to: "battery:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({
    name: "dc-transient-to-dc-run.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#transientDuration").fill("0.1");
  await page.locator("#transientStep").fill("0.001");
  await page.locator("#runTransient").click();
  await expect(page.locator("#transientPanel")).toBeVisible();
  await page.locator("#run").click();
  await expect(page.locator("#transientPanel")).toBeHidden();
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
  await expect(page.locator("[data-wire-flow-overlay]")).toHaveCount(2);
  const directions = await page.evaluate(async () => {
    const observed = new Map();
    const collect = () => {
      for (const element of document.querySelectorAll("[data-wire-flow-overlay]")) {
        const id = element.dataset.wireFlowOverlay;
        if (!observed.has(id)) observed.set(id, new Set());
        observed.get(id).add(Number(element.dataset.wireDirection));
      }
    };
    collect();
    const timer = setInterval(collect, 20);
    await new Promise(resolve => setTimeout(resolve, 180));
    clearInterval(timer);
    collect();
    return [...observed.values()].map(values => [...values]);
  });
  expect(directions).toHaveLength(2);
  for (const values of directions) expect(values).toEqual([1]);
});

test("UI typography and interactive controls remain readable and usable on desktop and mobile", async ({ page }) => {
  await page.goto("/");
  const measurements = await page.evaluate(() => {
    const font = selector => {
      const element = document.querySelector(selector);
      return element ? Number.parseFloat(getComputedStyle(element).fontSize) : null;
    };
    const target = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };
    return {
      componentLabel: font(".component b"),
      componentDescription: font(".component small"),
      metricLabel: font(".metric > span"),
      addComponentTarget: target('.component[data-type="battery"]'),
      runTarget: target("#run")
    };
  });
  expect(measurements.componentLabel).toBeGreaterThanOrEqual(10);
  expect(measurements.componentDescription).toBeGreaterThanOrEqual(10);
  expect(measurements.metricLabel).toBeGreaterThanOrEqual(11);
  expect(measurements.addComponentTarget.height).toBeGreaterThanOrEqual(44);
  expect(measurements.runTarget.height).toBeGreaterThanOrEqual(38);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("narrow phone layout does not hide save or clear actions or create horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.locator("#save")).toBeVisible();
  await expect(page.locator("#open")).toBeVisible();
  await expect(page.locator("#clear")).toBeVisible();
  await expect(page.locator("#run")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});


test("voltmeter reads the voltage across its parallel load while ammeter reads series current after edits", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "high",
    components: [
      { id: "source", type: "battery", x: 150, y: 220, voltage: 9, name: "9 V source" },
      { id: "ammeter", type: "ammeter", x: 350, y: 220, name: "A1" },
      { id: "load", type: "resistor", x: 550, y: 220, resistance: 100, name: "R1" },
      { id: "voltmeter", type: "voltmeter", x: 550, y: 390, name: "V1" }
    ],
    wires: [
      { id: "w1", from: "source:a", to: "ammeter:a" },
      { id: "w2", from: "ammeter:b", to: "load:a" },
      { id: "w3", from: "load:b", to: "source:b" },
      { id: "w4", from: "load:a", to: "voltmeter:a" },
      { id: "w5", from: "voltmeter:b", to: "load:b" }
    ],
    junctions: []
  };
  await page.locator("#fileInput").setInputFiles({
    name: "ammeter-voltmeter-regression.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#run").click();

  const ammeterDisplay = page.locator('[data-node="ammeter"] .instrument-display text');
  const voltmeterDisplay = page.locator('[data-node="voltmeter"] .instrument-display text');
  await expect(ammeterDisplay).toHaveText("0.09 A");
  await expect(voltmeterDisplay).toHaveText("9 V");
  await expect(page.locator("#statusText")).toContainText("Closed circuit");

  await page.locator('[data-node="load"] .body-wrap').click();
  const resistance = page.locator('[data-prop="resistance"]');
  await resistance.fill("200");
  await resistance.dispatchEvent("change");
  await page.locator("#run").click();

  await expect(ammeterDisplay).toHaveText("0.045 A");
  await expect(voltmeterDisplay).toHaveText("9 V");
  await expect(page.locator("#statusText")).toContainText("Closed circuit");

  const reversedCircuit = {
    ...circuit,
    components: circuit.components.map(component => component.id === "load" ? { ...component, resistance: 100 } : component),
    wires: [
      { id: "w1", from: "source:a", to: "ammeter:b" },
      { id: "w2", from: "ammeter:a", to: "load:a" },
      { id: "w3", from: "load:b", to: "source:b" },
      { id: "w4", from: "load:a", to: "voltmeter:b" },
      { id: "w5", from: "voltmeter:a", to: "load:b" }
    ]
  };
  await page.locator("#fileInput").setInputFiles({
    name: "reversed-meter-polarity.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(reversedCircuit))
  });
  await page.locator("#run").click();
  await expect(ammeterDisplay).toHaveText("-0.09 A");
  await expect(voltmeterDisplay).toHaveText("-9 V");
});


test("parallel branch meters report independent branch currents and load voltages", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  const circuit = {
    schemaVersion: 1,
    app: "CircuitLab Edu",
    level: "high",
    components: [
      { id: "source", type: "battery", x: 120, y: 240, voltage: 12 },
      { id: "a1", type: "ammeter", x: 300, y: 160 },
      { id: "r1", type: "resistor", x: 480, y: 160, resistance: 6 },
      { id: "v1", type: "voltmeter", x: 480, y: 340 },
      { id: "a2", type: "ammeter", x: 300, y: 430 },
      { id: "r2", type: "resistor", x: 650, y: 430, resistance: 12 },
      { id: "v2", type: "voltmeter", x: 650, y: 300 }
    ],
    wires: [
      { id: "w1", from: "source:a", to: "a1:a" },
      { id: "w2", from: "a1:b", to: "r1:a" },
      { id: "w3", from: "r1:b", to: "source:b" },
      { id: "w4", from: "source:a", to: "a2:a" },
      { id: "w5", from: "a2:b", to: "r2:a" },
      { id: "w6", from: "r2:b", to: "source:b" },
      { id: "w7", from: "v1:a", to: "r1:a" },
      { id: "w8", from: "v1:b", to: "r1:b" },
      { id: "w9", from: "v2:a", to: "r2:a" },
      { id: "w10", from: "v2:b", to: "r2:b" }
    ],
    junctions: []
  };
  await page.locator("#fileInput").setInputFiles({
    name: "parallel-branch-meter-regression.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(circuit))
  });
  await page.locator("#run").click();

  await expect(page.locator('[data-node="a1"] .instrument-display text')).toHaveText("2 A");
  await expect(page.locator('[data-node="a2"] .instrument-display text')).toHaveText(/^(?:1|0\.9999) A$/);
  await expect(page.locator('[data-node="v1"] .instrument-display text')).toHaveText("12 V");
  await expect(page.locator('[data-node="v2"] .instrument-display text')).toHaveText("12 V");
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
  await expect(page.locator("#explanation")).toContainText("current");
});

test("connecting terminals preserves existing orientation and does not auto-rotate", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('[data-type="battery"]').click();
  await page.locator('[data-type="lamp"]').click();
  // c1 is at (120, 110), c2 is at (280, 110). Rotate c2 to 90deg using on-node rotate icon
  await page.locator('[data-node="c2"] [data-action="rotate"]').click();
  await expect(page.locator('[data-node="c2"] .body-wrap')).toHaveAttribute("transform", "rotate(90)");
  await expect(page.locator('[data-node="c1"] .body-wrap')).toHaveAttribute("transform", "rotate(0)");

  // Connect terminals: should NOT auto-rotate
  await page.locator('[data-terminal="c1:b"]').click();
  await page.locator('[data-terminal="c2:a"]').click();
  await expect(page.locator('[data-wire]')).toHaveCount(1);
  await expect(page.locator('[data-node="c1"] .body-wrap')).toHaveAttribute("transform", "rotate(0)");
  await expect(page.locator('[data-node="c2"] .body-wrap')).toHaveAttribute("transform", "rotate(90)");
});

test("dropping a component from palette onto a wire connects it in series", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="simple"]').click();
  await expect(page.locator("[data-node]")).toHaveCount(3);
  await expect(page.locator("[data-wire]")).toHaveCount(3);

  // Find midpoint of the longest wire to drop onto
  const dropCoords = await page.locator("[data-wire]").evaluateAll(elements => {
    const el = elements.sort((a, b) => b.getTotalLength() - a.getTotalLength())[0];
    const pt = el.getPointAtLength(el.getTotalLength() / 2);
    const client = pt.matrixTransform(el.getScreenCTM());
    return { clientX: client.x, clientY: client.y };
  });

  // Dispatch HTML5 drop event on #canvasWrap
  await page.evaluate(({ clientX, clientY }) => {
    const target = document.querySelector("#canvasWrap");
    const dt = new DataTransfer();
    dt.setData("text/plain", "resistor");
    const dropEvent = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      dataTransfer: dt
    });
    target.dispatchEvent(dropEvent);
  }, dropCoords);

  // Verifies the resistor was added AND spliced into the wire
  await expect(page.locator("[data-node]")).toHaveCount(4);
  await expect(page.locator("[data-wire]")).toHaveCount(4);
  // Verify it completes the circuit when simulated
  await page.locator('[data-node="c2"]').click();
  await page.locator("#prop-closed").selectOption("true");
  await page.locator("#run").click();
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
});

test("flow overlays render directional arrows along conducting wires", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("en");
  await page.locator('.lesson[data-example="simple"]').click();
  await expect(page.locator("#statusText")).toContainText("Closed circuit");
  const arrowCount = await page.locator(".wire-flow-overlay .flow-arrow").count();
  expect(arrowCount).toBeGreaterThan(0);
  const color = await page.locator(".flow-arrow").first().evaluate(el => getComputedStyle(el).fill);
  expect(color).toBe("rgb(230, 81, 0)");
});

test("switch graphically renders open and closed blade positions without textual state label", async ({ page }) => {
  await page.goto("/");
  await page.locator("#language").selectOption("vi");
  await page.locator('.lesson[data-example="simple"]').click();
  const switchNode = page.locator('[data-node="c2"]');
  const onBlade = switchNode.locator(".wirepart.switch-on");
  await expect(onBlade).toHaveCount(1);
  expect(await onBlade.getAttribute("y1")).toBe("0");
  expect(await onBlade.getAttribute("y2")).toBe("0");
  await expect(switchNode.locator(".node-value")).toHaveText("");

  await switchNode.locator(".body-wrap").click();
  const offBlade = switchNode.locator(".wirepart.switch-off");
  await expect(offBlade).toHaveCount(1);
  expect(Number(await offBlade.getAttribute("y2"))).toBeLessThan(0);
  await expect(switchNode.locator(".node-value")).toHaveText("");
});

test("lamp glow is not rendered as a black circle when lit or unlit", async ({ page }) => {
  await page.goto("/");
  await page.locator('.lesson[data-example="simple"]').click();
  const lampNode = page.locator('[data-node="c3"]');
  await expect(lampNode).toHaveClass(/lit/);
  const glow = lampNode.locator(".glow");
  const fill = await glow.evaluate(el => getComputedStyle(el).fill);
  expect(fill).not.toBe("rgb(0, 0, 0)");
  expect(fill).toContain("255");
});

test("inserting component into right-to-left return wire connects without routing errors or crossed wires", async ({ page }) => {
  await page.goto("/");
  await page.locator('.lesson[data-example="series"]').click();
  const dropCoords = await page.locator("[data-wire]").evaluateAll(elements => {
    const el = elements.find(e => e.closest('[data-wire-group="w3"]')) || elements[elements.length - 1];
    const pt = el.getPointAtLength(el.getTotalLength() / 2);
    const client = pt.matrixTransform(el.getScreenCTM());
    return { clientX: client.x, clientY: client.y };
  });

  await page.evaluate(({ clientX, clientY }) => {
    const target = document.querySelector("#canvasWrap");
    const dt = new DataTransfer();
    dt.setData("text/plain", "ammeter");
    target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, clientX, clientY, dataTransfer: dt }));
  }, dropCoords);

  await expect(page.locator('[data-node]')).toHaveCount(4);
  await expect(page.locator('[data-wire]')).toHaveCount(4);
  await expect(page.locator(".wire-routing-error")).toHaveCount(0);
  await page.locator("#run").click();
  await expect(page.locator("#statusText")).toContainText(/Closed circuit|Mạch kín/);
});





