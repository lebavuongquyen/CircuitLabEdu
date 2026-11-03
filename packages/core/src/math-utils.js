export function createUnionFind(keys) {
  const parent = new Map(keys.map(k => [k, k]));
  const find = key => {
    let root = key;
    while (parent.get(root) !== root) root = parent.get(root);
    let current = key;
    while (parent.get(current) !== current) {
      const next = parent.get(current);
      parent.set(current, root);
      current = next;
    }
    return root;
  };
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
    return ra !== rb;
  };
  return { find, union, parent };
}

function findPivotRow(a, i, n) {
  let max = i;
  for (let r = i + 1; r < n; r++) {
    if (Math.abs(a[r][i]) > Math.abs(a[max][i])) max = r;
  }
  let rowScale = 0;
  for (let c = i; c < n; c++) rowScale = Math.max(rowScale, Math.abs(a[max][c]));
  const tolerance = Math.max(1e-12, rowScale * Number.EPSILON * Math.max(1, n) * 16);
  if (!Number.isFinite(a[max][i]) || Math.abs(a[max][i]) <= tolerance) return -1;
  return max;
}

function eliminateRows(a, i, n) {
  const pivot = a[i][i];
  for (let c = i; c <= n; c++) a[i][c] /= pivot;
  for (let r = 0; r < n; r++) {
    if (r === i) continue;
    const factor = a[r][i];
    if (Math.abs(factor) <= 1e-15) continue;
    for (let c = i; c <= n; c++) a[r][c] -= factor * a[i][c];
  }
}

export function gaussian(a) {
  const n = a.length;
  for (let i = 0; i < n; i++) {
    const max = findPivotRow(a, i, n);
    if (max === -1) return null;
    if (max !== i) [a[i], a[max]] = [a[max], a[i]];
    eliminateRows(a, i, n);
  }
  return a.map(row => row[n]);
}
