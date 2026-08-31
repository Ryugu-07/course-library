(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-forcing-aerosols", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-forcing-aerosols self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-forcing-aerosols self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "earth-forcing-aerosols";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { co2Ratio: 1.5, aerosolDirect: -0.4, rapidAdjustment: -0.6, solar: 0, surface: -0.1 };

  function clamp(value, low, high, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = fallback;
    return Math.min(high, Math.max(low, number));
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.01) return value.toExponential(2);
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function assert(condition, message) {
    if (!condition) throw new Error(NAME + " self-test failed: " + message);
  }

  function calculate(input) {
    var source = input || {};
    var co2Ratio = clamp(source.co2Ratio, 0.8, 2.5, DEFAULTS.co2Ratio);
    var aerosolDirect = clamp(source.aerosolDirect, -2, 0.5, DEFAULTS.aerosolDirect);
    var rapidAdjustment = clamp(source.rapidAdjustment, -2, 1, DEFAULTS.rapidAdjustment);
    var solar = clamp(source.solar, -1, 1, DEFAULTS.solar);
    var surface = clamp(source.surface, -1, 1, DEFAULTS.surface);
    var co2 = 5.35 * Math.log(co2Ratio);
    var direct = co2 + aerosolDirect + solar + surface;
    var erf = direct + rapidAdjustment;
    return {
      co2Ratio: co2Ratio,
      aerosolDirect: aerosolDirect,
      rapidAdjustment: rapidAdjustment,
      solar: solar,
      surface: surface,
      co2: co2,
      direct: direct,
      erf: erf,
      sign: erf > 0.005 ? "正驱动" : erf < -0.005 ? "负驱动" : "近零合计"
    };
  }

  function scorePrediction(answers) {
    var source = answers || {};
    return (source.log === "no" ? 1 : 0) +
      (source.aerosol === "fall" ? 1 : 0) +
      (source.boundary === "feedback" ? 1 : 0);
  }

  function el(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (key === "text") node.textContent = value;
      else if (key === "className") node.className = value;
      else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }

  function svgEl(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key])); });
    (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style"); style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--ef-blue:#315f9d;--ef-green:#39734d;--ef-gold:#a36a16;--ef-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0;font-size:1.16rem}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}[data-learning-lab="' + NAME + '"] button{flex:1 1 150px}[data-learning-lab="' + NAME + '"] button[aria-pressed=true],[data-learning-lab="' + NAME + '"] .ef-primary{background:var(--ef-blue);border-color:var(--ef-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .ef-choices,[data-learning-lab="' + NAME + '"] .ef-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .ef-feedback,[data-learning-lab="' + NAME + '"] .ef-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .ef-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}[data-learning-lab="' + NAME + '"] .ef-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .ef-control>span{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}[data-learning-lab="' + NAME + '"] output{color:var(--ef-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--ef-blue)}' +
      '[data-learning-lab="' + NAME + '"] .ef-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .ef-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .ef-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .ef-metric{min-width:0;padding:8px;border-top:2px solid var(--ef-blue)}[data-learning-lab="' + NAME + '"] .ef-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .ef-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .ef-table{max-width:100%;overflow-x:auto}[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor)}' +
      '@media(max-width:620px){[data-learning-lab="' + NAME + '"] .ef-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .ef-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .ef-choices,[data-learning-lab="' + NAME + '"] .ef-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    doc.head.appendChild(style);
  }

  function draw(doc, svg, result) {
    clear(svg); svg.setAttribute("viewBox", "0 0 720 300");
    svg.appendChild(svgEl(doc, "title", {}, "辐射强迫分解过程图"));
    svg.appendChild(svgEl(doc, "desc", {}, "二氧化碳、气溶胶、太阳和地表项进入直接账本，快速调整再得到教学 ERF；温度响应留在下一模型。"));
    var defs = svgEl(doc, "defs", {}); var marker = svgEl(doc, "marker", { id: "ef-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto" }); marker.appendChild(svgEl(doc, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "currentColor" })); defs.appendChild(marker); svg.appendChild(defs);
    var inputs = [
      { x: 18, label: "CO2", value: format(result.co2), fill: "var(--ef-red)" },
      { x: 18, label: "气溶胶", value: format(result.aerosolDirect), fill: "var(--ef-blue)" },
      { x: 18, label: "太阳", value: format(result.solar), fill: "var(--ef-gold)" },
      { x: 18, label: "地表", value: format(result.surface), fill: "var(--ef-green)" }
    ];
    inputs.forEach(function (item, index) { var y = 30 + index * 45; svg.appendChild(svgEl(doc, "rect", { x: item.x, y: y, width: 130, height: 30, rx: 5, fill: item.fill, "fill-opacity": ".86" })); svg.appendChild(svgEl(doc, "text", { x: 83, y: y + 19, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, item.label + " " + item.value)); svg.appendChild(svgEl(doc, "line", { x1: 150, y1: y + 15, x2: 238, y2: 105, stroke: item.fill, "stroke-width": "2", "marker-end": "url(#ef-arrow)" })); });
    svg.appendChild(svgEl(doc, "rect", { x: 242, y: 72, width: 185, height: 66, rx: 6, fill: "var(--ef-blue)", "fill-opacity": ".88" }));
    svg.appendChild(svgEl(doc, "text", { x: 334, y: 98, "text-anchor": "middle", "font-size": "14", fill: "#fff" }, "直接项"));
    svg.appendChild(svgEl(doc, "text", { x: 334, y: 122, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, format(result.direct) + " W/m²"));
    svg.appendChild(svgEl(doc, "line", { x1: 429, y1: 105, x2: 500, y2: 105, stroke: "var(--ef-gold)", "stroke-width": "3", "marker-end": "url(#ef-arrow)" }));
    svg.appendChild(svgEl(doc, "rect", { x: 504, y: 72, width: 194, height: 66, rx: 6, fill: result.erf >= 0 ? "var(--ef-red)" : "var(--ef-green)", "fill-opacity": ".88" }));
    svg.appendChild(svgEl(doc, "text", { x: 601, y: 98, "text-anchor": "middle", "font-size": "14", fill: "#fff" }, "教学 ERF"));
    svg.appendChild(svgEl(doc, "text", { x: 601, y: 122, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, format(result.erf) + " W/m²"));
    svg.appendChild(svgEl(doc, "text", { x: 18, y: 222, "font-size": "11" }, "快速调整：" + format(result.rapidAdjustment) + " W/m²"));
    svg.appendChild(svgEl(doc, "rect", { x: 18, y: 238, width: 680, height: 24, rx: 4, fill: result.erf >= 0 ? "var(--ef-red)" : "var(--ef-green)", "fill-opacity": ".82" }));
    svg.appendChild(svgEl(doc, "text", { x: 358, y: 255, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, result.sign + " · 温度响应未在本实验计算"));
  }

  function ledger(doc, result) {
    var wrap = el(doc, "div", { className: "ef-table" }); var table = el(doc, "table", { "aria-label": "辐射强迫结果账本" });
    table.appendChild(el(doc, "caption", { text: "直接项与快速调整账本" })); table.appendChild(el(doc, "thead", {}, [el(doc, "tr", {}, [el(doc, "th", { text: "驱动" }), el(doc, "th", { text: "数值" }), el(doc, "th", { text: "身份" })])]));
    var body = el(doc, "tbody");
    [["CO2", format(result.co2) + " W/m²", "浓度比的教学 RF"], ["直接气溶胶", format(result.aerosolDirect) + " W/m²", "直接项"], ["太阳 + 地表", format(result.solar + result.surface) + " W/m²", "外部/表面项"], ["快速调整", format(result.rapidAdjustment) + " W/m²", "ERF 教学项"], ["合计", format(result.erf) + " W/m²", "尚未转成温度"]].forEach(function (row) { body.appendChild(el(doc, "tr", {}, [el(doc, "th", { scope: "row", text: row[0] }), el(doc, "td", { text: row[1] }), el(doc, "td", { text: row[2] })])); });
    table.appendChild(body); wrap.appendChild(table); return wrap;
  }

  function addQuestion(doc, fieldset, key, prompt, choices, answers, groups) {
    fieldset.appendChild(el(doc, "p", { text: prompt })); var row = el(doc, "div", { className: "ef-choices", role: "group", "aria-label": prompt });
    choices.forEach(function (choice) { var button = el(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] }); button.addEventListener("click", function () { answers[key] = choice[0]; groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); }); }); groups.push({ key: key, value: choice[0], button: button }); row.appendChild(button); }); fieldset.appendChild(row);
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { co2Ratio: DEFAULTS.co2Ratio, aerosolDirect: DEFAULTS.aerosolDirect, rapidAdjustment: DEFAULTS.rapidAdjustment, solar: DEFAULTS.solar, surface: DEFAULTS.surface, revealed: false, feedback: "" };
    var answers = { log: null, aerosol: null, boundary: null }; var groups = [];
    var shell = el(doc, "div", {}); shell.appendChild(el(doc, "h3", { text: "辐射强迫：拆栏，不把温度响应提前" })); shell.appendChild(el(doc, "p", { className: "ef-note", text: "先预测对数项、气溶胶符号和 forcing/feedback 边界，再查看教学 ERF 账本。" }));
    var form = el(doc, "form", {}); var fieldset = el(doc, "fieldset", {}); fieldset.appendChild(el(doc, "legend", { text: "预测门" }));
    addQuestion(doc, fieldset, "log", "CO2 比值从 1.2 增到 1.8，强迫增量相同吗？", [["yes", "相同"], ["no", "不相同"]], answers, groups);
    addQuestion(doc, fieldset, "aerosol", "负气溶胶项增强，合计 ERF 会？", [["rise", "变大"], ["fall", "变小"]], answers, groups);
    addQuestion(doc, fieldset, "boundary", "温度升高后云再改变辐射，属于 forcing 还是 feedback？", [["forcing", "forcing"], ["feedback", "feedback"]], answers, groups);
    form.appendChild(fieldset); var actions = el(doc, "div", { className: "ef-actions" }); actions.appendChild(el(doc, "button", { type: "submit", className: "ef-primary", text: "提交预测并揭示" })); actions.appendChild(el(doc, "button", { type: "button", text: "重置", "data-reset": "true" })); form.appendChild(actions);
    var feedback = el(doc, "p", { className: "ef-feedback", role: "status", "aria-live": "polite" }); form.appendChild(feedback); shell.appendChild(form);
    var controls = el(doc, "div", { className: "ef-controls" });
    var co2 = el(doc, "input", { type: "range", min: "0.8", max: "2.5", step: "0.05", value: String(DEFAULTS.co2Ratio), "aria-label": "二氧化碳浓度比" }); var co2Out = el(doc, "output", { text: "1.50" });
    var aerosol = el(doc, "input", { type: "range", min: "-2", max: "0.5", step: "0.1", value: String(DEFAULTS.aerosolDirect), "aria-label": "直接气溶胶强迫" }); var aerosolOut = el(doc, "output", { text: "-0.40 W/m²" });
    var rapid = el(doc, "input", { type: "range", min: "-2", max: "1", step: "0.1", value: String(DEFAULTS.rapidAdjustment), "aria-label": "快速调整" }); var rapidOut = el(doc, "output", { text: "-0.60 W/m²" });
    var solar = el(doc, "input", { type: "range", min: "-1", max: "1", step: "0.1", value: String(DEFAULTS.solar), "aria-label": "太阳强迫" }); var solarOut = el(doc, "output", { text: "0.00 W/m²" });
    controls.appendChild(el(doc, "label", { className: "ef-control" }, [el(doc, "span", {}, ["CO2 浓度比 ", co2Out]), co2])); controls.appendChild(el(doc, "label", { className: "ef-control" }, [el(doc, "span", {}, ["直接气溶胶 ", aerosolOut]), aerosol])); controls.appendChild(el(doc, "label", { className: "ef-control" }, [el(doc, "span", {}, ["快速调整 ", rapidOut]), rapid])); controls.appendChild(el(doc, "label", { className: "ef-control" }, [el(doc, "span", {}, ["太阳项 ", solarOut]), solar])); shell.appendChild(controls);
    var revealed = el(doc, "section", { className: "ef-revealed", hidden: "hidden" }); var stage = el(doc, "div", { className: "ef-stage" }); var svg = doc.createElementNS(SVG_NS, "svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "辐射强迫分解图"); stage.appendChild(svg); revealed.appendChild(stage); var metrics = el(doc, "div", { className: "ef-metrics" }); revealed.appendChild(metrics); var tableHost = el(doc, "div", {}); revealed.appendChild(tableHost); revealed.appendChild(el(doc, "p", { className: "ef-note", text: "边界提醒：此实验的快速调整与直接项是概念分解；真实 RF/ERF 需保留定义、空间平均、时间窗和不确定度。" })); shell.appendChild(revealed); rootNode.replaceChildren(shell);
    function metric(label, value) { return el(doc, "div", { className: "ef-metric" }, [el(doc, "span", { text: label }), el(doc, "strong", { text: value })]); }
    function render() {
      var result = calculate(state); co2.value = String(state.co2Ratio); co2Out.textContent = format(state.co2Ratio, 2); aerosol.value = String(state.aerosolDirect); aerosolOut.textContent = format(state.aerosolDirect) + " W/m²"; rapid.value = String(state.rapidAdjustment); rapidOut.textContent = format(state.rapidAdjustment) + " W/m²"; solar.value = String(state.solar); solarOut.textContent = format(state.solar) + " W/m²";
      groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); }); feedback.textContent = state.feedback; revealed.hidden = !state.revealed; if (!state.revealed) return;
      draw(doc, svg, result); clear(metrics); metrics.appendChild(metric("CO2 项", format(result.co2) + " W/m²")); metrics.appendChild(metric("直接合计", format(result.direct) + " W/m²")); metrics.appendChild(metric("教学 ERF", format(result.erf) + " W/m²")); metrics.appendChild(metric("符号", result.sign)); clear(tableHost); tableHost.appendChild(ledger(doc, result));
    }
    function change(key, value) { state[key] = value; state.revealed = false; state.feedback = "参数已改变，请重新提交预测。"; render(); }
    co2.addEventListener("input", function () { change("co2Ratio", Number(co2.value)); }); aerosol.addEventListener("input", function () { change("aerosolDirect", Number(aerosol.value)); }); rapid.addEventListener("input", function () { change("rapidAdjustment", Number(rapid.value)); }); solar.addEventListener("input", function () { change("solar", Number(solar.value)); });
    form.addEventListener("submit", function (event) { event.preventDefault(); if (answers.log === null || answers.aerosol === null || answers.boundary === null) { state.feedback = "请先完成三项预测。"; render(); return; } var score = scorePrediction(answers); state.revealed = true; state.feedback = "已揭示：" + score + "/3 命中。现在改变一个项，观察它在直接栏还是调整栏。"; render(); announce(api, rootNode, state.feedback); });
    form.querySelector("[data-reset]").addEventListener("click", function () { state = { co2Ratio: DEFAULTS.co2Ratio, aerosolDirect: DEFAULTS.aerosolDirect, rapidAdjustment: DEFAULTS.rapidAdjustment, solar: DEFAULTS.solar, surface: DEFAULTS.surface, revealed: false, feedback: "" }; answers = { log: null, aerosol: null, boundary: null }; render(); announce(api, rootNode, "辐射强迫账本已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    check(calculate({ co2Ratio: 1 }).co2 === 0, "baseline CO2 ratio has zero forcing");
    check(calculate({ co2Ratio: 1.8 }).co2 > calculate({ co2Ratio: 1.2 }).co2, "log forcing rises with concentration ratio");
    check(calculate({ aerosolDirect: -1 }).erf < calculate({ aerosolDirect: -0.2 }).erf, "more negative aerosol lowers ERF");
    check(scorePrediction({ log: "no", aerosol: "fall", boundary: "feedback" }) === 3, "prediction gate scores a more negative aerosol forcing as a fall");
    check(near(calculate(DEFAULTS).erf, calculate(DEFAULTS).direct + DEFAULTS.rapidAdjustment), "rapid adjustment is a separate ledger line");
    check(JSON.stringify(calculate(DEFAULTS)) === JSON.stringify(calculate(DEFAULTS)), "deterministic forcing ledger");
    return { checks: checks };
  }

  function near(left, right) { return Math.abs(left - right) < 1e-10; }
  return { calculate: calculate, scorePrediction: scorePrediction, mount: mount, selfTest: selfTest };
});
