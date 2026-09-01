(function (root, factory) {
  "use strict";
  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-phasors-impedance", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-phasors-impedance self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-phasors-impedance self-test: FAIL", error && error.stack ? error.stack : error);
      process.exitCode = 1;
    }
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var LAB_ID = "ee-phasors-impedance";
  var STYLE_ID = "ee-phasors-impedance-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { resistance: 10, inductanceMh: 10, capacitanceUf: 10, parasiticOhm: 2, frequencyHz: 500, sourceVrms: 1 };
  var QUESTIONS = [
    { key: "phase", prompt: "串联 RLC 从低频扫到高频，电流相位大致怎样变化？", expected: "lead-lag", choices: [["lead-lag", "先超前后滞后"], ["lag-lead", "先滞后后超前"], ["zero", "始终为零"]] },
    { key: "impedance", prompt: "感抗与容抗相消附近，总阻抗幅值怎样？", expected: "minimum", choices: [["minimum", "局部最小"], ["maximum", "局部最大"], ["same", "完全不变"]] },
    { key: "boundary", prompt: "相量法首先适用于哪一种状态？", expected: "steady", choices: [["steady", "线性正弦稳态"], ["startup", "任意启动瞬间"], ["nonlinear", "强非线性饱和"]] }
  ];

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function normalize(input) {
    var source = input || {};
    return {
      resistance: clamp(finite(source.resistance === undefined ? DEFAULTS.resistance : source.resistance, "resistance"), 0.1, 1000),
      inductanceMh: clamp(finite(source.inductanceMh === undefined ? DEFAULTS.inductanceMh : source.inductanceMh, "inductance"), 0.1, 100),
      capacitanceUf: clamp(finite(source.capacitanceUf === undefined ? DEFAULTS.capacitanceUf : source.capacitanceUf, "capacitance"), 0.1, 100),
      parasiticOhm: clamp(finite(source.parasiticOhm === undefined ? DEFAULTS.parasiticOhm : source.parasiticOhm, "parasitic resistance"), 0, 100),
      frequencyHz: clamp(finite(source.frequencyHz === undefined ? DEFAULTS.frequencyHz : source.frequencyHz, "frequency"), 1, 50000),
      sourceVrms: clamp(finite(source.sourceVrms === undefined ? DEFAULTS.sourceVrms : source.sourceVrms, "source voltage"), 0.01, 10)
    };
  }
  function complex(re, im) { return { re: re, im: im }; }
  function magnitude(value) { return Math.sqrt(value.re * value.re + value.im * value.im); }
  function angleDeg(value) { return Math.atan2(value.im, value.re) * 180 / Math.PI; }
  function multiplyScalar(value, scalar) { return complex(value.re * scalar, value.im * scalar); }
  function computePhasors(input) {
    var config = normalize(input);
    var L = config.inductanceMh / 1000;
    var C = config.capacitanceUf / 1000000;
    var omega = 2 * Math.PI * config.frequencyHz;
    var totalR = config.resistance + config.parasiticOhm;
    var xL = omega * L;
    var xC = 1 / (omega * C);
    var impedance = complex(totalR, xL - xC);
    var impedanceMagnitude = magnitude(impedance);
    var impedancePhase = angleDeg(impedance);
    var currentMagnitude = config.sourceVrms / impedanceMagnitude;
    var currentPhase = -impedancePhase;
    var current = complex(currentMagnitude * Math.cos(currentPhase * Math.PI / 180), currentMagnitude * Math.sin(currentPhase * Math.PI / 180));
    var voltageR = multiplyScalar(current, totalR);
    var voltageL = complex(-current.im * xL, current.re * xL);
    var voltageC = complex(current.im * xC, -current.re * xC);
    var source = complex(config.sourceVrms, 0);
    var f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
    var phasorReferenceMagnitude = Math.max(magnitude(voltageL), magnitude(voltageC), magnitude(voltageR), magnitude(source));
    var phasorScale = 64 / Math.max(phasorReferenceMagnitude, 1e-12);
    var bode = [];
    var fMin = Math.max(1, f0 / 30);
    var fMax = Math.min(100000, Math.max(fMin * 31, f0 * 30));
    var bodeFrequencies = [];
    for (var i = 0; i <= 120; i += 1) {
      bodeFrequencies.push(fMin * Math.pow(fMax / fMin, i / 120));
    }
    var nearestIndex = 0, nearestDistance = Infinity;
    bodeFrequencies.forEach(function (frequency, index) {
      var distance = Math.abs(Math.log(frequency / f0));
      if (distance < nearestDistance) { nearestDistance = distance; nearestIndex = index; }
    });
    bodeFrequencies[nearestIndex] = f0;
    bodeFrequencies.sort(function (left, right) { return left - right; });
    bodeFrequencies.forEach(function (frequency) {
      var w = 2 * Math.PI * frequency;
      var reactance = w * L - 1 / (w * C);
      var zMagnitude = Math.sqrt(totalR * totalR + reactance * reactance);
      var gain = totalR / zMagnitude;
      var phase = -Math.atan2(reactance, totalR) * 180 / Math.PI;
      bode.push({ f: frequency, db: 20 * Math.log10(Math.max(gain, 1e-12)), phase: phase, gain: gain });
    });
    var bodeDbMin = bode.reduce(function (min, point) { return Math.min(min, point.db); }, Infinity);
    var bodeDbMax = bode.reduce(function (max, point) { return Math.max(max, point.db); }, -Infinity);
    var bodeDbRange = Math.max(1, bodeDbMax - bodeDbMin);
    var bodePlotDbMin = bodeDbMin - Math.max(3, bodeDbRange * 0.08);
    var bodePlotDbMax = bodeDbMax + Math.max(1, bodeDbRange * 0.08);
    return {
      config: config,
      inductanceH: L,
      capacitanceF: C,
      omega: omega,
      f0: f0,
      totalR: totalR,
      xL: xL,
      xC: xC,
      reactance: xL - xC,
      impedance: impedance,
      impedanceMagnitude: impedanceMagnitude,
      impedancePhase: impedancePhase,
      current: current,
      currentMagnitude: currentMagnitude,
      currentPhase: currentPhase,
      voltageR: voltageR,
      voltageL: voltageL,
      voltageC: voltageC,
      source: source,
      phasorReferenceMagnitude: phasorReferenceMagnitude,
      phasorScale: phasorScale,
      sumResidual: complex(voltageR.re + voltageL.re + voltageC.re - source.re, voltageR.im + voltageL.im + voltageC.im - source.im),
      bodeDbMin: bodeDbMin,
      bodeDbMax: bodeDbMax,
      bodePlotDbMin: bodePlotDbMin,
      bodePlotDbMax: bodePlotDbMax,
      bode: bode
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key]; if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value)); else if (key === "text") node.textContent = String(value); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value));
    });
    (children === undefined ? [] : (Array.isArray(children) ? children : [children])).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; node.setAttribute(key, String(value)); });
    (children === undefined ? [] : (Array.isArray(children) ? children : [children])).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function svgText(doc, parent, text, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, text)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--eep-blue:#245c9c;--eep-green:#39734d;--eep-gold:#9b6a12;--eep-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}[data-learning-lab="' + LAB_ID + '"] .eep-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--eep-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .eep-primary{border-color:var(--eep-blue);background:var(--eep-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .eep-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .eep-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .eep-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eep-controls{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .eep-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .eep-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--eep-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--eep-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eep-layout{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .eep-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .eep-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .eep-metric{min-width:0;padding:9px;border-top:2px solid var(--eep-blue)}[data-learning-lab="' + LAB_ID + '"] .eep-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eep-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .eep-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eep-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:1000px){[data-learning-lab="' + LAB_ID + '"] .eep-controls{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .eep-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .eep-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eep-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .eep-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eep-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .eep-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); else { var live = rootNode.querySelector("[data-eep-live]"); if (live) live.textContent = message; } }
  function arrow(doc, parent, x1, y1, x2, y2, color, label, labelX, labelY) {
    parent.appendChild(svgElement(doc, "line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color, "stroke-width": 3 }));
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len, px = -uy, py = ux;
    parent.appendChild(svgElement(doc, "polygon", { points: [x2 + "," + y2, (x2 - 10 * ux + 5 * px) + "," + (y2 - 10 * uy + 5 * py), (x2 - 10 * ux - 5 * px) + "," + (y2 - 10 * uy - 5 * py)].join(" "), fill: color }));
    svgText(doc, parent, label, labelX, labelY, { "font-size": 11, fill: color });
  }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 800 410"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "串联 RLC 相量图与幅相 Bode 频率响应");
    node.appendChild(svgElement(doc, "title", {}, "相量、复阻抗与 Bode 图"));
    node.appendChild(svgElement(doc, "desc", {}, "左上用相量链表示电阻、电感、电容电压的矢量相加；右侧上下分别显示电阻端传递函数的幅度和相位随对数频率变化。"));
    var blue = "var(--eep-blue)", green = "var(--eep-green)", gold = "var(--eep-gold)", red = "var(--eep-red)";
    var ox = 145, oy = 130, scale = result.phasorScale;
    node.appendChild(svgElement(doc, "line", { x1: 32, y1: oy, x2: 300, y2: oy, stroke: "currentColor", "stroke-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: ox, y1: 34, x2: ox, y2: 224, stroke: "currentColor", "stroke-opacity": ".55" }));
    arrow(doc, node, ox, oy, ox + result.voltageR.re * scale, oy - result.voltageR.im * scale, red, "V_R", ox + result.voltageR.re * scale + 5, oy - result.voltageR.im * scale - 5);
    var rHeadX = ox + result.voltageR.re * scale, rHeadY = oy - result.voltageR.im * scale;
    arrow(doc, node, rHeadX, rHeadY, rHeadX + result.voltageL.re * scale, rHeadY - result.voltageL.im * scale, blue, "V_L", rHeadX + result.voltageL.re * scale + 5, rHeadY - result.voltageL.im * scale - 5);
    var lHeadX = rHeadX + result.voltageL.re * scale, lHeadY = rHeadY - result.voltageL.im * scale;
    arrow(doc, node, lHeadX, lHeadY, lHeadX + result.voltageC.re * scale, lHeadY - result.voltageC.im * scale, gold, "V_C", lHeadX + result.voltageC.re * scale - 34, lHeadY - result.voltageC.im * scale + 16);
    arrow(doc, node, ox, oy, ox + result.source.re * scale, oy - result.source.im * scale, green, "V_s", ox + result.source.re * scale + 5, oy - 7);
    svgText(doc, node, "相量链（源电压作参考）", 32, 24, { "font-size": 13, "font-weight": 700 });
    svgText(doc, node, "长度按 max(|V_L|,|V_C|,|V_R|,|V_s|) 缩放；方向与标签编码相位", 32, 244, { "font-size": 10, fill: "var(--fg-soft,currentColor)" });
    var left = 350, right = 770, top = 45, mid = 205, bottom = 365;
    node.appendChild(svgElement(doc, "line", { x1: left, y1: mid, x2: right, y2: mid, stroke: "currentColor", "stroke-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: mid, stroke: "currentColor", "stroke-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: mid + 35, x2: left, y2: bottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    var fMin = result.bode[0].f, fMax = result.bode[result.bode.length - 1].f;
    var x = function (f) { return left + (right - left) * Math.log(f / fMin) / Math.log(fMax / fMin); };
    var yDb = function (v) { return mid - (v - result.bodePlotDbMin) / (result.bodePlotDbMax - result.bodePlotDbMin) * (mid - top); };
    var yPhase = function (v) { return bottom - (v + 90) / 180 * (bottom - (mid + 35)); };
    var dbPath = [], phasePath = [];
    result.bode.forEach(function (point, index) { dbPath.push((index ? "L" : "M") + x(point.f).toFixed(2) + " " + yDb(point.db).toFixed(2)); phasePath.push((index ? "L" : "M") + x(point.f).toFixed(2) + " " + yPhase(point.phase).toFixed(2)); });
    node.appendChild(svgElement(doc, "path", { d: dbPath.join(" "), fill: "none", stroke: red, "stroke-width": 2.5 }));
    node.appendChild(svgElement(doc, "path", { d: phasePath.join(" "), fill: "none", stroke: blue, "stroke-width": 2.5, "stroke-dasharray": "6 3" }));
    var f0x = x(result.f0);
    node.appendChild(svgElement(doc, "line", { x1: f0x, y1: top, x2: f0x, y2: bottom, stroke: gold, "stroke-dasharray": "5 4" }));
    svgText(doc, node, "幅度 H_R=V_R/V_s / dB", left, top - 11, { "font-size": 12, "font-weight": 700, fill: red });
    svgText(doc, node, "相位 / 度", left, bottom + 18, { "font-size": 12, "font-weight": 700, fill: blue });
    svgText(doc, node, "f₀=" + format(result.f0, 0) + " Hz", f0x, top + 14, { "font-size": 10, "text-anchor": "middle", fill: gold });
    svgText(doc, node, "低频", left, bottom + 36, { "font-size": 10 }); svgText(doc, node, "高频", right, bottom + 36, { "font-size": 10, "text-anchor": "end" });
    svgText(doc, node, "实线：幅度；虚线：相位", 550, 28, { "font-size": 10, fill: "var(--fg-soft,currentColor)" });
    svgText(doc, node, "Bode 只覆盖线性模型的教学频段", 550, 395, { "font-size": 10, fill: red });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "eep-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode);
    var rows = [
      ["角频率 ω", format(result.omega, 1), "rad/s"], ["净电抗 X", format(result.reactance, 2), "Ω；X_L − X_C"], ["|Z|", format(result.impedanceMagnitude, 2), "Ω；复阻抗幅值"], ["∠Z", format(result.impedancePhase, 2), "度"], ["|I|", format(result.currentMagnitude * 1000, 2), "mA rms"], ["∠I", format(result.currentPhase, 2), "度；以源电压为参考"], ["|V_L|", format(magnitude(result.voltageL), 2), "V rms"], ["|V_C|", format(magnitude(result.voltageC), 2), "V rms"]
    ];
    var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "复阻抗与相量账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { resistance: DEFAULTS.resistance, inductanceMh: DEFAULTS.inductanceMh, capacitanceUf: DEFAULTS.capacitanceUf, parasiticOhm: DEFAULTS.parasiticOhm, frequencyHz: DEFAULTS.frequencyHz, sourceVrms: DEFAULTS.sourceVrms }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = "";
    var shell = element(doc, "div", { className: "eep-shell" }); shell.appendChild(element(doc, "h3", { text: "相量实验：复阻抗、幅相与 Bode 图" })); shell.appendChild(element(doc, "p", { className: "eep-note", text: "先预测相位方向和相消位置；揭示后拖动频率和元件值。默认值是教学设定。" }));
    var predictionHost = element(doc, "div"), groups = [];
    QUESTIONS.forEach(function (question, index) {
      var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "eep-choice-grid" }), buttons = [];
      question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); });
      groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "eep-actions" }); var reveal = element(doc, "button", { type: "button", className: "eep-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "eep-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }), controls = element(doc, "div", { className: "eep-controls" });
    var specs = [["resistance", "电阻 R", 0.1, 80, 0.1, "Ω"], ["inductanceMh", "电感 L", 0.1, 50, 0.1, "mH"], ["capacitanceUf", "电容 C", 0.1, 50, 0.1, "µF"], ["parasiticOhm", "串联寄生 rₚ", 0, 20, 0.1, "Ω"], ["frequencyHz", "观察频率 f", 10, 5000, 10, "Hz"], ["sourceVrms", "源幅值 Vs", 0.01, 5, 0.01, "V rms"]];
    var inputs = {}, outputs = {};
    specs.forEach(function (spec) { var id = uid + "-" + spec[0], output = element(doc, "output", { text: "" }), label = element(doc, "label", { htmlFor: id, text: spec[1] }), wrap = element(doc, "div", { className: "eep-control" }, [label, output]), input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output; });
    results.appendChild(controls); var layout = element(doc, "div", { className: "eep-layout" }), stage = element(doc, "div", { className: "eep-stage" }), svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"), metrics = element(doc, "div", { className: "eep-metrics" }), tableWrap = element(doc, "div", { className: "eep-table-wrap" }); side.appendChild(metrics); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "eep-note", text: "相量闭合误差接近零只验证复数代数；它不验证探头延迟、寄生频变或器件安全边界。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computePhasors(state.config); results.hidden = !state.revealed; outputs.resistance.textContent = format(result.config.resistance, 1) + " Ω"; outputs.inductanceMh.textContent = format(result.config.inductanceMh, 1) + " mH"; outputs.capacitanceUf.textContent = format(result.config.capacitanceUf, 1) + " µF"; outputs.parasiticOhm.textContent = format(result.config.parasiticOhm, 1) + " Ω"; outputs.frequencyHz.textContent = format(result.config.frequencyHz, 0) + " Hz"; outputs.sourceVrms.textContent = format(result.config.sourceVrms, 2) + " V"; drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "|Z|", format(result.impedanceMagnitude, 2) + " Ω")); metrics.appendChild(metric(doc, "∠Z", format(result.impedancePhase, 2) + "°")); metrics.appendChild(metric(doc, "|I|", format(result.currentMagnitude * 1000, 2) + " mA")); metrics.appendChild(metric(doc, "f₀", format(result.f0, 1) + " Hz")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在观察相量闭合和 Bode 的幅相变化。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: { resistance: DEFAULTS.resistance, inductanceMh: DEFAULTS.inductanceMh, capacitanceUf: DEFAULTS.capacitanceUf, parasiticOhm: DEFAULTS.parasiticOhm, frequencyHz: DEFAULTS.frequencyHz, sourceVrms: DEFAULTS.sourceVrms }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "相量实验已重置。"); });
    rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-eep-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computePhasors(DEFAULTS);
    check(near(result.f0, 503.292121, 1e-6), "resonance frequency");
    check(near(result.impedanceMagnitude, 12.00718, 1e-4), "impedance magnitude");
    check(result.currentPhase > 0, "current leads below resonance");
    check(Math.abs(result.sumResidual.re) < 1e-10 && Math.abs(result.sumResidual.im) < 1e-10, "phasor voltage closure");
    check(result.bode.length === 121 && result.bode.every(function (point) { return isFinite(point.db) && isFinite(point.phase); }), "finite bode samples");
    check(result.bode.some(function (point) { return point.f === result.f0; }), "bode includes exact resonance");
    var resonance = computePhasors({ frequencyHz: result.f0 });
    check(near(magnitude(resonance.voltageR) / magnitude(resonance.source), 1, 1e-12), "full series resistor port reaches unity at resonance");
    check(near(resonance.bode.filter(function (point) { return point.f === resonance.f0; })[0].gain, magnitude(resonance.voltageR) / magnitude(resonance.source), 1e-12), "bode and phasor port agree");
    check(result.phasorReferenceMagnitude >= magnitude(result.voltageL) && result.phasorReferenceMagnitude >= magnitude(result.voltageC) && result.phasorScale > 0, "phasor scale covers all voltage vectors");
    check(result.bode.every(function (point) { return point.db >= result.bodePlotDbMin && point.db <= result.bodePlotDbMax; }), "bode plot range contains curve");
    check(computePhasors({ frequencyHz: 4500 }).currentPhase < 0, "current lags above resonance");
    var highQ = computePhasors({ resistance: 0.1, inductanceMh: 50, capacitanceUf: 0.1, parasiticOhm: 0, frequencyHz: 2251 });
    check(highQ.bodeDbMax > -1e-10 && highQ.bode.every(function (point) { return isFinite(point.db) && point.db >= highQ.bodePlotDbMin && point.db <= highQ.bodePlotDbMax; }), "high-Q bode remains finite and in range");
    check(highQ.phasorScale < result.phasorScale && highQ.phasorReferenceMagnitude > result.phasorReferenceMagnitude, "high-Q phasor scale follows voltage magnitude");
    check(computePhasors({ frequencyHz: 0, resistance: -1 }).impedanceMagnitude > 0, "input normalization");
    check(JSON.stringify(computePhasors(DEFAULTS)) === JSON.stringify(computePhasors(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, computePhasors: computePhasors, mount: mount, selfTest: selfTest };
}));
