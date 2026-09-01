(function (root, factory) {
  "use strict";
  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-rlc-resonance", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-rlc-resonance self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-rlc-resonance self-test: FAIL", error && error.stack ? error.stack : error);
      process.exitCode = 1;
    }
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var LAB_ID = "ee-rlc-resonance";
  var STYLE_ID = "ee-rlc-resonance-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { resistance: 10, inductanceMh: 10, capacitanceUf: 10, parasiticOhm: 2, sourceVrms: 1 };
  var QUESTIONS = [
    { key: "damping", prompt: "把串联电阻加倍，振铃衰减会怎样？", expected: "faster", choices: [["faster", "更快消失"], ["slower", "更慢消失"], ["same", "不变"]] },
    { key: "peak", prompt: "在固有频率附近，串联电流幅值通常是？", expected: "peak", choices: [["peak", "出现峰值"], ["valley", "出现谷值"], ["flat", "完全不变"]] },
    { key: "q", prompt: "默认参数下，Q 更接近哪个数量级？", expected: "three", choices: [["point-three", "0.3"], ["three", "3"], ["thirty", "30"]] }
  ];

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) {
    var number = Number(value);
    if (!isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
  }
  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function normalize(input) {
    var source = input || {};
    return {
      resistance: clamp(finite(source.resistance === undefined ? DEFAULTS.resistance : source.resistance, "resistance"), 0.1, 1000),
      inductanceMh: clamp(finite(source.inductanceMh === undefined ? DEFAULTS.inductanceMh : source.inductanceMh, "inductance"), 0.1, 100),
      capacitanceUf: clamp(finite(source.capacitanceUf === undefined ? DEFAULTS.capacitanceUf : source.capacitanceUf, "capacitance"), 0.1, 100),
      parasiticOhm: clamp(finite(source.parasiticOhm === undefined ? DEFAULTS.parasiticOhm : source.parasiticOhm, "parasitic resistance"), 0, 100),
      sourceVrms: clamp(finite(source.sourceVrms === undefined ? DEFAULTS.sourceVrms : source.sourceVrms, "source voltage"), 0.01, 10)
    };
  }
  function naturalValue(result, time) {
    if (result.regime === "欠阻尼") {
      return Math.exp(-result.alpha * time) * (Math.cos(result.omegaD * time) + (result.alpha / result.omegaD) * Math.sin(result.omegaD * time));
    }
    if (result.regime === "临界阻尼") return (1 + result.alpha * time) * Math.exp(-result.alpha * time);
    return result.coef1 * Math.exp(result.root1 * time) + result.coef2 * Math.exp(result.root2 * time);
  }
  function naturalSlope(result, time) {
    if (result.regime === "欠阻尼") {
      return -Math.exp(-result.alpha * time) * ((result.alpha * result.alpha / result.omegaD) + result.omegaD) * Math.sin(result.omegaD * time);
    }
    if (result.regime === "临界阻尼") return -result.alpha * result.alpha * time * Math.exp(-result.alpha * time);
    return result.coef1 * result.root1 * Math.exp(result.root1 * time) + result.coef2 * result.root2 * Math.exp(result.root2 * time);
  }
  function computeRlc(input) {
    var config = normalize(input);
    var L = config.inductanceMh / 1000;
    var C = config.capacitanceUf / 1000000;
    var totalR = config.resistance + config.parasiticOhm;
    var omega0 = 1 / Math.sqrt(L * C);
    var f0 = omega0 / (2 * Math.PI);
    var alpha = totalR / (2 * L);
    var zeta = alpha / omega0;
    var q = omega0 * L / totalR;
    var discriminant = alpha * alpha - omega0 * omega0;
    var regime = zeta < 1 - 1e-10 ? "欠阻尼" : (zeta > 1 + 1e-10 ? "过阻尼" : "临界阻尼");
    var omegaD = Math.sqrt(Math.max(0, omega0 * omega0 - alpha * alpha));
    var fD = omegaD / (2 * Math.PI);
    var root1 = -alpha + Math.sqrt(Math.max(0, discriminant));
    var root2 = -alpha - Math.sqrt(Math.max(0, discriminant));
    var coef1 = 0;
    var coef2 = 0;
    if (regime === "过阻尼") {
      coef1 = -root2 / (root1 - root2);
      coef2 = root1 / (root1 - root2);
    }
    var duration = Math.min(0.08, Math.max(0.001, 6 / f0, Math.min(4 / alpha, 12 / f0)));
    var waveformPeriod = omegaD > 0 ? 2 * Math.PI / omegaD : Infinity;
    var waveformPointsPerPeriod = omegaD > 0 ? 24 : 0;
    var waveformCount = omegaD > 0 ? Math.max(96, Math.ceil(duration / waveformPeriod * waveformPointsPerPeriod)) : 96;
    var waveform = [];
    for (var i = 0; i <= waveformCount; i += 1) {
      var time = duration * i / waveformCount;
      waveform.push({ t: time, x: naturalValue({ regime: regime, alpha: alpha, omegaD: omegaD, root1: root1, root2: root2, coef1: coef1, coef2: coef2 }, time), v: naturalSlope({ regime: regime, alpha: alpha, omegaD: omegaD, root1: root1, root2: root2, coef1: coef1, coef2: coef2 }, time) / omega0 });
    }
    var fMin = Math.max(0.1, f0 * 0.1);
    var fMax = Math.max(fMin * 10, f0 * 3);
    var bandwidthHz = totalR / (2 * Math.PI * L);
    var frequencies = [];
    for (var j = 0; j <= 120; j += 1) {
      var ratio = j / 120;
      frequencies.push(fMin * Math.pow(fMax / fMin, ratio));
    }
    var localHalfWidth = Math.min(f0 * 0.25, Math.max(3 * bandwidthHz, f0 * 0.02));
    var localCount = Math.max(16, Math.min(400, Math.ceil(2 * localHalfWidth / Math.max(bandwidthHz / 8, 1e-12))));
    for (var localIndex = -localCount; localIndex <= localCount; localIndex += 1) {
      frequencies.push(clamp(f0 + localHalfWidth * localIndex / localCount, fMin, fMax));
    }
    frequencies.push(f0);
    frequencies.sort(function (left, right) { return left - right; });
    var uniqueFrequencies = [];
    frequencies.forEach(function (frequency) {
      if (!uniqueFrequencies.length || Math.abs(frequency - uniqueFrequencies[uniqueFrequencies.length - 1]) > Math.max(1e-12, Math.abs(frequency) * 1e-12)) uniqueFrequencies.push(frequency);
    });
    var response = [];
    uniqueFrequencies.forEach(function (frequency) {
      var omega = 2 * Math.PI * frequency;
      var reactance = omega * L - 1 / (omega * C);
      var magnitude = totalR / Math.sqrt(totalR * totalR + reactance * reactance);
      var phase = -Math.atan2(reactance, totalR) * 180 / Math.PI;
      response.push({ f: frequency, gain: magnitude, phase: phase });
    });
    var peakCurrent = config.sourceVrms / totalR;
    var responsePeakGain = response.reduce(function (max, point) { return Math.max(max, point.gain); }, 0);
    return {
      config: config,
      totalR: totalR,
      inductanceH: L,
      capacitanceF: C,
      omega0: omega0,
      f0: f0,
      alpha: alpha,
      zeta: zeta,
      q: q,
      regime: regime,
      omegaD: omegaD,
      fD: fD,
      envelopeMs: 1000 / alpha,
      bandwidthHz: bandwidthHz,
      peakCurrent: peakCurrent,
      resonanceGain: 1,
      reactivePeakVrms: config.sourceVrms * q,
      waveformPeriodS: waveformPeriod,
      waveformPointsPerPeriod: waveformPointsPerPeriod,
      waveformStepS: duration / waveformCount,
      responsePeakGain: responsePeakGain,
      responsePlotMax: Math.max(1, responsePeakGain) * 1.1,
      waveform: waveform,
      response: response
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (children === undefined ? [] : (Array.isArray(children) ? children : [children])).forEach(function (child) {
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
    (children === undefined ? [] : (Array.isArray(children) ? children : [children])).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgText(doc, parent, text, x, y, attrs) {
    var all = attrs || {};
    all.x = x; all.y = y;
    parent.appendChild(svgElement(doc, "text", all, text));
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--eer-blue:#245c9c;--eer-green:#39734d;--eer-gold:#9b6a12;--eer-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .eer-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--eer-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .eer-primary{border-color:var(--eer-blue);background:var(--eer-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .eer-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .eer-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .eer-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eer-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .eer-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .eer-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--eer-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--eer-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eer-layout{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .eer-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .eer-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .eer-metric{min-width:0;padding:9px;border-top:2px solid var(--eer-blue)}[data-learning-lab="' + LAB_ID + '"] .eer-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eer-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .eer-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eer-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .eer-controls{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .eer-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .eer-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eer-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .eer-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eer-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .eer-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
    else {
      var live = rootNode.querySelector("[data-eer-live]");
      if (live) live.textContent = message;
    }
  }
  function pathFor(points, xMap, yMap, xKey, yKey) {
    return points.map(function (point, index) { return (index ? "L" : "M") + xMap(point[xKey]).toFixed(2) + " " + yMap(point[yKey]).toFixed(2); }).join(" ");
  }
  function drawSvg(doc, node, result) {
    clear(node);
    node.setAttribute("viewBox", "0 0 800 380");
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", "串联 RLC 电路、自然响应、频率响应与相平面示意");
    node.appendChild(svgElement(doc, "title", {}, "RLC 电路的阻尼、共振峰与相平面"));
    node.appendChild(svgElement(doc, "desc", {}, "上方是串联电阻、电感、电容示意；左下是归一化自然波形，右下是扫频幅频曲线和电流相位，最下方画出状态相平面。"));
    var blue = "var(--eer-blue)", green = "var(--eer-green)", red = "var(--eer-red)", gold = "var(--eer-gold)";
    node.appendChild(svgElement(doc, "line", { x1: 42, y1: 48, x2: 145, y2: 48, stroke: green, "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "circle", { cx: 42, cy: 48, r: 5, fill: green }));
    node.appendChild(svgElement(doc, "polyline", { points: "145,48 155,38 165,58 175,38 185,58 195,48", fill: "none", stroke: red, "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 195, y1: 48, x2: 250, y2: 48, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "path", { d: "M250 48 c0 -12 18 -12 18 0 c0 12 18 12 18 0 c0 -12 18 -12 18 0 c0 12 18 12 18 0", fill: "none", stroke: blue, "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: 322, y1: 48, x2: 390, y2: 48, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 390, y1: 28, x2: 390, y2: 68, stroke: gold, "stroke-width": 4 }));
    node.appendChild(svgElement(doc, "line", { x1: 402, y1: 28, x2: 402, y2: 68, stroke: gold, "stroke-width": 4 }));
    node.appendChild(svgElement(doc, "line", { x1: 402, y1: 48, x2: 520, y2: 48, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 520, y1: 48, x2: 520, y2: 86, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 520, y1: 86, x2: 42, y2: 86, stroke: "currentColor", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "line", { x1: 42, y1: 86, x2: 42, y2: 48, stroke: "currentColor", "stroke-width": 2 }));
    svgText(doc, node, "低压源", 42, 25, { "font-size": 11, "text-anchor": "middle", fill: green });
    svgText(doc, node, "R + rₚ", 170, 25, { "font-size": 11, "text-anchor": "middle", fill: red });
    svgText(doc, node, "L", 286, 25, { "font-size": 11, "text-anchor": "middle", fill: blue });
    svgText(doc, node, "C", 396, 25, { "font-size": 11, "text-anchor": "middle", fill: gold });
    svgText(doc, node, "RLC 串联回路（示意）", 590, 52, { "font-size": 13, "font-weight": 700 });
    var left = 42, right = 410, top = 116, bottom = 220;
    node.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    var xWave = function (v) { return left + (right - left) * v / result.waveform[result.waveform.length - 1].t; };
    var yWave = function (v) { return (top + bottom) / 2 - v * (bottom - top) * 0.42; };
    node.appendChild(svgElement(doc, "line", { x1: left, y1: (top + bottom) / 2, x2: right, y2: (top + bottom) / 2, stroke: gold, "stroke-dasharray": "4 4", "stroke-opacity": ".7" }));
    node.appendChild(svgElement(doc, "path", { d: pathFor(result.waveform, xWave, yWave, "t", "x"), fill: "none", stroke: blue, "stroke-width": 2.5 }));
    svgText(doc, node, "自然响应 x(t)", left, top - 10, { "font-size": 12, "font-weight": 700 });
    svgText(doc, node, "t / s", right, bottom + 18, { "font-size": 10, "text-anchor": "end" });
    svgText(doc, node, "0", left - 5, bottom + 14, { "font-size": 10, "text-anchor": "end" });
    svgText(doc, node, "初值归一化", left + 6, top + 13, { "font-size": 10, fill: red });
    var rLeft = 470, rRight = 770, rTop = 116, rBottom = 220;
    node.appendChild(svgElement(doc, "line", { x1: rLeft, y1: rBottom, x2: rRight, y2: rBottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: rLeft, y1: rTop, x2: rLeft, y2: rBottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    var fMin = result.response[0].f, fMax = result.response[result.response.length - 1].f;
    var xResp = function (v) { return rLeft + (rRight - rLeft) * Math.log(v / fMin) / Math.log(fMax / fMin); };
    var yGain = function (v) { return rBottom - v / result.responsePlotMax * (rBottom - rTop) * 0.88; };
    node.appendChild(svgElement(doc, "path", { d: pathFor(result.response, xResp, yGain, "f", "gain"), fill: "none", stroke: red, "stroke-width": 2.5 }));
    node.appendChild(svgElement(doc, "line", { x1: xResp(result.f0), y1: rTop, x2: xResp(result.f0), y2: rBottom, stroke: gold, "stroke-dasharray": "5 4" }));
    svgText(doc, node, "归一化电流 |I|/|I(f₀)|", rLeft, rTop - 10, { "font-size": 12, "font-weight": 700 });
    svgText(doc, node, "f₀=" + format(result.f0, 0) + " Hz", xResp(result.f0), rTop + 13, { "font-size": 10, "text-anchor": "middle", fill: gold });
    svgText(doc, node, "低频", rLeft, rBottom + 18, { "font-size": 10 });
    svgText(doc, node, "高频", rRight, rBottom + 18, { "font-size": 10, "text-anchor": "end" });
    var pLeft = 42, pRight = 410, pTop = 270, pBottom = 365;
    node.appendChild(svgElement(doc, "line", { x1: pLeft, y1: (pTop + pBottom) / 2, x2: pRight, y2: (pTop + pBottom) / 2, stroke: "currentColor", "stroke-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: (pLeft + pRight) / 2, y1: pTop, x2: (pLeft + pRight) / 2, y2: pBottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    var xPhase = function (v) { return (pLeft + pRight) / 2 + v * (pRight - pLeft) * 0.42; };
    var yPhase = function (v) { return (pTop + pBottom) / 2 - v * (pBottom - pTop) * 0.42; };
    node.appendChild(svgElement(doc, "path", { d: pathFor(result.waveform, xPhase, yPhase, "x", "v"), fill: "none", stroke: green, "stroke-width": 2.5 }));
    svgText(doc, node, "相平面 x 对 v/ω₀", pLeft, pTop - 9, { "font-size": 12, "font-weight": 700 });
    svgText(doc, node, "x", pRight, (pTop + pBottom) / 2 - 5, { "font-size": 10, "text-anchor": "end" });
    svgText(doc, node, "v/ω₀", (pLeft + pRight) / 2 + 6, pTop + 9, { "font-size": 10 });
    svgText(doc, node, "颜色 + 线形共同区分：波形、幅频、相图", 470, 292, { "font-size": 11, fill: "var(--fg-soft,currentColor)" });
    svgText(doc, node, "Q 越高，螺旋衰减越慢；过阻尼则不绕圈", 470, 312, { "font-size": 11, fill: "var(--fg-soft,currentColor)" });
    svgText(doc, node, "教学仿真，不是器件额定值", 470, 332, { "font-size": 11, fill: red });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "eer-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode);
    var rows = [
      ["总串联电阻", format(result.totalR, 2), "Ω；R + rₚ"],
      ["固有频率 f₀", format(result.f0, 1), "Hz；无阻尼中心尺度"],
      ["阻尼比 ζ", format(result.zeta, 3), "无量纲；" + result.regime],
      ["品质因数 Q", format(result.q, 2), "无量纲；ω₀L/Rtot"],
      ["包络时间", format(result.envelopeMs, 2), "ms；1/α"],
      ["共振电流峰值", format(result.peakCurrent * 1000, 2), "mA rms；Vs/Rtot"],
      ["近似带宽", format(result.bandwidthHz, 1), "Hz；Rtot/(2πL)"],
      ["反应性端电压尺度", format(result.reactivePeakVrms, 2), "V rms；约 QVs，特定端口"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "RLC 参数与响应账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { resistance: DEFAULTS.resistance, inductanceMh: DEFAULTS.inductanceMh, capacitanceUf: DEFAULTS.capacitanceUf, parasiticOhm: DEFAULTS.parasiticOhm, sourceVrms: DEFAULTS.sourceVrms }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = "";
    var shell = element(doc, "div", { className: "eer-shell" });
    shell.appendChild(element(doc, "h3", { text: "RLC 实验：阻尼、共振峰与相平面" }));
    shell.appendChild(element(doc, "p", { className: "eer-note", text: "先判断方向和数量级，再调节低压教学模型。参数与结果都是可复算的仿真，不是器件保证。" }));
    var predictionHost = element(doc, "div");
    var groups = [];
    QUESTIONS.forEach(function (question, index) {
      var fieldset = element(doc, "fieldset");
      fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt }));
      var grid = element(doc, "div", { className: "eer-choice-grid" });
      var buttons = [];
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
        button.value = choice[0];
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice[0];
          buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); });
          reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length;
        });
        buttons.push(button); grid.appendChild(button);
      });
      groups.push({ key: question.key, buttons: buttons });
      fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "eer-actions" });
    var reveal = element(doc, "button", { type: "button", className: "eer-primary", text: "提交预测并揭示", disabled: true });
    var reset = element(doc, "button", { type: "button", text: "重置实验" });
    actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "eer-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "eer-controls" });
    var specs = [
      ["resistance", "电阻 R", 0.1, 80, 0.1, "Ω"],
      ["inductanceMh", "电感 L", 0.1, 50, 0.1, "mH"],
      ["capacitanceUf", "电容 C", 0.1, 50, 0.1, "µF"],
      ["parasiticOhm", "串联寄生 rₚ", 0, 20, 0.1, "Ω"],
      ["sourceVrms", "源幅值 Vs", 0.01, 5, 0.01, "V rms"]
    ];
    var inputs = {}, outputs = {};
    specs.forEach(function (spec) {
      var id = uid + "-" + spec[0];
      var output = element(doc, "output", { text: "" });
      var label = element(doc, "label", { htmlFor: id, text: spec[1] });
      var wrap = element(doc, "div", { className: "eer-control" }, [label, output]);
      var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] });
      input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); });
      wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output;
    });
    results.appendChild(controls);
    var layout = element(doc, "div", { className: "eer-layout" });
    var stage = element(doc, "div", { className: "eer-stage" });
    var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage);
    var side = element(doc, "div");
    var metrics = element(doc, "div", { className: "eer-metrics" }); side.appendChild(metrics);
    var tableWrap = element(doc, "div", { className: "eer-table-wrap" }); side.appendChild(tableWrap);
    side.appendChild(element(doc, "p", { className: "eer-note", text: "相平面和频响只检验这组线性方程；它们不证明器件温升、额定值或高频寄生已经合格。" }));
    layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() {
      groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); });
      reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length;
    }
    function renderResult() {
      var result = computeRlc(state.config);
      results.hidden = !state.revealed;
      outputs.resistance.textContent = format(result.config.resistance, 1) + " Ω";
      outputs.inductanceMh.textContent = format(result.config.inductanceMh, 1) + " mH";
      outputs.capacitanceUf.textContent = format(result.config.capacitanceUf, 1) + " µF";
      outputs.parasiticOhm.textContent = format(result.config.parasiticOhm, 1) + " Ω";
      outputs.sourceVrms.textContent = format(result.config.sourceVrms, 2) + " V";
      drawSvg(doc, svg, result); clear(metrics);
      metrics.appendChild(metric(doc, "f₀", format(result.f0, 1) + " Hz"));
      metrics.appendChild(metric(doc, "Q", format(result.q, 2)));
      metrics.appendChild(metric(doc, "阻尼", result.regime));
      metrics.appendChild(metric(doc, "包络", format(result.envelopeMs, 2) + " ms"));
      renderTable(doc, tableWrap, result);
    }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () {
      if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; }
      var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0);
      state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在观察 Q、带宽和相平面的共同变化。"; render(); announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: { resistance: DEFAULTS.resistance, inductanceMh: DEFAULTS.inductanceMh, capacitanceUf: DEFAULTS.capacitanceUf, parasiticOhm: DEFAULTS.parasiticOhm, sourceVrms: DEFAULTS.sourceVrms }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
      Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "RLC 实验已重置。");
    });
    rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-eer-live": true, "aria-live": "polite" }));
    render();
  }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeRlc(DEFAULTS);
    check(near(result.f0, 503.292121, 1e-6), "natural frequency");
    check(near(result.q, 2.635231, 1e-5), "quality factor");
    check(result.regime === "欠阻尼", "default is underdamped");
    check(result.response.some(function (point) { return point.f === result.f0; }), "frequency grid includes exact f0");
    check(result.resonanceGain === 1, "resonance gain at exact f0");
    check(near(result.response.filter(function (point) { return point.f === result.f0; })[0].gain, 1, 1e-12), "sampled response resolves exact resonance");
    check(result.waveformPointsPerPeriod >= 24 && result.waveformStepS <= result.waveformPeriodS / 24, "time grid resolves damped period");
    check(computeRlc({ resistance: 20, inductanceMh: 10, capacitanceUf: 10, parasiticOhm: 2 }).q < result.q, "more resistance lowers Q");
    check(computeRlc({ resistance: 80, inductanceMh: 0.1, capacitanceUf: 50, parasiticOhm: 20 }).regime === "过阻尼", "overdamped edge");
    var highQ = computeRlc({ resistance: 0.1, inductanceMh: 50, capacitanceUf: 0.1, parasiticOhm: 0 });
    check(highQ.q > 1000 && highQ.responsePeakGain > 0.99, "high-Q peak is resolved");
    check(highQ.waveform.length > result.waveform.length && highQ.waveformPointsPerPeriod >= 24, "high-Q time sampling is dense");
    check(highQ.response.every(function (point) { return point.f >= highQ.response[0].f && point.f <= highQ.response[highQ.response.length - 1].f && point.gain <= highQ.responsePlotMax; }), "response plot range contains legal peak");
    check(isFinite(computeRlc({ resistance: -100, inductanceMh: 0, capacitanceUf: 0, parasiticOhm: -1 }).f0), "input normalization keeps finite output");
    check(JSON.stringify(computeRlc(DEFAULTS)) === JSON.stringify(computeRlc(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, computeRlc: computeRlc, mount: mount, selfTest: selfTest };
}));
