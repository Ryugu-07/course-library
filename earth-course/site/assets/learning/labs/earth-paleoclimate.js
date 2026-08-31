(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-paleoclimate", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-paleoclimate self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-paleoclimate self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "earth-paleoclimate";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { proxy: "ice", signal: 0.6, slope: 2, measurement: 0.4, calibrationFraction: 0.10, ageUncertainty: 800, archives: 2, ageOffset: 0 };
  var PROXIES = {
    ice: { label: "冰芯", archive: "同位素 / 气泡", resolution: "高" },
    tree: { label: "树轮", archive: "年轮宽度 / 密度", resolution: "很高" },
    coral: { label: "珊瑚", archive: "骨骼化学", resolution: "高" },
    sediment: { label: "沉积物", archive: "微化石 / 粒度", resolution: "中" }
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

  function assert(condition, message) {
    if (!condition) throw new Error(NAME + " self-test failed: " + message);
  }

  function calculate(input) {
    var source = input || {};
    var proxy = PROXIES[source.proxy] ? source.proxy : DEFAULTS.proxy;
    var signal = clamp(source.signal, -1.5, 1.5, DEFAULTS.signal);
    var slope = clamp(source.slope, 0.5, 4, DEFAULTS.slope);
    var measurement = clamp(source.measurement, 0.05, 1.5, DEFAULTS.measurement);
    var calibrationFraction = clamp(source.calibrationFraction, 0, 1, DEFAULTS.calibrationFraction);
    var ageUncertainty = clamp(source.ageUncertainty, 0, 5000, DEFAULTS.ageUncertainty);
    var archives = integer(source.archives, 1, 6, DEFAULTS.archives);
    var ageOffset = clamp(source.ageOffset, -5000, 5000, DEFAULTS.ageOffset);
    var center = signal * slope;
    var amplitudeSigma = Math.sqrt(Math.pow(measurement / Math.sqrt(archives), 2) + Math.pow(calibrationFraction * Math.abs(center), 2));
    return {
      proxy: proxy,
      proxyLabel: PROXIES[proxy].label,
      archive: PROXIES[proxy].archive,
      resolution: PROXIES[proxy].resolution,
      signal: signal,
      slope: slope,
      measurement: measurement,
      calibrationFraction: calibrationFraction,
      ageUncertainty: ageUncertainty,
      archives: archives,
      ageOffset: ageOffset,
      center: center,
      amplitudeSigma: amplitudeSigma,
      lower: center - amplitudeSigma,
      upper: center + amplitudeSigma,
      ageWindowLow: ageOffset - ageUncertainty,
      ageWindowHigh: ageOffset + ageUncertainty
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
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgEl(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key])); });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--ep-blue:#315f9d;--ep-green:#39734d;--ep-gold:#a36a16;--ep-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0;font-size:1.16rem}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}[data-learning-lab="' + NAME + '"] button{flex:1 1 150px}[data-learning-lab="' + NAME + '"] button[aria-pressed=true],[data-learning-lab="' + NAME + '"] .ep-primary{background:var(--ep-blue);border-color:var(--ep-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .ep-choices,[data-learning-lab="' + NAME + '"] .ep-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .ep-feedback,[data-learning-lab="' + NAME + '"] .ep-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .ep-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}[data-learning-lab="' + NAME + '"] .ep-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .ep-control>span{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}[data-learning-lab="' + NAME + '"] output{color:var(--ep-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--ep-blue)}' +
      '[data-learning-lab="' + NAME + '"] .ep-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .ep-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .ep-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .ep-metric{min-width:0;padding:8px;border-top:2px solid var(--ep-blue)}[data-learning-lab="' + NAME + '"] .ep-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .ep-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .ep-table{max-width:100%;overflow-x:auto}[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor)}' +
      '@media(max-width:620px){[data-learning-lab="' + NAME + '"] .ep-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .ep-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .ep-choices,[data-learning-lab="' + NAME + '"] .ep-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    doc.head.appendChild(style);
  }

  function draw(doc, svg, result) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 720 300");
    svg.appendChild(svgEl(doc, "title", {}, "古气候代理证据链"));
    svg.appendChild(svgEl(doc, "desc", {}, "代理信号经过校准成为温度异常，并分别记录振幅区间和年龄窗口。"));
    var defs = svgEl(doc, "defs", {});
    var marker = svgEl(doc, "marker", { id: "ep-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto" });
    marker.appendChild(svgEl(doc, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "currentColor" }));
    defs.appendChild(marker); svg.appendChild(defs);
    var boxes = [
      { x: 18, label: result.proxyLabel, value: "信号 " + format(result.signal), fill: "var(--ep-gold)" },
      { x: 258, label: "校准", value: "a = " + format(result.slope, 1), fill: "var(--ep-blue)" },
      { x: 498, label: "重建", value: format(result.center) + " °C", fill: result.center >= 0 ? "var(--ep-green)" : "var(--ep-red)" }
    ];
    boxes.forEach(function (box) {
      svg.appendChild(svgEl(doc, "rect", { x: box.x, y: 42, width: 204, height: 68, rx: 6, fill: box.fill, "fill-opacity": ".88" }));
      svg.appendChild(svgEl(doc, "text", { x: box.x + 102, y: 68, "text-anchor": "middle", "font-size": "14", fill: "#fff" }, box.label));
      svg.appendChild(svgEl(doc, "text", { x: box.x + 102, y: 92, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, box.value));
    });
    svg.appendChild(svgEl(doc, "line", { x1: 226, y1: 76, x2: 252, y2: 76, stroke: "var(--ep-blue)", "stroke-width": "2.5", "marker-end": "url(#ep-arrow)" }));
    svg.appendChild(svgEl(doc, "line", { x1: 466, y1: 76, x2: 492, y2: 76, stroke: "var(--ep-blue)", "stroke-width": "2.5", "marker-end": "url(#ep-arrow)" }));
    svg.appendChild(svgEl(doc, "text", { x: 18, y: 138, "font-size": "11" }, "振幅：" + format(result.lower) + " 至 " + format(result.upper) + " °C"));
    svg.appendChild(svgEl(doc, "line", { x1: 52, y1: 220, x2: 668, y2: 220, stroke: "currentColor", "stroke-width": "1.5" }));
    var centerX = 360 + Math.max(-250, Math.min(250, result.ageOffset / 5000 * 250));
    var half = Math.max(4, Math.min(245, result.ageUncertainty / 5000 * 245));
    svg.appendChild(svgEl(doc, "rect", { x: centerX - half, y: 204, width: half * 2, height: 32, rx: 4, fill: "var(--ep-gold)", "fill-opacity": ".72" }));
    svg.appendChild(svgEl(doc, "line", { x1: centerX, y1: 196, x2: centerX, y2: 244, stroke: "var(--ep-blue)", "stroke-width": "2" }));
    svg.appendChild(svgEl(doc, "text", { x: 52, y: 252, "font-size": "10" }, "年龄窗口"));
    svg.appendChild(svgEl(doc, "text", { x: centerX, y: 190, "text-anchor": "middle", "font-size": "11" }, "偏移 " + format(result.ageOffset, 0) + " ± " + format(result.ageUncertainty, 0) + " yr"));
    svg.appendChild(svgEl(doc, "text", { x: 18, y: 280, "font-size": "11" }, result.archives + " 条独立档案 · 共同比例误差不会自动消失"));
  }

  function ledger(doc, result) {
    var wrap = el(doc, "div", { className: "ep-table" });
    var table = el(doc, "table", { "aria-label": "古气候代理结果账本" });
    table.appendChild(el(doc, "caption", { text: "代理证据账本" }));
    table.appendChild(el(doc, "thead", {}, [el(doc, "tr", {}, [el(doc, "th", { text: "量" }), el(doc, "th", { text: "当前值" }), el(doc, "th", { text: "误差身份" })])]));
    var body = el(doc, "tbody");
    [
      ["档案", result.proxyLabel + " · " + result.archive, "代理材料"],
      ["中心重建", format(result.center) + " °C", "a × x"],
      ["振幅区间", format(result.lower) + " 至 " + format(result.upper) + " °C", "测量 + 校准"],
      ["年代中心", format(result.ageOffset, 0) + " yr", "相对时间零点"],
      ["年龄半宽", "±" + format(result.ageUncertainty, 0) + " yr", "时间误差，非温度误差"]
    ].forEach(function (row) { body.appendChild(el(doc, "tr", {}, [el(doc, "th", { scope: "row", text: row[0] }), el(doc, "td", { text: row[1] }), el(doc, "td", { text: row[2] })])); });
    table.appendChild(body); wrap.appendChild(table); return wrap;
  }

  function addQuestion(doc, fieldset, key, prompt, choices, answers, groups) {
    fieldset.appendChild(el(doc, "p", { text: prompt }));
    var row = el(doc, "div", { className: "ep-choices", role: "group", "aria-label": prompt });
    choices.forEach(function (choice) {
      var button = el(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
      button.addEventListener("click", function () { answers[key] = choice[0]; groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); }); });
      groups.push({ key: key, value: choice[0], button: button }); row.appendChild(button);
    });
    fieldset.appendChild(row);
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { proxy: DEFAULTS.proxy, signal: DEFAULTS.signal, slope: DEFAULTS.slope, measurement: DEFAULTS.measurement, calibrationFraction: DEFAULTS.calibrationFraction, ageUncertainty: DEFAULTS.ageUncertainty, archives: DEFAULTS.archives, ageOffset: DEFAULTS.ageOffset, revealed: false, feedback: "" };
    var answers = { age: null, shared: null, linear: null }; var groups = [];
    var shell = el(doc, "div", {});
    shell.appendChild(el(doc, "h3", { text: "古气候档案：区分振幅、年龄和共享误差" }));
    shell.appendChild(el(doc, "p", { className: "ep-note", text: "先判断哪类误差影响哪一栏，再调节代理信号和校准参数。" }));
    var form = el(doc, "form", {}); var fieldset = el(doc, "fieldset", {});
    fieldset.appendChild(el(doc, "legend", { text: "预测门" }));
    addQuestion(doc, fieldset, "age", "年龄不确定度增加，主要扩大哪一项？", [["time", "时间窗口"], ["amplitude", "温度振幅"]], answers, groups);
    addQuestion(doc, fieldset, "shared", "独立档案平均能消除共同校准偏差吗？", [["yes", "能"], ["no", "不能"]], answers, groups);
    addQuestion(doc, fieldset, "linear", "代理信号超出校准范围仍必然线性吗？", [["yes", "必然"], ["no", "不必然"]], answers, groups);
    form.appendChild(fieldset);
    var actions = el(doc, "div", { className: "ep-actions" }); actions.appendChild(el(doc, "button", { type: "submit", className: "ep-primary", text: "提交预测并揭示" })); actions.appendChild(el(doc, "button", { type: "button", text: "重置", "data-reset": "true" })); form.appendChild(actions);
    var feedback = el(doc, "p", { className: "ep-feedback", role: "status", "aria-live": "polite" }); form.appendChild(feedback); shell.appendChild(form);
    var controls = el(doc, "div", { className: "ep-controls" });
    var proxy = el(doc, "select", { "aria-label": "代理档案类型" }); Object.keys(PROXIES).forEach(function (key) { proxy.appendChild(el(doc, "option", { value: key, text: PROXIES[key].label })); });
    var signal = el(doc, "input", { type: "range", min: "-1.5", max: "1.5", step: "0.1", value: String(DEFAULTS.signal), "aria-label": "标准化代理信号" }); var signalOut = el(doc, "output", { text: "0.60" });
    var slope = el(doc, "input", { type: "range", min: "0.5", max: "4", step: "0.1", value: String(DEFAULTS.slope), "aria-label": "校准斜率" }); var slopeOut = el(doc, "output", { text: "2.0 °C/单位" });
    var age = el(doc, "input", { type: "range", min: "0", max: "5000", step: "100", value: String(DEFAULTS.ageUncertainty), "aria-label": "年龄不确定度" }); var ageOut = el(doc, "output", { text: "800 yr" });
    var archives = el(doc, "select", { "aria-label": "独立档案数" }); [1, 2, 3, 4, 6].forEach(function (count) { archives.appendChild(el(doc, "option", { value: String(count), text: count + " 条" })); });
    controls.appendChild(el(doc, "label", { className: "ep-control" }, [el(doc, "span", { text: "代理类型" }), proxy]));
    controls.appendChild(el(doc, "label", { className: "ep-control" }, [el(doc, "span", {}, ["代理信号 ", signalOut]), signal]));
    controls.appendChild(el(doc, "label", { className: "ep-control" }, [el(doc, "span", {}, ["校准斜率 ", slopeOut]), slope]));
    controls.appendChild(el(doc, "label", { className: "ep-control" }, [el(doc, "span", {}, ["年龄不确定度 ", ageOut]), age]));
    controls.appendChild(el(doc, "label", { className: "ep-control" }, [el(doc, "span", { text: "独立档案数" }), archives])); shell.appendChild(controls);
    var revealed = el(doc, "section", { className: "ep-revealed", hidden: "hidden" }); var stage = el(doc, "div", { className: "ep-stage" }); var svg = doc.createElementNS(SVG_NS, "svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "代理信号到古气候重建的证据链"); stage.appendChild(svg); revealed.appendChild(stage);
    var metrics = el(doc, "div", { className: "ep-metrics" }); revealed.appendChild(metrics); var tableHost = el(doc, "div", {}); revealed.appendChild(tableHost); revealed.appendChild(el(doc, "p", { className: "ep-note", text: "边界提醒：真实档案还需保存偏差、空间代表性、年龄模型和代理响应机制的独立审计。" })); shell.appendChild(revealed); rootNode.replaceChildren(shell);
    function metric(label, value) { return el(doc, "div", { className: "ep-metric" }, [el(doc, "span", { text: label }), el(doc, "strong", { text: value })]); }
    function render() {
      var result = calculate(state); proxy.value = state.proxy; signal.value = String(state.signal); signalOut.textContent = format(state.signal, 2); slope.value = String(state.slope); slopeOut.textContent = format(state.slope, 1) + " °C/单位"; age.value = String(state.ageUncertainty); ageOut.textContent = format(state.ageUncertainty, 0) + " yr"; archives.value = String(state.archives);
      groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); }); feedback.textContent = state.feedback; revealed.hidden = !state.revealed; if (!state.revealed) return;
      draw(doc, svg, result); clear(metrics); metrics.appendChild(metric("中心异常", format(result.center) + " °C")); metrics.appendChild(metric("振幅误差", "±" + format(result.amplitudeSigma) + " °C")); metrics.appendChild(metric("年龄窗口", "±" + format(result.ageUncertainty, 0) + " yr")); metrics.appendChild(metric("档案数", String(result.archives))); clear(tableHost); tableHost.appendChild(ledger(doc, result));
    }
    function change(key, value) { state[key] = value; state.revealed = false; state.feedback = "参数已改变，请重新提交预测。"; render(); }
    proxy.addEventListener("change", function () { change("proxy", proxy.value); }); signal.addEventListener("input", function () { change("signal", Number(signal.value)); }); slope.addEventListener("input", function () { change("slope", Number(slope.value)); }); age.addEventListener("input", function () { change("ageUncertainty", Number(age.value)); }); archives.addEventListener("change", function () { change("archives", Number(archives.value)); });
    form.addEventListener("submit", function (event) { event.preventDefault(); if (answers.age === null || answers.shared === null || answers.linear === null) { state.feedback = "请先完成三项预测。"; render(); return; } var score = (answers.age === "time" ? 1 : 0) + (answers.shared === "no" ? 1 : 0) + (answers.linear === "no" ? 1 : 0); state.revealed = true; state.feedback = "已揭示：" + score + "/3 命中。现在比较振幅误差与年龄窗口的单位。"; render(); announce(api, rootNode, state.feedback); });
    form.querySelector("[data-reset]").addEventListener("click", function () { state = { proxy: DEFAULTS.proxy, signal: DEFAULTS.signal, slope: DEFAULTS.slope, measurement: DEFAULTS.measurement, calibrationFraction: DEFAULTS.calibrationFraction, ageUncertainty: DEFAULTS.ageUncertainty, archives: DEFAULTS.archives, ageOffset: DEFAULTS.ageOffset, revealed: false, feedback: "" }; answers = { age: null, shared: null, linear: null }; render(); announce(api, rootNode, "古气候证据账本已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var base = calculate(DEFAULTS);
    check(near(base.center, 1.2), "calibration gives expected center");
    check(near(base.amplitudeSigma, 0.3072458299147443), "default calibration fraction locks amplitude uncertainty");
    check(base.ageWindowHigh - base.ageWindowLow === 1600, "age uncertainty is a timing window");
    check(calculate({ archives: 4 }).amplitudeSigma < base.amplitudeSigma, "independent archives reduce random amplitude error");
    check(calculate({ ageUncertainty: 4000 }).center === base.center, "age uncertainty does not change amplitude center");
    check(calculate({ signal: 0 }).center === 0, "zero proxy signal has zero anomaly in toy calibration");
    check(JSON.stringify(calculate(DEFAULTS)) === JSON.stringify(calculate(DEFAULTS)), "deterministic proxy ledger");
    return { checks: checks };
  }

  function near(left, right) { return Math.abs(left - right) < 1e-10; }
  return { calculate: calculate, mount: mount, selfTest: selfTest };
});
