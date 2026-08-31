(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-inverse-assimilation", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-inverse-assimilation self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-inverse-assimilation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "earth-inverse-assimilation";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-" + NAME + "-styles";
  var DEFAULTS = Object.freeze({ priorMean: 120, priorVariance: 400, processVariance: 100, observation: 150, observationVariance: 225, observationSd: 15, drift: 0 });

  function assert(condition, message) {
    if (!condition) throw new Error(NAME + " self-test failed: " + message);
  }

  function finite(value, label) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }

  function nonnegative(value, label) {
    var number = finite(value, label);
    if (number < 0) throw new RangeError(label + " must be nonnegative");
    return number;
  }

  function compute(input) {
    var source = input || {};
    var priorMean = finite(source.priorMean === undefined ? DEFAULTS.priorMean : source.priorMean, "prior mean");
    var priorVariance = nonnegative(source.priorVariance === undefined ? DEFAULTS.priorVariance : source.priorVariance, "prior variance");
    var processVariance = nonnegative(source.processVariance === undefined ? DEFAULTS.processVariance : source.processVariance, "process variance");
    var observation = finite(source.observation === undefined ? DEFAULTS.observation : source.observation, "observation");
    var observationVariance = finite(source.observationVariance === undefined ? DEFAULTS.observationVariance : source.observationVariance, "observation variance");
    var drift = finite(source.drift === undefined ? DEFAULTS.drift : source.drift, "drift");
    if (observationVariance <= 0) throw new RangeError("observation variance must be positive");
    var forecastMean = priorMean + drift;
    var forecastVariance = priorVariance + processVariance;
    var innovation = observation - forecastMean;
    var innovationVariance = forecastVariance + observationVariance;
    var gain = forecastVariance / innovationVariance;
    var posteriorMean = forecastMean + gain * innovation;
    var posteriorVariance = (1 - gain) * forecastVariance;
    return {
      priorMean: priorMean,
      priorVariance: priorVariance,
      processVariance: processVariance,
      forecastMean: forecastMean,
      forecastVariance: forecastVariance,
      observation: observation,
      observationVariance: observationVariance,
      innovation: innovation,
      innovationVariance: innovationVariance,
      gain: gain,
      posteriorMean: posteriorMean,
      posteriorVariance: posteriorVariance,
      posteriorSd: Math.sqrt(Math.max(0, posteriorVariance)),
      normalizedInnovation: innovation / Math.sqrt(innovationVariance)
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

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    var text = Math.abs(value) < 0.001 && value !== 0
      ? value.toExponential(Math.min(places, 4))
      : value.toFixed(places);
    return text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--eia-blue:#315f9d;--eia-green:#39734d;--eia-gold:#9b6a12;--eia-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:10px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input{font:inherit}[data-learning-lab="' + NAME + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] button:hover{border-color:var(--eia-blue)}[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .eia-primary{background:var(--eia-blue);border-color:var(--eia-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .eia-choices,[data-learning-lab="' + NAME + '"] .eia-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .eia-choices>* ,[data-learning-lab="' + NAME + '"] .eia-actions>*{flex:1 1 180px}[data-learning-lab="' + NAME + '"] .eia-feedback,[data-learning-lab="' + NAME + '"] .eia-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .eia-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .eia-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .eia-control span{font-size:12.5px;font-weight:700;color:var(--fg-soft,currentColor)}[data-learning-lab="' + NAME + '"] input[type="range"]{display:block;width:100%;min-height:44px;accent-color:var(--eia-blue)}' +
      '[data-learning-lab="' + NAME + '"] .eia-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .eia-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="' + NAME + '"] .eia-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .eia-metric{min-width:0;padding:8px;border-top:2px solid var(--eia-blue);background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] .eia-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .eia-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .eia-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + NAME + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;white-space:nowrap}[data-learning-lab="' + NAME + '"] .eia-warn{color:var(--eia-red);font-weight:700}@media(max-width:650px){[data-learning-lab="' + NAME + '"] .eia-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .eia-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:460px){[data-learning-lab="' + NAME + '"] .eia-choices,[data-learning-lab="' + NAME + '"] .eia-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .eia-choices>* ,[data-learning-lab="' + NAME + '"] .eia-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function draw(doc, svg, result) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 780 330");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "先验预测、观测与后验更新流程图");
    svg.appendChild(svgElement(doc, "title", {}, "先验到后验的同化流程"));
    svg.appendChild(svgElement(doc, "desc", {}, "上方为预测和更新流程，下方为三个证据位置及其不确定性宽度。"));
    var cards = [
      { x: 16, label: "先验", value: "m = " + format(result.priorMean, 1), color: "#39734d" },
      { x: 206, label: "推进", value: "P = " + format(result.forecastVariance, 1), color: "#315f9d" },
      { x: 396, label: "观测", value: "y = " + format(result.observation, 1), color: "#9b6a12" },
      { x: 586, label: "后验", value: "m = " + format(result.posteriorMean, 1), color: "#39734d" }
    ];
    cards.forEach(function (card, index) {
      svg.appendChild(svgElement(doc, "rect", { x: card.x, y: 38, width: 160, height: 68, rx: 5, fill: card.color, "fill-opacity": ".88" }));
      svg.appendChild(svgElement(doc, "text", { x: card.x + 80, y: 64, "text-anchor": "middle", "font-size": 14, fill: "#fff" }, card.label));
      svg.appendChild(svgElement(doc, "text", { x: card.x + 80, y: 87, "text-anchor": "middle", "font-size": 11, fill: "#fff" }, card.value));
      if (index < cards.length - 1) {
        svg.appendChild(svgElement(doc, "path", { d: "M" + (card.x + 164) + " 72 H" + (card.x + 184) + " M" + (card.x + 176) + " 64 L" + (card.x + 184) + " 72 L" + (card.x + 176) + " 80", fill: "none", stroke: "currentColor", "stroke-width": 2 }));
      }
    });
    svg.appendChild(svgElement(doc, "text", { x: 16, y: 23, "font-size": 12 }, "同化 = 模型不确定性与观测不确定性的加权折中"));
    var baseline = 250;
    var minValue = Math.min(result.forecastMean - 3 * Math.sqrt(result.forecastVariance), result.observation - 3 * Math.sqrt(result.observationVariance), result.posteriorMean - 3 * result.posteriorSd);
    var maxValue = Math.max(result.forecastMean + 3 * Math.sqrt(result.forecastVariance), result.observation + 3 * Math.sqrt(result.observationVariance), result.posteriorMean + 3 * result.posteriorSd);
    var scale = function (value) { return 48 + 684 * (value - minValue) / Math.max(1e-9, maxValue - minValue); };
    var rows = [
      { y: 170, label: "先验", mean: result.forecastMean, sd: Math.sqrt(result.forecastVariance), color: "#315f9d" },
      { y: 215, label: "观测", mean: result.observation, sd: Math.sqrt(result.observationVariance), color: "#9b6a12" },
      { y: 260, label: "后验", mean: result.posteriorMean, sd: result.posteriorSd, color: "#39734d" }
    ];
    rows.forEach(function (row) {
      svg.appendChild(svgElement(doc, "text", { x: 16, y: row.y + 4, "font-size": 12 }, row.label));
      svg.appendChild(svgElement(doc, "line", { x1: scale(row.mean - 2 * row.sd), y1: row.y, x2: scale(row.mean + 2 * row.sd), y2: row.y, stroke: row.color, "stroke-width": 9, "stroke-linecap": "round", "stroke-opacity": ".42" }));
      svg.appendChild(svgElement(doc, "line", { x1: scale(row.mean), y1: row.y - 12, x2: scale(row.mean), y2: row.y + 12, stroke: row.color, "stroke-width": 3 }));
      svg.appendChild(svgElement(doc, "text", { x: 742, y: row.y + 4, "text-anchor": "end", "font-size": 11 }, format(row.mean, 1)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: 48, y1: baseline + 23, x2: 732, y2: baseline + 23, stroke: "currentColor", "stroke-width": 1 }));
    svg.appendChild(svgElement(doc, "text", { x: 48, y: 315, "font-size": 11 }, "线段约示 95% 区间；右端数字为中心值"));
    svg.appendChild(svgElement(doc, "text", { x: 732, y: 315, "text-anchor": "end", "font-size": 11 }, "K = " + format(result.gain, 3)));
  }

  function table(doc, result) {
    var wrap = element(doc, "div", { className: "eia-table-wrap" });
    var tableNode = element(doc, "table", { "aria-label": "反演同化结果账本" });
    tableNode.appendChild(element(doc, "caption", { text: "反演 / 同化结果账本" }));
    tableNode.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { text: "量" }), element(doc, "th", { text: "当前值" }), element(doc, "th", { text: "解释" })
    ])));
    var body = element(doc, "tbody");
    [
      ["预测均值", format(result.forecastMean, 2), "先验 + 漂移"],
      ["预测方差", format(result.forecastVariance, 2), "先验方差 + 过程方差"],
      ["创新", format(result.innovation, 2), "观测 − 预测"],
      ["增益 K", format(result.gain, 3), "观测权重"],
      ["后验", format(result.posteriorMean, 2) + " ± " + format(result.posteriorSd, 2), "给定模型下的更新结果"]
    ].forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })]));
    });
    tableNode.appendChild(body);
    wrap.appendChild(tableNode);
    return wrap;
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { processVariance: DEFAULTS.processVariance, observationSd: DEFAULTS.observationSd, observation: DEFAULTS.observation, drift: DEFAULTS.drift, revealed: false, feedback: "" };
    var answers = { noise: null, process: null };
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "标量数据同化：先验、观测与后验" }));
    shell.appendChild(element(doc, "p", { className: "eia-note", text: "先完成两个预测；展开后再改变误差预算，观察信息如何重新分配。" }));
    var form = element(doc, "form", {});
    var predictionBox = element(doc, "fieldset", {});
    predictionBox.appendChild(element(doc, "legend", { text: "预测门" }));
    var groups = [];
    function addQuestion(key, prompt, choices) {
      predictionBox.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "eia-choices", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
        button.addEventListener("click", function () {
          answers[key] = choice[0];
          groups.forEach(function (item) { item.button.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); });
        });
        groups.push({ key: key, value: choice[0], button: button });
        row.appendChild(button);
      });
      predictionBox.appendChild(row);
    }
    addQuestion("noise", "观测噪声变大时，后验均值更靠近？", [["prior", "先验预测"], ["sensor", "传感器"]]);
    addQuestion("process", "过程方差变大且观测不变时，K 会？", [["up", "变大"], ["down", "变小"]]);
    form.appendChild(predictionBox);
    var actions = element(doc, "div", { className: "eia-actions" });
    actions.appendChild(element(doc, "button", { type: "submit", className: "eia-primary", text: "提交预测并展开" }));
    actions.appendChild(element(doc, "button", { type: "button", text: "重置" }));
    form.appendChild(actions);
    var feedback = element(doc, "p", { className: "eia-feedback", role: "status", "aria-live": "polite" });
    form.appendChild(feedback);
    shell.appendChild(form);
    var controls = element(doc, "div", { className: "eia-controls", hidden: "hidden" });
    function control(label, input, output) {
      return element(doc, "label", { className: "eia-control" }, [element(doc, "span", { text: label + " = " }), output, input]);
    }
    var processInput = element(doc, "input", { type: "range", min: "0", max: "400", step: "20", value: "100", "aria-label": "过程方差" });
    var processOutput = element(doc, "output", { text: "100" });
    var noiseInput = element(doc, "input", { type: "range", min: "5", max: "40", step: "1", value: "15", "aria-label": "观测标准差" });
    var noiseOutput = element(doc, "output", { text: "15" });
    var observationInput = element(doc, "input", { type: "range", min: "80", max: "180", step: "1", value: "150", "aria-label": "观测值" });
    var observationOutput = element(doc, "output", { text: "150" });
    var driftInput = element(doc, "input", { type: "range", min: "-30", max: "30", step: "1", value: "0", "aria-label": "模型漂移" });
    var driftOutput = element(doc, "output", { text: "0" });
    controls.appendChild(control("过程方差", processInput, processOutput));
    controls.appendChild(control("观测标准差", noiseInput, noiseOutput));
    controls.appendChild(control("观测值", observationInput, observationOutput));
    controls.appendChild(control("模型漂移", driftInput, driftOutput));
    shell.appendChild(controls);
    var revealed = element(doc, "section", { className: "eia-revealed", hidden: "hidden" });
    var stage = element(doc, "div", { className: "eia-stage" });
    var svg = doc.createElementNS(SVG_NS, "svg");
    stage.appendChild(svg);
    revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "eia-metrics" });
    revealed.appendChild(metrics);
    var ledger = element(doc, "div", {});
    revealed.appendChild(ledger);
    shell.appendChild(revealed);
    rootNode.replaceChildren(shell);
    function metric(label, value) { return element(doc, "div", { className: "eia-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
    function render() {
      processOutput.textContent = String(state.processVariance);
      noiseOutput.textContent = String(state.observationSd);
      observationOutput.textContent = String(state.observation);
      driftOutput.textContent = String(state.drift);
      feedback.textContent = state.feedback;
      controls.hidden = !state.revealed;
      revealed.hidden = !state.revealed;
      if (!state.revealed) return;
      var result = compute({ priorMean: DEFAULTS.priorMean, priorVariance: DEFAULTS.priorVariance, processVariance: state.processVariance, observation: state.observation, observationVariance: state.observationSd * state.observationSd, drift: state.drift });
      draw(doc, svg, result);
      clear(metrics);
      metrics.appendChild(metric("增益 K", format(result.gain, 3)));
      metrics.appendChild(metric("创新", format(result.innovation, 1)));
      metrics.appendChild(metric("后验均值", format(result.posteriorMean, 1)));
      metrics.appendChild(metric("后验标准差", format(result.posteriorSd, 1)));
      clear(ledger);
      ledger.appendChild(table(doc, result));
    }
    function change(field, input) {
      input.addEventListener("input", function () {
        state[field] = Number(input.value);
        state.revealed = state.revealed;
        render();
      });
    }
    change("processVariance", processInput);
    change("observationSd", noiseInput);
    change("observation", observationInput);
    change("drift", driftInput);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (answers.noise === null || answers.process === null) {
        state.feedback = "请先回答两个误差预算问题。";
        render();
        return;
      }
      var score = (answers.noise === "prior" ? 1 : 0) + (answers.process === "up" ? 1 : 0);
      state.revealed = true;
      state.feedback = "已揭晓：" + score + " / 2 命中；现在可以改动参数。";
      render();
      if (api && typeof api.announce === "function") api.announce(rootNode, state.feedback);
    });
    actions.lastChild.addEventListener("click", function () {
      state = { processVariance: DEFAULTS.processVariance, observationSd: DEFAULTS.observationSd, observation: DEFAULTS.observation, drift: DEFAULTS.drift, revealed: false, feedback: "" };
      answers = { noise: null, process: null };
      groups.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); });
      processInput.value = String(DEFAULTS.processVariance); noiseInput.value = String(DEFAULTS.observationSd); observationInput.value = String(DEFAULTS.observation); driftInput.value = String(DEFAULTS.drift);
      render();
      if (api && typeof api.announce === "function") api.announce(rootNode, "反演同化实验已重置。");
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var result = compute(DEFAULTS);
    check(Math.abs(result.gain - 500 / 725) < 1e-12, "gain follows precision weighting");
    check(Math.abs(result.posteriorMean - (120 + (500 / 725) * 30)) < 1e-12, "posterior mean uses innovation");
    check(result.posteriorVariance < result.forecastVariance, "assimilation reduces stated variance");
    check(compute({ priorMean: 120, priorVariance: 400, processVariance: 100, observation: 150, observationVariance: 1600 }).gain < result.gain, "noisier observation receives less weight");
    check(compute({ priorMean: 120, priorVariance: 400, processVariance: 400, observation: 150, observationVariance: 225 }).gain > result.gain, "larger process uncertainty increases observation weight");
    check(Math.abs(compute({ priorMean: 10, priorVariance: 0, processVariance: 0, observation: 15, observationVariance: 1 }).posteriorVariance) < 1e-12, "zero forecast variance remains deterministic");
    return { checks: checks };
  }

  return { DEFAULTS: DEFAULTS, compute: compute, mount: mount, selfTest: selfTest };
});
