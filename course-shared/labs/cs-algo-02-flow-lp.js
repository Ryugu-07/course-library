(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-algo-02-flow-lp", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-algo-02-flow-lp self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-algo-02-flow-lp self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-algo-02-flow-lp";
  var NODES = ["s", "a", "b", "t"];
  var POSITIONS = { s: [46, 145], a: [190, 55], b: [190, 235], t: [535, 145] };
  var EDGES = [
    { id: "sa", from: "s", to: "a", label: "s → a" },
    { id: "ab", from: "a", to: "b", label: "a → b" },
    { id: "bt", from: "b", to: "t", label: "b → t" },
    { id: "sb", from: "s", to: "b", label: "s → b" },
    { id: "at", from: "a", to: "t", label: "a → t" }
  ];
  var PRESETS = {
    reroute: {
      label: "反向边救场",
      note: "第一条路径会填满 a → b；第二条要用 b → a 撤回后才能到达 a → t。",
      capacities: { sa: 1, ab: 1, bt: 1, sb: 1, at: 1 }
    },
    source: {
      label: "源侧瓶颈",
      note: "源边总容量只有 3；下游再宽，最大流也不会超过 3。",
      capacities: { sa: 2, ab: 2, bt: 4, sb: 1, at: 4 }
    },
    sink: {
      label: "汇侧瓶颈",
      note: "进入 t 的边总容量只有 2；上游扩容不能越过这个割。",
      capacities: { sa: 4, ab: 1, bt: 1, sb: 4, at: 1 }
    }
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function configFor(id) {
    var source = PRESETS[id] || PRESETS.reroute;
    var capacities = {};
    EDGES.forEach(function (edge) { capacities[edge.id] = source.capacities[edge.id]; });
    return { id: id || "reroute", label: source.label, note: source.note, capacities: capacities };
  }

  function zeroFlow() {
    var flow = {};
    EDGES.forEach(function (edge) { flow[edge.id] = 0; });
    return flow;
  }

  function cloneFlow(flow) {
    var copy = zeroFlow();
    EDGES.forEach(function (edge) { copy[edge.id] = Number(flow[edge.id]) || 0; });
    return copy;
  }

  function residualArcs(config, flow) {
    var arcs = [];
    EDGES.forEach(function (edge) {
      var forward = config.capacities[edge.id] - flow[edge.id];
      if (forward > 1e-10) arcs.push({ id: edge.id, from: edge.from, to: edge.to, direction: 1, residual: forward });
      if (flow[edge.id] > 1e-10) arcs.push({ id: edge.id, from: edge.to, to: edge.from, direction: -1, residual: flow[edge.id] });
    });
    return arcs;
  }

  function findPath(config, flow) {
    var arcs = residualArcs(config, flow);
    var seen = {};
    function visit(node, path) {
      if (node === "t") return path;
      seen[node] = true;
      for (var i = 0; i < arcs.length; i += 1) {
        var arc = arcs[i];
        if (arc.from !== node || seen[arc.to]) continue;
        var result = visit(arc.to, path.concat([arc]));
        if (result) return result;
      }
      return null;
    }
    return visit("s", []);
  }

  function augment(config, flow) {
    var path = findPath(config, flow);
    if (!path) return { flow: cloneFlow(flow), path: null, bottleneck: 0 };
    var bottleneck = path.reduce(function (value, arc) { return Math.min(value, arc.residual); }, Infinity);
    var next = cloneFlow(flow);
    path.forEach(function (arc) { next[arc.id] += arc.direction * bottleneck; });
    return { flow: next, path: path, bottleneck: bottleneck };
  }

  function value(flow) {
    return flow.sa + flow.sb;
  }

  function balances(flow) {
    var result = { s: 0, a: 0, b: 0, t: 0 };
    EDGES.forEach(function (edge) {
      result[edge.from] -= flow[edge.id];
      result[edge.to] += flow[edge.id];
    });
    return result;
  }

  function reachable(config, flow) {
    var seen = { s: true };
    var queue = ["s"];
    var arcs = residualArcs(config, flow);
    while (queue.length) {
      var node = queue.shift();
      arcs.forEach(function (arc) {
        if (arc.from === node && !seen[arc.to]) {
          seen[arc.to] = true;
          queue.push(arc.to);
        }
      });
    }
    return NODES.filter(function (node) { return seen[node]; });
  }

  function certificate(config, flow) {
    var set = {};
    reachable(config, flow).forEach(function (node) { set[node] = true; });
    var cutEdges = EDGES.filter(function (edge) { return set[edge.from] && !set[edge.to]; });
    return {
      sourceSide: Object.keys(set),
      edges: cutEdges,
      capacity: cutEdges.reduce(function (sum, edge) { return sum + config.capacities[edge.id]; }, 0),
      noAugmentingPath: !set.t
    };
  }

  function runToEnd(config, initial) {
    var flow = cloneFlow(initial || zeroFlow());
    var history = [];
    var guard = 0;
    var update;
    while ((update = augment(config, flow)).path) {
      flow = update.flow;
      history.push({ flow: cloneFlow(flow), path: update.path, bottleneck: update.bottleneck });
      guard += 1;
      if (guard > 100) throw new Error("augmentation guard exceeded");
    }
    return { flow: flow, history: history, value: value(flow), certificate: certificate(config, flow) };
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
      '[data-learning-lab="' + NAME + '"]{--caf-blue:#315f9d;--caf-gold:#a36a16;--caf-green:#39734d;--caf-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .caf-primary{background:var(--caf-blue);border-color:var(--caf-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .caf-choices,[data-learning-lab="' + NAME + '"] .caf-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .caf-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .caf-feedback,[data-learning-lab="' + NAME + '"] .caf-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .caf-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .caf-layout{display:grid;grid-template-columns:minmax(190px,.6fr) minmax(0,1.4fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .caf-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .caf-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}' +
      '[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] .caf-edge{stroke:var(--caf-blue);stroke-width:2.5;fill:none}[data-learning-lab="' + NAME + '"] .caf-edge.caf-path{stroke:var(--caf-gold);stroke-width:4}[data-learning-lab="' + NAME + '"] .caf-edge.caf-cut{stroke:var(--caf-red);stroke-width:4}' +
      '[data-learning-lab="' + NAME + '"] .caf-reverse{stroke:var(--caf-gold);stroke-width:3;stroke-dasharray:6 4;fill:none}[data-learning-lab="' + NAME + '"] .caf-node{fill:var(--bg);stroke:var(--caf-blue);stroke-width:2}[data-learning-lab="' + NAME + '"] .caf-node.caf-reach{stroke:var(--caf-green);stroke-width:4}' +
      '[data-learning-lab="' + NAME + '"] .caf-label{font-size:14px;font-weight:750;text-anchor:middle;dominant-baseline:middle}[data-learning-lab="' + NAME + '"] .caf-edge-label{font-size:12px;font-weight:700;text-anchor:middle;paint-order:stroke;stroke:var(--bg);stroke-width:5px}[data-learning-lab="' + NAME + '"] .caf-small{font-size:11px;fill:var(--fg-soft)!important}' +
      '[data-learning-lab="' + NAME + '"] .caf-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .caf-metric{padding:8px;border-top:2px solid var(--caf-blue)}[data-learning-lab="' + NAME + '"] .caf-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .caf-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .caf-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .caf-choices,[data-learning-lab="' + NAME + '"] .caf-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function renderGraph(doc, config, flow, lastPath, complete) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 580 290", role: "img", "aria-label": "残量网络与最大流最小割" });
    var marker = svgElement(doc, "marker", { id: "caf-arrow", markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: "auto" });
    marker.appendChild(svgElement(doc, "path", { d: "M0,0 L7,3.5 L0,7 z", fill: "currentColor" }));
    svg.appendChild(svgElement(doc, "defs", {}, marker));
    var cut = {};
    if (complete) certificate(config, flow).edges.forEach(function (edge) { cut[edge.id] = true; });
    EDGES.forEach(function (edge) {
      var from = POSITIONS[edge.from];
      var to = POSITIONS[edge.to];
      var inPath = lastPath && lastPath.some(function (arc) { return arc.id === edge.id; });
      var className = "caf-edge" + (inPath ? " caf-path" : "") + (cut[edge.id] ? " caf-cut" : "");
      svg.appendChild(svgElement(doc, "line", { x1: from[0], y1: from[1], x2: to[0], y2: to[1], class: className, "marker-end": "url(#caf-arrow)" }));
      svg.appendChild(svgElement(doc, "text", { x: (from[0] + to[0]) / 2, y: (from[1] + to[1]) / 2 - 7, class: "caf-edge-label" }, flow[edge.id] + " / " + config.capacities[edge.id]));
      if (flow[edge.id] > 0) {
        svg.appendChild(svgElement(doc, "line", { x1: to[0] + 5, y1: to[1] + 5, x2: from[0] + 5, y2: from[1] + 5, class: "caf-reverse", "marker-end": "url(#caf-arrow)" }));
      }
    });
    var sourceSide = {};
    certificate(config, flow).sourceSide.forEach(function (node) { sourceSide[node] = true; });
    NODES.forEach(function (node) {
      var pos = POSITIONS[node];
      svg.appendChild(svgElement(doc, "circle", { cx: pos[0], cy: pos[1], r: 25, class: "caf-node" + (complete && sourceSide[node] ? " caf-reach" : "") }));
      svg.appendChild(svgElement(doc, "text", { x: pos[0], y: pos[1], class: "caf-label" }, node));
    });
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 18, class: "caf-small" }, complete ? "红边：最小割　绿圈：残量图中从 s 可达" : "金色：最近增广路　边标签：flow / capacity"));
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", { className: "caf-shell" });
    shell.appendChild(element(doc, "h3", { text: "残量网络：把后悔保存在反向边里" }));
    shell.appendChild(element(doc, "p", { className: "caf-note", text: "先回答三问，揭示后逐步增广；终点同时给出流值、守恒检查和割容量。" }));
    var form = element(doc, "form", { className: "caf-gate" });
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { reverse: null, value: null, proof: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "caf-question", text: prompt }));
      var row = element(doc, "div", { className: "caf-choices", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () {
          answers[key] = choice[0];
          groupItems.forEach(function (item) { item.node.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); });
        });
        groupItems.push({ key: key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
    }
    question("reverse", "b → a 这条残量边代表？", [["new", "新增原管道"], ["undo", "撤回 a → b 流量"], ["noise", "无关标记"]]);
    question("value", "reroute 预设的最大流值？", [["1", "1"], ["2", "2"], ["3", "3"]]);
    question("proof", "流值 2 后怎样证明最优？", [["guess", "看图猜"], ["cut", "同值割 / 无增广路"], ["more", "再跑一次"]]);
    form.appendChild(fieldset);
    var actions = element(doc, "div", { className: "caf-actions" });
    actions.appendChild(element(doc, "button", { type: "submit", className: "caf-primary", text: "提交预测并揭示" }));
    form.appendChild(actions);
    var feedback = element(doc, "p", { className: "caf-feedback", role: "status", "aria-live": "polite", text: "请完成三项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "caf-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "caf-layout" });
    var controls = element(doc, "div", { className: "caf-controls" });
    var preset = element(doc, "select", { "aria-label": "流网络预设" });
    Object.keys(PRESETS).forEach(function (id) { preset.appendChild(element(doc, "option", { value: id, text: PRESETS[id].label })); });
    controls.appendChild(element(doc, "label", {}, ["网络预设", preset]));
    var controlActions = element(doc, "div", { className: "caf-actions" });
    var stepButton = element(doc, "button", { type: "button", className: "caf-primary", text: "下一条增广路" });
    var runButton = element(doc, "button", { type: "button", text: "运行到证书" });
    var resetButton = element(doc, "button", { type: "button", text: "清空流量" });
    controlActions.appendChild(stepButton);
    controlActions.appendChild(runButton);
    controlActions.appendChild(resetButton);
    controls.appendChild(controlActions);
    var note = element(doc, "p", { className: "caf-note" });
    controls.appendChild(note);
    layout.appendChild(controls);
    var stage = element(doc, "div", { className: "caf-stage" });
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "caf-metrics" });
    var flowMetric = element(doc, "div", { className: "caf-metric" });
    var cutMetric = element(doc, "div", { className: "caf-metric" });
    var stepMetric = element(doc, "div", { className: "caf-metric" });
    metrics.appendChild(flowMetric);
    metrics.appendChild(cutMetric);
    metrics.appendChild(stepMetric);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "流量与守恒账本" });
    table.innerHTML = "<thead><tr><th>边</th><th>流 / 容量</th><th>余量</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);

    var config = configFor("reroute");
    var flow = zeroFlow();
    var lastPath = null;
    var history = [];
    var complete = false;

    function reset(id) {
      config = configFor(id || preset.value || "reroute");
      flow = zeroFlow();
      lastPath = null;
      history = [];
      complete = false;
      render();
    }

    function render() {
      var cert = certificate(config, flow);
      stage.replaceChildren(renderGraph(doc, config, flow, lastPath, complete));
      note.textContent = config.note;
      flowMetric.innerHTML = "<span>当前流值</span><strong>" + value(flow) + "</strong>";
      cutMetric.innerHTML = "<span>当前割容量</span><strong>" + cert.capacity + (complete ? "（证书）" : "") + "</strong>";
      stepMetric.innerHTML = "<span>增广次数</span><strong>" + history.length + "</strong>";
      table.querySelector("tbody").innerHTML = EDGES.map(function (edge) {
        return "<tr><th>" + edge.label + "</th><td>" + flow[edge.id] + " / " + config.capacities[edge.id] + "</td><td>" + (config.capacities[edge.id] - flow[edge.id]) + "</td></tr>";
      }).join("");
      stepButton.disabled = !findPath(config, flow);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.reverse || !answers.value || !answers.proof) {
        feedback.textContent = "三项都要先下注；提交后才显示残量账本。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.reverse === "undo" ? 1 : 0) + (answers.value === "2" ? 1 : 0) + (answers.proof === "cut" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 3 命中；现在检查每个流量不变量。";
      render();
    });
    preset.addEventListener("change", function () { reset(preset.value); });
    stepButton.addEventListener("click", function () {
      var update = augment(config, flow);
      if (!update.path) return;
      flow = update.flow;
      lastPath = update.path;
      history.push(update);
      complete = !findPath(config, flow);
      render();
      if (api && typeof api.announce === "function") api.announce(root, "本步瓶颈为 " + update.bottleneck + "；查看金色路径中的反向边。");
    });
    runButton.addEventListener("click", function () {
      while (findPath(config, flow)) {
        var update = augment(config, flow);
        flow = update.flow;
        lastPath = update.path;
        history.push(update);
      }
      complete = true;
      render();
      if (api && typeof api.announce === "function") api.announce(root, "已无增广路；红色割与当前流值可比较。");
    });
    resetButton.addEventListener("click", function () { reset(preset.value); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var reroute = configFor("reroute");
    var result = runToEnd(reroute);
    var balance = balances(result.flow);
    check(result.value === 2, "reroute max flow is 2");
    check(result.certificate.capacity === 2, "reroute cut capacity is 2");
    check(result.certificate.noAugmentingPath, "certificate has no augmenting path");
    check(balance.a === 0 && balance.b === 0, "flow conservation");
    check(result.history.some(function (item) { return item.path.some(function (arc) { return arc.direction === -1; }); }), "reverse residual arc was used");
    var source = runToEnd(configFor("source"));
    check(source.value === 3 && source.certificate.capacity === 3, "source bottleneck certificate");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, runToEnd: runToEnd, certificate: certificate };
});
