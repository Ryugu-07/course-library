(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-analog", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-analog self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-analog self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "micro-analog";
  var STYLE_ID = "micro-analog-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { idUa: 100, gmid: 15, loadPf: 1, areaUm2: 100, targetMismatchMv: 0.2 };

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function finite(value, label) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-9) * scale;
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) >= 1e4 || (Math.abs(value) > 0 && Math.abs(value) < 0.01)) {
      return value.toExponential(digits === undefined ? 2 : digits);
    }
    return value.toFixed(digits === undefined ? 2 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function normalize(input) {
    var source = input || {};
    return {
      idUa: clamp(finite(source.idUa === undefined ? DEFAULTS.idUa : source.idUa, "drain current"), 10, 500),
      gmid: clamp(finite(source.gmid === undefined ? DEFAULTS.gmid : source.gmid, "gm/Id"), 5, 25),
      loadPf: clamp(finite(source.loadPf === undefined ? DEFAULTS.loadPf : source.loadPf, "load capacitance"), 0.2, 5),
      areaUm2: clamp(finite(source.areaUm2 === undefined ? DEFAULTS.areaUm2 : source.areaUm2, "device area"), 10, 800),
      targetMismatchMv: clamp(finite(source.targetMismatchMv === undefined ? DEFAULTS.targetMismatchMv : source.targetMismatchMv, "target mismatch"), 0.1, 0.8)
    };
  }

  function calculate(input) {
    var state = normalize(input);
    var id = state.idUa * 1e-6;
    var gm = state.gmid * id;
    var capacitance = state.loadPf * 1e-12;
    var ro = 8 / id;
    var gain = gm * ro;
    var bandwidth = gm / (2 * Math.PI * capacitance);
    var sigma = 3e-3 / Math.sqrt(state.areaUm2);
    var neededArea = Math.pow(3e-3 / (state.targetMismatchMv / 1000), 2);
    var mode = state.gmid <= 10 ? "强反型" : state.gmid <= 17 ? "中等反型" : "弱反型";
    return {
      state: state,
      id: id,
      gm: gm,
      ro: ro,
      gain: gain,
      bandwidth: bandwidth,
      power: id,
      sigmaMismatch: sigma,
      neededArea: neededArea,
      meetsTarget: state.areaUm2 >= neededArea,
      mode: mode,
      currentDensity: state.idUa / state.areaUm2
    };
  }

  function create(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svg(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function text(doc, x, y, value, attrs) {
    return svg(doc, "text", Object.assign({ x: x, y: y, fill: "currentColor", "font-size": 11 }, attrs || {}), [value]);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--ma-blue:#2563a6;--ma-orange:#b45a2c;--ma-green:#39734d;--ma-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .ma-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--ma-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .ma-primary{border-color:var(--ma-blue);background:var(--ma-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .ma-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .ma-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .ma-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--ma-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ma-blue)}[data-learning-lab="' + LAB_ID + '"] .ma-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}[data-learning-lab="' + LAB_ID + '"] .ma-actions>*{flex:1 1 180px}' +
      '[data-learning-lab="' + LAB_ID + '"] .ma-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .ma-good{color:var(--ma-green)}[data-learning-lab="' + LAB_ID + '"] .ma-warn{color:var(--ma-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .ma-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(240px,.8fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .ma-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .ma-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] .ma-metric{min-width:0;padding:8px;border-top:3px solid var(--ma-blue)}[data-learning-lab="' + LAB_ID + '"] .ma-metric:nth-child(2n){border-color:var(--ma-orange)}[data-learning-lab="' + LAB_ID + '"] .ma-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ma-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .ma-note{margin-top:11px;padding:9px 11px;border-left:3px solid var(--ma-green);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .ma-layout{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .ma-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .ma-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .ma-choices{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value, className) {
    return create(doc, "div", { className: className || "ma-metric" }, [
      create(doc, "span", { text: label }),
      create(doc, "strong", { text: value })
    ]);
  }

  function drawChart(doc, result) {
    var width = 620;
    var height = 310;
    var left = 52;
    var right = 18;
    var top = 24;
    var bottom = 45;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var presets = [
      { label: "强", result: calculate({ idUa: 250, gmid: 8, loadPf: result.state.loadPf, areaUm2: 25, targetMismatchMv: result.state.targetMismatchMv }), color: "#b45a2c" },
      { label: "中", result: calculate({ idUa: 100, gmid: 15, loadPf: result.state.loadPf, areaUm2: 100, targetMismatchMv: result.state.targetMismatchMv }), color: "#2563a6" },
      { label: "弱", result: calculate({ idUa: 25, gmid: 20, loadPf: result.state.loadPf, areaUm2: 400, targetMismatchMv: result.state.targetMismatchMv }), color: "#39734d" }
    ];
    var maxBandwidth = Math.max(400, result.bandwidth / 1e6, 318);
    var maxGain = 190;
    var chart = svg(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "模拟设计增益与带宽权衡图" });
    function x(value) { return left + value / maxBandwidth * plotWidth; }
    function y(value) { return top + (maxGain - value) / maxGain * plotHeight; }
    [0, 100, 200, 300, 400].forEach(function (tick) {
      if (tick > maxBandwidth) return;
      var xx = x(tick);
      chart.appendChild(svg(doc, "line", { x1: xx, y1: top, x2: xx, y2: height - bottom, stroke: "#e2e8f0", "stroke-width": 1 }));
      chart.appendChild(text(doc, xx, height - 21, tick + " MHz", { "text-anchor": "middle", "font-size": 10 }));
    });
    [0, 50, 100, 150].forEach(function (tick) {
      var yy = y(tick);
      chart.appendChild(svg(doc, "line", { x1: left, y1: yy, x2: width - right, y2: yy, stroke: "#cbd5e1", "stroke-width": 1 }));
      chart.appendChild(text(doc, left - 7, yy + 4, String(tick), { "text-anchor": "end", "font-size": 10 }));
    });
    chart.appendChild(svg(doc, "line", { x1: left, y1: height - bottom, x2: width - right, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    chart.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    presets.forEach(function (item) {
      chart.appendChild(svg(doc, "circle", { cx: x(item.result.bandwidth / 1e6), cy: y(item.result.gain), r: 6, fill: item.color, stroke: "white", "stroke-width": 1.5 }));
      chart.appendChild(text(doc, x(item.result.bandwidth / 1e6) + 9, y(item.result.gain) + 4, item.label, { fill: item.color, "font-size": 10, "font-weight": "700" }));
    });
    chart.appendChild(svg(doc, "circle", { cx: x(result.bandwidth / 1e6), cy: y(Math.min(maxGain, result.gain)), r: 5, fill: "#b23a32", stroke: "white", "stroke-width": 1.5 }));
    chart.appendChild(text(doc, left + plotWidth / 2, height - 3, "一阶带宽 (MHz)", { "text-anchor": "middle" }));
    chart.appendChild(text(doc, 13, top + plotHeight / 2, "Av proxy", { "text-anchor": "middle", "font-size": 11, transform: "rotate(-90 13 " + (top + plotHeight / 2) + ")" }));
    return chart;
  }

  function mount(node, api) {
    var doc = node.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    clear(node);
    var state = Object.assign({}, DEFAULTS);
    var revealed = false;
    var prediction = null;
    var predictionButtons = [];
    node.appendChild(create(doc, "h3", { text: "模拟设计实验：把 gm/Id、带宽和失配放进同一账本" }));
    node.appendChild(create(doc, "p", { className: "ma-note", text: "默认面积为 100 um^2；先预测面积扩大四倍时随机失配如何变化。" }));
    var predictionField = create(doc, "fieldset");
    predictionField.appendChild(create(doc, "legend", { text: "预测：面积从 A 增到 4A，Pelgrom 失配标准差会" }));
    var predictionRow = create(doc, "div", { className: "ma-choices" });
    [["half", "减半"], ["same", "不变"], ["double", "加倍"]].forEach(function (item) {
      var button = create(doc, "button", { type: "button", text: item[1], "aria-pressed": "false" });
      button.addEventListener("click", function () {
        predictionButtons.forEach(function (other) { other.setAttribute("aria-pressed", "false"); });
        button.setAttribute("aria-pressed", "true");
        prediction = item[0];
      });
      predictionButtons.push(button);
      predictionRow.appendChild(button);
    });
    predictionField.appendChild(predictionRow);
    node.appendChild(predictionField);
    var controls = create(doc, "div", { className: "ma-controls" });
    function addRange(label, key, min, max, step, formatter) {
      var holder = create(doc, "div", { className: "ma-control" });
      var output = create(doc, "output", { text: formatter(state[key]) });
      holder.appendChild(create(doc, "label", { text: label }, [output]));
      var input = create(doc, "input", { type: "range", min: min, max: max, step: step, value: state[key], "aria-label": label });
      input.addEventListener("input", function () {
        state[key] = Number(input.value);
        revealed = false;
        render();
      });
      holder.appendChild(input);
      controls.appendChild(holder);
      return { input: input, output: output, formatter: formatter };
    }
    var currentControl = addRange("ID", "idUa", 10, 500, 5, function (value) { return value + " uA"; });
    var efficiencyControl = addRange("gm/ID", "gmid", 5, 25, 0.5, function (value) { return format(value, 1) + " V^-1"; });
    var loadControl = addRange("负载 CL", "loadPf", 0.2, 5, 0.1, function (value) { return format(value, 1) + " pF"; });
    var areaControl = addRange("面积 A", "areaUm2", 10, 800, 10, function (value) { return value + " um^2"; });
    node.appendChild(controls);
    var actions = create(doc, "div", { className: "ma-actions" });
    var check = create(doc, "button", { type: "button", className: "ma-primary", text: "核对预测并显示权衡图" });
    var reset = create(doc, "button", { type: "button", text: "恢复默认" });
    actions.appendChild(check);
    actions.appendChild(reset);
    node.appendChild(actions);
    var feedback = create(doc, "p", { className: "ma-feedback", "aria-live": "polite" });
    node.appendChild(feedback);
    var resultRoot = create(doc, "div", { hidden: true });
    node.appendChild(resultRoot);

    check.addEventListener("click", function () {
      revealed = true;
      var result = calculate(state);
      var ok = prediction === "half";
      feedback.className = "ma-feedback " + (ok ? "ma-good" : "ma-warn");
      feedback.textContent = ok ? "预测正确：sigma_DVth 与 sqrt(A) 成反比。" : "重新读 Pelgrom 关系：面积在根号下，必须扩大四倍才把随机项减半。";
      if (api && typeof api.announce === "function") api.announce(node, feedback.textContent);
      renderResult(result);
    });
    reset.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      prediction = null;
      revealed = false;
      predictionButtons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      [currentControl, efficiencyControl, loadControl, areaControl].forEach(function (control, index) {
        control.input.value = state[["idUa", "gmid", "loadPf", "areaUm2"][index]];
      });
      feedback.textContent = "";
      render();
    });

    function renderResult(result) {
      clear(resultRoot);
      resultRoot.appendChild(create(doc, "div", { className: "ma-layout" }, [
        create(doc, "div", { className: "ma-stage" }, [drawChart(doc, result)]),
        create(doc, "div", { className: "ma-metrics" }, [
          metric(doc, "工作区", result.mode),
          metric(doc, "gm", format(result.gm * 1000, 3) + " mS"),
          metric(doc, "ro", format(result.ro / 1000, 2) + " kOhm"),
          metric(doc, "Av proxy", format(result.gain, 1)),
          metric(doc, "带宽", format(result.bandwidth / 1e6, 2) + " MHz"),
          metric(doc, "功耗 @ 1 V", format(result.power * 1e6, 2) + " uW"),
          metric(doc, "sigma mismatch", format(result.sigmaMismatch * 1000, 3) + " mV"),
          metric(doc, "目标所需面积", format(result.neededArea, 1) + " um^2", result.meetsTarget ? "ma-metric ma-good" : "ma-metric ma-warn")
        ])
      ]));
      resultRoot.appendChild(create(doc, "p", { className: "ma-note", text: "当前设计 " + (result.meetsTarget ? "满足" : "不满足") + " " + format(result.state.targetMismatchMv, 2) + " mV 的随机失配目标。图中三点是强/中/弱反型预设，不是同一工艺的全局 Pareto 前沿。" }));
      resultRoot.hidden = !revealed;
    }

    function render() {
      [currentControl, efficiencyControl, loadControl, areaControl].forEach(function (control, index) {
        var key = ["idUa", "gmid", "loadPf", "areaUm2"][index];
        control.output.textContent = control.formatter(state[key]);
      });
      resultRoot.hidden = !revealed;
      if (revealed) renderResult(calculate(state));
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var base = calculate(DEFAULTS);
    var fourArea = calculate({ idUa: 100, gmid: 15, loadPf: 1, areaUm2: 400, targetMismatchMv: 0.2 });
    var doubleCurrent = calculate({ idUa: 200, gmid: 15, loadPf: 1, areaUm2: 100, targetMismatchMv: 0.2 });
    var doubleLoad = calculate({ idUa: 100, gmid: 15, loadPf: 2, areaUm2: 100, targetMismatchMv: 0.2 });
    assert(near(fourArea.sigmaMismatch / base.sigmaMismatch, 0.5, 1e-12), "Pelgrom square-root scaling");
    assert(near(doubleCurrent.gm / base.gm, 2, 1e-12), "gm scales with current");
    assert(near(doubleCurrent.power / base.power, 2, 1e-12), "power scales with current");
    assert(near(doubleLoad.bandwidth / base.bandwidth, 0.5, 1e-12), "bandwidth scales inversely with load");
    assert(near(base.gain, 8 * base.state.gmid, 1e-12), "gain proxy identity");
    assert(base.neededArea > 0 && fourArea.meetsTarget, "area target calculation");
    return { checks: checks };
  }

  return { mount: mount, calculate: calculate, selfTest: selfTest };
});
