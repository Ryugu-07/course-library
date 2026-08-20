(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("contour-winding", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("contour-winding self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("contour-winding self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : this,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "contour-winding-lab-styles";
    var INSTANCE = 0;
    var EPS = 1e-10;
    var TWO_PI = 2 * Math.PI;

    var PRESETS = [
      {
        id: "inside",
        label: "奇点在内",
        note: "a=0.35+0.18i；两条围道都绕过同一个奇点。",
        pole: [0.35, 0.18],
        radius: 1,
        shape: 0.16
      },
      {
        id: "outside",
        label: "奇点在外",
        note: "a=1.35+0.18i；围道所在解析区没有奇点。",
        pole: [1.35, 0.18],
        radius: 1,
        shape: 0.16
      },
      {
        id: "crossing",
        label: "奇点在路径上",
        note: "a=1；基准圆在 t=0 处经过极点，积分和 winding 都不定义。",
        pole: [1, 0],
        radius: 1,
        shape: 0
      }
    ];

    var STYLE_TEXT = [
      ".cw-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere;}",
      ".cw-lab *,.cw-lab *::before,.cw-lab *::after{box-sizing:border-box}.cw-lab [hidden]{display:none!important}",
      ".cw-lab h3,.cw-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.cw-lab h3{font-size:1.12rem}.cw-lab h4{font-size:1rem}",
      ".cw-lab p{margin:8px 0}.cw-lab .cw-note,.cw-lab .cw-feedback,.cw-lab .cw-detail{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
      ".cw-lab button,.cw-lab input{font:inherit}.cw-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.cw-lab button:hover{border-color:var(--accent,#1769aa)}.cw-lab button:focus-visible,.cw-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.cw-lab button[aria-pressed=true],.cw-lab button.cw-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.cw-lab button:disabled{cursor:not-allowed;opacity:.55}",
      ".cw-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.cw-lab legend{max-width:100%;padding:0 4px;color:var(--fg,#20252b);font-size:13px;font-weight:750;line-height:1.5}.cw-lab .cw-button-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.cw-lab .cw-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.cw-lab .cw-actions>*{flex:1 1 160px}",
      ".cw-lab .cw-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}.cw-lab .cw-presets button{font-size:12px}.cw-lab .cw-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(190px,.75fr);gap:12px;margin:12px 0;align-items:start}.cw-lab .cw-control{min-width:0;display:grid;gap:4px}.cw-lab .cw-control label{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.cw-lab .cw-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums}.cw-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#1769aa)}",
      ".cw-lab .cw-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#9a6b12);background:var(--block-bg,var(--bg,#fff))}.cw-lab .cw-prediction-title{display:block;margin-bottom:8px;font-size:13px}.cw-lab .cw-question{margin:10px 0}.cw-lab .cw-question-label{display:block;margin-bottom:6px;font-size:13px;font-weight:700}.cw-lab .cw-question .cw-button-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.cw-lab .cw-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.cw-lab .cw-pass{color:var(--cl-green,#2f7547)}.cw-lab .cw-warn{color:var(--cl-red,#b43d32)}",
      ".cw-lab .cw-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#c8cdd3)}.cw-lab .cw-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.cw-lab .cw-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff))}.cw-lab .cw-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.cw-lab .cw-metric:nth-child(4n+2){border-color:var(--cl-green,#2f7547)}.cw-lab .cw-metric:nth-child(4n+3){border-color:var(--cl-gold,#9a6b12)}.cw-lab .cw-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.cw-lab .cw-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px;line-height:1.4}.cw-lab .cw-metric strong{display:block;margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".cw-lab .cw-stage{min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff))}.cw-lab .cw-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b)}.cw-lab .cw-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.cw-lab .cw-frame{max-width:100%;overflow-x:auto}.cw-lab .cw-svg .cw-grid{stroke:currentColor;stroke-opacity:.16;stroke-width:1}.cw-lab .cw-svg .cw-axis{stroke:currentColor;stroke-opacity:.62;stroke-width:1.1}.cw-lab .cw-svg .cw-base{fill:none;stroke:var(--cl-blue,#2c6aa0);stroke-width:2;stroke-dasharray:6 5}.cw-lab .cw-svg .cw-current{fill:none;stroke:var(--cl-green,#2f7547);stroke-width:2.8}.cw-lab .cw-svg .cw-singular{fill:none;stroke:var(--cl-red,#b43d32);stroke-width:2.6;stroke-dasharray:4 4}.cw-lab .cw-svg .cw-pole{fill:var(--cl-red,#b43d32);stroke:var(--bg,#fff);stroke-width:2}.cw-lab .cw-svg .cw-pole-cross{stroke:var(--cl-red,#b43d32);stroke-width:1.8}.cw-lab .cw-svg .cw-text{font-size:11px}.cw-lab .cw-svg .cw-small{font-size:10px;fill:var(--fg-soft,var(--muted,#5d6873))}.cw-lab .cw-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin:7px 0 0;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.cw-lab .cw-legend span{display:inline-flex;align-items:center;gap:5px}.cw-lab .cw-swatch{display:inline-block;width:18px;height:3px}.cw-lab .cw-swatch-base{background:var(--cl-blue,#2c6aa0);border-top:1px dashed var(--cl-blue,#2c6aa0)}.cw-lab .cw-swatch-current{background:var(--cl-green,#2f7547)}.cw-lab .cw-swatch-pole{width:10px;height:10px;border-radius:50%;background:var(--cl-red,#b43d32)}",
      ".cw-lab .cw-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.cw-lab table{width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.cw-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.cw-lab th,.cw-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.cw-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.cw-lab td strong{font-weight:750}.cw-lab .cw-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--cl-green,#2f7547);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}.cw-lab .cw-status{margin:10px 0 0;color:var(--fg-soft,var(--muted,#5d6873));font-size:13px}",
      "@media(max-width:820px){.cw-lab .cw-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.cw-lab .cw-question .cw-button-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media(max-width:620px){.cw-lab .cw-controls{grid-template-columns:minmax(0,1fr)}.cw-lab .cw-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.cw-lab .cw-question .cw-button-grid{grid-template-columns:minmax(0,1fr)}}",
      "@media(max-width:420px){.cw-lab .cw-presets,.cw-lab .cw-metrics{grid-template-columns:minmax(0,1fr)}.cw-lab .cw-prediction{padding:10px}.cw-lab .cw-stage{padding:4px}}",
      "@media(prefers-reduced-motion:reduce){.cw-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && Number.isFinite(value);
    }

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function close(a, b, tolerance) {
      return Math.abs(a - b) <= (tolerance === undefined ? 1e-9 : tolerance);
    }

    function pointClose(a, b, tolerance) {
      return Math.hypot(a[0] - b[0], a[1] - b[1]) <= (tolerance === undefined ? 1e-9 : tolerance);
    }

    function add(a, b) {
      return [a[0] + b[0], a[1] + b[1]];
    }

    function subtract(a, b) {
      return [a[0] - b[0], a[1] - b[1]];
    }

    function scale(a, factor) {
      return [a[0] * factor, a[1] * factor];
    }

    function magnitude(a) {
      return Math.hypot(a[0], a[1]);
    }

    function presetById(id) {
      var found = PRESETS[0];
      PRESETS.forEach(function (preset) {
        if (preset.id === id) found = preset;
      });
      return found;
    }

    function normalizeConfig(input) {
      var raw = input || {};
      var preset = presetById(raw.preset || raw.presetId);
      var orientation = Number(raw.orientation === undefined ? 1 : raw.orientation);
      var shape = Number(raw.shape === undefined ? preset.shape : raw.shape);
      var subdivisions = Math.round(Number(raw.subdivisions === undefined ? 64 : raw.subdivisions));
      var pole = Array.isArray(raw.pole) && raw.pole.length === 2 ? raw.pole : preset.pole;
      return {
        presetId: preset.id,
        label: preset.label,
        note: preset.note,
        pole: [Number(pole[0]), Number(pole[1])],
        radius: Number(raw.radius === undefined ? preset.radius : raw.radius),
        shape: clamp(finite(shape) ? shape : preset.shape, 0, 0.24),
        orientation: orientation < 0 ? -1 : 1,
        subdivisions: clamp(finite(subdivisions) ? subdivisions : 64, 16, 256)
      };
    }

    function contourPoint(config, parameter, shape) {
      var radialFactor = 1 + shape * Math.cos(3 * parameter);
      var radius = config.radius * radialFactor;
      return [radius * Math.cos(parameter), config.orientation * radius * Math.sin(parameter)];
    }

    function sampleContour(config, shape, subdivisions) {
      var count = Math.max(16, Math.round(subdivisions));
      var points = [];
      var index;
      for (index = 0; index <= count; index += 1) {
        points.push(contourPoint(config, (TWO_PI * index) / count, shape));
      }
      return points;
    }

    function windingNumber(points, pole) {
      var total = 0;
      var index;
      for (index = 0; index < points.length - 1; index += 1) {
        var first = subtract(points[index], pole);
        var second = subtract(points[index + 1], pole);
        var firstLength = magnitude(first);
        var secondLength = magnitude(second);
        if (firstLength <= EPS || secondLength <= EPS) return null;
        total += Math.atan2(first[0] * second[1] - first[1] * second[0], first[0] * second[0] + first[1] * second[1]);
      }
      return total / TWO_PI;
    }

    function roundedWinding(points, pole) {
      var value = windingNumber(points, pole);
      return value === null ? null : Math.round(value);
    }

    function integrate(points, pole) {
      var real = 0;
      var imaginary = 0;
      var index;
      for (index = 0; index < points.length - 1; index += 1) {
        var z0 = points[index];
        var z1 = points[index + 1];
        var d0 = subtract(z0, pole);
        var d1 = subtract(z1, pole);
        var denominator0 = d0[0] * d0[0] + d0[1] * d0[1];
        var denominator1 = d1[0] * d1[0] + d1[1] * d1[1];
        if (denominator0 <= EPS * EPS || denominator1 <= EPS * EPS) {
          return { valid: false, singularOnPath: true, real: null, imaginary: null, magnitude: null };
        }
        var f0 = [d0[0] / denominator0, -d0[1] / denominator0];
        var f1 = [d1[0] / denominator1, -d1[1] / denominator1];
        var dz = subtract(z1, z0);
        var average = scale(add(f0, f1), 0.5);
        real += average[0] * dz[0] - average[1] * dz[1];
        imaginary += average[0] * dz[1] + average[1] * dz[0];
      }
      return {
        valid: true,
        singularOnPath: false,
        real: real,
        imaginary: imaginary,
        magnitude: Math.hypot(real, imaginary)
      };
    }

    function exactIntegral(winding) {
      return winding === null ? null : [0, TWO_PI * winding];
    }

    function complexError(numerical, exact) {
      return numerical.valid && exact ? Math.hypot(numerical.real - exact[0], numerical.imaginary - exact[1]) : null;
    }

    function evaluate(input) {
      var config = normalizeConfig(input);
      var currentPoints = sampleContour(config, config.shape, config.subdivisions);
      var basePoints = sampleContour(config, 0, config.subdivisions);
      var currentWinding = roundedWinding(currentPoints, config.pole);
      var baseWinding = roundedWinding(basePoints, config.pole);
      var currentNumerical = integrate(currentPoints, config.pole);
      var baseNumerical = integrate(basePoints, config.pole);
      var currentExact = exactIntegral(currentWinding);
      var baseExact = exactIntegral(baseWinding);
      var deformationDifference = currentNumerical.valid && baseNumerical.valid
        ? Math.hypot(currentNumerical.real - baseNumerical.real, currentNumerical.imaginary - baseNumerical.imaginary)
        : null;
      var sameAnalyticClass = currentWinding !== null && baseWinding !== null && currentWinding === baseWinding;
      return {
        config: config,
        current: {
          points: currentPoints,
          winding: currentWinding,
          numerical: currentNumerical,
          exact: currentExact,
          numericalError: complexError(currentNumerical, currentExact)
        },
        base: {
          points: basePoints,
          winding: baseWinding,
          numerical: baseNumerical,
          exact: baseExact,
          numericalError: complexError(baseNumerical, baseExact)
        },
        deformationDifference: deformationDifference,
        sameAnalyticClass: sameAnalyticClass,
        singularOnPath: currentNumerical.singularOnPath,
        quadrature: {
          method: "closed composite trapezoid on z(t)",
          subdivisions: config.subdivisions
        }
      };
    }

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, "contour-winding self-test failed: " + message);
      }

      var inside = evaluate({ preset: "inside", orientation: 1, shape: 0.16, subdivisions: 64 });
      check(inside.current.winding === 1, "counterclockwise winding is +1");
      check(inside.base.winding === 1, "base winding is +1");
      check(inside.current.exact && close(inside.current.exact[1], TWO_PI, 1e-12), "residue-free exact integral ledger");
      check(inside.current.numericalError < 0.02, "trapezoid approximates regular contour");
      check(inside.sameAnalyticClass, "deformation stays in the same analytic class");
      check(inside.deformationDifference !== null && inside.deformationDifference < 0.02, "deformation integral agrees numerically");

      var reversed = evaluate({ preset: "inside", orientation: -1, shape: 0.16, subdivisions: 64 });
      check(reversed.current.winding === -1, "reverse parameter direction flips winding");
      check(reversed.current.exact && close(reversed.current.exact[1], -TWO_PI, 1e-12), "reverse parameter direction flips integral");
      check(reversed.current.numericalError < 0.02, "reverse contour quadrature remains regular");

      var outside = evaluate({ preset: "outside", orientation: 1, shape: 0.16, subdivisions: 64 });
      check(outside.current.winding === 0 && outside.current.exact && close(outside.current.exact[1], 0, 1e-12), "outside pole has zero winding and integral");
      check(outside.current.numericalError < 0.02, "outside contour quadrature error is finite");

      var crossing = evaluate({ preset: "crossing", orientation: 1, shape: 0, subdivisions: 64 });
      check(crossing.singularOnPath, "path crossing is flagged separately");
      check(crossing.current.winding === null && crossing.current.exact === null, "winding and exact integral are undefined on a pole");
      check(crossing.current.numericalError === null, "singularity is not reported as a quadrature error");

      var coarse = evaluate({ preset: "inside", orientation: 1, shape: 0.16, subdivisions: 16 });
      var fine = evaluate({ preset: "inside", orientation: 1, shape: 0.16, subdivisions: 128 });
      check(fine.current.numericalError <= coarse.current.numericalError + 1e-10, "refining quadrature does not worsen the regular test");
      check(PRESETS.length === 3, "three distinct teaching presets");
      return { checks: checks, presets: PRESETS.length };
    }

    function setAttributes(node, attrs) {
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "htmlFor") node.setAttribute("for", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (key === "checked" || key === "selected") {
          if (value) node.setAttribute(key, "");
        } else if (key === "value") {
          node.value = String(value);
        } else {
          node.setAttribute(key, String(value));
        }
      });
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      setAttributes(node, attrs || {});
      (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
      });
      return node;
    }

    function svgElement(doc, tag, attrs, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      setAttributes(node, attrs || {});
      (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
      });
      return node;
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function injectStyles(doc) {
      if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement || doc.body).appendChild(style);
    }

    function formatNumber(value, digits) {
      return finite(value) ? value.toFixed(digits === undefined ? 5 : digits) : "未定义";
    }

    function formatComplex(value) {
      if (!value || !finite(value.real) || !finite(value.imaginary)) return "未定义";
      return formatNumber(value.real, 5) + (value.imaginary < 0 ? " − " : " + ") + formatNumber(Math.abs(value.imaginary), 5) + "i";
    }

    function makeMetric(doc, label) {
      var value = element(doc, "strong", {}, "-");
      return { card: element(doc, "div", { className: "cw-metric" }, [element(doc, "span", {}, label), value]), value: value };
    }

    function pathForPoints(points, mapX, mapY) {
      return points.map(function (point, index) {
        return (index === 0 ? "M" : "L") + mapX(point[0]).toFixed(2) + "," + mapY(point[1]).toFixed(2);
      }).join(" ");
    }

    function buildLab(root, api) {
      var doc = root.ownerDocument || document;
      var state = {
        presetId: "inside",
        orientation: 1,
        shape: 0.16,
        subdivisions: 64,
        answers: { winding: null, deformation: null, direction: null, error: null },
        revealed: false
      };
      var presetButtons = [];
      var questionButtons = {};
      var shapeInput;
      var shapeOutput;
      var subdivisionInput;
      var subdivisionOutput;
      var directionButtons = [];
      var feedback;
      var results;
      var status;
      var metrics;
      var ledger;
      var stage;

      INSTANCE += 1;
      injectStyles(doc);
      root.classList.add("cw-lab");

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function selectedPreset() {
        return presetById(state.presetId);
      }

      function expectedAnswers() {
        var preview = evaluate({
          preset: state.presetId,
          orientation: state.orientation,
          shape: state.shape,
          subdivisions: state.subdivisions
        });
        return {
          winding: preview.current.winding === null ? "undefined" : String(preview.current.winding),
          deformation: preview.sameAnalyticClass ? "same" : "not-available",
          direction: preview.current.winding === null ? "undefined" : "flip",
          error: "separate"
        };
      }

      function lock(message) {
        state.answers = { winding: null, deformation: null, direction: null, error: null };
        state.revealed = false;
        if (results) results.hidden = true;
        if (feedback) {
          feedback.className = "cw-feedback";
          feedback.textContent = message || "参数已改变；先重新回答预测门。";
        }
        renderPredictionButtons();
      }

      function makeQuestion(key, label, choices) {
        var buttons = [];
        var grid = element(doc, "div", { className: "cw-button-grid", role: "group", "aria-label": label });
        choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
          button.addEventListener("click", function () {
            state.answers[key] = choice.value;
            renderPredictionButtons();
          });
          buttons.push({ button: button, value: choice.value });
          grid.appendChild(button);
        });
        questionButtons[key] = buttons;
        return element(doc, "div", { className: "cw-question" }, [element(doc, "span", { className: "cw-question-label" }, label), grid]);
      }

      function renderPredictionButtons() {
        Object.keys(questionButtons).forEach(function (key) {
          questionButtons[key].forEach(function (entry) {
            entry.button.setAttribute("aria-pressed", state.answers[key] === entry.value ? "true" : "false");
          });
        });
      }

      function addRow(tableBody, cells) {
        var row = element(doc, "tr");
        cells.forEach(function (cell, index) {
          row.appendChild(element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell));
        });
        tableBody.appendChild(row);
      }

      function drawSvg(result) {
        clear(stage);
        var svg = svgElement(doc, "svg", {
          className: "cw-svg",
          viewBox: "0 0 720 330",
          role: "img",
          "aria-label": "当前围道、基准圆、奇点和 winding number"
        });
        var plot = { left: 42, top: 22, width: 340, height: 280, min: -1.35, max: 1.35 };
        var mapX = function (x) { return plot.left + ((x - plot.min) / (plot.max - plot.min)) * plot.width; };
        var mapY = function (y) { return plot.top + plot.height - ((y - plot.min) / (plot.max - plot.min)) * plot.height; };
        var zeroX = mapX(0);
        var zeroY = mapY(0);
        var defs = svgElement(doc, "defs");
        var marker = svgElement(doc, "marker", { id: "cw-arrow-" + INSTANCE, markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: "auto" });
        marker.appendChild(svgElement(doc, "path", { d: "M0,0 L7,3.5 L0,7 z", fill: "var(--cl-green,#2f7547)" }));
        defs.appendChild(marker);
        svg.appendChild(defs);
        svg.appendChild(svgElement(doc, "rect", { x: plot.left, y: plot.top, width: plot.width, height: plot.height, fill: "var(--bg,#fff)", stroke: "var(--border,#c8cdd3)" }));
        [-1, 0, 1].forEach(function (tick) {
          svg.appendChild(svgElement(doc, "line", { className: "cw-grid", x1: mapX(tick), y1: plot.top, x2: mapX(tick), y2: plot.top + plot.height }));
          svg.appendChild(svgElement(doc, "line", { className: "cw-grid", x1: plot.left, y1: mapY(tick), x2: plot.left + plot.width, y2: mapY(tick) }));
          svg.appendChild(svgElement(doc, "text", { className: "cw-small", x: mapX(tick), y: plot.top + plot.height + 16, "text-anchor": "middle" }, String(tick)));
          svg.appendChild(svgElement(doc, "text", { className: "cw-small", x: plot.left - 7, y: mapY(tick) + 4, "text-anchor": "end" }, String(tick)));
        });
        svg.appendChild(svgElement(doc, "line", { className: "cw-axis", x1: plot.left, y1: zeroY, x2: plot.left + plot.width, y2: zeroY }));
        svg.appendChild(svgElement(doc, "line", { className: "cw-axis", x1: zeroX, y1: plot.top, x2: zeroX, y2: plot.top + plot.height }));
        svg.appendChild(svgElement(doc, "path", { className: result.base.numerical.valid ? "cw-base" : "cw-singular", d: pathForPoints(result.base.points, mapX, mapY) }));
        svg.appendChild(svgElement(doc, "path", { className: result.current.numerical.valid ? "cw-current" : "cw-singular", d: pathForPoints(result.current.points, mapX, mapY), "marker-end": "url(#cw-arrow-" + INSTANCE + ")" }));
        var poleX = mapX(result.config.pole[0]);
        var poleY = mapY(result.config.pole[1]);
        svg.appendChild(svgElement(doc, "circle", { className: "cw-pole", cx: poleX, cy: poleY, r: 6 }));
        svg.appendChild(svgElement(doc, "line", { className: "cw-pole-cross", x1: poleX - 10, y1: poleY - 10, x2: poleX + 10, y2: poleY + 10 }));
        svg.appendChild(svgElement(doc, "line", { className: "cw-pole-cross", x1: poleX - 10, y1: poleY + 10, x2: poleX + 10, y2: poleY - 10 }));
        svg.appendChild(svgElement(doc, "text", { className: "cw-text", x: poleX + 9, y: poleY - 8 }, "a（奇点）"));
        svg.appendChild(svgElement(doc, "text", { className: "cw-small", x: 212, y: 319, "text-anchor": "middle" }, "Re z"));
        svg.appendChild(svgElement(doc, "text", { className: "cw-small", x: 12, y: 166, transform: "rotate(-90 12 166)", "text-anchor": "middle" }, "Im z"));
        svg.appendChild(svgElement(doc, "text", { className: "cw-text", x: 438, y: 45 }, "当前围道"));
        svg.appendChild(svgElement(doc, "text", { className: "cw-small", x: 438, y: 65 }, "orientation=" + (result.config.orientation > 0 ? "CCW" : "CW") + "；形变=" + formatNumber(result.config.shape, 2)));
        svg.appendChild(svgElement(doc, "text", { className: "cw-text", x: 438, y: 102 }, "当前 winding"));
        svg.appendChild(svgElement(doc, "text", { className: "cw-small", x: 438, y: 122 }, result.current.winding === null ? "未定义（奇点在路径上）" : String(result.current.winding)));
        svg.appendChild(svgElement(doc, "text", { className: "cw-text", x: 438, y: 159 }, "基准圆 winding"));
        svg.appendChild(svgElement(doc, "text", { className: "cw-small", x: 438, y: 179 }, result.base.winding === null ? "未定义" : String(result.base.winding)));
        svg.appendChild(svgElement(doc, "text", { className: "cw-text", x: 438, y: 216 }, "数值求积"));
        svg.appendChild(svgElement(doc, "text", { className: "cw-small", x: 438, y: 236 }, "N=" + result.quadrature.subdivisions + "；闭合梯形"));
        svg.appendChild(svgElement(doc, "text", { className: "cw-small", x: 438, y: 263 }, result.singularOnPath ? "路径命中奇点：不定义" : "误差单列，不等于拓扑变化"));
        stage.appendChild(svg);
      }

      function renderResult(result) {
        var currentExact = result.current.exact;
        metrics[0].value.textContent = result.current.winding === null ? "未定义" : String(result.current.winding);
        metrics[1].value.textContent = currentExact ? formatNumber(currentExact[0], 3) + " + " + formatNumber(currentExact[1], 3) + "i" : "未定义";
        metrics[2].value.textContent = formatComplex(result.current.numerical);
        metrics[3].value.textContent = result.current.numericalError === null ? "未定义" : formatNumber(result.current.numericalError, 6);
        drawSvg(result);
        clear(ledger);
        var body = element(doc, "tbody");
        addRow(body, ["参数化方向", result.config.orientation > 0 ? "逆时针；dz 随 t 正向" : "顺时针；积分与 winding 变号"]);
        addRow(body, ["winding number", result.current.winding === null ? "未定义：路径含奇点" : String(result.current.winding)]);
        addRow(body, ["解析基准", result.current.exact ? formatComplex({ real: result.current.exact[0], imaginary: result.current.exact[1] }) : "不适用"]);
        addRow(body, ["N 段闭合梯形", formatComplex(result.current.numerical)]);
        addRow(body, ["数值求积误差", result.current.numericalError === null ? "不计算：先报告奇点" : formatNumber(result.current.numericalError, 8)]);
        addRow(body, ["解析区内形变", result.sameAnalyticClass ? "基准圆与当前围道 winding 相同；差值=" + formatNumber(result.deformationDifference, 8) : "不适用：两条围道未构成同一无奇点形变"]);
        ledger.appendChild(body);
        status.textContent = result.singularOnPath
          ? "当前路径经过 a：积分、winding 与解析基准都不定义；这不是一个很大的数值误差。"
          : "先读 winding 与解析值，再读 N=" + result.quadrature.subdivisions + " 的数值误差；两条账不能合并。";
      }

      var shell = element(doc, "div", { className: "cw-shell" });
      shell.appendChild(element(doc, "h3", {}, "复积分账本：方向、winding、形变与求积"));
      shell.appendChild(element(doc, "p", { className: "cw-note" }, "被积函数固定为 f(z)=1/(z−a)。脚本只用确定性参数化和闭合复合梯形；解析值由 winding number 单独给出。"));

      var presetSection = element(doc, "section", { className: "cw-control-section" }, [element(doc, "h4", {}, "围道与奇点预设")]);
      var presetGrid = element(doc, "div", { className: "cw-presets", role: "group", "aria-label": "围道预设" });
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
        button.addEventListener("click", function () {
          state.presetId = preset.id;
          state.shape = preset.shape;
          shapeInput.value = String(state.shape);
          lock("已切换到" + preset.label + "；预测门重新上锁。");
          renderControls();
        });
        presetButtons.push(button);
        presetGrid.appendChild(button);
      });
      presetSection.appendChild(presetGrid);
      presetSection.appendChild(element(doc, "p", { className: "cw-note" }, ""));
      shell.appendChild(presetSection);

      var controls = element(doc, "div", { className: "cw-controls" });
      var directionControl = element(doc, "section", { className: "cw-control" }, [element(doc, "label", {}, "参数化方向")]);
      var directionGrid = element(doc, "div", { className: "cw-button-grid", role: "group", "aria-label": "参数化方向" });
      [{ value: 1, label: "逆时针 t 正向" }, { value: -1, label: "顺时针 t 正向" }].forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () {
          state.orientation = choice.value;
          lock("方向已改变；积分与 winding 的符号需要重新预测。");
          renderControls();
        });
        directionButtons.push({ button: button, value: choice.value });
        directionGrid.appendChild(button);
      });
      directionControl.appendChild(directionGrid);
      controls.appendChild(directionControl);

      var shapeControl = element(doc, "div", { className: "cw-control" });
      shapeOutput = element(doc, "output", {}, "0.16");
      shapeInput = element(doc, "input", { type: "range", min: "0", max: "0.24", step: "0.01", value: "0.16", "aria-label": "围道形变幅度" });
      shapeInput.addEventListener("input", function () {
        state.shape = Number(shapeInput.value);
        lock("形变幅度已改变；先预测形变是否穿过奇点。");
        renderControls();
      });
      shapeControl.appendChild(element(doc, "label", {}, ["形变幅度 ", shapeOutput]));
      shapeControl.appendChild(shapeInput);
      controls.appendChild(shapeControl);

      var subdivisionControl = element(doc, "div", { className: "cw-control" });
      subdivisionOutput = element(doc, "output", {}, "64");
      subdivisionInput = element(doc, "input", { type: "range", min: "16", max: "128", step: "16", value: "64", "aria-label": "求积分段数" });
      subdivisionInput.addEventListener("input", function () {
        state.subdivisions = Number(subdivisionInput.value);
        lock("求积分段数已改变；数值误差需要重新预测。");
        renderControls();
      });
      subdivisionControl.appendChild(element(doc, "label", {}, ["求积段数 N=", subdivisionOutput]));
      subdivisionControl.appendChild(subdivisionInput);
      controls.appendChild(subdivisionControl);
      shell.appendChild(controls);

      var prediction = element(doc, "section", { className: "cw-prediction" });
      prediction.appendChild(element(doc, "strong", { className: "cw-prediction-title" }, "预测门：四项都作答后才揭示图和账本"));
      prediction.appendChild(makeQuestion("winding", "1. 当前围道的 winding number 是？", [
        { value: "1", label: "+1" }, { value: "0", label: "0" }, { value: "-1", label: "−1" }, { value: "undefined", label: "未定义" }
      ]));
      prediction.appendChild(makeQuestion("deformation", "2. 若形变留在同一个无奇点解析区，积分会怎样？", [
        { value: "same", label: "保持同一解析值" }, { value: "different", label: "必然改变" }, { value: "not-available", label: "当前不适用" }, { value: "unknown", label: "只看图猜" }
      ]));
      prediction.appendChild(makeQuestion("direction", "3. 反向参数化最直接改变什么？", [
        { value: "flip", label: "积分与 winding 同时变号" }, { value: "undefined", label: "若命中奇点，仍未定义" }, { value: "magnitude", label: "只改绝对值" }, { value: "none", label: "什么都不改" }
      ]));
      prediction.appendChild(makeQuestion("error", "4. 奇点命中路径与数值求积误差应如何记账？", [
        { value: "separate", label: "分开报告" }, { value: "same", label: "都叫误差" }, { value: "ignore", label: "忽略奇点" }, { value: "topology", label: "只看 winding" }
      ]));
      feedback = element(doc, "p", { className: "cw-feedback", "aria-live": "polite", "aria-atomic": "true" }, "");
      prediction.appendChild(feedback);
      var actions = element(doc, "div", { className: "cw-actions" });
      var reveal = element(doc, "button", { type: "button", className: "cw-primary" }, "揭示账本");
      reveal.addEventListener("click", function () {
        var keys = Object.keys(state.answers);
        if (keys.some(function (key) { return state.answers[key] === null; })) {
          feedback.className = "cw-feedback cw-warn";
          feedback.textContent = "还有预测没有作答。";
          return;
        }
        var expected = expectedAnswers();
        var correct = keys.filter(function (key) { return state.answers[key] === expected[key]; }).length;
        state.revealed = true;
        results.hidden = false;
        feedback.className = "cw-feedback " + (correct === keys.length ? "cw-pass" : "cw-warn");
        feedback.textContent = "预测得分 " + correct + "/" + keys.length + "；下面把拓扑、解析和数值账本分开核对。";
        renderResult(evaluate({ preset: state.presetId, orientation: state.orientation, shape: state.shape, subdivisions: state.subdivisions }));
        announce(feedback.textContent);
      });
      var reset = element(doc, "button", { type: "button" }, "重置实验");
      reset.addEventListener("click", function () {
        state.presetId = "inside";
        state.orientation = 1;
        state.shape = 0.16;
        state.subdivisions = 64;
        shapeInput.value = "0.16";
        subdivisionInput.value = "64";
        lock("已重置；预测门重新上锁。");
        renderControls();
        announce("复积分实验已重置。");
      });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      shell.appendChild(prediction);

      results = element(doc, "section", { className: "cw-results", hidden: "hidden" });
      results.appendChild(element(doc, "h4", {}, "揭示后的 SVG 与逐步账本"));
      metrics = [makeMetric(doc, "当前 winding"), makeMetric(doc, "解析值"), makeMetric(doc, "N 段数值积分"), makeMetric(doc, "数值误差")];
      results.appendChild(element(doc, "div", { className: "cw-metrics" }, metrics.map(function (metric) { return metric.card; })));
      stage = element(doc, "div", { className: "cw-stage" });
      results.appendChild(element(doc, "div", { className: "cw-frame" }, stage));
      results.appendChild(element(doc, "div", { className: "cw-legend", "aria-label": "图例" }, [
        element(doc, "span", {}, [element(doc, "i", { className: "cw-swatch cw-swatch-base" }), "基准圆"]),
        element(doc, "span", {}, [element(doc, "i", { className: "cw-swatch cw-swatch-current" }), "当前参数化围道"]),
        element(doc, "span", {}, [element(doc, "i", { className: "cw-swatch cw-swatch-pole" }), "奇点"])
      ]));
      ledger = element(doc, "table", { "aria-label": "复积分账本" });
      ledger.appendChild(element(doc, "caption", {}, "每一行对应一个不同的判断对象"));
      ledger.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [element(doc, "th", {}, "对象"), element(doc, "th", {}, "读数")] )));
      results.appendChild(element(doc, "div", { className: "cw-ledger-wrap" }, ledger));
      status = element(doc, "p", { className: "cw-status", "aria-live": "polite" }, "");
      results.appendChild(status);
      results.appendChild(element(doc, "p", { className: "cw-interpretation" }, "判读顺序：先问路径是否经过奇点；若没有，再用 winding 给出解析值；最后才把 N 段梯形的差值称为数值求积误差。解析区内的形变只在两条围道同伦且不穿过奇点时成立。"));
      shell.appendChild(results);
      root.replaceChildren(shell);

      function renderControls() {
        var preset = selectedPreset();
        presetButtons.forEach(function (button, index) {
          button.setAttribute("aria-pressed", PRESETS[index].id === state.presetId ? "true" : "false");
        });
        directionButtons.forEach(function (entry) {
          entry.button.setAttribute("aria-pressed", entry.value === state.orientation ? "true" : "false");
        });
        shapeOutput.textContent = preset.id === "crossing" ? "0（固定）" : formatNumber(state.shape, 2);
        shapeInput.disabled = preset.id === "crossing";
        subdivisionOutput.textContent = String(state.subdivisions);
        renderPredictionButtons();
      }

      renderControls();
      feedback.textContent = "选择一个预设，先写下四个预测。";
    }

    return {
      PRESETS: PRESETS,
      evaluate: evaluate,
      windingNumber: windingNumber,
      integrate: integrate,
      selfTest: selfTest,
      mount: buildLab
    };
  }
);
