(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("graph-certificates", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
    try {
      var report = exported.selfTest();
      process.stdout.write("graph-certificates self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)\n");
    } catch (error) {
      process.stderr.write("graph-certificates self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-graph-certificates-styles";
  var INSTANCE = 0;

  var PRESETS = [
    {
      id: "k4-hamiltonian-no-euler",
      label: "K4：Hamilton 但不 Euler",
      matrix: [[0, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1], [1, 1, 1, 0]],
      layout: [[90, 70], [230, 70], [230, 205], [90, 205]]
    },
    {
      id: "path-4",
      label: "P4：树 + Euler 通路",
      matrix: [[0, 1, 0, 0], [1, 0, 1, 0], [0, 1, 0, 1], [0, 0, 1, 0]],
      layout: [[55, 140], [165, 70], [285, 210], [405, 140]]
    },
    {
      id: "cycle-5",
      label: "C5：Euler + Hamilton",
      matrix: [[0, 1, 0, 0, 1], [1, 0, 1, 0, 0], [0, 1, 0, 1, 0], [0, 0, 1, 0, 1], [1, 0, 0, 1, 0]],
      layout: [[120, 45], [245, 90], [220, 225], [70, 225], [45, 90]]
    },
    {
      id: "k5",
      label: "K5：边数证书直接否平面",
      matrix: [[0, 1, 1, 1, 1], [1, 0, 1, 1, 1], [1, 1, 0, 1, 1], [1, 1, 1, 0, 1], [1, 1, 1, 1, 0]],
      layout: [[135, 35], [255, 85], [225, 220], [75, 220], [45, 85]]
    },
    {
      id: "k33",
      label: "K3,3：二部边数证书否平面",
      matrix: [[0, 0, 0, 1, 1, 1], [0, 0, 0, 1, 1, 1], [0, 0, 0, 1, 1, 1], [1, 1, 1, 0, 0, 0], [1, 1, 1, 0, 0, 0], [1, 1, 1, 0, 0, 0]],
      layout: [[80, 55], [80, 140], [80, 225], [310, 55], [310, 140], [310, 225]]
    },
    {
      id: "petersen",
      label: "Petersen：边数通过但精确否平面",
      matrix: [
        [0, 1, 0, 0, 1, 1, 0, 0, 0, 0],
        [1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 0, 0, 1, 0],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 1, 1],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
        [0, 0, 0, 1, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 1, 1, 0, 0]
      ],
      layout: [[160, 32], [235, 75], [220, 200], [100, 200], [85, 75], [160, 82], [205, 112], [188, 165], [132, 165], [115, 112]]
    }
  ];

  var STYLE_TEXT = [
    ".gcl-lab{--gcl-blue:var(--cl-blue,#315f9d);--gcl-gold:var(--cl-gold,#9b6a12);--gcl-green:var(--cl-green,#39734d);--gcl-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".gcl-lab *,.gcl-lab *::before,.gcl-lab *::after{box-sizing:border-box}.gcl-lab [hidden]{display:none!important}.gcl-lab h3,.gcl-lab h4{margin:0;color:var(--fg);letter-spacing:0}.gcl-lab h3{font-size:1.18rem}.gcl-lab h4{font-size:1rem}.gcl-lab p{margin:.65rem 0}.gcl-note,.gcl-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.gcl-lab button,.gcl-lab select{font:inherit}.gcl-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.gcl-lab button:hover{border-color:var(--gcl-blue)}.gcl-lab button[aria-pressed=true],.gcl-lab button.gcl-primary{border-color:var(--gcl-blue);background:var(--gcl-blue);color:#fff;font-weight:750}.gcl-lab button:focus-visible,.gcl-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.gcl-lab select{width:100%;min-height:44px;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}",
    ".gcl-controls{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:10px;align-items:end;margin:12px 0}.gcl-control label{display:block;color:var(--fg-soft);font-size:13px;margin-bottom:4px}.gcl-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--gcl-gold);background:var(--bg)}.gcl-gate fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.gcl-gate fieldset:last-child{margin-bottom:0}.gcl-gate legend{margin-bottom:7px;font-weight:700;line-height:1.5}.gcl-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.gcl-choice-grid.gcl-wide{grid-template-columns:repeat(4,minmax(0,1fr))}.gcl-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.gcl-actions>*{flex:1 1 180px}.gcl-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.gcl-warn{color:var(--gcl-red)}.gcl-pass{color:var(--gcl-green)}.gcl-result{margin-top:14px}.gcl-layout{display:grid;grid-template-columns:minmax(210px,.8fr) minmax(0,1.5fr);gap:14px;align-items:start}.gcl-frame{border:1px solid var(--border);background:var(--bg);padding:6px;min-width:0}.gcl-svg{display:block;width:100%;height:auto}.gcl-svg text{font-family:inherit;fill:var(--fg-soft,#6f6a60);font-size:12px}.gcl-svg .gcl-axis{stroke:var(--border);stroke-width:1}.gcl-svg .gcl-edge{stroke:var(--gcl-blue);stroke-width:2}.gcl-svg .gcl-node{fill:var(--bg);stroke:var(--gcl-gold);stroke-width:2}.gcl-svg .gcl-node-label{fill:var(--fg);font-weight:700;text-anchor:middle;dominant-baseline:middle}.gcl-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}.gcl-metric{min-width:0;border-top:2px solid var(--gcl-blue);padding:7px 8px;background:var(--bg)}.gcl-metric span{display:block;color:var(--fg-soft);font-size:12px}.gcl-metric strong{display:block;font-size:1.05rem;overflow-wrap:anywhere}.gcl-table-wrap{overflow-x:auto;max-width:100%;margin-top:12px}.gcl-table{border-collapse:collapse;width:100%;min-width:680px;font-size:12px}.gcl-table caption{text-align:left;color:var(--fg-soft);padding:5px 0}.gcl-table th,.gcl-table td{border:1px solid var(--border);padding:6px 7px;text-align:left;vertical-align:top}.gcl-table th{background:var(--block-bg);color:var(--fg)}.gcl-certificate{border-left:3px solid var(--gcl-green);padding-left:10px;font-size:13px}.gcl-certificate.gcl-blocked{border-color:var(--gcl-red)}",
    "@media(max-width:760px){.gcl-layout{grid-template-columns:minmax(0,1fr)}.gcl-choice-grid.gcl-wide{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:500px){.gcl-controls{grid-template-columns:minmax(0,1fr)}.gcl-choice-grid,.gcl-choice-grid.gcl-wide,.gcl-actions{grid-template-columns:minmax(0,1fr);display:grid}.gcl-actions>*{width:100%}.gcl-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.gcl-frame{padding:3px}}@media(prefers-reduced-motion:reduce){.gcl-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
  ].join("");

  function assert(condition, message) {
    if (!condition) throw new Error("graph-certificates self-test: " + message);
  }

  function cloneMatrix(matrix) {
    return matrix.map(function (row) { return row.slice(); });
  }

  function clonePreset(preset) {
    return { id: preset.id, label: preset.label, matrix: cloneMatrix(preset.matrix), layout: preset.layout.map(function (point) { return point.slice(); }) };
  }

  function validateAdjacency(matrix) {
    var errors = [];
    if (!Array.isArray(matrix) || matrix.length === 0) return { valid: false, errors: ["matrix must be a nonempty array"] };
    var n = matrix.length;
    matrix.forEach(function (row, i) {
      if (!Array.isArray(row) || row.length !== n) { errors.push("row " + i + " is not square"); return; }
      row.forEach(function (value, j) {
        if (value !== 0 && value !== 1) errors.push("entry " + i + "," + j + " is not 0/1");
        if (i === j && value !== 0) errors.push("diagonal entry " + i + " is not zero");
        if (matrix[j] && matrix[j][i] !== value) errors.push("matrix is not symmetric at " + i + "," + j);
      });
    });
    return { valid: errors.length === 0, errors: errors, n: n };
  }

  function edgeList(matrix) {
    var edges = [];
    for (var i = 0; i < matrix.length; i += 1) {
      for (var j = i + 1; j < matrix.length; j += 1) if (matrix[i][j] === 1) edges.push([i, j]);
    }
    return edges;
  }

  function degreeSequence(matrix) {
    return matrix.map(function (row) { return row.reduce(function (sum, value) { return sum + value; }, 0); });
  }

  function components(matrix) {
    var n = matrix.length, seen = [], result = [];
    for (var start = 0; start < n; start += 1) {
      if (seen[start]) continue;
      var queue = [start], component = [], head = 0;
      seen[start] = true;
      while (head < queue.length) {
        var vertex = queue[head++];
        component.push(vertex);
        for (var next = 0; next < n; next += 1) {
          if (matrix[vertex][next] === 1 && !seen[next]) { seen[next] = true; queue.push(next); }
        }
      }
      result.push(component);
    }
    return result;
  }

  function activeComponents(matrix) {
    var active = matrix.map(function (row) { return row.some(function (value) { return value === 1; }); });
    var all = components(matrix), result = [];
    all.forEach(function (component) {
      var filtered = component.filter(function (vertex) { return active[vertex]; });
      if (filtered.length) result.push(filtered);
    });
    return result;
  }

  function hasCycle(matrix) {
    var n = matrix.length, seen = [];
    function visit(vertex, parent) {
      seen[vertex] = true;
      for (var next = 0; next < n; next += 1) {
        if (matrix[vertex][next] !== 1) continue;
        if (!seen[next]) { if (visit(next, vertex)) return true; }
        else if (next !== parent) return true;
      }
      return false;
    }
    for (var i = 0; i < n; i += 1) if (!seen[i] && visit(i, -1)) return true;
    return false;
  }

  function isBipartite(matrix) {
    var color = [], n = matrix.length;
    for (var start = 0; start < n; start += 1) {
      if (color[start] !== undefined) continue;
      color[start] = 0;
      var queue = [start], head = 0;
      while (head < queue.length) {
        var vertex = queue[head++];
        for (var next = 0; next < n; next += 1) {
          if (matrix[vertex][next] !== 1) continue;
          if (color[next] === undefined) { color[next] = 1 - color[vertex]; queue.push(next); }
          else if (color[next] === color[vertex]) return { bipartite: false, colors: color };
        }
      }
    }
    return { bipartite: true, colors: color };
  }

  function eulerCertificate(matrix) {
    var degrees = degreeSequence(matrix), odd = [];
    degrees.forEach(function (degree, index) { if (degree % 2 === 1) odd.push(index); });
    var active = activeComponents(matrix);
    var connectedOnEdges = active.length <= 1;
    var circuit = connectedOnEdges && odd.length === 0;
    var trail = connectedOnEdges && (odd.length === 0 || odd.length === 2);
    return { oddVertices: odd, oddCount: odd.length, activeComponents: active, connectedOnEdges: connectedOnEdges, hasCircuit: circuit, hasTrail: trail, trailOddCountCondition: odd.length === 0 || odd.length === 2 };
  }

  function hamiltonianCycle(matrix) {
    var n = matrix.length;
    if (n < 3) return { exists: false, path: [] };
    var path = [0], used = [];
    used[0] = true;
    function search() {
      if (path.length === n) return matrix[path[path.length - 1]][0] === 1;
      var previous = path[path.length - 1];
      for (var next = 1; next < n; next += 1) {
        if (used[next] || matrix[previous][next] !== 1) continue;
        used[next] = true; path.push(next);
        if (search()) return true;
        path.pop(); used[next] = false;
      }
      return false;
    }
    return { exists: search(), path: searchFoundPath(path, matrix, used) };
  }

  function searchFoundPath(path, matrix, used) {
    if (path.length === matrix.length && matrix[path[path.length - 1]][0] === 1) return path.slice();
    var n = matrix.length, answer = null;
    function visit() {
      if (path.length === n) { if (matrix[path[path.length - 1]][0] === 1) answer = path.slice(); return; }
      if (answer) return;
      var previous = path[path.length - 1];
      for (var next = 1; next < n && !answer; next += 1) {
        if (used[next] || matrix[previous][next] !== 1) continue;
        used[next] = true; path.push(next); visit(); path.pop(); used[next] = false;
      }
    }
    visit();
    return answer || [];
  }

  function cyclicOrders(neighbors) {
    if (neighbors.length <= 2) return [neighbors.slice()];
    var first = neighbors[0], rest = neighbors.slice(1), orders = [];
    function permute(prefix, remaining) {
      if (!remaining.length) { orders.push([first].concat(prefix)); return; }
      remaining.forEach(function (value, index) {
        var nextRemaining = remaining.slice(0, index).concat(remaining.slice(index + 1));
        permute(prefix.concat([value]), nextRemaining);
      });
    }
    permute([], rest);
    return orders;
  }

  function faceCount(matrix, vertices, rotations) {
    var ids = {}, nextDart = [], dartCount = 0;
    vertices.forEach(function (from) {
      vertices.forEach(function (to) {
        if (matrix[from][to] === 1) { ids[from + ":" + to] = dartCount; dartCount += 1; }
      });
    });
    var rotationByVertex = {};
    var positionByVertex = {};
    vertices.forEach(function (vertex, index) { rotationByVertex[vertex] = rotations[index]; });
    vertices.forEach(function (vertex) {
      positionByVertex[vertex] = {};
      rotationByVertex[vertex].forEach(function (neighbor, index) { positionByVertex[vertex][neighbor] = index; });
    });
    vertices.forEach(function (from) {
      rotationByVertex[from].forEach(function (to) {
        var order = rotationByVertex[to], incomingPosition = positionByVertex[to][from];
        var nextNeighbor = order[(incomingPosition - 1 + order.length) % order.length];
        nextDart[ids[from + ":" + to]] = ids[to + ":" + nextNeighbor];
      });
    });
    var seen = [], faces = 0;
    for (var dart = 0; dart < dartCount; dart += 1) {
      if (seen[dart]) continue;
      faces += 1;
      var current = dart;
      while (!seen[current]) { seen[current] = true; current = nextDart[current]; }
    }
    return faces;
  }

  function connectedPlanarity(matrix, vertices) {
    var n = vertices.length, e = 0;
    vertices.forEach(function (from, index) { for (var j = index + 1; j < vertices.length; j += 1) if (matrix[from][vertices[j]] === 1) e += 1; });
    var bipartite = isBipartite(inducedMatrix(matrix, vertices)).bipartite;
    var simpleBound = n < 3 || e <= 3 * n - 6;
    var bipartiteBound = !bipartite || n < 3 || e <= 2 * n - 4;
    if (!simpleBound || !bipartiteBound) {
      return { planar: false, exact: true, method: "necessary-edge-bound", vertices: vertices.slice(), edges: e, faces: null, eulerCharacteristic: null, simpleBoundPassed: simpleBound, bipartiteBoundPassed: bipartiteBound };
    }
    if (n <= 2) return { planar: true, exact: true, method: "trivial-embedding", vertices: vertices.slice(), edges: e, faces: 1, eulerCharacteristic: n - e + 1, simpleBoundPassed: simpleBound, bipartiteBoundPassed: bipartiteBound };
    var options = vertices.map(function (vertex) {
      var neighbors = vertices.filter(function (neighbor) { return matrix[vertex][neighbor] === 1; });
      return cyclicOrders(neighbors);
    });
    var selected = [], found = null;
    function enumerate(index) {
      if (found) return;
      if (index === vertices.length) {
        var faces = faceCount(matrix, vertices, selected), characteristic = n - e + faces;
        if (characteristic === 2) found = { rotations: selected.map(function (order) { return order.slice(); }), faces: faces, characteristic: characteristic };
        return;
      }
      options[index].forEach(function (order) {
        if (found) return;
        selected[index] = order;
        enumerate(index + 1);
      });
    }
    enumerate(0);
    return {
      planar: !!found,
      exact: true,
      method: "exhaustive-rotation-system",
      vertices: vertices.slice(),
      edges: e,
      faces: found ? found.faces : null,
      eulerCharacteristic: found ? found.characteristic : null,
      rotations: found ? found.rotations : null,
      simpleBoundPassed: simpleBound,
      bipartiteBoundPassed: bipartiteBound
    };
  }

  function inducedMatrix(matrix, vertices) {
    return vertices.map(function (from) { return vertices.map(function (to) { return matrix[from][to]; }); });
  }

  function planarityCertificate(matrix) {
    var validation = validateAdjacency(matrix);
    if (!validation.valid) return { planar: false, exact: false, method: "invalid-adjacency", errors: validation.errors };
    var componentResults = components(matrix).map(function (vertexSet) { return connectedPlanarity(matrix, vertexSet); });
    var planar = componentResults.every(function (result) { return result.planar; });
    var firstBoundFailure = componentResults.filter(function (result) { return result.method === "necessary-edge-bound"; })[0];
    return {
      planar: planar,
      exact: true,
      method: firstBoundFailure ? "necessary-edge-bound" : "exhaustive-rotation-system",
      componentResults: componentResults,
      simpleEdgeBoundPassed: componentResults.every(function (result) { return result.simpleBoundPassed; }),
      bipartiteEdgeBoundPassed: componentResults.every(function (result) { return result.bipartiteBoundPassed; }),
      certificate: planar ? "每个连通分量都有球面旋转系统，满足 V-E+F=2。" : (firstBoundFailure ? "某个连通分量违反简单图或二部图的必要边数上界。" : "所有循环邻接顺序都未给出 V-E+F=2；有限穷举否证平面嵌入。")
    };
  }

  function analyzeGraph(matrix) {
    var validation = validateAdjacency(matrix);
    if (!validation.valid) return { validation: validation, matrix: Array.isArray(matrix) ? cloneMatrix(matrix) : [] };
    var degrees = degreeSequence(matrix), edges = edgeList(matrix), comps = components(matrix), euler = eulerCertificate(matrix), hamilton = hamiltonianCycle(matrix), bip = isBipartite(matrix), planarity = planarityCertificate(matrix), n = matrix.length;
    var connected = comps.length === 1;
    var tree = { isTree: connected && edges.length === n - 1 && !hasCycle(matrix), connected: connected, edgeCount: edges.length, expectedEdges: Math.max(0, n - 1), acyclic: !hasCycle(matrix) };
    var dirac = { applicable: n >= 3, minimumDegree: Math.min.apply(null, degrees), sufficient: n >= 3 && 2 * Math.min.apply(null, degrees) >= n, role: "充分条件；失败不构成否证" };
    var relation = hamilton.exists ? (euler.hasCircuit ? "both" : "hamilton-only") : (euler.hasCircuit ? "euler-only" : "neither");
    var ledger = [
      { check: "邻接矩阵", result: validation.valid ? "通过" : "失败", role: "定义", evidence: "简单无向图：方阵、0/1、对称、对角为 0。" },
      { check: "度 / 握手", result: degrees.join(", ") + "；2E=" + (2 * edges.length), role: "度和为偶是必要条件", evidence: "\u03a3deg=2|E|；必要不充分。" },
      { check: "连通", result: connected ? "是" : "否", role: "精确 BFS/DFS", evidence: comps.length + " 个连通分量：" + comps.map(function (part) { return "{" + part.join(",") + "}"; }).join(" ") },
      { check: "树", result: tree.isTree ? "是" : "否", role: "连通 + E=n-1 为充要", evidence: "E=" + edges.length + "，n-1=" + Math.max(0, n - 1) + "；无圈=" + (tree.acyclic ? "是" : "否") },
      { check: "Euler", result: euler.hasCircuit ? "回路" : (euler.hasTrail ? "仅通路" : "无通路/回路"), role: "奇度数判据为充要", evidence: "奇度顶点=" + (euler.oddVertices.length ? euler.oddVertices.join(",") : "0 个") + "；通路要求奇点数为0或2；边支撑连通=" + (euler.connectedOnEdges ? "是" : "否") },
      { check: "Hamilton", result: hamilton.exists ? "有回路" : "无回路", role: "有限回溯精确搜索", evidence: hamilton.exists ? "证书路径 " + hamilton.path.join("→") + "→0" : "完整有限搜索未找到闭合顶点序列" },
      { check: "平面性边数筛子", result: planarity.simpleEdgeBoundPassed && planarity.bipartiteEdgeBoundPassed ? "通过" : "失败" , role: "必要条件；通过不充分", evidence: "最终结论交给精确旋转系统/边界证书。" },
      { check: "平面性", result: planarity.planar ? "平面" : "非平面", role: "有限精确证书", evidence: planarity.certificate },
      { check: "Dirac", result: dirac.sufficient ? "条件满足" : "条件不满足", role: dirac.role, evidence: "2δ=" + (2 * dirac.minimumDegree) + " 与 n=" + n + " 比较" }
    ];
    return {
      validation: validation,
      matrix: cloneMatrix(matrix),
      n: n,
      edges: edges,
      degrees: degrees,
      degreeSum: degrees.reduce(function (sum, value) { return sum + value; }, 0),
      components: comps,
      connected: connected,
      tree: tree,
      euler: euler,
      hamiltonian: hamilton,
      hamiltonEulerRelation: relation,
      bipartite: bip.bipartite,
      bipartiteColors: bip.colors,
      dirac: dirac,
      planarity: planarity,
      ledger: ledger
    };
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) if (PRESETS[index].id === id) return PRESETS[index];
    return PRESETS[0];
  }

  function formatNumber(value, digits) {
    return Number(value).toFixed(digits === undefined ? 2 : digits);
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
  function metric(doc, label) { var value = element(doc, "strong", { text: "—" }); return { node: element(doc, "div", { className: "gcl-metric" }, [element(doc, "span", { text: label }), value]), value: value }; }

  function questionSpecs(result) {
    var relationLabel = result.hamiltonEulerRelation === "both" ? "两者都有" : (result.hamiltonEulerRelation === "hamilton-only" ? "Hamilton 但不 Euler" : (result.hamiltonEulerRelation === "euler-only" ? "Euler 但不 Hamilton" : "两者都没有"));
    return [
      { key: "euler", prompt: "当前图有 Euler 回路吗？", expected: result.euler.hasCircuit ? "yes" : "no", choices: [{ value: "yes", label: "有" }, { value: "no", label: "没有" }] },
      { key: "relation", prompt: "当前图的 Hamilton / Euler 关系是？", expected: result.hamiltonEulerRelation, choices: [{ value: "both", label: "两者都有" }, { value: "hamilton-only", label: "Hamilton 但不 Euler" }, { value: "euler-only", label: "Euler 但不 Hamilton" }, { value: "neither", label: "两者都没有" }], answerLabel: relationLabel },
      { key: "necessary", prompt: "边数必要上界通过，能否单独证明平面？", expected: "no", choices: [{ value: "yes", label: "能" }, { value: "no", label: "不能，还需精确证书" }] }
    ];
  }

  function renderPredictions(state, refs, result) {
    var specs = questionSpecs(result);
    refs.questions.forEach(function (questionRef, index) {
      var spec = specs[index];
      questionRef.legend.textContent = spec.prompt;
      questionRef.buttons.forEach(function (buttonRef) {
        var selected = state.predictions[spec.key] === buttonRef.value;
        buttonRef.node.setAttribute("aria-pressed", selected ? "true" : "false");
        if (state.revealed) {
          var correct = buttonRef.value === spec.expected;
          buttonRef.node.textContent = (correct ? "✓ " : "") + buttonRef.label;
          buttonRef.node.className = correct ? "gcl-pass" : (selected ? "gcl-warn" : "");
        } else { buttonRef.node.textContent = buttonRef.label; buttonRef.node.className = ""; }
      });
    });
  }

  function drawGraph(doc, svg, preset, result, uid) {
    clear(svg);
    var points = preset.layout, markerId = uid + "-arrow";
    svg.appendChild(svgElement(doc, "title", { id: uid + "-svg-title", text: preset.label + " 图结构与证书" }));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-svg-desc", text: "节点和边显示有限图；下面的账本给出连通、Euler、Hamilton 与平面性证书。" }));
    var defs = svgElement(doc, "defs", {});
    var marker = svgElement(doc, "marker", { id: markerId, markerWidth: "7", markerHeight: "7", refX: "6", refY: "3.5", orient: "auto", markerUnits: "strokeWidth" });
    marker.appendChild(svgElement(doc, "path", { d: "M0,0 L7,3.5 L0,7 z", fill: "var(--gcl-blue,#315f9d)" })); defs.appendChild(marker); svg.appendChild(defs);
    result.edges.forEach(function (edge) {
      var from = points[edge[0]], to = points[edge[1]];
      svg.appendChild(svgElement(doc, "line", { x1: from[0], y1: from[1], x2: to[0], y2: to[1], class: "gcl-edge" }));
    });
    points.forEach(function (point, index) {
      svg.appendChild(svgElement(doc, "circle", { cx: point[0], cy: point[1], r: "17", class: "gcl-node" }));
      svg.appendChild(svgElement(doc, "text", { x: point[0], y: point[1], class: "gcl-node-label" }, String(index)));
      svg.appendChild(svgElement(doc, "text", { x: point[0], y: point[1] + 30, class: "gcl-small" }, "d=" + result.degrees[index]));
    });
    svg.appendChild(svgElement(doc, "text", { x: "16", y: "282", class: "gcl-small" }, result.planarity.planar ? "平面性：精确证书通过" : "平面性：精确证书否定"));
    svg.setAttribute("viewBox", "0 0 440 310");
  }

  function renderLedger(doc, hostNode, result) {
    var body = element(doc, "tbody", {});
    result.ledger.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row.check }), element(doc, "td", { text: row.result }), element(doc, "td", { text: row.role }), element(doc, "td", { text: row.evidence })]));
    });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", { className: "gcl-table" }, [
      element(doc, "caption", { text: "有限图证书账本：结论与逻辑强度分栏" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { scope: "col", text: "检查" }), element(doc, "th", { scope: "col", text: "结果" }), element(doc, "th", { scope: "col", text: "逻辑角色" }), element(doc, "th", { scope: "col", text: "证据" })])]), body
    ]));
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument, uid = "gcl-" + (++INSTANCE), state = { presetId: PRESETS[0].id, revealed: false, predictions: {}, feedback: "" }, refs = { questions: [] };
    installStyles(doc);
    var shell = element(doc, "div", { className: "gcl-lab" });
    shell.appendChild(element(doc, "h3", { text: "图证书实验：边、点、面各有自己的判据" }));
    shell.appendChild(element(doc, "p", { className: "gcl-note", text: "固定的有限简单无向图；先预测，再打开精确账本。启发式失败会保留为未决，不伪装成否证。" }));
    var presetSelect = element(doc, "select", { "aria-label": "图论教学预设" });
    PRESETS.forEach(function (preset) { presetSelect.appendChild(element(doc, "option", { value: preset.id, text: preset.label })); });
    var presetControl = element(doc, "div", { className: "gcl-control" }, [element(doc, "label", { text: "图预设" }), presetSelect]);
    var reset = element(doc, "button", { type: "button", text: "重置预测" });
    shell.appendChild(element(doc, "div", { className: "gcl-controls" }, [presetControl, reset]));
    var gate = element(doc, "div", { className: "gcl-gate" });
    questionSpecs(analyzeGraph(PRESETS[0].matrix)).forEach(function (spec) {
      var fieldset = element(doc, "fieldset", {}), legend = element(doc, "legend", { text: spec.prompt }), grid = element(doc, "div", { className: "gcl-choice-grid" + (spec.choices.length === 4 ? " gcl-wide" : "") }), questionRef = { key: spec.key, legend: legend, buttons: [] };
      spec.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); });
        questionRef.buttons.push({ value: choice.value, label: choice.label, node: button }); grid.appendChild(button);
      });
      fieldset.appendChild(legend); fieldset.appendChild(grid); gate.appendChild(fieldset); refs.questions.push(questionRef);
    });
    shell.appendChild(gate);
    var actions = element(doc, "div", { className: "gcl-actions" });
    var reveal = element(doc, "button", { type: "button", className: "gcl-primary", text: "核对预测并揭晓" });
    var feedback = element(doc, "p", { className: "gcl-feedback", "aria-live": "polite" });
    actions.appendChild(reveal); shell.appendChild(actions); shell.appendChild(feedback);
    var resultShell = element(doc, "div", { className: "gcl-result", hidden: true });
    var svg = svgElement(doc, "svg", { className: "gcl-svg", role: "img", "aria-labelledby": uid + "-svg-title " + uid + "-svg-desc", viewBox: "0 0 440 310" });
    svg.appendChild(svgElement(doc, "title", { id: uid + "-svg-title", text: "图结构可视化" }));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-svg-desc", text: "显示顶点、边和每个顶点的度。" }));
    var metricsHost = element(doc, "div", { className: "gcl-metrics" }), tableHost = element(doc, "div", { className: "gcl-table-wrap" }), certificate = element(doc, "p", { className: "gcl-certificate" });
    resultShell.appendChild(element(doc, "div", { className: "gcl-layout" }, [element(doc, "div", { className: "gcl-frame" }, [svg]), element(doc, "div", {}, [metricsHost, certificate])]));
    resultShell.appendChild(tableHost); shell.appendChild(resultShell); clear(root); root.appendChild(shell);

    function lock(presetId) { state.presetId = presetId; state.revealed = false; state.predictions = {}; state.feedback = ""; render(); }
    presetSelect.addEventListener("change", function () { lock(presetSelect.value); });
    reset.addEventListener("click", function () { state = { presetId: PRESETS[0].id, revealed: false, predictions: {}, feedback: "" }; render(); announce(api, root, "图证书预测已重置。"); });
    reveal.addEventListener("click", function () {
      var result = analyzeGraph(presetById(state.presetId).matrix), specs = questionSpecs(result);
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测。"; render(); return; }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中；现在逐行读证书的逻辑角色。"; render(); announce(api, root, state.feedback);
    });
    function render() {
      var preset = presetById(state.presetId), result = analyzeGraph(preset.matrix);
      presetSelect.value = preset.id; renderPredictions(state, refs, result); feedback.textContent = state.feedback || ""; feedback.className = "gcl-feedback" + (state.feedback.indexOf("请先") === 0 ? " gcl-warn" : ""); resultShell.hidden = !state.revealed;
      if (!state.revealed) return;
      drawGraph(doc, svg, preset, result, uid);
      var metrics = [metric(doc, "顶点 / 边"), metric(doc, "连通分量"), metric(doc, "Euler"), metric(doc, "Hamilton"), metric(doc, "树"), metric(doc, "平面性")];
      clear(metricsHost); metrics.forEach(function (item) { metricsHost.appendChild(item.node); });
      metrics[0].value.textContent = result.n + " / " + result.edges.length; metrics[1].value.textContent = String(result.components.length); metrics[2].value.textContent = result.euler.hasCircuit ? "回路" : (result.euler.hasTrail ? "通路" : "无"); metrics[3].value.textContent = result.hamiltonian.exists ? "有回路" : "无回路"; metrics[4].value.textContent = result.tree.isTree ? "是" : "否"; metrics[5].value.textContent = result.planarity.planar ? "平面" : "非平面";
      certificate.className = "gcl-certificate" + (result.planarity.planar ? "" : " gcl-blocked"); certificate.textContent = result.planarity.certificate + " 当前边数筛子" + (result.planarity.simpleEdgeBoundPassed && result.planarity.bipartiteEdgeBoundPassed ? "通过，但它不是平面性证明。" : "失败，已经给出非平面必要证书。");
      renderLedger(doc, tableHost, result);
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { assert(condition, message); checks += 1; }
    check(validateAdjacency(PRESETS[0].matrix).valid, "K4 adjacency validation");
    PRESETS.forEach(function (preset) {
      var result = analyzeGraph(preset.matrix);
      check(result.validation.valid, preset.id + " valid adjacency");
      check(result.degreeSum === 2 * result.edges.length, preset.id + " handshake");
      check(result.planarity.exact, preset.id + " exact planarity status");
      check(result.ledger.length >= 8, preset.id + " substantive ledger");
    });
    var k4 = analyzeGraph(presetById("k4-hamiltonian-no-euler").matrix);
    check(k4.hamiltonian.exists, "K4 Hamilton cycle");
    check(!k4.euler.hasCircuit && !k4.euler.hasTrail, "K4 has no Euler trail");
    check(k4.hamiltonEulerRelation === "hamilton-only", "K4 counterexample relation");
    check(k4.planarity.planar && k4.planarity.componentResults[0].faces === 4, "K4 planar face certificate");
    var path = analyzeGraph(presetById("path-4").matrix);
    check(path.tree.isTree, "P4 tree certificate");
    check(path.euler.hasTrail && !path.euler.hasCircuit && path.euler.oddCount === 2, "P4 Euler trail certificate");
    var cycle = analyzeGraph(presetById("cycle-5").matrix);
    check(cycle.euler.hasCircuit && cycle.euler.hasTrail && cycle.euler.oddCount === 0 && cycle.hamiltonian.exists, "C5 Euler and Hamilton");
    var k5 = analyzeGraph(presetById("k5").matrix);
    check(!k5.planarity.planar && k5.planarity.method === "necessary-edge-bound", "K5 edge bound nonplanarity");
    var k33 = analyzeGraph(presetById("k33").matrix);
    check(!k33.planarity.planar && !k33.planarity.bipartiteEdgeBoundPassed, "K3,3 bipartite bound nonplanarity");
    var petersen = analyzeGraph(presetById("petersen").matrix);
    check(petersen.planarity.simpleEdgeBoundPassed, "Petersen simple edge bound passes");
    check(!petersen.planarity.planar && petersen.planarity.method === "exhaustive-rotation-system", "Petersen exact rotation denial");
    check(!petersen.hamiltonian.exists, "Petersen finite Hamilton search");
    check(!analyzeGraph([[0, 1], [0, 0]]).validation.valid, "asymmetric graph rejected");
    return { ok: true, checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS.map(clonePreset),
    validateAdjacency: validateAdjacency,
    edgeList: edgeList,
    degreeSequence: degreeSequence,
    components: components,
    eulerCertificate: eulerCertificate,
    hamiltonianCycle: hamiltonianCycle,
    planarityCertificate: planarityCertificate,
    analyzeGraph: analyzeGraph,
    selfTest: selfTest,
    mount: mount
  };
});
