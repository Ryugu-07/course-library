(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-coherence", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("photo-coherence self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-coherence self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var STYLE_ID = "photo-coherence-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var EPS = 1e-9;
  var PI = Math.PI;

  var STYLE_TEXT = [
    ".pco-lab{--pco-blue:var(--cl-blue,#315f9d);--pco-green:var(--cl-green,#39734d);--pco-gold:var(--cl-gold,#9b6a12);--pco-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".pco-lab *,.pco-lab *::before,.pco-lab *::after{box-sizing:border-box}.pco-lab [hidden]{display:none!important}.pco-lab h3,.pco-lab h4{margin:0;letter-spacing:0}.pco-lab h3{font-size:1.15rem}.pco-lab p{margin:.65em 0}.pco-lab button,.pco-lab input{font:inherit;letter-spacing:0}.pco-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pco-lab button:hover{border-color:var(--pco-blue)}.pco-lab button:focus-visible,.pco-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pco-lab button[aria-pressed=true],.pco-lab .pco-primary{border-color:var(--pco-blue);background:var(--pco-blue);color:var(--bg);font-weight:750}.pco-lab .pco-note,.pco-lab .pco-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.pco-lab .pco-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pco-gold);background:var(--block-bg,var(--bg))}.pco-lab .pco-question{margin:0 0 12px;padding:0;border:0}.pco-lab .pco-question:last-of-type{margin-bottom:0}.pco-lab .pco-question legend{max-width:100%;margin-bottom:7px;font-size:13px;font-weight:750;line-height:1.5}.pco-lab .pco-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pco-lab .pco-choices button{font-size:12px}.pco-lab .pco-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.pco-lab .pco-actions>*{flex:1 1 170px}.pco-lab .pco-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pco-lab .pco-pass{color:var(--pco-green)}.pco-lab .pco-warn{color:var(--pco-red)}.pco-lab .pco-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pco-lab .pco-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:12px 0;align-items:end}.pco-lab .pco-control{display:grid;gap:5px;min-width:0}.pco-lab .pco-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.pco-lab .pco-control output{color:var(--pco-blue);font-variant-numeric:tabular-nums}.pco-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--pco-blue)}.pco-lab .pco-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}.pco-lab .pco-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pco-lab .pco-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--fg-soft);font-size:13px}.pco-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.pco-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pco-lab .pco-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.14}.pco-lab .pco-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.62}.pco-lab .pco-wave{fill:none;stroke:var(--pco-blue);stroke-width:2.5}.pco-lab .pco-envelope{fill:none;stroke:var(--pco-gold);stroke-width:2.5}.pco-lab .pco-marker{stroke:var(--pco-red);stroke-width:2;stroke-dasharray:5 4}.pco-lab .pco-label{font-size:11px;fill:var(--fg-soft)}.pco-lab .pco-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:12px}.pco-lab .pco-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.pco-lab .pco-metric:nth-child(5n+1){border-color:var(--pco-blue)}.pco-lab .pco-metric:nth-child(5n+2){border-color:var(--pco-gold)}.pco-lab .pco-metric:nth-child(5n+3){border-color:var(--pco-green)}.pco-lab .pco-metric:nth-child(5n+4){border-color:var(--pco-red)}.pco-lab .pco-metric span{display:block;color:var(--fg-soft);font-size:11px}.pco-lab .pco-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pco-lab .pco-formula{margin:12px 0 0;padding:9px 11px;border-left:3px solid var(--pco-blue);background:var(--bg);font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65;overflow-x:auto}.pco-lab .pco-reset{margin-top:10px;color:var(--fg-soft)}@media(max-width:950px){.pco-lab .pco-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.pco-lab .pco-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:620px){.pco-lab .pco-choices{grid-template-columns:minmax(0,1fr)}.pco-lab .pco-controls,.pco-lab .pco-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:400px){.pco-lab .pco-controls,.pco-lab .pco-metrics{grid-template-columns:minmax(0,1fr)}.pco-lab .pco-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){.pco-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value, fallback) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function normalize(value, fallback, minimum, maximum) { return clamp(finite(Number(value), fallback), minimum, maximum); }
  function near(left, right, tolerance) { return Math.abs(left - right) <= (tolerance || EPS) * Math.max(1, Math.abs(left), Math.abs(right)); }
  function visibility(i1, i2, gamma) { return (2 * Math.sqrt(i1 * i2) / (i1 + i2)) * gamma; }
  function coherentLength(lambdaUm, bandwidthNm) { return lambdaUm * lambdaUm / (bandwidthNm * 0.001); }
  function intensity(i1, i2, gamma, phase) { return i1 + i2 + 2 * Math.sqrt(i1 * i2) * gamma * Math.cos(phase); }

  function evaluate(input) {
    var source = input || {};
    var i1 = normalize(source.i1, 1, 0.1, 4);
    var i2 = normalize(source.i2, 1, 0.1, 4);
    var gamma = normalize(source.gamma, 0.6, 0, 1);
    var phase = normalize(source.phase, 0, -PI, PI);
    var lambda = normalize(source.lambda, 0.5, 0.4, 0.7);
    var bandwidth = normalize(source.bandwidth, 0.05, 0.01, 0.2);
    var mirror = normalize(source.mirror, 0.125, 0, 10);
    var lc = coherentLength(lambda, bandwidth);
    var opd = 2 * mirror;
    var envelope = Math.exp(-Math.pow(opd / Math.max(lc, 1e-9), 2));
    var effectiveGamma = gamma * envelope;
    var max = i1 + i2 + 2 * Math.sqrt(i1 * i2) * effectiveGamma;
    var min = i1 + i2 - 2 * Math.sqrt(i1 * i2) * effectiveGamma;
    return { i1: i1, i2: i2, gamma: gamma, phase: phase, lambda: lambda, bandwidth: bandwidth, mirror: mirror, lc: lc, opd: opd, envelope: envelope, effectiveGamma: effectiveGamma, intensity: intensity(i1, i2, effectiveGamma, phase), max: max, min: min, visibility: visibility(i1, i2, effectiveGamma), cycles: opd / lambda };
  }

  function setAttributes(node, attrs) { Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", value); else if (key === "text") node.textContent = String(value); else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); }); return node; }
  function appendChildren(node, children) { (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null && child !== false) node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child))); }); return node; }
  function element(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElement(tag), attrs), children); }
  function svgElement(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function format(value, digits) { if (!Number.isFinite(value)) return "—"; var places = digits === undefined ? 3 : digits; var text = Math.abs(value) < 0.001 && value !== 0 ? value.toExponential(Math.min(places, 4)) : value.toFixed(places); return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, ""); }
  function installStyles(doc) { if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return; var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style); }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function metric(doc, label) { var value = element(doc, "strong", { text: "—" }); return { node: element(doc, "div", { className: "pco-metric" }, [element(doc, "span", { text: label }), value]), value: value }; }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc); root.classList.add("pco-lab"); clear(root);
    var state = { i1: 1, i2: 1, gamma: 0.6, phase: 0, lambda: 0.5, bandwidth: 0.05, mirror: 0.125, predictions: [null, null, null] };
    var questions = [
      { prompt: "等强光、|γ|=0.6 的可见度？", options: ["0.06", "0.6", "1.6"], answer: 1 },
      { prompt: "I₁=4、I₂=1 时，完美相干的 V 能到 1 吗？", options: ["能到 1", "不能，受不平衡限制", "只由波长决定"], answer: 1 },
      { prompt: "迈克尔逊镜子移动 λ/4，光程变化是？", options: ["λ/4", "λ/2", "λ"], answer: 1 }
    ];
    root.appendChild(element(doc, "h3", { text: "预测闸门：先让强度暴露相位" })); root.appendChild(element(doc, "p", { className: "pco-note", text: "先预测可见度、光程倍增和相干包络；揭示后再调节光强、谱宽与镜位。" }));
    var prediction = element(doc, "div", { className: "pco-prediction" }); var choiceButtons = [];
    questions.forEach(function (question, questionIndex) { var fieldset = element(doc, "fieldset", { className: "pco-question" }); fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt })); var choices = element(doc, "div", { className: "pco-choices" }); question.options.forEach(function (label, optionIndex) { var button = element(doc, "button", { type: "button", text: label, "aria-pressed": "false", onclick: function () { state.predictions[questionIndex] = optionIndex; choiceButtons[questionIndex].forEach(function (item) { item.setAttribute("aria-pressed", "false"); }); button.setAttribute("aria-pressed", "true"); } }); choices.appendChild(button); if (!choiceButtons[questionIndex]) choiceButtons[questionIndex] = []; choiceButtons[questionIndex].push(button); }); fieldset.appendChild(choices); prediction.appendChild(fieldset); });
    var feedback = element(doc, "p", { className: "pco-feedback", "aria-live": "polite" }); var actions = element(doc, "div", { className: "pco-actions" }); var reveal = element(doc, "button", { type: "button", className: "pco-primary", text: "揭示干涉" }); var clearPredictions = element(doc, "button", { type: "button", text: "清空预测" }); actions.appendChild(reveal); actions.appendChild(clearPredictions); prediction.appendChild(actions); prediction.appendChild(feedback); root.appendChild(prediction);

    var revealed = element(doc, "div", { className: "pco-revealed", hidden: true }); revealed.appendChild(element(doc, "h4", { text: "干涉条纹与相干包络" })); var controls = element(doc, "div", { className: "pco-controls" });
    function addRange(label, key, min, max, step, digits, suffix) { var output = element(doc, "output", { text: format(state[key], digits) + suffix }); var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state[key], "aria-label": label }); input.addEventListener("input", function () { state[key] = Number(input.value); output.textContent = format(state[key], digits) + suffix; render(); }); controls.appendChild(element(doc, "div", { className: "pco-control" }, [element(doc, "label", { text: label }), output, input, element(doc, "div", { className: "pco-scale" }, [element(doc, "span", { text: String(min) + suffix }), element(doc, "span", { text: String(max) + suffix })])])); }
    addRange("参考臂强度 I₁", "i1", 0.1, 4, 0.1, 1, ""); addRange("样品臂强度 I₂", "i2", 0.1, 4, 0.1, 1, ""); addRange("相干度 |γ|", "gamma", 0, 1, 0.01, 2, ""); addRange("相位 Δφ", "phase", -PI, PI, 0.05, 2, " rad"); addRange("波长 λ", "lambda", 0.4, 0.7, 0.01, 2, " μm"); addRange("谱宽 Δλ", "bandwidth", 0.01, 0.2, 0.01, 2, " nm"); addRange("镜位移动", "mirror", 0, 10, 0.05, 2, " μm"); revealed.appendChild(controls);
    var stage = element(doc, "div", { className: "pco-stage" }); var stageTitle = element(doc, "div", { className: "pco-stage-title" }, [element(doc, "span", { text: "上：相位扫描；下：相干长度包络" }), element(doc, "span", { className: "pco-stage-status", text: "" })]); var chart = svgElement(doc, "svg", { viewBox: "0 0 640 330", role: "img", "aria-label": "干涉强度随相位变化以及相干长度包络" }); stage.appendChild(stageTitle); stage.appendChild(chart); revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "pco-metrics" }); var metricNodes = [metric(doc, "当前强度"), metric(doc, "Imax"), metric(doc, "Imin"), metric(doc, "可见度 V"), metric(doc, "Lc / μm")]; metricNodes.forEach(function (item) { metrics.appendChild(item.node); }); revealed.appendChild(metrics); var formula = element(doc, "div", { className: "pco-formula", text: "I = I₁ + I₂ + 2√(I₁I₂)|γ| cos Δφ" }); revealed.appendChild(formula); var reset = element(doc, "button", { type: "button", className: "pco-reset", text: "重置实验" }); revealed.appendChild(reset); root.appendChild(revealed);

    function render() {
      var result = evaluate(state); metricNodes[0].value.textContent = format(result.intensity, 3); metricNodes[1].value.textContent = format(result.max, 3); metricNodes[2].value.textContent = format(result.min, 3); metricNodes[3].value.textContent = format(result.visibility, 3); metricNodes[4].value.textContent = format(result.lc, 1); stageTitle.querySelector(".pco-stage-status").textContent = result.opd <= result.lc ? "光程差在相干包络内" : "光程差超出相干包络"; formula.textContent = "I=" + format(result.intensity, 3) + "；V=" + format(result.visibility, 3) + "；Lc≈λ²/Δλ=" + format(result.lc, 1) + " μm"; clear(chart);
      var left = 48, right = 14, top = 28, mid = 146, lowerTop = 190, bottom = 285, width = 640;
      function xPhase(value) { return left + (width - left - right) * (value + PI) / (2 * PI); } function yIntensity(value) { var high = Math.max(1, result.max, result.i1 + result.i2 + 1); return mid - (mid - top) * value / high; }
      [0, result.i1 + result.i2, result.max].forEach(function (value) { chart.appendChild(svgElement(doc, "line", { class: "pco-grid", x1: left, x2: width - right, y1: yIntensity(value), y2: yIntensity(value) })); chart.appendChild(svgElement(doc, "text", { class: "pco-label", x: 4, y: yIntensity(value) + 4, text: format(value, 1) })); }); chart.appendChild(svgElement(doc, "line", { class: "pco-axis", x1: left, x2: width - right, y1: mid, y2: mid }));
      var wave = []; for (var index = 0; index <= 160; index += 1) { var phase = -PI + 2 * PI * index / 160; wave.push(xPhase(phase) + "," + yIntensity(intensity(result.i1, result.i2, result.effectiveGamma, phase))); } chart.appendChild(svgElement(doc, "polyline", { class: "pco-wave", points: wave.join(" ") })); var markerX = xPhase(result.phase); chart.appendChild(svgElement(doc, "line", { class: "pco-marker", x1: markerX, x2: markerX, y1: top, y2: mid })); chart.appendChild(svgElement(doc, "text", { class: "pco-label", x: left, y: top - 8, text: "I(Δφ)" })); chart.appendChild(svgElement(doc, "text", { class: "pco-label", x: width - 48, y: mid + 18, text: "+π" })); chart.appendChild(svgElement(doc, "text", { class: "pco-label", x: left, y: mid + 18, text: "−π" }));
      function xMirror(value) { return left + (width - left - right) * value / 10; } function yEnvelope(value) { return bottom - (bottom - lowerTop) * value; } for (var grid = 0; grid <= 1; grid += 0.5) { chart.appendChild(svgElement(doc, "line", { class: "pco-grid", x1: left, x2: width - right, y1: yEnvelope(grid), y2: yEnvelope(grid) })); } chart.appendChild(svgElement(doc, "line", { class: "pco-axis", x1: left, x2: width - right, y1: bottom, y2: bottom })); var envelope = []; for (var sample = 0; sample <= 160; sample += 1) { var mirror = 10 * sample / 160; var opd = 2 * mirror; var value = Math.exp(-Math.pow(opd / Math.max(result.lc, 1e-9), 2)); envelope.push(xMirror(mirror) + "," + yEnvelope(value)); } chart.appendChild(svgElement(doc, "polyline", { class: "pco-envelope", points: envelope.join(" ") })); chart.appendChild(svgElement(doc, "line", { class: "pco-marker", x1: xMirror(result.mirror), x2: xMirror(result.mirror), y1: lowerTop, y2: bottom })); chart.appendChild(svgElement(doc, "text", { class: "pco-label", x: left, y: lowerTop - 8, text: "相干包络 |γ|" })); chart.appendChild(svgElement(doc, "text", { class: "pco-label", x: width - 86, y: bottom + 18, text: "镜位 / μm" }));
    }
    reveal.addEventListener("click", function () { if (state.predictions.some(function (value) { return value === null; })) { feedback.className = "pco-feedback pco-warn"; feedback.textContent = "请先完成三个预测，再打开干涉账本。"; return; } var score = state.predictions.reduce(function (sum, value, index) { return sum + (value === questions[index].answer ? 1 : 0); }, 0); feedback.className = "pco-feedback " + (score === questions.length ? "pco-pass" : "pco-warn"); feedback.textContent = "预测 " + score + "/" + questions.length + "。现在把可见度、相干长度和光程倍增分开。"; revealed.hidden = false; render(); announce(api, root, feedback.textContent); });
    clearPredictions.addEventListener("click", function () { state.predictions = [null, null, null]; choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "pco-feedback"; feedback.textContent = "预测已清空。"; });
    reset.addEventListener("click", function () { state.i1 = 1; state.i2 = 1; state.gamma = 0.6; state.phase = 0; state.lambda = 0.5; state.bandwidth = 0.05; state.mirror = 0.125; revealed.hidden = true; feedback.className = "pco-feedback"; feedback.textContent = "实验已重新上锁，请再预测。"; announce(api, root, "相干性实验已重置。"); });
  }

  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    check(near(visibility(1, 1, 0.6), 0.6), "balanced visibility"); check(near(visibility(4, 1, 1), 0.8), "intensity imbalance visibility limit"); check(near(intensity(1, 1, 1, 0), 4), "constructive interference"); check(near(intensity(1, 1, 1, PI), 0), "destructive interference"); check(near(coherentLength(0.5, 0.05), 5000), "coherence length units"); var base = evaluate({ i1: 1, i2: 1, gamma: 0.6, phase: 0, mirror: 0.125 }); var repeat = evaluate({ i1: 1, i2: 1, gamma: 0.6, phase: 0, mirror: 0.125 }); check(JSON.stringify(base) === JSON.stringify(repeat), "deterministic evaluation"); check(base.max >= base.min && base.visibility <= 1, "visibility bounds"); check(evaluate({ mirror: 10, bandwidth: 0.01 }).visibility < evaluate({ mirror: 0, bandwidth: 0.01 }).visibility, "coherence envelope decays"); return { checks: checks }; 
  }

  return { evaluate: evaluate, visibility: visibility, coherentLength: coherentLength, intensity: intensity, mount: mount, selfTest: selfTest };
});
