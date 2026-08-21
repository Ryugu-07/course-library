(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("perron-frobenius", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
    try {
      var report = exported.selfTest();
      process.stdout.write("perron-frobenius self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)\n");
    } catch (error) {
      process.stderr.write("perron-frobenius self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-perron-frobenius-styles";
  var EPS = 1e-10;
  var MACHINE_EPS = 64 * (Number.EPSILON || 2.220446049250313e-16);
  var RELATIVE_TOLERANCE = 1e-8;
  var INSTANCE = 0;

  var PRESETS = [
    {
      id: "positive",
      label: "正矩阵：严格混合",
      matrix: [[2, 1], [1, 2]],
      initial: [1, 0.25],
      description: "A>0；外围谱只有 Perron 根。"
    },
    {
      id: "primitive",
      label: "本原但非正：谱隙仍在",
      matrix: [[0, 2, 1], [1, 0, 1], [1, 1, 0]],
      initial: [1, 0.3, 0.2],
      description: "不可约、周期 1，但有零元素。"
    },
    {
      id: "periodic",
      label: "周期不可约：幂法振荡",
      matrix: [[0, 2], [1, 0]],
      initial: [1, 0.25],
      description: "不可约、周期 2；外围谱成对出现。"
    },
    {
      id: "reducible",
      label: "可约：先拆 SCC",
      matrix: [[2, 1, 0], [0, 1, 0], [0, 0, 0.5]],
      initial: [1, 0.6, 0.3],
      description: "三个类、两个次临界块；全局向量不能盲写。"
    }
  ];

  var STYLE_TEXT = [
    ".pf-lab{--pf-blue:var(--cl-blue,#315f9d);--pf-gold:var(--cl-gold,#9b6a12);--pf-green:var(--cl-green,#39734d);--pf-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".pf-lab *,.pf-lab *::before,.pf-lab *::after{box-sizing:border-box}.pf-lab [hidden]{display:none!important}.pf-lab h3,.pf-lab h4{margin:0;color:var(--fg);letter-spacing:0}.pf-lab h3{font-size:1.18rem}.pf-lab h4{font-size:1rem}.pf-lab p{margin:.65rem 0}.pf-note,.pf-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.pf-lab button,.pf-lab select,.pf-lab input{font:inherit}.pf-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.pf-lab button:hover{border-color:var(--pf-blue)}.pf-lab button[aria-pressed=true],.pf-lab button.pf-primary{border-color:var(--pf-blue);background:var(--pf-blue);color:#fff;font-weight:750}.pf-lab button:focus-visible,.pf-lab select:focus-visible,.pf-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pf-lab select{width:100%;min-height:44px;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.pf-control label{display:block;color:var(--fg-soft);font-size:13px;margin-bottom:4px}.pf-control output{color:var(--fg);font-weight:700}.pf-controls{display:grid;grid-template-columns:minmax(220px,1fr) minmax(180px,.7fr) auto;gap:10px;align-items:end;margin:12px 0}.pf-control input{display:block;width:100%;accent-color:var(--pf-blue)}.pf-control input[type=range]{min-height:44px}.pf-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pf-gold);background:var(--bg)}.pf-gate fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.pf-gate fieldset:last-child{margin-bottom:0}.pf-gate legend{margin-bottom:7px;font-weight:700;line-height:1.5}.pf-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pf-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.pf-actions>*{flex:1 1 180px}.pf-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pf-warn{color:var(--pf-red)}.pf-pass{color:var(--pf-green)}.pf-result{margin-top:14px}.pf-layout{display:grid;grid-template-columns:minmax(250px,.95fr) minmax(0,1.45fr);gap:14px;align-items:start}.pf-frame{border:1px solid var(--border);background:var(--bg);padding:6px;min-width:0}.pf-svg{display:block;width:100%;height:auto}.pf-svg text{font-family:inherit;fill:var(--fg-soft,#6f6a60);font-size:11px}.pf-svg .pf-axis{stroke:var(--border);stroke-width:1}.pf-svg .pf-edge{stroke:var(--pf-blue);stroke-width:1.7;opacity:.8}.pf-svg .pf-node{fill:var(--bg);stroke:var(--pf-gold);stroke-width:2}.pf-svg .pf-node-label{fill:var(--fg);font-weight:700;text-anchor:middle;dominant-baseline:middle}.pf-svg .pf-spectral-circle{fill:none;stroke:var(--border);stroke-dasharray:4 4}.pf-svg .pf-peripheral{fill:var(--pf-red);stroke:var(--bg);stroke-width:1}.pf-svg .pf-bar{fill:var(--pf-green)}.pf-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}.pf-metric{min-width:0;border-top:2px solid var(--pf-blue);padding:7px 8px;background:var(--bg)}.pf-metric span{display:block;color:var(--fg-soft);font-size:12px}.pf-metric strong{display:block;font-size:1.05rem;overflow-wrap:anywhere}.pf-table-wrap{overflow-x:auto;max-width:100%;margin-top:12px}.pf-table{border-collapse:collapse;width:100%;min-width:760px;font-size:12px}.pf-table caption{text-align:left;color:var(--fg-soft);padding:5px 0}.pf-table th,.pf-table td{border:1px solid var(--border);padding:6px 7px;text-align:left;vertical-align:top}.pf-table th{background:var(--block-bg);color:var(--fg)}.pf-certificate{border-left:3px solid var(--pf-green);padding-left:10px;font-size:13px}.pf-certificate.pf-blocked{border-color:var(--pf-red)}",
    "@media(max-width:760px){.pf-layout{grid-template-columns:minmax(0,1fr)}.pf-controls{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.pf-controls button{grid-column:1/-1}}@media(max-width:500px){.pf-controls{grid-template-columns:minmax(0,1fr)}.pf-choice-grid,.pf-actions{display:grid;grid-template-columns:minmax(0,1fr)}.pf-actions>*{width:100%}.pf-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pf-frame{padding:3px}}@media(prefers-reduced-motion:reduce){.pf-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
  ].join("");

  function assert(condition, message) {
    if (!condition) throw new Error("perron-frobenius self-test: " + message);
  }

  function near(left, right, tolerance) { var scale = Math.max(Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= relativeTolerance(scale, tolerance === undefined ? 1e-6 : tolerance); }
  function cloneMatrix(matrix) { return matrix.map(function (row) { return row.slice(); }); }
  function cloneVector(vector) { return vector.slice(); }
  function clonePreset(preset) { return { id: preset.id, label: preset.label, matrix: cloneMatrix(preset.matrix), initial: cloneVector(preset.initial), description: preset.description }; }

  function relativeTolerance(scale, factor) { var magnitude = Math.abs(Number(scale)) || 0; return magnitude * ((factor === undefined ? RELATIVE_TOLERANCE : factor) + MACHINE_EPS); }
  function relativeNear(left, right, factor) { return Math.abs(left - right) <= relativeTolerance(Math.max(Math.abs(left), Math.abs(right)), factor); }
  function matrixScale(matrix) { var scale = 0; matrix.forEach(function (row) { row.forEach(function (value) { scale = Math.max(scale, Math.abs(value)); }); }); return scale; }
  function transpose(matrix) { return matrix[0].map(function (_, column) { return matrix.map(function (row) { return row[column]; }); }); }
  function shiftedMatrix(matrix, shift) { return matrix.map(function (row, i) { return row.map(function (value, j) { return value - (i === j ? shift : 0); }); }); }

  function nullspace(matrix) {
    var rows = matrix.length, columns = rows ? matrix[0].length : 0, working = cloneMatrix(matrix), tolerance = relativeTolerance(matrixScale(matrix), RELATIVE_TOLERANCE), pivotColumns = [], pivotRow = 0;
    for (var column = 0; column < columns && pivotRow < rows; column += 1) {
      var pivot = pivotRow;
      for (var candidate = pivotRow + 1; candidate < rows; candidate += 1) if (Math.abs(working[candidate][column]) > Math.abs(working[pivot][column])) pivot = candidate;
      if (Math.abs(working[pivot][column]) <= tolerance) continue;
      if (pivot !== pivotRow) { var swapped = working[pivotRow]; working[pivotRow] = working[pivot]; working[pivot] = swapped; }
      var pivotValue = working[pivotRow][column];
      for (var normalizeColumn = column; normalizeColumn < columns; normalizeColumn += 1) working[pivotRow][normalizeColumn] /= pivotValue;
      for (var row = 0; row < rows; row += 1) {
        if (row === pivotRow) continue;
        var factor = working[row][column];
        if (factor === 0) continue;
        for (var eliminateColumn = column; eliminateColumn < columns; eliminateColumn += 1) working[row][eliminateColumn] -= factor * working[pivotRow][eliminateColumn];
      }
      pivotColumns.push(column); pivotRow += 1;
    }
    var pivotLookup = {};
    pivotColumns.forEach(function (column, index) { pivotLookup[column] = index; });
    var freeColumns = [];
    for (var free = 0; free < columns; free += 1) if (pivotLookup[free] === undefined) freeColumns.push(free);
    var basis = freeColumns.map(function (freeColumn) {
      var vector = Array.apply(null, Array(columns)).map(function () { return 0; });
      vector[freeColumn] = 1;
      pivotColumns.forEach(function (pivotColumn, index) { vector[pivotColumn] = -working[index][freeColumn]; });
      return normalize(vector);
    });
    return { dimension: basis.length, basis: basis, pivotColumns: pivotColumns, tolerance: tolerance };
  }

  function supportOfBasis(basis) {
    var support = [], tolerance = relativeTolerance(1, RELATIVE_TOLERANCE);
    if (!basis.length) return support;
    for (var index = 0; index < basis[0].length; index += 1) {
      if (basis.some(function (vector) { return Math.abs(vector[index]) > tolerance; })) support.push(index);
    }
    return support;
  }

  function perronEigenspace(matrix, rho) {
    var space = nullspace(shiftedMatrix(matrix, rho)), basis = space.basis.map(function (vector) { return normalize(vector); });
    return { dimension: basis.length, basis: basis, support: supportOfBasis(basis), tolerance: space.tolerance };
  }

  function projectionStatus(initial, leftBasis) {
    if (!leftBasis || !leftBasis.length) return { known: false, zero: null, values: [] };
    var scale = Math.max(l1(initial), Number.MIN_VALUE), tolerance = relativeTolerance(scale, RELATIVE_TOLERANCE), values = leftBasis.map(function (left) { return left.reduce(function (sum, value, index) { return sum + value * initial[index]; }, 0); });
    return { known: true, zero: values.every(function (value) { return Math.abs(value) <= tolerance; }), values: values };
  }

  function validateMatrix(matrix) {
    var errors = [];
    if (!Array.isArray(matrix) || matrix.length === 0) return { valid: false, errors: ["matrix must be a nonempty square array"] };
    var n = matrix.length;
    matrix.forEach(function (row, i) {
      if (!Array.isArray(row) || row.length !== n) { errors.push("row " + i + " is not square"); return; }
      row.forEach(function (value, j) {
        if (typeof value !== "number" || !isFinite(value)) errors.push("entry " + i + "," + j + " is not finite");
        else if (value < 0) errors.push("entry " + i + "," + j + " is negative");
      });
    });
    return { valid: errors.length === 0, errors: errors, n: n };
  }

  function submatrix(matrix, vertices) { return vertices.map(function (from) { return vertices.map(function (to) { return matrix[from][to]; }); }); }
  function matrixVector(matrix, vector) { return matrix.map(function (row) { return row.reduce(function (sum, value, index) { return sum + value * vector[index]; }, 0); }); }
  function l1(vector) { return vector.reduce(function (sum, value) { return sum + Math.abs(value); }, 0); }
  function normalize(vector) { var norm = l1(vector); return norm === 0 ? vector.map(function () { return 0; }) : vector.map(function (value) { return value / norm; }); }
  function distance(left, right) { return left.reduce(function (sum, value, index) { return sum + Math.abs(value - right[index]); }, 0); }
  function positiveVector(n) { return Array.apply(null, Array(n)).map(function () { return 1; }); }

  function stronglyConnectedComponents(matrix) {
    var n = matrix.length, seen = [], order = [], result = [];
    function visit(vertex, reverse, sink) {
      seen[vertex] = true;
      for (var next = 0; next < n; next += 1) {
        var edge = reverse ? matrix[next][vertex] : matrix[vertex][next];
        if (edge > 0 && !seen[next]) visit(next, reverse, sink);
      }
      sink.push(vertex);
    }
    for (var i = 0; i < n; i += 1) if (!seen[i]) visit(i, false, order);
    seen = [];
    for (var index = order.length - 1; index >= 0; index -= 1) {
      if (seen[order[index]]) continue;
      var component = [];
      visit(order[index], true, component);
      component.sort(function (a, b) { return a - b; });
      result.push(component);
    }
    result.sort(function (a, b) { return a[0] - b[0]; });
    return result;
  }

  function gcd(left, right) {
    left = Math.abs(Math.round(left)); right = Math.abs(Math.round(right));
    while (right) { var remainder = left % right; left = right; right = remainder; }
    return left;
  }

  function periodOf(matrix, vertices) {
    if (vertices.length === 1) return matrix[vertices[0]][vertices[0]] > 0 ? 1 : 0;
    var root = vertices[0], distances = {}, queue = [root], head = 0;
    distances[root] = 0;
    while (head < queue.length) {
      var vertex = queue[head++];
      vertices.forEach(function (next) {
        if (matrix[vertex][next] > 0 && distances[next] === undefined) { distances[next] = distances[vertex] + 1; queue.push(next); }
      });
    }
    var period = 0;
    vertices.forEach(function (from) {
      vertices.forEach(function (to) {
        if (matrix[from][to] > 0) period = gcd(period, distances[from] + 1 - distances[to]);
      });
    });
    return period;
  }

  function c(re, im) { return { re: re, im: im }; }
  function cAdd(left, right) { return c(left.re + right.re, left.im + right.im); }
  function cSub(left, right) { return c(left.re - right.re, left.im - right.im); }
  function cMul(left, right) { return c(left.re * right.re - left.im * right.im, left.re * right.im + left.im * right.re); }
  function cScale(value, scalar) { return c(value.re * scalar, value.im * scalar); }
  function cConj(value) { return c(value.re, -value.im); }
  function cAbs(value) { return Math.sqrt(value.re * value.re + value.im * value.im); }
  function cDiv(left, right) { var denominator = right.re * right.re + right.im * right.im; return denominator === 0 ? c(0, 0) : c((left.re * right.re + left.im * right.im) / denominator, (left.im * right.re - left.re * right.im) / denominator); }

  function complexMatrixMultiply(left, right) {
    var n = left.length, result = [];
    for (var i = 0; i < n; i += 1) {
      result[i] = [];
      for (var j = 0; j < n; j += 1) {
        var sum = c(0, 0);
        for (var k = 0; k < n; k += 1) sum = cAdd(sum, cMul(left[i][k], right[k][j]));
        result[i][j] = sum;
      }
    }
    return result;
  }

  function qrEigenvalues(matrix) {
    var n = matrix.length, current = matrix.map(function (row) { return row.map(function (value) { return c(value, 0); }); }), qrTolerance = relativeTolerance(matrixScale(matrix), RELATIVE_TOLERANCE);
    if (n === 1) return [{ re: matrix[0][0], im: 0, modulus: Math.abs(matrix[0][0]) }];
    if (n === 2) {
      var trace = matrix[0][0] + matrix[1][1], determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0], discriminant = trace * trace - 4 * determinant;
      if (discriminant >= 0) { var root = Math.sqrt(discriminant); return [{ re: (trace + root) / 2, im: 0, modulus: Math.abs((trace + root) / 2) }, { re: (trace - root) / 2, im: 0, modulus: Math.abs((trace - root) / 2) }]; }
      var real = trace / 2, imaginary = Math.sqrt(-discriminant) / 2, modulus = Math.sqrt(real * real + imaginary * imaginary);
      return [{ re: real, im: imaginary, modulus: modulus }, { re: real, im: -imaginary, modulus: modulus }];
    }
    for (var iteration = 0; iteration < 180; iteration += 1) {
      var q = Array.apply(null, Array(n)).map(function () { return Array.apply(null, Array(n)).map(function () { return c(0, 0); }); });
      var r = Array.apply(null, Array(n)).map(function () { return Array.apply(null, Array(n)).map(function () { return c(0, 0); }); });
      for (var column = 0; column < n; column += 1) {
        var vector = current.map(function (row) { return row[column]; });
        for (var previous = 0; previous < column; previous += 1) {
          var projection = c(0, 0);
          for (var rowIndex = 0; rowIndex < n; rowIndex += 1) projection = cAdd(projection, cMul(cConj(q[rowIndex][previous]), vector[rowIndex]));
          r[previous][column] = projection;
          for (rowIndex = 0; rowIndex < n; rowIndex += 1) vector[rowIndex] = cSub(vector[rowIndex], cMul(q[rowIndex][previous], projection));
        }
        var norm = Math.sqrt(vector.reduce(function (sum, value) { return sum + cAbs(value) * cAbs(value); }, 0));
        if (norm <= qrTolerance) {
          vector = positiveVector(n).map(function (value, index) { return c(index === column ? 1 : 0, 0); });
          for (previous = 0; previous < column; previous += 1) {
            var basisProjection = c(0, 0);
            for (rowIndex = 0; rowIndex < n; rowIndex += 1) basisProjection = cAdd(basisProjection, cMul(cConj(q[rowIndex][previous]), vector[rowIndex]));
            for (rowIndex = 0; rowIndex < n; rowIndex += 1) vector[rowIndex] = cSub(vector[rowIndex], cMul(q[rowIndex][previous], basisProjection));
          }
          norm = Math.sqrt(vector.reduce(function (sum, value) { return sum + cAbs(value) * cAbs(value); }, 0));
        }
        r[column][column] = c(norm, 0);
        for (rowIndex = 0; rowIndex < n; rowIndex += 1) q[rowIndex][column] = cScale(vector[rowIndex], 1 / (Math.max(qrTolerance, norm) || 1));
      }
      current = complexMatrixMultiply(r, q);
    }
    return current.map(function (row, index) { return { re: row[index].re, im: row[index].im, modulus: cAbs(row[index]) }; });
  }

  function shiftedPower(matrix, steps) {
    var n = matrix.length, shift = 1, x = normalize(positiveVector(n)), eigenvalue = 0, delta = Infinity;
    for (var step = 0; step < (steps || 100); step += 1) {
      var y = matrixVector(matrix, x).map(function (value, index) { return value + shift * x[index]; });
      eigenvalue = y.reduce(function (sum, value) { return sum + value; }, 0) / Math.max(Number.MIN_VALUE, x.reduce(function (sum, value) { return sum + value; }, 0));
      var next = normalize(y); delta = distance(next, x); x = next;
    }
    var ax = matrixVector(matrix, x), ratio = ax.reduce(function (sum, value) { return sum + value; }, 0) / Math.max(Number.MIN_VALUE, x.reduce(function (sum, value) { return sum + value; }, 0));
    return { vector: x, rho: Math.max(0, ratio), shiftedEigenvalue: eigenvalue, delta: delta, converged: delta < 1e-8 };
  }

  function powerIteration(matrix, options) {
    options = options || {};
    var n = matrix.length, steps = options.steps === undefined ? 16 : Math.max(0, Math.floor(options.steps)), initial = options.initial ? options.initial.slice() : positiveVector(n);
    if (initial.length !== n || initial.some(function (value) { return typeof value !== "number" || !isFinite(value); }) || l1(initial) === 0) throw new Error("power iteration needs a finite, nonzero initial vector");
    var leftBasis = options.perronLeftBasis;
    if (leftBasis === undefined) { var root = options.perronRoot === undefined ? shiftedPower(matrix, 120).rho : options.perronRoot; leftBasis = root > 0 ? nullspace(shiftedMatrix(transpose(matrix), root)).basis : null; }
    var condition = initial.every(function (value) { return value > 0; }) ? "strictly-positive" : (initial.every(function (value) { return value >= 0; }) ? "nonnegative-with-zeros" : "signed"), projection = projectionStatus(initial, leftBasis), x = normalize(initial), rows = [{ k: 0, vector: x.slice(), growth: null, delta: null }], delta = Infinity;
    for (var step = 1; step <= steps; step += 1) {
      var y = matrixVector(matrix, x), growth = l1(y);
      if (growth === 0) { x = y.map(function () { return 0; }); rows.push({ k: step, vector: x.slice(), growth: 0, delta: distance(x, rows[rows.length - 1].vector) }); break; }
      var next = y.map(function (value) { return value / growth; });
      delta = distance(next, x); rows.push({ k: step, vector: next.slice(), growth: growth, delta: delta }); x = next;
    }
    return { rows: rows, vector: x.slice(), converged: projection.zero !== true && delta < (options.tolerance === undefined ? 1e-7 : options.tolerance), steps: rows.length - 1, initialCondition: condition, perronProjection: projection, zeroPerronProjection: projection.known ? projection.zero : null };
  }

  function peripheralSpectrumFor(rho, period) {
    if (!(rho > 0) || !(period > 0)) return [];
    var values = [];
    for (var k = 0; k < period; k += 1) {
      var angle = 2 * Math.PI * k / period, re = rho * Math.cos(angle), im = rho * Math.sin(angle);
      values.push({ re: Math.abs(re) <= relativeTolerance(rho, RELATIVE_TOLERANCE) ? 0 : re, im: Math.abs(im) <= relativeTolerance(rho, RELATIVE_TOLERANCE) ? 0 : im, modulus: rho });
    }
    return values;
  }

  function classRecord(matrix, vertices) {
    var block = submatrix(matrix, vertices), root = shiftedPower(block, 100), period = periodOf(matrix, vertices);
    return { vertices: vertices.slice(), matrix: block, rho: root.rho, period: period, primitive: period === 1, eigenvector: root.vector, peripheralSpectrum: peripheralSpectrumFor(root.rho, period) };
  }

  function spectrumSummary(values, rho, periodic, peripheralTie) {
    if (!(rho > 0)) return { eigenvalues: values, subdominantRatio: null, tolerance: 0 };
    if (periodic || peripheralTie) return { eigenvalues: values, subdominantRatio: 1, tolerance: relativeTolerance(rho, RELATIVE_TOLERANCE) };
    var tolerance = relativeTolerance(rho, RELATIVE_TOLERANCE), subordinate = values.filter(function (value) { return value.modulus < rho - tolerance; }).map(function (value) { return value.modulus; });
    return { eigenvalues: values, subdominantRatio: subordinate.length ? Math.min(1, Math.max.apply(null, subordinate) / rho) : 0, tolerance: tolerance };
  }

  function peripheralSpectrum(matrixOrRho, period) {
    if (Array.isArray(matrixOrRho)) return analyzeMatrix(matrixOrRho).peripheralSpectrum;
    return peripheralSpectrumFor(Number(matrixOrRho), Number(period));
  }

  function analyzeMatrix(matrix, options) {
    var validation = validateMatrix(matrix);
    if (!validation.valid) return { validation: validation, matrix: Array.isArray(matrix) ? cloneMatrix(matrix) : [] };
    options = options || {};
    var n = matrix.length, classes = stronglyConnectedComponents(matrix).map(function (vertices) { return classRecord(matrix, vertices); }), irreducible = classes.length === 1, positive = matrix.every(function (row) { return row.every(function (value) { return value > 0; }); }), criticalRho = Math.max.apply(null, classes.map(function (item) { return item.rho; })), criticalClasses = classes.filter(function (item) { return relativeNear(item.rho, criticalRho, RELATIVE_TOLERANCE); }), period = irreducible ? classes[0].period : null, primitive = irreducible && period === 1, initial = options.initial === undefined ? positiveVector(n) : options.initial, perronSpace = perronEigenspace(matrix, criticalRho), leftSpace = criticalRho > 0 ? nullspace(shiftedMatrix(transpose(matrix), criticalRho)) : { basis: [] }, power = powerIteration(matrix, { initial: initial, perronLeftBasis: leftSpace.basis, steps: options.steps === undefined ? 16 : options.steps }), shifted = irreducible ? shiftedPower(matrix, 120) : null, values = qrEigenvalues(matrix), spectrum = spectrumSummary(values, criticalRho, irreducible && period > 1, criticalClasses.length > 1), peripheral = [];
    if (irreducible) peripheral = classes[0].peripheralSpectrum;
    else criticalClasses.forEach(function (item) { item.peripheralSpectrum.forEach(function (value) { if (!peripheral.some(function (existing) { return sameComplex(existing, value, criticalRho); })) peripheral.push(value); }); });
    var perronResult = irreducible ? vectorString(shifted.vector) : "dim ker(A−ρI)=" + perronSpace.dimension + "；支持=" + supportString(perronSpace.support);
    var perronEvidence = irreducible ? "用 A+I 的稳定幂法取得方向；原始幂法起点条件与投影另单独记录。" : "可约性不决定唯一性；实际 Perron 谱空间维数=" + perronSpace.dimension + "，支持=" + supportString(perronSpace.support) + "。";
    var ledger = [
      { layer: "非负 / 正", result: positive ? "A>0" : "A≥0 但含零元素", role: "模型定义", evidence: positive ? "严格正支持图一步互达。" : "非负性本身不提供周期与可约性结论。" },
      { layer: "SCC / 不可约", result: irreducible ? "不可约" : "可约，" + classes.length + " 个 SCC", role: "强连通的精确翻译", evidence: classes.map(function (item) { return "{" + item.vertices.join(",") + "}"; }).join(" ") },
      { layer: "周期 / 本原", result: irreducible ? (period === 1 ? "h=1，本原" : "h=" + period + "，周期不可约") : "按块分别计算", role: "本原 ⇔ 不可约且 h=1", evidence: irreducible ? "闭路长度 gcd=" + period : "可约时不能用单一周期替代 SCC 类结构" },
      { layer: "Perron 根", result: "ρ≈" + formatNumber(criticalRho, 5), role: "临界块最大根", evidence: "临界 SCC=" + criticalClasses.map(function (item) { return "{" + item.vertices.join(",") + "}"; }).join("、") },
      { layer: "Perron 向量", result: perronResult, role: irreducible ? "正右特征向量" : "实际谱空间 / 支持", evidence: perronEvidence },
      { layer: "原始幂法", result: power.zeroPerronProjection ? "零 Perron 投影：不作主方向结论" : (power.converged ? "有限步看见收敛" : "有限步未收敛"), role: primitive ? "x>0 时定理保证渐近收敛" : "诊断，不升级为定理", evidence: "起点=" + power.initialCondition + "；k=" + power.steps + "；最后方向=" + vectorString(power.vector) },
      { layer: "外围谱", result: spectrumString(peripheral), role: "周期 / 临界类账本", evidence: peripheral.length + " 个 |λ|=ρ 的点；周期类会保留单位圆相位。" },
      { layer: "混合比例", result: spectrum.subdominantRatio === null ? "ρ=0，无混合读法" : formatNumber(spectrum.subdominantRatio, 5), role: "谱隙诊断 |λnext|/ρ", evidence: primitive ? "应严格小于 1；数值比例只是当前矩阵的有限谱摘要。" : "等于 1 或未定义时，不能宣称原始幂法混合。" }
    ];
    return {
      validation: validation,
      matrix: cloneMatrix(matrix),
      n: n,
      positive: positive,
      irreducible: irreducible,
      primitive: primitive,
      period: period,
      classes: classes,
      criticalClasses: criticalClasses.map(function (item) { return item.vertices.slice(); }),
      rho: criticalRho,
      perron: { root: criticalRho, eigenvector: irreducible ? shifted.vector.slice() : null, representative: perronSpace.basis.length ? perronSpace.basis[0].slice() : null, eigenspaceDimension: perronSpace.dimension, unique: perronSpace.dimension === 1, support: perronSpace.support.slice(), eigenspaceBasis: perronSpace.basis.map(function (vector) { return vector.slice(); }), classEigenvectors: classes.map(function (item) { return { vertices: item.vertices.slice(), rho: item.rho, vector: item.eigenvector.slice() }; }) },
      eigenvalues: values,
      peripheralSpectrum: peripheral,
      subdominantRatio: spectrum.subdominantRatio,
      power: power,
      shiftedPower: shifted,
      ledger: ledger
    };
  }

  function perronRoot(matrix) { return analyzeMatrix(matrix).rho; }
  function formatNumber(value, digits) { return Number(value).toFixed(digits === undefined ? 3 : digits); }
  function vectorString(vector) { return vector ? "(" + vector.map(function (value) { return formatNumber(value, 3); }).join(", ") + ")" : "—"; }
  function complexString(value) { return formatNumber(value.re, 3) + (value.im >= 0 ? "+" : "") + formatNumber(value.im, 3) + "i"; }
  function spectrumString(values) { return values.length ? values.map(complexString).join(", ") : "∅"; }
  function supportString(support) { return support.length ? "{" + support.join(",") + "}" : "∅"; }
  function sameComplex(left, right, scale) { var distance = Math.sqrt((left.re - right.re) * (left.re - right.re) + (left.im - right.im) * (left.im - right.im)); return distance <= relativeTolerance(Math.max(scale || 0, cAbs(left), cAbs(right)), RELATIVE_TOLERANCE); }

  function presetById(id) { for (var index = 0; index < PRESETS.length; index += 1) if (PRESETS[index].id === id) return PRESETS[index]; return PRESETS[0]; }
  function setAttributes(node, attributes) { Object.keys(attributes || {}).forEach(function (key) { var value = attributes[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "text") node.textContent = String(value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); }); return node; }
  function appendChildren(node, children, doc) { if (children === undefined || children === null) return node; (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function element(doc, tag, attributes, children) { return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc); }
  function svgElement(doc, tag, attributes, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) { if (doc.getElementById && doc.getElementById(STYLE_ID)) return; var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style); }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function metric(doc, label) { var value = element(doc, "strong", { text: "—" }); return { node: element(doc, "div", { className: "pf-metric" }, [element(doc, "span", { text: label }), value]), value: value }; }

  function questionSpecs(result) {
    return [
      { key: "positive", prompt: "严格正矩阵是否一定本原？", expected: "yes", choices: [{ value: "yes", label: "是" }, { value: "no", label: "不一定" }, { value: "only-periodic", label: "只看周期" }] },
      { key: "power", prompt: "当前矩阵是否由定理保证原始归一化幂法收敛？", expected: result.primitive ? "yes" : "no", choices: [{ value: "yes", label: "保证" }, { value: "no", label: "不保证" }, { value: "finite", label: "看有限曲线即可" }] },
      { key: "reducible", prompt: "可约矩阵应先记录什么？", expected: "scc", choices: [{ value: "scc", label: "SCC / 临界块" }, { value: "global", label: "直接写唯一全正向量" }, { value: "trace", label: "只看迹" }] }
    ];
  }

  function renderPredictions(state, refs, result) {
    var specs = questionSpecs(result);
    refs.questions.forEach(function (questionRef, index) { var spec = specs[index]; questionRef.legend.textContent = spec.prompt; questionRef.buttons.forEach(function (buttonRef) { var selected = state.predictions[spec.key] === buttonRef.value; buttonRef.node.setAttribute("aria-pressed", selected ? "true" : "false"); if (state.revealed) { var correct = buttonRef.value === spec.expected; buttonRef.node.textContent = (correct ? "✓ " : "") + buttonRef.label; buttonRef.node.className = correct ? "pf-pass" : (selected ? "pf-warn" : ""); } else { buttonRef.node.textContent = buttonRef.label; buttonRef.node.className = ""; } }); });
  }

  function drawVisualization(doc, svg, result, uid) {
    clear(svg); svg.setAttribute("viewBox", "0 0 760 360");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-svg-title", text: "Perron-Frobenius 图、外围谱与幂法" }));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-svg-desc", text: "左侧是矩阵非零项的有向支持图；右侧是外围谱；底部是最后一次归一化幂法向量。" }));
    var defs = svgElement(doc, "defs", {}), markerId = uid + "-arrow", marker = svgElement(doc, "marker", { id: markerId, markerWidth: "7", markerHeight: "7", refX: "6", refY: "3.5", orient: "auto", markerUnits: "strokeWidth" });
    marker.appendChild(svgElement(doc, "path", { d: "M0,0 L7,3.5 L0,7 z", fill: "#315f9d" })); defs.appendChild(marker); svg.appendChild(defs);
    var n = result.n, points = [], centerX = 145, centerY = 130, radius = Math.min(84, 25 + 15 * n);
    for (var i = 0; i < n; i += 1) { var angle = -Math.PI / 2 + 2 * Math.PI * i / n; points.push([centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)]); }
    for (i = 0; i < n; i += 1) for (var j = 0; j < n; j += 1) if (result.matrix[i][j] > 0) svg.appendChild(svgElement(doc, "line", { x1: points[i][0], y1: points[i][1], x2: points[j][0], y2: points[j][1], class: "pf-edge", "marker-end": "url(#" + markerId + ")" }));
    points.forEach(function (point, index) { svg.appendChild(svgElement(doc, "circle", { cx: point[0], cy: point[1], r: "17", class: "pf-node" })); svg.appendChild(svgElement(doc, "text", { x: point[0], y: point[1], class: "pf-node-label" }, String(index))); });
    svg.appendChild(svgElement(doc, "text", { x: "40", y: "252", class: "pf-small" }, result.irreducible ? "支持图：强连通" : "支持图：可约，先看 SCC"));
    var sx = 545, sy = 130, sr = 82, rho = result.rho > 0 ? result.rho : 1, scale = sr / rho;
    svg.appendChild(svgElement(doc, "circle", { cx: sx, cy: sy, r: sr, class: "pf-spectral-circle" })); svg.appendChild(svgElement(doc, "line", { x1: sx - sr - 10, y1: sy, x2: sx + sr + 10, y2: sy, class: "pf-axis" })); svg.appendChild(svgElement(doc, "line", { x1: sx, y1: sy - sr - 10, x2: sx, y2: sy + sr + 10, class: "pf-axis" }));
    result.peripheralSpectrum.forEach(function (value) { svg.appendChild(svgElement(doc, "circle", { cx: sx + value.re * scale, cy: sy - value.im * scale, r: "5", class: "pf-peripheral" })); });
    svg.appendChild(svgElement(doc, "text", { x: "470", y: "28", class: "pf-small" }, "外围谱 |λ|=ρ≈" + formatNumber(result.rho, 3))); svg.appendChild(svgElement(doc, "text", { x: "470", y: "252", class: "pf-small" }, spectrumString(result.peripheralSpectrum)));
    var row = result.power.rows[result.power.rows.length - 1].vector, barBase = 335, barWidth = Math.min(58, 220 / Math.max(1, n)), barStart = 420;
    row.forEach(function (value, index) { var height = Math.max(0, 75 * value), x = barStart + index * (barWidth + 10); svg.appendChild(svgElement(doc, "rect", { x: x, y: barBase - height, width: barWidth, height: height, class: "pf-bar" })); svg.appendChild(svgElement(doc, "text", { x: x + barWidth / 2, y: barBase + 16, class: "pf-small", "text-anchor": "middle" }, "v" + index)); });
    svg.appendChild(svgElement(doc, "text", { x: "40", y: "300", class: "pf-small" }, "归一化幂法最后向量"));
  }

  function renderLedger(doc, hostNode, result) {
    var body = element(doc, "tbody", {}); result.ledger.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row.layer }), element(doc, "td", { text: row.result }), element(doc, "td", { text: row.role }), element(doc, "td", { text: row.evidence })])); }); clear(hostNode); hostNode.appendChild(element(doc, "table", { className: "pf-table" }, [element(doc, "caption", { text: "非负矩阵学习账本：结构、谱和数值行为分栏" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { scope: "col", text: "层" }), element(doc, "th", { scope: "col", text: "结果" }), element(doc, "th", { scope: "col", text: "逻辑角色" }), element(doc, "th", { scope: "col", text: "证据 / 边界" })])]), body]));
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument, uid = "pf-" + (++INSTANCE), state = { presetId: PRESETS[0].id, steps: 16, revealed: false, predictions: {}, feedback: "" }, refs = { questions: [] };
    installStyles(doc);
    var shell = element(doc, "div", { className: "pf-lab" }); shell.appendChild(element(doc, "h3", { text: "Perron-Frobenius 实验：结构先于收敛曲线" })); shell.appendChild(element(doc, "p", { className: "pf-note", text: "固定有限非负矩阵；比较正、本原、周期不可约和可约四类行为。" }));
    var presetSelect = element(doc, "select", { "aria-label": "Perron-Frobenius 矩阵预设" }); PRESETS.forEach(function (preset) { presetSelect.appendChild(element(doc, "option", { value: preset.id, text: preset.label })); });
    var stepsInput = element(doc, "input", { type: "range", min: "6", max: "32", step: "1", value: "16", "aria-label": "幂迭代步数" }), stepsOutput = element(doc, "output", { text: "16" });
    var reset = element(doc, "button", { type: "button", text: "重置预测" });
    shell.appendChild(element(doc, "div", { className: "pf-controls" }, [element(doc, "div", { className: "pf-control" }, [element(doc, "label", { text: "矩阵预设" }), presetSelect]), element(doc, "div", { className: "pf-control" }, [element(doc, "label", {}, ["幂法步数：", stepsOutput]), stepsInput]), reset]));
    var gate = element(doc, "div", { className: "pf-gate" }); questionSpecs(analyzeMatrix(PRESETS[0].matrix)).forEach(function (spec) { var fieldset = element(doc, "fieldset", {}), legend = element(doc, "legend", { text: spec.prompt }), grid = element(doc, "div", { className: "pf-choice-grid" }), questionRef = { key: spec.key, legend: legend, buttons: [] }; spec.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label }); button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); }); questionRef.buttons.push({ value: choice.value, label: choice.label, node: button }); grid.appendChild(button); }); fieldset.appendChild(legend); fieldset.appendChild(grid); gate.appendChild(fieldset); refs.questions.push(questionRef); }); shell.appendChild(gate);
    var actions = element(doc, "div", { className: "pf-actions" }), reveal = element(doc, "button", { type: "button", className: "pf-primary", text: "核对预测并揭晓" }), feedback = element(doc, "p", { className: "pf-feedback", "aria-live": "polite" }); actions.appendChild(reveal); shell.appendChild(actions); shell.appendChild(feedback);
    var resultShell = element(doc, "div", { className: "pf-result", hidden: true }), svg = svgElement(doc, "svg", { className: "pf-svg", role: "img", "aria-labelledby": uid + "-svg-title " + uid + "-svg-desc", viewBox: "0 0 760 360" }), metricsHost = element(doc, "div", { className: "pf-metrics" }), certificate = element(doc, "p", { className: "pf-certificate" }), tableHost = element(doc, "div", { className: "pf-table-wrap" });
    resultShell.appendChild(element(doc, "div", { className: "pf-layout" }, [element(doc, "div", { className: "pf-frame" }, [svg]), element(doc, "div", {}, [metricsHost, certificate])])); resultShell.appendChild(tableHost); shell.appendChild(resultShell); clear(root); root.appendChild(shell);
    function lock() { state.revealed = false; state.predictions = {}; state.feedback = ""; render(); }
    presetSelect.addEventListener("change", function () { state.presetId = presetSelect.value; state.initial = null; lock(); }); stepsInput.addEventListener("input", function () { state.steps = Number(stepsInput.value); lock(); }); reset.addEventListener("click", function () { state = { presetId: PRESETS[0].id, steps: 16, revealed: false, predictions: {}, feedback: "" }; render(); announce(api, root, "Perron-Frobenius 预测已重置。"); });
    reveal.addEventListener("click", function () { var result = analyzeMatrix(presetById(state.presetId).matrix, { initial: presetById(state.presetId).initial, steps: state.steps }), specs = questionSpecs(result); if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测。"; render(); return; } var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length; state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中；把 raw power 和结构定理分开读。"; render(); announce(api, root, state.feedback); });
    function render() { var preset = presetById(state.presetId), result = analyzeMatrix(preset.matrix, { initial: preset.initial, steps: state.steps }); presetSelect.value = preset.id; stepsInput.value = String(state.steps); stepsOutput.textContent = String(state.steps); renderPredictions(state, refs, result); feedback.textContent = state.feedback || ""; feedback.className = "pf-feedback" + (state.feedback.indexOf("请先") === 0 ? " pf-warn" : ""); resultShell.hidden = !state.revealed; if (!state.revealed) return; drawVisualization(doc, svg, result, uid); var metrics = [metric(doc, "类型"), metric(doc, "ρ"), metric(doc, "周期 h"), metric(doc, "Perron 向量"), metric(doc, "原始幂法"), metric(doc, "次大比例")]; clear(metricsHost); metrics.forEach(function (item) { metricsHost.appendChild(item.node); }); metrics[0].value.textContent = result.positive ? "正" : (result.irreducible ? (result.primitive ? "本原" : "周期不可约") : "可约"); metrics[1].value.textContent = formatNumber(result.rho, 5); metrics[2].value.textContent = result.period === null ? "按 SCC" : String(result.period); metrics[3].value.textContent = result.irreducible ? vectorString(result.perron.eigenvector) : "dim=" + result.perron.eigenspaceDimension + "；支持=" + supportString(result.perron.support); metrics[4].value.textContent = result.power.zeroPerronProjection ? "零 Perron 投影" : (result.power.converged ? "收敛迹象" : "未收敛"); metrics[5].value.textContent = result.subdominantRatio === null ? "—" : formatNumber(result.subdominantRatio, 5); certificate.className = "pf-certificate" + (result.primitive && !result.power.zeroPerronProjection ? "" : " pf-blocked"); certificate.textContent = result.power.zeroPerronProjection ? "当前幂法起点在 Perron 左特征空间上的投影为零，不把归一化曲线当作 Perron 方向。" : (result.primitive ? "本原证书：对逐元素严格正起点，归一化幂法有渐近收敛定理；当前有限表和谱隙比例仍只是该矩阵的数值回放。" : (result.irreducible ? "不可约但非本原：外围谱保留周期相位，原始幂法不享有普遍收敛保证。" : "可约证书：Perron 特征空间 dim=" + result.perron.eigenspaceDimension + "，支持=" + supportString(result.perron.support) + "；按实际谱空间描述，不由可约性预判唯一性。")); renderLedger(doc, tableHost, result); }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { assert(condition, message); checks += 1; }
    PRESETS.forEach(function (preset) { var result = analyzeMatrix(preset.matrix, { initial: preset.initial, steps: 20 }); check(result.validation.valid, preset.id + " validation"); check(result.ledger.length >= 8, preset.id + " ledger depth"); check(result.rho >= 0, preset.id + " nonnegative rho"); });
    var positive = analyzeMatrix(presetById("positive").matrix, { initial: [1, 0.25], steps: 20 }); check(positive.positive && positive.irreducible && positive.primitive, "positive classification"); check(near(positive.rho, 3, 1e-5), "positive Perron root"); check(near(positive.perron.eigenvector[0], positive.perron.eigenvector[1], 1e-5), "positive Perron vector"); check(positive.peripheralSpectrum.length === 1, "positive peripheral spectrum"); check(positive.subdominantRatio < 1, "positive spectral gap"); check(positive.power.converged, "positive raw power convergence");
    var primitive = analyzeMatrix(presetById("primitive").matrix, { initial: [1, 0.3, 0.2], steps: 80 }); check(!primitive.positive && primitive.irreducible && primitive.primitive, "primitive nonpositive classification"); check(primitive.period === 1, "primitive period one"); check(primitive.peripheralSpectrum.length === 1, "primitive peripheral spectrum"); check(primitive.power.converged, "primitive raw power convergence");
    var periodic = analyzeMatrix(presetById("periodic").matrix, { initial: [1, 0.25], steps: 12 }); check(periodic.irreducible && !periodic.primitive && periodic.period === 2, "periodic classification"); check(near(periodic.rho, Math.sqrt(2), 1e-5), "periodic Perron root"); check(periodic.peripheralSpectrum.length === 2, "periodic peripheral pair"); check(periodic.subdominantRatio === 1, "periodic no spectral gap ratio"); check(!periodic.power.converged, "periodic raw power does not converge"); check(periodic.power.rows[1].vector[0] !== periodic.power.rows[2].vector[0], "periodic power alternates");
    var reducible = analyzeMatrix(presetById("reducible").matrix, { initial: [1, 0.6, 0.3], steps: 18 }); check(!reducible.irreducible && reducible.classes.length === 3, "reducible SCC classes"); check(near(reducible.rho, 2, 1e-5), "reducible critical root"); check(reducible.perron.eigenvector === null, "reducible global vector boundary"); check(reducible.criticalClasses.length === 1 && reducible.criticalClasses[0][0] === 0, "reducible critical class"); check(reducible.ledger[1].result.indexOf("可约") === 0, "reducible ledger class structure");
    check(reducible.perron.eigenspaceDimension === 1 && reducible.perron.unique && reducible.perron.support.length === 1 && reducible.perron.support[0] === 0, "reducible actual Perron space");
    var reducibleMultiple = analyzeMatrix([[2, 0], [0, 2]], { initial: [1, 1], steps: 4 }); check(reducibleMultiple.perron.eigenspaceDimension === 2 && !reducibleMultiple.perron.unique && reducibleMultiple.perron.support.length === 2, "reducible multiplicity is measured");
    var zeroProjection = analyzeMatrix([[2, 0], [0, 1]], { initial: [0, 1], steps: 6 }); check(zeroProjection.power.zeroPerronProjection === true && !zeroProjection.power.converged, "zero Perron projection is marked");
    var tinyPeriodic = analyzeMatrix([[0, 1e-12], [1e-12, 0]], { initial: [1, 0.25], steps: 4 }); check(tinyPeriodic.irreducible && tinyPeriodic.period === 2 && near(tinyPeriodic.rho, 1e-12, 1e-8), "tiny positive cycle stays structural"); check(tinyPeriodic.peripheralSpectrum.length === 2 && tinyPeriodic.power.zeroPerronProjection === false, "tiny periodic spectrum and power");
    var nearGap = analyzeMatrix([[1, 1e-6], [1e-6, 1]], { initial: [1, 0.25], steps: 4 }); check(nearGap.subdominantRatio > 0.99999 && nearGap.subdominantRatio < 1 && near(nearGap.subdominantRatio, 0.999998, 1e-6), "relative spectral ratio threshold");
    check(peripheralSpectrum(3, 2).length === 2, "peripheral helper period"); check(validateMatrix([[1, -1]]).valid === false, "negative matrix rejected"); check(powerIteration([[0, 1], [1, 0]], { initial: [1, 0.25], steps: 4 }).rows.length === 5, "power helper rows");
    return { ok: true, checks: checks, presets: PRESETS.length };
  }

  return { EPS: EPS, PRESETS: PRESETS.map(clonePreset), validateMatrix: validateMatrix, stronglyConnectedComponents: stronglyConnectedComponents, periodOf: periodOf, qrEigenvalues: qrEigenvalues, perronRoot: perronRoot, powerIteration: powerIteration, peripheralSpectrum: peripheralSpectrum, analyzeMatrix: analyzeMatrix, classifyMatrix: analyzeMatrix, selfTest: selfTest, mount: mount };
});
