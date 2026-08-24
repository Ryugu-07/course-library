(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-state-space-reachability", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-state-space-reachability self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-state-space-reachability self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var LAB_ID = "auto-state-space-reachability";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-state-space-reachability-styles";
    var EPS = 1e-10;
    var DEFAULTS = {
      b2: 0.7,
      c2: 0.6,
      epsilon: 0.5,
      steps: 14
    };
    var A = [[0.82, 0], [0, 0.45]];

    var STYLE_TEXT = [
      '[data-learning-lab="auto-state-space-reachability"]{--ssr-blue:var(--cl-blue,#315f9d);--ssr-orange:var(--cl-gold,#9b6a12);--ssr-green:var(--cl-green,#39734d);--ssr-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-state-space-reachability"] *{box-sizing:border-box}[data-learning-lab="auto-state-space-reachability"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-state-space-reachability"] h3,[data-learning-lab="auto-state-space-reachability"] h4{margin:0;letter-spacing:0}[data-learning-lab="auto-state-space-reachability"] h3{font-size:1.16rem}[data-learning-lab="auto-state-space-reachability"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-state-space-reachability"] p{margin:8px 0}[data-learning-lab="auto-state-space-reachability"] .ssr-note,[data-learning-lab="auto-state-space-reachability"] .ssr-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-state-space-reachability"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-state-space-reachability"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-state-space-reachability"] .ssr-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-state-space-reachability"] button,[data-learning-lab="auto-state-space-reachability"] input,[data-learning-lab="auto-state-space-reachability"] select{font:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-state-space-reachability"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-state-space-reachability"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-state-space-reachability"] button[aria-pressed="true"],[data-learning-lab="auto-state-space-reachability"] .ssr-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-state-space-reachability"] button:focus-visible,[data-learning-lab="auto-state-space-reachability"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-state-space-reachability"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-state-space-reachability"] .ssr-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-state-space-reachability"] .ssr-actions>*{flex:1 1 170px}[data-learning-lab="auto-state-space-reachability"] .ssr-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-state-space-reachability"] .ssr-correct{color:var(--ssr-green)}[data-learning-lab="auto-state-space-reachability"] .ssr-wrong{color:var(--ssr-red)}',
      '[data-learning-lab="auto-state-space-reachability"] .ssr-layout{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-state-space-reachability"] .ssr-controls,[data-learning-lab="auto-state-space-reachability"] .ssr-stage{min-width:0}[data-learning-lab="auto-state-space-reachability"] .ssr-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-state-space-reachability"] .ssr-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-state-space-reachability"] .ssr-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-state-space-reachability"] .ssr-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-state-space-reachability"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-state-space-reachability"] .ssr-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-state-space-reachability"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-state-space-reachability"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-state-space-reachability"] .ssr-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-state-space-reachability"] .ssr-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-state-space-reachability"] .ssr-x1{fill:none;stroke:var(--ssr-blue);stroke-width:2.8}[data-learning-lab="auto-state-space-reachability"] .ssr-x2{fill:none;stroke:var(--ssr-orange);stroke-width:2.5}[data-learning-lab="auto-state-space-reachability"] .ssr-y{fill:none;stroke:var(--ssr-green);stroke-width:1.8;stroke-dasharray:6 4}[data-learning-lab="auto-state-space-reachability"] .ssr-label{font-size:11px}[data-learning-lab="auto-state-space-reachability"] .ssr-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-state-space-reachability"] .ssr-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-state-space-reachability"] .ssr-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-state-space-reachability"] .ssr-metric:nth-child(3n+1){border-color:var(--ssr-blue)}[data-learning-lab="auto-state-space-reachability"] .ssr-metric:nth-child(3n+2){border-color:var(--ssr-orange)}[data-learning-lab="auto-state-space-reachability"] .ssr-metric:nth-child(3n){border-color:var(--ssr-green)}[data-learning-lab="auto-state-space-reachability"] .ssr-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-state-space-reachability"] .ssr-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-state-space-reachability"] .ssr-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-state-space-reachability"] table{width:100%;min-width:720px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-state-space-reachability"] th,[data-learning-lab="auto-state-space-reachability"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-state-space-reachability"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-state-space-reachability"] .ssr-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--ssr-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="auto-state-space-reachability"] .ssr-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-state-space-reachability"] .ssr-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-state-space-reachability"] .ssr-stage-frame{padding:4px}[data-learning-lab="auto-state-space-reachability"] table{font-size:10.8px}[data-learning-lab="auto-state-space-reachability"] th,[data-learning-lab="auto-state-space-reachability"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-state-space-reachability"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

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
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
        return value.toExponential(Math.min(places, 4));
      }
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function normalizeConfig(input) {
      var source = input || {};
      var b2 = finite(source.b2 === undefined ? DEFAULTS.b2 : source.b2, "b2");
      var c2 = finite(source.c2 === undefined ? DEFAULTS.c2 : source.c2, "c2");
      var epsilon = finite(source.epsilon === undefined ? DEFAULTS.epsilon : source.epsilon, "epsilon");
      var steps = Math.round(finite(source.steps === undefined ? DEFAULTS.steps : source.steps, "steps"));
      if (b2 < 0 || b2 > 1.2) throw new RangeError("b2 must be in [0, 1.2]");
      if (c2 < 0 || c2 > 1.2) throw new RangeError("c2 must be in [0, 1.2]");
      if (epsilon < 0.02 || epsilon > 1) throw new RangeError("epsilon must be in [0.02, 1]");
      if (steps < 8 || steps > 24) throw new RangeError("steps must be in [8, 24]");
      return { b2: b2, c2: c2, epsilon: epsilon, steps: steps };
    }

    function matVec(matrix, vector) {
      return [
        matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
        matrix[1][0] * vector[0] + matrix[1][1] * vector[1]
      ];
    }

    function matMul(left, right) {
      return [
        [
          left[0][0] * right[0][0] + left[0][1] * right[1][0],
          left[0][0] * right[0][1] + left[0][1] * right[1][1]
        ],
        [
          left[1][0] * right[0][0] + left[1][1] * right[1][0],
          left[1][0] * right[0][1] + left[1][1] * right[1][1]
        ]
      ];
    }

    function det2(matrix) {
      return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }

    function rank2(matrix) {
      var scale = Math.max(
        Math.abs(matrix[0][0]),
        Math.abs(matrix[0][1]),
        Math.abs(matrix[1][0]),
        Math.abs(matrix[1][1])
      );
      if (scale <= EPS) return 0;
      if (Math.abs(det2(matrix)) > 1e-8 * Math.max(1, scale * scale)) return 2;
      return 1;
    }

    function condition2(matrix) {
      var a = matrix[0][0];
      var b = matrix[0][1];
      var c = matrix[1][0];
      var d = matrix[1][1];
      var trace = a * a + b * b + c * c + d * d;
      var determinant = det2(matrix);
      var discriminant = Math.max(0, trace * trace - 4 * determinant * determinant);
      var root = Math.sqrt(discriminant);
      var largest = Math.sqrt(Math.max(0, (trace + root) / 2));
      var smallest = Math.sqrt(Math.max(0, (trace - root) / 2));
      return smallest <= EPS ? Infinity : largest / smallest;
    }

    function inputAt(step) {
      if (step < 3) return 1;
      if (step < 6) return -0.6;
      if (step < 10) return 0.35;
      return 0;
    }

    function coordinateTransform(epsilon) {
      return [[1, 1], [0, epsilon]];
    }

    function inverseTransform(epsilon) {
      return [[1, -1 / epsilon], [0, 1 / epsilon]];
    }

    function runExperiment(input) {
      var config = normalizeConfig(input);
      var B = [[1], [config.b2]];
      var C = [[1, config.c2]];
      var AB = matVec(A, [B[0][0], B[1][0]]);
      var controllability = [[B[0][0], AB[0]], [B[1][0], AB[1]]];
      var observability = [[C[0][0], C[0][1]], [C[0][0] * A[0][0] + C[0][1] * A[1][0], C[0][0] * A[0][1] + C[0][1] * A[1][1]]];
      var transform = coordinateTransform(config.epsilon);
      var inverse = inverseTransform(config.epsilon);
      var transformedA = matMul(matMul(inverse, A), transform);
      var transformedB = matVec(inverse, [B[0][0], B[1][0]]);
      var transformedC = [[C[0][0] * transform[0][0] + C[0][1] * transform[1][0], C[0][0] * transform[0][1] + C[0][1] * transform[1][1]]];
      var transformedAB = matVec(transformedA, transformedB);
      var transformedControllability = [[transformedB[0], transformedAB[0]], [transformedB[1], transformedAB[1]]];
      var transformedObservability = [[transformedC[0][0], transformedC[0][1]], [transformedC[0][0] * transformedA[0][0] + transformedC[0][1] * transformedA[1][0], transformedC[0][0] * transformedA[0][1] + transformedC[0][1] * transformedA[1][1]]];
      var x = [0, 0];
      var rows = [];
      for (var k = 0; k < config.steps; k += 1) {
        var u = inputAt(k);
        var y = C[0][0] * x[0] + C[0][1] * x[1];
        var z = matVec(inverse, x);
        rows.push({ k: k, u: u, x1: x[0], x2: x[1], y: y, z1: z[0], z2: z[1] });
        x = [A[0][0] * x[0] + B[0][0] * u, A[1][1] * x[1] + B[1][0] * u];
      }
      var maxZ = 0;
      rows.forEach(function (row) {
        maxZ = Math.max(maxZ, Math.abs(row.z1), Math.abs(row.z2));
      });
      return {
        config: config,
        A: [[A[0][0], A[0][1]], [A[1][0], A[1][1]]],
        B: B,
        C: C,
        controllability: controllability,
        observability: observability,
        transformed: {
          A: transformedA,
          B: transformedB,
          C: transformedC,
          controllability: transformedControllability,
          observability: transformedObservability
        },
        rows: rows,
        metrics: {
          detControllability: det2(controllability),
          detObservability: det2(observability),
          rankControllability: rank2(controllability),
          rankObservability: rank2(observability),
          transformedRankControllability: rank2(transformedControllability),
          transformedRankObservability: rank2(transformedObservability),
          conditionTransform: condition2(transform),
          maxTransformedState: maxZ,
          transformDeterminant: det2(transform)
        }
      };
    }

    function element(doc, tag, attributes, children) {
      var node = doc.createElement(tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function svgElement(doc, tag, attributes, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function installStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function announce(api, rootNode, message) {
      if (api && typeof api.announce === "function") api.announce(rootNode, message);
    }

    function linePath(rows, key, mapX, mapY) {
      return rows.map(function (row, index) {
        return (index ? "L" : "M") + mapX(row.k).toFixed(2) + " " + mapY(row[key]).toFixed(2);
      }).join(" ");
    }

    function drawSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 360;
      var left = 48;
      var right = 17;
      var top = 30;
      var bottom = 38;
      var values = [];
      result.rows.forEach(function (row) { values.push(row.x1, row.x2, row.y); });
      var minValue = Math.min.apply(null, values);
      var maxValue = Math.max.apply(null, values);
      var pad = Math.max(0.25, (maxValue - minValue) * 0.16);
      var yMin = minValue - pad;
      var yMax = maxValue + pad;
      var xMax = Math.max(1, result.rows.length - 1);
      var mapX = function (value) { return left + value / xMax * (width - left - right); };
      var mapY = function (value) { return top + (yMax - value) / (yMax - yMin) * (height - top - bottom); };
      svg.appendChild(svgElement(doc, "title", {}, "二状态系统的状态响应与输出"));
      svg.appendChild(svgElement(doc, "desc", {}, "蓝线为 x1，橙线为 x2，绿虚线为测量输出 y；输入序列固定，因此改变参数可重复比较。"));
      for (var i = 0; i <= 4; i += 1) {
        var y = top + (height - top - bottom) * i / 4;
        var value = yMax - (yMax - yMin) * i / 4;
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: "ssr-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: y + 4, "text-anchor": "end", class: "ssr-small" }, formatNumber(value, 2)));
      }
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: height - bottom, x2: width - right, y2: height - bottom, class: "ssr-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, class: "ssr-axis" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows, "x1", mapX, mapY), class: "ssr-x1" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows, "x2", mapX, mapY), class: "ssr-x2" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows, "y", mapX, mapY), class: "ssr-y" }));
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + 13, class: "ssr-label" }, "状态响应：x1 / x2 / y"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 9, "text-anchor": "end", class: "ssr-small" }, "采样 k"));
      svg.appendChild(svgElement(doc, "text", { x: left + 86, y: top + 13, class: "ssr-small" }, "x1"));
      svg.appendChild(svgElement(doc, "text", { x: left + 112, y: top + 13, class: "ssr-small" }, "x2"));
      svg.appendChild(svgElement(doc, "text", { x: left + 138, y: top + 13, class: "ssr-small" }, "y"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "ssr-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function matrixText(matrix, digits) {
      return "[" + matrix.map(function (row) {
        return row.map(function (value) { return formatNumber(value, digits || 3); }).join(", ");
      }).join("; ") + "]";
    }

    function renderLedger(doc, hostNode, result) {
      var body = element(doc, "tbody");
      result.rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(row.k) }),
          element(doc, "td", { text: formatNumber(row.u, 2) }),
          element(doc, "td", { text: formatNumber(row.x1, 3) }),
          element(doc, "td", { text: formatNumber(row.x2, 3) }),
          element(doc, "td", { text: formatNumber(row.y, 3) }),
          element(doc, "td", { text: formatNumber(row.z1, 3) }),
          element(doc, "td", { text: formatNumber(row.z2, 3) })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "状态推进与坐标账本；输入序列固定" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "k" }),
          element(doc, "th", { text: "u_k" }),
          element(doc, "th", { text: "x1" }),
          element(doc, "th", { text: "x2" }),
          element(doc, "th", { text: "y=Cx" }),
          element(doc, "th", { text: "z1" }),
          element(doc, "th", { text: "z2" })
        ])]),
        body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "control",
          prompt: "det([B AB]) 接近 0 时，哪个判断最准确？",
          expected: "unreachable",
          choices: [
            { value: "unreachable", label: "有状态方向不可达" },
            { value: "faster", label: "所有状态都更快" },
            { value: "observable", label: "只说明输出更可观" }
          ]
        },
        {
          key: "observe",
          prompt: "rank([C; CA])=2 对这个二状态模型意味着什么？",
          expected: "both",
          choices: [
            { value: "both", label: "两状态可由输出历史区分" },
            { value: "one", label: "只能看到一个状态" },
            { value: "input", label: "输入能控性自动满秩" }
          ]
        },
        {
          key: "coordinate",
          prompt: "把可逆坐标 T 调到很病态，最稳妥的判断是？",
          expected: "invariant",
          choices: [
            { value: "invariant", label: "秩不变，但数值条件变差" },
            { value: "rank", label: "物理能控性必然消失" },
            { value: "remove", label: "内部状态因此被删除" }
          ]
        }
      ];
    }

    function renderPredictions(state, refs) {
      var specs = questionSpecs();
      refs.questions.forEach(function (question, index) {
        var spec = specs[index];
        question.buttons.forEach(function (button) {
          var selected = state.predictions[spec.key] === button.value;
          button.node.setAttribute("aria-pressed", selected ? "true" : "false");
          if (!state.revealed) {
            button.node.textContent = button.label;
            button.node.className = "";
          } else {
            var correct = button.value === spec.expected;
            button.node.textContent = (correct ? "✓ " : "") + button.label;
            button.node.className = correct ? "ssr-correct" : selected ? "ssr-wrong" : "";
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
      var shell = element(doc, "div", { className: "ssr-lab" });
      shell.appendChild(element(doc, "h3", { text: "状态空间实验：能控、能观与病态坐标" }));
      shell.appendChild(element(doc, "p", { className: "ssr-note", text: "对象是两个衰减模态组成的数字定位平台；B 的第二分量控制输入能否激发第二模态，C 的第二分量控制输出能否看见它。坐标变换只改表示，不改物理系统。" }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "ssr-choice-grid" });
        var question = { key: spec.key, buttons: [] };
        spec.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
          button.addEventListener("click", function () {
            state.predictions[spec.key] = choice.value;
            state.feedback = "";
            render();
          });
          question.buttons.push({ value: choice.value, label: choice.label, node: button });
          grid.appendChild(button);
        });
        fieldset.appendChild(grid);
        predictionHost.appendChild(fieldset);
        refs.questions.push(question);
      });
      var actions = element(doc, "div", { className: "ssr-actions" });
      var reveal = element(doc, "button", { type: "button", className: "ssr-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "ssr-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controlRefs = {};

      function makeRange(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
        var output = element(doc, "output", { text: formatNumber(state.config[key], digits) });
        controlRefs[key] = { input: input, output: output, digits: digits };
        return element(doc, "div", { className: "ssr-control" }, [
          element(doc, "label", {}, [label + " = ", output]),
          input
        ]);
      }

      var controls = element(doc, "div", { className: "ssr-controls" }, [
        makeRange("b2", "输入耦合 b₂", 0, 1.2, 0.05, 2),
        makeRange("c2", "输出耦合 c₂", 0, 1.2, 0.05, 2),
        makeRange("epsilon", "坐标尺度 ε", 0.02, 1, 0.01, 2),
        makeRange("steps", "观测步数", 8, 24, 1, 0),
        element(doc, "p", { className: "ssr-note", text: "A=diag(0.82,0.45)，B=[1,b₂]ᵀ，C=[1,c₂]；T=[[1,1],[0,ε]]。b₂=0 或 c₂=0 是秩边界，ε 越小越容易放大数值误差。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 360", role: "img", "aria-label": "二状态系统状态响应" });
      var svgFrame = element(doc, "div", { className: "ssr-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "ssr-metrics" });
      var tableHost = element(doc, "div", { className: "ssr-table-wrap" });
      var certificate = element(doc, "div", { className: "ssr-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "ssr-layout" }, [
        controls,
        element(doc, "div", { className: "ssr-stage" }, [svgFrame, metricsHost, tableHost, certificate])
      ]));
      shell.appendChild(predictionHost);
      shell.appendChild(actions);
      shell.appendChild(feedback);
      shell.appendChild(resultShell);
      clear(rootNode);
      rootNode.appendChild(shell);

      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
          state.feedback = "请先完成三项预测；状态图、证书和 ledger 会在提交后出现。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。继续调 b₂、c₂ 或 ε，结果保持揭示。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "状态空间预测、图和账本已重置。");
      });
      ["b2", "c2", "epsilon", "steps"].forEach(function (key) {
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
        ["b2", "c2", "epsilon", "steps"].forEach(function (key) {
          controlRefs[key].input.value = String(result.config[key]);
          controlRefs[key].output.textContent = formatNumber(result.config[key], controlRefs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "ssr-feedback" + (state.feedback.indexOf("请先") === 0 ? " ssr-wrong" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "rank 能控矩阵", String(result.metrics.rankControllability) + "/2"));
        metricsHost.appendChild(metric(doc, "rank 能观矩阵", String(result.metrics.rankObservability) + "/2"));
        metricsHost.appendChild(metric(doc, "det C", formatNumber(result.metrics.detControllability, 3)));
        metricsHost.appendChild(metric(doc, "det O", formatNumber(result.metrics.detObservability, 3)));
        metricsHost.appendChild(metric(doc, "cond₂(T)", formatNumber(result.metrics.conditionTransform, 2)));
        metricsHost.appendChild(metric(doc, "max |z|", formatNumber(result.metrics.maxTransformedState, 3)));
        renderLedger(doc, tableHost, result);
        clear(certificate);
        certificate.appendChild(element(doc, "p", { text: "证书：C=[B AB]=" + matrixText(result.controllability, 3) + "，det(C)=" + formatNumber(result.metrics.detControllability, 3) + "，rank=" + result.metrics.rankControllability + "; O=[C;CA]=" + matrixText(result.observability, 3) + "，det(O)=" + formatNumber(result.metrics.detObservability, 3) + "，rank=" + result.metrics.rankObservability + "。" }));
        certificate.appendChild(element(doc, "p", { text: "坐标检查：det(T)=" + formatNumber(result.metrics.transformDeterminant, 3) + "，变换后秩为 " + result.metrics.transformedRankControllability + "/" + result.metrics.transformedRankObservability + "；这说明可逆坐标不改变物理秩，但 cond₂(T) 很大时，有限精度下的证书会变脆弱。" }));
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var baseline = runExperiment(DEFAULTS);
      var repeat = runExperiment(DEFAULTS);
      check(baseline.rows.length === DEFAULTS.steps, "fixed simulation length");
      check(JSON.stringify(baseline.rows) === JSON.stringify(repeat.rows), "deterministic trajectory");
      check(baseline.metrics.rankControllability === 2, "default controllability certificate");
      check(baseline.metrics.rankObservability === 2, "default observability certificate");
      check(nearly(baseline.metrics.detControllability, DEFAULTS.b2 * (A[1][1] - A[0][0]), 1e-9), "controllability determinant");
      check(nearly(baseline.metrics.detObservability, DEFAULTS.c2 * (A[1][1] - A[0][0]), 1e-9), "observability determinant");
      check(runExperiment({ b2: 0, c2: DEFAULTS.c2, epsilon: DEFAULTS.epsilon, steps: DEFAULTS.steps }).metrics.rankControllability === 1, "unreachable boundary");
      check(runExperiment({ b2: DEFAULTS.b2, c2: 0, epsilon: DEFAULTS.epsilon, steps: DEFAULTS.steps }).metrics.rankObservability === 1, "unobservable boundary");
      var ill = runExperiment({ b2: DEFAULTS.b2, c2: DEFAULTS.c2, epsilon: 0.02, steps: DEFAULTS.steps });
      check(ill.metrics.conditionTransform > baseline.metrics.conditionTransform, "coordinate conditioning boundary");
      check(ill.metrics.transformedRankControllability === baseline.metrics.rankControllability, "similarity preserves controllability rank");
      check(ill.metrics.transformedRankObservability === baseline.metrics.rankObservability, "similarity preserves observability rank");
      check(formatNumber(120, 0) === "120", "integer trailing zero formatting");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      runExperiment: runExperiment,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
