(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-active-matter", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-active-matter self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-active-matter self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-physics-active-matter-styles";
  var STYLE_TEXT = [
    '[data-learning-lab="physics-active-matter"]{--am-blue:#2f6f9f;--am-red:#b3483b;--am-gold:#a36a16;--am-green:#39734d;color:var(--fg,currentColor);line-height:1.55;max-width:100%;min-width:0;overflow-wrap:anywhere}',
    '[data-learning-lab="physics-active-matter"] *{box-sizing:border-box}',
    '[data-learning-lab="physics-active-matter"] h3{margin:0;font-size:1.16rem;letter-spacing:0}',
    '[data-learning-lab="physics-active-matter"] p{margin:.65rem 0}',
    '[data-learning-lab="physics-active-matter"] .am-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--am-gold);background:var(--bg,transparent)}',
    '[data-learning-lab="physics-active-matter"] .am-gate label{display:grid;gap:5px;margin:8px 0;font-weight:700}',
    '[data-learning-lab="physics-active-matter"] select,[data-learning-lab="physics-active-matter"] input,[data-learning-lab="physics-active-matter"] button{font:inherit;min-height:44px}',
    '[data-learning-lab="physics-active-matter"] select{width:100%;padding:7px 9px;color:inherit;background:var(--bg,transparent);border:1px solid var(--border,#b8b8b8)}',
    '[data-learning-lab="physics-active-matter"] button{padding:8px 13px;border:1px solid var(--border,#b8b8b8);background:var(--bg,transparent);color:inherit;cursor:pointer;border-radius:5px}',
    '[data-learning-lab="physics-active-matter"] button:hover{border-color:var(--am-blue)}',
    '[data-learning-lab="physics-active-matter"] button:focus-visible,[data-learning-lab="physics-active-matter"] select:focus-visible,[data-learning-lab="physics-active-matter"] input:focus-visible{outline:2px solid var(--am-blue);outline-offset:2px}',
    '[data-learning-lab="physics-active-matter"] .am-primary{background:var(--am-blue);border-color:var(--am-blue);color:#fff;font-weight:700}',
    '[data-learning-lab="physics-active-matter"] .am-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}',
    '[data-learning-lab="physics-active-matter"] .am-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;align-items:end;margin:14px 0}',
    '[data-learning-lab="physics-active-matter"] .am-control{min-width:0}',
    '[data-learning-lab="physics-active-matter"] .am-control label{display:grid;gap:5px;font-weight:700}',
    '[data-learning-lab="physics-active-matter"] .am-control output{font-weight:400;color:var(--fg-soft,currentColor);font-variant-numeric:tabular-nums}',
    '[data-learning-lab="physics-active-matter"] input[type="range"]{width:100%;accent-color:var(--am-blue)}',
    '[data-learning-lab="physics-active-matter"] .am-result[hidden]{display:none}',
    '[data-learning-lab="physics-active-matter"] .am-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}',
    '[data-learning-lab="physics-active-matter"] .am-metric{padding:8px;border-top:3px solid var(--am-blue);background:var(--bg,transparent);min-width:0}',
    '[data-learning-lab="physics-active-matter"] .am-metric:nth-child(2){border-top-color:var(--am-red)}',
    '[data-learning-lab="physics-active-matter"] .am-metric:nth-child(3){border-top-color:var(--am-gold)}',
    '[data-learning-lab="physics-active-matter"] .am-metric:nth-child(4){border-top-color:var(--am-green)}',
    '[data-learning-lab="physics-active-matter"] .am-metric span{display:block;font-size:12px;color:var(--fg-soft,currentColor)}',
    '[data-learning-lab="physics-active-matter"] .am-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
    '[data-learning-lab="physics-active-matter"] .am-frame{border:1px solid var(--border,#b8b8b8);padding:6px;min-width:0;overflow:hidden}',
    '[data-learning-lab="physics-active-matter"] .am-svg{display:block;width:100%;height:auto;color:var(--fg,currentColor)}',
    '[data-learning-lab="physics-active-matter"] .am-svg-compact{display:none!important}',
    '[data-learning-lab="physics-active-matter"] .am-svg text{font-family:inherit;fill:currentColor;letter-spacing:0}',
    '[data-learning-lab="physics-active-matter"] .am-note{margin:12px 0;padding:10px 12px;border-left:3px solid var(--am-green);font-size:13px;line-height:1.7}',
    '[data-learning-lab="physics-active-matter"] .am-status{min-height:1.5em;color:var(--fg-soft,currentColor);font-size:13px}',
    '@media(max-width:820px){[data-learning-lab="physics-active-matter"] .am-controls{grid-template-columns:1fr 1fr}[data-learning-lab="physics-active-matter"] .am-metrics{grid-template-columns:1fr 1fr}}',
    '@media(max-width:600px){[data-learning-lab="physics-active-matter"] .am-svg-wide{display:none!important}[data-learning-lab="physics-active-matter"] .am-svg-compact{display:block!important}}',
    '@media(max-width:460px){[data-learning-lab="physics-active-matter"] .am-controls{grid-template-columns:1fr}[data-learning-lab="physics-active-matter"] .am-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="physics-active-matter"] .am-actions button{width:100%}}'
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

  function orientationCorrelation(time, rotationalDiffusion) {
    return Math.exp(-Math.max(0, Number(rotationalDiffusion)) * Math.max(0, Number(time)));
  }

  function activeDiffusion(speed, rotationalDiffusion) {
    var dr = Number(rotationalDiffusion);
    if (dr <= 0) return Infinity;
    return Number(speed) * Number(speed) / (2 * dr);
  }

  function meanSquareDisplacement(time, speed, rotationalDiffusion, translationalDiffusion) {
    var t = Math.max(0, Number(time));
    var v0 = Number(speed);
    var dr = Number(rotationalDiffusion);
    var dt = Number(translationalDiffusion);
    var thermal = 4 * dt * t;
    if (dr <= 1e-9) return thermal + v0 * v0 * t * t;
    var active = 2 * v0 * v0 / (dr * dr) * (dr * t - 1 + Math.exp(-dr * t));
    return thermal + active;
  }

  function evaluate(options) {
    var settings = options || {};
    var speed = clamp(finiteNumber(settings.speed, 2), 0, 4);
    var rotationalDiffusion = clamp(finiteNumber(settings.rotationalDiffusion, 0.5), 0.1, 2);
    var translationalDiffusion = clamp(finiteNumber(settings.translationalDiffusion, 0.2), 0.1, 1);
    var probeTime = clamp(finiteNumber(settings.probeTime, 2), 0.5, 10);
    var equilibriumReference = 0.2;
    var active = activeDiffusion(speed, rotationalDiffusion);
    var effective = translationalDiffusion + active;
    return {
      speed: speed,
      rotationalDiffusion: rotationalDiffusion,
      translationalDiffusion: translationalDiffusion,
      probeTime: probeTime,
      equilibriumReference: equilibriumReference,
      persistenceTime: 1 / rotationalDiffusion,
      persistenceLength: speed / rotationalDiffusion,
      activeDiffusion: active,
      effectiveDiffusion: effective,
      probeMsd: meanSquareDisplacement(probeTime, speed, rotationalDiffusion, translationalDiffusion),
      passiveRatio: translationalDiffusion / equilibriumReference,
      activeRatio: effective / equilibriumReference
    };
  }

  function format(value, digits) {
    if (!isFinite(value)) return "∞";
    var places = digits === undefined ? 3 : digits;
    return Number(value).toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function pathFrom(points) {
    return points.map(function (point, index) {
      return (index === 0 ? "M" : "L") + point[0].toFixed(1) + " " + point[1].toFixed(1);
    }).join(" ");
  }

  function chartSvg(model, compact) {
    var width = compact ? 360 : 800;
    var height = compact ? 390 : 385;
    var plot = compact ? { x: 44, y: 50, w: 272, h: 230 } : { x: 56, y: 48, w: 674, h: 255 };
    var timeMax = Math.max(6 * model.persistenceTime, model.probeTime + 1, 6);
    var samples = 160;
    var exact = [];
    var shortDisplay = [];
    var longApprox = [];
    var passive = [];
    var maxValue = 0;
    var i;
    for (i = 0; i <= samples; i += 1) {
      var time = timeMax * i / samples;
      var exactValue = meanSquareDisplacement(time, model.speed, model.rotationalDiffusion, model.translationalDiffusion);
      var shortValue = 4 * model.translationalDiffusion * time + model.speed * model.speed * time * time;
      var longValue = 4 * model.effectiveDiffusion * time;
      var passiveValue = 4 * model.equilibriumReference * time;
      maxValue = Math.max(maxValue, exactValue, longValue, passiveValue);
      exact.push([time, exactValue]);
      if (time <= 2 * model.persistenceTime + 1e-9) shortDisplay.push([time, shortValue]);
      longApprox.push([time, longValue]);
      passive.push([time, passiveValue]);
    }
    shortDisplay.forEach(function (point) { maxValue = Math.max(maxValue, point[1]); });
    function mapPoints(points) {
      return points.map(function (point) {
        return [plot.x + plot.w * point[0] / timeMax, plot.y + plot.h - plot.h * point[1] / Math.max(1e-9, maxValue)];
      });
    }
    var selectedX = plot.x + plot.w * model.probeTime / timeMax;
    var persistenceX = plot.x + plot.w * model.persistenceTime / timeMax;
    var markerBaseY = compact ? plot.y + 112 : plot.y + 42;
    var markerLabels;
    if (Math.abs(model.probeTime - model.persistenceTime) < 1e-9) {
      markerLabels = '<text x="' + (selectedX > plot.x + plot.w - 72 ? selectedX - 72 : selectedX + 5).toFixed(1) + '" y="' + markerBaseY + '" fill="#b3483b">当前 t = τr</text>';
    } else {
      markerLabels = '<text x="' + (selectedX > plot.x + plot.w - 42 ? selectedX - 42 : selectedX + 5).toFixed(1) + '" y="' + markerBaseY + '" fill="#b3483b">当前 t</text><text x="' + (persistenceX > plot.x + plot.w - 30 ? persistenceX - 30 : persistenceX + 5).toFixed(1) + '" y="' + (markerBaseY + 22) + '" fill="#a36a16">τr</text>';
    }
    var grid = "";
    [0, 0.25, 0.5, 0.75, 1].forEach(function (fraction) {
      var x = plot.x + plot.w * fraction;
      grid += '<line x1="' + x.toFixed(1) + '" y1="' + plot.y + '" x2="' + x.toFixed(1) + '" y2="' + (plot.y + plot.h) + '" class="am-grid"/>';
    });
    [0, 0.5, 1].forEach(function (fraction) {
      var y = plot.y + plot.h - plot.h * fraction;
      grid += '<line x1="' + plot.x + '" y1="' + y.toFixed(1) + '" x2="' + (plot.x + plot.w) + '" y2="' + y.toFixed(1) + '" class="am-grid"/>';
    });
    var legend = compact
      ? '<text x="' + (plot.x + 7) + '" y="' + (plot.y + 20) + '" fill="#2f6f9f">精确 ABP</text><text x="' + (plot.x + 135) + '" y="' + (plot.y + 20) + '" fill="#b3483b">短时 t²</text><text x="' + (plot.x + 7) + '" y="' + (plot.y + 42) + '" fill="#a36a16">长时斜率</text><text x="' + (plot.x + 135) + '" y="' + (plot.y + 42) + '" fill="#39734d">平衡参考</text>'
      : '<text x="' + (plot.x + 7) + '" y="' + (plot.y + 20) + '" fill="#2f6f9f">精确 ABP</text><text x="' + (plot.x + 105) + '" y="' + (plot.y + 20) + '" fill="#b3483b">短时 t²</text><text x="' + (plot.x + 184) + '" y="' + (plot.y + 20) + '" fill="#a36a16">长时斜率</text><text x="' + (plot.x + 278) + '" y="' + (plot.y + 20) + '" fill="#39734d">平衡参考</text>';
    var footer = compact
      ? '<text x="44" y="350" font-size="11">主动曲线由短时弹道过渡到长时扩散</text><text x="44" y="372" font-size="11">标记重合时合并为“当前 t = τr”</text>'
      : '<text x="56" y="370" font-size="11">主动曲线在 t≪τr 近似弹道，在 t≫τr 才可读成长时扩散；绿色线仅是被动 FDT 参考</text>';
    return '<svg class="am-svg ' + (compact ? 'am-svg-compact' : 'am-svg-wide') + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="主动布朗粒子的均方位移，与短时弹道、长时扩散和被动平衡参考线比较">' +
      '<style>.am-grid{stroke:currentColor;stroke-opacity:.16;stroke-width:1}.am-axis{stroke:currentColor;stroke-width:1.2}.am-exact{fill:none;stroke:#2f6f9f;stroke-width:3}.am-short{fill:none;stroke:#b3483b;stroke-width:2;stroke-dasharray:7 5}.am-long{fill:none;stroke:#a36a16;stroke-width:2;stroke-dasharray:3 4}.am-passive{fill:none;stroke:#39734d;stroke-width:2}.am-marker{stroke:#b3483b;stroke-width:1.8;stroke-dasharray:5 4}.am-persistence{stroke:#a36a16;stroke-width:1.8;stroke-dasharray:5 4}</style>' +
      grid +
      '<line x1="' + plot.x + '" y1="' + (plot.y + plot.h) + '" x2="' + (plot.x + plot.w) + '" y2="' + (plot.y + plot.h) + '" class="am-axis"/><line x1="' + plot.x + '" y1="' + plot.y + '" x2="' + plot.x + '" y2="' + (plot.y + plot.h) + '" class="am-axis"/>' +
      '<path d="' + pathFrom(mapPoints(exact)) + '" class="am-exact"/><path d="' + pathFrom(mapPoints(shortDisplay)) + '" class="am-short"/><path d="' + pathFrom(mapPoints(longApprox)) + '" class="am-long"/><path d="' + pathFrom(mapPoints(passive)) + '" class="am-passive"/>' +
      '<line x1="' + selectedX.toFixed(1) + '" y1="' + plot.y + '" x2="' + selectedX.toFixed(1) + '" y2="' + (plot.y + plot.h) + '" class="am-marker"/><line x1="' + persistenceX.toFixed(1) + '" y1="' + plot.y + '" x2="' + persistenceX.toFixed(1) + '" y2="' + (plot.y + plot.h) + '" class="am-persistence"/>' +
      '<text x="' + plot.x + '" y="24" font-weight="700">MSD(t) / μm²</text><text x="' + (plot.x + plot.w / 2) + '" y="' + (compact ? 318 : 340) + '" text-anchor="middle">t / s</text>' +
      legend + markerLabels +
      '<text x="' + (plot.x - 5) + '" y="' + (plot.y + 4) + '" text-anchor="end">' + format(maxValue, 1) + '</text><text x="' + (plot.x - 5) + '" y="' + (plot.y + plot.h) + '" text-anchor="end">0</text>' +
      footer +
      '</svg>';
  }

  function chart(model) {
    return '<div class="am-chart">' + chartSvg(model, false) + chartSvg(model, true) + '</div>';
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    host.document.head.appendChild(style);
  }

  function resultHtml(model) {
    return '<div class="am-metrics">' +
      '<div class="am-metric"><span>持久时间 τr</span><strong>' + format(model.persistenceTime, 3) + ' s</strong></div>' +
      '<div class="am-metric"><span>持久长度 ℓp</span><strong>' + format(model.persistenceLength, 3) + ' μm</strong></div>' +
      '<div class="am-metric"><span>主动扩散 Dact</span><strong>' + format(model.activeDiffusion, 3) + ' μm²/s</strong></div>' +
      '<div class="am-metric"><span>读数时 MSD</span><strong>' + format(model.probeMsd, 4) + ' μm²</strong></div>' +
      '</div><div class="am-frame">' + chart(model) + '</div>' +
      '<div class="am-note">蓝线是精确 ABP MSD；短时虚线来自 4Dt+v₀²t²，金色线只表示长时斜率 4Deff，绿色线是被动平衡参考 4D_eqt。v₀=0 且 D_t=D_eq 时才回到这条被动基线；主动体系的 D_eff/D_eq 不能单独解释为一个普适温度。</div>' +
      '<p class="am-status" aria-live="polite">读数已更新：D_eff = ' + format(model.effectiveDiffusion, 4) + ' μm²/s；被动参考比为 ' + format(model.passiveRatio, 3) + '，主动长时比为 ' + format(model.activeRatio, 3) + '。</p>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="am-gate"><strong>揭示前预测</strong>' +
      '<label>短时间的主动 MSD 更接近什么？<select data-role="short-prediction"><option value="">请选择</option><option value="correct">t² 弹道项</option><option value="wrong-linear">t 线性扩散</option><option value="wrong-zero">恒为 0</option></select></label>' +
      '<label>Dr 加倍时，Dact=v₀²/(2Dr) 怎样？<select data-role="dr-prediction"><option value="">请选择</option><option value="correct">减半</option><option value="wrong-double">加倍</option><option value="wrong-same">不变</option></select></label>' +
      '<label>v₀=0 且 D_t=μkBT 时，系统回到被动 Einstein 关系吗？<select data-role="fdt-prediction"><option value="">请选择</option><option value="correct">是，被动 FDT 条件成立</option><option value="wrong-active">不是，任何粒子都不成立</option><option value="wrong-always">是，主动推进也自动满足</option></select></label>' +
      '</div>' +
      '<div class="am-actions"><button class="am-primary" type="button" data-role="reveal">提交预测并显示 MSD</button><button type="button" data-role="reset">重置</button></div>' +
      '<p class="am-status" data-role="gate-status" aria-live="polite">先完成三项预测。</p>' +
      '<div class="am-controls">' +
      '<div class="am-control"><label>推进速度 v₀ <output data-role="speed-output">2 μm/s</output><input data-role="speed" type="range" min="0" max="4" step="0.5" value="2"></label></div>' +
      '<div class="am-control"><label>旋转扩散 Dr <output data-role="dr-output">0.5 s⁻¹</output><input data-role="dr" type="range" min="0.1" max="2" step="0.1" value="0.5"></label></div>' +
      '<div class="am-control"><label>平移扩散 Dt <output data-role="dt-output">0.2 μm²/s</output><input data-role="dt" type="range" min="0.1" max="1" step="0.1" value="0.2"></label></div>' +
      '<div class="am-control"><label>读数时刻 t <output data-role="time-output">2 s</output><input data-role="time" type="range" min="0.5" max="10" step="0.5" value="2"></label></div>' +
      '</div><div class="am-result" data-role="result" hidden></div>';

    var speed = root.querySelector('[data-role="speed"]');
    var dr = root.querySelector('[data-role="dr"]');
    var dt = root.querySelector('[data-role="dt"]');
    var time = root.querySelector('[data-role="time"]');
    var result = root.querySelector('[data-role="result"]');
    var gateStatus = root.querySelector('[data-role="gate-status"]');
    var revealed = false;

    function currentModel() {
      return evaluate({ speed: speed.value, rotationalDiffusion: dr.value, translationalDiffusion: dt.value, probeTime: time.value });
    }

    function updateOutputs() {
      root.querySelector('[data-role="speed-output"]').textContent = format(Number(speed.value), 1) + " μm/s";
      root.querySelector('[data-role="dr-output"]').textContent = format(Number(dr.value), 1) + " s⁻¹";
      root.querySelector('[data-role="dt-output"]').textContent = format(Number(dt.value), 1) + " μm²/s";
      root.querySelector('[data-role="time-output"]').textContent = format(Number(time.value), 1) + " s";
      if (revealed) result.innerHTML = resultHtml(currentModel());
    }

    [speed, dr, dt, time].forEach(function (input) { input.addEventListener("input", updateOutputs); });
    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      var complete = root.querySelector('[data-role="short-prediction"]').value === "correct" &&
        root.querySelector('[data-role="dr-prediction"]').value === "correct" &&
        root.querySelector('[data-role="fdt-prediction"]').value === "correct";
      if (!complete) {
        gateStatus.textContent = "预测还没有闭合；请分别检查短时展开、Dr 的分母和被动 FDT 条件。";
        return;
      }
      revealed = true;
      result.hidden = false;
      result.innerHTML = resultHtml(currentModel());
      gateStatus.textContent = "预测门通过：现在可以观察弹道—扩散交叉与平衡参考的差异。";
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      root.querySelectorAll("select").forEach(function (select) { select.value = ""; });
      speed.value = "2";
      dr.value = "0.5";
      dt.value = "0.2";
      time.value = "2";
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
    var model = evaluate({ speed: 2, rotationalDiffusion: 0.5, translationalDiffusion: 0.2, probeTime: 2 });
    assert(near(model.persistenceTime, 2, 1e-12), "persistence time"); checks += 1;
    assert(near(model.persistenceLength, 4, 1e-12), "persistence length"); checks += 1;
    assert(near(model.activeDiffusion, 4, 1e-12), "active diffusion"); checks += 1;
    assert(near(meanSquareDisplacement(0.5, 2, 0.5, 0.2), 1.3216250583, 1e-9), "default half-second MSD"); checks += 1;
    assert(near(meanSquareDisplacement(2, 2, 0.5, 0.2), 13.3721421, 1e-8), "default two-second MSD"); checks += 1;
    assert(near(meanSquareDisplacement(1, 0, 0.5, 0.2), 0.8, 1e-12), "passive MSD"); checks += 1;
    assert(near(meanSquareDisplacement(1, 2, 0, 0.2), 4.8, 1e-12), "zero-turning boundary"); checks += 1;
    assert(near(orientationCorrelation(2, 0.5), Math.exp(-1), 1e-12), "orientation correlation"); checks += 1;
    assert(near(model.passiveRatio, 1, 1e-12), "passive reference ratio"); checks += 1;
    assert(near(model.activeRatio, 21, 1e-12), "active reference ratio"); checks += 1;
    var rendered = chart(model);
    assert(rendered.indexOf("当前 t = τr") !== -1, "coalesced default time markers"); checks += 1;
    assert(rendered.indexOf("am-svg-compact") !== -1 && rendered.indexOf("MSD(t) / μm²") !== -1, "mobile chart and semantic axes"); checks += 1;
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest };
});
