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
    var DEFAULTS = { scale: 0.5, anisotropy: 0, shear: 0, basisScale: 1, swapped: false };
    var PRESETS = [
      { id: "uniform", label: "均匀缩小", scale: 0.5, anisotropy: 0, shear: 0, basisScale: 1, swapped: false },
      { id: "thin", label: "同体积但拉扁", scale: 0.5, anisotropy: 0.8, shear: 0, basisScale: 1, swapped: false },
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
      '[data-learning-lab="determinant-volume"]{--dv-accent:#0f766e;--dv-blue:#1d4ed8;--dv-gold:#b45309;--dv-green:#15803d;--dv-good:#15803d;--dv-warn:#b45309;display:block;max-width:100%;min-width:0;color:var(--fg,inherit);line-height:1.55;overflow-wrap:anywhere}',
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
      '[data-learning-lab="determinant-volume"] .dv-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;margin-top:16px}',
      '[data-learning-lab="determinant-volume"] .dv-chart{min-width:0;max-width:100%;overflow-x:auto;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}',
      '[data-learning-lab="determinant-volume"] svg{display:block;width:100%;min-width:800px;height:auto}',
      '[data-learning-lab="determinant-volume"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="determinant-volume"] .dv-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7}[data-learning-lab="determinant-volume"] .dv-edge{stroke:var(--dv-accent);stroke-width:2;stroke-opacity:.68;fill:none}[data-learning-lab="determinant-volume"] .dv-title{font-size:13px;font-weight:750}[data-learning-lab="determinant-volume"] .dv-label{font-size:11px}',
      '[data-learning-lab="determinant-volume"] .dv-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}',
      '[data-learning-lab="determinant-volume"] .dv-metric{min-width:0;padding:9px;border-top:3px solid var(--dv-accent);background:var(--bg,transparent)}',
      '[data-learning-lab="determinant-volume"] .dv-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="determinant-volume"] .dv-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere}',
      '[data-learning-lab="determinant-volume"] .dv-table-wrap{max-width:100%;overflow-x:auto}',
      '[data-learning-lab="determinant-volume"] table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px}',
      '[data-learning-lab="determinant-volume"] th,[data-learning-lab="determinant-volume"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}',
      '[data-learning-lab="determinant-volume"] th{color:var(--fg-soft,currentColor);font-size:11px}',
      '[data-learning-lab="determinant-volume"] .dv-boundary{margin:12px 0;padding:10px 12px;border-left:3px solid var(--dv-warn);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:820px){[data-learning-lab="determinant-volume"] .dv-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="determinant-volume"] .dv-grid{grid-template-columns:minmax(0,1fr)}}',
      '@media(max-width:620px){[data-learning-lab="determinant-volume"] .dv-options{grid-template-columns:minmax(0,1fr)}}',
      '[data-theme="dark"] [data-learning-lab="determinant-volume"]{--dv-accent:#5eead4;--dv-blue:#60a5fa;--dv-gold:#fbbf24;--dv-green:#4ade80;--dv-good:#4ade80;--dv-warn:#fbbf24}',
      '[data-learning-lab="determinant-volume"] .dv-c0{stroke:var(--dv-blue);fill:var(--dv-blue)}[data-learning-lab="determinant-volume"] .dv-c1{stroke:var(--dv-gold);fill:var(--dv-gold)}[data-learning-lab="determinant-volume"] .dv-c2{stroke:var(--dv-green);fill:var(--dv-green)}',
      '[data-learning-lab="determinant-volume"] [tabindex]:focus-visible{outline:3px solid #5eead4;outline-offset:-3px}',
      '[data-theme="dark"] [data-learning-lab="determinant-volume"] button.dv-primary,[data-theme="dark"] [data-learning-lab="determinant-volume"] button[aria-pressed="true"],[data-theme="dark"] [data-learning-lab="determinant-volume"] button:hover{color:#042f2e}',
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="determinant-volume"] *{scroll-behavior:auto!important;transition:none!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function near(left, right, tolerance) {
      return Math.abs(left - right) <= (tolerance || 1e-9);
    }

    function finiteParameter(value, label) {
      if (typeof value !== "number" || !Number.isFinite(value)) throw new RangeError(label + " must be a finite number");
      return value;
    }
    function bounded(value, low, high, label) {
      finiteParameter(value, label);
      if (value < low || value > high) throw new RangeError(label + " outside teaching domain");
      return value;
    }
    function normalize(input) {
      if (!input) throw new TypeError("determinant parameters are required");
      if (typeof input.swapped !== "boolean") throw new TypeError("swapped must be boolean");
      return {
        scale: bounded(input.scale, 0, 1.4, "scale"),
        anisotropy: bounded(input.anisotropy, -0.8, 0.8, "anisotropy"),
        shear: bounded(input.shear, -0.8, 0.8, "shear"),
        basisScale: bounded(input.basisScale, 0.5, 1.5, "basisScale"),
        swapped: input.swapped
      };
    }
    function checkedMatrix(matrix) {
      if (!Array.isArray(matrix) || matrix.length !== 3) throw new TypeError("expected a 3 by 3 matrix");
      for (var i = 0; i < 3; i++) {
        if (!Array.isArray(matrix[i]) || matrix[i].length !== 3) throw new TypeError("expected a 3 by 3 matrix");
        for (var j = 0; j < 3; j++) finiteParameter(matrix[i][j], "matrix entry");
      }
      return matrix;
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
      var b = bounded(basisScale, 0.5, 1.5, "basisScale");
      return [[b, 0.3, 0], [0, b, 0.1], [0, 0, b]];
    }

    function determinant3(matrix) {
      checkedMatrix(matrix);
      var result = matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
        matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
        matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);
      if (!Number.isFinite(result)) throw new RangeError("determinant overflow");
      return result;
    }

    function multiply3(left, right) {
      checkedMatrix(left); checkedMatrix(right);
      var output = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (var i = 0; i < 3; i += 1) {
        for (var j = 0; j < 3; j += 1) {
          for (var k = 0; k < 3; k += 1) output[i][j] += left[i][k] * right[k][j];
        }
      }
      checkedMatrix(output);
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

    function symmetricEigenvalues3(matrix) {
      checkedMatrix(matrix);
      for (var i = 0; i < 3; i++) for (var j = i + 1; j < 3; j++) if (matrix[i][j] !== matrix[j][i]) throw new RangeError("matrix must be symmetric");
      var scale = Math.max.apply(null, matrix.flat().map(Math.abs));
      if (scale === 0) return [0, 0, 0];
      var work = matrix.map(function (row) { return row.map(function (v) { return v / scale; }); });
      for (var iteration = 0; iteration < 60; iteration += 1) {
        var p = 0;
        var q = 1;
        var largest = Math.abs(work[0][1]);
        if (Math.abs(work[0][2]) > largest) { p = 0; q = 2; largest = Math.abs(work[0][2]); }
        if (Math.abs(work[1][2]) > largest) { p = 1; q = 2; largest = Math.abs(work[1][2]); }
        if (largest < 8 * Number.EPSILON) break;
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
      return [work[0][0] * scale, work[1][1] * scale, work[2][2] * scale].sort(function (a, b) { return b - a; });
    }

    // One-sided Jacobi orthogonalizes columns without forming A^T A.
    // Pairwise scaling and normalized correlations avoid absolute stopping thresholds.
    function singularValues3(matrix) {
      checkedMatrix(matrix);
      var work = matrix.map(function (row) { return row.slice(); });
      for (var sweep = 0; sweep < 80; sweep++) {
        var changed = false;
        [[0,1],[0,2],[1,2]].forEach(function (pair) {
          var p = pair[0], q = pair[1];
          var a = Math.hypot(work[0][p], work[1][p], work[2][p]);
          var b = Math.hypot(work[0][q], work[1][q], work[2][q]);
          if (!Number.isFinite(a) || !Number.isFinite(b)) throw new RangeError("singular value overflow");
          if (a === 0 || b === 0) return;
          var rho = 0;
          for (var i = 0; i < 3; i++) rho += (work[i][p] / a) * (work[i][q] / b);
          if (Math.abs(rho) <= 8 * Number.EPSILON) return;
          var scale = Math.max(a,b), ap = a / scale, bp = b / scale;
          var gamma = rho * ap * bp, delta = bp * bp - ap * ap;
          if (gamma === 0) return;
          var tau = delta / (2 * gamma);
          var tangent = !Number.isFinite(tau) ? gamma / delta : Math.abs(tau) > 1 ? (1 / tau) / (1 + Math.hypot(1,1/tau)) : (tau < 0 ? -1 : 1) / (Math.abs(tau) + Math.hypot(1,tau));
          if (tangent === 0) return;
          var cosine = 1 / Math.hypot(1,tangent), sine = tangent * cosine;
          for (var row = 0; row < 3; row++) {
            var x = work[row][p], y = work[row][q];
            work[row][p] = cosine * x - sine * y;
            work[row][q] = sine * x + cosine * y;
          }
          changed = true;
        });
        if (!changed) break;
      }
      return [0,1,2].map(function (j) { return Math.hypot(work[0][j],work[1][j],work[2][j]); }).sort(function (a,b) { return b-a; });
    }
    function condition2(matrix) {
      var values = singularValues3(matrix);
      return values[2] === 0 ? Infinity : values[0] / values[2];
    }
    function evaluate(input) {
      var params = normalize(input), base = matrixFrom(params);
      var A = params.swapped ? swapColumns(base) : base;
      var B = basisMatrix(params.basisScale), AB = multiply3(A,B);
      var sign = params.swapped ? -1 : 1, scale = params.scale;
      var detA = sign * scale * scale * scale, detB = params.basisScale ** 3;
      var values = singularValues3(A), rank = scale > 0 ? 3 : params.shear === 0 ? 0 : 2;
      if (scale === 0) values[2] = 0;
      else if (params.shear === 0) values = [scale * Math.exp(Math.abs(params.anisotropy)), scale, scale / Math.exp(Math.abs(params.anisotropy))];
      else {
        // Exact family identity |det A|=s^3 recovers the weakest direction
        // from the two resolved large singular values; no squared Gram spectrum.
        values[2] = scale * (scale / values[0]) * (scale / values[1]);
      }
      var condition = rank < 3 ? Infinity : params.shear === 0 ? Math.exp(2 * Math.abs(params.anisotropy)) : values[0] / values[2];
      var resolved = rank < 3 || (Number.isFinite(condition) && (params.shear === 0 || values[2] > 0));
      return {
        params: params, A: A, B: B, AB: AB,
        detA: detA, detB: detB, detAB: detA * detB,
        determinantResolved: scale === 0 || (detA !== 0 && detA * detB !== 0),
        rankA: rank, conditionA: resolved ? condition : null,
        conditionResolved: resolved, uniformCondition: scale > 0 ? 1 : Infinity,
        singularValues: values,
        volumeLabel: scale === 0 ? "体积塌缩" : params.swapped ? "反转方向" : "保持方向"
      };
    }
    function format(value, digits) {
      if (value === null) return "超出可表示精度";
      if (value === Infinity) return "∞（奇异）";
      finiteParameter(value, "display value");
      var places = digits === undefined ? 3 : digits;
      if (value === 0) return "0";
      if (Math.abs(value) < Math.pow(10,-places) || Math.abs(value) >= 1e6) return value.toExponential(3);
      var text = value.toFixed(places);
      return places ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
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
      var edges = [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
      function project(point) { return { x: point.x - .65 * point.y, y: point.z + .35 * point.y + .2 * point.x }; }
      function vertices(matrix) { return Array.from({ length: 8 }, function (_,mask) { return project(applyMatrix(matrix,{x:mask&1?1:0,y:mask&2?1:0,z:mask&4?1:0})); }); }
      var unit = vertices([[1,0,0],[0,1,0],[0,0,1]]), left = vertices(data.A), right = vertices(data.AB);
      var all = unit.concat(left,right), minX = Math.min.apply(null,all.map(function(p){return p.x;})), maxX = Math.max.apply(null,all.map(function(p){return p.x;}));
      var minY = Math.min.apply(null,all.map(function(p){return p.y;})), maxY = Math.max.apply(null,all.map(function(p){return p.y;}));
      var pixels = Math.min(290 / (maxX-minX),195 / (maxY-minY));
      function panel(points,offset,label) {
        function map(point) { return { x:offset+48+(point.x-minX)*pixels, y:270-(point.y-minY)*pixels }; }
        function lines(points,reference) { return edges.map(function(edge){var a=map(points[edge[0]]),b=map(points[edge[1]]);return '<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" '+(reference?'stroke="currentColor" stroke-opacity=".3" stroke-dasharray="4 4"':'class="dv-edge"')+'/>';}).join(''); }
        var origin=map({x:0,y:0}), html=lines(unit,true)+lines(points,false);
        [1,2,4].forEach(function(mask,index){var end=map(points[mask]);html+='<line x1="'+origin.x+'" y1="'+origin.y+'" x2="'+end.x+'" y2="'+end.y+'" class="dv-c'+index+'" stroke-width="3"/><circle cx="'+end.x+'" cy="'+end.y+'" r="4" class="dv-c'+index+'"/>';});
        html+='<circle cx="'+origin.x+'" cy="'+origin.y+'" r="3" fill="currentColor"/>';
        html+='<text x="'+(offset+24)+'" y="52" class="dv-title">'+label+' 的单位立方体像</text>';
        html+='<line x1="'+(offset+48)+'" y1="295" x2="'+(offset+48+pixels)+'" y2="295" class="dv-axis"/><text x="'+(offset+48)+'" y="316" class="dv-label">投影横坐标长度 1</text>';
        ['蓝：'+label+'e₁','金：'+label+'e₂','绿：'+label+'e₃'].forEach(function(text,index){html+='<text x="'+(offset+24+index*116)+'" y="342" class="dv-label">'+text+'</text>';});
        return html;
      }
      return '<svg viewBox="0 0 800 365" role="img" aria-label="A 与 AB 的同标尺平行六面体投影，虚线为单位立方体"><text x="24" y="24" class="dv-title">相同投影与等比例缩放；虚线：原单位立方体；实线：变换后的像</text>'+panel(left,0,'A')+panel(right,400,'AB')+'</svg>';
    }
    function resultHtml(data, predictionCorrect) {
      var answerText = predictionCorrect ? "预测命中。" : "预测已核对。";
      var detA = data.params.scale > 0 && data.detA === 0 ? (data.params.swapped?'负':'正')+'、非零（数值下溢）' : format(data.detA,5);
      var detAB = data.params.scale > 0 && data.detAB === 0 ? '非零（数值下溢）' : format(data.detAB,5);
      var singular = data.singularValues.map(function(v,i){return i===2&&data.rankA===3&&v===0?'正数（下溢）':format(v,5);}).join(', ');
      return '<div class="dv-grid"><div class="dv-chart" tabindex="0" role="region" aria-label="同标尺投影，可横向滚动">' + svgFor(data) + '</div><div>' +
        '<div class="dv-metrics"><div class="dv-metric"><span>det(A)=±s³</span><strong>'+detA+'</strong></div><div class="dv-metric"><span>det(B)=b³</span><strong>'+format(data.detB,5)+'</strong></div><div class="dv-metric"><span>det(AB)</span><strong>'+detAB+'</strong></div><div class="dv-metric"><span>精确方向状态</span><strong>'+data.volumeLabel+'</strong></div><div class="dv-metric"><span>精确 rank(A)，由本族结构判定</span><strong>'+data.rankA+'/3</strong></div><div class="dv-metric"><span>κ₂(A)，数值估计</span><strong>'+format(data.conditionA,4)+'</strong></div></div>'+
        '<div class="dv-table-wrap" tabindex="0" role="region" aria-label="矩阵与奇异值账本，可横向滚动"><table><caption>乘法、奇异值与条件数账本</caption><thead><tr><th>对象</th><th>读数</th><th>含义</th></tr></thead><tbody>'+
        '<tr><td>A</td><td>'+matrixText(data.A)+'</td><td>当前三列（含交换）</td></tr><tr><td>B</td><td>'+matrixText(data.B)+'</td><td>新输入基在旧坐标中的列</td></tr><tr><td>AB</td><td>'+matrixText(data.AB)+'</td><td>先 B 后 A，输出仍用旧坐标</td></tr><tr><td>σ₁ ≥ σ₂ ≥ σ₃</td><td>'+singular+'</td><td>|det A|=σ₁σ₂σ₃，κ₂=σ₁/σ₃</td></tr><tr><td>同体积 sI 基准</td><td>κ₂='+format(data.uniformCondition)+'</td><td>'+ (data.params.scale>0?'相同体积绝对值；均匀缩放的条件数恒为 1':'s=0 时是零矩阵，不是良态基准')+'</td></tr></tbody></table></div>'+
        '<p class="dv-boundary">'+answerText+' 这是三维形体的二维投影，不能从屏幕面积读三维体积。投影坐标 U=x−0.65y、V=z+0.35y+0.2x；两图共用一个像素比例尺，随参数自动适配。精确秩来自三角结构，奇异值是浮点估计；正 s 即使体积下溢也不变成奇异矩阵。'+(data.params.scale===0?' 当前零尺度：'+(data.params.shear===0?'A=0，秩为 0。':'h≠0，秩为 2；核方向是 '+(data.params.swapped?'e₂。':'e₁。')):'')+'</p></div></div>';
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
            state.revealed = false;
            render();
            refs.feedback.textContent = "预测已记录；结果仍隐藏。";
            refs.feedback.className = "dv-feedback";
          });
          choices[question.id].push({ id: option.id, node: button });
          optionHost.appendChild(button);
        });
        questionHost.appendChild(fieldset);
      });
      var presetButtons = [];
      PRESETS.forEach(function (preset) {
        var button = doc.createElement("button");
        button.type = "button";
        button.textContent = preset.label;
        button.setAttribute("data-preset", preset.id);
        presetButtons.push({ node:button, preset:preset });
        button.addEventListener("click", function () {
          state.scale = preset.scale;
          state.anisotropy = preset.anisotropy;
          state.shear = preset.shear;
          state.basisScale = preset.basisScale;
          state.swapped = preset.swapped;
          predictions = {};
          state.revealed = false;
          refs.feedback.textContent = "已切换预设，请完成预测后揭示。";
          refs.feedback.className = "dv-feedback";
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
        presetButtons.forEach(function(entry){entry.node.setAttribute("aria-pressed",["scale","anisotropy","shear","basisScale","swapped"].every(function(key){return state[key]===entry.preset[key];})?"true":"false");});
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
        refs.feedback.textContent = state.revealed ? "参数已更新，请比较同标尺形体和账本。" : "参数已更新，请完成预测。";
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
        choices.columnAdd[0].node.focus();
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
      format: format,
      evaluate: evaluate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
