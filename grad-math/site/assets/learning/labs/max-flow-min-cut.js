(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("max-flow-min-cut", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("max-flow-min-cut self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("max-flow-min-cut self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-max-flow-min-cut-styles";
  var SERIAL = 0;
  var EPS = 1e-10;

  var EDGE_META = [
    { id: "sa", from: "s", to: "a", label: "s -> a" },
    { id: "ab", from: "a", to: "b", label: "a -> b" },
    { id: "bt", from: "b", to: "t", label: "b -> t" },
    { id: "sb", from: "s", to: "b", label: "s -> b" },
    { id: "at", from: "a", to: "t", label: "a -> t" }
  ];

  var PRESETS = [
    {
      id: "reroute",
      label: "反向边救场",
      note: "DFS 先走 s-a-b-t，第二步必须撤回 a-b 才能达到 2。",
      capacities: { sa: 1, ab: 1, bt: 1, sb: 1, at: 1 }
    },
    {
      id: "source-cut",
      label: "源侧瓶颈",
      note: "源流出的总容量是 3；下游再宽也无法超过它。",
      capacities: { sa: 2, ab: 1, bt: 4, sb: 1, at: 4 }
    },
    {
      id: "sink-cut",
      label: "汇侧瓶颈",
      note: "进入 t 的容量只有 3；上游扩容不会自动提高吞吐。",
      capacities: { sa: 4, ab: 1, bt: 2, sb: 4, at: 1 }
    },
    {
      id: "balanced",
      label: "菱形网络",
      note: "经典 3/2/1/2/3 容量例，最大流与两侧割都等于 5。",
      capacities: { sa: 3, ab: 1, bt: 3, sb: 2, at: 2 }
    }
  ];

  var STYLE_TEXT = [
    ".mf-lab{--mf-blue:var(--cl-blue,#315f9d);--mf-gold:var(--cl-gold,#95670d);--mf-green:var(--cl-green,#347247);--mf-red:var(--cl-red,#b13d32);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".mf-lab *,.mf-lab *::before,.mf-lab *::after{box-sizing:border-box;}",
    ".mf-lab [hidden]{display:none!important;}",
    ".mf-lab h3,.mf-lab h4{margin:0;color:var(--fg);letter-spacing:0;}",
    ".mf-lab h3{font-size:1.16rem;}.mf-lab h4{margin-top:16px;font-size:1rem;}",
    ".mf-lab .mf-intro,.mf-lab .mf-note,.mf-lab .mf-feedback,.mf-lab .mf-status{color:var(--fg-soft);font-size:13px;overflow-wrap:anywhere;}",
    ".mf-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.mf-lab legend{margin-bottom:9px;font-weight:750;}",
    ".mf-lab .mf-question{margin:12px 0 6px;font-size:13px;font-weight:700;}",
    ".mf-lab .mf-choice-row,.mf-lab .mf-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".mf-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}",
    ".mf-lab button:hover{border-color:var(--accent);}.mf-lab button:focus-visible,.mf-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".mf-lab button[aria-pressed=true],.mf-lab button.mf-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}",
    ".mf-lab button:disabled{cursor:not-allowed;opacity:.55;}",
    ".mf-lab .mf-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.mf-lab .mf-actions>*{flex:1 1 150px;}",
    ".mf-lab .mf-feedback{min-height:2em;margin:8px 0;font-weight:700;}.mf-lab .mf-pass{color:var(--mf-green);}.mf-lab .mf-warn{color:var(--mf-red);}",
    ".mf-lab .mf-revealed{margin-top:16px;padding-top:16px;border-top:1px solid var(--border);}",
    ".mf-lab .mf-layout{display:grid;grid-template-columns:minmax(215px,.66fr) minmax(0,1.34fr);gap:16px;align-items:start;min-width:0;}",
    ".mf-lab .mf-controls,.mf-lab .mf-stage{min-width:0;}.mf-lab .mf-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}",
    ".mf-lab .mf-presets{grid-template-columns:repeat(2,minmax(0,1fr));}.mf-lab .mf-presets button{font-size:12px;}",
    ".mf-lab .mf-control{display:grid;gap:5px;}.mf-lab .mf-control label{font-size:13px;font-weight:700;color:var(--fg-soft);}.mf-lab .mf-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".mf-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".mf-lab .mf-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}",
    ".mf-lab .mf-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.mf-lab .mf-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}",
    ".mf-lab .mf-edge{stroke:var(--mf-blue);stroke-width:2.3;fill:none;}.mf-lab .mf-edge.mf-cut{stroke:var(--mf-red);stroke-width:3.2;}.mf-lab .mf-edge.mf-path{stroke:var(--mf-gold);stroke-width:4;}",
    ".mf-lab .mf-reverse{stroke:var(--mf-gold);stroke-width:3.4;stroke-dasharray:6 4;fill:none;}.mf-lab .mf-node{fill:var(--bg);stroke:var(--mf-blue);stroke-width:2.3;}.mf-lab .mf-node.mf-reachable{stroke:var(--mf-green);stroke-width:4;}",
    ".mf-lab .mf-node-label{font-size:15px;font-weight:800;text-anchor:middle;dominant-baseline:middle;}.mf-lab .mf-edge-label{font-size:12px;font-weight:700;text-anchor:middle;paint-order:stroke;stroke:var(--bg);stroke-width:5px;stroke-linejoin:round;}.mf-lab .mf-residual-label{font-size:10.5px;text-anchor:middle;fill:var(--fg-soft)!important;paint-order:stroke;stroke:var(--bg);stroke-width:4px;}",
    ".mf-lab .mf-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0;}.mf-lab .mf-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.mf-lab .mf-metric:nth-child(1){border-color:var(--mf-blue);}.mf-lab .mf-metric:nth-child(2){border-color:var(--mf-gold);}.mf-lab .mf-metric:nth-child(3),.mf-lab .mf-metric:nth-child(4){border-color:var(--mf-green);}",
    ".mf-lab .mf-metric span{display:block;color:var(--fg-soft);font-size:11.5px;}.mf-lab .mf-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".mf-lab .mf-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}.mf-lab table{width:100%;min-width:690px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.mf-lab th,.mf-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.mf-lab th{color:var(--fg-soft);font-size:11.5px;}",
    ".mf-lab .mf-history{margin:8px 0 0;padding-left:20px;font-size:12.5px;color:var(--fg-soft);}.mf-lab .mf-history li{margin:4px 0;}.mf-lab .mf-certificate{margin-top:10px;padding:10px 12px;border-left:3px solid var(--mf-green);background:var(--bg);font-size:13px;overflow-wrap:anywhere;}",
    "@media(max-width:1180px){.mf-lab .mf-layout{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:680px){.mf-lab .mf-choice-row{grid-template-columns:minmax(0,1fr);}.mf-lab .mf-presets{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:420px){.mf-lab .mf-frame{padding:4px;}.mf-lab table{font-size:11.5px;}.mf-lab th,.mf-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.mf-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function cloneObject(source) {
    var target = {};
    Object.keys(source || {}).forEach(function (key) { target[key] = source[key]; });
    return target;
  }

  function presetById(id) {
    var found = PRESETS.filter(function (preset) { return preset.id === id; })[0];
    if (!found) throw new RangeError("unknown preset: " + id);
    return found;
  }

  function makeConfig(presetOrId) {
    var preset = typeof presetOrId === "string" ? presetById(presetOrId) : presetOrId;
    return { id: preset.id, label: preset.label, note: preset.note, capacities: cloneObject(preset.capacities) };
  }

  function validateConfig(config) {
    if (!config || !config.capacities) throw new TypeError("config with capacities is required");
    EDGE_META.forEach(function (edge) {
      var capacity = config.capacities[edge.id];
      if (!finite(capacity) || capacity < 0) throw new RangeError("capacity " + edge.id + " must be finite and nonnegative");
    });
  }

  function edgesFor(config) {
    validateConfig(config);
    return EDGE_META.map(function (edge) {
      return { id: edge.id, from: edge.from, to: edge.to, label: edge.label, capacity: config.capacities[edge.id] };
    });
  }

  function zeroFlow() {
    var flow = {};
    EDGE_META.forEach(function (edge) { flow[edge.id] = 0; });
    return flow;
  }

  function cloneFlow(flow) {
    var result = zeroFlow();
    EDGE_META.forEach(function (edge) { result[edge.id] = Number(flow && flow[edge.id]) || 0; });
    return result;
  }

  function residualArcs(config, flow) {
    var current = cloneFlow(flow);
    var arcs = [];
    edgesFor(config).forEach(function (edge) {
      var forward = edge.capacity - current[edge.id];
      if (forward > EPS) arcs.push({ id: edge.id, from: edge.from, to: edge.to, direction: 1, residual: forward });
      if (current[edge.id] > EPS) arcs.push({ id: edge.id, from: edge.to, to: edge.from, direction: -1, residual: current[edge.id] });
    });
    return arcs;
  }

  function findAugmentingPath(config, flow) {
    var arcs = residualArcs(config, flow);
    var visited = Object.create(null);

    function visit(node, path) {
      var index;
      if (node === "t") return path;
      visited[node] = true;
      for (index = 0; index < arcs.length; index += 1) {
        var arc = arcs[index];
        if (arc.from !== node || visited[arc.to]) continue;
        var found = visit(arc.to, path.concat([arc]));
        if (found) return found;
      }
      return null;
    }

    return visit("s", []);
  }

  function augment(config, flow) {
    var path = findAugmentingPath(config, flow);
    if (!path) return { flow: cloneFlow(flow), path: null, bottleneck: 0 };
    var bottleneck = path.reduce(function (minimum, arc) { return Math.min(minimum, arc.residual); }, Infinity);
    var next = cloneFlow(flow);
    path.forEach(function (arc) { next[arc.id] += arc.direction * bottleneck; });
    return { flow: next, path: path, bottleneck: bottleneck };
  }

  function flowValue(config, flow) {
    var value = 0;
    edgesFor(config).forEach(function (edge) {
      if (edge.from === "s") value += flow[edge.id];
      if (edge.to === "s") value -= flow[edge.id];
    });
    return value;
  }

  function balances(config, flow) {
    var result = { s: 0, a: 0, b: 0, t: 0 };
    edgesFor(config).forEach(function (edge) {
      result[edge.from] -= flow[edge.id];
      result[edge.to] += flow[edge.id];
    });
    return result;
  }

  function reachableResidual(config, flow) {
    var arcs = residualArcs(config, flow);
    var seen = { s: true };
    var queue = ["s"];
    while (queue.length) {
      var node = queue.shift();
      arcs.forEach(function (arc) {
        if (arc.from === node && !seen[arc.to]) {
          seen[arc.to] = true;
          queue.push(arc.to);
        }
      });
    }
    return Object.keys(seen);
  }

  function cutCertificate(config, flow) {
    var reachable = reachableResidual(config, flow);
    var inSet = Object.create(null);
    reachable.forEach(function (node) { inSet[node] = true; });
    var cutEdges = edgesFor(config).filter(function (edge) { return inSet[edge.from] && !inSet[edge.to]; });
    return {
      reachable: reachable,
      separates: !inSet.t,
      edges: cutEdges,
      capacity: cutEdges.reduce(function (total, edge) { return total + edge.capacity; }, 0)
    };
  }

  function runToCertificate(config, initialFlow) {
    var flow = cloneFlow(initialFlow || zeroFlow());
    var history = [];
    var guard = 0;
    while (findAugmentingPath(config, flow)) {
      var step = augment(config, flow);
      flow = step.flow;
      history.push({ path: step.path, bottleneck: step.bottleneck, value: flowValue(config, flow), flow: cloneFlow(flow) });
      guard += 1;
      if (guard > 1000) throw new Error("augmentation guard exceeded");
    }
    return { flow: flow, history: history, certificate: cutCertificate(config, flow), value: flowValue(config, flow) };
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function selfTest() {
    var checks = 0;
    PRESETS.forEach(function (preset) {
      var config = makeConfig(preset);
      var result = runToCertificate(config);
      var balance = balances(config, result.flow);
      edgesFor(config).forEach(function (edge) {
        checks += 3;
        assert(finite(result.flow[edge.id]), preset.id + " has nonfinite flow");
        assert(result.flow[edge.id] >= -EPS, preset.id + " has negative flow");
        assert(result.flow[edge.id] <= edge.capacity + EPS, preset.id + " exceeds capacity");
      });
      ["a", "b"].forEach(function (node) {
        checks += 1;
        assert(near(balance[node], 0), preset.id + " violates conservation at " + node);
      });
      checks += 5;
      assert(!findAugmentingPath(config, result.flow), preset.id + " still has an augmenting path");
      assert(result.certificate.separates, preset.id + " cut does not separate s and t");
      assert(near(result.value, result.certificate.capacity), preset.id + " flow/cut mismatch");
      assert(near(balance.s, -result.value) && near(balance.t, result.value), preset.id + " terminal balance mismatch");
      assert(result.history.length > 0 && result.history.length < 20, preset.id + " unexpected history length");
      result.history.forEach(function (entry) {
        checks += 2;
        assert(entry.bottleneck > 0 && finite(entry.bottleneck), preset.id + " invalid bottleneck");
        assert(near(entry.value, Math.round(entry.value)), preset.id + " lost integrality");
      });
    });

    var reroute = runToCertificate(makeConfig("reroute"));
    checks += 5;
    assert(reroute.history.length === 2, "reroute preset should use two augmentations");
    assert(reroute.history[0].path.map(function (arc) { return arc.from + arc.to; }).join("-") === "sa-ab-bt", "unexpected first reroute path");
    assert(reroute.history[1].path.some(function (arc) { return arc.id === "ab" && arc.direction === -1; }), "second path must use reverse a-b residual");
    assert(near(reroute.flow.ab, 0), "reroute should cancel a-b flow");
    assert(near(reroute.value, 2), "reroute max flow should be 2");

    var rejected = false;
    try { validateConfig({ capacities: { sa: -1, ab: 1, bt: 1, sb: 1, at: 1 } }); } catch (error) { rejected = true; }
    checks += 1;
    assert(rejected, "negative capacity should be rejected");
    checks += 1;
    assert(near(runToCertificate(makeConfig("balanced")).value, 5), "balanced max flow should be 5");
    return { checks: checks, presets: PRESETS.length };
  }

  function injectStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function makeElement(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "className") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (!Array.isArray(children)) children = children === undefined ? [] : [children];
    children.forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
    });
    return node;
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function pathText(path) {
    if (!path || !path.length) return "--";
    return path[0].from + path.map(function (arc) { return " -> " + arc.to; }).join("");
  }

  function metric(doc, label) {
    var value = makeElement(doc, "strong", {}, "--");
    return { node: makeElement(doc, "div", { className: "mf-metric" }, [makeElement(doc, "span", {}, label), value]), value: value };
  }

  function edgeGeometry(id) {
    var map = {
      sa: { x1: 82, y1: 164, x2: 205, y2: 88, lx: 139, ly: 112 },
      sb: { x1: 82, y1: 196, x2: 205, y2: 272, lx: 139, ly: 258 },
      ab: { x1: 235, y1: 99, x2: 235, y2: 261, lx: 270, ly: 176 },
      at: { x1: 264, y1: 84, x2: 532, y2: 165, lx: 405, ly: 104 },
      bt: { x1: 264, y1: 276, x2: 532, y2: 195, lx: 405, ly: 258 }
    };
    return map[id];
  }

  function drawNetwork(doc, svg, config, flow, lastPath, complete, uid) {
    clear(svg);
    var defs = svgNode(doc, "defs");
    [["arrow", "var(--mf-blue)"], ["arrow-path", "var(--mf-gold)"], ["arrow-cut", "var(--mf-red)"]].forEach(function (item) {
      var marker = svgNode(doc, "marker", { id: uid + "-" + item[0], markerWidth: "8", markerHeight: "8", refX: "7", refY: "3.5", orient: "auto", markerUnits: "strokeWidth" });
      marker.appendChild(svgNode(doc, "path", { d: "M0,0 L0,7 L7,3.5 z", fill: item[1] }));
      defs.appendChild(marker);
    });
    svg.appendChild(defs);
    svg.appendChild(svgNode(doc, "desc", {}, "有向网络显示每条原边的流量/容量、反向余量、当前增广路径和最终最小割。"));

    var lastById = Object.create(null);
    (lastPath || []).forEach(function (arc) { lastById[arc.id] = arc; });
    var certificate = cutCertificate(config, flow);
    var cutById = Object.create(null);
    if (complete) certificate.edges.forEach(function (edge) { cutById[edge.id] = true; });

    edgesFor(config).forEach(function (edge) {
      var geometry = edgeGeometry(edge.id);
      var active = lastById[edge.id];
      var className = "mf-edge" + (cutById[edge.id] ? " mf-cut" : "") + (active && active.direction === 1 ? " mf-path" : "");
      var marker = active && active.direction === 1 ? "arrow-path" : (cutById[edge.id] ? "arrow-cut" : "arrow");
      svg.appendChild(svgNode(doc, "line", {
        x1: geometry.x1, y1: geometry.y1, x2: geometry.x2, y2: geometry.y2,
        class: className, "marker-end": "url(#" + uid + "-" + marker + ")"
      }));
      if (active && active.direction === -1) {
        svg.appendChild(svgNode(doc, "line", {
          x1: geometry.x2 + 5, y1: geometry.y2, x2: geometry.x1 + 5, y2: geometry.y1,
          class: "mf-reverse", "marker-end": "url(#" + uid + "-arrow-path)"
        }));
      }
      svg.appendChild(svgNode(doc, "text", { x: geometry.lx, y: geometry.ly, class: "mf-edge-label" }, flow[edge.id] + " / " + edge.capacity));
      svg.appendChild(svgNode(doc, "text", { x: geometry.lx, y: geometry.ly + 15, class: "mf-residual-label" }, "反向余量 " + flow[edge.id]));
    });

    var positions = { s: [55, 180], a: [235, 70], b: [235, 290], t: [560, 180] };
    var reachable = Object.create(null);
    if (complete) certificate.reachable.forEach(function (node) { reachable[node] = true; });
    Object.keys(positions).forEach(function (node) {
      var pos = positions[node];
      svg.appendChild(svgNode(doc, "circle", { cx: pos[0], cy: pos[1], r: "27", class: "mf-node" + (reachable[node] ? " mf-reachable" : "") }));
      svg.appendChild(svgNode(doc, "text", { x: pos[0], y: pos[1] + 1, class: "mf-node-label" }, node));
    });
    svg.appendChild(svgNode(doc, "text", { x: 310, y: 336, class: "mf-residual-label" }, complete ? "绿色圈：残量图中从 s 可达的 S；红边：最小割" : "边标签为 flow / capacity；金色表示最近一次增广"));
  }

  function replaceTableRows(doc, body, rows) {
    clear(body);
    rows.forEach(function (values) {
      var row = makeElement(doc, "tr");
      values.forEach(function (value) { row.appendChild(makeElement(doc, "td", {}, String(value))); });
      body.appendChild(row);
    });
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    injectStyles(doc);
    clear(root);
    var uid = "mf-" + (SERIAL += 1);
    var config = makeConfig(PRESETS[0]);
    var flow = zeroFlow();
    var history = [];
    var lastPath = null;
    var revealed = false;
    var answers = { reverse: null, proof: null, integer: null };

    var shell = makeElement(doc, "div", { className: "mf-lab" });
    shell.appendChild(makeElement(doc, "h3", {}, "残量网络：先预测，再增广"));
    shell.appendChild(makeElement(doc, "p", { className: "mf-intro" }, "第一条增广路未必适合最终解。先回答三问，揭示后逐步观察反向余量如何撤回旧决定，并用同值割关闭最优性证明。"));

    var questions = [
      { key: "reverse", prompt: "1. 残量反向边 b -> a 表示什么？", expected: "cancel", choices: [["pipe", "新建反向管道"], ["cancel", "可撤回原边流量"], ["ignore", "只是画图辅助"]] },
      { key: "proof", prompt: "2. 找到值为 2 的可行流，已经证明最优吗？", expected: "cut", choices: [["yes", "已经证明"], ["cut", "还需同值割或无增广路"], ["large", "只要看起来够大"]] },
      { key: "integer", prompt: "3. 整数容量的整数流性质能推广到任意 LP 吗？", expected: "special", choices: [["all", "可以，所有 LP 都行"], ["special", "不行，依赖网络结构"], ["none", "网络流也不行"]] }
    ];

    var form = makeElement(doc, "form", { className: "mf-prediction" });
    var fieldset = makeElement(doc, "fieldset");
    fieldset.appendChild(makeElement(doc, "legend", {}, "预测门：三项都回答后才显示流量"));
    var choiceButtons = [];
    questions.forEach(function (question) {
      fieldset.appendChild(makeElement(doc, "p", { className: "mf-question" }, question.prompt));
      var row = makeElement(doc, "div", { className: "mf-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          answers[question.key] = choice[0];
          choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); });
        });
        choiceButtons.push({ key: question.key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
    });
    form.appendChild(fieldset);
    var submit = makeElement(doc, "button", { type: "submit", className: "mf-primary" }, "提交预测并揭示");
    var gateReset = makeElement(doc, "button", { type: "button" }, "清空预测");
    form.appendChild(makeElement(doc, "div", { className: "mf-actions" }, [submit, gateReset]));
    var feedback = makeElement(doc, "p", { className: "mf-feedback", role: "status", "aria-live": "polite" }, "请完成三项预测。感到不确定也要先下注。 ");
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealedPanel = makeElement(doc, "section", { className: "mf-revealed", hidden: "hidden" });
    var layout = makeElement(doc, "div", { className: "mf-layout" });
    var controls = makeElement(doc, "div", { className: "mf-controls" });
    controls.appendChild(makeElement(doc, "h4", {}, "教学预设"));
    var presets = makeElement(doc, "div", { className: "mf-presets", role: "group", "aria-label": "网络流预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        config = makeConfig(preset);
        flow = zeroFlow(); history = []; lastPath = null;
        render();
        if (api && typeof api.announce === "function") api.announce(root, "已切换到 " + preset.label + "，流量已清空。");
      });
      presetButtons.push({ id: preset.id, node: button });
      presets.appendChild(button);
    });
    controls.appendChild(presets);
    var capacityOutput = makeElement(doc, "output", { for: uid + "-ab" }, "1");
    var capacityInput = makeElement(doc, "input", { id: uid + "-ab", type: "range", min: "0", max: "4", step: "1", value: "1" });
    controls.appendChild(makeElement(doc, "div", { className: "mf-control" }, [
      makeElement(doc, "label", { for: uid + "-ab" }, ["桥边 a -> b 容量：", capacityOutput]),
      capacityInput,
      makeElement(doc, "span", { className: "mf-note" }, "改容量会清空当前流，以免旧流违反新容量。")
    ]));
    var stepButton = makeElement(doc, "button", { type: "button", className: "mf-primary" }, "下一条增广路");
    var runButton = makeElement(doc, "button", { type: "button" }, "运行到最优证书");
    var clearButton = makeElement(doc, "button", { type: "button" }, "清空当前流");
    var relockButton = makeElement(doc, "button", { type: "button" }, "重新预测");
    controls.appendChild(makeElement(doc, "div", { className: "mf-actions" }, [stepButton, runButton, clearButton, relockButton]));
    var status = makeElement(doc, "p", { className: "mf-status", role: "status", "aria-live": "polite" }, "");
    controls.appendChild(status);
    layout.appendChild(controls);

    var stage = makeElement(doc, "div", { className: "mf-stage" });
    var svg = svgNode(doc, "svg", { class: "mf-svg", width: "620", height: "360", viewBox: "0 0 620 360", role: "img", "aria-label": "网络流、残量反向边与最小割图" });
    stage.appendChild(makeElement(doc, "div", { className: "mf-frame" }, [svg]));
    var metrics = [metric(doc, "当前流值"), metric(doc, "下一条 DFS 增广路"), metric(doc, "停机割容量"), metric(doc, "流值 = 割？")];
    stage.appendChild(makeElement(doc, "div", { className: "mf-metrics" }, metrics.map(function (item) { return item.node; })));
    stage.appendChild(makeElement(doc, "h4", {}, "边的容量与残量账本"));
    var table = makeElement(doc, "table");
    var head = makeElement(doc, "thead");
    var headRow = makeElement(doc, "tr");
    ["原边", "容量 c", "流 f", "正向余量 c-f", "反向余量 f", "是否割边"].forEach(function (label) { headRow.appendChild(makeElement(doc, "th", {}, label)); });
    head.appendChild(headRow); table.appendChild(head);
    var tableBody = makeElement(doc, "tbody"); table.appendChild(tableBody);
    stage.appendChild(makeElement(doc, "div", { className: "mf-table-wrap" }, table));
    stage.appendChild(makeElement(doc, "h4", {}, "增广历史"));
    var historyList = makeElement(doc, "ol", { className: "mf-history" });
    stage.appendChild(historyList);
    var certificateText = makeElement(doc, "p", { className: "mf-certificate" }, "");
    stage.appendChild(certificateText);
    layout.appendChild(stage);
    revealedPanel.appendChild(layout);
    shell.appendChild(revealedPanel);
    root.appendChild(shell);

    function resetFlow() {
      flow = zeroFlow(); history = []; lastPath = null;
    }

    function render() {
      var nextPath = findAugmentingPath(config, flow);
      var complete = !nextPath;
      var certificate = cutCertificate(config, flow);
      var value = flowValue(config, flow);
      capacityInput.value = String(config.capacities.ab);
      capacityOutput.textContent = String(config.capacities.ab);
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === config.id ? "true" : "false"); });
      stepButton.disabled = complete;
      runButton.disabled = complete;
      metrics[0].value.textContent = String(value);
      metrics[1].value.textContent = nextPath ? pathText(nextPath) : "无";
      metrics[2].value.textContent = complete ? String(certificate.capacity) : "待停机";
      metrics[3].value.textContent = complete && Math.abs(value - certificate.capacity) < EPS ? "是，证书闭合" : "尚未闭合";
      drawNetwork(doc, svg, config, flow, lastPath, complete, uid);
      var cutIds = Object.create(null);
      if (complete) certificate.edges.forEach(function (edge) { cutIds[edge.id] = true; });
      replaceTableRows(doc, tableBody, edgesFor(config).map(function (edge) {
        return [edge.label, edge.capacity, flow[edge.id], edge.capacity - flow[edge.id], flow[edge.id], cutIds[edge.id] ? "是" : "否"];
      }));
      clear(historyList);
      if (!history.length) historyList.appendChild(makeElement(doc, "li", {}, "尚未增广。先观察第一条 DFS 路径。"));
      history.forEach(function (entry, index) {
        var reverse = entry.path.some(function (arc) { return arc.direction === -1; }) ? "；含反向撤回" : "";
        historyList.appendChild(makeElement(doc, "li", {}, "第 " + (index + 1) + " 步：" + pathText(entry.path) + "，增广 " + entry.bottleneck + "，流值 " + entry.value + reverse));
      });
      var balance = balances(config, flow);
      status.textContent = config.note + " 当前 a 的净流入=" + balance.a + "，b 的净流入=" + balance.b + "；两者应保持 0。";
      certificateText.textContent = complete
        ? "停机：残量图中 t 不可达。S={" + certificate.reachable.join(", ") + "}，割边={" + certificate.edges.map(function (edge) { return edge.label; }).join(", ") + "}，割容量=" + certificate.capacity + "，与流值 " + value + " 相等。"
        : "尚未停机：t 仍可由残量正容量路径到达。当前流只是下界，不能把它叫作最优证书。";
    }

    function reveal() {
      revealed = true;
      revealedPanel.removeAttribute("hidden");
      var correct = questions.filter(function (question) { return answers[question.key] === question.expected; }).length;
      feedback.className = "mf-feedback " + (correct === questions.length ? "mf-pass" : "mf-warn");
      feedback.textContent = "已记录：" + correct + "/" + questions.length + " 项与模型一致。现在用路径与割逐项核对。";
      render();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (questions.some(function (question) { return !answers[question.key]; })) {
        feedback.className = "mf-feedback mf-warn";
        feedback.textContent = "请先完成三项预测。";
        return;
      }
      reveal();
    });

    gateReset.addEventListener("click", function () {
      answers = { reverse: null, proof: null, integer: null };
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); });
      feedback.className = "mf-feedback";
      feedback.textContent = "预测已清空。";
    });

    stepButton.addEventListener("click", function () {
      var step = augment(config, flow);
      if (!step.path) return;
      flow = step.flow; lastPath = step.path;
      history.push({ path: step.path, bottleneck: step.bottleneck, value: flowValue(config, flow) });
      render();
    });

    runButton.addEventListener("click", function () {
      var guard = 0;
      while (findAugmentingPath(config, flow)) {
        var step = augment(config, flow);
        flow = step.flow; lastPath = step.path;
        history.push({ path: step.path, bottleneck: step.bottleneck, value: flowValue(config, flow) });
        guard += 1;
        if (guard > 100) break;
      }
      render();
    });

    clearButton.addEventListener("click", function () { resetFlow(); render(); });
    capacityInput.addEventListener("input", function () {
      config = { id: "custom", label: "自定义", note: "只改变桥边 a -> b；重新寻找瓶颈与证书。", capacities: cloneObject(config.capacities) };
      config.capacities.ab = Number(capacityInput.value);
      resetFlow(); render();
    });
    relockButton.addEventListener("click", function () {
      revealed = false;
      revealedPanel.setAttribute("hidden", "hidden");
      answers = { reverse: null, proof: null, integer: null };
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); });
      feedback.className = "mf-feedback";
      feedback.textContent = "已重新上锁，请再做三项预测。";
      resetFlow();
    });
  }

  return {
    EDGE_META: EDGE_META,
    PRESETS: PRESETS,
    makeConfig: makeConfig,
    zeroFlow: zeroFlow,
    residualArcs: residualArcs,
    findAugmentingPath: findAugmentingPath,
    augment: augment,
    balances: balances,
    flowValue: flowValue,
    cutCertificate: cutCertificate,
    runToCertificate: runToCertificate,
    selfTest: selfTest,
    mount: mount
  };
});
