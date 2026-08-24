(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-system-identification", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-system-identification self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-system-identification self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "auto-system-identification";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-system-identification-styles";
    var EPS = 1e-10;
    var TRUE_A = 0.82;
    var TRUE_B = 0.28;
    var DEFAULTS = {
      mode: "rich",
      amplitude: 1,
      noise: 0.04,
      samples: 80
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-system-identification"]{--sid-blue:var(--cl-blue,#315f9d);--sid-orange:var(--cl-gold,#9b6a12);--sid-green:var(--cl-green,#39734d);--sid-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-system-identification"] *{box-sizing:border-box}[data-learning-lab="auto-system-identification"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-system-identification"] h3,[data-learning-lab="auto-system-identification"] h4{margin:0;letter-spacing:0}[data-learning-lab="auto-system-identification"] h3{font-size:1.16rem}[data-learning-lab="auto-system-identification"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-system-identification"] p{margin:8px 0}[data-learning-lab="auto-system-identification"] .sid-note,[data-learning-lab="auto-system-identification"] .sid-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-system-identification"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-system-identification"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-system-identification"] .sid-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-system-identification"] button,[data-learning-lab="auto-system-identification"] input,[data-learning-lab="auto-system-identification"] select{font:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-system-identification"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-system-identification"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-system-identification"] button[aria-pressed="true"],[data-learning-lab="auto-system-identification"] .sid-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-system-identification"] button:focus-visible,[data-learning-lab="auto-system-identification"] input:focus-visible,[data-learning-lab="auto-system-identification"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-system-identification"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-system-identification"] .sid-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-system-identification"] .sid-actions>*{flex:1 1 170px}[data-learning-lab="auto-system-identification"] .sid-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-system-identification"] .sid-correct{color:var(--sid-green)}[data-learning-lab="auto-system-identification"] .sid-wrong{color:var(--sid-red)}',
      '[data-learning-lab="auto-system-identification"] .sid-layout{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-system-identification"] .sid-controls,[data-learning-lab="auto-system-identification"] .sid-stage{min-width:0}[data-learning-lab="auto-system-identification"] .sid-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-system-identification"] .sid-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-system-identification"] .sid-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-system-identification"] .sid-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}[data-learning-lab="auto-system-identification"] select{width:100%;min-height:44px;padding:7px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}',
      '[data-learning-lab="auto-system-identification"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-system-identification"] .sid-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-system-identification"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-system-identification"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-system-identification"] .sid-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-system-identification"] .sid-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-system-identification"] .sid-output{fill:none;stroke:var(--sid-blue);stroke-width:2.8}[data-learning-lab="auto-system-identification"] .sid-fit{fill:none;stroke:var(--sid-orange);stroke-width:2.3;stroke-dasharray:6 4}[data-learning-lab="auto-system-identification"] .sid-train-residual{fill:none;stroke:var(--sid-green);stroke-width:2.2}[data-learning-lab="auto-system-identification"] .sid-validation-residual{fill:none;stroke:var(--sid-red);stroke-width:2.2}[data-learning-lab="auto-system-identification"] .sid-zero{stroke:currentColor;stroke-width:1;stroke-dasharray:4 4;opacity:.55}[data-learning-lab="auto-system-identification"] .sid-label{font-size:11px}[data-learning-lab="auto-system-identification"] .sid-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-system-identification"] .sid-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-system-identification"] .sid-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-system-identification"] .sid-metric:nth-child(3n+1){border-color:var(--sid-blue)}[data-learning-lab="auto-system-identification"] .sid-metric:nth-child(3n+2){border-color:var(--sid-orange)}[data-learning-lab="auto-system-identification"] .sid-metric:nth-child(3n){border-color:var(--sid-green)}[data-learning-lab="auto-system-identification"] .sid-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-system-identification"] .sid-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-system-identification"] .sid-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-system-identification"] table{width:100%;min-width:760px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-system-identification"] th,[data-learning-lab="auto-system-identification"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-system-identification"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-system-identification"] .sid-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--sid-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="auto-system-identification"] .sid-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-system-identification"] .sid-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-system-identification"] .sid-stage-frame{padding:4px}[data-learning-lab="auto-system-identification"] table{font-size:10.8px}[data-learning-lab="auto-system-identification"] th,[data-learning-lab="auto-system-identification"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-system-identification"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function nearly(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
    }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
        return value.toExponential(Math.min(places, 4));
      }
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function normalizeConfig(input) {
      var source = input || {};
      var mode = source.mode === undefined ? DEFAULTS.mode : String(source.mode);
      var amplitude = finite(source.amplitude === undefined ? DEFAULTS.amplitude : source.amplitude, "amplitude");
      var noise = finite(source.noise === undefined ? DEFAULTS.noise : source.noise, "noise");
      var samples = Math.round(finite(source.samples === undefined ? DEFAULTS.samples : source.samples, "samples"));
      if (["rich", "step", "flat"].indexOf(mode) === -1) throw new RangeError("unknown excitation mode");
      if (amplitude < 0.05 || amplitude > 1.5) throw new RangeError("amplitude must be in [0.05, 1.5]");
      if (noise < 0 || noise > 0.2) throw new RangeError("noise must be in [0, 0.2]");
      if (samples < 48 || samples > 96) throw new RangeError("samples must be in [48, 96]");
      return { mode: mode, amplitude: amplitude, noise: noise, samples: samples };
    }

    function inputAt(step, config) {
      if (config.mode === "flat") return 0;
      if (config.mode === "step") return step < 8 ? 0 : config.amplitude;
      var alternating = step % 2 === 0 ? 1 : -1;
      return config.amplitude * (0.55 * alternating + 0.25 * Math.sin(0.37 * step) + 0.2 * Math.cos(0.11 * step));
    }

    function noiseAt(step, config) {
      return config.noise * (0.55 * Math.sin(0.47 * step + 0.3) + 0.35 * Math.cos(0.19 * step - 0.2) + 0.1 * Math.sin(0.07 * step + 1.1));
    }

    function correlation(left, right) {
      if (!left.length || left.length !== right.length) return NaN;
      var leftMean = left.reduce(function (sum, value) { return sum + value; }, 0) / left.length;
      var rightMean = right.reduce(function (sum, value) { return sum + value; }, 0) / right.length;
      var numerator = 0;
      var leftEnergy = 0;
      var rightEnergy = 0;
      for (var i = 0; i < left.length; i += 1) {
        var leftDelta = left[i] - leftMean;
        var rightDelta = right[i] - rightMean;
        numerator += leftDelta * rightDelta;
        leftEnergy += leftDelta * leftDelta;
        rightEnergy += rightDelta * rightDelta;
      }
      if (leftEnergy <= EPS || rightEnergy <= EPS) return 0;
      return numerator / Math.sqrt(leftEnergy * rightEnergy);
    }

    function residualStats(rows) {
      var usable = rows.filter(function (row) { return Number.isFinite(row.residual); });
      if (!usable.length) return { count: 0, rmse: NaN, mean: NaN, inputCorrelation: NaN, lagOneCorrelation: NaN };
      var residuals = usable.map(function (row) { return row.residual; });
      var inputs = usable.map(function (row) { return row.uPrev; });
      var mean = residuals.reduce(function (sum, value) { return sum + value; }, 0) / residuals.length;
      var rmse = Math.sqrt(residuals.reduce(function (sum, value) { return sum + value * value; }, 0) / residuals.length);
      var lagOneCorrelation = residuals.length > 1 ? correlation(residuals.slice(1), residuals.slice(0, -1)) : NaN;
      return {
        count: usable.length,
        rmse: rmse,
        mean: mean,
        inputCorrelation: correlation(residuals, inputs),
        lagOneCorrelation: lagOneCorrelation
      };
    }

    function gramCondition(g11, g12, g22) {
      var trace = g11 + g22;
      var determinant = g11 * g22 - g12 * g12;
      var discriminant = Math.max(0, trace * trace - 4 * determinant);
      var largest = (trace + Math.sqrt(discriminant)) / 2;
      var smallest = (trace - Math.sqrt(discriminant)) / 2;
      return smallest <= EPS ? Infinity : largest / smallest;
    }

    function fitArx(rows) {
      var training = rows.filter(function (row) { return row.split === "train"; });
      var g11 = 0;
      var g12 = 0;
      var g22 = 0;
      var h1 = 0;
      var h2 = 0;
      training.forEach(function (row) {
        g11 += row.yPrev * row.yPrev;
        g12 += row.yPrev * row.uPrev;
        g22 += row.uPrev * row.uPrev;
        h1 += row.yPrev * row.y;
        h2 += row.uPrev * row.y;
      });
      var determinant = g11 * g22 - g12 * g12;
      var scale = Math.max(1, Math.abs(g11 * g22), Math.abs(g12 * g12));
      var valid = Math.abs(determinant) > 1e-12 * scale;
      var theta = valid
        ? [(h1 * g22 - h2 * g12) / determinant, (g11 * h2 - g12 * h1) / determinant]
        : [NaN, NaN];
      return {
        valid: valid,
        theta: theta,
        trainingCount: training.length,
        gram: { g11: g11, g12: g12, g22: g22, determinant: determinant },
        conditionNumber: gramCondition(g11, g12, g22)
      };
    }

    function runExperiment(input) {
      var config = normalizeConfig(input);
      var trainEnd = Math.round(config.samples * 0.65);
      var inputs = [];
      var outputs = [0];
      for (var k = 0; k < config.samples; k += 1) inputs.push(inputAt(k, config));
      for (var step = 0; step < config.samples - 1; step += 1) {
        outputs.push(TRUE_A * outputs[step] + TRUE_B * inputs[step] + noiseAt(step + 1, config));
      }
      var rows = [];
      for (var index = 1; index < config.samples; index += 1) {
        rows.push({
          k: index,
          split: index < trainEnd ? "train" : "validation",
          uPrev: inputs[index - 1],
          yPrev: outputs[index - 1],
          y: outputs[index],
          prediction: NaN,
          residual: NaN
        });
      }
      var fit = fitArx(rows);
      rows.forEach(function (row) {
        if (fit.valid) {
          row.prediction = fit.theta[0] * row.yPrev + fit.theta[1] * row.uPrev;
          row.residual = row.y - row.prediction;
        }
      });
      var trainingRows = rows.filter(function (row) { return row.split === "train"; });
      var validationRows = rows.filter(function (row) { return row.split === "validation"; });
      var trainingStats = residualStats(trainingRows);
      var validationStats = residualStats(validationRows);
      var inputValues = inputs.slice(0, -1);
      var inputMean = inputValues.reduce(function (sum, value) { return sum + value; }, 0) / inputValues.length;
      var inputVariance = inputValues.reduce(function (sum, value) { return sum + (value - inputMean) * (value - inputMean); }, 0) / inputValues.length;
      return {
        config: config,
        trainEnd: trainEnd,
        inputs: inputs,
        outputs: outputs,
        rows: rows,
        fit: fit,
        trainingStats: trainingStats,
        validationStats: validationStats,
        metrics: {
          inputRms: Math.sqrt(inputValues.reduce(function (sum, value) { return sum + value * value; }, 0) / inputValues.length),
          inputVariance: inputVariance,
          conditionNumber: fit.conditionNumber,
          trainingRmse: trainingStats.rmse,
          validationRmse: validationStats.rmse,
          trainingInputCorrelation: trainingStats.inputCorrelation,
          validationInputCorrelation: validationStats.inputCorrelation,
          trainingLagOneCorrelation: trainingStats.lagOneCorrelation,
          validationLagOneCorrelation: validationStats.lagOneCorrelation
        }
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
        if (key === "className") node.setAttribute("class", String(value));
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

    function announce(api, rootNode, message) {
      if (api && typeof api.announce === "function") api.announce(rootNode, message);
    }

    function linePath(rows, key, mapX, mapY) {
      var parts = [];
      rows.forEach(function (row) {
        if (!Number.isFinite(row[key])) return;
        parts.push((parts.length ? "L" : "M") + mapX(row.k).toFixed(2) + " " + mapY(row[key]).toFixed(2));
      });
      return parts.join(" ");
    }

    function drawSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 420;
      var left = 48;
      var right = 17;
      var top = 26;
      var middle = 222;
      var bottom = 38;
      var outputValues = result.outputs.slice();
      result.rows.forEach(function (row) { if (Number.isFinite(row.prediction)) outputValues.push(row.prediction); });
      var outputMin = Math.min.apply(null, outputValues);
      var outputMax = Math.max.apply(null, outputValues);
      var outputPad = Math.max(0.1, (outputMax - outputMin) * 0.15);
      var residualValues = result.rows.filter(function (row) { return Number.isFinite(row.residual); }).map(function (row) { return row.residual; });
      var residualMin = residualValues.length ? Math.min.apply(null, residualValues) : -1;
      var residualMax = residualValues.length ? Math.max.apply(null, residualValues) : 1;
      var residualPad = Math.max(0.03, (residualMax - residualMin) * 0.2);
      var xMax = Math.max(1, result.config.samples - 1);
      var mapX = function (value) { return left + value / xMax * (width - left - right); };
      var mapOutput = function (value) { return top + (middle - top - 16) * (outputMax + outputPad - value) / (outputMax - outputMin + 2 * outputPad); };
      var mapResidual = function (value) { return middle + 20 + (height - bottom - (middle + 20)) * (residualMax + residualPad - value) / (residualMax - residualMin + 2 * residualPad); };
      svg.appendChild(svgElement(doc, "title", {}, "ARX 最小二乘训练验证残差"));
      svg.appendChild(svgElement(doc, "desc", {}, "蓝线是输出，橙色虚线是训练数据拟合的一步预测，绿色和红色分别是训练与验证残差。"));
      for (var i = 0; i <= 3; i += 1) {
        var yOutput = top + (middle - top - 16) * i / 3;
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: yOutput, x2: width - right, y2: yOutput, class: "sid-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: yOutput + 4, "text-anchor": "end", class: "sid-small" }, formatNumber(outputMax + outputPad - (outputMax - outputMin + 2 * outputPad) * i / 3, 2)));
        var yResidual = middle + 20 + (height - bottom - (middle + 20)) * i / 3;
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: yResidual, x2: width - right, y2: yResidual, class: "sid-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: yResidual + 4, "text-anchor": "end", class: "sid-small" }, formatNumber(residualMax + residualPad - (residualMax - residualMin + 2 * residualPad) * i / 3, 2)));
      }
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: middle - 8, x2: width - right, y2: middle - 8, class: "sid-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapResidual(0), x2: width - right, y2: mapResidual(0), class: "sid-zero" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows.map(function (row) { return { k: row.k, value: result.outputs[row.k] }; }), "value", mapX, mapOutput), class: "sid-output" }));
      if (result.fit.valid) svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows, "prediction", mapX, mapOutput), class: "sid-fit" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows.filter(function (row) { return row.split === "train"; }), "residual", mapX, mapResidual), class: "sid-train-residual" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows.filter(function (row) { return row.split === "validation"; }), "residual", mapX, mapResidual), class: "sid-validation-residual" }));
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + 13, class: "sid-label" }, "输出 y：实测 / 一步预测"));
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: middle + 13, class: "sid-label" }, "残差：训练 / 验证"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 9, "text-anchor": "end", class: "sid-small" }, "样本 k"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "sid-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function renderLedger(doc, hostNode, result) {
      var body = element(doc, "tbody");
      result.rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(row.k) }),
          element(doc, "td", { text: row.split === "train" ? "训练" : "验证" }),
          element(doc, "td", { text: formatNumber(row.uPrev, 3) }),
          element(doc, "td", { text: formatNumber(row.yPrev, 3) }),
          element(doc, "td", { text: formatNumber(row.y, 3) }),
          element(doc, "td", { text: formatNumber(row.prediction, 3) }),
          element(doc, "td", { text: formatNumber(row.residual, 3) })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "ARX(1,1) 逐样本透明账本；训练与验证分界固定为约 65%" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "k" }),
          element(doc, "th", { text: "split" }),
          element(doc, "th", { text: "uₖ₋₁" }),
          element(doc, "th", { text: "yₖ₋₁" }),
          element(doc, "th", { text: "yₖ" }),
          element(doc, "th", { text: "ŷₖ" }),
          element(doc, "th", { text: "eₖ" })
        ])]),
        body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "excitation",
          prompt: "对两个 ARX 参数做最小二乘，哪种输入更有利于可辨识？",
          expected: "rich",
          choices: [
            { value: "rich", label: "覆盖动态的丰富激励" },
            { value: "flat", label: "始终为零的输入" },
            { value: "silent", label: "只采静态终点" }
          ]
        },
        {
          key: "validation",
          prompt: "验证残差的主要作用是什么？",
          expected: "generalize",
          choices: [
            { value: "generalize", label: "检验未参与拟合的数据" },
            { value: "fit", label: "让训练残差自动变成 0" },
            { value: "rank", label: "替代能控性证书" }
          ]
        },
        {
          key: "noise",
          prompt: "固定激励下增大输出噪声，通常会怎样？",
          expected: "larger",
          choices: [
            { value: "larger", label: "残差和参数不确定性变大" },
            { value: "smaller", label: "残差必然变成 0" },
            { value: "same", label: "完全不影响条件数或残差" }
          ]
        }
      ];
    }

    function renderPredictions(state, refs) {
      var specs = questionSpecs();
      refs.questions.forEach(function (question, index) {
        var spec = specs[index];
        question.buttons.forEach(function (button) {
          var selected = state.predictions[spec.key] === button.value;
          button.node.setAttribute("aria-pressed", selected ? "true" : "false");
          if (!state.revealed) {
            button.node.textContent = button.label;
            button.node.className = "";
          } else {
            var correct = button.value === spec.expected;
            button.node.textContent = (correct ? "✓ " : "") + button.label;
            button.node.className = correct ? "sid-correct" : selected ? "sid-wrong" : "";
          }
        });
      });
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      installStyles(doc);
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      var refs = { questions: [] };
      var shell = element(doc, "div", { className: "sid-lab" });
      shell.appendChild(element(doc, "h3", { text: "系统辨识实验：ARX 最小二乘、激励与验证" }));
      shell.appendChild(element(doc, "p", { className: "sid-note", text: "真实对象固定为 yₖ₊₁=0.82yₖ+0.28uₖ+eₖ；eₖ 是固定公式生成的可复现输出扰动。只用训练段估计 a,b，再在验证段检查一步预测，不把验证数据偷偷回灌。" }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "sid-choice-grid" });
        var question = { key: spec.key, buttons: [] };
        spec.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
          button.addEventListener("click", function () {
            state.predictions[spec.key] = choice.value;
            state.feedback = "";
            render();
          });
          question.buttons.push({ value: choice.value, label: choice.label, node: button });
          grid.appendChild(button);
        });
        fieldset.appendChild(grid);
        predictionHost.appendChild(fieldset);
        refs.questions.push(question);
      });
      var actions = element(doc, "div", { className: "sid-actions" });
      var reveal = element(doc, "button", { type: "button", className: "sid-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "sid-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controlRefs = {};

      function makeRange(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
        var output = element(doc, "output", { text: formatNumber(state.config[key], digits) });
        controlRefs[key] = { input: input, output: output, digits: digits };
        return element(doc, "div", { className: "sid-control" }, [
          element(doc, "label", {}, [label + " = ", output]),
          input
        ]);
      }

      function makeModeSelect() {
        var select = element(doc, "select", { "aria-label": "激励模式" });
        [
          ["rich", "丰富交替激励"],
          ["step", "单次阶跃激励"],
          ["flat", "无激励边界"]
        ].forEach(function (option) {
          select.appendChild(element(doc, "option", { value: option[0], text: option[1] }));
        });
        select.value = state.config.mode;
        controlRefs.mode = { input: select };
        return element(doc, "div", { className: "sid-control" }, [
          element(doc, "label", { text: "输入激励模式" }),
          select
        ]);
      }

      var controls = element(doc, "div", { className: "sid-controls" }, [
        makeModeSelect(),
        makeRange("amplitude", "激励幅值", 0.05, 1.5, 0.05, 2),
        makeRange("noise", "确定性噪声幅值", 0, 0.2, 0.01, 2),
        makeRange("samples", "样本数", 48, 96, 1, 0),
        element(doc, "p", { className: "sid-note", text: "回归向量 φₖ=[yₖ₋₁,uₖ₋₁]ᵀ，θ=[a,b]ᵀ。训练段约占 65%；验证残差只做诊断。无激励模式用于观察 Gram 矩阵奇异边界。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 420", role: "img", "aria-label": "系统辨识输出和训练验证残差" });
      var svgFrame = element(doc, "div", { className: "sid-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "sid-metrics" });
      var tableHost = element(doc, "div", { className: "sid-table-wrap" });
      var certificate = element(doc, "div", { className: "sid-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "sid-layout" }, [
        controls,
        element(doc, "div", { className: "sid-stage" }, [svgFrame, metricsHost, tableHost, certificate])
      ]));
      shell.appendChild(predictionHost);
      shell.appendChild(actions);
      shell.appendChild(feedback);
      shell.appendChild(resultShell);
      clear(rootNode);
      rootNode.appendChild(shell);

      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
          state.feedback = "请先完成三项预测；参数估计、条件数和训练/验证残差会在提交后出现。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。调激励或噪声不会重新上锁。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "系统辨识预测、图和账本已重置。");
      });
      controlRefs.mode.input.addEventListener("change", function () {
        var next = Object.assign({}, state.config);
        next.mode = controlRefs.mode.input.value;
        state.config = normalizeConfig(next);
        state.feedback = "";
        render();
      });
      ["amplitude", "noise", "samples"].forEach(function (key) {
        controlRefs[key].input.addEventListener("input", function () {
          var next = Object.assign({}, state.config);
          next[key] = Number(controlRefs[key].input.value);
          state.config = normalizeConfig(next);
          state.feedback = "";
          render();
        });
      });

      function render() {
        var result = runExperiment(state.config);
        controlRefs.mode.input.value = result.config.mode;
        ["amplitude", "noise", "samples"].forEach(function (key) {
          controlRefs[key].input.value = String(result.config[key]);
          controlRefs[key].output.textContent = formatNumber(result.config[key], controlRefs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "sid-feedback" + (state.feedback.indexOf("请先") === 0 ? " sid-wrong" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "估计 a", formatNumber(result.fit.theta[0], 4)));
        metricsHost.appendChild(metric(doc, "估计 b", formatNumber(result.fit.theta[1], 4)));
        metricsHost.appendChild(metric(doc, "Gram cond₂", Number.isFinite(result.metrics.conditionNumber) ? formatNumber(result.metrics.conditionNumber, 2) : "∞"));
        metricsHost.appendChild(metric(doc, "训练 RMSE", formatNumber(result.metrics.trainingRmse, 4)));
        metricsHost.appendChild(metric(doc, "验证 RMSE", formatNumber(result.metrics.validationRmse, 4)));
        metricsHost.appendChild(metric(doc, "输入方差", formatNumber(result.metrics.inputVariance, 4)));
        metricsHost.appendChild(metric(doc, "训练 e/u 相关", formatNumber(result.metrics.trainingInputCorrelation, 3)));
        metricsHost.appendChild(metric(doc, "验证 lag-1 e 相关", formatNumber(result.metrics.validationLagOneCorrelation, 3)));
        renderLedger(doc, tableHost, result);
        clear(certificate);
        if (result.fit.valid) {
          certificate.appendChild(element(doc, "p", { text: "最小二乘证书：θ̂=(ΦᵀΦ)⁻¹Φᵀy，训练样本 " + result.fit.trainingCount + " 行；真实参数为 a=" + TRUE_A + "、b=" + TRUE_B + "，当前估计为 a=" + formatNumber(result.fit.theta[0], 4) + "、b=" + formatNumber(result.fit.theta[1], 4) + "。" }));
          certificate.appendChild(element(doc, "p", { text: "Gram 账本：g₁₁=" + formatNumber(result.fit.gram.g11, 3) + "，g₁₂=" + formatNumber(result.fit.gram.g12, 3) + "，g₂₂=" + formatNumber(result.fit.gram.g22, 3) + "，det=" + formatNumber(result.fit.gram.determinant, 3) + "，cond₂=" + (Number.isFinite(result.fit.conditionNumber) ? formatNumber(result.fit.conditionNumber, 2) : "∞") + "。" }));
        } else {
          certificate.appendChild(element(doc, "p", { text: "不可辨识边界：训练 Gram 矩阵奇异或近奇异，不能从这批数据唯一解出 a,b；结果区保留原始输出和输入账本，不伪造参数。" }));
        }
        certificate.appendChild(element(doc, "p", { text: "残差诊断只在相应噪声模型、模型阶次和数据采集条件下解释：开环外生输入时 e 与 u 的不相关更直接；闭环中反馈会让输入与噪声相关，需闭环辨识或工具变量。白性/不相关是诊断，不是稳定性或跟踪保证。" }));
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var baseline = runExperiment(DEFAULTS);
      var repeat = runExperiment(DEFAULTS);
      check(baseline.fit.valid, "rich excitation is identifiable");
      check(baseline.rows.length === DEFAULTS.samples - 1, "fixed data length");
      check(JSON.stringify(baseline.outputs) === JSON.stringify(repeat.outputs), "deterministic output data");
      check(Number.isFinite(baseline.metrics.conditionNumber), "finite Gram condition number");
      check(Number.isFinite(baseline.metrics.trainingRmse) && Number.isFinite(baseline.metrics.validationRmse), "training and validation residuals");
      check(Math.abs(baseline.fit.theta[0] - TRUE_A) < 0.08, "a estimate near truth");
      check(Math.abs(baseline.fit.theta[1] - TRUE_B) < 0.08, "b estimate near truth");
      var flat = runExperiment({ mode: "flat", amplitude: 1, noise: 0, samples: DEFAULTS.samples });
      check(!flat.fit.valid && !Number.isFinite(flat.fit.conditionNumber), "no excitation singular boundary");
      var noisy = runExperiment({ mode: "rich", amplitude: 1, noise: 0.18, samples: DEFAULTS.samples });
      check(noisy.metrics.trainingRmse > baseline.metrics.trainingRmse, "noise raises residual scale");
      check(formatNumber(100, 0) === "100", "integer trailing zero formatting");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      inputAt: inputAt,
      fitArx: fitArx,
      runExperiment: runExperiment,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
