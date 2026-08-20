(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("interior-central-path", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("interior-central-path self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("interior-central-path self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "interior-central-path-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;
  var START_MIN_SLACK = 1e-7;
  var NEWTON_TOL = 1e-11;
  var MAX_ITER = 80;

  var PROBLEMS = {
    triangle: {
      id: "triangle",
      title: "严格可行三角形 LP",
      c: [-1, -2],
      A: [[-1, 0], [0, -1], [1, 1]],
      b: [0, 0, 1],
      start: [1 / 3, 1 / 3],
      strictFeasible: true,
      note: "minimize -x₁-2x₂ subject to x₁≥0, x₂≥0, x₁+x₂≤1；最优顶点是 (0,1)。"
    },
    noStrict: {
      id: "no-strict",
      title: "没有严格可行点的退化 LP",
      c: [-1, -2],
      A: [[-1, 0], [0, -1], [1, 1]],
      b: [0, 0, 0],
      start: [0, 0],
      strictFeasible: false,
      note: "x₁≥0、x₂≥0 且 x₁+x₂≤0 只留下 (0,0)，不存在三条约束同时严格的点。"
    }
  };

  var PRESETS = [
    { id: "normal", label: "正常路径", problemId: "triangle", start: [1 / 3, 1 / 3], t: 1, note: "从严格内部点开始，增大 t 观察靠近 (0,1)。" },
    { id: "boundary", label: "边界初值", problemId: "triangle", start: [0, 0.5], t: 1, note: "x₁=0 使 log barrier 无定义，应拒绝。" },
    { id: "ill-conditioned", label: "病态初值", problemId: "triangle", start: [1e-10, 0.5], t: 1, note: "虽形式上严格，但最小 slack 太小，数值条件不可信。" },
    { id: "no-strict", label: "无严格可行点", problemId: "no-strict", start: [0, 0], t: 1, note: "可行集退化为一个边界点，中心路径前提失败。" }
  ];

  var STYLE_TEXT = [
    ".icp-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}.icp-lab *,.icp-lab *::before,.icp-lab *::after{box-sizing:border-box}.icp-lab [hidden]{display:none!important}",
    ".icp-lab h3,.icp-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.icp-lab h3{font-size:1.12rem}.icp-lab h4{margin-top:15px;font-size:1rem}.icp-lab p{margin:8px 0}.icp-lab .icp-intro,.icp-lab .icp-note,.icp-lab .icp-feedback{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
    ".icp-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.icp-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.icp-lab .icp-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}",
    ".icp-lab button,.icp-lab select,.icp-lab input{font:inherit}.icp-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.icp-lab button:hover{border-color:var(--accent,#1769aa)}.icp-lab button:focus-visible,.icp-lab select:focus-visible,.icp-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.icp-lab button[aria-pressed=true],.icp-lab button.icp-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.icp-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".icp-lab .icp-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.icp-lab .icp-actions>*{flex:1 1 170px}.icp-lab .icp-feedback{min-height:2em;margin:8px 0;font-weight:700}.icp-lab .icp-pass{color:var(--cl-green,#2f7547)}.icp-lab .icp-warn{color:var(--cl-red,#b43d32)}",
    ".icp-lab .icp-layout{display:grid;grid-template-columns:minmax(215px,.62fr) minmax(0,1.38fr);gap:14px;align-items:start}.icp-lab .icp-controls,.icp-lab .icp-stage{min-width:0}.icp-lab .icp-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff)}.icp-lab .icp-control{display:grid;gap:5px}.icp-lab .icp-control label{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.icp-lab .icp-control select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b)}.icp-lab .icp-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums}.icp-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#1769aa)}.icp-lab .icp-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.icp-lab .icp-presets button{font-size:12px}",
    ".icp-lab .icp-frame{min-width:0;padding:7px;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.icp-lab .icp-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b)}.icp-lab .icp-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.icp-lab .icp-grid{stroke:var(--border,#c8cdd3);stroke-width:1;stroke-opacity:.75}.icp-lab .icp-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.65}.icp-lab .icp-region{fill:var(--cl-blue,#2c6aa0);fill-opacity:.1;stroke:var(--cl-blue,#2c6aa0);stroke-width:1.5}.icp-lab .icp-path{fill:none;stroke:var(--cl-green,#347247);stroke-width:2.5}.icp-lab .icp-point{fill:var(--cl-gold,#95670d);stroke:var(--bg,#fff);stroke-width:2}.icp-lab .icp-start{fill:var(--cl-red,#b13d32);stroke:var(--bg,#fff);stroke-width:2}.icp-lab .icp-label{font-size:10.5px}.icp-lab .icp-title{font-size:12px;font-weight:800;text-anchor:middle}.icp-lab .icp-bar-bg{fill:var(--border,#c8cdd3)}.icp-lab .icp-bar{fill:var(--cl-green,#347247)}.icp-lab .icp-bar-warn{fill:var(--cl-red,#b13d32)}",
    ".icp-lab .icp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:11px 0}.icp-lab .icp-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--bg,#fff)}.icp-lab .icp-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.icp-lab .icp-metric:nth-child(4n+2){border-color:var(--cl-gold,#95670d)}.icp-lab .icp-metric:nth-child(4n+3){border-color:var(--cl-green,#347247)}.icp-lab .icp-metric:nth-child(4n){border-color:var(--cl-red,#b13d32)}.icp-lab .icp-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px}.icp-lab .icp-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".icp-lab .icp-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.icp-lab table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.icp-lab th,.icp-lab td{padding:7px 7px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.icp-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.icp-lab .icp-checks{display:grid;gap:6px;margin:10px 0 0;padding:0;list-style:none}.icp-lab .icp-checks li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:6px;align-items:start}.icp-lab .icp-check{font-weight:800}.icp-lab .icp-check-pass{color:var(--cl-green,#2f7547)}.icp-lab .icp-check-fail{color:var(--cl-red,#b43d32)}.icp-lab .icp-interpretation{margin-top:10px;padding:9px 11px;border-left:3px solid var(--cl-green,#347247);background:var(--block-bg,var(--bg,#fff));color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;line-height:1.65}",
    "@media(max-width:850px){.icp-lab .icp-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){.icp-lab .icp-choice-grid{grid-template-columns:minmax(0,1fr)}.icp-lab .icp-presets{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){.icp-lab .icp-frame{padding:4px}.icp-lab table{font-size:11.5px}.icp-lab th,.icp-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.icp-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function copyVector(vector) { return vector.slice(); }
  function dot(a, b) { return a.reduce(function (total, value, index) { return total + value * b[index]; }, 0); }
  function norm2(vector) { return Math.sqrt(dot(vector, vector)); }
  function add(a, b) { return a.map(function (value, index) { return value + b[index]; }); }
  function scale(a, factor) { return a.map(function (value) { return value * factor; }); }

  function problemById(id) {
    return PROBLEMS[id] || (id === "no-strict" ? PROBLEMS.noStrict : null);
  }

  function validateProblem(problem) {
    if (!problem || !Array.isArray(problem.A) || problem.A.length !== problem.b.length || problem.A.length < 1) throw new TypeError("invalid LP constraint matrix");
    if (!Array.isArray(problem.c) || problem.c.length !== 2) throw new TypeError("LP must have two variables");
    problem.A.forEach(function (row) {
      if (!Array.isArray(row) || row.length !== 2 || row.some(function (value) { return !finite(Number(value)); })) throw new TypeError("LP rows must be finite 2-vectors");
    });
    if (problem.b.some(function (value) { return !finite(Number(value)); }) || problem.c.some(function (value) { return !finite(Number(value)); })) throw new TypeError("LP data must be finite");
    return problem;
  }

  function slacks(problem, x) {
    return problem.b.map(function (bValue, index) { return Number(bValue) - dot(problem.A[index], x); });
  }

  function solve2(matrix, rhs) {
    var determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    if (!finite(determinant) || Math.abs(determinant) < 1e-18) return null;
    return [
      (rhs[0] * matrix[1][1] - matrix[0][1] * rhs[1]) / determinant,
      (matrix[0][0] * rhs[1] - rhs[0] * matrix[1][0]) / determinant
    ];
  }

  function barrierData(problem, t, x) {
    var currentSlacks = slacks(problem, x);
    var barrier = currentSlacks.reduce(function (total, slack) { return total - Math.log(slack); }, 0);
    var gradient = scale(problem.c, t);
    var hessian = [[0, 0], [0, 0]];
    currentSlacks.forEach(function (slack, index) {
      var row = problem.A[index];
      gradient[0] += row[0] / slack;
      gradient[1] += row[1] / slack;
      hessian[0][0] += row[0] * row[0] / (slack * slack);
      hessian[0][1] += row[0] * row[1] / (slack * slack);
      hessian[1][0] += row[1] * row[0] / (slack * slack);
      hessian[1][1] += row[1] * row[1] / (slack * slack);
    });
    return { slacks: currentSlacks, barrier: barrier, objective: t * dot(problem.c, x) + barrier, gradient: gradient, hessian: hessian };
  }

  function failure(status, message, extra) {
    var result = { ok: false, status: status, failure: message, message: message };
    Object.keys(extra || {}).forEach(function (key) { result[key] = extra[key]; });
    return result;
  }

  function solveCentralPath(input) {
    input = input || {};
    var problem = input.problem || problemById(input.problemId || "triangle");
    if (!problem) return failure("unknown-problem", "找不到这个 LP 预设。");
    try { validateProblem(problem); } catch (error) { return failure("invalid-problem", error.message); }
    var t = Number(input.t === undefined ? 1 : input.t);
    if (!finite(t) || t <= 0) return failure("invalid-barrier", "barrier parameter t must be finite and positive。", { t: t });
    if (problem.strictFeasible === false) return failure("no-strict-feasible-point", "该 LP 的可行集没有同时严格满足所有不等式的点。", { t: t, problemId: problem.id });
    var x = input.start ? copyVector(input.start) : copyVector(problem.start || [1 / 3, 1 / 3]);
    if (!Array.isArray(x) || x.length !== 2 || x.some(function (value) { return !finite(Number(value)); })) return failure("invalid-start", "初值必须是有限的二维向量。", { t: t });
    x = x.map(Number);
    var initialSlacks = slacks(problem, x);
    var minInitialSlack = Math.min.apply(null, initialSlacks);
    if (minInitialSlack <= 0) return failure("not-strict-feasible-start", "初值在边界外或边界上，log barrier 没有定义。", { t: t, start: x, slacks: initialSlacks });
    if (minInitialSlack < START_MIN_SLACK) return failure("ill-conditioned-start", "初值离边界太近，Newton Hessian 的尺度已病态；请从更深的内部开始。", { t: t, start: x, slacks: initialSlacks });

    var iterations = 0;
    var converged = false;
    for (iterations = 0; iterations < MAX_ITER; iterations += 1) {
      var data = barrierData(problem, t, x);
      if (!data.slacks.every(function (slack) { return slack > 0 && finite(slack); })) return failure("left-interior", "Newton 步离开了严格可行域。", { t: t, start: x, slacks: data.slacks, iterations: iterations });
      var gradientNorm = norm2(data.gradient);
      if (gradientNorm <= NEWTON_TOL * Math.max(1, t)) { converged = true; break; }
      var direction = solve2(data.hessian, scale(data.gradient, -1));
      if (!direction || direction.some(function (value) { return !finite(value); })) return failure("singular-newton-system", "Newton 线性系统不可可靠求解。", { t: t, start: x, iterations: iterations });
      var directionalDerivative = dot(data.gradient, direction);
      var step = 1;
      var accepted = false;
      while (step > 1e-14) {
        var candidate = add(x, scale(direction, step));
        var candidateSlacks = slacks(problem, candidate);
        if (candidateSlacks.every(function (slack) { return slack > 0 && finite(slack); })) {
          var candidateData = barrierData(problem, t, candidate);
          if (candidateData.objective <= data.objective + 1e-4 * step * directionalDerivative) {
            x = candidate;
            accepted = true;
            break;
          }
        }
        step *= 0.5;
      }
      if (!accepted) return failure("line-search-failed", "Newton backtracking 找不到保持严格可行且下降的步长。", { t: t, start: x, iterations: iterations });
    }
    if (!converged) return failure("newton-max-iterations", "Newton 在限定迭代次数内没有收敛。", { t: t, start: x, iterations: iterations });

    var finalData = barrierData(problem, t, x);
    var lambda = finalData.slacks.map(function (slack) { return 1 / (t * slack); });
    var stationarity = problem.c.map(function (value, coordinate) {
      return value + problem.A.reduce(function (total, row, index) { return total + row[coordinate] * lambda[index]; }, 0);
    });
    var primalObjective = dot(problem.c, x);
    var dualObjective = -dot(problem.b, lambda);
    var complementarity = finalData.slacks.map(function (slack, index) { return slack * lambda[index]; });
    var targetComplementarity = 1 / t;
    var gap = primalObjective - dualObjective;
    var expectedGap = problem.A.length / t;
    return {
      ok: true,
      status: "ok",
      problemId: problem.id,
      x: x,
      t: t,
      mu: 1 / t,
      slacks: finalData.slacks,
      lambda: lambda,
      barrier: finalData.barrier,
      barrierObjective: finalData.objective,
      primalObjective: primalObjective,
      dualObjective: dualObjective,
      gap: gap,
      expectedGap: expectedGap,
      complementarity: complementarity,
      complementarityResidual: Math.max.apply(null, complementarity.map(function (value) { return Math.abs(value - targetComplementarity); })),
      stationarityResidual: norm2(stationarity),
      primalFeasible: finalData.slacks.every(function (slack) { return slack >= -EPS; }),
      strictFeasible: finalData.slacks.every(function (slack) { return slack > 0; }),
      dualFeasible: lambda.every(function (value) { return value >= -EPS; }),
      boundaryDistance: Math.min.apply(null, finalData.slacks),
      iterations: iterations,
      start: input.start ? copyVector(input.start) : copyVector(problem.start || [1 / 3, 1 / 3])
    };
  }

  function centralPath(tValues, start) {
    return tValues.map(function (t) { return solveCentralPath({ problemId: "triangle", t: t, start: start || PROBLEMS.triangle.start }); });
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function assert(condition, message) {
    if (!condition) throw new Error("interior-central-path self-test failed: " + message);
  }

  function selfTest() {
    var checks = 0;
    [0.1, 1, 10, 40].forEach(function (t) {
      var result = solveCentralPath({ problemId: "triangle", t: t, start: [1 / 3, 1 / 3] });
      checks += 9;
      assert(result.ok, "normal path converges at t=" + t);
      assert(result.primalFeasible && result.strictFeasible, "strict primal feasibility");
      assert(result.dualFeasible, "dual feasibility");
      assert(near(result.gap, 3 / t, 1e-8), "gap m/t");
      assert(near(result.expectedGap, 3 / t, 1e-12), "expected gap");
      assert(result.stationarityResidual < 1e-8, "stationarity");
      assert(result.complementarityResidual < 1e-8, "complementarity");
      assert(result.lambda.every(finite), "finite multipliers");
      assert(result.boundaryDistance > 0, "positive boundary distance");
    });
    var low = solveCentralPath({ problemId: "triangle", t: 0.1 });
    var high = solveCentralPath({ problemId: "triangle", t: 40 });
    checks += 3;
    assert(high.x[1] > low.x[1], "path moves toward optimal vertex");
    assert(high.x[0] < low.x[0], "path moves toward x1 boundary");
    assert(high.boundaryDistance < low.boundaryDistance, "path approaches boundary");
    var failures = [
      solveCentralPath({ problemId: "no-strict", t: 1 }),
      solveCentralPath({ problemId: "triangle", t: 1, start: [0, 0.5] }),
      solveCentralPath({ problemId: "triangle", t: 1, start: [1e-10, 0.5] }),
      solveCentralPath({ problemId: "triangle", t: 0 }),
      solveCentralPath({ problemId: "triangle", t: 1, start: [NaN, 0.2] })
    ];
    checks += 5;
    assert(failures[0].status === "no-strict-feasible-point", "no strict feasible failure");
    assert(failures[1].status === "not-strict-feasible-start", "boundary failure");
    assert(failures[2].status === "ill-conditioned-start", "ill-conditioned failure");
    assert(failures[3].status === "invalid-barrier", "invalid barrier failure");
    assert(failures[4].status === "invalid-start", "invalid start failure");
    return { checks: checks, presets: PRESETS.length };
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function makeElement(api, doc, tag, attrs, children) {
    var node = api && typeof api.el === "function" ? api.el(tag, attrs || {}) : setAttributes(doc.createElement(tag), attrs || {});
    return appendChildren(node, children);
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    setAttributes(node, attrs || {});
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function replaceChildren(node, children) {
    if (node && typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    while (node && node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children);
  }

  function formatNumber(api, value, digits) {
    if (!finite(value)) return "—";
    if (Math.abs(value) < 0.0005) value = 0;
    if (api && typeof api.format === "function") return api.format(value, digits === undefined ? 3 : digits);
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.indexOf(".") < 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function metric(api, doc, label) {
    var value = makeElement(api, doc, "strong", {}, ["—"]);
    return { node: makeElement(api, doc, "div", { className: "icp-metric" }, [makeElement(api, doc, "span", {}, [label]), value]), value: value };
  }

  function drawScene(doc, svg, result, preset) {
    replaceChildren(svg, []);
    svg.setAttribute("viewBox", "0 0 720 330");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "二维线性规划可行三角形与 log barrier central path");
    var plot = { x: 45, y: 38, w: 390, h: 245 };
    function mapX(value) { return plot.x + value * plot.w; }
    function mapY(value) { return plot.y + plot.h - value * plot.h; }
    [0, 0.5, 1].forEach(function (value) {
      svg.appendChild(svgNode(doc, "line", { x1: mapX(value), y1: plot.y, x2: mapX(value), y2: plot.y + plot.h, class: value === 0 ? "icp-axis" : "icp-grid" }));
      svg.appendChild(svgNode(doc, "line", { x1: plot.x, y1: mapY(value), x2: plot.x + plot.w, y2: mapY(value), class: value === 0 ? "icp-axis" : "icp-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: mapX(value), y: plot.y + plot.h + 18, class: "icp-label", "text-anchor": "middle" }, String(value)));
      svg.appendChild(svgNode(doc, "text", { x: plot.x - 7, y: mapY(value) + 4, class: "icp-label", "text-anchor": "end" }, String(value)));
    });
    svg.appendChild(svgNode(doc, "polygon", { points: mapX(0) + "," + mapY(0) + " " + mapX(1) + "," + mapY(0) + " " + mapX(0) + "," + mapY(1), class: "icp-region" }));
    svg.appendChild(svgNode(doc, "text", { x: plot.x + plot.w / 2, y: 20, class: "icp-title" }, "严格可行域与中心路径"));
    svg.appendChild(svgNode(doc, "text", { x: plot.x + plot.w + 8, y: mapY(0) + 4, class: "icp-label" }, "x₁"));
    svg.appendChild(svgNode(doc, "text", { x: plot.x - 3, y: mapY(1) - 8, class: "icp-label", "text-anchor": "end" }, "x₂"));
    var pathResults = centralPath([0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 40], PROBLEMS.triangle.start).filter(function (item) { return item.ok; });
    if (pathResults.length > 1) {
      var path = pathResults.map(function (item, index) { return (index ? "L" : "M") + mapX(item.x[0]).toFixed(2) + "," + mapY(item.x[1]).toFixed(2); }).join(" ");
      svg.appendChild(svgNode(doc, "path", { d: path, class: "icp-path" }));
      pathResults.forEach(function (item) { svg.appendChild(svgNode(doc, "circle", { cx: mapX(item.x[0]), cy: mapY(item.x[1]), r: "3.5", class: "icp-point" })); });
    }
    svg.appendChild(svgNode(doc, "circle", { cx: mapX(0), cy: mapY(1), r: "5", class: "icp-point" }));
    svg.appendChild(svgNode(doc, "text", { x: mapX(0) + 8, y: mapY(1) - 7, class: "icp-label" }, "最优 (0,1)"));
    var current = result && result.x ? result.x : preset.start;
    if (current && current.length === 2 && current.every(finite)) {
      svg.appendChild(svgNode(doc, "circle", { cx: mapX(current[0]), cy: mapY(current[1]), r: "6", class: result && result.ok ? "icp-point" : "icp-start" }));
    }
    var panel = { x: 500, y: 48, w: 175, h: 215 };
    svg.appendChild(svgNode(doc, "text", { x: panel.x + panel.w / 2, y: 20, class: "icp-title" }, "当前 slack 账本"));
    var slackValues = result && result.slacks ? result.slacks : [0, 0, 0];
    var labels = ["s₁=x₁", "s₂=x₂", "s₃=1−x₁−x₂"];
    var maxSlack = 1;
    slackValues.forEach(function (value, index) {
      var y = panel.y + index * 57;
      var safe = finite(value) ? Math.max(0, Math.min(maxSlack, value)) : 0;
      svg.appendChild(svgNode(doc, "text", { x: panel.x, y: y, class: "icp-label" }, labels[index]));
      svg.appendChild(svgNode(doc, "rect", { x: panel.x, y: y + 8, width: panel.w, height: 18, rx: "2", class: "icp-bar-bg" }));
      svg.appendChild(svgNode(doc, "rect", { x: panel.x, y: y + 8, width: panel.w * safe, height: 18, rx: "2", class: result && result.ok ? "icp-bar" : "icp-bar-warn" }));
      svg.appendChild(svgNode(doc, "text", { x: panel.x + panel.w, y: y + 42, class: "icp-label", "text-anchor": "end" }, formatNumber(null, value, 5)));
    });
    svg.appendChild(svgNode(doc, "text", { x: panel.x, y: 255, class: "icp-label" }, result && result.ok ? "绿：严格可行；金：中心路径采样" : "红：失败状态，不显示伪造路径"));
  }

  function renderPrediction(api, state, questions, refs) {
    questions.forEach(function (question) {
      question.choices.forEach(function (choice) { choice.node.setAttribute("aria-pressed", state.predictions[question.key] === choice.value ? "true" : "false"); });
    });
    var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
    refs.reveal.disabled = missing.length > 0;
    refs.feedback.className = "icp-feedback" + (state.feedbackClass ? " " + state.feedbackClass : "");
    refs.feedback.textContent = state.feedback || (missing.length ? "还差 " + missing.length + " 项预测；提交前隐藏中心路径和残差账本。" : "四项都已回答，可以揭晓。");
  }

  function makePredictionForm(api, doc, state, refs) {
    var questions = [
      { key: "vertex", prompt: "把 t 增大时，正常路径会靠近哪个点？", choices: [{ value: "top", label: "(0,1) 顶点" }, { value: "center", label: "(1/3,1/3)" }, { value: "right", label: "(1,0) 顶点" }], expected: "top" },
      { key: "gap", prompt: "本 LP 有 3 条不等式；中心路径的原始--对偶间隙应是什么？", choices: [{ value: "3overT", label: "3/t" }, { value: "1overT", label: "1/t" }, { value: "t3", label: "3t" }], expected: "3overT" },
      { key: "boundary", prompt: "从 x₁=0 的边界初值运行 log barrier，预期状态？", choices: [{ value: "fail", label: "失败并说明原因" }, { value: "continue", label: "照常继续" }, { value: "optimal", label: "直接得到最优" }], expected: "fail" },
      { key: "nostrict", prompt: "可行集只有 (0,0) 时，是否有中心路径？", choices: [{ value: "fail", label: "没有，给失败状态" }, { value: "yes", label: "有且唯一" }, { value: "unknown", label: "只看 gap" }], expected: "fail" }
    ];
    var form = makeElement(api, doc, "form", { className: "icp-prediction", "aria-describedby": "icp-prediction-note" });
    form.appendChild(makeElement(api, doc, "p", { id: "icp-prediction-note", className: "icp-intro" }, ["先预测路径方向、gap 和失败条件；揭晓前不运行可见的计算账本。"]));
    questions.forEach(function (question) {
      var fieldset = makeElement(api, doc, "fieldset", {});
      fieldset.appendChild(makeElement(api, doc, "legend", {}, [question.prompt]));
      var grid = makeElement(api, doc, "div", { className: "icp-choice-grid" });
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; state.feedback = ""; state.feedbackClass = ""; renderPrediction(api, state, questions, refs); });
        choice.node = button;
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      form.appendChild(fieldset);
    });
    refs.questions = questions;
    return form;
  }

  function metricNode(api, doc, label) {
    var value = makeElement(api, doc, "strong", {}, ["—"]);
    return { node: makeElement(api, doc, "div", { className: "icp-metric" }, [makeElement(api, doc, "span", {}, [label]), value]), value: value };
  }

  function renderLedger(api, doc, tableHost, result) {
    if (!result.ok) {
      replaceChildren(tableHost, [makeElement(api, doc, "p", { className: "icp-interpretation" }, ["失败状态：" + result.status + "；" + result.message])]);
      return;
    }
    var body = makeElement(api, doc, "tbody", {});
    ["-x₁≤0", "-x₂≤0", "x₁+x₂≤1"].forEach(function (label, index) {
      body.appendChild(makeElement(api, doc, "tr", {}, [
        makeElement(api, doc, "th", {}, [label]),
        makeElement(api, doc, "td", {}, [formatNumber(api, result.slacks[index], 8)]),
        makeElement(api, doc, "td", {}, [formatNumber(api, result.lambda[index], 8)]),
        makeElement(api, doc, "td", {}, [formatNumber(api, result.complementarity[index], 8)]),
        makeElement(api, doc, "td", {}, ["sλ≈1/t"])
      ]));
    });
    replaceChildren(tableHost, [makeElement(api, doc, "table", {}, [
      makeElement(api, doc, "caption", {}, ["逐约束透明账本：slack、对偶乘子与互补积"]),
      makeElement(api, doc, "thead", {}, [makeElement(api, doc, "tr", {}, [makeElement(api, doc, "th", {}, ["约束"]), makeElement(api, doc, "th", {}, ["slack sᵢ"]), makeElement(api, doc, "th", {}, ["λᵢ"]), makeElement(api, doc, "th", {}, ["sᵢλᵢ"]), makeElement(api, doc, "th", {}, ["目标"])])]),
      body
    ])]);
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") return;
    var doc = root.ownerDocument || document;
    installStyles(doc);
    root.classList.add("icp-lab");
    var state = { presetId: "normal", t: 1, revealed: false, predictions: {}, feedback: "", feedbackClass: "" };
    var refs = {};
    var questions;
    var heading = makeElement(api, doc, "h3", {}, ["中心路径账本：先预测，再让 Newton 走进三角形"]);
    var intro = makeElement(api, doc, "p", { className: "icp-intro" }, ["固定二维 LP：minimize -x₁-2x₂，约束 -x₁≤0、-x₂≤0、x₁+x₂≤1。正常预设从 (1/3,1/3) 出发；自和谐复杂度与 SDP 另列，不由这个 toy 图证明。"]);
    var predictionForm = makePredictionForm(api, doc, state, refs);
    questions = refs.questions;
    var actions = makeElement(api, doc, "div", { className: "icp-actions" });
    var reveal = makeElement(api, doc, "button", { type: "button", className: "icp-primary", text: "核对预测并揭晓" });
    var reset = makeElement(api, doc, "button", { type: "button", text: "重置预测" });
    refs.reveal = reveal;
    refs.feedback = makeElement(api, doc, "p", { className: "icp-feedback", "aria-live": "polite" }, []);
    actions.appendChild(reveal);
    actions.appendChild(reset);

    var presetSelect = makeElement(api, doc, "select", { "aria-label": "内点法场景" }, PRESETS.map(function (preset) { return makeElement(api, doc, "option", { value: preset.id, text: preset.label }); }));
    var tInput = makeElement(api, doc, "input", { type: "range", min: "0.1", max: "40", step: "0.1", value: "1", "aria-label": "barrier parameter t" });
    var tOutput = makeElement(api, doc, "output", {}, ["1"]);
    var controls = makeElement(api, doc, "div", { className: "icp-controls" }, [
      makeElement(api, doc, "div", { className: "icp-control" }, [makeElement(api, doc, "label", {}, ["场景"]), presetSelect]),
      makeElement(api, doc, "div", { className: "icp-control" }, [makeElement(api, doc, "label", {}, ["barrier parameter t = ", tOutput]), tInput]),
      makeElement(api, doc, "p", { className: "icp-note" }, ["正常场景用 Newton + backtracking；失败场景不会伪造一个中心点。t 越大，μ=1/t 越小，路径应更接近边界最优点。"])
    ]);
    var svg = doc.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icp-svg");
    var frame = makeElement(api, doc, "div", { className: "icp-frame" }, [svg]);
    var metricsHost = makeElement(api, doc, "div", { className: "icp-metrics" });
    var tableHost = makeElement(api, doc, "div", { className: "icp-table-wrap" });
    var checksHost = makeElement(api, doc, "ul", { className: "icp-checks" });
    var interpretationHost = makeElement(api, doc, "p", { className: "icp-interpretation" });
    var resultShell = makeElement(api, doc, "div", { hidden: true }, [
      makeElement(api, doc, "div", { className: "icp-layout" }, [controls, makeElement(api, doc, "div", { className: "icp-stage" }, [frame, metricsHost, tableHost, checksHost, interpretationHost])])
    ]);
    replaceChildren(root, [heading, intro, predictionForm, actions, refs.feedback, resultShell]);

    reveal.addEventListener("click", function () {
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭晓：" + correct + "/" + questions.length + " 命中；现在可切换 t 与失败场景。";
      state.feedbackClass = correct === questions.length ? "icp-pass" : "icp-warn";
      render();
      announce(api, root, state.feedback);
    });
    reset.addEventListener("click", function () {
      state.presetId = "normal";
      state.t = 1;
      state.revealed = false;
      state.predictions = {};
      state.feedback = "";
      state.feedbackClass = "";
      render();
      announce(api, root, "预测和中心路径账本已重置。");
    });
    presetSelect.addEventListener("change", function () { state.presetId = presetSelect.value; var preset = PRESETS.filter(function (item) { return item.id === state.presetId; })[0]; state.t = preset.t; render(); });
    tInput.addEventListener("input", function () { state.t = Number(tInput.value); state.presetId = "normal"; render(); });

    function render() {
      renderPrediction(api, state, questions, refs);
      resultShell.hidden = !state.revealed;
      presetSelect.value = state.presetId;
      tInput.value = String(state.t);
      tOutput.textContent = formatNumber(api, state.t, 2);
      if (!state.revealed) return;
      var preset = PRESETS.filter(function (item) { return item.id === state.presetId; })[0] || PRESETS[0];
      var result = solveCentralPath({ problemId: preset.problemId, start: preset.start, t: state.t });
      drawScene(doc, svg, result, preset);
      replaceChildren(metricsHost, [metricNode(api, doc, "t"), metricNode(api, doc, "μ=1/t"), metricNode(api, doc, "primal / dual"), metricNode(api, doc, "gap") , metricNode(api, doc, "min slack"), metricNode(api, doc, "Newton 次数")]);
      var metricValues = result.ok ? [result.t, result.mu, result.primalObjective + " / " + result.dualObjective, result.gap, result.boundaryDistance, result.iterations] : [state.t, 1 / state.t, "—", "—", result.status, "—"];
      metricsHost.querySelectorAll("strong").forEach(function (node, index) { node.textContent = typeof metricValues[index] === "number" ? formatNumber(api, metricValues[index], 7) : String(metricValues[index]); });
      renderLedger(api, doc, tableHost, result);
      var checks = result.ok ? [
        [result.primalFeasible && result.strictFeasible, "primal 严格可行：min slack=" + formatNumber(api, result.boundaryDistance, 8)],
        [result.dualFeasible, "dual 可行：λᵢ≥0"],
        [result.stationarityResidual < 1e-8, "stationarity residual=" + formatNumber(api, result.stationarityResidual, 8)],
        [result.complementarityResidual < 1e-8, "互补性：max|sᵢλᵢ−1/t|=" + formatNumber(api, result.complementarityResidual, 8)],
        [near(result.gap, result.expectedGap, 1e-8), "对偶间隙：gap=" + formatNumber(api, result.gap, 8) + "，m/t=" + formatNumber(api, result.expectedGap, 8)]
      ] : [[false, "失败状态：" + result.status], [false, result.message]];
      replaceChildren(checksHost, checks.map(function (check) { return makeElement(api, doc, "li", {}, [makeElement(api, doc, "span", { className: "icp-check " + (check[0] ? "icp-check-pass" : "icp-check-fail") }, [check[0] ? "✓" : "×"]), makeElement(api, doc, "span", {}, [check[1]])]); }));
      interpretationHost.textContent = result.ok
        ? "中心点严格留在三角形内部；λᵢ=1/(t sᵢ)，所以每一行互补积都是 1/t，三行相加得到 gap=3/t。t 增大只是本二维 LP 的路径跟踪演示，不是一般多项式复杂度证明；自和谐障碍的复杂度条件和 SDP 的 -log det 障碍分别看本页后文。"
        : "这个状态没有被当成数值答案：" + result.message + " 迁移到真实求解器时，先检查严格可行性、尺度和初值，再决定是否重启或改用相应的可行化阶段。";
    }

    render();
  }

  return {
    EPS: EPS,
    PROBLEMS: PROBLEMS,
    PRESETS: PRESETS,
    slacks: slacks,
    barrierData: barrierData,
    solveCentralPath: solveCentralPath,
    solve: solveCentralPath,
    centralPath: centralPath,
    selfTest: selfTest,
    mount: mount
  };
});
