function isSegmentBlocked(u, v, obstacles) {
  const isH = Math.abs(u.y - v.y) < 0.01, isV = Math.abs(u.x - v.x) < 0.01;
  if (!isH && !isV) return true;
  return obstacles.some(o => {
    if (o.type === "wire_h") {
      if (isH && Math.abs(u.y - o.exactY) < 0.01 && Math.max(Math.min(u.x, v.x), o.origL) < Math.min(Math.max(u.x, v.x), o.origR) - 0.5) return true;
      return isH && u.y > o.t && u.y < o.b && Math.max(Math.min(u.x, v.x), o.l) < Math.min(Math.max(u.x, v.x), o.r);
    }
    if (o.type === "wire_v") {
      if (isV && Math.abs(u.x - o.exactX) < 0.01 && Math.max(Math.min(u.y, v.y), o.origT) < Math.min(Math.max(u.y, v.y), o.origB) - 0.5) return true;
      return isV && u.x > o.l && u.x < o.r && Math.max(Math.min(u.y, v.y), o.t) < Math.min(Math.max(u.y, v.y), o.b);
    }
    if (isH) return u.y > o.t && u.y < o.b && Math.max(Math.min(u.x, v.x), o.l) < Math.min(Math.max(u.x, v.x), o.r);
    return u.x > o.l && u.x < o.r && Math.max(Math.min(u.y, v.y), o.t) < Math.min(Math.max(u.y, v.y), o.b);
  });
}

function cleanPoints(points) {
  const out = [];
  for (const p of points) {
    if (out.length && Math.abs(out[out.length - 1].x - p.x) < 0.01 && Math.abs(out[out.length - 1].y - p.y) < 0.01) continue;
    out.push(p);
  }
  for (let i = out.length - 2; i > 0; i--) {
    const a = out[i - 1], b = out[i], c = out[i + 1];
    if ((Math.abs(a.x - b.x) < 0.01 && Math.abs(b.x - c.x) < 0.01) || (Math.abs(a.y - b.y) < 0.01 && Math.abs(b.y - c.y) < 0.01)) {
      out.splice(i, 1);
    }
  }
  return out;
}

function generateCandidates(start, end, obstacles) {
  const xs = [35, 55, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 845, 865, ...obstacles.flatMap(o => [o.l - 10, o.r + 10]), start.x, end.x].filter(x => x >= 5 && x <= 895);
  const ys = [20, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 475, 490, ...obstacles.flatMap(o => [o.t - 10, o.b + 10]), start.y, end.y].filter(y => y >= 5 && y <= 505);
  const unique = vals => [...new Set(vals.map(v => Math.round(v * 10) / 10))].sort((a, b) => a - b);
  const X = unique(xs), Y = unique(ys), candidates = [];
  for (const x of X) candidates.push([start, { x, y: start.y }, { x, y: end.y }, end]);
  for (const y of Y) candidates.push([start, { x: start.x, y }, { x: end.x, y }, end]);
  for (const x of X) {
    for (const y of Y) {
      candidates.push([start, { x, y: start.y }, { x, y }, { x: end.x, y }, end]);
      candidates.push([start, { x: start.x, y }, { x, y }, { x, y: end.y }, end]);
    }
  }
  return candidates;
}

function evaluateCandidate(points, obstacles) {
  let cost = 0;
  for (let i = 1; i < points.length; i++) {
    if (isSegmentBlocked(points[i - 1], points[i], obstacles)) return null;
    cost += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
    if (i > 1) {
      const a = points[i - 2], b = points[i - 1], c = points[i];
      if ((a.x === b.x) !== (b.x === c.x)) cost += 18;
    }
  }
  return cost;
}

function findFallbackRoute(start, end, obstacles) {
  const fallback = [
    [start, { x: 5, y: start.y }, { x: 5, y: end.y }, end],
    [start, { x: 895, y: start.y }, { x: 895, y: end.y }, end],
    [start, { x: start.x, y: 5 }, { x: end.x, y: 5 }, end],
    [start, { x: start.x, y: 505 }, { x: end.x, y: 505 }, end]
  ];
  for (const candidate of fallback) {
    const points = cleanPoints(candidate);
    if (points.every((pt, i) => i === 0 || !isSegmentBlocked(points[i - 1], pt, obstacles))) return points;
  }
  return [];
}

export function routeOrthogonal(start, end, obstacles = []) {
  const candidates = generateCandidates(start, end, obstacles);
  let best = null, bestCost = Infinity;
  for (const candidate of candidates) {
    const points = cleanPoints(candidate);
    const cost = evaluateCandidate(points, obstacles);
    if (cost !== null && cost < bestCost) {
      best = points;
      bestCost = cost;
    }
  }
  return best || findFallbackRoute(start, end, obstacles);
}

export function rotatePoint(x, y, angle) {
  const r = ((angle || 0) % 360 + 360) % 360;
  return r === 90 ? { x: -y, y: x } : r === 180 ? { x: -x, y: -y } : r === 270 ? { x: y, y: -x } : { x, y };
}

export function getTerminalCoord(c, s) {
  const q = rotatePoint(s === "a" ? -36 : 36, 0, c.rotation || 0);
  return { x: c.x + q.x, y: c.y + q.y };
}

export function terminalVector(c, s, length = 1) {
  if (!c) return { x: 0, y: 0 };
  return rotatePoint(s === "a" ? -length : length, 0, c.rotation || 0);
}

function resolveTerminalPoint(key, components, junctions = []) {
  if (key.startsWith("j:")) {
    const j = junctions.find(item => item.id === key.slice(2));
    return j ? { x: j.x, y: j.y } : null;
  }
  const [cid, side] = key.split(":");
  const c = components.find(item => item.id === cid);
  return c ? getTerminalCoord(c, side) : null;
}

function clampObstacle(obs, c, components) {
  let { l, r, t, b, type } = obs;
  for (const other of components) {
    if (other.id === c.id) continue;
    const pts = [getTerminalCoord(other, "a"), getTerminalCoord(other, "b")];
    pts.push({ x: pts[0].x + terminalVector(other, "a", 18).x, y: pts[0].y + terminalVector(other, "a", 18).y });
    pts.push({ x: pts[1].x + terminalVector(other, "b", 18).x, y: pts[1].y + terminalVector(other, "b", 18).y });
    for (const p of pts) {
      if (p.x >= l - 4 && p.x <= r + 4) {
        if (p.y > c.y && p.y <= b) b = Math.min(b, p.y - 6);
        else if (p.y < c.y && p.y >= t) t = Math.max(t, p.y + 6);
      }
    }
  }
  return t < b ? { l, r, t, b, type } : null;
}

function buildSingleComponentObstacles(c, wire, components = []) {
  const isConnA = wire.from === c.id + ":a" || wire.to === c.id + ":a";
  const isConnB = wire.from === c.id + ":b" || wire.to === c.id + ":b";
  const isRot = (c.rotation || 0) % 180 !== 0;
  const list = [];
  if (!isConnA && !isConnB) {
    list.push(isRot
      ? { l: c.x - 28, r: c.x + 28, t: c.y - 56, b: c.y + 56, type: "comp" }
      : { l: c.x - 56, r: c.x + 56, t: c.y - 28, b: c.y + 28, type: "comp" });
  } else {
    list.push({ l: c.x - 22, r: c.x + 22, t: c.y - 22, b: c.y + 22, type: "comp" });
    if (!isConnA) {
      const ta = getTerminalCoord(c, "a");
      list.push({ l: ta.x - 14, r: ta.x + 14, t: ta.y - 14, b: ta.y + 14, type: "comp" });
    }
    if (!isConnB) {
      const tb = getTerminalCoord(c, "b");
      list.push({ l: tb.x - 14, r: tb.x + 14, t: tb.y - 14, b: tb.y + 14, type: "comp" });
    }
  }
  if (!isRot) {
    const o1 = clampObstacle({ l: c.x - 32, r: c.x + 32, t: c.y + 18, b: c.y + 64, type: "comp" }, c, components);
    const o2 = clampObstacle({ l: c.x - 24, r: c.x + 24, t: c.y - 36, b: c.y - 18, type: "comp" }, c, components);
    if (o1) list.push(o1);
    if (o2) list.push(o2);
  }
  return list;
}

export function getComponentObstacles(wire, components = [], junctions = [], options = {}) {
  const { excludeComponentId = null } = options;
  const list = [];
  for (const c of components) {
    if (c.id === excludeComponentId) continue;
    list.push(...buildSingleComponentObstacles(c, wire, components));
  }
  for (const j of junctions) {
    if (wire.from !== "j:" + j.id && wire.to !== "j:" + j.id) {
      list.push({ l: j.x - 12, r: j.x + 12, t: j.y - 12, b: j.y + 12, type: "comp" });
    }
  }
  return list;
}

export function trimSegmentObstacle(u, v, endpoints, thickness = 4) {
  let minX = Math.min(u.x, v.x), maxX = Math.max(u.x, v.x);
  let minY = Math.min(u.y, v.y), maxY = Math.max(u.y, v.y);
  const origL = minX, origR = maxX, origT = minY, origB = maxY;
  for (const pt of endpoints) {
    if (Math.hypot(u.x - pt.x, u.y - pt.y) < 6) {
      if (Math.abs(u.y - v.y) < 0.01) { if (v.x > u.x) minX += 10; else maxX -= 10; }
      else { if (v.y > u.y) minY += 10; else maxY -= 10; }
    }
    if (Math.hypot(v.x - pt.x, v.y - pt.y) < 6) {
      if (Math.abs(u.y - v.y) < 0.01) { if (u.x > v.x) minX += 10; else maxX -= 10; }
      else { if (u.y > v.y) minY += 10; else maxY -= 10; }
    }
  }
  if (Math.abs(u.y - v.y) < 0.01) {
    return { l: minX, r: maxX, t: u.y - thickness, b: u.y + thickness, type: "wire_h", exactY: u.y, origL, origR };
  }
  if (Math.abs(u.x - v.x) < 0.01) {
    return { l: u.x - thickness, r: u.x + thickness, t: minY, b: maxY, type: "wire_v", exactX: u.x, origT, origB };
  }
  return null;
}

export function getPriorWireObstacles(priorRoutes = [], endpoints = [], thickness = 4) {
  const obstacles = [];
  for (const prior of priorRoutes) {
    for (let i = 1; i < prior.points.length; i++) {
      const obs = trimSegmentObstacle(prior.points[i - 1], prior.points[i], endpoints, thickness);
      if (obs) obstacles.push(obs);
    }
  }
  return obstacles;
}

export function routeWire(w, components = [], junctions = [], priorRoutes = [], options = {}) {
  const a = resolveTerminalPoint(w.from, components, junctions);
  const b = resolveTerminalPoint(w.to, components, junctions);
  if (!a || !b) return [];
  const ca = components.find(c => c.id === w.from.split(":")[0]);
  const cb = components.find(c => c.id === w.to.split(":")[0]);
  const va = terminalVector(ca, w.from.endsWith(":a") ? "a" : "b", 18);
  const vb = terminalVector(cb, w.to.endsWith(":a") ? "a" : "b", 18);
  const start = { x: a.x + va.x, y: a.y + va.y }, end = { x: b.x + vb.x, y: b.y + vb.y };
  const compObstacles = getComponentObstacles(w, components, junctions, options);
  const wireObstacles = getPriorWireObstacles(priorRoutes, [start, end, a, b], 4);
  let routed = routeOrthogonal(start, end, [...compObstacles, ...wireObstacles]);
  if (!routed.length) {
    const thinWireObstacles = getPriorWireObstacles(priorRoutes, [start, end, a, b], 1);
    routed = routeOrthogonal(start, end, [...compObstacles, ...thinWireObstacles]);
  }
  if (!routed.length) routed = routeOrthogonal(start, end, compObstacles);
  const full = routed.length ? [a, ...routed, b] : [];
  return full.filter((p, i) => i === 0 || Math.hypot(p.x - full[i - 1].x, p.y - full[i - 1].y) > 0.1);
}
