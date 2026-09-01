(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-lumped-components", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-lumped-components self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-lumped-components self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "ee-lumped-components";
  var STYLE_ID = "cl-ee-lumped-components-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { R: 100, C: 10e-9, L: 1e-6, length: 0.3, frequency: 1e6, velocity: 2e8, riseTime: 10e-9 };
  var QUESTIONS = [
    { key: "length", prompt: "频率不变时，把互连长度加长十倍，传播延迟与周期之比怎样？", expected: "higher", choices: [["higher", "增大"], ["lower", "减小"], ["same", "不变"]] },
    { key: "capacitor", prompt: "频率升高时，电容的幅值阻抗 |Z_C| 怎样？", expected: "lower", choices: [["lower", "降低"], ["higher", "升高"], ["same", "不变"]] },
    { key: "model", prompt: "当传播延迟不再远小于周期，单一 R/C/L 集总模型应怎样处理？", expected: "distributed", choices: [["distributed", "转向分布参数模型"], ["lumped", "继续忽略传播"], ["zero", "把寄生设为零"]] }
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
      R: clamp(finite(source.R === undefined ? DEFAULTS.R : source.R, "resistance"), 1, 10000),
      C: clamp(finite(source.C === undefined ? DEFAULTS.C : source.C, "capacitance"), 1e-10, 1e-3),
      L: clamp(finite(source.L === undefined ? DEFAULTS.L : source.L, "inductance"), 1e-9, 1),
      length: clamp(finite(source.length === undefined ? DEFAULTS.length : source.length, "length"), 0.001, 100),
      frequency: clamp(finite(source.frequency === undefined ? DEFAULTS.frequency : source.frequency, "frequency"), 10, 1e9),
      velocity: clamp(finite(source.velocity === undefined ? DEFAULTS.velocity : source.velocity, "propagation velocity"), 1e7, 3e8),
      riseTime: clamp(finite(source.riseTime === undefined ? DEFAULTS.riseTime : source.riseTime, "digital rise time"), 1e-12, 1e-3)
    };
  }
  function computeLumped(input) {
    var config = normalize(input);
    var omega = 2 * Math.PI * config.frequency;
    var period = 1 / config.frequency;
    var delay = config.length / config.velocity;
    var sineRatio = delay / period;
    var edgeRatio = delay / config.riseTime;
    var wavelength = config.velocity / config.frequency;
    var xC = 1 / (omega * config.C);
    var xL = omega * config.L;
    var tauRC = config.R * config.C;
    var tauLR = config.L / config.R;
    var phaseRad = omega * delay;
    return {
      config: config,
      omega: omega,
      period: period,
      delay: delay,
      wavelength: wavelength,
      electricalLength: sineRatio,
      sineRatio: sineRatio,
      tpOverTr: edgeRatio,
      edgeRatio: edgeRatio,
      phaseRad: phaseRad,
      xC: xC,
      zC: { real: 0, imag: -xC, magnitude: xC },
      xL: xL,
      tauRC: tauRC,
      tauLR: tauLR,
      lumped: sineRatio <= 0.1,
      sineLumped: sineRatio <= 0.1,
      digitalWarning: edgeRatio >= 0.5,
      transmissionLineWarning: edgeRatio >= 0.5,
      interpretation: sineRatio > 0.1 ? "正弦 tp/T 已超教学集总判据；需检查传播效应" : edgeRatio >= 0.5 ? "数字边沿 tp/tr 达到约 0.5；进入传输线警戒" : "正弦与数字边沿判据均未触发警戒"
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
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) {
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
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgText(doc, parent, text, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, text)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--elc-blue:#1769aa;--elc-green:#2e7d57;--elc-red:#b23a32;--elc-gold:#9b6a12;display:block;max-width:100%;min-width:0;line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .elc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--elc-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .elc-primary{border-color:var(--elc-blue);background:var(--elc-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .elc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .elc-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .elc-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}[data-learning-lab="' + LAB_ID + '"] .elc-controls{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .elc-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .elc-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--elc-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--elc-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .elc-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .elc-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .elc-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .elc-metric{min-width:0;padding:9px;border-top:2px solid var(--elc-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .elc-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .elc-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .elc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .elc-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .elc-controls{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .elc-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .elc-choice-grid,[data-learning-lab="' + LAB_ID + '"] .elc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .elc-choice-grid,[data-learning-lab="' + LAB_ID + '"] .elc-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .elc-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-elc-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 760 315"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "R C L 集总电路与传播尺度示意");
    node.appendChild(svgElement(doc, "title", {}, "R、C、L 参考方向和集总尺度"));
    node.appendChild(svgElement(doc, "desc", {}, "左侧串联电路标出电流和各元件电压参考方向，右侧比较一个周期与互连传播延迟。"));
    node.appendChild(svgElement(doc, "line", { x1: 34, y1: 120, x2: 92, y2: 120, stroke: "var(--elc-blue)", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "rect", { x: 92, y: 91, width: 55, height: 58, rx: 4, fill: "var(--elc-blue)", "fill-opacity": ".12", stroke: "var(--elc-blue)", "stroke-width": 2 }));
    svgText(doc, node, "源", 119, 118, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, "vs", 119, 137, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 147, y1: 120, x2: 180, y2: 120, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "rect", { x: 180, y: 93, width: 72, height: 54, rx: 4, fill: "var(--elc-green)", "fill-opacity": ".12", stroke: "var(--elc-green)", "stroke-width": 2 }));
    svgText(doc, node, "R", 216, 117, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.R, 0) + " Ω", 216, 136, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 252, y1: 120, x2: 285, y2: 120, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "rect", { x: 285, y: 93, width: 72, height: 54, rx: 4, fill: "var(--elc-gold)", "fill-opacity": ".12", stroke: "var(--elc-gold)", "stroke-width": 2 }));
    svgText(doc, node, "L", 321, 117, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.L * 1e6, 2) + " μH", 321, 136, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 357, y1: 120, x2: 390, y2: 120, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "rect", { x: 390, y: 93, width: 72, height: 54, rx: 4, fill: "var(--elc-red)", "fill-opacity": ".12", stroke: "var(--elc-red)", "stroke-width": 2 }));
    svgText(doc, node, "C", 426, 117, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.C * 1e9, 2) + " nF", 426, 136, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 462, y1: 120, x2: 462, y2: 207, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 407, y1: 207, x2: 517, y2: 207, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 423, y1: 218, x2: 501, y2: 218, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 440, y1: 229, x2: 484, y2: 229, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 54, y1: 207, x2: 407, y2: 207, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 54, y1: 207, x2: 54, y2: 120, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 65, y1: 79, x2: 65, y2: 120, stroke: "var(--elc-blue)", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "polygon", { points: "65,79 59,91 71,91", fill: "var(--elc-blue)" })); svgText(doc, node, "i", 73, 83, { "font-size": 13, fill: "var(--elc-blue)" });
    svgText(doc, node, "+ vR -", 216, 78, { "font-size": 11, "text-anchor": "middle", fill: "var(--elc-green)" }); svgText(doc, node, "+ vL -", 321, 78, { "font-size": 11, "text-anchor": "middle", fill: "var(--elc-gold)" }); svgText(doc, node, "+ vC -", 426, 78, { "font-size": 11, "text-anchor": "middle", fill: "var(--elc-red)" });
    svgText(doc, node, "同一张图先固定参考方向，再写方程", 254, 274, { "font-size": 11, "text-anchor": "middle" });
    var left = 550, right = 730, y = 175;
    node.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: 95, x2: left, y2: y, stroke: "currentColor", "stroke-opacity": ".5" }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: 95, x2: right, y2: 95, stroke: "var(--elc-gold)", "stroke-width": 4 }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: 125, x2: left + Math.min(160, Math.max(8, 160 * result.electricalLength / 0.1)), y2: 125, stroke: "var(--elc-red)", "stroke-width": 5 }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: 155, x2: right, y2: 155, stroke: "var(--elc-blue)", "stroke-width": 4 }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: 185, x2: left + Math.min(160, Math.max(8, 160 * result.edgeRatio / 0.5)), y2: 185, stroke: "var(--elc-red)", "stroke-width": 5 }));
    svgText(doc, node, "正弦周期 T", 640, 84, { "font-size": 12, "text-anchor": "middle", fill: "var(--elc-gold)" });
    svgText(doc, node, "正弦 tp", 610, 145, { "font-size": 11, fill: "var(--elc-red)" });
    svgText(doc, node, "数字边沿 tr", 640, 175, { "font-size": 11, "text-anchor": "middle", fill: "var(--elc-blue)" });
    svgText(doc, node, "数字 tp", 610, 204, { "font-size": 11, fill: "var(--elc-red)" });
    svgText(doc, node, "正弦 tp/T = " + format(result.sineRatio, 4), 640, 225, { "font-size": 11, "font-weight": 700, "text-anchor": "middle" });
    svgText(doc, node, "数字 tp/tr = " + format(result.edgeRatio, 4) + (result.digitalWarning ? "：传输线警戒" : "：< 0.5"), 640, 246, { "font-size": 11, "font-weight": 700, "text-anchor": "middle", fill: result.digitalWarning ? "var(--elc-red)" : "var(--elc-green)" });
    svgText(doc, node, "T=" + format(result.period * 1e6, 3) + " us；tr=" + format(result.config.riseTime * 1e9, 3) + " ns", 552, 274, { "font-size": 11 });
    svgText(doc, node, "tp=" + format(result.delay * 1e9, 3) + " ns", 728, 274, { "font-size": 11, "text-anchor": "end" });
    svgText(doc, node, result.lumped ? "正弦教学判据：可先用集总模型" : "正弦教学判据：传播不可忽略", 640, 294, { "font-size": 11, "text-anchor": "middle", fill: result.lumped ? "var(--elc-green)" : "var(--elc-red)" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "elc-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode);
    var rows = [
      ["传播延迟 tp", format(result.delay * 1e9, 4), "ns；ℓ/vp"],
      ["正弦周期 T", format(result.period * 1e6, 4), "us；1/f"],
      ["正弦电长度 tp/T", format(result.sineRatio, 6), "无量纲；教学判据 ≤ 0.1"],
      ["数字边沿 tr", format(result.config.riseTime * 1e9, 4), "ns；独立于正弦 T"],
      ["数字边沿比 tp/tr", format(result.edgeRatio, 6), "无量纲；约 ≥ 0.5 进入警戒"],
      ["波长 λ", format(result.wavelength, 3), "m；vp/f"],
      ["电容阻抗 |ZC|", format(result.zC.magnitude, 3), "Ω；ZC=1/(jwC)"],
      ["电感阻抗 |ZL|", format(result.xL, 3), "Ω；|ZL|=wL"],
      ["τRC", format(result.tauRC * 1e9, 3), "ns；R·C"],
      ["τL/R", format(result.tauLR * 1e9, 3), "ns；L/R"]
    ];
    var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "集总尺度与元件阻抗账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { R: DEFAULTS.R, C: DEFAULTS.C, L: DEFAULTS.L, length: DEFAULTS.length, frequency: DEFAULTS.frequency, riseTime: DEFAULTS.riseTime }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "elc-shell" }); shell.appendChild(element(doc, "h3", { text: "集总实验：参考方向与失效尺度" })); shell.appendChild(element(doc, "p", { className: "elc-note", text: "先判断阻抗和传播尺度；揭示后调节元件、频率和长度。速度参数是教学设定。" }));
    var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) {
      var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt }));
      var grid = element(doc, "div", { className: "elc-choice-grid" }); var buttons = [];
      question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); });
      groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "elc-actions" }); var reveal = element(doc, "button", { type: "button", className: "elc-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "elc-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "elc-controls" }); var inputs = {}; var outputs = {};
    [["R", "电阻 R", 1, 1000, 1, function (v) { return format(v, 0) + " Ω"; }], ["C", "电容 C", 1e-9, 100e-9, 1e-9, function (v) { return format(v * 1e9, 1) + " nF"; }], ["L", "电感 L", 0.1e-6, 10e-6, 0.1e-6, function (v) { return format(v * 1e6, 1) + " μH"; }], ["length", "互连长度 ℓ", 0.01, 3, 0.01, function (v) { return format(v, 2) + " m"; }], ["frequency", "频率 f", 1e4, 1e8, 1e4, function (v) { return format(v / 1e6, 3) + " MHz"; }], ["riseTime", "数字上升时间 tr", 1e-9, 1e-6, 1e-9, function (v) { return format(v * 1e9, 1) + " ns"; }]].forEach(function (spec) {
      var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "elc-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] });
      input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = { node: output, format: spec[5] };
    });
    results.appendChild(controls); var layout = element(doc, "div", { className: "elc-layout" }); var stage = element(doc, "div", { className: "elc-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "elc-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "elc-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "elc-note", text: "正弦 tp/T ≤ 0.1 与数字 tp/tr 约 0.5 的判据分开使用；它们都是本实验的教学判据，不是跨板级、封装和边沿速度都适用的标准值。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeLumped(state.config); results.hidden = !state.revealed; Object.keys(outputs).forEach(function (key) { outputs[key].node.textContent = outputs[key].format(result.config[key]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "正弦 tp/T", format(result.sineRatio, 5))); metrics.appendChild(metric(doc, "数字 tp/tr", format(result.edgeRatio, 5))); metrics.appendChild(metric(doc, "|ZC|", format(result.zC.magnitude, 2) + " Ω")); metrics.appendChild(metric(doc, "数字状态", result.digitalWarning ? "传输线警戒" : "< 0.5")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。改变频率或长度，观察何时不能再把走线当成一个点。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: { R: DEFAULTS.R, C: DEFAULTS.C, L: DEFAULTS.L, length: DEFAULTS.length, frequency: DEFAULTS.frequency, riseTime: DEFAULTS.riseTime }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "集总实验已重置。" ); });
    rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-elc-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeLumped(DEFAULTS);
    check(near(result.delay, 1.5e-9), "propagation delay");
    check(near(result.electricalLength, 0.0015), "electrical length");
    check(near(result.xC, 15.915494, 1e-5), "capacitive reactance");
    check(near(result.zC.imag, -result.xC, 1e-12) && near(result.zC.magnitude, result.xC, 1e-12), "complex capacitive impedance");
    check(near(result.xL, 6.283185, 1e-5), "inductive reactance");
    check(near(result.config.riseTime, 10e-9), "digital rise time");
    check(near(result.tpOverTr, 0.15), "digital edge ratio");
    check(!result.digitalWarning, "default digital edge is below warning ratio");
    check(result.lumped, "default is within teaching lumped criterion");
    check(computeLumped({ riseTime: 2e-9 }).digitalWarning, "fast edge enters transmission-line warning");
    check(computeLumped({ frequency: 1e8, length: 3 }).electricalLength > 0.1, "high frequency and long line cross boundary");
    check(JSON.stringify(computeLumped(DEFAULTS)) === JSON.stringify(computeLumped(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, computeLumped: computeLumped, mount: mount, selfTest: selfTest };
});
