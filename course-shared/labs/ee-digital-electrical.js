(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-digital-electrical", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-digital-electrical self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-digital-electrical self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "ee-digital-electrical";
  var STYLE_ID = "ee-digital-electrical-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = {
    vdd: 3.3,
    vihRatio: 0.7,
    vilRatio: 0.3,
    vohDrop: 0.2,
    vol: 0.1,
    sourceCurrentmA: 4,
    sinkCurrentmA: 4,
    inputLeakUa: 1,
    loadCount: 4,
    inputCapacitance: 10e-12,
    pullupResistance: 10000,
    driverLowResistance: 30,
    maxRiseTime: 100e-9,
    edgeFrequency: 1e6,
    activityFactor: 0.5
  };
  var QUESTIONS = [
    { key: "fanout", prompt: "同一个 CMOS 输出接入更多输入电容时，上升沿通常怎样变化？", expected: "slower", choices: [["slower", "变慢"], ["faster", "变快"], ["same", "不变"]] },
    { key: "pullup", prompt: "上拉电阻变大时，开漏/开集电极的上升沿和低电平电流分别怎样？", expected: "tradeoff", choices: [["tradeoff", "上升更慢，但低电平电流更小"], ["both", "都更快/更大"], ["none", "都不变"]] },
    { key: "contention", prompt: "推挽输出强制为低、外部上拉仍接在高电平时，最需要警惕什么？", expected: "current", choices: [["current", "争用电流与耗散"], ["noise", "只会增加噪声而无电流"], ["nothing", "没有影响"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) { if (!isFinite(value)) return "-"; var places = digits === undefined ? 2 : digits; if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4)); return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function formatControl(key, value) {
    if (key === "inputCapacitance") return format(value * 1e12, 1) + " pF/输入";
    if (key === "pullupResistance") return format(value / 1000, 1) + " kΩ";
    if (key === "driverLowResistance") return format(value, 0) + " Ω";
    if (key === "maxRiseTime") return format(value * 1e9, 0) + " ns";
    if (key === "edgeFrequency") return format(value / 1e6, 2) + " MHz";
    if (key === "activityFactor") return format(value * 100, 0) + "%";
    return format(value, 0);
  }
  function normalize(input) {
    var source = input || {};
    return {
      vdd: clamp(finite(source.vdd === undefined ? DEFAULTS.vdd : source.vdd, "VDD"), 1, 5.5),
      vihRatio: clamp(finite(source.vihRatio === undefined ? DEFAULTS.vihRatio : source.vihRatio, "VIH ratio"), 0.5, 0.9),
      vilRatio: clamp(finite(source.vilRatio === undefined ? DEFAULTS.vilRatio : source.vilRatio, "VIL ratio"), 0.1, 0.49),
      vohDrop: clamp(finite(source.vohDrop === undefined ? DEFAULTS.vohDrop : source.vohDrop, "VOH drop"), 0, 1),
      vol: clamp(finite(source.vol === undefined ? DEFAULTS.vol : source.vol, "VOL"), 0, 1),
      sourceCurrentmA: clamp(finite(source.sourceCurrentmA === undefined ? DEFAULTS.sourceCurrentmA : source.sourceCurrentmA, "source current"), 0.1, 20),
      sinkCurrentmA: clamp(finite(source.sinkCurrentmA === undefined ? DEFAULTS.sinkCurrentmA : source.sinkCurrentmA, "sink current"), 0.1, 20),
      inputLeakUa: clamp(finite(source.inputLeakUa === undefined ? DEFAULTS.inputLeakUa : source.inputLeakUa, "input leakage"), 0.01, 100),
      loadCount: Math.round(clamp(finite(source.loadCount === undefined ? DEFAULTS.loadCount : source.loadCount, "load count"), 1, 32)),
      inputCapacitance: clamp(finite(source.inputCapacitance === undefined ? DEFAULTS.inputCapacitance : source.inputCapacitance, "input capacitance"), 0.5e-12, 100e-12),
      pullupResistance: clamp(finite(source.pullupResistance === undefined ? DEFAULTS.pullupResistance : source.pullupResistance, "pull-up resistance"), 500, 100000),
      driverLowResistance: clamp(finite(source.driverLowResistance === undefined ? DEFAULTS.driverLowResistance : source.driverLowResistance, "driver low resistance"), 1, 500),
      maxRiseTime: clamp(finite(source.maxRiseTime === undefined ? DEFAULTS.maxRiseTime : source.maxRiseTime, "rise-time budget"), 5e-9, 2e-6),
      edgeFrequency: clamp(finite(source.edgeFrequency === undefined ? DEFAULTS.edgeFrequency : source.edgeFrequency, "edge frequency"), 1e3, 50e6),
      activityFactor: clamp(finite(source.activityFactor === undefined ? DEFAULTS.activityFactor : source.activityFactor, "activity factor"), 0, 1)
    };
  }
  function computeDigitalElectrical(input) {
    var state = normalize(input);
    var vih = state.vdd * state.vihRatio, vil = state.vdd * state.vilRatio, voh = state.vdd - state.vohDrop;
    var totalCapacitance = state.loadCount * state.inputCapacitance;
    var rcRise = state.pullupResistance * totalCapacitance, rcFall = state.driverLowResistance * totalCapacitance;
    var riseTime = Math.log(0.7 / 0.3) * rcRise, fallTime = Math.log(0.7 / 0.3) * rcFall;
    var riseThresholdTime = -rcRise * Math.log(Math.max(1e-9, 1 - vih / state.vdd));
    var fallThresholdTime = -rcFall * Math.log(Math.max(1e-9, vil / state.vdd));
    var noiseMarginHigh = voh - vih, noiseMarginLow = vil - state.vol;
    var openDrainHighFanout = Math.floor(Math.max(0, (state.vdd - vih) / (state.pullupResistance * state.inputLeakUa * 1e-6)));
    var pullupLowCurrent = Math.max(0, (state.vdd - state.vol) / state.pullupResistance);
    var lowInputLeakCurrent = state.loadCount * state.inputLeakUa * 1e-6;
    var lowStateCurrent = pullupLowCurrent + lowInputLeakCurrent;
    var sinkFanout = Math.floor(Math.max(0, (state.sinkCurrentmA * 1e-3 - pullupLowCurrent) / (state.inputLeakUa * 1e-6)));
    var dcFanout = Math.min(openDrainHighFanout, sinkFanout);
    var edgeFanout = Math.floor(state.maxRiseTime / (Math.log(0.7 / 0.3) * state.pullupResistance * state.inputCapacitance));
    var recommendedFanout = Math.max(0, Math.min(dcFanout, edgeFanout));
    var contentionCurrent = state.vdd / (state.pullupResistance + state.driverLowResistance);
    var contentionPower = contentionCurrent * contentionCurrent * state.driverLowResistance;
    var pullupPower = contentionCurrent * contentionCurrent * state.pullupResistance;
    var chargeStorageEnergy = 0.5 * totalCapacitance * state.vdd * state.vdd;
    var chargeDissipationEnergy = chargeStorageEnergy;
    var dischargeDissipationEnergy = chargeStorageEnergy;
    var energyPerToggle = totalCapacitance * state.vdd * state.vdd;
    var dynamicPower = state.activityFactor * state.edgeFrequency * energyPerToggle;
    var highReleasedVoltage = Math.max(0, state.vdd - state.loadCount * state.inputLeakUa * 1e-6 * state.pullupResistance);
    return {
      config: state, vih: vih, vil: vil, voh: voh, totalCapacitance: totalCapacitance, rcRise: rcRise, rcFall: rcFall,
      riseTime: riseTime, fallTime: fallTime, riseThresholdTime: riseThresholdTime, fallThresholdTime: fallThresholdTime,
      noiseMarginHigh: noiseMarginHigh, noiseMarginLow: noiseMarginLow, dcFanout: dcFanout, edgeFanout: edgeFanout,
      recommendedFanout: recommendedFanout, contentionCurrent: contentionCurrent, contentionPower: contentionPower,
      pullupPower: pullupPower, openDrainHighFanout: openDrainHighFanout, sinkFanout: sinkFanout,
      highReleasedVoltage: highReleasedVoltage, highReleasedLogicValid: highReleasedVoltage >= vih,
      pullupLowCurrent: pullupLowCurrent, lowInputLeakCurrent: lowInputLeakCurrent, lowStateCurrent: lowStateCurrent,
      lowStatePullupPower: pullupLowCurrent * pullupLowCurrent * state.pullupResistance,
      lowStateLeakPower: state.vdd * lowInputLeakCurrent,
      lowStatePower: pullupLowCurrent * pullupLowCurrent * state.pullupResistance + state.vdd * lowInputLeakCurrent,
      chargeStorageEnergy: chargeStorageEnergy, chargeDissipationEnergy: chargeDissipationEnergy,
      dischargeDissipationEnergy: dischargeDissipationEnergy, energyPerToggle: energyPerToggle,
      eventRateHz: state.edgeFrequency, dynamicEnergyPerEvent: energyPerToggle,
      dynamicPower: dynamicPower, dynamicRisePower: state.activityFactor * state.edgeFrequency * chargeStorageEnergy,
      dynamicFallPower: state.activityFactor * state.edgeFrequency * dischargeDissipationEnergy,
      edgeWithinBudget: riseTime <= state.maxRiseTime,
      logicValid: noiseMarginHigh >= 0 && noiseMarginLow >= 0
    };
  }
  function element(doc, tag, attrs, children) { var node = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (key === "text") node.textContent = String(value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); }); (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function svgElement(doc, tag, attrs, children) { var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; node.setAttribute(key, String(value)); }); (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function svgText(doc, parent, value, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, value)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--eed-blue:#2b669e;--eed-red:#b7473b;--eed-green:#39734d;--eed-gold:#9a6a10;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .eed-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--eed-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .eed-primary{border-color:var(--eed-blue);background:var(--eed-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .eed-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .eed-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .eed-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eed-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .eed-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .eed-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--eed-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--eed-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eed-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .eed-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .eed-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .eed-metric{min-width:0;padding:9px;border-top:2px solid var(--eed-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .eed-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eed-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .eed-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eed-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .eed-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .eed-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eed-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .eed-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eed-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .eed-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-eed-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 780 385"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "CMOS 逻辑门限、噪声裕量、上拉边沿和争用电流示意");
    node.appendChild(svgElement(doc, "title", {}, "CMOS 电平、边沿与争用路径")); node.appendChild(svgElement(doc, "desc", {}, "上方用 RC 上升沿穿过 VIL 和 VIH 门限，下面画出推挽低电平与上拉电阻同时存在时的争用电流路径。"));
    var blue = "var(--eed-blue)", red = "var(--eed-red)", green = "var(--eed-green)", gold = "var(--eed-gold)";
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 24, width: 430, height: 220, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "门限与边沿（教学电平）", 30, 46, { "font-size": 13, "font-weight": 700 });
    var left = 52, right = 420, top = 66, bottom = 205; node.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-opacity": ".6" })); node.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", "stroke-opacity": ".6" }));
    var vilY = bottom - (bottom - top) * result.vil / result.config.vdd, vihY = bottom - (bottom - top) * result.vih / result.config.vdd, vohY = bottom - (bottom - top) * result.voh / result.config.vdd;
    node.appendChild(svgElement(doc, "line", { x1: left, y1: vilY, x2: right, y2: vilY, stroke: gold, "stroke-dasharray": "5 4", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: left, y1: vihY, x2: right, y2: vihY, stroke: gold, "stroke-dasharray": "5 4", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: left, y1: vohY, x2: right, y2: vohY, stroke: green, "stroke-dasharray": "2 4" }));
    var path = [], rc = result.rcRise, timeMax = Math.max(4 * rc, result.riseThresholdTime * 1.6, 1e-9); for (var i = 0; i <= 70; i += 1) { var time = timeMax * i / 70, voltage = result.config.vdd * (1 - Math.exp(-time / rc)), x = left + (right - left) * i / 70, y = bottom - (bottom - top) * voltage / result.config.vdd; path.push((i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2)); }
    node.appendChild(svgElement(doc, "path", { d: path.join(" "), fill: "none", stroke: blue, "stroke-width": 3 }));
    svgText(doc, node, "VIH=" + format(result.vih, 2) + " V", right - 4, vihY - 7, { "font-size": 10, "text-anchor": "end", fill: gold }); svgText(doc, node, "VIL=" + format(result.vil, 2) + " V", right - 4, vilY + 13, { "font-size": 10, "text-anchor": "end", fill: gold }); svgText(doc, node, "上升 " + format(result.riseTime * 1e9, 1) + " ns", left + 5, top + 16, { "font-size": 10, fill: blue }); svgText(doc, node, "NMH=" + format(result.noiseMarginHigh, 2) + " V", left + 5, 226, { "font-size": 10, fill: green }); svgText(doc, node, "NML=" + format(result.noiseMarginLow, 2) + " V", left + 115, 226, { "font-size": 10, fill: green });
    node.appendChild(svgElement(doc, "rect", { x: 466, y: 24, width: 298, height: 220, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "扇出与总线负载", 482, 46, { "font-size": 13, "font-weight": 700 });
    svgText(doc, node, "输入数", 486, 77, { "font-size": 11 }); svgText(doc, node, String(result.config.loadCount), 610, 77, { "font-size": 20, "font-weight": 700, fill: blue }); svgText(doc, node, "× " + format(result.config.inputCapacitance * 1e12, 1) + " pF", 650, 77, { "font-size": 11 });
    svgText(doc, node, "开漏高态扇出", 486, 113, { "font-size": 11 }); svgText(doc, node, String(result.openDrainHighFanout), 610, 113, { "font-size": 20, "font-weight": 700, fill: result.highReleasedLogicValid ? green : red }); svgText(doc, node, "(VDD−VIH)/(RPU·Iin)", 650, 113, { "font-size": 9 });
    svgText(doc, node, "释放高电平", 486, 140, { "font-size": 10 }); svgText(doc, node, format(result.highReleasedVoltage, 2) + " V " + (result.highReleasedLogicValid ? "≥ VIH" : "< VIH"), 610, 140, { "font-size": 10, fill: result.highReleasedLogicValid ? green : red });
    node.appendChild(svgElement(doc, "line", { x1: 486, y1: 151, x2: 744, y2: 151, stroke: "currentColor", "stroke-opacity": ".3" })); svgText(doc, node, "低态 I", 486, 178, { "font-size": 11 }); svgText(doc, node, format(result.lowStateCurrent * 1000, 3) + " mA", 610, 178, { "font-size": 16, "font-weight": 700, fill: red }); svgText(doc, node, "上拉 + 输入漏电", 650, 178, { "font-size": 10 }); svgText(doc, node, "动态 P = α f C V²：" + format(result.dynamicPower * 1000, 3) + " mW", 486, 210, { "font-size": 10, fill: blue }); svgText(doc, node, "α=" + format(result.config.activityFactor, 2) + "，f=" + format(result.eventRateHz / 1e6, 2) + " MHz 完整翻转事件率", 486, 231, { "font-size": 9, fill: "var(--fg-soft,currentColor)" });
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 263, width: 748, height: 99, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "争用电流路径：VDD → Rpullup → 被拉低的输出 → GND", 30, 286, { "font-size": 13, "font-weight": 700 });
    drawArrow(doc, node, 74, 331, 175, 331, green); node.appendChild(svgElement(doc, "rect", { x: 175, y: 316, width: 100, height: 30, rx: 3, fill: "var(--bg,white)", stroke: gold, "stroke-width": 2 })); svgText(doc, node, "Rpullup", 225, 336, { "font-size": 11, "text-anchor": "middle", fill: gold }); drawArrow(doc, node, 275, 331, 380, 331, red); node.appendChild(svgElement(doc, "rect", { x: 380, y: 316, width: 120, height: 30, rx: 3, fill: "var(--bg,white)", stroke: red, "stroke-width": 2 })); svgText(doc, node, "低驱动 MOS", 440, 336, { "font-size": 11, "text-anchor": "middle", fill: red }); drawArrow(doc, node, 500, 331, 612, 331, red); svgText(doc, node, "I争用", 555, 320, { "font-size": 10, "text-anchor": "middle", fill: red }); svgText(doc, node, "状态线与电流线都要检查；门限不是电流额定值", 630, 350, { "font-size": 10, "text-anchor": "middle", fill: "var(--fg-soft,currentColor)" });
  }
  function drawArrow(doc, node, x1, y1, x2, y2, color) { node.appendChild(svgElement(doc, "line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color, "stroke-width": 3 })); node.appendChild(svgElement(doc, "polygon", { points: x2 + "," + y2 + " " + (x2 - 9) + "," + (y2 - 5) + " " + (x2 - 9) + "," + (y2 + 5), fill: color })); }
  function metric(doc, label, value) { return element(doc, "div", { className: "eed-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) { clear(hostNode); var rows = [["CMOS 高电平噪声裕量", format(result.noiseMarginHigh, 3), "V；VOH − VIH"], ["CMOS 低电平噪声裕量", format(result.noiseMarginLow, 3), "V；VIL − VOL"], ["总输入电容", format(result.totalCapacitance * 1e12, 1), "pF；扇出 × 单输入"], ["上升时间", format(result.riseTime * 1e9, 2), "ns；0.3VDD→0.7VDD"], ["下降时间", format(result.fallTime * 1e9, 2), "ns；教学 RC"], ["开漏高态扇出", String(result.openDrainHighFanout), "个；由 RPU、VIH、输入漏电决定"], ["释放高电平", format(result.highReleasedVoltage, 3), "V；负载漏电后的释放值，需 ≥ VIH"], ["低态上拉电流", format(result.pullupLowCurrent * 1000, 3), "mA；(VDD−VOL)/RPU"], ["低态输入漏电", format(result.lowInputLeakCurrent * 1000, 3), "mA；N×Iin"], ["低态总电流", format(result.lowStateCurrent * 1000, 3), "mA；上拉 + 漏电"], ["DC 扇出上限", String(result.dcFanout), "个；高态/低态电流约束取小"], ["边沿扇出上限", String(result.edgeFanout), "个；由上升时间预算决定"], ["争用电流", format(result.contentionCurrent * 1000, 3), "mA；Rpullup 与低驱动串联"], ["动态功率", format(result.dynamicPower * 1000, 3), "mW；α·f·C·V²，f 为完整翻转事件率"], ["动态分账", format(result.dynamicRisePower * 1000, 3) + " + " + format(result.dynamicFallPower * 1000, 3), "mW；上升/下降各 α·f·½CV²"]]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "数字电气边界账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "读数" }), element(doc, "th", { text: "单位 / 解释" })])]), body])); }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument, uid = LAB_ID + "-" + (++INSTANCE), state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; rootNode.textContent = "";
    var shell = element(doc, "div", { className: "eed-shell" }); shell.appendChild(element(doc, "h3", { text: "数字电气实验：门限、边沿与争用" })); shell.appendChild(element(doc, "p", { className: "eed-note", text: "先判断噪声裕量、扇出和上拉的权衡；揭示后改变负载、上拉和边沿预算。阈值是教学设定，具体 VIH/VIL、IOH/IOL 和电容要回到对应数据手册。" }));
    var predictionHost = element(doc, "div"), groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "eed-choice-grid" }), buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "eed-actions" }); var reveal = element(doc, "button", { type: "button", className: "eed-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "eed-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }), controls = element(doc, "div", { className: "eed-controls" }); var specs = [["loadCount", "输入负载数", 1, 16, 1], ["inputCapacitance", "单输入电容", 1e-12, 40e-12, 1e-12], ["pullupResistance", "上拉电阻", 1e3, 50e3, 1e3], ["driverLowResistance", "低驱动电阻", 5, 150, 5], ["maxRiseTime", "上升时间预算", 20e-9, 300e-9, 10e-9], ["edgeFrequency", "完整翻转事件率", 0.1e6, 10e6, 0.1e6], ["activityFactor", "翻转活动因子 α", 0, 1, 0.05]]; var inputs = {}, outputs = {};
    specs.forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "eed-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output; }); results.appendChild(controls);
    var layout = element(doc, "div", { className: "eed-layout" }), stage = element(doc, "div", { className: "eed-stage" }), svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"), metrics = element(doc, "div", { className: "eed-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "eed-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "eed-note", text: "门限判定、动态电容、回流与争用分别是不同检查。标准或数据手册给出条件时，不能用这里的典型电平替代合规验证。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeDigitalElectrical(state.config); results.hidden = !state.revealed; specs.forEach(function (spec) { outputs[spec[0]].textContent = formatControl(spec[0], result.config[spec[0]]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "NMH", format(result.noiseMarginHigh, 2) + " V")); metrics.appendChild(metric(doc, "NML", format(result.noiseMarginLow, 2) + " V")); metrics.appendChild(metric(doc, "上升沿", format(result.riseTime * 1e9, 1) + " ns")); metrics.appendChild(metric(doc, "争用电流", format(result.contentionCurrent * 1000, 2) + " mA")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在把逻辑状态、边沿时间和电流路径分别审计。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; specs.forEach(function (spec) { inputs[spec[0]].value = state.config[spec[0]]; }); render(); announce(api, rootNode, "数字电气实验已重置。"); }); rootNode.appendChild(shell); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-eed-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var result = computeDigitalElectrical(DEFAULTS), highLeak = computeDigitalElectrical({ inputLeakUa: 10, pullupResistance: 20000 }), invalidHigh = computeDigitalElectrical({ inputLeakUa: 100, pullupResistance: 50000, loadCount: 32 }); check(result.logicValid, "default logic margins"); check(result.noiseMarginHigh > 0 && result.noiseMarginLow > 0, "positive noise margins"); check(result.riseTime > result.fallTime, "pull-up rise is slower than push-pull fall"); check(computeDigitalElectrical({ loadCount: 8 }).riseTime > result.riseTime, "more loads slow the edge"); check(computeDigitalElectrical({ pullupResistance: 20000 }).contentionCurrent < result.contentionCurrent, "larger pull-up lowers contention current"); check(result.openDrainHighFanout > 0, "default open-drain high fanout"); check(highLeak.openDrainHighFanout < result.openDrainHighFanout, "input leakage reduces high fanout"); check(!invalidHigh.highReleasedLogicValid && invalidHigh.openDrainHighFanout === 0, "leakage can invalidate released high"); check(near(result.lowStateCurrent, result.pullupLowCurrent + result.lowInputLeakCurrent), "low state counts pull-up and leakage"); check(result.lowStateCurrent > result.pullupLowCurrent, "low-state leakage is not hidden"); check(result.recommendedFanout >= 1, "default fanout is usable"); check(near(result.dynamicPower, result.dynamicRisePower + result.dynamicFallPower), "dynamic CV2 energy is split by edge"); check(near(result.dynamicPower, result.config.activityFactor * result.eventRateHz * result.dynamicEnergyPerEvent), "activity and event rate are explicit"); check(computeDigitalElectrical({ activityFactor: 0 }).dynamicPower === 0, "zero activity has no dynamic power"); check(isFinite(result.dynamicPower), "finite dynamic power"); check(JSON.stringify(result) === JSON.stringify(computeDigitalElectrical(DEFAULTS)), "deterministic result"); return { checks: checks }; }
  return { DEFAULTS: DEFAULTS, normalize: normalize, computeDigitalElectrical: computeDigitalElectrical, compute: computeDigitalElectrical, mount: mount, selfTest: selfTest };
});
