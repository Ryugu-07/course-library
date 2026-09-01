(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-first-order", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-first-order self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-first-order self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "ee-first-order";
  var STYLE_ID = "cl-ee-first-order-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { mode: "RC", sourceV: 3.3, R: 1000, C: 1e-6, L: 0.01, initialFraction: 0, windowTau: 5, bandwidth: 10000 };
  var QUESTIONS = [
    { key: "storage", prompt: "在当前模式中把储能元件值加倍，时间常数 τ 怎样？", expected: "longer", choices: [["longer", "变长"], ["shorter", "变短"], ["same", "不变"]] },
    { key: "bandwidth", prompt: "把测量带宽降低十倍，记录到的上升沿通常怎样？", expected: "slower", choices: [["slower", "变慢"], ["faster", "变快"], ["same", "不变"]] },
    { key: "continuity", prompt: "理想阶跃作用下，电容电压或电感电流在 0+ 会怎样？", expected: "continuous", choices: [["continuous", "保持初值连续"], ["jump", "立即跳到终值"], ["zero", "立即变为零"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) { if (!isFinite(value)) return "-"; var places = digits === undefined ? 2 : digits; if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4)); return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function formatTime(seconds, digits) {
    if (!isFinite(seconds)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(seconds) < 1e-6) return format(seconds * 1e9, places) + " ns";
    if (Math.abs(seconds) < 1e-3) return format(seconds * 1e6, places) + " us";
    if (Math.abs(seconds) < 1) return format(seconds * 1e3, places) + " ms";
    return format(seconds, places) + " s";
  }
  function normalize(input) {
    var source = input || {};
    return {
      mode: source.mode === "RL" ? "RL" : "RC",
      sourceV: clamp(finite(source.sourceV === undefined ? DEFAULTS.sourceV : source.sourceV, "step voltage"), 0.1, 12),
      R: clamp(finite(source.R === undefined ? DEFAULTS.R : source.R, "resistance"), 1, 10000),
      C: clamp(finite(source.C === undefined ? DEFAULTS.C : source.C, "capacitance"), 1e-9, 1e-3),
      L: clamp(finite(source.L === undefined ? DEFAULTS.L : source.L, "inductance"), 1e-6, 1),
      initialFraction: clamp(finite(source.initialFraction === undefined ? DEFAULTS.initialFraction : source.initialFraction, "initial fraction"), 0, 0.95),
      windowTau: clamp(finite(source.windowTau === undefined ? DEFAULTS.windowTau : source.windowTau, "observation window"), 0.25, 8),
      bandwidth: clamp(finite(source.bandwidth === undefined ? DEFAULTS.bandwidth : source.bandwidth, "measurement bandwidth"), 10, 1e8)
    };
  }
  function computeFirstOrder(input) {
    var config = normalize(input);
    var tau = config.mode === "RC" ? config.R * config.C : config.L / config.R;
    var finalState = config.mode === "RC" ? config.sourceV : config.sourceV / config.R;
    var initialState = finalState * config.initialFraction;
    var observationTime = config.windowTau * tau;
    var stateAt = function (time) { return finalState + (initialState - finalState) * Math.exp(-Math.max(0, time) / tau); };
    var measurementRise = 0.35 / config.bandwidth;
    var idealRise = Math.log(9) * tau;
    var observedRise = Math.sqrt(idealRise * idealRise + measurementRise * measurementRise);
    var measurementTimeConstant = measurementRise / Math.log(9);
    var measurementStateAt = function (time) {
      var t = Math.max(0, time);
      var delta = tau - measurementTimeConstant;
      var complement;
      if (Math.abs(delta) <= Math.max(tau, measurementTimeConstant) * 1e-9) {
        complement = Math.exp(-t / tau) * (1 + t / tau);
      } else {
        complement = (tau * Math.exp(-t / tau) - measurementTimeConstant * Math.exp(-t / measurementTimeConstant)) / delta;
      }
      return finalState + (initialState - finalState) * complement;
    };
    return {
      config: config,
      tau: tau,
      initialState: initialState,
      finalState: finalState,
      observationTime: observationTime,
      endState: stateAt(observationTime),
      stateAt: stateAt,
      initialContinuityError: stateAt(0) - initialState,
      settledFraction: 1 - Math.exp(-config.windowTau),
      measurementRise: measurementRise,
      measurementTimeConstant: measurementTimeConstant,
      measurementStateAt: measurementStateAt,
      measuredStateAt: measurementStateAt,
      idealRise: idealRise,
      observedRise: observedRise,
      measurementDominant: measurementRise > idealRise * 0.5,
      interpretation: config.mode === "RC" ? "状态量是电容电压 Vc" : "状态量是电感电流 IL"
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
      '[data-learning-lab="' + LAB_ID + '"]{--efo-blue:#1769aa;--efo-green:#2e7d57;--efo-red:#b23a32;--efo-gold:#9b6a12;display:block;max-width:100%;min-width:0;line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .efo-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--efo-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .efo-primary{border-color:var(--efo-blue);background:var(--efo-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible,[data-learning-lab="' + LAB_ID + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .efo-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .efo-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .efo-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .efo-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .efo-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .efo-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--efo-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] input[type=range],[data-learning-lab="' + LAB_ID + '"] select{display:block;width:100%;min-height:44px;margin:0}[data-learning-lab="' + LAB_ID + '"] input[type=range]{accent-color:var(--efo-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .efo-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .efo-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] .efo-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .efo-metric{min-width:0;padding:9px;border-top:2px solid var(--efo-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .efo-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .efo-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] .efo-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .efo-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .efo-controls{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .efo-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .efo-choice-grid,[data-learning-lab="' + LAB_ID + '"] .efo-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .efo-choice-grid,[data-learning-lab="' + LAB_ID + '"] .efo-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .efo-actions>*{flex-basis:100%}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-efo-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 760 345"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "RC RL 一阶瞬态与测量带宽波形示意");
    node.appendChild(svgElement(doc, "title", {}, "RC/RL 一阶瞬态、初值连续性与测量带宽")); node.appendChild(svgElement(doc, "desc", {}, "左侧是根据模式切换的 RC 或 RL 低压电路，右侧是状态量从初值向终值的一阶波形，并标出观察窗口和测量上升时间。"));
    node.appendChild(svgElement(doc, "rect", { x: 28, y: 92, width: 52, height: 70, rx: 4, fill: "var(--efo-blue)", "fill-opacity": ".12", stroke: "var(--efo-blue)", "stroke-width": 2 })); svgText(doc, node, "step", 54, 123, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.sourceV, 1) + " V", 54, 143, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 80, y1: 127, x2: 117, y2: 127, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "rect", { x: 117, y: 103, width: 72, height: 48, rx: 4, fill: "var(--efo-green)", "fill-opacity": ".12", stroke: "var(--efo-green)", "stroke-width": 2 })); svgText(doc, node, "R", 153, 124, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.R, 0) + " Ω", 153, 141, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 189, y1: 127, x2: 223, y2: 127, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "rect", { x: 223, y: 103, width: 78, height: 48, rx: 4, fill: result.config.mode === "RC" ? "var(--efo-red)" : "var(--efo-gold)", "fill-opacity": ".12", stroke: result.config.mode === "RC" ? "var(--efo-red)" : "var(--efo-gold)", "stroke-width": 2 })); svgText(doc, node, result.config.mode === "RC" ? "C" : "L", 262, 124, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, result.config.mode === "RC" ? format(result.config.C * 1e6, 2) + " uF" : format(result.config.L * 1000, 2) + " mH", 262, 141, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 262, y1: 151, x2: 262, y2: 216, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 54, y1: 216, x2: 262, y2: 216, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 54, y1: 216, x2: 54, y2: 162, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "polygon", { points: "94,127 82,121 82,133", fill: "var(--efo-blue)" })); svgText(doc, node, "状态量初值不跳变", 160, 259, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, result.interpretation, 160, 282, { "font-size": 11, "text-anchor": "middle", fill: result.config.mode === "RC" ? "var(--efo-red)" : "var(--efo-gold)" });
    var left = 365, right = 730, top = 48, bottom = 225; var span = Math.max(Math.abs(result.finalState), Math.abs(result.initialState), 1e-12);
    function x(time) { return left + (right - left) * clamp(time / result.observationTime, 0, 1); }
    function y(value) { return bottom - (bottom - top) * clamp((value - result.initialState) / (span - result.initialState || span), 0, 1); }
    node.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-opacity": ".55" })); node.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: y(result.initialState), x2: right, y2: y(result.initialState), stroke: "var(--efo-red)", "stroke-dasharray": "5 4" })); node.appendChild(svgElement(doc, "line", { x1: left, y1: y(result.finalState), x2: right, y2: y(result.finalState), stroke: "var(--efo-green)", "stroke-dasharray": "5 4" }));
    var idealPath = []; var measuredPath = []; for (var i = 0; i <= 80; i += 1) { var time = result.observationTime * i / 80; idealPath.push((i ? "L" : "M") + x(time).toFixed(2) + " " + y(result.stateAt(time)).toFixed(2)); measuredPath.push((i ? "L" : "M") + x(time).toFixed(2) + " " + y(result.measurementStateAt(time)).toFixed(2)); }
    node.appendChild(svgElement(doc, "path", { d: idealPath.join(" "), fill: "none", stroke: "var(--efo-blue)", "stroke-width": 3 })); node.appendChild(svgElement(doc, "path", { d: measuredPath.join(" "), fill: "none", stroke: "var(--efo-gold)", "stroke-width": 2, "stroke-dasharray": "6 4" })); node.appendChild(svgElement(doc, "line", { x1: x(result.observationTime), y1: top, x2: x(result.observationTime), y2: bottom, stroke: "var(--efo-gold)", "stroke-width": 2, "stroke-dasharray": "4 4" }));
    svgText(doc, node, result.config.mode === "RC" ? "Vc(t)" : "IL(t)", left + 5, 29, { "font-size": 14, "font-weight": 700 }); node.appendChild(svgElement(doc, "line", { x1: 450, y1: 24, x2: 470, y2: 24, stroke: "var(--efo-blue)", "stroke-width": 3 })); svgText(doc, node, "理想电路", 476, 29, { "font-size": 10 }); node.appendChild(svgElement(doc, "line", { x1: 565, y1: 24, x2: 585, y2: 24, stroke: "var(--efo-gold)", "stroke-width": 2, "stroke-dasharray": "6 4" })); svgText(doc, node, "测量链（近似）", 591, 29, { "font-size": 10 }); svgText(doc, node, "初值", left + 5, y(result.initialState) - 8, { "font-size": 11, fill: "var(--efo-red)" }); svgText(doc, node, "终值", right - 4, y(result.finalState) - 8, { "font-size": 11, "text-anchor": "end", fill: "var(--efo-green)" }); svgText(doc, node, format(result.config.windowTau, 2) + "τ 窗口", right - 4, bottom + 22, { "font-size": 11, "text-anchor": "end" }); svgText(doc, node, "t", right, bottom + 42, { "font-size": 11, "text-anchor": "end" });
    svgText(doc, node, "τ=" + formatTime(result.tau) + "；窗口末=" + formatTime(result.observationTime), 545, 266, { "font-size": 11, "text-anchor": "middle", fill: "var(--efo-blue)" }); svgText(doc, node, "理想 10–90%=" + formatTime(result.idealRise), 455, 291, { "font-size": 11 }); svgText(doc, node, "tobs≈" + formatTime(result.observedRise, 6), 650, 291, { "font-size": 11, "text-anchor": "end", fill: "var(--efo-gold)" }); svgText(doc, node, result.measurementDominant ? "测量链可能主导观测边沿" : "测量链影响较小，电路动态占主导", 545, 319, { "font-size": 11, "text-anchor": "middle", fill: result.measurementDominant ? "var(--efo-red)" : "var(--efo-green)" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "efo-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode); var unit = result.config.mode === "RC" ? "V" : "A"; var rows = [["模式", result.config.mode, result.interpretation], ["时间常数 τ", formatTime(result.tau), "RC：R·C；RL：L/R"], ["初始状态 x(0−)", format(result.initialState, 6), unit], ["终值 x(∞)", format(result.finalState, 6), unit], ["观察窗口末 t_end", formatTime(result.observationTime), "末端=" + format(result.config.windowTau, 2) + "τ；横轴按窗口缩放"], ["窗口末 x(t_end)", format(result.endState, 9), unit + "；x(" + format(result.config.windowTau, 2) + "τ)"], ["初值连续误差", format(result.initialContinuityError, 12), unit + "；x(0+)−x(0−)"], ["理想 10–90% 上升时间", formatTime(result.idealRise), "ln(9)·τ"], ["测量链上升时间近似", formatTime(result.measurementRise), "0.35/BW；近似"], ["合成观测上升时间 tobs", formatTime(result.observedRise, 6), "平方和近似；非理想精确响应"] , ["窗口内响应比例", format(result.settledFraction * 100, 4), "%；1−e^(−t/τ)"]]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "一阶瞬态与测量账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return; var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE); var state = { config: { mode: DEFAULTS.mode, sourceV: DEFAULTS.sourceV, R: DEFAULTS.R, C: DEFAULTS.C, L: DEFAULTS.L, initialFraction: DEFAULTS.initialFraction, windowTau: DEFAULTS.windowTau, bandwidth: DEFAULTS.bandwidth }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "efo-shell" }); shell.appendChild(element(doc, "h3", { text: "一阶实验：RC/RL 瞬态与测量带宽" })); shell.appendChild(element(doc, "p", { className: "efo-note", text: "先预测时间常数、初值和带宽；揭示后可切换 RC/RL 并改变观测条件。所有数值是低压教学设定。" })); var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "efo-choice-grid" }); var buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "efo-actions" }); var reveal = element(doc, "button", { type: "button", className: "efo-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "efo-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback); var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "efo-controls" }); var inputs = {}; var outputs = {};
    var modeId = uid + "-mode"; var modeLabel = element(doc, "label", { htmlFor: modeId, text: "一阶模式" }); var modeOutput = element(doc, "output", { text: "" }); var modeWrap = element(doc, "div", { className: "efo-control" }, [modeLabel, modeOutput]); var modeInput = element(doc, "select", { id: modeId, "aria-label": "一阶模式" }); modeInput.appendChild(element(doc, "option", { value: "RC", text: "RC：电容电压" })); modeInput.appendChild(element(doc, "option", { value: "RL", text: "RL：电感电流" })); modeInput.value = state.config.mode; modeInput.addEventListener("change", function () { state.config.mode = modeInput.value; if (state.revealed) renderResult(); }); modeWrap.appendChild(modeInput); controls.appendChild(modeWrap); inputs.mode = modeInput; outputs.mode = modeOutput;
    [["sourceV", "阶跃电压", 0.1, 8, 0.1, function (v) { return format(v, 1) + " V"; }], ["R", "电阻 R", 10, 5000, 10, function (v) { return format(v, 0) + " Ω"; }], ["C", "电容 C", 1e-9, 20e-6, 1e-9, function (v) { return format(v * 1e6, 3) + " uF"; }], ["L", "电感 L", 1e-6, 0.1, 1e-6, function (v) { return format(v * 1000, 3) + " mH"; }], ["initialFraction", "初值/终值", 0, 0.9, 0.01, function (v) { return format(v * 100, 0) + "%"; }], ["windowTau", "观察窗口", 0.25, 8, 0.25, function (v) { return format(v, 2) + " τ"; }], ["bandwidth", "测量带宽", 100, 1000000, 100, function (v) { return format(v / 1000, 1) + " kHz"; }]].forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "efo-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = { node: output, format: spec[5] }; });
    results.appendChild(controls); var layout = element(doc, "div", { className: "efo-layout" }); var stage = element(doc, "div", { className: "efo-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "efo-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "efo-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "efo-note", text: "0.35/BW 是明确标注为近似的测量链上升时间；带宽越低，测量链响应越慢，只有与电路动态可比时才会显著改变观测边沿。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeFirstOrder(state.config); results.hidden = !state.revealed; outputs.mode.textContent = result.config.mode; Object.keys(outputs).forEach(function (key) { if (key !== "mode") outputs[key].node.textContent = outputs[key].format(result.config[key]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "τ", formatTime(result.tau))); metrics.appendChild(metric(doc, "窗口末", format(result.endState, 4) + (result.config.mode === "RC" ? " V" : " A"))); metrics.appendChild(metric(doc, "观测上升", formatTime(result.observedRise))); metrics.appendChild(metric(doc, "初值连续", near(result.initialContinuityError, 0, 1e-10) ? "是" : "需检查")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。降低带宽会放慢测量链；把带宽调到与电路动态可比，观察近似测量响应如何偏离理想响应。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: { mode: DEFAULTS.mode, sourceV: DEFAULTS.sourceV, R: DEFAULTS.R, C: DEFAULTS.C, L: DEFAULTS.L, initialFraction: DEFAULTS.initialFraction, windowTau: DEFAULTS.windowTau, bandwidth: DEFAULTS.bandwidth }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "一阶实验已重置。"); }); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-efo-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeFirstOrder(DEFAULTS);
    check(result.config.mode === "RC", "default mode");
    check(near(result.tau, 0.001), "RC time constant");
    check(near(result.initialState, 0), "initial state");
    check(near(result.endState, 3.3 * (1 - Math.exp(-5))), "five tau endpoint");
    check(near(result.initialContinuityError, 0, 1e-12), "initial continuity");
    check(result.measurementRise < result.idealRise, "default measurement bandwidth is adequate");
    check(near(result.endState, 3.277764774903018, 1e-12), "five tau endpoint precision");
    check(near(result.observedRise, 0.002197503, 1e-6), "default observed rise time");
    check(near(result.measurementStateAt(0), result.initialState, 1e-12), "measurement chain preserves initial state");
    check(computeFirstOrder({ mode: "RL" }).tau === DEFAULTS.L / DEFAULTS.R, "RL time constant");
    var slowMeasurement = computeFirstOrder({ bandwidth: 1000 });
    check(slowMeasurement.observedRise > result.observedRise, "narrower measurement bandwidth slows observed edge");
    check(slowMeasurement.measurementStateAt(slowMeasurement.tau) < result.measurementStateAt(result.tau), "measurement curve changes with bandwidth");
    check(JSON.stringify({ tau: result.tau, end: result.endState }) === JSON.stringify({ tau: computeFirstOrder(DEFAULTS).tau, end: computeFirstOrder(DEFAULTS).endState }), "deterministic result");
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, computeFirstOrder: computeFirstOrder, mount: mount, selfTest: selfTest };
});
