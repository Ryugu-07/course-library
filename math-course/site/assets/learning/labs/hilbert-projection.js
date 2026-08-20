(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("hilbert-projection", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("hilbert-projection self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("hilbert-projection self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var EPSILON = 1e-10;
  var INSTANCE = 0;
  var STANDARD_BASIS = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

  var PRESETS = [
    {
      id: "oblique-plane",
      label: "斜平面 · 非正交生成元",
      vector: [2, -1, 3],
      generators: [[1, 1, 0], [0, 1, 1]],
      note: "两个生成元不正交；先 Gram–Schmidt，再做投影。"
    },
    {
      id: "line",
      label: "直线 · rank 1",
      vector: [2, -1, 3],
      generators: [[1, 1, 0]],
      note: "同一个向量投到一条直线，残差仍须垂直于该线。"
    },
    {
      id: "truncated-plane",
      label: "截断平面 · 前两个坐标",
      vector: [2, -1, 3],
      generators: [[1, 0, 0], [0, 1, 0]],
      note: "有限截断留下第三方向的残差；它不是无穷维完备性的自动证明。"
    },
    {
      id: "complete-basis",
      label: "完整基 · R³",
      vector: [2, -1, 3],
      generators: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      note: "三个方向张成整个 R³，有限模型中的残差为零。"
    }
  ];

  var STYLE_TEXT = [
    ".hip-lab{--hip-blue:var(--cl-blue,#315f9d);--hip-green:var(--cl-green,#39734d);--hip-gold:var(--cl-gold,#9b6a12);--hip-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".hip-lab *,.hip-lab *::before,.hip-lab *::after{box-sizing:border-box}.hip-lab [hidden]{display:none!important}.hip-lab h3,.hip-lab h4{margin:0;color:var(--fg,#292722);letter-spacing:0}.hip-lab h3{font-size:1.12rem}.hip-lab h4{font-size:1rem}.hip-lab p{margin:8px 0}.hip-lab .hip-note,.hip-lab .hip-feedback,.hip-lab .hip-detail{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".hip-lab button{font:inherit;min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.hip-lab button:hover{border-color:var(--hip-blue)}.hip-lab button:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.hip-lab button[aria-pressed=true],.hip-lab .hip-primary{border-color:var(--hip-blue);background:var(--hip-blue);color:var(--bg,#fff);font-weight:750}.hip-lab .hip-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0 14px}.hip-lab .hip-presets button{font-size:12px}.hip-lab .hip-predict{margin-top:12px;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.hip-lab .hip-question{margin:10px 0 0;padding:9px;border:1px solid var(--border,#d7d0c2);min-width:0}.hip-lab .hip-question legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.hip-lab .hip-choice-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.hip-lab .hip-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.hip-lab .hip-actions>*{flex:1 1 160px}.hip-lab .hip-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.hip-lab .hip-pass{color:var(--hip-green)}.hip-lab .hip-warn{color:var(--hip-red)}.hip-lab .hip-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.hip-lab .hip-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:11px 0}.hip-lab .hip-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.hip-lab .hip-metric:nth-child(4n+1){border-color:var(--hip-blue)}.hip-lab .hip-metric:nth-child(4n+2){border-color:var(--hip-green)}.hip-lab .hip-metric:nth-child(4n+3){border-color:var(--hip-gold)}.hip-lab .hip-metric:nth-child(4n){border-color:var(--hip-red)}.hip-lab .hip-metric span{display:block;color:var(--fg-soft,var(--muted,#6b6557));font-size:11px;line-height:1.4}.hip-lab .hip-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.hip-lab .hip-charts{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;min-width:0}.hip-lab .hip-chart{min-width:0}.hip-lab .hip-frame{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.hip-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#292722)}.hip-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.hip-lab .hip-axis{stroke:currentColor;stroke-opacity:.22;stroke-width:1}.hip-lab .hip-bar-x{fill:var(--hip-blue)}.hip-lab .hip-bar-p{fill:var(--hip-green)}.hip-lab .hip-bar-r{fill:var(--hip-red)}.hip-lab .hip-label{font-size:11px}.hip-lab .hip-small-label{font-size:10px;fill:var(--fg-soft,var(--muted,#6b6557))}.hip-lab .hip-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:13px}.hip-lab table{width:100%;min-width:590px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.hip-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.hip-lab th,.hip-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.hip-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.hip-lab .hip-callout{margin-top:12px;padding:9px 11px;border-left:3px solid var(--hip-gold);background:var(--block-bg,var(--bg,#fff));color:var(--fg-soft,var(--muted,#6b6557));font-size:12.5px;line-height:1.65}",
    "@media(max-width:900px){.hip-lab .hip-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.hip-lab .hip-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:650px){.hip-lab .hip-charts{grid-template-columns:minmax(0,1fr)}.hip-lab .hip-choice-row{grid-template-columns:minmax(0,1fr)}}",
    "@media(max-width:420px){.hip-lab .hip-presets,.hip-lab .hip-metrics{grid-template-columns:minmax(0,1fr)}.hip-lab .hip-predict{padding:9px}.hip-lab .hip-frame{padding:4px}.hip-lab table{font-size:11.5px}.hip-lab th,.hip-lab td{padding-left:5px;padding-right:5px}}",
    "@media(prefers-reduced-motion:reduce){.hip-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function cloneVector(vector) {
    return vector.slice();
  }

  function cloneMatrix(matrix) {
    return matrix.map(cloneVector);
  }

  function dot(first, second) {
    var total = 0;
    for (var i = 0; i < first.length; i += 1) total += first[i] * second[i];
    return total;
  }

  function norm(vector) {
    return Math.sqrt(dot(vector, vector));
  }

  function add(first, second) {
    return first.map(function (value, index) { return value + second[index]; });
  }

  function subtract(first, second) {
    return first.map(function (value, index) { return value - second[index]; });
  }

  function scale(vector, factor) {
    return vector.map(function (value) { return value * factor; });
  }

  function gramSchmidt(generators, tolerance) {
    var threshold = tolerance === undefined ? EPSILON : tolerance;
    var basis = [];
    var steps = [];
    generators.forEach(function (generator, index) {
      var working = cloneVector(generator);
      var coefficients = [];
      basis.forEach(function (q) {
        var coefficient = dot(working, q);
        coefficients.push(coefficient);
        working = subtract(working, scale(q, coefficient));
      });
      var residualNorm = norm(working);
      var accepted = residualNorm > threshold;
      var q = accepted ? scale(working, 1 / residualNorm) : null;
      if (accepted) basis.push(q);
      steps.push({
        index: index,
        input: cloneVector(generator),
        coefficients: coefficients,
        residual: cloneVector(working),
        residualNorm: residualNorm,
        accepted: accepted,
        q: q ? cloneVector(q) : null
      });
    });
    return { basis: basis, steps: steps, rank: basis.length, tolerance: threshold };
  }

  function project(vector, generators, tolerance) {
    var gs = gramSchmidt(generators, tolerance);
    var coefficients = gs.basis.map(function (q) { return dot(vector, q); });
    var projected = vector.map(function () { return 0; });
    gs.basis.forEach(function (q, index) {
      projected = add(projected, scale(q, coefficients[index]));
    });
    var residual = subtract(vector, projected);
    var residualBasisDots = gs.basis.map(function (q) { return dot(residual, q); });
    var vectorSquared = dot(vector, vector);
    var projectedSquared = dot(projected, projected);
    var residualSquared = dot(residual, residual);
    return {
      vector: cloneVector(vector),
      generators: cloneMatrix(generators),
      basis: gs.basis.map(cloneVector),
      steps: gs.steps,
      rank: gs.rank,
      coefficients: coefficients,
      projected: projected,
      residual: residual,
      residualBasisDots: residualBasisDots,
      vectorNorm: Math.sqrt(vectorSquared),
      projectedNorm: Math.sqrt(projectedSquared),
      residualNorm: Math.sqrt(residualSquared),
      vectorSquared: vectorSquared,
      projectedSquared: projectedSquared,
      residualSquared: residualSquared,
      pythagorasGap: vectorSquared - projectedSquared - residualSquared
    };
  }

  function truncationLedger(vector, basis) {
    var rows = [];
    for (var k = 1; k <= basis.length; k += 1) {
      var result = project(vector, basis.slice(0, k));
      rows.push({
        k: k,
        projected: result.projected,
        residual: result.residual,
        residualSquared: result.residualSquared,
        energyCaptured: result.projectedSquared
      });
    }
    return rows;
  }

  function rieszRepresentation(representative, vector) {
    var y = cloneVector(representative);
    var value = vector ? dot(vector, y) : null;
    return { representative: y, functional: value, norm: norm(y) };
  }

  function getPreset(id) {
    for (var i = 0; i < PRESETS.length; i += 1) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return PRESETS[0];
  }

  function analyze(preset) {
    var item = preset || PRESETS[0];
    var result = project(item.vector, item.generators);
    result.id = item.id;
    result.label = item.label;
    result.note = item.note;
    result.riesz = rieszRepresentation([1, -2, 1], item.vector);
    result.truncation = truncationLedger(item.vector, STANDARD_BASIS);
    return result;
  }

  function near(first, second, tolerance) {
    return Math.abs(first - second) <= (tolerance || 1e-9) * Math.max(1, Math.abs(first), Math.abs(second));
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    function checkClose(actual, expected, message) {
      check(near(actual, expected, 1e-9), message + " (expected " + expected + ", got " + actual + ")");
    }

    checkClose(dot([1, 2, 3], [4, -1, 2]), 8, "dot product");
    checkClose(norm([3, 4]), 5, "vector norm");
    var gs = gramSchmidt(PRESETS[0].generators);
    check(gs.rank === 2, "oblique generators have rank two");
    checkClose(dot(gs.basis[0], gs.basis[1]), 0, "Gram-Schmidt orthogonality");
    checkClose(norm(gs.basis[0]), 1, "first unit vector");
    checkClose(norm(gs.basis[1]), 1, "second unit vector");

    var oblique = analyze(PRESETS[0]);
    check(oblique.projected.every(function (value, index) { return near(value, [0, 1, 1][index]); }), "oblique projection");
    check(oblique.residual.every(function (value, index) { return near(value, [2, -2, 2][index]); }), "oblique residual");
    oblique.residualBasisDots.forEach(function (value) { checkClose(value, 0, "residual is orthogonal to basis"); });
    checkClose(oblique.vectorSquared, 14, "vector squared norm");
    checkClose(oblique.projectedSquared + oblique.residualSquared, 14, "Pythagoras identity");
    checkClose(oblique.pythagorasGap, 0, "Pythagoras gap");
    checkClose(oblique.riesz.functional, 7, "Riesz functional value");

    var truncation = oblique.truncation;
    check(truncation.length === 3, "three finite truncations");
    checkClose(truncation[0].residualSquared, 10, "first truncation residual");
    checkClose(truncation[1].residualSquared, 9, "second truncation residual");
    checkClose(truncation[2].residualSquared, 0, "complete finite basis residual");
    PRESETS.forEach(function (preset) {
      var result = analyze(preset);
      check(result.rank >= 1 && result.rank <= 3, preset.id + " rank");
      checkClose(result.pythagorasGap, 0, preset.id + " Pythagoras");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "text") node.textContent = String(value);
      else if (key === "className") node.className = String(value);
      else if (key === "htmlFor") node.htmlFor = String(value);
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    var list = children === undefined || children === null ? [] : (Array.isArray(children) ? children : [children]);
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgNode(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, value === true ? "" : String(value));
    });
    var list = children === undefined || children === null ? [] : (Array.isArray(children) ? children : [children]);
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function format(value, digits) {
    var places = digits === undefined ? 3 : digits;
    if (!Number.isFinite(value)) return "-";
    if (Math.abs(value) < 1e-4 && value !== 0) return value.toExponential(places);
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function metric(doc, label, value) {
    var box = element(doc, "div", { className: "hip-metric" });
    box.appendChild(element(doc, "span", { text: label }));
    box.appendChild(element(doc, "strong", { text: value }));
    return box;
  }

  function componentChart(doc, result) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 640 278", role: "img", "aria-label": "原向量、投影向量和残差的分量账本" });
    svg.appendChild(svgNode(doc, "title", {}, "x、P_M x 与残差的三维分量账本"));
    var values = [result.vector, result.projected, result.residual];
    var names = ["x", "P_M x", "r=x-P_M x"];
    var colors = ["hip-bar-x", "hip-bar-p", "hip-bar-r"];
    var maxValue = 0;
    values.forEach(function (vector) { vector.forEach(function (value) { maxValue = Math.max(maxValue, Math.abs(value)); }); });
    maxValue = Math.max(1, maxValue);
    var left = 104, plotWidth = 478, zero = left + plotWidth / 2, rowHeight = 72, scaleValue = plotWidth / 2 / maxValue;
    svg.appendChild(svgNode(doc, "line", { x1: zero, y1: 32, x2: zero, y2: 246, class: "hip-axis" }));
    [-maxValue, 0, maxValue].forEach(function (value) {
      var x = zero + value * scaleValue;
      svg.appendChild(svgNode(doc, "line", { x1: x, y1: 32, x2: x, y2: 246, class: "hip-axis" }));
      svg.appendChild(svgNode(doc, "text", { x: x, y: 263, "text-anchor": "middle", class: "hip-small-label" }, format(value, 1)));
    });
    values.forEach(function (vector, groupIndex) {
      var yBase = 56 + groupIndex * rowHeight;
      svg.appendChild(svgNode(doc, "text", { x: 8, y: yBase + 5, class: "hip-label", "font-weight": "750" }, names[groupIndex]));
      vector.forEach(function (value, componentIndex) {
        var y = yBase + componentIndex * 19;
        var x = zero + Math.min(0, value) * scaleValue;
        var width = Math.abs(value) * scaleValue;
        svg.appendChild(svgNode(doc, "rect", { x: x, y: y - 11, width: Math.max(1, width), height: 13, class: colors[groupIndex] }));
        svg.appendChild(svgNode(doc, "text", { x: value >= 0 ? x + width + 5 : x - 5, y: y, "text-anchor": value >= 0 ? "start" : "end", class: "hip-small-label" }, "c" + (componentIndex + 1) + "=" + format(value, 2)));
      });
    });
    return svg;
  }

  function table(doc, caption, headers, rows) {
    var wrap = element(doc, "div", { className: "hip-table-wrap" });
    var node = element(doc, "table", {});
    node.appendChild(element(doc, "caption", { text: caption }));
    var head = element(doc, "thead", {}), headRow = element(doc, "tr", {});
    headers.forEach(function (header) { headRow.appendChild(element(doc, "th", { scope: "col", text: header })); });
    head.appendChild(headRow); node.appendChild(head);
    var body = element(doc, "tbody", {});
    rows.forEach(function (row) {
      var tr = element(doc, "tr", {});
      row.forEach(function (cell) { tr.appendChild(element(doc, "td", { text: cell })); });
      body.appendChild(tr);
    });
    node.appendChild(body); wrap.appendChild(node); return wrap;
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") return;
    var doc = root.ownerDocument || document;
    if (!doc.getElementById("hilbert-projection-styles")) {
      var style = element(doc, "style", { id: "hilbert-projection-styles", text: STYLE_TEXT });
      (doc.head || doc.documentElement).appendChild(style);
    }
    INSTANCE += 1;
    var uid = "hip-" + INSTANCE;
    var state = { presetId: PRESETS[0].id, predictions: {}, revealed: false };
    var shell = element(doc, "div", { className: "hip-shell" });
    shell.appendChild(element(doc, "p", { className: "hip-note", text: "模型固定在 R³，所有向量、内积和误差都能逐项复算；先完成三项预测，揭示后才显示结果账本。" }));
    var presets = element(doc, "div", { className: "hip-presets", role: "group", "aria-label": "Hilbert 投影有限模型" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: preset.label });
      button.addEventListener("click", function () { state.presetId = preset.id; state.predictions = {}; state.revealed = false; render(); });
      presetButtons.push({ id: preset.id, node: button }); presets.appendChild(button);
    });
    shell.appendChild(presets);

    var questions = [
      { id: "orthogonal", label: "残差会对当前子空间正交吗？", choices: [["yes", "会"], ["no", "不会"]] },
      { id: "pythagoras", label: "平方范数会满足 Pythagoras 身份吗？", choices: [["yes", "会"], ["no", "不会"]] },
      { id: "gram", label: "正交化后可用内积直接得到投影系数吗？", choices: [["yes", "可以"], ["no", "不可以"]] }
    ];
    var prediction = element(doc, "section", { className: "hip-predict", "aria-labelledby": uid + "-predict-title" });
    prediction.appendChild(element(doc, "h4", { id: uid + "-predict-title", text: "先预测三件事，再揭示账本" }));
    var questionButtons = {};
    questions.forEach(function (question) {
      var fieldset = element(doc, "fieldset", { className: "hip-question" });
      fieldset.appendChild(element(doc, "legend", { text: question.label }));
      var choices = element(doc, "div", { className: "hip-choice-row" });
      questionButtons[question.id] = [];
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () { state.predictions[question.id] = choice[0]; state.revealed = false; renderPrediction(); renderStatus(); });
        questionButtons[question.id].push({ value: choice[0], node: button }); choices.appendChild(button);
      });
      fieldset.appendChild(choices); prediction.appendChild(fieldset);
    });
    var actions = element(doc, "div", { className: "hip-actions" });
    var reveal = element(doc, "button", { type: "button", className: "hip-primary", text: "揭示并核对" });
    var reset = element(doc, "button", { type: "button", text: "重置预测" });
    actions.appendChild(reveal); actions.appendChild(reset); prediction.appendChild(actions);
    var feedback = element(doc, "p", { className: "hip-feedback", "aria-live": "polite", text: "每题先作一个预测。" });
    prediction.appendChild(feedback); shell.appendChild(prediction);

    var results = element(doc, "section", { className: "hip-results", hidden: true, "aria-labelledby": uid + "-results-title" });
    results.appendChild(element(doc, "h4", { id: uid + "-results-title", text: "投影、正交性与有限截断" }));
    var metrics = element(doc, "div", { className: "hip-metrics" });
    var charts = element(doc, "div", { className: "hip-charts" });
    var chartHost = element(doc, "div", { className: "hip-chart" });
    var truncationHost = element(doc, "div", { className: "hip-chart" });
    charts.appendChild(chartHost); charts.appendChild(truncationHost);
    results.appendChild(metrics); results.appendChild(charts);
    var ledgerHost = element(doc, "div", {}); results.appendChild(ledgerHost);
    shell.appendChild(results); root.classList.add("hip-lab"); clear(root); root.appendChild(shell);

    function announce(message) {
      feedback.textContent = message;
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function renderPrediction() {
      questions.forEach(function (question) {
        questionButtons[question.id].forEach(function (item) {
          item.node.setAttribute("aria-pressed", state.predictions[question.id] === item.value ? "true" : "false");
        });
      });
    }

    function renderStatus() {
      var count = Object.keys(state.predictions).length;
      feedback.className = "hip-feedback";
      if (!state.revealed) feedback.textContent = count === 3 ? "三项预测已记录，点击“揭示并核对”。" : "已记录 " + count + "/3 项预测。";
    }

    function render() {
      var preset = getPreset(state.presetId);
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === preset.id ? "true" : "false"); });
      renderPrediction(); renderStatus();
      if (!state.revealed) { results.hidden = true; return; }
      var result = analyze(preset);
      var expected = { orthogonal: "yes", pythagoras: "yes", gram: "yes" };
      var correct = questions.every(function (question) { return state.predictions[question.id] === expected[question.id]; });
      feedback.className = "hip-feedback " + (correct ? "hip-pass" : "hip-warn");
      feedback.textContent = (correct ? "三项预测都命中。" : "预测已揭示，请按正交投影定义复盘。") + " 当前模型的 rank(M)=" + result.rank + "。";
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
      results.hidden = false;
      metrics.replaceChildren(
        metric(doc, "模型", preset.label),
        metric(doc, "rank(M)", String(result.rank)),
        metric(doc, "||x||²", format(result.vectorSquared, 4)),
        metric(doc, "||P_Mx||²", format(result.projectedSquared, 4)),
        metric(doc, "||r||²", format(result.residualSquared, 4)),
        metric(doc, "Pythagoras gap", format(result.pythagorasGap, 5)),
        metric(doc, "max |<r,q>|", format(Math.max.apply(null, result.residualBasisDots.concat([0]).map(Math.abs)), 5)),
        metric(doc, "Riesz φ_y(x)", format(result.riesz.functional, 4))
      );
      clear(chartHost); chartHost.appendChild(element(doc, "h4", { text: "三分量账本" })); chartHost.appendChild(element(doc, "div", { className: "hip-frame" }, componentChart(doc, result)));
      clear(truncationHost); truncationHost.appendChild(element(doc, "h4", { text: "标准基有限截断" }));
      var truncRows = result.truncation.map(function (row) { return ["k=" + row.k, "P=(" + row.projected.map(function (v) { return format(v, 2); }).join(",") + ")", format(row.residualSquared, 3), format(row.energyCaptured, 3)]; });
      truncationHost.appendChild(table(doc, "同一 x 在前 k 个标准基方向上的残差账本", ["截断", "投影", "残差平方", "捕获能量"], truncRows));
      clear(ledgerHost);
      var basisRows = result.basis.map(function (q, index) { return ["q" + (index + 1), "(" + q.map(function (v) { return format(v, 4); }).join(", ") + ")", format(result.coefficients[index], 4)]; });
      ledgerHost.appendChild(table(doc, "Gram–Schmidt 正交单位基与投影系数", ["方向", "q_j", "<x,q_j>"], basisRows));
      ledgerHost.appendChild(element(doc, "p", { className: "hip-callout", text: preset.note + " 残差对生成元的正交性、平方范数分解和 Riesz 代表向量都来自同一份纯模型输出。" }));
    }

    reveal.addEventListener("click", function () {
      if (Object.keys(state.predictions).length !== questions.length) {
        feedback.className = "hip-feedback hip-warn";
        feedback.textContent = "请先完成三项预测，再揭示账本。";
        return;
      }
      state.revealed = true; render();
    });
    reset.addEventListener("click", function () { state.predictions = {}; state.revealed = false; render(); });
    render();
  }

  return {
    PRESETS: PRESETS,
    dot: dot,
    norm: norm,
    gramSchmidt: gramSchmidt,
    project: project,
    truncationLedger: truncationLedger,
    rieszRepresentation: rieszRepresentation,
    analyze: analyze,
    mount: mount,
    selfTest: selfTest
  };
});
