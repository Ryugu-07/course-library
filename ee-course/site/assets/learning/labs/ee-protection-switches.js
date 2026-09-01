(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-protection-switches", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-protection-switches self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-protection-switches self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "ee-protection-switches";
  var STYLE_ID = "ee-protection-switches-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = {
    supply: 5,
    currentLimit: 0.25,
    loadResistance: 20,
    faultResistance: 0.2,
    mosRdsOn: 0.12,
    reversePathResistance: 100,
    diodeVf: 0.7,
    inductance: 10e-3,
    turnOffUs: 20,
    clampVoltage: 6,
    esdCapacitance: 100e-12,
    esdVoltage: 100,
    esdSeriesResistance: 1000,
    mosReverseLeakmA: 0.01,
    reverseTopology: "parallel-clamp"
  };
  var QUESTIONS = [
    { key: "overcurrent", prompt: "若负载近似短路，限流电源下的电流最接近什么？", expected: "limited", choices: [["ohm", "只由 V/R 决定"], ["limited", "被限流设定限制"], ["infinite", "无限大"]] },
    { key: "inductive", prompt: "切断电感电流而没有回扫路径，最先变大的是什么？", expected: "voltage", choices: [["voltage", "开关两端的瞬态电压"], ["capacitance", "负载电容变大"], ["nothing", "没有瞬态"]] },
    { key: "reverse", prompt: "在同一限流条件下，反接保护二极管与反向阻断 MOS 的教学比较应关注什么？", expected: "path", choices: [["path", "故障电流路径与器件耗散"], ["color", "只看符号颜色"], ["voltage", "只看供电标称电压"]] }
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
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function formatControl(key, value) {
    if (key === "turnOffUs") return format(value, 0) + " µs";
    if (key === "inductance") return format(value * 1000, 1) + " mH";
    if (key === "esdCapacitance") return format(value * 1e12, 0) + " pF";
    if (key === "esdVoltage") return format(value, 0) + " V（概念脉冲）";
    if (key === "clampVoltage") return format(value, 1) + " V";
    if (key === "currentLimit") return format(value * 1000, 0) + " mA";
    return format(value, 2);
  }
  function normalize(input) {
    var source = input || {};
    var reverseTopology = source.reverseTopology === undefined ? DEFAULTS.reverseTopology : String(source.reverseTopology);
    if (reverseTopology !== "parallel-clamp" && reverseTopology !== "series-block") reverseTopology = DEFAULTS.reverseTopology;
    return {
      supply: clamp(finite(source.supply === undefined ? DEFAULTS.supply : source.supply, "supply"), 1, 12),
      currentLimit: clamp(finite(source.currentLimit === undefined ? DEFAULTS.currentLimit : source.currentLimit, "current limit"), 0.01, 1),
      loadResistance: clamp(finite(source.loadResistance === undefined ? DEFAULTS.loadResistance : source.loadResistance, "load resistance"), 0.1, 200),
      faultResistance: clamp(finite(source.faultResistance === undefined ? DEFAULTS.faultResistance : source.faultResistance, "fault resistance"), 0.01, 20),
      mosRdsOn: clamp(finite(source.mosRdsOn === undefined ? DEFAULTS.mosRdsOn : source.mosRdsOn, "MOS on resistance"), 0.01, 2),
      reversePathResistance: clamp(finite(source.reversePathResistance === undefined ? DEFAULTS.reversePathResistance : source.reversePathResistance, "reverse path resistance"), 1, 1000),
      diodeVf: clamp(finite(source.diodeVf === undefined ? DEFAULTS.diodeVf : source.diodeVf, "diode forward voltage"), 0.1, 2),
      inductance: clamp(finite(source.inductance === undefined ? DEFAULTS.inductance : source.inductance, "inductance"), 1e-6, 1),
      turnOffUs: clamp(finite(source.turnOffUs === undefined ? DEFAULTS.turnOffUs : source.turnOffUs, "turn-off time"), 0.5, 500),
      clampVoltage: clamp(finite(source.clampVoltage === undefined ? DEFAULTS.clampVoltage : source.clampVoltage, "clamp voltage"), 1, 24),
      esdCapacitance: clamp(finite(source.esdCapacitance === undefined ? DEFAULTS.esdCapacitance : source.esdCapacitance, "ESD capacitance"), 1e-12, 10e-9),
      esdVoltage: clamp(finite(source.esdVoltage === undefined ? DEFAULTS.esdVoltage : source.esdVoltage, "ESD concept voltage"), 1, 2000),
      esdSeriesResistance: clamp(finite(source.esdSeriesResistance === undefined ? DEFAULTS.esdSeriesResistance : source.esdSeriesResistance, "ESD series resistance"), 10, 10000),
      mosReverseLeakmA: clamp(finite(source.mosReverseLeakmA === undefined ? DEFAULTS.mosReverseLeakmA : source.mosReverseLeakmA, "MOS reverse leakage"), 0, 1),
      reverseTopology: reverseTopology
    };
  }
  function computeProtection(input) {
    var state = normalize(input);
    var normalUnclamped = state.supply / (state.loadResistance + state.mosRdsOn);
    var normalCurrent = Math.min(state.currentLimit, normalUnclamped);
    var normalMosPower = normalCurrent * normalCurrent * state.mosRdsOn;
    var faultUnclamped = state.supply / (state.faultResistance + state.mosRdsOn);
    var faultCurrent = Math.min(state.currentLimit, faultUnclamped);
    var faultResistancePower = faultCurrent * faultCurrent * state.faultResistance;
    var faultMosPower = faultCurrent * faultCurrent * state.mosRdsOn;
    var faultSourcePower = state.supply * faultCurrent;
    var faultLimiterPower = Math.max(0, (state.supply - faultCurrent * (state.faultResistance + state.mosRdsOn)) * faultCurrent);
    var faultPowerSum = faultResistancePower + faultMosPower + faultLimiterPower;
    var reverseDiodeCurrent = state.reverseTopology === "parallel-clamp" ? Math.min(state.currentLimit, Math.max(0, (state.supply - state.diodeVf) / state.reversePathResistance)) : 0;
    var reverseDiodePower = reverseDiodeCurrent * state.diodeVf;
    var reverseMosCurrent = state.reverseTopology === "series-block" ? state.mosReverseLeakmA * 1e-3 : 0;
    var reverseMosPower = reverseMosCurrent * state.supply;
    var reversePathPower = reverseDiodeCurrent * reverseDiodeCurrent * state.reversePathResistance;
    var reverseSourcePower = state.supply * (reverseDiodeCurrent + reverseMosCurrent);
    var reverseLimiterPower = state.reverseTopology === "parallel-clamp" ? Math.max(0, (state.supply - reverseDiodeCurrent * state.reversePathResistance - state.diodeVf) * reverseDiodeCurrent) : 0;
    var reversePowerSum = reversePathPower + reverseDiodePower + reverseLimiterPower + reverseMosPower;
    var storedEnergy = 0.5 * state.inductance * normalCurrent * normalCurrent;
    var unclampedPeak = state.inductance * normalCurrent / (state.turnOffUs * 1e-6);
    var clampDecayUs = state.inductance * normalCurrent / Math.max(state.clampVoltage, 0.1) * 1e6;
    var clampPower = storedEnergy / Math.max(clampDecayUs * 1e-6, 1e-12);
    var esdEnergy = 0.5 * state.esdCapacitance * state.esdVoltage * state.esdVoltage;
    var esdPeakCurrent = state.esdVoltage / state.esdSeriesResistance;
    var esdClampedCurrent = Math.max(0, (state.esdVoltage - state.clampVoltage) / state.esdSeriesResistance);
    return {
      config: state,
      normalUnclamped: normalUnclamped,
      normalCurrent: normalCurrent,
      normalMosPower: normalMosPower,
      faultUnclamped: faultUnclamped,
      faultCurrent: faultCurrent,
      faultResistancePower: faultResistancePower,
      faultLoadPower: faultResistancePower,
      faultMosPower: faultMosPower,
      faultSourcePower: faultSourcePower,
      faultLimiterPower: faultLimiterPower,
      limiterPower: faultLimiterPower,
      faultPowerSum: faultPowerSum,
      faultPowerResidual: faultSourcePower - faultPowerSum,
      reverseDiodeCurrent: reverseDiodeCurrent,
      reverseDiodePower: reverseDiodePower,
      reverseMosCurrent: reverseMosCurrent,
      reverseMosPower: reverseMosPower,
      reversePathPower: reversePathPower,
      reverseLimiterPower: reverseLimiterPower,
      reverseSourcePower: reverseSourcePower,
      reversePowerSum: reversePowerSum,
      reversePowerResidual: reverseSourcePower - reversePowerSum,
      reverseTopology: state.reverseTopology,
      reverseTopologyLabel: state.reverseTopology === "parallel-clamp" ? "并联钳位（本账本仅此路径）" : "串联阻断（本账本仅此路径）",
      storedEnergy: storedEnergy,
      unclampedPeakVoltage: unclampedPeak,
      clampDecayUs: clampDecayUs,
      clampPower: clampPower,
      esdEnergy: esdEnergy,
      esdPeakCurrent: esdPeakCurrent,
      esdClampedCurrent: esdClampedCurrent,
      faultLimited: faultCurrent <= state.currentLimit + 1e-12,
      pathSummary: "限流器 → 故障点 → 回流/保护器件 → 电源负端"
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
      '[data-learning-lab="' + LAB_ID + '"]{--eps-blue:#2b669e;--eps-red:#b7473b;--eps-green:#39734d;--eps-gold:#9a6a10;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .eps-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--eps-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .eps-primary{border-color:var(--eps-blue);background:var(--eps-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .eps-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .eps-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .eps-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eps-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .eps-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .eps-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--eps-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--eps-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eps-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .eps-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .eps-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .eps-metric{min-width:0;padding:9px;border-top:2px solid var(--eps-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .eps-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eps-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .eps-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eps-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .eps-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .eps-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eps-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .eps-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eps-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .eps-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
    var live = rootNode.querySelector("[data-eps-live]"); if (live) live.textContent = message;
  }
  function drawArrow(doc, node, x1, y1, x2, y2, color, dash) {
    node.appendChild(svgElement(doc, "line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color, "stroke-width": 3, "stroke-dasharray": dash || "" }));
    var angle = Math.atan2(y2 - y1, x2 - x1), size = 8;
    var p1 = x2 - size * Math.cos(angle - Math.PI / 6), p2 = y2 - size * Math.sin(angle - Math.PI / 6);
    var p3 = x2 - size * Math.cos(angle + Math.PI / 6), p4 = y2 - size * Math.sin(angle + Math.PI / 6);
    node.appendChild(svgElement(doc, "polygon", { points: x2 + "," + y2 + " " + p1 + "," + p2 + " " + p3 + "," + p4, fill: color }));
  }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 780 370"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "低压限流系统中的反接、过流和电感回扫保护电流路径");
    node.appendChild(svgElement(doc, "title", {}, "保护器件与故障能量路径"));
    node.appendChild(svgElement(doc, "desc", {}, "上方是电源、限流器、MOS 开关和负载的闭合正常路径；下方明确选择并联反接钳位，并画出二极管、回扫和 ESD 的闭合回流，串联阻断只是未叠加的对照拓扑。"));
    var blue = "var(--eps-blue)", red = "var(--eps-red)", green = "var(--eps-green)", gold = "var(--eps-gold)";
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 24, width: 748, height: 122, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" }));
    svgText(doc, node, "正常低压路径与过流点", 30, 45, { "font-size": 13, "font-weight": 700 });
    node.appendChild(svgElement(doc, "rect", { x: 34, y: 75, width: 70, height: 34, rx: 4, fill: "var(--bg,white)", stroke: green, "stroke-width": 2 })); svgText(doc, node, "5 V 源", 69, 97, { "font-size": 11, "text-anchor": "middle" });
    drawArrow(doc, node, 104, 92, 145, 92, green);
    node.appendChild(svgElement(doc, "rect", { x: 145, y: 75, width: 92, height: 34, rx: 4, fill: "var(--bg,white)", stroke: blue, "stroke-width": 2 })); svgText(doc, node, "限流器", 191, 91, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, format(result.config.currentLimit * 1000, 0) + " mA", 191, 104, { "font-size": 10, "text-anchor": "middle", fill: blue });
    drawArrow(doc, node, 237, 92, 278, 92, blue);
    node.appendChild(svgElement(doc, "rect", { x: 278, y: 75, width: 92, height: 34, rx: 4, fill: "var(--bg,white)", stroke: red, "stroke-width": 2 })); svgText(doc, node, "MOS 开关", 324, 97, { "font-size": 11, "text-anchor": "middle" });
    drawArrow(doc, node, 370, 92, 420, 92, red);
    node.appendChild(svgElement(doc, "rect", { x: 420, y: 75, width: 98, height: 34, rx: 4, fill: "var(--bg,white)", stroke: green, "stroke-width": 2 })); svgText(doc, node, "负载", 469, 91, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, format(result.normalCurrent * 1000, 0) + " mA", 469, 104, { "font-size": 10, "text-anchor": "middle", fill: green });
    drawArrow(doc, node, 518, 92, 650, 92, green); node.appendChild(svgElement(doc, "line", { x1: 650, y1: 92, x2: 650, y2: 125, stroke: "currentColor", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 69, y1: 125, x2: 650, y2: 125, stroke: "currentColor", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 69, y1: 109, x2: 69, y2: 125, stroke: "currentColor", "stroke-width": 2 })); svgText(doc, node, "回流参考（教学系统负端）", 70, 140, { "font-size": 10 });
    node.appendChild(svgElement(doc, "circle", { cx: 324, cy: 92, r: 8, fill: "var(--bg,white)", stroke: red, "stroke-width": 2 })); svgText(doc, node, "故障能量在限流器与回路中结算", 543, 65, { "font-size": 11, fill: red });
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 166, width: 748, height: 184, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" }));
    svgText(doc, node, "反接拓扑：并联钳位（不与串联阻断混算）", 30, 188, { "font-size": 13, "font-weight": 700 });
    drawArrow(doc, node, 55, 225, 146, 225, red); node.appendChild(svgElement(doc, "polygon", { points: "146,213 146,237 160,225", fill: red }));
    node.appendChild(svgElement(doc, "rect", { x: 165, y: 209, width: 104, height: 32, rx: 4, fill: "var(--bg,white)", stroke: red, "stroke-width": 2 })); svgText(doc, node, "反接二极管", 217, 230, { "font-size": 11, "text-anchor": "middle" });
    drawArrow(doc, node, 269, 225, 350, 225, red); svgText(doc, node, format(result.reverseDiodeCurrent * 1000, 1) + " mA", 305, 214, { "font-size": 10, "text-anchor": "middle", fill: red }); svgText(doc, node, "限流后的反接电流", 55, 252, { "font-size": 10 });
    node.appendChild(svgElement(doc, "line", { x1: 350, y1: 225, x2: 350, y2: 275, stroke: red, "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 350, y1: 275, x2: 55, y2: 275, stroke: red, "stroke-width": 2 })); drawArrow(doc, node, 350, 275, 55, 275, red); svgText(doc, node, "并联钳位回流闭合", 205, 292, { "font-size": 10, "text-anchor": "middle", fill: red });
    node.appendChild(svgElement(doc, "path", { d: "M390 295 C390 258 408 258 408 225 C408 195 440 195 440 225 C440 258 458 258 458 295", fill: "none", stroke: gold, "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 390, y1: 295, x2: 458, y2: 295, stroke: gold, "stroke-width": 2 })); svgText(doc, node, "L", 424, 214, { "font-size": 12, "text-anchor": "middle", fill: gold }); svgText(doc, node, "回扫钳位闭合", 424, 319, { "font-size": 10, "text-anchor": "middle", fill: gold });
    drawArrow(doc, node, 500, 225, 586, 225, blue, "5 4"); node.appendChild(svgElement(doc, "rect", { x: 590, y: 209, width: 106, height: 32, rx: 4, fill: "var(--bg,white)", stroke: blue, "stroke-width": 2 })); svgText(doc, node, "ESD 钳位", 643, 230, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, format(result.esdEnergy * 1e6, 2) + " µJ 概念能量", 643, 258, { "font-size": 10, "text-anchor": "middle", fill: blue }); node.appendChild(svgElement(doc, "line", { x1: 696, y1: 225, x2: 720, y2: 225, stroke: blue, "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 720, y1: 225, x2: 720, y2: 275, stroke: blue, "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 720, y1: 275, x2: 500, y2: 275, stroke: blue, "stroke-width": 2 })); drawArrow(doc, node, 720, 275, 500, 275, blue); svgText(doc, node, "ESD 回流闭合", 610, 292, { "font-size": 10, "text-anchor": "middle", fill: blue });
    svgText(doc, node, "无钳位峰值 ≈ " + format(result.unclampedPeakVoltage, 1) + " V", 500, 319, { "font-size": 11, fill: red });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "eps-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode);
    var rows = [
      ["正常工作电流", format(result.normalCurrent * 1000, 1), "mA；含 MOS RDS(on) 且受限流"],
      ["短路/故障电流", format(result.faultCurrent * 1000, 1), "mA；教学故障电阻下"],
      ["故障电阻耗散", format(result.faultResistancePower * 1000, 3), "mW；I²Rfault"],
      ["故障 MOS 耗散", format(result.faultMosPower * 1000, 3), "mW；I²RDS(on)"],
      ["故障限流器耗散", format(result.faultLimiterPower * 1000, 1), "mW；剩余源功率"],
      ["故障源功率 / 分账和", format(result.faultSourcePower * 1000, 1) + " / " + format(result.faultPowerSum * 1000, 1), "mW；守恒残差 " + format(result.faultPowerResidual * 1e6, 2) + " µW"],
      ["反接拓扑", result.reverseTopologyLabel, "二极管并联钳位与 MOS 串联阻断不混算"],
      ["反接二极管电流", format(result.reverseDiodeCurrent * 1000, 2), "mA；当前选定拓扑"],
      ["串联阻断 MOS 漏电（对照）", format(result.config.mosReverseLeakmA, 3), "mA；未与并联二极管相加"],
      ["电感储能", format(result.storedEnergy * 1000, 3), "mJ；1/2 LI²"],
      ["无钳位峰值代理", format(result.unclampedPeakVoltage, 1), "V；L·di/dt 教学估算"],
      ["回扫衰减时间", format(result.clampDecayUs, 1), "µs；钳位电压模型"],
      ["ESD 概念能量", format(result.esdEnergy * 1e6, 3), "µJ；1/2 CV²，不是测试规程"]
    ];
    var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "保护与故障能量账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "读数" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "eps-shell" });
    shell.appendChild(element(doc, "h3", { text: "保护实验：反接、过流与感性回扫" })); shell.appendChild(element(doc, "p", { className: "eps-note", text: "只讨论 1–12 V、限流、可断电教学回路；先判断故障能量走哪条路，揭示后再调节模型输入。ESD 数值仅作概念演示。" }));
    var predictionHost = element(doc, "div"), groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "eps-choice-grid" }), buttons = [];
      question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); });
      groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "eps-actions" }); var reveal = element(doc, "button", { type: "button", className: "eps-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "eps-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback); var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "eps-controls" });
    var specs = [["currentLimit", "限流设定", 0.05, 0.8, 0.01], ["faultResistance", "故障电阻", 0.05, 10, 0.05], ["inductance", "负载电感", 1e-3, 50e-3, 1e-3], ["turnOffUs", "关断时间", 2, 100, 2], ["clampVoltage", "钳位电压", 2, 12, 0.5], ["esdVoltage", "ESD 概念电压", 10, 500, 10]]; var inputs = {}, outputs = {};
    specs.forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "eps-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output; });
    results.appendChild(controls); var layout = element(doc, "div", { className: "eps-layout" }); var stage = element(doc, "div", { className: "eps-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"), metrics = element(doc, "div", { className: "eps-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "eps-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "eps-note", text: "闭合的教学路径不等于认证保护。真实设计还要查 SOA、峰值电流、反向电压、热阻、PCB 回流和适用标准；不得把本实验外推到市电或高能电池。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeProtection(state.config); results.hidden = !state.revealed; specs.forEach(function (spec) { outputs[spec[0]].textContent = formatControl(spec[0], result.config[spec[0]]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "故障电流", format(result.faultCurrent * 1000, 1) + " mA")); metrics.appendChild(metric(doc, "电感储能", format(result.storedEnergy * 1000, 3) + " mJ")); metrics.appendChild(metric(doc, "无钳位峰值", format(result.unclampedPeakVoltage, 1) + " V")); metrics.appendChild(metric(doc, "ESD 能量", format(result.esdEnergy * 1e6, 2) + " µJ")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在追踪限流器、保护器件和负载中的能量。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; specs.forEach(function (spec) { inputs[spec[0]].value = state.config[spec[0]]; }); render(); announce(api, rootNode, "保护实验已重置。"); }); rootNode.appendChild(shell); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-eps-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeProtection(DEFAULTS);
    check(result.normalCurrent > 0 && result.normalCurrent <= DEFAULTS.currentLimit, "normal current stays within limit");
    check(near(computeProtection({ loadResistance: 0.1 }).normalCurrent, DEFAULTS.currentLimit), "near-short normal current reaches limit");
    check(result.faultCurrent <= DEFAULTS.currentLimit + 1e-12, "fault current is limited");
    check(near(result.faultSourcePower, result.faultPowerSum, 1e-10) && near(result.faultPowerResidual, 0, 1e-10), "fault source power is conserved");
    check(result.faultResistancePower > 0 && result.faultMosPower > 0 && result.faultLimiterPower > 0, "fault power is itemized");
    check(result.storedEnergy > 0 && result.unclampedPeakVoltage > 0, "inductive energy and voltage");
    check(result.clampDecayUs < DEFAULTS.turnOffUs * 100, "clamp decay is finite");
    check(result.reverseDiodePower > result.reverseMosPower, "diode and MOS paths differ");
    check(result.reverseTopology === "parallel-clamp" && near(result.reverseSourcePower, result.reversePowerSum, 1e-10), "parallel reverse path is closed and conserved");
    var seriesBlock = computeProtection({ reverseTopology: "series-block" });
    check(seriesBlock.reverseDiodeCurrent === 0 && seriesBlock.reverseMosCurrent > 0 && near(seriesBlock.reverseSourcePower, seriesBlock.reversePowerSum, 1e-10), "series blocking path is not mixed with diode clamp");
    check(near(result.esdEnergy, 0.5 * DEFAULTS.esdCapacitance * DEFAULTS.esdVoltage * DEFAULTS.esdVoltage), "ESD energy units");
    check(computeProtection({ currentLimit: 0.1 }).faultCurrent < result.faultCurrent, "lower limit lowers fault current");
    check(JSON.stringify(result) === JSON.stringify(computeProtection(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, normalize: normalize, computeProtection: computeProtection, compute: computeProtection, mount: mount, selfTest: selfTest };
});
