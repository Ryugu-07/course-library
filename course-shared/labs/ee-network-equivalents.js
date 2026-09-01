(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-network-equivalents", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-network-equivalents self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-network-equivalents self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "ee-network-equivalents";
  var STYLE_ID = "cl-ee-network-equivalents-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { V1: 3.3, V2: 1.1, R1: 100, R2: 100, RL: 100 };
  var QUESTIONS = [
    { key: "sum", prompt: "把两路独立源分别激活再相加，线性网络的负载电压应怎样？", expected: "sum", choices: [["sum", "等于两项代数和"], ["higher", "总是更大"], ["zero", "总是为零"]] },
    { key: "open", prompt: "把负载电阻推向很大时，负载端电压会靠近哪个量？", expected: "vth", choices: [["vth", "Thevenin 开路电压"], ["zero", "零"], ["inorton", "Norton 电流"]] },
    { key: "resistance", prompt: "把两路源电阻都增大，看到负载的等效源电阻怎样？", expected: "higher", choices: [["higher", "增大"], ["lower", "降低"], ["same", "不变"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) { if (value === null || !isFinite(value)) return "-"; var places = digits === undefined ? 2 : digits; if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4)); return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function normalize(input) {
    var source = input || {};
    return {
      V1: clamp(finite(source.V1 === undefined ? DEFAULTS.V1 : source.V1, "source one voltage"), 0, 12),
      V2: clamp(finite(source.V2 === undefined ? DEFAULTS.V2 : source.V2, "source two voltage"), 0, 12),
      R1: clamp(finite(source.R1 === undefined ? DEFAULTS.R1 : source.R1, "source one resistance"), 1, 5000),
      R2: clamp(finite(source.R2 === undefined ? DEFAULTS.R2 : source.R2, "source two resistance"), 1, 5000),
      RL: clamp(finite(source.RL === undefined ? DEFAULTS.RL : source.RL, "load resistance"), 1, 10000)
    };
  }
  function computeEquivalents(input) {
    var config = normalize(input);
    var g1 = 1 / config.R1; var g2 = 1 / config.R2; var gl = 1 / config.RL; var sourceConductance = g1 + g2;
    var vth = (config.V1 * g1 + config.V2 * g2) / sourceConductance;
    var rth = 1 / sourceConductance;
    var inorton = vth / rth;
    var denominator = sourceConductance + gl;
    var fullVoltage = (config.V1 * g1 + config.V2 * g2) / denominator;
    var contribution1 = config.V1 * g1 / denominator;
    var contribution2 = config.V2 * g2 / denominator;
    var loadCurrent = fullVoltage / config.RL;
    var loadPower = fullVoltage * loadCurrent;
    var equivalentCurrent = vth / (rth + config.RL);
    var nortonLoadCurrent = inorton * rth / (rth + config.RL);
    var maximumPower = vth * vth / (4 * rth);
    function powerAtResistance(resistance) {
      if (!isFinite(resistance)) return 0;
      return vth * vth * resistance / Math.pow(rth + resistance, 2);
    }
    var loadRatio = vth === 0 ? null : fullVoltage / vth;
    var powerCurve = [{ resistanceRatio: 0, power: 0, normalizedPower: 0 }];
    for (var curveIndex = 0; curveIndex <= 40; curveIndex += 1) {
      var resistanceRatio = Math.pow(10, -2 + curveIndex / 10);
      var curvePower = maximumPower * 4 * resistanceRatio / Math.pow(1 + resistanceRatio, 2);
      powerCurve.push({ resistanceRatio: resistanceRatio, power: curvePower, normalizedPower: maximumPower === 0 ? 0 : curvePower / maximumPower });
    }
    powerCurve.push({ resistanceRatio: 1000000, power: 0, normalizedPower: 0 });
    return {
      config: config, vth: vth, rth: rth, inorton: inorton, fullVoltage: fullVoltage,
      contribution1: contribution1, contribution2: contribution2,
      superpositionResidual: fullVoltage - contribution1 - contribution2,
      loadCurrent: loadCurrent, loadPower: loadPower,
      equivalentCurrent: equivalentCurrent, nortonLoadCurrent: nortonLoadCurrent,
      loadRatio: loadRatio, loadRatioDefined: loadRatio !== null, loadRatioText: loadRatio === null ? "无定义" : format(loadRatio, 6),
      maximumPower: maximumPower, pMax: maximumPower, maximumPowerBoundary: rth,
      powerAtRth: powerAtResistance(rth), shortCircuitPower: powerAtResistance(0), openCircuitPower: powerAtResistance(Infinity), powerCurve: powerCurve,
      interpretation: vth === 0 ? "V1=V2=0：负载比无定义，最大功率边界为零" : "两种等效在端口上应给出同一负载结果；最大功率边界在 RL=Rth"
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
      '[data-learning-lab="' + LAB_ID + '"]{--ene-blue:#1769aa;--ene-green:#2e7d57;--ene-red:#b23a32;--ene-gold:#9b6a12;display:block;max-width:100%;min-width:0;line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .ene-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--ene-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .ene-primary{border-color:var(--ene-blue);background:var(--ene-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .ene-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .ene-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .ene-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .ene-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .ene-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .ene-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--ene-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ene-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .ene-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .ene-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .ene-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .ene-metric{min-width:0;padding:9px;border-top:2px solid var(--ene-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .ene-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ene-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .ene-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ene-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .ene-controls{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .ene-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .ene-choice-grid,[data-learning-lab="' + LAB_ID + '"] .ene-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .ene-choice-grid,[data-learning-lab="' + LAB_ID + '"] .ene-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .ene-actions>*{flex-basis:100%}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-ene-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 760 410"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "叠加原理、Thevenin Norton 等效与最大功率曲线示意");
    node.appendChild(svgElement(doc, "title", {}, "叠加、Thevenin 与 Norton 等效")); node.appendChild(svgElement(doc, "desc", {}, "左侧两路带源电阻的电压源汇入负载，右侧显示端口等效的开路电压、等效电阻和负载电压。"));
    node.appendChild(svgElement(doc, "rect", { x: 24, y: 65, width: 48, height: 58, rx: 4, fill: "var(--ene-blue)", "fill-opacity": ".12", stroke: "var(--ene-blue)", "stroke-width": 2 })); svgText(doc, node, "V1", 48, 91, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.V1, 1) + " V", 48, 110, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "rect", { x: 24, y: 180, width: 48, height: 58, rx: 4, fill: "var(--ene-green)", "fill-opacity": ".12", stroke: "var(--ene-green)", "stroke-width": 2 })); svgText(doc, node, "V2", 48, 206, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.V2, 1) + " V", 48, 225, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 72, y1: 94, x2: 116, y2: 94, stroke: "var(--ene-blue)", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 72, y1: 209, x2: 116, y2: 209, stroke: "var(--ene-green)", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "rect", { x: 116, y: 70, width: 72, height: 48, rx: 4, fill: "var(--ene-blue)", "fill-opacity": ".1", stroke: "var(--ene-blue)", "stroke-width": 2 })); svgText(doc, node, "R1", 152, 92, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.R1, 0) + " Ω", 152, 108, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "rect", { x: 116, y: 185, width: 72, height: 48, rx: 4, fill: "var(--ene-green)", "fill-opacity": ".1", stroke: "var(--ene-green)", "stroke-width": 2 })); svgText(doc, node, "R2", 152, 207, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.R2, 0) + " Ω", 152, 223, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 188, y1: 94, x2: 257, y2: 151, stroke: "var(--ene-blue)", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 188, y1: 209, x2: 257, y2: 151, stroke: "var(--ene-green)", "stroke-width": 3 })); node.appendChild(svgElement(doc, "circle", { cx: 257, cy: 151, r: 7, fill: "var(--ene-red)", stroke: "currentColor", "stroke-width": 2 })); svgText(doc, node, "端口", 257, 132, { "font-size": 12, "font-weight": 700, "text-anchor": "middle", fill: "var(--ene-red)" });
    node.appendChild(svgElement(doc, "line", { x1: 257, y1: 151, x2: 257, y2: 203, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "rect", { x: 233, y: 203, width: 48, height: 40, rx: 4, fill: "var(--ene-gold)", "fill-opacity": ".12", stroke: "var(--ene-gold)", "stroke-width": 2 })); svgText(doc, node, "RL", 257, 220, { "font-size": 12, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.RL, 0) + " Ω", 257, 236, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 257, y1: 243, x2: 257, y2: 272, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 238, y1: 272, x2: 276, y2: 272, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 244, y1: 281, x2: 270, y2: 281, stroke: "currentColor", "stroke-width": 3 }));
    svgText(doc, node, "VL = V1贡献 + V2贡献", 151, 302, { "font-size": 11, "text-anchor": "middle" });
    svgText(doc, node, "端口等效", 526, 61, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); node.appendChild(svgElement(doc, "rect", { x: 405, y: 82, width: 72, height: 47, rx: 4, fill: "var(--ene-blue)", "fill-opacity": ".1", stroke: "var(--ene-blue)", "stroke-width": 2 })); svgText(doc, node, "Vth", 441, 103, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.vth, 3) + " V", 441, 119, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 477, y1: 105, x2: 510, y2: 105, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "rect", { x: 510, y: 82, width: 72, height: 47, rx: 4, fill: "var(--ene-green)", "fill-opacity": ".1", stroke: "var(--ene-green)", "stroke-width": 2 })); svgText(doc, node, "Rth", 546, 103, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.rth, 2) + " Ω", 546, 119, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 582, y1: 105, x2: 615, y2: 105, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "rect", { x: 615, y: 82, width: 72, height: 47, rx: 4, fill: "var(--ene-gold)", "fill-opacity": ".12", stroke: "var(--ene-gold)", "stroke-width": 2 })); svgText(doc, node, "RL", 651, 103, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.RL, 0) + " Ω", 651, 119, { "font-size": 10, "text-anchor": "middle" });
    svgText(doc, node, "VL = " + format(result.fullVoltage, 4) + " V", 545, 166, { "font-size": 14, "font-weight": 700, "text-anchor": "middle", fill: "var(--ene-red)" }); svgText(doc, node, "V1项 " + format(result.contribution1, 4) + " V + V2项 " + format(result.contribution2, 4) + " V", 545, 195, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, "Norton：In=" + format(result.inorton * 1000, 3) + " mA，Rn=Rth", 545, 225, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, "等效残差=" + format(result.superpositionResidual, 10) + " V", 545, 254, { "font-size": 11, "text-anchor": "middle", fill: "var(--ene-green)" });
    var plotLeft = 405, plotRight = 730, plotTop = 292, plotBottom = 377, plotWidth = plotRight - plotLeft, plotHeight = plotBottom - plotTop;
    function plotX(resistanceRatio) { var bounded = Math.max(0.01, Math.min(100, resistanceRatio)); return plotLeft + plotWidth * (Math.log(bounded) / Math.LN10 + 2) / 4; }
    function plotY(power) { return plotBottom - plotHeight * (result.maximumPower > 0 ? Math.max(0, Math.min(1, power / result.maximumPower)) : 0); }
    node.appendChild(svgElement(doc, "line", { x1: plotLeft, y1: plotBottom, x2: plotRight, y2: plotBottom, stroke: "currentColor", "stroke-opacity": ".5" })); node.appendChild(svgElement(doc, "line", { x1: plotLeft, y1: plotTop, x2: plotLeft, y2: plotBottom, stroke: "currentColor", "stroke-opacity": ".5" }));
    var curvePath = []; result.powerCurve.forEach(function (point, index) { var x = plotX(point.resistanceRatio); curvePath.push((index ? "L" : "M") + x.toFixed(2) + " " + plotY(point.power).toFixed(2)); });
    node.appendChild(svgElement(doc, "path", { d: curvePath.join(" "), fill: "none", stroke: "var(--ene-blue)", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: plotX(1), y1: plotTop, x2: plotX(1), y2: plotBottom, stroke: "var(--ene-red)", "stroke-dasharray": "5 4" }));
    var currentRatio = result.config.RL / result.rth;
    node.appendChild(svgElement(doc, "circle", { cx: plotX(currentRatio), cy: plotY(result.loadPower), r: 5, fill: "var(--ene-green)", stroke: "currentColor", "stroke-width": 2 }));
    svgText(doc, node, "负载功率曲线 PL(RL)", 567, 276, { "font-size": 12, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, "短路 RL→0：P→0", 410, 398, { "font-size": 10 }); svgText(doc, node, "RL=Rth，Pmax=" + format(result.maximumPower * 1000, 3) + " mW", 567, 398, { "font-size": 10, "text-anchor": "middle", fill: "var(--ene-red)" }); svgText(doc, node, "开路 RL→∞：P→0", 730, 398, { "font-size": 10, "text-anchor": "end" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "ene-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode); var rows = [
      ["Thevenin Vth", format(result.vth, 6), "V；负载开路端口电压"], ["Thevenin Rth", format(result.rth, 6), "Ω；独立理想电压源置零"], ["Norton In", format(result.inorton * 1000, 6), "mA；Vth/Rth"], ["完整网络 VL", format(result.fullVoltage, 6), "V"],
      ["V1 单独贡献", format(result.contribution1, 6), "V；V2 置零"], ["V2 单独贡献", format(result.contribution2, 6), "V；V1 置零"], ["叠加残差", format(result.superpositionResidual, 10), "V；完整值−两贡献"], ["负载功率 PL", format(result.loadPower * 1000, 5), "mW"],
      ["最大负载功率 Pmax", format(result.maximumPower * 1000, 6), "mW；RL=Rth，Vth²/(4Rth)"], ["最大功率边界 RL", format(result.maximumPowerBoundary, 6), "Ω；功率曲线峰值"],
      ["负载电压比 VL/Vth", result.loadRatioText, result.loadRatioDefined ? "无量纲" : "无定义；Vth=0"], ["开路/短路功率", "0 → 0", "PL(RL→0)→0；PL(RL→∞)→0"]
    ];
    var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "端口等效与叠加账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { V1: DEFAULTS.V1, V2: DEFAULTS.V2, R1: DEFAULTS.R1, R2: DEFAULTS.R2, RL: DEFAULTS.RL }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "ene-shell" }); shell.appendChild(element(doc, "h3", { text: "网络实验：叠加与端口等效" })); shell.appendChild(element(doc, "p", { className: "ene-note", text: "先预测负载端口的代数结果和源电阻效应；揭示后再改变两路源和负载。" })); var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "ene-choice-grid" }); var buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "ene-actions" }); var reveal = element(doc, "button", { type: "button", className: "ene-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "ene-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback); var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "ene-controls" }); var inputs = {}; var outputs = {};
    [["V1", "源 1 电压", 0, 6, 0.1, function (v) { return format(v, 1) + " V"; }], ["V2", "源 2 电压", 0, 6, 0.1, function (v) { return format(v, 1) + " V"; }], ["R1", "源 1 电阻", 1, 1000, 1, function (v) { return format(v, 0) + " Ω"; }], ["R2", "源 2 电阻", 1, 1000, 1, function (v) { return format(v, 0) + " Ω"; }], ["RL", "负载电阻", 1, 1000, 1, function (v) { return format(v, 0) + " Ω"; }]].forEach(function (spec) {
      var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "ene-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = { node: output, format: spec[5] };
    });
    results.appendChild(controls); var layout = element(doc, "div", { className: "ene-layout" }); var stage = element(doc, "div", { className: "ene-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "ene-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "ene-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "ene-note", text: "Thevenin/Norton 只保证端口行为等效；功率曲线的教学峰值在 RL=Rth，开路和短路的负载功率都趋近零。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeEquivalents(state.config); results.hidden = !state.revealed; Object.keys(outputs).forEach(function (key) { outputs[key].node.textContent = outputs[key].format(result.config[key]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "VL", format(result.fullVoltage, 4) + " V")); metrics.appendChild(metric(doc, "Vth", format(result.vth, 4) + " V")); metrics.appendChild(metric(doc, "Pmax", format(result.maximumPower * 1000, 3) + " mW")); metrics.appendChild(metric(doc, "峰值边界", format(result.maximumPowerBoundary, 2) + " Ω")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。把 RL 增大，再比较 VL 与 Vth；把 RL 减小，再看源电阻的影响。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: { V1: DEFAULTS.V1, V2: DEFAULTS.V2, R1: DEFAULTS.R1, R2: DEFAULTS.R2, RL: DEFAULTS.RL }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "网络等效实验已重置。"); }); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-ene-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeEquivalents(DEFAULTS);
    check(near(result.vth, 2.2), "Thevenin voltage");
    check(near(result.rth, 50), "Thevenin resistance");
    check(near(result.fullVoltage, 1.4666666667), "loaded voltage");
    check(near(result.fullVoltage, result.contribution1 + result.contribution2), "superposition");
    check(near(result.equivalentCurrent, result.nortonLoadCurrent), "Thevenin and Norton load current");
    check(near(result.maximumPower, 2.2 * 2.2 / (4 * 50)), "maximum power formula");
    check(near(computeEquivalents({ RL: result.rth }).loadPower, result.maximumPower), "power peaks at RL equals Rth");
    check(computeEquivalents({ RL: 1 }).loadPower < result.maximumPower * 0.1, "short-circuit side tends to zero power");
    check(computeEquivalents({ RL: 10000 }).loadPower < result.maximumPower * 0.1, "open-circuit side tends to zero power");
    check(computeEquivalents({ RL: result.rth * 0.99 }).loadPower <= result.maximumPower && computeEquivalents({ RL: result.rth * 1.01 }).loadPower <= result.maximumPower, "peak neighborhood is bounded by Pmax");
    var zeroSources = computeEquivalents({ V1: 0, V2: 0 });
    check(zeroSources.loadRatio === null && zeroSources.loadRatioText === "无定义" && !Number.isNaN(zeroSources.loadRatio), "zero-source load ratio is explicitly undefined");
    check(computeEquivalents({ RL: 10000 }).fullVoltage > result.fullVoltage, "lighter load approaches open circuit voltage");
    check(computeEquivalents({ R1: 200, R2: 200 }).rth > result.rth, "larger source resistance increases equivalent resistance");
    check(JSON.stringify(computeEquivalents(DEFAULTS)) === JSON.stringify(computeEquivalents(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, computeEquivalents: computeEquivalents, mount: mount, selfTest: selfTest };
});
