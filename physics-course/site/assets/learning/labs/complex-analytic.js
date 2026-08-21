(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("complex-analytic", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("complex-analytic self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("complex-analytic self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "complex-analytic-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var DIRECTIONS = [
    { id: "real", label: "1", vector: [1, 0] },
    { id: "imaginary", label: "i", vector: [0, 1] },
    { id: "diagonal", label: "1+i", vector: [1, 1] }
  ];
  var FUNCTIONS = [
    { id: "z2", label: "z²", note: "纯 z 的多项式；解析且 f′=2z。" },
    { id: "conjugate", label: "conjugate(z)", note: "翻过实轴；实可微但处处不复可导。" },
    { id: "modulus2", label: "|z|²", note: "原点一阶平坦；只在原点复可导。" },
    { id: "parameterized", label: "pλ(z)=z²+λ|z|²", note: "λ=0 时退化为 z²；λ≠0 时只在原点复可导。" }
  ];
  var POINT_PRESETS = [
    { id: "origin", label: "原点 z₀=0", x: 0, y: 0, note: "这里会暴露“点可导不等于解析”的边界。" },
    { id: "generic", label: "一般点 z₀=1+i", x: 1, y: 1, note: "默认诊断点；有限方向通常会马上分叉。" },
    { id: "axis", label: "轴上点 z₀=1", x: 1, y: 0, note: "检查只在某一条坐标轴上变简单是否足够。" }
  ];
  var STYLE_TEXT = [
    ".ca-lab{--ca-blue:var(--cl-blue,#315f9d);--ca-gold:var(--cl-gold,#95670d);--ca-green:var(--cl-green,#347247);--ca-red:var(--cl-red,#b13d32);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".ca-lab *,.ca-lab *::before,.ca-lab *::after{box-sizing:border-box}.ca-lab [hidden]{display:none!important}.ca-lab h3,.ca-lab h4{margin:0;color:var(--fg);letter-spacing:0}.ca-lab h3{font-size:1.16rem}.ca-lab h4{margin-top:16px;font-size:1rem}.ca-lab p{margin:8px 0}.ca-lab .ca-note,.ca-lab .ca-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}",
    ".ca-lab button,.ca-lab input{font:inherit}.ca-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ca-lab button:hover{border-color:var(--accent)}.ca-lab button:focus-visible,.ca-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ca-lab button[aria-pressed=true],.ca-lab button.ca-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.ca-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".ca-lab .ca-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.ca-lab .ca-function-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.ca-lab .ca-point-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ca-lab .ca-controls{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(210px,.8fr);gap:14px;margin:12px 0;align-items:start}.ca-lab .ca-control{min-width:0;display:grid;gap:6px}.ca-lab .ca-control-label{color:var(--fg-soft);font-size:12.5px;font-weight:750}.ca-lab .ca-control output{color:var(--accent);font-variant-numeric:tabular-nums}.ca-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".ca-lab .ca-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--ca-gold);background:var(--block-bg,var(--bg))}.ca-lab .ca-prediction-title{display:block;margin-bottom:8px;font-size:13px}.ca-lab .ca-question{margin:10px 0}.ca-lab .ca-question-label{display:block;margin-bottom:6px;font-size:13px;font-weight:700}.ca-lab .ca-feedback{min-height:2em;margin:8px 0;font-weight:700}.ca-lab .ca-pass{color:var(--ca-green)}.ca-lab .ca-warn{color:var(--ca-red)}.ca-lab .ca-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.ca-lab .ca-actions>*{flex:1 1 170px}",
    ".ca-lab .ca-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.ca-lab .ca-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}.ca-lab .ca-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ca-lab .ca-metric:nth-child(5n+1){border-color:var(--ca-blue)}.ca-lab .ca-metric:nth-child(5n+2){border-color:var(--ca-gold)}.ca-lab .ca-metric:nth-child(5n+3){border-color:var(--ca-green)}.ca-lab .ca-metric:nth-child(5n+4){border-color:var(--ca-red)}.ca-lab .ca-metric:nth-child(5n){border-color:var(--accent)}.ca-lab .ca-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.ca-lab .ca-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ca-lab .ca-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.ca-lab .ca-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.ca-lab .ca-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ca-lab .ca-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.72}.ca-lab .ca-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72}.ca-lab .ca-probe{fill:var(--ca-blue);stroke:var(--bg);stroke-width:2}.ca-lab .ca-reference{fill:none;stroke:var(--ca-gold);stroke-width:2;stroke-dasharray:6 4}.ca-lab .ca-label{font-size:11px}.ca-lab .ca-small{font-size:10.5px;fill:var(--fg-soft)!important}",
    ".ca-lab .ca-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.ca-lab table{width:100%;min-width:1100px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}.ca-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.ca-lab th,.ca-lab td{padding:7px 7px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.ca-lab th{color:var(--fg-soft);font-size:11px;font-weight:750}.ca-lab .ca-good{color:var(--ca-green);font-weight:750}.ca-lab .ca-bad{color:var(--ca-red);font-weight:750}.ca-lab .ca-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--ca-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:950px){.ca-lab .ca-controls{grid-template-columns:minmax(0,1fr)}.ca-lab .ca-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.ca-lab .ca-function-grid,.ca-lab .ca-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ca-lab .ca-point-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:440px){.ca-lab .ca-function-grid,.ca-lab .ca-choice-grid,.ca-lab .ca-metrics{grid-template-columns:minmax(0,1fr)}.ca-lab .ca-stage{padding:4px}.ca-lab table{font-size:11px}}@media(prefers-reduced-motion:reduce){.ca-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance === undefined ? EPS : tolerance) * scale;
  }

  function nearComplex(left, right, tolerance) {
    return left !== null && right !== null && near(left[0], right[0], tolerance) && near(left[1], right[1], tolerance);
  }

  function fail(message) {
    throw new Error("complex-analytic: " + message);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function functionById(id) {
    for (var index = 0; index < FUNCTIONS.length; index += 1) {
      if (FUNCTIONS[index].id === id) return FUNCTIONS[index];
    }
    return FUNCTIONS[0];
  }

  function pointById(id) {
    for (var index = 0; index < POINT_PRESETS.length; index += 1) {
      if (POINT_PRESETS[index].id === id) return POINT_PRESETS[index];
    }
    return POINT_PRESETS[1];
  }

  function normalizeConfig(input) {
    var source = input || {};
    var point = pointById(source.pointId || "generic");
    var x = source.x === undefined ? point.x : Number(source.x);
    var y = source.y === undefined ? point.y : Number(source.y);
    var lambda = source.lambda === undefined ? 0.5 : Number(source.lambda);
    return {
      functionId: functionById(source.functionId || "z2").id,
      pointId: point.id,
      x: finite(x) ? clamp(x, -2, 2) : point.x,
      y: finite(y) ? clamp(y, -2, 2) : point.y,
      lambda: finite(lambda) ? clamp(lambda, -1, 1) : 0.5
    };
  }

  function complexDivide(numerator, denominator) {
    var scale = denominator[0] * denominator[0] + denominator[1] * denominator[1];
    if (scale <= EPS) return null;
    return [
      (numerator[0] * denominator[0] + numerator[1] * denominator[1]) / scale,
      (numerator[1] * denominator[0] - numerator[0] * denominator[1]) / scale
    ];
  }

  function jacobianApply(data, vector) {
    return [
      data.ux * vector[0] + data.uy * vector[1],
      data.vx * vector[0] + data.vy * vector[1]
    ];
  }

  function functionData(id, x, y, lambda) {
    var ux;
    var uy;
    var vx;
    var vy;
    var u;
    var v;
    var description;
    if (id === "z2") {
      u = x * x - y * y;
      v = 2 * x * y;
      ux = 2 * x;
      uy = -2 * y;
      vx = 2 * y;
      vy = 2 * x;
      description = "z²";
    } else if (id === "conjugate") {
      u = x;
      v = -y;
      ux = 1;
      uy = 0;
      vx = 0;
      vy = -1;
      description = "conjugate(z)";
    } else if (id === "modulus2") {
      u = x * x + y * y;
      v = 0;
      ux = 2 * x;
      uy = 2 * y;
      vx = 0;
      vy = 0;
      description = "|z|²";
    } else {
      u = (1 + lambda) * x * x + (lambda - 1) * y * y;
      v = 2 * x * y;
      ux = 2 * (1 + lambda) * x;
      uy = 2 * (lambda - 1) * y;
      vx = 2 * y;
      vy = 2 * x;
      description = "pλ(z)";
    }
    var residual = [ux - vy, uy + vx];
    var atOrigin = x === 0 && y === 0;
    var complexDifferentiable = id === "z2" ||
      (id === "modulus2" && atOrigin) ||
      (id === "parameterized" && (lambda === 0 || atOrigin));
    var analyticNeighborhood = id === "z2" || (id === "parameterized" && lambda === 0);
    var derivative = complexDifferentiable ? [ux, vx] : null;
    return {
      id: id,
      description: description,
      x: x,
      y: y,
      lambda: lambda,
      u: u,
      v: v,
      ux: ux,
      uy: uy,
      vx: vx,
      vy: vy,
      jacobian: [[ux, uy], [vx, vy]],
      residual: residual,
      residualNorm: Math.hypot(residual[0], residual[1]),
      realDifferentiable: true,
      complexDifferentiable: complexDifferentiable,
      derivative: derivative,
      analyticNeighborhood: analyticNeighborhood,
      classification: analyticNeighborhood
        ? "解析"
        : complexDifferentiable
          ? "仅在此点复可导"
          : "此点不复可导"
    };
  }

  function directionalQuotient(data, vector) {
    return complexDivide(jacobianApply(data, vector), vector);
  }

  function probeLedger(data) {
    return DIRECTIONS.map(function (direction) {
      return {
        id: direction.id,
        label: direction.label,
        vector: direction.vector.slice(),
        quotient: directionalQuotient(data, direction.vector)
      };
    });
  }

  function probesAgree(probes) {
    if (!probes.length || !probes[0].quotient) return false;
    return probes.slice(1).every(function (probe) {
      return nearComplex(probe.quotient, probes[0].quotient);
    });
  }

  function evaluate(input) {
    var config = normalizeConfig(input);
    var rows = FUNCTIONS.map(function (item) {
      var data = functionData(item.id, config.x, config.y, config.lambda);
      data.label = item.label;
      data.note = item.note;
      data.probes = probeLedger(data);
      data.probesAgree = probesAgree(data.probes);
      return data;
    });
    var selected = rows.filter(function (row) {
      return row.id === config.functionId;
    })[0] || rows[0];
    return {
      config: config,
      rows: rows,
      selected: selected,
      finiteProbeWarning: "有限方向探针是诊断，不是邻域解析性的证明。",
      allRealDifferentiable: rows.every(function (row) { return row.realDifferentiable; })
    };
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) < 0.0005 && value !== 0) return value.toExponential(Math.min(places, 4));
    var text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
  }

  function formatComplex(value, digits) {
    if (!value) return "不存在";
    var real = Math.abs(value[0]) < 0.0000001 ? 0 : value[0];
    var imaginary = Math.abs(value[1]) < 0.0000001 ? 0 : value[1];
    if (imaginary === 0) return formatNumber(real, digits);
    if (real === 0) return formatNumber(imaginary, digits) + "i";
    return formatNumber(real, digits) + (imaginary < 0 ? " − " : " + ") + formatNumber(Math.abs(imaginary), digits) + "i";
  }

  function formatPair(value, digits) {
    return "(" + formatNumber(value[0], digits) + ", " + formatNumber(value[1], digits) + ")";
  }

  function assert(condition, message) {
    if (!condition) fail(message);
  }

  function selfTest() {
    var checks = 0;
    var origin = evaluate({ pointId: "origin", lambda: 0.5 });
    var originZ2 = origin.rows[0];
    var originConjugate = origin.rows[1];
    var originModulus = origin.rows[2];
    var originParameterized = origin.rows[3];
    assert(origin.rows.length === 4, "all four ledger rows should be present"); checks += 1;
    assert(originZ2.complexDifferentiable && nearComplex(originZ2.derivative, [0, 0]), "z² derivative at zero"); checks += 1;
    assert(originZ2.analyticNeighborhood && originZ2.probesAgree, "z² analytic certificate"); checks += 1;
    assert(!originConjugate.complexDifferentiable && near(originConjugate.residual[0], 2), "conjugate C-R residual"); checks += 1;
    assert(nearComplex(originConjugate.probes[0].quotient, [1, 0]) && nearComplex(originConjugate.probes[1].quotient, [-1, 0]), "conjugate directional probes"); checks += 1;
    assert(originModulus.complexDifferentiable && nearComplex(originModulus.derivative, [0, 0]) && !originModulus.analyticNeighborhood, "modulus point-only differentiability"); checks += 1;
    assert(originParameterized.complexDifferentiable && !originParameterized.analyticNeighborhood, "parameter family point-only differentiability"); checks += 1;

    var generic = evaluate({ pointId: "generic", lambda: 0.5 });
    var genericZ2 = generic.rows[0];
    var genericConjugate = generic.rows[1];
    var genericModulus = generic.rows[2];
    var genericParameterized = generic.rows[3];
    assert(nearComplex(genericZ2.derivative, [2, 2]) && genericZ2.residualNorm <= EPS, "z² generic derivative"); checks += 1;
    assert(nearComplex(genericConjugate.probes[2].quotient, [0, -1]), "conjugate diagonal quotient"); checks += 1;
    assert(!genericModulus.complexDifferentiable && near(genericModulus.residual[0], 2) && near(genericModulus.residual[1], 2), "modulus generic C-R failure"); checks += 1;
    assert(!genericParameterized.complexDifferentiable && near(genericParameterized.residual[0], 1) && near(genericParameterized.residual[1], 1), "parameter generic C-R failure"); checks += 1;
    assert(!genericModulus.probesAgree && !genericParameterized.probesAgree, "finite probes diagnose the generic failures"); checks += 1;

    var analyticParameter = evaluate({ pointId: "generic", lambda: 0 });
    assert(analyticParameter.rows[3].analyticNeighborhood && nearComplex(analyticParameter.rows[3].derivative, [2, 2]), "lambda zero recovers z²"); checks += 1;
    var tinyNonzeroParameter = evaluate({ pointId: "generic", lambda: 1e-11 }).rows[3];
    assert(!tinyNonzeroParameter.complexDifferentiable && !tinyNonzeroParameter.analyticNeighborhood,
      "nonzero symbolic parameter is not rounded into a theorem predicate"); checks += 1;
    assert(analyticParameter.allRealDifferentiable, "real polynomial maps are real differentiable"); checks += 1;
    assert(evaluate({ pointId: "axis", lambda: 0.5 }).config.x === 1, "point preset normalization"); checks += 1;
    assert(evaluate({ pointId: "generic", lambda: 9 }).config.lambda === 1, "lambda clamp upper bound"); checks += 1;
    assert(evaluate({ pointId: "generic", lambda: -9 }).config.lambda === -1, "lambda clamp lower bound"); checks += 1;

    FUNCTIONS.forEach(function (item) {
      var row = generic.rows.filter(function (candidate) { return candidate.id === item.id; })[0];
      assert(row.probes.length === DIRECTIONS.length && row.probes.every(function (probe) { return probe.quotient !== null; }), item.id + " probe ledger completeness"); checks += 1;
    });
    return { checks: checks, presets: POINT_PRESETS.length };
  }

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc);
  }

  function svgElement(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return {
      node: element(doc, "div", { className: "ca-metric" }, [
        element(doc, "span", { text: label }),
        value
      ]),
      value: value
    };
  }

  function drawProbeSvg(doc, svg, row) {
    clear(svg);
    var width = 720;
    var height = 320;
    var plot = { left: 48, top: 28, width: 360, height: 246 };
    var values = row.probes.map(function (probe) { return probe.quotient; });
    if (row.derivative) values.push(row.derivative);
    var extent = 1;
    values.forEach(function (value) {
      if (value) extent = Math.max(extent, Math.abs(value[0]), Math.abs(value[1]));
    });
    extent = Math.min(12, Math.max(1, extent * 1.2));
    var mapX = function (value) { return plot.left + (value + extent) * plot.width / (2 * extent); };
    var mapY = function (value) { return plot.top + plot.height - (value + extent) * plot.height / (2 * extent); };
    svg.appendChild(svgElement(doc, "desc", {}, "所选函数的有限方向商位于复系数平面；金色虚线圆点是存在时的点复导数，有限探针不构成邻域解析性证明。"));
    svg.appendChild(svgElement(doc, "rect", { x: plot.left, y: plot.top, width: plot.width, height: plot.height, fill: "var(--bg,#fff)", stroke: "var(--border,#c8cdd3)" }));
    [-extent, 0, extent].forEach(function (tick) {
      svg.appendChild(svgElement(doc, "line", { className: tick === 0 ? "ca-axis" : "ca-grid", x1: mapX(tick), y1: plot.top, x2: mapX(tick), y2: plot.top + plot.height }));
      svg.appendChild(svgElement(doc, "line", { className: tick === 0 ? "ca-axis" : "ca-grid", x1: plot.left, y1: mapY(tick), x2: plot.left + plot.width, y2: mapY(tick) }));
      svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: mapX(tick), y: plot.top + plot.height + 17, "text-anchor": "middle" }, formatNumber(tick, 1)));
      if (tick !== -extent) svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: plot.left - 7, y: mapY(tick) + 4, "text-anchor": "end" }, formatNumber(tick, 1)));
    });
    svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: plot.left + plot.width / 2, y: height - 12, "text-anchor": "middle" }, "Re(Q)"));
    svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: 12, y: plot.top + plot.height / 2, transform: "rotate(-90 12 " + (plot.top + plot.height / 2) + ")", "text-anchor": "middle" }, "Im(Q)"));
    row.probes.forEach(function (probe) {
      var quotient = probe.quotient;
      var cx = mapX(quotient[0]);
      var cy = mapY(quotient[1]);
      svg.appendChild(svgElement(doc, "circle", { className: "ca-probe", cx: cx, cy: cy, r: 5 }));
      svg.appendChild(svgElement(doc, "text", { className: "ca-label", x: cx + 8, y: cy - 7 }, probe.label));
    });
    if (row.derivative) {
      var dx = mapX(row.derivative[0]);
      var dy = mapY(row.derivative[1]);
      svg.appendChild(svgElement(doc, "circle", { className: "ca-reference", cx: dx, cy: dy, r: 10 }));
      svg.appendChild(svgElement(doc, "text", { className: "ca-label", x: dx + 12, y: dy + 14 }, "f′"));
    }
    svg.appendChild(svgElement(doc, "text", { className: "ca-label", x: 448, y: 52 }, row.label + " at z₀=" + formatNumber(row.x, 2) + "+" + formatNumber(row.y, 2) + "i"));
    svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: 448, y: 78 }, "C–R residual=" + formatPair(row.residual, 3)));
    svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: 448, y: 104 }, "finite probes agree=" + (row.probesAgree ? "yes" : "no")));
    svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: 448, y: 130 }, "point derivative=" + (row.derivative ? formatComplex(row.derivative, 3) : "undefined")));
    svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: 448, y: 178 }, "legend"));
    svg.appendChild(svgElement(doc, "circle", { className: "ca-probe", cx: 456, cy: 201, r: 5 }));
    svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: 470, y: 205 }, "direction quotient Qw"));
    svg.appendChild(svgElement(doc, "circle", { className: "ca-reference", cx: 456, cy: 229, r: 9 }));
    svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: 470, y: 233 }, "C–R-compatible point derivative"));
    svg.appendChild(svgElement(doc, "text", { className: "ca-small", x: 448, y: 268 }, "finite probes are diagnostics, never a neighborhood proof"));
  }

  function mount(root, api) {
    if (!host || !host.document) return;
    var doc = host.document;
    installStyles(doc);
    INSTANCE += 1;
    var state = {
      config: normalizeConfig({}),
      answers: { cr: null, status: null, probes: null, real: null },
      revealed: false
    };
    var refs = {
      functionButtons: [],
      pointButtons: [],
      questionButtons: {},
      lambdaInput: null,
      lambdaOutput: null,
      resultShell: null,
      feedback: null,
      metrics: [],
      stage: null,
      ledger: null,
      status: null
    };

    function selectedFunction() {
      return functionById(state.config.functionId);
    }

    function expectedAnswers(result) {
      var selected = result.selected;
      return {
        cr: selected.complexDifferentiable ? "yes" : "no",
        status: selected.analyticNeighborhood ? "analytic" : selected.complexDifferentiable ? "point-only" : "not-complex",
        probes: selected.probesAgree ? "agree" : "split",
        real: "no"
      };
    }

    function questionSpecs(result) {
      return [
        { key: "cr", label: "1. 当前所选函数在 z₀ 满足 C–R 吗？", expected: expectedAnswers(result).cr, choices: [{ value: "yes", label: "满足" }, { value: "no", label: "不满足" }] },
        { key: "status", label: "2. 当前所选函数的复导数/解析分类是？", expected: expectedAnswers(result).status, choices: [{ value: "analytic", label: "邻域解析" }, { value: "point-only", label: "仅此点复可导" }, { value: "not-complex", label: "此点不复可导" }] },
        { key: "probes", label: "3. 当前三个有限方向商相同，还是已经分叉？", expected: expectedAnswers(result).probes, choices: [{ value: "agree", label: "相同；探针未发现冲突" }, { value: "split", label: "分叉；已发现不复可导" }] },
        { key: "real", label: "4. 实可微是否自动等于复解析？", expected: "no", choices: [{ value: "yes", label: "是" }, { value: "no", label: "否，需 C–R 邻域条件" }] }
      ];
    }

    function renderPredictionButtons(result) {
      var specs = questionSpecs(result);
      specs.forEach(function (spec) {
        (refs.questionButtons[spec.key] || []).forEach(function (entry) {
          var selected = state.answers[spec.key] === entry.value;
          entry.button.setAttribute("aria-pressed", selected ? "true" : "false");
          if (state.revealed) {
            entry.button.textContent = (entry.value === spec.expected ? "✓ " : "") + entry.label;
            entry.button.className = entry.value === spec.expected ? "ca-pass" : selected ? "ca-warn" : "";
          } else {
            entry.button.textContent = entry.label;
            entry.button.className = "";
          }
        });
      });
    }

    function lock(message) {
      state.answers = { cr: null, status: null, probes: null, real: null };
      state.revealed = false;
      if (refs.resultShell) refs.resultShell.hidden = true;
      if (refs.feedback) {
        refs.feedback.className = "ca-feedback";
        refs.feedback.textContent = message || "参数已改变；请重新完成预测门。";
      }
      renderPredictionButtons(evaluate(state.config));
    }

    function addQuestion(key, label, choices) {
      var grid = element(doc, "div", { className: "ca-choice-grid", role: "group", "aria-label": label });
      var buttons = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () {
          state.answers[key] = choice.value;
          renderPredictionButtons(evaluate(state.config));
        });
        buttons.push({ button: button, value: choice.value, label: choice.label });
        grid.appendChild(button);
      });
      refs.questionButtons[key] = buttons;
      return element(doc, "div", { className: "ca-question" }, [
        element(doc, "span", { className: "ca-question-label" }, label),
        grid
      ]);
    }

    function addRow(body, cells) {
      var row = element(doc, "tr");
      cells.forEach(function (cell, index) {
        row.appendChild(element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell));
      });
      body.appendChild(row);
    }

    function renderResult(result) {
      var selected = result.selected;
      refs.metrics[0].value.textContent = selected.label;
      refs.metrics[1].value.textContent = formatPair(selected.residual, 3);
      refs.metrics[2].value.textContent = selected.complexDifferentiable ? formatComplex(selected.derivative, 3) : "不存在";
      refs.metrics[3].value.textContent = selected.analyticNeighborhood ? "解析" : selected.complexDifferentiable ? "点可导" : "否";
      refs.metrics[4].value.textContent = selected.probesAgree ? "相同" : "分叉";
      drawProbeSvg(doc, refs.svg, selected);
      clear(refs.ledger);
      var body = element(doc, "tbody");
      result.rows.forEach(function (row) {
        var derivativeText = row.derivative ? formatComplex(row.derivative, 3) : "不存在";
        addRow(body, [
          row.label,
          "[" + formatPair(row.jacobian[0], 3) + "; " + formatPair(row.jacobian[1], 3) + "]",
          formatPair(row.residual, 3),
          formatComplex(row.probes[0].quotient, 3),
          formatComplex(row.probes[1].quotient, 3),
          formatComplex(row.probes[2].quotient, 3),
          derivativeText,
          row.realDifferentiable ? "是" : "否",
          row.analyticNeighborhood ? "解析" : row.complexDifferentiable ? "仅此点" : "否"
        ]);
      });
      refs.ledger.appendChild(body);
      refs.status.textContent = selected.analyticNeighborhood
        ? "当前函数的精确公式在邻域内满足 C–R；方向商只是同一事实的有限诊断。"
        : selected.complexDifferentiable
          ? "C–R 只在当前点成立：点复可导不升级为解析邻域。"
          : "方向商已经分叉；精确 C–R 残差给出当前点的失败原因。";
    }

    var shell = element(doc, "div", { className: "ca-shell" });
    shell.appendChild(element(doc, "h3", {}, "C–R 方向账本：点导数、探针与邻域量词"));
    shell.appendChild(element(doc, "p", { className: "ca-note" }, "四个实多项式共享同一组方向探针。解析结论来自精确 C–R 公式；SVG 只负责把有限诊断画出来。"));

    var functionSection = element(doc, "section", {}, [element(doc, "h4", {}, "选择所要预测的函数")]);
    var functionGrid = element(doc, "div", { className: "ca-function-grid", role: "group", "aria-label": "函数选择" });
    FUNCTIONS.forEach(function (item) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, item.label);
      button.addEventListener("click", function () {
        state.config.functionId = item.id;
        lock("函数已改变；请重新预测 C–R 与邻域分类。");
        renderControls();
      });
      refs.functionButtons.push({ button: button, id: item.id });
      functionGrid.appendChild(button);
    });
    functionSection.appendChild(functionGrid);
    shell.appendChild(functionSection);

    var pointSection = element(doc, "section", {}, [element(doc, "h4", {}, "选择诊断点")]);
    var pointGrid = element(doc, "div", { className: "ca-point-grid", role: "group", "aria-label": "点预设" });
    POINT_PRESETS.forEach(function (point) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, point.label);
      button.addEventListener("click", function () {
        state.config.pointId = point.id;
        state.config.x = point.x;
        state.config.y = point.y;
        lock("诊断点已改变；点可导与邻域解析性需要重新预测。");
        renderControls();
      });
      refs.pointButtons.push({ button: button, id: point.id });
      pointGrid.appendChild(button);
    });
    pointSection.appendChild(pointGrid);
    shell.appendChild(pointSection);

    var controls = element(doc, "div", { className: "ca-controls" });
    var lambdaControl = element(doc, "div", { className: "ca-control" });
    refs.lambdaOutput = element(doc, "output", { text: "0.5" });
    refs.lambdaInput = element(doc, "input", { type: "range", min: "-1", max: "1", step: "0.1", value: "0.5", "aria-label": "参数 lambda" });
    refs.lambdaInput.addEventListener("input", function () {
      state.config.lambda = Number(refs.lambdaInput.value);
      lock("λ 已改变；参数多项式的 C–R 账本需要重新预测。");
      renderControls();
    });
    lambdaControl.appendChild(element(doc, "label", { className: "ca-control-label" }, ["参数 λ=", refs.lambdaOutput]));
    lambdaControl.appendChild(refs.lambdaInput);
    controls.appendChild(lambdaControl);
    var probeNote = element(doc, "p", { className: "ca-note" }, "方向固定为 1、i、1+i；方向商只检查这些有限方向。");
    controls.appendChild(probeNote);
    shell.appendChild(controls);

    var prediction = element(doc, "section", { className: "ca-prediction" });
    prediction.appendChild(element(doc, "strong", { className: "ca-prediction-title" }, "预测门：四项都作答后才揭示精确账本与 SVG"));
    prediction.appendChild(addQuestion("cr", "1. 当前所选函数在 z₀ 满足 C–R 吗？", [
      { value: "yes", label: "满足" }, { value: "no", label: "不满足" }
    ]));
    prediction.appendChild(addQuestion("status", "2. 当前所选函数的复导数/解析分类是？", [
      { value: "analytic", label: "邻域解析" }, { value: "point-only", label: "仅此点复可导" }, { value: "not-complex", label: "此点不复可导" }
    ]));
    prediction.appendChild(addQuestion("probes", "3. 三个有限方向商刚好相同，应如何读？", [
      { value: "agree", label: "探针未发现冲突" }, { value: "split", label: "探针已发现分叉" }
    ]));
    prediction.appendChild(addQuestion("real", "4. 实可微是否自动等于复解析？", [
      { value: "yes", label: "是" }, { value: "no", label: "否，需邻域条件" }
    ]));
    refs.feedback = element(doc, "p", { className: "ca-feedback", "aria-live": "polite", "aria-atomic": "true" }, "");
    prediction.appendChild(refs.feedback);
    var actions = element(doc, "div", { className: "ca-actions" });
    var reveal = element(doc, "button", { type: "button", className: "ca-primary" }, "揭示方向账本");
    reveal.addEventListener("click", function () {
      var keys = Object.keys(state.answers);
      if (keys.some(function (key) { return state.answers[key] === null; })) {
        refs.feedback.className = "ca-feedback ca-warn";
        refs.feedback.textContent = "还有预测没有作答。";
        return;
      }
      var result = evaluate(state.config);
      var expected = expectedAnswers(result);
      var correct = keys.filter(function (key) { return state.answers[key] === expected[key]; }).length;
      state.revealed = true;
      refs.resultShell.hidden = false;
      refs.feedback.className = "ca-feedback " + (correct === keys.length ? "ca-pass" : "ca-warn");
      refs.feedback.textContent = "预测得分 " + correct + "/" + keys.length + "；现在把实微分、点复导数和邻域解析性分账。";
      renderPredictionButtons(result);
      renderResult(result);
      announce(api, root, refs.feedback.textContent);
    });
    var reset = element(doc, "button", { type: "button" }, "重置实验");
    reset.addEventListener("click", function () {
      state.config = normalizeConfig({});
      state.answers = { cr: null, status: null, probes: null, real: null };
      state.revealed = false;
      refs.lambdaInput.value = "0.5";
      refs.resultShell.hidden = true;
      refs.feedback.className = "ca-feedback";
      refs.feedback.textContent = "已重置；请重新完成预测门。";
      renderControls();
      announce(api, root, "复变方向账本已重置。");
    });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    prediction.appendChild(actions);
    shell.appendChild(prediction);

    refs.resultShell = element(doc, "section", { className: "ca-results", hidden: "hidden" });
    refs.resultShell.appendChild(element(doc, "h4", {}, "揭示后的精确 C–R 与方向账本"));
    refs.metrics = [
      metric(doc, "当前函数"),
      metric(doc, "C–R residual"),
      metric(doc, "点复导数"),
      metric(doc, "邻域分类"),
      metric(doc, "有限探针")
    ];
    refs.resultShell.appendChild(element(doc, "div", { className: "ca-metrics" }, refs.metrics.map(function (item) { return item.node; })));
    refs.stage = element(doc, "div", { className: "ca-stage" });
    refs.svg = svgElement(doc, "svg", {
      className: "ca-svg",
      viewBox: "0 0 720 320",
      role: "img",
      "aria-label": "所选函数的有限方向商复平面图"
    });
    refs.stage.appendChild(refs.svg);
    refs.resultShell.appendChild(refs.stage);
    refs.ledger = element(doc, "table", { "aria-label": "四个函数的 C-R 方向账本" });
    refs.ledger.appendChild(element(doc, "caption", {}, "所有数值都在当前 z₀ 与 λ 下计算；有限方向商不替代邻域证明。"));
    refs.ledger.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", {}, "函数"),
      element(doc, "th", {}, "J_f"),
      element(doc, "th", {}, "(r₁,r₂)"),
      element(doc, "th", {}, "Q₁"),
      element(doc, "th", {}, "Qᵢ"),
      element(doc, "th", {}, "Q₁₊ᵢ"),
      element(doc, "th", {}, "点复导数"),
      element(doc, "th", {}, "实可微"),
      element(doc, "th", {}, "邻域")
    ])));
    refs.resultShell.appendChild(element(doc, "div", { className: "ca-table-wrap" }, refs.ledger));
    refs.status = element(doc, "p", { className: "ca-interpretation", "aria-live": "polite" }, "");
    refs.resultShell.appendChild(refs.status);
    shell.appendChild(refs.resultShell);
    root.replaceChildren(shell);

    function renderControls() {
      refs.functionButtons.forEach(function (entry) {
        entry.button.setAttribute("aria-pressed", entry.id === state.config.functionId ? "true" : "false");
      });
      refs.pointButtons.forEach(function (entry) {
        entry.button.setAttribute("aria-pressed", entry.id === state.config.pointId ? "true" : "false");
      });
      refs.lambdaInput.value = String(state.config.lambda);
      refs.lambdaOutput.textContent = formatNumber(state.config.lambda, 1);
      renderPredictionButtons(evaluate(state.config));
    }

    renderControls();
    refs.feedback.textContent = "选择函数与诊断点，先完成四项预测。";
  }

  return {
    FUNCTIONS: FUNCTIONS,
    POINT_PRESETS: POINT_PRESETS,
    DIRECTIONS: DIRECTIONS,
    normalizeConfig: normalizeConfig,
    functionData: functionData,
    directionalQuotient: directionalQuotient,
    evaluate: evaluate,
    selfTest: selfTest,
    mount: mount
  };
});
