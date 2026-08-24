(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-pid-loop", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-pid-loop self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-pid-loop self-test: FAIL\n" + error.stack);
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
    var STYLE_ID = "auto-pid-loop-styles";
    var EPS = 1e-9;
    var DEFAULTS = {
      kp: 4,
      ki: 0.8,
      kd: 0.35,
      beta: 0.75,
      disturbance: -0.15,
      antiWindup: true,
      dt: 0.1,
      steps: 140,
      tau: 1.6,
      limit: 1.2,
      disturbanceTime: 6,
      setpointTime: 1,
      antiWindupGain: 1.1,
      derivativeSmoothing: 0.65
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-pid-loop"]{--pid-blue:var(--cl-blue,#315f9d);--pid-gold:var(--cl-gold,#9b6a12);--pid-green:var(--cl-green,#39734d);--pid-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-pid-loop"] *{box-sizing:border-box}[data-learning-lab="auto-pid-loop"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-pid-loop"] h3,[data-learning-lab="auto-pid-loop"] h4{margin:0;color:var(--fg,currentColor);letter-spacing:0}[data-learning-lab="auto-pid-loop"] h3{font-size:1.16rem}[data-learning-lab="auto-pid-loop"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-pid-loop"] p{margin:8px 0}[data-learning-lab="auto-pid-loop"] .pid-note,[data-learning-lab="auto-pid-loop"] .pid-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-pid-loop"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-pid-loop"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-pid-loop"] .pid-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-pid-loop"] button,[data-learning-lab="auto-pid-loop"] select,[data-learning-lab="auto-pid-loop"] input{font:inherit}',
      '[data-learning-lab="auto-pid-loop"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-pid-loop"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-pid-loop"] button[aria-pressed="true"],[data-learning-lab="auto-pid-loop"] .pid-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-pid-loop"] button:focus-visible,[data-learning-lab="auto-pid-loop"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-pid-loop"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-pid-loop"] .pid-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-pid-loop"] .pid-actions>*{flex:1 1 170px}[data-learning-lab="auto-pid-loop"] .pid-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-pid-loop"] .pid-pass{color:var(--pid-green)}[data-learning-lab="auto-pid-loop"] .pid-warn{color:var(--pid-red)}',
      '[data-learning-lab="auto-pid-loop"] .pid-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-pid-loop"] .pid-controls,[data-learning-lab="auto-pid-loop"] .pid-stage{min-width:0}[data-learning-lab="auto-pid-loop"] .pid-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-pid-loop"] .pid-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-pid-loop"] .pid-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-pid-loop"] .pid-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-pid-loop"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-pid-loop"] .pid-check{display:flex;align-items:center;gap:9px;min-height:44px;color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-pid-loop"] .pid-check input{width:20px;height:20px;accent-color:var(--accent,#315f9d)}',
      '[data-learning-lab="auto-pid-loop"] .pid-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-pid-loop"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-pid-loop"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-pid-loop"] .pid-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-pid-loop"] .pid-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-pid-loop"] .pid-output{fill:none;stroke:var(--pid-blue);stroke-width:2.8}[data-learning-lab="auto-pid-loop"] .pid-reference{fill:none;stroke:var(--pid-green);stroke-width:1.8;stroke-dasharray:6 4}[data-learning-lab="auto-pid-loop"] .pid-control{fill:none;stroke:var(--pid-gold);stroke-width:2.4}[data-learning-lab="auto-pid-loop"] .pid-bound{stroke:var(--pid-red);stroke-width:1.6;stroke-dasharray:4 4}[data-learning-lab="auto-pid-loop"] .pid-event{stroke:var(--pid-red);stroke-width:1.2;stroke-dasharray:3 4}[data-learning-lab="auto-pid-loop"] .pid-label{font-size:11px}[data-learning-lab="auto-pid-loop"] .pid-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-pid-loop"] .pid-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-pid-loop"] .pid-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-pid-loop"] .pid-metric:nth-child(3n+1){border-color:var(--pid-blue)}[data-learning-lab="auto-pid-loop"] .pid-metric:nth-child(3n+2){border-color:var(--pid-gold)}[data-learning-lab="auto-pid-loop"] .pid-metric:nth-child(3n){border-color:var(--pid-green)}[data-learning-lab="auto-pid-loop"] .pid-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-pid-loop"] .pid-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-pid-loop"] .pid-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-pid-loop"] table{width:100%;min-width:850px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-pid-loop"] th,[data-learning-lab="auto-pid-loop"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-pid-loop"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-pid-loop"] .pid-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--pid-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}[data-learning-lab="auto-pid-loop"] .pid-certificate.pid-blocked{border-color:var(--pid-red)}',
      '@media(max-width:900px){[data-learning-lab="auto-pid-loop"] .pid-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-pid-loop"] .pid-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-pid-loop"] .pid-stage-frame{padding:4px}[data-learning-lab="auto-pid-loop"] table{font-size:10.8px}[data-learning-lab="auto-pid-loop"] th,[data-learning-lab="auto-pid-loop"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-pid-loop"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function clamp(value, low, high) {
      return Math.max(low, Math.min(high, value));
    }

    function normalizeConfig(input) {
      var source = input || {};
      var kp = finite(source.kp === undefined ? DEFAULTS.kp : source.kp, "Kp");
      var ki = finite(source.ki === undefined ? DEFAULTS.ki : source.ki, "Ki");
      var kd = finite(source.kd === undefined ? DEFAULTS.kd : source.kd, "Kd");
      var beta = finite(source.beta === undefined ? DEFAULTS.beta : source.beta, "beta");
      var disturbance = finite(
        source.disturbance === undefined ? DEFAULTS.disturbance : source.disturbance,
        "disturbance"
      );
      var steps = Math.round(finite(source.steps === undefined ? DEFAULTS.steps : source.steps, "steps"));
      if (kp < 0 || kp > 8) throw new RangeError("Kp must be in [0, 8]");
      if (ki < 0 || ki > 5) throw new RangeError("Ki must be in [0, 5]");
      if (kd < 0 || kd > 2.5) throw new RangeError("Kd must be in [0, 2.5]");
      if (beta < 0 || beta > 1) throw new RangeError("beta must be in [0, 1]");
      if (disturbance < -0.8 || disturbance > 0.4) throw new RangeError("disturbance out of range");
      if (steps < 80 || steps > 220) throw new RangeError("steps must be in [80, 220]");
      return {
        kp: kp,
        ki: ki,
        kd: kd,
        beta: beta,
        disturbance: disturbance,
        antiWindup: source.antiWindup === undefined ? DEFAULTS.antiWindup : Boolean(source.antiWindup),
        dt: DEFAULTS.dt,
        steps: steps,
        tau: DEFAULTS.tau,
        limit: DEFAULTS.limit,
        disturbanceTime: DEFAULTS.disturbanceTime,
        setpointTime: DEFAULTS.setpointTime,
        antiWindupGain: DEFAULTS.antiWindupGain,
        derivativeSmoothing: DEFAULTS.derivativeSmoothing
      };
    }

    function simulate(input) {
      var config = normalizeConfig(input);
      var y = 0;
      var previousY = 0;
      var integral = 0;
      var filteredRate = 0;
      var rows = [];
      var iae = 0;
      var saturationSteps = 0;
      var maxOvershoot = 0;
      var maxAbsControl = 0;
      var minAfterDisturbance = Infinity;
      for (var i = 0; i < config.steps; i += 1) {
        var time = i * config.dt;
        var reference = time >= config.setpointTime ? 1 : 0;
        var disturbance = time >= config.disturbanceTime ? config.disturbance : 0;
        var error = reference - y;
        var pTerm = config.kp * (config.beta * reference - y);
        var measuredRate = (y - previousY) / config.dt;
        filteredRate = config.derivativeSmoothing * filteredRate +
          (1 - config.derivativeSmoothing) * measuredRate;
        var dTerm = -config.kd * filteredRate;
        var iTerm = integral;
        var unsaturated = pTerm + iTerm + dTerm;
        var saturated = clamp(unsaturated, -config.limit, config.limit);
        var saturatedNow = Math.abs(unsaturated - saturated) > EPS;
        if (saturatedNow) saturationSteps += 1;
        var correction = config.antiWindup && config.ki > EPS
          ? config.antiWindupGain * (saturated - unsaturated)
          : 0;
        var integralNext = integral + config.dt * (config.ki * error + correction);
        var decay = Math.exp(-config.dt / config.tau);
        var nextY = decay * y + (1 - decay) * (saturated + disturbance);
        iae += Math.abs(error) * config.dt;
        if (time >= config.setpointTime) maxOvershoot = Math.max(maxOvershoot, y - reference);
        if (time >= config.disturbanceTime) minAfterDisturbance = Math.min(minAfterDisturbance, y);
        maxAbsControl = Math.max(maxAbsControl, Math.abs(saturated));
        rows.push({
          t: time,
          r: reference,
          disturbance: disturbance,
          error: error,
          p: pTerm,
          i: iTerm,
          d: dTerm,
          uUnsat: unsaturated,
          uSat: saturated,
          saturated: saturatedNow,
          y: y,
          yNext: nextY,
          integralNext: integralNext
        });
        previousY = y;
        y = nextY;
        integral = integralNext;
      }
      var last = rows[rows.length - 1];
      return {
        config: config,
        rows: rows,
        metrics: {
          iae: iae,
          saturationSteps: saturationSteps,
          saturationFraction: saturationSteps / rows.length,
          maxOvershoot: Math.max(0, maxOvershoot),
          maxAbsControl: maxAbsControl,
          finalOutput: last ? last.yNext : 0,
          finalIntegral: integral,
          minAfterDisturbance: Number.isFinite(minAfterDisturbance) ? minAfterDisturbance : 0
        }
      };
    }

    function compareAntiWindup(input) {
      var config = normalizeConfig(input);
      var enabled = simulate(config);
      var disabled = simulate(Object.assign({}, config, { antiWindup: false }));
      return { enabled: enabled, disabled: disabled };
    }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) < 5e-10) return "0";
      if (places === 0) return value.toFixed(0);
      var output = value.toFixed(places);
      return output.replace(/0+$/, "").replace(/\.$/, "");
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

    function pathFor(rows, value, mapX, mapY) {
      return rows.map(function (row, index) {
        return (index ? "L" : "M") + mapX(row.t).toFixed(2) + " " + mapY(row[value]).toFixed(2);
      }).join(" ");
    }

    function drawPidSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 430;
      var left = 48;
      var right = 17;
      var top = 28;
      var panelHeight = 155;
      var gap = 38;
      var bottom = 40;
      var plotWidth = width - left - right;
      var xMax = result.config.steps * result.config.dt;
      var mapX = function (time) { return left + time / xMax * plotWidth; };
      var yTop = function (value) { return top + panelHeight - (value + 0.35) / 1.75 * panelHeight; };
      var yBottom = function (value) { return top + panelHeight + gap + panelHeight - (value + 1.15) / 2.3 * panelHeight; };
      svg.appendChild(svgElement(doc, "title", {}, "PID 闭环输出、设定值与饱和控制量"));
      svg.appendChild(svgElement(doc, "desc", {}, "上图是对象输出 y 与设定值，下图是未饱和和饱和后的控制量；红色虚线是执行器边界。"));
      [0, 0.5, 1, 1.5].forEach(function (value) {
        var y = yTop(value);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: value === 0 ? "pid-axis" : "pid-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: y + 4, "text-anchor": "end", class: "pid-small" }, formatNumber(value, 1)));
      });
      [-1, -0.5, 0, 0.5, 1].forEach(function (value) {
        var y = yBottom(value);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: value === 0 ? "pid-axis" : "pid-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: y + 4, "text-anchor": "end", class: "pid-small" }, formatNumber(value, 1)));
      });
      [0, 2, 4, 6, 8, 10, 12, 14].forEach(function (time) {
        if (time > xMax) return;
        var x = mapX(time);
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: top, x2: x, y2: top + panelHeight, class: "pid-grid" }));
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: top + panelHeight + gap, x2: x, y2: top + panelHeight * 2 + gap, class: "pid-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: x, y: height - 18, "text-anchor": "middle", class: "pid-small" }, String(time)));
      });
      var disturbanceX = mapX(result.config.disturbanceTime);
      svg.appendChild(svgElement(doc, "line", { x1: disturbanceX, y1: top, x2: disturbanceX, y2: top + panelHeight * 2 + gap, class: "pid-event" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "y", mapX, yTop), class: "pid-output" }));
      svg.appendChild(svgElement(doc, "path", {
        d: result.rows.map(function (row, index) {
          return (index ? "L" : "M") + mapX(row.t).toFixed(2) + " " + yTop(row.r).toFixed(2);
        }).join(" "),
        class: "pid-reference"
      }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "uSat", mapX, yBottom), class: "pid-control" }));
      [1, -1].forEach(function (value) {
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: yBottom(value), x2: width - right, y2: yBottom(value), class: "pid-bound" }));
      });
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + 13, class: "pid-label" }, "对象输出 y / 设定值 r"));
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + panelHeight + gap + 13, class: "pid-label" }, "控制量 u_sat / 执行器饱和"));
      svg.appendChild(svgElement(doc, "text", { x: disturbanceX + 5, y: top + 27, class: "pid-small" }, "扰动阶跃"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 4, "text-anchor": "end", class: "pid-small" }, "时间 / s"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "pid-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function renderLedger(doc, hostNode, result) {
      var body = element(doc, "tbody");
      var stride = Math.max(1, Math.floor(result.rows.length / 14));
      result.rows.forEach(function (row, index) {
        if (index % stride !== 0 && index !== result.rows.length - 1) return;
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: formatNumber(row.t, 1) }),
          element(doc, "td", { text: formatNumber(row.r, 1) }),
          element(doc, "td", { text: formatNumber(row.disturbance, 2) }),
          element(doc, "td", { text: formatNumber(row.error, 3) }),
          element(doc, "td", { text: formatNumber(row.p, 3) }),
          element(doc, "td", { text: formatNumber(row.i, 3) }),
          element(doc, "td", { text: formatNumber(row.d, 3) }),
          element(doc, "td", { text: formatNumber(row.uUnsat, 3) }),
          element(doc, "td", { text: formatNumber(row.uSat, 3) }),
          element(doc, "td", { text: formatNumber(row.yNext, 3) })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "逐采样 PID 计算账本：P、I、D、饱和与对象更新" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "t" }),
          element(doc, "th", { text: "r" }),
          element(doc, "th", { text: "d" }),
          element(doc, "th", { text: "e" }),
          element(doc, "th", { text: "P" }),
          element(doc, "th", { text: "I" }),
          element(doc, "th", { text: "D" }),
          element(doc, "th", { text: "u*" }),
          element(doc, "th", { text: "u_sat" }),
          element(doc, "th", { text: "y_next" })
        ])]),
        body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "term",
          prompt: "哪一项累积过去的误差，用来消除常值扰动造成的静差？",
          expected: "i",
          choices: [
            { value: "p", label: "P：当前误差" },
            { value: "i", label: "I：误差积分" },
            { value: "d", label: "D：测量斜率" }
          ]
        },
        {
          key: "windup",
          prompt: "执行器已经饱和而误差仍同号时，打开反算抗饱和通常会怎样？",
          expected: "yes",
          choices: [
            { value: "yes", label: "抑制积分累积" },
            { value: "no", label: "让积分更快累积" },
            { value: "same", label: "与饱和无关" }
          ]
        },
        {
          key: "tradeoff",
          prompt: "两自由度 PID 中降低 β（比例设定值权重）主要先改变什么？",
          expected: "beta",
          choices: [
            { value: "beta", label: "减小设定值冲击" },
            { value: "disturbance", label: "让扰动消失" },
            { value: "plant", label: "改变对象时间常数" }
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
            button.node.className = correct ? "pid-pass" : selected ? "pid-warn" : "";
          }
        });
      });
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      installStyles(doc);
      var state = {
        config: normalizeConfig(DEFAULTS),
        predictions: {},
        revealed: false,
        feedback: ""
      };
      var refs = { questions: [] };
      var shell = element(doc, "div", { className: "pid-lab" });
      shell.appendChild(element(doc, "h3", { text: "PID 回路实验：同一组参数如何同时面对设定值与扰动" }));
      shell.appendChild(element(doc, "p", {
        className: "pid-note",
        text: "对象是带单一时间常数的一阶过程，执行器限幅为 ±1.2。先判断 P/I/D 与抗饱和，再揭晓可调参数和每个采样点的透明账本。"
      }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "pid-choice-grid" });
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
      var actions = element(doc, "div", { className: "pid-actions" });
      var reveal = element(doc, "button", { type: "button", className: "pid-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "pid-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controlRefs = {};
      function makeRange(key, label, min, max, step, digits) {
        var input = element(doc, "input", {
          type: "range",
          min: String(min),
          max: String(max),
          step: String(step),
          value: String(state.config[key]),
          "aria-label": label
        });
        var output = element(doc, "output", { text: formatNumber(state.config[key], digits) });
        controlRefs[key] = { input: input, output: output, digits: digits };
        return element(doc, "div", { className: "pid-control" }, [
          element(doc, "label", {}, [label + " = ", output]),
          input
        ]);
      }
      var antiCheckbox = element(doc, "input", { type: "checkbox", checked: state.config.antiWindup, "aria-label": "启用积分反算抗饱和" });
      controlRefs.antiWindup = antiCheckbox;
      var controls = element(doc, "div", { className: "pid-controls" }, [
        makeRange("kp", "Kp", 0, 6, 0.1, 1),
        makeRange("ki", "Ki", 0, 3, 0.05, 2),
        makeRange("kd", "Kd", 0, 1.5, 0.05, 2),
        makeRange("beta", "β", 0, 1, 0.05, 2),
        makeRange("disturbance", "扰动 d", -0.6, 0.2, 0.05, 2),
        element(doc, "label", { className: "pid-check" }, [antiCheckbox, "启用积分反算抗饱和"]),
        element(doc, "p", { className: "pid-note", text: "固定边界：dt=0.1 s、τ=1.6 s、r 在 1 s 阶跃，d 在 6 s 变为当前值；D 对测量斜率做一阶平滑。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 430", role: "img", "aria-label": "PID 输出与控制量曲线" });
      var svgFrame = element(doc, "div", { className: "pid-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "pid-metrics" });
      var tableHost = element(doc, "div", { className: "pid-table-wrap" });
      var certificate = element(doc, "p", { className: "pid-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "pid-layout" }, [
        controls,
        element(doc, "div", { className: "pid-stage" }, [svgFrame, metricsHost, tableHost, certificate])
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
          state.feedback = "请先完成三项预测；参数控件和计算账本会在提交后出现。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。拖动 Kp、Ki、Kd、β 或扰动，比较跟踪与抗扰。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "PID 预测、曲线和账本已重置。");
      });
      ["kp", "ki", "kd", "beta", "disturbance"].forEach(function (key) {
        controlRefs[key].input.addEventListener("input", function () {
          var next = Object.assign({}, state.config);
          next[key] = Number(controlRefs[key].input.value);
          state.config = normalizeConfig(next);
          state.feedback = "";
          render();
        });
      });
      antiCheckbox.addEventListener("change", function () {
        state.config = normalizeConfig(Object.assign({}, state.config, { antiWindup: antiCheckbox.checked }));
        state.feedback = "";
        render();
      });

      function render() {
        var result = simulate(state.config);
        ["kp", "ki", "kd", "beta", "disturbance"].forEach(function (key) {
          controlRefs[key].input.value = String(result.config[key]);
          controlRefs[key].output.textContent = formatNumber(result.config[key], controlRefs[key].digits);
        });
        antiCheckbox.checked = result.config.antiWindup;
        feedback.textContent = state.feedback;
        feedback.className = "pid-feedback" + (state.feedback.indexOf("请先") === 0 ? " pid-warn" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawPidSvg(doc, svg, result);
        var comparison = compareAntiWindup(result.config);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "IAE", formatNumber(result.metrics.iae, 3)));
        metricsHost.appendChild(metric(doc, "饱和采样数", String(result.metrics.saturationSteps)));
        metricsHost.appendChild(metric(doc, "最大超调", formatNumber(result.metrics.maxOvershoot, 3)));
        metricsHost.appendChild(metric(doc, "末端 y", formatNumber(result.metrics.finalOutput, 3)));
        metricsHost.appendChild(metric(doc, "抗饱和对照 IAE", formatNumber(comparison.disabled.metrics.iae, 3)));
        metricsHost.appendChild(metric(doc, "抗饱和开关", result.config.antiWindup ? "开" : "关"));
        renderLedger(doc, tableHost, result);
        certificate.className = "pid-certificate" + (result.metrics.saturationSteps ? "" : " pid-blocked");
        certificate.textContent =
          "模型边界：这里的 u_sat=clip(u*,−1.2,1.2) 进入一阶对象 y_next=a y+(1−a)(u_sat+d)，" +
          "不是任意真实阀门/电机的完整模型。当前 I 项在饱和时" +
          (result.config.antiWindup ? "通过 K_aw(u_sat−u*) 反算卸载" : "仍按 Ki e 累积，正是 windup 对照") +
          "；D 是测量微分并经过平滑，不能把曲线当成含时滞、噪声和非线性对象的普遍结论。";
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var baseline = simulate(DEFAULTS);
      var noAnti = simulate(Object.assign({}, DEFAULTS, { antiWindup: false }));
      check(baseline.rows.length === DEFAULTS.steps, "fixed simulation length");
      check(baseline.rows.every(function (row) {
        return Number.isFinite(row.yNext) && Number.isFinite(row.uSat) && Number.isFinite(row.i);
      }), "finite ledger");
      check(baseline.metrics.saturationSteps > 0, "default must demonstrate actuator saturation");
      check(Math.abs(baseline.metrics.finalIntegral - noAnti.metrics.finalIntegral) > 0.01, "anti-windup must change integral state");
      check(baseline.metrics.iae !== noAnti.metrics.iae, "anti-windup comparison");
      check(simulate({ kp: 0, ki: 0, kd: 0 }).metrics.maxAbsControl === 0, "zero controller");
      check(simulate({ kp: 2.4, ki: 0, kd: 0 }).metrics.finalOutput < 1, "P-only has static error under bounded object");
      check(normalizeConfig({ beta: 0 }).beta === 0, "beta validation");
      check(normalizeConfig({ disturbance: -0.6 }).disturbance === -0.6, "disturbance validation");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      simulate: simulate,
      compareAntiWindup: compareAntiWindup,
      mount: mount,
      selfTest: selfTest
    };
  }
);
