(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("subgaussian-concentration", exported.mount);
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
        "subgaussian-concentration self-test: PASS (" +
          report.checks +
          " checks, " +
          report.models +
          " models)"
      );
    } catch (error) {
      console.error("subgaussian-concentration self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-subgaussian-concentration-style";
    var INSTANCE = 0;
    var SINGLE_THRESHOLD = 1.5;
    var DEFAULTS = {
      modelId: "rademacher",
      n: 32,
      threshold: 12,
      events: 5
    };

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function sinh(value) {
      return (Math.exp(value) - Math.exp(-value)) / 2;
    }

    function erf(value) {
      var sign = value < 0 ? -1 : 1;
      var x = Math.abs(value);
      var t = 1 / (1 + 0.3275911 * x);
      var polynomial =
        (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
          0.284496736) *
          t +
          0.254829592) *
          t);
      return sign * (1 - polynomial * Math.exp(-x * x));
    }

    function gaussianTail(t, standardDeviation) {
      var threshold = Math.max(0, Number(t));
      var sigma = Number(standardDeviation);
      if (!finite(sigma) || sigma <= 0) throw new Error("standard deviation must be positive");
      return Math.max(0, Math.min(1, 1 - erf(threshold / (sigma * Math.sqrt(2)))));
    }

    function binomialRademacherTail(n, threshold) {
      var count = Math.floor(Number(n));
      var target = Math.max(0, Number(threshold));
      var probability = Math.pow(0.5, count);
      var total = 0;
      for (var k = 0; k <= count; k += 1) {
        if (Math.abs(2 * k - count) + 1e-12 >= target) total += probability;
        if (k < count) probability *= (count - k) / (k + 1);
      }
      return Math.max(0, Math.min(1, total));
    }

    var MODELS = [
      {
        id: "gaussian",
        label: "Gaussian N(0,1)",
        k: 1,
        variance: 1,
        range: null,
        kind: "exact-mgf",
        mgf: function (lambda) { return Math.exp(lambda * lambda / 2); },
        tail: function (threshold) { return gaussianTail(threshold, 1); },
        sumTail: function (n, threshold) { return gaussianTail(threshold, Math.sqrt(n)); },
        theorem: "MGF 等式精确成立；和的真实尾也可由 Gaussian 闭式计算。",
        evidence: "解析分布值，不是一次随机抽样。"
      },
      {
        id: "rademacher",
        label: "Rademacher ±1",
        k: 1,
        variance: 1,
        range: 2,
        kind: "bounded-mgf",
        mgf: function (lambda) { return Math.cosh(lambda); },
        tail: function (threshold) {
          return Math.abs(Number(threshold)) <= 1 ? 1 : 0;
        },
        sumTail: function (n, threshold) { return binomialRademacherTail(n, threshold); },
        theorem: "cosh(λ) ≤ exp(λ²/2)；独立和还可用二项式精确枚举。",
        evidence: "离散模型的有限和账本是解析枚举。"
      },
      {
        id: "uniform",
        label: "有界 Uniform[-1,1]",
        k: 1,
        variance: 1 / 3,
        range: 2,
        kind: "bounded-mgf",
        mgf: function (lambda) {
          var value = Number(lambda);
          return Math.abs(value) < 1e-12 ? 1 : sinh(value) / value;
        },
        tail: function (threshold) {
          var value = Math.abs(Number(threshold));
          return value <= 1 ? 1 - value : 0;
        },
        sumTail: null,
        theorem: "范围为 2；Hoeffding 引理给 K=1 的安全证书，K 不等于标准差。",
        evidence: "单变量尾是解析值；和的真实卷积不在本实验中冒充定理。"
      },
      {
        id: "heavy-tail",
        label: "对称重尾 (1+t)^−3",
        k: null,
        variance: 1,
        range: null,
        kind: "no-subgaussian",
        mgf: function (lambda) { return Math.abs(Number(lambda)) < 1e-12 ? 1 : Infinity; },
        tail: function (threshold) {
          var value = Math.max(0, Number(threshold));
          return Math.pow(1 + value, -3);
        },
        sumTail: null,
        theorem: "有限二阶矩不提供指数矩；任何非零 λ 的 MGF 发散。",
        evidence: "多项式尾解析值；不能套 Gaussian 型和界。"
      }
    ];

    var STYLE_TEXT = [
      ".sg-lab{--sg-blue:var(--cl-blue,#315f9d);--sg-gold:var(--cl-gold,#9b6a12);--sg-green:var(--cl-green,#39734d);--sg-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      ".sg-lab *,.sg-lab *::before,.sg-lab *::after{box-sizing:border-box;}.sg-lab [hidden]{display:none!important;}",
      ".sg-lab h3,.sg-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.sg-lab h3{font-size:1.18rem;}.sg-lab h4{margin-top:16px;font-size:1rem;}.sg-lab p{margin:.65em 0;}",
      ".sg-lab .sg-note,.sg-lab .sg-feedback,.sg-lab .sg-boundary{color:var(--fg-soft);font-size:13px;line-height:1.7;}.sg-lab button,.sg-lab select,.sg-lab input{font:inherit;letter-spacing:0;}",
      ".sg-lab button,.sg-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}.sg-lab input[type=range],.sg-lab input[type=number]{min-height:44px;}.sg-lab input[type=range]{display:block;width:100%;margin:0;accent-color:var(--accent);}.sg-lab input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);}",
      ".sg-lab button:hover{border-color:var(--accent);}.sg-lab button[aria-pressed=\"true\"],.sg-lab button.sg-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.sg-lab button:focus-visible,.sg-lab select:focus-visible,.sg-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".sg-lab .sg-predict{margin:14px 0;padding:13px 14px;border-left:3px solid var(--sg-gold);background:var(--bg);}.sg-lab .sg-predict-title{display:block;margin-bottom:10px;font-size:13px;}.sg-lab .sg-question-list{display:grid;gap:12px;}.sg-lab .sg-question{min-width:0;margin:0;padding:0;border:0;}.sg-lab .sg-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}.sg-lab .sg-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.sg-lab .sg-choice-row button{font-size:12px;}",
      ".sg-lab .sg-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.sg-lab .sg-actions>*{flex:1 1 155px;}.sg-lab .sg-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.sg-lab .sg-pass{color:var(--sg-green);}.sg-lab .sg-warn{color:var(--sg-red);}",
      ".sg-lab .sg-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 16px;margin:14px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.sg-lab .sg-control{display:grid;gap:5px;min-width:0;}.sg-lab .sg-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}.sg-lab .sg-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".sg-lab .sg-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.sg-lab .sg-interpretation{margin:12px 0;padding:11px 13px;border-left:3px solid var(--sg-green);background:var(--bg);font-size:13px;line-height:1.7;}.sg-lab .sg-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0;}.sg-lab .sg-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.sg-lab .sg-metric.sg-blue{border-top-color:var(--sg-blue);}.sg-lab .sg-metric.sg-gold{border-top-color:var(--sg-gold);}.sg-lab .sg-metric.sg-green{border-top-color:var(--sg-green);}.sg-lab .sg-metric.sg-red{border-top-color:var(--sg-red);}.sg-lab .sg-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.sg-lab .sg-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".sg-lab .sg-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:12px;}.sg-lab .sg-chart{min-width:0;}.sg-lab .sg-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.sg-lab svg{display:block;width:100%;height:auto;color:var(--fg);}.sg-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.sg-lab .sg-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.sg-lab table{width:100%;min-width:920px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.sg-lab th,.sg-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.sg-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.sg-lab .sg-ok{color:var(--sg-green);}.sg-lab .sg-fail{color:var(--sg-red);}",
      "@media(max-width:820px){.sg-lab .sg-controls,.sg-lab .sg-charts{grid-template-columns:repeat(2,minmax(0,1fr));}}",
      "@media(max-width:560px){.sg-lab .sg-controls,.sg-lab .sg-charts{grid-template-columns:minmax(0,1fr);}.sg-lab .sg-choice-row{grid-template-columns:minmax(0,1fr);}.sg-lab .sg-predict{padding-left:11px;padding-right:11px;}.sg-lab th,.sg-lab td{padding-left:5px;padding-right:5px;}}",
      "@media(prefers-reduced-motion:reduce){.sg-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function modelById(id) {
      for (var i = 0; i < MODELS.length; i += 1) {
        if (MODELS[i].id === id) return MODELS[i];
      }
      throw new Error("Unknown concentration model: " + id);
    }

    function positiveInteger(value, label, max) {
      var number = Number(value);
      if (!finite(number) || !Number.isInteger(number) || number < 1 || (max && number > max)) {
        throw new Error(label + " must be a positive integer");
      }
      return number;
    }

    function nonnegative(value, label) {
      var number = Number(value);
      if (!finite(number) || number < 0) throw new Error(label + " must be nonnegative");
      return number;
    }

    function mgf(modelId, lambda) {
      return modelById(modelId).mgf(Number(lambda));
    }

    function tail(modelId, threshold) {
      return modelById(modelId).tail(nonnegative(threshold, "threshold"));
    }

    function subgaussianBound(modelId, n, threshold) {
      var selected = modelById(modelId);
      if (selected.k === null) return null;
      var count = positiveInteger(n, "n", 1000);
      var value = nonnegative(threshold, "threshold");
      return Math.min(1, 2 * Math.exp(-(value * value) / (2 * count * selected.k * selected.k)));
    }

    function hoeffdingBound(modelId, n, threshold) {
      var selected = modelById(modelId);
      if (selected.range === null) return null;
      var count = positiveInteger(n, "n", 1000);
      var value = nonnegative(threshold, "threshold");
      return Math.min(1, 2 * Math.exp(-(2 * value * value) / (count * selected.range * selected.range)));
    }

    function unionBound(singleBound, events) {
      if (singleBound === null) return null;
      return Math.min(1, nonnegative(events, "events") * singleBound);
    }

    function linspace(start, end, count) {
      var result = [];
      for (var i = 0; i <= count; i += 1) {
        result.push(start + (end - start) * i / count);
      }
      return result;
    }

    function analyze(options) {
      var settings = options || {};
      var modelId = settings.modelId || DEFAULTS.modelId;
      var selected = modelById(modelId);
      var n = positiveInteger(settings.n === undefined ? DEFAULTS.n : settings.n, "n", 1000);
      var threshold = nonnegative(
        settings.threshold === undefined ? DEFAULTS.threshold : settings.threshold,
        "threshold"
      );
      var events = positiveInteger(
        settings.events === undefined ? DEFAULTS.events : settings.events,
        "events",
        10000
      );
      var singleBound = selected.k === null
        ? null
        : subgaussianBound(modelId, 1, SINGLE_THRESHOLD);
      var sumBound = subgaussianBound(modelId, n, threshold);
      var sumActual = typeof selected.sumTail === "function"
        ? selected.sumTail(n, threshold)
        : null;
      var lambdaRows = linspace(0, 2.5, 20).map(function (lambda) {
        return {
          lambda: lambda,
          actual: selected.mgf(lambda),
          bound: selected.k === null ? null : Math.exp(lambda * lambda * selected.k * selected.k / 2)
        };
      });
      var tailRows = linspace(0, 4, 20).map(function (value) {
        return {
          threshold: value,
          actual: selected.tail(value),
          bound: selected.k === null ? null : Math.min(1, 2 * Math.exp(-(value * value) / (2 * selected.k * selected.k)))
        };
      });
      return {
        model: selected,
        n: n,
        threshold: threshold,
        events: events,
        singleThreshold: SINGLE_THRESHOLD,
        singleTail: selected.tail(SINGLE_THRESHOLD),
        singleBound: singleBound,
        sumActual: sumActual,
        sumBound: sumBound,
        unionBound: unionBound(sumBound, events),
        hoeffding: hoeffdingBound(modelId, n, threshold),
        lambdaRows: lambdaRows,
        tailRows: tailRows,
        theorem: selected.theorem,
        evidence: selected.evidence
      };
    }

    function formatNumber(value, digits) {
      if (value === Infinity) return "∞";
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

    function pathFrom(rows, xKey, yKey, mapX, mapY, yMax) {
      var commands = [];
      var open = false;
      rows.forEach(function (row) {
        if (!finite(row[yKey])) {
          open = false;
          return;
        }
        var y = clamp(row[yKey], 0, yMax);
        commands.push((open ? "L" : "M") + mapX(row[xKey]) + " " + mapY(y));
        open = true;
      });
      return commands.join(" ");
    }

    function chartSvg(doc, data, mode, uid) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 520 300",
        role: "img",
        "aria-labelledby": uid + "-" + mode + "-title " + uid + "-" + mode + "-desc"
      });
      var title = mode === "mgf" ? "MGF 与亚高斯包络" : "尾概率与亚高斯尾界";
      var desc = mode === "mgf"
        ? "蓝线为模型 MGF，金线为 exp(lambda squared K squared over 2) 包络。"
        : "蓝线为解析模型尾概率，金线为定理尾界；重尾模型没有金色证书线。";
      svg.appendChild(svgNode(doc, "title", { id: uid + "-" + mode + "-title" }, title));
      svg.appendChild(svgNode(doc, "desc", { id: uid + "-" + mode + "-desc" }, desc));
      var margin = { left: 43, right: 14, top: 18, bottom: 31 };
      var width = 520 - margin.left - margin.right;
      var height = 300 - margin.top - margin.bottom;
      var mapX = function (value) { return margin.left + value / 2.5 * width; };
      var yMax = mode === "mgf" ? 25 : 1;
      var mapY = function (value) { return margin.top + (yMax - value) / yMax * height; };
      var rows = mode === "mgf"
        ? data.lambdaRows.map(function (row) { return { x: row.lambda, actual: row.actual, bound: row.bound }; })
        : data.tailRows.map(function (row) { return { x: row.threshold, actual: row.actual, bound: row.bound }; });
      var group = svgNode(doc, "g", {});
      [0, 0.5, 1].forEach(function (tick) {
        var y = mapY(mode === "mgf" ? tick * yMax : tick);
        group.appendChild(svgNode(doc, "line", {
          x1: margin.left, y1: y, x2: margin.left + width, y2: y,
          stroke: "var(--border)", "stroke-opacity": "0.45", "stroke-width": "1"
        }));
        group.appendChild(svgNode(doc, "text", {
          x: margin.left - 6, y: y + 4, "text-anchor": "end", "font-size": "10"
        }, formatNumber(mode === "mgf" ? tick * yMax : tick, mode === "mgf" ? 0 : 1)));
      });
      group.appendChild(svgNode(doc, "line", {
        x1: margin.left, y1: margin.top + height, x2: margin.left + width, y2: margin.top + height,
        stroke: "currentColor", "stroke-opacity": "0.65", "stroke-width": "1.1"
      }));
      group.appendChild(svgNode(doc, "path", {
        d: pathFrom(rows, "x", "bound", mapX, mapY, yMax),
        fill: "none",
        stroke: "var(--sg-gold)",
        "stroke-width": "2",
        "stroke-dasharray": "6 4"
      }));
      group.appendChild(svgNode(doc, "path", {
        d: pathFrom(rows, "x", "actual", mapX, mapY, yMax),
        fill: "none",
        stroke: "var(--sg-blue)",
        "stroke-width": "2.4",
        "stroke-linecap": "round"
      }));
      if (data.model.k === null && mode === "mgf") {
        group.appendChild(svgNode(doc, "text", {
          x: margin.left + width - 3, y: margin.top + 17, "text-anchor": "end", "font-size": "12"
        }, "λ ≠ 0: MGF = ∞"));
      }
      group.appendChild(svgNode(doc, "text", {
        x: margin.left + width - 3, y: margin.top + height + 23, "text-anchor": "end", "font-size": "11"
      }, mode === "mgf" ? "λ" : "t"));
      svg.appendChild(group);
      return svg;
    }

    function metric(doc, label, value, color) {
      return element(doc, "div", { className: "sg-metric " + (color || "") }, [
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
      var fieldset = element(doc, "fieldset", { className: "sg-question" });
      fieldset.appendChild(element(doc, "legend", {}, legendText));
      var row = element(doc, "div", { className: "sg-choice-row" });
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
      ["tails", "mgf", "union"].forEach(function (key) {
        (refs[key] || []).forEach(function (item) {
          item.node.setAttribute(
            "aria-pressed",
            refs.state.predictions[key] === item.value ? "true" : "false"
          );
        });
      });
      var answered = ["tails", "mgf", "union"].every(function (key) {
        return refs.state.predictions[key] !== null;
      });
      refs.feedback.textContent = answered ? "三个预测已记录，可以揭示结果。" : "请先完成三个预测。";
      refs.feedback.className = "sg-feedback";
    }

    function renderResults(refs) {
      var state = refs.state;
      var data = analyze({
        modelId: state.modelId,
        n: state.n,
        threshold: state.threshold,
        events: state.events
      });
      refs.modelSelect.value = state.modelId;
      refs.nInput.value = String(state.n);
      refs.nOutput.textContent = String(state.n);
      refs.thresholdInput.value = String(state.threshold);
      refs.thresholdOutput.textContent = formatNumber(state.threshold, 1);
      refs.eventsInput.value = String(state.events);
      refs.eventsOutput.textContent = String(state.events);
      refs.summary.textContent =
        "定理层： " +
        data.theorem +
        " 有限证据层： " +
        data.evidence;
      replaceChildren(refs.metrics, [
        metric(refs.doc, "模型 K", data.model.k === null ? "不存在" : formatNumber(data.model.k, 2), data.model.k === null ? "sg-red" : "sg-blue"),
        metric(refs.doc, "n / 阈值 t", data.n + " / " + formatNumber(data.threshold, 2), "sg-gold"),
        metric(refs.doc, "单事件界", formatNumber(data.sumBound, 4), "sg-gold"),
        metric(refs.doc, "m 事件 union", formatNumber(data.unionBound, 4), data.unionBound !== null && data.unionBound >= 1 ? "sg-red" : "sg-green"),
        metric(refs.doc, "有限和模型值", formatNumber(data.sumActual, 4), data.sumActual === null ? "sg-red" : "sg-blue"),
        metric(refs.doc, "Hoeffding", formatNumber(data.hoeffding, 4), data.hoeffding === null ? "sg-red" : "sg-green")
      ]);
      replaceChildren(refs.mgfChart, [
        element(refs.doc, "h4", {}, "MGF 与 Gaussian 型包络"),
        element(refs.doc, "div", { className: "sg-chart-frame" }, chartSvg(refs.doc, data, "mgf", refs.uid))
      ]);
      replaceChildren(refs.tailChart, [
        element(refs.doc, "h4", {}, "单变量尾概率"),
        element(refs.doc, "div", { className: "sg-chart-frame" }, chartSvg(refs.doc, data, "tail", refs.uid))
      ]);
      var rows = MODELS.map(function (model) {
        var modelData = analyze({
          modelId: model.id,
          n: data.n,
          threshold: data.threshold,
          events: data.events
        });
        return element(refs.doc, "tr", {}, [
          element(refs.doc, "th", { scope: "row" }, model.label),
          element(refs.doc, "td", {}, model.k === null ? "—" : formatNumber(model.k, 2)),
          element(refs.doc, "td", {}, formatNumber(model.mgf(1), 4)),
          element(refs.doc, "td", {}, formatNumber(modelData.singleTail, 4)),
          element(refs.doc, "td", {}, formatNumber(modelData.singleBound, 4)),
          element(refs.doc, "td", {}, formatNumber(modelData.sumBound, 4)),
          element(refs.doc, "td", {}, formatNumber(modelData.unionBound, 4)),
          element(refs.doc, "td", { className: model.k === null ? "sg-fail" : "sg-ok" }, model.k === null ? "无亚高斯证书" : "MGF/范围证书")
        ]);
      });
      replaceChildren(refs.ledgerBody, rows);
      refs.boundary.textContent =
        "注意量词：MGF/尾界是模型在所有参数上的定理陈述；当前图表只采样有限网格，和的模型值只对 Gaussian 与 Rademacher 做了精确闭式/枚举。union bound 只负责把单事件上界相加，不能把有限数值变成独立事件的乘法概率。";
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      injectStyle(doc);
      var uid = "sg-" + (INSTANCE += 1);
      var state = {
        modelId: DEFAULTS.modelId,
        n: DEFAULTS.n,
        threshold: DEFAULTS.threshold,
        events: DEFAULTS.events,
        revealed: false,
        predictions: { tails: null, mgf: null, union: null }
      };
      var refs = { doc: doc, uid: uid, state: state };
      var shell = element(doc, "div", { className: "sg-shell" });
      shell.appendChild(element(doc, "h3", {}, "亚高斯 MGF、尾界与 union bound"));
      shell.appendChild(element(doc, "p", { className: "sg-note" }, "本实验不抽随机样本：模型值是解析读数，曲线与账本把定理上界和有限证据并排显示。"));

      var prediction = element(doc, "section", {
        className: "sg-predict",
        "aria-labelledby": uid + "-predict-title"
      });
      prediction.appendChild(element(doc, "strong", { className: "sg-predict-title", id: uid + "-predict-title" }, "先预测，再揭示"));
      var questionList = element(doc, "div", { className: "sg-question-list" });
      questionList.appendChild(choiceQuestion(doc, refs, "tails", "1. Gaussian 与 Rademacher 的 K 相同，真实有限尾概率？", [
        { value: "different", label: "可以不同" },
        { value: "same", label: "必须相同" },
        { value: "ordered", label: "固定反序" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "mgf", "2. 对称重尾的非零 λ MGF？", [
        { value: "infinite", label: "发散" },
        { value: "finite", label: "有限且等于 1" },
        { value: "gaussian", label: "必是 e^(λ²/2)" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "union", "3. m 个事件的 union-bound 账本？", [
        { value: "mp", label: "min(1, mp)" },
        { value: "power", label: "p^m" },
        { value: "divide", label: "p/m" }
      ]));
      prediction.appendChild(questionList);
      var actions = element(doc, "div", { className: "sg-actions" });
      var reveal = element(doc, "button", { type: "button", className: "sg-primary", text: "揭示并核对" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      refs.feedback = element(doc, "p", { className: "sg-feedback", "aria-live": "polite" }, "请先完成三个预测。");
      prediction.appendChild(refs.feedback);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "sg-controls", hidden: true, "aria-label": "集中不等式参数" });
      refs.controls = controls;
      refs.modelSelect = element(doc, "select", { "aria-label": "选择分布模型" });
      MODELS.forEach(function (model) {
        refs.modelSelect.appendChild(element(doc, "option", { value: model.id }, model.label));
      });
      refs.nInput = element(doc, "input", { type: "range", min: "4", max: "80", step: "1", value: String(DEFAULTS.n), "aria-label": "独立变量个数 n" });
      refs.nOutput = element(doc, "output", {}, String(DEFAULTS.n));
      refs.thresholdInput = element(doc, "input", { type: "range", min: "1", max: "30", step: "0.5", value: String(DEFAULTS.threshold), "aria-label": "和的阈值 t" });
      refs.thresholdOutput = element(doc, "output", {}, formatNumber(DEFAULTS.threshold, 1));
      refs.eventsInput = element(doc, "input", { type: "number", min: "1", max: "20", step: "1", value: String(DEFAULTS.events), "aria-label": "同时事件数 m" });
      refs.eventsOutput = element(doc, "output", {}, String(DEFAULTS.events));
      controls.appendChild(element(doc, "div", { className: "sg-control" }, [element(doc, "label", {}, "模型"), refs.modelSelect]));
      controls.appendChild(element(doc, "div", { className: "sg-control" }, [element(doc, "label", {}, ["n = ", refs.nOutput]), refs.nInput]));
      controls.appendChild(element(doc, "div", { className: "sg-control" }, [element(doc, "label", {}, ["和阈值 t = ", refs.thresholdOutput]), refs.thresholdInput]));
      controls.appendChild(element(doc, "div", { className: "sg-control" }, [element(doc, "label", {}, ["事件数 m = ", refs.eventsOutput]), refs.eventsInput]));
      shell.appendChild(controls);

      var results = element(doc, "section", { className: "sg-results", hidden: true, "aria-labelledby": uid + "-results-title" });
      refs.results = results;
      results.appendChild(element(doc, "h4", { id: uid + "-results-title" }, "揭示后的模型与证书账本"));
      refs.summary = element(doc, "p", { className: "sg-interpretation", "aria-live": "polite" });
      results.appendChild(refs.summary);
      refs.metrics = element(doc, "div", { className: "sg-metrics" });
      results.appendChild(refs.metrics);
      var charts = element(doc, "div", { className: "sg-charts" });
      refs.mgfChart = element(doc, "div", { className: "sg-chart" });
      refs.tailChart = element(doc, "div", { className: "sg-chart" });
      charts.appendChild(refs.mgfChart);
      charts.appendChild(refs.tailChart);
      results.appendChild(charts);
      var ledger = element(doc, "div", { className: "sg-ledger" });
      var table = element(doc, "table", { "aria-label": "亚高斯模型比较与 union-bound 账本" });
      table.appendChild(element(doc, "caption", {}, "四类模型的 MGF、单变量尾、和尾界与多事件上界"));
      table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
        element(doc, "th", { scope: "col" }, "模型"),
        element(doc, "th", { scope: "col" }, "K"),
        element(doc, "th", { scope: "col" }, "MGF(1)"),
        element(doc, "th", { scope: "col" }, "单尾 t=1.5"),
        element(doc, "th", { scope: "col" }, "单尾界"),
        element(doc, "th", { scope: "col" }, "和尾界"),
        element(doc, "th", { scope: "col" }, "m 事件"),
        element(doc, "th", { scope: "col" }, "证书")
      ])));
      refs.ledgerBody = element(doc, "tbody");
      table.appendChild(refs.ledgerBody);
      ledger.appendChild(table);
      results.appendChild(ledger);
      refs.boundary = element(doc, "p", { className: "sg-boundary" });
      results.appendChild(refs.boundary);
      shell.appendChild(results);
      root.classList.add("sg-lab");
      root.replaceChildren(shell);

      function render() {
        controls.hidden = !state.revealed;
        results.hidden = !state.revealed;
        renderPrediction(refs);
        if (state.revealed) renderResults(refs);
      }

      reveal.addEventListener("click", function () {
        var answers = { tails: "different", mgf: "infinite", union: "mp" };
        var missing = ["tails", "mgf", "union"].filter(function (key) {
          return state.predictions[key] === null;
        });
        if (missing.length) {
          refs.feedback.textContent = "还缺少 " + missing.length + " 个预测。";
          refs.feedback.className = "sg-feedback sg-warn";
          return;
        }
        state.revealed = true;
        render();
        var hits = ["tails", "mgf", "union"].filter(function (key) {
          return state.predictions[key] === answers[key];
        }).length;
        refs.feedback.textContent = "已揭示：" + hits + "/3 个预测命中；解析读数仍不等于新的定理。";
        refs.feedback.className = "sg-feedback " + (hits === 3 ? "sg-pass" : "sg-warn");
        if (api && typeof api.announce === "function") api.announce(root, refs.feedback.textContent);
      });
      reset.addEventListener("click", function () {
        state = {
          modelId: DEFAULTS.modelId,
          n: DEFAULTS.n,
          threshold: DEFAULTS.threshold,
          events: DEFAULTS.events,
          revealed: false,
          predictions: { tails: null, mgf: null, union: null }
        };
        refs.state = state;
        render();
      });
      refs.modelSelect.addEventListener("change", function () {
        state.modelId = refs.modelSelect.value;
        if (state.revealed) renderResults(refs);
      });
      refs.nInput.addEventListener("input", function () {
        state.n = Number(refs.nInput.value);
        if (state.revealed) renderResults(refs);
      });
      refs.thresholdInput.addEventListener("input", function () {
        state.threshold = Number(refs.thresholdInput.value);
        if (state.revealed) renderResults(refs);
      });
      refs.eventsInput.addEventListener("change", function () {
        state.events = clamp(Math.round(Number(refs.eventsInput.value) || DEFAULTS.events), 1, 20);
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

      assert(MODELS.length === 4, "model count");
      close(mgf("gaussian", 1), Math.exp(0.5), 1e-12, "Gaussian MGF");
      close(mgf("rademacher", 0), 1, 1e-12, "Rademacher MGF at zero");
      assert(mgf("heavy-tail", 0.5) === Infinity, "heavy-tail MGF diverges");
      assert(mgf("rademacher", 1) <= Math.exp(0.5), "Rademacher MGF envelope");
      assert(mgf("uniform", 1) <= Math.exp(0.5), "uniform MGF envelope");
      close(tail("rademacher", 1.5), 0, 1e-12, "Rademacher bounded tail");
      close(tail("uniform", 1.5), 0, 1e-12, "uniform bounded tail");
      close(tail("heavy-tail", 1.5), 0.064, 1e-12, "heavy tail value");
      close(subgaussianBound("rademacher", 32, 12), 2 * Math.exp(-2.25), 1e-12, "Rademacher sum bound");
      close(hoeffdingBound("uniform", 32, 12), 2 * Math.exp(-2.25), 1e-12, "Hoeffding range bound");
      close(unionBound(0.2, 5), 1, 1e-12, "union cap");
      close(binomialRademacherTail(4, 3), 0.125, 1e-12, "finite Rademacher enumeration");
      var result = analyze({ modelId: "gaussian", n: 32, threshold: 12, events: 5 });
      assert(result.sumActual !== null && result.sumBound !== null, "Gaussian finite and bound");
      assert(result.unionBound >= result.sumBound, "union bound bookkeeping");
      var heavy = analyze({ modelId: "heavy-tail", n: 32, threshold: 12, events: 5 });
      assert(heavy.sumBound === null && heavy.unionBound === null, "heavy-tail has no subgaussian certificate");
      assert(heavy.lambdaRows.some(function (row) { return row.actual === Infinity; }), "heavy MGF plot evidence");
      var rejected = false;
      try { analyze({ n: 0 }); } catch (error) { rejected = true; }
      assert(rejected, "invalid n rejected");
      rejected = false;
      try { analyze({ n: 3.5 }); } catch (error) { rejected = true; }
      assert(rejected, "fractional n rejected");
      rejected = false;
      try { analyze({ threshold: -1 }); } catch (error) { rejected = true; }
      assert(rejected, "negative threshold rejected");
      return { checks: checks, models: MODELS.length };
    }

    return {
      DEFAULTS: DEFAULTS,
      MODELS: MODELS,
      gaussianTail: gaussianTail,
      binomialRademacherTail: binomialRademacherTail,
      mgf: mgf,
      tail: tail,
      subgaussianBound: subgaussianBound,
      hoeffdingBound: hoeffdingBound,
      unionBound: unionBound,
      analyze: analyze,
      mount: mount,
      selfTest: selfTest
    };
  }
);
