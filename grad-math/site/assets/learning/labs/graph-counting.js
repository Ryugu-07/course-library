(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("graph-counting", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("graph-counting self-test: PASS (" + report.checks + " checks, " + report.models + " graph models)");
    } catch (error) {
      console.error("graph-counting self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "graph-counting-lab-styles";
  var INSTANCE = 0;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function cloneMatrix(matrix) {
    return matrix.map(function (row) { return row.slice(); });
  }

  function normalizeInteger(value, minimum, maximum, fallback) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(minimum, Math.min(maximum, Math.round(parsed)));
  }

  function makeMatrix(kind, n) {
    var matrix = [];
    for (var row = 0; row < n; row += 1) {
      matrix.push([]);
      for (var column = 0; column < n; column += 1) matrix[row].push(0);
    }
    function add(left, right) {
      matrix[left][right] = 1;
      matrix[right][left] = 1;
    }
    if (kind === "complete") {
      for (var left = 0; left < n; left += 1) {
        for (var right = left + 1; right < n; right += 1) add(left, right);
      }
    } else if (kind === "cycle") {
      for (var cycleIndex = 0; cycleIndex < n; cycleIndex += 1) add(cycleIndex, (cycleIndex + 1) % n);
    } else {
      for (var pathIndex = 0; pathIndex < n - 1; pathIndex += 1) add(pathIndex, pathIndex + 1);
    }
    return matrix;
  }

  function edgeList(matrix) {
    var edges = [];
    for (var left = 0; left < matrix.length; left += 1) {
      for (var right = left + 1; right < matrix.length; right += 1) {
        if (matrix[left][right] === 1) edges.push([left, right]);
      }
    }
    return edges;
  }

  function degrees(matrix) {
    return matrix.map(function (row) {
      return row.reduce(function (sum, value) { return sum + value; }, 0);
    });
  }

  function isConnected(matrix) {
    if (!matrix.length) return false;
    var seen = [];
    var queue = [0];
    var head = 0;
    seen[0] = true;
    while (head < queue.length) {
      var vertex = queue[head++];
      for (var next = 0; next < matrix.length; next += 1) {
        if (matrix[vertex][next] === 1 && !seen[next]) {
          seen[next] = true;
          queue.push(next);
        }
      }
    }
    return seen.length === matrix.length && seen.every(function (value) { return value; });
  }

  function countSimplePaths(matrix, start, length) {
    if (length < 0) return 0;
    var used = [];
    used[start] = true;
    var count = 0;
    function visit(vertex, remaining) {
      if (remaining === 0) {
        count += 1;
        return;
      }
      for (var next = 0; next < matrix.length; next += 1) {
        if (matrix[vertex][next] !== 1 || used[next]) continue;
        used[next] = true;
        visit(next, remaining - 1);
        used[next] = false;
      }
    }
    visit(start, length);
    return count;
  }

  function countWalks(matrix, start, length) {
    var current = matrix.map(function () { return 0; });
    current[start] = 1;
    for (var step = 0; step < length; step += 1) {
      var next = matrix.map(function () { return 0; });
      for (var vertex = 0; vertex < matrix.length; vertex += 1) {
        for (var target = 0; target < matrix.length; target += 1) {
          if (matrix[vertex][target] === 1) next[target] += current[vertex];
        }
      }
      current = next;
    }
    return current.reduce(function (sum, value) { return sum + value; }, 0);
  }

  function findSimplePath(matrix, start, length) {
    var used = [];
    var path = [start];
    used[start] = true;
    var answer = null;
    function visit(vertex, remaining) {
      if (answer) return;
      if (remaining === 0) {
        answer = path.slice();
        return;
      }
      for (var next = 0; next < matrix.length; next += 1) {
        if (matrix[vertex][next] !== 1 || used[next]) continue;
        used[next] = true;
        path.push(next);
        visit(next, remaining - 1);
        path.pop();
        used[next] = false;
      }
    }
    visit(start, length);
    return answer || [];
  }

  function determinant(matrix) {
    var size = matrix.length;
    if (size === 0) return 1;
    if (size === 1) return matrix[0][0];
    var work = cloneMatrix(matrix);
    var sign = 1;
    var previous = 1;
    for (var pivotIndex = 0; pivotIndex < size - 1; pivotIndex += 1) {
      var pivotRow = pivotIndex;
      while (pivotRow < size && work[pivotRow][pivotIndex] === 0) pivotRow += 1;
      if (pivotRow === size) return 0;
      if (pivotRow !== pivotIndex) {
        var swap = work[pivotIndex];
        work[pivotIndex] = work[pivotRow];
        work[pivotRow] = swap;
        sign = -sign;
      }
      var pivot = work[pivotIndex][pivotIndex];
      for (var row = pivotIndex + 1; row < size; row += 1) {
        for (var column = pivotIndex + 1; column < size; column += 1) {
          work[row][column] = (work[row][column] * pivot - work[row][pivotIndex] * work[pivotIndex][column]) / previous;
        }
      }
      for (var cleared = pivotIndex + 1; cleared < size; cleared += 1) work[cleared][pivotIndex] = 0;
      previous = pivot;
    }
    return sign * work[size - 1][size - 1];
  }

  function spanningTreeCount(matrix) {
    if (matrix.length <= 1) return 1;
    var degree = degrees(matrix);
    var minor = [];
    for (var row = 0; row < matrix.length - 1; row += 1) {
      var minorRow = [];
      for (var column = 0; column < matrix.length - 1; column += 1) {
        minorRow.push(row === column ? degree[row] - matrix[row][column] : -matrix[row][column]);
      }
      minor.push(minorRow);
    }
    return determinant(minor);
  }

  function fibonacciGeneratingCoefficient(index) {
    var coefficient = [1, 1];
    for (var position = 2; position <= index; position += 1) coefficient[position] = coefficient[position - 1] + coefficient[position - 2];
    return coefficient[index];
  }

  function cayleyCount(n) {
    return Math.pow(n, n - 2);
  }

  function graphLabel(kind, n) {
    if (kind === "complete") return "K_" + n + "：完全图";
    if (kind === "cycle") return "C_" + n + "：循环图";
    return "P_" + n + "：路径图";
  }

  function normalizeGraph(kind, n, length, coefficient) {
    var safeKind = kind === "complete" || kind === "cycle" ? kind : "path";
    var safeN = normalizeInteger(n, 3, 7, 4);
    var safeLength = normalizeInteger(length, 0, 6, 2);
    var safeCoefficient = normalizeInteger(coefficient, 0, 10, 4);
    return { kind: safeKind, n: safeN, length: safeLength, coefficient: safeCoefficient };
  }

  function analyzeGraph(kind, n, length, coefficient) {
    var settings = normalizeGraph(kind, n, length, coefficient);
    var matrix = makeMatrix(settings.kind, settings.n);
    var edgeCount = edgeList(matrix).length;
    var degree = degrees(matrix);
    var simple = countSimplePaths(matrix, 0, settings.length);
    var walks = countWalks(matrix, 0, settings.length);
    var tree = isConnected(matrix) && edgeCount === settings.n - 1;
    var spanningTrees = spanningTreeCount(matrix);
    var cayley = settings.kind === "complete" ? cayleyCount(settings.n) : null;
    var formula = settings.kind === "complete" && settings.length > 0 && settings.length <= settings.n - 1
      ? "P(" + (settings.n - 1) + "," + (settings.length) + ")"
      : "固定起点的有限回溯";
    return {
      kind: settings.kind,
      n: settings.n,
      length: settings.length,
      coefficient: settings.coefficient,
      label: graphLabel(settings.kind, settings.n),
      matrix: matrix,
      edges: edgeList(matrix),
      edgeCount: edgeCount,
      degree: degree,
      degreeSum: degree.reduce(function (sum, value) { return sum + value; }, 0),
      handshake: degree.reduce(function (sum, value) { return sum + value; }, 0) === 2 * edgeCount,
      connected: isConnected(matrix),
      simplePaths: simple,
      walks: walks,
      simplePathMethod: formula,
      tree: tree,
      spanningTrees: spanningTrees,
      cayley: cayley,
      generatingCoefficient: fibonacciGeneratingCoefficient(settings.coefficient),
      generatingFormula: "[x^" + settings.coefficient + "] 1/(1-x-x^2)"
    };
  }

  var STYLE_TEXT = [
    ".gcnt-lab{--gcnt-blue:var(--accent,#315f9d);--gcnt-gold:var(--cl-gold,#9b6a12);--gcnt-green:var(--cl-green,#39734d);--gcnt-red:var(--cl-red,#b64335);--gcnt-muted:var(--fg-soft,#6b6557);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".gcnt-lab *,.gcnt-lab *::before,.gcnt-lab *::after{box-sizing:border-box}.gcnt-lab [hidden]{display:none!important}",
    ".gcnt-lab h3,.gcnt-lab h4{margin:0;color:var(--fg);letter-spacing:0}.gcnt-lab h3{font-size:1.18rem}.gcnt-lab h4{font-size:1rem}.gcnt-lab p{margin:7px 0}.gcnt-lab .gcnt-note,.gcnt-lab .gcnt-feedback{color:var(--gcnt-muted);font-size:13px;line-height:1.7}",
    ".gcnt-lab .gcnt-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0}.gcnt-lab .gcnt-field{display:grid;gap:5px;min-width:0}.gcnt-lab .gcnt-field label{color:var(--gcnt-muted);font-size:12.5px;font-weight:750}.gcnt-lab select,.gcnt-lab input{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35}.gcnt-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}.gcnt-lab button:hover{border-color:var(--gcnt-blue)}.gcnt-lab button:focus-visible,.gcnt-lab select:focus-visible,.gcnt-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.gcnt-lab button[aria-pressed=true],.gcnt-lab .gcnt-primary{border-color:var(--gcnt-blue);background:var(--gcnt-blue);color:var(--bg);font-weight:750}",
    ".gcnt-lab .gcnt-gate{margin:14px 0;padding:12px;border-left:3px solid var(--gcnt-gold);background:var(--block-bg,var(--bg))}.gcnt-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);background:var(--bg)}.gcnt-lab legend{max-width:100%;padding:0 3px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5}.gcnt-lab .gcnt-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.gcnt-lab .gcnt-options button{font-size:12px}.gcnt-lab .gcnt-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.gcnt-lab .gcnt-actions>*{flex:1 1 180px}.gcnt-lab .gcnt-feedback{min-height:1.7em;margin-top:9px;font-weight:700}.gcnt-lab .gcnt-pass{color:var(--gcnt-green)}.gcnt-lab .gcnt-warn{color:var(--gcnt-red)}",
    ".gcnt-lab .gcnt-result{display:grid;gap:12px;margin-top:15px}.gcnt-lab .gcnt-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.gcnt-lab .gcnt-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.gcnt-lab .gcnt-metric:nth-child(3n+1){border-color:var(--gcnt-blue)}.gcnt-lab .gcnt-metric:nth-child(3n+2){border-color:var(--gcnt-gold)}.gcnt-lab .gcnt-metric:nth-child(3n){border-color:var(--gcnt-green)}.gcnt-lab .gcnt-metric span{display:block;color:var(--gcnt-muted);font-size:11px}.gcnt-lab .gcnt-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".gcnt-lab .gcnt-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.gcnt-lab .gcnt-svg{display:block;width:100%;min-width:560px;height:auto;color:var(--fg)}.gcnt-lab .gcnt-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.gcnt-lab .gcnt-edge{stroke:var(--border);stroke-width:3}.gcnt-lab .gcnt-highlight{stroke:var(--gcnt-gold);stroke-width:7;stroke-linecap:round}.gcnt-lab .gcnt-node{fill:var(--gcnt-blue);stroke:var(--bg);stroke-width:3}.gcnt-lab .gcnt-node-label{fill:var(--bg)!important;font-size:12px;text-anchor:middle;dominant-baseline:middle;font-weight:750}.gcnt-lab .gcnt-small{font-size:12px;text-anchor:middle}.gcnt-lab .gcnt-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.gcnt-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.gcnt-lab caption{padding:0 0 7px;text-align:left;color:var(--gcnt-muted);font-size:12px;font-weight:700}.gcnt-lab th,.gcnt-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.gcnt-lab th{color:var(--gcnt-muted);font-size:11px}.gcnt-lab .gcnt-certificate{padding:10px 12px;border-left:3px solid var(--gcnt-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7}.gcnt-lab .gcnt-certificate.gcnt-fail{border-left-color:var(--gcnt-red)}",
    "@media(max-width:780px){.gcnt-lab .gcnt-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.gcnt-lab .gcnt-options{grid-template-columns:minmax(0,1fr)}.gcnt-lab .gcnt-frame{padding:5px}.gcnt-lab table{font-size:11.5px}}@media(max-width:460px){.gcnt-lab .gcnt-controls{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.gcnt-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
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
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "gcnt-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }

  function drawGraph(doc, svg, report, uid) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 620 320");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title", text: report.label + " 的路径与计数示意" }));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc", text: "边和节点展示图结构，金色线段是一条当前步长的简单路径证书。" }));
    var points = [];
    if (report.kind === "path") {
      for (var pathIndex = 0; pathIndex < report.n; pathIndex += 1) points.push([65 + pathIndex * (490 / (report.n - 1)), 145]);
    } else {
      var centerX = 300;
      var centerY = 145;
      var radius = report.kind === "complete" ? 105 : 115;
      for (var circleIndex = 0; circleIndex < report.n; circleIndex += 1) {
        var angle = -Math.PI / 2 + (2 * Math.PI * circleIndex) / report.n;
        points.push([centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)]);
      }
    }
    report.edges.forEach(function (edge) {
      svg.appendChild(svgElement(doc, "line", {
        x1: String(points[edge[0]][0]),
        y1: String(points[edge[0]][1]),
        x2: String(points[edge[1]][0]),
        y2: String(points[edge[1]][1]),
        className: "gcnt-edge"
      }));
    });
    var samplePath = findSimplePath(report.matrix, 0, report.length);
    for (var sampleIndex = 0; sampleIndex < samplePath.length - 1; sampleIndex += 1) {
      var from = points[samplePath[sampleIndex]];
      var to = points[samplePath[sampleIndex + 1]];
      svg.appendChild(svgElement(doc, "line", {
        x1: String(from[0]),
        y1: String(from[1]),
        x2: String(to[0]),
        y2: String(to[1]),
        className: "gcnt-highlight"
      }));
    }
    points.forEach(function (point, index) {
      svg.appendChild(svgElement(doc, "circle", { cx: String(point[0]), cy: String(point[1]), r: "19", className: "gcnt-node" }));
      svg.appendChild(svgElement(doc, "text", { x: String(point[0]), y: String(point[1]), className: "gcnt-node-label", text: String(index) }));
      svg.appendChild(svgElement(doc, "text", { x: String(point[0]), y: String(point[1] + 36), className: "gcnt-small", text: "d=" + report.degree[index] }));
    });
    svg.appendChild(svgElement(doc, "text", { x: "310", y: "286", className: "gcnt-small", text: samplePath.length ? "金色：一个简单路径 " + samplePath.join("→") : "当前步长没有简单路径证书" }));
  }

  function predictionSpecs() {
    return [
      {
        key: "simple",
        prompt: "简单路径允许重复顶点吗？",
        expected: "no",
        choices: [{ value: "yes", label: "允许" }, { value: "no", label: "不允许" }]
      },
      {
        key: "handshake",
        prompt: "无向图的度数和等于？",
        expected: "twice",
        choices: [{ value: "edges", label: "E" }, { value: "twice", label: "2E" }, { value: "vertices", label: "nE" }]
      },
      {
        key: "cayley",
        prompt: "Cayley 的 n^(n-2) 计数什么？",
        expected: "trees",
        choices: [{ value: "trees", label: "K_n 的标号生成树" }, { value: "walks", label: "所有游走" }, { value: "paths", label: "所有简单路径" }]
      }
    ];
  }

  function renderPredictions(state, refs) {
    predictionSpecs().forEach(function (spec, index) {
      var question = refs.questions[index];
      question.legend.textContent = spec.prompt;
      question.buttons.forEach(function (button) {
        var selected = state.predictions[spec.key] === button.value;
        button.node.setAttribute("aria-pressed", selected ? "true" : "false");
        if (state.revealed) {
          var correct = button.value === spec.expected;
          button.node.textContent = (correct ? "✓ " : "") + button.label;
          button.node.className = correct ? "gcnt-pass" : (selected ? "gcnt-warn" : "");
        } else {
          button.node.textContent = button.label;
          button.node.className = "";
        }
      });
    });
  }

  function renderEvidence(doc, refs, report) {
    var metrics = [
      metric(doc, "顶点 / 边"),
      metric(doc, "度数和 / 2E"),
      metric(doc, "简单路径"),
      metric(doc, "游走"),
      metric(doc, "树"),
      metric(doc, "生成树数")
    ];
    clear(refs.metrics);
    metrics.forEach(function (item) { refs.metrics.appendChild(item.node); });
    metrics[0].value.textContent = report.n + " / " + report.edgeCount;
    metrics[1].value.textContent = report.degreeSum + " / " + (2 * report.edgeCount);
    metrics[2].value.textContent = String(report.simplePaths);
    metrics[3].value.textContent = String(report.walks);
    metrics[4].value.textContent = report.tree ? "是" : "否";
    metrics[5].value.textContent = String(report.spanningTrees);

    refs.svg.setAttribute("aria-labelledby", refs.uid + "-title " + refs.uid + "-desc");
    drawGraph(doc, refs.svg, report, refs.uid);

    var cayleyText = report.cayley === null
      ? "当前不是 K_n；Cayley 公式不适用，实际生成树数为 " + report.spanningTrees
      : "K_" + report.n + " 的 n^(n-2)=" + report.cayley + " 棵标号树";
    var rows = [
      ["长度 " + report.length + " 的简单路径", String(report.simplePaths), "固定起点，顶点不重复；" + report.simplePathMethod],
      ["长度 " + report.length + " 的游走", String(report.walks), "固定起点，允许回到旧顶点；用动态规划累计"],
      ["握手账本", "度数和 " + report.degreeSum + " = 2E = " + (2 * report.edgeCount), "每条无向边贡献两个端点"],
      ["树判定", report.tree ? "是" : "否", "连通且 E=n-1；只判当前有限图"],
      ["生成树数", "τ(G)=" + report.spanningTrees, "Matrix–Tree 行列式证书"],
      ["Cayley", cayleyText, "只数完全图 K_n 的标号生成树"],
      ["生成函数", report.generatingFormula + " = " + report.generatingCoefficient, "F(x)=1/(1-x-x^2) 的系数序列；与图路线分账"]
    ];
    clear(refs.table);
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "组合对象账本：路径、树与生成函数分栏" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "对象" }),
      element(doc, "th", { scope: "col", text: "当前结果" }),
      element(doc, "th", { scope: "col", text: "证书读法" })
    ])));
    var body = element(doc, "tbody");
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: value }); })));
    });
    table.appendChild(body);
    refs.table.appendChild(table);
    refs.certificate.className = "gcnt-certificate" + (report.kind === "complete" ? "" : " gcnt-fail");
    refs.certificate.textContent = report.kind === "complete"
      ? "当前图是 K_n，所以 Cayley 公式可以使用；简单路径、游走和生成函数的数值仍是三本不同账。"
      : "当前图不是完全图：Cayley 公式不能直接套用。有限计算给出当前图的证书，不把枚举外推成一般计数定理。";
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    var uid = "gcnt-" + (++INSTANCE);
    var state = { kind: "path", n: 4, length: 2, coefficient: 4, revealed: false, predictions: {}, feedback: "" };
    var refs = { questions: [], uid: uid };
    installStyles(doc);

    var shell = element(doc, "div", { className: "gcnt-lab" });
    shell.appendChild(element(doc, "h3", { text: "图计数实验：先说清楚在数路径、树还是系数" }));
    shell.appendChild(element(doc, "p", { className: "gcnt-note", text: "固定起点的有限模型；简单路径用回溯，游走用动态规划，生成树用行列式。结果区在预测核对前保持隐藏。" }));

    var kindSelect = element(doc, "select", { "aria-label": "图型" });
    kindSelect.appendChild(element(doc, "option", { value: "path", text: "P_n：路径图" }));
    kindSelect.appendChild(element(doc, "option", { value: "complete", text: "K_n：完全图" }));
    kindSelect.appendChild(element(doc, "option", { value: "cycle", text: "C_n：循环图" }));
    var nInput = element(doc, "input", { type: "number", min: "3", max: "7", step: "1", value: "4", "aria-label": "顶点数 n" });
    var lengthInput = element(doc, "input", { type: "number", min: "0", max: "6", step: "1", value: "2", "aria-label": "步长 k" });
    var coefficientInput = element(doc, "input", { type: "number", min: "0", max: "10", step: "1", value: "4", "aria-label": "生成函数系数指标 m" });
    shell.appendChild(element(doc, "div", { className: "gcnt-controls" }, [
      element(doc, "div", { className: "gcnt-field" }, [element(doc, "label", { htmlFor: uid + "-kind", text: "图型" }), kindSelect]),
      element(doc, "div", { className: "gcnt-field" }, [element(doc, "label", { htmlFor: uid + "-n", text: "顶点数 n（3–7）" }), nInput]),
      element(doc, "div", { className: "gcnt-field" }, [element(doc, "label", { htmlFor: uid + "-length", text: "路线步长 k" }), lengthInput]),
      element(doc, "div", { className: "gcnt-field" }, [element(doc, "label", { htmlFor: uid + "-coefficient", text: "系数指标 m" }), coefficientInput])
    ]));
    kindSelect.id = uid + "-kind";
    nInput.id = uid + "-n";
    lengthInput.id = uid + "-length";
    coefficientInput.id = uid + "-coefficient";

    var gate = element(doc, "div", { className: "gcnt-gate" });
    var choicesByQuestion = [
      [{ value: "yes", label: "允许" }, { value: "no", label: "不允许" }],
      [{ value: "edges", label: "E" }, { value: "twice", label: "2E" }, { value: "vertices", label: "nE" }],
      [{ value: "trees", label: "K_n 的标号生成树" }, { value: "walks", label: "所有游走" }, { value: "paths", label: "所有简单路径" }]
    ];
    for (let questionIndex = 0; questionIndex < 3; questionIndex += 1) {
      var fieldset = element(doc, "fieldset");
      var legend = element(doc, "legend", { text: "预测" });
      var options = element(doc, "div", { className: "gcnt-options" });
      refs.questions.push({ legend: legend, buttons: [] });
      fieldset.appendChild(legend);
      fieldset.appendChild(options);
      gate.appendChild(fieldset);
      choicesByQuestion[questionIndex].forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () {
          var specs = predictionSpecs();
          state.predictions[specs[questionIndex].key] = choice.value;
          state.feedback = "";
          render();
        });
        refs.questions[questionIndex].buttons.push({ value: choice.value, label: choice.label, node: button });
        options.appendChild(button);
      });
    }
    shell.appendChild(gate);

    var reveal = element(doc, "button", { type: "button", className: "gcnt-primary", text: "核对预测并揭晓" });
    var reset = element(doc, "button", { type: "button", text: "重置实验" });
    var feedback = element(doc, "p", { className: "gcnt-feedback", "aria-live": "polite" });
    shell.appendChild(element(doc, "div", { className: "gcnt-actions" }, [reveal, reset]));
    shell.appendChild(feedback);

    var result = element(doc, "div", { className: "gcnt-result", hidden: true });
    var svg = svgElement(doc, "svg", { className: "gcnt-svg", role: "img", viewBox: "0 0 620 320" });
    var metrics = element(doc, "div", { className: "gcnt-metrics" });
    var table = element(doc, "div", { className: "gcnt-table-wrap" });
    var certificate = element(doc, "p", { className: "gcnt-certificate" });
    result.appendChild(element(doc, "div", { className: "gcnt-frame" }, svg));
    result.appendChild(metrics);
    result.appendChild(table);
    result.appendChild(certificate);
    shell.appendChild(result);
    refs.svg = svg;
    refs.metrics = metrics;
    refs.table = table;
    refs.certificate = certificate;
    clear(root);
    root.appendChild(shell);

    function lock() {
      var settings = normalizeGraph(kindSelect.value, nInput.value, lengthInput.value, coefficientInput.value);
      state.kind = settings.kind;
      state.n = settings.n;
      state.length = settings.length;
      state.coefficient = settings.coefficient;
      state.revealed = false;
      state.predictions = {};
      state.feedback = "";
      render();
    }

    kindSelect.addEventListener("change", lock);
    nInput.addEventListener("change", lock);
    lengthInput.addEventListener("change", lock);
    coefficientInput.addEventListener("change", lock);
    reset.addEventListener("click", function () {
      state = { kind: "path", n: 4, length: 2, coefficient: 4, revealed: false, predictions: {}, feedback: "" };
      kindSelect.value = "path";
      nInput.value = "4";
      lengthInput.value = "2";
      coefficientInput.value = "4";
      render();
      announce(api, root, "图计数实验已重置。");
    });
    reveal.addEventListener("click", function () {
      var specs = predictionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中；现在按对象分栏读计数。";
      render();
      announce(api, root, state.feedback);
    });

    function render() {
      var settings = normalizeGraph(state.kind, state.n, state.length, state.coefficient);
      state.kind = settings.kind;
      state.n = settings.n;
      state.length = settings.length;
      state.coefficient = settings.coefficient;
      kindSelect.value = state.kind;
      nInput.value = String(state.n);
      lengthInput.value = String(state.length);
      coefficientInput.value = String(state.coefficient);
      renderPredictions(state, refs);
      feedback.textContent = state.feedback;
      feedback.className = "gcnt-feedback" + (state.feedback.indexOf("请先") === 0 ? " gcnt-warn" : "");
      result.hidden = !state.revealed;
      if (state.revealed) renderEvidence(doc, refs, analyzeGraph(state.kind, state.n, state.length, state.coefficient));
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      assert(condition, message);
      checks += 1;
    }
    var path = analyzeGraph("path", 4, 2, 4);
    check(path.handshake && path.degreeSum === 2 * path.edgeCount, "P4 handshake");
    check(path.simplePaths === 1 && path.walks === 2, "P4 path versus walk");
    check(path.tree && path.spanningTrees === 1, "P4 tree certificate");
    check(path.generatingCoefficient === 5, "Fibonacci generating coefficient");

    var complete = analyzeGraph("complete", 4, 2, 4);
    check(complete.simplePaths === 6 && complete.walks === 9, "K4 path versus walk");
    check(complete.spanningTrees === 16 && complete.cayley === 16, "K4 Cayley certificate");
    check(!complete.tree, "K4 is not a tree");

    var cycle = analyzeGraph("cycle", 5, 2, 4);
    check(cycle.handshake && cycle.degreeSum === 10, "C5 handshake");
    check(cycle.simplePaths === 2 && cycle.walks === 4, "C5 path versus walk");
    check(cycle.spanningTrees === 5 && cycle.cayley === null, "C5 spanning tree boundary");

    var models = ["path", "complete", "cycle"];
    models.forEach(function (kind) {
      var report = analyzeGraph(kind, 3, 0, 0);
      check(report.simplePaths === 1 && report.walks === 1, kind + " zero length route");
      check(report.matrix.length === 3 && report.edges.length === report.edgeCount, kind + " graph structure");
    });
    return { checks: checks, models: models.length };
  }

  return {
    mount: mount,
    analyzeGraph: analyzeGraph,
    countSimplePaths: countSimplePaths,
    countWalks: countWalks,
    selfTest: selfTest
  };
});
