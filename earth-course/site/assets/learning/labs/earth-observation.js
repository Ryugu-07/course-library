(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-observation", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-observation self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-observation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "earth-observation";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { sensor: "satellite", cloud: 0.3, calibration: 0.2, revisitDays: 5 };
  var SENSORS = {
    station: { label: "地面站", object: "近地面点", kind: "直接观测", baseCoverage: 0.12, noise: 0.2, path: "仪器读数" },
    satellite: { label: "卫星遥感", object: "辐亮度 → 反演", kind: "反演产品", baseCoverage: 0.82, noise: 0.35, path: "辐射传输 + 先验" },
    radiosonde: { label: "探空", object: "垂直剖面", kind: "直接/剖面", baseCoverage: 0.25, noise: 0.25, path: "探空仪器" },
    reanalysis: { label: "再分析", object: "模型 + 观测", kind: "模型辅助分析", baseCoverage: 1, noise: 0.15, path: "同化系统" }
  };

  function clamp(value, low, high, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = fallback;
    return Math.min(high, Math.max(low, number));
  }

  function integer(value, low, high, fallback) { return Math.round(clamp(value, low, high, fallback)); }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.01) return value.toExponential(2);
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }

  function calculate(input) {
    var source = input || {};
    var sensor = SENSORS[source.sensor] ? source.sensor : DEFAULTS.sensor;
    var cloud = clamp(source.cloud, 0, 1, DEFAULTS.cloud);
    var calibration = clamp(source.calibration, 0, 1, DEFAULTS.calibration);
    var revisitDays = integer(source.revisitDays, 1, 30, DEFAULTS.revisitDays);
    var spec = SENSORS[sensor];
    var coverage = spec.baseCoverage;
    if (sensor === "satellite") coverage *= 1 - cloud;
    var samplingPenalty = revisitDays / 30 * 0.2;
    var cloudPenalty = sensor === "satellite" ? cloud * 0.15 : 0;
    var uncertainty = Math.sqrt(Math.pow(spec.noise, 2) + Math.pow(calibration, 2) + Math.pow(samplingPenalty, 2) + Math.pow(cloudPenalty, 2));
    var biasRisk = calibration + (sensor === "reanalysis" ? 0.15 : sensor === "satellite" ? 0.05 : 0.02);
    return {
      sensor: sensor,
      label: spec.label,
      object: spec.object,
      kind: spec.kind,
      path: spec.path,
      cloud: cloud,
      calibration: calibration,
      revisitDays: revisitDays,
      coverage: coverage,
      uncertainty: uncertainty,
      biasRisk: biasRisk,
      samplingPenalty: samplingPenalty,
      cloudPenalty: cloudPenalty,
      directness: sensor === "station" || sensor === "radiosonde" ? "较直接" : "依赖算子/模型"
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
      '[data-learning-lab="' + NAME + '"]{--eo-blue:#315f9d;--eo-green:#39734d;--eo-gold:#a36a16;--eo-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0;font-size:1.16rem}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}[data-learning-lab="' + NAME + '"] button{flex:1 1 150px}[data-learning-lab="' + NAME + '"] button[aria-pressed=true],[data-learning-lab="' + NAME + '"] .eo-primary{background:var(--eo-blue);border-color:var(--eo-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .eo-choices,[data-learning-lab="' + NAME + '"] .eo-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .eo-feedback,[data-learning-lab="' + NAME + '"] .eo-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .eo-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}[data-learning-lab="' + NAME + '"] .eo-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .eo-control>span{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}[data-learning-lab="' + NAME + '"] output{color:var(--eo-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--eo-blue)}' +
      '[data-learning-lab="' + NAME + '"] .eo-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .eo-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .eo-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .eo-metric{min-width:0;padding:8px;border-top:2px solid var(--eo-blue)}[data-learning-lab="' + NAME + '"] .eo-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .eo-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .eo-table{max-width:100%;overflow-x:auto}[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor)}' +
      '@media(max-width:620px){[data-learning-lab="' + NAME + '"] .eo-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .eo-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .eo-choices,[data-learning-lab="' + NAME + '"] .eo-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    doc.head.appendChild(style);
  }

  function draw(doc, svg, result) {
    clear(svg); svg.setAttribute("viewBox", "0 0 720 310");
    svg.appendChild(svgEl(doc, "title", {}, "观测、反演与再分析流程图"));
    svg.appendChild(svgEl(doc, "desc", {}, "传感器信号经过观测算子和反演，必要时与模型背景同化，形成带覆盖和误差账本的产品。"));
    var defs = svgEl(doc, "defs", {}); var marker = svgEl(doc, "marker", { id: "eo-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto" }); marker.appendChild(svgEl(doc, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "currentColor" })); defs.appendChild(marker); svg.appendChild(defs);
    var boxes = [
      { x: 18, label: result.label, value: "输入", fill: "var(--eo-gold)" },
      { x: 188, label: "观测算子", value: result.object, fill: "var(--eo-blue)" },
      { x: 358, label: "反演 / 质控", value: result.path, fill: "var(--eo-green)" },
      { x: 528, label: "产品", value: result.kind, fill: "var(--eo-red)" }
    ];
    boxes.forEach(function (box) { svg.appendChild(svgEl(doc, "rect", { x: box.x, y: 42, width: 154, height: 64, rx: 6, fill: box.fill, "fill-opacity": ".87" })); svg.appendChild(svgEl(doc, "text", { x: box.x + 77, y: 67, "text-anchor": "middle", "font-size": "12", fill: "#fff" }, box.label)); svg.appendChild(svgEl(doc, "text", { x: box.x + 77, y: 89, "text-anchor": "middle", "font-size": "10", fill: "#fff" }, box.value)); });
    [172, 342, 512].forEach(function (x) { svg.appendChild(svgEl(doc, "line", { x1: x, y1: 74, x2: x + 12, y2: 74, stroke: "var(--eo-blue)", "stroke-width": "2.5", "marker-end": "url(#eo-arrow)" })); });
    svg.appendChild(svgEl(doc, "text", { x: 18, y: 140, "font-size": "11" }, "有效覆盖率"));
    svg.appendChild(svgEl(doc, "rect", { x: 104, y: 126, width: 594, height: 22, rx: 4, fill: "var(--border,#cbd5e1)", "fill-opacity": ".65" }));
    svg.appendChild(svgEl(doc, "rect", { x: 104, y: 126, width: 594 * result.coverage, height: 22, rx: 4, fill: "var(--eo-green)", "fill-opacity": ".86" }));
    svg.appendChild(svgEl(doc, "text", { x: 401, y: 142, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, format(result.coverage * 100, 0) + "%"));
    svg.appendChild(svgEl(doc, "rect", { x: 18, y: 190, width: 220, height: 58, rx: 6, fill: "var(--eo-blue)", "fill-opacity": ".84" }));
    svg.appendChild(svgEl(doc, "text", { x: 128, y: 214, "text-anchor": "middle", "font-size": "12", fill: "#fff" }, "随机 + 采样"));
    svg.appendChild(svgEl(doc, "text", { x: 128, y: 234, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, "σ " + format(result.uncertainty)));
    svg.appendChild(svgEl(doc, "rect", { x: 260, y: 190, width: 220, height: 58, rx: 6, fill: "var(--eo-gold)", "fill-opacity": ".84" }));
    svg.appendChild(svgEl(doc, "text", { x: 370, y: 214, "text-anchor": "middle", "font-size": "12", fill: "#fff" }, "系统偏差风险"));
    svg.appendChild(svgEl(doc, "text", { x: 370, y: 234, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, format(result.biasRisk)));
    svg.appendChild(svgEl(doc, "rect", { x: 502, y: 190, width: 196, height: 58, rx: 6, fill: "var(--eo-red)", "fill-opacity": ".84" }));
    svg.appendChild(svgEl(doc, "text", { x: 600, y: 214, "text-anchor": "middle", "font-size": "12", fill: "#fff" }, "云量 / 重访"));
    svg.appendChild(svgEl(doc, "text", { x: 600, y: 234, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, format(result.cloud * 100, 0) + "% · " + result.revisitDays + " d"));
    svg.appendChild(svgEl(doc, "text", { x: 18, y: 278, "font-size": "11" }, "产品身份：" + result.kind + " · 数值不是原始传感器读数"));
  }

  function ledger(doc, result) {
    var wrap = el(doc, "div", { className: "eo-table" }); var table = el(doc, "table", { "aria-label": "观测产品结果账本" });
    table.appendChild(el(doc, "caption", { text: "观测链与误差账本" })); table.appendChild(el(doc, "thead", {}, [el(doc, "tr", {}, [el(doc, "th", { text: "量" }), el(doc, "th", { text: "当前值" }), el(doc, "th", { text: "读法" })])]));
    var body = el(doc, "tbody");
    [["测量对象", result.object, "观测算子输入"], ["产品身份", result.kind, result.directness], ["有效覆盖率", format(result.coverage * 100, 0) + "%", "云、站点或轨道限制"], ["综合不确定度", format(result.uncertainty), "归一化教学量"], ["偏差风险", format(result.biasRisk), "校准 + 产品依赖"], ["重访间隔", result.revisitDays + " d", "采样时间窗"]].forEach(function (row) { body.appendChild(el(doc, "tr", {}, [el(doc, "th", { scope: "row", text: row[0] }), el(doc, "td", { text: row[1] }), el(doc, "td", { text: row[2] })])); });
    table.appendChild(body); wrap.appendChild(table); return wrap;
  }

  function addQuestion(doc, fieldset, key, prompt, choices, answers, groups) {
    fieldset.appendChild(el(doc, "p", { text: prompt })); var row = el(doc, "div", { className: "eo-choices", role: "group", "aria-label": prompt });
    choices.forEach(function (choice) { var button = el(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] }); button.addEventListener("click", function () { answers[key] = choice[0]; groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); }); }); groups.push({ key: key, value: choice[0], button: button }); row.appendChild(button); }); fieldset.appendChild(row);
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { sensor: DEFAULTS.sensor, cloud: DEFAULTS.cloud, calibration: DEFAULTS.calibration, revisitDays: DEFAULTS.revisitDays, revealed: false, feedback: "" };
    var answers = { cloud: null, reanalysis: null, bias: null }; var groups = [];
    var shell = el(doc, "div", {}); shell.appendChild(el(doc, "h3", { text: "观测链：从读数到产品" })); shell.appendChild(el(doc, "p", { className: "eo-note", text: "先判断云、再分析和系统偏差的边界，再切换传感器和质量参数。" }));
    var form = el(doc, "form", {}); var fieldset = el(doc, "fieldset", {}); fieldset.appendChild(el(doc, "legend", { text: "预测门" }));
    addQuestion(doc, fieldset, "cloud", "卫星云量增加，最先下降的是覆盖率还是地表真实温度？", [["coverage", "覆盖率"], ["temperature", "真实温度"]], answers, groups);
    addQuestion(doc, fieldset, "reanalysis", "再分析覆盖完整，是否等于纯直接观测？", [["yes", "等于"], ["no", "不等于"]], answers, groups);
    addQuestion(doc, fieldset, "bias", "随机噪声减半，固定定标偏差也会自动消失吗？", [["yes", "会消失"], ["no", "不会"]], answers, groups);
    form.appendChild(fieldset); var actions = el(doc, "div", { className: "eo-actions" }); actions.appendChild(el(doc, "button", { type: "submit", className: "eo-primary", text: "提交预测并揭示" })); actions.appendChild(el(doc, "button", { type: "button", text: "重置", "data-reset": "true" })); form.appendChild(actions);
    var feedback = el(doc, "p", { className: "eo-feedback", role: "status", "aria-live": "polite" }); form.appendChild(feedback); shell.appendChild(form);
    var controls = el(doc, "div", { className: "eo-controls" });
    var sensor = el(doc, "select", { "aria-label": "观测产品类型" }); Object.keys(SENSORS).forEach(function (key) { sensor.appendChild(el(doc, "option", { value: key, text: SENSORS[key].label })); });
    var cloud = el(doc, "input", { type: "range", min: "0", max: "1", step: "0.05", value: String(DEFAULTS.cloud), "aria-label": "云量比例" }); var cloudOut = el(doc, "output", { text: "30%" });
    var calibration = el(doc, "input", { type: "range", min: "0", max: "1", step: "0.05", value: String(DEFAULTS.calibration), "aria-label": "校准偏差代理" }); var calibrationOut = el(doc, "output", { text: "0.20" });
    var revisit = el(doc, "input", { type: "range", min: "1", max: "30", step: "1", value: String(DEFAULTS.revisitDays), "aria-label": "重访间隔天数" }); var revisitOut = el(doc, "output", { text: "5 d" });
    controls.appendChild(el(doc, "label", { className: "eo-control" }, [el(doc, "span", { text: "产品类型" }), sensor])); controls.appendChild(el(doc, "label", { className: "eo-control" }, [el(doc, "span", {}, ["云量 ", cloudOut]), cloud])); controls.appendChild(el(doc, "label", { className: "eo-control" }, [el(doc, "span", {}, ["校准偏差代理 ", calibrationOut]), calibration])); controls.appendChild(el(doc, "label", { className: "eo-control" }, [el(doc, "span", {}, ["重访间隔 ", revisitOut]), revisit])); shell.appendChild(controls);
    var revealed = el(doc, "section", { className: "eo-revealed", hidden: "hidden" }); var stage = el(doc, "div", { className: "eo-stage" }); var svg = doc.createElementNS(SVG_NS, "svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "传感器到观测产品的过程图"); stage.appendChild(svg); revealed.appendChild(stage); var metrics = el(doc, "div", { className: "eo-metrics" }); revealed.appendChild(metrics); var tableHost = el(doc, "div", {}); revealed.appendChild(tableHost); revealed.appendChild(el(doc, "p", { className: "eo-note", text: "边界提醒：真实产品还要查质量标志、算法版本、观测几何、误差协方差和验证数据源。" })); shell.appendChild(revealed); rootNode.replaceChildren(shell);
    function metric(label, value) { return el(doc, "div", { className: "eo-metric" }, [el(doc, "span", { text: label }), el(doc, "strong", { text: value })]); }
    function render() {
      var result = calculate(state); sensor.value = state.sensor; cloud.value = String(state.cloud); cloudOut.textContent = format(state.cloud * 100, 0) + "%"; calibration.value = String(state.calibration); calibrationOut.textContent = format(state.calibration); revisit.value = String(state.revisitDays); revisitOut.textContent = format(state.revisitDays, 0) + " d";
      groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); }); feedback.textContent = state.feedback; revealed.hidden = !state.revealed; if (!state.revealed) return;
      draw(doc, svg, result); clear(metrics); metrics.appendChild(metric("有效覆盖", format(result.coverage * 100, 0) + "%")); metrics.appendChild(metric("综合不确定度", format(result.uncertainty))); metrics.appendChild(metric("偏差风险", format(result.biasRisk))); metrics.appendChild(metric("产品身份", result.kind)); clear(tableHost); tableHost.appendChild(ledger(doc, result));
    }
    function change(key, value) { state[key] = value; state.revealed = false; state.feedback = "参数已改变，请重新提交预测。"; render(); }
    sensor.addEventListener("change", function () { change("sensor", sensor.value); }); cloud.addEventListener("input", function () { change("cloud", Number(cloud.value)); }); calibration.addEventListener("input", function () { change("calibration", Number(calibration.value)); }); revisit.addEventListener("input", function () { change("revisitDays", Number(revisit.value)); });
    form.addEventListener("submit", function (event) { event.preventDefault(); if (answers.cloud === null || answers.reanalysis === null || answers.bias === null) { state.feedback = "请先完成三项预测。"; render(); return; } var score = (answers.cloud === "coverage" ? 1 : 0) + (answers.reanalysis === "no" ? 1 : 0) + (answers.bias === "no" ? 1 : 0); state.revealed = true; state.feedback = "已揭示：" + score + "/3 命中。现在切换传感器，比较覆盖与产品身份。"; render(); announce(api, rootNode, state.feedback); });
    form.querySelector("[data-reset]").addEventListener("click", function () { state = { sensor: DEFAULTS.sensor, cloud: DEFAULTS.cloud, calibration: DEFAULTS.calibration, revisitDays: DEFAULTS.revisitDays, revealed: false, feedback: "" }; answers = { cloud: null, reanalysis: null, bias: null }; render(); announce(api, rootNode, "观测链账本已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var base = calculate(DEFAULTS);
    check(near(base.coverage, 0.574), "default satellite coverage is locked");
    check(near(base.uncertainty, 0.406984165676149), "default uncertainty is locked");
    check(calculate({ sensor: "satellite", cloud: 0.8 }).coverage < base.coverage, "more cloud lowers satellite coverage");
    check(calculate({ sensor: "reanalysis" }).coverage === 1 && calculate({ sensor: "reanalysis" }).kind.indexOf("模型") !== -1, "reanalysis is model-assisted full coverage");
    check(calculate({ calibration: 0 }).biasRisk < base.biasRisk, "calibration bias changes bias risk");
    check(JSON.stringify(calculate(DEFAULTS)) === JSON.stringify(calculate(DEFAULTS)), "deterministic observation ledger");
    return { checks: checks };
  }

  function near(left, right) { return Math.abs(left - right) < 1e-10; }
  return { calculate: calculate, mount: mount, selfTest: selfTest };
});
