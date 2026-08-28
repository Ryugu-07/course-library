(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-spectroscopy-imaging", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("physics-spectroscopy-imaging self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-spectroscopy-imaging self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "physics-spectroscopy-imaging";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "physics-spectroscopy-imaging-styles";
    var DOMAIN = 6;
    var SAMPLE_COUNT = 96;
    var TRANSFER_COUNT = 49;
    var TRANSFER_Q_MAX = 16;
    var LINE_SIGMA = 0.045;
    var TWO_PI = 2 * Math.PI;
    var DEFAULTS = {
      separation: 0.72,
      psfSigma: 0.18,
      noise: 0.025,
      regularization: 0.02
    };
    var PRESETS = [
      { id: "resolved", label: "易分辨", separation: 0.95, psfSigma: 0.12, noise: 0.01, regularization: 0.01 },
      { id: "threshold", label: "临界分辨", separation: 0.55, psfSigma: 0.22, noise: 0.025, regularization: 0.045 },
      { id: "inverse", label: "逆问题压力", separation: 0.55, psfSigma: 0.30, noise: 0.08, regularization: 0.12 }
    ];
    var COLORS = {
      blue: "#315f9d",
      orange: "#a36a16",
      green: "#39734d",
      red: "#b64335",
      gold: "#8b6517"
    };

    var STYLE_TEXT = [
      '[data-learning-lab="physics-spectroscopy-imaging"]{--psi-blue:#315f9d;--psi-orange:#a36a16;--psi-green:#39734d;--psi-red:#b64335;--psi-gold:#8b6517;display:block;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-spectroscopy-imaging"] *{box-sizing:border-box}[data-learning-lab="physics-spectroscopy-imaging"] [hidden]{display:none!important}',
      '[data-learning-lab="physics-spectroscopy-imaging"] h3,[data-learning-lab="physics-spectroscopy-imaging"] h4{margin:0;letter-spacing:0}[data-learning-lab="physics-spectroscopy-imaging"] h3{font-size:1.18rem}[data-learning-lab="physics-spectroscopy-imaging"] h4{font-size:1rem;margin-top:14px}',
      '[data-learning-lab="physics-spectroscopy-imaging"] p{margin:8px 0}[data-learning-lab="physics-spectroscopy-imaging"] .psi-muted,[data-learning-lab="physics-spectroscopy-imaging"] .psi-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="physics-spectroscopy-imaging"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="physics-spectroscopy-imaging"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="physics-spectroscopy-imaging"] .psi-prediction-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="physics-spectroscopy-imaging"] .psi-prediction{display:grid;gap:5px;min-width:0}[data-learning-lab="physics-spectroscopy-imaging"] .psi-prediction label{font-size:12.5px;font-weight:700}',
      '[data-learning-lab="physics-spectroscopy-imaging"] button,[data-learning-lab="physics-spectroscopy-imaging"] select,[data-learning-lab="physics-spectroscopy-imaging"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="physics-spectroscopy-imaging"] button,[data-learning-lab="physics-spectroscopy-imaging"] select{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-spectroscopy-imaging"] button:hover{border-color:var(--psi-blue)}[data-learning-lab="physics-spectroscopy-imaging"] button:focus-visible,[data-learning-lab="physics-spectroscopy-imaging"] select:focus-visible,[data-learning-lab="physics-spectroscopy-imaging"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}',
      '[data-learning-lab="physics-spectroscopy-imaging"] .psi-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="physics-spectroscopy-imaging"] .psi-actions>*{flex:1 1 170px}[data-learning-lab="physics-spectroscopy-imaging"] .psi-primary{border-color:var(--psi-blue);background:var(--psi-blue);color:#fff;font-weight:750}[data-learning-lab="physics-spectroscopy-imaging"] .psi-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="physics-spectroscopy-imaging"] .psi-good{color:var(--psi-green)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-warn{color:var(--psi-red)}',
      '[data-learning-lab="physics-spectroscopy-imaging"] .psi-preset-row{display:flex;flex-wrap:wrap;gap:7px}[data-learning-lab="physics-spectroscopy-imaging"] .psi-preset-row button{flex:1 1 100px;font-size:12.5px}[data-learning-lab="physics-spectroscopy-imaging"] .psi-preset-row button[aria-pressed="true"]{border-color:var(--psi-blue);background:var(--psi-blue);color:#fff;font-weight:750}',
      '[data-learning-lab="physics-spectroscopy-imaging"] .psi-layout{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.32fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="physics-spectroscopy-imaging"] .psi-controls,[data-learning-lab="physics-spectroscopy-imaging"] .psi-stage{min-width:0}[data-learning-lab="physics-spectroscopy-imaging"] .psi-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-control{display:grid;gap:5px;min-width:0}[data-learning-lab="physics-spectroscopy-imaging"] .psi-control label{display:flex;flex-wrap:wrap;justify-content:space-between;gap:5px;color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="physics-spectroscopy-imaging"] output{color:var(--psi-blue);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="physics-spectroscopy-imaging"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--psi-blue)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow-x:auto;overflow-y:hidden}[data-learning-lab="physics-spectroscopy-imaging"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="physics-spectroscopy-imaging"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="physics-spectroscopy-imaging"] .psi-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="physics-spectroscopy-imaging"] .psi-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="physics-spectroscopy-imaging"] .psi-true{fill:none;stroke:var(--psi-blue);stroke-width:2.7}[data-learning-lab="physics-spectroscopy-imaging"] .psi-measured{fill:none;stroke:var(--psi-orange);stroke-width:2.1;stroke-dasharray:6 4}[data-learning-lab="physics-spectroscopy-imaging"] .psi-reconstruction{fill:none;stroke:var(--psi-green);stroke-width:2.4}[data-learning-lab="physics-spectroscopy-imaging"] .psi-psf{fill:none;stroke:var(--psi-gold);stroke-width:2.4}[data-learning-lab="physics-spectroscopy-imaging"] .psi-transfer{fill:none;stroke:var(--psi-red);stroke-width:2.4}[data-learning-lab="physics-spectroscopy-imaging"] .psi-sample{fill:var(--psi-orange);stroke:var(--bg,#fff);stroke-width:1.1}[data-learning-lab="physics-spectroscopy-imaging"] .psi-selected{stroke:var(--psi-red);stroke-width:1.4;stroke-dasharray:4 4}',
      '[data-learning-lab="physics-spectroscopy-imaging"] .psi-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:8px 0 0;color:var(--fg-soft,currentColor);font-size:12px}[data-learning-lab="physics-spectroscopy-imaging"] .psi-key{display:inline-flex;align-items:center;gap:5px}[data-learning-lab="physics-spectroscopy-imaging"] .psi-swatch{display:inline-block;width:18px;height:3px;background:var(--psi-blue)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-swatch[data-kind="measured"]{background:var(--psi-orange)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-swatch[data-kind="reconstruction"]{background:var(--psi-green)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-swatch[data-kind="psf"]{background:var(--psi-gold)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-swatch[data-kind="transfer"]{background:var(--psi-red)}',
      '[data-learning-lab="physics-spectroscopy-imaging"] .psi-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="physics-spectroscopy-imaging"] .psi-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-metric:nth-child(4n+1){border-color:var(--psi-blue)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-metric:nth-child(4n+2){border-color:var(--psi-orange)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-metric:nth-child(4n+3){border-color:var(--psi-green)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-metric:nth-child(4n){border-color:var(--psi-red)}[data-learning-lab="physics-spectroscopy-imaging"] .psi-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="physics-spectroscopy-imaging"] .psi-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-spectroscopy-imaging"] .psi-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="physics-spectroscopy-imaging"] table{width:100%;min-width:560px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="physics-spectroscopy-imaging"] th,[data-learning-lab="physics-spectroscopy-imaging"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="physics-spectroscopy-imaging"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="physics-spectroscopy-imaging"] .psi-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--psi-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="physics-spectroscopy-imaging"] .psi-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:680px){[data-learning-lab="physics-spectroscopy-imaging"] .psi-prediction-grid{grid-template-columns:1fr}[data-learning-lab="physics-spectroscopy-imaging"] .psi-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="physics-spectroscopy-imaging"] .psi-stage-frame svg{min-width:640px}}@media(max-width:430px){[data-learning-lab="physics-spectroscopy-imaging"] .psi-metrics{grid-template-columns:1fr}[data-learning-lab="physics-spectroscopy-imaging"] .psi-stage-frame{padding:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="physics-spectroscopy-imaging"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function normalizeConfig(input) {
      var source = input || {};
      var separation = finite(source.separation === undefined ? DEFAULTS.separation : source.separation, "separation");
      var psfSigma = finite(source.psfSigma === undefined ? DEFAULTS.psfSigma : source.psfSigma, "psfSigma");
      var noise = finite(source.noise === undefined ? DEFAULTS.noise : source.noise, "noise");
      var regularization = finite(source.regularization === undefined ? DEFAULTS.regularization : source.regularization, "regularization");
      if (separation < 0.3 || separation > 1.6) throw new RangeError("separation must be in [0.3, 1.6]");
      if (psfSigma < 0.08 || psfSigma > 0.38) throw new RangeError("psfSigma must be in [0.08, 0.38]");
      if (noise < 0 || noise > 0.12) throw new RangeError("noise must be in [0, 0.12]");
      if (regularization < 0 || regularization > 0.25) throw new RangeError("regularization must be in [0, 0.25]");
      return { separation: separation, psfSigma: psfSigma, noise: noise, regularization: regularization };
    }

    function periodicDistance(value) {
      var distance = Math.abs(value);
      return Math.min(distance, DOMAIN - distance);
    }

    function gaussian(value, sigma) {
      return Math.exp(-0.5 * value * value / (sigma * sigma));
    }

    function xAt(index) {
      return -DOMAIN / 2 + DOMAIN * index / SAMPLE_COUNT;
    }

    function periodicXAt(index) {
      var centered = index <= SAMPLE_COUNT / 2 ? index : index - SAMPLE_COUNT;
      return DOMAIN * centered / SAMPLE_COUNT;
    }

    function sourceSignal(separation) {
      var values = [];
      var left = -separation / 2;
      var right = separation / 2;
      for (var index = 0; index < SAMPLE_COUNT; index += 1) {
        var x = xAt(index);
        values.push(gaussian(x - left, LINE_SIGMA) + gaussian(x - right, LINE_SIGMA));
      }
      return values;
    }

    function psfKernel(sigma) {
      var values = [];
      var sum = 0;
      for (var index = 0; index < SAMPLE_COUNT; index += 1) {
        var centered = index <= SAMPLE_COUNT / 2 ? index : index - SAMPLE_COUNT;
        var distance = DOMAIN * centered / SAMPLE_COUNT;
        var value = gaussian(distance, sigma);
        values.push(value);
        sum += value;
      }
      return values.map(function (value) { return value / sum; });
    }

    function noiseShape(index) {
      var x = xAt(index);
      return (0.7 * Math.sin(2.5 * x + 0.4) + 0.35 * Math.sin(8.7 * x - 0.2)) / 1.05;
    }

    function circularConvolution(signal, kernel) {
      var output = [];
      for (var index = 0; index < signal.length; index += 1) {
        var sum = 0;
        for (var shift = 0; shift < signal.length; shift += 1) {
          var kernelIndex = (index - shift + signal.length) % signal.length;
          sum += signal[shift] * kernel[kernelIndex];
        }
        output.push(sum);
      }
      return output;
    }

    function dft(values, inverse) {
      var count = values.length;
      var output = [];
      var sign = inverse ? 1 : -1;
      for (var frequency = 0; frequency < count; frequency += 1) {
        var real = 0;
        var imaginary = 0;
        for (var index = 0; index < count; index += 1) {
          var angle = sign * TWO_PI * frequency * index / count;
          var cosine = Math.cos(angle);
          var sine = Math.sin(angle);
          real += values[index] * cosine;
          imaginary += values[index] * sine;
        }
        if (inverse) {
          real /= count;
          imaginary /= count;
        }
        output.push({ re: real, im: imaginary });
      }
      return output;
    }

    function dftMagnitudeAtQ(values, q) {
      var real = 0;
      var imaginary = 0;
      for (var index = 0; index < values.length; index += 1) {
        var angle = -q * periodicXAt(index);
        real += values[index] * Math.cos(angle);
        imaginary += values[index] * Math.sin(angle);
      }
      return Math.sqrt(real * real + imaginary * imaginary);
    }

    function analyticTransfer(sigma, q) {
      return Math.exp(-0.5 * Math.pow(sigma * q, 2));
    }

    function regularizedInverse(observed, kernel, regularization) {
      var observedSpectrum = dft(observed, false);
      var kernelSpectrum = dft(kernel, false);
      var reconstructedSpectrum = [];
      for (var index = 0; index < observedSpectrum.length; index += 1) {
        var y = observedSpectrum[index];
        var h = kernelSpectrum[index];
        var denominator = h.re * h.re + h.im * h.im + Math.max(regularization, 1e-12);
        reconstructedSpectrum.push({
          re: (h.re * y.re + h.im * y.im) / denominator,
          im: (h.re * y.im - h.im * y.re) / denominator
        });
      }
      var inverse = [];
      var count = reconstructedSpectrum.length;
      for (var sample = 0; sample < count; sample += 1) {
        var real = 0;
        for (var frequency = 0; frequency < count; frequency += 1) {
          var angle = TWO_PI * frequency * sample / count;
          real += reconstructedSpectrum[frequency].re * Math.cos(angle) - reconstructedSpectrum[frequency].im * Math.sin(angle);
        }
        inverse.push(real / count);
      }
      return inverse;
    }

    function rootMeanSquare(left, right) {
      var sum = 0;
      for (var index = 0; index < left.length; index += 1) sum += Math.pow(left[index] - right[index], 2);
      return Math.sqrt(sum / left.length);
    }

    function buildData(input) {
      var config = normalizeConfig(input);
      var truth = sourceSignal(config.separation);
      var kernel = psfKernel(config.psfSigma);
      var blurred = circularConvolution(truth, kernel);
      var observed = blurred.map(function (value, index) { return value + config.noise * noiseShape(index); });
      var reconstruction = regularizedInverse(observed, kernel, config.regularization);
      var transfer = [];
      for (var index = 0; index < TRANSFER_COUNT; index += 1) {
        var q = TRANSFER_Q_MAX * index / (TRANSFER_COUNT - 1);
        transfer.push({
          frequency: index,
          q: q,
          magnitude: dftMagnitudeAtQ(kernel, q),
          analytic: analyticTransfer(config.psfSigma, q)
        });
      }
      var fwhm = 2 * Math.sqrt(2 * Math.log(2)) * config.psfSigma;
      var h4 = dftMagnitudeAtQ(kernel, 4);
      var h12 = dftMagnitudeAtQ(kernel, 12);
      return {
        config: config,
        x: truth.map(function (_, index) { return xAt(index); }),
        truth: truth,
        kernel: kernel,
        blurred: blurred,
        observed: observed,
        reconstruction: reconstruction,
        transfer: transfer,
        metrics: {
          fwhm: fwhm,
          ratio: config.separation / fwhm,
          forwardRms: rootMeanSquare(observed, blurred),
          reconstructionRms: rootMeanSquare(reconstruction, truth),
          transferAt4: h4,
          transferAt12: h12,
          analyticTransferAt4: analyticTransfer(config.psfSigma, 4),
          analyticTransferAt12: analyticTransfer(config.psfSigma, 12),
          transferQ4: 4,
          transferQ12: 12,
          inverseGainAt4: h4 / (h4 * h4 + config.regularization),
          inverseGainAt12: h12 / (h12 * h12 + config.regularization),
          kernelSum: kernel.reduce(function (sum, value) { return sum + value; }, 0)
        }
      };
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

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function textNode(doc, x, y, value, className, anchor) {
      return makeSvg(doc, "text", { x: x, y: y, class: className || "", "text-anchor": anchor || "start", "font-size": 11 }, [value]);
    }

    function pathFor(values, mapX, mapY, stride) {
      var path = "";
      for (var index = 0; index < values.length; index += stride || 1) {
        path += (path ? "L" : "M") + mapX(index).toFixed(2) + " " + mapY(values[index]).toFixed(2) + " ";
      }
      return path.trim();
    }

    function drawLineChart(doc, group, rows, xStart, yStart, width, height, valueMin, valueMax, title, xLabel, yLabel, xValues) {
      var left = xStart + 42;
      var right = xStart + width - 12;
      var top = yStart + 22;
      var bottom = yStart + height - 30;
      var coordinates = xValues || rows.map(function (_, index) { return index; });
      var coordinateMin = coordinates[0];
      var coordinateMax = coordinates[coordinates.length - 1];
      var mapX = function (index) { return left + (coordinates[index] - coordinateMin) / (coordinateMax - coordinateMin) * (right - left); };
      var mapY = function (value) { return bottom - (value - valueMin) / (valueMax - valueMin) * (bottom - top); };
      group.appendChild(textNode(doc, left, yStart + 13, title, "", "start"));
      for (var tick = 0; tick <= 4; tick += 1) {
        var y = top + tick / 4 * (bottom - top);
        group.appendChild(makeSvg(doc, "line", { x1: left, y1: y, x2: right, y2: y, class: "psi-grid" }));
        group.appendChild(textNode(doc, left - 7, y + 4, formatNumber(valueMax - tick / 4 * (valueMax - valueMin), 2), "", "end"));
      }
      group.appendChild(makeSvg(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, class: "psi-axis" }));
      group.appendChild(makeSvg(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, class: "psi-axis" }));
      group.appendChild(textNode(doc, (left + right) / 2, bottom + 23, xLabel, "", "middle"));
      group.appendChild(textNode(doc, left - 32, (top + bottom) / 2, yLabel, "", "middle"));
      return { left: left, right: right, top: top, bottom: bottom, mapX: mapX, mapY: mapY };
    }

    function drawSvg(doc, result) {
      var svg = makeSvg(doc, "svg", {
        viewBox: "0 0 820 520",
        role: "img",
        "aria-label": "真实信号、卷积测量、正则化重建、点扩散函数和频率传递函数"
      });
      var allValues = result.truth.concat(result.observed, result.reconstruction);
      var yMin = Math.min(-0.15, Math.min.apply(null, allValues) - 0.05);
      var yMax = Math.max(1.1, Math.max.apply(null, allValues) + 0.08);
      var signalGroup = makeSvg(doc, "g", {});
      var signalChart = drawLineChart(doc, signalGroup, result.x, 0, 0, 820, 300, yMin, yMax, "信号域：同一条测量链", "位置 x（谱线波长偏移 / 成像坐标）", "相对强度");
      var pathTruth = result.truth.map(function (value, index) { return { x: signalChart.mapX(index), y: signalChart.mapY(value) }; });
      var pathMeasured = result.observed.map(function (value, index) { return { x: signalChart.mapX(index), y: signalChart.mapY(value) }; });
      var pathReconstruction = result.reconstruction.map(function (value, index) { return { x: signalChart.mapX(index), y: signalChart.mapY(value) }; });
      function pointPath(points) { return points.map(function (point, index) { return (index ? "L" : "M") + point.x.toFixed(2) + " " + point.y.toFixed(2); }).join(" "); }
      signalGroup.appendChild(makeSvg(doc, "path", { d: pointPath(pathTruth), class: "psi-true" }));
      signalGroup.appendChild(makeSvg(doc, "path", { d: pointPath(pathMeasured), class: "psi-measured" }));
      signalGroup.appendChild(makeSvg(doc, "path", { d: pointPath(pathReconstruction), class: "psi-reconstruction" }));
      for (var sample = 0; sample < result.observed.length; sample += 4) {
        signalGroup.appendChild(makeSvg(doc, "circle", { cx: signalChart.mapX(sample), cy: signalChart.mapY(result.observed[sample]), r: 2.7, class: "psi-sample" }));
      }
      svg.appendChild(signalGroup);

      var psfGroup = makeSvg(doc, "g", {});
      var psfRows = [];
      for (var index = 0; index < 49; index += 1) {
        var x = -1.5 + 3 * index / 48;
        psfRows.push(gaussian(x, result.config.psfSigma));
      }
      var psfChart = drawLineChart(doc, psfGroup, psfRows, 0, 305, 400, 205, 0, 1.08, "点扩散函数 h(x)", "相对位置", "h");
      psfGroup.appendChild(makeSvg(doc, "path", { d: pathFor(psfRows, psfChart.mapX, psfChart.mapY, 1), class: "psi-psf" }));
      svg.appendChild(psfGroup);

      var transferGroup = makeSvg(doc, "g", {});
      var transferRows = result.transfer.map(function (point) { return point.magnitude; });
      var transferChart = drawLineChart(doc, transferGroup, transferRows, 410, 305, 410, 205, 0, 1.08, "频率域：|H(q)| 与可逆性", "物理空间频率 q / 长度", "|H|", result.transfer.map(function (point) { return point.q; }));
      transferGroup.appendChild(makeSvg(doc, "path", { d: pathFor(transferRows, transferChart.mapX, transferChart.mapY, 1), class: "psi-transfer" }));
      transferGroup.appendChild(makeSvg(doc, "line", { x1: transferChart.left, y1: transferChart.mapY(0.5), x2: transferChart.right, y2: transferChart.mapY(0.5), class: "psi-selected" }));
      transferGroup.appendChild(textNode(doc, transferChart.right, transferChart.mapY(0.5) - 5, "0.5 参考线", "", "end"));
      svg.appendChild(transferGroup);
      return svg;
    }

    function metric(doc, label, value) {
      return makeElement(doc, "div", { className: "psi-metric" }, [
        makeElement(doc, "span", { text: label }),
        makeElement(doc, "strong", { text: value })
      ]);
    }

    function selectedValue(form, name) {
      var select = form.querySelector('[data-psi-prediction="' + name + '"]');
      return select && select.value ? select.value : "";
    }

    function predictionField(doc, key, label, options) {
      var select = makeElement(doc, "select", { "data-psi-prediction": key, "aria-label": label });
      select.appendChild(makeElement(doc, "option", { value: "", text: "请选择" }));
      options.forEach(function (option) { select.appendChild(makeElement(doc, "option", { value: option.value, text: option.label })); });
      return makeElement(doc, "div", { className: "psi-prediction" }, [makeElement(doc, "label", {}, [label]), select]);
    }

    function mount(rootNode, api) {
      var doc = rootNode.ownerDocument || (host && host.document);
      if (!doc) throw new Error("a document is required to mount the lab");
      injectStyles(doc);
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, preset: "default", feedback: "" };
      var shell = makeElement(doc, "div", { className: "psi-shell" });
      shell.appendChild(makeElement(doc, "h3", { text: "Resolution lab：从点扩散到稳定反演" }));
      shell.appendChild(makeElement(doc, "p", { className: "psi-muted", text: "谱线和图像共享同一条测量链：真实对象先与 PSF 卷积，再叠加噪声；重建使用 Fourier 域 Tikhonov 逆。" }));

      var predictionForm = makeElement(doc, "form", { className: "psi-predictions" });
      predictionForm.appendChild(makeElement(doc, "fieldset", {}, [
        makeElement(doc, "legend", { text: "先预测，再揭示" }),
        makeElement(doc, "div", { className: "psi-prediction-grid" }, [
          predictionField(doc, "blur", "PSF 的 sigma 变大时，FWHM 会", [{ value: "wider", label: "变宽" }, { value: "narrower", label: "变窄" }, { value: "same", label: "不变" }]),
          predictionField(doc, "noise", "当 |H(k)| 很小时，直接除以 H 会", [{ value: "amplify", label: "放大噪声" }, { value: "suppress", label: "消灭噪声" }, { value: "none", label: "不改变" }]),
          predictionField(doc, "regularize", "增大 lambda 的主要代价是", [{ value: "tradeoff", label: "细节与降噪权衡" }, { value: "free", label: "同时完美提升" }, { value: "resolution", label: "改变原始 PSF" }])
        ])
      ]));
      var predictionActions = makeElement(doc, "div", { className: "psi-actions" });
      var revealButton = makeElement(doc, "button", { type: "submit", className: "psi-primary", text: "提交预测并揭示" });
      var resetButton = makeElement(doc, "button", { type: "button", text: "重置" });
      predictionActions.appendChild(revealButton);
      predictionActions.appendChild(resetButton);
      predictionForm.appendChild(predictionActions);
      var feedback = makeElement(doc, "p", { className: "psi-feedback", "aria-live": "polite" });
      predictionForm.appendChild(feedback);
      shell.appendChild(predictionForm);

      var bench = makeElement(doc, "div", { hidden: true });
      var layout = makeElement(doc, "div", { className: "psi-layout" });
      var controls = makeElement(doc, "div", { className: "psi-controls" });
      controls.appendChild(makeElement(doc, "h4", { text: "参数" }));
      var inputs = {};
      function addRange(key, label, min, max, step, digits) {
        var output = makeElement(doc, "output", { text: formatNumber(state.config[key], digits) });
        var input = makeElement(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
        input.addEventListener("input", function () {
          state.config[key] = finite(input.value, key);
          state.preset = "custom";
          state.feedback = "参数已更新；当前预测保持揭示。";
          render();
        });
        inputs[key] = { input: input, output: output, digits: digits };
        controls.appendChild(makeElement(doc, "div", { className: "psi-control" }, [makeElement(doc, "label", {}, [label, output]), input]));
      }
      addRange("separation", "两峰间距 d", "0.30", "1.60", "0.01", 2);
      addRange("psfSigma", "PSF sigma", "0.08", "0.38", "0.01", 2);
      addRange("noise", "噪声幅度", "0", "0.12", "0.005", 3);
      addRange("regularization", "正则 lambda", "0", "0.25", "0.005", 3);
      controls.appendChild(makeElement(doc, "h4", { text: "预设" }));
      var presetRow = makeElement(doc, "div", { className: "psi-preset-row", role: "group", "aria-label": "实验预设" });
      PRESETS.forEach(function (preset) {
        var button = makeElement(doc, "button", { type: "button", text: preset.label, "data-psi-preset": preset.id, "aria-pressed": "false" });
        button.addEventListener("click", function () {
          state.config = normalizeConfig(preset);
          state.preset = preset.id;
          state.feedback = "已切换预设；可继续比较正演与反演。";
          render();
          announce(state.feedback);
        });
        presetRow.appendChild(button);
      });
      controls.appendChild(presetRow);
      var stage = makeElement(doc, "div", { className: "psi-stage" });
      var stageFrame = makeElement(doc, "div", { className: "psi-stage-frame" });
      var chartHost = makeElement(doc, "div");
      stageFrame.appendChild(chartHost);
      stageFrame.appendChild(makeElement(doc, "div", { className: "psi-legend" }, [
        makeElement(doc, "span", { className: "psi-key" }, [makeElement(doc, "i", { className: "psi-swatch" }), "真实对象 x"]),
        makeElement(doc, "span", { className: "psi-key" }, [makeElement(doc, "i", { className: "psi-swatch", "data-kind": "measured" }), "测量 y"]),
        makeElement(doc, "span", { className: "psi-key" }, [makeElement(doc, "i", { className: "psi-swatch", "data-kind": "reconstruction" }), "重建 xλ"]),
        makeElement(doc, "span", { className: "psi-key" }, [makeElement(doc, "i", { className: "psi-swatch", "data-kind": "psf" }), "PSF h"]),
        makeElement(doc, "span", { className: "psi-key" }, [makeElement(doc, "i", { className: "psi-swatch", "data-kind": "transfer" }), "|H(k)|"])
      ]));
      stage.appendChild(stageFrame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      bench.appendChild(layout);
      var metricsHost = makeElement(doc, "div", { className: "psi-metrics" });
      bench.appendChild(metricsHost);
      var ledgerHost = makeElement(doc, "div", { className: "psi-ledger" });
      bench.appendChild(ledgerHost);
      var note = makeElement(doc, "p", { className: "psi-note" });
      bench.appendChild(note);
      shell.appendChild(bench);
      rootNode.replaceChildren(shell);

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(rootNode, message);
      }

      function renderLedger(docNode, result) {
        var table = makeElement(docNode, "table", {});
        var head = makeElement(docNode, "thead", {}, [makeElement(docNode, "tr", {}, [makeElement(docNode, "th", { text: "账本" }), makeElement(docNode, "th", { text: "当前数值" }), makeElement(docNode, "th", { text: "物理读法" })])]);
        var body = makeElement(docNode, "tbody", {}, [
          makeElement(docNode, "tr", {}, [makeElement(docNode, "td", { text: "分辨率代理" }), makeElement(docNode, "td", { text: "FWHM=" + formatNumber(result.metrics.fwhm, 3) + "，d/FWHM=" + formatNumber(result.metrics.ratio, 2) }), makeElement(docNode, "td", { text: "比值大于 1 只表示当前代理下峰距相对宽；它不是跨仪器的唯一判据。" })]),
          makeElement(docNode, "tr", {}, [makeElement(docNode, "td", { text: "正演" }), makeElement(docNode, "td", { text: "sum(h)=" + formatNumber(result.metrics.kernelSum, 6) + "，RMS 噪声=" + formatNumber(result.metrics.forwardRms, 3) }), makeElement(docNode, "td", { text: "h*x 保留线性叠加；噪声在观测端加入。" })]),
          makeElement(docNode, "tr", {}, [makeElement(docNode, "td", { text: "逆问题" }), makeElement(docNode, "td", { text: "H(q=" + formatNumber(result.metrics.transferQ4, 0) + ")=" + formatNumber(result.metrics.transferAt4, 3) + "，H(q=" + formatNumber(result.metrics.transferQ12, 0) + ")=" + formatNumber(result.metrics.transferAt12, 3) }), makeElement(docNode, "td", { text: "同一物理 q 坐标用于 DFT 与解析高斯账本；高频传递很小，直接除法会放大误差。" })])
        ]);
        table.appendChild(head);
        table.appendChild(body);
        return table;
      }

      function render() {
        Object.keys(inputs).forEach(function (key) {
          inputs[key].input.value = String(state.config[key]);
          inputs[key].output.textContent = formatNumber(state.config[key], inputs[key].digits);
        });
        presetRow.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", button.getAttribute("data-psi-preset") === state.preset ? "true" : "false"); });
        feedback.textContent = state.feedback;
        feedback.className = "psi-feedback" + (state.feedback.indexOf("请先") === 0 ? " psi-warn" : "");
        bench.hidden = !state.revealed;
        if (!state.revealed) return;
        var result = buildData(state.config);
        chartHost.replaceChildren(drawSvg(doc, result));
        metricsHost.replaceChildren(
          metric(doc, "PSF FWHM", formatNumber(result.metrics.fwhm, 3)),
          metric(doc, "d / FWHM", formatNumber(result.metrics.ratio, 2)),
          metric(doc, "重建 RMS", formatNumber(result.metrics.reconstructionRms, 3)),
          metric(doc, "lambda", formatNumber(state.config.regularization, 3))
        );
        ledgerHost.replaceChildren(renderLedger(doc, result));
        note.textContent = "边界：当前使用周期网格和固定高斯 PSF；真实仪器还要校准像差、背景、采样、漂移和噪声协方差。正则化只能选择稳定的估计，不能从 |H|≈0 的频段凭空制造信息。";
      }

      predictionForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var keys = ["blur", "noise", "regularize"];
        var complete = keys.every(function (key) { return selectedValue(predictionForm, key); });
        if (!complete) {
          state.feedback = "请先完成三项预测；揭示前不显示曲线和反演账本。";
          render();
          return;
        }
        var expected = { blur: "wider", noise: "amplify", regularize: "tradeoff" };
        var correct = keys.filter(function (key) { return selectedValue(predictionForm, key) === expected[key]; }).length;
        state.predictions = { blur: selectedValue(predictionForm, "blur"), noise: selectedValue(predictionForm, "noise"), regularize: selectedValue(predictionForm, "regularize") };
        state.revealed = true;
        state.feedback = "已揭示：" + correct + "/3 命中。FWHM 来自 PSF，反演稳定性来自频率传递与正则化。";
        render();
        announce(state.feedback);
      });
      resetButton.addEventListener("click", function () {
        predictionForm.reset();
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, preset: "default", feedback: "" };
        render();
        announce("分辨率实验已重置；预测重新隐藏。");
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var result = buildData(DEFAULTS);
      check(result.truth.length === SAMPLE_COUNT && result.kernel.length === SAMPLE_COUNT, "fixed grid has the expected sample count");
      check(near(result.metrics.kernelSum, 1, 1e-12), "normalized PSF conserves constant signal");
      check(near(result.metrics.fwhm, 2.354820045 * DEFAULTS.psfSigma, 1e-10), "Gaussian FWHM formula");
      check(near(result.metrics.ratio, DEFAULTS.separation / result.metrics.fwhm, 1e-10), "separation ratio uses the same FWHM");
      check(result.metrics.transferAt4 > result.metrics.transferAt12, "higher spatial frequency is attenuated more");
      check(result.metrics.inverseGainAt12 < 1 / result.metrics.transferAt12, "regularization limits high-frequency inverse gain");
      check(result.metrics.forwardRms > 0, "deterministic observation noise is present by default");
      var noiseless = buildData({ separation: 0.95, psfSigma: 0.12, noise: 0, regularization: 0.001 });
      check(noiseless.metrics.forwardRms < 1e-10, "zero noise matches the forward convolution");
      check(noiseless.metrics.reconstructionRms < 0.08, "well-conditioned inverse approximately reconstructs the source");
      var leftIndex = result.x.reduce(function (best, value, index) { return Math.abs(value + DEFAULTS.separation / 2) < Math.abs(result.x[best] + DEFAULTS.separation / 2) ? index : best; }, 0);
      var rightIndex = result.x.reduce(function (best, value, index) { return Math.abs(value - DEFAULTS.separation / 2) < Math.abs(result.x[best] - DEFAULTS.separation / 2) ? index : best; }, 0);
      check(near(result.truth[leftIndex], result.truth[rightIndex], 1e-12), "the two source peaks have equal strength");
      check(result.transfer.some(function (point) { return near(point.q, 4, 1e-12); }) && result.transfer.some(function (point) { return near(point.q, 12, 1e-12); }), "DFT transfer plot uses physical q=4 and q=12 coordinates");
      check(near(result.metrics.transferAt4, result.metrics.analyticTransferAt4, 0.01) && near(result.metrics.transferAt12, result.metrics.analyticTransferAt12, 0.03), "DFT and analytic transfer ledger share the physical q coordinate");
      var invalid = false;
      try { normalizeConfig({ psfSigma: 0.01 }); } catch (error) { invalid = true; }
      check(invalid, "out-of-range PSF width is rejected");
      invalid = false;
      try { normalizeConfig({ noise: 2 }); } catch (error2) { invalid = true; }
      check(invalid, "out-of-range noise is rejected");
      return { checks: checks };
    }

    return {
      LAB_ID: LAB_ID,
      DEFAULTS: DEFAULTS,
      PRESETS: PRESETS,
      normalizeConfig: normalizeConfig,
      circularConvolution: circularConvolution,
      dft: dft,
      dftMagnitudeAtQ: dftMagnitudeAtQ,
      analyticTransfer: analyticTransfer,
      sourceSignal: sourceSignal,
      regularizedInverse: regularizedInverse,
      buildData: buildData,
      mount: mount,
      selfTest: selfTest
    };
  }
);
