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
    ".cascade-lab{--cas-blue:var(--cl-blue,#315f9d);--cas-gold:var(--cl-gold,#9b6a12);--cas-green:var(--cl-green,#39734d);--cas-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".cascade-lab *,.cascade-lab *::before,.cascade-lab *::after{box-sizing:border-box}.cascade-lab [hidden]{display:none!important}.cascade-lab h3,.cascade-lab h4{margin:0;color:var(--fg);letter-spacing:0}.cascade-lab h3{font-size:1.18rem}.cascade-lab h4{font-size:1rem}",
    ".cascade-lab button,.cascade-lab input{font:inherit}.cascade-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.cascade-lab button:hover{border-color:var(--accent)}.cascade-lab button[aria-pressed='true'],.cascade-lab button.cascade-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.cascade-lab button:focus-visible,.cascade-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.cascade-lab button:disabled{cursor:not-allowed;opacity:.55}",
    ".cascade-lab .cascade-note,.cascade-lab .cascade-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.cascade-lab .cascade-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cas-gold);background:var(--bg)}.cascade-lab fieldset{min-width:0;margin:0;padding:0;border:0}.cascade-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750}.cascade-lab .cascade-preset-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.cascade-lab .cascade-preset-grid button,.cascade-lab .cascade-choice-grid button{font-size:12px}.cascade-lab .cascade-question-list{display:grid;gap:10px;margin-top:13px}.cascade-lab .cascade-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.cascade-lab .cascade-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.cascade-lab .cascade-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.cascade-lab .cascade-actions>*{flex:1 1 170px}.cascade-lab .cascade-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.cascade-lab .cascade-pass{color:var(--cas-green)}.cascade-lab .cascade-warn{color:var(--cas-red)}",
    ".cascade-lab .cascade-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.cascade-lab .cascade-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 16px;margin:12px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.cascade-lab .cascade-control{display:grid;gap:5px;min-width:0}.cascade-lab .cascade-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.cascade-lab .cascade-control output{color:var(--accent);font-variant-numeric:tabular-nums}.cascade-lab .cascade-control input[type=range]{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".cascade-lab .cascade-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;min-width:0}.cascade-lab .cascade-chart{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.cascade-lab .cascade-chart-wide{grid-column:1/-1}.cascade-lab .cascade-svg{display:block;width:100%;min-width:620px;height:auto;color:var(--fg)}.cascade-lab .cascade-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.cascade-lab .cascade-grid-line{stroke:var(--border);stroke-width:1;stroke-opacity:.7}.cascade-lab .cascade-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.75}.cascade-lab .cascade-spectrum{stroke:var(--cas-blue);fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.cascade-lab .cascade-reference{stroke:var(--cas-gold);fill:none;stroke-width:1.8;stroke-dasharray:6 5}.cascade-lab .cascade-extrapolation{stroke:var(--cas-red);fill:none;stroke-width:1.8;stroke-dasharray:5 5;stroke-linecap:round;stroke-linejoin:round;opacity:.78}.cascade-lab .cascade-flux{stroke:var(--cas-green);fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.cascade-lab .cascade-sl{stroke:var(--cas-red);fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.cascade-lab .cascade-k41{stroke:var(--cas-blue);fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}",
    ".cascade-lab .cascade-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:8px;margin:12px 0}.cascade-lab .cascade-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.cascade-lab .cascade-metric:nth-child(1),.cascade-lab .cascade-metric:nth-child(4){border-top-color:var(--cas-blue)}.cascade-lab .cascade-metric:nth-child(2),.cascade-lab .cascade-metric:nth-child(5){border-top-color:var(--cas-gold)}.cascade-lab .cascade-metric:nth-child(3),.cascade-lab .cascade-metric:nth-child(6){border-top-color:var(--cas-green)}.cascade-lab .cascade-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.cascade-lab .cascade-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.cascade-lab .cascade-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.cascade-lab table{width:100%;min-width:920px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.cascade-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.cascade-lab th,.cascade-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.cascade-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.cascade-lab .cascade-good{color:var(--cas-green);font-weight:750}.cascade-lab .cascade-bad{color:var(--cas-red);font-weight:750}.cascade-lab .cascade-score{margin:8px 0;color:var(--accent);font-weight:750}.cascade-lab .cascade-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--cas-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:900px){.cascade-lab .cascade-chart-grid{grid-template-columns:minmax(0,1fr)}.cascade-lab .cascade-chart-wide{grid-column:auto}.cascade-lab .cascade-controls{grid-template-columns:repeat(2,minmax(0,1fr)}}@media(max-width:700px){.cascade-lab .cascade-preset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cascade-lab .cascade-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:430px){.cascade-lab .cascade-preset-grid,.cascade-lab .cascade-controls{grid-template-columns:minmax(0,1fr)}.cascade-lab .cascade-chart{padding:5px}}@media(prefers-reduced-motion:reduce){.cascade-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
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
    var number = Number(value);
    if (!finite(number) || number <= 0) throw new RangeError(name + " must be positive");
    return number;
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].id === id) return PRESETS[index];
    }
    return PRESETS[0];
  }

  function kolmogorovScale(nu, epsilon) {
    return Math.pow(positive(nu, "nu") ** 3 / positive(epsilon, "epsilon"), 0.25);
  }

  function largeScaleVelocity(L, epsilon) {
    return Math.pow(positive(epsilon, "epsilon") * positive(L, "L"), 1 / 3);
  }

  function largeScaleReynolds(L, nu, epsilon) {
    return largeScaleVelocity(L, epsilon) * positive(L, "L") / positive(nu, "nu");
  }

  function scaleRatio(L, nu, epsilon) {
    return positive(L, "L") / kolmogorovScale(nu, epsilon);
  }

  function velocityIncrement(epsilon, r) {
    return Math.pow(positive(epsilon, "epsilon") * positive(r, "r"), 1 / 3);
  }

  function eddyTurnoverTime(epsilon, r) {
    return Math.pow(positive(r, "r") * positive(r, "r") / positive(epsilon, "epsilon"), 1 / 3);
  }

  function energySpectrum(epsilon, k, Ck) {
    return (Ck === undefined ? 1.5 : Number(Ck)) * Math.pow(positive(epsilon, "epsilon"), 2 / 3) *
      Math.pow(positive(k, "k"), -5 / 3);
  }

  function energyFlux(epsilon, r, eta, L) {
    if (r === undefined || eta === undefined || L === undefined || r >= 10 * eta - EPS && r <= L / 10 + EPS) {
      return positive(epsilon, "epsilon");
    }
    return null;
  }

  function normalizedFlux(epsilon, flux) {
    if (flux === null || flux === undefined) return null;
    return flux / positive(epsilon, "epsilon");
  }

  function fourFifthLaw(epsilon, r) {
    return -4 / 5 * positive(epsilon, "epsilon") * positive(r, "r");
  }

  function normalizedFourFifth(epsilon, r, value) {
    var signed = value === undefined ? fourFifthLaw(epsilon, r) : value;
    if (signed === null || signed === undefined) return null;
    return -signed / (positive(epsilon, "epsilon") * positive(r, "r"));
  }

  function k41Exponent(order) {
    return Number(order) / 3;
  }

  function sheLevequeExponent(order) {
    var p = Number(order);
    return p / 9 + 2 * (1 - Math.pow(2 / 3, p / 3));
  }

  function countSamplesInWindow(L, eta, lower, upper, count) {
    var total = count || DEFAULT_SAMPLE_COUNT;
    if (total < 1 || lower >= upper || L <= eta) return 0;
    var hits = 0;
    for (var index = 0; index < total; index += 1) {
      var fraction = total === 1 ? 0.5 : index / (total - 1);
      var r = eta * Math.pow(L / eta, fraction);
      if (r >= lower - EPS && r <= upper + EPS) hits += 1;
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
    var widthSufficient = geometricValid && decades >= MIN_INERTIAL_DECADES;
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
    Object.keys(result).forEach(function (key) {
      if (overrides && overrides[key] !== undefined) result[key] = Boolean(overrides[key]);
    });
    return result;
  }

  function assumptionsSatisfied(flags) {
    return Object.keys(flags).every(function (key) { return flags[key] === true; });
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
    var total = count || DEFAULT_SAMPLE_COUNT;
    var teachingWindow = config.teachingWindow || {
      valid: Boolean(config.inertialRange && config.inertialRange.valid)
    };
    for (var index = 0; index < total; index += 1) {
      var fraction = total === 1 ? 0.5 : index / (total - 1);
      var r = config.eta * Math.pow(config.L / config.eta, fraction);
      var inRange = r >= config.inertialRange.lower - EPS && r <= config.inertialRange.upper + EPS;
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
    var orders = [1, 2, 3, 4, 6, 8, 10];
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
    var source = input || {};
    var preset = presetById(source.presetId || DEFAULT.presetId);
    var L = source.L === undefined ? preset.L : Number(source.L);
    var nu = source.nu === undefined ? preset.nu : Number(source.nu);
    var epsilon = source.epsilon === undefined ? preset.epsilon : Number(source.epsilon);
    var Ck = source.Ck === undefined ? DEFAULT.Ck : Number(source.Ck);
    var order = source.p === undefined ? preset.p : Number(source.p);
    L = clamp(positive(L, "L"), 0.01, 10);
    nu = clamp(positive(nu, "nu"), 1e-7, 1e-2);
    epsilon = clamp(positive(epsilon, "epsilon"), 1e-6, 100);
    Ck = clamp(positive(Ck, "Ck"), 0.1, 4);
    order = Math.round(clamp(order, 1, 12));
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
      exactConditions: ["incompressible", "homogeneous", "isotropic", "stationary", "high-Re", "three-dimensional forward cascade", "minimum inertial width and samples"],
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
    return config;
  }

  function format(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(value)) return "∞";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = value;
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

  function logRange(rows, field) {
    var values = rows.map(function (row) { return row[field]; }).filter(function (value) { return finite(value) && value > 0; });
    if (!values.length) return { minimum: 1, maximum: 10 };
    var minimum = Math.min.apply(null, values);
    var maximum = Math.max.apply(null, values);
    if (near(minimum, maximum, 1e-10)) {
      minimum /= 10;
      maximum *= 10;
    }
    return {
      minimum: minimum,
      maximum: maximum
    };
  }

  function drawScale(doc, svg, data, uid) {
    clear(svg);
    var width = 760;
    var height = 210;
    var left = 58;
    var right = 20;
    var top = 52;
    var bottom = 122;
    var plotRight = width - right;
    var eta = data.eta;
    var L = data.L;
    function x(value) {
      return left + (Math.log(value) - Math.log(eta)) / (Math.log(L) - Math.log(eta)) * (plotRight - left);
    }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, "Kolmogorov 尺度账"));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" },
      "横向对数尺度从耗散微尺度 eta 到注入尺度 L；绿色只表示同时满足声明假设、最小 decades 和样本门槛的教学窗口，其他区域是候选或 extrapolation。"));
    svg.setAttribute("aria-labelledby", uid + "-title " + uid + "-desc");
    svg.appendChild(svgElement(doc, "text", { x: left, y: 22, "font-size": 13, "font-weight": 750 }, "尺度 ledger：小尺度 ← r → 大尺度"));
    var geometricWindow = data.inertialRange.geometricValid && data.inertialRange.lower < L && data.inertialRange.upper > eta;
    var lower = clamp(data.inertialRange.lower, eta, L);
    var upper = clamp(data.inertialRange.upper, eta, L);
    var hasWindow = geometricWindow && lower < upper;
    var lowerX = hasWindow ? x(lower) : plotRight;
    var upperX = hasWindow ? x(upper) : plotRight;
    svg.appendChild(svgElement(doc, "rect", { x: left, y: top, width: Math.max(0, lowerX - left), height: bottom - top,
      fill: "var(--cas-red)", "fill-opacity": 0.12 }));
    if (hasWindow && !data.teachingWindow.valid) {
      svg.appendChild(svgElement(doc, "rect", { x: lowerX, y: top, width: Math.max(0, upperX - lowerX), height: bottom - top,
        fill: "var(--cas-gold)", "fill-opacity": 0.12, stroke: "var(--cas-gold)", "stroke-dasharray": "5 5" }));
    }
    if (hasWindow && data.teachingWindow.valid) {
      svg.appendChild(svgElement(doc, "rect", { x: lowerX, y: top, width: Math.max(0, upperX - lowerX), height: bottom - top,
        fill: "var(--cas-green)", "fill-opacity": 0.16 }));
    }
    svg.appendChild(svgElement(doc, "rect", { x: upperX, y: top, width: Math.max(0, plotRight - upperX), height: bottom - top,
      fill: "var(--cas-gold)", "fill-opacity": 0.12 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: plotRight, y2: bottom, className: "cascade-axis" }));
    [eta, data.inertialRange.lower, data.inertialRange.upper, L].forEach(function (value) {
      if (!finite(value) || value < eta || value > L) return;
      var xx = x(value);
      svg.appendChild(svgElement(doc, "line", { x1: xx, y1: top - 8, x2: xx, y2: bottom + 7, className: "cascade-grid-line" }));
      svg.appendChild(svgElement(doc, "text", { x: xx, y: bottom + 25, "text-anchor": "middle", "font-size": 11 },
        value === eta ? "η" : value === L ? "L" : format(value, 3)));
    });
    if (hasWindow) {
      svg.appendChild(svgElement(doc, "text", { x: (left + lowerX) / 2, y: 98, "text-anchor": "middle", "font-size": 12 }, "耗散侧"));
      svg.appendChild(svgElement(doc, "text", { x: (upperX + plotRight) / 2, y: 98, "text-anchor": "middle", "font-size": 12 }, "含能/注入侧"));
    }
    svg.appendChild(svgElement(doc, "text", { x: hasWindow ? (x(lower) + x(upper)) / 2 : (left + plotRight) / 2,
      y: 82, "text-anchor": "middle", "font-size": 12,
      fill: data.teachingWindow.valid ? "var(--cas-green)" : "var(--cas-red)" },
      data.teachingWindow.valid ? "教学窗口：under-assumed-conditions" : hasWindow ? "候选窗口：extrapolation" : "无可用惯性窗口"));
    if (!hasWindow) {
      svg.appendChild(svgElement(doc, "text", { x: (left + plotRight) / 2, y: 105, "text-anchor": "middle", "font-size": 12 }, "两端之间没有可用候选窗口"));
    }
    svg.appendChild(svgElement(doc, "text", { x: left, y: height - 12, "font-size": 11, fill: "var(--fg-soft)" },
      "候选边界：10η ≤ r ≤ L/10；证书还需 ≥1 decade、≥2 samples 与声明假设"));
  }

  function drawSpectrum(doc, svg, data, uid) {
    clear(svg);
    var width = 760;
    var height = 300;
    var left = 62;
    var right = 20;
    var top = 38;
    var bottom = 50;
    var plotRight = width - right;
    var plotBottom = height - bottom;
    var xRange = logRange(data.samples, "k");
    var yRange = logRange(data.samples, "spectrumFormula");
    function x(value) { return left + (Math.log(value) - Math.log(xRange.minimum)) / (Math.log(xRange.maximum) - Math.log(xRange.minimum)) * (plotRight - left); }
    function y(value) { return plotBottom - (Math.log(value) - Math.log(yRange.minimum)) / (Math.log(yRange.maximum) - Math.log(yRange.minimum)) * (plotBottom - top); }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, "K41 能谱与负五三分之一斜率"));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" },
      "蓝色实线只显示满足教学窗口条件的能谱样本；红色虚线是同一 C_K ε 的三分之二次方乘 k 的负五三分之一次方公式，在没有蓝色实线的区域应读作 extrapolation；金色虚线由同一负五分之三次方律生成，作为参考斜率。"));
    svg.setAttribute("aria-labelledby", uid + "-title " + uid + "-desc");
    [0, 0.5, 1].forEach(function (fraction) {
      var yy = plotBottom - fraction * (plotBottom - top);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: yy, x2: plotRight, y2: yy,
        className: fraction === 0 ? "cascade-axis" : "cascade-grid-line" }));
    });
    [0, 0.5, 1].forEach(function (fraction) {
      var xx = left + fraction * (plotRight - left);
      svg.appendChild(svgElement(doc, "line", { x1: xx, y1: top, x2: xx, y2: plotBottom, className: "cascade-grid-line" }));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "cascade-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: plotBottom, className: "cascade-axis" }));
    function pathFor(rows, field, xField) {
      return rows.map(function (row, index) {
        return (index ? "L" : "M") + x(row[xField || "k"]).toFixed(2) + " " + y(row[field]).toFixed(2);
      }).join(" ");
    }
    var formulaRows = data.samples.filter(function (row) { return finite(row.spectrumFormula) && row.spectrumFormula > 0; });
    var certifiedRows = data.samples.filter(function (row) { return finite(row.spectrum) && row.spectrum > 0; });
    if (formulaRows.length > 1) {
      svg.appendChild(svgElement(doc, "path", { d: pathFor(formulaRows, "spectrumFormula"), className: "cascade-extrapolation" }));
    }
    if (certifiedRows.length > 1) {
      svg.appendChild(svgElement(doc, "path", { d: pathFor(certifiedRows, "spectrum"), className: "cascade-spectrum" }));
    }
    var referenceRows = data.samples.filter(function (row) { return row.inInertialRange; });
    if (referenceRows.length < 2) referenceRows = formulaRows;
    if (referenceRows.length > 1) {
      var referenceMinimum = Math.min.apply(null, referenceRows.map(function (row) { return row.k; }));
      var referenceMaximum = Math.max.apply(null, referenceRows.map(function (row) { return row.k; }));
      var referencePoints = [];
      for (var point = 0; point < 25; point += 1) {
        var fraction = point / 24;
        var referenceK = referenceMinimum * Math.pow(referenceMaximum / referenceMinimum, fraction);
        referencePoints.push({ k: referenceK, referenceSpectrum: energySpectrum(data.epsilon, referenceK, data.Ck) });
      }
      svg.appendChild(svgElement(doc, "path", { d: pathFor(referencePoints, "referenceSpectrum"), className: "cascade-reference" }));
    }
    certifiedRows.forEach(function (row) {
      svg.appendChild(svgElement(doc, "circle", { cx: x(row.k), cy: y(row.spectrum), r: 3.5, fill: "var(--cas-blue)", stroke: "var(--bg)", "stroke-width": 1 }));
    });
    svg.appendChild(svgElement(doc, "text", { x: left, y: 22, "font-size": 13, "font-weight": 750 }, "log-log 能谱 E(k)（公式教学数据）"));
    svg.appendChild(svgElement(doc, "text", { x: plotRight, y: 22, "text-anchor": "end", "font-size": 11 }, "金虚线：同一 −5/3 law；红虚线：extrapolation"));
    svg.appendChild(svgElement(doc, "text", { x: (left + plotRight) / 2, y: height - 11, "text-anchor": "middle", "font-size": 12 }, "波数 k≈1/r（对数）"));
  }

  function drawFlux(doc, svg, data, uid) {
    clear(svg);
    var width = 760;
    var height = 300;
    var left = 62;
    var right = 20;
    var top = 38;
    var bottom = 50;
    var plotRight = width - right;
    var plotBottom = height - bottom;
    function x(value) { return left + (Math.log(value) - Math.log(data.eta)) / (Math.log(data.L) - Math.log(data.eta)) * (plotRight - left); }
    var yMaximum = 1.1;
    function y(value) { return plotBottom - value / yMaximum * (plotBottom - top); }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, "无量纲通量与四五律账"));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" },
      "纵轴对两条曲线使用同一无量纲约定：绿色是 Pi 除以 epsilon，金色是负的 signed S3 除以 epsilon r；实线只显示 under-assumed-conditions 样本，红色虚线是区外 extrapolation。"));
    svg.setAttribute("aria-labelledby", uid + "-title " + uid + "-desc");
    [0, 0.5, 1].forEach(function (fraction) {
      var yy = plotBottom - fraction * (plotBottom - top);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: yy, x2: plotRight, y2: yy,
        className: fraction === 0 ? "cascade-axis" : "cascade-grid-line" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: yy + 4, "text-anchor": "end", "font-size": 11 },
        format(fraction, 2)));
    });
    [data.eta, data.inertialRange.lower, data.inertialRange.upper, data.L].forEach(function (value) {
      if (value < data.eta || value > data.L) return;
      var xx = x(value);
      svg.appendChild(svgElement(doc, "line", { x1: xx, y1: top, x2: xx, y2: plotBottom, className: "cascade-grid-line" }));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "cascade-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: plotBottom, className: "cascade-axis" }));
    function pathFor(rows, field) {
      return rows.map(function (row, index) {
        return (index ? "L" : "M") + x(row.r).toFixed(2) + " " + y(row[field]).toFixed(2);
      }).join(" ");
    }
    var fluxFormulaRows = data.samples.filter(function (row) { return finite(row.piOverEpsilonFormula); });
    var fluxRows = data.samples.filter(function (row) { return finite(row.piOverEpsilon); });
    var s3FormulaRows = data.samples.filter(function (row) { return finite(row.minusS3OverEpsilonRFormula); });
    var s3Rows = data.samples.filter(function (row) { return finite(row.minusS3OverEpsilonR); });
    if (fluxFormulaRows.length > 1) {
      svg.appendChild(svgElement(doc, "path", { d: pathFor(fluxFormulaRows, "piOverEpsilonFormula"), className: "cascade-extrapolation" }));
    }
    if (s3FormulaRows.length > 1) {
      svg.appendChild(svgElement(doc, "path", { d: pathFor(s3FormulaRows, "minusS3OverEpsilonRFormula"), className: "cascade-extrapolation" }));
    }
    if (fluxRows.length > 1) {
      svg.appendChild(svgElement(doc, "path", { d: pathFor(fluxRows, "piOverEpsilon"), className: "cascade-flux" }));
    }
    if (s3Rows.length > 1) {
      svg.appendChild(svgElement(doc, "path", { d: pathFor(s3Rows, "minusS3OverEpsilonR"), className: "cascade-reference" }));
    }
    svg.appendChild(svgElement(doc, "text", { x: left, y: 22, "font-size": 13, "font-weight": 750 }, "无量纲通量账"));
    svg.appendChild(svgElement(doc, "line", { x1: left + 116, y1: 22, x2: left + 138, y2: 22, className: "cascade-flux" }));
    svg.appendChild(svgElement(doc, "text", { x: left + 144, y: 26, "font-size": 11 }, "绿：Π/ε"));
    svg.appendChild(svgElement(doc, "line", { x1: left + 203, y1: 22, x2: left + 225, y2: 22, className: "cascade-reference" }));
    svg.appendChild(svgElement(doc, "text", { x: left + 231, y: 26, "font-size": 11 }, "金：−S₃/(εr)"));
    svg.appendChild(svgElement(doc, "line", { x1: left + 330, y1: 22, x2: left + 352, y2: 22, className: "cascade-extrapolation" }));
    svg.appendChild(svgElement(doc, "text", { x: left + 358, y: 26, "font-size": 11 }, "红虚线：extrapolation"));
    svg.appendChild(svgElement(doc, "text", { x: left, y: top - 8, "font-size": 11 }, "Π/ε 与 −S₃/(εr)"));
    svg.appendChild(svgElement(doc, "text", { x: (left + plotRight) / 2, y: height - 11, "text-anchor": "middle", "font-size": 12 }, "尺度 r（对数）"));
  }

  function drawExponents(doc, svg, data, uid) {
    clear(svg);
    var width = 760;
    var height = 300;
    var left = 62;
    var right = 20;
    var top = 38;
    var bottom = 50;
    var plotRight = width - right;
    var plotBottom = height - bottom;
    var maxOrder = 10;
    var maxExponent = Math.max(3.6, Math.max.apply(null, data.exponents.map(function (row) { return row.k41; })));
    function x(value) { return left + value / maxOrder * (plotRight - left); }
    function y(value) { return plotBottom - value / maxExponent * (plotBottom - top); }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, "绝对值高阶结构函数的 K41 与 She–Lévêque 指数"));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" },
      "蓝线是常用绝对值结构函数 |delta u| 的 p 除以三 K41 指数，红线是 She–Lévêque 间歇性比较；它们与 signed longitudinal S3 的四五律分开记账。"));
    svg.setAttribute("aria-labelledby", uid + "-title " + uid + "-desc");
    [0, 1, 2, 3].forEach(function (tick) {
      var yy = y(tick);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: yy, x2: plotRight, y2: yy,
        className: tick === 0 ? "cascade-axis" : "cascade-grid-line" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: yy + 4, "text-anchor": "end", "font-size": 11 }, String(tick)));
    });
    [0, 3, 6, 9].forEach(function (tick) {
      var xx = x(tick);
      svg.appendChild(svgElement(doc, "line", { x1: xx, y1: top, x2: xx, y2: plotBottom, className: "cascade-grid-line" }));
      svg.appendChild(svgElement(doc, "text", { x: xx, y: plotBottom + 18, "text-anchor": "middle", "font-size": 11 }, String(tick)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "cascade-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: plotBottom, className: "cascade-axis" }));
    var k41Path = data.exponents.map(function (row, index) {
      return (index ? "L" : "M") + x(row.order).toFixed(2) + " " + y(row.k41).toFixed(2);
    }).join(" ");
    var slPath = data.exponents.map(function (row, index) {
      return (index ? "L" : "M") + x(row.order).toFixed(2) + " " + y(row.sheLeveque).toFixed(2);
    }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: k41Path, className: "cascade-k41" }));
    svg.appendChild(svgElement(doc, "path", { d: slPath, className: "cascade-sl" }));
    data.exponents.forEach(function (row) {
      svg.appendChild(svgElement(doc, "circle", { cx: x(row.order), cy: y(row.sheLeveque), r: 3.5, fill: "var(--cas-red)", stroke: "var(--bg)", "stroke-width": 1 }));
    });
    svg.appendChild(svgElement(doc, "text", { x: left, y: 22, "font-size": 13, "font-weight": 750 }, "绝对值结构函数指数 ζₚ"));
    svg.appendChild(svgElement(doc, "line", { x1: left + 165, y1: 22, x2: left + 187, y2: 22, className: "cascade-k41" }));
    svg.appendChild(svgElement(doc, "text", { x: left + 193, y: 26, "font-size": 11 }, "K41 p/3"));
    svg.appendChild(svgElement(doc, "line", { x1: left + 270, y1: 22, x2: left + 292, y2: 22, className: "cascade-sl" }));
    svg.appendChild(svgElement(doc, "text", { x: left + 298, y: 26, "font-size": 11 }, "间歇性 She–Lévêque"));
    svg.appendChild(svgElement(doc, "text", { x: (left + plotRight) / 2, y: height - 11, "text-anchor": "middle", "font-size": 12 }, "阶数 p"));
  }

  function scaleTable(doc, data) {
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "从注入到耗散的 scale ledger；数值栏只在 under-assumed-conditions 教学窗口发证，— 与 extrapolation 状态表示区外不作证" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "区域" }),
      element(doc, "th", { scope: "col", text: "r" }),
      element(doc, "th", { scope: "col", text: "k≈1/r" }),
      element(doc, "th", { scope: "col", text: "δu(r)" }),
      element(doc, "th", { scope: "col", text: "τr" }),
      element(doc, "th", { scope: "col", text: "E(k)" }),
      element(doc, "th", { scope: "col", text: "Π(r)" }),
      element(doc, "th", { scope: "col", text: "signed S₃(r)" }),
      element(doc, "th", { scope: "col", text: "证书状态" })
    ])));
    var body = element(doc, "tbody", {});
    data.samples.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { scope: "row", className: row.certified ? "cascade-good" : row.inInertialRange ? "cascade-bad" : "", text:
          row.certified ? "惯性区（证书）" : row.inInertialRange ? "惯性区候选（外推）" : row.region }),
        element(doc, "td", { text: format(row.r, 6) }),
        element(doc, "td", { text: format(row.k, 6) }),
        element(doc, "td", { text: format(row.deltaU, 6) }),
        element(doc, "td", { text: format(row.turnover, 6) }),
        element(doc, "td", { text: format(row.spectrum, 6) }),
        element(doc, "td", { className: row.flux === null ? "cascade-bad" : "cascade-good", text: format(row.flux, 6) }),
        element(doc, "td", { className: row.fourFifth === null ? "cascade-bad" : "cascade-good", text: format(row.fourFifth, 6) }),
        element(doc, "td", { className: row.certified ? "cascade-good" : "cascade-bad", text: row.certificateStatus })
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
      });
      return button;
    }

    function render() {
      var data = current();
      var shell = element(doc, "div", { className: "cascade-lab" });
      shell.appendChild(element(doc, "h3", { text: "K41 级串与间歇性 scale ledger" }));
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
            "aria-pressed": state.presetId === preset.id ? "true" : "false",
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
          "当前假设账：不可压、齐次、各向同性、统计定常、高 Re、三维正向级串。教学窗口至少需要 " +
          MIN_INERTIAL_DECADES + " decade 且至少 " + MIN_INERTIAL_SAMPLES + " 个惯性样本；只有 status=under-assumed-conditions 的样本给出 K41 与 4/5 数值，其他栏为 null/extrapolation。" }));
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
          });
          return control;
        }
        controls.appendChild(rangeControl(instanceId + "-L", "注入尺度 L", 0.05, 2, 0.01, data.L, format(data.L, 3), function (value) { state.L = value; }));
        controls.appendChild(rangeControl(instanceId + "-nu", "运动黏度 ν（10 的指数）", -6, -2, 0.05,
          Math.log10(data.nu), "10^" + format(Math.log10(data.nu), 2), function (value) { state.nu = Math.pow(10, value); }));
        controls.appendChild(rangeControl(instanceId + "-epsilon", "耗散率 ε", 0.01, 2, 0.01, data.epsilon,
          format(data.epsilon, 3), function (value) { state.epsilon = value; }));
        controls.appendChild(rangeControl(instanceId + "-p", "结构函数阶数 p", 1, 10, 1, data.p, String(data.p), function (value) { state.p = value; }));
        panel.appendChild(controls);
        panel.appendChild(element(doc, "div", { className: "cascade-metrics" }, [
          metric(doc, "Kolmogorov η", format(data.eta, 6)),
          metric(doc, "尺度比 L/η", format(data.ratio, 5)),
          metric(doc, "大尺度 Re", format(data.Re, 5)),
          metric(doc, "教学窗口", data.teachingWindow.valid ? format(data.teachingWindow.decades, 3) + " decades / " + data.teachingWindow.sampleCount + " samples" :
            format(data.teachingWindow.decades, 3) + " decades / " + data.teachingWindow.sampleCount + " samples（extrapolation）"),
          metric(doc, "Π/ε ledger", data.teachingWindow.valid ? "≈ 1" : "null / extrapolation"),
          metric(doc, "4/5 律", data.fourFifth.underAssumedConditions ? "under-assumed-conditions" : "null / extrapolation")
        ]));
        var charts = element(doc, "div", { className: "cascade-chart-grid" });
        var scaleChart = element(doc, "div", { className: "cascade-chart cascade-chart-wide" });
        var scaleSvg = svgElement(doc, "svg", { className: "cascade-svg" });
        drawScale(doc, scaleSvg, data, instanceId + "-scale");
        scaleChart.appendChild(scaleSvg);
        charts.appendChild(scaleChart);
        var spectrumChart = element(doc, "div", { className: "cascade-chart" });
        var spectrumSvg = svgElement(doc, "svg", { className: "cascade-svg" });
        drawSpectrum(doc, spectrumSvg, data, instanceId + "-spectrum");
        spectrumChart.appendChild(spectrumSvg);
        charts.appendChild(spectrumChart);
        var fluxChart = element(doc, "div", { className: "cascade-chart" });
        var fluxSvg = svgElement(doc, "svg", { className: "cascade-svg" });
        drawFlux(doc, fluxSvg, data, instanceId + "-flux");
        fluxChart.appendChild(fluxSvg);
        charts.appendChild(fluxChart);
        var exponentChart = element(doc, "div", { className: "cascade-chart cascade-chart-wide" });
        var exponentSvg = svgElement(doc, "svg", { className: "cascade-svg" });
        drawExponents(doc, exponentSvg, data, instanceId + "-exponents");
        exponentChart.appendChild(exponentSvg);
        charts.appendChild(exponentChart);
        panel.appendChild(charts);
        var scales = element(doc, "div", { className: "cascade-table-wrap" });
        scales.appendChild(scaleTable(doc, data));
        panel.appendChild(scales);
        var exponents = element(doc, "div", { className: "cascade-table-wrap" });
        exponents.appendChild(buildExponentTable(doc, data));
        panel.appendChild(exponents);
        var interpretation = data.teachingWindow.valid
          ? "当前教学窗口满足声明假设、至少 " + MIN_INERTIAL_DECADES + " decade 和至少 " + MIN_INERTIAL_SAMPLES + " 个惯性样本；实线/表格数值才是 under-assumed-conditions 教学读数。signed S₃ 的负号与三维正向级串对应；常用绝对值高阶 ζp 单独记账，ζp 降低表示重尾增强、随尺度衰减更慢。"
          : "当前没有满足声明假设与门槛的教学窗口；K41 公式仍作为红色虚线/公式字段外推，表格证书值为 null，不把 narrow 或边界区域画成已验证惯性区。";
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
    var domainLow = compute({ L: 1e-4, nu: 1e-9, epsilon: 1e-8, p: 99, Ck: 99 });
    assert(domainLow.L === 0.01 && domainLow.nu === 1e-7 && domainLow.epsilon === 1e-6 && domainLow.p === 12 && domainLow.Ck === 4,
      "lower domain clamps");
    var domainHigh = compute({ L: 20, nu: 0.1, epsilon: 1000, p: 0, Ck: 0.01 });
    assert(domainHigh.L === 10 && domainHigh.nu === 1e-2 && domainHigh.epsilon === 100 && domainHigh.p === 1 && domainHigh.Ck === 0.1,
      "upper domain clamps");

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
    mount: mount,
    selfTest: selfTest
  };
});
