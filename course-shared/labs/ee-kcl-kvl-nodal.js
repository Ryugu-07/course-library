(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-kcl-kvl-nodal", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-kcl-kvl-nodal self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-kcl-kvl-nodal self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "ee-kcl-kvl-nodal";
  var STYLE_ID = "cl-ee-kcl-kvl-nodal-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { sourceV: 5, sourceR: 100, loadR: 220, sink: 0.005, referenceShift: 0.8, meterBias: 0 };
  var QUESTIONS = [
    { key: "load", prompt: "在源电阻和电流汇不变时，把负载电阻增大，负载电流怎样？", expected: "lower", choices: [["lower", "降低"], ["higher", "升高"], ["same", "不变"]] },
    { key: "reference", prompt: "只改变电压坐标的参考节点偏移，元件两端电压差和 KCL 残差怎样？", expected: "same", choices: [["same", "不变"], ["higher", "都升高"], ["lower", "都降低"]] },
    { key: "residual", prompt: "若电流表把负载电流多报 1 mA，测得的 KCL 残差会怎样？", expected: "nonzero", choices: [["nonzero", "出现非零残差"], ["zero", "仍严格为零"], ["reverse", "只会改变符号约定"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) { if (!isFinite(value)) return "-"; var places = digits === undefined ? 2 : digits; if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4)); return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function normalize(input) {
    var source = input || {};
    return {
      sourceV: clamp(finite(source.sourceV === undefined ? DEFAULTS.sourceV : source.sourceV, "source voltage"), 0.5, 12),
      sourceR: clamp(finite(source.sourceR === undefined ? DEFAULTS.sourceR : source.sourceR, "source resistance"), 1, 2000),
      loadR: clamp(finite(source.loadR === undefined ? DEFAULTS.loadR : source.loadR, "load resistance"), 1, 5000),
      sink: clamp(finite(source.sink === undefined ? DEFAULTS.sink : source.sink, "current sink"), 0, 0.03),
      referenceShift: clamp(finite(source.referenceShift === undefined ? DEFAULTS.referenceShift : source.referenceShift, "reference shift"), -2, 2),
      meterBias: clamp(finite(source.meterBias === undefined ? DEFAULTS.meterBias : source.meterBias, "meter bias"), -0.002, 0.002)
    };
  }
  function computeNodal(input) {
    var config = normalize(input); var conductance = 1 / config.sourceR + 1 / config.loadR;
    var nodeVoltage = (config.sourceV / config.sourceR - config.sink) / conductance;
    var sourceCurrent = (config.sourceV - nodeVoltage) / config.sourceR;
    var loadCurrent = nodeVoltage / config.loadR;
    var kclResidual = sourceCurrent - loadCurrent - config.sink;
    var kvlResidual = config.sourceV - (config.sourceV - nodeVoltage) - nodeVoltage;
    var reportedLoadCurrent = loadCurrent + config.meterBias;
    var measuredKclResidual = sourceCurrent - reportedLoadCurrent - config.sink;
    var complianceValid = nodeVoltage >= 0 && nodeVoltage <= config.sourceV;
    var modelExtrapolated = !complianceValid;
    var complianceMessage = complianceValid ? "单电源电流汇处于顺从区" : nodeVoltage < 0 ? "节点为负：单电源电流汇超出顺从区，结果仅为模型外推" : "节点超过源电压：单电源电流汇超出顺从区，结果仅为模型外推";
    return {
      config: config,
      nodeVoltage: nodeVoltage,
      absoluteNodeVoltage: nodeVoltage + config.referenceShift,
      sourceCurrent: sourceCurrent,
      loadCurrent: loadCurrent,
      reportedLoadCurrent: reportedLoadCurrent,
      kclResidual: kclResidual,
      measuredKclResidual: measuredKclResidual,
      kvlResidual: kvlResidual,
      sourceDrop: config.sourceV - nodeVoltage,
      loadPower: nodeVoltage * loadCurrent,
      complianceValid: complianceValid,
      modelExtrapolated: modelExtrapolated,
      complianceMessage: complianceMessage,
      interpretation: !complianceValid ? complianceMessage : Math.abs(measuredKclResidual) < 1e-9 ? "测量账本闭合；单电源电流汇在顺从区" : "测量残差提示检查仪器或模型；电流汇仍在顺从区"
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
      '[data-learning-lab="' + LAB_ID + '"]{--ekn-blue:#1769aa;--ekn-green:#2e7d57;--ekn-red:#b23a32;--ekn-gold:#9b6a12;display:block;max-width:100%;min-width:0;line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .ekn-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--ekn-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .ekn-primary{border-color:var(--ekn-blue);background:var(--ekn-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .ekn-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .ekn-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .ekn-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .ekn-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .ekn-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .ekn-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--ekn-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ekn-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .ekn-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .ekn-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .ekn-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .ekn-metric{min-width:0;padding:9px;border-top:2px solid var(--ekn-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .ekn-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ekn-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .ekn-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ekn-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .ekn-controls{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .ekn-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .ekn-choice-grid,[data-learning-lab="' + LAB_ID + '"] .ekn-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .ekn-choice-grid,[data-learning-lab="' + LAB_ID + '"] .ekn-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .ekn-actions>*{flex-basis:100%}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-ekn-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 760 315"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "KCL KVL 节点分析电路示意");
    node.appendChild(svgElement(doc, "title", {}, "参考节点、KCL 和 KVL")); node.appendChild(svgElement(doc, "desc", {}, "左侧是源电阻到节点再到负载和电流汇的电路，右侧列出节点电压、支路电流方向与残差。"));
    node.appendChild(svgElement(doc, "rect", { x: 34, y: 76, width: 55, height: 86, rx: 5, fill: "var(--ekn-blue)", "fill-opacity": ".12", stroke: "var(--ekn-blue)", "stroke-width": 2 })); svgText(doc, node, "Vs", 61, 118, { "font-size": 15, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.sourceV, 2) + " V", 61, 141, { "font-size": 11, "text-anchor": "middle", fill: "var(--ekn-blue)" });
    node.appendChild(svgElement(doc, "line", { x1: 89, y1: 119, x2: 139, y2: 119, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "rect", { x: 139, y: 94, width: 84, height: 50, rx: 4, fill: "var(--ekn-green)", "fill-opacity": ".12", stroke: "var(--ekn-green)", "stroke-width": 2 })); svgText(doc, node, "Rs", 181, 117, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.sourceR, 0) + " Ω", 181, 135, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 223, y1: 119, x2: 283, y2: 119, stroke: "var(--ekn-green)", "stroke-width": 4 })); node.appendChild(svgElement(doc, "circle", { cx: 283, cy: 119, r: 7, fill: "var(--ekn-red)", stroke: "currentColor", "stroke-width": 2 })); svgText(doc, node, "节点 n", 283, 92, { "font-size": 12, "font-weight": 700, "text-anchor": "middle", fill: "var(--ekn-red)" }); svgText(doc, node, "Vn=" + format(result.nodeVoltage, 3) + " V", 283, 156, { "font-size": 11, "text-anchor": "middle", fill: "var(--ekn-red)" });
    node.appendChild(svgElement(doc, "line", { x1: 283, y1: 119, x2: 283, y2: 196, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "rect", { x: 258, y: 196, width: 50, height: 43, rx: 4, fill: "var(--ekn-gold)", "fill-opacity": ".12", stroke: "var(--ekn-gold)", "stroke-width": 2 })); svgText(doc, node, "RL", 283, 216, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.loadR, 0) + " Ω", 283, 232, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 283, y1: 239, x2: 283, y2: 264, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 262, y1: 264, x2: 304, y2: 264, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 268, y1: 273, x2: 298, y2: 273, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 274, y1: 282, x2: 292, y2: 282, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 231, y1: 119, x2: 270, y2: 119, stroke: "var(--ekn-blue)", "stroke-width": 3 })); node.appendChild(svgElement(doc, "polygon", { points: "270,119 258,113 258,125", fill: "var(--ekn-blue)" })); svgText(doc, node, "Is 入节点", 244, 91, { "font-size": 11, fill: "var(--ekn-blue)" });
    node.appendChild(svgElement(doc, "line", { x1: 302, y1: 119, x2: 325, y2: 99, stroke: "var(--ekn-gold)", "stroke-width": 3 })); node.appendChild(svgElement(doc, "polygon", { points: "325,99 313,103 321,110", fill: "var(--ekn-gold)" })); svgText(doc, node, "IL", 330, 94, { "font-size": 11, fill: "var(--ekn-gold)" });
    node.appendChild(svgElement(doc, "line", { x1: 283, y1: 119, x2: 350, y2: 119, stroke: "var(--ekn-red)", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 350, y1: 119, x2: 350, y2: 196, stroke: "var(--ekn-red)", "stroke-width": 3 })); node.appendChild(svgElement(doc, "polygon", { points: "350,196 344,184 356,184", fill: "var(--ekn-red)" })); node.appendChild(svgElement(doc, "rect", { x: 325, y: 196, width: 50, height: 43, rx: 4, fill: "var(--ekn-red)", "fill-opacity": ".12", stroke: "var(--ekn-red)", "stroke-width": 2 })); svgText(doc, node, "Isink", 350, 216, { "font-size": 11, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.sink * 1000, 2) + " mA", 350, 232, { "font-size": 10, "text-anchor": "middle", fill: "var(--ekn-red)" }); node.appendChild(svgElement(doc, "line", { x1: 350, y1: 239, x2: 350, y2: 264, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 304, y1: 264, x2: 370, y2: 264, stroke: "currentColor", "stroke-width": 3 }));
    svgText(doc, node, "参考节点：地", 130, 294, { "font-size": 11, "text-anchor": "middle" });
    svgText(doc, node, "KCL：Is − IL − Isink = " + format(result.kclResidual * 1000, 6) + " mA", 520, 102, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, "KVL：Vs − VRs − VRL = " + format(result.kvlResidual, 8) + " V", 520, 137, { "font-size": 12, "text-anchor": "middle" }); svgText(doc, node, "测量残差：" + format(result.measuredKclResidual * 1000, 4) + " mA", 520, 174, { "font-size": 12, fill: "var(--ekn-red)", "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 410, y1: 208, x2: 680, y2: 208, stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "单电源顺从区：" + (result.complianceValid ? "有效" : "外推（负节点/超出供电范围）"), 545, 195, { "font-size": 11, "text-anchor": "middle", fill: result.complianceValid ? "var(--ekn-green)" : "var(--ekn-red)" }); svgText(doc, node, "参考偏移 = " + format(result.config.referenceShift, 2) + " V；绝对坐标 Vn = " + format(result.absoluteNodeVoltage, 3) + " V", 545, 239, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, "元件两端电压由节点差定义，不由坐标原点决定", 545, 267, { "font-size": 11, "text-anchor": "middle" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "ekn-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode); var rows = [["节点电压 Vn", format(result.nodeVoltage, 5), "V；相对参考节点"], ["绝对坐标电压", format(result.absoluteNodeVoltage, 5), "V；加上参考偏移"], ["源支路电流 Is", format(result.sourceCurrent * 1000, 5), "mA；沿 Rs 入节点"], ["负载电流 IL", format(result.loadCurrent * 1000, 5), "mA；从节点流出"], ["电流汇 Isink", format(result.config.sink * 1000, 5), "mA；从节点流出"], ["KCL 理想残差", format(result.kclResidual * 1000, 8), "mA"], ["KVL 理想残差", format(result.kvlResidual, 8), "V"], ["KCL 测量残差", format(result.measuredKclResidual * 1000, 5), "mA；含电流表偏差"], ["负载功率", format(result.loadPower * 1000, 4), "mW"], ["单电源电流汇顺从区", result.complianceValid ? "有效" : "无效" , result.complianceMessage]]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "KCL/KVL 节点账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { sourceV: DEFAULTS.sourceV, sourceR: DEFAULTS.sourceR, loadR: DEFAULTS.loadR, sink: DEFAULTS.sink, referenceShift: DEFAULTS.referenceShift, meterBias: DEFAULTS.meterBias }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "ekn-shell" }); shell.appendChild(element(doc, "h3", { text: "节点实验：KCL、KVL、残差与参考节点" })); shell.appendChild(element(doc, "p", { className: "ekn-note", text: "先判断支路变化和残差来源；揭示后再调节。电流表偏差只是测量教学设定。" })); var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "ekn-choice-grid" }); var buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "ekn-actions" }); var reveal = element(doc, "button", { type: "button", className: "ekn-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "ekn-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback); var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "ekn-controls" }); var inputs = {}; var outputs = {};
    [["sourceV", "源电压 Vs", 0.5, 10, 0.1, function (v) { return format(v, 1) + " V"; }], ["sourceR", "源电阻 Rs", 1, 1000, 1, function (v) { return format(v, 0) + " Ω"; }], ["loadR", "负载电阻 RL", 1, 1000, 1, function (v) { return format(v, 0) + " Ω"; }], ["sink", "电流汇", 0, 0.02, 0.0005, function (v) { return format(v * 1000, 2) + " mA"; }], ["referenceShift", "参考偏移", -2, 2, 0.1, function (v) { return format(v, 1) + " V"; }], ["meterBias", "负载表偏差", -0.002, 0.002, 0.0001, function (v) { return format(v * 1000, 2) + " mA"; }]].forEach(function (spec) {
      var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "ekn-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = { node: output, format: spec[5] };
    });
    results.appendChild(controls); var layout = element(doc, "div", { className: "ekn-layout" }); var stage = element(doc, "div", { className: "ekn-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "ekn-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "ekn-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "ekn-note", text: "单电源电流汇只在顺从区内可这样建模；若节点为负或超过源电压，表中的代数结果是模型外推，不能当作真实输出。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeNodal(state.config); results.hidden = !state.revealed; Object.keys(outputs).forEach(function (key) { outputs[key].node.textContent = outputs[key].format(result.config[key]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "节点电压", format(result.nodeVoltage, 3) + " V")); metrics.appendChild(metric(doc, "负载电流", format(result.loadCurrent * 1000, 3) + " mA")); metrics.appendChild(metric(doc, "KCL 残差", format(result.kclResidual * 1000, 6) + " mA")); metrics.appendChild(metric(doc, "顺从区", result.complianceValid ? "有效" : "模型外推")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在引入一点表计偏差，观察残差为何成为证据。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: { sourceV: DEFAULTS.sourceV, sourceR: DEFAULTS.sourceR, loadR: DEFAULTS.loadR, sink: DEFAULTS.sink, referenceShift: DEFAULTS.referenceShift, meterBias: DEFAULTS.meterBias }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "节点实验已重置。"); });
    rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-ekn-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeNodal(DEFAULTS);
    check(near(result.nodeVoltage, 3.09375), "node voltage");
    check(near(result.kclResidual, 0, 1e-10), "KCL closure");
    check(near(result.kvlResidual, 0, 1e-10), "KVL closure");
    check(near(result.absoluteNodeVoltage - result.nodeVoltage, DEFAULTS.referenceShift), "reference shift is coordinate only");
    check(Math.abs(computeNodal({ meterBias: 0.001 }).measuredKclResidual) > 0.0009, "measurement bias appears in residual");
    check(computeNodal({ loadR: 1000 }).loadCurrent < result.loadCurrent, "larger load resistance lowers load current");
    var extrapolated = computeNodal({ sourceV: 0.5, sourceR: 1000, loadR: 1000, sink: 0.02 });
    check(extrapolated.nodeVoltage < 0, "negative node counterexample");
    check(extrapolated.complianceValid === false && extrapolated.modelExtrapolated, "single-supply compliance rejects negative node");
    check(extrapolated.interpretation.indexOf("模型外推") >= 0, "out-of-compliance result is labeled extrapolation");
    check(near(extrapolated.kclResidual, 0, 1e-10), "algebraic KCL still closes outside physical compliance");
    check(JSON.stringify(computeNodal(DEFAULTS)) === JSON.stringify(computeNodal(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, computeNodal: computeNodal, mount: mount, selfTest: selfTest };
});
