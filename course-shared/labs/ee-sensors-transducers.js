(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-sensors-transducers", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-sensors-transducers self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-sensors-transducers self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "ee-sensors-transducers";
  var STYLE_ID = "ee-sensors-transducers-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = {
    excitation: 3.3,
    referenceResistance: 1000,
    sensorResistance0: 1000,
    sensitivityOhmPerUnit: 2,
    trueInput: 25,
    calibrationX1: 0,
    calibrationX2: 50,
    electronicsGain: 1.02,
    electronicsOffset: 0.004,
    driftVPerC: 0.0002,
    temperatureDelta: 10,
    measurementNoiseV: 0.001,
    calibrationPointNoiseV: 0.0005
  };
  var QUESTIONS = [
    { key: "sensitivity", prompt: "在电阻式桥路中，把激励电压加倍，电压灵敏度大致怎样？", expected: "double", choices: [["double", "近似加倍"], ["same", "不变"], ["zero", "变成零"]] },
    { key: "calibration", prompt: "两点校准最直接能消除哪类误差？", expected: "endpoints", choices: [["endpoints", "端点处的增益/零点误差"], ["all", "所有非线性和漂移"], ["noise", "每一次随机噪声"]] },
    { key: "drift", prompt: "校准后温度变化造成的输出漂移，若未建模，通常表现为？", expected: "bias", choices: [["bias", "输入估计的偏置"], ["bandwidth", "带宽自动增大"], ["none", "完全不影响"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function formatControl(key, value) {
    if (key === "trueInput") return format(value, 1) + " 单位";
    if (key === "temperatureDelta") return format(value, 0) + " °C";
    if (key === "excitation") return format(value, 2) + " V";
    if (key === "electronicsGain") return format(value, 3) + " V/V";
    if (key === "electronicsOffset") return format(value * 1000, 1) + " mV";
    if (key === "driftVPerC") return format(value * 1000, 3) + " mV/°C";
    if (key === "measurementNoiseV") return format(value * 1000, 2) + " mV RMS";
    return format(value, 2);
  }
  function normalize(input) {
    var source = input || {};
    var x1 = clamp(finite(source.calibrationX1 === undefined ? DEFAULTS.calibrationX1 : source.calibrationX1, "calibration x1"), -100, 100);
    var x2 = clamp(finite(source.calibrationX2 === undefined ? DEFAULTS.calibrationX2 : source.calibrationX2, "calibration x2"), -99, 101);
    if (x2 <= x1) x2 = x1 + 1;
    return {
      excitation: clamp(finite(source.excitation === undefined ? DEFAULTS.excitation : source.excitation, "excitation"), 0.5, 5),
      referenceResistance: clamp(finite(source.referenceResistance === undefined ? DEFAULTS.referenceResistance : source.referenceResistance, "reference resistance"), 100, 10000),
      sensorResistance0: clamp(finite(source.sensorResistance0 === undefined ? DEFAULTS.sensorResistance0 : source.sensorResistance0, "sensor resistance"), 100, 10000),
      sensitivityOhmPerUnit: clamp(finite(source.sensitivityOhmPerUnit === undefined ? DEFAULTS.sensitivityOhmPerUnit : source.sensitivityOhmPerUnit, "sensor sensitivity"), -100, 100),
      trueInput: clamp(finite(source.trueInput === undefined ? DEFAULTS.trueInput : source.trueInput, "true input"), -100, 100),
      calibrationX1: x1,
      calibrationX2: x2,
      electronicsGain: clamp(finite(source.electronicsGain === undefined ? DEFAULTS.electronicsGain : source.electronicsGain, "electronics gain"), 0.5, 1.5),
      electronicsOffset: clamp(finite(source.electronicsOffset === undefined ? DEFAULTS.electronicsOffset : source.electronicsOffset, "electronics offset"), -0.2, 0.2),
      driftVPerC: clamp(finite(source.driftVPerC === undefined ? DEFAULTS.driftVPerC : source.driftVPerC, "drift"), -0.01, 0.01),
      temperatureDelta: clamp(finite(source.temperatureDelta === undefined ? DEFAULTS.temperatureDelta : source.temperatureDelta, "temperature delta"), -80, 150),
      measurementNoiseV: clamp(finite(source.measurementNoiseV === undefined ? DEFAULTS.measurementNoiseV : source.measurementNoiseV, "measurement noise"), 0, 0.1),
      calibrationPointNoiseV: clamp(finite(source.calibrationPointNoiseV === undefined ? DEFAULTS.calibrationPointNoiseV : source.calibrationPointNoiseV, "calibration point noise"), 0, 0.1)
    };
  }
  function sensorResistanceAt(state, input) {
    return Math.max(1, state.sensorResistance0 + state.sensitivityOhmPerUnit * input);
  }
  function bridgeVoltage(state, input) {
    var resistance = sensorResistanceAt(state, input);
    return state.excitation * (resistance / (resistance + state.referenceResistance) - 0.5);
  }
  function computeSensorCalibration(input) {
    var state = normalize(input);
    var x1 = state.calibrationX1, x2 = state.calibrationX2, span = x2 - x1;
    var sensorResistance = sensorResistanceAt(state, state.trueInput);
    var idealBridge = bridgeVoltage(state, state.trueInput);
    var rawVoltage = state.electronicsGain * idealBridge + state.electronicsOffset + state.driftVPerC * state.temperatureDelta;
    var raw1 = state.electronicsGain * bridgeVoltage(state, x1) + state.electronicsOffset;
    var raw2 = state.electronicsGain * bridgeVoltage(state, x2) + state.electronicsOffset;
    var deltaY = raw2 - raw1;
    var signedDeltaY = Math.abs(deltaY) < 1e-12 ? (deltaY < 0 ? -1e-12 : 1e-12) : deltaY;
    var calibratedSlope = signedDeltaY / span;
    var calibratedIntercept = raw1 - calibratedSlope * x1;
    var estimatedInput = (rawVoltage - calibratedIntercept) / calibratedSlope;
    var idealSlope = (bridgeVoltage(state, x2) - bridgeVoltage(state, x1)) / span;
    var jacobianY1 = span * (rawVoltage - raw2) / (signedDeltaY * signedDeltaY);
    var jacobianY2 = -span * (rawVoltage - raw1) / (signedDeltaY * signedDeltaY);
    var jacobianY = span / signedDeltaY;
    var measurementUncertainty = Math.abs(jacobianY) * state.measurementNoiseV;
    var calibrationUncertainty = Math.sqrt(Math.pow(jacobianY1 * state.calibrationPointNoiseV, 2) + Math.pow(jacobianY2 * state.calibrationPointNoiseV, 2));
    var combinedUncertainty = Math.sqrt(measurementUncertainty * measurementUncertainty + calibrationUncertainty * calibrationUncertainty);
    var midpoint = (x1 + x2) / 2;
    var midpointRaw = state.electronicsGain * bridgeVoltage(state, midpoint) + state.electronicsOffset;
    var midpointLinear = calibratedIntercept + calibratedSlope * midpoint;
    return {
      config: state,
      sensorResistance: sensorResistance,
      idealBridge: idealBridge,
      rawVoltage: rawVoltage,
      raw1: raw1,
      raw2: raw2,
      calibratedSlope: calibratedSlope,
      calibratedIntercept: calibratedIntercept,
      estimatedInput: estimatedInput,
      residual: estimatedInput - state.trueInput,
      idealSlope: idealSlope,
      sensitivityMvPerUnit: calibratedSlope * 1000,
      driftVoltage: state.driftVPerC * state.temperatureDelta,
      driftInputBias: state.driftVPerC * state.temperatureDelta / calibratedSlope,
      measurementUncertainty: measurementUncertainty,
      calibrationUncertainty: calibrationUncertainty,
      combinedUncertainty: combinedUncertainty,
      calibrationJacobians: { y1: jacobianY1, y2: jacobianY2, y: jacobianY },
      midpointNonlinearity: (midpointRaw - midpointLinear) / calibratedSlope,
      traceability: "参考电阻/激励 → 桥路输出 → ADC 读数 → 两点校准 → 输入估计"
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (key === "text") node.textContent = String(value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; node.setAttribute(key, String(value)); });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node;
  }
  function svgText(doc, parent, value, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, value)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--est-blue:#2b669e;--est-red:#b7473b;--est-green:#39734d;--est-gold:#9a6a10;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .est-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--est-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .est-primary{border-color:var(--est-blue);background:var(--est-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .est-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .est-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .est-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .est-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .est-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .est-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--est-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--est-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .est-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .est-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .est-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .est-metric{min-width:0;padding:9px;border-top:2px solid var(--est-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .est-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .est-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .est-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .est-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .est-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .est-choice-grid,[data-learning-lab="' + LAB_ID + '"] .est-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .est-choice-grid,[data-learning-lab="' + LAB_ID + '"] .est-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .est-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-est-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 780 390"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "电阻式桥式传感器、两点校准和漂移不确定度示意");
    node.appendChild(svgElement(doc, "title", {}, "桥式传感器与两点校准")); node.appendChild(svgElement(doc, "desc", {}, "左侧是四个桥臂、三个参考电阻、一个传感电阻和两个差分中点；右侧比较理想桥路曲线、两点校准直线和温漂后的当前读数。"));
    var blue = "var(--est-blue)", red = "var(--est-red)", green = "var(--est-green)", gold = "var(--est-gold)";
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 24, width: 300, height: 180, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "四分之一桥：四臂与差分中点", 30, 46, { "font-size": 13, "font-weight": 700 });
    node.appendChild(svgElement(doc, "line", { x1: 166, y1: 59, x2: 166, y2: 70, stroke: green, "stroke-width": 2 })); svgText(doc, node, "Vexc=" + format(result.config.excitation, 2) + " V", 166, 58, { "font-size": 10, "text-anchor": "middle", fill: green });
    node.appendChild(svgElement(doc, "line", { x1: 166, y1: 70, x2: 137, y2: 88, stroke: "currentColor", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 195, y1: 88, x2: 237, y2: 116, stroke: "currentColor", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 166, y1: 70, x2: 195, y2: 88, stroke: "currentColor", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 137, y1: 88, x2: 95, y2: 116, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "rect", { x: 99, y: 76, width: 66, height: 22, rx: 3, fill: "var(--bg,white)", stroke: blue, "stroke-width": 2 })); svgText(doc, node, "Rref", 132, 91, { "font-size": 10, "text-anchor": "middle", fill: blue });
    node.appendChild(svgElement(doc, "rect", { x: 167, y: 76, width: 66, height: 22, rx: 3, fill: "var(--bg,white)", stroke: blue, "stroke-width": 2 })); svgText(doc, node, "Rref", 200, 91, { "font-size": 10, "text-anchor": "middle", fill: blue });
    node.appendChild(svgElement(doc, "line", { x1: 95, y1: 124, x2: 95, y2: 139, stroke: "currentColor", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 237, y1: 124, x2: 237, y2: 139, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "rect", { x: 55, y: 139, width: 80, height: 22, rx: 3, fill: "var(--bg,white)", stroke: red, "stroke-width": 2 })); svgText(doc, node, "Rsensor", 95, 154, { "font-size": 10, "text-anchor": "middle", fill: red });
    node.appendChild(svgElement(doc, "rect", { x: 197, y: 139, width: 80, height: 22, rx: 3, fill: "var(--bg,white)", stroke: blue, "stroke-width": 2 })); svgText(doc, node, "Rref", 237, 154, { "font-size": 10, "text-anchor": "middle", fill: blue });
    node.appendChild(svgElement(doc, "line", { x1: 95, y1: 161, x2: 166, y2: 178, stroke: "currentColor", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 237, y1: 161, x2: 166, y2: 178, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "circle", { cx: 95, cy: 120, r: 4, fill: gold })); node.appendChild(svgElement(doc, "circle", { cx: 237, cy: 120, r: 4, fill: gold })); svgText(doc, node, "Vout+", 80, 116, { "font-size": 10, "text-anchor": "end", fill: gold }); svgText(doc, node, "Vout−", 252, 116, { "font-size": 10, fill: gold });
    node.appendChild(svgElement(doc, "line", { x1: 166, y1: 178, x2: 166, y2: 184, stroke: "currentColor", "stroke-width": 2 })); svgText(doc, node, "负端 / 参考", 166, 198, { "font-size": 10, "text-anchor": "middle" }); svgText(doc, node, "Rs=" + format(result.sensorResistance, 1) + " Ω；Vout=Vout+−Vout−", 30, 183, { "font-size": 9.5, fill: red });
    node.appendChild(svgElement(doc, "rect", { x: 336, y: 24, width: 428, height: 300, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "校准曲线：输出电压 vs 输入", 352, 46, { "font-size": 13, "font-weight": 700 });
    var left = 380, right = 735, top = 67, bottom = 260, x1 = result.config.calibrationX1, x2 = result.config.calibrationX2, xSpan = Math.max(1, x2 - x1), yScale = Math.max(Math.abs(result.raw2), Math.abs(result.rawVoltage), 0.01) * 1.25;
    node.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-opacity": ".6" })); node.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", "stroke-opacity": ".6" })); svgText(doc, node, "x", right, bottom + 24, { "font-size": 11, "text-anchor": "end" }); svgText(doc, node, "Vraw", left - 8, top - 8, { "font-size": 11, "text-anchor": "end" });
    function px(value) { return left + (right - left) * (value - x1) / xSpan; } function py(value) { return bottom - (bottom - top) * (value / yScale); }
    var curve = [], line = [];
    for (var i = 0; i <= 64; i += 1) { var xx = x1 + xSpan * i / 64; var yy = result.config.electronicsGain * bridgeVoltage(result.config, xx) + result.config.electronicsOffset; curve.push((i ? "L" : "M") + px(xx).toFixed(2) + " " + py(yy).toFixed(2)); var yl = result.calibratedIntercept + result.calibratedSlope * xx; line.push((i ? "L" : "M") + px(xx).toFixed(2) + " " + py(yl).toFixed(2)); }
    node.appendChild(svgElement(doc, "path", { d: curve.join(" "), fill: "none", stroke: blue, "stroke-width": 3 })); node.appendChild(svgElement(doc, "path", { d: line.join(" "), fill: "none", stroke: gold, "stroke-width": 2, "stroke-dasharray": "6 4" }));
    [[x1, result.raw1], [x2, result.raw2]].forEach(function (point) { node.appendChild(svgElement(doc, "circle", { cx: px(point[0]), cy: py(point[1]), r: 5, fill: green })); }); node.appendChild(svgElement(doc, "circle", { cx: px(result.config.trueInput), cy: py(result.rawVoltage), r: 6, fill: red }));
    svgText(doc, node, "校准点", left + 6, top + 16, { "font-size": 10, fill: green }); svgText(doc, node, "两点直线", right - 6, top + 16, { "font-size": 10, "text-anchor": "end", fill: gold }); svgText(doc, node, "当前 + 漂移", px(result.config.trueInput), py(result.rawVoltage) - 10, { "font-size": 10, "text-anchor": "middle", fill: red });
    svgText(doc, node, "±不确定度 ≈ " + format(result.combinedUncertainty, 2) + " 输入单位", 30, 282, { "font-size": 11, fill: blue }); svgText(doc, node, "漂移输入偏置 ≈ " + format(result.driftInputBias, 2) + " 单位", 30, 303, { "font-size": 11, fill: red }); svgText(doc, node, "曲线弯曲不是两点校准能保证消除的误差", 352, 306, { "font-size": 10, fill: "var(--fg-soft,currentColor)" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "est-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode); var rows = [
      ["传感器电阻", format(result.sensorResistance, 2), "Ω；R0 + 灵敏度 × 输入"],
      ["桥路原始输出", format(result.idealBridge * 1000, 3), "mV；未含电子学偏置"],
      ["观测输出", format(result.rawVoltage * 1000, 3), "mV；含增益、零点和温漂"],
      ["校准斜率", format(result.sensitivityMvPerUnit, 4), "mV/输入单位"],
      ["估计输入", format(result.estimatedInput, 3), "单位；两点线性反演"],
      ["估计残差", (result.residual >= 0 ? "+" : "") + format(result.residual, 3), "输入单位"],
      ["漂移输入偏置", (result.driftInputBias >= 0 ? "+" : "") + format(result.driftInputBias, 3), "输入单位；未补偿代理"],
      ["校准雅可比 (y1,y2,y)", format(result.calibrationJacobians.y1, 2) + ", " + format(result.calibrationJacobians.y2, 2) + ", " + format(result.calibrationJacobians.y, 2), "输入单位 / V；保留斜率符号"],
      ["校准项不确定度", format(result.calibrationUncertainty, 4), "输入单位；由 y1、y2 的雅可比直接传播"],
      ["合成不确定度", format(result.combinedUncertainty, 4), "输入单位；y 与两校准点三项 RSS"],
      ["中点非线性", format(result.midpointNonlinearity, 4), "输入单位；两点外推边界"]
    ]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "传感器校准与不确定度账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "读数" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument, uid = LAB_ID + "-" + (++INSTANCE), state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "est-shell" }); shell.appendChild(element(doc, "h3", { text: "传感器实验：桥路、两点校准与不确定度" })); shell.appendChild(element(doc, "p", { className: "est-note", text: "先预测灵敏度、校准能消除的误差和漂移方向；揭示后改变激励、输入、温度和电子学误差。默认值是教学设定，不是某个传感器的数据手册。" }));
    var predictionHost = element(doc, "div"), groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "est-choice-grid" }), buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "est-actions" }); var reveal = element(doc, "button", { type: "button", className: "est-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "est-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }), controls = element(doc, "div", { className: "est-controls" }); var specs = [["trueInput", "真实输入", 0, 50, 1], ["temperatureDelta", "温度偏移", -30, 60, 5], ["excitation", "桥路激励", 1, 5, 0.1], ["electronicsGain", "电子学增益", 0.95, 1.05, 0.005], ["electronicsOffset", "零点偏置", -0.02, 0.02, 0.001], ["measurementNoiseV", "测量噪声", 0.0001, 0.005, 0.0001]]; var inputs = {}, outputs = {};
    specs.forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "est-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output; }); results.appendChild(controls);
    var layout = element(doc, "div", { className: "est-layout" }), stage = element(doc, "div", { className: "est-stage" }), svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"), metrics = element(doc, "div", { className: "est-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "est-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "est-note", text: "可追溯性不是图上的一条线：应记录参考标准、仪器校准状态、环境、原始读数、拟合方法和不确定度。两点校准不能证明长期漂移、迟滞或所有非线性消失。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeSensorCalibration(state.config); results.hidden = !state.revealed; specs.forEach(function (spec) { outputs[spec[0]].textContent = formatControl(spec[0], result.config[spec[0]]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "校准灵敏度", format(result.sensitivityMvPerUnit, 3) + " mV/单位")); metrics.appendChild(metric(doc, "估计输入", format(result.estimatedInput, 2) + " 单位")); metrics.appendChild(metric(doc, "漂移偏置", format(result.driftInputBias, 2) + " 单位")); metrics.appendChild(metric(doc, "合成不确定度", format(result.combinedUncertainty, 2) + " 单位")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在比较原始读数、校准估计和不确定度。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; specs.forEach(function (spec) { inputs[spec[0]].value = state.config[spec[0]]; }); render(); announce(api, rootNode, "传感器实验已重置。"); }); rootNode.appendChild(shell); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-est-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeSensorCalibration(DEFAULTS); check(result.calibratedSlope > 0, "positive default sensitivity"); check(result.raw2 > result.raw1, "calibration endpoints ordered"); check(near(result.calibrationUncertainty, 0.2212, 1e-3), "direct calibration Jacobian uncertainty"); check(near(result.combinedUncertainty, 0.6619, 1e-3), "direct combined uncertainty"); check(result.combinedUncertainty > result.measurementUncertainty, "calibration uncertainty included"); check(result.driftInputBias > 0, "temperature drift maps to input bias"); check(computeSensorCalibration({ excitation: 2 * DEFAULTS.excitation }).calibratedSlope > result.calibratedSlope, "excitation raises voltage sensitivity"); check(computeSensorCalibration({ temperatureDelta: 0 }).driftInputBias === 0, "zero temperature change has zero drift bias"); check(isFinite(result.midpointNonlinearity), "finite midpoint residual"); var negative = computeSensorCalibration({ sensitivityOhmPerUnit: -2, trueInput: 25 }); check(negative.calibratedSlope < 0 && negative.sensitivityMvPerUnit < 0 && negative.calibrationJacobians.y < 0, "negative calibration slope is preserved"); var edge = computeSensorCalibration({ sensitivityOhmPerUnit: -100, trueInput: 2, calibrationX1: 2, calibrationX2: 2.5 }); check(Object.keys(edge).every(function (key) { return key === "config" || key === "traceability" || key === "calibrationJacobians" || isFinite(edge[key]); }) && Object.keys(edge.calibrationJacobians).every(function (key) { return isFinite(edge.calibrationJacobians[key]); }), "finite guarded bridge edge case"); check(JSON.stringify(result) === JSON.stringify(computeSensorCalibration(DEFAULTS)), "deterministic result"); return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, normalize: normalize, bridgeVoltage: bridgeVoltage, computeSensorCalibration: computeSensorCalibration, compute: computeSensorCalibration, mount: mount, selfTest: selfTest };
});
