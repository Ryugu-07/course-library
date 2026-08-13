(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "landau-free-energy-lab-styles";
  var EPS = 1e-8;
  var PRESETS = [
    { id: "single", label: "高温单井", t: 0.8, u: 1, v: 1, h: 0, expected: "single" },
    { id: "broken", label: "低温双井", t: -0.8, u: 1, v: 1, h: 0, expected: "broken" },
    { id: "critical", label: "连续临界", t: 0, u: 1, v: 1, h: 0, expected: "critical" },
    { id: "tilted", label: "外场倾斜", t: -0.8, u: 1, v: 1, h: 0.18, expected: "tilted" },
    { id: "coexist", label: "一级共存", t: 0.1875, u: -1, v: 1, h: 0, expected: "coexist" },
    { id: "spinodal", label: "非零 spinodal", t: 0.25, u: -1, v: 1, h: 0, expected: "spinodal" }
  ];

  var STYLE_TEXT = [
    ".lfe-lab{max-width:100%;min-width:0;color:var(--fg);}",
    ".lfe-lab [hidden]{display:none!important;}",
    ".lfe-lab .lfe-kicker,.lfe-lab .lfe-note{color:var(--fg-soft);font-size:13px;line-height:1.65;}",
    ".lfe-lab .lfe-presets,.lfe-lab .lfe-choice,.lfe-lab .lfe-actions{display:flex;flex-wrap:wrap;gap:8px;}",
    ".lfe-lab button{min-height:44px;}",
    ".lfe-lab .lfe-presets button{flex:1 1 132px;}",
    ".lfe-lab .lfe-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0;}",
    ".lfe-lab .lfe-control{display:grid;gap:4px;min-width:0;}",
    ".lfe-lab .lfe-control label{font-size:12.5px;font-weight:700;color:var(--fg-soft);}",
    ".lfe-lab .lfe-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".lfe-lab .lfe-predict{margin:12px 0;padding:12px 14px;border-left:3px solid var(--cl-gold);background:var(--bg);}",
    ".lfe-lab .lfe-predict strong{display:block;margin-bottom:8px;font-size:13px;}",
    ".lfe-lab .lfe-choice button{flex:1 1 145px;}",
    ".lfe-lab .lfe-feedback{min-height:1.7em;margin:9px 0 0;font-size:13px;font-weight:700;line-height:1.7;}",
    ".lfe-lab .lfe-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(230px,.65fr);gap:14px;align-items:start;margin-top:16px;}",
    ".lfe-lab svg{display:block;width:100%;height:auto;background:var(--bg);border:1px solid var(--border);border-radius:7px;}",
    ".lfe-lab svg text{fill:var(--fg);font-family:inherit;letter-spacing:0;}",
    ".lfe-lab .lfe-axis{stroke:var(--border);stroke-width:1.2;}.lfe-lab .lfe-gridline{stroke:var(--border);stroke-width:1;stroke-opacity:.45;}",
    ".lfe-lab .lfe-curve{fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}",
    ".lfe-lab .lfe-global{fill:var(--cl-green);stroke:var(--bg);stroke-width:2;}.lfe-lab .lfe-meta{fill:var(--cl-gold);stroke:var(--bg);stroke-width:2;}.lfe-lab .lfe-unstable{fill:var(--cl-red);stroke:var(--bg);stroke-width:2;}.lfe-lab .lfe-marginal{fill:var(--fg-soft);stroke:var(--bg);stroke-width:2;}",
    ".lfe-lab .lfe-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}",
    ".lfe-lab .lfe-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".lfe-lab .lfe-metric span{display:block;color:var(--fg-soft);font-size:11.5px;}.lfe-lab .lfe-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".lfe-lab .lfe-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px;}",
    ".lfe-lab table{width:100%;min-width:650px;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums;}",
    ".lfe-lab th,.lfe-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;}.lfe-lab th{color:var(--fg-soft);font-size:11.5px;}",
    ".lfe-lab .lfe-pass{color:var(--cl-green);}.lfe-lab .lfe-warn{color:var(--cl-red);}",
    ".lfe-lab button:focus-visible,.lfe-lab input:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px;}",
    "@media(max-width:820px){.lfe-lab .lfe-controls{grid-template-columns:repeat(2,minmax(0,1fr));}.lfe-lab .lfe-grid{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:480px){.lfe-lab .lfe-controls{grid-template-columns:minmax(0,1fr);}}"
  ].join("\n");

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function freeEnergy(m, p) { return p.t * m * m / 2 + p.u * Math.pow(m, 4) / 4 + p.v * Math.pow(m, 6) / 6 - p.h * m; }
  function derivative(m, p) { return p.t * m + p.u * Math.pow(m, 3) + p.v * Math.pow(m, 5) - p.h; }
  function curvature(m, p) { return p.t + 3 * p.u * m * m + 5 * p.v * Math.pow(m, 4); }
  function copyPreset(p) { return { id: p.id, label: p.label, t: p.t, u: p.u, v: p.v, h: p.h, expected: p.expected }; }
  function nearly(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || 1e-6); }

  function bisect(left, right, p) {
    var a = left, b = right, fa = derivative(a, p);
    for (var i = 0; i < 90; i += 1) {
      var middle = (a + b) / 2, fm = derivative(middle, p);
      if (Math.abs(fm) < 1e-11) return middle;
      if (fa * fm <= 0) b = middle;
      else { a = middle; fa = fm; }
    }
    return (a + b) / 2;
  }

  function addRoot(roots, value, p) {
    if (!Number.isFinite(value) || Math.abs(derivative(value, p)) > 2e-5) return;
    if (!roots.some(function (root) { return Math.abs(root - value) < 2e-5; })) roots.push(value);
  }

  function findRoots(p) {
    var span = 3.2, steps = 5000, roots = [];
    if (Math.abs(p.h) <= EPS) {
      roots.push(0);
      var discriminant = p.u * p.u - 4 * p.v * p.t;
      if (discriminant >= -EPS) {
        var root = Math.sqrt(Math.max(0, discriminant));
        [(-p.u - root) / (2 * p.v), (-p.u + root) / (2 * p.v)].forEach(function (y) {
          if (y > EPS) {
            addRoot(roots, -Math.sqrt(y), p);
            addRoot(roots, Math.sqrt(y), p);
          }
        });
      }
      return roots.sort(function (a, b) { return a - b; });
    }
    var cuts = [-span, span];
    var criticalDiscriminant = 9 * p.u * p.u - 20 * p.v * p.t;
    if (criticalDiscriminant >= -EPS) {
      var criticalRoot = Math.sqrt(Math.max(0, criticalDiscriminant));
      [(-3 * p.u - criticalRoot) / (10 * p.v), (-3 * p.u + criticalRoot) / (10 * p.v)].forEach(function (y) {
        if (y > EPS) {
          var m = Math.sqrt(y);
          if (m < span) cuts.push(-m, m);
        }
      });
    }
    cuts.sort(function (a, b) { return a - b; });
    cuts = cuts.filter(function (value, index) { return index === 0 || Math.abs(value - cuts[index - 1]) > 1e-8; });
    cuts.forEach(function (value) {
      if (Math.abs(derivative(value, p)) < 2e-7) addRoot(roots, value, p);
    });
    for (var interval = 1; interval < cuts.length; interval += 1) {
      var left = cuts[interval - 1], right = cuts[interval];
      if (derivative(left, p) * derivative(right, p) < 0) addRoot(roots, bisect(left, right, p), p);
    }
    return roots.sort(function (a, b) { return a - b; });
  }

  function classifyPoints(p) {
    var roots = findRoots(p);
    var candidates = roots.map(function (m) { return { m: m, f: freeEnergy(m, p), curvature: curvature(m, p) }; });
    var minimum = Infinity;
    candidates.forEach(function (point) { if (point.curvature >= -2e-5) minimum = Math.min(minimum, point.f); });
    candidates.forEach(function (point) {
      point.global = point.curvature >= -2e-5 && Math.abs(point.f - minimum) < 2e-5;
      if (point.curvature < -2e-5) point.kind = "unstable";
      else if (Math.abs(point.curvature) <= 2e-5) point.kind = "marginal";
      else if (point.global) point.kind = "global";
      else point.kind = "metastable";
    });
    return candidates;
  }

  function phaseLabel(p, points) {
    var globals = points.filter(function (point) { return point.global; });
    if (p.u < 0 && Math.abs(p.h) < EPS) {
      var coexist = 3 * p.u * p.u / (16 * p.v), spinodal = p.u * p.u / (4 * p.v);
      if (nearly(p.t, coexist, 2e-4)) return "一级共存";
      if (nearly(p.t, spinodal, 2e-4)) return "非零分支 spinodal";
      if (nearly(p.t, 0, 2e-4)) return "m=0 spinodal";
    }
    if (Math.abs(p.h) > EPS) return "外场倾斜";
    if (Math.abs(p.t) < 2e-5 && p.u > 0) return "连续临界";
    if (globals.length >= 2 && globals.some(function (q) { return Math.abs(q.m) > 1e-3; })) return "对称破缺";
    return "对称单相";
  }

  function expectedChoice(p, points) {
    var label = phaseLabel(p, points);
    if (label === "一级共存") return "coexist";
    if (label.indexOf("spinodal") !== -1) return "spinodal";
    if (label === "连续临界") return "critical";
    if (label === "外场倾斜") return "tilted";
    if (label === "对称破缺") return "broken";
    return "single";
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return "-";
    if (Math.abs(value) < 5e-9) return "0";
    return value.toFixed(digits === undefined ? 3 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, className, text) { var node = doc.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function svgNode(doc, tag, attrs, text) { var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); }); if (text !== undefined) node.textContent = text; return node; }
  function installStyles(doc) { if (doc.getElementById(STYLE_ID)) return; var style = element(doc, "style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; doc.head.appendChild(style); }

  function curveSvg(doc, p, points) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 620 390", role: "img", "aria-label": "Landau 自由能及驻点分类" });
    svg.appendChild(svgNode(doc, "title", {}, "Landau 自由能地形"));
    var rootSpan = points.reduce(function (maximum, point) { return Math.max(maximum, Math.abs(point.m)); }, 0);
    var span = clamp(rootSpan + 0.55, 1.25, 2.1), samples = [], minF = Infinity, maxF = -Infinity;
    for (var i = 0; i <= 260; i += 1) { var m = -span + 2 * span * i / 260, f = freeEnergy(m, p); samples.push({ m: m, f: f }); minF = Math.min(minF, f); maxF = Math.max(maxF, f); }
    var pad = Math.max(0.25, (maxF - minF) * 0.08); minF -= pad; maxF += pad;
    var mapX = function (m) { return 55 + (m + span) / (2 * span) * 525; };
    var mapY = function (f) { return 335 - (f - minF) / (maxF - minF) * 280; };
    [0, .5, 1].forEach(function (fraction) { var y = 335 - fraction * 280; svg.appendChild(svgNode(doc, "line", { x1: 55, y1: y, x2: 580, y2: y, class: "lfe-gridline" })); svg.appendChild(svgNode(doc, "text", { x: 48, y: y + 4, "font-size": 10, "text-anchor": "end" }, formatNumber(minF + fraction * (maxF - minF), 2))); });
    var zeroX = mapX(0); svg.appendChild(svgNode(doc, "line", { x1: zeroX, y1: 55, x2: zeroX, y2: 335, class: "lfe-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: 55, y1: 335, x2: 580, y2: 335, class: "lfe-axis" }));
    var d = samples.map(function (q, index) { return (index ? "L" : "M") + mapX(q.m) + " " + mapY(q.f); }).join(" ");
    svg.appendChild(svgNode(doc, "path", { d: d, class: "lfe-curve" }));
    points.forEach(function (point) { svg.appendChild(svgNode(doc, "circle", { cx: mapX(point.m), cy: mapY(point.f), r: 6, class: point.kind === "global" ? "lfe-global" : point.kind === "metastable" ? "lfe-meta" : point.kind === "unstable" ? "lfe-unstable" : "lfe-marginal" })); });
    svg.appendChild(svgNode(doc, "text", { x: 55, y: 28, "font-size": 14, "font-weight": 700 }, "f(m) 地形：绿=全局，金=亚稳，红=不稳，灰=边界"));
    svg.appendChild(svgNode(doc, "text", { x: 580, y: 357, "font-size": 11, "text-anchor": "end" }, "序参量 m"));
    svg.appendChild(svgNode(doc, "text", { x: 58, y: 49, "font-size": 11 }, "f"));
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument; installStyles(doc); var state = copyPreset(PRESETS[0]); var prediction = null; var revealed = false;
    var shell = element(doc, "div", "lfe-lab"); shell.appendChild(element(doc, "p", "lfe-kicker", "调节 t、u、v、h，观察“出现局部极小”“两相等深”和“局部极小消失”为什么是三件事。"));
    var presetRow = element(doc, "div", "lfe-presets"), presetButtons = [];
    PRESETS.forEach(function (preset) { var button = element(doc, "button", "", preset.label); button.type = "button"; button.addEventListener("click", function () { state = copyPreset(preset); prediction = null; revealed = false; render(); }); presetButtons.push({ id: preset.id, node: button }); presetRow.appendChild(button); }); shell.appendChild(presetRow);
    var controls = element(doc, "div", "lfe-controls"), inputs = {};
    [["t", -1.2, .8, .0125], ["u", -1.5, 1.5, .05], ["v", .5, 2, .05], ["h", -.4, .4, .01]].forEach(function (spec) {
      var box = element(doc, "div", "lfe-control"), label = element(doc, "label", "", spec[0] + " = "), output = element(doc, "output"); label.appendChild(output);
      var input = element(doc, "input"); input.type = "range"; input.min = String(spec[1]); input.max = String(spec[2]); input.step = String(spec[3]); input.setAttribute("aria-label", "Landau 参数 " + spec[0]);
      input.addEventListener("input", function () { state[spec[0]] = Number(input.value); state.id = "custom"; prediction = null; revealed = false; render(); });
      box.appendChild(label); box.appendChild(input); controls.appendChild(box); inputs[spec[0]] = { input: input, output: output };
    }); shell.appendChild(controls);
    var predict = element(doc, "div", "lfe-predict"); predict.appendChild(element(doc, "strong", "", "先预测当前地形身份"));
    var choice = element(doc, "div", "lfe-choice"), choices = [];
    [["single", "单相单井"], ["broken", "连续双井"], ["critical", "连续临界"], ["tilted", "倾斜/亚稳"], ["coexist", "一级共存"], ["spinodal", "spinodal"]].forEach(function (item) { var button = element(doc, "button", "", item[1]); button.type = "button"; button.addEventListener("click", function () { prediction = item[0]; renderPrediction(); }); choices.push({ value: item[0], node: button }); choice.appendChild(button); }); predict.appendChild(choice);
    var actions = element(doc, "div", "lfe-actions"), check = element(doc, "button", "cl-primary", "核对预测"), reset = element(doc, "button", "", "重置本预设"), feedback = element(doc, "p", "lfe-feedback", "先选择一种地形身份。 "); check.type = reset.type = "button";
    check.addEventListener("click", function () { var points = classifyPoints(state), expected = expectedChoice(state, points); if (prediction === null) { feedback.textContent = "请先作出预测。"; feedback.className = "lfe-feedback lfe-warn"; return; } var good = prediction === expected; revealed = true; render(); feedback.textContent = (good ? "预测命中。" : "再看驻点与等深条件。") + " 当前判定：" + phaseLabel(state, points) + "。"; feedback.className = "lfe-feedback " + (good ? "lfe-pass" : "lfe-warn"); if (api && api.announce) api.announce(root, feedback.textContent); });
    reset.addEventListener("click", function () { var p = PRESETS.filter(function (q) { return q.id === state.id; })[0] || PRESETS[0]; state = copyPreset(p); prediction = null; revealed = false; render(); });
    actions.appendChild(check); actions.appendChild(reset); predict.appendChild(actions); predict.appendChild(feedback); shell.appendChild(predict);
    var grid = element(doc, "div", "lfe-grid"), chart = element(doc, "div"), metrics = element(doc, "div", "lfe-metrics"); grid.appendChild(chart); grid.appendChild(metrics); shell.appendChild(grid);
    var ledgerWrap = element(doc, "div", "lfe-ledger-wrap"), table = element(doc, "table"); ledgerWrap.appendChild(table); shell.appendChild(ledgerWrap); shell.appendChild(element(doc, "p", "lfe-note", "扫描器只解这个无量纲多项式。有限系统、涨落、界面动力学和真实材料参数不由它自动给出。")); root.replaceChildren(shell);
    function renderPrediction() { choices.forEach(function (item) { item.node.setAttribute("aria-pressed", prediction === item.value ? "true" : "false"); }); if (!revealed) { feedback.textContent = prediction === null ? "先选择一种地形身份。" : "预测已记录，点击“核对预测”查看身份。"; feedback.className = "lfe-feedback"; } }
    function metric(labelText, value) { var box = element(doc, "div", "lfe-metric"); box.appendChild(element(doc, "span", "", labelText)); box.appendChild(element(doc, "strong", "", value)); return box; }
    function render() {
      Object.keys(inputs).forEach(function (key) { inputs[key].input.value = String(state[key]); inputs[key].output.textContent = formatNumber(state[key], 4); }); presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.id === item.id ? "true" : "false"); }); renderPrediction();
      var points = classifyPoints(state), minima = points.filter(function (q) { return q.kind === "global" || q.kind === "metastable" || (q.kind === "marginal" && q.global); }), globals = points.filter(function (q) { return q.global; });
      chart.replaceChildren(curveSvg(doc, state, points)); metrics.replaceChildren(metric("地形身份", phaseLabel(state, points)), metric("局部极小数", String(minima.length)), metric("全局平衡 m", globals.length ? globals.map(function (q) { return formatNumber(q.m, 3); }).join(", ") : "边界"), metric("共存 t", state.u < 0 ? formatNumber(3 * state.u * state.u / (16 * state.v), 4) : "不适用"));
      var rows = points.map(function (q) { var label = q.kind === "global" ? "全局平衡" : q.kind === "metastable" ? "亚稳" : q.kind === "unstable" ? "不稳定" : q.global ? "平坦全局平衡" : "边界"; return "<tr><td>" + formatNumber(q.m, 5) + "</td><td>" + formatNumber(q.f, 5) + "</td><td>" + formatNumber(q.curvature, 5) + "</td><td>" + label + "</td></tr>"; }).join("");
      table.innerHTML = "<caption>驻点账本</caption><thead><tr><th>m</th><th>f(m)</th><th>f''(m)</th><th>身份</th></tr></thead><tbody>" + rows + "</tbody>";
      grid.hidden = !revealed;
      ledgerWrap.hidden = !revealed;
    }
    render();
  }

  function selfTest() {
    var checks = 0; function assert(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    PRESETS.forEach(function (p) { var points = classifyPoints(p); assert(points.length >= 1, p.id + " roots"); assert(expectedChoice(p, points) === p.expected, p.id + " classification"); points.forEach(function (point) { assert(Math.abs(derivative(point.m, p)) < 3e-5, p.id + " stationary residual"); }); });
    var u = -1.2, v = .8, tc = 3 * u * u / (16 * v), mc2 = -3 * u / (4 * v), p = { t: tc, u: u, v: v, h: 0 };
    assert(nearly(freeEnergy(0, p), freeEnergy(Math.sqrt(mc2), p), 1e-9), "coexistence equal depth");
    assert(nearly(derivative(Math.sqrt(mc2), p), 0, 1e-9), "coexistence stationary");
    var spinodal = { t: u * u / (4 * v), u: u, v: v, h: 0 }, ms2 = -u / (2 * v);
    assert(nearly(derivative(Math.sqrt(ms2), spinodal), 0, 1e-8), "spinodal derivative"); assert(nearly(curvature(Math.sqrt(ms2), spinodal), 0, 1e-8), "spinodal curvature");
    var tiltedM = 0.7, tiltedT = -3 * (-1) * tiltedM * tiltedM - 5 * Math.pow(tiltedM, 4), tiltedH = tiltedT * tiltedM - Math.pow(tiltedM, 3) + Math.pow(tiltedM, 5);
    var tiltedSpinodal = { t: tiltedT, u: -1, v: 1, h: tiltedH };
    assert(findRoots(tiltedSpinodal).some(function (root) { return nearly(root, tiltedM, 1e-7); }), "tilted spinodal double root");
    var quarticLike = { t: -1e-4, u: 1, v: 0.5, h: 0 }, roots = classifyPoints(quarticLike), positive = roots.filter(function (q) { return q.kind === "global" && q.m > 0; })[0];
    assert(positive && nearly(positive.m / Math.sqrt(1e-4), 1, .001), "beta one-half asymptotic");
    assert(PRESETS.length >= 5, "preset count"); return { checks: checks, presets: PRESETS.length };
  }

  var exported = { PRESETS: PRESETS, freeEnergy: freeEnergy, derivative: derivative, curvature: curvature, findRoots: findRoots, classifyPoints: classifyPoints, phaseLabel: phaseLabel, selfTest: selfTest };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") host.CourseLearning.register("landau-free-energy", mount);
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) { try { var result = selfTest(); console.log("landau-free-energy self-test: PASS (" + result.checks + " checks, " + result.presets + " presets)"); } catch (error) { console.error("landau-free-energy self-test: FAIL\n" + error.stack); process.exitCode = 1; } }
})(typeof window !== "undefined" ? window : null);
