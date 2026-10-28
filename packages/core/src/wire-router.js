export function routeOrthogonal(start, end, obstacles = []) {
  const blocked = (u, v) => obstacles.some(o => {
    if (Math.abs(u.y - v.y) < 0.01) return u.y > o.t && u.y < o.b && Math.max(Math.min(u.x, v.x), o.l) < Math.min(Math.max(u.x, v.x), o.r);
    if (Math.abs(u.x - v.x) < 0.01) return u.x > o.l && u.x < o.r && Math.max(Math.min(u.y, v.y), o.t) < Math.min(Math.max(u.y, v.y), o.b);
    return true;
  });
  const clean = points => {
    const out = [];
    for (const point of points) {
      if (out.length && Math.abs(out[out.length - 1].x - point.x) < 0.01 && Math.abs(out[out.length - 1].y - point.y) < 0.01) continue;
      out.push(point);
    }
    for (let i = out.length - 2; i > 0; i--) {
      const a = out[i - 1], b = out[i], c = out[i + 1];
      if ((Math.abs(a.x - b.x) < 0.01 && Math.abs(b.x - c.x) < 0.01) || (Math.abs(a.y - b.y) < 0.01 && Math.abs(b.y - c.y) < 0.01)) out.splice(i, 1);
    }
    return out;
  };
  const xs = [35, 55, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 845, 865, ...obstacles.flatMap(o => [o.l - 10, o.r + 10]), start.x, end.x].filter(x => x >= 5 && x <= 895);
  const ys = [20, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 475, 490, ...obstacles.flatMap(o => [o.t - 10, o.b + 10]), start.y, end.y].filter(y => y >= 5 && y <= 505);
  const unique = values => [...new Set(values.map(value => Math.round(value * 10) / 10))].sort((a, b) => a - b);
  const X = unique(xs), Y = unique(ys), candidates = [];
  for (const x of X) candidates.push([start, { x, y: start.y }, { x, y: end.y }, end]);
  for (const y of Y) candidates.push([start, { x: start.x, y }, { x: end.x, y }, end]);
  for (const x of X) for (const y of Y) {
    candidates.push([start, { x, y: start.y }, { x, y }, { x: end.x, y }, end]);
    candidates.push([start, { x: start.x, y }, { x, y }, { x, y: end.y }, end]);
  }
  let best = null, bestCost = Infinity;
  for (const candidate of candidates) {
    const points = clean(candidate);
    let cost = 0, valid = true;
    for (let i = 1; i < points.length; i++) {
      if (blocked(points[i - 1], points[i])) { valid = false; break; }
      cost += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
      if (i > 1) {
        const a = points[i - 2], b = points[i - 1], c = points[i];
        if ((a.x === b.x) !== (b.x === c.x)) cost += 18;
      }
    }
    if (valid && cost < bestCost) { best = points; bestCost = cost; }
  }
  if (!best) {
    const fallback = [[start, { x: 5, y: start.y }, { x: 5, y: end.y }, end], [start, { x: start.x, y: 5 }, { x: end.x, y: 5 }, end], [start, { x: start.x, y: 505 }, { x: end.x, y: 505 }, end]];
    for (const candidate of fallback) {
      const points = clean(candidate);
      if (points.every((point, i) => i === 0 || !blocked(points[i - 1], point))) { best = points; break; }
    }
  }
  return best || [];
}
