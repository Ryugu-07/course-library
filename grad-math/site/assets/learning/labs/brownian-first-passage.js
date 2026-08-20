(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("brownian-first-passage", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("brownian-first-passage self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("brownian-first-passage self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SQRT_TWO = Math.sqrt(2);
  var SQRT_TWO_PI = Math.sqrt(2 * Math.PI);
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-brownian-first-passage-styles";
  var SERIAL = 0;

  var PRESETS = [
    { id: "standard", label: "标准阈值：a=1, T=1", a: 1, T: 1 },
    { id: "zero-level", label: "边界：a=0, T=1", a: 0, T: 1 },
    { id: "negative-level", label: "边界：a=-0.5, T=1", a: -0.5, T: 1 },
    { id: "zero-time", label: "端点：a=1, T=0", a: 1, T: 0 }
  ];

  var PATH_SEEDS = [20260722, 31415926, 27182818];

  var STYLE_TEXT = [
    ".bfp-lab{--bfp-blue:var(--cl-blue,#315f9d);--bfp-gold:var(--cl-gold,#9b6a12);--bfp-green:var(--cl-green,#39734d);--bfp-red:var(--cl-red,#b64335);--bfp-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    "html[data-theme=\"dark\"] .bfp-lab{--bfp-blue:#83c8ff;--bfp-gold:#e2b458;--bfp-green:#72bd8b;--bfp-red:#f08c7d;--bfp-soft:#b8b2a7;}",
    ".bfp-lab *,.bfp-lab *::before,.bfp-lab *::after{box-sizing:border-box;}.bfp-lab [hidden]{display:none!important;}",
    ".bfp-lab h3,.bfp-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.bfp-lab h3{font-size:1.18rem;}.bfp-lab h4{font-size:1rem;}",
    ".bfp-lab .bfp-intro,.bfp-lab .bfp-note,.bfp-lab .bfp-feedback{color:var(--bfp-soft);font-size:13px;line-height:1.7;}",
    ".bfp-lab .bfp-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--bfp-gold);background:var(--bg);}",
    ".bfp-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.bfp-lab legend{margin-bottom:8px;color:var(--fg);font-weight:750;line-height:1.5;}",
    ".bfp-lab .bfp-question{min-width:0;margin:11px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.bfp-lab .bfp-question legend{color:var(--bfp-soft);font-size:13px;font-weight:650;}",
    ".bfp-lab .bfp-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.bfp-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.bfp-lab button:hover{border-color:var(--accent);}.bfp-lab button[aria-pressed=\"true\"],.bfp-lab button.bfp-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.bfp-lab button:disabled{cursor:not-allowed;opacity:.55;}",
    ".bfp-lab button:focus-visible,.bfp-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.bfp-lab .bfp-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.bfp-lab .bfp-actions>*{flex:1 1 180px;}.bfp-lab .bfp-feedback{min-height:2em;margin:8px 0;font-weight:700;}.bfp-lab .bfp-pass{color:var(--bfp-green);}.bfp-lab .bfp-warn{color:var(--bfp-red);}",
    ".bfp-lab .bfp-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.bfp-lab .bfp-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0;}.bfp-lab .bfp-controls,.bfp-lab .bfp-stage{min-width:0;}",
    ".bfp-lab .bfp-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.bfp-lab .bfp-controls h4{margin:0;}.bfp-lab .bfp-preset-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:7px;}.bfp-lab .bfp-preset-grid button{font-size:12px;text-align:left;}.bfp-lab .bfp-control{display:grid;gap:5px;min-width:0;}.bfp-lab .bfp-control label{color:var(--bfp-soft);font-size:13px;font-weight:700;}.bfp-lab .bfp-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.bfp-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".bfp-lab .bfp-stage-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.bfp-lab .bfp-chart-title{display:flex;justify-content:space-between;gap:10px;margin:0 0 7px;color:var(--bfp-soft);font-size:13px;}.bfp-lab .bfp-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.bfp-lab .bfp-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.bfp-lab .bfp-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.65;}.bfp-lab .bfp-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.bfp-lab .bfp-threshold{stroke:var(--bfp-red);stroke-width:1.7;stroke-dasharray:6 4;}.bfp-lab .bfp-zero{stroke:var(--bfp-gold);stroke-width:1.2;stroke-dasharray:3 4;}.bfp-lab .bfp-path{fill:none;stroke:var(--bfp-blue);stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;opacity:.78;}.bfp-lab .bfp-endpoint{fill:var(--bfp-gold);stroke:var(--bg);stroke-width:1.4;}.bfp-lab .bfp-crossed{fill:var(--bfp-green);}.bfp-lab .bfp-label{font-size:11px;}.bfp-lab .bfp-chart-label{font-size:12px;font-weight:750;}.bfp-lab .bfp-legend{display:flex;flex-wrap:wrap;gap:7px 15px;margin:8px 2px 0;color:var(--bfp-soft);font-size:12px;}.bfp-lab .bfp-legend-item{display:inline-flex;align-items:center;gap:6px;}.bfp-lab .bfp-swatch{display:inline-block;width:25px;height:0;border-top:3px solid currentColor;}.bfp-lab .bfp-swatch-path{color:var(--bfp-blue);}.bfp-lab .bfp-swatch-threshold{color:var(--bfp-red);border-top-style:dashed;}.bfp-lab .bfp-swatch-endpoint{color:var(--bfp-gold);}",
    ".bfp-lab .bfp-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 12px;}.bfp-lab .bfp-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.bfp-lab .bfp-metric:nth-child(1){border-top-color:var(--bfp-green);}.bfp-lab .bfp-metric:nth-child(2){border-top-color:var(--bfp-blue);}.bfp-lab .bfp-metric:nth-child(3){border-top-color:var(--bfp-gold);}.bfp-lab .bfp-metric span{display:block;color:var(--bfp-soft);font-size:11.5px;line-height:1.4;}.bfp-lab .bfp-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".bfp-lab .bfp-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.bfp-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.bfp-lab caption{padding:0 0 7px;text-align:left;color:var(--bfp-soft);font-size:12px;line-height:1.55;}.bfp-lab th,.bfp-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.bfp-lab th{color:var(--bfp-soft);font-size:11.5px;font-weight:750;}.bfp-lab td:nth-child(2){white-space:nowrap;font-weight:700;}.bfp-lab .bfp-caution{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--bfp-green);background:var(--bg);color:var(--bfp-soft);font-size:12.5px;line-height:1.7;}",
    "@media(max-width:900px){.bfp-lab .bfp-layout{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:700px){.bfp-lab .bfp-choice-row{grid-template-columns:minmax(0,1fr);}.bfp-lab .bfp-metrics{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:430px){.bfp-lab .bfp-stage-frame{padding:6px;}.bfp-lab table{font-size:11.5px;}.bfp-lab th,.bfp-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.bfp-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function validateLevel(a) {
    if (!finite(a)) throw new RangeError("a 必须是有限实数。");
    return a;
  }

  function validateTime(T) {
    if (!finite(T) || T < 0) throw new RangeError("T 必须是非负有限数。");
    return T;
  }

  function erf(value) {
    var sign = value < 0 ? -1 : 1;
    var x = Math.abs(value);
    var p = 0.3275911;
    var a1 = 0.254829592;
    var a2 = -0.284496736;
    var a3 = 1.421413741;
    var a4 = -1.453152027;
    var a5 = 1.061405429;
    var t = 1 / (1 + p * x);
    var polynomial = (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t;
    return sign * (1 - polynomial * Math.exp(-x * x));
  }

  function normalCdf(value) {
    if (!finite(value)) return value === Infinity ? 1 : 0;
    return 0.5 * (1 + erf(value / SQRT_TWO));
  }

  function normalTail(value) {
    if (value < 0) return 1 - normalTail(-value);
    if (value > 8) return 0;
    return 1 - normalCdf(value);
  }

  function endpointExceedance(a, T) {
    validateLevel(a);
    validateTime(T);
    if (T === 0) return a <= 0 ? 1 : 0;
    return normalTail(a / Math.sqrt(T));
  }

  function maximumExceedance(a, T) {
    validateLevel(a);
    validateTime(T);
    if (a <= 0) return 1;
    if (T === 0) return 0;
    return 2 * normalTail(a / Math.sqrt(T));
  }

  function firstPassageCdf(a, T) {
    return maximumExceedance(a, T);
  }

  function firstPassageDensity(a, t) {
    validateLevel(a);
    validateTime(t);
    if (a <= 0) return NaN;
    if (t === 0) return 0;
    return (a / (SQRT_TWO_PI * Math.pow(t, 1.5))) * Math.exp(-(a * a) / (2 * t));
  }

  function analyze(a, T) {
    validateLevel(a);
    validateTime(T);
    var endpoint = endpointExceedance(a, T);
    var maximum = maximumExceedance(a, T);
    var density = a > 0 && T > 0 ? firstPassageDensity(a, T) : null;
    return {
      a: a,
      T: T,
      endpoint: endpoint,
      maximum: maximum,
      twiceEndpoint: 2 * endpoint,
      firstPassageCdf: firstPassageCdf(a, T),
      firstPassageDensity: density,
      reflectionDifference: maximum - 2 * endpoint,
      reflectionDomain: a > 0 && T > 0,
      densityStatus: a <= 0 ? "atom-at-zero" : T === 0 ? "right-limit-at-zero" : "continuous"
    };
  }

  function makeRng(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) | 0;
      var value = Math.imul(state ^ (state >>> 15), 1 | state);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(rng) {
    var u = 0;
    while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }

  function samplePath(seed, T, steps, a) {
    validateTime(T);
    if (!Number.isInteger(steps) || steps < 1 || steps > 1024) {
      throw new RangeError("steps 必须是 1 到 1024 的整数。");
    }
    validateLevel(a);
    var rng = makeRng(seed);
    var dt = T / steps;
    var path = [{ t: 0, value: 0 }];
    var value = 0;
    var firstDiscreteIndex = null;
    for (var i = 1; i <= steps; i += 1) {
      value += Math.sqrt(dt) * gaussian(rng);
      path.push({ t: i * dt, value: value });
      if (firstDiscreteIndex === null && value >= a) firstDiscreteIndex = i;
    }
    return {
      seed: seed,
      T: T,
      steps: steps,
      a: a,
      path: path,
      endpoint: value,
      max: path.reduce(function (current, point) { return Math.max(current, point.value); }, 0),
      firstDiscreteIndex: firstDiscreteIndex
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
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function formatNumber(api, value, digits) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    if (!finite(value)) return value === Infinity ? "∞" : "—";
    if (api && typeof api.format === "function") return api.format(value, digits);
    var places = digits === undefined ? 4 : digits;
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function metricNode(api, doc, label, value) {
    return element(api, doc, "div", { className: "bfp-metric" }, [
      element(api, doc, "span", {}, label),
      element(api, doc, "strong", {}, value)
    ]);
  }

  function ledgerRow(api, doc, cells) {
    return element(api, doc, "tr", {}, cells.map(function (cell, index) {
      return element(api, doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell);
    }));
  }

  function drawChart(api, doc, a, T, prefix) {
    var samples = PATH_SEEDS.map(function (seed) { return samplePath(seed, T, 128, a); });
    var values = [0, a];
    samples.forEach(function (sample) {
      sample.path.forEach(function (point) { values.push(point.value); });
    });
    var yMin = Math.min.apply(Math, values);
    var yMax = Math.max.apply(Math, values);
    if (!(yMax > yMin)) { yMin -= 1; yMax += 1; }
    var pad = Math.max(0.2, 0.12 * (yMax - yMin));
    yMin -= pad;
    yMax += pad;
    var left = 48;
    var top = 22;
    var width = 700;
    var height = 238;
    function xMap(t) { return left + (T === 0 ? 0 : (t / T) * width); }
    function yMap(value) { return top + (yMax - value) / (yMax - yMin) * height; }
    var children = [
      svgElement(api, doc, "title", { id: prefix + "-chart-title" }, "固定 seed 的布朗路径与阈值"),
      svgElement(api, doc, "desc", { id: prefix + "-chart-desc" }, "三条固定 seed 的离散路径；它们只作视觉证据，不是 Monte Carlo 定理证明。"),
      svgElement(api, doc, "line", { className: "bfp-axis", x1: left, y1: top + height, x2: left + width, y2: top + height }),
      svgElement(api, doc, "line", { className: "bfp-axis", x1: left, y1: top, x2: left, y2: top + height }),
      svgElement(api, doc, "line", { className: "bfp-zero", x1: left, y1: yMap(0), x2: left + width, y2: yMap(0) }),
      svgElement(api, doc, "line", { className: "bfp-threshold", x1: left, y1: yMap(a), x2: left + width, y2: yMap(a) }),
      svgElement(api, doc, "text", { className: "bfp-chart-label", x: left + 7, y: Math.max(top + 14, yMap(a) - 7) }, "a=" + formatNumber(api, a, 2)),
      svgElement(api, doc, "text", { className: "bfp-label", x: left + width - 3, y: top + height + 19, "text-anchor": "end" }, "t=" + formatNumber(api, T, 2)),
      svgElement(api, doc, "text", { className: "bfp-label", x: left - 7, y: top + 4, "text-anchor": "end" }, "B_t")
    ];
    samples.forEach(function (sample, index) {
      var d = sample.path.map(function (point, pointIndex) {
        return (pointIndex === 0 ? "M" : "L") + " " + xMap(point.t).toFixed(2) + " " + yMap(point.value).toFixed(2);
      }).join(" ");
      children.push(svgElement(api, doc, "path", { className: "bfp-path", d: d, "aria-label": "seed " + sample.seed }));
      var endpointClass = sample.endpoint >= a ? "bfp-endpoint bfp-crossed" : "bfp-endpoint";
      children.push(svgElement(api, doc, "circle", { className: endpointClass, cx: xMap(T), cy: yMap(sample.endpoint), r: 4.2 }));
      children.push(svgElement(api, doc, "text", { className: "bfp-label", x: xMap(T) - 5, y: yMap(sample.endpoint) - 7 - index * 11, "text-anchor": "end" }, String(index + 1)));
    });
    return svgElement(api, doc, "svg", {
      className: "bfp-svg",
      viewBox: "0 0 760 285",
      role: "img",
      "aria-labelledby": prefix + "-chart-title " + prefix + "-chart-desc"
    }, children);
  }

  function mount(root, api) {
    var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    SERIAL += 1;
    var prefix = "bfp-" + SERIAL;
    var state = {
      a: 1,
      T: 1,
      revealed: false,
      predictions: { reflection: null, cdf: null, boundary: null }
    };

    var questions = [
      {
        key: "reflection",
        prompt: "默认 a=1,T=1 时，最大值越界与终点越界怎样比较？",
        choices: [
          { value: "double", label: "最大值概率是 2 倍" },
          { value: "same", label: "两者相同" },
          { value: "unknown", label: "不能由终点推出" }
        ],
        expected: "double",
        explanation: "反射原理把首次到达 a 后的路径反射，给出 P(M_T≥a)=2P(B_T≥a)，条件是 a>0、T>0。"
      },
      {
        key: "cdf",
        prompt: "首次通过时间 τ_a 的 CDF P(τ_a≤T) 与哪一个量相同？",
        choices: [
          { value: "max", label: "与最大值越界相同" },
          { value: "endpoint", label: "只等于终点尾概率" },
          { value: "density", label: "等于密度在 T 的值" }
        ],
        expected: "max",
        explanation: "事件 {τ_a≤T} 与 {M_T≥a} 相同；因此 CDF 是 2(1−Φ(a/√T))，不是密度值。"
      },
      {
        key: "boundary",
        prompt: "若 a≤0，从 B_0=0 出发的首次通过时间应怎样读？",
        choices: [
          { value: "atom", label: "τ_a=0，有 0 点原子" },
          { value: "same", label: "仍用连续密度" },
          { value: "undefined", label: "这个事件没有定义" }
        ],
        expected: "atom",
        explanation: "用 τ_a=inf{t≥0:B_t≥a} 的约定，a≤0 时起点已经越过阈值，所以 τ_a=0 几乎处处；不存在同一条 t>0 的连续密度。"
      }
    ];

    function makePredictionQuestion(question) {
      var fieldset = element(api, doc, "fieldset", { className: "bfp-question" });
      fieldset.appendChild(element(api, doc, "legend", {}, question.prompt));
      var row = element(api, doc, "div", { className: "bfp-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice.value;
          renderPrediction();
        });
        choice.button = button;
        row.appendChild(button);
      });
      question.row = row;
      fieldset.appendChild(row);
      return fieldset;
    }

    var gate = element(api, doc, "section", { className: "bfp-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(api, doc, "h3", { id: prefix + "-gate-title" }, "预测门：先判断反射原理，再揭示账本"));
    gate.appendChild(element(api, doc, "p", { className: "bfp-intro" }, "先回答三问；提交前只显示你的选择，不显示答案、理论数值或路径图。"));
    questions.forEach(function (question) { gate.appendChild(makePredictionQuestion(question)); });
    var gateActions = element(api, doc, "div", { className: "bfp-actions" });
    var reveal = element(api, doc, "button", { type: "button", className: "bfp-primary" }, "提交预测并揭示");
    var reset = element(api, doc, "button", { type: "button" }, "重置");
    var feedback = element(api, doc, "p", { className: "bfp-feedback", "aria-live": "polite" }, "");
    gateActions.appendChild(reveal);
    gateActions.appendChild(reset);
    gate.appendChild(gateActions);
    gate.appendChild(feedback);

    var presetButtons = [];
    var presetGrid = element(api, doc, "div", { className: "bfp-preset-grid", role: "group", "aria-label": "参数预设" });
    PRESETS.forEach(function (preset) {
      var button = element(api, doc, "button", { type: "button", "aria-pressed": preset.id === "standard" ? "true" : "false" }, preset.label);
      button.addEventListener("click", function () {
        state.a = preset.a;
        state.T = preset.T;
        render();
      });
      presetButtons.push({ preset: preset, node: button });
      presetGrid.appendChild(button);
    });

    var aOutput = element(api, doc, "output", {}, formatNumber(api, state.a, 2));
    var aInput = element(api, doc, "input", { type: "range", min: "-1", max: "3", step: "0.1", value: String(state.a), "aria-label": "阈值 a" });
    var tOutput = element(api, doc, "output", {}, formatNumber(api, state.T, 2));
    var tInput = element(api, doc, "input", { type: "range", min: "0", max: "2", step: "0.05", value: String(state.T), "aria-label": "时间 T" });
    aInput.addEventListener("input", function () { state.a = Number(aInput.value); render(); });
    tInput.addEventListener("input", function () { state.T = Number(tInput.value); render(); });
    var controls = element(api, doc, "section", { className: "bfp-controls", "aria-labelledby": prefix + "-controls-title" }, [
      element(api, doc, "h4", { id: prefix + "-controls-title" }, "参数"),
      presetGrid,
      element(api, doc, "div", { className: "bfp-control" }, [element(api, doc, "label", {}, ["阈值 a = ", aOutput]), aInput]),
      element(api, doc, "div", { className: "bfp-control" }, [element(api, doc, "label", {}, ["观察时间 T = ", tOutput]), tInput]),
      element(api, doc, "p", { className: "bfp-note" }, "同一组固定 seed 只重画离散路径；精确概率由解析公式计算，有限路径不承担定理证明。")
    ]);

    var chartHost = element(api, doc, "div", { className: "bfp-stage-frame" });
    var legend = element(api, doc, "div", { className: "bfp-legend", "aria-label": "图例" }, [
      element(api, doc, "span", { className: "bfp-legend-item" }, [element(api, doc, "i", { className: "bfp-swatch bfp-swatch-path" }), "固定 seed 路径"]),
      element(api, doc, "span", { className: "bfp-legend-item" }, [element(api, doc, "i", { className: "bfp-swatch bfp-swatch-threshold" }), "阈值 a"]),
      element(api, doc, "span", { className: "bfp-legend-item" }, [element(api, doc, "i", { className: "bfp-swatch bfp-swatch-endpoint" }), "终点"])
    ]);
    var metrics = element(api, doc, "div", { className: "bfp-metrics", "aria-label": "核心概率" });
    var metricMaximum = element(api, doc, "div");
    var metricEndpoint = element(api, doc, "div");
    var metricDensity = element(api, doc, "div");
    metrics.appendChild(metricMaximum);
    metrics.appendChild(metricEndpoint);
    metrics.appendChild(metricDensity);
    var ledgerBody = element(api, doc, "tbody");
    var table = element(api, doc, "table", { "aria-label": "布朗首次通过逐项账本" }, [
      element(api, doc, "caption", {}, "逐项账本：事件、精确公式与当前读数"),
      element(api, doc, "thead", {}, [element(api, doc, "tr", {}, [
        element(api, doc, "th", { scope: "col" }, "对象"),
        element(api, doc, "th", { scope: "col" }, "读数"),
        element(api, doc, "th", { scope: "col" }, "解析定义 / 边界")
      ])]),
      ledgerBody
    ]);
    var stageNote = element(api, doc, "p", { className: "bfp-caution" }, "反例与迁移：终点越界不能代表路径越界；只有正阈值的反射原理把两者精确接起来。迁移到带漂移布朗运动时要先换到无漂移坐标，迁移到离散随机游走时还要单独处理跳跃越界与格点误差。 ");
    var stage = element(api, doc, "section", { className: "bfp-revealed", hidden: true, "aria-labelledby": prefix + "-stage-title" });
    stage.appendChild(element(api, doc, "h3", { id: prefix + "-stage-title" }, "解析账本与固定路径"));
    stage.appendChild(element(api, doc, "div", { className: "bfp-layout" }, [
      controls,
      element(api, doc, "section", { className: "bfp-stage" }, [
        element(api, doc, "div", { className: "bfp-chart-title" }, [element(api, doc, "span", {}, "路径图"), element(api, doc, "span", { className: "bfp-note" }, "离散视觉证据")]),
        chartHost,
        legend,
        metrics,
        element(api, doc, "div", { className: "bfp-ledger" }, table),
        stageNote
      ])
    ]));

    root.replaceChildren(gate, stage);
    root.classList.add("bfp-lab");

    function renderPrediction() {
      questions.forEach(function (question) {
        question.choices.forEach(function (choice) {
          choice.button.setAttribute("aria-pressed", state.predictions[question.key] === choice.value ? "true" : "false");
        });
      });
      var complete = questions.every(function (question) { return state.predictions[question.key] !== null; });
      reveal.disabled = !complete || state.revealed;
      if (!state.revealed) {
        feedback.textContent = complete ? "预测已记录；点击提交后才会揭示答案。" : "请先完成三个预测。";
        feedback.className = "bfp-feedback";
      }
    }

    function renderMetrics(result) {
      replaceChildren(metricMaximum, metricNode(api, doc, "最大值越界 P(M_T≥a)", formatNumber(api, result.maximum, 5)));
      replaceChildren(metricEndpoint, metricNode(api, doc, "终点越界 P(B_T≥a)", formatNumber(api, result.endpoint, 5)));
      replaceChildren(metricDensity, metricNode(api, doc, "密度 f_τ(T)", formatNumber(api, result.firstPassageDensity, 5)));
    }

    function renderLedger(result) {
      var rows = [
        ledgerRow(api, doc, ["M_T≥a", formatNumber(api, result.maximum, 6), "a≤0: 1；a>0,T>0: 2(1−Φ(a/√T))"]),
        ledgerRow(api, doc, ["B_T≥a", formatNumber(api, result.endpoint, 6), "T=0: 1_{a≤0}；T>0: 1−Φ(a/√T)"]),
        ledgerRow(api, doc, ["2P(B_T≥a)", formatNumber(api, result.twiceEndpoint, 6), result.reflectionDomain ? "反射原理的精确比较" : "边界外的形式比较，不能当作定理域"]),
        ledgerRow(api, doc, ["τ_a≤T", formatNumber(api, result.firstPassageCdf, 6), "与 {M_T≥a} 是同一事件"]),
        ledgerRow(api, doc, ["f_τ(T)", formatNumber(api, result.firstPassageDensity, 6), "a>0,T>0: a exp(−a²/(2T))/(√(2π)T^{3/2})"]),
        ledgerRow(api, doc, ["反射差", formatNumber(api, result.reflectionDifference, 6), result.reflectionDomain ? "应为 0；由解析式直接检查" : "边界提示：先看起点和 T=0"]),
        ledgerRow(api, doc, ["密度边界", result.densityStatus, "a≤0 时 τ_a=0 有原子；T=0 只读 CDF 端点"])
      ];
      replaceChildren(ledgerBody, rows);
    }

    function render() {
      aInput.value = String(state.a);
      tInput.value = String(state.T);
      aOutput.textContent = formatNumber(api, state.a, 2);
      tOutput.textContent = formatNumber(api, state.T, 2);
      presetButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.preset.a === state.a && item.preset.T === state.T ? "true" : "false");
      });
      stage.hidden = !state.revealed;
      if (!state.revealed) return;
      var result = analyze(state.a, state.T);
      replaceChildren(chartHost, drawChart(api, doc, state.a, state.T, prefix));
      renderMetrics(result);
      renderLedger(result);
    }

    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return state.predictions[question.key] === null; });
      if (missing.length) {
        feedback.textContent = "请先完成三个预测。";
        feedback.className = "bfp-feedback bfp-warn";
        return;
      }
      state.revealed = true;
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      render();
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中。答案与解析已显示；路径仍不是定理证明。";
      feedback.className = "bfp-feedback " + (correct === questions.length ? "bfp-pass" : "bfp-warn");
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
    });

    reset.addEventListener("click", function () {
      state.a = 1;
      state.T = 1;
      state.revealed = false;
      state.predictions = { reflection: null, cdf: null, boundary: null };
      renderPrediction();
      render();
      feedback.textContent = "已重置；答案再次隐藏。";
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
    });

    renderPrediction();
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("brownian-first-passage self-test failed: " + message);
    }
    function close(left, right, tolerance, message) {
      assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")");
    }
    close(normalCdf(0), 0.5, 3e-6, "Phi(0)");
    close(endpointExceedance(1, 1), 0.1586553, 3e-5, "normal tail");
    close(maximumExceedance(1, 1), 2 * endpointExceedance(1, 1), 1e-12, "reflection identity");
    close(firstPassageCdf(1, 1), maximumExceedance(1, 1), 1e-12, "hitting CDF identity");
    close(firstPassageDensity(1, 1), Math.exp(-0.5) / SQRT_TWO_PI, 3e-6, "first-passage density");
    assert(maximumExceedance(-0.2, 1) === 1, "negative level maximum boundary");
    assert(endpointExceedance(-0.2, 0) === 1, "negative level endpoint at T=0");
    assert(maximumExceedance(0, 1) === 1 && firstPassageCdf(0, 1) === 1, "zero level boundary");
    assert(endpointExceedance(1, 0) === 0 && maximumExceedance(1, 0) === 0, "positive level T=0");
    assert(endpointExceedance(0, 0) === 1 && maximumExceedance(0, 0) === 1, "zero level T=0");
    assert(Number.isNaN(firstPassageDensity(0, 1)), "atom has no ordinary density");
    assert(firstPassageDensity(1, 0) === 0, "positive-level density right limit at zero");
    assert(analyze(1, 1).reflectionDomain === true, "analytic domain flag");
    assert(analyze(-1, 1).densityStatus === "atom-at-zero", "boundary status");
    var pathA = samplePath(PATH_SEEDS[0], 1, 16, 1);
    var pathB = samplePath(PATH_SEEDS[0], 1, 16, 1);
    assert(JSON.stringify(pathA) === JSON.stringify(pathB), "fixed seed reproducibility");
    assert(pathA.path.length === 17 && pathA.path[0].value === 0, "path endpoints");
    var threw = false;
    try { endpointExceedance(1, -1); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "negative T rejected");
    threw = false;
    try { endpointExceedance(NaN, 1); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "non-finite level rejected");
    threw = false;
    try { samplePath(1, 1, 0, 1); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "invalid step count rejected");
    return { checks: checks };
  }

  return {
    PRESETS: PRESETS,
    PATH_SEEDS: PATH_SEEDS,
    erf: erf,
    normalCdf: normalCdf,
    endpointExceedance: endpointExceedance,
    maximumExceedance: maximumExceedance,
    firstPassageCdf: firstPassageCdf,
    firstPassageDensity: firstPassageDensity,
    analyze: analyze,
    makeRng: makeRng,
    samplePath: samplePath,
    selfTest: selfTest,
    mount: mount
  };
});
