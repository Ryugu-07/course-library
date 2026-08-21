(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("normal-modes-rigid-body", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("normal-modes-rigid-body self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("normal-modes-rigid-body self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "normal-modes-rigid-body-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var OSCILLATION = {
    M: [[1, 0], [0, 4]],
    K: [[5, -6], [-6, 20]]
  };
  var INERTIA = [
    [2, -1, 0],
    [-1, 2, 0],
    [0, 0, 5]
  ];
  var MODE_PRESETS = [
    { id: "low", label: "低频模", amplitude: [1, 0], note: "只激发 ω²=2 的同向模。" },
    { id: "high", label: "高频模", amplitude: [0, 1], note: "只激发 ω²=8 的反向模。" },
    { id: "mix", label: "两模等幅", amplitude: [1, 1], note: "两个 M-正交模叠加；仍是线性化解。" }
  ];
  var AXIS_PRESETS = [
    { id: "1", label: "绕轴 1（I=1）" },
    { id: "2", label: "绕轴 2（I=3）" },
    { id: "3", label: "绕轴 3（I=5）" }
  ];
  var STYLE_TEXT = [
    ".nm-lab{--nm-blue:var(--cl-blue,#315f9d);--nm-gold:var(--cl-gold,#95670d);--nm-green:var(--cl-green,#347247);--nm-red:var(--cl-red,#b13d32);--nm-purple:#745a9d;max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".nm-lab *,.nm-lab *::before,.nm-lab *::after{box-sizing:border-box}.nm-lab [hidden]{display:none!important}.nm-lab h3,.nm-lab h4{margin:0;color:var(--fg);letter-spacing:0}.nm-lab h3{font-size:1.16rem}.nm-lab h4{margin-top:16px;font-size:1rem}.nm-lab p{margin:8px 0}.nm-lab .nm-note,.nm-lab .nm-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}",
    ".nm-lab button,.nm-lab input{font:inherit}.nm-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.nm-lab button:hover{border-color:var(--accent)}.nm-lab button:focus-visible,.nm-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.nm-lab button[aria-pressed=true],.nm-lab button.nm-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.nm-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".nm-lab .nm-mode-grid,.nm-lab .nm-axis-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}.nm-lab .nm-controls{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(220px,.8fr);gap:14px;margin:12px 0;align-items:start}.nm-lab .nm-control{min-width:0;display:grid;gap:6px}.nm-lab .nm-control label{color:var(--fg-soft);font-size:12.5px;font-weight:750}.nm-lab .nm-control output{color:var(--accent);font-variant-numeric:tabular-nums}.nm-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".nm-lab .nm-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--nm-gold);background:var(--block-bg,var(--bg))}.nm-lab .nm-prediction-title{display:block;margin-bottom:8px;font-size:13px}.nm-lab .nm-question{margin:10px 0}.nm-lab .nm-question-label{display:block;margin-bottom:6px;font-size:13px;font-weight:700}.nm-lab .nm-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.nm-lab .nm-feedback{min-height:2em;margin:8px 0;font-weight:700}.nm-lab .nm-pass{color:var(--nm-green)}.nm-lab .nm-warn{color:var(--nm-red)}.nm-lab .nm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.nm-lab .nm-actions>*{flex:1 1 170px}",
    ".nm-lab .nm-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.nm-lab .nm-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0}.nm-lab .nm-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.nm-lab .nm-metric:nth-child(6n+1){border-color:var(--nm-blue)}.nm-lab .nm-metric:nth-child(6n+2){border-color:var(--nm-gold)}.nm-lab .nm-metric:nth-child(6n+3){border-color:var(--nm-green)}.nm-lab .nm-metric:nth-child(6n+4){border-color:var(--nm-red)}.nm-lab .nm-metric:nth-child(6n+5){border-color:var(--nm-purple)}.nm-lab .nm-metric:nth-child(6n){border-color:var(--accent)}.nm-lab .nm-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.nm-lab .nm-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".nm-lab .nm-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.nm-lab .nm-svg{display:block;width:100%;max-width:100%;height:auto;min-width:620px;color:var(--fg)}.nm-lab .nm-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.nm-lab .nm-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.72}.nm-lab .nm-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72}.nm-lab .nm-trajectory{fill:none;stroke:var(--nm-blue);stroke-width:2.8}.nm-lab .nm-current{fill:var(--nm-gold);stroke:var(--bg);stroke-width:2}.nm-lab .nm-mode-low{stroke:var(--nm-green);stroke-width:2;stroke-dasharray:6 4}.nm-lab .nm-mode-high{stroke:var(--nm-red);stroke-width:2;stroke-dasharray:6 4}.nm-lab .nm-principal-one{stroke:var(--nm-blue);stroke-width:3}.nm-lab .nm-principal-two{stroke:var(--nm-green);stroke-width:3}.nm-lab .nm-principal-three{stroke:var(--nm-red);stroke-width:3}.nm-lab .nm-label{font-size:11px}.nm-lab .nm-small{font-size:10.5px;fill:var(--fg-soft)!important}",
    ".nm-lab .nm-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.nm-lab table{width:100%;min-width:900px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}.nm-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.nm-lab th,.nm-lab td{padding:7px 7px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.nm-lab th{color:var(--fg-soft);font-size:11px;font-weight:750}.nm-lab .nm-good{color:var(--nm-green);font-weight:750}.nm-lab .nm-bad{color:var(--nm-red);font-weight:750}.nm-lab .nm-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--nm-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:1000px){.nm-lab .nm-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.nm-lab .nm-controls{grid-template-columns:minmax(0,1fr)}}@media(max-width:760px){.nm-lab .nm-mode-grid,.nm-lab .nm-axis-grid,.nm-lab .nm-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:440px){.nm-lab .nm-metrics{grid-template-columns:minmax(0,1fr)}.nm-lab .nm-stage{padding:4px}.nm-lab table{font-size:11px}}@media(prefers-reduced-motion:reduce){.nm-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance === undefined ? EPS : tolerance) * scale;
  }

  function fail(message) {
    throw new Error("normal-modes-rigid-body: " + message);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function dot2(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }

  function dot3(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function norm2(value) {
    return Math.sqrt(dot2(value, value));
  }

  function norm3(value) {
    return Math.sqrt(dot3(value, value));
  }

  function subtract2(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
  }

  function scale2(value, factor) {
    return [value[0] * factor, value[1] * factor];
  }

  function add2(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
  }

  function matVec2(matrix, vector) {
    return [
      matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
      matrix[1][0] * vector[0] + matrix[1][1] * vector[1]
    ];
  }

  function matVec3(matrix, vector) {
    return [
      matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
      matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
      matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2]
    ];
  }

  function massInner(mass, left, right) {
    return dot2(left, matVec2(mass, right));
  }

  function generalizedPolynomial(problem) {
    var m = problem.M;
    var k = problem.K;
    return {
      quadratic: m[0][0] * m[1][1] - m[0][1] * m[1][0],
      linear: -(k[0][0] * m[1][1] + k[1][1] * m[0][0] - k[0][1] * m[1][0] - m[0][1] * k[1][0]),
      constant: k[0][0] * k[1][1] - k[0][1] * k[1][0]
    };
  }

  function determinantAt(problem, lambda) {
    var matrix = [
      [problem.K[0][0] - lambda * problem.M[0][0], problem.K[0][1] - lambda * problem.M[0][1]],
      [problem.K[1][0] - lambda * problem.M[1][0], problem.K[1][1] - lambda * problem.M[1][1]]
    ];
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  }

  function solveGeneralizedModes(problem) {
    var polynomial = generalizedPolynomial(problem);
    var discriminant = polynomial.linear * polynomial.linear - 4 * polynomial.quadratic * polynomial.constant;
    var rootA = (-polynomial.linear - Math.sqrt(discriminant)) / (2 * polynomial.quadratic);
    var rootB = (-polynomial.linear + Math.sqrt(discriminant)) / (2 * polynomial.quadratic);
    var roots = [Math.min(rootA, rootB), Math.max(rootA, rootB)];
    return roots.map(function (lambda, index) {
      var a = problem.K[0][0] - lambda * problem.M[0][0];
      var b = problem.K[0][1] - lambda * problem.M[0][1];
      var vector = [-b, a];
      if (norm2(vector) <= EPS) {
        vector = [problem.K[1][1] - lambda * problem.M[1][1], -(problem.K[1][0] - lambda * problem.M[1][0])];
      }
      var mNorm = Math.sqrt(massInner(problem.M, vector, vector));
      var normalized = scale2(vector, 1 / mNorm);
      var residual = subtract2(matVec2(problem.K, normalized), scale2(matVec2(problem.M, normalized), lambda));
      return {
        id: index === 0 ? "low" : "high",
        label: index === 0 ? "低频模" : "高频模",
        lambda: lambda,
        omegaSquared: lambda,
        omega: lambda >= 0 ? Math.sqrt(lambda) : null,
        growthRate: lambda < 0 ? Math.sqrt(-lambda) : null,
        temporalType: lambda < 0 ? "exponential" : lambda === 0 ? "neutral" : "oscillatory",
        vector: normalized,
        rawVector: vector,
        massNorm: massInner(problem.M, normalized, normalized),
        euclideanNorm: norm2(normalized),
        residual: residual,
        residualNorm: norm2(residual),
        determinant: determinantAt(problem, lambda)
      };
    });
  }

  function modeById(modes, id) {
    for (var index = 0; index < modes.length; index += 1) {
      if (modes[index].id === id) return modes[index];
    }
    return modes[0];
  }

  function normalizeConfig(input) {
    var source = input || {};
    var modeId = source.modeId || "mix";
    var axisId = String(source.axisId || "2");
    var mode = MODE_PRESETS.filter(function (item) { return item.id === modeId; })[0] || MODE_PRESETS[2];
    var axis = AXIS_PRESETS.filter(function (item) { return item.id === axisId; })[0] || AXIS_PRESETS[1];
    var time = source.time === undefined ? 1 : Number(source.time);
    var spin = source.spin === undefined ? 1 : Number(source.spin);
    return {
      modeId: mode.id,
      modeLabel: mode.label,
      axisId: axis.id,
      axisLabel: axis.label,
      time: finite(time) ? clamp(time, 0.25, 8) : 1,
      spin: finite(spin) ? clamp(spin, 0.25, 2) : 1
    };
  }

  function displacementAtTime(modes, config, time) {
    var mode = MODE_PRESETS.filter(function (item) { return item.id === config.modeId; })[0] || MODE_PRESETS[2];
    var displacement = [0, 0];
    modes.forEach(function (item, index) {
      var temporalFactor = item.omega === null
        ? Math.cosh(item.growthRate * time)
        : Math.cos(item.omega * time);
      var coefficient = mode.amplitude[index] * temporalFactor;
      displacement = add2(displacement, scale2(item.vector, coefficient));
    });
    return displacement;
  }

  function sampleTrajectory(modes, config, count) {
    var samples = [];
    var steps = count || 64;
    for (var index = 0; index <= steps; index += 1) {
      var time = config.time * index / steps;
      samples.push({ time: time, displacement: displacementAtTime(modes, config, time) });
    }
    return samples;
  }

  function principalAxisLedger(inertia) {
    var rootTwo = Math.sqrt(2);
    var axes = [
      { id: "1", label: "轴 1", moment: 1, axis: [1 / rootTwo, 1 / rootTwo, 0] },
      { id: "2", label: "轴 2", moment: 3, axis: [1 / rootTwo, -1 / rootTwo, 0] },
      { id: "3", label: "轴 3", moment: 5, axis: [0, 0, 1] }
    ];
    return axes.map(function (item) {
      var image = matVec3(inertia, item.axis);
      var residual = [
        image[0] - item.moment * item.axis[0],
        image[1] - item.moment * item.axis[1],
        image[2] - item.moment * item.axis[2]
      ];
      return {
        id: item.id,
        label: item.label,
        moment: item.moment,
        axis: item.axis,
        unitNorm: norm3(item.axis),
        image: image,
        residual: residual,
        residualNorm: norm3(residual),
        quadratic: dot3(item.axis, image)
      };
    });
  }

  function stabilityLedger(spin) {
    var moments = [1, 3, 5];
    var omega = spin === undefined ? 1 : Number(spin);
    var coefficients = [
      (moments[2] - moments[0]) * (moments[0] - moments[1]) / (moments[1] * moments[2]),
      (moments[1] - moments[2]) * (moments[0] - moments[1]) / (moments[0] * moments[2]),
      (moments[1] - moments[2]) * (moments[2] - moments[0]) / (moments[0] * moments[1])
    ];
    return coefficients.map(function (coefficient, index) {
      var sigmaSquared = coefficient * omega * omega;
      return {
        axis: String(index + 1),
        moment: moments[index],
        coefficient: coefficient,
        spin: omega,
        sigmaSquared: sigmaSquared,
        classification: sigmaSquared > EPS ? "不稳定（指数型）" : "稳定型振荡",
        torqueFree: true,
        linearized: true
      };
    });
  }

  function evaluate(input) {
    var config = normalizeConfig(input);
    var modes = solveGeneralizedModes(OSCILLATION);
    var principal = principalAxisLedger(INERTIA);
    var stability = stabilityLedger(config.spin);
    var selectedStability = stability.filter(function (item) { return item.axis === config.axisId; })[0];
    return {
      config: config,
      modes: modes,
      polynomial: generalizedPolynomial(OSCILLATION),
      selectedDisplacement: displacementAtTime(modes, config, config.time),
      trajectory: sampleTrajectory(modes, config, 64),
      inertia: INERTIA,
      principalAxes: principal,
      stability: stability,
      selectedStability: selectedStability,
      linearized: true,
      nonlinearWarning: "小振动模态是平衡点附近的线性化解；主轴稳定性是无力矩微扰结论。"
    };
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 5 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.00001) return value.toExponential(Math.min(places, 4));
    var text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
  }

  function formatVector(vector) {
    return "(" + vector.map(function (value) { return formatNumber(value, 4); }).join(", ") + ")";
  }

  function assert(condition, message) {
    if (!condition) fail(message);
  }

  function selfTest() {
    var checks = 0;
    var result = evaluate({ modeId: "mix", time: 1, axisId: "2", spin: 1 });
    assert(result.modes.length === 2, "two generalized modes"); checks += 1;
    assert(near(result.polynomial.quadratic, 4) && near(result.polynomial.linear, -40) && near(result.polynomial.constant, 64), "generalized characteristic polynomial"); checks += 1;
    assert(near(result.modes[0].omegaSquared, 2) && near(result.modes[1].omegaSquared, 8), "transparent eigenvalues"); checks += 1;
    assert(near(result.modes[0].determinant, 0) && near(result.modes[1].determinant, 0), "eigenvalue determinant roots"); checks += 1;
    assert(result.modes.every(function (mode) { return mode.residualNorm <= 1e-9 && near(mode.massNorm, 1); }), "normalized generalized eigen residuals"); checks += 1;
    assert(near(dot2(result.modes[0].vector, result.modes[1].vector), 0.375), "modes are not ordinary-orthogonal"); checks += 1;
    assert(near(massInner(OSCILLATION.M, result.modes[0].vector, result.modes[1].vector), 0), "modes are M-orthogonal"); checks += 1;
    assert(result.trajectory.length === 65 && result.trajectory.every(function (sample) { return finite(sample.displacement[0]) && finite(sample.displacement[1]); }), "deterministic trajectory samples"); checks += 1;
    assert(result.principalAxes.length === 3, "three principal axes"); checks += 1;
    assert(result.principalAxes.every(function (axis) { return near(axis.unitNorm, 1) && axis.residualNorm <= 1e-9 && near(axis.quadratic, axis.moment); }), "principal-axis ledger"); checks += 1;
    assert(near(result.stability[0].sigmaSquared, -8 / 15) && near(result.stability[1].sigmaSquared, 4 / 5) && near(result.stability[2].sigmaSquared, -8 / 3), "torque-free stability coefficients"); checks += 1;
    assert(result.stability[1].classification.indexOf("不稳定") !== -1 && result.stability[0].classification.indexOf("稳定") !== -1, "intermediate-axis classification"); checks += 1;
    assert(result.selectedStability.axis === "2" && result.selectedStability.torqueFree && result.selectedStability.linearized, "stability scope flags"); checks += 1;
    assert(evaluate({ modeId: "low", time: 0.25 }).selectedDisplacement.length === 2, "low-mode preset"); checks += 1;
    assert(evaluate({ modeId: "unknown", axisId: "unknown", time: 99, spin: -1 }).config.modeId === "mix", "mode normalization"); checks += 1;
    assert(evaluate({ modeId: "mix", axisId: "unknown", time: 99, spin: -1 }).config.time === 8 && evaluate({ modeId: "mix", axisId: "unknown", time: 99, spin: -1 }).config.spin === 0.25, "control clamps"); checks += 1;
    var unstableModes = solveGeneralizedModes({ M: [[1, 0], [0, 1]], K: [[-1, 0], [0, 2]] });
    assert(unstableModes[0].omega === null && near(unstableModes[0].growthRate, 1) && unstableModes[0].temporalType === "exponential", "negative generalized eigenvalue exposes a growth rate"); checks += 1;
    var unstableDisplacement = displacementAtTime(unstableModes, { modeId: "low" }, 1);
    assert(near(Math.abs(unstableDisplacement[0]), Math.cosh(1)), "unstable mode uses cosh rather than a frozen zero frequency"); checks += 1;
    return { checks: checks, presets: MODE_PRESETS.length + AXIS_PRESETS.length };
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
      node: element(doc, "div", { className: "nm-metric" }, [
        element(doc, "span", { text: label }),
        value
      ]),
      value: value
    };
  }

  function pathForTrajectory(samples, mapX, mapY) {
    return samples.map(function (sample, index) {
      return (index === 0 ? "M" : "L") + " " + mapX(sample.displacement[0]).toFixed(2) + " " + mapY(sample.displacement[1]).toFixed(2);
    }).join(" ");
  }

  function drawGrid(doc, svg, plot, mapX, mapY) {
    [-2, -1, 0, 1, 2].forEach(function (tick) {
      svg.appendChild(svgElement(doc, "line", { className: tick === 0 ? "nm-axis" : "nm-grid", x1: mapX(tick), y1: plot.top, x2: mapX(tick), y2: plot.top + plot.height }));
      svg.appendChild(svgElement(doc, "line", { className: tick === 0 ? "nm-axis" : "nm-grid", x1: plot.left, y1: mapY(tick), x2: plot.left + plot.width, y2: mapY(tick) }));
      svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: mapX(tick), y: plot.top + plot.height + 16, "text-anchor": "middle" }, String(tick)));
      if (tick !== -2) svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: plot.left - 7, y: mapY(tick) + 4, "text-anchor": "end" }, String(tick)));
    });
  }

  function drawSvg(doc, svg, result) {
    clear(svg);
    svg.appendChild(svgElement(doc, "desc", {}, "左侧是二自由度线性化位移轨迹与两个广义模方向，右侧是惯量张量的主轴投影和选定无力矩稳定性。"));
    var left = { left: 38, top: 38, width: 330, height: 250, min: -2.2, max: 2.2 };
    var mapLX = function (value) { return left.left + (value - left.min) * left.width / (left.max - left.min); };
    var mapLY = function (value) { return left.top + left.height - (value - left.min) * left.height / (left.max - left.min); };
    svg.appendChild(svgElement(doc, "rect", { x: left.left, y: left.top, width: left.width, height: left.height, fill: "var(--bg,#fff)", stroke: "var(--border,#c8cdd3)" }));
    drawGrid(doc, svg, left, mapLX, mapLY);
    svg.appendChild(svgElement(doc, "path", { className: "nm-trajectory", d: pathForTrajectory(result.trajectory, mapLX, mapLY) }));
    var low = result.modes[0].vector;
    var high = result.modes[1].vector;
    svg.appendChild(svgElement(doc, "line", { className: "nm-mode-low", x1: mapLX(-2 * low[0]), y1: mapLY(-2 * low[1]), x2: mapLX(2 * low[0]), y2: mapLY(2 * low[1]) }));
    svg.appendChild(svgElement(doc, "line", { className: "nm-mode-high", x1: mapLX(-2 * high[0]), y1: mapLY(-2 * high[1]), x2: mapLX(2 * high[0]), y2: mapLY(2 * high[1]) }));
    svg.appendChild(svgElement(doc, "circle", { className: "nm-current", cx: mapLX(result.selectedDisplacement[0]), cy: mapLY(result.selectedDisplacement[1]), r: 6 }));
    svg.appendChild(svgElement(doc, "text", { className: "nm-label", x: left.left + left.width / 2, y: 22, "text-anchor": "middle" }, "线性化 q₁–q₂ 轨迹"));
    svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: left.left + left.width / 2, y: 309, "text-anchor": "middle" }, "虚线：广义模方向；圆点：当前 t"));
    svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: 10, y: 170, transform: "rotate(-90 10 170)", "text-anchor": "middle" }, "q₂"));
    svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: 203, y: 327, "text-anchor": "middle" }, "q₁"));

    var right = { left: 410, top: 38, width: 330, height: 250, centerX: 575, centerY: 165, scale: 75 };
    svg.appendChild(svgElement(doc, "rect", { x: right.left, y: right.top, width: right.width, height: right.height, fill: "var(--bg,#fff)", stroke: "var(--border,#c8cdd3)" }));
    svg.appendChild(svgElement(doc, "line", { className: "nm-grid", x1: right.centerX - 135, y1: right.centerY, x2: right.centerX + 135, y2: right.centerY }));
    svg.appendChild(svgElement(doc, "line", { className: "nm-grid", x1: right.centerX, y1: right.centerY - 95, x2: right.centerX, y2: right.centerY + 95 }));
    var axisOne = result.principalAxes[0].axis;
    var axisTwo = result.principalAxes[1].axis;
    svg.appendChild(svgElement(doc, "line", { className: "nm-principal-one", x1: right.centerX - right.scale * axisOne[0], y1: right.centerY + right.scale * axisOne[1], x2: right.centerX + right.scale * axisOne[0], y2: right.centerY - right.scale * axisOne[1] }));
    svg.appendChild(svgElement(doc, "line", { className: "nm-principal-two", x1: right.centerX - right.scale * axisTwo[0], y1: right.centerY + right.scale * axisTwo[1], x2: right.centerX + right.scale * axisTwo[0], y2: right.centerY - right.scale * axisTwo[1] }));
    svg.appendChild(svgElement(doc, "circle", { className: "nm-principal-three", cx: right.centerX, cy: right.centerY, r: 11, fill: "none" }));
    svg.appendChild(svgElement(doc, "circle", { cx: right.centerX, cy: right.centerY, r: 3, fill: "var(--nm-red)" }));
    svg.appendChild(svgElement(doc, "text", { className: "nm-label", x: right.left + right.width / 2, y: 22, "text-anchor": "middle" }, "惯量主轴 xy 投影（⊙ 为 +z）"));
    svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: right.centerX + 82, y: right.centerY - 70 }, "I₁=1"));
    svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: right.centerX + 82, y: right.centerY + 74 }, "I₂=3"));
    svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: right.centerX + 14, y: right.centerY - 8 }, "I₃=5"));
    svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: right.left + 12, y: right.top + 224 }, "轴 " + result.selectedStability.axis + "：σ²=" + formatNumber(result.selectedStability.sigmaSquared, 4) + "；σ²/Ω²=" + formatNumber(result.selectedStability.coefficient, 4)));
    svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: right.left + 12, y: right.top + 242 }, result.selectedStability.classification));
    svg.appendChild(svgElement(doc, "text", { className: "nm-small", x: 575, y: 309, "text-anchor": "middle" }, "主轴账仅针对 torque-free 微扰"));
  }

  function mount(root, api) {
    if (!host || !host.document) return;
    var doc = host.document;
    installStyles(doc);
    INSTANCE += 1;
    var state = {
      config: normalizeConfig({}),
      answers: { spectrum: null, metric: null, linear: null, stability: null },
      revealed: false
    };
    var refs = {
      modeButtons: [],
      axisButtons: [],
      questionButtons: {},
      timeInput: null,
      timeOutput: null,
      spinInput: null,
      spinOutput: null,
      resultShell: null,
      feedback: null,
      metrics: [],
      svg: null,
      modeLedger: null,
      inertiaLedger: null,
      status: null
    };

    function questionSpecs() {
      return [
        { key: "spectrum", label: "1. 透明广义谱的特征值/低频模是？", expected: "2-low", choices: [{ value: "2-low", label: "2；低频是 (2,1)" }, { value: "1-low", label: "1；低频是 (1,1)" }, { value: "8-low", label: "8；低频是 (2,-1)" }] },
        { key: "metric", label: "2. 两个模向量按哪种内积正交？", expected: "mass", choices: [{ value: "mass", label: "M-内积" }, { value: "euclidean", label: "普通点积" }, { value: "none", label: "都不正交" }] },
        { key: "linear", label: "3. 模态叠加的适用范围是？", expected: "local", choices: [{ value: "local", label: "平衡点附近线性化" }, { value: "global", label: "任意大振幅非线性" }, { value: "static", label: "只是一张静态图" }] },
        { key: "stability", label: "4. 中间轴结论应如何记账？", expected: "unstable-scoped", choices: [{ value: "unstable-scoped", label: "无力矩微扰下不稳定" }, { value: "stable", label: "总是稳定" }, { value: "universal", label: "所有受力刚体都不稳定" }] }
      ];
    }

    function renderPredictions() {
      var specs = questionSpecs();
      specs.forEach(function (spec) {
        (refs.questionButtons[spec.key] || []).forEach(function (entry) {
          var selected = state.answers[spec.key] === entry.value;
          entry.button.setAttribute("aria-pressed", selected ? "true" : "false");
          if (state.revealed) {
            entry.button.textContent = (entry.value === spec.expected ? "✓ " : "") + entry.label;
            entry.button.className = entry.value === spec.expected ? "nm-pass" : selected ? "nm-warn" : "";
          } else {
            entry.button.textContent = entry.label;
            entry.button.className = "";
          }
        });
      });
    }

    function lock(message) {
      state.answers = { spectrum: null, metric: null, linear: null, stability: null };
      state.revealed = false;
      if (refs.resultShell) refs.resultShell.hidden = true;
      if (refs.feedback) {
        refs.feedback.className = "nm-feedback";
        refs.feedback.textContent = message || "参数已改变；请重新完成预测门。";
      }
      renderPredictions();
    }

    function addQuestion(key, label, choices) {
      var grid = element(doc, "div", { className: "nm-choice-grid", role: "group", "aria-label": label });
      var buttons = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () {
          state.answers[key] = choice.value;
          renderPredictions();
        });
        buttons.push({ button: button, value: choice.value, label: choice.label });
        grid.appendChild(button);
      });
      refs.questionButtons[key] = buttons;
      return element(doc, "div", { className: "nm-question" }, [
        element(doc, "span", { className: "nm-question-label" }, label),
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
      refs.metrics[0].value.textContent = formatNumber(result.modes[0].omegaSquared, 3) + ", " + formatNumber(result.modes[1].omegaSquared, 3);
      refs.metrics[1].value.textContent = result.modes.map(function (mode) {
        return mode.omega === null ? "growth " + formatNumber(mode.growthRate, 3) : formatNumber(mode.omega, 3);
      }).join(", ");
      refs.metrics[2].value.textContent = formatVector(result.selectedDisplacement);
      refs.metrics[3].value.textContent = result.config.modeLabel;
      refs.metrics[4].value.textContent = result.selectedStability.classification;
      refs.metrics[5].value.textContent = "Ω=" + formatNumber(result.config.spin, 2);
      drawSvg(doc, refs.svg, result);
      clear(refs.modeLedger);
      var modeBody = element(doc, "tbody");
      result.modes.forEach(function (mode) {
        addRow(modeBody, [
          mode.label,
          formatVector(mode.vector),
          formatNumber(mode.omegaSquared, 5),
          mode.omega === null ? "growth " + formatNumber(mode.growthRate, 5) : formatNumber(mode.omega, 5),
          formatNumber(mode.massNorm, 5),
          formatNumber(mode.residualNorm, 8),
          formatNumber(mode.determinant, 8)
        ]);
      });
      refs.modeLedger.appendChild(modeBody);
      clear(refs.inertiaLedger);
      var inertiaBody = element(doc, "tbody");
      result.principalAxes.forEach(function (axis) {
        var stability = result.stability.filter(function (item) { return item.axis === axis.id; })[0];
        addRow(inertiaBody, [
          axis.label,
          formatNumber(axis.moment, 4),
          formatVector(axis.axis),
          formatNumber(axis.unitNorm, 5),
          formatNumber(axis.residualNorm, 8),
          formatNumber(stability.sigmaSquared, 5) + " (" + formatNumber(stability.coefficient, 5) + ")",
          stability.classification
        ]);
      });
      refs.inertiaLedger.appendChild(inertiaBody);
      refs.status.textContent = result.selectedStability.classification.indexOf("不稳定") !== -1
        ? "轴 " + result.selectedStability.axis + " 的 σ²>0 只说明无力矩 Euler 线性化微扰指数放大；不等于所有受力刚体运动都失稳。"
        : "轴 " + result.selectedStability.axis + " 的 σ²<0 给出线性化振荡型稳定；大振幅、外力矩和耗散仍需另行分析。";
    }

    var shell = element(doc, "div", { className: "nm-shell" });
    shell.appendChild(element(doc, "h3", {}, "简正模与刚体主轴账本"));
    shell.appendChild(element(doc, "p", { className: "nm-note" }, "前半是 M、K 的广义特征问题，后半是惯量主轴的 torque-free 线性化稳定性；两本账不混合。"));
    shell.appendChild(element(doc, "h4", {}, "选择线性化模态"));
    var modeGrid = element(doc, "div", { className: "nm-mode-grid", role: "group", "aria-label": "模态预设" });
    MODE_PRESETS.forEach(function (mode) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, mode.label);
      button.addEventListener("click", function () {
        state.config.modeId = mode.id;
        lock("模态预设已改变；先预测广义谱与适用范围。");
        renderControls();
      });
      refs.modeButtons.push({ button: button, id: mode.id });
      modeGrid.appendChild(button);
    });
    shell.appendChild(modeGrid);
    shell.appendChild(element(doc, "h4", {}, "选择 torque-free 线性化自旋轴"));
    var axisGrid = element(doc, "div", { className: "nm-axis-grid", role: "group", "aria-label": "自旋轴预设" });
    AXIS_PRESETS.forEach(function (axis) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, axis.label);
      button.addEventListener("click", function () {
        state.config.axisId = axis.id;
        renderControls();
        if (state.revealed) renderResult(evaluate(state.config));
      });
      refs.axisButtons.push({ button: button, id: axis.id });
      axisGrid.appendChild(button);
    });
    shell.appendChild(axisGrid);
    var controls = element(doc, "div", { className: "nm-controls" });
    var timeControl = element(doc, "div", { className: "nm-control" });
    refs.timeOutput = element(doc, "output", { text: "1" });
    refs.timeInput = element(doc, "input", { type: "range", min: "0.25", max: "8", step: "0.25", value: "1", "aria-label": "观察时间" });
    refs.timeInput.addEventListener("input", function () {
      state.config.time = Number(refs.timeInput.value);
      lock("观察时间已改变；有限轨迹需要重新预测。");
      renderControls();
    });
    timeControl.appendChild(element(doc, "label", {}, ["观察时间 t=", refs.timeOutput]));
    timeControl.appendChild(refs.timeInput);
    controls.appendChild(timeControl);
    var spinControl = element(doc, "div", { className: "nm-control" });
    refs.spinOutput = element(doc, "output", { text: "1" });
    refs.spinInput = element(doc, "input", { type: "range", min: "0.25", max: "2", step: "0.25", value: "1", "aria-label": "无量纲自旋率" });
    refs.spinInput.addEventListener("input", function () {
      state.config.spin = Number(refs.spinInput.value);
      renderControls();
      if (state.revealed) renderResult(evaluate(state.config));
    });
    spinControl.appendChild(element(doc, "label", {}, ["无量纲 Ω=", refs.spinOutput]));
    spinControl.appendChild(refs.spinInput);
    controls.appendChild(spinControl);
    shell.appendChild(controls);

    var prediction = element(doc, "section", { className: "nm-prediction" });
    prediction.appendChild(element(doc, "strong", { className: "nm-prediction-title" }, "预测门：四项都作答后才揭示谱、主轴和轨迹"));
    prediction.appendChild(addQuestion("spectrum", "1. 透明广义谱的特征值/低频模是？", [
      { value: "2-low", label: "2；低频 (2,1)" }, { value: "1-low", label: "1；低频 (1,1)" }, { value: "8-low", label: "8；低频 (2,-1)" }
    ]));
    prediction.appendChild(addQuestion("metric", "2. 两个模向量按哪种内积正交？", [
      { value: "mass", label: "M-内积" }, { value: "euclidean", label: "普通点积" }, { value: "none", label: "都不正交" }
    ]));
    prediction.appendChild(addQuestion("linear", "3. 模态叠加的适用范围是？", [
      { value: "local", label: "平衡点附近线性化" }, { value: "global", label: "任意大振幅非线性" }, { value: "static", label: "只是一张静态图" }
    ]));
    prediction.appendChild(addQuestion("stability", "4. 中间轴结论应如何记账？", [
      { value: "unstable-scoped", label: "无力矩微扰下不稳定" }, { value: "stable", label: "总是稳定" }, { value: "universal", label: "所有受力刚体都不稳定" }
    ]));
    refs.feedback = element(doc, "p", { className: "nm-feedback", "aria-live": "polite", "aria-atomic": "true" }, "");
    prediction.appendChild(refs.feedback);
    var actions = element(doc, "div", { className: "nm-actions" });
    var reveal = element(doc, "button", { type: "button", className: "nm-primary" }, "揭示力学账本");
    reveal.addEventListener("click", function () {
      var keys = Object.keys(state.answers);
      if (keys.some(function (key) { return state.answers[key] === null; })) {
        refs.feedback.className = "nm-feedback nm-warn";
        refs.feedback.textContent = "还有预测没有作答。";
        return;
      }
      var result = evaluate(state.config);
      var expected = {};
      questionSpecs().forEach(function (spec) { expected[spec.key] = spec.expected; });
      var correct = keys.filter(function (key) { return state.answers[key] === expected[key]; }).length;
      state.revealed = true;
      refs.resultShell.hidden = false;
      refs.feedback.className = "nm-feedback " + (correct === keys.length ? "nm-pass" : "nm-warn");
      refs.feedback.textContent = "预测得分 " + correct + "/" + keys.length + "；下面把广义谱、主轴和适用范围分开核对。";
      renderPredictions();
      renderResult(result);
      announce(api, root, refs.feedback.textContent);
    });
    var reset = element(doc, "button", { type: "button" }, "重置实验");
    reset.addEventListener("click", function () {
      state.config = normalizeConfig({});
      state.answers = { spectrum: null, metric: null, linear: null, stability: null };
      state.revealed = false;
      refs.resultShell.hidden = true;
      refs.feedback.className = "nm-feedback";
      refs.feedback.textContent = "已重置；请重新完成预测门。";
      renderControls();
      announce(api, root, "简正模与刚体账本已重置。");
    });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    prediction.appendChild(actions);
    shell.appendChild(prediction);

    refs.resultShell = element(doc, "section", { className: "nm-results", hidden: "hidden" });
    refs.resultShell.appendChild(element(doc, "h4", {}, "揭示后的广义谱、主轴与有限轨迹"));
    refs.metrics = [
      metric(doc, "ω²"),
      metric(doc, "ω / growth"),
      metric(doc, "当前 η(t)"),
      metric(doc, "线性化模态"),
      metric(doc, "选定稳定性"),
      metric(doc, "自旋率")
    ];
    refs.resultShell.appendChild(element(doc, "div", { className: "nm-metrics" }, refs.metrics.map(function (item) { return item.node; })));
    var stage = element(doc, "div", { className: "nm-stage" });
    refs.svg = svgElement(doc, "svg", {
      className: "nm-svg",
      viewBox: "0 0 760 340",
      role: "img",
      "aria-label": "简正模位移轨迹与惯量主轴图"
    });
    stage.appendChild(refs.svg);
    refs.resultShell.appendChild(stage);
    refs.modeLedger = element(doc, "table", { "aria-label": "广义特征值账本" });
    refs.modeLedger.appendChild(element(doc, "caption", {}, "残差是 ||Ka−ω²Ma||；质量归一化后模态按 M-内积读取。"));
    refs.modeLedger.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", {}, "模态"),
      element(doc, "th", {}, "M-归一向量"),
      element(doc, "th", {}, "ω²"),
      element(doc, "th", {}, "ω / growth"),
      element(doc, "th", {}, "aᵀMa"),
      element(doc, "th", {}, "特征残差"),
      element(doc, "th", {}, "det(K−ω²M)")
    ])));
    refs.resultShell.appendChild(element(doc, "div", { className: "nm-table-wrap" }, refs.modeLedger));
    refs.inertiaLedger = element(doc, "table", { "aria-label": "惯量主轴与稳定性账本" });
    refs.inertiaLedger.appendChild(element(doc, "caption", {}, "σ² 与 σ²/Ω² 来自 torque-free Euler 方程在各主轴附近的线性化；不是一般受力运动分类。"));
    refs.inertiaLedger.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", {}, "主轴"),
      element(doc, "th", {}, "I"),
      element(doc, "th", {}, "单位轴"),
      element(doc, "th", {}, "单位范数"),
      element(doc, "th", {}, "主轴残差"),
      element(doc, "th", {}, "σ² (σ²/Ω²)"),
      element(doc, "th", {}, "判断")
    ])));
    refs.resultShell.appendChild(element(doc, "div", { className: "nm-table-wrap" }, refs.inertiaLedger));
    refs.status = element(doc, "p", { className: "nm-interpretation", "aria-live": "polite" }, "");
    refs.resultShell.appendChild(refs.status);
    shell.appendChild(refs.resultShell);
    root.replaceChildren(shell);

    function renderControls() {
      refs.modeButtons.forEach(function (entry) {
        entry.button.setAttribute("aria-pressed", entry.id === state.config.modeId ? "true" : "false");
      });
      refs.axisButtons.forEach(function (entry) {
        entry.button.setAttribute("aria-pressed", entry.id === state.config.axisId ? "true" : "false");
      });
      refs.timeInput.value = String(state.config.time);
      refs.timeOutput.textContent = formatNumber(state.config.time, 2);
      refs.spinInput.value = String(state.config.spin);
      refs.spinOutput.textContent = formatNumber(state.config.spin, 2);
      renderPredictions();
    }

    renderControls();
    refs.feedback.textContent = "选择模态与自旋轴，先完成四项预测。";
  }

  return {
    OSCILLATION: OSCILLATION,
    INERTIA: INERTIA,
    MODE_PRESETS: MODE_PRESETS,
    AXIS_PRESETS: AXIS_PRESETS,
    generalizedPolynomial: generalizedPolynomial,
    solveGeneralizedModes: solveGeneralizedModes,
    principalAxisLedger: principalAxisLedger,
    stabilityLedger: stabilityLedger,
    displacementAtTime: displacementAtTime,
    evaluate: evaluate,
    selfTest: selfTest,
    mount: mount
  };
});
