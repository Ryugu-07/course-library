(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("first-order-methods", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("first-order-methods self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("first-order-methods self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "first-order-methods-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var PROBLEM = {
    id: "smooth-quadratic-l1",
    q: [[1, 0], [0, 4]],
    center: [2, -2],
    lambda: 0.5,
    start: [5, 4],
    smoothExact: [2, -2],
    compositeExact: [1.5, -1.875],
    smoothOptimum: 0,
    compositeOptimum: 1.84375,
    L: 4,
    mu: 1,
    note: "f(x)=1/2[(x1-2)^2+4(x2+2)^2], g(x)=1/2||x||1."
  };
  var PRESETS = [
    { id: "safe", label: "安全步长 α=1/L", stepFactor: 1, iterations: 16, note: "所有标准凸/强凸账本的步长条件成立。" },
    { id: "cautious", label: "保守步长 α=0.5/L", stepFactor: 0.5, iterations: 20, note: "界仍有效，但每步走得更谨慎。" },
    { id: "overstep", label: "超出标准条件 α=1.25/L", stepFactor: 1.25, iterations: 16, note: "本二次可能仍有限；标准通用界不再发证书。" }
  ];
  var STYLE_TEXT = [
    ".fo-lab{--fo-blue:var(--cl-blue,#315f9d);--fo-gold:var(--cl-gold,#95670d);--fo-green:var(--cl-green,#347247);--fo-red:var(--cl-red,#b13d32);--fo-purple:#745a9d;max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".fo-lab *,.fo-lab *::before,.fo-lab *::after{box-sizing:border-box}.fo-lab [hidden]{display:none!important}.fo-lab h3,.fo-lab h4{margin:0;color:var(--fg);letter-spacing:0}.fo-lab h3{font-size:1.16rem}.fo-lab h4{margin-top:16px;font-size:1rem}.fo-lab p{margin:8px 0}.fo-lab .fo-note,.fo-lab .fo-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}",
    ".fo-lab button,.fo-lab input{font:inherit}.fo-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.fo-lab button:hover{border-color:var(--accent)}.fo-lab button:focus-visible,.fo-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.fo-lab button[aria-pressed=true],.fo-lab button.fo-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.fo-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".fo-lab .fo-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}.fo-lab .fo-presets button{font-size:12px}.fo-lab .fo-controls{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(210px,.8fr);gap:14px;margin:12px 0;align-items:start}.fo-lab .fo-control{min-width:0;display:grid;gap:6px}.fo-lab .fo-control label{color:var(--fg-soft);font-size:12.5px;font-weight:750}.fo-lab .fo-control output{color:var(--accent);font-variant-numeric:tabular-nums}.fo-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".fo-lab .fo-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--fo-gold);background:var(--block-bg,var(--bg))}.fo-lab .fo-prediction-title{display:block;margin-bottom:8px;font-size:13px}.fo-lab .fo-question{margin:10px 0}.fo-lab .fo-question-label{display:block;margin-bottom:6px;font-size:13px;font-weight:700}.fo-lab .fo-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.fo-lab .fo-feedback{min-height:2em;margin:8px 0;font-weight:700}.fo-lab .fo-pass{color:var(--fo-green)}.fo-lab .fo-warn{color:var(--fo-red)}.fo-lab .fo-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.fo-lab .fo-actions>*{flex:1 1 170px}",
    ".fo-lab .fo-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.fo-lab .fo-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0}.fo-lab .fo-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.fo-lab .fo-metric:nth-child(6n+1){border-color:var(--fo-blue)}.fo-lab .fo-metric:nth-child(6n+2){border-color:var(--fo-gold)}.fo-lab .fo-metric:nth-child(6n+3){border-color:var(--fo-green)}.fo-lab .fo-metric:nth-child(6n+4){border-color:var(--fo-red)}.fo-lab .fo-metric:nth-child(6n+5){border-color:var(--fo-purple)}.fo-lab .fo-metric:nth-child(6n){border-color:var(--accent)}.fo-lab .fo-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.fo-lab .fo-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".fo-lab .fo-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.fo-lab .fo-svg{display:block;width:100%;max-width:100%;height:auto;min-width:620px;color:var(--fg)}.fo-lab .fo-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.fo-lab .fo-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.72}.fo-lab .fo-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72}.fo-lab .fo-gd{fill:none;stroke:var(--fo-blue);stroke-width:2.8}.fo-lab .fo-accelerated{fill:none;stroke:var(--fo-gold);stroke-width:2.8}.fo-lab .fo-pg{fill:none;stroke:var(--fo-green);stroke-width:2.8}.fo-lab .fo-fista{fill:none;stroke:var(--fo-purple);stroke-width:2.8}.fo-lab .fo-bound{fill:none;stroke:var(--fo-red);stroke-width:1.7;stroke-dasharray:6 4}.fo-lab .fo-label{font-size:11px}.fo-lab .fo-small{font-size:10.5px;fill:var(--fg-soft)!important}.fo-lab .fo-legend{display:flex;flex-wrap:wrap;gap:8px 15px;margin:8px 0;color:var(--fg-soft);font-size:12px}.fo-lab .fo-legend span{display:inline-flex;align-items:center;gap:5px}.fo-lab .fo-swatch{display:inline-block;width:18px;height:3px;background:currentColor}.fo-lab .fo-swatch-blue{color:var(--fo-blue)}.fo-lab .fo-swatch-gold{color:var(--fo-gold)}.fo-lab .fo-swatch-green{color:var(--fo-green)}.fo-lab .fo-swatch-purple{color:var(--fo-purple)}.fo-lab .fo-swatch-red{color:var(--fo-red);border-top:1px dashed var(--fo-red);height:0}",
    ".fo-lab .fo-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.fo-lab table{width:100%;min-width:1040px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}.fo-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.fo-lab th,.fo-lab td{padding:7px 7px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.fo-lab th{color:var(--fg-soft);font-size:11px;font-weight:750}.fo-lab .fo-good{color:var(--fo-green);font-weight:750}.fo-lab .fo-bad{color:var(--fo-red);font-weight:750}.fo-lab .fo-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--fo-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:1000px){.fo-lab .fo-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.fo-lab .fo-controls{grid-template-columns:minmax(0,1fr)}}@media(max-width:760px){.fo-lab .fo-presets,.fo-lab .fo-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:440px){.fo-lab .fo-metrics{grid-template-columns:minmax(0,1fr)}.fo-lab .fo-stage{padding:4px}.fo-lab table{font-size:11px}}@media(prefers-reduced-motion:reduce){.fo-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance === undefined ? EPS : tolerance) * scale;
  }

  function fail(message) {
    throw new Error("first-order-methods: " + message);
  }

  function cloneVector(vector) {
    return vector.slice();
  }

  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
  }

  function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
  }

  function scale(vector, factor) {
    return [vector[0] * factor, vector[1] * factor];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }

  function norm(vector) {
    return Math.hypot(vector[0], vector[1]);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].id === id) return PRESETS[index];
    }
    return PRESETS[0];
  }

  function normalizeConfig(input) {
    var source = input || {};
    var preset = presetById(source.presetId || source.id || "safe");
    var stepFactor = source.stepFactor === undefined ? preset.stepFactor : Number(source.stepFactor);
    var iterations = source.iterations === undefined ? preset.iterations : Number(source.iterations);
    if (!finite(stepFactor) || stepFactor <= 0) throw new RangeError("stepFactor must be positive");
    if (!finite(iterations) || Math.floor(iterations) !== iterations || iterations < 1) throw new RangeError("iterations must be a positive integer");
    return {
      presetId: preset.id,
      label: preset.label,
      note: preset.note,
      stepFactor: clamp(stepFactor, 0.1, 1.5),
      iterations: Math.round(clamp(iterations, 4, 32)),
      alpha: clamp(stepFactor, 0.1, 1.5) / PROBLEM.L
    };
  }

  function gradient(problem, x) {
    var delta = subtract(x, problem.center);
    return [
      problem.q[0][0] * delta[0] + problem.q[0][1] * delta[1],
      problem.q[1][0] * delta[0] + problem.q[1][1] * delta[1]
    ];
  }

  function smoothObjective(problem, x) {
    var delta = subtract(x, problem.center);
    return 0.5 * dot(delta, [
      problem.q[0][0] * delta[0] + problem.q[0][1] * delta[1],
      problem.q[1][0] * delta[0] + problem.q[1][1] * delta[1]
    ]);
  }

  function nonsmoothObjective(problem, x) {
    return problem.lambda * (Math.abs(x[0]) + Math.abs(x[1]));
  }

  function compositeObjective(problem, x) {
    return smoothObjective(problem, x) + nonsmoothObjective(problem, x);
  }

  function softScalar(value, threshold) {
    return value > threshold ? value - threshold : value < -threshold ? value + threshold : 0;
  }

  function prox(problem, x, alpha) {
    var gradientStep = subtract(x, scale(gradient(problem, x), alpha));
    return [
      softScalar(gradientStep[0], alpha * problem.lambda),
      softScalar(gradientStep[1], alpha * problem.lambda)
    ];
  }

  function proxMapping(problem, x, alpha) {
    return norm(scale(subtract(x, prox(problem, x, alpha)), 1 / alpha));
  }

  function exactComposite(problem) {
    if (!near(problem.q[0][1], 0) || !near(problem.q[1][0], 0)) {
      throw new RangeError("exactComposite supports the displayed diagonal quadratic only");
    }
    return [
      softScalar(problem.center[0], problem.lambda / problem.q[0][0]),
      softScalar(problem.center[1], problem.lambda / problem.q[1][1])
    ];
  }

  function smoothDistanceSquared(problem) {
    return dot(subtract(problem.start, problem.smoothExact), subtract(problem.start, problem.smoothExact));
  }

  function compositeDistanceSquared(problem) {
    var exact = exactComposite(problem);
    return dot(subtract(problem.start, exact), subtract(problem.start, exact));
  }

  function validStep(alpha, problem) {
    return alpha > 0 && alpha <= 1 / problem.L + EPS;
  }

  function convexBound(radiusSquared, alpha, k, valid) {
    return valid && k > 0 ? radiusSquared / (2 * alpha * k) : null;
  }

  function acceleratedBound(radiusSquared, alpha, k, valid) {
    return valid && k > 0 ? 2 * radiusSquared / (alpha * (k + 1) * (k + 1)) : null;
  }

  function strongBound(initialGap, alpha, mu, k, valid) {
    return valid ? Math.pow(Math.max(0, 1 - alpha * mu), k) * initialGap : null;
  }

  function baseRow(problem, config, method, target, x, k, residual, kind) {
    var smoothGap = smoothObjective(problem, x) - problem.smoothOptimum;
    var compositeGap = compositeObjective(problem, x) - problem.compositeOptimum;
    var stepValid = validStep(config.alpha, problem);
    var row = {
      method: method,
      target: target,
      kind: kind,
      k: k,
      x: cloneVector(x),
      smoothObjective: smoothObjective(problem, x),
      compositeObjective: compositeObjective(problem, x),
      smoothGap: smoothGap,
      compositeGap: compositeGap,
      objectiveGap: target === "f" ? smoothGap : compositeGap,
      residual: residual,
      step: config.alpha,
      stepValid: stepValid,
      convexBound: target === "f"
        ? convexBound(smoothDistanceSquared(problem), config.alpha, k, stepValid)
        : convexBound(compositeDistanceSquared(problem), config.alpha, k, stepValid),
      strongBound: null,
      boundType: "convex 1/k"
    };
    if (target === "f" && method === "GD") {
      row.strongBound = strongBound(
        smoothObjective(problem, problem.start) - problem.smoothOptimum,
        config.alpha,
        problem.mu,
        k,
        stepValid
      );
      row.boundType = "convex 1/k；强凸线性";
    }
    if (target === "F" && method === "PG / ISTA") {
      row.strongBound = strongBound(
        compositeObjective(problem, problem.start) - problem.compositeOptimum,
        config.alpha,
        problem.mu,
        k,
        stepValid
      );
      row.boundType = "凸 1/k；本 toy 的强凸诊断";
    }
    if (kind === "accelerated") {
      row.convexBound = acceleratedBound(
        target === "f" ? smoothDistanceSquared(problem) : compositeDistanceSquared(problem),
        config.alpha,
        k,
        stepValid
      );
      row.strongBound = null;
      row.boundType = "凸 1/k²；不作逐点承诺";
    }
    return row;
  }

  function runGradientDescent(problem, config) {
    var x = cloneVector(problem.start);
    var rows = [];
    for (var k = 1; k <= config.iterations; k += 1) {
      x = subtract(x, scale(gradient(problem, x), config.alpha));
      rows.push(baseRow(problem, config, "GD", "f", x, k, norm(gradient(problem, x)), "plain"));
    }
    return {
      id: "gd",
      label: "GD（平滑 f）",
      target: "f",
      rows: rows,
      x: x,
      assumption: validStep(config.alpha, problem),
      assumptionText: "0 < α ≤ 1/L；f 为 L-光滑且 μ-强凸",
      finalGap: rows.length ? rows[rows.length - 1].objectiveGap : null,
      finalResidual: rows.length ? rows[rows.length - 1].residual : null
    };
  }

  function runNesterov(problem, config) {
    var x = cloneVector(problem.start);
    var y = cloneVector(problem.start);
    var t = 1;
    var rows = [];
    for (var k = 1; k <= config.iterations; k += 1) {
      var next = subtract(y, scale(gradient(problem, y), config.alpha));
      var nextT = (1 + Math.sqrt(1 + 4 * t * t)) / 2;
      y = add(next, scale(subtract(next, x), (t - 1) / nextT));
      x = next;
      t = nextT;
      rows.push(baseRow(problem, config, "Nesterov", "f", x, k, norm(gradient(problem, x)), "accelerated"));
    }
    return {
      id: "nesterov",
      label: "Nesterov（平滑 f）",
      target: "f",
      rows: rows,
      x: x,
      assumption: validStep(config.alpha, problem),
      assumptionText: "0 < α ≤ 1/L 时显示尺度为 1/α 的标准凸 1/k² 界；动量曲线可非单调",
      finalGap: rows.length ? rows[rows.length - 1].objectiveGap : null,
      finalResidual: rows.length ? rows[rows.length - 1].residual : null
    };
  }

  function runProximalGradient(problem, config) {
    var x = cloneVector(problem.start);
    var rows = [];
    for (var k = 1; k <= config.iterations; k += 1) {
      x = prox(problem, x, config.alpha);
      rows.push(baseRow(problem, config, "PG / ISTA", "F", x, k, proxMapping(problem, x, config.alpha), "plain"));
    }
    return {
      id: "pg",
      label: "PG / ISTA（复合 F）",
      target: "F",
      rows: rows,
      x: x,
      assumption: validStep(config.alpha, problem),
      assumptionText: "0 < α ≤ 1/L；f 光滑、g 凸且 prox_g 可计算",
      finalGap: rows.length ? rows[rows.length - 1].objectiveGap : null,
      finalResidual: rows.length ? rows[rows.length - 1].residual : null
    };
  }

  function runFista(problem, config) {
    var x = cloneVector(problem.start);
    var y = cloneVector(problem.start);
    var t = 1;
    var rows = [];
    for (var k = 1; k <= config.iterations; k += 1) {
      var next = prox(problem, y, config.alpha);
      var nextT = (1 + Math.sqrt(1 + 4 * t * t)) / 2;
      y = add(next, scale(subtract(next, x), (t - 1) / nextT));
      x = next;
      t = nextT;
      rows.push(baseRow(problem, config, "FISTA", "F", x, k, proxMapping(problem, x, config.alpha), "accelerated"));
    }
    return {
      id: "fista",
      label: "FISTA-style（复合 F）",
      target: "F",
      rows: rows,
      x: x,
      assumption: validStep(config.alpha, problem),
      assumptionText: "0 < α ≤ 1/L 时显示复合凸 1/k² 界；不保证每一步下降",
      finalGap: rows.length ? rows[rows.length - 1].objectiveGap : null,
      finalResidual: rows.length ? rows[rows.length - 1].residual : null
    };
  }

  function solve(input) {
    if (input && input.problem && input.problem !== PROBLEM) {
      throw new RangeError("the interactive ledger supports only its documented fixed quadratic");
    }
    var config = normalizeConfig(input);
    var problem = PROBLEM;
    var exact = exactComposite(problem);
    if (!finite(problem.compositeOptimum)) {
      problem = Object.assign({}, problem, {
        compositeExact: exact,
        compositeOptimum: compositeObjective(problem, exact)
      });
    }
    return {
      problem: problem,
      config: config,
      alpha: config.alpha,
      smoothExact: cloneVector(problem.smoothExact),
      compositeExact: cloneVector(exact),
      smoothOptimum: problem.smoothOptimum,
      compositeOptimum: problem.compositeOptimum,
      gd: runGradientDescent(problem, config),
      nesterov: runNesterov(problem, config),
      pg: runProximalGradient(problem, config),
      fista: runFista(problem, config),
      assumptions: {
        L: problem.L,
        mu: problem.mu,
        alpha: config.alpha,
        validStep: validStep(config.alpha, problem),
        strongConvexity: problem.mu > 0
      },
      comparisonWarning: "GD/Nesterov 的目标是 f；PG/FISTA 的目标是 F；加速只给速率阶数，不给逐点排序。"
    };
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 5 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.00001) return value.toExponential(Math.min(places, 4));
    var text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
  }

  function formatVector(vector) {
    return "(" + vector.map(function (value) { return formatNumber(value, 4); }).join(", ") + ")";
  }

  function assert(condition, message) {
    if (!condition) fail(message);
  }

  function everyFiniteRow(result) {
    return result.rows.every(function (row) {
      return finite(row.objectiveGap) && finite(row.residual) && (row.convexBound === null || finite(row.convexBound)) && (row.strongBound === null || finite(row.strongBound));
    });
  }

  function assertRowsWithinBounds(methodResult) {
    return methodResult.rows.every(function (row) {
      var convexOk = row.convexBound === null || row.objectiveGap <= row.convexBound + 1e-8;
      var strongOk = row.strongBound === null || row.objectiveGap <= row.strongBound + 1e-8;
      return convexOk && strongOk;
    });
  }

  function selfTest() {
    var checks = 0;
    var exact = exactComposite(PROBLEM);
    assert(near(exact[0], 1.5) && near(exact[1], -1.875), "L1 exact minimizer"); checks += 1;
    assert(near(compositeObjective(PROBLEM, exact), 1.84375), "composite optimum"); checks += 1;
    assert(near(smoothObjective(PROBLEM, PROBLEM.smoothExact), 0), "smooth optimum"); checks += 1;
    assert(near(PROBLEM.L, 4) && near(PROBLEM.mu, 1), "L and strong-convexity constants"); checks += 1;

    var safe = solve(PRESETS[0]);
    [safe.gd, safe.nesterov, safe.pg, safe.fista].forEach(function (method) {
      assert(method.rows.length === PRESETS[0].iterations, method.id + " iteration count"); checks += 1;
      assert(everyFiniteRow(method), method.id + " finite ledger"); checks += 1;
      assert(method.assumption && assertRowsWithinBounds(method), method.id + " valid bounds under safe step"); checks += 1;
    });
    assert(near(safe.gd.rows[0].x[0], 4.25) && near(safe.gd.rows[0].x[1], -2), "GD first iterate"); checks += 1;
    assert(near(safe.pg.rows[0].x[0], 4.125) && near(safe.pg.rows[0].x[1], -1.875), "PG first iterate"); checks += 1;
    assert(safe.gd.rows.every(function (row, index, rows) { return index === 0 || row.objectiveGap <= rows[index - 1].objectiveGap + EPS; }), "GD smooth objective monotonicity"); checks += 1;
    assert(safe.pg.rows.every(function (row, index, rows) { return index === 0 || row.objectiveGap <= rows[index - 1].objectiveGap + EPS; }), "PG composite objective monotonicity"); checks += 1;
    assert(safe.pg.rows[0].residual < norm(gradient(PROBLEM, PROBLEM.start)), "prox residual differs from raw start gradient"); checks += 1;
    assert(safe.nesterov.rows[0].convexBound !== null && safe.fista.rows[0].convexBound !== null, "accelerated bounds at safe step"); checks += 1;

    var cautious = solve(PRESETS[1]);
    assert(cautious.assumptions.validStep && cautious.gd.rows.length === PRESETS[1].iterations, "cautious step remains certified"); checks += 1;
    assert(cautious.gd.rows.every(function (row) { return row.convexBound !== null; }), "cautious GD convex bounds"); checks += 1;
    assert(cautious.nesterov.rows.every(function (row) { return row.convexBound !== null; }) &&
      cautious.fista.rows.every(function (row) { return row.convexBound !== null; }),
      "cautious accelerated bounds use the actual step size"); checks += 1;

    var overstep = solve(PRESETS[2]);
    assert(!overstep.assumptions.validStep, "overstep loses standard step certificate"); checks += 1;
    [overstep.gd, overstep.nesterov, overstep.pg, overstep.fista].forEach(function (method) {
      assert(method.rows.every(function (row) { return row.convexBound === null && row.strongBound === null; }), method.id + " bounds hidden when step invalid"); checks += 1;
    });
    assert(overstep.gd.rows.every(function (row) { return finite(row.objectiveGap) && finite(row.residual); }), "overstep remains a finite diagnostic"); checks += 1;
    assert(safe.comparisonWarning.indexOf("逐点") !== -1, "pointwise acceleration caveat is exposed"); checks += 1;
    var invalid = false;
    try { solve({ stepFactor: 0, iterations: 4 }); } catch (error) { invalid = true; }
    assert(invalid, "zero step rejected"); checks += 1;
    var customRejected = false;
    try { solve({ problem: Object.assign({}, PROBLEM), stepFactor: 1, iterations: 4 }); } catch (error) { customRejected = true; }
    assert(customRejected, "undocumented custom problem branch is rejected"); checks += 1;
    return { checks: checks, presets: PRESETS.length };
  }

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc);
  }

  function svgElement(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return {
      node: element(doc, "div", { className: "fo-metric" }, [
        element(doc, "span", { text: label }),
        value
      ]),
      value: value
    };
  }

  function chartPath(rows, key, x, y, width, height, minimum, maximum) {
    return rows.map(function (row, index) {
      var value = row[key];
      if (!finite(value)) return "";
      var chartX = x + width * (rows.length === 1 ? 0 : index / (rows.length - 1));
      var chartY = y + height - height * ((Math.log10(Math.max(value, 1e-8)) - minimum) / Math.max(EPS, maximum - minimum));
      return (index === 0 ? "M" : "L") + " " + chartX.toFixed(2) + " " + chartY.toFixed(2);
    }).join(" ");
  }

  function drawPanel(doc, svg, title, methods, x, y, width, height, uid) {
    var rows = [];
    methods.forEach(function (method) {
      method.rows.forEach(function (row) {
        rows.push(row.objectiveGap);
        if (row.convexBound !== null) rows.push(row.convexBound);
      });
    });
    var logs = rows.filter(function (value) { return finite(value) && value > 0; }).map(function (value) { return Math.log10(Math.max(value, 1e-8)); });
    var minimum = Math.max(-8, Math.min.apply(null, logs.concat([-6])) - 0.2);
    var maximum = Math.max.apply(null, logs.concat([0])) + 0.2;
    svg.appendChild(svgElement(doc, "rect", { x: x, y: y, width: width, height: height, fill: "var(--bg,#fff)", stroke: "var(--border,#c8cdd3)" }));
    svg.appendChild(svgElement(doc, "text", { className: "fo-label", x: x + 8, y: y + 17 }, title));
    for (var tick = 0; tick <= 4; tick += 1) {
      var lineY = y + 30 + (height - 50) * tick / 4;
      svg.appendChild(svgElement(doc, "line", { className: "fo-grid", x1: x + 42, y1: lineY, x2: x + width - 12, y2: lineY }));
      var logValue = maximum - (maximum - minimum) * tick / 4;
      svg.appendChild(svgElement(doc, "text", { className: "fo-small", x: x + 36, y: lineY + 4, "text-anchor": "end" }, "10^" + formatNumber(logValue, 1)));
    }
    var plotX = x + 42;
    var plotY = y + 30;
    var plotWidth = width - 54;
    var plotHeight = height - 50;
    svg.appendChild(svgElement(doc, "line", { className: "fo-axis", x1: plotX, y1: plotY + plotHeight, x2: plotX + plotWidth, y2: plotY + plotHeight }));
    svg.appendChild(svgElement(doc, "line", { className: "fo-axis", x1: plotX, y1: plotY, x2: plotX, y2: plotY + plotHeight }));
    methods.forEach(function (method) {
      var className = method.id === "gd" ? "fo-gd" : method.id === "nesterov" ? "fo-accelerated" : method.id === "pg" ? "fo-pg" : "fo-fista";
      svg.appendChild(svgElement(doc, "path", { className: className, d: chartPath(method.rows, "objectiveGap", plotX, plotY, plotWidth, plotHeight, minimum, maximum) }));
      if (method.rows.some(function (row) { return row.convexBound !== null; })) {
        svg.appendChild(svgElement(doc, "path", { className: "fo-bound", d: chartPath(method.rows, "convexBound", plotX, plotY, plotWidth, plotHeight, minimum, maximum) }));
      }
    });
    svg.appendChild(svgElement(doc, "text", { className: "fo-small", x: x + width / 2, y: y + height - 6, "text-anchor": "middle" }, "迭代 k；纵轴为 log10(gap)"));
    svg.appendChild(svgElement(doc, "text", { className: "fo-small", x: x + width - 15, y: y + 17, "text-anchor": "end" }, "bound dashed"));
  }

  function drawComparisonSvg(doc, svg, result) {
    clear(svg);
    svg.appendChild(svgElement(doc, "desc", {}, "左栏是同一个平滑二次目标上的 GD 与 Nesterov，右栏是同一个 L1 复合目标上的 PG 与 FISTA；虚线是适用时的理论上界，不是逐点速度承诺。"));
    drawPanel(doc, svg, "smooth target f: GD vs Nesterov", [result.gd, result.nesterov], 12, 22, 360, 300, "smooth-" + INSTANCE);
    drawPanel(doc, svg, "composite target F: PG vs FISTA", [result.pg, result.fista], 388, 22, 360, 300, "composite-" + INSTANCE);
  }

  function questionSpecs(result) {
    return [
      { key: "step", label: "1. 当前 α 是否满足 0<α≤1/L？", expected: result.assumptions.validStep ? "yes" : "no", choices: [{ value: "yes", label: "满足" }, { value: "no", label: "不满足" }] },
      { key: "rate", label: "2. 1/k² 应如何解释？", expected: "bound", choices: [{ value: "bound", label: "最坏情形速率界" }, { value: "pointwise", label: "每一步都更快" }, { value: "plot", label: "一张图即证明" }] },
      { key: "residual", label: "3. PG 的残差身份是？", expected: "mapping", choices: [{ value: "mapping", label: "prox-gradient mapping" }, { value: "gradient", label: "只用普通梯度" }, { value: "objective", label: "只看目标差" }] },
      { key: "pointwise", label: "4. 有限曲线能否证明逐点加速？", expected: "no", choices: [{ value: "yes", label: "能" }, { value: "no", label: "不能" }, { value: "unknown", label: "只看最后一行" }] }
    ];
  }

  function mount(root, api) {
    if (!host || !host.document) return;
    var doc = host.document;
    installStyles(doc);
    INSTANCE += 1;
    var state = {
      config: normalizeConfig({}),
      answers: { step: null, rate: null, residual: null, pointwise: null },
      revealed: false
    };
    var refs = {
      presetButtons: [],
      questionButtons: {},
      iterationInput: null,
      iterationOutput: null,
      resultShell: null,
      feedback: null,
      metrics: [],
      svg: null,
      ledger: null,
      summary: null,
      status: null
    };

    function renderPredictions(result) {
      var specs = questionSpecs(result);
      specs.forEach(function (spec) {
        (refs.questionButtons[spec.key] || []).forEach(function (entry) {
          var selected = state.answers[spec.key] === entry.value;
          entry.button.setAttribute("aria-pressed", selected ? "true" : "false");
          if (state.revealed) {
            entry.button.textContent = (entry.value === spec.expected ? "✓ " : "") + entry.label;
            entry.button.className = entry.value === spec.expected ? "fo-pass" : selected ? "fo-warn" : "";
          } else {
            entry.button.textContent = entry.label;
            entry.button.className = "";
          }
        });
      });
    }

    function lock(message) {
      state.answers = { step: null, rate: null, residual: null, pointwise: null };
      state.revealed = false;
      if (refs.resultShell) refs.resultShell.hidden = true;
      if (refs.feedback) {
        refs.feedback.className = "fo-feedback";
        refs.feedback.textContent = message || "参数已改变；请重新完成预测门。";
      }
      renderPredictions(solve(state.config));
    }

    function addQuestion(key, label, choices) {
      var grid = element(doc, "div", { className: "fo-choice-grid", role: "group", "aria-label": label });
      var buttons = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () {
          state.answers[key] = choice.value;
          renderPredictions(solve(state.config));
        });
        buttons.push({ button: button, value: choice.value, label: choice.label });
        grid.appendChild(button);
      });
      refs.questionButtons[key] = buttons;
      return element(doc, "div", { className: "fo-question" }, [
        element(doc, "span", { className: "fo-question-label" }, label),
        grid
      ]);
    }

    function addRow(body, cells) {
      var row = element(doc, "tr");
      cells.forEach(function (cell, index) {
        row.appendChild(element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell));
      });
      body.appendChild(row);
    }

    function renderResult(result) {
      var finalRows = [result.gd, result.nesterov, result.pg, result.fista];
      refs.metrics[0].value.textContent = formatNumber(result.assumptions.L, 2);
      refs.metrics[1].value.textContent = formatNumber(result.assumptions.mu, 2);
      refs.metrics[2].value.textContent = formatNumber(result.alpha, 4);
      refs.metrics[3].value.textContent = result.assumptions.validStep ? "有效" : "超出";
      refs.metrics[4].value.textContent = formatVector(result.smoothExact);
      refs.metrics[5].value.textContent = formatVector(result.compositeExact);
      drawComparisonSvg(doc, refs.svg, result);
      clear(refs.summary);
      var summaryBody = element(doc, "tbody");
      finalRows.forEach(function (method) {
        var row = method.rows[method.rows.length - 1];
        addRow(summaryBody, [
          method.label,
          method.target,
          formatNumber(row.objectiveGap, 7),
          formatNumber(row.residual, 6),
          row.convexBound === null ? "—" : formatNumber(row.convexBound, 5),
          row.strongBound === null ? "—" : formatNumber(row.strongBound, 5),
          method.assumption ? "步长证书有效" : "仅有限诊断"
        ]);
      });
      refs.summary.appendChild(summaryBody);
      clear(refs.ledger);
      var body = element(doc, "tbody");
      finalRows.forEach(function (method) {
        method.rows.forEach(function (row) {
          addRow(body, [
            method.label,
            String(row.k),
            row.target,
            formatNumber(row.objectiveGap, 7),
            formatNumber(row.residual, 6),
            row.convexBound === null ? "—" : formatNumber(row.convexBound, 6),
            row.strongBound === null ? "—" : formatNumber(row.strongBound, 6),
            row.stepValid ? "yes" : "no"
          ]);
        });
      });
      refs.ledger.appendChild(body);
      refs.status.textContent = result.assumptions.validStep
        ? "当前步长满足 0<α≤1/L；虚线是适用的速率上界。两组目标分别比较，不能把四条曲线合成一个逐点排名。"
        : "当前步长超出本页标准条件；轨迹数值仍可显示，但所有通用界已明确撤下。";
    }

    var shell = element(doc, "div", { className: "fo-shell" });
    shell.appendChild(element(doc, "h3", {}, "一阶方法账本：目标 gap、残差与假设"));
    shell.appendChild(element(doc, "p", { className: "fo-note" }, "平滑组比较 GD/Nesterov on f；复合组比较 PG/FISTA on F。加速显示速率界，不承诺逐点更快。"));
    var presetTitle = element(doc, "h4", {}, "步长预设");
    shell.appendChild(presetTitle);
    var presetGrid = element(doc, "div", { className: "fo-presets", role: "group", "aria-label": "步长预设" });
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        state.config = normalizeConfig({ presetId: preset.id, iterations: state.config.iterations });
        refs.iterationInput.value = String(state.config.iterations);
        lock("步长预设已改变；先预测证书和残差身份。");
        renderControls();
      });
      refs.presetButtons.push({ button: button, id: preset.id });
      presetGrid.appendChild(button);
    });
    shell.appendChild(presetGrid);
    var controls = element(doc, "div", { className: "fo-controls" });
    var iterationControl = element(doc, "div", { className: "fo-control" });
    refs.iterationOutput = element(doc, "output", { text: String(state.config.iterations) });
    refs.iterationInput = element(doc, "input", { type: "range", min: "4", max: "32", step: "4", value: String(state.config.iterations), "aria-label": "迭代次数" });
    refs.iterationInput.addEventListener("input", function () {
      state.config.iterations = Number(refs.iterationInput.value);
      lock("迭代次数已改变；请重新预测有限账本如何解读。");
      renderControls();
    });
    iterationControl.appendChild(element(doc, "label", {}, ["迭代次数 K=", refs.iterationOutput]));
    iterationControl.appendChild(refs.iterationInput);
    controls.appendChild(iterationControl);
    controls.appendChild(element(doc, "p", { className: "fo-note" }, "问题固定为 L=4、μ=1、λ=1/2、x₀=(5,4)；只改变有限实验参数。"));
    shell.appendChild(controls);

    var prediction = element(doc, "section", { className: "fo-prediction" });
    prediction.appendChild(element(doc, "strong", { className: "fo-prediction-title" }, "预测门：四项都作答后才揭示轨迹、界和逐步账本"));
    prediction.appendChild(addQuestion("step", "1. 当前 α 是否满足 0<α≤1/L？", [
      { value: "yes", label: "满足" }, { value: "no", label: "不满足" }
    ]));
    prediction.appendChild(addQuestion("rate", "2. 1/k² 应如何解释？", [
      { value: "bound", label: "最坏情形速率界" }, { value: "pointwise", label: "每一步都更快" }, { value: "plot", label: "一张图即证明" }
    ]));
    prediction.appendChild(addQuestion("residual", "3. PG 的残差身份是？", [
      { value: "mapping", label: "prox-gradient mapping" }, { value: "gradient", label: "只用普通梯度" }, { value: "objective", label: "只看目标差" }
    ]));
    prediction.appendChild(addQuestion("pointwise", "4. 有限曲线能否证明逐点加速？", [
      { value: "yes", label: "能" }, { value: "no", label: "不能" }, { value: "unknown", label: "只看最后一行" }
    ]));
    refs.feedback = element(doc, "p", { className: "fo-feedback", "aria-live": "polite", "aria-atomic": "true" }, "");
    prediction.appendChild(refs.feedback);
    var actions = element(doc, "div", { className: "fo-actions" });
    var reveal = element(doc, "button", { type: "button", className: "fo-primary" }, "揭示优化账本");
    reveal.addEventListener("click", function () {
      var keys = Object.keys(state.answers);
      if (keys.some(function (key) { return state.answers[key] === null; })) {
        refs.feedback.className = "fo-feedback fo-warn";
        refs.feedback.textContent = "还有预测没有作答。";
        return;
      }
      var result = solve(state.config);
      var specs = questionSpecs(result);
      var expected = {};
      specs.forEach(function (spec) { expected[spec.key] = spec.expected; });
      var correct = keys.filter(function (key) { return state.answers[key] === expected[key]; }).length;
      state.revealed = true;
      refs.resultShell.hidden = false;
      refs.feedback.className = "fo-feedback " + (correct === keys.length ? "fo-pass" : "fo-warn");
      refs.feedback.textContent = "预测得分 " + correct + "/" + keys.length + "；下面分别读取 f 与 F 的 gap、残差和证书。";
      renderPredictions(result);
      renderResult(result);
      announce(api, root, refs.feedback.textContent);
    });
    var reset = element(doc, "button", { type: "button" }, "重置实验");
    reset.addEventListener("click", function () {
      state.config = normalizeConfig({});
      state.answers = { step: null, rate: null, residual: null, pointwise: null };
      state.revealed = false;
      refs.iterationInput.value = String(state.config.iterations);
      refs.resultShell.hidden = true;
      refs.feedback.className = "fo-feedback";
      refs.feedback.textContent = "已重置；请重新完成预测门。";
      renderControls();
      announce(api, root, "一阶方法账本已重置。");
    });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    prediction.appendChild(actions);
    shell.appendChild(prediction);

    refs.resultShell = element(doc, "section", { className: "fo-results", hidden: "hidden" });
    refs.resultShell.appendChild(element(doc, "h4", {}, "揭示后的轨迹与逐步账本"));
    refs.metrics = [
      metric(doc, "L"),
      metric(doc, "μ"),
      metric(doc, "α"),
      metric(doc, "步长证书"),
      metric(doc, "x_f*"),
      metric(doc, "x_F*")
    ];
    refs.resultShell.appendChild(element(doc, "div", { className: "fo-metrics" }, refs.metrics.map(function (item) { return item.node; })));
    var stage = element(doc, "div", { className: "fo-stage" });
    refs.svg = svgElement(doc, "svg", {
      className: "fo-svg",
      viewBox: "0 0 760 360",
      role: "img",
      "aria-label": "平滑与复合目标的对数 gap 对比图"
    });
    stage.appendChild(refs.svg);
    refs.resultShell.appendChild(stage);
    refs.resultShell.appendChild(element(doc, "div", { className: "fo-legend", "aria-label": "图例" }, [
      element(doc, "span", {}, [element(doc, "i", { className: "fo-swatch fo-swatch-blue" }), "GD"]),
      element(doc, "span", {}, [element(doc, "i", { className: "fo-swatch fo-swatch-gold" }), "Nesterov"]),
      element(doc, "span", {}, [element(doc, "i", { className: "fo-swatch fo-swatch-green" }), "PG / ISTA"]),
      element(doc, "span", {}, [element(doc, "i", { className: "fo-swatch fo-swatch-purple" }), "FISTA"]),
      element(doc, "span", {}, [element(doc, "i", { className: "fo-swatch fo-swatch-red" }), "valid bound"])
    ]));
    refs.summary = element(doc, "table", { "aria-label": "方法最终账本" });
    refs.summary.appendChild(element(doc, "caption", {}, "最终行摘要；残差栏对 GD/Nesterov 是 ||∇f||，对 PG/FISTA 是 prox-gradient mapping。"));
    refs.summary.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", {}, "方法"),
      element(doc, "th", {}, "目标"),
      element(doc, "th", {}, "最后 gap"),
      element(doc, "th", {}, "残差"),
      element(doc, "th", {}, "凸界"),
      element(doc, "th", {}, "强凸界"),
      element(doc, "th", {}, "假设")
    ])));
    refs.resultShell.appendChild(element(doc, "div", { className: "fo-table-wrap" }, refs.summary));
    refs.ledger = element(doc, "table", { "aria-label": "一阶方法逐步账本" });
    refs.ledger.appendChild(element(doc, "caption", {}, "每一行保留目标 gap、残差、适用时的上界和步长证书；不同目标不横向排名。"));
    refs.ledger.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", {}, "方法"),
      element(doc, "th", {}, "k"),
      element(doc, "th", {}, "目标"),
      element(doc, "th", {}, "objective gap"),
      element(doc, "th", {}, "residual"),
      element(doc, "th", {}, "凸/加速界"),
      element(doc, "th", {}, "强凸界"),
      element(doc, "th", {}, "step valid")
    ])));
    refs.resultShell.appendChild(element(doc, "div", { className: "fo-table-wrap" }, refs.ledger));
    refs.status = element(doc, "p", { className: "fo-interpretation", "aria-live": "polite" }, "");
    refs.resultShell.appendChild(refs.status);
    shell.appendChild(refs.resultShell);
    root.replaceChildren(shell);

    function renderControls() {
      refs.presetButtons.forEach(function (entry) {
        entry.button.setAttribute("aria-pressed", entry.id === state.config.presetId ? "true" : "false");
      });
      refs.iterationInput.value = String(state.config.iterations);
      refs.iterationOutput.textContent = String(state.config.iterations);
      renderPredictions(solve(state.config));
    }

    renderControls();
    refs.feedback.textContent = "选择步长预设，先完成四项预测。";
  }

  return {
    PROBLEM: PROBLEM,
    PRESETS: PRESETS,
    normalizeConfig: normalizeConfig,
    smoothObjective: smoothObjective,
    compositeObjective: compositeObjective,
    exactComposite: exactComposite,
    prox: prox,
    proxMapping: proxMapping,
    solve: solve,
    runGradientDescent: runGradientDescent,
    runNesterov: runNesterov,
    runProximalGradient: runProximalGradient,
    runFista: runFista,
    selfTest: selfTest,
    mount: mount
  };
});
