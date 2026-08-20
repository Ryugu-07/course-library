(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("chaining-tree", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("chaining-tree self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("chaining-tree self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var BASE_SIGMA = 0.86;
  var SCALE_DECAY = 0.42;
  var MIN_DEPTH = 2;
  var MAX_DEPTH = 6;
  var STYLE_ID = "cl-chaining-tree-styles";
  var SERIAL = 0;
  var DEFAULTS = { depth: 5, seed: 31031 };

  var PRESETS = [
    { id: "fixed-31031", label: "固定 seed 31031", depth: 5, seed: 31031 },
    { id: "deeper-31031", label: "同 seed 加一层", depth: 6, seed: 31031 },
    { id: "fixed-31415", label: "固定 seed 31415", depth: 5, seed: 31415 }
  ];

  var STYLE_TEXT = [
    ".ct-lab{--ct-blue:var(--cl-blue,#315f9d);--ct-red:var(--cl-red,#b64335);--ct-gold:var(--cl-gold,#9b6a12);--ct-green:var(--cl-green,#39734d);color:var(--fg);line-height:1.55;min-width:0;overflow-wrap:anywhere;}",
    "html[data-theme=dark] .ct-lab{--ct-blue:#83c8ff;--ct-red:#f08c7d;--ct-gold:#e2b458;--ct-green:#72bd8b;}",
    ".ct-lab *,.ct-lab *::before,.ct-lab *::after{box-sizing:border-box}.ct-lab [hidden]{display:none!important}",
    ".ct-lab h3,.ct-lab h4{margin:0;color:var(--fg);letter-spacing:0}.ct-lab h3{font-size:1.18rem}.ct-lab h4{margin-top:15px;font-size:1rem}",
    ".ct-lab .ct-intro,.ct-lab .ct-note,.ct-lab .ct-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}",
    ".ct-lab .ct-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--ct-gold);background:var(--bg)}.ct-lab .ct-prediction>strong{display:block;margin-bottom:9px}",
    ".ct-lab fieldset{min-width:0;margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.ct-lab legend{max-width:100%;padding:0 4px;color:var(--fg-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere}",
    ".ct-lab .ct-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ct-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ct-lab button:hover{border-color:var(--accent)}.ct-lab button[aria-pressed=true],.ct-lab button.ct-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.ct-lab button:focus-visible,.ct-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".ct-lab .ct-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.ct-lab .ct-actions>*{flex:1 1 170px}.ct-lab .ct-feedback{min-height:2em;margin:8px 0;font-weight:700}.ct-lab .ct-pass{color:var(--ct-green)}.ct-lab .ct-warn{color:var(--ct-red)}",
    ".ct-lab .ct-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.ct-lab .ct-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:11px 0}.ct-lab .ct-presets button{font-size:12px}.ct-lab .ct-control{display:grid;gap:5px;max-width:360px;margin:10px 0 14px}.ct-lab .ct-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.ct-lab output{color:var(--accent);font-variant-numeric:tabular-nums}.ct-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".ct-lab .ct-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0}.ct-lab .ct-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ct-lab .ct-metric:nth-child(1),.ct-lab .ct-metric:nth-child(4){border-top-color:var(--ct-blue)}.ct-lab .ct-metric:nth-child(2),.ct-lab .ct-metric:nth-child(5){border-top-color:var(--ct-gold)}.ct-lab .ct-metric:nth-child(3),.ct-lab .ct-metric:nth-child(6){border-top-color:var(--ct-green)}.ct-lab .ct-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.ct-lab .ct-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}",
    ".ct-lab .ct-chart{min-width:0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.ct-lab svg{display:block;width:100%;height:auto;min-width:620px;color:var(--fg)}.ct-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ct-lab .ct-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.72}.ct-lab .ct-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72}.ct-lab .ct-edge{stroke:var(--border);stroke-width:1.2;stroke-opacity:.82}.ct-lab .ct-node-positive{fill:var(--ct-blue);stroke:var(--bg);stroke-width:1}.ct-lab .ct-node-negative{fill:var(--ct-red);stroke:var(--bg);stroke-width:1}.ct-lab .ct-bar-single{fill:var(--ct-red);fill-opacity:.8}.ct-lab .ct-bar-chain{fill:var(--ct-green);fill-opacity:.85}.ct-lab .ct-bar-sample{fill:var(--ct-blue);fill-opacity:.85}.ct-lab .ct-bar-ledger{fill:var(--ct-gold);fill-opacity:.82}.ct-lab .ct-chart-label{font-size:11px}.ct-lab .ct-chart-title{font-size:13px;font-weight:750}",
    ".ct-lab .ct-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch}.ct-lab table{width:100%;min-width:820px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ct-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.ct-lab th,.ct-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.ct-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.ct-lab .ct-good{color:var(--ct-green);font-weight:750}.ct-lab .ct-bad{color:var(--ct-red);font-weight:750}.ct-lab .ct-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--ct-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:920px){.ct-lab .ct-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.ct-lab .ct-choice-row{grid-template-columns:minmax(0,1fr)}}",
    "@media(max-width:650px){.ct-lab .ct-presets{grid-template-columns:minmax(0,1fr)}.ct-lab .ct-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.ct-lab .ct-chart{padding:5px}}",
    "@media(prefers-reduced-motion:reduce){.ct-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return finite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function format(value, digits) {
    var places = digits === undefined ? 4 : digits;
    if (!finite(value)) return "—";
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function makeRng(seed) {
    var state = (Number(seed) >>> 0);
    return function () {
      state = (state + 0x6D2B79F5) | 0;
      var t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(rng) {
    var u = 0;
    while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }

  function normalizeParams(input) {
    var source = input || {};
    var rawDepth = source.depth === undefined ? DEFAULTS.depth : number(source.depth, DEFAULTS.depth);
    var rawSeed = source.seed === undefined ? DEFAULTS.seed : number(source.seed, DEFAULTS.seed);
    return {
      depth: clamp(Math.round(rawDepth), MIN_DEPTH, MAX_DEPTH),
      seed: (finite(rawSeed) ? rawSeed : DEFAULTS.seed) >>> 0
    };
  }

  function levelSigma(level) {
    if (!finite(level) || level < 1) return 0;
    return BASE_SIGMA * Math.pow(SCALE_DECAY, level - 1);
  }

  function makeLevels(params) {
    var rng = makeRng(params.seed);
    var levels = [];
    var level;
    for (level = 1; level <= params.depth; level += 1) {
      var count = Math.pow(2, level);
      var sigma = levelSigma(level);
      var increments = [];
      var index;
      for (index = 0; index < count; index += 1) increments.push(gaussian(rng) * sigma);
      levels.push({ level: level, count: count, sigma: sigma, increments: increments });
    }
    return levels;
  }

  function buildNodes(levels) {
    var nodes = [[{ value: 0, index: 0 }]];
    levels.forEach(function (level) {
      var previous = nodes[nodes.length - 1];
      var current = level.increments.map(function (increment, index) {
        return { value: previous[Math.floor(index / 2)].value + increment, index: index };
      });
      nodes.push(current);
    });
    return nodes;
  }

  function sampleLeaves(nodes) {
    return nodes[nodes.length - 1].map(function (node, index) { return { index: index, value: node.value }; });
  }

  function evaluate(input) {
    var params = normalizeParams(input);
    var levels = makeLevels(params);
    var nodes = buildNodes(levels);
    var leaves = sampleLeaves(nodes);
    var totalVariance = levels.reduce(function (sum, level) { return sum + level.sigma * level.sigma; }, 0);
    var singleScaleExpectedUpper = Math.sqrt(2 * totalVariance * Math.log(leaves.length));
    var cumulativeExpected = 0;
    var sampleChainUpper = 0;
    var ledger = levels.map(function (level) {
      var actualMax = Math.max.apply(null, level.increments);
      var expectedContribution = level.sigma * Math.sqrt(2 * Math.log(level.count));
      cumulativeExpected += expectedContribution;
      sampleChainUpper += actualMax;
      return {
        level: level.level,
        count: level.count,
        sigma: level.sigma,
        actualMax: actualMax,
        expectedContribution: expectedContribution,
        cumulativeExpected: cumulativeExpected,
        sampleCumulative: sampleChainUpper
      };
    });
    var sampleMaxEntry = leaves.reduce(function (best, leaf) { return leaf.value > best.value ? leaf : best; }, leaves[0]);
    var chainingExpectedUpper = cumulativeExpected;
    return {
      params: params,
      levels: levels,
      nodes: nodes,
      leaves: leaves,
      leafCount: leaves.length,
      totalVariance: totalVariance,
      singleScaleExpectedUpper: singleScaleExpectedUpper,
      chainingExpectedUpper: chainingExpectedUpper,
      sampleMax: sampleMaxEntry.value,
      sampleMaxLeaf: sampleMaxEntry.index,
      sampleChainUpper: sampleChainUpper,
      ledger: ledger,
      dudleyLanguage: "E sup 的上界",
      finiteTreeCaveat: "固定有限树上的可计算账本，不是一般过程定理的证明"
    };
  }

  function predictionAnswers(result) {
    return {
      order: result.chainingExpectedUpper < result.singleScaleExpectedUpper ? "chaining" : "single",
      sample: "sample",
      language: "expectation"
    };
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function makeElement(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children, doc);
  }

  function makeSvg(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children, doc);
  }

  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function svgText(api, doc, x, y, text, attrs) {
    var merged = { x: x, y: y, className: "ct-chart-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, doc, "text", merged, text);
  }

  function mapLinear(value, min, max, start, end) {
    if (max === min) return (start + end) / 2;
    return start + (value - min) / (max - min) * (end - start);
  }

  function treeSvg(api, doc, result, uid) {
    var width = 900, height = 390, treeLeft = 30, treeRight = 430, top = 40, bottom = 32;
    var svg = makeSvg(api, doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-labelledby": uid + "-tree-title " + uid + "-tree-desc" });
    svg.appendChild(makeSvg(api, doc, "title", { id: uid + "-tree-title" }, "固定 seed 二叉树与三种最大值比较"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: uid + "-tree-desc" }, "左侧是每级高斯增量组成的二叉树，右侧比较单尺度 union bound、多尺度 chaining 账本和固定 seed 样本最大值。"));
    var depth = result.params.depth;
    var xForLevel = function (level) { return treeLeft + (treeRight - treeLeft) * level / depth; };
    var yForNode = function (level, index) { return top + (height - top - bottom) * (index + 0.5) / Math.pow(2, level); };
    result.nodes.forEach(function (levelNodes, level) {
      if (level > 0) {
        levelNodes.forEach(function (node, index) {
          var parent = Math.floor(index / 2);
          svg.appendChild(makeSvg(api, doc, "line", { x1: xForLevel(level - 1), y1: yForNode(level - 1, parent), x2: xForLevel(level), y2: yForNode(level, index), className: "ct-edge" }));
        });
      }
    });
    result.nodes.forEach(function (levelNodes, level) {
      levelNodes.forEach(function (node, index) {
        var radius = level === depth ? 3 : Math.max(2, 5 - level * 0.45);
        var circle = makeSvg(api, doc, "circle", { cx: xForLevel(level), cy: yForNode(level, index), r: radius, className: node.value >= 0 ? "ct-node-positive" : "ct-node-negative", "aria-label": "level " + level + ", node " + index + ", value " + format(node.value, 3) });
        circle.appendChild(makeSvg(api, doc, "title", {}, "level " + level + ", node " + index + ": " + format(node.value, 4)));
        svg.appendChild(circle);
      });
      svg.appendChild(svgText(api, doc, xForLevel(level), height - 12, level === 0 ? "root" : "k=" + level, { "text-anchor": "middle" }));
    });
    svg.appendChild(svgText(api, doc, treeLeft, 19, "固定 seed 二叉树：蓝正、红负；叶值 Xᵥ", { className: "ct-chart-title" }));
    var barLeft = 505, barRight = 850, barTop = 72, barHeight = 34;
    var values = [
      { label: "单尺度 E 上界", value: result.singleScaleExpectedUpper, className: "ct-bar-single" },
      { label: "多尺度 E 上界", value: result.chainingExpectedUpper, className: "ct-bar-chain" },
      { label: "固定 seed max Xᵥ", value: result.sampleMax, className: "ct-bar-sample" },
      { label: "样本级链上界", value: result.sampleChainUpper, className: "ct-bar-ledger" }
    ];
    var maxValue = Math.max.apply(null, values.map(function (item) { return Math.max(0, item.value); })) * 1.18;
    if (maxValue <= 0) maxValue = 1;
    values.forEach(function (item, index) {
      var y = barTop + index * 63;
      svg.appendChild(svgText(api, doc, barLeft, y - 8, item.label, {}));
      svg.appendChild(makeSvg(api, doc, "rect", { x: barLeft, y: y, width: Math.max(0, item.value) / maxValue * (barRight - barLeft), height: barHeight, className: item.className }));
      svg.appendChild(svgText(api, doc, barRight, y + 22, format(item.value, 3), { "text-anchor": "end" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { x1: barLeft, y1: barTop - 20, x2: barLeft, y2: barTop + 3 * 63 + barHeight, className: "ct-axis" }));
    svg.appendChild(svgText(api, doc, barLeft, 19, "三本账：理论量词与一次样本分开", { className: "ct-chart-title" }));
    return svg;
  }

  function metric(api, doc, label, value) {
    return makeElement(api, doc, "div", { className: "ct-metric" }, [
      makeElement(api, doc, "span", { text: label }),
      makeElement(api, doc, "strong", { text: value })
    ]);
  }

  function tableRow(api, doc, cells, header) {
    var row = makeElement(api, doc, "tr", {});
    cells.forEach(function (cell, index) {
      row.appendChild(makeElement(api, doc, header && index === 0 ? "th" : "td", header && index === 0 ? { scope: "row" } : {}, cell));
    });
    return row;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "ct-" + (++SERIAL);
    var state = { depth: DEFAULTS.depth, seed: DEFAULTS.seed };
    var predictions = { order: null, sample: null, language: null };
    var revealed = false;
    var shell = makeElement(api, doc, "div", { className: "ct-lab" });
    shell.appendChild(makeElement(api, doc, "h3", { text: "二叉树 chaining：三种最大值账本" }));
    shell.appendChild(makeElement(api, doc, "p", { className: "ct-intro", text: "固定树、固定 seed、固定尺度；先预测理论量词，再看同一份增量如何累成叶节点最大值。" }));

    var presetRow = makeElement(api, doc, "div", { className: "ct-presets", role: "group", "aria-label": "二叉树预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        state = { depth: preset.depth, seed: preset.seed };
        lock("已切换树预设，请重新预测。", true);
        render();
      });
      presetButtons.push({ id: preset.id, node: button });
      presetRow.appendChild(button);
    });
    shell.appendChild(presetRow);
    var depthId = uid + "-depth";
    var depthOutput = makeElement(api, doc, "output", { for: depthId, text: String(state.depth) });
    var depthRange = makeElement(api, doc, "input", { id: depthId, type: "range", min: String(MIN_DEPTH), max: String(MAX_DEPTH), step: "1", value: String(state.depth), "aria-label": "二叉树深度" });
    depthRange.addEventListener("input", function () {
      state.depth = Number(depthRange.value);
      lock("树深度已改变，请重新预测。", true);
      render();
    });
    shell.appendChild(makeElement(api, doc, "div", { className: "ct-control" }, [
      makeElement(api, doc, "label", { htmlFor: depthId }, ["完整二叉树深度 K：", depthOutput]),
      depthRange
    ]));

    var form = makeElement(api, doc, "form", { className: "ct-prediction", "aria-labelledby": uid + "-prediction-title" });
    form.appendChild(makeElement(api, doc, "strong", { id: uid + "-prediction-title", text: "预测门：先判断哪一种话语正在说话" }));
    var questions = [
      { key: "order", prompt: "当前尺度安排下，哪条理论期望上界更紧？", choices: [["single", "单尺度 union bound"], ["chaining", "多尺度 chaining"], ["same", "两者必相等"]] },
      { key: "sample", prompt: "固定 seed 的 max Xᵥ 最准确的身份是什么？", choices: [["sample", "一次样本的观测值"], ["bound", "Dudley 等式右边"], ["theorem", "高概率定理本身"]] },
      { key: "language", prompt: "Dudley / generic chaining 的量词主要是什么？", choices: [["expectation", "E sup 的期望上界"], ["sample", "每条样本路径等式"], ["identity", "有限树恒等式"]] }
    ];
    var choiceButtons = [];
    questions.forEach(function (question) {
      var fieldset = makeElement(api, doc, "fieldset", {});
      fieldset.appendChild(makeElement(api, doc, "legend", { text: question.prompt }));
      var row = makeElement(api, doc, "div", { className: "ct-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          predictions[question.key] = choice[0];
          updatePredictionButtons();
          if (!revealed) feedback.textContent = "预测已记录，三项都选好后揭示账本。";
        });
        choiceButtons.push({ key: question.key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      form.appendChild(fieldset);
    });
    var actions = makeElement(api, doc, "div", { className: "ct-actions" });
    var reveal = makeElement(api, doc, "button", { type: "submit", className: "ct-primary" }, "提交预测并揭示");
    var reset = makeElement(api, doc, "button", { type: "button" }, "重置");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    form.appendChild(actions);
    var feedback = makeElement(api, doc, "p", { className: "ct-feedback", role: "status", "aria-live": "polite", text: "请完成三项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealedSection = makeElement(api, doc, "section", { className: "ct-revealed", hidden: "hidden", "aria-label": "chaining 结果账本" });
    var metrics = makeElement(api, doc, "div", { className: "ct-metrics" });
    var chart = makeElement(api, doc, "div", { className: "ct-chart" });
    var ledgerWrap = makeElement(api, doc, "div", { className: "ct-ledger" });
    var table = makeElement(api, doc, "table", {});
    table.appendChild(makeElement(api, doc, "caption", { text: "多尺度透明账本：每级实际最大增量与用于 E sup 上界的高斯 max 项。" }));
    table.appendChild(makeElement(api, doc, "thead", {}, [tableRow(api, doc, ["层 k", "边数", "σₖ", "固定样本 max 增量", "E 上界贡献", "E 上界累计"], false)]));
    var tbody = makeElement(api, doc, "tbody", {});
    table.appendChild(tbody);
    ledgerWrap.appendChild(table);
    var interpretation = makeElement(api, doc, "p", { className: "ct-interpretation", role: "status", "aria-live": "polite" });
    revealedSection.appendChild(metrics);
    revealedSection.appendChild(chart);
    revealedSection.appendChild(ledgerWrap);
    revealedSection.appendChild(interpretation);
    shell.appendChild(revealedSection);
    root.replaceChildren(shell);

    function updatePredictionButtons() {
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", predictions[item.key] === item.value ? "true" : "false"); });
    }

    function lock(message, shouldAnnounce) {
      revealed = false;
      predictions = { order: null, sample: null, language: null };
      updatePredictionButtons();
      revealedSection.setAttribute("hidden", "hidden");
      feedback.className = "ct-feedback";
      feedback.textContent = message || "请完成三项预测。";
      if (shouldAnnounce) announce(api, root, feedback.textContent);
    }

    function render() {
      var result = evaluate(state);
      depthRange.value = String(state.depth);
      depthOutput.textContent = String(state.depth);
      presetButtons.forEach(function (item) {
        var preset = PRESETS.filter(function (candidate) { return candidate.depth === state.depth && candidate.seed === state.seed; })[0];
        item.node.setAttribute("aria-pressed", preset && item.id === preset.id ? "true" : "false");
      });
      if (!revealed) return;
      metrics.replaceChildren(
        metric(api, doc, "固定 seed", String(result.params.seed)),
        metric(api, doc, "叶节点数", String(result.leafCount)),
        metric(api, doc, "样本 max Xᵥ", format(result.sampleMax, 4)),
        metric(api, doc, "样本级链上界", format(result.sampleChainUpper, 4)),
        metric(api, doc, "单尺度 E 上界", format(result.singleScaleExpectedUpper, 4)),
        metric(api, doc, "多尺度 E 上界", format(result.chainingExpectedUpper, 4))
      );
      chart.replaceChildren(treeSvg(api, doc, result, uid));
      tbody.replaceChildren();
      result.ledger.forEach(function (row) {
        tbody.appendChild(tableRow(api, doc, [String(row.level), String(row.count), format(row.sigma, 5), format(row.actualMax, 5), format(row.expectedContribution, 5), format(row.cumulativeExpected, 5)], true));
      });
      interpretation.textContent = "这棵有限树满足样本级 max Xᵥ ≤ Σₖ max_e Δₑ 的确定性不等式；单尺度与多尺度两栏写的是 E sup 的上界语言。Dudley/generic chaining 的积分或 γ₂ 结论不能被这一条固定 seed 路径改写成一次样本等式。";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return !predictions[question.key]; });
      if (missing.length) {
        feedback.className = "ct-feedback ct-warn";
        feedback.textContent = "还差 " + missing.length + " 项预测。";
        return;
      }
      var result = evaluate(state);
      var answers = predictionAnswers(result);
      var correct = questions.filter(function (question) { return predictions[question.key] === answers[question.key]; }).length;
      revealed = true;
      revealedSection.removeAttribute("hidden");
      render();
      feedback.className = "ct-feedback " + (correct === questions.length ? "ct-pass" : "ct-warn");
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项命中。样本最大值、样本级链上界和期望上界没有混成一个数字。";
      announce(api, root, feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state = { depth: DEFAULTS.depth, seed: DEFAULTS.seed };
      lock("已重置，请重新完成三项预测。", true);
      render();
    });
    updatePredictionButtons();
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("chaining-tree self-test failed: " + message);
    }
    assert(levelSigma(1) === BASE_SIGMA, "level one scale");
    assert(levelSigma(2) === BASE_SIGMA * SCALE_DECAY, "geometric scale formula");
    assert(normalizeParams({ depth: 1, seed: "bad" }).depth === MIN_DEPTH, "lower endpoint and invalid seed");
    assert(normalizeParams({ depth: 1, seed: "bad" }).seed === DEFAULTS.seed, "invalid seed fallback");
    assert(normalizeParams({ depth: 99, seed: Infinity }).depth === MAX_DEPTH, "upper endpoint and invalid seed");
    var result = evaluate(DEFAULTS);
    var repeat = evaluate(DEFAULTS);
    assert(result.leafCount === Math.pow(2, DEFAULTS.depth), "complete binary leaf count");
    assert(result.levels.length === DEFAULTS.depth && result.ledger.length === DEFAULTS.depth, "scale ledger length");
    assert(JSON.stringify(result) === JSON.stringify(repeat), "deterministic fixed seed");
    assert(result.leaves.every(function (leaf) { return finite(leaf.value); }), "finite leaf values");
    assert(Math.abs(result.singleScaleExpectedUpper - Math.sqrt(2 * result.totalVariance * Math.log(result.leafCount))) < 1e-12, "single-scale formula");
    assert(Math.abs(result.chainingExpectedUpper - result.ledger.reduce(function (sum, row) { return sum + row.expectedContribution; }, 0)) < 1e-12, "chaining ledger formula");
    assert(result.singleScaleExpectedUpper > result.chainingExpectedUpper, "multiscale bound is tighter for default scales");
    assert(result.sampleMax <= result.sampleChainUpper + 1e-12, "sample path chain inequality");
    assert(result.totalVariance > 0 && finite(result.totalVariance), "positive variance");
    assert(result.ledger.every(function (row) { return row.count === Math.pow(2, row.level) && row.expectedContribution >= 0; }), "ledger counts and contributions");
    var shallow = evaluate({ depth: MIN_DEPTH, seed: DEFAULTS.seed });
    assert(shallow.leafCount === 4 && shallow.ledger[0].level === 1, "depth endpoint");
    assert(shallow.sampleMax <= shallow.sampleChainUpper + 1e-12, "shallow path inequality");
    assert(predictionAnswers(result).order === "chaining", "order prediction answer");
    assert(predictionAnswers(result).sample === "sample", "sample prediction answer");
    assert(predictionAnswers(result).language === "expectation", "expectation language answer");
    assert(JSON.stringify(evaluate({ depth: MAX_DEPTH, seed: 1234 })) === JSON.stringify(evaluate({ depth: MAX_DEPTH, seed: 1234 })), "upper depth deterministic");
    return { checks: checks, presets: PRESETS.length, defaultLeaves: result.leafCount };
  }

  return {
    BASE_SIGMA: BASE_SIGMA,
    SCALE_DECAY: SCALE_DECAY,
    MIN_DEPTH: MIN_DEPTH,
    MAX_DEPTH: MAX_DEPTH,
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    normalizeParams: normalizeParams,
    levelSigma: levelSigma,
    evaluate: evaluate,
    predictionAnswers: predictionAnswers,
    selfTest: selfTest,
    mount: mount
  };
});
