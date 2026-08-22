(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("equivalence-tides", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("equivalence-tides self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("equivalence-tides self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-equivalence-tides-styles";
  var G = 6.67430e-11;
  var C = 299792458;
  var SOLAR_MASS = 1.98847e30;
  var PRESETS = {
    tower: {
      label: "地球塔楼",
      mass: 5.9722e24,
      radius: 6.371e6,
      height: 22.5,
      maxHeight: 100,
      heightStep: 2.5,
      separation: 10,
      note: "弱场、小高差；Pound–Rebka 量级。"
    },
    gps: {
      label: "GPS 轨道高度",
      mass: 5.9722e24,
      radius: 6.371e6,
      height: 2.02e7,
      maxHeight: 3e7,
      heightStep: 5e5,
      separation: 100,
      note: "这里只算静止钟的引力项；卫星运动造成的狭义相对论项需另加。"
    },
    whiteDwarf: {
      label: "白矮星外部",
      mass: SOLAR_MASS,
      radius: 6e6,
      height: 6e6,
      maxHeight: 3e7,
      heightStep: 5e5,
      separation: 100,
      note: "球对称外部近似；未包含自转、磁场与大气谱线形成。"
    },
    neutronStar: {
      label: "中子星外部",
      mass: 1.4 * SOLAR_MASS,
      radius: 12e3,
      height: 12e3,
      maxHeight: 6e4,
      heightStep: 2e3,
      separation: 10,
      note: "Schwarzschild 外部 toy；真实中子星的自转与物态方程会改变度规。"
    }
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-9);
  }

  function schwarzschildRadius(mass) {
    return 2 * G * mass / (C * C);
  }

  function potentialDifference(mass, r1, r2) {
    return G * mass * (1 / r1 - 1 / r2);
  }

  function weakFrequencyLoss(mass, r1, r2) {
    return potentialDifference(mass, r1, r2) / (C * C);
  }

  function exactClockRatio(mass, r1, r2) {
    var rs = schwarzschildRadius(mass);
    if (r1 <= rs || r2 <= rs) return NaN;
    return Math.sqrt((1 - rs / r1) / (1 - rs / r2));
  }

  function conventionalRedshift(mass, r1, r2) {
    var ratio = exactClockRatio(mass, r1, r2);
    return isFinite(ratio) && ratio > 0 ? 1 / ratio - 1 : NaN;
  }

  function tidalAcceleration(mass, radius, separation) {
    return 2 * G * mass * separation / Math.pow(radius, 3);
  }

  function ledger(preset, height, separation) {
    var body = typeof preset === "string" ? PRESETS[preset] : preset;
    if (!body) throw new Error("unknown preset");
    var r1 = body.radius;
    var r2 = r1 + Math.max(0, height);
    var weak = weakFrequencyLoss(body.mass, r1, r2);
    var ratio = exactClockRatio(body.mass, r1, r2);
    var exactLoss = isFinite(ratio) ? 1 - ratio : NaN;
    var relativeMismatch = weak === 0 ? 0 : Math.abs(exactLoss - weak) / Math.abs(weak);
    return {
      r1: r1,
      r2: r2,
      compactness: G * body.mass / (r1 * C * C),
      weakLoss: weak,
      exactLoss: exactLoss,
      conventionalRedshift: conventionalRedshift(body.mass, r1, r2),
      relativeMismatch: relativeMismatch,
      tidalAcceleration: tidalAcceleration(body.mass, r1, separation),
      schwarzschildRadius: schwarzschildRadius(body.mass),
      weakAdequate: relativeMismatch < 0.05
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function scientific(value, digits) {
    if (!isFinite(value)) return "模型域外";
    if (value === 0) return "0";
    return value.toExponential(digits == null ? 3 : digits);
  }

  function formatDistance(metres) {
    return metres >= 1000
      ? (Math.round(metres / 100) / 10) + " km"
      : (Math.round(metres * 10) / 10) + " m";
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="equivalence-tides"]{--et-accent:#0369a1;--et-tide:#be123c;--et-warn:#a16207;color:inherit}' +
      '[data-learning-lab="equivalence-tides"] .et-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="equivalence-tides"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="equivalence-tides"] select,[data-learning-lab="equivalence-tides"] input,[data-learning-lab="equivalence-tides"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="equivalence-tides"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="equivalence-tides"] .et-primary{background:var(--et-accent);border-color:var(--et-accent);color:white}' +
      '[data-learning-lab="equivalence-tides"] .et-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="equivalence-tides"] .et-result[hidden]{display:none}' +
      '[data-learning-lab="equivalence-tides"] .et-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.9fr);gap:16px;align-items:start}' +
      '[data-learning-lab="equivalence-tides"] svg{display:block;width:100%;height:auto;aspect-ratio:16/9;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:color-mix(in srgb,Canvas 94%,var(--et-accent) 6%)}' +
      '[data-learning-lab="equivalence-tides"] .et-table-wrap{overflow-x:auto}' +
      '[data-learning-lab="equivalence-tides"] table{width:100%;border-collapse:collapse}' +
      '[data-learning-lab="equivalence-tides"] th,[data-learning-lab="equivalence-tides"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left;vertical-align:top}' +
      '[data-learning-lab="equivalence-tides"] .et-note{border-left:4px solid var(--et-warn);padding-left:12px}' +
      '@media(max-width:760px){[data-learning-lab="equivalence-tides"] .et-controls,[data-learning-lab="equivalence-tides"] .et-grid{grid-template-columns:1fr}}';
    host.document.head.appendChild(style);
  }

  function renderSvg(body, entry, height, separation) {
    var compactScale = Math.min(1, Math.max(0.08, Math.sqrt(entry.compactness / 0.18)));
    var bodyRadius = 42 + 58 * compactScale;
    var lowerY = 220 - bodyRadius;
    var upperY = 58;
    var arrow = Math.min(56, 12 + 12 * Math.max(0, Math.log10(entry.tidalAcceleration + 1e-20) + 16));
    return '<svg viewBox="0 0 620 340" role="img" aria-label="两只自由落体测试球与潮汐相对加速度示意">' +
      '<circle cx="170" cy="260" r="' + bodyRadius.toFixed(1) + '" fill="#0369a1" opacity=".28" stroke="#0369a1" stroke-width="3"/>' +
      '<line x1="170" y1="' + lowerY.toFixed(1) + '" x2="170" y2="' + upperY + '" stroke="currentColor" stroke-dasharray="5 5"/>' +
      '<circle cx="150" cy="120" r="10" fill="#be123c"/><circle cx="190" cy="120" r="10" fill="#be123c"/>' +
      '<line x1="150" y1="136" x2="150" y2="' + (136 + arrow).toFixed(1) + '" stroke="#be123c" stroke-width="4"/>' +
      '<line x1="190" y1="136" x2="190" y2="' + (136 + arrow * 0.82).toFixed(1) + '" stroke="#be123c" stroke-width="4"/>' +
      '<text x="220" y="82">下钟 r</text><text x="220" y="108">上钟 r+h，h=' + escapeHtml(formatDistance(height)) + '</text>' +
      '<text x="220" y="150">双球间距 ℓ=' + escapeHtml(formatDistance(separation)) + '</text>' +
      '<text x="220" y="190" fill="#be123c">箭头差：潮汐相对加速度</text>' +
      '<text x="220" y="230">自由落体可消去中心点的共同加速度</text>' +
      '<text x="220" y="260">但不能消去两条邻近测地线的相对加速度</text>' +
      '<text x="24" y="322">示意图不按天体半径与高差的真实比例绘制</text>' +
      '</svg>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="et-controls">' +
      '<label>情境<select data-role="preset"><option value="tower">地球塔楼</option><option value="gps">GPS 高度</option><option value="whiteDwarf">白矮星外部</option><option value="neutronStar">中子星外部</option></select></label>' +
      '<label>高差 <output data-role="height-output"></output><input data-role="height" type="range"></label>' +
      '<label>双球间距 <output data-role="separation-output">10 m</output><input data-role="separation" type="range" min="1" max="1000" step="1" value="10"></label>' +
      '</div>' +
      '<label>揭示前预测<select data-role="prediction"><option value="">请选择</option><option value="weak-close">弱场红移与精确模型接近</option><option value="weak-fails">弱场红移出现明显偏差</option></select></label>' +
      '<div class="et-actions"><button class="et-primary" type="button" data-role="reveal">揭示三本账</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="et-result" data-role="result" hidden aria-live="polite"></div>';

    var preset = root.querySelector('[data-role="preset"]');
    var height = root.querySelector('[data-role="height"]');
    var separation = root.querySelector('[data-role="separation"]');
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function configureHeight() {
      var body = PRESETS[preset.value];
      height.min = "0";
      height.max = String(body.maxHeight);
      height.step = String(body.heightStep);
      height.value = String(body.height);
      separation.value = String(body.separation);
    }

    function render() {
      var body = PRESETS[preset.value];
      var h = Number(height.value);
      var ell = Number(separation.value);
      root.querySelector('[data-role="height-output"]').textContent = formatDistance(h);
      root.querySelector('[data-role="separation-output"]').textContent = formatDistance(ell);
      if (result.hidden) return;
      var entry = ledger(body, h, ell);
      var expected = entry.weakAdequate ? "weak-close" : "weak-fails";
      var predictionText = prediction.value === expected ? "预测命中" : "预测需修正";
      result.innerHTML =
        '<div class="et-grid"><div>' + renderSvg(body, entry, h, ell) + '</div><div>' +
        '<h4>' + escapeHtml(body.label) + '</h4><p><strong>' + predictionText + '</strong></p>' +
        '<div class="et-table-wrap"><table><tbody>' +
        '<tr><th>紧致度 GM/(Rc²)</th><td>' + scientific(entry.compactness) + '</td></tr>' +
        '<tr><th>弱场频率损失</th><td>' + scientific(entry.weakLoss) + '</td></tr>' +
        '<tr><th>Schwarzschild 精确损失</th><td>' + scientific(entry.exactLoss) + '</td></tr>' +
        '<tr><th>两式相对偏差</th><td>' + scientific(entry.relativeMismatch) + '</td></tr>' +
        '<tr><th>潮汐 |Δa|</th><td>' + scientific(entry.tidalAcceleration) + ' m/s²</td></tr>' +
        '<tr><th>Schwarzschild 半径</th><td>' + escapeHtml(formatDistance(entry.schwarzschildRadius)) + '</td></tr>' +
        '</tbody></table></div><p class="et-note">' + escapeHtml(body.note) + ' 潮汐值非零，因此局部自由落体并未消除曲率。</p></div></div>';
    }

    preset.addEventListener("change", function () {
      configureHeight();
      render();
    });
    [height, separation].forEach(function (control) {
      control.addEventListener("input", render);
      control.addEventListener("change", render);
    });
    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      if (!prediction.value) {
        prediction.focus();
        return;
      }
      result.hidden = false;
      render();
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      preset.value = "tower";
      configureHeight();
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    configureHeight();
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var earth = PRESETS.tower;
    var tower = ledger(earth, 22.5, 10);
    var surfaceG = G * earth.mass / (earth.radius * earth.radius);
    check(near(tower.weakLoss, surfaceG * 22.5 / (C * C), 1e-19), "tower potential agrees with gh at small height");
    check(tower.exactLoss > 0, "upper clock receives redshifted photon");
    check(tower.weakAdequate, "Earth tower is weak field");
    check(tower.tidalAcceleration > 0, "tidal acceleration survives free fall");
    check(near(schwarzschildRadius(SOLAR_MASS), 2953.34, 1), "solar Schwarzschild radius");
    var compactness = 0.2;
    var syntheticMass = compactness * 12000 * C * C / G;
    var ratioInfinity = Math.sqrt(1 - 2 * compactness);
    check(near(exactClockRatio(syntheticMass, 12000, 1e30), ratioInfinity, 1e-8), "strong-field clock ratio to infinity");
    check(near(1 / ratioInfinity - 1, 0.2909944487, 1e-8), "strong-field redshift at compactness 0.2");
    check(ledger("neutronStar", PRESETS.neutronStar.height, 10).compactness > 0.1, "neutron-star preset is compact");
    check(potentialDifference(earth.mass, earth.radius, earth.radius) === 0, "zero height has zero potential difference");
    check(exactClockRatio(earth.mass, earth.radius, earth.radius) === 1, "same-radius clock ratio");
    check(tidalAcceleration(earth.mass, earth.radius, 20) === 2 * tidalAcceleration(earth.mass, earth.radius, 10), "tidal scale linear in separation");
    return { checks: checks };
  }

  return {
    G: G,
    C: C,
    PRESETS: PRESETS,
    schwarzschildRadius: schwarzschildRadius,
    potentialDifference: potentialDifference,
    weakFrequencyLoss: weakFrequencyLoss,
    exactClockRatio: exactClockRatio,
    conventionalRedshift: conventionalRedshift,
    tidalAcceleration: tidalAcceleration,
    ledger: ledger,
    mount: mount,
    selfTest: selfTest
  };
});
