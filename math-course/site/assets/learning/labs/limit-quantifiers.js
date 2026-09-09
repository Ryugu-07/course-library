(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("limit-quantifiers", exported.mount);
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
        "limit-quantifiers self-test: PASS (" +
          report.checks +
          " checks, " +
          report.models +
          " models)"
      );
    } catch (error) {
      console.error("limit-quantifiers self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-limit-quantifiers-style";
    var INSTANCE = 0;

    var DEFAULTS = {
      modelId: "linear",
      ruleId: "eps-over-3",
      epsilon: 0.3,
      probeCount: 6
    };

    var MODELS = [
      {
        id: "linear",
        label: "线性：3x + 1",
        formula: "f(x) = 3x + 1",
        x0: 2,
        limit: 7,
        kind: "two-sided",
        f: function (x) { return 3 * x + 1; },
        theorem: "精确 Lipschitz 常数为 3；任意 δ ≤ ε/3 都是两侧证书。",
        boundary: "证书控制的是所有穿孔邻域点；有限探针只提供有限证据。"
      },
      {
        id: "square",
        label: "平方：x² at 1",
        formula: "f(x) = x²",
        x0: 1,
        limit: 1,
        kind: "two-sided",
        f: function (x) { return x * x; },
        theorem: "在 |x−1| < 1/2 内有 |x+1| < 5/2；δ = min(1/2, ε/3) 足够。",
        boundary: "局部因子界依赖先选出的邻域；不能把它当作全局 Lipschitz 常数。"
      },
      {
        id: "jump",
        label: "跳跃：sgn(x) at 0",
        formula: "f(x) = sgn(x)",
        x0: 0,
        limit: null,
        kind: "jump",
        leftLimit: -1,
        rightLimit: 1,
        f: function (x) { return x < 0 ? -1 : x > 0 ? 1 : 0; },
        theorem: "左右单侧极限分别为 −1 与 1，故不存在共同的两侧有限极限。",
        boundary: "单侧极限存在不等于两侧极限存在；x = 0 的函数值被穿孔条件跳过。"
      },
      {
        id: "reciprocal",
        label: "发散：1/x at 0",
        formula: "f(x) = 1/x",
        x0: 0,
        limit: null,
        kind: "divergent",
        leftLimit: -Infinity,
        rightLimit: Infinity,
        f: function (x) { return 1 / x; },
        theorem: "左侧趋向 −∞、右侧趋向 +∞；不存在有限的两侧极限。",
        boundary: "图形会截断纵轴；有限屏幕读数不是无穷极限的定义。"
      },
      {
        id: "oscillatory",
        label: "振荡：sin(1/x) at 0",
        formula: "f(x) = sin(1/x)",
        x0: 0,
        limit: null,
        kind: "oscillatory",
        leftLimit: null,
        rightLimit: null,
        f: function (x) { return Math.sin(1 / x); },
        theorem: "任意穿孔邻域都包含输出接近 −1 与 1 的点；两侧都不收敛。",
        boundary: "有限采样可能漏掉振荡峰；Heine 反例要构造趋向 0 的两条数列。"
      }
    ];

    var RULES = [
      {
        id: "eps-over-3",
        label: "δ = ε/3",
        f: function (epsilon) { return epsilon / 3; }
      },
      {
        id: "min-one",
        label: "δ = min(1, ε/3)",
        f: function (epsilon) { return Math.min(1, epsilon / 3); }
      },
      {
        id: "eps",
        label: "δ = ε",
        f: function (epsilon) { return epsilon; }
      },
      {
        id: "sqrt-eps",
        label: "δ = √ε",
        f: function (epsilon) { return Math.sqrt(epsilon); }
      },
      {
        id: "local-square",
        label: "δ = min(1/2, ε/3)",
        f: function (epsilon) { return Math.min(0.5, epsilon / 3); }
      }
    ];

    var STYLE_TEXT = [
      ".lq-lab{--lq-blue:#315f9d;--lq-gold:#9b6a12;--lq-green:#39734d;--lq-red:#b64335;max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      ".lq-lab *,.lq-lab *::before,.lq-lab *::after{box-sizing:border-box;}.lq-lab [hidden]{display:none!important;}",
      ".lq-lab h3,.lq-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.lq-lab h3{font-size:1.18rem;}.lq-lab h4{margin-top:16px;font-size:1rem;}",
      ".lq-lab p{margin:.65em 0;}.lq-lab .lq-note,.lq-lab .lq-feedback,.lq-lab .lq-boundary{color:var(--fg-soft);font-size:13px;line-height:1.7;}",
      ".lq-lab button,.lq-lab select,.lq-lab input{font:inherit;letter-spacing:0;}.lq-lab button,.lq-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}",
      ".lq-lab input[type=range],.lq-lab input[type=number]{min-height:44px;}.lq-lab input[type=range]{display:block;width:100%;margin:0;accent-color:var(--accent);}.lq-lab input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);}",
      ".lq-lab button:hover{border-color:var(--accent);}.lq-lab button[aria-pressed=\"true\"],.lq-lab button.lq-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.lq-lab button:focus-visible,.lq-lab select:focus-visible,.lq-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".lq-lab .lq-predict{margin:14px 0;padding:13px 14px;border-left:3px solid var(--lq-gold);background:var(--bg);}.lq-lab .lq-predict-title{display:block;margin-bottom:10px;font-size:13px;}.lq-lab .lq-question-list{display:grid;gap:12px;}.lq-lab .lq-question{min-width:0;margin:0;padding:0;border:0;}.lq-lab .lq-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}.lq-lab .lq-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.lq-lab .lq-choice-row button{font-size:12px;}",
      ".lq-lab .lq-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.lq-lab .lq-actions>*{flex:1 1 155px;}.lq-lab .lq-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.lq-lab .lq-pass,.lq-lab .lq-ok{color:var(--lq-green);}.lq-lab .lq-warn,.lq-lab .lq-fail{color:var(--lq-red);}",
      ".lq-lab .lq-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin:14px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.lq-lab .lq-control{display:grid;gap:5px;min-width:0;}.lq-lab .lq-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}.lq-lab .lq-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".lq-lab .lq-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:12px 0;}.lq-lab .lq-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.lq-lab .lq-metric.lq-blue{border-top-color:var(--lq-blue);}.lq-lab .lq-metric.lq-gold{border-top-color:var(--lq-gold);}.lq-lab .lq-metric.lq-green{border-top-color:var(--lq-green);}.lq-lab .lq-metric.lq-red{border-top-color:var(--lq-red);}.lq-lab .lq-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.lq-lab .lq-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".lq-lab .lq-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.lq-lab .lq-charts{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-top:12px;}.lq-lab .lq-chart{min-width:0;}.lq-lab .lq-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;overflow-y:hidden;}.lq-lab svg{display:block;width:100%;min-width:650px;height:auto;color:var(--fg);}.lq-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.lq-lab .lq-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.lq-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.lq-lab th,.lq-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.lq-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.lq-lab .lq-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--lq-green);background:var(--bg);font-size:13px;line-height:1.7;}",
      ".lq-lab .lq-ledger-details{margin-top:14px;}.lq-lab .lq-ledger-details summary{padding:10px 0;min-height:44px;cursor:pointer;font-size:14px;line-height:1.6;font-weight:700;}",
      "@media(max-width:760px){.lq-lab .lq-controls,.lq-lab .lq-charts{grid-template-columns:minmax(0,1fr);}.lq-lab .lq-choice-row{grid-template-columns:minmax(0,1fr);}}",
      "@media(max-width:420px){.lq-lab .lq-predict{padding-left:11px;padding-right:11px;}.lq-lab th,.lq-lab td{padding-left:5px;padding-right:5px;}}",
      "@media(prefers-reduced-motion:reduce){.lq-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
      ,'[data-theme="dark"] .lq-lab{--lq-blue:#8ab4f8;--lq-gold:#dfb971;--lq-green:#88c6a0;--lq-red:#ed9995;}'
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function modelById(id) {
      for (var i = 0; i < MODELS.length; i += 1) {
        if (MODELS[i].id === id) return MODELS[i];
      }
      throw new Error("Unknown limit model: " + id);
    }

    function ruleById(id) {
      for (var i = 0; i < RULES.length; i += 1) {
        if (RULES[i].id === id) return RULES[i];
      }
      throw new Error("Unknown delta rule: " + id);
    }

    function positiveEpsilon(value) {
      var epsilon = value;
      if (!finite(epsilon) || epsilon <= 0) throw new Error("epsilon must be positive");
      return epsilon;
    }

    function candidateDelta(ruleId, epsilon) {
      var rule = ruleById(ruleId);
      var delta = rule.f(positiveEpsilon(epsilon));
      if (!finite(delta) || delta <= 0) throw new Error("delta rule returned an invalid value");
      return delta;
    }

    function evaluate(modelId, x) {
      var selected = modelById(modelId);
      if (!finite(x)) throw new RangeError("x must be finite");
      if (x === 0 && ["reciprocal", "oscillatory"].indexOf(modelId) !== -1) throw new RangeError("function undefined at zero");
      return selected.f(x);
    }

    function certificate(modelId, ruleId) {
      var selected = modelById(modelId);
      ruleById(ruleId);
      if (selected.id === "linear" && ["eps-over-3", "min-one", "local-square"].indexOf(ruleId) !== -1) {
        return {
          level: "theorem",
          label: "定理证书",
          text: "线性误差恒为 3|x−2|；该规则给出 δ ≤ ε/3。"
        };
      }
      if (selected.id === "square" && ["local-square", "min-one"].indexOf(ruleId) !== -1) {
        return {
          level: "theorem",
          label: "定理证书",
          text: ruleId === "local-square" ? "先锁定 |x−1| < 1/2，再用 |x+1| < 5/2 控制乘积。" : "先锁定 |x−1| < 1，再用 |x+1| < 3；δ ≤ ε/3 对所有 ε 都足够。"
        };
      }
      if (selected.kind !== "two-sided") {
        return {
          level: "counterexample",
          label: "反例模型",
          text: "此模型没有共同的两侧有限极限；δ 规则不能制造不存在的极限。"
        };
      }
      return {
        level: "invalid-rule",
        label: "不是全 ε 证书",
        text: selected.id === "square" && ruleId === "eps-over-3" ? "取 ε=6、δ=2、x=2.9，误差7.41>6；当前较小 ε 通过也不能证明全 ε 规则。" : "该规则不能对所有 ε 成立；例如 ε=0.3 时，误差上确界超过 ε，可在右侧邻域内构造反例。"
      };
    }

    function probeTotal(count) {
      var n = count === undefined ? DEFAULTS.probeCount : count;
      if (!Number.isInteger(n) || n < 3 || n > 1000) throw new RangeError("probe count must be an integer from 3 to 1000");
      return n;
    }

    function currentCertificate(modelId, delta, epsilon) {
      var selected = modelById(modelId);
      if (selected.limit === null) return { valid: null, supremum: null, witness: null };
      var critical = modelId === "linear" ? epsilon / 3 : epsilon / (Math.sqrt(1 + epsilon) + 1);
      var valid = delta <= critical;
      var h = valid ? null : (critical + delta) / 2;
      return { valid: valid, supremum: modelId === "linear" ? 3 * delta : delta * (2 + delta),
        witness: h === null ? null : { x: selected.x0 + h, error: modelId === "linear" ? 3 * h : h * (2 + h) } };
    }

    function probeFractions(count) {
      var rows = [];
      var total = probeTotal(count);
      for (var i = 1; i <= total; i += 1) {
        var fraction = i / (total + 1);
        rows.push(-fraction);
        rows.push(fraction);
      }
      return rows;
    }

    function probe(modelId, ruleId, epsilon, count) {
      var selected = modelById(modelId);
      var delta = candidateDelta(ruleId, epsilon);
      var rows = probeFractions(count).map(function (fraction) {
        var x = selected.x0 + fraction * delta;
        if (x === selected.x0 || !finite(x) || !(Math.abs(x - selected.x0) < delta)) throw new RangeError("punctured probe is not representable at this scale");
        var value = selected.f(x);
        if (!finite(value)) throw new RangeError("probe output is not representable");
        var offset = fraction * delta;
        var error = selected.limit === null ? null : selected.id === "linear" ? 3 * Math.abs(offset) : Math.abs(offset * (2 + offset));
        var boundary = error !== null && Math.abs(error - epsilon) <= 32 * Number.EPSILON * Math.max(error, epsilon);
        return {
          fraction: fraction,
          x: x,
          value: value,
          error: error,
          boundary: boundary,
          passes: error === null || boundary ? null : error < epsilon
        };
      });
      return {
        delta: delta,
        epsilon: positiveEpsilon(epsilon),
        rows: rows,
        passed: rows.filter(function (row) { return row.passes; }).length,
        failed: rows.filter(function (row) { return row.passes === false; }).length
      };
    }

    function range(values) {
      var finiteValues = values.filter(finite);
      if (!finiteValues.length) return { min: null, max: null, spread: null };
      var min = Math.min.apply(null, finiteValues);
      var max = Math.max.apply(null, finiteValues);
      return { min: min, max: max, spread: max - min };
    }

    function sideEvidence(modelId, delta, count) {
      var selected = modelById(modelId);
      if (!finite(delta) || delta <= 0) throw new RangeError("delta must be positive and finite");
      var total = probeTotal(count);
      var left = [];
      var right = [];
      for (var i = 1; i <= total; i += 1) {
        var distance = delta * (i / (total + 1));
        var xl = selected.x0 - distance, xr = selected.x0 + distance;
        var yl = selected.f(xl), yr = selected.f(xr);
        if (xl === selected.x0 || xr === selected.x0 || !finite(yl) || !finite(yr)) throw new RangeError("side probe is not representable");
        left.push(yl); right.push(yr);
      }
      var leftRange = range(left);
      var rightRange = range(right);
      var targetErrors = selected.limit === null ? null : {
        left: Math.max.apply(null, left.map(function (value) { return Math.abs(value - selected.limit); })),
        right: Math.max.apply(null, right.map(function (value) { return Math.abs(value - selected.limit); }))
      };
      return {
        left: left,
        right: right,
        leftRange: leftRange,
        rightRange: rightRange,
        targetErrors: targetErrors,
        spread: leftRange.spread === null || rightRange.spread === null
          ? null
          : Math.max(leftRange.max, rightRange.max) - Math.min(leftRange.min, rightRange.min)
      };
    }

    function analyze(options) {
      var settings = options || {};
      var modelId = settings.modelId || DEFAULTS.modelId;
      var ruleId = settings.ruleId || DEFAULTS.ruleId;
      var epsilon = positiveEpsilon(settings.epsilon === undefined ? DEFAULTS.epsilon : settings.epsilon);
      if (epsilon < 1e-8 || epsilon > 10) throw new RangeError("numeric display epsilon range is 1e-8 to 10; analytic rules have no such restriction");
      var selected = modelById(modelId);
      var sampled = probe(modelId, ruleId, epsilon, settings.probeCount === undefined ? DEFAULTS.probeCount : settings.probeCount);
      var sides = sideEvidence(modelId, sampled.delta, settings.probeCount === undefined ? DEFAULTS.probeCount : settings.probeCount);
      return {
        model: selected,
        rule: ruleById(ruleId),
        epsilon: epsilon,
        delta: sampled.delta,
        probes: sampled.rows,
        passed: sampled.passed,
        failed: sampled.failed,
        side: sides,
        current: currentCertificate(modelId, sampled.delta, epsilon),
        certificate: certificate(modelId, ruleId),
        isTheorem: certificate(modelId, ruleId).level === "theorem"
      };
    }

    function formatNumber(value, digits) {
      if (value === Infinity) return "+∞";
      if (value === -Infinity) return "−∞";
      if (!finite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(places);
      var text = value.toFixed(places);
      return places === 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", value);
        else if (key === "text") node.textContent = value;
        else if (key.slice(0, 2) === "on" && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === null || child === undefined) return;
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function replaceChildren(node, children) {
      while (node.firstChild) node.removeChild(node.firstChild);
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
      });
    }

    function svgNode(doc, tag, attrs, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) {
        node.setAttribute(key, String(attrs[key]));
      });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function pathFrom(points, mapX, mapY) {
      var commands = [];
      var open = false;
      points.forEach(function (point) {
        if (!finite(point.y)) {
          open = false;
          return;
        }
        // Keep the real coordinates: the SVG clip trims the curve, without
        // turning values beyond the viewport into artificial horizontal lines.
        commands.push((open ? "L" : "M") + mapX(point.x) + " " + mapY(point.y));
        open = true;
      });
      return commands.join(" ");
    }

    function plotBounds(data) {
      var selected = data.model;
      var span = Math.max(data.delta * 1.5, selected.kind === "two-sided" ? 0.05 : 0.6);
      var ySpan = Math.max(data.epsilon * 1.8, 0.1);
      return {
        xMin: selected.x0 - span,
        xMax: selected.x0 + span,
        yMin: selected.kind === "two-sided" ? selected.limit - ySpan : (selected.kind === "divergent" ? -4 : -1.5),
        yMax: selected.kind === "two-sided" ? selected.limit + ySpan : (selected.kind === "divergent" ? 4 : 1.5)
      };
    }

    function plotSvg(doc, data, uid) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 520 400",
        role: "img",
        "aria-labelledby": uid + "-title " + uid + "-desc"
      });
      svg.appendChild(svgNode(doc, "title", { id: uid + "-title" }, "函数、输入邻域与输出误差带"));
      svg.appendChild(svgNode(doc, "desc", { id: uid + "-desc" },
        "蓝色竖带表示 x₀−δ 到 x₀+δ，中心点排除；金色横带表示 L−ε 到 L+ε。圆点是有限探针，边缘三角表示读数超出纵轴。没有共同目标 L 时不评通过率。"));
      var margin = { left: 108, right: 40, top: 48, bottom: 85 };
      var width = 520 - margin.left - margin.right;
      var height = 360 - margin.top - margin.bottom;
      var selected = data.model;
      var bounds = plotBounds(data);
      var mapX = function (x) { return margin.left + (x - bounds.xMin) / (bounds.xMax - bounds.xMin) * width; };
      var mapY = function (y) { return margin.top + (bounds.yMax - y) / (bounds.yMax - bounds.yMin) * height; };
      var defs = svgNode(doc, "defs", {});
      var clip = svgNode(doc, "clipPath", { id: uid + "-plot-clip" });
      clip.appendChild(svgNode(doc, "rect", { x: margin.left, y: margin.top, width: width, height: height }));
      defs.appendChild(clip);
      svg.appendChild(defs);
      var chart = svgNode(doc, "g", {});
      chart.appendChild(svgNode(doc, "text", { x: margin.left, y: 27, "font-size": "22" }, selected.formula));
      chart.appendChild(svgNode(doc, "rect", {
        x: mapX(selected.x0 - data.delta), y: margin.top,
        width: mapX(selected.x0 + data.delta) - mapX(selected.x0 - data.delta), height: height,
        fill: "var(--lq-blue)", "fill-opacity": "0.09"
      }));
      if (selected.kind === "two-sided") {
        chart.appendChild(svgNode(doc, "rect", {
          x: margin.left, y: mapY(selected.limit + data.epsilon), width: width,
          height: mapY(selected.limit - data.epsilon) - mapY(selected.limit + data.epsilon),
          fill: "var(--lq-gold)", "fill-opacity": "0.18"
        }));
        [
          { value: selected.limit + data.epsilon, label: "L + ε", direction: -1 },
          { value: selected.limit, label: "L", direction: 0 },
          { value: selected.limit - data.epsilon, label: "L − ε", direction: 1 }
        ].forEach(function (tick) {
          var actualY = mapY(tick.value);
          // Keep labels readable even when epsilon is much smaller than the viewport.
          var labelY = mapY(selected.limit) + tick.direction * Math.max(42, Math.abs(actualY - mapY(selected.limit)));
          chart.appendChild(svgNode(doc, "line", {
            x1: margin.left, y1: actualY, x2: margin.left + width, y2: actualY,
            stroke: "var(--lq-gold)", "stroke-dasharray": "4 4", "stroke-width": "1"
          }));
          chart.appendChild(svgNode(doc, "line", {
            x1: margin.left - 22, y1: labelY, x2: margin.left - 2, y2: actualY,
            stroke: "var(--lq-gold)", "stroke-width": "1.4"
          }));
          chart.appendChild(svgNode(doc, "text", {
            x: margin.left - 28, y: labelY + 7, "text-anchor": "end", "font-size": "22"
          }, tick.label));
          chart.appendChild(svgNode(doc, "text", { x: margin.left - 28, y: labelY + 25, "text-anchor": "end", "font-size": "12" }, formatNumber(tick.value, 4)));
        });
      } else {
        [bounds.yMin, 0, bounds.yMax].forEach(function (value) {
          chart.appendChild(svgNode(doc, "text", {
            x: margin.left - 14, y: mapY(value) + (value === bounds.yMax ? 20 : 0), "text-anchor": "end", "font-size": "22"
          }, formatNumber(value)));
        });
      }
      chart.appendChild(svgNode(doc, "line", {
        x1: margin.left, y1: margin.top + height, x2: margin.left + width, y2: margin.top + height,
        stroke: "currentColor", "stroke-opacity": "0.5"
      }));
      [-1, 0, 1].forEach(function (direction) {
        var x = mapX(selected.x0 + direction * data.delta);
        chart.appendChild(svgNode(doc, "line", {
          x1: x, y1: margin.top, x2: x, y2: margin.top + height,
          stroke: "var(--lq-blue)", "stroke-dasharray": "4 4", "stroke-width": "1"
        }));
        chart.appendChild(svgNode(doc, "text", {
          x: x, y: margin.top + height + (direction === 0 ? 66 : 30),
          "text-anchor": direction < 0 ? "end" : direction > 0 ? "start" : "middle", "font-size": "22"
        }, direction < 0 ? "x₀ − δ" : direction > 0 ? "x₀ + δ" : "x₀（排除）"));
      });
      chart.appendChild(svgNode(doc, "text", { x: 260, y: 380, "text-anchor": "middle", "font-size": "12" }, "x₀ = " + formatNumber(selected.x0) + "；δ = " + formatNumber(data.delta, 4) + "；ε = " + formatNumber(data.epsilon, 4)));
      var marks = svgNode(doc, "g", { "clip-path": "url(#" + uid + "-plot-clip)" });
      var curve = [];
      var unresolved = 0;
      if (selected.kind === "oscillatory") {
        unresolved = Math.min((bounds.xMax - bounds.xMin) / 6, Math.max(data.delta / 10, .02));
        // Uniform phase sampling outside the unresolved center avoids inventing slow beats.
        [-1, 1].forEach(function (side) {
          curve.push({ x: 0, y: NaN });
          var umax = 1 / unresolved, umin = 1 / Math.max(Math.abs(bounds.xMin), Math.abs(bounds.xMax));
          var segments = Math.ceil((umax - umin) * 24 / Math.PI);
          for (var j = 0; j <= segments; j += 1) {
            var u = umin + (umax - umin) * j / segments;
            curve.push({ x: side / u, y: Math.sin(side * u) });
          }
        });
        marks.appendChild(svgNode(doc, "rect", { x: mapX(-unresolved), y: mapY(1), width: mapX(unresolved)-mapX(-unresolved), height: mapY(-1)-mapY(1), fill: "var(--lq-gold)", "fill-opacity": ".22" }));
      } else for (var i = 0; i <= 280; i += 1) {
        var x = bounds.xMin + (bounds.xMax - bounds.xMin) * i / 280;
        // Break explicitly at the midpoint; floating arithmetic can miss x === x₀.
        curve.push({ x: x, y: i === 140 ? NaN : selected.f(x) });
      }
      marks.appendChild(svgNode(doc, "path", {
        d: pathFrom(curve, mapX, mapY), fill: "none", stroke: "var(--lq-blue)",
        "stroke-width": "2.4", "stroke-linecap": "round"
      }));
      data.probes.forEach(function (row) {
        if (!finite(row.value)) return;
        var color = row.passes === null ? "var(--lq-blue)" : row.passes ? "var(--lq-green)" : "var(--lq-red)";
        var x = mapX(row.x);
        if (row.value < bounds.yMin || row.value > bounds.yMax) {
          var top = row.value > bounds.yMax;
          var y = top ? margin.top + 2 : margin.top + height - 2;
          var base = top ? y + 7 : y - 7;
          var marker = svgNode(doc, "path", { d: "M" + x + " " + y + " L" + (x - 4) + " " + base + " L" + (x + 4) + " " + base + " Z", fill: color });
          marker.appendChild(svgNode(doc, "title", {}, "超出纵轴：f(x)=" + formatNumber(row.value, 5)));
          marks.appendChild(marker);
        } else {
          marks.appendChild(svgNode(doc, "circle", {
            cx: x, cy: mapY(row.value), r: "4", fill: color,
            stroke: "var(--bg)", "stroke-width": "1.5"
          }));
        }
      });
      if (selected.limit !== null) {
        marks.appendChild(svgNode(doc, "circle", {
          cx: mapX(selected.x0), cy: mapY(selected.limit), r: "4",
          fill: "var(--bg)", stroke: "var(--lq-blue)", "stroke-width": "1.5"
        }));
      }
      chart.appendChild(marks);
      svg.appendChild(chart);
      return svg;
    }

    function metric(doc, label, value, color) {
      return element(doc, "div", { className: "lq-metric " + (color || "") }, [
        element(doc, "span", {}, label),
        element(doc, "strong", {}, value)
      ]);
    }

    function injectStyle(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function choiceQuestion(doc, refs, key, legendText, choices) {
      var fieldset = element(doc, "fieldset", { className: "lq-question" });
      fieldset.appendChild(element(doc, "legend", {}, legendText));
      var row = element(doc, "div", { className: "lq-choice-row" });
      refs[key] = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": "false",
          text: choice.label,
          onclick: function () {
            refs.state.predictions[key] = choice.value;
            refs.state.revealed = false;
            refs.controls.hidden = true; refs.results.hidden = true;
            renderPrediction(refs);
          }
        });
        refs[key].push({ value: choice.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    function renderPrediction(refs) {
      ["delta", "puncture", "sided"].forEach(function (key) {
        (refs[key] || []).forEach(function (item) {
          item.node.setAttribute(
            "aria-pressed",
            refs.state.predictions[key] === item.value ? "true" : "false"
          );
        });
      });
      var answered = ["delta", "puncture", "sided"].every(function (key) {
        return refs.state.predictions[key] !== null;
      });
      refs.feedback.textContent = answered ? "三个预测已记录，可以揭示结果。" : "请先完成三个预测。";
      refs.feedback.className = "lq-feedback";
    }

    function renderResults(refs) {
      var state = refs.state;
      var data = analyze({
        modelId: state.modelId,
        ruleId: state.ruleId,
        epsilon: state.epsilon,
        probeCount: state.probeCount
      });
      refs.modelSelect.value = state.modelId;
      refs.ruleSelect.value = state.ruleId;
      refs.epsilonInput.value = String(state.epsilon);
      refs.epsilonOutput.textContent = formatNumber(state.epsilon, 2);
      refs.probeInput.value = String(state.probeCount);
      refs.summary.textContent = "对所有 ε 的规则：" + data.certificate.label + "。" + data.certificate.text + (data.current.witness ? " 当前反例 x=" + formatNumber(data.current.witness.x, 6) + "，误差=" + formatNumber(data.current.witness.error, 6) + " > ε。" : "");
      refs.summary.className = "lq-interpretation " + (data.isTheorem ? "lq-ok" : "lq-warn");
      replaceChildren(refs.metrics, [
        metric(refs.doc, "当前模型", data.model.label, "lq-blue"),
        metric(refs.doc, "候选 δ", formatNumber(data.delta, 4), "lq-gold"),
        metric(refs.doc, "当前 ε 的解析检验", data.current.valid === null ? "无共同 L" : data.current.valid ? "所有邻域点满足" : "存在反例", data.current.valid ? "lq-green" : "lq-red"),
        metric(refs.doc, "有限通过", data.model.limit === null ? "不适用（无共同 L）" : data.passed + "/" + data.probes.length, data.model.limit === null ? "lq-blue" : data.failed ? "lq-red" : "lq-green"),
        metric(refs.doc, "左侧范围", data.side.leftRange.min === null ? "—" : formatNumber(data.side.leftRange.min, 3) + " … " + formatNumber(data.side.leftRange.max, 3), "lq-blue"),
        metric(refs.doc, "右侧范围", data.side.rightRange.min === null ? "—" : formatNumber(data.side.rightRange.min, 3) + " … " + formatNumber(data.side.rightRange.max, 3), "lq-blue")
      ]);
      replaceChildren(refs.chart, [
        element(refs.doc, "h4", {}, "函数、误差带与有限探针"),
        element(refs.doc, "div", { className: "lq-chart-frame", tabindex: "0", "aria-label": "极限图，可用方向键横向滚动" }, plotSvg(refs.doc, data, refs.uid)),
        element(refs.doc, "p", { className: "lq-note" }, "蓝色竖带：0 < |x−x₀| < δ；金色横带：|f(x)−L| < ε。边界线不包含在内；空心点表示本次极限检验跳过 x₀。边缘三角表示超出纵轴，数值读数见表。" + (data.model.limit === null ? " 本模型没有共同目标 L，因此不画目标误差带，也不评通过率。" : "") + (data.model.kind === "oscillatory" ? " 中央金色区域未解析：函数仍在 −1 与 1 间振荡，留白或色带都不是函数趋向零；两侧曲线只画分辨到的相位。" : ""))
      ]);
      var rows = data.probes.map(function (row, index) {
        return element(refs.doc, "tr", {}, [
          element(refs.doc, "th", { scope: "row" }, String(index + 1)),
          element(refs.doc, "td", {}, formatNumber(row.x, 5)),
          element(refs.doc, "td", {}, formatNumber(row.value, 5)),
          element(refs.doc, "td", {}, row.error === null ? "—" : formatNumber(row.error, 5)),
          element(refs.doc, "td", { className: row.passes === null ? "" : row.passes ? "lq-ok" : "lq-fail" }, row.passes === null ? (row.boundary ? "数值接近严格边界" : "不适用（无共同 L）") : row.passes ? "通过" : "未通过")
        ]);
      });
      rows.push(element(refs.doc, "tr", {}, [
        element(refs.doc, "th", { scope: "row" }, "L"),
        element(refs.doc, "td", {}, "x → " + formatNumber(data.model.x0, 3)),
        element(refs.doc, "td", {}, data.model.limit === null ? "无共同 L" : formatNumber(data.model.limit, 5)),
        element(refs.doc, "td", {}, data.model.kind === "two-sided" ? "目标值" : data.model.theorem),
        element(refs.doc, "td", {}, data.model.kind === "two-sided" ? "模型假设" : "反例边界")
      ]));
      replaceChildren(refs.ledgerBody, rows);
      refs.boundary.textContent =
        "证书与证据分开读：定理级状态来自模型的解析假设；上图和表格只用了 " +
        data.probes.length +
        " 个穿孔探针；误差与 ε 在浮点舍入量级内接近时标为边界未决，不冒充严格通过或失败。解析检验使用误差上确界的推导。若切换到 " +
        data.model.label +
        "，" +
        data.model.boundary;
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      injectStyle(doc);
      var uid = "lq-" + (INSTANCE += 1);
      var state = {
        modelId: DEFAULTS.modelId,
        ruleId: DEFAULTS.ruleId,
        epsilon: DEFAULTS.epsilon,
        probeCount: DEFAULTS.probeCount,
        revealed: false,
        predictions: { delta: null, puncture: null, sided: null }
      };
      var refs = { doc: doc, uid: uid, state: state };
      var shell = element(doc, "div", { className: "lq-shell" });
      shell.appendChild(element(doc, "h3", {}, "ε-δ 量词实验"));
      shell.appendChild(element(doc, "p", { className: "lq-note" }, "先判断量词与反例，再揭示有限探针、候选 δ 和定理证书。"));

      var prediction = element(doc, "section", {
        className: "lq-predict",
        "aria-labelledby": uid + "-predict-title"
      });
      refs.predictSection = prediction;
      prediction.appendChild(element(doc, "strong", { className: "lq-predict-title", id: uid + "-predict-title" }, "先预测，再揭示"));
      var questionList = element(doc, "div", { className: "lq-question-list" });
      questionList.appendChild(choiceQuestion(doc, refs, "delta", "1. 线性模型对任意 ε 都安全的候选规则？", [
        { value: "eps-over-3", label: "δ = ε/3" },
        { value: "eps", label: "δ = ε" },
        { value: "sqrt-eps", label: "δ = √ε" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "puncture", "2. 穿孔条件 0 < |x−x₀| < δ 的作用？", [
        { value: "exclude-point", label: "跳过 x₀" },
        { value: "include-point", label: "必须包含 x₀" },
        { value: "point-only", label: "只检查 x₀" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "sided", "3. sgn(x) 在 0 的两侧极限？", [
        { value: "none", label: "无共同极限" },
        { value: "zero", label: "都是 0" },
        { value: "one", label: "都是 1" }
      ]));
      prediction.appendChild(questionList);
      var actions = element(doc, "div", { className: "lq-actions" });
      var reveal = element(doc, "button", { type: "button", className: "lq-primary", text: "揭示并核对" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      refs.feedback = element(doc, "p", { className: "lq-feedback", "aria-live": "polite" }, "请先完成三个预测。");
      prediction.appendChild(refs.feedback);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "lq-controls", hidden: true, "aria-label": "实验参数" });
      refs.controls = controls;
      refs.modelSelect = element(doc, "select", { "aria-label": "选择函数模型" });
      MODELS.forEach(function (item) {
        refs.modelSelect.appendChild(element(doc, "option", { value: item.id }, item.label));
      });
      refs.ruleSelect = element(doc, "select", { "aria-label": "选择候选 delta 规则" });
      RULES.forEach(function (item) {
        refs.ruleSelect.appendChild(element(doc, "option", { value: item.id }, item.label));
      });
      refs.epsilonInput = element(doc, "input", { type: "range", min: "0.05", max: "10", step: "0.05", value: String(DEFAULTS.epsilon), "aria-label": "epsilon" });
      refs.epsilonOutput = element(doc, "output", {}, formatNumber(DEFAULTS.epsilon, 2));
      refs.probeInput = element(doc, "input", { type: "number", min: "3", max: "10", step: "1", value: String(DEFAULTS.probeCount), "aria-label": "有限探针对数" });
      var modelControl = element(doc, "div", { className: "lq-control" }, [element(doc, "label", {}, "模型"), refs.modelSelect]);
      var ruleControl = element(doc, "div", { className: "lq-control" }, [element(doc, "label", {}, "候选 δ 规则"), refs.ruleSelect]);
      var epsilonLabel = element(doc, "label", {}, ["ε = ", refs.epsilonOutput]);
      var epsilonControl = element(doc, "div", { className: "lq-control" }, [epsilonLabel, refs.epsilonInput]);
      var probeControl = element(doc, "div", { className: "lq-control" }, [element(doc, "label", {}, "每侧探针数"), refs.probeInput]);
      controls.appendChild(modelControl);
      controls.appendChild(ruleControl);
      controls.appendChild(epsilonControl);
      controls.appendChild(probeControl);
      shell.appendChild(controls);

      var results = element(doc, "section", { className: "lq-results", hidden: true, "aria-labelledby": uid + "-results-title" });
      refs.results = results;
      results.appendChild(element(doc, "h4", { id: uid + "-results-title" }, "揭示后的证据账本"));
      refs.summary = element(doc, "p", { className: "lq-interpretation", "aria-live": "polite" });
      results.appendChild(refs.summary);
      refs.metrics = element(doc, "div", { className: "lq-metrics" });
      results.appendChild(refs.metrics);
      var charts = element(doc, "div", { className: "lq-charts" });
      refs.chart = element(doc, "div", { className: "lq-chart" });
      charts.appendChild(refs.chart);
      results.appendChild(charts);
      var ledger = element(doc, "div", { className: "lq-ledger", tabindex: "0", "aria-label": "探针表，可用方向键横向滚动" });
      var table = element(doc, "table", { "aria-label": "epsilon-delta 穿孔邻域探针账本" });
      table.appendChild(element(doc, "caption", {}, "有限探针的 x、f(x)、误差与通过状态"));
      var head = element(doc, "thead");
      head.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { scope: "col" }, "#"),
        element(doc, "th", { scope: "col" }, "x"),
        element(doc, "th", { scope: "col" }, "f(x)"),
        element(doc, "th", { scope: "col" }, "|f(x)−L|"),
        element(doc, "th", { scope: "col" }, "状态")
      ]));
      table.appendChild(head);
      refs.ledgerBody = element(doc, "tbody");
      table.appendChild(refs.ledgerBody);
      ledger.appendChild(table);
      var ledgerDetails = element(doc, "details", { className: "lq-ledger-details" });
      ledgerDetails.appendChild(element(doc, "summary", {}, "展开完整探针表：逐点核对 x、f(x) 与误差"));
      ledgerDetails.appendChild(ledger);
      results.appendChild(ledgerDetails);
      refs.boundary = element(doc, "p", { className: "lq-boundary" });
      results.appendChild(refs.boundary);
      shell.appendChild(results);
      root.classList.add("lq-lab");
      root.replaceChildren(shell);

      function render() {
        controls.hidden = !state.revealed;
        results.hidden = !state.revealed;
        renderPrediction(refs);
        if (state.revealed) renderResults(refs);
      }

      reveal.addEventListener("click", function () {
        var answers = { delta: "eps-over-3", puncture: "exclude-point", sided: "none" };
        var missing = ["delta", "puncture", "sided"].filter(function (key) {
          return state.predictions[key] === null;
        });
        if (missing.length) {
          refs.feedback.textContent = "还缺少 " + missing.length + " 个预测。";
          refs.feedback.className = "lq-feedback lq-warn";
          return;
        }
        state.revealed = true;
        render();
        var hits = ["delta", "puncture", "sided"].filter(function (key) {
          return state.predictions[key] === answers[key];
        }).length;
        refs.feedback.textContent = "已揭示：" + hits + "/3 个预测命中；有限探针不是对所有 x 的证明。";
        refs.feedback.className = "lq-feedback " + (hits === 3 ? "lq-pass" : "lq-warn");
        if (api && typeof api.announce === "function") api.announce(root, refs.feedback.textContent);
      });
      reset.addEventListener("click", function () {
        state = {
          modelId: DEFAULTS.modelId,
          ruleId: DEFAULTS.ruleId,
          epsilon: DEFAULTS.epsilon,
          probeCount: DEFAULTS.probeCount,
          revealed: false,
          predictions: { delta: null, puncture: null, sided: null }
        };
        refs.state = state;
        render();
        refs.delta[0].node.focus();
      });
      refs.modelSelect.addEventListener("change", function () {
        state.modelId = refs.modelSelect.value;
        if (state.revealed) renderResults(refs);
      });
      refs.ruleSelect.addEventListener("change", function () {
        state.ruleId = refs.ruleSelect.value;
        if (state.revealed) renderResults(refs);
      });
      refs.epsilonInput.addEventListener("input", function () {
        state.epsilon = Number(refs.epsilonInput.value);
        if (state.revealed) renderResults(refs);
      });
      refs.probeInput.addEventListener("change", function () {
        state.probeCount = clamp(Math.round(Number(refs.probeInput.value) || DEFAULTS.probeCount), 3, 10);
        if (state.revealed) renderResults(refs);
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function assert(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }
      function close(actual, expected, tolerance, message) {
        checks += 1;
        if (!finite(actual) || Math.abs(actual - expected) > tolerance) {
          throw new Error(message + ": " + actual + " vs " + expected);
        }
      }

      assert(MODELS.length === 5, "model count");
      assert(RULES.length === 5, "rule count");
      close(candidateDelta("eps-over-3", 0.3), 0.1, 1e-12, "epsilon over three");
      close(candidateDelta("local-square", 2), 0.5, 1e-12, "local square clamp");
      close(evaluate("linear", 2), 7, 1e-12, "linear value");
      close(evaluate("square", 1), 1, 1e-12, "square value");

      var linear = analyze({ modelId: "linear", ruleId: "eps-over-3", epsilon: 0.3, probeCount: 7 });
      assert(linear.isTheorem, "linear theorem certificate");
      assert(linear.failed === 0, "linear certified probes pass");
      assert(linear.side.targetErrors.left < 0.3 && linear.side.targetErrors.right < 0.3, "linear side errors");

      var square = analyze({ modelId: "square", ruleId: "local-square", epsilon: 0.3, probeCount: 7 });
      assert(square.isTheorem, "square theorem certificate");
      assert(square.failed === 0, "square local probes pass");
      var badLinear = analyze({ modelId: "linear", ruleId: "eps", epsilon: 0.3, probeCount: 7 });
      assert(!badLinear.isTheorem, "bad linear rule not certified");
      assert(badLinear.failed > 0, "bad linear rule has finite failure");

      var jump = analyze({ modelId: "jump", ruleId: "eps-over-3", epsilon: 0.3, probeCount: 7 });
      assert(!jump.isTheorem, "jump not theorem");
      close(jump.side.leftRange.min, -1, 1e-12, "jump left value");
      close(jump.side.rightRange.max, 1, 1e-12, "jump right value");
      assert(jump.side.spread === 2, "jump side spread");

      var reciprocal = analyze({ modelId: "reciprocal", ruleId: "eps-over-3", epsilon: 0.3, probeCount: 7 });
      assert(reciprocal.model.kind === "divergent", "reciprocal kind");
      assert(reciprocal.side.leftRange.max < 0 && reciprocal.side.rightRange.min > 0, "reciprocal signs");
      assert(reciprocal.failed === 0 && reciprocal.probes.every(function (row) { return row.passes === null; }), "no target must not manufacture failed epsilon tests");
      assert(plotBounds(reciprocal).yMin === -4 && plotBounds(reciprocal).yMax === 4, "divergent model uses the intended vertical range");
      assert(pathFrom([{ x: -1, y: 2 }, { x: 0, y: NaN }, { x: 1, y: -2 }], function (x) { return x; }, function (y) { return y; }) === "M-1 2 M1 -2", "puncture breaks the plotted curve without joining the two sides");

      // Exercise the actual SVG builder without requiring a browser package.
      var svgNodes = [];
      var svgDoc = { createElementNS: function (namespace, tag) {
        var node = { tag: tag, attrs: {}, children: [], setAttribute: function (key, value) { this.attrs[key] = value; }, appendChild: function (child) { this.children.push(child); } };
        svgNodes.push(node);
        return node;
      } };
      plotSvg(svgDoc, reciprocal, "regression-reciprocal");
      assert(svgNodes.some(function (node) { return node.tag === "clipPath" && node.attrs.id === "regression-reciprocal-plot-clip"; }), "viewport clip is defined");
      assert(svgNodes.some(function (node) { return node.attrs["clip-path"] === "url(#regression-reciprocal-plot-clip)"; }), "curve and probes use the viewport clip");
      assert(svgNodes.filter(function (node) { return node.tag === "title" && /^超出纵轴/.test(node.textContent || ""); }).length === reciprocal.probes.length, "offscreen reciprocal probes become visible edge markers");
      svgNodes = [];
      plotSvg(svgDoc, linear, "regression-linear");
      ["x₀ − δ", "x₀ + δ", "L + ε", "L − ε"].forEach(function (label) {
        assert(svgNodes.some(function (node) { return node.tag === "text" && node.textContent === label; }), "diagram labels " + label);
      });
      assert(svgNodes.filter(function (node) { return node.tag === "text"; }).every(function (node) { return Number(node.attrs["font-size"]) * 650 / 520 >= 12; }), "diagram labels stay at least 12 px in the 650 px keyboard-scrollable diagram");
      svgNodes = [];
      plotSvg(svgDoc, analyze({ epsilon: 0.0001 }), "regression-tiny-epsilon");
      var bandLabels = svgNodes.filter(function (node) { return node.tag === "text" && ["L + ε", "L", "L − ε"].indexOf(node.textContent) !== -1; });
      assert(Number(bandLabels[1].attrs.y) - Number(bandLabels[0].attrs.y) >= 41.9 && Number(bandLabels[2].attrs.y) - Number(bandLabels[1].attrs.y) >= 41.9, "tiny epsilon uses separated labels with leaders to true boundaries");

      var oscillatory = analyze({ modelId: "oscillatory", ruleId: "eps-over-3", epsilon: 0.3, probeCount: 7 });
      assert(oscillatory.side.spread > 1, "oscillatory finite spread");
      assert(oscillatory.certificate.level === "counterexample", "oscillatory certificate");

      var rejected = false;
      try { candidateDelta("missing", 0.3); } catch (error) { rejected = true; }
      assert(rejected, "unknown delta rule rejected");
      rejected = false;
      try { analyze({ epsilon: 0 }); } catch (error) { rejected = true; }
      assert(rejected, "nonpositive epsilon rejected");
      return { checks: checks, models: MODELS.length };
    }

    return {
      DEFAULTS: DEFAULTS,
      MODELS: MODELS,
      RULES: RULES,
      candidateDelta: candidateDelta,
      evaluate: evaluate,
      probe: probe,
      sideEvidence: sideEvidence,
      analyze: analyze,
      mount: mount,
      selfTest: selfTest
    };
  }
);
