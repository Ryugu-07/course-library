(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ito-sde", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ito-sde self-test: PASS (" + report.checks + " checks, " + report.models + " models)");
    } catch (error) {
      console.error("ito-sde self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-ito-sde-lab-styles";
  var INSTANCE = 0;
  var LEVELS = [8, 16, 32, 64, 128];
  var DEFAULTS = {
    model: "ito",
    x0: 1,
    drift: 0.35,
    sigma: 0.7,
    horizon: 1,
    level: 2,
    path: 4,
    seed: 20260722,
    paths: 64,
    noiseSteps: 256
  };
  Object.freeze(LEVELS); Object.freeze(DEFAULTS);
  var SEEDS = Object.freeze([20260722, 107, 20260910]);
  var MODEL_LABELS = {
    ode: "ODE：无噪声",
    ito: "Itô SDE：左端点 EM",
    strat: "Stratonovich：预测校正"
  };
  var STYLE_TEXT = [
    ".ito-sde-lab{--isde-blue:var(--cl-blue,#315f9d);--isde-gold:var(--cl-gold,#9b6a12);--isde-green:var(--cl-green,#39734d);--isde-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".ito-sde-lab *{box-sizing:border-box}.ito-sde-lab [hidden]{display:none!important}.ito-sde-lab h3,.ito-sde-lab h4{margin:0 0 8px;line-height:1.35}.ito-sde-lab p{margin:8px 0}",
    ".ito-sde-lab button,.ito-sde-lab select,.ito-sde-lab input{font:inherit}.ito-sde-lab button,.ito-sde-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.ito-sde-lab button{padding:8px 12px;cursor:pointer}.ito-sde-lab button:hover,.ito-sde-lab select:hover{border-color:var(--accent)}.ito-sde-lab button[aria-pressed='true'],.ito-sde-lab .isde-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.ito-sde-lab button:focus-visible,.ito-sde-lab select:focus-visible,.ito-sde-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".ito-sde-lab .isde-note,.ito-sde-lab .isde-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.ito-sde-lab .isde-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0;padding:12px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border)}.ito-sde-lab .isde-control{display:grid;gap:5px;min-width:0}.ito-sde-lab .isde-control label{color:var(--fg-soft);font-size:12.5px;font-weight:750}.ito-sde-lab .isde-control output{color:var(--accent);font-variant-numeric:tabular-nums}.ito-sde-lab input[type='range']{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.ito-sde-lab select{width:100%;padding:7px 9px}",
    ".ito-sde-lab .isde-predict{min-width:0;margin:14px 0;padding:12px 14px;border:0;border-left:3px solid var(--isde-gold);background:var(--bg)}.ito-sde-lab .isde-predict legend{max-width:100%;padding:0;font-weight:700;font-size:14px;line-height:1.5}.ito-sde-lab .isde-predict strong{display:block;margin-bottom:8px}.ito-sde-lab .isde-choice{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.ito-sde-lab .isde-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.ito-sde-lab .isde-actions>*{flex:1 1 170px}.ito-sde-lab .isde-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.ito-sde-lab .isde-pass{color:var(--isde-green)}.ito-sde-lab .isde-warn{color:var(--isde-red)}",
    ".ito-sde-lab .isde-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.ito-sde-lab .isde-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}.ito-sde-lab .isde-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ito-sde-lab .isde-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.ito-sde-lab .isde-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.ito-sde-lab .isde-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start}.ito-sde-lab .isde-panel{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.ito-sde-lab .isde-panel h4{font-size:13px;color:var(--fg-soft)}.ito-sde-lab svg{display:block;width:680px;max-width:none!important;height:auto;color:var(--fg)}.ito-sde-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ito-sde-lab .isde-grid{stroke:currentColor;stroke-opacity:.15;stroke-width:1}.ito-sde-lab .isde-axis{stroke:currentColor;stroke-opacity:.65;stroke-width:1.2}.ito-sde-lab .isde-ode{fill:none;stroke:var(--isde-gold);stroke-width:2.4;stroke-dasharray:7 4}.ito-sde-lab .isde-num{fill:none;stroke:var(--isde-blue);stroke-width:3}.ito-sde-lab .isde-exact{fill:none;stroke:var(--isde-green);stroke-width:2;stroke-dasharray:5 4}.ito-sde-lab .isde-hist{fill:var(--isde-blue);fill-opacity:.64;stroke:var(--isde-blue);stroke-width:1}.ito-sde-lab .isde-exact-hist{fill:none;stroke:var(--isde-green);stroke-width:2;stroke-dasharray:5 4}.ito-sde-lab .isde-error-strong{fill:none;stroke:var(--isde-blue);stroke-width:3}.ito-sde-lab .isde-error-weak{fill:none;stroke:var(--isde-gold);stroke-width:3;stroke-dasharray:6 4}.ito-sde-lab .isde-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:7px 2px 0;color:var(--fg-soft);font-size:12px}.ito-sde-lab .isde-swatch{display:inline-block;width:24px;height:0;margin-right:5px;border-top:3px solid currentColor;vertical-align:middle}.ito-sde-lab .isde-swatch-dash{border-top-style:dashed}",
    ".ito-sde-lab .isde-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px}.ito-sde-lab table{width:100%;min-width:1100px;display:table!important;max-width:none!important;overflow:visible!important;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ito-sde-lab th,.ito-sde-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.ito-sde-lab th{color:var(--fg-soft);font-size:11.5px}.ito-sde-lab td:not(:first-child){text-align:right}.ito-sde-lab .isde-boundary{margin-top:12px;padding:10px 12px;border-left:3px solid var(--isde-red);background:var(--bg);color:var(--fg-soft);font-size:13px;line-height:1.7}",
    "@media(max-width:850px){.ito-sde-lab .isde-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.ito-sde-lab .isde-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:520px){.ito-sde-lab .isde-controls{grid-template-columns:minmax(0,1fr)}.ito-sde-lab .isde-choice{grid-template-columns:minmax(0,1fr)}.ito-sde-lab .isde-panel{padding:5px}}@media(prefers-reduced-motion:reduce){.ito-sde-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ,".ito-sde-lab .isde-scroll{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain}.ito-sde-lab .isde-scroll:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ito-sde-lab button:disabled{opacity:.5;cursor:not-allowed}@media(prefers-reduced-motion:reduce){html:has(.ito-sde-lab){scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function range(value, lo, hi, name, integer) {
    if (!finite(value) || value < lo || value > hi || (integer && !Number.isInteger(value))) {
      throw new RangeError(name + " outside its domain");
    }
    return value;
  }

  function modelName(model) {
    if (!Object.prototype.hasOwnProperty.call(MODEL_LABELS, model)) throw new RangeError("unknown model");
    return model;
  }

  function copyConfig(config) {
    if (config !== undefined && (!config || typeof config !== "object" || Array.isArray(config))) throw new TypeError("configuration must be an object");
    var source = config || {}, result = {};
    Object.keys(source).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) throw new RangeError("unknown parameter " + key);
    });
    Object.keys(DEFAULTS).forEach(function (key) { result[key] = source[key] === undefined ? DEFAULTS[key] : source[key]; });
    modelName(result.model);
    range(result.x0, .2, 3, "x0"); range(result.drift, -1, 1, "drift");
    range(result.sigma, 0, 1.4, "sigma"); range(result.horizon, .5, 2, "horizon");
    range(result.level, 0, LEVELS.length - 1, "level", true);
    range(result.path, 0, 63, "path", true); range(result.seed, 0, 4294967295, "seed", true);
    if (result.paths !== 64 || result.noiseSteps !== 256) throw new RangeError("ensemble is fixed at 64 paths and 256 increments");
    return Object.freeze(result);
  }

  function makeRng(seed) {
    range(seed, 0, 4294967295, "seed", true);
    var state = seed;
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296;
    };
  }

  function gaussian(rng) {
    if (typeof rng !== "function") throw new TypeError("rng must be a function");
    var u = rng(), v = rng();
    if (!finite(u) || !finite(v) || u <= 0 || u >= 1 || v <= 0 || v >= 1) throw new RangeError("uniform draws must be strictly between 0 and 1");
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function sum(values) {
    var total = 0, correction = 0;
    values.forEach(function (v) {
      var y = v - correction, next = total + y;
      correction = (next - total) - y; total = next;
    });
    return total;
  }

  function log1pmx(x) {
    if (Math.abs(x) > .01) return Math.log1p(x) - x;
    var power = -x*x, total = power/2;
    for (var k = 3; k < 128; k += 1) {
      power *= -x;
      var next = total + power/k;
      if (next === total) break;
      total = next;
    }
    return total;
  }

  function discreteMean(config, steps) {
    var c = copyConfig(config); range(steps, 1, 256, "steps", true);
    var h = c.horizon / steps, u = c.drift * h, v = c.sigma*c.sigma*h;
    var extra = c.model === "strat" ? .5*(u*u+v) : 0;
    var w = u + extra;
    if (w <= -1) throw new RangeError("mean multiplier must be positive");
    var targetLog = (c.drift + (c.model === "strat" ? .5*c.sigma*c.sigma : 0))*c.horizon;
    var logBias = log1pmx(w) + (c.model === "strat" ? .5*u*u : 0);
    if (c.model === "strat" && Math.abs(w) < .1) {
      // Cancel the quadratic term algebraically, before rounding: for v=0
      // the first nonzero Heun mean error is cubic in u, even for tiny u.
      logBias = -.5 * extra * (2*u + extra);
      var power = w*w*w;
      for (var k=3;k<256;k++) {
        var next = logBias + power/k;
        if (next === logBias) break;
        logBias = next; power *= -w;
      }
    }
    var differenceLog = steps * logBias;
    var exact = c.x0*Math.exp(targetLog);
    var bias = exact*Math.expm1(differenceLog);
    return {mean: c.x0*Math.exp(steps*Math.log1p(w)), bias: bias, weak: Math.abs(bias), multiplier: 1+w};
  }

  function makeNoise(config) {
    config = copyConfig(config);
    var noise = [];
    var dt = config.horizon / config.noiseSteps;
    for (var path = 0; path < config.paths; path += 1) {
      var rng = makeRng((config.seed + path * 7919) >>> 0);
      var increments = [];
      for (var index = 0; index < config.noiseSteps; index += 1) {
        increments.push(Math.sqrt(dt) * gaussian(rng));
      }
      noise.push(increments);
    }
    return noise;
  }

  function aggregateIncrements(fine, steps, noiseSteps) {
    range(noiseSteps, 1, 256, "noiseSteps", true);
    range(steps, 1, noiseSteps, "steps", true);
    if (!Array.isArray(fine) || fine.length !== noiseSteps || fine.some(function (x) { return !finite(x); })) throw new RangeError("invalid increment array");
    if (noiseSteps % steps !== 0) throw new RangeError("steps must divide noiseSteps");
    var block = noiseSteps / steps;
    var result = [];
    for (var i = 0; i < steps; i += 1) {
      result.push(sum(fine.slice(i*block, (i+1)*block)));
    }
    return result;
  }

  function exactValue(model, t, x0, drift, sigma, brownian) {
    modelName(model); range(t, 0, 2, "time"); range(x0, .2, 3, "x0");
    range(drift, -1, 1, "drift"); range(sigma, 0, 1.4, "sigma");
    if (!finite(brownian)) throw new RangeError("Brownian value must be finite");
    if (model === "ode") return x0 * Math.exp(drift * t);
    if (model === "strat") return x0 * Math.exp(drift * t + sigma * brownian);
    return x0 * Math.exp((drift - 0.5 * sigma * sigma) * t + sigma * brownian);
  }

  function exactMean(model, x0, drift, sigma, horizon) {
    exactValue(model, horizon, x0, drift, sigma, 0);
    if (model === "strat") return x0 * Math.exp((drift + 0.5 * sigma * sigma) * horizon);
    return x0 * Math.exp(drift * horizon);
  }

  function eulerTrace(model, x0, drift, sigma, horizon, increments) {
    exactValue(model, horizon, x0, drift, sigma, 0);
    if (!Array.isArray(increments) || !increments.length || increments.length > 256 || increments.some(function (x) { return !finite(x); })) throw new RangeError("invalid increments");
    var h = horizon / increments.length;
    var x = x0;
    var brownian = 0;
    var values = [x];
    for (var i = 0; i < increments.length; i += 1) {
      var dw = increments[i];
      if (model === "ode") {
        x = x + drift * x * h;
      } else if (model === "ito") {
        x = x + drift * x * h + sigma * x * dw;
      } else {
        var predictor = x + drift * x * h + sigma * x * dw;
        x = x + 0.5 * (drift * x + drift * predictor) * h +
          0.5 * (sigma * x + sigma * predictor) * dw;
      }
      brownian += dw;
      values.push(x);
    }
    return { values: values, brownian: sum(increments) };
  }

  function variance(values) {
    if (!values.length) return 0;
    var mean = sum(values) / values.length;
    return sum(values.map(function (value) { return (value-mean)*(value-mean); })) / values.length;
  }

  function fitOrder(rows, key) {
    var points = rows.filter(function (row) { return row[key] > 0 && finite(row[key]); });
    if (points.length < 2) return null;
    var xs = points.map(function (row) { return Math.log(row.h); });
    var ys = points.map(function (row) { return Math.log(row[key]); });
    var xMean = xs.reduce(function (sum, value) { return sum + value; }, 0) / xs.length;
    var yMean = ys.reduce(function (sum, value) { return sum + value; }, 0) / ys.length;
    var numerator = 0;
    var denominator = 0;
    for (var i = 0; i < xs.length; i += 1) {
      numerator += (xs[i] - xMean) * (ys[i] - yMean);
      denominator += (xs[i] - xMean) * (xs[i] - xMean);
    }
    return denominator ? numerator / denominator : null;
  }

  function simulate(input) {
    var config = copyConfig(input);
    var noise = makeNoise(config);
    var rows = [], qvRows = [];
    var endpoints = noise.map(function (path) { return sum(path); });
    var exactEndpoints = endpoints.map(function (B) { return exactValue(config.model, config.horizon, config.x0, config.drift, config.sigma, B); });
    LEVELS.forEach(function (steps) {
      var h = config.horizon / steps;
      var numerical = [];
      var exact = [];
      for (var path = 0; path < config.paths; path += 1) {
        var increments = aggregateIncrements(noise[path], steps, config.noiseSteps);
        var trace = eulerTrace(config.model, config.x0, config.drift, config.sigma, config.horizon, increments);
        numerical.push(trace.values[trace.values.length - 1]);
        exact.push(exactEndpoints[path]);
      }
      var strong = Math.sqrt(numerical.reduce(function (sum, value, index) {
        return sum + (value - exact[index]) * (value - exact[index]);
      }, 0) / config.paths);
      var numericMean = sum(numerical) / config.paths;
      var exactSampleMean = sum(exact) / config.paths;
      var theory = discreteMean(config, steps);
      var differences = numerical.map(function (v,j) { return v-exact[j]; });
      var paired = sum(differences)/config.paths;
      var pairedSE = Math.sqrt(variance(differences)/(config.paths-1));
      var chosen = aggregateIncrements(noise[config.path], steps, config.noiseSteps);
      var B = 0, leftSum = 0, trapezoid = 0;
      chosen.forEach(function (dw) { leftSum += B*dw; trapezoid += (B+dw/2)*dw; B += dw; });
      var quadratic = sum(chosen.map(function (dw) { return dw*dw; }));
      qvRows.push({steps:steps, qv:quadratic, brownian:B, left:leftSum, trapezoid:trapezoid,
        leftIdentity:(B*B-quadratic)/2, trapezoidIdentity:B*B/2, itoTarget:(B*B-config.horizon)/2});
      rows.push({
        steps: steps,
        h: h,
        strong: strong,
        weak: theory.weak,
        analyticDiscreteMean: theory.mean,
        analyticBias: theory.bias,
        samplingDeviation: numericMean - theory.mean,
        totalMeanDeviation: numericMean - exactMean(config.model, config.x0, config.drift, config.sigma, config.horizon),
        pairedMean: paired,
        pairedSE: pairedSE,
        negativeEndpoints: numerical.filter(function (v) { return v < 0; }).length,
        numerical: numerical,
        exact: exact,
        numericalMean: numericMean,
        exactSampleMean: exactSampleMean,
        numericalVariance: variance(numerical),
        exactVariance: variance(exact)
      });
    });
    var selected = rows[config.level];
    var selectedSteps = selected.steps;
    var selectedIncrements = aggregateIncrements(noise[config.path], selectedSteps, config.noiseSteps);
    var selectedTrace = eulerTrace(config.model, config.x0, config.drift, config.sigma, config.horizon, selectedIncrements);
    var exactTrace = [config.x0];
    var brownian = 0;
    for (var index = 0; index < selectedIncrements.length; index += 1) {
      brownian += selectedIncrements[index];
      exactTrace.push(exactValue(config.model, (index + 1) * config.horizon / selectedSteps, config.x0, config.drift, config.sigma, brownian));
    }
    return {
      config: config,
      rows: rows,
      qvRows: qvRows,
      selected: selected,
      selectedTrace: selectedTrace.values,
      selectedExactTrace: exactTrace,
      strongOrder: fitOrder(rows, "strong"),
      weakOrder: fitOrder(rows, "weak"),
      analyticMean: exactMean(config.model, config.x0, config.drift, config.sigma, config.horizon),
      modelLabel: MODEL_LABELS[config.model]
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.0001)) return value.toExponential(5);
    var text = value.toFixed(places);
    if (value !== 0 && Number(text) === 0) return value.toExponential(5);
    return text.indexOf(".") < 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, String(attrs[key]));
    });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function htmlNode(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function pathData(values, xMap, yMap) {
    return values.map(function (value, index) {
      return (index ? "L" : "M") + xMap(index, values.length).toFixed(12) + " " + yMap(value).toFixed(12);
    }).join(" ");
  }

  function chartBase(doc, title, description, width, height) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": description });
    svg.appendChild(svgNode(doc, "title", {}, title));
    svg.appendChild(svgNode(doc, "desc", {}, description));
    return svg;
  }

  function drawGrid(doc, svg, left, top, right, bottom, min, max, yMap, ticks) {
    for (var i = 0; i <= ticks; i += 1) {
      var value = min + (max - min) * i / ticks;
      var y = yMap(value);
      svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: y, y2: y, class: "isde-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: left - 6, y: y + 4, "text-anchor": "end", "font-size": 10 }, format(value, 2)));
    }
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, class: "isde-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: left, y1: top, y2: bottom, class: "isde-axis" }));
  }

  function drawPathChart(doc, data, uid) {
    var width = 680;
    var height = 290;
    var left = 48;
    var right = 662;
    var top = 22;
    var bottom = 246;
    var ode = data.selectedExactTrace.map(function (_, index) {
      return exactValue("ode", index*data.config.horizon/(data.selectedExactTrace.length-1), data.config.x0, data.config.drift, data.config.sigma, 0);
    });
    var values = data.selectedTrace.concat(data.selectedExactTrace, data.config.model === "ode" ? [] : ode);
    var min = Math.min.apply(Math, values);
    var max = Math.max.apply(Math, values);
    if (max - min < 0.2) { min -= 0.1; max += 0.1; }
    var yMap = function (value) { return top + (max - value) / (max - min) * (bottom - top); };
    var xMap = function (index, count) { return left + index / Math.max(1, count - 1) * (right - left); };
    var svg = chartBase(doc, "同一 Brownian 噪声下的单路径", "数值路径、精确路径和 ODE 对照", width, height);
    svg.setAttribute("data-min", min); svg.setAttribute("data-max", max);
    drawGrid(doc, svg, left, top, right, bottom, min, max, yMap, 4);
    svg.appendChild(svgNode(doc, "path", { d: pathData(data.selectedExactTrace, xMap, yMap), class: "isde-exact" }));
    svg.appendChild(svgNode(doc, "path", { d: pathData(data.selectedTrace, xMap, yMap), class: "isde-num" }));
    if (data.config.model !== "ode") {
      svg.appendChild(svgNode(doc, "path", { d: pathData(ode, xMap, yMap), class: "isde-ode" }));
    }
    svg.appendChild(svgNode(doc, "text", { x: left, y: 15, "font-size": 12, "font-weight": 700 }, "X(t) · " + data.modelLabel));
    [0,.5,1].forEach(function(fraction) {
      svg.appendChild(svgNode(doc, "text", { x: left+(right-left)*fraction, y: bottom+25, "font-size": 12, "text-anchor": "middle" }, format(data.config.horizon*fraction,2)));
    });
    svg.appendChild(svgNode(doc, "text", { x: right - 2, y: 15, "font-size": 10, "text-anchor": "end" }, "path=" + (data.config.path + 1)));
    svg.id = uid;
    return svg;
  }

  function histogram(values, minimum, maximum, bins) {
    var counts = [];
    for (var i = 0; i < bins; i += 1) counts.push(0);
    var range = maximum - minimum || 1;
    values.forEach(function (value) {
      var index = Math.floor((value - minimum) / range * bins);
      index = clamp(index, 0, bins - 1);
      counts[index] += 1;
    });
    return counts;
  }

  function installStyles(doc) {
    doc = doc || (host && host.document);
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    var box = htmlNode(doc, "div", "isde-metric");
    box.appendChild(htmlNode(doc, "span", "", label));
    box.appendChild(htmlNode(doc, "strong", "", value));
    return box;
  }

  function drawErrorChart(doc, data) {
    var left=90,right=630,top=40,bottom=230,rows=data.rows;
    var positive=rows.flatMap(function(r){return [r.strong,r.weak];}).filter(function(v){return v>0;});
    var lo=positive.length?Math.floor(Math.log10(Math.min.apply(Math,positive))):-1;
    var hi=positive.length?Math.ceil(Math.log10(Math.max.apply(Math,positive))):0;
    if(hi===lo)hi=lo+1;
    var svg=chartBase(doc,"离散误差的对数图","有限样本终点 RMS 与解析弱均值误差；零值不进入对数坐标",680,340);
    svg.setAttribute("data-log-min",lo);svg.setAttribute("data-log-max",hi);
    var X=function(j){return left+(right-left)*j/(rows.length-1);};
    var Y=function(v){return bottom-(Math.log10(v)-lo)*(bottom-top)/(hi-lo);};
    for(var j=0;j<=4;j++){
      var exponent=lo+(hi-lo)*j/4,y=bottom-(bottom-top)*j/4;
      svg.appendChild(svgNode(doc,"line",{x1:left,x2:right,y1:y,y2:y,class:"isde-grid"}));
      svg.appendChild(svgNode(doc,"text",{x:left-8,y:y+4,"text-anchor":"end","font-size":12},"10^"+format(exponent,2)));
    }
    [["strong","isde-error-strong"],["weak","isde-error-weak"]].forEach(function(item){
      var parts=[],started=false;
      rows.forEach(function(r,j){
        if(r[item[0]]===0){started=false;return;}
        parts.push((started?"L":"M")+X(j).toFixed(12)+" "+Y(r[item[0]]).toFixed(12));started=true;
        svg.appendChild(svgNode(doc,"circle",{cx:X(j),cy:Y(r[item[0]]),r:4,class:item[1],"data-series":item[0],"data-step":r.steps}));
      });
      if(parts.length)svg.appendChild(svgNode(doc,"path",{d:parts.join(" "),class:item[1],"data-series":item[0]}));
    });
    rows.forEach(function(r,j){svg.appendChild(svgNode(doc,"text",{x:X(j),y:bottom+22,"text-anchor":"middle","font-size":12},format(r.h,5)));});
    svg.appendChild(svgNode(doc,"text",{x:left,y:22,"font-size":14},"误差（X 的单位）；横轴标签为 h，向右逐次减半"));
    svg.appendChild(svgNode(doc,"text",{x:left,y:280,"font-size":13},"蓝实线：64 路径终点 RMS；金虚线：解析弱均值误差"));
    var zeros=rows.filter(function(r){return r.strong===0||r.weak===0;}).map(function(r){return r.steps+" 步";});
    svg.appendChild(svgNode(doc,"text",{x:left,y:310,"font-size":12},zeros.length?"含零值的层级："+zeros.join("、")+"（零不画点）":"全部误差为正；图中没有最低误差地板"));
    return svg;
  }

  function drawDistributionChart(doc, data) {
    var left=70,right=630,top=35,bottom=235;
    var ledger=distributionLedger(data.selected),maximum=Math.max.apply(Math,ledger.numeric.concat(ledger.exact));
    var ymax=Math.max(4,Math.ceil(maximum/4)*4);
    var svg=chartBase(doc,"64 个终点的频数","全部样本按相同分箱比较数值与解析终点；不是总体密度",680,325);
    svg.setAttribute("data-min",ledger.min);svg.setAttribute("data-max",ledger.max);svg.setAttribute("data-count-max",ymax);
    for(var j=0;j<=4;j++){
      var y=bottom-(bottom-top)*j/4;
      svg.appendChild(svgNode(doc,"line",{x1:left,x2:right,y1:y,y2:y,class:"isde-grid"}));
      svg.appendChild(svgNode(doc,"text",{x:left-8,y:y+4,"text-anchor":"end","font-size":12},String(ymax*j/4)));
    }
    var bw=(right-left)/16;
    ledger.numeric.forEach(function(count,j){
      var x=left+bw*j;
      svg.appendChild(svgNode(doc,"rect",{x:x+1,y:bottom-(bottom-top)*count/ymax,width:bw-2,height:(bottom-top)*count/ymax,class:"isde-hist","data-bin":j}));
      svg.appendChild(svgNode(doc,"rect",{x:x+bw*.15,y:bottom-(bottom-top)*ledger.exact[j]/ymax,width:bw*.7,height:(bottom-top)*ledger.exact[j]/ymax,class:"isde-exact-hist","data-bin":j}));
    });
    for(var j=0;j<=4;j++)svg.appendChild(svgNode(doc,"text",{x:left+(right-left)*j/4,y:bottom+24,"text-anchor":"middle","font-size":12},format(ledger.min+(ledger.max-ledger.min)*j/4,3)));
    svg.appendChild(svgNode(doc,"text",{x:left,y:22,"font-size":14},"频数（条）；横轴为终点 X(T)"));
    svg.appendChild(svgNode(doc,"text",{x:left,y:290,"font-size":13},"蓝实心：数值终点；绿虚框：同噪声解析终点"));
    svg.appendChild(svgNode(doc,"text",{x:left,y:313,"font-size":12},"16 个箱包含全部 64 条路径；最后一箱包含最右端点。"));
    return svg;
  }

  function distributionLedger(selected) {
    var values=selected.numerical.concat(selected.exact),min=Math.min.apply(Math,values),max=Math.max.apply(Math,values);
    if(max-min<.2){min-=.1;max+=.1;}
    return {min:min,max:max,numeric:histogram(selected.numerical,min,max,16),exact:histogram(selected.exact,min,max,16)};
  }

  function mount(rootNode,api) {
    var doc=rootNode.ownerDocument;installStyles(doc);INSTANCE++;
    var uid="ito-sde-"+INSTANCE,state=Object.assign({},DEFAULTS),prediction="",revealed=false;
    var shell=htmlNode(doc,"div","ito-sde-lab");rootNode.replaceChildren(shell);
    shell.appendChild(htmlNode(doc,"h3","","同一份噪声，三本不同的误差账"));
    shell.appendChild(htmlNode(doc,"p","isde-note","64 条可复现伪随机路径，每条先生成 256 个增量，聚合为 8、16、32、64、128 步。更换种子比较抽样波动；参数时间单位一致，X 使用任意固定单位。"));
    var controls=htmlNode(doc,"div","isde-controls"),refs={};shell.appendChild(controls);
    function control(key,label,values,min,max,step){
      var box=htmlNode(doc,"div","isde-control"),id=uid+"-"+key,labelNode=htmlNode(doc,"label","",label+"："),output=doc.createElement("output");
      labelNode.htmlFor=id;output.setAttribute("for",id);labelNode.appendChild(output);
      var input=doc.createElement(values?"select":"input");input.id=id;input.setAttribute("aria-label",label);input.setAttribute("data-key",key);
      if(values)values.forEach(function(item){var o=doc.createElement("option");o.value=item[0];o.textContent=item[1];input.appendChild(o);});
      else{input.type="range";input.min=min;input.max=max;input.step=step;}
      box.appendChild(labelNode);box.appendChild(input);controls.appendChild(box);refs[key]={input:input,output:output};
      input.addEventListener("input",function(){state[key]=key==="model"?input.value:Number(input.value);state=Object.assign({},copyConfig(state));sync();if(revealed)render();});
    }
    control("model","方程与离散方法",Object.keys(MODEL_LABELS).map(function(k){return[k,MODEL_LABELS[k]];}));
    control("seed","噪声种子",SEEDS.map(function(v,j){return[v,"样本组 "+(j+1)+" · "+v];}));
    control("drift","漂移 a",null,-1,1,.05);control("sigma","噪声 σ",null,0,1.4,.05);
    control("x0","初值 X₀",null,.2,3,.1);control("horizon","终止时间 T",null,.5,2,.5);
    control("level","网格层级",null,0,4,1);control("path","显示路径",null,0,63,1);
    var gate=htmlNode(doc,"fieldset","isde-predict");shell.appendChild(gate);
    gate.appendChild(htmlNode(doc,"legend","","先判断：有限样本的数值均值减去解析真均值，包含什么？"));
    var choices=htmlNode(doc,"div","isde-choice"),buttons=[];gate.appendChild(choices);
    [["both","离散偏差与抽样波动"],["weak","只有弱离散误差"],["path","等于一条路径的误差"]].forEach(function(item){
      var button=htmlNode(doc,"button","",item[1]);button.type="button";button.setAttribute("aria-pressed","false");button.setAttribute("data-choice",item[0]);
      button.addEventListener("click",function(){prediction=item[0];revealed=false;results.hidden=true;sync();feedback.textContent="预测已记录；提交后查看三种误差的分账。";});
      choices.appendChild(button);buttons.push(button);
    });
    var actions=htmlNode(doc,"div","isde-actions"),reveal=htmlNode(doc,"button","isde-primary","揭示结果"),reset=htmlNode(doc,"button","","重置");
    reveal.type=reset.type="button";actions.appendChild(reveal);actions.appendChild(reset);gate.appendChild(actions);
    var feedback=htmlNode(doc,"p","isde-feedback","请选择一个预测。");feedback.setAttribute("aria-live","polite");gate.appendChild(feedback);
    var results=htmlNode(doc,"div","isde-results");results.hidden=true;results.tabIndex=-1;results.setAttribute("role","region");results.setAttribute("aria-label","Itô 实验结果");shell.appendChild(results);
    function sync(){
      Object.keys(refs).forEach(function(k){refs[k].input.value=String(state[k]);refs[k].output.textContent=k==="model"||k==="seed"?"":k==="level"?LEVELS[state.level]+" 步":k==="path"?(state.path+1)+" / 64":format(state[k],2);});
      buttons.forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-choice")===prediction));});
      reveal.disabled=!prediction||revealed;
    }
    function scroll(node,label){
      var wrap=htmlNode(doc,"div","isde-scroll");wrap.tabIndex=0;wrap.setAttribute("role","region");wrap.setAttribute("aria-label",label+"，可横向滚动");wrap.appendChild(node);return wrap;
    }
    function table(title,headers,rows){
      var t=doc.createElement("table");t.setAttribute("aria-label",title);
      var caption=doc.createElement("caption");caption.textContent=title;t.appendChild(caption);
      var head=doc.createElement("thead"),hr=doc.createElement("tr");headers.forEach(function(v){var th=doc.createElement("th");th.scope="col";th.textContent=v;hr.appendChild(th);});head.appendChild(hr);t.appendChild(head);
      var body=doc.createElement("tbody");rows.forEach(function(row){var tr=doc.createElement("tr");row.forEach(function(v){var td=doc.createElement("td");td.textContent=typeof v==="number"?format(v,7):v;tr.appendChild(td);});body.appendChild(tr);});t.appendChild(body);
      var wrap=scroll(t,title);wrap.classList.add("isde-table-wrap");results.appendChild(wrap);
    }
    function render(){
      var data=simulate(state),r=data.selected;results.replaceChildren();results.hidden=false;
      feedback.textContent=(prediction==="both"?"判断正确。":"请结合账本修正判断。")+" 样本均值偏差 = 解析离散偏差 + 抽样偏差；强误差另用同噪声配对。";
      var metrics=htmlNode(doc,"div","isde-metrics");results.appendChild(metrics);
      [["步长 h",r.h],["64 路径终点 RMS",r.strong],["解析弱均值误差 |bias|",r.weak],["样本均值−解析离散均值",r.samplingDeviation],["配对均差标准误估计",r.pairedSE],["数值负终点个数",r.negativeEndpoints]].forEach(function(v){metrics.appendChild(metric(doc,v[0],format(v[1],7)));});
      results.appendChild(htmlNode(doc,"p","isde-note","蓝色 RMS 是有限样本估计；金色弱误差使用测试函数 φ(x)=x 的解析离散均值，完全不含抽样波动。图表按原尺寸显示，聚焦后可用方向键横向滚动。"));
      [["单路径（网格顶点之间仅为连线）",drawPathChart(doc,data,uid+"-trajectory")],["全部终点的频数",drawDistributionChart(doc,data)],["误差与步长",drawErrorChart(doc,data)]].forEach(function(v){
        var panel=htmlNode(doc,"div","isde-panel");panel.appendChild(htmlNode(doc,"h4","",v[0]));panel.appendChild(scroll(v[1],v[0]));results.appendChild(panel);
      });
      results.appendChild(htmlNode(doc,"p","isde-note","路径图：蓝实线数值、绿虚线同噪声解析值、金虚线无噪声 ODE（随机模型时显示）。解析曲线只在离散时刻取值，连线不是真实布朗路径。"));
      table("五层误差账本",["步数","h","样本 RMS","解析弱误差","解析离散均值","样本数值均值","抽样偏差","配对均差","配对均差 SE"],
        data.rows.map(function(r){return[r.steps,r.h,r.strong,r.weak,r.analyticDiscreteMean,r.numericalMean,r.samplingDeviation,r.pairedMean,r.pairedSE];}));
      table("同一显示路径的二次变差与积分",["步数","Σ(ΔB)²","左端和","Itô 目标 (B²−T)/2","梯形和","B²/2"],
        data.qvRows.map(function(r){return[r.steps,r.qv,r.left,r.itoTarget,r.trapezoid,r.trapezoidIdentity];}));
      var ledger=distributionLedger(r);
      table("完整终点分箱",["箱","左端（含）","右端（仅末箱含）","数值个数","解析个数"],
        ledger.numeric.map(function(v,j){return[j+1,ledger.min+(ledger.max-ledger.min)*j/16,ledger.min+(ledger.max-ledger.min)*(j+1)/16,v,ledger.exact[j]];}));
      results.appendChild(htmlNode(doc,"p","isde-boundary","当前解析真均值："+format(data.analyticMean,7)+"。接近机器精度的差值含浮点舍入，确定性模型也可能显示极小残差。SE 是64条伪随机配对差的样本标准误估计，不是精确置信保证。有限RMS斜率 "+format(data.strongOrder,3)+" 只拟合正误差点，不是收敛阶证明。EM 可能产生负值，本实验保留并计数；精确正初值几何布朗运动始终为正。"));
    }
    reveal.addEventListener("click",function(){if(!prediction||revealed)return;revealed=true;render();sync();results.focus();if(api&&api.announce)api.announce(rootNode,"Itô 实验结果已揭示。");});
    reset.addEventListener("click",function(){state=Object.assign({},DEFAULTS);prediction="";revealed=false;results.hidden=true;feedback.textContent="已重置，请重新判断。";sync();buttons[0].focus();});
    sync();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var config = copyConfig({ model: "ito", level: 2, path: 0 });
    var fine = makeNoise(config)[0];
    var coarse = aggregateIncrements(fine, 8, config.noiseSteps);
    check(coarse.length === 8, "coarse increment count");
    check(Math.abs(coarse.reduce(function (sum, value) { return sum + value; }, 0) - fine.reduce(function (sum, value) { return sum + value; }, 0)) < 1e-10, "Brownian coupling preserves total increment");
    check(Math.abs(exactValue("ito", 1, 1, 0.35, 0, 0) - exactValue("ode", 1, 1, 0.35, 0, 0)) < 1e-12, "zero noise agrees with ODE");
    check(Math.abs(exactMean("ito", 1, 0.35, 0.7, 1) - Math.exp(0.35)) < 1e-12, "Ito geometric mean");
    check(Math.abs(exactValue("strat", 1, 1, 0.35, 0.7, 0) - exactValue("ito", 1, 1, 0.35, 0.7, 0)) > 0.1, "Ito and Stratonovich drift correction");
    check(eulerTrace("ito", 1, 0.35, 0.7, 1, coarse).values.length === 9, "Euler trace length");
    var result = simulate(config);
    check(result.rows.length === LEVELS.length, "all step levels simulated");
    check(result.rows.every(function (row) { return finite(row.strong) && finite(row.weak); }), "finite error ledger");
    check(result.selected.numerical.length === config.paths, "ensemble size");
    check(discreteMean({model:"ito",drift:0,sigma:1.4},8).weak === 0,"mean test can be exactly unbiased with noise");
    check(Math.abs(discreteMean({model:"strat",drift:1e-20,sigma:0},8).bias/(-2.604166666666666e-63)-1)<1e-13,"tiny cubic Heun bias");
    check(format(10,0)==="10" && format(0,0)==="0","integer format");
    check(format(.0001,3)!=="0","nonzero format");
    var flat=simulate({drift:0,sigma:0});
    check(flat.rows.every(function(r){return r.strong===0&&r.weak===0;}),"constant solution exact");
    check(flat.strongOrder===null&&flat.weakOrder===null,"no log slope for zero errors");
    check(makeRng(0)()!==makeRng(1)(),"seed zero is distinct");
    return { checks: checks, models: Object.keys(MODEL_LABELS).length };
  }

  return {
    LEVELS: LEVELS,
    DEFAULTS: DEFAULTS,
    SEEDS: SEEDS,
    copyConfig: copyConfig,
    makeRng: makeRng,
    gaussian: gaussian,
    makeNoise: makeNoise,
    discreteMean: discreteMean,
    format: format,
    drawPathChart: drawPathChart,
    drawDistributionChart: drawDistributionChart,
    drawErrorChart: drawErrorChart,
    distributionLedger: distributionLedger,
    MODEL_LABELS: MODEL_LABELS,
    aggregateIncrements: aggregateIncrements,
    exactValue: exactValue,
    exactMean: exactMean,
    eulerTrace: eulerTrace,
    simulate: simulate,
    selfTest: selfTest,
    mount: mount
  };
});
