(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("zero-sum-dynamic", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("zero-sum-dynamic self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("zero-sum-dynamic self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-zero-sum-dynamic-lab-styles";
  var INSTANCE = 0;
  var STAGE_PRESETS = [
    { id: "pennies", label: "Matching pennies：纯策略无鞍点", matrix: [[1, -1], [-1, 1]] },
    { id: "mixed", label: "一般混合：值不在格点", matrix: [[3, 0], [1, 2]] },
    { id: "saddle", label: "纯鞍点：混合退化", matrix: [[3, 0], [5, 1]] }
  ];
  var DYNAMICS = [
    [
      [{ reward: 1, next: [0.90, 0.10] }, { reward: -1, next: [0.20, 0.80] }],
      [{ reward: -1, next: [0.25, 0.75] }, { reward: 1, next: [0.75, 0.25] }]
    ],
    [
      [{ reward: 2, next: [0.70, 0.30] }, { reward: 0, next: [0.15, 0.85] }],
      [{ reward: 0, next: [0.35, 0.65] }, { reward: 2, next: [0.80, 0.20] }]
    ]
  ];
  var DEFAULTS = { preset: "pennies", gamma: 0.8, iterations: 24, samples: 240, initial: 0, seed: 20260722 };
  var STYLE_TEXT = [
    ".zero-sum-dynamic-lab{--zsd-blue:var(--cl-blue,#315f9d);--zsd-gold:var(--cl-gold,#9b6a12);--zsd-green:var(--cl-green,#39734d);--zsd-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".zero-sum-dynamic-lab *{box-sizing:border-box}.zero-sum-dynamic-lab [hidden]{display:none!important}.zero-sum-dynamic-lab h3,.zero-sum-dynamic-lab h4{margin:0 0 8px;line-height:1.35}.zero-sum-dynamic-lab p{margin:8px 0}.zero-sum-dynamic-lab button,.zero-sum-dynamic-lab input,.zero-sum-dynamic-lab select{font:inherit}.zero-sum-dynamic-lab button,.zero-sum-dynamic-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.zero-sum-dynamic-lab button{padding:8px 12px;cursor:pointer}.zero-sum-dynamic-lab button:hover,.zero-sum-dynamic-lab select:hover{border-color:var(--accent)}.zero-sum-dynamic-lab button[aria-pressed='true'],.zero-sum-dynamic-lab .zsd-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.zero-sum-dynamic-lab button:focus-visible,.zero-sum-dynamic-lab select:focus-visible,.zero-sum-dynamic-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".zero-sum-dynamic-lab .zsd-note,.zero-sum-dynamic-lab .zsd-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.zero-sum-dynamic-lab .zsd-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.zero-sum-dynamic-lab .zsd-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0;padding:12px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border)}.zero-sum-dynamic-lab .zsd-control{display:grid;gap:5px;min-width:0}.zero-sum-dynamic-lab .zsd-control label{color:var(--fg-soft);font-size:12.5px;font-weight:750}.zero-sum-dynamic-lab .zsd-control output{color:var(--accent);font-variant-numeric:tabular-nums}.zero-sum-dynamic-lab input[type='range']{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".zero-sum-dynamic-lab .zsd-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--zsd-gold);background:var(--bg)}.zero-sum-dynamic-lab .zsd-predict strong{display:block;margin-bottom:8px}.zero-sum-dynamic-lab .zsd-question-list{display:grid;gap:10px}.zero-sum-dynamic-lab .zsd-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.zero-sum-dynamic-lab .zsd-question legend{padding:0 4px;color:var(--fg-soft);font-size:12.5px;font-weight:750;line-height:1.5}.zero-sum-dynamic-lab .zsd-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.zero-sum-dynamic-lab .zsd-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.zero-sum-dynamic-lab .zsd-actions>*{flex:1 1 170px}.zero-sum-dynamic-lab .zsd-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.zero-sum-dynamic-lab .zsd-pass{color:var(--zsd-green)}.zero-sum-dynamic-lab .zsd-warn{color:var(--zsd-red)}",
    ".zero-sum-dynamic-lab .zsd-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.zero-sum-dynamic-lab .zsd-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}.zero-sum-dynamic-lab .zsd-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.zero-sum-dynamic-lab .zsd-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.zero-sum-dynamic-lab .zsd-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.zero-sum-dynamic-lab .zsd-layout{display:grid;grid-template-columns:minmax(230px,.75fr) minmax(0,1.25fr);gap:14px;align-items:start}.zero-sum-dynamic-lab .zsd-panel{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.zero-sum-dynamic-lab .zsd-panel h4{font-size:13px;color:var(--fg-soft)}.zero-sum-dynamic-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.zero-sum-dynamic-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.zero-sum-dynamic-lab .zsd-grid{stroke:currentColor;stroke-opacity:.15;stroke-width:1}.zero-sum-dynamic-lab .zsd-axis{stroke:currentColor;stroke-opacity:.65;stroke-width:1.2}.zero-sum-dynamic-lab .zsd-line-a{fill:none;stroke:var(--zsd-blue);stroke-width:3}.zero-sum-dynamic-lab .zsd-line-b{fill:none;stroke:var(--zsd-gold);stroke-width:3}.zero-sum-dynamic-lab .zsd-line-r{fill:none;stroke:var(--zsd-red);stroke-width:2;stroke-dasharray:6 4}.zero-sum-dynamic-lab .zsd-cell{fill:var(--bg);stroke:var(--border);stroke-width:1}.zero-sum-dynamic-lab .zsd-cell-good{fill:color-mix(in srgb,var(--zsd-green) 20%,var(--bg));stroke:var(--zsd-green);stroke-width:2}.zero-sum-dynamic-lab .zsd-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:7px 2px 0;color:var(--fg-soft);font-size:12px}.zero-sum-dynamic-lab .zsd-swatch{display:inline-block;width:24px;height:0;margin-right:5px;border-top:3px solid currentColor;vertical-align:middle}.zero-sum-dynamic-lab .zsd-dash{border-top-style:dashed}",
    ".zero-sum-dynamic-lab .zsd-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px}.zero-sum-dynamic-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.zero-sum-dynamic-lab th,.zero-sum-dynamic-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.zero-sum-dynamic-lab th{color:var(--fg-soft);font-size:11.5px}.zero-sum-dynamic-lab td:not(:first-child){text-align:right}.zero-sum-dynamic-lab .zsd-boundary{margin-top:12px;padding:10px 12px;border-left:3px solid var(--zsd-red);background:var(--bg);color:var(--fg-soft);font-size:13px;line-height:1.7}",
    "@media(max-width:900px){.zero-sum-dynamic-lab .zsd-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.zero-sum-dynamic-lab .zsd-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){.zero-sum-dynamic-lab .zsd-presets,.zero-sum-dynamic-lab .zsd-controls{grid-template-columns:minmax(0,1fr)}.zero-sum-dynamic-lab .zsd-options{grid-template-columns:minmax(0,1fr)}.zero-sum-dynamic-lab .zsd-panel{padding:5px}}@media(prefers-reduced-motion:reduce){.zero-sum-dynamic-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("");

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function copyMatrix(matrix) { return matrix.map(function (row) { return row.slice(); }); }
  function presetById(id) {
    for (var i = 0; i < STAGE_PRESETS.length; i += 1) if (STAGE_PRESETS[i].id === id) return STAGE_PRESETS[i];
    return STAGE_PRESETS[0];
  }

  function matrixValue(matrix) {
    var a = matrix[0][0];
    var b = matrix[0][1];
    var c = matrix[1][0];
    var d = matrix[1][1];
    var denominator = a - b - c + d;
    var rowSecurity = Math.max(Math.min(a, b), Math.min(c, d));
    var columnSecurity = Math.min(Math.max(a, c), Math.max(b, d));
    if (Math.abs(denominator) > 1e-12) {
      var p = (d - c) / denominator;
      var q = (d - b) / denominator;
      if (p >= -1e-12 && p <= 1 + 1e-12 && q >= -1e-12 && q <= 1 + 1e-12) {
        p = clamp(p, 0, 1);
        q = clamp(q, 0, 1);
        return {
          value: (a * d - b * c) / denominator,
          rowProbability: p,
          columnProbability: q,
          mixed: p > 1e-10 && p < 1 - 1e-10 && q > 1e-10 && q < 1 - 1e-10,
          rowSecurity: rowSecurity,
          columnSecurity: columnSecurity,
          pure: false
        };
      }
    }
    for (var row = 0; row < 2; row += 1) {
      for (var column = 0; column < 2; column += 1) {
        var rowMinimum = Math.min(matrix[row][0], matrix[row][1]);
        var columnMaximum = Math.max(matrix[0][column], matrix[1][column]);
        if (Math.abs(matrix[row][column] - rowMinimum) < 1e-10 && Math.abs(matrix[row][column] - columnMaximum) < 1e-10) {
          return {
            value: matrix[row][column],
            rowProbability: row === 0 ? 1 : 0,
            columnProbability: column === 0 ? 1 : 0,
            mixed: false,
            rowSecurity: rowSecurity,
            columnSecurity: columnSecurity,
            pure: true
          };
        }
      }
    }
    throw new Error("2x2 zero-sum matrix has no resolved value");
  }

  function dynamicMatrix(state, values, gamma) {
    return DYNAMICS[state].map(function (row) {
      return row.map(function (cell) {
        return cell.reward + gamma * (cell.next[0] * values[0] + cell.next[1] * values[1]);
      });
    });
  }

  function shapley(values, gamma) {
    var matrices = [dynamicMatrix(0, values, gamma), dynamicMatrix(1, values, gamma)];
    var stateValues = matrices.map(matrixValue);
    return { values: stateValues.map(function (item) { return item.value; }), matrices: matrices, certificates: stateValues };
  }

  function normInf(left, right) {
    return Math.max(Math.abs(left[0] - right[0]), Math.abs(left[1] - right[1]));
  }

  function copyConfig(input) {
    var source = input || {};
    var preset = presetById(source.preset || DEFAULTS.preset);
    var gamma = Number(source.gamma === undefined ? DEFAULTS.gamma : source.gamma);
    var iterations = Number(source.iterations === undefined ? DEFAULTS.iterations : source.iterations);
    var samples = Number(source.samples === undefined ? DEFAULTS.samples : source.samples);
    var initial = Number(source.initial === undefined ? DEFAULTS.initial : source.initial);
    var seed = Number(source.seed === undefined ? DEFAULTS.seed : source.seed);
    if (![gamma, iterations, samples, initial, seed].every(finite)) {
      throw new RangeError("dynamic-game parameters must be finite");
    }
    return {
      preset: preset.id,
      gamma: clamp(gamma, 0, 1),
      iterations: Math.round(clamp(iterations, 4, 60)),
      samples: Math.round(clamp(samples, 20, 1000)),
      initial: clamp(initial, -10, 10),
      seed: seed >>> 0
    };
  }

  function makeRng(seed) {
    var state = (Number(seed) >>> 0) || 1;
    return function () {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function sampleMatrix(matrix, p, q, samples, seed) {
    var rng = makeRng(seed);
    var total = 0;
    for (var i = 0; i < samples; i += 1) {
      var row = rng() < p ? 0 : 1;
      var column = rng() < q ? 0 : 1;
      total += matrix[row][column];
    }
    return total / samples;
  }

  function iterate(input) {
    var config = copyConfig(input);
    var values = [config.initial, config.initial];
    var rows = [];
    for (var step = 0; step <= config.iterations; step += 1) {
      var update = shapley(values, config.gamma);
      var residual = normInf(update.values, values);
      rows.push({ step: step, values: values.slice(), next: update.values.slice(), residual: residual, bound: config.gamma < 1 ? residual / (1 - config.gamma) : null, certificates: update.certificates, matrices: update.matrices });
      values = update.values;
    }
    var last = rows[rows.length - 1];
    var stage = matrixValue(presetById(config.preset).matrix);
    var sampled = [
      sampleMatrix(last.matrices[0], last.certificates[0].rowProbability, last.certificates[0].columnProbability, config.samples, config.seed + 11),
      sampleMatrix(last.matrices[1], last.certificates[1].rowProbability, last.certificates[1].columnProbability, config.samples, config.seed + 29)
    ];
    return { config: config, rows: rows, last: last, stage: stage, sampled: sampled, contractive: config.gamma < 1, stageMatrix: copyMatrix(presetById(config.preset).matrix) };
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.0001)) return value.toExponential(2);
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function htmlNode(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function pathData(values, xMap, yMap) {
    return values.map(function (value, index) { return (index ? "L" : "M") + xMap(index, values.length).toFixed(2) + " " + yMap(value).toFixed(2); }).join(" ");
  }

  function installStyles(doc) {
    doc = doc || (host && host.document);
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    var box = htmlNode(doc, "div", "zsd-metric"); box.appendChild(htmlNode(doc, "span", "", label)); box.appendChild(htmlNode(doc, "strong", "", value)); return box;
  }

  function makeControl(doc, label, key, min, max, step, value) {
    var wrapper = htmlNode(doc, "div", "zsd-control");
    var labelNode = htmlNode(doc, "label", "", label);
    var output = htmlNode(doc, "output", "", "");
    var input = doc.createElement("input");
    labelNode.appendChild(output);
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.setAttribute("data-key", key);
    input.setAttribute("aria-label", label);
    wrapper.appendChild(labelNode);
    wrapper.appendChild(input);
    return { node: wrapper, input: input, output: output };
  }

  function drawStageMatrix(doc, data) {
    var width = 330;
    var height = 300;
    var svg = svgNode(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "阶段零和收益矩阵与混合概率" });
    svg.appendChild(svgNode(doc, "title", {}, "阶段矩阵 minimax"));
    svg.appendChild(svgNode(doc, "desc", {}, "行玩家概率 p 和列玩家概率 q，以及四个阶段收益格"));
    var matrix = data.stageMatrix;
    var left = 82;
    var top = 70;
    var cell = 86;
    svg.appendChild(svgNode(doc, "text", { x: left + cell, y: 26, "text-anchor": "middle", "font-size": 13, "font-weight": 700 }, "列玩家"));
    svg.appendChild(svgNode(doc, "text", { x: 20, y: top + cell, "font-size": 13, "font-weight": 700 }, "行"));
    ["C0", "C1"].forEach(function (label, index) { svg.appendChild(svgNode(doc, "text", { x: left + cell * index + cell / 2, y: top - 10, "text-anchor": "middle", "font-size": 12 }, label)); });
    ["R0", "R1"].forEach(function (label, index) { svg.appendChild(svgNode(doc, "text", { x: left - 12, y: top + cell * index + cell / 2 + 4, "text-anchor": "end", "font-size": 12 }, label)); });
    for (var row = 0; row < 2; row += 1) {
      for (var column = 0; column < 2; column += 1) {
        var isSaddle = data.stage.pure && Math.abs(matrix[row][column] - data.stage.value) < 1e-10;
        var rect = svgNode(doc, "rect", { x: left + column * cell, y: top + row * cell, width: cell - 4, height: cell - 4, class: isSaddle ? "zsd-cell-good" : "zsd-cell" });
        svg.appendChild(rect);
        svg.appendChild(svgNode(doc, "text", { x: left + column * cell + cell / 2 - 2, y: top + row * cell + cell / 2 + 5, "text-anchor": "middle", "font-size": 16, "font-weight": 700 }, format(matrix[row][column], 2)));
      }
    }
    svg.appendChild(svgNode(doc, "text", { x: 22, y: 250, "font-size": 12 }, "stage value v=" + format(data.stage.value, 3)));
    svg.appendChild(svgNode(doc, "text", { x: 22, y: 270, "font-size": 12 }, "p(R0)=" + format(data.stage.rowProbability, 3) + " · q(C0)=" + format(data.stage.columnProbability, 3)));
    svg.appendChild(svgNode(doc, "text", { x: 22, y: 290, "font-size": 11 }, data.stage.mixed ? "内点混合：让对手无差异" : "纯鞍点/退化混合"));
    return svg;
  }

  function drawIterationChart(doc, data) {
    var width = 680;
    var height = 300;
    var left = 48;
    var right = 662;
    var top = 24;
    var bottom = 246;
    var values = data.rows.reduce(function (all, row) { return all.concat(row.values); }, []);
    var min = Math.min.apply(Math, values);
    var max = Math.max.apply(Math, values);
    if (max - min < 1) { min -= 0.5; max += 0.5; }
    var yMap = function (value) { return top + (max - value) / (max - min) * (bottom - top); };
    var xMap = function (index, count) { return left + index / Math.max(1, count - 1) * (right - left); };
    var svg = svgNode(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "Shapley 价值迭代轨迹" });
    svg.appendChild(svgNode(doc, "title", {}, "Shapley 价值迭代"));
    svg.appendChild(svgNode(doc, "desc", {}, "两个状态的价值和有限迭代残差"));
    for (var tick = 0; tick <= 4; tick += 1) {
      var y = top + tick / 4 * (bottom - top);
      svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: y, y2: y, class: "zsd-grid" }));
    }
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, class: "zsd-axis" }));
    svg.appendChild(svgNode(doc, "path", { d: pathData(data.rows.map(function (row) { return row.values[0]; }), xMap, yMap), class: "zsd-line-a" }));
    svg.appendChild(svgNode(doc, "path", { d: pathData(data.rows.map(function (row) { return row.values[1]; }), xMap, yMap), class: "zsd-line-b" }));
    if (data.rows.some(function (row) { return row.bound !== null; })) {
      var residualMax = Math.max.apply(Math, data.rows.map(function (row) { return row.residual; }).concat([1e-9]));
      var residualPath = data.rows.map(function (row) { return min + (row.residual / residualMax) * (max - min) * 0.35; });
      svg.appendChild(svgNode(doc, "path", { d: pathData(residualPath, xMap, yMap), class: "zsd-line-r" }));
    }
    svg.appendChild(svgNode(doc, "text", { x: left, y: 15, "font-size": 12, "font-weight": 700 }, "价值迭代 · k=0…" + data.config.iterations));
    svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 24, "font-size": 10, "text-anchor": "end" }, "k"));
    return svg;
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var uid = "zero-sum-dynamic-" + INSTANCE;
    var state = copyConfig(DEFAULTS);
    var answers = ["", "", ""];
    var revealed = false;
    var shell = htmlNode(doc, "div", "zero-sum-dynamic-lab");
    shell.appendChild(htmlNode(doc, "h3", "", "零和阶段矩阵与动态 Shapley 账本"));
    shell.appendChild(htmlNode(doc, "p", "zsd-note", "左侧先解一局 minimax，右侧再迭代两个状态的值函数；采样账本只检查当前模型，不提供一般收敛证书。"));
    var presets = htmlNode(doc, "div", "zsd-presets");
    var presetButtons = [];
    STAGE_PRESETS.forEach(function (preset) {
      var button = htmlNode(doc, "button", "", preset.label);
      button.type = "button"; button.setAttribute("data-preset", preset.id);
      button.addEventListener("click", function () { state.preset = preset.id; answers = ["", "", ""]; choiceButtons.forEach(function (node) { node.removeAttribute("aria-pressed"); }); hideResults("矩阵已切换；请重新作出预测。"); sync(); });
      presetButtons.push(button); presets.appendChild(button);
    });
    shell.appendChild(presets);
    var controls = htmlNode(doc, "div", "zsd-controls");
    var controlList = [
      makeControl(doc, "折扣 gamma：", "gamma", 0, 1, 0.01, state.gamma),
      makeControl(doc, "迭代轮数：", "iterations", 4, 60, 1, state.iterations),
      makeControl(doc, "抽样次数：", "samples", 20, 1000, 20, state.samples),
      makeControl(doc, "初始值：", "initial", -10, 10, 1, state.initial)
    ];
    controlList.forEach(function (control) { controls.appendChild(control.node); }); shell.appendChild(controls);
    var predict = htmlNode(doc, "div", "zsd-predict");
    predict.appendChild(htmlNode(doc, "strong", "", "先预测：阶段值、压缩证书和采样各自能保证什么？"));
    var questionList = htmlNode(doc, "div", "zsd-question-list");
    var questionData = [
      ["当前阶段矩阵的平衡形态？", [["mixed", "需要内点混合"], ["saddle", "有纯鞍点"], ["unknown", "无法由矩阵判断"]]],
      ["当前 gamma 的 Shapley 算子？", [["contract", "gamma<1：有压缩证书"], ["nocontract", "gamma=1：无一般压缩证书"], ["stage", "只看阶段矩阵即可"]]],
      ["有限迭代与有限抽样？", [["proof", "足以证明一般收敛"], ["evidence", "只是当前参数的有限证据"], ["nothing", "完全没有信息"]]]
    ];
    var choiceButtons = [];
    questionData.forEach(function (question, questionIndex) {
      var fieldset = doc.createElement("fieldset"); fieldset.className = "zsd-question";
      var legend = doc.createElement("legend"); legend.textContent = (questionIndex + 1) + ". " + question[0]; fieldset.appendChild(legend);
      var options = htmlNode(doc, "div", "zsd-options");
      question[1].forEach(function (item) {
        var button = htmlNode(doc, "button", "", item[1]); button.type = "button"; button.setAttribute("data-question", String(questionIndex)); button.setAttribute("data-answer", item[0]);
        button.addEventListener("click", function () { answers[questionIndex] = item[0]; options.querySelectorAll("button").forEach(function (node) { node.setAttribute("aria-pressed", node === button ? "true" : "false"); }); });
        choiceButtons.push(button); options.appendChild(button);
      });
      fieldset.appendChild(options); questionList.appendChild(fieldset);
    });
    predict.appendChild(questionList);
    var actions = htmlNode(doc, "div", "zsd-actions");
    var reveal = htmlNode(doc, "button", "zsd-primary", "揭示结果"); var reset = htmlNode(doc, "button", "", "重置"); reveal.type = reset.type = "button"; actions.appendChild(reveal); actions.appendChild(reset); predict.appendChild(actions);
    var feedback = htmlNode(doc, "p", "zsd-feedback", "请完成三项预测。"); predict.appendChild(feedback); shell.appendChild(predict);
    var results = htmlNode(doc, "div", "zsd-results"); results.hidden = true; shell.appendChild(results); rootNode.replaceChildren(shell);

    function sync() {
      controlList.forEach(function (control) { var key = control.input.getAttribute("data-key"); control.input.value = String(state[key]); control.output.textContent = key === "iterations" || key === "samples" ? String(state[key]) : format(state[key], 2); });
      presetButtons.forEach(function (button) { button.setAttribute("aria-pressed", button.getAttribute("data-preset") === state.preset ? "true" : "false"); });
    }

    function hideResults(message) { revealed = false; results.hidden = true; feedback.className = "zsd-feedback"; feedback.textContent = message || "请完成三项预测。"; }

    function renderResults(data) {
      results.replaceChildren();
      var expected = [data.stage.mixed ? "mixed" : "saddle", data.contractive ? "contract" : "nocontract", "evidence"];
      var score = answers.reduce(function (sum, answer, index) { return sum + (answer === expected[index] ? 1 : 0); }, 0);
      feedback.className = "zsd-feedback " + (score === 3 ? "zsd-pass" : "zsd-warn"); feedback.textContent = "预测 " + score + "/3。阶段值与动态值必须分账；有限回放不会自动升级为一般定理。";
      var metrics = htmlNode(doc, "div", "zsd-metrics");
      metrics.appendChild(metric(doc, "阶段值 v(A)", format(data.stage.value, 3)));
      metrics.appendChild(metric(doc, "p(R0)", format(data.stage.rowProbability, 3)));
      metrics.appendChild(metric(doc, "q(C0)", format(data.stage.columnProbability, 3)));
      metrics.appendChild(metric(doc, "最终 V0", format(data.last.values[0], 3)));
      metrics.appendChild(metric(doc, "最终 V1", format(data.last.values[1], 3)));
      metrics.appendChild(metric(doc, "最终残差", format(data.last.residual, 5)));
      results.appendChild(metrics);
      var layout = htmlNode(doc, "div", "zsd-layout");
      var stagePanel = htmlNode(doc, "div", "zsd-panel"); stagePanel.appendChild(htmlNode(doc, "h4", "", "阶段矩阵：精确 minimax")); stagePanel.appendChild(drawStageMatrix(doc, data));
      var stageLegend = htmlNode(doc, "div", "zsd-legend"); stageLegend.innerHTML = "<span><i class='zsd-swatch' style='color:var(--zsd-green)'></i>纯鞍点标记</span><span>p、q 是混合概率</span>"; stagePanel.appendChild(stageLegend);
      var iterationPanel = htmlNode(doc, "div", "zsd-panel"); iterationPanel.appendChild(htmlNode(doc, "h4", "", "动态博弈：Shapley 价值迭代")); iterationPanel.appendChild(drawIterationChart(doc, data));
      var iterLegend = htmlNode(doc, "div", "zsd-legend"); iterLegend.innerHTML = "<span><i class='zsd-swatch' style='color:var(--zsd-blue)'></i>状态 0</span><span><i class='zsd-swatch' style='color:var(--zsd-gold)'></i>状态 1</span><span><i class='zsd-swatch zsd-dash' style='color:var(--zsd-red)'></i>残差尺度</span>"; iterationPanel.appendChild(iterLegend);
      layout.appendChild(stagePanel); layout.appendChild(iterationPanel); results.appendChild(layout);
      var tableWrap = htmlNode(doc, "div", "zsd-table-wrap");
      var table = doc.createElement("table"); table.setAttribute("aria-label", "Shapley 价值迭代账本");
      var head = doc.createElement("tr"); ["k", "V0", "V1", "Shapley(TV)0", "Shapley(TV)1", "残差", "残差证书"].forEach(function (label) { var th = doc.createElement("th"); th.scope = "col"; th.textContent = label; head.appendChild(th); }); var thead = doc.createElement("thead"); thead.appendChild(head); table.appendChild(thead);
      var body = doc.createElement("tbody"); data.rows.forEach(function (row, index) { if (index % Math.max(1, Math.ceil(data.rows.length / 12)) && index !== data.rows.length - 1) return; var tr = doc.createElement("tr"); [row.step, format(row.values[0], 3), format(row.values[1], 3), format(row.next[0], 3), format(row.next[1], 3), format(row.residual, 5), format(row.bound, 5)].forEach(function (value) { var td = doc.createElement("td"); td.textContent = String(value); tr.appendChild(td); }); body.appendChild(tr); }); table.appendChild(body); tableWrap.appendChild(table); results.appendChild(tableWrap);
      var sampleWrap = htmlNode(doc, "div", "zsd-table-wrap");
      var sampleTable = doc.createElement("table"); sampleTable.setAttribute("aria-label", "有限采样与精确状态矩阵值");
      var sHead = doc.createElement("tr"); ["动态状态", "精确阶段值", "有限抽样均值", "差异"].forEach(function (label) { var th = doc.createElement("th"); th.scope = "col"; th.textContent = label; sHead.appendChild(th); }); var sThead = doc.createElement("thead"); sThead.appendChild(sHead); sampleTable.appendChild(sThead);
      var sBody = doc.createElement("tbody"); data.last.certificates.forEach(function (certificate, index) { var exact = certificate.value; var sampled = data.sampled[index]; var tr = doc.createElement("tr"); ["状态 " + index, format(exact, 4), format(sampled, 4), format(sampled - exact, 4)].forEach(function (value) { var td = doc.createElement("td"); td.textContent = String(value); tr.appendChild(td); }); sBody.appendChild(tr); }); sampleTable.appendChild(sBody); sampleWrap.appendChild(sampleTable); results.appendChild(sampleWrap);
      var boundary = htmlNode(doc, "p", "zsd-boundary", data.contractive ? "当前 gamma<1，有限状态和有界收益下可以使用 ||TV−TW|| 不超过 gamma·||V−W|| 的压缩证书；残差除以 1−gamma 只是当前最后一步的误差上界。抽样差异仍随样本数波动。" : "当前 gamma=1，折扣压缩证书关闭；曲线变平、有限迭代残差变小或抽样均值接近精确值，都不能宣称一般无限时域博弈收敛。阶段 minimax 仍然是有限矩阵的精确结论。"); results.appendChild(boundary);
      if (api && api.announce) api.announce(rootNode, feedback.textContent);
    }

    function render() { sync(); if (revealed) renderResults(iterate(state)); }
    controlList.forEach(function (control) {
      control.input.addEventListener("input", function () { var key = control.input.getAttribute("data-key"); state[key] = Number(control.input.value); if (key === "iterations" || key === "samples") state[key] = Math.round(state[key]); answers = ["", "", ""]; choiceButtons.forEach(function (button) { button.removeAttribute("aria-pressed"); }); hideResults("参数已更新；请重新完成三项预测。"); sync(); });
      control.input.addEventListener("change", function () { control.input.dispatchEvent(new Event("input")); });
    });
    reveal.addEventListener("click", function () { if (answers.some(function (answer) { return !answer; })) { feedback.className = "zsd-feedback zsd-warn"; feedback.textContent = "请先完成三项预测。"; return; } revealed = true; results.hidden = false; render(); });
    reset.addEventListener("click", function () { state = copyConfig(DEFAULTS); answers = ["", "", ""]; choiceButtons.forEach(function (button) { button.removeAttribute("aria-pressed"); }); hideResults("已重置到 Matching pennies 与 gamma=0.8；请重新预测。"); sync(); });
    sync();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var pennies = matrixValue([[1, -1], [-1, 1]]);
    check(Math.abs(pennies.value) < 1e-12, "matching pennies value");
    check(Math.abs(pennies.rowProbability - 0.5) < 1e-12 && Math.abs(pennies.columnProbability - 0.5) < 1e-12, "matching pennies mixing");
    var mixed = matrixValue([[3, 0], [1, 2]]);
    check(Math.abs(mixed.value - 1.5) < 1e-12, "mixed matrix value");
    check(Math.abs(mixed.rowProbability - 0.25) < 1e-12 && Math.abs(mixed.columnProbability - 0.5) < 1e-12, "mixed matrix probabilities");
    var saddle = matrixValue([[3, 0], [5, 1]]);
    check(saddle.pure && Math.abs(saddle.value - 1) < 1e-12, "pure saddle detection");
    var update = shapley([0, 0], 0.8);
    check(update.values.length === 2 && update.matrices.length === 2, "Shapley state count");
    var left = shapley([0, 0], 0.7).values;
    var right = shapley([3, -2], 0.7).values;
    check(normInf(left, right) <= 0.7 * 5 + 1e-12, "Shapley contraction sample");
    var result = iterate({ gamma: 0.8, iterations: 12, samples: 100 });
    check(result.rows.length === 13, "iteration ledger length");
    check(result.rows.every(function (row) { return row.bound !== null; }), "discount certificate exists");
    var boundary = iterate({ gamma: 1, iterations: 8 });
    check(!boundary.contractive && boundary.rows[0].bound === null, "undiscounted boundary has no certificate");
    check(result.sampled.length === 2 && result.sampled.every(finite), "finite sampling ledger");
    var rejected = false;
    try { iterate({ gamma: NaN }); } catch (error) { rejected = error instanceof RangeError; }
    check(rejected, "non-finite parameters rejected");
    return { checks: checks, presets: STAGE_PRESETS.length };
  }

  return {
    STAGE_PRESETS: STAGE_PRESETS,
    matrixValue: matrixValue,
    dynamicMatrix: dynamicMatrix,
    shapley: shapley,
    iterate: iterate,
    sampleMatrix: sampleMatrix,
    selfTest: selfTest,
    mount: mount
  };
});
