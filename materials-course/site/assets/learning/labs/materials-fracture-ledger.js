(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-fracture-ledger", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-fracture-ledger self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-fracture-ledger self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-materials-fracture-ledger-styles";
  var DEFAULTS = {
    geometryFactor: 1.12,
    maximumStressMPa: 180,
    stressRatio: 0.1,
    crackLengthMm: 2,
    toughnessMPaSqrtM: 50,
    thresholdMPaSqrtM: 4,
    parisC: 3e-11,
    parisM: 3
  };

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-8);
  }

  function format(value, digits) {
    if (value === Infinity) return "∞";
    if (!finite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (places === 0) return value.toFixed(0);
    if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function stressIntensityFactor(geometryFactor, stressMPa, crackLengthM) {
    if (!finite(geometryFactor) || geometryFactor <= 0) throw new RangeError("几何因子 Y 必须为正。");
    if (!finite(stressMPa)) throw new RangeError("应力必须是有限数，单位为 MPa。");
    if (!finite(crackLengthM) || crackLengthM <= 0) throw new RangeError("裂纹长度必须为正，单位为 m。");
    return geometryFactor * stressMPa * Math.sqrt(Math.PI * crackLengthM);
  }

  function criticalCrackLength(toughnessMPaSqrtM, geometryFactor, stressMPa) {
    if (!finite(toughnessMPaSqrtM) || toughnessMPaSqrtM <= 0) throw new RangeError("K_IC 必须为正。");
    if (!finite(geometryFactor) || geometryFactor <= 0) throw new RangeError("Y 必须为正。");
    if (!finite(stressMPa) || stressMPa <= 0) return Infinity;
    return Math.pow(toughnessMPaSqrtM / (geometryFactor * stressMPa), 2) / Math.PI;
  }

  function parisGrowthRate(parisC, parisM, deltaK, thresholdMPaSqrtM, toughnessMPaSqrtM, maximumK) {
    if (!finite(parisC) || parisC <= 0) throw new RangeError("Paris 常数 C 必须为正。");
    if (!finite(parisM) || parisM <= 0) throw new RangeError("Paris 指数 m 必须为正。");
    if (!finite(deltaK) || deltaK < 0) throw new RangeError("ΔK 必须是非负有限数。");
    if (!finite(thresholdMPaSqrtM) || thresholdMPaSqrtM < 0) throw new RangeError("疲劳阈值必须是非负数。");
    if (!finite(toughnessMPaSqrtM) || toughnessMPaSqrtM <= 0) throw new RangeError("K_IC 必须为正。");
    if (!finite(maximumK)) throw new RangeError("K_max 必须是有限数。");
    if (maximumK >= toughnessMPaSqrtM) return { regime: "unstable-fracture", rateMPerCycle: 0 };
    if (deltaK <= thresholdMPaSqrtM) return { regime: "below-threshold", rateMPerCycle: 0 };
    return { regime: "paris", rateMPerCycle: parisC * Math.pow(deltaK, parisM) };
  }

  function cyclesToCritical(initialCrackM, criticalCrackM, parisC, parisM, geometryFactor, deltaStressMPa) {
    if (!finite(initialCrackM) || !finite(criticalCrackM) || initialCrackM <= 0 || criticalCrackM <= initialCrackM) return Infinity;
    if (!finite(parisC) || parisC <= 0 || !finite(parisM) || parisM <= 0 || !finite(geometryFactor) || geometryFactor <= 0 || !finite(deltaStressMPa) || deltaStressMPa <= 0) return Infinity;
    var coefficient = parisC * Math.pow(geometryFactor * deltaStressMPa * Math.sqrt(Math.PI), parisM);
    if (parisM === 2) return Math.log(criticalCrackM / initialCrackM) / coefficient;
    var exponent = 1 - parisM / 2;
    return (Math.pow(criticalCrackM, exponent) - Math.pow(initialCrackM, exponent)) / (coefficient * exponent);
  }

  function copyDefaults() {
    var copy = {};
    Object.keys(DEFAULTS).forEach(function (key) { copy[key] = DEFAULTS[key]; });
    return copy;
  }

  function fractureLedger(input) {
    var p = copyDefaults();
    Object.keys(input || {}).forEach(function (key) { if (p[key] !== undefined) p[key] = Number(input[key]); });
    if (!finite(p.geometryFactor) || p.geometryFactor <= 0) throw new RangeError("Y 必须为正。");
    if (!finite(p.maximumStressMPa) || p.maximumStressMPa <= 0) throw new RangeError("σ_max 必须为正，单位为 MPa。");
    if (!finite(p.stressRatio) || p.stressRatio >= 1) throw new RangeError("应力比 R 必须小于 1。");
    if (!finite(p.crackLengthMm) || p.crackLengthMm <= 0) throw new RangeError("裂纹长度必须为正，单位为 mm。");
    if (!finite(p.toughnessMPaSqrtM) || p.toughnessMPaSqrtM <= 0) throw new RangeError("K_IC 必须为正。");
    if (!finite(p.thresholdMPaSqrtM) || p.thresholdMPaSqrtM < 0) throw new RangeError("ΔK_th 必须非负。");
    var crackLengthM = p.crackLengthMm * 1e-3;
    var minimumStressMPa = p.maximumStressMPa * p.stressRatio;
    var deltaStressMPa = p.maximumStressMPa - minimumStressMPa;
    var maximumK = stressIntensityFactor(p.geometryFactor, p.maximumStressMPa, crackLengthM);
    var minimumK = stressIntensityFactor(p.geometryFactor, minimumStressMPa, crackLengthM);
    var deltaK = maximumK - minimumK;
    var criticalM = criticalCrackLength(p.toughnessMPaSqrtM, p.geometryFactor, p.maximumStressMPa);
    var paris = parisGrowthRate(p.parisC, p.parisM, deltaK, p.thresholdMPaSqrtM, p.toughnessMPaSqrtM, maximumK);
    var safetyFactor = p.toughnessMPaSqrtM / maximumK;
    return {
      geometryFactor: p.geometryFactor,
      maximumStressMPa: p.maximumStressMPa,
      minimumStressMPa: minimumStressMPa,
      stressRatio: p.stressRatio,
      deltaStressMPa: deltaStressMPa,
      crackLengthMm: p.crackLengthMm,
      crackLengthM: crackLengthM,
      toughnessMPaSqrtM: p.toughnessMPaSqrtM,
      thresholdMPaSqrtM: p.thresholdMPaSqrtM,
      parisC: p.parisC,
      parisM: p.parisM,
      maximumK: maximumK,
      minimumK: minimumK,
      deltaK: deltaK,
      criticalCrackMm: criticalM * 1000,
      safetyFactor: safetyFactor,
      regime: paris.regime,
      growthRateMPerCycle: paris.rateMPerCycle,
      cyclesToCritical: paris.regime === "paris" ? cyclesToCritical(crackLengthM, criticalM, p.parisC, p.parisM, p.geometryFactor, deltaStressMPa) : Infinity
    };
  }

  function element(doc, tag, className, text) {
    var item = doc.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function svgElement(doc, tag, attrs, text) {
    var item = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) { item.setAttribute(key, String(attrs[key])); });
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function ensureStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="materials-fracture-ledger"]{--mf-accent:#7c3aed;--mf-crack:#b64335;--mf-safe:#39734d;--mf-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="materials-fracture-ledger"] *{box-sizing:border-box}' +
      '[data-learning-lab="materials-fracture-ledger"] [hidden]{display:none!important}' +
      '[data-learning-lab="materials-fracture-ledger"] .mf-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="materials-fracture-ledger"] label{display:grid;gap:6px;font-weight:700;min-width:0}' +
      '[data-learning-lab="materials-fracture-ledger"] output{color:var(--mf-accent);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="materials-fracture-ledger"] input,[data-learning-lab="materials-fracture-ledger"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="materials-fracture-ledger"] input[type="range"]{width:100%;accent-color:var(--mf-accent)}' +
      '[data-learning-lab="materials-fracture-ledger"] button{min-width:0;padding:8px 12px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="materials-fracture-ledger"] button:hover,[data-learning-lab="materials-fracture-ledger"] button[aria-pressed="true"]{border-color:var(--mf-accent);background:var(--mf-accent);color:#fff}' +
      '[data-learning-lab="materials-fracture-ledger"] button:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="materials-fracture-ledger"] .mf-question{margin:16px 0 8px;font-weight:750}' +
      '[data-learning-lab="materials-fracture-ledger"] .mf-options,[data-learning-lab="materials-fracture-ledger"] .mf-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}' +
      '[data-learning-lab="materials-fracture-ledger"] .mf-feedback{min-height:2em;margin:8px 0;font-weight:700}' +
      '[data-learning-lab="materials-fracture-ledger"] .mf-good{color:var(--cl-green,#39734d)}[data-learning-lab="materials-fracture-ledger"] .mf-warn{color:var(--cl-red,#b64335)}' +
      '[data-learning-lab="materials-fracture-ledger"] .mf-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(245px,.75fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="materials-fracture-ledger"] .mf-chart{min-width:0;padding:6px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas)}' +
      '[data-learning-lab="materials-fracture-ledger"] svg{display:block;width:100%;height:auto;aspect-ratio:620/370}' +
      '[data-learning-lab="materials-fracture-ledger"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="materials-fracture-ledger"] .mf-table-wrap{max-width:100%;overflow-x:auto}' +
      '[data-learning-lab="materials-fracture-ledger"] table{width:100%;border-collapse:collapse;min-width:430px}' +
      '[data-learning-lab="materials-fracture-ledger"] th,[data-learning-lab="materials-fracture-ledger"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="materials-fracture-ledger"] .mf-note{margin-top:12px;padding:10px 12px;border-left:4px solid var(--mf-gold);color:var(--fg-soft,currentColor);font-size:13px}' +
      '@media(max-width:760px){[data-learning-lab="materials-fracture-ledger"] .mf-controls,[data-learning-lab="materials-fracture-ledger"] .mf-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
      '@media(max-width:540px){[data-learning-lab="materials-fracture-ledger"] .mf-controls,[data-learning-lab="materials-fracture-ledger"] .mf-grid{grid-template-columns:1fr}}' +
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-fracture-ledger"] *{scroll-behavior:auto!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function predictionKey(result) {
    return result.regime;
  }

  function regimeLabel(regime) {
    if (regime === "below-threshold") return "低于疲劳阈值：近似不扩展";
    if (regime === "unstable-fracture") return "K_max ≥ K_IC：失稳断裂";
    return "Paris 稳定扩展区";
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 620 370", role: "img", "aria-label": "裂纹长度与应力强度因子账本图" });
    svg.appendChild(svgElement(doc, "title", {}, "K_max、ΔK、K_IC 与疲劳阈值"));
    var left = 58, right = 580, top = 40, bottom = 318;
    var maxCrack = Math.max(8, result.crackLengthMm * 1.7, Math.min(40, result.criticalCrackMm * 1.25));
    var maxK = Math.max(result.toughnessMPaSqrtM * 1.2, result.maximumK * 1.25, result.deltaK * 1.25, result.thresholdMPaSqrtM * 2);
    function mapX(crackMm) { return left + (right - left) * crackMm / maxCrack; }
    function mapY(kValue) { return bottom - (bottom - top) * kValue / maxK; }
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: left, y2: top, stroke: "currentColor", "stroke-width": 1.2 }));
    var maxPath = [];
    var deltaPath = [];
    for (var index = 1; index <= 100; index += 1) {
      var crackMm = maxCrack * index / 100;
      var crackM = crackMm * 1e-3;
      var kMax = stressIntensityFactor(result.geometryFactor, result.maximumStressMPa, crackM);
      var kDelta = stressIntensityFactor(result.geometryFactor, result.deltaStressMPa, crackM);
      maxPath.push((index === 1 ? "M" : "L") + mapX(crackMm).toFixed(2) + " " + mapY(kMax).toFixed(2));
      deltaPath.push((index === 1 ? "M" : "L") + mapX(crackMm).toFixed(2) + " " + mapY(kDelta).toFixed(2));
    }
    svg.appendChild(svgElement(doc, "path", { d: maxPath.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "path", { d: deltaPath.join(" "), fill: "none", stroke: "#7c3aed", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapY(result.toughnessMPaSqrtM), x2: right, y2: mapY(result.toughnessMPaSqrtM), stroke: "#39734d", "stroke-width": 2, "stroke-dasharray": "7 4" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapY(result.thresholdMPaSqrtM), x2: right, y2: mapY(result.thresholdMPaSqrtM), stroke: "#9b6a12", "stroke-width": 2, "stroke-dasharray": "3 5" }));
    svg.appendChild(svgElement(doc, "circle", { cx: mapX(result.crackLengthMm), cy: mapY(result.maximumK), r: 6, fill: "#b64335", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "circle", { cx: mapX(result.crackLengthMm), cy: mapY(result.deltaK), r: 6, fill: "#7c3aed", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: 60, y: 24, "font-size": 14, "font-weight": 700 }, "红：K_max　紫：ΔK　绿：K_IC　金：ΔK_th"));
    svg.appendChild(svgElement(doc, "text", { x: 555, y: 344, "font-size": 12, "text-anchor": "end" }, "裂纹长度 a / mm"));
    svg.appendChild(svgElement(doc, "text", { x: 21, y: 54, "font-size": 12, transform: "rotate(-90 21 54)" }, "应力强度 / MPa√m"));
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    ensureStyles(doc);
    var state = copyDefaults();
    var prediction = null;
    var revealed = false;
    var feedbackText = "先判断当前是阈值区、Paris 区还是失稳区。";
    var feedbackClass = "mf-feedback";
    var shell = element(doc, "div", "mf-lab");
    shell.appendChild(element(doc, "p", "mf-kicker", "默认：Y = 1.12、σ_max = 180 MPa、a = 2 mm、K_IC = 50 MPa√m。疲劳阈值与断裂韧性是两本不同的账。"));
    var controls = element(doc, "div", "mf-controls");
    var inputs = {};
    [["crackLengthMm", "裂纹长度 a / mm", 0.1, 10, 0.1, 1], ["maximumStressMPa", "最大应力 σ_max / MPa", 50, 500, 10, 0], ["stressRatio", "应力比 R = σ_min/σ_max", -0.5, 0.8, 0.05, 2], ["toughnessMPaSqrtM", "断裂韧性 K_IC / MPa√m", 10, 120, 1, 0], ["thresholdMPaSqrtM", "疲劳阈值 ΔK_th / MPa√m", 2, 12, 0.5, 1]].forEach(function (spec) {
      var label = element(doc, "label", "");
      var line = element(doc, "span", "", spec[1] + " = ");
      var output = element(doc, "output", "", format(state[spec[0]], spec[5]));
      line.appendChild(output);
      var input = element(doc, "input", "");
      input.type = "range";
      input.min = String(spec[2]);
      input.max = String(spec[3]);
      input.step = String(spec[4]);
      input.value = String(state[spec[0]]);
      input.setAttribute("aria-label", spec[1]);
      input.addEventListener("input", function () {
        state[spec[0]] = Number(input.value);
        prediction = null;
        revealed = false;
        feedbackText = "参数已改变，请重新作答。";
        feedbackClass = "mf-feedback mf-warn";
        render();
      });
      label.appendChild(line);
      label.appendChild(input);
      controls.appendChild(label);
      inputs[spec[0]] = { input: input, output: output, digits: spec[5] };
    });
    shell.appendChild(controls);
    shell.appendChild(element(doc, "p", "mf-question", "预测门：当前裂纹会落在哪个区间？"));
    var options = element(doc, "div", "mf-options");
    var optionButtons = [];
    [["below-threshold", "ΔK ≤ ΔK_th：阈值区"], ["paris", "ΔK_th < ΔK < K_IC：Paris 区"], ["unstable-fracture", "K_max ≥ K_IC：失稳"]].forEach(function (item) {
      var button = element(doc, "button", "", item[1]);
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        prediction = item[0];
        feedbackText = "预测已记录；点击“揭示并核对”查看 K、K_IC 与增长速率。";
        feedbackClass = "mf-feedback";
        render();
      });
      options.appendChild(button);
      optionButtons.push({ value: item[0], node: button });
    });
    shell.appendChild(options);
    var actions = element(doc, "div", "mf-actions");
    var reveal = element(doc, "button", "", "揭示并核对");
    reveal.type = "button";
    reveal.className = "mf-primary";
    var reset = element(doc, "button", "", "重置");
    reset.type = "button";
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", feedbackClass, feedbackText);
    feedback.setAttribute("aria-live", "polite");
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", "mf-result");
    resultPanel.hidden = true;
    var grid = element(doc, "div", "mf-grid");
    var chart = element(doc, "div", "mf-chart");
    var tableWrap = element(doc, "div", "mf-table-wrap");
    var table = element(doc, "table");
    tableWrap.appendChild(table);
    grid.appendChild(chart);
    grid.appendChild(tableWrap);
    resultPanel.appendChild(grid);
    resultPanel.appendChild(element(doc, "p", "mf-note", "K_IC 是单调加载断裂韧性；ΔK_th 是疲劳裂纹增长阈值，二者不可互换。Paris 定律只覆盖稳定扩展的中段，不能拿它替代阈值判据，也不能越过 K_max = K_IC 的失稳边界。"));
    shell.appendChild(resultPanel);
    root.replaceChildren(shell);

    reveal.addEventListener("click", function () {
      if (prediction === null) {
        feedbackText = "请先作出断裂/疲劳区间预测。";
        feedbackClass = "mf-feedback mf-warn";
        render();
        return;
      }
      try {
        var result = fractureLedger(state);
        var correct = prediction === predictionKey(result);
        revealed = true;
        feedbackText = (correct ? "预测命中。" : "预测未命中；把 K_max、ΔK、K_IC、ΔK_th 分开对账。") + " 当前：" + regimeLabel(result.regime) + "。";
        feedbackClass = "mf-feedback " + (correct ? "mf-good" : "mf-warn");
        render();
        if (api && api.announce) api.announce(root, feedbackText);
      } catch (error) {
        feedbackText = "输入无效：" + error.message;
        feedbackClass = "mf-feedback mf-warn";
        render();
      }
    });
    reset.addEventListener("click", function () {
      state = copyDefaults();
      prediction = null;
      revealed = false;
      feedbackText = "先判断当前是阈值区、Paris 区还是失稳区。";
      feedbackClass = "mf-feedback";
      render();
    });

    function render() {
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state[key]);
        inputs[key].output.textContent = format(state[key], inputs[key].digits);
      });
      optionButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", prediction === item.value ? "true" : "false"); });
      feedback.textContent = feedbackText;
      feedback.className = feedbackClass;
      resultPanel.hidden = !revealed;
      if (revealed) {
        var result = fractureLedger(state);
        chart.replaceChildren(renderSvg(doc, result));
        table.innerHTML =
          "<caption>断裂—疲劳计算账本</caption>" +
          "<thead><tr><th>量</th><th>结果</th><th>单位/解释</th></tr></thead><tbody>" +
          "<tr><td>K_max</td><td>" + format(result.maximumK, 3) + "</td><td>MPa√m</td></tr>" +
          "<tr><td>K_min / ΔK</td><td>" + format(result.minimumK, 3) + " / " + format(result.deltaK, 3) + "</td><td>MPa√m</td></tr>" +
          "<tr><td>K_IC / 安全因子</td><td>" + format(result.toughnessMPaSqrtM, 2) + " / " + format(result.safetyFactor, 3) + "</td><td>K_IC / K_max</td></tr>" +
          "<tr><td>临界裂纹 a_c</td><td>" + format(result.criticalCrackMm, 3) + "</td><td>mm</td></tr>" +
          "<tr><td>判定</td><td>" + regimeLabel(result.regime) + "</td><td>阈值与失稳分开</td></tr>" +
          "<tr><td>da/dN</td><td>" + format(result.growthRateMPerCycle, 4) + "</td><td>m/cycle，仅 Paris 区</td></tr>" +
          "<tr><td>到 a_c 的估计循环数</td><td>" + format(result.cyclesToCritical, 3) + "</td><td>Paris 外推，不是寿命保证</td></tr>" +
          "</tbody>";
      } else {
        chart.replaceChildren();
        table.replaceChildren();
      }
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var expected = 1.12 * 180 * Math.sqrt(Math.PI * 0.002);
    check(near(stressIntensityFactor(1.12, 180, 0.002), expected, 1e-12), "K_I formula");
    var critical = criticalCrackLength(50, 1.12, 180);
    check(near(critical, Math.pow(50 / (1.12 * 180), 2) / Math.PI, 1e-12), "critical crack formula");
    var base = fractureLedger(DEFAULTS);
    check(base.maximumK < base.toughnessMPaSqrtM, "default monotonic fracture is safe");
    check(base.deltaK > base.thresholdMPaSqrtM, "default fatigue range above threshold");
    check(base.regime === "paris", "default Paris regime");
    check(base.safetyFactor > 1, "default safety factor");
    check(base.growthRateMPerCycle > 0 && base.cyclesToCritical > 0, "Paris ledger positive");
    var threshold = fractureLedger({ maximumStressMPa: 80, stressRatio: 0.8, crackLengthMm: 0.5 });
    check(threshold.regime === "below-threshold", "threshold regime is separate");
    check(threshold.growthRateMPerCycle === 0, "no Paris growth below threshold");
    var unstable = fractureLedger({ maximumStressMPa: 500, crackLengthMm: 8 });
    check(unstable.regime === "unstable-fracture", "unstable regime");
    var doubled = stressIntensityFactor(1.12, 180, 0.008);
    check(near(doubled / expected, 2, 1e-12), "K scales with square root crack length");
    check(parisGrowthRate(3e-11, 3, 2, 4, 50, 10).regime === "below-threshold", "threshold precedence");
    var threw = false;
    try { stressIntensityFactor(0, 100, 0.001); } catch (error) { threw = true; }
    check(threw, "geometry validation");
    threw = false;
    try { fractureLedger({ stressRatio: 1 }); } catch (error2) { threw = true; }
    check(threw, "stress ratio validation");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    stressIntensityFactor: stressIntensityFactor,
    criticalCrackLength: criticalCrackLength,
    parisGrowthRate: parisGrowthRate,
    cyclesToCritical: cyclesToCritical,
    fractureLedger: fractureLedger,
    mount: mount,
    selfTest: selfTest
  };
});
