(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-system-safety", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-system-safety self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-system-safety self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "ee-system-safety";
  var STYLE_ID = "cl-ee-system-safety-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { sourceV: 5, currentLimit: 0.12, loadR: 100, faultR: 0.5, disconnect: 2 };
  var QUESTIONS = [
    { key: "current", prompt: "已经进入限流区后，把故障电阻再降低，故障电流主要怎样？", expected: "same", choices: [["same", "近似不变"], ["lower", "明显降低"], ["higher", "明显升高"]] },
    { key: "energy", prompt: "在其他条件不变时，把自动断电时间加倍，故障能量预算怎样？", expected: "double", choices: [["double", "加倍"], ["half", "减半"], ["same", "不变"]] },
    { key: "power", prompt: "限流后把故障电阻推向更小，故障电阻本身耗散功率怎样？", expected: "lower", choices: [["lower", "降低"], ["higher", "升高"], ["same", "不变"]] }
  ];

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
  }
  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function normalize(input) {
    var source = input || {};
    return {
      sourceV: clamp(finite(source.sourceV === undefined ? DEFAULTS.sourceV : source.sourceV, "source voltage"), 1, 24),
      currentLimit: clamp(finite(source.currentLimit === undefined ? DEFAULTS.currentLimit : source.currentLimit, "current limit"), 0.01, 1),
      loadR: clamp(finite(source.loadR === undefined ? DEFAULTS.loadR : source.loadR, "load resistance"), 1, 1000),
      faultR: clamp(finite(source.faultR === undefined ? DEFAULTS.faultR : source.faultR, "fault resistance"), 0.05, 1000),
      disconnect: clamp(finite(source.disconnect === undefined ? DEFAULTS.disconnect : source.disconnect, "disconnect time"), 0.1, 30)
    };
  }
  function computeSafety(input) {
    var config = normalize(input);
    var parallelResistance = 1 / (1 / config.loadR + 1 / config.faultR);
    var openCurrent = config.sourceV / parallelResistance;
    var totalCurrent = Math.min(openCurrent, config.currentLimit);
    var nodeVoltage = totalCurrent * parallelResistance;
    var normal = {
      current: nodeVoltage / config.loadR,
      voltage: nodeVoltage,
      loadPower: nodeVoltage * nodeVoltage / config.loadR
    };
    var fault = {
      current: nodeVoltage / config.faultR,
      voltage: nodeVoltage,
      loadPower: nodeVoltage * nodeVoltage / config.faultR,
      limited: openCurrent > config.currentLimit
    };
    var sourcePower = config.sourceV * totalCurrent;
    var limiterPower = Math.max(0, (config.sourceV - nodeVoltage) * totalCurrent);
    var normalLoadEnergy = normal.loadPower * config.disconnect;
    var faultEnergy = fault.loadPower * config.disconnect;
    var sourceEnergy = sourcePower * config.disconnect;
    var limiterEnergy = limiterPower * config.disconnect;
    return {
      config: config,
      parallelResistance: parallelResistance,
      totalCurrent: totalCurrent,
      nodeVoltage: nodeVoltage,
      normal: normal,
      fault: fault,
      Iload: normal.current,
      If: fault.current,
      sourcePower: sourcePower,
      normalLoadPower: normal.loadPower,
      limiterPower: limiterPower,
      sourceEnergy: sourceEnergy,
      faultEnergy: faultEnergy,
      normalLoadEnergy: normalLoadEnergy,
      limiterEnergy: limiterEnergy,
      energyClosure: sourceEnergy - faultEnergy - normalLoadEnergy - limiterEnergy,
      protection: totalCurrent <= config.currentLimit + 1e-12,
      interpretation: fault.limited ? "正常负载与故障支路同时并联；总电流被限流" : "正常负载与故障支路同时并联；尚未触发限流"
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
    if (children !== undefined && children !== null) {
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
      });
    }
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, String(value));
    });
    if (children !== undefined && children !== null) {
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
      });
    }
    return node;
  }
  function svgText(doc, parent, text, x, y, attrs) {
    var all = attrs || {};
    all.x = x; all.y = y;
    parent.appendChild(svgElement(doc, "text", all, text));
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--ess-blue:#1769aa;--ess-green:#2e7d57;--ess-red:#b23a32;--ess-gold:#9b6a12;display:block;max-width:100%;min-width:0;line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .ess-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--ess-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .ess-primary{border-color:var(--ess-blue);background:var(--ess-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .ess-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .ess-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .ess-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .ess-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .ess-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .ess-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--ess-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ess-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .ess-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .ess-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .ess-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .ess-metric{min-width:0;padding:9px;border-top:2px solid var(--ess-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .ess-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ess-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .ess-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ess-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .ess-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .ess-choice-grid,[data-learning-lab="' + LAB_ID + '"] .ess-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .ess-choice-grid,[data-learning-lab="' + LAB_ID + '"] .ess-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .ess-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
    var live = rootNode.querySelector("[data-ess-live]");
    if (live) live.textContent = message;
  }
  function drawSvg(doc, node, result) {
    clear(node);
    node.setAttribute("viewBox", "0 0 760 300");
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", "低压限流故障回路与能量预算示意");
    node.appendChild(svgElement(doc, "title", {}, "低压限流、断电边界与故障能量"));
    node.appendChild(svgElement(doc, "desc", {}, "左侧是低压源、限流器、可断电开关和故障电阻，右侧是故障功率与断电时间组成的能量预算。"));
    node.appendChild(svgElement(doc, "rect", { x: 24, y: 105, width: 54, height: 75, rx: 5, fill: "var(--ess-blue)", "fill-opacity": ".12", stroke: "var(--ess-blue)", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 40, y1: 120, x2: 40, y2: 165, stroke: "var(--ess-blue)", "stroke-width": 4 }));
    node.appendChild(svgElement(doc, "line", { x1: 57, y1: 130, x2: 57, y2: 155, stroke: "var(--ess-blue)", "stroke-width": 2 }));
    svgText(doc, node, "低压源", 51, 198, { "font-size": 12, "text-anchor": "middle" });
    svgText(doc, node, format(result.config.sourceV, 2) + " V", 51, 95, { "font-size": 12, "text-anchor": "middle", fill: "var(--ess-blue)" });
    node.appendChild(svgElement(doc, "line", { x1: 78, y1: 142, x2: 110, y2: 142, stroke: "var(--ess-green)", "stroke-width": 5 }));
    node.appendChild(svgElement(doc, "polygon", { points: "110,142 99,136 99,148", fill: "var(--ess-green)" }));
    node.appendChild(svgElement(doc, "rect", { x: 112, y: 115, width: 105, height: 54, rx: 5, fill: "var(--ess-green)", "fill-opacity": ".12", stroke: "var(--ess-green)", "stroke-width": 2 }));
    svgText(doc, node, "限流 Imax", 164, 139, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" });
    svgText(doc, node, format(result.config.currentLimit * 1000, 1) + " mA", 164, 158, { "font-size": 11, "text-anchor": "middle", fill: "var(--ess-green)" });
    node.appendChild(svgElement(doc, "line", { x1: 217, y1: 142, x2: 244, y2: 142, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 244, y1: 142, x2: 260, y2: 126, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 260, y1: 126, x2: 276, y2: 142, stroke: "currentColor", "stroke-width": 3 }));
    svgText(doc, node, "自动断电", 260, 111, { "font-size": 12, "text-anchor": "middle", fill: "var(--ess-red)" });
    svgText(doc, node, format(result.config.disconnect, 2) + " s", 260, 199, { "font-size": 11, "text-anchor": "middle", fill: "var(--ess-red)" });
    node.appendChild(svgElement(doc, "line", { x1: 276, y1: 142, x2: 302, y2: 142, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "circle", { cx: 302, cy: 142, r: 7, fill: "var(--ess-red)", stroke: "currentColor", "stroke-width": 2 }));
    svgText(doc, node, "节点 Vn", 302, 111, { "font-size": 12, "font-weight": 700, "text-anchor": "middle", fill: "var(--ess-red)" });
    node.appendChild(svgElement(doc, "line", { x1: 302, y1: 142, x2: 302, y2: 163, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "rect", { x: 277, y: 163, width: 50, height: 43, rx: 4, fill: "var(--ess-green)", "fill-opacity": ".12", stroke: "var(--ess-green)", "stroke-width": 2 }));
    svgText(doc, node, "正常 R", 302, 182, { "font-size": 12, "font-weight": 700, "text-anchor": "middle" });
    svgText(doc, node, format(result.config.loadR, 0) + " Ω", 302, 198, { "font-size": 10, "text-anchor": "middle", fill: "var(--ess-green)" });
    node.appendChild(svgElement(doc, "line", { x1: 302, y1: 206, x2: 302, y2: 235, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 302, y1: 142, x2: 410, y2: 142, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 410, y1: 142, x2: 410, y2: 163, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "rect", { x: 385, y: 163, width: 50, height: 43, rx: 4, fill: "var(--ess-red)", "fill-opacity": ".12", stroke: "var(--ess-red)", "stroke-width": 2 }));
    svgText(doc, node, "故障 Rf", 410, 182, { "font-size": 12, "font-weight": 700, "text-anchor": "middle" });
    svgText(doc, node, format(result.config.faultR, 2) + " Ω", 410, 198, { "font-size": 10, "text-anchor": "middle", fill: "var(--ess-red)" });
    node.appendChild(svgElement(doc, "line", { x1: 410, y1: 206, x2: 410, y2: 235, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 302, y1: 235, x2: 410, y2: 235, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 302, y1: 235, x2: 51, y2: 235, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 51, y1: 235, x2: 51, y2: 180, stroke: "currentColor", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 289, y1: 151, x2: 289, y2: 160, stroke: "var(--ess-green)", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "polygon", { points: "289,160 283,149 295,149", fill: "var(--ess-green)" }));
    node.appendChild(svgElement(doc, "line", { x1: 423, y1: 151, x2: 423, y2: 160, stroke: "var(--ess-red)", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "polygon", { points: "423,160 417,149 429,149", fill: "var(--ess-red)" }));
    svgText(doc, node, "Iload=" + format(result.Iload * 1000, 3) + " mA", 302, 253, { "font-size": 11, "text-anchor": "middle", fill: "var(--ess-green)" });
    svgText(doc, node, "If=" + format(result.If * 1000, 3) + " mA", 410, 253, { "font-size": 11, "text-anchor": "middle", fill: "var(--ess-red)" });
    svgText(doc, node, "Vf=If·Rf=" + format(result.fault.voltage, 4) + " V", 356, 276, { "font-size": 11, "text-anchor": "middle", fill: "var(--ess-red)" });
    svgText(doc, node, "I=If+Iload=" + format(result.totalCurrent * 1000, 3) + " mA", 226, 296, { "font-size": 11, "text-anchor": "middle", fill: "var(--ess-blue)" });
    node.appendChild(svgElement(doc, "line", { x1: 500, y1: 82, x2: 500, y2: 230, stroke: "currentColor", "stroke-opacity": ".45" }));
    node.appendChild(svgElement(doc, "line", { x1: 500, y1: 230, x2: 730, y2: 230, stroke: "currentColor", "stroke-opacity": ".45" }));
    svgText(doc, node, "故障能量预算", 615, 48, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" });
    svgText(doc, node, "E_source = " + format(result.sourceEnergy, 3) + " J", 520, 85, { "font-size": 12, fill: "var(--ess-blue)" });
    node.appendChild(svgElement(doc, "line", { x1: 505, y1: 105, x2: 575, y2: 105, stroke: "var(--ess-blue)", "stroke-width": 5 }));
    node.appendChild(svgElement(doc, "polygon", { points: "575,105 564,99 564,111", fill: "var(--ess-blue)" }));
    svgText(doc, node, "故障 " + format(result.faultEnergy, 3) + " J", 535, 146, { "font-size": 12, fill: "var(--ess-red)" });
    node.appendChild(svgElement(doc, "line", { x1: 610, y1: 105, x2: 610, y2: 172, stroke: "var(--ess-red)", "stroke-width": 5 }));
    node.appendChild(svgElement(doc, "polygon", { points: "610,172 604,161 616,161", fill: "var(--ess-red)" }));
    svgText(doc, node, "限流器热 " + format(result.limiterEnergy, 3) + " J", 625, 205, { "font-size": 12, fill: "var(--ess-gold)" });
    node.appendChild(svgElement(doc, "line", { x1: 610, y1: 172, x2: 690, y2: 172, stroke: "var(--ess-gold)", "stroke-width": 5 }));
    node.appendChild(svgElement(doc, "polygon", { points: "690,172 679,166 679,178", fill: "var(--ess-gold)" }));
    svgText(doc, node, "先限流，再定义断电时间", 615, 258, { "font-size": 11, "text-anchor": "middle" });
  }
  function metric(doc, label, value) {
    return element(doc, "div", { className: "ess-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }
  function renderTable(doc, hostNode, result) {
    clear(hostNode);
    var rows = [
      ["总源电流 I", format(result.totalCurrent * 1000, 3), "mA；限流源进入并联节点"],
      ["正常负载电流 Iload", format(result.Iload * 1000, 3), "mA；If 与 Iload 同时存在"],
      ["故障电流 If", format(result.If * 1000, 3), "mA；从并联节点流入 Rf"],
      ["故障端电压 Vf", format(result.fault.voltage, 4), "V；If·Rf"],
      ["正常负载功率", format(result.normalLoadPower * 1000, 4), "mW；Iload²R"],
      ["故障电阻功率", format(result.fault.loadPower * 1000, 4), "mW；If²Rf"],
      ["断电前源能量", format(result.sourceEnergy, 4), "J；Vs·I·t"],
      ["故障吸收能量", format(result.faultEnergy, 4), "J；Pfault·t"],
      ["正常负载能量", format(result.normalLoadEnergy, 4), "J；Pload·t"],
      ["限流器热能", format(result.limiterEnergy, 4), "J；教学理想分配"],
      ["能量闭合误差", format(result.energyClosure, 8), "J；模型内部检查"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "低压故障能量账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { sourceV: DEFAULTS.sourceV, currentLimit: DEFAULTS.currentLimit, loadR: DEFAULTS.loadR, faultR: DEFAULTS.faultR, disconnect: DEFAULTS.disconnect }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = "";
    var shell = element(doc, "div", { className: "ess-shell" });
    shell.appendChild(element(doc, "h3", { text: "安全实验：限流、断电与能量边界" }));
    shell.appendChild(element(doc, "p", { className: "ess-note", text: "先判断限流和时间的作用；揭示后再调节。所有数值是低压教学设定，不是市电操作建议。" }));
    var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) {
      var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt }));
      var grid = element(doc, "div", { className: "ess-choice-grid" }); var buttons = [];
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0];
        button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; });
        buttons.push(button); grid.appendChild(button);
      });
      groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "ess-actions" });
    var reveal = element(doc, "button", { type: "button", className: "ess-primary", text: "提交预测并揭示", disabled: true });
    var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "ess-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "ess-controls" }); var inputs = {}; var outputs = {};
    [["sourceV", "低压源 Vs", 1, 12, 0.1, "V"], ["currentLimit", "限流 Imax", 0.01, 0.5, 0.01, "A"], ["loadR", "正常负载 R", 1, 500, 1, "Ω"], ["faultR", "故障电阻 Rf", 0.05, 20, 0.05, "Ω"], ["disconnect", "断电时间", 0.1, 10, 0.1, "s"]].forEach(function (spec) {
      var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" });
      var wrap = element(doc, "div", { className: "ess-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] });
      input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output;
    });
    results.appendChild(controls);
    var layout = element(doc, "div", { className: "ess-layout" }); var stage = element(doc, "div", { className: "ess-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage);
    var side = element(doc, "div"); var metrics = element(doc, "div", { className: "ess-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "ess-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "ess-note", text: "正常负载与故障支路都接在限流器之后；能量闭合只检查理想限流器模型，真实保护器件还要查启动、反接、温升、响应时间和故障电压的资料。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() {
      var result = computeSafety(state.config); results.hidden = !state.revealed;
      outputs.sourceV.textContent = format(result.config.sourceV, 1) + " V"; outputs.currentLimit.textContent = format(result.config.currentLimit * 1000, 1) + " mA"; outputs.loadR.textContent = format(result.config.loadR, 0) + " Ω"; outputs.faultR.textContent = format(result.config.faultR, 2) + " Ω"; outputs.disconnect.textContent = format(result.config.disconnect, 1) + " s";
      drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "故障电流", format(result.fault.current * 1000, 2) + " mA")); metrics.appendChild(metric(doc, "故障功率", format(result.fault.loadPower * 1000, 3) + " mW")); metrics.appendChild(metric(doc, "源能量", format(result.sourceEnergy, 3) + " J")); metrics.appendChild(metric(doc, "限流状态", result.interpretation)); renderTable(doc, tableWrap, result);
    }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () {
      if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; }
      var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0);
      state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在改变一个参数，检查电流和能量的单位。"; render(); announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () { state = { config: { sourceV: DEFAULTS.sourceV, currentLimit: DEFAULTS.currentLimit, loadR: DEFAULTS.loadR, faultR: DEFAULTS.faultR, disconnect: DEFAULTS.disconnect }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "安全实验已重置。"); });
    rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-ess-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeSafety(DEFAULTS);
    check(near(result.totalCurrent, DEFAULTS.currentLimit), "parallel source reaches current limit");
    check(near(result.fault.current, result.If), "fault current ledger alias");
    check(near(result.normal.current, result.Iload), "normal load current ledger alias");
    check(result.normal.current > 0 && result.fault.current > 0, "both parallel branches conduct");
    check(near(result.fault.voltage, result.fault.current * DEFAULTS.faultR), "fault voltage is I times R");
    check(result.fault.limited, "fault is limited");
    check(near(result.sourceEnergy, result.faultEnergy + result.normalLoadEnergy + result.limiterEnergy, 1e-10), "parallel energy closure");
    check(near(result.energyClosure, 0, 1e-10), "energy closure residual");
    check(computeSafety({ faultR: 0.1 }).fault.current <= DEFAULTS.currentLimit + 1e-12, "lower fault resistance does not exceed limit");
    check(computeSafety({ faultR: 0.1 }).normal.current < result.normal.current, "stronger fault starves the normal load");
    check(computeSafety({ disconnect: 4 }).sourceEnergy > result.sourceEnergy, "longer fault time costs more energy");
    check(JSON.stringify(computeSafety(DEFAULTS)) === JSON.stringify(computeSafety(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, computeSafety: computeSafety, mount: mount, selfTest: selfTest };
});
