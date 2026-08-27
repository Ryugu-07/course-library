(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-aberration-budget", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("photo-aberration-budget self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-aberration-budget self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var LAB_ID = "photo-aberration-budget";
  var STYLE_ID = "photo-aberration-budget-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var EPS = 1e-9;
  var DESIGNS = [
    { id: "sphere", label: "球面基线", spherical: 0.20, coma: 0.12, astigmatism: 0.08, field: 0.10, distortion: 0.06, chromatic: 0.10, sensitivity: 0.10 },
    { id: "asphere", label: "非球面优先", spherical: 0.05, coma: 0.10, astigmatism: 0.08, field: 0.09, distortion: 0.04, chromatic: 0.09, sensitivity: 0.16 },
    { id: "achromat", label: "消色差优先", spherical: 0.11, coma: 0.10, astigmatism: 0.07, field: 0.08, distortion: 0.05, chromatic: 0.02, sensitivity: 0.13 }
  ];

  var STYLE_TEXT = [
    ".pab-lab{--pab-blue:var(--cl-blue,#315f9d);--pab-green:var(--cl-green,#39734d);--pab-gold:var(--cl-gold,#9b6a12);--pab-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".pab-lab *,.pab-lab *::before,.pab-lab *::after{box-sizing:border-box}.pab-lab [hidden]{display:none!important}.pab-lab h3,.pab-lab h4{margin:0;letter-spacing:0}.pab-lab h3{font-size:1.15rem}.pab-lab p{margin:.65em 0}.pab-lab button,.pab-lab input,.pab-lab select{font:inherit;letter-spacing:0}.pab-lab button,.pab-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pab-lab button:hover{border-color:var(--pab-blue)}.pab-lab button:focus-visible,.pab-lab input:focus-visible,.pab-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pab-lab button[aria-pressed=true],.pab-lab .pab-primary{border-color:var(--pab-blue);background:var(--pab-blue);color:var(--bg);font-weight:750}.pab-lab .pab-note,.pab-lab .pab-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.pab-lab .pab-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pab-gold);background:var(--block-bg,var(--bg))}.pab-lab .pab-question{margin:0 0 12px;padding:0;border:0}.pab-lab .pab-question:last-of-type{margin-bottom:0}.pab-lab .pab-question legend{max-width:100%;margin-bottom:7px;font-size:13px;font-weight:750;line-height:1.5}.pab-lab .pab-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pab-lab .pab-choices button{font-size:12px}.pab-lab .pab-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.pab-lab .pab-actions>*{flex:1 1 170px}.pab-lab .pab-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pab-lab .pab-pass{color:var(--pab-green)}.pab-lab .pab-warn{color:var(--pab-red)}.pab-lab .pab-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pab-lab .pab-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin:12px 0;align-items:end}.pab-lab .pab-control{display:grid;gap:5px;min-width:0}.pab-lab .pab-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.pab-lab .pab-control output{color:var(--pab-blue);font-variant-numeric:tabular-nums}.pab-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--pab-blue)}.pab-lab .pab-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}.pab-lab .pab-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pab-lab .pab-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--fg-soft);font-size:13px}.pab-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.pab-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pab-lab .pab-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.6}.pab-lab .pab-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.12}.pab-lab .pab-bar{fill:var(--pab-blue);fill-opacity:.74}.pab-lab .pab-bar:nth-of-type(2n){fill:var(--pab-gold)}.pab-lab .pab-bar.pab-diffraction{fill:var(--pab-red)}.pab-lab .pab-label{font-size:11px;fill:var(--fg-soft)}.pab-lab .pab-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.pab-lab .pab-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.pab-lab .pab-metric:nth-child(4n+1){border-color:var(--pab-blue)}.pab-lab .pab-metric:nth-child(4n+2){border-color:var(--pab-gold)}.pab-lab .pab-metric:nth-child(4n+3){border-color:var(--pab-red)}.pab-lab .pab-metric:nth-child(4n){border-color:var(--pab-green)}.pab-lab .pab-metric span{display:block;color:var(--fg-soft);font-size:11px}.pab-lab .pab-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pab-lab .pab-formula{margin:12px 0 0;padding:9px 11px;border-left:3px solid var(--pab-blue);background:var(--bg);font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65;overflow-x:auto}.pab-lab .pab-reset{margin-top:10px;color:var(--fg-soft)}@media(max-width:700px){.pab-lab .pab-controls{grid-template-columns:minmax(0,1fr)}.pab-lab .pab-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pab-lab .pab-choices{grid-template-columns:minmax(0,1fr)}}@media(max-width:400px){.pab-lab .pab-metrics{grid-template-columns:minmax(0,1fr)}.pab-lab .pab-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){.pab-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value, fallback) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function normalize(value, fallback, minimum, maximum) { return clamp(finite(Number(value), fallback), minimum, maximum); }
  function near(left, right, tolerance) { return Math.abs(left - right) <= (tolerance || EPS) * Math.max(1, Math.abs(left), Math.abs(right)); }
  function designById(id) { return DESIGNS.filter(function (design) { return design.id === id; })[0] || DESIGNS[0]; }

  function evaluate(input) {
    var source = input || {};
    var design = designById(source.design);
    var aperture = normalize(source.aperture, 0.1414, 0.06, 0.24);
    var field = normalize(source.field, 0.65, 0, 1);
    var tolerance = normalize(source.tolerance, 0.35, 0, 1);
    var scale = aperture / 0.1;
    var terms = [
      { id: "球差", value: design.spherical * Math.pow(scale, 3), correctable: false },
      { id: "彗差", value: design.coma * Math.pow(scale, 2) * field, correctable: false },
      { id: "像散", value: design.astigmatism * scale * field * field, correctable: false },
      { id: "场曲", value: design.field * field * field, correctable: false },
      { id: "畸变", value: design.distortion * Math.pow(field, 3), correctable: true },
      { id: "色差", value: design.chromatic * (0.4 + 0.6 * field), correctable: false },
      { id: "衍射", value: 0.004 / aperture, correctable: false }
    ];
    var rmsSquared = terms.reduce(function (sum, term) { return sum + term.value * term.value; }, 0);
    var nominal = Math.sqrt(rmsSquared);
    var toleranceSigma = tolerance * design.sensitivity * (0.6 + nominal);
    var bound95 = nominal + 1.96 * toleranceSigma;
    return { design: design, aperture: aperture, field: field, tolerance: tolerance, terms: terms, nominal: nominal, bound95: bound95, toleranceSigma: toleranceSigma, distortion: terms[4].value, diffraction: terms[6].value, spherical: terms[0].value };
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function appendChildren(node, children) { (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null && child !== false) node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child))); }); return node; }
  function element(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElement(tag), attrs), children); }
  function svgElement(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function format(value, digits) { if (!Number.isFinite(value)) return "—"; var places = digits === undefined ? 3 : digits; var text = Math.abs(value) < 0.001 && value !== 0 ? value.toExponential(Math.min(places, 4)) : value.toFixed(places); return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, ""); }
  function installStyles(doc) { if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return; var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style); }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function metric(doc, label) { var value = element(doc, "strong", { text: "—" }); return { node: element(doc, "div", { className: "pab-metric" }, [element(doc, "span", { text: label }), value]), value: value }; }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    root.classList.add("pab-lab");
    clear(root);
    var state = { design: "sphere", aperture: 0.1414, field: 0.65, tolerance: 0.35, predictions: [null, null, null] };
    var questions = [
      { prompt: "孔径相对值减半，球差项约如何变化？", options: ["减半", "减为 1/8", "不变"], answer: 1 },
      { prompt: "孔径收小，衍射斑项如何变化？", options: ["增大", "减小", "只看视场"], answer: 0 },
      { prompt: "主要是位置偏移的畸变最适合？", options: ["软件重映射", "加大曝光", "提高增益"], answer: 0 }
    ];
    root.appendChild(element(doc, "h3", { text: "预测闸门：找到像差与衍射的交叉点" }));
    root.appendChild(element(doc, "p", { className: "pab-note", text: "先判断孔径幂次和软件边界；揭示后可比较三种设计的标称误差与公差带。" }));
    var prediction = element(doc, "div", { className: "pab-prediction" });
    var choiceButtons = [];
    questions.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset", { className: "pab-question" });
      fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
      var choices = element(doc, "div", { className: "pab-choices" });
      question.options.forEach(function (label, optionIndex) {
        var button = element(doc, "button", { type: "button", text: label, "aria-pressed": "false", onclick: function () { state.predictions[questionIndex] = optionIndex; choiceButtons[questionIndex].forEach(function (item) { item.setAttribute("aria-pressed", "false"); }); button.setAttribute("aria-pressed", "true"); } });
        choices.appendChild(button);
        if (!choiceButtons[questionIndex]) choiceButtons[questionIndex] = [];
        choiceButtons[questionIndex].push(button);
      });
      fieldset.appendChild(choices);
      prediction.appendChild(fieldset);
    });
    var feedback = element(doc, "p", { className: "pab-feedback", "aria-live": "polite" });
    var actions = element(doc, "div", { className: "pab-actions" });
    var reveal = element(doc, "button", { type: "button", className: "pab-primary", text: "揭示预算" });
    var clearPredictions = element(doc, "button", { type: "button", text: "清空预测" });
    actions.appendChild(reveal); actions.appendChild(clearPredictions); prediction.appendChild(actions); prediction.appendChild(feedback); root.appendChild(prediction);

    var revealed = element(doc, "div", { className: "pab-revealed", hidden: true });
    revealed.appendChild(element(doc, "h4", { text: "误差预算：每一项都能追溯到一个旋钮" }));
    var controls = element(doc, "div", { className: "pab-controls" });
    var designSelect = element(doc, "select", { "aria-label": "选择光学设计" });
    DESIGNS.forEach(function (design) { designSelect.appendChild(element(doc, "option", { value: design.id, text: design.label })); });
    designSelect.value = state.design;
    designSelect.addEventListener("change", function () { state.design = designSelect.value; render(); });
    controls.appendChild(element(doc, "div", { className: "pab-control" }, [element(doc, "label", { text: "设计分支" }), designSelect]));
    function addRange(label, key, min, max, step, digits, suffix) {
      var output = element(doc, "output", { text: format(state[key], digits) + suffix });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state[key], "aria-label": label });
      input.addEventListener("input", function () { state[key] = Number(input.value); output.textContent = format(state[key], digits) + suffix; render(); });
      controls.appendChild(element(doc, "div", { className: "pab-control" }, [element(doc, "label", { text: label }), output, input, element(doc, "div", { className: "pab-scale" }, [element(doc, "span", { text: String(min) + suffix }), element(doc, "span", { text: String(max) + suffix })])]));
    }
    addRange("相对孔径 N", "aperture", 0.06, 0.24, 0.001, 3, "");
    addRange("归一化视场 h", "field", 0, 1, 0.01, 2, "");
    addRange("装调敏感度", "tolerance", 0, 1, 0.01, 2, "");
    revealed.appendChild(controls);
    var stage = element(doc, "div", { className: "pab-stage" });
    var stageTitle = element(doc, "div", { className: "pab-stage-title" }, [element(doc, "span", { text: "RMS 预算（相对单位）" }), element(doc, "span", { className: "pab-stage-status", text: "" })]);
    var chart = svgElement(doc, "svg", { viewBox: "0 0 620 280", role: "img", "aria-label": "球差、彗差、像散、场曲、畸变、色差与衍射预算柱状图" });
    stage.appendChild(stageTitle); stage.appendChild(chart); revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "pab-metrics" });
    var metricNodes = [metric(doc, "标称 RMS"), metric(doc, "衍射项"), metric(doc, "可校正畸变"), metric(doc, "95% 公差上界")];
    metricNodes.forEach(function (item) { metrics.appendChild(item.node); }); revealed.appendChild(metrics);
    var formula = element(doc, "div", { className: "pab-formula", text: "RMS = √Σ(term²); 95% 上界 = RMS + 1.96σ_tolerance" }); revealed.appendChild(formula);
    var reset = element(doc, "button", { type: "button", className: "pab-reset", text: "重置实验" }); revealed.appendChild(reset); root.appendChild(revealed);

    function render() {
      var result = evaluate(state);
      metricNodes[0].value.textContent = format(result.nominal, 4);
      metricNodes[1].value.textContent = format(result.diffraction, 4);
      metricNodes[2].value.textContent = format(result.distortion, 4);
      metricNodes[3].value.textContent = format(result.bound95, 4);
      stageTitle.querySelector(".pab-stage-status").textContent = result.bound95 > result.nominal * 1.35 ? "公差带显著变宽" : "标称值与量产风险接近";
      formula.textContent = result.design.label + "：RMS=√Σ(term²)=" + format(result.nominal, 4) + "，σ_tolerance=" + format(result.toleranceSigma, 4) + "，95% 上界=" + format(result.bound95, 4);
      clear(chart);
      var left = 42, right = 12, top = 24, bottom = 228, width = 620, maxValue = Math.max(0.2, result.terms.reduce(function (max, term) { return Math.max(max, term.value); }, 0));
      function x(index) { return left + (width - left - right) * (index + 0.5) / result.terms.length; }
      function y(value) { return bottom - (bottom - top) * value / maxValue; }
      [0, maxValue / 2, maxValue].forEach(function (value) { chart.appendChild(svgElement(doc, "line", { class: "pab-grid", x1: left, x2: width - right, y1: y(value), y2: y(value) })); chart.appendChild(svgElement(doc, "text", { class: "pab-label", x: 4, y: y(value) + 4, text: format(value, 2) })); });
      chart.appendChild(svgElement(doc, "line", { class: "pab-axis", x1: left, x2: width - right, y1: bottom, y2: bottom }));
      result.terms.forEach(function (term, index) {
        var barWidth = Math.min(54, (width - left - right) / result.terms.length - 10);
        chart.appendChild(svgElement(doc, "rect", { class: "pab-bar" + (term.id === "衍射" ? " pab-diffraction" : ""), x: x(index) - barWidth / 2, y: y(term.value), width: barWidth, height: bottom - y(term.value), rx: 2 }));
        chart.appendChild(svgElement(doc, "text", { class: "pab-label", x: x(index), y: bottom + 17, "text-anchor": "middle", text: term.id }));
        chart.appendChild(svgElement(doc, "text", { class: "pab-label", x: x(index), y: y(term.value) - 6, "text-anchor": "middle", text: format(term.value, 2) }));
      });
      chart.appendChild(svgElement(doc, "text", { class: "pab-label", x: left + 2, y: top - 8, text: "误差单位" }));
    }
    reveal.addEventListener("click", function () {
      if (state.predictions.some(function (value) { return value === null; })) { feedback.className = "pab-feedback pab-warn"; feedback.textContent = "请先完成三个预测，再打开误差预算。"; return; }
      var score = state.predictions.reduce(function (sum, value, index) { return sum + (value === questions[index].answer ? 1 : 0); }, 0);
      feedback.className = "pab-feedback " + (score === questions.length ? "pab-pass" : "pab-warn"); feedback.textContent = "预测 " + score + "/" + questions.length + "。现在比较孔径幂次、衍射反向标度与公差上界。"; revealed.hidden = false; render(); announce(api, root, feedback.textContent);
    });
    clearPredictions.addEventListener("click", function () { state.predictions = [null, null, null]; choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "pab-feedback"; feedback.textContent = "预测已清空。"; });
    reset.addEventListener("click", function () { state.design = "sphere"; state.aperture = 0.1414; state.field = 0.65; state.tolerance = 0.35; revealed.hidden = true; feedback.className = "pab-feedback"; feedback.textContent = "实验已重新上锁，请再预测。"; announce(api, root, "像差预算实验已重置。"); });
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    var base = evaluate({ design: "sphere", aperture: 0.12, field: 1, tolerance: 0 });
    var half = evaluate({ design: "sphere", aperture: 0.06, field: 1, tolerance: 0 });
    check(near(half.spherical / base.spherical, 0.125, 1e-9), "spherical aberration cubic scaling");
    check(near(half.diffraction / base.diffraction, 2, 1e-9), "diffraction inverse aperture scaling");
    check(evaluate({ design: "asphere", aperture: 0.1, field: 1 }).spherical < base.spherical, "asphere reduces spherical term");
    check(evaluate({ design: "achromat", aperture: 0.1, field: 1 }).terms[5].value < base.terms[5].value, "achromat reduces chromatic term");
    check(base.terms.every(function (term) { return finite(term.value) && term.value >= 0; }), "all terms finite");
    check(evaluate({ design: "sphere", aperture: 0.1, field: 1, tolerance: 1 }).bound95 >= base.nominal, "tolerance bound is not below nominal");
    check(evaluate({ design: "unknown", aperture: 0.1 }).design.id === "sphere", "unknown design fallback");
    return { checks: checks, designs: DESIGNS.length };
  }

  return { DESIGNS: DESIGNS, evaluate: evaluate, mount: mount, selfTest: selfTest };
});
