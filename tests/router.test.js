import test from "node:test";
import assert from "node:assert/strict";
import { routeOrthogonal } from "../wire-router.js";

function assertOrthogonal(points) {
  for (let i = 1; i < points.length; i++) {
    assert.ok(points[i - 1].x === points[i].x || points[i - 1].y === points[i].y, "every segment must be horizontal or vertical");
  }
}

function intersectsRect(a, b, o) {
  if (a.y === b.y) return a.y > o.t && a.y < o.b && Math.max(Math.min(a.x, b.x), o.l) < Math.min(Math.max(a.x, b.x), o.r);
  if (a.x === b.x) return a.x > o.l && a.x < o.r && Math.max(Math.min(a.y, b.y), o.t) < Math.min(Math.max(a.y, b.y), o.b);
  return true;
}

test("routes a straight connection with right-angle segments", () => {
  const points = routeOrthogonal({ x: 100, y: 100 }, { x: 500, y: 100 });
  assert.deepEqual(points, [{ x: 100, y: 100 }, { x: 500, y: 100 }]);
  assertOrthogonal(points);
});

test("routes around an intervening component instead of crossing it", () => {
  const obstacle = { l: 250, r: 350, t: 70, b: 150 };
  const points = routeOrthogonal({ x: 100, y: 100 }, { x: 500, y: 100 }, [obstacle]);
  assertOrthogonal(points);
  assert.ok(points.length >= 4, "the route should bend around the obstacle");
  for (let i = 1; i < points.length; i++) assert.equal(intersectsRect(points[i - 1], points[i], obstacle), false);
});

test("routes around multiple obstacles without diagonal segments", () => {
  const obstacles = [{ l: 220, r: 310, t: 50, b: 180 }, { l: 360, r: 450, t: 120, b: 260 }];
  const points = routeOrthogonal({ x: 100, y: 110 }, { x: 550, y: 210 }, obstacles);
  assertOrthogonal(points);
  for (const obstacle of obstacles) for (let i = 1; i < points.length; i++) assert.equal(intersectsRect(points[i - 1], points[i], obstacle), false);
});

test("routes safely between workbench boundary coordinates", () => {
  const start = { x: 10, y: 10 };
  const end = { x: 880, y: 495 };
  const points = routeOrthogonal(start, end);
  assert.deepEqual(points[0], start);
  assert.deepEqual(points.at(-1), end);
  assertOrthogonal(points);
  assert.ok(points.every(point => point.x >= 5 && point.x <= 895 && point.y >= 5 && point.y <= 505));
});

test("routes around a thin existing-wire crossing obstacle", () => {
  const crossing = { l: 250, r: 350, t: 190, b: 210 };
  const points = routeOrthogonal({ x: 100, y: 200 }, { x: 500, y: 200 }, [crossing]);
  assertOrthogonal(points);
  assert.ok(points.length >= 4);
  for (let i = 1; i < points.length; i++) assert.equal(intersectsRect(points[i - 1], points[i], crossing), false);
});

test("routes through a dense staggered obstacle layout without collisions", () => {
  const obstacles = [
    { l: 100, r: 130, t: 40, b: 380 },
    { l: 200, r: 230, t: 130, b: 490 },
    { l: 300, r: 330, t: 20, b: 350 },
    { l: 400, r: 430, t: 160, b: 490 },
    { l: 500, r: 530, t: 40, b: 390 },
    { l: 600, r: 630, t: 130, b: 490 },
    { l: 700, r: 730, t: 20, b: 350 },
    { l: 790, r: 820, t: 160, b: 490 }
  ];
  const points = routeOrthogonal({ x: 20, y: 15 }, { x: 875, y: 495 }, obstacles);
  assert.ok(points.length >= 2, "a valid route should exist around the staggered obstacles");
  assertOrthogonal(points);
  assert.deepEqual(points[0], { x: 20, y: 15 });
  assert.deepEqual(points.at(-1), { x: 875, y: 495 });
  for (const obstacle of obstacles) for (let i = 1; i < points.length; i++) {
    assert.equal(intersectsRect(points[i - 1], points[i], obstacle), false);
  }
});

test("reports an impossible obstacle layout instead of returning a colliding fallback", () => {
  const route = routeOrthogonal(
    { x: 100, y: 100 },
    { x: 800, y: 400 },
    [{ l: 0, r: 900, t: 0, b: 505 }]
  );
  assert.deepEqual(route, []);
});
