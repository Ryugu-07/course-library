(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-inverse-uncertainty", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-inverse-uncertainty self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-inverse-uncertainty self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var LAB_ID = "physics-inverse-uncertainty";
  var STYLE_ID = "physics-inverse-uncertainty-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var SIZE = 16;
  var SENSOR_COUNT = 16;
  var WIDTH = 0.14;
  var DEFAULTS = { lambda: 0.03, sigma: 0.05, draws: 80, seed: 20260827 };
  var NOISE_PATTERN = [0.42, -0.88, 0.18, 0.65, -0.31, 0.94, -0.52, 0.16, -0.74, 0.37, 0.61, -0.25, -0.68, 0.49, -0.12, 0.28];
  var L_CURVE_LAMBDAS = [0.00001, 0.0001, 0.001, 0.01, 0.03, 0.1, 1, 10, 100];
  var chartClipSequence = 0;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
  }

  function finite(value, name) {
    var number = Number(value);
    if (!isFinite(number)) throw new RangeError(name + " must be finite");
    return number;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function integer(value, name, minimum, maximum) {
    var number = finite(value, name);
    if (Math.floor(number) !== number || number < minimum || number > maximum) throw new RangeError(name + " must be an integer in range");
    return number;
  }

  function normalize(options) {
    options = options || {};
    return {
      lambda: clamp(finite(options.lambda === undefined ? DEFAULTS.lambda : options.lambda, "lambda"), 1e-5, 100),
      sigma: clamp(finite(options.sigma === undefined ? DEFAULTS.sigma : options.sigma, "sigma"), 0.01, 0.2),
      draws: integer(options.draws === undefined ? DEFAULTS.draws : options.draws, "draws", 20, 300),
      seed: integer(options.seed === undefined ? DEFAULTS.seed : options.seed, "seed", 1, 2147483647)
    };
  }

  function sourceGrid(index) {
    return index / (SIZE - 1);
  }

  function trueSource(index) {
    var x = sourceGrid(index);
    return 0.15 + 0.95 * Math.exp(-0.5 * Math.pow((x - 0.28) / 0.075, 2)) + 0.7 * Math.exp(-0.5 * Math.pow((x - 0.73) / 0.11, 2));
  }

  function sensorGrid(index) {
    return index / (SENSOR_COUNT - 1);
  }

  function buildKernel() {
    var matrix = [];
    for (var i = 0; i < SENSOR_COUNT; i += 1) {
      var row = [];
      var total = 0;
      for (var j = 0; j < SIZE; j += 1) {
        var distance = sensorGrid(i) - sourceGrid(j);
        var value = Math.exp(-0.5 * distance * distance / (WIDTH * WIDTH));
        row.push(value);
        total += value;
      }
      matrix.push(row.map(function (value) { return value / total; }));
    }
    return matrix;
  }

  var KERNEL = buildKernel();

  function matrixVector(matrix, vector) {
    return matrix.map(function (row) { return row.reduce(function (sum, value, index) { return sum + value * vector[index]; }, 0); });
  }

  function transposeProduct(matrix) {
    var result = Array.from({ length: SIZE }, function () { return Array(SIZE).fill(0); });
    for (var i = 0; i < SIZE; i += 1) {
      for (var j = 0; j < SIZE; j += 1) {
        for (var row = 0; row < SENSOR_COUNT; row += 1) result[i][j] += matrix[row][i] * matrix[row][j];
      }
    }
    return result;
  }

  function transposeVector(matrix, vector) {
    return Array.from({ length: SIZE }, function (_, column) {
      return matrix.reduce(function (sum, row, index) { return sum + row[column] * vector[index]; }, 0);
    });
  }

  function regularizer() {
    var matrix = Array.from({ length: SIZE }, function () { return Array(SIZE).fill(0); });
    for (var i = 0; i < SIZE; i += 1) matrix[i][i] = 1e-3;
    for (var row = 0; row < SIZE - 1; row += 1) {
      matrix[row][row] += 1;
      matrix[row + 1][row + 1] += 1;
      matrix[row][row + 1] -= 1;
      matrix[row + 1][row] -= 1;
    }
    return matrix;
  }

  var REGULARIZER = regularizer();

  function addScaled(left, right, scale) {
    return left.map(function (row, rowIndex) { return row.map(function (value, columnIndex) { return value + scale * right[rowIndex][columnIndex]; }); });
  }

  function solveLinear(matrix, rhs) {
    var n = matrix.length;
    var augmented = matrix.map(function (row, index) { return row.slice().concat([rhs[index]]); });
    for (var column = 0; column < n; column += 1) {
      var pivot = column;
      for (var candidate = column + 1; candidate < n; candidate += 1) if (Math.abs(augmented[candidate][column]) > Math.abs(augmented[pivot][column])) pivot = candidate;
      if (Math.abs(augmented[pivot][column]) < 1e-12) throw new Error("singular inverse system");
      if (pivot !== column) { var swap = augmented[pivot]; augmented[pivot] = augmented[column]; augmented[column] = swap; }
      for (var row = column + 1; row < n; row += 1) {
        var factor = augmented[row][column] / augmented[column][column];
        if (factor === 0) continue;
        for (var update = column; update <= n; update += 1) augmented[row][update] -= factor * augmented[column][update];
      }
    }
    var solution = Array(n).fill(0);
    for (var back = n - 1; back >= 0; back -= 1) {
      var sum = augmented[back][n];
      for (var upper = back + 1; upper < n; upper += 1) sum -= augmented[back][upper] * solution[upper];
      solution[back] = sum / augmented[back][back];
    }
    return solution;
  }

  function inverse(matrix) {
    var n = matrix.length;
    var result = Array.from({ length: n }, function () { return Array(n).fill(0); });
    for (var column = 0; column < n; column += 1) {
      var unit = Array(n).fill(0);
      unit[column] = 1;
      var solution = solveLinear(matrix, unit);
      for (var row = 0; row < n; row += 1) result[row][column] = solution[row];
    }
    return result;
  }

  function cholesky(matrix) {
    var n = matrix.length;
    var lower = Array.from({ length: n }, function () { return Array(n).fill(0); });
    for (var i = 0; i < n; i += 1) {
      for (var j = 0; j <= i; j += 1) {
        var sum = matrix[i][j];
        for (var k = 0; k < j; k += 1) sum -= lower[i][k] * lower[j][k];
        if (i === j) {
          if (!(sum > 0)) throw new Error("posterior covariance is not positive definite");
          lower[i][j] = Math.sqrt(sum);
        } else {
          lower[i][j] = sum / lower[j][j];
        }
      }
    }
    return lower;
  }

  function makeRng(seed) {
    var state = (seed >>> 0) || 1;
    return function () {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
  }

  function normalRandom(rng) {
    var u = Math.max(1e-12, rng());
    var v = Math.max(1e-12, rng());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function observedData(sigma) {
    var clean = matrixVector(KERNEL, Array.from({ length: SIZE }, function (_, index) { return trueSource(index); }));
    return clean.map(function (value, index) { return value + sigma * NOISE_PATTERN[index]; });
  }

  function fitCore(config) {
    var data = observedData(config.sigma);
    var normalMatrix = addScaled(transposeProduct(KERNEL), REGULARIZER, config.lambda * config.sigma * config.sigma);
    var right = transposeVector(KERNEL, data);
    var mean = solveLinear(normalMatrix, right);
    var inverseNormal = inverse(normalMatrix);
    var covariance = inverseNormal.map(function (row) { return row.map(function (value) { return value * config.sigma * config.sigma; }); });
    var fitted = matrixVector(KERNEL, mean);
    var residuals = data.map(function (value, index) { return value - fitted[index]; });
    var residualSumSquares = residuals.reduce(function (sum, value) { return sum + value * value; }, 0);
    var residualNorm = Math.sqrt(residualSumSquares);
    var residualRms = residualNorm / Math.sqrt(SENSOR_COUNT);
    var roughnessSumSquares = mean.slice(1).reduce(function (sum, value, index) { var difference = value - mean[index]; return sum + difference * difference; }, 0);
    var regularizationSeminorm = Math.sqrt(roughnessSumSquares);
    var roughness = regularizationSeminorm / Math.sqrt(SIZE - 1);
    var truth = Array.from({ length: SIZE }, function (_, index) { return trueSource(index); });
    var sourceRmse = Math.sqrt(mean.reduce(function (sum, value, index) { var difference = value - truth[index]; return sum + difference * difference; }, 0) / SIZE);
    var chiSquare = residuals.reduce(function (sum, value) { return sum + value * value; }, 0) / (config.sigma * config.sigma);
    return { config: config, data: data, mean: mean, covariance: covariance, fitted: fitted, residuals: residuals, residualNorm: residualNorm, residualRms: residualRms, regularizationSeminorm: regularizationSeminorm, roughness: roughness, sourceRmse: sourceRmse, chiSquare: chiSquare };
  }

  function discrepancy(data, prediction, sigma) {
    return data.reduce(function (sum, value, index) {
      var standardizedResidual = (value - prediction[index]) / sigma;
      return sum + standardizedResidual * standardizedResidual;
    }, 0) / data.length;
  }

  function average(values) {
    return values.reduce(function (sum, value) { return sum + value; }, 0) / Math.max(1, values.length);
  }

  function posteriorPredictive(core) {
    var config = core.config;
    var lower = cholesky(core.covariance);
    var rng = makeRng(config.seed + 17);
    var lowerBand = [];
    var upperBand = [];
    for (var sensor = 0; sensor < SENSOR_COUNT; sensor += 1) {
      var variance = config.sigma * config.sigma;
      for (var sourceIndex = 0; sourceIndex < SIZE; sourceIndex += 1) {
        for (var other = 0; other < SIZE; other += 1) variance += KERNEL[sensor][sourceIndex] * core.covariance[sourceIndex][other] * KERNEL[sensor][other];
      }
      var width = 1.96 * Math.sqrt(Math.max(0, variance));
      lowerBand.push(core.fitted[sensor] - width);
      upperBand.push(core.fitted[sensor] + width);
    }
    var coverage = core.data.reduce(function (count, value, index) { return count + (value >= lowerBand[index] && value <= upperBand[index] ? 1 : 0); }, 0);
    var observedDiscrepancies = [];
    var replicatedDiscrepancies = [];
    var replicatedAtLeastObserved = 0;
    var replicatedAtMostObserved = 0;
    for (var draw = 0; draw < config.draws; draw += 1) {
      var z = Array.from({ length: SIZE }, function () { return normalRandom(rng); });
      var sample = core.mean.map(function (value, index) {
        var shift = 0;
        for (var column = 0; column <= index; column += 1) shift += lower[index][column] * z[column];
        return value + shift;
      });
      var prediction = matrixVector(KERNEL, sample);
      var observedDiscrepancy = discrepancy(core.data, prediction, config.sigma);
      var replicated = prediction.map(function (value) { return value + config.sigma * normalRandom(rng); });
      var replicatedDiscrepancy = discrepancy(replicated, prediction, config.sigma);
      observedDiscrepancies.push(observedDiscrepancy);
      replicatedDiscrepancies.push(replicatedDiscrepancy);
      if (replicatedDiscrepancy >= observedDiscrepancy) replicatedAtLeastObserved += 1;
      if (replicatedDiscrepancy <= observedDiscrepancy) replicatedAtMostObserved += 1;
    }
    var drawCount = Math.max(1, replicatedDiscrepancies.length);
    return {
      lower: lowerBand,
      upper: upperBand,
      coverage: coverage,
      coverageFraction: coverage / SENSOR_COUNT,
      observedDiscrepancies: observedDiscrepancies,
      replicatedDiscrepancies: replicatedDiscrepancies,
      observedDiscrepancy: average(observedDiscrepancies),
      replicatedDiscrepancy: average(replicatedDiscrepancies),
      pValue: replicatedAtLeastObserved / drawCount,
      discrepancyPercentile: replicatedAtMostObserved / drawCount,
      discrepancies: replicatedDiscrepancies.slice().sort(function (left, right) { return left - right; })
    };
  }

  function analyze(options) {
    var config = normalize(options);
    var core = fitCore(config);
    var predictive = posteriorPredictive(core);
    return { config: config, data: core.data, mean: core.mean, covariance: core.covariance, fitted: core.fitted, residuals: core.residuals, residualNorm: core.residualNorm, residualRms: core.residualRms, regularizationSeminorm: core.regularizationSeminorm, roughness: core.roughness, sourceRmse: core.sourceRmse, chiSquare: core.chiSquare, predictive: predictive };
  }

  function lCurve(sigma) {
    return L_CURVE_LAMBDAS.map(function (lambda) {
      var core = fitCore(normalize({ lambda: lambda, sigma: sigma, draws: DEFAULTS.draws, seed: DEFAULTS.seed }));
      return { lambda: lambda, residualNorm: core.residualNorm, residualRms: core.residualRms, regularizationSeminorm: core.regularizationSeminorm, roughness: core.roughness };
    });
  }

  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 5));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = String(value);
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    (children || []).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value !== undefined && value !== null) node.setAttribute(key === "className" ? "class" : key, String(value));
    });
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function installStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--piu-blue:#2563a6;--piu-green:#18734a;--piu-orange:#b45309;--piu-red:#a33b2f;max-width:100%;min-width:0;color:var(--fg,inherit);line-height:1.55}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-note,[data-learning-lab="' + LAB_ID + '"] .piu-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{margin:11px 0;padding:10px 12px;border:1px solid var(--border,currentColor);border-radius:6px}' +
      '[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-width:0;min-height:44px;font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer;line-height:1.35}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--piu-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] button[aria-pressed=true],[data-learning-lab="' + LAB_ID + '"] .piu-primary{background:var(--piu-blue);border-color:var(--piu-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.piu-actions>*{flex:1 1 170px}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-feedback{min-height:2em;margin:7px 0;font-weight:700}.piu-pass{color:var(--piu-green)}.piu-warn{color:var(--piu-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:15px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-control{display:grid;gap:5px;min-width:0}.piu-control label{font-size:13px;font-weight:700}.piu-control output{color:var(--piu-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;accent-color:var(--piu-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-revealed{margin-top:18px;padding-top:15px;border-top:1px solid var(--border,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-metric{min-width:0;padding:9px;border-top:3px solid var(--piu-blue);background:var(--bg,Canvas)}.piu-metric:nth-child(2){border-top-color:var(--piu-green)}.piu-metric:nth-child(3){border-top-color:var(--piu-orange)}.piu-metric:nth-child(4){border-top-color:var(--piu-red)}.piu-metric:nth-child(5){border-top-color:var(--piu-green)}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}.piu-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-chart-frame{min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;padding:6px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;color:var(--fg,inherit)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-axis{stroke:currentColor;stroke-opacity:.68}.piu-grid-line{stroke:var(--border,currentColor);stroke-opacity:.65}.piu-truth{fill:none;stroke:var(--piu-blue);stroke-width:3}.piu-mean{fill:none;stroke:var(--piu-orange);stroke-width:2.5}.piu-fit{fill:none;stroke:var(--piu-green);stroke-width:2.5}.piu-data{fill:var(--piu-red)}.piu-band{fill:var(--piu-green);fill-opacity:.14;stroke:none}.piu-lcurve{fill:none;stroke:var(--piu-red);stroke-width:2.5}.piu-chart-title{font-size:13px;font-weight:700}.piu-chart-muted{fill:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .piu-table-wrap{max-width:100%;overflow-x:auto;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;white-space:nowrap}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
      'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--piu-blue:#82b6ff;--piu-green:#79d39a;--piu-orange:#f0b15a;--piu-red:#ff9f91}' +
      '@media(max-width:720px){[data-learning-lab="' + LAB_ID + '"] .piu-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .piu-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){[data-learning-lab="' + LAB_ID + '"] .piu-chart-frame svg{min-width:760px}[data-learning-lab="' + LAB_ID + '"] .piu-chart-frame svg text{font-size:22px}[data-learning-lab="' + LAB_ID + '"] .piu-chart-frame svg .piu-chart-title{font-size:20px}[data-learning-lab="' + LAB_ID + '"] .piu-chart-frame svg .piu-chart-muted{font-size:18px}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .piu-choice-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function drawDashboard(doc, svg, result, curve) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 920 630");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "模糊源项逆问题的后验源、传感器预测与正则化曲线");
    svg.appendChild(svgElement(doc, "title", {}, "逆问题与后验预测检查"));
    svg.appendChild(svgElement(doc, "desc", {}, "上左比较真实源项和正则化后验均值，上右比较传感器观测和预测区间，下方显示数据残差与粗糙度的正则化折衷。"));
    var panels = [{ x: 18, y: 18, w: 430, h: 275 }, { x: 470, y: 18, w: 430, h: 275 }, { x: 18, y: 325, w: 882, h: 285 }];
    panels.forEach(function (panel) { svg.appendChild(svgElement(doc, "rect", { x: panel.x, y: panel.y, width: panel.w, height: panel.h, fill: "none", stroke: "var(--border,currentColor)", "stroke-width": 1 })); });
    var left = 58;
    var right = 422;
    var top = 56;
    var bottom = 252;
    var xSource = function (value) { return left + (right - left) * value; };
    var sourceBandValues = [];
    result.mean.forEach(function (value, index) {
      var width = 1.96 * Math.sqrt(Math.max(0, result.covariance[index][index]));
      sourceBandValues.push(value - width, value + width, trueSource(index));
    });
    var sourceDataMin = Math.min.apply(null, sourceBandValues);
    var sourceDataMax = Math.max.apply(null, sourceBandValues);
    var sourcePadding = Math.max(0.05, (sourceDataMax - sourceDataMin) * 0.08);
    var sourceMin = sourceDataMin - sourcePadding;
    var sourceMax = sourceDataMax + sourcePadding;
    var sourceSpan = Math.max(1e-9, sourceMax - sourceMin);
    var ySource = function (value) { return bottom - (bottom - top) * (value - sourceMin) / sourceSpan; };
    var sourceClipId = LAB_ID + "-source-clip-" + chartClipSequence;
    chartClipSequence += 1;
    var defs = svgElement(doc, "defs", {});
    var sourceClip = svgElement(doc, "clipPath", { id: sourceClipId });
    sourceClip.appendChild(svgElement(doc, "rect", { x: left, y: top, width: right - left, height: bottom - top }));
    defs.appendChild(sourceClip);
    svg.appendChild(defs);
    svg.appendChild(svgElement(doc, "text", { x: 32, y: 42, className: "piu-chart-title" }, "源项 x(s)：蓝真实，橙后验均值，绿 95%带"));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, className: "piu-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, className: "piu-axis" }));
    var bandTop = result.mean.map(function (_, index) { var variance = Math.max(0, result.covariance[index][index]); return ySource(result.mean[index] + 1.96 * Math.sqrt(variance)); });
    var bandBottom = result.mean.map(function (_, index) { var variance = Math.max(0, result.covariance[index][index]); return ySource(result.mean[index] - 1.96 * Math.sqrt(variance)); });
    var bandPath = result.mean.map(function (_, index) { return (index ? "L" : "M") + xSource(sourceGrid(index)).toFixed(2) + " " + bandTop[index].toFixed(2); }).join(" ") + " " + result.mean.map(function (_, reverse) { var index = result.mean.length - 1 - reverse; return "L" + xSource(sourceGrid(index)).toFixed(2) + " " + bandBottom[index].toFixed(2); }).join(" ") + " Z";
    svg.appendChild(svgElement(doc, "path", { d: bandPath, className: "piu-band", "clip-path": "url(#" + sourceClipId + ")" }));
    svg.appendChild(svgElement(doc, "path", { d: result.mean.map(function (_, index) { return (index ? "L" : "M") + xSource(sourceGrid(index)).toFixed(2) + " " + ySource(trueSource(index)).toFixed(2); }).join(" "), className: "piu-truth", "clip-path": "url(#" + sourceClipId + ")" }));
    svg.appendChild(svgElement(doc, "path", { d: result.mean.map(function (value, index) { return (index ? "L" : "M") + xSource(sourceGrid(index)).toFixed(2) + " " + ySource(value).toFixed(2); }).join(" "), className: "piu-mean", "clip-path": "url(#" + sourceClipId + ")" }));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 22, className: "piu-chart-muted", "text-anchor": "end" }, "源位置 s"));
    svg.appendChild(svgElement(doc, "text", { x: left - 7, y: top + 4, className: "piu-chart-muted", "text-anchor": "end" }, format(sourceMax, 2)));
    svg.appendChild(svgElement(doc, "text", { x: left - 7, y: bottom + 4, className: "piu-chart-muted", "text-anchor": "end" }, format(sourceMin, 2)));
    var fitLeft = panels[1].x + 42;
    var fitRight = panels[1].x + panels[1].w - 16;
    var fitTop = 56;
    var fitBottom = 252;
    var fitX = function (value) { return fitLeft + (fitRight - fitLeft) * value; };
    var allFitValues = result.data.concat(result.fitted, result.predictive.lower, result.predictive.upper);
    var minFit = Math.min.apply(null, allFitValues) - 0.05;
    var maxFit = Math.max.apply(null, allFitValues) + 0.05;
    var fitY = function (value) { return fitBottom - (fitBottom - fitTop) * (value - minFit) / (maxFit - minFit); };
    svg.appendChild(svgElement(doc, "text", { x: panels[1].x + 14, y: 42, className: "piu-chart-title" }, "传感器 y：观测、预测与 95% 后验预测带"));
    svg.appendChild(svgElement(doc, "line", { x1: fitLeft, y1: fitBottom, x2: fitRight, y2: fitBottom, className: "piu-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: fitLeft, y1: fitTop, x2: fitLeft, y2: fitBottom, className: "piu-axis" }));
    var fitBand = result.fitted.map(function (_, index) { return (index ? "L" : "M") + fitX(sensorGrid(index)).toFixed(2) + " " + fitY(result.predictive.upper[index]).toFixed(2); }).join(" ") + " " + result.fitted.map(function (_, reverse) { var index = result.fitted.length - 1 - reverse; return "L" + fitX(sensorGrid(index)).toFixed(2) + " " + fitY(result.predictive.lower[index]).toFixed(2); }).join(" ") + " Z";
    svg.appendChild(svgElement(doc, "path", { d: fitBand, className: "piu-band" }));
    svg.appendChild(svgElement(doc, "path", { d: result.fitted.map(function (value, index) { return (index ? "L" : "M") + fitX(sensorGrid(index)).toFixed(2) + " " + fitY(value).toFixed(2); }).join(" "), className: "piu-fit" }));
    result.data.forEach(function (value, index) { svg.appendChild(svgElement(doc, "circle", { cx: fitX(sensorGrid(index)), cy: fitY(value), r: 3.5, className: "piu-data" })); });
    svg.appendChild(svgElement(doc, "text", { x: fitRight, y: fitBottom + 22, className: "piu-chart-muted", "text-anchor": "end" }, "传感器位置"));
    var curveLeft = 60;
    var curveRight = 870;
    var curveTop = 360;
    var curveBottom = 570;
    var curveRoughness = curve.map(function (row) { return Math.max(1e-12, row.regularizationSeminorm); });
    var curveResiduals = curve.map(function (row) { return Math.max(1e-12, row.residualNorm); });
    var minLogRoughness = Math.min.apply(null, curveRoughness.map(Math.log));
    var maxLogRoughness = Math.max.apply(null, curveRoughness.map(Math.log));
    var minLogResidual = Math.min.apply(null, curveResiduals.map(Math.log));
    var maxLogResidual = Math.max.apply(null, curveResiduals.map(Math.log));
    var roughnessLogSpan = Math.max(1e-9, maxLogRoughness - minLogRoughness);
    var residualLogSpan = Math.max(1e-9, maxLogResidual - minLogResidual);
    var curveX = function (value) { return curveLeft + (curveRight - curveLeft) * (Math.log(Math.max(1e-12, value)) - minLogRoughness) / roughnessLogSpan; };
    var curveY = function (value) { return curveBottom - (curveBottom - curveTop) * (Math.log(Math.max(1e-12, value)) - minLogResidual) / residualLogSpan; };
    svg.appendChild(svgElement(doc, "text", { x: 32, y: 348, className: "piu-chart-title" }, "L 曲线：log 残差范数 vs log 正则化半范数"));
    svg.appendChild(svgElement(doc, "line", { x1: curveLeft, y1: curveBottom, x2: curveRight, y2: curveBottom, className: "piu-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: curveLeft, y1: curveTop, x2: curveLeft, y2: curveBottom, className: "piu-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: curve.map(function (row, index) { return (index ? "L" : "M") + curveX(row.regularizationSeminorm).toFixed(2) + " " + curveY(row.residualNorm).toFixed(2); }).join(" "), className: "piu-lcurve" }));
    curve.forEach(function (row) { svg.appendChild(svgElement(doc, "circle", { cx: curveX(row.regularizationSeminorm), cy: curveY(row.residualNorm), r: 3.5, fill: "var(--piu-red)" })); });
    svg.appendChild(svgElement(doc, "text", { x: curveRight, y: curveBottom + 23, className: "piu-chart-muted", "text-anchor": "end" }, "log ||Dx||₂"));
    svg.appendChild(svgElement(doc, "text", { x: curveLeft, y: curveTop - 10, className: "piu-chart-muted" }, "log ||Kx−y||₂"));
    svg.appendChild(svgElement(doc, "text", { x: curveRight, y: curveTop + 14, className: "piu-chart-muted", "text-anchor": "end" }, "当前 λ=" + format(result.config.lambda, 4) + "；||Dx||₂=" + format(result.regularizationSeminorm, 4)));
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "piu-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function renderTable(doc, hostNode, curve) {
    clear(hostNode);
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "L 曲线只是诊断工具：横轴为 log ||Dx||₂，纵轴为 log ||Kx−y||₂；它不自动选出唯一真值。" }));
    var head = element(doc, "tr", {});
    ["λ", "残差范数 ||Kx−y||₂", "正则化半范数 ||Dx||₂", "源粗糙度"].forEach(function (label) { head.appendChild(element(doc, "th", { scope: "col", text: label })); });
    table.appendChild(element(doc, "thead", {}, [head]));
    var body = element(doc, "tbody", {});
    curve.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [
      element(doc, "td", { text: format(row.lambda, 4) }),
      element(doc, "td", { text: format(row.residualNorm, 4) }),
      element(doc, "td", { text: format(row.regularizationSeminorm, 4) }),
      element(doc, "td", { text: format(row.roughness, 4) })
    ])); });
    table.appendChild(body);
    hostNode.appendChild(table);
  }

  function mount(rootNode, api) {
    var doc = rootNode && rootNode.ownerDocument;
    if (!doc) return;
    installStyles(doc);
    var prefix = "piu-" + Math.floor(Math.random() * 1000000);
    var state = { revealed: false, predictions: {}, config: { lambda: DEFAULTS.lambda, sigma: DEFAULTS.sigma, draws: DEFAULTS.draws, seed: DEFAULTS.seed } };
    var questions = [
      { key: "noise", prompt: "为什么直接求逆会放大传感器噪声？", answer: "small", choices: [{ value: "small", label: "小奇异值方向被放大" }, { value: "large", label: "大奇异值自动消失" }, { value: "none", label: "求逆不会放大" }] },
      { key: "lambda", prompt: "增大 Tikhonov λ 的直接代价是什么？", answer: "bias", choices: [{ value: "bias", label: "更平滑但可能有偏" }, { value: "none", label: "拟合和粗糙度都不变" }, { value: "noise", label: "噪声必然增大" }] },
      { key: "posterior", prompt: "后验预测区间主要检查什么？", answer: "data", choices: [{ value: "data", label: "模型能否生成类似观测" }, { value: "truth", label: "直接证明隐藏源项真值" }, { value: "lambda", label: "自动选择 λ" }] },
      { key: "fit", prompt: "观测拟合很好是否足以证明源项重建正确？", answer: "no", choices: [{ value: "yes", label: "是，残差小就够了" }, { value: "no", label: "否，还要看先验与不确定度" }, { value: "always", label: "只要点数多就够了" }] }
    ];
    var gate = element(doc, "section", { className: "piu-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(doc, "h3", { id: prefix + "-gate-title", text: "预测门：拟合得上，不等于看见了唯一真相" }));
    gate.appendChild(element(doc, "p", { className: "piu-note", text: "先判断病态放大、正则化偏差和后验预测的证据等级；提交后才显示源项、传感器带和 L 曲线。" }));
    questions.forEach(function (question) {
      var field = element(doc, "fieldset", {});
      field.appendChild(element(doc, "legend", { text: question.prompt }));
      var choices = element(doc, "div", { className: "piu-choice-grid", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; question.choices.forEach(function (item) { item.button.setAttribute("aria-pressed", item === choice ? "true" : "false"); }); });
        choice.button = button;
        choices.appendChild(button);
      });
      field.appendChild(choices);
      gate.appendChild(field);
    });
    var actions = element(doc, "div", { className: "piu-actions" });
    var reveal = element(doc, "button", { type: "button", className: "piu-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    gate.appendChild(actions);
    var feedback = element(doc, "p", { className: "piu-feedback", "aria-live": "polite", text: "" });
    gate.appendChild(feedback);

    var stage = element(doc, "section", { className: "piu-revealed", hidden: true, "aria-labelledby": prefix + "-result-title" });
    stage.appendChild(element(doc, "h4", { id: prefix + "-result-title", text: "揭示实验：源项、观测拟合与后验预测" }));
    stage.appendChild(element(doc, "p", { className: "piu-note", text: "前向模型 y=Kx+ε：K 是宽度 0.14 的归一化高斯扩散核；x 用 16 个源格点表示。PPC 对每个后验 x* 都以同一个 Kx* 计算观测与复制的标准化平方残差；L 曲线画 log ||Kx−y||₂ 对 log ||Dx||₂。" }));
    var controls = element(doc, "div", { className: "piu-controls" });
    var lambdaExponent = Math.log(state.config.lambda) / Math.LN10;
    var lambdaOutput = element(doc, "output", { text: format(state.config.lambda, 4) });
    var lambdaInput = element(doc, "input", { type: "range", min: "-5", max: "2", step: "0.05", value: String(lambdaExponent), "aria-label": "正则化强度 lambda" });
    lambdaInput.addEventListener("input", function () { state.config.lambda = Math.pow(10, Number(lambdaInput.value)); lambdaOutput.textContent = format(state.config.lambda, 4); });
    controls.appendChild(element(doc, "div", { className: "piu-control" }, [element(doc, "label", {}, ["正则化 λ = ", lambdaOutput]), lambdaInput]));
    var sigmaOutput = element(doc, "output", { text: format(state.config.sigma, 3) });
    var sigmaInput = element(doc, "input", { type: "range", min: "0.01", max: "0.2", step: "0.005", value: String(state.config.sigma), "aria-label": "观测噪声 sigma" });
    sigmaInput.addEventListener("input", function () { state.config.sigma = Number(sigmaInput.value); sigmaOutput.textContent = format(state.config.sigma, 3); });
    controls.appendChild(element(doc, "div", { className: "piu-control" }, [element(doc, "label", {}, ["噪声 σ = ", sigmaOutput]), sigmaInput]));
    var run = element(doc, "button", { type: "button", className: "piu-primary", text: "重算后验" });
    controls.appendChild(element(doc, "div", { className: "piu-control" }, [element(doc, "label", { text: "固定种子 " + DEFAULTS.seed }), run]));
    stage.appendChild(controls);
    var metrics = element(doc, "div", { className: "piu-metrics", "aria-label": "逆问题诊断" });
    stage.appendChild(metrics);
    var frame = element(doc, "div", { className: "piu-chart-frame" });
    var chart = svgElement(doc, "svg", {});
    frame.appendChild(chart);
    stage.appendChild(frame);
    var tableHost = element(doc, "div", { className: "piu-table-wrap" });
    stage.appendChild(tableHost);
    rootNode.replaceChildren(gate, stage);

    function renderResult() {
      var result = analyze(state.config);
      var curve = lCurve(state.config.sigma);
      metrics.replaceChildren(
        metric(doc, "数据残差 RMS", format(result.residualRms, 4)),
        metric(doc, "源项 RMSE", format(result.sourceRmse, 4)),
        metric(doc, "源粗糙度", format(result.roughness, 4)),
        metric(doc, "95% 带覆盖", result.predictive.coverage + "/" + SENSOR_COUNT),
        metric(doc, "PPC p 值（复制≥观测）", format(result.predictive.pValue, 3))
      );
      drawDashboard(doc, chart, result, curve);
      renderTable(doc, tableHost, curve);
      return result;
    }

    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) { feedback.textContent = "请先完成四个预测。"; feedback.className = "piu-feedback piu-warn"; return; }
      state.revealed = true;
      stage.hidden = false;
      var result = renderResult();
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.answer; }).length;
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中；后验预测带覆盖 " + result.predictive.coverage + "/" + SENSOR_COUNT + " 个观测，PPC p 值（复制≥观测）为 " + format(result.predictive.pValue, 3) + "。";
      feedback.className = "piu-feedback " + (correct === questions.length ? "piu-pass" : "piu-warn");
      announce(api, rootNode, feedback.textContent);
    });
    run.addEventListener("click", function () { if (state.revealed) { var result = renderResult(); announce(api, rootNode, "后验已重算；数据残差 RMS 为 " + format(result.residualRms, 4) + "。"); } });
    reset.addEventListener("click", function () {
      state.revealed = false;
      state.predictions = {};
      state.config = { lambda: DEFAULTS.lambda, sigma: DEFAULTS.sigma, draws: DEFAULTS.draws, seed: DEFAULTS.seed };
      lambdaInput.value = String(Math.log(DEFAULTS.lambda) / Math.LN10);
      sigmaInput.value = String(DEFAULTS.sigma);
      lambdaOutput.textContent = format(DEFAULTS.lambda, 4);
      sigmaOutput.textContent = format(DEFAULTS.sigma, 3);
      stage.hidden = true;
      feedback.textContent = "已重置；答案与逆问题证据再次隐藏。";
      feedback.className = "piu-feedback";
      questions.forEach(function (question) { question.choices.forEach(function (choice) { choice.button.setAttribute("aria-pressed", "false"); }); });
      announce(api, rootNode, "逆问题预测与实验已重置。");
    });
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var data = observedData(0.05);
    check(data.length === SENSOR_COUNT && data.every(isFinite), "deterministic sensor data");
    var result = analyze({ lambda: 0.03, sigma: 0.05, draws: 60, seed: 123 });
    check(result.mean.length === SIZE && result.fitted.length === SENSOR_COUNT, "posterior dimensions");
    check(result.residualRms >= 0 && result.roughness >= 0 && result.sourceRmse >= 0, "nonnegative diagnostics");
    check(result.predictive.coverage >= 0 && result.predictive.coverage <= SENSOR_COUNT, "posterior predictive coverage range");
    check(result.predictive.pValue >= 0 && result.predictive.pValue <= 1, "posterior predictive p-value range");
    check(result.predictive.discrepancyPercentile >= 0 && result.predictive.discrepancyPercentile <= 1, "posterior predictive percentile range");
    check(result.predictive.observedDiscrepancies.length === 60 && result.predictive.replicatedDiscrepancies.length === 60, "paired posterior predictive discrepancies");
    var defaultResult = analyze();
    check(defaultResult.predictive.pValue > 0, "default PPC p-value is not the old zero-percentile flaw");
    var repeat = analyze({ lambda: 0.03, sigma: 0.05, draws: 60, seed: 123 });
    check(JSON.stringify(result) === JSON.stringify(repeat), "seeded posterior predictive check is reproducible");
    var weak = analyze({ lambda: 0.0001, sigma: 0.05, draws: 40, seed: 123 });
    var strong = analyze({ lambda: 10, sigma: 0.05, draws: 40, seed: 123 });
    check(strong.roughness < weak.roughness, "stronger regularization smooths the source");
    check(strong.covariance[0][0] < weak.covariance[0][0], "regularization reduces posterior variance");
    var curve = lCurve(0.05);
    check(curve.length === L_CURVE_LAMBDAS.length && curve[0].lambda === 0.00001 && curve[curve.length - 1].lambda === 100, "regularization curve covers allowed lambda range");
    check(curve.every(function (row) { return row.residualNorm > 0 && row.regularizationSeminorm > 0 && isFinite(row.residualNorm) && isFinite(row.regularizationSeminorm); }), "L-curve norms are positive and finite");
    check(curve[0].regularizationSeminorm > curve[curve.length - 1].regularizationSeminorm && curve[0].residualNorm < curve[curve.length - 1].residualNorm, "L-curve has the expected regularization tradeoff");
    check(near(matrixVector([[1, 2], [3, 4]], [2, 1])[0], 4, 1e-12), "matrix-vector primitive");
    return { checks: checks };
  }

  return {
    LAB_ID: LAB_ID,
    DEFAULTS: DEFAULTS,
    kernel: KERNEL,
    observedData: observedData,
    analyze: analyze,
    lCurve: lCurve,
    mount: mount,
    selfTest: selfTest
  };
});
