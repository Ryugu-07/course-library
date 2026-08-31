(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-climate-models", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-climate-models self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-climate-models self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "earth-climate-models";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { level: "ebm", resolutionKm: 100, ensemble: 12, parameterization: "medium" };
  var LEVELS = {
    ebm: { label: "能量平衡", processes: "全球/纬向平均能量", unresolved: "云、对流、局地地形", baseCost: 1 },
    gcm: { label: "全球环流", processes: "三维大气与海洋动力", unresolved: "云、对流、次网格湍流", baseCost: 90 },
    esm: { label: "地球系统", processes: "环流 + 碳循环与生态", unresolved: "云、生态参数与小尺度过程", baseCost: 220 }
  };
  var PARAMS = { simple: { label: "简化", factor: 0.85 }, medium: { label: "中等", factor: 1 }, rich: { label: "丰富", factor: 1.25 } };

  function clamp(value, low, high, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = fallback;
    return Math.min(high, Math.max(low, number));
  }

  function integer(value, low, high, fallback) { return Math.round(clamp(value, low, high, fallback)); }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.01 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }

  function calculate(input) {
    var source = input || {};
    var level = LEVELS[source.level] ? source.level : DEFAULTS.level;
    var resolutionKm = clamp(source.resolutionKm, 25, 250, DEFAULTS.resolutionKm);
    var ensemble = integer(source.ensemble, 1, 40, DEFAULTS.ensemble);
    var parameterization = PARAMS[source.parameterization] ? source.parameterization : DEFAULTS.parameterization;
    var gridDimension = level === "ebm" ? 1 : 3;
    var gridProxy = Math.pow(100 / resolutionKm, gridDimension);
    var costProxy = LEVELS[level].baseCost * gridProxy * (1 + 0.03 * (ensemble - 1)) * PARAMS[parameterization].factor;
    var resolutionSpread = 0.25 + 0.55 * (resolutionKm / 250);
    var structuralSpread = level === "ebm" ? 0.35 : level === "gcm" ? 0.22 : 0.18;
    var parameterSpread = parameterization === "rich" ? 0.12 : parameterization === "simple" ? 0.25 : 0.18;
    var spreadProxy = resolutionSpread + structuralSpread + parameterSpread;
    return {
      level: level,
      label: LEVELS[level].label,
      processes: LEVELS[level].processes,
      unresolved: LEVELS[level].unresolved,
      resolutionKm: resolutionKm,
      ensemble: ensemble,
      parameterization: parameterization,
      parameterizationLabel: PARAMS[parameterization].label,
      gridDimension: gridDimension,
      gridProxy: gridProxy,
      costProxy: costProxy,
      spreadProxy: spreadProxy,
      structuralSpread: structuralSpread,
      resolutionSpread: resolutionSpread,
      parameterSpread: parameterSpread
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
      '[data-learning-lab="' + NAME + '"]{--em-blue:#315f9d;--em-green:#39734d;--em-gold:#a36a16;--em-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0;font-size:1.16rem}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}[data-learning-lab="' + NAME + '"] button{flex:1 1 150px}[data-learning-lab="' + NAME + '"] button[aria-pressed=true],[data-learning-lab="' + NAME + '"] .em-primary{background:var(--em-blue);border-color:var(--em-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .em-choices,[data-learning-lab="' + NAME + '"] .em-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .em-feedback,[data-learning-lab="' + NAME + '"] .em-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .em-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}[data-learning-lab="' + NAME + '"] .em-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .em-control>span{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}[data-learning-lab="' + NAME + '"] output{color:var(--em-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--em-blue)}' +
      '[data-learning-lab="' + NAME + '"] .em-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .em-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .em-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .em-metric{min-width:0;padding:8px;border-top:2px solid var(--em-blue)}[data-learning-lab="' + NAME + '"] .em-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .em-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .em-table{max-width:100%;overflow-x:auto}[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor)}' +
      '@media(max-width:620px){[data-learning-lab="' + NAME + '"] .em-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .em-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .em-choices,[data-learning-lab="' + NAME + '"] .em-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    doc.head.appendChild(style);
  }

  function draw(doc, svg, result) {
    clear(svg); svg.setAttribute("viewBox", "0 0 720 310");
    svg.appendChild(svgEl(doc, "title", {}, "气候模型层级与计算代价图"));
    svg.appendChild(svgEl(doc, "desc", {}, "网格尺度进入模型层级，模型再产生集合范围；代价与未解析过程分别列出。"));
    var defs = svgEl(doc, "defs", {}); var marker = svgEl(doc, "marker", { id: "em-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto" }); marker.appendChild(svgEl(doc, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "currentColor" })); defs.appendChild(marker); svg.appendChild(defs);
    var levels = ["ebm", "gcm", "esm"];
    levels.forEach(function (key, index) {
      var x = 18 + index * 162; var active = key === result.level;
      svg.appendChild(svgEl(doc, "rect", { x: x, y: 36, width: 142, height: 74, rx: 6, fill: active ? "var(--em-blue)" : "var(--border,#cbd5e1)", "fill-opacity": active ? ".9" : ".7", stroke: active ? "var(--em-blue)" : "currentColor", "stroke-width": active ? "2" : "1" }));
      svg.appendChild(svgEl(doc, "text", { x: x + 71, y: 62, "text-anchor": "middle", "font-size": "13", fill: active ? "#fff" : "currentColor" }, LEVELS[key].label));
      svg.appendChild(svgEl(doc, "text", { x: x + 71, y: 84, "text-anchor": "middle", "font-size": "10", fill: active ? "#fff" : "currentColor" }, key === "ebm" ? "平均能量" : key === "gcm" ? "3D 环流" : "碳生态耦合"));
      if (index < 2) svg.appendChild(svgEl(doc, "line", { x1: x + 144, y1: 73, x2: x + 158, y2: 73, stroke: "var(--em-blue)", "stroke-width": "2", "marker-end": "url(#em-arrow)" }));
    });
    svg.appendChild(svgEl(doc, "text", { x: 18, y: 136, "font-size": "11" }, "当前：" + result.label + " · " + result.processes));
    svg.appendChild(svgEl(doc, "text", { x: 18, y: 158, "font-size": "11" }, "网格 " + format(result.resolutionKm, 0) + " km · 单元代理 " + format(result.gridProxy, 2)));
    svg.appendChild(svgEl(doc, "rect", { x: 18, y: 180, width: 250, height: 24, rx: 4, fill: "var(--em-gold)", "fill-opacity": ".82" }));
    svg.appendChild(svgEl(doc, "text", { x: 143, y: 197, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, "计算代价 " + format(result.costProxy)));
    svg.appendChild(svgEl(doc, "line", { x1: 280, y1: 192, x2: 354, y2: 192, stroke: "var(--em-blue)", "stroke-width": "2.5", "marker-end": "url(#em-arrow)" }));
    svg.appendChild(svgEl(doc, "rect", { x: 360, y: 170, width: 164, height: 66, rx: 6, fill: "var(--em-green)", "fill-opacity": ".86" }));
    svg.appendChild(svgEl(doc, "text", { x: 442, y: 195, "text-anchor": "middle", "font-size": "13", fill: "#fff" }, "集合 " + result.ensemble + " 成员"));
    svg.appendChild(svgEl(doc, "text", { x: 442, y: 217, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, "范围 " + format(result.spreadProxy)));
    svg.appendChild(svgEl(doc, "line", { x1: 532, y1: 203, x2: 598, y2: 203, stroke: "var(--em-red)", "stroke-width": "2.5", "marker-end": "url(#em-arrow)" }));
    svg.appendChild(svgEl(doc, "rect", { x: 604, y: 170, width: 94, height: 66, rx: 6, fill: "var(--em-red)", "fill-opacity": ".82" }));
    svg.appendChild(svgEl(doc, "text", { x: 651, y: 194, "text-anchor": "middle", "font-size": "12", fill: "#fff" }, "未解析"));
    svg.appendChild(svgEl(doc, "text", { x: 651, y: 214, "text-anchor": "middle", "font-size": "10", fill: "#fff" }, "仍需参数化"));
    svg.appendChild(svgEl(doc, "text", { x: 18, y: 270, "font-size": "11" }, "分辨率不等于准确度 · 集合范围不等于观测误差"));
    svg.appendChild(svgEl(doc, "text", { x: 18, y: 290, "font-size": "11" }, "未解析：" + result.unresolved));
  }

  function ledger(doc, result) {
    var wrap = el(doc, "div", { className: "em-table" }); var table = el(doc, "table", { "aria-label": "气候模型层级结果账本" });
    table.appendChild(el(doc, "caption", { text: "模型层级与不确定度账本" })); table.appendChild(el(doc, "thead", {}, [el(doc, "tr", {}, [el(doc, "th", { text: "量" }), el(doc, "th", { text: "当前值" }), el(doc, "th", { text: "读法" })])]));
    var body = el(doc, "tbody");
    [["模型层级", result.label, result.processes], ["空间尺度", format(result.resolutionKm, 0) + " km", result.gridDimension === 1 ? "纬向带一维代理" : "三维网格代理"], ["计算代价", format(result.costProxy), "归一化代理"], ["范围代理", format(result.spreadProxy), "结构 + 分辨率 + 参数"], ["参数化", result.parameterizationLabel, "未解析过程的子模型"], ["集合成员", String(result.ensemble), "条件范围，不是全部不确定度"]].forEach(function (row) { body.appendChild(el(doc, "tr", {}, [el(doc, "th", { scope: "row", text: row[0] }), el(doc, "td", { text: row[1] }), el(doc, "td", { text: row[2] })])); });
    table.appendChild(body); wrap.appendChild(table); return wrap;
  }

  function addQuestion(doc, fieldset, key, prompt, choices, answers, groups) {
    fieldset.appendChild(el(doc, "p", { text: prompt })); var row = el(doc, "div", { className: "em-choices", role: "group", "aria-label": prompt });
    choices.forEach(function (choice) { var button = el(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] }); button.addEventListener("click", function () { answers[key] = choice[0]; groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); }); }); groups.push({ key: key, value: choice[0], button: button }); row.appendChild(button); }); fieldset.appendChild(row);
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { level: DEFAULTS.level, resolutionKm: DEFAULTS.resolutionKm, ensemble: DEFAULTS.ensemble, parameterization: DEFAULTS.parameterization, revealed: false, feedback: "" };
    var answers = { cost: null, subgrid: null, ensemble: null }; var groups = [];
    var shell = el(doc, "div", {}); shell.appendChild(el(doc, "h3", { text: "气候模型梯子：过程、网格与集合" })); shell.appendChild(el(doc, "p", { className: "em-note", text: "先预测分辨率代价、参数化边界和集合含义，再选择模型层级。" }));
    var form = el(doc, "form", {}); var fieldset = el(doc, "fieldset", {}); fieldset.appendChild(el(doc, "legend", { text: "预测门" }));
    addQuestion(doc, fieldset, "cost", "三维网格变细一半，单元数量代理大约增加？", [["two", "两倍"], ["eight", "八倍"], ["same", "不变"]], answers, groups);
    addQuestion(doc, fieldset, "subgrid", "更细网格会自动消除云和对流参数化吗？", [["yes", "会"], ["no", "不会"]], answers, groups);
    addQuestion(doc, fieldset, "ensemble", "同一模型的集合 spread 等于全部观测误差吗？", [["yes", "等于"], ["no", "不等于"]], answers, groups);
    form.appendChild(fieldset); var actions = el(doc, "div", { className: "em-actions" }); actions.appendChild(el(doc, "button", { type: "submit", className: "em-primary", text: "提交预测并揭示" })); actions.appendChild(el(doc, "button", { type: "button", text: "重置", "data-reset": "true" })); form.appendChild(actions);
    var feedback = el(doc, "p", { className: "em-feedback", role: "status", "aria-live": "polite" }); form.appendChild(feedback); shell.appendChild(form);
    var controls = el(doc, "div", { className: "em-controls" });
    var level = el(doc, "select", { "aria-label": "模型层级" }); Object.keys(LEVELS).forEach(function (key) { level.appendChild(el(doc, "option", { value: key, text: LEVELS[key].label })); });
    var resolution = el(doc, "input", { type: "range", min: "25", max: "250", step: "25", value: String(DEFAULTS.resolutionKm), "aria-label": "网格尺度公里" }); var resolutionOut = el(doc, "output", { text: "100 km" });
    var ensemble = el(doc, "input", { type: "range", min: "1", max: "40", step: "1", value: String(DEFAULTS.ensemble), "aria-label": "集合成员数量" }); var ensembleOut = el(doc, "output", { text: "12" });
    var parameterization = el(doc, "select", { "aria-label": "参数化复杂度" }); Object.keys(PARAMS).forEach(function (key) { parameterization.appendChild(el(doc, "option", { value: key, text: PARAMS[key].label })); });
    controls.appendChild(el(doc, "label", { className: "em-control" }, [el(doc, "span", { text: "模型层级" }), level])); controls.appendChild(el(doc, "label", { className: "em-control" }, [el(doc, "span", {}, ["网格尺度 ", resolutionOut]), resolution])); controls.appendChild(el(doc, "label", { className: "em-control" }, [el(doc, "span", {}, ["集合成员 ", ensembleOut]), ensemble])); controls.appendChild(el(doc, "label", { className: "em-control" }, [el(doc, "span", { text: "参数化复杂度" }), parameterization])); shell.appendChild(controls);
    var revealed = el(doc, "section", { className: "em-revealed", hidden: "hidden" }); var stage = el(doc, "div", { className: "em-stage" }); var svg = doc.createElementNS(SVG_NS, "svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "能量平衡、全球环流和地球系统模型梯子图"); stage.appendChild(svg); revealed.appendChild(stage); var metrics = el(doc, "div", { className: "em-metrics" }); revealed.appendChild(metrics); var tableHost = el(doc, "div", {}); revealed.appendChild(tableHost); revealed.appendChild(el(doc, "p", { className: "em-note", text: "边界提醒：模式层级、分辨率、参数化、初值、边界条件和情景分别贡献不确定度。" })); shell.appendChild(revealed); rootNode.replaceChildren(shell);
    function metric(label, value) { return el(doc, "div", { className: "em-metric" }, [el(doc, "span", { text: label }), el(doc, "strong", { text: value })]); }
    function render() {
      var result = calculate(state); level.value = state.level; resolution.value = String(state.resolutionKm); resolutionOut.textContent = format(state.resolutionKm, 0) + " km"; ensemble.value = String(state.ensemble); ensembleOut.textContent = String(state.ensemble); parameterization.value = state.parameterization;
      groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); }); feedback.textContent = state.feedback; revealed.hidden = !state.revealed; if (!state.revealed) return;
      draw(doc, svg, result); clear(metrics); metrics.appendChild(metric("层级", result.label)); metrics.appendChild(metric("代价代理", format(result.costProxy))); metrics.appendChild(metric("范围代理", format(result.spreadProxy))); metrics.appendChild(metric("未解析", result.unresolved)); clear(tableHost); tableHost.appendChild(ledger(doc, result));
    }
    function change(key, value) { state[key] = value; state.revealed = false; state.feedback = "参数已改变，请重新提交预测。"; render(); }
    level.addEventListener("change", function () { change("level", level.value); }); resolution.addEventListener("input", function () { change("resolutionKm", Number(resolution.value)); }); ensemble.addEventListener("input", function () { change("ensemble", Number(ensemble.value)); }); parameterization.addEventListener("change", function () { change("parameterization", parameterization.value); });
    form.addEventListener("submit", function (event) { event.preventDefault(); if (answers.cost === null || answers.subgrid === null || answers.ensemble === null) { state.feedback = "请先完成三项预测。"; render(); return; } var score = (answers.cost === "eight" ? 1 : 0) + (answers.subgrid === "no" ? 1 : 0) + (answers.ensemble === "no" ? 1 : 0); state.revealed = true; state.feedback = "已揭示：" + score + "/3 命中。现在升一级模型，观察过程范围和代价如何一起变。"; render(); announce(api, rootNode, state.feedback); });
    form.querySelector("[data-reset]").addEventListener("click", function () { state = { level: DEFAULTS.level, resolutionKm: DEFAULTS.resolutionKm, ensemble: DEFAULTS.ensemble, parameterization: DEFAULTS.parameterization, revealed: false, feedback: "" }; answers = { cost: null, subgrid: null, ensemble: null }; render(); announce(api, rootNode, "气候模型账本已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var base = calculate(DEFAULTS);
    check(base.level === "ebm" && base.processes.indexOf("能量") !== -1, "default model level");
    check(calculate({ level: "ebm", resolutionKm: 50 }).gridProxy === 2 * base.gridProxy, "latitude-band EBM uses a one-dimensional resolution proxy");
    check(calculate({ level: "gcm", resolutionKm: 50 }).gridProxy === 8 * calculate({ level: "gcm", resolutionKm: 100 }).gridProxy, "GCM uses a three-dimensional grid proxy");
    check(calculate({ level: "esm" }).processes.indexOf("碳") !== -1, "ESM includes carbon coupling");
    check(calculate({ ensemble: 30 }).costProxy > base.costProxy, "more ensemble members raise cost proxy");
    check(JSON.stringify(calculate(DEFAULTS)) === JSON.stringify(calculate(DEFAULTS)), "deterministic model ledger");
    return { checks: checks };
  }

  return { calculate: calculate, mount: mount, selfTest: selfTest };
});
