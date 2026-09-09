(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("turbulence-cascade", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("turbulence-cascade self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)\n");
    } catch (error) {
      process.stderr.write("turbulence-cascade self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-turbulence-cascade-styles";
  var EPS = 1e-12;
  var MIN_INERTIAL_DECADES = 1;
  var MIN_INERTIAL_SAMPLES = 2;
  var DEFAULT_SAMPLE_COUNT = 9;
  var INSTANCE = 0;

  var SPECTRUM_CONVENTION = {
    kind: "3D isotropic shell-integrated energy spectrum per unit mass",
    integral: "integral from 0 to infinity E(k) dk = 1/2 <u_i u_i>",
    units: "L^3 T^-2 (m^3 s^-2 per unit mass)",
    waveNumber: "k approximately 1/r",
    cKNote: "C_K depends on the 1D or 3D spectrum and the Fourier normalization"
  };

  var PRESETS = [
    {
      id: "wide-inertial",
      label: "高 Re：宽惯性区",
      L: 1,
      nu: 1e-5,
      epsilon: 1,
      p: 6
    },
    {
      id: "intermittency",
      label: "间歇性：高阶比较",
      L: 0.6,
      nu: 3e-5,
      epsilon: 0.4,
      p: 6
    },
    {
      id: "narrow",
      label: "边界：没有宽惯性区",
      L: 0.1,
      nu: 1e-3,
      epsilon: 0.05,
      p: 6
    },
    {
      id: "moderate",
      label: "中等 Re：谨慎读图",
      L: 0.8,
      nu: 1e-4,
      epsilon: 0.8,
      p: 4
    }
  ];

  var DEFAULT = { presetId: "wide-inertial", Ck: 1.5 };

  var STYLE_TEXT = [
    ".cascade-lab{--cas-blue:#315f9d;--cas-gold:#91620c;--cas-green:#39734d;--cas-red:#b64335;max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".cascade-lab *,.cascade-lab *::before,.cascade-lab *::after{box-sizing:border-box}.cascade-lab [hidden]{display:none!important}.cascade-lab h3,.cascade-lab h4{margin:0;color:var(--fg);letter-spacing:0}.cascade-lab h3{font-size:1.18rem}.cascade-lab h4{font-size:1rem}",
    ".cascade-lab button,.cascade-lab input{font:inherit}.cascade-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.cascade-lab button:hover{border-color:var(--accent)}.cascade-lab button[aria-pressed='true'],.cascade-lab button.cascade-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.cascade-lab button:focus-visible,.cascade-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.cascade-lab button:disabled{cursor:not-allowed;opacity:.55}",
    ".cascade-lab .cascade-note,.cascade-lab .cascade-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.cascade-lab .cascade-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cas-gold);background:var(--bg)}.cascade-lab fieldset{min-width:0;margin:0;padding:0;border:0}.cascade-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750}.cascade-lab .cascade-preset-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.cascade-lab .cascade-preset-grid button,.cascade-lab .cascade-choice-grid button{font-size:12px}.cascade-lab .cascade-question-list{display:grid;gap:10px;margin-top:13px}.cascade-lab .cascade-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.cascade-lab .cascade-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.cascade-lab .cascade-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.cascade-lab .cascade-actions>*{flex:1 1 170px}.cascade-lab .cascade-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.cascade-lab .cascade-pass{color:var(--cas-green)}.cascade-lab .cascade-warn{color:var(--cas-red)}",
    ".cascade-lab .cascade-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.cascade-lab .cascade-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 16px;margin:12px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.cascade-lab .cascade-control{display:grid;gap:5px;min-width:0}.cascade-lab .cascade-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.cascade-lab .cascade-control output{color:var(--accent);font-variant-numeric:tabular-nums}.cascade-lab .cascade-control input[type=range]{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".cascade-lab .cascade-chart-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;min-width:0}.cascade-lab .cascade-chart{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.cascade-lab .cascade-chart-wide{grid-column:1/-1}.cascade-lab .cascade-svg{display:block;width:100%;min-width:700px;height:auto;color:var(--fg)}.cascade-lab .cascade-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.cascade-lab .cascade-grid-line{stroke:var(--border);stroke-width:1;stroke-opacity:.7}.cascade-lab .cascade-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.75}.cascade-lab .cascade-spectrum{stroke:var(--cas-blue);fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.cascade-lab .cascade-reference{stroke:var(--cas-gold);fill:none;stroke-width:1.8;stroke-dasharray:6 5}.cascade-lab .cascade-extrapolation{stroke:var(--cas-red);fill:none;stroke-width:1.8;stroke-dasharray:5 5;stroke-linecap:round;stroke-linejoin:round;opacity:.78}.cascade-lab .cascade-flux{stroke:var(--cas-green);fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.cascade-lab .cascade-sl{stroke:var(--cas-red);fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.cascade-lab .cascade-k41{stroke:var(--cas-blue);fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}",
    ".cascade-lab .cascade-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:8px;margin:12px 0}.cascade-lab .cascade-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.cascade-lab .cascade-metric:nth-child(1),.cascade-lab .cascade-metric:nth-child(4){border-top-color:var(--cas-blue)}.cascade-lab .cascade-metric:nth-child(2),.cascade-lab .cascade-metric:nth-child(5){border-top-color:var(--cas-gold)}.cascade-lab .cascade-metric:nth-child(3),.cascade-lab .cascade-metric:nth-child(6){border-top-color:var(--cas-green)}.cascade-lab .cascade-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.cascade-lab .cascade-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.cascade-lab .cascade-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.cascade-lab table{width:100%;min-width:920px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.cascade-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.cascade-lab th,.cascade-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.cascade-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.cascade-lab .cascade-good{color:var(--cas-green);font-weight:750}.cascade-lab .cascade-bad{color:var(--cas-red);font-weight:750}.cascade-lab .cascade-score{margin:8px 0;color:var(--accent);font-weight:750}.cascade-lab .cascade-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--cas-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:900px){.cascade-lab .cascade-chart-grid{grid-template-columns:minmax(0,1fr)}.cascade-lab .cascade-chart-wide{grid-column:auto}.cascade-lab .cascade-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.cascade-lab .cascade-preset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cascade-lab .cascade-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:430px){.cascade-lab .cascade-preset-grid,.cascade-lab .cascade-controls{grid-template-columns:minmax(0,1fr)}.cascade-lab .cascade-chart{padding:5px}}@media(prefers-reduced-motion:reduce){.cascade-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ,"[data-theme=dark] .cascade-lab{--cas-blue:#90baff;--cas-gold:#e9c46a;--cas-green:#90d6ab;--cas-red:#ffab9e}.cascade-chart:focus-visible,.cascade-table-wrap:focus-visible{outline:3px solid var(--cas-blue);outline-offset:2px} [data-theme=dark] .cascade-lab button[aria-pressed=true],[data-theme=dark] .cascade-lab button.cascade-primary{background:#90baff;color:#17202c;border-color:#90baff}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function positive(value, name) {
    if (!finite(value) || value <= 0) throw new RangeError(name + " must be a finite positive number");
    return value;
  }
  function bounded(value, min, max, name) {
    if (!finite(value) || value < min || value > max) throw new RangeError(name + " outside supported domain");
    return value;
  }
  function sampleCount(value) {
    var n = value === undefined ? DEFAULT_SAMPLE_COUNT : value;
    if (!Number.isInteger(n) || n < 1 || n > 401) throw new RangeError("sample count must be an integer from 1 to 401");
    return n;
  }
  function inWindow(r, lo, hi) { return lo <= hi && r >= lo * (1 - 8 * Number.EPSILON) && r <= hi * (1 + 8 * Number.EPSILON); }
  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) if (PRESETS[index].id === id) return PRESETS[index];
    throw new RangeError("unknown preset");
  }
  function kolmogorovScale(nu, epsilon) {
    return positive(Math.exp((3 * Math.log(positive(nu, "nu")) - Math.log(positive(epsilon, "epsilon"))) / 4), "eta output");
  }
  function largeScaleVelocity(L, epsilon) {
    return positive(Math.exp((Math.log(positive(epsilon, "epsilon")) + Math.log(positive(L, "L"))) / 3), "velocity output");
  }
  function largeScaleReynolds(L, nu, epsilon) {
    return positive(Math.exp(Math.log(largeScaleVelocity(L, epsilon)) + Math.log(positive(L, "L")) - Math.log(positive(nu, "nu"))), "Re output");
  }
  function scaleRatio(L, nu, epsilon) { return positive(positive(L, "L") / kolmogorovScale(nu, epsilon), "ratio output"); }
  function velocityIncrement(epsilon, r) { return largeScaleVelocity(r, epsilon); }
  function eddyTurnoverTime(epsilon, r) {
    return positive(Math.exp((2 * Math.log(positive(r, "r")) - Math.log(positive(epsilon, "epsilon"))) / 3), "time output");
  }
  function energySpectrum(epsilon, k, Ck) {
    return positive(Math.exp(Math.log(positive(Ck === undefined ? 1.5 : Ck, "Ck")) +
      2 / 3 * Math.log(positive(epsilon, "epsilon")) - 5 / 3 * Math.log(positive(k, "k"))), "spectrum output");
  }
  function energyFlux(epsilon, r, eta, L) {
    positive(epsilon, "epsilon");
    if (r === undefined && eta === undefined && L === undefined) return epsilon;
    positive(r, "r"); positive(eta, "eta"); positive(L, "L");
    return inWindow(r, 10 * eta, L / 10) ? epsilon : null;
  }
  function normalizedFlux(epsilon, flux) {
    positive(epsilon, "epsilon"); if (flux === null) return null;
    if (!finite(flux) || !finite(flux / epsilon)) throw new RangeError("finite flux required");
    return flux / epsilon;
  }
  function fourFifthLaw(epsilon, r) { return -positive(4 / 5 * positive(epsilon, "epsilon") * positive(r, "r"), "S3 magnitude"); }
  function normalizedFourFifth(epsilon, r, value) {
    positive(epsilon, "epsilon"); positive(r, "r");
    var signed = value === undefined ? fourFifthLaw(epsilon, r) : value;
    if (signed === null) return null;
    if (!finite(signed) || !finite(-signed / epsilon / r)) throw new RangeError("finite S3 required");
    return -signed / epsilon / r;
  }
  function k41Exponent(order) { return bounded(order, 0, 12, "order") / 3; }
  function sheLevequeExponent(order) {
    var p = bounded(order, 0, 12, "order");
    return p / 9 - 2 * Math.expm1(p / 3 * Math.log(2 / 3));
  }
  // Prescribed smooth S2, with constant large-scale forcing correlation.
  // This closes a balance identity; it is not a Navier–Stokes solution.
  function viscousBalance(epsilon, nu, r) {
    positive(epsilon, "epsilon"); positive(nu, "nu"); positive(r, "r");
    var eta = kolmogorovScale(nu, epsilon), b = Math.pow(30, 3 / 4);
    var q = Math.pow(r / (b * eta), 2);
    var S2 = epsilon / (15 * nu) * r * r / Math.pow(1 + q, 2 / 3);
    var viscous = .8 * (1 + q / 3) / Math.pow(1 + q, 5 / 3);
    // expm1 avoids cancellation in the small-r difference 0.8 - viscous.
    var normalizedS3 = -.8 * Math.expm1(Math.log1p(q / 3) - 5 / 3 * Math.log1p(q));
    if (![q, S2, viscous, normalizedS3].every(finite)) throw new RangeError("balance output unrepresentable");
    return {r:r, eta:eta, q:q, S2:S2, viscous:viscous, normalizedS3:normalizedS3,
      S3:-epsilon*r*normalizedS3, total:viscous+normalizedS3, model:"prescribed-S2-constant-forcing"};
  }

  function countSamplesInWindow(L, eta, lower, upper, count) {
    var total = sampleCount(count);
    positive(L, "L"); positive(eta, "eta"); positive(lower, "lower"); positive(upper, "upper");
    if (lower >= upper || L <= eta) return 0;
    var hits = 0;
    for (var index = 0; index < total; index += 1) {
      var fraction = total === 1 ? 0.5 : index / (total - 1);
      var r = eta * Math.pow(L / eta, fraction);
      if (inWindow(r, lower, upper)) hits += 1;
    }
    return hits;
  }

  function inertialRange(L, eta, sampleCount) {
    var large = positive(L, "L");
    var small = positive(eta, "eta");
    var lower = 10 * small;
    var upper = large / 10;
    var geometricValid = lower < upper;
    var decades = geometricValid ? Math.log10(upper / lower) : 0;
    var widthSufficient = geometricValid && decades >= MIN_INERTIAL_DECADES - 8 * Number.EPSILON;
    var count = sampleCount === undefined ? countSamplesInWindow(large, small, lower, upper, DEFAULT_SAMPLE_COUNT) :
      countSamplesInWindow(large, small, lower, upper, sampleCount);
    var enoughSamples = count >= MIN_INERTIAL_SAMPLES;
    return {
      lower: lower,
      upper: upper,
      geometricValid: geometricValid,
      widthSufficient: widthSufficient,
      sampleCount: count,
      enoughSamples: enoughSamples,
      minimumDecades: MIN_INERTIAL_DECADES,
      minimumSamples: MIN_INERTIAL_SAMPLES,
      valid: widthSufficient && enoughSamples,
      decades: decades
    };
  }

  function assumptions(overrides) {
    var result = {
      incompressible: true,
      homogeneous: true,
      isotropic: true,
      stationary: true,
      highRe: true,
      threeDimensionalForwardCascade: true
    };
    if (overrides !== undefined && (!overrides || typeof overrides !== "object" || Array.isArray(overrides))) throw new TypeError("assumptions must be an object");
    Object.keys(overrides || {}).forEach(function (key) {
      if (!Object.hasOwn(result, key) || typeof overrides[key] !== "boolean") throw new TypeError("unknown or nonboolean assumption");
      result[key] = overrides[key];
    });
    return result;
  }

  function assumptionsSatisfied(flags) {
    return Object.keys(assumptions()).every(function (key) { return flags[key] === true; });
  }

  function makeTeachingWindow(range, flags) {
    var assumptionsOK = assumptionsSatisfied(flags);
    var rangeOK = range.widthSufficient && range.enoughSamples === true;
    var status = assumptionsOK && rangeOK ? "under-assumed-conditions" :
      assumptionsOK ? "insufficient-inertial-window" : "assumptions-not-satisfied";
    return {
      status: status,
      assumptionsSatisfied: assumptionsOK,
      underAssumedConditions: assumptionsOK && rangeOK,
      widthSufficient: range.widthSufficient,
      enoughSamples: range.enoughSamples === true,
      minimumDecades: MIN_INERTIAL_DECADES,
      minimumSamples: MIN_INERTIAL_SAMPLES,
      decades: range.decades,
      sampleCount: range.sampleCount,
      valid: assumptionsOK && rangeOK
    };
  }

  function scaleSamples(config, count) {
    var rows = [];
    var total = sampleCount(count);
    var teachingWindow = makeTeachingWindow(config.inertialRange, assumptions(config.assumptions));
    for (var index = 0; index < total; index += 1) {
      var fraction = total === 1 ? 0.5 : index / (total - 1);
      var r = config.eta * Math.pow(config.L / config.eta, fraction);
      var inRange = inWindow(r, config.inertialRange.lower, config.inertialRange.upper);
      var certified = inRange && teachingWindow.valid;
      var deltaUFormula = velocityIncrement(config.epsilon, r);
      var turnoverFormula = eddyTurnoverTime(config.epsilon, r);
      var spectrumFormula = energySpectrum(config.epsilon, 1 / r, config.Ck);
      var fourFifthFormula = fourFifthLaw(config.epsilon, r);
      var status = certified ? "under-assumed-conditions" : "extrapolation";
      rows.push({
        index: index,
        r: r,
        k: 1 / r,
        kProxy: 1 / r,
        region: r < config.inertialRange.lower ? "耗散侧" : r > config.inertialRange.upper ? "含能侧" : "惯性区",
        inInertialRange: inRange,
        certified: certified,
        certificateStatus: status,
        deltaUStatus: status,
        turnoverStatus: status,
        spectrumStatus: status,
        fluxStatus: status,
        fourFifthStatus: status,
        deltaUFormula: deltaUFormula,
        turnoverFormula: turnoverFormula,
        spectrumFormula: spectrumFormula,
        fourFifthFormula: fourFifthFormula,
        deltaU: certified ? deltaUFormula : null,
        turnover: certified ? turnoverFormula : null,
        spectrum: certified ? spectrumFormula : null,
        flux: certified ? config.epsilon : null,
        fourFifth: certified ? fourFifthFormula : null,
        piOverEpsilon: certified ? normalizedFlux(config.epsilon, config.epsilon) : null,
        minusS3OverEpsilonR: certified ? normalizedFourFifth(config.epsilon, r, fourFifthFormula) : null,
        piOverEpsilonFormula: normalizedFlux(config.epsilon, config.epsilon),
        minusS3OverEpsilonRFormula: normalizedFourFifth(config.epsilon, r, fourFifthFormula)
      });
    }
    return rows;
  }

  function makeExponentTable() {
    var orders = Array.from({length:13},function(_,i){return i;});
    return orders.map(function (order) {
      return {
        order: order,
        k41: k41Exponent(order),
        sheLeveque: sheLevequeExponent(order),
        difference: sheLevequeExponent(order) - k41Exponent(order)
      };
    });
  }

  function compute(input) {
    var source = input === undefined ? {} : input;
    if (!source || typeof source !== "object" || Array.isArray(source)) throw new TypeError("config must be an object");
    Object.keys(source).forEach(function (key) { if (!["presetId","L","nu","epsilon","Ck","p","assumptions"].includes(key)) throw new TypeError("unknown option: " + key); });
    var preset = presetById(source.presetId === undefined ? DEFAULT.presetId : source.presetId);
    var L = source.L === undefined ? preset.L : source.L;
    var nu = source.nu === undefined ? preset.nu : source.nu;
    var epsilon = source.epsilon === undefined ? preset.epsilon : source.epsilon;
    var Ck = source.Ck === undefined ? DEFAULT.Ck : source.Ck;
    var order = source.p === undefined ? preset.p : source.p;
    L = bounded(L, 0.01, 10, "L");
    nu = bounded(nu, 1e-7, 1e-2, "nu");
    epsilon = bounded(epsilon, 1e-6, 100, "epsilon");
    Ck = bounded(Ck, 0.1, 4, "Ck");
    order = bounded(order, 1, 12, "p");
    if (!Number.isInteger(order)) throw new RangeError("integer order required");
    var eta = kolmogorovScale(nu, epsilon);
    var range = inertialRange(L, eta, DEFAULT_SAMPLE_COUNT);
    var reynolds = largeScaleReynolds(L, nu, epsilon);
    var assumptionFlags = assumptions(source.assumptions);
    if (!source.assumptions || source.assumptions.highRe === undefined) assumptionFlags.highRe = reynolds >= 1e3;
    var config = {
      presetId: preset.id,
      label: preset.label,
      L: L,
      nu: nu,
      epsilon: epsilon,
      Ck: Ck,
      p: order,
      eta: eta,
      kEta: 1 / eta,
      U: largeScaleVelocity(L, epsilon),
      Re: reynolds,
      ratio: L / eta,
      inertialRange: range,
      assumptions: assumptionFlags,
      spectrumConvention: SPECTRUM_CONVENTION
    };
    config.teachingWindow = makeTeachingWindow(config.inertialRange, config.assumptions);
    config.samples = scaleSamples(config, DEFAULT_SAMPLE_COUNT);
    config.exponents = makeExponentTable();
    config.selectedExponent = {
      order: order,
      k41: k41Exponent(order),
      sheLeveque: sheLevequeExponent(order),
      difference: sheLevequeExponent(order) - k41Exponent(order)
    };
    config.fourFifth = {
      coefficient: -4 / 5 * epsilon,
      sign: "negative",
      longitudinalIncrement: "delta u_parallel = [u(x+r)-u(x)] dot r_hat, with r_hat from x to x+r",
      exactConditions: ["incompressible", "homogeneous", "isotropic", "stationary", "high-Re", "three-dimensional forward cascade", "vanishing viscous and finite-forcing corrections in the inertial limit"],
      underAssumedConditions: config.teachingWindow.valid,
      status: config.teachingWindow.status
    };
    config.fluxLedger = config.samples.map(function (row) {
      return {
        r: row.r,
        flux: row.flux,
        piOverEpsilon: row.piOverEpsilon,
        minusS3OverEpsilonR: row.minusS3OverEpsilonR,
        inInertialRange: row.inInertialRange,
        certified: row.certified,
        status: row.certificateStatus
      };
    });
    config.balance = config.samples.map(function (row) { return viscousBalance(epsilon, nu, row.r); });
    return config;
  }

  function format(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(value)) return "不可表示";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    return places === 0 ? value.toFixed(0) : value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = value;
      else if (key === "htmlFor") node.setAttribute("for", value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    append(node, children, doc);
    return node;
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (key === "className") key = "class";
      if (value !== undefined && value !== null && value !== false) node.setAttribute(key, String(value));
    });
    append(node, children, doc);
    return node;
  }

  function append(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
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

  function metric(doc, label, value) {
    return element(doc, "div", { className: "cascade-metric" }, [
      element(doc, "span", { text: label }),
      element(doc, "strong", { text: value })
    ]);
  }

  function logBounds(a,b) {
    var lo=Math.min(a,b),hi=Math.max(a,b);
    if (Math.log(hi)-Math.log(lo)<1e-9) {lo/=Math.sqrt(10);hi*=Math.sqrt(10);}
    return [lo,hi];
  }
  function logPosition(v,range,left,right) {return left+(Math.log(v)-Math.log(range[0]))/(Math.log(range[1])-Math.log(range[0]))*(right-left);}
  function plot(doc,svg,uid,title,desc,xRange,yRange,logY,xLabel,yLabel) {
    clear(svg); svg.setAttribute("viewBox","0 0 760 360");svg.setAttribute("role","img");
    svg.appendChild(svgElement(doc,"title",{id:uid+"-title"},title));
    svg.appendChild(svgElement(doc,"desc",{id:uid+"-desc"},desc));svg.setAttribute("aria-labelledby",uid+"-title "+uid+"-desc");
    var left=90,right=730,top=80,bottom=290;
    function x(v){return logPosition(v,xRange,left,right);}
    function y(v){return logY ? logPosition(v,yRange,bottom,top) : bottom-(v-yRange[0])/(yRange[1]-yRange[0])*(bottom-top);}
    svg.appendChild(svgElement(doc,"text",{x:left,y:22,"font-size":14,"font-weight":750},title));
    svg.appendChild(svgElement(doc,"text",{x:left,y:65,"font-size":11},yLabel));
    [0,.25,.5,.75,1].forEach(function(f){
      var xv=Math.exp(Math.log(xRange[0])+f*(Math.log(xRange[1])-Math.log(xRange[0])));
      var yv=logY?Math.exp(Math.log(yRange[0])+f*(Math.log(yRange[1])-Math.log(yRange[0]))):yRange[0]+f*(yRange[1]-yRange[0]);
      svg.appendChild(svgElement(doc,"line",{x1:x(xv),x2:x(xv),y1:top,y2:bottom,className:"cascade-grid-line"}));
      svg.appendChild(svgElement(doc,"line",{x1:left,x2:right,y1:y(yv),y2:y(yv),className:"cascade-grid-line"}));
      svg.appendChild(svgElement(doc,"text",{x:x(xv),y:bottom+20,"text-anchor":"middle","font-size":10,"data-tick":"x","data-value":xv},format(xv,3)));
      svg.appendChild(svgElement(doc,"text",{x:left-9,y:y(yv)+4,"text-anchor":"end","font-size":10,"data-tick":"y","data-value":yv},format(yv,3)));
    });
    svg.appendChild(svgElement(doc,"path",{d:"M90 80V290H730",fill:"none",className:"cascade-axis"}));
    svg.appendChild(svgElement(doc,"text",{x:410,y:343,"text-anchor":"middle","font-size":12},xLabel));
    return {x:x,y:y,line:function(rows,xf,yf,cls,name){
      if(rows.length<2)return;
      svg.appendChild(svgElement(doc,"path",{d:rows.map(function(row,i){return(i?"L":"M")+x(row[xf]).toFixed(5)+","+y(row[yf]).toFixed(5);}).join(" "),className:cls,"data-curve":name}));
    }};
  }
  function chartNote(doc,svg,text){svg.appendChild(svgElement(doc,"text",{x:90,y:43,"font-size":11},text));}
  function drawScale(doc,svg,data,uid){
    clear(svg);svg.setAttribute("viewBox","0 0 760 225");svg.setAttribute("role","img");
    svg.appendChild(svgElement(doc,"title",{id:uid+"-title"},"注入尺度与耗散尺度的对数比较"));
    svg.appendChild(svgElement(doc,"desc",{id:uid+"-desc"},"阴影仅表示人为选取的教学候选带。尺度不足时不画惯性区；标记附米制数值。"));svg.setAttribute("aria-labelledby",uid+"-title "+uid+"-desc");
    var range=logBounds(data.eta,data.L);function x(v){return logPosition(v,range,90,730);}
    svg.appendChild(svgElement(doc,"text",{x:90,y:22,"font-size":14,"font-weight":750},"尺度分离：L/η = "+format(data.ratio,3)));
    svg.appendChild(svgElement(doc,"text",{x:90,y:45,"font-size":11},data.L>data.eta?"候选带 10η ≤ r ≤ L/10；着色不表示已经测得惯性区":"L ≤ η：这组尺度不支持正向级串的尺度分离"));
    svg.appendChild(svgElement(doc,"rect",{x:90,y:72,width:640,height:32,fill:"var(--cas-red)",opacity:.15}));
    if(data.inertialRange.geometricValid)svg.appendChild(svgElement(doc,"rect",{x:x(data.inertialRange.lower),y:72,width:x(data.inertialRange.upper)-x(data.inertialRange.lower),height:32,fill:"var(--cas-green)",opacity:.3,"data-band":"candidate"}));
    [[data.eta,"η",130],[data.L,"L",156]].forEach(function(v){var xx=x(v[0]);svg.appendChild(svgElement(doc,"line",{x1:xx,x2:xx,y1:67,y2:v[2]-12,className:"cascade-axis","data-endpoint":v[1],"data-value":v[0]}));svg.appendChild(svgElement(doc,"text",{x:xx,y:v[2],"text-anchor":xx<140?"start":xx>680?"end":"middle","font-size":12},v[1]+" = "+format(v[0],4)+" m"));});
    svg.appendChild(svgElement(doc,"text",{x:90,y:191,"font-size":12},data.teachingWindow.valid?"显示规则满足：公式参考带已展开；仍需实测检验假设与能量平衡。":"显示规则未满足：曲线保留为公式外推，不报告惯性区读数。"));
    svg.appendChild(svgElement(doc,"text",{x:90,y:214,"font-size":11},"1 decade 和 2 个采样点只是排版规则；都不是湍流或 4/5 律的充分条件。"));
  }
  function drawSpectrum(doc,svg,data,uid){
    var rows=data.samples,xr=logBounds(1/data.L,1/data.eta),values=rows.map(function(r){return r.spectrumFormula;}),yr=logBounds(Math.min.apply(null,values),Math.max.apply(null,values));
    var g=plot(doc,svg,uid,"能谱：负五分之三斜率的公式基线","双对数坐标，三维壳层谱按单位质量计。所有点由同一公式生成，不能用自身斜率证明K41。",xr,yr,true,"波数代理 k≈1/r（m⁻¹，对数）","E(k)（m³/s²，对数）");
    g.line(rows,"k","spectrumFormula","cascade-extrapolation","spectrum-formula");
    g.line(rows.filter(function(r){return r.certified;}),"k","spectrum","cascade-spectrum","spectrum-reference");
    chartNote(doc,svg,"红虚线：全部公式外推；蓝实线：教学参考带。两者都是生成值。");
  }
  function drawFlux(doc,svg,data,uid){
    var g=plot(doc,svg,uid,"惯性极限：两个不同的无量纲量","绿色Pi除以epsilon等于1，金色负S3除以epsilon r等于0.8；它们是不同量，不应重合。",logBounds(data.eta,data.L),[0,1.2],false,"间隔 r（m，对数）","Π/ε 与 −S₃/(εr)");
    g.line(data.samples,"r","piOverEpsilonFormula","cascade-extrapolation","flux-formula");g.line(data.samples,"r","minusS3OverEpsilonRFormula","cascade-extrapolation","s3-formula");
    var rows=data.samples.filter(function(r){return r.certified;});g.line(rows,"r","piOverEpsilon","cascade-flux","flux-reference");g.line(rows,"r","minusS3OverEpsilonR","cascade-reference","s3-reference");
    chartNote(doc,svg,"绿：Π/ε = 1；金：−S₃/(εr) = 0.8；红虚线：区外公式。");
  }
  function drawBalance(doc,svg,data,uid){
    var xr=logBounds(data.eta,data.L),rows=[];
    for(var i=0;i<=160;i++){var r=Math.exp(Math.log(xr[0])+i/160*(Math.log(xr[1])-Math.log(xr[0])));rows.push(viscousBalance(data.epsilon,data.nu,r));}
    var g=plot(doc,svg,uid,"有限黏性：三阶矩项 + 黏性项 = 0.8","给定光滑S2并把强迫相关设为常数的平衡构造。蓝线是负S3除以epsilon r，绿色是6nu S2导数除以epsilon r，金线为二者之和。不是湍流数据。",xr,[0,1],false,"间隔 r（m，对数）","无量纲能量平衡项");
    g.line(rows,"r","normalizedS3","cascade-spectrum","balance-s3");g.line(rows,"r","viscous","cascade-flux","balance-viscous");g.line(rows,"r","total","cascade-reference","balance-total");
    chartNote(doc,svg,"蓝：−S₃/(εr)；绿：6νS₂′/(εr)；金：总和。强迫常数近似仅用于 r≪L。");
  }
  function drawExponents(doc,svg,data,uid){
    // Plot helper uses a log x axis; shift p by one to reuse only its frame, then replace x ticks.
    var g=plot(doc,svg,uid,"绝对值结构函数：高阶指数如何偏离基线","横轴阶数p是线性刻度；蓝线K41，红线She–Leveque模型。圆点标记当前阶数。",[1,Math.exp(1)],[0,4.5],false,"阶数 p（线性）","ζₚ");
    Array.from(svg.querySelectorAll('[data-tick="x"]')).forEach(function(t,i){t.textContent=String(i*3);t.setAttribute("data-value",i*3);});
    var rows=[];for(var p=0;p<=12;p+=.125)rows.push({x:Math.exp(p/12),k:k41Exponent(p),sl:sheLevequeExponent(p)});
    g.line(rows,"x","k","cascade-k41","exponent-k41");g.line(rows,"x","sl","cascade-sl","exponent-sl");
    [data.selectedExponent.k41,data.selectedExponent.sheLeveque].forEach(function(v,i){svg.appendChild(svgElement(doc,"circle",{cx:90+640*data.p/12,cy:g.y(v),r:5,fill:i?"var(--cas-red)":"var(--cas-blue)","data-selected":i?"sl":"k41"}));});
    chartNote(doc,svg,"当前 p="+data.p+"：K41 "+format(data.selectedExponent.k41,3)+"；She–Lévêque "+format(data.selectedExponent.sheLeveque,3)+"。signed S₃ 的符号另计。");
  }

  function scaleTable(doc, data) {
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "尺度读数（SI 单位）；只在教学参考带填入公式值，— 表示本表不报告该尺度的近似值。所有行都不是测量数据" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "区域" }),
      element(doc, "th", { scope: "col", text: "r (m)" }),
      element(doc, "th", { scope: "col", text: "k≈1/r (m⁻¹)" }),
      element(doc, "th", { scope: "col", text: "δu (m/s)" }),
      element(doc, "th", { scope: "col", text: "τr (s)" }),
      element(doc, "th", { scope: "col", text: "E (m³/s²)" }),
      element(doc, "th", { scope: "col", text: "Π (m²/s³)" }),
      element(doc, "th", { scope: "col", text: "S₃ (m³/s³)" }),
      element(doc, "th", { scope: "col", text: "公式适用标记" })
    ])));
    var body = element(doc, "tbody", {});
    data.samples.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { scope: "row", className: row.certified ? "cascade-good" : row.inInertialRange ? "cascade-bad" : "", text:
          row.certified ? "教学参考带" : row.inInertialRange ? "惯性区候选（外推）" : row.region }),
        element(doc, "td", { text: format(row.r, 6) }),
        element(doc, "td", { text: format(row.k, 6) }),
        element(doc, "td", { text: format(row.deltaU, 6) }),
        element(doc, "td", { text: format(row.turnover, 6) }),
        element(doc, "td", { text: format(row.spectrum, 6) }),
        element(doc, "td", { className: row.flux === null ? "cascade-bad" : "cascade-good", text: format(row.flux, 6) }),
        element(doc, "td", { className: row.fourFifth === null ? "cascade-bad" : "cascade-good", text: format(row.fourFifth, 6) }),
        element(doc, "td", { className: row.certified ? "cascade-good" : "cascade-bad", text: row.certified ? "假设下的公式" : "外推／不报告" })
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function buildExponentTable(doc, data) {
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "常用绝对值高阶结构函数 |δu|^p 的 K41 与间歇性指数对照；signed S₃ 单独记账" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "p" }),
      element(doc, "th", { scope: "col", text: "K41 ζp=p/3" }),
      element(doc, "th", { scope: "col", text: "She–Lévêque ζp" }),
      element(doc, "th", { scope: "col", text: "差值" })
    ])));
    var body = element(doc, "tbody", {});
    data.exponents.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { scope: "row", text: String(row.order) }),
        element(doc, "td", { text: format(row.k41, 6) }),
        element(doc, "td", { className: row.order > 3 ? "cascade-good" : "", text: format(row.sheLeveque, 6) }),
        element(doc, "td", { text: format(row.difference, 6) })
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var instanceId = "cl-cascade-" + (++INSTANCE);
    var base = presetById(DEFAULT.presetId);
    var state = {
      presetId: DEFAULT.presetId,
      L: base.L,
      nu: base.nu,
      epsilon: base.epsilon,
      p: base.p,
      predictions: { flux: null, sign: null, intermittency: null },
      revealed: false,
      score: null
    };

    function current() {
      return compute({
        presetId: state.presetId,
        L: state.L,
        nu: state.nu,
        epsilon: state.epsilon,
        p: state.p
      });
    }

    function resetToPrediction() {
      var defaultPreset = presetById(DEFAULT.presetId);
      state.presetId = DEFAULT.presetId;
      state.L = defaultPreset.L;
      state.nu = defaultPreset.nu;
      state.epsilon = defaultPreset.epsilon;
      state.p = defaultPreset.p;
      state.predictions = { flux: null, sign: null, intermittency: null };
      state.revealed = false;
      state.score = null;
      render();
      root.querySelector(".cascade-choice-grid button").focus();
      api && api.announce && api.announce(root, "已重置；结果重新隐藏。");
    }

    function choiceButton(group, value, label) {
      var button = element(doc, "button", {
        type: "button",
        "aria-pressed": state.predictions[group] === value ? "true" : "false",
        text: label
      });
      button.addEventListener("click", function () {
        state.predictions[group] = value;
        render();
        root.querySelectorAll(".cascade-choice-grid")[{flux:0,sign:1,intermittency:2}[group]].querySelector("[aria-pressed=true]").focus();
      });
      return button;
    }

    function render() {
      var data = current();
      var shell = element(doc, "div", { className: "cascade-lab" });
      shell.appendChild(element(doc, "h3", { text: "K41 级串、黏性修正与间歇性" }));
      shell.appendChild(element(doc, "p", { className: "cascade-note", text:
        "先作通量、符号和高阶指数预测；核对后才显示预设与尺度账。所有曲线由确定性公式生成，不是 DNS。" }));
      if (!state.revealed) {
        shell.appendChild(element(doc, "div", { className: "cascade-prompt" }, [
          element(doc, "strong", { text: "预测门：" }),
          element(doc, "span", { text: "把通量、三阶矩符号和间歇性指数先写成一句话，再打开尺度账。" })
        ]));
        var questions = element(doc, "div", { className: "cascade-question-list" });
        questions.appendChild(element(doc, "div", { className: "cascade-question" }, [
          element(doc, "strong", { text: "1. 惯性区能量通量 Π(r) 如何随尺度变？" }),
          element(doc, "div", { className: "cascade-choice-grid", role: "group", "aria-label": "通量预测" }, [
            choiceButton("flux", "constant", "近似恒定 ε"),
            choiceButton("flux", "grows", "随 r 增大"),
            choiceButton("flux", "decays", "随 r 衰减")
          ])
        ]));
        questions.appendChild(element(doc, "div", { className: "cascade-question" }, [
          element(doc, "strong", { text: "2. 三维正向级串的 S₃ 符号？" }),
          element(doc, "div", { className: "cascade-choice-grid", role: "group", "aria-label": "四五律符号预测" }, [
            choiceButton("sign", "negative", "负"),
            choiceButton("sign", "positive", "正"),
            choiceButton("sign", "zero", "零")
          ])
        ]));
        questions.appendChild(element(doc, "div", { className: "cascade-question" }, [
          element(doc, "strong", { text: "3. 间歇性模型在 p=6 的 ζ6 相比 K41=2？" }),
          element(doc, "div", { className: "cascade-choice-grid", role: "group", "aria-label": "间歇性预测" }, [
            choiceButton("intermittency", "lower", "更小"),
            choiceButton("intermittency", "equal", "相等"),
            choiceButton("intermittency", "higher", "更大")
          ])
        ]));
        shell.appendChild(questions);
        var actions = element(doc, "div", { className: "cascade-actions" });
        var check = element(doc, "button", { type: "button", className: "cascade-primary", text: "核对预测" });
        var reset = element(doc, "button", { type: "button", text: "重置" });
        var feedback = element(doc, "p", { className: "cascade-feedback", role: "status", "aria-live": "polite" });
        check.addEventListener("click", function () {
          if (!state.predictions.flux || !state.predictions.sign || !state.predictions.intermittency) {
            feedback.className = "cascade-feedback cascade-warn";
            feedback.textContent = "三项预测都要先选择。";
            return;
          }
          var expected = data.selectedExponent.sheLeveque < data.selectedExponent.k41 ? "lower" : "equal";
          var correct = (state.predictions.flux === "constant" ? 1 : 0) +
            (state.predictions.sign === "negative" ? 1 : 0) +
            (state.predictions.intermittency === expected ? 1 : 0);
          state.score = correct;
          state.revealed = true;
          render();
          root.querySelector(".cascade-preset-grid button").focus();
          api && api.announce && api.announce(root, "预测已核对：" + correct + " / 3；尺度账已揭示。");
        });
        reset.addEventListener("click", function () {
          resetToPrediction();
        });
        actions.appendChild(check);
        actions.appendChild(reset);
        shell.appendChild(actions);
        shell.appendChild(feedback);
      } else {
        var panel = element(doc, "section", { className: "cascade-revealed", "aria-labelledby": instanceId + "-title" });
        panel.appendChild(element(doc, "h4", { id: instanceId + "-title", text: "结果与可调尺度账" }));
        panel.appendChild(element(doc, "p", { className: "cascade-score", role: "status", "aria-live": "polite", text:
          "预测得分 " + state.score + "/3；此分数在切换预设和拖动参数时保留。" }));
        var presetField = element(doc, "fieldset", {});
        presetField.appendChild(element(doc, "legend", { text: "揭示后探索尺度预设" }));
        var presetGrid = element(doc, "div", { className: "cascade-preset-grid", role: "group", "aria-label": "湍流尺度预设" });
        PRESETS.forEach(function (preset) {
          var button = element(doc, "button", {
            type: "button",
            "aria-pressed": state.presetId === preset.id && state.L === preset.L && state.nu === preset.nu && state.epsilon === preset.epsilon && state.p === preset.p ? "true" : "false",
            title: preset.label,
            text: preset.label
          });
          button.addEventListener("click", function () {
            state.presetId = preset.id;
            state.L = preset.L;
            state.nu = preset.nu;
            state.epsilon = preset.epsilon;
            state.p = preset.p;
            render();
            root.querySelector(".cascade-preset-grid [aria-pressed=true]").focus();
          });
          presetGrid.appendChild(button);
        });
        presetField.appendChild(presetGrid);
        panel.appendChild(presetField);
        var revealedActions = element(doc, "div", { className: "cascade-actions" });
        var revealedReset = element(doc, "button", { type: "button", text: "重置并重新预测" });
        revealedReset.addEventListener("click", function () {
          resetToPrediction();
        });
        revealedActions.appendChild(revealedReset);
        panel.appendChild(revealedActions);
        panel.appendChild(element(doc, "p", { className: "cascade-note", text:
          "本实验先假设不可压、齐次、各向同性、统计定常、三维正向级串；高 Re 指示只按 Re≥1000 切换。1 decade 与 2 个采样点是显示规则，不是物理证明。下方有限黏性图演算给定 S₂ 的能量平衡，接近 L 时仍忽略强迫变化。" }));
        panel.appendChild(element(doc, "p", { className: "cascade-note", text:
          "谱约定：" + SPECTRUM_CONVENTION.integral + "；单位 " + SPECTRUM_CONVENTION.units + "。这里的 C_K 依赖 1D/3D 谱定义与 Fourier 归一化，k 只作 k≈1/r 的尺度代理。" }));
        var controls = element(doc, "div", { className: "cascade-controls" });
        function rangeControl(id, label, min, max, step, value, outputText, handler) {
          var control = element(doc, "div", { className: "cascade-control" }, [
            element(doc, "label", { htmlFor: id, text: label }),
            element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, value: value }),
            element(doc, "output", { text: outputText })
          ]);
          control.querySelector("input").addEventListener("input", function (event) {
            handler(Number(event.target.value));
            render();
            root.querySelector("#"+id).focus();
          });
          return control;
        }
        controls.appendChild(rangeControl(instanceId + "-L", "注入尺度 L（m）", 0.05, 2, 0.01, data.L, format(data.L, 3), function (value) { state.L = value; }));
        controls.appendChild(rangeControl(instanceId + "-nu", "运动黏度 ν（m²/s，10 的指数）", -6, -2, "any",
          Math.log10(data.nu), "10^" + format(Math.log10(data.nu), 2), function (value) { state.nu = Math.pow(10, value); }));
        controls.appendChild(rangeControl(instanceId + "-epsilon", "耗散率 ε（m²/s³）", 0.01, 2, 0.01, data.epsilon,
          format(data.epsilon, 3), function (value) { state.epsilon = value; }));
        controls.appendChild(rangeControl(instanceId + "-p", "结构函数阶数 p", 1, 12, 1, data.p, String(data.p), function (value) { state.p = value; }));
        panel.appendChild(controls);
        panel.appendChild(element(doc, "div", { className: "cascade-metrics" }, [
          metric(doc, "Kolmogorov η（m）", format(data.eta, 6)),
          metric(doc, "尺度比 L/η", format(data.ratio, 5)),
          metric(doc, "大尺度 Re", format(data.Re, 5)),
          metric(doc, "教学窗口", data.teachingWindow.valid ? format(data.teachingWindow.decades, 3) + " 个数量级 / " + data.teachingWindow.sampleCount + " 点" :
            format(data.teachingWindow.decades, 3) + " 个数量级 / " + data.teachingWindow.sampleCount + " 点（外推）"),
          metric(doc, "Π/ε 公式", data.teachingWindow.valid ? "≈ 1" : "不报告"),
          metric(doc, "4/5 律", data.fourFifth.underAssumedConditions ? "惯性极限公式" : "不报告")
        ]));
        var charts = element(doc, "div", { className: "cascade-chart-grid" });
        var scaleChart = element(doc, "div", { className: "cascade-chart cascade-chart-wide", tabindex: "0", "aria-label": "可横向滚动的图表" });
        var scaleSvg = svgElement(doc, "svg", { className: "cascade-svg" });
        drawScale(doc, scaleSvg, data, instanceId + "-scale");
        scaleChart.appendChild(scaleSvg);
        charts.appendChild(scaleChart);
        var spectrumChart = element(doc, "div", { className: "cascade-chart", tabindex: "0", "aria-label": "可横向滚动的图表" });
        var spectrumSvg = svgElement(doc, "svg", { className: "cascade-svg" });
        drawSpectrum(doc, spectrumSvg, data, instanceId + "-spectrum");
        spectrumChart.appendChild(spectrumSvg);
        charts.appendChild(spectrumChart);
        var fluxChart = element(doc, "div", { className: "cascade-chart", tabindex: "0", "aria-label": "可横向滚动的图表" });
        var fluxSvg = svgElement(doc, "svg", { className: "cascade-svg" });
        drawFlux(doc, fluxSvg, data, instanceId + "-flux");
        fluxChart.appendChild(fluxSvg);
        charts.appendChild(fluxChart);
        var exponentChart = element(doc, "div", { className: "cascade-chart cascade-chart-wide", tabindex: "0", "aria-label": "可横向滚动的图表" });
        var exponentSvg = svgElement(doc, "svg", { className: "cascade-svg" });
        drawExponents(doc, exponentSvg, data, instanceId + "-exponents");
        exponentChart.appendChild(exponentSvg);
        charts.appendChild(exponentChart);
        var balanceChart=element(doc,"div",{className:"cascade-chart",tabindex:"0","aria-label":"可横向滚动的黏性平衡图"});
        var balanceSvg=svgElement(doc,"svg",{className:"cascade-svg"});drawBalance(doc,balanceSvg,data,instanceId+"-balance");balanceChart.appendChild(balanceSvg);charts.appendChild(balanceChart);
        panel.appendChild(charts);
        var scales = element(doc, "div", { className: "cascade-table-wrap", tabindex: "0", "aria-label": "可横向滚动的数据表" });
        scales.appendChild(scaleTable(doc, data));
        panel.appendChild(scales);
        var exponents = element(doc, "div", { className: "cascade-table-wrap", tabindex: "0", "aria-label": "可横向滚动的数据表" });
        exponents.appendChild(buildExponentTable(doc, data));
        panel.appendChild(exponents);
        var interpretation = data.teachingWindow.valid
          ? "教学参考带已展开，但全部点仍由公式生成。可检查能谱斜率和两种归一化量；黏性图说明为何小尺度的三阶矩项不等于0.8。改变p时圆点与表格同步，p<3时She–Lévêque指数可高于K41，并非一律降低。"
          : "当前参数没有满足显示规则的参考带。公式外推仍可画出直线，但直线不能证明惯性区存在；实际流动还需检查强迫、黏性、方向性和统计收敛。";
        panel.appendChild(element(doc, "p", { className: "cascade-interpretation", text: interpretation }));
        shell.appendChild(panel);
      }
      root.replaceChildren(shell);
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var wide = compute({ presetId: "wide-inertial" });
    assert(near(wide.eta, Math.pow(1e-15, 0.25), 1e-10), "Kolmogorov scale");
    assert(wide.inertialRange.valid && wide.inertialRange.decades > 1.5, "wide inertial range");
    assert(wide.teachingWindow.valid && wide.teachingWindow.minimumDecades === 1 &&
      wide.teachingWindow.minimumSamples === 2, "explicit teaching-window thresholds");
    assert(near(wide.ratio, Math.pow(wide.Re, 0.75), 1e-8), "Reynolds scale relation");
    var wideRows = wide.samples.filter(function (row) { return row.inInertialRange; });
    assert(wideRows.length >= MIN_INERTIAL_SAMPLES, "inertial ledger sample minimum");
    assert(wideRows.every(function (row) { return row.certified; }), "wide rows receive certificates");
    assert(wideRows.every(function (row) {
      return near(row.flux, wide.epsilon, 1e-12);
    }), "constant inertial flux");
    assert(wide.samples.some(function (row) { return row.flux === null; }), "flux is scoped outside inertial range");
    assert(wide.samples.filter(function (row) { return !row.certified; }).every(function (row) {
      return row.deltaU === null && row.turnover === null && row.spectrum === null && row.fourFifth === null &&
        row.certificateStatus === "extrapolation";
    }), "K41 and four fifth values are null outside the certificate window");
    assert(wideRows.every(function (row) {
      return near(row.turnover, row.r / row.deltaU, 1e-12) && near(row.piOverEpsilon, 1, 1e-12) &&
        near(row.minusS3OverEpsilonR, 0.8, 1e-12);
    }), "dimensional and normalized ledgers");
    assert(wide.spectrumConvention.integral.indexOf("1/2") >= 0 &&
      wide.spectrumConvention.units.indexOf("L^3") >= 0 &&
      wide.spectrumConvention.cKNote.indexOf("1D") >= 0, "spectrum convention metadata");
    assert(near(energySpectrum(1, 2, 1.5) / energySpectrum(1, 1, 1.5), Math.pow(2, -5 / 3), 1e-12),
      "same -5/3 spectrum law");
    assert(near(fourFifthLaw(1, 0.2), -0.16, 1e-12), "four fifth coefficient and sign");
    assert(wide.fourFifth.sign === "negative" && wide.fourFifth.underAssumedConditions &&
      wide.fourFifth.status === "under-assumed-conditions", "under-assumed four fifth law");
    assert(near(k41Exponent(3), 1, 1e-12) && near(sheLevequeExponent(3), 1, 1e-12), "third-order exponents");
    assert(near(k41Exponent(6), 2, 1e-12) && sheLevequeExponent(6) < 2, "intermittency lowers sixth exponent");
    assert(wide.selectedExponent.order === 6 && wide.selectedExponent.difference < 0, "selected intermittency comparison");
    assert(wide.exponents.length >= 7, "exponent ledger rows");

    var narrow = compute({ presetId: "narrow" });
    assert(!narrow.inertialRange.valid, "narrow preset has no wide inertial range");
    assert(!narrow.teachingWindow.valid && !narrow.fourFifth.underAssumedConditions, "narrow teaching window has no certificate");
    assert(narrow.samples.every(function (row) { return row.flux === null; }), "narrow flux has no false certification");
    assert(narrow.samples.every(function (row) {
      return row.deltaU === null && row.turnover === null && row.spectrum === null && row.fourFifth === null &&
        row.certificateStatus === "extrapolation";
    }), "narrow K41 rows are not drawn as verified");

    var assumptionsCounterexample = compute({ presetId: "wide-inertial", assumptions: { isotropic: false } });
    assert(!assumptionsCounterexample.teachingWindow.valid && assumptionsCounterexample.samples.some(function (row) {
      return row.inInertialRange && row.certificateStatus === "extrapolation" && row.spectrum === null;
    }), "declared assumption counterexample");

    var oneSample = inertialRange(1, 1e-4, 1);
    assert(oneSample.widthSufficient && !oneSample.enoughSamples && !oneSample.valid, "sample-count boundary");
    [{L:1e-4},{nu:1e-9},{epsilon:1e-8},{p:99},{Ck:99},{L:"1"},{p:NaN},{assumptions:{isotropic:"false"}}].forEach(function (args) {
      var rejected=false; try { compute(args); } catch (_) { rejected=true; } assert(rejected,"invalid config rejected");
    });

    var custom = compute({ L: 2, nu: 1e-4, epsilon: 0.5, p: 8, Ck: 1.7 });
    assert(custom.L === 2 && custom.p === 8 && custom.Ck === 1.7, "custom normalization");
    assert(custom.selectedExponent.sheLeveque < custom.selectedExponent.k41, "custom high-order comparison");
    assert(custom.samples.length === 9, "sample count");
    PRESETS.forEach(function (preset) {
      var result = compute({ presetId: preset.id });
      assert(finite(result.eta) && finite(result.Re) && result.eta > 0, preset.id + " finite scale ledger");
      assert(result.exponents.some(function (row) { return row.order === 3 && near(row.k41, 1, 1e-12); }),
        preset.id + " K41 third order");
      assert(result.fourFifth.coefficient < 0, preset.id + " negative four fifth coefficient");
      assert(result.samples.every(function (row) { return row.certificateStatus === "under-assumed-conditions" || row.certificateStatus === "extrapolation"; }),
        preset.id + " explicit certificate status");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    kolmogorovScale: kolmogorovScale,
    largeScaleVelocity: largeScaleVelocity,
    largeScaleReynolds: largeScaleReynolds,
    scaleRatio: scaleRatio,
    velocityIncrement: velocityIncrement,
    eddyTurnoverTime: eddyTurnoverTime,
    energySpectrum: energySpectrum,
    energyFlux: energyFlux,
    normalizedFlux: normalizedFlux,
    fourFifthLaw: fourFifthLaw,
    normalizedFourFifth: normalizedFourFifth,
    k41Exponent: k41Exponent,
    sheLevequeExponent: sheLevequeExponent,
    inertialRange: inertialRange,
    countSamplesInWindow: countSamplesInWindow,
    MIN_INERTIAL_DECADES: MIN_INERTIAL_DECADES,
    MIN_INERTIAL_SAMPLES: MIN_INERTIAL_SAMPLES,
    spectrumConvention: SPECTRUM_CONVENTION,
    scaleSamples: scaleSamples,
    exponentTable: makeExponentTable,
    compute: compute,
    format: format,
    viscousBalance: viscousBalance,
    drawScale: drawScale,
    drawSpectrum: drawSpectrum,
    drawFlux: drawFlux,
    drawExponents: drawExponents,
    drawBalance: drawBalance,
    mount: mount,
    selfTest: selfTest
  };
});
