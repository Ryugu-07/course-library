(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("compact-degeneracy", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("compact-degeneracy self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("compact-degeneracy self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var G = 6.67430e-11;
  var HBAR = 1.054571817e-34;
  var C = 299792458;
  var M_E = 9.1093837015e-31;
  var M_P = 1.67262192369e-27;
  var M_SUN = 1.98847e30;
  var EPS = 1e-12;
  var TOV_PROFILE_STEPS = 100;
  var RHO_REF = 3e17;
  var WD_REFERENCE_RADIUS_M = 7e6;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "compact-degeneracy-lab-styles";
  var INSTANCE = 0;

  var EOS_PRESETS = [
    {
      id: "soft",
      label: "软 toy EOS",
      gamma: 2,
      pressureAtReference: 0.45e34,
      maxMassSolar: 2.0,
      note: "仅用于展示 EOS 参数如何进入 TOV 账本；不拟合观测。"
    },
    {
      id: "stiff",
      label: "硬 toy EOS",
      gamma: 2.2,
      pressureAtReference: 1.05e34,
      maxMassSolar: 2.3,
      note: "较硬的示意支路允许更高 toy 最大质量，仍非精密状态方程。"
    }
  ];

  var PRESETS = [
    {
      id: "white-dwarf",
      label: "白矮星支路",
      objectType: "white-dwarf",
      massSolar: 0.8,
      radiusKm: 7520,
      muE: 2,
      eosId: "soft",
      note: "电子简并压支撑；显示非相对论质量—半径 toy 与 Chandrasekhar 阶数量级。"
    },
    {
      id: "chandra-edge",
      label: "Chandra 边界",
      objectType: "white-dwarf",
      massSolar: 1.42,
      radiusKm: 5650,
      muE: 2,
      eosId: "soft",
      note: "靠近 M_Ch 的模型边界；非相对论 R∝M⁻¹ᐟ³ 支路不应被当成真实零半径预测。"
    },
    {
      id: "neutron-star",
      label: "中子星 TOV",
      objectType: "neutron-star",
      massSolar: 1.4,
      radiusKm: 12,
      muE: 2,
      eosId: "soft",
      note: "核物质 EOS 与 TOV 修正接手；这不是把电子简并支路延伸到更小半径。"
    },
    {
      id: "stiff-neutron-star",
      label: "硬 EOS 中子星",
      objectType: "neutron-star",
      massSolar: 2.05,
      radiusKm: 12,
      muE: 2,
      eosId: "stiff",
      note: "同一 TOV 结构骨架换 toy EOS；最大质量结论随 EOS 变化。"
    },
    {
      id: "black-hole",
      label: "黑洞边界",
      objectType: "black-hole",
      massSolar: 10,
      radiusKm: 20,
      muE: 2,
      eosId: "soft",
      note: "R≤r_s 时不再用简并压支撑的静态星体 toy 描述；进入黑洞边界。"
    }
  ];

  var STYLE_TEXT = [
    ".cd-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}",
    ".cd-lab *,.cd-lab *::before,.cd-lab *::after{box-sizing:border-box}.cd-lab [hidden]{display:none!important}",
    ".cd-lab h3,.cd-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.cd-lab h3{font-size:1.14rem}.cd-lab h4{font-size:1rem}.cd-lab p{margin:8px 0}",
    ".cd-lab .cd-note,.cd-lab .cd-feedback,.cd-lab .cd-status{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
    ".cd-lab button,.cd-lab input,.cd-lab select{font:inherit}.cd-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.cd-lab button:hover{border-color:var(--accent,#1769aa)}.cd-lab button:focus-visible,.cd-lab input:focus-visible,.cd-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.cd-lab button[aria-pressed=true],.cd-lab button.cd-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.cd-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".cd-lab .cd-presets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:10px 0}.cd-lab .cd-presets button{font-size:12px}.cd-lab .cd-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0;align-items:end}.cd-lab .cd-control{display:grid;gap:4px;min-width:0}.cd-lab .cd-control label,.cd-lab .cd-control>span{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.cd-lab .cd-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums}.cd-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#1769aa)}.cd-lab select{width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b)}",
    ".cd-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.cd-lab legend{max-width:100%;padding:0 4px;color:var(--fg,#20252b);font-size:13px;font-weight:750;line-height:1.5}.cd-lab .cd-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.cd-lab .cd-choice-grid button{font-size:12px}",
    ".cd-lab .cd-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#9a6b12);background:var(--block-bg,var(--bg,#fff))}.cd-lab .cd-prediction-title{display:block;margin-bottom:8px;font-size:13px}.cd-lab .cd-question{margin:10px 0}.cd-lab .cd-question legend{margin-bottom:6px}.cd-lab .cd-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.cd-lab .cd-pass{color:var(--cl-green,#2f7547)}.cd-lab .cd-warn{color:var(--cl-red,#b43d32)}.cd-lab .cd-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.cd-lab .cd-actions>*{flex:1 1 170px}",
    ".cd-lab .cd-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#c8cdd3)}.cd-lab .cd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.cd-lab .cd-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff))}.cd-lab .cd-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.cd-lab .cd-metric:nth-child(4n+2){border-color:var(--cl-green,#2f7547)}.cd-lab .cd-metric:nth-child(4n+3){border-color:var(--cl-gold,#9a6b12)}.cd-lab .cd-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.cd-lab .cd-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px;line-height:1.4}.cd-lab .cd-metric strong{display:block;margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".cd-lab .cd-stage{min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff))}.cd-lab .cd-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b)}.cd-lab .cd-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.cd-lab .cd-svg .cd-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1}.cd-lab .cd-svg .cd-axis{stroke:currentColor;stroke-opacity:.5;stroke-width:1.1}.cd-lab .cd-svg .cd-wd{fill:none;stroke:var(--cl-blue,#2c6aa0);stroke-width:2.5}.cd-lab .cd-svg .cd-ns{fill:none;stroke:var(--cl-green,#2f7547);stroke-width:2.5}.cd-lab .cd-svg .cd-bh{fill:none;stroke:var(--cl-red,#b43d32);stroke-width:2;stroke-dasharray:5 4}.cd-lab .cd-svg .cd-point{fill:var(--cl-gold,#9a6b12);stroke:var(--bg,#fff);stroke-width:2}.cd-lab .cd-svg .cd-rs{fill:var(--cl-red,#b43d32);stroke:var(--bg,#fff);stroke-width:2}.cd-lab .cd-svg .cd-label{font-size:12px;font-weight:750}.cd-lab .cd-svg .cd-small{font-size:10px;fill:var(--fg-soft,var(--muted,#5d6873))}",
    ".cd-lab .cd-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.cd-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.cd-lab table caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.cd-lab th,.cd-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.cd-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.cd-lab .cd-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--cl-green,#2f7547);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
    "@media(max-width:920px){.cd-lab .cd-presets{grid-template-columns:repeat(3,minmax(0,1fr))}.cd-lab .cd-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.cd-lab .cd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:620px){.cd-lab .cd-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.cd-lab .cd-controls{grid-template-columns:minmax(0,1fr)}.cd-lab .cd-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cd-lab .cd-prediction{padding:10px}.cd-lab .cd-stage{padding:4px}}",
    "@media(max-width:420px){.cd-lab .cd-presets,.cd-lab .cd-metrics,.cd-lab .cd-choice-grid{grid-template-columns:minmax(0,1fr)}}",
    "@media(prefers-reduced-motion:reduce){.cd-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function eosById(id) {
    var fallback = EOS_PRESETS[0];
    EOS_PRESETS.forEach(function (eos) {
      if (eos.id === id) fallback = eos;
    });
    return fallback;
  }

  function presetById(id) {
    var fallback = PRESETS[0];
    PRESETS.forEach(function (preset) {
      if (preset.id === id) fallback = preset;
    });
    return fallback;
  }

  function presetForObjectType(objectType) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].objectType === objectType) return PRESETS[index];
    }
    return PRESETS[0];
  }

  function massKg(massSolar) {
    return Number(massSolar) * M_SUN;
  }

  function radiusM(radiusKm) {
    return Number(radiusKm) * 1000;
  }

  function schwarzschildRadiusKm(massSolar) {
    return 2 * G * massKg(massSolar) / (C * C) / 1000;
  }

  function electronNumberDensity(massSolar, radiusKm, muE) {
    var mass = massKg(massSolar);
    var radius = radiusM(radiusKm);
    return mass / (Number(muE) * M_P) / ((4 / 3) * Math.PI * Math.pow(radius, 3));
  }

  function fermiScaling(massSolar, radiusKm, muE) {
    var electronDensity = electronNumberDensity(massSolar, radiusKm, muE);
    var pF = HBAR * Math.pow(3 * Math.PI * Math.PI * electronDensity, 1 / 3);
    var x = pF / (M_E * C);
    var nonRelativisticPressure = HBAR * HBAR / (5 * M_E) * Math.pow(3 * Math.PI * Math.PI, 2 / 3) * Math.pow(electronDensity, 5 / 3);
    var extremeRelativisticPressure = HBAR * C / 4 * Math.pow(3 * Math.PI * Math.PI, 1 / 3) * Math.pow(electronDensity, 4 / 3);
    var gravitationalScale = G * massKg(massSolar) * massKg(massSolar) / Math.pow(radiusM(radiusKm), 4);
    return {
      massSolar: Number(massSolar),
      radiusKm: Number(radiusKm),
      muE: Number(muE),
      electronDensity: electronDensity,
      fermiMomentum: pF,
      relativityParameter: x,
      regime: x < 0.1 ? "non-relativistic electron gas" : x > 10 ? "extreme-relativistic electron gas" : "transition",
      nonRelativisticPressure: nonRelativisticPressure,
      extremeRelativisticPressure: extremeRelativisticPressure,
      gravitationalScale: gravitationalScale,
      nonRelativisticRatio: nonRelativisticPressure / gravitationalScale,
      extremeRelativisticRatio: extremeRelativisticPressure / gravitationalScale,
      pressureScaling: {
        nonRelativistic: { massExponent: 5 / 3, radiusExponent: -5, densityExponent: 5 / 3 },
        extremeRelativistic: { massExponent: 4 / 3, radiusExponent: -4, densityExponent: 4 / 3 },
        gravity: { massExponent: 2, radiusExponent: -4 }
      },
      supportMechanism: "electron-degeneracy",
      caveat: "费米压是尺度模型；它没有求解白矮星的完整 Lane–Emden 结构。"
    };
  }

  function chandrasekharOrderMassSolar(muE) {
    return 5.83 / (Number(muE) * Number(muE));
  }

  function whiteDwarfToy(massSolar, muE) {
    var mass = Number(massSolar);
    var composition = Number(muE);
    var mCh = chandrasekharOrderMassSolar(composition);
    var radius = WD_REFERENCE_RADIUS_M * Math.pow(Math.max(mass, 0.01), -1 / 3) * Math.pow(2 / composition, 5 / 3);
    var fermi = fermiScaling(mass, radius / 1000, composition);
    return {
      massSolar: mass,
      muE: composition,
      radiusKmNonRelativisticToy: radius / 1000,
      chandrasekharMassSolar: mCh,
      massFractionOfChandrasekhar: mass / mCh,
      belowToyBoundary: mass < mCh,
      supportMechanism: "electron-degeneracy",
      relativityRegime: fermi.regime,
      modelStatus: fermi.regime === "non-relativistic electron gas"
        ? "NR electron regime: mass-radius toy branch"
        : fermi.regime === "extreme-relativistic electron gas"
          ? "ER electron regime: Chandrasekhar-order mass boundary"
          : "transition electron regime: pure NR branch is not sufficient",
      precisionStatus: "order-of-magnitude pedagogical toy, not a precision white-dwarf solver",
      fermi: fermi
    };
  }

  function whiteDwarfCurve(muE, count) {
    var mCh = chandrasekharOrderMassSolar(muE);
    var points = [];
    var size = Math.max(8, Math.round(count || 28));
    var index;
    for (index = 0; index < size; index += 1) {
      var mass = Math.max(0.08, mCh * (0.08 + 0.91 * index / (size - 1)));
      var radius = whiteDwarfToy(mass, muE).radiusKmNonRelativisticToy;
      points.push({ massSolar: mass, radiusKm: radius });
    }
    return points;
  }

  function eosPressure(rho, eosId) {
    var eos = eosById(eosId);
    return eos.pressureAtReference * Math.pow(Number(rho) / RHO_REF, eos.gamma);
  }

  function eosSoundSpeedRatio(rho, pressure, eosId) {
    var eos = eosById(eosId);
    var energyDensity = Number(rho) * C * C + Number(pressure) / (eos.gamma - 1);
    return eos.gamma * Number(pressure) / (energyDensity + Number(pressure));
  }

  function densityShape(fraction) {
    var f = clamp(Number(fraction), 0, 1);
    return Math.max(0, 1 - f * f);
  }

  function buildDensityProfile(massSolar, radiusKm, steps) {
    var mass = massKg(massSolar);
    var radius = radiusM(radiusKm);
    var count = Math.max(20, Math.round(steps || TOV_PROFILE_STEPS));
    var step = 1 / count;
    var shapeIntegral = 0;
    var index;
    for (index = 1; index <= count; index += 1) {
      var leftFraction = (index - 1) * step;
      var rightFraction = index * step;
      var midpointFraction = (leftFraction + rightFraction) / 2;
      shapeIntegral += midpointFraction * midpointFraction * densityShape(midpointFraction) * step;
    }
    var densityScale = mass / (4 * Math.PI * Math.pow(radius, 3) * shapeIntegral);
    var rows = [{ fraction: 0, radiusM: 0, density: densityScale, enclosedMassKg: 0 }];
    var cumulative = 0;
    var maxDerivativeRelativeResidual = 0;
    for (index = 1; index <= count; index += 1) {
      var previousFraction = (index - 1) * step;
      var fraction = index * step;
      var midpointFraction = (previousFraction + fraction) / 2;
      var midpointIntegrand = midpointFraction * midpointFraction * densityShape(midpointFraction);
      cumulative += midpointIntegrand * step;
      var previousRow = rows[rows.length - 1];
      var row = {
        fraction: fraction,
        radiusM: radius * fraction,
        density: densityScale * densityShape(fraction),
        enclosedMassKg: 4 * Math.PI * Math.pow(radius, 3) * densityScale * cumulative
      };
      var finiteDifference = (row.enclosedMassKg - previousRow.enclosedMassKg) / (radius * step);
      var differentialRhs = 4 * Math.PI * Math.pow(radius * midpointFraction, 2) * densityScale * densityShape(midpointFraction);
      maxDerivativeRelativeResidual = Math.max(maxDerivativeRelativeResidual, Math.abs(finiteDifference - differentialRhs) / Math.max(Math.abs(differentialRhs), EPS));
      rows.push(row);
    }
    return {
      massKg: mass,
      radiusM: radius,
      steps: count,
      densityScale: densityScale,
      centralDensity: densityScale,
      surfaceDensity: rows[rows.length - 1].density,
      rows: rows,
      massClosureRelativeError: Math.abs(rows[rows.length - 1].enclosedMassKg - mass) / mass,
      maxDerivativeRelativeResidual: maxDerivativeRelativeResidual
    };
  }

  function profileRowAt(profile, fraction) {
    var f = clamp(Number(fraction), 0, 1);
    var position = f * profile.steps;
    var lowerIndex = Math.floor(position);
    var upperIndex = Math.min(profile.steps, lowerIndex + 1);
    var weight = position - lowerIndex;
    var lower = profile.rows[lowerIndex];
    var upper = profile.rows[upperIndex];
    return {
      fraction: f,
      radiusM: profile.radiusM * f,
      density: profile.densityScale * densityShape(f),
      enclosedMassKg: lower.enclosedMassKg + (upper.enclosedMassKg - lower.enclosedMassKg) * weight
    };
  }

  function tovPoint(massSolar, radiusKm, eosId, fraction, profile) {
    var densityLedger = profile || buildDensityProfile(massSolar, radiusKm);
    var f = clamp(Number(fraction), 0.05, 1);
    var densityRow = profileRowAt(densityLedger, f);
    var localDensity = densityRow.density;
    var r = densityRow.radiusM;
    var enclosedMass = densityRow.enclosedMassKg;
    var pressure = eosPressure(localDensity, eosId);
    var denominator = 1 - 2 * G * enclosedMass / (r * C * C);
    var newtonianGradient = G * localDensity * enclosedMass / (r * r);
    var tovGradient = denominator > EPS
      ? G * (localDensity + pressure / (C * C)) * (enclosedMass + 4 * Math.PI * Math.pow(r, 3) * pressure / (C * C)) / (r * r * denominator)
      : null;
    return {
      fraction: f,
      radiusKm: r / 1000,
      enclosedMassSolar: enclosedMass / M_SUN,
      density: localDensity,
      pressure: pressure,
      compactnessAtPoint: G * enclosedMass / (r * C * C),
      denominator: denominator,
      newtonianGradient: newtonianGradient,
      tovGradient: tovGradient,
      relativisticCorrection: tovGradient === null || Math.abs(newtonianGradient) <= EPS ? null : tovGradient / newtonianGradient,
      soundSpeedRatio: eosSoundSpeedRatio(localDensity, pressure, eosId),
      massClosureRelativeError: densityLedger.massClosureRelativeError,
      dmDrMaxRelativeResidual: densityLedger.maxDerivativeRelativeResidual
    };
  }

  function neutronStarLedger(massSolar, radiusKm, eosId) {
    var mass = massKg(massSolar);
    var radius = radiusM(radiusKm);
    var compactness = G * mass / (radius * C * C);
    var eos = eosById(eosId);
    var densityProfile = buildDensityProfile(massSolar, radiusKm, TOV_PROFILE_STEPS);
    var profileFractions = [0.2, 0.4, 0.6, 0.8, 1];
    return {
      massSolar: Number(massSolar),
      radiusKm: Number(radiusKm),
      compactness: compactness,
      schwarzschildRadiusKm: schwarzschildRadiusKm(massSolar),
      compactnessRatioToHorizon: 2 * compactness,
      eos: eos,
      supportMechanism: "neutron-matter nuclear EOS plus neutron degeneracy",
      tovRequired: compactness > 0.05,
      densityProfile: densityProfile,
      midpoint: tovPoint(massSolar, radiusKm, eos.id, 0.5, densityProfile),
      profile: profileFractions.map(function (fraction) { return tovPoint(massSolar, radiusKm, eos.id, fraction, densityProfile); }),
      massClosureRelativeError: densityProfile.massClosureRelativeError,
      dmDrMaxRelativeResidual: densityProfile.maxDerivativeRelativeResidual,
      eosMassBoundary: Number(massSolar) > eos.maxMassSolar,
      modelStatus: Number(massSolar) > eos.maxMassSolar ? "toy EOS maximum-mass boundary" : "toy TOV/EOS ledger with normalized mass profile",
      precisionStatus: "rho(r) and m(r) are numerically normalized to dm/dr=4πr²rho; pressure is a local TOV gradient toy, not a full hydrostatic solve."
    };
  }

  function boundaryAssessment(objectType, massSolar, radiusKm, muE, eosId) {
    var mass = Number(massSolar);
    var radius = Number(radiusKm);
    var rs = schwarzschildRadiusKm(mass);
    if (objectType === "black-hole") {
      return radius <= rs
        ? {
          code: "black-hole",
          label: "黑洞几何边界",
          supportMechanism: "no static degeneracy support in this model",
          schwarzschildRadiusKm: rs,
          note: "R≤r_s；不再把它作为静态白矮星或中子星支撑问题处理。"
        }
        : {
          code: "black-hole-outside-horizon",
          label: "黑洞类型但 R>r_s",
          supportMechanism: "geometry-inconclusive",
          schwarzschildRadiusKm: rs,
          note: "当前半径仍在 Schwarzschild 半径之外；不能把黑洞类型标签当作已经越过视界。"
        };
    }
    if (radius <= rs) {
      return {
        code: "black-hole",
        label: "黑洞几何边界",
        supportMechanism: "no static degeneracy support in this model",
        schwarzschildRadiusKm: rs,
        note: "R≤r_s；不再把它作为静态白矮星或中子星支撑问题处理。"
      };
    }
    if (objectType === "white-dwarf") {
      var mCh = chandrasekharOrderMassSolar(muE);
      var regime = fermiScaling(mass, radius, muE).regime;
      return mass >= mCh
        ? { code: "white-dwarf-chandrasekhar", label: "白矮星 Chandrasekhar-order 边界", supportMechanism: "electron-degeneracy", schwarzschildRadiusKm: rs, note: "电子极端相对论支路与引力有相同 R⁻⁴ 标度；需要坍缩/爆发等新物理。" }
        : regime === "transition"
          ? { code: "white-dwarf-transition", label: "白矮星电子相对论过渡区", supportMechanism: "electron-degeneracy", schwarzschildRadiusKm: rs, note: "当前费米动量处于非相对论与极端相对论之间；不能把纯 NR 质量—半径式当成完整状态。" }
          : { code: "white-dwarf-toy", label: "白矮星非相对论 toy 支路", supportMechanism: "electron-degeneracy", schwarzschildRadiusKm: rs, note: "R∝M⁻¹ᐟ³ 只在非相对论 toy 的适用区读作尺度关系。" };
    }
    var eos = eosById(eosId);
    return mass > eos.maxMassSolar
      ? { code: "neutron-eos-boundary", label: "中子星 EOS 最大质量边界", supportMechanism: "nuclear-EOS", schwarzschildRadiusKm: rs, note: "toy EOS 已不提供静态解；真实结论依赖核物质 EOS、旋转和广义相对论。" }
      : { code: "neutron-tov", label: "中子星 TOV/EOS toy 区", supportMechanism: "nuclear-EOS", schwarzschildRadiusKm: rs, note: "中子星支撑机制与白矮星电子简并支路分开记账。" };
  }

  function compactModel(objectType, massSolar, radiusKm, muE, eosId) {
    var type = objectType || "white-dwarf";
    var mass = Number(massSolar);
    var radius = Number(radiusKm);
    var boundary = boundaryAssessment(type, mass, radius, muE, eosId);
    var result = {
      objectType: type,
      massSolar: mass,
      radiusKm: radius,
      boundary: boundary,
      fermi: null,
      whiteDwarf: null,
      neutronStar: null,
      supportMechanism: boundary.supportMechanism
    };
    if (type === "white-dwarf" && boundary.code !== "black-hole") {
      result.whiteDwarf = whiteDwarfToy(mass, muE);
      result.fermi = fermiScaling(mass, radius, muE);
    } else if (type === "neutron-star" && boundary.code !== "black-hole") {
      result.neutronStar = neutronStarLedger(mass, radius, eosId);
    }
    return result;
  }

  function formatNumber(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "未定义";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) < 1e-8) return "0";
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "").replace(/^-0$/, "0");
  }

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function element(doc, tag, attributes, children) {
    var node = setAttributes(doc.createElement(tag), attributes);
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attributes, children) {
    var node = setAttributes(doc.createElementNS(SVG_NS, tag), attributes);
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    (doc.head || doc.documentElement).appendChild(element(doc, "style", { id: STYLE_ID }, STYLE_TEXT));
  }

  function chartMap(massSolar, radiusKm) {
    var x = 54 + clamp(Number(massSolar) / 12, 0, 1) * 652;
    var minimumLog = 0;
    var maximumLog = Math.log10(12000);
    var logRadius = Math.log10(clamp(Number(radiusKm), 1, 12000));
    var y = 304 - (logRadius - minimumLog) / (maximumLog - minimumLog) * 252;
    return [x, y];
  }

  function massRadiusSvg(doc, model, id) {
    var svg = svgElement(doc, "svg", { class: "cd-svg", viewBox: "0 0 760 350", role: "img", "aria-labelledby": id + "-title " + id + "-desc" });
    svg.appendChild(svgElement(doc, "title", { id: id + "-title" }, "白矮星、中子星与黑洞边界的质量—半径尺度图"));
    svg.appendChild(svgElement(doc, "desc", { id: id + "-desc" }, "纵轴为半径的对数尺度；蓝色为白矮星非相对论 toy，绿色为中子星示意区，红色虚线为 Schwarzschild 半径，金点为当前模型。"));
    [80, 150, 220, 290].forEach(function (y) { svg.appendChild(svgElement(doc, "line", { x1: "50", y1: String(y), x2: "710", y2: String(y), class: "cd-grid" })); });
    [160, 300, 440, 580].forEach(function (x) { svg.appendChild(svgElement(doc, "line", { x1: String(x), y1: "36", x2: String(x), y2: "315", class: "cd-grid" })); });
    svg.appendChild(svgElement(doc, "line", { x1: "50", y1: "315", x2: "710", y2: "315", class: "cd-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: "50", y1: "36", x2: "50", y2: "315", class: "cd-axis" }));
    var wdPoints = whiteDwarfCurve(2, 36).map(function (point) { return chartMap(point.massSolar, point.radiusKm); });
    var wdPath = wdPoints.map(function (point, index) { return (index ? "L" : "M") + point[0].toFixed(2) + " " + point[1].toFixed(2); }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: wdPath, class: "cd-wd" }));
    var nsPoints = [[1.1, 16], [1.4, 13], [1.8, 11], [2.2, 10]].map(function (point) { return chartMap(point[0], point[1]); });
    var nsPath = nsPoints.map(function (point, index) { return (index ? "L" : "M") + point[0].toFixed(2) + " " + point[1].toFixed(2); }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: nsPath, class: "cd-ns" }));
    var bhPoints = [];
    var index;
    for (index = 0; index <= 50; index += 1) {
      var mass = 0.2 + 11.8 * index / 50;
      bhPoints.push(chartMap(mass, schwarzschildRadiusKm(mass)));
    }
    var bhPath = bhPoints.map(function (point, pointIndex) { return (pointIndex ? "L" : "M") + point[0].toFixed(2) + " " + point[1].toFixed(2); }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: bhPath, class: "cd-bh" }));
    var current = chartMap(model.massSolar, model.radiusKm);
    var rsPoint = chartMap(model.massSolar, model.boundary.schwarzschildRadiusKm);
    svg.appendChild(svgElement(doc, "circle", { cx: current[0], cy: current[1], r: "6", class: "cd-point" }));
    svg.appendChild(svgElement(doc, "circle", { cx: rsPoint[0], cy: rsPoint[1], r: "5", class: "cd-rs" }));
    svg.appendChild(svgElement(doc, "text", { x: "55", y: "25", class: "cd-small" }, "log₁₀(R/km)：白矮星 toy / 中子星 EOS 示意 / r_s"));
    svg.appendChild(svgElement(doc, "text", { x: "705", y: "333", "text-anchor": "end", class: "cd-small" }, "M/M☉"));
    svg.appendChild(svgElement(doc, "text", { x: "600", y: "64", class: "cd-label" }, "白矮星"));
    svg.appendChild(svgElement(doc, "text", { x: "575", y: "192", class: "cd-label" }, "中子星"));
    svg.appendChild(svgElement(doc, "text", { x: "568", y: "278", class: "cd-label" }, "r_s"));
    return svg;
  }

  function metricBlock(doc, label, value) {
    return element(doc, "div", { className: "cd-metric" }, [element(doc, "span", {}, label), element(doc, "strong", {}, value)]);
  }

  function question(doc, key, label, options, state, onChange) {
    var fieldset = element(doc, "fieldset", { className: "cd-question", "data-answer-key": key });
    fieldset.appendChild(element(doc, "legend", {}, label));
    var grid = element(doc, "div", { className: "cd-choice-grid" });
    options.forEach(function (option) {
      var button = element(doc, "button", { type: "button", "data-answer-value": option.value, "aria-pressed": state.answers[key] === option.value ? "true" : "false" }, option.label);
      button.addEventListener("click", function () {
        state.answers[key] = option.value;
        Array.prototype.forEach.call(grid.children, function (child) { child.setAttribute("aria-pressed", child === button ? "true" : "false"); });
        onChange();
      });
      grid.appendChild(button);
    });
    fieldset.appendChild(grid);
    return fieldset;
  }

  function expectedAnswers(model) {
    return {
      densityExponent: "five-thirds",
      radiusTrend: "decrease",
      chandra: "mass-boundary",
      support: model.boundary.code === "black-hole" || model.boundary.code === "black-hole-outside-horizon"
        ? "none"
        : model.objectType === "white-dwarf" ? "electron" : model.objectType === "neutron-star" ? "nuclear-eos" : "none"
    };
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var firstPreset = presetById("white-dwarf");
    var state = {
      presetId: firstPreset.id,
      objectType: firstPreset.objectType,
      massSolar: firstPreset.massSolar,
      radiusKm: firstPreset.radiusKm,
      muE: firstPreset.muE,
      eosId: firstPreset.eosId,
      answers: { densityExponent: null, radiusTrend: null, chandra: null, support: null },
      revealed: false
    };
    var serial = INSTANCE += 1;
    var shell = element(doc, "div", { className: "cd-lab" });
    shell.appendChild(element(doc, "h3", {}, "致密天体账本：简并标度、TOV 与黑洞边界分开算"));
    shell.appendChild(element(doc, "p", { className: "cd-note" }, "先看电子费米动量如何改变白矮星 toy，再切到独立的中子星 TOV/EOS ledger；R≤r_s 时停止把对象当作静态星体。"));
    var presets = element(doc, "div", { className: "cd-presets" });
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": state.presetId === preset.id ? "true" : "false" }, preset.label);
      button.addEventListener("click", function () {
        state.presetId = preset.id;
        state.objectType = preset.objectType;
        state.massSolar = preset.massSolar;
        state.radiusKm = preset.radiusKm;
        state.muE = preset.muE;
        state.eosId = preset.eosId;
        state.answers = { densityExponent: null, radiusTrend: null, chandra: null, support: null };
        state.revealed = false;
        render();
      });
      presets.appendChild(button);
    });
    shell.appendChild(presets);
    var controls = element(doc, "div", { className: "cd-controls" });
    var objectControl = element(doc, "div", { className: "cd-control" });
    objectControl.appendChild(element(doc, "label", { for: "cd-object-" + serial }, "对象模型"));
    var objectSelect = element(doc, "select", { id: "cd-object-" + serial, "aria-label": "对象模型" });
    [["white-dwarf", "白矮星：电子简并"], ["neutron-star", "中子星：核物质 EOS/TOV"], ["black-hole", "黑洞：R≤r_s"]].forEach(function (option) {
      objectSelect.appendChild(element(doc, "option", { value: option[0] }, option[1]));
    });
    objectControl.appendChild(objectSelect);
    controls.appendChild(objectControl);
    function sliderControl(label, key, min, max, step, ariaLabel) {
      var control = element(doc, "div", { className: "cd-control" });
      var labelNode = element(doc, "label", {}, label + " = ");
      var output = element(doc, "output", {});
      var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), "aria-label": ariaLabel });
      labelNode.appendChild(output);
      control.appendChild(labelNode);
      control.appendChild(input);
      controls.appendChild(control);
      input.addEventListener("input", function () {
        state[key] = Number(input.value);
        state.presetId = "custom";
        state.answers = { densityExponent: null, radiusTrend: null, chandra: null, support: null };
        state.revealed = false;
        render();
      });
      return { input: input, output: output };
    }
    var massControl = sliderControl("质量 M/M☉", "massSolar", 0.2, 12, 0.05, "质量（太阳质量）");
    var radiusControl = sliderControl("半径 R/km", "radiusKm", 2, 10000, 1, "半径（千米）");
    var muControl = sliderControl("组成 μₑ", "muE", 1.5, 3, 0.1, "平均每电子重子数");
    shell.appendChild(controls);
    var eosControl = element(doc, "div", { className: "cd-control" });
    eosControl.appendChild(element(doc, "label", { for: "cd-eos-" + serial }, "中子星 toy EOS"));
    var eosSelect = element(doc, "select", { id: "cd-eos-" + serial, "aria-label": "中子星 toy EOS" });
    EOS_PRESETS.forEach(function (eos) { eosSelect.appendChild(element(doc, "option", { value: eos.id }, eos.label)); });
    eosControl.appendChild(eosSelect);
    controls.appendChild(eosControl);
    var prediction = element(doc, "section", { className: "cd-prediction" });
    prediction.appendChild(element(doc, "strong", { className: "cd-prediction-title" }, "预测门：先写下标度，再选择支撑机制"));
    prediction.appendChild(question(doc, "densityExponent", "1. 非相对论电子简并压 P 对数密度 n 的指数？", [{ value: "five-thirds", label: "5/3" }, { value: "four-thirds", label: "4/3" }, { value: "two", label: "2" }], state, renderPrediction));
    prediction.appendChild(question(doc, "radiusTrend", "2. 在非相对论白矮星 toy 支路，M 增大时 R？", [{ value: "decrease", label: "按 M⁻¹ᐟ³ 减小" }, { value: "increase", label: "增大" }, { value: "constant", label: "不变" }], state, renderPrediction));
    prediction.appendChild(question(doc, "chandra", "3. 极端相对论 γ=4/3 与引力同为 R⁻⁴，留下什么边界？", [{ value: "mass-boundary", label: "质量上限量级" }, { value: "radius-law", label: "另一个 R 幂律" }, { value: "none", label: "没有边界" }], state, renderPrediction));
    prediction.appendChild(question(doc, "support", "4. 当前对象的支撑机制应归入？", [{ value: "electron", label: "电子简并" }, { value: "nuclear-eos", label: "中子/核物质 EOS" }, { value: "none", label: "不作静态星体支撑" }], state, renderPrediction));
    var actions = element(doc, "div", { className: "cd-actions" });
    var reveal = element(doc, "button", { type: "button", className: "cd-primary" }, "揭示账本");
    var reset = element(doc, "button", { type: "button" }, "重置本预设");
    var feedback = element(doc, "p", { className: "cd-feedback", "aria-live": "polite", "aria-atomic": "true" }, "");
    reveal.addEventListener("click", function () {
      var model = compactModel(state.objectType, state.massSolar, state.radiusKm, state.muE, state.eosId);
      var expected = expectedAnswers(model);
      var keys = Object.keys(state.answers);
      if (keys.some(function (key) { return state.answers[key] === null; })) {
        feedback.className = "cd-feedback cd-warn";
        feedback.textContent = "还有预测没有作答。";
        return;
      }
      var correct = keys.filter(function (key) { return state.answers[key] === expected[key]; }).length;
      state.revealed = true;
      feedback.className = "cd-feedback " + (correct === keys.length ? "cd-pass" : "cd-warn");
      feedback.textContent = "已揭示：命中 " + correct + "/" + keys.length + "；" + model.boundary.note;
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
      render();
    });
    reset.addEventListener("click", function () {
      var preset = presetById(state.presetId === "custom" ? "white-dwarf" : state.presetId);
      state.presetId = preset.id;
      state.objectType = preset.objectType;
      state.massSolar = preset.massSolar;
      state.radiusKm = preset.radiusKm;
      state.muE = preset.muE;
      state.eosId = preset.eosId;
      state.answers = { densityExponent: null, radiusTrend: null, chandra: null, support: null };
      state.revealed = false;
      render();
    });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    prediction.appendChild(actions);
    prediction.appendChild(feedback);
    shell.appendChild(prediction);
    var results = element(doc, "section", { className: "cd-results", hidden: true, "aria-live": "polite" });
    shell.appendChild(results);
    root.replaceChildren(shell);

    function renderPrediction() {
      reveal.disabled = Object.keys(state.answers).some(function (key) { return state.answers[key] === null; });
      Array.prototype.forEach.call(prediction.querySelectorAll(".cd-question"), function (fieldset) {
        var key = fieldset.getAttribute("data-answer-key");
        Array.prototype.forEach.call(fieldset.querySelectorAll("button"), function (button) {
          button.setAttribute("aria-pressed", state.answers[key] === button.getAttribute("data-answer-value") ? "true" : "false");
        });
      });
    }

    function resetGate(message) {
      state.answers = { densityExponent: null, radiusTrend: null, chandra: null, support: null };
      state.revealed = false;
      feedback.className = "cd-feedback cd-warn";
      feedback.textContent = message;
      renderPrediction();
    }

    function render() {
      var model = compactModel(state.objectType, state.massSolar, state.radiusKm, state.muE, state.eosId);
      objectSelect.value = state.objectType;
      massControl.input.value = String(state.massSolar);
      radiusControl.input.value = String(state.radiusKm);
      muControl.input.value = String(state.muE);
      massControl.output.textContent = formatNumber(state.massSolar, 2);
      radiusControl.output.textContent = formatNumber(state.radiusKm, 0);
      muControl.output.textContent = formatNumber(state.muE, 1);
      eosSelect.value = state.eosId;
      Array.prototype.forEach.call(presets.children, function (button, index) {
        button.setAttribute("aria-pressed", PRESETS[index].id === state.presetId ? "true" : "false");
      });
      renderPrediction();
      if (!state.revealed) {
        results.hidden = true;
        if (!feedback.textContent || feedback.className.indexOf("cd-warn") < 0) feedback.textContent = "先完成四项预测。";
        return;
      }
      results.hidden = false;
      results.replaceChildren();
      results.appendChild(element(doc, "h4", {}, "当前模型：支撑机制与边界分层"));
      var metrics = element(doc, "div", { className: "cd-metrics" });
      metrics.appendChild(metricBlock(doc, "M/M☉", formatNumber(model.massSolar, 3)));
      metrics.appendChild(metricBlock(doc, "R/km", formatNumber(model.radiusKm, 2)));
      metrics.appendChild(metricBlock(doc, "Schwarzschild 半径/km", formatNumber(model.boundary.schwarzschildRadiusKm, 3)));
      metrics.appendChild(metricBlock(doc, "边界", model.boundary.label));
      if (model.fermi) {
        metrics.appendChild(metricBlock(doc, "NR toy 半径/km", formatNumber(model.whiteDwarf.radiusKmNonRelativisticToy, 2)));
        metrics.appendChild(metricBlock(doc, "p_F/(mₑc)", formatNumber(model.fermi.relativityParameter, 3)));
        metrics.appendChild(metricBlock(doc, "相对论 regime", model.whiteDwarf.modelStatus));
        metrics.appendChild(metricBlock(doc, "P_NR/P_grav", formatNumber(model.fermi.nonRelativisticRatio, 3)));
        metrics.appendChild(metricBlock(doc, "P_ER/P_grav", formatNumber(model.fermi.extremeRelativisticRatio, 3)));
        metrics.appendChild(metricBlock(doc, "toy M_Ch/M☉", formatNumber(model.whiteDwarf.chandrasekharMassSolar, 3)));
      }
      if (model.neutronStar) {
        metrics.appendChild(metricBlock(doc, "GM/(Rc²)", formatNumber(model.neutronStar.compactness, 4)));
        metrics.appendChild(metricBlock(doc, "TOV/牛顿梯度", formatNumber(model.neutronStar.midpoint.relativisticCorrection, 3)));
        metrics.appendChild(metricBlock(doc, "dm/dr 最大相对残差", formatNumber(model.neutronStar.dmDrMaxRelativeResidual, 6)));
        metrics.appendChild(metricBlock(doc, "EOS toy 最大质量", formatNumber(model.neutronStar.eos.maxMassSolar, 2)));
        metrics.appendChild(metricBlock(doc, "c_s²/c²", formatNumber(model.neutronStar.midpoint.soundSpeedRatio, 3)));
      }
      results.appendChild(metrics);
      var stage = element(doc, "div", { className: "cd-stage" });
      stage.appendChild(massRadiusSvg(doc, model, "cd-stage-" + serial));
      results.appendChild(stage);
      var ledgerWrap = element(doc, "div", { className: "cd-ledger-wrap" });
      var table = element(doc, "table", { "aria-label": "致密天体模型账本" });
      table.appendChild(element(doc, "caption", {}, "模型、标度、支撑机制和边界必须分开读。"));
      var body = element(doc, "tbody");
      var rows = [
        ["对象", model.objectType, model.supportMechanism],
        ["边界", model.boundary.label, model.boundary.note],
        ["精度声明", model.whiteDwarf ? model.whiteDwarf.precisionStatus : model.neutronStar ? model.neutronStar.precisionStatus : "黑洞边界是几何判据，不是星体内部解"],
        ["质量—半径", model.whiteDwarf ? "R_toy∝M⁻¹ᐟ³（NR）" : model.neutronStar ? "由 TOV + EOS 决定；此处为一点/剖面 toy" : "R 与 r_s 比较，不延用白矮星幂律"]
      ];
      if (model.fermi) {
        rows.push(["相对论 regime", model.whiteDwarf.modelStatus, "按 x=p_F/(mₑc) 标注；transition 不等于纯 NR"]);
        rows.push(["费米账", "n_e=" + formatNumber(model.fermi.electronDensity, 3) + " m⁻³", "P_NR∝n_e⁵ᐟ³；P_ER∝n_e⁴ᐟ³"]);
      }
      if (model.neutronStar) {
        rows.push(["TOV 中点", "r=" + formatNumber(model.neutronStar.midpoint.radiusKm, 2) + " km", "分母 1−2Gm/(rc²)=" + formatNumber(model.neutronStar.midpoint.denominator, 4)]);
        rows.push(["质量守恒", "m(R)/M=" + formatNumber(model.neutronStar.densityProfile.rows[model.neutronStar.densityProfile.rows.length - 1].enclosedMassKg / (model.neutronStar.massSolar * M_SUN), 6), "数值归一化使 dm/dr=4πr²rho；最大离散相对残差=" + formatNumber(model.neutronStar.dmDrMaxRelativeResidual, 6)]);
        rows.push(["EOS", model.neutronStar.eos.label, model.neutronStar.eos.note]);
      }
      rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", {}, value); })));
      });
      table.appendChild(body);
      ledgerWrap.appendChild(table);
      results.appendChild(ledgerWrap);
      results.appendChild(element(doc, "p", { className: "cd-interpretation" }, model.boundary.code === "black-hole"
        ? "当前对象已经由 R≤r_s 的黑洞边界分类；简并压 ledger 不再提供静态星体支撑结论。"
        : model.boundary.code === "black-hole-outside-horizon"
          ? "当前选择的是黑洞类型，但 R>r_s；它尚未满足视界几何判据，也不生成星体支撑 ledger。"
          : model.objectType === "white-dwarf"
            ? "当前支路只谈电子简并压与 Chandrasekhar 阶数量级；达到边界后不能把 R∝M⁻¹ᐟ³ 的外推当成完整坍缩历史。"
            : "当前支路独立使用核物质 EOS 与 TOV 修正；它不是把电子简并压换单位后继续算。"));
    }

    objectSelect.addEventListener("change", function () {
      var preset = presetForObjectType(objectSelect.value);
      state.objectType = preset.objectType;
      state.presetId = preset.id;
      state.massSolar = preset.massSolar;
      state.radiusKm = preset.radiusKm;
      state.muE = preset.muE;
      state.eosId = preset.eosId;
      resetGate("对象模型改变；请重新选择支撑机制与边界。");
      render();
    });
    eosSelect.addEventListener("change", function () {
      state.eosId = eosSelect.value;
      state.presetId = "custom";
      resetGate("EOS 改变；请重新判断中子星质量边界。");
      render();
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var fermi = fermiScaling(1, 7000, 2);
    assert(finite(fermi.electronDensity) && fermi.electronDensity > 0, "finite electron density");
    assert(fermi.pressureScaling.nonRelativistic.densityExponent === 5 / 3, "non-relativistic density exponent");
    assert(fermi.pressureScaling.extremeRelativistic.densityExponent === 4 / 3, "extreme-relativistic density exponent");
    var massDoubled = fermiScaling(2, 7000, 2);
    var radiusDoubled = fermiScaling(1, 14000, 2);
    assert(close(massDoubled.electronDensity / fermi.electronDensity, 2), "density mass scaling");
    assert(close(radiusDoubled.electronDensity / fermi.electronDensity, 1 / 8), "density radius scaling");
    assert(close(massDoubled.nonRelativisticPressure / fermi.nonRelativisticPressure, Math.pow(2, 5 / 3), 1e-10), "NR pressure mass scaling");
    assert(close(radiusDoubled.extremeRelativisticPressure / fermi.extremeRelativisticPressure, Math.pow(1 / 8, 4 / 3), 1e-10), "ER pressure radius scaling");
    assert(fermi.supportMechanism === "electron-degeneracy", "electron support label");

    var wd = whiteDwarfToy(0.8, 2);
    var wdLarge = whiteDwarfToy(1.6, 2);
    assert(close(wd.chandrasekharMassSolar, 5.83 / 4), "Chandrasekhar order mass");
    assert(close(wdLarge.radiusKmNonRelativisticToy / wd.radiusKmNonRelativisticToy, Math.pow(2, -1 / 3), 1e-10), "white dwarf mass-radius scaling");
    assert(wd.belowToyBoundary && !wdLarge.belowToyBoundary, "white dwarf boundary classification");
    assert(wd.relativityRegime === "transition" && wd.modelStatus.indexOf("pure NR") >= 0, "white dwarf transition is not labeled pure NR");
    assert(whiteDwarfCurve(2, 12).length === 12, "white dwarf curve points");

    var soft = eosPressure(RHO_REF, "soft");
    var stiff = eosPressure(RHO_REF, "stiff");
    assert(soft > 0 && stiff > soft, "EOS pressure presets");
    var ns = neutronStarLedger(1.4, 12, "soft");
    assert(ns.compactness > 0.05 && ns.tovRequired, "neutron-star relativistic compactness");
    assert(ns.midpoint.relativisticCorrection > 1, "TOV correction exceeds Newtonian midpoint");
    assert(ns.midpoint.denominator > 0 && ns.profile.length === 5, "TOV profile finite");
    assert(ns.massClosureRelativeError < 1e-12 && ns.dmDrMaxRelativeResidual < 1e-12, "normalized TOV mass profile closes dm/dr");
    assert(close(ns.profile[ns.profile.length - 1].enclosedMassSolar, ns.massSolar, 1e-12) && ns.profile[ns.profile.length - 1].density === 0, "TOV surface mass and density boundary");
    assert(ns.supportMechanism.indexOf("nuclear") >= 0, "neutron support separate from electron support");
    var stiffNs = neutronStarLedger(2.05, 12, "stiff");
    assert(!stiffNs.eosMassBoundary, "stiff EOS toy supports its selected mass");
    assert(neutronStarLedger(2.1, 12, "soft").eosMassBoundary, "soft EOS boundary");

    var blackHole = boundaryAssessment("black-hole", 10, 20, 2, "soft");
    assert(blackHole.code === "black-hole" && blackHole.schwarzschildRadiusKm > 20, "black-hole radius boundary");
    var blackHoleOutside = boundaryAssessment("black-hole", 10, 100, 2, "soft");
    assert(blackHoleOutside.code === "black-hole-outside-horizon", "black-hole type respects R>rs");
    var blackHolePreset = presetForObjectType("black-hole");
    assert(blackHolePreset.id === "black-hole" && blackHolePreset.radiusKm <= blackHolePreset.massSolar * 2.9534, "black-hole object switch has a complete inside-horizon preset");
    assert(compactModel("neutron-star", 10, 20, 2, "soft").neutronStar === null, "inside-horizon object has no stellar TOV ledger");
    var wdBoundary = boundaryAssessment("white-dwarf", 1.5, 5000, 2, "soft");
    assert(wdBoundary.code === "white-dwarf-chandrasekhar", "white dwarf Chandra boundary");
    var nsBoundary = boundaryAssessment("neutron-star", 1.4, 12, 2, "soft");
    assert(nsBoundary.code === "neutron-tov", "neutron TOV boundary");
    assert(compactModel("white-dwarf", 0.8, 7500, 2, "soft").neutronStar === null, "white dwarf does not merge neutron support");
    assert(compactModel("neutron-star", 1.4, 12, 2, "soft").fermi === null, "neutron model does not merge electron ledger");
    PRESETS.forEach(function (preset) {
      var model = compactModel(preset.objectType, preset.massSolar, preset.radiusKm, preset.muE, preset.eosId);
      assert(finite(model.boundary.schwarzschildRadiusKm) && model.boundary.label, preset.id + " finite boundary");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    CONSTANTS: { G: G, HBAR: HBAR, C: C, electronMass: M_E, protonMass: M_P, solarMass: M_SUN },
    PRESETS: PRESETS,
    EOS_PRESETS: EOS_PRESETS,
    presetForObjectType: presetForObjectType,
    fermiScaling: fermiScaling,
    whiteDwarfToy: whiteDwarfToy,
    whiteDwarfCurve: whiteDwarfCurve,
    chandrasekharOrderMassSolar: chandrasekharOrderMassSolar,
    eosPressure: eosPressure,
    buildDensityProfile: buildDensityProfile,
    neutronStarLedger: neutronStarLedger,
    tovPoint: tovPoint,
    schwarzschildRadiusKm: schwarzschildRadiusKm,
    boundaryAssessment: boundaryAssessment,
    compactModel: compactModel,
    selfTest: selfTest,
    mount: mount
  };
});
