(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-ray-matrix", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("photo-ray-matrix self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-ray-matrix self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var LAB_ID = "photo-ray-matrix";
  var STYLE_ID = "photo-ray-matrix-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var EPS = 1e-9;

  var STYLE_TEXT = [
    ".prm-lab{--prm-blue:var(--cl-blue,#315f9d);--prm-green:var(--cl-green,#39734d);--prm-gold:var(--cl-gold,#9b6a12);--prm-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".prm-lab *,.prm-lab *::before,.prm-lab *::after{box-sizing:border-box}.prm-lab [hidden]{display:none!important}.prm-lab h3,.prm-lab h4{margin:0;letter-spacing:0}.prm-lab h3{font-size:1.15rem}.prm-lab p{margin:.65em 0}.prm-lab button,.prm-lab input{font:inherit;letter-spacing:0}.prm-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.prm-lab button:hover{border-color:var(--prm-blue)}.prm-lab button:focus-visible,.prm-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.prm-lab button[aria-pressed=true],.prm-lab .prm-primary{border-color:var(--prm-blue);background:var(--prm-blue);color:var(--bg);font-weight:750}.prm-lab .prm-note,.prm-lab .prm-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.prm-lab .prm-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--prm-gold);background:var(--block-bg,var(--bg))}.prm-lab .prm-question{margin:0 0 12px;padding:0;border:0}.prm-lab .prm-question:last-of-type{margin-bottom:0}.prm-lab .prm-question legend{max-width:100%;margin-bottom:7px;font-size:13px;font-weight:750;line-height:1.5}.prm-lab .prm-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.prm-lab .prm-choices button{font-size:12px}.prm-lab .prm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.prm-lab .prm-actions>*{flex:1 1 170px}.prm-lab .prm-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.prm-lab .prm-pass{color:var(--prm-green)}.prm-lab .prm-warn{color:var(--prm-red)}.prm-lab .prm-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.prm-lab .prm-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:12px 0;align-items:end}.prm-lab .prm-control{display:grid;gap:5px;min-width:0}.prm-lab .prm-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.prm-lab .prm-control output{color:var(--prm-blue);font-variant-numeric:tabular-nums}.prm-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--prm-blue)}.prm-lab .prm-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}.prm-lab .prm-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.prm-lab .prm-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--fg-soft);font-size:13px}.prm-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.prm-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.prm-lab .prm-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.14}.prm-lab .prm-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.62}.prm-lab .prm-ray-a{stroke:var(--prm-blue);fill:none;stroke-width:2.5}.prm-lab .prm-ray-b{stroke:var(--prm-gold);fill:none;stroke-width:2.5}.prm-lab .prm-ray-c{stroke:var(--prm-green);fill:none;stroke-width:2.5}.prm-lab .prm-lens{stroke:var(--prm-red);stroke-width:4}.prm-lab .prm-focus{fill:var(--prm-red);stroke:var(--bg);stroke-width:2}.prm-lab .prm-label{font-size:11px;fill:var(--fg-soft)}.prm-lab .prm-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:12px}.prm-lab .prm-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.prm-lab .prm-metric:nth-child(5n+1){border-color:var(--prm-blue)}.prm-lab .prm-metric:nth-child(5n+2){border-color:var(--prm-gold)}.prm-lab .prm-metric:nth-child(5n+3){border-color:var(--prm-green)}.prm-lab .prm-metric:nth-child(5n+4){border-color:var(--prm-red)}.prm-lab .prm-metric span{display:block;color:var(--fg-soft);font-size:11px}.prm-lab .prm-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.prm-lab .prm-formula{margin:12px 0 0;padding:9px 11px;border-left:3px solid var(--prm-blue);background:var(--bg);font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65;overflow-x:auto}.prm-lab .prm-reset{margin-top:10px;color:var(--fg-soft)}@media(max-width:850px){.prm-lab .prm-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.prm-lab .prm-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:620px){.prm-lab .prm-choices{grid-template-columns:minmax(0,1fr)}.prm-lab .prm-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:400px){.prm-lab .prm-controls,.prm-lab .prm-metrics{grid-template-columns:minmax(0,1fr)}.prm-lab .prm-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){.prm-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function normalize(value, fallback, minimum, maximum) {
    return clamp(finite(Number(value), fallback), minimum, maximum);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function matrixMultiply(left, right) {
    return [
      [left[0][0] * right[0][0] + left[0][1] * right[1][0], left[0][0] * right[0][1] + left[0][1] * right[1][1]],
      [left[1][0] * right[0][0] + left[1][1] * right[1][0], left[1][0] * right[0][1] + left[1][1] * right[1][1]]
    ];
  }

  function propagation(distance) {
    return [[1, distance], [0, 1]];
  }

  function lens(focalLength) {
    return [[1, 0], [-1 / focalLength, 1]];
  }

  function systemMatrix(focalLength, firstDistance, secondDistance) {
    return matrixMultiply(propagation(secondDistance), matrixMultiply(lens(focalLength), propagation(firstDistance)));
  }

  function applyMatrix(matrix, ray) {
    return [matrix[0][0] * ray[0] + matrix[0][1] * ray[1], matrix[1][0] * ray[0] + matrix[1][1] * ray[1]];
  }

  function evaluate(input) {
    var source = input || {};
    var f = normalize(source.f, 50, 20, 100);
    var d1 = normalize(source.d1, 20, 0, 80);
    var d2 = normalize(source.d2, 50, 0, 100);
    var height = normalize(source.height, 4, 1, 6);
    var matrix = systemMatrix(f, d1, d2);
    var determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    var rays = [-height, 0, height].map(function (y) {
      var afterFirst = applyMatrix(propagation(d1), [y, 0]);
      var afterLens = applyMatrix(lens(f), afterFirst);
      var afterSecond = applyMatrix(propagation(d2), afterLens);
      return { input: [y, 0], afterFirst: afterFirst, afterLens: afterLens, output: afterSecond };
    });
    return {
      f: f,
      d1: d1,
      d2: d2,
      height: height,
      matrix: matrix,
      determinant: determinant,
      focus: Math.abs(matrix[0][0]) < 1e-6,
      fNumber: f / (2 * height),
      rays: rays
    };
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "htmlFor") node.setAttribute("for", value);
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs), children);
  }

  function svgElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    var text = Math.abs(value) < 0.001 && value !== 0 ? value.toExponential(Math.min(places, 4)) : value.toFixed(places);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function installStyles(doc) {
    if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "prm-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    root.classList.add("prm-lab");
    clear(root);

    var state = { f: 50, d1: 20, d2: 50, height: 4, revealed: false, predictions: [null, null, null] };
    var questions = [
      { prompt: "默认系统的平行光会在输出面共焦吗？", options: ["会，A=0", "不会，A=1", "看 det M"], answer: 0 },
      { prompt: "理想 P/L 连乘的行列式应接近？", options: ["0", "1", "随焦距变",], answer: 1 },
      { prompt: "孔径直径加倍而焦距不变，F/# 如何变？", options: ["加倍", "减半", "不变"], answer: 1 }
    ];

    root.appendChild(element(doc, "h3", { text: "预测闸门：先读 A，再追踪三条光线" }));
    root.appendChild(element(doc, "p", { className: "prm-note", text: "先完成三个预测；揭示后可逐元件推进固定的近轴光线，并检查矩阵不变量。" }));
    var prediction = element(doc, "div", { className: "prm-prediction" });
    var choiceButtons = [];
    questions.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset", { className: "prm-question" });
      fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
      var choices = element(doc, "div", { className: "prm-choices" });
      question.options.forEach(function (label, optionIndex) {
        var button = element(doc, "button", {
          type: "button",
          text: label,
          "aria-pressed": "false",
          onclick: function () {
            state.predictions[questionIndex] = optionIndex;
            choiceButtons[questionIndex].forEach(function (item) { item.setAttribute("aria-pressed", "false"); });
            button.setAttribute("aria-pressed", "true");
          }
        });
        choices.appendChild(button);
        if (!choiceButtons[questionIndex]) choiceButtons[questionIndex] = [];
        choiceButtons[questionIndex].push(button);
      });
      fieldset.appendChild(choices);
      prediction.appendChild(fieldset);
    });
    var feedback = element(doc, "p", { className: "prm-feedback", "aria-live": "polite" });
    var actions = element(doc, "div", { className: "prm-actions" });
    var reveal = element(doc, "button", { type: "button", className: "prm-primary", text: "揭示计算" });
    var clearPredictions = element(doc, "button", { type: "button", text: "清空预测" });
    actions.appendChild(reveal);
    actions.appendChild(clearPredictions);
    prediction.appendChild(actions);
    prediction.appendChild(feedback);
    root.appendChild(prediction);

    var revealed = element(doc, "div", { className: "prm-revealed", hidden: true });
    revealed.appendChild(element(doc, "h4", { text: "ABCD 轨迹与焦面证书" }));
    var controls = element(doc, "div", { className: "prm-controls" });
    function addRange(label, key, min, max, step, suffix) {
      var output = element(doc, "output", { text: format(state[key], 2) + suffix });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state[key], "aria-label": label });
      input.addEventListener("input", function () { state[key] = Number(input.value); output.textContent = format(state[key], 2) + suffix; render(); });
      controls.appendChild(element(doc, "div", { className: "prm-control" }, [element(doc, "label", { text: label }), output, input, element(doc, "div", { className: "prm-scale" }, [element(doc, "span", { text: String(min) + suffix }), element(doc, "span", { text: String(max) + suffix })])]));
    }
    addRange("前段传播 d₁", "d1", 0, 80, 1, " mm");
    addRange("焦距 f", "f", 20, 100, 1, " mm");
    addRange("后段传播 d₂", "d2", 0, 100, 1, " mm");
    addRange("输入高度 |y|", "height", 1, 6, 0.5, " mm");
    revealed.appendChild(controls);
    var stage = element(doc, "div", { className: "prm-stage" });
    var stageTitle = element(doc, "div", { className: "prm-stage-title" }, [element(doc, "span", { text: "光轴 z 与高度 y" }), element(doc, "span", { className: "prm-stage-status", text: "" })]);
    var chart = svgElement(doc, "svg", { viewBox: "0 0 560 300", role: "img", "aria-label": "近轴光线通过传播段和薄透镜的状态轨迹" });
    stage.appendChild(stageTitle);
    stage.appendChild(chart);
    revealed.appendChild(stage);
    var formula = element(doc, "div", { className: "prm-formula", text: "M = P(d₂) · L(f) · P(d₁)" });
    revealed.appendChild(formula);
    var metrics = element(doc, "div", { className: "prm-metrics" });
    var metricNodes = [metric(doc, "A"), metric(doc, "B (mm)"), metric(doc, "C (1/mm)"), metric(doc, "D"), metric(doc, "det M")];
    metricNodes.forEach(function (item) { metrics.appendChild(item.node); });
    revealed.appendChild(metrics);
    var reset = element(doc, "button", { type: "button", className: "prm-reset", text: "重置实验" });
    revealed.appendChild(reset);
    root.appendChild(revealed);

    function render() {
      var result = evaluate(state);
      var matrix = result.matrix;
      metricNodes[0].value.textContent = format(matrix[0][0]);
      metricNodes[1].value.textContent = format(matrix[0][1], 2);
      metricNodes[2].value.textContent = format(matrix[1][0], 4);
      metricNodes[3].value.textContent = format(matrix[1][1]);
      metricNodes[4].value.textContent = format(result.determinant, 5);
      stageTitle.querySelector(".prm-stage-status").textContent = result.focus ? "A≈0：平行光在输出面聚焦" : "A≠0：输出面仍有高度残差";
      formula.textContent = "M = [[" + format(matrix[0][0]) + ", " + format(matrix[0][1], 2) + "], [" + format(matrix[1][0], 4) + ", " + format(matrix[1][1]) + "]],  F/#≈" + format(result.fNumber, 2);
      clear(chart);
      var width = 560;
      var left = 45;
      var right = 15;
      var top = 25;
      var bottom = 245;
      var total = Math.max(1, result.d1 + result.d2);
      var maxY = Math.max(result.height, 1);
      result.rays.forEach(function (ray) { maxY = Math.max(maxY, Math.abs(ray.output[0]), Math.abs(ray.afterLens[0])); });
      var scaleY = Math.min(24, 85 / maxY);
      function x(z) { return left + (width - left - right) * z / total; }
      function y(value) { return (top + bottom) / 2 - value * scaleY; }
      for (var gridY = -Math.ceil(maxY); gridY <= Math.ceil(maxY); gridY += 1) {
        chart.appendChild(svgElement(doc, "line", { class: "prm-grid", x1: left, x2: width - right, y1: y(gridY), y2: y(gridY) }));
      }
      chart.appendChild(svgElement(doc, "line", { class: "prm-axis", x1: left, x2: width - right, y1: y(0), y2: y(0) }));
      chart.appendChild(svgElement(doc, "line", { class: "prm-lens", x1: x(result.d1), x2: x(result.d1), y1: top, y2: bottom }));
      chart.appendChild(svgElement(doc, "text", { class: "prm-label", x: x(result.d1) + 6, y: top + 13, text: "L(f)" }));
      chart.appendChild(svgElement(doc, "text", { class: "prm-label", x: left, y: bottom + 21, text: "z=0" }));
      chart.appendChild(svgElement(doc, "text", { class: "prm-label", x: x(result.d1) - 13, y: bottom + 21, text: "d₁" }));
      chart.appendChild(svgElement(doc, "text", { class: "prm-label", x: width - right - 35, y: bottom + 21, text: "输出" }));
      var classes = ["prm-ray-a", "prm-ray-b", "prm-ray-c"];
      result.rays.forEach(function (ray, index) {
        var points = [[0, ray.input[0]], [result.d1, ray.afterFirst[0]], [result.d1, ray.afterLens[0]], [total, ray.output[0]]];
        chart.appendChild(svgElement(doc, "polyline", { class: classes[index], points: points.map(function (point) { return x(point[0]) + "," + y(point[1]); }).join(" ") }));
        chart.appendChild(svgElement(doc, "circle", { class: "prm-focus", cx: x(total), cy: y(ray.output[0]), r: 3.5 }));
      });
      chart.appendChild(svgElement(doc, "text", { class: "prm-label", x: left + 2, y: top - 7, text: "y / mm" }));
    }

    reveal.addEventListener("click", function () {
      if (state.predictions.some(function (value) { return value === null; })) {
        feedback.className = "prm-feedback prm-warn";
        feedback.textContent = "请先完成三个预测，再打开矩阵账本。";
        return;
      }
      var score = state.predictions.reduce(function (sum, value, index) { return sum + (value === questions[index].answer ? 1 : 0); }, 0);
      feedback.className = "prm-feedback " + (score === questions.length ? "prm-pass" : "prm-warn");
      feedback.textContent = "预测 " + score + "/" + questions.length + "。现在把 A=0 的焦面条件与 det M=1 分开。";
      state.revealed = true;
      revealed.hidden = false;
      render();
      announce(api, root, feedback.textContent);
    });
    clearPredictions.addEventListener("click", function () {
      state.predictions = [null, null, null];
      choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); });
      feedback.className = "prm-feedback";
      feedback.textContent = "预测已清空。";
    });
    reset.addEventListener("click", function () {
      state.f = 50; state.d1 = 20; state.d2 = 50; state.height = 4;
      revealed.hidden = true;
      feedback.className = "prm-feedback";
      feedback.textContent = "实验已重新上锁，请再预测。";
      announce(api, root, "近轴光线矩阵实验已重置。");
    });
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    var matrix = systemMatrix(50, 20, 50);
    check(near(matrix[0][0], 0), "default output is a focus plane");
    check(near(matrix[0][1], 50), "default B coefficient");
    check(near(matrix[1][0], -0.02), "default C coefficient");
    check(near(matrix[1][1], 0.6), "default D coefficient");
    check(near(matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0], 1), "ABCD determinant invariant");
    var ray = applyMatrix(matrix, [4, 0]);
    check(near(ray[0], 0) && near(ray[1], -0.08), "parallel ray propagation");
    var scaled = applyMatrix(matrix, [2, 0]);
    check(near(scaled[0], 0) && near(scaled[1], -0.04), "linearity across heights");
    var changed = evaluate({ f: 40, d1: 20, d2: 50, height: 4 });
    check(!changed.focus && near(changed.determinant, 1), "defocused system preserves determinant");
    return { checks: checks };
  }

  return { matrixMultiply: matrixMultiply, systemMatrix: systemMatrix, applyMatrix: applyMatrix, evaluate: evaluate, mount: mount, selfTest: selfTest };
});
