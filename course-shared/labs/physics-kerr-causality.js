(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-kerr-causality", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-kerr-causality self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-kerr-causality self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-physics-kerr-causality-styles";
  var STYLE_TEXT = [
    '[data-learning-lab="physics-kerr-causality"]{--kc-blue:#2f6f9f;--kc-red:#b3483b;--kc-gold:#a36a16;--kc-green:#39734d;color:var(--fg,currentColor);line-height:1.55;max-width:100%;min-width:0;overflow-wrap:anywhere}',
    '[data-learning-lab="physics-kerr-causality"] *{box-sizing:border-box}',
    '[data-learning-lab="physics-kerr-causality"] h3{margin:0;font-size:1.16rem;letter-spacing:0}',
    '[data-learning-lab="physics-kerr-causality"] p{margin:.65rem 0}',
    '[data-learning-lab="physics-kerr-causality"] .kc-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--kc-gold);background:var(--bg,transparent)}',
    '[data-learning-lab="physics-kerr-causality"] .kc-gate label{display:grid;gap:5px;margin:8px 0;font-weight:700}',
    '[data-learning-lab="physics-kerr-causality"] select,[data-learning-lab="physics-kerr-causality"] input,[data-learning-lab="physics-kerr-causality"] button{font:inherit;min-height:44px}',
    '[data-learning-lab="physics-kerr-causality"] select{width:100%;padding:7px 9px;color:inherit;background:var(--bg,transparent);border:1px solid var(--border,#b8b8b8)}',
    '[data-learning-lab="physics-kerr-causality"] button{padding:8px 13px;border:1px solid var(--border,#b8b8b8);background:var(--bg,transparent);color:inherit;cursor:pointer;border-radius:5px}',
    '[data-learning-lab="physics-kerr-causality"] button:hover{border-color:var(--kc-blue)}',
    '[data-learning-lab="physics-kerr-causality"] button:focus-visible,[data-learning-lab="physics-kerr-causality"] select:focus-visible,[data-learning-lab="physics-kerr-causality"] input:focus-visible{outline:2px solid var(--kc-blue);outline-offset:2px}',
    '[data-learning-lab="physics-kerr-causality"] .kc-primary{background:var(--kc-blue);border-color:var(--kc-blue);color:#fff;font-weight:700}',
    '[data-learning-lab="physics-kerr-causality"] .kc-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}',
    '[data-learning-lab="physics-kerr-causality"] .kc-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end;margin:14px 0}',
    '[data-learning-lab="physics-kerr-causality"] .kc-control{min-width:0}',
    '[data-learning-lab="physics-kerr-causality"] .kc-control label{display:grid;gap:5px;font-weight:700}',
    '[data-learning-lab="physics-kerr-causality"] .kc-control output{font-weight:400;color:var(--fg-soft,currentColor);font-variant-numeric:tabular-nums}',
    '[data-learning-lab="physics-kerr-causality"] input[type="range"]{width:100%;accent-color:var(--kc-blue)}',
    '[data-learning-lab="physics-kerr-causality"] .kc-result[hidden]{display:none}',
    '[data-learning-lab="physics-kerr-causality"] .kc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}',
    '[data-learning-lab="physics-kerr-causality"] .kc-metric{padding:8px;border-top:3px solid var(--kc-blue);background:var(--bg,transparent);min-width:0}',
    '[data-learning-lab="physics-kerr-causality"] .kc-metric:nth-child(2){border-top-color:var(--kc-red)}',
    '[data-learning-lab="physics-kerr-causality"] .kc-metric:nth-child(3){border-top-color:var(--kc-gold)}',
    '[data-learning-lab="physics-kerr-causality"] .kc-metric:nth-child(4){border-top-color:var(--kc-green)}',
    '[data-learning-lab="physics-kerr-causality"] .kc-metric span{display:block;font-size:12px;color:var(--fg-soft,currentColor)}',
    '[data-learning-lab="physics-kerr-causality"] .kc-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
    '[data-learning-lab="physics-kerr-causality"] .kc-frame{border:1px solid var(--border,#b8b8b8);padding:6px;min-width:0;overflow:hidden}',
    '[data-learning-lab="physics-kerr-causality"] .kc-svg{display:block;width:100%;height:auto;color:var(--fg,currentColor)}',
    '[data-learning-lab="physics-kerr-causality"] .kc-svg-compact{display:none!important}',
    '[data-learning-lab="physics-kerr-causality"] .kc-svg text{font-family:inherit;fill:currentColor;letter-spacing:0}',
    '[data-learning-lab="physics-kerr-causality"] .kc-note{margin:12px 0;padding:10px 12px;border-left:3px solid var(--kc-green);font-size:13px;line-height:1.7}',
    '[data-learning-lab="physics-kerr-causality"] .kc-status{min-height:1.5em;color:var(--fg-soft,currentColor);font-size:13px}',
    '@media(max-width:600px){[data-learning-lab="physics-kerr-causality"] .kc-svg-wide{display:none!important}[data-learning-lab="physics-kerr-causality"] .kc-svg-compact{display:block!important}}',
    '@media(max-width:760px){[data-learning-lab="physics-kerr-causality"] .kc-controls{grid-template-columns:1fr}[data-learning-lab="physics-kerr-causality"] .kc-metrics{grid-template-columns:1fr 1fr}}',
    '@media(max-width:460px){[data-learning-lab="physics-kerr-causality"] .kc-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="physics-kerr-causality"] .kc-actions button{width:100%}}'
  ].join("");

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-9) * scale;
  }

  function finiteNumber(value, fallback) {
    var number = Number(value);
    return isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function horizonRadii(spin) {
    var a = clamp(Number(spin), -0.999999, 0.999999);
    var rootValue = Math.sqrt(1 - a * a);
    return { inner: 1 - rootValue, outer: 1 + rootValue, spin: a };
  }

  function ergosurfaceEquator() {
    return 2;
  }

  function equatorialMetric(radius, spin) {
    var r = Number(radius);
    var a = Number(spin);
    return {
      gtt: 2 / r - 1,
      gtphi: -2 * a / r,
      gphiphi: r * r + a * a + 2 * a * a / r,
      delta: r * r - 2 * r + a * a
    };
  }

  function angularBounds(radius, spin) {
    var horizons = horizonRadii(spin);
    var r = Number(radius);
    if (!isFinite(r) || r <= horizons.outer) return { valid: false, lower: NaN, upper: NaN, center: NaN };
    var metric = equatorialMetric(r, horizons.spin);
    var discriminant = metric.gtphi * metric.gtphi - metric.gtt * metric.gphiphi;
    if (discriminant < 0 || metric.gphiphi <= 0) return { valid: false, lower: NaN, upper: NaN, center: NaN };
    var root = Math.sqrt(Math.max(0, discriminant));
    var center = -metric.gtphi / metric.gphiphi;
    return {
      valid: true,
      lower: (-metric.gtphi - root) / metric.gphiphi,
      upper: (-metric.gtphi + root) / metric.gphiphi,
      center: center,
      metric: metric
    };
  }

  function classifyAngularBounds(bounds) {
    if (!bounds || !bounds.valid) return { key: "invalid", label: "模型域外" };
    var tolerance = 1e-9 * Math.max(1, Math.abs(bounds.lower), Math.abs(bounds.upper));
    if (Math.abs(bounds.lower) <= tolerance) {
      return { key: "static-limit-boundary", label: "静止极限边界" };
    }
    if (bounds.lower < 0) {
      return { key: "reverse-allowed", label: "允许反向角速度" };
    }
    return { key: "forced-corotation", label: "强制共转" };
  }

  function evaluate(options) {
    var settings = options || {};
    var spin = clamp(finiteNumber(settings.spin, 0.8), -0.99, 0.99);
    var horizons = horizonRadii(spin);
    var offset = clamp(finiteNumber(settings.offset, 0.2), 0.05, 3);
    var radius = horizons.outer + offset;
    var bounds = angularBounds(radius, spin);
    var causalClassification = classifyAngularBounds(bounds);
    return {
      spin: spin,
      innerHorizon: horizons.inner,
      outerHorizon: horizons.outer,
      ergosurface: ergosurfaceEquator(),
      offset: offset,
      radius: radius,
      inErgosphere: radius < ergosurfaceEquator(),
      bounds: bounds,
      causalClassification: causalClassification,
      horizonAngularVelocity: spin / (2 * horizons.outer),
      metric: bounds.metric
    };
  }

  function format(value, digits) {
    if (!isFinite(value)) return "模型域外";
    var places = digits === undefined ? 4 : digits;
    return Number(value).toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function chartSvg(model, compact) {
    var width = compact ? 360 : 800;
    var height = compact ? 510 : 390;
    var left = compact ? 44 : 64;
    var right = compact ? 316 : 735;
    var radialY = compact ? 60 : 86;
    var radialH = compact ? 42 : 54;
    var rMax = Math.max(4.5, model.radius + 1.4);
    function radiusX(radius) {
      return left + (right - left) * (radius - model.outerHorizon) / (rMax - model.outerHorizon);
    }
    var ergoX = radiusX(model.ergosurface);
    var selectedX = radiusX(model.radius);
    var radialTitle = compact
      ? '<text x="' + left + '" y="' + (radialY - 28) + '" font-weight="700">赤道面外部径向域</text><text x="' + left + '" y="' + (radialY - 10) + '" font-size="11">左边界 r₊；仅计算 r&gt;r₊</text>'
      : '<text x="' + left + '" y="' + (radialY - 14) + '" font-weight="700">赤道面外部径向域（左边界是 r₊，不计算 r≤r₊）</text>';
    var radial = '<rect x="' + left + '" y="' + radialY + '" width="' + (right - left) + '" height="' + radialH + '" fill="#2f6f9f" opacity=".08"/>' +
      '<line x1="' + left + '" y1="' + radialY + '" x2="' + left + '" y2="' + (radialY + radialH) + '" stroke="#b3483b" stroke-width="4"/>' +
      '<line x1="' + ergoX.toFixed(1) + '" y1="' + radialY + '" x2="' + ergoX.toFixed(1) + '" y2="' + (radialY + radialH) + '" stroke="#a36a16" stroke-width="3" stroke-dasharray="6 4"/>' +
      '<circle cx="' + selectedX.toFixed(1) + '" cy="' + (radialY + radialH / 2) + '" r="8" fill="#39734d" stroke="currentColor" stroke-width="2"/>' +
      radialTitle +
      '<text x="' + (left + 4) + '" y="' + (radialY + radialH + 22) + '" fill="#b3483b">r₊=' + format(model.outerHorizon, 3) + '</text>' +
      '<text x="' + (ergoX + 5).toFixed(1) + '" y="' + (radialY + radialH + 22) + '" fill="#a36a16">rE=2</text>' +
      '<text x="' + (selectedX + 5).toFixed(1) + '" y="' + (radialY + 20) + '" fill="#39734d">当前 r</text>';
    var lower = model.bounds.lower;
    var upper = model.bounds.upper;
    var minimum = Math.min(lower, 0, upper);
    var maximum = Math.max(lower, 0, upper);
    var padding = Math.max(0.04, (maximum - minimum) * 0.2);
    minimum -= padding;
    maximum += padding;
    var angleLeft = compact ? 55 : 105;
    var angleRight = compact ? 315 : 705;
    var angleY = compact ? 285 : 242;
    function omegaX(value) {
      return angleLeft + (angleRight - angleLeft) * (value - minimum) / (maximum - minimum);
    }
    var zeroX = omegaX(0);
    var lowerX = omegaX(lower);
    var upperX = omegaX(upper);
    var centerX = omegaX(model.bounds.center);
    var lowerLabelX = Math.max(angleLeft + 2, lowerX - 12);
    var upperLabelX = Math.min(angleRight - 20, upperX - 10);
    var zeroLabelX = Math.min(angleRight - 42, zeroX + 5);
    var classificationY = compact ? angleY + 112 : angleY + 96;
    var classificationText;
    if (model.causalClassification.key === "reverse-allowed") {
      classificationText = compact
        ? '<text x="' + angleLeft + '" y="' + classificationY + '" fill="#b3483b">状态：反向允许（Ωmin&lt;0）</text>'
        : '<text x="' + angleLeft + '" y="' + classificationY + '" fill="#b3483b">状态：反向允许（Ωmin&lt;0）</text>';
    } else if (model.causalClassification.key === "static-limit-boundary") {
      classificationText = '<text x="' + angleLeft + '" y="' + classificationY + '" fill="#b3483b">状态：静止极限边界（Ωmin≈0）</text>' +
        '<text x="' + angleLeft + '" y="' + (classificationY + 20) + '" fill="#b3483b">Ω=0 为类光端点；严格类时需 Ω&gt;0</text>';
    } else {
      classificationText = '<text x="' + angleLeft + '" y="' + classificationY + '" fill="#39734d">状态：强制共转（Ωmin&gt;0）</text>';
    }
    var angleDescription = compact
      ? '<text x="' + angleLeft + '" y="' + (angleY + 78) + '">Ω = dφ/dt（坐标角速度）</text><text x="' + angleLeft + '" y="' + (angleY + 98) + '">不是局部速度</text>'
      : '<text x="' + angleLeft + '" y="' + (angleY + 78) + '">Ω = dφ/dt（坐标角速度，不是局部速度）</text>';
    var axis = '<line x1="' + angleLeft + '" y1="' + angleY + '" x2="' + angleRight + '" y2="' + angleY + '" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="' + zeroX.toFixed(1) + '" y1="' + (angleY - 32) + '" x2="' + zeroX.toFixed(1) + '" y2="' + (angleY + 32) + '" stroke="#b3483b" stroke-width="2" stroke-dasharray="5 4"/>' +
      '<line x1="' + lowerX.toFixed(1) + '" y1="' + angleY + '" x2="' + upperX.toFixed(1) + '" y2="' + angleY + '" stroke="#2f6f9f" stroke-width="10" stroke-linecap="round"/>' +
      '<circle cx="' + lowerX.toFixed(1) + '" cy="' + angleY + '" r="6" fill="#2f6f9f"/><circle cx="' + upperX.toFixed(1) + '" cy="' + angleY + '" r="6" fill="#2f6f9f"/>' +
      '<circle cx="' + centerX.toFixed(1) + '" cy="' + angleY + '" r="6" fill="#39734d" stroke="currentColor" stroke-width="2"/>' +
      '<text x="' + angleLeft + '" y="' + (angleY - 54) + '" font-weight="700">固定 r 的未来因果角速度区间</text>' +
      '<text x="' + lowerLabelX.toFixed(1) + '" y="' + (angleY + 28) + '" fill="#2f6f9f">Ω−</text><text x="' + upperLabelX.toFixed(1) + '" y="' + (angleY + 28) + '" fill="#2f6f9f">Ω+</text><text x="' + Math.max(angleLeft + 2, centerX - 18).toFixed(1) + '" y="' + (angleY - 16) + '" fill="#39734d">ZAMO</text><text x="' + zeroLabelX.toFixed(1) + '" y="' + (angleY + 48) + '" fill="#b3483b">Ω=0</text>' +
      angleDescription + classificationText;
    var footer = compact
      ? '<text x="44" y="480" font-size="11">外部计算域从 r₊ 右侧开始；能层不是第二个视界</text>'
      : '<text x="64" y="375" font-size="11">模型只读外视界 r₊ 之外；能层是 r₊&lt;r&lt;2 的外部区域，不是第二个视界</text>';
    return '<svg class="kc-svg ' + (compact ? 'kc-svg-compact' : 'kc-svg-wide') + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Kerr 赤道面外部径向域、外视界与静止极限面，以及带三态分类的允许因果角速度区间">' +
      '<style>.kc-grid{stroke:currentColor;stroke-opacity:.16;stroke-width:1}.kc-axis{stroke:currentColor;stroke-width:1.2}</style>' + radial + axis +
      footer +
      '</svg>';
  }

  function chart(model) {
    return '<div class="kc-chart">' + chartSvg(model, false) + chartSvg(model, true) + '</div>';
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    host.document.head.appendChild(style);
  }

  function resultHtml(model) {
    var orientation;
    if (model.causalClassification.key === "reverse-allowed") {
      orientation = "允许反向角速度（Ωmin&lt;0）：区间包含负的坐标角速度";
    } else if (model.causalClassification.key === "static-limit-boundary") {
      orientation = "静止极限边界（Ωmin≈0）：Ω=0 是类光端点，严格类时必须 Ω&gt;0";
    } else {
      orientation = "强制共转（Ωmin&gt;0）：严格类时固定半径世界线必须取正向 Ω";
    }
    return '<div class="kc-metrics">' +
      '<div class="kc-metric"><span>外视界 r₊</span><strong>' + format(model.outerHorizon, 4) + '</strong></div>' +
      '<div class="kc-metric"><span>静止极限 rE</span><strong>' + format(model.ergosurface, 4) + '</strong></div>' +
      '<div class="kc-metric"><span>Ω− 到 Ω+</span><strong>[' + format(model.bounds.lower, 4) + ', ' + format(model.bounds.upper, 4) + ']</strong></div>' +
      '<div class="kc-metric"><span>视界 ΩH</span><strong>' + format(model.horizonAngularVelocity, 4) + '</strong></div>' +
      '</div><div class="kc-frame">' + chart(model) + '</div>' +
      '<div class="kc-note">' + orientation + '。r₊ 由 Δ=0 给出，rE 由 gtt=0 给出；Boyer–Lindquist 坐标在视界处的分母发散不等于曲率发散。当前计算域从 r₊ 右侧开始，不把区间外推到视界内部。</div>' +
      '<p class="kc-status" aria-live="polite">读数已更新：当前 r=' + format(model.radius, 4) + '，' + model.causalClassification.label + '；' + (model.inErgosphere ? "位于赤道面能层内" : (near(model.radius, model.ergosurface, 1e-9) ? "位于静止极限面" : "位于能层外")) + '。</p>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="kc-gate"><strong>揭示前预测</strong>' +
      '<label>对 0&lt;|a|&lt;1，赤道面 rE 与 r₊ 的关系？<select data-role="surface-prediction"><option value="">请选择</option><option value="correct">能层外部有宽度，只有 a=0 才重合</option><option value="wrong-same">总是重合</option><option value="wrong-inside">rE 总在 r₊ 内</option></select></label>' +
      '<label>正自旋能层内，Ω=0 的固定半径世界线怎样？<select data-role="cone-prediction"><option value="">请选择</option><option value="correct">不满足未来因果条件，必须正向共转</option><option value="wrong-allowed">仍可静止</option><option value="wrong-light">只能沿 Ω=0 的光线走</option></select></label>' +
      '<label>Δ=0 处的 Boyer–Lindquist 分母发散说明什么？<select data-role="coordinate-prediction"><option value="">请选择</option><option value="correct">坐标图病态；要用不变量或正则坐标判断物理奇点</option><option value="wrong-curvature">曲率必然无限大</option><option value="wrong-wall">视界是有形硬墙</option></select></label>' +
      '<label>本实验对视界内的结论范围？<select data-role="scope-prediction"><option value="">请选择</option><option value="correct">只算外部，不能由图推出内部全球因果演化</option><option value="wrong-all">可直接推出所有内部命运</option><option value="wrong-none">外部角锥也没有物理含义</option></select></label>' +
      '</div>' +
      '<div class="kc-actions"><button class="kc-primary" type="button" data-role="reveal">提交预测并显示因果锥</button><button type="button" data-role="reset">重置</button></div>' +
      '<p class="kc-status" data-role="gate-status" aria-live="polite">先完成四项预测。</p>' +
      '<div class="kc-controls">' +
      '<div class="kc-control"><label>无量纲自旋 a <output data-role="spin-output">0.8</output><input data-role="spin" type="range" min="-0.99" max="0.99" step="0.01" value="0.8"></label></div>' +
      '<div class="kc-control"><label>距外视界偏移 r−r₊ <output data-role="offset-output">0.2</output><input data-role="offset" type="range" min="0.05" max="3" step="0.05" value="0.2"></label></div>' +
      '</div><div class="kc-result" data-role="result" hidden></div>';

    var spin = root.querySelector('[data-role="spin"]');
    var offset = root.querySelector('[data-role="offset"]');
    var result = root.querySelector('[data-role="result"]');
    var gateStatus = root.querySelector('[data-role="gate-status"]');
    var revealed = false;

    function currentModel() {
      return evaluate({ spin: spin.value, offset: offset.value });
    }

    function updateOutputs() {
      root.querySelector('[data-role="spin-output"]').textContent = format(Number(spin.value), 2);
      root.querySelector('[data-role="offset-output"]').textContent = format(Number(offset.value), 2);
      if (revealed) result.innerHTML = resultHtml(currentModel());
    }

    [spin, offset].forEach(function (input) { input.addEventListener("input", updateOutputs); });
    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      var complete = root.querySelector('[data-role="surface-prediction"]').value === "correct" &&
        root.querySelector('[data-role="cone-prediction"]').value === "correct" &&
        root.querySelector('[data-role="coordinate-prediction"]').value === "correct" &&
        root.querySelector('[data-role="scope-prediction"]').value === "correct";
      if (!complete) {
        gateStatus.textContent = "预测还没有闭合；请把两种曲面、因果锥和外部计算域分开检查。";
        return;
      }
      revealed = true;
      result.hidden = false;
      result.innerHTML = resultHtml(currentModel());
      gateStatus.textContent = "预测门通过：现在可以拖动自旋和位置，观察能层与因果角速度区间。";
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      root.querySelectorAll("select").forEach(function (select) { select.value = ""; });
      spin.value = "0.8";
      offset.value = "0.2";
      revealed = false;
      result.hidden = true;
      result.innerHTML = "";
      gateStatus.textContent = "先完成四项预测。";
      updateOutputs();
    });
    updateOutputs();
  }

  function selfTest() {
    var checks = 0;
    var horizons = horizonRadii(0.8);
    assert(near(horizons.outer, 1.6, 1e-12), "outer horizon"); checks += 1;
    assert(near(horizons.inner, 0.4, 1e-12), "inner horizon"); checks += 1;
    assert(near(ergosurfaceEquator(), 2, 1e-12), "equatorial ergosurface"); checks += 1;
    var bounds = angularBounds(1.8, 0.8);
    assert(bounds.valid, "exterior angular domain"); checks += 1;
    assert(near(bounds.lower, 0.07835, 0.0002), "lower angular bound"); checks += 1;
    assert(near(bounds.upper, 0.3088, 0.0002), "upper angular bound"); checks += 1;
    assert(bounds.lower > 0 && bounds.upper > 0, "forced corotation"); checks += 1;
    var outside = angularBounds(3, 0.8);
    assert(outside.lower < 0 && outside.upper > 0, "reverse rotation outside ergosphere"); checks += 1;
    assert(!angularBounds(1.6, 0.8).valid, "horizon excluded from exterior calculation"); checks += 1;
    assert(near(evaluate({ spin: 0.8, offset: 0.2 }).horizonAngularVelocity, 0.25, 1e-12), "horizon angular velocity"); checks += 1;
    var forced = evaluate({ spin: 0.8, offset: 0.2 });
    var boundary = evaluate({ spin: 0.8, offset: 0.4 });
    var reverse = evaluate({ spin: 0.8, offset: 1.4 });
    assert(forced.causalClassification.key === "forced-corotation", "forced corotation classification"); checks += 1;
    assert(near(boundary.radius, 2, 1e-12) && near(boundary.bounds.lower, 0, 1e-12), "reachable static-limit boundary"); checks += 1;
    assert(boundary.causalClassification.key === "static-limit-boundary", "static-limit classification"); checks += 1;
    assert(reverse.causalClassification.key === "reverse-allowed", "reverse-allowed classification"); checks += 1;
    var rendered = chart(boundary);
    assert(rendered.indexOf("Ω=0 为类光端点") !== -1 && rendered.indexOf("Ωmin≈0") !== -1, "static-limit semantic labels"); checks += 1;
    assert(rendered.indexOf("kc-svg-compact") !== -1 && rendered.indexOf("固定 r 的未来因果角速度区间") !== -1, "mobile chart and causal-axis labels"); checks += 1;
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest };
});
