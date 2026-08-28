(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-kubo-response", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-kubo-response self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-kubo-response self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-physics-kubo-response-styles";
  var PI = Math.PI;
  var TIME_MIN = -4;
  var TIME_MAX = 16;
  var FREQUENCY_MAX = 9;
  var CURRENT_MAX = 2;
  var STYLE_TEXT = [
    '[data-learning-lab="physics-kubo-response"]{--kr-blue:#2f6f9f;--kr-red:#b3483b;--kr-gold:#a36a16;--kr-green:#39734d;color:var(--fg,currentColor);line-height:1.55;max-width:100%;min-width:0;overflow-wrap:anywhere}',
    '[data-learning-lab="physics-kubo-response"] *{box-sizing:border-box}',
    '[data-learning-lab="physics-kubo-response"] h3{margin:0;font-size:1.16rem;letter-spacing:0}',
    '[data-learning-lab="physics-kubo-response"] p{margin:.65rem 0}',
    '[data-learning-lab="physics-kubo-response"] .kr-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--kr-gold);background:var(--bg,transparent)}',
    '[data-learning-lab="physics-kubo-response"] .kr-gate label{display:grid;gap:5px;margin:8px 0;font-weight:700}',
    '[data-learning-lab="physics-kubo-response"] select,[data-learning-lab="physics-kubo-response"] input,[data-learning-lab="physics-kubo-response"] button{font:inherit;min-height:44px}',
    '[data-learning-lab="physics-kubo-response"] select{width:100%;padding:7px 9px;color:inherit;background:var(--bg,transparent);border:1px solid var(--border,#b8b8b8)}',
    '[data-learning-lab="physics-kubo-response"] button{padding:8px 13px;border:1px solid var(--border,#b8b8b8);background:var(--bg,transparent);color:inherit;cursor:pointer;border-radius:5px}',
    '[data-learning-lab="physics-kubo-response"] button:hover{border-color:var(--kr-blue)}',
    '[data-learning-lab="physics-kubo-response"] button:focus-visible,[data-learning-lab="physics-kubo-response"] select:focus-visible,[data-learning-lab="physics-kubo-response"] input:focus-visible{outline:2px solid var(--kr-blue);outline-offset:2px}',
    '[data-learning-lab="physics-kubo-response"] .kr-primary{background:var(--kr-blue);border-color:var(--kr-blue);color:#fff;font-weight:700}',
    '[data-learning-lab="physics-kubo-response"] .kr-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}',
    '[data-learning-lab="physics-kubo-response"] .kr-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end;margin:14px 0}',
    '[data-learning-lab="physics-kubo-response"] .kr-control{min-width:0}',
    '[data-learning-lab="physics-kubo-response"] .kr-control label{display:grid;gap:5px;font-weight:700}',
    '[data-learning-lab="physics-kubo-response"] .kr-control output{font-weight:400;color:var(--fg-soft,currentColor);font-variant-numeric:tabular-nums}',
    '[data-learning-lab="physics-kubo-response"] input[type="range"]{width:100%;accent-color:var(--kr-blue)}',
    '[data-learning-lab="physics-kubo-response"] .kr-result[hidden]{display:none}',
    '[data-learning-lab="physics-kubo-response"] .kr-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}',
    '[data-learning-lab="physics-kubo-response"] .kr-metric{padding:8px;border-top:3px solid var(--kr-blue);background:var(--bg,transparent);min-width:0}',
    '[data-learning-lab="physics-kubo-response"] .kr-metric:nth-child(2){border-top-color:var(--kr-red)}',
    '[data-learning-lab="physics-kubo-response"] .kr-metric:nth-child(3){border-top-color:var(--kr-gold)}',
    '[data-learning-lab="physics-kubo-response"] .kr-metric:nth-child(4){border-top-color:var(--kr-green)}',
    '[data-learning-lab="physics-kubo-response"] .kr-metric span{display:block;font-size:12px;color:var(--fg-soft,currentColor)}',
    '[data-learning-lab="physics-kubo-response"] .kr-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
    '[data-learning-lab="physics-kubo-response"] .kr-frame{border:1px solid var(--border,#b8b8b8);padding:6px;min-width:0;overflow:hidden}',
    '[data-learning-lab="physics-kubo-response"] .kr-svg{display:block;width:100%;height:auto;color:var(--fg,currentColor)}',
    '[data-learning-lab="physics-kubo-response"] .kr-svg-compact{display:none!important}',
    '[data-learning-lab="physics-kubo-response"] .kr-svg text{font-family:inherit;fill:currentColor;letter-spacing:0}',
    '[data-learning-lab="physics-kubo-response"] .kr-note{margin:12px 0;padding:10px 12px;border-left:3px solid var(--kr-green);font-size:13px;line-height:1.7}',
    '[data-learning-lab="physics-kubo-response"] .kr-status{min-height:1.5em;color:var(--fg-soft,currentColor);font-size:13px}',
    '@media(max-width:760px){[data-learning-lab="physics-kubo-response"] .kr-controls{grid-template-columns:1fr 1fr}[data-learning-lab="physics-kubo-response"] .kr-metrics{grid-template-columns:1fr 1fr}}',
    '@media(max-width:600px){[data-learning-lab="physics-kubo-response"] .kr-svg-wide{display:none!important}[data-learning-lab="physics-kubo-response"] .kr-svg-compact{display:block!important}}',
    '@media(max-width:460px){[data-learning-lab="physics-kubo-response"] .kr-controls{grid-template-columns:1fr}[data-learning-lab="physics-kubo-response"] .kr-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="physics-kubo-response"] .kr-actions button{width:100%}}'
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

  function causalKernel(time, sigma0, tau) {
    var t = Number(time);
    var width = Math.max(1e-9, Number(tau));
    if (!isFinite(t) || t < 0) return 0;
    return Number(sigma0) / width * Math.exp(-t / width);
  }

  function stepResponse(time, field, sigma0, tau) {
    var t = Number(time);
    if (!isFinite(t) || t < 0) return 0;
    return Number(sigma0) * Number(field) * (1 - Math.exp(-t / Math.max(1e-9, Number(tau))));
  }

  function complexConductivity(omega, sigma0, tau) {
    var reduced = Number(omega) * Number(tau);
    var denominator = 1 + reduced * reduced;
    var real = Number(sigma0) / denominator;
    var imaginary = Number(sigma0) * reduced / denominator;
    return {
      real: real,
      imaginary: imaginary,
      magnitude: Math.sqrt(real * real + imaginary * imaginary),
      phase: Math.atan2(imaginary, real) * 180 / PI,
      reducedFrequency: reduced
    };
  }

  function evaluate(options) {
    var settings = options || {};
    var sigma0 = 1;
    var tau = clamp(finiteNumber(settings.tau, 2), 0.5, 4);
    var omega = clamp(finiteNumber(settings.omega, 0.5), 0.1, 2);
    var field = clamp(finiteNumber(settings.field, 1), 0.5, 2);
    var frequency = complexConductivity(omega, sigma0, tau);
    return {
      sigma0: sigma0,
      tau: tau,
      omega: omega,
      field: field,
      frequency: frequency,
      stepAtTau: stepResponse(tau, field, sigma0, tau),
      kernelAtTau: causalKernel(tau, sigma0, tau)
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
    var width = compact ? 360 : 790;
    var height = compact ? 690 : 410;
    var left = compact ? { x: 44, y: 50, w: 272, h: 210 } : { x: 52, y: 55, w: 315, h: 235 };
    var right = compact ? { x: 44, y: 380, w: 272, h: 210 } : { x: 438, y: 55, w: 292, h: 235 };
    var tMin = TIME_MIN;
    var tMax = TIME_MAX;
    var currentMax = CURRENT_MAX * model.sigma0;
    var stepPoints = [];
    var i;
    for (i = 0; i <= 140; i += 1) {
      var time = tMin + (tMax - tMin) * i / 140;
      var response = stepResponse(time, model.field, model.sigma0, model.tau);
      stepPoints.push([left.x + left.w * i / 140, left.y + left.h - left.h * response / currentMax]);
    }
    var realPoints = [];
    var imaginaryPoints = [];
    var frequencyMax = FREQUENCY_MAX;
    for (i = 0; i <= 140; i += 1) {
      var reduced = frequencyMax * i / 140;
      var denominator = 1 + reduced * reduced;
      realPoints.push([right.x + right.w * i / 140, right.y + right.h - right.h * (1 / denominator)]);
      imaginaryPoints.push([right.x + right.w * i / 140, right.y + right.h - right.h * (reduced / denominator)]);
    }
    var zeroX = left.x + left.w * (0 - tMin) / (tMax - tMin);
    var selectedX = right.x + right.w * model.frequency.reducedFrequency / frequencyMax;
    var selectedLabelX = selectedX > right.x + right.w - 55 ? selectedX - 55 : selectedX + 5;
    var grid = "";
    function panelGrid(panel) {
      var output = "";
      [0, 0.25, 0.5, 0.75, 1].forEach(function (fraction) {
        var x = panel.x + panel.w * fraction;
        output += '<line x1="' + x.toFixed(1) + '" y1="' + panel.y + '" x2="' + x.toFixed(1) + '" y2="' + (panel.y + panel.h) + '" class="kr-grid"/>';
      });
      [0, 0.5, 1].forEach(function (fraction) {
        var y = panel.y + panel.h - panel.h * fraction;
        output += '<line x1="' + panel.x + '" y1="' + y.toFixed(1) + '" x2="' + (panel.x + panel.w) + '" y2="' + y.toFixed(1) + '" class="kr-grid"/>';
      });
      return output;
    }
    grid += panelGrid(left) + panelGrid(right);
    var timeTicks = '<text x="' + left.x + '" y="' + (left.y + left.h + 18) + '" text-anchor="start">−4</text><text x="' + (zeroX) + '" y="' + (left.y + left.h + 18) + '" text-anchor="middle">0</text><text x="' + (left.x + left.w * 12 / 20).toFixed(1) + '" y="' + (left.y + left.h + 18) + '" text-anchor="middle">8</text><text x="' + (left.x + left.w) + '" y="' + (left.y + left.h + 18) + '" text-anchor="end">16</text>';
    var frequencyTicks = '<text x="' + right.x + '" y="' + (right.y + right.h + 18) + '" text-anchor="start">0</text><text x="' + (right.x + right.w / 2) + '" y="' + (right.y + right.h + 18) + '" text-anchor="middle">4.5</text><text x="' + (right.x + right.w) + '" y="' + (right.y + right.h + 18) + '" text-anchor="end">9</text>';
    var footer = compact
      ? '<text x="44" y="650" font-size="11">固定物理时间轴保留 t&lt;0 的因果零响应</text><text x="44" y="672" font-size="11">左图是绝对 J(t)；E₀ 改变会改变曲线高度</text>'
      : '<text x="52" y="395" font-size="11">固定物理时间轴保留 t&lt;0 零区；左图为绝对 J(t)，右图为 σ/σ₀</text>';
    return '<svg class="kr-svg ' + (compact ? 'kr-svg-compact' : 'kr-svg-wide') + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="左侧为保留 t&lt;0 因果零区的绝对阶跃电流 J(t)，右侧为归一化复电导的实部与虚部随无量纲频率变化">' +
      '<style>.kr-grid{stroke:currentColor;stroke-opacity:.16;stroke-width:1}.kr-axis{stroke:currentColor;stroke-width:1.2}.kr-step{fill:none;stroke:#2f6f9f;stroke-width:3}.kr-real{fill:none;stroke:#39734d;stroke-width:3}.kr-imag{fill:none;stroke:#b3483b;stroke-width:2.5}.kr-marker{stroke:#a36a16;stroke-width:1.8;stroke-dasharray:5 4}.kr-zero{stroke:#b3483b;stroke-width:1.8;stroke-dasharray:5 4}</style>' +
      grid +
      '<line x1="' + left.x + '" y1="' + (left.y + left.h) + '" x2="' + (left.x + left.w) + '" y2="' + (left.y + left.h) + '" class="kr-axis"/><line x1="' + left.x + '" y1="' + left.y + '" x2="' + left.x + '" y2="' + (left.y + left.h) + '" class="kr-axis"/>' +
      '<line x1="' + right.x + '" y1="' + (right.y + right.h) + '" x2="' + (right.x + right.w) + '" y2="' + (right.y + right.h) + '" class="kr-axis"/><line x1="' + right.x + '" y1="' + right.y + '" x2="' + right.x + '" y2="' + (right.y + right.h) + '" class="kr-axis"/>' +
      '<path d="' + pathFrom(stepPoints) + '" class="kr-step"/><path d="' + pathFrom(realPoints) + '" class="kr-real"/><path d="' + pathFrom(imaginaryPoints) + '" class="kr-imag"/>' +
      '<line x1="' + zeroX.toFixed(1) + '" y1="' + left.y + '" x2="' + zeroX.toFixed(1) + '" y2="' + (left.y + left.h) + '" class="kr-zero"/><line x1="' + selectedX.toFixed(1) + '" y1="' + right.y + '" x2="' + selectedX.toFixed(1) + '" y2="' + (right.y + right.h) + '" class="kr-marker"/>' +
      '<text x="' + left.x + '" y="' + (compact ? 24 : 28) + '" font-weight="700">阶跃响应 J(t)</text><text x="' + right.x + '" y="' + (compact ? 354 : 28) + '" font-weight="700">复电导 / σ₀</text>' +
      timeTicks + frequencyTicks +
      '<text x="' + (left.x + left.w / 2) + '" y="' + (left.y + left.h + 38) + '" text-anchor="middle">t / fs</text><text x="' + (right.x + right.w / 2) + '" y="' + (right.y + right.h + 38) + '" text-anchor="middle">ωτ</text>' +
      '<text x="' + (zeroX + 5).toFixed(1) + '" y="' + (left.y + 22) + '" fill="#b3483b">t=0</text><text x="' + (left.x + 6) + '" y="' + (left.y + 22) + '" fill="#2f6f9f">E₀=' + format(model.field, 1) + '</text>' +
      '<text x="' + (right.x + 6) + '" y="' + (right.y + 22) + '" fill="#39734d">Re σ</text><text x="' + (right.x + 70) + '" y="' + (right.y + 22) + '" fill="#b3483b">Im σ</text>' +
      '<text x="' + selectedLabelX.toFixed(1) + '" y="' + (right.y + 42) + '" fill="#a36a16">当前 ωτ</text>' +
      '<text x="' + (left.x - 5) + '" y="' + (left.y + 4) + '" text-anchor="end">' + format(currentMax, 1) + '</text><text x="' + (left.x - 5) + '" y="' + (left.y + left.h) + '" text-anchor="end">0</text><text x="' + (right.x - 5) + '" y="' + (right.y + 4) + '" text-anchor="end">1</text><text x="' + (right.x - 5) + '" y="' + (right.y + right.h) + '" text-anchor="end">0</text>' +
      footer +
      '</svg>';
  }

  function chart(model) {
    return '<div class="kr-chart">' + chartSvg(model, false) + chartSvg(model, true) + '</div>';
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    host.document.head.appendChild(style);
  }

  function resultHtml(model) {
    return '<div class="kr-metrics">' +
      '<div class="kr-metric"><span>J(τ)</span><strong>' + format(model.stepAtTau, 5) + '</strong></div>' +
      '<div class="kr-metric"><span>Re σ / σ₀</span><strong>' + format(model.frequency.real, 4) + '</strong></div>' +
      '<div class="kr-metric"><span>Im σ / σ₀</span><strong>' + format(model.frequency.imaginary, 4) + '</strong></div>' +
      '<div class="kr-metric"><span>相位角</span><strong>' + format(model.frequency.phase, 2) + '°</strong></div>' +
      '</div><div class="kr-frame">' + chart(model) + '</div>' +
      '<div class="kr-note">左图把阶跃场写成时间卷积：t&lt;0 没有响应，且绝对电流 J(t)=σ₀E₀(1−e⁻ᵗ/τ)θ(t)，所以改变 E₀ 会改变路径高度。右图把同一个核 Fourier 变换；Re σ 是耗散部，Im σ 是色散/储能部。这里使用 σ(ω)=σ₀/(1−iωτ) 的 eⁱωᵗ 变换约定，数值实验只检验因果 toy 的内部一致性。</div>' +
      '<p class="kr-status" aria-live="polite">读数已更新：E₀ = ' + format(model.field, 2) + '，J(τ) = ' + format(model.stepAtTau, 4) + '；ωτ = ' + format(model.frequency.reducedFrequency, 3) + '，|σ|/σ₀ = ' + format(model.frequency.magnitude, 4) + '。</p>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="kr-gate"><strong>揭示前预测</strong>' +
      '<label>t&lt;0 时，retarded 电流响应怎样？<select data-role="causal-prediction"><option value="">请选择</option><option value="correct">严格为 0</option><option value="wrong-memory">保持上一次响应</option><option value="wrong-nonzero">可以任意非零</option></select></label>' +
      '<label>ωτ=1 时，Re σ 与 Im σ 的关系？<select data-role="crossing-prediction"><option value="">请选择</option><option value="correct">大小相等，都是 σ₀/2</option><option value="wrong-real">Re σ=σ₀，Im σ=0</option><option value="wrong-double">Im σ 是 Re σ 的两倍</option></select></label>' +
      '<label>平衡相关函数能否定义上直接替代响应？<select data-role="fdt-prediction"><option value="">请选择</option><option value="correct">不能；FDT 需要额外平衡条件</option><option value="wrong-yes">能，二者就是同一个量</option><option value="wrong-temperature">能，只要调一个有效温度</option></select></label>' +
      '</div>' +
      '<div class="kr-actions"><button class="kr-primary" type="button" data-role="reveal">提交预测并显示响应</button><button type="button" data-role="reset">重置</button></div>' +
      '<p class="kr-status" data-role="gate-status" aria-live="polite">先完成三项预测。</p>' +
      '<div class="kr-controls">' +
      '<div class="kr-control"><label>弛豫时间 τ <output data-role="tau-output">2 fs</output><input data-role="tau" type="range" min="0.5" max="4" step="0.25" value="2"></label></div>' +
      '<div class="kr-control"><label>角频率 ω <output data-role="omega-output">0.5 fs⁻¹</output><input data-role="omega" type="range" min="0.1" max="2" step="0.1" value="0.5"></label></div>' +
      '<div class="kr-control"><label>阶跃场 E₀ <output data-role="field-output">1</output><input data-role="field" type="range" min="0.5" max="2" step="0.5" value="1"></label></div>' +
      '</div><div class="kr-result" data-role="result" hidden></div>';

    var tau = root.querySelector('[data-role="tau"]');
    var omega = root.querySelector('[data-role="omega"]');
    var field = root.querySelector('[data-role="field"]');
    var result = root.querySelector('[data-role="result"]');
    var gateStatus = root.querySelector('[data-role="gate-status"]');
    var revealed = false;

    function currentModel() {
      return evaluate({ tau: tau.value, omega: omega.value, field: field.value });
    }

    function updateOutputs() {
      root.querySelector('[data-role="tau-output"]').textContent = format(Number(tau.value), 2) + " fs";
      root.querySelector('[data-role="omega-output"]').textContent = format(Number(omega.value), 2) + " fs⁻¹";
      root.querySelector('[data-role="field-output"]').textContent = format(Number(field.value), 1);
      if (revealed) result.innerHTML = resultHtml(currentModel());
    }

    [tau, omega, field].forEach(function (input) { input.addEventListener("input", updateOutputs); });
    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      var complete = root.querySelector('[data-role="causal-prediction"]').value === "correct" &&
        root.querySelector('[data-role="crossing-prediction"]').value === "correct" &&
        root.querySelector('[data-role="fdt-prediction"]').value === "correct";
      if (!complete) {
        gateStatus.textContent = "预测还没有闭合；请分别检查时间箭头、ωτ=1 和 FDT 的适用条件。";
        return;
      }
      revealed = true;
      result.hidden = false;
      result.innerHTML = resultHtml(currentModel());
      gateStatus.textContent = "预测门通过：现在可以把时间响应和频域响应对照起来。";
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      root.querySelectorAll("select").forEach(function (select) { select.value = ""; });
      tau.value = "2";
      omega.value = "0.5";
      field.value = "1";
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
    var model = evaluate({ tau: 2, omega: 0.5, field: 1 });
    assert(causalKernel(-1, 1, 2) === 0, "causal kernel boundary"); checks += 1;
    assert(stepResponse(-1, 1, 1, 2) === 0, "step response boundary"); checks += 1;
    assert(near(stepResponse(2, 1, 1, 2), 1 - Math.exp(-1), 1e-12), "step at tau"); checks += 1;
    assert(near(model.frequency.reducedFrequency, 1, 1e-12), "reduced frequency"); checks += 1;
    assert(near(model.frequency.real, 0.5, 1e-12), "real part at crossing"); checks += 1;
    assert(near(model.frequency.imaginary, 0.5, 1e-12), "imaginary part at crossing"); checks += 1;
    assert(near(model.frequency.magnitude, 1 / Math.sqrt(2), 1e-12), "magnitude"); checks += 1;
    assert(near(model.frequency.phase, 45, 1e-12), "phase"); checks += 1;
    assert(near(causalKernel(2, 1, 2), 0.5 * Math.exp(-1), 1e-12), "kernel at tau"); checks += 1;
    assert(TIME_MIN < 0 && TIME_MAX >= 4 * 4, "fixed physical time domain"); checks += 1;
    var doubledField = evaluate({ tau: 2, omega: 0.5, field: 2 });
    assert(near(doubledField.stepAtTau, 2 * model.stepAtTau, 1e-12), "absolute E0 response"); checks += 1;
    assert(stepResponse(2, 2, 1, 2) !== stepResponse(2, 1, 1, 2), "E0 changes current path"); checks += 1;
    assert(chart(model) !== chart(doubledField), "E0 changes rendered current path"); checks += 1;
    var rendered = chart(model);
    assert(rendered.indexOf("J(t)") !== -1 && rendered.indexOf("E₀=1") !== -1, "absolute current semantic labels"); checks += 1;
    assert(rendered.indexOf("kr-svg-compact") !== -1 && rendered.indexOf("t&lt;0") !== -1, "causal region and mobile chart labels"); checks += 1;
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest };
});
