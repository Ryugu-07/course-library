'use strict';
// Independent checks: occupation-space diagonalization, quadrature, density-matrix
// master equation, and exact configuration enumeration; no browser dependencies.
const assert = require('node:assert/strict');
const lab = require('../course-shared/labs/research-physics.js');
let checks = 0;
function near(a, b, eps = 1e-10) { assert.ok(Number.isFinite(a) && Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} != ${b}`); checks++; }
function test(condition, message) { assert.ok(condition, message); checks++; }
function jacobi(matrix) {
  const a = matrix.map(r => r.slice()), n = a.length, v = a.map((_, i) => a.map((__, j) => +(i === j)));
  for (let sweep = 0; sweep < 2000; sweep++) {
    let p = 0, q = 1, maximum = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(a[i][j]) > maximum) { maximum = Math.abs(a[i][j]); p = i; q = j; }
    if (maximum < 1e-13) break;
    const angle = Math.atan2(2 * a[p][q], a[q][q] - a[p][p]) / 2, c = Math.cos(angle), s = Math.sin(angle);
    const pp = a[p][p], qq = a[q][q], pq = a[p][q];
    a[p][p] = c * c * pp - 2 * s * c * pq + s * s * qq;
    a[q][q] = s * s * pp + 2 * s * c * pq + c * c * qq;
    a[p][q] = a[q][p] = 0;
    for (let k = 0; k < n; k++) if (k !== p && k !== q) {
      const ap = a[k][p], aq = a[k][q];
      a[k][p] = a[p][k] = c * ap - s * aq; a[k][q] = a[q][k] = s * ap + c * aq;
    }
    for (let k = 0; k < n; k++) { const vp = v[k][p], vq = v[k][q]; v[k][p] = c * vp - s * vq; v[k][q] = s * vp + c * vq; }
  }
  return a.map((r, i) => ({ e: r[i], vector: v.map(row => row[i]) })).sort((x, y) => x.e - y.e);
}
const pop = n => n.toString(2).replace(/0/g, '').length;
function fermion(state, orbital, create) {
  const bit = 1 << orbital;
  if (!!(state & bit) === create) return null;
  return [state ^ bit, pop(state & (bit - 1)) % 2 ? -1 : 1];
}
function fockDimer(u) {
  const basis = Array.from({ length: 16 }, (_, n) => n).filter(n => pop(n) === 2);
  const doubles = basis.map(n => +((n & 3) === 3) + +((n & 12) === 12));
  const h = basis.map((n, i) => basis.map((_, j) => i === j ? u * doubles[i] : 0));
  basis.forEach((state, column) => {
    for (const [to, from] of [[0, 2], [2, 0], [1, 3], [3, 1]]) {
      const one = fermion(state, from, false); if (!one) continue;
      const two = fermion(one[0], to, true); if (!two) continue;
      h[basis.indexOf(two[0])][column] -= one[1] * two[1];
    }
  });
  return { spectrum: jacobi(h), doubles };
}
for (const u of [0, 0.5, 4, 16]) {
  const result = lab.compute('hubbard', { u }).numeric, independent = fockDimer(u), ground = independent.spectrum[0];
  near(result.energy, ground.e); near(result.double, ground.vector.reduce((s, x, i) => s + x * x * independent.doubles[i], 0));
  near(independent.spectrum[1].e, 0); near(result.exchange, independent.spectrum[1].e - ground.e);
}
near(lab.compute('hubbard').numeric.double, (1 - 1 / Math.sqrt(2)) / 2);
assert.equal(lab.compute('hubbard', { u: 0 }).numeric.approximate, null); checks++;
// Independent two-component diagonalization at the allowed momentum.
for (const g of [0.25, 1, 1.75]) for (const length of [8, 32, 128]) {
  const k = Math.PI / length, a = 2 * (g - Math.cos(k)), b = 2 * Math.sin(k);
  const spectrum = jacobi([[a, b], [b, -a]]), n = lab.compute('critical', { g, length }).numeric;
  near(n.finiteScale, spectrum[1].e); near(n.kmin, k);
}
near(lab.compute('critical', { g: 1, length: 128 }).numeric.scaled, 2 * Math.PI, 3e-5);
assert.throws(() => lab.compute('critical', { length: 9 })); checks++;
function simpson(fn, a, b, n = 10000) {
  const h = (b - a) / n; let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * fn(a + i * h);
  return sum * h / 3;
}
function directProjection(p, alpha, t) {
  const amplitudes = [Math.sqrt((1 - p) / 2), Math.sqrt(p), Math.sqrt((1 - p) / 2)], e = [0, 1, alpha];
  let re = 0, im = 0;
  amplitudes.forEach((a, i) => { re += a * Math.cos(e[i] * t); im -= a * Math.sin(e[i] * t); });
  return (re * re + im * im) / 3;
}
for (const p of [0, 0.5, 1]) for (const alpha of [1.1, 2, 2.7]) {
  const n = lab.compute('eth', { p, alpha, windows: 2 }).numeric;
  near(n.end, directProjection(p, alpha, n.duration));
  near(n.average, simpson(t => directProjection(p, alpha, t), 0, n.duration) / n.duration, 1e-9);
}
const revival = lab.compute('eth').numeric;
near(revival.average, 1 / 3); near(revival.end, revival.initial); test(revival.end > 0.9, 'Finite-window averaging must not remove a recurrence');
// Complex matrix Lindblad equation, independent of Bloch closed-form equations.
const C = (r, i = 0) => [r, i], add = (a, b) => C(a[0] + b[0], a[1] + b[1]), mul = (a, b) => C(a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]);
const mm = (a, b) => a.map(row => b[0].map((_, j) => row.reduce((s, x, k) => add(s, mul(x, b[k][j])), C(0))));
const dagger = a => a[0].map((_, i) => a.map(r => C(r[i][0], -r[i][1])));
for (const omega of [0, 1, 4]) for (const delta of [-3, 0, 2]) {
  const n = lab.compute('open', { omega, delta }).numeric, rho = [[C((1 + n.z) / 2), C(n.x / 2, -n.y / 2)], [C(n.x / 2, n.y / 2), C((1 - n.z) / 2)]];
  const h = [[C(delta / 2), C(omega / 2)], [C(omega / 2), C(-delta / 2)]], l = [[C(0), C(0)], [C(1), C(0)]];
  const hr = mm(h, rho), rh = mm(rho, h), jump = mm(mm(l, rho), dagger(l)), ll = mm(dagger(l), l), left = mm(ll, rho), right = mm(rho, ll);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const comm = add(hr[i][j], mul(C(-1), rh[i][j]));
    const derivative = add(mul(C(0, -1), comm), add(jump[i][j], mul(C(-0.5), add(left[i][j], right[i][j]))));
    near(derivative[0], 0); near(derivative[1], 0);
  }
  test(n.x * n.x + n.y * n.y + n.z * n.z <= 1 + 1e-12, 'density matrix positive');
  near(n.purity, mm(rho, rho)[0][0][0] + mm(rho, rho)[1][1][0]);
}
for (const mass of [0.5, 1, 2]) for (const anisotropy of [-0.8, 0, 0.5]) {
  const n = lab.compute('correlator', { mass, anisotropy }).numeric;
  for (const [key, coefficient] of [['cx', 1 + anisotropy], ['cy', 1 - anisotropy]]) {
    const weight = x => Math.exp(-mass * mass * coefficient * x * x / 2), bound = 12 / (mass * Math.sqrt(coefficient));
    near(n[key], simpson(x => x * x * weight(x), -bound, bound) / simpson(weight, -bound, bound), 1e-9);
  }
  near(n.residual, 0);
}
for (const order of [0, 6, 24]) for (const z of [0.1, 0.25, 0.5, 0.9]) {
  const n = lab.compute('bootstrap', { delta: 0.5, order, z }).numeric;
  near(n.exact, 1 + z + z / (1 - z));
  near(n.residual, Math.pow(1 - z, order + 2) - Math.pow(z, order + 2));
  near(n.exactResidual, 0);
}
near(lab.compute('bootstrap').numeric.residual, 6560 / 65536);
for (const cosine of [-0.9, 0, 0.75]) {
  const n = lab.compute('amplitude', { cosine }).numeric;
  // Dot products of explicit massless CM four-vectors, rather than reuse t/u expressions.
  const E = 0.5, angle = Math.acos(cosine), p1 = [E, 0, 0, E], p2 = [E, 0, 0, -E], p3 = [E, E * Math.sin(angle), 0, E * Math.cos(angle)], p4 = [E, -p3[1], 0, -p3[3]];
  const square = p => p[0] ** 2 - p[1] ** 2 - p[2] ** 2 - p[3] ** 2;
  near(n.s, square(p1.map((x, i) => x + p2[i]))); near(n.t, square(p1.map((x, i) => x - p3[i]))); near(n.u, square(p1.map((x, i) => x - p4[i])));
  near(n.s + n.t + n.u, 0);
  near(lab.compute('amplitude', { cosine: -cosine }).numeric.total, n.total);
  near(lab.compute('amplitude', { cosine, contact: 1.25 }).numeric.total - n.total, 1.25);
}
// Enumerate all 2^4 plaquette configurations for the 2×2 open-square Wilson loop.
for (const beta of [0.1, 0.55, 2]) {
  let partition = 0, weighted = 0;
  for (let mask = 0; mask < 16; mask++) {
    const b = Array.from({ length: 4 }, (_, i) => mask & (1 << i) ? 1 : -1), w = Math.exp(beta * b.reduce((s, x) => s + x, 0));
    partition += w; weighted += w * b.reduce((p, x) => p * x, 1);
  }
  near(lab.compute('higher', { beta, length: 2 }).numeric.wilson, weighted / partition);
}
// Enumerate 12 edge spins: product of four plaquettes equals the outer eight-edge loop.
for (let mask = 0; mask < 4096; mask++) {
  const e = Array.from({ length: 12 }, (_, i) => mask & (1 << i) ? 1 : -1);
  const faces = [[0, 7, 2, 6], [1, 8, 3, 7], [2, 10, 4, 9], [3, 11, 5, 10]];
  const areaProduct = faces.reduce((p, f) => p * f.reduce((q, i) => q * e[i], 1), 1), boundary = [0, 1, 8, 11, 5, 4, 9, 6].reduce((p, i) => p * e[i], 1);
  test(areaProduct === boundary, 'Discrete boundary cancellation');
}
// Every endpoint/default combination returns finite chart coordinates and valid rows.
for (const topic of lab.topics) {
  const controls = lab.configs[topic].controls;
  const visit = (i, input) => {
    if (i < controls.length) { const c = controls[i]; for (const value of [c[2], c[5], c[3]]) visit(i + 1, { ...input, [c[0]]: value }); return; }
    const r = lab.compute(topic, input);
    Object.values(r.numeric).forEach(v => test(v === null || Number.isFinite(v), 'finite result'));
    test(r.chart.series.every(s => s.points.every(p => p.every(Number.isFinite))), 'finite chart');
  };
  visit(0, {});
  for (const c of controls) { assert.throws(() => lab.compute(topic, { [c[0]]: c[2] - 1 })); checks++; }
}
console.log(`research-physics: ${checks} independent numeric, domain and enumeration checks passed (${lab.topics.length} topics)`);
