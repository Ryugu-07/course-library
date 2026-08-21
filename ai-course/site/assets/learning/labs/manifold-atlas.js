(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("manifold-atlas", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
    try {
      var report = exported.selfTest();
      console.log("manifold-atlas self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("manifold-atlas self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "manifold-atlas-lab-styles";
  var EPSILON = 1e-9;
  var INSTANCE = 0;

  var PRESETS = [
    {
      id: "circle",
      label: "圆 S¹：两张卡",
      kind: "circle",
      parameter: 1,
      expected: "full-rank",
      question: "在两张圆图的重叠区，转移 Jacobian 的秩应是多少？",
      options: [["full-rank", "满秩 1"], ["rank-drop", "掉到 0"]]
    },
    {
      id: "sphere",
      label: "球面 S²：两张卡",
      kind: "sphere",
      parameter: 1,
      expected: "full-rank",
      question: "在球面两张图的重叠区，转移 Jacobian 的秩应是多少？",
      options: [["full-rank", "满秩 2"], ["rank-drop", "掉到 1 或 0"]]
    },
    {
      id: "cone",
      label: "锥面：level 0 的边界",
      kind: "cone",
      parameter: 0,
      expected: "not-regular",
      question: "对 F(x,y,z)=x²+y²−z²，0 是正则值吗？",
      options: [["regular", "是，正则值"], ["not-regular", "否，条件失败"]]
    }
  ];

  var STYLE_TEXT = [
    ".ma-lab{--ma-blue:var(--cl-blue,#315f9d);--ma-green:var(--cl-green,#39734d);--ma-gold:var(--cl-gold,#9b6a12);--ma-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".ma-lab *,.ma-lab *::before,.ma-lab *::after{box-sizing:border-box}.ma-lab [hidden]{display:none!important}.ma-lab h3,.ma-lab h4{margin:0;letter-spacing:0;color:var(--fg,#292722)}.ma-lab h3{font-size:1.12rem}.ma-lab h4{font-size:1rem}.ma-lab p{margin:8px 0}.ma-lab .ma-note,.ma-lab .ma-feedback{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".ma-lab button{font:inherit;min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ma-lab button:hover{border-color:var(--ma-blue)}.ma-lab button:focus-visible,.ma-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ma-lab button[aria-pressed=true],.ma-lab .ma-primary{border-color:var(--ma-blue);background:var(--ma-blue);color:var(--bg,#fff);font-weight:750}.ma-lab .ma-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0 14px}.ma-lab .ma-presets button{font-size:12px}.ma-lab .ma-control{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;margin:10px 0;padding:9px 11px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.ma-lab .ma-control label{font-size:12.5px;font-weight:700}.ma-lab .ma-control output{color:var(--ma-blue);font-variant-numeric:tabular-nums}.ma-lab input[type=range]{grid-column:1/-1;width:100%;height:44px;margin:0;accent-color:var(--ma-blue)}",
    ".ma-lab .ma-predict{margin-top:12px;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.ma-lab .ma-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.ma-lab .ma-choice-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.ma-lab .ma-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.ma-lab .ma-actions>*{flex:1 1 160px}.ma-lab .ma-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.ma-lab .ma-pass{color:var(--ma-green)}.ma-lab .ma-warn{color:var(--ma-red)}",
    ".ma-lab .ma-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.ma-lab .ma-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:11px 0}.ma-lab .ma-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.ma-lab .ma-metric:nth-child(4n+1){border-color:var(--ma-blue)}.ma-lab .ma-metric:nth-child(4n+2){border-color:var(--ma-green)}.ma-lab .ma-metric:nth-child(4n+3){border-color:var(--ma-gold)}.ma-lab .ma-metric:nth-child(4n){border-color:var(--ma-red)}.ma-lab .ma-metric span{display:block;color:var(--fg-soft,var(--muted,#6b6557));font-size:11px;line-height:1.4}.ma-lab .ma-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ma-lab .ma-visual{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.ma-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#292722)}.ma-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ma-lab .ma-axis{stroke:currentColor;stroke-opacity:.55;stroke-width:1.1}.ma-lab .ma-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1}.ma-lab .ma-curve{fill:none;stroke:var(--ma-blue);stroke-width:2.4}.ma-lab .ma-point{fill:var(--ma-gold);stroke:var(--bg,#fff);stroke-width:1.5}.ma-lab .ma-tangent{stroke:var(--ma-green);stroke-width:2.4;stroke-linecap:round}.ma-lab .ma-singular{fill:var(--ma-red);stroke:var(--bg,#fff);stroke-width:1.5}.ma-lab .ma-chart-line{stroke:var(--ma-blue);stroke-width:2;stroke-dasharray:6 4}.ma-lab .ma-panel-title{font-size:13px;font-weight:750}.ma-lab .ma-small{font-size:11px;fill:var(--fg-soft,var(--muted,#6b6557))}",
    ".ma-lab .ma-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:13px}.ma-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ma-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.ma-lab th,.ma-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.ma-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.ma-lab .ma-check{margin-top:11px;padding:8px 10px;border-left:3px solid var(--ma-green);background:var(--block-bg,var(--bg,#fff));font-size:12.5px}.ma-lab .ma-check.ma-fail{border-color:var(--ma-red)}",
    "@media(max-width:760px){.ma-lab .ma-presets{grid-template-columns:minmax(0,1fr)}.ma-lab .ma-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.ma-lab .ma-summary,.ma-lab .ma-choice-row{grid-template-columns:minmax(0,1fr)}.ma-lab .ma-visual{padding:4px}.ma-lab th,.ma-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.ma-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function fail(message) {
    throw new Error("manifold-atlas: " + message);
  }

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function normSquared(vector) {
    return vector.reduce(function (sum, value) { return sum + value * value; }, 0);
  }

  function circleFromNorth(u) {
    if (!finite(u)) fail("circle north coordinate must be finite");
    var d = 1 + u * u;
    return [2 * u / d, (u * u - 1) / d];
  }

  function circleNorthCoordinate(point) {
    if (!point || point.length !== 2 || Math.abs(1 - point[1]) < EPSILON) fail("point is outside the north circle chart");
    return point[0] / (1 - point[1]);
  }

  function circleFromSouth(v) {
    if (!finite(v)) fail("circle south coordinate must be finite");
    var d = 1 + v * v;
    return [2 * v / d, (1 - v * v) / d];
  }

  function circleSouthCoordinate(point) {
    if (!point || point.length !== 2 || Math.abs(1 + point[1]) < EPSILON) fail("point is outside the south circle chart");
    return point[0] / (1 + point[1]);
  }

  function circleTransition(u) {
    if (!finite(u) || Math.abs(u) < EPSILON) fail("circle transition needs a nonzero overlap coordinate");
    return 1 / u;
  }

  function circleTransitionJacobian(u) {
    if (!finite(u) || Math.abs(u) < EPSILON) fail("circle transition Jacobian needs a nonzero coordinate");
    return [[-1 / (u * u)]];
  }

  function sphereFromNorth(coordinates) {
    if (!coordinates || coordinates.length !== 2 || !coordinates.every(finite)) fail("sphere north coordinates must be a finite pair");
    var r2 = normSquared(coordinates);
    var d = 1 + r2;
    return [2 * coordinates[0] / d, 2 * coordinates[1] / d, (r2 - 1) / d];
  }

  function sphereNorthCoordinate(point) {
    if (!point || point.length !== 3 || Math.abs(1 - point[2]) < EPSILON) fail("point is outside the north sphere chart");
    return [point[0] / (1 - point[2]), point[1] / (1 - point[2])];
  }

  function sphereFromSouth(coordinates) {
    if (!coordinates || coordinates.length !== 2 || !coordinates.every(finite)) fail("sphere south coordinates must be a finite pair");
    var r2 = normSquared(coordinates);
    var d = 1 + r2;
    return [2 * coordinates[0] / d, 2 * coordinates[1] / d, (1 - r2) / d];
  }

  function sphereSouthCoordinate(point) {
    if (!point || point.length !== 3 || Math.abs(1 + point[2]) < EPSILON) fail("point is outside the south sphere chart");
    return [point[0] / (1 + point[2]), point[1] / (1 + point[2])];
  }

  function sphereTransition(coordinates) {
    var r2 = normSquared(coordinates || []);
    if (!coordinates || coordinates.length !== 2 || !coordinates.every(finite) || r2 < EPSILON) fail("sphere transition needs a nonzero overlap coordinate");
    return [coordinates[0] / r2, coordinates[1] / r2];
  }

  function sphereTransitionJacobian(coordinates) {
    var u = coordinates || [];
    var r2 = normSquared(u);
    if (u.length !== 2 || !u.every(finite) || r2 < EPSILON) fail("sphere transition Jacobian needs a nonzero coordinate");
    var r4 = r2 * r2;
    return [
      [1 / r2 - 2 * u[0] * u[0] / r4, -2 * u[0] * u[1] / r4],
      [-2 * u[1] * u[0] / r4, 1 / r2 - 2 * u[1] * u[1] / r4]
    ];
  }

  function matrixRank(matrix, tolerance) {
    var rows = matrix.length;
    var columns = rows ? matrix[0].length : 0;
    var copy = matrix.map(function (row) { return row.slice(); });
    var rank = 0;
    var threshold = tolerance === undefined ? 1e-8 : tolerance;
    for (var column = 0; column < columns && rank < rows; column += 1) {
      var pivot = rank;
      for (var candidate = rank + 1; candidate < rows; candidate += 1) {
        if (Math.abs(copy[candidate][column]) > Math.abs(copy[pivot][column])) pivot = candidate;
      }
      if (Math.abs(copy[pivot][column]) <= threshold) continue;
      var swap = copy[rank];
      copy[rank] = copy[pivot];
      copy[pivot] = swap;
      for (var row = rank + 1; row < rows; row += 1) {
        var factor = copy[row][column] / copy[rank][column];
        for (var entry = column; entry < columns; entry += 1) copy[row][entry] -= factor * copy[rank][entry];
      }
      rank += 1;
    }
    return rank;
  }

  function circlePlotMapping(sourceCoordinate, targetCoordinate) {
    var source = Number(sourceCoordinate);
    var target = Number(targetCoordinate);
    if (!finite(source) || !finite(target)) fail("circle plot coordinates must be finite");
    var extent = Math.max(1, Math.abs(source), Math.abs(target));
    var scale = 104 / extent;
    return {
      center: 540,
      scale: scale,
      sourceX: 540 + source * scale,
      targetX: 540 + target * scale
    };
  }

  function determinant2(matrix) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  }

  function normalize(vector) {
    var length = Math.sqrt(normSquared(vector));
    return length < EPSILON ? vector.map(function () { return 0; }) : vector.map(function (value) { return value / length; });
  }

  function cross(left, right) {
    return [left[1] * right[2] - left[2] * right[1], left[2] * right[0] - left[0] * right[2], left[0] * right[1] - left[1] * right[0]];
  }

  function tangentBasis(normal) {
    var reference = Math.abs(normal[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
    var first = normalize(cross(normal, reference));
    var second = normalize(cross(normal, first));
    return [first, second];
  }

  function regularValueLedger(kind) {
    var name;
    var level;
    var rows;
    if (kind === "circle") {
      name = "F(x,y)=x²+y²";
      level = 1;
      rows = [[1, 0], [0, 1], [-1, 0]].map(function (point) {
        return { point: point, jacobian: [[2 * point[0], 2 * point[1]]], value: 1, targetDimension: 1 };
      });
    } else if (kind === "sphere") {
      name = "F(x,y,z)=x²+y²+z²";
      level = 1;
      rows = [[1, 0, 0], [0, 1, 0], [0, 0, -1]].map(function (point) {
        return { point: point, jacobian: [[2 * point[0], 2 * point[1], 2 * point[2]]], value: 1, targetDimension: 1 };
      });
    } else {
      name = "F(x,y,z)=x²+y²−z²";
      level = 0;
      rows = [[0, 0, 0], [1, 0, 1]].map(function (point) {
        return { point: point, jacobian: [[2 * point[0], 2 * point[1], -2 * point[2]]], value: 0, targetDimension: 1 };
      });
    }
    rows.forEach(function (row) {
      row.rank = matrixRank(row.jacobian);
      row.fullRank = row.rank === row.targetDimension;
      row.jacobianKernelDimension = row.point.length - row.rank;
      row.tangentSpaceDimension = row.fullRank ? row.jacobianKernelDimension : null;
    });
    return {
      functionName: name,
      level: level,
      targetDimension: 1,
      rows: rows,
      regularValue: rows.every(function (row) { return row.fullRank; }),
      sampled: true
    };
  }

  function analyze(id, parameter) {
    var preset = PRESETS.filter(function (item) { return item.id === id; })[0];
    if (!preset) fail("unknown preset " + id);
    var value = parameter === undefined ? preset.parameter : Number(parameter);
    if (!finite(value)) value = preset.parameter;
    var result = { preset: preset, kind: preset.kind, expected: preset.expected, regular: regularValueLedger(preset.kind) };
    if (preset.kind === "circle") {
      if (Math.abs(value) < 0.2) value = value < 0 ? -0.2 : 0.2;
      var circlePoint = circleFromNorth(value);
      var circleTransitionValue = circleSouthCoordinate(circlePoint);
      result.parameter = value;
      result.embeddingPoint = circlePoint;
      result.chart = {
        sourceName: "φ_N",
        targetName: "φ_S",
        sourceCoordinate: value,
        targetCoordinate: circleTransitionValue,
        formula: "v=1/u",
        jacobian: circleTransitionJacobian(value),
        rank: matrixRank(circleTransitionJacobian(value))
      };
      result.tangent = {
        point: circlePoint,
        jacobian: [[2 * circlePoint[0], 2 * circlePoint[1]]],
        rank: 1,
        basis: [[-circlePoint[1], circlePoint[0]]],
        jacobianKernelDimension: 1,
        tangentSpaceDimension: 1
      };
    } else if (preset.kind === "sphere") {
      var sphereSource = [value, 0.75];
      var spherePoint = sphereFromNorth(sphereSource);
      var sphereTarget = sphereSouthCoordinate(spherePoint);
      var sphereJacobian = sphereTransitionJacobian(sphereSource);
      result.parameter = value;
      result.embeddingPoint = spherePoint;
      result.chart = {
        sourceName: "φ_N",
        targetName: "φ_S",
        sourceCoordinate: sphereSource,
        targetCoordinate: sphereTarget,
        formula: "v=u/||u||²",
        jacobian: sphereJacobian,
        determinant: determinant2(sphereJacobian),
        rank: matrixRank(sphereJacobian)
      };
      result.tangent = {
        point: spherePoint,
        jacobian: [[2 * spherePoint[0], 2 * spherePoint[1], 2 * spherePoint[2]]],
        rank: 1,
        basis: tangentBasis(spherePoint),
        jacobianKernelDimension: 2,
        tangentSpaceDimension: 2
      };
    } else {
      result.parameter = 0;
      result.embeddingPoint = [0, 0, 0];
      result.chart = null;
      result.tangent = {
        point: [0, 0, 0],
        jacobian: [[0, 0, 0]],
        rank: 0,
        basis: null,
        jacobianKernelDimension: 3,
        tangentSpaceDimension: null,
        status: "undefined-at-cone-apex",
        ordinaryPoint: { point: [1, 0, 1], tangentSpaceDimension: 2 }
      };
    }
    return result;
  }

  function fixed(value, digits) {
    return Number(value).toFixed(digits === undefined ? 3 : digits);
  }

  function vectorText(vector) {
    return "(" + vector.map(function (value) { return fixed(value, 3); }).join(", ") + ")";
  }

  function matrixText(matrix) {
    return matrix.map(function (row) { return "[" + row.map(function (value) { return fixed(value, 3); }).join(", ") + "]"; }).join("; ");
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) fail("self-test failed: " + message);
    }
    var circlePoint = circleFromNorth(1);
    check(Math.abs(circlePoint[0] - 1) < EPSILON && Math.abs(circlePoint[1]) < EPSILON, "circle chart at u=1");
    check(Math.abs(circleSouthCoordinate(circlePoint) - 1) < EPSILON, "circle chart round trip");
    check(Math.abs(circleTransition(2) - 0.5) < EPSILON, "circle transition formula");
    check(matrixRank(circleTransitionJacobian(2)) === 1, "circle transition rank");
    var circle = analyze("circle", 1);
    check(circle.chart.rank === 1 && circle.tangent.rank === 1, "circle ledger ranks");
    check(circle.regular.regularValue, "circle level one is sampled regular");
    var sphereSource = [2, -1];
    var spherePoint = sphereFromNorth(sphereSource);
    var sphereRoundTrip = sphereNorthCoordinate(spherePoint);
    check(Math.abs(sphereRoundTrip[0] - 2) < EPSILON && Math.abs(sphereRoundTrip[1] + 1) < EPSILON, "sphere north chart round trip");
    var sphereTarget = sphereSouthCoordinate(spherePoint);
    check(Math.abs(sphereTarget[0] - 0.4) < EPSILON && Math.abs(sphereTarget[1] + 0.2) < EPSILON, "sphere transition formula");
    var sphereJacobian = sphereTransitionJacobian([1, 0]);
    check(Math.abs(determinant2(sphereJacobian) + 1) < EPSILON, "sphere transition determinant");
    check(matrixRank(sphereJacobian) === 2, "sphere transition rank");
    var sphere = analyze("sphere", 1);
    check(sphere.chart.rank === 2 && sphere.tangent.rank === 1, "sphere chart and tangent ranks");
    check(sphere.regular.regularValue, "sphere level one is sampled regular");
    var cone = analyze("cone");
    check(!cone.regular.regularValue, "cone level zero is not regular");
    check(cone.regular.rows[0].rank === 0 && cone.regular.rows[1].rank === 1, "cone rank failure is localized at apex");
    check(cone.regular.rows[1].tangentSpaceDimension === 2, "cone ordinary point has a two-dimensional tangent space");
    check(cone.tangent.tangentSpaceDimension === null && cone.tangent.jacobianKernelDimension === 3, "cone apex only exposes the Jacobian kernel");
    var circlePlot = circlePlotMapping(0.2, 5);
    check(circlePlot.sourceX > 430 && circlePlot.targetX < 650, "circle plot endpoints stay inside the view");
    PRESETS.forEach(function (preset) { check(analyze(preset.id).preset.id === preset.id, preset.id + " is analyzable"); });
    return { ok: true, checks: checks, presets: PRESETS.length };
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

  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "ma-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function manifoldSvg(doc, report, serial) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 720 300", role: "img", "aria-label": "嵌入示意与内在坐标转移示意" });
    svg.appendChild(svgElement(doc, "title", {}, report.kind === "cone" ? "锥面 level set 的秩失败" : "嵌入图与坐标图分栏"));
    svg.appendChild(svgElement(doc, "defs", {}, svgElement(doc, "marker", { id: "ma-arrow-" + serial, markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: "auto" }, svgElement(doc, "path", { d: "M0,0 L8,4 L0,8 z", fill: "var(--ma-green)" }))));
    svg.appendChild(svgElement(doc, "line", { x1: 360, y1: 18, x2: 360, y2: 282, className: "ma-axis" }));
    svg.appendChild(svgElement(doc, "text", { x: 180, y: 25, "text-anchor": "middle", className: "ma-panel-title" }, "嵌入图：外部画面"));
    svg.appendChild(svgElement(doc, "text", { x: 540, y: 25, "text-anchor": "middle", className: "ma-panel-title" }, "内在图：坐标与转移"));
    if (report.kind === "circle") {
      svg.appendChild(svgElement(doc, "circle", { cx: 180, cy: 145, r: 82, className: "ma-curve" }));
      var cp = report.embeddingPoint;
      var cx = 180 + cp[0] * 82;
      var cy = 145 - cp[1] * 82;
      svg.appendChild(svgElement(doc, "circle", { cx: cx, cy: cy, r: 7, className: "ma-point" }));
      svg.appendChild(svgElement(doc, "line", { x1: cx - cp[1] * 42, y1: cy + cp[0] * 42, x2: cx + cp[1] * 42, y2: cy - cp[0] * 42, className: "ma-tangent", "marker-end": "url(#ma-arrow-" + serial + ")" }));
      svg.appendChild(svgElement(doc, "text", { x: 180, y: 260, "text-anchor": "middle", className: "ma-small" }, "点 p 与切向方向来自嵌入后的画面"));
      svg.appendChild(svgElement(doc, "line", { x1: 420, y1: 145, x2: 665, y2: 145, className: "ma-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: 542, y1: 65, x2: 542, y2: 225, className: "ma-grid" }));
      var circlePlot = circlePlotMapping(report.chart.sourceCoordinate, report.chart.targetCoordinate);
      svg.appendChild(svgElement(doc, "circle", { cx: circlePlot.sourceX, cy: 145, r: 7, className: "ma-point" }));
      svg.appendChild(svgElement(doc, "circle", { cx: circlePlot.targetX, cy: 190, r: 7, className: "ma-point" }));
      svg.appendChild(svgElement(doc, "text", { x: 425, y: 132, className: "ma-small" }, "u=" + fixed(report.chart.sourceCoordinate, 2)));
      svg.appendChild(svgElement(doc, "text", { x: 425, y: 207, className: "ma-small" }, "v=" + fixed(report.chart.targetCoordinate, 2)));
      svg.appendChild(svgElement(doc, "line", { x1: circlePlot.sourceX, y1: 145, x2: circlePlot.targetX, y2: 190, className: "ma-chart-line" }));
      svg.appendChild(svgElement(doc, "text", { x: 540, y: 260, "text-anchor": "middle", className: "ma-small" }, "重叠区转移：" + report.chart.formula));
    } else if (report.kind === "sphere") {
      svg.appendChild(svgElement(doc, "ellipse", { cx: 180, cy: 145, rx: 92, ry: 78, className: "ma-curve" }));
      svg.appendChild(svgElement(doc, "ellipse", { cx: 180, cy: 145, rx: 92, ry: 20, className: "ma-grid" }));
      var sp = report.embeddingPoint;
      var sx = 180 + sp[0] * 92;
      var sy = 145 - sp[2] * 78;
      svg.appendChild(svgElement(doc, "circle", { cx: sx, cy: sy, r: 7, className: "ma-point" }));
      svg.appendChild(svgElement(doc, "line", { x1: sx, y1: sy, x2: sx + 34, y2: sy - 14, className: "ma-tangent", "marker-end": "url(#ma-arrow-" + serial + ")" }));
      svg.appendChild(svgElement(doc, "text", { x: 180, y: 260, "text-anchor": "middle", className: "ma-small" }, "椭圆只是 S² 的二维投影草图，不是坐标定义"));
      svg.appendChild(svgElement(doc, "line", { x1: 420, y1: 145, x2: 660, y2: 145, className: "ma-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: 540, y1: 55, x2: 540, y2: 235, className: "ma-axis" }));
      svg.appendChild(svgElement(doc, "circle", { cx: 540 + report.chart.sourceCoordinate[0] * 32, cy: 145 - report.chart.sourceCoordinate[1] * 32, r: 7, className: "ma-point" }));
      svg.appendChild(svgElement(doc, "circle", { cx: 540 + report.chart.targetCoordinate[0] * 32, cy: 205 - report.chart.targetCoordinate[1] * 32, r: 7, className: "ma-point" }));
      svg.appendChild(svgElement(doc, "text", { x: 425, y: 95, className: "ma-small" }, "u=" + vectorText(report.chart.sourceCoordinate)));
      svg.appendChild(svgElement(doc, "text", { x: 425, y: 215, className: "ma-small" }, "v=" + vectorText(report.chart.targetCoordinate)));
      svg.appendChild(svgElement(doc, "text", { x: 540, y: 260, "text-anchor": "middle", className: "ma-small" }, "转移：" + report.chart.formula + "，rank=" + report.chart.rank));
    } else {
      svg.appendChild(svgElement(doc, "line", { x1: 85, y1: 225, x2: 180, y2: 65, className: "ma-curve" }));
      svg.appendChild(svgElement(doc, "line", { x1: 275, y1: 225, x2: 180, y2: 65, className: "ma-curve" }));
      svg.appendChild(svgElement(doc, "line", { x1: 85, y1: 225, x2: 275, y2: 225, className: "ma-curve" }));
      svg.appendChild(svgElement(doc, "circle", { cx: 180, cy: 65, r: 8, className: "ma-singular" }));
      svg.appendChild(svgElement(doc, "text", { x: 180, y: 260, "text-anchor": "middle", className: "ma-small" }, "锥尖：dF=0，level 0 不能由正则值定理认证"));
      svg.appendChild(svgElement(doc, "text", { x: 540, y: 130, "text-anchor": "middle", className: "ma-small" }, "没有全局坐标卡可供转移"));
      svg.appendChild(svgElement(doc, "text", { x: 540, y: 158, "text-anchor": "middle", className: "ma-small" }, "先查每个 level-set 点的 rank"));
    }
    return svg;
  }

  function regularTable(doc, report) {
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: report.regular.functionName + " = " + report.regular.level + "：在抽样点检查 dF、ker dF 与切空间条件" }));
    var head = element(doc, "tr");
    ["点 p", "dF_p（Jacobian）", "rank", "目标维数", "ker dF 维数", "切空间维数", "正则？"].forEach(function (label) { head.appendChild(element(doc, "th", { scope: "col", text: label })); });
    table.appendChild(element(doc, "thead", {}, head));
    var body = element(doc, "tbody");
    report.regular.rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "td", { text: vectorText(row.point) }),
        element(doc, "td", { text: matrixText(row.jacobian) }),
        element(doc, "td", { text: String(row.rank) }),
        element(doc, "td", { text: String(row.targetDimension) }),
        element(doc, "td", { text: String(row.jacobianKernelDimension) }),
        element(doc, "td", { className: row.tangentSpaceDimension === null ? "ma-warn" : "", text: row.tangentSpaceDimension === null ? "未定义" : String(row.tangentSpaceDimension) }),
        element(doc, "td", { className: row.fullRank ? "" : "ma-warn", text: row.fullRank ? "是" : "否" })
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    rootNode.classList.add("ma-lab");
    INSTANCE += 1;
    var serial = INSTANCE;
    var state = { presetId: PRESETS[0].id, parameter: PRESETS[0].parameter, prediction: null, revealed: false };
    var announce = function (message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); };

    function render() {
      var report = analyze(state.presetId, state.parameter);
      var preset = report.preset;
      var focusedId = doc.activeElement && doc.activeElement.id;
      var shell = element(doc, "div", { className: "ma-shell" });
      shell.appendChild(element(doc, "h3", { text: "流形图册账本：转移、切向与秩" }));
      shell.appendChild(element(doc, "p", { className: "ma-note", text: "先把内在坐标转移与外部嵌入画面分开，再检查 dF 的 rank。图形是可读的线索，表格才是本实验的判据。" }));
      var presets = element(doc, "div", { className: "ma-presets", role: "group", "aria-label": "选择流形模型" });
      PRESETS.forEach(function (item) {
        var button = element(doc, "button", { type: "button", "aria-pressed": item.id === state.presetId ? "true" : "false", "aria-label": "载入" + item.label }, item.label);
        button.addEventListener("click", function () {
          state.presetId = item.id;
          state.parameter = item.parameter;
          state.prediction = null;
          state.revealed = false;
          render();
          announce("已载入" + item.label + "；请先预测 rank 或正则性。");
        });
        presets.appendChild(button);
      });
      shell.appendChild(presets);
      shell.appendChild(element(doc, "p", { className: "ma-note", text: preset.kind === "circle" ? "u 是北极点图 φ_N 的一维坐标；u=0.2 作为滑杆的最小绝对值，避免落到图册接缝。" : preset.kind === "sphere" ? "滑杆改变北极点图中的 u₁，u₂ 固定为 0.75；这是重叠区的一条可复算切片。" : "锥面普通点的切空间是二维；锥尖只报告 ker dF，不能把它称为切空间。" }));
      if (preset.kind !== "cone") {
        var control = element(doc, "div", { className: "ma-control" });
        control.appendChild(element(doc, "label", { for: "ma-coordinate-" + serial, text: preset.kind === "circle" ? "图坐标 u" : "球面图坐标 u₁" }));
        control.appendChild(element(doc, "output", { for: "ma-coordinate-" + serial, text: fixed(report.parameter, 2) }));
        var input = element(doc, "input", { id: "ma-coordinate-" + serial, type: "range", min: "-2", max: "2", step: "0.1", value: String(report.parameter), "aria-label": preset.kind === "circle" ? "调整圆图坐标 u" : "调整球面图坐标 u₁" });
        input.addEventListener("input", function () {
          var next = Number(input.value);
          if (preset.kind === "circle" && Math.abs(next) < 0.2) next = next < 0 ? -0.2 : 0.2;
          state.parameter = next;
          state.prediction = null;
          state.revealed = false;
          render();
        });
        control.appendChild(input);
        shell.appendChild(control);
      }
      var predict = element(doc, "fieldset", { className: "ma-predict" });
      predict.appendChild(element(doc, "legend", { text: preset.question }));
      var choices = element(doc, "div", { className: "ma-choice-row", role: "group", "aria-label": "预测选项" });
      preset.options.forEach(function (option) {
        var button = element(doc, "button", { type: "button", "aria-pressed": state.prediction === option[0] ? "true" : "false" }, option[1]);
        button.addEventListener("click", function () { state.prediction = option[0]; render(); });
        choices.appendChild(button);
      });
      predict.appendChild(choices);
      var actions = element(doc, "div", { className: "ma-actions" });
      var reveal = element(doc, "button", { type: "button", className: "ma-primary", text: "核对预测" });
      reveal.addEventListener("click", function () {
        if (!state.prediction) { announce("请先选择一个预测。"); return; }
        state.revealed = true;
        render();
        announce("预测已核对；现在可以阅读转移与 rank 账本。");
      });
      var reset = element(doc, "button", { type: "button", text: "重置实验" });
      reset.addEventListener("click", function () {
        state = { presetId: PRESETS[0].id, parameter: PRESETS[0].parameter, prediction: null, revealed: false };
        render();
        announce("流形实验已重置。");
      });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      predict.appendChild(actions);
      predict.appendChild(element(doc, "p", { className: "ma-feedback " + (state.revealed ? (state.prediction === preset.expected ? "ma-pass" : "ma-warn") : ""), "aria-live": "polite", text: state.revealed ? (state.prediction === preset.expected ? "预测命中。" : "预测未命中；请看 rank 列和锥尖行。") : state.prediction ? "预测已记录；点击“核对预测”。" : "尚未作出预测。" }));
      shell.appendChild(predict);
      if (state.revealed) {
        var results = element(doc, "section", { className: "ma-results", "aria-live": "polite" });
        results.appendChild(element(doc, "h4", { text: "分栏可视化与 rank ledger" }));
        results.appendChild(element(doc, "div", { className: "ma-visual" }, manifoldSvg(doc, report, serial)));
        var summary = element(doc, "div", { className: "ma-summary" });
        summary.appendChild(metric(doc, "模型", preset.kind === "circle" ? "S¹" : preset.kind === "sphere" ? "S²" : "cone"));
        summary.appendChild(metric(doc, "转移 Jacobian 秩", report.chart ? String(report.chart.rank) : "没有图册转移"));
        summary.appendChild(metric(doc, "切空间维数", report.tangent.tangentSpaceDimension === null ? "锥尖未定义" : String(report.tangent.tangentSpaceDimension)));
        summary.appendChild(metric(doc, "ker dF 维数", String(report.tangent.jacobianKernelDimension)));
        summary.appendChild(metric(doc, "level 0/1 正则？", report.regular.regularValue ? "抽样通过" : "失败（锥尖）"));
        results.appendChild(summary);
        if (report.chart) {
          results.appendChild(element(doc, "p", { className: "ma-note", text: report.kind === "circle" ? "内在转移 v=1/u 的 Jacobian 是 [-1/u²]；它描述两张一维坐标的换算，不是圆在平面中的切线。" : "内在转移 v=u/||u||² 的 Jacobian 在非零 u 上可逆；它描述两张二维坐标的换算，不是椭圆投影的导数。" }));
        }
        results.appendChild(element(doc, "div", { className: "ma-table-wrap" }, regularTable(doc, report)));
        results.appendChild(element(doc, "p", { className: "ma-check " + (report.regular.regularValue ? "" : "ma-fail"), text: report.regular.regularValue ? "表中每个抽样点都满足 rank dF = dim(target)；对圆/球面还可由梯度在整个 level set 上非零直接证明。" : "锥尖一行给出 dF=0；普通点的 ker dF 是二维切空间，但锥尖的切空间未定义，只能报告三维 Jacobian kernel。" }));
        shell.appendChild(results);
      }
      rootNode.replaceChildren(shell);
      if (focusedId) {
        var replacement = doc.getElementById(focusedId);
        if (replacement && typeof replacement.focus === "function") replacement.focus();
      }
    }
    render();
  }

  return {
    PRESETS: PRESETS,
    circleFromNorth: circleFromNorth,
    circleFromSouth: circleFromSouth,
    circleNorthCoordinate: circleNorthCoordinate,
    circleSouthCoordinate: circleSouthCoordinate,
    circleTransition: circleTransition,
    circleTransitionJacobian: circleTransitionJacobian,
    sphereFromNorth: sphereFromNorth,
    sphereFromSouth: sphereFromSouth,
    sphereNorthCoordinate: sphereNorthCoordinate,
    sphereSouthCoordinate: sphereSouthCoordinate,
    sphereTransition: sphereTransition,
    sphereTransitionJacobian: sphereTransitionJacobian,
    matrixRank: matrixRank,
    circlePlotMapping: circlePlotMapping,
    regularValueLedger: regularValueLedger,
    analyze: analyze,
    selfTest: selfTest,
    mount: mount
  };
});
