(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-system-ledger", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-system-ledger self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-system-ledger self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "earth-system-ledger";
  var STYLE_ID = "cl-earth-system-ledger-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { stock: 1200, input: 80, k: 0.05, horizon: 10 };
  var QUESTIONS = [
    { key: "direction", prompt: "若当前输入大于当前输出，储量的变化方向是？", expected: "up", choices: [["up", "上升"], ["down", "下降"], ["zero", "不变"]] },
    { key: "tau", prompt: "把一阶输出系数减半，驻留/响应时间会怎样？", expected: "longer", choices: [["longer", "变长"], ["shorter", "变短"], ["same", "不变"]] },
    { key: "initial", prompt: "一阶模型中，只改变初始储量，接近稳态的时间常数会怎样？", expected: "same", choices: [["same", "不变"], ["longer", "变长"], ["shorter", "变短"]] }
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
      stock: clamp(finite(source.stock === undefined ? DEFAULTS.stock : source.stock, "stock"), 0, 5000),
      input: clamp(finite(source.input === undefined ? DEFAULTS.input : source.input, "input"), 0, 300),
      k: clamp(finite(source.k === undefined ? DEFAULTS.k : source.k, "output coefficient"), 0.005, 0.15),
      horizon: clamp(finite(source.horizon === undefined ? DEFAULTS.horizon : source.horizon, "horizon"), 1, 60)
    };
  }

  function computeLedger(input) {
    var config = normalize(input);
    var steady = config.input / config.k;
    var tau = 1 / config.k;
    var decay = Math.exp(-config.k * config.horizon);
    var end = steady + (config.stock - steady) * decay;
    var outputEnd = config.k * end;
    var netChange = end - config.stock;
    var integratedInput = config.input * config.horizon;
    var integratedOutput = integratedInput - netChange;
    var closure = integratedInput - integratedOutput - netChange;
    return {
      config: config,
      steady: steady,
      tau: tau,
      decay: decay,
      responseFraction: 1 - decay,
      end: end,
      outputEnd: outputEnd,
      netChange: netChange,
      integratedInput: integratedInput,
      integratedOutput: integratedOutput,
      closure: closure,
      slopeEnd: config.input - outputEnd,
      interpretation: end >= config.stock ? "储量上升" : "储量下降"
    };
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key === "htmlFor") node.setAttribute("for", String(value));
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
    var all = attrs || {}; all.x = x; all.y = y;
    parent.appendChild(svgElement(doc, "text", all, text));
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--esl-blue:#2563a6;--esl-green:#39734d;--esl-gold:#9b6a12;--esl-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .esl-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--esl-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .esl-primary{border-color:var(--esl-blue);background:var(--esl-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .esl-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .esl-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .esl-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .esl-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .esl-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .esl-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--esl-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--esl-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .esl-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .esl-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .esl-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .esl-metric{min-width:0;padding:9px;border-top:2px solid var(--esl-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .esl-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .esl-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .esl-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .esl-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .esl-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .esl-choice-grid,[data-learning-lab="' + LAB_ID + '"] .esl-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .esl-choice-grid,[data-learning-lab="' + LAB_ID + '"] .esl-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .esl-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
    else {
      var live = rootNode.querySelector("[data-esl-live]");
      if (live) live.textContent = message;
    }
  }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 760 320"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "储库输入输出与一阶响应示意");
    node.appendChild(svgElement(doc, "title", {}, "储库输入、输出和响应时间"));
    node.appendChild(svgElement(doc, "desc", {}, "左侧是输入输出与储库，右侧是从初始储量向稳态靠近的响应轨迹。"));
    node.appendChild(svgElement(doc, "rect", { x: 18, y: 55, width: 190, height: 112, rx: 6, fill: "var(--esl-blue)", "fill-opacity": ".12", stroke: "var(--esl-blue)", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "rect", { x: 18, y: 142, width: 190, height: 25, rx: 0, fill: "var(--esl-blue)", "fill-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: 0, y1: 111, x2: 18, y2: 111, stroke: "var(--esl-green)", "stroke-width": 8 }));
    node.appendChild(svgElement(doc, "polygon", { points: "18,101 18,121 32,111", fill: "var(--esl-green)" }));
    node.appendChild(svgElement(doc, "line", { x1: 208, y1: 111, x2: 260, y2: 111, stroke: "var(--esl-red)", "stroke-width": 8 }));
    node.appendChild(svgElement(doc, "polygon", { points: "260,101 260,121 274,111", fill: "var(--esl-red)" }));
    svgText(doc, node, "输入", 4, 88, { "font-size": 12, fill: "var(--esl-green)" });
    svgText(doc, node, "输出", 220, 88, { "font-size": 12, fill: "var(--esl-red)" });
    svgText(doc, node, "储库 S", 113, 94, { "font-size": 15, "font-weight": 700, "text-anchor": "middle" });
    svgText(doc, node, "末值 " + format(result.end, 1), 113, 128, { "font-size": 12, "text-anchor": "middle" });
    svgText(doc, node, "蓝条：储量比例示意", 113, 194, { "font-size": 11, "text-anchor": "middle", fill: "var(--fg-soft)" });
    var left = 330, right = 728, top = 48, bottom = 215;
    node.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    var scaleMax = Math.max(result.config.stock, result.steady, result.end, 1);
    var path = [];
    for (var i = 0; i <= 70; i += 1) {
      var time = result.config.horizon * i / 70;
      var value = result.steady + (result.config.stock - result.steady) * Math.exp(-result.config.k * time);
      var x = left + (right - left) * i / 70;
      var y = bottom - (bottom - top) * value / scaleMax;
      path.push((i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2));
    }
    var steadyY = bottom - (bottom - top) * result.steady / scaleMax;
    var startY = bottom - (bottom - top) * result.config.stock / scaleMax;
    node.appendChild(svgElement(doc, "line", { x1: left, y1: steadyY, x2: right, y2: steadyY, stroke: "var(--esl-gold)", "stroke-dasharray": "5 4" }));
    node.appendChild(svgElement(doc, "path", { d: path.join(" "), fill: "none", stroke: "var(--esl-blue)", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "circle", { cx: left, cy: startY, r: 5, fill: "var(--esl-red)" }));
    node.appendChild(svgElement(doc, "circle", { cx: right, cy: bottom - (bottom - top) * result.end / scaleMax, r: 5, fill: "var(--esl-green)" }));
    svgText(doc, node, "响应 S(t)", left + 4, 28, { "font-size": 13, "font-weight": 700 });
    svgText(doc, node, "初始", left, startY - 9, { "font-size": 11, fill: "var(--esl-red)" });
    svgText(doc, node, "稳态", right - 4, steadyY - 8, { "font-size": 11, "text-anchor": "end", fill: "var(--esl-gold)" });
    svgText(doc, node, "窗口末", right - 4, bottom + 22, { "font-size": 11, "text-anchor": "end", fill: "var(--esl-green)" });
    svgText(doc, node, "t / 年", right, bottom + 42, { "font-size": 11, "text-anchor": "end" });
    svgText(doc, node, "τ=" + format(result.tau, 1) + " 年", left + 4, 285, { "font-size": 12, fill: "var(--esl-blue)" });
    svgText(doc, node, "虚线：稳态，不是观测", left + 132, 285, { "font-size": 11, fill: "var(--fg-soft)" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "esl-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode);
    var rows = [
      ["当前输入", format(result.config.input, 2), "单位/年"],
      ["窗口末输出", format(result.outputEnd, 2), "单位/年；kS(t)"],
      ["稳态储量", format(result.steady, 2), "单位；输入不变时"],
      ["驻留/响应时间 τ", format(result.tau, 2), "年；1/k"],
      ["窗口末储量", format(result.end, 2), "储量单位"],
      ["净变化", (result.netChange >= 0 ? "+" : "") + format(result.netChange, 2), "储量单位"],
      ["积分闭合误差", format(result.closure, 6), "输入-输出-储量变化"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "储库守恒账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { stock: DEFAULTS.stock, input: DEFAULTS.input, k: DEFAULTS.k, horizon: DEFAULTS.horizon }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = "";
    var shell = element(doc, "div", { className: "esl-shell" });
    shell.appendChild(element(doc, "h3", { text: "储库实验：输入、输出与系统记忆" }));
    shell.appendChild(element(doc, "p", { className: "esl-note", text: "先判断方向和时间常数；揭示后调节四个参数。数值均为教学设定，不是现场观测。" }));
    var predictionHost = element(doc, "div");
    var groups = [];
    QUESTIONS.forEach(function (question, index) {
      var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt }));
      var grid = element(doc, "div", { className: "esl-choice-grid" }); var buttons = [];
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; });
        button.value = choice[0]; buttons.push(button); grid.appendChild(button);
      });
      groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "esl-actions" });
    var reveal = element(doc, "button", { type: "button", className: "esl-primary", text: "提交预测并揭示", disabled: true });
    var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "esl-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "esl-controls" });
    var specs = [
      ["stock", "初始储量 S₀", 0, 3000, 50, "单位"],
      ["input", "输入 Fᵢₙ", 0, 200, 2, "单位/年"],
      ["k", "输出系数 k", 0.005, 0.15, 0.005, "/年"],
      ["horizon", "观察窗口", 1, 60, 1, "年"]
    ];
    var inputs = {};
    var outputs = {};
    specs.forEach(function (spec) {
      var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" });
      var wrap = element(doc, "div", { className: "esl-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] });
      input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output;
    });
    results.appendChild(controls);
    var layout = element(doc, "div", { className: "esl-layout" }); var stage = element(doc, "div", { className: "esl-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage);
    var side = element(doc, "div"); var metrics = element(doc, "div", { className: "esl-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "esl-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "esl-note", text: "闭合误差接近零只检验教学方程；它不证明真实地球储库是单一一阶系统。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() {
      groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); });
      reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length;
    }
    function renderResult() {
      var result = computeLedger(state.config); results.hidden = !state.revealed;
      outputs.stock.textContent = format(result.config.stock, 0); outputs.input.textContent = format(result.config.input, 1); outputs.k.textContent = format(result.config.k, 3) + " /年"; outputs.horizon.textContent = format(result.config.horizon, 0) + " 年";
      drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "稳态储量", format(result.steady, 1))); metrics.appendChild(metric(doc, "τ", format(result.tau, 1) + " 年")); metrics.appendChild(metric(doc, "窗口末储量", format(result.end, 1))); metrics.appendChild(metric(doc, "末时斜率", format(result.slopeEnd, 1) + " /年")); renderTable(doc, tableWrap, result);
    }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () {
      if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; }
      var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0);
      state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在调参并检查守恒账本。"; render(); announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () { state = { config: { stock: DEFAULTS.stock, input: DEFAULTS.input, k: DEFAULTS.k, horizon: DEFAULTS.horizon }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "储库实验已重置。"); });
    rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-esl-live": true, "aria-live": "polite" }));
    render();
  }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var result = computeLedger(DEFAULTS);
    check(near(result.steady, 1600), "steady state");
    check(near(result.tau, 20), "time constant");
    check(result.end > result.config.stock, "stock rises when input exceeds initial output");
    check(near(result.closure, 0, 1e-10), "integrated balance closes");
    check(computeLedger({ stock: 1200, input: 80, k: 0.025, horizon: 10 }).tau > result.tau, "smaller k has longer memory");
    check(JSON.stringify(computeLedger(DEFAULTS)) === JSON.stringify(computeLedger(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  return { computeLedger: computeLedger, mount: mount, selfTest: selfTest };
});
