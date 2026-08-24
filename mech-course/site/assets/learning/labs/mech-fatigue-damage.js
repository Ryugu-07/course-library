(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-fatigue-damage", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-fatigue-damage self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-fatigue-damage self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-fatigue-damage";
    var STYLE_ID = "cl-mech-fatigue-damage-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var INSTANCE = 0;
    var DEFAULTS = {
      sigmaF: 1000e6,
      b: -0.095,
      Su: 600e6,
      Sy: 420e6,
      blocks: [
        { amplitude: 210e6, mean: 40e6, cycles: 200000 },
        { amplitude: 160e6, mean: -20e6, cycles: 500000 },
        { amplitude: 250e6, mean: 80e6, cycles: 80000 },
        { amplitude: 130e6, mean: 0, cycles: 1000000 }
      ]
    };

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
    }

    function finite(value, label) {
      var number = Number(value);
      if (!isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function positive(value, label) {
      var number = finite(value, label);
      if (!(number > 0)) throw new RangeError(label + " must be positive");
      return number;
    }

    function bounded(value, label, low, high) {
      var number = finite(value, label);
      if (number < low || number > high) throw new RangeError(label + " must be in [" + low + ", " + high + "]");
      return number;
    }

    function normalizeConfig(input) {
      var source = input || {};
      var sigmaF = bounded(source.sigmaF === undefined ? DEFAULTS.sigmaF : source.sigmaF, "sigmaF", 100e6, 5000e6);
      var Su = bounded(source.Su === undefined ? DEFAULTS.Su : source.Su, "Su", 100e6, 3000e6);
      var Sy = bounded(source.Sy === undefined ? DEFAULTS.Sy : source.Sy, "Sy", 50e6, 2500e6);
      var blockSource = source.blocks || DEFAULTS.blocks;
      if (!Array.isArray(blockSource) || blockSource.length !== 4) throw new RangeError("blocks must contain four cycle blocks");
      return {
        sigmaF: sigmaF,
        b: bounded(source.b === undefined ? DEFAULTS.b : source.b, "Basquin exponent b", -0.3, -0.01),
        Su: Su,
        Sy: Sy,
        blocks: blockSource.map(function (block, index) {
          return {
            amplitude: bounded(block.amplitude, "block " + (index + 1) + " amplitude", 1e6, 2000e6),
            mean: bounded(block.mean, "block " + (index + 1) + " mean", -0.9 * Su, 1.2 * Su),
            cycles: bounded(block.cycles, "block " + (index + 1) + " cycles", 1, 1e10)
          };
        })
      };
    }

    function correctedAmplitude(amplitude, mean, limit, label) {
      var denominator = 1 - mean / limit;
      if (!(denominator > 0)) throw new RangeError(label + " mean-stress denominator is nonpositive");
      return amplitude / denominator;
    }

    function basquinLife(amplitude, config) {
      var ratio = amplitude / config.sigmaF;
      if (!(ratio > 0)) return Infinity;
      return 0.5 * Math.pow(ratio, 1 / config.b);
    }

    function analyzeBlock(block, config, index) {
      var goodmanAmplitude = correctedAmplitude(block.amplitude, block.mean, config.Su, "Goodman");
      var soderbergAmplitude = correctedAmplitude(block.amplitude, block.mean, config.Sy, "Soderberg");
      var goodmanLife = basquinLife(goodmanAmplitude, config);
      var soderbergLife = basquinLife(soderbergAmplitude, config);
      return {
        index: index + 1,
        amplitude: block.amplitude,
        mean: block.mean,
        cycles: block.cycles,
        goodmanAmplitude: goodmanAmplitude,
        soderbergAmplitude: soderbergAmplitude,
        goodmanLife: goodmanLife,
        soderbergLife: soderbergLife,
        goodmanDamage: block.cycles / goodmanLife,
        soderbergDamage: block.cycles / soderbergLife,
        goodmanStressLifeValid: goodmanLife >= 0.5,
        soderbergStressLifeValid: soderbergLife >= 0.5
      };
    }

    function solveFatigue(input) {
      var config = normalizeConfig(input);
      var rows = config.blocks.map(function (block, index) { return analyzeBlock(block, config, index); });
      var goodmanDamage = rows.reduce(function (sum, row) { return sum + row.goodmanDamage; }, 0);
      var soderbergDamage = rows.reduce(function (sum, row) { return sum + row.soderbergDamage; }, 0);
      var reversedGoodmanDamage = rows.slice().reverse().reduce(function (sum, row) { return sum + row.goodmanDamage; }, 0);
      var reversedSoderbergDamage = rows.slice().reverse().reduce(function (sum, row) { return sum + row.soderbergDamage; }, 0);
      var lowCycleGoodman = rows.some(function (row) { return row.goodmanLife < 1e4; });
      var lowCycleSoderberg = rows.some(function (row) { return row.soderbergLife < 1e4; });
      return {
        config: config,
        rows: rows,
        goodmanDamage: goodmanDamage,
        soderbergDamage: soderbergDamage,
        reversedGoodmanDamage: reversedGoodmanDamage,
        reversedSoderbergDamage: reversedSoderbergDamage,
        lowCycleGoodman: lowCycleGoodman,
        lowCycleSoderberg: lowCycleSoderberg,
        stressLifeValid: rows.every(function (row) { return row.goodmanStressLifeValid && row.soderbergStressLifeValid; }),
        screenPassGoodman: goodmanDamage < 1,
        screenPassSoderberg: soderbergDamage < 1
      };
    }

    function formatNumber(value, digits) {
      if (!isFinite(value)) return "∞";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 100000)) {
        return value.toExponential(Math.min(places, 5));
      }
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null) return;
        if (key === "text") node.textContent = String(value);
        else if (key === "className") node.setAttribute("class", String(value));
        else if (key === "htmlFor") node.setAttribute("for", String(value));
        else node.setAttribute(key, String(value));
      });
      (children || []).forEach(function (child) {
        if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function svgElement(doc, tag, attrs) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) {
        if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
      });
      return node;
    }

    function svgText(doc, parent, text, x, y, className) {
      var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mfd-label" });
      node.textContent = text;
      parent.appendChild(node);
    }

    function log10(value) {
      return Math.log(value) / Math.LN10;
    }

    function chartX(value, left, right) {
      var logValue = log10(Math.max(0.5, value));
      return left + (right - left) * Math.max(0, Math.min(1, logValue / 9));
    }

    function chartY(value, top, bottom, maximum) {
      return bottom - Math.max(0, Math.min(maximum, value)) / maximum * (bottom - top);
    }

    function drawFatigue(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 410;
      var left = 62;
      var right = 688;
      var top = 32;
      var chartBottom = 218;
      var yMaximum = Math.max(result.config.sigmaF, result.config.Su, result.config.Sy);
      result.rows.forEach(function (row) {
        yMaximum = Math.max(yMaximum, row.goodmanAmplitude, row.soderbergAmplitude);
      });
      yMaximum *= 1.12;
      var baseline = chartBottom;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Basquin S-N 曲线、Goodman 与 Soderberg 等效应力点和 Miner 损伤条");
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: baseline, "class": "mfd-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: baseline, x2: right, y2: baseline, "class": "mfd-axis" }));
      var curve = [];
      for (var index = 0; index <= 120; index += 1) {
        var cycles = Math.pow(10, 9 * index / 120);
        curve.push((index ? "L" : "M") + chartX(cycles, left, right).toFixed(2) + " " + chartY(result.config.sigmaF * Math.pow(2 * cycles, result.config.b), top, baseline, yMaximum).toFixed(2));
      }
      svg.appendChild(svgElement(doc, "path", { d: curve.join(" "), "class": "mfd-basquin" }));
      result.rows.forEach(function (row, rowIndex) {
        var goodX = chartX(row.goodmanLife, left, right);
        var goodY = chartY(row.goodmanAmplitude, top, baseline, yMaximum);
        var sodX = chartX(row.soderbergLife, left, right);
        var sodY = chartY(row.soderbergAmplitude, top, baseline, yMaximum);
        svg.appendChild(svgElement(doc, "circle", { cx: goodX, cy: goodY, r: 5, "class": "mfd-goodman-point" }));
        svg.appendChild(svgElement(doc, "rect", { x: sodX - 4, y: sodY - 4, width: 8, height: 8, "class": "mfd-soderberg-point" }));
        svgText(doc, svg, String(rowIndex + 1), goodX + 7, goodY - 5, "mfd-point-label");
      });
      svgText(doc, svg, "Basquin 曲线", 72, 48, "mfd-basquin-label");
      svgText(doc, svg, "● Goodman", 180, 48, "mfd-goodman-label");
      svgText(doc, svg, "■ Soderberg", 280, 48, "mfd-soderberg-label");
      svgText(doc, svg, "Nf（cycles，log）", 580, baseline + 27, "mfd-muted");
      svgText(doc, svg, formatNumber(yMaximum / 1e6, 0) + " MPa", 5, top + 5, "mfd-muted");
      svgText(doc, svg, "0", left - 5, baseline + 17, "mfd-muted");
      svgText(doc, svg, "10³", chartX(1e3, left, right) - 10, baseline + 17, "mfd-muted");
      svgText(doc, svg, "10⁶", chartX(1e6, left, right) - 10, baseline + 17, "mfd-muted");
      svgText(doc, svg, "10⁹", chartX(1e9, left, right) - 10, baseline + 17, "mfd-muted");

      var damageTop = 282;
      var damageBottom = 368;
      var damageMaximum = Math.max(1, result.goodmanDamage, result.soderbergDamage);
      damageMaximum *= 1.12;
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: damageBottom, x2: right, y2: damageBottom, "class": "mfd-axis" }));
      var thresholdY = chartY(1, damageTop, damageBottom, damageMaximum);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: thresholdY, x2: right, y2: thresholdY, "class": "mfd-threshold" }));
      svgText(doc, svg, "D=1", right - 28, thresholdY - 5, "mfd-threshold-label");
      result.rows.forEach(function (row, rowIndex) {
        var center = 105 + rowIndex * 145;
        var goodHeight = Math.max(1, row.goodmanDamage / damageMaximum * (damageBottom - damageTop));
        var sodHeight = Math.max(1, row.soderbergDamage / damageMaximum * (damageBottom - damageTop));
        svg.appendChild(svgElement(doc, "rect", { x: center - 24, y: damageBottom - goodHeight, width: 20, height: goodHeight, "class": "mfd-goodman-bar" }));
        svg.appendChild(svgElement(doc, "rect", { x: center + 4, y: damageBottom - sodHeight, width: 20, height: sodHeight, "class": "mfd-soderberg-bar" }));
        svgText(doc, svg, "块" + (rowIndex + 1), center - 12, damageBottom + 18, "mfd-muted");
      });
      svgText(doc, svg, "Miner 损伤块：蓝 Goodman，橙 Soderberg", left, damageTop - 10, "mfd-muted");
    }

    function renderTable(doc, hostNode, headings, rows) {
      clear(hostNode);
      var table = element(doc, "table", {});
      var head = element(doc, "tr", {});
      headings.forEach(function (heading) { head.appendChild(element(doc, "th", { scope: "col", text: heading })); });
      table.appendChild(element(doc, "thead", {}, [head]));
      var body = element(doc, "tbody", {});
      rows.forEach(function (row) {
        var tr = element(doc, "tr", {});
        row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      hostNode.appendChild(table);
    }

    function injectStyles(doc) {
      if (!doc || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = [
        '[data-learning-lab="' + LAB_ID + '"]{--mfd-blue:#245a9b;--mfd-green:#2d7a4b;--mfd-orange:#ad6811;--mfd-red:#b23a32;display:block;max-width:100%;min-width:0;line-height:1.55;overflow-wrap:anywhere}',
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
        '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h4{margin:15px 0 6px;font-size:1rem}[data-learning-lab="' + LAB_ID + '"] .mfd-note,[data-learning-lab="' + LAB_ID + '"] .mfd-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
        '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}',
        '[data-learning-lab="' + LAB_ID + '"] .mfd-options{display:grid;gap:5px}[data-learning-lab="' + LAB_ID + '"] .mfd-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] .mfd-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--mfd-blue)}',
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-height:44px;font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}',
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--mfd-blue)}[data-learning-lab="' + LAB_ID + '"] .mfd-primary{background:var(--mfd-blue);border-color:var(--mfd-blue);color:#fff}',
        '[data-learning-lab="' + LAB_ID + '"] .mfd-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mfd-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mfd-error{min-height:1.6em;color:var(--mfd-red);font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .mfd-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:14px 0}[data-learning-lab="' + LAB_ID + '"] .mfd-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mfd-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mfd-control small{font-size:11px;color:var(--fg-soft,currentColor)}[data-learning-lab="' + LAB_ID + '"] .mfd-blocks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:14px 0}[data-learning-lab="' + LAB_ID + '"] .mfd-block{min-width:0;margin:0;padding:9px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] .mfd-block legend{font-size:12px}',
        '[data-learning-lab="' + LAB_ID + '"] .mfd-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:15px;align-items:start;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mfd-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:7px;overflow:hidden;background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}',
        '[data-learning-lab="' + LAB_ID + '"] .mfd-axis{stroke:currentColor;stroke-width:1;opacity:.7}[data-learning-lab="' + LAB_ID + '"] .mfd-basquin{fill:none;stroke:var(--mfd-blue);stroke-width:3}[data-learning-lab="' + LAB_ID + '"] .mfd-goodman-point,[data-learning-lab="' + LAB_ID + '"] .mfd-goodman-bar{fill:var(--mfd-green);stroke:var(--mfd-green)}[data-learning-lab="' + LAB_ID + '"] .mfd-soderberg-point,[data-learning-lab="' + LAB_ID + '"] .mfd-soderberg-bar{fill:var(--mfd-orange);stroke:var(--mfd-orange)}[data-learning-lab="' + LAB_ID + '"] .mfd-threshold{stroke:var(--mfd-red);stroke-width:1.5;stroke-dasharray:5 4}[data-learning-lab="' + LAB_ID + '"] .mfd-basquin-label{fill:var(--mfd-blue);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mfd-goodman-label{fill:var(--mfd-green);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mfd-soderberg-label{fill:var(--mfd-orange);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mfd-threshold-label{fill:var(--mfd-red);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mfd-point-label{fill:var(--fg,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mfd-muted{fill:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mfd-table-wrap{min-width:0;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mfd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mfd-metric{min-width:0;padding:9px;border-top:3px solid var(--mfd-blue);background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] .mfd-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mfd-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
        'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--mfd-blue:#83b3ff;--mfd-green:#83d39c;--mfd-orange:#f2bb62;--mfd-red:#ff9b91}',
        '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mfd-blocks{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:850px){[data-learning-lab="' + LAB_ID + '"] .mfd-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:650px){[data-learning-lab="' + LAB_ID + '"] .mfd-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mfd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:400px){[data-learning-lab="' + LAB_ID + '"] .mfd-controls,[data-learning-lab="' + LAB_ID + '"] .mfd-blocks{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mfd-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mfd-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}'
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }

    function question(doc, uid, name, text, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: text })]);
      var options = element(doc, "div", { className: "mfd-options" });
      choices.forEach(function (choice) {
        var id = uid + "-" + name + "-" + choice.value;
        var input = element(doc, "input", { type: "radio", id: id, name: uid + "-" + name, value: choice.value });
        options.appendChild(element(doc, "label", { htmlFor: id }, [input, element(doc, "span", { text: choice.label })]));
      });
      fieldset.appendChild(options);
      return fieldset;
    }

    function selected(form, name) {
      var input = form.querySelector('input[name="' + name + '"]:checked');
      return input ? input.value : "";
    }

    function inputControl(doc, uid, key, label, value, min, max, step, unit) {
      var id = uid + "-" + key;
      var input = element(doc, "input", { id: id, type: "number", min: min, max: max, step: step, value: value });
      return {
        key: key,
        input: input,
        node: element(doc, "div", { className: "mfd-control" }, [
          element(doc, "label", { htmlFor: id, text: label }),
          input,
          element(doc, "small", { text: unit })
        ])
      };
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mfd-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      injectStyles(doc);
      INSTANCE += 1;
      var uid = LAB_ID + "-" + INSTANCE;
      var state = { revealed: false };
      clear(root);
      root.setAttribute("aria-labelledby", uid + "-heading");
      root.appendChild(element(doc, "h3", { id: uid + "-heading", text: "疲劳寿命：Basquin、Goodman/Soderberg 与 Miner 账" }));
      root.appendChild(element(doc, "p", {
        className: "mfd-note",
        text: "先完成三项预测。揭示后可改变材料参数和四段循环块；Goodman 与 Soderberg 同时计算，图中另标出低周和线性损伤模型边界。"
      }));

      var form = element(doc, "form", { className: "mfd-prediction" });
      form.appendChild(question(doc, uid, "mean", "对同一正平均应力块，哪一个修正更保守？", [
        { value: "soderberg", label: "Soderberg：用 Sy，等效幅更大、寿命更短" },
        { value: "goodman", label: "Goodman：用 Su，等效幅更大、寿命更短" },
        { value: "same", label: "两者完全相同，与平均应力无关" }
      ]));
      form.appendChild(question(doc, uid, "order", "在 Miner 线性账里把循环块倒序，合计损伤如何变化？", [
        { value: "same", label: "不变，因为损伤项是逐项相加" },
        { value: "different", label: "一定改变，先大后小总是更危险" },
        { value: "unknown", label: "无法计算，因为 Basquin 不能处理变幅" }
      ]));
      form.appendChild(question(doc, uid, "boundary", "若每个循环都有明显塑性，下一步应选什么？", [
        { value: "strain", label: "Coffin–Manson 应变寿命，并从原始历程做雨流计数" },
        { value: "stress", label: "继续外推 Basquin 应力寿命即可" },
        { value: "static", label: "只比较最大应力与屈服强度即可" }
      ]));
      var feedback = element(doc, "p", { className: "mfd-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "mfd-actions" }, [
        element(doc, "button", { type: "submit", className: "mfd-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      root.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var materialFields = [
        inputControl(doc, uid, "sigmaF", "疲劳强度系数 σ′f", DEFAULTS.sigmaF / 1e6, 100, 5000, 10, "MPa"),
        inputControl(doc, uid, "b", "Basquin 指数 b", DEFAULTS.b, -0.3, -0.01, 0.001, "无量纲；必须为负"),
        inputControl(doc, uid, "Su", "抗拉强度 Su", DEFAULTS.Su / 1e6, 100, 3000, 10, "MPa"),
        inputControl(doc, uid, "Sy", "屈服强度 Sy", DEFAULTS.Sy / 1e6, 50, 2500, 10, "MPa")
      ];
      var materialControls = element(doc, "div", { className: "mfd-controls" });
      materialFields.forEach(function (field) { materialControls.appendChild(field.node); });
      bench.appendChild(materialControls);
      var blockFields = [];
      var blocks = element(doc, "div", { className: "mfd-blocks" });
      DEFAULTS.blocks.forEach(function (block, index) {
        var fieldset = element(doc, "fieldset", { className: "mfd-block" }, [element(doc, "legend", { text: "循环块 " + (index + 1) })]);
        var amplitude = inputControl(doc, uid, "a" + index, "应力幅 σa", block.amplitude / 1e6, 1, 2000, 1, "MPa");
        var mean = inputControl(doc, uid, "m" + index, "平均应力 σm", block.mean / 1e6, -540, 720, 1, "MPa；受限于 Su");
        var cycles = inputControl(doc, uid, "n" + index, "循环数 n", block.cycles, 1, 1e10, 1000, "cycles");
        [amplitude, mean, cycles].forEach(function (field) {
          fieldset.appendChild(field.node);
          blockFields.push(field);
        });
        blocks.appendChild(fieldset);
      });
      bench.appendChild(blocks);
      var error = element(doc, "p", { className: "mfd-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "mfd-layout" });
      var stage = element(doc, "div", { className: "mfd-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "mfd-table-wrap" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "mfd-metrics" });
      bench.appendChild(metrics);
      var note = element(doc, "p", { className: "mfd-note", role: "status", "aria-live": "polite" });
      bench.appendChild(note);
      root.appendChild(bench);

      function readField(field) {
        var raw = field.input.value.trim();
        if (raw === "") throw new Error(field.key + " 不能为空");
        var value = Number(raw);
        if (!isFinite(value)) throw new Error(field.key + " 必须是有限数字");
        var min = Number(field.input.getAttribute("min"));
        var max = Number(field.input.getAttribute("max"));
        if (value < min || value > max) throw new Error(field.key + " 超出允许范围");
        return value;
      }

      function uiConfig() {
        var material = {};
        materialFields.forEach(function (field) { material[field.key] = readField(field); });
        var blocksConfig = [];
        for (var index = 0; index < 4; index += 1) {
          blocksConfig.push({
            amplitude: readField(blockFields[index * 3]) * 1e6,
            mean: readField(blockFields[index * 3 + 1]) * 1e6,
            cycles: readField(blockFields[index * 3 + 2])
          });
        }
        return {
          sigmaF: material.sigmaF * 1e6,
          b: material.b,
          Su: material.Su * 1e6,
          Sy: material.Sy * 1e6,
          blocks: blocksConfig
        };
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = solveFatigue(uiConfig());
          error.textContent = "";
          drawFatigue(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "D Goodman", formatNumber(result.goodmanDamage, 5)));
          metrics.appendChild(metric(doc, "D Soderberg", formatNumber(result.soderbergDamage, 5)));
          metrics.appendChild(metric(doc, "控制账", result.soderbergDamage >= result.goodmanDamage ? "Soderberg" : "Goodman"));
          metrics.appendChild(metric(doc, "低周警告", result.lowCycleGoodman || result.lowCycleSoderberg ? "有" : "无"));
          renderTable(doc, ledger, ["块", "σa/σm (MPa)", "等效幅 G / S (MPa)", "Nf G / S (cycles)", "损伤 G / S"], result.rows.map(function (row) {
            return [
              String(row.index),
              formatNumber(row.amplitude / 1e6, 2) + " / " + formatNumber(row.mean / 1e6, 2),
              formatNumber(row.goodmanAmplitude / 1e6, 3) + " / " + formatNumber(row.soderbergAmplitude / 1e6, 3),
              formatNumber(row.goodmanLife, 4) + " / " + formatNumber(row.soderbergLife, 4),
              formatNumber(row.goodmanDamage, 6) + " / " + formatNumber(row.soderbergDamage, 6)
            ];
          }).concat([
            ["合计", "—", "—", "—", formatNumber(result.goodmanDamage, 6) + " / " + formatNumber(result.soderbergDamage, 6)]
          ]));
          note.textContent = (result.screenPassGoodman && result.screenPassSoderberg ? "两本账均未越过 D=1 的线性筛查线。" : "至少一本账已越过 D=1 的线性筛查线。") +
            " 该结果不处理原始历程的 rainflow、顺序效应或低周塑性。";
        } catch (validationError) {
          error.textContent = "输入校验：" + validationError.message;
          clear(metrics);
          clear(ledger);
          clear(svg);
          note.textContent = "";
        }
      }

      materialFields.concat(blockFields).forEach(function (field) {
        field.input.addEventListener("input", render);
        field.input.addEventListener("change", render);
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var answers = {
          mean: selected(form, uid + "-mean"),
          order: selected(form, uid + "-order"),
          boundary: selected(form, uid + "-boundary")
        };
        if (!answers.mean || !answers.order || !answers.boundary) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.mean === "soderberg" ? 1 : 0) + (answers.order === "same" ? 1 : 0) + (answers.boundary === "strain" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在改变载荷块并比较两本损伤账。";
        render();
        if (api && typeof api.announce === "function") api.announce(root, "疲劳实验已揭示，Basquin、Goodman、Soderberg 与 Miner 账本已显示。");
      });
      form.querySelector('[data-reset="true"]').addEventListener("click", function () {
        form.reset();
        state.revealed = false;
        bench.hidden = true;
        feedback.textContent = "结果尚未揭示。";
        materialFields.forEach(function (field) {
          var value = field.key === "sigmaF" ? DEFAULTS.sigmaF / 1e6
            : field.key === "Su" ? DEFAULTS.Su / 1e6
              : field.key === "Sy" ? DEFAULTS.Sy / 1e6
                : DEFAULTS[field.key];
          field.input.value = value;
        });
        blockFields.forEach(function (field, index) {
          var block = DEFAULTS.blocks[Math.floor(index / 3)];
          field.input.value = index % 3 === 0 ? block.amplitude / 1e6 : index % 3 === 1 ? block.mean / 1e6 : block.cycles;
        });
        error.textContent = "";
        clear(metrics);
        clear(ledger);
        clear(svg);
        note.textContent = "";
        if (api && typeof api.announce === "function") api.announce(root, "疲劳实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(root, "疲劳实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var result = solveFatigue(DEFAULTS);
      check(result.rows.length === 4, "four variable-amplitude blocks are present");
      check(result.goodmanDamage > 0 && result.soderbergDamage > 0, "damage ledgers are positive");
      check(result.rows[2].soderbergAmplitude > result.rows[2].goodmanAmplitude, "positive mean stress makes Soderberg more conservative");
      check(result.rows[2].soderbergLife < result.rows[2].goodmanLife, "larger corrected amplitude shortens Basquin life");
      check(near(result.goodmanDamage, result.reversedGoodmanDamage, 1e-12) && near(result.soderbergDamage, result.reversedSoderbergDamage, 1e-12), "Miner sum is order independent");
      var compression = solveFatigue({
        sigmaF: DEFAULTS.sigmaF,
        b: DEFAULTS.b,
        Su: DEFAULTS.Su,
        Sy: DEFAULTS.Sy,
        blocks: [
          { amplitude: 100e6, mean: -100e6, cycles: 1000 },
          DEFAULTS.blocks[1],
          DEFAULTS.blocks[2],
          DEFAULTS.blocks[3]
        ]
      });
      check(compression.rows[0].goodmanAmplitude < 100e6, "compressive mean stress reduces the Goodman equivalent amplitude");
      var invalidCaught = false;
      try {
        solveFatigue({
          sigmaF: DEFAULTS.sigmaF,
          b: DEFAULTS.b,
          Su: DEFAULTS.Su,
          Sy: DEFAULTS.Sy,
          blocks: [
            { amplitude: 100e6, mean: DEFAULTS.Su, cycles: 1000 },
            DEFAULTS.blocks[1],
            DEFAULTS.blocks[2],
            DEFAULTS.blocks[3]
          ]
        });
      } catch (error) { invalidCaught = true; }
      check(invalidCaught, "nonpositive Goodman denominator is rejected");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "zero-decimal formatter preserves integer zeros");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      correctedAmplitude: correctedAmplitude,
      basquinLife: basquinLife,
      solveFatigue: solveFatigue,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
