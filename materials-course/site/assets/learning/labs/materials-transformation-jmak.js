(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-transformation-jmak", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "materials-transformation-jmak self-test: PASS (" +
          report.checks +
          " checks)"
      );
    } catch (error) {
      console.error("materials-transformation-jmak self-test: FAIL\n" + error.stack);
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

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "materials-transformation-jmak-styles";
    var GAS_CONSTANT_J_PER_MOL_K = 8.314462618;
    var ACTIVATION_ENERGY_J_PER_MOL = 140000;
    var T_MIN_C = 450;
    var T_MAX_C = 720;
    var T_REF_C = 600;
    var EPS = 1e-10;
    var RAW_MAX = null;
    var DEFAULTS = {
      temperatureC: 600,
      exponentN: 2.0,
      holdTimeS: 90,
      incubationS: 10,
      characteristicHalfTimeS: 60
    };
    var STYLE_TEXT = [
      '[data-learning-lab="materials-transformation-jmak"]{--mt-blue:var(--cl-blue,#315f9d);--mt-gold:var(--cl-gold,#9b6a12);--mt-green:var(--cl-green,#39734d);--mt-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="materials-transformation-jmak"] *{box-sizing:border-box}[data-learning-lab="materials-transformation-jmak"] [hidden]{display:none!important}',
      '[data-learning-lab="materials-transformation-jmak"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-transformation-jmak"] p{margin:8px 0}[data-learning-lab="materials-transformation-jmak"] .mt-note,[data-learning-lab="materials-transformation-jmak"] .mt-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="materials-transformation-jmak"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-transformation-jmak"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="materials-transformation-jmak"] .mt-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-transformation-jmak"] button,[data-learning-lab="materials-transformation-jmak"] input{font:inherit}',
      '[data-learning-lab="materials-transformation-jmak"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-transformation-jmak"] button:hover{border-color:var(--mt-blue)}[data-learning-lab="materials-transformation-jmak"] button[aria-pressed="true"],[data-learning-lab="materials-transformation-jmak"] .mt-primary{border-color:var(--mt-blue);background:var(--mt-blue);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="materials-transformation-jmak"] button:focus-visible,[data-learning-lab="materials-transformation-jmak"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-transformation-jmak"] .mt-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-transformation-jmak"] .mt-actions>*{flex:1 1 170px}[data-learning-lab="materials-transformation-jmak"] .mt-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-transformation-jmak"] .mt-pass{color:var(--mt-green)}[data-learning-lab="materials-transformation-jmak"] .mt-warn{color:var(--mt-red)}',
      '[data-learning-lab="materials-transformation-jmak"] .mt-layout{display:grid;grid-template-columns:minmax(215px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="materials-transformation-jmak"] .mt-controls,[data-learning-lab="materials-transformation-jmak"] .mt-stage{min-width:0}[data-learning-lab="materials-transformation-jmak"] .mt-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-transformation-jmak"] .mt-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-transformation-jmak"] .mt-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="materials-transformation-jmak"] .mt-control output{color:var(--mt-blue);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="materials-transformation-jmak"] input[type="range"]{display:block;width:100%;min-height:44px;accent-color:var(--mt-blue)}[data-learning-lab="materials-transformation-jmak"] .mt-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="materials-transformation-jmak"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="materials-transformation-jmak"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="materials-transformation-jmak"] .mt-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="materials-transformation-jmak"] .mt-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.8}[data-learning-lab="materials-transformation-jmak"] .mt-start{fill:none;stroke:var(--mt-blue);stroke-width:2.4}[data-learning-lab="materials-transformation-jmak"] .mt-half{fill:none;stroke:var(--mt-gold);stroke-width:2.4}[data-learning-lab="materials-transformation-jmak"] .mt-finish{fill:none;stroke:var(--mt-green);stroke-width:2.4}[data-learning-lab="materials-transformation-jmak"] .mt-current{fill:var(--mt-red);stroke:var(--bg,#fff);stroke-width:2}[data-learning-lab="materials-transformation-jmak"] .mt-label{font-size:11px}[data-learning-lab="materials-transformation-jmak"] .mt-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="materials-transformation-jmak"] .mt-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:12px}[data-learning-lab="materials-transformation-jmak"] .mt-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="materials-transformation-jmak"] .mt-metric:nth-child(3n+1){border-color:var(--mt-blue)}[data-learning-lab="materials-transformation-jmak"] .mt-metric:nth-child(3n+2){border-color:var(--mt-gold)}[data-learning-lab="materials-transformation-jmak"] .mt-metric:nth-child(3n){border-color:var(--mt-green)}[data-learning-lab="materials-transformation-jmak"] .mt-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="materials-transformation-jmak"] .mt-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="materials-transformation-jmak"] .mt-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}[data-learning-lab="materials-transformation-jmak"] table{width:100%;min-width:550px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-transformation-jmak"] th,[data-learning-lab="materials-transformation-jmak"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-transformation-jmak"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-transformation-jmak"] .mt-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mt-gold);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="materials-transformation-jmak"] .mt-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="materials-transformation-jmak"] .mt-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="materials-transformation-jmak"] .mt-stage-frame{padding:4px}[data-learning-lab="materials-transformation-jmak"] table{font-size:11px}[data-learning-lab="materials-transformation-jmak"] th,[data-learning-lab="materials-transformation-jmak"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-transformation-jmak"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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

    function format(value, digits) {
      if (value === Infinity) return "∞";
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
        return value.toExponential(Math.min(places, 5));
      }
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function copyDefaults() {
      var copy = {};
      Object.keys(DEFAULTS).forEach(function (key) { copy[key] = DEFAULTS[key]; });
      return copy;
    }

    function normalizeConfig(input) {
      var source = input || {};
      var temperatureC = finite(source.temperatureC === undefined ? DEFAULTS.temperatureC : source.temperatureC, "temperature");
      var exponentN = finite(source.exponentN === undefined ? DEFAULTS.exponentN : source.exponentN, "Avrami exponent");
      var holdTimeS = finite(source.holdTimeS === undefined ? DEFAULTS.holdTimeS : source.holdTimeS, "hold time");
      var incubationS = finite(source.incubationS === undefined ? DEFAULTS.incubationS : source.incubationS, "incubation");
      var characteristicHalfTimeS = finite(source.characteristicHalfTimeS === undefined ? DEFAULTS.characteristicHalfTimeS : source.characteristicHalfTimeS, "characteristic half-time");
      if (temperatureC < T_MIN_C || temperatureC > T_MAX_C) throw new RangeError("temperature must be in [" + T_MIN_C + ", " + T_MAX_C + "] °C");
      if (exponentN < 1 || exponentN > 4) throw new RangeError("n must be in [1, 4]");
      if (holdTimeS < 0 || holdTimeS > 1000) throw new RangeError("hold time must be in [0, 1000] s");
      if (incubationS < 0 || incubationS > 300) throw new RangeError("incubation must be in [0, 300] s");
      if (characteristicHalfTimeS <= 0 || characteristicHalfTimeS > 1000) throw new RangeError("characteristic half-time must be positive");
      return { temperatureC: temperatureC, exponentN: exponentN, holdTimeS: holdTimeS, incubationS: incubationS, characteristicHalfTimeS: characteristicHalfTimeS };
    }

    function rawTemperatureShape(temperatureC) {
      var temperature = finite(temperatureC, "temperature");
      if (temperature < T_MIN_C || temperature > T_MAX_C) throw new RangeError("temperature outside TTT teaching window");
      var temperatureK = temperature + 273.15;
      var referenceK = T_REF_C + 273.15;
      var undercoolingDrive = (T_MAX_C - temperature) / (T_MAX_C - T_MIN_C);
      var mobilityRatio = Math.exp(-ACTIVATION_ENERGY_J_PER_MOL / GAS_CONSTANT_J_PER_MOL_K * (1 / temperatureK - 1 / referenceK));
      return Math.max(0, undercoolingDrive) * mobilityRatio;
    }

    function maximumRawTemperatureShape() {
      if (RAW_MAX !== null) return RAW_MAX;
      var maximum = 0;
      for (var i = 0; i <= 270; i += 1) maximum = Math.max(maximum, rawTemperatureShape(T_MIN_C + i));
      RAW_MAX = maximum;
      return RAW_MAX;
    }

    function temperatureRateShape(temperatureC) {
      return rawTemperatureShape(temperatureC) / maximumRawTemperatureShape();
    }

    function noseTemperatureC() {
      var bestTemperature = T_MIN_C;
      var bestShape = -Infinity;
      for (var i = 0; i <= 270; i += 1) {
        var temperature = T_MIN_C + i;
        var shape = temperatureRateShape(temperature);
        if (shape > bestShape) { bestShape = shape; bestTemperature = temperature; }
      }
      return bestTemperature;
    }

    function rateConstantPerSecondPower(temperatureC, exponentN, characteristicHalfTimeS) {
      var n = finite(exponentN, "Avrami exponent");
      var halfTime = finite(characteristicHalfTimeS, "characteristic half-time");
      if (n < 1 || n > 4 || halfTime <= 0) throw new RangeError("n/characteristic half-time outside boundary");
      return Math.log(2) * temperatureRateShape(temperatureC) / Math.pow(halfTime, n);
    }

    function jmakFraction(timeS, incubationS, rateConstant, exponentN) {
      var time = finite(timeS, "time");
      var incubation = finite(incubationS, "incubation");
      var k = finite(rateConstant, "k");
      var n = finite(exponentN, "n");
      if (time < 0 || incubation < 0 || k < 0 || n <= 0) throw new RangeError("JMAK inputs outside physical boundary");
      if (time <= incubation || k === 0) return 0;
      var exponent = k * Math.pow(time - incubation, n);
      return -Math.expm1(-exponent);
    }

    function jmakRate(timeS, incubationS, rateConstant, exponentN) {
      var time = finite(timeS, "time");
      var incubation = finite(incubationS, "incubation");
      var k = finite(rateConstant, "k");
      var n = finite(exponentN, "n");
      if (time < 0 || incubation < 0 || k < 0 || n <= 0) throw new RangeError("JMAK rate inputs outside physical boundary");
      if (time <= incubation || k === 0) return 0;
      var age = time - incubation;
      var exponent = k * Math.pow(age, n);
      return n * k * Math.pow(age, n - 1) * Math.exp(-exponent);
    }

    function timeToFraction(fraction, incubationS, rateConstant, exponentN) {
      var fractionValue = finite(fraction, "fraction");
      var incubation = finite(incubationS, "incubation");
      var k = finite(rateConstant, "k");
      var n = finite(exponentN, "n");
      if (fractionValue < 0 || fractionValue >= 1 || incubation < 0 || k < 0 || n <= 0) throw new RangeError("fraction/time inputs outside boundary");
      if (fractionValue === 0) return incubation;
      if (k === 0) return Infinity;
      return incubation + Math.pow(-Math.log1p(-fractionValue) / k, 1 / n);
    }

    function tttCurves(exponentN, incubationS, characteristicHalfTimeS) {
      var n = finite(exponentN, "n");
      var incubation = finite(incubationS, "incubation");
      var halfTime = finite(characteristicHalfTimeS, "characteristic half-time");
      if (n < 1 || n > 4 || incubation < 0 || halfTime <= 0) throw new RangeError("TTT curve inputs outside boundary");
      var curves = { start: [], half: [], finish: [] };
      for (var i = 0; i <= 66; i += 1) {
        var temperature = T_MIN_C + 2 + i * 4;
        var k = rateConstantPerSecondPower(temperature, n, halfTime);
        curves.start.push({ temperatureC: temperature, timeS: timeToFraction(0.01, incubation, k, n) });
        curves.half.push({ temperatureC: temperature, timeS: timeToFraction(0.50, incubation, k, n) });
        curves.finish.push({ temperatureC: temperature, timeS: timeToFraction(0.99, incubation, k, n) });
      }
      return curves;
    }

    function evaluate(input) {
      var config = normalizeConfig(input);
      var rateShape = temperatureRateShape(config.temperatureC);
      var k = rateConstantPerSecondPower(config.temperatureC, config.exponentN, config.characteristicHalfTimeS);
      var fraction = jmakFraction(config.holdTimeS, config.incubationS, k, config.exponentN);
      var halfTimeS = timeToFraction(0.5, config.incubationS, k, config.exponentN);
      var finishTimeS = timeToFraction(0.99, config.incubationS, k, config.exponentN);
      return {
        config: config,
        rateShape: rateShape,
        rateConstant: k,
        fraction: fraction,
        ratePerS: jmakRate(config.holdTimeS, config.incubationS, k, config.exponentN),
        halfTimeS: halfTimeS,
        finishTimeS: finishTimeS,
        noseTemperatureC: noseTemperatureC(),
        curves: tttCurves(config.exponentN, config.incubationS, config.characteristicHalfTimeS)
      };
    }

    function element(doc, tag, attributes, children) {
      var node = doc.createElement(tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
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
          node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function installStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function announce(api, rootNode, message) {
      if (api && typeof api.announce === "function") api.announce(rootNode, message);
    }

    function drawCurve(doc, svg, points, mapX, mapY, className) {
      var path = points.map(function (point, index) {
        return (index ? "L" : "M") + mapX(point.timeS).toFixed(2) + " " + mapY(point.temperatureC).toFixed(2);
      }).join(" ");
      svg.appendChild(svgElement(doc, "path", { d: path, class: className }));
    }

    function renderSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 410;
      var left = 58;
      var right = 18;
      var top = 34;
      var bottom = 52;
      var logMin = 0;
      var logMax = 5;
      var mapX = function (timeS) { return left + (Math.log10(Math.max(1, timeS)) - logMin) / (logMax - logMin) * (width - left - right); };
      var mapY = function (temperatureC) { return top + (T_MAX_C - temperatureC) / (T_MAX_C - T_MIN_C) * (height - top - bottom); };
      svg.appendChild(svgElement(doc, "title", {}, "JMAK 等温转变量与 TTT 风格曲线"));
      svg.appendChild(svgElement(doc, "desc", {}, "蓝、金、绿曲线分别表示百分之一、百分之五十和百分之九十九转变的等温时间；红点是当前温度和当前保温时间。"));
      [0, 1, 2, 3, 4, 5].forEach(function (value) {
        var x = left + value / (logMax - logMin) * (width - left - right);
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: top, x2: x, y2: height - bottom, class: "mt-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: x, y: height - 28, "text-anchor": "middle", class: "mt-small" }, "10^" + value + " s"));
      });
      [450, 500, 550, 600, 650, 700].forEach(function (value) {
        var y = mapY(value);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: "mt-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "text-anchor": "end", class: "mt-small" }, String(value)));
      });
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: height - bottom, x2: width - right, y2: height - bottom, class: "mt-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, class: "mt-axis" }));
      drawCurve(doc, svg, result.curves.start, mapX, mapY, "mt-start");
      drawCurve(doc, svg, result.curves.half, mapX, mapY, "mt-half");
      drawCurve(doc, svg, result.curves.finish, mapX, mapY, "mt-finish");
      svg.appendChild(svgElement(doc, "circle", { cx: mapX(result.config.holdTimeS), cy: mapY(result.config.temperatureC), r: 6, class: "mt-current" }));
      svg.appendChild(svgElement(doc, "text", { x: left, y: 18, class: "mt-label" }, "TTT：等温保持温度 / °C"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 8, "text-anchor": "end", class: "mt-label" }, "log₁₀(时间 / s)"));
      svg.appendChild(svgElement(doc, "text", { x: left + 8, y: top + 16, class: "mt-small" }, "start / 1%"));
      svg.appendChild(svgElement(doc, "text", { x: left + 8, y: top + 31, class: "mt-small" }, "half / 50%"));
      svg.appendChild(svgElement(doc, "text", { x: left + 8, y: top + 46, class: "mt-small" }, "finish / 99%"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mt-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
    }

    function renderTable(doc, hostNode, result) {
      var rows = [
        ["T", format(result.config.temperatureC, 1), "°C；当前等温保持"],
        ["n", format(result.config.exponentN, 1), "无量纲时间指数；不是唯一显微机制"],
        ["tᵢ", format(result.config.incubationS, 2), "s；开始转变前的教学占位"],
        ["k(T)", format(result.rateConstant, 5), "s⁻ⁿ；含 TTT 风格速率形状"],
        ["f(t)", format(result.fraction, 4), "转变分数；JMAK"],
        ["df/dt", format(result.ratePerS, 5), "s⁻¹；当前转变速率"],
        ["t₅₀", format(result.halfTimeS, 2), "s；含 incubation"],
        ["t₉₉", format(result.finishTimeS, 2), "s；99% 完成代理"]
      ];
      var body = element(doc, "tbody");
      rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "JMAK / TTT 等温动力学透明账本" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "数值" }), element(doc, "th", { text: "单位 / 解释" })])]),
        body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "incubation",
          prompt: "若当前保温时间 t ≤ tᵢ，JMAK 转变分数应怎样？",
          expected: "zero",
          choices: [{ value: "zero", label: "0：尚未开始" }, { value: "linear", label: "按 t 线性增长" }, { value: "one", label: "立刻为 1" }]
        },
        {
          key: "half",
          prompt: "f = 1 − exp[−k(t−tᵢ)ⁿ] 的半转变时间由什么决定？",
          expected: "formula",
          choices: [{ value: "formula", label: "tᵢ + (ln2/k)^(1/n)" }, { value: "temperature", label: "只看温度，不看 k" }, { value: "n", label: "只等于 n 秒" }]
        },
        {
          key: "ttt",
          prompt: "TTT 图能否直接当作任意连续冷却路径的 CCT 图？",
          expected: "no",
          choices: [{ value: "no", label: "不能：TTT 等温，CCT/叠加需另校准" }, { value: "yes", label: "可以直接套用" }, { value: "always", label: "只要 n > 1 就可以" }]
        }
      ];
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      installStyles(doc);
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      var shell = element(doc, "div", { className: "mt-lab" });
      shell.appendChild(element(doc, "h3", { text: "相变实验：JMAK 转变分数、半时间、速率与 TTT 风格温度依赖" }));
      shell.appendChild(element(doc, "p", { className: "mt-note", text: "先判断 incubation、半时间公式和 TTT/CCT 边界；揭示后再拖动温度、n、保温时间和 tᵢ，观察同一模型如何给出工程账本。" }));
      var predictionHost = element(doc, "div");
      var predictionGroups = [];
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "mt-choice-grid" });
        var group = { key: spec.key, buttons: [] };
        spec.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
          button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); });
          group.buttons.push({ node: button, value: choice.value, label: choice.label }); grid.appendChild(button);
        });
        predictionGroups.push(group); fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
      });
      var actions = element(doc, "div", { className: "mt-actions" });
      var reveal = element(doc, "button", { type: "button", className: "mt-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal); actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "mt-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controls = element(doc, "div", { className: "mt-controls" });
      var inputs = {};
      function rangeControl(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
        var output = element(doc, "output", { text: format(state.config[key], digits) });
        inputs[key] = { input: input, output: output, digits: digits };
        controls.appendChild(element(doc, "div", { className: "mt-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
      }
      rangeControl("temperatureC", "等温温度 / °C", String(T_MIN_C), String(T_MAX_C), "1", 0);
      rangeControl("exponentN", "Avrami 指数 n", "1", "4", "0.1", 1);
      rangeControl("holdTimeS", "当前保温时间 / s", "0", "300", "1", 0);
      rangeControl("incubationS", "incubation tᵢ / s", "0", "60", "1", 0);
      rangeControl("characteristicHalfTimeS", "鼻尖特征半时间 / s", "20", "180", "1", 0);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 410", role: "img", "aria-label": "TTT 风格曲线与当前点" });
      var stage = element(doc, "div", { className: "mt-stage" }, [element(doc, "div", { className: "mt-stage-frame" }, [svg])]);
      var metricsHost = element(doc, "div", { className: "mt-metrics" });
      var tableHost = element(doc, "div", { className: "mt-table-wrap" });
      var certificate = element(doc, "p", { className: "mt-certificate" });
      stage.appendChild(metricsHost); stage.appendChild(tableHost); stage.appendChild(certificate);
      resultShell.appendChild(element(doc, "div", { className: "mt-layout" }, [controls, stage]));
      shell.appendChild(predictionHost); shell.appendChild(actions); shell.appendChild(feedback); shell.appendChild(resultShell);
      clear(rootNode); rootNode.appendChild(shell);
      Object.keys(inputs).forEach(function (key) { inputs[key].input.addEventListener("input", function () { state.config[key] = Number(inputs[key].input.value); state.feedback = ""; render(); }); });
      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项相变预测；揭示后才显示 JMAK 账本和 TTT 图。"; render(); return; }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。调温度看 TTT 鼻尖，调 n 看时间曲线，但不要把 n 当作唯一显微证据。"; render(); announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () { state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" }; render(); announce(api, rootNode, "相变预测和 JMAK 账本已重置。"); });

      function render() {
        var result = evaluate(state.config);
        Object.keys(inputs).forEach(function (key) { inputs[key].input.value = String(state.config[key]); inputs[key].output.textContent = format(state.config[key], inputs[key].digits); });
        predictionGroups.forEach(function (group) {
          var spec = questionSpecs().filter(function (item) { return item.key === group.key; })[0];
          group.buttons.forEach(function (button) {
            var selected = state.predictions[group.key] === button.value;
            button.node.setAttribute("aria-pressed", selected ? "true" : "false");
            button.node.textContent = state.revealed && button.value === spec.expected ? "✓ " + button.label : button.label;
            button.node.className = state.revealed && button.value === spec.expected ? "mt-pass" : state.revealed && selected ? "mt-warn" : "";
          });
        });
        feedback.textContent = state.feedback;
        feedback.className = "mt-feedback" + (state.feedback.indexOf("请先") === 0 ? " mt-warn" : "");
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        renderSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "当前 f(t)", format(result.fraction, 4)));
        metricsHost.appendChild(metric(doc, "当前 df/dt", format(result.ratePerS, 5) + " s⁻¹"));
        metricsHost.appendChild(metric(doc, "t₅₀", format(result.halfTimeS, 2) + " s"));
        metricsHost.appendChild(metric(doc, "TTT 鼻尖代理", format(result.noseTemperatureC, 0) + " °C"));
        renderTable(doc, tableHost, result);
        certificate.textContent = "模型边界：这里的 k(T) 是把形核驱动力与迁移率相乘后归一化的教学代理，JMAK 参数固定且只适用于等温保持；连续冷却要用 CCT 或经过校准的 additivity/分步积分，不能直接沿 TTT 曲线读秒。拟合出的 n 是时间幂律摘要，不是唯一显微机制。";
      }
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var k = rateConstantPerSecondPower(DEFAULTS.temperatureC, DEFAULTS.exponentN, DEFAULTS.characteristicHalfTimeS);
      check(format(1350, 0) === "1350" && format(60, 0) === "60", "zero-decimal formatter preserves trailing integer zeros");
      check(jmakFraction(5, 10, k, 2) === 0, "incubation boundary keeps fraction zero");
      var half = timeToFraction(0.5, 10, k, 2);
      check(near(jmakFraction(half, 10, k, 2), 0.5, 1e-10), "half-time inversion");
      var nose = noseTemperatureC();
      var noseRate = rateConstantPerSecondPower(nose, DEFAULTS.exponentN, DEFAULTS.characteristicHalfTimeS);
      check(near(timeToFraction(0.5, 0, noseRate, DEFAULTS.exponentN), DEFAULTS.characteristicHalfTimeS, 1e-10), "normalized nose half-time equals characteristic t50");
      check(jmakFraction(120, 10, k, 2) > jmakFraction(30, 10, k, 2), "fraction is monotone in hold time");
      check(jmakRate(90, 10, k, 2) >= 0, "rate is non-negative");
      var low = temperatureRateShape(T_MIN_C + 2);
      var nose = temperatureRateShape(noseTemperatureC());
      var high = temperatureRateShape(T_MAX_C - 2);
      check(nose > low && nose > high, "temperature-rate proxy has an interior TTT nose");
      var curves = tttCurves(2, 10, 60);
      var nosePoint = curves.half.reduce(function (best, point) { return point.timeS < best.timeS ? point : best; }, curves.half[0]);
      check(nosePoint.temperatureC > T_MIN_C && nosePoint.temperatureC < T_MAX_C, "half-time TTT minimum is interior");
      check(curves.start.length === curves.half.length && curves.half.length === curves.finish.length, "TTT curves share temperature grid");
      var threw = false;
      try { jmakFraction(1, 0, -1, 2); } catch (error) { threw = true; }
      check(threw, "negative JMAK rate rejected");
      threw = false;
      try { timeToFraction(1, 0, k, 2); } catch (error2) { threw = true; }
      check(threw, "fraction one is an infinite-time boundary and rejected");
      check(jmakFraction(100, 10, 0, 2) === 0 && timeToFraction(0, 10, 0, 2) === 10, "zero-rate boundary");
      return { checks: checks };
    }

    return {
      DEFAULTS: copyDefaults(),
      rawTemperatureShape: rawTemperatureShape,
      temperatureRateShape: temperatureRateShape,
      noseTemperatureC: noseTemperatureC,
      rateConstantPerSecondPower: rateConstantPerSecondPower,
      jmakFraction: jmakFraction,
      jmakRate: jmakRate,
      timeToFraction: timeToFraction,
      tttCurves: tttCurves,
      evaluate: evaluate,
      format: format,
      mount: mount,
      selfTest: selfTest
    };
  }
);
