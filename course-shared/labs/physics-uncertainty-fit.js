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
    ".puf-lab *,.puf-lab *::before,.puf-lab *::after{box-sizing:border-box}.puf-lab [hidden]{display:none!important}.puf-lab h3,.puf-lab h4{margin:0;letter-spacing:0}.puf-lab h3{font-size:1.15rem}.puf-lab p{margin:.65em 0}.puf-lab button,.puf-lab input,.puf-lab select{font:inherit;letter-spacing:0}.puf-lab button,.puf-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.puf-lab button:hover{border-color:var(--puf-blue)}.puf-lab button:focus-visible,.puf-lab input:focus-visible,.puf-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.puf-lab button[aria-pressed=true],.puf-lab .puf-primary{background:var(--puf-blue);border-color:var(--puf-blue);color:var(--bg);font-weight:750}.puf-note,.puf-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.puf-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--puf-gold);background:var(--block-bg,var(--bg))}.puf-question{margin:0 0 12px;padding:0;border:0}.puf-question:last-of-type{margin-bottom:0}.puf-question legend{max-width:100%;margin-bottom:7px;font-size:13px;font-weight:750;line-height:1.5}.puf-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.puf-choices button{font-size:12px}.puf-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.puf-actions>*{flex:1 1 170px}.puf-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.puf-pass{color:var(--puf-green)}.puf-warn{color:var(--puf-red)}.puf-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.puf-modes{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}.puf-modes button{flex:1 1 150px}.puf-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0;align-items:end}.puf-control{display:grid;gap:5px;min-width:0}.puf-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.puf-control output{color:var(--puf-blue);font-variant-numeric:tabular-nums}.puf-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--puf-blue)}.puf-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}.puf-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto}.puf-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--fg-soft);font-size:13px}.puf-stage svg{display:block;width:100%;height:auto;min-width:760px;color:var(--fg)}.puf-stage svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.puf-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.65}.puf-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.14}.puf-curve{fill:none;stroke:var(--puf-green);stroke-width:2.5}.puf-secondary{fill:none;stroke:var(--puf-gold);stroke-width:2.2;stroke-dasharray:6 4}.puf-marker{fill:var(--puf-red);stroke:var(--bg);stroke-width:1.5}.puf-bar{fill:var(--puf-green);fill-opacity:.78}.puf-label{font-size:11px;fill:var(--fg-soft)}.puf-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.puf-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.puf-metric:nth-child(4n+1){border-color:var(--puf-blue)}.puf-metric:nth-child(4n+2){border-color:var(--puf-gold)}.puf-metric:nth-child(4n+3){border-color:var(--puf-green)}.puf-metric:nth-child(4n+4){border-color:var(--puf-red)}.puf-metric span{display:block;color:var(--fg-soft);font-size:11px}.puf-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.puf-formula{margin:12px 0 0;padding:9px 11px;border-left:3px solid var(--puf-blue);background:var(--bg);font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65;overflow-x:auto}.puf-reset{margin-top:10px;color:var(--fg-soft)}@media(max-width:900px){.puf-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.puf-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.puf-choices{grid-template-columns:minmax(0,1fr)}.puf-controls,.puf-metrics{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.puf-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
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
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1e5)) return value.toExponential(Math.min(places, 4));
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

  function bounded(value, fallback, lo, hi, label) {
    if (value === undefined) return fallback;
    if (typeof value !== "number" || !Number.isFinite(value) || value < lo || value > hi) throw new RangeError(label + " outside supported finite range");
    return value;
  }

  function propagate(input) {
    var source = input || {};
    var L = bounded(source.L, 1, 0.1, 3, "L");
    var T = bounded(source.T, 2.006, 0.1, 10, "T");
    var sigmaL = bounded(source.sigmaL, 0.005, 0.0001, 0.1, "sigmaL");
    var sigmaT = bounded(source.sigmaT, 0.010, 0.0001, 0.1, "sigmaT");
    var rho = bounded(source.rho, 0.6, -1, 1, "rho");
    var g = 4 * Math.PI * Math.PI * L / (T * T);
    var dL = g / L;
    var dT = -2 * g / T;
    var covariance = rho * sigmaL * sigmaT;
    var varianceL = dL * dL * sigmaL * sigmaL;
    var varianceT = dT * dT * sigmaT * sigmaT;
    var covarianceTerm = 2 * dL * dT * covariance;
    var a = dL * sigmaL, b = dT * sigmaT;
    var variance = Math.pow(a + rho * b, 2) + (1 - rho) * (1 + rho) * b * b;
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

  function fitModel(model, sigma, correlation) {
    if (model !== "linear" && model !== "quadratic") throw new RangeError("unknown fit model");
    var rho = bounded(correlation, 0, 0, 0.95, "fit correlation");
    var degree = model === "quadratic" ? 2 : 1;
    var uncertainty = bounded(sigma, 0.12, 0.02, 0.5, "data sigma");
    var count = degree + 1;
    var normal = [];
    var right = [];
    for (var i = 0; i < count; i += 1) {
      normal[i] = [];
      for (var j = 0; j < count; j += 1) {
        normal[i][j] = DATA_X.reduce(function (sum, x) { return sum + Math.pow(x, i + j); }, 0);
      }
      right[i] = DATA_X.reduce(function (sum, x, index) { return sum + Math.pow(x, i) * DATA_Y[index]; }, 0);
    }
    var coefficients = solve(normal, right);
    var predictions = DATA_X.map(function (x) { return coefficients.reduce(function (sum, coefficient, index) { return sum + coefficient * Math.pow(x, index); }, 0); });
    var residuals = DATA_Y.map(function (value, index) { return value - predictions[index]; });
    var standardized = residuals.map(function (value) { return value / (uncertainty * Math.sqrt(1 - rho)); });
    var inverse = normal.map(function (_, j) { return solve(normal, normal.map(function (_, i) { return i === j ? 1 : 0; })); });
    var parameterCovariance = inverse.map(function (row, i) { return row.map(function (value, j) { return uncertainty * uncertainty * ((1 - rho) * value + (i === 0 && j === 0 ? rho : 0)); }); });
    var standardErrors = parameterCovariance.map(function (row, i) { return Math.sqrt(row[i]); });
    var chiSquare = standardized.reduce(function (sum, value) { return sum + value * value; }, 0);
    var dof = DATA_X.length - count;
    var endMean = (residuals[0] + residuals[residuals.length - 1]) / 2;
    var middleMean = residuals.slice(1, -1).reduce(function (sum, value) { return sum + value; }, 0) / (residuals.length - 2);
    return { model: model === "quadratic" ? "quadratic" : "linear", sigma: uncertainty, correlation: rho, parameterCovariance: parameterCovariance, standardErrors: standardErrors, coefficients: coefficients, predictions: predictions, residuals: residuals, standardized: standardized, chiSquare: chiSquare, dof: dof, reducedChiSquare: chiSquare / dof, maxStandardized: Math.max.apply(null, standardized.map(function (value) { return Math.abs(value); })), curvatureContrast: middleMean - endMean };
  }

  function initialState() {
    return { mode: "propagate", L: 1, T: 2.006, sigmaL: 0.005, sigmaT: 0.010, rho: 0.6, model: "linear", dataSigma: 0.12, fitRho: 0, predictions: [null, null, null, null], revealed: false };
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

  function chartTools(doc, chart) {
    clear(chart);
    return {
      line: function(x1,y1,x2,y2,cls) { chart.appendChild(svgElement(doc,"line",{x1:x1,y1:y1,x2:x2,y2:y2,class:cls||"puf-axis"})); },
      text: function(x,y,label,anchor) { chart.appendChild(svgElement(doc,"text",{x:x,y:y,class:"puf-label","text-anchor":anchor||"start"},[label])); },
      bar: function(x,y,w,h,cls) { chart.appendChild(svgElement(doc,"rect",{x:x,y:y,width:w,height:Math.max(0,h),class:cls||"puf-bar"})); }
    };
  }
  function drawPropagation(doc, chart, result) {
    var t=chartTools(doc,chart), values=[result.varianceL,result.varianceT,result.covarianceTerm];
    chart.appendChild(svgElement(doc,"title",{text:"方差贡献与标准不确定度；各图使用独立的标注刻度"}));
    chart.appendChild(svgElement(doc,"desc",{text:"左图两个对角方差贡献与带符号交叉项，右图比较含协方差与去掉协方差。"}));
    t.text(68,24,"方差贡献 / (m·s⁻²)²"); t.text(445,24,"标准不确定度 / m·s⁻²");
    var top=58,bottom=270,zero=164,half=106,max=Math.max.apply(null,values.map(Math.abs))*1.3;
    t.line(68,top,68,bottom);t.line(68,zero,352,zero,"puf-secondary");
    [-1,0,1].forEach(function(a){var y=zero-a*half;t.text(60,y+4,format(a*max,3),"end");t.line(68,y,352,y,"puf-grid");});
    values.forEach(function(v,i){var x=105+i*88,h=Math.abs(v)/max*half,y=v>=0?zero-h:zero;t.bar(x,y,42,h,i===2?"puf-bar":"puf-secondary");t.text(x+21,v>=0?y-8:y+h+16,format(v,4),"middle");t.text(x+21,301,["L 对角项","T 对角项","交叉项"][i],"middle");});
    var us=[result.uncertaintyNoCovariance,result.uncertainty],umax=Math.max.apply(null,us)*1.35;
    t.line(444,top,444,bottom);t.line(444,bottom,732,bottom);
    [0,0.5,1].forEach(function(a){var y=bottom-a*(bottom-top);t.text(434,y+4,format(a*umax,3),"end");t.line(444,y,732,y,"puf-grid");});
    us.forEach(function(v,i){var x=488+i*135,h=v/umax*(bottom-top);t.bar(x,bottom-h,60,h,i?"puf-bar":"puf-secondary");t.text(x+30,bottom-h-8,format(v,4),"middle");t.text(x+30,301,i?"含协方差":"去掉协方差","middle");});
  }
  function drawFit(doc, chart, result) {
    var t=chartTools(doc,chart),left=68,right=352,top=58,bottom=270;
    chart.appendChild(svgElement(doc,"title",{text:"左：观测、每点标准差与拟合；右：按对比噪声尺度缩放的残差"}));
    chart.appendChild(svgElement(doc,"desc",{text:"圆点是教学数据，连线是模型，竖误差条为每点边缘标准差。右图有数值刻度，残差受拟合约束。"}));
    var sx=function(x){return left+8+x/5*(right-left-16);}, sy=function(y){return bottom-y/11*(bottom-top);};
    t.text(left,24,"观测 y ± σᵧ（教学无量纲数据）");t.text(447,24,"r / [σᵧ√(1−ρ)]（平方和 = χ²）");
    t.line(left,top,left,bottom);t.line(left,bottom,right,bottom);
    [0,5,10].forEach(function(v){t.text(left-7,sy(v)+4,v,"end");t.line(left,sy(v),right,sy(v),"puf-grid");});
    [0,1,2,3,4,5].forEach(function(v){t.text(sx(v),290,v,"middle");});t.text(right,310,"x","end");
    var points=[];for(var i=0;i<=100;i++){var x=5*i/100,y=result.coefficients.reduce(function(a,c,j){return a+c*Math.pow(x,j);},0);points.push(sx(x)+","+sy(y));}
    chart.appendChild(svgElement(doc,"polyline",{points:points.join(" "),class:"puf-curve"}));
    DATA_X.forEach(function(x,i){var px=sx(x),yp=sy(DATA_Y[i]+result.sigma),ym=sy(DATA_Y[i]-result.sigma);t.line(px,yp,px,ym);t.line(px-4,yp,px+4,yp);t.line(px-4,ym,px+4,ym);chart.appendChild(svgElement(doc,"circle",{cx:px,cy:sy(DATA_Y[i]),r:4,class:"puf-marker"}));});
    var maximum=Math.max(1,Math.ceil(result.maxStandardized*1.15)),rx=function(x){return 458+x/5*262;},ry=function(v){return 164-v/maximum*106;};
    [-maximum,0,maximum].forEach(function(v){t.line(446,ry(v),732,ry(v),v===0?"puf-secondary":"puf-grid");t.text(438,ry(v)+4,format(v,1),"end");});t.line(446,top,446,bottom);
    DATA_X.forEach(function(x,i){chart.appendChild(svgElement(doc,"circle",{cx:rx(x),cy:ry(result.standardized[i]),r:4,class:"puf-marker"}));t.text(rx(x),290,x,"middle");});t.text(732,310,"x","end");
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
      question.options.forEach(function (label, optionIndex) { var button = element(doc, "button", { type: "button", text: label, "aria-pressed": "false" }); button.addEventListener("click", function () { state.revealed = false; state.predictions[questionIndex] = optionIndex; render(); choiceButtons[questionIndex].forEach(function (item) { item.setAttribute("aria-pressed", "false"); }); button.setAttribute("aria-pressed", "true"); }); choiceButtons[questionIndex].push(button); choices.appendChild(button); });
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
    rangeControls.fitRho = makeRange(doc, panels.fit, "点间共同相关 ρ", "fitRho", 0, 0.95, 0.01, 2, "", state, render);
    rangeControls.dataSigma = makeRange(doc, panels.fit, "数据标准差 σᵧ", "dataSigma", 0.02, 0.5, 0.01, 2, "", state, render);
    revealed.appendChild(panels.propagate); revealed.appendChild(panels.fit);
    var stage = element(doc, "div", { className: "puf-stage", tabindex: "0", role: "region", "aria-label": "实验图，可用左右方向键横向滚动" }); var stageTitle = element(doc, "div", { className: "puf-stage-title" }, [element(doc, "span", { text: "当前模型的可检查读数" }), element(doc, "span", { className: "puf-status", text: "" })]); var chart = svgElement(doc, "svg", { viewBox: "0 0 760 330", role: "img", "aria-label": "不确定度传播或回归残差图" }); stage.appendChild(stageTitle); stage.appendChild(chart); revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "puf-metrics" }); var metricNodes = [metric(doc, "主读数"), metric(doc, "协方差/模型项"), metric(doc, "检验量"), metric(doc, "边界提醒")]; metricNodes.forEach(function (item) { metrics.appendChild(item.node); }); revealed.appendChild(metrics);
    var tableWrap = element(doc, "div", { className: "puf-table", tabindex: "0", role: "region", "aria-label": "逐点拟合与残差表，可横向滚动" }); tableWrap.style.overflowX = "auto"; revealed.appendChild(tableWrap);
    var formula = element(doc, "div", { className: "puf-formula", text: "u²(f)≈JΣJᵀ；g=4π²L/T²；χ²=Σ[(yᵢ−ŷᵢ)/σᵢ]²" }); revealed.appendChild(formula); var reset = element(doc, "button", { type: "button", className: "puf-reset", text: "重置实验" }); revealed.appendChild(reset); root.appendChild(revealed);

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
      tableWrap.hidden = state.mode !== "fit";
      if (state.mode === "propagate") {
        var result = propagate(state);
        metricNodes[0].value.textContent = "g=" + format(result.g, 4) + " ± " + format(result.uncertainty, 4) + " m/s²";
        metricNodes[1].value.textContent = "交叉项=" + format(result.covarianceTerm, 5);
        metricNodes[2].value.textContent = "ρ=" + format(result.rho, 2) + "；相对=" + format(result.relativeUncertainty * 100, 2) + "%";
        metricNodes[3].value.textContent = (Math.max(result.sigmaL/result.L,result.sigmaT/result.T)>0.1 ? "相对输入波动超过 10%：需检查非线性传播" : "一阶传播；标准差不等于覆盖区间");
        stageTitle.querySelector(".puf-status").textContent = result.covarianceTerm < 0 ? "正相关在此处降低方差" : result.covarianceTerm > 0 ? "正交叉项放大方差" : "无交叉项";
        formula.textContent = "g=" + format(result.g, 4) + "；u²≈JΣJᵀ=" + format(result.variance, 6) + "；忽略协方差时 u=" + format(result.uncertaintyNoCovariance, 4);
        drawPropagation(doc, chart, result);
      } else {
        var fit = fitModel(state.model, state.dataSigma, state.fitRho);
        metricNodes[0].value.textContent = fit.model + "：χ²=" + format(fit.chiSquare, 2);
        metricNodes[1].value.textContent = "ν=" + fit.dof + "；χ²/ν=" + format(fit.reducedChiSquare, 2) + "；参数标准误=" + fit.standardErrors.map(function(v){return format(v,6);}).join(", ") + "；已知 σ，不以约化 χ² 重新缩放";
        metricNodes[2].value.textContent = "max |r/(σ√(1−ρ))|=" + format(fit.maxStandardized, 2);
        metricNodes[3].value.textContent = Math.abs(fit.curvatureContrast) > state.dataSigma * Math.sqrt(1 - state.fitRho) * 0.5 ? "残差有结构：检查模型" : "残差未显出强曲率";
        stageTitle.querySelector(".puf-status").textContent = fit.reducedChiSquare > 2 ? "残差相对所设噪声较大：复核模型与尺度" : "先看残差再下结论";
        formula.textContent = "ŷ=" + fit.coefficients.map(function (coefficient, index) { return (index ? " + " : "") + format(coefficient, 4) + "x^" + index; }).join("") + "；χ²/ν=" + format(fit.reducedChiSquare, 2) + "；参数标准误=" + fit.standardErrors.map(function(v){return format(v,6);}).join(", ") + "；已知 σ，不以约化 χ² 重新缩放";
        drawFit(doc, chart, fit);
        clear(tableWrap); var table=element(doc,"table",{}); table.style.minWidth="600px";
        table.appendChild(element(doc,"caption",{text:"逐点核对：边缘标准差 σᵧ="+format(fit.sigma,3)+"；点间共同相关 ρ="+format(fit.correlation,2)}));
        table.appendChild(element(doc,"thead",{},[element(doc,"tr",{},["x","观测 y","拟合 ŷ","残差 r","r/(σ√(1−ρ))"].map(function(label){return element(doc,"th",{scope:"col",text:label});}))]));
        table.appendChild(element(doc,"tbody",{},DATA_X.map(function(x,i){return element(doc,"tr",{},[x,DATA_Y[i],fit.predictions[i],fit.residuals[i],fit.standardized[i]].map(function(v){return element(doc,"td",{text:format(v,5)});}));})));tableWrap.appendChild(table);
      }
    }
    reveal.addEventListener("click", function () { if (state.predictions.some(function (value) { return value === null; })) { feedback.className = "puf-feedback puf-warn"; feedback.textContent = "请先完成四个预测，再揭示账本。"; return; } var score = state.predictions.reduce(function (sum, value, index) { return sum + (value === questions[index].answer ? 1 : 0); }, 0); feedback.className = "puf-feedback " + (score === questions.length ? "puf-pass" : "puf-warn"); feedback.textContent = "预测命中 " + score + "/" + questions.length + "；现在把不确定度和模型诊断分开读取。"; state.revealed = true; render(); announce(api, root, feedback.textContent); });
    clearPredictions.addEventListener("click", function () { state.revealed = false; render(); state.predictions = [null, null, null, null]; choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "puf-feedback"; feedback.textContent = "预测已清空。"; });
    reset.addEventListener("click", function () { resetState(state); choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "puf-feedback"; feedback.textContent = "实验已重置并上锁。"; render(); choiceButtons[0][0].focus(); announce(api, root, "不确定度与拟合实验已重置。"); });
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
