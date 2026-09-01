(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-grounding-emc", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-grounding-emc self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-grounding-emc self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "ee-grounding-emc";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-" + NAME + "-styles";
  var INSTANCE = 0;
  var DEFAULTS = Object.freeze({
    loopAreaCm2: 20,
    edgeNs: 8,
    edgeCurrentmA: 30,
    returnCurrentmA: 100,
    groundImpedanceMOhm: 50,
    commonCurrentmA: 2,
    mismatchPct: 3,
    couplingPct: 10,
    signalmV: 500,
    shield: "one"
  });
  var QUESTIONS = [
    { key: "ground", prompt: "两个 GND 点有回流电流和有限阻抗时，电位差能否为严格 0 V？", expected: "notzero", choices: [["notzero", "可能有 mV 偏移"], ["zero", "严格为 0 V"], ["unknown", "与电流无关"]] },
    { key: "area", prompt: "保持 di/dt 不变，增大回路面积，电感性瞬态怎样变化？", expected: "higher", choices: [["higher", "通常更高"], ["lower", "通常更低"], ["same", "不变"]] },
    { key: "mode", prompt: "理想对称差分对中的共模干扰，是否必然等于差模误差？", expected: "no", choices: [["no", "不必然"], ["yes", "必然"], ["same", "两者定义相同"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function bounded(value, low, high, label) { return clamp(finite(value, label), low, high); }
  function choice(value, values, fallback) { var text = String(value); return values.indexOf(text) >= 0 ? text : fallback; }
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
      loopAreaCm2: bounded(source.loopAreaCm2 === undefined ? DEFAULTS.loopAreaCm2 : source.loopAreaCm2, 1, 200, "loop area"),
      edgeNs: bounded(source.edgeNs === undefined ? DEFAULTS.edgeNs : source.edgeNs, 0.5, 50, "edge time"),
      edgeCurrentmA: bounded(source.edgeCurrentmA === undefined ? DEFAULTS.edgeCurrentmA : source.edgeCurrentmA, 1, 200, "edge current"),
      returnCurrentmA: bounded(source.returnCurrentmA === undefined ? DEFAULTS.returnCurrentmA : source.returnCurrentmA, 1, 300, "return current"),
      groundImpedanceMOhm: bounded(source.groundImpedanceMOhm === undefined ? DEFAULTS.groundImpedanceMOhm : source.groundImpedanceMOhm, 1, 300, "ground impedance"),
      commonCurrentmA: bounded(source.commonCurrentmA === undefined ? DEFAULTS.commonCurrentmA : source.commonCurrentmA, 0.01, 20, "common-mode current"),
      mismatchPct: bounded(source.mismatchPct === undefined ? DEFAULTS.mismatchPct : source.mismatchPct, 0, 30, "mismatch"),
      couplingPct: bounded(source.couplingPct === undefined ? DEFAULTS.couplingPct : source.couplingPct, 0, 100, "coupling"),
      signalmV: bounded(source.signalmV === undefined ? DEFAULTS.signalmV : source.signalmV, 10, 2000, "signal amplitude"),
      shield: choice(source.shield === undefined ? DEFAULTS.shield : source.shield, ["none", "one", "both"], DEFAULTS.shield)
    };
  }
  function computeGrounding(input) {
    var config = normalize(input);
    var loopInductanceNh = 8 + 0.7 * config.loopAreaCm2;
    var inductiveKickmV = loopInductanceNh * config.edgeCurrentmA / config.edgeNs;
    var groundShiftmV = config.returnCurrentmA * config.groundImpedanceMOhm / 1000;
    var commonNoisemV = config.commonCurrentmA * config.groundImpedanceMOhm / 1000;
    var convertedCommonmV = commonNoisemV * config.mismatchPct / 100;
    var couplingNoiseM = inductiveKickmV * config.couplingPct / 100;
    var differentialNoisemV = couplingNoiseM + convertedCommonmV;
    var highFrequencyShieldReturnBenefit = { none: 0.1, one: 0.6, both: 0.9 }[config.shield];
    var lowFrequencyGroundLoopRisk = { none: 0.1, one: 0.2, both: 0.8 }[config.shield];
    var signalRatio = differentialNoisemV / config.signalmV;
    var lowFrequencyRiskIndex = clamp(0.55 * signalRatio + 0.25 * config.loopAreaCm2 / 100 + 0.20 * lowFrequencyGroundLoopRisk, 0, 1);
    return {
      config: config,
      loopInductanceNh: loopInductanceNh,
      inductiveKickmV: inductiveKickmV,
      groundShiftmV: groundShiftmV,
      commonNoiseM: commonNoisemV,
      commonNoisemV: commonNoisemV,
      convertedCommonmV: convertedCommonmV,
      couplingNoiseM: couplingNoiseM,
      differentialNoisemV: differentialNoisemV,
      shieldHighFrequency: highFrequencyShieldReturnBenefit,
      shieldLoopRisk: lowFrequencyGroundLoopRisk,
      highFrequencyShieldReturnBenefit: highFrequencyShieldReturnBenefit,
      lowFrequencyGroundLoopRisk: lowFrequencyGroundLoopRisk,
      signalRatio: signalRatio,
      lowFrequencyRiskIndex: lowFrequencyRiskIndex,
      riskIndex: lowFrequencyRiskIndex,
      interpretation: lowFrequencyRiskIndex < 0.2 ? "低频地环风险相对较低" : lowFrequencyRiskIndex < 0.5 ? "低频地环需检查回流/模式转换" : "低频地环风险较高，先缩小回路并测量"
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
      '[data-learning-lab="' + NAME + '"]{--ege-blue:#28659d;--ege-green:#39734d;--ege-gold:#9b6a12;--ege-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] [hidden]{display:none!important}[data-learning-lab="' + NAME + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input,[data-learning-lab="' + NAME + '"] select{font:inherit;letter-spacing:0}[data-learning-lab="' + NAME + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] button:hover{border-color:var(--ege-blue)}[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .ege-primary{background:var(--ege-blue);border-color:var(--ege-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:disabled{cursor:not-allowed;opacity:.55}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .ege-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + NAME + '"] .ege-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + NAME + '"] .ege-actions>*{flex:1 1 180px}[data-learning-lab="' + NAME + '"] .ege-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + NAME + '"] .ege-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + NAME + '"] .ege-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .ege-control label{font-size:12px;font-weight:700;line-height:1.4}[data-learning-lab="' + NAME + '"] .ege-control output{color:var(--ege-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] input[type=range],[data-learning-lab="' + NAME + '"] select{display:block;width:100%;min-height:44px}[data-learning-lab="' + NAME + '"] input[type=range]{accent-color:var(--ege-blue)}' +
      '[data-learning-lab="' + NAME + '"] .ege-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + NAME + '"] .ege-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .ege-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + NAME + '"] .ege-metric{min-width:0;padding:9px;border-top:2px solid var(--ege-blue);background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] .ege-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .ege-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .ege-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + NAME + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .ege-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + NAME + '"] .ege-layout{grid-template-columns:1fr}}@media(max-width:680px){[data-learning-lab="' + NAME + '"] .ege-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){[data-learning-lab="' + NAME + '"] .ege-choice-grid,[data-learning-lab="' + NAME + '"] .ege-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .ege-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-ege-live]"); if (live) live.textContent = message; }
  function arrow(doc, svg, x1, y1, x2, y2, color, dash) {
    svg.appendChild(svgElement(doc, "line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color, "stroke-width": 3, "stroke-dasharray": dash || "" }));
    var direction = x2 >= x1 ? 1 : -1;
    svg.appendChild(svgElement(doc, "polygon", { points: x2 + "," + y2 + " " + (x2 - direction * 10) + "," + (y2 - 6) + " " + (x2 - direction * 10) + "," + (y2 + 6), fill: color }));
  }
  function drawPaths(doc, svg, result) {
    var c = result.config;
    svg.appendChild(svgElement(doc, "rect", { x: 14, y: 36, width: 405, height: 300, rx: 6, fill: "var(--bg,transparent)", stroke: "currentColor", "stroke-opacity": ".25" }));
    svgText(doc, svg, "回流与模式：同一对线上的两种读法", 28, 61, { "font-size": 13, "font-weight": 700 });
    svg.appendChild(svgElement(doc, "rect", { x: 45, y: 98, width: 82, height: 54, rx: 5, fill: "var(--ege-green)", "fill-opacity": ".84" }));
    svg.appendChild(svgElement(doc, "rect", { x: 300, y: 98, width: 82, height: 54, rx: 5, fill: "var(--ege-gold)", "fill-opacity": ".84" }));
    svgText(doc, svg, "扰动源", 86, 131, { "font-size": 11, "text-anchor": "middle", fill: "#fff" });
    svgText(doc, svg, "受害端", 341, 131, { "font-size": 11, "text-anchor": "middle", fill: "#fff" });
    svg.appendChild(svgElement(doc, "line", { x1: 127, y1: 111, x2: 300, y2: 111, stroke: "var(--ege-blue)", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "line", { x1: 127, y1: 139, x2: 300, y2: 139, stroke: "var(--ege-red)", "stroke-width": 3 }));
    svgText(doc, svg, "V+", 143, 105, { "font-size": 10.5, fill: "var(--ege-blue)" }); svgText(doc, svg, "V-", 143, 158, { "font-size": 10.5, fill: "var(--ege-red)" });
    arrow(doc, svg, 155, 111, 260, 111, "var(--ege-gold)", "5 4"); arrow(doc, svg, 155, 139, 260, 139, "var(--ege-gold)", "5 4");
    svgText(doc, svg, "共模：同向", 207, 92, { "font-size": 10.5, "text-anchor": "middle", fill: "var(--ege-gold)" });
    arrow(doc, svg, 276, 111, 165, 111, "var(--ege-red)", "2 3"); arrow(doc, svg, 165, 139, 276, 139, "var(--ege-red)", "2 3");
    svgText(doc, svg, "差模：反向", 207, 181, { "font-size": 10.5, "text-anchor": "middle", fill: "var(--ege-red)" });
    svg.appendChild(svgElement(doc, "path", { d: "M62 174 C150 265 276 265 366 174", fill: "none", stroke: "var(--ege-gold)", "stroke-width": 3, "stroke-dasharray": "8 5" }));
    svgText(doc, svg, "参考/回流：Z = " + format(c.groundImpedanceMOhm, 0) + " mΩ", 214, 252, { "font-size": 11, "text-anchor": "middle", fill: "var(--ege-gold)" });
    svg.appendChild(svgElement(doc, "path", { d: "M76 82 C170 55 270 55 352 82", fill: "none", stroke: c.shield === "none" ? "currentColor" : "var(--ege-blue)", "stroke-width": 2, "stroke-dasharray": c.shield === "both" ? "" : "8 5" }));
    svgText(doc, svg, "屏蔽：" + (c.shield === "none" ? "未接" : c.shield === "one" ? "单端" : "两端"), 214, 76, { "font-size": 10.5, "text-anchor": "middle", fill: c.shield === "none" ? "var(--fg-soft)" : "var(--ege-blue)" });
    svgText(doc, svg, "面积 " + format(c.loopAreaCm2, 0) + " cm² · L≈" + format(result.loopInductanceNh, 1) + " nH", 28, 316, { "font-size": 10.5 });
  }
  function drawBars(doc, svg, result) {
    svg.appendChild(svgElement(doc, "rect", { x: 431, y: 36, width: 409, height: 300, rx: 6, fill: "var(--bg,transparent)", stroke: "currentColor", "stroke-opacity": ".25" }));
    svgText(doc, svg, "测量量：参考移动、共模与差模", 445, 61, { "font-size": 13, "font-weight": 700 });
    var items = [["地电位差", result.groundShiftmV, "var(--ege-gold)"], ["共模噪声", result.commonNoiseM, "var(--ege-blue)"], ["差模耦合", result.differentialNoisemV, "var(--ege-red)"]];
    var max = Math.max(1, result.differentialNoisemV, result.inductiveKickmV / 4);
    var baseline = 255;
    items.forEach(function (item, index) {
      var x = 474 + index * 112; var h = 145 * item[1] / max;
      svg.appendChild(svgElement(doc, "rect", { x: x, y: baseline - h, width: 55, height: Math.max(2, h), fill: item[2], "fill-opacity": ".82" }));
      svgText(doc, svg, format(item[1], 2), x + 27, baseline - h - 9, { "font-size": 11, "text-anchor": "middle", fill: item[2] });
      svgText(doc, svg, item[0], x + 27, baseline + 22, { "font-size": 10.5, "text-anchor": "middle" });
      svgText(doc, svg, "mV", x + 27, baseline + 38, { "font-size": 10, "text-anchor": "middle", fill: "var(--fg-soft)" });
    });
    svg.appendChild(svgElement(doc, "line", { x1: 454, y1: baseline, x2: 814, y2: baseline, stroke: "currentColor", "stroke-opacity": ".45" }));
    svgText(doc, svg, "Ldi/dt ≈ " + format(result.inductiveKickmV, 1) + " mV", 449, 96, { "font-size": 11, fill: "var(--ege-red)" });
    svgText(doc, svg, "VDM / 信号 ≈ " + format(result.signalRatio * 100, 1) + "%", 449, 119, { "font-size": 11, fill: "var(--ege-red)" });
    svgText(doc, svg, "低频地环风险 " + format(result.lowFrequencyGroundLoopRisk * 100, 0) + "%", 449, 307, { "font-size": 10.5, fill: "var(--ege-gold)" });
    svgText(doc, svg, "高频屏蔽/回流收益 " + format(result.highFrequencyShieldReturnBenefit * 100, 0) + "%", 449, 324, { "font-size": 10.5, fill: "var(--ege-blue)" });
  }
  function draw(doc, svg, result) {
    clear(svg); svg.setAttribute("viewBox", "0 0 860 350"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "回流路径、共模差模方向和接地 EMC 教学代理示意");
    svg.appendChild(svgElement(doc, "title", {}, "回流、共模与差模路径")); svg.appendChild(svgElement(doc, "desc", {}, "左侧显示信号对、同向共模箭头、反向差模箭头、回流路径和屏蔽连接，右侧显示地电位差、共模噪声和差模耦合的教学代理量。"));
    drawPaths(doc, svg, result); drawBars(doc, svg, result);
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "ege-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, target, result) {
    clear(target); var rows = [
      ["回路电感代理", format(result.loopInductanceNh, 1), "nH；8 + 0.7 × 面积(cm²)教学代理"],
      ["电感性瞬态", format(result.inductiveKickmV, 1), "mV；L·di/dt"],
      ["地电位差", format(result.groundShiftmV, 2), "mV；Ireturn·Zreturn"],
      ["共模路径噪声", format(result.commonNoisemV, 3), "mV；Icm·Zreturn"],
      ["共模转差模", format(result.convertedCommonmV, 4), "mV；不对称代理"],
      ["差模耦合代理", format(result.differentialNoisemV, 3), "mV；耦合项 + 转换项"],
      ["屏蔽模式", result.config.shield === "none" ? "未接" : result.config.shield === "one" ? "单端" : "两端", "不输出无条件优劣排序"],
      ["低频地环风险", format(result.lowFrequencyGroundLoopRisk, 2), "0–1；低频闭合环路代理"],
      ["高频屏蔽/回流收益", format(result.highFrequencyShieldReturnBenefit, 2), "0–1；高频路径代理"],
      ["低频风险指数", format(result.lowFrequencyRiskIndex, 3), "0–1；只作低频诊断，不是 EMC 限值"]
    ];
    var table = element(doc, "table", { "aria-label": "接地与 EMC 账本" }); table.appendChild(element(doc, "caption", { text: "接地与 EMC 账本" })); table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })]))); var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); table.appendChild(body); target.appendChild(table);
  }
  function addSelect(doc, controls, state, field, labelText, options, onChange) { var id = NAME + "-" + (++INSTANCE) + "-" + field; var label = element(doc, "label", { htmlFor: id, text: labelText }); var select = element(doc, "select", { id: id, "aria-label": labelText }); options.forEach(function (option) { select.appendChild(element(doc, "option", { value: option[0], text: option[1] })); }); select.value = state[field]; select.addEventListener("change", function () { state[field] = select.value; onChange(); }); controls.appendChild(element(doc, "div", { className: "ege-control" }, [label, select])); }
  function addRange(doc, controls, state, field, labelText, min, max, step, unit, onChange) { var id = NAME + "-" + (++INSTANCE) + "-" + field; var output = element(doc, "output", { text: "" }); var label = element(doc, "label", { htmlFor: id, text: labelText }); var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, value: state[field], "aria-label": labelText }); input.addEventListener("input", function () { state[field] = Number(input.value); onChange(); }); controls.appendChild(element(doc, "div", { className: "ege-control" }, [label, output, input])); return { input: input, output: output, unit: unit }; }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return; var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { loopAreaCm2: DEFAULTS.loopAreaCm2, edgeNs: DEFAULTS.edgeNs, edgeCurrentmA: DEFAULTS.edgeCurrentmA, returnCurrentmA: DEFAULTS.returnCurrentmA, groundImpedanceMOhm: DEFAULTS.groundImpedanceMOhm, commonCurrentmA: DEFAULTS.commonCurrentmA, mismatchPct: DEFAULTS.mismatchPct, couplingPct: DEFAULTS.couplingPct, signalmV: DEFAULTS.signalmV, shield: DEFAULTS.shield, predictions: {}, revealed: false, feedback: "请先完成三项方向预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "ege-shell" }); shell.appendChild(element(doc, "h3", { text: "接地与 EMC 实验：回流、模式与屏蔽" })); shell.appendChild(element(doc, "p", { className: "ege-note", text: "先画回流和模式，再改变几何、边沿、阻抗与屏蔽连接。" })); var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "ege-choice-grid", role: "group", "aria-label": question.prompt }); var buttons = []; question.choices.forEach(function (item) { var button = element(doc, "button", { type: "button", text: item[1], "aria-pressed": "false" }); button.value = item[0]; button.addEventListener("click", function () { state.predictions[question.key] = item[0]; buttons.forEach(function (other) { other.setAttribute("aria-pressed", other.value === item[0] ? "true" : "false"); }); updateGate(); }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); }); shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "ege-actions" }); var reveal = element(doc, "button", { type: "button", className: "ege-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "ege-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback); shell.appendChild(element(doc, "p", { className: "cl-sr-only", "data-ege-live": true, "aria-live": "polite" }));
    var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "ege-controls" }); addSelect(doc, controls, state, "shield", "屏蔽连接", [["none", "未接"], ["one", "单端"], ["both", "两端"]], renderResult); var refs = {};
    refs.loopAreaCm2 = addRange(doc, controls, state, "loopAreaCm2", "回路面积", 1, 200, 1, " cm²", renderResult); refs.edgeNs = addRange(doc, controls, state, "edgeNs", "边沿时间", 0.5, 50, 0.5, " ns", renderResult); refs.edgeCurrentmA = addRange(doc, controls, state, "edgeCurrentmA", "边沿电流", 1, 200, 1, " mA", renderResult); refs.returnCurrentmA = addRange(doc, controls, state, "returnCurrentmA", "回流电流", 1, 300, 1, " mA", renderResult); refs.groundImpedanceMOhm = addRange(doc, controls, state, "groundImpedanceMOhm", "回流阻抗", 1, 300, 1, " mΩ", renderResult); refs.commonCurrentmA = addRange(doc, controls, state, "commonCurrentmA", "共模电流", 0.01, 20, 0.01, " mA", renderResult); refs.mismatchPct = addRange(doc, controls, state, "mismatchPct", "不对称", 0, 30, 1, " %", renderResult); refs.couplingPct = addRange(doc, controls, state, "couplingPct", "电感耦合代理", 0, 100, 1, " %", renderResult); refs.signalmV = addRange(doc, controls, state, "signalmV", "目标差模信号", 10, 2000, 10, " mV", renderResult); results.appendChild(controls);
    var layout = element(doc, "div", { className: "ege-layout" }); var stage = element(doc, "div", { className: "ege-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "ege-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "ege-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "ege-note", text: "教学代理用于选择测量路径；不等于 EMC 认证或安全接地要求。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function updateGate() { reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeGrounding(state); results.hidden = !state.revealed; Object.keys(refs).forEach(function (key) { var digits = key === "commonCurrentmA" ? 2 : key === "signalmV" || key === "loopAreaCm2" || key === "mismatchPct" || key === "couplingPct" ? 0 : key === "edgeNs" ? 1 : 0; refs[key].output.textContent = format(result.config[key], digits) + refs[key].unit; }); draw(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "电感性瞬态", format(result.inductiveKickmV, 1) + " mV")); metrics.appendChild(metric(doc, "地电位差", format(result.groundShiftmV, 2) + " mV")); metrics.appendChild(metric(doc, "差模耦合", format(result.differentialNoisemV, 2) + " mV")); metrics.appendChild(metric(doc, "状态", result.interpretation)); renderTable(doc, tableWrap, result); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) return; var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 项命中。现在对照共模、差模和回流读数。"; renderResult(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { Object.keys(DEFAULTS).forEach(function (key) { state[key] = DEFAULTS[key]; }); state.predictions = {}; state.revealed = false; state.feedback = "请先完成三项方向预测。"; controls.querySelectorAll("select").forEach(function (select) { var field = select.id.slice((NAME + "-").length).split("-").slice(1).join("-"); select.value = state[field]; }); Object.keys(refs).forEach(function (key) { refs[key].input.value = state[key]; }); groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); updateGate(); renderResult(); announce(api, rootNode, "接地与 EMC 实验已重置。"); });
    renderResult(); updateGate();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var base = computeGrounding(DEFAULTS); check(near(base.loopInductanceNh, 22), "loop inductance proxy"); check(near(base.inductiveKickmV, 82.5), "inductive kick"); check(near(base.groundShiftmV, 5), "ground shift"); check(near(base.commonNoisemV, 0.1), "common-mode noise"); check(near(base.lowFrequencyGroundLoopRisk, 0.2) && near(base.highFrequencyShieldReturnBenefit, 0.6), "default shield reports separate bands"); check(computeGrounding({ loopAreaCm2: 40 }).inductiveKickmV > base.inductiveKickmV, "larger loop raises kick"); check(computeGrounding({ mismatchPct: 0 }).convertedCommonmV === 0, "symmetric pair rejects common-mode conversion"); check(computeGrounding({ groundImpedanceMOhm: 100 }).groundShiftmV > base.groundShiftmV, "ground impedance matters"); var both = computeGrounding({ shield: "both" }); check(both.highFrequencyShieldReturnBenefit > base.highFrequencyShieldReturnBenefit && both.lowFrequencyGroundLoopRisk > base.lowFrequencyGroundLoopRisk, "both-end shield exposes benefit/risk tradeoff"); check(JSON.stringify(base) === JSON.stringify(computeGrounding(DEFAULTS)), "deterministic result"); return { checks: checks }; }
  return { NAME: NAME, DEFAULTS: DEFAULTS, compute: computeGrounding, computeGrounding: computeGrounding, mount: mount, selfTest: selfTest };
});
