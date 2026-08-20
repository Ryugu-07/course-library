(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("banach-contraction", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("banach-contraction self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("banach-contraction self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-banach-contraction-styles";
  var SERIAL = 0;
  var DEFAULTS = { q: 0.6, b: 1, x0: 0, steps: 12, domain: "real" };
  var PRESETS = [
    { id: "certificate", label: "全局证书：R", q: 0.6, b: 1, x0: 0, steps: 12, domain: "real" },
    { id: "closed", label: "闭域证书：[0,1]", q: 0.5, b: 0.25, x0: 0, steps: 10, domain: "closed" },
    { id: "escape", label: "不变域失败", q: 0.6, b: 0.8, x0: 0.9, steps: 8, domain: "closed" },
    { id: "incomplete", label: "开区间不完备", q: 0.5, b: 0, x0: 0.5, steps: 12, domain: "open" },
    { id: "noncontractive", label: "非压缩：|q|>1", q: 1.1, b: 0, x0: 1, steps: 8, domain: "real" }
  ];
  var DOMAIN_LABELS = {
    real: "R",
    closed: "[0,1]",
    open: "(0,1)"
  };
  var STYLE_TEXT = [
    ".bc-lab{--bc-blue:var(--cl-blue,#315f9d);--bc-gold:var(--cl-gold,#9b6a12);--bc-green:var(--cl-green,#39734d);--bc-red:var(--cl-red,#b64335);--bc-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    "html[data-theme=\"dark\"] .bc-lab{--bc-blue:#83c8ff;--bc-gold:#e2b458;--bc-green:#72bd8b;--bc-red:#f08c7d;--bc-soft:#b8b2a7;}",
    ".bc-lab *,.bc-lab *::before,.bc-lab *::after{box-sizing:border-box;}.bc-lab [hidden]{display:none!important;}",
    ".bc-lab h3,.bc-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.bc-lab h3{font-size:1.18rem;}.bc-lab h4{font-size:1rem;}",
    ".bc-lab .bc-intro,.bc-lab .bc-note,.bc-lab .bc-feedback{color:var(--bc-soft);font-size:13px;line-height:1.7;}",
    ".bc-lab .bc-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--bc-gold);background:var(--bg);}.bc-lab fieldset{min-width:0;margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.bc-lab legend{max-width:100%;padding:0 4px;color:var(--bc-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere;}",
    ".bc-lab .bc-choice-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}.bc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.bc-lab button:hover{border-color:var(--accent);}.bc-lab button[aria-pressed=\"true\"],.bc-lab button.bc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.bc-lab button:disabled{cursor:not-allowed;opacity:.55;}.bc-lab button:focus-visible,.bc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".bc-lab .bc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.bc-lab .bc-actions>*{flex:1 1 170px;}.bc-lab .bc-feedback{min-height:2em;margin:8px 0;font-weight:700;}.bc-lab .bc-pass{color:var(--bc-green);}.bc-lab .bc-warn{color:var(--bc-red);}",
    ".bc-lab .bc-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.bc-lab .bc-presets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:11px 0;}.bc-lab .bc-presets button{font-size:12px;}.bc-lab .bc-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 16px;margin:12px 0;}.bc-lab .bc-control{display:grid;gap:5px;min-width:0;}.bc-lab .bc-control label{color:var(--bc-soft);font-size:13px;font-weight:700;}.bc-lab output{color:var(--accent);font-variant-numeric:tabular-nums;}.bc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.bc-lab .bc-domain{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.bc-lab .bc-domain-label{grid-column:1/-1;color:var(--bc-soft);font-size:13px;font-weight:700;}",
    ".bc-lab .bc-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0;}.bc-lab .bc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.bc-lab .bc-metric:nth-child(1),.bc-lab .bc-metric:nth-child(4){border-top-color:var(--bc-blue);}.bc-lab .bc-metric:nth-child(2),.bc-lab .bc-metric:nth-child(5){border-top-color:var(--bc-gold);}.bc-lab .bc-metric:nth-child(3),.bc-lab .bc-metric:nth-child(6){border-top-color:var(--bc-green);}.bc-lab .bc-metric span{display:block;color:var(--bc-soft);font-size:11.5px;line-height:1.4;}.bc-lab .bc-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums;}",
    ".bc-lab .bc-chart{min-width:0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch;}.bc-lab svg{display:block;width:100%;height:auto;min-width:650px;color:var(--fg);}.bc-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.bc-lab .bc-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.7;}.bc-lab .bc-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.bc-lab .bc-trajectory{fill:none;stroke:var(--bc-blue);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}.bc-lab .bc-fixed{stroke:var(--bc-gold);stroke-width:1.6;stroke-dasharray:5 4;}.bc-lab .bc-prior{fill:none;stroke:var(--bc-red);stroke-width:2;stroke-dasharray:6 4;}.bc-lab .bc-posterior{fill:none;stroke:var(--bc-green);stroke-width:2;stroke-dasharray:2 4;}.bc-lab .bc-point{fill:var(--bc-blue);stroke:var(--bg);stroke-width:1.5;}.bc-lab .bc-chart-title{font-size:13px;font-weight:750;}.bc-lab .bc-chart-label{font-size:11px;}",
    ".bc-lab .bc-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.bc-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.bc-lab caption{padding:0 0 7px;text-align:left;color:var(--bc-soft);font-size:12px;line-height:1.55;}.bc-lab th,.bc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap;}.bc-lab th{color:var(--bc-soft);font-size:11.5px;font-weight:750;}.bc-lab .bc-good{color:var(--bc-green);font-weight:750;}.bc-lab .bc-bad{color:var(--bc-red);font-weight:750;}.bc-lab .bc-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--bc-green);background:var(--bg);font-size:13px;line-height:1.7;}",
    "@media(max-width:980px){.bc-lab .bc-presets{grid-template-columns:repeat(3,minmax(0,1fr));}.bc-lab .bc-controls{grid-template-columns:repeat(2,minmax(0,1fr));}.bc-lab .bc-metrics{grid-template-columns:repeat(3,minmax(0,1fr));}}",
    "@media(max-width:650px){.bc-lab .bc-choice-row,.bc-lab .bc-domain{grid-template-columns:minmax(0,1fr);}.bc-lab .bc-presets,.bc-lab .bc-controls,.bc-lab .bc-metrics{grid-template-columns:minmax(0,1fr);}.bc-lab .bc-chart{padding:5px;}}",
    "@media(prefers-reduced-motion:reduce){.bc-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function number(value, fallback) {
    if (value === null || value === "") return fallback;
    var parsed = Number(value);
    return finite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeDomain(value) {
    return DOMAIN_LABELS[value] ? value : DEFAULTS.domain;
  }

  function normalizeConfig(input) {
    var source = input || {};
    return {
      q: clamp(number(source.q, DEFAULTS.q), -1.3, 1.3),
      b: clamp(number(source.b, DEFAULTS.b), -2, 2),
      x0: clamp(number(source.x0, DEFAULTS.x0), -3, 3),
      steps: Math.round(clamp(number(source.steps, DEFAULTS.steps), 1, 24)),
      domain: normalizeDomain(source.domain)
    };
  }

  function copyConfig(config) {
    return {
      q: config.q,
      b: config.b,
      x0: config.x0,
      steps: config.steps,
      domain: config.domain
    };
  }

  function domainContains(domain, value) {
    if (!finite(value)) return false;
    if (domain === "real") return true;
    if (domain === "closed") return value >= 0 && value <= 1;
    return value > 0 && value < 1;
  }

  function domainComplete(domain) {
    return domain !== "open";
  }

  function imageOfInterval(config) {
    if (config.domain === "real") return { min: -Infinity, max: Infinity };
    var left = config.q * 0 + config.b;
    var right = config.q * 1 + config.b;
    return { min: Math.min(left, right), max: Math.max(left, right) };
  }

  function invariantOnDomain(config) {
    if (config.domain === "real") return true;
    var image = imageOfInterval(config);
    if (config.domain === "closed") return image.min >= 0 && image.max <= 1;
    // For q != 0, open endpoints are infimum/supremum and are not attained.
    if (config.q === 0) return image.min > 0 && image.max < 1;
    return image.min >= 0 && image.max <= 1;
  }

  function fixedPoint(q, b) {
    return q === 1 ? null : b / (1 - q);
  }

  function classify(result) {
    if (!result.globalContraction) return "non-contract";
    if (!result.complete) return "incomplete";
    if (!result.invariant) return "escape";
    if (!result.fixedPointInDomain) return "outside";
    return "certified";
  }

  function compute(input) {
    var config = normalizeConfig(input);
    var qAbs = Math.abs(config.q);
    var contraction = qAbs < 1;
    var complete = domainComplete(config.domain);
    var invariant = invariantOnDomain(config);
    var point = fixedPoint(config.q, config.b);
    var pointInDomain = point !== null && domainContains(config.domain, point);
    var x1 = config.q * config.x0 + config.b;
    var rows = [];
    var current = config.x0;
    var previous = null;
    var escapedAt = domainContains(config.domain, current) ? null : 0;
    var index;
    for (index = 0; index <= config.steps; index += 1) {
      rows.push({
        n: index,
        x: current,
        actualError: point === null ? null : Math.abs(current - point),
        residual: Math.abs(config.q * current + config.b - current),
        aPriori: contraction ? Math.pow(qAbs, index) * Math.abs(x1 - config.x0) / (1 - qAbs) : null,
        aPosteriori: contraction && previous !== null
          ? qAbs * Math.abs(current - previous) / (1 - qAbs)
          : null,
        inside: domainContains(config.domain, current)
      });
      if (index === config.steps) break;
      previous = current;
      current = config.q * current + config.b;
      if (escapedAt === null && !domainContains(config.domain, current)) escapedAt = index + 1;
    }
    var result = {
      config: config,
      qAbs: qAbs,
      complete: complete,
      invariant: invariant,
      globalContraction: contraction,
      fixedPoint: point,
      fixedPointInDomain: pointInDomain,
      certificate: complete && invariant && contraction && pointInDomain,
      escapedAt: escapedAt,
      rows: rows
    };
    result.classification = classify(result);
    result.boundsCertified = result.certificate;
    return result;
  }

  function predictionAnswers(result) {
    return {
      certificate: result.certificate ? "certified" : "not-certified",
      failure: result.certificate ? "none" : result.classification,
      bounds: result.certificate ? "certified" : "formal"
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(value)) return "∞";
    var places = digits === undefined ? 4 : digits;
    var absolute = Math.abs(value);
    if (absolute > 0 && (absolute < 0.001 || absolute >= 10000)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function makeElement(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = value;
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, value);
    });
    appendChildren(node, children, doc);
    return node;
  }

  function makeSvg(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (key === "className") key = "class";
      if (value !== undefined && value !== null) node.setAttribute(key, value);
    });
    appendChildren(node, children, doc);
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

  function svgText(api, doc, x, y, text, attrs) {
    var merged = { x: x, y: y, className: "bc-chart-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, doc, "text", merged, text);
  }

  function linePath(points, x, y, field) {
    return points.filter(function (point) { return finite(point[field]); }).map(function (point, index, filtered) {
      return (index ? "L" : "M") + x(point.n).toFixed(2) + " " + y(point[field]).toFixed(2);
    }).join(" ");
  }

  function drawChart(api, doc, svg, result, uid) {
    clear(svg);
    var width = 760;
    var height = 350;
    var left = 58;
    var right = 20;
    var top = 34;
    var bottom = 48;
    var plotRight = width - right;
    var plotBottom = height - bottom;
    var allValues = [];
    result.rows.forEach(function (row) {
      ["x", "actualError", "aPriori", "aPosteriori"].forEach(function (field) {
        if (finite(row[field])) allValues.push(row[field]);
      });
    });
    if (finite(result.fixedPoint)) allValues.push(result.fixedPoint);
    var yMin = allValues.length ? Math.min.apply(null, allValues) : -1;
    var yMax = allValues.length ? Math.max.apply(null, allValues) : 1;
    if (yMax === yMin) { yMax += 1; yMin -= 1; }
    var padding = Math.max(0.08, (yMax - yMin) * 0.12);
    yMin -= padding;
    yMax += padding;
    function x(value) {
      return left + (result.config.steps ? value / result.config.steps : 0.5) * (plotRight - left);
    }
    function y(value) {
      return plotBottom - (value - yMin) / (yMax - yMin) * (plotBottom - top);
    }
    svg.appendChild(makeSvg(api, doc, "title", { id: uid + "-chart-title" }, "Banach 迭代、实际误差和先验后验界"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: uid + "-chart-desc" }, "蓝线是迭代点，金色虚线是代数固定点，红绿虚线是误差界；界只有在三张证书齐全时才有定理意义。"));
    [0, 0.5, 1].forEach(function (fraction) {
      var value = yMin + fraction * (yMax - yMin);
      svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: y(value), x2: plotRight, y2: y(value), className: fraction === 0 ? "bc-axis" : "bc-grid" }));
      svg.appendChild(svgText(api, doc, left - 8, y(value) + 4, format(value, 2), { "text-anchor": "end" }));
    });
    [0, Math.round(result.config.steps / 2), result.config.steps].forEach(function (tick) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: x(tick), y1: top, x2: x(tick), y2: plotBottom, className: "bc-grid" }));
      svg.appendChild(svgText(api, doc, x(tick), plotBottom + 18, String(tick), { "text-anchor": "middle" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "bc-axis" }));
    svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: top, x2: left, y2: plotBottom, className: "bc-axis" }));
    if (finite(result.fixedPoint)) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: y(result.fixedPoint), x2: plotRight, y2: y(result.fixedPoint), className: "bc-fixed" }));
    }
    svg.appendChild(makeSvg(api, doc, "path", { d: linePath(result.rows, x, y, "x"), className: "bc-trajectory" }));
    svg.appendChild(makeSvg(api, doc, "path", { d: linePath(result.rows, x, y, "actualError"), className: "bc-point" }));
    svg.appendChild(makeSvg(api, doc, "path", { d: linePath(result.rows, x, y, "aPriori"), className: "bc-prior" }));
    svg.appendChild(makeSvg(api, doc, "path", { d: linePath(result.rows, x, y, "aPosteriori"), className: "bc-posterior" }));
    result.rows.forEach(function (row) {
      if (finite(row.x)) svg.appendChild(makeSvg(api, doc, "circle", { cx: x(row.n), cy: y(row.x), r: 3.5, className: "bc-point" }));
    });
    svg.appendChild(svgText(api, doc, left, 18, "x_n 与误差界", { className: "bc-chart-title" }));
    svg.appendChild(svgText(api, doc, plotRight, 18, "蓝：x_n　金：x*　红：先验　绿：后验", { "text-anchor": "end" }));
    svg.appendChild(svgText(api, doc, (left + plotRight) / 2, height - 10, "迭代次数 n", { "text-anchor": "middle" }));
    return svg;
  }

  function metric(api, doc, label, value) {
    return makeElement(api, doc, "div", { className: "bc-metric" }, [
      makeElement(api, doc, "span", { text: label }),
      makeElement(api, doc, "strong", { text: value })
    ]);
  }

  function table(api, doc, result) {
    var tableNode = makeElement(api, doc, "table", {});
    tableNode.appendChild(makeElement(api, doc, "caption", {}, "逐步透明账本：界的数字与定理资格分栏读取。"));
    tableNode.appendChild(makeElement(api, doc, "thead", {}, makeElement(api, doc, "tr", {}, [
      makeElement(api, doc, "th", {}, "n"),
      makeElement(api, doc, "th", {}, "x_n"),
      makeElement(api, doc, "th", {}, "实际误差"),
      makeElement(api, doc, "th", {}, "先验界"),
      makeElement(api, doc, "th", {}, "后验界"),
      makeElement(api, doc, "th", {}, "在 D 内")
    ])));
    var body = makeElement(api, doc, "tbody", {});
    result.rows.forEach(function (row) {
      body.appendChild(makeElement(api, doc, "tr", {}, [
        makeElement(api, doc, "td", {}, String(row.n)),
        makeElement(api, doc, "td", {}, format(row.x, 6)),
        makeElement(api, doc, "td", {}, format(row.actualError, 6)),
        makeElement(api, doc, "td", {}, format(row.aPriori, 6)),
        makeElement(api, doc, "td", {}, format(row.aPosteriori, 6)),
        makeElement(api, doc, "td", { className: row.inside ? "bc-good" : "bc-bad" }, row.inside ? "是" : "否")
      ]));
    });
    tableNode.appendChild(body);
    return tableNode;
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    installStyles(doc);
    clear(root);
    root.className = "bc-lab";
    var uid = "bc-" + (++SERIAL);
    var state = {
      config: copyConfig(DEFAULTS),
      revealed: false,
      predictions: { certificate: null, failure: null, bounds: null }
    };
    var questions = [
      {
        key: "certificate",
        title: "当前三张证书齐全吗？",
        choices: [
          ["certified", "齐全，可套 Banach"],
          ["not-certified", "至少一张失效"]
        ]
      },
      {
        key: "failure",
        title: "若不能套定理，主要边界是什么？",
        choices: [
          ["none", "没有边界"],
          ["escape", "不变域失败"],
          ["incomplete", "定义域不完备"],
          ["non-contract", "没有全局压缩"]
        ]
      },
      {
        key: "bounds",
        title: "图中的误差界应怎样解释？",
        choices: [
          ["certified", "三证书齐全时是定理界"],
          ["formal", "无证书时只能形式诊断"]
        ]
      }
    ];
    var shell = makeElement(api, doc, "div", {});
    shell.appendChild(makeElement(api, doc, "h3", { text: "Banach 迭代：三张资格证与两种误差界" }));
    shell.appendChild(makeElement(api, doc, "p", { className: "bc-intro", text: "先判断定义域、压缩量词和误差口径；结果区会把实际误差、先验界与后验界逐行公开。" }));
    var form = makeElement(api, doc, "form", { className: "bc-gate", "aria-labelledby": uid + "-gate-title" });
    form.appendChild(makeElement(api, doc, "strong", { id: uid + "-gate-title", text: "预测门：先写下你的证书判决" }));
    var choiceNodes = [];
    questions.forEach(function (question) {
      var field = makeElement(api, doc, "fieldset", {});
      field.appendChild(makeElement(api, doc, "legend", {}, question.title));
      var row = makeElement(api, doc, "div", { className: "bc-choice-row" });
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice[0];
          choiceNodes.forEach(function (item) {
            if (item.key === question.key) item.button.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false");
          });
          feedback.className = "bc-feedback";
          feedback.textContent = "预测已记录；三项都选好后揭示账本。";
        });
        choiceNodes.push({ key: question.key, value: choice[0], button: button });
        row.appendChild(button);
      });
      field.appendChild(row);
      form.appendChild(field);
    });
    var actions = makeElement(api, doc, "div", { className: "bc-actions" });
    var reveal = makeElement(api, doc, "button", { type: "submit", className: "bc-primary" }, "提交预测并揭示");
    var reset = makeElement(api, doc, "button", { type: "button" }, "重置预测");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    form.appendChild(actions);
    var feedback = makeElement(api, doc, "p", { className: "bc-feedback", "aria-live": "polite" }, "结果、轨迹和账本在揭示前保持隐藏。");
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = makeElement(api, doc, "section", { className: "bc-revealed", hidden: "hidden", "aria-labelledby": uid + "-result-title" });
    revealed.appendChild(makeElement(api, doc, "h3", { id: uid + "-result-title", text: "结果账本：实际误差不等于保证本身" }));
    var presetWrap = makeElement(api, doc, "div", { className: "bc-presets" });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { type: "button" }, preset.label);
      button.addEventListener("click", function () {
        state.config = copyConfig(preset);
        syncControls();
        renderResult();
      });
      presetWrap.appendChild(button);
    });
    revealed.appendChild(presetWrap);
    var controls = makeElement(api, doc, "div", { className: "bc-controls" });
    var controlInputs = {};
    function addRange(key, label, min, max, step) {
      var input = makeElement(api, doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      var output = makeElement(api, doc, "output", { "data-control-output": key }, format(state.config[key], key === "steps" ? 0 : 2));
      var field = makeElement(api, doc, "div", { className: "bc-control" }, [
        makeElement(api, doc, "label", {}, [label, " ", output]),
        input
      ]);
      input.addEventListener("input", function () {
        state.config[key] = key === "steps" ? Math.round(Number(input.value)) : Number(input.value);
        output.textContent = format(state.config[key], key === "steps" ? 0 : 2);
        renderResult();
      });
      controlInputs[key] = { input: input, output: output };
      controls.appendChild(field);
    }
    addRange("q", "q", -1.3, 1.3, 0.05);
    addRange("b", "b", -2, 2, 0.05);
    addRange("x0", "x₀", -3, 3, 0.05);
    addRange("steps", "步数", 1, 24, 1);
    var domain = makeElement(api, doc, "div", { className: "bc-domain" });
    domain.appendChild(makeElement(api, doc, "span", { className: "bc-domain-label", text: "定义域" }));
    Object.keys(DOMAIN_LABELS).forEach(function (key) {
      var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, DOMAIN_LABELS[key]);
      button.addEventListener("click", function () {
        state.config.domain = key;
        syncControls();
        renderResult();
      });
      domain.appendChild(button);
      controlInputs.domain = controlInputs.domain || [];
      controlInputs.domain.push({ key: key, button: button });
    });
    controls.appendChild(domain);
    revealed.appendChild(controls);
    var metricsNode = makeElement(api, doc, "div", { className: "bc-metrics" });
    var chartWrap = makeElement(api, doc, "div", { className: "bc-chart" });
    var chart = makeSvg(api, doc, "svg", { viewBox: "0 0 760 350", role: "img", "aria-labelledby": uid + "-chart-title " + uid + "-chart-desc" });
    chartWrap.appendChild(chart);
    var ledgerWrap = makeElement(api, doc, "div", { className: "bc-ledger" });
    var interpretation = makeElement(api, doc, "p", { className: "bc-interpretation" });
    revealed.appendChild(metricsNode);
    revealed.appendChild(chartWrap);
    revealed.appendChild(ledgerWrap);
    revealed.appendChild(interpretation);
    shell.appendChild(revealed);
    root.appendChild(shell);

    function syncControls() {
      ["q", "b", "x0", "steps"].forEach(function (key) {
        controlInputs[key].input.value = state.config[key];
        controlInputs[key].output.textContent = format(state.config[key], key === "steps" ? 0 : 2);
      });
      (controlInputs.domain || []).forEach(function (item) {
        item.button.setAttribute("aria-pressed", item.key === state.config.domain ? "true" : "false");
      });
    }

    function renderResult() {
      var result = compute(state.config);
      metricsNode.replaceChildren(
        metric(api, doc, "定义域", DOMAIN_LABELS[result.config.domain]),
        metric(api, doc, "q / |q|", format(result.config.q, 2) + " / " + format(result.qAbs, 2)),
        metric(api, doc, "固定点", format(result.fixedPoint, 5)),
        metric(api, doc, "完备 / 不变", (result.complete ? "是" : "否") + " / " + (result.invariant ? "是" : "否")),
        metric(api, doc, "全局压缩", result.globalContraction ? "是" : "否"),
        metric(api, doc, "证书判决", result.certificate ? "可套定理" : "不可套定理")
      );
      drawChart(api, doc, chart, result, uid);
      clear(ledgerWrap);
      ledgerWrap.appendChild(table(api, doc, result));
      var note;
      if (result.certificate) {
        note = "三张证书齐全：实际误差应落在先验界与后验界之下；它们分别使用初始步长和最近一步。";
      } else if (result.classification === "escape") {
        note = "q 仍小于 1，但 T(D) 不在 D 内；轨迹一旦逃出，D 上的 Banach 证书就停止适用。";
      } else if (result.classification === "incomplete") {
        note = "这是压缩自映射落在不完备空间的反例：Cauchy 极限可能掉出定义域。";
      } else {
        note = "当前实际数值仍可计算，但缺少全局压缩/完备/不变域证书，界只作形式诊断。";
      }
      interpretation.textContent = note;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return state.predictions[question.key] === null; });
      if (missing.length) {
        feedback.className = "bc-feedback bc-warn";
        feedback.textContent = "还缺 " + missing.length + " 项预测；揭示前不显示结果。";
        return;
      }
      var answer = predictionAnswers(compute(state.config));
      var correct = questions.filter(function (question) {
        return state.predictions[question.key] === answer[question.key];
      }).length;
      state.revealed = true;
      revealed.removeAttribute("hidden");
      reveal.disabled = true;
      feedback.className = correct === questions.length ? "bc-feedback bc-pass" : "bc-feedback";
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项预测命中。";
      renderResult();
      announce(api, root, feedback.textContent);
    });

    reset.addEventListener("click", function () {
      state.config = copyConfig(DEFAULTS);
      state.revealed = false;
      state.predictions = { certificate: null, failure: null, bounds: null };
      choiceNodes.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); });
      reveal.disabled = false;
      revealed.setAttribute("hidden", "hidden");
      feedback.className = "bc-feedback";
      feedback.textContent = "结果、轨迹和账本在揭示前保持隐藏。";
      syncControls();
    });
    syncControls();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var base = compute(DEFAULTS);
    assert(base.fixedPoint === 2.5, "default fixed point");
    assert(base.complete && base.invariant && base.globalContraction && base.certificate, "default certificate");
    assert(base.rows[1].x === 1, "first iterate");
    base.rows.forEach(function (row) {
      if (row.aPriori !== null && row.actualError !== null) assert(row.actualError <= row.aPriori + 1e-10, "a priori bound");
      if (row.aPosteriori !== null && row.actualError !== null) assert(row.actualError <= row.aPosteriori + 1e-10, "a posteriori bound");
    });
    var closed = compute({ q: 0.5, b: 0.25, x0: 0, steps: 8, domain: "closed" });
    assert(closed.certificate && closed.fixedPoint === 0.5, "closed interval certificate");
    var escape = compute({ q: 0.6, b: 0.8, x0: 0.9, steps: 3, domain: "closed" });
    assert(escape.globalContraction && !escape.invariant && escape.escapedAt === 1, "invariant-domain counterexample");
    assert(escape.fixedPoint === 2 && !escape.fixedPointInDomain, "escaped fixed point");
    var incomplete = compute({ q: 0.5, b: 0, x0: 0.5, steps: 12, domain: "open" });
    assert(!incomplete.complete && incomplete.invariant && !incomplete.certificate, "incomplete-space counterexample");
    assert(incomplete.rows[12].x > 0 && incomplete.rows[12].x < incomplete.rows[0].x, "open interval trajectory");
    var noncontractive = compute({ q: 1.1, b: 0, x0: 1, steps: 5, domain: "real" });
    assert(!noncontractive.globalContraction && noncontractive.classification === "non-contract", "non-contraction counterexample");
    assert(noncontractive.rows[5].x > noncontractive.rows[0].x, "non-contractive growth");
    var deterministicA = compute({ q: -0.4, b: 0.7, x0: 0.2, steps: 7, domain: "real" });
    var deterministicB = compute({ q: -0.4, b: 0.7, x0: 0.2, steps: 7, domain: "real" });
    assert(JSON.stringify(deterministicA) === JSON.stringify(deterministicB), "deterministic model");
    assert(predictionAnswers(base).failure === "none", "prediction answer");
    assert(predictionAnswers(escape).failure === "escape", "escape answer");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    compute: compute,
    classify: classify,
    predictionAnswers: predictionAnswers,
    selfTest: selfTest,
    mount: mount
  };
});
