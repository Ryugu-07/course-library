(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-safe-control-cbf", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-safe-control-cbf self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-safe-control-cbf self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "auto-safe-control-cbf";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-safe-control-cbf-styles";
    var EPS = 1e-10;
    var DEFAULTS = {
      gap0: 45,
      egoSpeed0: 18,
      leadSpeed0: 20,
      d0: 8,
      timeHeadway: 1.5,
      alpha: 0.6,
      leadBrake: 2,
      nominalGain: 0.12,
      relativeGain: 0.4,
      duration: 10,
      dt: 0.1
    };
    var A_MIN = -4;
    var A_MAX = 2;

    var STYLE_TEXT = [
      '[data-learning-lab="auto-safe-control-cbf"]{--sc-blue:var(--cl-blue,#315f9d);--sc-orange:var(--cl-gold,#9b6a12);--sc-green:var(--cl-green,#39734d);--sc-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-safe-control-cbf"] *{box-sizing:border-box}[data-learning-lab="auto-safe-control-cbf"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-safe-control-cbf"] h3,[data-learning-lab="auto-safe-control-cbf"] h4{margin:0;letter-spacing:0}[data-learning-lab="auto-safe-control-cbf"] h3{font-size:1.16rem}[data-learning-lab="auto-safe-control-cbf"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-safe-control-cbf"] p{margin:8px 0}[data-learning-lab="auto-safe-control-cbf"] .sc-note,[data-learning-lab="auto-safe-control-cbf"] .sc-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-safe-control-cbf"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-safe-control-cbf"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-safe-control-cbf"] .sc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-safe-control-cbf"] button,[data-learning-lab="auto-safe-control-cbf"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-safe-control-cbf"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-safe-control-cbf"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-safe-control-cbf"] button[aria-pressed="true"],[data-learning-lab="auto-safe-control-cbf"] .sc-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-safe-control-cbf"] button:focus-visible,[data-learning-lab="auto-safe-control-cbf"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-safe-control-cbf"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-safe-control-cbf"] .sc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-safe-control-cbf"] .sc-actions>*{flex:1 1 170px}[data-learning-lab="auto-safe-control-cbf"] .sc-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-safe-control-cbf"] .sc-correct{color:var(--sc-green)}[data-learning-lab="auto-safe-control-cbf"] .sc-wrong{color:var(--sc-red)}',
      '[data-learning-lab="auto-safe-control-cbf"] .sc-layout{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-safe-control-cbf"] .sc-controls,[data-learning-lab="auto-safe-control-cbf"] .sc-stage{min-width:0}[data-learning-lab="auto-safe-control-cbf"] .sc-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-safe-control-cbf"] .sc-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-safe-control-cbf"] .sc-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-safe-control-cbf"] .sc-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-safe-control-cbf"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-safe-control-cbf"] .sc-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-safe-control-cbf"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-safe-control-cbf"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-safe-control-cbf"] .sc-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-safe-control-cbf"] .sc-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-safe-control-cbf"] .sc-gap{fill:none;stroke:var(--sc-blue);stroke-width:2.6}[data-learning-lab="auto-safe-control-cbf"] .sc-safe-gap{fill:none;stroke:var(--sc-orange);stroke-width:2.2;stroke-dasharray:6 4}[data-learning-lab="auto-safe-control-cbf"] .sc-ego{fill:none;stroke:var(--sc-green);stroke-width:2.5}[data-learning-lab="auto-safe-control-cbf"] .sc-lead{fill:none;stroke:var(--sc-red);stroke-width:2.2}[data-learning-lab="auto-safe-control-cbf"] .sc-h{fill:none;stroke:var(--sc-blue);stroke-width:2.5}[data-learning-lab="auto-safe-control-cbf"] .sc-nominal{fill:none;stroke:var(--sc-orange);stroke-width:2.3}[data-learning-lab="auto-safe-control-cbf"] .sc-safe{fill:none;stroke:var(--sc-green);stroke-width:2.6}[data-learning-lab="auto-safe-control-cbf"] .sc-zero{stroke:var(--sc-red);stroke-width:1.2;stroke-dasharray:4 4}[data-learning-lab="auto-safe-control-cbf"] .sc-label{font-size:11px}[data-learning-lab="auto-safe-control-cbf"] .sc-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-safe-control-cbf"] .sc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-safe-control-cbf"] .sc-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-safe-control-cbf"] .sc-metric:nth-child(3n+1){border-color:var(--sc-blue)}[data-learning-lab="auto-safe-control-cbf"] .sc-metric:nth-child(3n+2){border-color:var(--sc-orange)}[data-learning-lab="auto-safe-control-cbf"] .sc-metric:nth-child(3n){border-color:var(--sc-green)}[data-learning-lab="auto-safe-control-cbf"] .sc-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-safe-control-cbf"] .sc-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-safe-control-cbf"] .sc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-safe-control-cbf"] table{width:100%;min-width:900px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="auto-safe-control-cbf"] th,[data-learning-lab="auto-safe-control-cbf"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-safe-control-cbf"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-safe-control-cbf"] .sc-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--sc-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="auto-safe-control-cbf"] .sc-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-safe-control-cbf"] .sc-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-safe-control-cbf"] .sc-stage-frame{padding:4px}[data-learning-lab="auto-safe-control-cbf"] table{font-size:10.8px}[data-learning-lab="auto-safe-control-cbf"] th,[data-learning-lab="auto-safe-control-cbf"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-safe-control-cbf"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) { if (!condition) throw new Error(message); }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function nearly(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
    }

    function clamp(value, lower, upper) { return Math.min(upper, Math.max(lower, value)); }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function normalizeConfig(input) {
      var source = input || {};
      var gap0 = finite(source.gap0 === undefined ? DEFAULTS.gap0 : source.gap0, "gap0");
      var egoSpeed0 = finite(source.egoSpeed0 === undefined ? DEFAULTS.egoSpeed0 : source.egoSpeed0, "egoSpeed0");
      var leadSpeed0 = finite(source.leadSpeed0 === undefined ? DEFAULTS.leadSpeed0 : source.leadSpeed0, "leadSpeed0");
      var d0 = finite(source.d0 === undefined ? DEFAULTS.d0 : source.d0, "d0");
      var timeHeadway = finite(source.timeHeadway === undefined ? DEFAULTS.timeHeadway : source.timeHeadway, "timeHeadway");
      var alpha = finite(source.alpha === undefined ? DEFAULTS.alpha : source.alpha, "alpha");
      var leadBrake = finite(source.leadBrake === undefined ? DEFAULTS.leadBrake : source.leadBrake, "leadBrake");
      var nominalGain = finite(source.nominalGain === undefined ? DEFAULTS.nominalGain : source.nominalGain, "nominalGain");
      var relativeGain = finite(source.relativeGain === undefined ? DEFAULTS.relativeGain : source.relativeGain, "relativeGain");
      var duration = finite(source.duration === undefined ? DEFAULTS.duration : source.duration, "duration");
      var dt = finite(source.dt === undefined ? DEFAULTS.dt : source.dt, "dt");
      if (gap0 < 10 || gap0 > 80) throw new RangeError("gap0 must be in [10, 80]");
      if (egoSpeed0 < 0 || egoSpeed0 > 35) throw new RangeError("egoSpeed0 must be in [0, 35]");
      if (leadSpeed0 < 0 || leadSpeed0 > 35) throw new RangeError("leadSpeed0 must be in [0, 35]");
      if (d0 < 2 || d0 > 15) throw new RangeError("d0 must be in [2, 15]");
      if (timeHeadway < 0.5 || timeHeadway > 3.5) throw new RangeError("timeHeadway must be in [0.5, 3.5]");
      if (alpha < 0.1 || alpha > 2) throw new RangeError("alpha must be in [0.1, 2]");
      if (leadBrake < 0 || leadBrake > 4) throw new RangeError("leadBrake must be in [0, 4]");
      if (nominalGain < 0.02 || nominalGain > 0.3) throw new RangeError("nominalGain must be in [0.02, 0.3]");
      if (relativeGain < 0 || relativeGain > 1.2) throw new RangeError("relativeGain must be in [0, 1.2]");
      if (duration < 4 || duration > 20) throw new RangeError("duration must be in [4, 20]");
      if (dt < 0.05 || dt > 0.4) throw new RangeError("dt must be in [0.05, 0.4]");
      return { gap0: gap0, egoSpeed0: egoSpeed0, leadSpeed0: leadSpeed0, d0: d0, timeHeadway: timeHeadway, alpha: alpha, leadBrake: leadBrake, nominalGain: nominalGain, relativeGain: relativeGain, duration: duration, dt: dt };
    }

    function barrierValue(gap, egoSpeed, config) { return gap - config.d0 - config.timeHeadway * egoSpeed; }

    function cbfUpperBound(gap, egoSpeed, leadSpeed, config) {
      var h = barrierValue(gap, egoSpeed, config);
      return (leadSpeed - egoSpeed + config.alpha * h) / config.timeHeadway;
    }

    function nominalAcceleration(gap, egoSpeed, leadSpeed, config) {
      var h = barrierValue(gap, egoSpeed, config);
      return config.nominalGain * h + config.relativeGain * (leadSpeed - egoSpeed);
    }

    function runExperiment(input) {
      var config = normalizeConfig(input);
      var steps = Math.round(config.duration / config.dt);
      var gap = config.gap0;
      var egoSpeed = config.egoSpeed0;
      var leadSpeed = config.leadSpeed0;
      var rows = [];
      var infeasibleSteps = 0;
      var violatedSteps = 0;
      var safeDifferentSteps = 0;
      var minH = Infinity;
      var minGap = Infinity;
      var minFeasibilityMargin = Infinity;
      for (var index = 0; index <= steps; index += 1) {
        var time = index * config.dt;
        var h = barrierValue(gap, egoSpeed, config);
        var upper = cbfUpperBound(gap, egoSpeed, leadSpeed, config);
        var nominalRaw = nominalAcceleration(gap, egoSpeed, leadSpeed, config);
        var nominalActuator = clamp(nominalRaw, A_MIN, A_MAX);
        var feasibleUpper = Math.min(A_MAX, upper);
        var feasible = feasibleUpper >= A_MIN - EPS;
        var safe = feasible ? clamp(nominalActuator, A_MIN, feasibleUpper) : A_MIN;
        var constraintResidual = leadSpeed - egoSpeed - config.timeHeadway * safe + config.alpha * h;
        if (!feasible) infeasibleSteps += 1;
        if (constraintResidual < -1e-8) violatedSteps += 1;
        if (Math.abs(safe - nominalActuator) > 1e-8) safeDifferentSteps += 1;
        minH = Math.min(minH, h);
        minGap = Math.min(minGap, gap);
        minFeasibilityMargin = Math.min(minFeasibilityMargin, feasibleUpper - A_MIN);
        rows.push({
          index: index,
          time: time,
          gap: gap,
          egoSpeed: egoSpeed,
          leadSpeed: leadSpeed,
          h: h,
          nominalRaw: nominalRaw,
          nominalActuator: nominalActuator,
          cbfUpper: upper,
          safeAction: safe,
          feasible: feasible,
          constraintResidual: constraintResidual
        });
        if (index < steps) {
          gap = gap + config.dt * (leadSpeed - egoSpeed);
          egoSpeed = Math.max(0, egoSpeed + config.dt * safe);
          leadSpeed = Math.max(0, leadSpeed - config.dt * config.leadBrake);
        }
      }
      return {
        config: config,
        rows: rows,
        actuatorBounds: { min: A_MIN, max: A_MAX },
        initialH: rows[0].h,
        finalH: rows[rows.length - 1].h,
        minH: minH,
        minGap: minGap,
        minFeasibilityMargin: minFeasibilityMargin,
        infeasibleSteps: infeasibleSteps,
        violatedSteps: violatedSteps,
        safeDifferentSteps: safeDifferentSteps,
        discreteModel: "forward Euler gap and speed update",
        relativeDegree: 1
      };
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      var properties = attrs || {};
      Object.keys(properties).forEach(function (key) {
        var value = properties[key];
        if (key === "text") node.textContent = value;
        else if (key === "className") node.className = value;
        else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
      });
      (children || []).forEach(function (child) { node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child); });
      return node;
    }

    function svgElement(doc, tag, attrs, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
    function installStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }
    function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }

    function pathFor(rows, xKey, yKey, mapX, mapY) {
      return rows.map(function (row, index) { return (index ? "L" : "M") + mapX(row[xKey]).toFixed(2) + " " + mapY(row[yKey]).toFixed(2); }).join(" ");
    }

    function drawSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 500;
      var left = 52;
      var right = 18;
      var top = 24;
      var band = 145;
      var second = 295;
      var third = 445;
      var bottom = 38;
      var finalTime = result.rows[result.rows.length - 1].time || 1;
      var gapMax = Math.max(10, Math.max.apply(null, result.rows.map(function (row) { return Math.max(row.gap, result.config.d0 + result.config.timeHeadway * row.egoSpeed); })) * 1.08);
      var speedMax = Math.max(5, Math.max.apply(null, result.rows.map(function (row) { return Math.max(row.egoSpeed, row.leadSpeed); })) * 1.08);
      var actionMax = 4.5;
      var hValues = result.rows.map(function (row) { return row.h; });
      var hAbs = Math.max(2, Math.max.apply(null, hValues.map(function (value) { return Math.abs(value); })) * 1.1);
      var mapX = function (value) { return left + value / finalTime * (width - left - right); };
      var mapGap = function (value) { return top + (band - top - 18) * (gapMax - value) / gapMax; };
      var mapSpeed = function (value) { return band + 20 + (second - 20 - (band + 20)) * (speedMax - value) / speedMax; };
      var mapH = function (value) { return second + 20 + (third - 20 - (second + 20)) * (hAbs - value) / (2 * hAbs); };
      var mapAction = function (value) { return third + 20 + (height - bottom - (third + 20)) * (actionMax - value) / (2 * actionMax); };
      svg.appendChild(svgElement(doc, "title", {}, "自适应巡航 CBF 安全过滤器离散仿真"));
      svg.appendChild(svgElement(doc, "desc", {}, "上图显示实际间距和安全间距，中图显示前车/本车速度，下图显示屏障函数与标称和安全加速度。"));
      for (var i = 0; i <= 4; i += 1) {
        var x = left + i / 4 * (width - left - right);
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: top, x2: x, y2: height - bottom, class: "sc-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: x, y: height - 9, "text-anchor": "middle", class: "sc-small" }, formatNumber(finalTime * i / 4, 1)));
      }
      [top, band, second, third].forEach(function (y) { svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: "sc-axis" })); });
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapH(0), x2: width - right, y2: mapH(0), class: "sc-zero" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapAction(0), x2: width - right, y2: mapAction(0), class: "sc-zero" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "time", "gap", mapX, mapGap), class: "sc-gap" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "time", "h", mapX, mapH), class: "sc-h" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "time", "egoSpeed", mapX, mapSpeed), class: "sc-ego" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "time", "leadSpeed", mapX, mapSpeed), class: "sc-lead" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "time", "nominalActuator", mapX, mapAction), class: "sc-nominal" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "time", "safeAction", mapX, mapAction), class: "sc-safe" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "time", "cbfUpper", mapX, mapAction), class: "sc-h" }));
      svg.appendChild(svgElement(doc, "text", { x: left + 5, y: top + 13, class: "sc-label" }, "gap 蓝；d0+T*v 安全间距 橙虚线"));
      svg.appendChild(svgElement(doc, "text", { x: left + 5, y: band + 14, class: "sc-label" }, "速度：ego 绿；lead 红"));
      svg.appendChild(svgElement(doc, "text", { x: left + 5, y: second + 14, class: "sc-label" }, "h=d-d0-T*v；红虚线 h=0"));
      svg.appendChild(svgElement(doc, "text", { x: left + 5, y: third + 14, class: "sc-label" }, "加速度：nominal 橙；safe 绿；CBF upper 蓝"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 9, "text-anchor": "end", class: "sc-small" }, "t (s)"));
    }

    function metric(doc, label, value) { return element(doc, "div", { className: "sc-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }

    function renderLedger(doc, hostNode, result) {
      var body = element(doc, "tbody");
      var stride = Math.max(1, Math.floor((result.rows.length - 1) / 14));
      result.rows.forEach(function (row, index) {
        if (index % stride !== 0 && index !== result.rows.length - 1) return;
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(row.index) }), element(doc, "td", { text: formatNumber(row.time, 2) }), element(doc, "td", { text: formatNumber(row.gap, 3) }),
          element(doc, "td", { text: formatNumber(row.egoSpeed, 3) }), element(doc, "td", { text: formatNumber(row.h, 3) }), element(doc, "td", { text: formatNumber(row.nominalActuator, 3) }),
          element(doc, "td", { text: formatNumber(row.cbfUpper, 3) }), element(doc, "td", { text: formatNumber(row.safeAction, 3) }), element(doc, "td", { text: row.feasible ? "yes" : "NO" })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "ACC/CBF 逐步账本；间距 m、速度 m/s、加速度 m/s^2" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "k" }), element(doc, "th", { text: "t" }), element(doc, "th", { text: "gap" }), element(doc, "th", { text: "v ego" }), element(doc, "th", { text: "h" }),
          element(doc, "th", { text: "nominal" }), element(doc, "th", { text: "CBF upper" }), element(doc, "th", { text: "safe action" }), element(doc, "th", { text: "feasible" })
        ])]), body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "bound",
          prompt: "h=d-d0-T*v 且 hdot+alpha*h>=0 对加速度给出什么？",
          expected: "upper",
          choices: [
            { value: "upper", label: "a <= (vlead-v+alpha*h)/T" },
            { value: "lower", label: "a >= (vlead-v+alpha*h)/T" },
            { value: "none", label: "对 a 没有限制" }
          ]
        },
        {
          key: "projection",
          prompt: "安全过滤器的目标是什么？",
          expected: "nearest",
          choices: [
            { value: "nearest", label: "在可行集内贴近 nominal" },
            { value: "zero", label: "永远把加速度设为 0" },
            { value: "max", label: "永远选择最大加速度" }
          ]
        },
        {
          key: "guarantee",
          prompt: "离散 toy 仿真中 h>=0 的形式保证怎样理解？",
          expected: "conditional",
          choices: [
            { value: "conditional", label: "依赖模型、步长、可行性等前提" },
            { value: "absolute", label: "对任意失配都绝对安全" },
            { value: "plot", label: "只要曲线好看就成立" }
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
            button.node.className = correct ? "sc-correct" : selected ? "sc-wrong" : "";
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
      var shell = element(doc, "div", { className: "sc-lab" });
      shell.appendChild(element(doc, "h3", { text: "安全控制实验：自适应巡航的 CBF 安全过滤器" }));
      shell.appendChild(element(doc, "p", { className: "sc-note", text: "toy 纵向模型：h=d-d0-T*v，hdot=(vlead-v)-T*a。CBF 条件 hdot+alpha*h>=0 给出加速度上界；nominal 先过执行器界，再投影到 CBF 可行集。前车以固定 leadBrake 离散减速。" }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec, index) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "sc-choice-grid" });
        var question = { buttons: [] };
        spec.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
          button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); });
          question.buttons.push({ value: choice.value, label: choice.label, node: button });
          grid.appendChild(button);
        });
        fieldset.appendChild(grid);
        predictionHost.appendChild(fieldset);
        refs.questions[index] = question;
      });
      var actions = element(doc, "div", { className: "sc-actions" });
      var reveal = element(doc, "button", { type: "button", className: "sc-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "sc-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controlRefs = {};

      function makeRange(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
        var output = element(doc, "output", { text: formatNumber(state.config[key], digits) });
        controlRefs[key] = { input: input, output: output, digits: digits };
        return element(doc, "div", { className: "sc-control" }, [element(doc, "label", {}, [label + " = ", output]), input]);
      }

      var controls = element(doc, "div", { className: "sc-controls" }, [
        makeRange("gap0", "初始间距 gap0 (m)", 10, 80, 1, 0),
        makeRange("egoSpeed0", "本车初速 (m/s)", 0, 35, 1, 0),
        makeRange("leadSpeed0", "前车初速 (m/s)", 0, 35, 1, 0),
        makeRange("d0", "静态安全距离 d0 (m)", 2, 15, 1, 0),
        makeRange("timeHeadway", "时间车头时距 T (s)", 0.5, 3.5, 0.1, 1),
        makeRange("alpha", "CBF alpha", 0.1, 2, 0.1, 1),
        makeRange("leadBrake", "前车固定制动 (m/s^2)", 0, 4, 0.1, 1),
        makeRange("nominalGain", "nominal gap 增益", 0.02, 0.3, 0.01, 2),
        makeRange("relativeGain", "nominal 相对速度增益", 0, 1.2, 0.05, 2),
        makeRange("duration", "仿真时长 (s)", 4, 20, 0.5, 1),
        makeRange("dt", "离散步长 dt (s)", 0.05, 0.4, 0.05, 2),
        element(doc, "p", { className: "sc-note", text: "执行器固定为 a in [-4, 2] m/s^2。CBF 相对阶为 1，因为 a 直接出现在 hdot；若 upper<aMin，安全集合在当前 toy 模型下不可行。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 500", role: "img", "aria-label": "自适应巡航间距、速度、屏障函数和动作图" });
      var svgFrame = element(doc, "div", { className: "sc-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "sc-metrics" });
      var tableHost = element(doc, "div", { className: "sc-table-wrap" });
      var certificate = element(doc, "div", { className: "sc-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "sc-layout" }, [controls, element(doc, "div", { className: "sc-stage" }, [svgFrame, metricsHost, tableHost, certificate])]));
      shell.appendChild(predictionHost);
      shell.appendChild(actions);
      shell.appendChild(feedback);
      shell.appendChild(resultShell);
      clear(rootNode);
      rootNode.appendChild(shell);

      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
          state.feedback = "请先完成三项预测；间距、速度、h 和动作账本会在提交后出现。";
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
        announce(api, rootNode, "CBF 预测、图和账本已重置。");
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
        feedback.className = "sc-feedback" + (state.feedback.indexOf("请先") === 0 ? " sc-wrong" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "初始 h (m)", formatNumber(result.initialH, 3)));
        metricsHost.appendChild(metric(doc, "最小 h (m)", formatNumber(result.minH, 3)));
        metricsHost.appendChild(metric(doc, "最小 gap (m)", formatNumber(result.minGap, 3)));
        metricsHost.appendChild(metric(doc, "安全修正步数", String(result.safeDifferentSteps)));
        metricsHost.appendChild(metric(doc, "不可行步数", String(result.infeasibleSteps)));
        metricsHost.appendChild(metric(doc, "违反 CBF 步数", String(result.violatedSteps)));
        renderLedger(doc, tableHost, result);
        clear(certificate);
        certificate.appendChild(element(doc, "p", { text: "解析账：h=d-d0-T*v，hdot=(vlead-v)-T*a；因此 hdot+alpha*h>=0 等价于 a<=upper=(vlead-v+alpha*h)/T。safe action 是 nominalActuator 在 [" + A_MIN + ", " + A_MAX + "] 与该上界交集中的最近点。" }));
        certificate.appendChild(element(doc, "p", { text: "可行性账：当前 upper>=aMin 才有非空执行器/CBF 交集；不可行时实验只记录 aMin 作为紧急动作并标红，不能把它称为安全证书。相对阶为 1。" }));
        certificate.appendChild(element(doc, "p", { text: "保证边界：仿真采用前向 Euler、固定前车制动和无延迟测量；真实系统的采样、执行器延迟、加速度/制动模型失配、车轮约束和 h 的离散裕度都需另行验证。连续时间 CBF 条件不是对任意失配的绝对安全承诺。" }));
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var baseline = runExperiment(DEFAULTS);
      var repeat = runExperiment(DEFAULTS);
      check(baseline.rows.length === Math.round(DEFAULTS.duration / DEFAULTS.dt) + 1, "default row count");
      check(JSON.stringify(baseline.rows) === JSON.stringify(repeat.rows), "deterministic discrete simulation");
      check(baseline.initialH > 0, "default starts inside safety set");
      check(baseline.infeasibleSteps === 0, "default CBF set remains feasible");
      check(baseline.rows.every(function (row) { return row.cbfUpper - row.safeAction >= -1e-9 || !row.feasible; }), "safe action respects CBF upper bound");
      var boundary = runExperiment({ gap0: 35, egoSpeed0: 18, leadSpeed0: 18, d0: 8, timeHeadway: 1.5, alpha: 0.6, leadBrake: 0, nominalGain: 0.3, relativeGain: 0, duration: 4, dt: 0.1 });
      check(nearly(boundary.initialH, 0, 1e-12), "h boundary is zero");
      check(nearly(boundary.rows[0].cbfUpper, 0, 1e-12) && nearly(boundary.rows[0].safeAction, 0, 1e-12), "boundary gives zero upper bound");
      var infeasible = runExperiment({ gap0: 10, egoSpeed0: 35, leadSpeed0: 0, d0: 15, timeHeadway: 3.5, alpha: 2, leadBrake: 4, nominalGain: 0.3, relativeGain: 1.2, duration: 4, dt: 0.4 });
      check(infeasible.infeasibleSteps > 0, "infeasible CBF intersection detected");
      var invalid = false;
      try { normalizeConfig({ timeHeadway: 0 }); } catch (error) { invalid = error instanceof RangeError; }
      check(invalid, "invalid time headway rejected");
      invalid = false;
      try { normalizeConfig({ gap0: Infinity }); } catch (error2) { invalid = error2 instanceof RangeError; }
      check(invalid, "nonfinite gap rejected");
      return { checks: checks };
    }

    return {
      LAB_ID: LAB_ID,
      DEFAULTS: DEFAULTS,
      ACTUATOR_BOUNDS: { min: A_MIN, max: A_MAX },
      normalizeConfig: normalizeConfig,
      barrierValue: barrierValue,
      cbfUpperBound: cbfUpperBound,
      nominalAcceleration: nominalAcceleration,
      runExperiment: runExperiment,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
