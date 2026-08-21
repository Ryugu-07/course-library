(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("eigen-iteration", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("eigen-iteration self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)\n");
    } catch (error) {
      process.stderr.write("eigen-iteration self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-eigen-iteration-styles";
  var EPS = 1e-10;
  var MACHINE_EPSILON = Number.EPSILON || 2.220446049250313e-16;
  var ULP_FACTOR = 64;
  var SOLVE_RELATIVE_TOLERANCE = 1e-14;
  var CLASSIFICATION_RELATIVE_TOLERANCE = 1e-10;
  var DISCRIMINANT_RELATIVE_TOLERANCE = 1e-12;
  var INSTANCE = 0;

  var PRESETS = [
    {
      id: "symmetric-gap",
      label: "预设 A",
      matrix: [[4, 1], [1, 2]],
      initialAngle: 19,
      shift: 4.15,
      targetIndex: 0
    },
    {
      id: "symmetric-small-gap",
      label: "预设 B",
      matrix: [[2, 0.01], [0.01, 1.99]],
      initialAngle: 35,
      shift: 2.03,
      targetIndex: 0
    },
    {
      id: "nonnormal",
      label: "预设 C",
      matrix: [[2, 6], [0, 1]],
      initialAngle: 34,
      shift: 1.85,
      targetIndex: 0
    },
    {
      id: "normal-rotation",
      label: "预设 D",
      matrix: [[0, -1], [1, 0]],
      initialAngle: 22,
      shift: 0.3,
      targetIndex: null
    }
  ];

  var DEFAULT = { presetId: "symmetric-gap", steps: 8 };

  var STYLE_TEXT = [
    ".eigen-lab{--eig-blue:var(--cl-blue,#315f9d);--eig-gold:var(--cl-gold,#9b6a12);--eig-green:var(--cl-green,#39734d);--eig-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".eigen-lab *,.eigen-lab *::before,.eigen-lab *::after{box-sizing:border-box}.eigen-lab [hidden]{display:none!important}.eigen-lab h3,.eigen-lab h4{margin:0;color:var(--fg);letter-spacing:0}.eigen-lab h3{font-size:1.18rem}.eigen-lab h4{font-size:1rem}",
    ".eigen-lab button,.eigen-lab input{font:inherit}.eigen-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.eigen-lab button:hover{border-color:var(--accent)}.eigen-lab button[aria-pressed='true'],.eigen-lab button.eigen-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.eigen-lab button:focus-visible,.eigen-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.eigen-lab button:disabled{cursor:not-allowed;opacity:.55}",
    ".eigen-lab .eigen-note,.eigen-lab .eigen-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.eigen-lab .eigen-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--eig-gold);background:var(--bg)}.eigen-lab fieldset{min-width:0;margin:0;padding:0;border:0}.eigen-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750}.eigen-lab .eigen-preset-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.eigen-lab .eigen-preset-grid button,.eigen-lab .eigen-choice-grid button{font-size:12px}.eigen-lab .eigen-question-list{display:grid;gap:10px;margin-top:13px}.eigen-lab .eigen-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.eigen-lab .eigen-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.eigen-lab .eigen-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.eigen-lab .eigen-actions>*{flex:1 1 170px}.eigen-lab .eigen-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.eigen-lab .eigen-pass{color:var(--eig-green)}.eigen-lab .eigen-warn{color:var(--eig-red)}",
    ".eigen-lab .eigen-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.eigen-lab .eigen-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin:12px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.eigen-lab .eigen-control{display:grid;gap:5px;min-width:0}.eigen-lab .eigen-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.eigen-lab .eigen-control output{color:var(--accent);font-variant-numeric:tabular-nums}.eigen-lab .eigen-control input[type=range]{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.eigen-lab .eigen-control input[type=number]{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}",
    ".eigen-lab .eigen-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;min-width:0}.eigen-lab .eigen-chart{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.eigen-lab .eigen-chart-wide{grid-column:1/-1}.eigen-lab .eigen-svg{display:block;width:100%;min-width:620px;height:auto;color:var(--fg)}.eigen-lab .eigen-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.eigen-lab .eigen-grid-line{stroke:var(--border);stroke-width:1;stroke-opacity:.7}.eigen-lab .eigen-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.75}.eigen-lab .eigen-power{stroke:var(--eig-blue);fill:none}.eigen-lab .eigen-inverse{stroke:var(--eig-green);fill:none}.eigen-lab .eigen-rayleigh{stroke:var(--eig-red);fill:none}.eigen-lab .eigen-qr{stroke:var(--eig-gold);fill:none}.eigen-lab .eigen-line{stroke-width:2.5;fill:none;stroke-linecap:round;stroke-linejoin:round}.eigen-lab .eigen-dot{stroke:var(--bg);stroke-width:1.2}",
    ".eigen-lab .eigen-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:8px;margin:12px 0}.eigen-lab .eigen-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.eigen-lab .eigen-metric:nth-child(1),.eigen-lab .eigen-metric:nth-child(4){border-top-color:var(--eig-blue)}.eigen-lab .eigen-metric:nth-child(2),.eigen-lab .eigen-metric:nth-child(5){border-top-color:var(--eig-gold)}.eigen-lab .eigen-metric:nth-child(3),.eigen-lab .eigen-metric:nth-child(6){border-top-color:var(--eig-green)}.eigen-lab .eigen-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.eigen-lab .eigen-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.eigen-lab .eigen-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.eigen-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.eigen-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.eigen-lab th,.eigen-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.eigen-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.eigen-lab .eigen-good{color:var(--eig-green);font-weight:750}.eigen-lab .eigen-bad{color:var(--eig-red);font-weight:750}.eigen-lab .eigen-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--eig-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:900px){.eigen-lab .eigen-chart-grid{grid-template-columns:minmax(0,1fr)}.eigen-lab .eigen-chart-wide{grid-column:auto}.eigen-lab .eigen-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.eigen-lab .eigen-preset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.eigen-lab .eigen-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:430px){.eigen-lab .eigen-preset-grid,.eigen-lab .eigen-controls{grid-template-columns:minmax(0,1fr)}.eigen-lab .eigen-chart{padding:5px}}@media(prefers-reduced-motion:reduce){.eigen-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function ulp(value) {
    var magnitude = Math.abs(value);
    if (!finite(magnitude)) return Infinity;
    if (magnitude === 0) return Number.MIN_VALUE;
    var exponent = Math.floor(Math.log(magnitude) / Math.LN2);
    if (exponent < -1022) return Number.MIN_VALUE;
    return Math.max(Number.MIN_VALUE, Math.pow(2, exponent) * MACHINE_EPSILON);
  }

  function relativeTolerance(scale, relative) {
    var magnitude = Math.abs(scale);
    var relativePart = (relative === undefined ? EPS : relative) * magnitude;
    var ulpPart = ULP_FACTOR * ulp(magnitude);
    return Math.max(Number.MIN_VALUE, relativePart, ulpPart);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= relativeTolerance(scale, tolerance);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function zeros(rows, columns) {
    var result = [];
    for (var row = 0; row < rows; row += 1) {
      result.push(new Array(columns).fill(0));
    }
    return result;
  }

  function identity(size) {
    var result = zeros(size, size);
    for (var index = 0; index < size; index += 1) result[index][index] = 1;
    return result;
  }

  function addVectors(left, right) {
    return left.map(function (value, index) { return value + right[index]; });
  }

  function subtractVectors(left, right) {
    return left.map(function (value, index) { return value - right[index]; });
  }

  function scaleVector(vector, scale) {
    return vector.map(function (value) { return value * scale; });
  }

  function dot(left, right) {
    return left.reduce(function (sum, value, index) { return sum + value * right[index]; }, 0);
  }

  function norm(vector) {
    var scale = 0;
    var sum = 1;
    vector.forEach(function (value) {
      var magnitude = Math.abs(value);
      if (magnitude === 0) return;
      if (scale < magnitude) {
        sum = scale === 0 ? 1 : 1 + sum * Math.pow(scale / magnitude, 2);
        scale = magnitude;
      } else {
        sum += Math.pow(magnitude / scale, 2);
      }
    });
    return scale === 0 ? 0 : scale * Math.sqrt(sum);
  }

  function normalize(vector) {
    var size = norm(vector);
    if (!finite(size) || size === 0) throw new RangeError("cannot normalize a zero vector");
    return scaleVector(vector, 1 / size);
  }

  function matVec(matrix, vector) {
    return matrix.map(function (row) { return dot(row, vector); });
  }

  function matMul(left, right) {
    var result = zeros(left.length, right[0].length);
    for (var row = 0; row < left.length; row += 1) {
      for (var column = 0; column < right[0].length; column += 1) {
        for (var inner = 0; inner < right.length; inner += 1) {
          result[row][column] += left[row][inner] * right[inner][column];
        }
      }
    }
    return result;
  }

  function transpose(matrix) {
    return matrix[0].map(function (_, column) {
      return matrix.map(function (row) { return row[column]; });
    });
  }

  function subtractMatrices(left, right) {
    return left.map(function (row, rowIndex) {
      return row.map(function (value, columnIndex) { return value - right[rowIndex][columnIndex]; });
    });
  }

  function matrixFrobenius(matrix) {
    var scale = 0;
    var sum = 1;
    matrix.forEach(function (row) {
      row.forEach(function (value) {
        var magnitude = Math.abs(value);
        if (magnitude === 0) return;
        if (scale < magnitude) {
          sum = scale === 0 ? 1 : 1 + sum * Math.pow(scale / magnitude, 2);
          scale = magnitude;
        } else {
          sum += Math.pow(magnitude / scale, 2);
        }
      });
    });
    return scale === 0 ? 0 : scale * Math.sqrt(sum);
  }

  function solve2(matrix, right) {
    var scale = matrixFrobenius(matrix);
    if (!finite(scale) || scale === 0) {
      var zeroError = new RangeError("singular shifted system");
      zeroError.code = "SINGULAR_SHIFT";
      throw zeroError;
    }
    var a = matrix[0][0] / scale;
    var b = matrix[0][1] / scale;
    var c = matrix[1][0] / scale;
    var d = matrix[1][1] / scale;
    var determinant = a * d - b * c;
    if (Math.abs(determinant) <= relativeTolerance(1, SOLVE_RELATIVE_TOLERANCE)) {
      var singularError = new RangeError("singular shifted system");
      singularError.code = "SINGULAR_SHIFT";
      throw singularError;
    }
    return [
      (d * (right[0] / scale) - b * (right[1] / scale)) / determinant,
      (-c * (right[0] / scale) + a * (right[1] / scale)) / determinant
    ];
  }

  function isSymmetric(matrix) {
    var scale = matrixFrobenius(matrix);
    return scale === 0 || Math.abs((matrix[0][1] - matrix[1][0]) / scale) <=
      relativeTolerance(1, CLASSIFICATION_RELATIVE_TOLERANCE);
  }

  function isNormal(matrix) {
    var scale = matrixFrobenius(matrix);
    if (scale === 0) return true;
    var normalized = matrix.map(function (row) {
      return row.map(function (value) { return value / scale; });
    });
    var left = matMul(normalized, transpose(normalized));
    var right = matMul(transpose(normalized), normalized);
    return matrixFrobenius(subtractMatrices(left, right)) <=
      relativeTolerance(1, CLASSIFICATION_RELATIVE_TOLERANCE);
  }

  function matrixClass(matrix) {
    return isSymmetric(matrix) ? "symmetric" : isNormal(matrix) ? "normal" : "nonnormal";
  }

  function eigenvalues2(matrix) {
    var scale = matrixFrobenius(matrix);
    if (scale === 0) {
      return { real: true, values: [0, 0], discriminant: 0 };
    }
    var a = matrix[0][0] / scale;
    var b = matrix[0][1] / scale;
    var c = matrix[1][0] / scale;
    var d = matrix[1][1] / scale;
    var trace = a + d;
    var determinant = a * d - b * c;
    var discriminant = trace * trace - 4 * determinant;
    var discriminantScale = Math.max(trace * trace, 4 * Math.abs(determinant));
    var discriminantTolerance = relativeTolerance(discriminantScale, DISCRIMINANT_RELATIVE_TOLERANCE);
    if (discriminant < -discriminantTolerance) {
      var imaginary = Math.sqrt(-discriminant) / 2 * scale;
      return {
        real: false,
        values: [
          { real: trace / 2 * scale, imag: imaginary },
          { real: trace / 2 * scale, imag: -imaginary }
        ],
        discriminant: discriminant * scale * scale
      };
    }
    var radius = Math.sqrt(Math.max(0, discriminant)) / 2 * scale;
    return {
      real: true,
      values: [trace / 2 * scale + radius, trace / 2 * scale - radius],
      discriminant: discriminant * scale * scale
    };
  }

  function eigenvector2(matrix, eigenvalue) {
    var candidates = [
      [matrix[0][1], eigenvalue - matrix[0][0]],
      [eigenvalue - matrix[1][1], matrix[1][0]]
    ];
    for (var index = 0; index < candidates.length; index += 1) {
      if (norm(candidates[index]) > 0) return normalize(candidates[index]);
    }
    return null;
  }

  function spectralInfo(matrix, targetIndex) {
    var spectrum = eigenvalues2(matrix);
    var kind = matrixClass(matrix);
    var target = spectrum.real && targetIndex !== null && targetIndex !== undefined
      ? spectrum.values[targetIndex]
      : null;
    var targetVector = target === null ? null : eigenvector2(matrix, target);
    var gap = null;
    if (target !== null) {
      gap = Math.min.apply(null, spectrum.values.map(function (value, index) {
        return index === targetIndex ? Infinity : Math.abs(target - value);
      }));
    }
    return {
      kind: kind,
      normal: kind === "symmetric" || kind === "normal",
      spectrum: spectrum,
      targetIndex: targetIndex === undefined ? null : targetIndex,
      targetEigenvalue: target,
      targetVector: targetVector,
      gap: gap
    };
  }

  function defaultTargetIndex(matrix, targetIndex) {
    if (targetIndex !== undefined) return targetIndex;
    return eigenvalues2(matrix).real ? 0 : null;
  }

  function nearestRealEigenvalueIndex(spectrum, value, fallback) {
    if (!spectrum.real || !finite(value)) return null;
    var selected = fallback === null || fallback === undefined ? 0 : fallback;
    var distance = Infinity;
    spectrum.values.forEach(function (candidate, index) {
      var currentDistance = Math.abs(candidate - value);
      if (currentDistance < distance) {
        distance = currentDistance;
        selected = index;
      }
    });
    return selected;
  }

  function targetIndexForEstimate(matrix, estimate, fallback) {
    return nearestRealEigenvalueIndex(eigenvalues2(matrix), estimate, fallback);
  }

  function angleBetween(left, right) {
    if (!left || !right) return null;
    var denominator = norm(left) * norm(right);
    if (denominator === 0) return null;
    return Math.acos(clamp(Math.abs(dot(left, right) / denominator), -1, 1));
  }

  function rayleighQuotient(matrix, vector) {
    var denominator = dot(vector, vector);
    if (denominator === 0) return null;
    return dot(vector, matVec(matrix, vector)) / denominator;
  }

  function residualNorm(matrix, vector, eigenvalueEstimate) {
    return norm(subtractVectors(matVec(matrix, vector), scaleVector(vector, eigenvalueEstimate)));
  }

  function exactResidualTolerance(matrix, eigenvalueEstimate) {
    return relativeTolerance(matrixFrobenius(matrix) + Math.abs(eigenvalueEstimate), 1e-12);
  }

  function isExactEigenpair(matrix, vector, eigenvalueEstimate) {
    return finite(eigenvalueEstimate) && residualNorm(matrix, vector, eigenvalueEstimate) <=
      exactResidualTolerance(matrix, eigenvalueEstimate);
  }

  function measurement(matrix, vector, eigenvalueEstimate, info, iteration, method) {
    var residual = residualNorm(matrix, vector, eigenvalueEstimate);
    var angle = angleBetween(vector, info.targetVector);
    var separation = info.spectrum.real && info.targetIndex !== null && info.targetIndex !== undefined
      ? Math.min.apply(null, info.spectrum.values.map(function (value, index) {
        return index === info.targetIndex ? Infinity : Math.abs(value - eigenvalueEstimate);
      }))
      : null;
    var certificate = info.normal && separation !== null && separation > 0
      ? Math.min(1, residual / separation)
      : null;
    return {
      iteration: iteration,
      method: method,
      vector: copy(vector),
      eigenvalue: eigenvalueEstimate,
      residual: residual,
      angle: angle,
      angleDeg: angle === null ? null : angle * 180 / Math.PI,
      sinAngle: angle === null ? null : Math.sin(angle),
      gap: info.gap,
      separation: separation,
      certificateBound: certificate,
      targetIndex: info.targetIndex,
      targetEigenvalue: info.targetEigenvalue
    };
  }

  function dynamicMeasurement(matrix, vector, eigenvalueEstimate, fallbackTarget, iteration, method) {
    var targetIndex = targetIndexForEstimate(matrix, eigenvalueEstimate, fallbackTarget);
    return measurement(matrix, vector, eigenvalueEstimate, spectralInfo(matrix, targetIndex), iteration, method);
  }

  function initialVector(input) {
    if (input && Array.isArray(input.x0)) return normalize(input.x0.map(Number));
    var degrees = input && finite(Number(input.initialAngle)) ? Number(input.initialAngle) : 19;
    var radians = degrees * Math.PI / 180;
    return [Math.cos(radians), Math.sin(radians)];
  }

  function powerIteration(matrix, x0, steps, targetIndex) {
    var selectedTarget = defaultTargetIndex(matrix, targetIndex);
    var info = spectralInfo(matrix, selectedTarget);
    var vector = normalize(x0);
    var rows = [measurement(matrix, vector, rayleighQuotient(matrix, vector), info, 0, "power")];
    var status = "complete";
    for (var iteration = 1; iteration <= steps; iteration += 1) {
      var next = matVec(matrix, vector);
      if (norm(next) === 0) {
        status = "stalled";
        break;
      }
      vector = normalize(next);
      rows.push(measurement(matrix, vector, rayleighQuotient(matrix, vector), info, iteration, "power"));
    }
    return { method: "power", rows: rows, status: status };
  }

  function inverseIteration(matrix, shift, x0, steps, targetIndex) {
    var spectrum = eigenvalues2(matrix);
    var requestedTarget = defaultTargetIndex(matrix, targetIndex);
    var selectedTarget = spectrum.real ? nearestRealEigenvalueIndex(spectrum, shift, requestedTarget) : null;
    var vector = normalize(x0);
    var initialEstimate = rayleighQuotient(matrix, vector);
    var rows = [dynamicMeasurement(matrix, vector, initialEstimate, selectedTarget, 0, "inverse")];
    var status = "complete";
    for (var iteration = 1; iteration <= steps; iteration += 1) {
      try {
        vector = normalize(solve2([
          [matrix[0][0] - shift, matrix[0][1]],
          [matrix[1][0], matrix[1][1] - shift]
        ], vector));
      } catch (error) {
        status = "singular-shift";
        break;
      }
      var estimate = rayleighQuotient(matrix, vector);
      rows.push(dynamicMeasurement(matrix, vector, estimate, selectedTarget, iteration, "inverse"));
    }
    return {
      method: "inverse",
      shift: shift,
      targetIndex: rows[rows.length - 1].targetIndex,
      targetEigenvalue: rows[rows.length - 1].targetEigenvalue,
      rows: rows,
      status: status
    };
  }

  function rayleighIteration(matrix, x0, steps, targetIndex) {
    var selectedTarget = defaultTargetIndex(matrix, targetIndex);
    var vector = normalize(x0);
    var initialEstimate = rayleighQuotient(matrix, vector);
    var rows = [dynamicMeasurement(matrix, vector, initialEstimate, selectedTarget, 0, "rayleigh")];
    var status = isExactEigenpair(matrix, vector, initialEstimate) ? "exact-convergence" : "complete";
    for (var iteration = 1; iteration <= steps; iteration += 1) {
      if (status === "exact-convergence") break;
      var shift = rayleighQuotient(matrix, vector);
      if (isExactEigenpair(matrix, vector, shift)) {
        status = "exact-convergence";
        break;
      }
      try {
        vector = normalize(solve2([
          [matrix[0][0] - shift, matrix[0][1]],
          [matrix[1][0], matrix[1][1] - shift]
        ], vector));
      } catch (error) {
        status = "singular-shift";
        break;
      }
      var estimate = rayleighQuotient(matrix, vector);
      rows.push(dynamicMeasurement(matrix, vector, estimate, selectedTarget, iteration, "rayleigh"));
      if (isExactEigenpair(matrix, vector, estimate)) {
        status = "exact-convergence";
        break;
      }
    }
    return {
      method: "rayleigh",
      targetIndex: rows[rows.length - 1].targetIndex,
      targetEigenvalue: rows[rows.length - 1].targetEigenvalue,
      rows: rows,
      status: status
    };
  }

  function qrDecompose(matrix) {
    var rows = matrix.length;
    var columns = matrix[0].length;
    var R = copy(matrix);
    var Q = identity(rows);
    var matrixScale = matrixFrobenius(matrix);
    var zeroThreshold = ULP_FACTOR * ulp(matrixScale);
    var limit = Math.min(rows, columns);
    for (var pivot = 0; pivot < limit; pivot += 1) {
      var vector = [];
      for (var row = pivot; row < rows; row += 1) vector.push(R[row][pivot]);
      var length = norm(vector);
      if (length <= zeroThreshold) {
        for (var zeroRow = pivot + 1; zeroRow < rows; zeroRow += 1) R[zeroRow][pivot] = 0;
        continue;
      }
      var sign = vector[0] < 0 ? -1 : 1;
      vector[0] += sign * length;
      var reflectorNorm = dot(vector, vector);
      if (reflectorNorm === 0) continue;
      for (var column = pivot; column < columns; column += 1) {
        var projection = 0;
        for (var sourceRow = pivot; sourceRow < rows; sourceRow += 1) {
          projection += vector[sourceRow - pivot] * R[sourceRow][column];
        }
        projection = 2 * projection / reflectorNorm;
        for (var targetRow = pivot; targetRow < rows; targetRow += 1) {
          R[targetRow][column] -= projection * vector[targetRow - pivot];
        }
      }
      for (var qRow = 0; qRow < rows; qRow += 1) {
        var qProjection = 0;
        for (var qColumn = pivot; qColumn < rows; qColumn += 1) {
          qProjection += Q[qRow][qColumn] * vector[qColumn - pivot];
        }
        qProjection = 2 * qProjection / reflectorNorm;
        for (var qTarget = pivot; qTarget < rows; qTarget += 1) {
          Q[qRow][qTarget] -= qProjection * vector[qTarget - pivot];
        }
      }
      for (var cleanupRow = pivot + 1; cleanupRow < rows; cleanupRow += 1) R[cleanupRow][pivot] = 0;
    }
    return { Q: Q, R: R };
  }

  function strictLowerNorm(matrix) {
    var values = [];
    matrix.forEach(function (row, rowIndex) {
      row.forEach(function (value, columnIndex) {
        if (rowIndex > columnIndex) values.push(value);
      });
    });
    return norm(values);
  }

  function fullOffDiagonalNorm(matrix) {
    var values = [];
    matrix.forEach(function (row, rowIndex) {
      row.forEach(function (value, columnIndex) {
        if (rowIndex !== columnIndex) values.push(value);
      });
    });
    return norm(values);
  }

  function qrPairing(diagonal, spectrum) {
    if (!spectrum.real) return null;
    var direct = Math.abs(diagonal[0] - spectrum.values[0]) + Math.abs(diagonal[1] - spectrum.values[1]);
    var swapped = Math.abs(diagonal[0] - spectrum.values[1]) + Math.abs(diagonal[1] - spectrum.values[0]);
    return swapped < direct ? [1, 0] : [0, 1];
  }

  function qrIteration(matrix, steps, targetIndex) {
    var initial = copy(matrix);
    var selectedTarget = defaultTargetIndex(initial, targetIndex);
    var info = spectralInfo(initial, selectedTarget);
    var current = copy(initial);
    var accumulated = identity(initial.length);
    var rows = [];
    for (var iteration = 0; iteration <= steps; iteration += 1) {
      var diagonal = current.map(function (row, index) { return row[index]; });
      var vectors = [];
      for (var column = 0; column < accumulated[0].length; column += 1) {
        vectors.push(accumulated.map(function (row) { return row[column]; }));
      }
      var pairing = qrPairing(diagonal, info.spectrum);
      var actualTarget = selectedTarget === null || pairing === null ? null : pairing[selectedTarget];
      var targetVector = actualTarget === null ? null : eigenvector2(initial, info.spectrum.values[actualTarget]);
      var targetGap = actualTarget === null ? null : Math.min.apply(null, info.spectrum.values.map(function (value, index) {
        return index === actualTarget ? Infinity : Math.abs(info.spectrum.values[actualTarget] - value);
      }));
      var targetAngle = selectedTarget === null || targetVector === null ? null :
        angleBetween(vectors[selectedTarget], targetVector);
      var targetEstimate = selectedTarget === null ? null : diagonal[selectedTarget];
      var residual = selectedTarget === null ? null :
        norm(subtractVectors(matVec(initial, vectors[selectedTarget]), scaleVector(vectors[selectedTarget], targetEstimate)));
      var separation = info.spectrum.real && actualTarget !== null
        ? Math.min.apply(null, info.spectrum.values.map(function (value, index) {
          return index === actualTarget ? Infinity : Math.abs(value - targetEstimate);
        }))
        : null;
      rows.push({
        iteration: iteration,
        method: "qr",
        diagonal: copy(diagonal),
        subdiagonal: strictLowerNorm(current),
        offDiagonal: fullOffDiagonalNorm(current),
        eigenvalueError: info.spectrum.real ? Math.min(
          Math.abs(diagonal[0] - info.spectrum.values[0]) + Math.abs(diagonal[1] - info.spectrum.values[1]),
          Math.abs(diagonal[0] - info.spectrum.values[1]) + Math.abs(diagonal[1] - info.spectrum.values[0])
        ) : null,
        eigenvalue: targetEstimate,
        targetIndex: actualTarget,
        targetEigenvalue: actualTarget === null ? null : info.spectrum.values[actualTarget],
        residual: residual,
        angle: targetAngle,
        angleDeg: targetAngle === null ? null : targetAngle * 180 / Math.PI,
        sinAngle: targetAngle === null ? null : Math.sin(targetAngle),
        gap: targetGap,
        separation: separation,
        certificateBound: info.normal && separation !== null && separation > 0 && residual !== null
          ? Math.min(1, residual / separation)
          : null,
        vectors: copy(vectors)
      });
      if (iteration === steps) break;
      var decomposition = qrDecompose(current);
      current = matMul(decomposition.R, decomposition.Q);
      accumulated = matMul(accumulated, decomposition.Q);
    }
    return {
      method: "qr",
      targetIndex: rows[rows.length - 1].targetIndex,
      targetEigenvalue: rows[rows.length - 1].targetEigenvalue,
      rows: rows,
      status: "complete",
      finalMatrix: current
    };
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].id === id) return PRESETS[index];
    }
    return PRESETS[0];
  }

  function compute(input) {
    var source = input || {};
    var preset = presetById(source.presetId || DEFAULT.presetId);
    var matrix = source.matrix ? copy(source.matrix) : copy(preset.matrix);
    if (!Array.isArray(matrix) || matrix.length !== 2 || matrix.some(function (row) {
      return !Array.isArray(row) || row.length !== 2 || row.some(function (value) { return !finite(Number(value)); });
    })) throw new RangeError("matrix must be a finite 2x2 array");
    matrix = matrix.map(function (row) { return row.map(Number); });
    var targetIndex = source.targetIndex === undefined ? preset.targetIndex : source.targetIndex;
    var info = spectralInfo(matrix, targetIndex);
    var steps = Math.round(clamp(source.steps === undefined ? DEFAULT.steps : Number(source.steps), 1, 16));
    var vector = initialVector(source.initialAngle === undefined && source.x0 === undefined
      ? { initialAngle: preset.initialAngle }
      : source);
    var shift = source.shift === undefined ? preset.shift : Number(source.shift);
    if (!finite(shift)) shift = preset.shift;
    var power = powerIteration(matrix, vector, steps, targetIndex);
    var inverse = inverseIteration(matrix, shift, vector, steps, targetIndex);
    var rayleigh = rayleighIteration(matrix, vector, steps, targetIndex);
    var qr = qrIteration(matrix, steps, targetIndex);
    return {
      presetId: preset.id,
      label: preset.label,
      matrix: matrix,
      matrixClass: info.kind,
      normalGuarantee: info.normal,
      spectrum: info.spectrum,
      targetIndex: targetIndex,
      targetEigenvalue: info.targetEigenvalue,
      targetVector: info.targetVector,
      spectralGap: info.gap,
      steps: steps,
      initialVector: vector,
      shift: shift,
      power: power,
      inverse: inverse,
      inverseTargetIndex: inverse.targetIndex,
      inverseTargetEigenvalue: inverse.targetEigenvalue,
      rayleigh: rayleigh,
      qr: qr,
      qrTargetIndex: qr.targetIndex,
      qrTargetEigenvalue: qr.targetEigenvalue
    };
  }

  function lastRow(result) {
    return result.rows[result.rows.length - 1];
  }

  function format(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(value)) return "∞";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = value;
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    append(node, children, doc);
    return node;
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (key === "className") key = "class";
      if (value !== undefined && value !== null && value !== false) node.setAttribute(key, String(value));
    });
    append(node, children, doc);
    return node;
  }

  function append(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "eigen-metric" }, [
      element(doc, "span", { text: label }),
      element(doc, "strong", { text: value })
    ]);
  }

  function linePath(rows, field, x, y) {
    var segments = [];
    var current = [];
    rows.forEach(function (row) {
      if (finite(row[field])) {
        current.push([x(row.iteration), y(row[field])]);
      } else if (current.length) {
        segments.push(current);
        current = [];
      }
    });
    if (current.length) segments.push(current);
    return segments.map(function (points) {
      return points.map(function (point, index) {
        return (index ? "L" : "M") + point[0].toFixed(2) + " " + point[1].toFixed(2);
      }).join(" ");
    });
  }

  function drawConvergence(doc, svg, data, field, title, yLabel, uid, logarithmic) {
    clear(svg);
    var width = 760;
    var height = 300;
    var left = 62;
    var right = 20;
    var top = 38;
    var bottom = 48;
    var plotRight = width - right;
    var plotBottom = height - bottom;
    var methods = [
      { key: "power", label: "幂法", className: "eigen-power" },
      { key: "inverse", label: "反幂法", className: "eigen-inverse" },
      { key: "rayleigh", label: "Rayleigh", className: "eigen-rayleigh" },
      { key: "qr", label: "QR", className: "eigen-qr" }
    ];
    var values = [];
    methods.forEach(function (method) {
      data[method.key].rows.forEach(function (row) {
        if (finite(row[field])) values.push(logarithmic ? Math.log10(Math.max(row[field], 1e-12)) : row[field]);
      });
    });
    var minimum = values.length ? Math.min.apply(null, values) : 0;
    var maximum = values.length ? Math.max.apply(null, values) : 1;
    if (logarithmic) {
      minimum = Math.min(-12, Math.floor(minimum));
      maximum = Math.max(0, Math.ceil(maximum));
    } else {
      minimum = Math.min(0, minimum);
      maximum = Math.max(1, maximum);
    }
    if (maximum - minimum < 1e-9) { maximum += 1; minimum -= 1; }
    function x(value) { return left + value / data.steps * (plotRight - left); }
    function y(value) {
      var scaled = logarithmic ? Math.log10(Math.max(value, 1e-12)) : value;
      return plotBottom - (scaled - minimum) / (maximum - minimum) * (plotBottom - top);
    }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, title));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" },
      "横轴是迭代次数；曲线分别显示幂法、反幂法、Rayleigh 商迭代和 QR 的 " + yLabel + "。"));
    svg.setAttribute("aria-labelledby", uid + "-title " + uid + "-desc");
    [0, 0.5, 1].forEach(function (fraction) {
      var value = minimum + fraction * (maximum - minimum);
      var yy = plotBottom - fraction * (plotBottom - top);
      svg.appendChild(svgElement(doc, "line", {
        x1: left, y1: yy, x2: plotRight, y2: yy,
        className: fraction === 0 ? "eigen-axis" : "eigen-grid-line"
      }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: yy + 4, "text-anchor": "end", "font-size": 11 },
        logarithmic ? "10^" + format(value, 0) : format(value, 2)));
    });
    [0, Math.round(data.steps / 2), data.steps].forEach(function (tick) {
      svg.appendChild(svgElement(doc, "line", {
        x1: x(tick), y1: top, x2: x(tick), y2: plotBottom, className: "eigen-grid-line"
      }));
      svg.appendChild(svgElement(doc, "text", { x: x(tick), y: plotBottom + 18, "text-anchor": "middle", "font-size": 11 },
        String(tick)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "eigen-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: plotBottom, className: "eigen-axis" }));
    methods.forEach(function (method, index) {
      linePath(data[method.key].rows, field, x, y).forEach(function (path) {
        svg.appendChild(svgElement(doc, "path", { d: path, className: method.className + " eigen-line" }));
      });
      var final = lastRow(data[method.key]);
      if (finite(final[field])) {
        svg.appendChild(svgElement(doc, "circle", {
          cx: x(final.iteration), cy: y(final[field]), r: 4, className: method.className + " eigen-dot", fill: "currentColor"
        }));
      }
      var legendX = left + index * 166;
      svg.appendChild(svgElement(doc, "line", {
        x1: legendX, y1: 18, x2: legendX + 22, y2: 18, className: method.className + " eigen-line"
      }));
      svg.appendChild(svgElement(doc, "text", { x: legendX + 28, y: 22, "font-size": 11 }, method.label));
    });
    svg.appendChild(svgElement(doc, "text", { x: left, y: 22, "font-size": 13, "font-weight": 750 }, title));
    svg.appendChild(svgElement(doc, "text", { x: (left + plotRight) / 2, y: height - 10, "text-anchor": "middle", "font-size": 12 },
      "迭代次数 k"));
    return svg;
  }

  function drawQR(doc, svg, data, uid) {
    clear(svg);
    var rows = data.qr.rows;
    var width = 760;
    var height = 300;
    var left = 62;
    var right = 20;
    var top = 38;
    var bottom = 48;
    var plotRight = width - right;
    var plotBottom = height - bottom;
    var values = rows.map(function (row) { return row.subdiagonal; });
    var minimum = 0;
    var maximum = Math.max(1e-9, Math.max.apply(null, values));
    if (maximum === minimum) maximum = 1;
    function x(value) { return left + value / data.steps * (plotRight - left); }
    function y(value) { return plotBottom - value / maximum * (plotBottom - top); }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, "QR 的严格下三角范数"));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" },
      "金色曲线是每轮 QR 后矩阵的严格下三角 Frobenius 范数；全非对角范数另列在 ledger 中。"));
    svg.setAttribute("aria-labelledby", uid + "-title " + uid + "-desc");
    [0, 0.5, 1].forEach(function (fraction) {
      var yy = plotBottom - fraction * (plotBottom - top);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: yy, x2: plotRight, y2: yy,
        className: fraction === 0 ? "eigen-axis" : "eigen-grid-line" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: yy + 4, "text-anchor": "end", "font-size": 11 },
        format(fraction * maximum, 3)));
    });
    [0, Math.round(data.steps / 2), data.steps].forEach(function (tick) {
      svg.appendChild(svgElement(doc, "line", { x1: x(tick), y1: top, x2: x(tick), y2: plotBottom, className: "eigen-grid-line" }));
      svg.appendChild(svgElement(doc, "text", { x: x(tick), y: plotBottom + 18, "text-anchor": "middle", "font-size": 11 }, String(tick)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "eigen-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: plotBottom, className: "eigen-axis" }));
    var path = rows.map(function (row, index) {
      return (index ? "L" : "M") + x(row.iteration).toFixed(2) + " " + y(row.subdiagonal).toFixed(2);
    }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: path, className: "eigen-qr eigen-line" }));
    rows.forEach(function (row) {
      svg.appendChild(svgElement(doc, "circle", {
        cx: x(row.iteration), cy: y(row.subdiagonal), r: 4, className: "eigen-qr eigen-dot", fill: "currentColor"
      }));
    });
    svg.appendChild(svgElement(doc, "text", { x: left, y: 22, "font-size": 13, "font-weight": 750 }, "QR 严格下三角范数"));
    svg.appendChild(svgElement(doc, "text", { x: (left + plotRight) / 2, y: height - 10, "text-anchor": "middle", "font-size": 12 },
      "迭代次数 k"));
  }

  function summaryTable(doc, data) {
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "最终残差、角度、谱隙与当前 separation 证书 ledger" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "方法" }),
      element(doc, "th", { scope: "col", text: "轮数" }),
      element(doc, "th", { scope: "col", text: "实际配对目标" }),
      element(doc, "th", { scope: "col", text: "特征值估计" }),
      element(doc, "th", { scope: "col", text: "残差 ||r||₂" }),
      element(doc, "th", { scope: "col", text: "角度 θ" }),
      element(doc, "th", { scope: "col", text: "gap / separation 证书" }),
      element(doc, "th", { scope: "col", text: "状态" })
    ])));
    var body = element(doc, "tbody", {});
    [
      ["幂法", data.power],
      ["反幂法", data.inverse],
      ["Rayleigh 商", data.rayleigh],
      ["QR", data.qr]
    ].forEach(function (item) {
      var row = lastRow(item[1]);
      var certificate = row.certificateBound === null ? "不提供" :
        "sin θ≤" + format(row.certificateBound, 4) + "（sep_i(ρ)=" + format(row.separation, 4) + "）";
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { scope: "row", text: item[0] }),
        element(doc, "td", { text: String(row.iteration) }),
        element(doc, "td", { text: row.targetEigenvalue === null ? "—" : "λ=" + format(row.targetEigenvalue, 6) }),
        element(doc, "td", { text: format(row.eigenvalue, 6) }),
        element(doc, "td", { text: format(row.residual, 6) }),
        element(doc, "td", { text: row.angleDeg === null ? "—" : format(row.angleDeg, 4) + "°" }),
        element(doc, "td", { className: row.certificateBound === null ? "eigen-bad" : "eigen-good", text: certificate }),
        element(doc, "td", { text: item[1].status })
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function qrTable(doc, data) {
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "QR 逐轮对角估计、严格下三角与全非对角范数" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "k" }),
      element(doc, "th", { scope: "col", text: "实际配对目标" }),
      element(doc, "th", { scope: "col", text: "对角估计" }),
      element(doc, "th", { scope: "col", text: "严格下三角范数" }),
      element(doc, "th", { scope: "col", text: "全非对角范数" }),
      element(doc, "th", { scope: "col", text: "特征值误差" }),
      element(doc, "th", { scope: "col", text: "目标角度" })
    ])));
    var body = element(doc, "tbody", {});
    data.qr.rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { scope: "row", text: String(row.iteration) }),
        element(doc, "td", { text: row.targetEigenvalue === null ? "—" : "λ=" + format(row.targetEigenvalue, 6) }),
        element(doc, "td", { text: row.diagonal.map(function (value) { return format(value, 6); }).join(", ") }),
        element(doc, "td", { text: format(row.subdiagonal, 7) }),
        element(doc, "td", { text: format(row.offDiagonal, 7) }),
        element(doc, "td", { text: format(row.eigenvalueError, 7) }),
        element(doc, "td", { text: row.angleDeg === null ? "—" : format(row.angleDeg, 4) + "°" })
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var instanceId = "cl-eigen-" + (++INSTANCE);
    var state = {
      presetId: DEFAULT.presetId,
      steps: DEFAULT.steps,
      initialAngle: presetById(DEFAULT.presetId).initialAngle,
      shift: presetById(DEFAULT.presetId).shift,
      predictions: { fastest: null, certificate: null },
      score: null,
      revealed: false
    };

    function current() {
      return compute({
        presetId: state.presetId,
        steps: state.steps,
        initialAngle: state.initialAngle,
        shift: state.shift
      });
    }

    function choiceButton(group, value, label) {
      var button = element(doc, "button", {
        type: "button",
        "aria-pressed": state.predictions[group] === value ? "true" : "false",
        text: label
      });
      button.addEventListener("click", function () {
        state.predictions[group] = value;
        render();
      });
      return button;
    }

    function render() {
      var data = current();
      var shell = element(doc, "div", { className: "eigen-lab" });
      shell.appendChild(element(doc, "h3", { text: "特征值迭代 ledger" }));
      shell.appendChild(element(doc, "p", { className: "eigen-note", text:
        "先选矩阵并作答；揭示后可拖动轮数、初始方向和反幂位移。残差、角度与谱隙始终分栏。" }));
      var presetField = element(doc, "fieldset", {});
      presetField.appendChild(element(doc, "legend", { text: "矩阵预设（切换会重新隐藏结果）" }));
      var presetGrid = element(doc, "div", { className: "eigen-preset-grid", role: "group", "aria-label": "特征值矩阵预设" });
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": state.presetId === preset.id ? "true" : "false",
          title: preset.label,
          text: preset.label
        });
        button.addEventListener("click", function () {
          state.presetId = preset.id;
          state.initialAngle = preset.initialAngle;
          state.shift = preset.shift;
          state.predictions = { fastest: null, certificate: null };
          state.score = null;
          state.revealed = false;
          render();
        });
        presetGrid.appendChild(button);
      });
      presetField.appendChild(presetGrid);
      shell.appendChild(presetField);
      if (!state.revealed) {
        shell.appendChild(element(doc, "div", { className: "eigen-prompt" }, [
          element(doc, "strong", { text: "预测门：" }),
          element(doc, "span", { text: "先押注当前主示例的局部最快方法，再判断小残差是否足以证明角度准确。" })
        ]));
        var questions = element(doc, "div", { className: "eigen-question-list" });
        questions.appendChild(element(doc, "div", { className: "eigen-question" }, [
          element(doc, "strong", { text: "1. 在主示例（预设 A）上，谁最可能最快？" }),
          element(doc, "div", { className: "eigen-choice-grid", role: "group", "aria-label": "收敛速度预测" }, [
            choiceButton("fastest", "rayleigh", "Rayleigh 商迭代"),
            choiceButton("fastest", "power", "幂法"),
            choiceButton("fastest", "qr", "对称 QR")
          ])
        ]));
        questions.appendChild(element(doc, "div", { className: "eigen-question" }, [
          element(doc, "strong", { text: "2. 小残差能单独给出可靠的角度保证吗？" }),
          element(doc, "div", { className: "eigen-choice-grid", role: "group", "aria-label": "残差证书预测" }, [
            choiceButton("certificate", "yes", "可以"),
            choiceButton("certificate", "no", "不可以，需要 gap/结构")
          ])
        ]));
        shell.appendChild(questions);
        var actions = element(doc, "div", { className: "eigen-actions" });
        var check = element(doc, "button", { type: "button", className: "eigen-primary", text: "核对预测" });
        var reset = element(doc, "button", { type: "button", text: "重置" });
        var feedback = element(doc, "p", { className: "eigen-feedback", role: "status", "aria-live": "polite" });
        check.addEventListener("click", function () {
          if (!state.predictions.fastest || !state.predictions.certificate) {
            feedback.className = "eigen-feedback eigen-warn";
            feedback.textContent = "两项预测都要先选择。";
            return;
          }
          var correct = (state.predictions.fastest === "rayleigh" ? 1 : 0) +
            (state.predictions.certificate === "no" ? 1 : 0);
          state.score = correct;
          state.revealed = true;
          render();
          api && api.announce && api.announce(root, "预测已核对：" + correct + " / 2；迭代 ledger 已揭示。");
        });
        reset.addEventListener("click", function () {
          state.presetId = DEFAULT.presetId;
          state.steps = DEFAULT.steps;
          state.initialAngle = presetById(DEFAULT.presetId).initialAngle;
          state.shift = presetById(DEFAULT.presetId).shift;
          state.predictions = { fastest: null, certificate: null };
          state.score = null;
          state.revealed = false;
          render();
          api && api.announce && api.announce(root, "已重置；结果重新隐藏。");
        });
        actions.appendChild(check);
        actions.appendChild(reset);
        shell.appendChild(actions);
        shell.appendChild(feedback);
      } else {
        var panel = element(doc, "section", { className: "eigen-revealed", "aria-labelledby": instanceId + "-title" });
        panel.appendChild(element(doc, "h4", { id: instanceId + "-title", text: "结果与可调 ledger" }));
        var revealedActions = element(doc, "div", { className: "eigen-actions" });
        var revealedReset = element(doc, "button", { type: "button", text: "重置并重新预测" });
        revealedReset.addEventListener("click", function () {
          state.presetId = DEFAULT.presetId;
          state.steps = DEFAULT.steps;
          state.initialAngle = presetById(DEFAULT.presetId).initialAngle;
          state.shift = presetById(DEFAULT.presetId).shift;
          state.predictions = { fastest: null, certificate: null };
          state.score = null;
          state.revealed = false;
          render();
          api && api.announce && api.announce(root, "已重置；结果重新隐藏。");
        });
        revealedActions.appendChild(revealedReset);
        panel.appendChild(revealedActions);
        panel.appendChild(element(doc, "p", { className: "eigen-note", text:
          "当前矩阵：" + JSON.stringify(data.matrix) + "；幂法教学目标：" +
          (data.targetEigenvalue === null ? "无实目标（复谱）" : "λ=" + format(data.targetEigenvalue, 6)) +
          "；反幂法与 QR 的 ledger 按实际收敛谱点配对。对非正规预设，角度仍计算但证书刻意留空。" }));
        var controls = element(doc, "div", { className: "eigen-controls" });
        var stepsControl = element(doc, "div", { className: "eigen-control" }, [
          element(doc, "label", { htmlFor: instanceId + "-steps", text: "迭代轮数" }),
          element(doc, "input", { id: instanceId + "-steps", type: "range", min: 1, max: 16, step: 1, value: data.steps }),
          element(doc, "output", { text: String(data.steps) })
        ]);
        var angleControl = element(doc, "div", { className: "eigen-control" }, [
          element(doc, "label", { htmlFor: instanceId + "-angle", text: "初始方向角（度）" }),
          element(doc, "input", { id: instanceId + "-angle", type: "range", min: -85, max: 85, step: 1, value: state.initialAngle }),
          element(doc, "output", { text: format(state.initialAngle, 0) + "°" })
        ]);
        var shiftControl = element(doc, "div", { className: "eigen-control" }, [
          element(doc, "label", { htmlFor: instanceId + "-shift", text: "反幂位移 μ" }),
          element(doc, "input", { id: instanceId + "-shift", type: "number", min: -5, max: 5, step: 0.01, value: format(state.shift, 4) }),
          element(doc, "output", { text: "最近谱点：" + (data.spectrum.real ? format(Math.min.apply(null, data.spectrum.values.map(function (value) {
            return Math.abs(value - state.shift);
          })), 4) : "复谱") })
        ]);
        controls.appendChild(stepsControl);
        controls.appendChild(angleControl);
        controls.appendChild(shiftControl);
        panel.appendChild(controls);
        stepsControl.querySelector("input").addEventListener("input", function (event) {
          state.steps = Number(event.target.value);
          render();
        });
        angleControl.querySelector("input").addEventListener("input", function (event) {
          state.initialAngle = Number(event.target.value);
          render();
        });
        shiftControl.querySelector("input").addEventListener("change", function (event) {
          state.shift = Number(event.target.value);
          render();
        });
        panel.appendChild(element(doc, "div", { className: "eigen-metrics" }, [
          metric(doc, "预测得分", state.score === null ? "—" : state.score + " / 2"),
          metric(doc, "矩阵类型", data.matrixClass === "nonnormal" ? "非正规" : data.matrixClass === "normal" ? "正规" : "对称"),
          metric(doc, "幂法目标特征值", data.targetEigenvalue === null ? "复谱/无目标" : format(data.targetEigenvalue, 5)),
          metric(doc, "谱隙 gap", data.spectralGap === null ? "—" : format(data.spectralGap, 5)),
          metric(doc, "幂法最终残差", format(lastRow(data.power).residual, 5)),
          metric(doc, "Rayleigh 最终残差", format(lastRow(data.rayleigh).residual, 5)),
          metric(doc, "QR 严格下三角范数", format(lastRow(data.qr).subdiagonal, 5)),
          metric(doc, "QR 全非对角范数", format(lastRow(data.qr).offDiagonal, 5))
        ]));
        var charts = element(doc, "div", { className: "eigen-chart-grid" });
        var residualChart = element(doc, "div", { className: "eigen-chart" });
        var residualSvg = svgElement(doc, "svg", { className: "eigen-svg" });
        drawConvergence(doc, residualSvg, data, "residual", "残差 ||r||₂（log10）", "残差", instanceId + "-residual", true);
        residualChart.appendChild(residualSvg);
        charts.appendChild(residualChart);
        var angleChart = element(doc, "div", { className: "eigen-chart" });
        var angleSvg = svgElement(doc, "svg", { className: "eigen-svg" });
        drawConvergence(doc, angleSvg, data, "angleDeg", "目标角度 θ", "角度", instanceId + "-angle", false);
        angleChart.appendChild(angleSvg);
        charts.appendChild(angleChart);
        var qrChart = element(doc, "div", { className: "eigen-chart eigen-chart-wide" });
        var qrSvg = svgElement(doc, "svg", { className: "eigen-svg" });
        drawQR(doc, qrSvg, data, instanceId + "-qr");
        qrChart.appendChild(qrSvg);
        charts.appendChild(qrChart);
        panel.appendChild(charts);
        var summary = element(doc, "div", { className: "eigen-table-wrap" });
        summary.appendChild(summaryTable(doc, data));
        panel.appendChild(summary);
        var qrLedger = element(doc, "div", { className: "eigen-table-wrap" });
        qrLedger.appendChild(qrTable(doc, data));
        panel.appendChild(qrLedger);
        var interpretation = data.matrixClass === "nonnormal"
          ? "非正规：残差和实际角度都能读，但 gap 证书被关闭；不能把对称/正规不等式当成普遍保证。"
          : data.targetEigenvalue === null
            ? "正规但为复谱：实向量角度没有对应的实特征方向，QR ledger 应读成 Schur/旋转行为而非实对角化。"
            : data.spectralGap < 0.1
              ? "小 gap：即使残差下降，单个方向仍敏感；先看 gap 再解释角度。"
              : "对称且有 gap：残差、角度和 gap 可以一起形成可解释的误差账，但仍不是对任意矩阵的承诺。";
        panel.appendChild(element(doc, "p", { className: "eigen-interpretation", text: interpretation }));
        shell.appendChild(panel);
      }
      root.replaceChildren(shell);
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var large = compute({ presetId: "symmetric-gap", steps: 8 });
    assert(large.matrixClass === "symmetric" && large.normalGuarantee, "symmetric classification");
    assert(large.spectrum.real && near(large.spectrum.values[0], 3 + Math.sqrt(2), 1e-9), "symmetric eigenvalue");
    assert(near(large.spectralGap, 2 * Math.sqrt(2), 1e-9), "symmetric spectral gap");
    assert(lastRow(large.power).residual < large.power.rows[0].residual, "power residual decreases");
    assert(lastRow(large.inverse).residual < large.inverse.rows[0].residual, "inverse residual decreases");
    assert(lastRow(large.rayleigh).residual < large.rayleigh.rows[0].residual, "Rayleigh residual decreases");
    assert(lastRow(large.qr).offDiagonal < large.qr.rows[0].offDiagonal, "QR off diagonal decreases");
    assert(lastRow(large.qr).subdiagonal < large.qr.rows[0].subdiagonal, "QR strict lower decreases");
    assert(lastRow(large.rayleigh).certificateBound !== null, "symmetric angle certificate");
    assert(lastRow(large.qr).eigenvalueError < large.qr.rows[0].eigenvalueError, "QR eigenvalue error decreases");
    assert(large.targetVector && near(norm(large.targetVector), 1, 1e-10), "target vector normalized");

    var tinyDiagonal = [[2e-6, 0], [0, 1e-6]];
    var tinyDiagonalSpectrum = eigenvalues2(tinyDiagonal);
    assert(matrixClass(tinyDiagonal) === "symmetric" && isNormal(tinyDiagonal), "tiny diagonal remains normal");
    assert(tinyDiagonalSpectrum.real && near(tinyDiagonalSpectrum.values[0], 2e-6, 1e-10) &&
      near(tinyDiagonalSpectrum.values[1], 1e-6, 1e-10), "tiny diagonal spectrum");
    var tinySolution = solve2(tinyDiagonal, [2e-6, 1e-6]);
    assert(near(tinySolution[0], 1, 1e-10) && near(tinySolution[1], 1, 1e-10), "relative tiny solve");
    var tinyRotation = [[0, -1e-6], [1e-6, 0]];
    assert(isNormal(tinyRotation) && !eigenvalues2(tinyRotation).real, "tiny rotation stays complex normal");
    var scaledNonnormal = [[0, 1e-6], [0, 0]];
    assert(matrixClass(scaledNonnormal) === "nonnormal" && !isNormal(scaledNonnormal),
      "scaled nonnormal classification");
    var singularSolve = false;
    try {
      solve2([[1, 0], [0, 0]], [1, 0]);
    } catch (error) {
      singularSolve = error.code === "SINGULAR_SHIFT";
    }
    assert(singularSolve, "singular solve is reported");

    var small = compute({ presetId: "symmetric-small-gap", steps: 8 });
    assert(small.matrixClass === "symmetric" && small.spectralGap < large.spectralGap, "small gap classification");
    assert(lastRow(small.rayleigh).certificateBound !== null, "small gap still has formal certificate");
    assert(small.spectralGap > 0, "small gap is separated");

    var nonnormal = compute({ presetId: "nonnormal", steps: 8 });
    assert(nonnormal.matrixClass === "nonnormal" && !nonnormal.normalGuarantee, "nonnormal classification");
    assert(lastRow(nonnormal.power).certificateBound === null, "nonnormal power has no angle certificate");
    assert(lastRow(nonnormal.inverse).certificateBound === null, "nonnormal inverse has no angle certificate");
    assert(finite(lastRow(nonnormal.power).residual) && finite(lastRow(nonnormal.power).angleDeg),
      "nonnormal residual and angle remain measurable");
    assert(nonnormal.spectrum.real && near(nonnormal.targetEigenvalue, 2, 1e-10), "nonnormal real target");

    var rotation = compute({ presetId: "normal-rotation", steps: 6 });
    assert(rotation.matrixClass === "normal" && rotation.normalGuarantee, "normal rotation classification");
    assert(!rotation.spectrum.real && rotation.targetEigenvalue === null, "normal complex spectrum");
    assert(lastRow(rotation.power).angleDeg === null && lastRow(rotation.qr).angleDeg === null,
      "complex spectrum has no real target angle");
    assert(finite(lastRow(rotation.qr).offDiagonal), "normal QR remains finite");

    var qr = qrDecompose([[4, 1], [1, 2]]);
    assert(matrixFrobenius(subtractMatrices(matMul(transpose(qr.Q), qr.Q), identity(2))) < 1e-8,
      "QR columns orthonormal");
    assert(matrixFrobenius(subtractMatrices(matMul(qr.Q, qr.R), [[4, 1], [1, 2]])) < 1e-8,
      "QR factorization reconstructs");
    var rankDeficient = [[1, 0], [0, 0]];
    var rankQr = qrDecompose(rankDeficient);
    assert(rankQr.R[1][1] === 0, "rank deficient QR keeps zero diagonal");
    assert(matrixFrobenius(subtractMatrices(matMul(rankQr.Q, rankQr.R), rankDeficient)) < 1e-12,
      "rank deficient QR reconstructs");
    var rankIteration = qrIteration(rankDeficient, 4, 0);
    assert(near(lastRow(rankIteration).diagonal[0], 1, 1e-12) &&
      near(lastRow(rankIteration).diagonal[1], 0, 1e-12) &&
      near(lastRow(rankIteration).eigenvalueError, 0, 1e-12), "rank deficient QR preserves spectrum");
    var qrNorms = qrIteration([[0, 2], [3, 4]], 0, 0).rows[0];
    assert(near(qrNorms.subdiagonal, 3, 1e-12) && near(qrNorms.offDiagonal, Math.sqrt(13), 1e-12),
      "QR lower and full norms differ correctly");
    assert(near(rayleighQuotient([[4, 1], [1, 2]], [1, 0]), 4, 1e-10), "Rayleigh quotient");
    var exact = inverseIteration([[4, 1], [1, 2]], 4.15, [1, 0.35], 6, 0);
    assert(lastRow(exact).residual < exact.rows[0].residual, "custom inverse iteration");
    var lowerTarget = inverseIteration([[4, 1], [1, 2]], 1.6, [1, 0.35], 8, 0);
    assert(lastRow(lowerTarget).targetIndex === 1 &&
      near(lastRow(lowerTarget).targetEigenvalue, 3 - Math.sqrt(2), 1e-10),
      "inverse target follows actual lower convergence");
    var lowerComputed = compute({ presetId: "symmetric-gap", shift: 1.6, steps: 8 });
    assert(lowerComputed.inverseTargetIndex === 1 &&
      near(lowerComputed.inverseTargetEigenvalue, 3 - Math.sqrt(2), 1e-10),
      "compute exposes inverse target pairing");
    var signedQr = qrIteration([[-3, 0], [0, 2]], 3, 0);
    assert(lastRow(signedQr).targetIndex === 1 && near(lastRow(signedQr).targetEigenvalue, -3, 1e-12),
      "QR target follows actual diagonal pairing");
    var exactRayleigh = rayleighIteration([[2, 0], [0, 1]], [1, 0], 4, 0);
    assert(exactRayleigh.status === "exact-convergence" && exactRayleigh.rows.length === 1,
      "Rayleigh exact convergence is distinct");
    var singularRayleigh = rayleighIteration([[2, 6], [0, 1]], [1, 6], 4, 0);
    assert(singularRayleigh.status === "singular-shift" && lastRow(singularRayleigh).residual > 1,
      "Rayleigh singular shift is a failure");
    assert(PRESETS.every(function (preset) { return /^预设 [A-D]$/.test(preset.label); }),
      "preset labels do not disclose answers");
    assert(STYLE_TEXT.indexOf("min-height:44px") !== -1, "controls keep 44px target");
    PRESETS.forEach(function (preset) {
      var result = compute({ presetId: preset.id, steps: 4 });
      assert(result.qr.rows.length === 5, preset.id + " QR row count");
      assert(result.power.rows.length >= 1 && result.inverse.rows.length >= 1, preset.id + " iteration rows");
      assert(result.matrixClass === "symmetric" || result.matrixClass === "normal" || result.matrixClass === "nonnormal",
        preset.id + " classification");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    dot: dot,
    norm: norm,
    normalize: normalize,
    matVec: matVec,
    matMul: matMul,
    solve2: solve2,
    isSymmetric: isSymmetric,
    isNormal: isNormal,
    eigenvalues2: eigenvalues2,
    eigenvector2: eigenvector2,
    spectralInfo: spectralInfo,
    rayleighQuotient: rayleighQuotient,
    powerIteration: powerIteration,
    inverseIteration: inverseIteration,
    rayleighIteration: rayleighIteration,
    qrDecompose: qrDecompose,
    strictLowerNorm: strictLowerNorm,
    fullOffDiagonalNorm: fullOffDiagonalNorm,
    qrIteration: qrIteration,
    symmetricQrIteration: qrIteration,
    compute: compute,
    mount: mount,
    selfTest: selfTest
  };
});
