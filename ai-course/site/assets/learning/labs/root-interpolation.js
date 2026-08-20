(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("root-interpolation", exported.mount);
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
        "root-interpolation self-test: PASS (" +
          report.checks +
          " checks, " +
          report.rootPresets +
          " root presets, " +
          report.nodeCounts +
          " node counts)"
      );
    } catch (error) {
      console.error("root-interpolation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-root-interpolation-styles";
    var DERIVATIVE_TOLERANCE = 1e-5;
    var MIN_NODE_COUNT = 4;
    var MAX_NODE_COUNT = 32;

    var ROOT_PRESETS = [
      {
        id: "cos-x",
        label: "余弦交点",
        formula: "f(x) = cos x - x",
        f: function (x) { return Math.cos(x) - x; },
        df: function (x) { return -Math.sin(x) - 1; },
        root: 0.7390851332151607,
        a: 0,
        b: 1,
        x0: 0.95,
        continuous: true,
        simpleRoot: true
      },
      {
        id: "cubic",
        label: "三次方程",
        formula: "f(x) = x^3 - x - 1",
        f: function (x) { return x * x * x - x - 1; },
        df: function (x) { return 3 * x * x - 1; },
        root: 1.3247179572447458,
        a: 1,
        b: 2,
        x0: 1.8,
        continuous: true,
        simpleRoot: true
      },
      {
        id: "flat-cubic",
        label: "平根提示",
        formula: "f(x) = (x - 1)^3",
        f: function (x) { var d = x - 1; return d * d * d; },
        df: function (x) { var d = x - 1; return 3 * d * d; },
        root: 1,
        a: 0,
        b: 2,
        x0: 1.2,
        continuous: true,
        simpleRoot: false
      },
      {
        id: "double-root",
        label: "无变号",
        formula: "f(x) = (x - 1)^2",
        f: function (x) { var d = x - 1; return d * d; },
        df: function (x) { return 2 * (x - 1); },
        root: 1,
        a: 0,
        b: 2,
        x0: 0.2,
        continuous: true,
        simpleRoot: false
      }
    ];

    var INTERPOLATION_TYPES = [
      { id: "equidistant", label: "等距节点" },
      { id: "chebyshev", label: "Chebyshev-Lobatto 节点" }
    ];

    var STYLE_TEXT = [
      ".ri-lab{--ri-blue:var(--cl-blue,#315f9d);--ri-gold:var(--cl-gold,#9b6a12);--ri-green:var(--cl-green,#39734d);--ri-red:var(--cl-red,#b64335);max-width:100%;min-width:0;overflow:hidden;color:var(--fg);line-height:1.55;}",
      ".ri-lab *,.ri-lab *::before,.ri-lab *::after{box-sizing:border-box;}",
      ".ri-lab [hidden]{display:none!important;}",
      ".ri-lab h3,.ri-lab h4{margin:0;color:var(--fg);}",
      ".ri-lab h3{font-size:1.18rem;}",
      ".ri-lab h4{margin-top:16px;font-size:1rem;}",
      ".ri-lab p{margin:.65em 0;}",
      ".ri-lab .ri-note,.ri-lab .ri-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}",
      ".ri-lab .ri-mode{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:14px 0;}",
      ".ri-lab button,.ri-lab select,.ri-lab input{font:inherit;letter-spacing:0;}",
      ".ri-lab button,.ri-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}",
      ".ri-lab button:hover{border-color:var(--accent);}",
      ".ri-lab button[aria-pressed=\"true\"],.ri-lab button.ri-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}",
      ".ri-lab button:disabled{cursor:not-allowed;opacity:.55;}",
      ".ri-lab button:focus-visible,.ri-lab select:focus-visible,.ri-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".ri-lab .ri-mode button{font-weight:700;}",
      ".ri-lab .ri-panel{min-width:0;}",
      ".ri-lab .ri-presets{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}",
      ".ri-lab .ri-presets button{flex:1 1 145px;}",
      ".ri-lab .ri-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px 18px;margin:14px 0;}",
      ".ri-lab .ri-control{display:grid;gap:5px;min-width:0;}",
      ".ri-lab .ri-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}",
      ".ri-lab .ri-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".ri-lab .ri-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
      ".ri-lab .ri-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px;}",
      ".ri-lab .ri-gate{margin:16px 0;padding:13px 14px;border-left:3px solid var(--ri-gold);background:var(--bg);}",
      ".ri-lab .ri-gate-title{display:block;margin-bottom:10px;font-size:13px;}",
      ".ri-lab .ri-question-list{display:grid;gap:12px;}",
      ".ri-lab .ri-question{min-width:0;}",
      ".ri-lab .ri-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}",
      ".ri-lab .ri-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
      ".ri-lab .ri-choice-row button{font-size:12px;}",
      ".ri-lab .ri-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}",
      ".ri-lab .ri-actions>*{flex:1 1 160px;}",
      ".ri-lab .ri-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}",
      ".ri-lab .ri-pass{color:var(--ri-green);}",
      ".ri-lab .ri-warn{color:var(--ri-red);}",
      ".ri-lab .ri-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}",
      ".ri-lab .ri-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0;}",
      ".ri-lab .ri-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
      ".ri-lab .ri-metric.ri-blue{border-top-color:var(--ri-blue);}.ri-lab .ri-metric.ri-gold{border-top-color:var(--ri-gold);}.ri-lab .ri-metric.ri-red{border-top-color:var(--ri-red);}.ri-lab .ri-metric.ri-green{border-top-color:var(--ri-green);}",
      ".ri-lab .ri-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}",
      ".ri-lab .ri-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".ri-lab .ri-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:12px;}",
      ".ri-lab .ri-chart{min-width:0;}",
      ".ri-lab .ri-chart-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}",
      ".ri-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}",
      ".ri-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}",
      ".ri-lab .ri-grid-line{stroke:var(--border);stroke-width:1;stroke-opacity:.62;}",
      ".ri-lab .ri-axis{stroke:currentColor;stroke-width:1.15;stroke-opacity:.72;}",
      ".ri-lab .ri-root-line{stroke:var(--ri-red);stroke-width:1.5;stroke-dasharray:5 4;stroke-opacity:.8;}",
      ".ri-lab .ri-function{stroke:var(--ri-blue);stroke-width:2.3;fill:none;}",
      ".ri-lab .ri-truth{stroke:var(--ri-blue);stroke-width:2.3;fill:none;}",
      ".ri-lab .ri-equidistant{stroke:var(--ri-red);stroke-width:2.15;fill:none;}",
      ".ri-lab .ri-chebyshev{stroke:var(--ri-green);stroke-width:2.15;fill:none;}",
      ".ri-lab .ri-bisection{stroke:var(--ri-blue);fill:none;}.ri-lab .ri-newton{stroke:var(--ri-red);fill:none;}.ri-lab .ri-safeguarded{stroke:var(--ri-green);fill:none;}",
      ".ri-lab .ri-marker-bisection{fill:var(--ri-blue);stroke:var(--bg);stroke-width:1.5;}.ri-lab .ri-marker-newton{fill:var(--ri-red);stroke:var(--bg);stroke-width:1.5;}.ri-lab .ri-marker-safeguarded{fill:var(--ri-green);stroke:var(--bg);stroke-width:1.5;}",
      ".ri-lab .ri-baseline{stroke:var(--ri-gold);stroke-width:1.5;stroke-dasharray:5 4;fill:none;}",
      ".ri-lab .ri-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:7px 0 0;color:var(--fg-soft);font-size:12px;}",
      ".ri-lab .ri-legend span{display:inline-flex;align-items:center;gap:5px;}",
      ".ri-lab .ri-swatch{display:inline-block;width:18px;height:3px;background:currentColor;}",
      ".ri-lab .ri-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}",
      ".ri-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
      ".ri-lab .ri-ledger table{min-width:940px;}",
      ".ri-lab th,.ri-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}",
      ".ri-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}",
      ".ri-lab td.ri-state{color:var(--fg-soft);}",
      ".ri-lab .ri-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--ri-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
      ".ri-lab .ri-formula{overflow-x:auto;padding:9px 11px;border-left:3px solid var(--accent);background:var(--bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.65;}",
      "@media(max-width:760px){.ri-lab .ri-controls,.ri-lab .ri-chart-grid{grid-template-columns:minmax(0,1fr);}.ri-lab .ri-choice-row{grid-template-columns:minmax(0,1fr);}.ri-lab .ri-chart-frame{padding:6px;}}",
      "@media(max-width:420px){.ri-lab .ri-presets button{flex-basis:100%;}.ri-lab .ri-gate{padding-left:11px;padding-right:11px;}.ri-lab .ri-ledger{margin-left:-2px;margin-right:-2px;}.ri-lab th,.ri-lab td{padding-left:5px;padding-right:5px;}}",
      "@media(prefers-reduced-motion:reduce){.ri-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-12) * scale;
    }

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function formatNumber(value, digits) {
      if (value === null || value === undefined) return "—";
      if (!finite(value)) return "∞";
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) {
        return value.toExponential(Math.min(digits === undefined ? 3 : digits, 4));
      }
      if (Math.abs(value) >= 100000) return value.toExponential(3);
      var text = value.toFixed(digits === undefined ? 4 : digits);
      return text.replace(/0+$/, "").replace(/\.$/, "");
    }

    function signChange(leftValue, rightValue) {
      return finite(leftValue) && finite(rightValue) &&
        (leftValue === 0 || rightValue === 0 || leftValue * rightValue < 0);
    }

    function findRootPreset(id) {
      for (var i = 0; i < ROOT_PRESETS.length; i += 1) {
        if (ROOT_PRESETS[i].id === id) return ROOT_PRESETS[i];
      }
      return ROOT_PRESETS[0];
    }

    function copyBracket(bracket) {
      if (!bracket) return null;
      return {
        left: bracket.left,
        right: bracket.right,
        fa: bracket.fa,
        fb: bracket.fb,
        valid: bracket.valid
      };
    }

    function bracketData(preset) {
      var fa = preset.f(preset.a);
      var fb = preset.f(preset.b);
      var sign = signChange(fa, fb);
      return {
        left: preset.a,
        right: preset.b,
        fa: fa,
        fb: fb,
        continuous: preset.continuous === true,
        signChange: sign,
        valid: preset.continuous === true && sign,
        reason: preset.continuous !== true
          ? "连续性未声明"
          : sign
            ? "连续且变号"
            : "端点同号或函数值无效"
      };
    }

    function inBracket(bracket, x) {
      if (!bracket || !bracket.valid || !finite(x)) return false;
      var tolerance = 1e-12 * Math.max(1, Math.abs(bracket.left), Math.abs(bracket.right));
      return x >= bracket.left - tolerance && x <= bracket.right + tolerance;
    }

    function shrinkBracket(bracket, x, fx) {
      if (!bracket || !bracket.valid || !finite(x) || !finite(fx)) return null;
      if (fx === 0) {
        return { left: x, right: x, fa: 0, fb: 0, valid: true };
      }
      if (signChange(bracket.fa, fx)) {
        return { left: bracket.left, right: x, fa: bracket.fa, fb: fx, valid: true };
      }
      if (signChange(fx, bracket.fb)) {
        return { left: x, right: bracket.right, fa: fx, fb: bracket.fb, valid: true };
      }
      return copyBracket(bracket);
    }

    function rootRow(method, preset, step, x, bracket, originalBracket, action, candidateStatus) {
      var fx = finite(x) ? preset.f(x) : NaN;
      var derivative = finite(x) ? preset.df(x) : NaN;
      var derivativeStatus = !finite(derivative)
        ? "无效"
        : Math.abs(derivative) <= DERIVATIVE_TOLERANCE
          ? "过小"
          : "正常";
      var currentBoundary = originalBracket.valid
        ? inBracket(originalBracket, x) ? "区间内" : "越界"
        : "无有效变号区间";
      var hasCertificate = bracket && bracket.valid && inBracket(bracket, x);
      return {
        method: method,
        step: step,
        x: x,
        fx: fx,
        residual: finite(fx) ? Math.abs(fx) : NaN,
        rootError: finite(x) ? Math.abs(x - preset.root) : NaN,
        derivative: derivative,
        derivativeStatus: derivativeStatus,
        boundaryStatus: currentBoundary,
        candidateStatus: candidateStatus || "—",
        intervalValid: !!hasCertificate,
        intervalLeft: hasCertificate ? bracket.left : null,
        intervalRight: hasCertificate ? bracket.right : null,
        intervalCertificate: hasCertificate
          ? Math.max(0, (bracket.right - bracket.left) / 2)
          : null,
        action: action || ""
      };
    }

    function runBisection(preset, steps) {
      var original = bracketData(preset);
      var bracket = copyBracket(original);
      var rows = [];
      var limit = Math.max(0, Math.floor(Number(steps) || 0));
      if (!original.valid) {
        var invalidRow = rootRow(
          "bisection",
          preset,
          0,
          (preset.a + preset.b) / 2,
          null,
          original,
          "未运行：连续性/变号条件不满足",
          "无有效区间"
        );
        rows.push(invalidRow);
        return { method: "bisection", label: "二分", valid: false, rows: rows, bracket: original };
      }
      for (var step = 0; step <= limit; step += 1) {
        var x = (bracket.left + bracket.right) / 2;
        var fx = preset.f(x);
        var row = rootRow(
          "bisection",
          preset,
          step,
          x,
          bracket,
          original,
          step === limit ? "记录当前区间" : "",
          "中点在区间内"
        );
        if (fx === 0) {
          row.action = "命中根";
          rows.push(row);
          break;
        }
        if (step < limit) {
          bracket = shrinkBracket(bracket, x, fx);
          row.action = "保留变号半区间";
        }
        rows.push(row);
      }
      return { method: "bisection", label: "二分", valid: true, rows: rows, bracket: original };
    }

    function dampedStep(preset, x, fx, candidate) {
      var alpha = 1;
      var originalResidual = Math.abs(fx);
      for (var attempt = 0; attempt < 8; attempt += 1) {
        var trial = x + alpha * (candidate - x);
        var trialFx = finite(trial) ? preset.f(trial) : NaN;
        if (finite(trialFx) && Math.abs(trialFx) < originalResidual) {
          return { x: trial, fx: trialFx, alpha: alpha };
        }
        alpha *= 0.5;
      }
      return null;
    }

    function runNewton(preset, steps, safeguarded) {
      var original = bracketData(preset);
      var bracket = safeguarded && original.valid ? copyBracket(original) : null;
      var rows = [];
      var limit = Math.max(0, Math.floor(Number(steps) || 0));
      var x = preset.x0;
      var method = safeguarded ? "safeguarded" : "newton";
      var label = safeguarded ? "保守 Newton" : "Newton";

      for (var step = 0; step <= limit; step += 1) {
        var fx = finite(x) ? preset.f(x) : NaN;
        var derivative = finite(x) ? preset.df(x) : NaN;
        var row = rootRow(method, preset, step, x, bracket, original, "", "—");
        if (step === limit) {
          row.action = "记录当前点";
          rows.push(row);
          break;
        }
        if (!finite(fx) || !finite(derivative) || Math.abs(derivative) <= DERIVATIVE_TOLERANCE) {
          row.action = !finite(derivative) || !finite(fx) ? "函数值/导数无效，停止" : "导数过小，停止";
          rows.push(row);
          break;
        }

        var candidate = x - fx / derivative;
        var candidateStatus = original.valid
          ? inBracket(original, candidate) ? "候选在区间内" : "候选越界"
          : "无有效区间";
        row.candidateStatus = candidateStatus;

        if (!finite(candidate)) {
          row.action = "候选点无效，停止";
          rows.push(row);
          break;
        }

        var nextX = candidate;
        var nextFx = preset.f(nextX);
        var nextBracket = bracket;

        if (safeguarded) {
          if (original.valid && !inBracket(original, candidate)) {
            nextX = (bracket.left + bracket.right) / 2;
            nextFx = preset.f(nextX);
            row.action = "候选越界：区间回退到中点";
          } else {
            var damped = dampedStep(preset, x, fx, candidate);
            if (damped) {
              nextX = damped.x;
              nextFx = damped.fx;
              row.action = damped.alpha < 1
                ? "阻尼接受，α=" + formatNumber(damped.alpha, 3)
                : "接受区间内 Newton 步";
            } else if (original.valid) {
              nextX = (bracket.left + bracket.right) / 2;
              nextFx = preset.f(nextX);
              row.action = "残差未下降：区间回退到中点";
            } else {
              row.action = "无区间护栏：接受 Newton 步";
            }
          }
          if (original.valid && finite(nextFx)) {
            nextBracket = shrinkBracket(bracket, nextX, nextFx);
          }
        } else {
          row.action = original.valid && !inBracket(original, candidate)
            ? "Newton 原步越界"
            : "接受 Newton 原步";
        }

        rows.push(row);
        x = nextX;
        bracket = nextBracket;
      }

      return {
        method: method,
        label: label,
        valid: true,
        rows: rows,
        bracket: original,
        safeguarded: safeguarded
      };
    }

    function rootExperiment(presetId, steps) {
      var preset = findRootPreset(presetId);
      var limit = clamp(Math.floor(Number(steps) || 0), 0, 40);
      var bracket = bracketData(preset);
      return {
        preset: preset,
        bracket: bracket,
        steps: limit,
        methods: {
          bisection: runBisection(preset, limit),
          newton: runNewton(preset, limit, false),
          safeguarded: runNewton(preset, limit, true)
        }
      };
    }

    function equidistantNodes(count) {
      var nodes = [];
      for (var i = 0; i < count; i += 1) {
        nodes.push(-1 + (2 * i) / (count - 1));
      }
      return nodes;
    }

    function chebyshevNodes(count) {
      var nodes = [];
      for (var i = 0; i < count; i += 1) {
        nodes.push(Math.cos((Math.PI * i) / (count - 1)));
      }
      return nodes.reverse();
    }

    function nodeSet(kind, count) {
      return kind === "chebyshev" ? chebyshevNodes(count) : equidistantNodes(count);
    }

    function rungeFunction(x) {
      return 1 / (1 + 25 * x * x);
    }

    function barycentricWeights(nodes) {
      var logs = [];
      var signs = [];
      var maxLog = -Infinity;
      for (var i = 0; i < nodes.length; i += 1) {
        var logMagnitude = 0;
        var sign = 1;
        for (var j = 0; j < nodes.length; j += 1) {
          if (i === j) continue;
          var difference = nodes[i] - nodes[j];
          if (!finite(difference) || difference === 0) {
            throw new Error("nodes must be finite and distinct");
          }
          if (difference < 0) sign = -sign;
          logMagnitude -= Math.log(Math.abs(difference));
        }
        logs.push(logMagnitude);
        signs.push(sign);
        if (logMagnitude > maxLog) maxLog = logMagnitude;
      }
      return logs.map(function (logMagnitude, index) {
        return signs[index] * Math.exp(logMagnitude - maxLog);
      });
    }

    function barycentricEvaluate(nodes, values, weights, x) {
      if (!finite(x)) return NaN;
      var numerator = 0;
      var denominator = 0;
      for (var i = 0; i < nodes.length; i += 1) {
        var difference = x - nodes[i];
        if (Math.abs(difference) <= 1e-14 * Math.max(1, Math.abs(x), Math.abs(nodes[i]))) {
          return values[i];
        }
        var term = weights[i] / difference;
        numerator += term * values[i];
        denominator += term;
      }
      return denominator === 0 ? NaN : numerator / denominator;
    }

    function lebesgueAt(nodes, weights, x) {
      if (!finite(x)) return NaN;
      var absoluteSum = 0;
      var signedSum = 0;
      for (var i = 0; i < nodes.length; i += 1) {
        var difference = x - nodes[i];
        if (Math.abs(difference) <= 1e-14 * Math.max(1, Math.abs(x), Math.abs(nodes[i]))) {
          return 1;
        }
        var term = weights[i] / difference;
        absoluteSum += Math.abs(term);
        signedSum += term;
      }
      return signedSum === 0 ? Infinity : absoluteSum / Math.abs(signedSum);
    }

    function sampleGrid(count) {
      var grid = [];
      for (var i = 0; i < count; i += 1) {
        grid.push(-1 + (2 * i) / (count - 1));
      }
      return grid;
    }

    function interpolationSeries(kind, nodeCount, gridSize) {
      var nodes = nodeSet(kind, nodeCount);
      var values = nodes.map(rungeFunction);
      var weights = barycentricWeights(nodes);
      var points = [];
      var maxError = 0;
      var maxLebesgue = 0;
      sampleGrid(gridSize).forEach(function (x) {
        var truth = rungeFunction(x);
        var value = barycentricEvaluate(nodes, values, weights, x);
        var error = finite(value) ? Math.abs(truth - value) : Infinity;
        var lebesgue = lebesgueAt(nodes, weights, x);
        if (error > maxError) maxError = error;
        if (lebesgue > maxLebesgue) maxLebesgue = lebesgue;
        points.push({ x: x, truth: truth, value: value, error: error, lebesgue: lebesgue });
      });
      return {
        kind: kind,
        label: kind === "chebyshev" ? "Chebyshev-Lobatto 节点" : "等距节点",
        nodeCount: nodeCount,
        nodes: nodes,
        values: values,
        weights: weights,
        points: points,
        maxError: maxError,
        maxLebesgue: maxLebesgue
      };
    }

    function interpolationExperiment(nodeCount, gridSize) {
      var count = clamp(Math.floor(Number(nodeCount) || MIN_NODE_COUNT), MIN_NODE_COUNT, MAX_NODE_COUNT);
      var samples = clamp(Math.floor(Number(gridSize) || 401), 41, 1201);
      return {
        nodeCount: count,
        gridSize: samples,
        equidistant: interpolationSeries("equidistant", count, samples),
        chebyshev: interpolationSeries("chebyshev", count, samples)
      };
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function element(doc, tag, className, text) {
      var node = doc.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined && text !== null) node.textContent = text;
      return node;
    }

    function svgNode(doc, tag, attrs, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) {
        node.setAttribute(key, String(attrs[key]));
      });
      if (text !== undefined && text !== null) node.textContent = text;
      return node;
    }

    function appendMetric(doc, parent, label, value, colorClass) {
      var box = element(doc, "div", "ri-metric" + (colorClass ? " " + colorClass : ""));
      box.appendChild(element(doc, "span", "", label));
      box.appendChild(element(doc, "strong", "", value));
      parent.appendChild(box);
    }

    function pathFromPoints(points, xScale, yScale) {
      var path = "";
      var started = false;
      points.forEach(function (point) {
        var x = xScale(point.x);
        var y = yScale(point.y);
        if (!finite(x) || !finite(y)) {
          started = false;
          return;
        }
        path += (started ? "L" : "M") + x + " " + y + " ";
        started = true;
      });
      return path.trim();
    }

    function addAxisGrid(doc, svg, xScale, yScale, yValues, left, right, top, bottom, labels) {
      yValues.forEach(function (value, index) {
        var y = yScale(value);
        svg.appendChild(svgNode(doc, "line", { x1: left, y1: y, x2: right, y2: y, "class": "ri-grid-line" }));
        svg.appendChild(svgNode(doc, "text", { x: left - 6, y: y + 4, "font-size": 10, "text-anchor": "end" }, labels && labels[index] ? labels[index] : formatNumber(value, 2)));
      });
      var zeroY = yScale(0);
      if (finite(zeroY) && zeroY >= top && zeroY <= bottom) {
        svg.appendChild(svgNode(doc, "line", { x1: left, y1: zeroY, x2: right, y2: zeroY, "class": "ri-axis" }));
      }
      svg.appendChild(svgNode(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, "class": "ri-axis" }));
      svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 22, "font-size": 10, "text-anchor": "end" }, "x"));
      return xScale;
    }

    function rootSvg(doc, data) {
      var preset = data.preset;
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 680 350",
        role: "img",
        "aria-label": "函数曲线与三种求根方法的迭代点"
      });
      svg.appendChild(svgNode(doc, "title", {}, "函数曲线与求根迭代点"));
      var left = 48;
      var right = 650;
      var top = 30;
      var bottom = 292;
      var span = Math.max(0.5, Math.abs(preset.b - preset.a));
      var xMin = Math.min(preset.a, preset.b) - 0.18 * span;
      var xMax = Math.max(preset.a, preset.b) + 0.18 * span;
      var samples = [];
      var yMax = 0;
      for (var i = 0; i <= 240; i += 1) {
        var x = xMin + ((xMax - xMin) * i) / 240;
        var y = preset.f(x);
        if (finite(y)) {
          samples.push({ x: x, y: y });
          yMax = Math.max(yMax, Math.abs(y));
        }
      }
      yMax = Math.max(1e-6, yMax * 1.12);
      var xScale = function (x) { return left + ((x - xMin) / (xMax - xMin)) * (right - left); };
      var yScale = function (y) { return bottom - ((y + yMax) / (2 * yMax)) * (bottom - top); };
      addAxisGrid(doc, svg, xScale, yScale, [-yMax, 0, yMax], left, right, top, bottom, ["-" + formatNumber(yMax, 2), "0", formatNumber(yMax, 2)]);
      if (preset.root >= xMin && preset.root <= xMax) {
        var rootX = xScale(preset.root);
        svg.appendChild(svgNode(doc, "line", { x1: rootX, y1: top, x2: rootX, y2: bottom, "class": "ri-root-line" }));
        svg.appendChild(svgNode(doc, "text", { x: rootX + 5, y: top + 13, "font-size": 11 }, "r"));
      }
      svg.appendChild(svgNode(doc, "path", { d: pathFromPoints(samples, xScale, yScale), "class": "ri-function" }));
      var methodClasses = {
        bisection: { line: "ri-bisection", marker: "ri-marker-bisection" },
        newton: { line: "ri-newton", marker: "ri-marker-newton" },
        safeguarded: { line: "ri-safeguarded", marker: "ri-marker-safeguarded" }
      };
      ["bisection", "newton", "safeguarded"].forEach(function (method) {
        var rows = data.methods[method].rows;
        var points = rows.filter(function (row) {
          return finite(row.x) && row.x >= xMin && row.x <= xMax && finite(row.fx);
        }).map(function (row) { return { x: row.x, y: row.fx }; });
        if (points.length > 1) {
          svg.appendChild(svgNode(doc, "path", { d: pathFromPoints(points, xScale, yScale), "class": methodClasses[method].line, "stroke-width": 1.2, "stroke-dasharray": "4 3", opacity: "0.55" }));
        }
        points.forEach(function (point) {
          svg.appendChild(svgNode(doc, "circle", { cx: xScale(point.x), cy: yScale(point.y), r: 4, "class": methodClasses[method].marker }));
        });
      });
      svg.appendChild(svgNode(doc, "text", { x: left, y: 18, "font-size": 13, "font-weight": 700 }, preset.formula));
      svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 22, "font-size": 10, "text-anchor": "end" }, "x；虚线 = 迭代点"));
      return svg;
    }

    function interpolationValueSvg(doc, data) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 680 350",
        role: "img",
        "aria-label": "Runge 函数与等距、Chebyshev 插值曲线"
      });
      svg.appendChild(svgNode(doc, "title", {}, "Runge 函数插值比较"));
      var left = 48;
      var right = 650;
      var top = 30;
      var bottom = 292;
      var allValues = [];
      [data.equidistant, data.chebyshev].forEach(function (series) {
        series.points.forEach(function (point) {
          if (finite(point.value)) allValues.push(point.value);
          allValues.push(point.truth);
        });
      });
      var minimum = Math.min.apply(null, allValues);
      var maximum = Math.max.apply(null, allValues);
      var padding = Math.max(0.04, (maximum - minimum) * 0.1);
      minimum -= padding;
      maximum += padding;
      if (maximum - minimum < 0.2) { minimum -= 0.1; maximum += 0.1; }
      var xScale = function (x) { return left + ((x + 1) / 2) * (right - left); };
      var yScale = function (y) { return bottom - ((y - minimum) / (maximum - minimum)) * (bottom - top); };
      addAxisGrid(doc, svg, xScale, yScale, [minimum, (minimum + maximum) / 2, maximum], left, right, top, bottom);
      var truthPoints = data.equidistant.points.map(function (point) { return { x: point.x, y: point.truth }; });
      var eqPoints = data.equidistant.points.map(function (point) { return { x: point.x, y: point.value }; });
      var chPoints = data.chebyshev.points.map(function (point) { return { x: point.x, y: point.value }; });
      svg.appendChild(svgNode(doc, "path", { d: pathFromPoints(truthPoints, xScale, yScale), "class": "ri-truth" }));
      svg.appendChild(svgNode(doc, "path", { d: pathFromPoints(eqPoints, xScale, yScale), "class": "ri-equidistant" }));
      svg.appendChild(svgNode(doc, "path", { d: pathFromPoints(chPoints, xScale, yScale), "class": "ri-chebyshev" }));
      svg.appendChild(svgNode(doc, "text", { x: left, y: 18, "font-size": 13, "font-weight": 700 }, "Runge f(x)，N=" + data.nodeCount));
      svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 22, "font-size": 10, "text-anchor": "end" }, "x"));
      return svg;
    }

    function interpolationLebesgueSvg(doc, data) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 680 350",
        role: "img",
        "aria-label": "等距与 Chebyshev 节点的 Lebesgue 函数"
      });
      svg.appendChild(svgNode(doc, "title", {}, "Lebesgue 函数比较"));
      var left = 58;
      var right = 650;
      var top = 30;
      var bottom = 292;
      var transform = function (value) { return finite(value) ? Math.log10(1 + value) : 6; };
      var values = [];
      [data.equidistant, data.chebyshev].forEach(function (series) {
        series.points.forEach(function (point) { values.push(transform(point.lebesgue)); });
      });
      var maxValue = Math.max(1, Math.max.apply(null, values));
      maxValue = Math.min(6, maxValue * 1.08);
      var xScale = function (x) { return left + ((x + 1) / 2) * (right - left); };
      var yScale = function (y) { return bottom - (y / maxValue) * (bottom - top); };
      var labels = ["0", formatNumber(maxValue / 2, 2), formatNumber(maxValue, 2)];
      addAxisGrid(doc, svg, xScale, yScale, [0, maxValue / 2, maxValue], left, right, top, bottom, labels);
      var eqPoints = data.equidistant.points.map(function (point) { return { x: point.x, y: transform(point.lebesgue) }; });
      var chPoints = data.chebyshev.points.map(function (point) { return { x: point.x, y: transform(point.lebesgue) }; });
      svg.appendChild(svgNode(doc, "path", { d: pathFromPoints(eqPoints, xScale, yScale), "class": "ri-equidistant" }));
      svg.appendChild(svgNode(doc, "path", { d: pathFromPoints(chPoints, xScale, yScale), "class": "ri-chebyshev" }));
      var baseline = transform(1);
      svg.appendChild(svgNode(doc, "line", { x1: left, y1: yScale(baseline), x2: right, y2: yScale(baseline), "class": "ri-baseline" }));
      svg.appendChild(svgNode(doc, "text", { x: left, y: 18, "font-size": 13, "font-weight": 700 }, "Lebesgue 函数 Λ(x)，纵轴为 log₁₀(1+Λ)"));
      svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 22, "font-size": 10, "text-anchor": "end" }, "虚线：Λ=1"));
      return svg;
    }

    function appendChart(doc, parent, title, svg) {
      var chart = element(doc, "div", "ri-chart");
      chart.appendChild(element(doc, "div", "ri-note", title));
      var frame = element(doc, "div", "ri-chart-frame");
      frame.appendChild(svg);
      chart.appendChild(frame);
      parent.appendChild(chart);
    }

    function appendRootResults(doc, target, data) {
      clear(target);
      var bracket = data.bracket;
      var lastBisection = data.methods.bisection.rows[data.methods.bisection.rows.length - 1];
      var lastNewton = data.methods.newton.rows[data.methods.newton.rows.length - 1];
      var lastSafe = data.methods.safeguarded.rows[data.methods.safeguarded.rows.length - 1];
      var summary = bracket.valid
        ? "本预设满足连续性与变号，二分和保守 Newton 都可以维护区间证书；raw Newton 的证书栏仍然是无。"
        : "本预设虽然连续，但端点没有变号；二分没有存在性证书，保守 Newton 也只能显示无护栏的阻尼行为。";
      target.appendChild(element(doc, "p", "ri-interpretation", summary));

      var metrics = element(doc, "div", "ri-metrics");
      appendMetric(doc, metrics, "函数预设", data.preset.label, "ri-blue");
      appendMetric(doc, metrics, "二分 |f(x)|", formatNumber(lastBisection.residual, 4), "ri-blue");
      appendMetric(doc, metrics, "二分证书半宽", formatNumber(lastBisection.intervalCertificate, 4), "ri-blue");
      appendMetric(doc, metrics, "Newton |f(x)|", formatNumber(lastNewton.residual, 4), "ri-red");
      appendMetric(doc, metrics, "Newton |x-r|", formatNumber(lastNewton.rootError, 4), "ri-red");
      appendMetric(doc, metrics, "保守证书半宽", formatNumber(lastSafe.intervalCertificate, 4), "ri-green");
      target.appendChild(metrics);

      var charts = element(doc, "div", "ri-chart-grid");
      appendChart(doc, charts, "函数与迭代点：蓝=二分，红=Newton，绿=保守 Newton", rootSvg(doc, data));
      target.appendChild(charts);

      var ledger = element(doc, "div", "ri-ledger");
      var table = element(doc, "table");
      table.setAttribute("aria-label", "求根残差、根误差、区间证书与状态账本");
      var head = element(doc, "tr");
      ["步", "方法", "x_k", "|f(x_k)| 残差", "|x_k-r| 根误差", "区间证书", "导数状态", "区间/候选状态", "步态"].forEach(function (label) {
        var th = element(doc, "th", "", label);
        th.scope = "col";
        head.appendChild(th);
      });
      var thead = element(doc, "thead");
      thead.appendChild(head);
      table.appendChild(thead);
      var body = element(doc, "tbody");
      [data.methods.bisection, data.methods.newton, data.methods.safeguarded].forEach(function (method) {
        method.rows.forEach(function (row) {
          var tr = element(doc, "tr");
          var interval = row.intervalCertificate === null
            ? "—"
            : "≤ " + formatNumber(row.intervalCertificate, 4) + "；[" + formatNumber(row.intervalLeft, 3) + ", " + formatNumber(row.intervalRight, 3) + "]";
          [
            row.step,
            method.label,
            formatNumber(row.x, 7),
            formatNumber(row.residual, 6),
            formatNumber(row.rootError, 6),
            interval,
            row.derivativeStatus,
            row.boundaryStatus + " / " + row.candidateStatus,
            row.action
          ].forEach(function (value, index) {
            tr.appendChild(element(doc, "td", index >= 6 ? "ri-state" : "", String(value)));
          });
          body.appendChild(tr);
        });
      });
      table.appendChild(body);
      ledger.appendChild(table);
      target.appendChild(ledger);
      target.appendChild(element(doc, "p", "ri-note", "区间证书是存在性与定位信息，不是把任意 Newton 点自动变成有保证的近似；根误差一栏只有因为本固定预设的根已知，才作为教学对照显示。"));
    }

    function appendInterpolationResults(doc, target, data) {
      clear(target);
      var eq = data.equidistant;
      var ch = data.chebyshev;
      target.appendChild(element(doc, "p", "ri-interpretation", "两条曲线都穿过节点；差别出现在节点之间。当前网格上的最大误差与 Lebesgue 常数分别记账，右图用 log₁₀(1+Λ) 纵轴压缩端部高峰以保持手机屏幕可读。"));
      var metrics = element(doc, "div", "ri-metrics");
      appendMetric(doc, metrics, "节点数 N", String(data.nodeCount), "ri-blue");
      appendMetric(doc, metrics, "等距最大误差 E_N", formatNumber(eq.maxError, 6), "ri-red");
      appendMetric(doc, metrics, "Chebyshev 最大误差 E_N", formatNumber(ch.maxError, 6), "ri-green");
      appendMetric(doc, metrics, "等距 Lebesgue 常数", formatNumber(eq.maxLebesgue, 4), "ri-red");
      appendMetric(doc, metrics, "Chebyshev Lebesgue 常数", formatNumber(ch.maxLebesgue, 4), "ri-green");
      target.appendChild(metrics);

      var charts = element(doc, "div", "ri-chart-grid");
      appendChart(doc, charts, "函数与插值曲线：蓝=f，红=等距，绿=Chebyshev", interpolationValueSvg(doc, data));
      appendChart(doc, charts, "节点放大因子：红=等距，绿=Chebyshev", interpolationLebesgueSvg(doc, data));
      target.appendChild(charts);

      var ledger = element(doc, "div", "ri-ledger");
      var table = element(doc, "table");
      table.setAttribute("aria-label", "两种节点的插值误差与 Lebesgue 常数");
      var head = element(doc, "tr");
      ["节点策略", "节点端点", "节点数", "最大误差 E_N", "Lebesgue 常数 Λ_N", "条件读法"].forEach(function (label) {
        var th = element(doc, "th", "", label);
        th.scope = "col";
        head.appendChild(th);
      });
      var thead = element(doc, "thead");
      thead.appendChild(head);
      table.appendChild(thead);
      var body = element(doc, "tbody");
      [eq, ch].forEach(function (series) {
        var tr = element(doc, "tr");
        var endpoint = "[" + formatNumber(series.nodes[0], 3) + ", " + formatNumber(series.nodes[series.nodes.length - 1], 3) + "]";
        var interpretation = series.kind === "chebyshev"
          ? "端部加密；Runge 型均匀误差通常更稳"
          : "端部稀疏；本例可能出现高峰";
        [series.label, endpoint, series.nodeCount, formatNumber(series.maxError, 6), formatNumber(series.maxLebesgue, 4), interpretation].forEach(function (value) {
          tr.appendChild(element(doc, "td", "", String(value)));
        });
        body.appendChild(tr);
      });
      table.appendChild(body);
      ledger.appendChild(table);
      target.appendChild(ledger);
      target.appendChild(element(doc, "p", "ri-note", "这是 Runge 函数与区间均匀误差的特定比较。若数据带噪、函数有奇异点或目标是加权/局部误差，应重新选择节点、基函数或分段方法。"));
    }

    function makeGate(doc, title, questions, onSelect) {
      var gate = element(doc, "div", "ri-gate");
      gate.appendChild(element(doc, "strong", "ri-gate-title", title));
      var list = element(doc, "div", "ri-question-list");
      questions.forEach(function (question) {
        var fieldset = element(doc, "fieldset", "ri-question");
        var legend = element(doc, "legend", "", question.title);
        fieldset.appendChild(legend);
        var choices = element(doc, "div", "ri-choice-row");
        question.buttons = [];
        question.selected = null;
        question.choices.forEach(function (choice) {
          var button = element(doc, "button", "", choice.label);
          button.type = "button";
          button.addEventListener("click", function () {
            question.selected = choice.value;
            gate.manualMessage = "";
            gate.render();
            if (onSelect) onSelect();
          });
          question.buttons.push({ value: choice.value, node: button });
          choices.appendChild(button);
        });
        fieldset.appendChild(choices);
        list.appendChild(fieldset);
      });
      gate.appendChild(list);
      var actions = element(doc, "div", "ri-actions");
      var check = element(doc, "button", "ri-primary", "核对预测");
      check.type = "button";
      var reset = element(doc, "button", "", "重置本模式");
      reset.type = "button";
      actions.appendChild(check);
      actions.appendChild(reset);
      gate.appendChild(actions);
      var feedback = element(doc, "p", "ri-feedback", "先回答两个判断。");
      gate.appendChild(feedback);
      gate.questions = questions;
      gate.checkButton = check;
      gate.resetButton = reset;
      gate.feedback = feedback;
      gate.manualMessage = "";
      gate.render = function () {
        questions.forEach(function (question) {
          question.buttons.forEach(function (choice) {
            choice.node.setAttribute("aria-pressed", question.selected === choice.value ? "true" : "false");
          });
        });
      };
      gate.reset = function () {
        questions.forEach(function (question) { question.selected = null; });
        gate.manualMessage = "";
        gate.render();
      };
      gate.selectedCount = function () {
        return questions.filter(function (question) { return question.selected !== null; }).length;
      };
      return gate;
    }

    function gateScore(gate, expected) {
      var correct = 0;
      gate.questions.forEach(function (question) {
        if (question.selected === expected[question.id]) correct += 1;
      });
      return { correct: correct, total: gate.questions.length };
    }

    function mount(root, api) {
      var doc = root.ownerDocument;
      installStyles(doc);
      var state = {
        mode: "root",
        rootPresetId: ROOT_PRESETS[0].id,
        rootSteps: 8,
        interpolationNodes: 16,
        rootRevealed: false,
        interpolationRevealed: false
      };

      var shell = element(doc, "div", "ri-lab");
      shell.appendChild(element(doc, "p", "ri-note", "两个模式共用一条纪律：先写条件，再看图；残差、根误差、证书和稳定性状态不混成一个分数。"));
      var mode = element(doc, "div", "ri-mode");
      var rootModeButton = element(doc, "button", "", "求根：二分 / Newton");
      var interpolationModeButton = element(doc, "button", "", "插值：等距 / Chebyshev");
      rootModeButton.type = interpolationModeButton.type = "button";
      mode.appendChild(rootModeButton);
      mode.appendChild(interpolationModeButton);
      shell.appendChild(mode);

      var rootPanel = element(doc, "section", "ri-panel");
      rootPanel.setAttribute("aria-labelledby", "ri-root-title");
      rootPanel.appendChild(element(doc, "h3", "", "求根：稳健性与速度分开记账"));
      var rootTitle = rootPanel.querySelector("h3");
      rootTitle.id = "ri-root-title";
      rootPanel.appendChild(element(doc, "p", "ri-note", "函数是固定预设；二分检查连续性与变号，Newton 暴露局部条件，保守 Newton 维护有效区间并在需要时阻尼或回退。"));
      var rootPresets = element(doc, "div", "ri-presets");
      var rootPresetButtons = [];
      ROOT_PRESETS.forEach(function (preset) {
        var button = element(doc, "button", "", preset.label);
        button.type = "button";
        button.addEventListener("click", function () {
          state.rootPresetId = preset.id;
          state.rootRevealed = false;
          rootGate.reset();
          render();
        });
        rootPresetButtons.push({ id: preset.id, node: button });
        rootPresets.appendChild(button);
      });
      rootPanel.appendChild(rootPresets);

      var rootControls = element(doc, "div", "ri-controls");
      var rootControl = element(doc, "div", "ri-control");
      var rootLabel = element(doc, "label", "", "迭代上限：");
      var rootOutput = element(doc, "output", "", "8");
      rootLabel.appendChild(rootOutput);
      var rootInput = element(doc, "input");
      rootInput.type = "range";
      rootInput.id = "ri-root-steps";
      rootInput.min = "4";
      rootInput.max = "14";
      rootInput.step = "1";
      rootInput.value = "8";
      rootInput.setAttribute("aria-label", "求根迭代上限");
      rootInput.addEventListener("input", function () {
        state.rootSteps = Math.round(Number(rootInput.value));
        state.rootRevealed = false;
        rootGate.reset();
        render();
      });
      rootControl.appendChild(rootLabel);
      rootControl.appendChild(rootInput);
      var rootScale = element(doc, "div", "ri-scale");
      rootScale.appendChild(element(doc, "span", "", "4"));
      rootScale.appendChild(element(doc, "span", "", "14"));
      rootControl.appendChild(rootScale);
      rootControls.appendChild(rootControl);
      var rootFormula = element(doc, "div", "ri-formula", "证书条件：f 连续，f(a)·f(b) ≤ 0；Newton 条件：单根邻域且 |f'| 不过小。");
      rootControls.appendChild(rootFormula);
      rootPanel.appendChild(rootControls);

      var rootGate = makeGate(doc, "先预测：这次哪些说法有保证？", [
        {
          id: "certificate",
          title: "当前预设中，哪一组方法能维护区间证书？",
          choices: [
            { value: "safe", label: "二分 + 保守 Newton" },
            { value: "raw", label: "只有 raw Newton" },
            { value: "none", label: "没有可靠证书" }
          ]
        },
        {
          id: "residual",
          title: "某一步 |f(x)| 很小，是否无条件推出 |x-r| 很小？",
          choices: [
            { value: "yes", label: "是" },
            { value: "no", label: "不是" },
            { value: "bisection", label: "只对二分是" }
          ]
        }
      ], render);
      rootGate.checkButton.addEventListener("click", function () {
        if (rootGate.selectedCount() < rootGate.questions.length) {
          rootGate.manualMessage = "请先回答两个判断。";
          render();
          return;
        }
        state.rootRevealed = true;
        rootGate.manualMessage = "";
        render();
        if (api && api.announce) api.announce(root, "求根预测已核对，结果和账本已展开。");
      });
      rootGate.resetButton.addEventListener("click", function () {
        state.rootRevealed = false;
        rootGate.reset();
        render();
      });
      rootPanel.appendChild(rootGate);
      var rootResults = element(doc, "div", "ri-results");
      rootResults.hidden = true;
      rootPanel.appendChild(rootResults);
      shell.appendChild(rootPanel);

      var interpolationPanel = element(doc, "section", "ri-panel");
      interpolationPanel.setAttribute("aria-labelledby", "ri-interpolation-title");
      interpolationPanel.appendChild(element(doc, "h3", "", "插值：节点分布与放大因子"));
      var interpolationTitle = interpolationPanel.querySelector("h3");
      interpolationTitle.id = "ri-interpolation-title";
      interpolationPanel.appendChild(element(doc, "p", "ri-note", "固定 Runge 函数，在同一个节点数下比较等距和 Chebyshev-Lobatto 节点；重心公式避免幂基展开，Lebesgue 图显示节点误差的放大结构。"));
      var interpolationControls = element(doc, "div", "ri-controls");
      var interpolationControl = element(doc, "div", "ri-control");
      var interpolationLabel = element(doc, "label", "", "节点数 N：");
      var interpolationOutput = element(doc, "output", "", "16");
      interpolationLabel.appendChild(interpolationOutput);
      var interpolationInput = element(doc, "input");
      interpolationInput.type = "range";
      interpolationInput.id = "ri-interpolation-nodes";
      interpolationInput.min = String(MIN_NODE_COUNT);
      interpolationInput.max = String(MAX_NODE_COUNT);
      interpolationInput.step = "1";
      interpolationInput.value = "16";
      interpolationInput.setAttribute("aria-label", "插值节点数");
      interpolationInput.addEventListener("input", function () {
        state.interpolationNodes = Math.round(Number(interpolationInput.value));
        state.interpolationRevealed = false;
        interpolationGate.reset();
        render();
      });
      interpolationControl.appendChild(interpolationLabel);
      interpolationControl.appendChild(interpolationInput);
      var interpolationScale = element(doc, "div", "ri-scale");
      interpolationScale.appendChild(element(doc, "span", "", String(MIN_NODE_COUNT)));
      interpolationScale.appendChild(element(doc, "span", "", String(MAX_NODE_COUNT)));
      interpolationControl.appendChild(interpolationScale);
      interpolationControls.appendChild(interpolationControl);
      interpolationControls.appendChild(element(doc, "div", "ri-formula", "Λ_N(x)=Σ|w_i/(x−x_i)| / |Σw_i/(x−x_i)|；在 x=x_i 直接取 1。"));
      interpolationPanel.appendChild(interpolationControls);

      var interpolationGate = makeGate(doc, "先预测：节点增多会怎样？", [
        {
          id: "nodes",
          title: "对 Runge 函数的区间均匀误差，哪种节点更值得先试？",
          choices: [
            { value: "chebyshev", label: "Chebyshev 节点" },
            { value: "equidistant", label: "等距节点" },
            { value: "both", label: "两者无差别" }
          ]
        },
        {
          id: "scope",
          title: "Chebyshev 的优势应如何表述？",
          choices: [
            { value: "condition", label: "有条件的均匀误差优势" },
            { value: "always", label: "对所有任务都最好" },
            { value: "noise", label: "噪声越大越保证" }
          ]
        }
      ], render);
      interpolationGate.checkButton.addEventListener("click", function () {
        if (interpolationGate.selectedCount() < interpolationGate.questions.length) {
          interpolationGate.manualMessage = "请先回答两个判断。";
          render();
          return;
        }
        state.interpolationRevealed = true;
        interpolationGate.manualMessage = "";
        render();
        if (api && api.announce) api.announce(root, "插值预测已核对，曲线和 Lebesgue 账本已展开。");
      });
      interpolationGate.resetButton.addEventListener("click", function () {
        state.interpolationRevealed = false;
        interpolationGate.reset();
        render();
      });
      interpolationPanel.appendChild(interpolationGate);
      var interpolationResults = element(doc, "div", "ri-results");
      interpolationResults.hidden = true;
      interpolationPanel.appendChild(interpolationResults);
      interpolationPanel.hidden = true;
      shell.appendChild(interpolationPanel);
      root.replaceChildren(shell);

      function expectedRoot(data) {
        return {
          certificate: data.bracket.valid ? "safe" : "none",
          residual: "no"
        };
      }

      function expectedInterpolation() {
        return { nodes: "chebyshev", scope: "condition" };
      }

      function renderGate(gate, revealed, expected) {
        gate.render();
        var score = gateScore(gate, expected);
        if (gate.manualMessage) {
          gate.feedback.textContent = gate.manualMessage;
          gate.feedback.className = "ri-feedback ri-warn";
        } else if (!revealed) {
          gate.feedback.textContent = gate.selectedCount() === gate.questions.length
            ? "预测已记录，点击“核对预测”查看结果。"
            : "先回答两个判断。";
          gate.feedback.className = "ri-feedback";
        } else {
          gate.feedback.textContent = "预测得分 " + score.correct + "/" + score.total + "。现在对照残差、根误差、证书或 Lebesgue 常数检查理由。";
          gate.feedback.className = "ri-feedback " + (score.correct === score.total ? "ri-pass" : "ri-warn");
        }
      }

      function render() {
        var rootData = rootExperiment(state.rootPresetId, state.rootSteps);
        var interpolationData = interpolationExperiment(state.interpolationNodes, 401);
        rootModeButton.setAttribute("aria-pressed", state.mode === "root" ? "true" : "false");
        interpolationModeButton.setAttribute("aria-pressed", state.mode === "interpolation" ? "true" : "false");
        rootPanel.hidden = state.mode !== "root";
        interpolationPanel.hidden = state.mode !== "interpolation";
        rootPresetButtons.forEach(function (entry) {
          entry.node.setAttribute("aria-pressed", entry.id === state.rootPresetId ? "true" : "false");
        });
        rootInput.value = String(state.rootSteps);
        rootOutput.textContent = String(state.rootSteps);
        interpolationInput.value = String(state.interpolationNodes);
        interpolationOutput.textContent = String(state.interpolationNodes);
        renderGate(rootGate, state.rootRevealed, expectedRoot(rootData));
        renderGate(interpolationGate, state.interpolationRevealed, expectedInterpolation());
        rootResults.hidden = !state.rootRevealed || state.mode !== "root";
        interpolationResults.hidden = !state.interpolationRevealed || state.mode !== "interpolation";
        if (state.rootRevealed && state.mode === "root") appendRootResults(doc, rootResults, rootData);
        else clear(rootResults);
        if (state.interpolationRevealed && state.mode === "interpolation") appendInterpolationResults(doc, interpolationResults, interpolationData);
        else clear(interpolationResults);
      }

      rootModeButton.addEventListener("click", function () {
        state.mode = "root";
        render();
      });
      interpolationModeButton.addEventListener("click", function () {
        state.mode = "interpolation";
        render();
      });
      render();
    }

    function installStyles(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = element(doc, "style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function selfTest() {
      var checks = 0;
      function assert(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }

      assert(ROOT_PRESETS.length >= 4, "root preset coverage");
      ROOT_PRESETS.forEach(function (preset) {
        assert(finite(preset.f(preset.root)), preset.id + " finite root function");
        assert(Math.abs(preset.f(preset.root)) < 1e-10, preset.id + " root reference");
        assert(preset.continuous === true, preset.id + " continuity declaration");
      });

      var cosine = rootExperiment("cos-x", 10);
      assert(cosine.bracket.valid, "cosine bracket certificate");
      cosine.methods.bisection.rows.forEach(function (row) {
        assert(row.intervalCertificate !== null, "bisection certificate exists");
        assert(row.rootError <= row.intervalCertificate + 1e-10, "bisection certificate bounds root error");
      });
      var noSign = rootExperiment("double-root", 8);
      assert(!noSign.bracket.valid && !noSign.methods.bisection.valid, "same-sign bracket rejected");
      assert(noSign.methods.bisection.rows[0].intervalCertificate === null, "invalid bisection has no certificate");
      assert(cosine.methods.newton.rows.length > 1, "Newton advances");
      assert(cosine.methods.safeguarded.rows.length > 1, "safeguarded Newton advances");
      var flat = rootExperiment("flat-cubic", 12);
      assert(flat.methods.safeguarded.rows.some(function (row) { return row.derivativeStatus === "过小"; }) || !flat.bracket.valid, "flat root exposes derivative condition");
      assert(cosine.methods.newton.rows.some(function (row) { return row.intervalCertificate === null; }), "raw Newton has no interval certificate");

      [4, 8, 16, 32].forEach(function (count) {
        var experiment = interpolationExperiment(count, 401);
        [experiment.equidistant, experiment.chebyshev].forEach(function (series) {
          assert(series.weights.every(finite), series.kind + " finite weights at " + count);
          series.nodes.forEach(function (node, index) {
            assert(near(barycentricEvaluate(series.nodes, series.values, series.weights, node), series.values[index], 1e-10), series.kind + " node exactness at " + count);
          });
          assert(series.maxError >= 0 && finite(series.maxError), series.kind + " finite max error at " + count);
          assert(series.maxLebesgue >= 1 - 1e-9 && finite(series.maxLebesgue), series.kind + " Lebesgue constant at " + count);
        });
      });
      var comparison = interpolationExperiment(16, 801);
      assert(comparison.chebyshev.maxError < comparison.equidistant.maxError, "Chebyshev reduces Runge max error");
      assert(comparison.chebyshev.maxLebesgue < comparison.equidistant.maxLebesgue, "Chebyshev reduces Lebesgue constant");
      assert(Math.abs(barycentricEvaluate([-1, 1], [2, 4], barycentricWeights([-1, 1]), 0) - 3) < 1e-12, "two-node barycentric interpolation");

      return {
        checks: checks,
        rootPresets: ROOT_PRESETS.length,
        nodeCounts: 4
      };
    }

    var exported = {
      ROOT_PRESETS: ROOT_PRESETS,
      INTERPOLATION_TYPES: INTERPOLATION_TYPES,
      rungeFunction: rungeFunction,
      bracketData: bracketData,
      runBisection: runBisection,
      runNewton: runNewton,
      rootExperiment: rootExperiment,
      equidistantNodes: equidistantNodes,
      chebyshevNodes: chebyshevNodes,
      barycentricWeights: barycentricWeights,
      barycentricEvaluate: barycentricEvaluate,
      lebesgueAt: lebesgueAt,
      interpolationSeries: interpolationSeries,
      interpolationExperiment: interpolationExperiment,
      mount: mount,
      selfTest: selfTest
    };

    return exported;
  }
);
