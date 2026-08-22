(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("derivative-local-linearity", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("derivative-local-linearity self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("derivative-local-linearity self-test: FAIL", error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "derivative-local-linearity-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var STEPS = [0.4, 0.2, 0.1, 0.05, 0.025];
  var PRESETS = [
    { id: "quadratic", label: "x²：a=1，正常线性化", kind: "smooth", a: 1, derivative: 2, fn: function (x) { return x * x; } },
    { id: "cubic", label: "x³：a=1，曲率更明显", kind: "smooth", a: 1, derivative: 3, fn: function (x) { return x * x * x; } },
    { id: "corner", label: "|x|：a=0，不可导", kind: "corner", a: 0, derivative: null, fn: function (x) { return Math.abs(x); } },
    { id: "flat-inverse", label: "x²：a=0，导数为零", kind: "zero", a: 0, derivative: 0, fn: function (x) { return x * x; } }
  ];
  var STYLE_TEXT = [
    ".dll-lab{--dll-blue:var(--cl-blue,#315f9d);--dll-gold:var(--cl-gold,#9b6a12);--dll-green:var(--cl-green,#39734d);--dll-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".dll-lab *,.dll-lab *::before,.dll-lab *::after{box-sizing:border-box}.dll-lab [hidden]{display:none!important}.dll-lab h3,.dll-lab h4{margin:0;color:var(--fg,#292722);letter-spacing:0}.dll-lab h3{font-size:1.16rem}.dll-lab p{margin:8px 0}.dll-lab .dll-note,.dll-lab .dll-feedback{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".dll-lab button,.dll-lab input{font:inherit}.dll-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.dll-lab button:hover{border-color:var(--dll-blue)}.dll-lab button:focus-visible,.dll-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.dll-lab button[aria-pressed=true],.dll-lab button.dll-primary{border-color:var(--dll-blue);background:var(--dll-blue);color:#fff;font-weight:750}.dll-lab .dll-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.dll-lab .dll-actions>*{flex:1 1 180px}",
    ".dll-lab .dll-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--dll-gold);background:var(--block-bg,var(--bg,#fff))}.dll-lab .dll-prediction-title{display:block;margin-bottom:9px;font-size:13px}.dll-lab fieldset{min-width:0;margin:9px 0;padding:9px 10px;border:1px solid var(--border,#d7d0c2)}.dll-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.dll-lab .dll-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.dll-lab .dll-choice-grid button{font-size:12px}.dll-lab .dll-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.dll-lab .dll-pass{color:var(--dll-green)}.dll-lab .dll-warn{color:var(--dll-red)}",
    ".dll-lab .dll-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.dll-lab .dll-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0}.dll-lab .dll-presets button{font-size:12px}.dll-lab .dll-controls{display:grid;grid-template-columns:minmax(180px,.8fr) minmax(220px,1fr);gap:12px;align-items:end;margin:12px 0}.dll-lab .dll-control{display:grid;gap:5px;min-width:0}.dll-lab .dll-control label{color:var(--fg-soft,var(--muted,#6b6557));font-size:12.5px;font-weight:700}.dll-lab .dll-control output{color:var(--dll-blue);font-variant-numeric:tabular-nums}.dll-lab input[type=range]{width:100%;min-width:0;min-height:44px;margin:0;accent-color:var(--dll-blue)}",
    ".dll-lab .dll-stage{min-width:0;padding:8px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.dll-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#292722)}.dll-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.dll-lab .dll-axis{stroke:currentColor;stroke-width:1;stroke-opacity:.62}.dll-lab .dll-curve{fill:none;stroke:var(--dll-blue);stroke-width:2.5}.dll-lab .dll-tangent{fill:none;stroke:var(--dll-red);stroke-width:2.2;stroke-dasharray:6 4}.dll-lab .dll-secant{fill:none;stroke:var(--dll-gold);stroke-width:2}.dll-lab .dll-error-derivative{fill:none;stroke:var(--dll-red);stroke-width:2.4}.dll-lab .dll-error-remainder{fill:none;stroke:var(--dll-green);stroke-width:2.4}.dll-lab .dll-marker{fill:var(--dll-gold);stroke:var(--bg,#fff);stroke-width:1.5}.dll-lab .dll-small{font-size:11px;fill:var(--fg-soft,var(--muted,#6b6557))}.dll-lab .dll-title{font-size:13px;font-weight:750}",
    ".dll-lab .dll-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0}.dll-lab .dll-metric{min-width:0;padding:8px;border-top:2px solid var(--dll-blue);background:var(--block-bg,var(--bg,#fff))}.dll-lab .dll-metric:nth-child(2){border-color:var(--dll-gold)}.dll-lab .dll-metric:nth-child(3){border-color:var(--dll-green)}.dll-lab .dll-metric:nth-child(4){border-color:var(--dll-red)}.dll-lab .dll-metric span,.dll-lab .dll-metric small{display:block;color:var(--fg-soft,var(--muted,#6b6557));font-size:11px;line-height:1.4}.dll-lab .dll-metric strong{display:block;margin:2px 0;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".dll-lab .dll-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.dll-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.dll-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.dll-lab th,.dll-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.dll-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.dll-lab .dll-interpretation{margin-top:11px;padding:10px 12px;border-left:3px solid var(--dll-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.7}",
    "@media(max-width:850px){.dll-lab .dll-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.dll-lab .dll-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dll-lab .dll-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.dll-lab .dll-presets,.dll-lab .dll-choice-grid,.dll-lab .dll-controls{grid-template-columns:minmax(0,1fr)}.dll-lab .dll-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.dll-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * Math.max(1, Math.abs(left), Math.abs(right));
  }
  function formatNumber(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(value)) return "∞";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }
  function modelById(id) {
    for (var i = 0; i < PRESETS.length; i += 1) if (PRESETS[i].id === id) return PRESETS[i];
    return PRESETS[0];
  }
  function evaluate(input) {
    var source = input || {};
    var model = modelById(typeof source === "string" ? source : source.id);
    var h = finite(Number(source.h)) ? Number(source.h) : 0.1;
    if (Math.abs(h) < EPS) h = h < 0 ? -EPS : EPS;
    var f0 = model.fn(model.a);
    var value = model.fn(model.a + h);
    var secant = (value - f0) / h;
    var tangent = model.derivative === null ? null : f0 + model.derivative * h;
    return {
      id: model.id,
      kind: model.kind,
      a: model.a,
      h: h,
      f0: f0,
      value: value,
      derivative: model.derivative,
      secant: secant,
      tangent: tangent,
      derivativeError: model.derivative === null ? null : Math.abs(secant - model.derivative),
      linearizationError: tangent === null ? null : Math.abs(value - tangent),
      inverseSecant: model.kind === "zero" && value > 0 ? Math.sqrt(value) / value : null,
      oneSided: model.kind === "corner" ? { left: -1, right: 1 } : null
    };
  }
  function observedOrder(coarse, fine) {
    if (!finite(coarse) || !finite(fine) || coarse <= EPS || fine <= EPS) return null;
    return Math.log(fine / coarse) / Math.log(0.5);
  }
  function scalingTable(id, steps) {
    var values = steps || STEPS;
    var rows = values.map(function (h) { return evaluate({ id: id, h: h }); });
    return rows.map(function (row, index) {
      var previous = index ? rows[index - 1] : null;
      return {
        h: row.h,
        kind: row.kind,
        secant: row.secant,
        derivativeError: row.derivativeError,
        linearizationError: row.linearizationError,
        derivativeOrder: previous ? observedOrder(previous.derivativeError, row.derivativeError) : null,
        linearizationOrder: previous ? observedOrder(previous.linearizationError, row.linearizationError) : null,
        inverseSecant: row.inverseSecant
      };
    });
  }

  function appendChildren(parent, doc, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      parent.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return parent;
  }
  function attrs(node, values) {
    Object.keys(values || {}).forEach(function (key) {
      var value = values[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function element(doc, tag, values, children) { return appendChildren(attrs(doc.createElement(tag), values), doc, children); }
  function svgElement(doc, tag, values, children) { return appendChildren(attrs(doc.createElementNS(SVG_NS, tag), values), doc, children); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }
  function linePath(points, xMin, xMax, yMin, yMax, left, top, width, height) {
    return points.map(function (point, index) {
      var x = left + (point[0] - xMin) / (xMax - xMin) * width;
      var y = top + (yMax - point[1]) / (yMax - yMin) * height;
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
  }
  function addLabel(doc, svg, x, y, text, className) {
    svg.appendChild(svgElement(doc, "text", { x: x, y: y, className: className }, text));
  }
  function chart(doc, result, prefix) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 720 300", role: "img", "aria-labelledby": prefix + "-title " + prefix + "-desc" });
    svg.appendChild(svgElement(doc, "title", { id: prefix + "-title" }, "局部线性化与误差阶图"));
    svg.appendChild(svgElement(doc, "desc", { id: prefix + "-desc" }, "左侧显示函数与割线，右侧显示割线误差和线性化误差的有限缩放。"));
    var model = modelById(result.id);
    var left = 48, top = 40, width = 292, height = 205;
    var xMin = model.a - 0.5, xMax = model.a + 0.5, yValues = [], curve = [], tangent = [];
    for (var i = 0; i <= 80; i += 1) {
      var x = xMin + (xMax - xMin) * i / 80;
      var y = model.fn(x);
      yValues.push(y);
      curve.push([x, y]);
      if (model.derivative !== null) tangent.push([x, model.fn(model.a) + model.derivative * (x - model.a)]);
    }
    var yMin = Math.min.apply(null, yValues.concat(tangent.map(function (point) { return point[1]; })));
    var yMax = Math.max.apply(null, yValues.concat(tangent.map(function (point) { return point[1]; })));
    var yPad = Math.max(0.1, (yMax - yMin) * 0.12);
    yMin -= yPad;
    yMax += yPad;
    svg.appendChild(svgElement(doc, "rect", { x: left, y: top, width: width, height: height, className: "dll-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: linePath(curve, xMin, xMax, yMin, yMax, left, top, width, height), className: "dll-curve" }));
    if (tangent.length) svg.appendChild(svgElement(doc, "path", { d: linePath(tangent, xMin, xMax, yMin, yMax, left, top, width, height), className: "dll-tangent" }));
    var secant = [[model.a - result.h, model.fn(model.a) - result.h * result.secant], [model.a + result.h, model.fn(model.a + result.h)]];
    svg.appendChild(svgElement(doc, "path", { d: linePath(secant, xMin, xMax, yMin, yMax, left, top, width, height), className: "dll-secant" }));
    var xA = left + (model.a - xMin) / (xMax - xMin) * width;
    var yA = top + (yMax - model.fn(model.a)) / (yMax - yMin) * height;
    svg.appendChild(svgElement(doc, "circle", { cx: xA, cy: yA, r: 4, className: "dll-marker" }));
    addLabel(doc, svg, left, 24, "函数 / 切线 / 当前割线", "dll-title");
    addLabel(doc, svg, left, 267, "蓝 f，红虚线 L，金 secant", "dll-small");

    var right = 400, rightWidth = 270, rightHeight = 205;
    var rows = scalingTable(result.id);
    var logs = [];
    rows.forEach(function (row) {
      if (row.derivativeError > EPS) logs.push(Math.log10(row.derivativeError));
      if (row.linearizationError > EPS) logs.push(Math.log10(row.linearizationError));
    });
    var logMin = logs.length ? Math.min.apply(null, logs) - 0.2 : -4;
    var logMax = logs.length ? Math.max.apply(null, logs) + 0.2 : -1;
    var hMin = Math.log10(STEPS[STEPS.length - 1]);
    var hMax = Math.log10(STEPS[0]);
    svg.appendChild(svgElement(doc, "rect", { x: right, y: top, width: rightWidth, height: rightHeight, className: "dll-axis" }));
    var derivativePoints = rows.filter(function (row) { return row.derivativeError > EPS; }).map(function (row) { return [Math.log10(row.h), Math.log10(row.derivativeError)]; }).reverse();
    var remainderPoints = rows.filter(function (row) { return row.linearizationError > EPS; }).map(function (row) { return [Math.log10(row.h), Math.log10(row.linearizationError)]; }).reverse();
    if (derivativePoints.length) svg.appendChild(svgElement(doc, "path", { d: linePath(derivativePoints, hMin, hMax, logMin, logMax, right, top, rightWidth, rightHeight), className: "dll-error-derivative" }));
    if (remainderPoints.length) svg.appendChild(svgElement(doc, "path", { d: linePath(remainderPoints, hMin, hMax, logMin, logMax, right, top, rightWidth, rightHeight), className: "dll-error-remainder" }));
    addLabel(doc, svg, right, 24, "误差缩放（log h, log error）", "dll-title");
    addLabel(doc, svg, right, 267, "红 |secant-f'|，绿 |f-L|", "dll-small");
    return svg;
  }
  function metric(doc, label, value, note) {
    return element(doc, "div", { className: "dll-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value }), element(doc, "small", { text: note })]);
  }
  function tableFor(doc, result) {
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "固定解析模型的局部误差账本；观测阶来自相邻 h 减半" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["x 步长 h", "割线斜率", "|割线-f'|", "|f-L|", "观测阶", "反函数差商（y=h²）"].map(function (text) { return element(doc, "th", { text: text }); }))));
    var body = element(doc, "tbody");
    scalingTable(result.id).forEach(function (row) {
      var order = row.derivativeOrder === null && row.linearizationOrder === null ? "—" : formatNumber(row.derivativeOrder, 2) + " / " + formatNumber(row.linearizationOrder, 2);
      body.appendChild(element(doc, "tr", {}, [
        formatNumber(row.h, 3),
        result.kind === "corner" ? "左 -1 / 右 +1" : formatNumber(row.secant, 5),
        row.derivativeError === null ? "不存在（不可导）" : formatNumber(row.derivativeError, 6),
        row.linearizationError === null ? "不定义切线余项" : formatNumber(row.linearizationError, 6),
        order,
        row.inverseSecant === null ? "—" : formatNumber(row.inverseSecant, 4)
      ].map(function (text) { return element(doc, "td", { text: text }); })));
    });
    table.appendChild(body);
    return table;
  }
  function interpretation(result) {
    if (result.kind === "corner") return "|x| 在 0 的左右割线斜率永远分居 -1 与 +1；有限网格可以显示分叉，却不能制造一个不存在的导数。";
    if (result.kind === "zero") return "x² 在 0 的切线是常值 0，函数误差仍为 O(h²)，但反函数 sqrt(y) 的差商 1/sqrt(y) 发散；逆函数公式需要 f'(a)≠0。";
    return "在 C² 模型的固定点，割线斜率逼近 f'(a) 的误差是一阶，函数值线性化余项是二阶；表格是当前模型的有限证据。";
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || root.getAttribute("data-dll-mounted") === "true") return;
    root.setAttribute("data-dll-mounted", "true");
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "dll-" + INSTANCE;
    var state = { id: "quadratic", h: 0.1, revealed: false, predictions: [null, null, null] };
    var shell = element(doc, "div", { className: "dll-lab" });
    shell.appendChild(element(doc, "h3", { text: "导数的局部线性化：割线、切线与反例" }));
    shell.appendChild(element(doc, "p", { className: "dll-note", text: "先预测，再揭示固定解析模型的误差缩放。数值审计不替代导数定义、Taylor 定理或逆函数定理。" }));
    var prediction = element(doc, "div", { className: "dll-prediction" });
    prediction.appendChild(element(doc, "strong", { className: "dll-prediction-title", text: "预测门：完成三项后揭晓" }));
    var questions = [
      { prompt: "1. 若 f 在 a 附近二阶可导，割线斜率与 f'(a) 的误差是什么阶？", choices: [["linear", "O(|h|)"], ["quadratic", "O(h²)"], ["none", "没有统一阶"]], expected: "linear" },
      { prompt: "2. 同一条件下，f(a+h) 与切线 L_a(a+h) 的误差是什么阶？", choices: [["linear", "O(|h|)"], ["quadratic", "O(h²)"], ["constant", "必为 0"]], expected: "quadratic" },
      { prompt: "3. |x| 在 0 与 x² 在 0 能否直接套用普通导数/逆函数公式？", choices: [["fails", "不能；两处都缺少所需条件"], ["always", "能，有限差商已足够"], ["corner-only", "只有 |x| 需要小心"]], expected: "fails" }
    ];
    var choices = [];
    questions.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset");
      fieldset.appendChild(element(doc, "legend", { text: question.prompt }));
      var group = element(doc, "div", { className: "dll-choice-grid", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[questionIndex] = choice[0]; renderPrediction(); });
        choices.push({ index: questionIndex, value: choice[0], node: button });
        group.appendChild(button);
      });
      fieldset.appendChild(group);
      prediction.appendChild(fieldset);
    });
    var actions = element(doc, "div", { className: "dll-actions" });
    var revealButton = element(doc, "button", { type: "button", className: "dll-primary", text: "核对预测并揭晓" });
    var resetButton = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(revealButton);
    actions.appendChild(resetButton);
    prediction.appendChild(actions);
    var feedback = element(doc, "p", { className: "dll-feedback", role: "status", "aria-live": "polite", text: "请完成三项预测。" });
    prediction.appendChild(feedback);
    shell.appendChild(prediction);

    var reveal = element(doc, "section", { className: "dll-reveal", hidden: true, "aria-label": "局部线性化揭晓结果" });
    reveal.appendChild(element(doc, "h4", { text: "模型与步长" }));
    var presetRow = element(doc, "div", { className: "dll-presets", role: "group", "aria-label": "函数预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", text: preset.label, "aria-pressed": "false" });
      button.addEventListener("click", function () { state.id = preset.id; state.h = 0.1; render(); });
      presetButtons.push({ id: preset.id, node: button });
      presetRow.appendChild(button);
    });
    reveal.appendChild(presetRow);
    var controls = element(doc, "div", { className: "dll-controls" });
    var hId = prefix + "-h";
    var hOutput = element(doc, "output", { for: hId, text: "0.1" });
    var hLabel = element(doc, "label", { htmlFor: hId });
    hLabel.appendChild(doc.createTextNode("当前正步长 |h|："));
    hLabel.appendChild(hOutput);
    var hInput = element(doc, "input", { id: hId, type: "range", min: "0.025", max: "0.4", step: "0.025", value: "0.1", "aria-label": "局部线性化步长" });
    hInput.addEventListener("input", function () { state.h = Number(hInput.value); render(); });
    controls.appendChild(element(doc, "div", { className: "dll-control" }, [hLabel, hInput]));
    controls.appendChild(element(doc, "p", { className: "dll-note", text: "观测阶只来自固定表格的相邻步长比；切换预设会重新计算。" }));
    reveal.appendChild(controls);
    var stage = element(doc, "div", { className: "dll-stage" });
    var metrics = element(doc, "div", { className: "dll-metrics", "aria-label": "当前误差读数" });
    var chartHolder = element(doc, "div");
    var tableHolder = element(doc, "div", { className: "dll-table-wrap" });
    var status = element(doc, "p", { className: "dll-interpretation", role: "status", "aria-live": "polite" });
    stage.appendChild(metrics);
    stage.appendChild(chartHolder);
    stage.appendChild(tableHolder);
    stage.appendChild(status);
    reveal.appendChild(stage);
    shell.appendChild(reveal);
    clear(root);
    root.appendChild(shell);

    function announce(message) { if (api && typeof api.announce === "function") api.announce(root, message); }
    function renderPrediction() {
      choices.forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[item.index] === item.value ? "true" : "false"); });
    }
    function render() {
      var result = evaluate({ id: state.id, h: state.h });
      hInput.value = String(state.h);
      hOutput.textContent = formatNumber(state.h, 3);
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.id ? "true" : "false"); });
      reveal.hidden = !state.revealed;
      if (!state.revealed) return;
      clear(metrics);
      metrics.appendChild(metric(doc, "f'(a)", result.derivative === null ? "不存在" : formatNumber(result.derivative, 4), result.kind === "corner" ? "左右斜率不相等" : "解析导数"));
      metrics.appendChild(metric(doc, "割线斜率", result.kind === "corner" ? "-1 / +1" : formatNumber(result.secant, 4), "当前 h 的有限值"));
      metrics.appendChild(metric(doc, "|f-L|", result.linearizationError === null ? "—" : formatNumber(result.linearizationError, 6), "函数值线性化误差"));
      metrics.appendChild(metric(doc, "反函数差商", result.inverseSecant === null ? "—" : formatNumber(result.inverseSecant, 4), "逆变量增量 y=h²"));
      clear(chartHolder);
      chartHolder.appendChild(chart(doc, result, prefix));
      clear(tableHolder);
      tableHolder.appendChild(tableFor(doc, result));
      status.textContent = interpretation(result);
    }
    revealButton.addEventListener("click", function () {
      var missing = state.predictions.filter(function (value) { return value === null; }).length;
      if (missing) {
        feedback.className = "dll-feedback dll-warn";
        feedback.textContent = "还差 " + missing + " 项预测。";
        announce(feedback.textContent);
        return;
      }
      var score = questions.reduce(function (sum, question, index) { return sum + (question.expected === state.predictions[index] ? 1 : 0); }, 0);
      state.revealed = true;
      feedback.className = "dll-feedback " + (score === 3 ? "dll-pass" : "dll-warn");
      feedback.textContent = "预测 " + score + "/3。现在可以切换模型，观察割线误差与线性化余项。";
      render();
      announce(feedback.textContent);
    });
    resetButton.addEventListener("click", function () {
      state = { id: "quadratic", h: 0.1, revealed: false, predictions: [null, null, null] };
      feedback.className = "dll-feedback";
      feedback.textContent = "预测已重置，请重新作答。";
      renderPrediction();
      render();
      announce(feedback.textContent);
    });
    renderPrediction();
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) throw new Error("derivative-local-linearity self-test: " + message);
    }
    var quadratic = evaluate({ id: "quadratic", h: 0.1 });
    check(near(quadratic.secant, 2.1), "quadratic secant");
    check(near(quadratic.derivativeError, 0.1) && near(quadratic.linearizationError, 0.01), "quadratic errors");
    var table = scalingTable("quadratic");
    check(table[1].derivativeOrder > 0.99 && table[1].derivativeOrder < 1.01, "first-order scaling");
    check(table[1].linearizationOrder > 1.99 && table[1].linearizationOrder < 2.01, "second-order scaling");
    check(near(evaluate({ id: "cubic", h: -0.1 }).secant, 2.71), "cubic signed secant");
    var corner = evaluate({ id: "corner", h: 0.1 });
    check(corner.derivative === null && corner.oneSided.left === -1 && corner.oneSided.right === 1, "corner slopes");
    check(near(evaluate({ id: "flat-inverse", h: 0.1 }).inverseSecant, 10), "zero derivative inverse boundary");
    check(JSON.stringify(scalingTable("quadratic")) === JSON.stringify(scalingTable("quadratic")), "deterministic ledger");
    PRESETS.forEach(function (preset) { check(evaluate({ id: preset.id, h: 0.1 }).id === preset.id, preset.id + " preset"); });
    return { checks: checks, presets: PRESETS.length, deterministic: true };
  }
  return { PRESETS: PRESETS, modelById: modelById, evaluate: evaluate, observedOrder: observedOrder, scalingTable: scalingTable, mount: mount, selfTest: selfTest };
});
