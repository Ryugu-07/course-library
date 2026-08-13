(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cg-spectrum-lab-styles";
  var INSTANCE = 0;
  var MACHINE_EPS = 2.220446049250313e-16;
  var EPS = 1e-12;
  var MAX_DIM = 256;

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function copyArray(values) {
    return values.slice();
  }

  function dot(a, b) {
    var total = 0;
    for (var i = 0; i < a.length; i += 1) total += a[i] * b[i];
    return total;
  }

  function norm2(values) {
    var squared = dot(values, values);
    return Math.sqrt(Math.max(0, squared));
  }

  function diagonalApply(diagonal, vector) {
    return vector.map(function (value, index) { return diagonal[index] * value; });
  }

  function subtract(a, b) {
    return a.map(function (value, index) { return value - b[index]; });
  }

  function addScaled(a, b, scale) {
    return a.map(function (value, index) { return value + scale * b[index]; });
  }

  function scaleVector(values, scale) {
    return values.map(function (value) { return value * scale; });
  }

  function maxAbs(values) {
    var maximum = 0;
    values.forEach(function (value) { maximum = Math.max(maximum, Math.abs(value)); });
    return maximum;
  }

  function vectorDifferenceNorm(a, b) {
    return norm2(a.map(function (value, index) { return value - b[index]; }));
  }

  function nearlyEqual(a, b, tolerance) {
    return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function linspace(start, end, count) {
    if (count < 1) return [];
    if (count === 1) return [start];
    var step = (end - start) / (count - 1);
    return Array.apply(null, Array(count)).map(function (_, index) {
      return start + index * step;
    });
  }

  function repeated(values) {
    var result = [];
    values.forEach(function (item) {
      for (var i = 0; i < item.count; i += 1) result.push(item.value);
    });
    return result;
  }

  function allOnes(count) {
    return Array.apply(null, Array(count)).map(function () { return 1; });
  }

  function onlyEndpointWeights(count) {
    var weights = Array.apply(null, Array(count)).map(function () { return 0; });
    if (count > 0) weights[0] = 1;
    if (count > 1) weights[count - 1] = 1;
    return weights;
  }

  function spectralBucketPreconditioner(values, bucketLevels) {
    var result = Array(values.length).fill(1);
    var groupSize = Math.ceil(values.length / bucketLevels.length);
    for (var index = 0; index < values.length; index += 1) {
      var bucket = Math.min(bucketLevels.length - 1, Math.floor(index / groupSize));
      result[index] = values[index] / bucketLevels[bucket];
    }
    return result;
  }

  function cloneSystemSpec(system) {
    return {
      id: system.id,
      label: system.label,
      description: system.description,
      lambdas: copyArray(system.lambdas),
      xTrue: copyArray(system.xTrue),
      x0: system.x0 ? copyArray(system.x0) : undefined,
      b: system.b ? copyArray(system.b) : undefined,
      preconditioner: system.preconditioner ? copyArray(system.preconditioner) : undefined
    };
  }

  function createPresets() {
    var uniform = linspace(1, 25, 12);
    var clustered = repeated([
      { count: 4, value: 1 },
      { count: 4, value: 8 },
      { count: 4, value: 25 }
    ]);
    var preconditioner = spectralBucketPreconditioner(uniform, [1, 1.25, 1.5]);
    var boundaryLambdas = repeated([{ count: 4, value: 7 }]);
    return [
      {
        id: "same-kappa",
        label: "同 κ：均匀谱 vs 三簇谱",
        shortLabel: "同 κ 谱形",
        question: "在相同 κ=25、相同初始权重下，哪一组会更早收敛？",
        expected: "clustered",
        description: "两个 n=12 的对角 SPD 系统都有 λmin=1、λmax=25；一个均匀铺开，一个只落在三个特征值簇上。",
        systems: [
          {
            id: "uniform",
            label: "均匀谱",
            description: "12 个特征值均匀铺在 [1,25]",
            lambdas: uniform,
            xTrue: allOnes(12)
          },
          {
            id: "clustered",
            label: "三簇谱",
            description: "λ=1、8、25 各重复 4 次",
            lambdas: clustered,
            xTrue: allOnes(12)
          }
        ]
      },
      {
        id: "direction-weights",
        label: "同谱：初始方向权重",
        shortLabel: "方向权重",
        question: "同一个均匀谱下，哪一种初始误差会让 CG 更早结束？",
        expected: "endpoints",
        description: "矩阵和 κ 完全不变，只改变 e₀ 在特征向量方向上的权重；零权重方向不会出现在这次问题的误差多项式里。",
        systems: [
          {
            id: "visible",
            label: "所有方向可见",
            description: "e₀ 在 12 个对角特征方向都有权重",
            lambdas: uniform,
            xTrue: allOnes(12)
          },
          {
            id: "endpoints",
            label: "只看首尾方向",
            description: "e₀ 只落在 λ=1 与 λ=25 方向",
            lambdas: uniform,
            xTrue: onlyEndpointWeights(12)
          }
        ]
      },
      {
        id: "preconditioned",
        label: "透明预条件：分组对角 M",
        shortLabel: "预条件",
        question: "把均匀谱交给分组对角预条件器后，哪一条会更早收敛？",
        expected: "pcg",
        description: "同一 A 与同一 b；PCG 使用透明的谱分箱对角 M，把有效谱 μᵢ=λᵢ/mᵢ 压成三个值。这个 M 是教学 toy，不冒充通用工业预条件器。",
        systems: [
          {
            id: "raw",
            label: "原始 CG",
            description: "M=I，直接在 A 上迭代",
            lambdas: uniform,
            xTrue: allOnes(12)
          },
          {
            id: "pcg",
            label: "PCG · 分组 M",
            description: "M 的每组条目为 λᵢ/[1,1.25,1.5]；μᵢ 恰为三档",
            lambdas: uniform,
            xTrue: allOnes(12),
            preconditioner: preconditioner
          }
        ]
      },
      {
        id: "boundaries",
        label: "边界：κ=1 与零残差",
        shortLabel: "边界情况",
        question: "哪个边界状态不需要真正做一次矩阵乘向量？",
        expected: "zero",
        description: "用同一个标量谱检查 κ=1 的一步解和 r₀=0 的零步解；这两种情况不能塞进通用公式的除法里。",
        systems: [
          {
            id: "kappa-one",
            label: "κ=1：一步精确",
            description: "A=7I，非零初始误差",
            lambdas: boundaryLambdas,
            xTrue: [1, 0.5, -1, 2]
          },
          {
            id: "zero",
            label: "零残差：零步",
            description: "x₀=x*=0，所以 b-Ax₀=0",
            lambdas: boundaryLambdas,
            xTrue: [0, 0, 0, 0]
          }
        ]
      }
    ];
  }

  var PRESETS = createPresets();

  function getPreset(id) {
    for (var i = 0; i < PRESETS.length; i += 1) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return PRESETS[0];
  }

  function clonePreset(preset) {
    return {
      id: preset.id,
      label: preset.label,
      shortLabel: preset.shortLabel,
      question: preset.question,
      expected: preset.expected,
      description: preset.description,
      systems: preset.systems.map(cloneSystemSpec)
    };
  }

  function normalizeSystem(spec) {
    if (!spec || !Array.isArray(spec.lambdas) || !spec.lambdas.length) {
      throw new Error("CG system needs a non-empty diagonal spectrum");
    }
    if (spec.lambdas.length > MAX_DIM) {
      throw new Error("CG teaching model is intentionally limited to n=" + MAX_DIM);
    }
    var lambdas = spec.lambdas.map(function (value, index) {
      var lambda = Number(value);
      if (!isFiniteNumber(lambda) || lambda <= 0) {
        throw new Error("SPD diagonal entry must be positive at index " + index);
      }
      return lambda;
    });
    var n = lambdas.length;
    var xTrue = spec.xTrue === undefined
      ? allOnes(n)
      : spec.xTrue.map(Number);
    if (xTrue.length !== n || xTrue.some(function (value) { return !isFiniteNumber(value); })) {
      throw new Error("xTrue must have one finite entry per diagonal direction");
    }
    var x0 = spec.x0 === undefined ? Array(n).fill(0) : spec.x0.map(Number);
    if (x0.length !== n || x0.some(function (value) { return !isFiniteNumber(value); })) {
      throw new Error("x0 must have one finite entry per diagonal direction");
    }
    var b = spec.b === undefined
      ? diagonalApply(lambdas, xTrue)
      : spec.b.map(Number);
    if (b.length !== n || b.some(function (value) { return !isFiniteNumber(value); })) {
      throw new Error("b must have one finite entry per diagonal direction");
    }
    var hasPreconditioner = spec.preconditioner !== undefined || spec.M !== undefined;
    var mInput = spec.preconditioner !== undefined ? spec.preconditioner : spec.M;
    var preconditioner = mInput === undefined ? Array(n).fill(1) : mInput.map(Number);
    if (preconditioner.length !== n || preconditioner.some(function (value) {
      return !isFiniteNumber(value) || value <= 0;
    })) {
      throw new Error("diagonal preconditioner must be positive and match n");
    }
    var requestedSteps = spec.maxSteps === undefined ? n : Number(spec.maxSteps);
    if (!isFiniteNumber(requestedSteps)) requestedSteps = n;
    requestedSteps = Math.floor(requestedSteps);
    var maxSteps = clamp(requestedSteps, 0, n);
    var tolerance = spec.tol === undefined ? 1e-12 : Number(spec.tol);
    if (!isFiniteNumber(tolerance) || tolerance < 0) {
      throw new Error("tol must be a finite non-negative number");
    }
    var effectiveSpectrum = lambdas.map(function (lambda, index) {
      return lambda / preconditioner[index];
    });
    var lambdaMin = Math.min.apply(null, lambdas);
    var lambdaMax = Math.max.apply(null, lambdas);
    var effectiveMin = Math.min.apply(null, effectiveSpectrum);
    var effectiveMax = Math.max.apply(null, effectiveSpectrum);
    return {
      id: spec.id || "system",
      label: spec.label || "对角 SPD 系统",
      description: spec.description || "",
      n: n,
      lambdas: lambdas,
      xTrue: xTrue,
      x0: x0,
      b: b,
      preconditioner: preconditioner,
      hasPreconditioner: hasPreconditioner,
      method: hasPreconditioner ? "PCG" : "CG",
      maxSteps: maxSteps,
      tolerance: tolerance,
      effectiveSpectrum: effectiveSpectrum,
      lambdaMin: lambdaMin,
      lambdaMax: lambdaMax,
      kappa: lambdaMax / lambdaMin,
      effectiveMin: effectiveMin,
      effectiveMax: effectiveMax,
      effectiveKappa: effectiveMax / effectiveMin
    };
  }

  function chebyshevBounds(kappa, step) {
    var k = Math.max(0, Math.floor(Number(step)));
    var condition = Number(kappa);
    if (!isFiniteNumber(condition) || condition < 1) {
      throw new Error("Chebyshev bound needs kappa >= 1");
    }
    if (condition <= 1 + 32 * MACHINE_EPS) {
      return {
        factor: 0,
        raw: k === 0 ? 2 : 0,
        bound: k === 0 ? 1 : 0
      };
    }
    var factor = (Math.sqrt(condition) - 1) / (Math.sqrt(condition) + 1);
    var raw = k === 0 ? 2 : 2 * Math.pow(factor, k);
    return { factor: factor, raw: raw, bound: Math.min(1, raw) };
  }

  function weightedEnergy(lambdas, error, total) {
    if (!(total > 0)) return lambdas.map(function () { return 0; });
    return lambdas.map(function (lambda, index) {
      return lambda * error[index] * error[index] / (total * total);
    });
  }

  function residualFilter(r0, residual) {
    var scale = Math.max(1, norm2(r0));
    return residual.map(function (value, index) {
      return Math.abs(r0[index]) > MACHINE_EPS * scale * 8
        ? value / r0[index]
        : null;
    });
  }

  function runCG(input) {
    var system = normalizeSystem(input);
    var n = system.n;
    var x = copyArray(system.x0);
    var r = subtract(system.b, diagonalApply(system.lambdas, x));
    var rTrue = subtract(system.b, diagonalApply(system.lambdas, x));
    var r0 = copyArray(r);
    var initialResidualNorm = norm2(r0);
    var initialError = subtract(system.xTrue, system.x0);
    var initialANorm = Math.sqrt(Math.max(0, dot(system.lambdas, initialError.map(function (value) {
      return value * value;
    }))));
    var residualScale = Math.max(1, initialResidualNorm);
    var zeroTolerance = system.tolerance * residualScale;
    var z = r.map(function (value, index) { return value / system.preconditioner[index]; });
    var rho = dot(r, z);
    var p = rho > 0 ? copyArray(z) : null;
    var energyWeights = weightedEnergy(system.lambdas, initialError, initialANorm);
    var rows = [];
    var termination = "step-limit";

    function makeRow(step, alpha, beta, direction, rhoValue) {
      var error = subtract(system.xTrue, x);
      var errorEnergy = Math.sqrt(Math.max(0, dot(system.lambdas, error.map(function (value) {
        return value * value;
      }))));
      var directResidual = subtract(system.b, diagonalApply(system.lambdas, x));
      var recurrenceGap = vectorDifferenceNorm(r, directResidual);
      var cheb = chebyshevBounds(system.effectiveKappa, step);
      return {
        k: step,
        x: copyArray(x),
        error: error,
        r: copyArray(r),
        trueResidual: directResidual,
        direction: direction ? copyArray(direction) : null,
        rho: rhoValue,
        alpha: alpha,
        beta: beta,
        aNormError: errorEnergy,
        aNormErrorNormalized: initialANorm > 0 ? errorEnergy / initialANorm : 0,
        residualNorm: norm2(r),
        trueResidualNorm: norm2(directResidual),
        residualNormalized: initialResidualNorm > 0 ? norm2(directResidual) / initialResidualNorm : 0,
        recurrenceGap: recurrenceGap,
        filter: residualFilter(r0, r),
        chebyshevRaw: cheb.raw,
        chebyshevBound: cheb.bound
      };
    }

    rows.push(makeRow(0, null, null, p, rho));
    if (initialResidualNorm <= zeroTolerance || rho <= zeroTolerance * zeroTolerance) {
      termination = "zero-residual";
    } else if (system.maxSteps === 0) {
      termination = "step-limit";
    } else {
      for (var step = 0; step < system.maxSteps; step += 1) {
        var current = rows[rows.length - 1];
        if (!p) {
          termination = "breakdown";
          break;
        }
        var Ap = diagonalApply(system.lambdas, p);
        var denominator = dot(p, Ap);
        if (!(denominator > 0) || !isFiniteNumber(denominator)) {
          termination = "breakdown";
          break;
        }
        var alpha = rho / denominator;
        if (!isFiniteNumber(alpha)) {
          termination = "breakdown";
          break;
        }
        x = addScaled(x, p, alpha);
        r = addScaled(r, Ap, -alpha);
        rTrue = subtract(system.b, diagonalApply(system.lambdas, x));
        var zNext = r.map(function (value, index) { return value / system.preconditioner[index]; });
        var rhoNext = dot(r, zNext);
        var nearZero = norm2(r) <= zeroTolerance || rhoNext <= zeroTolerance * zeroTolerance;
        var beta = nearZero ? 0 : rhoNext / rho;
        if (!nearZero && (!isFiniteNumber(beta) || beta < 0)) {
          termination = "breakdown";
          break;
        }
        current.alpha = alpha;
        current.beta = beta;
        var pNext = nearZero ? null : addScaled(zNext, p, beta);
        var nextRow = makeRow(step + 1, null, null, pNext, nearZero ? 0 : rhoNext);
        rows.push(nextRow);
        rTrue = nextRow.trueResidual;
        if (nearZero) {
          termination = "zero-residual";
          break;
        }
        p = pNext;
        rho = rhoNext;
        if (step + 1 >= system.maxSteps) termination = "step-limit";
      }
    }

    var last = rows[rows.length - 1];
    var convergenceStep = null;
    rows.some(function (row) {
      if (row.aNormErrorNormalized <= Math.max(system.tolerance, 1e-14)) {
        convergenceStep = row.k;
        return true;
      }
      return false;
    });
    if (convergenceStep === null && termination === "zero-residual") convergenceStep = last.k;
    return {
      id: system.id,
      label: system.label,
      description: system.description,
      method: system.method,
      system: system,
      n: n,
      maxSteps: system.maxSteps,
      rows: rows,
      initialResidualNorm: initialResidualNorm,
      initialANorm: initialANorm,
      initialError: initialError,
      initialEnergyWeights: energyWeights,
      lambdaMin: system.lambdaMin,
      lambdaMax: system.lambdaMax,
      kappa: system.kappa,
      effectiveSpectrum: copyArray(system.effectiveSpectrum),
      effectiveMin: system.effectiveMin,
      effectiveMax: system.effectiveMax,
      effectiveKappa: system.effectiveKappa,
      termination: termination,
      convergenceStep: convergenceStep,
      requestedMaxSteps: system.maxSteps,
      finitePrecisionNote: last.recurrenceGap > 0
    };
  }

  function maxRelativeError(actual, expected) {
    var maximum = 0;
    for (var i = 0; i < actual.length; i += 1) {
      maximum = Math.max(
        maximum,
        Math.abs(actual[i] - expected[i]) / Math.max(1, Math.abs(actual[i]), Math.abs(expected[i]))
      );
    }
    return maximum;
  }

  function checkRun(run) {
    var system = run.system;
    var rows = run.rows;
    var scale = Math.max(1, run.initialResidualNorm, run.initialANorm);
    var residualGap = 0;
    var explicitResidual = true;
    var recurrence = true;
    var aNormMonotone = true;
    var boundRespected = true;
    var dimensionBound = rows.length > 0 && rows[rows.length - 1].k <= system.n;
    for (var i = 0; i < rows.length; i += 1) {
      var row = rows[i];
      var direct = subtract(system.b, diagonalApply(system.lambdas, row.x));
      residualGap = Math.max(residualGap, row.recurrenceGap, vectorDifferenceNorm(row.trueResidual, direct));
      explicitResidual = explicitResidual && nearlyEqual(row.trueResidualNorm, norm2(direct), 1e-9);
      if (i > 0) {
        aNormMonotone = aNormMonotone && row.aNormErrorNormalized <= rows[i - 1].aNormErrorNormalized + 1e-9;
      }
      boundRespected = boundRespected && row.aNormErrorNormalized <= row.chebyshevBound + 2e-8;
      if (row.alpha !== null && i + 1 < rows.length) {
        var next = rows[i + 1];
        var expectedX = addScaled(row.x, row.direction, row.alpha);
        var expectedR = addScaled(row.r, diagonalApply(system.lambdas, row.direction), -row.alpha);
        recurrence = recurrence && maxRelativeError(next.x, expectedX) <= 2e-8;
        recurrence = recurrence && maxRelativeError(next.r, expectedR) <= 2e-8;
        if (next.direction && row.beta !== null) {
          var nextZ = next.r.map(function (value, index) {
            return value / system.preconditioner[index];
          });
          var expectedP = addScaled(nextZ, row.direction, row.beta);
          recurrence = recurrence && maxRelativeError(next.direction, expectedP) <= 2e-8;
        }
      }
    }
    var directions = rows.map(function (row) { return row.direction; }).filter(Boolean);
    var conjugate = true;
    for (var left = 0; left < directions.length; left += 1) {
      for (var right = 0; right < left; right += 1) {
        var product = dot(directions[left], diagonalApply(system.lambdas, directions[right]));
        var productScale = Math.max(1, norm2(directions[left]) * norm2(directions[right]) * system.lambdaMax);
        if (Math.abs(product) > 2e-7 * productScale) conjugate = false;
      }
    }
    var zeroInitial = run.initialResidualNorm === 0
      ? rows.length === 1 && rows[0].trueResidualNorm === 0
      : true;
    var ok = residualGap <= 2e-8 * scale && explicitResidual && recurrence &&
      aNormMonotone && boundRespected && dimensionBound && conjugate && zeroInitial;
    return {
      ok: ok,
      recurrenceMatchesExplicit: residualGap <= 2e-8 * scale,
      explicitResidual: explicitResidual,
      recurrence: recurrence,
      aNormMonotone: aNormMonotone,
      chebyshevBound: boundRespected,
      directionConjugacy: conjugate,
      dimensionBound: dimensionBound,
      zeroResidualBoundary: zeroInitial,
      maxRecurrenceGap: residualGap,
      finalStep: rows.length ? rows[rows.length - 1].k : null
    };
  }

  function assertRun(run) {
    var checks = checkRun(run);
    if (!checks.ok) {
      throw new Error("CG invariant failed: " + JSON.stringify(checks));
    }
    return checks;
  }

  function buildPresetData(id, options) {
    var preset = getPreset(id);
    var settings = options || {};
    var runs = preset.systems.map(function (system) {
      var spec = cloneSystemSpec(system);
      if (settings.maxSteps !== undefined) spec.maxSteps = settings.maxSteps;
      if (settings.tol !== undefined) spec.tol = settings.tol;
      return runCG(spec);
    });
    return {
      preset: clonePreset(preset),
      runs: runs,
      checks: runs.map(checkRun),
      maxStep: runs.reduce(function (maximum, run) {
        return Math.max(maximum, run.rows[run.rows.length - 1].k);
      }, 0)
    };
  }

  function assertPreset(id) {
    var data = buildPresetData(id);
    data.runs.forEach(assertRun);
    return data;
  }

  var pureModel = {
    EPS: EPS,
    MAX_DIM: MAX_DIM,
    presets: PRESETS.map(clonePreset),
    chebyshevBounds: chebyshevBounds,
    normalizeSystem: normalizeSystem,
    runCG: runCG,
    checkRun: checkRun,
    assertRun: assertRun,
    buildPresetData: buildPresetData,
    assertPreset: assertPreset
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    return;
  }

  var STYLE_TEXT = [
    ".cg-lab { --cg-blue: var(--cl-blue, #315f9d); --cg-green: var(--cl-green, #39734d); --cg-gold: var(--cl-gold, #9b6a12); --cg-red: var(--cl-red, #b64335); --cg-muted: var(--fg-soft, #6f6a60); max-width: 100%; min-width: 0; overflow: hidden; color: var(--fg); line-height: 1.55; }",
    "html[data-theme=\"dark\"] .cg-lab { --cg-blue: #83c8ff; --cg-green: #72bd8b; --cg-gold: #e2b458; --cg-red: #f08c7d; --cg-muted: #b8b2a7; }",
    ".cg-lab *, .cg-lab *::before, .cg-lab *::after { box-sizing: border-box; min-width: 0; }",
    ".cg-lab .cg-intro, .cg-lab .cg-note { color: var(--cg-muted); font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; }",
    ".cg-lab .cg-prompt { margin: 12px 0 16px; padding: 11px 13px; border-left: 3px solid var(--cg-gold); background: var(--block-bg, var(--bg)); line-height: 1.7; overflow-wrap: anywhere; }",
    ".cg-lab .cg-layout { display: grid; grid-template-columns: minmax(215px, .72fr) minmax(0, 1.28fr); gap: 16px; align-items: start; min-width: 0; }",
    ".cg-lab .cg-control-panel, .cg-lab .cg-stage { min-width: 0; }",
    ".cg-lab .cg-control-panel { display: grid; gap: 12px; padding: 12px; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); }",
    ".cg-lab .cg-preset-box, .cg-lab .cg-prediction-box { margin: 0; padding: 0; border: 0; min-width: 0; }",
    ".cg-lab .cg-preset-box legend, .cg-lab .cg-prediction-box legend { margin-bottom: 7px; color: var(--cg-muted); font-size: 13px; font-weight: 700; }",
    ".cg-lab .cg-preset-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }",
    ".cg-lab button, .cg-lab select { min-width: 0; min-height: 44px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.35; }",
    ".cg-lab button { padding: 8px 10px; cursor: pointer; overflow-wrap: anywhere; }",
    ".cg-lab button:hover { border-color: var(--accent); }",
    ".cg-lab button[aria-pressed=\"true\"], .cg-lab button.cg-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); font-weight: 700; }",
    ".cg-lab select { width: 100%; padding: 7px 10px; }",
    ".cg-lab button:focus-visible, .cg-lab select:focus-visible, .cg-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".cg-lab .cg-control { display: grid; gap: 5px; min-width: 0; }",
    ".cg-lab .cg-label { color: var(--cg-muted); font-size: 13px; font-weight: 650; }",
    ".cg-lab output { color: var(--accent); font-variant-numeric: tabular-nums; }",
    ".cg-lab input[type=range] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
    ".cg-lab .cg-button-row { display: flex; flex-wrap: wrap; gap: 7px; }",
    ".cg-lab .cg-button-row > * { flex: 1 1 120px; }",
    ".cg-lab .cg-feedback { min-height: 2.9em; margin: 8px 0 0; color: var(--cg-muted); font-size: 12.5px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".cg-lab .cg-feedback.cg-correct { color: var(--cg-green); }",
    ".cg-lab .cg-feedback.cg-incorrect { color: var(--cg-red); }",
    ".cg-lab .cg-stage-frame { min-width: 0; padding: 9px; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); overflow: hidden; }",
    ".cg-lab .cg-stage-title { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin: 0 0 7px; color: var(--cg-muted); font-size: 13px; }",
    ".cg-lab .cg-status { min-height: 1.7em; margin: 0 0 8px; color: var(--fg); font-size: 13px; font-weight: 650; line-height: 1.7; overflow-wrap: anywhere; }",
    ".cg-lab .cg-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--fg); }",
    ".cg-lab .cg-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".cg-lab .cg-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.1; }",
    ".cg-lab .cg-grid-line { stroke: var(--border); stroke-opacity: .55; stroke-width: 1; }",
    ".cg-lab .cg-axis { stroke: var(--cg-muted); stroke-opacity: .7; stroke-width: 1.2; }",
    ".cg-lab .cg-a-line { fill: none; stroke: var(--cg-blue); stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }",
    ".cg-lab .cg-r-line { fill: none; stroke: var(--cg-red); stroke-width: 2.2; stroke-dasharray: 6 4; stroke-linecap: round; stroke-linejoin: round; }",
    ".cg-lab .cg-bound-line { fill: none; stroke: var(--cg-gold); stroke-width: 1.8; stroke-dasharray: 2 4; stroke-linecap: round; stroke-linejoin: round; }",
    ".cg-lab .cg-a-dot { fill: var(--cg-blue); stroke: var(--bg); stroke-width: 2; }",
    ".cg-lab .cg-r-dot { fill: var(--cg-red); stroke: var(--bg); stroke-width: 2; }",
    ".cg-lab .cg-bound-dot { fill: var(--cg-gold); stroke: var(--bg); stroke-width: 1.5; }",
    ".cg-lab .cg-svg-label { fill: var(--cg-muted) !important; font-size: 11px; }",
    ".cg-lab .cg-svg-title { fill: var(--fg) !important; font-size: 12.5px; font-weight: 750; }",
    ".cg-lab .cg-legend { display: flex; flex-wrap: wrap; gap: 7px 14px; margin: 8px 2px 0; color: var(--cg-muted); font-size: 12px; }",
    ".cg-lab .cg-legend-item { display: inline-flex; align-items: center; gap: 6px; }",
    ".cg-lab .cg-swatch { display: inline-block; width: 24px; height: 0; border-top: 3px solid currentColor; }",
    ".cg-lab .cg-swatch-a { color: var(--cg-blue); } .cg-lab .cg-swatch-r { color: var(--cg-red); border-top-style: dashed; border-top-width: 2px; } .cg-lab .cg-swatch-bound { color: var(--cg-gold); border-top-style: dotted; border-top-width: 2px; }",
    ".cg-lab .cg-subtitle { margin: 17px 0 7px; color: var(--fg); font-size: 14px; font-weight: 750; }",
    ".cg-lab .cg-metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 8px; margin-top: 10px; }",
    ".cg-lab .cg-metric { min-width: 0; padding: 9px 10px; border-top: 2px solid var(--border); background: var(--bg); }",
    ".cg-lab .cg-metric span, .cg-lab .cg-metric small { display: block; color: var(--cg-muted); line-height: 1.45; }",
    ".cg-lab .cg-metric span { font-size: 11.5px; } .cg-lab .cg-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; } .cg-lab .cg-metric small { margin-top: 3px; font-size: 11px; overflow-wrap: anywhere; }",
    ".cg-lab .cg-spectrum-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }",
    ".cg-lab .cg-spectrum-card { min-width: 0; padding: 10px; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); overflow: hidden; }",
    ".cg-lab .cg-spectrum-card h4 { margin: 0; font-size: 13.5px; } .cg-lab .cg-spectrum-card p { margin: 5px 0; color: var(--cg-muted); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }",
    ".cg-lab .cg-spectrum-svg { display: block; width: 100%; height: auto; color: var(--fg); } .cg-lab .cg-spectrum-svg text { fill: currentColor; font-family: inherit; font-size: 10px; }",
    ".cg-lab .cg-spectrum-base { stroke: var(--border); stroke-width: 2; } .cg-lab .cg-spectrum-dot { fill: var(--cg-blue); stroke: var(--bg); stroke-width: 1.5; }",
    ".cg-lab .cg-table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }",
    ".cg-lab .cg-table { width: 100%; min-width: 650px; border-collapse: separate; border-spacing: 0; table-layout: fixed; font-size: 12px; font-variant-numeric: tabular-nums; }",
    ".cg-lab .cg-table.cg-spectrum-table { min-width: 430px; }",
    ".cg-lab .cg-table caption { padding: 0 0 7px; text-align: left; color: var(--cg-muted); font-size: 12.5px; }",
    ".cg-lab .cg-table th, .cg-lab .cg-table td { padding: 7px 6px; border-bottom: 1px solid var(--border); text-align: right; vertical-align: top; overflow-wrap: anywhere; }",
    ".cg-lab .cg-table th:first-child, .cg-lab .cg-table td:first-child { text-align: left; } .cg-lab .cg-table th { color: var(--cg-muted); font-size: 11.5px; font-weight: 650; }",
    ".cg-lab .cg-table tr.cg-current td, .cg-lab .cg-table tr.cg-current th { background: color-mix(in srgb, var(--accent) 10%, var(--bg)); }",
    ".cg-lab .cg-table .cg-good { color: var(--cg-green); } .cg-lab .cg-table .cg-warn { color: var(--cg-red); }",
    ".cg-lab .cg-checklist { display: grid; gap: 7px; margin: 10px 0 0; padding: 0; list-style: none; }",
    ".cg-lab .cg-checklist li { display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 7px; align-items: start; font-size: 12.5px; line-height: 1.6; } .cg-lab .cg-check { color: var(--cg-green); font-weight: 800; text-align: center; } .cg-lab .cg-fail { color: var(--cg-red); }",
    ".cg-lab .cg-formula, .cg-lab .cg-footnote { max-width: 100%; margin: 9px 0 0; padding: 10px 12px; border-left: 3px solid var(--cg-blue); background: var(--block-bg, var(--bg)); color: var(--cg-muted); font-size: 12.5px; line-height: 1.7; overflow-wrap: anywhere; }",
    ".cg-lab .cg-formula { color: var(--fg); font-family: \"SF Mono\", Menlo, Consolas, monospace; white-space: pre-wrap; }",
    ".cg-lab .cg-footnote { border-left-color: var(--cg-gold); }",
    ".cg-lab .cg-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }",
    "@supports not (color: color-mix(in srgb, white, black)) { .cg-lab .cg-table tr.cg-current td, .cg-lab .cg-table tr.cg-current th { background: var(--block-bg, var(--bg)); } }",
    "@media (max-width: 860px) { .cg-lab .cg-layout { grid-template-columns: minmax(0, 1fr); } .cg-lab .cg-control-panel { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; } .cg-lab .cg-preset-box { grid-column: 1 / -1; } .cg-lab .cg-prediction-box { grid-column: 1 / -1; } }",
    "@media (max-width: 640px) { .cg-lab .cg-control-panel { grid-template-columns: minmax(0, 1fr); } .cg-lab .cg-spectrum-grid { grid-template-columns: minmax(0, 1fr); } .cg-lab .cg-preset-box, .cg-lab .cg-prediction-box { grid-column: auto; } .cg-lab .cg-stage-frame { padding: 6px; } }",
    "@media (max-width: 420px) { .cg-lab .cg-preset-row { grid-template-columns: minmax(0, 1fr); } .cg-lab .cg-table { font-size: 11.5px; } .cg-lab .cg-table th, .cg-lab .cg-table td { padding-left: 4px; padding-right: 4px; } }",
    "@media (prefers-reduced-motion: reduce) { .cg-lab *, .cg-lab *::before, .cg-lab *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

  function installStyles() {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    document.head.appendChild(style);
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function makeElement(api, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(document.createElement(tag), attrs || {}), children);
  }

  function makeSvg(api, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(
      setAttributes(document.createElementNS(SVG_NS, tag), attrs || {}),
      children
    );
  }

  function replaceChildren(node, children) {
    if (node && typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    while (node && node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children);
  }

  function formatNumber(api, value, digits) {
    if (!isFiniteNumber(value)) return "—";
    if (Math.abs(value) < 0.0005) value = 0;
    if (api && typeof api.format === "function") return api.format(value, digits === undefined ? 3 : digits);
    var places = digits === undefined ? 3 : digits;
    var text = value.toFixed(places);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function rowAt(run, step) {
    for (var i = 0; i < run.rows.length; i += 1) {
      if (run.rows[i].k === step) return run.rows[i];
    }
    return run.rows[run.rows.length - 1];
  }

  function metric(api, label, value, note) {
    return makeElement(api, "div", { className: "cg-metric" }, [
      makeElement(api, "span", {}, [label]),
      makeElement(api, "strong", {}, [value]),
      note ? makeElement(api, "small", {}, [note]) : null
    ]);
  }

  function pathFor(rows, key, x0, x1, y0, y1, maxStep) {
    if (!rows.length) return "";
    var logMin = -14;
    var logMax = 0;
    function coordinate(value) {
      var safe = clamp(isFiniteNumber(value) && value > 0 ? value : Math.pow(10, logMin), Math.pow(10, logMin), 1);
      var logarithm = Math.log(safe) / Math.LN10;
      return y1 - (logarithm - logMin) / (logMax - logMin) * (y1 - y0);
    }
    var path = "";
    rows.forEach(function (row, index) {
      var x = x0 + (maxStep > 0 ? row.k / maxStep : 0) * (x1 - x0);
      var y = coordinate(row[key]);
      path += (index === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " ";
    });
    return path.trim();
  }

  function chartPoint(api, cssClass, row, property, label, x0, x1, y0, y1, maxStep) {
    var value = row[property];
    var safe = clamp(isFiniteNumber(value) && value > 0 ? value : Math.pow(10, -14), Math.pow(10, -14), 1);
    var logarithm = Math.log(safe) / Math.LN10;
    var x = x0 + (maxStep > 0 ? row.k / maxStep : 0) * (x1 - x0);
    var y = y1 - (logarithm + 14) / 14 * (y1 - y0);
    return makeSvg(api, "circle", {
      className: cssClass,
      cx: x,
      cy: y,
      r: 4,
      "aria-label": "第 " + row.k + " 步，" + label + "=" + value
    });
  }

  function renderComparison(api, data, step, uid) {
    var width = 720;
    var panelHeight = 246;
    var height = panelHeight * data.runs.length;
    var svg = makeSvg(api, "svg", {
      className: "cg-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": uid + "-chart-title " + uid + "-chart-desc"
    });
    svg.appendChild(makeSvg(api, "title", { id: uid + "-chart-title" }, ["CG 收敛曲线"]));
    svg.appendChild(makeSvg(api, "desc", { id: uid + "-chart-desc" }, [
      "每个面板显示归一化 A 范数误差、归一化真残差二范数和 Chebyshev 条件数上界；纵轴为对数刻度。"
    ]));
    var maxStep = data.maxStep;
    var y0 = 47;
    var y1 = 198;
    var x0 = 54;
    var x1 = 692;
    data.runs.forEach(function (run, index) {
      var top = index * panelHeight;
      var panel = makeSvg(api, "g", { transform: "translate(0," + top + ")" });
      panel.appendChild(makeSvg(api, "rect", {
        className: "cg-panel",
        x: 1,
        y: 1,
        width: width - 2,
        height: panelHeight - 4,
        rx: 5
      }));
      panel.appendChild(makeSvg(api, "text", { className: "cg-svg-title", x: 12, y: 22 }, [
        run.label + " · " + run.method + " · κ_eff=" + formatNumber(api, run.effectiveKappa, 3)
      ]));
      [-0, -4, -8, -12].forEach(function (power) {
        var y = y1 - (power + 14) / 14 * (y1 - y0);
        panel.appendChild(makeSvg(api, "line", { className: "cg-grid-line", x1: x0, x2: x1, y1: y, y2: y }));
        panel.appendChild(makeSvg(api, "text", { className: "cg-svg-label", x: 8, y: y + 4 }, ["10^" + power]));
      });
      panel.appendChild(makeSvg(api, "line", { className: "cg-axis", x1: x0, x2: x1, y1: y1, y2: y1 }));
      panel.appendChild(makeSvg(api, "line", { className: "cg-axis", x1: x0, x2: x0, y1: y0, y2: y1 }));
      var xTicks = maxStep <= 6 ? maxStep : 6;
      for (var tick = 0; tick <= xTicks; tick += 1) {
        var tickStep = xTicks > 0 ? Math.round(tick * maxStep / xTicks) : 0;
        var tickX = x0 + (maxStep > 0 ? tickStep / maxStep : 0) * (x1 - x0);
        panel.appendChild(makeSvg(api, "text", { className: "cg-svg-label", x: tickX - 5, y: y1 + 17 }, [String(tickStep)]));
      }
      panel.appendChild(makeSvg(api, "text", { className: "cg-svg-label", x: x1 - 16, y: y1 + 17 }, ["k"]));
      panel.appendChild(makeSvg(api, "path", { className: "cg-a-line", d: pathFor(run.rows, "aNormErrorNormalized", x0, x1, y0, y1, maxStep) }));
      panel.appendChild(makeSvg(api, "path", { className: "cg-r-line", d: pathFor(run.rows, "residualNormalized", x0, x1, y0, y1, maxStep) }));
      panel.appendChild(makeSvg(api, "path", { className: "cg-bound-line", d: pathFor(run.rows, "chebyshevBound", x0, x1, y0, y1, maxStep) }));
      var current = rowAt(run, step);
      panel.appendChild(chartPoint(api, "cg-a-dot", current, "aNormErrorNormalized", "A 范数误差", x0, x1, y0, y1, maxStep));
      panel.appendChild(chartPoint(api, "cg-r-dot", current, "residualNormalized", "真残差", x0, x1, y0, y1, maxStep));
      panel.appendChild(chartPoint(api, "cg-bound-dot", current, "chebyshevBound", "Chebyshev 上界", x0, x1, y0, y1, maxStep));
      svg.appendChild(panel);
    });
    return makeElement(api, "div", {}, [
      svg,
      makeElement(api, "div", { className: "cg-legend", "aria-label": "曲线图例" }, [
        makeElement(api, "span", { className: "cg-legend-item" }, [makeElement(api, "span", { className: "cg-swatch cg-swatch-a", "aria-hidden": "true" }), "归一化 ||eₖ||A"]),
        makeElement(api, "span", { className: "cg-legend-item" }, [makeElement(api, "span", { className: "cg-swatch cg-swatch-r", "aria-hidden": "true" }), "归一化真 ||rₖ||₂"]),
        makeElement(api, "span", { className: "cg-legend-item" }, [makeElement(api, "span", { className: "cg-swatch cg-swatch-bound", "aria-hidden": "true" }), "Chebyshev κ 上界"])
      ])
    ]);
  }

  function renderMetrics(api, data, step) {
    var sections = data.runs.map(function (run) {
      var row = rowAt(run, step);
      var stepNote = row.k === step ? "当前步" : "该系统在第 " + row.k + " 步停止";
      return makeElement(api, "section", { className: "cg-metric-section", "aria-labelledby": "cg-metrics-" + run.id }, [
        makeElement(api, "h4", { id: "cg-metrics-" + run.id, className: "cg-subtitle" }, [run.label + " · " + run.method]),
        makeElement(api, "div", { className: "cg-metric-grid" }, [
          metric(api, "当前 k", String(row.k), stepNote),
          metric(api, "归一化 A-范数误差", formatNumber(api, row.aNormErrorNormalized, 7), "||eₖ||A / ||e₀||A；CG 的最小化目标"),
          metric(api, "真残差 ||b−Axₖ||₂", formatNumber(api, row.trueResidualNorm, 7), "每步显式重算，不是只读 recurrence"),
          metric(api, "Chebyshev 上界", formatNumber(api, row.chebyshevBound, 7), "κ_eff=" + formatNumber(api, run.effectiveKappa, 3) + "；最坏情形"),
          metric(api, "κ(A)", formatNumber(api, run.kappa, 4), "原始谱的 λmax / λmin"),
          metric(api, "κ_eff", formatNumber(api, run.effectiveKappa, 4), run.method === "PCG" ? "μᵢ=λᵢ/mᵢ" : "M=I，μᵢ=λᵢ"),
          metric(api, "recurrence−真残差 gap", formatNumber(api, row.recurrenceGap, 8), "||rₖ(rec)−(b−Axₖ)||₂"),
          metric(api, "预计收敛步", run.convergenceStep === null ? "未到" : String(run.convergenceStep), "本 toy 系统的观测，不是定理预测")
        ])
      ]);
    });
    return makeElement(api, "div", {}, sections);
  }

  function renderSpectrumStrip(api, run, row, uid) {
    var width = 680;
    var height = 70;
    var min = run.effectiveMin;
    var max = run.effectiveMax;
    var svg = makeSvg(api, "svg", {
      className: "cg-spectrum-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-label": run.label + " 的有效谱与当前多项式滤波"
    });
    var xLeft = 18;
    var xRight = width - 18;
    var y = 34;
    function x(value) { return xLeft + (max > min ? (value - min) / (max - min) : .5) * (xRight - xLeft); }
    svg.appendChild(makeSvg(api, "line", { className: "cg-spectrum-base", x1: xLeft, x2: xRight, y1: y, y2: y }));
    svg.appendChild(makeSvg(api, "text", { x: xLeft, y: 60 }, [formatNumber(api, min, 3)]));
    svg.appendChild(makeSvg(api, "text", { x: xRight - 25, y: 60 }, [formatNumber(api, max, 3)]));
    run.effectiveSpectrum.forEach(function (value, index) {
      var filter = row.filter[index];
      var opacity = filter === null ? .18 : clamp(.18 + .82 * Math.min(1, Math.abs(filter)), .18, 1);
      var radius = 4 + 9 * Math.sqrt(Math.max(0, run.initialEnergyWeights[index]));
      svg.appendChild(makeSvg(api, "circle", {
        className: "cg-spectrum-dot",
        cx: x(value),
        cy: y,
        r: radius,
        opacity: opacity,
        "aria-label": "方向 " + index + "，有效特征值 " + value + "，初始能量权重 " + run.initialEnergyWeights[index] + "，滤波值 " + (filter === null ? "无初始残差" : filter)
      }));
    });
    svg.appendChild(makeSvg(api, "text", { x: width / 2 - 84, y: 13 }, ["点越大=初始 A-能量权重；越淡=|pₖ(μ)| 小"]));
    return svg;
  }

  function renderSpectrum(api, data, step, uid) {
    return makeElement(api, "div", { className: "cg-spectrum-grid" }, data.runs.map(function (run, index) {
      var row = rowAt(run, step);
      var table = makeElement(api, "table", { className: "cg-table cg-spectrum-table" });
      table.appendChild(makeElement(api, "caption", {}, ["当前第 " + row.k + " 步：有效谱 μᵢ=λᵢ/mᵢ 与 pₖ(μᵢ)"]));
      table.appendChild(makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "col" }, ["i"]),
        makeElement(api, "th", { scope: "col" }, ["λᵢ"]),
        makeElement(api, "th", { scope: "col" }, ["μᵢ"]),
        makeElement(api, "th", { scope: "col" }, ["ωᵢ"]),
        makeElement(api, "th", { scope: "col" }, ["pₖ(μᵢ)"])
      ])]));
      var body = makeElement(api, "tbody");
      run.system.lambdas.forEach(function (lambda, eigenIndex) {
        var filter = row.filter[eigenIndex];
        body.appendChild(makeElement(api, "tr", {}, [
          makeElement(api, "th", { scope: "row" }, [String(eigenIndex)]),
          makeElement(api, "td", {}, [formatNumber(api, lambda, 4)]),
          makeElement(api, "td", {}, [formatNumber(api, run.effectiveSpectrum[eigenIndex], 4)]),
          makeElement(api, "td", {}, [formatNumber(api, run.initialEnergyWeights[eigenIndex], 4)]),
          makeElement(api, "td", {}, [filter === null ? "—" : formatNumber(api, filter, 5)])
        ]));
      });
      table.appendChild(body);
      return makeElement(api, "section", { className: "cg-spectrum-card", "aria-labelledby": uid + "-spectrum-title-" + index }, [
        makeElement(api, "h4", { id: uid + "-spectrum-title-" + index }, [run.label]),
        makeElement(api, "p", {}, [
          run.method + "；有效谱有 " + countDistinct(run.effectiveSpectrum) + " 个不同值；ωᵢ=λᵢe₀,ᵢ²/||e₀||A²。"
        ]),
        renderSpectrumStrip(api, run, row, uid + "-strip-" + index),
        makeElement(api, "div", { className: "cg-table-wrap" }, [table])
      ]);
    }));
  }

  function countDistinct(values) {
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var count = 0;
    var previous = null;
    sorted.forEach(function (value) {
      if (!count || Math.abs(value - previous) > 1e-9 * Math.max(1, Math.abs(value))) {
        count += 1;
        previous = value;
      }
    });
    return count;
  }

  function renderLedger(api, data, step) {
    return makeElement(api, "div", {}, data.runs.map(function (run) {
      var table = makeElement(api, "table", { className: "cg-table" });
      table.appendChild(makeElement(api, "caption", {}, [run.label + "：逐步 recurrence / 显式真残差账本"]));
      table.appendChild(makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "col" }, ["k"]),
        makeElement(api, "th", { scope: "col" }, ["αₖ"]),
        makeElement(api, "th", { scope: "col" }, ["βₖ"]),
        makeElement(api, "th", { scope: "col" }, ["||eₖ||A / ||e₀||A"]),
        makeElement(api, "th", { scope: "col" }, ["||rₖ(rec)||₂"]),
        makeElement(api, "th", { scope: "col" }, ["||b−Axₖ||₂"]),
        makeElement(api, "th", { scope: "col" }, ["gap"]),
        makeElement(api, "th", { scope: "col" }, ["Cheb"])
      ])]));
      var body = makeElement(api, "tbody");
      run.rows.forEach(function (row) {
        body.appendChild(makeElement(api, "tr", { className: row.k === step || (step > run.rows[run.rows.length - 1].k && row === run.rows[run.rows.length - 1]) ? "cg-current" : "" }, [
          makeElement(api, "th", { scope: "row" }, [String(row.k)]),
          makeElement(api, "td", {}, [row.alpha === null ? "—" : formatNumber(api, row.alpha, 6)]),
          makeElement(api, "td", {}, [row.beta === null ? "—" : formatNumber(api, row.beta, 6)]),
          makeElement(api, "td", {}, [formatNumber(api, row.aNormErrorNormalized, 7)]),
          makeElement(api, "td", {}, [formatNumber(api, row.residualNorm, 7)]),
          makeElement(api, "td", {}, [formatNumber(api, row.trueResidualNorm, 7)]),
          makeElement(api, "td", {}, [formatNumber(api, row.recurrenceGap, 8)]),
          makeElement(api, "td", {}, [formatNumber(api, row.chebyshevBound, 7)])
        ]));
      });
      table.appendChild(body);
      return makeElement(api, "div", { className: "cg-table-wrap" }, [table]);
    }));
  }

  function renderChecks(api, data) {
    var items = [];
    data.checks.forEach(function (checks, index) {
      var label = data.runs[index].label;
      [
        [checks.recurrenceMatchesExplicit, "recurrence 与显式真残差", "max gap=" + formatNumber(api, checks.maxRecurrenceGap, 8)],
        [checks.explicitResidual, "显式残差范数", "||b−Ax||₂ 与直接范数一致"],
        [checks.recurrence, "CG/PCG 三项 recurrence", "x、r、p 的更新可重算"],
        [checks.aNormMonotone, "A-范数误差", "在浮点容差内不增"],
        [checks.chebyshevBound, "Chebyshev 上界", "实际误差没有超过最坏情形界"],
        [checks.directionConjugacy, "A-共轭方向", "在浮点容差内"],
        [checks.dimensionBound, "维数/步数边界", "k≤n=" + data.runs[index].n],
        [checks.zeroResidualBoundary, "零残差边界", "初始 r₀=0 时不除以零"]
      ].forEach(function (item) {
        items.push(makeElement(api, "li", {}, [
          makeElement(api, "span", { className: item[0] ? "cg-check" : "cg-check cg-fail", "aria-hidden": "true" }, [item[0] ? "✓" : "×"]),
          makeElement(api, "span", {}, [label + "：" + item[1] + "（" + item[2] + "）"])
        ]));
      });
    });
    return makeElement(api, "ul", { className: "cg-checklist" }, items);
  }

  function renderFormula(api, data, step) {
    return makeElement(api, "div", { className: "cg-formula" }, data.runs.map(function (run) {
      var row = rowAt(run, step);
      var methodLine = run.method === "PCG"
        ? "M=diag(mᵢ)，zₖ=M⁻¹rₖ，ρₖ=rₖᵀzₖ；μᵢ=λᵢ/mᵢ。"
        : "M=I，zₖ=rₖ，ρₖ=rₖᵀrₖ；μᵢ=λᵢ。";
      return run.label + " · k=" + row.k + "：" + methodLine +
        " α=" + (row.alpha === null ? "—" : formatNumber(api, row.alpha, 6)) +
        "，β=" + (row.beta === null ? "—" : formatNumber(api, row.beta, 6)) +
        "；rₖ(rec) 与 b−Axₖ 的二范数差=" + formatNumber(api, row.recurrenceGap, 8) + "。";
    }).join("\n"));
  }

  function predictionFeedback(api, data, choice) {
    if (!choice) return { text: "先选一个答案，再点击“核对预测”。", className: "cg-feedback" };
    var fastest = data.runs.slice().sort(function (a, b) {
      var stepA = a.convergenceStep === null ? Infinity : a.convergenceStep;
      var stepB = b.convergenceStep === null ? Infinity : b.convergenceStep;
      return stepA - stepB;
    });
    var firstStep = fastest[0].convergenceStep === null ? Infinity : fastest[0].convergenceStep;
    var secondStep = fastest.length > 1 && fastest[1].convergenceStep !== null ? fastest[1].convergenceStep : Infinity;
    var tie = firstStep === secondStep;
    var correct = tie ? choice === "tie" : choice === fastest[0].id;
    var facts = data.runs.map(function (run) {
      return run.label + " 在第 " + (run.convergenceStep === null ? "未到" : run.convergenceStep) + " 步达到当前容差";
    }).join("；");
    return {
      text: (correct ? "✓ 预测吻合。" : "△ 这次预测没有命中。") + facts + "。这只是当前 n=" + data.runs[0].n + " toy 账本的反馈；κ 界不是实际步数预测。",
      className: "cg-feedback " + (correct ? "cg-correct" : "cg-incorrect")
    };
  }

  function buildLab(root, api) {
    if (!root || typeof document === "undefined") return;
    installStyles();
    root.classList.add("cg-lab");
    var uid = "cl-cg-" + (INSTANCE += 1);
    var state = { presetId: "same-kappa", step: 0, prediction: "", feedback: "" };
    var refs = {};
    var presetButtons = [];
    var currentData = null;

    var heading = makeElement(api, "h3", {}, ["CG 收敛实验：同 κ 不等于同轨迹"]);
    var intro = makeElement(api, "p", { className: "cg-intro" }, [
      "实验只生成 n≤12 的可复现对角 SPD toy 系统：A=diag(λᵢ)，b=Ax*，x₀=0。蓝线是归一化 A-范数误差，红色虚线是归一化真残差二范数，金色点线是 Chebyshev 条件数上界；所有真残差都重新计算 b−Axₖ。这里展示 O(n) 的教学算例，不把它冒充百万维性能数据。"
    ]);
    var prompt = makeElement(api, "div", { className: "cg-prompt" }, [
      "先预测再展开：相同 κ 的均匀谱和聚集谱，谁会先把误差滤掉？如果只改变 e₀ 在特征向量方向上的权重，CG 的实际步数会不会改变？注意：CG 在精确算术中最小化 A-范数误差；||rₖ||₂ 不保证单调。"
    ]);

    var presetBox = makeElement(api, "fieldset", { className: "cg-preset-box" });
    presetBox.appendChild(makeElement(api, "legend", {}, ["教学预设"]));
    var presetRow = makeElement(api, "div", { className: "cg-preset-row" });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, "button", {
        type: "button",
        "aria-pressed": "false",
        onclick: function () {
          state.presetId = preset.id;
          state.step = 0;
          state.prediction = "";
          state.feedback = "";
          render();
        }
      }, [preset.shortLabel]);
      presetButtons.push({ id: preset.id, button: button });
      presetRow.appendChild(button);
    });
    presetBox.appendChild(presetRow);

    var predictionBox = makeElement(api, "fieldset", { className: "cg-prediction-box" });
    predictionBox.appendChild(makeElement(api, "legend", {}, ["预测反馈"]));
    refs.predictionQuestion = makeElement(api, "p", { className: "cg-note" });
    refs.prediction = makeElement(api, "select", { "aria-label": "选择你的收敛预测", onchange: function () {
      state.prediction = refs.prediction.value;
      state.feedback = "";
      refs.feedback.textContent = "先点击“核对预测”查看本次账本的反馈。";
      refs.feedback.className = "cg-feedback";
    } });
    refs.checkPrediction = makeElement(api, "button", { type: "button", className: "cg-primary", onclick: function () {
      var result = predictionFeedback(api, currentData, state.prediction);
      refs.feedback.textContent = result.text;
      refs.feedback.className = result.className;
    } }, ["核对预测"]);
    refs.feedback = makeElement(api, "p", { className: "cg-feedback", "aria-live": "polite" }, ["先选一个答案，再点击“核对预测”。"]);
    predictionBox.appendChild(refs.predictionQuestion);
    predictionBox.appendChild(refs.prediction);
    predictionBox.appendChild(makeElement(api, "div", { className: "cg-button-row" }, [refs.checkPrediction]));
    predictionBox.appendChild(refs.feedback);

    var stepId = uid + "-step";
    var stepControl = makeElement(api, "div", { className: "cg-control" }, [
      makeElement(api, "label", { className: "cg-label", htmlFor: stepId }, ["逐步展开到第 k 步：", makeElement(api, "output", { "data-step-output": true }, ["0"])]),
      makeElement(api, "input", { id: stepId, type: "range", min: 0, max: 12, step: 1, value: 0, "aria-label": "选择要查看的 CG 步数", oninput: function () {
        state.step = Number(this.value);
        render();
      } })
    ]);
    refs.stepRange = stepControl.querySelector("input");
    refs.stepOutput = stepControl.querySelector("output");
    var controlPanel = makeElement(api, "div", { className: "cg-control-panel" }, [presetBox, predictionBox, stepControl]);

    refs.status = makeElement(api, "p", { className: "cg-status", "aria-live": "polite" });
    refs.chart = makeElement(api, "div");
    refs.metrics = makeElement(api, "div");
    refs.spectrum = makeElement(api, "div");
    refs.ledger = makeElement(api, "div");
    refs.formula = makeElement(api, "div");
    refs.checks = makeElement(api, "div");
    var stage = makeElement(api, "div", { className: "cg-stage" }, [
      makeElement(api, "div", { className: "cg-stage-frame" }, [
        makeElement(api, "div", { className: "cg-stage-title" }, [
          makeElement(api, "span", {}, ["实际轨迹与最坏情形界"]),
          makeElement(api, "span", {}, ["纵轴 log₁₀；仅显示小型可复算系统"])
        ]),
        refs.status,
        refs.chart
      ])
    ]);
    var layout = makeElement(api, "div", { className: "cg-layout" }, [controlPanel, stage]);
    replaceChildren(root, [heading, intro, prompt, layout,
      makeElement(api, "h4", { className: "cg-subtitle" }, ["当前步读数"]), refs.metrics,
      makeElement(api, "h4", { className: "cg-subtitle" }, ["谱与多项式滤波：初始权重决定哪些方向可见"]), refs.spectrum,
      makeElement(api, "h4", { className: "cg-subtitle" }, ["逐步账本"]), refs.ledger,
      refs.formula,
      makeElement(api, "h4", { className: "cg-subtitle" }, ["可检查不变量"]), refs.checks,
      makeElement(api, "p", { className: "cg-footnote" }, [
        "读法提醒：Chebyshev 界只使用谱区间，是最坏情形上界而非实际预测；有限精度会让理论上的 n 步精确变成“达到容差”，并可能产生 recurrence 与显式残差的微小 gap。预条件案例中的 M 是透明的分组对角缩放，不是隐藏的直接解。"
      ])
    ]);

    function syncPrediction(data) {
      var preset = data.preset;
      refs.predictionQuestion.textContent = preset.question;
      replaceChildren(refs.prediction, [makeElement(api, "option", { value: "", disabled: true }, ["请选择…"])]);
      data.runs.forEach(function (run) {
        refs.prediction.appendChild(makeElement(api, "option", { value: run.id }, [run.label]));
      });
      refs.prediction.appendChild(makeElement(api, "option", { value: "tie" }, ["两者差不多"]));
      refs.prediction.value = state.prediction;
      if (state.feedback) refs.feedback.textContent = state.feedback;
      else refs.feedback.textContent = "先选一个答案，再点击“核对预测”。";
    }

    function render() {
      currentData = buildPresetData(state.presetId);
      state.step = clamp(Math.round(Number(state.step) || 0), 0, currentData.maxStep);
      refs.stepRange.max = String(currentData.maxStep);
      refs.stepRange.value = String(state.step);
      refs.stepOutput.textContent = String(state.step);
      presetButtons.forEach(function (item) {
        item.button.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false");
      });
      syncPrediction(currentData);
      var selectedRows = currentData.runs.map(function (run) { return rowAt(run, state.step); });
      refs.status.textContent = currentData.preset.label + "；当前显示第 " + state.step + " 步。" +
        currentData.runs.map(function (run, index) {
          return run.label + " 的 ||e||A/||e₀||A=" + formatNumber(api, selectedRows[index].aNormErrorNormalized, 5) +
            "，真 ||r||₂=" + formatNumber(api, selectedRows[index].trueResidualNorm, 5);
        }).join("；") + "。";
      replaceChildren(refs.chart, renderComparison(api, currentData, state.step, uid));
      replaceChildren(refs.metrics, renderMetrics(api, currentData, state.step));
      replaceChildren(refs.spectrum, renderSpectrum(api, currentData, state.step, uid));
      replaceChildren(refs.ledger, renderLedger(api, currentData, state.step));
      replaceChildren(refs.formula, renderFormula(api, currentData, state.step));
      replaceChildren(refs.checks, renderChecks(api, currentData));
    }

    render();
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;
  host.CourseLearning.register("cg-spectrum", buildLab);
}(typeof window !== "undefined" ? window : null));
