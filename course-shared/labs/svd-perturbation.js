(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("svd-perturbation", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("svd-perturbation self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("svd-perturbation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-svd-perturbation-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;

  var PRESETS = [
    { id: "large-gap", label: "大 gap：值稳、向量稳", sigma1: 3, sigma2: 1, eta: 0.05 },
    { id: "small-gap", label: "小 gap：值仍稳、向量敏感", sigma1: 3, sigma2: 2.95, eta: 0.05 },
    { id: "gap-fails", label: "扰动不小于 gap：证书失效", sigma1: 3, sigma2: 2.9, eta: 0.15 }
  ];
  var DEFAULT = { presetId: "large-gap", sigma1: 3, sigma2: 1, eta: 0.05 };

  var STYLE_TEXT = [
    ".svd-lab{--svd-blue:var(--cl-blue,#315f9d);--svd-gold:var(--cl-gold,#9b6a12);--svd-green:var(--cl-green,#39734d);--svd-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".svd-lab *,.svd-lab *::before,.svd-lab *::after{box-sizing:border-box;}.svd-lab [hidden]{display:none!important;}",
    ".svd-lab h3,.svd-lab h4{margin:0;color:var(--fg);}.svd-lab h3{font-size:1.18rem;}.svd-lab h4{margin-top:16px;font-size:1rem;}",
    ".svd-lab button,.svd-lab input{font:inherit;}.svd-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.svd-lab button:hover{border-color:var(--accent);}.svd-lab button[aria-pressed='true'],.svd-lab button.svd-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}.svd-lab button:disabled{cursor:not-allowed;opacity:.55;}.svd-lab button:focus-visible,.svd-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".svd-lab .svd-note,.svd-lab .svd-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}.svd-lab .svd-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--svd-gold);background:var(--bg);}.svd-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.svd-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750;}.svd-lab .svd-question-list{display:grid;gap:12px;}.svd-lab .svd-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.svd-lab .svd-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.svd-lab .svd-choice-grid button{font-size:12px;}.svd-lab .svd-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.svd-lab .svd-actions>*{flex:1 1 170px;}.svd-lab .svd-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.svd-lab .svd-pass{color:var(--svd-green);}.svd-lab .svd-warn{color:var(--svd-red);}",
    ".svd-lab .svd-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.svd-lab .svd-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0;}.svd-lab .svd-controls,.svd-lab .svd-stage{min-width:0;}.svd-lab .svd-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.svd-lab .svd-control{display:grid;gap:5px;min-width:0;}.svd-lab .svd-control label,.svd-lab .svd-control-title{color:var(--fg-soft);font-size:13px;font-weight:700;}.svd-lab .svd-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.svd-lab .svd-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.svd-lab .svd-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px;}.svd-lab .svd-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.svd-lab .svd-preset-grid button{font-size:12px;}",
    ".svd-lab .svd-stage-frame{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.svd-lab .svd-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 8px;color:var(--fg-soft);font-size:13px;}.svd-lab .svd-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.svd-lab .svd-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.svd-lab .svd-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}.svd-lab .svd-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.72;}.svd-lab .svd-base-vector{stroke:var(--svd-blue);stroke-width:4;}.svd-lab .svd-perturbed-vector{stroke:var(--svd-red);stroke-width:4;}.svd-lab .svd-angle-arc{fill:none;stroke:var(--svd-gold);stroke-width:2;stroke-dasharray:5 4;}.svd-lab .svd-bar-base{fill:var(--svd-blue);}.svd-lab .svd-bar-perturbed{fill:var(--svd-red);}.svd-lab .svd-bar-residual{fill:var(--svd-gold);}",
    ".svd-lab .svd-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin:8px 0 0;color:var(--fg-soft);font-size:12px;}.svd-lab .svd-legend span{display:inline-flex;align-items:center;gap:5px;}.svd-lab .svd-swatch{display:inline-block;width:18px;height:3px;background:currentColor;}.svd-lab .svd-swatch-blue{color:var(--svd-blue);}.svd-lab .svd-swatch-red{color:var(--svd-red);}.svd-lab .svd-swatch-gold{color:var(--svd-gold);}.svd-lab .svd-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px;margin:12px 0;}.svd-lab .svd-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.svd-lab .svd-metric:nth-child(1),.svd-lab .svd-metric:nth-child(4){border-top-color:var(--svd-blue);}.svd-lab .svd-metric:nth-child(2),.svd-lab .svd-metric:nth-child(5){border-top-color:var(--svd-gold);}.svd-lab .svd-metric:nth-child(3),.svd-lab .svd-metric:nth-child(6){border-top-color:var(--svd-red);}.svd-lab .svd-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.svd-lab .svd-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".svd-lab .svd-table-wrap{max-width:100%;margin-top:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.svd-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.svd-lab th,.svd-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.svd-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.svd-lab .svd-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--svd-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
    "@media(max-width:900px){.svd-lab .svd-layout{grid-template-columns:minmax(0,1fr);}}@media(max-width:760px){.svd-lab .svd-choice-grid{grid-template-columns:minmax(0,1fr);}.svd-lab .svd-preset-grid{grid-template-columns:minmax(0,1fr);}}@media(max-width:420px){.svd-lab .svd-stage-frame{padding:6px;}.svd-lab table{font-size:11.5px;}.svd-lab th,.svd-lab td{padding-left:5px;padding-right:5px;}}@media(prefers-reduced-motion:reduce){.svd-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].id === id) return PRESETS[index];
    }
    return PRESETS[0];
  }

  function presetState(preset) {
    return { presetId: preset.id, sigma1: preset.sigma1, sigma2: preset.sigma2, eta: preset.eta };
  }

  function symmetricSpectrum(a, b, d) {
    var middle = (a + d) / 2;
    var halfGap = (a - d) / 2;
    var radius = Math.sqrt(halfGap * halfGap + b * b);
    return {
      largest: middle + radius,
      smallest: middle - radius,
      angle: 0.5 * Math.atan2(2 * b, a - d)
    };
  }

  function frobenius(matrix) {
    var sum = 0;
    matrix.forEach(function (row) {
      row.forEach(function (value) { sum += value * value; });
    });
    return Math.sqrt(sum);
  }

  function spectralNormSymmetric2(matrix) {
    var spectrum = symmetricSpectrum(matrix[0][0], matrix[0][1], matrix[1][1]);
    return Math.max(Math.abs(spectrum.largest), Math.abs(spectrum.smallest));
  }

  function subtractMatrices(left, right) {
    return left.map(function (row, rowIndex) {
      return row.map(function (value, columnIndex) {
        return value - right[rowIndex][columnIndex];
      });
    });
  }

  function outer(vector, scale) {
    return [
      [scale * vector[0] * vector[0], scale * vector[0] * vector[1]],
      [scale * vector[1] * vector[0], scale * vector[1] * vector[1]]
    ];
  }

  function compute(spec) {
    var options = spec || {};
    var preset = presetById(options.presetId || DEFAULT.presetId);
    var sigma1 = options.sigma1 === undefined ? preset.sigma1 : Number(options.sigma1);
    var sigma2 = options.sigma2 === undefined ? preset.sigma2 : Number(options.sigma2);
    var eta = options.eta === undefined ? preset.eta : Number(options.eta);
    if (!finite(sigma1) || !finite(sigma2) || sigma1 <= sigma2 || sigma2 <= 0) throw new RangeError("require sigma1 > sigma2 > 0");
    if (!finite(eta) || eta < 0) throw new RangeError("eta must be nonnegative");

    var baseline = [[sigma1, 0], [0, sigma2]];
    var perturbation = [[0, eta], [eta, 0]];
    var perturbed = [[sigma1, eta], [eta, sigma2]];
    var spectrum = symmetricSpectrum(sigma1, eta, sigma2);
    var topVector = [Math.cos(spectrum.angle), Math.sin(spectrum.angle)];
    var rankOne = outer(topVector, spectrum.largest);
    var residual = subtractMatrices(perturbed, rankOne);
    var normE = Math.abs(eta);
    var gap = sigma1 - sigma2;
    var gapLower = gap - normE;
    var maxSingularShift = Math.max(Math.abs(spectrum.largest - sigma1), Math.abs(spectrum.smallest - sigma2));
    var certificateRaw = gapLower > 0 ? normE / gapLower : Infinity;
    return {
      label: options.presetId === "custom" ? "自定义" : preset.label,
      preset: preset,
      sigma1: sigma1,
      sigma2: sigma2,
      eta: eta,
      baseline: baseline,
      perturbation: perturbation,
      perturbed: perturbed,
      normE: normE,
      singularValuesBefore: [sigma1, sigma2],
      singularValuesAfter: [spectrum.largest, spectrum.smallest],
      maxSingularShift: maxSingularShift,
      weylMargin: normE - maxSingularShift,
      gap: gap,
      gapLower: gapLower,
      angle: spectrum.angle,
      angleDeg: spectrum.angle * 180 / Math.PI,
      sinAngle: Math.abs(Math.sin(spectrum.angle)),
      topVector: topVector,
      rankOne: rankOne,
      residual: residual,
      lowRankSpectral: spectralNormSymmetric2(residual),
      lowRankFrobenius: frobenius(residual),
      residualSpectralIdentity: Math.abs(spectralNormSymmetric2(residual) - spectrum.smallest),
      residualFrobeniusIdentity: Math.abs(frobenius(residual) - spectrum.smallest),
      gapCertificate: gapLower > 0 ? Math.min(1, certificateRaw) : null,
      gapCertificateRaw: certificateRaw,
      gapCertificateValid: gapLower > 0
    };
  }

  function format(value, digits) {
    if (value === Infinity) return "∞";
    if (value === -Infinity) return "-∞";
    if (!finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) < 0.0005 && value !== 0) return value.toExponential(Math.min(places, 4));
    var text = value.toFixed(places);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
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

  function appendChildren(node, children) {
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children || []);
  }

  function svgElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children || []);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label) {
    var value = element(doc, "strong", {}, ["—"]);
    return { node: element(doc, "div", { className: "svd-metric" }, [element(doc, "span", {}, [label]), value]), value: value };
  }

  function table(doc, label, headers) {
    return element(doc, "table", { "aria-label": label }, [
      element(doc, "thead", {}, [element(doc, "tr", {}, headers.map(function (header) { return element(doc, "th", { scope: "col" }, [header]); }))]),
      element(doc, "tbody", {}, [])
    ]);
  }

  function replaceRows(target, rows) {
    var body = target.querySelector("tbody");
    clear(body);
    rows.forEach(function (row) {
      body.appendChild(element(target.ownerDocument, "tr", {}, row.map(function (value) {
        return element(target.ownerDocument, "td", {}, [value]);
      })));
    });
  }

  function drawSvg(doc, svg, data, uid) {
    clear(svg);
    svg.setAttribute("aria-labelledby", uid + "-svg-title " + uid + "-svg-desc");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-svg-title" }, ["SVD 扰动的奇异向量旋转与奇异值条形图"]));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-svg-desc" }, ["左侧比较未扰动和扰动后的顶右奇异向量；右侧比较两个奇异值与 rank-1 残差。"]));

    var centerX = 145;
    var centerY = 164;
    var radius = 94;
    svg.appendChild(svgElement(doc, "text", { x: 38, y: 25, "font-size": 12, "font-weight": 700 }, ["右奇异向量：gap 越小，角度越敏感"]));
    svg.appendChild(svgElement(doc, "circle", { cx: centerX, cy: centerY, r: radius, fill: "none", class: "svd-grid" }, []));
    svg.appendChild(svgElement(doc, "line", { x1: centerX - radius, y1: centerY, x2: centerX + radius, y2: centerY, class: "svd-axis" }, []));
    svg.appendChild(svgElement(doc, "line", { x1: centerX, y1: centerY - radius, x2: centerX, y2: centerY + radius, class: "svd-axis" }, []));
    svg.appendChild(svgElement(doc, "line", { x1: centerX, y1: centerY, x2: centerX + radius, y2: centerY, class: "svd-base-vector" }, []));
    svg.appendChild(svgElement(doc, "line", { x1: centerX, y1: centerY, x2: centerX + radius * Math.cos(data.angle), y2: centerY - radius * Math.sin(data.angle), class: "svd-perturbed-vector" }, []));
    var arcEndX = centerX + 42 * Math.cos(data.angle);
    var arcEndY = centerY - 42 * Math.sin(data.angle);
    svg.appendChild(svgElement(doc, "path", { d: "M " + (centerX + 42) + " " + centerY + " A 42 42 0 0 0 " + arcEndX + " " + arcEndY, class: "svd-angle-arc" }, []));
    svg.appendChild(svgElement(doc, "text", { x: centerX + 48, y: centerY - 10, "font-size": 11 }, ["θ=" + format(data.angleDeg, 2) + "°"]));
    svg.appendChild(svgElement(doc, "text", { x: centerX + radius + 5, y: centerY + 4, "font-size": 11 }, ["v₁(A)"]));
    svg.appendChild(svgElement(doc, "text", { x: centerX + radius * Math.cos(data.angle) + 5, y: centerY - radius * Math.sin(data.angle) - 5, "font-size": 11 }, ["v₁(A+E)"]));

    var chartLeft = 360;
    var chartRight = 674;
    var chartTop = 48;
    var chartBottom = 250;
    var values = [data.sigma1, data.singularValuesAfter[0], data.sigma2, data.singularValuesAfter[1]];
    var maximum = Math.max(1, Math.max.apply(null, values) * 1.18);
    var mapY = function (value) { return chartBottom - (chartBottom - chartTop) * value / maximum; };
    svg.appendChild(svgElement(doc, "text", { x: chartLeft, y: 25, "font-size": 12, "font-weight": 700 }, ["奇异值稳定性与 rank-1 残差"]));
    svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartBottom, x2: chartRight, y2: chartBottom, class: "svd-axis" }, []));
    [0, maximum / 2, maximum].forEach(function (value) {
      var y = mapY(value);
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: y, x2: chartRight, y2: y, class: "svd-grid" }, []));
      svg.appendChild(svgElement(doc, "text", { x: chartLeft - 8, y: y + 4, "text-anchor": "end", "font-size": 10 }, [format(value, 1)]));
    });
    var labels = ["σ₁ A", "σ₁ A+E", "σ₂ A", "σ₂ A+E"];
    var classes = ["svd-bar-base", "svd-bar-perturbed", "svd-bar-residual", "svd-bar-perturbed"];
    var group = (chartRight - chartLeft) / values.length;
    values.forEach(function (value, index) {
      var x = chartLeft + group * index + group * 0.2;
      var width = group * 0.6;
      svg.appendChild(svgElement(doc, "rect", { x: x, y: mapY(value), width: width, height: chartBottom - mapY(value), class: classes[index] }, []));
      svg.appendChild(svgElement(doc, "text", { x: x + width / 2, y: chartBottom + 17, "text-anchor": "middle", "font-size": 10 }, [labels[index]]));
      svg.appendChild(svgElement(doc, "text", { x: x + width / 2, y: mapY(value) - 6, "text-anchor": "middle", "font-size": 10 }, [format(value, 3)]));
    });
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !root.appendChild) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var uid = "cl-svd-" + INSTANCE;
    var shell = element(doc, "div", { className: "svd-lab" }, []);
    var state = presetState(presetById(DEFAULT.presetId));
    var prediction = { values: null, vectors: null, residual: null, certificate: null };
    var revealed = false;
    var score = 0;
    var refs = {};
    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function complete() {
      return Object.keys(prediction).every(function (key) { return prediction[key] !== null; });
    }

    function addQuestion(container, key, prompt, options) {
      var fieldset = element(doc, "fieldset", { className: "svd-question" }, [element(doc, "legend", {}, [prompt])]);
      var row = element(doc, "div", { className: "svd-choice-grid", role: "group", "aria-label": prompt }, []);
      options.forEach(function (option) {
        var button = element(doc, "button", { type: "button", "aria-pressed": prediction[key] === option.value ? "true" : "false", disabled: revealed }, [option.label]);
        button.addEventListener("click", function () {
          if (revealed) return;
          prediction[key] = option.value;
          renderShell();
        });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      container.appendChild(fieldset);
    }

    function buildPrediction() {
      shell.appendChild(element(doc, "h3", {}, ["SVD 扰动台：奇异值稳定，奇异向量未必稳定"]));
      shell.appendChild(element(doc, "p", { className: "svd-note" }, [revealed ? "预测已提交；现在可以连续改变 σ₂ 和 ||E||₂，观察 Weyl、gap 证书与低秩残差。" : "这是一个对称正定 2×2 toy：先预测，再打开确定的矩阵账本。"]));
      shell.appendChild(element(doc, "div", { className: "svd-prompt" }, [revealed ? "同一个 ||E||₂ 可以给出很小的奇异值变化，却在小 gap 下造成很大的向量旋转。" : "预测门：把“谱值的 Lipschitz 稳定性”和“方向的 gap 敏感性”分开。"]));
      var questions = element(doc, "div", { className: "svd-question-list" }, []);
      addQuestion(questions, "values", "1 · Weyl 对奇异值给出的正确读法是？", [
        { value: "bound", label: "|Δσᵢ|≤||E||₂" }, { value: "gap", label: "必须除以 gap" }, { value: "exact", label: "每次正好等于 ||E||₂" }
      ]);
      addQuestion(questions, "vectors", "2 · gap 变小时，同样大小的扰动对奇异向量会怎样？", [
        { value: "sensitive", label: "可能明显旋转" }, { value: "fixed", label: "仍完全不动" }, { value: "zero", label: "奇异值变成 0" }
      ]);
      addQuestion(questions, "residual", "3 · rank-1 截断 SVD 的 2-范数残差在本 toy 中等于？", [
        { value: "next", label: "σ₂(A+E)" }, { value: "top", label: "σ₁(A+E)" }, { value: "perturbation", label: "||E||₂" }
      ]);
      addQuestion(questions, "certificate", "4 · 使用 ||E||₂/(gap−||E||₂) 的角度证书，首先要什么？", [
        { value: "positive", label: "gap−||E||₂>0" }, { value: "none", label: "不需要 gap" }, { value: "rank", label: "A 必须满秩三次" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "svd-actions" }, []);
      var check = element(doc, "button", { type: "button", className: "svd-primary", disabled: revealed || !complete() }, [revealed ? "已提交，账本已揭示" : "提交预测并揭示"]);
      check.addEventListener("click", function () {
        if (!complete()) return;
        var answers = { values: "bound", vectors: "sensitive", residual: "next", certificate: "positive" };
        score = Object.keys(answers).reduce(function (total, key) { return total + (prediction[key] === answers[key] ? 1 : 0); }, 0);
        revealed = true;
        renderShell();
        announce("预测已提交，Weyl、gap 和低秩残差账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(check);
      actions.appendChild(reset);
      shell.appendChild(actions);
      var feedback = !complete() ? "请为四个判断各选一项。" : revealed ? "预测已提交，" + score + "/4 命中。" : "四项预测已记录，点击提交后才会显示数值。";
      shell.appendChild(element(doc, "p", { className: "svd-feedback " + (revealed ? (score === 4 ? "svd-pass" : "svd-warn") : ""), "aria-live": "polite" }, [feedback]));
    }

    function addRange(container, key, label, minimum, maximum, step, formatter) {
      var id = uid + "-" + key;
      var output = element(doc, "output", { for: id }, [""]);
      var input = element(doc, "input", { id: id, type: "range", min: String(minimum), max: String(maximum), step: String(step), value: String(state[key]), "aria-label": label }, []);
      input.addEventListener("input", function () {
        state[key] = clamp(Number(input.value), minimum, maximum);
        state.presetId = "custom";
        renderResults();
      });
      container.appendChild(element(doc, "div", { className: "svd-control" }, [
        element(doc, "label", { htmlFor: id }, [label + " = ", output]), input,
        element(doc, "div", { className: "svd-scale" }, [element(doc, "span", {}, [formatter(minimum)]), element(doc, "span", {}, [formatter((minimum + maximum) / 2)]), element(doc, "span", {}, [formatter(maximum)])])
      ]));
      return { input: input, output: output };
    }

    function buildControls() {
      var controls = element(doc, "section", { className: "svd-controls", "aria-labelledby": uid + "-controls" }, [element(doc, "h4", { id: uid + "-controls" }, ["揭示后的参数"])]);
      refs.sigma2 = addRange(controls, "sigma2", "第二奇异值 σ₂", 0.5, 2.99, 0.01, function (value) { return format(value, 2); });
      refs.eta = addRange(controls, "eta", "扰动 ||E||₂", 0, 0.2, 0.005, function (value) { return format(value, 3); });
      var presetSet = element(doc, "fieldset", {}, [element(doc, "legend", {}, ["教学预设"])]);
      var presetGrid = element(doc, "div", { className: "svd-preset-grid" }, []);
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", "aria-pressed": preset.id === state.presetId ? "true" : "false" }, [preset.label]);
        button.addEventListener("click", function () {
          state = presetState(preset);
          renderResults();
          announce("已切换到" + preset.label + "。");
        });
        presetGrid.appendChild(button);
      });
      presetSet.appendChild(presetGrid);
      controls.appendChild(presetSet);
      controls.appendChild(element(doc, "p", { className: "svd-note" }, ["这里的 A=diag(σ₁,σ₂)，E 的非零项为 E₁₂=E₂₁=η；正定对称 toy 让右奇异向量等同于特征向量，方便把 gap 证书逐项算清。"]));
      var reset = element(doc, "button", { type: "button" }, ["重新预测"]);
      reset.addEventListener("click", resetToGate);
      controls.appendChild(reset);
      return controls;
    }

    function buildStage() {
      var stage = element(doc, "section", { className: "svd-stage", "aria-labelledby": uid + "-stage" }, []);
      refs.svg = svgElement(doc, "svg", { class: "svd-svg", width: "700", height: "300", viewBox: "0 0 700 300", role: "img" }, []);
      stage.appendChild(element(doc, "div", { className: "svd-stage-frame" }, [
        element(doc, "div", { className: "svd-stage-title" }, [element(doc, "span", { id: uid + "-stage" }, ["向量旋转与奇异值条形图"]), element(doc, "span", {}, ["蓝：A；红：A+E；金：rank-1 残差"])]),
        refs.svg,
        element(doc, "div", { className: "svd-legend" }, [element(doc, "span", {}, [element(doc, "i", { className: "svd-swatch svd-swatch-blue" }, []), "基准 A"]), element(doc, "span", {}, [element(doc, "i", { className: "svd-swatch svd-swatch-red" }, []), "扰动 A+E"]), element(doc, "span", {}, [element(doc, "i", { className: "svd-swatch svd-swatch-gold" }, []), "低秩残差"])])
      ]));
      refs.metrics = [metric(doc, "||E||₂"), metric(doc, "max |Δσᵢ|"), metric(doc, "gap"), metric(doc, "向量角 θ"), metric(doc, "sin θ"), metric(doc, "rank-1 残差")];
      stage.appendChild(element(doc, "div", { className: "svd-metrics" }, refs.metrics.map(function (item) { return item.node; })));
      stage.appendChild(element(doc, "h4", {}, ["Weyl 与 gap 证书账本"]));
      refs.spectrumTable = table(doc, "Weyl 奇异值与 gap 账本", ["账本项", "数值", "证书 / 读法"]);
      stage.appendChild(element(doc, "div", { className: "svd-table-wrap" }, [refs.spectrumTable]));
      stage.appendChild(element(doc, "h4", {}, ["低秩逼近残差账本"]));
      refs.residualTable = table(doc, "截断 SVD 残差账本", ["对象", "数值", "核对"]);
      stage.appendChild(element(doc, "div", { className: "svd-table-wrap" }, [refs.residualTable]));
      refs.interpretation = element(doc, "p", { className: "svd-interpretation", "aria-live": "polite" }, [""]);
      stage.appendChild(refs.interpretation);
      return stage;
    }

    function renderResults() {
      if (!revealed) return;
      var data = compute(state);
      refs.sigma2.input.value = String(data.sigma2);
      refs.sigma2.output.textContent = format(data.sigma2, 3);
      refs.eta.input.value = String(data.eta);
      refs.eta.output.textContent = format(data.eta, 3);
      refs.metrics[0].value.textContent = format(data.normE, 5);
      refs.metrics[1].value.textContent = format(data.maxSingularShift, 5);
      refs.metrics[2].value.textContent = format(data.gap, 5);
      refs.metrics[3].value.textContent = format(data.angleDeg, 3) + "°";
      refs.metrics[4].value.textContent = format(data.sinAngle, 6);
      refs.metrics[5].value.textContent = format(data.lowRankSpectral, 5);
      drawSvg(doc, refs.svg, data, uid);
      var after = data.singularValuesAfter;
      replaceRows(refs.spectrumTable, [
        ["A 与 E", "A=diag(" + format(data.sigma1, 3) + "," + format(data.sigma2, 3) + ")；||E||₂=" + format(data.normE, 5), "||E||₂ 是本 toy 的精确扰动范数"],
        ["奇异值", "σ(A)=" + data.singularValuesBefore.map(function (value) { return format(value, 5); }).join(", ") + "；σ(A+E)=" + after.map(function (value) { return format(value, 5); }).join(", "), "对称正定时就是两条特征值"],
        ["Weyl 最大位移", format(data.maxSingularShift, 8), "≤||E||₂；余量=" + format(data.weylMargin, 8)],
        ["gap", format(data.gap, 8), "σ₁(A)−σ₂(A)，方向稳定性的分母尺度"],
        ["扰动后分离下界", format(data.gapLower, 8), "Weyl 给出的 gap−||E||₂；必须为正才是有信息的证书"],
        ["角度证书", data.gapCertificateValid ? "sin θ≤min(1," + format(data.gapCertificateRaw, 6) + ")" : "无：gap−||E||₂≤0", "小 gap 时证书变宽，不能把 Weyl 当成向量稳定"],
        ["实际向量角", format(data.angleDeg, 6) + "°；sin θ=" + format(data.sinAngle, 8), "同样的 ||E||₂，gap 越小角度越大"]
      ]);
      replaceRows(refs.residualTable, [
        ["rank-1 近似", "A₁=σ₁(A+E)v₁v₁ᵀ", "v₁ 是扰动后顶右奇异向量"],
        ["2-范数残差", format(data.lowRankSpectral, 8), "||A+E−A₁||₂=σ₂(A+E)；差=" + format(data.residualSpectralIdentity, 3)],
        ["Frobenius 残差", format(data.lowRankFrobenius, 8), "2×2 rank-1 时也等于 σ₂；差=" + format(data.residualFrobeniusIdentity, 3)],
        ["Weyl 与低秩分工", "值的位移 ≤||E||₂；残差=下一奇异值", "稳定性结论与压缩误差结论是两笔不同账"]
      ]);
      var certificateText = data.gapCertificateValid ? "gap−||E||₂ 为正，角度证书可用但可能很宽。" : "gap−||E||₂ 不为正，角度证书失效；这不否定 Weyl，只说明方向分离不足。";
      refs.interpretation.textContent = data.label + "：奇异值最大位移 " + format(data.maxSingularShift, 5) + " ≤ ||E||₂=" + format(data.normE, 5) + "；" + certificateText + " rank-1 残差仍精确等于 σ₂(A+E)=" + format(after[1], 5) + "。";
    }

    function buildRevealed() {
      var panel = element(doc, "section", { className: "svd-revealed" }, [element(doc, "h4", {}, ["结果与透明账本"]), element(doc, "p", { className: "svd-note" }, ["拖动 σ₂ 改变 gap，拖动 ||E||₂ 改变扰动；每次都同时更新 Weyl 位移、向量角度、分离证书和截断残差。"])]);
      panel.appendChild(element(doc, "div", { className: "svd-layout" }, [buildControls(), buildStage()]));
      shell.appendChild(panel);
      renderResults();
    }

    function renderShell() {
      refs = {};
      shell.replaceChildren();
      buildPrediction();
      if (revealed) buildRevealed();
    }

    function resetToGate() {
      state = presetState(presetById(DEFAULT.presetId));
      prediction = { values: null, vectors: null, residual: null, certificate: null };
      revealed = false;
      score = 0;
      renderShell();
      announce("已重置；请重新完成 SVD 扰动预测。");
    }

    renderShell();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }

    var large = compute(presetState(PRESETS[0]));
    assert(near(large.normE, 0.05, 1e-12), "large perturbation norm");
    assert(large.maxSingularShift <= large.normE + 1e-12, "Weyl large gap");
    assert(large.gapCertificateValid, "large gap certificate valid");
    assert(large.residualSpectralIdentity < 1e-12, "large spectral residual equals sigma2");
    assert(large.residualFrobeniusIdentity < 1e-12, "large Frobenius residual equals sigma2");

    var small = compute(presetState(PRESETS[1]));
    assert(small.maxSingularShift <= small.normE + 1e-12, "Weyl small gap");
    assert(small.angleDeg > large.angleDeg * 10, "small gap rotates vector more");
    assert(small.sinAngle > large.sinAngle, "small gap sine angle");
    assert(small.gapLower <= 0, "small preset reaches certificate boundary");

    var failed = compute(presetState(PRESETS[2]));
    assert(!failed.gapCertificateValid, "failed gap certificate is marked invalid");
    assert(failed.gapCertificate === null, "invalid certificate is null");
    assert(failed.maxSingularShift <= failed.normE + 1e-12, "Weyl survives failed gap");

    var custom = compute({ presetId: "custom", sigma1: 4, sigma2: 1, eta: 0 });
    assert(near(custom.singularValuesAfter[0], 4, 1e-12) && near(custom.singularValuesAfter[1], 1, 1e-12), "zero perturbation spectrum");
    assert(near(custom.angle, 0, 1e-12), "zero perturbation vector angle");
    assert(near(custom.lowRankSpectral, 1, 1e-12), "zero perturbation rank one residual");

    PRESETS.forEach(function (preset) {
      var data = compute(presetState(preset));
      assert(finite(data.singularValuesAfter[0]) && finite(data.singularValuesAfter[1]), preset.id + " finite spectrum");
      assert(data.singularValuesAfter[0] >= data.singularValuesAfter[1] && data.singularValuesAfter[1] > 0, preset.id + " ordered positive spectrum");
      assert(data.lowRankSpectral >= 0 && data.lowRankFrobenius >= 0, preset.id + " residual nonnegative");
      assert(data.residualSpectralIdentity < 1e-12, preset.id + " spectral residual identity");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    compute: compute,
    symmetricSpectrum: symmetricSpectrum,
    mount: mount,
    selfTest: selfTest
  };
});
