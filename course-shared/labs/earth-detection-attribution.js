(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-detection-attribution", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-detection-attribution self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-detection-attribution self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "earth-detection-attribution";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-" + NAME + "-styles";
  var N = 12;
  var DEFAULTS = Object.freeze({ signal: 1.2, internalSd: 0.6, alignment: 0.8, fingerprintScale: 1 });

  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }
  function finite(value, label) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }
  function bounded(value, minimum, maximum, label) {
    var number = finite(value, label);
    if (number < minimum || number > maximum) throw new RangeError(label + " is outside its range");
    return number;
  }

  function compute(input) {
    var source = input || {};
    var signal = bounded(source.signal === undefined ? DEFAULTS.signal : source.signal, 0, 3, "signal");
    var internalSd = bounded(source.internalSd === undefined ? DEFAULTS.internalSd : source.internalSd, 0.05, 3, "internal standard deviation");
    var alignment = bounded(source.alignment === undefined ? DEFAULTS.alignment : source.alignment, 0, 1, "alignment");
    var fingerprintScale = bounded(source.fingerprintScale === undefined ? DEFAULTS.fingerprintScale : source.fingerprintScale, 0.2, 2, "fingerprint scale");
    var detectZ = signal * Math.sqrt(N) / internalSd;
    var beta = signal * alignment / fingerprintScale;
    var betaSe = internalSd / (fingerprintScale * Math.sqrt(N));
    var attributionZ = beta / betaSe;
    var intervalLow = beta - 1.96 * betaSe;
    var intervalHigh = beta + 1.96 * betaSe;
    return {
      n: N,
      signal: signal,
      internalSd: internalSd,
      alignment: alignment,
      fingerprintScale: fingerprintScale,
      detectZ: detectZ,
      beta: beta,
      betaSe: betaSe,
      attributionZ: attributionZ,
      intervalLow: intervalLow,
      intervalHigh: intervalHigh,
      detected: detectZ >= 1.96,
      attributedInToyModel: intervalLow > 0 && alignment >= 0.5
    };
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var text = Math.abs(value) < 0.001 && value !== 0 ? value.toExponential(3) : value.toFixed(digits === undefined ? 3 : digits);
    return text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--eda-blue:#315f9d;--eda-green:#39734d;--eda-gold:#9b6a12;--eda-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:10px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input{font:inherit}[data-learning-lab="' + NAME + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] button:hover{border-color:var(--eda-blue)}[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .eda-primary{background:var(--eda-blue);border-color:var(--eda-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .eda-choices,[data-learning-lab="' + NAME + '"] .eda-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .eda-choices>* ,[data-learning-lab="' + NAME + '"] .eda-actions>*{flex:1 1 180px}[data-learning-lab="' + NAME + '"] .eda-feedback,[data-learning-lab="' + NAME + '"] .eda-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .eda-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .eda-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .eda-control span{font-size:12.5px;font-weight:700;color:var(--fg-soft,currentColor)}[data-learning-lab="' + NAME + '"] input[type="range"]{display:block;width:100%;min-height:44px;accent-color:var(--eda-blue)}' +
      '[data-learning-lab="' + NAME + '"] .eda-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .eda-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="' + NAME + '"] .eda-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .eda-metric{min-width:0;padding:8px;border-top:2px solid var(--eda-blue);background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] .eda-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .eda-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .eda-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + NAME + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;white-space:nowrap}@media(max-width:650px){[data-learning-lab="' + NAME + '"] .eda-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .eda-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:460px){[data-learning-lab="' + NAME + '"] .eda-choices,[data-learning-lab="' + NAME + '"] .eda-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .eda-choices>* ,[data-learning-lab="' + NAME + '"] .eda-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function draw(doc, svg, result) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 780 340");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "检测与归因证据账本概念图");
    svg.appendChild(svgElement(doc, "title", {}, "检测与归因的两道证据门"));
    svg.appendChild(svgElement(doc, "desc", {}, "左侧分解观测信号、内部变率与指纹一致度，右侧展示检测和归因区间。"));
    svg.appendChild(svgElement(doc, "text", { x: 16, y: 23, "font-size": 13 }, "观测变化 → 投影到指纹 → 两道证据门"));
    var boxes = [
      { x: 18, label: "观测信号", value: format(result.signal, 2), color: "#315f9d" },
      { x: 205, label: "内部变率", value: "σ = " + format(result.internalSd, 2), color: "#9b6a12" },
      { x: 392, label: "指纹一致度", value: "ρ = " + format(result.alignment, 2), color: "#39734d" }
    ];
    boxes.forEach(function (box, index) {
      svg.appendChild(svgElement(doc, "rect", { x: box.x, y: 43, width: 155, height: 62, rx: 5, fill: box.color, "fill-opacity": ".88" }));
      svg.appendChild(svgElement(doc, "text", { x: box.x + 77.5, y: 68, "text-anchor": "middle", "font-size": 13, fill: "#fff" }, box.label));
      svg.appendChild(svgElement(doc, "text", { x: box.x + 77.5, y: 89, "text-anchor": "middle", "font-size": 11, fill: "#fff" }, box.value));
      if (index < boxes.length - 1) svg.appendChild(svgElement(doc, "path", { d: "M" + (box.x + 158) + " 74 H" + (box.x + 180) + " M" + (box.x + 172) + " 67 L" + (box.x + 180) + " 74 L" + (box.x + 172) + " 81", fill: "none", stroke: "currentColor", "stroke-width": 2 }));
    });
    svg.appendChild(svgElement(doc, "rect", { x: 579, y: 43, width: 183, height: 62, rx: 5, fill: result.detected ? "#39734d" : "#b64335", "fill-opacity": ".9" }));
    svg.appendChild(svgElement(doc, "text", { x: 670, y: 68, "text-anchor": "middle", "font-size": 13, fill: "#fff" }, "检测门"));
    svg.appendChild(svgElement(doc, "text", { x: 670, y: 89, "text-anchor": "middle", "font-size": 11, fill: "#fff" }, "z = " + format(result.detectZ, 2)));
    svg.appendChild(svgElement(doc, "path", { d: "M547 74 H571 M563 67 L571 74 L563 81", fill: "none", stroke: "currentColor", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: 18, y: 137, "font-size": 12 }, "归因系数 β 的近似 95% 区间"));
    var axisX = 86, axisEnd = 742, axisY = 188;
    var domainMin = Math.min(-0.4, result.intervalLow - 0.25);
    var domainMax = Math.max(1.8, result.intervalHigh + 0.25);
    var map = function (value) { return axisX + (axisEnd - axisX) * (value - domainMin) / (domainMax - domainMin); };
    svg.appendChild(svgElement(doc, "line", { x1: axisX, y1: axisY, x2: axisEnd, y2: axisY, stroke: "currentColor", "stroke-width": 1 }));
    svg.appendChild(svgElement(doc, "line", { x1: map(0), y1: axisY - 18, x2: map(0), y2: axisY + 18, stroke: "#b64335", "stroke-width": 2, "stroke-dasharray": "4 3" }));
    svg.appendChild(svgElement(doc, "line", { x1: map(result.intervalLow), y1: axisY, x2: map(result.intervalHigh), y2: axisY, stroke: "#39734d", "stroke-width": 10, "stroke-linecap": "round" }));
    svg.appendChild(svgElement(doc, "line", { x1: map(result.beta), y1: axisY - 17, x2: map(result.beta), y2: axisY + 17, stroke: "#315f9d", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "text", { x: map(0), y: axisY + 34, "text-anchor": "middle", "font-size": 11 }, "0"));
    svg.appendChild(svgElement(doc, "text", { x: map(result.beta), y: axisY - 25, "text-anchor": "middle", "font-size": 11 }, "β"));
    svg.appendChild(svgElement(doc, "text", { x: 18, y: 239, "font-size": 12 }, "两本账不能合并为一句话"));
    var ledger = [
      { y: 268, label: "检测", value: result.detected ? "超出零假设尺度" : "未超出零假设尺度", color: result.detected ? "#39734d" : "#b64335" },
      { y: 300, label: "归因", value: result.attributedInToyModel ? "玩具模型内与指纹相容" : "需要更多证据", color: result.attributedInToyModel ? "#39734d" : "#9b6a12" }
    ];
    ledger.forEach(function (row) {
      svg.appendChild(svgElement(doc, "rect", { x: 18, y: row.y - 15, width: 72, height: 24, rx: 4, fill: row.color, "fill-opacity": ".88" }));
      svg.appendChild(svgElement(doc, "text", { x: 54, y: row.y + 2, "text-anchor": "middle", "font-size": 11, fill: "#fff" }, row.label));
      svg.appendChild(svgElement(doc, "text", { x: 106, y: row.y + 2, "font-size": 11 }, row.value));
    });
  }
  function table(doc, result) {
    var wrap = element(doc, "div", { className: "eda-table-wrap" });
    var tableNode = element(doc, "table", { "aria-label": "检测归因结果账本" });
    tableNode.appendChild(element(doc, "caption", { text: "检测 / 归因结果账本" }));
    tableNode.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "当前值" }), element(doc, "th", { text: "读法" })])));
    var body = element(doc, "tbody");
    [
      ["检测 z", format(result.detectZ, 3), "信号 / 内部变率"],
      ["归因 β", format(result.beta, 3), "信号 × 一致度 / 指纹尺度"],
      ["归因标准误", format(result.betaSe, 3), "给定独立误差假设"],
      ["归因 z", format(result.attributionZ, 3), "β / 标准误"],
      ["95% 区间", "[" + format(result.intervalLow, 3) + ", " + format(result.intervalHigh, 3) + "]", "零是否落在区间内"]
    ].forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    tableNode.appendChild(body); wrap.appendChild(tableNode); return wrap;
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { signal: DEFAULTS.signal, internalSd: DEFAULTS.internalSd, alignment: DEFAULTS.alignment, fingerprintScale: DEFAULTS.fingerprintScale, revealed: false, feedback: "" };
    var answers = { causal: null, noise: null };
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "检测与归因：两道不同的证据门" }));
    shell.appendChild(element(doc, "p", { className: "eda-note", text: "先判断检测和归因是否相同，再打开合成指纹账本。" }));
    var form = element(doc, "form", {});
    var predictionBox = element(doc, "fieldset", {});
    predictionBox.appendChild(element(doc, "legend", { text: "预测门" }));
    var groups = [];
    function addQuestion(key, prompt, choices) {
      predictionBox.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "eda-choices", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
        button.addEventListener("click", function () {
          answers[key] = choice[0];
          groups.forEach(function (item) { item.button.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); });
        });
        groups.push({ key: key, value: choice[0], button: button }); row.appendChild(button);
      });
      predictionBox.appendChild(row);
    }
    addQuestion("causal", "信号大但与指纹不一致，能直接完成归因吗？", [["no", "不能"], ["yes", "能"]]);
    addQuestion("noise", "内部变率标准差加倍，z 证据量会？", [["down", "减半"], ["up", "加倍"]]);
    form.appendChild(predictionBox);
    var actions = element(doc, "div", { className: "eda-actions" });
    actions.appendChild(element(doc, "button", { type: "submit", className: "eda-primary", text: "提交预测并展开" }));
    actions.appendChild(element(doc, "button", { type: "button", text: "重置" }));
    form.appendChild(actions);
    var feedback = element(doc, "p", { className: "eda-feedback", role: "status", "aria-live": "polite" }); form.appendChild(feedback); shell.appendChild(form);
    var controls = element(doc, "div", { className: "eda-controls", hidden: "hidden" });
    function addControl(label, min, max, step, value, field) {
      var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(value), "aria-label": label });
      var output = element(doc, "output", { text: String(value) });
      input.addEventListener("input", function () { state[field] = Number(input.value); output.textContent = input.value; render(); });
      controls.appendChild(element(doc, "label", { className: "eda-control" }, [element(doc, "span", { text: label + " = " }), output, input]));
      return input;
    }
    var signalInput = addControl("信号幅度", 0.2, 2.4, 0.1, DEFAULTS.signal, "signal");
    var noiseInput = addControl("内部变率 σ", 0.3, 1.5, 0.1, DEFAULTS.internalSd, "internalSd");
    var alignmentInput = addControl("指纹一致度 ρ", 0, 1, 0.05, DEFAULTS.alignment, "alignment");
    var scaleInput = addControl("指纹尺度 a", 0.6, 1.4, 0.05, DEFAULTS.fingerprintScale, "fingerprintScale");
    shell.appendChild(controls);
    var revealed = element(doc, "section", { className: "eda-revealed", hidden: "hidden" });
    var stage = element(doc, "div", { className: "eda-stage" }); var svg = doc.createElementNS(SVG_NS, "svg"); stage.appendChild(svg); revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "eda-metrics" }); revealed.appendChild(metrics);
    var ledger = element(doc, "div", {}); revealed.appendChild(ledger); shell.appendChild(revealed); rootNode.replaceChildren(shell);
    function metric(label, value) { return element(doc, "div", { className: "eda-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
    function render() {
      feedback.textContent = state.feedback;
      controls.querySelectorAll('input[type="range"]').forEach(function (input) { var output = input.parentNode.querySelector("output"); if (output) output.textContent = input.value; });
      controls.hidden = !state.revealed; revealed.hidden = !state.revealed; if (!state.revealed) return;
      var result = compute({ signal: state.signal, internalSd: state.internalSd, alignment: state.alignment, fingerprintScale: state.fingerprintScale });
      draw(doc, svg, result); clear(metrics); metrics.appendChild(metric("检测 z", format(result.detectZ, 2))); metrics.appendChild(metric("归因 z", format(result.attributionZ, 2))); metrics.appendChild(metric("β", format(result.beta, 2))); metrics.appendChild(metric("ρ", format(result.alignment, 2))); clear(ledger); ledger.appendChild(table(doc, result));
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault(); if (answers.causal === null || answers.noise === null) { state.feedback = "请先回答两项检测/归因预测。"; render(); return; }
      var score = (answers.causal === "no" ? 1 : 0) + (answers.noise === "down" ? 1 : 0); state.revealed = true; state.feedback = "已揭晓：" + score + " / 2 命中；请观察两本证据账。"; render(); if (api && typeof api.announce === "function") api.announce(rootNode, state.feedback);
    });
    actions.lastChild.addEventListener("click", function () {
      state = { signal: DEFAULTS.signal, internalSd: DEFAULTS.internalSd, alignment: DEFAULTS.alignment, fingerprintScale: DEFAULTS.fingerprintScale, revealed: false, feedback: "" }; answers = { causal: null, noise: null };
      signalInput.value = String(DEFAULTS.signal); noiseInput.value = String(DEFAULTS.internalSd); alignmentInput.value = String(DEFAULTS.alignment); scaleInput.value = String(DEFAULTS.fingerprintScale); groups.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); }); render(); if (api && typeof api.announce === "function") api.announce(rootNode, "检测归因实验已重置。");
    });
    render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var result = compute(DEFAULTS);
    check(Math.abs(result.detectZ - 1.2 * Math.sqrt(12) / 0.6) < 1e-12, "detection z is deterministic");
    check(Math.abs(result.attributionZ - result.detectZ * 0.8) < 1e-12, "alignment scales attribution evidence");
    check(result.intervalLow > 0, "default toy interval excludes zero");
    check(compute({ signal: 1.2, internalSd: 1.2, alignment: 0.8, fingerprintScale: 1 }).detectZ < result.detectZ, "larger variability weakens detection");
    check(compute({ signal: 1.2, internalSd: 0.6, alignment: 0.2, fingerprintScale: 1 }).attributionZ < result.attributionZ, "poor fingerprint alignment weakens attribution");
    check(compute({ signal: 0.2, internalSd: 1.5, alignment: 0.2, fingerprintScale: 1 }).attributedInToyModel === false, "weak evidence does not pass toy attribution gate");
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, compute: compute, mount: mount, selfTest: selfTest };
});
