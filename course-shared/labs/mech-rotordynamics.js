(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-rotordynamics", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-rotordynamics self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-rotordynamics self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-rotordynamics";
    var STYLE_ID = "cl-mech-rotordynamics-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var INSTANCE = 0;
    var DEFAULTS = {
      mass: 12,
      stiffness: 300000,
      eccentricity: 0.0008,
      speedRpm: 1340,
      zeta: 0.05
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
      return {
        mass: bounded(source.mass === undefined ? DEFAULTS.mass : source.mass, "mass", 0.1, 1000),
        stiffness: bounded(source.stiffness === undefined ? DEFAULTS.stiffness : source.stiffness, "stiffness", 100, 1e8),
        eccentricity: bounded(source.eccentricity === undefined ? DEFAULTS.eccentricity : source.eccentricity, "eccentricity", 1e-6, 0.02),
        speedRpm: bounded(source.speedRpm === undefined ? DEFAULTS.speedRpm : source.speedRpm, "speedRpm", 1, 20000),
        zeta: bounded(source.zeta === undefined ? DEFAULTS.zeta : source.zeta, "zeta", 0.001, 0.5)
      };
    }

    function responseAtRatio(ratio, zeta) {
      var denominator = Math.sqrt((1 - ratio * ratio) * (1 - ratio * ratio) + (2 * zeta * ratio) * (2 * zeta * ratio));
      var amplitudeRatio = ratio * ratio / denominator;
      var supportRatio = Math.sqrt(1 + (2 * zeta * ratio) * (2 * zeta * ratio)) / denominator;
      var phase = Math.atan2(2 * zeta * ratio, 1 - ratio * ratio);
      if (phase < 0) phase += 2 * Math.PI;
      return {
        denominator: denominator,
        amplitudeRatio: amplitudeRatio,
        supportRatio: supportRatio,
        phase: phase
      };
    }

    function solveRotor(input) {
      var config = normalizeConfig(input);
      var omega = config.speedRpm * 2 * Math.PI / 60;
      var omegaN = Math.sqrt(config.stiffness / config.mass);
      var criticalRpm = omegaN * 60 / (2 * Math.PI);
      var ratio = omega / omegaN;
      var response = responseAtRatio(ratio, config.zeta);
      var amplitude = config.eccentricity * response.amplitudeRatio;
      var damping = 2 * config.zeta * Math.sqrt(config.stiffness * config.mass);
      var unbalanceForce = config.mass * config.eccentricity * omega * omega;
      var springForce = config.stiffness * amplitude;
      var dampingForce = damping * omega * amplitude;
      var supportForce = Math.sqrt(springForce * springForce + dampingForce * dampingForce);
      var peakRatio = config.zeta < 1 / Math.sqrt(2)
        ? 1 / Math.sqrt(1 - 2 * config.zeta * config.zeta)
        : null;
      var sweep = [];
      for (var index = 0; index <= 120; index += 1) {
        var r = 0.05 + 3.45 * index / 120;
        var point = responseAtRatio(r, config.zeta);
        sweep.push({ ratio: r, amplitudeRatio: point.amplitudeRatio, supportRatio: point.supportRatio });
      }
      return {
        config: config,
        omega: omega,
        omegaN: omegaN,
        criticalRpm: criticalRpm,
        ratio: ratio,
        denominator: response.denominator,
        amplitudeRatio: response.amplitudeRatio,
        amplitude: amplitude,
        phase: response.phase,
        phaseDegrees: response.phase * 180 / Math.PI,
        damping: damping,
        unbalanceForce: unbalanceForce,
        springForce: springForce,
        dampingForce: dampingForce,
        supportForce: supportForce,
        supportRatio: response.supportRatio,
        peakRatio: peakRatio,
        peakRpm: peakRatio === null ? null : peakRatio * criticalRpm,
        sweep: sweep
      };
    }

    function formatNumber(value, digits) {
      if (!isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 5));
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
      var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mrt-label" });
      node.textContent = text;
      parent.appendChild(node);
    }

    function arrow(doc, parent, x1, y1, x2, y2, className, label, labelX, labelY) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      var length = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / length;
      var uy = dy / length;
      var px = -uy;
      var py = ux;
      var head = 9;
      parent.appendChild(svgElement(doc, "line", { x1: x1, y1: y1, x2: x2, y2: y2, "class": className }));
      parent.appendChild(svgElement(doc, "polygon", {
        points: [x2, y2, x2 - head * ux + 4 * px, y2 - head * uy + 4 * py, x2 - head * ux - 4 * px, y2 - head * uy - 4 * py].join(" "),
        "class": className
      }));
      if (label) svgText(doc, parent, label, labelX === undefined ? x2 + 6 : labelX, labelY === undefined ? y2 : labelY, "mrt-label " + className);
    }

    function pathFor(points, key, x0, x1, y0, y1, maximum) {
      return points.map(function (point, index) {
        var x = x0 + (x1 - x0) * (point.ratio - 0.05) / 3.45;
        var y = y1 - Math.min(maximum, point[key]) / maximum * (y1 - y0);
        return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
      }).join(" ");
    }

    function drawRotor(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 395;
      var chartLeft = 62;
      var chartRight = 690;
      var chartTop = 205;
      var chartBottom = 350;
      var maxRatio = Math.max(2, result.amplitudeRatio, result.sweep.reduce(function (max, point) { return Math.max(max, point.amplitudeRatio); }, 0) * 1.08);
      maxRatio = Math.min(80, maxRatio);
      var currentX = chartLeft + (chartRight - chartLeft) * (Math.max(0.05, Math.min(3.5, result.ratio)) - 0.05) / 3.45;
      var currentY = chartBottom - Math.min(maxRatio, result.amplitudeRatio) / maxRatio * (chartBottom - chartTop);
      var schematicY = 98;
      var schematicCenter = 360;
      var orbitRadius = Math.max(10, Math.min(62, result.amplitude / Math.max(result.config.eccentricity, 1e-12) * 25));
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Jeffcott 转子不平衡响应、临界转速、相位与支承力曲线");
      svg.appendChild(svgElement(doc, "line", { x1: 120, y1: schematicY, x2: 600, y2: schematicY, "class": "mrt-shaft" }));
      svg.appendChild(svgElement(doc, "rect", { x: 108, y: schematicY - 15, width: 24, height: 30, "class": "mrt-bearing" }));
      svg.appendChild(svgElement(doc, "rect", { x: 588, y: schematicY - 15, width: 24, height: 30, "class": "mrt-bearing" }));
      svg.appendChild(svgElement(doc, "circle", { cx: schematicCenter, cy: schematicY, r: 43, "class": "mrt-disc" }));
      svg.appendChild(svgElement(doc, "circle", { cx: schematicCenter, cy: schematicY, r: orbitRadius, "class": "mrt-orbit" }));
      var markerX = schematicCenter + 28;
      var markerY = schematicY - 22;
      svg.appendChild(svgElement(doc, "circle", { cx: markerX, cy: markerY, r: 5, "class": "mrt-unbalance" }));
      arrow(doc, svg, schematicCenter, schematicY, schematicCenter + orbitRadius, schematicY - 1, "mrt-response", "A", schematicCenter + orbitRadius + 8, schematicY - 4);
      arrow(doc, svg, schematicCenter, schematicY, markerX, markerY, "mrt-eccentricity", "e", markerX + 8, markerY - 5);
      svgText(doc, svg, "几何中心涡动 A；红点为偏心质量", 210, 42, "mrt-muted");
      svgText(doc, svg, "r=" + formatNumber(result.ratio, 3) + "，φ=" + formatNumber(result.phaseDegrees, 1) + "°", 282, 166, "mrt-phase");
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartBottom, x2: chartRight, y2: chartBottom, "class": "mrt-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartTop, x2: chartLeft, y2: chartBottom, "class": "mrt-axis" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.sweep, "amplitudeRatio", chartLeft, chartRight, chartTop, chartBottom, maxRatio), "class": "mrt-amplitude" }));
      var supportMaximum = Math.max(1, result.sweep.reduce(function (max, point) { return Math.max(max, point.supportRatio); }, 0) * 1.08);
      var supportPath = result.sweep.map(function (point, index) {
        var x = chartLeft + (chartRight - chartLeft) * (point.ratio - 0.05) / 3.45;
        var y = chartBottom - Math.min(supportMaximum, point.supportRatio) / supportMaximum * (chartBottom - chartTop);
        return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
      }).join(" ");
      svg.appendChild(svgElement(doc, "path", { d: supportPath, "class": "mrt-support-curve" }));
      var criticalX = chartLeft + (chartRight - chartLeft) * (1 - 0.05) / 3.45;
      svg.appendChild(svgElement(doc, "line", { x1: criticalX, y1: chartTop, x2: criticalX, y2: chartBottom, "class": "mrt-critical" }));
      svg.appendChild(svgElement(doc, "circle", { cx: currentX, cy: currentY, r: 6, "class": "mrt-current" }));
      svgText(doc, svg, "A/e（实线）", 76, 194, "mrt-amplitude-label");
      svgText(doc, svg, "Fb/Fu（虚线）", 174, 194, "mrt-support-label");
      svgText(doc, svg, "r=1 临界", criticalX + 5, chartTop + 15, "mrt-muted");
      svgText(doc, svg, "0", chartLeft - 6, chartBottom + 20, "mrt-muted");
      svgText(doc, svg, "1", criticalX - 3, chartBottom + 20, "mrt-muted");
      svgText(doc, svg, "3.5", chartRight - 12, chartBottom + 20, "mrt-muted");
      svgText(doc, svg, formatNumber(maxRatio, 1), 19, chartTop + 5, "mrt-muted");
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
        '[data-learning-lab="' + LAB_ID + '"]{--mrt-blue:#245a9b;--mrt-green:#2d7a4b;--mrt-orange:#ad6811;--mrt-red:#b23a32;display:block;max-width:100%;min-width:0;line-height:1.55;overflow-wrap:anywhere}',
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
        '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] .mrt-note,[data-learning-lab="' + LAB_ID + '"] .mrt-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
        '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}',
        '[data-learning-lab="' + LAB_ID + '"] .mrt-options{display:grid;gap:5px}[data-learning-lab="' + LAB_ID + '"] .mrt-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] .mrt-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--mrt-blue)}',
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-height:44px;font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}',
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--mrt-blue)}[data-learning-lab="' + LAB_ID + '"] .mrt-primary{background:var(--mrt-blue);border-color:var(--mrt-blue);color:#fff}',
        '[data-learning-lab="' + LAB_ID + '"] .mrt-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mrt-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mrt-error{min-height:1.6em;color:var(--mrt-red);font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .mrt-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin:14px 0}[data-learning-lab="' + LAB_ID + '"] .mrt-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mrt-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mrt-control small{font-size:11px;color:var(--fg-soft,currentColor)}',
        '[data-learning-lab="' + LAB_ID + '"] .mrt-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:15px;align-items:start;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mrt-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:7px;overflow:hidden;background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}',
        '[data-learning-lab="' + LAB_ID + '"] .mrt-shaft{stroke:currentColor;stroke-width:4}[data-learning-lab="' + LAB_ID + '"] .mrt-bearing{fill:var(--bg,Canvas);stroke:currentColor;stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mrt-disc{fill:var(--bg,Canvas);stroke:var(--mrt-blue);stroke-width:3}[data-learning-lab="' + LAB_ID + '"] .mrt-orbit{fill:none;stroke:var(--mrt-green);stroke-width:1.5;stroke-dasharray:5 4}[data-learning-lab="' + LAB_ID + '"] .mrt-unbalance{fill:var(--mrt-red)}[data-learning-lab="' + LAB_ID + '"] .mrt-response{stroke:var(--mrt-green);fill:var(--mrt-green);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mrt-eccentricity{stroke:var(--mrt-red);fill:var(--mrt-red);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mrt-axis{stroke:currentColor;stroke-width:1;opacity:.7}[data-learning-lab="' + LAB_ID + '"] .mrt-amplitude{fill:none;stroke:var(--mrt-blue);stroke-width:3}[data-learning-lab="' + LAB_ID + '"] .mrt-support-curve{fill:none;stroke:var(--mrt-orange);stroke-width:2;stroke-dasharray:6 4}[data-learning-lab="' + LAB_ID + '"] .mrt-critical{stroke:var(--mrt-red);stroke-width:1.5;stroke-dasharray:4 4}[data-learning-lab="' + LAB_ID + '"] .mrt-current{fill:var(--mrt-red);stroke:var(--bg,Canvas);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mrt-muted{fill:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mrt-phase{fill:var(--mrt-red);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mrt-amplitude-label{fill:var(--mrt-blue);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mrt-support-label{fill:var(--mrt-orange);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mrt-table-wrap{min-width:0;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:430px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mrt-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mrt-metric{min-width:0;padding:9px;border-top:3px solid var(--mrt-blue);background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] .mrt-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mrt-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
        'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--mrt-blue:#83b3ff;--mrt-green:#83d39c;--mrt-orange:#f2bb62;--mrt-red:#ff9b91}',
        '@media(max-width:850px){[data-learning-lab="' + LAB_ID + '"] .mrt-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:650px){[data-learning-lab="' + LAB_ID + '"] .mrt-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mrt-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:400px){[data-learning-lab="' + LAB_ID + '"] .mrt-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mrt-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mrt-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}'
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }

    function question(doc, uid, name, text, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: text })]);
      var options = element(doc, "div", { className: "mrt-options" });
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
        node: element(doc, "div", { className: "mrt-control" }, [
          element(doc, "label", { htmlFor: id, text: label }),
          input,
          element(doc, "small", { text: unit })
        ])
      };
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mrt-metric" }, [
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
      root.appendChild(element(doc, "h3", { id: uid + "-heading", text: "Jeffcott 转子：临界转速、相位与支承力" }));
      root.appendChild(element(doc, "p", {
        className: "mrt-note",
        text: "先完成三项预测。揭示后可扫速、调阻尼和偏心；图中区分几何中心涡动、偏心质量位置与理想线性支承力。"
      }));

      var form = element(doc, "form", { className: "mrt-prediction" });
      form.appendChild(question(doc, uid, "force", "转速加倍时，不平衡力 Fu=meω² 如何变化？", [
        { value: "four", label: "变为 4 倍，因为 Fu 与 ω² 成正比" },
        { value: "two", label: "变为 2 倍，因为转速是频率" },
        { value: "same", label: "不变，只由偏心距决定" }
      ]));
      form.appendChild(question(doc, uid, "phase", "越过 r=1 后，几何中心位移相对不平衡力的相位趋向哪里？", [
        { value: "pi", label: "趋向约 180°；质量中心可能趋近轴承线" },
        { value: "zero", label: "始终约 0°；几何中心也会静止" },
        { value: "random", label: "没有确定相位，因为线性模型无解" }
      ]));
      form.appendChild(question(doc, uid, "critical", "Jeffcott 的临界角频率由什么决定？", [
        { value: "km", label: "ωn=√(k/m)，阻尼和偏心主要改变峰值/相位" },
        { value: "e", label: "只由偏心距 e 决定" },
        { value: "rpm", label: "只由转速设定决定，不由结构决定" }
      ]));
      var feedback = element(doc, "p", { className: "mrt-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "mrt-actions" }, [
        element(doc, "button", { type: "submit", className: "mrt-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      root.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var fields = [
        inputControl(doc, uid, "mass", "圆盘质量 m", DEFAULTS.mass, 0.1, 1000, 0.1, "kg"),
        inputControl(doc, uid, "stiffness", "支承刚度 k", DEFAULTS.stiffness / 1000, 0.1, 100000, 1, "kN/m"),
        inputControl(doc, uid, "eccentricity", "偏心距 e", DEFAULTS.eccentricity * 1000, 0.001, 20, 0.01, "mm"),
        inputControl(doc, uid, "speedRpm", "转速", DEFAULTS.speedRpm, 1, 20000, 1, "rpm"),
        inputControl(doc, uid, "zeta", "阻尼比 ζ", DEFAULTS.zeta, 0.001, 0.5, 0.001, "无量纲")
      ];
      var controls = element(doc, "div", { className: "mrt-controls" });
      fields.forEach(function (field) { controls.appendChild(field.node); });
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "mrt-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "mrt-layout" });
      var stage = element(doc, "div", { className: "mrt-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "mrt-table-wrap" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "mrt-metrics" });
      bench.appendChild(metrics);
      var note = element(doc, "p", { className: "mrt-note", role: "status", "aria-live": "polite" });
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
        return {
          mass: values.mass,
          stiffness: values.stiffness * 1000,
          eccentricity: values.eccentricity / 1000,
          speedRpm: values.speedRpm,
          zeta: values.zeta
        };
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = solveRotor(uiConfig());
          error.textContent = "";
          drawRotor(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "当前 r", formatNumber(result.ratio, 4)));
          metrics.appendChild(metric(doc, "位移 A", formatNumber(result.amplitude * 1000, 4) + " mm"));
          metrics.appendChild(metric(doc, "相位 φ", formatNumber(result.phaseDegrees, 2) + "°"));
          metrics.appendChild(metric(doc, "支承力 Fb", formatNumber(result.supportForce, 3) + " N"));
          renderTable(doc, ledger, ["账本项", "公式/读数", "单位或判定"], [
            ["角速度 ω", "2π rpm/60 = " + formatNumber(result.omega, 6), "rad/s"],
            ["固有角频率 ωn", "sqrt(k/m) = " + formatNumber(result.omegaN, 6), "rad/s"],
            ["临界转速", "ωn60/(2π) = " + formatNumber(result.criticalRpm, 3), "rpm"],
            ["频率比 r", "ω/ωn = " + formatNumber(result.ratio, 6), "无量纲"],
            ["幅值比", "A/e = " + formatNumber(result.amplitudeRatio, 6), "几何中心涡动 / 偏心距"],
            ["不平衡力 Fu", "meω² = " + formatNumber(result.unbalanceForce, 6), "N"],
            ["相位", "atan2(2ζr,1−r²) = " + formatNumber(result.phaseDegrees, 3), "deg；位移相对激励滞后"],
            ["支承力", "sqrt((kA)²+(cωA)²) = " + formatNumber(result.supportForce, 6), "N，同步幅值"],
            ["支承力比", "Fb/Fu = " + formatNumber(result.supportRatio, 6), "无量纲"],
            ["阻尼", "c=2ζsqrt(km) = " + formatNumber(result.damping, 6), "N·s/m"],
            ["峰值提示", result.peakRatio === null ? "ζ≥1/sqrt(2)，无简单位移峰公式" : "rp=" + formatNumber(result.peakRatio, 5) + "，约 " + formatNumber(result.peakRpm, 2) + " rpm", "线性扫速提示"]
          ]);
          note.textContent = "这是单盘、各向同性、定常同步激励的线性稳态账本；A 是几何中心涡动，不是质量中心轨道半径。超临界策略还需穿越、稳定性和支承动载验证。";
        } catch (validationError) {
          error.textContent = "输入校验：" + validationError.message;
          clear(metrics);
          clear(ledger);
          clear(svg);
          note.textContent = "";
        }
      }

      fields.forEach(function (field) {
        field.input.addEventListener("input", render);
        field.input.addEventListener("change", render);
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var answers = {
          force: selected(form, uid + "-force"),
          phase: selected(form, uid + "-phase"),
          critical: selected(form, uid + "-critical")
        };
        if (!answers.force || !answers.phase || !answers.critical) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.force === "four" ? 1 : 0) + (answers.phase === "pi" ? 1 : 0) + (answers.critical === "km" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在扫速并观察相位与支承力。";
        render();
        if (api && typeof api.announce === "function") api.announce(root, "转子动力学实验已揭示，响应曲线和支承力账本已显示。");
      });
      form.querySelector('[data-reset="true"]').addEventListener("click", function () {
        form.reset();
        state.revealed = false;
        bench.hidden = true;
        feedback.textContent = "结果尚未揭示。";
        fields.forEach(function (field) {
          var value = DEFAULTS[field.key];
          if (field.key === "stiffness") value /= 1000;
          if (field.key === "eccentricity") value *= 1000;
          field.input.value = value;
        });
        error.textContent = "";
        clear(metrics);
        clear(ledger);
        clear(svg);
        note.textContent = "";
        if (api && typeof api.announce === "function") api.announce(root, "转子动力学实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(root, "转子动力学实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var result = solveRotor(DEFAULTS);
      check(near(result.omegaN, Math.sqrt(DEFAULTS.stiffness / DEFAULTS.mass)), "natural frequency follows sqrt(k/m)");
      check(result.amplitude > 0 && result.unbalanceForce > 0, "default response is finite and positive");
      check(result.phaseDegrees > 0 && result.phaseDegrees < 180, "default phase lies between zero and pi");
      check(near(result.supportForce, Math.sqrt(result.springForce * result.springForce + result.dampingForce * result.dampingForce), 1e-10), "support force combines spring and damping forces");
      check(near(result.supportRatio, result.supportForce / result.unbalanceForce, 1e-10), "support force ratio closes");
      var doubledSpeed = solveRotor({ mass: DEFAULTS.mass, stiffness: DEFAULTS.stiffness, eccentricity: DEFAULTS.eccentricity, speedRpm: 2 * DEFAULTS.speedRpm, zeta: DEFAULTS.zeta });
      check(near(doubledSpeed.unbalanceForce, 4 * result.unbalanceForce, 1e-10), "unbalance force scales with speed squared");
      var highSpeed = solveRotor({ mass: DEFAULTS.mass, stiffness: DEFAULTS.stiffness, eccentricity: DEFAULTS.eccentricity, speedRpm: 10 * DEFAULTS.speedRpm, zeta: DEFAULTS.zeta });
      check(highSpeed.phaseDegrees > 90 && highSpeed.amplitudeRatio > 0.8, "supercritical phase and geometry-center orbit have the expected trend");
      var invalidCaught = false;
      try { solveRotor({ mass: DEFAULTS.mass, stiffness: DEFAULTS.stiffness, eccentricity: DEFAULTS.eccentricity, speedRpm: DEFAULTS.speedRpm, zeta: 0 }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "zero damping is outside the bounded steady-state experiment");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "zero-decimal formatter preserves integer zeros");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      solveRotor: solveRotor,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
