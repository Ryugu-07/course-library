(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-algo-01-divide-graph", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-algo-01-divide-graph self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-algo-01-divide-graph self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-algo-01-divide-graph";
  var NODES = ["s", "a", "b", "c", "t"];
  var POSITIONS = { s: [42, 144], a: [170, 52], b: [170, 236], c: [330, 144], t: [536, 144] };
  var PRESETS = {
    safe: {
      label: "非负权：Dijkstra 可定稿",
      note: "所有边权非负；每次取出的最小 frontier 距离都能被证明为最终值。",
      edges: [
        { from: "s", to: "a", weight: 2 },
        { from: "s", to: "b", weight: 5 },
        { from: "a", to: "b", weight: 1 },
        { from: "a", to: "c", weight: 6 },
        { from: "b", to: "c", weight: 2 },
        { from: "c", to: "t", weight: 3 }
      ]
    },
    negative: {
      label: "负边：定稿不再可靠",
      note: "c -> a = -6 会在 a 定稿后到达；Bellman-Ford 的真值是 t = 3，Dijkstra 可能留下 t = 6。",
      edges: [
        { from: "s", to: "a", weight: 2 },
        { from: "s", to: "c", weight: 5 },
        { from: "a", to: "b", weight: 2 },
        { from: "b", to: "t", weight: 2 },
        { from: "c", to: "a", weight: -6 }
      ]
    }
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function cloneGraph(id) {
    var source = PRESETS[id] || PRESETS.safe;
    return {
      id: id || "safe",
      label: source.label,
      note: source.note,
      edges: source.edges.map(function (edge) {
        return { from: edge.from, to: edge.to, weight: edge.weight };
      })
    };
  }

  function initialState() {
    var dist = {};
    var previous = {};
    var settled = {};
    NODES.forEach(function (node) {
      dist[node] = Infinity;
      previous[node] = null;
      settled[node] = false;
    });
    dist.s = 0;
    return { dist: dist, previous: previous, settled: settled, current: null, updates: [], steps: 0 };
  }

  function nextNode(state) {
    var best = null;
    NODES.forEach(function (node) {
      if (state.settled[node] || !isFinite(state.dist[node])) return;
      if (best === null || state.dist[node] < state.dist[best]) best = node;
    });
    return best;
  }

  function step(graph, state) {
    var node = nextNode(state);
    state.updates = [];
    if (node === null) {
      state.current = null;
      return false;
    }
    state.current = node;
    state.settled[node] = true;
    graph.edges.forEach(function (edge) {
      if (edge.from !== node || !isFinite(state.dist[node])) return;
      var candidate = state.dist[node] + edge.weight;
      if (candidate < state.dist[edge.to]) {
        state.dist[edge.to] = candidate;
        state.previous[edge.to] = node;
        state.updates.push({ to: edge.to, value: candidate, edge: edge });
      }
    });
    state.steps += 1;
    return true;
  }

  function runDijkstra(graph) {
    var state = initialState();
    var guard = 0;
    while (step(graph, state)) {
      guard += 1;
      if (guard > NODES.length + 2) throw new Error("Dijkstra guard exceeded");
    }
    return state;
  }

  function bellmanFord(graph) {
    var dist = {};
    NODES.forEach(function (node) { dist[node] = Infinity; });
    dist.s = 0;
    for (var round = 0; round < NODES.length - 1; round += 1) {
      var changed = false;
      graph.edges.forEach(function (edge) {
        if (!isFinite(dist[edge.from])) return;
        var candidate = dist[edge.from] + edge.weight;
        if (candidate < dist[edge.to]) {
          dist[edge.to] = candidate;
          changed = true;
        }
      });
      if (!changed) break;
    }
    return dist;
  }

  function format(value) {
    return isFinite(value) ? String(value) : "∞";
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else if (key === "className") node.className = attrs[key];
      else if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cag-blue:#315f9d;--cag-gold:#a36a16;--cag-green:#39734d;--cag-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:0;padding:0;border:0}' +
      '[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{min-height:44px;padding:8px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{border-color:var(--accent,#315f9d);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cag-primary{background:var(--cag-blue);border-color:var(--cag-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cag-choices,[data-learning-lab="' + NAME + '"] .cag-actions{display:flex;flex-wrap:wrap;gap:8px}' +
      '[data-learning-lab="' + NAME + '"] .cag-actions{margin-top:12px}[data-learning-lab="' + NAME + '"] .cag-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .cag-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .cag-layout{display:grid;grid-template-columns:minmax(190px,.62fr) minmax(0,1.38fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .cag-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .cag-control{display:grid;gap:5px}' +
      '[data-learning-lab="' + NAME + '"] .cag-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] .cag-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}' +
      '[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] .cag-edge{stroke:var(--cag-blue);stroke-width:2.3;fill:none}[data-learning-lab="' + NAME + '"] .cag-edge.cag-last{stroke:var(--cag-gold);stroke-width:4}' +
      '[data-learning-lab="' + NAME + '"] .cag-edge.cag-negative{stroke:var(--cag-red);stroke-dasharray:6 4}[data-learning-lab="' + NAME + '"] .cag-node{fill:var(--bg);stroke:var(--cag-blue);stroke-width:2}[data-learning-lab="' + NAME + '"] .cag-node.cag-settled{stroke:var(--cag-green);stroke-width:4}' +
      '[data-learning-lab="' + NAME + '"] .cag-node.cag-current{fill:var(--cag-gold);stroke:var(--cag-gold)}[data-learning-lab="' + NAME + '"] .cag-label{font-size:14px;font-weight:750;text-anchor:middle;dominant-baseline:middle}' +
      '[data-learning-lab="' + NAME + '"] .cag-edge-label{font-size:12px;font-weight:700;text-anchor:middle;paint-order:stroke;stroke:var(--bg);stroke-width:5px}[data-learning-lab="' + NAME + '"] .cag-small{font-size:11px;fill:var(--fg-soft)!important}' +
      '[data-learning-lab="' + NAME + '"] .cag-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cag-metric{padding:8px;border-top:2px solid var(--cag-blue)}' +
      '[data-learning-lab="' + NAME + '"] .cag-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .cag-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cag-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .cag-choices,[data-learning-lab="' + NAME + '"] .cag-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function renderGraph(doc, graph, state) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 580 290", role: "img", "aria-label": "Dijkstra 松弛状态图" });
    var marker = svgElement(doc, "marker", { id: "cag-arrow", markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: "auto" });
    marker.appendChild(svgElement(doc, "path", { d: "M0,0 L7,3.5 L0,7 z", fill: "currentColor" }));
    var defs = svgElement(doc, "defs", {}, marker);
    svg.appendChild(defs);
    graph.edges.forEach(function (edge) {
      var from = POSITIONS[edge.from];
      var to = POSITIONS[edge.to];
      var last = state.updates.some(function (update) { return update.edge === edge; });
      var className = "cag-edge" + (last ? " cag-last" : "") + (edge.weight < 0 ? " cag-negative" : "");
      svg.appendChild(svgElement(doc, "line", {
        x1: from[0], y1: from[1], x2: to[0], y2: to[1], class: className, "marker-end": "url(#cag-arrow)"
      }));
      var lx = (from[0] + to[0]) / 2;
      var ly = (from[1] + to[1]) / 2 - 7;
      svg.appendChild(svgElement(doc, "text", { x: lx, y: ly, class: "cag-edge-label" }, String(edge.weight)));
    });
    NODES.forEach(function (node) {
      var pos = POSITIONS[node];
      var className = "cag-node" + (state.settled[node] ? " cag-settled" : "") + (state.current === node ? " cag-current" : "");
      svg.appendChild(svgElement(doc, "circle", { cx: pos[0], cy: pos[1], r: 25, class: className }));
      svg.appendChild(svgElement(doc, "text", { x: pos[0], y: pos[1], class: "cag-label" }, node));
      svg.appendChild(svgElement(doc, "text", { x: pos[0], y: pos[1] + 41, class: "cag-small", "text-anchor": "middle" }, "d=" + format(state.dist[node])));
    });
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 18, class: "cag-small" }, "绿圈：已定稿　金色：本步 frontier　红虚线：负边"));
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", { className: "cag-shell" });
    shell.appendChild(element(doc, "h3", { text: "松弛账本：先预测定稿，再追踪反例" }));
    shell.appendChild(element(doc, "p", { className: "cag-note", text: "先回答两个预测，揭示后逐步运行同一套松弛规则。切换负边预设，比较 Dijkstra 与 Bellman-Ford 的真值。" }));
    var form = element(doc, "form", { className: "cag-gate" });
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { next: null, negative: null };
    var groups = [];
    function addQuestion(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "cag-question", text: prompt }));
      var row = element(doc, "div", { className: "cag-choices", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () {
          answers[key] = choice[0];
          groups.forEach(function (item) {
            item.node.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false");
          });
        });
        groups.push({ key: key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
    }
    addQuestion("next", "非负预设中，s 松弛后下一个定稿点？", [["a", "a（d=2）"], ["b", "b（d=5）"], ["c", "c（仍不可达）"]]);
    addQuestion("negative", "切换到负边预设后，Dijkstra 的定稿证明？", [["holds", "仍成立"], ["breaks", "被破坏"], ["unknown", "与权值无关"]]);
    form.appendChild(fieldset);
    var actions = element(doc, "div", { className: "cag-actions" });
    var reveal = element(doc, "button", { className: "cag-primary", type: "submit", text: "提交预测并揭示" });
    actions.appendChild(reveal);
    form.appendChild(actions);
    var feedback = element(doc, "p", { className: "cag-feedback", role: "status", "aria-live": "polite", text: "请先完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "cag-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "cag-layout" });
    var controls = element(doc, "div", { className: "cag-controls" });
    var preset = element(doc, "select", { "aria-label": "图预设" });
    Object.keys(PRESETS).forEach(function (id) {
      preset.appendChild(element(doc, "option", { value: id, text: PRESETS[id].label }));
    });
    controls.appendChild(element(doc, "label", { className: "cag-control" }, ["图预设", preset]));
    var controlActions = element(doc, "div", { className: "cag-actions" });
    var stepButton = element(doc, "button", { type: "button", className: "cag-primary", text: "下一步松弛" });
    var runButton = element(doc, "button", { type: "button", text: "运行到结束" });
    var resetButton = element(doc, "button", { type: "button", text: "重置账本" });
    controlActions.appendChild(stepButton);
    controlActions.appendChild(runButton);
    controlActions.appendChild(resetButton);
    controls.appendChild(controlActions);
    var controlNote = element(doc, "p", { className: "cag-note" });
    controls.appendChild(controlNote);
    layout.appendChild(controls);
    var stage = element(doc, "div", { className: "cag-stage" });
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "cag-metrics" });
    var metricD = element(doc, "div", { className: "cag-metric" });
    var metricTruth = element(doc, "div", { className: "cag-metric" });
    var metricSettled = element(doc, "div", { className: "cag-metric" });
    metrics.appendChild(metricD);
    metrics.appendChild(metricTruth);
    metrics.appendChild(metricSettled);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "最短路距离账本" });
    table.innerHTML = "<thead><tr><th>点</th><th>暂定 d</th><th>状态</th><th>前驱</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);

    var graph = cloneGraph("safe");
    var state = initialState();
    var lastTruth = bellmanFord(graph);

    function reset() {
      graph = cloneGraph(preset.value || "safe");
      state = initialState();
      lastTruth = bellmanFord(graph);
      render();
    }

    function render() {
      var truth = lastTruth;
      stage.replaceChildren(renderGraph(doc, graph, state));
      controlNote.textContent = graph.note;
      metricD.innerHTML = "<span>当前 d[t]</span><strong>" + format(state.dist.t) + "</strong>";
      metricTruth.innerHTML = "<span>Bellman-Ford 真值</span><strong>" + format(truth.t) + "</strong>";
      metricSettled.innerHTML = "<span>已定稿点</span><strong>" + NODES.filter(function (node) { return state.settled[node]; }).length + " / " + NODES.length + "</strong>";
      table.querySelector("tbody").innerHTML = NODES.map(function (node) {
        return "<tr><th>" + node + "</th><td>" + format(state.dist[node]) + "</td><td>" +
          (state.settled[node] ? "定稿" : "frontier/未达") + "</td><td>" + (state.previous[node] || "—") + "</td></tr>";
      }).join("");
      stepButton.disabled = nextNode(state) === null;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.next || !answers.negative) {
        feedback.textContent = "两项都要先下注；不确定也可以先选一个。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.next === "a" ? 1 : 0) + (answers.negative === "breaks" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在逐步检查每条不变量。";
      render();
    });
    preset.addEventListener("change", reset);
    stepButton.addEventListener("click", function () {
      if (step(graph, state)) {
        render();
        if (api && typeof api.announce === "function") api.announce(root, "已取出 " + state.current + "；请查看本步更新的距离。");
      }
    });
    runButton.addEventListener("click", function () {
      while (step(graph, state)) {}
      render();
      if (api && typeof api.announce === "function") api.announce(root, "松弛运行结束；比较当前距离与 Bellman-Ford 真值。");
    });
    resetButton.addEventListener("click", function () {
      state = initialState();
      render();
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var safe = cloneGraph("safe");
    var safeRun = runDijkstra(safe);
    check(safeRun.dist.t === 8, "safe shortest path is 8");
    check(safeRun.dist.b === 3 && safeRun.dist.c === 5, "safe relaxations");
    check(bellmanFord(safe).t === safeRun.dist.t, "nonnegative algorithms agree");
    var negative = cloneGraph("negative");
    var negativeRun = runDijkstra(negative);
    var negativeTruth = bellmanFord(negative);
    check(negativeRun.dist.t === 6, "Dijkstra demonstrates stale target");
    check(negativeTruth.t === 3, "Bellman-Ford finds negative-edge truth");
    check(negativeRun.dist.t !== negativeTruth.t, "negative edge breaks finalization");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, runDijkstra: runDijkstra, bellmanFord: bellmanFord };
});
