(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-feedback-sensitivity", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-feedback-sensitivity self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-feedback-sensitivity self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "earth-feedback-sensitivity";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { forcing: 3.7, planck: 3.2, waterVapor: 1.0, albedo: 0.3, cloud: 0.5, oceanTau: 25, years: 50 };

  function clamp(value, low, high, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = fallback;
    return Math.min(high, Math.max(low, number));
  }

  function integer(value, low, high, fallback) { return Math.round(clamp(value, low, high, fallback)); }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "不可用";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.01) return value.toExponential(2);
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function assert(condition, message) {
    if (!condition) throw new Error(NAME + " self-test failed: " + message);
  }

  function calculate(input) {
    var source = input || {};
    var forcing = clamp(source.forcing, 0, 8, DEFAULTS.forcing);
    var planck = clamp(source.planck, 1, 5, DEFAULTS.planck);
    var waterVapor = clamp(source.waterVapor, 0, 2, DEFAULTS.waterVapor);
    var albedo = clamp(source.albedo, 0, 1.5, DEFAULTS.albedo);
    var cloud = clamp(source.cloud, 0, 1.5, DEFAULTS.cloud);
    var oceanTau = clamp(source.oceanTau, 1, 200, DEFAULTS.oceanTau);
    var years = integer(source.years, 1, 200, DEFAULTS.years);
    var restoring = planck - waterVapor - albedo - cloud;
    var ipccParameter = -restoring;
    var stable = restoring > 0;
    var equilibrium = stable ? forcing / restoring : NaN;
    var fraction = stable ? 1 - Math.exp(-years / oceanTau) : NaN;
    var transient = stable ? equilibrium * fraction : NaN;
    var imbalance = stable ? forcing - restoring * transient : NaN;
    return {
      forcing: forcing,
      planck: planck,
      waterVapor: waterVapor,
      albedo: albedo,
      cloud: cloud,
      oceanTau: oceanTau,
      years: years,
      restoring: restoring,
      ipccParameter: ipccParameter,
      stable: stable,
      equilibrium: equilibrium,
      transient: transient,
      imbalance: imbalance,
      fraction: fraction
    };
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
    var styleId = "cl-" + NAME + "-styles"; if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style"); style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--es-blue:#315f9d;--es-green:#39734d;--es-gold:#a36a16;--es-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0;font-size:1.16rem}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}[data-learning-lab="' + NAME + '"] button{flex:1 1 150px}[data-learning-lab="' + NAME + '"] button[aria-pressed=true],[data-learning-lab="' + NAME + '"] .es-primary{background:var(--es-blue);border-color:var(--es-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .es-choices,[data-learning-lab="' + NAME + '"] .es-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .es-feedback,[data-learning-lab="' + NAME + '"] .es-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .es-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}[data-learning-lab="' + NAME + '"] .es-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .es-control>span{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}[data-learning-lab="' + NAME + '"] output{color:var(--es-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--es-blue)}' +
      '[data-learning-lab="' + NAME + '"] .es-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .es-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .es-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .es-metric{min-width:0;padding:8px;border-top:2px solid var(--es-blue)}[data-learning-lab="' + NAME + '"] .es-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .es-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .es-table{max-width:100%;overflow-x:auto}[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor)}' +
      '@media(max-width:620px){[data-learning-lab="' + NAME + '"] .es-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .es-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .es-choices,[data-learning-lab="' + NAME + '"] .es-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    doc.head.appendChild(style);
  }

  function draw(doc, svg, result) {
    clear(svg); svg.setAttribute("viewBox", "0 0 720 310");
    svg.appendChild(svgEl(doc, "title", {}, "反馈与海洋热摄取过程图"));
    svg.appendChild(svgEl(doc, "desc", {}, "强迫进入表面温度，水汽、反照率和云反馈改变恢复参数，海洋热摄取延迟到达平衡。"));
    var defs = svgEl(doc, "defs", {}); var marker = svgEl(doc, "marker", { id: "es-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto" }); marker.appendChild(svgEl(doc, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "currentColor" })); defs.appendChild(marker); svg.appendChild(defs);
    svg.appendChild(svgEl(doc, "rect", { x: 20, y: 36, width: 150, height: 55, rx: 6, fill: "var(--es-red)", "fill-opacity": ".87" }));
    svg.appendChild(svgEl(doc, "text", { x: 95, y: 59, "text-anchor": "middle", "font-size": "14", fill: "#fff" }, "强迫 F"));
    svg.appendChild(svgEl(doc, "text", { x: 95, y: 79, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, format(result.forcing) + " W/m²"));
    svg.appendChild(svgEl(doc, "line", { x1: 172, y1: 64, x2: 252, y2: 64, stroke: "var(--es-red)", "stroke-width": "3", "marker-end": "url(#es-arrow)" }));
    svg.appendChild(svgEl(doc, "rect", { x: 256, y: 36, width: 170, height: 55, rx: 6, fill: "var(--es-blue)", "fill-opacity": ".87" }));
    svg.appendChild(svgEl(doc, "text", { x: 341, y: 59, "text-anchor": "middle", "font-size": "14", fill: "#fff" }, "表面温度 ΔT"));
    svg.appendChild(svgEl(doc, "text", { x: 341, y: 79, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, format(result.transient) + " K · " + result.years + " yr"));
    svg.appendChild(svgEl(doc, "line", { x1: 341, y1: 94, x2: 341, y2: 132, stroke: "var(--es-blue)", "stroke-width": "2.5", "marker-end": "url(#es-arrow)" }));
    svg.appendChild(svgEl(doc, "rect", { x: 216, y: 136, width: 250, height: 65, rx: 6, fill: "var(--es-gold)", "fill-opacity": ".87" }));
    svg.appendChild(svgEl(doc, "text", { x: 341, y: 160, "text-anchor": "middle", "font-size": "13", fill: "#fff" }, "反馈放大项"));
    svg.appendChild(svgEl(doc, "text", { x: 341, y: 183, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, "WV " + format(result.waterVapor) + " · Alb " + format(result.albedo) + " · Cloud " + format(result.cloud)));
    svg.appendChild(svgEl(doc, "path", { d: "M 216 168 L 100 168 L 100 94", fill: "none", stroke: "var(--es-gold)", "stroke-width": "2.5", "marker-end": "url(#es-arrow)" }));
    svg.appendChild(svgEl(doc, "rect", { x: 500, y: 36, width: 198, height: 55, rx: 6, fill: "var(--es-green)", "fill-opacity": ".87" }));
    svg.appendChild(svgEl(doc, "text", { x: 599, y: 59, "text-anchor": "middle", "font-size": "14", fill: "#fff" }, "海洋热摄取 H"));
    svg.appendChild(svgEl(doc, "text", { x: 599, y: 79, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, format(result.imbalance) + " W/m²"));
    svg.appendChild(svgEl(doc, "line", { x1: 426, y1: 64, x2: 494, y2: 64, stroke: "var(--es-green)", "stroke-width": "2.5", "marker-end": "url(#es-arrow)" }));
    svg.appendChild(svgEl(doc, "text", { x: 20, y: 239, "font-size": "11" }, "正恢复 r = " + format(result.restoring) + " W/m²/K"));
    svg.appendChild(svgEl(doc, "text", { x: 20, y: 259, "font-size": "11" }, "IPCC 符号 λ = " + format(result.ipccParameter) + " W/m²/K"));
    svg.appendChild(svgEl(doc, "rect", { x: 20, y: 274, width: 678, height: 22, rx: 4, fill: result.stable ? "var(--es-green)" : "var(--es-red)", "fill-opacity": ".82" }));
    svg.appendChild(svgEl(doc, "text", { x: 359, y: 290, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, result.stable ? "有限线性平衡存在 · t/τ = " + format(result.years / result.oceanTau, 2) : "r ≤ 0 · 线性平衡不可用"));
  }

  function ledger(doc, result) {
    var wrap = el(doc, "div", { className: "es-table" }); var table = el(doc, "table", { "aria-label": "反馈与敏感度结果账本" });
    table.appendChild(el(doc, "caption", { text: "反馈、敏感度与时滞账本" })); table.appendChild(el(doc, "thead", {}, [el(doc, "tr", {}, [el(doc, "th", { text: "量" }), el(doc, "th", { text: "当前值" }), el(doc, "th", { text: "定义" })])]));
    var body = el(doc, "tbody");
    [["正恢复 r", format(result.restoring) + " W/m²/K", "P - WV - Alb - Cloud"], ["IPCC λ", format(result.ipccParameter) + " W/m²/K", "λ = -r 的本页约定"], ["平衡响应", format(result.equilibrium) + " K", "F/r，线性代理"], ["瞬态响应", format(result.transient) + " K", "t = " + result.years + " yr"], ["能量不平衡 H", format(result.imbalance) + " W/m²", "F - rΔT"]].forEach(function (row) { body.appendChild(el(doc, "tr", {}, [el(doc, "th", { scope: "row", text: row[0] }), el(doc, "td", { text: row[1] }), el(doc, "td", { text: row[2] })])); });
    table.appendChild(body); wrap.appendChild(table); return wrap;
  }

  function addQuestion(doc, fieldset, key, prompt, choices, answers, groups) {
    fieldset.appendChild(el(doc, "p", { text: prompt })); var row = el(doc, "div", { className: "es-choices", role: "group", "aria-label": prompt });
    choices.forEach(function (choice) { var button = el(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] }); button.addEventListener("click", function () { answers[key] = choice[0]; groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); }); }); groups.push({ key: key, value: choice[0], button: button }); row.appendChild(button); }); fieldset.appendChild(row);
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { forcing: DEFAULTS.forcing, planck: DEFAULTS.planck, waterVapor: DEFAULTS.waterVapor, albedo: DEFAULTS.albedo, cloud: DEFAULTS.cloud, oceanTau: DEFAULTS.oceanTau, years: DEFAULTS.years, revealed: false, feedback: "" };
    var answers = { cloud: null, tau: null, stable: null }; var groups = [];
    var shell = el(doc, "div", {}); shell.appendChild(el(doc, "h3", { text: "反馈与敏感度：先看符号，再看时间" })); shell.appendChild(el(doc, "p", { className: "es-note", text: "正恢复参数 r 与 IPCC 风格 λ 分开显示；先预测反馈和海洋时滞的方向。" }));
    var form = el(doc, "form", {}); var fieldset = el(doc, "fieldset", {}); fieldset.appendChild(el(doc, "legend", { text: "预测门" }));
    addQuestion(doc, fieldset, "cloud", "云放大项增加，固定强迫下平衡响应会？", [["rise", "变大"], ["fall", "变小"]], answers, groups);
    addQuestion(doc, fieldset, "tau", "海洋时间常数增加，固定时间的瞬态温度会？", [["rise", "变大"], ["fall", "变小"]], answers, groups);
    addQuestion(doc, fieldset, "stable", "若正恢复参数 r ≤ 0，线性模型有稳定有限平衡吗？", [["yes", "有"], ["no", "没有"]], answers, groups);
    form.appendChild(fieldset); var actions = el(doc, "div", { className: "es-actions" }); actions.appendChild(el(doc, "button", { type: "submit", className: "es-primary", text: "提交预测并揭示" })); actions.appendChild(el(doc, "button", { type: "button", text: "重置", "data-reset": "true" })); form.appendChild(actions);
    var feedback = el(doc, "p", { className: "es-feedback", role: "status", "aria-live": "polite" }); form.appendChild(feedback); shell.appendChild(form);
    var controls = el(doc, "div", { className: "es-controls" });
    var forcing = el(doc, "input", { type: "range", min: "0", max: "8", step: "0.1", value: String(DEFAULTS.forcing), "aria-label": "辐射强迫" }); var forcingOut = el(doc, "output", { text: "3.70 W/m²" });
    var cloud = el(doc, "input", { type: "range", min: "0", max: "1.5", step: "0.1", value: String(DEFAULTS.cloud), "aria-label": "云反馈放大项" }); var cloudOut = el(doc, "output", { text: "0.50 W/m²/K" });
    var tau = el(doc, "input", { type: "range", min: "1", max: "200", step: "1", value: String(DEFAULTS.oceanTau), "aria-label": "海洋时间常数" }); var tauOut = el(doc, "output", { text: "25 yr" });
    var years = el(doc, "input", { type: "range", min: "1", max: "200", step: "1", value: String(DEFAULTS.years), "aria-label": "观测时间跨度" }); var yearsOut = el(doc, "output", { text: "50 yr" });
    controls.appendChild(el(doc, "label", { className: "es-control" }, [el(doc, "span", {}, ["强迫 F ", forcingOut]), forcing])); controls.appendChild(el(doc, "label", { className: "es-control" }, [el(doc, "span", {}, ["云放大项 ", cloudOut]), cloud])); controls.appendChild(el(doc, "label", { className: "es-control" }, [el(doc, "span", {}, ["海洋时间常数 ", tauOut]), tau])); controls.appendChild(el(doc, "label", { className: "es-control" }, [el(doc, "span", {}, ["时间跨度 ", yearsOut]), years])); shell.appendChild(controls);
    var revealed = el(doc, "section", { className: "es-revealed", hidden: "hidden" }); var stage = el(doc, "div", { className: "es-stage" }); var svg = doc.createElementNS(SVG_NS, "svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "反馈回路与海洋热摄取图"); stage.appendChild(svg); revealed.appendChild(stage); var metrics = el(doc, "div", { className: "es-metrics" }); revealed.appendChild(metrics); var tableHost = el(doc, "div", {}); revealed.appendChild(tableHost); revealed.appendChild(el(doc, "p", { className: "es-note", text: "边界提醒：固定反馈的一箱模型不能代替完整 ECS/TCR 实验；云、冰盖、碳循环和深海常有状态依赖。" })); shell.appendChild(revealed); rootNode.replaceChildren(shell);
    function metric(label, value) { return el(doc, "div", { className: "es-metric" }, [el(doc, "span", { text: label }), el(doc, "strong", { text: value })]); }
    function render() {
      var result = calculate(state); forcing.value = String(state.forcing); forcingOut.textContent = format(state.forcing) + " W/m²"; cloud.value = String(state.cloud); cloudOut.textContent = format(state.cloud) + " W/m²/K"; tau.value = String(state.oceanTau); tauOut.textContent = format(state.oceanTau, 0) + " yr"; years.value = String(state.years); yearsOut.textContent = format(state.years, 0) + " yr";
      groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); }); feedback.textContent = state.feedback; revealed.hidden = !state.revealed; if (!state.revealed) return;
      draw(doc, svg, result); clear(metrics); metrics.appendChild(metric("正恢复 r", format(result.restoring))); metrics.appendChild(metric("IPCC λ", format(result.ipccParameter))); metrics.appendChild(metric("平衡响应", format(result.equilibrium) + " K")); metrics.appendChild(metric("瞬态响应", format(result.transient) + " K")); clear(tableHost); tableHost.appendChild(ledger(doc, result));
    }
    function change(key, value) { state[key] = value; state.revealed = false; state.feedback = "参数已改变，请重新提交预测。"; render(); }
    forcing.addEventListener("input", function () { change("forcing", Number(forcing.value)); }); cloud.addEventListener("input", function () { change("cloud", Number(cloud.value)); }); tau.addEventListener("input", function () { change("oceanTau", Number(tau.value)); }); years.addEventListener("input", function () { change("years", Number(years.value)); });
    form.addEventListener("submit", function (event) { event.preventDefault(); if (answers.cloud === null || answers.tau === null || answers.stable === null) { state.feedback = "请先完成三项预测。"; render(); return; } var result = calculate(state); var score = (answers.cloud === "rise" ? 1 : 0) + (answers.tau === "fall" ? 1 : 0) + ((!result.stable && answers.stable === "no") || (result.stable && answers.stable === "yes") ? 1 : 0); state.revealed = true; state.feedback = "已揭示：" + score + "/3 命中。比较 r 与 λ 的符号，再改变海洋时间常数。"; render(); announce(api, rootNode, state.feedback); });
    form.querySelector("[data-reset]").addEventListener("click", function () { state = { forcing: DEFAULTS.forcing, planck: DEFAULTS.planck, waterVapor: DEFAULTS.waterVapor, albedo: DEFAULTS.albedo, cloud: DEFAULTS.cloud, oceanTau: DEFAULTS.oceanTau, years: DEFAULTS.years, revealed: false, feedback: "" }; answers = { cloud: null, tau: null, stable: null }; render(); announce(api, rootNode, "反馈敏感度账本已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var base = calculate(DEFAULTS);
    check(near(base.restoring, 1.4), "default restoring parameter");
    check(near(base.ipccParameter, -base.restoring), "IPCC sign convention is explicit");
    check(calculate({ cloud: 1.2 }).equilibrium > base.equilibrium, "stronger cloud amplification raises equilibrium response");
    check(calculate({ oceanTau: 100 }).transient < base.transient, "larger ocean time constant slows transient response");
    check(!calculate({ cloud: 1.5, planck: 1, waterVapor: 1, albedo: 0.5 }).stable, "non-positive restoring parameter is flagged");
    check(JSON.stringify(calculate(DEFAULTS)) === JSON.stringify(calculate(DEFAULTS)), "deterministic sensitivity ledger");
    return { checks: checks };
  }

  function near(left, right) { return Math.abs(left - right) < 1e-10; }
  return { calculate: calculate, mount: mount, selfTest: selfTest };
});
