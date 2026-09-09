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
  var M_U = 1.66053906892e-27;
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
      pressureAtReference: 0.20e34,
      note: "仅用于展示 EOS 参数如何进入 TOV 账本；不拟合观测。"
    },
    {
      id: "stiff",
      label: "硬 toy EOS",
      gamma: 2.2,
      pressureAtReference: 0.25e34,
      note: "在参考能量密度及以上较硬；低密度处两幂律可交叉。声速超过光速时失效。"
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
      radiusKm: 14,
      muE: 2,
      eosId: "stiff",
      note: "同一 TOV 结构骨架换 toy EOS；检查给定剖面的压力梯度残差。"
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
    "html[data-theme=dark] .cd-lab{--cd-blue:#83c8ff}",
    ".cd-lab *,.cd-lab *::before,.cd-lab *::after{box-sizing:border-box}.cd-lab [hidden]{display:none!important}",
    ".cd-lab h3,.cd-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.cd-lab h3{font-size:1.14rem}.cd-lab h4{font-size:1rem}.cd-lab p{margin:8px 0}",
    ".cd-lab .cd-note,.cd-lab .cd-feedback,.cd-lab .cd-status{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
    ".cd-lab button,.cd-lab input,.cd-lab select{font:inherit}.cd-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.cd-lab button:hover{border-color:var(--accent,#1769aa)}.cd-lab button:focus-visible,.cd-lab input:focus-visible,.cd-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.cd-lab button[aria-pressed=true],.cd-lab button.cd-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.cd-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".cd-lab .cd-presets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:10px 0}.cd-lab .cd-presets button{font-size:12px}.cd-lab .cd-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0;align-items:end}.cd-lab .cd-control{display:grid;gap:4px;min-width:0}.cd-lab .cd-control label,.cd-lab .cd-control>span{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.cd-lab .cd-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums}.cd-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#1769aa)}.cd-lab select{width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b)}",
    ".cd-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.cd-lab legend{max-width:100%;padding:0 4px;color:var(--fg,#20252b);font-size:13px;font-weight:750;line-height:1.5}.cd-lab .cd-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.cd-lab .cd-choice-grid button{font-size:12px}",
    ".cd-lab .cd-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#9a6b12);background:var(--block-bg,var(--bg,#fff))}.cd-lab .cd-prediction-title{display:block;margin-bottom:8px;font-size:13px}.cd-lab .cd-question{margin:10px 0}.cd-lab .cd-question legend{margin-bottom:6px}.cd-lab .cd-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.cd-lab .cd-pass{color:var(--cl-green,#2f7547)}.cd-lab .cd-warn{color:var(--cl-red,#b43d32)}.cd-lab .cd-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.cd-lab .cd-actions>*{flex:1 1 170px}",
    ".cd-lab .cd-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#c8cdd3)}.cd-lab .cd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.cd-lab .cd-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff))}.cd-lab .cd-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.cd-lab .cd-metric:nth-child(4n+2){border-color:var(--cl-green,#2f7547)}.cd-lab .cd-metric:nth-child(4n+3){border-color:var(--cl-gold,#9a6b12)}.cd-lab .cd-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.cd-lab .cd-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px;line-height:1.4}.cd-lab .cd-metric strong{display:block;margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".cd-lab .cd-stage{max-width:100%;overflow-x:auto;min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff))}.cd-lab .cd-svg{display:block;width:100%;min-width:700px;max-width:none;height:auto;color:var(--fg,#20252b)}.cd-lab .cd-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.cd-lab .cd-svg .cd-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1}.cd-lab .cd-svg .cd-axis{stroke:currentColor;stroke-opacity:.5;stroke-width:1.1}.cd-lab .cd-svg .cd-wd{fill:none;stroke:var(--cd-blue,#2c6aa0);stroke-width:2.5}.cd-lab .cd-svg .cd-ns{fill:none;stroke:var(--cl-green,#2f7547);stroke-width:2.5}.cd-lab .cd-svg .cd-bh{fill:none;stroke:var(--cl-red,#b43d32);stroke-width:2;stroke-dasharray:5 4}.cd-lab .cd-svg .cd-point{fill:var(--cl-gold,#9a6b12);stroke:var(--bg,#fff);stroke-width:2}.cd-lab .cd-svg .cd-rs{fill:var(--cl-red,#b43d32);stroke:var(--bg,#fff);stroke-width:2}.cd-lab .cd-svg .cd-label{font-size:12px;font-weight:750}.cd-lab .cd-svg .cd-small{font-size:13px;fill:var(--fg-soft,var(--muted,#5d6873))}",
    ".cd-lab .cd-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.cd-lab table{display:table;width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.cd-lab table caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.cd-lab th,.cd-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.cd-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.cd-lab .cd-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--cl-green,#2f7547);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
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

  function requireNumber(value,min,max,name) {
    if (!finite(value) || value<min || value>max) throw new RangeError("非法"+name);
    return value;
  }
  function eosById(id) {
    var eos=EOS_PRESETS.find(function(e){return e.id===id;});
    if(!eos) throw new RangeError("未知EOS"); return eos;
  }
  function checkFermi(m,r,mu) { requireNumber(m,.01,12,"质量");requireNumber(r,.1,25000,"半径");requireNumber(mu,1.5,3,"组成"); }
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
    requireNumber(massSolar,.01,12,"质量");
    return 2 * G * massKg(massSolar) / (C * C) / 1000;
  }

  function electronNumberDensity(massSolar, radiusKm, muE) {
    var mass = massKg(massSolar);
    var radius = radiusM(radiusKm);
    return mass / (Number(muE) * M_U) / ((4 / 3) * Math.PI * Math.pow(radius, 3));
  }

  function fermiScaling(massSolar, radiusKm, muE) {
    checkFermi(massSolar,radiusKm,muE);
    var electronDensity = electronNumberDensity(massSolar, radiusKm, muE);
    var pF = HBAR * Math.pow(3 * Math.PI * Math.PI * electronDensity, 1 / 3);
    var x = pF / (M_E * C);
    var nonRelativisticPressure = HBAR * HBAR / (5 * M_E) * Math.pow(3 * Math.PI * Math.PI, 2 / 3) * Math.pow(electronDensity, 5 / 3);
    var extremeRelativisticPressure = HBAR * C / 4 * Math.pow(3 * Math.PI * Math.PI, 1 / 3) * Math.pow(electronDensity, 4 / 3);
    var exactPressure = fermiPressure(x);
    var gravitationalScale = G * massKg(massSolar) * massKg(massSolar) / Math.pow(radiusM(radiusKm), 4);
    return {
      massSolar: Number(massSolar),
      radiusKm: Number(radiusKm),
      muE: Number(muE),
      electronDensity: electronDensity,
      fermiMomentum: pF,
      relativityParameter: x,
      regime: x < 0.1 ? "non-relativistic electron gas" : x > 10 ? "extreme-relativistic electron gas" : "transition",
      exactPressure:exactPressure,
      nrRelativeError:nonRelativisticPressure/exactPressure-1,
      erRelativeError:extremeRelativisticPressure/exactPressure-1,
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

  function fermiPressure(x) {
    requireNumber(x,1e-8,1e6,"费米动量比");
    var integral;
    if(x<.5) {
      // Integral of u^4/sqrt(1+u^2), convergent binomial series.
      var coefficient=1,power=x*x*x*x*x; integral=0;
      for(var k=0;k<24;k++){integral+=coefficient*power/(5+2*k);coefficient*=-(2*k+1)/(2*k+2);power*=x*x;}
    } else integral=(x*(2*x*x-3)*Math.hypot(1,x)+3*Math.asinh(x))/8;
    return Math.pow(M_E,4)*Math.pow(C,5)/(3*Math.PI*Math.PI*Math.pow(HBAR,3))*integral;
  }
  function chandrasekharOrderMassSolar(muE) {
    requireNumber(muE,1.5,3,"组成");
    var K=HBAR*C/4*Math.pow(3*Math.PI*Math.PI,1/3)/Math.pow(muE*M_U,4/3);
    return 4*Math.PI*Math.pow(K/(Math.PI*G),1.5)*2.018235951/M_SUN;
  }

  function whiteDwarfToy(massSolar, muE) {
    var mass = Number(massSolar);
    var composition = Number(muE);
    var mCh = chandrasekharOrderMassSolar(composition);
    var radius = WD_REFERENCE_RADIUS_M * Math.pow(mass, -1 / 3) * Math.pow(2 / composition, 5 / 3);
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
      precisionStatus: "指定归一化的NR标度；未求解白矮星完整结构",
      fermi: fermi
    };
  }

  function whiteDwarfCurve(muE, count) {
    var mCh = chandrasekharOrderMassSolar(muE);
    var points = [];
    var size = count===undefined?28:count;
    if(!Number.isInteger(size)||size<8||size>500)throw new RangeError("非法曲线点数");
    var index;
    for (index = 0; index < size; index += 1) {
      var mass = Math.max(0.08, mCh * (0.08 + 0.91 * index / (size - 1)));
      var radius = whiteDwarfToy(mass, muE).radiusKmNonRelativisticToy;
      points.push({ massSolar: mass, radiusKm: radius });
    }
    return points;
  }

  function eosPressure(rho,eosId) {
    requireNumber(rho,0,1e23,"能量密度除c²"); var eos=eosById(eosId);
    return eos.pressureAtReference*Math.pow(rho/RHO_REF,eos.gamma);
  }
  function eosSoundSpeedRatio(rho,pressure,eosId) {
    // rho means energy density / c^2 throughout, NOT rest-mass density.
    return rho===0 ? 0 : eosById(eosId).gamma*pressure/(rho*C*C);
  }
  function buildDensityProfile(massSolar,radiusKm,steps) {
    checkFermi(massSolar,radiusKm,2);
    var count=steps===undefined?100:steps;
    if(!Number.isInteger(count)||count<20||count>1000)throw new RangeError("非法剖面点数");
    var mass=massKg(massSolar),radius=radiusM(radiusKm),rho=15*mass/(8*Math.PI*Math.pow(radius,3));
    var profile={massKg:mass,radiusM:radius,steps:count,densityScale:rho,centralDensity:rho,surfaceDensity:0,rows:[],massClosureRelativeError:0};
    for(var i=0;i<=count;i++)profile.rows.push(profileRowAt(profile,i/count));
    return profile;
  }
  function profileRowAt(profile,f) {
    requireNumber(f,0,1,"径向分数");
    return {fraction:f,radiusM:profile.radiusM*f,density:profile.densityScale*(1-f*f),enclosedMassKg:profile.massKg*(5*Math.pow(f,3)-3*Math.pow(f,5))/2};
  }
  function tovPoint(massSolar,radiusKm,eosId,fraction,profile) {
    var densityLedger=profile||buildDensityProfile(massSolar,radiusKm),f=requireNumber(fraction,0,1,"径向分数"),row=profileRowAt(densityLedger,f),rho=row.density,r=row.radiusM,m=row.enclosedMassKg,eos=eosById(eosId),pressure=eosPressure(rho,eosId);
    var compactness=f===0?0:G*m/(r*C*C),denominator=1-2*compactness;
    var newton=f===0?0:G*rho*m/(r*r);
    var tov=f===0?0:denominator>0?G*(rho+pressure/(C*C))*(m+4*Math.PI*r*r*r*pressure/(C*C))/(r*r*denominator):null;
    var supplied=2*eos.gamma*eos.pressureAtReference*Math.pow(densityLedger.densityScale/RHO_REF,eos.gamma)*f*Math.pow(1-f*f,eos.gamma-1)/densityLedger.radiusM;
    var scale=tov===null?null:Math.max(Math.abs(supplied),Math.abs(tov));
    return {fraction:f,radiusKm:r/1000,enclosedMassSolar:m/M_SUN,density:rho,pressure:pressure,compactnessAtPoint:compactness,denominator:denominator,newtonianGradient:newton,tovGradient:tov,eosGradient:supplied,
      relativeResidual:tov===null?null:scale===0?null:(supplied-tov)/scale,
      relativisticCorrection:tov===null||newton===0?null:tov/newton,
      soundSpeedRatio:eosSoundSpeedRatio(rho,pressure,eosId)};
  }
  function neutronStarLedger(massSolar,radiusKm,eosId) {
    var densityProfile=buildDensityProfile(massSolar,radiusKm),compactness=G*massKg(massSolar)/(radiusM(radiusKm)*C*C),eos=eosById(eosId);
    var fractions=[0,.2,.4,.5,.6,.8,Math.sqrt(5/6),1],maxCompactnessRatio=2*compactness*25/24;
    var centerSoundSpeedRatio=eosSoundSpeedRatio(densityProfile.centralDensity,eosPressure(densityProfile.centralDensity,eosId),eosId);
    return {massSolar:massSolar,radiusKm:radiusKm,compactness:compactness,schwarzschildRadiusKm:schwarzschildRadiusKm(massSolar),eos:eos,densityProfile:densityProfile,
      supportMechanism:"核物质EOS的给定剖面诊断",tovRequired:compactness>.05,
      midpoint:tovPoint(massSolar,radiusKm,eosId,.5,densityProfile),profile:fractions.map(function(f){return tovPoint(massSolar,radiusKm,eosId,f,densityProfile);}),
      maxCompactnessRatio:maxCompactnessRatio,centerSoundSpeedRatio:centerSoundSpeedRatio,
      validDomain:maxCompactnessRatio<1&&centerSoundSpeedRatio<=1,
      modelStatus:"给定剖面一般不满足TOV；最大质量未求解",
      precisionStatus:"ρ=ε/c²。解析质量积分仅保证质量方程；须另检验EOS梯度与TOV需求，不能推断最大质量。"};
  }

  function boundaryAssessment(objectType, massSolar, radiusKm, muE, eosId) {
    if(!["white-dwarf","neutron-star","black-hole"].includes(objectType))throw new RangeError("未知对象");
    checkFermi(massSolar,radiusKm,muE);eosById(eosId);
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
        ? { code: "white-dwarf-chandrasekhar", label: "白矮星理想质量边界", supportMechanism: "electron-degeneracy", schwarzschildRadiusKm: rs, note: "电子极端相对论支路与引力有相同 R⁻⁴ 标度；需要坍缩/爆发等新物理。" }
        : regime === "transition"
          ? { code: "white-dwarf-transition", label: "白矮星电子相对论过渡区", supportMechanism: "electron-degeneracy", schwarzschildRadiusKm: rs, note: "当前费米动量处于非相对论与极端相对论之间；不能把纯 NR 质量—半径式当成完整状态。" }
          : regime === "extreme-relativistic electron gas"
            ? {code:"white-dwarf-relativistic",label:"极端相对论电子；NR失效",supportMechanism:"electron-degeneracy",schwarzschildRadiusKm:rs,note:"当前输入半径下x很大；不能套NR支路。"}
          : { code: "white-dwarf-toy", label: "白矮星非相对论 toy 支路", supportMechanism: "electron-degeneracy", schwarzschildRadiusKm: rs, note: "R∝M⁻¹ᐟ³ 只在非相对论 toy 的适用区读作尺度关系。" };
    }
    var ledger=neutronStarLedger(mass,radius,eosId);
    return {code:ledger.validDomain?"neutron-tov":"neutron-invalid-profile",label:ledger.validDomain?"待检验的TOV剖面":"剖面或EOS超出适用域",supportMechanism:"nuclear-EOS",schwarzschildRadiusKm:rs,note:ledger.maxCompactnessRatio>=1?"表面虽在r_s外，内部已出现2Gm/(rc²)≥1，静态剖面不成立。":ledger.centerSoundSpeedRatio>1?"中心声速超过光速，这个EOS参数化不能作为物理模型。":"比较给定压力梯度与TOV需求；质量积分成立并不保证静水平衡。"};
  }

  function compactModel(objectType, massSolar, radiusKm, muE, eosId) {
    if(!["white-dwarf","neutron-star","black-hole"].includes(objectType))throw new RangeError("未知对象模型");
    requireNumber(massSolar,.2,12,"质量");requireNumber(radiusKm,2,10000,"半径");requireNumber(muE,1.5,3,"组成");eosById(eosId);
    var type = objectType;
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
    if(value===0)return "0";
    if(Math.abs(value)<.001||Math.abs(value)>=1e6)return value.toExponential(Math.min(places,4));
    return places===0?value.toFixed(0):value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
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

  function chartMap(massSolar,radiusKm) {
    return [72+Math.log(massSolar/.05)/Math.log(12/.05)*640,306-Math.log(radiusKm/.1)/Math.log(30000/.1)*250];
  }
  function massRadiusSvg(doc,model,id) {
    var svg=svgElement(doc,"svg",{class:"cd-svg",viewBox:"0 0 760 430",role:"img","aria-labelledby":id+"-title "+id+"-desc"});
    svg.appendChild(svgElement(doc,"title",{id:id+"-title"},"质量半径尺度：NR白矮星与球对称视界"));
    svg.appendChild(svgElement(doc,"desc",{id:id+"-desc"},"双对数坐标。蓝线仅为所选组成的NR标度，红虚线为r_s；金点是任意输入，不代表平衡解。没有预填中子星支路或最大质量。"));
    function txt(x,y,t,attrs){svg.appendChild(svgElement(doc,"text",Object.assign({x:x,y:y,class:"cd-small"},attrs||{}),t));}
    for(var v of [1,10,100,1000,10000]) {var y=chartMap(1,v)[1];svg.appendChild(svgElement(doc,"line",{x1:72,x2:712,y1:y,y2:y,class:"cd-grid"}));txt(63,y+4,String(v),{"text-anchor":"end"});}
    for(var m of [.1,.2,.5,1,2,5,10]){var x=chartMap(m,1)[0];svg.appendChild(svgElement(doc,"line",{x1:x,x2:x,y1:56,y2:306,class:"cd-grid"}));txt(x,329,String(m),{"text-anchor":"middle"});}
    txt(72,30,"R / km（对数）；蓝线仅为 NR 标度，过渡区应查精确电子 EOS");txt(712,353,"M/M☉（对数）",{"text-anchor":"end"});
    var mu=model.whiteDwarf?model.whiteDwarf.muE:2;
    var wdPoints=whiteDwarfCurve(mu,60);
    function path(points,cls,kind){svg.appendChild(svgElement(doc,"path",{d:points.map(function(p,i){var q=chartMap(p.massSolar,p.radiusKm);return(i?"L":"M")+q[0].toFixed(5)+" "+q[1].toFixed(5);}).join(" "),class:cls,"data-curve":kind}));}
    path(wdPoints,"cd-wd","white-dwarf");
    var bh=[];for(var j=0;j<=100;j++){var mass=.05*Math.pow(240,j/100);bh.push({massSolar:mass,radiusKm:schwarzschildRadiusKm(mass)});}path(bh,"cd-bh","horizon");
    var current=chartMap(model.massSolar,model.radiusKm),rs=chartMap(model.massSolar,model.boundary.schwarzschildRadiusKm);
    svg.appendChild(svgElement(doc,"circle",{cx:current[0],cy:current[1],r:6,class:"cd-point","data-point":"input"}));
    svg.appendChild(svgElement(doc,"circle",{cx:rs[0],cy:rs[1],r:4,class:"cd-rs","data-point":"horizon"}));
    txt(72,380,"蓝：NR 标度（μₑ="+formatNumber(mu,2)+"）；红虚线：r_s");
    txt(72,405,"金点：当前输入；红点：同质量的 r_s；输入点不是平衡解");
    return svg;
  }
  function gradientSvg(doc,model,id) {
    var svg=svgElement(doc,"svg",{class:"cd-svg",viewBox:"0 0 760 350",role:"img","aria-label":"给定EOS与TOV所需压力梯度的大小，同一归一化纵轴"});
    svg.appendChild(svgElement(doc,"title",{},"给定压力梯度是否满足TOV？"));
    var rows=[];for(var j=0;j<=100;j++)rows.push(tovPoint(model.massSolar,model.radiusKm,model.neutronStar.eos.id,j/100,model.neutronStar.densityProfile));
    var maximum=Math.max.apply(null,rows.flatMap(function(r){return[r.eosGradient,r.tovGradient===null?0:r.tovGradient];}));
    function txt(x,y,t,a){svg.appendChild(svgElement(doc,"text",Object.assign({x:x,y:y,class:"cd-small"},a||{}),t));}
    for(var v of [0,.5,1]){var y=260-180*v;svg.appendChild(svgElement(doc,"line",{x1:72,x2:712,y1:y,y2:y,class:"cd-grid"}));txt(62,y+4,String(v),{"text-anchor":"end"});}
    for(var f of [0,.25,.5,.75,1])txt(72+640*f,281,String(f),{"text-anchor":"middle"});
    for(var item of [["eosGradient","cd-wd"],["tovGradient","cd-bh"]]){var d="",start=true;for(var row of rows){if(row[item[0]]===null){start=true;continue;}d+=(start?"M":"L")+(72+640*row.fraction).toFixed(5)+" "+(260-180*row[item[0]]/maximum).toFixed(5)+" ";start=false;}svg.appendChild(svgElement(doc,"path",{d:d,class:item[1],"data-gradient":item[0]}));}
    txt(72,29,"梯度大小已归一化；共同最大值："+formatNumber(maximum,3)+" Pa/m");
    txt(72,54,"蓝：给定 EOS 的 −dP/dr；红虚线：TOV 要求；空段表示分母≤0");
    txt(712,306,"径向分数 r/R",{"text-anchor":"end"});txt(72,332,"两线重合才可能满足压力方程；质量积分闭合并不能替代这项检查。");
    return svg;
  }

  function regimeLabel(value){return value==="transition"?"相对论过渡区":value==="non-relativistic electron gas"?"非相对论区":"极端相对论区";}
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
    [["white-dwarf", "白矮星：电子简并"], ["neutron-star", "中子星：核物质 EOS/TOV"], ["black-hole", "几何对照：R 与 r_s"]].forEach(function (option) {
      objectSelect.appendChild(element(doc, "option", { value: option[0] }, option[1]));
    });
    objectControl.appendChild(objectSelect);
    controls.appendChild(objectControl);
    function sliderControl(label, key, min, max, step, ariaLabel) {
      var control = element(doc, "div", { className: "cd-control" });
      var labelNode = element(doc, "label", {}, label + " = ");
      var output = element(doc, "output", {});
      var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), "aria-label": ariaLabel });
      input.id="cd-"+serial+"-"+key;labelNode.htmlFor=input.id;output.setAttribute("for",input.id);
      labelNode.appendChild(output);
      control.appendChild(labelNode);
      control.appendChild(input);
      controls.appendChild(control);
      input.addEventListener("input", function () {
        var oldSupport=expectedAnswers(compactModel(state.objectType,state.massSolar,state.radiusKm,state.muE,state.eosId)).support;
        state[key] = Number(input.value);
        var newSupport=expectedAnswers(compactModel(state.objectType,state.massSolar,state.radiusKm,state.muE,state.eosId)).support;
        if(oldSupport!==newSupport){state.answers.support=null;state.revealed=false;}
        state.presetId = "custom";
        render();
      });
      return { input: input, output: output };
    }
    var massControl = sliderControl("质量 M/M☉", "massSolar", 0.2, 12, 0.01, "质量（太阳质量）");
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
    prediction.appendChild(question(doc, "densityExponent", "1. 非相对论压力 P 随粒子数密度 n 的幂指数？", [{ value: "five-thirds", label: "5/3" }, { value: "four-thirds", label: "4/3" }, { value: "two", label: "2" }], state, function(){state.revealed=false;render();}));
    prediction.appendChild(question(doc, "radiusTrend", "2. 在非相对论白矮星 toy 支路，M 增大时 R？", [{ value: "decrease", label: "按 M⁻¹ᐟ³ 减小" }, { value: "increase", label: "增大" }, { value: "constant", label: "不变" }], state, function(){state.revealed=false;render();}));
    prediction.appendChild(question(doc, "chandra", "3. 极端相对论 γ=4/3 与引力同为 R⁻⁴，留下什么边界？", [{ value: "mass-boundary", label: "质量上限量级" }, { value: "radius-law", label: "另一个 R 幂律" }, { value: "none", label: "没有边界" }], state, function(){state.revealed=false;render();}));
    prediction.appendChild(question(doc, "support", "4. 当前对象的支撑机制应归入？", [{ value: "electron", label: "电子简并" }, { value: "nuclear-eos", label: "中子/核物质 EOS" }, { value: "none", label: "不作静态星体支撑" }], state, function(){state.revealed=false;render();}));
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
      results.focus();
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
    reset.addEventListener("click",function(){prediction.querySelector("button").focus();});
    actions.appendChild(reveal);
    actions.appendChild(reset);
    prediction.appendChild(actions);
    prediction.appendChild(feedback);
    shell.appendChild(prediction);
    var results = element(doc, "section", { className: "cd-results", hidden: true, tabindex:"-1" });
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
        metrics.appendChild(metricBlock(doc, "当前输入的相对论区间", regimeLabel(model.fermi.regime)));
        metrics.appendChild(metricBlock(doc, "精确零温 P / Pa", formatNumber(model.fermi.exactPressure,3)));
        metrics.appendChild(metricBlock(doc, "NR相对误差",formatNumber(model.fermi.nrRelativeError,4)));
        metrics.appendChild(metricBlock(doc, "ER相对误差",formatNumber(model.fermi.erRelativeError,4)));
        metrics.appendChild(metricBlock(doc, "P_NR/P_grav", formatNumber(model.fermi.nonRelativisticRatio, 3)));
        metrics.appendChild(metricBlock(doc, "P_ER/P_grav", formatNumber(model.fermi.extremeRelativisticRatio, 3)));
        metrics.appendChild(metricBlock(doc, "理想 n=3 的 M_Ch/M☉", formatNumber(model.whiteDwarf.chandrasekharMassSolar, 3)));
      }
      if (model.neutronStar) {
        metrics.appendChild(metricBlock(doc, "GM/(Rc²)", formatNumber(model.neutronStar.compactness, 4)));
        metrics.appendChild(metricBlock(doc, "TOV/牛顿梯度", formatNumber(model.neutronStar.midpoint.relativisticCorrection, 3)));
        metrics.appendChild(metricBlock(doc, "中点压力梯度残差", formatNumber(model.neutronStar.midpoint.relativeResidual, 6)));
        metrics.appendChild(metricBlock(doc, "内部最大 2Gm/(rc²)",formatNumber(model.neutronStar.maxCompactnessRatio,4)));
        metrics.appendChild(metricBlock(doc, "中心 c_s²/c²",formatNumber(model.neutronStar.centerSoundSpeedRatio,4)));
        metrics.appendChild(metricBlock(doc, "最大质量", "未求解"));
        metrics.appendChild(metricBlock(doc, "c_s²/c²", formatNumber(model.neutronStar.midpoint.soundSpeedRatio, 3)));
      }
      results.appendChild(metrics);
      var stage = element(doc, "div", { className: "cd-stage",tabindex:"0",role:"region","aria-label":"质量半径图，可横向滚动" });
      stage.appendChild(massRadiusSvg(doc, model, "cd-stage-" + serial));
      results.appendChild(stage);
      if(model.neutronStar){var gs=element(doc,"div",{className:"cd-stage",tabindex:"0",role:"region","aria-label":"压力梯度图，可横向滚动"});gs.appendChild(gradientSvg(doc,model));results.appendChild(gs);}
      var ledgerWrap = element(doc, "div", { className: "cd-ledger-wrap",tabindex:"0",role:"region","aria-label":"模型账本，可横向滚动" });
      var table = element(doc, "table", { "aria-label": "致密天体模型账本" });
      table.appendChild(element(doc, "caption", {}, "模型、标度、支撑机制和边界必须分开读。"));
      var body = element(doc, "tbody");
      var rows = [
        ["对象", model.objectType==="white-dwarf"?"白矮星":model.objectType==="neutron-star"?"中子星":"几何对照", model.boundary.code==="black-hole"?"不作静态星体支撑":model.objectType==="white-dwarf"?"电子简并":model.objectType==="neutron-star"?"核物质 EOS":"仅比较面积半径"],
        ["边界", model.boundary.label, model.boundary.note],
        ["精度声明", model.whiteDwarf ? model.whiteDwarf.precisionStatus : model.neutronStar ? model.neutronStar.precisionStatus : "黑洞边界是几何判据，不是星体内部解"],
        ["质量—半径", model.whiteDwarf ? "R_toy∝M⁻¹ᐟ³（NR）" : model.neutronStar ? "由 TOV + EOS 决定；此处为一点/剖面 toy" : "R 与 r_s 比较，不延用白矮星幂律"]
      ];
      if (model.fermi) {
        rows.push(["当前输入相对论区间", regimeLabel(model.fermi.regime), "按 x=p_F/(mₑc) 标注；transition 不等于纯 NR"]);
        rows.push(["费米账", "n_e=" + formatNumber(model.fermi.electronDensity, 3) + " m⁻³", "P_NR∝n_e⁵ᐟ³；P_ER∝n_e⁴ᐟ³"]);
      }
      if (model.neutronStar) {
        rows.push(["TOV 中点", "r=" + formatNumber(model.neutronStar.midpoint.radiusKm, 2) + " km", "分母 1−2Gm/(rc²)=" + formatNumber(model.neutronStar.midpoint.denominator, 4)]);
        rows.push(["解析质量积分", "m(R)=M；ρ=ε/c²", "这不是独立静水平衡验证；另查压力梯度残差"]);
        rows.push(["EOS", model.neutronStar.eos.label, model.neutronStar.eos.note]);
      }
      rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, row.map(function (value,i) { return element(doc, i?"td":"th", i?{}:{scope:"row"}, value); })));
      });
      table.appendChild(body);
      ledgerWrap.appendChild(table);
      results.appendChild(ledgerWrap);
      if(model.neutronStar){
        var wrap=element(doc,"div",{className:"cd-ledger-wrap",tabindex:"0",role:"region","aria-label":"径向压力残差表，可横向滚动"});
        var tab=element(doc,"table",{});tab.appendChild(element(doc,"caption",{},"同一半径比较压力梯度；单位 Pa/m。中心与表面相对残差为 0/0。"));
        tab.appendChild(element(doc,"thead",{},element(doc,"tr",{},["r/R","g_EOS","g_TOV","相对残差","c_s²/c²","1−2Gm/(rc²)"].map(function(t){return element(doc,"th",{scope:"col"},t);}))))
        var tb=element(doc,"tbody",{});model.neutronStar.profile.forEach(function(row){tb.appendChild(element(doc,"tr",{},[row.fraction,row.eosGradient,row.tovGradient,row.relativeResidual,row.soundSpeedRatio,row.denominator].map(function(v,i){return element(doc,i?"td":"th",i?{}:{scope:"row"},formatNumber(v,4));})));});tab.appendChild(tb);wrap.appendChild(tab);results.appendChild(wrap);
      }
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

      render();
    });
    render();
  }

  function selfTest() {
    var checks=0;function check(x){checks++;if(!x)throw new Error("自检失败 "+checks);}
    var f=fermiScaling(1,7000,2);check(f.exactPressure>0);check(f.nonRelativisticPressure>f.exactPressure);check(f.extremeRelativisticPressure>f.exactPressure);
    check(Math.abs(chandrasekharOrderMassSolar(2)-1.457)<.002);
    var ns=neutronStarLedger(1.4,12,"soft");check(ns.midpoint.relativisticCorrection>1);check(ns.midpoint.relativeResidual!==0);check(ns.densityProfile.rows.at(-1).enclosedMassKg===1.4*M_SUN);
    check(compactModel("black-hole",10,20,2,"soft").boundary.code==="black-hole");check(formatNumber(10,0)==="10");check(formatNumber(1e-20)!=="0");
    PRESETS.forEach(function(p){check(!!compactModel(p.objectType,p.massSolar,p.radiusKm,p.muE,p.eosId).boundary.label);});
    return {checks:checks,presets:PRESETS.length};
  }

  return {
    CONSTANTS: { G: G, HBAR: HBAR, C: C, electronMass: M_E, protonMass: M_P, atomicMass:M_U, solarMass: M_SUN },
    PRESETS: PRESETS,
    EOS_PRESETS: EOS_PRESETS,
    presetForObjectType: presetForObjectType,
    fermiScaling: fermiScaling,
    fermiPressure:fermiPressure,formatNumber:formatNumber,massRadiusSvg:massRadiusSvg,gradientSvg:gradientSvg,
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
