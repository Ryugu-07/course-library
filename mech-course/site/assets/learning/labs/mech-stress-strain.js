(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-stress-strain", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-stress-strain self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-stress-strain self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-stress-strain";
    var STYLE_ID = "cl-mech-stress-strain-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var EPS = 1e-10;
    var INSTANCE = 0;
    var DEFAULTS = {
      E: 210e9,
      sigmaY: 250e6,
      H: 900e6,
      n: 0.35,
      engStrain: 0.08
    };

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance === undefined ? 1e-8 : tolerance) * scale;
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

    function normalizeConfig(input) {
      var source = input || {};
      var config = {
        E: positive(source.E === undefined ? DEFAULTS.E : source.E, "E"),
        sigmaY: positive(source.sigmaY === undefined ? DEFAULTS.sigmaY : source.sigmaY, "sigmaY"),
        H: positive(source.H === undefined ? DEFAULTS.H : source.H, "H"),
        n: finite(source.n === undefined ? DEFAULTS.n : source.n, "n"),
        engStrain: finite(source.engStrain === undefined ? DEFAULTS.engStrain : source.engStrain, "engineering strain")
      };
      if (config.E < 1e9 || config.E > 400e9) throw new RangeError("E must be in [1, 400] GPa");
      if (config.sigmaY < 1e6 || config.sigmaY > 2000e6) throw new RangeError("sigmaY must be in [1, 2000] MPa");
      if (config.H < 1e6 || config.H > 5000e6) throw new RangeError("H must be in [1, 5000] MPa");
      if (config.n < 0.15 || config.n > 0.8) throw new RangeError("n must be in [0.15, 0.8]");
      if (config.engStrain < 0 || config.engStrain > 0.45) throw new RangeError("engineering strain must be in [0, 0.45]");
      return config;
    }

    function trueStrainFromEngineering(engineeringStrain) {
      var strain = finite(engineeringStrain, "engineering strain");
      if (strain < 0) throw new RangeError("engineering strain must be nonnegative");
      return Math.log1p(strain);
    }

    function trueStressAt(trueStrain, config) {
      var strain = finite(trueStrain, "true strain");
      if (strain < 0) throw new RangeError("true strain must be nonnegative");
      var epsilonY = config.sigmaY / config.E;
      if (strain <= epsilonY) return config.E * strain;
      return config.sigmaY + config.H * Math.pow(strain - epsilonY, config.n);
    }

    function trueTangentAt(trueStrain, config) {
      var strain = finite(trueStrain, "true strain");
      var epsilonY = config.sigmaY / config.E;
      if (strain <= epsilonY) return config.E;
      var delta = Math.max(strain - epsilonY, 1e-14);
      return config.H * config.n * Math.pow(delta, config.n - 1);
    }

    function engineeringStressAt(engineeringStrain, config) {
      var strain = finite(engineeringStrain, "engineering strain");
      if (strain < 0) throw new RangeError("engineering strain must be nonnegative");
      return trueStressAt(trueStrainFromEngineering(strain), config) / (1 + strain);
    }

    function firstCrossing(functionOfX, start, end, steps) {
      var count = Math.max(8, Math.floor(steps || 240));
      var x0 = start;
      var y0 = functionOfX(x0);
      for (var index = 1; index <= count; index += 1) {
        var x1 = start + (end - start) * index / count;
        var y1 = functionOfX(x1);
        if (Math.abs(y0) <= EPS) return x0;
        if ((y0 > 0 && y1 <= 0) || (y0 < 0 && y1 >= 0)) {
          var low = x0;
          var high = x1;
          var lowValue = y0;
          for (var iteration = 0; iteration < 70; iteration += 1) {
            var mid = (low + high) / 2;
            var midValue = functionOfX(mid);
            if (Math.abs(midValue) <= 1e-12 * Math.max(1, Math.abs(y0), Math.abs(y1))) return mid;
            if ((lowValue > 0 && midValue > 0) || (lowValue < 0 && midValue < 0)) {
              low = mid;
              lowValue = midValue;
            } else {
              high = mid;
            }
          }
          return (low + high) / 2;
        }
        x0 = x1;
        y0 = y1;
      }
      return null;
    }

    function offsetYield(config) {
      var offset = 0.002;
      var crossing = firstCrossing(function (engineeringStrain) {
        return engineeringStressAt(engineeringStrain, config) - config.E * (engineeringStrain - offset);
      }, offset, 0.3, 360);
      if (crossing === null) return null;
      var stress = engineeringStressAt(crossing, config);
      return {
        offset: offset,
        engineeringStrain: crossing,
        trueStrain: trueStrainFromEngineering(crossing),
        engineeringStress: stress,
        trueStress: stress * (1 + crossing)
      };
    }

    function neckingPoint(config) {
      var epsilonY = config.sigmaY / config.E;
      var start = epsilonY + 1e-7;
      var end = Math.log1p(0.45);
      var crossing = firstCrossing(function (trueStrain) {
        return trueTangentAt(trueStrain, config) - trueStressAt(trueStrain, config);
      }, start, end, 480);
      if (crossing === null) return null;
      return {
        trueStrain: crossing,
        engineeringStrain: Math.expm1(crossing),
        trueStress: trueStressAt(crossing, config),
        tangent: trueTangentAt(crossing, config),
        criterionResidual: trueTangentAt(crossing, config) - trueStressAt(crossing, config)
      };
    }

    function stateAt(engineeringStrain, config, necking) {
      var strain = finite(engineeringStrain, "engineering strain");
      if (strain < 0 || strain > 0.45) throw new RangeError("engineering strain must be in [0, 0.45]");
      var trueStrain = trueStrainFromEngineering(strain);
      var trueStress = trueStressAt(trueStrain, config);
      var engineeringStress = trueStress / (1 + strain);
      var neckingStrain = necking ? necking.engineeringStrain : Infinity;
      return {
        engineeringStrain: strain,
        trueStrain: trueStrain,
        areaRatio: 1 / (1 + strain),
        engineeringStress: engineeringStress,
        trueStress: trueStress,
        uniformValid: strain <= neckingStrain + 1e-9,
        postNeckingToy: strain > neckingStrain + 1e-9
      };
    }

    function evaluate(input) {
      var config = normalizeConfig(input);
      var epsilonY = config.sigmaY / config.E;
      var necking = neckingPoint(config);
      if (!necking) throw new Error("bounded toy law did not produce a Considere crossing");
      var offset = offsetYield(config);
      if (!offset) throw new Error("bounded toy law did not produce a 0.2% offset crossing");
      var current = stateAt(config.engStrain, config, necking);
      var points = [];
      var maximum = 0.32;
      var count = 120;
      for (var index = 0; index <= count; index += 1) {
        var engineeringStrain = maximum * index / count;
        var state = stateAt(engineeringStrain, config, necking);
        points.push(state);
      }
      return {
        config: config,
        epsilonY: epsilonY,
        offsetYield: offset,
        necking: necking,
        current: current,
        points: points,
        uniformConversionValid: current.uniformValid
      };
    }

    function formatNumber(value, digits) {
      if (!isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
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
        if (key === "className") node.setAttribute("class", value);
        else if (key === "htmlFor") node.setAttribute("for", value);
        else if (key === "text") node.textContent = String(value);
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
      var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mss-muted" });
      node.textContent = text;
      parent.appendChild(node);
    }

    function pathFor(points, x0, x1, y0, y1, maxStrain, maxStress, stressKey, filter) {
      var path = "";
      var started = false;
      points.forEach(function (point) {
        if (filter && !filter(point)) {
          started = false;
          return;
        }
        var x = x0 + (x1 - x0) * point.engineeringStrain / maxStrain;
        var stress = point[stressKey] / 1e6;
        var y = y1 - (y1 - y0) * Math.max(0, Math.min(maxStress, stress)) / maxStress;
        path += (started ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2) + " ";
        started = true;
      });
      return path.trim();
    }

    function drawSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 540;
      var maxStrain = 0.32;
      var maxStress = 800;
      var chartLeft = 70;
      var chartRight = 660;
      var chartTop = 260;
      var chartBottom = 485;
      var neck = result.necking.engineeringStrain;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "拉伸试样当前形状与工程应力、玩具真应力和零点二百分比偏移线");
      svg.appendChild(svgElement(doc, "line", { x1: 80, y1: 125, x2: 640, y2: 125, "class": "mss-grip" }));
      svg.appendChild(svgElement(doc, "line", { x1: 80, y1: 180, x2: 640, y2: 180, "class": "mss-grip" }));
      var areaRatio = result.current.areaRatio;
      var widthFactor = Math.sqrt(areaRatio);
      var gaugeWidth = 44 * Math.max(0.25, widthFactor);
      var center = 360;
      var gaugeLeft = 220;
      var gaugeRight = 500;
      var top = 125;
      var bottom = 180;
      var necked = result.current.postNeckingToy;
      var specimenPoints;
      if (!necked) {
        specimenPoints = [gaugeLeft + "," + (center - gaugeWidth / 2), gaugeRight + "," + (center - gaugeWidth / 2), gaugeRight + "," + (center + gaugeWidth / 2), gaugeLeft + "," + (center + gaugeWidth / 2)].join(" ");
      } else {
        var narrow = Math.max(7, gaugeWidth * 0.33);
        specimenPoints = [gaugeLeft + "," + (center - gaugeWidth / 2), (center - 65) + "," + (center - gaugeWidth / 2), (center - 25) + "," + (center - narrow / 2), (center + 25) + "," + (center - narrow / 2), (center + 65) + "," + (center - gaugeWidth / 2), gaugeRight + "," + (center - gaugeWidth / 2), gaugeRight + "," + (center + gaugeWidth / 2), (center + 65) + "," + (center + gaugeWidth / 2), (center + 25) + "," + (center + narrow / 2), (center - 25) + "," + (center + narrow / 2), (center - 65) + "," + (center + gaugeWidth / 2), gaugeLeft + "," + (center + gaugeWidth / 2)].join(" ");
      }
      svg.appendChild(svgElement(doc, "polygon", { points: specimenPoints, "class": necked ? "mss-necked" : "mss-specimen" }));
      svg.appendChild(svgElement(doc, "line", { x1: 115, y1: 152, x2: 70, y2: 152, "class": "mss-force" }));
      svg.appendChild(svgElement(doc, "polygon", { points: "70,152 82,146 82,158", "class": "mss-force" }));
      svg.appendChild(svgElement(doc, "line", { x1: 605, y1: 152, x2: 650, y2: 152, "class": "mss-force" }));
      svg.appendChild(svgElement(doc, "polygon", { points: "650,152 638,146 638,158", "class": "mss-force" }));
      svgText(doc, svg, necked ? "颈缩后：形状仅为玩具状态，局部面积未知" : "均匀标距段：面积比=" + formatNumber(areaRatio, 3), 215, 218, necked ? "mss-warning-text" : "mss-muted");
      svgText(doc, svg, "结构状态", 80, 92, "mss-title");
      [0, 0.1, 0.2, 0.3].forEach(function (tick) {
        var x = chartLeft + (chartRight - chartLeft) * tick / maxStrain;
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: chartTop, x2: x, y2: chartBottom, "class": "mss-grid" }));
        svgText(doc, svg, tick.toFixed(1), x - 8, chartBottom + 21, "mss-muted");
      });
      [0, 200, 400, 600, 800].forEach(function (tick) {
        var y = chartBottom - (chartBottom - chartTop) * tick / maxStress;
        svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: y, x2: chartRight, y2: y, "class": "mss-grid" }));
        svgText(doc, svg, String(tick), chartLeft - 35, y + 4, "mss-muted");
      });
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartBottom, x2: chartRight, y2: chartBottom, "class": "mss-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartTop, x2: chartLeft, y2: chartBottom, "class": "mss-axis" }));
      var engineeringPath = pathFor(result.points, chartLeft, chartRight, chartTop, chartBottom, maxStrain, maxStress, "engineeringStress", null);
      var trueUniformPath = pathFor(result.points, chartLeft, chartRight, chartTop, chartBottom, maxStrain, maxStress, "trueStress", function (point) { return point.uniformValid; });
      var trueToyPath = pathFor(result.points, chartLeft, chartRight, chartTop, chartBottom, maxStrain, maxStress, "trueStress", function (point) { return point.postNeckingToy; });
      svg.appendChild(svgElement(doc, "path", { d: engineeringPath, "class": "mss-engineering" }));
      svg.appendChild(svgElement(doc, "path", { d: trueUniformPath, "class": "mss-true" }));
      if (trueToyPath) svg.appendChild(svgElement(doc, "path", { d: trueToyPath, "class": "mss-toy" }));
      var offsetPoints = [];
      for (var index = 0; index <= 30; index += 1) {
        var strain = 0.002 + (0.3 - 0.002) * index / 30;
        offsetPoints.push({ engineeringStrain: strain, engineeringStress: result.config.E * (strain - 0.002) });
      }
      svg.appendChild(svgElement(doc, "path", { d: pathFor(offsetPoints, chartLeft, chartRight, chartTop, chartBottom, maxStrain, maxStress, "engineeringStress", null), "class": "mss-offset" }));
      var neckX = chartLeft + (chartRight - chartLeft) * neck / maxStrain;
      svg.appendChild(svgElement(doc, "line", { x1: neckX, y1: chartTop, x2: neckX, y2: chartBottom, "class": "mss-neck-line" }));
      var currentX = chartLeft + (chartRight - chartLeft) * result.current.engineeringStrain / maxStrain;
      var currentY = chartBottom - (chartBottom - chartTop) * Math.min(maxStress, result.current.engineeringStress / 1e6) / maxStress;
      svg.appendChild(svgElement(doc, "circle", { cx: currentX, cy: currentY, r: 5, "class": "mss-current" }));
      svgText(doc, svg, "工程应力 s", 480, 285, "mss-engineering-text");
      svgText(doc, svg, "真应力（均匀段）", 480, 303, "mss-true-text");
      svgText(doc, svg, "颈缩后仅玩具外推", 480, 321, "mss-toy-text");
      svgText(doc, svg, "0.2% 偏移线", 480, 339, "mss-offset-text");
      svgText(doc, svg, "工程应变 e", 560, chartBottom + 42, "mss-muted");
      svgText(doc, svg, "应力 (MPa)", 18, chartTop + 10, "mss-muted");
      svgText(doc, svg, "扩散颈缩 e=" + formatNumber(neck, 3), neckX + 5, chartTop + 18, "mss-warning-text");
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
        '[data-learning-lab="' + LAB_ID + '"]{--mss-blue:#245a9b;--mss-green:#2d7a4b;--mss-orange:#ad6811;--mss-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
        '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.16rem}[data-learning-lab="' + LAB_ID + '"] h4{margin-top:16px;font-size:1rem}',
        '[data-learning-lab="' + LAB_ID + '"] .mss-note,[data-learning-lab="' + LAB_ID + '"] .mss-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
        '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}',
        '[data-learning-lab="' + LAB_ID + '"] .mss-options{display:grid;gap:5px}[data-learning-lab="' + LAB_ID + '"] .mss-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] .mss-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--mss-blue)}',
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-height:44px;font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}',
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--mss-blue)}[data-learning-lab="' + LAB_ID + '"] .mss-primary{background:var(--mss-blue);border-color:var(--mss-blue);color:#fff}',
        '[data-learning-lab="' + LAB_ID + '"] .mss-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mss-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mss-error{min-height:1.6em;color:var(--mss-red);font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .mss-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px;margin:14px 0}[data-learning-lab="' + LAB_ID + '"] .mss-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mss-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mss-control small{font-size:11px;color:var(--fg-soft,currentColor)}',
        '[data-learning-lab="' + LAB_ID + '"] .mss-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:7px;overflow:hidden;background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}',
        '[data-learning-lab="' + LAB_ID + '"] .mss-grip{stroke:currentColor;stroke-width:54;stroke-linecap:round;opacity:.22}[data-learning-lab="' + LAB_ID + '"] .mss-specimen{fill:var(--mss-blue);opacity:.78}[data-learning-lab="' + LAB_ID + '"] .mss-necked{fill:var(--mss-orange);opacity:.82}[data-learning-lab="' + LAB_ID + '"] .mss-force{stroke:var(--mss-red);fill:var(--mss-red);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mss-grid{stroke:var(--border,#cbd5e1);stroke-width:1;opacity:.7}[data-learning-lab="' + LAB_ID + '"] .mss-axis{stroke:currentColor;stroke-width:1.2;opacity:.8}[data-learning-lab="' + LAB_ID + '"] .mss-engineering{fill:none;stroke:var(--mss-blue);stroke-width:2.8}[data-learning-lab="' + LAB_ID + '"] .mss-true{fill:none;stroke:var(--mss-green);stroke-width:2.8}[data-learning-lab="' + LAB_ID + '"] .mss-toy{fill:none;stroke:var(--mss-orange);stroke-width:2.3;stroke-dasharray:6 5}[data-learning-lab="' + LAB_ID + '"] .mss-offset{fill:none;stroke:var(--mss-red);stroke-width:1.8;stroke-dasharray:4 4}[data-learning-lab="' + LAB_ID + '"] .mss-neck-line{stroke:var(--mss-orange);stroke-width:1.5;stroke-dasharray:5 4}[data-learning-lab="' + LAB_ID + '"] .mss-current{fill:var(--mss-red);stroke:var(--bg,Canvas);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mss-muted{fill:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mss-title{font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mss-engineering-text{fill:var(--mss-blue);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mss-true-text{fill:var(--mss-green);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mss-toy-text{fill:var(--mss-orange);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mss-offset-text{fill:var(--mss-red);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mss-warning-text{fill:var(--mss-red);font-weight:700;font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mss-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:15px;align-items:start;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mss-table-wrap{min-width:0;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:460px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mss-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mss-metric{min-width:0;padding:9px;border-top:3px solid var(--mss-blue);background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] .mss-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mss-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
        'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--mss-blue:#83b3ff;--mss-green:#83d39c;--mss-orange:#f2bb62;--mss-red:#ff9b91}',
        '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mss-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:680px){[data-learning-lab="' + LAB_ID + '"] .mss-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mss-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:400px){[data-learning-lab="' + LAB_ID + '"] .mss-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mss-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mss-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}'
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }

    function question(doc, uid, name, text, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: text })]);
      var options = element(doc, "div", { className: "mss-options" });
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
      return { key: key, input: input, node: element(doc, "div", { className: "mss-control" }, [element(doc, "label", { htmlFor: id, text: label }), input, element(doc, "small", { text: unit })]) };
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mss-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
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
      var heading = element(doc, "h3", { id: uid + "-heading", text: "拉伸试验：工程量、真量与颈缩账本" });
      var intro = element(doc, "p", { className: "mss-note", text: "先提交三项预测。揭示后可改变玩具本构参数与当前工程应变；扩散颈缩后的曲线会用虚线并明确标注为非精确均匀换算。" });
      var form = element(doc, "form", { className: "mss-prediction" });
      form.appendChild(question(doc, uid, "conversion", "均匀拉伸到 e=0.10 时，哪一个应变更大？", [
        { value: "true", label: "真应变 ln(1+e) 更小" },
        { value: "engineering", label: "工程应变 e 更小" },
        { value: "same", label: "两者相同" }
      ]));
      form.appendChild(question(doc, uid, "offset", "0.2% 偏移线的写法是？", [
        { value: "minus", label: "sigma=E(e−0.002)，与曲线交点定义条件屈服" },
        { value: "plus", label: "sigma=E e+0.002" },
        { value: "stress", label: "sigma=sigma_y+0.002" }
      ]));
      form.appendChild(question(doc, uid, "necking", "Considere 条件到达后，均匀面积换算是否仍精确？", [
        { value: "stop", label: "不再精确；颈部面积变成局部、非均匀问题" },
        { value: "continue", label: "仍精确到断裂，因为体积永远不变" },
        { value: "zero", label: "真应力立刻变为零" }
      ]));
      var feedback = element(doc, "p", { className: "mss-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "mss-actions" }, [
        element(doc, "button", { type: "submit", className: "mss-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      root.appendChild(heading);
      root.appendChild(intro);
      root.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var fields = [
        inputControl(doc, uid, "E", "E", DEFAULTS.E / 1e9, 1, 400, 1, "GPa"),
        inputControl(doc, uid, "sigmaY", "sigma_y", DEFAULTS.sigmaY / 1e6, 1, 2000, 1, "MPa"),
        inputControl(doc, uid, "H", "H", DEFAULTS.H / 1e6, 1, 5000, 1, "MPa"),
        inputControl(doc, uid, "n", "硬化指数 n", DEFAULTS.n, 0.15, 0.8, 0.01, "无量纲"),
        inputControl(doc, uid, "engStrain", "当前工程应变 e", DEFAULTS.engStrain, 0, 0.45, 0.005, "无量纲")
      ];
      var controls = element(doc, "div", { className: "mss-controls" });
      fields.forEach(function (field) { controls.appendChild(field.node); });
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "mss-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "mss-layout" });
      var stage = element(doc, "div", { className: "mss-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "mss-table-wrap" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "mss-metrics" });
      bench.appendChild(metrics);
      var note = element(doc, "p", { className: "mss-note", role: "status", "aria-live": "polite" });
      bench.appendChild(note);
      root.appendChild(bench);

      function uiConfig() {
        var values = {};
        fields.forEach(function (field) {
          var raw = field.input.value.trim();
          if (raw === "") throw new Error(field.key + " 不能为空");
          var value = Number(raw);
          if (!isFinite(value)) throw new Error(field.key + " 必须是有限数字");
          var min = Number(field.input.getAttribute("min"));
          var max = Number(field.input.getAttribute("max"));
          if (value < min || value > max) throw new Error(field.key + " 超出允许范围");
          values[field.key] = value;
        });
        return { E: values.E * 1e9, sigmaY: values.sigmaY * 1e6, H: values.H * 1e6, n: values.n, engStrain: values.engStrain };
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = evaluate(uiConfig());
          error.textContent = "";
          drawSvg(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "当前工程应力", formatNumber(result.current.engineeringStress / 1e6, 2) + " MPa"));
          metrics.appendChild(metric(doc, "当前玩具真应力", formatNumber(result.current.trueStress / 1e6, 2) + " MPa"));
          metrics.appendChild(metric(doc, "0.2% 屈服", formatNumber(result.offsetYield.engineeringStress / 1e6, 2) + " MPa"));
          metrics.appendChild(metric(doc, "扩散颈缩", formatNumber(result.necking.engineeringStrain * 100, 2) + "%"));
          renderTable(doc, ledger, ["账本项", "公式/读数", "单位或边界"], [
            ["工程应变 e", formatNumber(result.current.engineeringStrain, 5), "无量纲"],
            ["真应变 epsilon", "ln(1+e) = " + formatNumber(result.current.trueStrain, 5), "均匀映射"],
            ["面积比 A/A0", "1/(1+e) = " + formatNumber(result.current.areaRatio, 5), result.current.uniformValid ? "均匀假设有效" : "颈缩后仅玩具外推"],
            ["工程应力 s", formatNumber(result.current.engineeringStress / 1e6, 3), "MPa = N/mm^2"],
            ["真应力 sigma", formatNumber(result.current.trueStress / 1e6, 3), "MPa；均匀段换算"],
            ["0.2% 偏移", "e = " + formatNumber(result.offsetYield.engineeringStrain, 5), formatNumber(result.offsetYield.engineeringStress / 1e6, 2) + " MPa"],
            ["Considere", "d sigma/d epsilon − sigma = " + formatNumber(result.necking.criterionResidual / 1e6, 5), "MPa；扩散颈缩点"]
          ]);
          note.textContent = result.current.uniformValid
            ? "当前点仍在扩散颈缩之前；s(1+e) 只在这个均匀窗口内作为真应力映射。"
            : "当前点位于扩散颈缩之后；橙色虚线是有界玩具外推，不是精确的局部真应力曲线。";
        } catch (validationError) {
          error.textContent = "输入校验：" + validationError.message;
          clear(metrics); clear(ledger); clear(svg); note.textContent = "";
        }
      }

      fields.forEach(function (field) {
        field.input.addEventListener("input", render);
        field.input.addEventListener("change", render);
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var answers = {
          conversion: selected(form, uid + "-conversion"),
          offset: selected(form, uid + "-offset"),
          necking: selected(form, uid + "-necking")
        };
        if (!answers.conversion || !answers.offset || !answers.necking) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.conversion === "true" ? 1 : 0) + (answers.offset === "minus" ? 1 : 0) + (answers.necking === "stop" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在沿着数字账本读到扩散颈缩边界。";
        render();
        if (api && typeof api.announce === "function") api.announce(root, "应力应变预测已揭示，工程真量账本已显示。");
      });
      form.querySelector('[data-reset="true"]').addEventListener("click", function () {
        form.reset();
        state.revealed = false;
        bench.hidden = true;
        feedback.textContent = "结果尚未揭示。";
        fields.forEach(function (field) {
          field.input.value = field.key === "E" ? DEFAULTS.E / 1e9 : field.key === "sigmaY" ? DEFAULTS.sigmaY / 1e6 : field.key === "H" ? DEFAULTS.H / 1e6 : DEFAULTS[field.key];
        });
        error.textContent = "";
        clear(metrics); clear(ledger); clear(svg); note.textContent = "";
        if (api && typeof api.announce === "function") api.announce(root, "应力应变实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(root, "应力应变实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var result = evaluate(DEFAULTS);
      check(result.offsetYield && result.necking, "yield and necking landmarks exist");
      check(result.current.trueStrain < result.current.engineeringStrain, "logarithmic true strain is below engineering strain");
      check(near(result.current.areaRatio, 1 / (1 + DEFAULTS.engStrain)), "uniform area ratio follows volume assumption");
      check(near(result.current.trueStress, result.current.engineeringStress * (1 + DEFAULTS.engStrain)), "engineering to true stress mapping is explicit");
      check(result.offsetYield.engineeringStrain > 0.002, "offset yield occurs after offset origin");
      check(Math.abs(result.necking.criterionResidual) < 1e-3 * result.necking.trueStress, "Considere residual closes at necking");
      var pre = stateAt(Math.max(0, result.necking.engineeringStrain * 0.5), result.config, result.necking);
      var post = stateAt(Math.min(0.45, result.necking.engineeringStrain + 0.05), result.config, result.necking);
      check(pre.uniformValid && !pre.postNeckingToy, "pre-necking conversion is marked valid");
      check(!post.uniformValid && post.postNeckingToy, "post-necking uniform conversion is marked nonexact");
      check(result.offsetYield.engineeringStress > 0 && result.necking.trueStress > result.offsetYield.trueStress, "landmark stresses have physical order");
      var invalidCaught = false;
      try { normalizeConfig({ E: 0 }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "nonpositive modulus is rejected");
      invalidCaught = false;
      try { normalizeConfig({ n: 0.95 }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "unbounded hardening exponent is rejected");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "zero-decimal formatter preserves integer zeros");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      trueStressAt: trueStressAt,
      trueTangentAt: trueTangentAt,
      stateAt: stateAt,
      offsetYield: offsetYield,
      neckingPoint: neckingPoint,
      evaluate: evaluate,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
