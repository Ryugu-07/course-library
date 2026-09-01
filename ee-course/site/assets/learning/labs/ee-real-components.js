(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-real-components", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-real-components self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-real-components self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "ee-real-components";
  var STYLE_ID = "ee-real-components-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = {
    resistance: 10000,
    resistanceTolerancePct: 1,
    resistanceTempcoPpm: 100,
    capacitance: 100e-9,
    capacitanceTolerancePct: 10,
    capacitanceTempcoPpm: 30,
    capacitorEsr: 0.8,
    capacitorEsl: 1e-9,
    inductance: 10e-6,
    inductanceTolerancePct: 20,
    inductanceTempcoPpm: 100,
    inductanceEsr: 0.6,
    inductorParasiticC: 30e-12,
    temperatureDelta: 40,
    frequency: 1e6
  };
  var QUESTIONS = [
    { key: "tolerance", prompt: "在默认设定下，10 kΩ 电阻的 40 °C 温漂更接近哪一个量级？", expected: "subpercent", choices: [["subpercent", "小于 1%"], ["percent10", "约 10%"], ["hundred", "约 100%"]] },
    { key: "resonance", prompt: "测试频率越过电容的自谐振频率后，串联 ESL 会使它更像什么？", expected: "inductor", choices: [["capacitor", "仍是理想电容"], ["inductor", "电感性元件"], ["open", "立刻变成开路"]] },
    { key: "boundary", prompt: "只看标称 C 和 L，能否可靠预测高频阻抗？", expected: "no", choices: [["yes", "可以"], ["no", "不可以，还要寄生和布局"], ["always", "只要单位正确就可以"]] }
  ];

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) {
    var number = Number(value);
    if (!isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
  }
  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function formatControl(key, value) {
    if (key === "temperatureDelta") return format(value, 0) + " °C";
    if (key === "frequency") return format(value / 1000, value < 100000 ? 1 : 0) + " kHz";
    if (key === "capacitorEsr") return format(value, 2) + " Ω";
    if (key === "capacitorEsl") return format(value * 1e9, 2) + " nH";
    if (key === "inductorParasiticC") return format(value * 1e12, 1) + " pF";
    return format(value, 2);
  }
  function normalize(input) {
    var source = input || {};
    return {
      resistance: clamp(finite(source.resistance === undefined ? DEFAULTS.resistance : source.resistance, "resistance"), 10, 1e6),
      resistanceTolerancePct: clamp(finite(source.resistanceTolerancePct === undefined ? DEFAULTS.resistanceTolerancePct : source.resistanceTolerancePct, "resistance tolerance"), 0, 10),
      resistanceTempcoPpm: clamp(finite(source.resistanceTempcoPpm === undefined ? DEFAULTS.resistanceTempcoPpm : source.resistanceTempcoPpm, "resistance tempco"), -2000, 2000),
      capacitance: clamp(finite(source.capacitance === undefined ? DEFAULTS.capacitance : source.capacitance, "capacitance"), 1e-12, 1e-3),
      capacitanceTolerancePct: clamp(finite(source.capacitanceTolerancePct === undefined ? DEFAULTS.capacitanceTolerancePct : source.capacitanceTolerancePct, "capacitance tolerance"), 0, 80),
      capacitanceTempcoPpm: clamp(finite(source.capacitanceTempcoPpm === undefined ? DEFAULTS.capacitanceTempcoPpm : source.capacitanceTempcoPpm, "capacitance tempco"), -20000, 20000),
      capacitorEsr: clamp(finite(source.capacitorEsr === undefined ? DEFAULTS.capacitorEsr : source.capacitorEsr, "capacitor ESR"), 0, 50),
      capacitorEsl: clamp(finite(source.capacitorEsl === undefined ? DEFAULTS.capacitorEsl : source.capacitorEsl, "capacitor ESL"), 1e-12, 100e-9),
      inductance: clamp(finite(source.inductance === undefined ? DEFAULTS.inductance : source.inductance, "inductance"), 1e-9, 1),
      inductanceTolerancePct: clamp(finite(source.inductanceTolerancePct === undefined ? DEFAULTS.inductanceTolerancePct : source.inductanceTolerancePct, "inductance tolerance"), 0, 80),
      inductanceTempcoPpm: clamp(finite(source.inductanceTempcoPpm === undefined ? DEFAULTS.inductanceTempcoPpm : source.inductanceTempcoPpm, "inductance tempco"), -20000, 20000),
      inductanceEsr: clamp(finite(source.inductanceEsr === undefined ? DEFAULTS.inductanceEsr : source.inductanceEsr, "inductor ESR"), 0, 50),
      inductorParasiticC: clamp(finite(source.inductorParasiticC === undefined ? DEFAULTS.inductorParasiticC : source.inductorParasiticC, "inductor parasitic capacitance"), 1e-15, 1e-6),
      temperatureDelta: clamp(finite(source.temperatureDelta === undefined ? DEFAULTS.temperatureDelta : source.temperatureDelta, "temperature delta"), -80, 150),
      frequency: clamp(finite(source.frequency === undefined ? DEFAULTS.frequency : source.frequency, "frequency"), 1, 200e6)
    };
  }
  function computeRealComponents(input) {
    var state = normalize(input);
    var omega = 2 * Math.PI * state.frequency;
    var tempFactorR = Math.max(0.01, 1 + state.resistanceTempcoPpm * state.temperatureDelta * 1e-6);
    var tempFactorC = Math.max(0.01, 1 + state.capacitanceTempcoPpm * state.temperatureDelta * 1e-6);
    var tempFactorL = Math.max(0.01, 1 + state.inductanceTempcoPpm * state.temperatureDelta * 1e-6);
    var resistanceAtTemp = state.resistance * tempFactorR;
    var rLow = state.resistance * (1 - state.resistanceTolerancePct / 100) * tempFactorR;
    var rHigh = state.resistance * (1 + state.resistanceTolerancePct / 100) * tempFactorR;
    var capacitanceAtTemp = state.capacitance * tempFactorC;
    var capacitanceLow = Math.min(state.capacitance * (1 - state.capacitanceTolerancePct / 100) * tempFactorC, state.capacitance * (1 + state.capacitanceTolerancePct / 100) * tempFactorC);
    var capacitanceHigh = Math.max(state.capacitance * (1 - state.capacitanceTolerancePct / 100) * tempFactorC, state.capacitance * (1 + state.capacitanceTolerancePct / 100) * tempFactorC);
    var inductanceAtTemp = state.inductance * tempFactorL;
    var inductanceLow = Math.min(state.inductance * (1 - state.inductanceTolerancePct / 100) * tempFactorL, state.inductance * (1 + state.inductanceTolerancePct / 100) * tempFactorL);
    var inductanceHigh = Math.max(state.inductance * (1 - state.inductanceTolerancePct / 100) * tempFactorL, state.inductance * (1 + state.inductanceTolerancePct / 100) * tempFactorL);
    var capIdealReactance = -1 / (omega * capacitanceAtTemp);
    var capRealReactance = omega * state.capacitorEsl + capIdealReactance;
    var capImpedanceMagnitude = Math.sqrt(state.capacitorEsr * state.capacitorEsr + capRealReactance * capRealReactance);
    var capPhaseDeg = Math.atan2(capRealReactance, state.capacitorEsr) * 180 / Math.PI;
    var capSelfResonance = 1 / (2 * Math.PI * Math.sqrt(capacitanceAtTemp * state.capacitorEsl));
    var capSelfResonanceLow = 1 / (2 * Math.PI * Math.sqrt(capacitanceHigh * state.capacitorEsl));
    var capSelfResonanceHigh = 1 / (2 * Math.PI * Math.sqrt(capacitanceLow * state.capacitorEsl));

    function seriesInductorParallelCapacitance(inductance) {
      var inductiveReactance = omega * inductance;
      var seriesDenominator = state.inductanceEsr * state.inductanceEsr + inductiveReactance * inductiveReactance;
      var admittanceReal = state.inductanceEsr / seriesDenominator;
      var admittanceImag = omega * state.inductorParasiticC - inductiveReactance / seriesDenominator;
      var admittanceMagnitudeSquared = Math.max(admittanceReal * admittanceReal + admittanceImag * admittanceImag, 1e-30);
      var real = admittanceReal / admittanceMagnitudeSquared;
      var imag = -admittanceImag / admittanceMagnitudeSquared;
      return { real: real, imag: imag, magnitude: Math.sqrt(real * real + imag * imag), phaseDeg: Math.atan2(imag, real) * 180 / Math.PI };
    }
    var inductorImpedance = seriesInductorParallelCapacitance(inductanceAtTemp);
    var indReactance = omega * inductanceAtTemp;
    var indSelfResonance = 1 / (2 * Math.PI * Math.sqrt(inductanceAtTemp * state.inductorParasiticC));
    var indSelfResonanceLow = 1 / (2 * Math.PI * Math.sqrt(inductanceHigh * state.inductorParasiticC));
    var indSelfResonanceHigh = 1 / (2 * Math.PI * Math.sqrt(inductanceLow * state.inductorParasiticC));
    var idealCapMagnitude = Math.abs(capIdealReactance);
    var capParasiticSharePct = idealCapMagnitude > 0 ? Math.abs(omega * state.capacitorEsl) / idealCapMagnitude * 100 : 0;
    var resistanceDriftPct = (tempFactorR - 1) * 100;
    var capImpedanceAt = function (capacitance) {
      var reactance = omega * state.capacitorEsl - 1 / (omega * capacitance);
      return Math.sqrt(state.capacitorEsr * state.capacitorEsr + reactance * reactance);
    };
    var capImpedanceCorners = [capImpedanceAt(capacitanceLow), capImpedanceAt(capacitanceHigh)];
    var indImpedanceCorners = [seriesInductorParallelCapacitance(inductanceLow).magnitude, seriesInductorParallelCapacitance(inductanceHigh).magnitude];
    var capRegime = capRealReactance < 0 ? "电容性" : capRealReactance > 0 ? "电感性" : "谐振附近";
    var indRegime = inductorImpedance.imag > 0 ? "电感性" : inductorImpedance.imag < 0 ? "电容性" : "谐振附近";
    return {
      config: state,
      omega: omega,
      resistanceAtTemp: resistanceAtTemp,
      resistanceLow: Math.min(rLow, rHigh),
      resistanceHigh: Math.max(rLow, rHigh),
      resistanceDriftPct: resistanceDriftPct,
      capacitanceAtTemp: capacitanceAtTemp,
      capacitanceLow: capacitanceLow,
      capacitanceHigh: capacitanceHigh,
      inductanceAtTemp: inductanceAtTemp,
      inductanceLow: inductanceLow,
      inductanceHigh: inductanceHigh,
      capIdealReactance: capIdealReactance,
      capRealReactance: capRealReactance,
      capImpedanceMagnitude: capImpedanceMagnitude,
      capImpedanceMagnitudeLow: Math.min.apply(Math, capImpedanceCorners),
      capImpedanceMagnitudeHigh: Math.max.apply(Math, capImpedanceCorners),
      capPhaseDeg: capPhaseDeg,
      capSelfResonance: capSelfResonance,
      capSelfResonanceLow: capSelfResonanceLow,
      capSelfResonanceHigh: capSelfResonanceHigh,
      capParasiticSharePct: capParasiticSharePct,
      indReactance: indReactance,
      indImpedanceReal: inductorImpedance.real,
      indImpedanceImag: inductorImpedance.imag,
      indImpedanceMagnitude: inductorImpedance.magnitude,
      indImpedanceMagnitudeLow: Math.min.apply(Math, indImpedanceCorners),
      indImpedanceMagnitudeHigh: Math.max.apply(Math, indImpedanceCorners),
      indPhaseDeg: inductorImpedance.phaseDeg,
      indSelfResonance: indSelfResonance,
      indSelfResonanceLow: indSelfResonanceLow,
      indSelfResonanceHigh: indSelfResonanceHigh,
      capRegime: capRegime,
      indRegime: indRegime,
      toleranceSpanPct: (Math.max(rLow, rHigh) - Math.min(rLow, rHigh)) / state.resistance * 100
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgText(doc, parent, value, x, y, attrs) {
    var all = attrs || {}; all.x = x; all.y = y;
    parent.appendChild(svgElement(doc, "text", all, value));
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--erc-blue:#2c679d;--erc-red:#b7473b;--erc-green:#39734d;--erc-gold:#9a6a10;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .erc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--erc-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .erc-primary{border-color:var(--erc-blue);background:var(--erc-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .erc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .erc-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .erc-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .erc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .erc-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .erc-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--erc-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--erc-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .erc-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .erc-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .erc-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .erc-metric{min-width:0;padding:9px;border-top:2px solid var(--erc-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .erc-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .erc-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .erc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:480px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .erc-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .erc-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .erc-choice-grid,[data-learning-lab="' + LAB_ID + '"] .erc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .erc-choice-grid,[data-learning-lab="' + LAB_ID + '"] .erc-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .erc-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
    var live = rootNode.querySelector("[data-erc-live]");
    if (live) live.textContent = message;
  }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 780 360"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "电阻温漂与电容电感寄生等效和自谐振示意");
    node.appendChild(svgElement(doc, "title", {}, "真实元件的寄生等效与自谐振"));
    node.appendChild(svgElement(doc, "desc", {}, "左侧画出电阻温漂、电容的 ESR 与 ESL 串联，以及真正跨接绕组两端的 Cpar；右侧比较电容和电感在自谐振前后的复阻抗状态。"));
    var blue = "var(--erc-blue)", red = "var(--erc-red)", green = "var(--erc-green)", gold = "var(--erc-gold)";
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 28, width: 326, height: 144, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" }));
    svgText(doc, node, "电容：ESR + ESL + C", 30, 50, { "font-size": 13, "font-weight": 700 });
    svgText(doc, node, "端口", 27, 105, { "font-size": 11, fill: green });
    node.appendChild(svgElement(doc, "line", { x1: 54, y1: 100, x2: 82, y2: 100, stroke: green, "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "rect", { x: 82, y: 86, width: 48, height: 28, rx: 3, fill: "var(--bg,white)", stroke: red, "stroke-width": 2 }));
    svgText(doc, node, "ESR", 106, 105, { "font-size": 11, "text-anchor": "middle", fill: red });
    node.appendChild(svgElement(doc, "line", { x1: 130, y1: 100, x2: 160, y2: 100, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "path", { d: "M160 100 q8 -18 16 0 t16 0 t16 0", fill: "none", stroke: gold, "stroke-width": 2 }));
    svgText(doc, node, "ESL", 191, 76, { "font-size": 11, "text-anchor": "middle", fill: gold });
    node.appendChild(svgElement(doc, "line", { x1: 208, y1: 100, x2: 239, y2: 100, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 239, y1: 80, x2: 239, y2: 120, stroke: blue, "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 254, y1: 80, x2: 254, y2: 120, stroke: blue, "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 254, y1: 100, x2: 289, y2: 100, stroke: "currentColor", "stroke-width": 2 }));
    svgText(doc, node, "C ideal", 247, 139, { "font-size": 11, "text-anchor": "middle", fill: blue });
    svgText(doc, node, "f = " + format(result.config.frequency / 1000, 1) + " kHz", 30, 151, { "font-size": 11 });
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 190, width: 326, height: 144, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" }));
    svgText(doc, node, "电感：ESR + L，并联 Cpar", 30, 212, { "font-size": 13, "font-weight": 700 });
    node.appendChild(svgElement(doc, "line", { x1: 43, y1: 267, x2: 78, y2: 267, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "rect", { x: 78, y: 253, width: 46, height: 28, rx: 3, fill: "var(--bg,white)", stroke: red, "stroke-width": 2 }));
    svgText(doc, node, "ESR", 101, 272, { "font-size": 11, "text-anchor": "middle", fill: red });
    node.appendChild(svgElement(doc, "path", { d: "M124 267 q8 -18 16 0 t16 0 t16 0 t16 0", fill: "none", stroke: blue, "stroke-width": 2 }));
    svgText(doc, node, "L", 171, 241, { "font-size": 12, fill: blue });
    node.appendChild(svgElement(doc, "line", { x1: 188, y1: 267, x2: 289, y2: 267, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 43, y1: 267, x2: 43, y2: 220, stroke: gold, "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 43, y1: 220, x2: 222, y2: 220, stroke: gold, "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 222, y1: 220, x2: 222, y2: 230, stroke: gold, "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 206, y1: 230, x2: 238, y2: 230, stroke: gold, "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 206, y1: 242, x2: 238, y2: 242, stroke: gold, "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 222, y1: 242, x2: 222, y2: 267, stroke: gold, "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 222, y1: 267, x2: 289, y2: 267, stroke: gold, "stroke-width": 2 }));
    svgText(doc, node, "Cpar 跨绕组两端", 154, 216, { "font-size": 10, "text-anchor": "middle", fill: gold });
    svgText(doc, node, "fSR(L) = " + format(result.indSelfResonance / 1e6, 2) + " MHz；" + result.indRegime, 30, 313, { "font-size": 11 });
    var left = 392, right = 754, top = 58, bottom = 274;
    node.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-opacity": ".6" }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", "stroke-opacity": ".6" }));
    svgText(doc, node, "|Z| / Ω（复阻抗）", left, 40, { "font-size": 12, "font-weight": 700 });
    svgText(doc, node, "f / fSR", right, bottom + 30, { "font-size": 11, "text-anchor": "end" });
    var path = [], indPath = [], maxZ = Math.max(result.config.capacitorEsr * 1.5, result.capImpedanceMagnitude, result.indImpedanceMagnitude, 1);
    for (var i = 0; i <= 72; i += 1) {
      var ratio = 0.05 * Math.pow(100, i / 72);
      var f = result.capSelfResonance * ratio;
      var w = 2 * Math.PI * f;
      var xReact = w * result.config.capacitorEsl - 1 / (w * result.capacitanceAtTemp);
      var z = Math.sqrt(result.config.capacitorEsr * result.config.capacitorEsr + xReact * xReact);
      var xL = w * result.inductanceAtTemp, dL = result.config.inductanceEsr * result.config.inductanceEsr + xL * xL;
      var yR = result.config.inductanceEsr / dL, yI = w * result.config.inductorParasiticC - xL / dL, y2 = Math.max(yR * yR + yI * yI, 1e-30);
      var zL = Math.sqrt(Math.pow(yR / y2, 2) + Math.pow(-yI / y2, 2));
      var x = left + (right - left) * Math.log(ratio / 0.05) / Math.log(100);
      var y = bottom - (bottom - top) * Math.min(1, z / maxZ), yL = bottom - (bottom - top) * Math.min(1, zL / maxZ);
      path.push((i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2));
      indPath.push((i ? "L" : "M") + x.toFixed(2) + " " + yL.toFixed(2));
    }
    var srX = left + (right - left) * Math.log(1 / 0.05) / Math.log(100);
    var indSrRatio = result.indSelfResonance / result.capSelfResonance;
    var indSrX = left + (right - left) * Math.log(Math.max(0.05, Math.min(5, indSrRatio)) / 0.05) / Math.log(100);
    node.appendChild(svgElement(doc, "line", { x1: srX, y1: top, x2: srX, y2: bottom, stroke: gold, "stroke-dasharray": "6 4", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: indSrX, y1: top, x2: indSrX, y2: bottom, stroke: red, "stroke-dasharray": "2 4", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "path", { d: path.join(" "), fill: "none", stroke: blue, "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "path", { d: indPath.join(" "), fill: "none", stroke: red, "stroke-width": 2 }));
    svgText(doc, node, "C 自谐振", srX + 5, top + 16, { "font-size": 10, fill: gold });
    svgText(doc, node, "L 自谐振", indSrX + 5, top + 31, { "font-size": 10, fill: red });
    svgText(doc, node, "蓝：C，红：L‖Cpar；相位 L = " + format(result.indPhaseDeg, 1) + "°", left + 4, 315, { "font-size": 10, fill: "var(--fg-soft,currentColor)" });
    svgText(doc, node, "当前 C：" + result.capRegime + "；L：" + result.indRegime, right - 4, top + 16, { "font-size": 10, "text-anchor": "end", fill: result.indRegime === "电感性" ? green : red });
  }
  function metric(doc, label, value) {
    return element(doc, "div", { className: "erc-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }
  function renderTable(doc, hostNode, result) {
    clear(hostNode);
    var rows = [
      ["电阻温度值", format(result.resistanceAtTemp, 2), "Ω；标称值乘温漂因子"],
      ["电阻容差包络", format(result.resistanceLow, 2) + " … " + format(result.resistanceHigh, 2), "Ω；容差 + 温漂教学包络"],
      ["电阻温漂", (result.resistanceDriftPct >= 0 ? "+" : "") + format(result.resistanceDriftPct, 3), "%"],
      ["电容温度值", format(result.capacitanceAtTemp * 1e9, 3), "nF；含温漂"],
      ["电容容差包络", format(result.capacitanceLow * 1e9, 3) + " … " + format(result.capacitanceHigh * 1e9, 3), "nF；容差 + 温漂最坏角点"],
      ["电容 |Z|", format(result.capImpedanceMagnitude, 3), "Ω；含 ESR/ESL，" + result.capRegime],
      ["电容相位", format(result.capPhaseDeg, 2), "°；复阻抗相位"],
      ["电容自谐振", format(result.capSelfResonance / 1e6, 3), "MHz；由 C 与 ESL 估算"],
      ["电感温度值", format(result.inductanceAtTemp * 1e6, 3), "µH；含温漂"],
      ["电感容差包络", format(result.inductanceLow * 1e6, 3) + " … " + format(result.inductanceHigh * 1e6, 3), "µH；容差 + 温漂最坏角点"],
      ["电感 |Z|", format(result.indImpedanceMagnitude, 3), "Ω；(R+jωL) 与 Cpar 的真实并联"],
      ["电感相位", format(result.indPhaseDeg, 2), "°；当前 " + result.indRegime],
      ["电感自谐振包络", format(result.indSelfResonanceLow / 1e6, 3) + " … " + format(result.indSelfResonanceHigh / 1e6, 3), "MHz；L 容差最坏包络"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "真实元件边界账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "读数" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = "";
    var shell = element(doc, "div", { className: "erc-shell" });
    shell.appendChild(element(doc, "h3", { text: "真实元件实验：容差、寄生与自谐振" }));
    shell.appendChild(element(doc, "p", { className: "erc-note", text: "先判断量级和失效方向；揭示后调节测试频率、ESR、ESL、寄生电容和温度。所有数值是教学仿真，不是某个器件的数据手册。" }));
    var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) {
      var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt }));
      var grid = element(doc, "div", { className: "erc-choice-grid" }); var buttons = [];
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0];
        button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; });
        buttons.push(button); grid.appendChild(button);
      });
      groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "erc-actions" });
    var reveal = element(doc, "button", { type: "button", className: "erc-primary", text: "提交预测并揭示", disabled: true });
    var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "erc-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "erc-controls" });
    var specs = [
      ["resistanceTolerancePct", "电阻容差", 0, 5, 0.1],
      ["temperatureDelta", "温度偏移", -40, 85, 5],
      ["capacitorEsr", "电容 ESR", 0.05, 5, 0.05],
      ["capacitorEsl", "电容 ESL", 0.1e-9, 10e-9, 0.1e-9],
      ["inductorParasiticC", "电感 Cpar", 1e-12, 200e-12, 1e-12],
      ["frequency", "测试频率", 1e3, 50e6, 1e3]
    ];
    var inputs = {}, outputs = {};
    specs.forEach(function (spec) {
      var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" });
      var wrap = element(doc, "div", { className: "erc-control" }, [label, output]);
      var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] });
      input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); });
      wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output;
    });
    results.appendChild(controls);
    var layout = element(doc, "div", { className: "erc-layout" }); var stage = element(doc, "div", { className: "erc-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage);
    var side = element(doc, "div"); var metrics = element(doc, "div", { className: "erc-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "erc-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "erc-note", text: "自谐振频率只是等效模型的估算；封装、焊盘、走线、偏置电压、温度和测量夹具会改变真实曲线。采购时必须回到具体数据手册的测试条件。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() {
      var result = computeRealComponents(state.config); results.hidden = !state.revealed;
      specs.forEach(function (spec) { outputs[spec[0]].textContent = formatControl(spec[0], result.config[spec[0]]); });
      drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "电容自谐振", format(result.capSelfResonance / 1e6, 2) + " MHz")); metrics.appendChild(metric(doc, "电感自谐振", format(result.indSelfResonance / 1e6, 2) + " MHz")); metrics.appendChild(metric(doc, "电容状态", result.capRegime)); metrics.appendChild(metric(doc, "电阻温漂", (result.resistanceDriftPct >= 0 ? "+" : "") + format(result.resistanceDriftPct, 3) + "%")); renderTable(doc, tableWrap, result);
    }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () {
      if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; }
      var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0);
      state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在调参，观察寄生和额定边界。"; render(); announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () { state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; specs.forEach(function (spec) { inputs[spec[0]].value = state.config[spec[0]]; }); render(); announce(api, rootNode, "真实元件实验已重置。"); });
    rootNode.appendChild(shell);
    rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-erc-live": true, "aria-live": "polite" }));
    render();
  }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeRealComponents(DEFAULTS);
    check(near(result.resistanceAtTemp, 10040), "resistor temperature drift");
    check(result.resistanceHigh > result.resistanceLow, "tolerance envelope");
    check(result.capacitanceLow < result.capacitanceAtTemp && result.capacitanceHigh > result.capacitanceAtTemp, "capacitor tolerance envelope");
    check(result.inductanceLow < result.inductanceAtTemp && result.inductanceHigh > result.inductanceAtTemp, "inductor tolerance envelope");
    check(result.capSelfResonance > result.config.frequency, "default capacitor is below self resonance");
    check(result.capRegime === "电容性", "default capacitor regime");
    check(computeRealComponents({ frequency: result.capSelfResonance * 2 }).capRegime === "电感性", "post-resonance regime");
    check(result.indImpedanceImag > 0 && result.indPhaseDeg > 0, "default inductor is inductive");
    var postInductor = computeRealComponents({ frequency: result.indSelfResonance * 2 });
    check(postInductor.indRegime === "电容性" && postInductor.indImpedanceImag < 0 && postInductor.indPhaseDeg < 0, "post-inductor-resonance capacitive regime");
    var nearResonance = computeRealComponents({ frequency: result.indSelfResonance * 0.9 });
    var nearOmega = 2 * Math.PI * nearResonance.config.frequency, nearXL = nearOmega * nearResonance.inductanceAtTemp;
    var nearDenominator = Math.pow(nearResonance.config.inductanceEsr, 2) + Math.pow(nearXL, 2);
    var nearYR = nearResonance.config.inductanceEsr / nearDenominator, nearYI = nearOmega * nearResonance.config.inductorParasiticC - nearXL / nearDenominator;
    var nearY2 = nearYR * nearYR + nearYI * nearYI;
    check(near(nearResonance.indImpedanceReal, nearYR / nearY2, 1e-9) && near(nearResonance.indImpedanceImag, -nearYI / nearY2, 1e-9), "parallel complex impedance");
    check(computeRealComponents({ capacitorEsl: 5e-9 }).capSelfResonance < result.capSelfResonance, "larger ESL lowers self resonance");
    check(isFinite(result.capImpedanceMagnitude) && isFinite(result.indImpedanceMagnitude), "finite impedances");
    var edge = computeRealComponents({ capacitanceTempcoPpm: -20000, inductanceTempcoPpm: -20000, temperatureDelta: 150 }); check(isFinite(edge.capSelfResonance) && isFinite(edge.indSelfResonance), "positive guarded temperature model");
    check(JSON.stringify(result) === JSON.stringify(computeRealComponents(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  var exported = { DEFAULTS: DEFAULTS, normalize: normalize, computeRealComponents: computeRealComponents, compute: computeRealComponents, mount: mount, selfTest: selfTest };
  return exported;
});
