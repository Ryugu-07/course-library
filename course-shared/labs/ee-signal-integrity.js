(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("ee-signal-integrity", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log("ee-signal-integrity self-test: PASS (" + report.checks + " checks)"); }
    catch (error) { console.error("ee-signal-integrity self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "ee-signal-integrity";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-" + NAME + "-styles";
  var INSTANCE = 0;
  var DEFAULTS = Object.freeze({ lengthM: 0.3, riseNs: 2, velocityMPerNs: 0.15, z0Ohm: 50, zLOhm: 75, termination: "open", bitRateMbps: 50, jitterPs: 80, amplitudeV: 1, couplingPct: 8, noisePct: 5 });
  var QUESTIONS = [
    { key: "length", prompt: "线长加倍时，单程传播延迟怎样变化？", expected: "double", choices: [["double", "加倍"], ["half", "减半"], ["same", "不变"]] },
    { key: "open", prompt: "理想开路负载的反射系数是？", expected: "positive", choices: [["positive", "正，约 +1"], ["negative", "负，约 -1"], ["zero", "零"]] },
    { key: "boundary", prompt: "长度不变而上升沿变快，应优先使用哪种模型？", expected: "transmission", choices: [["transmission", "传输线"], ["lumped", "集总"], ["neither", "都不需要"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function bounded(value, low, high, label) { return clamp(finite(value, label), low, high); }
  function choice(value, values, fallback) { var text = String(value); return values.indexOf(text) >= 0 ? text : fallback; }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) {
    if (value === Infinity) return "Infinity";
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function finiteOrInfinity(value, label) {
    var number = Number(value);
    if (number !== Infinity && !isFinite(number)) throw new RangeError(label + " must be finite or Infinity");
    return number;
  }
  function normalize(input) {
    var source = input || {};
    var terminationValue = source.termination === undefined ? DEFAULTS.termination : source.termination;
    if (terminationValue === "custom") terminationValue = "numeric";
    var zLSource = source.zLOhm === undefined ? source.zLohm : source.zLOhm;
    if (zLSource === undefined) zLSource = DEFAULTS.zLOhm;
    var bitRateSource = source.bitRateMbps === undefined ? source.rateMbps : source.bitRateMbps;
    if (bitRateSource === undefined && source.rateKbps !== undefined) bitRateSource = Number(source.rateKbps) / 1000;
    if (bitRateSource === undefined) bitRateSource = DEFAULTS.bitRateMbps;
    var zLNumber = finiteOrInfinity(zLSource, "load impedance");
    return {
      lengthM: bounded(source.lengthM === undefined ? DEFAULTS.lengthM : source.lengthM, 0.01, 5, "length"),
      riseNs: bounded(source.riseNs === undefined ? DEFAULTS.riseNs : source.riseNs, 0.2, 50, "rise time"),
      velocityMPerNs: bounded(source.velocityMPerNs === undefined ? DEFAULTS.velocityMPerNs : source.velocityMPerNs, 0.05, 0.3, "propagation velocity"),
      z0Ohm: bounded(source.z0Ohm === undefined ? DEFAULTS.z0Ohm : source.z0Ohm, 20, 120, "characteristic impedance"),
      zLOhm: zLNumber === Infinity ? Infinity : clamp(zLNumber, 0, 1000),
      termination: choice(terminationValue, ["open", "matched", "short", "numeric"], DEFAULTS.termination),
      bitRateMbps: bounded(bitRateSource, 0.1, 1000, "bit rate"),
      jitterPs: bounded(source.jitterPs === undefined ? DEFAULTS.jitterPs : source.jitterPs, 0, 2000, "jitter"),
      amplitudeV: bounded(source.amplitudeV === undefined ? DEFAULTS.amplitudeV : source.amplitudeV, 0.1, 2, "incident amplitude"),
      couplingPct: bounded(source.couplingPct === undefined ? DEFAULTS.couplingPct : source.couplingPct, 0, 30, "crosstalk coupling"),
      noisePct: bounded(source.noisePct === undefined ? DEFAULTS.noisePct : source.noisePct, 0, 30, "noise")
    };
  }
  function computeSignal(input) {
    var config = normalize(input);
    var velocityMPerNs = config.velocityMPerNs;
    var tdNs = config.lengthM / velocityMPerNs;
    var roundTripNs = 2 * tdNs;
    var uiNs = 1000 / config.bitRateMbps;
    var jitterNs = config.jitterPs / 1000;
    var boundaryNs = 6 * tdNs;
    var loadImpedanceOhm = config.termination === "open" ? Infinity : config.termination === "short" ? 0 : config.termination === "matched" ? config.z0Ohm : config.zLOhm;
    var reflectionCoefficient = loadImpedanceOhm === Infinity ? 1 : (loadImpedanceOhm - config.z0Ohm) / (loadImpedanceOhm + config.z0Ohm);
    var reflectedStepV = reflectionCoefficient * config.amplitudeV;
    var crosstalkV = config.amplitudeV * config.couplingPct / 100;
    var noiseV = config.amplitudeV * config.noisePct / 100;
    var roundTripUiFraction = clamp(roundTripNs / uiNs, 0, 1);
    var riseUiFraction = clamp(config.riseNs / uiNs, 0, 1);
    var edgeClosurePct = clamp(config.riseNs / uiNs * 100, 0, 100);
    var propagationClosurePct = clamp(roundTripNs / uiNs * 100, 0, 100);
    var jitterClosurePct = clamp(jitterNs / uiNs * 100, 0, 100);
    var reflectionClosurePct = 30 * Math.abs(reflectionCoefficient) * (0.75 + 0.25 * roundTripUiFraction);
    var reflectionPenaltyV = config.amplitudeV * Math.abs(reflectionCoefficient) * (0.2 + 0.3 * roundTripUiFraction);
    var edgePenaltyV = config.amplitudeV * 0.2 * riseUiFraction;
    var propagationPenaltyV = config.amplitudeV * 0.1 * roundTripUiFraction;
    var eyeHeightV = Math.max(0, config.amplitudeV - 2 * crosstalkV - 2 * noiseV - reflectionPenaltyV - edgePenaltyV - propagationPenaltyV);
    var eyeWidthPct = clamp(100 - edgeClosurePct - 0.35 * propagationClosurePct - jitterClosurePct - reflectionClosurePct - config.couplingPct - config.noisePct, 0, 100);
    var regime = config.riseNs <= boundaryNs ? "传输线模型优先" : "集总模型可先用";
    return {
      config: config,
      velocityMPerNs: velocityMPerNs,
      tdNs: tdNs,
      propagationDelayNs: tdNs,
      roundTripNs: roundTripNs,
      uiNs: uiNs,
      bitRateMbps: config.bitRateMbps,
      jitterNs: jitterNs,
      boundaryNs: boundaryNs,
      loadImpedanceOhm: loadImpedanceOhm,
      reflectionCoefficient: reflectionCoefficient,
      gamma: reflectionCoefficient,
      reflectedStepV: reflectedStepV,
      crosstalkV: crosstalkV,
      noiseV: noiseV,
      edgeClosurePct: edgeClosurePct,
      propagationClosurePct: propagationClosurePct,
      jitterClosurePct: jitterClosurePct,
      reflectionClosurePct: reflectionClosurePct,
      reflectionPenaltyV: reflectionPenaltyV,
      eyeHeightV: eyeHeightV,
      eyeWidthPct: eyeWidthPct,
      regime: regime,
      settlingNs: roundTripNs * (1 + Math.abs(reflectionCoefficient)),
      integrityPass: eyeHeightV >= config.amplitudeV * 0.35 && eyeWidthPct >= 35,
      interpretation: regime + "；" + (reflectionCoefficient === 0 ? "负载匹配" : "需查看反射")
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "text") node.textContent = String(value); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); });
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; node.setAttribute(key, String(value)); });
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function svgText(doc, parent, text, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, text)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--esi-blue:#28659d;--esi-green:#39734d;--esi-gold:#9b6a12;--esi-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] [hidden]{display:none!important}[data-learning-lab="' + NAME + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input,[data-learning-lab="' + NAME + '"] select{font:inherit;letter-spacing:0}[data-learning-lab="' + NAME + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] button:hover{border-color:var(--esi-blue)}[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .esi-primary{background:var(--esi-blue);border-color:var(--esi-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:disabled{cursor:not-allowed;opacity:.55}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .esi-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + NAME + '"] .esi-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + NAME + '"] .esi-actions>*{flex:1 1 180px}[data-learning-lab="' + NAME + '"] .esi-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + NAME + '"] .esi-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + NAME + '"] .esi-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .esi-control label{font-size:12px;font-weight:700;line-height:1.4}[data-learning-lab="' + NAME + '"] .esi-control output{color:var(--esi-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] input[type=range],[data-learning-lab="' + NAME + '"] select{display:block;width:100%;min-height:44px}[data-learning-lab="' + NAME + '"] input[type=range]{accent-color:var(--esi-blue)}' +
      '[data-learning-lab="' + NAME + '"] .esi-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + NAME + '"] .esi-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .esi-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + NAME + '"] .esi-metric{min-width:0;padding:9px;border-top:2px solid var(--esi-blue);background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] .esi-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .esi-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .esi-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + NAME + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .esi-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + NAME + '"] .esi-layout{grid-template-columns:1fr}}@media(max-width:680px){[data-learning-lab="' + NAME + '"] .esi-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){[data-learning-lab="' + NAME + '"] .esi-choice-grid,[data-learning-lab="' + NAME + '"] .esi-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .esi-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-esi-live]"); if (live) live.textContent = message; }
  function drawReflection(doc, svg, result) {
    var left = 28, right = 405, base = 255, high = 112;
    svg.appendChild(svgElement(doc, "rect", { x: 14, y: 36, width: 407, height: 304, rx: 6, fill: "var(--bg,transparent)", stroke: "currentColor", "stroke-opacity": ".25" }));
    svgText(doc, svg, "阶跃与反射：源端到负载端", 28, 61, { "font-size": 13, "font-weight": 700 });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: base, x2: right, y2: base, stroke: "currentColor", "stroke-opacity": ".45" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: 86, x2: left, y2: base, stroke: "currentColor", "stroke-opacity": ".45" }));
    var plotWidth = right - left - 20;
    var delayFraction = clamp(result.tdNs / Math.max(result.roundTripNs * 3, 1), 0.12, 0.34);
    var incidentX = left + 22;
    var arrivalX = incidentX + plotWidth * delayFraction;
    var reflectX = arrivalX + plotWidth * delayFraction;
    var scale = Math.max(result.config.amplitudeV * 2, Math.abs(result.config.amplitudeV + result.reflectedStepV), 1);
    var incY = base - (result.config.amplitudeV / scale) * 120;
    var finalY = base - ((result.config.amplitudeV + result.reflectedStepV) / scale) * 120;
    svg.appendChild(svgElement(doc, "path", { d: "M" + left + " " + base + " L" + incidentX + " " + base + " L" + incidentX + " " + incY + " L" + arrivalX + " " + incY + " L" + arrivalX + " " + finalY + " L" + right + " " + finalY, fill: "none", stroke: "var(--esi-blue)", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "line", { x1: arrivalX, y1: 82, x2: arrivalX, y2: base + 2, stroke: "var(--esi-gold)", "stroke-width": 2, "stroke-dasharray": "6 4" }));
    svg.appendChild(svgElement(doc, "line", { x1: reflectX, y1: 82, x2: reflectX, y2: base + 2, stroke: "var(--esi-red)", "stroke-width": 2, "stroke-dasharray": "2 4" }));
    svgText(doc, svg, "入射", incidentX + 5, incY - 9, { "font-size": 10.5, fill: "var(--esi-blue)" });
    svgText(doc, svg, "t_d", arrivalX, 79, { "font-size": 10.5, "text-anchor": "middle", fill: "var(--esi-gold)" });
    svgText(doc, svg, "反射返回", reflectX, 96, { "font-size": 10.5, "text-anchor": "middle", fill: "var(--esi-red)" });
    svgText(doc, svg, "Z0=" + format(result.config.z0Ohm, 0) + " Ω · ZL=" + format(result.loadImpedanceOhm, 0) + " Ω", 28, 292, { "font-size": 10.5 });
    svgText(doc, svg, "Γ=" + format(result.gamma, 3) + " · Vref=" + format(result.reflectedStepV, 2) + " V", 28, 309, { "font-size": 11, fill: result.gamma === 0 ? "var(--esi-green)" : "var(--esi-red)" });
    svgText(doc, svg, result.regime + " · t_d=" + format(result.tdNs, 2) + " ns", 28, 326, { "font-size": 10.5 });
  }
  function drawEye(doc, svg, result) {
    var x = 450, y = 86, w = 364, h = 174;
    svg.appendChild(svgElement(doc, "rect", { x: 430, y: 36, width: 410, height: 304, rx: 6, fill: "var(--bg,transparent)", stroke: "currentColor", "stroke-opacity": ".25" }));
    svgText(doc, svg, "眼图代理：幅度和时间分别留下证据", 445, 61, { "font-size": 13, "font-weight": 700 });
    svg.appendChild(svgElement(doc, "rect", { x: x, y: y, width: w, height: h, fill: "none", stroke: "currentColor", "stroke-opacity": ".45" }));
    [0.25, 0.5, 0.75].forEach(function (fraction) { svg.appendChild(svgElement(doc, "line", { x1: x + w * fraction, y1: y, x2: x + w * fraction, y2: y + h, stroke: "currentColor", "stroke-opacity": ".16", "stroke-dasharray": "4 4" })); });
    [0.3, 0.7].forEach(function (fraction) { svg.appendChild(svgElement(doc, "line", { x1: x, y1: y + h * fraction, x2: x + w, y2: y + h * fraction, stroke: "currentColor", "stroke-opacity": ".16", "stroke-dasharray": "4 4" })); });
    var openingH = h * clamp(result.eyeHeightV / Math.max(result.config.amplitudeV, 0.001), 0.05, 0.9);
    var openingW = w * result.eyeWidthPct / 100;
    var top = y + h / 2 - openingH / 2; var bottom = y + h / 2 + openingH / 2; var left = x + w / 2 - openingW / 2; var right = x + w / 2 + openingW / 2;
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: right, y2: top, stroke: "var(--esi-green)", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "var(--esi-green)", "stroke-width": 3 }));
    for (var i = 0; i < 7; i += 1) {
      var wobble = (i - 3) * 2.2;
      svg.appendChild(svgElement(doc, "path", { d: "M" + x + " " + (top - 18 + wobble) + " C" + (x + 60) + " " + (top + 7 + wobble) + " " + (x + w - 60) + " " + (top - 7 - wobble) + " " + (x + w) + " " + (top + 18 - wobble) + " M" + x + " " + (bottom + 18 + wobble) + " C" + (x + 60) + " " + (bottom - 7 + wobble) + " " + (x + w - 60) + " " + (bottom + 7 - wobble) + " " + (x + w) + " " + (bottom - 18 - wobble), fill: "none", stroke: i === 3 ? "var(--esi-blue)" : "var(--esi-gold)", "stroke-opacity": i === 3 ? ".86" : ".34", "stroke-width": i === 3 ? 2.5 : 1.4 }));
    }
    svgText(doc, svg, "眼高 " + format(result.eyeHeightV, 2) + " V", x + 8, top - 10, { "font-size": 10.5, fill: "var(--esi-green)" });
    svgText(doc, svg, "眼宽 " + format(result.eyeWidthPct, 0) + "% UI", x + w - 8, y + h + 25, { "font-size": 10.5, "text-anchor": "end", fill: "var(--esi-green)" });
    svgText(doc, svg, "UI " + format(result.uiNs, 2) + " ns · 码率 " + format(result.bitRateMbps, 2) + " Mb/s · 抖动 " + format(result.jitterNs, 3) + " ns", 445, 298, { "font-size": 10.5 });
    svgText(doc, svg, "耦合 " + format(result.crosstalkV, 2) + " V · 噪声 " + format(result.noiseV, 2) + " V", 445, 316, { "font-size": 10.5 });
  }
  function draw(doc, svg, result) {
    clear(svg); svg.setAttribute("viewBox", "0 0 860 350"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "信号完整性传播延迟、反射、终端和眼图示意");
    svg.appendChild(svgElement(doc, "title", {}, "传播、反射与眼图")); svg.appendChild(svgElement(doc, "desc", {}, "左侧为一条信号线上的入射阶跃、负载到达和反射返回，右侧为显示眼高与眼宽的眼图代理。")); drawReflection(doc, svg, result); drawEye(doc, svg, result);
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "esi-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, target, result) {
    clear(target); var termination = result.config.termination === "open" ? "开路" : result.config.termination === "short" ? "短路" : result.config.termination === "numeric" ? "数值 ZL" : "匹配"; var rows = [
      ["单程/往返传播", format(result.tdNs, 2) + " / " + format(result.roundTripNs, 2), "ns；t_rt=2t_d"],
      ["UI / 码率", format(result.uiNs, 2) + " / " + format(result.bitRateMbps, 2), "ns / Mb/s；UI=1/码率"],
      ["抖动", format(result.jitterNs, 3), "ns；由 jitterPs 输入"],
      ["模型边界", format(result.boundaryNs, 2), "ns；6td 规则经验"],
      ["Z0 / ZL", format(result.config.z0Ohm, 1) + " / " + format(result.loadImpedanceOhm, 1), "Ω；开路为 Infinity，短路为 0"],
      ["负载终端", termination, "有效 ZL 进入 Γ=(ZL−Z0)/(ZL+Z0)"],
      ["反射系数 Γ", format(result.gamma, 3), "无量纲；ZL 与 Z0 的函数"],
      ["反射阶跃", format(result.reflectedStepV, 2), "V；ΓVinc"],
      ["串扰 / 噪声代理", format(result.crosstalkV, 2) + " / " + format(result.noiseV, 2), "V；幅度百分比输入"],
      ["眼高 / 眼宽", format(result.eyeHeightV, 2) + " / " + format(result.eyeWidthPct, 1), "V / % UI；含边沿、传播、Γ、抖动"],
      ["判读", result.interpretation, "不等于接收器合规"]
    ];
    var table = element(doc, "table", { "aria-label": "信号完整性账本" }); table.appendChild(element(doc, "caption", { text: "信号完整性账本" })); table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })]))); var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); table.appendChild(body); target.appendChild(table);
  }
  function addSelect(doc, controls, state, field, labelText, options, onChange) { var id = NAME + "-" + (++INSTANCE) + "-" + field; var label = element(doc, "label", { htmlFor: id, text: labelText }); var select = element(doc, "select", { id: id, "aria-label": labelText }); options.forEach(function (option) { select.appendChild(element(doc, "option", { value: option[0], text: option[1] })); }); select.value = state[field]; select.addEventListener("change", function () { state[field] = select.value; onChange(); }); controls.appendChild(element(doc, "div", { className: "esi-control" }, [label, select])); }
  function addRange(doc, controls, state, field, labelText, min, max, step, unit, onChange) { var id = NAME + "-" + (++INSTANCE) + "-" + field; var output = element(doc, "output", { text: "" }); var label = element(doc, "label", { htmlFor: id, text: labelText }); var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, value: state[field], "aria-label": labelText }); input.addEventListener("input", function () { state[field] = Number(input.value); onChange(); }); controls.appendChild(element(doc, "div", { className: "esi-control" }, [label, output, input])); return { input: input, output: output, unit: unit }; }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return; var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { lengthM: DEFAULTS.lengthM, riseNs: DEFAULTS.riseNs, velocityMPerNs: DEFAULTS.velocityMPerNs, z0Ohm: DEFAULTS.z0Ohm, zLOhm: DEFAULTS.zLOhm, termination: DEFAULTS.termination, bitRateMbps: DEFAULTS.bitRateMbps, jitterPs: DEFAULTS.jitterPs, amplitudeV: DEFAULTS.amplitudeV, couplingPct: DEFAULTS.couplingPct, noisePct: DEFAULTS.noisePct, predictions: {}, revealed: false, feedback: "请先完成三项方向预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "esi-shell" }); shell.appendChild(element(doc, "h3", { text: "信号完整性实验：传播、反射与眼图" })); shell.appendChild(element(doc, "p", { className: "esi-note", text: "先判断传播和反射方向，再改变长度、边沿和终端。" })); var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "esi-choice-grid", role: "group", "aria-label": question.prompt }); var buttons = []; question.choices.forEach(function (item) { var button = element(doc, "button", { type: "button", text: item[1], "aria-pressed": "false" }); button.value = item[0]; button.addEventListener("click", function () { state.predictions[question.key] = item[0]; buttons.forEach(function (other) { other.setAttribute("aria-pressed", other.value === item[0] ? "true" : "false"); }); updateGate(); }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); }); shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "esi-actions" }); var reveal = element(doc, "button", { type: "button", className: "esi-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "esi-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback); shell.appendChild(element(doc, "p", { className: "cl-sr-only", "data-esi-live": true, "aria-live": "polite" }));
    var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "esi-controls" }); addSelect(doc, controls, state, "termination", "负载终端", [["open", "开路 (ZL=Infinity)"], ["matched", "匹配 (ZL=Z0)"], ["numeric", "数值 ZL"], ["short", "短路 (ZL=0)"]], renderResult); var refs = {}; refs.lengthM = addRange(doc, controls, state, "lengthM", "线长", 0.01, 5, 0.01, " m", renderResult); refs.riseNs = addRange(doc, controls, state, "riseNs", "上升时间", 0.2, 50, 0.2, " ns", renderResult); refs.velocityMPerNs = addRange(doc, controls, state, "velocityMPerNs", "传播速度", 0.05, 0.3, 0.01, " m/ns", renderResult); refs.z0Ohm = addRange(doc, controls, state, "z0Ohm", "特性阻抗 Z0", 20, 120, 1, " Ω", renderResult); refs.zLOhm = addRange(doc, controls, state, "zLOhm", "数值负载 ZL", 0, 1000, 5, " Ω", renderResult); refs.bitRateMbps = addRange(doc, controls, state, "bitRateMbps", "码率", 0.1, 1000, 0.1, " Mb/s", renderResult); refs.jitterPs = addRange(doc, controls, state, "jitterPs", "抖动", 0, 2000, 10, " ps", renderResult); refs.amplitudeV = addRange(doc, controls, state, "amplitudeV", "入射幅度", 0.1, 2, 0.1, " V", renderResult); refs.couplingPct = addRange(doc, controls, state, "couplingPct", "串扰代理", 0, 30, 1, " %", renderResult); refs.noisePct = addRange(doc, controls, state, "noisePct", "噪声代理", 0, 30, 1, " %", renderResult); results.appendChild(controls);
    var layout = element(doc, "div", { className: "esi-layout" }); var stage = element(doc, "div", { className: "esi-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "esi-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "esi-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "esi-note", text: "反射和眼图是教学仿真；实际值需由叠层、探头、收发器和测量证据确认。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function updateGate() { reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeSignal(state); results.hidden = !state.revealed; Object.keys(refs).forEach(function (key) { var digits = key === "lengthM" || key === "riseNs" || key === "velocityMPerNs" ? 2 : key === "z0Ohm" || key === "zLOhm" || key === "jitterPs" ? 0 : key === "bitRateMbps" ? 1 : 2; refs[key].output.textContent = format(result.config[key], digits) + refs[key].unit; }); draw(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "飞行时间", format(result.tdNs, 2) + " ns")); metrics.appendChild(metric(doc, "Γ", format(result.gamma, 3))); metrics.appendChild(metric(doc, "眼高 / 眼宽", format(result.eyeHeightV, 2) + " V / " + format(result.eyeWidthPct, 1) + "% UI")); metrics.appendChild(metric(doc, "模型", result.regime)); renderTable(doc, tableWrap, result); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) return; var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 项命中。现在比较终端改变前后的证据。"; renderResult(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { Object.keys(DEFAULTS).forEach(function (key) { state[key] = DEFAULTS[key]; }); state.predictions = {}; state.revealed = false; state.feedback = "请先完成三项方向预测。"; controls.querySelectorAll("select").forEach(function (select) { var field = select.id.slice((NAME + "-").length).split("-").slice(1).join("-"); select.value = state[field]; }); Object.keys(refs).forEach(function (key) { refs[key].input.value = state[key]; }); groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); updateGate(); renderResult(); announce(api, rootNode, "信号完整性实验已重置。"); });
    renderResult(); updateGate();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var base = computeSignal(DEFAULTS); check(near(base.tdNs, 2), "flight time"); check(near(base.roundTripNs, 4), "round-trip time"); check(near(base.uiNs, 20), "unit interval from bit rate"); check(base.regime === "传输线模型优先", "transmission-line boundary"); check(base.loadImpedanceOhm === Infinity && base.gamma === 1 && near(base.reflectedStepV, 1), "open load uses Infinity and positive reflection"); check(computeSignal({ lengthM: 0.6 }).tdNs > base.tdNs && computeSignal({ lengthM: 0.6 }).eyeWidthPct !== base.eyeWidthPct, "longer line changes delay and eye"); check(computeSignal({ termination: "matched" }).loadImpedanceOhm === computeSignal({ termination: "matched" }).config.z0Ohm && computeSignal({ termination: "matched" }).gamma === 0, "matched load uses ZL=Z0"); check(computeSignal({ termination: "numeric", zLOhm: 75 }).gamma !== base.gamma, "numeric ZL changes Gamma"); check(computeSignal({ termination: "numeric", zLOhm: 75, z0Ohm: 75 }).eyeHeightV !== computeSignal({ termination: "numeric", zLOhm: 75, z0Ohm: 50 }).eyeHeightV, "Z0 sensitivity enters eye height"); check(computeSignal({ jitterPs: 800 }).eyeWidthPct < base.eyeWidthPct, "jitter closes eye width"); check(computeSignal({ bitRateMbps: 500 }).uiNs < base.uiNs && computeSignal({ bitRateMbps: 500 }).eyeWidthPct < base.eyeWidthPct, "higher bit rate closes UI budget"); var shortSlow = computeSignal({ lengthM: 0.01, riseNs: 50, bitRateMbps: 1 }); var longFast = computeSignal({ lengthM: 5, riseNs: 0.2, bitRateMbps: 1 }); check(shortSlow.regime === "集总模型可先用" && longFast.regime === "传输线模型优先" && shortSlow.tdNs < longFast.tdNs, "short slow edge versus long fast edge counterexample"); check(computeSignal({ riseNs: 50 }).regime === "集总模型可先用", "lumped-side boundary"); check(JSON.stringify(base) === JSON.stringify(computeSignal(DEFAULTS)), "deterministic result"); return { checks: checks }; }
  return { NAME: NAME, DEFAULTS: DEFAULTS, compute: computeSignal, computeSignal: computeSignal, mount: mount, selfTest: selfTest };
});
