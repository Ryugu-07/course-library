(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-greens-quasiparticle", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-greens-quasiparticle self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-greens-quasiparticle self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-physics-greens-quasiparticle-styles";
  var HBAR = 0.6582;
  var PI = Math.PI;
  var ENERGY_MIN = -10;
  var ENERGY_MAX = 10;
  var TIME_MIN = -1;
  var TIME_MAX = 6;
  var STYLE_TEXT = [
    '[data-learning-lab="physics-greens-quasiparticle"]{--gp-blue:#2f6f9f;--gp-red:#b3483b;--gp-gold:#a36a16;--gp-green:#39734d;color:var(--fg,currentColor);line-height:1.55;max-width:100%;min-width:0;overflow-wrap:anywhere}',
    '[data-learning-lab="physics-greens-quasiparticle"] *{box-sizing:border-box}',
    '[data-learning-lab="physics-greens-quasiparticle"] h3{margin:0;font-size:1.16rem;letter-spacing:0}',
    '[data-learning-lab="physics-greens-quasiparticle"] p{margin:.65rem 0}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--gp-gold);background:var(--bg,transparent)}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-gate label{display:grid;gap:5px;margin:8px 0;font-weight:700}',
    '[data-learning-lab="physics-greens-quasiparticle"] select,[data-learning-lab="physics-greens-quasiparticle"] input,[data-learning-lab="physics-greens-quasiparticle"] button{font:inherit;min-height:44px}',
    '[data-learning-lab="physics-greens-quasiparticle"] select{width:100%;padding:7px 9px;color:inherit;background:var(--bg,transparent);border:1px solid var(--border,#b8b8b8)}',
    '[data-learning-lab="physics-greens-quasiparticle"] button{padding:8px 13px;border:1px solid var(--border,#b8b8b8);background:var(--bg,transparent);color:inherit;cursor:pointer;border-radius:5px}',
    '[data-learning-lab="physics-greens-quasiparticle"] button:hover{border-color:var(--gp-blue)}',
    '[data-learning-lab="physics-greens-quasiparticle"] button:focus-visible,[data-learning-lab="physics-greens-quasiparticle"] select:focus-visible,[data-learning-lab="physics-greens-quasiparticle"] input:focus-visible{outline:2px solid var(--gp-blue);outline-offset:2px}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-primary{background:var(--gp-blue);border-color:var(--gp-blue);color:#fff;font-weight:700}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end;margin:14px 0}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-control{min-width:0}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-control label{display:grid;gap:5px;font-weight:700}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-control output{font-weight:400;color:var(--fg-soft,currentColor);font-variant-numeric:tabular-nums}',
    '[data-learning-lab="physics-greens-quasiparticle"] input[type="range"]{width:100%;accent-color:var(--gp-blue)}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-result[hidden]{display:none}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-metric{padding:8px;border-top:3px solid var(--gp-blue);background:var(--bg,transparent);min-width:0}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-metric:nth-child(2){border-top-color:var(--gp-red)}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-metric:nth-child(3){border-top-color:var(--gp-gold)}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-metric:nth-child(4){border-top-color:var(--gp-green)}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-metric span{display:block;font-size:12px;color:var(--fg-soft,currentColor)}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-frame{border:1px solid var(--border,#b8b8b8);padding:6px;min-width:0;overflow:hidden}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-svg{display:block;width:100%;height:auto;color:var(--fg,currentColor)}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-svg-compact{display:none!important}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-svg text{font-family:inherit;fill:currentColor;letter-spacing:0}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-note{margin:12px 0;padding:10px 12px;border-left:3px solid var(--gp-green);font-size:13px;line-height:1.7}',
    '[data-learning-lab="physics-greens-quasiparticle"] .gp-status{min-height:1.5em;color:var(--fg-soft,currentColor);font-size:13px}',
    '@media(max-width:760px){[data-learning-lab="physics-greens-quasiparticle"] .gp-controls{grid-template-columns:1fr 1fr}[data-learning-lab="physics-greens-quasiparticle"] .gp-metrics{grid-template-columns:1fr 1fr}}',
    '@media(max-width:600px){[data-learning-lab="physics-greens-quasiparticle"] .gp-svg-wide{display:none!important}[data-learning-lab="physics-greens-quasiparticle"] .gp-svg-compact{display:block!important}}',
    '@media(max-width:460px){[data-learning-lab="physics-greens-quasiparticle"] .gp-controls{grid-template-columns:1fr}[data-learning-lab="physics-greens-quasiparticle"] .gp-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="physics-greens-quasiparticle"] .gp-actions button{width:100%}}'
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

  function lorentzian(energy, center, gamma) {
    var width = Math.max(1e-9, Number(gamma));
    var difference = Number(energy) - Number(center);
    return width / (PI * (difference * difference + width * width));
  }

  function retardedAmplitude(time, center, gamma) {
    var t = Number(time);
    if (!isFinite(t) || t < 0) return 0;
    return Math.exp(-Math.max(0, Number(gamma)) * t / HBAR);
  }

  function evaluate(options) {
    var settings = options || {};
    var center = clamp(finiteNumber(settings.center, 1), -4, 4);
    var gamma = clamp(finiteNumber(settings.gamma, 2), 0.5, 5);
    var detuning = clamp(finiteNumber(settings.detuning, 4), 0, 6);
    var peak = lorentzian(center, center, gamma);
    return {
      center: center,
      gamma: gamma,
      detuning: detuning,
      peak: peak,
      fwhm: 2 * gamma,
      amplitudeLifetime: HBAR / gamma,
      populationLifetime: HBAR / (2 * gamma),
      probeEnergy: center + detuning,
      probeValue: lorentzian(center + detuning, center, gamma),
      probeRatio: lorentzian(center + detuning, center, gamma) / peak,
      spectralArea: 1
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
    var width = compact ? 360 : 780;
    var height = compact ? 690 : 390;
    var left = compact ? { x: 44, y: 50, w: 272, h: 210 } : { x: 50, y: 55, w: 315, h: 235 };
    var right = compact ? { x: 44, y: 380, w: 272, h: 210 } : { x: 425, y: 55, w: 305, h: 235 };
    var energyMin = ENERGY_MIN;
    var energyMax = ENERGY_MAX;
    var peak = model.peak;
    var spectralPoints = [];
    var i;
    for (i = 0; i <= 120; i += 1) {
      var energy = energyMin + (energyMax - energyMin) * i / 120;
      spectralPoints.push([
        left.x + left.w * i / 120,
        left.y + left.h - left.h * lorentzian(energy, model.center, model.gamma) / peak
      ]);
    }
    var tMin = TIME_MIN;
    var tMax = TIME_MAX;
    var amplitudePoints = [];
    var populationPoints = [];
    for (i = 0; i <= 120; i += 1) {
      var time = tMin + (tMax - tMin) * i / 120;
      amplitudePoints.push([right.x + right.w * i / 120, right.y + right.h - right.h * retardedAmplitude(time, model.center, model.gamma)]);
      populationPoints.push([right.x + right.w * i / 120, right.y + right.h - right.h * Math.pow(retardedAmplitude(time, model.center, model.gamma), 2)]);
    }
    var energyMarkerX = left.x + left.w * (model.probeEnergy - energyMin) / (energyMax - energyMin);
    var timeMarkerX = right.x + right.w * (model.populationLifetime - tMin) / (tMax - tMin);
    var zeroTimeX = right.x + right.w * (0 - tMin) / (tMax - tMin);
    var energyMarkerLabelX = energyMarkerX > left.x + left.w - 76 ? energyMarkerX - 76 : energyMarkerX + 5;
    var timeMarkerLabelX = timeMarkerX > right.x + right.w - 42 ? timeMarkerX - 42 : timeMarkerX + 5;
    var xGrid = [0, 0.25, 0.5, 0.75, 1];
    var grid = "";
    xGrid.forEach(function (fraction) {
      var lx = left.x + left.w * fraction;
      var rx = right.x + right.w * fraction;
      grid += '<line x1="' + lx.toFixed(1) + '" y1="' + left.y + '" x2="' + lx.toFixed(1) + '" y2="' + (left.y + left.h) + '" class="gp-grid"/>';
      grid += '<line x1="' + rx.toFixed(1) + '" y1="' + right.y + '" x2="' + rx.toFixed(1) + '" y2="' + (right.y + right.h) + '" class="gp-grid"/>';
    });
    [0, 0.5, 1].forEach(function (fraction) {
      var ly = left.y + left.h - left.h * fraction;
      var ry = right.y + right.h - right.h * fraction;
      grid += '<line x1="' + left.x + '" y1="' + ly.toFixed(1) + '" x2="' + (left.x + left.w) + '" y2="' + ly.toFixed(1) + '" class="gp-grid"/>';
      grid += '<line x1="' + right.x + '" y1="' + ry.toFixed(1) + '" x2="' + (right.x + right.w) + '" y2="' + ry.toFixed(1) + '" class="gp-grid"/>';
    });
    var energyTicks = '<text x="' + left.x + '" y="' + (left.y + left.h + 18) + '" text-anchor="start">−10</text>' +
      '<text x="' + (left.x + left.w / 2) + '" y="' + (left.y + left.h + 18) + '" text-anchor="middle">0</text>' +
      '<text x="' + (left.x + left.w) + '" y="' + (left.y + left.h + 18) + '" text-anchor="end">10</text>';
    var timeTicks = '<text x="' + right.x + '" y="' + (right.y + right.h + 18) + '" text-anchor="start">−1</text>' +
      '<text x="' + (right.x + right.w / 7).toFixed(1) + '" y="' + (right.y + right.h + 18) + '" text-anchor="middle">0</text>' +
      '<text x="' + (right.x + right.w * 4 / 7).toFixed(1) + '" y="' + (right.y + right.h + 18) + '" text-anchor="middle">3</text>' +
      '<text x="' + (right.x + right.w) + '" y="' + (right.y + right.h + 18) + '" text-anchor="end">6</text>';
    var footer = compact
      ? '<text x="44" y="650" font-size="11">固定物理轴：t&lt;0 的 retarded 响应为 0</text><text x="44" y="672" font-size="11">峰宽改变路径；探测偏移始终在能量轴内</text>'
      : '<text x="50" y="375" font-size="11">固定物理轴包含 t&lt;0 因果零区；峰面积按本单 pole 归一为 1</text>';
    return '<svg class="gp-svg ' + (compact ? 'gp-svg-compact' : 'gp-svg-wide') + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="左侧为固定能量轴上的归一化谱函数和探测偏移，右侧为含 t&lt;0 因果零区的 retarded 振幅和概率包络">' +
      '<style>.gp-grid{stroke:currentColor;stroke-opacity:.16;stroke-width:1}.gp-axis{stroke:currentColor;stroke-width:1.2}.gp-causal{fill:#39734d;fill-opacity:.08}.gp-spectrum{fill:none;stroke:#2f6f9f;stroke-width:3}.gp-half{stroke:#a36a16;stroke-width:1.5;stroke-dasharray:5 4}.gp-marker{stroke:#b3483b;stroke-width:2;stroke-dasharray:4 4}.gp-amplitude{fill:none;stroke:#39734d;stroke-width:3}.gp-population{fill:none;stroke:#b3483b;stroke-width:2.5}</style>' +
      grid +
      '<line x1="' + left.x + '" y1="' + (left.y + left.h) + '" x2="' + (left.x + left.w) + '" y2="' + (left.y + left.h) + '" class="gp-axis"/><line x1="' + left.x + '" y1="' + left.y + '" x2="' + left.x + '" y2="' + (left.y + left.h) + '" class="gp-axis"/>' +
      '<line x1="' + right.x + '" y1="' + (right.y + right.h) + '" x2="' + (right.x + right.w) + '" y2="' + (right.y + right.h) + '" class="gp-axis"/><line x1="' + right.x + '" y1="' + right.y + '" x2="' + right.x + '" y2="' + (right.y + right.h) + '" class="gp-axis"/>' +
      '<path d="' + pathFrom(spectralPoints) + '" class="gp-spectrum"/>' +
      '<line x1="' + left.x + '" y1="' + (left.y + left.h / 2) + '" x2="' + (left.x + left.w) + '" y2="' + (left.y + left.h / 2) + '" class="gp-half"/>' +
      '<line x1="' + energyMarkerX.toFixed(1) + '" y1="' + left.y + '" x2="' + energyMarkerX.toFixed(1) + '" y2="' + (left.y + left.h) + '" class="gp-marker"/>' +
      '<rect x="' + right.x + '" y="' + right.y + '" width="' + (zeroTimeX - right.x).toFixed(1) + '" height="' + right.h + '" class="gp-causal"/>' +
      '<path d="' + pathFrom(amplitudePoints) + '" class="gp-amplitude"/><path d="' + pathFrom(populationPoints) + '" class="gp-population"/>' +
      '<line x1="' + timeMarkerX.toFixed(1) + '" y1="' + right.y + '" x2="' + timeMarkerX.toFixed(1) + '" y2="' + (right.y + right.h) + '" class="gp-marker"/>' +
      '<text x="' + left.x + '" y="' + (compact ? 24 : 28) + '" font-weight="700">谱函数 A(E)</text><text x="' + right.x + '" y="' + (compact ? 354 : 28) + '" font-weight="700">retarded 时间包络</text>' +
      energyTicks + timeTicks +
      '<text x="' + (left.x + left.w / 2) + '" y="' + (left.y + left.h + 38) + '" text-anchor="middle">E / meV</text><text x="' + (right.x + right.w / 2) + '" y="' + (right.y + right.h + 38) + '" text-anchor="middle">t / ps</text>' +
      '<text x="' + (left.x + 5) + '" y="' + (left.y + left.h / 2 - 6) + '" fill="#a36a16">半高</text>' +
      '<text x="' + energyMarkerLabelX.toFixed(1) + '" y="' + (left.y + 22) + '" fill="#b3483b">探测偏移 δE</text>' +
      '<text x="' + (right.x + 6) + '" y="' + (right.y + 22) + '" fill="#39734d">振幅</text><text x="' + (right.x + 74) + '" y="' + (right.y + 22) + '" fill="#b3483b">概率</text>' +
      '<text x="' + timeMarkerLabelX.toFixed(1) + '" y="' + (right.y + 44) + '" fill="#b3483b">τpop</text>' +
      '<text x="' + (right.x + 6) + '" y="' + (right.y + 64) + '" fill="#39734d">t&lt;0：0</text>' +
      '<text x="' + (left.x + 5) + '" y="' + (left.y + 20) + '" font-size="11">A/Amax</text>' +
      footer +
      '</svg>';
  }

  function chart(model) {
    return '<div class="gp-chart">' + chartSvg(model, false) + chartSvg(model, true) + '</div>';
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    host.document.head.appendChild(style);
  }

  function resultHtml(model) {
    return '<div class="gp-metrics">' +
      '<div class="gp-metric"><span>峰顶 A(ε)</span><strong>' + format(model.peak, 5) + ' meV⁻¹</strong></div>' +
      '<div class="gp-metric"><span>FWHM</span><strong>' + format(model.fwhm, 3) + ' meV</strong></div>' +
      '<div class="gp-metric"><span>振幅时间 τamp</span><strong>' + format(model.amplitudeLifetime, 4) + ' ps</strong></div>' +
      '<div class="gp-metric"><span>概率时间 τpop</span><strong>' + format(model.populationLifetime, 4) + ' ps</strong></div>' +
      '</div><div class="gp-frame">' + chart(model) + '</div>' +
      '<div class="gp-note">Γ 是能量半宽：它加大时峰更宽、峰顶更低，但单 pole 的谱权重仍为 1。右图把振幅 e^(−Γt/ħ) 与概率包络的平方分开画；虚线以 τpop 为标记。t&lt;0 的 retarded 响应严格为零。</div>' +
      '<p class="gp-status" data-role="live" aria-live="polite">读数已更新：探测能量为 ' + format(model.probeEnergy, 3) + ' meV，A/Amax = ' + format(model.probeRatio, 3) + '。</p>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="gp-gate"><strong>揭示前预测</strong>' +
      '<label>Γ 加倍时，FWHM 与峰顶怎样变化？<select data-role="width-prediction"><option value="">请选择</option><option value="correct">FWHM 加倍，峰顶减半</option><option value="wrong-narrow">FWHM 变窄，峰顶升高</option><option value="wrong-same">两者都不变</option></select></label>' +
      '<label>Γ 改变时，单 pole 谱面积怎样？<select data-role="area-prediction"><option value="">请选择</option><option value="correct">保持 1</option><option value="wrong-height">随峰顶改变</option><option value="wrong-zero">变成 0</option></select></label>' +
      '<label>哪个时间标度更短？<select data-role="time-prediction"><option value="">请选择</option><option value="correct">概率时间 τpop = ħ/(2Γ)</option><option value="wrong-amp">振幅时间 τamp = ħ/Γ</option><option value="wrong-same">两者相同</option></select></label>' +
      '</div>' +
      '<div class="gp-actions"><button class="gp-primary" type="button" data-role="reveal">提交预测并显示谱峰</button><button type="button" data-role="reset">重置</button></div>' +
      '<p class="gp-status" data-role="gate-status" aria-live="polite">先完成三项预测。</p>' +
      '<div class="gp-controls">' +
      '<div class="gp-control"><label>中心能量 ε <output data-role="center-output">1 meV</output><input data-role="center" type="range" min="-4" max="4" step="0.5" value="1"></label></div>' +
      '<div class="gp-control"><label>能量半宽 Γ <output data-role="gamma-output">2 meV</output><input data-role="gamma" type="range" min="0.5" max="5" step="0.5" value="2"></label></div>' +
      '<div class="gp-control"><label>探测偏移 δE <output data-role="detuning-output">4 meV</output><input data-role="detuning" type="range" min="0" max="6" step="0.5" value="4"></label></div>' +
      '</div><div class="gp-result" data-role="result" hidden></div>';

    var center = root.querySelector('[data-role="center"]');
    var gamma = root.querySelector('[data-role="gamma"]');
    var detuning = root.querySelector('[data-role="detuning"]');
    var result = root.querySelector('[data-role="result"]');
    var gateStatus = root.querySelector('[data-role="gate-status"]');
    var revealed = false;

    function currentModel() {
      return evaluate({ center: center.value, gamma: gamma.value, detuning: detuning.value });
    }

    function updateOutputs() {
      root.querySelector('[data-role="center-output"]').textContent = format(Number(center.value), 1) + " meV";
      root.querySelector('[data-role="gamma-output"]').textContent = format(Number(gamma.value), 1) + " meV";
      root.querySelector('[data-role="detuning-output"]').textContent = format(Number(detuning.value), 1) + " meV";
      if (revealed) result.innerHTML = resultHtml(currentModel());
    }

    [center, gamma, detuning].forEach(function (input) { input.addEventListener("input", updateOutputs); });
    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      var complete = root.querySelector('[data-role="width-prediction"]').value === "correct" &&
        root.querySelector('[data-role="area-prediction"]').value === "correct" &&
        root.querySelector('[data-role="time-prediction"]').value === "correct";
      if (!complete) {
        gateStatus.textContent = "还有预测没有答对；先用峰宽、面积和两种时间定义逐项检查。";
        return;
      }
      revealed = true;
      result.hidden = false;
      result.innerHTML = resultHtml(currentModel());
      gateStatus.textContent = "预测门通过：现在可以拖动参数并验证每条结论。";
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      root.querySelectorAll("select").forEach(function (select) { select.value = ""; });
      center.value = "1";
      gamma.value = "2";
      detuning.value = "4";
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
    var model = evaluate({ center: 1, gamma: 2, detuning: 4 });
    assert(near(model.peak, 1 / (2 * PI), 1e-12), "peak value"); checks += 1;
    assert(near(lorentzian(3, 1, 2), model.peak / 2, 1e-12), "half maximum"); checks += 1;
    assert(near(model.fwhm, 4, 1e-12), "FWHM"); checks += 1;
    assert(near(model.amplitudeLifetime, HBAR / 2, 1e-12), "amplitude lifetime"); checks += 1;
    assert(near(model.populationLifetime, HBAR / 4, 1e-12), "population lifetime"); checks += 1;
    assert(near(model.probeRatio, 0.2, 1e-12), "detuned ratio"); checks += 1;
    assert(retardedAmplitude(-0.1, 1, 2) === 0, "retarded boundary"); checks += 1;
    var area = 0;
    var lower = -2000;
    var upper = 2000;
    var steps = 20000;
    var step = (upper - lower) / steps;
    var i;
    for (i = 0; i <= steps; i += 1) {
      var x = lower + i * step;
      var weight = i === 0 || i === steps ? 0.5 : 1;
      area += weight * lorentzian(x, 0, 2) * step;
    }
    assert(Math.abs(area - 1) < 0.002, "spectral sum rule"); checks += 1;
    assert(ENERGY_MIN < ENERGY_MAX && TIME_MIN < 0 && TIME_MAX > 0, "fixed physical energy and time domains"); checks += 1;
    assert(model.probeEnergy >= ENERGY_MIN && model.probeEnergy <= ENERGY_MAX, "probe included in fixed energy domain"); checks += 1;
    assert(evaluate({ center: 4, gamma: 5, detuning: 6 }).probeEnergy === ENERGY_MAX, "maximum probe reaches energy domain"); checks += 1;
    assert(chart(evaluate({ center: 1, gamma: 0.5, detuning: 4 })) !== chart(evaluate({ center: 1, gamma: 5, detuning: 4 })), "fixed-domain Gamma paths change"); checks += 1;
    var rendered = chart(model);
    assert(rendered.indexOf("gp-svg-compact") !== -1 && rendered.indexOf("t&lt;0") !== -1, "causal region and mobile chart labels"); checks += 1;
    assert(rendered.indexOf("探测偏移 δE") !== -1 && rendered.indexOf("E / meV") !== -1, "probe and absolute energy labels"); checks += 1;
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest };
});
