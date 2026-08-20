(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("random-matrix-norm", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "random-matrix-norm self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("random-matrix-norm self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : this,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "random-matrix-norm-lab-styles";
    var MAX_DIM = 8;
    var ANGLE_STEPS = 24;
    var DEFAULT_ITERATIONS = 18;

    var PRESETS = [
      {
        id: "gaussian",
        label: "Gaussian iid",
        object: "rectangular",
        distribution: "gaussian",
        m: 5,
        n: 4,
        seed: 20260722,
        iterations: DEFAULT_ITERATIONS
      },
      {
        id: "rademacher",
        label: "Rademacher iid",
        object: "rectangular",
        distribution: "rademacher",
        m: 5,
        n: 4,
        seed: 20260722,
        iterations: DEFAULT_ITERATIONS
      },
      {
        id: "wigner",
        label: "Wigner",
        object: "wigner",
        distribution: "gaussian",
        m: 6,
        n: 6,
        seed: 20260723,
        iterations: DEFAULT_ITERATIONS
      },
      {
        id: "covariance",
        label: "Sample covariance",
        object: "covariance",
        distribution: "gaussian",
        m: 8,
        n: 4,
        seed: 20260724,
        iterations: DEFAULT_ITERATIONS
      },
      {
        id: "correlated",
        label: "Correlated / low-rank",
        object: "correlated",
        distribution: "gaussian",
        m: 6,
        n: 4,
        seed: 20260725,
        iterations: DEFAULT_ITERATIONS
      },
      {
        id: "heavy-tail",
        label: "Heavy tail",
        object: "rectangular",
        distribution: "heavy-tail",
        m: 6,
        n: 4,
        seed: 20260726,
        iterations: DEFAULT_ITERATIONS
      }
    ];

    var QUESTIONS = [
      {
        id: "grid",
        prompt: "有限方向网格的最大值与算子范数？",
        options: [
          { id: "lower", label: "不超过，但不一定相等" },
          { id: "equal", label: "必然相等" },
          { id: "upper", label: "可以超过" }
        ],
        answer: "lower"
      },
      {
        id: "scale",
        prompt: "sqrt(m)+sqrt(n) 应该怎样读？",
        options: [
          { id: "high-probability", label: "iid 次高斯的高概率尺度" },
          { id: "deterministic", label: "一次样本的确定上界" },
          { id: "universal", label: "相关/重尾也无条件成立" }
        ],
        answer: "high-probability"
      },
      {
        id: "objects",
        prompt: "Wigner、矩形 iid、sample covariance 的谱结论？",
        options: [
          { id: "separate", label: "对象与归一化决定各自结论" },
          { id: "mix", label: "半圆律、MP、范数可以互换" },
          { id: "sample", label: "一次样本即可证明渐近定理" }
        ],
        answer: "separate"
      }
    ];

    var STYLE_TEXT = [
      ".rmn-lab{--rmn-blue:var(--cl-blue,#315f9d);--rmn-gold:var(--cl-gold,#9b6a12);--rmn-green:var(--cl-green,#39734d);--rmn-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      ".rmn-lab *,.rmn-lab *::before,.rmn-lab *::after{box-sizing:border-box}.rmn-lab [hidden]{display:none!important}.rmn-lab h3,.rmn-lab h4{margin:0;color:var(--fg);letter-spacing:0}.rmn-lab h3{font-size:1.16rem}.rmn-lab h4{font-size:1rem}",
      ".rmn-lab .rmn-note,.rmn-lab .rmn-feedback,.rmn-lab .rmn-detail{color:var(--fg-soft);font-size:13px;line-height:1.7}.rmn-lab .rmn-note{margin:8px 0}.rmn-lab .rmn-feedback{min-height:2em;margin:9px 0 0;font-weight:700}.rmn-lab .rmn-pass{color:var(--rmn-green)}.rmn-lab .rmn-warn{color:var(--rmn-red)}",
      ".rmn-lab button,.rmn-lab input{font:inherit}.rmn-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.rmn-lab button:hover{border-color:var(--accent)}.rmn-lab button:focus-visible,.rmn-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.rmn-lab button[aria-pressed=true],.rmn-lab button.rmn-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.rmn-lab button:disabled{cursor:not-allowed;opacity:.55}",
      ".rmn-lab .rmn-preset-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}.rmn-lab .rmn-preset-grid button{font-size:12px}.rmn-lab .rmn-control-row{display:grid;grid-template-columns:minmax(180px,.8fr) minmax(0,1.2fr);gap:10px;align-items:center;margin:11px 0;padding:10px 12px;border:1px solid var(--border);background:var(--bg)}.rmn-lab .rmn-control-row label{color:var(--fg-soft);font-size:13px;font-weight:700}.rmn-lab .rmn-control-row output{color:var(--accent);font-variant-numeric:tabular-nums}.rmn-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
      ".rmn-lab .rmn-prediction{margin-top:13px;padding:12px 14px;border-left:3px solid var(--rmn-gold);background:var(--bg)}.rmn-lab fieldset{min-width:0;margin:0 0 12px;padding:0;border:0}.rmn-lab legend{max-width:100%;margin-bottom:8px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.55}.rmn-lab .rmn-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.rmn-lab .rmn-choice-grid button{font-size:12px}.rmn-lab .rmn-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.rmn-lab .rmn-actions>*{flex:1 1 170px}",
      ".rmn-lab .rmn-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.rmn-lab .rmn-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin:12px 0}.rmn-lab .rmn-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.rmn-lab .rmn-metric:nth-child(4n+1){border-top-color:var(--rmn-blue)}.rmn-lab .rmn-metric:nth-child(4n+2){border-top-color:var(--rmn-gold)}.rmn-lab .rmn-metric:nth-child(4n+3){border-top-color:var(--rmn-green)}.rmn-lab .rmn-metric:nth-child(4n){border-top-color:var(--rmn-red)}.rmn-lab .rmn-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.rmn-lab .rmn-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".rmn-lab .rmn-status{margin:10px 0;padding:10px 12px;border-left:3px solid var(--rmn-green);background:var(--bg);font-size:13px;line-height:1.7}.rmn-lab .rmn-status.rmn-boundary{border-left-color:var(--rmn-red)}.rmn-lab .rmn-status.rmn-caution{border-left-color:var(--rmn-gold)}.rmn-lab .rmn-chart-frame{min-width:0;margin-top:12px;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow:hidden}.rmn-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.rmn-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.rmn-lab .rmn-grid{stroke:currentColor;stroke-opacity:.16;stroke-width:1}.rmn-lab .rmn-axis{stroke:currentColor;stroke-opacity:.65;stroke-width:1.2}.rmn-lab .rmn-point-line{fill:none;stroke:var(--rmn-blue);stroke-width:2}.rmn-lab .rmn-point{fill:var(--rmn-blue);stroke:var(--bg);stroke-width:1.2}.rmn-lab .rmn-exact-line{stroke:var(--rmn-red);stroke-width:2;stroke-dasharray:7 4}.rmn-lab .rmn-grid-line{stroke:var(--rmn-gold);stroke-width:1.7;stroke-dasharray:3 4}.rmn-lab .rmn-bar-exact{fill:var(--rmn-red)}.rmn-lab .rmn-bar-power{fill:var(--rmn-blue)}.rmn-lab .rmn-bar-scale{fill:var(--rmn-gold)}.rmn-lab .rmn-chart-title{font-size:13px;font-weight:750}.rmn-lab .rmn-chart-label{font-size:10.5px}.rmn-lab .rmn-chart-note{fill:var(--fg-soft);font-size:10px}",
      ".rmn-lab .rmn-matrix-section{margin-top:14px}.rmn-lab .rmn-matrix-scroll{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--border);background:var(--bg)}.rmn-lab table{border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.rmn-lab th,.rmn-lab td{padding:6px 8px;border-bottom:1px solid var(--border);text-align:right;white-space:nowrap}.rmn-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.rmn-lab td:first-child,.rmn-lab th:first-child{text-align:left}.rmn-lab .rmn-detail{margin:10px 0;padding:9px 11px;border-left:3px solid var(--rmn-blue);background:var(--bg)}.rmn-lab .rmn-detail.rmn-boundary{border-left-color:var(--rmn-red)}.rmn-lab .rmn-detail strong{color:var(--fg)}",
      "@media(max-width:760px){.rmn-lab .rmn-preset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.rmn-lab .rmn-choice-grid{grid-template-columns:minmax(0,1fr)}.rmn-lab .rmn-control-row{grid-template-columns:minmax(0,1fr);gap:4px}}@media(max-width:420px){.rmn-lab .rmn-preset-grid{grid-template-columns:minmax(0,1fr)}.rmn-lab .rmn-prediction{padding:10px}.rmn-lab .rmn-chart-frame{padding:4px}.rmn-lab table{font-size:11.5px}.rmn-lab th,.rmn-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.rmn-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function near(left, right, tolerance) {
      return Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right));
    }

    function clampInteger(value, minimum, maximum, fallback) {
      var parsed = Number(value);
      if (!finite(parsed)) parsed = fallback;
      return Math.max(minimum, Math.min(maximum, Math.round(parsed)));
    }

    function copyMatrix(matrix) {
      return matrix.map(function (row) { return row.slice(); });
    }

    function zeroMatrix(rows, columns) {
      var matrix = [];
      for (var row = 0; row < rows; row += 1) {
        matrix.push(Array.apply(null, Array(columns)).map(function () { return 0; }));
      }
      return matrix;
    }

    function dot(left, right) {
      var total = 0;
      for (var index = 0; index < left.length; index += 1) total += left[index] * right[index];
      return total;
    }

    function norm(vector) {
      return Math.sqrt(Math.max(0, dot(vector, vector)));
    }

    function normalizeVector(vector) {
      var length = norm(vector);
      if (!(length > 0)) return vector.map(function () { return 0; });
      return vector.map(function (value) { return value / length; });
    }

    function matrixVector(matrix, vector) {
      return matrix.map(function (row) { return dot(row, vector); });
    }

    function transposeGram(matrix) {
      var rows = matrix.length;
      var columns = rows ? matrix[0].length : 0;
      var gram = zeroMatrix(columns, columns);
      for (var row = 0; row < rows; row += 1) {
        for (var left = 0; left < columns; left += 1) {
          for (var right = left; right < columns; right += 1) {
            gram[left][right] += matrix[row][left] * matrix[row][right];
          }
        }
      }
      for (var i = 0; i < columns; i += 1) {
        for (var j = i + 1; j < columns; j += 1) gram[j][i] = gram[i][j];
      }
      return gram;
    }

    function createRng(seed) {
      var state = (Number(seed) >>> 0) || 0x6d2b79f5;
      var spare = null;
      return {
        next: function () {
          state = (Math.imul(1664525, state) + 1013904223) >>> 0;
          return state / 4294967296;
        },
        normal: function () {
          if (spare !== null) {
            var saved = spare;
            spare = null;
            return saved;
          }
          var first = Math.max(this.next(), 1e-12);
          var second = this.next();
          var radius = Math.sqrt(-2 * Math.log(first));
          spare = radius * Math.sin(2 * Math.PI * second);
          return radius * Math.cos(2 * Math.PI * second);
        }
      };
    }

    function drawValue(rng, distribution) {
      if (distribution === "rademacher") return rng.next() < 0.5 ? -1 : 1;
      if (distribution === "heavy-tail") {
        var uniform = Math.max(rng.next(), 1e-12);
        var magnitude = Math.pow(1 - uniform, -1 / 1.5);
        return (rng.next() < 0.5 ? -1 : 1) * 0.75 * magnitude;
      }
      return rng.normal();
    }

    function presetById(id) {
      for (var index = 0; index < PRESETS.length; index += 1) {
        if (PRESETS[index].id === id) return PRESETS[index];
      }
      return PRESETS[0];
    }

    function normalizeSpec(input) {
      var raw = input || {};
      var preset = presetById(raw.presetId || raw.id || "gaussian");
      var object = raw.object || preset.object;
      var distribution = raw.distribution || preset.distribution;
      if (["rectangular", "wigner", "covariance", "correlated"].indexOf(object) < 0) object = preset.object;
      if (["gaussian", "rademacher", "heavy-tail"].indexOf(distribution) < 0) distribution = preset.distribution;
      if (object === "heavy-tail") distribution = "heavy-tail";
      var m = clampInteger(raw.m === undefined ? preset.m : raw.m, 2, MAX_DIM, preset.m);
      var n = clampInteger(raw.n === undefined ? preset.n : raw.n, 2, MAX_DIM, preset.n);
      if (object === "wigner") m = n;
      var rawSeed = raw.seed === undefined ? preset.seed : Number(raw.seed);
      var seed = finite(rawSeed) ? rawSeed >>> 0 : preset.seed;
      return {
        presetId: preset.id,
        object: object,
        distribution: distribution,
        m: m,
        n: n,
        seed: seed,
        iterations: clampInteger(
          raw.iterations === undefined ? preset.iterations : raw.iterations,
          4,
          32,
          DEFAULT_ITERATIONS
        )
      };
    }

    function generateMatrix(spec) {
      var rng = createRng(spec.seed);
      var row;
      var column;
      var matrix;
      var source;

      if (spec.object === "wigner") {
        matrix = zeroMatrix(spec.n, spec.n);
        var wignerScale = 1 / Math.sqrt(spec.n);
        for (row = 0; row < spec.n; row += 1) {
          for (column = row; column < spec.n; column += 1) {
            var wignerValue = drawValue(rng, spec.distribution) * wignerScale;
            matrix[row][column] = wignerValue;
            matrix[column][row] = wignerValue;
          }
        }
        return { matrix: matrix, source: matrix };
      }

      if (spec.object === "covariance") {
        source = zeroMatrix(spec.m, spec.n);
        for (row = 0; row < spec.m; row += 1) {
          for (column = 0; column < spec.n; column += 1) {
            source[row][column] = drawValue(rng, spec.distribution);
          }
        }
        matrix = transposeGram(source).map(function (gramRow) {
          return gramRow.map(function (value) { return value / spec.m; });
        });
        return { matrix: matrix, source: source };
      }

      matrix = zeroMatrix(spec.m, spec.n);
      if (spec.object === "correlated") {
        var common = [];
        for (row = 0; row < spec.m; row += 1) common.push(1 + 0.15 * rng.normal());
        for (row = 0; row < spec.m; row += 1) {
          for (column = 0; column < spec.n; column += 1) {
            matrix[row][column] = common[row] + 0.12 * rng.normal();
          }
        }
      } else {
        for (row = 0; row < spec.m; row += 1) {
          for (column = 0; column < spec.n; column += 1) {
            matrix[row][column] = drawValue(rng, spec.distribution);
          }
        }
      }
      return { matrix: matrix, source: matrix };
    }

    /* Jacobi is deliberately limited to the small symmetric matrices made here. */
    function smallSymmetricEigenvalues(input) {
      var matrix = copyMatrix(input);
      var size = matrix.length;
      var limit = Math.max(12, 12 * size * size);
      for (var sweep = 0; sweep < limit; sweep += 1) {
        var p = 0;
        var q = 0;
        var largest = 0;
        for (var row = 0; row < size; row += 1) {
          for (var column = row + 1; column < size; column += 1) {
            if (Math.abs(matrix[row][column]) > largest) {
              largest = Math.abs(matrix[row][column]);
              p = row;
              q = column;
            }
          }
        }
        if (largest < 1e-13) break;
        var app = matrix[p][p];
        var aqq = matrix[q][q];
        var apq = matrix[p][q];
        var tau = (aqq - app) / (2 * apq);
        var t = tau === 0 ? 1 : (tau < 0 ? -1 : 1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
        var cosine = 1 / Math.sqrt(1 + t * t);
        var sine = t * cosine;
        for (var index = 0; index < size; index += 1) {
          if (index === p || index === q) continue;
          var indexP = matrix[index][p];
          var indexQ = matrix[index][q];
          matrix[index][p] = cosine * indexP - sine * indexQ;
          matrix[p][index] = matrix[index][p];
          matrix[index][q] = sine * indexP + cosine * indexQ;
          matrix[q][index] = matrix[index][q];
        }
        matrix[p][p] = app - t * apq;
        matrix[q][q] = aqq + t * apq;
        matrix[p][q] = 0;
        matrix[q][p] = 0;
      }
      var eigenvalues = matrix.map(function (row, index) { return row[index]; });
      eigenvalues.sort(function (left, right) { return right - left; });
      return eigenvalues;
    }

    function powerIteration(target, iterations) {
      var size = target.length;
      var vector = normalizeVector(Array.apply(null, Array(size)).map(function (_, index) {
        return 1 + index / size;
      }));
      var step;
      for (step = 0; step < iterations; step += 1) {
        vector = normalizeVector(matrixVector(target, vector));
      }
      var image = matrixVector(target, vector);
      return {
        iterations: iterations,
        vector: vector,
        rayleigh: dot(vector, image)
      };
    }

    function directionGrid(size) {
      var directions = [];
      for (var axis = 0; axis < size; axis += 1) {
        var coordinate = Array.apply(null, Array(size)).map(function () { return 0; });
        coordinate[axis] = 1;
        directions.push(coordinate);
      }
      for (var left = 0; left < size; left += 1) {
        for (var right = left + 1; right < size; right += 1) {
          for (var step = 0; step < ANGLE_STEPS; step += 1) {
            var angle = (2 * Math.PI * step) / ANGLE_STEPS;
            var direction = Array.apply(null, Array(size)).map(function () { return 0; });
            direction[left] = Math.cos(angle);
            direction[right] = Math.sin(angle);
            directions.push(direction);
          }
        }
      }
      return directions;
    }

    function referenceScale(spec) {
      if (spec.object === "wigner") {
        return {
          value: 2,
          label: "Wigner edge ~ 2",
          valid: spec.distribution !== "heavy-tail",
          note: "Wigner uses symmetric 1/sqrt(n) normalization; the semicircle edge is the comparison."
        };
      }
      if (spec.object === "covariance") {
        return {
          value: Math.pow(1 + Math.sqrt(spec.n / spec.m), 2),
          label: "MP upper edge",
          valid: spec.distribution !== "heavy-tail",
          note: "For S = X^T X / m, MP's upper edge is (1 + sqrt(n/m))^2 in the iid regime."
        };
      }
      return {
        value: Math.sqrt(spec.m) + Math.sqrt(spec.n),
        label: spec.object === "correlated" ? "iid reference sqrt(m)+sqrt(n)" : "sqrt(m)+sqrt(n)",
        valid: spec.object !== "correlated" && spec.distribution !== "heavy-tail",
        note: "This is an iid subgaussian high-probability scale, not a deterministic bound for one sample."
      };
    }

    function distributionLabel(distribution) {
      if (distribution === "rademacher") return "Rademacher ±1";
      if (distribution === "heavy-tail") return "symmetric Pareto-like";
      return "Gaussian N(0,1)";
    }

    function objectLabel(object) {
      if (object === "wigner") return "Wigner 对称阵";
      if (object === "covariance") return "sample covariance S=XᵀX/m";
      if (object === "correlated") return "相关/低秩矩形阵";
      return "矩形 iid A";
    }

    function evaluate(input) {
      var spec = normalizeSpec(input);
      var generated = generateMatrix(spec);
      var matrix = generated.matrix;
      var target;
      var targetLabel;
      var operatorApply;
      var operatorNorm;
      var eigenvalues;
      var wignerEigenvalues = null;

      if (spec.object === "covariance") {
        target = matrix;
        targetLabel = "S";
        operatorApply = function (vector) { return matrixVector(matrix, vector); };
        eigenvalues = smallSymmetricEigenvalues(target);
        operatorNorm = Math.max(0, eigenvalues[0]);
      } else {
        target = transposeGram(matrix);
        targetLabel = "A^T A";
        operatorApply = function (vector) { return matrixVector(matrix, vector); };
        eigenvalues = smallSymmetricEigenvalues(target);
        operatorNorm = Math.sqrt(Math.max(0, eigenvalues[0]));
        if (spec.object === "wigner") wignerEigenvalues = smallSymmetricEigenvalues(matrix);
      }

      var directions = directionGrid(spec.n);
      var gridValues = directions.map(function (direction, index) {
        return {
          index: index,
          value: norm(operatorApply(direction))
        };
      });
      var rawGridMax = gridValues.reduce(function (maximum, item) {
        return Math.max(maximum, item.value);
      }, 0);
      var gridMax = rawGridMax;
      var power = powerIteration(target, spec.iterations);
      var powerNorm = spec.object === "covariance"
        ? Math.max(0, power.rayleigh)
        : Math.sqrt(Math.max(0, power.rayleigh));
      var scale = referenceScale(spec);
      var singularValues = eigenvalues.map(function (value) {
        return spec.object === "covariance" ? Math.max(0, value) : Math.sqrt(Math.max(0, value));
      });
      var rankThreshold = Math.max(1e-10, operatorNorm * 1e-8);
      var numericalRank = singularValues.filter(function (value) { return value > rankThreshold; }).length;
      var sourceNorm = null;
      if (spec.object === "covariance") {
        var sourceEigenvalues = smallSymmetricEigenvalues(transposeGram(generated.source));
        sourceNorm = Math.sqrt(Math.max(0, sourceEigenvalues[0]));
      }

      return {
        spec: spec,
        presetId: spec.presetId,
        object: spec.object,
        objectLabel: objectLabel(spec.object),
        distribution: spec.distribution,
        distributionLabel: distributionLabel(spec.distribution),
        m: spec.m,
        n: spec.n,
        seed: spec.seed,
        matrix: copyMatrix(matrix),
        source: generated.source ? copyMatrix(generated.source) : null,
        targetLabel: targetLabel,
        exactMethod: spec.object === "covariance" ? "eigenvalues of S" : "sqrt(lambda_max(A^T A))",
        eigenvalues: eigenvalues,
        singularValues: singularValues,
        operatorNorm: operatorNorm,
        powerNorm: powerNorm,
        powerRayleigh: power.rayleigh,
        powerIterations: power.iterations,
        powerVector: power.vector,
        gridValues: gridValues,
        gridCount: directions.length,
        gridMaxRaw: rawGridMax,
        gridMax: gridMax,
        gridGap: Math.max(0, operatorNorm - gridMax),
        referenceScale: scale.value,
        referenceScaleLabel: scale.label,
        referenceScaleValid: scale.valid,
        referenceScaleNote: scale.note,
        numericalRank: numericalRank,
        sourceNorm: sourceNorm,
        covarianceIdentity: sourceNorm === null ? null : sourceNorm * sourceNorm / spec.m,
        wignerEigenvalues: wignerEigenvalues,
        wignerEigenEdge: wignerEigenvalues === null
          ? null
          : wignerEigenvalues.reduce(function (maximum, value) { return Math.max(maximum, Math.abs(value)); }, 0)
      };
    }

    function format(value, digits) {
      if (value === Infinity) return "∞";
      if (value === -Infinity) return "-∞";
      if (!finite(value)) return "—";
      if (Math.abs(value) < 0.0005) return "0";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
      var text = value.toFixed(places);
      return text.replace(/0+$/, "").replace(/\.$/, "");
    }

    function setAttributes(node, attrs) {
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      return node;
    }

    function appendChildren(node, children) {
      if (children === undefined || children === null) return node;
      var list = Array.isArray(children) ? children : [children];
      list.forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
      });
      return node;
    }

    function element(doc, tag, className, children) {
      return appendChildren(setAttributes(doc.createElement(tag), { className: className }), children);
    }

    function svgNode(doc, tag, attrs, children) {
      return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children);
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function replace(node, children) {
      clear(node);
      appendChildren(node, children);
    }

    function installStyles(doc) {
      if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement || doc.body).appendChild(style);
    }

    function metric(doc, label, value) {
      return element(doc, "div", "rmn-metric", [
        element(doc, "span", "", label),
        element(doc, "strong", "", value)
      ]);
    }

    function chartText(doc, x, y, text, className, attrs) {
      var all = attrs || {};
      all.x = x;
      all.y = y;
      all.className = className || "rmn-chart-label";
      return svgNode(doc, "text", all, text);
    }

    function chartPath(points, xScale, yScale) {
      return points.map(function (point, index) {
        return (index === 0 ? "M" : "L") + xScale(point.index).toFixed(2) + " " + yScale(point.value).toFixed(2);
      }).join(" ");
    }

    function drawChart(doc, result) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 760 390",
        role: "img",
        "aria-label": "Finite direction grid and operator norm comparison"
      });
      svg.appendChild(svgNode(doc, "title", {}, "Operator norm ledger"));
      svg.appendChild(svgNode(doc, "desc", {}, "A finite direction grid is compared with the exact small-matrix operator norm and a power iteration estimate."));

      var left = { x: 22, y: 18, width: 350, height: 345 };
      var right = { x: 388, y: 18, width: 350, height: 345 };
      [left, right].forEach(function (panel) {
        svg.appendChild(svgNode(doc, "rect", {
          x: panel.x,
          y: panel.y,
          width: panel.width,
          height: panel.height,
          fill: "var(--bg)",
          stroke: "var(--border)",
          "stroke-width": 1
        }));
      });

      var plotLeft = left.x + 45;
      var plotRight = left.x + left.width - 16;
      var plotTop = left.y + 48;
      var plotBottom = left.y + left.height - 44;
      var maximum = Math.max(result.operatorNorm, result.referenceScale, result.powerNorm, 1e-9) * 1.12;
      var yScale = function (value) { return plotBottom - (value / maximum) * (plotBottom - plotTop); };
      var xScale = function (index) {
        return plotLeft + (index / Math.max(1, result.gridValues.length - 1)) * (plotRight - plotLeft);
      };
      for (var tick = 0; tick <= 4; tick += 1) {
        var y = plotBottom - (tick / 4) * (plotBottom - plotTop);
        svg.appendChild(svgNode(doc, "line", { x1: plotLeft, y1: y, x2: plotRight, y2: y, className: "rmn-grid" }));
        svg.appendChild(chartText(doc, plotLeft - 7, y + 4, format((tick / 4) * maximum, 2), "rmn-chart-label", { "text-anchor": "end" }));
      }
      svg.appendChild(svgNode(doc, "line", { x1: plotLeft, y1: plotTop, x2: plotLeft, y2: plotBottom, className: "rmn-axis" }));
      svg.appendChild(svgNode(doc, "line", { x1: plotLeft, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "rmn-axis" }));
      svg.appendChild(svgNode(doc, "path", { d: chartPath(result.gridValues, xScale, yScale), className: "rmn-point-line" }));
      result.gridValues.forEach(function (point) {
        svg.appendChild(svgNode(doc, "circle", { cx: xScale(point.index), cy: yScale(point.value), r: 2.5, className: "rmn-point" }));
      });
      svg.appendChild(svgNode(doc, "line", { x1: plotLeft, y1: yScale(result.operatorNorm), x2: plotRight, y2: yScale(result.operatorNorm), className: "rmn-exact-line" }));
      svg.appendChild(svgNode(doc, "line", { x1: plotLeft, y1: yScale(result.gridMax), x2: plotRight, y2: yScale(result.gridMax), className: "rmn-grid-line" }));
      svg.appendChild(chartText(doc, left.x + 12, left.y + 25, "Finite direction grid", "rmn-chart-title"));
      svg.appendChild(chartText(doc, left.x + left.width - 12, left.y + 25, "grid is not the sphere supremum", "rmn-chart-note", { "text-anchor": "end" }));
      svg.appendChild(chartText(doc, (plotLeft + plotRight) / 2, left.y + left.height - 12, "direction index", "rmn-chart-label", { "text-anchor": "middle" }));
      svg.appendChild(chartText(doc, left.x + 13, plotTop - 7, "||Av||_2", "rmn-chart-label"));
      svg.appendChild(chartText(doc, plotRight - 2, yScale(result.operatorNorm) - 6, "operator norm", "rmn-chart-label", { "text-anchor": "end" }));
      svg.appendChild(chartText(doc, plotRight - 2, yScale(result.gridMax) + 13, "grid max", "rmn-chart-label", { "text-anchor": "end" }));

      var barLeft = right.x + 54;
      var barRight = right.x + right.width - 16;
      var barTop = right.y + 62;
      var barBottom = right.y + right.height - 51;
      var values = [
        { label: "operator norm", value: result.operatorNorm, className: "rmn-bar-exact" },
        { label: "power", value: result.powerNorm, className: "rmn-bar-power" },
        { label: "reference scale", value: result.referenceScale, className: "rmn-bar-scale" }
      ];
      var barMaximum = Math.max(result.operatorNorm, result.powerNorm, result.referenceScale, 1e-9) * 1.12;
      var barY = function (value) { return barBottom - (value / barMaximum) * (barBottom - barTop); };
      for (var barTick = 0; barTick <= 4; barTick += 1) {
        var barLineY = barBottom - (barTick / 4) * (barBottom - barTop);
        svg.appendChild(svgNode(doc, "line", { x1: barLeft, y1: barLineY, x2: barRight, y2: barLineY, className: "rmn-grid" }));
        svg.appendChild(chartText(doc, barLeft - 7, barLineY + 4, format((barTick / 4) * barMaximum, 2), "rmn-chart-label", { "text-anchor": "end" }));
      }
      svg.appendChild(svgNode(doc, "line", { x1: barLeft, y1: barTop, x2: barLeft, y2: barBottom, className: "rmn-axis" }));
      svg.appendChild(svgNode(doc, "line", { x1: barLeft, y1: barBottom, x2: barRight, y2: barBottom, className: "rmn-axis" }));
      values.forEach(function (item, index) {
        var center = barLeft + 45 + index * 82;
        var barWidth = 44;
        svg.appendChild(svgNode(doc, "rect", {
          x: center - barWidth / 2,
          y: barY(item.value),
          width: barWidth,
          height: Math.max(0, barBottom - barY(item.value)),
          className: item.className
        }));
        svg.appendChild(chartText(doc, center, barBottom + 17, item.label, "rmn-chart-label", { "text-anchor": "middle" }));
        svg.appendChild(chartText(doc, center, barY(item.value) - 6, format(item.value, 2), "rmn-chart-label", { "text-anchor": "middle" }));
      });
      svg.appendChild(chartText(doc, right.x + 12, right.y + 25, "Scale check", "rmn-chart-title"));
      svg.appendChild(chartText(doc, right.x + right.width - 12, right.y + 25, result.referenceScaleLabel, "rmn-chart-note", { "text-anchor": "end" }));
      svg.appendChild(chartText(doc, right.x + 15, barTop - 8, "value", "rmn-chart-label"));
      return svg;
    }

    function matrixTable(doc, result) {
      var matrix = result.matrix;
      var table = element(doc, "table", "", []);
      var head = element(doc, "tr", "", [element(doc, "th", "", "")]);
      for (var column = 0; column < matrix[0].length; column += 1) {
        head.appendChild(element(doc, "th", "", "j" + (column + 1)));
      }
      table.appendChild(element(doc, "thead", "", [head]));
      var body = element(doc, "tbody", "", []);
      matrix.forEach(function (row, rowIndex) {
        var tr = element(doc, "tr", "", [element(doc, "th", "", "i" + (rowIndex + 1))]);
        row.forEach(function (value) {
          tr.appendChild(element(doc, "td", "", format(value, 2)));
        });
        body.appendChild(tr);
      });
      table.appendChild(body);
      return table;
    }

    function scaleStatus(result) {
      if (result.referenceScaleValid) {
        return "当前参考量是适用模型下的典型尺度；它是高概率/渐近语言，不是一次样本的确定上界。";
      }
      if (result.object === "correlated") {
        return "这里只把 sqrt(m)+sqrt(n) 留作 iid 对照；相关的低秩成分可能产生 sqrt(mn) 级主方向，所以不能引用 iid 结论。";
      }
      return "重尾预设只作失败边界诊断；Pareto-like 条目不满足本页的亚高斯假设，极端条目可能支配算子范数。";
    }

    function renderResults(doc, results, result) {
      replace(results, []);
      var exact = format(result.operatorNorm, 5);
      var power = format(result.powerNorm, 5);
      var grid = format(result.gridMax, 5);
      var powerError = format(Math.abs(result.powerNorm - result.operatorNorm), 4);
      results.appendChild(element(doc, "div", "rmn-metrics", [
        metric(doc, "对象", result.objectLabel),
        metric(doc, "固定 seed", String(result.seed)),
        metric(doc, "精确/双精度", exact),
        metric(doc, "power iteration", power),
        metric(doc, "有限网格 max", grid),
        metric(doc, "精确 - 网格", format(result.gridGap, 5)),
        metric(doc, "power 误差", powerError),
        metric(doc, "参考尺度", format(result.referenceScale, 4))
      ]));

      var statusClass = result.referenceScaleValid ? "rmn-status rmn-caution" : "rmn-status rmn-boundary";
      results.appendChild(element(doc, "p", statusClass, [
        "矩阵 " + result.m + "×" + result.n + "，条目/对象：" + result.distributionLabel + "；精确栏用 " + result.exactMethod + "。",
        " 网格 max = " + grid + " ≤ 算子范数 = " + exact + "；这是有限方向下界，不是单位球上确界。"
      ]));
      results.appendChild(element(doc, "div", "rmn-chart-frame", [drawChart(doc, result)]));

      var matrixSection = element(doc, "section", "rmn-matrix-section", [
        element(doc, "h4", "", "矩阵预览：" + (result.object === "covariance" ? "S = XᵀX/m" : result.object === "wigner" ? "W" : "A")),
        element(doc, "p", "rmn-note", result.object === "covariance"
          ? "表中显示的是样本协方差 S；底层 X 使用同一个固定 seed 生成。"
          : "表中显示的是实验实际取算子范数的矩阵；每次选择同一预设都会复现同一数值。"),
        element(doc, "div", "rmn-matrix-scroll", [matrixTable(doc, result)])
      ]);
      results.appendChild(matrixSection);

      var objectDetail;
      if (result.object === "wigner") {
        objectDetail = "Wigner 的双精度特征值范围约为 [" + format(result.wignerEigenvalues[result.wignerEigenvalues.length - 1], 3) + ", " + format(result.wignerEigenvalues[0], 3) + "]；这里的半圆律参照只属于对称、1/sqrt(n) 归一化对象，不是 MP。";
      } else if (result.object === "covariance") {
        objectDetail = "sample covariance 使用 S = XᵀX/m；本次还可核对 ||S|| = ||X||²/m = " + format(result.covarianceIdentity, 5) + "。MP 上边缘只是 iid 大维度参照。";
      } else {
        objectDetail = "矩形对象的 finite grid 在 S^(n−1) 中只取坐标轴与坐标二维平面的有限角度；它没有覆盖整个单位球，也没有自动提供 ε-网证书。";
      }
      results.appendChild(element(doc, "p", "rmn-detail", objectDetail));
      results.appendChild(element(doc, "p", "rmn-detail " + (result.referenceScaleValid ? "" : "rmn-boundary"), scaleStatus(result)));
    }

    function mount(rootElement, api) {
      if (!rootElement || !rootElement.ownerDocument) return;
      var doc = rootElement.ownerDocument;
      installStyles(doc);
      var state = normalizeSpec(PRESETS[0]);
      var predictions = {};
      var revealed = false;
      var shell = element(doc, "div", "rmn-lab", []);
      shell.appendChild(element(doc, "p", "rmn-note", "先选预设并预测，再揭示小矩阵账本；所有预设的 PRNG、seed 和初始 power 向量都是固定的。"));

      var presetGrid = element(doc, "div", "rmn-preset-grid", []);
      var presetButtons = [];
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", "", preset.label);
        button.type = "button";
        button.addEventListener("click", function () {
          state = normalizeSpec(preset);
          predictions = {};
          revealed = false;
          render();
        });
        presetButtons.push({ id: preset.id, node: button });
        presetGrid.appendChild(button);
      });
      shell.appendChild(presetGrid);

      var controlRow = element(doc, "div", "rmn-control-row", []);
      var controlLabel = element(doc, "label", "", ["power iteration 步数：", element(doc, "output", "", String(state.iterations))]);
      var iterationRange = element(doc, "input", "", []);
      iterationRange.type = "range";
      iterationRange.min = "4";
      iterationRange.max = "32";
      iterationRange.step = "1";
      iterationRange.setAttribute("aria-label", "power iteration steps");
      iterationRange.addEventListener("input", function () {
        state.iterations = clampInteger(iterationRange.value, 4, 32, DEFAULT_ITERATIONS);
        predictions = {};
        revealed = false;
        render();
      });
      controlRow.appendChild(controlLabel);
      controlRow.appendChild(iterationRange);
      shell.appendChild(controlRow);

      var predictionBox = element(doc, "div", "rmn-prediction", []);
      var choiceButtons = {};
      QUESTIONS.forEach(function (question) {
        var fieldset = element(doc, "fieldset", "", []);
        fieldset.appendChild(element(doc, "legend", "", question.prompt));
        var choices = element(doc, "div", "rmn-choice-grid", []);
        choiceButtons[question.id] = [];
        question.options.forEach(function (option) {
          var button = element(doc, "button", "", option.label);
          button.type = "button";
          button.addEventListener("click", function () {
            predictions[question.id] = option.id;
            revealed = false;
            render();
          });
          choiceButtons[question.id].push({ id: option.id, node: button });
          choices.appendChild(button);
        });
        fieldset.appendChild(choices);
        predictionBox.appendChild(fieldset);
      });
      var actions = element(doc, "div", "rmn-actions", []);
      var reveal = element(doc, "button", "rmn-primary", "揭示账本");
      var reset = element(doc, "button", "", "重置预测");
      reveal.type = "button";
      reset.type = "button";
      var feedback = element(doc, "p", "rmn-feedback", "每题先作一个预测。");
      reveal.addEventListener("click", function () {
        var missing = QUESTIONS.some(function (question) { return !predictions[question.id]; });
        if (missing) {
          feedback.textContent = "请先完成三个预测，再揭示账本。";
          feedback.className = "rmn-feedback rmn-warn";
          return;
        }
        revealed = true;
        render();
      });
      reset.addEventListener("click", function () {
        predictions = {};
        revealed = false;
        render();
      });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      predictionBox.appendChild(actions);
      predictionBox.appendChild(feedback);
      shell.appendChild(predictionBox);

      var results = element(doc, "div", "rmn-results", []);
      results.hidden = true;
      shell.appendChild(results);
      replace(rootElement, [shell]);

      function renderPrediction() {
        QUESTIONS.forEach(function (question) {
          choiceButtons[question.id].forEach(function (choice) {
            choice.node.setAttribute("aria-pressed", predictions[question.id] === choice.id ? "true" : "false");
          });
        });
      }

      function render() {
        iterationRange.value = String(state.iterations);
        controlLabel.querySelector("output").textContent = String(state.iterations);
        presetButtons.forEach(function (item) {
          item.node.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false");
        });
        renderPrediction();
        if (!revealed) {
          results.hidden = true;
          feedback.textContent = Object.keys(predictions).length
            ? "预测已记录，点击“揭示账本”查看数值。"
            : "每题先作一个预测。";
          feedback.className = "rmn-feedback";
          return;
        }
        var result = evaluate(state);
        results.hidden = false;
        var correct = QUESTIONS.every(function (question) { return predictions[question.id] === question.answer; });
        feedback.textContent = correct
          ? "预测命中。现在把一次固定样本与高概率/渐近语言分开读。"
          : "预测已核对；请特别重读网格下界、iid 典型尺度和三类对象的归一化。";
        feedback.className = "rmn-feedback " + (correct ? "rmn-pass" : "rmn-warn");
        renderResults(doc, results, result);
        if (api && typeof api.announce === "function") api.announce(rootElement, feedback.textContent);
      }

      render();
    }

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }

      check(PRESETS.length === 6, "six named deterministic presets");
      var gaussianFirst = evaluate(PRESETS[0]);
      var gaussianSecond = evaluate(PRESETS[0]);
      check(gaussianFirst.matrix[0][0] === gaussianSecond.matrix[0][0], "Gaussian seed is reproducible");
      check(gaussianFirst.matrix[2][3] === gaussianSecond.matrix[2][3], "Gaussian matrix is reproducible");
      check(gaussianFirst.operatorNorm > 0, "Gaussian operator norm is positive");
      check(gaussianFirst.gridMaxRaw <= gaussianFirst.operatorNorm * (1 + 1e-10), "finite grid is a lower bound");
      check(gaussianFirst.gridMax <= gaussianFirst.operatorNorm * (1 + 1e-10), "reported grid bound respects floating-point tolerance");
      check(gaussianFirst.powerNorm <= gaussianFirst.operatorNorm * (1 + 1e-8), "power Rayleigh estimate respects PSD bound");

      var rademacher = evaluate(PRESETS[1]);
      check(rademacher.matrix.every(function (row) {
        return row.every(function (value) { return value === -1 || value === 1; });
      }), "Rademacher entries are signs");
      check(rademacher.seed === 20260722, "Rademacher fixed seed");

      var diagonal = smallSymmetricEigenvalues([[2, 1], [1, 2]]);
      check(near(diagonal[0], 3, 1e-12) && near(diagonal[1], 1, 1e-12), "small Jacobi eigenvalue check");

      var wigner = evaluate(PRESETS[2]);
      check(wigner.wignerEigenvalues.length === 6, "Wigner eigenvalues are exposed separately");
      check(near(wigner.operatorNorm, wigner.wignerEigenEdge, 1e-8), "symmetric Wigner eigenvalue and norm ledger agree");
      check(wigner.referenceScaleLabel === "Wigner edge ~ 2", "Wigner scale is separate");

      var covariance = evaluate(PRESETS[3]);
      check(covariance.sourceNorm !== null, "sample covariance keeps source X");
      check(near(covariance.operatorNorm, covariance.covarianceIdentity, 1e-10), "S=X^T X/m normalization identity");
      check(covariance.referenceScaleLabel === "MP upper edge", "covariance scale is MP-specific");

      var correlated = evaluate(PRESETS[4]);
      var heavyTail = evaluate(PRESETS[5]);
      check(!correlated.referenceScaleValid, "correlated preset is outside iid scale assumptions");
      check(!heavyTail.referenceScaleValid, "heavy-tail preset is outside subgaussian assumptions");
      [wigner, covariance, correlated, heavyTail].forEach(function (result) {
        check(result.gridMaxRaw <= result.operatorNorm * (1 + 1e-9), result.presetId + " finite grid bound");
        check(finite(result.powerNorm), result.presetId + " finite power estimate");
      });
      return { checks: checks, presets: PRESETS.length };
    }

    var exported = {
      PRESETS: PRESETS,
      QUESTIONS: QUESTIONS,
      createRng: createRng,
      directionGrid: directionGrid,
      evaluate: evaluate,
      smallSymmetricEigenvalues: smallSymmetricEigenvalues,
      powerIteration: powerIteration,
      selfTest: selfTest,
      mount: mount
    };

    return exported;
  }
);
