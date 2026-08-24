(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-robot-jacobian", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-robot-jacobian self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-robot-jacobian self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "auto-robot-jacobian";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-robot-jacobian-styles";
    var EPS = 1e-10;
    var DEFAULTS = {
      l1: 1,
      l2: 0.7,
      q1: 0.7,
      q2: -1.1,
      vx: 0.25,
      vy: 0.15,
      damping: 0.12
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-robot-jacobian"]{--rk-blue:var(--cl-blue,#315f9d);--rk-orange:var(--cl-gold,#9b6a12);--rk-green:var(--cl-green,#39734d);--rk-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-robot-jacobian"] *{box-sizing:border-box}[data-learning-lab="auto-robot-jacobian"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-robot-jacobian"] h3,[data-learning-lab="auto-robot-jacobian"] h4{margin:0;letter-spacing:0}[data-learning-lab="auto-robot-jacobian"] h3{font-size:1.16rem}[data-learning-lab="auto-robot-jacobian"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-robot-jacobian"] p{margin:8px 0}[data-learning-lab="auto-robot-jacobian"] .rk-note,[data-learning-lab="auto-robot-jacobian"] .rk-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-robot-jacobian"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-robot-jacobian"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-robot-jacobian"] .rk-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-robot-jacobian"] button,[data-learning-lab="auto-robot-jacobian"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-robot-jacobian"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-robot-jacobian"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-robot-jacobian"] button[aria-pressed="true"],[data-learning-lab="auto-robot-jacobian"] .rk-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-robot-jacobian"] button:focus-visible,[data-learning-lab="auto-robot-jacobian"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-robot-jacobian"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-robot-jacobian"] .rk-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-robot-jacobian"] .rk-actions>*{flex:1 1 170px}[data-learning-lab="auto-robot-jacobian"] .rk-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-robot-jacobian"] .rk-correct{color:var(--rk-green)}[data-learning-lab="auto-robot-jacobian"] .rk-wrong{color:var(--rk-red)}',
      '[data-learning-lab="auto-robot-jacobian"] .rk-layout{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-robot-jacobian"] .rk-controls,[data-learning-lab="auto-robot-jacobian"] .rk-stage{min-width:0}[data-learning-lab="auto-robot-jacobian"] .rk-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-robot-jacobian"] .rk-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-robot-jacobian"] .rk-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-robot-jacobian"] .rk-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-robot-jacobian"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-robot-jacobian"] .rk-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-robot-jacobian"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-robot-jacobian"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-robot-jacobian"] .rk-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-robot-jacobian"] .rk-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-robot-jacobian"] .rk-link-one{stroke:var(--rk-blue);stroke-width:7;stroke-linecap:round}[data-learning-lab="auto-robot-jacobian"] .rk-link-two{stroke:var(--rk-orange);stroke-width:7;stroke-linecap:round}[data-learning-lab="auto-robot-jacobian"] .rk-joint{fill:var(--bg,#fff);stroke:var(--rk-green);stroke-width:3}[data-learning-lab="auto-robot-jacobian"] .rk-target{stroke:var(--rk-red);stroke-width:2.5}[data-learning-lab="auto-robot-jacobian"] .rk-ellipse{fill:var(--rk-blue);fill-opacity:.13;stroke:var(--rk-blue);stroke-width:2}[data-learning-lab="auto-robot-jacobian"] .rk-principal{stroke:var(--rk-orange);stroke-width:1.5}[data-learning-lab="auto-robot-jacobian"] .rk-label{font-size:11px}[data-learning-lab="auto-robot-jacobian"] .rk-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-robot-jacobian"] .rk-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-robot-jacobian"] .rk-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-robot-jacobian"] .rk-metric:nth-child(3n+1){border-color:var(--rk-blue)}[data-learning-lab="auto-robot-jacobian"] .rk-metric:nth-child(3n+2){border-color:var(--rk-orange)}[data-learning-lab="auto-robot-jacobian"] .rk-metric:nth-child(3n){border-color:var(--rk-green)}[data-learning-lab="auto-robot-jacobian"] .rk-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-robot-jacobian"] .rk-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-robot-jacobian"] .rk-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-robot-jacobian"] table{width:100%;min-width:760px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="auto-robot-jacobian"] th,[data-learning-lab="auto-robot-jacobian"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-robot-jacobian"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-robot-jacobian"] .rk-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--rk-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="auto-robot-jacobian"] .rk-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-robot-jacobian"] .rk-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-robot-jacobian"] .rk-stage-frame{padding:4px}[data-learning-lab="auto-robot-jacobian"] table{font-size:10.8px}[data-learning-lab="auto-robot-jacobian"] th,[data-learning-lab="auto-robot-jacobian"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-robot-jacobian"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function normalizeConfig(input) {
      var source = input || {};
      var l1 = finite(source.l1 === undefined ? DEFAULTS.l1 : source.l1, "l1");
      var l2 = finite(source.l2 === undefined ? DEFAULTS.l2 : source.l2, "l2");
      var q1 = finite(source.q1 === undefined ? DEFAULTS.q1 : source.q1, "q1");
      var q2 = finite(source.q2 === undefined ? DEFAULTS.q2 : source.q2, "q2");
      var vx = finite(source.vx === undefined ? DEFAULTS.vx : source.vx, "vx");
      var vy = finite(source.vy === undefined ? DEFAULTS.vy : source.vy, "vy");
      var damping = finite(source.damping === undefined ? DEFAULTS.damping : source.damping, "damping");
      if (l1 < 0.2 || l1 > 2) throw new RangeError("l1 must be in [0.2, 2]");
      if (l2 < 0.2 || l2 > 2) throw new RangeError("l2 must be in [0.2, 2]");
      if (q1 < -Math.PI || q1 > Math.PI) throw new RangeError("q1 must be in [-pi, pi]");
      if (q2 < -Math.PI || q2 > Math.PI) throw new RangeError("q2 must be in [-pi, pi]");
      if (vx < -1 || vx > 1) throw new RangeError("vx must be in [-1, 1]");
      if (vy < -1 || vy > 1) throw new RangeError("vy must be in [-1, 1]");
      if (damping < 0 || damping > 0.6) throw new RangeError("damping must be in [0, 0.6]");
      return { l1: l1, l2: l2, q1: q1, q2: q2, vx: vx, vy: vy, damping: damping };
    }

    function forwardKinematics(config) {
      var q12 = config.q1 + config.q2;
      return { x: config.l1 * Math.cos(config.q1) + config.l2 * Math.cos(q12), y: config.l1 * Math.sin(config.q1) + config.l2 * Math.sin(q12) };
    }

    function jacobian(config) {
      var q12 = config.q1 + config.q2;
      return [
        [-config.l1 * Math.sin(config.q1) - config.l2 * Math.sin(q12), -config.l2 * Math.sin(q12)],
        [config.l1 * Math.cos(config.q1) + config.l2 * Math.cos(q12), config.l2 * Math.cos(q12)]
      ];
    }

    function singularData(J) {
      var a = J[0][0] * J[0][0] + J[0][1] * J[0][1];
      var b = J[0][0] * J[1][0] + J[0][1] * J[1][1];
      var c = J[1][0] * J[1][0] + J[1][1] * J[1][1];
      var trace = a + c;
      var delta = Math.hypot(a - c, 2 * b);
      var lambda1 = Math.max(0, (trace + delta) / 2);
      var lambda2 = Math.max(0, (trace - delta) / 2);
      return {
        sigma1: Math.sqrt(lambda1),
        sigma2: Math.sqrt(lambda2),
        lambda1: lambda1,
        lambda2: lambda2,
        principalAngle: 0.5 * Math.atan2(2 * b, a - c),
        trace: trace,
        offDiagonal: b
      };
    }

    function symmetricPseudoInverse(a, b, c, tolerance) {
      var threshold = tolerance || 1e-9;
      var trace = a + c;
      var delta = Math.hypot(a - c, 2 * b);
      var lambda1 = Math.max(0, (trace + delta) / 2);
      var lambda2 = Math.max(0, (trace - delta) / 2);
      var result = [[0, 0], [0, 0]];
      if (delta < EPS) {
        if (lambda1 > threshold) {
          result[0][0] = 1 / lambda1;
          result[1][1] = 1 / lambda1;
        }
        return result;
      }
      var projectors = [
        { value: lambda1, other: lambda2 },
        { value: lambda2, other: lambda1 }
      ];
      projectors.forEach(function (item) {
        if (item.value <= threshold) return;
        var scale = 1 / (item.value - item.other);
        var p00 = (a - item.other) * scale;
        var p01 = b * scale;
        var p11 = (c - item.other) * scale;
        result[0][0] += p00 / item.value;
        result[0][1] += p01 / item.value;
        result[1][0] += p01 / item.value;
        result[1][1] += p11 / item.value;
      });
      return result;
    }

    function symmetricDampedInverse(a, b, c, lambda) {
      if (lambda <= EPS) return symmetricPseudoInverse(a, b, c, 1e-9);
      var diagonal = lambda * lambda;
      var aa = a + diagonal;
      var cc = c + diagonal;
      var determinant = aa * cc - b * b;
      if (determinant <= EPS) throw new RangeError("damped normal matrix is singular");
      return [[cc / determinant, -b / determinant], [-b / determinant, aa / determinant]];
    }

    function multiplyJt(J, inverse, velocity) {
      var middle0 = inverse[0][0] * velocity[0] + inverse[0][1] * velocity[1];
      var middle1 = inverse[1][0] * velocity[0] + inverse[1][1] * velocity[1];
      return [J[0][0] * middle0 + J[1][0] * middle1, J[0][1] * middle0 + J[1][1] * middle1];
    }

    function achievedVelocity(J, qdot) { return [J[0][0] * qdot[0] + J[0][1] * qdot[1], J[1][0] * qdot[0] + J[1][1] * qdot[1]]; }
    function vectorNorm(vector) { return Math.hypot(vector[0], vector[1]); }

    function solutionRow(name, J, velocity, qdot) {
      var achieved = achievedVelocity(J, qdot);
      return {
        method: name,
        qdot: qdot,
        achieved: achieved,
        residual: [achieved[0] - velocity[0], achieved[1] - velocity[1]],
        residualNorm: vectorNorm([achieved[0] - velocity[0], achieved[1] - velocity[1]]),
        speedNorm: vectorNorm(qdot)
      };
    }

    function runExperiment(input) {
      var config = normalizeConfig(input);
      var p = forwardKinematics(config);
      var J = jacobian(config);
      var spectrum = singularData(J);
      var gram = [
        [J[0][0] * J[0][0] + J[0][1] * J[0][1], J[0][0] * J[1][0] + J[0][1] * J[1][1]],
        [J[0][0] * J[1][0] + J[0][1] * J[1][1], J[1][0] * J[1][0] + J[1][1] * J[1][1]]
      ];
      var velocity = [config.vx, config.vy];
      var pinv = multiplyJt(J, symmetricPseudoInverse(gram[0][0], gram[0][1], gram[1][1], 1e-9), velocity);
      var dls = multiplyJt(J, symmetricDampedInverse(gram[0][0], gram[0][1], gram[1][1], config.damping), velocity);
      var det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
      return {
        config: config,
        p: p,
        J: J,
        spectrum: spectrum,
        determinant: det,
        manipulability: Math.abs(det),
        velocity: velocity,
        rows: [solutionRow("pseudoinverse", J, velocity, pinv), solutionRow("damped least squares", J, velocity, dls)],
        rankDeficient: spectrum.sigma2 < 1e-7,
        conditionNumber: spectrum.sigma2 < 1e-9 ? Infinity : spectrum.sigma1 / spectrum.sigma2
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

    function drawSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 400;
      var baseX = 118;
      var baseY = 220;
      var scale = 82;
      var x0 = baseX;
      var y0 = baseY;
      var x1 = x0 + scale * result.config.l1 * Math.cos(result.config.q1);
      var y1 = y0 - scale * result.config.l1 * Math.sin(result.config.q1);
      var x2 = x1 + scale * result.config.l2 * Math.cos(result.config.q1 + result.config.q2);
      var y2 = y1 - scale * result.config.l2 * Math.sin(result.config.q1 + result.config.q2);
      var centerX = 535;
      var centerY = 190;
      var ellipseScale = 92;
      var rx = Math.max(3, Math.min(100, result.spectrum.sigma1 * ellipseScale));
      var ry = Math.max(3, Math.min(100, result.spectrum.sigma2 * ellipseScale));
      svg.appendChild(svgElement(doc, "title", {}, "二连杆正运动学、Jacobian 奇异值与速度椭圆"));
      svg.appendChild(svgElement(doc, "desc", {}, "左侧是平面二连杆机构，右侧是由 Jacobian 奇异值决定的末端速度椭圆；表格比较伪逆和阻尼最小二乘。"));
      for (var i = 0; i <= 4; i += 1) {
        var gx = 30 + i * 65;
        svg.appendChild(svgElement(doc, "line", { x1: gx, y1: 40, x2: gx, y2: 260, class: "rk-grid" }));
        var gy = 40 + i * 55;
        svg.appendChild(svgElement(doc, "line", { x1: 30, y1: gy, x2: 310, y2: gy, class: "rk-grid" }));
      }
      svg.appendChild(svgElement(doc, "line", { x1: 30, y1: baseY, x2: 310, y2: baseY, class: "rk-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: baseX, y1: 40, x2: baseX, y2: 260, class: "rk-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: x0, y1: y0, x2: x1, y2: y1, class: "rk-link-one" }));
      svg.appendChild(svgElement(doc, "line", { x1: x1, y1: y1, x2: x2, y2: y2, class: "rk-link-two" }));
      svg.appendChild(svgElement(doc, "circle", { cx: x0, cy: y0, r: 7, class: "rk-joint" }));
      svg.appendChild(svgElement(doc, "circle", { cx: x1, cy: y1, r: 6, class: "rk-joint" }));
      svg.appendChild(svgElement(doc, "circle", { cx: x2, cy: y2, r: 5, class: "rk-joint" }));
      svg.appendChild(svgElement(doc, "line", { x1: x2, y1: y2, x2: x2 + 42 * result.config.vx, y2: y2 - 42 * result.config.vy, class: "rk-target" }));
      svg.appendChild(svgElement(doc, "text", { x: 34, y: 30, class: "rk-label" }, "机构：p=(x,y) [m]，v [m/s]"));
      svg.appendChild(svgElement(doc, "text", { x: 34, y: 282, class: "rk-small" }, "q1=" + formatNumber(result.config.q1, 2) + " rad, q2=" + formatNumber(result.config.q2, 2) + " rad"));
      svg.appendChild(svgElement(doc, "line", { x1: centerX - 120, y1: centerY, x2: centerX + 120, y2: centerY, class: "rk-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: centerX, y1: centerY - 120, x2: centerX, y2: centerY + 120, class: "rk-axis" }));
      svg.appendChild(svgElement(doc, "ellipse", { cx: centerX, cy: centerY, rx: rx, ry: ry, transform: "rotate(" + (-result.spectrum.principalAngle * 180 / Math.PI).toFixed(2) + " " + centerX + " " + centerY + ")", class: "rk-ellipse" }));
      var angle = -result.spectrum.principalAngle;
      var axisX = Math.cos(angle) * rx;
      var axisY = Math.sin(angle) * ry;
      svg.appendChild(svgElement(doc, "line", { x1: centerX - axisX, y1: centerY - axisY, x2: centerX + axisX, y2: centerY + axisY, class: "rk-principal" }));
      svg.appendChild(svgElement(doc, "text", { x: 410, y: 30, class: "rk-label" }, "末端速度椭圆：半轴 sigma [m/s per rad/s]"));
      svg.appendChild(svgElement(doc, "text", { x: 410, y: 330, class: "rk-small" }, "蓝填充：J 的奇异方向；红箭头：目标 v"));
      svg.appendChild(svgElement(doc, "text", { x: 410, y: 350, class: "rk-small" }, "sigma1=" + formatNumber(result.spectrum.sigma1, 3) + ", sigma2=" + formatNumber(result.spectrum.sigma2, 3)));
    }

    function metric(doc, label, value) { return element(doc, "div", { className: "rk-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }

    function renderLedger(doc, hostNode, result) {
      var body = element(doc, "tbody");
      result.rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: row.method === "pseudoinverse" ? "伪逆" : "DLS" }),
          element(doc, "td", { text: formatNumber(row.qdot[0], 4) }),
          element(doc, "td", { text: formatNumber(row.qdot[1], 4) }),
          element(doc, "td", { text: formatNumber(row.achieved[0], 4) }),
          element(doc, "td", { text: formatNumber(row.achieved[1], 4) }),
          element(doc, "td", { text: formatNumber(row.residualNorm, 5) }),
          element(doc, "td", { text: formatNumber(row.speedNorm, 4) })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "速度反解 ledger；qdot 单位 rad/s，末端速度单位 m/s" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "方法" }), element(doc, "th", { text: "qdot1" }), element(doc, "th", { text: "qdot2" }), element(doc, "th", { text: "vx achieved" }), element(doc, "th", { text: "vy achieved" }), element(doc, "th", { text: "残差 norm" }), element(doc, "th", { text: "关节速度 norm" })
        ])]), body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "jacobian",
          prompt: "二连杆 Jacobian 把哪两个速度联系起来？",
          expected: "map",
          choices: [
            { value: "map", label: "dot p = J dot q" },
            { value: "inverse", label: "p = J inverse q" },
            { value: "energy", label: "Vdot = J V" }
          ]
        },
        {
          key: "singular",
          prompt: "q2=0 或 pi 的伸直/折叠构型意味着什么？",
          expected: "rank",
          choices: [
            { value: "rank", label: "Jacobian 降秩，某方向不可达" },
            { value: "full", label: "所有方向都更灵活" },
            { value: "unit", label: "只改变长度单位" }
          ]
        },
        {
          key: "damping",
          prompt: "增大 DLS 阻尼 lambda 的典型交换是什么？",
          expected: "tradeoff",
          choices: [
            { value: "tradeoff", label: "速度更有界，残差可能变大" },
            { value: "free", label: "速度和残差都必然变小" },
            { value: "none", label: "两者完全不变" }
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
            button.node.className = correct ? "rk-correct" : selected ? "rk-wrong" : "";
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
      var shell = element(doc, "div", { className: "rk-lab" });
      shell.appendChild(element(doc, "h3", { text: "机器人实验：二连杆 Jacobian、奇异值与阻尼反解" }));
      shell.appendChild(element(doc, "p", { className: "rk-note", text: "正运动学给出 p(q)，Jacobian 给出 dot p=J(q)dot q。伪逆使用 J^T(JJ^T)^+，DLS 使用 J^T(JJ^T+lambda^2 I)^-1；长度用 m，角度用 rad，速度用 m/s 与 rad/s。" }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec, index) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "rk-choice-grid" });
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
      var actions = element(doc, "div", { className: "rk-actions" });
      var reveal = element(doc, "button", { type: "button", className: "rk-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "rk-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controlRefs = {};

      function makeRange(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
        var output = element(doc, "output", { text: formatNumber(state.config[key], digits) });
        controlRefs[key] = { input: input, output: output, digits: digits };
        return element(doc, "div", { className: "rk-control" }, [element(doc, "label", {}, [label + " = ", output]), input]);
      }

      var controls = element(doc, "div", { className: "rk-controls" }, [
        makeRange("l1", "连杆长度 l1 (m)", 0.2, 2, 0.1, 1),
        makeRange("l2", "连杆长度 l2 (m)", 0.2, 2, 0.1, 1),
        makeRange("q1", "关节角 q1 (rad)", -Math.PI, Math.PI, 0.05, 2),
        makeRange("q2", "关节角 q2 (rad)", -Math.PI, Math.PI, 0.05, 2),
        makeRange("vx", "目标 vx (m/s)", -1, 1, 0.05, 2),
        makeRange("vy", "目标 vy (m/s)", -1, 1, 0.05, 2),
        makeRange("damping", "DLS lambda", 0, 0.6, 0.01, 2),
        element(doc, "p", { className: "rk-note", text: "lambda=0 时显示 Moore-Penrose 伪逆；lambda>0 时速度更平滑但会引入任务空间残差。奇异位形指 sigma2 接近 0，不是图形动画效果。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 400", role: "img", "aria-label": "二连杆机构和速度椭圆" });
      var svgFrame = element(doc, "div", { className: "rk-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "rk-metrics" });
      var tableHost = element(doc, "div", { className: "rk-table-wrap" });
      var certificate = element(doc, "div", { className: "rk-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "rk-layout" }, [controls, element(doc, "div", { className: "rk-stage" }, [svgFrame, metricsHost, tableHost, certificate])]));
      shell.appendChild(predictionHost);
      shell.appendChild(actions);
      shell.appendChild(feedback);
      shell.appendChild(resultShell);
      clear(rootNode);
      rootNode.appendChild(shell);

      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
          state.feedback = "请先完成三项预测；机构、速度椭圆和反解账本会在提交后出现。";
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
        announce(api, rootNode, "机器人预测、图和账本已重置。");
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
        feedback.className = "rk-feedback" + (state.feedback.indexOf("请先") === 0 ? " rk-wrong" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "末端 p (m)", "[" + formatNumber(result.p.x, 3) + ", " + formatNumber(result.p.y, 3) + "]"));
        metricsHost.appendChild(metric(doc, "sigma1", formatNumber(result.spectrum.sigma1, 4)));
        metricsHost.appendChild(metric(doc, "sigma2", formatNumber(result.spectrum.sigma2, 4)));
        metricsHost.appendChild(metric(doc, "manipulability |det J|", formatNumber(result.manipulability, 4)));
        metricsHost.appendChild(metric(doc, "condition number", Number.isFinite(result.conditionNumber) ? formatNumber(result.conditionNumber, 2) : "infinity"));
        metricsHost.appendChild(metric(doc, "near singular", result.rankDeficient ? "是" : "否"));
        renderLedger(doc, tableHost, result);
        clear(certificate);
        certificate.appendChild(element(doc, "p", { text: "解析账：p=[l1 cos q1+l2 cos(q1+q2), l1 sin q1+l2 sin(q1+q2)]，J 的奇异值来自 JJ^T 的解析 2x2 特征值；manipulability=|det J|，单位为 m^2（rad 视作无量纲）。" }));
        certificate.appendChild(element(doc, "p", { text: "奇异边界：q2=0 或 pi 时两条连杆共线，sigma2=0，某些末端速度方向不可达；伪逆会返回最小范数的可达投影，不能伪造不可达方向。" }));
        certificate.appendChild(element(doc, "p", { text: "阻尼账：DLS 用 lambda^2 I 抬高法方程的小奇异值，通常牺牲一些速度残差换取较小、较有界的关节速度；这里是速度级 toy 反解，不含碰撞、力矩、加速度或离散控制约束。" }));
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var baseline = runExperiment(DEFAULTS);
      var repeat = runExperiment(DEFAULTS);
      check(JSON.stringify(baseline) === JSON.stringify(repeat), "deterministic kinematics");
      check(nearly(baseline.p.x, DEFAULTS.l1 * Math.cos(DEFAULTS.q1) + DEFAULTS.l2 * Math.cos(DEFAULTS.q1 + DEFAULTS.q2), 1e-12), "forward kinematics x");
      check(baseline.rows.length === 2, "two inverse methods");
      check(baseline.rows[1].residualNorm >= 0 && Number.isFinite(baseline.rows[1].residualNorm), "DLS residual finite");
      var straight = runExperiment({ l1: 1, l2: 0.7, q1: 0, q2: 0, vx: 0, vy: 0, damping: 0.12 });
      check(straight.rankDeficient && straight.spectrum.sigma2 < 1e-8, "straight configuration singular");
      check(straight.rows.every(function (row) { return row.qdot.every(Number.isFinite); }), "singular solutions remain finite");
      var zeroDamping = runExperiment({ l1: 1, l2: 0.7, q1: 0, q2: 0, vx: 0.2, vy: 0.1, damping: 0 });
      check(zeroDamping.rows[1].qdot.every(Number.isFinite), "zero damping falls back to pseudoinverse at singularity");
      var damped = runExperiment({ l1: 1, l2: 0.7, q1: 0.4, q2: 0.01, vx: 0, vy: 0.8, damping: 0.3 });
      check(damped.rows[1].speedNorm <= damped.rows[0].speedNorm + 1e-8, "damping controls near-singular speed");
      var invalid = false;
      try { normalizeConfig({ l1: 0 }); } catch (error) { invalid = error instanceof RangeError; }
      check(invalid, "invalid link length rejected");
      invalid = false;
      try { normalizeConfig({ q2: NaN }); } catch (error2) { invalid = error2 instanceof RangeError; }
      check(invalid, "nonfinite joint angle rejected");
      return { checks: checks };
    }

    return {
      LAB_ID: LAB_ID,
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      forwardKinematics: forwardKinematics,
      jacobian: jacobian,
      singularData: singularData,
      symmetricPseudoInverse: symmetricPseudoInverse,
      runExperiment: runExperiment,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
