(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-diffusion-clock", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-diffusion-clock self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-diffusion-clock self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-materials-diffusion-clock-styles";
  var GAS_CONSTANT = 8.314462618;
  var DEFAULTS = {
    temperatureC: 930,
    timeHours: 6,
    depthMm: 0.5,
    surfaceConcentration: 1,
    bulkConcentration: 0,
    preExponential: 1.2e-5,
    activationEnergy: 140000
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
    if (!finite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (places === 0) return value.toFixed(0);
    if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function errorFunction(x) {
    if (x === Infinity) return 1;
    if (x === -Infinity) return -1;
    var sign = x < 0 ? -1 : 1;
    var value = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * value);
    var polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
    return sign * (1 - polynomial * Math.exp(-value * value));
  }

  function complementaryErrorFunction(x) {
    if (x === Infinity) return 0;
    if (x === -Infinity) return 2;
    return 1 - errorFunction(x);
  }

  function kelvin(temperatureC) {
    if (!finite(temperatureC) || temperatureC <= -273.15) throw new RangeError("温度必须高于绝对零度。");
    return temperatureC + 273.15;
  }

  function diffusionCoefficient(temperatureC, preExponential, activationEnergy) {
    var d0 = preExponential === undefined ? DEFAULTS.preExponential : preExponential;
    var q = activationEnergy === undefined ? DEFAULTS.activationEnergy : activationEnergy;
    if (!finite(d0) || d0 <= 0) throw new RangeError("D₀ 必须是正数，单位为 m²/s。");
    if (!finite(q) || q < 0) throw new RangeError("Q 必须是非负数，单位为 J/mol。");
    var temperatureK = kelvin(temperatureC);
    return d0 * Math.exp(-q / (GAS_CONSTANT * temperatureK));
  }

  function concentrationAt(depthM, timeSeconds, temperatureC, options) {
    var parameters = options || {};
    var cSurface = parameters.surfaceConcentration === undefined ? DEFAULTS.surfaceConcentration : parameters.surfaceConcentration;
    var cBulk = parameters.bulkConcentration === undefined ? DEFAULTS.bulkConcentration : parameters.bulkConcentration;
    if (!finite(depthM) || depthM < 0) throw new RangeError("深度必须是非负数，单位为 m。");
    if (!finite(timeSeconds) || timeSeconds < 0) throw new RangeError("时间必须是非负数，单位为 s。");
    if (!finite(cSurface) || !finite(cBulk)) throw new RangeError("浓度边界必须是有限数。");
    if (timeSeconds === 0) return depthM === 0 ? cSurface : cBulk;
    if (depthM === 0) return cSurface;
    var coefficient = diffusionCoefficient(temperatureC, parameters.preExponential, parameters.activationEnergy);
    var argument = depthM / (2 * Math.sqrt(coefficient * timeSeconds));
    return cBulk + (cSurface - cBulk) * complementaryErrorFunction(argument);
  }

  function copyDefaults() {
    var copy = {};
    Object.keys(DEFAULTS).forEach(function (key) { copy[key] = DEFAULTS[key]; });
    return copy;
  }

  function diffusionLedger(input) {
    var p = copyDefaults();
    Object.keys(input || {}).forEach(function (key) { if (p[key] !== undefined) p[key] = Number(input[key]); });
    if (!finite(p.temperatureC) || p.temperatureC <= -273.15) throw new RangeError("温度必须高于绝对零度。");
    if (!finite(p.timeHours) || p.timeHours < 0) throw new RangeError("时间必须是非负数，单位为 h。");
    if (!finite(p.depthMm) || p.depthMm < 0) throw new RangeError("深度必须是非负数，单位为 mm。");
    var temperatureK = kelvin(p.temperatureC);
    var timeSeconds = p.timeHours * 3600;
    var depthM = p.depthMm * 1e-3;
    var coefficient = diffusionCoefficient(p.temperatureC, p.preExponential, p.activationEnergy);
    var rootDt = Math.sqrt(coefficient * timeSeconds);
    var value = concentrationAt(depthM, timeSeconds, p.temperatureC, p);
    var argument = timeSeconds === 0 ? Infinity : depthM / (2 * rootDt);
    return {
      temperatureC: p.temperatureC,
      temperatureK: temperatureK,
      timeHours: p.timeHours,
      timeSeconds: timeSeconds,
      depthMm: p.depthMm,
      depthM: depthM,
      diffusionCoefficient: coefficient,
      rootDtM: rootDt,
      erfcArgument: argument,
      normalizedConcentration: (value - p.bulkConcentration) / (p.surfaceConcentration - p.bulkConcentration),
      concentration: value,
      surfaceConcentration: p.surfaceConcentration,
      bulkConcentration: p.bulkConcentration,
      characteristicDepthMm: rootDt * 1000,
      model: "constant surface concentration, semi-infinite solid"
    };
  }

  function profile(input, count) {
    var p = copyDefaults();
    Object.keys(input || {}).forEach(function (key) { if (p[key] !== undefined) p[key] = Number(input[key]); });
    var ledger = diffusionLedger(p);
    var points = [];
    var samples = count || 80;
    var maximumMm = Math.max(1.2, p.depthMm * 1.8, ledger.characteristicDepthMm * 3.2);
    for (var index = 0; index <= samples; index += 1) {
      var depthMm = maximumMm * index / samples;
      points.push({ depthMm: depthMm, concentration: concentrationAt(depthMm * 1e-3, ledger.timeSeconds, p.temperatureC, p) });
    }
    return { points: points, maximumDepthMm: maximumMm, ledger: ledger };
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
      '[data-learning-lab="materials-diffusion-clock"]{--md-accent:#0f766e;--md-hot:#b64335;--md-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="materials-diffusion-clock"] *{box-sizing:border-box}' +
      '[data-learning-lab="materials-diffusion-clock"] [hidden]{display:none!important}' +
      '[data-learning-lab="materials-diffusion-clock"] .md-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="materials-diffusion-clock"] label{display:grid;gap:6px;font-weight:700;min-width:0}' +
      '[data-learning-lab="materials-diffusion-clock"] output{color:var(--md-accent);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="materials-diffusion-clock"] input,[data-learning-lab="materials-diffusion-clock"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="materials-diffusion-clock"] input[type="range"]{width:100%;accent-color:var(--md-accent)}' +
      '[data-learning-lab="materials-diffusion-clock"] button{min-width:0;padding:8px 12px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="materials-diffusion-clock"] button:hover,[data-learning-lab="materials-diffusion-clock"] button[aria-pressed="true"]{border-color:var(--md-accent);background:var(--md-accent);color:#fff}' +
      '[data-learning-lab="materials-diffusion-clock"] button:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="materials-diffusion-clock"] .md-question{margin:16px 0 8px;font-weight:750}' +
      '[data-learning-lab="materials-diffusion-clock"] .md-options,[data-learning-lab="materials-diffusion-clock"] .md-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}' +
      '[data-learning-lab="materials-diffusion-clock"] .md-feedback{min-height:2em;margin:8px 0;font-weight:700}' +
      '[data-learning-lab="materials-diffusion-clock"] .md-good{color:var(--cl-green,#39734d)}[data-learning-lab="materials-diffusion-clock"] .md-warn{color:var(--cl-red,#b64335)}' +
      '[data-learning-lab="materials-diffusion-clock"] .md-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(245px,.75fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="materials-diffusion-clock"] .md-chart{min-width:0;padding:6px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas)}' +
      '[data-learning-lab="materials-diffusion-clock"] svg{display:block;width:100%;height:auto;aspect-ratio:620/370}' +
      '[data-learning-lab="materials-diffusion-clock"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="materials-diffusion-clock"] .md-table-wrap{max-width:100%;overflow-x:auto}' +
      '[data-learning-lab="materials-diffusion-clock"] table{width:100%;border-collapse:collapse;min-width:390px}' +
      '[data-learning-lab="materials-diffusion-clock"] th,[data-learning-lab="materials-diffusion-clock"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="materials-diffusion-clock"] .md-note{margin-top:12px;padding:10px 12px;border-left:4px solid var(--md-gold);color:var(--fg-soft,currentColor);font-size:13px}' +
      '@media(max-width:760px){[data-learning-lab="materials-diffusion-clock"] .md-controls,[data-learning-lab="materials-diffusion-clock"] .md-grid{grid-template-columns:1fr}}' +
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-diffusion-clock"] *{scroll-behavior:auto!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function predictionKey(ledger) {
    if (ledger.depthMm === 0 || ledger.timeHours === 0) return "unchanged";
    return "arrhenius";
  }

  function renderSvg(doc, result) {
    var sampled = profile(result, 90);
    var svg = svgElement(doc, "svg", { viewBox: "0 0 620 370", role: "img", "aria-label": "误差函数扩散浓度剖面" });
    svg.appendChild(svgElement(doc, "title", {}, "Fick 第二定律的 erfc 浓度剖面"));
    var left = 55, right = 585, top = 40, bottom = 318;
    function mapX(depthMm) { return left + (right - left) * depthMm / sampled.maximumDepthMm; }
    function mapY(concentration) { return bottom - (concentration - result.bulkConcentration) / (result.surfaceConcentration - result.bulkConcentration) * (bottom - top); }
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: left, y2: top, stroke: "currentColor", "stroke-width": 1.2 }));
    var path = sampled.points.map(function (point, index) { return (index ? "L" : "M") + mapX(point.depthMm).toFixed(2) + " " + mapY(point.concentration).toFixed(2); }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: path, fill: "none", stroke: "#0f766e", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "line", { x1: mapX(result.depthMm), y1: bottom, x2: mapX(result.depthMm), y2: mapY(result.concentration), stroke: "#b64335", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "circle", { cx: mapX(result.depthMm), cy: mapY(result.concentration), r: 6, fill: "#b64335", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "line", { x1: mapX(result.characteristicDepthMm), y1: top, x2: mapX(result.characteristicDepthMm), y2: bottom, stroke: "#9b6a12", "stroke-dasharray": "4 5" }));
    svg.appendChild(svgElement(doc, "text", { x: 58, y: 24, "font-size": 14, "font-weight": 700 }, "绿：erfc 剖面　红：目标深度　金：√(Dt)"));
    svg.appendChild(svgElement(doc, "text", { x: 560, y: 344, "font-size": 12, "text-anchor": "end" }, "深度 x / mm"));
    svg.appendChild(svgElement(doc, "text", { x: 20, y: 55, "font-size": 12, transform: "rotate(-90 20 55)" }, "归一化浓度"));
    svg.appendChild(svgElement(doc, "text", { x: 58, y: 310, "font-size": 11 }, "C₀"));
    svg.appendChild(svgElement(doc, "text", { x: 58, y: 52, "font-size": 11 }, "Cₛ"));
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    ensureStyles(doc);
    var state = copyDefaults();
    var prediction = null;
    var revealed = false;
    var feedbackText = "先判断升温对扩散前沿的影响，再揭示。";
    var feedbackClass = "md-feedback";
    var shell = element(doc, "div", "md-lab");
    shell.appendChild(element(doc, "p", "md-kicker", "默认：γ-Fe 中碳的教学参数，D₀ = 1.2×10⁻⁵ m²/s，Q = 140 kJ/mol。"));
    var controls = element(doc, "div", "md-controls");
    var inputs = {};
    [["temperatureC", "温度 T / °C", 700, 1100, 10, 0], ["timeHours", "时间 t / h", 0, 24, 0.25, 2], ["depthMm", "目标深度 x / mm", 0, 2.5, 0.05, 2]].forEach(function (spec) {
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
        feedbackClass = "md-feedback md-warn";
        render();
      });
      label.appendChild(line);
      label.appendChild(input);
      controls.appendChild(label);
      inputs[spec[0]] = { input: input, output: output, digits: spec[5] };
    });
    shell.appendChild(controls);
    shell.appendChild(element(doc, "p", "md-question", "预测门：若温度升高而时间不变，非表面处的浓度剖面会怎样？"));
    var options = element(doc, "div", "md-options");
    var optionButtons = [];
    [["arrhenius", "显著推进：D 按 Arrhenius 指数上升"], ["linear", "只线性增加：温度只改一个比例"], ["unchanged", "基本不变：温度不影响固态扩散"]].forEach(function (item) {
      var button = element(doc, "button", "", item[1]);
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        prediction = item[0];
        feedbackText = "预测已记录；点击“揭示并核对”查看 D、√(Dt) 与剖面。";
        feedbackClass = "md-feedback";
        render();
      });
      options.appendChild(button);
      optionButtons.push({ value: item[0], node: button });
    });
    shell.appendChild(options);
    var actions = element(doc, "div", "md-actions");
    var reveal = element(doc, "button", "", "揭示并核对");
    reveal.type = "button";
    reveal.className = "md-primary";
    var reset = element(doc, "button", "", "重置");
    reset.type = "button";
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", feedbackClass, feedbackText);
    feedback.setAttribute("aria-live", "polite");
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", "md-result");
    resultPanel.hidden = true;
    var grid = element(doc, "div", "md-grid");
    var chart = element(doc, "div", "md-chart");
    var tableWrap = element(doc, "div", "md-table-wrap");
    var table = element(doc, "table");
    tableWrap.appendChild(table);
    grid.appendChild(chart);
    grid.appendChild(tableWrap);
    resultPanel.appendChild(grid);
    resultPanel.appendChild(element(doc, "p", "md-note", "单位账必须闭合：T 先转 K，t 先转 s，D 用 m²/s，x 用 m。此 erfc 解假设恒定表面浓度、半无限固体、常数 D，不自动包含有限厚度、相变、应力或晶界短路扩散。"));
    shell.appendChild(resultPanel);
    root.replaceChildren(shell);

    reveal.addEventListener("click", function () {
      if (prediction === null) {
        feedbackText = "请先作出扩散预测。";
        feedbackClass = "md-feedback md-warn";
        render();
        return;
      }
      try {
        var result = diffusionLedger(state);
        var correct = prediction === predictionKey(result);
        revealed = true;
        feedbackText = (correct ? "预测命中。" : "预测未命中；看 Arrhenius 与 √(Dt) 两本账。") + " 目标点的归一化浓度为 " + format(result.normalizedConcentration, 3) + "。";
        feedbackClass = "md-feedback " + (correct ? "md-good" : "md-warn");
        render();
        if (api && api.announce) api.announce(root, feedbackText);
      } catch (error) {
        feedbackText = "输入无效：" + error.message;
        feedbackClass = "md-feedback md-warn";
        render();
      }
    });
    reset.addEventListener("click", function () {
      state = copyDefaults();
      prediction = null;
      revealed = false;
      feedbackText = "先判断升温对扩散前沿的影响，再揭示。";
      feedbackClass = "md-feedback";
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
        var result = diffusionLedger(state);
        chart.replaceChildren(renderSvg(doc, result));
        table.innerHTML =
          "<caption>扩散时钟账本</caption>" +
          "<thead><tr><th>量</th><th>结果</th><th>单位/解释</th></tr></thead><tbody>" +
          "<tr><td>T</td><td>" + format(result.temperatureC, 1) + " / " + format(result.temperatureK, 2) + "</td><td>°C / K</td></tr>" +
          "<tr><td>t</td><td>" + format(result.timeHours, 2) + " / " + format(result.timeSeconds, 0) + "</td><td>h / s</td></tr>" +
          "<tr><td>D(T)</td><td>" + format(result.diffusionCoefficient, 3) + "</td><td>m²/s</td></tr>" +
          "<tr><td>√(Dt)</td><td>" + format(result.rootDtM, 4) + " / " + format(result.characteristicDepthMm, 3) + "</td><td>m / mm</td></tr>" +
          "<tr><td>z = x/(2√Dt)</td><td>" + format(result.erfcArgument, 4) + "</td><td>erfc 自变量</td></tr>" +
          "<tr><td>C(x,t)</td><td>" + format(result.concentration, 4) + "（归一化 " + format(result.normalizedConcentration, 4) + "）</td><td>表面 1、体内 0</td></tr>" +
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
    check(near(errorFunction(0), 0, 1e-7), "erf zero");
    check(near(complementaryErrorFunction(0), 1, 1e-7), "erfc zero");
    check(complementaryErrorFunction(3) < 0.001, "erfc tail");
    var d900 = diffusionCoefficient(900);
    var d1000 = diffusionCoefficient(1000);
    check(d900 > 0 && d1000 > d900, "Arrhenius temperature monotonicity");
    var base = diffusionLedger(DEFAULTS);
    check(near(base.temperatureK, 1203.15, 1e-10), "Celsius to Kelvin conversion");
    check(near(base.timeSeconds, 21600, 1e-8), "hours to seconds conversion");
    check(base.diffusionCoefficient > 0 && base.rootDtM > 0, "diffusion scale positive");
    check(near(concentrationAt(0, base.timeSeconds, base.temperatureC, DEFAULTS), 1, 1e-9), "surface boundary concentration");
    check(concentrationAt(0.001, base.timeSeconds, base.temperatureC, DEFAULTS) < concentrationAt(0.0001, base.timeSeconds, base.temperatureC, DEFAULTS), "profile decays with depth");
    var oneHour = diffusionLedger({ timeHours: 1 });
    var fourHour = diffusionLedger({ timeHours: 4 });
    check(near(fourHour.rootDtM / oneHour.rootDtM, 2, 1e-10), "sqrt time scale");
    var zeroTime = diffusionLedger({ timeHours: 0, depthMm: 0.5 });
    check(zeroTime.concentration === 0 && zeroTime.erfcArgument === Infinity, "zero time interior branch");
    var surface = diffusionLedger({ timeHours: 0, depthMm: 0 });
    check(surface.concentration === 1, "zero time surface branch");
    var threw = false;
    try { diffusionLedger({ timeHours: -1 }); } catch (error) { threw = true; }
    check(threw, "time validation");
    threw = false;
    try { diffusionCoefficient(-274); } catch (error2) { threw = true; }
    check(threw, "absolute zero validation");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    errorFunction: errorFunction,
    complementaryErrorFunction: complementaryErrorFunction,
    diffusionCoefficient: diffusionCoefficient,
    concentrationAt: concentrationAt,
    diffusionLedger: diffusionLedger,
    profile: profile,
    mount: mount,
    selfTest: selfTest
  };
});
