(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-nuclear-detector", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-nuclear-detector self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-nuclear-detector self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-nuclear-detector-styles";
  var STYLE_TEXT = [
    ".pndt-lab{--pndt-blue:var(--cl-blue,#315f9d);--pndt-green:var(--cl-green,#39734d);--pndt-gold:var(--cl-gold,#9b6a12);--pndt-red:var(--cl-red,#b64335);color:var(--fg);line-height:1.55;max-width:100%;min-width:0;overflow-wrap:anywhere}",
    ".pndt-lab *,.pndt-lab *::before,.pndt-lab *::after{box-sizing:border-box}.pndt-lab [hidden]{display:none!important}.pndt-lab h3,.pndt-lab h4{margin:0;letter-spacing:0}.pndt-lab h3{font-size:1.15rem}.pndt-lab p{margin:.65em 0}.pndt-lab button,.pndt-lab input,.pndt-lab select{font:inherit;letter-spacing:0}.pndt-lab button,.pndt-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pndt-lab button:hover{border-color:var(--pndt-blue)}.pndt-lab button:focus-visible,.pndt-lab input:focus-visible,.pndt-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pndt-lab button[aria-pressed=true],.pndt-lab .pndt-primary{background:var(--pndt-blue);border-color:var(--pndt-blue);color:var(--bg);font-weight:750}.pndt-note,.pndt-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.pndt-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pndt-gold);background:var(--block-bg,var(--bg))}.pndt-question{margin:0 0 12px;padding:0;border:0}.pndt-question:last-of-type{margin-bottom:0}.pndt-question legend{max-width:100%;margin-bottom:7px;font-size:13px;font-weight:750;line-height:1.5}.pndt-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pndt-choices button{font-size:12px}.pndt-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.pndt-actions>*{flex:1 1 170px}.pndt-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pndt-pass{color:var(--pndt-green)}.pndt-warn{color:var(--pndt-red)}.pndt-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pndt-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0;align-items:end}.pndt-control{display:grid;gap:5px;min-width:0}.pndt-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.pndt-control output{color:var(--pndt-blue);font-variant-numeric:tabular-nums}.pndt-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--pndt-blue)}.pndt-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}.pndt-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pndt-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--fg-soft);font-size:13px}.pndt-stage svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.pndt-stage svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pndt-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.65}.pndt-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.14}.pndt-curve{fill:none;stroke:var(--pndt-blue);stroke-width:2.7}.pndt-secondary{fill:none;stroke:var(--pndt-gold);stroke-width:2.2;stroke-dasharray:6 4}.pndt-marker{fill:var(--pndt-red);stroke:var(--bg);stroke-width:1.5}.pndt-bar{fill:var(--pndt-green);fill-opacity:.78}.pndt-label{font-size:11px;fill:var(--fg-soft)}.pndt-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.pndt-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.pndt-metric:nth-child(4n+1){border-color:var(--pndt-blue)}.pndt-metric:nth-child(4n+2){border-color:var(--pndt-gold)}.pndt-metric:nth-child(4n+3){border-color:var(--pndt-green)}.pndt-metric:nth-child(4n+4){border-color:var(--pndt-red)}.pndt-metric span{display:block;color:var(--fg-soft);font-size:11px}.pndt-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pndt-formula{margin:12px 0 0;padding:9px 11px;border-left:3px solid var(--pndt-blue);background:var(--bg);font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65;overflow-x:auto}.pndt-reset{margin-top:10px;color:var(--fg-soft)}@media(max-width:900px){.pndt-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.pndt-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.pndt-choices{grid-template-columns:minmax(0,1fr)}.pndt-controls,.pndt-metrics{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.pndt-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  var REACTIONS = [
    { id: "li7pn", label: "⁷Li(p,n)⁷Be", q: -1.644, massRatio: 1 / 7 },
    { id: "dt3he", label: "²H(d,n)³He", q: 3.268, massRatio: 2 / 2 },
    { id: "c12pg", label: "¹²C(p,γ)¹³N", q: 1.944, massRatio: 1 / 12 }
  ];
  var ID_SERIAL = 0;

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function uniqueId(prefix) { ID_SERIAL += 1; return prefix + "-" + ID_SERIAL; }
  function finite(value, fallback) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
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
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style);
  }
  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "pndt-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }
  function reactionById(id) { return REACTIONS.filter(function (reaction) { return reaction.id === id; })[0] || REACTIONS[0]; }

  function reactionLedger(input) {
    var source = input || {};
    var reaction = reactionById(source.reaction);
    var energy = clamp(finite(Number(source.energy), 3), 0, 12);
    var sigmaBarn = clamp(finite(Number(source.sigmaBarn), 0.5), 0.01, 5);
    var arealDensity = clamp(finite(Number(source.arealDensity), 1e21), 1e20, 1e23);
    var flux = clamp(finite(Number(source.flux), 1e6), 1e4, 1e7);
    var illuminatedArea = clamp(finite(Number(source.illuminatedArea), 1), 0.1, 100);
    var efficiency = clamp(finite(Number(source.efficiency), 0.65), 0.1, 1);
    var liveTime = clamp(finite(Number(source.liveTime), 10), 1, 60);
    var threshold = reaction.q < 0 ? -reaction.q * (1 + reaction.massRatio) : 0;
    var allowed = energy >= threshold;
    var opticalDepth = arealDensity * sigmaBarn * 1e-24;
    var interactionProbability = allowed ? 1 - Math.exp(-opticalDepth) : 0;
    var incomingRate = flux * illuminatedArea;
    var incidentRate = incomingRate * interactionProbability;
    var detectedRate = incidentRate * efficiency;
    var expectedCounts = detectedRate * liveTime;
    var poissonRms = Math.sqrt(expectedCounts);
    var relativePoisson = expectedCounts > 0 ? 1 / poissonRms : Infinity;
    var centerOfMassEnergy = energy / (1 + reaction.massRatio);
    return { reaction: reaction, energy: energy, sigmaBarn: sigmaBarn, arealDensity: arealDensity, flux: flux, illuminatedArea: illuminatedArea, efficiency: efficiency, liveTime: liveTime, threshold: threshold, allowed: allowed, opticalDepth: opticalDepth, interactionProbability: interactionProbability, incomingRate: incomingRate, incidentRate: incidentRate, detectedRate: detectedRate, expectedCounts: expectedCounts, poissonRms: poissonRms, relativePoisson: relativePoisson, centerOfMassEnergy: centerOfMassEnergy };
  }

  function initialState() {
    return { reaction: "li7pn", energy: 3, sigmaBarn: 0.5, arealDensity: 1e21, flux: 1e6, illuminatedArea: 1, efficiency: 0.65, liveTime: 10, predictions: [null, null, null, null], revealed: false };
  }

  function resetState(state) {
    var target = state || {};
    var defaults = initialState();
    Object.keys(defaults).forEach(function (key) { target[key] = Array.isArray(defaults[key]) ? defaults[key].slice() : defaults[key]; });
    return target;
  }

  function makeRange(doc, parent, label, key, min, max, step, digits, suffix, state, onInput) {
    var inputId = uniqueId("pndt-" + key);
    var output = element(doc, "output", { for: inputId, text: format(state[key], digits) + suffix });
    var input = element(doc, "input", { id: inputId, type: "range", min: min, max: max, step: step, value: state[key], "aria-label": label });
    input.addEventListener("input", function () { state[key] = Number(input.value); output.textContent = format(state[key], digits) + suffix; onInput(); });
    var maxScale = element(doc, "span", { text: String(max) + suffix });
    parent.appendChild(element(doc, "div", { className: "pndt-control" }, [element(doc, "label", { "for": inputId, text: label }), output, input, element(doc, "div", { className: "pndt-scale" }, [element(doc, "span", { text: String(min) + suffix }), maxScale])]));
    return { key: key, input: input, output: output, digits: digits, suffix: suffix, maxScale: maxScale };
  }

  function drawChart(doc, chart, result) {
    clear(chart);
    chart.appendChild(svgElement(doc, "title", { text: "核反应阈值、反应率与计数噪声" }));
    chart.appendChild(svgElement(doc, "desc", { text: "左图把阈值以上的简化反应率画出，右图比较入射、相互作用和探测后的计数预算。" }));
    var left = 52;
    var split = 344;
    var right = 638;
    var top = 34;
    var bottom = 274;
    function line(x1, y1, x2, y2, className) { chart.appendChild(svgElement(doc, "line", { class: className || "pndt-axis", x1: x1, y1: y1, x2: x2, y2: y2 })); }
    function text(x, y, value, attrs) { chart.appendChild(svgElement(doc, "text", Object.assign({ class: "pndt-label", x: x, y: y }, attrs || {}), [value])); }
    function sx(energy) { return left + 22 + energy / 12 * (split - left - 42); }
    function sy(rate) { return bottom - rate / Math.max(result.detectedRate * 1.25, 1) * (bottom - top); }
    line(left + 22, bottom, split - 20, bottom, "pndt-axis");
    line(left + 22, top, left + 22, bottom, "pndt-axis");
    var ratePoints = [];
    for (var i = 0; i <= 100; i += 1) {
      var energy = 12 * i / 100;
      var probe = reactionLedger({ reaction: result.reaction.id, energy: energy, sigmaBarn: result.sigmaBarn, arealDensity: result.arealDensity, flux: result.flux, illuminatedArea: result.illuminatedArea, efficiency: result.efficiency, liveTime: result.liveTime });
      ratePoints.push(sx(energy).toFixed(1) + "," + sy(probe.detectedRate).toFixed(1));
    }
    chart.appendChild(svgElement(doc, "polyline", { class: "pndt-curve", points: ratePoints.join(" ") }));
    line(sx(result.threshold), top, sx(result.threshold), bottom, "pndt-secondary");
    chart.appendChild(svgElement(doc, "circle", { class: "pndt-marker", cx: sx(result.energy), cy: sy(result.detectedRate), r: 5 }));
    text(left + 26, top - 8, "探测率 /s（σ 固定的教学模型）");
    text(split - 23, bottom + 20, "E_lab /MeV", { "text-anchor": "end" });
    text(sx(result.threshold) + 4, top + 15, "阈值 " + format(result.threshold, 2), {});
    text(sx(result.energy), sy(result.detectedRate) - 9, format(result.detectedRate, 1) + "/s", { "text-anchor": "middle" });
    line(split + 12, bottom, right - 10, bottom, "pndt-axis");
    line(split + 12, top, split + 12, bottom, "pndt-axis");
    var values = [result.incomingRate, result.incidentRate, result.detectedRate];
    var labels = ["入射总率", "反应", "探测"];
    var maxValue = Math.max.apply(null, values.concat([1]));
    values.forEach(function (value, index) {
      var x = split + 34 + index * 86;
      var y = bottom - value / maxValue * (bottom - top);
      chart.appendChild(svgElement(doc, "rect", { class: "pndt-bar", x: x, y: y, width: 42, height: bottom - y, rx: 2 }));
      text(x + 21, bottom + 18, labels[index], { "text-anchor": "middle" });
      text(x + 21, Math.max(top + 12, y - 7), format(value, value > 1000 ? 0 : 2), { "text-anchor": "middle" });
    });
    text(split + 18, top - 8, "计数预算 /s（ΦA）");
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument; installStyles(doc); root.classList.add("pndt-lab"); clear(root);
    var state = initialState();
    var questions = [
      { prompt: "⁷Li(p,n)⁷Be 的 Q<0 时，低于阈值的事件率？", options: ["在本模型中为 0", "只减半", "与能量无关"], answer: 0 },
      { prompt: "薄靶中把靶面密度加倍，光学厚度很小时 P 约怎样？", options: ["加倍", "减半", "不变"], answer: 0 },
      { prompt: "期望计数 N=10,000 的 Poisson RMS？", options: ["100", "10,000", "1"], answer: 0 },
      { prompt: "探测效率从 0.5 提到 1，会不会改变入射束流？", options: ["会，束流也加倍", "不会，只改变被记录的计数", "只改变 Q 值"], answer: 1 }
    ];
    root.appendChild(element(doc, "h3", { text: "预测闸门：事件从束流走到计数器要过几道门？" }));
    root.appendChild(element(doc, "p", { className: "pndt-note", text: "先判断反应阈值、薄靶近似和 Poisson 误差；揭示后可调能量、靶厚、效率与观测时间。通量 Φ 是 cm⁻²s⁻¹ 的面密度，显式乘照射面积 A_illum（cm²）得到入射总率。" }));
    var prediction = element(doc, "div", { className: "pndt-prediction" });
    var choiceButtons = [];
    questions.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset", { className: "pndt-question" });
      fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
      var choices = element(doc, "div", { className: "pndt-choices" }); choiceButtons[questionIndex] = [];
      question.options.forEach(function (label, optionIndex) {
        var button = element(doc, "button", { type: "button", text: label, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[questionIndex] = optionIndex; choiceButtons[questionIndex].forEach(function (item) { item.setAttribute("aria-pressed", "false"); }); button.setAttribute("aria-pressed", "true"); });
        choiceButtons[questionIndex].push(button); choices.appendChild(button);
      });
      fieldset.appendChild(choices); prediction.appendChild(fieldset);
    });
    var feedback = element(doc, "p", { className: "pndt-feedback", "aria-live": "polite" });
    var actions = element(doc, "div", { className: "pndt-actions" });
    var reveal = element(doc, "button", { type: "button", className: "pndt-primary", text: "揭示事件账本" });
    var clearPredictions = element(doc, "button", { type: "button", text: "清空预测" });
    actions.appendChild(reveal); actions.appendChild(clearPredictions); prediction.appendChild(actions); prediction.appendChild(feedback); root.appendChild(prediction);
    var revealed = element(doc, "div", { className: "pndt-revealed", hidden: true });
    revealed.appendChild(element(doc, "h4", { text: "反应阈值与探测链" }));
    var controls = element(doc, "div", { className: "pndt-controls" });
    var rangeControls = {};
    var reactionSelectId = uniqueId("pndt-reaction-select");
    var reactionSelect = element(doc, "select", { id: reactionSelectId, "aria-label": "反应通道" });
    REACTIONS.forEach(function (reaction) { reactionSelect.appendChild(element(doc, "option", { value: reaction.id, text: reaction.label })); });
    reactionSelect.value = state.reaction;
    reactionSelect.addEventListener("change", function () { state.reaction = reactionSelect.value; render(); });
    controls.appendChild(element(doc, "div", { className: "pndt-control" }, [element(doc, "label", { "for": reactionSelectId, text: "反应通道" }), reactionSelect]));
    rangeControls.energy = makeRange(doc, controls, "束流能量 E_lab", "energy", 0, 12, 0.05, 2, " MeV", state, render);
    rangeControls.sigmaBarn = makeRange(doc, controls, "截面 σ", "sigmaBarn", 0.01, 5, 0.01, 2, " b", state, render);
    rangeControls.arealDensity = makeRange(doc, controls, "靶面密度 nℓ", "arealDensity", 1e20, 1e23, 1e20, 2, " cm⁻²", state, render);
    rangeControls.flux = makeRange(doc, controls, "通量 Φ", "flux", 1e4, 1e7, 1e4, 0, " cm⁻²s⁻¹", state, render);
    rangeControls.illuminatedArea = makeRange(doc, controls, "照射面积 A_illum", "illuminatedArea", 0.1, 100, 0.1, 1, " cm²", state, render);
    rangeControls.efficiency = makeRange(doc, controls, "探测效率 ε", "efficiency", 0.1, 1, 0.01, 2, "", state, render);
    rangeControls.liveTime = makeRange(doc, controls, "活时间 T", "liveTime", 1, 60, 1, 0, " s", state, render);
    revealed.appendChild(controls);
    var stage = element(doc, "div", { className: "pndt-stage" });
    var stageTitle = element(doc, "div", { className: "pndt-stage-title" }, [element(doc, "span", { text: "左：阈值响应；右：从入射到探测的预算" }), element(doc, "span", { className: "pndt-status", text: "" })]);
    var chart = svgElement(doc, "svg", { viewBox: "0 0 680 320", role: "img", "aria-label": "核反应阈值和探测计数图" });
    stage.appendChild(stageTitle); stage.appendChild(chart); revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "pndt-metrics" });
    var metricNodes = [metric(doc, "阈值 E_th"), metric(doc, "相互作用概率"), metric(doc, "探测计数 N"), metric(doc, "相对 Poisson" )];
    metricNodes.forEach(function (item) { metrics.appendChild(item.node); }); revealed.appendChild(metrics);
    var formula = element(doc, "div", { className: "pndt-formula", text: "E_th=−Q(1+m_a/m_A)（Q<0）；P=1−e⁻ⁿˡσ；N=ΦA_illumPεT；σ_N=√N" }); revealed.appendChild(formula);
    var reset = element(doc, "button", { type: "button", className: "pndt-reset", text: "重置实验" }); revealed.appendChild(reset); root.appendChild(revealed);

    function syncControls() {
      Object.keys(rangeControls).forEach(function (key) {
        var control = rangeControls[key];
        control.input.value = state[control.key];
        control.output.textContent = format(state[control.key], control.digits) + control.suffix;
      });
      reactionSelect.value = state.reaction;
      revealed.hidden = !state.revealed;
    }

    function render() {
      syncControls();
      var result = reactionLedger(state);
      metricNodes[0].value.textContent = result.threshold > 0 ? format(result.threshold, 3) + " MeV" : "0（放热）";
      metricNodes[1].value.textContent = result.allowed ? format(result.interactionProbability * 100, 4) + "%" : "0（未过阈值）";
      metricNodes[2].value.textContent = format(result.expectedCounts, 0) + " ± " + format(result.poissonRms, 1);
      metricNodes[3].value.textContent = Number.isFinite(result.relativePoisson) ? format(result.relativePoisson * 100, 2) + "%" : "—";
      stageTitle.querySelector(".pndt-status").textContent = result.allowed ? "通道打开：截面模型生效" : "通道关闭：低于运动学阈值";
      formula.textContent = "E_cm=" + format(result.centerOfMassEnergy, 3) + " MeV；ΦA=" + format(result.flux * result.illuminatedArea, 1) + "/s；P=" + format(result.interactionProbability, 6) + "；N=ΦA PεT=" + format(result.expectedCounts, 1) + "；σ_N=√N";
      drawChart(doc, chart, result);
    }
    reveal.addEventListener("click", function () { if (state.predictions.some(function (value) { return value === null; })) { feedback.className = "pndt-feedback pndt-warn"; feedback.textContent = "请先完成四个预测，再揭示事件账本。"; return; } var score = state.predictions.reduce(function (sum, value, index) { return sum + (value === questions[index].answer ? 1 : 0); }, 0); feedback.className = "pndt-feedback " + (score === questions.length ? "pndt-pass" : "pndt-warn"); feedback.textContent = "预测命中 " + score + "/" + questions.length + "；现在沿着束流、靶、探测器逐项审计。"; state.revealed = true; render(); announce(api, root, feedback.textContent); });
    clearPredictions.addEventListener("click", function () { state.predictions = [null, null, null, null]; choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "pndt-feedback"; feedback.textContent = "预测已清空。"; });
    reset.addEventListener("click", function () { resetState(state); choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "pndt-feedback"; feedback.textContent = "实验已重置并上锁。"; render(); announce(api, root, "核反应与探测实验已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) { checks += 1; if (!condition) throw new Error("physics-nuclear-detector self-test failed: " + message); }
    function close(left, right, tolerance, message) { assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")"); }
    var threshold = reactionLedger({ reaction: "li7pn", energy: 0 }).threshold;
    close(threshold, 1.644 * 8 / 7, 1e-12, "endothermic threshold");
    assert(reactionLedger({ reaction: "li7pn", energy: 1.8 }).allowed === false, "below threshold closed");
    assert(reactionLedger({ reaction: "li7pn", energy: 2 }).allowed === true, "above threshold open");
    var thin = reactionLedger({ reaction: "li7pn", energy: 3, sigmaBarn: 0.5, arealDensity: 1e21, flux: 1e6, efficiency: 0.65, liveTime: 10 });
    close(thin.interactionProbability, 1 - Math.exp(-0.0005), 1e-12, "thin-target interaction probability");
    close(thin.incomingRate, 1e6 * thin.illuminatedArea, 1e-12, "flux density times illuminated area gives incoming rate");
    close(thin.incidentRate, 1e6 * thin.illuminatedArea * thin.interactionProbability, 1e-12, "flux density times illuminated area");
    close(thin.expectedCounts, thin.detectedRate * 10, 1e-12, "count ledger");
    close(thin.relativePoisson, 1 / Math.sqrt(thin.expectedCounts), 1e-12, "Poisson relative error");
    close(reactionLedger({ reaction: "li7pn", energy: 3, illuminatedArea: 2 }).incidentRate, thin.incidentRate * 2, 1e-12, "illuminated area scaling");
    assert(reactionLedger({ reaction: "li7pn", energy: 3, arealDensity: 2e21 }).interactionProbability > thin.interactionProbability, "more target increases interaction probability");
    assert(reactionLedger({ reaction: "dt3he", energy: 0 }).threshold === 0, "exothermic threshold");
    assert(reactionLedger({ reaction: "li7pn", energy: 3, efficiency: 1 }).incidentRate === thin.incidentRate, "efficiency does not alter incident rate");
    var reset = initialState(); reset.reaction = "dt3he"; reset.illuminatedArea = 20; reset.predictions[0] = 1; reset.revealed = true; resetState(reset);
    assert(reset.reaction === "li7pn" && reset.illuminatedArea === 1 && reset.predictions.every(function (value) { return value === null; }) && reset.revealed === false, "pure reset state");
    return { checks: checks, reactions: REACTIONS.length };
  }

  return { REACTIONS: REACTIONS, reactionLedger: reactionLedger, initialState: initialState, resetState: resetState, mount: mount, selfTest: selfTest };
});
