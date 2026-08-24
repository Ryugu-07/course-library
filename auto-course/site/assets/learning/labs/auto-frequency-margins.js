(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-frequency-margins", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-frequency-margins self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-frequency-margins self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
}) (
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-frequency-margins-styles";
    var EPS = 1e-9;
    var DEFAULTS = {
      gain: 1,
      zero: 0.5,
      pole: 4,
      delay: 0.08,
      lowFrequency: 0.01,
      highFrequency: 30,
      samples: 480
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-frequency-margins"]{--fm-blue:var(--cl-blue,#315f9d);--fm-gold:var(--cl-gold,#9b6a12);--fm-green:var(--cl-green,#39734d);--fm-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-frequency-margins"] *{box-sizing:border-box}[data-learning-lab="auto-frequency-margins"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-frequency-margins"] h3,[data-learning-lab="auto-frequency-margins"] h4{margin:0;color:var(--fg,currentColor);letter-spacing:0}[data-learning-lab="auto-frequency-margins"] h3{font-size:1.16rem}[data-learning-lab="auto-frequency-margins"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-frequency-margins"] p{margin:8px 0}[data-learning-lab="auto-frequency-margins"] .fm-note,[data-learning-lab="auto-frequency-margins"] .fm-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-frequency-margins"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-frequency-margins"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-frequency-margins"] .fm-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-frequency-margins"] button,[data-learning-lab="auto-frequency-margins"] input{font:inherit}',
      '[data-learning-lab="auto-frequency-margins"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-frequency-margins"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-frequency-margins"] button[aria-pressed="true"],[data-learning-lab="auto-frequency-margins"] .fm-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-frequency-margins"] button:focus-visible,[data-learning-lab="auto-frequency-margins"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-frequency-margins"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-frequency-margins"] .fm-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-frequency-margins"] .fm-actions>*{flex:1 1 170px}[data-learning-lab="auto-frequency-margins"] .fm-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-frequency-margins"] .fm-pass{color:var(--fm-green)}[data-learning-lab="auto-frequency-margins"] .fm-warn{color:var(--fm-red)}',
      '[data-learning-lab="auto-frequency-margins"] .fm-layout{display:grid;grid-template-columns:minmax(225px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-frequency-margins"] .fm-controls,[data-learning-lab="auto-frequency-margins"] .fm-stage{min-width:0}[data-learning-lab="auto-frequency-margins"] .fm-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-frequency-margins"] .fm-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-frequency-margins"] .fm-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-frequency-margins"] .fm-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-frequency-margins"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-frequency-margins"] .fm-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-frequency-margins"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-frequency-margins"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-frequency-margins"] .fm-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-frequency-margins"] .fm-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-frequency-margins"] .fm-magnitude{fill:none;stroke:var(--fm-blue);stroke-width:2.5}[data-learning-lab="auto-frequency-margins"] .fm-phase{fill:none;stroke:var(--fm-gold);stroke-width:2.5}[data-learning-lab="auto-frequency-margins"] .fm-cursor{stroke:var(--fm-red);stroke-width:1.6;stroke-dasharray:5 4}[data-learning-lab="auto-frequency-margins"] .fm-nyquist{fill:none;stroke:var(--fm-blue);stroke-width:2.4}[data-learning-lab="auto-frequency-margins"] .fm-nyquist-mirror{fill:none;stroke:var(--fm-gold);stroke-width:1.8;stroke-dasharray:5 4}[data-learning-lab="auto-frequency-margins"] .fm-critical{fill:var(--fm-red);stroke:var(--bg,#fff);stroke-width:1.5}[data-learning-lab="auto-frequency-margins"] .fm-label{font-size:11px}[data-learning-lab="auto-frequency-margins"] .fm-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-frequency-margins"] .fm-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-frequency-margins"] .fm-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-frequency-margins"] .fm-metric:nth-child(4n+1){border-color:var(--fm-blue)}[data-learning-lab="auto-frequency-margins"] .fm-metric:nth-child(4n+2){border-color:var(--fm-gold)}[data-learning-lab="auto-frequency-margins"] .fm-metric:nth-child(4n+3){border-color:var(--fm-green)}[data-learning-lab="auto-frequency-margins"] .fm-metric:nth-child(4n){border-color:var(--fm-red)}[data-learning-lab="auto-frequency-margins"] .fm-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-frequency-margins"] .fm-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-frequency-margins"] .fm-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-frequency-margins"] table{width:100%;min-width:900px;border-collapse:collapse;font-size:11.3px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-frequency-margins"] th,[data-learning-lab="auto-frequency-margins"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-frequency-margins"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-frequency-margins"] .fm-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--fm-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}[data-learning-lab="auto-frequency-margins"] .fm-certificate.fm-blocked{border-color:var(--fm-red)}',
      '@media(max-width:900px){[data-learning-lab="auto-frequency-margins"] .fm-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-frequency-margins"] .fm-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-frequency-margins"] .fm-stage-frame{padding:4px}[data-learning-lab="auto-frequency-margins"] table{font-size:10.5px}[data-learning-lab="auto-frequency-margins"] th,[data-learning-lab="auto-frequency-margins"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-frequency-margins"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function complex(re, im) {
      return { re: re, im: im };
    }

    function multiply(left, right) {
      return complex(left.re * right.re - left.im * right.im, left.re * right.im + left.im * right.re);
    }

    function magnitude(value) {
      return Math.sqrt(value.re * value.re + value.im * value.im);
    }

    function normalizeConfig(input) {
      var source = input || {};
      var gain = finite(source.gain === undefined ? DEFAULTS.gain : source.gain, "gain");
      var zero = finite(source.zero === undefined ? DEFAULTS.zero : source.zero, "zero");
      var pole = finite(source.pole === undefined ? DEFAULTS.pole : source.pole, "pole");
      var delay = finite(source.delay === undefined ? DEFAULTS.delay : source.delay, "delay");
      var lowFrequency = finite(source.lowFrequency === undefined ? DEFAULTS.lowFrequency : source.lowFrequency, "lowFrequency");
      var highFrequency = finite(source.highFrequency === undefined ? DEFAULTS.highFrequency : source.highFrequency, "highFrequency");
      var samples = Math.round(finite(source.samples === undefined ? DEFAULTS.samples : source.samples, "samples"));
      if (gain < 0.05 || gain > 8) throw new RangeError("gain must be in [0.05, 8]");
      if (zero < 0.2 || zero > 1.5) throw new RangeError("zero must be in [0.2, 1.5]");
      if (pole < 2 || pole > 10) throw new RangeError("pole must be in [2, 10]");
      if (pole <= zero) throw new RangeError("lead pole must exceed lead zero");
      if (delay < 0 || delay > 0.5) throw new RangeError("delay must be in [0, 0.5]");
      if (lowFrequency <= 0 || highFrequency <= lowFrequency) throw new RangeError("frequency range is invalid");
      if (samples < 120 || samples > 900) throw new RangeError("samples must be in [120, 900]");
      return {
        gain: gain,
        zero: zero,
        pole: pole,
        delay: delay,
        lowFrequency: lowFrequency,
        highFrequency: highFrequency,
        samples: samples,
        plantPoles: [1.2, 5]
      };
    }

    function evaluateAt(omega, input) {
      var value = finite(omega, "omega");
      if (value <= 0) throw new RangeError("omega must be positive");
      var config = normalizeConfig(input);
      var plant = multiply(
        complex(1, 0),
        complex(
          1 / (1 + (value / config.plantPoles[0]) * (value / config.plantPoles[0])),
          -(value / config.plantPoles[0]) / (1 + (value / config.plantPoles[0]) * (value / config.plantPoles[0]))
        )
      );
      var secondPlant = complex(
        1 / (1 + (value / config.plantPoles[1]) * (value / config.plantPoles[1])),
        -(value / config.plantPoles[1]) / (1 + (value / config.plantPoles[1]) * (value / config.plantPoles[1]))
      );
      plant = multiply(plant, secondPlant);
      var controller = multiply(
        complex(1, value / config.zero),
        complex(
          config.gain / (1 + (value / config.pole) * (value / config.pole)),
          -config.gain * (value / config.pole) / (1 + (value / config.pole) * (value / config.pole))
        )
      );
      var delay = complex(Math.cos(value * config.delay), -Math.sin(value * config.delay));
      var loop = multiply(multiply(plant, controller), delay);
      var plantPhase = -(Math.atan(value / config.plantPoles[0]) + Math.atan(value / config.plantPoles[1])) * 180 / Math.PI;
      var controllerPhase = (Math.atan(value / config.zero) - Math.atan(value / config.pole)) * 180 / Math.PI;
      var delayPhase = -value * config.delay * 180 / Math.PI;
      var phase = plantPhase + controllerPhase + delayPhase;
      return {
        omega: value,
        config: config,
        plant: plant,
        controller: controller,
        delay: delay,
        loop: loop,
        plantMagnitudeDb: 20 * Math.log10(magnitude(plant)),
        controllerMagnitudeDb: 20 * Math.log10(magnitude(controller)),
        magnitudeDb: 20 * Math.log10(magnitude(loop)),
        plantPhase: plantPhase,
        controllerPhase: controllerPhase,
        delayPhase: delayPhase,
        phase: phase
      };
    }

    function frequencyGrid(input, count) {
      var config = normalizeConfig(input);
      var samples = Math.round(count === undefined ? config.samples : count);
      if (samples < 20 || samples > 900) throw new RangeError("count must be in [20, 900]");
      var rows = [];
      for (var index = 0; index < samples; index += 1) {
        var fraction = index / (samples - 1);
        var omega = config.lowFrequency * Math.pow(config.highFrequency / config.lowFrequency, fraction);
        rows.push(evaluateAt(omega, config));
      }
      return rows;
    }

    function firstCrossing(rows, accessor, target) {
      for (var index = 1; index < rows.length; index += 1) {
        var leftValue = accessor(rows[index - 1]) - target;
        var rightValue = accessor(rows[index]) - target;
        if (Math.abs(leftValue) < EPS) return rows[index - 1];
        if (leftValue * rightValue <= 0) {
          var fraction = Math.abs(leftValue - rightValue) < EPS ? 0 : leftValue / (leftValue - rightValue);
          var leftLog = Math.log(rows[index - 1].omega);
          var rightLog = Math.log(rows[index].omega);
          var omega = Math.exp(leftLog + fraction * (rightLog - leftLog));
          return evaluateAt(omega, rows[index].config);
        }
      }
      return null;
    }

    function analyze(input) {
      var config = normalizeConfig(input);
      var rows = frequencyGrid(config, config.samples);
      var gainCrossover = firstCrossing(rows, function (row) { return row.magnitudeDb; }, 0);
      var phaseCrossover = firstCrossing(rows, function (row) { return row.phase; }, -180);
      var minDistance = Infinity;
      rows.forEach(function (row) {
        minDistance = Math.min(minDistance, magnitude({ re: row.loop.re + 1, im: row.loop.im }));
      });
      return {
        config: config,
        rows: rows,
        gainCrossover: gainCrossover,
        phaseCrossover: phaseCrossover,
        phaseMargin: gainCrossover ? 180 + gainCrossover.phase : null,
        gainMarginDb: phaseCrossover ? -phaseCrossover.magnitudeDb : null,
        gainMargin: phaseCrossover ? Math.pow(10, (-phaseCrossover.magnitudeDb) / 20) : null,
        nyquistDistance: minDistance,
        openLoopRhpPoles: 0
      };
    }

    function formatNumber(value, digits) {
      if (value === null || value === undefined || !Number.isFinite(value)) return "未定义";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) < 5e-10) return "0";
      if (places === 0) return value.toFixed(0);
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function element(doc, tag, attributes, children) {
      var node = doc.createElement(tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function svgElement(doc, tag, attributes, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function installStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "fm-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function pathFor(rows, key, mapX, mapY) {
      return rows.map(function (row, index) {
        return (index ? "L" : "M") + mapX(row.omega).toFixed(2) + " " + mapY(row[key]).toFixed(2);
      }).join(" ");
    }

    function nyquistPath(rows, mirror, mapX, mapY) {
      return rows.map(function (row, index) {
        var value = mirror ? -row.loop.im : row.loop.im;
        return (index ? "L" : "M") + mapX(row.loop.re).toFixed(2) + " " + mapY(value).toFixed(2);
      }).join(" ");
    }

    function drawPlot(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 560;
      var left = 52;
      var right = 16;
      var logLow = Math.log10(result.config.lowFrequency);
      var logHigh = Math.log10(result.config.highFrequency);
      var mapFrequency = function (omega) { return left + (Math.log10(omega) - logLow) / (logHigh - logLow) * (width - left - right); };
      var magTop = 24;
      var magBottom = 170;
      var phaseTop = 195;
      var phaseBottom = 340;
      var magValues = result.rows.map(function (row) { return row.magnitudeDb; });
      var phaseValues = result.rows.map(function (row) { return row.phase; });
      var magMin = Math.min(-60, Math.floor(Math.min.apply(Math, magValues) / 20) * 20);
      var magMax = Math.max(20, Math.ceil(Math.max.apply(Math, magValues) / 20) * 20);
      var phaseMin = Math.min(-180, Math.floor(Math.min.apply(Math, phaseValues) / 90) * 90);
      var phaseMax = Math.max(0, Math.ceil(Math.max.apply(Math, phaseValues) / 90) * 90);
      var mapMag = function (value) { return magTop + (magMax - value) / (magMax - magMin) * (magBottom - magTop); };
      var mapPhase = function (value) { return phaseTop + (phaseMax - value) / (phaseMax - phaseMin) * (phaseBottom - phaseTop); };
      svg.appendChild(svgElement(doc, "title", {}, "开环 Bode 与 Nyquist 设计实验"));
      svg.appendChild(svgElement(doc, "desc", {}, "上方是开环幅值和相位，下方是正负频率对称的 Nyquist 曲线与负一点。"));
      [magMin, (magMin + magMax) / 2, 0, magMax].forEach(function (value) {
        var y = mapMag(value);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: "fm-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: y + 4, "text-anchor": "end", class: "fm-small" }, formatNumber(value, 0) + " dB"));
      });
      [phaseMin, -180, phaseMax].forEach(function (value) {
        var y = mapPhase(value);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: "fm-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: y + 4, "text-anchor": "end", class: "fm-small" }, formatNumber(value, 0) + "°"));
      });
      [result.config.lowFrequency, 0.1, 1, 10, result.config.highFrequency].forEach(function (value) {
        if (value < result.config.lowFrequency || value > result.config.highFrequency) return;
        var x = mapFrequency(value);
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: magTop, x2: x, y2: phaseBottom, class: "fm-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: x, y: phaseBottom + 15, "text-anchor": "middle", class: "fm-small" }, formatNumber(value, value < 1 ? 2 : 1)));
      });
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapMag(0), x2: width - right, y2: mapMag(0), class: "fm-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapPhase(-180), x2: width - right, y2: mapPhase(-180), class: "fm-axis" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "magnitudeDb", mapFrequency, mapMag), class: "fm-magnitude" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "phase", mapFrequency, mapPhase), class: "fm-phase" }));
      if (result.gainCrossover) {
        var gcX = mapFrequency(result.gainCrossover.omega);
        svg.appendChild(svgElement(doc, "line", { x1: gcX, y1: magTop, x2: gcX, y2: phaseBottom, class: "fm-cursor" }));
      }
      svg.appendChild(svgElement(doc, "text", { x: left, y: magTop - 8, class: "fm-label" }, "蓝 |L| dB    金 ∠L    红 ωgc"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: magTop - 8, "text-anchor": "end", class: "fm-label" }, "Bode：log ω"));

      var nyTop = 390;
      var nyBottom = 540;
      var realValues = result.rows.map(function (row) { return row.loop.re; });
      var imagValues = result.rows.map(function (row) { return Math.abs(row.loop.im); });
      var realMin = Math.min(-1.35, Math.min.apply(Math, realValues) * 1.08);
      var realMax = Math.max(0.45, Math.max.apply(Math, realValues) * 1.08);
      var imagMax = Math.max(1, Math.max.apply(Math, imagValues) * 1.12);
      var mapReal = function (value) { return left + (value - realMin) / (realMax - realMin) * (width - left - right); };
      var mapImag = function (value) { return nyTop + (imagMax - value) / (2 * imagMax) * (nyBottom - nyTop); };
      svg.appendChild(svgElement(doc, "line", { x1: mapReal(0), y1: nyTop, x2: mapReal(0), y2: nyBottom, class: "fm-grid" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapImag(0), x2: width - right, y2: mapImag(0), class: "fm-axis" }));
      svg.appendChild(svgElement(doc, "path", { d: nyquistPath(result.rows, false, mapReal, mapImag), class: "fm-nyquist" }));
      svg.appendChild(svgElement(doc, "path", { d: nyquistPath(result.rows, true, mapReal, mapImag), class: "fm-nyquist-mirror" }));
      svg.appendChild(svgElement(doc, "circle", { cx: mapReal(-1), cy: mapImag(0), r: 4.5, class: "fm-critical" }));
      svg.appendChild(svgElement(doc, "text", { x: mapReal(-1) + 8, y: mapImag(0) - 8, class: "fm-label" }, "−1"));
      svg.appendChild(svgElement(doc, "text", { x: left, y: nyTop - 9, class: "fm-label" }, "Nyquist：蓝 +ω，金 −ω"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: nyBottom + 16, "text-anchor": "end", class: "fm-small" }, "Re L(jω)"));
    }

    function renderLedger(doc, hostNode, result) {
      clear(hostNode);
      var frequencies = [0.1, 1];
      if (result.gainCrossover) frequencies.push(result.gainCrossover.omega);
      if (result.phaseCrossover) frequencies.push(result.phaseCrossover.omega);
      frequencies.push(10);
      var unique = [];
      frequencies.forEach(function (value) {
        var clipped = Math.max(result.config.lowFrequency, Math.min(result.config.highFrequency, value));
        if (unique.every(function (existing) { return Math.abs(Math.log(existing / clipped)) > 1e-5; })) unique.push(clipped);
      });
      unique.sort(function (left, right) { return left - right; });
      var table = element(doc, "table", {}, [
        element(doc, "caption", { className: "fm-note", text: "Bode 数值 ledger：幅值相乘、相位相加" }),
        element(doc, "thead", {}, element(doc, "tr", {}, [
          element(doc, "th", { text: "ω" }),
          element(doc, "th", { text: "|P| dB" }),
          element(doc, "th", { text: "|C| dB" }),
          element(doc, "th", { text: "|L| dB" }),
          element(doc, "th", { text: "∠P" }),
          element(doc, "th", { text: "∠C" }),
          element(doc, "th", { text: "延迟" }),
          element(doc, "th", { text: "∠L" })
        ])),
        element(doc, "tbody")
      ]);
      var body = table.querySelector("tbody");
      unique.forEach(function (omega) {
        var row = evaluateAt(omega, result.config);
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "td", { text: formatNumber(row.omega, 3) }),
          element(doc, "td", { text: formatNumber(row.plantMagnitudeDb, 2) }),
          element(doc, "td", { text: formatNumber(row.controllerMagnitudeDb, 2) }),
          element(doc, "td", { text: formatNumber(row.magnitudeDb, 2) }),
          element(doc, "td", { text: formatNumber(row.plantPhase, 1) + "°" }),
          element(doc, "td", { text: formatNumber(row.controllerPhase, 1) + "°" }),
          element(doc, "td", { text: formatNumber(row.delayPhase, 1) + "°" }),
          element(doc, "td", { text: formatNumber(row.phase, 1) + "°" })
        ]));
      });
      hostNode.appendChild(element(doc, "div", { className: "fm-table-wrap" }, table));
    }

    function renderPredictions(doc, hostNode, state) {
      clear(hostNode);
      var specs = [
        { key: "delayMagnitude", prompt: "纯延迟改变幅值曲线吗？", choices: [["yes", "会改变"], ["no", "不会"]] },
        { key: "undefined", prompt: "没有增益交叉时 PM 是？", choices: [["zero", "0°"], ["undefined", "未定义"]] },
        { key: "nyquist", prompt: "只看是否包围 −1 就总能判稳定？", choices: [["yes", "总能"], ["conditional", "有前提"]] }
      ];
      specs.forEach(function (spec) {
        var field = element(doc, "fieldset", {}, element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "fm-choice-grid" });
        spec.choices.forEach(function (choice) {
          grid.appendChild(element(doc, "button", {
            type: "button",
            "aria-pressed": state.predictions[spec.key] === choice[0] ? "true" : "false",
            text: choice[1],
            onclick: function () {
              state.predictions[spec.key] = choice[0];
              state.revealed = false;
              state.feedback = "";
              renderPredictions(doc, hostNode, state);
            }
          }));
        });
        field.appendChild(grid);
        hostNode.appendChild(field);
      });
    }

    function mount(rootNode, api) {
      var doc = rootNode.ownerDocument || host || document;
      installStyles(doc);
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      var shell = element(doc, "div", { className: "fm-shell" });
      var predictionHost = element(doc, "div", { className: "fm-predictions" });
      var feedback = element(doc, "p", { className: "fm-feedback", "aria-live": "polite" });
      var reveal = element(doc, "button", { type: "button", className: "fm-primary", text: "揭晓预测并计算" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      var controlHost = element(doc, "div", { className: "fm-controls" });
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 560", role: "img", "aria-label": "Bode 与 Nyquist 频域设计图" });
      var metricsHost = element(doc, "div", { className: "fm-metrics" });
      var ledgerHost = element(doc, "div");
      var certificate = element(doc, "p", { className: "fm-certificate" });
      var refs = {};
      var controls = [
        { key: "gain", label: "比例增益 K", min: 0.05, max: 8, step: 0.05, digits: 2 },
        { key: "zero", label: "超前零点 z (rad/s)", min: 0.2, max: 1.5, step: 0.05, digits: 2 },
        { key: "pole", label: "超前极点 p (rad/s)", min: 2, max: 10, step: 0.1, digits: 1 },
        { key: "delay", label: "纯延迟 τ (s)", min: 0, max: 0.5, step: 0.005, digits: 3 }
      ];
      controls.forEach(function (item) {
        var input = element(doc, "input", { type: "range", min: item.min, max: item.max, step: item.step, value: state.config[item.key], "aria-label": item.label });
        var output = element(doc, "output", { text: formatNumber(state.config[item.key], item.digits) });
        var label = element(doc, "label", { text: item.label + "：" }, [output]);
        controlHost.appendChild(element(doc, "div", { className: "fm-control" }, [label, input]));
        refs[item.key] = { input: input, output: output, digits: item.digits };
      });
      shell.appendChild(element(doc, "h3", { text: "交互实验：Bode / Nyquist 裕度设计" }));
      shell.appendChild(element(doc, "p", { className: "fm-note", text: "蓝金曲线来自 L=CPe^(−τs)；相位按连续展开约定，PM/GM 缺交叉时显示未定义。" }));
      shell.appendChild(predictionHost);
      shell.appendChild(element(doc, "div", { className: "fm-actions" }, [reveal, reset]));
      shell.appendChild(feedback);
      var layout = element(doc, "div", { className: "fm-layout" }, [
        controlHost,
        element(doc, "div", { className: "fm-stage" }, [
          element(doc, "div", { className: "fm-stage-frame" }, svg),
          metricsHost,
          ledgerHost,
          certificate
        ])
      ]);
      shell.appendChild(layout);
      clear(rootNode);
      rootNode.appendChild(shell);

      function render() {
        var result = analyze(state.config);
        Object.keys(refs).forEach(function (key) {
          refs[key].input.value = String(result.config[key]);
          refs[key].output.textContent = formatNumber(result.config[key], refs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "fm-feedback" + (state.feedback.indexOf("请先") === 0 ? " fm-warn" : "");
        renderPredictions(doc, predictionHost, state);
        layout.hidden = !state.revealed;
        if (!state.revealed) {
          clear(metricsHost);
          ledgerHost.textContent = "";
          certificate.textContent = "提交预测后才显示交叉频率、裕度与 Nyquist 距离。";
          return;
        }
        drawPlot(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "ωgc", result.gainCrossover ? formatNumber(result.gainCrossover.omega, 3) : "未定义"));
        metricsHost.appendChild(metric(doc, "PM", result.phaseMargin === null ? "未定义" : formatNumber(result.phaseMargin, 2) + "°"));
        metricsHost.appendChild(metric(doc, "ωpc", result.phaseCrossover ? formatNumber(result.phaseCrossover.omega, 3) : "未定义"));
        metricsHost.appendChild(metric(doc, "GM", result.gainMarginDb === null ? "未定义" : formatNumber(result.gainMarginDb, 2) + " dB"));
        metricsHost.appendChild(metric(doc, "到 −1 最短距离", formatNumber(result.nyquistDistance, 3)));
        metricsHost.appendChild(metric(doc, "开环 RHP 极点 P", String(result.openLoopRhpPoles)));
        renderLedger(doc, ledgerHost, result);
        certificate.className = "fm-certificate" + ((result.phaseMargin !== null && result.phaseMargin < 0) ? " fm-blocked" : "");
        certificate.textContent =
          "裕度证书：当前使用负反馈 1+L=0，P(s) 与 C(s) 的有限极点均在左半平面，故此实验族的开环 RHP 极点数 P=0。PM/GM 仍只由所声明的交叉约定计算；Nyquist 的不包围简化只有在这些假设成立时才可使用。";
      }

      reveal.addEventListener("click", function () {
        var expected = { delayMagnitude: "no", undefined: "undefined", nyquist: "conditional" };
        var keys = Object.keys(expected);
        if (keys.some(function (key) { return state.predictions[key] === undefined; })) {
          state.feedback = "请先完成三个预测，再揭晓频域账本。";
          render();
          return;
        }
        var correct = keys.filter(function (key) { return state.predictions[key] === expected[key]; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + keys.length + " 命中。拖动 τ 观察相位侵蚀，再把 K 降到没有交叉的边界。";
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, "频域裕度实验已重置。");
      });
      controls.forEach(function (item) {
        refs[item.key].input.addEventListener("input", function () {
          var next = Object.assign({}, state.config);
          next[item.key] = Number(refs[item.key].input.value);
          state.config = normalizeConfig(next);
          render();
        });
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var base = evaluateAt(2, DEFAULTS);
      var noDelay = evaluateAt(2, Object.assign({}, DEFAULTS, { delay: 0 }));
      check(Math.abs(magnitude(base.loop) - magnitude(noDelay.loop)) < 1e-10, "pure delay preserves magnitude");
      check(Math.abs((base.phase - noDelay.phase) + 2 * DEFAULTS.delay * 180 / Math.PI) < 1e-8, "pure delay phase erosion");
      var result = analyze(DEFAULTS);
      check(result.gainCrossover !== null, "default has gain crossover");
      check(result.phaseMargin !== null && Number.isFinite(result.phaseMargin), "default PM is defined");
      check(result.phaseCrossover !== null, "positive delay creates phase crossover in scan");
      check(result.gainMarginDb !== null, "default GM is defined");
      var noCross = analyze({ gain: 0.05, delay: 0, zero: 0.5, pole: 4 });
      check(noCross.gainCrossover === null && noCross.phaseMargin === null, "missing gain crossover makes PM undefined");
      var noPhaseCross = analyze({ gain: 2.6, delay: 0, zero: 0.5, pole: 4 });
      check(noPhaseCross.phaseCrossover === null && noPhaseCross.gainMarginDb === null, "zero-delay asymptote leaves finite GM undefined");
      var rejected = false;
      try { normalizeConfig({ pole: 0.3 }); } catch (error) { rejected = true; }
      check(rejected, "lead ordering boundary");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "integer formatter preserves trailing zeroes");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      complex: complex,
      multiply: multiply,
      magnitude: magnitude,
      normalizeConfig: normalizeConfig,
      evaluateAt: evaluateAt,
      frequencyGrid: frequencyGrid,
      firstCrossing: firstCrossing,
      analyze: analyze,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
