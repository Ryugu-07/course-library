(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("determinant-volume", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("determinant-volume self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("determinant-volume self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var STYLE_ID = "cl-determinant-volume-styles";
    var EPS = 1e-10;
    var DEFAULTS = { scale: 0.5, anisotropy: 0, shear: 0, basisScale: 1, swapped: false };
    var PRESETS = [
      { id: "uniform", label: "均匀缩小", scale: 0.5, anisotropy: 0, shear: 0, basisScale: 1, swapped: false },
      { id: "thin", label: "同体积但拉扁", scale: 0.464, anisotropy: 0.8, shear: 0, basisScale: 1, swapped: false },
      { id: "shear", label: "剪切与换基", scale: 0.8, anisotropy: 0, shear: 0.65, basisScale: 1.1, swapped: false },
      { id: "reverse", label: "交换两列", scale: 0.8, anisotropy: 0, shear: 0.3, basisScale: 1, swapped: true }
    ];
    var QUESTIONS = [
      {
        id: "columnAdd",
        prompt: "把一列加上另一列的倍数，det 会怎样？",
        options: [
          { id: "same", label: "不变" },
          { id: "double", label: "一定加倍" },
          { id: "zero", label: "一定变成 0" }
        ],
        answer: "same"
      },
      {
        id: "swap",
        prompt: "交换两列后，有向体积的变化是什么？",
        options: [
          { id: "sign", label: "只变号" },
          { id: "absolute", label: "绝对值也翻倍" },
          { id: "none", label: "完全不变" }
        ],
        answer: "sign"
      },
      {
        id: "basis",
        prompt: "把 B 看成换基矩阵时，det(AB) 应怎样读？",
        options: [
          { id: "product", label: "det(A)det(B)" },
          { id: "sum", label: "det(A)+det(B)" },
          { id: "first", label: "只看 det(A)" }
        ],
        answer: "product"
      },
      {
        id: "zero",
        prompt: "方阵 det=0 提供了什么证书？",
        options: [
          { id: "singular", label: "不可逆，体积塌缩" },
          { id: "small", label: "只是数值有点小" },
          { id: "orientation", label: "只说明换了方向" }
        ],
        answer: "singular"
      },
      {
        id: "condition",
        prompt: "det 的绝对值很小，是否单独等价于坏条件数？",
        options: [
          { id: "no", label: "不等价，还要看尺度和奇异值" },
          { id: "yes", label: "总是等价" },
          { id: "zero", label: "只有 det=0 才能讨论" }
        ],
        answer: "no"
      }
    ];

    var STYLE_TEXT = [
      '[data-learning-lab="determinant-volume"]{--dv-accent:#0f766e;--dv-good:#15803d;--dv-warn:#b45309;display:block;max-width:100%;min-width:0;color:var(--fg,inherit);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="determinant-volume"] [hidden]{display:none!important}',
      '[data-learning-lab="determinant-volume"] .dv-note,[data-learning-lab="determinant-volume"] .dv-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="determinant-volume"] .dv-presets,[data-learning-lab="determinant-volume"] .dv-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}',
      '[data-learning-lab="determinant-volume"] button,[data-learning-lab="determinant-volume"] input,[data-learning-lab="determinant-volume"] select{min-height:44px;font:inherit}',
      '[data-learning-lab="determinant-volume"] button{min-width:0;padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit;cursor:pointer;overflow-wrap:anywhere}',
      '[data-learning-lab="determinant-volume"] button:hover,[data-learning-lab="determinant-volume"] button[aria-pressed="true"]{border-color:var(--dv-accent);background:var(--dv-accent);color:#fff}',
      '[data-learning-lab="determinant-volume"] button:focus-visible{outline:3px solid #5eead4;outline-offset:2px}',
      '[data-learning-lab="determinant-volume"] .dv-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0}',
      '[data-learning-lab="determinant-volume"] .dv-control{display:grid;gap:5px;min-width:0}',
      '[data-learning-lab="determinant-volume"] .dv-control label{font-weight:700}',
      '[data-learning-lab="determinant-volume"] input[type="range"]{width:100%;accent-color:var(--dv-accent)}',
      '[data-learning-lab="determinant-volume"] .dv-check{display:flex;align-items:center;gap:8px;min-height:44px;padding-top:20px}',
      '[data-learning-lab="determinant-volume"] .dv-check input{width:20px;height:20px;accent-color:var(--dv-accent)}',
      '[data-learning-lab="determinant-volume"] .dv-question{margin:12px 0;padding:10px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}',
      '[data-learning-lab="determinant-volume"] .dv-question legend{padding:0 4px;font-size:13px;color:var(--fg-soft,currentColor);line-height:1.5}',
      '[data-learning-lab="determinant-volume"] .dv-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
      '[data-learning-lab="determinant-volume"] .dv-primary{background:var(--dv-accent);border-color:var(--dv-accent);color:#fff;font-weight:750}',
      '[data-learning-lab="determinant-volume"] .dv-feedback{min-height:2em;margin:8px 0;font-weight:700}',
      '[data-learning-lab="determinant-volume"] .dv-good{color:var(--dv-good)}[data-learning-lab="determinant-volume"] .dv-warn{color:var(--dv-warn)}',
      '[data-learning-lab="determinant-volume"] .dv-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:16px;align-items:start;margin-top:16px}',
      '[data-learning-lab="determinant-volume"] .dv-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}',
      '[data-learning-lab="determinant-volume"] svg{display:block;width:100%;height:auto}',
      '[data-learning-lab="determinant-volume"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="determinant-volume"] .dv-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7}[data-learning-lab="determinant-volume"] .dv-edge{stroke:var(--dv-accent);stroke-width:2;stroke-opacity:.68;fill:none}[data-learning-lab="determinant-volume"] .dv-title{font-size:13px;font-weight:750}[data-learning-lab="determinant-volume"] .dv-label{font-size:11px}',
      '[data-learning-lab="determinant-volume"] .dv-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}',
      '[data-learning-lab="determinant-volume"] .dv-metric{min-width:0;padding:9px;border-top:3px solid var(--dv-accent);background:var(--bg,transparent)}',
      '[data-learning-lab="determinant-volume"] .dv-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="determinant-volume"] .dv-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere}',
      '[data-learning-lab="determinant-volume"] .dv-table-wrap{max-width:100%;overflow-x:auto}',
      '[data-learning-lab="determinant-volume"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px}',
      '[data-learning-lab="determinant-volume"] th,[data-learning-lab="determinant-volume"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}',
      '[data-learning-lab="determinant-volume"] th{color:var(--fg-soft,currentColor);font-size:11px}',
      '[data-learning-lab="determinant-volume"] .dv-boundary{margin:12px 0;padding:10px 12px;border-left:3px solid var(--dv-warn);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:820px){[data-learning-lab="determinant-volume"] .dv-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="determinant-volume"] .dv-grid{grid-template-columns:minmax(0,1fr)}}',
      '@media(max-width:620px){[data-learning-lab="determinant-volume"] .dv-options{grid-template-columns:minmax(0,1fr)}}',
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="determinant-volume"] *{scroll-behavior:auto!important;transition:none!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function near(left, right, tolerance) {
      return Math.abs(left - right) <= (tolerance || 1e-9);
    }

    function clamp(value, low, high) {
      return Math.max(low, Math.min(high, value));
    }

    function finiteParameter(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function normalize(input) {
      if (!input) throw new TypeError("determinant parameters are required");
      if (typeof input.swapped !== "boolean") throw new TypeError("swapped must be boolean");
      return {
        scale: clamp(finiteParameter(input.scale, "scale"), 0, 1.4),
        anisotropy: clamp(finiteParameter(input.anisotropy, "anisotropy"), -0.8, 0.8),
        shear: clamp(finiteParameter(input.shear, "shear"), -0.8, 0.8),
        basisScale: clamp(finiteParameter(input.basisScale, "basisScale"), 0.5, 1.5),
        swapped: input.swapped
      };
    }

    function matrixFrom(input) {
      var params = normalize(input);
      var spread = Math.exp(params.anisotropy);
      return [
        [params.scale * spread, params.shear, -0.5 * params.shear],
        [0, params.scale, 0.5 * params.shear],
        [0, 0, params.scale / spread]
      ];
    }

    function basisMatrix(basisScale) {
      var b = clamp(finiteParameter(basisScale, "basisScale"), 0.5, 1.5);
      return [[b, 0.3, 0], [0, b, 0.1], [0, 0, b]];
    }

    function determinant3(matrix) {
      return matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
        matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
        matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);
    }

    function multiply3(left, right) {
      var output = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (var i = 0; i < 3; i += 1) {
        for (var j = 0; j < 3; j += 1) {
          for (var k = 0; k < 3; k += 1) output[i][j] += left[i][k] * right[k][j];
        }
      }
      return output;
    }

    function transpose3(matrix) {
      return [
        [matrix[0][0], matrix[1][0], matrix[2][0]],
        [matrix[0][1], matrix[1][1], matrix[2][1]],
        [matrix[0][2], matrix[1][2], matrix[2][2]]
      ];
    }

    function swapColumns(matrix) {
      var output = matrix.map(function (row) { return row.slice(); });
      for (var i = 0; i < 3; i += 1) {
        var value = output[i][0];
        output[i][0] = output[i][1];
        output[i][1] = value;
      }
      return output;
    }

    function rank3(matrix) {
      var work = matrix.map(function (row) { return row.slice(); });
      var rank = 0;
      for (var column = 0; column < 3 && rank < 3; column += 1) {
        var pivot = rank;
        for (var row = rank + 1; row < 3; row += 1) {
          if (Math.abs(work[row][column]) > Math.abs(work[pivot][column])) pivot = row;
        }
        if (Math.abs(work[pivot][column]) <= 1e-9) continue;
        var swap = work[rank];
        work[rank] = work[pivot];
        work[pivot] = swap;
        for (var lower = rank + 1; lower < 3; lower += 1) {
          var factor = work[lower][column] / work[rank][column];
          for (var j = column; j < 3; j += 1) work[lower][j] -= factor * work[rank][j];
        }
        rank += 1;
      }
      return rank;
    }

    function symmetricEigenvalues3(matrix) {
      var work = matrix.map(function (row) { return row.slice(); });
      for (var iteration = 0; iteration < 60; iteration += 1) {
        var p = 0;
        var q = 1;
        var largest = Math.abs(work[0][1]);
        if (Math.abs(work[0][2]) > largest) { p = 0; q = 2; largest = Math.abs(work[0][2]); }
        if (Math.abs(work[1][2]) > largest) { p = 1; q = 2; largest = Math.abs(work[1][2]); }
        if (largest < 1e-12) break;
        var theta = 0.5 * Math.atan2(2 * work[p][q], work[q][q] - work[p][p]);
        var cosine = Math.cos(theta);
        var sine = Math.sin(theta);
        var app = work[p][p];
        var aqq = work[q][q];
        var apq = work[p][q];
        for (var k = 0; k < 3; k += 1) {
          if (k === p || k === q) continue;
          var akp = work[k][p];
          var akq = work[k][q];
          work[k][p] = cosine * akp - sine * akq;
          work[p][k] = work[k][p];
          work[k][q] = sine * akp + cosine * akq;
          work[q][k] = work[k][q];
        }
        work[p][p] = cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
        work[q][q] = sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
        work[p][q] = 0;
        work[q][p] = 0;
      }
      return [work[0][0], work[1][1], work[2][2]].sort(function (a, b) { return b - a; });
    }

    function singularValues3(matrix) {
      var gram = multiply3(transpose3(matrix), matrix);
      return symmetricEigenvalues3(gram).map(function (value) { return Math.sqrt(Math.max(0, value)); });
    }

    function condition2(matrix) {
      var values = singularValues3(matrix);
      return values[2] <= EPS ? Infinity : values[0] / values[2];
    }

    function diagonalUniform(scale) {
      return [[scale, 0, 0], [0, scale, 0], [0, 0, scale]];
    }

    function evaluate(input) {
      var params = normalize(input);
      var base = matrixFrom(params);
      var A = params.swapped ? swapColumns(base) : base;
      var B = basisMatrix(params.basisScale);
      var AB = multiply3(A, B);
      var detA = determinant3(A);
      var detB = determinant3(B);
      var detAB = determinant3(AB);
      var uniformScale = Math.pow(Math.abs(detA), 1 / 3);
      var uniform = diagonalUniform(uniformScale);
      return {
        params: params,
        A: A,
        B: B,
        AB: AB,
        detA: detA,
        detB: detB,
        detAB: detAB,
        rankA: rank3(A),
        conditionA: condition2(A),
        uniformCondition: condition2(uniform),
        singularValues: singularValues3(A),
        volumeLabel: detA > EPS ? "保持方向" : detA < -EPS ? "反转方向" : "体积塌缩"
      };
    }

    function format(value, digits) {
      if (!isFinite(value)) return "无穷大";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) < Math.pow(10, -places) / 2) value = 0;
      var text = Number(value).toFixed(places);
      return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
    }

    function matrixText(matrix) {
      return "[" + matrix.map(function (row) { return "[" + row.map(function (value) { return format(value, 2); }).join(", ") + "]"; }).join(", ") + "]";
    }

    function installStyles(doc) {
      if (!doc || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      doc.head.appendChild(style);
    }

    function applyMatrix(matrix, point) {
      return {
        x: matrix[0][0] * point.x + matrix[0][1] * point.y + matrix[0][2] * point.z,
        y: matrix[1][0] * point.x + matrix[1][1] * point.y + matrix[1][2] * point.z,
        z: matrix[2][0] * point.x + matrix[2][1] * point.y + matrix[2][2] * point.z
      };
    }

    function svgFor(data) {
      var vertices = [];
      for (var mask = 0; mask < 8; mask += 1) {
        vertices.push(applyMatrix(data.A, { x: mask & 1 ? 1 : 0, y: mask & 2 ? 1 : 0, z: mask & 4 ? 1 : 0 }));
      }
      function project(point) { return { x: point.x - 0.65 * point.y, y: -point.z - 0.35 * point.y - 0.2 * point.x }; }
      var projected = vertices.map(project);
      var minX = 0;
      var maxX = 0;
      var minY = 0;
      var maxY = 0;
      projected.forEach(function (point) { minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x); minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y); });
      var spanX = Math.max(1, maxX - minX);
      var spanY = Math.max(1, maxY - minY);
      function map(point) { return { x: 52 + 516 * (point.x - minX) / spanX, y: 258 - 210 * (point.y - minY) / spanY }; }
      var edges = [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
      var edgeHtml = edges.map(function (edge) {
        var first = map(projected[edge[0]]);
        var second = map(projected[edge[1]]);
        return '<line x1="' + format(first.x, 2) + '" y1="' + format(first.y, 2) + '" x2="' + format(second.x, 2) + '" y2="' + format(second.y, 2) + '" class="dv-edge"/>';
      }).join("");
      var origin = map({ x: 0, y: 0 });
      var basisColors = ["#2563eb", "#d97706", "#15803d"];
      var basisLines = [[1,0,0],[0,1,0],[0,0,1]].map(function (unit, index) {
        var end = map(project(applyMatrix(data.A, { x: unit[0], y: unit[1], z: unit[2] })));
        return '<line x1="' + format(origin.x, 2) + '" y1="' + format(origin.y, 2) + '" x2="' + format(end.x, 2) + '" y2="' + format(end.y, 2) + '" stroke="' + basisColors[index] + '" stroke-width="3" marker-end="url(#dv-arrow-' + index + ')"/>';
      }).join("");
      var markers = basisColors.map(function (color, index) { return '<marker id="dv-arrow-' + index + '" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="' + color + '"/></marker>'; }).join("");
      return '<svg viewBox="0 0 620 320" role="img" aria-label="三维单位立方体经矩阵变换后的平行六面体投影"><defs>' + markers + '</defs>' +
        '<line x1="46" y1="274" x2="574" y2="274" class="dv-axis"/><line x1="52" y1="36" x2="52" y2="280" class="dv-axis"/>' + edgeHtml + basisLines +
        '<circle cx="' + format(origin.x, 2) + '" cy="' + format(origin.y, 2) + '" r="4" fill="currentColor"/><text x="52" y="24" class="dv-title">单位立方体的有向体积图</text>' +
        '<text x="430" y="302" class="dv-label">蓝 e1，金 e2，绿 e3</text></svg>';
    }

    function resultHtml(data, predictionCorrect) {
      var answerText = predictionCorrect ? "预测命中：现在把体积、方向和条件数分开读。" : "预测已核对：注意 det=0 与小 det 的不同逻辑。";
      var comparison = data.conditionA === Infinity ? "无穷大" : format(data.conditionA, 3);
      return '<div class="dv-grid"><div class="dv-chart">' + svgFor(data) + '</div><div>' +
        '<div class="dv-metrics"><div class="dv-metric"><span>det(A)</span><strong>' + format(data.detA, 5) + '</strong></div>' +
        '<div class="dv-metric"><span>det(B)</span><strong>' + format(data.detB, 5) + '</strong></div>' +
        '<div class="dv-metric"><span>det(AB)</span><strong>' + format(data.detAB, 5) + '</strong></div>' +
        '<div class="dv-metric"><span>方向状态</span><strong>' + data.volumeLabel + '</strong></div>' +
        '<div class="dv-metric"><span>rank(A)</span><strong>' + data.rankA + "/3" + '</strong></div>' +
        '<div class="dv-metric"><span>当前 κ₂</span><strong>' + comparison + '</strong></div></div>' +
        '<div class="dv-table-wrap"><table><caption>乘法与条件数账本</caption><thead><tr><th>对象</th><th>读数</th><th>含义</th></tr></thead><tbody>' +
        '<tr><td>A</td><td>' + matrixText(data.A) + '</td><td>实际列向量</td></tr>' +
        '<tr><td>B</td><td>' + matrixText(data.B) + '</td><td>换基列向量</td></tr>' +
        '<tr><td>AB</td><td>' + format(data.detAB, 5) + '</td><td>det(A)det(B)</td></tr>' +
        '<tr><td>同体积均匀缩放基准</td><td>κ₂=' + format(data.uniformCondition, 3) + '</td><td>相同有向体积绝对值，不同各向异性</td></tr>' +
        '</tbody></table></div>' +
        '<p class="dv-boundary">' + answerText + ' 这里的 κ₂ 使用奇异值比；det 只给出奇异值乘积，不能单独决定最大与最小奇异值的比例。</p>' +
        '</div></div>';
    }

    function mount(rootElement, api) {
      if (!rootElement || !rootElement.ownerDocument) return;
      var doc = rootElement.ownerDocument;
      installStyles(doc);
      var state = {
        scale: DEFAULTS.scale,
        anisotropy: DEFAULTS.anisotropy,
        shear: DEFAULTS.shear,
        basisScale: DEFAULTS.basisScale,
        swapped: DEFAULTS.swapped,
        revealed: false
      };
      var predictions = {};
      rootElement.innerHTML =
        '<div class="dv-lab">' +
        '<p class="dv-note">先预测列运算、换基和条件数的关系。揭示后可继续调节缩放、各向异性、剪切与列顺序。</p>' +
        '<div class="dv-presets" data-role="presets"></div>' +
        '<div class="dv-controls">' +
        '<div class="dv-control"><label for="dv-scale">整体尺度 s = <output data-role="scale-output">0.5</output></label><input id="dv-scale" data-role="scale" type="range" min="0" max="1.4" step="0.05" value="0.5" aria-label="整体尺度 s"></div>' +
        '<div class="dv-control"><label for="dv-anisotropy">各向异性 k = <output data-role="anisotropy-output">0</output></label><input id="dv-anisotropy" data-role="anisotropy" type="range" min="-0.8" max="0.8" step="0.05" value="0" aria-label="各向异性 k"></div>' +
        '<div class="dv-control"><label for="dv-shear">剪切 h = <output data-role="shear-output">0</output></label><input id="dv-shear" data-role="shear" type="range" min="-0.8" max="0.8" step="0.05" value="0" aria-label="剪切 h"></div>' +
        '<div class="dv-control"><label for="dv-basis">换基尺度 b = <output data-role="basisScale-output">1</output></label><input id="dv-basis" data-role="basisScale" type="range" min="0.5" max="1.5" step="0.05" value="1" aria-label="换基尺度 b"></div>' +
        '</div><label class="dv-check"><input data-role="swapped" type="checkbox">交换前两列，观察方向</label>' +
        '<div class="dv-questions" data-role="questions"></div>' +
        '<div class="dv-actions"><button type="button" class="dv-primary" data-role="reveal">核对预测并揭示</button><button type="button" data-role="reset">重置</button></div>' +
        '<p class="dv-feedback" data-role="feedback" aria-live="polite">五题都选完后，结果才会出现。</p>' +
        '<div class="dv-result" data-role="result" hidden aria-live="polite"></div>' +
        '</div>';

      var refs = {
        scale: rootElement.querySelector('[data-role="scale"]'),
        anisotropy: rootElement.querySelector('[data-role="anisotropy"]'),
        shear: rootElement.querySelector('[data-role="shear"]'),
        basisScale: rootElement.querySelector('[data-role="basisScale"]'),
        swapped: rootElement.querySelector('[data-role="swapped"]'),
        result: rootElement.querySelector('[data-role="result"]'),
        feedback: rootElement.querySelector('[data-role="feedback"]')
      };
      var choices = {};
      var questionHost = rootElement.querySelector('[data-role="questions"]');
      QUESTIONS.forEach(function (question) {
        var fieldset = doc.createElement("fieldset");
        fieldset.className = "dv-question";
        fieldset.innerHTML = '<legend>' + question.prompt + '</legend><div class="dv-options"></div>';
        var optionHost = fieldset.querySelector(".dv-options");
        choices[question.id] = [];
        question.options.forEach(function (option) {
          var button = doc.createElement("button");
          button.type = "button";
          button.textContent = option.label;
          button.setAttribute("aria-pressed", "false");
          button.addEventListener("click", function () {
            predictions[question.id] = option.id;
            renderPrediction();
            refs.feedback.textContent = "预测已记录；结果仍隐藏。";
            refs.feedback.className = "dv-feedback";
          });
          choices[question.id].push({ id: option.id, node: button });
          optionHost.appendChild(button);
        });
        questionHost.appendChild(fieldset);
      });
      PRESETS.forEach(function (preset) {
        var button = doc.createElement("button");
        button.type = "button";
        button.textContent = preset.label;
        button.addEventListener("click", function () {
          state.scale = preset.scale;
          state.anisotropy = preset.anisotropy;
          state.shear = preset.shear;
          state.basisScale = preset.basisScale;
          state.swapped = preset.swapped;
          predictions = {};
          state.revealed = false;
          render();
        });
        rootElement.querySelector('[data-role="presets"]').appendChild(button);
      });

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(rootElement, message);
      }

      function renderPrediction() {
        QUESTIONS.forEach(function (question) {
          choices[question.id].forEach(function (choice) {
            choice.node.setAttribute("aria-pressed", predictions[question.id] === choice.id ? "true" : "false");
          });
        });
      }

      function render() {
        ["scale", "anisotropy", "shear", "basisScale"].forEach(function (key) {
          refs[key].value = String(state[key]);
          rootElement.querySelector('[data-role="' + key + '-output"]').textContent = format(state[key], 2);
        });
        refs.swapped.checked = state.swapped;
        renderPrediction();
        refs.result.hidden = !state.revealed;
        if (state.revealed) {
          var data = evaluate(state);
          var correct = QUESTIONS.every(function (question) { return predictions[question.id] === question.answer; });
          refs.result.innerHTML = resultHtml(data, correct);
        } else {
          refs.result.innerHTML = "";
        }
      }

      function parameterChanged() {
        state.scale = Number(refs.scale.value);
        state.anisotropy = Number(refs.anisotropy.value);
        state.shear = Number(refs.shear.value);
        state.basisScale = Number(refs.basisScale.value);
        state.swapped = refs.swapped.checked;
        predictions = {};
        state.revealed = false;
        refs.feedback.textContent = "参数已改变，请重新预测；结果再次隐藏。";
        refs.feedback.className = "dv-feedback";
        render();
      }
      [refs.scale, refs.anisotropy, refs.shear, refs.basisScale, refs.swapped].forEach(function (input) {
        input.addEventListener("input", parameterChanged);
        input.addEventListener("change", parameterChanged);
      });
      rootElement.querySelector('[data-role="reveal"]').addEventListener("click", function () {
        var missing = QUESTIONS.filter(function (question) { return !predictions[question.id]; });
        if (missing.length) {
          refs.feedback.textContent = "请先完成全部五个预测；答案仍未揭晓。";
          refs.feedback.className = "dv-feedback dv-warn";
          announce(refs.feedback.textContent);
          return;
        }
        state.revealed = true;
        var correct = QUESTIONS.every(function (question) { return predictions[question.id] === question.answer; });
        refs.feedback.textContent = correct ? "预测命中；现在把公理、换基和条件数分开读。" : "预测已核对；请重看交替性和小 det 的失败边界。";
        refs.feedback.className = "dv-feedback " + (correct ? "dv-good" : "dv-warn");
        render();
        announce("预测答案已揭晓，行列式体积账本已显示。");
      });
      rootElement.querySelector('[data-role="reset"]').addEventListener("click", function () {
        state.scale = DEFAULTS.scale;
        state.anisotropy = DEFAULTS.anisotropy;
        state.shear = DEFAULTS.shear;
        state.basisScale = DEFAULTS.basisScale;
        state.swapped = DEFAULTS.swapped;
        state.revealed = false;
        predictions = {};
        refs.feedback.textContent = "五题都选完后，结果才会出现。";
        refs.feedback.className = "dv-feedback";
        render();
        announce("行列式体积实验已重置，结果再次隐藏。");
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var uniform = evaluate(DEFAULTS);
      check(near(uniform.detA, 0.125), "uniform determinant is s cubed");
      check(near(uniform.detB, 1), "unit basis determinant");
      check(near(uniform.detAB, uniform.detA * uniform.detB), "product determinant law");
      check(near(uniform.conditionA, 1, 1e-8), "uniform scaling has condition one");
      var thin = evaluate({ scale: 0.5, anisotropy: 0.8, shear: 0, basisScale: 1, swapped: false });
      check(near(thin.detA, uniform.detA, 1e-9), "anisotropy preserves determinant");
      check(thin.conditionA > 3, "anisotropy increases condition number");
      var sheared = evaluate({ scale: 0.5, anisotropy: 0, shear: 0.7, basisScale: 1, swapped: false });
      check(near(sheared.detA, uniform.detA, 1e-9), "column shear preserves determinant");
      var reversed = evaluate({ scale: 0.5, anisotropy: 0, shear: 0, basisScale: 1, swapped: true });
      check(near(reversed.detA, -uniform.detA), "column swap flips sign");
      var collapsed = evaluate({ scale: 0, anisotropy: 0, shear: 0, basisScale: 1, swapped: false });
      check(near(collapsed.detA, 0), "zero scale collapses volume");
      check(collapsed.rankA < 3, "zero determinant has rank defect");
      check(symmetricEigenvalues3([[1, 0, 0], [0, 4, 0], [0, 0, 9]])[0] === 9, "symmetric eigenvalue helper");
      check(singularValues3([[1, 0, 0], [0, 2, 0], [0, 0, 3]])[2] === 1, "singular values helper");
      check(PRESETS.length === 4, "four determinant presets");
      check(QUESTIONS.length === 5, "five prediction questions");
      check(JSON.stringify(evaluate(DEFAULTS)) === JSON.stringify(evaluate(DEFAULTS)), "evaluation is deterministic");
      var invalid = false;
      try { evaluate({ scale: NaN, anisotropy: 0, shear: 0, basisScale: 1, swapped: false }); } catch (error) { invalid = error instanceof RangeError; }
      check(invalid, "nonfinite parameters rejected");
      invalid = false;
      try { evaluate({ scale: 1, anisotropy: 0, shear: 0, basisScale: 1, swapped: "false" }); } catch (error) { invalid = error instanceof TypeError; }
      check(invalid, "string boolean rejected");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      PRESETS: PRESETS,
      QUESTIONS: QUESTIONS,
      matrixFrom: matrixFrom,
      basisMatrix: basisMatrix,
      determinant3: determinant3,
      multiply3: multiply3,
      symmetricEigenvalues3: symmetricEigenvalues3,
      singularValues3: singularValues3,
      condition2: condition2,
      evaluate: evaluate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
