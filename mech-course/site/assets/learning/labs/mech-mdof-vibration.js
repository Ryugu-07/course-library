(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-mdof-vibration", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-mdof-vibration self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-mdof-vibration self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-mdof-vibration";
    var STYLE_ID = "cl-mech-mdof-vibration-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var EPS = 1e-10;
    var INSTANCE = 0;
    var DEFAULTS = {
      m1: 1.5,
      m2: 1.5,
      k1: 1800,
      k2: 400,
      k3: 1800,
      x10: 0.012,
      x20: 0,
      v10: 0,
      v20: 0,
      time: 0.1,
      duration: 1.2
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

    function normalizeConfig(input) {
      var source = input || {};
      var config = {
        m1: positive(source.m1 === undefined ? DEFAULTS.m1 : source.m1, "m1"),
        m2: positive(source.m2 === undefined ? DEFAULTS.m2 : source.m2, "m2"),
        k1: positive(source.k1 === undefined ? DEFAULTS.k1 : source.k1, "k1"),
        k2: positive(source.k2 === undefined ? DEFAULTS.k2 : source.k2, "k2"),
        k3: positive(source.k3 === undefined ? DEFAULTS.k3 : source.k3, "k3"),
        x10: finite(source.x10 === undefined ? DEFAULTS.x10 : source.x10, "x10"),
        x20: finite(source.x20 === undefined ? DEFAULTS.x20 : source.x20, "x20"),
        v10: finite(source.v10 === undefined ? DEFAULTS.v10 : source.v10, "v10"),
        v20: finite(source.v20 === undefined ? DEFAULTS.v20 : source.v20, "v20"),
        time: finite(source.time === undefined ? DEFAULTS.time : source.time, "time"),
        duration: positive(source.duration === undefined ? DEFAULTS.duration : source.duration, "duration")
      };
      if (config.m1 > 1000 || config.m2 > 1000) throw new RangeError("masses must be <= 1000 kg");
      if (config.k1 > 1e7 || config.k2 > 1e7 || config.k3 > 1e7) throw new RangeError("spring stiffnesses must be <= 1e7 N/m");
      if (Math.abs(config.x10) > 1 || Math.abs(config.x20) > 1 || Math.abs(config.v10) > 100 || Math.abs(config.v20) > 100) throw new RangeError("initial state is outside the bounded experiment");
      if (config.time < 0 || config.time > 5) throw new RangeError("time must be in [0, 5] s");
      if (config.duration < 0.1 || config.duration > 5) throw new RangeError("duration must be in [0.1, 5] s");
      return config;
    }

    function norm(vector) {
      return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    }

    function normalizeVector(vector) {
      var length = norm(vector);
      if (!(length > 0)) throw new Error("zero eigenvector");
      return [vector[0] / length, vector[1] / length];
    }

    function orient(vector) {
      var output = vector.slice();
      if (output[0] < -EPS || (Math.abs(output[0]) <= EPS && output[1] < 0)) {
        output[0] = -output[0];
        output[1] = -output[1];
      }
      return output;
    }

    function symmetricEigen2(a, b, d) {
      var trace = a + d;
      var delta = Math.sqrt(Math.max(0, (a - d) * (a - d) + 4 * b * b));
      var values = [(trace - delta) / 2, (trace + delta) / 2];
      var scale = Math.max(1, Math.abs(a), Math.abs(b), Math.abs(d));
      var degenerate = delta <= 1e-12 * scale;
      var first;
      if (degenerate) {
        first = [1, 0];
      } else if (Math.abs(b) > 1e-13 * scale) {
        first = [b, values[0] - a];
        if (norm(first) <= 1e-13 * scale) first = [values[0] - d, b];
        first = normalizeVector(first);
      } else {
        first = a <= d ? [1, 0] : [0, 1];
      }
      first = orient(first);
      var second = orient([-first[1], first[0]]);
      return { values: values, vectors: [first, second], degenerate: degenerate };
    }

    function matrixFor(config) {
      return {
        M: [[config.m1, 0], [0, config.m2]],
        K: [[config.k1 + config.k2, -config.k2], [-config.k2, config.k2 + config.k3]]
      };
    }

    function matrixVector(matrix, vector) {
      return [matrix[0][0] * vector[0] + matrix[0][1] * vector[1], matrix[1][0] * vector[0] + matrix[1][1] * vector[1]];
    }

    function dot(left, right) {
      return left[0] * right[0] + left[1] * right[1];
    }

    function weightedDot(left, matrix, right) {
      return dot(left, matrixVector(matrix, right));
    }

    function modeResidual(mode, matrices) {
      var Kphi = matrixVector(matrices.K, mode.vector);
      var Mphi = matrixVector(matrices.M, mode.vector);
      return [Kphi[0] - mode.lambda * Mphi[0], Kphi[1] - mode.lambda * Mphi[1]];
    }

    function solveModes(input) {
      var config = normalizeConfig(input);
      var matrices = matrixFor(config);
      var a = matrices.K[0][0] / config.m1;
      var d = matrices.K[1][1] / config.m2;
      var b = matrices.K[0][1] / Math.sqrt(config.m1 * config.m2);
      var eigensystem = symmetricEigen2(a, b, d);
      var modes = eigensystem.values.map(function (lambda, index) {
        var massRoot = [Math.sqrt(config.m1), Math.sqrt(config.m2)];
        var physical = [eigensystem.vectors[index][0] / massRoot[0], eigensystem.vectors[index][1] / massRoot[1]];
        var massNorm = Math.sqrt(weightedDot(physical, matrices.M, physical));
        physical = [physical[0] / massNorm, physical[1] / massNorm];
        return {
          lambda: lambda,
          omega: Math.sqrt(Math.max(0, lambda)),
          frequency: Math.sqrt(Math.max(0, lambda)) / (2 * Math.PI),
          vector: physical,
          massNorm: weightedDot(physical, matrices.M, physical),
          residual: modeResidual({ lambda: lambda, vector: physical }, matrices)
        };
      });
      var influence = [1, 1];
      modes.forEach(function (mode) {
        mode.participation = weightedDot(mode.vector, matrices.M, influence);
        mode.effectiveMass = mode.participation * mode.participation;
        mode.effectiveFraction = mode.effectiveMass / (config.m1 + config.m2);
      });
      var q0 = modes.map(function (mode) { return weightedDot(mode.vector, matrices.M, [config.x10, config.x20]); });
      var qd0 = modes.map(function (mode) { return weightedDot(mode.vector, matrices.M, [config.v10, config.v20]); });
      var frequencyGap = Math.abs(modes[1].omega - modes[0].omega);
      var frequencyScale = Math.max(1, modes[0].omega, modes[1].omega);
      var nearDegenerate = eigensystem.degenerate || frequencyGap <= 1e-6 * frequencyScale;
      var result = {
        config: config,
        matrices: matrices,
        eigenvalues: eigensystem.values,
        modes: modes,
        q0: q0,
        qd0: qd0,
        frequencyGap: frequencyGap,
        relativeGap: frequencyGap / frequencyScale,
        nearDegenerate: nearDegenerate,
        degenerateBasis: eigensystem.degenerate,
        time: config.time
      };
      result.response = timeResponse(result, config.time);
      result.points = timeSeries(result, config.duration, 120);
      return result;
    }

    function timeResponse(result, time) {
      var t = finite(time, "time");
      if (t < 0) throw new RangeError("time must be nonnegative");
      var displacement = [0, 0];
      var velocity = [0, 0];
      result.modes.forEach(function (mode, index) {
        var omega = mode.omega;
        var cosine = Math.cos(omega * t);
        var sine = Math.sin(omega * t);
        var coordinate = result.q0[index] * cosine + (omega > EPS ? result.qd0[index] / omega * sine : result.qd0[index] * t);
        var coordinateVelocity = -result.q0[index] * omega * sine + result.qd0[index] * cosine;
        displacement[0] += mode.vector[0] * coordinate;
        displacement[1] += mode.vector[1] * coordinate;
        velocity[0] += mode.vector[0] * coordinateVelocity;
        velocity[1] += mode.vector[1] * coordinateVelocity;
      });
      return { time: t, displacement: displacement, velocity: velocity };
    }

    function timeSeries(result, duration, count) {
      var total = positive(duration, "duration");
      var samples = Math.max(8, Math.floor(count || 120));
      var points = [];
      for (var index = 0; index <= samples; index += 1) {
        var t = total * index / samples;
        var response = timeResponse(result, t);
        points.push({ time: t, x1: response.displacement[0], x2: response.displacement[1] });
      }
      return points;
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
      var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mmv-muted" });
      node.textContent = text;
      parent.appendChild(node);
    }

    function springPath(x1, y1, x2, y2, turns) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      var length = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / length;
      var uy = dy / length;
      var px = -uy;
      var py = ux;
      var points = [x1 + "," + y1];
      var count = turns * 2;
      for (var index = 1; index < count; index += 1) {
        var along = length * index / count;
        var side = (index % 2 ? 1 : -1) * 7;
        points.push((x1 + ux * along + px * side) + "," + (y1 + uy * along + py * side));
      }
      points.push(x2 + "," + y2);
      return points.join(" ");
    }

    function pathFor(points, x0, x1, y0, y1, maxTime, maxDisplacement, key) {
      return points.map(function (point, index) {
        var x = x0 + (x1 - x0) * point.time / maxTime;
        var y = y1 - (y1 - y0) * (point[key] / maxDisplacement + 1) / 2;
        return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
      }).join(" ");
    }

    function drawSvg(doc, svg, result) {
      clear(svg);
      var width = 760;
      var height = 670;
      var massX = [240, 510];
      var equilibriumY = 160;
      var groundY = 270;
      var currentScale = 1500;
      var x1 = equilibriumY + result.response.displacement[0] * currentScale;
      var x2 = equilibriumY + result.response.displacement[1] * currentScale;
      var massWidth = 54;
      var massHeight = 34;
      var maxDisplacement = Math.max(0.012, result.points.reduce(function (maximum, point) { return Math.max(maximum, Math.abs(point.x1), Math.abs(point.x2)); }));
      var chartLeft = 66;
      var chartRight = 710;
      var chartTop = 505;
      var chartBottom = 630;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "二自由度系统的两个质量当前位移、两阶模态形状和时间响应");
      svg.appendChild(svgElement(doc, "line", { x1: 70, y1: groundY, x2: 680, y2: groundY, "class": "mmv-ground" }));
      svg.appendChild(svgElement(doc, "line", { x1: massX[0], y1: 75, x2: massX[0], y2: 230, "class": "mmv-equilibrium" }));
      svg.appendChild(svgElement(doc, "line", { x1: massX[1], y1: 75, x2: massX[1], y2: 230, "class": "mmv-equilibrium" }));
      svg.appendChild(svgElement(doc, "polyline", { points: springPath(massX[0], groundY, massX[0], x1 + massHeight / 2, 7), "class": "mmv-spring" }));
      svg.appendChild(svgElement(doc, "polyline", { points: springPath(massX[1], groundY, massX[1], x2 + massHeight / 2, 7), "class": "mmv-spring" }));
      svg.appendChild(svgElement(doc, "polyline", { points: springPath(massX[0] + massWidth / 2, x1, massX[1] - massWidth / 2, x2, 9), "class": "mmv-coupling" }));
      svg.appendChild(svgElement(doc, "rect", { x: massX[0] - massWidth / 2, y: x1 - massHeight / 2, width: massWidth, height: massHeight, rx: 4, "class": "mmv-mass-one" }));
      svg.appendChild(svgElement(doc, "rect", { x: massX[1] - massWidth / 2, y: x2 - massHeight / 2, width: massWidth, height: massHeight, rx: 4, "class": "mmv-mass-two" }));
      svgText(doc, svg, "m1", massX[0] - 12, x1 + 5, "mmv-mass-label");
      svgText(doc, svg, "m2", massX[1] - 12, x2 + 5, "mmv-mass-label");
      svgText(doc, svg, "t=" + formatNumber(result.time, 3) + " s", 590, 52, "mmv-muted");
      svgText(doc, svg, "当前结构状态（位移放大示意）", 80, 45, "mmv-title");
      svgText(doc, svg, "k1", 208, 252, "mmv-muted");
      svgText(doc, svg, "k2", 370, Math.min(x1, x2) - 26, "mmv-muted");
      svgText(doc, svg, "k3", 535, 252, "mmv-muted");
      svgText(doc, svg, "两阶质量归一化振型", 80, 315, "mmv-title");
      var modeY = [365, 430];
      result.modes.forEach(function (mode, index) {
        var y = modeY[index];
        var scale = 75 / Math.max(Math.abs(mode.vector[0]), Math.abs(mode.vector[1]), EPS);
        var first = massX[0] + mode.vector[0] * scale;
        var second = massX[1] + mode.vector[1] * scale;
        svg.appendChild(svgElement(doc, "line", { x1: 120, y1: y, x2: 620, y2: y, "class": "mmv-mode-axis" }));
        svg.appendChild(svgElement(doc, "line", { x1: massX[0], y1: y, x2: first, y2: y, "class": index === 0 ? "mmv-mode-one" : "mmv-mode-two" }));
        svg.appendChild(svgElement(doc, "line", { x1: massX[1], y1: y, x2: second, y2: y, "class": index === 0 ? "mmv-mode-one" : "mmv-mode-two" }));
        svg.appendChild(svgElement(doc, "circle", { cx: first, cy: y, r: 6, "class": index === 0 ? "mmv-mode-one" : "mmv-mode-two" }));
        svg.appendChild(svgElement(doc, "circle", { cx: second, cy: y, r: 6, "class": index === 0 ? "mmv-mode-one" : "mmv-mode-two" }));
        svgText(doc, svg, "mode " + (index + 1) + ": omega=" + formatNumber(mode.omega, 3), 635, y + 4, "mmv-muted");
      });
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartBottom, x2: chartRight, y2: chartBottom, "class": "mmv-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartTop, x2: chartLeft, y2: chartBottom, "class": "mmv-axis" }));
      [0, result.config.duration / 2, result.config.duration].forEach(function (tick) {
        var tx = chartLeft + (chartRight - chartLeft) * tick / result.config.duration;
        svg.appendChild(svgElement(doc, "line", { x1: tx, y1: chartTop, x2: tx, y2: chartBottom, "class": "mmv-grid" }));
        svgText(doc, svg, formatNumber(tick, 2), tx - 10, chartBottom + 18, "mmv-muted");
      });
      var zeroY = chartBottom - (chartBottom - chartTop) / 2;
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: zeroY, x2: chartRight, y2: zeroY, "class": "mmv-zero" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.points, chartLeft, chartRight, chartTop, chartBottom, result.config.duration, maxDisplacement, "x1"), "class": "mmv-response-one" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.points, chartLeft, chartRight, chartTop, chartBottom, result.config.duration, maxDisplacement, "x2"), "class": "mmv-response-two" }));
      svgText(doc, svg, "x1", 650, chartTop + 15, "mmv-response-one-text");
      svgText(doc, svg, "x2", 650, chartTop + 33, "mmv-response-two-text");
      svgText(doc, svg, "时间响应（m）", 610, chartBottom + 38, "mmv-muted");
      svgText(doc, svg, "x=0", 22, zeroY + 4, "mmv-muted");
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
        '[data-learning-lab="' + LAB_ID + '"]{--mmv-blue:#245a9b;--mmv-green:#2d7a4b;--mmv-orange:#ad6811;--mmv-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
        '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.16rem}[data-learning-lab="' + LAB_ID + '"] h4{margin-top:16px;font-size:1rem}',
        '[data-learning-lab="' + LAB_ID + '"] .mmv-note,[data-learning-lab="' + LAB_ID + '"] .mmv-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
        '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}',
        '[data-learning-lab="' + LAB_ID + '"] .mmv-options{display:grid;gap:5px}[data-learning-lab="' + LAB_ID + '"] .mmv-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] .mmv-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--mmv-blue)}',
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-height:44px;font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}',
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--mmv-blue)}[data-learning-lab="' + LAB_ID + '"] .mmv-primary{background:var(--mmv-blue);border-color:var(--mmv-blue);color:#fff}',
        '[data-learning-lab="' + LAB_ID + '"] .mmv-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mmv-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mmv-error{min-height:1.6em;color:var(--mmv-red);font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .mmv-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px;margin:14px 0}[data-learning-lab="' + LAB_ID + '"] .mmv-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mmv-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mmv-control small{font-size:11px;color:var(--fg-soft,currentColor)}',
        '[data-learning-lab="' + LAB_ID + '"] .mmv-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:15px;align-items:start;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mmv-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:7px;overflow:hidden;background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}',
        '[data-learning-lab="' + LAB_ID + '"] .mmv-ground{stroke:currentColor;stroke-width:2;opacity:.7}[data-learning-lab="' + LAB_ID + '"] .mmv-equilibrium{stroke:currentColor;stroke-width:1;stroke-dasharray:4 5;opacity:.3}[data-learning-lab="' + LAB_ID + '"] .mmv-spring{fill:none;stroke:var(--mmv-blue);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mmv-coupling{fill:none;stroke:var(--mmv-green);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mmv-mass-one{fill:var(--mmv-blue);stroke:currentColor;stroke-width:1.2}[data-learning-lab="' + LAB_ID + '"] .mmv-mass-two{fill:var(--mmv-orange);stroke:currentColor;stroke-width:1.2}[data-learning-lab="' + LAB_ID + '"] .mmv-mass-label{fill:#fff;font-weight:700;font-size:12px}[data-learning-lab="' + LAB_ID + '"] .mmv-mode-axis{stroke:currentColor;stroke-width:1;opacity:.4}[data-learning-lab="' + LAB_ID + '"] .mmv-mode-one{stroke:var(--mmv-blue);fill:var(--mmv-blue);stroke-width:3}[data-learning-lab="' + LAB_ID + '"] .mmv-mode-two{stroke:var(--mmv-orange);fill:var(--mmv-orange);stroke-width:3}[data-learning-lab="' + LAB_ID + '"] .mmv-response-one{fill:none;stroke:var(--mmv-blue);stroke-width:2.5}[data-learning-lab="' + LAB_ID + '"] .mmv-response-two{fill:none;stroke:var(--mmv-orange);stroke-width:2.5}[data-learning-lab="' + LAB_ID + '"] .mmv-response-one-text{fill:var(--mmv-blue);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mmv-response-two-text{fill:var(--mmv-orange);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mmv-axis{stroke:currentColor;stroke-width:1.2;opacity:.8}[data-learning-lab="' + LAB_ID + '"] .mmv-zero{stroke:currentColor;stroke-width:1;stroke-dasharray:4 4;opacity:.5}[data-learning-lab="' + LAB_ID + '"] .mmv-grid{stroke:var(--border,#cbd5e1);stroke-width:1;opacity:.6}[data-learning-lab="' + LAB_ID + '"] .mmv-muted{fill:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mmv-title{font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .mmv-table-wrap{min-width:0;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:470px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mmv-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mmv-metric{min-width:0;padding:9px;border-top:3px solid var(--mmv-blue);background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] .mmv-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mmv-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
        'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--mmv-blue:#83b3ff;--mmv-green:#83d39c;--mmv-orange:#f2bb62;--mmv-red:#ff9b91}',
        '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mmv-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:720px){[data-learning-lab="' + LAB_ID + '"] .mmv-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mmv-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:410px){[data-learning-lab="' + LAB_ID + '"] .mmv-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mmv-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mmv-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}'
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }

    function question(doc, uid, name, text, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: text })]);
      var options = element(doc, "div", { className: "mmv-options" });
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
      return { key: key, input: input, node: element(doc, "div", { className: "mmv-control" }, [element(doc, "label", { htmlFor: id, text: label }), input, element(doc, "small", { text: unit })]) };
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mmv-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
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
      var heading = element(doc, "h3", { id: uid + "-heading", text: "二自由度模态与拍振实验台" });
      var intro = element(doc, "p", { className: "mmv-note", text: "先完成三项预测。揭示后可调质量、三根弹簧、初始状态和时间；结构图、质量归一化振型、参与系数与时间响应使用同一个广义特征解。" });
      var form = element(doc, "form", { className: "mmv-prediction" });
      form.appendChild(question(doc, uid, "participation", "对称系统受统一基座加速度时，反对称模态的参与系数通常是？", [
        { value: "zero", label: "零；对称性使 phi^T M r=0" },
        { value: "same", label: "与对称模态相同" },
        { value: "infinite", label: "发散，因为频率不同" }
      ]));
      form.appendChild(question(doc, uid, "beating", "两阶频率很接近且都被激起时，拍振包络的时间尺度怎样？", [
        { value: "slow", label: "由小频差控制，包络变化较慢" },
        { value: "fast", label: "由两频率之和控制，包络最快" },
        { value: "none", label: "正交性保证没有拍振" }
      ]));
      form.appendChild(question(doc, uid, "normalization", "未经质量归一化的特征向量能否直接保证 phi_i^T M phi_j=delta_ij？", [
        { value: "no", label: "不能；还需按 M 内积归一化" },
        { value: "yes", label: "能，任意特征向量已经单位化" },
        { value: "stiffness", label: "只需按 K 内积归一化" }
      ]));
      var feedback = element(doc, "p", { className: "mmv-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "mmv-actions" }, [
        element(doc, "button", { type: "submit", className: "mmv-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      root.appendChild(heading);
      root.appendChild(intro);
      root.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var fields = [
        inputControl(doc, uid, "m1", "m1", DEFAULTS.m1, 0.1, 1000, 0.1, "kg"),
        inputControl(doc, uid, "m2", "m2", DEFAULTS.m2, 0.1, 1000, 0.1, "kg"),
        inputControl(doc, uid, "k1", "k1", DEFAULTS.k1, 1, 10000000, 10, "N/m"),
        inputControl(doc, uid, "k2", "k2", DEFAULTS.k2, 1, 10000000, 10, "N/m"),
        inputControl(doc, uid, "k3", "k3", DEFAULTS.k3, 1, 10000000, 10, "N/m"),
        inputControl(doc, uid, "x10", "x1(0)", DEFAULTS.x10 * 1000, -1000, 1000, 1, "mm"),
        inputControl(doc, uid, "x20", "x2(0)", DEFAULTS.x20 * 1000, -1000, 1000, 1, "mm"),
        inputControl(doc, uid, "time", "当前时间 t", DEFAULTS.time, 0, 5, 0.01, "s")
      ];
      var controls = element(doc, "div", { className: "mmv-controls" });
      fields.forEach(function (field) { controls.appendChild(field.node); });
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "mmv-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "mmv-layout" });
      var stage = element(doc, "div", { className: "mmv-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "mmv-table-wrap" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "mmv-metrics" });
      bench.appendChild(metrics);
      var note = element(doc, "p", { className: "mmv-note", role: "status", "aria-live": "polite" });
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
          m1: values.m1, m2: values.m2, k1: values.k1, k2: values.k2, k3: values.k3,
          x10: values.x10 / 1000, x20: values.x20 / 1000, v10: DEFAULTS.v10, v20: DEFAULTS.v20,
          time: values.time, duration: DEFAULTS.duration
        };
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = solveModes(uiConfig());
          error.textContent = "";
          drawSvg(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "omega1", formatNumber(result.modes[0].omega, 3) + " rad/s"));
          metrics.appendChild(metric(doc, "omega2", formatNumber(result.modes[1].omega, 3) + " rad/s"));
          metrics.appendChild(metric(doc, "频差", formatNumber(result.frequencyGap, 3) + " rad/s"));
          metrics.appendChild(metric(doc, "近简并", result.nearDegenerate ? "是" : "否"));
          renderTable(doc, ledger, ["账本项", "读数", "单位或判定"], [
            ["lambda_1, lambda_2", formatNumber(result.eigenvalues[0], 3) + ", " + formatNumber(result.eigenvalues[1], 3), "s^-2"],
            ["phi_1", "[" + formatNumber(result.modes[0].vector[0], 4) + ", " + formatNumber(result.modes[0].vector[1], 4) + "]", "M 归一化"],
            ["phi_2", "[" + formatNumber(result.modes[1].vector[0], 4) + ", " + formatNumber(result.modes[1].vector[1], 4) + "]", "M 归一化"],
            ["Gamma_1, Gamma_2", formatNumber(result.modes[0].participation, 4) + ", " + formatNumber(result.modes[1].participation, 4), "统一基座 r=[1,1]"],
            ["有效质量分数", formatNumber(result.modes[0].effectiveFraction, 4) + ", " + formatNumber(result.modes[1].effectiveFraction, 4), "两者合计应为 1"],
            ["质量正交", formatNumber(weightedDot(result.modes[0].vector, result.matrices.M, result.modes[1].vector), 5), "phi1^T M phi2"],
            ["当前响应", "[" + formatNumber(result.response.displacement[0] * 1000, 3) + ", " + formatNumber(result.response.displacement[1] * 1000, 3) + "]", "mm"]
          ]);
          note.textContent = result.nearDegenerate
            ? "频率簇近简并：单个振型方向可旋转，优先比较子空间和响应；当前使用确定性正交基。"
            : "当前为线性、无阻尼、自由响应的精确二模态叠加；改变 k2 可观察频差和拍振包络。";
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
          participation: selected(form, uid + "-participation"),
          beating: selected(form, uid + "-beating"),
          normalization: selected(form, uid + "-normalization")
        };
        if (!answers.participation || !answers.beating || !answers.normalization) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.participation === "zero" ? 1 : 0) + (answers.beating === "slow" ? 1 : 0) + (answers.normalization === "no" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在读模态、参与和拍振账本。";
        render();
        if (api && typeof api.announce === "function") api.announce(root, "多自由度预测已揭示，振型和时间响应已显示。");
      });
      form.querySelector('[data-reset="true"]').addEventListener("click", function () {
        form.reset();
        state.revealed = false;
        bench.hidden = true;
        feedback.textContent = "结果尚未揭示。";
        fields.forEach(function (field) {
          field.input.value = field.key === "x10" ? DEFAULTS.x10 * 1000 : field.key === "x20" ? DEFAULTS.x20 * 1000 : DEFAULTS[field.key];
        });
        error.textContent = "";
        clear(metrics); clear(ledger); clear(svg); note.textContent = "";
        if (api && typeof api.announce === "function") api.announce(root, "多自由度实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(root, "多自由度实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var result = solveModes(DEFAULTS);
      check(near(result.eigenvalues[0], 1200) && near(result.eigenvalues[1], 2600 / 1.5), "symmetric chain eigenvalues are exact");
      check(near(result.modes[0].massNorm, 1) && near(result.modes[1].massNorm, 1), "modes are mass normalized");
      check(Math.abs(weightedDot(result.modes[0].vector, result.matrices.M, result.modes[1].vector)) < 1e-9, "modes are mass orthogonal");
      check(Math.abs(weightedDot(result.modes[0].vector, result.matrices.K, result.modes[1].vector)) < 1e-6, "modes are stiffness orthogonal");
      check(Math.max(Math.abs(result.modes[0].residual[0]), Math.abs(result.modes[0].residual[1]), Math.abs(result.modes[1].residual[0]), Math.abs(result.modes[1].residual[1])) < 1e-8, "generalized eigen residuals close");
      check(Math.abs(result.modes[1].participation) < 1e-9, "symmetric base motion has zero antisymmetric participation");
      check(near(result.modes[0].effectiveFraction + result.modes[1].effectiveFraction, 1), "effective mass fractions close the base participation ledger");
      var atZero = timeResponse(result, 0);
      check(near(atZero.displacement[0], DEFAULTS.x10) && near(atZero.displacement[1], DEFAULTS.x20), "time response honors initial displacement");
      var nearResult = solveModes({ m1: 1, m2: 1, k1: 1000, k2: 1e-8, k3: 1000, x10: 0.01, x20: 0, v10: 0, v20: 0, time: 0, duration: 1 });
      check(nearResult.nearDegenerate && nearResult.modes.every(function (mode) { return isFinite(mode.vector[0]) && isFinite(mode.vector[1]); }), "near-degenerate modes remain finite and are flagged");
      var invalidCaught = false;
      try { normalizeConfig({ m1: 0 }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "nonpositive mass is rejected");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "zero-decimal formatter preserves integer zeros");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      symmetricEigen2: symmetricEigen2,
      matrixFor: matrixFor,
      solveModes: solveModes,
      timeResponse: timeResponse,
      timeSeries: timeSeries,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
