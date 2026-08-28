(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-pde-fem", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-pde-fem self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-pde-fem self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var LAB_ID = "physics-pde-fem";
  var STYLE_ID = "physics-pde-fem-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var PI = Math.PI;
  var DEFAULTS = { N: 16, kappa: 1, amplitude: 1 };

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

  function integer(value, name, minimum, maximum) {
    var number = finite(value, name);
    if (Math.floor(number) !== number || number < minimum || number > maximum) throw new RangeError(name + " must be an integer in range");
    return number;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function normalize(options) {
    options = options || {};
    return {
      N: integer(options.N === undefined ? DEFAULTS.N : options.N, "N", 2, 128),
      kappa: clamp(finite(options.kappa === undefined ? DEFAULTS.kappa : options.kappa, "kappa"), 0.1, 5),
      amplitude: clamp(finite(options.amplitude === undefined ? DEFAULTS.amplitude : options.amplitude, "amplitude"), 0.1, 3)
    };
  }

  function exactTemperature(config, x) {
    return config.amplitude / config.kappa * Math.sin(PI * x);
  }

  function source(config, x) {
    return config.amplitude * PI * PI * Math.sin(PI * x);
  }

  function midpointQuadrature() {
    return [{ xi: 0, weight: 2 }];
  }

  function solveTridiagonal(lower, diagonal, upper, rhs) {
    var n = diagonal.length;
    if (!n) return [];
    var cPrime = Array(Math.max(0, n - 1)).fill(0);
    var dPrime = Array(n).fill(0);
    var minPivot = Infinity;
    var pivot = diagonal[0];
    if (!(pivot > 0)) throw new Error("stiffness matrix is not positive definite");
    minPivot = Math.min(minPivot, pivot);
    if (n > 1) cPrime[0] = upper[0] / pivot;
    dPrime[0] = rhs[0] / pivot;
    for (var i = 1; i < n; i += 1) {
      pivot = diagonal[i] - lower[i - 1] * cPrime[i - 1];
      if (!(pivot > 0)) throw new Error("nonpositive Thomas pivot");
      minPivot = Math.min(minPivot, pivot);
      if (i < n - 1) cPrime[i] = upper[i] / pivot;
      dPrime[i] = (rhs[i] - lower[i - 1] * dPrime[i - 1]) / pivot;
    }
    var solution = Array(n).fill(0);
    solution[n - 1] = dPrime[n - 1];
    for (var j = n - 2; j >= 0; j -= 1) solution[j] = dPrime[j] - cPrime[j] * solution[j + 1];
    return { solution: solution, minPivot: minPivot };
  }

  function solvePde(options) {
    var config = normalize(options);
    var N = config.N;
    var h = 1 / N;
    var interior = N - 1;
    var diagonal = Array(interior).fill(0);
    var lower = Array(Math.max(0, interior - 1)).fill(0);
    var upper = Array(Math.max(0, interior - 1)).fill(0);
    var rhs = Array(interior).fill(0);
    var factor = config.kappa / h;
    var gauss = midpointQuadrature();
    for (var e = 0; e < N; e += 1) {
      var leftNode = e;
      var rightNode = e + 1;
      if (leftNode > 0) diagonal[leftNode - 1] += factor;
      if (rightNode < N) diagonal[rightNode - 1] += factor;
      if (leftNode > 0 && rightNode < N) {
        upper[leftNode - 1] -= factor;
        lower[rightNode - 2] -= factor;
      }
      var a = e * h;
      var midpoint = a + 0.5 * h;
      var half = 0.5 * h;
      gauss.forEach(function (point) {
        var x = midpoint + half * point.xi;
        var leftShape = (e + 1) - x / h;
        var rightShape = x / h - e;
        var weightedSource = source(config, x) * half * point.weight;
        if (leftNode > 0) rhs[leftNode - 1] += weightedSource * leftShape;
        if (rightNode < N) rhs[rightNode - 1] += weightedSource * rightShape;
      });
    }
    var solved = solveTridiagonal(lower, diagonal, upper, rhs);
    var values = [0].concat(solved.solution, [0]);
    var nodes = Array.from({ length: N + 1 }, function (_, index) { return index * h; });
    var exactValues = nodes.map(function (x) { return exactTemperature(config, x); });
    var errors = values.map(function (value, index) { return value - exactValues[index]; });
    var maxError = Math.max.apply(null, errors.map(Math.abs));
    var l2Error = Math.sqrt(h * errors.reduce(function (sum, value) { return sum + value * value; }, 0));
    var energy = 0;
    for (var elementIndex = 0; elementIndex < N; elementIndex += 1) {
      var difference = values[elementIndex + 1] - values[elementIndex];
      energy += config.kappa / h * difference * difference;
    }
    var loadWork = rhs.reduce(function (sum, value, index) { return sum + value * solved.solution[index]; }, 0);
    var residual = [];
    for (var row = 0; row < interior; row += 1) {
      var matrixValue = diagonal[row] * solved.solution[row];
      if (row > 0) matrixValue += lower[row - 1] * solved.solution[row - 1];
      if (row < interior - 1) matrixValue += upper[row] * solved.solution[row + 1];
      residual.push(matrixValue - rhs[row]);
    }
    return {
      config: config,
      N: N,
      h: h,
      nodes: nodes,
      values: values,
      exactValues: exactValues,
      errors: errors,
      maxError: maxError,
      l2Error: l2Error,
      energy: energy,
      loadWork: loadWork,
      energyBalanceError: energy - loadWork,
      residualMax: Math.max.apply(null, residual.map(Math.abs).concat([0])),
      minPivot: solved.minPivot,
      diagonal: diagonal
    };
  }

  function convergenceStudy(options) {
    var config = normalize(options);
    var meshes = [4, 8, 16, 32, 64];
    var previous = null;
    var rows = meshes.map(function (N) {
      var result = solvePde({ N: N, kappa: config.kappa, amplitude: config.amplitude });
      var rate = previous ? Math.log(previous.maxError / result.maxError) / Math.log(2) : null;
      previous = result;
      return { N: N, h: result.h, maxError: result.maxError, l2Error: result.l2Error, rate: rate, balance: Math.abs(result.energyBalanceError), residual: result.residualMax };
    });
    return { rows: rows, finest: solvePde(config) };
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
      '[data-learning-lab="' + LAB_ID + '"]{--pfe-blue:#2563a6;--pfe-green:#18734a;--pfe-orange:#b45309;--pfe-red:#a33b2f;max-width:100%;min-width:0;color:var(--fg,inherit);line-height:1.55}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-note,[data-learning-lab="' + LAB_ID + '"] .pfe-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{margin:11px 0;padding:10px 12px;border:1px solid var(--border,currentColor);border-radius:6px}' +
      '[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] select,[data-learning-lab="' + LAB_ID + '"] input{min-width:0;min-height:44px;font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer;line-height:1.35}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--pfe-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] button[aria-pressed=true],[data-learning-lab="' + LAB_ID + '"] .pfe-primary{background:var(--pfe-blue);border-color:var(--pfe-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible,[data-learning-lab="' + LAB_ID + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.pfe-actions>*{flex:1 1 170px}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-feedback{min-height:2em;margin:7px 0;font-weight:700}.pfe-pass{color:var(--pfe-green)}.pfe-warn{color:var(--pfe-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:15px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-control{display:grid;gap:5px;min-width:0}.pfe-control label{font-size:13px;font-weight:700}.pfe-control output{color:var(--pfe-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] select{width:100%;padding:7px 9px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;accent-color:var(--pfe-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-revealed{margin-top:18px;padding-top:15px;border-top:1px solid var(--border,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-metric{min-width:0;padding:9px;border-top:3px solid var(--pfe-blue);background:var(--bg,Canvas)}.pfe-metric:nth-child(2){border-top-color:var(--pfe-green)}.pfe-metric:nth-child(3){border-top-color:var(--pfe-orange)}.pfe-metric:nth-child(4){border-top-color:var(--pfe-red)}.pfe-metric:nth-child(5){border-top-color:var(--pfe-green)}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}.pfe-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-chart-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.9fr);gap:14px;align-items:start}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-chart-frame{min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;padding:6px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas)}' +
      '[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;color:var(--fg,inherit)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-axis{stroke:currentColor;stroke-opacity:.68}.pfe-grid-line{stroke:var(--border,currentColor);stroke-opacity:.65}.pfe-exact{fill:none;stroke:var(--pfe-blue);stroke-width:3}.pfe-fe{fill:none;stroke:var(--pfe-orange);stroke-width:2.5;stroke-dasharray:6 4}.pfe-error{fill:none;stroke:var(--pfe-green);stroke-width:2.5}.pfe-chart-title{font-size:13px;font-weight:700}.pfe-chart-muted{fill:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .pfe-table-wrap{max-width:100%;overflow-x:auto;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;white-space:nowrap}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
      'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--pfe-blue:#82b6ff;--pfe-green:#79d39a;--pfe-orange:#f0b15a;--pfe-red:#ff9f91}' +
      '@media(max-width:800px){[data-learning-lab="' + LAB_ID + '"] .pfe-chart-grid{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .pfe-choice-grid,[data-learning-lab="' + LAB_ID + '"] .pfe-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .pfe-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){[data-learning-lab="' + LAB_ID + '"] .pfe-chart-frame svg{min-width:520px}[data-learning-lab="' + LAB_ID + '"] .pfe-chart-frame svg text{font-size:22px}[data-learning-lab="' + LAB_ID + '"] .pfe-chart-frame svg .pfe-chart-title{font-size:20px}[data-learning-lab="' + LAB_ID + '"] .pfe-chart-frame svg .pfe-chart-muted{font-size:18px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function drawSolution(doc, svg, result) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 760 420");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "一维稳态热方程有限元解与精确解");
    svg.appendChild(svgElement(doc, "title", {}, "温度场：精确解和有限元解"));
    svg.appendChild(svgElement(doc, "desc", {}, "蓝色实线是解析温度曲线，橙色虚线是线性有限元节点解；两者差异随网格加密减小。"));
    var left = 58;
    var right = 722;
    var top = 42;
    var bottom = 344;
    var yMax = Math.max(1, Math.max.apply(null, result.exactValues.concat(result.values)) * 1.15);
    var x = function (value) { return left + (right - left) * value; };
    var y = function (value) { return bottom - (bottom - top) * value / yMax; };
    [0, 0.5, 1].forEach(function (tick) {
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y(tick * yMax), x2: right, y2: y(tick * yMax), className: "pfe-grid-line" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y(tick * yMax) + 4, className: "pfe-chart-muted", "text-anchor": "end" }, format(tick * yMax, 2)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, className: "pfe-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, className: "pfe-axis" }));
    var exactPath = result.nodes.map(function (value, index) { return (index ? "L" : "M") + x(value).toFixed(2) + " " + y(result.exactValues[index]).toFixed(2); }).join(" ");
    var fePath = result.nodes.map(function (value, index) { return (index ? "L" : "M") + x(value).toFixed(2) + " " + y(result.values[index]).toFixed(2); }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: exactPath, className: "pfe-exact" }));
    svg.appendChild(svgElement(doc, "path", { d: fePath, className: "pfe-fe" }));
    result.nodes.forEach(function (value, index) { svg.appendChild(svgElement(doc, "circle", { cx: x(value), cy: y(result.values[index]), r: 3.5, fill: "var(--pfe-orange)" })); });
    svg.appendChild(svgElement(doc, "text", { x: left, y: top - 13, className: "pfe-chart-title" }, "温度 u(x)：蓝 exact，橙 P1-FE"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 23, className: "pfe-chart-muted", "text-anchor": "end" }, "x / L"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: top + 2, className: "pfe-chart-muted", "text-anchor": "end" }, "κ=" + format(result.config.kappa, 2) + "，N=" + result.N));
  }

  function drawConvergence(doc, svg, study) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 440 300");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "有限元网格收敛图");
    svg.appendChild(svgElement(doc, "title", {}, "网格收敛：最大节点误差"));
    svg.appendChild(svgElement(doc, "desc", {}, "横轴是单元数 N，纵轴是最大节点误差；双对数斜率显示有限元收敛阶。"));
    var left = 52;
    var right = 416;
    var top = 36;
    var bottom = 246;
    var rows = study.rows;
    var maxN = rows[rows.length - 1].N;
    var maxError = Math.max(1e-12, rows[0].maxError * 1.5);
    var minError = Math.max(1e-12, rows[rows.length - 1].maxError * 0.45);
    var x = function (value) { return left + (right - left) * Math.log(value / rows[0].N) / Math.log(maxN / rows[0].N); };
    var y = function (value) { return bottom - (bottom - top) * Math.log(value / minError) / Math.log(maxError / minError); };
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, className: "pfe-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, className: "pfe-axis" }));
    rows.forEach(function (row) {
      svg.appendChild(svgElement(doc, "line", { x1: x(row.N), y1: top, x2: x(row.N), y2: bottom, className: "pfe-grid-line" }));
    });
    svg.appendChild(svgElement(doc, "path", { d: rows.map(function (row, index) { return (index ? "L" : "M") + x(row.N).toFixed(2) + " " + y(row.maxError).toFixed(2); }).join(" "), className: "pfe-error" }));
    rows.forEach(function (row) {
      svg.appendChild(svgElement(doc, "circle", { cx: x(row.N), cy: y(row.maxError), r: 4, fill: "var(--pfe-green)" }));
      svg.appendChild(svgElement(doc, "text", { x: x(row.N), y: bottom + 18, className: "pfe-chart-muted", "text-anchor": "middle" }, String(row.N)));
    });
    svg.appendChild(svgElement(doc, "text", { x: left, y: top - 12, className: "pfe-chart-title" }, "收敛：max |u_h−u|"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 37, className: "pfe-chart-muted", "text-anchor": "end" }, "单元数 N（对数）"));
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "pfe-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function renderTable(doc, hostNode, rows) {
    clear(hostNode);
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "同一物理源项与边界条件；误差随 N 增大应下降，能量账平衡误差接近舍入限。" }));
    var head = element(doc, "tr", {});
    ["单元数 N", "max 误差", "离散 L² 误差", "局部阶", "|能量−载荷功|"].forEach(function (label) { head.appendChild(element(doc, "th", { scope: "col", text: label })); });
    table.appendChild(element(doc, "thead", {}, [head]));
    var body = element(doc, "tbody", {});
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "td", { text: String(row.N) }),
        element(doc, "td", { text: format(row.maxError, 4) }),
        element(doc, "td", { text: format(row.l2Error, 4) }),
        element(doc, "td", { text: row.rate === null ? "-" : format(row.rate, 2) }),
        element(doc, "td", { text: format(row.balance, 3) })
      ]));
    });
    table.appendChild(body);
    hostNode.appendChild(table);
  }

  function mount(rootNode, api) {
    var doc = rootNode && rootNode.ownerDocument;
    if (!doc) return;
    installStyles(doc);
    var prefix = "pfe-" + Math.floor(Math.random() * 1000000);
    var state = { revealed: false, predictions: {}, config: { N: DEFAULTS.N, kappa: DEFAULTS.kappa, amplitude: DEFAULTS.amplitude } };
    var questions = [
      { key: "weak", prompt: "有限元把 −(κu')'=f 变成什么核心问题？", answer: "weak", choices: [{ value: "weak", label: "测试函数下的弱形式" }, { value: "point", label: "每点独立代数式" }, { value: "random", label: "随机游走" }] },
      { key: "refine", prompt: "在光滑解和稳定装配下加密网格，误差通常怎样？", answer: "decrease", choices: [{ value: "increase", label: "必然增大" }, { value: "decrease", label: "按阶数下降" }, { value: "same", label: "完全不变" }] },
      { key: "coercive", prompt: "κ 的哪个物理条件让热传导刚度保持正定？", answer: "positive", choices: [{ value: "positive", label: "κ>0" }, { value: "zero", label: "κ=0" }, { value: "negative", label: "κ<0" }] },
      { key: "energy", prompt: "离散能量 uᵀKu 与载荷功 fᵀu 的关系应怎样？", answer: "equal", choices: [{ value: "equal", label: "解方程时相等" }, { value: "random", label: "没有关系" }, { value: "opposite", label: "总是互为相反数" }] }
    ];
    var gate = element(doc, "section", { className: "pfe-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(doc, "h3", { id: prefix + "-gate-title", text: "预测门：温度曲线之外，还要核对能量账" }));
    gate.appendChild(element(doc, "p", { className: "pfe-note", text: "先判断弱形式、加密趋势、正定条件和离散功率平衡；提交后才显示有限元曲线与收敛研究。" }));
    questions.forEach(function (question) {
      var field = element(doc, "fieldset", {});
      field.appendChild(element(doc, "legend", { text: question.prompt }));
      var choices = element(doc, "div", { className: "pfe-choice-grid", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; question.choices.forEach(function (item) { item.button.setAttribute("aria-pressed", item === choice ? "true" : "false"); }); });
        choice.button = button;
        choices.appendChild(button);
      });
      field.appendChild(choices);
      gate.appendChild(field);
    });
    var actions = element(doc, "div", { className: "pfe-actions" });
    var reveal = element(doc, "button", { type: "button", className: "pfe-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    gate.appendChild(actions);
    var feedback = element(doc, "p", { className: "pfe-feedback", "aria-live": "polite", text: "" });
    gate.appendChild(feedback);

    var stage = element(doc, "section", { className: "pfe-revealed", hidden: true, "aria-labelledby": prefix + "-result-title" });
    stage.appendChild(element(doc, "h4", { id: prefix + "-result-title", text: "揭示实验：解、能量与网格收敛" }));
    stage.appendChild(element(doc, "p", { className: "pfe-note", text: "模型是 −(κu')'=Aπ²sin(πx)，u(0)=u(1)=0；P1 单元、每单元中点载荷积分。κ>0 是热传导正定性的条件。" }));
    var controls = element(doc, "div", { className: "pfe-controls" });
    function rangeControl(label, key, min, max, stepSize, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(stepSize), value: String(state.config[key]), "aria-label": label });
      input.addEventListener("input", function () { state.config[key] = Number(input.value); output.textContent = format(state.config[key], digits); if (state.revealed) renderResult(); });
      return element(doc, "div", { className: "pfe-control" }, [element(doc, "label", {}, [label + " = ", output]), input]);
    }
    controls.appendChild(rangeControl("单元数 N", "N", 4, 64, 4, 0));
    controls.appendChild(rangeControl("导热系数 κ", "kappa", 0.4, 2.5, 0.1, 2));
    controls.appendChild(rangeControl("源项振幅 A", "amplitude", 0.5, 2, 0.1, 2));
    stage.appendChild(controls);
    var metrics = element(doc, "div", { className: "pfe-metrics", "aria-label": "有限元诊断" });
    stage.appendChild(metrics);
    var charts = element(doc, "div", { className: "pfe-chart-grid" });
    var solutionFrame = element(doc, "div", { className: "pfe-chart-frame" });
    var solutionSvg = svgElement(doc, "svg", {});
    solutionFrame.appendChild(solutionSvg);
    var convergenceFrame = element(doc, "div", { className: "pfe-chart-frame" });
    var convergenceSvg = svgElement(doc, "svg", {});
    convergenceFrame.appendChild(convergenceSvg);
    charts.appendChild(solutionFrame);
    charts.appendChild(convergenceFrame);
    stage.appendChild(charts);
    var tableHost = element(doc, "div", { className: "pfe-table-wrap" });
    stage.appendChild(tableHost);
    rootNode.replaceChildren(gate, stage);

    function renderResult() {
      var result = solvePde(state.config);
      var study = convergenceStudy(state.config);
      metrics.replaceChildren(
        metric(doc, "当前 max 误差", format(result.maxError, 4)),
        metric(doc, "离散 L² 误差", format(result.l2Error, 4)),
        metric(doc, "能量 − 载荷功", format(result.energyBalanceError, 3)),
        metric(doc, "最大方程残差", format(result.residualMax, 3)),
        metric(doc, "最小 Thomas pivot", format(result.minPivot, 3))
      );
      drawSolution(doc, solutionSvg, result);
      drawConvergence(doc, convergenceSvg, study);
      renderTable(doc, tableHost, study.rows);
      return result;
    }

    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) { feedback.textContent = "请先完成四个预测。"; feedback.className = "pfe-feedback pfe-warn"; return; }
      state.revealed = true;
      stage.hidden = false;
      var result = renderResult();
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.answer; }).length;
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中；当前能量账差为 " + format(result.energyBalanceError, 3) + "。";
      feedback.className = "pfe-feedback " + (correct === questions.length ? "pfe-pass" : "pfe-warn");
      announce(api, rootNode, feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state.revealed = false;
      state.predictions = {};
      state.config = { N: DEFAULTS.N, kappa: DEFAULTS.kappa, amplitude: DEFAULTS.amplitude };
      controls.querySelectorAll("input[type=range]").forEach(function (input) { var label = input.getAttribute("aria-label"); var key = label === "单元数 N" ? "N" : label === "导热系数 κ" ? "kappa" : "amplitude"; input.value = String(state.config[key]); var output = input.parentNode.querySelector("output"); if (output) output.textContent = format(state.config[key], key === "N" ? 0 : 2); });
      stage.hidden = true;
      feedback.textContent = "已重置；答案与有限元证据再次隐藏。";
      feedback.className = "pfe-feedback";
      questions.forEach(function (question) { question.choices.forEach(function (choice) { choice.button.setAttribute("aria-pressed", "false"); }); });
      announce(api, rootNode, "有限元预测与实验已重置。");
    });
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var result = solvePde({ N: 4, kappa: 1, amplitude: 1 });
    check(result.values[0] === 0 && result.values[result.values.length - 1] === 0, "Dirichlet boundary values");
    check(result.energy > 0 && result.loadWork > 0, "positive physical energy and source work");
    check(Math.abs(result.energyBalanceError) < 1e-10, "discrete energy identity");
    check(result.residualMax < 1e-10, "assembled equations are solved");
    check(result.minPivot > 0, "coercive stiffness has positive pivots");
    check(near(result.exactValues[2], 1, 1e-12) && near(result.exactValues[0], 0, 1e-12), "exact solution chart reference values");
    check(near(result.values[2], 1, 0.03), "N=4 midpoint temperature is close to exact");
    var study = convergenceStudy({ N: 16, kappa: 1, amplitude: 1 });
    check(study.rows.every(function (row, index) { return isFinite(row.maxError) && isFinite(row.l2Error) && (index === 0 || row.maxError < study.rows[index - 1].maxError); }), "mesh refinement lowers every max error");
    check(study.rows[study.rows.length - 1].rate > 1.8 && study.rows[study.rows.length - 1].rate < 2.2, "P1 nodal convergence is second order");
    var base = solvePde({ N: 16, kappa: 1, amplitude: 1 });
    var scaled = solvePde({ N: 16, kappa: 2, amplitude: 1 });
    check(near(scaled.values[8], base.values[8] / 2, 1e-12), "conductivity scaling matches exact solution semantics");
    var repeat = solvePde({ N: 16, kappa: 1, amplitude: 1 });
    check(JSON.stringify(repeat.values) === JSON.stringify(solvePde({ N: 16, kappa: 1, amplitude: 1 }).values), "deterministic FEM solve");
    return { checks: checks };
  }

  return {
    LAB_ID: LAB_ID,
    DEFAULTS: DEFAULTS,
    solvePde: solvePde,
    convergenceStudy: convergenceStudy,
    mount: mount,
    selfTest: selfTest
  };
});
