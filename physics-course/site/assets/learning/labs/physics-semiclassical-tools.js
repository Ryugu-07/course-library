(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-semiclassical-tools", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-semiclassical-tools self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-semiclassical-tools self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-semiclassical-tools-styles";
  var STYLE_TEXT = [
    ".pst-lab{--pst-blue:var(--cl-blue,#315f9d);--pst-green:var(--cl-green,#39734d);--pst-gold:var(--cl-gold,#9b6a12);--pst-red:var(--cl-red,#b64335);color:var(--fg);line-height:1.55;max-width:100%;min-width:0;overflow-wrap:anywhere}",
    ".pst-lab *,.pst-lab *::before,.pst-lab *::after{box-sizing:border-box}.pst-lab [hidden]{display:none!important}.pst-lab h3,.pst-lab h4{margin:0;letter-spacing:0}.pst-lab h3{font-size:1.15rem}.pst-lab p{margin:.65em 0}.pst-lab button,.pst-lab input{font:inherit;letter-spacing:0}.pst-lab button{min-width:0;min-height:44px;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pst-lab button:hover{border-color:var(--pst-blue)}.pst-lab button:focus-visible,.pst-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pst-lab button[aria-pressed=true],.pst-lab .pst-primary{background:var(--pst-blue);border-color:var(--pst-blue);color:var(--bg);font-weight:750}.pst-note,.pst-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.pst-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pst-gold);background:var(--block-bg,var(--bg))}.pst-question{margin:0 0 12px;padding:0;border:0}.pst-question:last-of-type{margin-bottom:0}.pst-question legend{max-width:100%;margin-bottom:7px;font-size:13px;font-weight:750;line-height:1.5}.pst-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pst-choices button{font-size:12px}.pst-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.pst-actions>*{flex:1 1 170px}.pst-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pst-pass{color:var(--pst-green)}.pst-warn{color:var(--pst-red)}.pst-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pst-modes{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}.pst-modes button{flex:1 1 150px}.pst-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0;align-items:end}.pst-control{display:grid;gap:5px;min-width:0}.pst-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.pst-control output{color:var(--pst-blue);font-variant-numeric:tabular-nums}.pst-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--pst-blue)}.pst-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}.pst-panel{margin-top:8px}.pst-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pst-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--fg-soft);font-size:13px}.pst-stage svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.pst-stage svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pst-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.14}.pst-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.65}.pst-curve{fill:none;stroke:var(--pst-blue);stroke-width:2.7}.pst-secondary{fill:none;stroke:var(--pst-gold);stroke-width:2.4;stroke-dasharray:6 4}.pst-marker{fill:var(--pst-red);stroke:var(--bg);stroke-width:1.5}.pst-label{font-size:11px;fill:var(--fg-soft)}.pst-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.pst-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.pst-metric:nth-child(4n+1){border-color:var(--pst-blue)}.pst-metric:nth-child(4n+2){border-color:var(--pst-gold)}.pst-metric:nth-child(4n+3){border-color:var(--pst-green)}.pst-metric:nth-child(4n+4){border-color:var(--pst-red)}.pst-metric span{display:block;color:var(--fg-soft);font-size:11px}.pst-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pst-formula{margin:12px 0 0;padding:9px 11px;border-left:3px solid var(--pst-blue);background:var(--bg);font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65;overflow-x:auto}.pst-reset{margin-top:10px;color:var(--fg-soft)}@media(max-width:900px){.pst-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.pst-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.pst-choices{grid-template-columns:minmax(0,1fr)}.pst-controls,.pst-metrics{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.pst-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");
  var ID_SERIAL = 0;

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function uniqueId(prefix) { ID_SERIAL += 1; return prefix + "-" + ID_SERIAL; }
  function number(value, fallback) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    var text = Math.abs(value) > 0 && Math.abs(value) < 0.001 ? value.toExponential(Math.min(places, 4)) : value.toFixed(places);
    return text.indexOf(".") < 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function appendChildren(node, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }
  function element(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElement(tag), attrs), children); }
  function svgElement(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function installStyles(doc) {
    if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }
  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "pst-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }

  function wkbOscillator(n) {
    var index = Math.round(clamp(number(n, 0), 0, 12));
    var energy = index + 0.5;
    return { n: index, energy: energy, turningPoint: Math.sqrt(2 * energy), action: 2 * Math.PI * energy, actionOverHbar: index + 0.5 };
  }

  function wkbPlotBounds(n) {
    var result = wkbOscillator(n);
    var xMax = Math.max(2.6, result.turningPoint * 1.25);
    var yMax = Math.max(4, result.energy * 1.25, xMax * xMax / 2 * 1.05);
    return { xMin: -xMax, xMax: xMax, yMax: yMax };
  }

  function variationalGaussian(a) {
    var width = clamp(number(a, 1), 0.125, 8);
    var kinetic = width / 4;
    var potential = 1 / (4 * width);
    return { a: width, kinetic: kinetic, potential: potential, energy: kinetic + potential, exactGround: 0.5, excess: kinetic + potential - 0.5 };
  }

  function adiabaticMetric(s, coupling, rate) {
    var detuning = number(s, 0);
    var gapCoupling = Math.abs(number(coupling, 0.2));
    var sweepRate = Math.abs(number(rate, 0.005));
    var radius = Math.sqrt(detuning * detuning + gapCoupling * gapCoupling);
    var gap = 2 * radius;
    var epsilon = radius > 0 ? gapCoupling * sweepRate / (4 * radius * radius * radius) : Infinity;
    return { s: detuning, coupling: gapCoupling, rate: sweepRate, radius: radius, gap: gap, epsilon: epsilon, firstBasisProbability: radius > 0 ? (1 - detuning / radius) / 2 : 0.5 };
  }

  function initialState() {
    return { mode: "wkb", n: 0, a: 4, s: 0, coupling: 0.2, rate: 0.005, predictions: [null, null, null, null], revealed: false };
  }

  function resetState(state) {
    var target = state || {};
    var defaults = initialState();
    Object.keys(defaults).forEach(function (key) { target[key] = Array.isArray(defaults[key]) ? defaults[key].slice() : defaults[key]; });
    return target;
  }

  function makeRange(doc, parent, label, key, min, max, step, digits, suffix, state, onInput) {
    var inputId = uniqueId("pst-" + key);
    var output = element(doc, "output", { for: inputId, text: format(state[key], digits) + suffix });
    var input = element(doc, "input", { id: inputId, type: "range", min: min, max: max, step: step, value: state[key], "aria-label": label });
    input.addEventListener("input", function () {
      state[key] = Number(input.value);
      output.textContent = format(state[key], digits) + suffix;
      onInput();
    });
    var maxScale = element(doc, "span", { text: String(max) + suffix });
    parent.appendChild(element(doc, "div", { className: "pst-control" }, [element(doc, "label", { "for": inputId, text: label }), output, input, element(doc, "div", { className: "pst-scale" }, [element(doc, "span", { text: String(min) + suffix }), maxScale])]));
    return { key: key, input: input, output: output, digits: digits, suffix: suffix, maxScale: maxScale };
  }

  function drawChart(doc, chart, mode, state) {
    clear(chart);
    chart.appendChild(svgElement(doc, "title", { text: mode === "wkb" ? "谐振子 WKB 作用量" : mode === "variational" ? "高斯试探态变分能量" : "两能级绝热能隙与绝热参数" }));
    chart.appendChild(svgElement(doc, "desc", { text: "图形把控制参数、近似量和精确或失效边界放在同一坐标中。" }));
    var left = 52;
    var right = 638;
    var top = 34;
    var bottom = 274;
    function line(x1, y1, x2, y2, className) { chart.appendChild(svgElement(doc, "line", { class: className || "pst-axis", x1: x1, y1: y1, x2: x2, y2: y2 })); }
    function text(x, y, value, attrs) { chart.appendChild(svgElement(doc, "text", Object.assign({ class: "pst-label", x: x, y: y }, attrs || {}), [value])); }
    if (mode === "wkb") {
      var width = right - left;
      var e = wkbOscillator(state.n);
      var bounds = wkbPlotBounds(state.n);
      var xMin = bounds.xMin;
      var xMax = bounds.xMax;
      function sx(x) { return left + (x - xMin) / (xMax - xMin) * width; }
      function sy(value) { return bottom - value / bounds.yMax * (bottom - top); }
      line(left, bottom, right, bottom, "pst-axis");
      line(sx(0), top, sx(0), bottom, "pst-grid");
      var potential = [];
      for (var i = 0; i <= 120; i += 1) {
        var x = xMin + (xMax - xMin) * i / 120;
        potential.push(sx(x).toFixed(1) + "," + sy(x * x / 2).toFixed(1));
      }
      chart.appendChild(svgElement(doc, "polyline", { class: "pst-curve", points: potential.join(" ") }));
      line(sx(-e.turningPoint), sy(e.energy), sx(e.turningPoint), sy(e.energy), "pst-secondary");
      chart.appendChild(svgElement(doc, "circle", { class: "pst-marker", cx: sx(0), cy: sy(e.energy), r: 5 }));
      text(left, top - 8, "V(x)=x²/2；蓝：势阱，金：Eₙ");
      text(right, bottom + 20, "x", { "text-anchor": "end" });
      text(sx(e.turningPoint), sy(e.energy) - 9, "转折点 ±" + format(e.turningPoint, 2), { "text-anchor": "middle" });
      text(left + 6, sy(e.energy) - 9, "Eₙ=" + format(e.energy, 3));
      text(right - 8, top + 14, "∮p dx / 2πℏ=" + format(e.actionOverHbar, 2), { "text-anchor": "end" });
    } else if (mode === "variational") {
      var logMin = Math.log(0.125);
      var logMax = Math.log(8);
      function sxA(a) { return left + (Math.log(a) - logMin) / (logMax - logMin) * (right - left); }
      function syA(value) { return bottom - (value - 0.45) / 3.7 * (bottom - top); }
      line(left, bottom, right, bottom, "pst-axis");
      line(sxA(1), top, sxA(1), bottom, "pst-grid");
      var curve = [];
      for (var j = 0; j <= 120; j += 1) {
        var a = Math.exp(logMin + (logMax - logMin) * j / 120);
        curve.push(sxA(a).toFixed(1) + "," + syA(variationalGaussian(a).energy).toFixed(1));
      }
      chart.appendChild(svgElement(doc, "polyline", { class: "pst-curve", points: curve.join(" ") }));
      line(left, syA(0.5), right, syA(0.5), "pst-secondary");
      var v = variationalGaussian(state.a);
      chart.appendChild(svgElement(doc, "circle", { class: "pst-marker", cx: sxA(v.a), cy: syA(v.energy), r: 5 }));
      text(left, top - 8, "E(a)=a/4+1/(4a)");
      text(sxA(1), bottom + 20, "a=1：精确基态", { "text-anchor": "middle" });
      text(right, syA(0.5) - 8, "E₀=1/2", { "text-anchor": "end" });
      text(sxA(v.a), syA(v.energy) - 10, "当前 E=" + format(v.energy, 3), { "text-anchor": "middle" });
    } else {
      var ad = adiabaticMetric(state.s, state.coupling, state.rate);
      function sxS(s) { return left + (s + 1) / 2 * (right - left); }
      function syGap(value) { return bottom - value / 2.1 * (bottom - top); }
      function syEps(value) { return bottom - clamp(value, 0, 1.2) / 1.2 * (bottom - top); }
      line(left, bottom, right, bottom, "pst-axis");
      line(sxS(0), top, sxS(0), bottom, "pst-grid");
      var gapPoints = [];
      var epsPoints = [];
      for (var k = 0; k <= 120; k += 1) {
        var s = -1 + 2 * k / 120;
        var m = adiabaticMetric(s, state.coupling, state.rate);
        gapPoints.push(sxS(s).toFixed(1) + "," + syGap(m.gap).toFixed(1));
        epsPoints.push(sxS(s).toFixed(1) + "," + syEps(m.epsilon).toFixed(1));
      }
      chart.appendChild(svgElement(doc, "polyline", { class: "pst-curve", points: gapPoints.join(" ") }));
      chart.appendChild(svgElement(doc, "polyline", { class: "pst-secondary", points: epsPoints.join(" ") }));
      chart.appendChild(svgElement(doc, "circle", { class: "pst-marker", cx: sxS(state.s), cy: syGap(ad.gap), r: 5 }));
      text(left, top - 8, "蓝：Δ(s)=2√(s²+g²)；金：ε(s)");
      text(right, bottom + 20, "s", { "text-anchor": "end" });
      text(left + 7, syGap(ad.gap) - 9, "当前 Δ=" + format(ad.gap, 3));
      text(right - 8, syEps(Math.min(ad.epsilon, 1.2)) - 9, "ε=" + format(ad.epsilon, 3), { "text-anchor": "end" });
      text(sxS(0), top + 15, "最小 gap=2g", { "text-anchor": "middle" });
    }
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    root.classList.add("pst-lab");
    clear(root);
    var state = initialState();
    var questions = [
      { prompt: "无量纲谐振子 n=0 的 WKB 能量？", options: ["ℏω/2", "0", "ℏω"], answer: 0 },
      { prompt: "高斯试探态 a=4 的 E 与精确基态相比？", options: ["更低", "相同", "更高，为 1.0625ℏω"], answer: 2 },
      { prompt: "把两能级扫描速度减半，绝热参数 ε 怎样？", options: ["减半，更容易绝热", "加倍", "不变"], answer: 0 },
      { prompt: "WKB 最先在哪一处需要警惕？", options: ["势能恒定处", "经典转折点 p=0 处", "远离势阱的量纲处"], answer: 1 }
    ];
    root.appendChild(element(doc, "h3", { text: "预测闸门：同一条近似，边界各不相同" }));
    root.appendChild(element(doc, "p", { className: "pst-note", text: "先判断作用量、变分上界和最小能隙；揭示后可切换三种工具并改变参数。单位暂取 ℏ=ω=m=1。" }));
    var prediction = element(doc, "div", { className: "pst-prediction" });
    var choiceButtons = [];
    questions.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset", { className: "pst-question" });
      fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
      var choices = element(doc, "div", { className: "pst-choices" });
      choiceButtons[questionIndex] = [];
      question.options.forEach(function (label, optionIndex) {
        var button = element(doc, "button", { type: "button", text: label, "aria-pressed": "false" });
        button.addEventListener("click", function () {
          state.predictions[questionIndex] = optionIndex;
          choiceButtons[questionIndex].forEach(function (item) { item.setAttribute("aria-pressed", "false"); });
          button.setAttribute("aria-pressed", "true");
        });
        choiceButtons[questionIndex].push(button);
        choices.appendChild(button);
      });
      fieldset.appendChild(choices);
      prediction.appendChild(fieldset);
    });
    var feedback = element(doc, "p", { className: "pst-feedback", "aria-live": "polite" });
    var actions = element(doc, "div", { className: "pst-actions" });
    var reveal = element(doc, "button", { type: "button", className: "pst-primary", text: "揭示模型" });
    var clearPredictions = element(doc, "button", { type: "button", text: "清空预测" });
    actions.appendChild(reveal);
    actions.appendChild(clearPredictions);
    prediction.appendChild(actions);
    prediction.appendChild(feedback);
    root.appendChild(prediction);

    var revealed = element(doc, "div", { className: "pst-revealed", hidden: true });
    revealed.appendChild(element(doc, "h4", { text: "三台近似工具" }));
    var modes = element(doc, "div", { className: "pst-modes", role: "group", "aria-label": "选择半经典工具" });
    var modeButtons = {};
    [["wkb", "WKB 作用量"], ["variational", "变分上界"], ["adiabatic", "绝热扫描"]].forEach(function (item) {
      var button = element(doc, "button", { type: "button", text: item[1], "aria-pressed": item[0] === state.mode ? "true" : "false" });
      button.addEventListener("click", function () {
        state.mode = item[0];
        Object.keys(modeButtons).forEach(function (key) { modeButtons[key].setAttribute("aria-pressed", key === state.mode ? "true" : "false"); });
        Object.keys(panels).forEach(function (key) { panels[key].hidden = key !== state.mode; });
        render();
      });
      modeButtons[item[0]] = button;
      modes.appendChild(button);
    });
    revealed.appendChild(modes);
    var panels = {};
    var rangeControls = {};
    var controls = element(doc, "div", { className: "pst-controls" });
    panels.wkb = element(doc, "div", { className: "pst-panel" });
    panels.variational = element(doc, "div", { className: "pst-panel", hidden: true });
    panels.adiabatic = element(doc, "div", { className: "pst-panel", hidden: true });
    rangeControls.n = makeRange(doc, panels.wkb, "量子数 n", "n", 0, 8, 1, 0, "", state, render);
    rangeControls.a = makeRange(doc, panels.variational, "高斯宽度参数 a", "a", 0.125, 8, 0.125, 3, "", state, render);
    rangeControls.s = makeRange(doc, panels.adiabatic, "扫描位置 s", "s", -1, 1, 0.01, 2, "", state, render);
    rangeControls.coupling = makeRange(doc, panels.adiabatic, "耦合 g", "coupling", 0.05, 0.5, 0.01, 2, "", state, render);
    rangeControls.rate = makeRange(doc, panels.adiabatic, "扫描速度 |ds/dt|", "rate", 0.001, 0.05, 0.001, 3, "", state, render);
    controls.appendChild(panels.wkb);
    controls.appendChild(panels.variational);
    controls.appendChild(panels.adiabatic);
    revealed.appendChild(controls);
    var stage = element(doc, "div", { className: "pst-stage" });
    var stageTitle = element(doc, "div", { className: "pst-stage-title" }, [element(doc, "span", { text: "同一坐标中的近似量与边界" }), element(doc, "span", { className: "pst-status", text: "" })]);
    var chart = svgElement(doc, "svg", { viewBox: "0 0 680 320", role: "img", "aria-label": "半经典工具可视化" });
    stage.appendChild(stageTitle);
    stage.appendChild(chart);
    revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "pst-metrics" });
    var metricNodes = [metric(doc, "主读数"), metric(doc, "边界/能隙"), metric(doc, "误差或 ε"), metric(doc, "解释")];
    metricNodes.forEach(function (item) { metrics.appendChild(item.node); });
    revealed.appendChild(metrics);
    var formula = element(doc, "div", { className: "pst-formula", text: "WKB: ∮p dx=2πℏ(n+1/2)；变分: E[ψ]≥E₀；绝热: R=√(s²+g²)，ε=|g|v/(4R³)" });
    revealed.appendChild(formula);
    var reset = element(doc, "button", { type: "button", className: "pst-reset", text: "重置实验" });
    revealed.appendChild(reset);
    root.appendChild(revealed);

    function syncControls() {
      Object.keys(rangeControls).forEach(function (key) {
        var control = rangeControls[key];
        control.input.value = state[control.key];
        control.output.textContent = format(state[control.key], control.digits) + control.suffix;
      });
      Object.keys(modeButtons).forEach(function (key) { modeButtons[key].setAttribute("aria-pressed", key === state.mode ? "true" : "false"); });
      Object.keys(panels).forEach(function (key) { panels[key].hidden = key !== state.mode; });
      revealed.hidden = !state.revealed;
    }

    function render() {
      syncControls();
      var result;
      var explanation;
      if (state.mode === "wkb") {
        result = wkbOscillator(state.n);
        metricNodes[0].value.textContent = "E=" + format(result.energy, 3) + " ℏω";
        metricNodes[1].value.textContent = "xₜ=" + format(result.turningPoint, 3);
        metricNodes[2].value.textContent = "I/(2πℏ)=" + format(result.actionOverHbar, 2);
        explanation = "势阱内可用；转折点外需接指数尾";
        formula.textContent = "I(E)=∮p dx=2πE；令 I=2π(n+1/2) 得 E=" + format(result.energy, 3) + "（ℏ=ω=1）";
      } else if (state.mode === "variational") {
        result = variationalGaussian(state.a);
        metricNodes[0].value.textContent = "E=" + format(result.energy, 4) + " ℏω";
        metricNodes[1].value.textContent = "E−E₀=" + format(result.excess, 4);
        metricNodes[2].value.textContent = "T/V=" + format(result.kinetic / result.potential, 3);
        explanation = result.excess < 1e-10 ? "达到这族试探态的最优点" : "上界：不能低于 E₀";
        formula.textContent = "E(a)=T+V=a/4+1/(4a)；a=" + format(result.a, 3) + "，E₀=1/2";
      } else {
        result = adiabaticMetric(state.s, state.coupling, state.rate);
        metricNodes[0].value.textContent = "Δ=" + format(result.gap, 4);
        metricNodes[1].value.textContent = "p₁(g.s.)=" + format(result.firstBasisProbability, 3);
        metricNodes[2].value.textContent = "ε=" + format(result.epsilon, 4);
        explanation = result.epsilon < 0.1 ? "慢扫候选：ε≪1" : result.epsilon < 1 ? "过渡区：要检验非绝热跃迁" : "快扫：绝热近似危险";
        formula.textContent = "R=√(s²+g²)；Δ=2R；ε=|g|v/(4R³)；当前 s=" + format(result.s, 2);
      }
      metricNodes[3].value.textContent = explanation;
      stageTitle.querySelector(".pst-status").textContent = state.mode === "adiabatic" && result.epsilon < 0.1 ? "绝热条件较好" : state.mode === "variational" ? "基态上界" : "近似需看边界";
      drawChart(doc, chart, state.mode, state);
    }
    reveal.addEventListener("click", function () {
      if (state.predictions.some(function (value) { return value === null; })) {
        feedback.className = "pst-feedback pst-warn";
        feedback.textContent = "请先完成四个预测，再揭示三台工具。";
        return;
      }
      var score = state.predictions.reduce(function (sum, value, index) { return sum + (value === questions[index].answer ? 1 : 0); }, 0);
      feedback.className = "pst-feedback " + (score === questions.length ? "pst-pass" : "pst-warn");
      feedback.textContent = "预测命中 " + score + "/" + questions.length + "；现在切换工具，观察各自的边界。";
      state.revealed = true;
      render();
      announce(api, root, feedback.textContent);
    });
    clearPredictions.addEventListener("click", function () {
      state.predictions = [null, null, null, null];
      choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); });
      feedback.className = "pst-feedback";
      feedback.textContent = "预测已清空。";
    });
    reset.addEventListener("click", function () {
      resetState(state);
      choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); });
      feedback.className = "pst-feedback";
      feedback.textContent = "实验已重置并上锁。";
      render();
      announce(api, root, "半经典工具实验已重置。");
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) { checks += 1; if (!condition) throw new Error("physics-semiclassical-tools self-test failed: " + message); }
    function close(left, right, tolerance, message) { assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")"); }
    close(wkbOscillator(0).energy, 0.5, 1e-12, "ground WKB oscillator energy");
    close(wkbOscillator(3).actionOverHbar, 3.5, 1e-12, "WKB action quantization");
    close(variationalGaussian(4).energy, 1.0625, 1e-12, "Gaussian variational energy");
    close(variationalGaussian(1).energy, 0.5, 1e-12, "variational optimum");
    assert(variationalGaussian(4).energy > variationalGaussian(4).exactGround, "variational upper bound");
    close(adiabaticMetric(0, 0.2, 0.005).gap, 0.4, 1e-12, "minimum avoided-crossing gap");
    close(adiabaticMetric(0, 0.2, 0.0025).epsilon, adiabaticMetric(0, 0.2, 0.005).epsilon / 2, 1e-12, "slower sweep");
    close(adiabaticMetric(0, 0.2, 0.005).epsilon, 0.03125, 1e-12, "absolute adiabatic epsilon formula");
    close(adiabaticMetric(0, -0.2, -0.005).epsilon, 0.03125, 1e-12, "absolute coupling and rate convention");
    assert(adiabaticMetric(0, 0.2, 0.005).epsilon < 1, "default is not fully sudden");
    assert(wkbOscillator(2).turningPoint > wkbOscillator(0).turningPoint, "higher state has wider turning points");
    var highStateBounds = wkbPlotBounds(8);
    assert(highStateBounds.xMax > wkbOscillator(8).turningPoint && highStateBounds.yMax > wkbOscillator(8).energy, "WKB n=8 plot bounds");
    var reset = initialState(); reset.mode = "adiabatic"; reset.n = 8; reset.predictions[0] = 2; resetState(reset);
    assert(reset.mode === "wkb" && reset.n === 0 && reset.predictions.every(function (value) { return value === null; }) && reset.revealed === false, "pure reset state");
    return { checks: checks };
  }

  return { wkbOscillator: wkbOscillator, wkbPlotBounds: wkbPlotBounds, variationalGaussian: variationalGaussian, adiabaticMetric: adiabaticMetric, initialState: initialState, resetState: resetState, mount: mount, selfTest: selfTest };
});
