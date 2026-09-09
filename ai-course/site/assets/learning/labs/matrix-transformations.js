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
      '[data-learning-lab="matrix-transformations"] .mt-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;margin-top:16px}',
      '[data-learning-lab="matrix-transformations"] .mt-chart{min-width:0;max-width:100%;overflow-x:auto;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}',
      '[data-learning-lab="matrix-transformations"] svg{display:block;width:100%;min-width:700px;height:auto}',
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
      '[data-theme="dark"] [data-learning-lab="matrix-transformations"]{--mt-accent:#c4b5fd;--mt-blue:#60a5fa;--mt-red:#fca5a5;--mt-good:#4ade80;--mt-warn:#fbbf24}',
      '[data-theme="dark"] [data-learning-lab="matrix-transformations"] button.mt-primary,[data-theme="dark"] [data-learning-lab="matrix-transformations"] button[aria-pressed="true"],[data-theme="dark"] [data-learning-lab="matrix-transformations"] button:hover{color:#2e1065}',
      '[data-learning-lab="matrix-transformations"] [tabindex]:focus-visible{outline:3px solid #c4b5fd;outline-offset:-3px}',
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

    function finite(value) {
      if (typeof value !== "number" || !Number.isFinite(value)) throw new RangeError("expected finite numeric value");
      return value;
    }
    function checked(matrix) {
      if (!Array.isArray(matrix) || matrix.length !== 2) throw new TypeError("expected a 2 by 2 matrix");
      for (var i=0;i<2;i++) {
        if (!Array.isArray(matrix[i]) || matrix[i].length !== 2) throw new TypeError("expected a 2 by 2 matrix");
        for (var j=0;j<2;j++) finite(matrix[i][j]);
      }
      return matrix;
    }
    function bounded(value,low,high) {
      finite(value); if (value<low || value>high) throw new RangeError("outside teaching domain"); return value;
    }
    function multiply(left, right) {
      checked(left); checked(right);
      return checked([
        [left[0][0]*right[0][0]+left[0][1]*right[1][0],left[0][0]*right[0][1]+left[0][1]*right[1][1]],
        [left[1][0]*right[0][0]+left[1][1]*right[1][0],left[1][0]*right[0][1]+left[1][1]*right[1][1]]
      ]);
    }
    function apply(matrix, vector) {
      checked(matrix); finite(vector.x); finite(vector.y);
      return {x:finite(matrix[0][0]*vector.x+matrix[0][1]*vector.y),y:finite(matrix[1][0]*vector.x+matrix[1][1]*vector.y)};
    }
    // Exact dyadic arithmetic only for the 2x2 determinant/rank certificate.
    // It certifies the supplied binary numbers, not an unknown matrix before rounding.
    function dyadic(value) {
      finite(value); if (value===0) return {n:0n,e:0};
      var view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value,false);
      var high=view.getUint32(0,false),low=view.getUint32(4,false),exponent=(high>>>20)&2047;
      var mantissa=(BigInt(high&1048575)<<32n)|BigInt(low);
      if(exponent)mantissa|=1n<<52n;
      return {n:high>>>31?-mantissa:mantissa,e:exponent?exponent-1075:-1074};
    }
    function exactDet(matrix) {
      checked(matrix);var a=dyadic(matrix[0][0]),b=dyadic(matrix[0][1]),c=dyadic(matrix[1][0]),d=dyadic(matrix[1][1]);
      var e1=a.e+d.e,e2=b.e+c.e,e=Math.min(e1,e2);
      return {n:((a.n*d.n)<<BigInt(e1-e))-((b.n*c.n)<<BigInt(e2-e)),e:e};
    }
    function ratio(numerator,denominator,requireNonzero) {
      if(denominator.n===0n)throw new RangeError("division by zero");
      if(numerator.n===0n)return 0;
      function parts(pair) {
        var n=pair.n<0n?-pair.n:pair.n,bits=n.toString(2).length,shift=Math.max(0,bits-54);
        return {mantissa:Number(n>>BigInt(shift))/Math.pow(2,Math.min(bits,54)-1),exponent:pair.e+bits-1};
      }
      var a=parts(numerator),b=parts(denominator),m=a.mantissa/b.mantissa,e=a.exponent-b.exponent;
      if(m<1){m*=2;e--;}
      if(m>=2){m/=2;e++;}
      var pivot=Math.max(-1022,Math.min(1023,e));
      var value=(m*Math.pow(2,pivot))*Math.pow(2,e-pivot);
      if(!Number.isFinite(value)||(requireNonzero&&value===0))throw new RangeError("result outside floating-point representation");
      return (numerator.n<0n)!==(denominator.n<0n)?-value:value;
    }
    function determinant(matrix) {return ratio(exactDet(matrix),{n:1n,e:0},false);}
    function rank(matrix) {
      checked(matrix);if(matrix.every(function(row){return row.every(function(v){return v===0;});}))return 0;
      return exactDet(matrix).n===0n?1:2;
    }
    function inverse(matrix) {
      var det=exactDet(matrix);if(det.n===0n)return null;
      return [[matrix[1][1],-matrix[0][1]],[-matrix[1][0],matrix[0][0]]].map(function(row){return row.map(function(v){return ratio(dyadic(v),det,true);});});
    }

    function leftShear(value) {
      return [[1, 0], [value, 1]];
    }

    function rightShear(value) {
      return [[1, value], [0, 1]];
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
      finite(value);var places=digits===undefined?3:digits;
      if(value===0)return "0";
      if(Math.abs(value)<Math.pow(10,-places)||Math.abs(value)>=1e6)return value.toExponential(3);
      var text=value.toFixed(places);return places?text.replace(/0+$/,"").replace(/\.$/,""):text;
    }
    function kernelLabel(matrix) {
      var r = rank(matrix);
      if (r === 2) return "{0}";
      if (r === 0) return "R²";
      var a = matrix[0][0];
      var b = matrix[0][1];
      if (a === 0 && b === 0) { a = matrix[1][0]; b = matrix[1][1]; }
      return "span{(" + format(-b) + ", " + format(a) + ")}";
    }

    function imageLabel(matrix) {
      var r = rank(matrix);
      if (r === 0) return "{0}";
      if (r === 2) return "R²";
      var column = matrix[0][0] !== 0 || matrix[1][0] !== 0
        ? { x: matrix[0][0], y: matrix[1][0] }
        : { x: matrix[0][1], y: matrix[1][1] };
      return "span{(" + format(column.x) + ", " + format(column.y) + ")}";
    }

    function evaluate(input) {
      if (!input) throw new TypeError("matrix transformation parameters are required");
      var state = {
        a: input.a,
        b: input.b,
        x: bounded(input.x,-2,2),
        y: bounded(input.y,-2,2),
        basis: bounded(input.basis,-1,1),
        left: bounded(input.left,-1,1),
        right: bounded(input.right,-1,1)
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
      var newInput=apply(TInverse,x),newOutput=apply(coordinateA,newInput),restoredOutput=apply(T,newOutput);
      var LA=multiply(L,A),AR=multiply(A,R);
      return {
        state: state,
        A: A,
        B: B,
        AB: AB,
        BA: BA,
        T: T,
        newInput:newInput,newOutput:newOutput,restoredOutput:restoredOutput,
        LA:LA,AR:AR,
        kernelLAR:rank(A)===2?"{0}":"span{("+format(-state.right)+", 1)}",
        imageLAR:rank(A)===2?"R²":"span{(1, "+format(state.left)+")}",
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
        rankLAR: rank(A)
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
      var vectors=[data.x,data.Ax,data.Bx,data.ABx,data.BAx],limit=2;
      vectors.forEach(function(v){limit=Math.max(limit,Math.ceil(Math.max(Math.abs(v.x),Math.abs(v.y))+.5));});
      var pixels=120/limit;
      function panel(offset,intermediate,output,midLabel,outLabel,color) {
        function map(v){return{x:offset+180+pixels*v.x,y:198-pixels*v.y};}
        var html='',ticks=[-limit,0,limit];
        ticks.forEach(function(t){var x=map({x:t,y:0}).x,y=map({x:0,y:t}).y;html+='<line x1="'+(offset+60)+'" y1="'+y+'" x2="'+(offset+300)+'" y2="'+y+'" class="mt-gridline"/><line x1="'+x+'" y1="78" x2="'+x+'" y2="318" class="mt-gridline"/><text x="'+x+'" y="338" text-anchor="middle" class="mt-legend">'+t+'</text><text x="'+(offset+48)+'" y="'+(y+4)+'" text-anchor="end" class="mt-legend">'+t+'</text>';});
        html+='<line x1="'+(offset+52)+'" y1="198" x2="'+(offset+306)+'" y2="198" class="mt-axis"/><line x1="'+(offset+180)+'" y1="70" x2="'+(offset+180)+'" y2="325" class="mt-axis"/>';
        [{v:data.x,color:'currentColor',dash:true},{v:intermediate,color:'var(--mt-good)'},{v:output,color:color}].forEach(function(item){var end=map(item.v);html+='<line x1="'+(offset+180)+'" y1="198" x2="'+end.x+'" y2="'+end.y+'" stroke="'+item.color+'" stroke-width="3" '+(item.dash?'stroke-dasharray="5 4"':'')+'/><circle cx="'+end.x+'" cy="'+end.y+'" r="4" fill="'+item.color+'"/>';});
        html+='<text x="'+(offset+24)+'" y="52" class="mt-title">'+outLabel+'：'+(outLabel==='ABx'?'先 B 后 A':'先 A 后 B')+'</text><text x="'+(offset+314)+'" y="205" class="mt-legend">x₁</text><text x="'+(offset+192)+'" y="74" class="mt-legend">x₂</text>';
        html+='<text x="'+(offset+24)+'" y="365" class="mt-legend">虚线输入 x='+vectorText(data.x)+'</text><text x="'+(offset+24)+'" y="388" class="mt-legend">绿色中间 '+midLabel+'='+vectorText(intermediate)+'</text><text x="'+(offset+24)+'" y="411" class="mt-legend">'+(outLabel==='ABx'?'蓝色':'红色')+'输出 '+outLabel+'='+vectorText(output)+'</text>';
        return html;
      }
      return '<svg viewBox="0 0 720 438" role="img" aria-label="两种复合顺序，同输入与同一等比例坐标"><text x="24" y="24" class="mt-title">同一输入，两种顺序；两图共用等比例坐标；重合向量请读下方数值</text>'+panel(0,data.Bx,data.ABx,'Bx','ABx','var(--mt-blue)')+panel(360,data.Ax,data.BAx,'Ax','BAx','var(--mt-red)')+'</svg>';
    }

    function matrixRows(data) {
      return '<tr><td>A</td><td>' + matrixText(data.A) + '</td><td>线性映射本身的标准坐标表示</td></tr>' +
        '<tr><td>B</td><td>' + matrixText(data.B) + '</td><td>第二段映射</td></tr>' +
        '<tr><td>AB</td><td>' + matrixText(data.AB) + '</td><td>A(Bx)，先 B 后 A</td></tr>' +
        '<tr><td>BA</td><td>' + matrixText(data.BA) + '</td><td>B(Ax)，先 A 后 B</td></tr>' +
        '<tr><td>T</td><td>' + matrixText(data.T) + '</td><td>新基向量在旧坐标中的列</td></tr>' +
        '<tr><td>T⁻¹x</td><td>' + vectorText(data.newInput) + '</td><td>同一个输入的新坐标</td></tr>' +
        '<tr><td>(T⁻¹AT)(T⁻¹x)</td><td>' + vectorText(data.newOutput) + '</td><td>输出的新坐标</td></tr>' +
        '<tr><td>T × 输出新坐标</td><td>' + vectorText(data.restoredOutput) + '</td><td>还原后应等于 Ax</td></tr>' +
        '<tr><td>T⁻¹AT</td><td>' + matrixText(data.coordinateA) + '</td><td>同一 A 的新基坐标表示</td></tr>' +
        '<tr><td>L</td><td>' + matrixText(data.L) + '</td><td>第二行加 l 倍第一行</td></tr>' +
        '<tr><td>R</td><td>' + matrixText(data.R) + '</td><td>第二列加 r 倍第一列</td></tr>' +
        '<tr><td>ker(LAR)</td><td>' + data.kernelLAR + '</td><td>R⁻¹ ker(A)，定义域中的子空间</td></tr>' +
        '<tr><td>Im(LAR)</td><td>' + data.imageLAR + '</td><td>L Im(A)，陪域中的子空间</td></tr>' +
        '<tr><td>LAR</td><td>' + matrixText(data.LAR) + '</td><td>左行变换与右列变换</td></tr>';
    }

    function resultHtml(data, predictionCorrect) {
      var answerText = predictionCorrect ? "预测命中：现在把映射、坐标表示和数表运算分开读。" : "预测已核对：请重看左右乘、非交换和秩-零度边界。";
      return '<div class="mt-grid"><div class="mt-chart" tabindex="0" role="region" aria-label="复合顺序图，可横向滚动">' + svgFor(data) + '</div><div>' +
        '<div class="mt-metrics"><div class="mt-metric"><span>rank(A)</span><strong>' + data.rankA + '</strong></div>' +
        '<div class="mt-metric"><span>dim ker(A)</span><strong>' + (2 - data.rankA) + '</strong></div>' +
        '<div class="mt-metric"><span>ker(A)</span><strong>' + data.kernelA + '</strong></div>' +
        '<div class="mt-metric"><span>Im(A)</span><strong>' + data.imageA + '</strong></div>' +
        '<div class="mt-metric"><span>AB=BA?</span><strong>' + (data.commute ? "本例相同" : "本例不同") + '</strong></div>' +
        '<div class="mt-metric"><span>理论 rank(LAR)</span><strong>' + data.rankLAR + '</strong></div></div>' +
        '<div class="mt-table-wrap" tabindex="0" role="region" aria-label="映射与坐标账本，可横向滚动"><table><caption>映射、坐标与左右乘账本</caption><thead><tr><th>对象</th><th>矩阵或向量</th><th>读法</th></tr></thead><tbody>' +
        '<tr><td>x</td><td>' + vectorText(data.x) + '</td><td>输入向量</td></tr>' +
        '<tr><td>Ax</td><td>' + vectorText(data.Ax) + '</td><td>先作用 A</td></tr>' +
        '<tr><td>Bx</td><td>' + vectorText(data.Bx) + '</td><td>先作用 B</td></tr>' +
        '<tr><td>A(Bx)</td><td>' + vectorText(data.ABx) + '</td><td>对应 ABx</td></tr>' +
        '<tr><td>B(Ax)</td><td>' + vectorText(data.BAx) + '</td><td>对应 BAx</td></tr>' +
        matrixRows(data) +
        '</tbody></table></div>' +
        '<p class="mt-boundary">' + answerText + ' rank-nullity 在当前二维定义域给出 ' + (2 - data.rankA) + ' + ' + data.rankA + ' = 2。L、R 可逆，故本族 rank(LAR)=rank(A)。核与像的具体方向分别由 R⁻¹ 和 L 改变。相似变换的坐标值可能不同，但还原输出始终是同一个 Ax。</p>' +
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
            state.revealed = false;
            render();
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
        refs.feedback.textContent = state.revealed ? "参数已更新，请核对两条路径、换基还原与核像账本。" : "参数已更新，请完成预测。";
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
        choices.order[0].node.focus();
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
      format: format,
      mount: mount,
      selfTest: selfTest
    };
  }
);
