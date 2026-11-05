import test from "node:test";
import assert from "node:assert/strict";
import {
  routeOrthogonal,
  getTerminalCoord as p,
  routeWire as routeWireTest
} from "../packages/core/src/wire-router.js";

// Router for entire circuit
function routeCircuit(components, wires, junctions = []) {
  const priorRoutes = [];
  for (const w of wires) {
    const points = routeWireTest(w, components, junctions, priorRoutes);
    priorRoutes.push({ w, points });
  }
  return priorRoutes;
}

// Helper: checks if segment intersects a rectangle
function intersectsRect(a, b, o) {
  if (Math.abs(a.y - b.y) < 0.01) {
    return a.y > o.t && a.y < o.b && Math.max(Math.min(a.x, b.x), o.l) < Math.min(Math.max(a.x, b.x), o.r);
  }
  if (Math.abs(a.x - b.x) < 0.01) {
    return a.x > o.l && a.x < o.r && Math.max(Math.min(a.y, b.y), o.t) < Math.min(Math.max(a.y, b.y), o.b);
  }
  return true;
}

// Helper: checks collinear overlap
function segmentsCollinearOverlap(u1, v1, u2, v2) {
  const isH1 = Math.abs(u1.y - v1.y) < 0.01, isH2 = Math.abs(u2.y - v2.y) < 0.01;
  if (isH1 && isH2 && Math.abs(u1.y - u2.y) < 0.01) {
    const min1 = Math.min(u1.x, v1.x), max1 = Math.max(u1.x, v1.x);
    const min2 = Math.min(u2.x, v2.x), max2 = Math.max(u2.x, v2.x);
    return Math.max(min1, min2) < Math.min(max1, max2) - 0.5;
  }
  const isV1 = Math.abs(u1.x - v1.x) < 0.01, isV2 = Math.abs(u2.x - v2.x) < 0.01;
  if (isV1 && isV2 && Math.abs(u1.x - u2.x) < 0.01) {
    const min1 = Math.min(u1.y, v1.y), max1 = Math.max(u1.y, v1.y);
    const min2 = Math.min(u2.y, v2.y), max2 = Math.max(u2.y, v2.y);
    return Math.max(min1, min2) < Math.min(max1, max2) - 0.5;
  }
  return false;
}

// Helper: checks if overlap is an authorized shared terminal lead stub (<=18px)
function isAuthorizedSharedStub(u1, v1, u2, v2, w1, w2, components) {
  if (w1.from !== w2.from && w1.from !== w2.to && w1.to !== w2.from && w1.to !== w2.to) return false;
  const sharedKey = [w1.from, w1.to].find(k => k === w2.from || k === w2.to);
  if (!sharedKey || sharedKey.startsWith("j:")) return false;
  const [cid, side] = sharedKey.split(":");
  const c = components.find(item => item.id === cid);
  if (!c) return false;
  const termPt = p(c, side);
  const d1 = Math.min(Math.hypot(u1.x - termPt.x, u1.y - termPt.y), Math.hypot(v1.x - termPt.x, v1.y - termPt.y));
  const d2 = Math.min(Math.hypot(u2.x - termPt.x, u2.y - termPt.y), Math.hypot(v2.x - termPt.x, v2.y - termPt.y));
  return d1 < 2 && d2 < 2;
}

// Main assertion suite
function assertRoutingQuality(routes, components, junctions = []) {
  assert.ok(routes.length > 0, "must route at least one wire");
  for (const { w, points } of routes) {
    assert.ok(points.length >= 2, `wire ${w.id} must have at least 2 points`);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      assert.ok(Math.abs(a.x - b.x) < 0.01 || Math.abs(a.y - b.y) < 0.01, `wire ${w.id} segment ${i} must be orthogonal`);
    }
    for (const pt of points) {
      assert.ok(pt.x >= 4.9 && pt.x <= 895.1 && pt.y >= 4.9 && pt.y <= 505.1, `wire ${w.id} points must be within workbench bounds`);
    }
    for (const c of components) {
      if (w.from.startsWith(c.id + ":") || w.to.startsWith(c.id + ":")) continue;
      const isRot = (c.rotation || 0) % 180 !== 0;
      const box = isRot ? { l: c.x - 22, r: c.x + 22, t: c.y - 42, b: c.y + 42 } : { l: c.x - 42, r: c.x + 42, t: c.y - 22, b: c.y + 22 };
      for (let i = 1; i < points.length; i++) {
        assert.equal(intersectsRect(points[i - 1], points[i], box), false, `wire ${w.id} must not intersect component ${c.id}`);
      }
    }
  }
  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const r1 = routes[i], r2 = routes[j];
      for (let s1 = 1; s1 < r1.points.length; s1++) {
        for (let s2 = 1; s2 < r2.points.length; s2++) {
          const u1 = r1.points[s1 - 1], v1 = r1.points[s1];
          const u2 = r2.points[s2 - 1], v2 = r2.points[s2];
          if (segmentsCollinearOverlap(u1, v1, u2, v2)) {
            const allowed = isAuthorizedSharedStub(u1, v1, u2, v2, r1.w, r2.w, components);
            assert.ok(allowed, `wires ${r1.w.id} and ${r2.w.id} have illegal collinear overlap between (${u1.x},${u1.y})-(${v1.x},${v1.y}) and (${u2.x},${u2.y})-(${v2.x},${v2.y})`);
          }
        }
      }
    }
  }
}

// -------------------------------------------------------------
// 52 LIVE TEST CASES
// -------------------------------------------------------------

// Group A: Basic Topologies & Standard Circuits (Cases 01-10)
test("Case 01: Simple closed DC loop (Battery - Lamp)", () => {
  const c = [{ id: "c1", type: "battery", x: 200, y: 250, rotation: 0 }, { id: "c2", type: "lamp", x: 600, y: 250, rotation: 0 }];
  const w = [{ id: "w1", from: "c1:b", to: "c2:a" }, { id: "w2", from: "c2:b", to: "c1:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 02: Simple 3-element series loop (Battery - Switch - Lamp)", () => {
  const c = [
    { id: "c1", type: "battery", x: 180, y: 200, rotation: 0 },
    { id: "c2", type: "switch", x: 450, y: 120, rotation: 0 },
    { id: "c3", type: "lamp", x: 450, y: 320, rotation: 0 }
  ];
  const w = [{ id: "w1", from: "c1:b", to: "c2:a" }, { id: "w2", from: "c2:b", to: "c3:a" }, { id: "w3", from: "c3:b", to: "c1:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 03: Two lamps in series on horizontal row", () => {
  const c = [
    { id: "c1", type: "battery", x: 150, y: 250, rotation: 0 },
    { id: "c2", type: "lamp", x: 420, y: 250, rotation: 0 },
    { id: "c3", type: "lamp", x: 700, y: 250, rotation: 0 }
  ];
  const w = [{ id: "w1", from: "c1:b", to: "c2:a" }, { id: "w2", from: "c2:b", to: "c3:a" }, { id: "w3", from: "c3:b", to: "c1:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 04: Three resistors in series along horizontal row", () => {
  const c = [
    { id: "c1", type: "battery", x: 120, y: 350, rotation: 0 },
    { id: "r1", type: "resistor", x: 300, y: 150, rotation: 0 },
    { id: "r2", type: "resistor", x: 500, y: 150, rotation: 0 },
    { id: "r3", type: "resistor", x: 700, y: 150, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "c1:b", to: "r1:a" },
    { id: "w2", from: "r1:b", to: "r2:a" },
    { id: "w3", from: "r2:b", to: "r3:a" },
    { id: "w4", from: "r3:b", to: "c1:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 05: Three resistors in series along vertical column", () => {
  const c = [
    { id: "c1", type: "battery", x: 200, y: 250, rotation: 90 },
    { id: "r1", type: "resistor", x: 550, y: 100, rotation: 90 },
    { id: "r2", type: "resistor", x: 550, y: 250, rotation: 90 },
    { id: "r3", type: "resistor", x: 550, y: 400, rotation: 90 }
  ];
  const w = [
    { id: "w1", from: "c1:b", to: "r1:a" },
    { id: "w2", from: "r1:b", to: "r2:a" },
    { id: "w3", from: "r2:b", to: "r3:a" },
    { id: "w4", from: "r3:b", to: "c1:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 06: Two loads in parallel across a central battery", () => {
  const c = [
    { id: "bat", type: "battery", x: 450, y: 250, rotation: 0 },
    { id: "l1", type: "lamp", x: 450, y: 120, rotation: 0 },
    { id: "l2", type: "lamp", x: 450, y: 380, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "bat:b", to: "l1:b" },
    { id: "w2", from: "bat:b", to: "l2:b" },
    { id: "w3", from: "bat:a", to: "l1:a" },
    { id: "w4", from: "bat:a", to: "l2:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 07: Three loads in parallel forming a 3-rung ladder", () => {
  const c = [
    { id: "bat", type: "battery", x: 200, y: 250, rotation: 90 },
    { id: "l1", type: "lamp", x: 400, y: 250, rotation: 90 },
    { id: "l2", type: "lamp", x: 600, y: 250, rotation: 90 },
    { id: "l3", type: "lamp", x: 800, y: 250, rotation: 90 }
  ];
  const w = [
    { id: "w1", from: "bat:b", to: "l1:b" },
    { id: "w2", from: "l1:b", to: "l2:b" },
    { id: "w3", from: "l2:b", to: "l3:b" },
    { id: "w4", from: "bat:a", to: "l1:a" },
    { id: "w5", from: "l1:a", to: "l2:a" },
    { id: "w6", from: "l2:a", to: "l3:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 08: Two parallel branches with a series switch in each branch", () => {
  const c = [
    { id: "bat", type: "battery", x: 150, y: 250, rotation: 0 },
    { id: "sw1", type: "switch", x: 400, y: 140, rotation: 0 },
    { id: "l1", type: "lamp", x: 650, y: 140, rotation: 0 },
    { id: "sw2", type: "switch", x: 400, y: 360, rotation: 0 },
    { id: "l2", type: "lamp", x: 650, y: 360, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "bat:b", to: "sw1:a" },
    { id: "w2", from: "sw1:b", to: "l1:a" },
    { id: "w3", from: "bat:b", to: "sw2:a" },
    { id: "w4", from: "sw2:b", to: "l2:a" },
    { id: "w5", from: "l1:b", to: "bat:a" },
    { id: "w6", from: "l2:b", to: "bat:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 09: Closed loop with in-line ammeter and voltmeter across load", () => {
  const c = [
    { id: "bat", type: "battery", x: 200, y: 250, rotation: 0 },
    { id: "amm", type: "ammeter", x: 420, y: 140, rotation: 0 },
    { id: "res", type: "resistor", x: 680, y: 250, rotation: 90 },
    { id: "vlt", type: "voltmeter", x: 800, y: 250, rotation: 90 }
  ];
  const w = [
    { id: "w1", from: "bat:b", to: "amm:a" },
    { id: "w2", from: "amm:b", to: "res:a" },
    { id: "w3", from: "res:b", to: "bat:a" },
    { id: "w4", from: "res:a", to: "vlt:a" },
    { id: "w5", from: "res:b", to: "vlt:b" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 10: Dual sources in series aiding (Battery 1 + Battery 2 + Lamp)", () => {
  const c = [
    { id: "b1", type: "battery", x: 200, y: 150, rotation: 0 },
    { id: "b2", type: "battery", x: 450, y: 150, rotation: 0 },
    { id: "l1", type: "lamp", x: 450, y: 350, rotation: 0 }
  ];
  const w = [{ id: "w1", from: "b1:b", to: "b2:a" }, { id: "w2", from: "b2:b", to: "l1:b" }, { id: "w3", from: "l1:a", to: "b1:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

// Group B: Multi-Wire & Shared Corridors (Collinear Avoidance) (Cases 11-20)
test("Case 11: Collinear avoidance - Two wires sharing Battery (+) terminal going right (Image 1)", () => {
  const c = [
    { id: "c1", type: "battery", x: 280, y: 210, rotation: 0 },
    { id: "c2", type: "lamp", x: 620, y: 140, rotation: 0 },
    { id: "c3", type: "lamp", x: 620, y: 310, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "c1:a", to: "c3:a" },
    { id: "w2", from: "c1:b", to: "c2:b" },
    { id: "w3", from: "c2:b", to: "c3:b" },
    { id: "w4", from: "c1:b", to: "c2:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 12: Collinear avoidance - Two wires sharing Battery (-) terminal going left", () => {
  const c = [
    { id: "c1", type: "battery", x: 600, y: 210, rotation: 0 },
    { id: "c2", type: "lamp", x: 250, y: 140, rotation: 0 },
    { id: "c3", type: "lamp", x: 250, y: 310, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "c1:a", to: "c2:a" },
    { id: "w2", from: "c1:a", to: "c3:a" },
    { id: "w3", from: "c1:b", to: "c2:b" },
    { id: "w4", from: "c2:b", to: "c3:b" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 13: Collinear avoidance - Three wires radiating from a single terminal pad", () => {
  const c = [
    { id: "hub", type: "battery", x: 200, y: 250, rotation: 0 },
    { id: "t1", type: "resistor", x: 600, y: 100, rotation: 0 },
    { id: "t2", type: "resistor", x: 600, y: 250, rotation: 0 },
    { id: "t3", type: "resistor", x: 600, y: 400, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "hub:b", to: "t1:a" },
    { id: "w2", from: "hub:b", to: "t2:a" },
    { id: "w3", from: "hub:b", to: "t3:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 14: Collinear avoidance - Two horizontal return wires in the same horizontal corridor", () => {
  const c = [
    { id: "c1", type: "lamp", x: 200, y: 150, rotation: 0 },
    { id: "c2", type: "lamp", x: 700, y: 150, rotation: 0 },
    { id: "c3", type: "lamp", x: 200, y: 350, rotation: 0 },
    { id: "c4", type: "lamp", x: 700, y: 350, rotation: 0 }
  ];
  const w = [{ id: "w1", from: "c1:b", to: "c2:a" }, { id: "w2", from: "c3:b", to: "c4:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 15: Collinear avoidance - Two vertical return wires in the same vertical corridor", () => {
  const c = [
    { id: "c1", type: "lamp", x: 250, y: 100, rotation: 90 },
    { id: "c2", type: "lamp", x: 250, y: 400, rotation: 90 },
    { id: "c3", type: "lamp", x: 550, y: 100, rotation: 90 },
    { id: "c4", type: "lamp", x: 550, y: 400, rotation: 90 }
  ];
  const w = [{ id: "w1", from: "c1:b", to: "c2:a" }, { id: "w2", from: "c3:b", to: "c4:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 16: Collinear avoidance - Adjacent parallel wires with 50px pitch", () => {
  const c = [
    { id: "s1", type: "battery", x: 150, y: 180, rotation: 0 },
    { id: "s2", type: "battery", x: 150, y: 230, rotation: 0 },
    { id: "t1", type: "lamp", x: 650, y: 180, rotation: 0 },
    { id: "t2", type: "lamp", x: 650, y: 230, rotation: 0 }
  ];
  const w = [{ id: "w1", from: "s1:b", to: "t1:a" }, { id: "w2", from: "s2:b", to: "t2:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 17: Collinear avoidance - Adjacent parallel wires with 30px pitch", () => {
  const c = [
    { id: "s1", type: "battery", x: 150, y: 200, rotation: 0 },
    { id: "s2", type: "battery", x: 150, y: 230, rotation: 0 },
    { id: "t1", type: "lamp", x: 650, y: 200, rotation: 0 },
    { id: "t2", type: "lamp", x: 650, y: 230, rotation: 0 }
  ];
  const w = [{ id: "w1", from: "s1:b", to: "t1:a" }, { id: "w2", from: "s2:b", to: "t2:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 18: Collinear avoidance - Symmetrical H-bridge network", () => {
  const c = [
    { id: "src", type: "battery", x: 450, y: 80, rotation: 0 },
    { id: "q1", type: "switch", x: 250, y: 180, rotation: 90 },
    { id: "q2", type: "switch", x: 650, y: 180, rotation: 90 },
    { id: "load", type: "lamp", x: 450, y: 260, rotation: 0 },
    { id: "q3", type: "switch", x: 250, y: 360, rotation: 90 },
    { id: "q4", type: "switch", x: 650, y: 360, rotation: 90 }
  ];
  const w = [
    { id: "w1", from: "src:b", to: "q1:a" },
    { id: "w2", from: "src:b", to: "q2:a" },
    { id: "w3", from: "q1:b", to: "load:a" },
    { id: "w4", from: "q1:b", to: "q3:a" },
    { id: "w5", from: "q2:b", to: "load:b" },
    { id: "w6", from: "q2:b", to: "q4:a" },
    { id: "w7", from: "q3:b", to: "src:a" },
    { id: "w8", from: "q4:b", to: "src:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 19: Collinear avoidance - Wheatstone bridge with central detector resistor", () => {
  const c = [
    { id: "bat", type: "battery", x: 120, y: 250, rotation: 90 },
    { id: "r1", type: "resistor", x: 350, y: 150, rotation: 0 },
    { id: "r2", type: "resistor", x: 550, y: 150, rotation: 0 },
    { id: "rg", type: "resistor", x: 450, y: 250, rotation: 90 },
    { id: "r3", type: "resistor", x: 350, y: 350, rotation: 0 },
    { id: "r4", type: "resistor", x: 550, y: 350, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "bat:b", to: "r1:a" },
    { id: "w2", from: "bat:b", to: "r3:a" },
    { id: "w3", from: "r1:b", to: "r2:a" },
    { id: "w4", from: "r1:b", to: "rg:a" },
    { id: "w5", from: "r3:b", to: "r4:a" },
    { id: "w6", from: "r3:b", to: "rg:b" },
    { id: "w7", from: "r2:b", to: "bat:a" },
    { id: "w8", from: "r4:b", to: "bat:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 20: Collinear avoidance - 5-stage ladder network with 5 parallel rungs", () => {
  const c = [
    { id: "b", type: "battery", x: 100, y: 250, rotation: 90 },
    { id: "l1", type: "resistor", x: 250, y: 250, rotation: 90 },
    { id: "l2", type: "resistor", x: 400, y: 250, rotation: 90 },
    { id: "l3", type: "resistor", x: 550, y: 250, rotation: 90 },
    { id: "l4", type: "resistor", x: 700, y: 250, rotation: 90 }
  ];
  const w = [
    { id: "w1", from: "b:b", to: "l1:b" },
    { id: "w2", from: "l1:b", to: "l2:b" },
    { id: "w3", from: "l2:b", to: "l3:b" },
    { id: "w4", from: "l3:b", to: "l4:b" },
    { id: "w5", from: "b:a", to: "l1:a" },
    { id: "w6", from: "l1:a", to: "l2:a" },
    { id: "w7", from: "l2:a", to: "l3:a" },
    { id: "w8", from: "l3:a", to: "l4:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

// Group C: Component & Terminal Clearance (Clipping Avoidance) (Cases 21-30)
test("Case 21: Terminal clearance - Lamp directly above Battery (Image 2 - passing vertical terminals)", () => {
  const c = [
    { id: "l1", type: "lamp", x: 150, y: 110, rotation: 0 },
    { id: "bat", type: "battery", x: 150, y: 330, rotation: 0 },
    { id: "l2", type: "lamp", x: 450, y: 450, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "l1:a", to: "l2:a" },
    { id: "w2", from: "bat:b", to: "l2:b" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 22: Terminal clearance - Lamp directly below Battery (passing vertical terminals)", () => {
  const c = [
    { id: "l1", type: "lamp", x: 150, y: 420, rotation: 0 },
    { id: "bat", type: "battery", x: 150, y: 220, rotation: 0 },
    { id: "l2", type: "lamp", x: 450, y: 100, rotation: 0 }
  ];
  const w = [{ id: "w1", from: "l1:a", to: "l2:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 23: Terminal clearance - Resistor directly left of Battery (passing horizontal terminals)", () => {
  const c = [
    { id: "r1", type: "resistor", x: 180, y: 250, rotation: 90 },
    { id: "bat", type: "battery", x: 380, y: 250, rotation: 90 },
    { id: "r2", type: "resistor", x: 650, y: 250, rotation: 90 }
  ];
  const w = [{ id: "w1", from: "r1:b", to: "r2:b" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 24: Terminal clearance - Resistor directly right of Battery (passing horizontal terminals)", () => {
  const c = [
    { id: "r1", type: "resistor", x: 680, y: 250, rotation: 90 },
    { id: "bat", type: "battery", x: 480, y: 250, rotation: 90 },
    { id: "r2", type: "resistor", x: 200, y: 250, rotation: 90 }
  ];
  const w = [{ id: "w1", from: "r1:a", to: "r2:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 25: Terminal clearance - Vertical component (90° rot) with wires passing both sides", () => {
  const c = [
    { id: "mid", type: "resistor", x: 450, y: 250, rotation: 90 },
    { id: "top", type: "lamp", x: 450, y: 90, rotation: 0 },
    { id: "bot", type: "lamp", x: 450, y: 410, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "top:a", to: "bot:a" },
    { id: "w2", from: "top:b", to: "bot:b" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 26: Terminal clearance - Inverted component (180° rot) in parallel circuit", () => {
  const c = [
    { id: "bat", type: "battery", x: 200, y: 250, rotation: 0 },
    { id: "inv", type: "lamp", x: 600, y: 250, rotation: 180 }
  ];
  const w = [{ id: "w1", from: "bat:b", to: "inv:a" }, { id: "w2", from: "inv:b", to: "bat:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 27: Terminal clearance - Vertical component (270° rot) with nearby bypass wire", () => {
  const c = [
    { id: "v270", type: "resistor", x: 400, y: 250, rotation: 270 },
    { id: "b1", type: "battery", x: 200, y: 250, rotation: 0 },
    { id: "l1", type: "lamp", x: 650, y: 250, rotation: 0 }
  ];
  const w = [{ id: "w1", from: "b1:b", to: "l1:a" }, { id: "w2", from: "l1:b", to: "b1:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 28: Terminal clearance - Wire looping around its own component to reach opposite side", () => {
  const c = [
    { id: "bat", type: "battery", x: 300, y: 250, rotation: 0 },
    { id: "tgt", type: "lamp", x: 150, y: 250, rotation: 0 }
  ];
  const w = [{ id: "w1", from: "bat:b", to: "tgt:b" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 29: Terminal clearance - Wire to Terminal A strictly clears Terminal B of same component", () => {
  const c = [{ id: "c1", type: "lamp", x: 400, y: 250, rotation: 0 }, { id: "c2", type: "lamp", x: 700, y: 250, rotation: 0 }];
  const w = [{ id: "w1", from: "c1:a", to: "c2:b" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 30: Terminal clearance - Wire to Terminal B strictly clears Terminal A of same component", () => {
  const c = [{ id: "c1", type: "lamp", x: 500, y: 250, rotation: 0 }, { id: "c2", type: "lamp", x: 200, y: 250, rotation: 0 }];
  const w = [{ id: "w1", from: "c1:b", to: "c2:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

// Group D: Junction & Branching Topologies (Cases 31-40)
test("Case 31: Junctions - T-junction on horizontal main supply line", () => {
  const c = [
    { id: "bat", type: "battery", x: 150, y: 200, rotation: 0 },
    { id: "l1", type: "lamp", x: 600, y: 200, rotation: 0 },
    { id: "l2", type: "lamp", x: 380, y: 350, rotation: 0 }
  ];
  const j = [{ id: "j1", x: 380, y: 200 }];
  const w = [
    { id: "w1", from: "bat:b", to: "j:j1" },
    { id: "w2", from: "j:j1", to: "l1:a" },
    { id: "w3", from: "j:j1", to: "l2:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w, j), c, j);
});

test("Case 32: Junctions - T-junction on vertical main supply line", () => {
  const c = [
    { id: "bat", type: "battery", x: 300, y: 100, rotation: 90 },
    { id: "l1", type: "lamp", x: 300, y: 420, rotation: 90 },
    { id: "l2", type: "lamp", x: 550, y: 260, rotation: 0 }
  ];
  const j = [{ id: "j1", x: 300, y: 260 }];
  const w = [
    { id: "w1", from: "bat:b", to: "j:j1" },
    { id: "w2", from: "j:j1", to: "l1:a" },
    { id: "w3", from: "j:j1", to: "l2:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w, j), c, j);
});

test("Case 33: Junctions - 4-way star junction connecting 4 radial branches", () => {
  const c = [
    { id: "top", type: "resistor", x: 450, y: 90, rotation: 90 },
    { id: "bot", type: "resistor", x: 450, y: 410, rotation: 90 },
    { id: "left", type: "resistor", x: 200, y: 250, rotation: 0 },
    { id: "right", type: "resistor", x: 700, y: 250, rotation: 0 }
  ];
  const j = [{ id: "center", x: 450, y: 250 }];
  const w = [
    { id: "w1", from: "top:b", to: "j:center" },
    { id: "w2", from: "bot:a", to: "j:center" },
    { id: "w3", from: "left:b", to: "j:center" },
    { id: "w4", from: "right:a", to: "j:center" }
  ];
  assertRoutingQuality(routeCircuit(c, w, j), c, j);
});

test("Case 34: Junctions - Chained daisy-junctions along a positive DC rail", () => {
  const c = [
    { id: "bat", type: "battery", x: 120, y: 200, rotation: 0 },
    { id: "r1", type: "resistor", x: 300, y: 350, rotation: 90 },
    { id: "r2", type: "resistor", x: 500, y: 350, rotation: 90 },
    { id: "r3", type: "resistor", x: 700, y: 350, rotation: 90 }
  ];
  const j = [{ id: "j1", x: 300, y: 200 }, { id: "j2", x: 500, y: 200 }, { id: "j3", x: 700, y: 200 }];
  const w = [
    { id: "w1", from: "bat:b", to: "j:j1" },
    { id: "w2", from: "j:j1", to: "j:j2" },
    { id: "w3", from: "j:j2", to: "j:j3" },
    { id: "w4", from: "j:j1", to: "r1:a" },
    { id: "w5", from: "j:j2", to: "r2:a" },
    { id: "w6", from: "j:j3", to: "r3:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w, j), c, j);
});

test("Case 35: Junctions - Unconnected wire passing near a junction with clearance", () => {
  const c = [
    { id: "s1", type: "battery", x: 150, y: 150, rotation: 0 },
    { id: "d1", type: "lamp", x: 650, y: 150, rotation: 0 },
    { id: "s2", type: "lamp", x: 150, y: 350, rotation: 0 },
    { id: "d2", type: "lamp", x: 650, y: 350, rotation: 0 }
  ];
  const j = [{ id: "j1", x: 400, y: 150 }];
  const w = [
    { id: "w1", from: "s1:b", to: "j:j1" },
    { id: "w2", from: "s2:b", to: "d2:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w, j), c, j);
});

test("Case 36: Junctions - Nested parallel loops sharing a common junction return rail", () => {
  const c = [
    { id: "bat", type: "battery", x: 150, y: 250, rotation: 0 },
    { id: "l1", type: "lamp", x: 400, y: 150, rotation: 0 },
    { id: "l2", type: "lamp", x: 400, y: 350, rotation: 0 }
  ];
  const j = [{ id: "ret", x: 650, y: 250 }];
  const w = [
    { id: "w1", from: "bat:b", to: "l1:a" },
    { id: "w2", from: "bat:b", to: "l2:a" },
    { id: "w3", from: "l1:b", to: "j:ret" },
    { id: "w4", from: "l2:b", to: "j:ret" },
    { id: "w5", from: "j:ret", to: "bat:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w, j), c, j);
});

test("Case 37: Junctions - Dual junction bus with 4 parallel branches", () => {
  const c = [
    { id: "bat", type: "battery", x: 120, y: 250, rotation: 90 },
    { id: "r1", type: "resistor", x: 300, y: 250, rotation: 90 },
    { id: "r2", type: "resistor", x: 500, y: 250, rotation: 90 },
    { id: "r3", type: "resistor", x: 700, y: 250, rotation: 90 }
  ];
  const j = [{ id: "top", x: 450, y: 100 }, { id: "bot", x: 450, y: 400 }];
  const w = [
    { id: "w1", from: "bat:b", to: "j:top" },
    { id: "w2", from: "r1:b", to: "j:top" },
    { id: "w3", from: "r2:b", to: "j:top" },
    { id: "w4", from: "r3:b", to: "j:top" },
    { id: "w5", from: "bat:a", to: "j:bot" },
    { id: "w6", from: "r1:a", to: "j:bot" },
    { id: "w7", from: "r2:a", to: "j:bot" },
    { id: "w8", from: "r3:a", to: "j:bot" }
  ];
  assertRoutingQuality(routeCircuit(c, w, j), c, j);
});

test("Case 38: Junctions - Junction placed in tight gap between two components", () => {
  const c = [
    { id: "c1", type: "resistor", x: 320, y: 250, rotation: 0 },
    { id: "c2", type: "resistor", x: 580, y: 250, rotation: 0 },
    { id: "src", type: "battery", x: 450, y: 100, rotation: 0 }
  ];
  const j = [{ id: "mid", x: 450, y: 250 }];
  const w = [
    { id: "w1", from: "src:b", to: "j:mid" },
    { id: "w2", from: "j:mid", to: "c1:b" },
    { id: "w3", from: "j:mid", to: "c2:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w, j), c, j);
});

test("Case 39: Junctions - Loop from junction back to battery negative terminal", () => {
  const c = [
    { id: "bat", type: "battery", x: 200, y: 250, rotation: 0 },
    { id: "load", type: "lamp", x: 550, y: 250, rotation: 0 }
  ];
  const j = [{ id: "ret", x: 720, y: 250 }];
  const w = [
    { id: "w1", from: "bat:b", to: "load:a" },
    { id: "w2", from: "load:b", to: "j:ret" },
    { id: "w3", from: "j:ret", to: "bat:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w, j), c, j);
});

test("Case 40: Junctions - Delta-Wye (Δ-Y) resistor network with 3 junctions", () => {
  const c = [
    { id: "r1", type: "resistor", x: 300, y: 150, rotation: 0 },
    { id: "r2", type: "resistor", x: 600, y: 150, rotation: 0 },
    { id: "r3", type: "resistor", x: 450, y: 350, rotation: 0 }
  ];
  const j = [{ id: "n1", x: 450, y: 150 }, { id: "n2", x: 600, y: 250 }, { id: "n3", x: 300, y: 250 }];
  const w = [
    { id: "w1", from: "r1:b", to: "j:n1" },
    { id: "w2", from: "j:n1", to: "r2:a" },
    { id: "w3", from: "r2:b", to: "j:n2" },
    { id: "w4", from: "j:n2", to: "r3:b" },
    { id: "w5", from: "r3:a", to: "j:n3" },
    { id: "w6", from: "j:n3", to: "r1:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w, j), c, j);
});

// Group E: Workbench Boundaries & Dense Stress Layouts (Cases 41-52)
test("Case 41: Boundaries - Components at extreme left margin (x = 55)", () => {
  const c = [{ id: "c1", type: "battery", x: 60, y: 150, rotation: 90 }, { id: "c2", type: "lamp", x: 60, y: 350, rotation: 90 }];
  const w = [{ id: "w1", from: "c1:b", to: "c2:a" }, { id: "w2", from: "c2:b", to: "c1:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 42: Boundaries - Components at extreme right margin (x = 840)", () => {
  const c = [{ id: "c1", type: "battery", x: 840, y: 150, rotation: 90 }, { id: "c2", type: "lamp", x: 840, y: 350, rotation: 90 }];
  const w = [{ id: "w1", from: "c1:b", to: "c2:a" }, { id: "w2", from: "c2:b", to: "c1:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 43: Boundaries - Components at extreme top margin (y = 65)", () => {
  const c = [{ id: "c1", type: "battery", x: 250, y: 65, rotation: 0 }, { id: "c2", type: "lamp", x: 650, y: 65, rotation: 0 }];
  const w = [{ id: "w1", from: "c1:b", to: "c2:a" }, { id: "w2", from: "c2:b", to: "c1:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 44: Boundaries - Components at extreme bottom margin (y = 445)", () => {
  const c = [{ id: "c1", type: "battery", x: 250, y: 445, rotation: 0 }, { id: "c2", type: "lamp", x: 650, y: 445, rotation: 0 }];
  const w = [{ id: "w1", from: "c1:b", to: "c2:a" }, { id: "w2", from: "c2:b", to: "c1:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 45: Boundaries - Full diagonal corner-to-corner route (60, 65) to (840, 445)", () => {
  const c = [{ id: "tl", type: "battery", x: 60, y: 65, rotation: 0 }, { id: "br", type: "lamp", x: 840, y: 445, rotation: 0 }];
  const w = [{ id: "w1", from: "tl:b", to: "br:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 46: Complex/Stress - 3x3 component grid with row and column interconnects", () => {
  const c = [];
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 3; col++) {
      c.push({ id: `c_${r}_${col}`, type: "resistor", x: 200 + col * 250, y: 120 + r * 130, rotation: 0 });
    }
  }
  const w = [
    { id: "w1", from: "c_0_0:b", to: "c_0_1:a" },
    { id: "w2", from: "c_0_1:b", to: "c_0_2:a" },
    { id: "w3", from: "c_1_0:b", to: "c_1_1:a" },
    { id: "w4", from: "c_1_1:b", to: "c_1_2:a" },
    { id: "w5", from: "c_2_0:b", to: "c_2_1:a" },
    { id: "w6", from: "c_2_1:b", to: "c_2_2:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 47: Complex/Stress - Staggered component labyrinth requiring serpentine detour", () => {
  const c = [
    { id: "obs1", type: "resistor", x: 300, y: 150, rotation: 90 },
    { id: "obs2", type: "resistor", x: 500, y: 350, rotation: 90 },
    { id: "obs3", type: "resistor", x: 700, y: 150, rotation: 90 },
    { id: "src", type: "battery", x: 120, y: 250, rotation: 0 },
    { id: "dst", type: "lamp", x: 820, y: 250, rotation: 0 }
  ];
  const w = [{ id: "w1", from: "src:b", to: "dst:a" }];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 48: Complex/Stress - Multi-meter lab bench (2 ammeters, 2 voltmeters, 4 resistors)", () => {
  const c = [
    { id: "bat", type: "battery", x: 100, y: 250, rotation: 90 },
    { id: "a1", type: "ammeter", x: 250, y: 120, rotation: 0 },
    { id: "r1", type: "resistor", x: 450, y: 120, rotation: 0 },
    { id: "v1", type: "voltmeter", x: 450, y: 40, rotation: 0 },
    { id: "a2", type: "ammeter", x: 250, y: 380, rotation: 0 },
    { id: "r2", type: "resistor", x: 450, y: 380, rotation: 0 },
    { id: "v2", type: "voltmeter", x: 450, y: 460, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "bat:b", to: "a1:a" },
    { id: "w2", from: "a1:b", to: "r1:a" },
    { id: "w3", from: "r1:a", to: "v1:a" },
    { id: "w4", from: "r1:b", to: "v1:b" },
    { id: "w5", from: "bat:b", to: "a2:a" },
    { id: "w6", from: "a2:b", to: "r2:a" },
    { id: "w7", from: "r2:a", to: "v2:a" },
    { id: "w8", from: "r2:b", to: "v2:b" },
    { id: "w9", from: "r1:b", to: "bat:a" },
    { id: "w10", from: "r2:b", to: "bat:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 49: Complex/Stress - AC RLC tuned filter with source, inductor, capacitor, resistor", () => {
  const c = [
    { id: "ac", type: "acSource", x: 150, y: 250, rotation: 90 },
    { id: "ind", type: "inductor", x: 350, y: 120, rotation: 0 },
    { id: "cap", type: "capacitor", x: 550, y: 250, rotation: 90 },
    { id: "res", type: "resistor", x: 750, y: 250, rotation: 90 }
  ];
  const w = [
    { id: "w1", from: "ac:b", to: "ind:a" },
    { id: "w2", from: "ind:b", to: "cap:b" },
    { id: "w3", from: "cap:b", to: "res:b" },
    { id: "w4", from: "res:a", to: "cap:a" },
    { id: "w5", from: "cap:a", to: "ac:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 50: Complex/Stress - 10-component mixed circuit with multiple rotations and branches", () => {
  const c = [
    { id: "b1", type: "battery", x: 100, y: 250, rotation: 90 },
    { id: "sw", type: "switch", x: 220, y: 120, rotation: 0 },
    { id: "r1", type: "resistor", x: 380, y: 120, rotation: 0 },
    { id: "r2", type: "resistor", x: 380, y: 220, rotation: 0 },
    { id: "r3", type: "resistor", x: 380, y: 320, rotation: 0 },
    { id: "r4", type: "resistor", x: 380, y: 420, rotation: 0 },
    { id: "c1", type: "capacitor", x: 580, y: 150, rotation: 90 },
    { id: "l1", type: "inductor", x: 580, y: 350, rotation: 90 },
    { id: "lmp", type: "lamp", x: 740, y: 250, rotation: 0 },
    { id: "v1", type: "voltmeter", x: 740, y: 120, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "b1:b", to: "sw:a" },
    { id: "w2", from: "sw:b", to: "r1:a" },
    { id: "w3", from: "sw:b", to: "r2:a" },
    { id: "w4", from: "r1:b", to: "c1:b" },
    { id: "w5", from: "r2:b", to: "l1:b" },
    { id: "w6", from: "c1:a", to: "lmp:a" },
    { id: "w7", from: "l1:a", to: "lmp:a" },
    { id: "w8", from: "lmp:b", to: "b1:a" },
    { id: "w9", from: "lmp:a", to: "v1:a" },
    { id: "w10", from: "lmp:b", to: "v1:b" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 51: Dynamic editing - Sequential wire insertion preserves all existing lanes", () => {
  const c = [
    { id: "src", type: "battery", x: 180, y: 250, rotation: 0 },
    { id: "t1", type: "lamp", x: 650, y: 150, rotation: 0 },
    { id: "t2", type: "lamp", x: 650, y: 250, rotation: 0 },
    { id: "t3", type: "lamp", x: 650, y: 350, rotation: 0 }
  ];
  const w1 = { id: "w1", from: "src:b", to: "t1:a" };
  const r1 = routeCircuit(c, [w1]);
  assert.equal(r1.length, 1);
  const w2 = { id: "w2", from: "src:b", to: "t2:a" };
  const r2 = routeCircuit(c, [w1, w2]);
  assert.equal(r2.length, 2);
  const w3 = { id: "w3", from: "src:b", to: "t3:a" };
  const r3 = routeCircuit(c, [w1, w2, w3]);
  assertRoutingQuality(r3, c);
});

test("Case 52: Channel density - 4 parallel wires routed through a single horizontal corridor", () => {
  const c = [
    { id: "s1", type: "battery", x: 120, y: 150, rotation: 0 },
    { id: "s2", type: "battery", x: 120, y: 210, rotation: 0 },
    { id: "s3", type: "battery", x: 120, y: 270, rotation: 0 },
    { id: "s4", type: "battery", x: 120, y: 330, rotation: 0 },
    { id: "d1", type: "lamp", x: 720, y: 150, rotation: 0 },
    { id: "d2", type: "lamp", x: 720, y: 210, rotation: 0 },
    { id: "d3", type: "lamp", x: 720, y: 270, rotation: 0 },
    { id: "d4", type: "lamp", x: 720, y: 330, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "s1:b", to: "d1:a" },
    { id: "w2", from: "s2:b", to: "d2:a" },
    { id: "w3", from: "s3:b", to: "d3:a" },
    { id: "w4", from: "s4:b", to: "d4:a" }
  ];
  assertRoutingQuality(routeCircuit(c, w), c);
});

test("Case 53: 3-element series circuit (Battery - Switch - Lamp) clears labels and rotate controls", () => {
  const c = [
    { id: "bat", type: "battery", x: 130, y: 226, rotation: 0 },
    { id: "sw", type: "switch", x: 290, y: 121, rotation: 0 },
    { id: "lamp", type: "lamp", x: 491, y: 121, rotation: 0 }
  ];
  const w = [
    { id: "w1", from: "bat:b", to: "sw:a" },
    { id: "w2", from: "sw:b", to: "lamp:a" },
    { id: "w3", from: "lamp:b", to: "bat:a" }
  ];
  const routes = routeCircuit(c, w);
  assertRoutingQuality(routes, c);

  const r3 = routes.find(r => r.w.id === "w3");
  assert.ok(r3, "w3 must be routed");
  for (let i = 1; i < r3.points.length; i++) {
    const p1 = r3.points[i - 1], p2 = r3.points[i];
    assert.equal(intersectsRect(p1, p2, { l: 290 - 32, r: 290 + 32, t: 121 + 18, b: 121 + 64 }), false, "w3 must not intersect switch label");
    assert.equal(intersectsRect(p1, p2, { l: 491 - 32, r: 491 + 32, t: 121 + 18, b: 121 + 64 }), false, "w3 must not intersect lamp label");
    assert.equal(intersectsRect(p1, p2, { l: 130 - 20, r: 130 + 20, t: 226 - 42, b: 226 - 22 }), false, "w3 must not intersect battery rotate button");
  }
});
