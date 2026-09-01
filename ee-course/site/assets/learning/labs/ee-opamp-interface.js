(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-opamp-interface", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-opamp-interface self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-opamp-interface self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "ee-opamp-interface";
  var STYLE_ID = "ee-opamp-interface-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = {
    railLow: 0,
    railHigh: 3.3,
    gain: 11,
    inputVoltage: 0.18,
    inputPeak: 0.02,
    frequency: 1000,
    gbw: 1e6,
    slewRate: 0.5e6,
    commonModeLowMargin: 0.1,
    commonModeHighMargin: 0.15,
    outputLowMargin: 0.05,
    outputHighMargin: 0.2,
    inputOffset: 0.002,
    inputBias: 20e-9,
    inputResistance: 10000,
    noiseDensity: 20e-9,
    noiseBandwidth: 5000
  };
  var QUESTIONS = [
    { key: "feedback", prompt: "负反馈闭环且未饱和时，反相/同相输入端的电压关系最合理的说法是？", expected: "approx", choices: [["equal", "永远严格相等"], ["approx", "在条件满足时近似相等"], ["random", "完全无关"]] },
    { key: "bandwidth", prompt: "闭环增益提高而 GBW 不变，闭环带宽通常怎样变化？", expected: "lower", choices: [["higher", "提高"], ["lower", "降低"], ["same", "不变"]] },
    { key: "saturation", prompt: "若输出理想值超过可用摆幅，虚短假设还能直接使用吗？", expected: "no", choices: [["yes", "可以直接使用"], ["no", "不可以，先处理饱和"], ["only", "只要输入很小就可以"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function formatControl(key, value) {
    if (key === "gain") return format(value, 1) + " V/V";
    if (key === "inputVoltage" || key === "inputPeak") return format(value * 1000, 1) + " mV";
    if (key === "frequency") return format(value / 1000, 1) + " kHz";
    if (key === "gbw") return format(value / 1e6, 2) + " MHz";
    if (key === "slewRate") return format(value / 1e6, 2) + " V/µs";
    return format(value, 2);
  }
  function normalize(input) {
    var source = input || {};
    return {
      railLow: clamp(finite(source.railLow === undefined ? DEFAULTS.railLow : source.railLow, "low rail"), -5, 5),
      railHigh: clamp(finite(source.railHigh === undefined ? DEFAULTS.railHigh : source.railHigh, "high rail"), 0.5, 12),
      gain: clamp(finite(source.gain === undefined ? DEFAULTS.gain : source.gain, "closed-loop gain"), 1, 50),
      inputVoltage: clamp(finite(source.inputVoltage === undefined ? DEFAULTS.inputVoltage : source.inputVoltage, "input voltage"), -1, 5),
      inputPeak: clamp(finite(source.inputPeak === undefined ? DEFAULTS.inputPeak : source.inputPeak, "input peak"), 0, 0.5),
      frequency: clamp(finite(source.frequency === undefined ? DEFAULTS.frequency : source.frequency, "signal frequency"), 1, 1e6),
      gbw: clamp(finite(source.gbw === undefined ? DEFAULTS.gbw : source.gbw, "GBW"), 1e3, 100e6),
      slewRate: clamp(finite(source.slewRate === undefined ? DEFAULTS.slewRate : source.slewRate, "slew rate"), 1e3, 20e6),
      commonModeLowMargin: clamp(finite(source.commonModeLowMargin === undefined ? DEFAULTS.commonModeLowMargin : source.commonModeLowMargin, "common mode low margin"), 0, 2),
      commonModeHighMargin: clamp(finite(source.commonModeHighMargin === undefined ? DEFAULTS.commonModeHighMargin : source.commonModeHighMargin, "common mode high margin"), 0, 2),
      outputLowMargin: clamp(finite(source.outputLowMargin === undefined ? DEFAULTS.outputLowMargin : source.outputLowMargin, "output low margin"), 0, 2),
      outputHighMargin: clamp(finite(source.outputHighMargin === undefined ? DEFAULTS.outputHighMargin : source.outputHighMargin, "output high margin"), 0, 2),
      inputOffset: clamp(finite(source.inputOffset === undefined ? DEFAULTS.inputOffset : source.inputOffset, "input offset"), -0.05, 0.05),
      inputBias: clamp(finite(source.inputBias === undefined ? DEFAULTS.inputBias : source.inputBias, "input bias"), 0, 1e-5),
      inputResistance: clamp(finite(source.inputResistance === undefined ? DEFAULTS.inputResistance : source.inputResistance, "input resistance"), 100, 1e6),
      noiseDensity: clamp(finite(source.noiseDensity === undefined ? DEFAULTS.noiseDensity : source.noiseDensity, "noise density"), 0, 1e-5),
      noiseBandwidth: clamp(finite(source.noiseBandwidth === undefined ? DEFAULTS.noiseBandwidth : source.noiseBandwidth, "noise bandwidth"), 1, 1e7)
    };
  }
  function computeOpamp(input) {
    var state = normalize(input);
    var outputMin = state.railLow + state.outputLowMargin;
    var outputMax = state.railHigh - state.outputHighMargin;
    var commonMin = state.railLow + state.commonModeLowMargin;
    var commonMax = state.railHigh - state.commonModeHighMargin;
    var inputLow = state.inputVoltage - state.inputPeak;
    var inputHigh = state.inputVoltage + state.inputPeak;
    var biasOutputError = Math.abs(state.gain) * state.inputBias * state.inputResistance;
    var outputCenter = state.gain * (state.inputVoltage + state.inputOffset) + biasOutputError;
    var outputPeak = Math.abs(state.gain) * state.inputPeak;
    var requestedLow = outputCenter - outputPeak;
    var requestedHigh = outputCenter + outputPeak;
    var outputVoltage = clamp(outputCenter, outputMin, outputMax);
    var closedLoopBandwidth = state.gbw / Math.abs(state.gain);
    var openLoopGainProxy = state.gbw / Math.max(state.frequency, 1);
    var virtualShortError = Math.abs(outputVoltage) / Math.max(openLoopGainProxy, 1);
    var slewRequired = 2 * Math.PI * state.frequency * outputPeak;
    var bandwidthRatio = state.frequency / Math.max(closedLoopBandwidth, 1e-12);
    var bandwidthAmplitudeRatio = 1 / Math.sqrt(1 + bandwidthRatio * bandwidthRatio);
    var bandwidthOutputPeak = outputPeak * bandwidthAmplitudeRatio;
    var bandwidthDistortionPct = (1 - bandwidthAmplitudeRatio) * 100;
    var noiseInputRms = state.noiseDensity * Math.sqrt(state.noiseBandwidth);
    var noiseOutputRms = noiseInputRms * Math.abs(state.gain);
    var commonModeOk = inputLow >= commonMin && inputHigh <= commonMax;
    var saturated = requestedLow < outputMin || requestedHigh > outputMax;
    var slewOk = slewRequired <= state.slewRate;
    var bandwidthOk = state.frequency <= closedLoopBandwidth / 10;
    var virtualShortValid = !saturated && commonModeOk && slewOk && bandwidthOk;
    return {
      config: state,
      outputMin: outputMin,
      outputMax: outputMax,
      commonMin: commonMin,
      commonMax: commonMax,
      inputLow: inputLow,
      inputHigh: inputHigh,
      biasOutputError: biasOutputError,
      outputCenter: outputCenter,
      outputPeak: outputPeak,
      requestedLow: requestedLow,
      requestedHigh: requestedHigh,
      outputVoltage: outputVoltage,
      closedLoopBandwidth: closedLoopBandwidth,
      openLoopGainProxy: openLoopGainProxy,
      virtualShortError: virtualShortError,
      slewRequired: slewRequired,
      slewMargin: state.slewRate - slewRequired,
      bandwidthRatio: bandwidthRatio,
      bandwidthAmplitudeRatio: bandwidthAmplitudeRatio,
      bandwidthOutputPeak: bandwidthOutputPeak,
      bandwidthDistortionPct: bandwidthDistortionPct,
      noiseInputRms: noiseInputRms,
      noiseOutputRms: noiseOutputRms,
      commonModeOk: commonModeOk,
      saturated: saturated,
      slewOk: slewOk,
      bandwidthOk: bandwidthOk,
      virtualShortValid: virtualShortValid
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (key === "text") node.textContent = String(value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; node.setAttribute(key, String(value)); });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node;
  }
  function svgText(doc, parent, value, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, value)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--eoi-blue:#2d679e;--eoi-red:#b7473b;--eoi-green:#39734d;--eoi-gold:#9a6a10;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .eoi-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--eoi-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .eoi-primary{border-color:var(--eoi-blue);background:var(--eoi-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .eoi-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .eoi-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .eoi-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eoi-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .eoi-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .eoi-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--eoi-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--eoi-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eoi-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .eoi-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .eoi-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .eoi-metric{min-width:0;padding:9px;border-top:2px solid var(--eoi-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .eoi-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eoi-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .eoi-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eoi-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .eoi-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .eoi-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eoi-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .eoi-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eoi-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .eoi-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-eoi-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 780 380"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "运放负反馈、输出饱和和闭环带宽示意");
    node.appendChild(svgElement(doc, "title", {}, "运放的虚短条件、摆幅和带宽")); node.appendChild(svgElement(doc, "desc", {}, "左侧是带负反馈的运放端口模型，右侧是理想正弦输出与可用摆幅的比较，底部显示 GBW 限制的闭环带宽。"));
    var blue = "var(--eoi-blue)", red = "var(--eoi-red)", green = "var(--eoi-green)", gold = "var(--eoi-gold)";
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 25, width: 330, height: 202, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "非反相增益与负反馈分压", 30, 47, { "font-size": 13, "font-weight": 700 });
    node.appendChild(svgElement(doc, "polygon", { points: "80,72 80,143 181,107", fill: "var(--bg,white)", stroke: blue, "stroke-width": 2 })); svgText(doc, node, "+", 91, 101, { "font-size": 16, "font-weight": 700, fill: green }); svgText(doc, node, "−", 91, 130, { "font-size": 16, "font-weight": 700, fill: red });
    node.appendChild(svgElement(doc, "line", { x1: 35, y1: 101, x2: 80, y2: 101, stroke: green, "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 35, y1: 130, x2: 80, y2: 130, stroke: red, "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 181, y1: 107, x2: 243, y2: 107, stroke: blue, "stroke-width": 3 })); svgText(doc, node, "Vout", 246, 101, { "font-size": 11, fill: blue });
    node.appendChild(svgElement(doc, "line", { x1: 243, y1: 107, x2: 300, y2: 107, stroke: gold, "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 300, y1: 107, x2: 300, y2: 117, stroke: gold, "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "rect", { x: 286, y: 117, width: 28, height: 30, rx: 3, fill: "var(--bg,white)", stroke: gold, "stroke-width": 2 })); svgText(doc, node, "Rf", 300, 136, { "font-size": 11, "text-anchor": "middle", fill: gold });
    node.appendChild(svgElement(doc, "line", { x1: 300, y1: 147, x2: 300, y2: 157, stroke: gold, "stroke-width": 2 })); node.appendChild(svgElement(doc, "circle", { cx: 300, cy: 157, r: 3, fill: gold })); node.appendChild(svgElement(doc, "line", { x1: 300, y1: 157, x2: 80, y2: 130, stroke: gold, "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "rect", { x: 286, y: 157, width: 28, height: 30, rx: 3, fill: "var(--bg,white)", stroke: gold, "stroke-width": 2 })); svgText(doc, node, "Rg", 300, 176, { "font-size": 11, "text-anchor": "middle", fill: gold }); node.appendChild(svgElement(doc, "line", { x1: 300, y1: 187, x2: 300, y2: 202, stroke: gold, "stroke-width": 2 })); svgText(doc, node, "Vref", 300, 218, { "font-size": 10, "text-anchor": "middle", fill: gold });
    svgText(doc, node, "A≈1+Rf/Rg；分压节点回到 − 输入", 30, 210, { "font-size": 10, fill: gold });
    svgText(doc, node, "虚短：仅在闭环、线性、频率、共模和压摆率条件满足时近似", 30, 226, { "font-size": 9.5, fill: "var(--fg-soft,currentColor)" });
    node.appendChild(svgElement(doc, "rect", { x: 364, y: 25, width: 400, height: 228, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "输出波形与可用摆幅", 380, 47, { "font-size": 13, "font-weight": 700 });
    var top = 67, bottom = 220, left = 386, right = 745, mid = (top + bottom) / 2, scale = Math.max(result.config.railHigh - result.config.railLow, 0.5);
    node.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: right, y2: top, stroke: red, "stroke-dasharray": "5 4", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: red, "stroke-dasharray": "5 4", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: mid, x2: right, y2: mid, stroke: "currentColor", "stroke-opacity": ".35" }));
    var ideal = [], bandwidthLimited = [], clipped = [];
    for (var i = 0; i <= 72; i += 1) {
      var phase = i / 72 * 2 * Math.PI; var raw = result.outputCenter + result.outputPeak * Math.sin(phase); var limitedRaw = result.outputCenter + result.bandwidthOutputPeak * Math.sin(phase); var clip = clamp(limitedRaw, result.outputMin, result.outputMax); var x = left + (right - left) * i / 72;
      var yRaw = bottom - (bottom - top) * (raw - result.config.railLow) / scale; var yLimited = bottom - (bottom - top) * (limitedRaw - result.config.railLow) / scale; var yClip = bottom - (bottom - top) * (clip - result.config.railLow) / scale;
      ideal.push((i ? "L" : "M") + x.toFixed(2) + " " + yRaw.toFixed(2)); bandwidthLimited.push((i ? "L" : "M") + x.toFixed(2) + " " + yLimited.toFixed(2)); clipped.push((i ? "L" : "M") + x.toFixed(2) + " " + yClip.toFixed(2));
    }
    node.appendChild(svgElement(doc, "path", { d: ideal.join(" "), fill: "none", stroke: gold, "stroke-width": 2, "stroke-dasharray": "5 4" })); node.appendChild(svgElement(doc, "path", { d: bandwidthLimited.join(" "), fill: "none", stroke: blue, "stroke-width": 2, "stroke-dasharray": "2 3" })); node.appendChild(svgElement(doc, "path", { d: clipped.join(" "), fill: "none", stroke: result.saturated ? red : green, "stroke-width": 3 }));
    svgText(doc, node, "上限 " + format(result.outputMax, 2) + " V", right - 3, top - 7, { "font-size": 10, "text-anchor": "end", fill: red }); svgText(doc, node, "下限 " + format(result.outputMin, 2) + " V", right - 3, bottom + 15, { "font-size": 10, "text-anchor": "end", fill: red }); svgText(doc, node, "金：理想；蓝：带宽幅值代理；" + (result.saturated ? "红：削顶" : "绿：可用输出"), left + 4, 242, { "font-size": 10, fill: result.saturated ? red : green }); svgText(doc, node, "SRreq=" + format(result.slewRequired / 1e6, 4) + " V/µs，SR=" + format(result.config.slewRate / 1e6, 2) + " V/µs；" + (result.slewOk ? "斜率通过" : "斜率不足"), left + 4, 257, { "font-size": 9.5, fill: result.slewOk ? green : red });
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 272, width: 748, height: 86, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "GBW → 闭环带宽与幅值失真", 30, 294, { "font-size": 13, "font-weight": 700 });
    var barLeft = 38, barRight = 735, y = 323, maxF = Math.max(result.config.gbw, result.config.frequency, result.closedLoopBandwidth, 1); node.appendChild(svgElement(doc, "line", { x1: barLeft, y1: y, x2: barRight, y2: y, stroke: "currentColor", "stroke-opacity": ".45", "stroke-width": 8 }));
    var bwX = barLeft + (barRight - barLeft) * Math.min(1, result.closedLoopBandwidth / maxF); var fX = barLeft + (barRight - barLeft) * Math.min(1, result.config.frequency / maxF); node.appendChild(svgElement(doc, "line", { x1: barLeft, y1: y, x2: bwX, y2: y, stroke: blue, "stroke-width": 8 })); node.appendChild(svgElement(doc, "line", { x1: fX, y1: y - 14, x2: fX, y2: y + 14, stroke: red, "stroke-width": 3 }));
    svgText(doc, node, "0", barLeft, 348, { "font-size": 10 }); svgText(doc, node, "fCL=" + format(result.closedLoopBandwidth / 1000, 1) + " kHz", bwX, 348, { "font-size": 10, "text-anchor": "middle", fill: blue }); svgText(doc, node, "f信号", fX, 306, { "font-size": 10, "text-anchor": "middle", fill: red }); svgText(doc, node, "GBW=" + format(result.config.gbw / 1e6, 2) + " MHz；带宽幅比=" + format(result.bandwidthAmplitudeRatio * 100, 3) + "%", barRight, 348, { "font-size": 10, "text-anchor": "end" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "eoi-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode); var rows = [
      ["理想闭环输出中心", format(result.outputCenter, 4), "V；含偏置与输入偏置电流代理"],
      ["可用输出范围", format(result.outputMin, 3) + " … " + format(result.outputMax, 3), "V；教学摆幅边界"],
      ["共模输入范围", format(result.commonMin, 3) + " … " + format(result.commonMax, 3), "V；教学共模边界"],
      ["闭环带宽", format(result.closedLoopBandwidth / 1000, 2), "kHz；GBW / 增益"],
      ["带宽幅值比", format(result.bandwidthAmplitudeRatio * 100, 4), "%；单极点失真代理"],
      ["所需压摆率", format(result.slewRequired / 1e6, 4), "V/µs；2πfVpk"],
      ["压摆率余量", format(result.slewMargin / 1e6, 4), "V/µs；SR − SRreq"],
      ["输出噪声 RMS", format(result.noiseOutputRms * 1e6, 2), "µV；密度 × √带宽 × 增益"],
      ["虚短适用性", result.virtualShortValid ? "条件满足" : "至少一项条件不满足", "负反馈、线性、共模、带宽和压摆率均需满足"]
    ]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "运放接口账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "读数" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE); var state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "eoi-shell" }); shell.appendChild(element(doc, "h3", { text: "运放实验：闭环、摆幅与带宽" })); shell.appendChild(element(doc, "p", { className: "eoi-note", text: "先判断虚短的条件、增益带宽和饱和边界；揭示后调节输入、增益、频率、GBW 和压摆率。数值是教学模型，不是具体运放数据手册。" }));
    var predictionHost = element(doc, "div"), groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "eoi-choice-grid" }), buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "eoi-actions" }); var reveal = element(doc, "button", { type: "button", className: "eoi-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "eoi-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }), controls = element(doc, "div", { className: "eoi-controls" }); var specs = [["gain", "闭环增益", 1, 30, 1], ["inputVoltage", "输入电压", -0.2, 0.5, 0.01], ["inputPeak", "输入峰值", 0, 0.1, 0.005], ["frequency", "信号频率", 100, 100000, 100], ["gbw", "GBW", 0.1e6, 5e6, 0.1e6], ["slewRate", "压摆率", 0.05e6, 3e6, 0.05e6]]; var inputs = {}, outputs = {};
    specs.forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "eoi-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output; }); results.appendChild(controls);
    var layout = element(doc, "div", { className: "eoi-layout" }), stage = element(doc, "div", { className: "eoi-stage" }), svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"), metrics = element(doc, "div", { className: "eoi-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "eoi-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "eoi-note", text: "数据手册还必须检查输入共模范围、输出摆幅、GBW 测试条件、压摆率、偏置、噪声、负载和稳定性；仿真曲线不能替代这些条件。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeOpamp(state.config); results.hidden = !state.revealed; specs.forEach(function (spec) { outputs[spec[0]].textContent = formatControl(spec[0], result.config[spec[0]]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "输出中心", format(result.outputCenter, 3) + " V")); metrics.appendChild(metric(doc, "闭环带宽", format(result.closedLoopBandwidth / 1000, 1) + " kHz")); metrics.appendChild(metric(doc, "压摆率检查", result.slewOk ? "通过" : "不足")); metrics.appendChild(metric(doc, "虚短", result.virtualShortValid ? "适用条件内" : "已越界")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在调参，找出虚短、共模、摆幅和速度的边界。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; specs.forEach(function (spec) { inputs[spec[0]].value = state.config[spec[0]]; }); render(); announce(api, rootNode, "运放实验已重置。"); }); rootNode.appendChild(shell); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-eoi-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeOpamp(DEFAULTS); check(near(result.outputCenter, 2.0042, 1e-6), "default output center"); check(near(result.closedLoopBandwidth, 1e6 / 11), "GBW divided by gain"); check(result.commonModeOk, "default common mode"); check(result.slewOk, "default slew rate"); check(result.virtualShortValid, "default virtual-short conditions");
    check(result.bandwidthAmplitudeRatio < 1 && result.bandwidthAmplitudeRatio > 0.99, "default bandwidth distortion evidence");
    var saturated = computeOpamp({ inputVoltage: 0.35, inputPeak: 0.1, gain: 20 }); check(saturated.saturated && !saturated.virtualShortValid, "saturation invalidates virtual short");
    var slewLimited = computeOpamp({ inputPeak: 0.02, frequency: 100000, slewRate: 1000 }); check(!slewLimited.slewOk && !slewLimited.virtualShortValid && !slewLimited.saturated && slewLimited.commonModeOk, "slew limit invalidates virtual short");
    var bandwidthLimited = computeOpamp({ frequency: 1000000, gain: 11 }); check(!bandwidthLimited.bandwidthOk && bandwidthLimited.bandwidthAmplitudeRatio < 0.2, "bandwidth distortion invalidates virtual short");
    check(computeOpamp({ gain: 20 }).closedLoopBandwidth < result.closedLoopBandwidth, "higher gain lowers bandwidth"); check(near(result.noiseInputRms, DEFAULTS.noiseDensity * Math.sqrt(DEFAULTS.noiseBandwidth)), "noise units"); check(JSON.stringify(result) === JSON.stringify(computeOpamp(DEFAULTS)), "deterministic result"); return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, normalize: normalize, computeOpamp: computeOpamp, compute: computeOpamp, mount: mount, selfTest: selfTest };
});
