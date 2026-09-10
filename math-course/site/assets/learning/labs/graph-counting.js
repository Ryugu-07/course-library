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

  function assert(ok, message) { if (!ok) throw new Error(message); }
  function integer(value, lo, hi, name) {
    assert(typeof value === "number" && Number.isInteger(value) && value >= lo && value <= hi, name + " must be an integer in " + lo + ".." + hi);
    return value;
  }
  function validateMatrix(matrix) {
    assert(Array.isArray(matrix) && matrix.length >= 1 && matrix.length <= 7, "graph needs 1..7 vertices");
    for (var i = 0; i < matrix.length; i++) {
      assert(Array.isArray(matrix[i]) && matrix[i].length === matrix.length, "square adjacency required");
      for (var j = 0; j < matrix.length; j++) {
        assert(matrix[i][j] === 0 || matrix[i][j] === 1, "binary adjacency required");
        assert(i !== j || matrix[i][j] === 0, "no loops");
      }
    }
    for (var a = 0; a < matrix.length; a++) for (var b = 0; b < a; b++) assert(matrix[a][b] === matrix[b][a], "undirected adjacency required");
    return matrix;
  }
  function makeMatrix(kind, n) {
    assert(["path", "complete", "cycle", "disconnected"].includes(kind), "unknown graph");
    integer(n, 3, 7, "vertices"); var m = Array.from({ length: n }, function () { return Array(n).fill(0); });
    function add(a, b) { m[a][b] = m[b][a] = 1; }
    if (kind === "complete") { for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) add(a, b); }
    else if (kind === "cycle") { for (var j = 0; j < n; j++) add(j, (j + 1) % n); }
    else if (kind === "disconnected") { add(0, n - 1); }
    else { for (var k = 0; k < n - 1; k++) add(k, k + 1); }
    return m;
  }
  function edgeList(matrix) {
    validateMatrix(matrix); var edges = [];
    for (var i = 0; i < matrix.length; i++) for (var j = i + 1; j < matrix.length; j++) if (matrix[i][j]) edges.push([i, j]);
    return edges;
  }
  function degrees(matrix) { validateMatrix(matrix); return matrix.map(function (r) { return r.reduce(function (a, b) { return a + b; }, 0); }); }
  function isConnected(matrix) {
    validateMatrix(matrix); var seen = Array(matrix.length).fill(false), stack = [0]; seen[0] = true;
    while (stack.length) {
      var v = stack.pop();
      for (var j = 0; j < matrix.length; j++) if (matrix[v][j] && !seen[j]) { seen[j] = true; stack.push(j); }
    }
    return seen.every(function (v) { return v; });
  }
  function routeArgs(matrix, start, length) {
    validateMatrix(matrix); integer(start, 0, matrix.length - 1, "start"); integer(length, 0, 12, "route length");
  }
  function countSimplePaths(matrix, start, length) {
    routeArgs(matrix, start, length); if (length >= matrix.length) return 0;
    var used = Array(matrix.length).fill(false), count = 0; used[start] = true;
    function visit(v, left) {
      if (left === 0) { count++; return; }
      for (var j = 0; j < matrix.length; j++) if (matrix[v][j] && !used[j]) { used[j] = true; visit(j, left - 1); used[j] = false; }
    }
    visit(start, length); return count;
  }
  function countWalks(matrix, start, length) {
    routeArgs(matrix, start, length); var row = Array(matrix.length).fill(0n); row[start] = 1n;
    for (var k = 0; k < length; k++) {
      var next = Array(matrix.length).fill(0n);
      for (var i = 0; i < matrix.length; i++) for (var j = 0; j < matrix.length; j++) if (matrix[i][j]) next[j] += row[i];
      row = next;
    }
    return row.reduce(function (a, b) { return a + b; }, 0n);
  }
  function findSimplePath(matrix, start, length) {
    routeArgs(matrix, start, length); if (length >= matrix.length) return [];
    var used = Array(matrix.length).fill(false), path = [start], answer = null; used[start] = true;
    function visit(v, left) {
      if (answer) return;
      if (left === 0) { answer = path.slice(); return; }
      for (var j = 0; j < matrix.length; j++) if (matrix[v][j] && !used[j]) { used[j] = true; path.push(j); visit(j, left - 1); path.pop(); used[j] = false; }
    }
    visit(start, length); return answer || [];
  }
  function determinant(matrix) {
    assert(Array.isArray(matrix) && matrix.length <= 7, "determinant size 0..7");
    var n = matrix.length, work = matrix.map(function (row) {
      assert(Array.isArray(row) && row.length === n, "square integer matrix");
      return Array.from(row, function (v) { integer(v, -7, 7, "matrix entry"); return BigInt(v); });
    });
    if (!n) return 1n;
    var sign = 1n, previous = 1n;
    for (var k = 0; k < n - 1; k++) {
      var pivotRow = k;
      while (pivotRow < n && work[pivotRow][k] === 0n) pivotRow++;
      if (pivotRow === n) return 0n;
      if (pivotRow !== k) { var tmp = work[k]; work[k] = work[pivotRow]; work[pivotRow] = tmp; sign = -sign; }
      var pivot = work[k][k];
      for (var i = k + 1; i < n; i++) for (var j = k + 1; j < n; j++) {
        var numerator = work[i][j] * pivot - work[i][k] * work[k][j];
        assert(numerator % previous === 0n, "Bareiss division must be exact"); work[i][j] = numerator / previous;
      }
      for (var row = k + 1; row < n; row++) work[row][k] = 0n;
      previous = pivot;
    }
    return sign * work[n - 1][n - 1];
  }
  function spanningTreeCount(matrix) {
    validateMatrix(matrix); if (matrix.length === 1) return 1n;
    var deg = degrees(matrix), minor = [];
    for (var i = 0; i < matrix.length - 1; i++) {
      var row = []; for (var j = 0; j < matrix.length - 1; j++) row.push(i === j ? deg[i] : -matrix[i][j]);
      minor.push(row);
    }
    return determinant(minor);
  }
  function factorial(n) { integer(n, 0, 100, "factorial index"); var x = 1n; for (var k = 2; k <= n; k++) x *= BigInt(k); return x; }
  function binomial(n, k) {
    integer(n, 0, 100, "n"); integer(k, 0, n, "k"); var x = 1n;
    for (var j = 1; j <= Math.min(k, n - k); j++) x = x * BigInt(n - j + 1) / BigInt(j);
    return x;
  }
  function fibonacciGeneratingCoefficient(index) {
    integer(index, 0, 100, "coefficient index"); var a = 1n, b = 1n;
    for (var k = 0; k < index; k++) { var next = a + b; a = b; b = next; }
    return a;
  }
  function cayleyCount(n) { integer(n, 1, 7, "vertices"); return n === 1 ? 1n : BigInt(n) ** BigInt(n - 2); }
  function coinLedger(m) {
    integer(m, 0, 100, "amount");
    var coins = [1, 2, 5], stages = [], ways = Array(m + 1).fill(0n); ways[0] = 1n;
    coins.forEach(function (coin) {
      for (var amount = coin; amount <= m; amount++) ways[amount] += ways[amount - coin];
      stages.push(ways.slice());
    });
    var ordered = Array(m + 1).fill(0n); ordered[0] = 1n;
    for (var n = 1; n <= m; n++) coins.forEach(function (coin) { if (n >= coin) ordered[n] += ordered[n - coin]; });
    var solutions = [];
    for (var fives = 0; fives <= Math.floor(m / 5); fives++) for (var twos = 0; twos <= Math.floor((m - 5 * fives) / 2); twos++) {
      var ones = m - 5 * fives - 2 * twos, total = ones + twos + fives;
      solutions.push({ ones: ones, twos: twos, fives: fives, orders: factorial(total) / (factorial(ones) * factorial(twos) * factorial(fives)) });
    }
    return { amount: m, rows: Array.from({ length: m + 1 }, function (_, i) {
      return { amount: i, one: stages[0][i], oneTwo: stages[1][i], unordered: stages[2][i], ordered: ordered[i], stairs: fibonacciGeneratingCoefficient(i) };
    }), unordered: ways[m], ordered: ordered[m], solutions: solutions };
  }
  function derangementLedger(n) {
    integer(n, 0, 12, "derangement size");
    var total = factorial(n), cumulative = 0n, rows = [], recurrence = [1n, 0n];
    for (var j = 0; j <= n; j++) {
      var choices = binomial(n, j), intersection = factorial(n - j), term = choices * intersection * (j % 2 ? -1n : 1n);
      cumulative += term; rows.push({ j: j, choices: choices, intersection: intersection, signedTerm: term, cumulative: cumulative });
    }
    for (var k = 2; k <= n; k++) recurrence.push(BigInt(k - 1) * (recurrence[k - 1] + recurrence[k - 2]));
    return { n: n, total: total, count: cumulative, recurrence: recurrence[n], probabilityNumerator: cumulative, probabilityDenominator: total,
      errorBoundDenominator: factorial(n + 1), rows: rows };
  }
  function graphLabel(kind, n) {
    return kind === "complete" ? "K_" + n + "：完全图" : kind === "cycle" ? "C_" + n + "：循环图" : kind === "disconnected" ? n + " 顶点：仅边 0—" + (n - 1) : "P_" + n + "：路径图";
  }
  function normalizeGraph(kind, n, length, coefficient) {
    assert(["path", "complete", "cycle", "disconnected"].includes(kind), "unknown graph");
    integer(n, 3, 7, "vertices"); integer(length, 0, 12, "route length"); integer(coefficient, 0, 100, "coefficient");
    return { kind: kind, n: n, length: length, coefficient: coefficient };
  }
  function analyzeGraph(kind, n, length, coefficient) {
    var settings = normalizeGraph(kind, n, length, coefficient), matrix = makeMatrix(kind, n), edges = edgeList(matrix), degree = degrees(matrix);
    var degreeSum = degree.reduce(function (a, b) { return a + b; }, 0), connected = isConnected(matrix);
    return { kind: kind, n: n, length: length, coefficient: coefficient, label: graphLabel(kind, n), matrix: matrix, edges: edges, edgeCount: edges.length,
      degree: degree, degreeSum: degreeSum, handshake: degreeSum === 2 * edges.length, connected: connected, tree: connected && edges.length === n - 1,
      simplePaths: countSimplePaths(matrix, 0, length), walks: countWalks(matrix, 0, length),
      simplePathMethod: kind === "complete" && length < n ? "P(" + (n - 1) + "," + length + ")" : "固定起点的有限回溯",
      spanningTrees: spanningTreeCount(matrix), cayley: kind === "complete" ? cayleyCount(n) : null,
      generatingCoefficient: fibonacciGeneratingCoefficient(coefficient), generatingFormula: "[x^" + coefficient + "] 1/(1-x-x^2)" };
  }


  var STYLE_TEXT = [
    ".gcnt-lab{--gcnt-blue:var(--accent,#315f9d);--gcnt-gold:var(--cl-gold,#9b6a12);--gcnt-green:var(--cl-green,#39734d);--gcnt-red:var(--cl-red,#b64335);--gcnt-muted:var(--fg-soft,#6b6557);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".gcnt-lab *,.gcnt-lab *::before,.gcnt-lab *::after{box-sizing:border-box}.gcnt-lab [hidden]{display:none!important}",
    ".gcnt-lab h3,.gcnt-lab h4{margin:0;color:var(--fg);letter-spacing:0}.gcnt-lab h3{font-size:1.18rem}.gcnt-lab h4{font-size:1rem}.gcnt-lab p{margin:7px 0}.gcnt-lab .gcnt-note,.gcnt-lab .gcnt-feedback{color:var(--gcnt-muted);font-size:13px;line-height:1.7}",
    ".gcnt-lab .gcnt-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0}.gcnt-lab .gcnt-field{display:grid;gap:5px;min-width:0}.gcnt-lab .gcnt-field label{color:var(--gcnt-muted);font-size:12.5px;font-weight:750}.gcnt-lab select,.gcnt-lab input{width:100%;min-height:44px;margin:0;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35}.gcnt-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}.gcnt-lab button:disabled{opacity:.55;cursor:default}.gcnt-lab button:hover{border-color:var(--gcnt-blue)}.gcnt-lab :focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.gcnt-lab button[aria-pressed=true],.gcnt-lab .gcnt-primary{border-color:var(--gcnt-blue);background:var(--gcnt-blue);color:var(--bg);font-weight:750}",
    ".gcnt-lab .gcnt-gate{margin:14px 0;padding:12px;border-left:3px solid var(--gcnt-gold);background:var(--block-bg,var(--bg))}.gcnt-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);background:var(--bg)}.gcnt-lab legend{max-width:100%;padding:0 3px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5}.gcnt-lab .gcnt-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.gcnt-lab .gcnt-options button{font-size:12px}.gcnt-lab .gcnt-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.gcnt-lab .gcnt-actions>*{flex:1 1 180px}.gcnt-lab .gcnt-feedback{min-height:1.7em;margin-top:9px;font-weight:700}.gcnt-lab .gcnt-pass{color:var(--gcnt-green)}.gcnt-lab .gcnt-warn{color:var(--gcnt-red)}",
    ".gcnt-lab .gcnt-result{display:grid;gap:12px;margin-top:15px}.gcnt-lab .gcnt-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.gcnt-lab .gcnt-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.gcnt-lab .gcnt-metric:nth-child(3n+1){border-color:var(--gcnt-blue)}.gcnt-lab .gcnt-metric:nth-child(3n+2){border-color:var(--gcnt-gold)}.gcnt-lab .gcnt-metric:nth-child(3n){border-color:var(--gcnt-green)}.gcnt-lab .gcnt-metric span{display:block;color:var(--gcnt-muted);font-size:11px}.gcnt-lab .gcnt-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".gcnt-lab .gcnt-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.gcnt-lab .gcnt-svg{display:block;width:620px;min-width:620px;max-width:none;height:400px;color:var(--fg)}.gcnt-lab .gcnt-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.gcnt-lab .gcnt-edge{stroke:var(--border);stroke-width:3}.gcnt-lab .gcnt-highlight{stroke:var(--gcnt-gold);stroke-width:7;stroke-linecap:round}.gcnt-lab .gcnt-node{fill:var(--gcnt-blue);stroke:var(--bg);stroke-width:3}.gcnt-lab .gcnt-node-label{fill:var(--bg)!important;font-size:12px;text-anchor:middle;dominant-baseline:middle;font-weight:750}.gcnt-lab .gcnt-small{font-size:12px;text-anchor:middle}.gcnt-lab .gcnt-table-wrap{max-width:100%;max-height:440px;overflow:auto;-webkit-overflow-scrolling:touch}.gcnt-lab table{width:100%;min-width:1100px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.gcnt-lab caption{padding:0 0 7px;text-align:left;color:var(--gcnt-muted);font-size:12px;font-weight:700}.gcnt-lab th,.gcnt-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.gcnt-lab th{color:var(--gcnt-muted);font-size:11px}.gcnt-lab .gcnt-certificate{padding:10px 12px;border-left:3px solid var(--gcnt-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7}.gcnt-lab .gcnt-certificate.gcnt-fail{border-left-color:var(--gcnt-red)}",
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
    svg.setAttribute("viewBox", "0 0 620 400");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title", text: report.label + " 的路径与计数示意" }));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc", text: "节点与边展示结构；若存在正长度简单路径，金色边显示其中一条。零长度或不存在的情形由图下文字说明。" }));
    var points = [];
    if (report.kind === "path") {
      for (var pathIndex = 0; pathIndex < report.n; pathIndex += 1) points.push([65 + pathIndex * (490 / (report.n - 1)), 170]);
    } else {
      var centerX = 300;
      var centerY = 165;
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
    svg.appendChild(svgElement(doc, "text", { x: "310", y: "370", className: "gcnt-small", text: samplePath.length === 1 ? "长度 0：只含起点 0，不含边" : samplePath.length ? "金色：一条简单路径 " + samplePath.join("→") : "当前步长不存在简单路径" }));
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

  function evidenceTable(doc, target, caption, headers, rows) {
    clear(target); var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: caption }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, headers.map(function (v) { return element(doc, "th", { scope: "col", text: v }); }))));
    table.appendChild(element(doc, "tbody", {}, rows.map(function (row) { return element(doc, "tr", {}, row.map(function (v) { return element(doc, "td", { text: String(v) }); })); })));
    target.appendChild(table);
  }
  function renderCounting(doc, refs, amount, n) {
    var coins = coinLedger(amount), derangements = derangementLedger(n);
    refs.countingSummary.textContent = "凑 " + amount + "：硬币组合 " + coins.unordered + " 种；有序投币序列 " + coins.ordered + " 条；只用步长 1/2 的序列 " + fibonacciGeneratingCoefficient(amount) + " 条。下面列出每个中间金额的精确整数，不以浮点近似取整。";
    evidenceTable(doc, refs.coins, "逐金额递推：按面额累计组合，按最后一枚累计序列", ["金额 m", "仅面额 1", "面额 1/2 组合", "面额 1/2/5 组合", "面额 1/2/5 有序序列", "步长 1/2 序列"], coins.rows.map(function (r) { return [r.amount, r.one, r.oneTwo, r.unordered, r.ordered, r.stairs]; }));
    var shown = coins.solutions.slice(0, 12);
    refs.solutions.textContent = "数量三元组 (1 分枚数, 2 分枚数, 5 分枚数)：共 " + coins.solutions.length + " 组，" + (coins.solutions.length > 12 ? "这里只列前 12 组" : "以下完整列出") + "。每组箭头后是它能排成的序列数：" +
      shown.map(function (s) { return "(" + s.ones + "," + s.twos + "," + s.fives + ") → " + s.orders; }).join("；") + "。全部组合及各自排列数的和，与上方两项结果分别对应。";
    refs.derangementSummary.textContent = n + " 个不同对象的错排：容斥 " + derangements.count + "，递推 " + derangements.recurrence + "；等可能排列下的精确概率 " + derangements.count + "/" + derangements.total + "。与 1/e 的距离严格小于 1/" + derangements.errorBoundDenominator + "；这是误差界，不是实际误差。";
    evidenceTable(doc, refs.derangements, "错排容斥：j=0 从全部排列开始，减去至少一个固定点", ["固定点集合大小 j", "选择集合数 C(n,j)", "交集排列数 (n−j)!", "本阶带符号总项", "累计错排候选数"], derangements.rows.map(function (r) { return [r.j, r.choices, r.intersection, r.signedTerm, r.cumulative]; }));
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || root.getAttribute("data-gcnt-mounted") === "true") return;
    root.setAttribute("data-gcnt-mounted", "true");
    var doc = root.ownerDocument;
    var uid = "gcnt-" + (++INSTANCE);
    var state = { kind: "path", n: 4, length: 2, coefficient: 5, derangementSize: 3, revealed: false, predictions: {}, feedback: "" };
    var refs = { questions: [], uid: uid };
    installStyles(doc);

    var shell = element(doc, "div", { className: "gcnt-lab" });
    shell.appendChild(element(doc, "h3", { text: "组合计数实验：路线、系数与容斥" }));
    shell.appendChild(element(doc, "p", { className: "gcnt-note", text: "先回答三个对象问题，再调整图型、路线、金额和错排规模。整数计数逐项列账；图表可用键盘横向滚动。" }));

    var kindSelect = element(doc, "select", { "aria-label": "图型" });
    kindSelect.appendChild(element(doc, "option", { value: "path", text: "P_n：路径图" }));
    kindSelect.appendChild(element(doc, "option", { value: "complete", text: "K_n：完全图" }));
    kindSelect.appendChild(element(doc, "option", { value: "cycle", text: "C_n：循环图" }));
    kindSelect.appendChild(element(doc, "option", { value: "disconnected", text: "断开图：仅一条边" }));
    var nInput = element(doc, "input", { type: "number", min: "3", max: "7", step: "1", value: "4", "aria-label": "顶点数 n" });
    var lengthInput = element(doc, "input", { type: "number", min: "0", max: "12", step: "1", value: "2", "aria-label": "步长 k" });
    var coefficientInput = element(doc, "input", { type: "number", min: "0", max: "100", step: "1", value: "5", "aria-label": "生成函数系数指标 m" });
    var derangementInput = element(doc, "input", { type: "number", min: "0", max: "12", step: "1", value: "3", "aria-label": "错排规模 d" });
    shell.appendChild(element(doc, "div", { className: "gcnt-controls" }, [
      element(doc, "div", { className: "gcnt-field" }, [element(doc, "label", { htmlFor: uid + "-kind", text: "图型" }), kindSelect]),
      element(doc, "div", { className: "gcnt-field" }, [element(doc, "label", { htmlFor: uid + "-n", text: "顶点数 n（3–7）" }), nInput]),
      element(doc, "div", { className: "gcnt-field" }, [element(doc, "label", { htmlFor: uid + "-length", text: "路线步长 k" }), lengthInput]),
      element(doc, "div", { className: "gcnt-field" }, [element(doc, "label", { htmlFor: uid + "-coefficient", text: "金额 / 系数指标 m（0–100）" }), coefficientInput]),
      element(doc, "div", { className: "gcnt-field" }, [element(doc, "label", { htmlFor: uid + "-derangement", text: "错排规模 d（0–12）" }), derangementInput])
    ]));
    kindSelect.id = uid + "-kind";
    nInput.id = uid + "-n";
    lengthInput.id = uid + "-length";
    coefficientInput.id = uid + "-coefficient";
    derangementInput.id = uid + "-derangement";

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
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", "data-question": predictionSpecs()[questionIndex].key, "data-choice": choice.value, text: choice.label });
        button.addEventListener("click", function () {
          var specs = predictionSpecs();
          state.predictions[specs[questionIndex].key] = choice.value;
          state.feedback = "";
          state.revealed = false;
          render();
        });
        refs.questions[questionIndex].buttons.push({ value: choice.value, label: choice.label, node: button });
        options.appendChild(button);
      });
    }
    shell.appendChild(gate);

    var reveal = element(doc, "button", { type: "button", disabled: true, className: "gcnt-primary", text: "核对预测并揭晓" });
    var reset = element(doc, "button", { type: "button", text: "重置实验" });
    var feedback = element(doc, "p", { className: "gcnt-feedback", "aria-live": "polite" });
    shell.appendChild(element(doc, "div", { className: "gcnt-actions" }, [reveal, reset]));
    shell.appendChild(feedback);

    var result = element(doc, "section", { className: "gcnt-result", hidden: true });
    var resultTitle = element(doc, "h4", { tabindex: "-1", text: "核对计数对象与逐项结果" });
    result.appendChild(resultTitle);
    var svg = svgElement(doc, "svg", { className: "gcnt-svg", role: "img", viewBox: "0 0 620 400" });
    var metrics = element(doc, "div", { className: "gcnt-metrics" });
    var table = element(doc, "div", { className: "gcnt-table-wrap", role: "region", tabindex: "0", "aria-label": "图计数账，左右键滚动" });
    var certificate = element(doc, "p", { className: "gcnt-certificate" });
    result.appendChild(element(doc, "div", { className: "gcnt-frame", role: "region", tabindex: "0", "aria-label": "完整图结构，左右键滚动" }, svg));
    result.appendChild(metrics);
    result.appendChild(table);
    result.appendChild(certificate);
    result.appendChild(element(doc, "h4", { text: "生成函数：同样金额，不同方案空间" }));
    refs.countingSummary = element(doc, "p", { className: "gcnt-note" });
    refs.coins = element(doc, "div", { className: "gcnt-table-wrap", role: "region", tabindex: "0", "aria-label": "逐金额系数账，方向键滚动" });
    refs.solutions = element(doc, "p", { className: "gcnt-certificate" });
    result.appendChild(refs.countingSummary); result.appendChild(refs.coins); result.appendChild(refs.solutions);
    result.appendChild(element(doc, "h4", { text: "容斥：先选固定点集合，再计带符号贡献" }));
    refs.derangementSummary = element(doc, "p", { className: "gcnt-note" });
    refs.derangements = element(doc, "div", { className: "gcnt-table-wrap", role: "region", tabindex: "0", "aria-label": "错排容斥账，方向键滚动" });
    result.appendChild(refs.derangementSummary); result.appendChild(refs.derangements);
    shell.appendChild(result);
    refs.svg = svg;
    refs.metrics = metrics;
    refs.table = table;
    refs.certificate = certificate;
    clear(root);
    root.appendChild(shell);

    function lock() {
      var inputs = [nInput, lengthInput, coefficientInput, derangementInput];
      if (inputs.some(function (input) { return input.value.trim() === "" || !input.checkValidity(); })) {
        state.invalid = true;
        state.feedback = "输入无效：请使用标注范围内的整数；结果已隐藏，未截断或替换你的输入。";
        state.revealed = false; result.hidden = true; feedback.textContent = state.feedback; reveal.disabled = true;
        return;
      }
      var settings = normalizeGraph(kindSelect.value, Number(nInput.value), Number(lengthInput.value), Number(coefficientInput.value));
      state.kind = settings.kind; state.n = settings.n; state.length = settings.length; state.coefficient = settings.coefficient;
      state.derangementSize = integer(Number(derangementInput.value), 0, 12, "derangement size");
      state.invalid = false; state.feedback = ""; render();
    }

    kindSelect.addEventListener("change", lock);
    nInput.addEventListener("change", lock);
    lengthInput.addEventListener("change", lock);
    coefficientInput.addEventListener("change", lock);
    derangementInput.addEventListener("change", lock);
    reset.addEventListener("click", function () {
      state = { kind: "path", n: 4, length: 2, coefficient: 5, derangementSize: 3, revealed: false, predictions: {}, feedback: "" };
      kindSelect.value = "path";
      nInput.value = "4";
      lengthInput.value = "2";
      coefficientInput.value = "5";
      derangementInput.value = "3";
      render();
      refs.questions[0].buttons[0].node.focus();
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
      resultTitle.focus();
      announce(api, root, state.feedback);
    });

    function render() {
      if (state.invalid) { result.hidden = true; reveal.disabled = true; feedback.textContent = "请先修正范围外或非整数输入；保留你输入的内容。"; renderPredictions(state, refs); return; }
      var settings = normalizeGraph(state.kind, state.n, state.length, state.coefficient);
      state.kind = settings.kind;
      state.n = settings.n;
      state.length = settings.length;
      state.coefficient = settings.coefficient;
      kindSelect.value = state.kind;
      nInput.value = String(state.n);
      lengthInput.value = String(state.length);
      coefficientInput.value = String(state.coefficient);
      derangementInput.value = String(state.derangementSize);
      reveal.disabled = state.revealed || !predictionSpecs().every(function (spec) { return state.predictions[spec.key] !== undefined; });
      renderPredictions(state, refs);
      feedback.textContent = state.feedback;
      feedback.className = "gcnt-feedback" + (state.feedback.indexOf("请先") === 0 ? " gcnt-warn" : "");
      result.hidden = !state.revealed;
      if (state.revealed) { renderEvidence(doc, refs, analyzeGraph(state.kind, state.n, state.length, state.coefficient)); renderCounting(doc, refs, state.coefficient, state.derangementSize); }
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
    check(path.simplePaths === 1 && path.walks === 2n, "P4 path versus walk");
    check(path.tree && path.spanningTrees === 1n, "P4 tree certificate");
    check(path.generatingCoefficient === 5n, "Fibonacci generating coefficient");

    var complete = analyzeGraph("complete", 4, 2, 4);
    check(complete.simplePaths === 6 && complete.walks === 9n, "K4 path versus walk");
    check(complete.spanningTrees === 16n && complete.cayley === 16n, "K4 Cayley certificate");
    check(!complete.tree, "K4 is not a tree");

    var cycle = analyzeGraph("cycle", 5, 2, 4);
    check(cycle.handshake && cycle.degreeSum === 10, "C5 handshake");
    check(cycle.simplePaths === 2 && cycle.walks === 4n, "C5 path versus walk");
    check(cycle.spanningTrees === 5n && cycle.cayley === null, "C5 spanning tree boundary");

    var models = ["path", "complete", "cycle"];
    models.forEach(function (kind) {
      var report = analyzeGraph(kind, 3, 0, 0);
      check(report.simplePaths === 1 && report.walks === 1n, kind + " zero length route");
      check(report.matrix.length === 3 && report.edges.length === report.edgeCount, kind + " graph structure");
    });
    return { checks: checks, models: models.length };
  }

  return {
    mount: mount,
    analyzeGraph: analyzeGraph,
    countSimplePaths: countSimplePaths,
    countWalks: countWalks,
    selfTest: selfTest, makeMatrix: makeMatrix, validateMatrix: validateMatrix, edgeList: edgeList, degrees: degrees, isConnected: isConnected, findSimplePath: findSimplePath, determinant: determinant, spanningTreeCount: spanningTreeCount, factorial: factorial, binomial: binomial, fibonacciGeneratingCoefficient: fibonacciGeneratingCoefficient, cayleyCount: cayleyCount, coinLedger: coinLedger, derangementLedger: derangementLedger, drawGraph: drawGraph
  };
});
