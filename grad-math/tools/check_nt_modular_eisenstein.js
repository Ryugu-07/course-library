"use strict";

const assert = require("node:assert/strict");
const lab = require("../../course-shared/labs/research-math.js");

let checks = 0;
function ok(condition, message) {
  assert.ok(condition, message);
  checks += 1;
}
function near(actual, expected, relativeTolerance, message) {
  const scale = Math.max(Math.abs(expected), 1e-300);
  ok(Math.abs(actual - expected) <= relativeTolerance * scale, message + `: ${actual} != ${expected}`);
}
function small(actual, absoluteTolerance, message) {
  ok(Math.abs(actual) <= absoluteTolerance, message + `: |${actual}| > ${absoluteTolerance}`);
}

// Independent low-order q expansion: Delta=q-24q^2+252q^3-1472q^4+4830q^5+...
function deltaQExpansion(y) {
  const q = Math.exp(-2 * Math.PI * y);
  return q - 24 * q ** 2 + 252 * q ** 3 - 1472 * q ** 4 + 4830 * q ** 5;
}

for (const y of [0.35, 0.4, 0.7, 1, 1.4, 2, 2.5]) {
  const result = lab.compute("nt-modular", { y, N: 60 }).numeric;
  near(result.eisensteinDelta, result.delta, 3e-9, `Eisenstein/product agreement at y=${y}`);
  if (y >= 1) near(result.delta, deltaQExpansion(y), 2e-9, `q-series/product agreement at y=${y}`);
  small(result.relativeError, 3e-9, `S-transform agreement at y=${y}`);
}

const coarse = lab.compute("nt-modular", { y: 0.4, N: 3 }).numeric;
ok(Math.abs(coarse.relativeError) > 1e-3, "coarse product truncation must leave a visible S-transform residual");
ok(Math.abs(coarse.eisensteinRelativeError) > 1e-4, "independent coarse truncations must not be aliases");
ok(Object.hasOwn(coarse, "e4") && Object.hasOwn(coarse, "e6"), "E4 and E6 must be exposed for audit");

console.log(`nt-modular Eisenstein acceptance: PASS (${checks} checks)`);
