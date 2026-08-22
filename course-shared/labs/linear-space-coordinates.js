(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("linear-space-coordinates", exported.mount);
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
        "linear-space-coordinates self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("linear-space-coordinates self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-linear-space-coordinates-style";
    var INSTANCE = 0;
    var EPS = 1e-10;
    var DEFAULTS = { presetId: "parameter", t: 0, px: 3, py: 2 };

    var PRESETS = [
      {
        id: "parameter",
        label: "参数族：u=(1,1), v=(2,t)",
        dimension: 2,
        vectors: function (t) { return [[1, 1], [2, t]]; },
        labels: ["u", "v"]
      },
      {
        id: "redundant",
        label: "生成但冗余：e₁, e₂, (t,1)",
        dimension: 2,
        vectors: function (t) { return [[1, 0], [0, 1], [t, 1]]; },
        labels: ["e₁", "e₂", "w"]
      },
      {
        id: "collinear",
        label: "一维退化：u, 2u, tu",
        dimension: 2,
        vectors: function (t) { return [[1, 1], [2, 2], [t, t]]; },
        labels: ["u", "2u", "tu"]
      }
    ];

    var STYLE_TEXT = [
      ".lsc-lab{--lsc-blue:var(--cl-blue,#315f9d);--lsc-gold:var(--cl-gold,#9b6a12);--lsc-green:var(--cl-green,#39734d);--lsc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      ".lsc-lab *,.lsc-lab *::before,.lsc-lab *::after{box-sizing:border-box;}.lsc-lab [hidden]{display:none!important;}",
      ".lsc-lab h3,.lsc-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.lsc-lab h3{font-size:1.18rem;}.lsc-lab h4{margin-top:16px;font-size:1rem;}",
      ".lsc-lab p{margin:.65em 0;}.lsc-lab .lsc-note,.lsc-lab .lsc-feedback,.lsc-lab .lsc-boundary{color:var(--fg-soft);font-size:13px;line-height:1.7;}",
      ".lsc-lab button,.lsc-lab select,.lsc-lab input{font:inherit;letter-spacing:0;}.lsc-lab button,.lsc-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}",
      ".lsc-lab input[type=range],.lsc-lab input[type=number]{min-height:44px;}.lsc-lab input[type=range]{display:block;width:100%;margin:0;accent-color:var(--accent);}.lsc-lab input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);}",
      ".lsc-lab button:hover{border-color:var(--accent);}.lsc-lab button[aria-pressed=\"true\"],.lsc-lab button.lsc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.lsc-lab button:focus-visible,.lsc-lab select:focus-visible,.lsc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".lsc-lab .lsc-predict{margin:14px 0;padding:13px 14px;border-left:3px solid var(--lsc-gold);background:var(--bg);}.lsc-lab .lsc-predict-title{display:block;margin-bottom:10px;font-size:13px;}.lsc-lab .lsc-question-list{display:grid;gap:12px;}.lsc-lab .lsc-question{min-width:0;margin:0;padding:0;border:0;}.lsc-lab .lsc-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}.lsc-lab .lsc-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.lsc-lab .lsc-choice-row button{font-size:12px;}",
      ".lsc-lab .lsc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.lsc-lab .lsc-actions>*{flex:1 1 155px;}.lsc-lab .lsc-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.lsc-lab .lsc-pass,.lsc-lab .lsc-ok{color:var(--lsc-green);}.lsc-lab .lsc-warn,.lsc-lab .lsc-fail{color:var(--lsc-red);}",
      ".lsc-lab .lsc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin:14px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.lsc-lab .lsc-control{display:grid;gap:5px;min-width:0;}.lsc-lab .lsc-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}.lsc-lab .lsc-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".lsc-lab .lsc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0;}.lsc-lab .lsc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.lsc-lab .lsc-metric.lsc-blue{border-top-color:var(--lsc-blue);}.lsc-lab .lsc-metric.lsc-gold{border-top-color:var(--lsc-gold);}.lsc-lab .lsc-metric.lsc-green{border-top-color:var(--lsc-green);}.lsc-lab .lsc-metric.lsc-red{border-top-color:var(--lsc-red);}.lsc-lab .lsc-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.lsc-lab .lsc-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".lsc-lab .lsc-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.lsc-lab .lsc-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,1.15fr);gap:14px;margin-top:12px;}.lsc-lab .lsc-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.lsc-lab svg{display:block;width:100%;height:auto;color:var(--fg);}.lsc-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.lsc-lab .lsc-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.lsc-lab table{width:100%;min-width:600px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.lsc-lab th,.lsc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.lsc-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.lsc-lab .lsc-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--lsc-green);background:var(--bg);font-size:13px;line-height:1.7;}",
      "@media(max-width:760px){.lsc-lab .lsc-controls,.lsc-lab .lsc-grid{grid-template-columns:minmax(0,1fr);}.lsc-lab .lsc-choice-row{grid-template-columns:minmax(0,1fr);}}",
      "@media(max-width:420px){.lsc-lab .lsc-predict{padding-left:11px;padding-right:11px;}.lsc-lab th,.lsc-lab td{padding-left:5px;padding-right:5px;}}",
      "@media(prefers-reduced-motion:reduce){.lsc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function formatNumber(value, digits) {
      if (!finite(value)) return "—";
      if (Math.abs(value) < 5e-12) return "0";
      var text = Number(value).toFixed(digits === undefined ? 3 : digits);
      return text.replace(/0+$/, "").replace(/\.$/, "");
    }

    function presetById(id) {
      for (var i = 0; i < PRESETS.length; i += 1) {
        if (PRESETS[i].id === id) return PRESETS[i];
      }
      throw new Error("Unknown vector preset: " + id);
    }

    function matrixFromColumns(vectors) {
      var rows = [];
      var dimension = vectors[0] ? vectors[0].length : 0;
      for (var r = 0; r < dimension; r += 1) {
        rows[r] = [];
        for (var c = 0; c < vectors.length; c += 1) rows[r][c] = Number(vectors[c][r]);
      }
      return rows;
    }

    function matrixRank(input) {
      var matrix = input.map(function (row) { return row.slice(); });
      var rows = matrix.length;
      var cols = rows ? matrix[0].length : 0;
      var pivotRow = 0;
      for (var col = 0; col < cols && pivotRow < rows; col += 1) {
        var pivot = pivotRow;
        for (var r = pivotRow + 1; r < rows; r += 1) {
          if (Math.abs(matrix[r][col]) > Math.abs(matrix[pivot][col])) pivot = r;
        }
        if (Math.abs(matrix[pivot][col]) <= EPS) continue;
        var temp = matrix[pivotRow];
        matrix[pivotRow] = matrix[pivot];
        matrix[pivot] = temp;
        var scale = matrix[pivotRow][col];
        for (var c = col; c < cols; c += 1) matrix[pivotRow][c] /= scale;
        for (var rr = 0; rr < rows; rr += 1) {
          if (rr === pivotRow) continue;
          var factor = matrix[rr][col];
          if (Math.abs(factor) <= EPS) continue;
          for (var cc = col; cc < cols; cc += 1) matrix[rr][cc] -= factor * matrix[pivotRow][cc];
        }
        pivotRow += 1;
      }
      return pivotRow;
    }

    function determinant2(a, b) {
      return a[0] * b[1] - a[1] * b[0];
    }

    function solve2(a, b, target) {
      var det = determinant2(a, b);
      if (Math.abs(det) <= EPS) return null;
      return [
        (target[0] * b[1] - b[0] * target[1]) / det,
        (a[0] * target[1] - target[0] * a[1]) / det
      ];
    }

    function analyze(options) {
      var settings = options || {};
      var preset = presetById(settings.presetId || DEFAULTS.presetId);
      var t = Number(settings.t === undefined ? DEFAULTS.t : settings.t);
      var px = Number(settings.px === undefined ? DEFAULTS.px : settings.px);
      var py = Number(settings.py === undefined ? DEFAULTS.py : settings.py);
      if (![t, px, py].every(finite)) throw new RangeError("coordinate parameters must be finite");
      var vectors = preset.vectors(t);
      var matrix = matrixFromColumns(vectors);
      var rank = matrixRank(matrix);
      var dimension = preset.dimension;
      var independent = rank === vectors.length;
      var spans = rank === dimension;
      var basis = independent && spans;
      var target = [px, py];
      var coordinates = vectors.length >= 2 ? solve2(vectors[0], vectors[1], target) : null;
      return {
        preset: preset,
        t: t,
        vectors: vectors,
        labels: preset.labels,
        matrix: matrix,
        rank: rank,
        dimension: dimension,
        nullity: vectors.length - rank,
        independent: independent,
        spans: spans,
        basis: basis,
        target: target,
        coordinates: coordinates
      };
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", value);
        else if (key === "text") node.textContent = value;
        else if (key.slice(0, 2) === "on" && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === null || child === undefined) return;
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function replaceChildren(node, children) {
      while (node.firstChild) node.removeChild(node.firstChild);
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
      });
    }

    function svgNode(doc, tag, attrs, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function installStyle(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function metric(doc, label, value, color) {
      return element(doc, "div", { className: "lsc-metric " + (color || "") }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function choiceQuestion(doc, refs, key, legendText, choices) {
      var fieldset = element(doc, "fieldset", { className: "lsc-question" });
      fieldset.appendChild(element(doc, "legend", { text: legendText }));
      var row = element(doc, "div", { className: "lsc-choice-row" });
      refs[key] = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": "false",
          text: choice.label
        });
        button.addEventListener("click", function () {
          refs.state.predictions[key] = choice.value;
          renderPrediction(refs);
        });
        refs[key].push({ value: choice.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    function renderPrediction(refs) {
      ["span", "redundancy", "coordinates"].forEach(function (key) {
        (refs[key] || []).forEach(function (item) {
          item.node.setAttribute(
            "aria-pressed",
            refs.state.predictions[key] === item.value ? "true" : "false"
          );
        });
      });
      var answered = ["span", "redundancy", "coordinates"].every(function (key) {
        return refs.state.predictions[key] !== null;
      });
      refs.feedback.textContent = answered ? "三个预测已记录，可以揭示结果。" : "请先完成三个预测。";
      refs.feedback.className = "lsc-feedback";
    }

    function arrowSvg(doc, data, uid) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 500 320",
        role: "img",
        "aria-labelledby": uid + "-svg-title " + uid + "-svg-desc"
      });
      svg.appendChild(svgNode(doc, "title", { id: uid + "-svg-title" }, "向量坐标与生成空间"));
      svg.appendChild(svgNode(doc, "desc", { id: uid + "-svg-desc" }, "箭头从原点出发，显示当前向量列与目标向量。"));
      var maxAbs = 2.5;
      data.vectors.forEach(function (vector) {
        maxAbs = Math.max(maxAbs, Math.abs(vector[0]) + 0.6, Math.abs(vector[1]) + 0.6);
      });
      maxAbs = Math.max(maxAbs, Math.abs(data.target[0]) + 0.6, Math.abs(data.target[1]) + 0.6);
      maxAbs = Math.min(7, maxAbs);
      var left = 42, top = 18, width = 420, height = 260;
      var mapX = function (value) { return left + (value + maxAbs) / (2 * maxAbs) * width; };
      var mapY = function (value) { return top + (maxAbs - value) / (2 * maxAbs) * height; };
      var ox = mapX(0), oy = mapY(0);
      for (var tick = -Math.floor(maxAbs); tick <= Math.floor(maxAbs); tick += 1) {
        if (tick === 0) continue;
        svg.appendChild(svgNode(doc, "line", { x1: mapX(tick), y1: top, x2: mapX(tick), y2: top + height, stroke: "currentColor", "stroke-opacity": "0.12" }));
        svg.appendChild(svgNode(doc, "line", { x1: left, y1: mapY(tick), x2: left + width, y2: mapY(tick), stroke: "currentColor", "stroke-opacity": "0.12" }));
      }
      svg.appendChild(svgNode(doc, "line", { x1: left, y1: oy, x2: left + width, y2: oy, stroke: "currentColor", "stroke-opacity": "0.55" }));
      svg.appendChild(svgNode(doc, "line", { x1: ox, y1: top, x2: ox, y2: top + height, stroke: "currentColor", "stroke-opacity": "0.55" }));
      var colors = ["var(--lsc-blue)", "var(--lsc-gold)", "var(--lsc-green)"];
      data.vectors.forEach(function (vector, index) {
        var color = colors[index % colors.length];
        var ex = mapX(vector[0]), ey = mapY(vector[1]);
        svg.appendChild(svgNode(doc, "line", { x1: ox, y1: oy, x2: ex, y2: ey, stroke: color, "stroke-width": "3", "stroke-linecap": "round" }));
        svg.appendChild(svgNode(doc, "circle", { cx: ex, cy: ey, r: "4.5", fill: color, stroke: "var(--bg)", "stroke-width": "1.5" }));
        svg.appendChild(svgNode(doc, "text", { x: ex + 7, y: ey - 7, "font-size": "12", "font-weight": "700" }, data.labels[index]));
      });
      var tx = mapX(data.target[0]), ty = mapY(data.target[1]);
      svg.appendChild(svgNode(doc, "circle", { cx: tx, cy: ty, r: "5", fill: "var(--lsc-red)", stroke: "var(--bg)", "stroke-width": "2" }));
      svg.appendChild(svgNode(doc, "text", { x: tx + 8, y: ty + 16, "font-size": "12", "font-weight": "700" }, "p"));
      svg.appendChild(svgNode(doc, "text", { x: left + width - 5, y: oy - 8, "font-size": "11", "text-anchor": "end" }, "x"));
      svg.appendChild(svgNode(doc, "text", { x: ox + 7, y: top + 12, "font-size": "11" }, "y"));
      svg.appendChild(svgNode(doc, "text", { x: left, y: 14, "font-size": "13", "font-weight": "700" }, "坐标图：列向量、目标 p 与生成方向"));
      return svg;
    }

    function renderResults(refs) {
      var state = refs.state;
      var data = analyze({
        presetId: state.presetId,
        t: state.t,
        px: state.px,
        py: state.py
      });
      refs.presetSelect.value = state.presetId;
      refs.tInput.value = String(state.t);
      refs.tOutput.textContent = formatNumber(state.t, 2);
      refs.pxInput.value = String(state.px);
      refs.pyInput.value = String(state.py);
      refs.summary.textContent =
        (data.basis ? "基" : data.spans ? "生成但不构成基" : "只生成真子空间") +
        "：列秩为 " + data.rank + "，当前列数为 " + data.vectors.length + "。";
      refs.summary.className = "lsc-interpretation " + (data.basis ? "lsc-ok" : "lsc-warn");
      replaceChildren(refs.metrics, [
        metric(refs.doc, "当前向量列", data.vectors.length + " 个", "lsc-blue"),
        metric(refs.doc, "列秩", String(data.rank), data.rank === data.dimension ? "lsc-green" : "lsc-red"),
        metric(refs.doc, "生成空间维数", String(data.rank), "lsc-gold"),
        metric(refs.doc, "线性无关", data.independent ? "是" : "否", data.independent ? "lsc-green" : "lsc-red"),
        metric(refs.doc, "基", data.basis ? "是" : "否", data.basis ? "lsc-green" : "lsc-red")
      ]);
      replaceChildren(refs.chart, [
        element(refs.doc, "h4", { text: "向量箭头与坐标对象" }),
        element(refs.doc, "div", { className: "lsc-chart-frame" }, arrowSvg(refs.doc, data, refs.uid))
      ]);
      var rows = data.vectors.map(function (vector, index) {
        return element(refs.doc, "tr", {}, [
          element(refs.doc, "th", { scope: "row", text: data.labels[index] }),
          element(refs.doc, "td", { text: "(" + vector.map(function (value) { return formatNumber(value, 2); }).join(", ") + ")" }),
          element(refs.doc, "td", { text: "列 " + (index + 1) }),
          element(refs.doc, "td", { text: data.independent ? "当前列组无冗余" : "存在列关系的可能" })
        ]);
      });
      rows.push(element(refs.doc, "tr", {}, [
        element(refs.doc, "th", { scope: "row", text: "p" }),
        element(refs.doc, "td", { text: "(" + formatNumber(data.target[0], 2) + ", " + formatNumber(data.target[1], 2) + ")" }),
        element(refs.doc, "td", { text: "标准坐标" }),
        element(refs.doc, "td", { text: data.coordinates ? "前两列坐标 = (" + formatNumber(data.coordinates[0], 3) + ", " + formatNumber(data.coordinates[1], 3) + ")" : "前两列不能唯一坐标化" })
      ]));
      replaceChildren(refs.ledgerBody, rows);
      refs.boundary.textContent =
        "证书与证据分开读：当前 SVG 和表格只检查了 " + data.vectors.length +
        " 个列向量；秩 " + data.rank + " 证明的是它们生成的子空间维数。" +
        (data.coordinates
          ? " 目标 p 的坐标换算依赖前两列可逆。"
          : " 当前前两列退化，不能给目标 p 唯一坐标。");
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      installStyle(doc);
      var uid = "lsc-" + (INSTANCE += 1);
      var state = {
        presetId: DEFAULTS.presetId,
        t: DEFAULTS.t,
        px: DEFAULTS.px,
        py: DEFAULTS.py,
        revealed: false,
        predictions: { span: null, redundancy: null, coordinates: null }
      };
      var refs = { doc: doc, uid: uid, state: state };
      var shell = element(doc, "div", { className: "lsc-shell" });
      shell.appendChild(element(doc, "h3", { text: "生成、独立与坐标实验" }));
      shell.appendChild(element(doc, "p", { className: "lsc-note", text: "先预测，再揭示列秩、生成空间和坐标换算。有限列的计算不代替全空间证明。" }));

      var prediction = element(doc, "section", {
        className: "lsc-predict",
        "aria-labelledby": uid + "-predict-title"
      });
      prediction.appendChild(element(doc, "strong", { className: "lsc-predict-title", id: uid + "-predict-title", text: "先预测，再揭示" }));
      var questionList = element(doc, "div", { className: "lsc-question-list" });
      questionList.appendChild(choiceQuestion(doc, refs, "span", "1. u=(1,1), v=(2,2) 能生成 R² 吗？", [
        { value: "no-span", label: "不能，秩为 1" },
        { value: "span", label: "能，两个非零向量即可" },
        { value: "unknown", label: "只能看长度" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "redundancy", "2. 三列向量生成 R²，是否必然线性无关？", [
        { value: "span-dependent", label: "不必然，可能冗余" },
        { value: "always-independent", label: "是，生成就独立" },
        { value: "same-count", label: "只要长度相同" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "coordinates", "3. 换基后改变的是？", [
        { value: "coordinates-change", label: "坐标变，向量不变" },
        { value: "vector-change", label: "向量变，坐标不变" },
        { value: "both-fixed", label: "两者都不变" }
      ]));
      prediction.appendChild(questionList);
      var actions = element(doc, "div", { className: "lsc-actions" });
      var reveal = element(doc, "button", { type: "button", className: "lsc-primary", text: "揭示并核对" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      refs.feedback = element(doc, "p", { className: "lsc-feedback", "aria-live": "polite", text: "请先完成三个预测。" });
      prediction.appendChild(refs.feedback);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "lsc-controls", hidden: true, "aria-label": "实验参数" });
      refs.presetSelect = element(doc, "select", { "aria-label": "选择向量族" });
      PRESETS.forEach(function (preset) {
        refs.presetSelect.appendChild(element(doc, "option", { value: preset.id, text: preset.label }));
      });
      refs.tInput = element(doc, "input", { type: "range", min: "-2", max: "4", step: "0.25", value: String(DEFAULTS.t), "aria-label": "参数 t" });
      refs.tOutput = element(doc, "output", { text: formatNumber(DEFAULTS.t, 2) });
      refs.pxInput = element(doc, "input", { type: "number", step: "0.5", value: String(DEFAULTS.px), "aria-label": "目标向量 p 的 x 坐标" });
      refs.pyInput = element(doc, "input", { type: "number", step: "0.5", value: String(DEFAULTS.py), "aria-label": "目标向量 p 的 y 坐标" });
      controls.appendChild(element(doc, "div", { className: "lsc-control" }, [
        element(doc, "label", { text: "向量族" }), refs.presetSelect
      ]));
      controls.appendChild(element(doc, "div", { className: "lsc-control" }, [
        element(doc, "label", {}, ["参数 t = ", refs.tOutput]), refs.tInput
      ]));
      controls.appendChild(element(doc, "div", { className: "lsc-control" }, [
        element(doc, "label", { text: "目标 p 的 x 坐标" }), refs.pxInput
      ]));
      controls.appendChild(element(doc, "div", { className: "lsc-control" }, [
        element(doc, "label", { text: "目标 p 的 y 坐标" }), refs.pyInput
      ]));
      shell.appendChild(controls);

      var results = element(doc, "section", { className: "lsc-results", hidden: true, "aria-labelledby": uid + "-results-title" });
      refs.results = results;
      results.appendChild(element(doc, "h4", { id: uid + "-results-title", text: "揭示后的证据账本" }));
      refs.summary = element(doc, "p", { className: "lsc-interpretation", "aria-live": "polite" });
      results.appendChild(refs.summary);
      refs.metrics = element(doc, "div", { className: "lsc-metrics" });
      results.appendChild(refs.metrics);
      var grid = element(doc, "div", { className: "lsc-grid" });
      refs.chart = element(doc, "div");
      grid.appendChild(refs.chart);
      var ledger = element(doc, "div", { className: "lsc-ledger" });
      var table = element(doc, "table", { "aria-label": "向量列与坐标账本" });
      table.appendChild(element(doc, "caption", { text: "当前列向量、对象身份与目标坐标" }));
      table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
        element(doc, "th", { scope: "col", text: "对象" }),
        element(doc, "th", { scope: "col", text: "坐标记录" }),
        element(doc, "th", { scope: "col", text: "矩阵角色" }),
        element(doc, "th", { scope: "col", text: "读法" })
      ])));
      refs.ledgerBody = element(doc, "tbody");
      table.appendChild(refs.ledgerBody);
      ledger.appendChild(table);
      grid.appendChild(ledger);
      results.appendChild(grid);
      refs.boundary = element(doc, "p", { className: "lsc-boundary" });
      results.appendChild(refs.boundary);
      shell.appendChild(results);
      root.classList.add("lsc-lab");
      root.replaceChildren(shell);

      function render() {
        controls.hidden = !state.revealed;
        results.hidden = !state.revealed;
        renderPrediction(refs);
        if (state.revealed) renderResults(refs);
      }

      reveal.addEventListener("click", function () {
        var answers = { span: "no-span", redundancy: "span-dependent", coordinates: "coordinates-change" };
        var keys = ["span", "redundancy", "coordinates"];
        var missing = keys.filter(function (key) { return state.predictions[key] === null; });
        if (missing.length) {
          refs.feedback.textContent = "还缺少 " + missing.length + " 个预测。";
          refs.feedback.className = "lsc-feedback lsc-warn";
          return;
        }
        state.revealed = true;
        render();
        var hits = keys.filter(function (key) { return state.predictions[key] === answers[key]; }).length;
        refs.feedback.textContent = "已揭示：" + hits + "/3 个预测命中；列秩只证明当前列组的结论。";
        refs.feedback.className = "lsc-feedback " + (hits === 3 ? "lsc-pass" : "lsc-warn");
        if (api && typeof api.announce === "function") api.announce(root, refs.feedback.textContent);
      });
      reset.addEventListener("click", function () {
        state = {
          presetId: DEFAULTS.presetId,
          t: DEFAULTS.t,
          px: DEFAULTS.px,
          py: DEFAULTS.py,
          revealed: false,
          predictions: { span: null, redundancy: null, coordinates: null }
        };
        refs.state = state;
        render();
      });
      refs.presetSelect.addEventListener("change", function () {
        state.presetId = refs.presetSelect.value;
        if (state.revealed) renderResults(refs);
      });
      refs.tInput.addEventListener("input", function () {
        state.t = Number(refs.tInput.value);
        if (state.revealed) renderResults(refs);
      });
      refs.pxInput.addEventListener("change", function () {
        state.px = finite(Number(refs.pxInput.value)) ? Number(refs.pxInput.value) : DEFAULTS.px;
        if (state.revealed) renderResults(refs);
      });
      refs.pyInput.addEventListener("change", function () {
        state.py = finite(Number(refs.pyInput.value)) ? Number(refs.pyInput.value) : DEFAULTS.py;
        if (state.revealed) renderResults(refs);
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function assert(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }
      function close(actual, expected, tolerance, message) {
        checks += 1;
        if (!finite(actual) || Math.abs(actual - expected) > tolerance) {
          throw new Error(message + ": " + actual + " vs " + expected);
        }
      }

      assert(PRESETS.length === 3, "preset count");
      var regular = analyze({ presetId: "parameter", t: 0, px: 3, py: 2 });
      assert(regular.rank === 2, "parameter rank at t=0");
      assert(regular.independent && regular.spans && regular.basis, "parameter basis at t=0");
      close(determinant2(regular.vectors[0], regular.vectors[1]), -2, 1e-12, "parameter determinant");
      close(regular.coordinates[0], 2, 1e-12, "target first coordinate");
      close(regular.coordinates[1], 0.5, 1e-12, "target second coordinate");

      var singular = analyze({ presetId: "parameter", t: 2 });
      assert(singular.rank === 1, "parameter rank at singular t");
      assert(!singular.independent && !singular.spans && !singular.basis, "singular status");
      assert(singular.coordinates === null, "singular coordinates rejected");

      var redundant = analyze({ presetId: "redundant", t: 2 });
      assert(redundant.rank === 2 && redundant.spans, "redundant set spans");
      assert(!redundant.independent && !redundant.basis, "redundant set is not a basis");
      assert(redundant.nullity === 1, "redundant nullity");

      var collinear = analyze({ presetId: "collinear", t: -3 });
      assert(collinear.rank === 1 && !collinear.spans, "collinear span");
      var rejected = false;
      try { analyze({ presetId: "missing" }); } catch (error) { rejected = true; }
      assert(rejected, "unknown preset rejected");
      rejected = false;
      try { analyze({ presetId: "parameter", t: NaN, px: 1, py: 1 }); } catch (error) { rejected = error instanceof RangeError; }
      assert(rejected, "nonfinite coordinate parameter rejected");
      return { checks: checks, presets: PRESETS.length };
    }

    return {
      DEFAULTS: DEFAULTS,
      PRESETS: PRESETS,
      matrixRank: matrixRank,
      determinant2: determinant2,
      solve2: solve2,
      analyze: analyze,
      mount: mount,
      selfTest: selfTest
    };
  }
);
