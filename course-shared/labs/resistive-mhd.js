(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("resistive-mhd", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("resistive-mhd self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("resistive-mhd self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var PI = Math.PI;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-resistive-mhd-styles";
  var SERIAL = 0;
  var EPS = 1e-12;
  var MAX_MODE = 64;

  var LIMITS = {
    L: [0.5, 2],
    U: [0, 1.5],
    eta: [0, 0.25],
    B0: [0.1, 2],
    mode: [1, 8],
    phase: [-PI, PI],
    time: [0, 6],
    mu0: [0.1, 10]
  };

  var PRESETS = [
    {
      id: "ideal",
      label: "理想冻结 eta=0",
      note: "平流只搬运波形，振幅和磁能量不衰减。",
      L: 1,
      U: 0.6,
      eta: 0,
      B0: 1,
      mode: 1,
      phase: 0,
      time: 1.2
    },
    {
      id: "resistive",
      label: "有限电阻",
      note: "有限 Rm 下平流和磁扩散同时存在。",
      L: 1,
      U: 0.6,
      eta: 0.025,
      B0: 1,
      mode: 1,
      phase: 0,
      time: 1.2
    },
    {
      id: "pure-diffusion",
      label: "纯扩散 U=0",
      note: "没有平移，只有电阻扩散。",
      L: 1,
      U: 0,
      eta: 0.04,
      B0: 1,
      mode: 1,
      phase: 0,
      time: 1.5
    },
    {
      id: "mode-two",
      label: "波数 n=2",
      note: "同样的 eta 下，波数加倍使衰减率变为四倍。",
      L: 1,
      U: 0.6,
      eta: 0.015,
      B0: 1,
      mode: 2,
      phase: 0,
      time: 0.6
    },
    {
      id: "mode-four",
      label: "高波数 n=4",
      note: "短尺度结构的磁扩散时间更短。",
      L: 1,
      U: 0.6,
      eta: 0.005,
      B0: 1,
      mode: 4,
      phase: 0,
      time: 0.4
    }
  ];

  var STYLE_TEXT = [
    ".rmhd-lab{--rmhd-blue:var(--cl-blue,#2f6da0);--rmhd-gold:var(--cl-gold,#9a6b12);--rmhd-green:var(--cl-green,#34734c);--rmhd-red:var(--cl-red,#b34337);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".rmhd-lab *,.rmhd-lab *::before,.rmhd-lab *::after{box-sizing:border-box}.rmhd-lab [hidden]{display:none!important}.rmhd-lab h3,.rmhd-lab h4{margin:0;color:var(--fg);letter-spacing:0}.rmhd-lab h3{font-size:1.16rem}.rmhd-lab h4{font-size:1rem}.rmhd-lab p{margin:.65em 0}.rmhd-lab .rmhd-note,.rmhd-lab .rmhd-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}",
    ".rmhd-lab button,.rmhd-lab select,.rmhd-lab input{font:inherit;letter-spacing:0}.rmhd-lab button,.rmhd-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.rmhd-lab button:hover{border-color:var(--accent)}.rmhd-lab button:focus-visible,.rmhd-lab select:focus-visible,.rmhd-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.rmhd-lab button[aria-pressed=true],.rmhd-lab button.rmhd-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.rmhd-lab button:disabled{opacity:.55;cursor:not-allowed}.rmhd-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".rmhd-lab fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border);border-radius:6px}.rmhd-lab legend{max-width:100%;padding:0 4px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.rmhd-lab .rmhd-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.rmhd-lab .rmhd-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.rmhd-lab .rmhd-actions>*{flex:1 1 170px}.rmhd-lab .rmhd-feedback{min-height:2em;margin:8px 0;font-weight:700}.rmhd-lab .rmhd-pass{color:var(--rmhd-green)}.rmhd-lab .rmhd-warn{color:var(--rmhd-red)}",
    ".rmhd-lab .rmhd-experiment{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.rmhd-lab .rmhd-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:15px;align-items:start;min-width:0}.rmhd-lab .rmhd-controls,.rmhd-lab .rmhd-stage{min-width:0}.rmhd-lab .rmhd-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.rmhd-lab .rmhd-controls h4{margin:0}.rmhd-lab .rmhd-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.rmhd-lab .rmhd-presets button{font-size:12px}.rmhd-lab .rmhd-control-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px}.rmhd-lab .rmhd-control{display:grid;gap:4px;min-width:0}.rmhd-lab .rmhd-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.rmhd-lab .rmhd-control output{color:var(--accent);font-variant-numeric:tabular-nums}.rmhd-lab .rmhd-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}",
    ".rmhd-lab .rmhd-formula{margin:0 0 11px;padding:9px 11px;border-left:3px solid var(--rmhd-blue);background:var(--bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.7;overflow-x:auto}.rmhd-lab .rmhd-status{margin:10px 0;padding:9px 11px;border-left:3px solid var(--rmhd-green);background:var(--bg);font-size:13px;line-height:1.65}.rmhd-lab .rmhd-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:11px 0}.rmhd-lab .rmhd-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.rmhd-lab .rmhd-metric:nth-child(3n+1){border-top-color:var(--rmhd-blue)}.rmhd-lab .rmhd-metric:nth-child(3n+2){border-top-color:var(--rmhd-gold)}.rmhd-lab .rmhd-metric:nth-child(3n){border-top-color:var(--rmhd-red)}.rmhd-lab .rmhd-metric span{display:block;color:var(--fg-soft);font-size:11px;line-height:1.4}.rmhd-lab .rmhd-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".rmhd-lab .rmhd-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;min-width:0}.rmhd-lab .rmhd-chart{min-width:0}.rmhd-lab .rmhd-chart h4{margin:11px 0 7px;font-size:14px}.rmhd-lab .rmhd-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow:hidden}.rmhd-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.rmhd-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.rmhd-lab .rmhd-grid-line{stroke:currentColor;stroke-opacity:.16;stroke-width:1}.rmhd-lab .rmhd-axis-line{stroke:currentColor;stroke-opacity:.68;stroke-width:1.1}.rmhd-lab .rmhd-current-line{stroke:var(--rmhd-red);stroke-width:1.4;stroke-dasharray:4 4}.rmhd-lab .rmhd-initial-line{fill:none;stroke:var(--rmhd-blue);stroke-width:2;stroke-dasharray:6 4}.rmhd-lab .rmhd-current-field{fill:none;stroke:var(--rmhd-red);stroke-width:2.6}.rmhd-lab .rmhd-energy-line{fill:none;stroke:var(--rmhd-green);stroke-width:2.6}.rmhd-lab .rmhd-dot{fill:var(--rmhd-red);stroke:var(--bg);stroke-width:2}.rmhd-lab .rmhd-chart-title{font-size:12px;font-weight:750}.rmhd-lab .rmhd-axis-label{font-size:10px;fill:var(--fg-soft)}.rmhd-lab .rmhd-legend{display:flex;flex-wrap:wrap;gap:7px 13px;margin:7px 2px 0;color:var(--fg-soft);font-size:12px}.rmhd-lab .rmhd-legend-item{display:inline-flex;align-items:center;gap:5px}.rmhd-lab .rmhd-swatch{display:inline-block;width:18px;height:3px}.rmhd-lab .rmhd-swatch-blue{background:var(--rmhd-blue)}.rmhd-lab .rmhd-swatch-red{background:var(--rmhd-red)}.rmhd-lab .rmhd-swatch-green{background:var(--rmhd-green)}",
    ".rmhd-lab .rmhd-table-wrap{max-width:100%;margin-top:13px;overflow-x:auto;-webkit-overflow-scrolling:touch}.rmhd-lab table{width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.rmhd-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.rmhd-lab th,.rmhd-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.rmhd-lab th{color:var(--fg-soft);font-size:11.5px}.rmhd-lab .rmhd-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--rmhd-gold);background:var(--bg);color:var(--fg-soft);font-size:12.5px;line-height:1.7}.rmhd-lab .rmhd-limit{margin:10px 0 0;color:var(--fg-soft);font-size:12.5px;line-height:1.7}",
    "@media(max-width:980px){.rmhd-lab .rmhd-layout{grid-template-columns:minmax(0,1fr)}}",
    "@media(max-width:700px){.rmhd-lab .rmhd-choice-row,.rmhd-lab .rmhd-control-grid,.rmhd-lab .rmhd-chart-grid{grid-template-columns:minmax(0,1fr)}.rmhd-lab .rmhd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.rmhd-lab .rmhd-presets{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:420px){.rmhd-lab fieldset{padding:8px}.rmhd-lab .rmhd-controls{padding:9px}.rmhd-lab .rmhd-frame{padding:4px}.rmhd-lab .rmhd-metrics,.rmhd-lab .rmhd-presets{grid-template-columns:minmax(0,1fr)}.rmhd-lab table{font-size:11.5px}.rmhd-lab th,.rmhd-lab td{padding-left:5px;padding-right:5px}}",
    "@media(prefers-reduced-motion:reduce){.rmhd-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-10) * scale;
  }

  function numberOr(value, fallback) {
    var parsed = Number(value);
    return finite(parsed) ? parsed : fallback;
  }

  function validateParams(params) {
    if (!finite(params.L) || params.L <= 0) throw new RangeError("L must be positive and finite");
    if (!finite(params.U)) throw new RangeError("U must be finite");
    if (!finite(params.eta) || params.eta < 0) throw new RangeError("eta must be finite and non-negative");
    if (!finite(params.B0)) throw new RangeError("B0 must be finite");
    if (!finite(params.mode) || params.mode < 1 || params.mode > MAX_MODE || Math.floor(params.mode) !== params.mode) {
      throw new RangeError("mode must be an integer in [1, " + MAX_MODE + "]");
    }
    if (!finite(params.phase)) throw new RangeError("phase must be finite");
    if (!finite(params.time) || params.time < 0) throw new RangeError("time must be finite and non-negative");
    if (!finite(params.mu0) || params.mu0 <= 0) throw new RangeError("mu0 must be positive and finite");
  }

  function normalizeParams(input) {
    var raw = input || {};
    var params = {
      id: raw.id || "custom",
      L: numberOr(raw.L, 1),
      U: numberOr(raw.U, 0.6),
      eta: numberOr(raw.eta, 0.05),
      B0: numberOr(raw.B0, 1),
      mode: Math.round(numberOr(raw.mode !== undefined ? raw.mode : raw.n, 1)),
      phase: numberOr(raw.phase, 0),
      time: numberOr(raw.time !== undefined ? raw.time : raw.t, 1),
      mu0: numberOr(raw.mu0, 1)
    };
    validateParams(params);
    return params;
  }

  function copyPreset(preset) {
    return normalizeParams(preset);
  }

  function waveNumber(mode, length) {
    mode = Number(mode);
    length = Number(length);
    if (!finite(mode) || mode < 1 || Math.floor(mode) !== mode) throw new RangeError("mode must be a positive integer");
    if (!finite(length) || length <= 0) throw new RangeError("length must be positive");
    return 2 * PI * mode / length;
  }

  function resolveParams(input) {
    return input && input.params ? normalizeParams(input.params) : normalizeParams(input);
  }

  function timescales(input) {
    var params = resolveParams(input);
    var q = waveNumber(params.mode, params.L);
    var absU = Math.abs(params.U);
    var tauAdv = absU === 0 ? Infinity : params.L / absU;
    var tauDiff = params.eta === 0 ? Infinity : params.L * params.L / params.eta;
    var tauMode = params.eta === 0 ? Infinity : 1 / (params.eta * q * q);
    var tauEnergy = params.eta === 0 ? Infinity : 1 / (2 * params.eta * q * q);
    var rm = params.eta === 0 ? (absU === 0 ? null : Infinity) : absU * params.L / params.eta;
    return {
      q: q,
      tauAdv: tauAdv,
      tauDiff: tauDiff,
      tauModeDiff: tauMode,
      tauModeEnergy: tauEnergy,
      rm: rm,
      signedRm: params.eta === 0 ? (params.U === 0 ? null : params.U > 0 ? Infinity : -Infinity) : params.U * params.L / params.eta
    };
  }

  function amplitudeRatio(input, time) {
    var params = resolveParams(input);
    var t = time === undefined ? params.time : Number(time);
    if (!finite(t) || t < 0) throw new RangeError("time must be finite and non-negative");
    var q = waveNumber(params.mode, params.L);
    return Math.exp(-params.eta * q * q * t);
  }

  function magneticEnergyInitial(input) {
    var params = resolveParams(input);
    return params.B0 * params.B0 / (4 * params.mu0);
  }

  function energyRatio(input, time) {
    var ratio = amplitudeRatio(input, time);
    return ratio * ratio;
  }

  function magneticEnergy(input, time) {
    return magneticEnergyInitial(input) * energyRatio(input, time);
  }

  function fieldValue(input, x, time) {
    var params = resolveParams(input);
    var position = Number(x);
    var t = time === undefined ? params.time : Number(time);
    if (!finite(position)) throw new RangeError("x must be finite");
    if (!finite(t) || t < 0) throw new RangeError("time must be finite and non-negative");
    var q = waveNumber(params.mode, params.L);
    return params.B0 * Math.exp(-params.eta * q * q * t) *
      Math.cos(q * (position - params.U * t) + params.phase);
  }

  function sampleField(input, count, time) {
    var params = resolveParams(input);
    var size = Math.round(numberOr(count, 128));
    if (size < 2 || size > 2048) throw new RangeError("sample count must be in [2, 2048]");
    var t = time === undefined ? params.time : Number(time);
    if (!finite(t) || t < 0) throw new RangeError("time must be finite and non-negative");
    var values = [];
    var index;
    for (index = 0; index < size; index += 1) {
      var x = params.L * index / (size - 1);
      values.push({
        x: x,
        xOverL: x / params.L,
        value: fieldValue(params, x, t)
      });
    }
    return values;
  }

  function energyLedger(input, times) {
    var params = resolveParams(input);
    var q = waveNumber(params.mode, params.L);
    var initial = magneticEnergyInitial(params);
    var rows = times && times.length ? times : [0, params.time / 4, params.time / 2, 3 * params.time / 4, params.time];
    return rows.map(function (rawTime) {
      var t = Number(rawTime);
      if (!finite(t) || t < 0) throw new RangeError("ledger times must be finite and non-negative");
      var ratio = Math.exp(-2 * params.eta * q * q * t);
      var energy = initial * ratio;
      var lost = initial - energy;
      var integratedDissipation = initial * (1 - ratio);
      return {
        time: t,
        energy: energy,
        energyRatio: ratio,
        exactRatio: ratio,
        dissipated: lost,
        cumulativeDissipation: integratedDissipation,
        dissipationRate: 2 * params.eta * q * q * energy,
        balanceResidual: lost - integratedDissipation
      };
    });
  }

  function modeSolution(input) {
    var params = normalizeParams(input);
    var scales = timescales(params);
    var q = scales.q;
    var ampRatio = amplitudeRatio(params);
    var eRatio = ampRatio * ampRatio;
    var initialEnergy = magneticEnergyInitial(params);
    var currentEnergy = initialEnergy * eRatio;
    var solution = {
      params: params,
      q: q,
      waveNumber: q,
      amplitudeRatio: ampRatio,
      energyRatio: eRatio,
      initialEnergy: initialEnergy,
      magneticEnergy: currentEnergy,
      phaseShift: q * params.U * params.time,
      translatedDistance: params.U * params.time,
      decayRate: params.eta * q * q,
      energyDecayRate: 2 * params.eta * q * q,
      dEnergyDt: -2 * params.eta * q * q * currentEnergy,
      scales: scales,
      Rm: scales.rm,
      ledger: energyLedger(params)
    };
    solution.fieldAt = function (x, time) {
      return fieldValue(params, x, time === undefined ? params.time : time);
    };
    return solution;
  }

  function evaluate(input) {
    return modeSolution(input);
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }

    check(PRESETS.length >= 5, "preset coverage");
    check(PRESETS.some(function (item) { return item.eta === 0; }), "ideal preset");
    check(PRESETS.some(function (item) { return item.U === 0 && item.eta > 0; }), "pure diffusion preset");
    check(PRESETS.some(function (item) { return item.mode > 1; }), "higher-mode preset");

    var ideal = modeSolution(PRESETS[0]);
    check(ideal.amplitudeRatio === 1, "ideal amplitude is constant");
    check(ideal.energyRatio === 1, "ideal magnetic energy is constant");
    check(ideal.Rm === Infinity, "ideal Rm is infinite");
    check(ideal.scales.tauDiff === Infinity, "ideal diffusion time is infinite");
    check(near(ideal.fieldAt(0, 0), ideal.fieldAt(ideal.params.L, 0), 1e-12), "periodic field boundary");
    check(near(ideal.fieldAt(0, 1), ideal.fieldAt(ideal.params.L, 1), 1e-12), "periodic transported field boundary");

    var resistive = modeSolution(PRESETS[1]);
    check(resistive.amplitudeRatio < 1 && resistive.amplitudeRatio > 0, "finite eta damps amplitude");
    check(near(resistive.energyRatio, resistive.amplitudeRatio * resistive.amplitudeRatio, 1e-13), "energy is amplitude squared");
    check(resistive.scales.rm > 0 && finite(resistive.scales.rm), "finite Rm");
    check(near(resistive.scales.tauDiff / resistive.scales.tauAdv, resistive.scales.rm, 1e-12), "Rm equals time-scale ratio");
    check(near(resistive.dEnergyDt, -resistive.energyDecayRate * resistive.magneticEnergy, 1e-12), "energy derivative ledger");

    var pure = modeSolution(PRESETS[2]);
    check(pure.params.U === 0, "pure diffusion has zero velocity");
    check(pure.phaseShift === 0, "pure diffusion has no phase transport");
    check(pure.amplitudeRatio < 1, "pure diffusion damps");
    check(near(pure.fieldAt(0.23, pure.params.time) / pure.fieldAt(0.23, 0), pure.amplitudeRatio, 1e-10), "pure diffusion keeps phase");

    var modeOne = modeSolution({ L: 1, U: 0.5, eta: 0.03, B0: 1, mode: 1, phase: 0, time: 0.4 });
    var modeTwo = modeSolution({ L: 1, U: 0.5, eta: 0.03, B0: 1, mode: 2, phase: 0, time: 0.4 });
    check(near(modeTwo.q / modeOne.q, 2, 1e-12), "wave number scales with mode");
    check(near(modeTwo.decayRate / modeOne.decayRate, 4, 1e-12), "amplitude decay scales as n squared");
    check(near(modeTwo.energyDecayRate / modeOne.energyDecayRate, 4, 1e-12), "energy decay scales as n squared");

    var ledger = energyLedger(resistive.params);
    check(ledger.length === 5, "fixed ledger rows");
    ledger.forEach(function (row, index) {
      check(near(row.energyRatio, row.exactRatio, 1e-14), "exact ledger ratio " + index);
      check(near(row.balanceResidual, 0, 1e-13), "energy balance residual " + index);
      check(row.dissipationRate >= 0, "non-negative dissipation rate " + index);
    });

    var samples = sampleField(resistive.params, 33, resistive.params.time);
    check(samples.length === 33, "sample count");
    check(near(samples[0].value, samples[samples.length - 1].value, 1e-11), "sampled periodic endpoints");
    check(near(fieldValue(resistive.params, 0.17, 0.8), fieldValue(resistive.params, 1.17, 0.8), 1e-12), "periodic shift");

    var failed = false;
    try {
      normalizeParams({ eta: -0.1 });
    } catch (error) {
      failed = true;
    }
    check(failed, "negative eta rejected");

    var staticIdeal = modeSolution({ L: 1, U: 0, eta: 0, B0: 1, mode: 1, phase: 0, time: 2 });
    check(staticIdeal.Rm === null, "Rm is undefined when both advection and diffusion vanish");
    check(staticIdeal.phaseShift === 0 && staticIdeal.amplitudeRatio === 1, "static ideal endpoint neither translates nor decays");

    return {
      checks: checks,
      presets: PRESETS.length,
      modes: 4
    };
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function makeElement(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return appendChildren(node, children);
  }

  function makeSvg(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else node.setAttribute(key, String(value));
    });
    return appendChildren(node, children);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function textNode(doc, value) {
    return doc.createTextNode(String(value));
  }

  function svgText(doc, svg, x, y, value, className, extra) {
    var attrs = { x: x, y: y, className: className || "" };
    Object.keys(extra || {}).forEach(function (key) { attrs[key] = extra[key]; });
    svg.appendChild(makeSvg(doc, "text", attrs, [value]));
  }

  function pathFrom(points) {
    return points.map(function (point, index) {
      return (index === 0 ? "M " : "L ") + point[0].toFixed(2) + " " + point[1].toFixed(2);
    }).join(" ");
  }

  function drawFieldChart(doc, svg, result) {
    var width = 720;
    var height = 310;
    var left = 54;
    var right = 16;
    var top = 30;
    var bottom = 43;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var yLimit = 1.12;
    var params = result.params;
    var q = result.q;
    var amplitude = result.amplitudeRatio;
    var xMap = function (fraction) { return left + fraction * plotWidth; };
    var yMap = function (value) { return top + (yLimit - value) / (2 * yLimit) * plotHeight; };
    clear(svg);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Field transport");

    [-1, 0, 1].forEach(function (tick) {
      var y = yMap(tick);
      svg.appendChild(makeSvg(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, className: "rmhd-grid-line" }));
      svgText(doc, svg, left - 9, y + 4, String(tick), "rmhd-axis-label", { "text-anchor": "end" });
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      var x = xMap(tick);
      svg.appendChild(makeSvg(doc, "line", { x1: x, y1: top, x2: x, y2: height - bottom, className: "rmhd-grid-line" }));
      svgText(doc, svg, x, height - bottom + 17, tick.toFixed(2), "rmhd-axis-label", { "text-anchor": "middle" });
    });
    svg.appendChild(makeSvg(doc, "line", { x1: left, y1: yMap(0), x2: width - right, y2: yMap(0), className: "rmhd-axis-line" }));
    svg.appendChild(makeSvg(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, className: "rmhd-axis-line" }));

    var initial = [];
    var current = [];
    var count = 160;
    var index;
    for (index = 0; index <= count; index += 1) {
      var fraction = index / count;
      var x = params.L * fraction;
      initial.push([xMap(fraction), yMap(Math.cos(q * x + params.phase))]);
      current.push([xMap(fraction), yMap(amplitude * Math.cos(q * (x - params.U * params.time) + params.phase))]);
    }
    svg.appendChild(makeSvg(doc, "path", { d: pathFrom(initial), className: "rmhd-initial-line" }));
    svg.appendChild(makeSvg(doc, "path", { d: pathFrom(current), className: "rmhd-current-field" }));
    svgText(doc, svg, width / 2, 16, "Field transport", "rmhd-chart-title", { "text-anchor": "middle" });
    svgText(doc, svg, width / 2, height - 7, "x / L", "rmhd-axis-label", { "text-anchor": "middle" });
    svgText(doc, svg, 14, top + plotHeight / 2, "B_y / B_0", "rmhd-axis-label", { transform: "rotate(-90 14 " + (top + plotHeight / 2) + ")", "text-anchor": "middle" });
  }

  function drawEnergyChart(doc, svg, result) {
    var width = 720;
    var height = 280;
    var left = 54;
    var right = 16;
    var top = 30;
    var bottom = 43;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var tMax = Math.max(1, result.params.time * 1.08);
    if (finite(result.scales.tauAdv)) tMax = Math.max(tMax, Math.min(8, result.scales.tauAdv * 1.5));
    if (finite(result.scales.tauModeDiff)) tMax = Math.max(tMax, Math.min(8, result.scales.tauModeDiff * 1.5));
    tMax = Math.min(12, tMax);
    var xMap = function (time) { return left + time / tMax * plotWidth; };
    var yMap = function (value) { return top + (1.05 - value) / 1.05 * plotHeight; };
    clear(svg);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Magnetic energy decay");

    [0, 0.5, 1].forEach(function (tick) {
      var y = yMap(tick);
      svg.appendChild(makeSvg(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, className: "rmhd-grid-line" }));
      svgText(doc, svg, left - 9, y + 4, tick.toFixed(1), "rmhd-axis-label", { "text-anchor": "end" });
    });
    [0, tMax / 2, tMax].forEach(function (tick) {
      var x = xMap(tick);
      svg.appendChild(makeSvg(doc, "line", { x1: x, y1: top, x2: x, y2: height - bottom, className: "rmhd-grid-line" }));
      svgText(doc, svg, x, height - bottom + 17, tick.toFixed(2), "rmhd-axis-label", { "text-anchor": "middle" });
    });
    svg.appendChild(makeSvg(doc, "line", { x1: left, y1: yMap(0), x2: width - right, y2: yMap(0), className: "rmhd-axis-line" }));
    svg.appendChild(makeSvg(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, className: "rmhd-axis-line" }));

    var points = [];
    var count = 120;
    var index;
    for (index = 0; index <= count; index += 1) {
      var time = tMax * index / count;
      var ratio = Math.exp(-result.energyDecayRate * time);
      points.push([xMap(time), yMap(ratio)]);
    }
    svg.appendChild(makeSvg(doc, "path", { d: pathFrom(points), className: "rmhd-energy-line" }));
    var currentX = xMap(Math.min(result.params.time, tMax));
    var currentY = yMap(result.energyRatio);
    svg.appendChild(makeSvg(doc, "line", { x1: currentX, y1: top, x2: currentX, y2: height - bottom, className: "rmhd-current-line" }));
    svg.appendChild(makeSvg(doc, "circle", { cx: currentX, cy: currentY, r: 4.5, className: "rmhd-dot" }));
    svgText(doc, svg, width / 2, 16, "Magnetic energy decay", "rmhd-chart-title", { "text-anchor": "middle" });
    svgText(doc, svg, width / 2, height - 7, "t", "rmhd-axis-label", { "text-anchor": "middle" });
    svgText(doc, svg, 14, top + plotHeight / 2, "E_B / E_B(0)", "rmhd-axis-label", { transform: "rotate(-90 14 " + (top + plotHeight / 2) + ")", "text-anchor": "middle" });
  }

  function format(value, digits) {
    if (value === null) return "不定义";
    if (value === Infinity) return "∞";
    if (value === -Infinity) return "-∞";
    if (!finite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    var output = value.toFixed(places);
    return output.indexOf(".") === -1 ? output : output.replace(/0+$/, "").replace(/\.$/, "");
  }

  function metric(doc, label) {
    var value = makeElement(doc, "strong", { text: "—" });
    return {
      node: makeElement(doc, "div", { className: "rmhd-metric" }, [
        makeElement(doc, "span", { text: label }),
        value
      ]),
      value: value
    };
  }

  function renderLedger(doc, table, result) {
    clear(table);
    table.appendChild(makeElement(doc, "caption", { text: "单 Fourier 模态的磁能量精确账本：损失量 = 累积 Joule 耗散量" }));
    var head = makeElement(doc, "thead");
    var headRow = makeElement(doc, "tr");
    ["时刻 t", "E_B / E_B(0)", "解析式", "E_B(0)-E_B", "累积耗散", "账本残差"].forEach(function (label) {
      headRow.appendChild(makeElement(doc, "th", { scope: "col", text: label }));
    });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = makeElement(doc, "tbody");
    result.ledger.forEach(function (row) {
      var tr = makeElement(doc, "tr");
      [
        format(row.time, 3),
        format(row.energyRatio, 6),
        "exp(-" + format(result.energyDecayRate, 3) + " t)",
        format(row.dissipated, 6),
        format(row.cumulativeDissipation, 6),
        format(row.balanceResidual, 3)
      ].forEach(function (value) {
        tr.appendChild(makeElement(doc, "td", { text: value }));
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
  }

  function mount(rootElement, api) {
    if (!rootElement || !rootElement.ownerDocument) return;
    var doc = rootElement.ownerDocument;
    installStyles(doc);
    var uid = "rmhd-" + (++SERIAL);
    var state = copyPreset(PRESETS[1]);
    var answers = {};
    var QUESTIONS = [
      {
        key: "ideal",
        prompt: "eta=0 且 U>0 时，单一 Fourier 模态会怎样？",
        options: [
          { value: "translate", label: "只平移，幅度不变" },
          { value: "damp", label: "不动但指数衰减" },
          { value: "grow", label: "平移且指数增长" }
        ],
        expected: "translate"
      },
      {
        key: "mode",
        prompt: "固定 eta 和 t，把波数 n 加倍后，振幅衰减率怎样？",
        options: [
          { value: "same", label: "不变" },
          { value: "double", label: "变成 2 倍" },
          { value: "quadruple", label: "变成 4 倍" }
        ],
        expected: "quadruple"
      },
      {
        key: "pure",
        prompt: "U=0 且 eta>0 时，波形的主导变化是什么？",
        options: [
          { value: "translate", label: "只向右平移" },
          { value: "diffuse", label: "不平移，只扩散" },
          { value: "freeze", label: "完全冻结" }
        ],
        expected: "diffuse"
      },
      {
        key: "energy",
        prompt: "单模态磁能量的精确比值 E_B(t)/E_B(0) 是？",
        options: [
          { value: "amplitude", label: "exp(-eta q^2 t)" },
          { value: "energy", label: "exp(-2 eta q^2 t)" },
          { value: "linear", label: "1 - eta q^2 t" }
        ],
        expected: "energy"
      }
    ];

    var shell = makeElement(doc, "div", { className: "rmhd-lab" });
    shell.appendChild(makeElement(doc, "p", {
      className: "rmhd-note",
      text: "先完成四项预测，再打开周期一维磁场输运实验。模型使用解析 Fourier 模态推进，不做不稳定的显式 PDE 时间步。"
    }));

    var prediction = makeElement(doc, "div", { className: "rmhd-prediction" });
    prediction.appendChild(makeElement(doc, "h3", { text: "预测门：四问全部作答后揭晓" }));
    var choiceButtons = [];
    QUESTIONS.forEach(function (question, questionIndex) {
      var fieldset = makeElement(doc, "fieldset");
      fieldset.appendChild(makeElement(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
      var row = makeElement(doc, "div", { className: "rmhd-choice-row" });
      choiceButtons[questionIndex] = [];
      question.options.forEach(function (option) {
        var button = makeElement(doc, "button", { type: "button", text: option.label, "aria-pressed": "false" });
        button.addEventListener("click", function () {
          answers[question.key] = option.value;
          renderPrediction();
        });
        choiceButtons[questionIndex].push({ value: option.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      prediction.appendChild(fieldset);
    });
    var predictionActions = makeElement(doc, "div", { className: "rmhd-actions" });
    var reveal = makeElement(doc, "button", { type: "button", className: "rmhd-primary", text: "核对预测并揭晓" });
    var resetPrediction = makeElement(doc, "button", { type: "button", text: "重置预测" });
    var feedback = makeElement(doc, "p", { className: "rmhd-feedback", text: "请先对四个问题作出选择。" });
    predictionActions.appendChild(reveal);
    predictionActions.appendChild(resetPrediction);
    prediction.appendChild(predictionActions);
    prediction.appendChild(feedback);
    shell.appendChild(prediction);

    var experiment = makeElement(doc, "section", {
      className: "rmhd-experiment",
      hidden: true,
      "aria-labelledby": uid + "-experiment-title"
    });
    experiment.appendChild(makeElement(doc, "h3", { id: uid + "-experiment-title", text: "实验台：周期一维磁场输运" }));
    experiment.appendChild(makeElement(doc, "p", {
      className: "rmhd-note",
      text: "L=1、B0=1、mu0=1 是归一化选择；U 与 eta 为常数，速度场不接受磁场反馈。预设覆盖理想冻结、有限电阻、纯扩散和不同波数。"
    }));

    var layout = makeElement(doc, "div", { className: "rmhd-layout" });
    var controls = makeElement(doc, "div", { className: "rmhd-controls" });
    controls.appendChild(makeElement(doc, "h4", { text: "参数与预设" }));
    var presetRow = makeElement(doc, "div", { className: "rmhd-presets" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(doc, "button", { type: "button", text: preset.label, title: preset.note, "aria-pressed": "false" });
      button.addEventListener("click", function () {
        state = copyPreset(preset);
        render();
      });
      presetButtons.push({ id: preset.id, node: button });
      presetRow.appendChild(button);
    });
    controls.appendChild(presetRow);
    var controlGrid = makeElement(doc, "div", { className: "rmhd-control-grid" });
    var inputRefs = {};

    function addRange(key, label, min, max, step, digits, suffix) {
      var output = makeElement(doc, "output", { text: "—" });
      var caption = makeElement(doc, "label", { text: label + "：" });
      caption.appendChild(output);
      var input = makeElement(doc, "input", {
        type: "range",
        min: min,
        max: max,
        step: step,
        "aria-label": label
      });
      input.addEventListener("input", function () {
        state[key] = Number(input.value);
        if (key === "mode") state[key] = Math.round(state[key]);
        state.id = "custom";
        render();
      });
      var wrapper = makeElement(doc, "div", { className: "rmhd-control" }, [
        caption,
        input,
        makeElement(doc, "div", { className: "rmhd-scale" }, [
          makeElement(doc, "span", { text: String(min) }),
          makeElement(doc, "span", { text: String(max) })
        ])
      ]);
      inputRefs[key] = { input: input, output: output, digits: digits, suffix: suffix || "" };
      controlGrid.appendChild(wrapper);
    }

    addRange("U", "平流速度 U", LIMITS.U[0], LIMITS.U[1], 0.05, 2, "");
    addRange("eta", "磁扩散率 eta", LIMITS.eta[0], LIMITS.eta[1], 0.005, 3, "");
    addRange("mode", "波数模式 n", LIMITS.mode[0], LIMITS.mode[1], 1, 0, "");
    addRange("time", "观察时间 t", LIMITS.time[0], LIMITS.time[1], 0.05, 2, "");
    controls.appendChild(controlGrid);
    var relock = makeElement(doc, "button", { type: "button", text: "重新预测" });
    controls.appendChild(relock);
    layout.appendChild(controls);

    var stage = makeElement(doc, "div", { className: "rmhd-stage" });
    var formula = makeElement(doc, "div", {
      className: "rmhd-formula",
      text: "B_y(x,t)=B_0 exp(-eta q^2 t) cos(q(x-Ut)+phi),  q=2 pi n/L"
    });
    stage.appendChild(formula);
    var metrics = makeElement(doc, "div", { className: "rmhd-metrics" });
    var metricRefs = [
      metric(doc, "磁雷诺数 Rm"),
      metric(doc, "平流时间 tau_adv"),
      metric(doc, "整段扩散时间 tau_diff"),
      metric(doc, "模态扩散时间 tau_mode"),
      metric(doc, "振幅比 A/A0"),
      metric(doc, "磁能量比 E/E0"),
      metric(doc, "账本残差")
    ];
    metricRefs.forEach(function (item) { metrics.appendChild(item.node); });
    stage.appendChild(metrics);
    var status = makeElement(doc, "p", { className: "rmhd-status", role: "status", "aria-live": "polite" });
    stage.appendChild(status);

    var chartGrid = makeElement(doc, "div", { className: "rmhd-chart-grid" });
    var fieldChart = makeElement(doc, "div", { className: "rmhd-chart" });
    fieldChart.appendChild(makeElement(doc, "h4", { text: "磁场形状" }));
    var fieldSvg = makeSvg(doc, "svg");
    fieldChart.appendChild(makeElement(doc, "div", { className: "rmhd-frame" }, fieldSvg));
    fieldChart.appendChild(makeElement(doc, "div", { className: "rmhd-legend" }, [
      makeElement(doc, "span", { className: "rmhd-legend-item" }, [
        makeElement(doc, "i", { className: "rmhd-swatch rmhd-swatch-blue" }),
        textNode(doc, "Initial")
      ]),
      makeElement(doc, "span", { className: "rmhd-legend-item" }, [
        makeElement(doc, "i", { className: "rmhd-swatch rmhd-swatch-red" }),
        textNode(doc, "Current")
      ])
    ]));
    var energyChart = makeElement(doc, "div", { className: "rmhd-chart" });
    energyChart.appendChild(makeElement(doc, "h4", { text: "磁能量" }));
    var energySvg = makeSvg(doc, "svg");
    energyChart.appendChild(makeElement(doc, "div", { className: "rmhd-frame" }, energySvg));
    energyChart.appendChild(makeElement(doc, "div", { className: "rmhd-legend" }, [
      makeElement(doc, "span", { className: "rmhd-legend-item" }, [
        makeElement(doc, "i", { className: "rmhd-swatch rmhd-swatch-green" }),
        textNode(doc, "Exact")
      ]),
      makeElement(doc, "span", { className: "rmhd-legend-item" }, [
        makeElement(doc, "i", { className: "rmhd-swatch rmhd-swatch-red" }),
        textNode(doc, "Current")
      ])
    ]));
    chartGrid.appendChild(fieldChart);
    chartGrid.appendChild(energyChart);
    stage.appendChild(chartGrid);

    var tableWrap = makeElement(doc, "div", { className: "rmhd-table-wrap" });
    var ledgerTable = makeElement(doc, "table");
    tableWrap.appendChild(ledgerTable);
    stage.appendChild(tableWrap);
    stage.appendChild(makeElement(doc, "p", {
      className: "rmhd-interpretation",
      text: "周期边界使平流项在积分账本中抵消；剩下的磁扩散项让磁能量单调下降。残差接近 0 是解析解与账本相互核对的证书，不是一次不稳定时间步的经验结果。"
    }));
    stage.appendChild(makeElement(doc, "p", {
      className: "rmhd-limit",
      text: "边界：这个 toy 不含磁场对速度的反馈，不含磁重联、Hall/动理学尺度、激波、聚变约束或一般三维发电机；它只展示常系数周期一维感应方程。"
    }));
    layout.appendChild(stage);
    experiment.appendChild(layout);
    shell.appendChild(experiment);
    clear(rootElement);
    rootElement.appendChild(shell);

    function renderPrediction() {
      choiceButtons.forEach(function (buttons, questionIndex) {
        var key = QUESTIONS[questionIndex].key;
        buttons.forEach(function (choice) {
          choice.node.setAttribute("aria-pressed", answers[key] === choice.value ? "true" : "false");
        });
      });
    }

    function render() {
      var result = modeSolution(state);
      Object.keys(inputRefs).forEach(function (key) {
        var ref = inputRefs[key];
        ref.input.value = String(state[key]);
        ref.output.textContent = (key === "mode" ? "n=" + format(state[key], ref.digits) : format(state[key], ref.digits)) + ref.suffix;
      });
      presetButtons.forEach(function (button) {
        button.node.setAttribute("aria-pressed", state.id === button.id ? "true" : "false");
      });
      metricRefs[0].value.textContent = format(result.Rm, 3);
      metricRefs[1].value.textContent = format(result.scales.tauAdv, 3);
      metricRefs[2].value.textContent = format(result.scales.tauDiff, 3);
      metricRefs[3].value.textContent = format(result.scales.tauModeDiff, 3);
      metricRefs[4].value.textContent = format(result.amplitudeRatio, 6);
      metricRefs[5].value.textContent = format(result.energyRatio, 6);
      metricRefs[6].value.textContent = format(result.ledger[result.ledger.length - 1].balanceResidual, 3);
      var regime = state.eta === 0 && state.U === 0
        ? "静止理想极限：U=eta=0，当前模态既不平移也不衰减；Rm=0/0 不定义。"
        : state.eta === 0
        ? "理想冻结：eta=0，当前模态只平移不衰减。"
        : state.U === 0
          ? "纯扩散：U=0，波形不平移，磁能量按精确指数式下降。"
          : "有限电阻：平流与扩散并存，Rm 比较两者的相对强弱。";
      status.textContent = regime + " 当前 q=" + format(result.q, 3) + "；Rm=" + format(result.Rm, 3) +
        "；tau_adv=" + format(result.scales.tauAdv, 3) + "；tau_diff=" + format(result.scales.tauDiff, 3) + "。";
      drawFieldChart(doc, fieldSvg, result);
      drawEnergyChart(doc, energySvg, result);
      renderLedger(doc, ledgerTable, result);
    }

    reveal.addEventListener("click", function () {
      var complete = QUESTIONS.every(function (question) { return answers[question.key]; });
      if (!complete) {
        feedback.className = "rmhd-feedback rmhd-warn";
        feedback.textContent = "请先完成四项预测，揭晓前实验台保持锁定。";
        return;
      }
      var correct = QUESTIONS.filter(function (question) {
        return answers[question.key] === question.expected;
      }).length;
      feedback.className = "rmhd-feedback " + (correct === QUESTIONS.length ? "rmhd-pass" : "rmhd-warn");
      feedback.textContent = "已记录 " + correct + "/" + QUESTIONS.length + " 项预测；现在可以用预设和解析账本核对。";
      experiment.removeAttribute("hidden");
      render();
    });

    resetPrediction.addEventListener("click", function () {
      answers = {};
      renderPrediction();
      experiment.setAttribute("hidden", "hidden");
      feedback.className = "rmhd-feedback";
      feedback.textContent = "预测已清空，请重新作答。";
    });

    relock.addEventListener("click", function () {
      answers = {};
      renderPrediction();
      experiment.setAttribute("hidden", "hidden");
      feedback.className = "rmhd-feedback";
      feedback.textContent = "实验台已重新锁定，请先完成四项预测。";
    });

    renderPrediction();
  }

  return {
    LIMITS: LIMITS,
    PRESETS: PRESETS,
    normalizeParams: normalizeParams,
    waveNumber: waveNumber,
    timescales: timescales,
    amplitudeRatio: amplitudeRatio,
    energyRatio: energyRatio,
    magneticEnergy: magneticEnergy,
    fieldValue: fieldValue,
    sampleField: sampleField,
    energyLedger: energyLedger,
    modeSolution: modeSolution,
    solveMode: modeSolution,
    evaluate: evaluate,
    mount: mount,
    selfTest: selfTest
  };
});
