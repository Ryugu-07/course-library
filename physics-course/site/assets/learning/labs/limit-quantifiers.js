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
        theorem: "在 |x−1| ≤ 1/2 内有 |x+1| < 5/2；δ = min(1/2, ε/3) 足够。",
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
      ".lq-lab{--lq-blue:var(--cl-blue,#315f9d);--lq-gold:var(--cl-gold,#9b6a12);--lq-green:var(--cl-green,#39734d);--lq-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
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
      ".lq-lab .lq-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.lq-lab .lq-charts{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;margin-top:12px;}.lq-lab .lq-chart{min-width:0;}.lq-lab .lq-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.lq-lab svg{display:block;width:100%;height:auto;color:var(--fg);}.lq-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.lq-lab .lq-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.lq-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.lq-lab th,.lq-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.lq-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.lq-lab .lq-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--lq-green);background:var(--bg);font-size:13px;line-height:1.7;}",
      "@media(max-width:760px){.lq-lab .lq-controls,.lq-lab .lq-charts{grid-template-columns:minmax(0,1fr);}.lq-lab .lq-choice-row{grid-template-columns:minmax(0,1fr);}}",
      "@media(max-width:420px){.lq-lab .lq-predict{padding-left:11px;padding-right:11px;}.lq-lab th,.lq-lab td{padding-left:5px;padding-right:5px;}}",
      "@media(prefers-reduced-motion:reduce){.lq-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
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
      var epsilon = Number(value);
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
      return selected.f(Number(x));
    }

    function certificate(modelId, ruleId) {
      var selected = modelById(modelId);
      if (selected.id === "linear" && ["eps-over-3", "min-one", "local-square"].indexOf(ruleId) !== -1) {
        return {
          level: "theorem",
          label: "定理证书",
          text: "线性误差恒为 3|x−2|；该规则给出 δ ≤ ε/3。"
        };
      }
      if (selected.id === "square" && ruleId === "local-square") {
        return {
          level: "theorem",
          label: "定理证书",
          text: "先锁定 |x−1| ≤ 1/2，再用 |x+1| < 5/2 控制乘积。"
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
        level: "finite",
        label: "仅有限探针",
        text: "当前规则没有在本模型上登记为定理证书；探针通过不等于量词证明。"
      };
    }

    function probeFractions(count) {
      var rows = [];
      var total = Math.max(3, Math.floor(Number(count) || 6));
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
        var value = selected.f(x);
        var error = selected.limit === null || !finite(value) ? null : Math.abs(value - selected.limit);
        return {
          fraction: fraction,
          x: x,
          value: value,
          error: error,
          passes: error !== null && error < epsilon
        };
      });
      return {
        delta: delta,
        epsilon: positiveEpsilon(epsilon),
        rows: rows,
        passed: rows.filter(function (row) { return row.passes; }).length,
        failed: rows.filter(function (row) { return !row.passes; }).length
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
      var total = Math.max(4, Math.floor(Number(count) || 6));
      var left = [];
      var right = [];
      for (var i = 1; i <= total; i += 1) {
        var distance = delta * (i / (total + 1));
        left.push(selected.f(selected.x0 - distance));
        right.push(selected.f(selected.x0 + distance));
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
      var selected = modelById(modelId);
      var sampled = probe(modelId, ruleId, epsilon, settings.probeCount || DEFAULTS.probeCount);
      var sides = sideEvidence(modelId, sampled.delta, settings.probeCount || DEFAULTS.probeCount);
      return {
        model: selected,
        rule: ruleById(ruleId),
        epsilon: epsilon,
        delta: sampled.delta,
        probes: sampled.rows,
        passed: sampled.passed,
        failed: sampled.failed,
        side: sides,
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
      return text.replace(/0+$/, "").replace(/\.$/, "");
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

    function pathFrom(points, mapX, mapY, yMin, yMax) {
      var commands = [];
      var open = false;
      points.forEach(function (point) {
        if (!finite(point.y)) {
          open = false;
          return;
        }
        var y = clamp(point.y, yMin, yMax);
        commands.push((open ? "L" : "M") + mapX(point.x) + " " + mapY(y));
        open = true;
      });
      return commands.join(" ");
    }

    function plotSvg(doc, data, uid) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 520 300",
        role: "img",
        "aria-labelledby": uid + "-title " + uid + "-desc"
      });
      svg.appendChild(svgNode(doc, "title", { id: uid + "-title" }, "函数曲线与穿孔邻域探针"));
      svg.appendChild(svgNode(
        doc,
        "desc",
        { id: uid + "-desc" },
        "蓝线是函数，金色带是目标误差带，圆点是有限探针；图形不能替代对所有邻域点的证明。"
      ));
      var margin = { left: 45, right: 14, top: 18, bottom: 31 };
      var width = 520 - margin.left - margin.right;
      var height = 300 - margin.top - margin.bottom;
      var selected = data.model;
      var span = Math.max(data.delta * 1.35, selected.kind === "two-sided" ? 0.5 : 0.4);
      var xMin = selected.x0 - span;
      var xMax = selected.x0 + span;
      var yMin;
      var yMax;
      if (selected.kind === "two-sided") {
        var ySpan = Math.max(Math.abs(selected.limit) * 0.45, data.epsilon * 2.5, 0.7);
        yMin = selected.limit - ySpan;
        yMax = selected.limit + ySpan;
      } else {
        yMin = selected.kind === "reciprocal" ? -4 : -1.5;
        yMax = selected.kind === "reciprocal" ? 4 : 1.5;
      }
      var mapX = function (x) { return margin.left + (x - xMin) / (xMax - xMin) * width; };
      var mapY = function (y) { return margin.top + (yMax - y) / (yMax - yMin) * height; };
      var chart = svgNode(doc, "g", {});
      chart.appendChild(svgNode(doc, "line", {
        x1: margin.left, y1: mapY(0), x2: margin.left + width, y2: mapY(0),
        stroke: "currentColor", "stroke-opacity": "0.35", "stroke-width": "1"
      }));
      chart.appendChild(svgNode(doc, "line", {
        x1: mapX(selected.x0), y1: margin.top, x2: mapX(selected.x0), y2: margin.top + height,
        stroke: "var(--lq-gold)", "stroke-dasharray": "5 4", "stroke-width": "1.4"
      }));
      if (selected.kind === "two-sided") {
        var bandTop = mapY(selected.limit + data.epsilon);
        var bandBottom = mapY(selected.limit - data.epsilon);
        chart.appendChild(svgNode(doc, "rect", {
          x: margin.left, y: bandTop, width: width, height: Math.max(0, bandBottom - bandTop),
          fill: "var(--lq-gold)", "fill-opacity": "0.16"
        }));
      }
      var curve = [];
      for (var i = 0; i <= 140; i += 1) {
        var x = xMin + (xMax - xMin) * i / 140;
        curve.push({ x: x, y: x === selected.x0 ? NaN : selected.f(x) });
      }
      chart.appendChild(svgNode(doc, "path", {
        d: pathFrom(curve, mapX, mapY, yMin, yMax),
        fill: "none",
        stroke: "var(--lq-blue)",
        "stroke-width": "2.4",
        "stroke-linecap": "round"
      }));
      data.probes.forEach(function (row) {
        if (!finite(row.value)) return;
        chart.appendChild(svgNode(doc, "circle", {
          cx: mapX(row.x),
          cy: mapY(row.value),
          r: "4",
          fill: row.passes ? "var(--lq-green)" : "var(--lq-red)",
          stroke: "var(--bg)",
          "stroke-width": "1.5"
        }));
      });
      chart.appendChild(svgNode(doc, "text", {
        x: margin.left + width - 3, y: margin.top + height + 23,
        "text-anchor": "end", "font-size": "11"
      }, "x"));
      chart.appendChild(svgNode(doc, "text", {
        x: margin.left + 5, y: margin.top + 12, "font-size": "11"
      }, selected.formula));
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
      refs.summary.textContent = data.certificate.label + "： " + data.certificate.text;
      refs.summary.className = "lq-interpretation " + (data.isTheorem ? "lq-ok" : "lq-warn");
      replaceChildren(refs.metrics, [
        metric(refs.doc, "当前模型", data.model.label, "lq-blue"),
        metric(refs.doc, "候选 δ", formatNumber(data.delta, 4), "lq-gold"),
        metric(refs.doc, "有限通过", data.passed + "/" + data.probes.length, data.failed ? "lq-red" : "lq-green"),
        metric(refs.doc, "左侧范围", data.side.leftRange.min === null ? "—" : formatNumber(data.side.leftRange.min, 3) + " … " + formatNumber(data.side.leftRange.max, 3), "lq-blue"),
        metric(refs.doc, "右侧范围", data.side.rightRange.min === null ? "—" : formatNumber(data.side.rightRange.min, 3) + " … " + formatNumber(data.side.rightRange.max, 3), "lq-blue")
      ]);
      replaceChildren(refs.chart, [
        element(refs.doc, "h4", {}, "函数、误差带与有限探针"),
        element(refs.doc, "div", { className: "lq-chart-frame" }, plotSvg(refs.doc, data, refs.uid))
      ]);
      var rows = data.probes.map(function (row, index) {
        return element(refs.doc, "tr", {}, [
          element(refs.doc, "th", { scope: "row" }, String(index + 1)),
          element(refs.doc, "td", {}, formatNumber(row.x, 5)),
          element(refs.doc, "td", {}, formatNumber(row.value, 5)),
          element(refs.doc, "td", {}, row.error === null ? "—" : formatNumber(row.error, 5)),
          element(refs.doc, "td", { className: row.passes ? "lq-ok" : "lq-fail" }, row.passes ? "通过" : "未通过")
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
        " 个穿孔探针。若切换到 " +
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
      refs.epsilonInput = element(doc, "input", { type: "range", min: "0.05", max: "1.2", step: "0.05", value: String(DEFAULTS.epsilon), "aria-label": "epsilon" });
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
      var ledger = element(doc, "div", { className: "lq-ledger" });
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
      results.appendChild(ledger);
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
