(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-magnetic-order", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("physics-magnetic-order self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-magnetic-order self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var LAB_ID = "physics-magnetic-order";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "physics-magnetic-order-styles";
    var DEFAULTS = { model: "ferro", coupling: 1, temperature: 0.65, field: 0.08 };
    var PRESETS = [
      { id: "ferro-ordered", label: "铁磁有序", model: "ferro", coupling: 1, temperature: 0.65, field: 0.08 },
      { id: "paramagnetic", label: "高温顺磁", model: "ferro", coupling: 1, temperature: 1.55, field: 0 },
      { id: "antiferro", label: "反铁磁有序", model: "antiferro", coupling: 1, temperature: 0.60, field: 0 },
      { id: "critical", label: "临界附近", model: "ferro", coupling: 1, temperature: 1.02, field: 0.01 }
    ];
    var COLORS = { blue: "#315f9d", orange: "#a36a16", green: "#39734d", red: "#b64335", gold: "#8b6517" };
    var STYLE_TEXT = [
      '[data-learning-lab="physics-magnetic-order"]{--mgo-blue:#315f9d;--mgo-orange:#a36a16;--mgo-green:#39734d;--mgo-red:#b64335;--mgo-gold:#8b6517;display:block;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-magnetic-order"] *{box-sizing:border-box}[data-learning-lab="physics-magnetic-order"] [hidden]{display:none!important}',
      '[data-learning-lab="physics-magnetic-order"] h3,[data-learning-lab="physics-magnetic-order"] h4{margin:0;letter-spacing:0}[data-learning-lab="physics-magnetic-order"] h3{font-size:1.18rem}[data-learning-lab="physics-magnetic-order"] h4{font-size:1rem;margin-top:14px}',
      '[data-learning-lab="physics-magnetic-order"] p{margin:8px 0}[data-learning-lab="physics-magnetic-order"] .mgo-muted,[data-learning-lab="physics-magnetic-order"] .mgo-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="physics-magnetic-order"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="physics-magnetic-order"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="physics-magnetic-order"] .mgo-prediction-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="physics-magnetic-order"] .mgo-prediction{display:grid;gap:5px;min-width:0}[data-learning-lab="physics-magnetic-order"] .mgo-prediction label{font-size:12.5px;font-weight:700}',
      '[data-learning-lab="physics-magnetic-order"] button,[data-learning-lab="physics-magnetic-order"] select,[data-learning-lab="physics-magnetic-order"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="physics-magnetic-order"] button,[data-learning-lab="physics-magnetic-order"] select{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-magnetic-order"] button:hover{border-color:var(--mgo-blue)}[data-learning-lab="physics-magnetic-order"] button:focus-visible,[data-learning-lab="physics-magnetic-order"] select:focus-visible,[data-learning-lab="physics-magnetic-order"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}',
      '[data-learning-lab="physics-magnetic-order"] .mgo-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="physics-magnetic-order"] .mgo-actions>*{flex:1 1 170px}[data-learning-lab="physics-magnetic-order"] .mgo-primary{border-color:var(--mgo-blue);background:var(--mgo-blue);color:#fff;font-weight:750}[data-learning-lab="physics-magnetic-order"] .mgo-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="physics-magnetic-order"] .mgo-warn{color:var(--mgo-red)}',
      '[data-learning-lab="physics-magnetic-order"] .mgo-layout{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.32fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="physics-magnetic-order"] .mgo-controls,[data-learning-lab="physics-magnetic-order"] .mgo-stage{min-width:0}[data-learning-lab="physics-magnetic-order"] .mgo-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="physics-magnetic-order"] .mgo-control{display:grid;gap:5px;min-width:0}[data-learning-lab="physics-magnetic-order"] .mgo-control label{display:flex;flex-wrap:wrap;justify-content:space-between;gap:5px;color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="physics-magnetic-order"] output{color:var(--mgo-blue);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="physics-magnetic-order"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mgo-blue)}[data-learning-lab="physics-magnetic-order"] .mgo-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow-x:auto;overflow-y:hidden}[data-learning-lab="physics-magnetic-order"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="physics-magnetic-order"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="physics-magnetic-order"] .mgo-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="physics-magnetic-order"] .mgo-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="physics-magnetic-order"] .mgo-landscape{fill:none;stroke:var(--mgo-blue);stroke-width:2.6}[data-learning-lab="physics-magnetic-order"] .mgo-phase{fill:none;stroke:var(--mgo-green);stroke-width:2.5}[data-learning-lab="physics-magnetic-order"] .mgo-zero{stroke:var(--mgo-gold);stroke-width:1.6;stroke-dasharray:5 4}[data-learning-lab="physics-magnetic-order"] .mgo-current{fill:var(--mgo-red);stroke:var(--bg,#fff);stroke-width:1.3}[data-learning-lab="physics-magnetic-order"] .mgo-arrow-a{stroke:var(--mgo-blue);stroke-width:2.7}[data-learning-lab="physics-magnetic-order"] .mgo-arrow-b{stroke:var(--mgo-orange);stroke-width:2.7}',
      '[data-learning-lab="physics-magnetic-order"] .mgo-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:8px 0 0;color:var(--fg-soft,currentColor);font-size:12px}[data-learning-lab="physics-magnetic-order"] .mgo-key{display:inline-flex;align-items:center;gap:5px}[data-learning-lab="physics-magnetic-order"] .mgo-swatch{display:inline-block;width:18px;height:3px;background:var(--mgo-blue)}[data-learning-lab="physics-magnetic-order"] .mgo-swatch[data-kind="phase"]{background:var(--mgo-green)}[data-learning-lab="physics-magnetic-order"] .mgo-swatch[data-kind="current"]{width:9px;height:9px;border-radius:50%;background:var(--mgo-red)}',
      '[data-learning-lab="physics-magnetic-order"] .mgo-preset-row{display:flex;flex-wrap:wrap;gap:7px}[data-learning-lab="physics-magnetic-order"] .mgo-preset-row button{flex:1 1 105px;font-size:12.5px}[data-learning-lab="physics-magnetic-order"] .mgo-preset-row button[aria-pressed="true"]{border-color:var(--mgo-blue);background:var(--mgo-blue);color:#fff;font-weight:750}',
      '[data-learning-lab="physics-magnetic-order"] .mgo-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="physics-magnetic-order"] .mgo-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="physics-magnetic-order"] .mgo-metric:nth-child(4n+1){border-color:var(--mgo-blue)}[data-learning-lab="physics-magnetic-order"] .mgo-metric:nth-child(4n+2){border-color:var(--mgo-orange)}[data-learning-lab="physics-magnetic-order"] .mgo-metric:nth-child(4n+3){border-color:var(--mgo-green)}[data-learning-lab="physics-magnetic-order"] .mgo-metric:nth-child(4n){border-color:var(--mgo-red)}[data-learning-lab="physics-magnetic-order"] .mgo-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="physics-magnetic-order"] .mgo-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-magnetic-order"] .mgo-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="physics-magnetic-order"] table{width:100%;min-width:570px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="physics-magnetic-order"] th,[data-learning-lab="physics-magnetic-order"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="physics-magnetic-order"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="physics-magnetic-order"] .mgo-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mgo-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="physics-magnetic-order"] .mgo-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:680px){[data-learning-lab="physics-magnetic-order"] .mgo-prediction-grid{grid-template-columns:1fr}[data-learning-lab="physics-magnetic-order"] .mgo-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="physics-magnetic-order"] .mgo-stage-frame svg{min-width:640px}}@media(max-width:430px){[data-learning-lab="physics-magnetic-order"] .mgo-metrics{grid-template-columns:1fr}[data-learning-lab="physics-magnetic-order"] .mgo-stage-frame{padding:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="physics-magnetic-order"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) { if (!condition) throw new Error(message); }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
    }

    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function copyDefaults() {
      return { model: DEFAULTS.model, coupling: DEFAULTS.coupling, temperature: DEFAULTS.temperature, field: DEFAULTS.field };
    }

    function normalizeConfig(input) {
      var source = input || {};
      var model = source.model === undefined ? DEFAULTS.model : String(source.model);
      var coupling = finite(source.coupling === undefined ? DEFAULTS.coupling : source.coupling, "coupling");
      var temperature = finite(source.temperature === undefined ? DEFAULTS.temperature : source.temperature, "temperature");
      var field = finite(source.field === undefined ? DEFAULTS.field : source.field, "field");
      if (model !== "ferro" && model !== "antiferro") throw new RangeError("model must be ferro or antiferro");
      if (coupling < 0.4 || coupling > 1.8 || temperature < 0.2 || temperature > 2.8 || field < -0.6 || field > 0.6) throw new RangeError("magnetic parameters are outside the teaching range");
      return { model: model, coupling: coupling, temperature: temperature, field: field };
    }

    function entropyPart(magnetization) {
      var m = Math.max(-1 + 1e-12, Math.min(1 - 1e-12, magnetization));
      var plus = (1 + m) / 2;
      var minus = (1 - m) / 2;
      return plus * Math.log(plus) + minus * Math.log(minus);
    }

    function interactionSign(model) { return model === "antiferro" ? -1 : 1; }

    function meanFieldFreeEnergy(mA, mB, input) {
      var config = normalizeConfig(input);
      var sign = interactionSign(config.model);
      return -sign * config.coupling * mA * mB / 2 - config.field * (mA + mB) / 2 + config.temperature * (entropyPart(mA) + entropyPart(mB)) / 2;
    }

    function fixedPoint(config, startA, startB) {
      var sign = interactionSign(config.model);
      var mA = startA;
      var mB = startB;
      for (var iteration = 0; iteration < 900; iteration += 1) {
        var nextA = Math.tanh((sign * config.coupling * mB + config.field) / config.temperature);
        var nextB = Math.tanh((sign * config.coupling * mA + config.field) / config.temperature);
        var updatedA = 0.65 * nextA + 0.35 * mA;
        var updatedB = 0.65 * nextB + 0.35 * mB;
        if (Math.max(Math.abs(updatedA - mA), Math.abs(updatedB - mB)) < 1e-11) {
          mA = updatedA;
          mB = updatedB;
          break;
        }
        mA = updatedA;
        mB = updatedB;
      }
      return { mA: mA, mB: mB, freeEnergy: meanFieldFreeEnergy(mA, mB, config) };
    }

    function solveMeanField(input) {
      var config = normalizeConfig(input);
      var samePositive = [0.95, 0.95];
      var sameNegative = [-0.95, -0.95];
      var oppositePositive = [0.95, -0.95];
      var oppositeNegative = [-0.95, 0.95];
      var zero = [0, 0];
      var seeds = config.model === "ferro"
        ? [samePositive, sameNegative, oppositePositive, oppositeNegative, zero]
        : [oppositePositive, oppositeNegative, samePositive, sameNegative, zero];
      var candidates = seeds.map(function (seed) { return fixedPoint(config, seed[0], seed[1]); });
      candidates.sort(function (left, right) { return left.freeEnergy - right.freeEnergy; });
      var best = candidates[0];
      return {
        config: config,
        mA: best.mA,
        mB: best.mB,
        magnetization: (best.mA + best.mB) / 2,
        staggered: (best.mA - best.mB) / 2,
        freeEnergy: best.freeEnergy,
        residualA: best.mA - Math.tanh((interactionSign(config.model) * config.coupling * best.mB + config.field) / config.temperature),
        residualB: best.mB - Math.tanh((interactionSign(config.model) * config.coupling * best.mA + config.field) / config.temperature),
        candidates: candidates
      };
    }

    function solveOnBranch(config, reference, field) {
      return fixedPoint({ model: config.model, coupling: config.coupling, temperature: config.temperature, field: field }, reference.mA, reference.mB);
    }

    function susceptibility(input, delta) {
      var config = normalizeConfig(input);
      var step = delta === undefined ? 0.001 : finite(delta, "field step");
      if (step <= 0) throw new RangeError("field step must be positive");
      var reference = solveMeanField(config);
      var lowerField = Math.max(-0.6, config.field - step);
      var upperField = Math.min(0.6, config.field + step);
      if (upperField <= lowerField) throw new RangeError("field step does not produce a finite difference");
      var lower = lowerField === config.field ? reference : solveOnBranch(config, reference, lowerField);
      var upper = upperField === config.field ? reference : solveOnBranch(config, reference, upperField);
      return ((upper.mA + upper.mB) / 2 - (lower.mA + lower.mB) / 2) / (upperField - lowerField);
    }

    function phaseCurve(input, count) {
      var config = normalizeConfig(input);
      var points = [];
      var samples = count === undefined ? 65 : Math.round(finite(count, "phase samples"));
      if (samples < 3) throw new RangeError("phase samples must be at least 3");
      for (var index = 0; index < samples; index += 1) {
        var temperature = 0.2 + 2.3 * index / (samples - 1);
        var result = solveMeanField({ model: config.model, coupling: config.coupling, temperature: temperature, field: 0 });
        points.push({ temperature: temperature, order: config.model === "ferro" ? Math.abs(result.magnetization) : Math.abs(result.staggered), magnetization: result.magnetization, staggered: result.staggered });
      }
      return points;
    }

    function minimizeUniformMoment(config, staggered) {
      var order = finite(staggered, "staggered order");
      if (order < -1 || order > 1) throw new RangeError("staggered order must be in [-1, 1]");
      if (config.model === "ferro") {
        return { order: order, uniformMoment: order, mA: order, mB: order, freeEnergy: meanFieldFreeEnergy(order, order, config) };
      }
      var lower = -1 + Math.abs(order);
      var upper = 1 - Math.abs(order);
      function valueAt(uniformMoment) {
        var mA = uniformMoment + order;
        var mB = uniformMoment - order;
        return { order: order, uniformMoment: uniformMoment, mA: mA, mB: mB, freeEnergy: meanFieldFreeEnergy(mA, mB, config) };
      }
      if (upper - lower < 1e-12) return valueAt((lower + upper) / 2);
      var golden = (Math.sqrt(5) - 1) / 2;
      var left = lower;
      var right = upper;
      var first = right - golden * (right - left);
      var second = left + golden * (right - left);
      var firstValue = valueAt(first).freeEnergy;
      var secondValue = valueAt(second).freeEnergy;
      for (var iteration = 0; iteration < 80; iteration += 1) {
        if (firstValue <= secondValue) {
          right = second;
          second = first;
          secondValue = firstValue;
          first = right - golden * (right - left);
          firstValue = valueAt(first).freeEnergy;
        } else {
          left = first;
          first = second;
          firstValue = secondValue;
          second = left + golden * (right - left);
          secondValue = valueAt(second).freeEnergy;
        }
      }
      return [valueAt(lower), valueAt(upper), valueAt((left + right) / 2), valueAt(first), valueAt(second)].reduce(function (best, candidate) {
        return candidate.freeEnergy < best.freeEnergy ? candidate : best;
      });
    }

    function landscape(input, count, anchor) {
      var config = normalizeConfig(input);
      var samples = count === undefined ? 121 : Math.round(finite(count, "landscape samples"));
      if (samples < 3) throw new RangeError("landscape samples must be at least 3");
      var anchorIndex = -1;
      if (anchor && Number.isFinite(anchor.order)) anchorIndex = Math.round(clamp(anchor.order, -1, 1) / 2 * (samples - 1) + (samples - 1) / 2);
      var points = [];
      for (var index = 0; index < samples; index += 1) {
        var order = -1 + 2 * index / (samples - 1);
        if (index === anchorIndex) order = clamp(anchor.order, -1, 1);
        var minimum = config.model === "antiferro" ? minimizeUniformMoment(config, order) : minimizeUniformMoment(config, order);
        points.push({ order: order, freeEnergy: minimum.freeEnergy, uniformMoment: minimum.uniformMoment, mA: minimum.mA, mB: minimum.mB });
      }
      return points;
    }

    function analyze(input) {
      var config = normalizeConfig(input);
      var result = solveMeanField(config);
      var curve = phaseCurve(config, 65);
      var currentOrder = config.model === "ferro" ? result.magnetization : result.staggered;
      var surface = landscape(config, 121, { order: currentOrder });
      var symmetryResidual = Math.abs(meanFieldFreeEnergy(0.43, config.model === "ferro" ? 0.43 : -0.43, { model: config.model, coupling: config.coupling, temperature: config.temperature, field: 0 }) - meanFieldFreeEnergy(-0.43, config.model === "ferro" ? -0.43 : 0.43, { model: config.model, coupling: config.coupling, temperature: config.temperature, field: 0 }));
      return { config: config, solution: result, curve: curve, landscape: surface, criticalTemperature: config.coupling, susceptibility: susceptibility(config), symmetryResidual: symmetryResidual };
    }

    function makeElement(doc, tag, attributes, children) {
      var node = doc.createElement(tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function makeSvg(doc, tag, attributes, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        node.setAttribute(key === "className" ? "class" : key, String(value));
      });
      (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function injectStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function svgText(doc, x, y, value, anchor, size) { return makeSvg(doc, "text", { x: x, y: y, "text-anchor": anchor || "start", "font-size": size || 11 }, [value]); }

    function drawChartAxes(doc, group, left, top, right, bottom, yMin, yMax, title, xLabel, yLabel) {
      group.appendChild(svgText(doc, left, top - 10, title, "start", 13));
      for (var tick = 0; tick <= 4; tick += 1) {
        var y = top + tick / 4 * (bottom - top);
        group.appendChild(makeSvg(doc, "line", { x1: left, y1: y, x2: right, y2: y, class: "mgo-grid" }));
        group.appendChild(svgText(doc, left - 7, y + 4, formatNumber(yMax - tick / 4 * (yMax - yMin), 2), "end", 10));
      }
      group.appendChild(makeSvg(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, class: "mgo-axis" }));
      group.appendChild(makeSvg(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, class: "mgo-axis" }));
      group.appendChild(svgText(doc, (left + right) / 2, bottom + 23, xLabel, "middle", 11));
      group.appendChild(svgText(doc, left - 33, (top + bottom) / 2, yLabel, "middle", 11));
      return { mapX: function (value, min, max) { return left + (value - min) / (max - min) * (right - left); }, mapY: function (value) { return bottom - (value - yMin) / (yMax - yMin) * (bottom - top); }, left: left, right: right, top: top, bottom: bottom };
    }

    function pointsPath(points, mapX, mapY) {
      return points.map(function (point, index) { return (index ? "L" : "M") + mapX(point.x).toFixed(2) + " " + mapY(point.y).toFixed(2); }).join(" ");
    }

    function drawSvg(doc, result) {
      var svg = makeSvg(doc, "svg", { viewBox: "0 0 820 520", role: "img", "aria-label": "平均场自由能地形、温度相图和两个子晶格的磁矩" });
      var landscapeValues = result.landscape.map(function (point) { return point.freeEnergy; });
      var fMin = Math.min.apply(null, landscapeValues);
      var fMax = Math.max.apply(null, landscapeValues);
      var fPad = Math.max(.06, (fMax - fMin) * .12);
      var leftChart = drawChartAxes(doc, svg, 52, 48, 390, 225, fMin - fPad, fMax + fPad, "自由能地形", result.config.model === "ferro" ? "m_A=m_B=q" : "q=(m_A-m_B)/2；M 最小化", "f(q)");
      var landPoints = result.landscape.map(function (point) { return { x: leftChart.mapX(point.order, -1, 1), y: leftChart.mapY(point.freeEnergy) }; });
      svg.appendChild(makeSvg(doc, "path", { d: landPoints.map(function (point, index) { return (index ? "L" : "M") + point.x.toFixed(2) + " " + point.y.toFixed(2); }).join(" "), class: "mgo-landscape" }));
      var currentOrder = result.config.model === "ferro" ? result.solution.magnetization : result.solution.staggered;
      var currentLandscapePoint = result.landscape.reduce(function (best, point) { return Math.abs(point.order - currentOrder) < Math.abs(best.order - currentOrder) ? point : best; }, result.landscape[0]);
      svg.appendChild(makeSvg(doc, "circle", { cx: leftChart.mapX(currentLandscapePoint.order, -1, 1), cy: leftChart.mapY(currentLandscapePoint.freeEnergy), r: 5, class: "mgo-current" }));
      svg.appendChild(makeSvg(doc, "line", { x1: leftChart.mapX(0, -1, 1), y1: leftChart.top, x2: leftChart.mapX(0, -1, 1), y2: leftChart.bottom, class: "mgo-zero" }));

      var rightChart = drawChartAxes(doc, svg, 460, 48, 790, 225, 0, 1.05, "零场有序度随温度", "T / K", result.config.model === "ferro" ? "|M|" : "|M_s|");
      var phasePoints = result.curve.map(function (point) { return { x: rightChart.mapX(point.temperature, .2, 2.5), y: rightChart.mapY(point.order) }; });
      svg.appendChild(makeSvg(doc, "path", { d: phasePoints.map(function (point, index) { return (index ? "L" : "M") + point.x.toFixed(2) + " " + point.y.toFixed(2); }).join(" "), class: "mgo-phase" }));
      var criticalX = rightChart.mapX(result.criticalTemperature, .2, 2.5);
      svg.appendChild(makeSvg(doc, "line", { x1: criticalX, y1: rightChart.top, x2: criticalX, y2: rightChart.bottom, class: "mgo-zero" }));
      var currentX = rightChart.mapX(result.config.temperature, .2, 2.5);
      var currentPhase = result.curve.reduce(function (best, point) { return Math.abs(point.temperature - result.config.temperature) < Math.abs(best.temperature - result.config.temperature) ? point : best; }, result.curve[0]);
      svg.appendChild(makeSvg(doc, "circle", { cx: currentX, cy: rightChart.mapY(currentPhase.order), r: 5, class: "mgo-current" }));
      svg.appendChild(svgText(doc, criticalX + 5, rightChart.top + 13, "T_c=" + formatNumber(result.criticalTemperature, 2), "start", 10));

      svg.appendChild(svgText(doc, 52, 275, result.config.model === "ferro" ? "当前状态：同向排列，M=(m_A+m_B)/2" : "当前状态：反向排列，M_s=(m_A-m_B)/2", "start", 13));
      var baseY = 365;
      for (var site = 0; site < 10; site += 1) {
        var isA = site % 2 === 0;
        var m = isA ? result.solution.mA : result.solution.mB;
        var x = 85 + site * 67;
        var direction = Math.sign(m) || 1;
        var length = 30 + 20 * Math.abs(m);
        svg.appendChild(makeSvg(doc, "circle", { cx: x, cy: baseY, r: 21, fill: isA ? "#315f9d" : "#a36a16", opacity: .16, stroke: isA ? COLORS.blue : COLORS.orange }));
        svg.appendChild(makeSvg(doc, "line", { x1: x, y1: baseY + 13 * direction, x2: x, y2: baseY - length * direction, class: isA ? "mgo-arrow-a" : "mgo-arrow-b" }));
        svg.appendChild(makeSvg(doc, "polygon", { points: x + "," + (baseY - length * direction) + " " + (x - 6) + "," + (baseY - (length - 10) * direction) + " " + (x + 6) + "," + (baseY - (length - 10) * direction), fill: isA ? COLORS.blue : COLORS.orange }));
        svg.appendChild(svgText(doc, x, baseY + 42, isA ? "A" : "B", "middle", 10));
      }
      svg.appendChild(svgText(doc, 52, 470, "m_A=" + formatNumber(result.solution.mA, 3) + "；m_B=" + formatNumber(result.solution.mB, 3) + "；场 h=" + formatNumber(result.config.field, 3), "start", 12));
      svg.appendChild(svgText(doc, 790, 470, "红点：当前温度 / 当前极小", "end", 11));
      return svg;
    }

    function metric(doc, label, value) { return makeElement(doc, "div", { className: "mgo-metric" }, [makeElement(doc, "span", { text: label }), makeElement(doc, "strong", { text: value })]); }

    function predictionField(doc, key, label, options) {
      var select = makeElement(doc, "select", { "data-mgo-prediction": key, "aria-label": label });
      select.appendChild(makeElement(doc, "option", { value: "", text: "请选择" }));
      options.forEach(function (option) { select.appendChild(makeElement(doc, "option", { value: option.value, text: option.label })); });
      return makeElement(doc, "div", { className: "mgo-prediction" }, [makeElement(doc, "label", {}, [label]), select]);
    }

    function selectedValue(form, key) {
      var select = form.querySelector('[data-mgo-prediction="' + key + '"]');
      return select && select.value ? select.value : "";
    }

    function mount(rootNode, api) {
      var doc = rootNode.ownerDocument || (host && host.document);
      if (!doc) throw new Error("a document is required to mount the lab");
      injectStyles(doc);
      var state = { config: copyDefaults(), predictions: {}, revealed: false, preset: "default", feedback: "" };
      var shell = makeElement(doc, "div", { className: "mgo-shell" });
      shell.appendChild(makeElement(doc, "h3", { text: "Magnetic-order lab：交换、对称性与两子晶格" }));
      shell.appendChild(makeElement(doc, "p", { className: "mgo-muted", text: "K 已吸收配位数 z；同一组自洽方程在 ferro 模式读 M，在 antiferro 模式读 staggered order M_s。" }));
      var predictionForm = makeElement(doc, "form", { className: "mgo-predictions" });
      predictionForm.appendChild(makeElement(doc, "fieldset", {}, [
        makeElement(doc, "legend", { text: "先预测，再揭示" }),
        makeElement(doc, "div", { className: "mgo-prediction-grid" }, [
          predictionField(doc, "order", "T<K、h≈0 时是否有自发有序？", [{ value: "yes", label: "有非零序参量" }, { value: "no", label: "仍为零" }, { value: "always", label: "与温度无关" }]),
          predictionField(doc, "antiferro", "反铁磁有序的均匀 M 通常是", [{ value: "zero", label: "接近零" }, { value: "large", label: "与 Ms 一样大" }, { value: "undefined", label: "无法定义" }]),
          predictionField(doc, "field", "小外场 h 的作用首先是", [{ value: "select", label: "选择 ± 分支" }, { value: "remove", label: "消灭交换" }, { value: "raiseTc", label: "必然升高 Tc" }])
        ])
      ]));
      var predictionActions = makeElement(doc, "div", { className: "mgo-actions" });
      var revealButton = makeElement(doc, "button", { type: "submit", className: "mgo-primary", text: "提交预测并揭示" });
      var resetButton = makeElement(doc, "button", { type: "button", text: "重置" });
      predictionActions.appendChild(revealButton);
      predictionActions.appendChild(resetButton);
      predictionForm.appendChild(predictionActions);
      var feedback = makeElement(doc, "p", { className: "mgo-feedback", "aria-live": "polite" });
      predictionForm.appendChild(feedback);
      shell.appendChild(predictionForm);

      var bench = makeElement(doc, "div", { hidden: true });
      var layout = makeElement(doc, "div", { className: "mgo-layout" });
      var controls = makeElement(doc, "div", { className: "mgo-controls" });
      controls.appendChild(makeElement(doc, "h4", { text: "参数" }));
      var modelSelect = makeElement(doc, "select", { "aria-label": "磁性类型" }, [makeElement(doc, "option", { value: "ferro", text: "ferro：铁磁" }), makeElement(doc, "option", { value: "antiferro", text: "antiferro：反铁磁" })]);
      modelSelect.addEventListener("change", function () { state.config.model = modelSelect.value; state.preset = "custom"; state.feedback = "磁性类型已更新。"; render(); });
      controls.appendChild(makeElement(doc, "div", { className: "mgo-control" }, [makeElement(doc, "label", {}, ["模型", modelSelect])]));
      var inputs = {};
      function addRange(key, label, min, max, step, digits) {
        var output = makeElement(doc, "output", { text: formatNumber(state.config[key], digits) });
        var input = makeElement(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
        input.addEventListener("input", function () { state.config[key] = finite(input.value, key); state.preset = "custom"; state.feedback = "参数已更新。"; render(); });
        inputs[key] = { input: input, output: output, digits: digits };
        controls.appendChild(makeElement(doc, "div", { className: "mgo-control" }, [makeElement(doc, "label", {}, [label, output]), input]));
      }
      addRange("coupling", "耦合 K (=k_B T_c)", "0.4", "1.8", "0.01", 2);
      addRange("temperature", "温度 T", "0.2", "2.8", "0.01", 2);
      addRange("field", "外场 h", "-0.6", "0.6", "0.01", 2);
      controls.appendChild(makeElement(doc, "h4", { text: "预设" }));
      var presetRow = makeElement(doc, "div", { className: "mgo-preset-row" });
      PRESETS.forEach(function (preset) {
        var button = makeElement(doc, "button", { type: "button", text: preset.label, "data-mgo-preset": preset.id, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.config = normalizeConfig(preset); state.preset = preset.id; state.feedback = "已切换预设；重新比较两个子晶格。"; render(); announce(preset.label + "预设已应用。"); });
        presetRow.appendChild(button);
      });
      controls.appendChild(presetRow);
      var stage = makeElement(doc, "div", { className: "mgo-stage" });
      var frame = makeElement(doc, "div", { className: "mgo-stage-frame" });
      var chartHost = makeElement(doc, "div");
      frame.appendChild(chartHost);
      frame.appendChild(makeElement(doc, "div", { className: "mgo-legend" }, [
        makeElement(doc, "span", { className: "mgo-key" }, [makeElement(doc, "i", { className: "mgo-swatch" }), "自由能 f(q)"]),
        makeElement(doc, "span", { className: "mgo-key" }, [makeElement(doc, "i", { className: "mgo-swatch", "data-kind": "phase" }), "零场有序度"]),
        makeElement(doc, "span", { className: "mgo-key" }, [makeElement(doc, "i", { className: "mgo-swatch", "data-kind": "current" }), "当前状态"])
      ]));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      bench.appendChild(layout);
      var metrics = makeElement(doc, "div", { className: "mgo-metrics" });
      bench.appendChild(metrics);
      var ledger = makeElement(doc, "div", { className: "mgo-ledger" });
      bench.appendChild(ledger);
      var note = makeElement(doc, "p", { className: "mgo-note" });
      bench.appendChild(note);
      shell.appendChild(bench);
      rootNode.replaceChildren(shell);

      function announce(message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }

      function renderLedger(result) {
        var solution = result.solution;
        var orderLabel = result.config.model === "ferro" ? "M" : "M_s";
        var table = makeElement(doc, "table", {});
        table.appendChild(makeElement(doc, "thead", {}, [makeElement(doc, "tr", {}, [makeElement(doc, "th", { text: "账本" }), makeElement(doc, "th", { text: "当前数值" }), makeElement(doc, "th", { text: "读法" })])]));
        var rows = [
          ["自洽解", "m_A=" + formatNumber(solution.mA, 4) + "，m_B=" + formatNumber(solution.mB, 4), "残差 max=" + formatNumber(Math.max(Math.abs(solution.residualA), Math.abs(solution.residualB)), 2)],
          ["序参量", orderLabel + "=" + formatNumber(result.config.model === "ferro" ? solution.magnetization : solution.staggered, 4), result.config.model === "ferro" ? "同向分量衡量净磁化。" : "反向分量衡量交错有序，均匀 M 可很小。"],
          ["响应", "chi=dM/dh≈" + formatNumber(result.susceptibility, 3), "这是当前有限差分与当前分支的局部响应，不是所有温度下的 Curie-Weiss 直线。"],
          ["对称性", "F(q)-F(-q) at h=0=" + formatNumber(result.symmetryResidual, 3), "h=0 时自旋翻转保持自由能；外场会倾斜两井。"]
        ];
        var body = makeElement(doc, "tbody", {});
        rows.forEach(function (row) { body.appendChild(makeElement(doc, "tr", {}, [makeElement(doc, "td", { text: row[0] }), makeElement(doc, "td", { text: row[1] }), makeElement(doc, "td", { text: row[2] })])); });
        table.appendChild(body);
        return table;
      }

      function render() {
        modelSelect.value = state.config.model;
        Object.keys(inputs).forEach(function (key) { inputs[key].input.value = String(state.config[key]); inputs[key].output.textContent = formatNumber(state.config[key], inputs[key].digits); });
        presetRow.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", button.getAttribute("data-mgo-preset") === state.preset ? "true" : "false"); });
        feedback.textContent = state.feedback;
        feedback.className = "mgo-feedback" + (state.feedback.indexOf("请先") === 0 ? " mgo-warn" : "");
        bench.hidden = !state.revealed;
        if (!state.revealed) return;
        var result = analyze(state.config);
        chartHost.replaceChildren(drawSvg(doc, result));
        var orderValue = result.config.model === "ferro" ? result.solution.magnetization : result.solution.staggered;
        metrics.replaceChildren(metric(doc, "m_A", formatNumber(result.solution.mA, 3)), metric(doc, "m_B", formatNumber(result.solution.mB, 3)), metric(doc, result.config.model === "ferro" ? "M" : "M_s", formatNumber(orderValue, 3)), metric(doc, "chi", formatNumber(result.susceptibility, 3)));
        ledger.replaceChildren(renderLedger(result));
        note.textContent = "边界提示：这是均匀两子晶格的平衡平均场代理。真实材料还要检查短程涨落、畴壁、磁各向异性、退磁场、动力学滞后和有限尺寸；平均场 Tc 与真实 Tc 不必相同。";
      }

      predictionForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var keys = ["order", "antiferro", "field"];
        if (!keys.every(function (key) { return selectedValue(predictionForm, key); })) { state.feedback = "请先完成三项预测；揭示前不显示自由能和自洽解。"; render(); return; }
        var expected = { order: "yes", antiferro: "zero", field: "select" };
        var correct = keys.filter(function (key) { return selectedValue(predictionForm, key) === expected[key]; }).length;
        state.predictions = { order: selectedValue(predictionForm, "order"), antiferro: selectedValue(predictionForm, "antiferro"), field: selectedValue(predictionForm, "field") };
        state.revealed = true;
        state.feedback = "已揭示：" + correct + "/3 命中。现在切换 ferro/antiferro，观察 M 与 M_s 的区别。";
        render();
        announce(state.feedback);
      });
      resetButton.addEventListener("click", function () { predictionForm.reset(); state = { config: copyDefaults(), predictions: {}, revealed: false, preset: "default", feedback: "" }; render(); announce("磁性实验已重置；预测重新隐藏。"); });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var base = analyze(DEFAULTS);
      check(base.solution.mA > 0.8 && base.solution.mB > 0.8, "ferromagnetic default has a positive ordered solution");
      check(Math.max(Math.abs(base.solution.residualA), Math.abs(base.solution.residualB)) < 1e-8, "default solution satisfies both self-consistency equations");
      check(base.criticalTemperature === 1, "mean-field critical temperature is K in scaled units");
      check(base.symmetryResidual < 1e-12, "zero-field free energy has spin-flip symmetry");
      var high = solveMeanField({ model: "ferro", coupling: 1, temperature: 1.55, field: 0 });
      check(Math.abs(high.magnetization) < 1e-8, "zero-field high-temperature solution is paramagnetic");
      check(PRESETS[1].field === 0 && Math.abs(solveMeanField(PRESETS[1]).magnetization - high.magnetization) < 1e-12, "paramagnetic preset uses the zero-field fallback");
      var anti = analyze({ model: "antiferro", coupling: 1, temperature: 0.6, field: 0 });
      check(anti.solution.mA * anti.solution.mB < 0 && Math.abs(anti.solution.magnetization) < 1e-8, "antiferromagnetic solution is staggered with near-zero uniform moment");
      var selected = solveMeanField({ model: "ferro", coupling: 1, temperature: 0.65, field: 0.08 });
      check(selected.magnetization > 0, "positive field selects the positive ferro branch");
      var orderedSusceptibility = susceptibility({ model: "ferro", coupling: 1, temperature: 0.65, field: 0 });
      check(Number.isFinite(orderedSusceptibility) && orderedSusceptibility > 0 && orderedSusceptibility < 10, "ordered susceptibility stays on one broken-symmetry branch");
      check(susceptibility({ model: "ferro", coupling: 1, temperature: 1.55, field: 0 }) > 0, "paramagnetic susceptibility is positive");
      check(Number.isFinite(susceptibility({ model: "ferro", coupling: 1, temperature: 0.65, field: -0.6 })) && Number.isFinite(susceptibility({ model: "ferro", coupling: 1, temperature: 0.65, field: 0.6 })), "susceptibility handles both field endpoints with one-sided differences");
      var finiteFieldAnti = analyze({ model: "antiferro", coupling: 1, temperature: 0.6, field: 0.3 });
      var finiteFieldOrder = finiteFieldAnti.solution.staggered;
      var finiteFieldPoint = finiteFieldAnti.landscape.reduce(function (best, point) { return Math.abs(point.order - finiteFieldOrder) < Math.abs(best.order - finiteFieldOrder) ? point : best; }, finiteFieldAnti.landscape[0]);
      check(Math.abs(finiteFieldPoint.order - finiteFieldOrder) < 1e-12 && near(finiteFieldPoint.freeEnergy, finiteFieldAnti.solution.freeEnergy, 1e-7), "finite-field AF minimum is represented on the minimized-uniform-moment curve");
      check(phaseCurve(DEFAULTS, 17).length === 17 && landscape(DEFAULTS, 21).length === 21, "curves honor requested sample counts");
      var invalid = false;
      try { normalizeConfig({ model: "unknown" }); } catch (error) { invalid = true; }
      check(invalid, "unknown magnetic model is rejected");
      invalid = false;
      try { normalizeConfig({ temperature: 0 }); } catch (error2) { invalid = true; }
      check(invalid, "nonpositive temperature is rejected");
      return { checks: checks };
    }

    return { LAB_ID: LAB_ID, DEFAULTS: copyDefaults(), PRESETS: PRESETS, normalizeConfig: normalizeConfig, meanFieldFreeEnergy: meanFieldFreeEnergy, solveMeanField: solveMeanField, susceptibility: susceptibility, phaseCurve: phaseCurve, landscape: landscape, analyze: analyze, mount: mount, selfTest: selfTest };
  }
);
