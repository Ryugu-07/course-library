(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "optimization-landscape-styles";
  var EPS = 1e-12;
  var PRESETS = [
    { id: "round", label: "良态", kappa: 4, beta: 0.8, rotation: 35, angle: 20, steps: 18, expected: "converge" },
    { id: "ill", label: "病态", kappa: 25, beta: 1, rotation: -35, angle: 25, steps: 48, expected: "converge" },
    { id: "cautious", label: "保守小步", kappa: 10, beta: 0.5, rotation: 25, angle: 40, steps: 34, expected: "converge" },
    { id: "oscillate", label: "近极限换号", kappa: 10, beta: 1.85, rotation: 28, angle: -20, steps: 30, expected: "oscillate" },
    { id: "diverge", label: "越界发散", kappa: 10, beta: 2.2, rotation: 28, angle: -20, steps: 18, expected: "diverge" }
  ];

  var STYLE_TEXT = [
    ".opl-lab{max-width:100%;min-width:0;color:var(--fg);}",
    ".opl-lab *{box-sizing:border-box;}",
    ".opl-lab [hidden]{display:none!important;}",
    ".opl-lab .opl-note,.opl-lab .opl-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;}",
    ".opl-lab .opl-presets,.opl-lab .opl-choice,.opl-lab .opl-actions{display:flex;flex-wrap:wrap;gap:8px;}",
    ".opl-lab button{min-height:44px;}",
    ".opl-lab .opl-presets button{flex:1 1 128px;}",
    ".opl-lab .opl-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;margin:14px 0;}",
    ".opl-lab .opl-control{display:grid;gap:4px;min-width:0;}",
    ".opl-lab .opl-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700;}",
    ".opl-lab .opl-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".opl-lab .opl-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold);background:var(--bg);}",
    ".opl-lab .opl-predict strong{display:block;margin-bottom:8px;font-size:13px;}",
    ".opl-lab .opl-choice button{flex:1 1 135px;}",
    ".opl-lab .opl-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}",
    ".opl-lab .opl-pass{color:var(--cl-green);}.opl-lab .opl-warn{color:var(--cl-red);}",
    ".opl-lab .opl-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:14px 0;}",
    ".opl-lab .opl-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".opl-lab .opl-metric span{display:block;color:var(--fg-soft);font-size:11.5px;}",
    ".opl-lab .opl-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".opl-lab .opl-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}",
    ".opl-lab .opl-chart{min-width:0;}",
    ".opl-lab svg{display:block;width:100%;height:auto;background:var(--bg);border:1px solid var(--border);border-radius:7px;}",
    ".opl-lab svg text{fill:var(--fg);font-family:inherit;letter-spacing:0;}",
    ".opl-lab .opl-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.55;fill:none;}",
    ".opl-lab .opl-contour{stroke:var(--fg-soft);stroke-width:1.1;stroke-opacity:.62;fill:none;}",
    ".opl-lab .opl-path{stroke:var(--accent);stroke-width:3;fill:none;stroke-linejoin:round;stroke-linecap:round;}",
    ".opl-lab .opl-energy{stroke:var(--cl-gold);stroke-width:3;fill:none;stroke-linejoin:round;}",
    ".opl-lab .opl-start{fill:var(--cl-green);}.opl-lab .opl-end{fill:var(--cl-red);}",
    ".opl-lab .opl-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px;}",
    ".opl-lab table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
    ".opl-lab th,.opl-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;}",
    ".opl-lab th{color:var(--fg-soft);font-size:11.5px;}",
    ".opl-lab button:focus-visible,.opl-lab input:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px;}",
    "@media(max-width:760px){.opl-lab .opl-controls,.opl-lab .opl-charts{grid-template-columns:minmax(0,1fr);}}",
    "@media(prefers-reduced-motion:reduce){.opl-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function nearly(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || 1e-9); }
  function copyPreset(preset) {
    return { id: preset.id, label: preset.label, kappa: preset.kappa, beta: preset.beta, rotation: preset.rotation, angle: preset.angle, steps: preset.steps };
  }
  function factors(config) {
    var kappa = Math.max(1, Number(config.kappa));
    var beta = Number(config.beta);
    return { mu: 1, L: kappa, alpha: beta / kappa, slow: 1 - beta / kappa, fast: 1 - beta };
  }
  function toEigen(x, rotation) {
    var t = rotation * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return [c * x[0] + s * x[1], -s * x[0] + c * x[1]];
  }
  function fromEigen(z, rotation) {
    var t = rotation * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return [c * z[0] - s * z[1], s * z[0] + c * z[1]];
  }
  function simulate(config) {
    var f = factors(config);
    var a = Number(config.angle) * Math.PI / 180;
    var z = toEigen([Math.cos(a), Math.sin(a)], Number(config.rotation));
    var rows = [];
    var steps = Math.max(1, Math.floor(Number(config.steps)));
    var e0 = 0.5 * (f.mu * z[0] * z[0] + f.L * z[1] * z[1]);
    for (var k = 0; k <= steps; k += 1) {
      var x = fromEigen(z, Number(config.rotation));
      var energy = 0.5 * (f.mu * z[0] * z[0] + f.L * z[1] * z[1]);
      rows.push({ k: k, x: x[0], y: x[1], slow: z[0], fast: z[1], energy: energy, relative: e0 ? energy / e0 : 0, gradNorm: Math.hypot(f.mu * z[0], f.L * z[1]) });
      z = [f.slow * z[0], f.fast * z[1]];
    }
    var active = [];
    if (Math.abs(rows[0].slow) > EPS) active.push(f.slow);
    if (Math.abs(rows[0].fast) > EPS) active.push(f.fast);
    var rho = active.reduce(function (m, value) { return Math.max(m, Math.abs(value)); }, 0);
    var kind = rho >= 1 - 1e-12 ? "diverge" : active.some(function (value) { return value < 0; }) ? "oscillate" : "converge";
    return { factors: f, rows: rows, rho: rho, kind: kind, monotoneEnergy: rows.every(function (row, i) { return i === 0 || row.energy <= rows[i - 1].energy + 1e-12; }) };
  }
  function optimumBeta(kappa) { return 2 * kappa / (kappa + 1); }
  function optimumRho(kappa) { return (kappa - 1) / (kappa + 1); }
  function kindLabel(kind) { return kind === "oscillate" ? "换号但收敛" : kind === "diverge" ? "不收敛 / 发散" : "不换号收敛"; }
  function format(value, digits) {
    if (!Number.isFinite(value)) return "∞";
    if (Math.abs(value) < 5e-12) return "0";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function svgNode(doc, tag, attrs, value) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
    if (value !== undefined) node.textContent = value;
    return node;
  }
  function path(points, x, y) { return points.map(function (p, i) { return (i ? "L" : "M") + x(p) + " " + y(p); }).join(" "); }
  function contourSvg(doc, config, result) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 420 330", role: "img", "aria-label": "二次目标等高线与梯度下降轨迹" });
    svg.appendChild(svgNode(doc, "title", {}, "等高线与迭代轨迹"));
    var maxAbs = 1.12;
    result.rows.forEach(function (p) { maxAbs = Math.max(maxAbs, Math.abs(p.x) * 1.1, Math.abs(p.y) * 1.1); });
    maxAbs = Math.min(maxAbs, 8);
    var mx = function (v) { return 35 + (v + maxAbs) / (2 * maxAbs) * 350; };
    var my = function (v) { return 292 - (v + maxAbs) / (2 * maxAbs) * 250; };
    svg.appendChild(svgNode(doc, "line", { x1: mx(0), y1: 42, x2: mx(0), y2: 292, class: "opl-grid" }));
    svg.appendChild(svgNode(doc, "line", { x1: 35, y1: my(0), x2: 385, y2: my(0), class: "opl-grid" }));
    var initialEnergy = Math.max(result.rows[0].energy, 1e-6);
    [0.04, 0.16, 0.45, 1].forEach(function (fraction) {
      var radius = Math.sqrt(2 * initialEnergy * fraction);
      var points = [];
      for (var i = 0; i <= 100; i += 1) {
        var t = 2 * Math.PI * i / 100;
        var z = [radius * Math.cos(t), radius * Math.sin(t) / Math.sqrt(config.kappa)];
        var p = fromEigen(z, config.rotation);
        points.push({ x: p[0], y: p[1] });
      }
      svg.appendChild(svgNode(doc, "path", { d: path(points, function (p) { return mx(p.x); }, function (p) { return my(p.y); }), class: "opl-contour" }));
    });
    svg.appendChild(svgNode(doc, "path", { d: path(result.rows, function (p) { return mx(clamp(p.x, -maxAbs, maxAbs)); }, function (p) { return my(clamp(p.y, -maxAbs, maxAbs)); }), class: "opl-path" }));
    svg.appendChild(svgNode(doc, "circle", { cx: mx(result.rows[0].x), cy: my(result.rows[0].y), r: 5, class: "opl-start" }));
    var last = result.rows[result.rows.length - 1];
    svg.appendChild(svgNode(doc, "circle", { cx: mx(clamp(last.x, -maxAbs, maxAbs)), cy: my(clamp(last.y, -maxAbs, maxAbs)), r: 5, class: "opl-end" }));
    svg.appendChild(svgNode(doc, "text", { x: 35, y: 25, "font-size": 13, "font-weight": 700 }, "等高线与轨迹"));
    svg.appendChild(svgNode(doc, "text", { x: 385, y: 312, "font-size": 10, "text-anchor": "end" }, "绿：x₀  红：xₙ"));
    return svg;
  }
  function energySvg(doc, result) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 420 330", role: "img", "aria-label": "相对目标函数值的对数曲线" });
    svg.appendChild(svgNode(doc, "title", {}, "相对目标函数值迭代账本"));
    var values = result.rows.map(function (row) { return Math.log10(Math.max(row.relative, 1e-12)); });
    var minY = Math.min(-1, Math.max(-12, Math.min.apply(null, values)));
    var maxY = Math.max(0, Math.min(6, Math.max.apply(null, values)));
    if (maxY - minY < 1) minY = maxY - 1;
    var mx = function (i) { return 42 + i / Math.max(1, values.length - 1) * 340; };
    var my = function (v) { return 292 - (clamp(v, minY, maxY) - minY) / (maxY - minY) * 250; };
    [0, 0.5, 1].forEach(function (q) {
      var yv = minY + q * (maxY - minY), py = my(yv);
      svg.appendChild(svgNode(doc, "line", { x1: 42, y1: py, x2: 382, y2: py, class: "opl-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: 36, y: py + 4, "font-size": 10, "text-anchor": "end" }, format(yv, 1)));
    });
    var points = values.map(function (v, i) { return { i: i, value: v }; });
    svg.appendChild(svgNode(doc, "path", { d: path(points, function (p) { return mx(p.i); }, function (p) { return my(p.value); }), class: "opl-energy" }));
    svg.appendChild(svgNode(doc, "text", { x: 42, y: 25, "font-size": 13, "font-weight": 700 }, "log₁₀[f(xₖ)/f(x₀)]"));
    svg.appendChild(svgNode(doc, "text", { x: 382, y: 312, "font-size": 10, "text-anchor": "end" }, "迭代 k"));
    return svg;
  }
  function element(doc, tag, className, value) {
    var node = doc.createElement(tag); if (className) node.className = className; if (value !== undefined) node.textContent = value; return node;
  }
  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = element(doc, "style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; doc.head.appendChild(style);
  }
  function metric(doc, label, value) {
    var box = element(doc, "div", "opl-metric"); box.appendChild(element(doc, "span", "", label)); box.appendChild(element(doc, "strong", "", value)); return box;
  }
  function mount(root, api) {
    var doc = root.ownerDocument; installStyles(doc);
    var state = copyPreset(PRESETS[1]), prediction = null, revealed = false;
    var shell = element(doc, "div", "opl-lab");
    shell.appendChild(element(doc, "p", "opl-note", "把最大曲率方向的无量纲步长 β=αL 当作油门。先预测，再看轨迹与能量两本账。"));
    var presetRow = element(doc, "div", "opl-presets"), presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", "", preset.label); button.type = "button";
      button.addEventListener("click", function () { state = copyPreset(preset); prediction = null; revealed = false; syncInputs(); render(); });
      presetButtons.push({ id: preset.id, node: button }); presetRow.appendChild(button);
    }); shell.appendChild(presetRow);
    var controls = element(doc, "div", "opl-controls"), inputs = {};
    [["kappa", "条件数 κ", 1, 40, .5], ["beta", "油门 β=αL", .05, 2.4, .05], ["rotation", "谷底旋转角", -80, 80, 1], ["angle", "初始方向", -180, 180, 1], ["steps", "迭代步数", 4, 60, 1]].forEach(function (spec) {
      var wrap = element(doc, "div", "opl-control"), label = element(doc, "label", "", spec[1] + "："), output = element(doc, "output");
      var input = element(doc, "input"); input.type = "range"; input.min = String(spec[2]); input.max = String(spec[3]); input.step = String(spec[4]); input.setAttribute("aria-label", spec[1]);
      input.addEventListener("input", function () { state[spec[0]] = spec[0] === "steps" ? Math.round(Number(input.value)) : Number(input.value); state.id = "custom"; prediction = null; revealed = false; render(); });
      label.appendChild(output); wrap.appendChild(label); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = { input: input, output: output };
    }); shell.appendChild(controls);
    var predict = element(doc, "div", "opl-predict"); predict.appendChild(element(doc, "strong", "", "先预测：快曲率分量会怎样？"));
    var choice = element(doc, "div", "opl-choice"), choiceButtons = [];
    [["converge", "不换号收敛"], ["oscillate", "换号但收敛"], ["diverge", "不收敛 / 发散"]].forEach(function (item) {
      var button = element(doc, "button", "", item[1]); button.type = "button"; button.addEventListener("click", function () { prediction = item[0]; renderPrediction(); }); choiceButtons.push({ value: item[0], node: button }); choice.appendChild(button);
    }); predict.appendChild(choice);
    var actions = element(doc, "div", "opl-actions"), check = element(doc, "button", "cl-primary", "核对预测"), reset = element(doc, "button", "", "重置本预设"); check.type = reset.type = "button";
    var feedback = element(doc, "p", "opl-feedback", "先选一个判断。"), results = element(doc, "div"); results.hidden = true;
    check.addEventListener("click", function () { if (!prediction) { feedback.textContent = "请先作出预测。"; feedback.className = "opl-feedback opl-warn"; return; } revealed = true; render(); });
    reset.addEventListener("click", function () { var preset = PRESETS.filter(function (p) { return p.id === state.id; })[0] || PRESETS[1]; state = copyPreset(preset); prediction = null; revealed = false; syncInputs(); render(); });
    actions.appendChild(check); actions.appendChild(reset); predict.appendChild(actions); predict.appendChild(feedback); shell.appendChild(predict); shell.appendChild(results); root.replaceChildren(shell);
    function syncInputs() { Object.keys(inputs).forEach(function (key) { inputs[key].input.value = String(state[key]); }); }
    function renderPrediction() { choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", prediction === item.value ? "true" : "false"); }); }
    function render() {
      syncInputs();
      inputs.kappa.output.textContent = format(state.kappa, 1); inputs.beta.output.textContent = format(state.beta, 2); inputs.rotation.output.textContent = state.rotation + "°"; inputs.angle.output.textContent = state.angle + "°"; inputs.steps.output.textContent = String(state.steps);
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.id === item.id ? "true" : "false"); }); renderPrediction();
      var data = simulate(state), f = data.factors;
      if (!revealed) { results.hidden = true; feedback.textContent = prediction ? "预测已记录，点击“核对预测”查看两本账。" : "先选一个判断。"; feedback.className = "opl-feedback"; return; }
      results.hidden = false; var correct = prediction === data.kind;
      feedback.textContent = (correct ? "预测命中。" : "再看两个乘子。") + " 1-αμ=" + format(f.slow, 3) + "，1-αL=" + format(f.fast, 3) + "，所以是“" + kindLabel(data.kind) + "”。";
      feedback.className = "opl-feedback " + (correct ? "opl-pass" : "opl-warn");
      if (api && api.announce) api.announce(root, feedback.textContent);
      results.replaceChildren();
      var metrics = element(doc, "div", "opl-metrics");
      metrics.appendChild(metric(doc, "α", format(f.alpha, 4))); metrics.appendChild(metric(doc, "稳定界 2/L", format(2 / f.L, 4))); metrics.appendChild(metric(doc, "谱半径 ρ", format(data.rho, 3))); metrics.appendChild(metric(doc, "最优 β*", format(optimumBeta(state.kappa), 3))); metrics.appendChild(metric(doc, "最优 ρ*", format(optimumRho(state.kappa), 3))); metrics.appendChild(metric(doc, "目标函数账", data.monotoneEnergy ? "逐步不增" : "出现上升")); results.appendChild(metrics);
      var charts = element(doc, "div", "opl-charts"), c1 = element(doc, "div", "opl-chart"), c2 = element(doc, "div", "opl-chart"); c1.appendChild(contourSvg(doc, state, data)); c2.appendChild(energySvg(doc, data)); charts.appendChild(c1); charts.appendChild(c2); results.appendChild(charts);
      var wrap = element(doc, "div", "opl-ledger"), table = element(doc, "table"); table.setAttribute("aria-label", "梯度下降迭代账本");
      var head = element(doc, "tr"); ["k", "x₁", "x₂", "快轴分量", "f/f₀", "‖∇f‖"].forEach(function (label) { var th = element(doc, "th", "", label); th.scope = "col"; head.appendChild(th); }); var thead = element(doc, "thead"); thead.appendChild(head); table.appendChild(thead); var body = element(doc, "tbody");
      var stride = Math.max(1, Math.ceil(data.rows.length / 9)); data.rows.forEach(function (row, i) { if (i % stride && i !== data.rows.length - 1) return; var tr = element(doc, "tr"); [row.k, format(row.x, 4), format(row.y, 4), format(row.fast, 4), format(row.relative, 4), format(row.gradNorm, 4)].forEach(function (v) { tr.appendChild(element(doc, "td", "", String(v))); }); body.appendChild(tr); }); table.appendChild(body); wrap.appendChild(table); results.appendChild(wrap);
      results.appendChild(element(doc, "p", "opl-note", "β>1 只说明快轴分量每步换号；对这个正定二次型，0<β<2 时目标值仍下降。β≥2 才触及稳定边界。"));
    }
    syncInputs(); render();
  }
  function selfTest() {
    var checks = 0; function assert(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    PRESETS.forEach(function (preset) { var result = simulate(preset); assert(result.kind === preset.expected, preset.id + " classification"); assert(result.rows.length === preset.steps + 1, preset.id + " row count"); });
    var one = simulate({ kappa: 1, beta: 1, rotation: 37, angle: 11, steps: 2 }); assert(one.rows[1].energy < EPS, "round quadratic reaches minimizer in one step");
    var optimal = optimumBeta(9); assert(nearly(optimal, 1.8), "optimal beta"); assert(nearly(optimumRho(9), .8), "optimal rho");
    var safe = simulate({ kappa: 7, beta: 1.9, rotation: 20, angle: 73, steps: 12 }); assert(safe.monotoneEnergy, "quadratic energy decreases below 2/L despite sign flips");
    var edge = factors({ kappa: 4, beta: 2 }); assert(nearly(Math.abs(edge.fast), 1), "stability boundary");
    return { checks: checks, presets: PRESETS.length };
  }
  var exported = { PRESETS: PRESETS, factors: factors, simulate: simulate, optimumBeta: optimumBeta, optimumRho: optimumRho, selfTest: selfTest };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") host.CourseLearning.register("optimization-landscape", mount);
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) {
    try { var report = selfTest(); console.log("optimization-landscape self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)"); }
    catch (error) { console.error("optimization-landscape self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null);
