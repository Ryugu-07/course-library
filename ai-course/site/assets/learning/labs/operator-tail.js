(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("operator-tail", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("operator-tail self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("operator-tail self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var PI = Math.PI;
  var MAX_N = 64;
  var STYLE_ID = "cl-operator-tail-styles";
  var SERIAL = 0;
  var DEFAULTS = { operator: "decay", N: 8 };

  var PRESETS = [
    { id: "decay", label: "衰减对角 D↓", shortLabel: "衰减对角", description: "aₙ=1/n：尾部趋零，给出紧性证书。" },
    { id: "flat", label: "尾部不衰减 I", shortLabel: "不衰减对角", description: "aₙ=1：有界，但任何截断都留下单位尾误差。" },
    { id: "shift", label: "单边移位 Sₙ", shortLabel: "有限截断移位", description: "S eₙ=eₙ₊₁；有限 S_N 是幂零，却不逼近无限移位。" }
  ];

  var STYLE_TEXT = [
    ".ot-lab{--ot-blue:var(--cl-blue,#315f9d);--ot-red:var(--cl-red,#b64335);--ot-gold:var(--cl-gold,#9b6a12);--ot-green:var(--cl-green,#39734d);color:var(--fg);line-height:1.55;min-width:0;overflow-wrap:anywhere;}",
    "html[data-theme=dark] .ot-lab{--ot-blue:#83c8ff;--ot-red:#f08c7d;--ot-gold:#e2b458;--ot-green:#72bd8b;}",
    ".ot-lab *,.ot-lab *::before,.ot-lab *::after{box-sizing:border-box}.ot-lab [hidden]{display:none!important}",
    ".ot-lab h3,.ot-lab h4{margin:0;color:var(--fg);letter-spacing:0}.ot-lab h3{font-size:1.18rem}.ot-lab h4{margin-top:15px;font-size:1rem}",
    ".ot-lab .ot-intro,.ot-lab .ot-note,.ot-lab .ot-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}",
    ".ot-lab .ot-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--ot-gold);background:var(--bg)}.ot-lab .ot-prediction>strong{display:block;margin-bottom:9px}",
    ".ot-lab fieldset{min-width:0;margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.ot-lab legend{max-width:100%;padding:0 4px;color:var(--fg-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere}",
    ".ot-lab .ot-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ot-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ot-lab button:hover{border-color:var(--accent)}.ot-lab button[aria-pressed=true],.ot-lab button.ot-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.ot-lab button:focus-visible,.ot-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".ot-lab .ot-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.ot-lab .ot-actions>*{flex:1 1 170px}.ot-lab .ot-feedback{min-height:2em;margin:8px 0;font-weight:700}.ot-lab .ot-pass{color:var(--ot-green)}.ot-lab .ot-warn{color:var(--ot-red)}",
    ".ot-lab .ot-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.ot-lab .ot-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:11px 0}.ot-lab .ot-presets button{font-size:12px}.ot-lab .ot-control{display:grid;gap:5px;max-width:360px;margin:10px 0 14px}.ot-lab .ot-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.ot-lab output{color:var(--accent);font-variant-numeric:tabular-nums}.ot-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".ot-lab .ot-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}.ot-lab .ot-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ot-lab .ot-metric:nth-child(1),.ot-lab .ot-metric:nth-child(4){border-top-color:var(--ot-blue)}.ot-lab .ot-metric:nth-child(2),.ot-lab .ot-metric:nth-child(5){border-top-color:var(--ot-gold)}.ot-lab .ot-metric:nth-child(3){border-top-color:var(--ot-green)}.ot-lab .ot-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.ot-lab .ot-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}",
    ".ot-lab .ot-charts{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:start}.ot-lab .ot-chart{min-width:0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.ot-lab svg{display:block;width:100%;height:auto;min-width:520px;color:var(--fg)}.ot-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ot-lab .ot-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.75}.ot-lab .ot-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7}.ot-lab .ot-zero{stroke:var(--ot-gold);stroke-width:1.4;stroke-dasharray:5 4}.ot-lab .ot-decay{stroke:var(--ot-blue);fill:none;stroke-width:3}.ot-lab .ot-flat{stroke:var(--ot-red);fill:none;stroke-width:2.5}.ot-lab .ot-shift{stroke:var(--ot-green);fill:none;stroke-width:2.5}.ot-lab .ot-selected{stroke-width:4}.ot-lab .ot-spectrum-full{fill:var(--ot-blue);stroke:var(--bg);stroke-width:1}.ot-lab .ot-spectrum-finite{fill:var(--ot-red);stroke:var(--bg);stroke-width:1}.ot-lab .ot-spectrum-boundary{fill:none;stroke:var(--ot-green);stroke-width:2;stroke-dasharray:5 4}.ot-lab .ot-chart-label{font-size:11px}.ot-lab .ot-chart-title{font-size:13px;font-weight:750}",
    ".ot-lab .ot-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch}.ot-lab table{width:100%;min-width:780px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ot-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.ot-lab th,.ot-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.ot-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.ot-lab .ot-good{color:var(--ot-green);font-weight:750}.ot-lab .ot-bad{color:var(--ot-red);font-weight:750}.ot-lab .ot-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--ot-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:900px){.ot-lab .ot-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.ot-lab .ot-charts{grid-template-columns:minmax(0,1fr)}}",
    "@media(max-width:650px){.ot-lab .ot-presets,.ot-lab .ot-choice-row{grid-template-columns:minmax(0,1fr)}.ot-lab .ot-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.ot-lab .ot-chart{padding:5px}}",
    "@media(prefers-reduced-motion:reduce){.ot-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return finite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function format(value, digits) {
    var places = digits === undefined ? 4 : digits;
    if (!finite(value)) return "—";
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function operatorById(id) {
    return PRESETS.filter(function (item) { return item.id === id; })[0] || PRESETS[0];
  }

  function normalizeParams(input) {
    var source = input || {};
    var id = source.operator === undefined ? source.id : source.operator;
    var rawN = source.N === undefined ? DEFAULTS.N : number(source.N, DEFAULTS.N);
    return {
      operator: operatorById(id).id,
      N: clamp(Math.round(rawN), 1, MAX_N)
    };
  }

  function diagonalCoefficient(operator, index) {
    if (!finite(index) || index < 1) return 0;
    if (operator === "decay") return 1 / index;
    if (operator === "flat") return 1;
    return 0;
  }

  function operatorNorm(operator) {
    return operator === "shift" ? 1 : Math.abs(diagonalCoefficient(operator, 1));
  }

  function tailCertificate(operator, N) {
    if (operator === "decay") return 1 / (N + 1);
    return 1;
  }

  function finiteRank(operator, N) {
    return operator === "shift" ? Math.max(0, N - 1) : N;
  }

  function finiteSpectrum(operator, N) {
    var values = [];
    var index;
    for (index = 1; index <= N; index += 1) {
      values.push(operator === "decay" ? 1 / index : operator === "flat" ? 1 : 0);
    }
    return values;
  }

  function spectrumSummary(operator) {
    if (operator === "decay") {
      return {
        full: "{0} ∪ {1/n : n≥1}",
        approximate: "同一闭包（0 由 eₙ 给出近似谱）",
        finite: "{1, 1/2, …, 1/N}（N×N 对角截面）",
        kind: "decay"
      };
    }
    if (operator === "flat") {
      return {
        full: "{1}",
        approximate: "{1}",
        finite: "{1}（重数 N）",
        kind: "flat"
      };
    }
    return {
      full: "闭单位圆盘 {|λ|≤1}",
      approximate: "单位圆周 {|λ|=1}（无特征值）",
      finite: "{0}（S_N 幂零）",
      kind: "shift"
    };
  }

  function tailRows() {
    var rows = [];
    var values = [1, 2, 4, 8, 16, 32, 64];
    values.forEach(function (N) {
      rows.push({
        N: N,
        decay: tailCertificate("decay", N),
        flat: tailCertificate("flat", N),
        shift: tailCertificate("shift", N)
      });
    });
    return rows;
  }

  function evaluate(input) {
    var params = normalizeParams(input);
    var spectrum = spectrumSummary(params.operator);
    var tail = tailCertificate(params.operator, params.N);
    var finiteValues = finiteSpectrum(params.operator, params.N);
    return {
      params: params,
      preset: operatorById(params.operator),
      norm: operatorNorm(params.operator),
      finiteRank: finiteRank(params.operator, params.N),
      finiteError: tail,
      tailCertificate: tail,
      analyticTailToZero: params.operator === "decay",
      compact: params.operator === "decay",
      fullSpectrum: spectrum.full,
      approximateSpectrum: spectrum.approximate,
      finiteSpectrum: spectrum.finite,
      finiteSpectrumValues: finiteValues,
      spectrumKind: spectrum.kind,
      rows: tailRows(),
      ledger: [
        { label: "解析尾证书", value: tail, interpretation: params.operator === "decay" ? "随 N→∞ 归零" : "不会归零" },
        { label: "有限秩截断误差", value: tail, interpretation: "只对当前 N 的数值截断负责" },
        { label: "无限维紧性", value: params.operator === "decay" ? 1 : 0, interpretation: params.operator === "decay" ? "有解析尾界" : "尾部反例阻断" }
      ]
    };
  }

  function predictionAnswers(operator) {
    return {
      tail: operator === "decay" ? "zero" : "one",
      compact: operator === "decay" ? "compact" : "not-compact",
      spectrum: operator === "shift" ? "disk" : operator === "flat" ? "point" : "accumulation"
    };
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
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
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function makeElement(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children, doc);
  }

  function makeSvg(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children, doc);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
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
    var merged = { x: x, y: y, className: "ot-chart-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, doc, "text", merged, text);
  }

  function mapLinear(value, min, max, start, end) {
    if (max === min) return (start + end) / 2;
    return start + (value - min) / (max - min) * (end - start);
  }

  function pathFor(points, mapX, mapY) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + mapX(point.x).toFixed(2) + " " + mapY(point.y).toFixed(2);
    }).join(" ");
  }

  function tailSvg(api, doc, result, uid) {
    var width = 700, height = 320, left = 50, right = 18, top = 32, bottom = 46;
    var plotRight = width - right, plotBottom = height - bottom;
    var svg = makeSvg(api, doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-labelledby": uid + "-tail-title " + uid + "-tail-desc" });
    svg.appendChild(makeSvg(api, doc, "title", { id: uid + "-tail-title" }, "三种算子截断误差的解析尾界"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: uid + "-tail-desc" }, "衰减对角的尾界随截断阶数趋零，不衰减对角与单边移位保持为一。"));
    var x = function (value) { return mapLinear(Math.log(value) / Math.log(2), 0, 6, left, plotRight); };
    var y = function (value) { return mapLinear(value, 0, 1.05, plotBottom, top); };
    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: y(tick), x2: plotRight, y2: y(tick), className: tick === 0 ? "ot-axis" : "ot-grid" }));
      svg.appendChild(svgText(api, doc, left - 8, y(tick) + 4, format(tick, 2), { "text-anchor": "end" }));
    });
    [1, 2, 4, 8, 16, 32, 64].forEach(function (N) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: x(N), y1: top, x2: x(N), y2: plotBottom, className: "ot-grid" }));
      svg.appendChild(svgText(api, doc, x(N), plotBottom + 17, String(N), { "text-anchor": "middle" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: y(1), x2: plotRight, y2: y(1), className: "ot-zero" }));
    ["decay", "flat", "shift"].forEach(function (operator) {
      var points = tailRows().map(function (row) { return { x: row.N, y: row[operator] }; });
      var className = "ot-" + operator + (operator === result.params.operator ? " ot-selected" : "");
      svg.appendChild(makeSvg(api, doc, "path", { d: pathFor(points, x, y), className: className }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "ot-axis" }));
    svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: top, x2: left, y2: plotBottom, className: "ot-axis" }));
    svg.appendChild(svgText(api, doc, left, 18, "解析尾界 / 截断误差" , { className: "ot-chart-title" }));
    svg.appendChild(svgText(api, doc, (left + plotRight) / 2, height - 10, "截断阶数 N（对数刻度）", { "text-anchor": "middle" }));
    svg.appendChild(svgText(api, doc, plotRight, 18, "蓝 D↓　红 I　绿 S", { "text-anchor": "end" }));
    return svg;
  }

  function spectrumSvg(api, doc, result, uid) {
    var width = 700, height = 320, left = 58, right = 24, top = 34, bottom = 42;
    var plotRight = width - right, plotBottom = height - bottom;
    var svg = makeSvg(api, doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-labelledby": uid + "-spectrum-title " + uid + "-spectrum-desc" });
    svg.appendChild(makeSvg(api, doc, "title", { id: uid + "-spectrum-title" }, "当前算子的无限谱与有限截面谱"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: uid + "-spectrum-desc" }, "蓝色标记表示无限对象的解析谱，红色标记表示有限截面；单边移位另画单位圆盘和单位圆周。"));
    var mapX = function (value) { return mapLinear(value, -1.25, 1.25, left, plotRight); };
    var mapY = function (value) { return mapLinear(value, -1.25, 1.25, plotBottom, top); };
    [-1, 0, 1].forEach(function (tick) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: mapX(tick), y1: top, x2: mapX(tick), y2: plotBottom, className: tick === 0 ? "ot-axis" : "ot-grid" }));
      svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: mapY(tick), x2: plotRight, y2: mapY(tick), className: tick === 0 ? "ot-axis" : "ot-grid" }));
      svg.appendChild(svgText(api, doc, mapX(tick), plotBottom + 17, String(tick), { "text-anchor": "middle" }));
    });
    if (result.spectrumKind === "shift") {
      svg.appendChild(makeSvg(api, doc, "circle", { cx: mapX(0), cy: mapY(0), r: Math.abs(mapX(1) - mapX(0)), className: "ot-spectrum-boundary" }));
      svg.appendChild(makeSvg(api, doc, "circle", { cx: mapX(0), cy: mapY(0), r: Math.abs(mapX(1) - mapX(0)) * 0.98, className: "ot-spectrum-full", "fill-opacity": "0.12" }));
      svg.appendChild(svgText(api, doc, mapX(-1.15), mapY(1.12), "无限谱：闭单位圆盘；近似谱：单位圆周", {}));
    } else {
      var values = result.spectrumKind === "decay" ? [0].concat(result.finiteSpectrumValues) : [1];
      values.forEach(function (value, index) {
        svg.appendChild(makeSvg(api, doc, "circle", { cx: mapX(value), cy: mapY(0), r: 4, className: "ot-spectrum-full" }));
        if (index > 0 || result.spectrumKind === "flat") {
          svg.appendChild(makeSvg(api, doc, "circle", { cx: mapX(value), cy: mapY(0), r: 7, className: "ot-spectrum-finite" }));
        }
      });
      svg.appendChild(svgText(api, doc, mapX(-1.15), mapY(1.12), result.spectrumKind === "decay" ? "蓝：{0}∪{1/n}；红：当前 N 截面" : "蓝/红重合：谱为 {1}", {}));
    }
    result.finiteSpectrumValues.forEach(function (value) {
      if (result.spectrumKind === "shift") {
        svg.appendChild(makeSvg(api, doc, "circle", { cx: mapX(0), cy: mapY(0), r: 5, className: "ot-spectrum-finite" }));
      } else if (result.spectrumKind === "flat") {
        svg.appendChild(makeSvg(api, doc, "circle", { cx: mapX(value), cy: mapY(0), r: 5, className: "ot-spectrum-finite" }));
      }
    });
    svg.appendChild(svgText(api, doc, (left + plotRight) / 2, height - 10, "实部 Re λ", { "text-anchor": "middle" }));
    svg.appendChild(svgText(api, doc, 15, (top + plotBottom) / 2, "虚部 Im λ", { transform: "rotate(-90 15 " + ((top + plotBottom) / 2) + ")", "text-anchor": "middle" }));
    svg.appendChild(svgText(api, doc, plotRight, 18, "红：有限截面　蓝/绿：无限对象", { "text-anchor": "end" }));
    return svg;
  }

  function metric(api, doc, label, value) {
    return makeElement(api, doc, "div", { className: "ot-metric" }, [
      makeElement(api, doc, "span", { text: label }),
      makeElement(api, doc, "strong", { text: value })
    ]);
  }

  function tableRow(api, doc, cells, header) {
    var row = makeElement(api, doc, "tr", {});
    cells.forEach(function (cell, index) {
      row.appendChild(makeElement(api, doc, header && index === 0 ? "th" : "td", header && index === 0 ? { scope: "row" } : {}, cell));
    });
    return row;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "ot-" + (++SERIAL);
    var state = { operator: DEFAULTS.operator, N: DEFAULTS.N };
    var predictions = { tail: null, compact: null, spectrum: null };
    var revealed = false;
    var shell = makeElement(api, doc, "div", { className: "ot-lab" });
    shell.appendChild(makeElement(api, doc, "h3", { text: "算子尾部审计：矩阵看见了什么？" }));
    shell.appendChild(makeElement(api, doc, "p", { className: "ot-intro", text: "先选一个无限对象并写下预测；揭示后才打开解析尾界、有限截面账本和谱边界图。" }));

    var presetRow = makeElement(api, doc, "div", { className: "ot-presets", role: "group", "aria-label": "算子预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        state.operator = preset.id;
        lock("已切换到" + preset.shortLabel + "，请重新预测。", true);
        render();
      });
      presetButtons.push({ id: preset.id, node: button });
      presetRow.appendChild(button);
    });
    shell.appendChild(presetRow);

    var controlId = uid + "-N";
    var output = makeElement(api, doc, "output", { for: controlId, text: String(state.N) });
    var range = makeElement(api, doc, "input", { id: controlId, type: "range", min: "1", max: String(MAX_N), step: "1", value: String(state.N), "aria-label": "有限截断阶数 N" });
    range.addEventListener("input", function () {
      state.N = Number(range.value);
      lock("截断阶数已改变，请重新预测。", true);
      render();
    });
    shell.appendChild(makeElement(api, doc, "div", { className: "ot-control" }, [
      makeElement(api, doc, "label", { htmlFor: controlId }, ["有限截断阶数 N：", output]),
      range
    ]));

    var form = makeElement(api, doc, "form", { className: "ot-prediction", "aria-labelledby": uid + "-prediction-title" });
    form.appendChild(makeElement(api, doc, "strong", { id: uid + "-prediction-title", text: "预测门：先分开尾证书、紧性与谱" }));
    var questions = [
      { key: "tail", prompt: "N 增大时，这个对象的解析尾界会怎样？", choices: [["zero", "趋于 0"], ["one", "保持为 1"], ["unknown", "有限图不能判断"]] },
      { key: "compact", prompt: "只凭有限秩截断图，能否给出无限维紧性证书？", choices: [["compact", "可以，图已证明"], ["not-compact", "要看解析尾界"], ["unknown", "三者都不能"]] },
      { key: "spectrum", prompt: "无限对象的谱边界应读成哪一种？", choices: [["accumulation", "离散点并在 0 聚集"], ["point", "单点 1"], ["disk", "闭单位圆盘"]] }
    ];
    var choiceButtons = [];
    questions.forEach(function (question) {
      var fieldset = makeElement(api, doc, "fieldset", {});
      fieldset.appendChild(makeElement(api, doc, "legend", { text: question.prompt }));
      var row = makeElement(api, doc, "div", { className: "ot-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          predictions[question.key] = choice[0];
          updatePredictionButtons();
          if (!revealed) feedback.textContent = "预测已记录，三项都选好后揭示账本。";
        });
        choiceButtons.push({ key: question.key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      form.appendChild(fieldset);
    });
    var actions = makeElement(api, doc, "div", { className: "ot-actions" });
    var reveal = makeElement(api, doc, "button", { type: "submit", className: "ot-primary" }, "提交预测并揭示");
    var reset = makeElement(api, doc, "button", { type: "button" }, "重置");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    form.appendChild(actions);
    var feedback = makeElement(api, doc, "p", { className: "ot-feedback", role: "status", "aria-live": "polite", text: "请完成三项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealedSection = makeElement(api, doc, "section", { className: "ot-revealed", hidden: "hidden", "aria-label": "算子结果账本" });
    var metrics = makeElement(api, doc, "div", { className: "ot-metrics" });
    var charts = makeElement(api, doc, "div", { className: "ot-charts" });
    var tailChart = makeElement(api, doc, "div", { className: "ot-chart" });
    var spectrumChart = makeElement(api, doc, "div", { className: "ot-chart" });
    charts.appendChild(tailChart);
    charts.appendChild(spectrumChart);
    var ledgerWrap = makeElement(api, doc, "div", { className: "ot-ledger" });
    var table = makeElement(api, doc, "table", {});
    table.appendChild(makeElement(api, doc, "caption", { text: "透明账本：解析尾界与有限截断误差数值相同，但量词不同。" }));
    table.appendChild(makeElement(api, doc, "thead", {}, [tableRow(api, doc, ["N", "有限秩", "解析尾证书", "当前截断误差", "是否趋零"], false)]));
    var tbody = makeElement(api, doc, "tbody", {});
    table.appendChild(tbody);
    ledgerWrap.appendChild(table);
    var interpretation = makeElement(api, doc, "p", { className: "ot-interpretation", role: "status", "aria-live": "polite" });
    revealedSection.appendChild(metrics);
    revealedSection.appendChild(charts);
    revealedSection.appendChild(ledgerWrap);
    revealedSection.appendChild(interpretation);
    shell.appendChild(revealedSection);
    root.replaceChildren(shell);

    function updatePredictionButtons() {
      choiceButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", predictions[item.key] === item.value ? "true" : "false");
      });
    }

    function lock(message, announceMessage) {
      revealed = false;
      predictions = { tail: null, compact: null, spectrum: null };
      updatePredictionButtons();
      feedback.className = "ot-feedback";
      feedback.textContent = message || "请完成三项预测。";
      revealedSection.setAttribute("hidden", "hidden");
      if (announceMessage) announce(api, root, feedback.textContent);
    }

    function render() {
      var result = evaluate(state);
      range.value = String(state.N);
      output.textContent = String(state.N);
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.operator ? "true" : "false"); });
      if (!revealed) return;
      metrics.replaceChildren(
        metric(api, doc, "对象", result.preset.shortLabel),
        metric(api, doc, "算子范数", format(result.norm, 4)),
        metric(api, doc, "有限秩", String(result.finiteRank)),
        metric(api, doc, "解析尾界", format(result.tailCertificate, 5)),
        metric(api, doc, "无限维紧性", result.compact ? "有证书" : "无证书")
      );
      tailChart.replaceChildren(tailSvg(api, doc, result, uid));
      spectrumChart.replaceChildren(spectrumSvg(api, doc, result, uid));
      clear(tbody);
      [1, 2, 4, 8, 16, 32, 64].forEach(function (N) {
        var value = tailCertificate(result.params.operator, N);
        tbody.appendChild(tableRow(api, doc, [String(N), String(finiteRank(result.params.operator, N)), format(value, 5), format(value, 5), result.params.operator === "decay" ? "是" : "否"], true));
      });
      interpretation.textContent = result.params.operator === "decay"
        ? "D↓ 的有限矩阵图只是数值切片；真正的紧性证书是 supₙ>N |aₙ|=1/(N+1)→0。谱为 {0}∪{1/n}，0 是尾部聚集点。"
        : result.params.operator === "flat"
          ? "I 的每个有限截面都很普通，但 supₙ>N |aₙ|=1，所以有限秩误差永远不降；这是“有限维看起来像矩阵”不能推出紧性的反例。"
          : "S_N 的全部特征值都是 0，而无限单边移位的谱是闭单位圆盘、近似谱是单位圆周；‖S−P_NSP_N‖=1 的边界见证阻止了范数逼近。";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return !predictions[question.key]; });
      if (missing.length) {
        feedback.className = "ot-feedback ot-warn";
        feedback.textContent = "还差 " + missing.length + " 项预测。";
        return;
      }
      var answers = predictionAnswers(state.operator);
      var correct = questions.filter(function (question) { return predictions[question.key] === answers[question.key]; }).length;
      revealed = true;
      revealedSection.removeAttribute("hidden");
      render();
      feedback.className = "ot-feedback " + (correct === questions.length ? "ot-pass" : "ot-warn");
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项命中。有限截断的数字与无限维性质已经分账。";
      announce(api, root, feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state = { operator: DEFAULTS.operator, N: DEFAULTS.N };
      lock("已重置，请重新完成三项预测。", true);
      render();
    });
    updatePredictionButtons();
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("operator-tail self-test failed: " + message);
    }
    assert(diagonalCoefficient("decay", 1) === 1, "decay endpoint n=1");
    assert(diagonalCoefficient("decay", 4) === 0.25, "decay coefficient formula");
    assert(tailCertificate("decay", 8) === 1 / 9, "analytic decay tail");
    assert(tailCertificate("flat", 64) === 1, "flat tail endpoint");
    assert(tailCertificate("shift", 1) === 1, "shift boundary witness");
    var decay = evaluate({ operator: "decay", N: 8 });
    var flat = evaluate({ operator: "flat", N: 8 });
    var shift = evaluate({ operator: "shift", N: 8 });
    assert(decay.norm === 1 && decay.finiteRank === 8, "decay bounded rank");
    assert(decay.compact && decay.analyticTailToZero, "decay compact certificate");
    assert(flat.norm === 1 && !flat.compact && flat.finiteError === 1, "flat noncompact counterexample");
    assert(shift.norm === 1 && shift.finiteRank === 7, "shift norm and rank");
    assert(shift.finiteSpectrumValues.every(function (value) { return value === 0; }), "nilpotent finite shift spectrum");
    assert(shift.spectrumKind === "shift" && shift.fullSpectrum.indexOf("闭单位圆盘") !== -1, "infinite shift spectrum");
    assert(normalizeParams({ operator: "bad", N: -3 }).operator === "decay", "illegal operator fallback");
    assert(normalizeParams({ operator: "flat", N: "bad" }).N === 8, "illegal N fallback");
    assert(normalizeParams({ operator: "shift", N: 999 }).N === MAX_N, "upper endpoint clamp");
    assert(normalizeParams({ operator: "shift", N: 0 }).N === 1, "lower endpoint clamp");
    assert(decay.rows.length === 7 && decay.rows[0].decay === 0.5, "tail ledger rows");
    assert(predictionAnswers("decay").tail === "zero", "decay prediction answer");
    assert(predictionAnswers("flat").compact === "not-compact", "flat prediction answer");
    assert(predictionAnswers("shift").spectrum === "disk", "shift prediction answer");
    assert(JSON.stringify(evaluate(DEFAULTS)) === JSON.stringify(evaluate(DEFAULTS)), "deterministic evaluation");
    return { checks: checks, presets: PRESETS.length, maxN: MAX_N };
  }

  return {
    MAX_N: MAX_N,
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    normalizeParams: normalizeParams,
    diagonalCoefficient: diagonalCoefficient,
    tailCertificate: tailCertificate,
    finiteRank: finiteRank,
    finiteSpectrum: finiteSpectrum,
    spectrumSummary: spectrumSummary,
    evaluate: evaluate,
    predictionAnswers: predictionAnswers,
    selfTest: selfTest,
    mount: mount
  };
});
