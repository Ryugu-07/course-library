(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("earth-geohazards", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-geohazards self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-geohazards self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";
  var NAME = "earth-geohazards";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-" + NAME + "-styles";
  var DEFAULTS = Object.freeze({ probability: 0.1, intensity: 0.7, exposure: 0.6, vulnerability: 0.5, capacity: 0.2 });
  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }
  function finite(value, label) { var number = Number(value); if (!Number.isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function bounded(value, minimum, maximum, label) { var number = finite(value, label); if (number < minimum || number > maximum) throw new RangeError(label + " is outside its range"); return number; }
  function compute(input) {
    var source = input || {};
    var probability = bounded(source.probability === undefined ? DEFAULTS.probability : source.probability, 0, 1, "probability");
    var intensity = bounded(source.intensity === undefined ? DEFAULTS.intensity : source.intensity, 0, 1, "intensity");
    var exposure = bounded(source.exposure === undefined ? DEFAULTS.exposure : source.exposure, 0, 1, "exposure");
    var vulnerability = bounded(source.vulnerability === undefined ? DEFAULTS.vulnerability : source.vulnerability, 0, 1, "vulnerability");
    var capacity = bounded(source.capacity === undefined ? DEFAULTS.capacity : source.capacity, 0, 1, "capacity");
    var hazard = probability * intensity;
    var residualVulnerability = vulnerability * (1 - capacity);
    var risk = hazard * exposure * residualVulnerability;
    return { probability: probability, intensity: intensity, exposure: exposure, vulnerability: vulnerability, capacity: capacity, hazard: hazard, residualVulnerability: residualVulnerability, risk: risk };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "text") node.textContent = String(value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; node.setAttribute(key, String(value)); });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function format(value, digits) { if (!Number.isFinite(value)) return "—"; return value.toFixed(digits === undefined ? 3 : digits).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--egh-blue:#315f9d;--egh-green:#39734d;--egh-gold:#9b6a12;--egh-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:10px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input{font:inherit}[data-learning-lab="' + NAME + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] button:hover{border-color:var(--egh-blue)}[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .egh-primary{background:var(--egh-blue);border-color:var(--egh-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .egh-choices,[data-learning-lab="' + NAME + '"] .egh-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .egh-choices>* ,[data-learning-lab="' + NAME + '"] .egh-actions>*{flex:1 1 180px}[data-learning-lab="' + NAME + '"] .egh-feedback,[data-learning-lab="' + NAME + '"] .egh-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .egh-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .egh-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .egh-control span{font-size:12px;font-weight:700;color:var(--fg-soft,currentColor)}[data-learning-lab="' + NAME + '"] input[type="range"]{display:block;width:100%;min-height:44px;accent-color:var(--egh-blue)}' +
      '[data-learning-lab="' + NAME + '"] .egh-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .egh-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="' + NAME + '"] .egh-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .egh-metric{min-width:0;padding:8px;border-top:2px solid var(--egh-blue);background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] .egh-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .egh-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .egh-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + NAME + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;white-space:nowrap}@media(max-width:760px){[data-learning-lab="' + NAME + '"] .egh-controls{grid-template-columns:repeat(2,minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="' + NAME + '"] .egh-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:460px){[data-learning-lab="' + NAME + '"] .egh-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .egh-choices,[data-learning-lab="' + NAME + '"] .egh-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .egh-choices>* ,[data-learning-lab="' + NAME + '"] .egh-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function draw(doc, svg, result) {
    clear(svg); svg.setAttribute("viewBox", "0 0 800 360"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "hazard、exposure、vulnerability 与风险的分层图");
    svg.appendChild(svgElement(doc, "title", {}, "地质灾害风险三本账")); svg.appendChild(svgElement(doc, "desc", {}, "上方区分物理事件与社会条件，下方用柱高显示 hazard、exposure、残余 vulnerability 和教学风险指数。"));
    svg.appendChild(svgElement(doc, "text", { x: 18, y: 23, "font-size": 13 }, "物理层"));
    svg.appendChild(svgElement(doc, "text", { x: 312, y: 23, "font-size": 13 }, "社会层"));
    svg.appendChild(svgElement(doc, "text", { x: 604, y: 23, "font-size": 13 }, "结果层"));
    var boxes = [
      { x: 18, label: "hazard", value: "p × i = " + format(result.hazard, 3), color: "#b64335" },
      { x: 208, label: "exposure", value: "E = " + format(result.exposure, 2), color: "#9b6a12" },
      { x: 398, label: "vulnerability", value: "V(1−C) = " + format(result.residualVulnerability, 2), color: "#315f9d" },
      { x: 588, label: "risk toy", value: "R = " + format(result.risk, 4), color: "#39734d" }
    ];
    boxes.forEach(function (box, index) {
      svg.appendChild(svgElement(doc, "rect", { x: box.x, y: 42, width: 170, height: 64, rx: 5, fill: box.color, "fill-opacity": ".88" }));
      svg.appendChild(svgElement(doc, "text", { x: box.x + 85, y: 68, "text-anchor": "middle", "font-size": 13, fill: "#fff" }, box.label));
      svg.appendChild(svgElement(doc, "text", { x: box.x + 85, y: 89, "text-anchor": "middle", "font-size": 11, fill: "#fff" }, box.value));
      if (index < boxes.length - 1) svg.appendChild(svgElement(doc, "path", { d: "M" + (box.x + 174) + " 74 H" + (box.x + 184) + " M" + (box.x + 178) + " 68 L" + (box.x + 184) + " 74 L" + (box.x + 178) + " 80", fill: "none", stroke: "currentColor", "stroke-width": 2 }));
    });
    svg.appendChild(svgElement(doc, "text", { x: 18, y: 139, "font-size": 12 }, "每一栏都是独立变量；能力 C 不改变 hazard"));
    var items = [
      { label: "H", value: result.hazard, color: "#b64335" },
      { label: "E", value: result.exposure, color: "#9b6a12" },
      { label: "Vres", value: result.residualVulnerability, color: "#315f9d" },
      { label: "R", value: result.risk, color: "#39734d" }
    ];
    items.forEach(function (item, index) {
      var x = 72 + index * 178; var height = Math.max(3, 140 * item.value); var y = 304 - height;
      svg.appendChild(svgElement(doc, "rect", { x: x, y: y, width: 84, height: height, rx: 4, fill: item.color, "fill-opacity": ".82" }));
      svg.appendChild(svgElement(doc, "text", { x: x + 42, y: 326, "text-anchor": "middle", "font-size": 12 }, item.label));
      svg.appendChild(svgElement(doc, "text", { x: x + 42, y: Math.max(157, y - 7), "text-anchor": "middle", "font-size": 11 }, format(item.value, item.label === "R" ? 4 : 3)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: 50, y1: 304, x2: 762, y2: 304, stroke: "currentColor", "stroke-width": 1 }));
    svg.appendChild(svgElement(doc, "text", { x: 762, y: 349, "text-anchor": "end", "font-size": 11 }, "0–1 为教学归一化尺度"));
  }
  function table(doc, result) {
    var wrap = element(doc, "div", { className: "egh-table-wrap" }); var tableNode = element(doc, "table", { "aria-label": "地质灾害风险账本" });
    tableNode.appendChild(element(doc, "caption", { text: "hazard / exposure / vulnerability 账本" }));
    tableNode.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [element(doc, "th", { text: "层" }), element(doc, "th", { text: "当前值" }), element(doc, "th", { text: "是否被能力改变" })])));
    var body = element(doc, "tbody");
    [["hazard H", format(result.hazard, 4), "否"], ["exposure E", format(result.exposure, 3), "否（位置/人口条件）"], ["原始 V", format(result.vulnerability, 3), "是，进入残余项"], ["能力 C", format(result.capacity, 3), "作用于 V"], ["R toy", format(result.risk, 5), "H × E × Vres"]].forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    tableNode.appendChild(body); wrap.appendChild(tableNode); return wrap;
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { probability: DEFAULTS.probability, intensity: DEFAULTS.intensity, exposure: DEFAULTS.exposure, vulnerability: DEFAULTS.vulnerability, capacity: DEFAULTS.capacity, revealed: false, feedback: "" };
    var answers = { hazard: null, capacity: null }; var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "地质灾害风险：三本账分层" })); shell.appendChild(element(doc, "p", { className: "egh-note", text: "先区分 hazard、exposure、vulnerability，再观察能力如何改变残余风险。" }));
    var form = element(doc, "form", {}); var predictionBox = element(doc, "fieldset", {}); predictionBox.appendChild(element(doc, "legend", { text: "预测门" })); var groups = [];
    function addQuestion(key, prompt, choices) { predictionBox.appendChild(element(doc, "p", { text: prompt })); var row = element(doc, "div", { className: "egh-choices", role: "group", "aria-label": prompt }); choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.addEventListener("click", function () { answers[key] = choice[0]; groups.forEach(function (item) { item.button.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); }); }); groups.push({ key: key, value: choice[0], button: button }); row.appendChild(button); }); predictionBox.appendChild(row); }
    addQuestion("hazard", "E = 0 时，物理 hazard H 也必为 0 吗？", [["no", "不必"], ["yes", "必为 0"]]); addQuestion("capacity", "提升能力 C 主要直接改变？", [["vuln", "残余脆弱性"], ["hazard", "事件概率"]]); form.appendChild(predictionBox);
    var actions = element(doc, "div", { className: "egh-actions" }); actions.appendChild(element(doc, "button", { type: "submit", className: "egh-primary", text: "提交预测并展开" })); actions.appendChild(element(doc, "button", { type: "button", text: "重置" })); form.appendChild(actions); var feedback = element(doc, "p", { className: "egh-feedback", role: "status", "aria-live": "polite" }); form.appendChild(feedback); shell.appendChild(form);
    var controls = element(doc, "div", { className: "egh-controls", hidden: "hidden" });
    function addControl(label, min, max, step, value, field) { var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(value), "aria-label": label }); var output = element(doc, "output", { text: String(value) }); input.addEventListener("input", function () { state[field] = Number(input.value); output.textContent = input.value; render(); }); controls.appendChild(element(doc, "label", { className: "egh-control" }, [element(doc, "span", { text: label + " = " }), output, input])); return input; }
    var probabilityInput = addControl("事件概率 p", 0, 1, 0.01, DEFAULTS.probability, "probability"); var intensityInput = addControl("强度 i", 0, 1, 0.01, DEFAULTS.intensity, "intensity"); var exposureInput = addControl("暴露 E", 0, 1, 0.01, DEFAULTS.exposure, "exposure"); var vulnerabilityInput = addControl("脆弱性 V", 0, 1, 0.01, DEFAULTS.vulnerability, "vulnerability"); var capacityInput = addControl("能力 C", 0, 1, 0.01, DEFAULTS.capacity, "capacity"); shell.appendChild(controls);
    var revealed = element(doc, "section", { className: "egh-revealed", hidden: "hidden" }); var stage = element(doc, "div", { className: "egh-stage" }); var svg = doc.createElementNS(SVG_NS, "svg"); stage.appendChild(svg); revealed.appendChild(stage); var metrics = element(doc, "div", { className: "egh-metrics" }); revealed.appendChild(metrics); var ledger = element(doc, "div", {}); revealed.appendChild(ledger); shell.appendChild(revealed); rootNode.replaceChildren(shell);
    function metric(label, value) { return element(doc, "div", { className: "egh-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
    function render() { feedback.textContent = state.feedback; controls.querySelectorAll('input[type="range"]').forEach(function (input) { var output = input.parentNode.querySelector("output"); if (output) output.textContent = input.value; }); controls.hidden = !state.revealed; revealed.hidden = !state.revealed; if (!state.revealed) return; var result = compute(state); draw(doc, svg, result); clear(metrics); metrics.appendChild(metric("hazard H", format(result.hazard, 3))); metrics.appendChild(metric("exposure E", format(result.exposure, 2))); metrics.appendChild(metric("V residual", format(result.residualVulnerability, 2))); metrics.appendChild(metric("R toy", format(result.risk, 4))); clear(ledger); ledger.appendChild(table(doc, result)); }
    form.addEventListener("submit", function (event) { event.preventDefault(); if (answers.hazard === null || answers.capacity === null) { state.feedback = "请先完成两项分层预测。"; render(); return; } var score = (answers.hazard === "no" ? 1 : 0) + (answers.capacity === "vuln" ? 1 : 0); state.revealed = true; state.feedback = "已揭晓：" + score + " / 2 命中；现在可分别调节五本输入账。"; render(); if (api && typeof api.announce === "function") api.announce(rootNode, state.feedback); });
    actions.lastChild.addEventListener("click", function () { state = { probability: DEFAULTS.probability, intensity: DEFAULTS.intensity, exposure: DEFAULTS.exposure, vulnerability: DEFAULTS.vulnerability, capacity: DEFAULTS.capacity, revealed: false, feedback: "" }; answers = { hazard: null, capacity: null }; probabilityInput.value = String(DEFAULTS.probability); intensityInput.value = String(DEFAULTS.intensity); exposureInput.value = String(DEFAULTS.exposure); vulnerabilityInput.value = String(DEFAULTS.vulnerability); capacityInput.value = String(DEFAULTS.capacity); groups.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); }); render(); if (api && typeof api.announce === "function") api.announce(rootNode, "地质灾害风险实验已重置。"); });
    render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var result = compute(DEFAULTS);
    check(Math.abs(result.hazard - 0.07) < 1e-12, "hazard separates probability and intensity"); check(Math.abs(result.residualVulnerability - 0.4) < 1e-12, "capacity modifies residual vulnerability"); check(Math.abs(result.risk - 0.0168) < 1e-12, "risk ledger multiplies separated terms"); check(Math.abs(compute({ probability: 0.1, intensity: 0.7, exposure: 0, vulnerability: 0.5, capacity: 0.2 }).hazard - result.hazard) < 1e-12, "zero exposure does not erase hazard"); check(compute({ probability: 0.1, intensity: 0.7, exposure: 0.6, vulnerability: 0.5, capacity: 0.8 }).risk < result.risk, "more capacity reduces toy risk"); check(compute({ probability: 0.2, intensity: 0.7, exposure: 0.6, vulnerability: 0.5, capacity: 0.2 }).risk > result.risk, "larger hazard probability increases toy risk"); return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, compute: compute, mount: mount, selfTest: selfTest };
});
