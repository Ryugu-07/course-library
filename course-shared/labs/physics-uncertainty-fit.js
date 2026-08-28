(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-uncertainty-fit", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-uncertainty-fit self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-uncertainty-fit self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-uncertainty-fit-styles";
  var STYLE_TEXT = [
    ".puf-lab{--puf-blue:var(--cl-blue,#315f9d);--puf-green:var(--cl-green,#39734d);--puf-gold:var(--cl-gold,#9b6a12);--puf-red:var(--cl-red,#b64335);color:var(--fg);line-height:1.55;max-width:100%;min-width:0;overflow-wrap:anywhere}",
    ".puf-lab *,.puf-lab *::before,.puf-lab *::after{box-sizing:border-box}.puf-lab [hidden]{display:none!important}.puf-lab h3,.puf-lab h4{margin:0;letter-spacing:0}.puf-lab h3{font-size:1.15rem}.puf-lab p{margin:.65em 0}.puf-lab button,.puf-lab input,.puf-lab select{font:inherit;letter-spacing:0}.puf-lab button,.puf-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.puf-lab button:hover{border-color:var(--puf-blue)}.puf-lab button:focus-visible,.puf-lab input:focus-visible,.puf-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.puf-lab button[aria-pressed=true],.puf-lab .puf-primary{background:var(--puf-blue);border-color:var(--puf-blue);color:var(--bg);font-weight:750}.puf-note,.puf-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.puf-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--puf-gold);background:var(--block-bg,var(--bg))}.puf-question{margin:0 0 12px;padding:0;border:0}.puf-question:last-of-type{margin-bottom:0}.puf-question legend{max-width:100%;margin-bottom:7px;font-size:13px;font-weight:750;line-height:1.5}.puf-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.puf-choices button{font-size:12px}.puf-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.puf-actions>*{flex:1 1 170px}.puf-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.puf-pass{color:var(--puf-green)}.puf-warn{color:var(--puf-red)}.puf-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.puf-modes{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}.puf-modes button{flex:1 1 150px}.puf-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0;align-items:end}.puf-control{display:grid;gap:5px;min-width:0}.puf-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.puf-control output{color:var(--puf-blue);font-variant-numeric:tabular-nums}.puf-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--puf-blue)}.puf-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}.puf-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.puf-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--fg-soft);font-size:13px}.puf-stage svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.puf-stage svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.puf-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.65}.puf-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.14}.puf-curve{fill:none;stroke:var(--puf-blue);stroke-width:2.5}.puf-secondary{fill:none;stroke:var(--puf-gold);stroke-width:2.2;stroke-dasharray:6 4}.puf-marker{fill:var(--puf-red);stroke:var(--bg);stroke-width:1.5}.puf-bar{fill:var(--puf-green);fill-opacity:.78}.puf-label{font-size:11px;fill:var(--fg-soft)}.puf-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.puf-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.puf-metric:nth-child(4n+1){border-color:var(--puf-blue)}.puf-metric:nth-child(4n+2){border-color:var(--puf-gold)}.puf-metric:nth-child(4n+3){border-color:var(--puf-green)}.puf-metric:nth-child(4n+4){border-color:var(--puf-red)}.puf-metric span{display:block;color:var(--fg-soft);font-size:11px}.puf-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.puf-formula{margin:12px 0 0;padding:9px 11px;border-left:3px solid var(--puf-blue);background:var(--bg);font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65;overflow-x:auto}.puf-reset{margin-top:10px;color:var(--fg-soft)}@media(max-width:900px){.puf-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.puf-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.puf-choices{grid-template-columns:minmax(0,1fr)}.puf-controls,.puf-metrics{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.puf-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  var DATA_X = [0, 1, 2, 3, 4, 5];
  var DATA_Y = [1.02, 2.44, 4.07, 5.70, 7.59, 9.46];
  var ID_SERIAL = 0;

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function uniqueId(prefix) { ID_SERIAL += 1; return prefix + "-" + ID_SERIAL; }
  function finite(value, fallback) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    var text = Math.abs(value) > 0 && Math.abs(value) < 0.001 ? value.toExponential(Math.min(places, 4)) : value.toFixed(places);
    return text.indexOf(".") < 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
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
  function element(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElement(tag), attrs), children); }
  function svgElement(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function installStyles(doc) {
    if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style);
  }
  function metric(doc, label) { var value = element(doc, "strong", { text: "—" }); return { node: element(doc, "div", { className: "puf-metric" }, [element(doc, "span", { text: label }), value]), value: value }; }

  function propagate(input) {
    var source = input || {};
    var L = clamp(finite(Number(source.L), 1), 0.1, 3);
    var T = clamp(finite(Number(source.T), 2.006), 0.1, 10);
    var sigmaL = clamp(finite(Number(source.sigmaL), 0.005), 0.0001, 0.1);
    var sigmaT = clamp(finite(Number(source.sigmaT), 0.010), 0.0001, 0.1);
    var rho = clamp(finite(Number(source.rho), 0.6), -0.95, 0.95);
    var g = 4 * Math.PI * Math.PI * L / (T * T);
    var dL = g / L;
    var dT = -2 * g / T;
    var covariance = rho * sigmaL * sigmaT;
    var varianceL = dL * dL * sigmaL * sigmaL;
    var varianceT = dT * dT * sigmaT * sigmaT;
    var covarianceTerm = 2 * dL * dT * covariance;
    var variance = Math.max(0, varianceL + varianceT + covarianceTerm);
    var varianceNoCovariance = varianceL + varianceT;
    return { L: L, T: T, sigmaL: sigmaL, sigmaT: sigmaT, rho: rho, g: g, dL: dL, dT: dT, covariance: covariance, varianceL: varianceL, varianceT: varianceT, covarianceTerm: covarianceTerm, variance: variance, uncertainty: Math.sqrt(variance), varianceNoCovariance: varianceNoCovariance, uncertaintyNoCovariance: Math.sqrt(varianceNoCovariance), relativeUncertainty: Math.sqrt(variance) / Math.abs(g) };
  }

  function solve(matrix, vector) {
    var n = vector.length;
    var a = matrix.map(function (row, index) { return row.slice().concat([vector[index]]); });
    for (var column = 0; column < n; column += 1) {
      var pivot = column;
      for (var row = column + 1; row < n; row += 1) if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
      if (Math.abs(a[pivot][column]) < 1e-12) throw new RangeError("singular normal matrix");
      var swapped = a[column]; a[column] = a[pivot]; a[pivot] = swapped;
      var divisor = a[column][column];
      for (var j = column; j <= n; j += 1) a[column][j] /= divisor;
      for (var other = 0; other < n; other += 1) {
        if (other === column) continue;
        var factor = a[other][column];
        for (var k = column; k <= n; k += 1) a[other][k] -= factor * a[column][k];
      }
    }
    return a.map(function (row) { return row[n]; });
  }

  function fitModel(model, sigma) {
    var degree = model === "quadratic" ? 2 : 1;
    var uncertainty = clamp(finite(Number(sigma), 0.12), 0.02, 0.5);
    var count = degree + 1;
    var normal = [];
    var right = [];
    for (var i = 0; i < count; i += 1) {
      normal[i] = [];
      for (var j = 0; j < count; j += 1) {
        normal[i][j] = DATA_X.reduce(function (sum, x) { return sum + Math.pow(x, i + j); }, 0) / (uncertainty * uncertainty);
      }
      right[i] = DATA_X.reduce(function (sum, x, index) { return sum + Math.pow(x, i) * DATA_Y[index]; }, 0) / (uncertainty * uncertainty);
    }
    var coefficients = solve(normal, right);
    var predictions = DATA_X.map(function (x) { return coefficients.reduce(function (sum, coefficient, index) { return sum + coefficient * Math.pow(x, index); }, 0); });
    var residuals = DATA_Y.map(function (value, index) { return value - predictions[index]; });
    var standardized = residuals.map(function (value) { return value / uncertainty; });
    var chiSquare = standardized.reduce(function (sum, value) { return sum + value * value; }, 0);
    var dof = DATA_X.length - count;
    var endMean = (residuals[0] + residuals[residuals.length - 1]) / 2;
    var middleMean = residuals.slice(1, -1).reduce(function (sum, value) { return sum + value; }, 0) / (residuals.length - 2);
    return { model: model === "quadratic" ? "quadratic" : "linear", sigma: uncertainty, coefficients: coefficients, predictions: predictions, residuals: residuals, standardized: standardized, chiSquare: chiSquare, dof: dof, reducedChiSquare: chiSquare / dof, maxStandardized: Math.max.apply(null, standardized.map(function (value) { return Math.abs(value); })), curvatureContrast: middleMean - endMean };
  }

  function initialState() {
    return { mode: "propagate", L: 1, T: 2.006, sigmaL: 0.005, sigmaT: 0.010, rho: 0.6, model: "linear", dataSigma: 0.12, predictions: [null, null, null, null], revealed: false };
  }

  function resetState(state) {
    var target = state || {};
    var defaults = initialState();
    Object.keys(defaults).forEach(function (key) { target[key] = Array.isArray(defaults[key]) ? defaults[key].slice() : defaults[key]; });
    return target;
  }

  function makeRange(doc, parent, label, key, min, max, step, digits, suffix, state, onInput) {
    var inputId = uniqueId("puf-" + key);
    var output = element(doc, "output", { for: inputId, text: format(state[key], digits) + suffix });
    var input = element(doc, "input", { id: inputId, type: "range", min: min, max: max, step: step, value: state[key], "aria-label": label });
    input.addEventListener("input", function () { state[key] = Number(input.value); output.textContent = format(state[key], digits) + suffix; onInput(); });
    var maxScale = element(doc, "span", { text: String(max) + suffix });
    parent.appendChild(element(doc, "div", { className: "puf-control" }, [element(doc, "label", { "for": inputId, text: label }), output, input, element(doc, "div", { className: "puf-scale" }, [element(doc, "span", { text: String(min) + suffix }), maxScale])]));
    return { key: key, input: input, output: output, digits: digits, suffix: suffix, maxScale: maxScale };
  }

  function drawPropagation(doc, chart, result) {
    clear(chart);
    chart.appendChild(svgElement(doc, "title", { text: "Jacobian 不确定度传播与协方差项" }));
    chart.appendChild(svgElement(doc, "desc", { text: "左图显示两个独立方差贡献和协方差交叉项，右图比较含协方差与忽略协方差的标准不确定度。" }));
    var left = 52, split = 340, right = 638, top = 36, bottom = 274;
    var barTop = 58, barBottom = 246, zeroY = 152, halfHeight = 78;
    function line(x1, y1, x2, y2, className) { chart.appendChild(svgElement(doc, "line", { class: className || "puf-axis", x1: x1, y1: y1, x2: x2, y2: y2 })); }
    function text(x, y, value, attrs) { chart.appendChild(svgElement(doc, "text", Object.assign({ class: "puf-label", x: x, y: y }, attrs || {}), [value])); }
    var values = [result.varianceL, result.varianceT, result.covarianceTerm];
    var labels = ["L 项", "T 项", "交叉项"];
    var maxAbs = Math.max.apply(null, values.map(function (value) { return Math.abs(value); }).concat([0.001]));
    line(left + 18, zeroY, split - 18, zeroY, "puf-secondary"); line(left + 18, barTop, left + 18, barBottom, "puf-axis");
    text(left + 22, barTop - 8, "+" + format(maxAbs, 4)); text(left + 22, zeroY + 4, "0"); text(left + 22, barBottom + 16, "−" + format(maxAbs, 4));
    values.forEach(function (value, index) {
      var x = left + 38 + index * 76;
      var height = Math.abs(value) / maxAbs * halfHeight;
      var y = value >= 0 ? zeroY - height : zeroY;
      chart.appendChild(svgElement(doc, "rect", { class: index === 2 ? "puf-bar" : "puf-secondary", x: x, y: y, width: 42, height: height, rx: 2 }));
      text(x + 21, bottom + 18, labels[index], { "text-anchor": "middle" });
      text(x + 21, value >= 0 ? Math.max(barTop + 12, y - 7) : Math.min(barBottom + 14, y + height + 14), format(value, 4), { "text-anchor": "middle" });
    });
    text(left + 22, top - 8, "方差项 / (m·s⁻²)²（零点居中）");
    line(split + 15, bottom, right - 12, bottom, "puf-axis"); line(split + 15, top, split + 15, bottom, "puf-axis");
    var uncertaintyValues = [result.uncertaintyNoCovariance, result.uncertainty];
    ["忽略协方差", "JΣJᵀ"].forEach(function (label, index) { var x = split + 42 + index * 104; var height = uncertaintyValues[index] / Math.max(0.2, uncertaintyValues[0]) * 155; var y = bottom - height; chart.appendChild(svgElement(doc, "rect", { class: index === 1 ? "puf-bar" : "puf-secondary", x: x, y: y, width: 54, height: height, rx: 2 })); text(x + 27, bottom + 18, label, { "text-anchor": "middle" }); text(x + 27, y - 7, format(uncertaintyValues[index], 4), { "text-anchor": "middle" }); });
    text(split + 20, top - 8, "g 的标准不确定度 / m·s⁻²");
  }

  function drawFit(doc, chart, result) {
    clear(chart);
    chart.appendChild(svgElement(doc, "title", { text: "回归残差模型检查" }));
    chart.appendChild(svgElement(doc, "desc", { text: "蓝色数据点和拟合线显示观测，金色零线下方的残差点用于检查模型是否遗漏曲率。" }));
    var left = 52, split = 340, right = 638, top = 36, bottom = 274;
    function line(x1, y1, x2, y2, className) { chart.appendChild(svgElement(doc, "line", { class: className || "puf-axis", x1: x1, y1: y1, x2: x2, y2: y2 })); }
    function text(x, y, value, attrs) { chart.appendChild(svgElement(doc, "text", Object.assign({ class: "puf-label", x: x, y: y }, attrs || {}), [value])); }
    function sx(x) { return left + 18 + x / 5 * (split - left - 36); }
    function sy(y) { return bottom - (y - 0.5) / 10 * (bottom - top); }
    line(left + 18, bottom, split - 18, bottom, "puf-axis"); line(left + 18, top, left + 18, bottom, "puf-axis");
    var curve = [];
    for (var i = 0; i <= 100; i += 1) { var x = 5 * i / 100; var fit = result.coefficients.reduce(function (sum, coefficient, index) { return sum + coefficient * Math.pow(x, index); }, 0); curve.push(sx(x).toFixed(1) + "," + sy(fit).toFixed(1)); }
    chart.appendChild(svgElement(doc, "polyline", { class: "puf-curve", points: curve.join(" ") }));
    DATA_X.forEach(function (x, index) { chart.appendChild(svgElement(doc, "circle", { class: "puf-marker", cx: sx(x), cy: sy(DATA_Y[index]), r: 4 })); });
    text(left + 22, top - 8, result.model === "quadratic" ? "观测与二次模型" : "观测与线性模型"); text(split - 18, bottom + 18, "x", { "text-anchor": "end" });
    function sr(x) { return split + 22 + x / 5 * (right - split - 42); }
    function yr(value) { return 164 - value / 1.2 * 105; }
    line(split + 22, 164, right - 20, 164, "puf-secondary"); line(split + 22, 55, split + 22, 270, "puf-axis");
    result.residuals.forEach(function (value, index) { chart.appendChild(svgElement(doc, "circle", { class: "puf-marker", cx: sr(DATA_X[index]), cy: yr(value), r: 4 })); });
    text(split + 26, 48, "残差 rᵢ", {}); text(right - 20, 184, "0", { "text-anchor": "end" }); text(right - 20, 270, "x", { "text-anchor": "end" });
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument; installStyles(doc); root.classList.add("puf-lab"); clear(root);
    var state = initialState();
    var questions = [
      { prompt: "g=4π²L/T² 中，T 增大时 g 的灵敏度符号？", options: ["负，∂g/∂T=−2g/T", "正，∂g/∂T=2g/T", "没有灵敏度"], answer: 0 },
      { prompt: "L 与 T 正相关时，协方差交叉项对 g 方差的符号？", options: ["负，因为两个导数符号相反", "正，因为相关总会放大", "恒为零"], answer: 0 },
      { prompt: "线性拟合的 reduced χ² 很大且残差呈弯曲，下一步？", options: ["只把误差条缩小", "检查模型是否缺少曲率或系统误差", "删除所有残差"], answer: 1 },
      { prompt: "标准不确定度的传播应怎样组合？", options: ["先把各项相对误差简单相加", "用 JΣJᵀ，并声明一阶近似", "只保留最大的一项"], answer: 1 }
    ];
    root.appendChild(element(doc, "h3", { text: "预测闸门：误差条是一条带模型的证据链" }));
    root.appendChild(element(doc, "p", { className: "puf-note", text: "先预测导数符号、协方差交叉项和残差证据；揭示后在同一台实验上切换传播与模型检查。" }));
    var prediction = element(doc, "div", { className: "puf-prediction" });
    var choiceButtons = [];
    questions.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset", { className: "puf-question" }); fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
      var choices = element(doc, "div", { className: "puf-choices" }); choiceButtons[questionIndex] = [];
      question.options.forEach(function (label, optionIndex) { var button = element(doc, "button", { type: "button", text: label, "aria-pressed": "false" }); button.addEventListener("click", function () { state.predictions[questionIndex] = optionIndex; choiceButtons[questionIndex].forEach(function (item) { item.setAttribute("aria-pressed", "false"); }); button.setAttribute("aria-pressed", "true"); }); choiceButtons[questionIndex].push(button); choices.appendChild(button); });
      fieldset.appendChild(choices); prediction.appendChild(fieldset);
    });
    var feedback = element(doc, "p", { className: "puf-feedback", "aria-live": "polite" }); var actions = element(doc, "div", { className: "puf-actions" });
    var reveal = element(doc, "button", { type: "button", className: "puf-primary", text: "揭示不确定度" }); var clearPredictions = element(doc, "button", { type: "button", text: "清空预测" }); actions.appendChild(reveal); actions.appendChild(clearPredictions); prediction.appendChild(actions); prediction.appendChild(feedback); root.appendChild(prediction);
    var revealed = element(doc, "div", { className: "puf-revealed", hidden: true }); revealed.appendChild(element(doc, "h4", { text: "传播与模型检查" }));
    var modes = element(doc, "div", { className: "puf-modes", role: "group", "aria-label": "选择实验模式" }); var modeButtons = {};
    [["propagate", "协方差传播"], ["fit", "残差模型检查"]].forEach(function (item) { var button = element(doc, "button", { type: "button", text: item[1], "aria-pressed": item[0] === state.mode ? "true" : "false" }); button.addEventListener("click", function () { state.mode = item[0]; Object.keys(modeButtons).forEach(function (key) { modeButtons[key].setAttribute("aria-pressed", key === state.mode ? "true" : "false"); }); panels.propagate.hidden = state.mode !== "propagate"; panels.fit.hidden = state.mode !== "fit"; render(); }); modeButtons[item[0]] = button; modes.appendChild(button); }); revealed.appendChild(modes);
    var panels = { propagate: element(doc, "div", { className: "puf-panel" }), fit: element(doc, "div", { className: "puf-panel", hidden: true }) };
    var rangeControls = {};
    rangeControls.L = makeRange(doc, panels.propagate, "长度 L", "L", 0.1, 3, 0.001, 3, " m", state, render);
    rangeControls.T = makeRange(doc, panels.propagate, "周期 T", "T", 0.1, 5, 0.001, 3, " s", state, render);
    rangeControls.sigmaL = makeRange(doc, panels.propagate, "u(L)", "sigmaL", 0.0001, 0.05, 0.0001, 4, " m", state, render);
    rangeControls.sigmaT = makeRange(doc, panels.propagate, "u(T)", "sigmaT", 0.0001, 0.05, 0.0001, 4, " s", state, render);
    rangeControls.rho = makeRange(doc, panels.propagate, "相关系数 ρ", "rho", -0.95, 0.95, 0.01, 2, "", state, render);
    var modelSelectId = uniqueId("puf-model-select");
    var modelSelect = element(doc, "select", { id: modelSelectId, "aria-label": "拟合模型" }); modelSelect.appendChild(element(doc, "option", { value: "linear", text: "线性 y=a+bx" })); modelSelect.appendChild(element(doc, "option", { value: "quadratic", text: "二次 y=a+bx+cx²" })); modelSelect.value = state.model; modelSelect.addEventListener("change", function () { state.model = modelSelect.value; render(); }); panels.fit.appendChild(element(doc, "div", { className: "puf-control" }, [element(doc, "label", { "for": modelSelectId, text: "拟合模型" }), modelSelect]));
    rangeControls.dataSigma = makeRange(doc, panels.fit, "数据标准差 σᵧ", "dataSigma", 0.02, 0.5, 0.01, 2, "", state, render);
    revealed.appendChild(panels.propagate); revealed.appendChild(panels.fit);
    var stage = element(doc, "div", { className: "puf-stage" }); var stageTitle = element(doc, "div", { className: "puf-stage-title" }, [element(doc, "span", { text: "当前模型的可检查读数" }), element(doc, "span", { className: "puf-status", text: "" })]); var chart = svgElement(doc, "svg", { viewBox: "0 0 680 320", role: "img", "aria-label": "不确定度传播或回归残差图" }); stage.appendChild(stageTitle); stage.appendChild(chart); revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "puf-metrics" }); var metricNodes = [metric(doc, "主读数"), metric(doc, "协方差/模型项"), metric(doc, "检验量"), metric(doc, "边界提醒")]; metricNodes.forEach(function (item) { metrics.appendChild(item.node); }); revealed.appendChild(metrics);
    var formula = element(doc, "div", { className: "puf-formula", text: "u²(f)=JΣJᵀ；g=4π²L/T²；χ²=Σ[(yᵢ−ŷᵢ)/σᵢ]²" }); revealed.appendChild(formula); var reset = element(doc, "button", { type: "button", className: "puf-reset", text: "重置实验" }); revealed.appendChild(reset); root.appendChild(revealed);

    function syncControls() {
      Object.keys(rangeControls).forEach(function (key) {
        var control = rangeControls[key];
        control.input.value = state[control.key];
        control.output.textContent = format(state[control.key], control.digits) + control.suffix;
      });
      modelSelect.value = state.model;
      Object.keys(modeButtons).forEach(function (key) { modeButtons[key].setAttribute("aria-pressed", key === state.mode ? "true" : "false"); });
      panels.propagate.hidden = state.mode !== "propagate";
      panels.fit.hidden = state.mode !== "fit";
      revealed.hidden = !state.revealed;
    }

    function render() {
      syncControls();
      if (state.mode === "propagate") {
        var result = propagate(state);
        metricNodes[0].value.textContent = "g=" + format(result.g, 4) + " ± " + format(result.uncertainty, 4) + " m/s²";
        metricNodes[1].value.textContent = "交叉项=" + format(result.covarianceTerm, 5);
        metricNodes[2].value.textContent = "ρ=" + format(result.rho, 2) + "；相对=" + format(result.relativeUncertainty * 100, 2) + "%";
        metricNodes[3].value.textContent = "一阶、近似高斯；相关性需有实验依据";
        stageTitle.querySelector(".puf-status").textContent = result.covarianceTerm < 0 ? "正相关在此处降低方差" : result.covarianceTerm > 0 ? "正交叉项放大方差" : "无交叉项";
        formula.textContent = "g=" + format(result.g, 4) + "；u²=JΣJᵀ=" + format(result.variance, 6) + "；忽略协方差时 u=" + format(result.uncertaintyNoCovariance, 4);
        drawPropagation(doc, chart, result);
      } else {
        var fit = fitModel(state.model, state.dataSigma);
        metricNodes[0].value.textContent = fit.model + "：χ²=" + format(fit.chiSquare, 2);
        metricNodes[1].value.textContent = "ν=" + fit.dof + "；χ²/ν=" + format(fit.reducedChiSquare, 2);
        metricNodes[2].value.textContent = "max |r/σ|=" + format(fit.maxStandardized, 2);
        metricNodes[3].value.textContent = Math.abs(fit.curvatureContrast) > state.dataSigma * 0.5 ? "残差有结构：检查模型" : "残差未显出强曲率";
        stageTitle.querySelector(".puf-status").textContent = fit.reducedChiSquare > 2 ? "线性模型偏紧：不能只报漂亮斜率" : "先看残差再下结论";
        formula.textContent = "ŷ=" + fit.coefficients.map(function (coefficient, index) { return (index ? " + " : "") + format(coefficient, 4) + "x^" + index; }).join("") + "；χ²/ν=" + format(fit.reducedChiSquare, 2);
        drawFit(doc, chart, fit);
      }
    }
    reveal.addEventListener("click", function () { if (state.predictions.some(function (value) { return value === null; })) { feedback.className = "puf-feedback puf-warn"; feedback.textContent = "请先完成四个预测，再揭示账本。"; return; } var score = state.predictions.reduce(function (sum, value, index) { return sum + (value === questions[index].answer ? 1 : 0); }, 0); feedback.className = "puf-feedback " + (score === questions.length ? "puf-pass" : "puf-warn"); feedback.textContent = "预测命中 " + score + "/" + questions.length + "；现在把不确定度和模型诊断分开读取。"; state.revealed = true; render(); announce(api, root, feedback.textContent); });
    clearPredictions.addEventListener("click", function () { state.predictions = [null, null, null, null]; choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "puf-feedback"; feedback.textContent = "预测已清空。"; });
    reset.addEventListener("click", function () { resetState(state); choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "puf-feedback"; feedback.textContent = "实验已重置并上锁。"; render(); announce(api, root, "不确定度与拟合实验已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) { checks += 1; if (!condition) throw new Error("physics-uncertainty-fit self-test failed: " + message); }
    function close(left, right, tolerance, message) { assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")"); }
    var defaultPropagation = propagate({ L: 1, T: 2.006, sigmaL: 0.005, sigmaT: 0.010, rho: 0.6 });
    close(defaultPropagation.g, 4 * Math.PI * Math.PI / (2.006 * 2.006), 1e-12, "pendulum formula");
    assert(defaultPropagation.covarianceTerm < 0, "opposite sensitivities make positive-rho cross term negative");
    assert(defaultPropagation.uncertainty < defaultPropagation.uncertaintyNoCovariance, "positive covariance reduces g uncertainty here");
    close(propagate({ L: 1, T: 2, sigmaL: 0.01, sigmaT: 0.01, rho: 0 }).variance, propagate({ L: 1, T: 2, sigmaL: 0.01, sigmaT: 0.01, rho: 0.8 }).varianceNoCovariance, 1e-12, "no-covariance ledger");
    var linear = fitModel("linear", 0.12); var quadratic = fitModel("quadratic", 0.12);
    assert(linear.dof === 4 && quadratic.dof === 3, "fit degrees of freedom");
    assert(linear.reducedChiSquare > quadratic.reducedChiSquare, "quadratic model resolves curvature");
    assert(linear.curvatureContrast < 0, "linear residuals show center-down curvature");
    assert(fitModel("linear", 0.12).chiSquare === linear.chiSquare, "deterministic data fit");
    assert(Math.abs(quadratic.coefficients[2]) > 0.01, "quadratic coefficient is identifiable");
    var reset = initialState(); reset.mode = "fit"; reset.sigmaT = 0.045; reset.model = "quadratic"; reset.predictions[0] = 1; reset.revealed = true; resetState(reset);
    assert(reset.mode === "propagate" && reset.sigmaT === 0.010 && reset.model === "linear" && reset.predictions.every(function (value) { return value === null; }) && reset.revealed === false, "pure reset state");
    return { checks: checks, observations: DATA_X.length };
  }

  return { DATA_X: DATA_X, DATA_Y: DATA_Y, propagate: propagate, fitModel: fitModel, initialState: initialState, resetState: resetState, selfTest: selfTest, mount: mount };
});
