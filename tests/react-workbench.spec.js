import { test, expect } from '@playwright/test';

const labUrl = 'http://127.0.0.1:4174/react-lab/';

test('React workbench mounts with lessons supplied by an external package and no runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(labUrl);
  await expect(page.getByRole('heading', { name: 'Phòng thử nghiệm React' })).toBeVisible();
  await expect(page.locator('#lesson-select option')).toHaveCount(20);
  await expect(page.getByTestId('pack-status')).toContainText('@circuitlabedu/exercise-pack-basic');
  await expect(page.getByTestId('canvas-frame').locator('svg')).toBeVisible();
  expect(errors).toEqual([]);
});

test('lesson selection loads a series-resistor circuit and edits change core solver readings', async ({ page }) => {
  await page.goto(labUrl);
  await page.locator('#lesson-select').selectOption('middle-series-resistors');
  await expect(page.getByTestId('resistor-symbol')).toHaveCount(2);
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  const firstCurrent = Number((await page.getByTestId('current-value').textContent()).replace(' A', ''));
  await page.locator('#resistance').fill('40');
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  const secondCurrent = Number((await page.getByTestId('current-value').textContent()).replace(' A', ''));
  expect(firstCurrent).toBeCloseTo(9 / 300, 3);
  expect(secondCurrent).toBeCloseTo(9 / 240, 2);
  expect(secondCurrent).toBeGreaterThan(firstCurrent);
});

test('selecting a component on the SVG lets the user edit its value and updates solver results', async ({ page }) => {
  await page.goto(labUrl);
  await page.locator('#lesson-select').selectOption('primary-conductors');
  await page.getByTestId('lamp-symbol').first().click();
  await expect(page.getByTestId('selected-component-label')).toHaveText('L1');
  await expect(page.locator('#resistance')).toHaveValue('6');
  await page.locator('#resistance').fill('20');
  await expect(page.getByTestId('resistance-value')).toHaveText('20 Ω');
  await expect(page.getByTestId('lamp-symbol').first()).toContainText('20 Ω');
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  await expect(page.getByTestId('current-value')).toHaveText('0.346 A');
  await page.getByTestId('lamp-symbol').nth(1).click();
  await expect(page.getByTestId('selected-component-label')).toHaveText('L2');
  await expect(page.locator('#resistance')).toHaveValue('6');
});

test('switch interaction is keyboard accessible and open circuit reports zero current', async ({ page }) => {
  await page.goto(labUrl);
  const switchSymbol = page.getByTestId('switch-symbol');
  await expect(switchSymbol).toHaveAttribute('aria-label', 'Công tắc đang đóng');
  await switchSymbol.focus();
  await page.keyboard.press('Space');
  await expect(switchSymbol).toHaveAttribute('aria-label', 'Công tắc đang mở');
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  await expect(page.getByTestId('solve-status')).toHaveText('Mạch hở');
  await expect(page.getByTestId('current-value')).toHaveText('0.000 A');
});

test('external lesson pack can be loaded without changing core or React package', async ({ page }) => {
  await page.goto(labUrl);
  const externalLesson = {
    id: 'external-ohms-law', schemaVersion: 1, level: 'middle', example: 'external',
    title: { vi: 'Bài học nạp ngoài', en: 'Externally loaded lesson' },
    objective: { vi: 'Kiểm tra nội dung từ file JSON.', en: 'Verify lesson content loaded from JSON.' },
    hints: { vi: ['Thử thay đổi điện trở.'], en: ['Try changing resistance.'] },
    expected: { componentTypes: ['battery', 'resistor'], relation: 'ohms-law', tolerance: 0.01 }
  };
  await page.locator('#pack-file').setInputFiles({ name: 'external-pack.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ lessons: [externalLesson] })) });
  await expect(page.getByTestId('pack-status')).toHaveText('external-pack.json');
  await expect(page.locator('#lesson-select option')).toHaveCount(1);
  await expect(page.getByTestId('lesson-card')).toContainText('Bài học nạp ngoài');
  await expect(page.locator('.notice')).toContainText('Đã nạp pack ngoài');
});

test('invalid external pack is rejected while current pack remains available', async ({ page }) => {
  await page.goto(labUrl);
  await page.locator('#pack-file').setInputFiles({ name: 'bad-pack.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ lessons: [{ id: 'bad' }] })) });
  await expect(page.locator('.notice')).toContainText('Pack không hợp lệ');
  await expect(page.getByTestId('pack-status')).toContainText('@circuitlabedu/exercise-pack-basic');
  await expect(page.locator('#lesson-select option')).toHaveCount(20);
});

test('changing a solved circuit invalidates stale readings until the next simulation', async ({ page }) => {
  await page.goto(labUrl);
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  await expect(page.getByTestId('current-value')).toBeVisible();
  await page.locator('#resistance').fill('40');
  await expect(page.getByTestId('result-empty')).toBeVisible();
  await expect(page.getByTestId('current-value')).toHaveCount(0);
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  await expect(page.getByTestId('current-value')).toBeVisible();
  await page.getByTestId('switch-symbol').click();
  await expect(page.getByTestId('result-empty')).toBeVisible();
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  await expect(page.getByTestId('current-value')).toHaveText('0.000 A');
});

test('duplicate lesson IDs are rejected and the active pack is preserved', async ({ page }) => {
  await page.goto(labUrl);
  const lesson = {
    id: 'duplicate-id', schemaVersion: 1, level: 'middle',
    title: { vi: 'Bài trùng ID', en: 'Duplicate ID lesson' },
    objective: { vi: 'Kiểm tra ID trùng.', en: 'Check duplicate IDs.' },
    expected: { relation: 'ohms-law' }
  };
  await page.locator('#pack-file').setInputFiles({
    name: 'duplicate-pack.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ lessons: [lesson, { ...lesson, title: { vi: 'Bài khác', en: 'Another lesson' } }] }))
  });
  await expect(page.locator('.notice')).toContainText('Pack không hợp lệ');
  await expect(page.getByTestId('pack-status')).toContainText('@circuitlabedu/exercise-pack-basic');
  await expect(page.locator('#lesson-select option')).toHaveCount(20);
});

test('React workbench remains usable at phone width without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(labUrl);
  await expect(page.getByRole('button', { name: 'Chạy mô phỏng' })).toBeVisible();
  await expect(page.locator('#lesson-select')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const sizeBefore = await page.getByTestId('canvas-frame').locator('svg').boundingBox();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await page.getByTestId('canvas-frame').locator('svg').boundingBox()).width).toBeGreaterThan(sizeBefore.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});


test('selecting a lesson loads its own startingCircuit and the canvas renders arbitrary component counts', async ({ page }) => {
  await page.goto(labUrl);
  const externalLesson = {
    id: 'external-starter-circuit', schemaVersion: 1, level: 'middle',
    title: { vi: 'Mạch bắt đầu từ pack', en: 'Pack-provided starter circuit' },
    objective: { vi: 'Kiểm tra mạch được nạp từ dữ liệu.', en: 'Verify the circuit is loaded from lesson data.' },
    expected: { componentTypes: ['battery', 'resistor'], requireClosedCircuit: true, relation: 'ohms-law', tolerance: 0.01 },
    startingCircuit: {
      schemaVersion: 1,
      components: [
        { id: 'supply-x', type: 'battery', voltage: 9, x: 100, y: 200, name: 'Supply X' },
        { id: 'load-x', type: 'resistor', resistance: 100, x: 360, y: 200, name: 'Load X' }
      ],
      wires: [
        { id: 'wx1', from: 'supply-x:a', to: 'load-x:a' },
        { id: 'wx2', from: 'load-x:b', to: 'supply-x:b' }
      ],
      junctions: []
    }
  };
  await page.locator('#pack-file').setInputFiles({
    name: 'starter-pack.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ lessons: [externalLesson] }))
  });
  await expect(page.getByTestId('pack-status')).toHaveText('starter-pack.json');
  await expect(page.getByTestId('battery-symbol')).toHaveCount(1);
  await expect(page.getByTestId('resistor-symbol')).toHaveCount(1);
  await expect(page.getByTestId('wire')).toHaveCount(2);
  await expect(page.getByTestId('selected-component-label')).toHaveText('Load X');
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  await expect(page.getByTestId('current-value')).toHaveText('0.090 A');
  await page.locator('#resistance').fill('200');
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  await expect(page.getByTestId('current-value')).toHaveText('0.045 A');
  await page.getByRole('button', { name: 'Kiểm tra yêu cầu' }).click();
  await expect(page.getByTestId('assessment-result')).toContainText('Đạt yêu cầu bài học');
});

test('built-in lesson selection replaces the active circuit with its matching component topology', async ({ page }) => {
  await page.goto(labUrl);
  await page.locator('#lesson-select').selectOption('middle-series-resistors');
  await expect(page.getByTestId('resistor-symbol')).toHaveCount(2);
  await expect(page.getByTestId('battery-symbol')).toHaveCount(1);
  await expect(page.getByTestId('wire')).toHaveCount(3);
  await page.locator('#lesson-select').selectOption('middle-parallel-switches');
  await expect(page.getByTestId('switch-symbol')).toHaveCount(2);
  await expect(page.getByTestId('lamp-symbol')).toHaveCount(2);
});

test('transient lesson components can be selected, edited and simulated without runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(labUrl);
  await page.locator('#lesson-select').selectOption('high-rc');
  await expect(page.getByTestId('resistor-symbol')).toHaveCount(1);
  await expect(page.getByTestId('capacitor-symbol')).toHaveCount(1);
  await page.getByTestId('capacitor-symbol').click();
  await expect(page.getByTestId('selected-component-label')).toContainText('capacitor-2');
  await expect(page.locator('#resistance')).toHaveValue('10');
  await page.locator('#resistance').fill('20');
  await expect(page.getByTestId('resistance-value')).toContainText('20 µF');
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  await expect(page.getByTestId('result-panel')).toBeVisible();
  expect(errors).toEqual([]);
});

test('an empty but valid startingCircuit renders safely instead of falling back to a fixed demo circuit', async ({ page }) => {
  const emptyLesson = {
    id: 'empty-starter-circuit', schemaVersion: 1, level: 'primary',
    title: { vi: 'Mạch trống', en: 'Empty circuit' },
    objective: { vi: 'Thêm linh kiện để bắt đầu.', en: 'Add components to begin.' },
    expected: { relation: 'ohms-law' },
    startingCircuit: { schemaVersion: 1, components: [], wires: [], junctions: [] }
  };
  await page.goto(labUrl);
  await page.locator('#pack-file').setInputFiles({
    name: 'empty-starter-pack.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ lessons: [emptyLesson] }))
  });
  await expect(page.getByTestId('pack-status')).toHaveText('empty-starter-pack.json');
  await expect(page.getByTestId('battery-symbol')).toHaveCount(0);
  await expect(page.getByTestId('resistor-symbol')).toHaveCount(0);
  await expect(page.getByTestId('selected-component-label')).toHaveText('Chưa có linh kiện');
  await expect(page.locator('#resistance')).toBeDisabled();
});
