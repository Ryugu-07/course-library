(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("matrix-order-functions", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "matrix-order-functions self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)"
      );
    } catch (error) {
      console.error("matrix-order-functions self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : this,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "matrix-order-functions-lab-styles";
    var EPS = 1e-10;
    var PRESETS = [
      { id: "square", label: "平方反例", description: "A ≽ B 但 A² ⋡ B²" },
      { id: "congruence", label: "共轭保序", description: "Xᵀ(A−B)X 仍为 PSD" },
      { id: "inverse", label: "求逆反序", description: "B⁻¹ ≽ A⁻¹" },
      { id: "schur", label: "Schur/LMI", description: "条件方差与 A>0 证书" }
    ];
    var DEFAULTS = { focus: "square" };
    var QUESTIONS = [
      {
        id: "square",
        prompt: "A ≽ B 是否必然推出 A² ≽ B²？",
        options: [
          { id: "no", label: "不必然" },
          { id: "yes", label: "必然" },
          { id: "scalar", label: "只看对角线" }
        ],
        answer: "no"
      },
      {
        id: "congruence",
        prompt: "A ≽ B 经过 Xᵀ(·)X 后会怎样？",
        options: [
          { id: "preserve", label: "仍保序" },
          { id: "reverse", label: "必反序" },
          { id: "unknown", label: "只在 X 可逆时" }
        ],
        answer: "preserve"
      },
      {
        id: "inverse",
        prompt: "A ≽ B ≻ 0 求逆后的方向？",
        options: [
          { id: "reverse", label: "B⁻¹ ≽ A⁻¹" },
          { id: "same", label: "A⁻¹ ≽ B⁻¹" },
          { id: "none", label: "不能比较" }
        ],
        answer: "reverse"
      },
      {
        id: "schur",
        prompt: "Schur/LMI 等价式的关键前提？",
        options: [
          { id: "positive", label: "A > 0" },
          { id: "nonsingular", label: "只要 A 可逆" },
          { id: "scalar", label: "只需 C > 0" }
        ],
        answer: "positive"
      }
    ];

    var STYLE_TEXT = [
      ".mof-lab{--mof-blue:var(--cl-blue,#315f9d);--mof-red:var(--cl-red,#b64335);--mof-gold:var(--cl-gold,#9b6a12);--mof-green:var(--cl-green,#39734d);max-width:100%;min-width:0;overflow-wrap:anywhere;color:var(--fg);line-height:1.55}",
      "html[data-theme=dark] .mof-lab{--mof-blue:#83c8ff;--mof-red:#f08c7d;--mof-gold:#e2b458;--mof-green:#72bd8b}",
      ".mof-lab *,.mof-lab *::before,.mof-lab *::after{box-sizing:border-box}.mof-lab [hidden]{display:none!important}",
      ".mof-lab h3,.mof-lab h4{margin:0;color:var(--fg);letter-spacing:0}.mof-lab h3{font-size:1.18rem}.mof-lab h4{margin-top:15px;font-size:1rem}",
      ".mof-lab .mof-note,.mof-lab .mof-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.mof-lab .mof-prompt{margin:13px 0;padding:11px 13px;border-left:3px solid var(--mof-gold);background:var(--bg)}",
      ".mof-lab fieldset{min-width:0;margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.mof-lab legend{max-width:100%;padding:0 4px;color:var(--fg-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere}",
      ".mof-lab .mof-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.mof-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.mof-lab button:hover{border-color:var(--accent)}.mof-lab button[aria-pressed=true],.mof-lab button.mof-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.mof-lab button:disabled{cursor:not-allowed;opacity:.55}.mof-lab button:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".mof-lab .mof-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.mof-lab .mof-actions>*{flex:1 1 170px}.mof-lab .mof-feedback{min-height:2em;margin:8px 0;font-weight:700}.mof-lab .mof-pass{color:var(--mof-green)}.mof-lab .mof-warn{color:var(--mof-red)}",
      ".mof-lab .mof-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.mof-lab .mof-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}.mof-lab .mof-controls,.mof-lab .mof-output{min-width:0}",
      ".mof-lab .mof-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.mof-lab .mof-controls h4{margin:0}.mof-lab .mof-preset-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:7px}.mof-lab .mof-preset-grid button{text-align:left;font-size:12px}",
      ".mof-lab .mof-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px}.mof-lab .mof-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.mof-lab .mof-metric:nth-child(4n+1){border-top-color:var(--mof-blue)}.mof-lab .mof-metric:nth-child(4n+2){border-top-color:var(--mof-gold)}.mof-lab .mof-metric:nth-child(4n+3){border-top-color:var(--mof-green)}.mof-lab .mof-metric:nth-child(4n){border-top-color:var(--mof-red)}.mof-lab .mof-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.mof-lab .mof-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".mof-lab .mof-status,.mof-lab .mof-boundary{margin:10px 0;padding:10px 12px;border-left:3px solid var(--mof-blue);background:var(--bg);font-size:13px;line-height:1.7}.mof-lab .mof-boundary{border-left-color:var(--mof-gold)}.mof-lab .mof-chart-scroll,.mof-lab .mof-table-scroll{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.mof-lab .mof-chart-frame{min-width:0;padding:6px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.mof-lab svg{display:block;width:100%;height:auto;min-width:620px}.mof-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.mof-lab .mof-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.75}.mof-lab .mof-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7}.mof-lab .mof-positive{fill:var(--mof-green);opacity:.84}.mof-lab .mof-negative{fill:var(--mof-red);opacity:.84}.mof-lab .mof-zero{stroke:var(--mof-gold);stroke-width:1.4;stroke-dasharray:5 4}.mof-lab .mof-chart-label{font-size:11px}.mof-lab .mof-chart-title{font-size:13px;font-weight:750}",
      ".mof-lab .mof-matrix-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.mof-lab .mof-matrix-block{min-width:0;padding:9px;border:1px solid var(--border);background:var(--bg)}.mof-lab .mof-matrix-block h4{margin:0 0 6px;font-size:13px}.mof-lab table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.mof-lab .mof-matrix-block table{min-width:180px}.mof-lab caption{padding:8px 0;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.mof-lab th,.mof-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.mof-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.mof-lab .mof-good{color:var(--mof-green);font-weight:750}.mof-lab .mof-bad{color:var(--mof-red);font-weight:750}",
      "@media(max-width:900px){.mof-lab .mof-layout{grid-template-columns:minmax(0,1fr)}.mof-lab .mof-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.mof-lab .mof-choice-grid{grid-template-columns:minmax(0,1fr)}.mof-lab .mof-matrix-grid{grid-template-columns:minmax(0,1fr)}.mof-lab .mof-chart-frame{padding:4px}.mof-lab table{font-size:11.5px}.mof-lab th,.mof-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.mof-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || EPS) * scale;
    }

    function cloneMatrix(matrix) {
      return matrix.map(function (row) { return row.slice(); });
    }

    function transpose(matrix) {
      return matrix[0].map(function (_, column) {
        return matrix.map(function (row) { return row[column]; });
      });
    }

    function multiply(left, right) {
      var output = [];
      for (var row = 0; row < left.length; row += 1) {
        output[row] = [];
        for (var column = 0; column < right[0].length; column += 1) {
          var value = 0;
          for (var index = 0; index < right.length; index += 1) value += left[row][index] * right[index][column];
          output[row][column] = value;
        }
      }
      return output;
    }

    function subtract(left, right) {
      return left.map(function (row, rowIndex) {
        return row.map(function (value, columnIndex) { return value - right[rowIndex][columnIndex]; });
      });
    }

    function determinant2(matrix) {
      return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }

    function inverse2(matrix) {
      var determinant = determinant2(matrix);
      if (Math.abs(determinant) < EPS) throw new Error("matrix is singular");
      return [
        [matrix[1][1] / determinant, -matrix[0][1] / determinant],
        [-matrix[1][0] / determinant, matrix[0][0] / determinant]
      ];
    }

    function symmetricEigenvalues(matrix) {
      var mean = (matrix[0][0] + matrix[1][1]) / 2;
      var radius = Math.sqrt(Math.pow((matrix[0][0] - matrix[1][1]) / 2, 2) + matrix[0][1] * matrix[0][1]);
      return [mean + radius, mean - radius];
    }

    function isSymmetric(matrix) {
      return near(matrix[0][1], matrix[1][0], 1e-12);
    }

    function isPSD(matrix) {
      return isSymmetric(matrix) && symmetricEigenvalues(matrix)[1] >= -EPS;
    }

    function isPD(matrix) {
      return isSymmetric(matrix) && symmetricEigenvalues(matrix)[1] > EPS;
    }

    function congruence(matrix, transform) {
      return multiply(multiply(transpose(transform), matrix), transform);
    }

    function format(value, digits) {
      if (!finite(value)) return "—";
      if (Math.abs(value) < 0.0005) return "0";
      var places = digits === undefined ? 4 : digits;
      if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function presetById(id) {
      return PRESETS.filter(function (item) { return item.id === id; })[0] || PRESETS[0];
    }

    function normalizeParams(input) {
      var focus = input && input.focus ? input.focus : DEFAULTS.focus;
      return { focus: presetById(focus).id };
    }

    function evaluate(input) {
      var params = normalizeParams(input);
      var A = [[2, 1], [1, 1]];
      var B = [[1, 0], [0, 0]];
      var difference = subtract(A, B);
      var squareDifference = subtract(multiply(A, A), multiply(B, B));
      var X = [[1, 2], [0, 1]];
      var congruentDifference = congruence(difference, X);
      var inverseAInput = [[3, 0], [0, 2]];
      var inverseBInput = [[2, 0], [0, 1]];
      var inverseGap = subtract(inverse2(inverseBInput), inverse2(inverseAInput));
      var schurA = [[4]];
      var schurB = [[2]];
      var schurC = [[3]];
      var schur = schurC[0][0] - schurB[0][0] * inverse2([[4, 0], [0, 1]])[0][0] * schurB[0][0];
      var lmi = [[4, 2], [2, 3]];
      var eigenA = symmetricEigenvalues(A);
      return {
        params: params,
        preset: presetById(params.focus),
        A: A,
        B: B,
        difference: difference,
        squareDifference: squareDifference,
        differenceEigenvalues: symmetricEigenvalues(difference),
        squareDifferenceEigenvalues: symmetricEigenvalues(squareDifference),
        squareDifferenceDeterminant: determinant2(squareDifference),
        X: X,
        congruentDifference: congruentDifference,
        congruentEigenvalues: symmetricEigenvalues(congruentDifference),
        inverseA: inverse2(inverseAInput),
        inverseB: inverse2(inverseBInput),
        inverseGap: inverseGap,
        inverseGapEigenvalues: symmetricEigenvalues(inverseGap),
        schurA: schurA,
        schurB: schurB,
        schurC: schurC,
        schur: schur,
        conditionalVariance: schur,
        lmi: lmi,
        lmiEigenvalues: symmetricEigenvalues(lmi),
        APositive: isPD(A),
        AFunctionEigenvalues: eigenA,
        functions: [
          { name: "sqrt(t)", scalar: "单调", operator: "正定域算子单调", domain: "t>0" },
          { name: "log(t)", scalar: "单调", operator: "正定域算子单调", domain: "t>0" },
          { name: "−1/t", scalar: "单调递增", operator: "正定域算子单调", domain: "t>0" },
          { name: "t²", scalar: "正数上单调", operator: "不是算子单调", domain: "标量 t>0" }
        ]
      };
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
      if (children === undefined || children === null) return node;
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
      });
      return node;
    }

    function element(doc, tag, className, children) {
      return appendChildren(setAttributes(doc.createElement(tag), { className: className }), children);
    }

    function svgNode(doc, tag, attrs, children) {
      return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children);
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function replace(node, children) {
      clear(node);
      appendChildren(node, children);
    }

    function installStyles(doc) {
      if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement || doc.body).appendChild(style);
    }

    function metric(doc, label, value) {
      return element(doc, "div", "mof-metric", [element(doc, "span", "", label), element(doc, "strong", "", value)]);
    }

    function chartText(doc, x, y, text, className, attrs) {
      var all = attrs || {};
      all.x = x;
      all.y = y;
      all.className = className || "mof-chart-label";
      return svgNode(doc, "text", all, text);
    }

    function drawChart(doc, result) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 760 340",
        role: "img",
        "aria-label": "Löwner 证书的特征值柱状图"
      });
      svg.appendChild(svgNode(doc, "title", {}, "矩阵序证书：正半轴与平方反例"));
      svg.appendChild(svgNode(doc, "desc", {}, "左图显示 A-B 与 A²-B² 的特征值，右图显示共轭、求逆和 Schur 证书的最小值。"));
      var left = { x: 34, y: 32, width: 350, height: 246 };
      var right = { x: 414, y: 32, width: 312, height: 246 };
      [left, right].forEach(function (panel) {
        svg.appendChild(svgNode(doc, "rect", { x: panel.x, y: panel.y, width: panel.width, height: panel.height, fill: "var(--bg)", stroke: "var(--border)", "stroke-width": 1 }));
      });
      var min = -0.5;
      var max = 6.5;
      function y(value) { return left.y + (max - clamp(value, min, max)) / (max - min) * left.height; }
      function x(index, count) { return left.x + 45 + index * ((left.width - 70) / Math.max(1, count - 1)); }
      [-0.5, 0, 3, 6].forEach(function (tick) {
        var py = y(tick);
        svg.appendChild(svgNode(doc, "line", { x1: left.x + 18, x2: left.x + left.width - 12, y1: py, y2: py, className: tick === 0 ? "mof-zero" : "mof-grid" }));
        svg.appendChild(chartText(doc, left.x + 11, py + 4, format(tick, 1), "mof-chart-label", { "text-anchor": "end" }));
      });
      var groups = [
        { label: "A−B", values: result.differenceEigenvalues, className: "mof-positive" },
        { label: "A²−B²", values: result.squareDifferenceEigenvalues, className: "mof-negative" }
      ];
      groups.forEach(function (group, groupIndex) {
        group.values.forEach(function (value, index) {
          var center = left.x + 90 + groupIndex * 150 + index * 42;
          var zero = y(0);
          var top = y(value);
          svg.appendChild(svgNode(doc, "rect", { x: center - 14, y: Math.min(zero, top), width: 28, height: Math.max(1, Math.abs(top - zero)), className: value < 0 ? "mof-negative" : group.className }));
          svg.appendChild(chartText(doc, center, left.y + left.height + 19, group.label + " λ" + (index + 1), "mof-chart-label", { "text-anchor": "middle" }));
          svg.appendChild(chartText(doc, center, top - 6, format(value, 3), "mof-chart-label", { "text-anchor": "middle" }));
        });
      });
      svg.appendChild(chartText(doc, left.x + 12, left.y + 18, "平方反例的谱证据", "mof-chart-title"));

      var certificates = [
        { label: "共轭", value: result.congruentEigenvalues[1] },
        { label: "求逆", value: result.inverseGapEigenvalues[1] },
        { label: "Schur", value: result.schur },
        { label: "LMI", value: result.lmiEigenvalues[1] }
      ];
      var certMax = Math.max(1, certificates.reduce(function (maximum, item) { return Math.max(maximum, item.value); }, 0));
      function cy(value) { return right.y + right.height - 35 - value / certMax * (right.height - 80); }
      certificates.forEach(function (item, index) {
        var center = right.x + 42 + index * 67;
        var bottom = right.y + right.height - 35;
        var top = cy(item.value);
        svg.appendChild(svgNode(doc, "rect", { x: center - 18, y: top, width: 36, height: Math.max(1, bottom - top), className: "mof-positive" }));
        svg.appendChild(chartText(doc, center, bottom + 19, item.label, "mof-chart-label", { "text-anchor": "middle" }));
        svg.appendChild(chartText(doc, center, top - 6, format(item.value, 3), "mof-chart-label", { "text-anchor": "middle" }));
      });
      svg.appendChild(chartText(doc, right.x + 12, right.y + 18, "正性证书的最小值", "mof-chart-title"));
      svg.appendChild(chartText(doc, right.x + 12, right.y + right.height - 10, "非负柱：当前有限证书", "mof-chart-label"));
      return svg;
    }

    function matrixTable(doc, label, matrix) {
      var table = element(doc, "table", "", []);
      table.appendChild(element(doc, "caption", "", label));
      var body = element(doc, "tbody", "", []);
      matrix.forEach(function (row) {
        body.appendChild(element(doc, "tr", "", row.map(function (value) { return element(doc, "td", "", format(value, 4)); })));
      });
      table.appendChild(body);
      return table;
    }

    function certificateTable(doc, result) {
      var rows = [
        ["A−B", format(result.differenceEigenvalues[1], 4), isPSD(result.difference) ? "PSD" : "非 PSD", "原序关系成立"],
        ["A²−B²", format(result.squareDifferenceDeterminant, 4), isPSD(result.squareDifference) ? "PSD" : "非 PSD", "det<0 击穿平方保序"],
        ["Xᵀ(A−B)X", format(result.congruentEigenvalues[1], 4), isPSD(result.congruentDifference) ? "PSD" : "非 PSD", "共轭保序"],
        ["B⁻¹−A⁻¹", format(result.inverseGapEigenvalues[1], 4), isPSD(result.inverseGap) ? "PSD" : "非 PSD", "求逆反序"],
        ["Schur = C−BᵀA⁻¹B", format(result.schur, 4), result.schur >= -EPS ? "非负" : "负", "条件方差 = 2；A>0"],
        ["LMI 最小特征值", format(result.lmiEigenvalues[1], 4), isPSD(result.lmi) ? "PSD" : "非 PSD", "等价式使用 A>0"]
      ];
      var table = element(doc, "table", "", []);
      table.appendChild(element(doc, "caption", "", "有限证书表；“PSD”只针对表中给出的具体矩阵。"));
      table.appendChild(element(doc, "thead", "", [element(doc, "tr", "", ["证书", "数值", "判定", "读法"].map(function (value) { return element(doc, "th", "", value); }))]));
      var body = element(doc, "tbody", "", []);
      rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", "", row.map(function (value, index) { return element(doc, index === 0 ? "th" : "td", "", value); })));
      });
      table.appendChild(body);
      return table;
    }

    function renderOutput(doc, output, result) {
      replace(output, []);
      output.appendChild(element(doc, "div", "mof-metrics", [
        metric(doc, "当前焦点", result.preset.label),
        metric(doc, "A>0？", result.APositive ? "是" : "否"),
        metric(doc, "A−B 最小特征值", format(result.differenceEigenvalues[1], 4)),
        metric(doc, "A²−B² 行列式", format(result.squareDifferenceDeterminant, 4)),
        metric(doc, "共轭最小特征值", format(result.congruentEigenvalues[1], 4)),
        metric(doc, "逆序最小特征值", format(result.inverseGapEigenvalues[1], 4)),
        metric(doc, "条件方差", format(result.conditionalVariance, 4)),
        metric(doc, "LMI 最小特征值", format(result.lmiEigenvalues[1], 4))
      ]));
      var status = result.params.focus === "square"
        ? "平方焦点：A−B 是 PSD，但 A²−B² 有一个负特征值；这不是舍入误差，而是矩阵乘法不交换带来的真实反例。"
        : result.params.focus === "congruence"
          ? "共轭焦点：Xᵀ(A−B)X 仍是 PSD，因为每个测试向量都可改写成 Xv。"
          : result.params.focus === "inverse"
            ? "求逆焦点：正定域内方向反转，B⁻¹−A⁻¹ 的最小特征值为正。"
            : "Schur 焦点：3−2(1/4)2=2；LMI 证书的等价式明确依赖 A>0。";
      output.appendChild(element(doc, "p", "mof-status", status));
      output.appendChild(element(doc, "div", "mof-chart-scroll", [element(doc, "div", "mof-chart-frame", [drawChart(doc, result)])]));
      output.appendChild(element(doc, "div", "mof-matrix-grid", [
        element(doc, "div", "mof-matrix-block", [element(doc, "h4", "", "A−B"), matrixTable(doc, "具体矩阵", result.difference)]),
        element(doc, "div", "mof-matrix-block", [element(doc, "h4", "", "A²−B²"), matrixTable(doc, "具体矩阵", result.squareDifference)]),
        element(doc, "div", "mof-matrix-block", [element(doc, "h4", "", "Xᵀ(A−B)X"), matrixTable(doc, "具体矩阵", result.congruentDifference)]),
        element(doc, "div", "mof-matrix-block", [element(doc, "h4", "", "B⁻¹−A⁻¹"), matrixTable(doc, "具体矩阵", result.inverseGap)])
      ]));
      output.appendChild(element(doc, "div", "mof-table-scroll", [certificateTable(doc, result)]));
      output.appendChild(element(doc, "p", "mof-boundary", "模型边界：算子单调性是对所有维度的自伴矩阵量词；本实验只展示可直接验算的 2×2 证据。sqrt/log/−1/t 只在正定域陈述，Schur/LMI 等价只在 A>0 的严格前提下使用。"));
    }

    function announce(api, rootElement, message) {
      if (api && typeof api.announce === "function") api.announce(rootElement, message);
    }

    function mount(rootElement, api) {
      if (!rootElement || !rootElement.ownerDocument) return;
      var doc = rootElement.ownerDocument;
      installStyles(doc);
      var state = { focus: DEFAULTS.focus, revealed: false };
      var predictions = {};
      var shell = element(doc, "div", "mof-lab", []);
      shell.appendChild(element(doc, "p", "mof-note", "先预测运算方向，再打开固定 2×2 账本。所有数字由纯函数确定计算，实验不会把有限证据冒充普遍定理。"));
      var predictionBox = element(doc, "div", "mof-prompt", []);
      var choiceButtons = {};
      QUESTIONS.forEach(function (question) {
        var fieldset = element(doc, "fieldset", "", []);
        fieldset.appendChild(element(doc, "legend", "", question.prompt));
        var choices = element(doc, "div", "mof-choice-grid", []);
        choiceButtons[question.id] = [];
        question.options.forEach(function (option) {
          var button = element(doc, "button", "", option.label);
          button.type = "button";
          button.addEventListener("click", function () {
            predictions[question.id] = option.id;
            renderPrediction();
            feedback.textContent = "预测已记录；账本仍隐藏。";
            feedback.className = "mof-feedback";
          });
          choiceButtons[question.id].push({ id: option.id, node: button });
          choices.appendChild(button);
        });
        fieldset.appendChild(choices);
        predictionBox.appendChild(fieldset);
      });
      var actions = element(doc, "div", "mof-actions", []);
      var reveal = element(doc, "button", "mof-primary", "揭示账本");
      var reset = element(doc, "button", "", "重置");
      reveal.type = "button";
      reset.type = "button";
      actions.appendChild(reveal);
      actions.appendChild(reset);
      predictionBox.appendChild(actions);
      var feedback = element(doc, "p", "mof-feedback", "每题先作一个预测。");
      feedback.setAttribute("aria-live", "polite");
      predictionBox.appendChild(feedback);
      shell.appendChild(predictionBox);

      var revealedPanel = element(doc, "div", "mof-revealed", []);
      revealedPanel.hidden = true;
      var layout = element(doc, "div", "mof-layout", []);
      var controls = element(doc, "div", "mof-controls", [element(doc, "h4", "", "揭示后选择证书焦点")]);
      var presetGrid = element(doc, "div", "mof-preset-grid", []);
      var presetButtons = [];
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", "", preset.label + "：" + preset.description);
        button.type = "button";
        button.addEventListener("click", function () {
          state.focus = preset.id;
          render();
          announce(api, rootElement, "已切换到" + preset.label + "，证书表已更新。");
        });
        presetButtons.push({ id: preset.id, node: button });
        presetGrid.appendChild(button);
      });
      controls.appendChild(presetGrid);
      layout.appendChild(controls);
      var output = element(doc, "div", "mof-output", []);
      layout.appendChild(output);
      revealedPanel.appendChild(layout);
      shell.appendChild(revealedPanel);
      replace(rootElement, [shell]);

      function renderPrediction() {
        QUESTIONS.forEach(function (question) {
          choiceButtons[question.id].forEach(function (choice) {
            choice.node.setAttribute("aria-pressed", predictions[question.id] === choice.id ? "true" : "false");
          });
        });
      }

      function render() {
        presetButtons.forEach(function (item) {
          item.node.setAttribute("aria-pressed", item.id === state.focus ? "true" : "false");
        });
        renderPrediction();
        if (!state.revealed) {
          revealedPanel.hidden = true;
          feedback.textContent = Object.keys(predictions).length ? "预测已记录；点击“揭示账本”打开证据。" : "每题先作一个预测。";
          feedback.className = "mof-feedback";
          return;
        }
        revealedPanel.hidden = false;
        renderOutput(doc, output, evaluate(state));
      }

      reveal.addEventListener("click", function () {
        var missing = QUESTIONS.filter(function (question) { return !predictions[question.id]; });
        if (missing.length) {
          feedback.textContent = "请先完成全部预测；答案仍未揭晓。";
          feedback.className = "mof-feedback mof-warn";
          announce(api, rootElement, feedback.textContent);
          return;
        }
        state.revealed = true;
        var correct = QUESTIONS.every(function (question) { return predictions[question.id] === question.answer; });
        feedback.textContent = correct
          ? "预测命中；现在把证据与定理量词分开读。"
          : "预测已核对；请重看平方反例、逆序和 A>0 前提。";
        feedback.className = "mof-feedback " + (correct ? "mof-pass" : "mof-warn");
        render();
        announce(api, rootElement, "预测答案已揭晓，矩阵序证书已显示。");
      });
      reset.addEventListener("click", function () {
        predictions = {};
        state.focus = DEFAULTS.focus;
        state.revealed = false;
        render();
        announce(api, rootElement, "实验已重置，预测答案再次隐藏。");
      });
      render();
      announce(api, rootElement, "矩阵序实验已加载；请先完成四个预测。");
    }

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var result = evaluate(DEFAULTS);
      check(PRESETS.length === 4, "four named matrix certificates");
      check(QUESTIONS.length === 4, "four prediction questions");
      check(isPSD(result.difference), "A-B is PSD");
      check(result.squareDifferenceDeterminant < 0, "square counterexample has negative determinant");
      check(!isPSD(result.squareDifference), "square counterexample is not PSD");
      check(isPSD(result.congruentDifference), "congruence preserves PSD");
      check(isPSD(result.inverseGap), "inverse order reverses");
      check(near(result.schur, 2, 1e-12), "conditional variance Schur value is 2");
      check(result.schurA[0][0] > 0, "Schur pivot A is strictly positive");
      check(isPSD(result.lmi), "LMI certificate is PSD");
      check(result.APositive, "default A is positive definite");
      check(result.functions[0].domain === "t>0", "sqrt is stated on positive domain");
      check(result.functions[1].domain === "t>0", "log is stated on positive domain");
      check(result.functions[2].domain === "t>0", "negative reciprocal is stated on positive domain");
      check(result.functions[3].operator === "不是算子单调", "scalar square is separated from operator monotonicity");
      check(symmetricEigenvalues([[2, 1], [1, 2]])[0] === 3, "2x2 eigenvalue helper");
      check(determinant2(result.squareDifference) === -1, "counterexample determinant is exactly -1");
      check(JSON.stringify(evaluate(DEFAULTS)) === JSON.stringify(evaluate(DEFAULTS)), "evaluation is deterministic");
      return { checks: checks, presets: PRESETS.length };
    }

    return {
      DEFAULTS: DEFAULTS,
      PRESETS: PRESETS,
      QUESTIONS: QUESTIONS,
      determinant2: determinant2,
      inverse2: inverse2,
      symmetricEigenvalues: symmetricEigenvalues,
      isPSD: isPSD,
      isPD: isPD,
      congruence: congruence,
      evaluate: evaluate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
