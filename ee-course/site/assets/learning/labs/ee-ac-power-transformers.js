(function (root, factory) {
  "use strict";
  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-ac-power-transformers", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-ac-power-transformers self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-ac-power-transformers self-test: FAIL", error && error.stack ? error.stack : error);
      process.exitCode = 1;
    }
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var LAB_ID = "ee-ac-power-transformers";
  var STYLE_ID = "ee-ac-power-transformers-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { primaryVoltage: 5, primaryCurrent: 0.4, lagDeg: 36.87, turnsRatio: 2 };
  var QUESTIONS = [
    { key: "triangle", prompt: "保持 V、I 不变，增大电流滞后角，P 与 Q 怎样变化？", expected: "p-down-q-up", choices: [["p-down-q-up", "P 降、Q 升"], ["both-up", "P、Q 都升"], ["both-same", "P、Q 都不变"]] },
    { key: "ratio", prompt: "一次电压、一次电流（因而一次视在功率）都固定，匝数比 a 加倍时，二次端怎样变化？", expected: "v-down-i-up", choices: [["v-down-i-up", "电压降、电流升"], ["v-up-i-down", "电压升、电流降"], ["same", "都不变"]] },
    { key: "isolation", prompt: "理想变压器传递交流功率是否要求一次二次金属直连？", expected: "no", choices: [["no", "不要求"], ["yes", "必须直连"], ["dc", "只需直流"]] }
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
      primaryVoltage: clamp(finite(source.primaryVoltage === undefined ? DEFAULTS.primaryVoltage : source.primaryVoltage, "primary voltage"), 0.1, 24),
      primaryCurrent: clamp(finite(source.primaryCurrent === undefined ? DEFAULTS.primaryCurrent : source.primaryCurrent, "primary current"), 0.001, 5),
      lagDeg: clamp(finite(source.lagDeg === undefined ? DEFAULTS.lagDeg : source.lagDeg, "lag angle"), 0, 89),
      turnsRatio: clamp(finite(source.turnsRatio === undefined ? DEFAULTS.turnsRatio : source.turnsRatio, "turns ratio"), 0.25, 8)
    };
  }
  function computePowerTransformer(input) {
    var config = normalize(input);
    var phi = config.lagDeg * Math.PI / 180;
    var apparent = config.primaryVoltage * config.primaryCurrent;
    var active = apparent * Math.cos(phi);
    var reactive = apparent * Math.sin(phi);
    var secondaryVoltage = config.primaryVoltage / config.turnsRatio;
    var secondaryCurrent = apparent / secondaryVoltage;
    var secondaryActive = secondaryVoltage * secondaryCurrent * Math.cos(phi);
    var secondaryReactive = secondaryVoltage * secondaryCurrent * Math.sin(phi);
    return {
      config: config,
      phiRad: phi,
      apparent: apparent,
      active: active,
      reactive: reactive,
      powerFactor: active / apparent,
      secondaryVoltage: secondaryVoltage,
      secondaryCurrent: secondaryCurrent,
      secondaryApparent: secondaryVoltage * secondaryCurrent,
      secondaryActive: secondaryActive,
      secondaryReactive: secondaryReactive,
      idealLoss: apparent - secondaryVoltage * secondaryCurrent,
      isolatedTopology: true
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "text") node.textContent = String(value); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); });
    (children === undefined ? [] : (Array.isArray(children) ? children : [children])).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node;
  }
  function svgElement(doc, tag, attrs, children) { var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; node.setAttribute(key, String(value)); }); (children === undefined ? [] : (Array.isArray(children) ? children : [children])).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
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
      '[data-learning-lab="' + LAB_ID + '"] .eep-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .eep-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .eep-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--eep-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--eep-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eep-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .eep-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .eep-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .eep-metric{min-width:0;padding:9px;border-top:2px solid var(--eep-blue)}[data-learning-lab="' + LAB_ID + '"] .eep-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eep-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .eep-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eep-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .eep-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .eep-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eep-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .eep-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eep-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .eep-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); else { var live = rootNode.querySelector("[data-eep-live]"); if (live) live.textContent = message; } }
  function arrow(doc, parent, x1, y1, x2, y2, color, label, labelX, labelY) { parent.appendChild(svgElement(doc, "line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color, "stroke-width": 3 })); var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len, px = -uy, py = ux; parent.appendChild(svgElement(doc, "polygon", { points: [x2 + "," + y2, (x2 - 10 * ux + 5 * px) + "," + (y2 - 10 * uy + 5 * py), (x2 - 10 * ux - 5 * px) + "," + (y2 - 10 * uy - 5 * py)].join(" "), fill: color })); svgText(doc, parent, label, labelX, labelY, { "font-size": 11, fill: color }); }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 800 380"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "交流功率三角与理想变压器隔离示意");
    node.appendChild(svgElement(doc, "title", {}, "有功、无功、视在功率与理想变压器")); node.appendChild(svgElement(doc, "desc", {}, "左侧用直角三角表示 P、Q 和视在功率；右侧用两组线圈和断开的导线表示理想磁耦合与非导电隔离边界。"));
    var blue = "var(--eep-blue)", green = "var(--eep-green)", gold = "var(--eep-gold)", red = "var(--eep-red)";
    var ox = 120, oy = 220, scale = 90 / Math.max(result.apparent, 0.1); node.appendChild(svgElement(doc, "line", { x1: ox, y1: oy, x2: ox + result.active * scale, y2: oy, stroke: green, "stroke-width": 4 })); node.appendChild(svgElement(doc, "line", { x1: ox + result.active * scale, y1: oy, x2: ox + result.active * scale, y2: oy - result.reactive * scale, stroke: gold, "stroke-width": 4 })); arrow(doc, node, ox, oy, ox + result.active * scale, oy - result.reactive * scale, red, "|S|", ox + result.active * scale + 5, oy - result.reactive * scale - 5);
    svgText(doc, node, "功率三角（教学模型）", 36, 34, { "font-size": 13, "font-weight": 700 }); svgText(doc, node, "P / W", ox + result.active * scale / 2 - 15, oy + 22, { "font-size": 11, fill: green }); svgText(doc, node, "Q / var", ox + result.active * scale + 8, oy - result.reactive * scale / 2, { "font-size": 11, fill: gold }); svgText(doc, node, "φ=" + format(result.config.lagDeg, 1) + "°", ox + result.active * scale / 2 + 8, oy - result.reactive * scale / 2 - 8, { "font-size": 11, fill: red });
    var x1 = 455, x2 = 650, cy = 150; node.appendChild(svgElement(doc, "line", { x1: x1, y1: 75, x2: x1, y2: 300, stroke: red, "stroke-width": 2, "stroke-dasharray": "7 5" })); node.appendChild(svgElement(doc, "line", { x1: x2, y1: 75, x2: x2, y2: 300, stroke: red, "stroke-width": 2, "stroke-dasharray": "7 5" }));
    node.appendChild(svgElement(doc, "path", { d: "M" + (x1 - 30) + " " + cy + " c0 -28 22 -28 22 0 c0 28 22 28 22 0 c0 -28 22 -28 22 0 c0 28 22 28 22 0", fill: "none", stroke: blue, "stroke-width": 3 })); node.appendChild(svgElement(doc, "path", { d: "M" + (x2 - 30) + " " + cy + " c0 -28 22 -28 22 0 c0 28 22 28 22 0 c0 -28 22 -28 22 0 c0 28 22 28 22 0", fill: "none", stroke: blue, "stroke-width": 3 }));
    arrow(doc, node, x1 - 90, cy - 58, x1 - 35, cy - 58, green, "Vₚ", x1 - 85, cy - 70); arrow(doc, node, x2 + 35, cy - 58, x2 + 90, cy - 58, green, "Vₛ", x2 + 42, cy - 70);
    svgText(doc, node, "一次 Nₚ", x1 - 8, cy + 70, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, "二次 Nₛ", x2 + 8, cy + 70, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, "a=Nₚ/Nₛ=" + format(result.config.turnsRatio, 2), 545, 36, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, "虚线：非导电隔离边界；蓝线：磁耦合示意", 545, 330, { "font-size": 10, fill: "var(--fg-soft,currentColor)", "text-anchor": "middle" }); svgText(doc, node, "理想关系：Vₚ/Vₛ=a，Iₚ/Iₛ=1/a", 545, 350, { "font-size": 11, fill: red, "text-anchor": "middle" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "eep-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) { clear(hostNode); var rows = [["视在功率 |S|", format(result.apparent, 3), "VA；VI"], ["有功功率 P", format(result.active, 3), "W；VI cosφ"], ["无功功率 Q", format(result.reactive, 3), "var；VI sinφ"], ["功率因数", format(result.powerFactor, 3), "无量纲"], ["二次电压", format(result.secondaryVoltage, 3), "V rms；Vp/a"], ["二次电流", format(result.secondaryCurrent, 3), "A rms；理想功率平衡"], ["二次视在功率", format(result.secondaryApparent, 3), "VA；理想模型"], ["理想功率差", format(result.idealLoss, 6), "VA；应接近零"]]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "交流功率与变压器账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body])); }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE); var state = { config: { primaryVoltage: DEFAULTS.primaryVoltage, primaryCurrent: DEFAULTS.primaryCurrent, lagDeg: DEFAULTS.lagDeg, turnsRatio: DEFAULTS.turnsRatio }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; rootNode.textContent = "";
    var shell = element(doc, "div", { className: "eep-shell" }); shell.appendChild(element(doc, "h3", { text: "交流功率实验：功率三角与理想变压器" })); shell.appendChild(element(doc, "p", { className: "eep-note", text: "只使用低压教学设定；先预测，再观察 W、var、VA、PF 和匝数比如何共同变化。" })); var predictionHost = element(doc, "div"), groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "eep-choice-grid" }), buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "eep-actions" }); var reveal = element(doc, "button", { type: "button", className: "eep-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "eep-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }), controls = element(doc, "div", { className: "eep-controls" }); var specs = [["primaryVoltage", "一次电压 Vₚ", 0.1, 12, 0.1, "V rms"], ["primaryCurrent", "一次电流 Iₚ", 0.001, 2, 0.001, "A rms"], ["lagDeg", "滞后角 φ", 0, 80, 0.1, "度"], ["turnsRatio", "匝数比 a", 0.25, 4, 0.01, "Nₚ/Nₛ"]]; var inputs = {}, outputs = {};
    specs.forEach(function (spec) { var id = uid + "-" + spec[0], output = element(doc, "output", { text: "" }), label = element(doc, "label", { htmlFor: id, text: spec[1] }), wrap = element(doc, "div", { className: "eep-control" }, [label, output]), input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output; }); results.appendChild(controls);
    var layout = element(doc, "div", { className: "eep-layout" }), stage = element(doc, "div", { className: "eep-stage" }), svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"), metrics = element(doc, "div", { className: "eep-metrics" }), tableWrap = element(doc, "div", { className: "eep-table-wrap" }); side.appendChild(metrics); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "eep-note", text: "理想功率差接近零只验证模型关系；它不证明线圈损耗、绝缘、温升或共模电流合格。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computePowerTransformer(state.config); results.hidden = !state.revealed; outputs.primaryVoltage.textContent = format(result.config.primaryVoltage, 2) + " V"; outputs.primaryCurrent.textContent = format(result.config.primaryCurrent, 3) + " A"; outputs.lagDeg.textContent = format(result.config.lagDeg, 1) + "°"; outputs.turnsRatio.textContent = format(result.config.turnsRatio, 2); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "P", format(result.active, 3) + " W")); metrics.appendChild(metric(doc, "Q", format(result.reactive, 3) + " var")); metrics.appendChild(metric(doc, "|S|", format(result.apparent, 3) + " VA")); metrics.appendChild(metric(doc, "PF", format(result.powerFactor, 3))); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在拖动滞后角和匝数比，查看功率与端口映射。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: { primaryVoltage: DEFAULTS.primaryVoltage, primaryCurrent: DEFAULTS.primaryCurrent, lagDeg: DEFAULTS.lagDeg, turnsRatio: DEFAULTS.turnsRatio }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "交流功率实验已重置。"); }); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-eep-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var result = computePowerTransformer(DEFAULTS); check(near(result.apparent, 2), "apparent power"); check(near(result.active, 1.6, 1e-3), "active power"); check(near(result.reactive, 1.2, 2e-3), "reactive power"); check(near(result.secondaryVoltage, 2.5), "secondary voltage"); check(near(result.secondaryCurrent, 0.8), "secondary current"); check(near(result.secondaryApparent, result.apparent, 1e-10), "ideal power balance"); check(computePowerTransformer({ lagDeg: 0 }).reactive === 0, "unity power factor has no reactive power"); check(computePowerTransformer({ turnsRatio: 4 }).secondaryVoltage < result.secondaryVoltage, "larger ratio lowers secondary voltage"); check(isFinite(computePowerTransformer({ primaryVoltage: -1, turnsRatio: 0 }).powerFactor), "input normalization"); check(JSON.stringify(computePowerTransformer(DEFAULTS)) === JSON.stringify(computePowerTransformer(DEFAULTS)), "deterministic result"); return { checks: checks }; }
  return { DEFAULTS: DEFAULTS, computePowerTransformer: computePowerTransformer, mount: mount, selfTest: selfTest };
}));
