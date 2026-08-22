(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("regression-diagnostics", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("regression-diagnostics self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("regression-diagnostics self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-regression-diagnostics-styles";
  var SERIAL = 0;
  var DEFAULTS = { scenario: "curved", outlierX: 13, outlierY: 18 };
  var PRESETS = {
    linear: {
      label: "近似线性：残差应无结构",
      points: [
        { x: 1, y: 2.1 }, { x: 2, y: 2.8 }, { x: 3, y: 4.4 }, { x: 4, y: 4.9 },
        { x: 5, y: 6.1 }, { x: 6, y: 6.9 }, { x: 7, y: 7.7 }, { x: 8, y: 9.2 }, { x: 9, y: 9.8 }
      ]
    },
    curved: {
      label: "弯曲关系：R² 可能仍很高",
      points: [
        { x: 1, y: 4.8 }, { x: 2, y: 3.6 }, { x: 3, y: 3.0 }, { x: 4, y: 3.4 },
        { x: 5, y: 4.7 }, { x: 6, y: 6.6 }, { x: 7, y: 9.0 }, { x: 8, y: 11.8 }, { x: 9, y: 15.2 }
      ]
    },
    influence: {
      label: "高杠杆点：斜率可能被单点拉动",
      points: [
        { x: 1, y: 2.1 }, { x: 2, y: 2.8 }, { x: 3, y: 4.4 }, { x: 4, y: 4.9 },
        { x: 5, y: 6.1 }, { x: 6, y: 6.9 }, { x: 7, y: 7.7 }, { x: 8, y: 9.2 }
      ]
    }
  };

  var STYLE_TEXT = [
    ".rd-lab{--rd-blue:#2b628f;--rd-green:#39734d;--rd-red:#b4493f;--rd-gold:#9a6b16;--rd-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    "html[data-theme=dark] .rd-lab{--rd-blue:#83c8ff;--rd-green:#82d49e;--rd-red:#f08d83;--rd-gold:#e2b458;--rd-soft:#b8b2a7}",
    ".rd-lab *,.rd-lab *::before,.rd-lab *::after{box-sizing:border-box}.rd-lab [hidden]{display:none!important}",
    ".rd-lab h3,.rd-lab h4{margin:0;color:var(--fg);letter-spacing:0}.rd-lab h3{font-size:1.18rem}.rd-lab h4{font-size:1rem}",
    ".rd-lab .rd-intro,.rd-lab .rd-note,.rd-lab .rd-feedback{color:var(--rd-soft);font-size:13px;line-height:1.7}",
    ".rd-lab .rd-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--rd-gold);background:var(--bg)}",
    ".rd-lab fieldset{min-width:0;margin:0;padding:0;border:0}.rd-lab legend{margin-bottom:8px;color:var(--fg);font-weight:750;line-height:1.5}.rd-lab .rd-question{min-width:0;margin:11px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.rd-lab .rd-question legend{color:var(--rd-soft);font-size:13px;font-weight:650}",
    ".rd-lab .rd-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.rd-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.rd-lab button:hover{border-color:var(--accent)}.rd-lab button[aria-pressed=true],.rd-lab button.rd-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.rd-lab button:focus-visible,.rd-lab input:focus-visible,.rd-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.rd-lab .rd-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.rd-lab .rd-actions>*{flex:1 1 180px}.rd-lab .rd-feedback{min-height:2em;margin:8px 0;font-weight:700}.rd-lab .rd-pass{color:var(--rd-green)}.rd-lab .rd-warn{color:var(--rd-red)}",
    ".rd-lab .rd-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.rd-lab .rd-layout{display:grid;grid-template-columns:minmax(205px,.62fr) minmax(0,1.38fr);gap:16px;align-items:start;min-width:0}.rd-lab .rd-controls,.rd-lab .rd-stage{min-width:0}",
    ".rd-lab .rd-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.rd-lab .rd-controls h4{margin:0}.rd-lab .rd-control{display:grid;gap:5px;min-width:0}.rd-lab .rd-control label{color:var(--rd-soft);font-size:13px;font-weight:700}.rd-lab .rd-control output{color:var(--accent);font-variant-numeric:tabular-nums}.rd-lab input[type=range]{display:block;width:100%;min-height:44px;height:44px;margin:0;accent-color:var(--accent)}.rd-lab select{width:100%;min-height:44px;padding:7px 8px;border:1px solid var(--border);border-radius:5px;background:var(--bg);color:var(--fg);font:inherit}",
    ".rd-lab .rd-stage-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.rd-lab .rd-chart{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.rd-lab .rd-chart text{fill:currentColor;font-family:inherit;letter-spacing:0}.rd-lab .rd-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.65}.rd-lab .rd-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72}.rd-lab .rd-fit{stroke:var(--rd-blue);stroke-width:2.5}.rd-lab .rd-residual{stroke:var(--rd-red);stroke-width:1.4;stroke-dasharray:3 3;opacity:.72}.rd-lab .rd-point{fill:var(--rd-blue);stroke:var(--bg);stroke-width:1.3}.rd-lab .rd-high{fill:var(--rd-gold)}.rd-lab .rd-influential{fill:var(--rd-red)}.rd-lab .rd-zero{stroke:var(--rd-gold);stroke-width:1.6;stroke-dasharray:5 4}.rd-lab .rd-label{font-size:11px}.rd-lab .rd-axis-label{font-size:12px}.rd-lab .rd-tick{font-size:11px;fill:var(--rd-soft)!important}.rd-lab .rd-chart-note{font-size:11px;fill:var(--rd-soft)!important}",
    ".rd-lab .rd-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:10px 0 12px}.rd-lab .rd-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.rd-lab .rd-metric:nth-child(1){border-top-color:var(--rd-blue)}.rd-lab .rd-metric:nth-child(2){border-top-color:var(--rd-green)}.rd-lab .rd-metric:nth-child(3){border-top-color:var(--rd-gold)}.rd-lab .rd-metric:nth-child(4){border-top-color:var(--rd-red)}.rd-lab .rd-metric:nth-child(5){border-top-color:var(--rd-blue)}.rd-lab .rd-metric span{display:block;color:var(--rd-soft);font-size:11.5px;line-height:1.4}.rd-lab .rd-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".rd-lab .rd-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch}.rd-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.rd-lab caption{padding:0 0 7px;text-align:left;color:var(--rd-soft);font-size:12px;line-height:1.55}.rd-lab th,.rd-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.rd-lab th{color:var(--rd-soft);font-size:11.5px;font-weight:750}.rd-lab td:nth-child(n+2){white-space:nowrap}.rd-lab .rd-caution{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--rd-gold);background:var(--bg);color:var(--rd-soft);font-size:12.5px;line-height:1.7}",
    "@media(max-width:900px){.rd-lab .rd-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:700px){.rd-lab .rd-choice-row{grid-template-columns:minmax(0,1fr)}.rd-lab .rd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){.rd-lab .rd-stage-frame{padding:6px}.rd-lab table{font-size:11.5px}.rd-lab th,.rd-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.rd-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function copyPoints(points) {
    return points.map(function (point, index) { return { id: point.id || "P" + (index + 1), x: point.x, y: point.y }; });
  }

  function copyConfig(config) {
    var source = config || DEFAULTS;
    return {
      scenario: PRESETS[source.scenario] ? source.scenario : DEFAULTS.scenario,
      outlierX: clamp(Number(source.outlierX === undefined ? DEFAULTS.outlierX : source.outlierX), 9, 18),
      outlierY: clamp(Number(source.outlierY === undefined ? DEFAULTS.outlierY : source.outlierY), 4, 28)
    };
  }

  function pointsFor(config) {
    var settings = copyConfig(config);
    if (settings.scenario !== "influence") return copyPoints(PRESETS[settings.scenario].points);
    var base = copyPoints(PRESETS.influence.points);
    base.push({ id: "P9", x: settings.outlierX, y: settings.outlierY });
    return base;
  }

  function sum(values) {
    return values.reduce(function (total, value) { return total + value; }, 0);
  }

  function analyze(points) {
    if (!points || points.length < 3) throw new RangeError("回归诊断至少需要 3 个点。 ");
    if (!points.every(function (point) { return point && finite(Number(point.x)) && finite(Number(point.y)); })) {
      throw new RangeError("回归点的 x 与 y 必须是有限数。 ");
    }
    var xBar = sum(points.map(function (point) { return point.x; })) / points.length;
    var yBar = sum(points.map(function (point) { return point.y; })) / points.length;
    var sxx = sum(points.map(function (point) { return Math.pow(point.x - xBar, 2); }));
    if (!(sxx > 0)) throw new RangeError("x 必须有变化。 ");
    var sxy = sum(points.map(function (point) { return (point.x - xBar) * (point.y - yBar); }));
    var slope = sxy / sxx;
    var intercept = yBar - slope * xBar;
    var rows = points.map(function (point, index) {
      var fitted = intercept + slope * point.x;
      var residual = point.y - fitted;
      var leverage = 1 / points.length + Math.pow(point.x - xBar, 2) / sxx;
      return { id: point.id || "P" + (index + 1), x: point.x, y: point.y, fitted: fitted, residual: residual, leverage: leverage, cooks: 0 };
    });
    var sse = sum(rows.map(function (row) { return row.residual * row.residual; }));
    var sst = sum(points.map(function (point) { return Math.pow(point.y - yBar, 2); }));
    var mse = sse / (points.length - 2);
    rows.forEach(function (row) {
      row.cooks = mse > 1e-12 && row.leverage < 1 ? (row.residual * row.residual / (2 * mse)) * row.leverage / Math.pow(1 - row.leverage, 2) : 0;
    });
    var maxLeverage = rows.reduce(function (best, row) { return row.leverage > best.leverage ? row : best; }, rows[0]);
    var maxInfluence = rows.reduce(function (best, row) { return row.cooks > best.cooks ? row : best; }, rows[0]);
    return {
      n: points.length,
      xBar: xBar,
      yBar: yBar,
      sxx: sxx,
      slope: slope,
      intercept: intercept,
      rows: rows,
      sse: sse,
      sst: sst,
      mse: mse,
      r2: sst > 1e-12 ? 1 - sse / sst : NaN,
      maxLeverage: maxLeverage,
      maxInfluence: maxInfluence
    };
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

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function element(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children);
  }

  function svgElement(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children);
  }

  function replaceChildren(node, children) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "").replace(/^-0$/, "0");
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function chart(api, doc, result, prefix) {
    var left = 56;
    var width = 680;
    var top = 30;
    var plotHeight = 220;
    var residualTop = 315;
    var residualHeight = 94;
    var points = result.rows;
    var valuesX = points.map(function (row) { return row.x; });
    var valuesY = points.reduce(function (all, row) { return all.concat([row.y, row.fitted]); }, []);
    var xMin = Math.min.apply(Math, valuesX);
    var xMax = Math.max.apply(Math, valuesX);
    var yMin = Math.min.apply(Math, valuesY);
    var yMax = Math.max.apply(Math, valuesY);
    var xPad = Math.max(.5, (xMax - xMin) * .1);
    var yPad = Math.max(.5, (yMax - yMin) * .12);
    xMin -= xPad;
    xMax += xPad;
    yMin -= yPad;
    yMax += yPad;
    var residualMax = Math.max.apply(Math, points.map(function (row) { return Math.abs(row.residual); }).concat([1])) * 1.25;
    function xMap(value) { return left + (value - xMin) / (xMax - xMin) * width; }
    function yMap(value) { return top + (yMax - value) / (yMax - yMin) * plotHeight; }
    function residualMap(value) { return residualTop + (residualMax - value) / (2 * residualMax) * residualHeight; }
    var children = [
      svgElement(api, doc, "title", { id: prefix + "-chart-title" }, "回归线、残差与杠杆诊断"),
      svgElement(api, doc, "desc", { id: prefix + "-chart-desc" }, "上图为散点和最小二乘线，红色虚线是残差；下图为残差图，点的大小反映杠杆，颜色提示影响度。"),
      svgElement(api, doc, "line", { className: "rd-axis", x1: left, y1: top + plotHeight, x2: left + width, y2: top + plotHeight }),
      svgElement(api, doc, "line", { className: "rd-axis", x1: left, y1: top, x2: left, y2: top + plotHeight }),
      svgElement(api, doc, "line", { className: "rd-axis", x1: left, y1: residualTop + residualHeight, x2: left + width, y2: residualTop + residualHeight }),
      svgElement(api, doc, "line", { className: "rd-axis", x1: left, y1: residualTop, x2: left, y2: residualTop + residualHeight }),
      svgElement(api, doc, "line", { className: "rd-zero", x1: left, y1: residualMap(0), x2: left + width, y2: residualMap(0) }),
      svgElement(api, doc, "text", { className: "rd-axis-label", x: left, y: top - 10 }, "观测 y 与拟合线"),
      svgElement(api, doc, "text", { className: "rd-axis-label", x: left, y: residualTop - 10 }, "残差 e_i = y_i − ŷ_i"),
      svgElement(api, doc, "text", { className: "rd-axis-label", x: left + width, y: residualTop + residualHeight + 25, "text-anchor": "end" }, "x")
    ];
    [0, .5, 1].forEach(function (fraction) {
      var x = left + fraction * width;
      var value = xMin + fraction * (xMax - xMin);
      children.push(svgElement(api, doc, "line", { className: "rd-grid", x1: x, y1: top, x2: x, y2: top + plotHeight }));
      children.push(svgElement(api, doc, "text", { className: "rd-tick", x: x, y: top + plotHeight + 17, "text-anchor": "middle" }, format(value, 1)));
    });
    var fitPath = "M " + xMap(xMin).toFixed(2) + " " + yMap(result.intercept + result.slope * xMin).toFixed(2) + " L " + xMap(xMax).toFixed(2) + " " + yMap(result.intercept + result.slope * xMax).toFixed(2);
    children.push(svgElement(api, doc, "path", { className: "rd-fit", d: fitPath }));
    points.forEach(function (row) {
      var highLeverage = row.id === result.maxLeverage.id;
      var influential = row.id === result.maxInfluence.id;
      var pointClass = influential ? "rd-point rd-influential" : highLeverage ? "rd-point rd-high" : "rd-point";
      var radius = 3.5 + 11 * Math.min(.45, row.leverage);
      children.push(svgElement(api, doc, "line", { className: "rd-residual", x1: xMap(row.x), y1: yMap(row.y), x2: xMap(row.x), y2: yMap(row.fitted) }));
      children.push(svgElement(api, doc, "circle", { className: pointClass, cx: xMap(row.x), cy: yMap(row.y), r: radius }));
      children.push(svgElement(api, doc, "text", { className: "rd-label", x: xMap(row.x) + 6, y: yMap(row.y) - 7 }, row.id));
      children.push(svgElement(api, doc, "circle", { className: pointClass, cx: xMap(row.x), cy: residualMap(row.residual), r: Math.max(3, radius * .62) }));
      children.push(svgElement(api, doc, "line", { className: "rd-residual", x1: xMap(row.x), y1: residualMap(0), x2: xMap(row.x), y2: residualMap(row.residual) }));
    });
    children.push(svgElement(api, doc, "text", { className: "rd-chart-note", x: left + width, y: top + 14, "text-anchor": "end" }, "点大小 ∝ 杠杆；红色点 = 最大 Cook 影响度"));
    return svgElement(api, doc, "svg", { className: "rd-chart", viewBox: "0 0 760 445", role: "img", "aria-labelledby": prefix + "-chart-title " + prefix + "-chart-desc" }, children);
  }

  function row(api, doc, cells) {
    return element(api, doc, "tr", {}, cells.map(function (cell, index) {
      return element(api, doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell);
    }));
  }

  function metric(api, doc, label, value) {
    return element(api, doc, "div", { className: "rd-metric" }, [element(api, doc, "span", {}, label), element(api, doc, "strong", {}, value)]);
  }

  function mount(root, api) {
    var doc = root && root.ownerDocument;
    if (!doc) return;
    installStyles(doc);
    SERIAL += 1;
    var prefix = "rd-" + SERIAL;
    var state = { config: copyConfig(DEFAULTS), revealed: false, predictions: { residual: null, leverage: null, r2: null, causal: null } };
    var questions = [
      {
        key: "residual",
        prompt: "观测值 y_i 与拟合值 ŷ_i 的差叫什么？",
        choices: [
          { value: "observed-gap", label: "残差 e_i" },
          { value: "latent-error", label: "直接可见的误差 ε_i" },
          { value: "leverage", label: "杠杆 h_ii" }
        ],
        expected: "observed-gap"
      },
      {
        key: "leverage",
        prompt: "一个点的杠杆主要由什么决定？",
        choices: [
          { value: "x-extreme", label: "x 是否远离 x̄" },
          { value: "y-gap", label: "y 离直线多远" },
          { value: "sample-size", label: "只由样本量决定" }
        ],
        expected: "x-extreme"
      },
      {
        key: "r2",
        prompt: "R² 很高时，最稳妥的第一反应是什么？",
        choices: [
          { value: "not-quality", label: "仍检查残差与设计" },
          { value: "quality", label: "模型质量已经被证明" },
          { value: "causal", label: "x 已被证明导致 y" }
        ],
        expected: "not-quality"
      },
      {
        key: "causal",
        prompt: "观测回归中的斜率显著，是否自动给出因果效应？",
        choices: [
          { value: "not-causal", label: "不自动，需要设计/识别假设" },
          { value: "causal", label: "是，显著就足够" },
          { value: "unknown", label: "只要 R² 高就是因果" }
        ],
        expected: "not-causal"
      }
    ];
    var gate = element(api, doc, "section", { className: "rd-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(api, doc, "h3", { id: prefix + "-gate-title" }, "预测门：先看拟合，再问它漏掉了什么"));
    gate.appendChild(element(api, doc, "p", { className: "rd-intro" }, "先完成四项诊断判断；提交前不显示散点、拟合线、R²、残差表或影响度。"));
    questions.forEach(function (question) {
      var fieldset = element(api, doc, "fieldset", { className: "rd-question" });
      fieldset.appendChild(element(api, doc, "legend", {}, question.prompt));
      var choiceRow = element(api, doc, "div", { className: "rd-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; renderPrediction(); });
        choice.button = button;
        choiceRow.appendChild(button);
      });
      question.choiceRow = choiceRow;
      fieldset.appendChild(choiceRow);
      gate.appendChild(fieldset);
    });
    var actions = element(api, doc, "div", { className: "rd-actions" });
    var reveal = element(api, doc, "button", { type: "button", className: "rd-primary" }, "提交预测并揭示");
    var reset = element(api, doc, "button", { type: "button" }, "重置");
    var feedback = element(api, doc, "p", { className: "rd-feedback", "aria-live": "polite" }, "");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);

    var stage = element(api, doc, "section", { className: "rd-revealed", hidden: true, "aria-labelledby": prefix + "-result-title" });
    stage.appendChild(element(api, doc, "h4", { id: prefix + "-result-title" }, "揭示实验：拟合、残差与影响度三账对照"));
    stage.appendChild(element(api, doc, "p", { className: "rd-note" }, "切换数据情境或拖动高杠杆点后，SVG 与表格会一起重算。线性拟合只是描述工具；它不把观测关联升级为因果结论。"));
    var layout = element(api, doc, "div", { className: "rd-layout" });
    var controls = element(api, doc, "section", { className: "rd-controls", "aria-labelledby": prefix + "-controls-title" });
    controls.appendChild(element(api, doc, "h4", { id: prefix + "-controls-title" }, "数据情境"));
    var scenario = element(api, doc, "select", { "aria-label": "数据情境" }, [
      element(api, doc, "option", { value: "linear" }, "近似线性：残差应无结构"),
      element(api, doc, "option", { value: "curved" }, "弯曲关系：R² 可能仍很高"),
      element(api, doc, "option", { value: "influence" }, "高杠杆点：拖动 P9")
    ]);
    controls.appendChild(element(api, doc, "div", { className: "rd-control" }, [element(api, doc, "label", {}, "情境"), scenario]));

    function rangeControl(label, key, min, max, step, digits) {
      var output = element(api, doc, "output", {}, format(state.config[key], digits));
      var input = element(api, doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
      input.addEventListener("input", function () { state.config[key] = Number(input.value); output.textContent = format(state.config[key], digits); renderResult(); });
      return element(api, doc, "div", { className: "rd-control" }, [element(api, doc, "label", {}, [label + " = ", output]), input]);
    }
    var outlierControls = element(api, doc, "div", {});
    outlierControls.appendChild(rangeControl("P9 的 x", "outlierX", 9, 18, 0.5, 1));
    outlierControls.appendChild(rangeControl("P9 的 y", "outlierY", 4, 28, 0.5, 1));
    controls.appendChild(outlierControls);
    controls.appendChild(element(api, doc, "p", { className: "rd-note" }, "杠杆 h_ii 由 x 位置决定；影响度还要看残差大小。残差是已观测 y 与拟合 ŷ 的差，误差 ε 是模型中的潜在扰动。"));
    layout.appendChild(controls);

    var stageFrame = element(api, doc, "div", { className: "rd-stage-frame" });
    var chartHost = element(api, doc, "div", {});
    var metrics = element(api, doc, "div", { className: "rd-metrics", "aria-label": "回归指标" });
    var ledger = element(api, doc, "div", { className: "rd-ledger" });
    stageFrame.appendChild(chartHost);
    stageFrame.appendChild(metrics);
    stageFrame.appendChild(ledger);
    layout.appendChild(stageFrame);
    stage.appendChild(layout);
    stage.appendChild(element(api, doc, "p", { className: "rd-caution" }, "边界读法：R² 只记录样本内平方变差分解，不能代表质量、外推能力或因果性；同方差、独立性、线性关系和合理设计决定推断是否可信，正态性主要服务于小样本精确 t 推断。"));
    root.replaceChildren(gate, stage);
    if (root.classList) root.classList.add("rd-lab");

    function renderPrediction() {
      questions.forEach(function (question) {
        question.choices.forEach(function (choice) { choice.button.setAttribute("aria-pressed", state.predictions[question.key] === choice.value ? "true" : "false"); });
      });
    }

    function syncControls() {
      scenario.value = state.config.scenario;
      controls.querySelectorAll("input[type=range]").forEach(function (input) {
        var key = input.getAttribute("aria-label") === "P9 的 x" ? "outlierX" : "outlierY";
        input.value = String(state.config[key]);
        var output = input.parentNode.querySelector("output");
        if (output) output.textContent = format(state.config[key], 1);
      });
      outlierControls.hidden = state.config.scenario !== "influence";
    }

    function renderResult() {
      if (!state.revealed) return;
      var settings = copyConfig(state.config);
      state.config = settings;
      var result = analyze(pointsFor(settings));
      replaceChildren(chartHost, chart(api, doc, result, prefix));
      replaceChildren(metrics, [
        metric(api, doc, "斜率 β̂₁", format(result.slope, 3)),
        metric(api, doc, "R²", format(result.r2, 3)),
        metric(api, doc, "SSE", format(result.sse, 3)),
        metric(api, doc, "最大杠杆", result.maxLeverage.id + "：" + format(result.maxLeverage.leverage, 3)),
        metric(api, doc, "最大 Cook D", result.maxInfluence.id + "：" + format(result.maxInfluence.cooks, 3))
      ]);
      var table = element(api, doc, "table", {});
      table.appendChild(element(api, doc, "caption", {}, PRESETS[settings.scenario].label + "；按 Cook 影响度从高到低列出诊断行。"));
      table.appendChild(element(api, doc, "thead", {}, [row(api, doc, ["点", "x", "y", "残差 e", "杠杆 h", "Cook D"]) ]));
      var ordered = result.rows.slice().sort(function (left, right) { return right.cooks - left.cooks; });
      table.appendChild(element(api, doc, "tbody", {}, ordered.map(function (item) {
        return row(api, doc, [item.id, format(item.x, 1), format(item.y, 1), format(item.residual, 3), format(item.leverage, 3), format(item.cooks, 3)]);
      })));
      replaceChildren(ledger, table);
    }

    scenario.addEventListener("change", function () { state.config.scenario = scenario.value; syncControls(); renderResult(); });
    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return state.predictions[question.key] === null; });
      if (missing.length) {
        feedback.textContent = "请先完成四个预测。";
        feedback.className = "rd-feedback rd-warn";
        return;
      }
      state.revealed = true;
      stage.hidden = false;
      syncControls();
      renderResult();
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中；现在可以拖动高杠杆点观察拟合与诊断如何分离。";
      feedback.className = "rd-feedback " + (correct === questions.length ? "rd-pass" : "rd-warn");
      announce(api, root, feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state.config = copyConfig(DEFAULTS);
      state.revealed = false;
      state.predictions = { residual: null, leverage: null, r2: null, causal: null };
      stage.hidden = true;
      feedback.textContent = "已重置；答案与诊断账本再次隐藏。";
      feedback.className = "rd-feedback";
      renderPrediction();
      syncControls();
      announce(api, root, "回归诊断预测与实验已重置。");
    });
    renderPrediction();
    syncControls();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("regression-diagnostics self-test failed: " + message);
    }
    function close(left, right, tolerance, message) {
      assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")");
    }
    var linear = analyze(pointsFor({ scenario: "linear", outlierX: 13, outlierY: 18 }));
    assert(linear.rows.length === 9, "linear dataset size");
    close(sum(linear.rows.map(function (row) { return row.residual; })), 0, 1e-10, "residuals sum to zero");
    close(sum(linear.rows.map(function (row) { return row.leverage; })), 2, 1e-10, "leverage sum equals parameter count");
    assert(linear.r2 > 0 && linear.r2 < 1, "linear R squared range");
    var curved = analyze(pointsFor({ scenario: "curved", outlierX: 13, outlierY: 18 }));
    assert(curved.r2 > 0.7, "curved example has high in-sample R squared");
    assert(curved.rows.some(function (row) { return row.residual < -0.5; }) && curved.rows.some(function (row) { return row.residual > 0.5; }), "curved residual structure");
    var influence = analyze(pointsFor({ scenario: "influence", outlierX: 18, outlierY: 18 }));
    assert(influence.maxLeverage.id === "P9", "extreme x has max leverage");
    assert(influence.maxInfluence.id === "P9", "high leverage point is influential here");
    assert(format(2, 3) === "2", "formatter removes trailing decimal point");
    var invalid = false;
    try { analyze([{ x: 0, y: 0 }, { x: 1, y: NaN }, { x: 2, y: 2 }]); } catch (error) { invalid = error instanceof RangeError; }
    assert(invalid, "nonfinite coordinates rejected");
    var moved = analyze(pointsFor({ scenario: "influence", outlierX: 9, outlierY: 18 }));
    assert(Math.abs(moved.slope - influence.slope) > 0.05, "moving leverage changes slope");
    assert(analyze(pointsFor(DEFAULTS)).sse >= 0, "SSE nonnegative");
    var threw = false;
    try { analyze([{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }]); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "constant x rejected");
    threw = false;
    try { analyze([{ x: 1, y: 1 }, { x: 2, y: 2 }]); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "too few points rejected");
    assert(copyConfig({ scenario: "missing", outlierX: 100, outlierY: -2 }).scenario === "curved", "config scenario fallback");
    assert(copyConfig({ scenario: "influence", outlierX: 100, outlierY: -2 }).outlierX === 18, "outlier x clamp");
    return { checks: checks };
  }

  return {
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    pointsFor: pointsFor,
    analyze: analyze,
    selfTest: selfTest,
    mount: mount
  };
});
