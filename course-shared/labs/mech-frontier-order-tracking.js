(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (typeof window !== "undefined" && window.CourseLearning && typeof window.CourseLearning.register === "function") {
    window.CourseLearning.register("mech-frontier-order-tracking", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-frontier-order-tracking self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-frontier-order-tracking self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "mech-frontier-order-tracking";
  var STYLE_ID = "cl-mech-frontier-order-tracking-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { rpm: 1800, sampleRate: 512, duration: 1, window: "rect" };
  var COMPONENTS = [{ order: 1, amplitude: 1, phase: 0 }, { order: 2.4, amplitude: 0.45, phase: 0 }];
  var PREDICTIONS = [
    { key: "alias", prompt: "采样率低于最高频率两倍时，测量会怎样？", expected: "alias", choices: [["alias", "出现混叠"], ["preserve", "无条件保留"], ["noise", "只增加噪声"]] },
    { key: "leakage", prompt: "正弦不落在 DFT 整数频点时，矩形窗会怎样？", expected: "leakage", choices: [["leakage", "产生泄漏"], ["single", "只留一个频点"], ["remove", "自动消除泄漏"]] },
    { key: "order", prompt: "阶次成分保持不变而转速提高时，频率会怎样？", expected: "scale", choices: [["scale", "按转速比例移动"], ["fixed", "保持固定"], ["random", "随机移动"]] }
  ];

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * scale; }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function bounded(value, label, low, high) { var number = finite(value, label); if (number < low || number > high) throw new RangeError(label + " must be in [" + low + ", " + high + "]"); return number; }
  function normalizeConfig(input) {
    var source = input || {};
    var windowName = source.window === undefined ? DEFAULTS.window : String(source.window);
    if (windowName !== "rect" && windowName !== "hann") throw new RangeError("window must be rect or hann");
    return { rpm: bounded(source.rpm === undefined ? DEFAULTS.rpm : source.rpm, "rpm", 600, 3600), sampleRate: bounded(source.sampleRate === undefined ? DEFAULTS.sampleRate : source.sampleRate, "sampleRate", 128, 1024), duration: bounded(source.duration === undefined ? DEFAULTS.duration : source.duration, "duration", 0.25, 2), window: windowName };
  }
  function aliasFrequency(frequency, sampleRate) {
    var folded = frequency % sampleRate;
    if (folded < 0) folded += sampleRate;
    return folded > sampleRate / 2 ? sampleRate - folded : folded;
  }
  function windowWeight(name, index, count) {
    if (name === "hann") return 0.5 * (1 - Math.cos(2 * Math.PI * index / Math.max(1, count - 1)));
    return 1;
  }
  function spectrumFor(samples, weights, sampleRate) {
    var count = samples.length;
    var spectrum = [];
    var maxBin = Math.floor(count / 2);
    var weightSum = weights.reduce(function (sum, value) { return sum + value; }, 0);
    for (var bin = 0; bin <= maxBin; bin += 1) {
      var real = 0;
      var imaginary = 0;
      for (var index = 0; index < count; index += 1) {
        var angle = 2 * Math.PI * bin * index / count;
        real += samples[index] * weights[index] * Math.cos(angle);
        imaginary -= samples[index] * weights[index] * Math.sin(angle);
      }
      var amplitude = Math.sqrt(real * real + imaginary * imaginary) / Math.max(1e-12, weightSum);
      if (bin > 0 && bin < maxBin) amplitude *= 2;
      spectrum.push({ bin: bin, frequency: bin * sampleRate / count, amplitude: amplitude });
    }
    return spectrum;
  }
  function componentSamples(config, component) {
    var count = Math.max(16, Math.min(2048, Math.round(config.sampleRate * config.duration)));
    var samples = [];
    var frequency = component.order * config.rpm / 60;
    for (var index = 0; index < count; index += 1) {
      var time = index / config.sampleRate;
      samples.push(component.amplitude * Math.sin(2 * Math.PI * frequency * time + component.phase));
    }
    return samples;
  }
  function model(input) {
    var config = normalizeConfig(input);
    var count = Math.max(16, Math.min(2048, Math.round(config.sampleRate * config.duration)));
    var samples = [];
    var weights = [];
    for (var index = 0; index < count; index += 1) {
      var time = index / config.sampleRate;
      var value = 0;
      COMPONENTS.forEach(function (component) { value += component.amplitude * Math.sin(2 * Math.PI * component.order * config.rpm / 60 * time + component.phase); });
      samples.push(value);
      weights.push(windowWeight(config.window, index, count));
    }
    var spectrum = spectrumFor(samples, weights, config.sampleRate);
    var nyquist = config.sampleRate / 2;
    var frequencyResolution = config.sampleRate / count;
    var componentRows = COMPONENTS.map(function (component) {
      var frequency = component.order * config.rpm / 60;
      var aliased = frequency >= nyquist;
      var observed = aliased ? aliasFrequency(frequency, config.sampleRate) : frequency;
      var bin = Math.max(0, Math.min(spectrum.length - 1, Math.round(observed / frequencyResolution)));
      return { order: component.order, targetFrequency: frequency, observedFrequency: observed, aliased: aliased, bin: bin, amplitude: spectrum[bin].amplitude };
    });
    var maxEntry = spectrum.reduce(function (current, entry) { return entry.amplitude > current.amplitude ? entry : current; }, spectrum[0]);
    var target = componentRows[0];
    var singleSamples = componentSamples(config, COMPONENTS[0]);
    var singleSpectrum = spectrumFor(singleSamples, weights, config.sampleRate);
    var targetBin = Math.max(0, Math.min(singleSpectrum.length - 1, Math.round(target.observedFrequency / frequencyResolution)));
    var bandEnergy = 0;
    var totalEnergy = 0;
    singleSpectrum.forEach(function (entry) { totalEnergy += entry.amplitude * entry.amplitude; if (Math.abs(entry.bin - targetBin) <= 1) bandEnergy += entry.amplitude * entry.amplitude; });
    var leakageProxy = Math.max(0, 1 - bandEnergy / Math.max(1e-12, totalEnergy));
    return {
      config: config,
      sampleCount: count,
      actualDuration: count / config.sampleRate,
      nyquist: nyquist,
      frequencyResolution: frequencyResolution,
      samples: samples,
      weights: weights,
      spectrum: spectrum,
      components: componentRows,
      dominant: { frequency: maxEntry.frequency, amplitude: maxEntry.amplitude, order: maxEntry.frequency / (config.rpm / 60) },
      aliasComponents: componentRows.filter(function (row) { return row.aliased; }),
      leakageProxy: leakageProxy,
      windowGain: weights.reduce(function (sum, value) { return sum + value; }, 0) / count,
      assumptions: "确定性两阶次 toy signal、均匀采样、理想前端；幅值为归一化信号单位，不是诊断概率"
    };
  }
  function formatNumber(value, digits) { if (!isFinite(value)) return "-"; var places = digits === undefined ? 3 : digits; if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 5)); return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, ""); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function element(doc, tag, attrs, children) { var node = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "text") node.textContent = String(value); else if (key === "className") node.setAttribute("class", value); else if (key === "htmlFor") node.setAttribute("for", value); else node.setAttribute(key, String(value)); }); (children || []).forEach(function (child) { if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function svgElement(doc, tag, attrs) { var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key])); }); return node; }
  function svgText(doc, parent, value, x, y, className) { var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mfo-label" }); node.textContent = value; parent.appendChild(node); }
  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--mfo-blue:#245a9b;--mfo-green:#2d7a4b;--mfo-orange:#ad6811;--mfo-red:#b23a32;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.15rem}[data-learning-lab="' + LAB_ID + '"] h4{margin-top:16px;font-size:1rem}' +
      '[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}[data-learning-lab="' + LAB_ID + '"] .mfo-note,[data-learning-lab="' + LAB_ID + '"] .mfo-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfo-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mfo-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mfo-primary{border-color:var(--mfo-blue);background:var(--mfo-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible,[data-learning-lab="' + LAB_ID + '"] select:focus-visible{outline:3px solid #1769aa;outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .mfo-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mfo-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .mfo-feedback{min-height:2em;margin:8px 0;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfo-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .mfo-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mfo-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mfo-control output{color:var(--mfo-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mfo-blue)}[data-learning-lab="' + LAB_ID + '"] select{width:100%;min-height:44px;padding:7px 8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfo-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(250px,.85fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mfo-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfo-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mfo-metric{min-width:0;padding:8px;border-top:3px solid var(--mfo-blue)}[data-learning-lab="' + LAB_ID + '"] .mfo-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mfo-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfo-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:540px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mfo-pass{color:var(--mfo-green);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mfo-warn{color:var(--mfo-red);font-weight:700}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mfo-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .mfo-choice-grid{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mfo-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mfo-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .mfo-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mfo-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mfo-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function drawSvg(doc, svg, result) {
    clear(svg); var width = 700; var height = 390; var left = 55; var right = 330; var top = 35; var bottom = 155; var spectrumLeft = 385; var spectrumRight = 660; var spectrumTop = 35; var spectrumBottom = 230;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "确定性振动时域样本与频谱，幅值为归一化信号单位，频率为 Hz");
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", opacity: 0.7 })); svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", opacity: 0.7 }));
    var timePoints = result.samples.slice(0, Math.min(100, result.samples.length)).map(function (value, index) { var x = left + index / Math.max(1, Math.min(99, result.samples.length - 1)) * (right - left); var y = bottom - (value + 1.6) / 3.2 * (bottom - top); return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2); });
    svg.appendChild(svgElement(doc, "path", { d: timePoints.join(" "), fill: "none", stroke: "var(--mfo-blue)", "stroke-width": 2 })); svgText(doc, svg, "时域 x(t)（归一化单位）", left, top - 10, "mfo-blue");
    svg.appendChild(svgElement(doc, "line", { x1: spectrumLeft, y1: spectrumBottom, x2: spectrumRight, y2: spectrumBottom, stroke: "currentColor", opacity: 0.7 })); svg.appendChild(svgElement(doc, "line", { x1: spectrumLeft, y1: spectrumTop, x2: spectrumLeft, y2: spectrumBottom, stroke: "currentColor", opacity: 0.7 }));
    var maxFreq = result.nyquist; var maxAmp = Math.max(1, result.dominant.amplitude * 1.15); var path = result.spectrum.map(function (entry, index) { var x = spectrumLeft + entry.frequency / maxFreq * (spectrumRight - spectrumLeft); var y = spectrumBottom - entry.amplitude / maxAmp * (spectrumBottom - spectrumTop); return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2); }); svg.appendChild(svgElement(doc, "path", { d: path.join(" "), fill: "none", stroke: "var(--mfo-green)", "stroke-width": 2 }));
    result.components.forEach(function (component) { var x = spectrumLeft + component.observedFrequency / maxFreq * (spectrumRight - spectrumLeft); svg.appendChild(svgElement(doc, "line", { x1: x, y1: spectrumTop, x2: x, y2: spectrumBottom, stroke: component.aliased ? "var(--mfo-red)" : "var(--mfo-orange)", "stroke-dasharray": "5 4" })); svgText(doc, svg, component.order + "×", x + 3, spectrumTop + 15, component.aliased ? "mfo-red" : "mfo-orange"); });
    svgText(doc, svg, "频率 (Hz)", spectrumRight - 55, spectrumBottom + 22, "mfo-label"); svgText(doc, svg, "Nyquist " + formatNumber(result.nyquist, 1) + " Hz", spectrumLeft + 5, spectrumBottom + 38, "mfo-label"); svgText(doc, svg, "泄漏 proxy " + formatNumber(result.leakageProxy * 100, 2) + "%", 55, 205, "mfo-orange"); svgText(doc, svg, result.aliasComponents.length ? "WARN: alias boundary" : "当前频带未越 Nyquist", 55, 230, result.aliasComponents.length ? "mfo-red" : "mfo-green");
  }
  function renderTable(doc, hostNode, headings, rows) { clear(hostNode); var table = element(doc, "table", {}); var header = element(doc, "tr", {}); headings.forEach(function (heading) { header.appendChild(element(doc, "th", { scope: "col", text: heading })); }); table.appendChild(element(doc, "thead", {}, [header])); var body = element(doc, "tbody", {}); rows.forEach(function (row) { var tr = element(doc, "tr", {}); row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); }); body.appendChild(tr); }); table.appendChild(body); hostNode.appendChild(table); }
  function metric(doc, label, value) { return element(doc, "div", { className: "mfo-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || (host && host.document); if (!doc) throw new Error("a document is required to mount the lab"); installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { rpm: DEFAULTS.rpm, sampleRate: DEFAULTS.sampleRate, duration: DEFAULTS.duration, window: DEFAULTS.window }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" };
    var shell = element(doc, "div", { className: "mfo-shell" }); shell.appendChild(element(doc, "h3", { text: "状态监测实验：采样、泄漏与阶次" })); shell.appendChild(element(doc, "p", { className: "mfo-note", text: "先完成三项预测；频率用 Hz，转速用 r/min，幅值为归一化信号单位。这个确定性 toy signal 不是故障诊断器。" }));
    var predictionHost = element(doc, "div", { className: "mfo-predictions" }); PREDICTIONS.forEach(function (spec, index) { var fieldset = element(doc, "fieldset", {}); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + spec.prompt })); var grid = element(doc, "div", { className: "mfo-choice-grid" }); spec.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] }); button.addEventListener("click", function () { state.predictions[spec.key] = choice[0]; grid.querySelectorAll("button").forEach(function (item) { item.setAttribute("aria-pressed", item === button ? "true" : "false"); }); }); grid.appendChild(button); }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); }); shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "mfo-actions" }); var reveal = element(doc, "button", { type: "button", className: "mfo-primary", text: "提交预测并揭示" }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "mfo-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var bench = element(doc, "div", { className: "mfo-bench" }); bench.hidden = true; var controls = element(doc, "div", { className: "mfo-controls" }); var controlRefs = {};
    [{ key: "rpm", label: "转速", min: 600, max: 3600, step: 60, unit: " r/min" }, { key: "sampleRate", label: "采样率", min: 128, max: 1024, step: 16, unit: " Hz" }, { key: "duration", label: "记录时长", min: 0.25, max: 2, step: 0.05, unit: " s" }].forEach(function (definition) { var inputId = uid + "-" + definition.key; var output = element(doc, "output", { for: inputId, text: "" }); var label = element(doc, "label", { htmlFor: inputId }, [definition.label + " ", output]); var input = element(doc, "input", { id: inputId, type: "range", min: definition.min, max: definition.max, step: definition.step, value: state.config[definition.key] }); input.addEventListener("input", function () { state.config[definition.key] = Number(input.value); render(); }); controls.appendChild(element(doc, "div", { className: "mfo-control" }, [label, input])); controlRefs[definition.key] = { input: input, output: output, unit: definition.unit }; });
    var windowSelect = element(doc, "select", { id: uid + "-window", "aria-label": "窗口" }); windowSelect.appendChild(element(doc, "option", { value: "rect", text: "矩形窗" })); windowSelect.appendChild(element(doc, "option", { value: "hann", text: "Hann 窗" })); windowSelect.value = state.config.window; windowSelect.addEventListener("change", function () { state.config.window = windowSelect.value; render(); }); controls.appendChild(element(doc, "div", { className: "mfo-control" }, [element(doc, "label", { htmlFor: uid + "-window", text: "窗口" }), windowSelect])); controlRefs.window = windowSelect; bench.appendChild(controls);
    var metrics = element(doc, "div", { className: "mfo-metrics" }); bench.appendChild(metrics); var layout = element(doc, "div", { className: "mfo-layout" }); var stage = element(doc, "div", { className: "mfo-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var right = element(doc, "div", {}); right.appendChild(element(doc, "h4", { text: "阶次与采样表" })); var componentTable = element(doc, "div", { className: "mfo-table-wrap" }); right.appendChild(componentTable); right.appendChild(element(doc, "h4", { text: "证据 ledger" })); var ledgerTable = element(doc, "div", { className: "mfo-table-wrap" }); right.appendChild(ledgerTable); layout.appendChild(right); bench.appendChild(layout); shell.appendChild(bench); clear(rootNode); rootNode.appendChild(shell);
    function render() { var result = model(state.config); controlRefs.rpm.input.value = result.config.rpm; controlRefs.sampleRate.input.value = result.config.sampleRate; controlRefs.duration.input.value = result.config.duration; windowSelect.value = result.config.window; controlRefs.rpm.output.textContent = formatNumber(result.config.rpm, 0) + " r/min"; controlRefs.sampleRate.output.textContent = formatNumber(result.config.sampleRate, 0) + " Hz"; controlRefs.duration.output.textContent = formatNumber(result.config.duration, 2) + " s"; feedback.textContent = state.feedback; bench.hidden = !state.revealed; if (!state.revealed) return; metrics.replaceChildren(metric(doc, "样本数", result.sampleCount + " samples"), metric(doc, "Nyquist", formatNumber(result.nyquist, 1) + " Hz"), metric(doc, "频率栅格", formatNumber(result.frequencyResolution, 3) + " Hz"), metric(doc, "主峰阶次", formatNumber(result.dominant.order, 2) + "×")); drawSvg(doc, svg, result); renderTable(doc, componentTable, ["成分", "真实频率", "观测频率", "幅值", "状态"], result.components.map(function (row) { return [row.order + "×", formatNumber(row.targetFrequency, 2) + " Hz", formatNumber(row.observedFrequency, 2) + " Hz", formatNumber(row.amplitude, 3) + " norm", row.aliased ? "ALIAS" : "可见"]; })); renderTable(doc, ledgerTable, ["证据", "读数", "边界"], [["Nyquist", formatNumber(result.nyquist, 2), "Hz; f≥Nyquist 标红"], ["混叠成分", result.aliasComponents.length ? result.aliasComponents.map(function (row) { return row.order + "×"; }).join(", ") : "无", "当前 toy signal"], ["泄漏 proxy", formatNumber(result.leakageProxy * 100, 3) + "%", result.config.window + " 窗; 能量外溢"], ["窗口增益", formatNumber(result.windowGain, 4), "幅值校正因子相关"], ["诊断边界", "不作故障保证", "需基线/工况/验证"]]); }
    reveal.addEventListener("click", function () { if (!PREDICTIONS.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测；结果仍然隐藏。"; render(); return; } var correct = PREDICTIONS.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length; state.revealed = true; state.feedback = "已揭示：" + correct + "/3 命中。现在改变采样、窗口、时长和转速，观察边界。"; render(); if (api && typeof api.announce === "function") api.announce(rootNode, "状态监测实验已揭示，时域、频谱和阶次证据已显示。"); });
    reset.addEventListener("click", function () { state = { config: { rpm: DEFAULTS.rpm, sampleRate: DEFAULTS.sampleRate, duration: DEFAULTS.duration, window: DEFAULTS.window }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" }; predictionHost.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); render(); if (api && typeof api.announce === "function") api.announce(rootNode, "状态监测实验已重置，预测结果再次隐藏。"); }); render(); if (api && typeof api.announce === "function") api.announce(rootNode, "状态监测实验已加载；先完成三项预测。");
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var result = model(DEFAULTS); check(result.sampleCount === 512, "default sample count"); check(near(result.nyquist, 256), "Nyquist frequency"); check(result.aliasComponents.length === 0, "default no alias"); check(near(result.components[0].targetFrequency, 30), "one times frequency"); check(near(result.components[1].targetFrequency, 72), "2.4 times frequency"); check(result.leakageProxy < 1e-8, "integer-bin rectangular leakage boundary"); check(Math.abs(result.dominant.frequency - 30) < 1.1, "dominant peak near one times"); check(model({ rpm: 2400 }).components[0].targetFrequency > result.components[0].targetFrequency, "order frequency follows rpm"); check(model({ sampleRate: 144 }).aliasComponents.length > 0, "Nyquist equality is flagged boundary"); check(model({ window: "hann" }).windowGain < result.windowGain, "Hann coherent gain"); var invalidWindow = false; try { model({ window: "blackman" }); } catch (error) { invalidWindow = true; } check(invalidWindow, "window boundary"); var invalidRate = false; try { model({ sampleRate: 100 }); } catch (error) { invalidRate = true; } check(invalidRate, "sampling rate boundary"); return { checks: checks }; }
  return { LAB_ID: LAB_ID, DEFAULTS: DEFAULTS, normalizeConfig: normalizeConfig, aliasFrequency: aliasFrequency, model: model, mount: mount, selfTest: selfTest };
});
