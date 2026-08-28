(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-correlated-transport", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-correlated-transport self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-correlated-transport self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-physics-correlated-transport-styles";
  var PI = Math.PI;
  var SPACE_MIN = -24;
  var SPACE_MAX = 24;
  var WAVE_MIN = 0;
  var WAVE_MAX = 1.2;
  var STRUCTURE_MAX = 16;
  var STYLE_TEXT = [
    '[data-learning-lab="physics-correlated-transport"]{--ct-blue:#2f6f9f;--ct-red:#b3483b;--ct-gold:#a36a16;--ct-green:#39734d;color:var(--fg,currentColor);line-height:1.55;max-width:100%;min-width:0;overflow-wrap:anywhere}',
    '[data-learning-lab="physics-correlated-transport"] *{box-sizing:border-box}',
    '[data-learning-lab="physics-correlated-transport"] h3{margin:0;font-size:1.16rem;letter-spacing:0}',
    '[data-learning-lab="physics-correlated-transport"] p{margin:.65rem 0}',
    '[data-learning-lab="physics-correlated-transport"] .ct-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--ct-gold);background:var(--bg,transparent)}',
    '[data-learning-lab="physics-correlated-transport"] .ct-gate label{display:grid;gap:5px;margin:8px 0;font-weight:700}',
    '[data-learning-lab="physics-correlated-transport"] select,[data-learning-lab="physics-correlated-transport"] input,[data-learning-lab="physics-correlated-transport"] button{font:inherit;min-height:44px}',
    '[data-learning-lab="physics-correlated-transport"] select{width:100%;padding:7px 9px;color:inherit;background:var(--bg,transparent);border:1px solid var(--border,#b8b8b8)}',
    '[data-learning-lab="physics-correlated-transport"] button{padding:8px 13px;border:1px solid var(--border,#b8b8b8);background:var(--bg,transparent);color:inherit;cursor:pointer;border-radius:5px}',
    '[data-learning-lab="physics-correlated-transport"] button:hover{border-color:var(--ct-blue)}',
    '[data-learning-lab="physics-correlated-transport"] button:focus-visible,[data-learning-lab="physics-correlated-transport"] select:focus-visible,[data-learning-lab="physics-correlated-transport"] input:focus-visible{outline:2px solid var(--ct-blue);outline-offset:2px}',
    '[data-learning-lab="physics-correlated-transport"] .ct-primary{background:var(--ct-blue);border-color:var(--ct-blue);color:#fff;font-weight:700}',
    '[data-learning-lab="physics-correlated-transport"] .ct-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}',
    '[data-learning-lab="physics-correlated-transport"] .ct-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;align-items:end;margin:14px 0}',
    '[data-learning-lab="physics-correlated-transport"] .ct-control{min-width:0}',
    '[data-learning-lab="physics-correlated-transport"] .ct-control label{display:grid;gap:5px;font-weight:700}',
    '[data-learning-lab="physics-correlated-transport"] .ct-control output{font-weight:400;color:var(--fg-soft,currentColor);font-variant-numeric:tabular-nums}',
    '[data-learning-lab="physics-correlated-transport"] input[type="range"]{width:100%;accent-color:var(--ct-blue)}',
    '[data-learning-lab="physics-correlated-transport"] .ct-result[hidden]{display:none}',
    '[data-learning-lab="physics-correlated-transport"] .ct-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}',
    '[data-learning-lab="physics-correlated-transport"] .ct-metric{padding:8px;border-top:3px solid var(--ct-blue);background:var(--bg,transparent);min-width:0}',
    '[data-learning-lab="physics-correlated-transport"] .ct-metric:nth-child(2){border-top-color:var(--ct-red)}',
    '[data-learning-lab="physics-correlated-transport"] .ct-metric:nth-child(3){border-top-color:var(--ct-gold)}',
    '[data-learning-lab="physics-correlated-transport"] .ct-metric:nth-child(4){border-top-color:var(--ct-green)}',
    '[data-learning-lab="physics-correlated-transport"] .ct-metric span{display:block;font-size:12px;color:var(--fg-soft,currentColor)}',
    '[data-learning-lab="physics-correlated-transport"] .ct-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
    '[data-learning-lab="physics-correlated-transport"] .ct-frame{border:1px solid var(--border,#b8b8b8);padding:6px;min-width:0;overflow:hidden}',
    '[data-learning-lab="physics-correlated-transport"] .ct-svg{display:block;width:100%;height:auto;color:var(--fg,currentColor)}',
    '[data-learning-lab="physics-correlated-transport"] .ct-svg-compact{display:none!important}',
    '[data-learning-lab="physics-correlated-transport"] .ct-svg text{font-family:inherit;fill:currentColor;letter-spacing:0}',
    '[data-learning-lab="physics-correlated-transport"] .ct-note{margin:12px 0;padding:10px 12px;border-left:3px solid var(--ct-green);font-size:13px;line-height:1.7}',
    '[data-learning-lab="physics-correlated-transport"] .ct-status{min-height:1.5em;color:var(--fg-soft,currentColor);font-size:13px}',
    '@media(max-width:800px){[data-learning-lab="physics-correlated-transport"] .ct-controls{grid-template-columns:1fr 1fr}[data-learning-lab="physics-correlated-transport"] .ct-metrics{grid-template-columns:1fr 1fr}}',
    '@media(max-width:600px){[data-learning-lab="physics-correlated-transport"] .ct-svg-wide{display:none!important}[data-learning-lab="physics-correlated-transport"] .ct-svg-compact{display:block!important}}',
    '@media(max-width:460px){[data-learning-lab="physics-correlated-transport"] .ct-controls{grid-template-columns:1fr}[data-learning-lab="physics-correlated-transport"] .ct-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="physics-correlated-transport"] .ct-actions button{width:100%}}'
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

  function correlation(distance, amplitude, length) {
    return Number(amplitude) * Math.exp(-Math.abs(Number(distance)) / Math.max(1e-9, Number(length)));
  }

  function structureFactor(wavenumber, amplitude, length) {
    var q = Number(wavenumber);
    var xi = Math.max(1e-9, Number(length));
    return 2 * Number(amplitude) * xi / (1 + q * q * xi * xi);
  }

  function modeRatio(time, diffusivity, wavenumber) {
    return Math.exp(-Math.max(0, Number(diffusivity)) * Number(wavenumber) * Number(wavenumber) * Math.max(0, Number(time)));
  }

  function evaluate(options) {
    var settings = options || {};
    var amplitude = 1;
    var length = clamp(finiteNumber(settings.length, 3), 0.5, 8);
    var diffusivity = clamp(finiteNumber(settings.diffusivity, 2), 0.2, 5);
    var wavenumber = clamp(finiteNumber(settings.wavenumber, 0.5), 0.1, 1.2);
    var time = clamp(finiteNumber(settings.time, 1), 0, 8);
    var rate = diffusivity * wavenumber * wavenumber;
    return {
      amplitude: amplitude,
      length: length,
      diffusivity: diffusivity,
      wavenumber: wavenumber,
      time: time,
      rate: rate,
      halfDistance: length * Math.log(2),
      staticFactor: structureFactor(wavenumber, amplitude, length),
      timeConstant: 1 / rate,
      ratio: modeRatio(time, diffusivity, wavenumber),
      dynamicFactor: structureFactor(wavenumber, amplitude, length) * modeRatio(time, diffusivity, wavenumber)
    };
  }

  function format(value, digits) {
    if (!isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    return Number(value).toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function pathFrom(points) {
    return points.map(function (point, index) {
      return (index === 0 ? "M" : "L") + point[0].toFixed(1) + " " + point[1].toFixed(1);
    }).join(" ");
  }

  function chartSvg(model, compact) {
    var width = compact ? 360 : 960;
    var height = compact ? 900 : 410;
    var left = compact ? { x: 44, y: 48, w: 272, h: 180 } : { x: 44, y: 58, w: 270, h: 235 };
    var middle = compact ? { x: 44, y: 320, w: 272, h: 180 } : { x: 345, y: 58, w: 270, h: 235 };
    var right = compact ? { x: 44, y: 592, w: 272, h: 180 } : { x: 646, y: 58, w: 270, h: 235 };
    var xMin = SPACE_MIN;
    var xMax = SPACE_MAX;
    var qMin = WAVE_MIN;
    var qMax = WAVE_MAX;
    var correlationPoints = [];
    var structurePoints = [];
    var modePoints = [];
    var i;
    for (i = 0; i <= 120; i += 1) {
      var x = xMin + (xMax - xMin) * i / 120;
      var q = qMin + (qMax - qMin) * i / 120;
      correlationPoints.push([left.x + left.w * i / 120, left.y + left.h - left.h * correlation(x, model.amplitude, model.length)]);
      structurePoints.push([middle.x + middle.w * i / 120, middle.y + middle.h - middle.h * structureFactor(q, model.amplitude, model.length) / STRUCTURE_MAX]);
    }
    var timeMax = Math.max(4 * model.timeConstant, model.time + 0.5, 1);
    for (i = 0; i <= 120; i += 1) {
      var time = timeMax * i / 120;
      modePoints.push([right.x + right.w * i / 120, right.y + right.h - right.h * modeRatio(time, model.diffusivity, model.wavenumber)]);
    }
    var halfX = left.x + left.w * (model.halfDistance - xMin) / (xMax - xMin);
    var qMarkerX = middle.x + middle.w * (model.wavenumber - qMin) / (qMax - qMin);
    var selectedTimeX = right.x + right.w * model.time / timeMax;
    var tauX = right.x + right.w * model.timeConstant / timeMax;
    var qMarkerLabelX = qMarkerX > middle.x + middle.w - 42 ? qMarkerX - 42 : qMarkerX + 5;
    var grid = "";
    function panelGrid(panel) {
      var output = "";
      [0, 0.25, 0.5, 0.75, 1].forEach(function (fraction) {
        var x = panel.x + panel.w * fraction;
        output += '<line x1="' + x.toFixed(1) + '" y1="' + panel.y + '" x2="' + x.toFixed(1) + '" y2="' + (panel.y + panel.h) + '" class="ct-grid"/>';
      });
      [0, 0.5, 1].forEach(function (fraction) {
        var y = panel.y + panel.h - panel.h * fraction;
        output += '<line x1="' + panel.x + '" y1="' + y.toFixed(1) + '" x2="' + (panel.x + panel.w) + '" y2="' + y.toFixed(1) + '" class="ct-grid"/>';
      });
      return output;
    }
    grid += panelGrid(left) + panelGrid(middle) + panelGrid(right);
    var spatialTicks = '<text x="' + left.x + '" y="' + (left.y + left.h + 18) + '" text-anchor="start">−24</text><text x="' + (left.x + left.w / 2) + '" y="' + (left.y + left.h + 18) + '" text-anchor="middle">0</text><text x="' + (left.x + left.w) + '" y="' + (left.y + left.h + 18) + '" text-anchor="end">24</text>';
    var waveTicks = '<text x="' + middle.x + '" y="' + (middle.y + middle.h + 18) + '" text-anchor="start">0</text><text x="' + (middle.x + middle.w / 2) + '" y="' + (middle.y + middle.h + 18) + '" text-anchor="middle">0.6</text><text x="' + (middle.x + middle.w) + '" y="' + (middle.y + middle.h + 18) + '" text-anchor="end">1.2</text>';
    var timeTicks = '<text x="' + right.x + '" y="' + (right.y + right.h + 18) + '" text-anchor="start">0</text><text x="' + (right.x + right.w / 2) + '" y="' + (right.y + right.h + 18) + '" text-anchor="middle">' + format(timeMax / 2, 1) + '</text><text x="' + (right.x + right.w) + '" y="' + (right.y + right.h + 18) + '" text-anchor="end">' + format(timeMax, 1) + '</text>';
    var footer = compact
      ? '<text x="44" y="850" font-size="11">固定空间轴显示 ξ 改变后的真实衰减</text><text x="44" y="872" font-size="11">中图为 Fourier 结构因子 S(q,0)，右图为扩散模式</text>'
      : '<text x="44" y="385" font-size="11">左图固定空间轴；中图是 Fourier 权重 S(q,0)；右图是守恒模式衰减</text>';
    return '<svg class="ct-svg ' + (compact ? 'ct-svg-compact' : 'ct-svg-wide') + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="左侧为固定物理空间轴上的指数关联，中间为其 Fourier 结构因子 S(q,0)，右侧为扩散密度模式的指数衰减">' +
      '<style>.ct-grid{stroke:currentColor;stroke-opacity:.16;stroke-width:1}.ct-axis{stroke:currentColor;stroke-width:1.2}.ct-correlation{fill:none;stroke:#2f6f9f;stroke-width:3}.ct-structure{fill:none;stroke:#a36a16;stroke-width:3}.ct-mode{fill:none;stroke:#39734d;stroke-width:3}.ct-half,.ct-marker{stroke:#b3483b;stroke-width:1.8;stroke-dasharray:5 4}.ct-tau{stroke:#a36a16;stroke-width:1.8;stroke-dasharray:5 4}</style>' +
      grid +
      '<line x1="' + left.x + '" y1="' + (left.y + left.h) + '" x2="' + (left.x + left.w) + '" y2="' + (left.y + left.h) + '" class="ct-axis"/><line x1="' + left.x + '" y1="' + left.y + '" x2="' + left.x + '" y2="' + (left.y + left.h) + '" class="ct-axis"/>' +
      '<line x1="' + middle.x + '" y1="' + (middle.y + middle.h) + '" x2="' + (middle.x + middle.w) + '" y2="' + (middle.y + middle.h) + '" class="ct-axis"/><line x1="' + middle.x + '" y1="' + middle.y + '" x2="' + middle.x + '" y2="' + (middle.y + middle.h) + '" class="ct-axis"/>' +
      '<line x1="' + right.x + '" y1="' + (right.y + right.h) + '" x2="' + (right.x + right.w) + '" y2="' + (right.y + right.h) + '" class="ct-axis"/><line x1="' + right.x + '" y1="' + right.y + '" x2="' + right.x + '" y2="' + (right.y + right.h) + '" class="ct-axis"/>' +
      '<path d="' + pathFrom(correlationPoints) + '" class="ct-correlation"/><path d="' + pathFrom(structurePoints) + '" class="ct-structure"/><path d="' + pathFrom(modePoints) + '" class="ct-mode"/>' +
      '<line x1="' + halfX.toFixed(1) + '" y1="' + left.y + '" x2="' + halfX.toFixed(1) + '" y2="' + (left.y + left.h) + '" class="ct-half"/>' +
      '<line x1="' + qMarkerX.toFixed(1) + '" y1="' + middle.y + '" x2="' + qMarkerX.toFixed(1) + '" y2="' + (middle.y + middle.h) + '" class="ct-marker"/>' +
      '<line x1="' + selectedTimeX.toFixed(1) + '" y1="' + right.y + '" x2="' + selectedTimeX.toFixed(1) + '" y2="' + (right.y + right.h) + '" class="ct-marker"/>' +
      '<line x1="' + tauX.toFixed(1) + '" y1="' + right.y + '" x2="' + tauX.toFixed(1) + '" y2="' + (right.y + right.h) + '" class="ct-tau"/>' +
      '<text x="' + left.x + '" y="' + (left.y - 26) + '" font-weight="700">C(x) / C₀</text><text x="' + middle.x + '" y="' + (middle.y - 26) + '" font-weight="700">Fourier 权重 S(q,0)</text><text x="' + right.x + '" y="' + (right.y - 26) + '" font-weight="700">δnq(t) / δnq(0)</text>' +
      spatialTicks + waveTicks + timeTicks +
      '<text x="' + (left.x + left.w / 2) + '" y="' + (left.y + left.h + 38) + '" text-anchor="middle">x / μm</text><text x="' + (middle.x + middle.w / 2) + '" y="' + (middle.y + middle.h + 38) + '" text-anchor="middle">q / μm⁻¹</text><text x="' + (right.x + right.w / 2) + '" y="' + (right.y + right.h + 38) + '" text-anchor="middle">t / s</text>' +
      '<text x="' + (left.x + 5) + '" y="' + (left.y + 20) + '" fill="#2f6f9f">C(x)</text><text x="' + (middle.x + 5) + '" y="' + (middle.y + 20) + '" fill="#a36a16">S(q,0)</text><text x="' + (right.x + 5) + '" y="' + (right.y + 20) + '" fill="#39734d">扩散模式</text>' +
      '<text x="' + (halfX + 5).toFixed(1) + '" y="' + (left.y + 42) + '" fill="#b3483b">半高</text><text x="' + qMarkerLabelX.toFixed(1) + '" y="' + (middle.y + 42) + '" fill="#b3483b">当前 q</text><text x="' + (selectedTimeX + 5).toFixed(1) + '" y="' + (right.y + 42) + '" fill="#b3483b">当前 t</text><text x="' + (tauX + 5).toFixed(1) + '" y="' + (right.y + 62) + '" fill="#a36a16">τq</text>' +
      '<text x="' + (left.x - 5) + '" y="' + (left.y + 4) + '" text-anchor="end">1</text><text x="' + (left.x - 5) + '" y="' + (left.y + left.h) + '" text-anchor="end">0</text><text x="' + (middle.x - 5) + '" y="' + (middle.y + 4) + '" text-anchor="end">16</text><text x="' + (middle.x - 5) + '" y="' + (middle.y + middle.h) + '" text-anchor="end">0</text><text x="' + (right.x - 5) + '" y="' + (right.y + 4) + '" text-anchor="end">1</text><text x="' + (right.x - 5) + '" y="' + (right.y + right.h) + '" text-anchor="end">0</text>' +
      footer +
      '</svg>';
  }

  function chart(model) {
    return '<div class="ct-chart">' + chartSvg(model, false) + chartSvg(model, true) + '</div>';
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    host.document.head.appendChild(style);
  }

  function resultHtml(model) {
    return '<div class="ct-metrics">' +
      '<div class="ct-metric"><span>半高距离 ξ ln 2</span><strong>' + format(model.halfDistance, 3) + ' μm</strong></div>' +
      '<div class="ct-metric"><span>模式率 Dq²</span><strong>' + format(model.rate, 4) + ' s⁻¹</strong></div>' +
      '<div class="ct-metric"><span>模式时间 τq</span><strong>' + format(model.timeConstant, 3) + ' s</strong></div>' +
      '<div class="ct-metric"><span>t 时模式比</span><strong>' + format(model.ratio, 4) + '</strong></div>' +
      '</div><div class="ct-frame">' + chart(model) + '</div>' +
      '<div class="ct-note">空间关联长度 ξ 与扩散系数 D 是两本账：左图回答“相隔多远仍相关”，中图画出同一关联的 Fourier 结构因子 S(q,0)，右图回答“给定 q 的守恒模式多快衰减”。右图虚线 τq = 1/(Dq²)，在 t = τq 时模式比为 e⁻¹；左图还标出 C(x)=C₀/2 的半高位置。</div>' +
      '<p class="ct-status" aria-live="polite">读数已更新：S(q,0) = ' + format(model.staticFactor, 4) + '，S(q,t) = ' + format(model.dynamicFactor, 4) + '。</p>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="ct-gate"><strong>揭示前预测</strong>' +
      '<label>ξ 加倍时，空间半高距离怎样？<select data-role="length-prediction"><option value="">请选择</option><option value="correct">加倍</option><option value="wrong-half">减半</option><option value="wrong-same">不变</option></select></label>' +
      '<label>q 加倍时，τq 怎样变化？<select data-role="q-prediction"><option value="">请选择</option><option value="correct">变为四分之一</option><option value="wrong-half">变为二分之一</option><option value="wrong-double">变为两倍</option></select></label>' +
      '<label>长静态关联是否自动等于大电导？<select data-role="separation-prediction"><option value="">请选择</option><option value="correct">不自动等于，ξ 与 D 定义不同</option><option value="wrong-yes">是，二者总是成正比</option><option value="wrong-noise">是因为图上噪声更小</option></select></label>' +
      '</div>' +
      '<div class="ct-actions"><button class="ct-primary" type="button" data-role="reveal">提交预测并显示关联</button><button type="button" data-role="reset">重置</button></div>' +
      '<p class="ct-status" data-role="gate-status" aria-live="polite">先完成三项预测。</p>' +
      '<div class="ct-controls">' +
      '<div class="ct-control"><label>关联长度 ξ <output data-role="length-output">3 μm</output><input data-role="length" type="range" min="0.5" max="8" step="0.5" value="3"></label></div>' +
      '<div class="ct-control"><label>扩散系数 D <output data-role="diffusivity-output">2 μm²/s</output><input data-role="diffusivity" type="range" min="0.2" max="5" step="0.2" value="2"></label></div>' +
      '<div class="ct-control"><label>波数 q <output data-role="wavenumber-output">0.5 μm⁻¹</output><input data-role="wavenumber" type="range" min="0.1" max="1.2" step="0.1" value="0.5"></label></div>' +
      '<div class="ct-control"><label>读数时刻 t <output data-role="time-output">1 s</output><input data-role="time" type="range" min="0" max="8" step="0.5" value="1"></label></div>' +
      '</div><div class="ct-result" data-role="result" hidden></div>';

    var length = root.querySelector('[data-role="length"]');
    var diffusivity = root.querySelector('[data-role="diffusivity"]');
    var wavenumber = root.querySelector('[data-role="wavenumber"]');
    var time = root.querySelector('[data-role="time"]');
    var result = root.querySelector('[data-role="result"]');
    var gateStatus = root.querySelector('[data-role="gate-status"]');
    var revealed = false;

    function currentModel() {
      return evaluate({ length: length.value, diffusivity: diffusivity.value, wavenumber: wavenumber.value, time: time.value });
    }

    function updateOutputs() {
      root.querySelector('[data-role="length-output"]').textContent = format(Number(length.value), 1) + " μm";
      root.querySelector('[data-role="diffusivity-output"]').textContent = format(Number(diffusivity.value), 1) + " μm²/s";
      root.querySelector('[data-role="wavenumber-output"]').textContent = format(Number(wavenumber.value), 1) + " μm⁻¹";
      root.querySelector('[data-role="time-output"]').textContent = format(Number(time.value), 1) + " s";
      if (revealed) result.innerHTML = resultHtml(currentModel());
    }

    [length, diffusivity, wavenumber, time].forEach(function (input) { input.addEventListener("input", updateOutputs); });
    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      var complete = root.querySelector('[data-role="length-prediction"]').value === "correct" &&
        root.querySelector('[data-role="q-prediction"]').value === "correct" &&
        root.querySelector('[data-role="separation-prediction"]').value === "correct";
      if (!complete) {
        gateStatus.textContent = "预测还没有闭合；请分别检查 ξ 的线性尺度、q² 率和 ξ/D 的定义。";
        return;
      }
      revealed = true;
      result.hidden = false;
      result.innerHTML = resultHtml(currentModel());
      gateStatus.textContent = "预测门通过：现在可以独立改变静态关联与动态输运参数。";
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      root.querySelectorAll("select").forEach(function (select) { select.value = ""; });
      length.value = "3";
      diffusivity.value = "2";
      wavenumber.value = "0.5";
      time.value = "1";
      revealed = false;
      result.hidden = true;
      result.innerHTML = "";
      gateStatus.textContent = "先完成三项预测。";
      updateOutputs();
    });
    updateOutputs();
  }

  function selfTest() {
    var checks = 0;
    var model = evaluate({ length: 3, diffusivity: 2, wavenumber: 0.5, time: 1 });
    assert(near(correlation(0, 1, 3), 1, 1e-12), "origin correlation"); checks += 1;
    assert(near(correlation(3, 1, 3), Math.exp(-1), 1e-12), "one length correlation"); checks += 1;
    assert(near(model.halfDistance, 3 * Math.log(2), 1e-12), "half distance"); checks += 1;
    assert(near(model.staticFactor, 6 / 3.25, 1e-12), "structure factor"); checks += 1;
    assert(near(model.rate, 0.5, 1e-12), "diffusive rate"); checks += 1;
    assert(near(model.timeConstant, 2, 1e-12), "mode time"); checks += 1;
    assert(near(model.ratio, Math.exp(-0.5), 1e-12), "mode ratio"); checks += 1;
    assert(near(modeRatio(model.timeConstant, 2, 0.5), Math.exp(-1), 1e-12), "one lifetime"); checks += 1;
    assert(near(structureFactor(0, 1, 3), 6, 1e-12), "zero-wave-number structure factor"); checks += 1;
    assert(near(structureFactor(1, 1, 3), 6 / 10, 1e-12), "large q structure factor"); checks += 1;
    assert(SPACE_MIN === -24 && SPACE_MAX === 24, "fixed physical space domain"); checks += 1;
    assert(correlation(12, 1, 1) < correlation(12, 1, 8), "xi changes decay on fixed space axis"); checks += 1;
    assert(chart(evaluate({ length: 1, diffusivity: 2, wavenumber: 0.5, time: 1 })) !== chart(evaluate({ length: 8, diffusivity: 2, wavenumber: 0.5, time: 1 })), "fixed-domain xi paths change"); checks += 1;
    var rendered = chart(model);
    assert(rendered.indexOf("ct-structure") !== -1 && rendered.indexOf("Fourier 权重 S(q,0)") !== -1, "Fourier structure curve and semantic title"); checks += 1;
    assert(rendered.indexOf("q / μm⁻¹") !== -1 && rendered.indexOf("ct-svg-compact") !== -1, "structure axes and mobile chart labels"); checks += 1;
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest };
});
