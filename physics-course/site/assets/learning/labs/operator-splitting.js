(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("operator-splitting", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("operator-splitting self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("operator-splitting self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "operator-splitting-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var PROBLEM = {
    id: "quadratic-l1",
    b: [3, -1.5],
    lambda: 0.75,
    L: 1,
    start: [0, 0],
    exact: [2.25, -0.75],
    exactObjective: 2.8125,
    note: "F(x)=1/2||x-b||²+λ||x||₁ with b=(3,-3/2), λ=3/4."
  };
  var PRESETS = [
    { id: "textbook", label: "标准 PG + ADMM", alpha: 0.8, rho: 1, iterations: 12, note: "α≤1/L，ρ>0；两条轨迹都可读。" },
    { id: "small-rho", label: "小 ρ：dual 账变慢", alpha: 0.8, rho: 0.2, iterations: 18, note: "同一解，不同 ADMM 残差尺度和速度。" },
    { id: "overstep", label: "超出标准 PG 步长", alpha: 1.25, rho: 1, iterations: 12, note: "ADMM 仍可运行；PG 单调下降条件不再满足。" }
  ];
  var STYLE_TEXT = [
    ".os-lab{--os-blue:var(--cl-blue,#315f9d);--os-gold:var(--cl-gold,#95670d);--os-green:var(--cl-green,#347247);--os-red:var(--cl-red,#b13d32);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".os-lab *,.os-lab *::before,.os-lab *::after{box-sizing:border-box}.os-lab [hidden]{display:none!important}.os-lab h3,.os-lab h4{margin:0;color:var(--fg);letter-spacing:0}.os-lab h3{font-size:1.16rem}.os-lab h4{margin-top:16px;font-size:1rem}.os-lab p{margin:8px 0}.os-lab .os-intro,.os-lab .os-note,.os-lab .os-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}",
    ".os-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border)}.os-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.os-lab .os-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}",
    ".os-lab button,.os-lab select,.os-lab input{font:inherit}.os-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.os-lab button:hover{border-color:var(--accent)}.os-lab button:focus-visible,.os-lab select:focus-visible,.os-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.os-lab button[aria-pressed=true],.os-lab button.os-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.os-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".os-lab .os-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}.os-lab .os-actions>*{flex:1 1 170px}.os-lab .os-feedback{min-height:2em;margin:8px 0;font-weight:700}.os-lab .os-pass{color:var(--os-green)}.os-lab .os-warn{color:var(--os-red)}",
    ".os-lab .os-layout{display:grid;grid-template-columns:minmax(215px,.64fr) minmax(0,1.36fr);gap:16px;align-items:start}.os-lab .os-controls,.os-lab .os-stage{min-width:0}.os-lab .os-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.os-lab .os-control{display:grid;gap:5px}.os-lab .os-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.os-lab .os-control output{color:var(--accent);font-variant-numeric:tabular-nums}.os-lab .os-control select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.os-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".os-lab .os-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.os-lab .os-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.os-lab .os-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.os-lab .os-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.7}.os-lab .os-axis{stroke:currentColor;stroke-width:1;stroke-opacity:.6}.os-lab .os-opt{stroke:var(--os-gold);stroke-width:2;stroke-dasharray:6 4}.os-lab .os-pg{fill:none;stroke:var(--os-blue);stroke-width:3}.os-lab .os-admm{fill:none;stroke:var(--os-green);stroke-width:3}.os-lab .os-point-pg{fill:var(--os-blue);stroke:var(--bg);stroke-width:2}.os-lab .os-point-admm{fill:var(--os-green);stroke:var(--bg);stroke-width:2}.os-lab .os-label{font-size:11px}.os-lab .os-small{font-size:10.5px;fill:var(--fg-soft)!important}",
    ".os-lab .os-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:12px 0}.os-lab .os-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.os-lab .os-metric:nth-child(3n+1){border-color:var(--os-blue)}.os-lab .os-metric:nth-child(3n+2){border-color:var(--os-gold)}.os-lab .os-metric:nth-child(3n){border-color:var(--os-green)}.os-lab .os-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.os-lab .os-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".os-lab .os-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.os-lab table{width:100%;min-width:850px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}.os-lab th,.os-lab td{padding:7px 6px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.os-lab th{color:var(--fg-soft);font-size:11px}.os-lab td.os-center,.os-lab th.os-center{text-align:center}.os-lab .os-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--os-green);background:var(--block-bg,var(--bg));font-size:13px}.os-lab .os-certificate.os-blocked{border-color:var(--os-red)}.os-lab .os-checks{display:grid;gap:6px;margin:10px 0 0;padding:0;list-style:none}.os-lab .os-checks li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:6px;align-items:start}.os-lab .os-check-pass{color:var(--os-green);font-weight:800}.os-lab .os-check-fail{color:var(--os-red);font-weight:800}",
    "@media(max-width:900px){.os-lab .os-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){.os-lab .os-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){.os-lab .os-frame{padding:4px}.os-lab table{font-size:11px}.os-lab th,.os-lab td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){.os-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function fail(message) { throw new Error("operator-splitting: " + message); }
  function cloneVector(vector) { return vector.slice(); }
  function add(a, b) { return a.map(function (value, index) { return value + b[index]; }); }
  function sub(a, b) { return a.map(function (value, index) { return value - b[index]; }); }
  function scale(a, factor) { return a.map(function (value) { return value * factor; }); }
  function dot(a, b) { return a.reduce(function (total, value, index) { return total + value * b[index]; }, 0); }
  function norm(a) { return Math.sqrt(dot(a, a)); }
  function soft(value, threshold) {
    return value.map(function (item) { return item > threshold ? item - threshold : item < -threshold ? item + threshold : 0; });
  }
  function objective(problem, x) { return 0.5 * norm(sub(x, problem.b)) * norm(sub(x, problem.b)) + problem.lambda * x.reduce(function (total, value) { return total + Math.abs(value); }, 0); }
  function smoothObjective(problem, x) { var delta = sub(x, problem.b); return 0.5 * dot(delta, delta); }
  function nonsmoothObjective(problem, x) { return problem.lambda * x.reduce(function (total, value) { return total + Math.abs(value); }, 0); }
  function exactSolution(problem) { return soft(problem.b, problem.lambda); }
  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i += 1) if (PRESETS[i].id === id) return PRESETS[i];
    fail("unknown preset: " + id);
  }
  function validateConfig(config) {
    if (!config || !finite(Number(config.alpha)) || Number(config.alpha) <= 0) fail("alpha must be positive and finite");
    if (!finite(Number(config.rho)) || Number(config.rho) <= 0) fail("rho must be positive and finite");
    if (!finite(Number(config.iterations)) || Math.floor(Number(config.iterations)) !== Number(config.iterations) || Number(config.iterations) < 1) fail("iterations must be a positive integer");
    return config;
  }
  function cloneConfig(config) { return { id: config.id, label: config.label, alpha: Number(config.alpha), rho: Number(config.rho), iterations: Number(config.iterations), note: config.note }; }
  function pgAssumption(alpha, problem) { return alpha > 0 && alpha <= 1 / problem.L + EPS; }
  function runProxGradient(problem, config) {
    validateConfig(config);
    var x = cloneVector(problem.start);
    var rows = [];
    for (var k = 1; k <= config.iterations; k += 1) {
      var next = soft(sub(x, scale(sub(x, problem.b), config.alpha)), config.alpha * problem.lambda);
      var mapping = norm(scale(sub(x, next), 1 / config.alpha));
      rows.push({ k: k, x: cloneVector(next), objective: objective(problem, next), objectiveGap: objective(problem, next) - problem.exactObjective, primalResidual: mapping, dualResidual: null, step: config.alpha, stationarityResidual: mapping });
      x = next;
    }
    return { method: "prox-gradient", x: x, rows: rows, assumption: pgAssumption(config.alpha, problem), assumptionText: "0 < α ≤ 1/L（标准下降读法）", objective: objective(problem, x), residual: rows.length ? rows[rows.length - 1].primalResidual : null };
  }
  function runAdmm(problem, config) {
    validateConfig(config);
    var x = cloneVector(problem.start), z = cloneVector(problem.start), u = cloneVector(problem.start);
    var rows = [];
    for (var k = 1; k <= config.iterations; k += 1) {
      x = scale(add(problem.b, scale(sub(z, u), config.rho)), 1 / (1 + config.rho));
      var previousZ = z;
      z = soft(add(x, u), problem.lambda / config.rho);
      u = add(u, sub(x, z));
      var primal = norm(sub(x, z));
      var dual = config.rho * norm(sub(z, previousZ));
      rows.push({ k: k, x: cloneVector(x), z: cloneVector(z), u: cloneVector(u), objective: objective(problem, z), splitObjective: smoothObjective(problem, x) + nonsmoothObjective(problem, z), objectiveGap: objective(problem, z) - problem.exactObjective, primalResidual: primal, dualResidual: dual, step: config.rho });
    }
    return { method: "ADMM", x: x, z: z, u: u, rows: rows, assumption: true, assumptionText: "ρ > 0；f,g 闭、真、凸，未增广 Lagrangian 有鞍点，且两子问题的最小值可取", objective: objective(problem, z), splitObjective: smoothObjective(problem, x) + nonsmoothObjective(problem, z), residual: rows.length ? rows[rows.length - 1].primalResidual : null };
  }
  function solve(input) {
    var config = input && input.config ? input.config : (input || PRESETS[0]);
    var current = cloneConfig(config);
    validateConfig(current);
    var problem = input && input.problem ? input.problem : PROBLEM;
    var pg = runProxGradient(problem, current);
    var admm = runAdmm(problem, current);
    return { problem: problem, config: current, exact: exactSolution(problem), exactObjective: problem.exactObjective, pg: pg, admm: admm };
  }
  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var text = Number(value).toFixed(digits === undefined ? 5 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
  }
  function formatVector(vector) { return "(" + vector.map(function (value) { return formatNumber(value, 4); }).join(", ") + ")"; }
  function assert(condition, message) { if (!condition) fail(message); }
  function selfTest() {
    var checks = 0;
    var exact = exactSolution(PROBLEM);
    assert(near(exact[0], 2.25) && near(exact[1], -0.75), "soft-threshold exact solution mismatch"); checks += 1;
    assert(near(objective(PROBLEM, exact), 2.8125), "exact objective mismatch"); checks += 1;
    PRESETS.forEach(function (preset) {
      var result = solve(preset);
      assert(result.pg.rows.length === preset.iterations && result.admm.rows.length === preset.iterations, preset.id + " iteration count mismatch"); checks += 1;
      result.pg.rows.concat(result.admm.rows).forEach(function (row) {
        assert(finite(row.objective) && finite(row.primalResidual) && (row.dualResidual === null || finite(row.dualResidual)), preset.id + " nonfinite ledger row"); checks += 1;
      });
      assert(result.admm.rows.every(function (row) { return row.primalResidual >= -EPS && row.dualResidual >= -EPS; }), preset.id + " residual sign mismatch"); checks += 1;
    });
    var textbook = solve(PRESETS[0]);
    assert(textbook.pg.assumption && textbook.admm.assumption, "textbook assumptions should pass"); checks += 1;
    assert(textbook.pg.rows[textbook.pg.rows.length - 1].primalResidual < textbook.pg.rows[0].primalResidual, "PG residual should decrease in textbook preset"); checks += 1;
    assert(textbook.admm.rows[textbook.admm.rows.length - 1].primalResidual < textbook.admm.rows[0].primalResidual, "ADMM primal residual should decrease in textbook preset"); checks += 1;
    var overstep = solve(PRESETS[2]);
    assert(!overstep.pg.assumption && overstep.admm.assumption, "overstep should separate PG and ADMM assumptions"); checks += 1;
    var invalid = false;
    try { solve({ alpha: 0, rho: 1, iterations: 3 }); } catch (error) { invalid = true; }
    assert(invalid, "zero alpha must be rejected"); checks += 1;
    invalid = false;
    try { solve({ alpha: 0.5, rho: 0, iterations: 3 }); } catch (error) { invalid = true; }
    assert(invalid, "zero rho must be rejected"); checks += 1;
    return { checks: checks, presets: PRESETS.length };
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
  function element(doc, tag, attributes, children) { return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc); }
  function svgElement(doc, tag, attributes, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function metric(doc, label) { var value = element(doc, "strong", { text: "—" }); return { node: element(doc, "div", { className: "os-metric" }, [element(doc, "span", { text: label }), value]), value: value }; }
  function questionSpecs(result) {
    return [
      { key: "alpha", prompt: "当前 α 是否满足标准 PG 的 0<α≤1/L 下降读法？", expected: result.pg.assumption ? "yes" : "no", choices: [{ value: "yes", label: "满足" }, { value: "no", label: "不满足" }] },
      { key: "residual", prompt: "ADMM 的 primal / scaled dual residual 应分别看什么？", expected: "split", choices: [{ value: "split", label: "‖x−z‖ 与 ρ‖z_k−z_{k−1}‖" }, { value: "objective", label: "只看目标值差" }, { value: "pg", label: "都用 PG mapping" }] },
      { key: "finite", prompt: "有限步接近 F* 是否自动证明一般收敛定理？", expected: "no", choices: [{ value: "yes", label: "是，一次图就足够" }, { value: "no", label: "否，还需定理假设" }, { value: "unknown", label: "只看最后一行" }] }
    ];
  }
  function renderPredictions(state, refs) {
    var result = solve({ config: state.config });
    var specs = questionSpecs(result);
    refs.questions.forEach(function (questionRef, index) {
      var spec = specs[index];
      questionRef.buttons.forEach(function (buttonRef) {
        var selected = state.predictions[spec.key] === buttonRef.value;
        buttonRef.node.setAttribute("aria-pressed", selected ? "true" : "false");
        if (state.revealed) {
          var correct = buttonRef.value === spec.expected;
          buttonRef.node.textContent = (correct ? "✓ " : "") + buttonRef.label;
          buttonRef.node.className = correct ? "os-pass" : (selected ? "os-warn" : "");
        } else { buttonRef.node.textContent = buttonRef.label; buttonRef.node.className = ""; }
      });
    });
  }
  function chartPath(rows, key, width, height, pad, min, max) {
    if (!rows.length) return "";
    return rows.map(function (row, index) {
      var x = pad + (width - 2 * pad) * (rows.length === 1 ? 0 : index / (rows.length - 1));
      var value = Number(row[key]);
      var y = height - pad - (height - 2 * pad) * ((value - min) / Math.max(EPS, max - min));
      return (index === 0 ? "M" : "L") + " " + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
  }
  function drawChart(doc, svg, result, uid) {
    clear(svg);
    var width = 720, height = 340, pad = 45;
    var values = result.pg.rows.concat(result.admm.rows).map(function (row) { return row.objective; }).concat([result.exactObjective]);
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    min = Math.max(0, min - 0.15 * Math.max(1, max - min)); max += 0.12 * Math.max(1, max - min);
    svg.appendChild(svgElement(doc, "desc", {}, "蓝线是 prox-gradient 的 F(x)，绿线是 ADMM 在 z 上的 F(z)，金色虚线是精确最优目标。"));
    for (var i = 0; i <= 4; i += 1) {
      var y = height - pad - (height - 2 * pad) * i / 4;
      svg.appendChild(svgElement(doc, "line", { x1: pad, y1: y, x2: width - pad, y2: y, class: "os-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: 5, y: y + 4, class: "os-small" }, formatNumber(min + (max - min) * i / 4, 2)));
    }
    svg.appendChild(svgElement(doc, "line", { x1: pad, y1: height - pad, x2: width - pad, y2: height - pad, class: "os-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: pad, y1: pad, x2: pad, y2: height - pad, class: "os-axis" }));
    var optimumY = height - pad - (height - 2 * pad) * ((result.exactObjective - min) / Math.max(EPS, max - min));
    svg.appendChild(svgElement(doc, "line", { x1: pad, y1: optimumY, x2: width - pad, y2: optimumY, class: "os-opt" }));
    svg.appendChild(svgElement(doc, "path", { d: chartPath(result.pg.rows, "objective", width, height, pad, min, max), class: "os-pg" }));
    svg.appendChild(svgElement(doc, "path", { d: chartPath(result.admm.rows, "objective", width, height, pad, min, max), class: "os-admm" }));
    var pgLast = result.pg.rows[result.pg.rows.length - 1], admmLast = result.admm.rows[result.admm.rows.length - 1];
    [
      ["os-point-pg", result.pg.rows.length - 1, pgLast.objective, "PG"],
      ["os-point-admm", result.admm.rows.length - 1, admmLast.objective, "ADMM"]
    ].forEach(function (item) {
      var x = pad + (width - 2 * pad) * (result.pg.rows.length === 1 ? 0 : item[1] / (result.pg.rows.length - 1));
      var y = height - pad - (height - 2 * pad) * ((item[2] - min) / Math.max(EPS, max - min));
      svg.appendChild(svgElement(doc, "circle", { cx: x, cy: y, r: "5", class: item[0] }));
      svg.appendChild(svgElement(doc, "text", { x: x + 8, y: y - 6, class: "os-label" }, item[3]));
    });
    svg.appendChild(svgElement(doc, "text", { x: width - 155, y: optimumY - 7, class: "os-small" }, "F* = " + formatNumber(result.exactObjective, 3)));
    svg.appendChild(svgElement(doc, "text", { x: width - 90, y: height - 12, class: "os-small" }, "iteration k"));
  }
  function renderTable(doc, hostNode, result) {
    var body = element(doc, "tbody", {}), length = Math.max(result.pg.rows.length, result.admm.rows.length);
    for (var i = 0; i < length; i += 1) {
      var pg = result.pg.rows[i], admm = result.admm.rows[i];
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { text: String(i + 1) }),
        element(doc, "td", { text: pg ? formatVector(pg.x) : "—" }),
        element(doc, "td", { text: pg ? formatNumber(pg.objective, 5) : "—" }),
        element(doc, "td", { text: pg ? formatNumber(pg.primalResidual, 5) : "—" }),
        element(doc, "td", { text: "—" }),
        element(doc, "td", { text: admm ? formatVector(admm.z) : "—" }),
        element(doc, "td", { text: admm ? formatNumber(admm.objective, 5) : "—" }),
        element(doc, "td", { text: admm ? formatNumber(admm.primalResidual, 5) : "—" }),
        element(doc, "td", { text: admm ? formatNumber(admm.dualResidual, 5) : "—" })
      ]));
    }
    clear(hostNode); hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "逐步目标、PG mapping 与 ADMM primal/dual residual 账本" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [
        element(doc, "th", { text: "k" }), element(doc, "th", { text: "PG x_k" }), element(doc, "th", { text: "PG F(x)" }), element(doc, "th", { text: "PG 原始：‖Gα‖" }), element(doc, "th", { text: "PG 对偶" }), element(doc, "th", { text: "ADMM z_k" }), element(doc, "th", { text: "ADMM F(z)" }), element(doc, "th", { text: "ADMM 原始：‖x−z‖" }), element(doc, "th", { text: "ADMM 对偶：ρ‖Δz‖" })
      ])]), body
    ]));
  }
  function renderChecks(doc, hostNode, result) {
    var pgLast = result.pg.rows[result.pg.rows.length - 1], admmLast = result.admm.rows[result.admm.rows.length - 1];
    var checks = [
      [near(result.exact[0], 2.25) && near(result.exact[1], -0.75) && near(result.exactObjective, 2.8125), "精确参照：x*=(2.25,−0.75)，F*=2.8125。"],
      [result.pg.assumption, result.pg.assumption ? "PG 步长在 0<α≤1/L 的标准下降读法内。" : "PG 步长超出 0<α≤1/L；不提供标准下降证书。"],
      [result.admm.assumption && result.config.rho > 0, "ADMM ρ>0，且残差分开记录 primal ‖x−z‖ 与 dual ρ‖Δz‖。"],
      [finite(pgLast.primalResidual) && finite(admmLast.primalResidual), "两条有限轨迹的残差都已计算，没有用相邻目标差代替可行性。"],
      [result.config.iterations < 1000, "当前表是有限迭代诊断；它不承担一般收敛证明。"]
    ];
    clear(hostNode); hostNode.appendChild(element(doc, "ul", { className: "os-checks" }, checks.map(function (check) { return element(doc, "li", {}, [element(doc, "span", { className: check[0] ? "os-check-pass" : "os-check-fail", text: check[0] ? "✓" : "×" }), element(doc, "span", { text: check[1] })]); })));
  }
  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "os-" + (++INSTANCE);
    var state = { config: cloneConfig(PRESETS[0]), revealed: false, predictions: {}, feedback: "" };
    var refs = { questions: [] };
    var shell = element(doc, "div", { className: "os-lab" });
    shell.appendChild(element(doc, "h3", { text: "Operator splitting：目标相同，残差各自说话" }));
    shell.appendChild(element(doc, "p", { className: "os-intro", text: "固定二元 quadratic + L1 问题，精确解由软阈值给出；蓝线是 prox-gradient，绿线是 ADMM。" }));
    var prediction = element(doc, "div", {});
    prediction.appendChild(element(doc, "p", { className: "os-intro", text: "先完成步长、残差身份和有限迭代边界的预测。" }));
    questionSpecs(solve({ config: state.config })).forEach(function (spec) {
      var fieldset = element(doc, "fieldset", {}); fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
      var grid = element(doc, "div", { className: "os-choice-grid" }); var questionRef = { key: spec.key, buttons: [] };
      spec.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); });
        questionRef.buttons.push({ value: choice.value, label: choice.label, node: button }); grid.appendChild(button);
      });
      fieldset.appendChild(grid); prediction.appendChild(fieldset); refs.questions.push(questionRef);
    });
    var actions = element(doc, "div", { className: "os-actions" });
    var reveal = element(doc, "button", { type: "button", className: "os-primary", text: "核对预测并揭晓" });
    var reset = element(doc, "button", { type: "button", text: "重置预测" });
    var feedback = element(doc, "p", { className: "os-feedback", "aria-live": "polite" }); actions.appendChild(reveal); actions.appendChild(reset);
    var resultShell = element(doc, "div", { hidden: true });
    var presetSelect = element(doc, "select", { "aria-label": "splitting 预设" }, PRESETS.map(function (preset) { return element(doc, "option", { value: preset.id, text: preset.label }); }));
    var alphaInput = element(doc, "input", { type: "range", min: "0.1", max: "1.8", step: "0.05", value: "0.8", "aria-label": "prox-gradient alpha" });
    var alphaOutput = element(doc, "output", { text: "0.8" });
    var rhoInput = element(doc, "input", { type: "range", min: "0.1", max: "3", step: "0.1", value: "1", "aria-label": "ADMM rho" });
    var rhoOutput = element(doc, "output", { text: "1" });
    var iterationInput = element(doc, "input", { type: "range", min: "4", max: "32", step: "1", value: "12", "aria-label": "iteration count" });
    var iterationOutput = element(doc, "output", { text: "12" });
    var controls = element(doc, "div", { className: "os-controls" }, [
      element(doc, "div", { className: "os-control" }, [element(doc, "label", { text: "预设" }), presetSelect]),
      element(doc, "div", { className: "os-control" }, [element(doc, "label", {}, ["PG α = ", alphaOutput]), alphaInput]),
      element(doc, "div", { className: "os-control" }, [element(doc, "label", {}, ["ADMM ρ = ", rhoOutput]), rhoInput]),
      element(doc, "div", { className: "os-control" }, [element(doc, "label", {}, ["迭代步数 = ", iterationOutput]), iterationInput]),
      element(doc, "p", { className: "os-note", text: "标准 PG 读法用 α≤1/L；ADMM 要求 ρ>0。结果显示后仍可调参数，但每次改动会重新锁门。" })
    ]);
    var svg = svgElement(doc, "svg", { className: "os-svg", viewBox: "0 0 720 340", role: "img", "aria-label": "prox-gradient 与 ADMM 目标轨迹" });
    var frame = element(doc, "div", { className: "os-frame" }, [svg]);
    var metricsHost = element(doc, "div", { className: "os-metrics" });
    var tableHost = element(doc, "div", { className: "os-table-wrap" });
    var checksHost = element(doc, "div");
    var certificateHost = element(doc, "p", { className: "os-certificate" });
    resultShell.appendChild(element(doc, "div", { className: "os-layout" }, [controls, element(doc, "div", { className: "os-stage" }, [frame, metricsHost, tableHost, checksHost, certificateHost])]));
    shell.appendChild(prediction); shell.appendChild(actions); shell.appendChild(feedback); shell.appendChild(resultShell); clear(root); root.appendChild(shell);

    function lockConfig(next) { state.config = cloneConfig(next); state.revealed = false; state.predictions = {}; state.feedback = ""; render(); }
    presetSelect.addEventListener("change", function () { lockConfig(presetById(presetSelect.value)); });
    alphaInput.addEventListener("input", function () { var next = cloneConfig(state.config); next.alpha = Number(alphaInput.value); lockConfig(next); });
    rhoInput.addEventListener("input", function () { var next = cloneConfig(state.config); next.rho = Number(rhoInput.value); lockConfig(next); });
    iterationInput.addEventListener("input", function () { var next = cloneConfig(state.config); next.iterations = Number(iterationInput.value); lockConfig(next); });
    reveal.addEventListener("click", function () {
      var result = solve({ config: state.config }); var specs = questionSpecs(result);
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测。"; render(); return; }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中；现在比较目标与两种残差。"; render(); announce(api, root, state.feedback);
    });
    reset.addEventListener("click", function () { state = { config: cloneConfig(PRESETS[0]), revealed: false, predictions: {}, feedback: "" }; render(); announce(api, root, "splitting 预测与账本已重置。"); });
    function render() {
      var result = solve({ config: state.config });
      presetSelect.value = state.config.id; alphaInput.value = String(state.config.alpha); alphaOutput.textContent = formatNumber(state.config.alpha, 2); rhoInput.value = String(state.config.rho); rhoOutput.textContent = formatNumber(state.config.rho, 2); iterationInput.value = String(state.config.iterations); iterationOutput.textContent = String(state.config.iterations);
      feedback.textContent = state.feedback || ""; feedback.className = "os-feedback" + (state.feedback.indexOf("请先") === 0 ? " os-warn" : ""); renderPredictions(state, refs); resultShell.hidden = !state.revealed; if (!state.revealed) return;
      drawChart(doc, svg, result, uid);
      var pgLast = result.pg.rows[result.pg.rows.length - 1], admmLast = result.admm.rows[result.admm.rows.length - 1];
      var metrics = [metric(doc, "精确 x*"), metric(doc, "精确 F*"), metric(doc, "PG 最后 F"), metric(doc, "PG ‖Gα‖"), metric(doc, "ADMM 最后 F"), metric(doc, "ADMM ‖r‖ / ‖s‖")];
      clear(metricsHost); metrics.forEach(function (item) { metricsHost.appendChild(item.node); }); metrics[0].value.textContent = formatVector(result.exact); metrics[1].value.textContent = formatNumber(result.exactObjective, 5); metrics[2].value.textContent = formatNumber(pgLast.objective, 5); metrics[3].value.textContent = formatNumber(pgLast.primalResidual, 5); metrics[4].value.textContent = formatNumber(admmLast.objective, 5); metrics[5].value.textContent = formatNumber(admmLast.primalResidual, 5) + " / " + formatNumber(admmLast.dualResidual, 5);
      renderTable(doc, tableHost, result); renderChecks(doc, checksHost, result);
      certificateHost.className = "os-certificate" + (result.pg.assumption ? "" : " os-blocked"); certificateHost.textContent = "精确参照为 x*=" + formatVector(result.exact) + "、F*=" + formatNumber(result.exactObjective, 5) + "。PG 的当前 α " + (result.pg.assumption ? "满足" : "不满足") + " 0<α≤1/L 的标准下降读法；ADMM 的当前 ρ=" + formatNumber(state.config.rho, 3) + ">0。表内有限步、目标 gap 和 residual 只是这个 toy 问题的诊断证书，不是一般收敛证明。";
    }
    render();
  }

  return {
    EPS: EPS,
    PROBLEM: PROBLEM,
    PRESETS: PRESETS,
    soft: soft,
    objective: objective,
    exactSolution: exactSolution,
    runProxGradient: runProxGradient,
    runAdmm: runAdmm,
    solve: solve,
    selfTest: selfTest,
    mount: mount
  };
});
