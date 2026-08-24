(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-nonlinear-lyapunov", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-nonlinear-lyapunov self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-nonlinear-lyapunov self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})
(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var LAB_ID = "auto-nonlinear-lyapunov";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-nonlinear-lyapunov-styles";
    var SEPARATRIX = 2;
    var EPS = 1e-10;
    var DEFAULTS = {
      theta0: 1.15,
      omega0: 0.35,
      damping: 0.2,
      duration: 12,
      dt: 0.04
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-nonlinear-lyapunov"]{--nl-blue:var(--cl-blue,#315f9d);--nl-orange:var(--cl-gold,#9b6a12);--nl-green:var(--cl-green,#39734d);--nl-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] *{box-sizing:border-box}[data-learning-lab="auto-nonlinear-lyapunov"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] h3,[data-learning-lab="auto-nonlinear-lyapunov"] h4{margin:0;letter-spacing:0}[data-learning-lab="auto-nonlinear-lyapunov"] h3{font-size:1.16rem}[data-learning-lab="auto-nonlinear-lyapunov"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] p{margin:8px 0}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-note,[data-learning-lab="auto-nonlinear-lyapunov"] .nl-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-nonlinear-lyapunov"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] .nl-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-nonlinear-lyapunov"] button,[data-learning-lab="auto-nonlinear-lyapunov"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-nonlinear-lyapunov"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-nonlinear-lyapunov"] button[aria-pressed="true"],[data-learning-lab="auto-nonlinear-lyapunov"] .nl-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] button:focus-visible,[data-learning-lab="auto-nonlinear-lyapunov"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-nonlinear-lyapunov"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] .nl-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-actions>*{flex:1 1 170px}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-correct{color:var(--nl-green)}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-wrong{color:var(--nl-red)}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] .nl-layout{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-controls,[data-learning-lab="auto-nonlinear-lyapunov"] .nl-stage{min-width:0}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-nonlinear-lyapunov"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-nonlinear-lyapunov"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] .nl-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-trajectory{fill:none;stroke:var(--nl-blue);stroke-width:2.7}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-separatrix{fill:none;stroke:var(--nl-red);stroke-width:1.8;stroke-dasharray:6 4}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-energy{fill:none;stroke:var(--nl-orange);stroke-width:2.4}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-level{stroke:var(--nl-red);stroke-width:1.2;stroke-dasharray:4 4}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-start{fill:var(--nl-green)}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-end{fill:var(--nl-red)}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-label{font-size:11px}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] .nl-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-metric:nth-child(3n+1){border-color:var(--nl-blue)}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-metric:nth-child(3n+2){border-color:var(--nl-orange)}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-metric:nth-child(3n){border-color:var(--nl-green)}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-nonlinear-lyapunov"] .nl-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-nonlinear-lyapunov"] table{width:100%;min-width:700px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="auto-nonlinear-lyapunov"] th,[data-learning-lab="auto-nonlinear-lyapunov"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-nonlinear-lyapunov"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-nonlinear-lyapunov"] .nl-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--nl-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="auto-nonlinear-lyapunov"] .nl-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-nonlinear-lyapunov"] .nl-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-nonlinear-lyapunov"] .nl-stage-frame{padding:4px}[data-learning-lab="auto-nonlinear-lyapunov"] table{font-size:10.8px}[data-learning-lab="auto-nonlinear-lyapunov"] th,[data-learning-lab="auto-nonlinear-lyapunov"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-nonlinear-lyapunov"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
      var theta0 = finite(source.theta0 === undefined ? DEFAULTS.theta0 : source.theta0, "theta0");
      var omega0 = finite(source.omega0 === undefined ? DEFAULTS.omega0 : source.omega0, "omega0");
      var damping = finite(source.damping === undefined ? DEFAULTS.damping : source.damping, "damping");
      var duration = finite(source.duration === undefined ? DEFAULTS.duration : source.duration, "duration");
      var dt = finite(source.dt === undefined ? DEFAULTS.dt : source.dt, "dt");
      if (theta0 < -Math.PI || theta0 > Math.PI) throw new RangeError("theta0 must be in [-pi, pi]");
      if (omega0 < -4 || omega0 > 4) throw new RangeError("omega0 must be in [-4, 4]");
      if (damping < 0 || damping > 1.2) throw new RangeError("damping must be in [0, 1.2]");
      if (duration < 2 || duration > 24) throw new RangeError("duration must be in [2, 24]");
      if (dt < 0.01 || dt > 0.12) throw new RangeError("dt must be in [0.01, 0.12]");
      return { theta0: theta0, omega0: omega0, damping: damping, duration: duration, dt: dt };
    }

    function derivative(state, damping) {
      return {
        theta: state.omega,
        omega: -Math.sin(state.theta) - damping * state.omega
      };
    }

    function energy(theta, omega) {
      return 0.5 * omega * omega + 1 - Math.cos(theta);
    }

    function energyCertificate(value) {
      if (value < SEPARATRIX - 1e-8) return "inside-safe-sublevel";
      if (value > SEPARATRIX + 1e-8) return "outside-certificate";
      return "threshold-level";
    }

    function rk4Step(state, dt, damping) {
      var k1 = derivative(state, damping);
      var k2 = derivative({ theta: state.theta + 0.5 * dt * k1.theta, omega: state.omega + 0.5 * dt * k1.omega }, damping);
      var k3 = derivative({ theta: state.theta + 0.5 * dt * k2.theta, omega: state.omega + 0.5 * dt * k2.omega }, damping);
      var k4 = derivative({ theta: state.theta + dt * k3.theta, omega: state.omega + dt * k3.omega }, damping);
      return {
        theta: state.theta + dt * (k1.theta + 2 * k2.theta + 2 * k3.theta + k4.theta) / 6,
        omega: state.omega + dt * (k1.omega + 2 * k2.omega + 2 * k3.omega + k4.omega) / 6
      };
    }

    function wrapAngle(theta) {
      var period = 2 * Math.PI;
      var wrapped = (theta + Math.PI) % period;
      if (wrapped < 0) wrapped += period;
      return wrapped - Math.PI;
    }

    function runExperiment(input) {
      var config = normalizeConfig(input);
      var count = Math.round(config.duration / config.dt);
      var state = { theta: config.theta0, omega: config.omega0 };
      var rows = [];
      var thresholdCrossed = false;
      var crossingCount = 0;
      var previousEnergy = energy(state.theta, state.omega);
      for (var index = 0; index <= count; index += 1) {
        var time = index * config.dt;
        var value = energy(state.theta, state.omega);
        var vDot = -config.damping * state.omega * state.omega;
        var certificate = energyCertificate(value);
        if (index > 0 && ((previousEnergy < SEPARATRIX && value >= SEPARATRIX) || (previousEnergy >= SEPARATRIX && value < SEPARATRIX))) {
          thresholdCrossed = true;
          crossingCount += 1;
        }
        rows.push({
          index: index,
          time: time,
          theta: state.theta,
          thetaWrapped: wrapAngle(state.theta),
          omega: state.omega,
          energy: value,
          vDot: vDot,
          energyCertificate: certificate
        });
        previousEnergy = value;
        if (index < count) state = rk4Step(state, config.dt, config.damping);
      }
      var finalRow = rows[rows.length - 1];
      var maxEnergy = Math.max.apply(null, rows.map(function (row) { return row.energy; }));
      var minEnergy = Math.min.apply(null, rows.map(function (row) { return row.energy; }));
      var maxEnergyIncrease = 0;
      for (var i = 1; i < rows.length; i += 1) maxEnergyIncrease = Math.max(maxEnergyIncrease, rows[i].energy - rows[i - 1].energy);
      var flipEvents = [];
      for (var rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
        var previousTheta = rows[rowIndex - 1].theta;
        var currentTheta = rows[rowIndex].theta;
        var lower = Math.min(previousTheta, currentTheta);
        var upper = Math.max(previousTheta, currentTheta);
        var firstLevel = Math.ceil((lower - Math.PI) / (2 * Math.PI));
        var lastLevel = Math.floor((upper - Math.PI) / (2 * Math.PI));
        for (var levelIndex = firstLevel; levelIndex <= lastLevel; levelIndex += 1) {
          var level = (2 * levelIndex + 1) * Math.PI;
          if ((previousTheta < level && currentTheta >= level) || (previousTheta > level && currentTheta <= level)) {
            flipEvents.push({ time: rows[rowIndex].time, level: level, direction: currentTheta > previousTheta ? "forward" : "backward" });
          }
        }
      }
      return {
        config: config,
        rows: rows,
        separatrixEnergy: SEPARATRIX,
        thresholdCrossed: thresholdCrossed,
        crossingCount: crossingCount,
        flipEvents: flipEvents,
        flipCount: flipEvents.length,
        actualFlip: flipEvents.length > 0,
        netTurns: (finalRow.theta - rows[0].theta) / (2 * Math.PI),
        initialEnergy: rows[0].energy,
        finalEnergy: finalRow.energy,
        minEnergy: minEnergy,
        maxEnergy: maxEnergy,
        maxEnergyIncrease: maxEnergyIncrease,
        initialEnergyCertificate: rows[0].energyCertificate,
        finalEnergyCertificate: finalRow.energyCertificate,
        conservativeSeparatrix: config.damping === 0,
        dampingLaw: "Vdot=-c*omega^2"
      };
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      var properties = attrs || {};
      Object.keys(properties).forEach(function (key) {
        var value = properties[key];
        if (key === "text") node.textContent = value;
        else if (key === "className") node.className = value;
        else if (key === "htmlFor") node.htmlFor = value;
        else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
      });
      (children || []).forEach(function (child) {
        node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
      });
      return node;
    }

    function svgElement(doc, tag, attrs, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
      if (text !== undefined) node.textContent = text;
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

    function pathFor(rows, xKey, yKey, mapX, mapY) {
      var parts = [];
      rows.forEach(function (row) {
        parts.push((parts.length ? "L" : "M") + mapX(row[xKey]).toFixed(2) + " " + mapY(row[yKey]).toFixed(2));
      });
      return parts.join(" ");
    }

    function drawSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 430;
      var left = 52;
      var right = 18;
      var top = 24;
      var middle = 222;
      var bottom = 38;
      var phaseLeft = -Math.PI;
      var phaseRight = Math.PI;
      var omegaLimit = Math.max(2, Math.min(5, Math.max.apply(null, result.rows.map(function (row) { return Math.abs(row.omega); })) * 1.1));
      var mapPhaseX = function (value) { return left + (value - phaseLeft) / (phaseRight - phaseLeft) * (width - left - right); };
      var mapPhaseY = function (value) { return top + (omegaLimit - value) / (2 * omegaLimit) * (middle - top - 20); };
      var energyMax = Math.max(SEPARATRIX * 1.15, result.maxEnergy * 1.08);
      var mapEnergyX = function (value) { return left + value / (result.rows[result.rows.length - 1].time || 1) * (width - left - right); };
      var mapEnergyY = function (value) { return middle + 25 + (height - bottom - (middle + 25)) * (energyMax - value) / energyMax; };
      svg.appendChild(svgElement(doc, "title", {}, "阻尼单摆 Lyapunov 能量与相平面"));
      svg.appendChild(svgElement(doc, "desc", {}, "上图是角度周期化后的相轨与 c=0 保守参考 separatrix，下图是能量和 Vdot 所对应的下降趋势；实际翻转由未包裹角度穿越奇数 pi 判断。"));
      for (var i = 0; i <= 4; i += 1) {
        var phaseX = left + i / 4 * (width - left - right);
        svg.appendChild(svgElement(doc, "line", { x1: phaseX, y1: top, x2: phaseX, y2: middle - 20, class: "nl-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: phaseX, y: middle - 7, "text-anchor": "middle", class: "nl-small" }, formatNumber(-Math.PI + i * Math.PI / 2, 1)));
        var energyX = left + i / 4 * (width - left - right);
        svg.appendChild(svgElement(doc, "line", { x1: energyX, y1: middle + 25, x2: energyX, y2: height - bottom, class: "nl-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: energyX, y: height - 9, "text-anchor": "middle", class: "nl-small" }, formatNumber(result.rows[result.rows.length - 1].time * i / 4, 1)));
      }
      for (var j = 0; j <= 3; j += 1) {
        var phaseYValue = omegaLimit - 2 * omegaLimit * j / 3;
        var phaseY = mapPhaseY(phaseYValue);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: phaseY, x2: width - right, y2: phaseY, class: "nl-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: phaseY + 4, "text-anchor": "end", class: "nl-small" }, formatNumber(phaseYValue, 1)));
        var energyValue = energyMax * (3 - j) / 3;
        var energyY = mapEnergyY(energyValue);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: energyY, x2: width - right, y2: energyY, class: "nl-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: energyY + 4, "text-anchor": "end", class: "nl-small" }, formatNumber(energyValue, 1)));
      }
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapPhaseY(0), x2: width - right, y2: mapPhaseY(0), class: "nl-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: mapPhaseX(0), y1: top, x2: mapPhaseX(0), y2: middle - 20, class: "nl-axis" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "thetaWrapped", "omega", mapPhaseX, mapPhaseY), class: "nl-trajectory" }));
      var separatrixPoints = [];
      for (var theta = -Math.PI; theta <= Math.PI + 0.001; theta += 0.03) {
        var omega = Math.sqrt(Math.max(0, 2 * (SEPARATRIX - (1 - Math.cos(theta)))));
        separatrixPoints.push({ theta: theta, omega: omega });
      }
      if (result.conservativeSeparatrix) {
        var upper = pathFor(separatrixPoints, "theta", "omega", mapPhaseX, mapPhaseY);
        var lower = pathFor(separatrixPoints.slice().reverse().map(function (point) { return { theta: point.theta, omega: -point.omega }; }), "theta", "omega", mapPhaseX, mapPhaseY);
        svg.appendChild(svgElement(doc, "path", { d: upper, class: "nl-separatrix" }));
        svg.appendChild(svgElement(doc, "path", { d: lower, class: "nl-separatrix" }));
      }
      svg.appendChild(svgElement(doc, "circle", { cx: mapPhaseX(result.rows[0].thetaWrapped), cy: mapPhaseY(result.rows[0].omega), r: 4.5, class: "nl-start" }));
      svg.appendChild(svgElement(doc, "circle", { cx: mapPhaseX(result.rows[result.rows.length - 1].thetaWrapped), cy: mapPhaseY(result.rows[result.rows.length - 1].omega), r: 4.5, class: "nl-end" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapEnergyY(SEPARATRIX), x2: width - right, y2: mapEnergyY(SEPARATRIX), class: "nl-level" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "time", "energy", mapEnergyX, mapEnergyY), class: "nl-energy" }));
      svg.appendChild(svgElement(doc, "text", { x: left + 5, y: top + 13, class: "nl-label" }, result.conservativeSeparatrix ? "相平面：theta (wrapped), omega；红虚线 c=0 separatrix" : "相平面：theta (wrapped), omega；V=2 仅作能量阈值"));
      svg.appendChild(svgElement(doc, "text", { x: left + 5, y: middle + 16, class: "nl-label" }, "能量 V；红虚线 V=2 能量阈值"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 9, "text-anchor": "end", class: "nl-small" }, "t (s)"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "nl-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
    }

    function renderLedger(doc, hostNode, result) {
      var body = element(doc, "tbody");
      var stride = Math.max(1, Math.floor((result.rows.length - 1) / 12));
      result.rows.forEach(function (row, index) {
        if (index % stride !== 0 && index !== result.rows.length - 1) return;
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(row.index) }),
          element(doc, "td", { text: formatNumber(row.time, 2) }),
          element(doc, "td", { text: formatNumber(row.thetaWrapped, 3) }),
          element(doc, "td", { text: formatNumber(row.omega, 3) }),
          element(doc, "td", { text: formatNumber(row.energy, 4) }),
          element(doc, "td", { text: formatNumber(row.vDot, 4) }),
          element(doc, "td", { text: row.energyCertificate })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "RK4 轨迹账本；角度按 2pi 周期显示，动力学积分仍使用未包裹角度" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "step" }), element(doc, "th", { text: "t (s)" }), element(doc, "th", { text: "theta (rad)" }),
          element(doc, "th", { text: "omega (rad/s)" }), element(doc, "th", { text: "V" }), element(doc, "th", { text: "Vdot" }), element(doc, "th", { text: "energy certificate" })
        ])]),
        body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "vdot",
          prompt: "无外力阻尼单摆的 Vdot=-c*omega^2 说明什么？",
          expected: "nonpositive",
          choices: [
            { value: "nonpositive", label: "始终不增" },
            { value: "positive", label: "始终增加" },
            { value: "random", label: "由 RK4 随机决定" }
          ]
        },
        {
          key: "boundary",
          prompt: "归一化单摆的 separatrix 能量是多少？",
          expected: "two",
          choices: [
            { value: "two", label: "V=2" },
            { value: "one", label: "V=1" },
            { value: "pi", label: "V=pi" }
          ]
        },
        {
          key: "lasalle",
          prompt: "c>0 时 LaSalle 的关键不变集判断是什么？",
          expected: "equilibrium",
          choices: [
            { value: "equilibrium", label: "omega=0 中只有平衡点可保持" },
            { value: "all", label: "omega=0 的整条线都会停住" },
            { value: "energy", label: "Vdot<0 处才有收敛" }
          ]
        }
      ];
    }

    function renderPredictions(state, refs) {
      questionSpecs().forEach(function (spec, index) {
        refs.questions[index].buttons.forEach(function (button) {
          var selected = state.predictions[spec.key] === button.value;
          button.node.setAttribute("aria-pressed", selected ? "true" : "false");
          if (!state.revealed) {
            button.node.textContent = button.label;
            button.node.className = "";
          } else {
            var correct = button.value === spec.expected;
            button.node.textContent = (correct ? "✓ " : "") + button.label;
            button.node.className = correct ? "nl-correct" : selected ? "nl-wrong" : "";
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
      var shell = element(doc, "div", { className: "nl-lab" });
      shell.appendChild(element(doc, "h3", { text: "非线性实验：阻尼单摆的 Lyapunov 能量与相平面" }));
      shell.appendChild(element(doc, "p", { className: "nl-note", text: "归一化模型 theta_dot=omega、omega_dot=-sin(theta)-c*omega；无外力时 V=0.5*omega^2+1-cos(theta)，Vdot=-c*omega^2。RK4 只用于确定性数值轨迹，不能替代 Lyapunov/LaSalle 的条件分析。" }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec, index) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "nl-choice-grid" });
        var question = { buttons: [] };
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
        refs.questions[index] = question;
      });
      var actions = element(doc, "div", { className: "nl-actions" });
      var reveal = element(doc, "button", { type: "button", className: "nl-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "nl-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controlRefs = {};

      function makeRange(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
        var output = element(doc, "output", { text: formatNumber(state.config[key], digits) });
        controlRefs[key] = { input: input, output: output, digits: digits };
        return element(doc, "div", { className: "nl-control" }, [element(doc, "label", {}, [label + " = ", output]), input]);
      }

      var controls = element(doc, "div", { className: "nl-controls" }, [
        makeRange("theta0", "初始角度 theta0 (rad)", -Math.PI, Math.PI, 0.05, 2),
        makeRange("omega0", "初始角速度 omega0 (rad/s)", -4, 4, 0.05, 2),
        makeRange("damping", "阻尼 c", 0, 1.2, 0.02, 2),
        makeRange("duration", "仿真时长 (s)", 2, 24, 0.5, 1),
        makeRange("dt", "RK4 步长 dt (s)", 0.01, 0.12, 0.01, 2),
        element(doc, "p", { className: "nl-note", text: "c=0 时 V=2 是保守系统 separatrix；c>0 时它只是能量阈值。theta 按 2pi 周期解释，实际翻转看未包裹 theta 是否穿越奇数 pi。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 430", role: "img", "aria-label": "阻尼单摆相平面和 Lyapunov 能量图" });
      var svgFrame = element(doc, "div", { className: "nl-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "nl-metrics" });
      var tableHost = element(doc, "div", { className: "nl-table-wrap" });
      var certificate = element(doc, "div", { className: "nl-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "nl-layout" }, [controls, element(doc, "div", { className: "nl-stage" }, [svgFrame, metricsHost, tableHost, certificate])]));
      shell.appendChild(predictionHost);
      shell.appendChild(actions);
      shell.appendChild(feedback);
      shell.appendChild(resultShell);
      clear(rootNode);
      rootNode.appendChild(shell);

      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
          state.feedback = "请先完成三项预测；相轨、能量和账本会在提交后出现。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。调参不会重新上锁。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "单摆预测、图和账本已重置。");
      });
      Object.keys(controlRefs).forEach(function (key) {
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
        Object.keys(controlRefs).forEach(function (key) {
          controlRefs[key].input.value = String(result.config[key]);
          controlRefs[key].output.textContent = formatNumber(result.config[key], controlRefs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "nl-feedback" + (state.feedback.indexOf("请先") === 0 ? " nl-wrong" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "初始 V", formatNumber(result.initialEnergy, 4)));
        metricsHost.appendChild(metric(doc, "末端 V", formatNumber(result.finalEnergy, 4)));
        metricsHost.appendChild(metric(doc, "Vdot 最大值", formatNumber(Math.max.apply(null, result.rows.map(function (row) { return row.vDot; })), 4)));
        metricsHost.appendChild(metric(doc, "V=2 阈值穿越", result.thresholdCrossed ? "是" : "否"));
        metricsHost.appendChild(metric(doc, "实际翻转 (odd pi)", result.actualFlip ? "是" : "否"));
        metricsHost.appendChild(metric(doc, "初始 / 末端能量证书", result.initialEnergyCertificate + " / " + result.finalEnergyCertificate));
        metricsHost.appendChild(metric(doc, "翻转事件 / 净转数", result.flipCount + " / " + formatNumber(result.netTurns, 3)));
        metricsHost.appendChild(metric(doc, "最大能量上升", formatNumber(result.maxEnergyIncrease, 5)));
        renderLedger(doc, tableHost, result);
        clear(certificate);
        certificate.appendChild(element(doc, "p", { text: "能量账证书：V=0.5*omega^2+1-cos(theta)，沿无外力轨迹 Vdot=-c*omega^2；c>0 时 V 不增，所以初始 V<2 的能量子水平集不能越过 V=2 阈值。" }));
        certificate.appendChild(element(doc, "p", { text: "V>2 只表示初始能量足够，不单凭它断言一定翻转：有阻尼会耗散。表中的“V=2 阈值穿越”只记录能量阈值变化；“实际翻转”另由未包裹 theta 穿越奇数 pi 的事件记录。只有 c=0 时，V=2 才是保守系统相平面 separatrix。" }));
        certificate.appendChild(element(doc, "p", { text: "LaSalle/相空间边界：在圆柱相空间 theta mod 2pi 上，下垂平衡对除倒立平衡及其稳定流形外的初值几乎全局吸引；不能把它改写成 R^2 上唯一的全局平衡。受控力矩、外部扰动、摩擦模型误差和离散控制器需要另行分析。" }));
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var baseline = runExperiment(DEFAULTS);
      var repeat = runExperiment(DEFAULTS);
      check(baseline.rows.length === Math.round(DEFAULTS.duration / DEFAULTS.dt) + 1, "default row count");
      check(JSON.stringify(baseline.rows) === JSON.stringify(repeat.rows), "deterministic RK4 trajectory");
      check(nearly(derivative({ theta: 0, omega: 2 }, 0.3).omega, -0.6, 1e-12), "derivative damping term");
      check(Math.abs(baseline.maxEnergyIncrease) < 2e-5, "damped energy does not rise materially");
      var conservative = runExperiment({ theta0: 0.8, omega0: 1.1, damping: 0, duration: 4, dt: 0.01 });
      check(Math.abs(conservative.finalEnergy - conservative.initialEnergy) < 2e-8, "conservation when damping is zero");
      var saddle = runExperiment({ theta0: Math.PI, omega0: 0, damping: 0.2, duration: 2, dt: 0.02 });
      check(nearly(saddle.initialEnergy, SEPARATRIX, 1e-12) && saddle.initialEnergyCertificate === "threshold-level", "separatrix boundary energy");
      check(Math.abs(saddle.finalEnergy - SEPARATRIX) < 1e-10, "upright equilibrium stays at boundary");
      check(!saddle.actualFlip, "upright equilibrium has no actual flip");
      var inside = runExperiment({ theta0: 1, omega0: 0, damping: 0.3, duration: 4, dt: 0.02 });
      check(inside.initialEnergy < SEPARATRIX && !inside.thresholdCrossed && !inside.actualFlip, "inside energy sublevel is a no-flip certificate");
      var outside = runExperiment({ theta0: 0, omega0: 2.2, damping: 0.8, duration: 2, dt: 0.01 });
      check(outside.initialEnergy > SEPARATRIX && outside.initialEnergyCertificate === "outside-certificate", "outside energy is not a flip guarantee");
      var invalid = false;
      try { normalizeConfig({ dt: 0 }); } catch (error) { invalid = error instanceof RangeError; }
      check(invalid, "invalid dt rejected");
      invalid = false;
      try { normalizeConfig({ theta0: Infinity }); } catch (error2) { invalid = error2 instanceof RangeError; }
      check(invalid, "nonfinite theta rejected");
      return { checks: checks };
    }

    return {
      LAB_ID: LAB_ID,
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      derivative: derivative,
      energy: energy,
      rk4Step: rk4Step,
      runExperiment: runExperiment,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
