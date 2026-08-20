(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("gravitational-chirp", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("gravitational-chirp self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("gravitational-chirp self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var G = 6.67430e-11;
  var C = 299792458;
  var MSUN = 1.98847e30;
  var PI = Math.PI;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-gravitational-chirp-styles";
  var SERIAL = 0;
  var DEFAULTS = { mcSource: 28, fObserved: 30, redshift: 0 };

  var PRESETS = [
    { id: "stellar", label: "源帧：Mc=10, f=30", mcSource: 10, fObserved: 30, redshift: 0 },
    { id: "reference", label: "参考：Mc=28, f=30", mcSource: 28, fObserved: 30, redshift: 0 },
    { id: "heavy", label: "高质量：Mc=50, f=30", mcSource: 50, fObserved: 30, redshift: 0 },
    { id: "redshifted", label: "演示红移：Mc=28, z=1", mcSource: 28, fObserved: 30, redshift: 1 }
  ];

  var STYLE_TEXT = [
    ".gc-lab{--gc-blue:var(--cl-blue,#315f9d);--gc-gold:var(--cl-gold,#9b6a12);--gc-green:var(--cl-green,#39734d);--gc-red:var(--cl-red,#b64335);--gc-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    "html[data-theme=\"dark\"] .gc-lab{--gc-blue:#83c8ff;--gc-gold:#e2b458;--gc-green:#72bd8b;--gc-red:#f08c7d;--gc-soft:#b8b2a7;}",
    ".gc-lab *,.gc-lab *::before,.gc-lab *::after{box-sizing:border-box;}.gc-lab [hidden]{display:none!important;}",
    ".gc-lab h3,.gc-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.gc-lab h3{font-size:1.18rem;}.gc-lab h4{font-size:1rem;}.gc-lab .gc-intro,.gc-lab .gc-note,.gc-lab .gc-feedback{color:var(--gc-soft);font-size:13px;line-height:1.7;}",
    ".gc-lab .gc-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--gc-gold);background:var(--bg);}.gc-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.gc-lab legend{margin-bottom:8px;color:var(--fg);font-weight:750;line-height:1.5;}.gc-lab .gc-question{min-width:0;margin:11px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.gc-lab .gc-question legend{color:var(--gc-soft);font-size:13px;font-weight:650;}",
    ".gc-lab .gc-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.gc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.gc-lab button:hover{border-color:var(--accent);}.gc-lab button[aria-pressed=\"true\"],.gc-lab button.gc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.gc-lab button:disabled{cursor:not-allowed;opacity:.55;}.gc-lab button:focus-visible,.gc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".gc-lab .gc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.gc-lab .gc-actions>*{flex:1 1 180px;}.gc-lab .gc-feedback{min-height:2em;margin:8px 0;font-weight:700;}.gc-lab .gc-pass{color:var(--gc-green);}.gc-lab .gc-warn{color:var(--gc-red);}.gc-lab .gc-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}",
    ".gc-lab .gc-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0;}.gc-lab .gc-controls,.gc-lab .gc-stage{min-width:0;}.gc-lab .gc-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.gc-lab .gc-controls h4{margin:0;}.gc-lab .gc-preset-grid{display:grid;gap:7px;}.gc-lab .gc-preset-grid button{font-size:12px;text-align:left;}.gc-lab .gc-control{display:grid;gap:5px;min-width:0;}.gc-lab .gc-control label{color:var(--gc-soft);font-size:13px;font-weight:700;}.gc-lab .gc-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.gc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".gc-lab .gc-stage-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.gc-lab .gc-chart-title{display:flex;justify-content:space-between;gap:10px;margin:0 0 7px;color:var(--gc-soft);font-size:13px;}.gc-lab .gc-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.gc-lab .gc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.gc-lab .gc-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.gc-lab .gc-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.62;}.gc-lab .gc-zero{stroke:var(--gc-gold);stroke-width:1.2;stroke-dasharray:4 4;}.gc-lab .gc-curve-low{fill:none;stroke:var(--gc-gold);stroke-width:1.9;stroke-dasharray:6 4;stroke-linecap:round;stroke-linejoin:round;}.gc-lab .gc-curve-current{fill:none;stroke:var(--gc-blue);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round;}.gc-lab .gc-curve-high{fill:none;stroke:var(--gc-red);stroke-width:1.9;stroke-dasharray:2 3;stroke-linecap:round;stroke-linejoin:round;}.gc-lab .gc-label{font-size:11px;}.gc-lab .gc-chart-label{font-size:12px;font-weight:750;}",
    ".gc-lab .gc-legend{display:flex;flex-wrap:wrap;gap:7px 15px;margin:8px 2px 0;color:var(--gc-soft);font-size:12px;}.gc-lab .gc-legend-item{display:inline-flex;align-items:center;gap:6px;}.gc-lab .gc-swatch{display:inline-block;width:25px;height:0;border-top:3px solid currentColor;}.gc-lab .gc-swatch-low{color:var(--gc-gold);border-top-style:dashed;}.gc-lab .gc-swatch-current{color:var(--gc-blue);}.gc-lab .gc-swatch-high{color:var(--gc-red);border-top-style:dotted;}",
    ".gc-lab .gc-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 12px;}.gc-lab .gc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.gc-lab .gc-metric:nth-child(1),.gc-lab .gc-metric:nth-child(4){border-top-color:var(--gc-blue);}.gc-lab .gc-metric:nth-child(2),.gc-lab .gc-metric:nth-child(5){border-top-color:var(--gc-gold);}.gc-lab .gc-metric:nth-child(3),.gc-lab .gc-metric:nth-child(6){border-top-color:var(--gc-red);}.gc-lab .gc-metric span{display:block;color:var(--gc-soft);font-size:11.5px;line-height:1.4;}.gc-lab .gc-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".gc-lab .gc-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.gc-lab table{width:100%;min-width:860px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.gc-lab caption{padding:0 0 7px;text-align:left;color:var(--gc-soft);font-size:12px;line-height:1.55;}.gc-lab th,.gc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.gc-lab th{color:var(--gc-soft);font-size:11.5px;font-weight:750;}.gc-lab td:nth-child(2){white-space:nowrap;font-weight:700;}.gc-lab .gc-caution{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--gc-green);background:var(--bg);color:var(--gc-soft);font-size:12.5px;line-height:1.7;}",
    "@media(max-width:900px){.gc-lab .gc-layout{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:700px){.gc-lab .gc-choice-row{grid-template-columns:minmax(0,1fr);}.gc-lab .gc-metrics{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:430px){.gc-lab .gc-stage-frame{padding:6px;}.gc-lab table{font-size:11.5px;}.gc-lab th,.gc-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.gc-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function validatePositive(name, value) {
    if (!finite(value) || !(value > 0)) throw new RangeError(name + " 必须是正的有限数。");
    return value;
  }

  function validateRedshift(z) {
    if (!finite(z) || z < 0) throw new RangeError("redshift 必须是非负有限数。");
    return z;
  }

  function chirpRate(fHz, chirpMassSolar) {
    validatePositive("f", fHz);
    validatePositive("chirp mass", chirpMassSolar);
    var massSeconds = G * chirpMassSolar * MSUN / Math.pow(C, 3);
    return (96 / 5) * Math.pow(PI, 8 / 3) * Math.pow(massSeconds, 5 / 3) * Math.pow(fHz, 11 / 3);
  }

  function timeToCoalescence(fHz, chirpMassSolar) {
    validatePositive("f", fHz);
    validatePositive("chirp mass", chirpMassSolar);
    var massSeconds = G * chirpMassSolar * MSUN / Math.pow(C, 3);
    return (5 / 256) * Math.pow(1 / massSeconds, 5 / 3) * Math.pow(PI * fHz, -8 / 3);
  }

  function frequencyAtTime(fStart, chirpMassSolar, elapsed) {
    validatePositive("f", fStart);
    validatePositive("chirp mass", chirpMassSolar);
    if (!finite(elapsed) || elapsed < 0) throw new RangeError("elapsed 必须是非负有限数。");
    var tau = timeToCoalescence(fStart, chirpMassSolar);
    if (elapsed >= tau) return Infinity;
    return fStart * Math.pow(1 - elapsed / tau, -3 / 8);
  }

  function observedParameters(mcSource, fObserved, redshift) {
    validatePositive("source chirp mass", mcSource);
    validatePositive("observed GW frequency", fObserved);
    validateRedshift(redshift);
    var factor = 1 + redshift;
    var mcObserved = factor * mcSource;
    var fSource = factor * fObserved;
    var sourceRate = chirpRate(fSource, mcSource);
    var observedRate = chirpRate(fObserved, mcObserved);
    var sourceTau = timeToCoalescence(fSource, mcSource);
    var observedTau = timeToCoalescence(fObserved, mcObserved);
    return {
      mcSource: mcSource,
      mcObserved: mcObserved,
      fSource: fSource,
      fObserved: fObserved,
      fOrbitalObserved: fObserved / 2,
      redshift: redshift,
      sourceRate: sourceRate,
      observedRate: observedRate,
      sourceTau: sourceTau,
      observedTau: observedTau,
      timeDilationCheck: observedTau / sourceTau,
      redshiftMassCheck: mcObserved / mcSource
    };
  }

  function chirpSeries(fStart, chirpMassSolar, endFraction, points) {
    validatePositive("f", fStart);
    validatePositive("chirp mass", chirpMassSolar);
    if (!finite(endFraction) || endFraction <= 0 || endFraction >= 1) throw new RangeError("endFraction 必须在 (0,1) 内。");
    if (!Number.isInteger(points) || points < 2 || points > 512) throw new RangeError("points 必须是 2 到 512 的整数。");
    var tau = timeToCoalescence(fStart, chirpMassSolar);
    var end = endFraction * tau;
    var series = [];
    for (var i = 0; i < points; i += 1) {
      var elapsed = end * i / (points - 1);
      series.push({ elapsed: elapsed, frequency: frequencyAtTime(fStart, chirpMassSolar, elapsed) });
    }
    return { tau: tau, end: end, series: series };
  }

  function analyze(input) {
    var config = input || {};
    var mcSource = config.mcSource === undefined ? DEFAULTS.mcSource : Number(config.mcSource);
    var fObserved = config.fObserved === undefined ? DEFAULTS.fObserved : Number(config.fObserved);
    var redshift = config.redshift === undefined ? DEFAULTS.redshift : Number(config.redshift);
    var result = observedParameters(mcSource, fObserved, redshift);
    var baseMass = 28;
    var baseFrequency = 30;
    result.massRateScale = Math.pow(result.mcObserved / baseMass, 5 / 3);
    result.frequencyRateScale = Math.pow(result.fObserved / baseFrequency, 11 / 3);
    result.massTimeScale = Math.pow(result.mcObserved / baseMass, -5 / 3);
    result.frequencyTimeScale = Math.pow(result.fObserved / baseFrequency, -8 / 3);
    result.series = chirpSeries(result.fObserved, result.mcObserved, 0.97, 96);
    result.comparisons = [0.5, 1, 2].map(function (ratio) {
      return { ratio: ratio, chirp: chirpSeries(result.fObserved, result.mcObserved * ratio, 0.97, 96) };
    });
    return result;
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

  function seconds(value) {
    if (!finite(value)) return "∞";
    if (value < 1) return (value * 1000).toFixed(2) + " ms";
    if (value < 60) return value.toFixed(3) + " s";
    return (value / 60).toFixed(3) + " min";
  }

  function metricNode(api, doc, label, value) {
    return element(api, doc, "div", { className: "gc-metric" }, [element(api, doc, "span", {}, label), element(api, doc, "strong", {}, value)]);
  }

  function ledgerRow(api, doc, cells) {
    return element(api, doc, "tr", {}, cells.map(function (cell, index) { return element(api, doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell); }));
  }

  function drawChart(api, doc, result, prefix) {
    var allPoints = [];
    result.comparisons.forEach(function (comparison) { comparison.chirp.series.forEach(function (point) { allPoints.push(point.frequency); }); });
    var yMin = result.fObserved;
    var yMax = Math.max.apply(Math, allPoints);
    if (!(yMax > yMin)) yMax = yMin * 1.5;
    var pad = Math.max(1, 0.08 * (yMax - yMin));
    yMin = Math.max(0, yMin - pad * 0.2);
    yMax += pad;
    var left = 52;
    var top = 24;
    var width = 696;
    var height = 246;
    var timeEnd = result.series.end;
    function xMap(time) { return left + (timeEnd === 0 ? 0 : time / timeEnd) * width; }
    function yMap(frequency) { return top + (yMax - frequency) / (yMax - yMin) * height; }
    var children = [
      svgElement(api, doc, "title", { id: prefix + "-chart-title" }, "观测帧最低阶 inspiral chirp"),
      svgElement(api, doc, "desc", { id: prefix + "-chart-desc" }, "在 Newtonian circular adiabatic leading-order 模型中，观测到的引力波频率随观测时间加速上升；三条线比较不同 redshifted chirp mass。"),
      svgElement(api, doc, "line", { className: "gc-axis", x1: left, y1: top + height, x2: left + width, y2: top + height }),
      svgElement(api, doc, "line", { className: "gc-axis", x1: left, y1: top, x2: left, y2: top + height }),
      svgElement(api, doc, "line", { className: "gc-zero", x1: left, y1: yMap(result.fObserved), x2: left + width, y2: yMap(result.fObserved) }),
      svgElement(api, doc, "text", { className: "gc-chart-label", x: left + 7, y: top + 15 }, "f_GW,obs(t_obs)"),
      svgElement(api, doc, "text", { className: "gc-label", x: left + width - 3, y: top + height + 19, "text-anchor": "end" }, "t_obs=" + seconds(timeEnd)),
      svgElement(api, doc, "text", { className: "gc-label", x: left - 7, y: top + 4, "text-anchor": "end" }, "Hz")
    ];
    result.comparisons.forEach(function (comparison) {
      var className = comparison.ratio === 1 ? "gc-curve-current" : comparison.ratio < 1 ? "gc-curve-low" : "gc-curve-high";
      var d = comparison.chirp.series.filter(function (point) { return point.elapsed <= timeEnd; }).map(function (point, index) { return (index === 0 ? "M" : "L") + " " + xMap(point.elapsed).toFixed(2) + " " + yMap(point.frequency).toFixed(2); }).join(" ");
      children.push(svgElement(api, doc, "path", { className: className, d: d }));
    });
    children.push(svgElement(api, doc, "text", { className: "gc-label", x: left + 7, y: top + height - 8 }, "横线：当前 f_GW,obs 起点；末端接近模型 coalescence"));
    return svgElement(api, doc, "svg", { className: "gc-svg", viewBox: "0 0 760 300", role: "img", "aria-labelledby": prefix + "-chart-title " + prefix + "-chart-desc" }, children);
  }

  function mount(root, api) {
    var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    SERIAL += 1;
    var prefix = "gc-" + SERIAL;
    var state = { mcSource: DEFAULTS.mcSource, fObserved: DEFAULTS.fObserved, redshift: DEFAULTS.redshift, revealed: false, predictions: { mass: null, frequency: null, orbital: null, frame: null, regime: null } };
    var questions = [
      {
        key: "mass",
        prompt: "固定 f_GW 时，把 redshifted chirp mass 加倍，df/dt 与 coalescence 时间怎样缩放？",
        choices: [{ value: "mass-up-time-down", label: "速率 ×2^(5/3)，时间 ×2^(−5/3)" }, { value: "linear", label: "速率 ×2，时间 ×1/2" }, { value: "same", label: "两者不变" }],
        expected: "mass-up-time-down",
        explanation: "由 df/dt∝Mc^(5/3)、τ∝Mc^(−5/3) 得出；这里的质量应是对应帧的 redshifted chirp mass。"
      },
      {
        key: "frequency",
        prompt: "固定 redshifted chirp mass，把 f_GW 加倍，df/dt 与 τ 怎样缩放？",
        choices: [{ value: "frequency-up-time-down", label: "速率 ×2^(11/3)，时间 ×2^(−8/3)" }, { value: "linear", label: "速率 ×2，时间 ×1/2" }, { value: "same", label: "两者不变" }],
        expected: "frequency-up-time-down",
        explanation: "频率幂次不同：df/dt∝f^(11/3)，而 τ∝f^(−8/3)。"
      },
      {
        key: "orbital",
        prompt: "本实验公式中的 f 是哪一个频率？",
        choices: [{ value: "gw-double", label: "GW 频率，圆轨道时约 2f_orb" }, { value: "orbital", label: "就是轨道频率" }, { value: "twice-gw", label: "是 GW 频率的两倍" }],
        expected: "gw-double",
        explanation: "主导 quadrupole 辐射的 GW 频率约为圆轨道频率的两倍；读公式时不能把 f_GW 和 f_orb 混用。"
      },
      {
        key: "frame",
        prompt: "源帧质量 Mc_src 与观测 chirp mass 的关系是什么？",
        choices: [{ value: "redshifted", label: "Mc_obs=(1+z)Mc_src" }, { value: "same", label: "Mc_obs=Mc_src" }, { value: "inverse", label: "Mc_obs=Mc_src/(1+z)" }],
        expected: "redshifted",
        explanation: "f_obs=f_src/(1+z)、dt_obs=(1+z)dt_src 后，观测帧公式用 Mc_obs=(1+z)Mc_src；实验默认 z=0 时两者才相同。"
      },
      {
        key: "regime",
        prompt: "把最低阶公式一直外推到 ISCO、并合、铃宕，是否仍是同一模型的可靠结论？",
        choices: [{ value: "no", label: "不是：近 ISCO/并合会失效" }, { value: "yes", label: "是：公式精确到铃宕" }, { value: "fit", label: "只要调参就能拟合真实事件" }],
        expected: "no",
        explanation: "这是圆轨道、绝热、领先 PN 的 inspiral toy；近 ISCO、强场并合和 ringdown 需要更高阶/数值相对论或完整波形模型。"
      }
    ];

    function makeQuestion(question) {
      var fieldset = element(api, doc, "fieldset", { className: "gc-question" });
      fieldset.appendChild(element(api, doc, "legend", {}, question.prompt));
      var row = element(api, doc, "div", { className: "gc-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; renderPrediction(); });
        choice.button = button;
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    var gate = element(api, doc, "section", { className: "gc-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(api, doc, "h3", { id: prefix + "-gate-title" }, "预测门：先看幂律，再看观测帧"));
    gate.appendChild(element(api, doc, "p", { className: "gc-intro" }, "先回答五问；提交前不显示 chirp 曲线、答案或数字账本。实验画的是可解释的最低阶模型，不做真实事件拟合。"));
    questions.forEach(function (question) { gate.appendChild(makeQuestion(question)); });
    var gateActions = element(api, doc, "div", { className: "gc-actions" });
    var reveal = element(api, doc, "button", { type: "button", className: "gc-primary" }, "提交预测并揭示");
    var reset = element(api, doc, "button", { type: "button" }, "重置");
    var feedback = element(api, doc, "p", { className: "gc-feedback", "aria-live": "polite" }, "");
    gateActions.appendChild(reveal);
    gateActions.appendChild(reset);
    gate.appendChild(gateActions);
    gate.appendChild(feedback);

    var presetGrid = element(api, doc, "div", { className: "gc-preset-grid", role: "group", "aria-label": "chirp 预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(api, doc, "button", { type: "button", "aria-pressed": preset.id === "reference" ? "true" : "false" }, preset.label);
      button.addEventListener("click", function () { state.mcSource = preset.mcSource; state.fObserved = preset.fObserved; state.redshift = preset.redshift; render(); });
      presetButtons.push({ preset: preset, node: button });
      presetGrid.appendChild(button);
    });
    var massOutput = element(api, doc, "output", {}, formatNumber(api, state.mcSource, 2) + " M_sun");
    var massInput = element(api, doc, "input", { type: "range", min: "5", max: "60", step: "0.5", value: String(state.mcSource), "aria-label": "源帧 chirp mass" });
    var frequencyOutput = element(api, doc, "output", {}, formatNumber(api, state.fObserved, 1) + " Hz");
    var frequencyInput = element(api, doc, "input", { type: "range", min: "10", max: "200", step: "1", value: String(state.fObserved), "aria-label": "观测 GW 频率" });
    var redshiftOutput = element(api, doc, "output", {}, formatNumber(api, state.redshift, 2));
    var redshiftInput = element(api, doc, "input", { type: "range", min: "0", max: "2", step: "0.05", value: String(state.redshift), "aria-label": "source redshift" });
    massInput.addEventListener("input", function () { state.mcSource = Number(massInput.value); render(); });
    frequencyInput.addEventListener("input", function () { state.fObserved = Number(frequencyInput.value); render(); });
    redshiftInput.addEventListener("input", function () { state.redshift = Number(redshiftInput.value); render(); });
    var controls = element(api, doc, "section", { className: "gc-controls", "aria-labelledby": prefix + "-controls-title" }, [
      element(api, doc, "h4", { id: prefix + "-controls-title" }, "参数"),
      presetGrid,
      element(api, doc, "div", { className: "gc-control" }, [element(api, doc, "label", {}, ["源帧 chirp mass Mc_src = ", massOutput]), massInput]),
      element(api, doc, "div", { className: "gc-control" }, [element(api, doc, "label", {}, ["观测 GW 频率 f_obs = ", frequencyOutput]), frequencyInput]),
      element(api, doc, "div", { className: "gc-control" }, [element(api, doc, "label", {}, ["source redshift z = ", redshiftOutput]), redshiftInput]),
      element(api, doc, "p", { className: "gc-note" }, "曲线横轴是观测时间、纵轴是观测到的 GW 频率；源帧质量先换成 Mc_obs=(1+z)Mc_src。圆轨道频率约为 f_GW/2。")
    ]);

    var chartHost = element(api, doc, "div", { className: "gc-stage-frame" });
    var legend = element(api, doc, "div", { className: "gc-legend", "aria-label": "图例" }, [
      element(api, doc, "span", { className: "gc-legend-item" }, [element(api, doc, "i", { className: "gc-swatch gc-swatch-low" }), "Mc_obs/2"]),
      element(api, doc, "span", { className: "gc-legend-item" }, [element(api, doc, "i", { className: "gc-swatch gc-swatch-current" }), "当前 Mc_obs"]),
      element(api, doc, "span", { className: "gc-legend-item" }, [element(api, doc, "i", { className: "gc-swatch gc-swatch-high" }), "2Mc_obs"])
    ]);
    var metricGrid = element(api, doc, "div", { className: "gc-metrics", "aria-label": "chirp 读数" });
    var metricSource = element(api, doc, "div");
    var metricObserved = element(api, doc, "div");
    var metricFrequency = element(api, doc, "div");
    var metricRate = element(api, doc, "div");
    var metricTime = element(api, doc, "div");
    var metricFrame = element(api, doc, "div");
    [metricSource, metricObserved, metricFrequency, metricRate, metricTime, metricFrame].forEach(function (node) { metricGrid.appendChild(node); });
    var ledgerBody = element(api, doc, "tbody");
    var table = element(api, doc, "table", { "aria-label": "引力波 chirp 逐项账本" }, [
      element(api, doc, "caption", {}, "逐项账本：最低阶圆轨道 inspiral 的公式、缩放与边界"),
      element(api, doc, "thead", {}, [element(api, doc, "tr", {}, [
        element(api, doc, "th", { scope: "col" }, "对象"),
        element(api, doc, "th", { scope: "col" }, "当前读数"),
        element(api, doc, "th", { scope: "col" }, "解析定义 / 适用域")
      ])]),
      ledgerBody
    ]);
    var caution = element(api, doc, "p", { className: "gc-caution" }, "反例与迁移：这不是 LIGO 真实事件的拟合器。模型假设圆轨道、绝热 inspiral、领先 PN；接近 ISCO、强场并合和 ringdown 时需要更完整的相对论波形。红移把源帧质量与观测 chirp mass 绑定，却不让一个 z=0 toy 自动成为天体物理测量。 ");
    var stage = element(api, doc, "section", { className: "gc-revealed", hidden: true, "aria-labelledby": prefix + "-stage-title" });
    stage.appendChild(element(api, doc, "h3", { id: prefix + "-stage-title" }, "chirp 曲线与缩放账本"));
    stage.appendChild(element(api, doc, "div", { className: "gc-layout" }, [
      controls,
      element(api, doc, "section", { className: "gc-stage" }, [
        element(api, doc, "div", { className: "gc-chart-title" }, [element(api, doc, "span", {}, "观测帧 chirp"), element(api, doc, "span", { className: "gc-note" }, "固定公式，不拟合事件")]),
        chartHost,
        legend,
        metricGrid,
        element(api, doc, "div", { className: "gc-ledger" }, table),
        caution
      ])
    ]));
    root.replaceChildren(gate, stage);
    root.classList.add("gc-lab");

    function renderPrediction() {
      questions.forEach(function (question) { question.choices.forEach(function (choice) { choice.button.setAttribute("aria-pressed", state.predictions[question.key] === choice.value ? "true" : "false"); }); });
      var complete = questions.every(function (question) { return state.predictions[question.key] !== null; });
      reveal.disabled = !complete || state.revealed;
      if (!state.revealed) {
        feedback.textContent = complete ? "预测已记录；点击提交后才会揭示结果。" : "请先完成五个预测。";
        feedback.className = "gc-feedback";
      }
    }

    function renderMetrics(result) {
      replaceChildren(metricSource, metricNode(api, doc, "Mc_src", formatNumber(api, result.mcSource, 3) + " M_sun"));
      replaceChildren(metricObserved, metricNode(api, doc, "Mc_obs=(1+z)Mc_src", formatNumber(api, result.mcObserved, 3) + " M_sun"));
      replaceChildren(metricFrequency, metricNode(api, doc, "f_GW,obs / f_orb", formatNumber(api, result.fObserved, 3) + " / " + formatNumber(api, result.fOrbitalObserved, 3) + " Hz"));
      replaceChildren(metricRate, metricNode(api, doc, "df_obs/dt_obs", formatNumber(api, result.observedRate, 4) + " Hz/s"));
      replaceChildren(metricTime, metricNode(api, doc, "τ_obs", seconds(result.observedTau)));
      replaceChildren(metricFrame, metricNode(api, doc, "z；τ_obs/τ_src", formatNumber(api, result.redshift, 2) + "；" + formatNumber(api, result.timeDilationCheck, 3)));
    }

    function renderLedger(result) {
      var rows = [
        ledgerRow(api, doc, ["chirp 质量", formatNumber(api, result.mcSource, 5) + " → " + formatNumber(api, result.mcObserved, 5) + " M_sun", "Mc_obs=(1+z)Mc_src；源帧与观测帧不可混写"]),
        ledgerRow(api, doc, ["频率定义", formatNumber(api, result.fObserved, 5) + " Hz GW", "f_GW≈2f_orb（圆轨道主导 quadrupole）"]),
        ledgerRow(api, doc, ["chirp 率", formatNumber(api, result.observedRate, 7) + " Hz/s", "(96/5)π^(8/3)(GMc_obs/c^3)^(5/3)f_obs^(11/3)"]),
        ledgerRow(api, doc, ["time-to-coalescence", seconds(result.observedTau), "(5/256)(c^3/GMc_obs)^(5/3)(πf_obs)^(−8/3)"]),
        ledgerRow(api, doc, ["质量缩放", formatNumber(api, result.massRateScale, 5), "固定 f：df/dt∝Mc_obs^(5/3)，τ∝Mc_obs^(−5/3)"]),
        ledgerRow(api, doc, ["频率缩放", formatNumber(api, result.frequencyRateScale, 5), "相对 Mc=28M_sun、f=30Hz：df/dt∝f^(11/3)，τ∝f^(−8/3)"]),
        ledgerRow(api, doc, ["源 / 观测时间", formatNumber(api, result.sourceTau, 7) + " → " + formatNumber(api, result.observedTau, 7) + " s", "dt_obs=(1+z)dt_src；此处使用同一最低阶模型"]),
        ledgerRow(api, doc, ["适用域", "inspiral toy", "圆轨道、绝热、领先 PN；近 ISCO/并合/ringdown 不可外推"])
      ];
      replaceChildren(ledgerBody, rows);
    }

    function render() {
      massInput.value = String(state.mcSource);
      frequencyInput.value = String(state.fObserved);
      redshiftInput.value = String(state.redshift);
      massOutput.textContent = formatNumber(api, state.mcSource, 2) + " M_sun";
      frequencyOutput.textContent = formatNumber(api, state.fObserved, 1) + " Hz";
      redshiftOutput.textContent = formatNumber(api, state.redshift, 2);
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.preset.mcSource === state.mcSource && item.preset.fObserved === state.fObserved && item.preset.redshift === state.redshift ? "true" : "false"); });
      stage.hidden = !state.revealed;
      if (!state.revealed) return;
      var result = analyze({ mcSource: state.mcSource, fObserved: state.fObserved, redshift: state.redshift });
      replaceChildren(chartHost, drawChart(api, doc, result, prefix));
      renderMetrics(result);
      renderLedger(result);
    }

    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return state.predictions[question.key] === null; });
      if (missing.length) {
        feedback.textContent = "请先完成五个预测。";
        feedback.className = "gc-feedback gc-warn";
        return;
      }
      state.revealed = true;
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      render();
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中。幂律、频率定义、观测帧和模型边界已列入账本。";
      feedback.className = "gc-feedback " + (correct === questions.length ? "gc-pass" : "gc-warn");
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
    });

    reset.addEventListener("click", function () {
      state.mcSource = DEFAULTS.mcSource;
      state.fObserved = DEFAULTS.fObserved;
      state.redshift = DEFAULTS.redshift;
      state.revealed = false;
      state.predictions = { mass: null, frequency: null, orbital: null, frame: null, regime: null };
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
      if (!condition) throw new Error("gravitational-chirp self-test failed: " + message);
    }
    function close(left, right, tolerance, message) {
      assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")");
    }
    var rate = chirpRate(30, 28);
    var tau = timeToCoalescence(30, 28);
    close(rate * tau, (3 / 8) * 30, 1e-10, "rate-time analytic identity");
    close(chirpRate(60, 28) / rate, Math.pow(2, 11 / 3), 1e-12, "frequency scaling");
    close(timeToCoalescence(60, 28) / tau, Math.pow(2, -8 / 3), 1e-12, "frequency time scaling");
    close(chirpRate(30, 56) / rate, Math.pow(2, 5 / 3), 1e-12, "mass scaling");
    close(timeToCoalescence(30, 56) / tau, Math.pow(2, -5 / 3), 1e-12, "mass time scaling");
    var redshifted = observedParameters(10, 30, 1);
    close(redshifted.mcObserved, 20, 1e-12, "redshifted chirp mass");
    close(redshifted.fSource, 60, 1e-12, "source frequency conversion");
    close(redshifted.observedRate, chirpRate(30, 20), 1e-12, "observed-frame rate");
    close(redshifted.observedTau / redshifted.sourceTau, 2, 1e-12, "observed time dilation");
    close(redshifted.fOrbitalObserved, 15, 1e-12, "GW/orbital frequency relation");
    close(frequencyAtTime(30, 28, 0), 30, 1e-12, "initial frequency endpoint");
    assert(frequencyAtTime(30, 28, tau) === Infinity, "coalescence endpoint");
    var series = chirpSeries(30, 28, 0.97, 16);
    assert(series.series.length === 16 && series.series[0].frequency === 30 && series.series[15].frequency > 30, "chirp series endpoints");
    var repeated = analyze({ mcSource: 28, fObserved: 30, redshift: 0 });
    var repeatedAgain = analyze({ mcSource: 28, fObserved: 30, redshift: 0 });
    assert(JSON.stringify(repeated.series) === JSON.stringify(repeatedAgain.series), "deterministic series");
    var threw = false;
    try { chirpRate(0, 28); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "zero frequency rejected");
    threw = false;
    try { timeToCoalescence(30, -1); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "negative chirp mass rejected");
    threw = false;
    try { observedParameters(28, 30, -0.1); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "negative redshift rejected");
    threw = false;
    try { frequencyAtTime(30, 28, -1); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "negative elapsed rejected");
    return { checks: checks };
  }

  return {
    G: G,
    C: C,
    MSUN: MSUN,
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    chirpRate: chirpRate,
    timeToCoalescence: timeToCoalescence,
    frequencyAtTime: frequencyAtTime,
    observedParameters: observedParameters,
    chirpSeries: chirpSeries,
    analyze: analyze,
    selfTest: selfTest,
    mount: mount
  };
});
