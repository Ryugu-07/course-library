(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-symplectic-integrator", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-symplectic-integrator self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-symplectic-integrator self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var LAB_ID = "physics-symplectic-integrator";
  var STYLE_ID = "physics-symplectic-integrator-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var PI = Math.PI;
  var DEFAULTS = { method: "verlet", h: 0.2, periods: 12, omega: 1 };
  var CONVERGENCE_PERIODS = 4.25;
  var METHODS = {
    verlet: "Velocity Verlet（辛）",
    rk4: "RK4（四阶但非辛）",
    euler: "显式 Euler（对照）"
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
  }

  function finite(value, name) {
    var number = Number(value);
    if (!isFinite(number)) throw new RangeError(name + " must be finite");
    return number;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function normalize(options) {
    options = options || {};
    var method = options.method === "rk4" || options.method === "euler" ? options.method : "verlet";
    var h = clamp(finite(options.h === undefined ? DEFAULTS.h : options.h, "h"), 0.02, 2.8);
    var periods = clamp(finite(options.periods === undefined ? DEFAULTS.periods : options.periods, "periods"), 1, 24);
    var omega = clamp(finite(options.omega === undefined ? DEFAULTS.omega : options.omega, "omega"), 0.25, 3);
    return { method: method, h: h, periods: periods, omega: omega };
  }

  function energy(state, omega) {
    return 0.5 * (state.p * state.p + omega * omega * state.q * state.q);
  }

  function stepEuler(state, h, omega) {
    return { q: state.q + h * state.p, p: state.p - h * omega * omega * state.q };
  }

  function stepVerlet(state, h, omega) {
    var acceleration = omega * omega;
    var pHalf = state.p - 0.5 * h * acceleration * state.q;
    var qNext = state.q + h * pHalf;
    var pNext = pHalf - 0.5 * h * acceleration * qNext;
    return { q: qNext, p: pNext };
  }

  function stepRk4(state, h, omega) {
    var w2 = omega * omega;
    var k1q = state.p;
    var k1p = -w2 * state.q;
    var q2 = state.q + 0.5 * h * k1q;
    var p2 = state.p + 0.5 * h * k1p;
    var k2q = p2;
    var k2p = -w2 * q2;
    var q3 = state.q + 0.5 * h * k2q;
    var p3 = state.p + 0.5 * h * k2p;
    var k3q = p3;
    var k3p = -w2 * q3;
    var q4 = state.q + h * k3q;
    var p4 = state.p + h * k3p;
    var k4q = p4;
    var k4p = -w2 * q4;
    return {
      q: state.q + h * (k1q + 2 * k2q + 2 * k3q + k4q) / 6,
      p: state.p + h * (k1p + 2 * k2p + 2 * k3p + k4p) / 6
    };
  }

  function step(state, h, omega, method) {
    if (method === "rk4") return stepRk4(state, h, omega);
    if (method === "euler") return stepEuler(state, h, omega);
    return stepVerlet(state, h, omega);
  }

  function oneStepAreaFactor(h, omega, method) {
    var first = step({ q: 1, p: 0 }, h, omega, method);
    var second = step({ q: 0, p: 1 }, h, omega, method);
    return first.q * second.p - second.q * first.p;
  }

  function integrate(options) {
    var config = normalize(options);
    var totalTime = 2 * PI * config.periods / config.omega;
    var count = Math.max(1, Math.round(totalTime / config.h));
    var dt = totalTime / count;
    var state = { q: 1, p: 0 };
    var initialEnergy = energy(state, config.omega);
    var maxRelativeEnergyError = 0;
    var trace = [];
    var stride = Math.max(1, Math.floor(count / 260));
    var index;
    for (index = 0; index <= count; index += 1) {
      var time = index * dt;
      var currentEnergy = energy(state, config.omega);
      var relativeEnergyError = (currentEnergy - initialEnergy) / initialEnergy;
      maxRelativeEnergyError = Math.max(maxRelativeEnergyError, Math.abs(relativeEnergyError));
      if (index % stride === 0 || index === count) {
        trace.push({ t: time, q: state.q, p: state.p, energyError: relativeEnergyError });
      }
      if (index < count) state = step(state, dt, config.omega, config.method);
    }
    var exactQ = Math.cos(config.omega * totalTime);
    var exactP = -config.omega * Math.sin(config.omega * totalTime);
    return {
      config: config,
      steps: count,
      dt: dt,
      final: state,
      initialEnergy: initialEnergy,
      finalEnergy: energy(state, config.omega),
      maxRelativeEnergyError: maxRelativeEnergyError,
      finalQError: state.q - exactQ,
      finalPError: state.p - exactP,
      areaFactor: oneStepAreaFactor(dt, config.omega, config.method),
      stableForVerlet: Math.abs(config.omega * dt) < 2,
      trace: trace
    };
  }

  function convergenceStudy(options) {
    var config = normalize(options);
    var steps = [0.8, 0.4, 0.2, 0.1, 0.05];
    var rows = steps.map(function (h) {
      var result = integrate({ method: config.method, h: h, periods: CONVERGENCE_PERIODS, omega: config.omega });
      return {
        h: result.dt,
        finalQError: Math.abs(result.finalQError),
        maxEnergyError: result.maxRelativeEnergyError,
        areaFactor: result.areaFactor
      };
    });
    var first = rows[0].finalQError;
    var last = rows[rows.length - 1].finalQError;
    var rate = first > 1e-15 && last > 1e-15 ? Math.log(first / last) / Math.log(rows[0].h / rows[rows.length - 1].h) : 0;
    return { rows: rows, observedOrder: rate, periods: CONVERGENCE_PERIODS };
  }

  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 5));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = String(value);
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    (children || []).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value !== undefined && value !== null) node.setAttribute(key === "className" ? "class" : key, String(value));
    });
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function installStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--psi-blue:#2563a6;--psi-green:#18734a;--psi-orange:#b45309;--psi-red:#a33b2f;max-width:100%;min-width:0;color:var(--fg,inherit);line-height:1.55}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-note,[data-learning-lab="' + LAB_ID + '"] .psi-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{margin:11px 0;padding:10px 12px;border:1px solid var(--border,currentColor);border-radius:6px}' +
      '[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] select,[data-learning-lab="' + LAB_ID + '"] input{min-width:0;min-height:44px;font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer;line-height:1.35}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--psi-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] button[aria-pressed=true],[data-learning-lab="' + LAB_ID + '"] .psi-primary{background:var(--psi-blue);border-color:var(--psi-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible,[data-learning-lab="' + LAB_ID + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.psi-actions>*{flex:1 1 170px}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-feedback{min-height:2em;margin:7px 0;font-weight:700}.psi-pass{color:var(--psi-green)}.psi-warn{color:var(--psi-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:15px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-control{display:grid;gap:5px;min-width:0}.psi-control label{font-size:13px;font-weight:700}.psi-control output{color:var(--psi-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] select{width:100%;padding:7px 9px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;accent-color:var(--psi-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-revealed{margin-top:18px;padding-top:15px;border-top:1px solid var(--border,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-metric{min-width:0;padding:9px;border-top:3px solid var(--psi-blue);background:var(--bg,Canvas)}.psi-metric:nth-child(2){border-top-color:var(--psi-green)}.psi-metric:nth-child(3){border-top-color:var(--psi-orange)}.psi-metric:nth-child(4){border-top-color:var(--psi-red)}.psi-metric:nth-child(5){border-top-color:var(--psi-green)}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}.psi-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-chart-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(250px,.9fr);gap:14px;align-items:start}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-chart-frame{min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;padding:6px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas)}' +
      '[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;color:var(--fg,inherit)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-axis{stroke:currentColor;stroke-opacity:.68}.psi-grid-line{stroke:var(--border,currentColor);stroke-opacity:.65}.psi-energy{fill:none;stroke:var(--psi-orange);stroke-width:2.5}.psi-phase{fill:none;stroke:var(--psi-blue);stroke-width:2.5}.psi-error{fill:none;stroke:var(--psi-green);stroke-width:2.5}.psi-chart-title{font-size:13px;font-weight:700}.psi-chart-muted{fill:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .psi-table-wrap{max-width:100%;overflow-x:auto;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:510px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;white-space:nowrap}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
      'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--psi-blue:#82b6ff;--psi-green:#79d39a;--psi-orange:#f0b15a;--psi-red:#ff9f91}' +
      '@media(max-width:800px){[data-learning-lab="' + LAB_ID + '"] .psi-chart-grid{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .psi-choice-grid,[data-learning-lab="' + LAB_ID + '"] .psi-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .psi-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){[data-learning-lab="' + LAB_ID + '"] .psi-chart-frame svg{min-width:560px}[data-learning-lab="' + LAB_ID + '"] .psi-chart-frame svg text{font-size:22px}[data-learning-lab="' + LAB_ID + '"] .psi-chart-frame svg .psi-chart-title{font-size:20px}[data-learning-lab="' + LAB_ID + '"] .psi-chart-frame svg .psi-chart-muted{font-size:18px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function pathFor(points, xMap, yMap, key) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + xMap(point.t !== undefined ? point.t : point.h).toFixed(2) + " " + yMap(point[key]).toFixed(2);
    }).join(" ");
  }

  function drawTrajectory(doc, svg, result) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 820 460");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "简谐振子的相图与相对能量误差");
    svg.appendChild(svgElement(doc, "title", {}, "简谐振子的能量误差和相图"));
    svg.appendChild(svgElement(doc, "desc", {}, "上图追踪相对能量误差，下图追踪 q 与 p 的相平面轨迹；两图共用当前积分步长。"));
    var left = 58;
    var right = 790;
    var topA = 38;
    var bottomA = 198;
    var topB = 272;
    var bottomB = 420;
    var trace = result.trace;
    var maxError = Math.max(1e-6, Math.max.apply(null, trace.map(function (point) { return Math.abs(point.energyError); })) * 1.2);
    var tMax = trace[trace.length - 1].t || 1;
    var xTime = function (value) { return left + (right - left) * value / tMax; };
    var yError = function (value) { return (topA + bottomA) / 2 - (bottomA - topA) * value / (2 * maxError); };
    [topA, (topA + bottomA) / 2, bottomA].forEach(function (y) { svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, className: "psi-grid-line" })); });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: topA, x2: left, y2: bottomA, className: "psi-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottomA, x2: right, y2: bottomA, className: "psi-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: pathFor(trace, xTime, yError, "energyError"), className: "psi-energy" }));
    svg.appendChild(svgElement(doc, "text", { x: left, y: topA - 12, className: "psi-chart-title" }, "相对能量误差 (H−H₀)/H₀"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottomA + 21, className: "psi-chart-muted", "text-anchor": "end" }, "时间 t"));
    svg.appendChild(svgElement(doc, "text", { x: left - 7, y: (topA + bottomA) / 2 + 4, className: "psi-chart-muted", "text-anchor": "end" }, "0"));
    var maxQ = Math.max(1, Math.max.apply(null, trace.map(function (point) { return Math.max(Math.abs(point.q), Math.abs(point.p / result.config.omega)); })) * 1.12);
    var xPhase = function (value) { return left + (right - left) * (value + maxQ) / (2 * maxQ); };
    var yPhase = function (value) { return bottomB - (bottomB - topB) * (value + maxQ) / (2 * maxQ); };
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: yPhase(0), x2: right, y2: yPhase(0), className: "psi-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: xPhase(0), y1: topB, x2: xPhase(0), y2: bottomB, className: "psi-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: trace.map(function (point, index) { return (index ? "L" : "M") + xPhase(point.q).toFixed(2) + " " + yPhase(point.p / result.config.omega).toFixed(2); }).join(" "), className: "psi-phase" }));
    svg.appendChild(svgElement(doc, "text", { x: left, y: topB - 12, className: "psi-chart-title" }, "相图：横轴 q，纵轴 p/ω"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: yPhase(0) - 7, className: "psi-chart-muted", "text-anchor": "end" }, "q"));
    svg.appendChild(svgElement(doc, "text", { x: xPhase(0) + 7, y: topB + 12, className: "psi-chart-muted" }, "p/ω"));
  }

  function drawConvergence(doc, svg, study) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 440 300");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "积分步长收敛研究");
    svg.appendChild(svgElement(doc, "title", {}, "步长收敛研究（4.25 周期）"));
    svg.appendChild(svgElement(doc, "desc", {}, "横轴是步长 h，纵轴是终点 q 误差；两轴按对数缩放。总时间固定为 4.25 个周期，非整数周期用于避免整数周期端点的超收敛。"));
    var left = 52;
    var right = 416;
    var top = 36;
    var bottom = 246;
    var rows = study.rows;
    var minH = rows[rows.length - 1].h;
    var maxH = rows[0].h;
    var maxE = Math.max(1e-16, Math.max.apply(null, rows.map(function (row) { return row.finalQError; })) * 1.8);
    var x = function (value) { return left + (right - left) * Math.log(maxH / value) / Math.log(maxH / minH); };
    var y = function (value) { return bottom - (bottom - top) * Math.log(Math.max(1e-16, value) / 1e-16) / Math.log(maxE / 1e-16); };
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, className: "psi-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, className: "psi-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: rows.map(function (row, index) { return (index ? "L" : "M") + x(row.h).toFixed(2) + " " + y(row.finalQError).toFixed(2); }).join(" "), className: "psi-error" }));
    rows.forEach(function (row) {
      svg.appendChild(svgElement(doc, "circle", { cx: x(row.h), cy: y(row.finalQError), r: 4, fill: "var(--psi-green)" }));
      svg.appendChild(svgElement(doc, "text", { x: x(row.h), y: bottom + 18, className: "psi-chart-muted", "text-anchor": "middle" }, format(row.h, 2)));
    });
    svg.appendChild(svgElement(doc, "text", { x: left, y: top - 12, className: "psi-chart-title" }, "收敛：4.25 周期终点 |q−q_exact|"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 37, className: "psi-chart-muted", "text-anchor": "end" }, "h（从左大到右小）"));
    svg.appendChild(svgElement(doc, "text", { x: left - 7, y: top + 4, className: "psi-chart-muted", "text-anchor": "end" }, format(maxE, 1)));
    svg.appendChild(svgElement(doc, "text", { x: left - 7, y: bottom + 4, className: "psi-chart-muted", "text-anchor": "end" }, "1e−16"));
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "psi-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function renderTable(doc, hostNode, study) {
    clear(hostNode);
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "固定总时间 " + study.periods + " 个周期（非整数周期，避免整数周期端点超收敛）；同一初值与当前方法，改变 h。" }));
    var head = element(doc, "tr", {});
    ["h", "终点 q 误差", "最大能量误差", "一步相面积因子"].forEach(function (label) { head.appendChild(element(doc, "th", { scope: "col", text: label })); });
    table.appendChild(element(doc, "thead", {}, [head]));
    var body = element(doc, "tbody", {});
    study.rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "td", { text: format(row.h, 4) }),
        element(doc, "td", { text: format(row.finalQError, 3) }),
        element(doc, "td", { text: format(row.maxEnergyError, 3) }),
        element(doc, "td", { text: format(row.areaFactor, 6) })
      ]));
    });
    table.appendChild(body);
    hostNode.appendChild(table);
  }

  function mount(rootNode, api) {
    var doc = rootNode && rootNode.ownerDocument;
    if (!doc) return;
    installStyles(doc);
    var prefix = "psi-" + Math.floor(Math.random() * 1000000);
    var state = { revealed: false, predictions: {}, config: { method: DEFAULTS.method, h: DEFAULTS.h, periods: DEFAULTS.periods, omega: DEFAULTS.omega } };
    var questions = [
      { key: "energy", prompt: "在合适步长下，Velocity Verlet 的原始能量更可能怎样？", answer: "bounded", choices: [{ value: "exact", label: "每一步精确不变" }, { value: "bounded", label: "围绕真值有界振荡" }, { value: "drift", label: "必然线性漂移" }] },
      { key: "limit", prompt: "简谐振子的 Verlet 稳定边界由哪个无量纲量控制？", answer: "two", choices: [{ value: "one", label: "ωh=1" }, { value: "two", label: "|ωh|=2" }, { value: "pi", label: "ωh=π" }] },
      { key: "symplectic", prompt: "辛性首先保留哪一种几何结构？", answer: "area", choices: [{ value: "area", label: "相空间面积结构" }, { value: "energy", label: "原 Hamilton 量逐步精确守恒" }, { value: "order", label: "任意问题都四阶" }] },
      { key: "convergence", prompt: "把步长减半时，二阶方法的渐近误差大约怎样？", answer: "quarter", choices: [{ value: "half", label: "约减半" }, { value: "quarter", label: "约变为四分之一" }, { value: "same", label: "基本不变" }] }
    ];
    var gate = element(doc, "section", { className: "psi-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(doc, "h3", { id: prefix + "-gate-title", text: "预测门：长期可信度来自结构，不只来自单步误差" }));
    gate.appendChild(element(doc, "p", { className: "psi-note", text: "先作四个预测；提交后才打开轨迹、收敛表和相面积诊断。" }));
    questions.forEach(function (question) {
      var field = element(doc, "fieldset", {});
      field.appendChild(element(doc, "legend", { text: question.prompt }));
      var choices = element(doc, "div", { className: "psi-choice-grid", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; question.choices.forEach(function (item) { item.button.setAttribute("aria-pressed", item === choice ? "true" : "false"); }); });
        choice.button = button;
        choices.appendChild(button);
      });
      field.appendChild(choices);
      gate.appendChild(field);
    });
    var actions = element(doc, "div", { className: "psi-actions" });
    var reveal = element(doc, "button", { type: "button", className: "psi-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    gate.appendChild(actions);
    var feedback = element(doc, "p", { className: "psi-feedback", "aria-live": "polite", text: "" });
    gate.appendChild(feedback);

    var stage = element(doc, "section", { className: "psi-revealed", hidden: true, "aria-labelledby": prefix + "-result-title" });
    stage.appendChild(element(doc, "h4", { id: prefix + "-result-title", text: "揭示实验：轨迹、几何与收敛一起看" }));
    stage.appendChild(element(doc, "p", { className: "psi-note", text: "改变方法或步长后重新运行。收敛表固定比较 4.25 个周期；选择非整数周期是为了避免整数周期端点的超收敛。Velocity Verlet 的稳定判据只针对当前保守简谐模型；它不是所有力场的通用步长公式。" }));
    var controls = element(doc, "div", { className: "psi-controls" });
    var method = element(doc, "select", { "aria-label": "积分方法" });
    Object.keys(METHODS).forEach(function (key) { method.appendChild(element(doc, "option", { value: key, text: METHODS[key] })); });
    method.value = state.config.method;
    controls.appendChild(element(doc, "div", { className: "psi-control" }, [element(doc, "label", { text: "积分方法" }), method]));
    function rangeControl(label, key, min, max, stepSize, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(stepSize), value: String(state.config[key]), "aria-label": label });
      input.addEventListener("input", function () { state.config[key] = Number(input.value); output.textContent = format(state.config[key], digits); if (state.revealed) renderResult(); });
      return element(doc, "div", { className: "psi-control" }, [element(doc, "label", {}, [label + " = ", output]), input]);
    }
    controls.appendChild(rangeControl("步长 h", "h", 0.02, 2.8, 0.01, 2));
    controls.appendChild(rangeControl("周期数", "periods", 1, 24, 1, 0));
    stage.appendChild(controls);
    var metrics = element(doc, "div", { className: "psi-metrics", "aria-label": "积分诊断" });
    stage.appendChild(metrics);
    var charts = element(doc, "div", { className: "psi-chart-grid" });
    var trajectoryFrame = element(doc, "div", { className: "psi-chart-frame" });
    var trajectorySvg = svgElement(doc, "svg", {});
    trajectoryFrame.appendChild(trajectorySvg);
    var convergenceFrame = element(doc, "div", { className: "psi-chart-frame" });
    var convergenceSvg = svgElement(doc, "svg", {});
    convergenceFrame.appendChild(convergenceSvg);
    charts.appendChild(trajectoryFrame);
    charts.appendChild(convergenceFrame);
    stage.appendChild(charts);
    var tableHost = element(doc, "div", { className: "psi-table-wrap" });
    stage.appendChild(tableHost);
    rootNode.replaceChildren(gate, stage);

    function renderResult() {
      var result = integrate(state.config);
      var study = convergenceStudy(state.config);
      metrics.replaceChildren(
        metric(doc, "实际步长 dt", format(result.dt, 4)),
        metric(doc, "最大 |ΔH/H₀|", format(result.maxRelativeEnergyError, 3)),
        metric(doc, "终点 q 误差", format(result.finalQError, 3)),
        metric(doc, "一步相面积", format(result.areaFactor, 6)),
        metric(doc, "渐近阶数（估计）", format(study.observedOrder, 2))
      );
      drawTrajectory(doc, trajectorySvg, result);
      drawConvergence(doc, convergenceSvg, study);
      renderTable(doc, tableHost, study);
      return result;
    }

    method.addEventListener("change", function () { state.config.method = method.value; if (state.revealed) renderResult(); });
    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) { feedback.textContent = "请先完成四个预测。"; feedback.className = "psi-feedback psi-warn"; return; }
      state.revealed = true;
      stage.hidden = false;
      var result = renderResult();
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.answer; }).length;
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中；当前 " + METHODS[state.config.method] + " 的一步相面积因子为 " + format(result.areaFactor, 6) + "。";
      feedback.className = "psi-feedback " + (correct === questions.length ? "psi-pass" : "psi-warn");
      announce(api, rootNode, feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state.revealed = false;
      state.predictions = {};
      state.config = { method: DEFAULTS.method, h: DEFAULTS.h, periods: DEFAULTS.periods, omega: DEFAULTS.omega };
      method.value = state.config.method;
      controls.querySelectorAll("input[type=range]").forEach(function (input) { var key = input.getAttribute("aria-label") === "步长 h" ? "h" : "periods"; input.value = String(state.config[key]); var output = input.parentNode.querySelector("output"); if (output) output.textContent = format(state.config[key], key === "h" ? 2 : 0); });
      stage.hidden = true;
      feedback.textContent = "已重置；答案与数值证据再次隐藏。";
      feedback.className = "psi-feedback";
      questions.forEach(function (question) { question.choices.forEach(function (choice) { choice.button.setAttribute("aria-pressed", "false"); }); });
      announce(api, rootNode, "辛积分预测与实验已重置。");
    });
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var first = stepVerlet({ q: 1, p: 0 }, 0.2, 1);
    check(near(first.q, 0.98, 1e-12), "Verlet q after one step");
    check(near(first.p, -0.198, 1e-12), "Verlet p after one step");
    check(near(oneStepAreaFactor(0.2, 1, "verlet"), 1, 1e-12), "Verlet preserves phase area");
    var forward = stepVerlet({ q: 0.7, p: -0.3 }, 0.17, 1.4);
    var backward = stepVerlet(forward, -0.17, 1.4);
    check(near(backward.q, 0.7, 1e-12) && near(backward.p, -0.3, 1e-12), "time reversibility");
    var stable = integrate({ method: "verlet", h: 0.2, periods: 20, omega: 1 });
    check(stable.maxRelativeEnergyError < 0.05, "stable Verlet energy remains bounded");
    var unstable = integrate({ method: "verlet", h: 2.1, periods: 6, omega: 1 });
    check(unstable.maxRelativeEnergyError > 1, "Verlet outside stability interval grows");
    var euler = integrate({ method: "euler", h: 0.2, periods: 8, omega: 1 });
    check(euler.finalEnergy > euler.initialEnergy, "Euler energy drift is visible");
    var study = convergenceStudy({ method: "verlet", omega: 1 });
    check(study.periods === 4.25, "convergence study uses the stated non-integer period");
    check(study.rows.every(function (row, index) { return isFinite(row.h) && isFinite(row.finalQError) && (index === 0 || row.h < study.rows[index - 1].h); }), "convergence ladder has finite decreasing steps");
    check(study.rows.slice(1).every(function (row, index) { return row.finalQError < study.rows[index].finalQError; }), "each Verlet refinement lowers endpoint error");
    check(study.rows[study.rows.length - 1].finalQError < study.rows[0].finalQError, "refinement lowers endpoint error");
    check(study.observedOrder > 1.5 && study.observedOrder < 2.5, "Verlet observed second order");
    var rkStudy = convergenceStudy({ method: "rk4", omega: 1 });
    check(rkStudy.rows[rkStudy.rows.length - 1].finalQError < rkStudy.rows[0].finalQError, "RK4 refinement lowers endpoint error");
    check(near(integrate({ method: "verlet", h: 0.2, periods: 3 }).dt, integrate({ method: "verlet", h: 0.2, periods: 3 }).dt, 1e-14), "deterministic integration");
    return { checks: checks };
  }

  return {
    LAB_ID: LAB_ID,
    DEFAULTS: DEFAULTS,
    step: step,
    integrate: integrate,
    convergenceStudy: convergenceStudy,
    oneStepAreaFactor: oneStepAreaFactor,
    mount: mount,
    selfTest: selfTest
  };
});
