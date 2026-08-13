(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "swave-scattering-styles";
  var RADIUS = 1;
  var PRESETS = [
    { id: "weak", label: "弱吸引井", depth: 0.25, k: 0.35 },
    { id: "resonance", label: "首个阈值共振", depth: 2.435, k: 0.18 },
    { id: "suppression", label: "近散射零点", depth: 20.19, k: 0.25 },
    { id: "finite", label: "有限能量中等散射", depth: 2, k: 1.1 }
  ];

  var STYLE_TEXT = [
    ".sws-lab{max-width:100%;min-width:0;color:var(--fg);}",
    ".sws-lab *{box-sizing:border-box;}",
    ".sws-lab [hidden]{display:none!important;}",
    ".sws-lab .sws-note,.sws-lab .sws-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;}",
    ".sws-lab .sws-presets,.sws-lab .sws-choice,.sws-lab .sws-actions{display:flex;flex-wrap:wrap;gap:8px;}",
    ".sws-lab button{min-height:44px;}",
    ".sws-lab .sws-presets button{flex:1 1 135px;}",
    ".sws-lab .sws-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 18px;margin:14px 0;}",
    ".sws-lab .sws-control{display:grid;gap:4px;min-width:0;}",
    ".sws-lab .sws-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700;}",
    ".sws-lab .sws-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".sws-lab .sws-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold);background:var(--bg);}",
    ".sws-lab .sws-predict strong{display:block;margin-bottom:8px;font-size:13px;}",
    ".sws-lab .sws-choice button{flex:1 1 145px;}",
    ".sws-lab .sws-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}",
    ".sws-lab .sws-pass{color:var(--cl-green);}.sws-lab .sws-warn{color:var(--cl-red);}",
    ".sws-lab .sws-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:14px 0;}",
    ".sws-lab .sws-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".sws-lab .sws-metric span{display:block;color:var(--fg-soft);font-size:11.5px;}",
    ".sws-lab .sws-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".sws-lab .sws-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}",
    ".sws-lab .sws-chart{min-width:0;}",
    ".sws-lab svg{display:block;width:100%;height:auto;background:var(--bg);border:1px solid var(--border);border-radius:7px;}",
    ".sws-lab svg text{fill:var(--fg);font-family:inherit;letter-spacing:0;}",
    ".sws-lab .sws-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.55;}",
    ".sws-lab .sws-boundary{stroke:var(--cl-red);stroke-width:1.4;stroke-dasharray:5 4;}",
    ".sws-lab .sws-inside{stroke:var(--accent);stroke-width:3;fill:none;}",
    ".sws-lab .sws-outside{stroke:var(--cl-gold);stroke-width:3;fill:none;}",
    ".sws-lab .sws-cross{stroke:var(--accent);stroke-width:3;fill:none;}",
    ".sws-lab .sws-limit{stroke:var(--cl-red);stroke-width:1.8;stroke-dasharray:6 4;fill:none;}",
    ".sws-lab .sws-selected{fill:var(--cl-green);stroke:var(--bg);stroke-width:2;}",
    ".sws-lab .sws-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px;}",
    ".sws-lab table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
    ".sws-lab th,.sws-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;}",
    ".sws-lab th{color:var(--fg-soft);font-size:11.5px;}",
    ".sws-lab button:focus-visible,.sws-lab input:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px;}",
    "@media(max-width:760px){.sws-lab .sws-controls,.sws-lab .sws-charts{grid-template-columns:minmax(0,1fr);}}",
    "@media(prefers-reduced-motion:reduce){.sws-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function copyPreset(preset) { return { id: preset.id, label: preset.label, depth: preset.depth, k: preset.k }; }
  function scatteringLength(depth) {
    var value = Math.max(0, Number(depth));
    if (value < 1e-8) return -value / 3 - 2 * value * value / 15;
    var x = Math.sqrt(value);
    return RADIUS - Math.tan(x * RADIUS) / x;
  }
  function phaseData(depth, k) {
    var energy = Math.max(1e-5, Number(k));
    var well = Math.max(0, Number(depth));
    var q = Math.sqrt(energy * energy + well);
    var qR = q * RADIUS, kR = energy * RADIUS;
    var vx = q * Math.cos(qR), vy = energy * Math.sin(qR);
    var norm = Math.hypot(vx, vy);
    var cosTheta = vx / norm, sinTheta = vy / norm;
    var sinDelta = sinTheta * Math.cos(kR) - cosTheta * Math.sin(kR);
    var cosDelta = cosTheta * Math.cos(kR) + sinTheta * Math.sin(kR);
    var delta = Math.atan2(sinDelta, cosDelta);
    var fraction = clamp(sinDelta * sinDelta, 0, 1);
    var sigma = 4 * Math.PI * fraction / (energy * energy);
    var amplitude = energy / norm;
    var uInside = amplitude * Math.sin(qR), duInside = amplitude * q * Math.cos(qR);
    var uOutside = Math.sin(kR + delta), duOutside = energy * Math.cos(kR + delta);
    return {
      depth: well, k: energy, q: q, delta: delta, sin2: fraction, sigma: sigma,
      unitarity: 4 * Math.PI / (energy * energy), scatteringLength: scatteringLength(well),
      insideAmplitude: amplitude, uResidual: uInside - uOutside, duResidual: duInside - duOutside,
      uBoundary: uOutside, duBoundary: duOutside
    };
  }
  function classify(data) { return data.sin2 >= 0.8 ? "unitarity" : data.sin2 < 0.1 ? "low" : "moderate"; }
  function classLabel(value) { return value === "unitarity" ? "接近 s 波幺正上限" : value === "low" ? "受抑制 / 很小" : "中等截面"; }
  function radialPoints(data) {
    var maxR = Math.min(12, Math.max(4, 1 + 2 * Math.PI / data.k));
    var points = [];
    for (var i = 0; i <= 180; i += 1) {
      var r = maxR * i / 180;
      var inside = r <= RADIUS;
      var u = inside ? data.insideAmplitude * Math.sin(data.q * r) : Math.sin(data.k * r + data.delta);
      points.push({ r: r, u: u, inside: inside });
    }
    return { maxR: maxR, points: points };
  }
  function crossSectionCurve(depth) {
    var points = [];
    for (var i = 0; i <= 130; i += 1) {
      var k = 0.04 + 2.46 * i / 130, data = phaseData(depth, k);
      points.push({ k: k, sigmaScaled: data.sigma / (4 * Math.PI), limitScaled: 1 / (k * k) });
    }
    return points;
  }
  function format(value, digits) {
    if (!Number.isFinite(value)) return value < 0 ? "−∞" : "∞";
    if (Math.abs(value) < 5e-10) return "0";
    if (Math.abs(value) >= 10000) return value.toExponential(2);
    var text = value.toFixed(digits === undefined ? 3 : digits); return text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function svgNode(doc, tag, attrs, value) {
    var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); }); if (value !== undefined) node.textContent = value; return node;
  }
  function path(points, x, y) { return points.map(function (p, i) { return (i ? "L" : "M") + x(p) + " " + y(p); }).join(" "); }
  function radialSvg(doc, data) {
    var radial = radialPoints(data), svg = svgNode(doc, "svg", { viewBox: "0 0 420 330", role: "img", "aria-label": "球方井内外匹配的 s 波径向函数" });
    svg.appendChild(svgNode(doc, "title", {}, "匹配后的约化径向波函数"));
    var maxU = Math.max(1, radial.points.reduce(function (m, p) { return Math.max(m, Math.abs(p.u)); }, 0) * 1.1);
    var mx = function (r) { return 42 + r / radial.maxR * 340; }, my = function (u) { return 170 - u / maxU * 118; };
    svg.appendChild(svgNode(doc, "line", { x1: 42, y1: my(0), x2: 382, y2: my(0), class: "sws-grid" }));
    var boundaryX = mx(1); svg.appendChild(svgNode(doc, "line", { x1: boundaryX, y1: 42, x2: boundaryX, y2: 292, class: "sws-boundary" }));
    var inside = radial.points.filter(function (p) { return p.r <= 1 + 1e-9; }), outside = radial.points.filter(function (p) { return p.r >= 1 - radial.maxR / 180; });
    svg.appendChild(svgNode(doc, "path", { d: path(inside, function (p) { return mx(p.r); }, function (p) { return my(p.u); }), class: "sws-inside" }));
    svg.appendChild(svgNode(doc, "path", { d: path(outside, function (p) { return mx(p.r); }, function (p) { return my(p.u); }), class: "sws-outside" }));
    svg.appendChild(svgNode(doc, "text", { x: 42, y: 25, "font-size": 13, "font-weight": 700 }, "u(r)：井内蓝，井外金"));
    svg.appendChild(svgNode(doc, "text", { x: boundaryX + 5, y: 55, "font-size": 10 }, "R=1"));
    svg.appendChild(svgNode(doc, "text", { x: 382, y: 312, "font-size": 10, "text-anchor": "end" }, "r"));
    return svg;
  }
  function crossSvg(doc, depth, selected) {
    var points = crossSectionCurve(depth), svg = svgNode(doc, "svg", { viewBox: "0 0 420 330", role: "img", "aria-label": "s 波截面随波数变化及幺正上限" });
    svg.appendChild(svgNode(doc, "title", {}, "截面与 s 波幺正上限"));
    var logs = points.map(function (p) { return Math.log10(Math.max(p.sigmaScaled, 1e-7)); });
    var limitLogs = points.map(function (p) { return Math.log10(p.limitScaled); });
    var minY = Math.max(-6, Math.min.apply(null, logs) - .25), maxY = Math.min(3, Math.max.apply(null, limitLogs) + .1);
    var mx = function (k) { return 42 + (k - .04) / 2.46 * 340; }, my = function (v) { return 292 - (clamp(v, minY, maxY) - minY) / (maxY - minY) * 250; };
    [0, .5, 1].forEach(function (q) { var v = minY + q * (maxY - minY), y = my(v); svg.appendChild(svgNode(doc, "line", { x1: 42, y1: y, x2: 382, y2: y, class: "sws-grid" })); svg.appendChild(svgNode(doc, "text", { x: 36, y: y + 4, "font-size": 10, "text-anchor": "end" }, format(v, 1))); });
    svg.appendChild(svgNode(doc, "path", { d: path(points, function (p) { return mx(p.k); }, function (p) { return my(Math.log10(Math.max(p.sigmaScaled, 1e-7))); }), class: "sws-cross" }));
    svg.appendChild(svgNode(doc, "path", { d: path(points, function (p) { return mx(p.k); }, function (p) { return my(Math.log10(p.limitScaled)); }), class: "sws-limit" }));
    svg.appendChild(svgNode(doc, "circle", { cx: mx(selected.k), cy: my(Math.log10(Math.max(selected.sigma / (4 * Math.PI), 1e-7))), r: 5, class: "sws-selected" }));
    svg.appendChild(svgNode(doc, "text", { x: 42, y: 25, "font-size": 13, "font-weight": 700 }, "log₁₀[σ₀/(4πR²)]"));
    svg.appendChild(svgNode(doc, "text", { x: 378, y: 55, "font-size": 10, "text-anchor": "end" }, "红虚线：1/(kR)² 上限"));
    svg.appendChild(svgNode(doc, "text", { x: 382, y: 312, "font-size": 10, "text-anchor": "end" }, "kR"));
    return svg;
  }
  function element(doc, tag, className, value) { var node = doc.createElement(tag); if (className) node.className = className; if (value !== undefined) node.textContent = value; return node; }
  function installStyles(doc) { if (doc.getElementById(STYLE_ID)) return; var style = element(doc, "style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; doc.head.appendChild(style); }
  function metric(doc, label, value) { var box = element(doc, "div", "sws-metric"); box.appendChild(element(doc, "span", "", label)); box.appendChild(element(doc, "strong", "", value)); return box; }
  function mount(root, api) {
    var doc = root.ownerDocument; installStyles(doc);
    var state = copyPreset(PRESETS[0]), prediction = null, revealed = false;
    var shell = element(doc, "div", "sws-lab"); shell.appendChild(element(doc, "p", "sws-note", "固定 R=1、2μ/ℏ²=1。先猜截面占 s 波幺正上限的比例，再打开匹配账本。"));
    var presets = element(doc, "div", "sws-presets"), presetButtons = [];
    PRESETS.forEach(function (preset) { var button = element(doc, "button", "", preset.label); button.type = "button"; button.addEventListener("click", function () { state = copyPreset(preset); prediction = null; revealed = false; sync(); render(); }); presetButtons.push({ id: preset.id, node: button }); presets.appendChild(button); }); shell.appendChild(presets);
    var controls = element(doc, "div", "sws-controls"), inputs = {};
    [["depth", "井深 V₀", 0, 25, .01], ["k", "外部波数 k", .05, 2.5, .01]].forEach(function (spec) { var wrap = element(doc, "div", "sws-control"), label = element(doc, "label", "", spec[1] + "："), output = element(doc, "output"), input = element(doc, "input"); input.type = "range"; input.min = spec[2]; input.max = spec[3]; input.step = spec[4]; input.setAttribute("aria-label", spec[1]); input.addEventListener("input", function () { state[spec[0]] = Number(input.value); state.id = "custom"; prediction = null; revealed = false; render(); }); label.appendChild(output); wrap.appendChild(label); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = { input: input, output: output }; }); shell.appendChild(controls);
    var predict = element(doc, "div", "sws-predict"); predict.appendChild(element(doc, "strong", "", "先预测：σ₀ 距离 4π/k² 有多近？")); var choices = element(doc, "div", "sws-choice"), choiceButtons = [];
    [["low", "受抑制 / 很小"], ["moderate", "中等"], ["unitarity", "接近幺正上限"]].forEach(function (item) { var button = element(doc, "button", "", item[1]); button.type = "button"; button.addEventListener("click", function () { prediction = item[0]; renderPrediction(); }); choiceButtons.push({ value: item[0], node: button }); choices.appendChild(button); }); predict.appendChild(choices);
    var actions = element(doc, "div", "sws-actions"), check = element(doc, "button", "cl-primary", "核对预测"), reset = element(doc, "button", "", "重置本预设"); check.type = reset.type = "button"; var feedback = element(doc, "p", "sws-feedback", "先选一个判断。"), results = element(doc, "div"); results.hidden = true;
    check.addEventListener("click", function () { if (!prediction) { feedback.textContent = "请先作出预测。"; feedback.className = "sws-feedback sws-warn"; return; } revealed = true; render(); }); reset.addEventListener("click", function () { var preset = PRESETS.filter(function (p) { return p.id === state.id; })[0] || PRESETS[0]; state = copyPreset(preset); prediction = null; revealed = false; sync(); render(); }); actions.appendChild(check); actions.appendChild(reset); predict.appendChild(actions); predict.appendChild(feedback); shell.appendChild(predict); shell.appendChild(results); root.replaceChildren(shell);
    function sync() { inputs.depth.input.value = state.depth; inputs.k.input.value = state.k; }
    function renderPrediction() { choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", prediction === item.value ? "true" : "false"); }); }
    function render() {
      sync(); inputs.depth.output.textContent = format(state.depth, 2); inputs.k.output.textContent = format(state.k, 2); presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.id === item.id ? "true" : "false"); }); renderPrediction();
      var data = phaseData(state.depth, state.k), expected = classify(data);
      if (!revealed) { results.hidden = true; feedback.textContent = prediction ? "预测已记录，点击“核对预测”查看匹配证据。" : "先选一个判断。"; feedback.className = "sws-feedback"; return; }
      results.hidden = false; var correct = prediction === expected; feedback.textContent = (correct ? "预测命中。" : "看归一化截面。") + " sin²δ₀=" + format(data.sin2, 3) + "，判为“" + classLabel(expected) + "”。"; feedback.className = "sws-feedback " + (correct ? "sws-pass" : "sws-warn"); if (api && api.announce) api.announce(root, feedback.textContent);
      results.replaceChildren(); var metrics = element(doc, "div", "sws-metrics"); metrics.appendChild(metric(doc, "井内波数 q", format(data.q, 3))); metrics.appendChild(metric(doc, "相移 δ₀", format(data.delta * 180 / Math.PI, 2) + "° (mod 180°)")); metrics.appendChild(metric(doc, "散射长度 aₛ", format(data.scatteringLength, 3))); metrics.appendChild(metric(doc, "σ₀", format(data.sigma, 3))); metrics.appendChild(metric(doc, "σ₀/(4π/k²)", format(data.sin2, 3))); metrics.appendChild(metric(doc, "匹配残差 max", format(Math.max(Math.abs(data.uResidual), Math.abs(data.duResidual)), 6))); results.appendChild(metrics);
      var charts = element(doc, "div", "sws-charts"), a = element(doc, "div", "sws-chart"), b = element(doc, "div", "sws-chart"); a.appendChild(radialSvg(doc, data)); b.appendChild(crossSvg(doc, state.depth, data)); charts.appendChild(a); charts.appendChild(b); results.appendChild(charts);
      var wrap = element(doc, "div", "sws-ledger"), table = element(doc, "table"); table.setAttribute("aria-label", "球方井 s 波匹配账本"); var head = element(doc, "tr"); ["检查", "井内", "井外", "残差 / 结论"].forEach(function (label) { var th = element(doc, "th", "", label); th.scope = "col"; head.appendChild(th); }); var thead = element(doc, "thead"); thead.appendChild(head); table.appendChild(thead); var body = element(doc, "tbody");
      [["u(R) 连续", format(data.uBoundary + data.uResidual, 6), format(data.uBoundary, 6), format(data.uResidual, 7)], ["u′(R) 连续", format(data.duBoundary + data.duResidual, 6), format(data.duBoundary, 6), format(data.duResidual, 7)], ["相移账", "tan(kR+δ)=(k/q)tan(qR)", "δ 只定义到 mod π", "sin²δ 无分支跳变"], ["截面账", "dσ/dΩ=sin²δ/k²", "σ₀=4πsin²δ/k²", "上限 4π/k²"]].forEach(function (row) { var tr = element(doc, "tr"); row.forEach(function (value) { tr.appendChild(element(doc, "td", "", value)); }); body.appendChild(tr); }); table.appendChild(body); wrap.appendChild(table); results.appendChild(wrap); results.appendChild(element(doc, "p", "sws-note", "井外实径向波被约定为单位正弦振幅；井内振幅由 u 与 u′ 连续性确定。整体波函数归一化不影响相移与截面。"));
    }
    sync(); render();
  }
  function selfTest() {
    var checks = 0; function assert(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    var free = phaseData(0, .7); assert(Math.abs(free.delta) < 1e-10, "free phase shift"); assert(free.sigma < 1e-18, "free cross section"); assert(Math.abs(scatteringLength(0)) < 1e-14, "free scattering length");
    PRESETS.forEach(function (preset) { var data = phaseData(preset.depth, preset.k); assert(Math.abs(data.uResidual) < 1e-10, preset.id + " u match"); assert(Math.abs(data.duResidual) < 1e-10, preset.id + " derivative match"); assert(data.sin2 >= 0 && data.sin2 <= 1 + 1e-12, preset.id + " unitarity fraction"); assert(data.sigma <= data.unitarity + 1e-9, preset.id + " unitarity bound"); });
    var below = scatteringLength(Math.pow(Math.PI / 2 - .01, 2)), above = scatteringLength(Math.pow(Math.PI / 2 + .01, 2)); assert(below < -20 && above > 20, "threshold resonance changes scattering-length sign");
    var weak = scatteringLength(1e-6); assert(Math.abs(weak + 1e-6 / 3) < 1e-10, "weak-well expansion");
    var branchA = phaseData(2.2, .4), branchB = phaseData(2.2, .4); assert(Math.abs(branchA.sin2 - branchB.sin2) < 1e-14, "branch-invariant observable");
    return { checks: checks, presets: PRESETS.length };
  }
  var exported = { PRESETS: PRESETS, scatteringLength: scatteringLength, phaseData: phaseData, classify: classify, radialPoints: radialPoints, crossSectionCurve: crossSectionCurve, selfTest: selfTest };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") host.CourseLearning.register("swave-scattering", mount);
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) { try { var report = selfTest(); console.log("swave-scattering self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)"); } catch (error) { console.error("swave-scattering self-test: FAIL\n" + error.stack); process.exitCode = 1; } }
})(typeof window !== "undefined" ? window : null);
