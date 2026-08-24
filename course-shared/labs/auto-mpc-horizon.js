(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-mpc-horizon", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-mpc-horizon self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-mpc-horizon self-test: FAIL\n" + error.stack);
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
    var STYLE_ID = "auto-mpc-horizon-styles";
    var EPS = 1e-9;
    var DEFAULTS = {
      horizon: 5,
      uMax: 0.6,
      xMax: 1.2,
      r: 0.12,
      steps: 14,
      a: 0.9,
      b: 0.4,
      q: 1,
      p: 2,
      target: 1,
      x0: 0,
      terminalTolerance: 0.02,
      controlGrid: 17,
      stateBins: 241
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-mpc-horizon"]{--mpc-blue:var(--cl-blue,#315f9d);--mpc-gold:var(--cl-gold,#9b6a12);--mpc-green:var(--cl-green,#39734d);--mpc-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-mpc-horizon"] *{box-sizing:border-box}[data-learning-lab="auto-mpc-horizon"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-mpc-horizon"] h3,[data-learning-lab="auto-mpc-horizon"] h4{margin:0;color:var(--fg,currentColor);letter-spacing:0}[data-learning-lab="auto-mpc-horizon"] h3{font-size:1.16rem}[data-learning-lab="auto-mpc-horizon"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-mpc-horizon"] p{margin:8px 0}[data-learning-lab="auto-mpc-horizon"] .mpc-note,[data-learning-lab="auto-mpc-horizon"] .mpc-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-mpc-horizon"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-mpc-horizon"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-mpc-horizon"] .mpc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-mpc-horizon"] button,[data-learning-lab="auto-mpc-horizon"] input{font:inherit}',
      '[data-learning-lab="auto-mpc-horizon"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-mpc-horizon"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-mpc-horizon"] button[aria-pressed="true"],[data-learning-lab="auto-mpc-horizon"] .mpc-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-mpc-horizon"] button:focus-visible,[data-learning-lab="auto-mpc-horizon"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-mpc-horizon"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-mpc-horizon"] .mpc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-mpc-horizon"] .mpc-actions>*{flex:1 1 170px}[data-learning-lab="auto-mpc-horizon"] .mpc-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-mpc-horizon"] .mpc-pass{color:var(--mpc-green)}[data-learning-lab="auto-mpc-horizon"] .mpc-warn{color:var(--mpc-red)}',
      '[data-learning-lab="auto-mpc-horizon"] .mpc-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-mpc-horizon"] .mpc-controls,[data-learning-lab="auto-mpc-horizon"] .mpc-stage{min-width:0}[data-learning-lab="auto-mpc-horizon"] .mpc-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-mpc-horizon"] .mpc-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-mpc-horizon"] .mpc-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-mpc-horizon"] .mpc-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-mpc-horizon"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-mpc-horizon"] .mpc-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-mpc-horizon"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-mpc-horizon"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-mpc-horizon"] .mpc-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-mpc-horizon"] .mpc-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-mpc-horizon"] .mpc-state{fill:none;stroke:var(--mpc-blue);stroke-width:2.8}[data-learning-lab="auto-mpc-horizon"] .mpc-plan{fill:none;stroke:var(--mpc-gold);stroke-width:2.2;stroke-dasharray:6 4}[data-learning-lab="auto-mpc-horizon"] .mpc-target{stroke:var(--mpc-green);stroke-width:1.8;stroke-dasharray:5 4}[data-learning-lab="auto-mpc-horizon"] .mpc-bound{stroke:var(--mpc-red);stroke-width:1.6;stroke-dasharray:4 4}[data-learning-lab="auto-mpc-horizon"] .mpc-input{fill:none;stroke:var(--mpc-gold);stroke-width:2.4}[data-learning-lab="auto-mpc-horizon"] .mpc-label{font-size:11px}[data-learning-lab="auto-mpc-horizon"] .mpc-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}[data-learning-lab="auto-mpc-horizon"] .mpc-infeasible{fill:var(--mpc-red);font-size:13px;font-weight:750}',
      '[data-learning-lab="auto-mpc-horizon"] .mpc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-mpc-horizon"] .mpc-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-mpc-horizon"] .mpc-metric:nth-child(3n+1){border-color:var(--mpc-blue)}[data-learning-lab="auto-mpc-horizon"] .mpc-metric:nth-child(3n+2){border-color:var(--mpc-gold)}[data-learning-lab="auto-mpc-horizon"] .mpc-metric:nth-child(3n){border-color:var(--mpc-green)}[data-learning-lab="auto-mpc-horizon"] .mpc-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-mpc-horizon"] .mpc-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-mpc-horizon"] .mpc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-mpc-horizon"] table{width:100%;min-width:650px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums;margin-top:10px}[data-learning-lab="auto-mpc-horizon"] th,[data-learning-lab="auto-mpc-horizon"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-mpc-horizon"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-mpc-horizon"] .mpc-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mpc-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}[data-learning-lab="auto-mpc-horizon"] .mpc-certificate.mpc-blocked{border-color:var(--mpc-red)}',
      '@media(max-width:900px){[data-learning-lab="auto-mpc-horizon"] .mpc-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-mpc-horizon"] .mpc-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-mpc-horizon"] .mpc-stage-frame{padding:4px}[data-learning-lab="auto-mpc-horizon"] table{font-size:10.8px}[data-learning-lab="auto-mpc-horizon"] th,[data-learning-lab="auto-mpc-horizon"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-mpc-horizon"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
      var horizon = Math.round(finite(source.horizon === undefined ? DEFAULTS.horizon : source.horizon, "horizon"));
      var uMax = finite(source.uMax === undefined ? DEFAULTS.uMax : source.uMax, "uMax");
      var xMax = finite(source.xMax === undefined ? DEFAULTS.xMax : source.xMax, "xMax");
      var r = finite(source.r === undefined ? DEFAULTS.r : source.r, "R");
      var steps = Math.round(finite(source.steps === undefined ? DEFAULTS.steps : source.steps, "steps"));
      if (horizon < 2 || horizon > 8) throw new RangeError("horizon must be in [2, 8]");
      if (uMax < 0.1 || uMax > 1) throw new RangeError("uMax must be in [0.1, 1]");
      if (xMax < 0.4 || xMax > 1.5) throw new RangeError("xMax must be in [0.4, 1.5]");
      if (r < 0.01 || r > 1) throw new RangeError("R must be in [0.01, 1]");
      if (steps < 8 || steps > 24) throw new RangeError("steps must be in [8, 24]");
      return {
        horizon: horizon,
        uMax: uMax,
        xMax: xMax,
        r: r,
        steps: steps,
        a: DEFAULTS.a,
        b: DEFAULTS.b,
        q: DEFAULTS.q,
        p: DEFAULTS.p,
        target: DEFAULTS.target,
        x0: DEFAULTS.x0,
        terminalTolerance: DEFAULTS.terminalTolerance,
        controlGrid: DEFAULTS.controlGrid,
        stateBins: DEFAULTS.stateBins
      };
    }

    function controlValues(config) {
      var values = [];
      for (var i = 0; i < config.controlGrid; i += 1) {
        values.push(-config.uMax + 2 * config.uMax * i / (config.controlGrid - 1));
      }
      return values;
    }

    function stateKey(x, config) {
      var fraction = (x + config.xMax) / (2 * config.xMax);
      var index = Math.round(clamp(fraction, 0, 1) * (config.stateBins - 1));
      return String(index);
    }

    function solveHorizon(input, currentState) {
      var config = normalizeConfig(input);
      var x0 = currentState === undefined ? config.x0 : finite(currentState, "current state");
      if (Math.abs(x0) > config.xMax + EPS) {
        return {
          config: config,
          feasible: false,
          x0: x0,
          states: [x0],
          inputs: [],
          stageCosts: [],
          cost: Infinity,
          reachableMax: x0,
          reason: "current state violates the state constraint"
        };
      }
      var controls = controlValues(config);
      var frontier = Object.create(null);
      frontier[stateKey(x0, config)] = {
        x: x0,
        cost: 0,
        states: [x0],
        inputs: [],
        stageCosts: []
      };
      var reachableMax = x0;
      for (var k = 0; k < config.horizon; k += 1) {
        var nextFrontier = Object.create(null);
        Object.keys(frontier).forEach(function (key) {
          var record = frontier[key];
          controls.forEach(function (u) {
            var nextX = config.a * record.x + config.b * u;
            if (nextX < -config.xMax - EPS || nextX > config.xMax + EPS) return;
            reachableMax = Math.max(reachableMax, nextX);
            var stageCost = config.q * Math.pow(record.x - config.target, 2) + config.r * u * u;
            var candidateCost = record.cost + stageCost;
            var nextKey = stateKey(nextX, config);
            var existing = nextFrontier[nextKey];
            if (!existing || candidateCost < existing.cost) {
              nextFrontier[nextKey] = {
                x: nextX,
                cost: candidateCost,
                states: record.states.concat([nextX]),
                inputs: record.inputs.concat([u]),
                stageCosts: record.stageCosts.concat([stageCost])
              };
            }
          });
        });
        frontier = nextFrontier;
        if (!Object.keys(frontier).length) break;
      }
      var best = null;
      Object.keys(frontier).forEach(function (key) {
        var record = frontier[key];
        var terminalSatisfied = record.x >= config.target - config.terminalTolerance - EPS;
        if (!terminalSatisfied) return;
        var totalCost = record.cost + config.p * Math.pow(record.x - config.target, 2);
        if (!best || totalCost < best.cost) {
          best = {
            config: config,
            feasible: true,
            x0: x0,
            states: record.states,
            inputs: record.inputs,
            stageCosts: record.stageCosts,
            terminalState: record.x,
            terminalError: record.x - config.target,
            cost: totalCost,
            reachableMax: reachableMax,
            reason: "terminal target band satisfied"
          };
        }
      });
      if (best) return best;
      return {
        config: config,
        feasible: false,
        x0: x0,
        states: [x0],
        inputs: [],
        stageCosts: [],
        terminalState: null,
        terminalError: null,
        cost: Infinity,
        reachableMax: reachableMax,
        reason: "no constrained sequence reaches the terminal target band"
      };
    }

    function runClosedLoop(input) {
      var config = normalizeConfig(input);
      var x = config.x0;
      var rows = [];
      var violationCount = 0;
      var totalCost = 0;
      for (var k = 0; k < config.steps; k += 1) {
        var plan = solveHorizon(config, x);
        var u = plan.feasible && plan.inputs.length ? plan.inputs[0] : 0;
        u = clamp(u, -config.uMax, config.uMax);
        var nextX = config.a * x + config.b * u;
        var stateOkay = nextX >= -config.xMax - EPS && nextX <= config.xMax + EPS;
        if (!stateOkay) violationCount += 1;
        var stageCost = config.q * Math.pow(x - config.target, 2) + config.r * u * u;
        totalCost += stageCost;
        rows.push({
          k: k,
          x: x,
          u: u,
          xNext: nextX,
          planFeasible: plan.feasible,
          planCost: plan.cost,
          stateOkay: stateOkay,
          predictedStates: plan.states,
          predictedInputs: plan.inputs
        });
        x = nextX;
      }
      return {
        config: config,
        rows: rows,
        finalState: x,
        violationCount: violationCount,
        totalCost: totalCost
      };
    }

    function evaluate(input) {
      var config = normalizeConfig(input);
      var initialPlan = solveHorizon(config, config.x0);
      var closedLoop = runClosedLoop(config);
      var sweep = [];
      for (var horizon = 2; horizon <= 8; horizon += 1) {
        sweep.push(solveHorizon(Object.assign({}, config, { horizon: horizon }), config.x0));
      }
      return {
        config: config,
        initialPlan: initialPlan,
        closedLoop: closedLoop,
        sweep: sweep
      };
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

    function pathFor(points, key, mapX, mapY) {
      return points.map(function (point, index) {
        return (index ? "L" : "M") + mapX(point.k).toFixed(2) + " " + mapY(point[key]).toFixed(2);
      }).join(" ");
    }

    function drawMpcSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 430;
      var left = 48;
      var right = 17;
      var top = 28;
      var panelHeight = 160;
      var gap = 42;
      var bottom = 35;
      var xMin = -Math.max(0.4, result.config.xMax * 1.1);
      var xMax = Math.max(1.2, result.config.xMax * 1.1);
      var mapX = function (value) { return left + value / Math.max(1, result.closedLoop.rows.length) * (width - left - right); };
      var mapState = function (value) { return top + panelHeight - (value - xMin) / (xMax - xMin) * panelHeight; };
      var mapInput = function (value) { return top + panelHeight + gap + panelHeight - (value + result.config.uMax * 1.25) / (2.5 * result.config.uMax) * panelHeight; };
      svg.appendChild(svgElement(doc, "title", {}, "受约束 MPC 的滚动时域规划与实际闭环轨迹"));
      svg.appendChild(svgElement(doc, "desc", {}, "上图显示状态约束、目标和第一时刻的预测计划，下图显示每步只执行的第一控制动作及输入约束。"));
      for (var i = 0; i <= 4; i += 1) {
        var yState = top + panelHeight * i / 4;
        var valueState = xMax - (xMax - xMin) * i / 4;
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: yState, x2: width - right, y2: yState, class: "mpc-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: yState + 4, "text-anchor": "end", class: "mpc-small" }, formatNumber(valueState, 1)));
        var yInput = top + panelHeight + gap + panelHeight * i / 4;
        var valueInput = result.config.uMax * 1.25 - 2.5 * result.config.uMax * i / 4;
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: yInput, x2: width - right, y2: yInput, class: "mpc-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: yInput + 4, "text-anchor": "end", class: "mpc-small" }, formatNumber(valueInput, 1)));
      }
      for (var step = 0; step <= result.closedLoop.rows.length; step += 2) {
        var x = mapX(step);
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: top, x2: x, y2: top + panelHeight, class: "mpc-grid" }));
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: top + panelHeight + gap, x2: x, y2: top + panelHeight * 2 + gap, class: "mpc-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: x, y: height - 15, "text-anchor": "middle", class: "mpc-small" }, String(step)));
      }
      [result.config.xMax, -result.config.xMax].forEach(function (value) {
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapState(value), x2: width - right, y2: mapState(value), class: "mpc-bound" }));
      });
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapState(result.config.target), x2: width - right, y2: mapState(result.config.target), class: "mpc-target" }));
      var statePoints = result.closedLoop.rows.map(function (row) { return { k: row.k, value: row.x }; });
      statePoints.push({ k: result.closedLoop.rows.length, value: result.closedLoop.finalState });
      var statePath = statePoints.map(function (point, index) {
        return (index ? "L" : "M") + mapX(point.k).toFixed(2) + " " + mapState(point.value).toFixed(2);
      }).join(" ");
      svg.appendChild(svgElement(doc, "path", { d: statePath, class: "mpc-state" }));
      if (result.initialPlan.feasible && result.initialPlan.states.length > 1) {
        var planPath = result.initialPlan.states.map(function (value, index) {
          return (index ? "L" : "M") + mapX(index).toFixed(2) + " " + mapState(value).toFixed(2);
        }).join(" ");
        svg.appendChild(svgElement(doc, "path", { d: planPath, class: "mpc-plan" }));
      }
      var inputPoints = result.closedLoop.rows.map(function (row) { return { k: row.k, value: row.u }; });
      svg.appendChild(svgElement(doc, "path", {
        d: inputPoints.map(function (point, index) {
          return (index ? "L" : "M") + mapX(point.k).toFixed(2) + " " + mapInput(point.value).toFixed(2);
        }).join(" "),
        class: "mpc-input"
      }));
      [result.config.uMax, -result.config.uMax].forEach(function (value) {
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapInput(value), x2: width - right, y2: mapInput(value), class: "mpc-bound" }));
      });
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + 13, class: "mpc-label" }, "状态 x：蓝实线实际，金虚线初始预测"));
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + panelHeight + gap + 13, class: "mpc-label" }, "输入 u：每步只执行第一动作"));
      if (!result.initialPlan.feasible) {
        svg.appendChild(svgElement(doc, "text", { x: width - right, y: top + 27, "text-anchor": "end", class: "mpc-infeasible" }, "当前时域不可行：显示安全零输入回退"));
      }
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 2, "text-anchor": "end", class: "mpc-small" }, "滚动时刻 k"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mpc-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function renderTables(doc, hostNode, result) {
      var sweepBody = element(doc, "tbody");
      result.sweep.forEach(function (plan) {
        sweepBody.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(plan.config.horizon) }),
          element(doc, "td", { text: plan.feasible ? "可行" : "不可行" }),
          element(doc, "td", { text: plan.feasible ? formatNumber(plan.terminalState, 3) : "max " + formatNumber(plan.reachableMax, 3) }),
          element(doc, "td", { text: formatNumber(plan.cost, 3) }),
          element(doc, "td", { text: plan.feasible && plan.inputs.length ? formatNumber(plan.inputs[0], 3) : "—" })
        ]));
      });
      var loopBody = element(doc, "tbody");
      result.closedLoop.rows.forEach(function (row) {
        loopBody.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(row.k) }),
          element(doc, "td", { text: formatNumber(row.x, 3) }),
          element(doc, "td", { text: formatNumber(row.u, 3) }),
          element(doc, "td", { text: formatNumber(row.xNext, 3) }),
          element(doc, "td", { text: row.planFeasible ? "可行" : "回退" }),
          element(doc, "td", { text: formatNumber(row.planCost, 3) }),
          element(doc, "td", { text: row.stateOkay ? "满足" : "越界" })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "时域扫描：终端约束 x_N ≥ target−0.02，输入/状态约束均保留" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "N" }),
          element(doc, "th", { text: "可行性" }),
          element(doc, "th", { text: "终端 x_N / 可达上界" }),
          element(doc, "th", { text: "代价 J" }),
          element(doc, "th", { text: "第一输入" })
        ])]),
        sweepBody
      ]));
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "滚动执行账本：重新优化，但每次只落实第一步" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "k" }),
          element(doc, "th", { text: "x_k" }),
          element(doc, "th", { text: "u_k" }),
          element(doc, "th", { text: "x_{k+1}" }),
          element(doc, "th", { text: "本次规划" }),
          element(doc, "th", { text: "规划代价" }),
          element(doc, "th", { text: "状态约束" })
        ])]),
        loopBody
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "horizon",
          prompt: "默认约束下，为什么 N=3 可能不可行而 N=5 可行？",
          expected: "long",
          choices: [
            { value: "long", label: "更长预测能到达终端带" },
            { value: "short", label: "短时域一定更安全" },
            { value: "same", label: "时域与可行性无关" }
          ]
        },
        {
          key: "constraints",
          prompt: "如果候选最优动作超过执行器上限，受约束 MPC 应怎样处理？",
          expected: "respect",
          choices: [
            { value: "respect", label: "拒绝该序列并保留约束" },
            { value: "clip", label: "先解无约束再事后限幅" },
            { value: "ignore", label: "忽略上限追求低代价" }
          ]
        },
        {
          key: "feedback",
          prompt: "滚动时域中实际执行哪一段输入？",
          expected: "first",
          choices: [
            { value: "first", label: "只执行第一步" },
            { value: "all", label: "执行整段计划" },
            { value: "last", label: "只执行最后一步" }
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
            button.node.className = correct ? "mpc-pass" : selected ? "mpc-warn" : "";
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
      var shell = element(doc, "div", { className: "mpc-lab" });
      shell.appendChild(element(doc, "h3", { text: "MPC 实验：预测时域、约束可行性与滚动第一步" }));
      shell.appendChild(element(doc, "p", {
        className: "mpc-note",
        text: "这是一个标量离散线性系统的受约束有限时域优化。输入和状态约束在候选序列生成时就被检查；它不是把无约束 LQR 结果事后裁剪。"
      }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "mpc-choice-grid" });
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
      var actions = element(doc, "div", { className: "mpc-actions" });
      var reveal = element(doc, "button", { type: "button", className: "mpc-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "mpc-feedback", "aria-live": "polite" });
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
        return element(doc, "div", { className: "mpc-control" }, [
          element(doc, "label", {}, [label + " = ", output]),
          input
        ]);
      }
      var controls = element(doc, "div", { className: "mpc-controls" }, [
        makeRange("horizon", "预测时域 N", 2, 8, 1, 0),
        makeRange("uMax", "输入上限 umax", 0.2, 0.9, 0.05, 2),
        makeRange("xMax", "状态上限 xmax", 0.6, 1.5, 0.05, 2),
        makeRange("r", "输入代价 R", 0.02, 0.8, 0.02, 2),
        element(doc, "p", { className: "mpc-note", text: "固定模型：x_next=0.9x+0.4u、target=1、x0=0、Q=1、终端代价 P=2。控制网格 17 点，状态约束 |x|≤xmax；这是教学用确定性离散近似。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 430", role: "img", "aria-label": "MPC 状态和输入曲线" });
      var svgFrame = element(doc, "div", { className: "mpc-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "mpc-metrics" });
      var tableHost = element(doc, "div", { className: "mpc-table-wrap" });
      var certificate = element(doc, "p", { className: "mpc-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "mpc-layout" }, [
        controls,
        element(doc, "div", { className: "mpc-stage" }, [svgFrame, metricsHost, tableHost, certificate])
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
          state.feedback = "请先完成三项预测；时域控件、可行性扫描和滚动账本会在提交后出现。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。调节 N、umax、xmax 或 R，观察可行性与代价的变化。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "MPC 预测、轨迹和可行性账本已重置。");
      });
      ["horizon", "uMax", "xMax", "r"].forEach(function (key) {
        controlRefs[key].input.addEventListener("input", function () {
          var next = Object.assign({}, state.config);
          next[key] = Number(controlRefs[key].input.value);
          state.config = normalizeConfig(next);
          state.feedback = "";
          render();
        });
      });

      function render() {
        var result = evaluate(state.config);
        ["horizon", "uMax", "xMax", "r"].forEach(function (key) {
          controlRefs[key].input.value = String(result.config[key]);
          controlRefs[key].output.textContent = formatNumber(result.config[key], controlRefs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "mpc-feedback" + (state.feedback.indexOf("请先") === 0 ? " mpc-warn" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawMpcSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "当前时域", "N=" + result.config.horizon));
        metricsHost.appendChild(metric(doc, "初始可行性", result.initialPlan.feasible ? "可行" : "不可行"));
        metricsHost.appendChild(metric(doc, "第一输入", result.initialPlan.feasible ? formatNumber(result.initialPlan.inputs[0], 3) : "安全回退 0"));
        metricsHost.appendChild(metric(doc, "闭环末端 x", formatNumber(result.closedLoop.finalState, 3)));
        metricsHost.appendChild(metric(doc, "约束越界数", String(result.closedLoop.violationCount)));
        metricsHost.appendChild(metric(doc, "闭环累计代价", formatNumber(result.closedLoop.totalCost, 3)));
        renderTables(doc, tableHost, result);
        certificate.className = "mpc-certificate" + (result.initialPlan.feasible ? "" : " mpc-blocked");
        certificate.textContent =
          "优化证书：每个候选序列逐步使用 x_{k+1}=0.9x_k+0.4u_k，拒绝 |x_k|>xmax 或 |u_k|>umax，" +
          "并要求终端 x_N≥target−0.02；目标是 Σ[(x_k−1)^2+R u_k^2]+2(x_N−1)^2。" +
          "当前结果使用 17 点输入网格和状态分箱，是受约束有限时域 MPC 的可解释教学近似；它没有调用、也没有把无约束 LQR 冒充成 MPC。";
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var baseline = evaluate(DEFAULTS);
      var shortPlan = solveHorizon(Object.assign({}, DEFAULTS, { horizon: 3 }), DEFAULTS.x0);
      var longPlan = solveHorizon(Object.assign({}, DEFAULTS, { horizon: 5 }), DEFAULTS.x0);
      check(baseline.initialPlan.feasible, "default horizon must be feasible");
      check(!shortPlan.feasible, "short horizon should fail terminal reachability");
      check(longPlan.feasible, "default long horizon should reach terminal band");
      check(longPlan.inputs.every(function (u) { return Math.abs(u) <= DEFAULTS.uMax + EPS; }), "input constraint");
      check(longPlan.states.every(function (x) { return Math.abs(x) <= DEFAULTS.xMax + EPS; }), "state constraint");
      check(baseline.closedLoop.rows.every(function (row) {
        return Number.isFinite(row.x) && Number.isFinite(row.u) && Number.isFinite(row.xNext);
      }), "finite closed-loop ledger");
      check(baseline.closedLoop.violationCount === 0, "closed-loop state safety");
      check(baseline.initialPlan.inputs.length === DEFAULTS.horizon, "finite horizon input count");
      check(!solveHorizon(Object.assign({}, DEFAULTS, { xMax: 0.8 }), DEFAULTS.x0).feasible, "incompatible state bound must be infeasible");
      check(evaluate(Object.assign({}, DEFAULTS, { r: 0.8 })).initialPlan.feasible, "cost weight does not remove feasible constraints");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      controlValues: controlValues,
      solveHorizon: solveHorizon,
      runClosedLoop: runClosedLoop,
      evaluate: evaluate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
