(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("newton-invariants", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "newton-invariants self-test: PASS (" +
          report.checks +
          " checks, " +
          report.scenarios +
          " scenarios)"
      );
    } catch (error) {
      console.error("newton-invariants self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-newton-invariants-style";
    var INSTANCE = 0;
    var DEFAULTS = {
      scenarioId: "isolated",
      frameAccel: 0.5,
      originId: "central",
      steps: 8
    };

    var SCENARIOS = [
      {
        id: "isolated",
        label: "孤立弹性碰撞",
        m1: 1,
        m2: 2,
        v1: 2,
        v2: -0.5,
        externalImpulse: 0,
        theorem: "系统外冲量为 0；碰撞冲量是内部成对力，弹性还额外使用动能守恒。"
      },
      {
        id: "pushed",
        label: "碰撞后受外推冲量",
        m1: 1,
        m2: 2,
        v1: 2,
        v2: -0.5,
        externalImpulse: 0.8,
        theorem: "碰撞内部冲量仍相消，但系统随后收到 J_ext=0.8，总动量按外冲量改变。"
      }
    ];

    var ORIGINS = [
      {
        id: "central",
        label: "中心固定原点",
        origin: [0, 0],
        position: [2, 1],
        force: [-1, -0.5],
        velocity: [0.4, 1.1],
        originVelocity: [0, 0]
      },
      {
        id: "shifted",
        label: "平移后的固定原点",
        origin: [0, 0.5],
        position: [2, 1],
        force: [-1, -0.5],
        velocity: [0.4, 1.1],
        originVelocity: [0, 0]
      },
      {
        id: "transverse",
        label: "横向力原点",
        origin: [0, 0],
        position: [2, 1],
        force: [0, 1],
        velocity: [0.4, 1.1],
        originVelocity: [0, 0]
      },
      {
        id: "moving",
        label: "移动中的原点",
        origin: [0, 0],
        position: [2, 1],
        force: [-1, -0.5],
        velocity: [0.4, 1.1],
        originVelocity: [0.3, 0]
      }
    ];

    var STYLE_TEXT = [
      ".nt-lab{--nt-blue:var(--cl-blue,#315f9d);--nt-gold:var(--cl-gold,#9b6a12);--nt-green:var(--cl-green,#39734d);--nt-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      ".nt-lab *,.nt-lab *::before,.nt-lab *::after{box-sizing:border-box;}.nt-lab [hidden]{display:none!important;}",
      ".nt-lab h3,.nt-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.nt-lab h3{font-size:1.18rem;}.nt-lab h4{margin-top:16px;font-size:1rem;}.nt-lab p{margin:.65em 0;}.nt-lab .nt-note,.nt-lab .nt-feedback,.nt-lab .nt-boundary{color:var(--fg-soft);font-size:13px;line-height:1.7;}",
      ".nt-lab button,.nt-lab select,.nt-lab input{font:inherit;letter-spacing:0;}.nt-lab button,.nt-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}.nt-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
      ".nt-lab button:hover{border-color:var(--accent);}.nt-lab button[aria-pressed=\"true\"],.nt-lab button.nt-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.nt-lab button:focus-visible,.nt-lab select:focus-visible,.nt-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".nt-lab .nt-predict{margin:14px 0;padding:13px 14px;border-left:3px solid var(--nt-gold);background:var(--bg);}.nt-lab .nt-predict-title{display:block;margin-bottom:10px;font-size:13px;}.nt-lab .nt-question-list{display:grid;gap:12px;}.nt-lab .nt-question{min-width:0;margin:0;padding:0;border:0;}.nt-lab .nt-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}.nt-lab .nt-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.nt-lab .nt-choice-row button{font-size:12px;}",
      ".nt-lab .nt-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.nt-lab .nt-actions>*{flex:1 1 155px;}.nt-lab .nt-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.nt-lab .nt-pass{color:var(--nt-green);}.nt-lab .nt-warn{color:var(--nt-red);}",
      ".nt-lab .nt-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 16px;margin:14px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.nt-lab .nt-control{display:grid;gap:5px;min-width:0;}.nt-lab .nt-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}.nt-lab .nt-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".nt-lab .nt-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.nt-lab .nt-interpretation{margin:12px 0;padding:11px 13px;border-left:3px solid var(--nt-green);background:var(--bg);font-size:13px;line-height:1.7;}.nt-lab .nt-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0;}.nt-lab .nt-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.nt-lab .nt-metric.nt-blue{border-top-color:var(--nt-blue);}.nt-lab .nt-metric.nt-gold{border-top-color:var(--nt-gold);}.nt-lab .nt-metric.nt-green{border-top-color:var(--nt-green);}.nt-lab .nt-metric.nt-red{border-top-color:var(--nt-red);}.nt-lab .nt-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.nt-lab .nt-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".nt-lab .nt-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:12px;}.nt-lab .nt-chart{min-width:0;}.nt-lab .nt-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.nt-lab svg{display:block;width:100%;height:auto;color:var(--fg);}.nt-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.nt-lab .nt-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.nt-lab table{width:100%;min-width:900px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.nt-lab th,.nt-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.nt-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.nt-lab .nt-ok{color:var(--nt-green);}.nt-lab .nt-fail{color:var(--nt-red);}",
      "@media(max-width:820px){.nt-lab .nt-controls,.nt-lab .nt-charts{grid-template-columns:repeat(2,minmax(0,1fr));}}",
      "@media(max-width:560px){.nt-lab .nt-controls,.nt-lab .nt-charts{grid-template-columns:minmax(0,1fr);}.nt-lab .nt-choice-row{grid-template-columns:minmax(0,1fr);}.nt-lab .nt-predict{padding-left:11px;padding-right:11px;}.nt-lab th,.nt-lab td{padding-left:5px;padding-right:5px;}}",
      "@media(prefers-reduced-motion:reduce){.nt-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function scenarioById(id) {
      for (var i = 0; i < SCENARIOS.length; i += 1) {
        if (SCENARIOS[i].id === id) return SCENARIOS[i];
      }
      throw new Error("Unknown Newton scenario: " + id);
    }

    function originById(id) {
      for (var i = 0; i < ORIGINS.length; i += 1) {
        if (ORIGINS[i].id === id) return ORIGINS[i];
      }
      throw new Error("Unknown angular-momentum origin: " + id);
    }

    function cross2(a, b) {
      return a[0] * b[1] - a[1] * b[0];
    }

    function subtract2(a, b) {
      return [a[0] - b[0], a[1] - b[1]];
    }

    function add2(a, b) {
      return [a[0] + b[0], a[1] + b[1]];
    }

    function scale2(value, vector) {
      return [value * vector[0], value * vector[1]];
    }

    function norm2(vector) {
      return Math.hypot(vector[0], vector[1]);
    }

    function elasticCollision1d(m1, m2, v1, v2) {
      var total = m1 + m2;
      if (!finite(m1) || !finite(m2) || m1 <= 0 || m2 <= 0 || total <= 0) {
        throw new Error("masses must be positive");
      }
      return {
        v1: ((m1 - m2) * v1 + 2 * m2 * v2) / total,
        v2: (2 * m1 * v1 + (m2 - m1) * v2) / total
      };
    }

    function collisionLedger(scenarioId) {
      var selected = scenarioById(scenarioId);
      var elastic = elasticCollision1d(selected.m1, selected.m2, selected.v1, selected.v2);
      var pBefore = selected.m1 * selected.v1 + selected.m2 * selected.v2;
      var pAfterCollision = selected.m1 * elastic.v1 + selected.m2 * elastic.v2;
      var internalImpulse1 = selected.m1 * (elastic.v1 - selected.v1);
      var internalImpulse2 = selected.m2 * (elastic.v2 - selected.v2);
      var pAfter = pAfterCollision + selected.externalImpulse;
      return {
        scenario: selected,
        postCollision: elastic,
        pBefore: pBefore,
        pAfterCollision: pAfterCollision,
        pAfter: pAfter,
        internalImpulse1: internalImpulse1,
        internalImpulse2: internalImpulse2,
        internalNet: internalImpulse1 + internalImpulse2,
        externalImpulse: selected.externalImpulse,
        momentumChange: pAfter - pBefore,
        momentumResidual: pAfter - pBefore - selected.externalImpulse
      };
    }

    function frameLedger(frameAccel) {
      var acceleration = Number(frameAccel);
      if (!finite(acceleration)) throw new Error("frame acceleration must be finite");
      var mass = 1;
      var realForce = 1.2;
      var inertialAcceleration = realForce / mass;
      var relativeAcceleration = inertialAcceleration - acceleration;
      var pseudoForce = -mass * acceleration;
      var residualWithoutPseudo = mass * relativeAcceleration - realForce;
      var residualWithPseudo = mass * relativeAcceleration - (realForce + pseudoForce);
      return {
        mass: mass,
        realForce: realForce,
        frameAcceleration: acceleration,
        inertialAcceleration: inertialAcceleration,
        relativeAcceleration: relativeAcceleration,
        pseudoForce: pseudoForce,
        residualWithoutPseudo: residualWithoutPseudo,
        residualWithPseudo: residualWithPseudo
      };
    }

    function angularLedger(originId) {
      var selected = originById(originId);
      var relativePosition = subtract2(selected.position, selected.origin);
      var momentum = selected.velocity.slice();
      var torque = cross2(relativePosition, selected.force);
      var angularMomentum = cross2(relativePosition, momentum);
      var movingCorrection = -cross2(selected.originVelocity, momentum);
      return {
        origin: selected,
        relativePosition: relativePosition,
        momentum: momentum,
        torque: torque,
        angularMomentum: angularMomentum,
        originVelocity: selected.originVelocity.slice(),
        movingCorrection: movingCorrection,
        derivative: torque + movingCorrection,
        fixedOriginCertificate: norm2(selected.originVelocity) < 1e-12 && Math.abs(torque) < 1e-12
      };
    }

    function exactPosition(initialPosition, initialVelocity, acceleration, time) {
      return add2(add2(initialPosition, scale2(time, initialVelocity)), scale2(0.5 * time * time, acceleration));
    }

    function trajectory(options) {
      var settings = options || {};
      var steps = Number(settings.steps === undefined ? DEFAULTS.steps : settings.steps);
      var horizon = Number(settings.horizon === undefined ? 4 : settings.horizon);
      if (!finite(steps) || !Number.isInteger(steps) || steps < 1 || steps > 1000) throw new Error("steps must be a positive integer");
      if (!finite(horizon) || horizon <= 0) throw new Error("horizon must be positive");
      var initialPosition = settings.initialPosition ? settings.initialPosition.slice() : [0, 0];
      var initialVelocity = settings.initialVelocity ? settings.initialVelocity.slice() : [1, 2];
      var acceleration = settings.acceleration ? settings.acceleration.slice() : [0, -1];
      var stepSize = horizon / steps;
      var eulerPosition = initialPosition.slice();
      var eulerVelocity = initialVelocity.slice();
      var points = [];
      for (var i = 0; i <= steps; i += 1) {
        var time = i * stepSize;
        var exact = exactPosition(initialPosition, initialVelocity, acceleration, time);
        points.push({
          index: i,
          time: time,
          exact: exact,
          euler: eulerPosition.slice(),
          error: norm2(subtract2(eulerPosition, exact))
        });
        eulerPosition = add2(eulerPosition, scale2(stepSize, eulerVelocity));
        eulerVelocity = add2(eulerVelocity, scale2(stepSize, acceleration));
      }
      return {
        horizon: horizon,
        steps: steps,
        stepSize: stepSize,
        initialPosition: initialPosition,
        initialVelocity: initialVelocity,
        acceleration: acceleration,
        points: points,
        exactEndpoint: points[points.length - 1].exact.slice(),
        eulerEndpoint: points[points.length - 1].euler.slice(),
        endpointError: points[points.length - 1].error
      };
    }

    function analyze(options) {
      var settings = options || {};
      var scenarioId = settings.scenarioId || DEFAULTS.scenarioId;
      var originId = settings.originId || DEFAULTS.originId;
      var frameAccel = settings.frameAccel === undefined ? DEFAULTS.frameAccel : settings.frameAccel;
      var steps = settings.steps === undefined ? DEFAULTS.steps : settings.steps;
      return {
        collision: collisionLedger(scenarioId),
        frame: frameLedger(frameAccel),
        angular: angularLedger(originId),
        trajectory: trajectory({ steps: steps }),
        assumptions: {
          inertial: Math.abs(Number(frameAccel)) < 1e-12,
          closedSystem: scenarioById(scenarioId).externalImpulse === 0,
          fixedOrigin: norm2(originById(originId).originVelocity) < 1e-12,
          exactTrajectory: "constant acceleration closed form"
        }
      };
    }

    function formatNumber(value, digits) {
      if (value === Infinity) return "∞";
      if (value === -Infinity) return "−∞";
      if (!finite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(places);
      var text = value.toFixed(places);
      return text.replace(/0+$/, "").replace(/\.$/, "");
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", value);
        else if (key === "text") node.textContent = value;
        else if (key.slice(0, 2) === "on" && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === null || child === undefined) return;
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function replaceChildren(node, children) {
      while (node.firstChild) node.removeChild(node.firstChild);
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
      });
    }

    function svgNode(doc, tag, attrs, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) {
        node.setAttribute(key, String(attrs[key]));
      });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function pathFrom(points, key, mapX, mapY) {
      return points.map(function (point, index) {
        return (index ? "L" : "M") + mapX(point[key][0]) + " " + mapY(point[key][1]);
      }).join(" ");
    }

    function freeBodySvg(doc, data, uid) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 520 270",
        role: "img",
        "aria-labelledby": uid + "-body-title " + uid + "-body-desc"
      });
      svg.appendChild(svgNode(doc, "title", { id: uid + "-body-title" }, "两物体自由体与冲量示意"));
      svg.appendChild(svgNode(
        doc,
        "desc",
        { id: uid + "-body-desc" },
        "两个物体的内部碰撞冲量方向相反；外推冲量只在推动预设中出现。"
      ));
      var group = svgNode(doc, "g", {});
      group.appendChild(svgNode(doc, "line", {
        x1: 42, y1: 190, x2: 478, y2: 190,
        stroke: "currentColor", "stroke-opacity": "0.35", "stroke-width": "1.2"
      }));
      group.appendChild(svgNode(doc, "rect", {
        x: 125, y: 145, width: 72, height: 45, rx: 4,
        fill: "var(--nt-blue)", "fill-opacity": "0.2", stroke: "var(--nt-blue)", "stroke-width": "2"
      }));
      group.appendChild(svgNode(doc, "rect", {
        x: 300, y: 125, width: 105, height: 65, rx: 4,
        fill: "var(--nt-gold)", "fill-opacity": "0.2", stroke: "var(--nt-gold)", "stroke-width": "2"
      }));
      group.appendChild(svgNode(doc, "text", { x: 161, y: 172, "text-anchor": "middle", "font-size": "13" }, "m₁"));
      group.appendChild(svgNode(doc, "text", { x: 352, y: 161, "text-anchor": "middle", "font-size": "13" }, "m₂"));
      function arrow(x1, y1, x2, y2, color, label) {
        group.appendChild(svgNode(doc, "line", {
          x1: x1, y1: y1, x2: x2, y2: y2,
          stroke: color, "stroke-width": "2.4", "stroke-linecap": "round"
        }));
        var direction = x2 >= x1 ? 1 : -1;
        group.appendChild(svgNode(doc, "path", {
          d: "M" + x2 + " " + y2 + " l" + (-8 * direction) + " -5 M" + x2 + " " + y2 + " l" + (-8 * direction) + " 5",
          fill: "none", stroke: color, "stroke-width": "2"
        }));
        group.appendChild(svgNode(doc, "text", {
          x: (x1 + x2) / 2, y: Math.min(y1, y2) - 8, "text-anchor": "middle", "font-size": "11"
        }, label));
      }
      arrow(205, 150, 275, 150, "var(--nt-red)", "J_int,1");
      arrow(292, 112, 222, 112, "var(--nt-red)", "J_int,2");
      if (Math.abs(data.collision.externalImpulse) > 1e-12) {
        arrow(78, 137, 120, 137, "var(--nt-green)", "J_ext");
      }
      group.appendChild(svgNode(doc, "text", {
        x: 260, y: 232, "text-anchor": "middle", "font-size": "12"
      }, "内部冲量相消；外冲量改变系统总动量"));
      svg.appendChild(group);
      return svg;
    }

    function trajectorySvg(doc, data, uid) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 520 300",
        role: "img",
        "aria-labelledby": uid + "-traj-title " + uid + "-traj-desc"
      });
      svg.appendChild(svgNode(doc, "title", { id: uid + "-traj-title" }, "精确恒加速度轨迹与 Euler 有限步"));
      svg.appendChild(svgNode(
        doc,
        "desc",
        { id: uid + "-traj-desc" },
        "蓝线为闭式精确轨迹，金色折线为 Euler 有限步；终点误差是数值证据而非守恒定理。"
      ));
      var margin = { left: 42, right: 14, top: 16, bottom: 31 };
      var width = 520 - margin.left - margin.right;
      var height = 300 - margin.top - margin.bottom;
      var all = [];
      data.points.forEach(function (point) {
        all.push(point.exact, point.euler);
      });
      var xValues = all.map(function (point) { return point[0]; });
      var yValues = all.map(function (point) { return point[1]; });
      var xMin = Math.min.apply(null, xValues) - 0.4;
      var xMax = Math.max.apply(null, xValues) + 0.4;
      var yMin = Math.min.apply(null, yValues) - 0.4;
      var yMax = Math.max.apply(null, yValues) + 0.4;
      var mapX = function (x) { return margin.left + (x - xMin) / (xMax - xMin) * width; };
      var mapY = function (y) { return margin.top + (yMax - y) / (yMax - yMin) * height; };
      var group = svgNode(doc, "g", {});
      group.appendChild(svgNode(doc, "line", {
        x1: margin.left, y1: mapY(0), x2: margin.left + width, y2: mapY(0),
        stroke: "currentColor", "stroke-opacity": "0.35", "stroke-width": "1"
      }));
      group.appendChild(svgNode(doc, "path", {
        d: pathFrom(data.points, "exact", mapX, mapY),
        fill: "none", stroke: "var(--nt-blue)", "stroke-width": "2.5"
      }));
      group.appendChild(svgNode(doc, "path", {
        d: pathFrom(data.points, "euler", mapX, mapY),
        fill: "none", stroke: "var(--nt-gold)", "stroke-width": "2", "stroke-dasharray": "6 4"
      }));
      data.points.forEach(function (point) {
        group.appendChild(svgNode(doc, "circle", {
          cx: mapX(point.euler[0]), cy: mapY(point.euler[1]), r: "3.3",
          fill: "var(--nt-red)", stroke: "var(--bg)", "stroke-width": "1"
        }));
      });
      group.appendChild(svgNode(doc, "text", {
        x: margin.left + width - 3, y: margin.top + height + 23, "text-anchor": "end", "font-size": "11"
      }, "x"));
      group.appendChild(svgNode(doc, "text", {
        x: margin.left + 5, y: margin.top + 13, "font-size": "11"
      }, "y(t)"));
      svg.appendChild(group);
      return svg;
    }

    function metric(doc, label, value, color) {
      return element(doc, "div", { className: "nt-metric " + (color || "") }, [
        element(doc, "span", {}, label),
        element(doc, "strong", {}, value)
      ]);
    }

    function injectStyle(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function choiceQuestion(doc, refs, key, legendText, choices) {
      var fieldset = element(doc, "fieldset", { className: "nt-question" });
      fieldset.appendChild(element(doc, "legend", {}, legendText));
      var row = element(doc, "div", { className: "nt-choice-row" });
      refs[key] = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": "false",
          text: choice.label,
          onclick: function () {
            refs.state.predictions[key] = choice.value;
            renderPrediction(refs);
          }
        });
        refs[key].push({ value: choice.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    function renderPrediction(refs) {
      ["momentum", "frame", "origin"].forEach(function (key) {
        (refs[key] || []).forEach(function (item) {
          item.node.setAttribute(
            "aria-pressed",
            refs.state.predictions[key] === item.value ? "true" : "false"
          );
        });
      });
      var answered = ["momentum", "frame", "origin"].every(function (key) {
        return refs.state.predictions[key] !== null;
      });
      refs.feedback.textContent = answered ? "三个预测已记录，可以揭示结果。" : "请先完成三个预测。";
      refs.feedback.className = "nt-feedback";
    }

    function renderResults(refs) {
      var state = refs.state;
      var data = analyze({
        scenarioId: state.scenarioId,
        frameAccel: state.frameAccel,
        originId: state.originId,
        steps: state.steps
      });
      refs.scenarioSelect.value = state.scenarioId;
      refs.frameInput.value = String(state.frameAccel);
      refs.frameOutput.textContent = formatNumber(state.frameAccel, 2);
      refs.originSelect.value = state.originId;
      refs.stepsInput.value = String(state.steps);
      refs.stepsOutput.textContent = String(state.steps);
      var closed = Math.abs(data.collision.externalImpulse) < 1e-12;
      refs.summary.textContent =
        "定理层：选定系统的 " +
        (closed ? "外冲量为 0，内部碰撞冲量相消。" : "总动量按外冲量改变。") +
        " 参考系层：加入惯性力后残差为 " +
        formatNumber(data.frame.residualWithPseudo, 4) +
        "；有限轨迹层：Euler 终点误差为 " +
        formatNumber(data.trajectory.endpointError, 4) +
        "，只是固定步长证据。";
      replaceChildren(refs.metrics, [
        metric(refs.doc, "碰撞前 P", formatNumber(data.collision.pBefore, 4), "nt-blue"),
        metric(refs.doc, "碰撞后 P", formatNumber(data.collision.pAfter, 4), closed ? "nt-green" : "nt-gold"),
        metric(refs.doc, "内部冲量和", formatNumber(data.collision.internalNet, 4), "nt-green"),
        metric(refs.doc, "参考系残差", formatNumber(data.frame.residualWithoutPseudo, 4), "nt-red"),
        metric(refs.doc, "原点力矩 τ", formatNumber(data.angular.torque, 4), Math.abs(data.angular.torque) < 1e-12 ? "nt-green" : "nt-gold"),
        metric(refs.doc, "Euler 终点误差", formatNumber(data.trajectory.endpointError, 4), "nt-red")
      ]);
      replaceChildren(refs.bodyChart, [
        element(refs.doc, "h4", {}, "自由体图与冲量方向"),
        element(refs.doc, "div", { className: "nt-chart-frame" }, freeBodySvg(refs.doc, data, refs.uid))
      ]);
      replaceChildren(refs.trajectoryChart, [
        element(refs.doc, "h4", {}, "精确轨迹 vs 有限步 Euler"),
        element(refs.doc, "div", { className: "nt-chart-frame" }, trajectorySvg(refs.doc, data.trajectory, refs.uid))
      ]);
      var rows = [
        ["系统动量", "ΔP = J_ext；内部冲量成对相消", formatNumber(data.collision.momentumChange, 4), closed ? "外冲量为 0" : "外冲量已计入"],
        ["自由体/内部冲量", "J_int,1 + J_int,2 = 0（碰撞模型）", formatNumber(data.collision.internalNet, 4), "模型假设"],
        ["非惯性系", "m a' = F_real − m A_frame", formatNumber(data.frame.residualWithPseudo, 4), "加入惯性力后"],
        ["角动量", "dL_O/dt = τ_O − V_O×P", formatNumber(data.angular.derivative, 4), data.angular.originVelocity[0] || data.angular.originVelocity[1] ? "移动原点修正" : "固定原点"],
        ["有限轨迹", "闭式 r(t) 与 Euler 离散点比较", formatNumber(data.trajectory.endpointError, 4), "有限数值证据"]
      ].map(function (row) {
        return element(refs.doc, "tr", {}, [
          element(refs.doc, "th", { scope: "row" }, row[0]),
          element(refs.doc, "td", {}, row[1]),
          element(refs.doc, "td", {}, row[2]),
          element(refs.doc, "td", {}, row[3])
        ]);
      });
      replaceChildren(refs.ledgerBody, rows);
      refs.boundary.textContent =
        "边界提醒：内部/外部取决于系统边界；中心力的零力矩取决于原点；移动原点要保留修正项；Euler 曲线不会因图形好看就成为精确解。";
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      injectStyle(doc);
      var uid = "nt-" + (INSTANCE += 1);
      var state = {
        scenarioId: DEFAULTS.scenarioId,
        frameAccel: DEFAULTS.frameAccel,
        originId: DEFAULTS.originId,
        steps: DEFAULTS.steps,
        revealed: false,
        predictions: { momentum: null, frame: null, origin: null }
      };
      var refs = { doc: doc, uid: uid, state: state };
      var shell = element(doc, "div", { className: "nt-shell" });
      shell.appendChild(element(doc, "h3", {}, "牛顿参考系、自由体与守恒账本"));
      shell.appendChild(element(doc, "p", { className: "nt-note" }, "本实验固定模型参数，不抽随机样本；揭示后把解析守恒、参考系修正和有限步误差分开。"));

      var prediction = element(doc, "section", {
        className: "nt-predict",
        "aria-labelledby": uid + "-predict-title"
      });
      prediction.appendChild(element(doc, "strong", { className: "nt-predict-title", id: uid + "-predict-title" }, "先预测，再揭示"));
      var questionList = element(doc, "div", { className: "nt-question-list" });
      questionList.appendChild(choiceQuestion(doc, refs, "momentum", "1. 孤立碰撞时，谁的动量守恒？", [
        { value: "total-only", label: "只有总动量" },
        { value: "each", label: "每个物体各自" },
        { value: "neither", label: "两者都不" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "frame", "2. 加速参考系的 Newton 方程需要？", [
        { value: "pseudo", label: "加惯性力" },
        { value: "none", label: "什么都不加" },
        { value: "change-mass", label: "只改质量" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "origin", "3. 中心力零力矩对哪个原点成立？", [
        { value: "same-origin", label: "同一中心原点" },
        { value: "all-origins", label: "所有原点" },
        { value: "euler-only", label: "仅有限步图上" }
      ]));
      prediction.appendChild(questionList);
      var actions = element(doc, "div", { className: "nt-actions" });
      var reveal = element(doc, "button", { type: "button", className: "nt-primary", text: "揭示并核对" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      refs.feedback = element(doc, "p", { className: "nt-feedback", "aria-live": "polite" }, "请先完成三个预测。");
      prediction.appendChild(refs.feedback);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "nt-controls", hidden: true, "aria-label": "牛顿模型参数" });
      refs.controls = controls;
      refs.scenarioSelect = element(doc, "select", { "aria-label": "选择碰撞系统" });
      SCENARIOS.forEach(function (scenario) {
        refs.scenarioSelect.appendChild(element(doc, "option", { value: scenario.id }, scenario.label));
      });
      refs.frameInput = element(doc, "input", { type: "range", min: "0", max: "1.2", step: "0.1", value: String(DEFAULTS.frameAccel), "aria-label": "参考系加速度" });
      refs.frameOutput = element(doc, "output", {}, formatNumber(DEFAULTS.frameAccel, 2));
      refs.originSelect = element(doc, "select", { "aria-label": "选择角动量原点" });
      ORIGINS.forEach(function (origin) {
        refs.originSelect.appendChild(element(doc, "option", { value: origin.id }, origin.label));
      });
      refs.stepsInput = element(doc, "input", { type: "range", min: "4", max: "20", step: "1", value: String(DEFAULTS.steps), "aria-label": "Euler 时间步数" });
      refs.stepsOutput = element(doc, "output", {}, String(DEFAULTS.steps));
      controls.appendChild(element(doc, "div", { className: "nt-control" }, [element(doc, "label", {}, "碰撞模型"), refs.scenarioSelect]));
      controls.appendChild(element(doc, "div", { className: "nt-control" }, [element(doc, "label", {}, ["参考系加速度 A = ", refs.frameOutput]), refs.frameInput]));
      controls.appendChild(element(doc, "div", { className: "nt-control" }, [element(doc, "label", {}, "角动量原点"), refs.originSelect]));
      controls.appendChild(element(doc, "div", { className: "nt-control" }, [element(doc, "label", {}, ["Euler 步数 N = ", refs.stepsOutput]), refs.stepsInput]));
      shell.appendChild(controls);

      var results = element(doc, "section", { className: "nt-results", hidden: true, "aria-labelledby": uid + "-results-title" });
      refs.results = results;
      results.appendChild(element(doc, "h4", { id: uid + "-results-title" }, "揭示后的守恒与离散化账本"));
      refs.summary = element(doc, "p", { className: "nt-interpretation", "aria-live": "polite" });
      results.appendChild(refs.summary);
      refs.metrics = element(doc, "div", { className: "nt-metrics" });
      results.appendChild(refs.metrics);
      var charts = element(doc, "div", { className: "nt-charts" });
      refs.bodyChart = element(doc, "div", { className: "nt-chart" });
      refs.trajectoryChart = element(doc, "div", { className: "nt-chart" });
      charts.appendChild(refs.bodyChart);
      charts.appendChild(refs.trajectoryChart);
      results.appendChild(charts);
      var ledger = element(doc, "div", { className: "nt-ledger" });
      var table = element(doc, "table", { "aria-label": "Newton 守恒与有限轨迹账本" });
      table.appendChild(element(doc, "caption", {}, "系统边界、参考系、角动量原点与数值轨迹的条件账本"));
      table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
        element(doc, "th", { scope: "col" }, "量"),
        element(doc, "th", { scope: "col" }, "方程/假设"),
        element(doc, "th", { scope: "col" }, "当前读数"),
        element(doc, "th", { scope: "col" }, "状态")
      ])));
      refs.ledgerBody = element(doc, "tbody");
      table.appendChild(refs.ledgerBody);
      ledger.appendChild(table);
      results.appendChild(ledger);
      refs.boundary = element(doc, "p", { className: "nt-boundary" });
      results.appendChild(refs.boundary);
      shell.appendChild(results);
      root.classList.add("nt-lab");
      root.replaceChildren(shell);

      function render() {
        controls.hidden = !state.revealed;
        results.hidden = !state.revealed;
        renderPrediction(refs);
        if (state.revealed) renderResults(refs);
      }

      reveal.addEventListener("click", function () {
        var answers = { momentum: "total-only", frame: "pseudo", origin: "same-origin" };
        var missing = ["momentum", "frame", "origin"].filter(function (key) {
          return state.predictions[key] === null;
        });
        if (missing.length) {
          refs.feedback.textContent = "还缺少 " + missing.length + " 个预测。";
          refs.feedback.className = "nt-feedback nt-warn";
          return;
        }
        state.revealed = true;
        render();
        var hits = ["momentum", "frame", "origin"].filter(function (key) {
          return state.predictions[key] === answers[key];
        }).length;
        refs.feedback.textContent = "已揭示：" + hits + "/3 个预测命中；有限轨迹仍只是数值证据。";
        refs.feedback.className = "nt-feedback " + (hits === 3 ? "nt-pass" : "nt-warn");
        if (api && typeof api.announce === "function") api.announce(root, refs.feedback.textContent);
      });
      reset.addEventListener("click", function () {
        state = {
          scenarioId: DEFAULTS.scenarioId,
          frameAccel: DEFAULTS.frameAccel,
          originId: DEFAULTS.originId,
          steps: DEFAULTS.steps,
          revealed: false,
          predictions: { momentum: null, frame: null, origin: null }
        };
        refs.state = state;
        render();
      });
      refs.scenarioSelect.addEventListener("change", function () {
        state.scenarioId = refs.scenarioSelect.value;
        if (state.revealed) renderResults(refs);
      });
      refs.frameInput.addEventListener("input", function () {
        state.frameAccel = Number(refs.frameInput.value);
        if (state.revealed) renderResults(refs);
      });
      refs.originSelect.addEventListener("change", function () {
        state.originId = refs.originSelect.value;
        if (state.revealed) renderResults(refs);
      });
      refs.stepsInput.addEventListener("input", function () {
        state.steps = Number(refs.stepsInput.value);
        if (state.revealed) renderResults(refs);
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function assert(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }
      function close(actual, expected, tolerance, message) {
        checks += 1;
        if (!finite(actual) || Math.abs(actual - expected) > tolerance) {
          throw new Error(message + ": " + actual + " vs " + expected);
        }
      }

      assert(SCENARIOS.length === 2, "scenario count");
      assert(ORIGINS.length === 4, "origin count");
      var elastic = elasticCollision1d(1, 2, 2, -0.5);
      close(elastic.v1, -4 / 3, 1e-12, "elastic v1");
      close(elastic.v2, 7 / 6, 1e-12, "elastic v2");
      var isolated = collisionLedger("isolated");
      close(isolated.pBefore, 1, 1e-12, "isolated initial momentum");
      close(isolated.pAfter, 1, 1e-12, "isolated final momentum");
      close(isolated.internalNet, 0, 1e-12, "internal impulse cancellation");
      close(isolated.momentumResidual, 0, 1e-12, "isolated impulse residual");
      var pushed = collisionLedger("pushed");
      close(pushed.pAfter - pushed.pBefore, 0.8, 1e-12, "external impulse change");
      close(pushed.momentumResidual, 0, 1e-12, "pushed impulse residual");
      var inertial = frameLedger(0);
      close(inertial.relativeAcceleration, 1.2, 1e-12, "inertial acceleration");
      close(inertial.residualWithPseudo, 0, 1e-12, "inertial residual");
      var accelerated = frameLedger(0.5);
      close(accelerated.relativeAcceleration, 0.7, 1e-12, "relative acceleration");
      close(accelerated.pseudoForce, -0.5, 1e-12, "pseudo force");
      close(accelerated.residualWithPseudo, 0, 1e-12, "accelerated residual");
      close(accelerated.residualWithoutPseudo, -0.5, 1e-12, "missing pseudo residual");
      var central = angularLedger("central");
      close(central.torque, 0, 1e-12, "central torque");
      assert(central.fixedOriginCertificate, "central fixed certificate");
      var shifted = angularLedger("shifted");
      close(shifted.torque, -0.5, 1e-12, "shifted torque");
      assert(!shifted.fixedOriginCertificate, "shifted no zero torque");
      var moving = angularLedger("moving");
      close(moving.movingCorrection, -0.33, 1e-12, "moving origin correction");
      close(moving.derivative, -0.33, 1e-12, "moving derivative");
      var coarse = trajectory({ steps: 8 });
      close(coarse.exactEndpoint[1], 0, 1e-12, "exact trajectory endpoint");
      close(coarse.eulerEndpoint[1], 1, 1e-12, "Euler endpoint");
      close(coarse.endpointError, 1, 1e-12, "Euler endpoint error");
      var fine = trajectory({ steps: 16 });
      assert(fine.endpointError < coarse.endpointError, "Euler refinement evidence");
      var analyzed = analyze({ scenarioId: "pushed", frameAccel: 0.5, originId: "shifted", steps: 8 });
      assert(analyzed.collision.externalImpulse === 0.8, "analyze scenario");
      assert(analyzed.angular.torque === -0.5, "analyze origin");
      var rejected = false;
      try { scenarioById("missing"); } catch (error) { rejected = true; }
      assert(rejected, "unknown scenario rejected");
      rejected = false;
      try { trajectory({ steps: 0 }); } catch (error) { rejected = true; }
      assert(rejected, "invalid steps rejected");
      rejected = false;
      try { trajectory({ steps: 8.5 }); } catch (error) { rejected = true; }
      assert(rejected, "fractional steps rejected");
      return { checks: checks, scenarios: SCENARIOS.length };
    }

    return {
      DEFAULTS: DEFAULTS,
      SCENARIOS: SCENARIOS,
      ORIGINS: ORIGINS,
      elasticCollision1d: elasticCollision1d,
      collisionLedger: collisionLedger,
      frameLedger: frameLedger,
      angularLedger: angularLedger,
      trajectory: trajectory,
      analyze: analyze,
      mount: mount,
      selfTest: selfTest
    };
  }
);
