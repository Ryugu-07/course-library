(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "ode-stability-lab-styles";
  var EPS = 1e-9;
  var PRESETS = [
    { id: "stable-node", label: "稳定结点", A: [-1, 0, 0, -2], angle: 38, horizon: 5, expect: ["asymptotic", false] },
    { id: "saddle", label: "鞍点", A: [1, 0, 0, -1], angle: 72, horizon: 3.5, expect: ["unstable", true] },
    { id: "stable-focus", label: "稳定焦点", A: [-0.25, -1, 1, -0.25], angle: 15, horizon: 9, expect: ["asymptotic", false] },
    { id: "center", label: "中心", A: [0, -1, 1, 0], angle: 15, horizon: 6.3, expect: ["stable", false] },
    { id: "non-normal", label: "非正规瞬态", A: [-1, 8, 0, -2], angle: 90, horizon: 6, expect: ["asymptotic", true] },
    { id: "jordan-zero", label: "零实部 Jordan", A: [0, 1, 0, 0], angle: 90, horizon: 5, expect: ["unstable", true] }
  ];

  var STYLE_TEXT = [
    ".ods-lab{max-width:100%;min-width:0;color:var(--fg);}",
    ".ods-lab [hidden]{display:none!important;}",
    ".ods-lab .ods-kicker,.ods-lab .ods-note{color:var(--fg-soft);font-size:13px;line-height:1.65;}",
    ".ods-lab .ods-presets,.ods-lab .ods-choice-row,.ods-lab .ods-actions{display:flex;flex-wrap:wrap;gap:8px;}",
    ".ods-lab button{min-height:44px;}",
    ".ods-lab .ods-presets button{flex:1 1 132px;}",
    ".ods-lab .ods-control{display:grid;grid-template-columns:minmax(150px,1fr) minmax(180px,2fr);gap:12px;align-items:center;margin:16px 0;}",
    ".ods-lab .ods-control label{font-size:13px;font-weight:700;color:var(--fg-soft);}",
    ".ods-lab .ods-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".ods-lab .ods-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold);background:var(--bg);}",
    ".ods-lab .ods-predict strong{display:block;margin-bottom:8px;font-size:13px;}",
    ".ods-lab .ods-choice-row{margin-bottom:9px;}",
    ".ods-lab .ods-choice-row button{flex:1 1 145px;}",
    ".ods-lab .ods-feedback{min-height:1.7em;margin:8px 0 0;font-size:13px;font-weight:700;line-height:1.7;}",
    ".ods-lab .ods-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px;}",
    ".ods-lab .ods-chart{min-width:0;}",
    ".ods-lab svg{display:block;width:100%;height:auto;background:var(--bg);border:1px solid var(--border);border-radius:7px;}",
    ".ods-lab svg text{fill:var(--fg);font-family:inherit;letter-spacing:0;}",
    ".ods-lab .ods-axis{stroke:var(--border);stroke-width:1.2;}",
    ".ods-lab .ods-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.45;}",
    ".ods-lab .ods-field{stroke:var(--fg-soft);stroke-width:1;stroke-opacity:.55;}",
    ".ods-lab .ods-trajectory{fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}",
    ".ods-lab .ods-norm{fill:none;stroke:var(--cl-gold);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}",
    ".ods-lab .ods-reference{fill:none;stroke:var(--cl-green);stroke-width:1.7;stroke-dasharray:6 4;}",
    ".ods-lab .ods-start{fill:var(--cl-green);stroke:var(--bg);stroke-width:2;}",
    ".ods-lab .ods-end{fill:var(--cl-red);stroke:var(--bg);stroke-width:2;}",
    ".ods-lab .ods-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:14px 0;}",
    ".ods-lab .ods-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".ods-lab .ods-metric span{display:block;color:var(--fg-soft);font-size:11.5px;}",
    ".ods-lab .ods-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".ods-lab .ods-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}",
    ".ods-lab table{width:100%;min-width:620px;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums;}",
    ".ods-lab th,.ods-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;}",
    ".ods-lab th{color:var(--fg-soft);font-size:11.5px;}",
    ".ods-lab .ods-pass{color:var(--cl-green);}.ods-lab .ods-warn{color:var(--cl-red);}",
    ".ods-lab button:focus-visible,.ods-lab input:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px;}",
    "@media(max-width:780px){.ods-lab .ods-charts{grid-template-columns:minmax(0,1fr);}.ods-lab .ods-control{grid-template-columns:minmax(0,1fr);gap:4px;}}",
    "@media(prefers-reduced-motion:reduce){.ods-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function nearly(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || 1e-7); }
  function copyPreset(preset) { return { id: preset.id, label: preset.label, A: preset.A.slice(), angle: preset.angle, horizon: preset.horizon }; }

  function matrixExpVector(A, t, vector) {
    var a = A[0], b = A[1], c = A[2], d = A[3];
    var mu = (a + d) / 2;
    var b00 = a - mu, b01 = b, b10 = c, b11 = d - mu;
    var delta2 = mu * mu - (a * d - b * c);
    var scale = Math.exp(mu * t);
    var p, q;
    if (delta2 > EPS) {
      var s = Math.sqrt(delta2);
      p = Math.cosh(s * t);
      q = Math.sinh(s * t) / s;
    } else if (delta2 < -EPS) {
      var w = Math.sqrt(-delta2);
      p = Math.cos(w * t);
      q = Math.sin(w * t) / w;
    } else {
      p = 1;
      q = t;
    }
    return [
      scale * ((p + q * b00) * vector[0] + q * b01 * vector[1]),
      scale * (q * b10 * vector[0] + (p + q * b11) * vector[1])
    ];
  }

  function eigenData(A) {
    var trace = A[0] + A[3];
    var determinant = A[0] * A[3] - A[1] * A[2];
    var discriminant = trace * trace - 4 * determinant;
    if (discriminant >= -EPS) {
      var root = Math.sqrt(Math.max(0, discriminant));
      return { trace: trace, determinant: determinant, discriminant: discriminant, real: true,
        values: [{ re: (trace + root) / 2, im: 0 }, { re: (trace - root) / 2, im: 0 }] };
    }
    var imag = Math.sqrt(-discriminant) / 2;
    return { trace: trace, determinant: determinant, discriminant: discriminant, real: false,
      values: [{ re: trace / 2, im: imag }, { re: trace / 2, im: -imag }] };
  }

  function symmetricMax(A) {
    var s00 = A[0], s11 = A[3], s01 = (A[1] + A[2]) / 2;
    return (s00 + s11) / 2 + Math.sqrt(Math.pow((s00 - s11) / 2, 2) + s01 * s01);
  }

  function classify(A) {
    var eig = eigenData(A);
    var maxReal = Math.max(eig.values[0].re, eig.values[1].re);
    var minReal = Math.min(eig.values[0].re, eig.values[1].re);
    var stability;
    if (maxReal < -EPS) {
      stability = "asymptotic";
    } else if (maxReal > EPS) {
      stability = "unstable";
    } else {
      var repeatedZero = eig.real && Math.abs(eig.discriminant) <= EPS && Math.abs(eig.values[0].re) <= EPS;
      var nontrivialJordan = repeatedZero && A.some(function (value) { return Math.abs(value) > EPS; });
      stability = nontrivialJordan ? "unstable" : "stable";
      if (minReal > EPS) stability = "unstable";
    }
    var type;
    if (eig.determinant < -EPS) type = "鞍点";
    else if (!eig.real) type = Math.abs(eig.values[0].re) <= EPS ? "中心型" : (eig.values[0].re < 0 ? "稳定焦点" : "不稳定焦点");
    else if (Math.abs(eig.discriminant) <= EPS) type = "重根 / Jordan 边界";
    else if (maxReal < 0) type = "稳定结点";
    else if (minReal > 0) type = "不稳定结点";
    else type = "退化边界";
    return { eig: eig, stability: stability, type: type, numericalAbscissa: symmetricMax(A), possibleGrowth: symmetricMax(A) > EPS };
  }

  function trajectory(A, angle, horizon, steps) {
    var radians = angle * Math.PI / 180;
    var x0 = [Math.cos(radians), Math.sin(radians)];
    var points = [];
    var maxNorm = 0;
    var maxIndex = 0;
    for (var i = 0; i <= steps; i += 1) {
      var t = horizon * i / steps;
      var x = matrixExpVector(A, t, x0);
      var norm = Math.hypot(x[0], x[1]);
      if (norm > maxNorm) { maxNorm = norm; maxIndex = i; }
      points.push({ t: t, x: x[0], y: x[1], norm: norm });
    }
    return { x0: x0, points: points, maxNorm: maxNorm, maxTime: points[maxIndex].t, finalNorm: points[points.length - 1].norm };
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return "∞";
    if (Math.abs(value) < 5e-10) return "0";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function eigenLabel(eig) {
    return eig.values.map(function (value) {
      if (Math.abs(value.im) <= EPS) return formatNumber(value.re, 3);
      return formatNumber(value.re, 3) + (value.im >= 0 ? "+" : "-") + formatNumber(Math.abs(value.im), 3) + "i";
    }).join(", ");
  }

  function stabilityLabel(value) {
    return value === "asymptotic" ? "渐近稳定" : value === "stable" ? "稳定但不吸引" : "不稳定";
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function pathFrom(points, mapX, mapY) {
    return points.map(function (point, index) { return (index ? "L" : "M") + mapX(point) + " " + mapY(point); }).join(" ");
  }

  function phaseSvg(doc, A, data) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 420 330", role: "img", "aria-label": "当前二维线性系统相轨线" });
    svg.appendChild(svgNode(doc, "title", {}, "二维相轨线与方向场"));
    var maxAbs = 1;
    data.points.forEach(function (p) { maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.y)); });
    var range = maxAbs * 1.12;
    var mapX = function (value) { return 35 + (value + range) / (2 * range) * 350; };
    var mapY = function (value) { return 292 - (value + range) / (2 * range) * 250; };
    [-0.5, 0, 0.5].forEach(function (fraction) {
      var value = fraction * 2 * range;
      svg.appendChild(svgNode(doc, "line", { x1: mapX(value), y1: 42, x2: mapX(value), y2: 292, class: fraction === 0 ? "ods-axis" : "ods-grid" }));
      svg.appendChild(svgNode(doc, "line", { x1: 35, y1: mapY(value), x2: 385, y2: mapY(value), class: fraction === 0 ? "ods-axis" : "ods-grid" }));
    });
    for (var gx = -2; gx <= 2; gx += 1) {
      for (var gy = -2; gy <= 2; gy += 1) {
        if (gx === 0 && gy === 0) continue;
        var x = gx * range / 2.5, y = gy * range / 2.5;
        var vx = A[0] * x + A[1] * y, vy = A[2] * x + A[3] * y;
        var length = Math.hypot(vx, vy) || 1;
        var dx = 8 * vx / length, dy = -8 * vy / length;
        svg.appendChild(svgNode(doc, "line", { x1: mapX(x) - dx, y1: mapY(y) - dy, x2: mapX(x) + dx, y2: mapY(y) + dy, class: "ods-field" }));
      }
    }
    svg.appendChild(svgNode(doc, "path", { d: pathFrom(data.points, function (p) { return mapX(p.x); }, function (p) { return mapY(p.y); }), class: "ods-trajectory" }));
    var first = data.points[0], last = data.points[data.points.length - 1];
    svg.appendChild(svgNode(doc, "circle", { cx: mapX(first.x), cy: mapY(first.y), r: 5, class: "ods-start" }));
    svg.appendChild(svgNode(doc, "circle", { cx: mapX(last.x), cy: mapY(last.y), r: 5, class: "ods-end" }));
    svg.appendChild(svgNode(doc, "text", { x: 35, y: 24, "font-size": 13, "font-weight": 700 }, "相图：绿点起始，红点终点"));
    svg.appendChild(svgNode(doc, "text", { x: 388, y: 309, "font-size": 11, "text-anchor": "end" }, "x₁"));
    svg.appendChild(svgNode(doc, "text", { x: 42, y: 54, "font-size": 11 }, "x₂"));
    return svg;
  }

  function normSvg(doc, data, horizon) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 420 330", role: "img", "aria-label": "状态欧氏范数随时间变化" });
    svg.appendChild(svgNode(doc, "title", {}, "欧氏范数相对初值随时间变化"));
    var maxY = Math.max(1.15, data.maxNorm * 1.12);
    var mapX = function (point) { return 42 + point.t / horizon * 340; };
    var mapY = function (point) { return 292 - point.norm / maxY * 250; };
    [0, 0.5, 1].forEach(function (fraction) {
      var y = 292 - fraction * 250;
      svg.appendChild(svgNode(doc, "line", { x1: 42, y1: y, x2: 382, y2: y, class: fraction === 0 ? "ods-axis" : "ods-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: 36, y: y + 4, "font-size": 10, "text-anchor": "end" }, formatNumber(maxY * fraction, 2)));
    });
    var refY = 292 - 1 / maxY * 250;
    svg.appendChild(svgNode(doc, "line", { x1: 42, y1: refY, x2: 382, y2: refY, class: "ods-reference" }));
    svg.appendChild(svgNode(doc, "path", { d: pathFrom(data.points, mapX, mapY), class: "ods-norm" }));
    svg.appendChild(svgNode(doc, "text", { x: 42, y: 24, "font-size": 13, "font-weight": 700 }, "长度账本：‖x(t)‖₂ / ‖x(0)‖₂"));
    svg.appendChild(svgNode(doc, "text", { x: 382, y: 309, "font-size": 11, "text-anchor": "end" }, "t"));
    svg.appendChild(svgNode(doc, "text", { x: 378, y: refY - 6, "font-size": 10, "text-anchor": "end" }, "初始长度 1"));
    return svg;
  }

  function element(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = element(doc, "style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = copyPreset(PRESETS[0]);
    var prediction = { stability: null, growth: null };
    var revealed = false;
    var shell = element(doc, "div", "ods-lab");
    shell.appendChild(element(doc, "p", "ods-kicker", "选择系统与初始方向。蓝线回答“往哪里走”，金线回答“离原点多远”。"));
    var presetRow = element(doc, "div", "ods-presets");
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", "", preset.label);
      button.type = "button";
      button.addEventListener("click", function () { state = copyPreset(preset); prediction = { stability: null, growth: null }; revealed = false; render(); });
      presetButtons.push({ id: preset.id, node: button });
      presetRow.appendChild(button);
    });
    shell.appendChild(presetRow);
    var matrixLine = element(doc, "p", "ods-note");
    shell.appendChild(matrixLine);

    var control = element(doc, "div", "ods-control");
    var label = element(doc, "label", "", "初始方向 θ：");
    var output = element(doc, "output", "", state.angle + "°");
    label.appendChild(output);
    var range = element(doc, "input");
    range.type = "range"; range.min = "0"; range.max = "180"; range.step = "1"; range.value = String(state.angle);
    range.setAttribute("aria-label", "初始向量角度");
    range.addEventListener("input", function () { state.angle = Number(range.value); prediction = { stability: null, growth: null }; revealed = false; render(); });
    control.appendChild(label); control.appendChild(range); shell.appendChild(control);

    var predict = element(doc, "div", "ods-predict");
    predict.appendChild(element(doc, "strong", "", "先预测长期稳定性与是否存在初始增长方向"));
    var stabilityRow = element(doc, "div", "ods-choice-row");
    var stabilityButtons = [];
    [["asymptotic", "全部趋零"], ["stable", "稳定但不吸引"], ["unstable", "不稳定"]].forEach(function (item) {
      var button = element(doc, "button", "", item[1]); button.type = "button";
      button.addEventListener("click", function () { prediction.stability = item[0]; renderPrediction(); });
      stabilityButtons.push({ value: item[0], node: button }); stabilityRow.appendChild(button);
    });
    var growthRow = element(doc, "div", "ods-choice-row");
    var growthButtons = [];
    [[true, "存在先放大方向"], [false, "所有方向立即不增"]].forEach(function (item) {
      var button = element(doc, "button", "", item[1]); button.type = "button";
      button.addEventListener("click", function () { prediction.growth = item[0]; renderPrediction(); });
      growthButtons.push({ value: item[0], node: button }); growthRow.appendChild(button);
    });
    var actions = element(doc, "div", "ods-actions");
    var check = element(doc, "button", "cl-primary", "核对预测"); check.type = "button";
    var reset = element(doc, "button", "", "重置本预设"); reset.type = "button";
    var feedback = element(doc, "p", "ods-feedback", "先作出两项预测。 ");
    check.addEventListener("click", function () {
      var result = classify(state.A);
      if (prediction.stability === null || prediction.growth === null) { feedback.textContent = "请先完成两项预测。"; feedback.className = "ods-feedback ods-warn"; return; }
      var correct = prediction.stability === result.stability && prediction.growth === result.possibleGrowth;
      revealed = true;
      render();
      feedback.textContent = (correct ? "预测命中。" : "再对照两本账。") + " 长期：" + stabilityLabel(result.stability) + "；对称部分最大特征值 " + formatNumber(result.numericalAbscissa, 3) + (result.possibleGrowth ? " > 0，存在初始增长方向。" : " ≤ 0，欧氏长度对所有方向立即不增。 ");
      feedback.className = "ods-feedback " + (correct ? "ods-pass" : "ods-warn");
      if (api && api.announce) api.announce(root, feedback.textContent);
    });
    reset.addEventListener("click", function () { var preset = PRESETS.filter(function (p) { return p.id === state.id; })[0]; state = copyPreset(preset); prediction = { stability: null, growth: null }; revealed = false; render(); });
    actions.appendChild(check); actions.appendChild(reset);
    predict.appendChild(stabilityRow); predict.appendChild(growthRow); predict.appendChild(actions); predict.appendChild(feedback); shell.appendChild(predict);

    var metrics = element(doc, "div", "ods-metrics"); shell.appendChild(metrics);
    var charts = element(doc, "div", "ods-charts");
    var phase = element(doc, "div", "ods-chart"); var norm = element(doc, "div", "ods-chart");
    charts.appendChild(phase); charts.appendChild(norm); shell.appendChild(charts);
    var tableWrap = element(doc, "div", "ods-ledger-wrap"); var table = element(doc, "table"); tableWrap.appendChild(table); shell.appendChild(tableWrap);
    shell.appendChild(element(doc, "p", "ods-note", "“存在先放大方向”由对称部分的最大特征值判断；金线只展示当前选择的一个方向。二者不应混为一谈。"));
    root.replaceChildren(shell);

    function renderPrediction() {
      stabilityButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", prediction.stability === item.value ? "true" : "false"); });
      growthButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", prediction.growth === item.value ? "true" : "false"); });
      if (!revealed) {
        feedback.textContent = prediction.stability !== null || prediction.growth !== null ? "预测已记录，点击“核对预测”打开判定账本。" : "先作出两项预测。";
        feedback.className = "ods-feedback";
      }
    }

    function metric(labelText, value) { var box = element(doc, "div", "ods-metric"); box.appendChild(element(doc, "span", "", labelText)); box.appendChild(element(doc, "strong", "", value)); return box; }

    function render() {
      range.value = String(state.angle); output.textContent = state.angle + "°";
      matrixLine.textContent = "当前 A = [[" + state.A[0] + ", " + state.A[1] + "], [" + state.A[2] + ", " + state.A[3] + "]]。先用它判断，再展开图与账本。";
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.id ? "true" : "false"); });
      renderPrediction();
      var result = classify(state.A); var data = trajectory(state.A, state.angle, state.horizon, 180);
      metrics.replaceChildren(
        metric("类型", result.type), metric("长期结论", stabilityLabel(result.stability)),
        metric("特征值", eigenLabel(result.eig)), metric("当前方向最大长度", formatNumber(data.maxNorm, 3) + " @ t=" + formatNumber(data.maxTime, 2))
      );
      phase.replaceChildren(phaseSvg(doc, state.A, data)); norm.replaceChildren(normSvg(doc, data, state.horizon));
      var A = state.A;
      table.innerHTML = "<caption>判定账本</caption><thead><tr><th>矩阵 A</th><th>tr A</th><th>det A</th><th>D</th><th>λmax((A+Aᵀ)/2)</th><th>最终 ‖x‖</th></tr></thead><tbody><tr><td>[[" + A[0] + ", " + A[1] + "], [" + A[2] + ", " + A[3] + "]]</td><td>" + formatNumber(result.eig.trace, 3) + "</td><td>" + formatNumber(result.eig.determinant, 3) + "</td><td>" + formatNumber(result.eig.discriminant, 3) + "</td><td>" + formatNumber(result.numericalAbscissa, 3) + "</td><td>" + formatNumber(data.finalNorm, 4) + "</td></tr></tbody>";
      metrics.hidden = !revealed;
      charts.hidden = !revealed;
      tableWrap.hidden = !revealed;
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    var identity = matrixExpVector([1, 2, 3, 4], 0, [0.3, -0.4]);
    assert(nearly(identity[0], 0.3), "exp(0) x component"); assert(nearly(identity[1], -0.4), "exp(0) y component");
    PRESETS.forEach(function (preset) {
      var result = classify(preset.A);
      assert(result.stability === preset.expect[0], preset.id + " stability");
      assert(result.possibleGrowth === preset.expect[1], preset.id + " growth possibility");
      var atZero = matrixExpVector(preset.A, 0, [1, 0]);
      assert(nearly(atZero[0], 1) && nearly(atZero[1], 0), preset.id + " initial condition");
    });
    var diagonal = matrixExpVector([-1, 0, 0, -2], 1, [1, 1]);
    assert(nearly(diagonal[0], Math.exp(-1), 1e-8), "diagonal exp first");
    assert(nearly(diagonal[1], Math.exp(-2), 1e-8), "diagonal exp second");
    var rotation = matrixExpVector([0, -1, 1, 0], Math.PI / 2, [1, 0]);
    assert(Math.abs(rotation[0]) < 1e-8 && nearly(rotation[1], 1, 1e-8), "rotation quarter turn");
    var transient = trajectory([-1, 8, 0, -2], 90, 6, 1200);
    assert(transient.maxNorm > 2, "non-normal transient amplifies selected direction");
    assert(transient.finalNorm < 0.03, "non-normal trajectory eventually decays");
    var center = trajectory([0, -1, 1, 0], 37, 6.2, 400);
    assert(center.points.every(function (p) { return Math.abs(p.norm - 1) < 1e-8; }), "center preserves norm");
    var jordan = matrixExpVector([0, 1, 0, 0], 5, [0, 1]);
    assert(nearly(jordan[0], 5) && nearly(jordan[1], 1), "Jordan polynomial growth");
    assert(classify([-2, 9, 0, -3]).stability === "asymptotic", "Hurwitz non-normal still asymptotic");
    assert(classify([0, 0, 0, 0]).stability === "stable", "zero matrix stable not attracting");
    return { checks: checks, presets: PRESETS.length };
  }

  var exported = { PRESETS: PRESETS, matrixExpVector: matrixExpVector, eigenData: eigenData, classify: classify, trajectory: trajectory, selfTest: selfTest };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") host.CourseLearning.register("ode-stability", mount);
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) {
    try { var result = selfTest(); console.log("ode-stability self-test: PASS (" + result.checks + " checks, " + result.presets + " presets)"); }
    catch (error) { console.error("ode-stability self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null);
