(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("multivariable-derivative", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
    try {
      var report = exported.selfTest();
      console.log("multivariable-derivative self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("multivariable-derivative self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "multivariable-derivative-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;
  var PRESETS = [
    { id: "smooth", label: "光滑标量：梯度可用", kind: "smooth", angle: 35, step: 0.02 },
    { id: "all-directions", label: "全方向反例：仍不可微", kind: "all-directions", angle: 35, step: 0.02 },
    { id: "fold", label: "Fold：奇异且不可逆", kind: "fold", angle: 35, step: 0.02 },
    { id: "cusp", label: "Cusp：奇异但一一对应", kind: "cusp", angle: 35, step: 0.02 }
  ];

  var STYLE_TEXT = [
    ".mv-lab{--mv-blue:var(--cl-blue,#315f9d);--mv-green:var(--cl-green,#39734d);--mv-gold:var(--cl-gold,#9b6a12);--mv-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".mv-lab *,.mv-lab *::before,.mv-lab *::after{box-sizing:border-box}.mv-lab [hidden]{display:none!important}.mv-lab h3,.mv-lab h4{margin:0;letter-spacing:0;color:var(--fg,#292722)}.mv-lab h3{font-size:1.15rem}.mv-lab p{margin:8px 0}.mv-lab .mv-note{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".mv-lab button,.mv-lab select,.mv-lab input{font:inherit}.mv-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.mv-lab button:hover{border-color:var(--mv-blue)}.mv-lab button:focus-visible,.mv-lab input:focus-visible,.mv-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.mv-lab button[aria-pressed=true],.mv-lab .mv-primary{border-color:var(--mv-blue);background:var(--mv-blue);color:var(--bg,#fff);font-weight:750}.mv-lab .mv-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:11px 0}.mv-lab .mv-presets button{font-size:12px}.mv-lab .mv-predict{margin-top:13px;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.mv-lab .mv-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.mv-lab .mv-question{margin:9px 0}.mv-lab .mv-question strong{display:block;font-size:13px}.mv-lab .mv-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.mv-lab .mv-choices button{font-size:12px}.mv-lab .mv-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.mv-lab .mv-actions>*{flex:1 1 170px}.mv-lab .mv-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;font-weight:700}.mv-lab .mv-pass{color:var(--mv-green)}.mv-lab .mv-warn{color:var(--mv-red)}",
    ".mv-lab .mv-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.mv-lab .mv-controls{display:grid;grid-template-columns:minmax(190px,1.15fr) repeat(2,minmax(150px,.85fr));gap:10px;align-items:end;margin:11px 0}.mv-lab .mv-control{display:grid;gap:5px;min-width:0}.mv-lab .mv-control label{color:var(--fg-soft,var(--muted,#6b6557));font-size:12.5px;font-weight:700}.mv-lab .mv-control output{color:var(--mv-blue);font-variant-numeric:tabular-nums}.mv-lab .mv-control select,.mv-lab input[type=range]{width:100%;min-width:0;min-height:44px;margin:0}.mv-lab input[type=range]{accent-color:var(--mv-blue)}",
    ".mv-lab .mv-stage{min-width:0;padding:8px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.mv-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#292722)}.mv-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.mv-lab .mv-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.58}.mv-lab .mv-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.13}.mv-lab .mv-blue-line{fill:none;stroke:var(--mv-blue);stroke-width:2.5}.mv-lab .mv-gold-line{fill:none;stroke:var(--mv-gold);stroke-width:2.5;stroke-dasharray:6 4}.mv-lab .mv-green-line{stroke:var(--mv-green);stroke-width:2.5;stroke-linecap:round}.mv-lab .mv-red-line{stroke:var(--mv-red);stroke-width:2.2;stroke-dasharray:5 4}.mv-lab .mv-point{fill:var(--mv-gold);stroke:var(--bg,#fff);stroke-width:1.5}.mv-lab .mv-small{font-size:11px;fill:var(--fg-soft,var(--muted,#6b6557))}.mv-lab .mv-title{font-size:13px;font-weight:750}",
    ".mv-lab .mv-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.mv-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.mv-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.mv-lab th,.mv-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.mv-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.mv-lab .mv-status{margin-top:11px;padding:9px 11px;border-left:3px solid var(--mv-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
    "@media(max-width:900px){.mv-lab .mv-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.mv-lab .mv-controls{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}@media(max-width:560px){.mv-lab .mv-presets,.mv-lab .mv-choices,.mv-lab .mv-controls{grid-template-columns:minmax(0,1fr)}.mv-lab .mv-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.mv-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function fail(message) {
    throw new Error("multivariable-derivative: " + message);
  }

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-8 : tolerance) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function vectorNorm(vector) {
    return Math.sqrt(vector.reduce(function (sum, value) { return sum + value * value; }, 0));
  }

  function scalarValue(kind, x, y) {
    if (!finite(x) || !finite(y)) fail("scalar coordinates must be finite");
    if (kind === "all-directions") {
      if (x === 0 && y === 0) return 0;
      return x * x * x * y / (Math.pow(x, 6) + y * y);
    }
    return x * x + x * y + 2 * y * y;
  }

  function scalarGradient(kind, x, y) {
    if (kind === "all-directions") {
      return x === 0 && y === 0 ? [0, 0] : null;
    }
    return [2 * x + y, x + 4 * y];
  }

  function unitDirection(angleDegrees) {
    var angle = Number(angleDegrees) * Math.PI / 180;
    return [Math.cos(angle), Math.sin(angle)];
  }

  function directionalQuotient(kind, point, angleDegrees, step) {
    var direction = unitDirection(angleDegrees);
    var h = Number(step);
    if (!finite(h) || Math.abs(h) < EPS) fail("directional step must be nonzero");
    return (scalarValue(kind, point[0] + h * direction[0], point[1] + h * direction[1]) - scalarValue(kind, point[0], point[1])) / h;
  }

  function directionalDerivative(kind, point, angleDegrees) {
    var gradient = scalarGradient(kind, point[0], point[1]);
    if (!gradient) return 0;
    var direction = unitDirection(angleDegrees);
    return gradient[0] * direction[0] + gradient[1] * direction[1];
  }

  function curvedPathEvidence(step) {
    var t = Math.abs(Number(step));
    if (!finite(t) || t < EPS) t = 0.02;
    return [4, 2, 1, 0.5, 0.25].map(function (scale) {
      var x = t * scale;
      var y = x * x * x;
      var value = scalarValue("all-directions", x, y);
      return { t: x, value: value, quotient: Math.abs(value) / vectorNorm([x, y]) };
    });
  }

  function mapValue(kind, x, y) {
    if (kind === "fold") return [x * x, y];
    if (kind === "cusp") return [x, y * y * y];
    return [x + 2 * y, x - y];
  }

  function mapJacobian(kind, x, y) {
    if (kind === "fold") return [[2 * x, 0], [0, 1]];
    if (kind === "cusp") return [[1, 0], [0, 3 * y * y]];
    return [[1, 2], [1, -1]];
  }

  function determinant(matrix) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  }

  function matrixRank(matrix, tolerance) {
    var threshold = tolerance === undefined ? 1e-8 : tolerance;
    var a = matrix.map(function (row) { return row.slice(); });
    var rank = 0;
    for (var column = 0; column < a[0].length && rank < a.length; column += 1) {
      var pivot = rank;
      for (var row = rank + 1; row < a.length; row += 1) {
        if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
      }
      if (Math.abs(a[pivot][column]) <= threshold) continue;
      var swap = a[rank];
      a[rank] = a[pivot];
      a[pivot] = swap;
      for (row = rank + 1; row < a.length; row += 1) {
        var factor = a[row][column] / a[rank][column];
        for (var entry = column; entry < a[row].length; entry += 1) a[row][entry] -= factor * a[rank][entry];
      }
      rank += 1;
    }
    return rank;
  }

  function inverseStatus(kind) {
    if (kind === "fold") return "det J(0)=0；F(x,y)=(x²,y) 把 x 与 −x 合并，原点附近不一一对应。";
    if (kind === "cusp") return "det J(0)=0；F(x,y)=(x,y³) 仍一一对应，但逆含 v^(1/3)，在原点不 C¹。";
    return "det J(0)≠0；逆函数定理在原点给出局部 C¹ 逆。";
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) if (PRESETS[index].id === id) return PRESETS[index];
    return PRESETS[0];
  }

  function analyze(input) {
    var source = input || {};
    var preset = presetById(source.presetId || source.kind || "smooth");
    var kind = source.kind || preset.kind;
    var angle = finite(Number(source.angle)) ? Number(source.angle) : preset.angle;
    var step = finite(Number(source.step)) ? Math.abs(Number(source.step)) : preset.step;
    if (step < 0.0001) step = 0.0001;
    if (kind === "smooth" || kind === "all-directions") {
      var point = kind === "smooth" ? [0.8, -0.5] : [0, 0];
      var gradient = scalarGradient(kind, point[0], point[1]);
      var exactDirectional = directionalDerivative(kind, point, angle);
      var quotient = directionalQuotient(kind, point, angle, step);
      var curved = kind === "all-directions" ? curvedPathEvidence(step) : [];
      return {
        kind: kind,
        label: preset.label,
        point: point,
        angle: angle,
        step: step,
        value: scalarValue(kind, point[0], point[1]),
        gradient: gradient,
        directionalDerivative: exactDirectional,
        directionalQuotient: quotient,
        quotientError: quotient - exactDirectional,
        curvedPath: curved,
        jacobian: null,
        determinant: null,
        rank: null,
        inverseStatus: kind === "all-directions" ? "所有直线方向导数为 0，但沿 y=x³ 有 f=1/2；连续性已失败，所以 Frechet 可微性也失败。" : "C¹ 二次函数：梯度给出唯一线性主部，Frechet 可微。"
      };
    }
    var jacobian = mapJacobian(kind, 0, 0);
    return {
      kind: kind,
      label: preset.label,
      point: [0, 0],
      angle: angle,
      step: step,
      value: mapValue(kind, 0, 0),
      gradient: null,
      directionalDerivative: null,
      directionalQuotient: null,
      quotientError: null,
      curvedPath: [],
      jacobian: jacobian,
      determinant: determinant(jacobian),
      rank: matrixRank(jacobian),
      inverseStatus: inverseStatus(kind)
    };
  }

  function fixed(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(Number(value))) return "∞";
    return Number(value).toFixed(digits === undefined ? 4 : digits);
  }

  function vectorText(vector) {
    return vector ? "(" + vector.map(function (value) { return fixed(value, 3); }).join(", ") + ")" : "—";
  }

  function matrixText(matrix) {
    return matrix ? matrix.map(function (row) { return "[" + row.map(function (value) { return fixed(value, 2); }).join(", ") + "]"; }).join("; ") : "—";
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function svgText(x, y, text, className, anchor) {
    return ['<text x="', x, '" y="', y, '"', className ? ' class="' + className + '"' : "", anchor ? ' text-anchor="' + anchor + '"' : "", '>', escapeHtml(text), '</text>'].join("");
  }

  function buildSvg(data) {
    var parts = [];
    parts.push('<line class="mv-axis" x1="48" y1="272" x2="652" y2="272"></line><line class="mv-axis" x1="48" y1="40" x2="48" y2="272"></line>');
    parts.push(svgText(54, 55, data.kind === "smooth" ? "梯度与方向导数" : data.kind === "all-directions" ? "直线探针 vs. 弯曲路径" : "Jacobian 与逆函数边界", "mv-title"));
    if (data.kind === "smooth" || data.kind === "all-directions") {
      for (var grid = 0; grid <= 4; grid += 1) {
        var gx = 90 + grid * 125;
        var gy = 90 + grid * 40;
        parts.push('<line class="mv-grid" x1="' + gx + '" y1="74" x2="' + gx + '" y2="252"></line>');
        parts.push('<line class="mv-grid" x1="60" y1="' + gy + '" x2="630" y2="' + gy + '"></line>');
      }
      var centerX = 240;
      var centerY = 178;
      parts.push('<circle cx="' + centerX + '" cy="' + centerY + '" r="76" fill="none" stroke="currentColor" stroke-opacity=".23"></circle>');
      var direction = unitDirection(data.angle);
      parts.push('<line class="mv-gold-line" x1="' + centerX + '" y1="' + centerY + '" x2="' + (centerX + 76 * direction[0]).toFixed(1) + '" y2="' + (centerY - 76 * direction[1]).toFixed(1) + '"></line>');
      if (data.gradient) {
        var gradientScale = 34 / Math.max(1, vectorNorm(data.gradient));
        parts.push('<line class="mv-green-line" x1="' + centerX + '" y1="' + centerY + '" x2="' + (centerX + data.gradient[0] * gradientScale).toFixed(1) + '" y2="' + (centerY - data.gradient[1] * gradientScale).toFixed(1) + '"></line>');
        parts.push(svgText(145, 245, "绿：∇f，金：方向 u", "mv-small"));
        parts.push(svgText(315, 105, "Dᵤf=" + fixed(data.directionalDerivative, 3), "mv-small"));
      } else {
        var curve = data.curvedPath.map(function (row, index) {
          var x = 380 + index * 55;
          var y = 220 - Math.min(150, row.quotient * 30);
          return (index ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
        }).join(" ");
        parts.push('<path class="mv-red-line" d="' + curve + '"></path>');
        data.curvedPath.forEach(function (row, index) {
          var x = 380 + index * 55;
          var y = 220 - Math.min(150, row.quotient * 30);
          parts.push('<circle class="mv-point" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4"></circle>');
        });
        parts.push(svgText(375, 245, "红：|f(t,t³)|/||(t,t³)||", "mv-small"));
        parts.push(svgText(300, 105, "直线方向商≈" + fixed(data.directionalQuotient, 4), "mv-small"));
      }
      parts.push(svgText(56, 294, "有限探针是数值证据；线性主部/路径量词才是定理判断。", "mv-small"));
    } else {
      var matrix = data.jacobian;
      parts.push('<rect x="78" y="92" width="250" height="126" fill="none" stroke="currentColor" stroke-opacity=".32"></rect>');
      parts.push(svgText(203, 120, "J(0)=" + matrixText(matrix), "mv-title", "middle"));
      parts.push(svgText(203, 151, "det J=" + fixed(data.determinant, 2) + "，rank=" + data.rank, "mv-small", "middle"));
      parts.push('<line class="mv-blue-line" x1="390" y1="210" x2="590" y2="96"></line>');
      parts.push('<line class="mv-gold-line" x1="390" y1="96" x2="590" y2="210"></line>');
      parts.push('<circle class="mv-point" cx="490" cy="153" r="7"></circle>');
      parts.push(svgText(490, 247, data.kind === "fold" ? "两支折叠到同一点" : "逆含立方根，导数发散", "mv-small", "middle"));
      parts.push(svgText(56, 294, "奇异 J 只撤销逆函数定理的证书，不自动给出同一种反例。", "mv-small"));
    }
    return parts.join("");
  }

  function injectStyles(documentObject) {
    if (!documentObject || documentObject.getElementById(STYLE_ID)) return;
    var style = documentObject.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    documentObject.head.appendChild(style);
  }

  function mount(container) {
    if (!container || container.getAttribute("data-mv-mounted") === "true") return;
    container.setAttribute("data-mv-mounted", "true");
    var documentObject = container.ownerDocument;
    injectStyles(documentObject);
    INSTANCE += 1;
    var prefix = "mv-" + INSTANCE;
    var selected = [null, null, null];
    container.innerHTML = [
      '<div class="mv-lab">',
      '<h3>多元导数：梯度、方向探针与 Jacobian 的证书边界</h3>',
      '<p class="mv-note">先预测，再揭示有限差分、路径账本和逆函数诊断。图与表只报告当前模型和当前网格的证据。</p>',
      '<fieldset class="mv-predict"><legend>三项预测</legend>',
      '<div class="mv-question" data-question="0"><strong>1. 梯度给出的方向导数，是否等于任意有限步长商？</strong><div class="mv-choices"><button type="button" data-choice="0">是，完全相等</button><button type="button" data-choice="1">否，h→0 才取极限</button><button type="button" data-choice="2">只看坐标轴</button></div></div>',
      '<div class="mv-question" data-question="1"><strong>2. f=x³y/(x⁶+y²) 在原点所有直线方向导数为 0，能否推出 Frechet 可微？</strong><div class="mv-choices"><button type="button" data-choice="0">能</button><button type="button" data-choice="1">不能，沿 y=x³ 不连续</button><button type="button" data-choice="2">只要偏导存在就能</button></div></div>',
      '<div class="mv-question" data-question="2"><strong>3. det J(0)=0 是否自动等于“没有局部逆”？</strong><div class="mv-choices"><button type="button" data-choice="0">是</button><button type="button" data-choice="1">否，只是逆函数定理失去证书</button><button type="button" data-choice="2">只要 rank=1 就有 C¹ 逆</button></div></div>',
      '</fieldset>',
      '<div class="mv-actions"><button class="mv-primary" type="button" data-action="reveal">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="mv-feedback" role="status" aria-live="polite"></p>',
      '<div class="mv-reveal" hidden>',
      '<div class="mv-presets">' + PRESETS.map(function (preset) { return '<button type="button" data-preset="' + preset.id + '">' + preset.label + '</button>'; }).join("") + '</div>',
      '<div class="mv-controls">',
      '<div class="mv-control"><label for="' + prefix + '-model">当前模型</label><select id="' + prefix + '-model" data-input="model">' + PRESETS.map(function (preset) { return '<option value="' + preset.kind + '">' + preset.label + '</option>'; }).join("") + '</select></div>',
      '<div class="mv-control"><label for="' + prefix + '-angle">方向角 θ：<output data-output="angle">35°</output></label><input id="' + prefix + '-angle" data-input="angle" type="range" min="0" max="360" step="5" value="35"></div>',
      '<div class="mv-control"><label for="' + prefix + '-step">有限步长 h：<output data-output="step">0.020</output></label><input id="' + prefix + '-step" data-input="step" type="range" min="0.005" max="0.1" step="0.005" value="0.02"></div>',
      '</div>',
      '<div class="mv-stage"><svg viewBox="0 0 700 320" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc"><title id="' + prefix + '-title">多元导数与 Jacobian 诊断图</title><desc id="' + prefix + '-desc">图中用梯度方向、方向商或 Jacobian 行列式展示当前模型的有限证据和定理边界。</desc><g data-svg></g></svg>',
      '<div class="mv-table-wrap"><table aria-label="多元导数诊断账本"><caption>当前模型的可计算量与理论解释分栏记录</caption><thead><tr><th>量</th><th>当前值</th><th>理论层级</th><th>边界</th></tr></thead><tbody data-ledger></tbody></table></div>',
      '<p class="mv-status" role="status" aria-live="polite" data-status></p></div></div>',
      '</div>'
    ].join("");
    var lab = container.querySelector(".mv-lab");
    var reveal = lab.querySelector(".mv-reveal");
    var feedback = lab.querySelector(".mv-feedback");
    var modelInput = lab.querySelector('[data-input="model"]');
    var angleInput = lab.querySelector('[data-input="angle"]');
    var stepInput = lab.querySelector('[data-input="step"]');

    function applyPreset(id) {
      var preset = presetById(id);
      modelInput.value = preset.kind;
      angleInput.value = String(preset.angle);
      stepInput.value = String(preset.step);
      render();
    }

    function render() {
      var data = analyze({ kind: modelInput.value, angle: Number(angleInput.value), step: Number(stepInput.value) });
      lab.querySelector('[data-output="angle"]').textContent = fixed(data.angle, 0) + "°";
      lab.querySelector('[data-output="step"]').textContent = fixed(data.step, 3);
      lab.querySelector("[data-svg]").innerHTML = buildSvg(data);
      var rows;
      if (data.gradient) {
        rows = [
          ["梯度 ∇f", vectorText(data.gradient), "C¹ 模型的 Frechet 线性主部", "只对该光滑模型与点成立"],
          ["方向导数 Dᵤf", fixed(data.directionalDerivative, 5), "梯度与单位方向的内积", "不是任意有限 h 的商"],
          ["有限商 [f(p+hu)−f(p)]/h", fixed(data.directionalQuotient, 5), "当前 h 的数值证据", "h 改变会改变误差"],
          ["Jacobian / inverse", "—", "本项是标量函数，不作向量逆判断", "换成向量映射才讨论 det J"]
        ];
      } else if (data.kind === "all-directions") {
        rows = [
          ["∇f(0)", vectorText(data.gradient), "偏导与所有直线方向导数都为 0", "这还不是 Frechet 定义的全邻域估计"],
          ["当前方向有限商", fixed(data.directionalQuotient, 5), "有限探针的数值证据", "取极限后才是方向导数"],
          ["沿 y=x³ 的 f", fixed(data.curvedPath[0].value, 4), "曲线路径证明不连续", "路径量词不能由直线样本替代"],
          ["Frechet 结论", "不可微", "可微必连续；连续性已经失败", "有限采样不能证明所有路径"]
        ];
      } else {
        rows = [
          ["J(0)", matrixText(data.jacobian), "向量值函数的线性化矩阵", "需在邻域满足 C¹ 才可用逆函数定理"],
          ["det J(0) / rank", fixed(data.determinant, 3) + " / " + data.rank, data.determinant === 0 ? "奇异：定理条件失败" : "非奇异：局部 C¹ 逆有定理保证", "奇异不自动等于不可逆"],
          ["映射实例", data.kind === "fold" ? "(x²,y)" : "(x,y³)", "两种不同的奇异边界", data.kind === "fold" ? "原点附近不一一对应" : "逆的导数在原点发散"],
          ["逆函数诊断", data.inverseStatus, "模型内解析结论", "不是对所有奇异映射的分类"]
        ];
      }
      lab.querySelector("[data-ledger]").innerHTML = rows.map(function (row) { return "<tr>" + row.map(function (cell) { return "<td>" + escapeHtml(cell) + "</td>"; }).join("") + "</tr>"; }).join("");
      lab.querySelector("[data-status]").textContent = data.kind === "smooth" ? "定理层：光滑二次函数在该点 Frechet 可微。数值层：当前有限商只是在逼近 Dᵤf。" : data.kind === "all-directions" ? "定理层：所有直线方向导数存在仍不足以推出可微；沿抛物线的账本给出具体失败边界。" : "定理层：逆函数定理只在 det J≠0 时发证书。数值层：当前 Jacobian 与两个显式映射说明奇异情形不能一概而论。";
    }

    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-choice]");
      if (choice) {
        var question = choice.closest("[data-question]");
        var index = Number(question.getAttribute("data-question"));
        selected[index] = Number(choice.getAttribute("data-choice"));
        question.querySelectorAll("button[data-choice]").forEach(function (button) { button.setAttribute("aria-pressed", button === choice ? "true" : "false"); });
        return;
      }
      var presetButton = event.target.closest("button[data-preset]");
      if (presetButton) { applyPreset(presetButton.getAttribute("data-preset")); return; }
      var action = event.target.closest("button[data-action]");
      if (!action) return;
      if (action.getAttribute("data-action") === "reveal") {
        if (selected.some(function (value) { return value === null; })) {
          feedback.className = "mv-feedback mv-warn";
          feedback.textContent = "请先完成三项预测，再打开诊断账本。";
          return;
        }
        var correct = [1, 1, 1];
        var score = selected.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "mv-feedback " + (score === 3 ? "mv-pass" : "mv-warn");
        feedback.textContent = "预测 " + score + "/3。现在把方向探针、弯曲路径和 Jacobian 证书分开读取。";
        reveal.hidden = false;
        render();
      } else {
        selected = [null, null, null];
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        modelInput.value = "smooth";
        angleInput.value = "35";
        stepInput.value = "0.02";
        reveal.hidden = true;
        feedback.className = "mv-feedback";
        feedback.textContent = "";
      }
    });
    modelInput.addEventListener("change", render);
    angleInput.addEventListener("input", render);
    stepInput.addEventListener("input", render);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; if (!condition) fail("self-test failed: " + message); }
    var smooth = analyze({ kind: "smooth", angle: 0, step: 0.0001 });
    check(near(scalarValue("smooth", 0.8, -0.5), 0.74), "smooth value");
    check(near(smooth.gradient[0], 1.1) && near(smooth.gradient[1], -1.2), "smooth gradient");
    check(near(smooth.directionalDerivative, 1.1), "smooth x direction derivative");
    check(Math.abs(smooth.quotientError) < 0.001, "finite quotient approaches derivative");
    [0, 30, 90, 180, 270].forEach(function (angle) {
      check(near(directionalDerivative("all-directions", [0, 0], angle), 0), "all-direction derivative " + angle);
    });
    var quotientCoarse = Math.abs(directionalQuotient("all-directions", [0, 0], 30, 0.01));
    var quotientFine = Math.abs(directionalQuotient("all-directions", [0, 0], 30, 0.005));
    check(quotientFine < 0.6 * quotientCoarse, "non-axis directional quotient tends to zero");
    var curved = curvedPathEvidence(0.02);
    check(near(curved[0].value, 0.5), "parabola value is one half");
    check(curved[curved.length - 1].quotient > curved[0].quotient, "Frechet quotient grows on parabola");
    var regular = analyze({ kind: "regular" });
    check(near(determinant(regular.jacobian), -3), "regular determinant");
    check(regular.rank === 2, "regular Jacobian rank");
    var fold = analyze({ kind: "fold" });
    check(near(fold.determinant, 0) && fold.rank === 1, "fold singular Jacobian");
    check(mapValue("fold", -1, 0)[0] === mapValue("fold", 1, 0)[0], "fold is not one-to-one");
    var cusp = analyze({ kind: "cusp" });
    check(near(cusp.determinant, 0) && cusp.rank === 1, "cusp singular Jacobian");
    check(mapValue("cusp", 2, -1)[0] === 2, "cusp remains one-to-one in x coordinate");
    check(inverseStatus("cusp").indexOf("一一对应") !== -1, "cusp inverse boundary label");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    scalarValue: scalarValue,
    scalarGradient: scalarGradient,
    directionalQuotient: directionalQuotient,
    directionalDerivative: directionalDerivative,
    curvedPathEvidence: curvedPathEvidence,
    mapValue: mapValue,
    mapJacobian: mapJacobian,
    determinant: determinant,
    matrixRank: matrixRank,
    analyze: analyze,
    mount: mount,
    selfTest: selfTest
  };
});
