(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-topological-band", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("physics-topological-band self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-topological-band self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "physics-topological-band";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "physics-topological-band-styles";
    var TWO_PI = 2 * Math.PI;
    var PI = Math.PI;
    var GAP_EPS = 1e-10;
    var NEAR_GAP = 0.1;
    var DEFAULTS = { mass: -1, ky: 0 };
    var PRESETS = [
      { id: "chern-minus", label: "C=-1 区间", mass: -1, ky: 0 },
      { id: "chern-plus", label: "C=+1 区间", mass: 1, ky: 0 },
      { id: "trivial", label: "平庸区间", mass: 2.6, ky: 0 },
      { id: "critical", label: "gap 闭合", mass: 0, ky: 0 }
    ];
    var COLORS = { blue: "#315f9d", orange: "#a36a16", green: "#39734d", red: "#b64335", gold: "#8b6517", gray: "#7b8794" };
    var STYLE_TEXT = [
      '[data-learning-lab="physics-topological-band"]{--ptb-blue:#315f9d;--ptb-orange:#a36a16;--ptb-green:#39734d;--ptb-red:#b64335;--ptb-gold:#8b6517;display:block;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-topological-band"] *{box-sizing:border-box}[data-learning-lab="physics-topological-band"] [hidden]{display:none!important}',
      '[data-learning-lab="physics-topological-band"] h3,[data-learning-lab="physics-topological-band"] h4{margin:0;letter-spacing:0}[data-learning-lab="physics-topological-band"] h3{font-size:1.18rem}[data-learning-lab="physics-topological-band"] h4{font-size:1rem;margin-top:14px}',
      '[data-learning-lab="physics-topological-band"] p{margin:8px 0}[data-learning-lab="physics-topological-band"] .ptb-muted,[data-learning-lab="physics-topological-band"] .ptb-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="physics-topological-band"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="physics-topological-band"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="physics-topological-band"] .ptb-prediction-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="physics-topological-band"] .ptb-prediction{display:grid;gap:5px;min-width:0}[data-learning-lab="physics-topological-band"] .ptb-prediction label{font-size:12.5px;font-weight:700}',
      '[data-learning-lab="physics-topological-band"] button,[data-learning-lab="physics-topological-band"] select,[data-learning-lab="physics-topological-band"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="physics-topological-band"] button,[data-learning-lab="physics-topological-band"] select{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-topological-band"] button:hover{border-color:var(--ptb-blue)}[data-learning-lab="physics-topological-band"] button:focus-visible,[data-learning-lab="physics-topological-band"] select:focus-visible,[data-learning-lab="physics-topological-band"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}',
      '[data-learning-lab="physics-topological-band"] .ptb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="physics-topological-band"] .ptb-actions>*{flex:1 1 170px}[data-learning-lab="physics-topological-band"] .ptb-primary{border-color:var(--ptb-blue);background:var(--ptb-blue);color:#fff;font-weight:750}[data-learning-lab="physics-topological-band"] .ptb-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="physics-topological-band"] .ptb-warn{color:var(--ptb-red)}',
      '[data-learning-lab="physics-topological-band"] .ptb-layout{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.32fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="physics-topological-band"] .ptb-controls,[data-learning-lab="physics-topological-band"] .ptb-stage{min-width:0}[data-learning-lab="physics-topological-band"] .ptb-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="physics-topological-band"] .ptb-control{display:grid;gap:5px;min-width:0}[data-learning-lab="physics-topological-band"] .ptb-control label{display:flex;flex-wrap:wrap;justify-content:space-between;gap:5px;color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="physics-topological-band"] output{color:var(--ptb-blue);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="physics-topological-band"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ptb-blue)}[data-learning-lab="physics-topological-band"] .ptb-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow-x:auto;overflow-y:hidden}[data-learning-lab="physics-topological-band"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="physics-topological-band"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="physics-topological-band"] .ptb-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="physics-topological-band"] .ptb-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="physics-topological-band"] .ptb-edge{fill:none;stroke:var(--ptb-red);stroke-width:2.6}[data-learning-lab="physics-topological-band"] .ptb-edge-alt{fill:none;stroke:var(--ptb-orange);stroke-width:2.6}[data-learning-lab="physics-topological-band"] .ptb-gap{fill:var(--ptb-blue);opacity:.08}[data-learning-lab="physics-topological-band"] .ptb-selected{stroke:var(--ptb-gold);stroke-width:1.5;stroke-dasharray:5 4}[data-learning-lab="physics-topological-band"] .ptb-current{fill:var(--ptb-gold);stroke:var(--bg,#fff);stroke-width:1.2}',
      '[data-learning-lab="physics-topological-band"] .ptb-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="physics-topological-band"] .ptb-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="physics-topological-band"] .ptb-metric:nth-child(4n+1){border-color:var(--ptb-blue)}[data-learning-lab="physics-topological-band"] .ptb-metric:nth-child(4n+2){border-color:var(--ptb-orange)}[data-learning-lab="physics-topological-band"] .ptb-metric:nth-child(4n+3){border-color:var(--ptb-green)}[data-learning-lab="physics-topological-band"] .ptb-metric:nth-child(4n){border-color:var(--ptb-red)}[data-learning-lab="physics-topological-band"] .ptb-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="physics-topological-band"] .ptb-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-topological-band"] .ptb-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="physics-topological-band"] table{width:100%;min-width:600px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="physics-topological-band"] th,[data-learning-lab="physics-topological-band"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="physics-topological-band"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="physics-topological-band"] .ptb-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:8px 0 0;color:var(--fg-soft,currentColor);font-size:12px}[data-learning-lab="physics-topological-band"] .ptb-key{display:inline-flex;align-items:center;gap:5px}[data-learning-lab="physics-topological-band"] .ptb-swatch{display:inline-block;width:18px;height:3px;background:var(--ptb-red)}[data-learning-lab="physics-topological-band"] .ptb-swatch[data-kind="edge-alt"]{background:var(--ptb-orange)}[data-learning-lab="physics-topological-band"] .ptb-swatch[data-kind="curvature"]{width:10px;height:10px;border-radius:2px;background:var(--ptb-blue)}[data-learning-lab="physics-topological-band"] .ptb-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--ptb-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="physics-topological-band"] .ptb-preset-row{display:flex;flex-wrap:wrap;gap:7px}[data-learning-lab="physics-topological-band"] .ptb-preset-row button{flex:1 1 105px;font-size:12.5px}[data-learning-lab="physics-topological-band"] .ptb-preset-row button[aria-pressed="true"]{border-color:var(--ptb-blue);background:var(--ptb-blue);color:#fff;font-weight:750}',
      '@media(max-width:900px){[data-learning-lab="physics-topological-band"] .ptb-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:680px){[data-learning-lab="physics-topological-band"] .ptb-prediction-grid{grid-template-columns:1fr}[data-learning-lab="physics-topological-band"] .ptb-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="physics-topological-band"] .ptb-stage-frame svg{min-width:640px}}@media(max-width:430px){[data-learning-lab="physics-topological-band"] .ptb-metrics{grid-template-columns:1fr}[data-learning-lab="physics-topological-band"] .ptb-stage-frame{padding:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="physics-topological-band"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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

    function formatInvariant(value, digits) { return Number.isFinite(value) ? formatNumber(value, digits) : "undefined"; }

    function normalizeConfig(input) {
      var source = input || {};
      var mass = finite(source.mass === undefined ? DEFAULTS.mass : source.mass, "mass");
      var ky = finite(source.ky === undefined ? DEFAULTS.ky : source.ky, "ky");
      if (mass < -3.2 || mass > 3.2 || ky < -PI || ky > PI) throw new RangeError("mass or ky is outside the teaching range");
      return { mass: mass, ky: ky };
    }

    function dVector(kx, ky, mass) {
      return { x: Math.sin(kx), y: Math.sin(ky), z: mass + Math.cos(kx) + Math.cos(ky) };
    }

    function dNorm(vector) { return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z); }

    function massGapDistance(mass) {
      return Math.min(Math.abs(mass + 2), Math.abs(mass), Math.abs(mass - 2));
    }

    function qwzPhaseLabel(mass) {
      if (massGapDistance(mass) <= GAP_EPS) return NaN;
      if (mass < -2 || mass > 2) return 0;
      return mass < 0 ? -1 : 1;
    }

    function nearCriticalGap(gap) { return gap <= NEAR_GAP + 1e-12; }

    function berryCurvature(kx, ky, mass) {
      var vector = dVector(kx, ky, mass);
      var crossX = Math.sin(kx) * Math.cos(ky);
      var crossY = Math.cos(kx) * Math.sin(ky);
      var crossZ = Math.cos(kx) * Math.cos(ky);
      var triple = vector.x * crossX + vector.y * crossY + vector.z * crossZ;
      var norm = dNorm(vector);
      if (norm < 1e-12) return NaN;
      return -0.5 * triple / Math.pow(norm, 3);
    }

    function integrateCurvature(mass, count) {
      var step = TWO_PI / count;
      var sum = 0;
      for (var ix = 0; ix < count; ix += 1) {
        var kx = -PI + (ix + 0.5) * step;
        for (var iy = 0; iy < count; iy += 1) {
          var ky = -PI + (iy + 0.5) * step;
          var curvature = berryCurvature(kx, ky, mass);
          if (!Number.isFinite(curvature)) return NaN;
          sum += curvature * step * step;
        }
      }
      return sum / TWO_PI;
    }

    function chernNumber(mass, grid) {
      var value = finite(mass, "mass");
      var count = Math.round(grid === undefined ? 61 : finite(grid, "Chern grid"));
      if (count < 9) throw new RangeError("Chern grid must be at least 9");
      var gap = bulkGap(value, count);
      var label = qwzPhaseLabel(value);
      if (!Number.isFinite(label)) return NaN;
      // The analytic QWZ label stabilizes the narrow gap region where a coarse
      // midpoint grid otherwise makes the Dirac curvature look non-quantized.
      if (nearCriticalGap(gap)) return label;
      var previous = integrateCurvature(value, count);
      var currentCount = count;
      for (var refinement = 0; refinement < 5; refinement += 1) {
        currentCount *= 2;
        var refined = integrateCurvature(value, currentCount);
        if (Math.abs(refined - previous) < 1e-7) return refined;
        previous = refined;
      }
      return Math.abs(previous - label) < 0.08 ? previous : label;
    }

    function complexOverlap(left, right) {
      return { re: left[0].re * right[0].re + left[0].im * right[0].im + left[1].re * right[1].re + left[1].im * right[1].im, im: left[0].re * right[0].im - left[0].im * right[0].re + left[1].re * right[1].im - left[1].im * right[1].re };
    }

    function lowerEigenvector(kx, ky, mass) {
      var vector = dVector(kx, ky, mass);
      var norm = dNorm(vector);
      if (!Number.isFinite(norm) || norm <= GAP_EPS) return null;
      var qRe = vector.x;
      var qIm = -vector.y;
      var first = { re: -qRe, im: -qIm };
      var second = { re: vector.z + norm, im: 0 };
      var length = Math.sqrt(first.re * first.re + first.im * first.im + second.re * second.re);
      if (length < 1e-12) return [{ re: 1, im: 0 }, { re: 0, im: 0 }];
      return [{ re: first.re / length, im: first.im / length }, { re: second.re / length, im: 0 }];
    }

    function berryPhase(mass, ky, points) {
      var value = finite(mass, "mass");
      var slice = finite(ky, "ky");
      var count = Math.round(points === undefined ? 161 : finite(points, "Berry loop points"));
      if (count < 12) throw new RangeError("Berry loop needs at least 12 points");
      if (massGapDistance(value) <= GAP_EPS || wilsonLoopDegenerate(value, slice)) return NaN;
      var product = { re: 1, im: 0 };
      var previous = lowerEigenvector(-PI, slice, value);
      if (!previous) return NaN;
      for (var index = 1; index <= count; index += 1) {
        var kx = -PI + TWO_PI * index / count;
        var current = lowerEigenvector(kx, slice, value);
        if (!current) return NaN;
        var overlap = complexOverlap(previous, current);
        var magnitude = Math.sqrt(overlap.re * overlap.re + overlap.im * overlap.im);
        if (magnitude < 1e-12) return NaN;
        product = { re: product.re * overlap.re / magnitude - product.im * overlap.im / magnitude, im: product.re * overlap.im / magnitude + product.im * overlap.re / magnitude };
        previous = current;
      }
      var phase = -Math.atan2(product.im, product.re);
      if (phase <= -PI) phase += TWO_PI;
      if (phase > PI) phase -= TWO_PI;
      return phase;
    }

    function bulkGap(mass, grid) {
      var value = finite(mass, "mass");
      var count = Math.round(grid === undefined ? 81 : finite(grid, "gap grid"));
      if (count < 3) throw new RangeError("gap grid must be at least 3");
      var minimum = massGapDistance(value);
      // The half-open uniform grid can miss the exact Dirac points at phase boundaries.
      [[0, 0], [PI, 0], [0, PI], [PI, PI]].forEach(function (point) {
        minimum = Math.min(minimum, dNorm(dVector(point[0], point[1], value)));
      });
      for (var ix = 0; ix < count; ix += 1) {
        var kx = -PI + TWO_PI * ix / count;
        for (var iy = 0; iy < count; iy += 1) minimum = Math.min(minimum, dNorm(dVector(kx, -PI + TWO_PI * iy / count, value)));
      }
      return 2 * minimum;
    }

    function wilsonLoopDegenerate(mass, ky) {
      if (Math.abs(Math.sin(ky)) > GAP_EPS) return false;
      return [0, PI, -PI].some(function (kx) { return dNorm(dVector(kx, ky, mass)) <= GAP_EPS; });
    }

    function edgeSlice(mass, ky) {
      var effectiveMass = mass + Math.cos(ky);
      var exists = Math.abs(effectiveMass) < 1;
      var decay = Math.abs(effectiveMass);
      var localizationLength = exists && decay > 1e-12 ? 1 / (-Math.log(decay)) : exists ? 0 : Infinity;
      return { effectiveMass: effectiveMass, exists: exists, negativeEnergy: -Math.sin(ky), positiveEnergy: Math.sin(ky), decay: decay, localizationLength: localizationLength };
    }

    function edgeSpectrum(mass, count) {
      var samples = Math.round(count === undefined ? 101 : finite(count, "edge samples"));
      if (samples < 2) throw new RangeError("edge samples must be at least 2");
      var points = [];
      for (var index = 0; index < samples; index += 1) {
        var ky = -PI + TWO_PI * index / (samples - 1);
        var edge = edgeSlice(mass, ky);
        points.push({ ky: ky, exists: edge.exists, negativeEnergy: edge.negativeEnergy, positiveEnergy: edge.positiveEnergy, bulkHalfGap: Math.sqrt(Math.sin(ky) * Math.sin(ky) + Math.pow(Math.abs(edge.effectiveMass) - 1, 2) ) });
      }
      return points;
    }

    function curvatureMap(mass, rows, columns) {
      var rowCount = Math.round(rows === undefined ? 17 : finite(rows, "curvature rows"));
      var columnCount = Math.round(columns === undefined ? 17 : finite(columns, "curvature columns"));
      var values = [];
      var min = Infinity;
      var max = -Infinity;
      for (var iy = 0; iy < rowCount; iy += 1) {
        for (var ix = 0; ix < columnCount; ix += 1) {
          var kx = -PI + (ix + 0.5) * TWO_PI / columnCount;
          var ky = -PI + (iy + 0.5) * TWO_PI / rowCount;
          var value = berryCurvature(kx, ky, mass);
          values.push({ kx: kx, ky: ky, value: value });
          if (Number.isFinite(value)) {
            min = Math.min(min, value);
            max = Math.max(max, value);
          }
        }
      }
      if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 0; }
      return { rows: rowCount, columns: columnCount, values: values, min: min, max: max };
    }

    function analyze(input) {
      var config = normalizeConfig(input);
      var edge = edgeSlice(config.mass, config.ky);
      var gap = bulkGap(config.mass);
      var closed = gap <= GAP_EPS;
      var chern = closed ? NaN : chernNumber(config.mass);
      var phase = closed ? NaN : berryPhase(config.mass, config.ky);
      return { config: config, curvature: curvatureMap(config.mass), chern: chern, hallConductivity: chern, gap: gap, gapStatus: closed ? "closed" : nearCriticalGap(gap) ? "near" : "open", invariantsDefined: Number.isFinite(chern) && Number.isFinite(phase), berryPhase: phase, edge: edge, edgeSpectrum: edgeSpectrum(config.mass) };
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

    function colorFor(value, minimum, maximum) {
      if (!Number.isFinite(value)) return "transparent";
      var maxAbs = Math.max(Math.abs(minimum), Math.abs(maximum), 1e-9);
      var ratio = Math.max(-1, Math.min(1, value / maxAbs));
      var opacity = 0.16 + 0.72 * Math.abs(ratio);
      if (ratio >= 0) return "rgba(181,67,53," + opacity.toFixed(3) + ")";
      return "rgba(49,95,157," + opacity.toFixed(3) + ")";
    }

    function pathFrom(points) { return points.map(function (point, index) { return (index && !point.breakBefore ? "L" : "M") + point.x.toFixed(2) + " " + point.y.toFixed(2); }).join(" "); }

    function drawSvg(doc, result) {
      var svg = makeSvg(doc, "svg", { viewBox: "0 0 820 520", role: "img", "aria-label": "布里渊区 Berry 曲率图、开边界 edge spectrum 和当前 Wilson loop 点" });
      var mapLeft = 52;
      var mapTop = 52;
      var mapRight = 390;
      var mapBottom = 255;
      var cellWidth = (mapRight - mapLeft) / result.curvature.columns;
      var cellHeight = (mapBottom - mapTop) / result.curvature.rows;
      svg.appendChild(svgText(doc, mapLeft, 25, "Berry 曲率 Ω_-(k_x,k_y)", "start", 13));
      result.curvature.values.forEach(function (cell) {
        var ix = result.curvature.values.indexOf(cell) % result.curvature.columns;
        var iy = Math.floor(result.curvature.values.indexOf(cell) / result.curvature.columns);
        svg.appendChild(makeSvg(doc, "rect", { x: mapLeft + ix * cellWidth, y: mapTop + iy * cellHeight, width: cellWidth + .4, height: cellHeight + .4, fill: colorFor(cell.value, result.curvature.min, result.curvature.max) }));
      });
      svg.appendChild(makeSvg(doc, "rect", { x: mapLeft, y: mapTop, width: mapRight - mapLeft, height: mapBottom - mapTop, fill: "none", stroke: "currentColor", "stroke-width": 1 }));
      svg.appendChild(makeSvg(doc, "line", { x1: mapLeft, y1: mapBottom, x2: mapRight, y2: mapBottom, class: "ptb-axis" }));
      svg.appendChild(makeSvg(doc, "line", { x1: mapLeft, y1: mapTop, x2: mapLeft, y2: mapBottom, class: "ptb-axis" }));
      svg.appendChild(svgText(doc, (mapLeft + mapRight) / 2, mapBottom + 23, "k_x：-π → π", "middle", 11));
      svg.appendChild(svgText(doc, mapLeft - 32, (mapTop + mapBottom) / 2, "k_y", "middle", 11));
      var selectedY = mapTop + (result.config.ky + PI) / TWO_PI * (mapBottom - mapTop);
      svg.appendChild(makeSvg(doc, "line", { x1: mapLeft, y1: selectedY, x2: mapRight, y2: selectedY, class: "ptb-selected" }));

      var edgeLeft = 455;
      var edgeTop = 52;
      var edgeRight = 790;
      var edgeBottom = 255;
      var mapKy = function (ky) { return edgeLeft + (ky + PI) / TWO_PI * (edgeRight - edgeLeft); };
      var mapEnergy = function (energy) { return (edgeTop + edgeBottom) / 2 - energy / 2.2 * ((edgeBottom - edgeTop) / 2); };
      svg.appendChild(svgText(doc, edgeLeft, 25, "x-open strip：edge spectrum", "start", 13));
      svg.appendChild(makeSvg(doc, "line", { x1: edgeLeft, y1: (edgeTop + edgeBottom) / 2, x2: edgeRight, y2: (edgeTop + edgeBottom) / 2, class: "ptb-axis" }));
      svg.appendChild(makeSvg(doc, "line", { x1: edgeLeft, y1: edgeTop, x2: edgeLeft, y2: edgeBottom, class: "ptb-axis" }));
      var positive = [];
      var negative = [];
      var lowerGap = [];
      var upperGap = [];
      var previousExists = false;
      result.edgeSpectrum.forEach(function (point) {
        var x = mapKy(point.ky);
        lowerGap.push({ x: x, y: mapEnergy(-point.bulkHalfGap) });
        upperGap.push({ x: x, y: mapEnergy(point.bulkHalfGap) });
        if (point.exists) {
          positive.push({ x: x, y: mapEnergy(point.positiveEnergy), breakBefore: !previousExists });
          negative.push({ x: x, y: mapEnergy(point.negativeEnergy), breakBefore: !previousExists });
        }
        previousExists = point.exists;
      });
      var gapPath = lowerGap.concat(upperGap.slice().reverse());
      svg.appendChild(makeSvg(doc, "path", { d: pathFrom(gapPath) + " Z", class: "ptb-gap" }));
      svg.appendChild(makeSvg(doc, "path", { d: pathFrom(lowerGap), class: "ptb-gap", fill: "none", stroke: COLORS.gray, "stroke-width": 1.2 }));
      svg.appendChild(makeSvg(doc, "path", { d: pathFrom(upperGap), class: "ptb-gap", fill: "none", stroke: COLORS.gray, "stroke-width": 1.2 }));
      if (positive.length) svg.appendChild(makeSvg(doc, "path", { d: pathFrom(positive), class: "ptb-edge" }));
      if (negative.length) svg.appendChild(makeSvg(doc, "path", { d: pathFrom(negative), class: "ptb-edge-alt" }));
      var currentEdge = result.edge;
      var currentX = mapKy(result.config.ky);
      if (currentEdge.exists) {
        svg.appendChild(makeSvg(doc, "circle", { cx: currentX, cy: mapEnergy(currentEdge.positiveEnergy), r: 5, class: "ptb-current" }));
        svg.appendChild(makeSvg(doc, "circle", { cx: currentX, cy: mapEnergy(currentEdge.negativeEnergy), r: 5, class: "ptb-current" }));
      }
      svg.appendChild(svgText(doc, (edgeLeft + edgeRight) / 2, edgeBottom + 23, "k_y：-π → π", "middle", 11));
      svg.appendChild(svgText(doc, edgeLeft - 27, (edgeTop + edgeBottom) / 2, "E", "middle", 11));
      svg.appendChild(svgText(doc, edgeRight, edgeTop + 13, "E=±sin k_y（满足 |m+cos k_y|<1）", "end", 10));

      svg.appendChild(svgText(doc, 52, 300, "当前切片：k_y=" + formatNumber(result.config.ky, 2) + "；有效质量 m+cos k_y=" + formatNumber(result.edge.effectiveMass, 3), "start", 13));
      svg.appendChild(svgText(doc, 52, 330, "下带 C=" + formatInvariant(result.chern, 3) + "；bulk gap=" + formatNumber(result.gap, 3) + "；Berry phase γ=" + formatInvariant(result.berryPhase, 3) + " rad", "start", 13));
      svg.appendChild(svgText(doc, 52, 365, result.edge.exists ? "当前 k_y 切片有边界解：它位于 bulk gap 内，能量为 ±sin k_y。" : "当前 k_y 切片没有理想边界解；改变 k_y 仍要回到整个 BZ 的 Chern 账本。", "start", 12));
      svg.appendChild(svgText(doc, 52, 405, "红 / 蓝色方格：Ω 的正 / 负；edge branch 是边界结果，不是 C 的定义。", "start", 12));
      return svg;
    }

    function metric(doc, label, value) { return makeElement(doc, "div", { className: "ptb-metric" }, [makeElement(doc, "span", { text: label }), makeElement(doc, "strong", { text: value })]); }

    function predictionField(doc, key, label, options) {
      var select = makeElement(doc, "select", { "data-ptb-prediction": key, "aria-label": label });
      select.appendChild(makeElement(doc, "option", { value: "", text: "请选择" }));
      options.forEach(function (option) { select.appendChild(makeElement(doc, "option", { value: option.value, text: option.label })); });
      return makeElement(doc, "div", { className: "ptb-prediction" }, [makeElement(doc, "label", {}, [label]), select]);
    }

    function selectedValue(form, key) {
      var select = form.querySelector('[data-ptb-prediction="' + key + '"]');
      return select && select.value ? select.value : "";
    }

    function mount(rootNode, api) {
      var doc = rootNode.ownerDocument || (host && host.document);
      if (!doc) throw new Error("a document is required to mount the lab");
      injectStyles(doc);
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, preset: "default", feedback: "" };
      var shell = makeElement(doc, "div", { className: "ptb-shell" });
      shell.appendChild(makeElement(doc, "h3", { text: "Topology lab：Berry phase、Chern invariant 与 edge branch" }));
      shell.appendChild(makeElement(doc, "p", { className: "ptb-muted", text: "固定模型 H=d·σ；热图积分给下带 C，Wilson loop 给选定 k_y 的 Berry phase，开边界曲线只作为 bulk-boundary 对账。" }));
      var predictionForm = makeElement(doc, "form", { className: "ptb-predictions" });
      predictionForm.appendChild(makeElement(doc, "fieldset", {}, [
        makeElement(doc, "legend", { text: "先预测，再揭示" }),
        makeElement(doc, "div", { className: "ptb-prediction-grid" }, [
          predictionField(doc, "transition", "连续改变 m 穿过 0 时，C 是否改变？", [{ value: "change", label: "会，但先 gap 闭合" }, { value: "no", label: "不会改变" }, { value: "always", label: "任意点跳变" }]),
          predictionField(doc, "phase", "m=-1、k_y=0 的 Berry phase 更接近", [{ value: "pi", label: "π" }, { value: "zero", label: "0" }, { value: "undefined", label: "永远不定义" }]),
          predictionField(doc, "edge", "edge branch 能否单独定义 C？", [{ value: "no", label: "不能，需 bulk 积分" }, { value: "yes", label: "能，看到就等于 C" }, { value: "random", label: "完全随机" }])
        ])
      ]));
      var predictionActions = makeElement(doc, "div", { className: "ptb-actions" });
      var revealButton = makeElement(doc, "button", { type: "submit", className: "ptb-primary", text: "提交预测并揭示" });
      var resetButton = makeElement(doc, "button", { type: "button", text: "重置" });
      predictionActions.appendChild(revealButton);
      predictionActions.appendChild(resetButton);
      predictionForm.appendChild(predictionActions);
      var feedback = makeElement(doc, "p", { className: "ptb-feedback", "aria-live": "polite" });
      predictionForm.appendChild(feedback);
      shell.appendChild(predictionForm);

      var bench = makeElement(doc, "div", { hidden: true });
      var layout = makeElement(doc, "div", { className: "ptb-layout" });
      var controls = makeElement(doc, "div", { className: "ptb-controls" });
      controls.appendChild(makeElement(doc, "h4", { text: "参数" }));
      var inputs = {};
      function addRange(key, label, min, max, step, digits) {
        var output = makeElement(doc, "output", { text: formatNumber(state.config[key], digits) });
        var input = makeElement(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
        input.addEventListener("input", function () { state.config[key] = finite(input.value, key); state.preset = "custom"; state.feedback = "参数已更新；重新读 Berry 与 edge 两本账。"; render(); });
        inputs[key] = { input: input, output: output, digits: digits };
        controls.appendChild(makeElement(doc, "div", { className: "ptb-control" }, [makeElement(doc, "label", {}, [label, output]), input]));
      }
      addRange("mass", "质量参数 m", "-3.20", "3.20", "0.05", 2);
      addRange("ky", "选定 k_y", -PI, PI, PI / 32, 2);
      controls.appendChild(makeElement(doc, "h4", { text: "预设" }));
      var presetRow = makeElement(doc, "div", { className: "ptb-preset-row" });
      PRESETS.forEach(function (preset) {
        var button = makeElement(doc, "button", { type: "button", text: preset.label, "data-ptb-preset": preset.id, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.config = normalizeConfig(preset); state.preset = preset.id; state.feedback = "已切换预设；请比较 gap、C、Berry phase 和 edge branch。"; render(); announce(preset.label + "预设已应用。"); });
        presetRow.appendChild(button);
      });
      controls.appendChild(presetRow);
      var stage = makeElement(doc, "div", { className: "ptb-stage" });
      var frame = makeElement(doc, "div", { className: "ptb-stage-frame" });
      var chartHost = makeElement(doc, "div");
      frame.appendChild(chartHost);
      frame.appendChild(makeElement(doc, "div", { className: "ptb-legend" }, [
        makeElement(doc, "span", { className: "ptb-key" }, [makeElement(doc, "i", { className: "ptb-swatch", "data-kind": "curvature" }), "Berry 曲率符号"]),
        makeElement(doc, "span", { className: "ptb-key" }, [makeElement(doc, "i", { className: "ptb-swatch" }), "正边界能量"]),
        makeElement(doc, "span", { className: "ptb-key" }, [makeElement(doc, "i", { className: "ptb-swatch", "data-kind": "edge-alt" }), "负边界能量"])
      ]));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      bench.appendChild(layout);
      var metrics = makeElement(doc, "div", { className: "ptb-metrics" });
      bench.appendChild(metrics);
      var ledger = makeElement(doc, "div", { className: "ptb-ledger" });
      bench.appendChild(ledger);
      var note = makeElement(doc, "p", { className: "ptb-note" });
      bench.appendChild(note);
      shell.appendChild(bench);
      rootNode.replaceChildren(shell);

      function announce(message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }

      function renderLedger(result) {
        var table = makeElement(doc, "table", {});
        table.appendChild(makeElement(doc, "thead", {}, [makeElement(doc, "tr", {}, [makeElement(doc, "th", { text: "账本" }), makeElement(doc, "th", { text: "当前数值" }), makeElement(doc, "th", { text: "边界" })])]));
        var rows = [
          ["Berry phase", "γ(k_y)=" + formatInvariant(result.berryPhase, 3) + " rad", Number.isFinite(result.berryPhase) ? "只对这条闭合回路给出模 2π 的相位；换 ky 会变。" : "Wilson loop 遇到能带简并，Berry phase undefined。"],
          ["Chern invariant", "C_-=" + formatInvariant(result.chern, 3), Number.isFinite(result.chern) ? "下带在整个 BZ 保持隔离；当前符号采用 A=i⟨u|∇u⟩。" : "bulk gap 闭合，绝缘体 Chern invariant undefined。"],
          ["Hall response", "σ_xy/(e²/h)=" + formatInvariant(result.hallConductivity, 3), "在本下带与坐标约定下取 σ_xy=C_- e²/h，和 Chern 符号一致。"],
          ["edge condition", "|m+cos k_y|=" + formatNumber(Math.abs(result.edge.effectiveMass), 3), result.edge.exists ? "当前切片有理想边界支。" : "当前切片无理想边界支；别把单点当 C。"],
          ["bulk gap", "Δ=" + formatNumber(result.gap, 3), result.gapStatus === "open" ? "当前参数远离数值 gap 闭合。" : result.gapStatus === "near" ? "Δ≤0.1，属于近临界区；相位标签仍需说明数值口径。" : "gap 闭合，所有绝缘体不变量按 undefined 显示。"]
        ];
        var body = makeElement(doc, "tbody", {});
        rows.forEach(function (row) { body.appendChild(makeElement(doc, "tr", {}, [makeElement(doc, "td", { text: row[0] }), makeElement(doc, "td", { text: row[1] }), makeElement(doc, "td", { text: row[2] })])); });
        table.appendChild(body);
        return table;
      }

      function render() {
        Object.keys(inputs).forEach(function (key) { inputs[key].input.value = String(state.config[key]); inputs[key].output.textContent = formatNumber(state.config[key], inputs[key].digits); });
        presetRow.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", button.getAttribute("data-ptb-preset") === state.preset ? "true" : "false"); });
        feedback.textContent = state.feedback;
        feedback.className = "ptb-feedback" + (state.feedback.indexOf("请先") === 0 ? " ptb-warn" : "");
        bench.hidden = !state.revealed;
        if (!state.revealed) return;
        var result = analyze(state.config);
        chartHost.replaceChildren(drawSvg(doc, result));
        metrics.replaceChildren(metric(doc, "下带 C", formatInvariant(result.chern, 3)), metric(doc, "bulk gap", formatNumber(result.gap, 3) + "（" + result.gapStatus + "）"), metric(doc, "Berry γ", formatInvariant(result.berryPhase, 3) + " rad"), metric(doc, "edge", result.edge.exists ? "存在" : "无"));
        ledger.replaceChildren(renderLedger(result));
        note.textContent = "边界提示：模型是干净、两带、平移不变的 QWZ 代理；本实验固定 A=i⟨u|∇u⟩，因此 Wilson、曲率、Chern 与 Hall 符号同一口径。gap 闭合时所有绝缘体不变量都显示 undefined。";
      }

      predictionForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var keys = ["transition", "phase", "edge"];
        if (!keys.every(function (key) { return selectedValue(predictionForm, key); })) { state.feedback = "请先完成三项预测；揭示前不显示热图、曲线和 invariant 账本。"; render(); return; }
        var expected = { transition: "change", phase: "pi", edge: "no" };
        var correct = keys.filter(function (key) { return selectedValue(predictionForm, key) === expected[key]; }).length;
        state.predictions = { transition: selectedValue(predictionForm, "transition"), phase: selectedValue(predictionForm, "phase"), edge: selectedValue(predictionForm, "edge") };
        state.revealed = true;
        state.feedback = "已揭示：" + correct + "/3 命中。先看 gap，再谈 C；再用 edge branch 做 bulk-boundary 对账。";
        render();
        announce(state.feedback);
      });
      resetButton.addEventListener("click", function () { predictionForm.reset(); state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, preset: "default", feedback: "" }; render(); announce("拓扑实验已重置；预测重新隐藏。"); });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var minus = analyze(DEFAULTS);
      check(minus.chern < -0.85 && minus.chern > -1.15, "m=-1 has lower-band Chern number -1");
      check(near(minus.hallConductivity, minus.chern, 1e-12) && Number.isFinite(minus.berryPhase), "Hall and Wilson signs use the same A=i<u|grad u> convention");
      check(minus.gap > 1.8, "m=-1 is gapped");
      check(Math.abs(Math.abs(minus.berryPhase) - PI) < 0.08, "m=-1 ky=0 Berry phase is pi modulo 2pi");
      check(minus.edge.exists && near(minus.edge.positiveEnergy, 0, 1e-12), "ky=0 slice has a zero-energy edge crossing");
      var plus = analyze({ mass: 1, ky: 0 });
      check(plus.chern > 0.85 && plus.chern < 1.15, "m=1 has lower-band Chern number +1");
      var trivial = analyze({ mass: 2.6, ky: 0 });
      check(Math.abs(trivial.chern) < 0.15 && !trivial.edge.exists, "m=2.6 is trivial with no ky=0 edge slice");
      var critical = bulkGap(0, 41);
      check(critical < 1e-8, "m=0 closes the bulk gap");
      var nearCritical = analyze({ mass: 1.95, ky: 0 });
      check(nearCritical.gapStatus === "near" && nearCritical.gap <= NEAR_GAP + 1e-10 && nearCritical.chern === 1, "gap 0.1 is classified near and receives the analytic QWZ phase label");
      var criticalAnalysis = analyze({ mass: 0, ky: 0 });
      check(criticalAnalysis.gapStatus === "closed" && !Number.isFinite(criticalAnalysis.chern) && !Number.isFinite(criticalAnalysis.hallConductivity) && !Number.isFinite(criticalAnalysis.berryPhase), "bulk gap closure makes Chern, Hall, and Wilson invariants undefined");
      check(lowerEigenvector(PI, 0, 0) === null && !Number.isFinite(berryPhase(-2, 0)), "degenerate eigenvectors and Wilson loops never use an arbitrary state");
      check(normalizeConfig({ mass: -1, ky: -PI }).ky === -PI && normalizeConfig({ mass: -1, ky: PI }).ky === PI, "ky accepts exact BZ endpoints");
      check(Math.abs(edgeSlice(-1, 0).effectiveMass) < 1e-12 && edgeSlice(-1, 0).exists && !edgeSlice(-1, PI).exists, "edge condition is checked slice by slice");
      check(edgeSpectrum(-1, 31).length === 31 && curvatureMap(-1, 9, 9).values.length === 81, "visual samples honor requested sizes");
      var invalid = false;
      try { normalizeConfig({ mass: 5 }); } catch (error) { invalid = true; }
      check(invalid, "out-of-range mass is rejected");
      invalid = false;
      try { berryPhase(-1, 0, 4); } catch (error2) { invalid = true; }
      check(invalid, "too-short Berry loop is rejected");
      return { checks: checks };
    }

    return { LAB_ID: LAB_ID, DEFAULTS: DEFAULTS, PRESETS: PRESETS, normalizeConfig: normalizeConfig, dVector: dVector, berryCurvature: berryCurvature, chernNumber: chernNumber, lowerEigenvector: lowerEigenvector, berryPhase: berryPhase, bulkGap: bulkGap, massGapDistance: massGapDistance, qwzPhaseLabel: qwzPhaseLabel, wilsonLoopDegenerate: wilsonLoopDegenerate, edgeSlice: edgeSlice, edgeSpectrum: edgeSpectrum, curvatureMap: curvatureMap, analyze: analyze, mount: mount, selfTest: selfTest };
  }
);
