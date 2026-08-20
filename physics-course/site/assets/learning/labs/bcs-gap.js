(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("bcs-gap", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("bcs-gap self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("bcs-gap self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "bcs-gap-lab-styles";
  var SERIAL = 0;
  var EPS = 1e-12;
  var ROOT_TOLERANCE = 2e-10;
  var QUAD_STEPS = 720;
  var LOG_XI_MAX = 36;
  var DOS_PLOT_MAX = 6;
  var LIMITS = {
    lambda: [0.12, 0.55],
    cutoff: [0.25, 2.5],
    temperatureRatio: [0, 1.2],
    gammaRatio: [0, 0.25]
  };

  var PRESETS = [
    {
      id: "zero",
      label: "T = 0",
      note: "零温极限：tanh(E/2T) 取 1，能隙最大。",
      lambda: 0.30,
      cutoff: 1,
      temperatureRatio: 0,
      gammaRatio: 0.04
    },
    {
      id: "near-critical",
      label: "接近 Tc",
      note: "T/Tc=0.95：正能隙仍在，但已经接近临界点。",
      lambda: 0.30,
      cutoff: 1,
      temperatureRatio: 0.95,
      gammaRatio: 0.04
    },
    {
      id: "normal",
      label: "T >= Tc",
      note: "临界以上只保留 Delta=0 的正常态解，不把零点误判为正能隙根。",
      lambda: 0.30,
      cutoff: 1,
      temperatureRatio: 1.08,
      gammaRatio: 0.04
    },
    {
      id: "coupling",
      label: "耦合扫描",
      note: "改变 lambda：仍是同一弱耦合常态 DOS 模型，不是强耦合材料结论。",
      lambda: 0.20,
      cutoff: 1,
      temperatureRatio: 0.5,
      gammaRatio: 0.04
    },
    {
      id: "cutoff",
      label: "截断扫描",
      note: "改变 Debye 截断 omega_D：能量尺度变，弱耦合比值近似不变。",
      lambda: 0.30,
      cutoff: 0.55,
      temperatureRatio: 0.5,
      gammaRatio: 0.08
    }
  ];

  var STYLE_TEXT = [
    ".bcs-lab{--bcs-blue:var(--cl-blue,#2b67a5);--bcs-gold:var(--cl-gold,#9a6b12);--bcs-green:var(--cl-green,#2f7651);--bcs-red:var(--cl-red,#b5483c);max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere;}",
    ".bcs-lab *,.bcs-lab *::before,.bcs-lab *::after{box-sizing:border-box}.bcs-lab [hidden]{display:none!important}.bcs-lab h3,.bcs-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.bcs-lab h3{font-size:1.12rem}.bcs-lab h4{font-size:1rem}.bcs-lab p{margin:8px 0}.bcs-lab .bcs-note,.bcs-lab .bcs-feedback,.bcs-lab .bcs-detail{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
    ".bcs-lab button,.bcs-lab input{font:inherit}.bcs-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.bcs-lab button:hover{border-color:var(--accent,#1769aa)}.bcs-lab button:focus-visible,.bcs-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.bcs-lab button[aria-pressed=true],.bcs-lab button.bcs-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.bcs-lab button:disabled{cursor:not-allowed;opacity:.55}",
    ".bcs-lab fieldset{min-width:0;margin:10px 0;padding:10px;border:1px solid var(--border,#c8cdd3)}.bcs-lab legend{max-width:100%;padding:0 4px;color:var(--fg,#20252b);font-size:13px;font-weight:750;line-height:1.5}.bcs-lab .bcs-question{margin:9px 0 5px;font-size:13px;font-weight:700}.bcs-lab .bcs-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.bcs-lab .bcs-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.bcs-lab .bcs-actions>*{flex:1 1 160px}.bcs-lab .bcs-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.bcs-lab .bcs-pass{color:var(--bcs-green)}.bcs-lab .bcs-warn{color:var(--bcs-red)}",
    ".bcs-lab .bcs-experiment{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#c8cdd3)}.bcs-lab .bcs-presets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:10px 0}.bcs-lab .bcs-presets button{font-size:12px}.bcs-lab .bcs-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px;margin:12px 0;padding:12px;border:1px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff))}.bcs-lab .bcs-control{display:grid;gap:4px;min-width:0}.bcs-lab .bcs-control label{font-size:12.5px;font-weight:700;color:var(--fg-soft,var(--muted,#5d6873))}.bcs-lab .bcs-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums}.bcs-lab input[type=range]{display:block;width:100%;height:44px;min-height:44px;margin:0;accent-color:var(--accent,#1769aa)}.bcs-lab .bcs-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px}",
    ".bcs-lab .bcs-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.bcs-lab .bcs-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff))}.bcs-lab .bcs-metric:nth-child(4n+1){border-color:var(--bcs-blue)}.bcs-lab .bcs-metric:nth-child(4n+2){border-color:var(--bcs-gold)}.bcs-lab .bcs-metric:nth-child(4n+3){border-color:var(--bcs-green)}.bcs-lab .bcs-metric:nth-child(4n){border-color:var(--bcs-red)}.bcs-lab .bcs-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px;line-height:1.4}.bcs-lab .bcs-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.bcs-lab .bcs-status{margin:8px 0;padding:9px 11px;border-left:3px solid var(--bcs-green);background:var(--block-bg,var(--bg,#fff));font-size:13px}",
    ".bcs-lab .bcs-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;min-width:0}.bcs-lab .bcs-chart{min-width:0}.bcs-lab .bcs-chart h4{margin:12px 0 7px;font-size:14px}.bcs-lab .bcs-frame{min-width:0;padding:7px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.bcs-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b)}.bcs-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.bcs-lab .bcs-grid{stroke:currentColor;stroke-opacity:.16;stroke-width:1}.bcs-lab .bcs-axis{stroke:currentColor;stroke-opacity:.65;stroke-width:1.15}.bcs-lab .bcs-gap-line{fill:none;stroke:var(--bcs-blue);stroke-width:2.7}.bcs-lab .bcs-current{stroke:var(--bcs-red);stroke-width:1.5;stroke-dasharray:4 4}.bcs-lab .bcs-gap-dot{fill:var(--bcs-red);stroke:var(--bg,#fff);stroke-width:2}.bcs-lab .bcs-ideal{fill:none;stroke:var(--bcs-gold);stroke-width:1.8;stroke-dasharray:6 4}.bcs-lab .bcs-broadened{fill:none;stroke:var(--bcs-green);stroke-width:2.4}.bcs-lab .bcs-normal{stroke:var(--fg-soft,var(--muted,#5d6873));stroke-width:1.2;stroke-dasharray:3 4}.bcs-lab .bcs-axis-label{font-size:10px;fill:var(--fg-soft,var(--muted,#5d6873))}.bcs-lab .bcs-chart-label{font-size:10.5px}.bcs-lab .bcs-chart-title{font-size:12px;font-weight:750}",
    ".bcs-lab .bcs-legend{display:flex;flex-wrap:wrap;gap:7px 13px;margin:7px 2px 0;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.bcs-lab .bcs-legend-item{display:inline-flex;align-items:center;gap:5px}.bcs-lab .bcs-swatch{display:inline-block;width:18px;height:3px}.bcs-lab .bcs-swatch-blue{background:var(--bcs-blue)}.bcs-lab .bcs-swatch-gold{background:var(--bcs-gold);border-top:1px dashed var(--bcs-gold)}.bcs-lab .bcs-swatch-green{background:var(--bcs-green)}.bcs-lab .bcs-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.bcs-lab table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.bcs-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.bcs-lab th,.bcs-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.bcs-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.bcs-lab .bcs-footnote{margin:10px 0 0;padding:9px 11px;border-left:3px solid var(--bcs-gold);background:var(--block-bg,var(--bg,#fff));color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;line-height:1.65}",
    "@media(max-width:900px){.bcs-lab .bcs-presets{grid-template-columns:repeat(3,minmax(0,1fr))}.bcs-lab .bcs-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:650px){.bcs-lab .bcs-choice-row,.bcs-lab .bcs-controls,.bcs-lab .bcs-charts{grid-template-columns:minmax(0,1fr)}.bcs-lab .bcs-presets{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:420px){.bcs-lab .bcs-presets,.bcs-lab .bcs-metrics{grid-template-columns:minmax(0,1fr)}.bcs-lab fieldset{padding:8px}.bcs-lab .bcs-frame{padding:4px}.bcs-lab .bcs-controls{padding:9px}.bcs-lab table{font-size:11.5px}.bcs-lab th,.bcs-lab td{padding-left:5px;padding-right:5px}}",
    "@media(prefers-reduced-motion:reduce){.bcs-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return finite(parsed) ? parsed : fallback;
  }

  function stableTanh(value) {
    if (value > 20) return 1 - 2 * Math.exp(-2 * value);
    if (value < -20) return -1 + 2 * Math.exp(2 * value);
    return Math.tanh(value);
  }

  function normalizeConfig(input) {
    var raw = input || {};
    return {
      id: raw.id || "custom",
      label: raw.label || "自定义",
      note: raw.note || "",
      lambda: clamp(number(raw.lambda, 0.30), LIMITS.lambda[0], LIMITS.lambda[1]),
      cutoff: clamp(number(raw.cutoff, 1), LIMITS.cutoff[0], LIMITS.cutoff[1]),
      temperatureRatio: clamp(number(raw.temperatureRatio, 0.5), LIMITS.temperatureRatio[0], LIMITS.temperatureRatio[1]),
      gammaRatio: clamp(number(raw.gammaRatio, 0.04), LIMITS.gammaRatio[0], LIMITS.gammaRatio[1])
    };
  }

  function validateParameters(lambda, cutoff) {
    if (!finite(lambda) || lambda <= 0) throw new RangeError("lambda must be positive and finite");
    if (!finite(cutoff) || cutoff <= 0) throw new RangeError("cutoff must be positive and finite");
  }

  /* xi = omega_D exp(-u) turns the logarithmic normal-state endpoint into a smooth finite-u integral. */
  function gapIntegral(delta, temperature, cutoff) {
    delta = number(delta, NaN);
    temperature = number(temperature, NaN);
    cutoff = number(cutoff, NaN);
    if (!finite(delta) || delta < 0 || !finite(temperature) || temperature < 0 || !finite(cutoff) || cutoff <= 0) {
      throw new RangeError("gap integral parameters must be finite and non-negative");
    }
    if (delta === 0 && temperature === 0) return Infinity;
    var step = LOG_XI_MAX / QUAD_STEPS;
    var sum = 0;
    var index;
    for (index = 0; index <= QUAD_STEPS; index += 1) {
      var u = index * step;
      var xi = cutoff * Math.exp(-u);
      var energy = Math.hypot(xi, delta);
      var value = 0;
      if (energy > 0) {
        var thermal = temperature === 0 ? 1 : stableTanh(energy / (2 * temperature));
        value = xi / energy * thermal;
      }
      var weight = index === 0 || index === QUAD_STEPS ? 1 : index % 2 ? 4 : 2;
      sum += weight * value;
    }
    return sum * step / 3;
  }

  function gapResidual(delta, temperature, lambda, cutoff) {
    validateParameters(lambda, cutoff);
    return lambda * gapIntegral(delta, temperature, cutoff) - 1;
  }

  function zeroTemperatureGap(lambda, cutoff) {
    validateParameters(lambda, cutoff);
    var inverse = 1 / lambda;
    if (inverse > 700) return 2 * cutoff * Math.exp(-inverse);
    return cutoff / Math.sinh(inverse);
  }

  function criticalTemperature(lambda, cutoff) {
    validateParameters(lambda, cutoff);
    var low = cutoff * 1e-12;
    var lowResidual = gapResidual(0, low, lambda, cutoff);
    var lowSteps = 0;
    while (lowResidual <= 0 && lowSteps < 80) {
      low *= 0.1;
      lowResidual = gapResidual(0, low, lambda, cutoff);
      lowSteps += 1;
    }
    var high = Math.max(cutoff, low * 2);
    var highResidual = gapResidual(0, high, lambda, cutoff);
    var highSteps = 0;
    while (highResidual > 0 && highSteps < 80) {
      high *= 2;
      highResidual = gapResidual(0, high, lambda, cutoff);
      highSteps += 1;
    }
    if (!(lowResidual > 0) || !(highResidual < 0)) throw new Error("could not bracket Tc");
    for (var step = 0; step < 90; step += 1) {
      var middle = (low + high) / 2;
      var residual = gapResidual(0, middle, lambda, cutoff);
      if (residual > 0) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }

  function solveDeltaAtTemperature(temperature, lambda, cutoff, tc, delta0) {
    validateParameters(lambda, cutoff);
    temperature = number(temperature, NaN);
    if (!finite(temperature) || temperature < 0) throw new RangeError("temperature must be finite and non-negative");
    tc = tc === undefined ? criticalTemperature(lambda, cutoff) : tc;
    delta0 = delta0 === undefined ? zeroTemperatureGap(lambda, cutoff) : delta0;
    if (temperature === 0) {
      return { delta: delta0, residual: gapResidual(delta0, 0, lambda, cutoff), status: "zero" };
    }
    if (temperature >= tc) {
      return {
        delta: 0,
        residual: gapResidual(0, temperature, lambda, cutoff),
        status: temperature === tc ? "critical" : "normal"
      };
    }
    var zeroResidual = gapResidual(0, temperature, lambda, cutoff);
    /* At and above Tc, Delta=0 is a boundary value, not a positive-gap root. */
    if (!(zeroResidual > 0)) return { delta: 0, residual: zeroResidual, status: "normal" };
    var low = 0;
    var high = Math.max(delta0, cutoff * 1e-14);
    var highResidual = gapResidual(high, temperature, lambda, cutoff);
    var expand = 0;
    while (highResidual > 0 && expand < 80) {
      high *= 2;
      highResidual = gapResidual(high, temperature, lambda, cutoff);
      expand += 1;
    }
    if (!(highResidual < 0)) throw new Error("could not bracket positive gap");
    for (var step = 0; step < 92; step += 1) {
      var middle = (low + high) / 2;
      var residual = gapResidual(middle, temperature, lambda, cutoff);
      if (residual > 0) low = middle;
      else high = middle;
    }
    var delta = (low + high) / 2;
    return { delta: delta, residual: gapResidual(delta, temperature, lambda, cutoff), status: "paired" };
  }

  function evaluate(input) {
    var state = normalizeConfig(input);
    var delta0 = zeroTemperatureGap(state.lambda, state.cutoff);
    var tc = criticalTemperature(state.lambda, state.cutoff);
    var temperature = state.temperatureRatio * tc;
    var solution = solveDeltaAtTemperature(temperature, state.lambda, state.cutoff, tc, delta0);
    var gamma = state.gammaRatio * delta0;
    return {
      id: state.id,
      label: state.label,
      note: state.note,
      lambda: state.lambda,
      cutoff: state.cutoff,
      temperatureRatio: state.temperatureRatio,
      temperature: temperature,
      tc: tc,
      delta0: delta0,
      delta: solution.delta,
      gapRatio: delta0 > 0 ? solution.delta / delta0 : 0,
      ratio: tc > 0 ? 2 * delta0 / tc : null,
      residual: solution.residual,
      integral: solution.residual / state.lambda + 1 / state.lambda,
      status: solution.status,
      gammaRatio: state.gammaRatio,
      gamma: gamma
    };
  }

  function gapCurve(result, count) {
    count = Math.max(12, Math.floor(number(count, 48)));
    var points = [];
    for (var index = 0; index <= count; index += 1) {
      var temperatureRatio = 1.2 * index / count;
      var solution = solveDeltaAtTemperature(
        temperatureRatio * result.tc,
        result.lambda,
        result.cutoff,
        result.tc,
        result.delta0
      );
      points.push({
        temperatureRatio: temperatureRatio,
        delta: solution.delta,
        gapRatio: result.delta0 > 0 ? solution.delta / result.delta0 : 0,
        residual: solution.residual,
        status: solution.status
      });
    }
    return points;
  }

  function complexSqrt(real, imaginary) {
    var radius = Math.hypot(real, imaginary);
    var u = Math.sqrt(Math.max(0, (radius + real) / 2));
    var v = (imaginary < 0 ? -1 : 1) * Math.sqrt(Math.max(0, (radius - real) / 2));
    return { real: u, imaginary: v };
  }

  function quasiparticleDos(energy, delta, gamma) {
    energy = Math.abs(number(energy, NaN));
    delta = Math.abs(number(delta, NaN));
    gamma = Math.max(0, number(gamma, NaN));
    if (!finite(energy) || !finite(delta) || !finite(gamma)) throw new RangeError("DOS parameters must be finite");
    if (delta <= EPS) return 1;
    if (gamma <= EPS) {
      if (energy < delta) return 0;
      if (Math.abs(energy - delta) <= EPS * Math.max(1, delta)) return Infinity;
      return energy / Math.sqrt(Math.max(EPS, energy * energy - delta * delta));
    }
    var root = complexSqrt(energy * energy - gamma * gamma - delta * delta, 2 * energy * gamma);
    var denominator = root.real * root.real + root.imaginary * root.imaginary;
    if (denominator <= EPS) return 1;
    return (energy * root.real + gamma * root.imaginary) / denominator;
  }

  function dosCurve(result, count) {
    count = Math.max(40, Math.floor(number(count, 160)));
    var points = [];
    for (var index = 0; index <= count; index += 1) {
      var energyRatio = 3.2 * index / count;
      var energy = energyRatio * result.delta0;
      points.push({
        energyRatio: energyRatio,
        ideal: quasiparticleDos(energy, result.delta, 0),
        broadened: quasiparticleDos(energy, result.delta, result.gamma)
      });
    }
    return points;
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(first, second, tolerance) {
    return Math.abs(first - second) <= tolerance * Math.max(1, Math.abs(first), Math.abs(second));
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }

    var baseline = evaluate({ lambda: 0.30, cutoff: 1, temperatureRatio: 0.5, gammaRatio: 0.04 });
    check(baseline.tc > 0 && baseline.delta0 > 0, "positive critical and zero-temperature scales");
    check(baseline.delta > 0 && baseline.delta < baseline.delta0, "finite-temperature gap lies between zero and Delta0");
    check(Math.abs(baseline.residual) < 2e-7, "finite-temperature gap residual");
    check(near(baseline.delta0, 1 / Math.sinh(1 / 0.30), 1e-12), "finite-cutoff zero-temperature formula");
    check(baseline.ratio > 3.45 && baseline.ratio < 3.56, "weak-coupling ratio near 3.53");

    var critical = evaluate({ lambda: 0.30, cutoff: 1, temperatureRatio: 1, gammaRatio: 0 });
    var normal = evaluate({ lambda: 0.30, cutoff: 1, temperatureRatio: 1.1, gammaRatio: 0 });
    var zero = evaluate({ lambda: 0.30, cutoff: 1, temperatureRatio: 0, gammaRatio: 0 });
    check(critical.delta === 0 && Math.abs(critical.residual) < 2e-7, "critical point has only the boundary zero gap");
    check(normal.delta === 0 && normal.residual < 0, "above Tc has no positive-gap root");
    check(zero.gapRatio === 1 && zero.status === "zero", "T=0 branch");

    var curve = gapCurve(baseline, 24);
    for (var index = 1; index < curve.length; index += 1) {
      check(curve[index].gapRatio <= curve[index - 1].gapRatio + 2e-8, "gap curve is non-increasing");
    }
    check(curve[curve.length - 1].gapRatio === 0, "gap is zero above Tc");

    var scaled = evaluate({ lambda: 0.30, cutoff: 0.5, temperatureRatio: 0.5, gammaRatio: 0.04 });
    check(near(scaled.delta0 / baseline.delta0, 0.5, 2e-8), "cutoff scales Delta0");
    check(near(scaled.tc / baseline.tc, 0.5, 2e-8), "cutoff scales Tc");
    check(near(scaled.ratio, baseline.ratio, 2e-7), "cutoff scaling leaves ratio unchanged");
    var weak = evaluate({ lambda: 0.20, cutoff: 1, temperatureRatio: 0.5, gammaRatio: 0.04 });
    var stronger = evaluate({ lambda: 0.38, cutoff: 1, temperatureRatio: 0.5, gammaRatio: 0.04 });
    check(weak.delta0 < baseline.delta0 && stronger.delta0 > baseline.delta0, "coupling changes gap scale");

    check(quasiparticleDos(0, baseline.delta, 0) === 0, "ideal DOS is gapped below Delta");
    check(quasiparticleDos(2 * baseline.delta, baseline.delta, 0) > 1, "ideal DOS coherence peak tail");
    check(quasiparticleDos(baseline.delta, baseline.delta, 0) === Infinity, "ideal DOS singular edge is explicit");
    var broadenedZero = quasiparticleDos(0, baseline.delta, baseline.gamma);
    check(broadenedZero > 0 && broadenedZero < 1, "Dynes broadening fills subgap DOS");
    check(quasiparticleDos(0, 0, baseline.gamma) === 1, "normal-state DOS limit");
    var dos = dosCurve(baseline, 80);
    check(dos.length === 81 && dos.every(function (point) { return finite(point.broadened); }), "DOS curve is finite with broadening");

    PRESETS.forEach(function (preset) {
      var result = evaluate(preset);
      check(result.tc > 0 && result.delta0 > 0, preset.id + " scales");
      check(result.delta >= 0 && result.gapRatio >= 0 && result.gapRatio <= 1 + 1e-10, preset.id + " gap range");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "htmlFor") node.htmlFor = value;
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    return appendChildren(node, children);
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, value === true ? "" : String(value));
    });
    if (text !== undefined) node.textContent = text;
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
    doc.head.appendChild(style);
  }

  function format(value, digits) {
    if (value === null || value === undefined) return "—";
    if (value === Infinity) return "∞";
    if (value === -Infinity) return "−∞";
    if (!finite(value)) return "—";
    if (Math.abs(value) < 5e-10) return "0";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    var text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "bcs-metric" }, [
      element(doc, "span", { text: label }),
      element(doc, "strong", { text: value })
    ]);
  }

  function pathFrom(points, mapX, mapY, valueKey) {
    var path = [];
    points.forEach(function (point, index) {
      var y = mapY(point[valueKey]);
      if (!finite(y)) return;
      path.push((path.length ? "L" : "M") + mapX(point) .toFixed(2) + "," + y.toFixed(2));
    });
    return path.join(" ");
  }

  function drawGapChart(doc, svg, result, points) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 680 320");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "BCS 能隙随约化温度变化的曲线");
    svg.appendChild(svgNode(doc, "title", {}, "自洽 BCS 能隙曲线"));
    svg.appendChild(svgNode(doc, "desc", {}, "蓝线是 Delta(T)/Delta0，红色虚线标出当前温度；Tc 以上曲线为零。"));
    var plot = { left: 54, top: 24, width: 592, height: 238 };
    var xMax = 1.2;
    var yMax = 1.08;
    function mapX(point) { return plot.left + point.temperatureRatio / xMax * plot.width; }
    function mapY(value) { return plot.top + plot.height - value / yMax * plot.height; }
    [0, 0.5, 1].forEach(function (value) {
      var y = mapY(value);
      svg.appendChild(svgNode(doc, "line", { x1: plot.left, y1: y, x2: plot.left + plot.width, y2: y, class: "bcs-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: plot.left - 7, y: y + 4, "text-anchor": "end", class: "bcs-axis-label" }, format(value, 1)));
    });
    [0, 0.5, 1, 1.2].forEach(function (value) {
      var x = plot.left + value / xMax * plot.width;
      svg.appendChild(svgNode(doc, "line", { x1: x, y1: plot.top, x2: x, y2: plot.top + plot.height, class: "bcs-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: x, y: plot.top + plot.height + 18, "text-anchor": "middle", class: "bcs-axis-label" }, format(value, 1)));
    });
    svg.appendChild(svgNode(doc, "line", { x1: plot.left, y1: plot.top + plot.height, x2: plot.left + plot.width, y2: plot.top + plot.height, class: "bcs-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: plot.left, y1: plot.top, x2: plot.left, y2: plot.top + plot.height, class: "bcs-axis" }));
    svg.appendChild(svgNode(doc, "path", { d: pathFrom(points, mapX, mapY, "gapRatio"), class: "bcs-gap-line" }));
    var currentX = plot.left + result.temperatureRatio / xMax * plot.width;
    var currentY = mapY(result.gapRatio);
    svg.appendChild(svgNode(doc, "line", { x1: currentX, y1: plot.top, x2: currentX, y2: plot.top + plot.height, class: "bcs-current" }));
    svg.appendChild(svgNode(doc, "circle", { cx: currentX, cy: currentY, r: 4.5, class: "bcs-gap-dot" }));
    svg.appendChild(svgNode(doc, "text", { x: plot.left + plot.width / 2, y: 306, "text-anchor": "middle", class: "bcs-axis-label" }, "T/Tc"));
    svg.appendChild(svgNode(doc, "text", { x: 15, y: plot.top + plot.height / 2, transform: "rotate(-90 15 " + (plot.top + plot.height / 2) + ")", "text-anchor": "middle", class: "bcs-axis-label" }, "Delta(T)/Delta0"));
    svg.appendChild(svgNode(doc, "text", { x: plot.left + 7, y: plot.top + 15, class: "bcs-chart-title" }, "自洽能隙"));
    svg.appendChild(svgNode(doc, "text", { x: plot.left + plot.width - 5, y: plot.top + plot.height - 7, "text-anchor": "end", class: "bcs-chart-label" }, "Tc 后：Delta=0"));
  }

  function drawDosChart(doc, svg, result, points) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 680 320");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "带 Dynes 展宽的 BCS 准粒子态密度");
    svg.appendChild(svgNode(doc, "title", {}, "BCS 准粒子态密度与 Dynes 展宽"));
    svg.appendChild(svgNode(doc, "desc", {}, "金色虚线为理想 DOS，绿色实线加入当前 Dynes 数值展宽，纵轴在六倍常态 DOS 处截断以便阅读。"));
    var plot = { left: 54, top: 24, width: 592, height: 238 };
    var xMax = 3.2;
    var yMax = DOS_PLOT_MAX;
    function mapX(point) { return plot.left + point.energyRatio / xMax * plot.width; }
    function mapY(value) { return plot.top + plot.height - Math.min(yMax, Math.max(0, value)) / yMax * plot.height; }
    [0, 1, 3, 6].forEach(function (value) {
      var y = mapY(value);
      svg.appendChild(svgNode(doc, "line", { x1: plot.left, y1: y, x2: plot.left + plot.width, y2: y, class: "bcs-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: plot.left - 7, y: y + 4, "text-anchor": "end", class: "bcs-axis-label" }, String(value)));
    });
    [0, 1, 2, 3.2].forEach(function (value) {
      var x = plot.left + value / xMax * plot.width;
      svg.appendChild(svgNode(doc, "line", { x1: x, y1: plot.top, x2: x, y2: plot.top + plot.height, class: "bcs-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: x, y: plot.top + plot.height + 18, "text-anchor": "middle", class: "bcs-axis-label" }, format(value, 1)));
    });
    svg.appendChild(svgNode(doc, "line", { x1: plot.left, y1: plot.top + plot.height, x2: plot.left + plot.width, y2: plot.top + plot.height, class: "bcs-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: plot.left, y1: plot.top, x2: plot.left, y2: plot.top + plot.height, class: "bcs-axis" }));
    svg.appendChild(svgNode(doc, "path", { d: pathFrom(points, mapX, mapY, "ideal"), class: "bcs-ideal" }));
    svg.appendChild(svgNode(doc, "path", { d: pathFrom(points, mapX, mapY, "broadened"), class: "bcs-broadened" }));
    var normalY = mapY(1);
    svg.appendChild(svgNode(doc, "line", { x1: plot.left, y1: normalY, x2: plot.left + plot.width, y2: normalY, class: "bcs-normal" }));
    if (result.delta0 > 0 && result.delta > 0) {
      var edgeX = plot.left + result.delta / result.delta0 / xMax * plot.width;
      svg.appendChild(svgNode(doc, "line", { x1: edgeX, y1: plot.top, x2: edgeX, y2: plot.top + plot.height, class: "bcs-current" }));
    }
    svg.appendChild(svgNode(doc, "text", { x: plot.left + plot.width / 2, y: 306, "text-anchor": "middle", class: "bcs-axis-label" }, "E/Delta0"));
    svg.appendChild(svgNode(doc, "text", { x: 15, y: plot.top + plot.height / 2, transform: "rotate(-90 15 " + (plot.top + plot.height / 2) + ")", "text-anchor": "middle", class: "bcs-axis-label" }, "N(E)/N(0)"));
    svg.appendChild(svgNode(doc, "text", { x: plot.left + 7, y: plot.top + 15, class: "bcs-chart-title" }, "准粒子 DOS"));
    svg.appendChild(svgNode(doc, "text", { x: plot.left + plot.width - 5, y: plot.top + 15, "text-anchor": "end", class: "bcs-chart-label" }, "图窗上限 6"));
  }

  function sampleRows(result) {
    return [0, 0.5, 0.95, 1, 1.1].map(function (temperatureRatio) {
      var solution = solveDeltaAtTemperature(
        temperatureRatio * result.tc,
        result.lambda,
        result.cutoff,
        result.tc,
        result.delta0
      );
      return {
        temperatureRatio: temperatureRatio,
        gapRatio: result.delta0 > 0 ? solution.delta / result.delta0 : 0,
        residual: solution.residual,
        status: solution.status
      };
    });
  }

  function renderTable(doc, table, result) {
    clear(table);
    table.setAttribute("aria-label", "BCS 能隙自洽残差表");
    var caption = element(doc, "caption", { text: "同一组 lambda 与 omega_D 的固定温度抽查；残差为 lambda I - 1。" });
    table.appendChild(caption);
    var head = element(doc, "tr");
    ["T/Tc", "Delta(T)/Delta0", "积分残差", "状态"].forEach(function (label) {
      head.appendChild(element(doc, "th", { scope: "col", text: label }));
    });
    var thead = element(doc, "thead");
    thead.appendChild(head);
    table.appendChild(thead);
    var body = element(doc, "tbody");
    sampleRows(result).forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "td", { text: format(row.temperatureRatio, 2) }),
        element(doc, "td", { text: format(row.gapRatio, 5) }),
        element(doc, "td", { text: format(row.residual, 3) }),
        element(doc, "td", { text: row.status === "paired" ? "正能隙" : row.status === "zero" ? "T=0" : row.status === "critical" ? "临界边界" : "正常态：无正根" })
      ]));
    });
    table.appendChild(body);
  }

  function copyPreset(preset) {
    return normalizeConfig(preset);
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "bcs-gap-" + (++SERIAL);
    var state = copyPreset(PRESETS[1]);
    var answers = [];
    var revealed = false;
    var QUESTIONS = [
      {
        prompt: "在 T/Tc=0.95 时，正能隙 Delta(T) 应怎样？",
        options: [
          { value: "small-positive", label: "接近 0 但仍为正" },
          { value: "delta0", label: "仍等于 Delta0" },
          { value: "diverge", label: "发散" }
        ],
        answer: "small-positive"
      },
      {
        prompt: "在 T >= Tc 时，能隙方程的物理解读是什么？",
        options: [
          { value: "zero", label: "只保留 Delta=0" },
          { value: "positive", label: "仍有稳定正根" },
          { value: "infinite", label: "能隙变成无穷" }
        ],
        answer: "zero"
      },
      {
        prompt: "比值 2Delta0/(kB Tc) 接近 3.53 的前提是？",
        options: [
          { value: "limit", label: "弱耦合、平衡、各向同性 s 波" },
          { value: "all", label: "所有超导材料" },
          { value: "dos", label: "只要 DOS 有展宽" }
        ],
        answer: "limit"
      }
    ];

    var shell = element(doc, "div", { className: "bcs-lab" });
    shell.appendChild(element(doc, "p", { className: "bcs-note", text: "先回答三个判断，再打开自洽求解器。模型取 kB=1、平衡、各向同性 s 波、常态 DOS N(0) 近似常数，并在 |xi|<=omega_D 内使用有限 Debye 截断。" }));
    var prediction = element(doc, "div", { className: "bcs-prediction" });
    prediction.appendChild(element(doc, "h3", { text: "预测门：三问都回答后才显示结果" }));
    var questionButtons = [];
    QUESTIONS.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset");
      fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
      var row = element(doc, "div", { className: "bcs-choice-row" });
      questionButtons[questionIndex] = [];
      question.options.forEach(function (option) {
        var button = element(doc, "button", { type: "button", text: option.label });
        button.addEventListener("click", function () {
          answers[questionIndex] = option.value;
          renderPrediction();
        });
        questionButtons[questionIndex].push({ value: option.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      prediction.appendChild(fieldset);
    });
    var predictionActions = element(doc, "div", { className: "bcs-actions" });
    var revealButton = element(doc, "button", { type: "button", className: "bcs-primary", text: "核对预测并揭晓" });
    var resetPredictionButton = element(doc, "button", { type: "button", text: "重置预测" });
    var feedback = element(doc, "p", { className: "bcs-feedback", text: "三问都作答后，结果才会出现。" });
    predictionActions.appendChild(revealButton);
    predictionActions.appendChild(resetPredictionButton);
    prediction.appendChild(predictionActions);
    prediction.appendChild(feedback);
    shell.appendChild(prediction);

    var experiment = element(doc, "section", { className: "bcs-experiment", "aria-labelledby": uid + "-title", hidden: true });
    experiment.appendChild(element(doc, "h3", { id: uid + "-title", text: "实验台：能隙自洽解与准粒子 DOS" }));
    experiment.appendChild(element(doc, "p", { className: "bcs-note", text: "先选预设，再调 lambda、Debye 截断、T/Tc 与 Dynes/数值展宽 Gamma/Delta0。参数变化仍只是在本页的 BCS 模型内扫描。" }));
    var presetRow = element(doc, "div", { className: "bcs-presets" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", text: preset.label, title: preset.note });
      button.addEventListener("click", function () {
        state = copyPreset(preset);
        render();
      });
      presetButtons.push({ id: preset.id, node: button });
      presetRow.appendChild(button);
    });
    experiment.appendChild(presetRow);

    var controls = element(doc, "div", { className: "bcs-controls" });
    var inputs = {};
    function addControl(key, label, min, max, step, digits, suffix) {
      var wrapper = element(doc, "div", { className: "bcs-control" });
      var output = element(doc, "output", { text: "" });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, "aria-label": label });
      var caption = element(doc, "label", { text: label + "：" });
      caption.appendChild(output);
      wrapper.appendChild(caption);
      wrapper.appendChild(input);
      wrapper.appendChild(element(doc, "div", { className: "bcs-scale" }, [
        element(doc, "span", { text: String(min) }),
        element(doc, "span", { text: String(max) })
      ]));
      input.addEventListener("input", function () {
        state[key] = Number(input.value);
        state.id = "custom";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits, suffix: suffix };
      controls.appendChild(wrapper);
    }
    addControl("lambda", "耦合 lambda=N(0)V", LIMITS.lambda[0], LIMITS.lambda[1], 0.01, 2, "");
    addControl("cutoff", "Debye 截断 omega_D", LIMITS.cutoff[0], LIMITS.cutoff[1], 0.05, 2, "");
    addControl("temperatureRatio", "约化温度 T/Tc", LIMITS.temperatureRatio[0], LIMITS.temperatureRatio[1], 0.01, 2, "");
    addControl("gammaRatio", "Dynes 展宽 Gamma/Delta0", LIMITS.gammaRatio[0], LIMITS.gammaRatio[1], 0.005, 3, "");
    experiment.appendChild(controls);

    var metrics = element(doc, "div", { className: "bcs-metrics" });
    var status = element(doc, "p", { className: "bcs-status" });
    var charts = element(doc, "div", { className: "bcs-charts" });
    var gapChart = element(doc, "div", { className: "bcs-chart" });
    var dosChart = element(doc, "div", { className: "bcs-chart" });
    gapChart.appendChild(element(doc, "h4", { text: "能隙曲线" }));
    var gapFrame = element(doc, "div", { className: "bcs-frame" });
    var gapSvg = element(doc, "svg");
    gapFrame.appendChild(gapSvg);
    gapChart.appendChild(gapFrame);
    gapChart.appendChild(element(doc, "div", { className: "bcs-legend" }, [
      element(doc, "span", { className: "bcs-legend-item" }, [element(doc, "i", { className: "bcs-swatch bcs-swatch-blue" }), "自洽 Delta(T)/Delta0"]),
      element(doc, "span", { className: "bcs-legend-item" }, [element(doc, "i", { className: "bcs-swatch bcs-swatch-gold" }), "当前温度"])
    ]));
    dosChart.appendChild(element(doc, "h4", { text: "准粒子态密度" }));
    var dosFrame = element(doc, "div", { className: "bcs-frame" });
    var dosSvg = element(doc, "svg");
    dosFrame.appendChild(dosSvg);
    dosChart.appendChild(dosFrame);
    dosChart.appendChild(element(doc, "div", { className: "bcs-legend" }, [
      element(doc, "span", { className: "bcs-legend-item" }, [element(doc, "i", { className: "bcs-swatch bcs-swatch-gold" }), "理想 DOS"]),
      element(doc, "span", { className: "bcs-legend-item" }, [element(doc, "i", { className: "bcs-swatch bcs-swatch-green" }), "Dynes 展宽"])
    ]));
    charts.appendChild(gapChart);
    charts.appendChild(dosChart);
    experiment.appendChild(metrics);
    experiment.appendChild(status);
    experiment.appendChild(charts);
    var tableWrap = element(doc, "div", { className: "bcs-table-wrap" });
    var table = element(doc, "table");
    tableWrap.appendChild(table);
    experiment.appendChild(tableWrap);
    experiment.appendChild(element(doc, "p", { className: "bcs-footnote", text: "理想 DOS 在 E=Delta 处有平方根奇点；寿命、温度卷积和仪器分辨率会把它钝化。这里的 Gamma 是 Dynes/数值展宽参数，不是对材料寿命的测量。能隙是模型自洽序参量的结果，不单独证明零电阻或 Meissner 效应。" }));
    shell.appendChild(experiment);
    root.replaceChildren(shell);

    function renderPrediction() {
      questionButtons.forEach(function (buttons, questionIndex) {
        buttons.forEach(function (choice) {
          choice.node.setAttribute("aria-pressed", answers[questionIndex] === choice.value ? "true" : "false");
        });
      });
    }

    function render() {
      Object.keys(inputs).forEach(function (key) {
        var control = inputs[key];
        control.input.value = String(state[key]);
        control.output.textContent = format(state[key], control.digits) + control.suffix;
      });
      presetButtons.forEach(function (button) {
        button.node.setAttribute("aria-pressed", state.id === button.id ? "true" : "false");
      });
      var result = evaluate(state);
      var curve = gapCurve(result, 48);
      var density = dosCurve(result, 160);
      metrics.replaceChildren(
        metric(doc, "T/Tc", format(result.temperatureRatio, 2)),
        metric(doc, "Delta(T)/Delta0", format(result.gapRatio, 5)),
        metric(doc, "Delta0", format(result.delta0, 5)),
        metric(doc, "kB Tc / omega_D", format(result.tc / result.cutoff, 5)),
        metric(doc, "2Delta0 / (kB Tc)", format(result.ratio, 4)),
        metric(doc, "积分残差 lambda I - 1", format(result.residual, 3)),
        metric(doc, "I", format(result.integral, 5)),
        metric(doc, "Gamma/Delta0", format(result.gammaRatio, 3))
      );
      var statusText = result.status === "paired"
        ? "当前温度低于 Tc：二分找到正能隙根，积分残差应接近 0。"
        : result.status === "zero"
          ? "T=0：使用有限 Debye 截断的零温自洽解。"
          : result.status === "critical"
            ? "T=Tc：只保留 Delta=0 的临界边界；不把它当作一个正能隙根。"
            : "T>Tc：Delta=0 是正常态边界值，正能隙方程没有物理解。";
      status.textContent = statusText;
      drawGapChart(doc, gapSvg, result, curve);
      drawDosChart(doc, dosSvg, result, density);
      renderTable(doc, table, result);
    }

    revealButton.addEventListener("click", function () {
      if (answers.length !== QUESTIONS.length || answers.some(function (answer) { return !answer; })) {
        feedback.textContent = "请先完成全部三问。";
        feedback.className = "bcs-feedback bcs-warn";
        return;
      }
      var correct = QUESTIONS.reduce(function (count, question, index) {
        return count + (answers[index] === question.answer ? 1 : 0);
      }, 0);
      revealed = true;
      experiment.hidden = false;
      feedback.textContent = "已揭晓：" + correct + "/" + QUESTIONS.length + " 项预测命中；现在可以调参并核对残差。";
      feedback.className = "bcs-feedback " + (correct === QUESTIONS.length ? "bcs-pass" : "bcs-warn");
      render();
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
    });
    resetPredictionButton.addEventListener("click", function () {
      answers = [];
      revealed = false;
      experiment.hidden = true;
      feedback.textContent = "三问都作答后，结果才会出现。";
      feedback.className = "bcs-feedback";
      renderPrediction();
    });
    renderPrediction();
    render();
    return { uid: uid, revealed: function () { return revealed; } };
  }

  return {
    LIMITS: LIMITS,
    PRESETS: PRESETS,
    normalizeConfig: normalizeConfig,
    gapIntegral: gapIntegral,
    gapResidual: gapResidual,
    zeroTemperatureGap: zeroTemperatureGap,
    criticalTemperature: criticalTemperature,
    solveDeltaAtTemperature: solveDeltaAtTemperature,
    evaluate: evaluate,
    gapCurve: gapCurve,
    quasiparticleDos: quasiparticleDos,
    dosCurve: dosCurve,
    mount: mount,
    selfTest: selfTest
  };
});
