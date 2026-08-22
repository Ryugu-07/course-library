(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("matrix-transformations", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("matrix-transformations self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("matrix-transformations self-test: FAIL\n" + error.stack);
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

    var STYLE_ID = "cl-matrix-transformations-styles";
    var EPS = 1e-10;
    var MAPS = [
      { id: "projection", label: "投影到 x 轴", matrix: [[1, 0], [0, 0]] },
      { id: "shear", label: "水平剪切", matrix: [[1, 0.8], [0, 1]] },
      { id: "scale", label: "非等比缩放", matrix: [[1.5, 0], [0, 0.5]] },
      { id: "swap", label: "交换坐标", matrix: [[0, 1], [1, 0]] }
    ];
    var DEFAULTS = { a: "projection", b: "shear", x: 1, y: 1, basis: 0.5, left: 0.4, right: 0.4 };
    var QUESTIONS = [
      {
        id: "order",
        prompt: "两个线性映射 A、B 的复合是否总能交换？",
        options: [
          { id: "no", label: "不一定，AB 可能不同于 BA" },
          { id: "yes", label: "总能交换" },
          { id: "scalar", label: "只要有零元素就能交换" }
        ],
        answer: "no"
      },
      {
        id: "basis",
        prompt: "T⁻¹AT 描述什么？",
        options: [
          { id: "same", label: "同一映射在新基下的坐标矩阵" },
          { id: "new", label: "一定是另一个映射" },
          { id: "transpose", label: "把 A 转置" }
        ],
        answer: "same"
      },
      {
        id: "left",
        prompt: "可逆矩阵 L 左乘 M，最直接对应哪类操作？",
        options: [
          { id: "row", label: "行变换，秩保持" },
          { id: "column", label: "列变换，核保持不变" },
          { id: "point", label: "只改一个输入向量" }
        ],
        answer: "row"
      },
      {
        id: "right",
        prompt: "可逆矩阵 R 右乘 M，最直接对应哪类操作？",
        options: [
          { id: "column", label: "列变换，秩保持" },
          { id: "row", label: "行变换，像完全不变" },
          { id: "none", label: "没有任何变化" }
        ],
        answer: "column"
      },
      {
        id: "rankNullity",
        prompt: "线性映射的 rank 与 kernel 维数之间必须满足什么？",
        options: [
          { id: "sum", label: "核维数 + 像维数 = 定义域维数" },
          { id: "product", label: "核维数 × 像维数 = 定义域维数" },
          { id: "equal", label: "核维数总等于像维数" }
        ],
        answer: "sum"
      }
    ];

    var STYLE_TEXT = [
      '[data-learning-lab="matrix-transformations"]{--mt-accent:#7c3aed;--mt-blue:#2563eb;--mt-red:#dc2626;--mt-good:#15803d;--mt-warn:#b45309;display:block;max-width:100%;min-width:0;color:var(--fg,inherit);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="matrix-transformations"] [hidden]{display:none!important}',
      '[data-learning-lab="matrix-transformations"] .mt-note,[data-learning-lab="matrix-transformations"] .mt-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="matrix-transformations"] .mt-controls,[data-learning-lab="matrix-transformations"] .mt-actions{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}',
      '[data-learning-lab="matrix-transformations"] .mt-control-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:14px 0}',
      '[data-learning-lab="matrix-transformations"] .mt-control{display:grid;gap:5px;min-width:0}',
      '[data-learning-lab="matrix-transformations"] label{font-weight:700}',
      '[data-learning-lab="matrix-transformations"] select,[data-learning-lab="matrix-transformations"] input,[data-learning-lab="matrix-transformations"] button{min-height:44px;font:inherit}',
      '[data-learning-lab="matrix-transformations"] select,[data-learning-lab="matrix-transformations"] input[type="range"]{width:100%}',
      '[data-learning-lab="matrix-transformations"] input[type="range"]{accent-color:var(--mt-accent)}',
      '[data-learning-lab="matrix-transformations"] button{min-width:0;padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit;cursor:pointer;overflow-wrap:anywhere}',
      '[data-learning-lab="matrix-transformations"] button:hover,[data-learning-lab="matrix-transformations"] button[aria-pressed="true"]{border-color:var(--mt-accent);background:var(--mt-accent);color:#fff}',
      '[data-learning-lab="matrix-transformations"] button:focus-visible{outline:3px solid #c4b5fd;outline-offset:2px}',
      '[data-learning-lab="matrix-transformations"] .mt-question{margin:12px 0;padding:10px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}',
      '[data-learning-lab="matrix-transformations"] .mt-question legend{padding:0 4px;font-size:13px;color:var(--fg-soft,currentColor);line-height:1.5}',
      '[data-learning-lab="matrix-transformations"] .mt-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
      '[data-learning-lab="matrix-transformations"] .mt-primary{background:var(--mt-accent);border-color:var(--mt-accent);color:#fff;font-weight:750}',
      '[data-learning-lab="matrix-transformations"] .mt-feedback{min-height:2em;margin:8px 0;font-weight:700}',
      '[data-learning-lab="matrix-transformations"] .mt-good{color:var(--mt-good)}[data-learning-lab="matrix-transformations"] .mt-warn{color:var(--mt-warn)}',
      '[data-learning-lab="matrix-transformations"] .mt-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,1fr);gap:16px;align-items:start;margin-top:16px}',
      '[data-learning-lab="matrix-transformations"] .mt-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}',
      '[data-learning-lab="matrix-transformations"] svg{display:block;width:100%;height:auto}',
      '[data-learning-lab="matrix-transformations"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="matrix-transformations"] .mt-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7}[data-learning-lab="matrix-transformations"] .mt-gridline{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.65}[data-learning-lab="matrix-transformations"] .mt-title{font-size:13px;font-weight:750}[data-learning-lab="matrix-transformations"] .mt-legend{font-size:11px}[data-learning-lab="matrix-transformations"] .mt-vector-label{font-size:11px}',
      '[data-learning-lab="matrix-transformations"] .mt-table-wrap{max-width:100%;overflow-x:auto}',
      '[data-learning-lab="matrix-transformations"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px}',
      '[data-learning-lab="matrix-transformations"] th,[data-learning-lab="matrix-transformations"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}',
      '[data-learning-lab="matrix-transformations"] th{color:var(--fg-soft,currentColor);font-size:11px}',
      '[data-learning-lab="matrix-transformations"] .mt-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}',
      '[data-learning-lab="matrix-transformations"] .mt-metric{min-width:0;padding:9px;border-top:3px solid var(--mt-accent);background:var(--bg,transparent)}',
      '[data-learning-lab="matrix-transformations"] .mt-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="matrix-transformations"] .mt-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere}',
      '[data-learning-lab="matrix-transformations"] .mt-boundary{margin:12px 0;padding:10px 12px;border-left:3px solid var(--mt-warn);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:820px){[data-learning-lab="matrix-transformations"] .mt-control-grid,[data-learning-lab="matrix-transformations"] .mt-grid{grid-template-columns:minmax(0,1fr)}}',
      '@media(max-width:620px){[data-learning-lab="matrix-transformations"] .mt-options{grid-template-columns:minmax(0,1fr)}}',
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="matrix-transformations"] *{scroll-behavior:auto!important;transition:none!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function near(left, right, tolerance) {
      return Math.abs(left - right) <= (tolerance || 1e-9);
    }

    function cloneMatrix(matrix) {
      return matrix.map(function (row) { return row.slice(); });
    }

    function matrixById(id) {
      var found = MAPS.filter(function (item) { return item.id === id; })[0];
      if (!found) throw new Error("Unknown matrix map: " + id);
      return cloneMatrix(found.matrix);
    }

    function matrixLabel(id) {
      var found = MAPS.filter(function (item) { return item.id === id; })[0];
      if (!found) throw new Error("Unknown matrix map: " + id);
      return found.label;
    }

    function multiply(left, right) {
      return [
        [left[0][0] * right[0][0] + left[0][1] * right[1][0], left[0][0] * right[0][1] + left[0][1] * right[1][1]],
        [left[1][0] * right[0][0] + left[1][1] * right[1][0], left[1][0] * right[0][1] + left[1][1] * right[1][1]]
      ];
    }

    function apply(matrix, vector) {
      return { x: matrix[0][0] * vector.x + matrix[0][1] * vector.y, y: matrix[1][0] * vector.x + matrix[1][1] * vector.y };
    }

    function determinant(matrix) {
      return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }

    function rank(matrix) {
      var scale = Math.max(Math.abs(matrix[0][0]), Math.abs(matrix[0][1]), Math.abs(matrix[1][0]), Math.abs(matrix[1][1]));
      if (scale <= EPS) return 0;
      return Math.abs(determinant(matrix)) > 1e-9 ? 2 : 1;
    }

    function inverse(matrix) {
      var det = determinant(matrix);
      if (Math.abs(det) <= EPS) return null;
      return [[matrix[1][1] / det, -matrix[0][1] / det], [-matrix[1][0] / det, matrix[0][0] / det]];
    }

    function leftShear(value) {
      return [[1, value], [0, 1]];
    }

    function rightShear(value) {
      return [[1, 0], [value, 1]];
    }

    function basisMatrix(value) {
      return [[1, value], [0, 1]];
    }

    function vectorText(vector) {
      return "(" + format(vector.x) + ", " + format(vector.y) + ")";
    }

    function matrixText(matrix) {
      return "[" + matrix.map(function (row) { return "[" + row.map(function (value) { return format(value, 2); }).join(", ") + "]"; }).join(", ") + "]";
    }

    function format(value, digits) {
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) < Math.pow(10, -places) / 2) value = 0;
      var text = Number(value).toFixed(places);
      return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
    }

    function kernelLabel(matrix) {
      var r = rank(matrix);
      if (r === 2) return "{0}";
      if (r === 0) return "R²";
      var a = matrix[0][0];
      var b = matrix[0][1];
      if (Math.abs(a) + Math.abs(b) <= EPS) { a = matrix[1][0]; b = matrix[1][1]; }
      return "span{" + format(-b) + ", " + format(a) + "}";
    }

    function imageLabel(matrix) {
      var r = rank(matrix);
      if (r === 0) return "{0}";
      if (r === 2) return "R²";
      var column = Math.abs(matrix[0][0]) + Math.abs(matrix[1][0]) > EPS
        ? { x: matrix[0][0], y: matrix[1][0] }
        : { x: matrix[0][1], y: matrix[1][1] };
      return "span{" + format(column.x) + ", " + format(column.y) + "}";
    }

    function evaluate(input) {
      if (!input) throw new TypeError("matrix transformation parameters are required");
      var state = {
        a: input.a,
        b: input.b,
        x: Number(input.x),
        y: Number(input.y),
        basis: Number(input.basis),
        left: Number(input.left),
        right: Number(input.right)
      };
      [state.x, state.y, state.basis, state.left, state.right].forEach(function (value) {
        if (!Number.isFinite(value)) throw new RangeError("matrix transformation parameters must be finite");
      });
      var A = matrixById(state.a);
      var B = matrixById(state.b);
      var x = { x: state.x, y: state.y };
      var AB = multiply(A, B);
      var BA = multiply(B, A);
      var T = basisMatrix(state.basis);
      var TInverse = inverse(T);
      var coordinateA = multiply(multiply(TInverse, A), T);
      var L = leftShear(state.left);
      var R = rightShear(state.right);
      var LAR = multiply(multiply(L, A), R);
      var Ax = apply(A, x);
      var Bx = apply(B, x);
      var ABx = apply(A, Bx);
      var BAx = apply(B, Ax);
      return {
        state: state,
        A: A,
        B: B,
        AB: AB,
        BA: BA,
        T: T,
        coordinateA: coordinateA,
        L: L,
        R: R,
        LAR: LAR,
        x: x,
        Ax: Ax,
        Bx: Bx,
        ABx: ABx,
        BAx: BAx,
        rankA: rank(A),
        kernelA: kernelLabel(A),
        imageA: imageLabel(A),
        commute: near(AB[0][0], BA[0][0]) && near(AB[0][1], BA[0][1]) && near(AB[1][0], BA[1][0]) && near(AB[1][1], BA[1][1]),
        rankLAR: rank(LAR)
      };
    }

    function installStyles(doc) {
      if (!doc || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      doc.head.appendChild(style);
    }

    function svgFor(data) {
      var vectors = [
        { value: data.x, color: "#475569", label: "x" },
        { value: data.Ax, color: "#d97706", label: "Ax" },
        { value: data.Bx, color: "#15803d", label: "Bx" },
        { value: data.ABx, color: "#2563eb", label: "A(Bx)" },
        { value: data.BAx, color: "#dc2626", label: "B(Ax)" }
      ];
      var limit = 2.8;
      vectors.forEach(function (item) { limit = Math.max(limit, Math.abs(item.value.x) + 0.5, Math.abs(item.value.y) + 0.5); });
      function map(vector) { return { x: 310 + 220 * vector.x / limit, y: 178 - 130 * vector.y / limit }; }
      var grid = [];
      for (var g = -2; g <= 2; g += 1) {
        var horizontalStart = map({ x: -limit, y: g });
        var horizontalEnd = map({ x: limit, y: g });
        var verticalStart = map({ x: g, y: -limit });
        var verticalEnd = map({ x: g, y: limit });
        grid.push('<line x1="' + horizontalStart.x + '" y1="' + horizontalStart.y + '" x2="' + horizontalEnd.x + '" y2="' + horizontalEnd.y + '" class="mt-gridline"/>');
        grid.push('<line x1="' + verticalStart.x + '" y1="' + verticalStart.y + '" x2="' + verticalEnd.x + '" y2="' + verticalEnd.y + '" class="mt-gridline"/>');
      }
      var origin = map({ x: 0, y: 0 });
      var lines = vectors.map(function (item) {
        var endpoint = map(item.value);
        return '<line x1="' + origin.x + '" y1="' + origin.y + '" x2="' + endpoint.x + '" y2="' + endpoint.y + '" stroke="' + item.color + '" stroke-width="' + (item.label === "x" ? 2 : 3) + '" marker-end="url(#mt-arrow)"/><text x="' + (endpoint.x + 5) + '" y="' + (endpoint.y - 5) + '" fill="' + item.color + '" class="mt-vector-label">' + item.label + '</text>';
      }).join("");
      return '<svg viewBox="0 0 620 330" role="img" aria-label="线性映射复合后的向量比较"><defs><marker id="mt-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="currentColor"/></marker></defs>' + grid.join("") +
        '<line x1="42" y1="178" x2="578" y2="178" class="mt-axis"/><line x1="310" y1="30" x2="310" y2="302" class="mt-axis"/>' + lines +
        '<text x="48" y="24" class="mt-title">同一个输入向量的五种读法</text><text x="420" y="314" class="mt-legend">蓝 A(Bx)，红 B(Ax)</text></svg>';
    }

    function matrixRows(data) {
      return '<tr><td>A</td><td>' + matrixText(data.A) + '</td><td>线性映射本身的标准坐标表示</td></tr>' +
        '<tr><td>B</td><td>' + matrixText(data.B) + '</td><td>第二段映射</td></tr>' +
        '<tr><td>AB</td><td>' + matrixText(data.AB) + '</td><td>A(Bx)，先 B 后 A</td></tr>' +
        '<tr><td>BA</td><td>' + matrixText(data.BA) + '</td><td>B(Ax)，先 A 后 B</td></tr>' +
        '<tr><td>T⁻¹AT</td><td>' + matrixText(data.coordinateA) + '</td><td>同一 A 的新基坐标表示</td></tr>' +
        '<tr><td>LAR</td><td>' + matrixText(data.LAR) + '</td><td>左行变换与右列变换</td></tr>';
    }

    function resultHtml(data, predictionCorrect) {
      var answerText = predictionCorrect ? "预测命中：现在把映射、坐标表示和数表运算分开读。" : "预测已核对：请重看左右乘、非交换和秩-零度边界。";
      return '<div class="mt-grid"><div class="mt-chart">' + svgFor(data) + '</div><div>' +
        '<div class="mt-metrics"><div class="mt-metric"><span>rank(A)</span><strong>' + data.rankA + '</strong></div>' +
        '<div class="mt-metric"><span>dim ker(A)</span><strong>' + (2 - data.rankA) + '</strong></div>' +
        '<div class="mt-metric"><span>ker(A)</span><strong>' + data.kernelA + '</strong></div>' +
        '<div class="mt-metric"><span>Im(A)</span><strong>' + data.imageA + '</strong></div>' +
        '<div class="mt-metric"><span>AB=BA?</span><strong>' + (data.commute ? "本例相同" : "本例不同") + '</strong></div>' +
        '<div class="mt-metric"><span>rank(LAR)</span><strong>' + data.rankLAR + '</strong></div></div>' +
        '<div class="mt-table-wrap"><table><caption>映射、坐标与左右乘账本</caption><thead><tr><th>对象</th><th>矩阵或向量</th><th>读法</th></tr></thead><tbody>' +
        '<tr><td>x</td><td>' + vectorText(data.x) + '</td><td>输入向量</td></tr>' +
        '<tr><td>Ax</td><td>' + vectorText(data.Ax) + '</td><td>先作用 A</td></tr>' +
        '<tr><td>Bx</td><td>' + vectorText(data.Bx) + '</td><td>先作用 B</td></tr>' +
        '<tr><td>A(Bx)</td><td>' + vectorText(data.ABx) + '</td><td>对应 ABx</td></tr>' +
        '<tr><td>B(Ax)</td><td>' + vectorText(data.BAx) + '</td><td>对应 BAx</td></tr>' +
        matrixRows(data) +
        '</tbody></table></div>' +
        '<p class="mt-boundary">' + answerText + ' rank-nullity 在当前二维定义域给出 ' + (2 - data.rankA) + ' + ' + data.rankA + ' = 2。L、R 可逆时保秩，但它们对核、像的作用并不相同。</p>' +
        '</div></div>';
    }

    function mount(rootElement, api) {
      if (!rootElement || !rootElement.ownerDocument) return;
      var doc = rootElement.ownerDocument;
      installStyles(doc);
      var state = {
        a: DEFAULTS.a,
        b: DEFAULTS.b,
        x: DEFAULTS.x,
        y: DEFAULTS.y,
        basis: DEFAULTS.basis,
        left: DEFAULTS.left,
        right: DEFAULTS.right,
        revealed: false
      };
      var predictions = {};
      rootElement.innerHTML =
        '<div class="mt-lab">' +
        '<p class="mt-note">先预测复合顺序、换基和左右乘。揭示后可切换 A、B、输入向量、基剪切以及左右初等剪切。</p>' +
        '<div class="mt-control-grid">' +
        '<div class="mt-control"><label for="mt-a">映射 A</label><select id="mt-a" data-role="a"></select></div>' +
        '<div class="mt-control"><label for="mt-b">映射 B</label><select id="mt-b" data-role="b"></select></div>' +
        '<div class="mt-control"><label for="mt-x">输入 x 坐标 = <output data-role="x-output">1</output></label><input id="mt-x" data-role="x" type="range" min="-2" max="2" step="0.1" value="1" aria-label="输入向量 x 坐标"></div>' +
        '<div class="mt-control"><label for="mt-y">输入 y 坐标 = <output data-role="y-output">1</output></label><input id="mt-y" data-role="y" type="range" min="-2" max="2" step="0.1" value="1" aria-label="输入向量 y 坐标"></div>' +
        '<div class="mt-control"><label for="mt-basis">基剪切 t = <output data-role="basis-output">0.5</output></label><input id="mt-basis" data-role="basis" type="range" min="-1" max="1" step="0.1" value="0.5" aria-label="换基剪切 t"></div>' +
        '<div class="mt-control"><label for="mt-left">左乘剪切 l = <output data-role="left-output">0.4</output></label><input id="mt-left" data-role="left" type="range" min="-1" max="1" step="0.1" value="0.4" aria-label="左乘行剪切 l"></div>' +
        '<div class="mt-control"><label for="mt-right">右乘剪切 r = <output data-role="right-output">0.4</output></label><input id="mt-right" data-role="right" type="range" min="-1" max="1" step="0.1" value="0.4" aria-label="右乘列剪切 r"></div>' +
        '</div>' +
        '<div class="mt-questions" data-role="questions"></div>' +
        '<div class="mt-actions"><button type="button" class="mt-primary" data-role="reveal">核对预测并揭示</button><button type="button" data-role="reset">重置</button></div>' +
        '<p class="mt-feedback" data-role="feedback" aria-live="polite">五题都选完后，结果才会出现。</p>' +
        '<div class="mt-result" data-role="result" hidden aria-live="polite"></div>' +
        '</div>';

      var refs = {
        a: rootElement.querySelector('[data-role="a"]'),
        b: rootElement.querySelector('[data-role="b"]'),
        x: rootElement.querySelector('[data-role="x"]'),
        y: rootElement.querySelector('[data-role="y"]'),
        basis: rootElement.querySelector('[data-role="basis"]'),
        left: rootElement.querySelector('[data-role="left"]'),
        right: rootElement.querySelector('[data-role="right"]'),
        result: rootElement.querySelector('[data-role="result"]'),
        feedback: rootElement.querySelector('[data-role="feedback"]')
      };
      MAPS.forEach(function (map) {
        var optionA = doc.createElement("option");
        optionA.value = map.id;
        optionA.textContent = map.label;
        refs.a.appendChild(optionA);
        var optionB = doc.createElement("option");
        optionB.value = map.id;
        optionB.textContent = map.label;
        refs.b.appendChild(optionB);
      });
      var choices = {};
      var questionHost = rootElement.querySelector('[data-role="questions"]');
      QUESTIONS.forEach(function (question) {
        var fieldset = doc.createElement("fieldset");
        fieldset.className = "mt-question";
        fieldset.innerHTML = '<legend>' + question.prompt + '</legend><div class="mt-options"></div>';
        var optionHost = fieldset.querySelector(".mt-options");
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
            refs.feedback.className = "mt-feedback";
          });
          choices[question.id].push({ id: option.id, node: button });
          optionHost.appendChild(button);
        });
        questionHost.appendChild(fieldset);
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
        refs.a.value = state.a;
        refs.b.value = state.b;
        ["x", "y", "basis", "left", "right"].forEach(function (key) {
          refs[key].value = String(state[key]);
          rootElement.querySelector('[data-role="' + key + '-output"]').textContent = format(state[key], 2);
        });
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
        state.a = refs.a.value;
        state.b = refs.b.value;
        state.x = Number(refs.x.value);
        state.y = Number(refs.y.value);
        state.basis = Number(refs.basis.value);
        state.left = Number(refs.left.value);
        state.right = Number(refs.right.value);
        predictions = {};
        state.revealed = false;
        refs.feedback.textContent = "参数已改变，请重新预测；结果再次隐藏。";
        refs.feedback.className = "mt-feedback";
        render();
      }
      [refs.a, refs.b, refs.x, refs.y, refs.basis, refs.left, refs.right].forEach(function (input) {
        input.addEventListener("input", parameterChanged);
        input.addEventListener("change", parameterChanged);
      });
      rootElement.querySelector('[data-role="reveal"]').addEventListener("click", function () {
        var missing = QUESTIONS.filter(function (question) { return !predictions[question.id]; });
        if (missing.length) {
          refs.feedback.textContent = "请先完成全部五个预测；答案仍未揭晓。";
          refs.feedback.className = "mt-feedback mt-warn";
          announce(refs.feedback.textContent);
          return;
        }
        state.revealed = true;
        var correct = QUESTIONS.every(function (question) { return predictions[question.id] === question.answer; });
        refs.feedback.textContent = correct ? "预测命中；现在把映射、坐标和乘法顺序分开读。" : "预测已核对；请重看相似变换、左右乘和 rank-nullity。";
        refs.feedback.className = "mt-feedback " + (correct ? "mt-good" : "mt-warn");
        render();
        announce("预测答案已揭晓，矩阵变换账本已显示。");
      });
      rootElement.querySelector('[data-role="reset"]').addEventListener("click", function () {
        state.a = DEFAULTS.a;
        state.b = DEFAULTS.b;
        state.x = DEFAULTS.x;
        state.y = DEFAULTS.y;
        state.basis = DEFAULTS.basis;
        state.left = DEFAULTS.left;
        state.right = DEFAULTS.right;
        state.revealed = false;
        predictions = {};
        refs.feedback.textContent = "五题都选完后，结果才会出现。";
        refs.feedback.className = "mt-feedback";
        render();
        announce("矩阵变换实验已重置，结果再次隐藏。");
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var data = evaluate(DEFAULTS);
      check(MAPS.length === 4, "four map presets");
      check(QUESTIONS.length === 5, "five prediction questions");
      check(!data.commute, "default maps do not commute");
      check(near(data.ABx.x, data.AB[0][0] * data.x.x + data.AB[0][1] * data.x.y), "AB vector composition");
      check(near(data.ABx.y, data.AB[1][0] * data.x.x + data.AB[1][1] * data.x.y), "AB vector second coordinate");
      check(data.rankA === 1, "projection rank");
      check(data.kernelA !== "{0}", "projection kernel is nontrivial");
      check(data.rankLAR === data.rankA, "invertible left and right factors preserve rank");
      check(near(multiply(data.T, data.coordinateA)[0][1], multiply(data.A, data.T)[0][1]), "similarity coordinate bridge");
      check(rank([[1, 2], [2, 4]]) === 1, "rank one helper");
      check(rank([[0, 0], [0, 0]]) === 0, "zero rank helper");
      var invertible = [[2, 1], [1, 1]];
      var inv = inverse(invertible);
      var identity = multiply(invertible, inv);
      check(near(identity[0][0], 1) && near(identity[1][1], 1), "inverse helper");
      check(near(determinant([[1, 0], [0, 1]]), 1), "determinant helper");
      check(JSON.stringify(evaluate(DEFAULTS)) === JSON.stringify(evaluate(DEFAULTS)), "evaluation is deterministic");
      var invalid = false;
      try { evaluate({ a: "missing", b: "projection", x: 1, y: 1, basis: 0, left: 0, right: 0 }); } catch (error) { invalid = true; }
      check(invalid, "unknown map rejected");
      invalid = false;
      try { evaluate({ a: "projection", b: "rotation", x: NaN, y: 1, basis: 0, left: 0, right: 0 }); } catch (error) { invalid = error instanceof RangeError; }
      check(invalid, "nonfinite vector rejected");
      return { checks: checks };
    }

    return {
      MAPS: MAPS,
      DEFAULTS: DEFAULTS,
      QUESTIONS: QUESTIONS,
      multiply: multiply,
      apply: apply,
      determinant: determinant,
      rank: rank,
      inverse: inverse,
      evaluate: evaluate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
