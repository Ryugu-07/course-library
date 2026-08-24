(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-fem-convergence", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-fem-convergence self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-fem-convergence self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var LAB_ID = "mech-fem-convergence";
  var STYLE_ID = "cl-mech-fem-convergence-styles";
  var INSTANCE = 0;
  var EPS = 1e-12;
  var DEFAULTS = {
    L: 1.2,
    A0: 4e-4,
    taper: 0.5,
    E: 200e9,
    F: 10000,
    n: 4
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    var scale = Math.max(1, Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
  }

  function finiteNumber(value, name) {
    var number = Number(value);
    if (!isFinite(number)) throw new Error(name + " must be finite");
    return number;
  }

  function positive(value, name) {
    var number = finiteNumber(value, name);
    if (!(number > 0)) throw new Error(name + " must be positive");
    return number;
  }

  function integer(value, name, minimum, maximum) {
    var number = finiteNumber(value, name);
    if (Math.floor(number) !== number || number < minimum || number > maximum) throw new Error(name + " must be an integer in range");
    return number;
  }

  function configOf(config) {
    config = config || {};
    var out = {
      L: positive(config.L === undefined ? DEFAULTS.L : config.L, "L"),
      A0: positive(config.A0 === undefined ? DEFAULTS.A0 : config.A0, "A0"),
      taper: finiteNumber(config.taper === undefined ? DEFAULTS.taper : config.taper, "taper"),
      E: positive(config.E === undefined ? DEFAULTS.E : config.E, "E"),
      F: positive(config.F === undefined ? DEFAULTS.F : config.F, "F"),
      n: integer(config.n === undefined ? DEFAULTS.n : config.n, "n", 1, 128)
    };
    if (!(1 + out.taper > 0)) throw new Error("taper must keep the end area positive");
    return out;
  }

  function areaAt(config, x) {
    var c = configOf(config);
    var position = finiteNumber(x, "x");
    if (position < -EPS || position > c.L + EPS) throw new Error("x must be inside the bar");
    return c.A0 * (1 + c.taper * position / c.L);
  }

  function exactDisplacement(config, x) {
    var c = configOf(config);
    var position = finiteNumber(x, "x");
    if (position < -EPS || position > c.L + EPS) throw new Error("x must be inside the bar");
    if (Math.abs(c.taper) < 1e-9) return c.F * position / (c.E * c.A0);
    return c.F * c.L / (c.E * c.A0 * c.taper) * Math.log(1 + c.taper * position / c.L);
  }

  function zeros(size) {
    var matrix = [];
    for (var row = 0; row < size; row += 1) matrix.push(Array(size).fill(0));
    return matrix;
  }

  function assembleStiffness(config, elements) {
    var c = configOf(Object.assign({}, config || {}, { n: elements === undefined ? (config || {}).n : elements }));
    var n = c.n;
    var length = c.L / n;
    var K = zeros(n + 1);
    for (var elementIndex = 0; elementIndex < n; elementIndex += 1) {
      var midpoint = (elementIndex + 0.5) * length;
      var factor = c.E * areaAt(c, midpoint) / length;
      K[elementIndex][elementIndex] += factor;
      K[elementIndex][elementIndex + 1] -= factor;
      K[elementIndex + 1][elementIndex] -= factor;
      K[elementIndex + 1][elementIndex + 1] += factor;
    }
    return { config: c, nodes: Array.from({ length: n + 1 }, function (_, index) { return index * length; }), elementLength: length, K: K, elementCount: n };
  }

  function solveLinearSystem(matrix, rhs) {
    var n = matrix.length;
    var A = matrix.map(function (row, index) { return row.slice().concat([rhs[index]]); });
    for (var rowIndex = 0; rowIndex < n; rowIndex += 1) {
      var pivot = rowIndex;
      for (var candidate = rowIndex + 1; candidate < n; candidate += 1) {
        if (Math.abs(A[candidate][rowIndex]) > Math.abs(A[pivot][rowIndex])) pivot = candidate;
      }
      if (Math.abs(A[pivot][rowIndex]) < EPS) throw new Error("singular stiffness submatrix");
      if (pivot !== rowIndex) { var swap = A[pivot]; A[pivot] = A[rowIndex]; A[rowIndex] = swap; }
      var divisor = A[rowIndex][rowIndex];
      for (var column = rowIndex; column <= n; column += 1) A[rowIndex][column] /= divisor;
      for (var eliminate = 0; eliminate < n; eliminate += 1) {
        if (eliminate === rowIndex) continue;
        var multiplier = A[eliminate][rowIndex];
        if (Math.abs(multiplier) < EPS) continue;
        for (var eliminateColumn = rowIndex; eliminateColumn <= n; eliminateColumn += 1) A[eliminate][eliminateColumn] -= multiplier * A[rowIndex][eliminateColumn];
      }
    }
    return A.map(function (row) { return row[n]; });
  }

  function solveBar(config) {
    var assembly = assembleStiffness(config);
    var c = assembly.config;
    var n = c.n;
    var loads = Array(n + 1).fill(0);
    loads[n] = c.F;
    var freeMatrix = zeros(n);
    var freeRhs = Array(n).fill(0);
    for (var row = 0; row < n; row += 1) {
      freeRhs[row] = loads[row + 1];
      for (var column = 0; column < n; column += 1) freeMatrix[row][column] = assembly.K[row + 1][column + 1];
    }
    var freeDisplacements = solveLinearSystem(freeMatrix, freeRhs);
    var displacements = [0].concat(freeDisplacements);
    var reactions = assembly.K.map(function (row) { return row.reduce(function (sum, value, index) { return sum + value * displacements[index]; }, 0); });
    reactions = reactions.map(function (value, index) { return value - loads[index]; });
    var exact = assembly.nodes.map(function (x) { return exactDisplacement(c, x); });
    var errors = displacements.map(function (value, index) { return value - exact[index]; });
    var maxError = Math.max.apply(null, errors.map(Math.abs));
    var elementRows = [];
    for (var elementIndex = 0; elementIndex < n; elementIndex += 1) {
      var midpoint = (assembly.nodes[elementIndex] + assembly.nodes[elementIndex + 1]) / 2;
      var strain = (displacements[elementIndex + 1] - displacements[elementIndex]) / assembly.elementLength;
      elementRows.push({
        index: elementIndex + 1,
        xMid: midpoint,
        area: areaAt(c, midpoint),
        strain: strain,
        stress: c.E * strain,
        exactStress: c.F / areaAt(c, midpoint)
      });
    }
    return {
      config: c,
      nodes: assembly.nodes,
      elementLength: assembly.elementLength,
      K: assembly.K,
      loads: loads,
      displacements: displacements,
      exactDisplacements: exact,
      errors: errors,
      maxError: maxError,
      tipDisplacement: displacements[n],
      exactTipDisplacement: exact[n],
      relativeTipError: Math.abs(errors[n]) / Math.max(EPS, Math.abs(exact[n])),
      reactions: reactions,
      equilibriumResidual: reactions.reduce(function (sum, value) { return sum + value; }, 0) + c.F,
      elementRows: elementRows
    };
  }

  function convergence(config, meshes) {
    var c = configOf(config);
    var list = meshes || [1, 2, 4, 8, 16, 32];
    return list.map(function (n) {
      var result = solveBar(Object.assign({}, c, { n: n }));
      return { n: n, maxError: result.maxError, relativeTipError: result.relativeTipError, tipDisplacement: result.tipDisplacement, exactTipDisplacement: result.exactTipDisplacement, reaction: result.reactions[0], equilibriumResidual: result.equilibriumResidual };
    });
  }

  function formatNumber(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (places === 0) return value.toFixed(0);
    if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 5));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] === undefined || attrs[key] === null) return;
      if (key === "text") node.textContent = String(attrs[key]);
      else if (key === "className") node.setAttribute("class", attrs[key]);
      else if (key === "htmlFor") node.setAttribute("for", attrs[key]);
      else node.setAttribute(key, String(attrs[key]));
    });
    (children || []).forEach(function (child) {
      if (child !== null && child !== undefined) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  function svgText(doc, parent, text, x, y, className) {
    var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mfc-muted" });
    node.textContent = text;
    parent.appendChild(node);
  }

  function pathFor(rows, x0, x1, y0, y1, valueKey, maximum) {
    return rows.map(function (row, index) {
      var x = x0 + (x1 - x0) * Math.log(row.n) / Math.log(32);
      var value = Math.max(0, row[valueKey]);
      var y = y1 - (y1 - y0) * value / maximum;
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
  }

  function drawSvg(doc, svg, result, convergenceRows) {
    clear(svg);
    var width = 700;
    var height = 430;
    var rows = convergenceRows;
    var maxError = Math.max.apply(null, rows.map(function (row) { return row.maxError; }).concat([1e-14]));
    var errorScale = maxError > EPS ? maxError * 1.1 : 1e-12;
    var left = 60;
    var right = 650;
    var top = 42;
    var bottom = 176;
    var bottomPlotTop = 260;
    var bottomPlotBottom = 382;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "一维变截面杆有限元网格收敛与位移形状");
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", opacity: 0.65 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", opacity: 0.65 }));
    svg.appendChild(svgElement(doc, "path", { d: pathFor(rows, left, right, top, bottom, "maxError", errorScale), fill: "none", stroke: "var(--mfc-blue)", "stroke-width": 3 }));
    rows.forEach(function (row) {
      var x = left + (right - left) * Math.log(row.n) / Math.log(32);
      var y = bottom - (bottom - top) * row.maxError / errorScale;
      svg.appendChild(svgElement(doc, "circle", { cx: x, cy: y, r: 4, fill: "var(--mfc-blue)" }));
      svgText(doc, svg, String(row.n), x - 5, bottom + 20, "mfc-muted");
    });
    svgText(doc, svg, "max |u_h-u_exact|（节点误差）", left + 12, top + 16, "mfc-blue");
    svgText(doc, svg, "单元数 n", right - 44, bottom + 20, "mfc-muted");
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottomPlotBottom, x2: right, y2: bottomPlotBottom, stroke: "currentColor", opacity: 0.65 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottomPlotTop, x2: left, y2: bottomPlotBottom, stroke: "currentColor", opacity: 0.65 }));
    var exactPath = result.nodes.map(function (x, index) {
      var px = left + (right - left) * x / result.config.L;
      var py = bottomPlotBottom - (bottomPlotBottom - bottomPlotTop) * result.exactDisplacements[index] / Math.max(EPS, result.exactTipDisplacement);
      return (index ? "L" : "M") + px.toFixed(2) + " " + py.toFixed(2);
    }).join(" ");
    var numericalPath = result.displacements.map(function (value, index) {
      var px = left + (right - left) * result.nodes[index] / result.config.L;
      var py = bottomPlotBottom - (bottomPlotBottom - bottomPlotTop) * value / Math.max(EPS, result.exactTipDisplacement);
      return (index ? "L" : "M") + px.toFixed(2) + " " + py.toFixed(2);
    }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: exactPath, fill: "none", stroke: "var(--mfc-green)", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "path", { d: numericalPath, fill: "none", stroke: "var(--mfc-orange)", "stroke-width": 2, "stroke-dasharray": "5 4" }));
    svgText(doc, svg, "位移形状：绿 exact，橙 FE", left + 12, bottomPlotTop + 16, "mfc-green");
    svgText(doc, svg, "x/L", right - 18, bottomPlotBottom + 20, "mfc-muted");
  }

  function renderTable(doc, hostNode, headings, rows, minWidth) {
    clear(hostNode);
    var table = element(doc, "table", {});
    if (minWidth) table.style.minWidth = minWidth;
    var head = element(doc, "tr", {});
    headings.forEach(function (heading) { head.appendChild(element(doc, "th", { scope: "col", text: heading })); });
    table.appendChild(element(doc, "thead", {}, [head]));
    var body = element(doc, "tbody", {});
    rows.forEach(function (row) {
      var tr = element(doc, "tr", {});
      row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); });
      body.appendChild(tr);
    });
    table.appendChild(body);
    hostNode.appendChild(table);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "mfc-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function injectStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--mfc-blue:#1d4ed8;--mfc-green:#18734a;--mfc-orange:#b45309;--mfc-warn:#a33b2f;color:var(--fg,inherit);max-width:100%;min-width:0;line-height:1.55}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}' +
      '[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-note,[data-learning-lab="' + LAB_ID + '"] .mfc-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.65}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-prediction{padding:12px 14px;border-left:4px solid var(--mfc-orange);background:var(--block-bg,transparent)}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{border:1px solid var(--border,currentColor);border-radius:6px;margin:12px 0;padding:10px 12px}' +
      '[data-learning-lab="' + LAB_ID + '"] legend{padding:0 4px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-options{display:grid;gap:6px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--mfc-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{min-height:44px;font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=number],[data-learning-lab="' + LAB_ID + '"] select{width:100%;padding:7px 9px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
      '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 13px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--mfc-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-primary{background:var(--mfc-blue);border-color:var(--mfc-blue);color:#fff}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-controls{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin:16px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-control{display:grid;gap:5px;min-width:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-control label{font-weight:700;font-size:13px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-control small{color:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-error{min-height:1.6em;color:var(--mfc-warn);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:16px;align-items:start}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-chart{min-width:0;border:1px solid var(--border,currentColor);border-radius:6px;padding:7px;background:var(--bg,Canvas)}' +
      '[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;aspect-ratio:700/430;color:var(--fg,inherit)}' +
      '[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mfc-blue{fill:var(--mfc-blue);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mfc-green{fill:var(--mfc-green);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mfc-muted{fill:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-metric{min-width:0;padding:9px;border-top:3px solid var(--mfc-blue);background:var(--bg,Canvas)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfc-table-wrap{max-width:100%;overflow-x:auto}' +
      '[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:450px;border-collapse:collapse;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top}' +
      '[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
      'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--mfc-blue:#7aa7ff;--mfc-green:#79d39a;--mfc-orange:#f0b15a;--mfc-warn:#ff9f91}' +
      '@media(max-width:760px){[data-learning-lab="' + LAB_ID + '"] .mfc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mfc-grid{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mfc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
      '@media(max-width:390px){[data-learning-lab="' + LAB_ID + '"] .mfc-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mfc-actions>*{width:100%}[data-learning-lab="' + LAB_ID + '"] .mfc-metrics{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mfc-prediction{padding:10px}}' +
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function predictionQuestion(doc, uid, question, name, choices) {
    var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: question })]);
    var options = element(doc, "div", { className: "mfc-options" });
    choices.forEach(function (choice) {
      var inputId = uid + "-" + name + "-" + choice.value;
      var input = element(doc, "input", { type: "radio", id: inputId, name: uid + "-" + name, value: choice.value });
      options.appendChild(element(doc, "label", { htmlFor: inputId }, [input, element(doc, "span", { text: choice.label })]));
    });
    fieldset.appendChild(options);
    return fieldset;
  }

  function selected(form, name) {
    var input = form.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : "";
  }

  function inputControl(doc, uid, key, label, value, min, max, step, unit) {
    var id = uid + "-" + key;
    var input = element(doc, "input", { id: id, type: "number", min: min, max: max, step: step, value: value, "data-key": key });
    return { key: key, input: input, node: element(doc, "div", { className: "mfc-control" }, [element(doc, "label", { htmlFor: id, text: label }), input, element(doc, "small", { text: unit })]) };
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    injectStyles(doc);
    INSTANCE += 1;
    var uid = LAB_ID + "-" + INSTANCE;
    var state = { revealed: false };
    clear(root);
    root.setAttribute("aria-labelledby", uid + "-heading");
    var heading = element(doc, "h3", { id: uid + "-heading", text: "一维杆单元组装与网格收敛" });
    var intro = element(doc, "p", { className: "mfc-note", text: "先预测，再揭示 K、位移、反力和解析误差。默认采用面积沿长度线性变化的轴向杆，线性两节点单元用单元平均面积组装。" });
    var form = element(doc, "form", { className: "mfc-prediction" });
    form.appendChild(predictionQuestion(doc, uid, "对变截面杆，单元数 n 加倍后，节点位移误差通常怎样变化？", "mesh", [
      { value: "down", label: "下降并向解析解收敛" },
      { value: "up", label: "上升，因为自由度更多" },
      { value: "same", label: "保持完全不变" }
    ]));
    form.appendChild(predictionQuestion(doc, uid, "左端固定、右端施加 F 时，固定端反力的符号应如何读？", "reaction", [
      { value: "balance", label: "约为 -F，与外载荷相抵，和为零" },
      { value: "same", label: "约为 +F，与外载荷同向" },
      { value: "mesh", label: "网格越细就越不确定" }
    ]));
    form.appendChild(predictionQuestion(doc, uid, "杆单元的刚度矩阵从哪里来？", "stiffness", [
      { value: "assembly", label: "ke=(E A_e/le)[[1,-1],[-1,1]]，再按节点装配" },
      { value: "force", label: "直接把位移乘一个经验系数" },
      { value: "stress", label: "只由末端应力云图读取" }
    ]));
    var feedback = element(doc, "p", { className: "mfc-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
    form.appendChild(element(doc, "div", { className: "mfc-actions" }, [
      element(doc, "button", { type: "submit", className: "mfc-primary", text: "提交预测并揭示" }),
      element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
    ]));
    form.appendChild(feedback);
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(form);

    var bench = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "mfc-controls" });
    var fields = [
      inputControl(doc, uid, "n", "单元数 n", 4, 1, 32, 1, "个"),
      inputControl(doc, uid, "L", "杆长 L", 1.2, 0.1, 10, 0.1, "m"),
      inputControl(doc, uid, "A0", "左端面积 A0", 400, 1, 10000, 1, "mm^2"),
      inputControl(doc, uid, "taper", "面积斜率 taper", 0.5, -0.8, 3, 0.05, "A(L)=A0(1+taper)"),
      inputControl(doc, uid, "E", "弹性模量 E", 200, 1, 400, 1, "GPa"),
      inputControl(doc, uid, "F", "末端载荷 F", 10, 0.001, 1000, 1, "kN")
    ];
    fields.forEach(function (field) { controls.appendChild(field.node); });
    bench.appendChild(controls);
    var error = element(doc, "p", { className: "mfc-error", role: "alert", "aria-live": "polite" });
    bench.appendChild(error);
    var grid = element(doc, "div", { className: "mfc-grid" });
    var chart = element(doc, "div", { className: "mfc-chart" });
    var svg = svgElement(doc, "svg", {});
    chart.appendChild(svg);
    var ledger = element(doc, "div", { className: "mfc-table-wrap" });
    grid.appendChild(chart);
    grid.appendChild(ledger);
    bench.appendChild(grid);
    var metrics = element(doc, "div", { className: "mfc-metrics" });
    bench.appendChild(metrics);
    bench.appendChild(element(doc, "h4", { text: "网格收敛与解析误差" }));
    var convergenceHost = element(doc, "div", { className: "mfc-table-wrap" });
    bench.appendChild(convergenceHost);
    root.appendChild(bench);

    function uiConfig() {
      var values = {};
      fields.forEach(function (field) {
        var raw = field.input.value.trim();
        if (!raw) throw new Error(field.key + " 不能为空");
        var value = Number(raw);
        if (!isFinite(value)) throw new Error(field.key + " 必须是有限数字");
        var min = Number(field.input.getAttribute("min"));
        var max = Number(field.input.getAttribute("max"));
        if (value < min || value > max) throw new Error(field.key + " 超出允许范围");
        if (field.key === "n" && Math.floor(value) !== value) throw new Error("n 必须是整数");
        values[field.key] = value;
      });
      return { n: Math.round(values.n), L: values.L, A0: values.A0 * 1e-6, taper: values.taper, E: values.E * 1e9, F: values.F * 1000 };
    }

    function renderMatrixPreview(result) {
      var size = Math.min(5, result.K.length);
      var rows = [];
      for (var row = 0; row < size; row += 1) {
        rows.push(["K[" + row + ",0..]"].concat(result.K[row].slice(0, size).map(function (value) { return formatNumber(value, 2); })));
      }
      return rows;
    }

    function renderBench() {
      if (!state.revealed) return;
      try {
        var config = uiConfig();
        var result = solveBar(config);
        var rows = convergence(config);
        error.textContent = "";
        drawSvg(doc, svg, result, rows);
        clear(metrics);
        metrics.appendChild(metric(doc, "DOF", String(result.displacements.length)));
        metrics.appendChild(metric(doc, "u(L)", formatNumber(result.tipDisplacement * 1000, 5) + " mm"));
        metrics.appendChild(metric(doc, "解析误差", formatNumber(result.maxError * 1e6, 5) + " um"));
        metrics.appendChild(metric(doc, "R(0)", formatNumber(result.reactions[0], 3) + " N"));
        metrics.appendChild(metric(doc, "平衡余量", formatNumber(result.equilibriumResidual, 6) + " N"));
        var matrixRows = renderMatrixPreview(result);
        renderTable(doc, ledger, ["K 组装预览", "0", "1", "2", "3", "4"], matrixRows);
        var ledgerNote = element(doc, "p", { className: "mfc-note", text: "每个单元 ke=(E A_mid/le)[[1,-1],[-1,1]]；上表显示 K 左上角，实际矩阵为 " + result.K.length + " x " + result.K.length + "。" });
        ledger.appendChild(ledgerNote);
        renderTable(doc, convergenceHost, ["n", "max |误差| (m)", "相对 tip 误差", "u_h(L) (mm)", "R(0) (N)", "平衡余量 (N)"], rows.map(function (row) {
          return [String(row.n), formatNumber(row.maxError, 8), formatNumber(row.relativeTipError * 100, 5) + "%", formatNumber(row.tipDisplacement * 1000, 6), formatNumber(row.reaction, 3), formatNumber(row.equilibriumResidual, 7)];
        }));
      } catch (validationError) {
        error.textContent = "输入校验：" + validationError.message;
        clear(metrics); clear(ledger); clear(convergenceHost); clear(svg);
      }
    }

    fields.forEach(function (field) {
      field.input.addEventListener("input", renderBench);
      field.input.addEventListener("change", renderBench);
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var answers = {
        mesh: selected(form, uid + "-mesh"),
        reaction: selected(form, uid + "-reaction"),
        stiffness: selected(form, uid + "-stiffness")
      };
      if (!answers.mesh || !answers.reaction || !answers.stiffness) {
        feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
        return;
      }
      state.revealed = true;
      bench.hidden = false;
      var correct = (answers.mesh === "down" ? 1 : 0) + (answers.reaction === "balance" ? 1 : 0) + (answers.stiffness === "assembly" ? 1 : 0);
      feedback.textContent = "已揭示：" + correct + "/3 命中。现在改变网格和变截面参数，查看收敛、反力平衡与解析解的差距。";
      renderBench();
      announce(api, root, "有限元预测已揭示，刚度组装和收敛账本已显示。");
    });
    form.querySelector('[data-reset="true"]').addEventListener("click", function () {
      form.reset();
      state = { revealed: false };
      bench.hidden = true;
      feedback.textContent = "结果尚未揭示。";
      var defaults = { n: 4, L: 1.2, A0: 400, taper: 0.5, E: 200, F: 10 };
      fields.forEach(function (field) { field.input.value = defaults[field.key]; });
      error.textContent = "";
      clear(metrics); clear(ledger); clear(convergenceHost); clear(svg);
      announce(api, root, "有限元实验已重置，预测结果再次隐藏。");
    });
    announce(api, root, "有限元实验已加载；先完成三项预测。");
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var uniform = solveBar({ L: 1, A0: 1e-3, taper: 0, E: 100e9, F: 1000, n: 1 });
    check(near(uniform.tipDisplacement, 1000 * 1 / (100e9 * 1e-3), 1e-10), "uniform bar exact tip displacement");
    check(uniform.maxError < 1e-12, "uniform linear bar is exact at nodes");
    check(near(uniform.reactions[0], -1000, 1e-10), "fixed reaction balances load");
    check(Math.abs(uniform.equilibriumResidual) < 1e-8, "global equilibrium residual");
    var coarse = solveBar({ L: 1.2, A0: 4e-4, taper: 0.5, E: 200e9, F: 10000, n: 1 });
    var fine = solveBar({ L: 1.2, A0: 4e-4, taper: 0.5, E: 200e9, F: 10000, n: 16 });
    check(coarse.maxError > fine.maxError, "tapered bar converges under refinement");
    var assembly = assembleStiffness(DEFAULTS, 4);
    check(assembly.K.length === 5, "assembled matrix dimension");
    check(assembly.K.every(function (row, rowIndex) { return row.every(function (value, columnIndex) { return near(value, assembly.K[columnIndex][rowIndex], 1e-12); }); }), "assembled stiffness is symmetric");
    check(near(assembly.K[2].reduce(function (sum, value) { return sum + value; }, 0), 0, 1e-10), "interior stiffness row sums to zero");
    check(convergence(DEFAULTS).length === 6, "convergence ledger mesh count");
    var invalidCaught = false;
    try { solveBar({ L: 1, A0: 1, taper: -1, E: 1, F: 1, n: 1 }); } catch (error) { invalidCaught = true; }
    check(invalidCaught, "nonpositive end area is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: DEFAULTS,
    configOf: configOf,
    areaAt: areaAt,
    exactDisplacement: exactDisplacement,
    assembleStiffness: assembleStiffness,
    solveLinearSystem: solveLinearSystem,
    solveBar: solveBar,
    convergence: convergence,
    mount: mount,
    selfTest: selfTest
  };
});
