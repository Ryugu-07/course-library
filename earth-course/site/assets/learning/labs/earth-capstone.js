(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("earth-capstone", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log("earth-capstone self-test: PASS (" + report.checks + " checks)"); }
    catch (error) { console.error("earth-capstone self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";
  var NAME = "earth-capstone";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-" + NAME + "-styles";
  var BASE_RAIN = [18, 30, 12, 55, 85, 22, 14, 48];
  var BASE_ET = [4, 4, 5, 5, 6, 5, 4, 5];
  var BASE_INFLOW = [5, 7, 4, 8, 9, 6, 4, 7];
  var DEFAULTS = Object.freeze({ rainScale: 1, runoffCoeff: 0.35, capacity: 220, assimilationWeight: 0.6, gaugeOffset: -12, initialStorage: 45 });
  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }
  function finite(value, label) { var number = Number(value); if (!Number.isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function bounded(value, minimum, maximum, label) { var number = finite(value, label); if (number < minimum || number > maximum) throw new RangeError(label + " is outside its range"); return number; }
  function compute(input) {
    var source = input || {};
    var rainScale = bounded(source.rainScale === undefined ? DEFAULTS.rainScale : source.rainScale, 0.4, 2, "rain scale");
    var runoffCoeff = bounded(source.runoffCoeff === undefined ? DEFAULTS.runoffCoeff : source.runoffCoeff, 0, 1, "runoff coefficient");
    var capacity = bounded(source.capacity === undefined ? DEFAULTS.capacity : source.capacity, 40, 400, "capacity");
    var assimilationWeight = bounded(source.assimilationWeight === undefined ? DEFAULTS.assimilationWeight : source.assimilationWeight, 0, 1, "assimilation weight");
    var gaugeOffset = bounded(source.gaugeOffset === undefined ? DEFAULTS.gaugeOffset : source.gaugeOffset, -80, 80, "gauge offset");
    var initialStorageValue = source.initialStorage === undefined ? Math.min(DEFAULTS.initialStorage, capacity) : source.initialStorage;
    var initialStorage = bounded(initialStorageValue, 0, capacity, "initial storage");
    var storage = initialStorage;
    var rows = [];
    var totalRain = 0;
    var totalEt = 0;
    var totalInflow = 0;
    var totalDirectRunoff = 0;
    var totalOverflow = 0;
    var maxOutflow = 0;
    var maxClosureError = 0;
    BASE_RAIN.forEach(function (baseRain, index) {
      var rain = baseRain * rainScale;
      var et = BASE_ET[index];
      var inflow = BASE_INFLOW[index];
      var infiltration = (1 - runoffCoeff) * rain;
      var directRunoff = runoffCoeff * rain;
      var available = storage + infiltration + inflow - et;
      var overflow = Math.max(0, available - capacity);
      var nextStorage = Math.min(capacity, available);
      var outflow = directRunoff + overflow;
      var closureError = storage + rain + inflow - et - outflow - nextStorage;
      rows.push({ step: index + 1, rain: rain, et: et, inflow: inflow, infiltration: infiltration, directRunoff: directRunoff, overflow: overflow, outflow: outflow, storageBefore: storage, storageAfter: nextStorage, closureError: closureError });
      totalRain += rain; totalEt += et; totalInflow += inflow; totalDirectRunoff += directRunoff; totalOverflow += overflow; maxOutflow = Math.max(maxOutflow, outflow); maxClosureError = Math.max(maxClosureError, Math.abs(closureError)); storage = nextStorage;
    });
    var forecastStorage = storage;
    var gauge = forecastStorage + gaugeOffset;
    var innovation = gauge - forecastStorage;
    var unconstrainedAssimilatedStorage = forecastStorage + assimilationWeight * innovation;
    var assimilatedStorage = Math.max(0, Math.min(capacity, unconstrainedAssimilatedStorage));
    var constraintAdjustment = assimilatedStorage - unconstrainedAssimilatedStorage;
    return { rainScale: rainScale, runoffCoeff: runoffCoeff, capacity: capacity, assimilationWeight: assimilationWeight, gaugeOffset: gaugeOffset, initialStorage: initialStorage, rows: rows, totalRain: totalRain, totalEt: totalEt, totalInflow: totalInflow, totalDirectRunoff: totalDirectRunoff, totalOverflow: totalOverflow, maxOutflow: maxOutflow, maxClosureError: maxClosureError, forecastStorage: forecastStorage, gauge: gauge, innovation: innovation, unconstrainedAssimilatedStorage: unconstrainedAssimilatedStorage, assimilatedStorage: assimilatedStorage, constraintAdjustment: constraintAdjustment, droughtIndex: Math.max(0, 1 - assimilatedStorage / capacity), floodIndex: totalOverflow / capacity };
  }
  function element(doc, tag, attrs, children) { var node = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "text") node.textContent = String(value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); }); (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function svgElement(doc, tag, attrs, children) { var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; node.setAttribute(key, String(value)); }); (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function format(value, digits) { if (!Number.isFinite(value)) return "—"; var text = value.toFixed(digits === undefined ? 2 : digits); return text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return; var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--ecp-blue:#315f9d;--ecp-green:#39734d;--ecp-gold:#9b6a12;--ecp-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:10px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input{font:inherit}[data-learning-lab="' + NAME + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] button:hover{border-color:var(--ecp-blue)}[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .ecp-primary{background:var(--ecp-blue);border-color:var(--ecp-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .ecp-choices,[data-learning-lab="' + NAME + '"] .ecp-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .ecp-choices>* ,[data-learning-lab="' + NAME + '"] .ecp-actions>*{flex:1 1 180px}[data-learning-lab="' + NAME + '"] .ecp-feedback,[data-learning-lab="' + NAME + '"] .ecp-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .ecp-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .ecp-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .ecp-control span{font-size:12px;font-weight:700;color:var(--fg-soft,currentColor)}[data-learning-lab="' + NAME + '"] input[type="range"]{display:block;width:100%;min-height:44px;accent-color:var(--ecp-blue)}' +
      '[data-learning-lab="' + NAME + '"] .ecp-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .ecp-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="' + NAME + '"] .ecp-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .ecp-metric{min-width:0;padding:8px;border-top:2px solid var(--ecp-blue);background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] .ecp-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .ecp-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .ecp-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + NAME + '"] table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;white-space:nowrap}@media(max-width:900px){[data-learning-lab="' + NAME + '"] .ecp-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){[data-learning-lab="' + NAME + '"] .ecp-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:460px){[data-learning-lab="' + NAME + '"] .ecp-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .ecp-choices,[data-learning-lab="' + NAME + '"] .ecp-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .ecp-choices>* ,[data-learning-lab="' + NAME + '"] .ecp-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function draw(doc, svg, result) {
    clear(svg); svg.setAttribute("viewBox", "0 0 860 430"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "流域数字孪生水量平衡和同化流程图");
    svg.appendChild(svgElement(doc, "title", {}, "流域数字孪生闭环")); svg.appendChild(svgElement(doc, "desc", {}, "上方为降水经过储量、出流和等效储量代理观测更新的流程，下方为八步储量与出流概览。"));
    svg.appendChild(svgElement(doc, "text", { x: 18, y: 23, "font-size": 13 }, "通量 → 储量 → 出流 → 量测更新"));
    var boxes = [{ x: 18, label: "P / ET / I", value: "输入通量", color: "#315f9d" }, { x: 190, label: "土壤储量", value: "S = " + format(result.forecastStorage, 0), color: "#39734d" }, { x: 362, label: "Q + 溢出", value: "峰值 " + format(result.maxOutflow, 1), color: "#b64335" }, { x: 534, label: "代理观测 y", value: format(result.gauge, 1), color: "#9b6a12" }, { x: 706, label: "约束更新 Sa", value: format(result.assimilatedStorage, 1), color: "#39734d" }];
    boxes.forEach(function (box, index) { svg.appendChild(svgElement(doc, "rect", { x: box.x, y: 42, width: 138, height: 60, rx: 5, fill: box.color, "fill-opacity": ".88" })); svg.appendChild(svgElement(doc, "text", { x: box.x + 69, y: 67, "text-anchor": "middle", "font-size": 12, fill: "#fff" }, box.label)); svg.appendChild(svgElement(doc, "text", { x: box.x + 69, y: 87, "text-anchor": "middle", "font-size": 11, fill: "#fff" }, box.value)); if (index < boxes.length - 1) svg.appendChild(svgElement(doc, "path", { d: "M" + (box.x + 142) + " 72 H" + (box.x + 158) + " M" + (box.x + 152) + " 66 L" + (box.x + 158) + " 72 L" + (box.x + 152) + " 78", fill: "none", stroke: "currentColor", "stroke-width": 2 })); });
    svg.appendChild(svgElement(doc, "text", { x: 18, y: 137, "font-size": 12 }, "八步过程：柱高为储量，金色为总出流，红色为容量溢出"));
    var maxStorage = Math.max(1, result.capacity); var maxOutflow = Math.max(1, result.maxOutflow); var baseY = 330; var chartLeft = 30; var chartWidth = 430; var step = chartWidth / result.rows.length;
    result.rows.forEach(function (row, index) { var x = chartLeft + index * step + 3; var storageHeight = 125 * row.storageAfter / maxStorage; var outflowHeight = 70 * row.outflow / maxOutflow; svg.appendChild(svgElement(doc, "rect", { x: x, y: baseY - storageHeight, width: Math.max(8, step - 8), height: storageHeight, rx: 3, fill: "#39734d", "fill-opacity": ".72" })); svg.appendChild(svgElement(doc, "rect", { x: x, y: baseY + 10, width: Math.max(8, step - 8), height: outflowHeight, rx: 3, fill: row.overflow > 0 ? "#b64335" : "#9b6a12", "fill-opacity": ".78" })); svg.appendChild(svgElement(doc, "text", { x: x + Math.max(8, step - 8) / 2, y: 350, "text-anchor": "middle", "font-size": 10 }, String(row.step))); });
    svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: baseY, x2: chartLeft + chartWidth, y2: baseY, stroke: "currentColor", "stroke-width": 1 })); svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: baseY + 80, x2: chartLeft + chartWidth, y2: baseY + 80, stroke: "currentColor", "stroke-width": 1 }));
    svg.appendChild(svgElement(doc, "text", { x: 490, y: 170, "font-size": 12 }, "证据账"));
    var evidence = [{ label: "闭合误差", value: format(result.maxClosureError, 5), color: "#39734d" }, { label: "创新 y−Sf", value: format(result.innovation, 1), color: "#9b6a12" }, { label: "同化权重 K", value: format(result.assimilationWeight, 2), color: "#315f9d" }, { label: "溢出指数", value: format(result.floodIndex, 3), color: "#b64335" }];
    evidence.forEach(function (item, index) { var y = 198 + index * 38; svg.appendChild(svgElement(doc, "rect", { x: 492, y: y - 15, width: 120, height: 25, rx: 4, fill: item.color, "fill-opacity": ".84" })); svg.appendChild(svgElement(doc, "text", { x: 552, y: y + 2, "text-anchor": "middle", "font-size": 11, fill: "#fff" }, item.label)); svg.appendChild(svgElement(doc, "text", { x: 630, y: y + 2, "font-size": 11 }, item.value)); });
    svg.appendChild(svgElement(doc, "text", { x: 490, y: 370, "font-size": 11 }, "绿色储量 / 金色出流 / 红色溢出")); svg.appendChild(svgElement(doc, "text", { x: 842, y: 410, "text-anchor": "end", "font-size": 11 }, "合成教学序列；非流域预报"));
  }
  function table(doc, result) { var wrap = element(doc, "div", { className: "ecp-table-wrap" }); var tableNode = element(doc, "table", { "aria-label": "流域数字孪生结果账本" }); tableNode.appendChild(element(doc, "caption", { text: "流域数字孪生结果账本" })); tableNode.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "当前值" }), element(doc, "th", { text: "来源 / 解释" })]))); var body = element(doc, "tbody"); [["总降水", format(result.totalRain, 1), "合成输入"], ["总蒸散", format(result.totalEt, 1), "合成输入"], ["总上游入流", format(result.totalInflow, 1), "合成输入"], ["总直接径流", format(result.totalDirectRunoff, 1), "c × ΣP"], ["总溢出", format(result.totalOverflow, 1), "容量约束"], ["预报末状态", format(result.forecastStorage, 1), "模型状态 Sf"], ["等效储量代理观测", format(result.gauge, 1), "已换算到状态单位的 y"], ["未约束同化状态", format(result.unconstrainedAssimilatedStorage, 1), "Sf + K(y−Sf)"], ["约束后同化状态", format(result.assimilatedStorage, 1), "限制到 [0, Cs]"], ["状态约束修正", format(result.constraintAdjustment, 1), "约束值 − 未约束值"], ["最大出流", format(result.maxOutflow, 1), "单步 Q"], ["最大闭合误差", format(result.maxClosureError, 8), "应接近 0"]].forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); tableNode.appendChild(body); wrap.appendChild(tableNode); return wrap; }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return; var doc = rootNode.ownerDocument; installStyles(doc); var state = { rainScale: DEFAULTS.rainScale, runoffCoeff: DEFAULTS.runoffCoeff, capacity: DEFAULTS.capacity, assimilationWeight: DEFAULTS.assimilationWeight, gaugeOffset: DEFAULTS.gaugeOffset, revealed: false, feedback: "" }; var answers = { runoff: null, gain: null }; var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "流域数字孪生：守恒、同化与风险出口" })); shell.appendChild(element(doc, "p", { className: "ecp-note", text: "先预测径流与同化方向，再打开五个可操作参数。" })); var form = element(doc, "form", {}); var predictionBox = element(doc, "fieldset", {}); predictionBox.appendChild(element(doc, "legend", { text: "预测门" })); var groups = [];
    function addQuestion(key, prompt, choices) { predictionBox.appendChild(element(doc, "p", { text: prompt })); var row = element(doc, "div", { className: "ecp-choices", role: "group", "aria-label": prompt }); choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.addEventListener("click", function () { answers[key] = choice[0]; groups.forEach(function (item) { item.button.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); }); }); groups.push({ key: key, value: choice[0], button: button }); row.appendChild(button); }); predictionBox.appendChild(row); }
    addQuestion("runoff", "径流系数 c 增大，入渗与直接径流怎样变？", [["split", "入渗少、径流多"], ["same", "都不变"]]); addQuestion("gain", "K 增大时，未约束同化状态更靠近？", [["gauge", "代理观测"], ["model", "模型预报"]]); form.appendChild(predictionBox); var actions = element(doc, "div", { className: "ecp-actions" }); actions.appendChild(element(doc, "button", { type: "submit", className: "ecp-primary", text: "提交预测并展开" })); actions.appendChild(element(doc, "button", { type: "button", text: "重置" })); form.appendChild(actions); var feedback = element(doc, "p", { className: "ecp-feedback", role: "status", "aria-live": "polite" }); form.appendChild(feedback); shell.appendChild(form);
    var controls = element(doc, "div", { className: "ecp-controls", hidden: "hidden" });
    function addControl(label, min, max, step, value, field) { var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(value), "aria-label": label }); var output = element(doc, "output", { text: String(value) }); input.addEventListener("input", function () { state[field] = Number(input.value); output.textContent = input.value; render(); }); controls.appendChild(element(doc, "label", { className: "ecp-control" }, [element(doc, "span", { text: label + " = " }), output, input])); return input; }
    var rainInput = addControl("降水尺度", 0.4, 2, 0.05, DEFAULTS.rainScale, "rainScale"); var runoffInput = addControl("径流系数 c", 0, 1, 0.05, DEFAULTS.runoffCoeff, "runoffCoeff"); var capacityInput = addControl("储量容量", 40, 400, 10, DEFAULTS.capacity, "capacity"); var weightInput = addControl("同化权重 K", 0, 1, 0.05, DEFAULTS.assimilationWeight, "assimilationWeight"); var gaugeInput = addControl("代理观测偏移", -80, 80, 2, DEFAULTS.gaugeOffset, "gaugeOffset"); shell.appendChild(controls);
    var revealed = element(doc, "section", { className: "ecp-revealed", hidden: "hidden" }); var stage = element(doc, "div", { className: "ecp-stage" }); var svg = doc.createElementNS(SVG_NS, "svg"); stage.appendChild(svg); revealed.appendChild(stage); var metrics = element(doc, "div", { className: "ecp-metrics" }); revealed.appendChild(metrics); var ledger = element(doc, "div", {}); revealed.appendChild(ledger); shell.appendChild(revealed); rootNode.replaceChildren(shell);
    function metric(label, value) { return element(doc, "div", { className: "ecp-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
    function render() { feedback.textContent = state.feedback; controls.querySelectorAll('input[type="range"]').forEach(function (input) { var output = input.parentNode.querySelector("output"); if (output) output.textContent = input.value; }); controls.hidden = !state.revealed; revealed.hidden = !state.revealed; if (!state.revealed) return; var result = compute(state); draw(doc, svg, result); clear(metrics); metrics.appendChild(metric("末状态 Sf", format(result.forecastStorage, 1))); metrics.appendChild(metric("代理观测 y", format(result.gauge, 1))); metrics.appendChild(metric("约束同化 Sa", format(result.assimilatedStorage, 1))); metrics.appendChild(metric("约束修正", format(result.constraintAdjustment, 1))); clear(ledger); ledger.appendChild(table(doc, result)); }
    form.addEventListener("submit", function (event) { event.preventDefault(); if (answers.runoff === null || answers.gain === null) { state.feedback = "请先完成两项流域闭环预测。"; render(); return; } var score = (answers.runoff === "split" ? 1 : 0) + (answers.gain === "gauge" ? 1 : 0); state.revealed = true; state.feedback = "已揭晓：" + score + " / 2 命中；现在可检查守恒与更新。"; render(); if (api && typeof api.announce === "function") api.announce(rootNode, state.feedback); });
    actions.lastChild.addEventListener("click", function () { state = { rainScale: DEFAULTS.rainScale, runoffCoeff: DEFAULTS.runoffCoeff, capacity: DEFAULTS.capacity, assimilationWeight: DEFAULTS.assimilationWeight, gaugeOffset: DEFAULTS.gaugeOffset, revealed: false, feedback: "" }; answers = { runoff: null, gain: null }; rainInput.value = String(DEFAULTS.rainScale); runoffInput.value = String(DEFAULTS.runoffCoeff); capacityInput.value = String(DEFAULTS.capacity); weightInput.value = String(DEFAULTS.assimilationWeight); gaugeInput.value = String(DEFAULTS.gaugeOffset); groups.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); }); render(); if (api && typeof api.announce === "function") api.announce(rootNode, "流域数字孪生实验已重置。"); });
    render();
  }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var result = compute(DEFAULTS);
    check(Math.abs(result.totalRain - 284) < 1e-12, "synthetic rainfall ledger is stable");
    check(Math.abs(result.totalEt - 38) < 1e-12, "evapotranspiration ledger is stable");
    check(Math.abs(result.totalInflow - 50) < 1e-12, "inflow ledger is stable");
    check(Math.abs(result.totalDirectRunoff - 99.4) < 1e-12, "direct runoff follows coefficient");
    check(Math.abs(result.totalOverflow - 21.6) < 1e-12, "capacity creates stated overflow");
    check(Math.abs(result.forecastStorage - 220) < 1e-12, "forecast reaches capacity");
    check(Math.abs(result.gauge - 208) < 1e-12, "proxy observation preserves its signed offset");
    check(Math.abs(result.assimilatedStorage - 212.8) < 1e-12, "assimilation uses gain and innovation");
    check(result.maxClosureError < 1e-10, "each water balance closes");
    check(compute({ rainScale: 1, runoffCoeff: 0.7, capacity: 220, assimilationWeight: 0.6, gaugeOffset: -12 }).totalDirectRunoff > result.totalDirectRunoff, "larger runoff coefficient increases direct runoff");
    check(compute({ rainScale: 1, runoffCoeff: 0.35, capacity: 220, assimilationWeight: 0, gaugeOffset: -12 }).assimilatedStorage === result.forecastStorage, "zero gain preserves forecast");
    check(compute({ rainScale: 1, runoffCoeff: 0.35, capacity: 220, assimilationWeight: 1, gaugeOffset: -12 }).assimilatedStorage === result.gauge, "unit gain reaches an in-range proxy observation");
    var lowCapacity = compute({ capacity: 40 });
    check(lowCapacity.initialStorage === 40 && lowCapacity.assimilatedStorage <= 40, "capacity slider remains valid below the nominal initial storage");
    var highObservation = compute({ gaugeOffset: 80 });
    check(highObservation.gauge === highObservation.forecastStorage + 80 && highObservation.innovation === 80, "proxy observation is not silently clipped");
    check(highObservation.unconstrainedAssimilatedStorage > highObservation.capacity && highObservation.assimilatedStorage === highObservation.capacity && highObservation.constraintAdjustment < 0, "state constraint is explicit and separate from the observation");
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, compute: compute, mount: mount, selfTest: selfTest };
});
