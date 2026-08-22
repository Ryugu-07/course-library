(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("confidence-intervals", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("confidence-intervals self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("confidence-intervals self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-confidence-intervals-styles";
  var SERIAL = 0;
  var Z_CRITICAL = { "0.9": 1.644854, "0.95": 1.959964, "0.99": 2.575829 };
  var T_CRITICAL_CACHE = Object.create(null);
  var DEFAULTS = {
    mu: 500,
    sigma: 8,
    n: 16,
    confidence: 0.95,
    repetitions: 96,
    variance: "unknown",
    rule: "preplanned",
    seed: 20260822
  };

  var STYLE_TEXT = [
    ".ci-lab{--ci-blue:#2b628f;--ci-green:#39734d;--ci-red:#b4493f;--ci-gold:#9a6b16;--ci-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    "html[data-theme=dark] .ci-lab{--ci-blue:#83c8ff;--ci-green:#82d49e;--ci-red:#f08d83;--ci-gold:#e2b458;--ci-soft:#b8b2a7}",
    ".ci-lab *,.ci-lab *::before,.ci-lab *::after{box-sizing:border-box}.ci-lab [hidden]{display:none!important}",
    ".ci-lab h3,.ci-lab h4{margin:0;color:var(--fg);letter-spacing:0}.ci-lab h3{font-size:1.18rem}.ci-lab h4{font-size:1rem}",
    ".ci-lab .ci-intro,.ci-lab .ci-note,.ci-lab .ci-feedback{color:var(--ci-soft);font-size:13px;line-height:1.7}",
    ".ci-lab .ci-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--ci-gold);background:var(--bg)}",
    ".ci-lab fieldset{min-width:0;margin:0;padding:0;border:0}.ci-lab legend{margin-bottom:8px;color:var(--fg);font-weight:750;line-height:1.5}",
    ".ci-lab .ci-question{min-width:0;margin:11px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.ci-lab .ci-question legend{color:var(--ci-soft);font-size:13px;font-weight:650}",
    ".ci-lab .ci-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ci-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ci-lab button:hover{border-color:var(--accent)}.ci-lab button[aria-pressed=true],.ci-lab button.ci-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.ci-lab button:disabled{cursor:not-allowed;opacity:.55}",
    ".ci-lab button:focus-visible,.ci-lab input:focus-visible,.ci-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ci-lab .ci-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.ci-lab .ci-actions>*{flex:1 1 180px}.ci-lab .ci-feedback{min-height:2em;margin:8px 0;font-weight:700}.ci-lab .ci-pass{color:var(--ci-green)}.ci-lab .ci-warn{color:var(--ci-red)}",
    ".ci-lab .ci-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.ci-lab .ci-layout{display:grid;grid-template-columns:minmax(205px,.62fr) minmax(0,1.38fr);gap:16px;align-items:start;min-width:0}.ci-lab .ci-controls,.ci-lab .ci-stage{min-width:0}",
    ".ci-lab .ci-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.ci-lab .ci-controls h4{margin:0}.ci-lab .ci-control{display:grid;gap:5px;min-width:0}.ci-lab .ci-control label{color:var(--ci-soft);font-size:13px;font-weight:700}.ci-lab .ci-control output{color:var(--accent);font-variant-numeric:tabular-nums}.ci-lab input[type=range]{display:block;width:100%;min-height:44px;height:44px;margin:0;accent-color:var(--accent)}.ci-lab select{width:100%;min-height:44px;padding:7px 8px;border:1px solid var(--border);border-radius:5px;background:var(--bg);color:var(--fg);font:inherit}",
    ".ci-lab .ci-stage-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.ci-lab .ci-chart{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.ci-lab .ci-chart text{fill:currentColor;font-family:inherit;letter-spacing:0}.ci-lab .ci-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.65}.ci-lab .ci-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72}.ci-lab .ci-truth{stroke:var(--ci-gold);stroke-width:2;stroke-dasharray:6 4}.ci-lab .ci-covered{stroke:var(--ci-green);fill:var(--ci-green)}.ci-lab .ci-missed{stroke:var(--ci-red);fill:var(--ci-red)}.ci-lab .ci-interval{stroke-width:2.1;stroke-linecap:round}.ci-lab .ci-mean{stroke:var(--bg);stroke-width:1.2}.ci-lab .ci-axis-label{font-size:12px}.ci-lab .ci-tick{font-size:11px;fill:var(--ci-soft)!important}.ci-lab .ci-chart-note{font-size:11px;fill:var(--ci-soft)!important}",
    ".ci-lab .ci-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 12px}.ci-lab .ci-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ci-lab .ci-metric:nth-child(1){border-top-color:var(--ci-blue)}.ci-lab .ci-metric:nth-child(2){border-top-color:var(--ci-green)}.ci-lab .ci-metric:nth-child(3){border-top-color:var(--ci-gold)}.ci-lab .ci-metric:nth-child(4){border-top-color:var(--ci-red)}.ci-lab .ci-metric span{display:block;color:var(--ci-soft);font-size:11.5px;line-height:1.4}.ci-lab .ci-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ci-lab .ci-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch}.ci-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ci-lab caption{padding:0 0 7px;text-align:left;color:var(--ci-soft);font-size:12px;line-height:1.55}.ci-lab th,.ci-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.ci-lab th{color:var(--ci-soft);font-size:11.5px;font-weight:750}.ci-lab td:nth-child(n+2){white-space:nowrap}.ci-lab .ci-caution{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--ci-gold);background:var(--bg);color:var(--ci-soft);font-size:12.5px;line-height:1.7}",
    "@media(max-width:900px){.ci-lab .ci-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:700px){.ci-lab .ci-choice-row{grid-template-columns:minmax(0,1fr)}.ci-lab .ci-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){.ci-lab .ci-stage-frame{padding:6px}.ci-lab table{font-size:11.5px}.ci-lab th,.ci-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.ci-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeRng(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) | 0;
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

  function zCritical(confidence) {
    var key = String(confidence);
    if (!Z_CRITICAL[key]) throw new RangeError("confidence 必须是 0.90、0.95 或 0.99。 ");
    return Z_CRITICAL[key];
  }

  function logGamma(value) {
    var coefficients = [
      676.5203681218851,
      -1259.1392167224028,
      771.3234287776531,
      -176.6150291621406,
      12.507343278686905,
      -0.13857109526572012,
      9.984369578019572e-6,
      1.5056327351493116e-7
    ];
    if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
    var z = value - 1;
    var sum = 0.9999999999998099;
    coefficients.forEach(function (coefficient, index) { sum += coefficient / (z + index + 1); });
    var t = z + coefficients.length - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
  }

  function betaFraction(a, b, x) {
    var qab = a + b;
    var qap = a + 1;
    var qam = a - 1;
    var c = 1;
    var d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    d = 1 / d;
    var result = d;
    for (var iteration = 1; iteration <= 200; iteration += 1) {
      var twice = 2 * iteration;
      var even = iteration * (b - iteration) * x / ((qam + twice) * (a + twice));
      d = 1 + even * d;
      if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + even / c;
      if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      result *= d * c;
      var odd = -(a + iteration) * (qab + iteration) * x / ((a + twice) * (qap + twice));
      d = 1 + odd * d;
      if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + odd / c;
      if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      var delta = d * c;
      result *= delta;
      if (Math.abs(delta - 1) < 3e-14) break;
    }
    return result;
  }

  function regularizedBeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x));
    if (x < (a + 1) / (a + b + 2)) return front * betaFraction(a, b, x) / a;
    return 1 - front * betaFraction(b, a, 1 - x) / b;
  }

  function studentTCdf(value, degrees) {
    if (value === 0) return 0.5;
    var x = degrees / (degrees + value * value);
    var tail = 0.5 * regularizedBeta(x, degrees / 2, 0.5);
    return value > 0 ? 1 - tail : tail;
  }

  function tCritical(confidence, degrees) {
    if (!finite(degrees) || degrees < 2) throw new RangeError("t 区间至少需要 3 个观测。 ");
    var key = String(confidence) + ":" + String(degrees);
    if (T_CRITICAL_CACHE[key] !== undefined) return T_CRITICAL_CACHE[key];
    var target = (1 + Number(confidence)) / 2;
    var low = 0;
    var high = Math.max(1, zCritical(confidence));
    while (studentTCdf(high, degrees) < target) high *= 2;
    for (var iteration = 0; iteration < 70; iteration += 1) {
      var middle = (low + high) / 2;
      if (studentTCdf(middle, degrees) < target) low = middle;
      else high = middle;
    }
    T_CRITICAL_CACHE[key] = (low + high) / 2;
    return T_CRITICAL_CACHE[key];
  }

  function mean(values) {
    if (!values.length) return NaN;
    return values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
  }

  function sampleStd(values) {
    if (values.length < 2) return NaN;
    var center = mean(values);
    var total = values.reduce(function (sum, value) { return sum + Math.pow(value - center, 2); }, 0);
    return Math.sqrt(total / (values.length - 1));
  }

  function copyConfig(config) {
    var source = config || DEFAULTS;
    return {
      mu: clamp(Number(source.mu === undefined ? DEFAULTS.mu : source.mu), 0, 1000),
      sigma: clamp(Number(source.sigma === undefined ? DEFAULTS.sigma : source.sigma), 0.5, 40),
      n: Math.round(clamp(Number(source.n === undefined ? DEFAULTS.n : source.n), 4, 60)),
      confidence: Number(source.confidence === undefined ? DEFAULTS.confidence : source.confidence),
      repetitions: Math.round(clamp(Number(source.repetitions === undefined ? DEFAULTS.repetitions : source.repetitions), 40, 180)),
      variance: source.variance === "known" ? "known" : "unknown",
      rule: source.rule === "selected" ? "selected" : "preplanned",
      seed: Number(source.seed === undefined ? DEFAULTS.seed : source.seed) >>> 0
    };
  }

  function intervalFromSample(values, config, variance) {
    var n = values.length;
    var center = mean(values);
    var standardDeviation = sampleStd(values);
    var known = variance === "known";
    var critical = known ? zCritical(config.confidence) : tCritical(config.confidence, n - 1);
    var margin = critical * (known ? config.sigma : standardDeviation) / Math.sqrt(n);
    return {
      lower: center - margin,
      upper: center + margin,
      center: center,
      margin: margin,
      standardDeviation: standardDeviation,
      critical: critical,
      variance: variance,
      method: known ? "z（σ 已知）" : "t（σ 未知）"
    };
  }

  function chooseInterval(values, config) {
    if (config.rule === "preplanned") return intervalFromSample(values, config, config.variance);
    if (config.variance !== "known") throw new RangeError("比较 z 与 t 的选择实验要求 sigma 已知；未知 sigma 时 z 候选不可观测。 ");
    var zInterval = intervalFromSample(values, config, "known");
    var tInterval = intervalFromSample(values, config, "unknown");
    var chosen = zInterval.margin <= tInterval.margin ? zInterval : tInterval;
    chosen.selected = true;
    chosen.candidates = { z: zInterval, t: tInterval };
    chosen.method = chosen.method + "；事后选窄者";
    return chosen;
  }

  function simulate(config) {
    var settings = copyConfig(config);
    var rng = makeRng(settings.seed);
    var intervals = [];
    var firstSample = [];
    var covered = 0;
    var selectedZ = 0;
    for (var repetition = 0; repetition < settings.repetitions; repetition += 1) {
      var sample = [];
      for (var index = 0; index < settings.n; index += 1) sample.push(settings.mu + settings.sigma * gaussian(rng));
      if (repetition === 0) firstSample = sample.slice();
      var interval = chooseInterval(sample, settings);
      interval.index = repetition + 1;
      interval.covered = interval.lower <= settings.mu && settings.mu <= interval.upper;
      if (interval.covered) covered += 1;
      if (interval.candidates && interval.candidates.z.margin <= interval.candidates.t.margin) selectedZ += 1;
      intervals.push(interval);
    }
    var observed = chooseInterval(firstSample, settings);
    return {
      config: settings,
      intervals: intervals,
      observed: observed,
      coverageCount: covered,
      coverage: covered / settings.repetitions,
      target: settings.confidence,
      selectedZ: selectedZ,
      selectedT: settings.repetitions - selectedZ,
      theoreticalZ: zCritical(settings.confidence),
      theoreticalT: tCritical(settings.confidence, settings.n - 1)
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
    var left = 58;
    var top = 26;
    var width = 650;
    var height = 244;
    var display = result.intervals.slice(0, Math.min(22, result.intervals.length));
    var values = [result.config.mu];
    display.forEach(function (item) { values.push(item.lower, item.upper); });
    var min = Math.min.apply(Math, values);
    var max = Math.max.apply(Math, values);
    var padding = Math.max(1, (max - min) * 0.1);
    min -= padding;
    max += padding;
    function xMap(value) { return left + (value - min) / (max - min) * width; }
    function yMap(index) { return top + (index + 1) / (display.length + 1) * height; }
    var children = [
      svgElement(api, doc, "title", { id: prefix + "-chart-title" }, "重复抽样置信区间覆盖图"),
      svgElement(api, doc, "desc", { id: prefix + "-chart-desc" }, "每条横线是一次抽样得到的区间；绿色覆盖真均值，红色没有覆盖；金色虚线是真均值。"),
      svgElement(api, doc, "line", { className: "ci-axis", x1: left, y1: top + height, x2: left + width, y2: top + height }),
      svgElement(api, doc, "line", { className: "ci-axis", x1: left, y1: top, x2: left, y2: top + height }),
      svgElement(api, doc, "line", { className: "ci-truth", x1: xMap(result.config.mu), y1: top, x2: xMap(result.config.mu), y2: top + height }),
      svgElement(api, doc, "text", { className: "ci-axis-label", x: xMap(result.config.mu) + 6, y: top + 14 }, "真均值 μ=" + format(result.config.mu, 1)),
      svgElement(api, doc, "text", { className: "ci-axis-label", x: left + width, y: top + height + 28, "text-anchor": "end" }, "区间端点"),
      svgElement(api, doc, "text", { className: "ci-chart-note", x: left, y: top - 8 }, "展示前 " + display.length + " 次；总重复数 " + result.config.repetitions)
    ];
    [0, 0.5, 1].forEach(function (fraction) {
      var value = min + fraction * (max - min);
      var x = xMap(value);
      children.push(svgElement(api, doc, "line", { className: "ci-grid", x1: x, y1: top, x2: x, y2: top + height }));
      children.push(svgElement(api, doc, "text", { className: "ci-tick", x: x, y: top + height + 16, "text-anchor": "middle" }, format(value, 1)));
    });
    display.forEach(function (item, index) {
      var y = yMap(index);
      var className = item.covered ? "ci-covered" : "ci-missed";
      children.push(svgElement(api, doc, "line", { className: "ci-interval " + className, x1: xMap(item.lower), y1: y, x2: xMap(item.upper), y2: y }));
      children.push(svgElement(api, doc, "line", { className: className, x1: xMap(item.lower), y1: y - 4, x2: xMap(item.lower), y2: y + 4, "stroke-width": 2 }));
      children.push(svgElement(api, doc, "line", { className: className, x1: xMap(item.upper), y1: y - 4, x2: xMap(item.upper), y2: y + 4, "stroke-width": 2 }));
      children.push(svgElement(api, doc, "circle", { className: className + " ci-mean", cx: xMap(item.center), cy: y, r: 3.3 }));
      children.push(svgElement(api, doc, "text", { className: "ci-tick", x: left - 7, y: y + 4, "text-anchor": "end" }, String(item.index)));
    });
    return svgElement(api, doc, "svg", { className: "ci-chart", viewBox: "0 0 760 315", role: "img", "aria-labelledby": prefix + "-chart-title " + prefix + "-chart-desc" }, children);
  }

  function row(api, doc, cells) {
    return element(api, doc, "tr", {}, cells.map(function (cell, index) {
      return element(api, doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell);
    }));
  }

  function metric(api, doc, label, value) {
    return element(api, doc, "div", { className: "ci-metric" }, [element(api, doc, "span", {}, label), element(api, doc, "strong", {}, value)]);
  }

  function mount(root, api) {
    var doc = root && root.ownerDocument;
    if (!doc) return;
    installStyles(doc);
    SERIAL += 1;
    var prefix = "ci-" + SERIAL;
    var state = {
      config: copyConfig(DEFAULTS),
      revealed: false,
      predictions: { coverage: null, variance: null, selection: null }
    };
    var questions = [
      {
        key: "coverage",
        prompt: "重复抽样造出许多 95% 区间时，‘95%’首先描述什么？",
        choices: [
          { value: "long-run", label: "方法的长期覆盖率" },
          { value: "observed", label: "这个已观测区间含 μ 的概率" },
          { value: "always", label: "每个区间都含 μ" }
        ],
        expected: "long-run"
      },
      {
        key: "variance",
        prompt: "正态总体均值区间里，σ 已知与未知时应优先怎样选？",
        choices: [
          { value: "zt", label: "已知用 z；未知用 t" },
          { value: "tz", label: "已知用 t；未知用 z" },
          { value: "same", label: "两种始终同宽" }
        ],
        expected: "zt"
      },
      {
        key: "selection",
        prompt: "看过样本后再从 z 区间与 t 区间挑更窄者，会怎样？",
        choices: [
          { value: "break", label: "名义覆盖率不再自动保证" },
          { value: "preserve", label: "仍精确保持 95%" },
          { value: "wider", label: "一定变得更宽" }
        ],
        expected: "break"
      }
    ];

    var gate = element(api, doc, "section", { className: "ci-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(api, doc, "h3", { id: prefix + "-gate-title" }, "预测门：先决定区间的语义，再揭示覆盖账本"));
    gate.appendChild(element(api, doc, "p", { className: "ci-intro" }, "先完成三项判断；提交前只保留你的选择，不显示模拟区间、覆盖计数或答案。"));
    questions.forEach(function (question) {
      var fieldset = element(api, doc, "fieldset", { className: "ci-question" });
      fieldset.appendChild(element(api, doc, "legend", {}, question.prompt));
      var choiceRow = element(api, doc, "div", { className: "ci-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice.value;
          renderPrediction();
        });
        choice.button = button;
        choiceRow.appendChild(button);
      });
      question.choiceRow = choiceRow;
      fieldset.appendChild(choiceRow);
      gate.appendChild(fieldset);
    });
    var actions = element(api, doc, "div", { className: "ci-actions" });
    var reveal = element(api, doc, "button", { type: "button", className: "ci-primary" }, "提交预测并揭示");
    var reset = element(api, doc, "button", { type: "button" }, "重置");
    var feedback = element(api, doc, "p", { className: "ci-feedback", "aria-live": "polite" }, "");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);

    var stage = element(api, doc, "section", { className: "ci-revealed", hidden: true, "aria-labelledby": prefix + "-result-title" });
    stage.appendChild(element(api, doc, "h4", { id: prefix + "-result-title" }, "揭示实验：固定 seed 的重复抽样覆盖账本"));
    stage.appendChild(element(api, doc, "p", { className: "ci-note" }, "改变参数会重新计算同一规则下的模拟；绿色线段覆盖真均值，红色线段漏掉真均值。模拟用于看见长期频率，不替代区间定理。"));
    var layout = element(api, doc, "div", { className: "ci-layout" });
    var controls = element(api, doc, "section", { className: "ci-controls", "aria-labelledby": prefix + "-controls-title" });
    controls.appendChild(element(api, doc, "h4", { id: prefix + "-controls-title" }, "参数"));
    var confidence = element(api, doc, "select", { "aria-label": "置信水平" }, [
      element(api, doc, "option", { value: "0.9" }, "90%"),
      element(api, doc, "option", { value: "0.95" }, "95%"),
      element(api, doc, "option", { value: "0.99" }, "99%")
    ]);
    var variance = element(api, doc, "select", { "aria-label": "方差是否已知" }, [
      element(api, doc, "option", { value: "known" }, "σ 已知：z 区间"),
      element(api, doc, "option", { value: "unknown" }, "σ 未知：t 区间")
    ]);
    var rule = element(api, doc, "select", { "aria-label": "分析规则" }, [
      element(api, doc, "option", { value: "preplanned" }, "预先规定一种方法"),
      element(api, doc, "option", { value: "selected" }, "看结果后选较窄者")
    ]);
    controls.appendChild(element(api, doc, "div", { className: "ci-control" }, [element(api, doc, "label", {}, "置信水平"), confidence]));
    controls.appendChild(element(api, doc, "div", { className: "ci-control" }, [element(api, doc, "label", {}, "方差状态"), variance]));
    controls.appendChild(element(api, doc, "div", { className: "ci-control" }, [element(api, doc, "label", {}, "分析规则"), rule]));

    function rangeControl(label, key, min, max, step, digits) {
      var output = element(api, doc, "output", {}, format(state.config[key], digits));
      var input = element(api, doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = Number(input.value);
        output.textContent = format(state.config[key], digits);
        renderResult();
      });
      return element(api, doc, "div", { className: "ci-control" }, [element(api, doc, "label", {}, [label + " = ", output]), input]);
    }
    controls.appendChild(rangeControl("样本量 n", "n", 4, 60, 1, 0));
    controls.appendChild(rangeControl("总体标准差 σ", "sigma", 2, 20, 0.5, 1));
    controls.appendChild(rangeControl("重复次数", "repetitions", 40, 180, 8, 0));
    controls.appendChild(element(api, doc, "p", { className: "ci-note" }, "事后选窄者只在 sigma 已知时开放，此时 z 与 t 都可计算；选择本身依赖样本，因此不再是预先固定的构造。sigma 未知时不会伪造 oracle z 候选。"));
    layout.appendChild(controls);

    var stageFrame = element(api, doc, "div", { className: "ci-stage-frame" });
    var chartHost = element(api, doc, "div", {});
    var metrics = element(api, doc, "div", { className: "ci-metrics", "aria-label": "区间指标" });
    var ledger = element(api, doc, "div", { className: "ci-ledger" });
    stageFrame.appendChild(chartHost);
    stageFrame.appendChild(metrics);
    stageFrame.appendChild(ledger);
    layout.appendChild(stageFrame);
    stage.appendChild(layout);
    stage.appendChild(element(api, doc, "p", { className: "ci-caution" }, "读法纪律：覆盖率是重复抽样下的规则频率；对已经算出的某一个区间，参数不是“以 95% 概率在里面”。已知 σ 的 z 构造、未知 σ 的 t 构造和看结果后选方法是三种不同的分析规则。"));
    root.replaceChildren(gate, stage);
    if (root.classList) root.classList.add("ci-lab");

    function renderPrediction() {
      questions.forEach(function (question) {
        question.choices.forEach(function (choice) {
          choice.button.setAttribute("aria-pressed", state.predictions[question.key] === choice.value ? "true" : "false");
        });
      });
    }

    function syncControls() {
      var selectedRule = state.config.rule === "selected";
      var unknownOption = variance.querySelector('option[value="unknown"]');
      if (selectedRule && state.config.variance !== "known") state.config.variance = "known";
      if (unknownOption) unknownOption.disabled = selectedRule;
      confidence.value = String(state.config.confidence);
      variance.value = state.config.variance;
      rule.value = state.config.rule;
      controls.querySelectorAll("input[type=range]").forEach(function (input) {
        var key = input.getAttribute("aria-label") === "样本量 n" ? "n" : input.getAttribute("aria-label") === "总体标准差 σ" ? "sigma" : "repetitions";
        input.value = String(state.config[key]);
        var output = input.parentNode.querySelector("output");
        if (output) output.textContent = format(state.config[key], key === "sigma" ? 1 : 0);
      });
    }

    function renderResult() {
      if (!state.revealed) return;
      var result = simulate(state.config);
      replaceChildren(chartHost, chart(api, doc, result, prefix));
      replaceChildren(metrics, [
        metric(api, doc, "经验覆盖", format(result.coverage * 100, 1) + "%"),
        metric(api, doc, "目标覆盖", format(result.target * 100, 1) + "%"),
        metric(api, doc, "首个样本均值", format(result.observed.center, 2)),
        metric(api, doc, "首个区间半宽", format(result.observed.margin, 2))
      ]);
      var body = element(api, doc, "table", {});
      body.appendChild(element(api, doc, "caption", {}, "当前规则的结果账本；覆盖计数来自 " + result.config.repetitions + " 次重复抽样。"));
      body.appendChild(element(api, doc, "thead", {}, [row(api, doc, ["栏位", "数值", "解释"]) ]));
      var rows = [
        ["首个样本", "x̄=" + format(result.observed.center, 2) + "，s=" + format(result.observed.standardDeviation, 2), "一个数据集的点估计与样本波动"],
        ["首个区间", "[" + format(result.observed.lower, 2) + ", " + format(result.observed.upper, 2) + "]", result.observed.method],
        ["临界值", result.config.rule === "preplanned" && result.config.variance === "known" ? "z=" + format(result.theoreticalZ, 3) : result.config.rule === "preplanned" ? "t=" + format(result.theoreticalT, 3) : "每个样本比较 z 与 t", "临界值来自预先规定或选择规则"],
        ["覆盖计数", result.coverageCount + "/" + result.config.repetitions, "重复抽样中区间包含真 μ 的次数"],
        ["选择计数", result.config.rule === "selected" ? "z " + result.selectedZ + " 次；t " + result.selectedT + " 次" : "不适用", "事后选窄者时才记录"]
      ];
      body.appendChild(element(api, doc, "tbody", {}, rows.map(function (items) { return row(api, doc, items); })));
      replaceChildren(ledger, body);
    }

    confidence.addEventListener("change", function () { state.config.confidence = Number(confidence.value); renderResult(); });
    variance.addEventListener("change", function () { state.config.variance = variance.value; renderResult(); });
    rule.addEventListener("change", function () { state.config.rule = rule.value; syncControls(); renderResult(); });
    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return state.predictions[question.key] === null; });
      if (missing.length) {
        feedback.textContent = "请先完成三个预测。";
        feedback.className = "ci-feedback ci-warn";
        return;
      }
      state.revealed = true;
      stage.hidden = false;
      syncControls();
      renderResult();
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中；现在可以切换方差状态与分析规则。";
      feedback.className = "ci-feedback " + (correct === questions.length ? "ci-pass" : "ci-warn");
      announce(api, root, feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state.config = copyConfig(DEFAULTS);
      state.revealed = false;
      state.predictions = { coverage: null, variance: null, selection: null };
      stage.hidden = true;
      feedback.textContent = "已重置；答案与账本再次隐藏。";
      feedback.className = "ci-feedback";
      renderPrediction();
      syncControls();
      announce(api, root, "区间估计预测与实验已重置。");
    });
    renderPrediction();
    syncControls();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("confidence-intervals self-test failed: " + message);
    }
    function close(left, right, tolerance, message) {
      assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")");
    }
    close(zCritical(0.95), 1.959964, 1e-6, "z critical");
    close(tCritical(0.95, 15), 2.13145, 1e-5, "t critical exact inversion");
    close(tCritical(0.99, 3), 5.84091, 1e-5, "small-df 99 percent t critical");
    close(sampleStd([1, 2, 3]), 1, 1e-12, "sample standard deviation");
    var known = intervalFromSample([498, 502, 500, 500], copyConfig({ mu: 500, sigma: 2, n: 4, confidence: 0.95, repetitions: 40, variance: "known", rule: "preplanned", seed: 1 }), "known");
    assert(known.method.indexOf("z") >= 0 && known.margin > 0, "known variance uses z");
    var unknown = intervalFromSample([498, 502, 500, 500], copyConfig({ mu: 500, sigma: 2, n: 4, confidence: 0.95, repetitions: 40, variance: "unknown", rule: "preplanned", seed: 1 }), "unknown");
    assert(unknown.method.indexOf("t") >= 0 && unknown.critical > known.critical, "unknown variance uses t");
    var selected = chooseInterval([498, 502, 500, 500], copyConfig({ mu: 500, sigma: 2, n: 4, confidence: 0.95, repetitions: 40, variance: "known", rule: "selected", seed: 1 }));
    assert(selected.candidates && selected.margin <= selected.candidates.z.margin + 1e-12 && selected.margin <= selected.candidates.t.margin + 1e-12, "selection chooses narrower candidate");
    var invalidSelection = false;
    try { chooseInterval([498, 502, 500, 500], copyConfig({ variance: "unknown", rule: "selected" })); } catch (error) { invalidSelection = error instanceof RangeError; }
    assert(invalidSelection, "unknown sigma cannot use oracle z candidate");
    var resultA = simulate(DEFAULTS);
    var resultB = simulate(DEFAULTS);
    assert(JSON.stringify(resultA) === JSON.stringify(resultB), "fixed seed reproducibility");
    assert(resultA.intervals.length === DEFAULTS.repetitions && resultA.coverageCount >= 0 && resultA.coverageCount <= DEFAULTS.repetitions, "coverage ledger bounds");
    assert(resultA.observed.lower < resultA.observed.upper, "interval endpoints ordered");
    assert(simulate({ n: 60, sigma: 8, confidence: 0.99, repetitions: 40, variance: "known", rule: "preplanned", seed: 7 }).theoreticalZ > 2.5, "known variance parameter path");
    var threw = false;
    try { zCritical(0.8); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "unsupported confidence rejected");
    threw = false;
    try { tCritical(0.95, 1); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "too few observations rejected");
    assert(copyConfig({ n: 100, repetitions: 10, variance: "known", rule: "selected" }).n === 60, "config clamp");
    return { checks: checks };
  }

  return {
    DEFAULTS: DEFAULTS,
    zCritical: zCritical,
    tCritical: tCritical,
    sampleStd: sampleStd,
    intervalFromSample: intervalFromSample,
    chooseInterval: chooseInterval,
    simulate: simulate,
    selfTest: selfTest,
    mount: mount
  };
});
