(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-adv-02-spectral-online", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-adv-02-spectral-online self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-adv-02-spectral-online self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-adv-02-spectral-online";
  var POSITIONS = [[62, 145], [192, 65], [340, 225], [500, 145]];
  var GRAPHS = {
    path: {
      label: "四点路径",
      edges: [[0, 1, 1], [1, 2, 1], [2, 3, 1]],
      vector: [0.653281, 0.270598, -0.270598, -0.653281]
    },
    weak: {
      label: "弱桥两团",
      edges: [[0, 1, 1], [2, 3, 1], [1, 2, 0.2]],
      vector: [0.5, 0.5, -0.5, -0.5]
    },
    disconnected: {
      label: "断开的两条边",
      edges: [[0, 1, 1], [2, 3, 1]],
      vector: [0.5, 0.5, -0.5, -0.5]
    }
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function rayleigh(graph) {
    var energy = graph.edges.reduce(function (sum, edge) {
      return sum + edge[2] * Math.pow(graph.vector[edge[0]] - graph.vector[edge[1]], 2);
    }, 0);
    var norm = graph.vector.reduce(function (sum, value) { return sum + value * value; }, 0);
    return { energy: energy, norm: norm, quotient: energy / norm };
  }

  function ski(B, horizon) {
    var rentCost = horizon;
    var online = horizon <= B ? rentCost : 2 * B;
    var offline = Math.min(horizon, B);
    return { B: B, horizon: horizon, online: online, offline: offline, ratio: online / offline };
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
      '[data-learning-lab="' + NAME + '"]{--cso-blue:#315f9d;--cso-gold:#a36a16;--cso-green:#39734d;--cso-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cso-primary{background:var(--cso-blue);border-color:var(--cso-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cso-choices,[data-learning-lab="' + NAME + '"] .cso-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cso-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .cso-feedback,[data-learning-lab="' + NAME + '"] .cso-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .cso-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .cso-layout{display:grid;grid-template-columns:minmax(200px,.56fr) minmax(0,1.44fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .cso-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .cso-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .cso-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cso-blue)}' +
      '[data-learning-lab="' + NAME + '"] .cso-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}' +
      '[data-learning-lab="' + NAME + '"] .cso-edge{stroke:var(--cso-blue);stroke-width:4}[data-learning-lab="' + NAME + '"] .cso-bridge{stroke:var(--cso-gold);stroke-width:4;stroke-dasharray:7 5}[data-learning-lab="' + NAME + '"] .cso-node{fill:var(--bg);stroke:var(--cso-blue);stroke-width:2}[data-learning-lab="' + NAME + '"] .cso-label{font-size:14px;font-weight:750;text-anchor:middle;dominant-baseline:middle}[data-learning-lab="' + NAME + '"] .cso-value{font-size:12px;fill:var(--cso-gold)!important;font-weight:750;text-anchor:middle}' +
      '[data-learning-lab="' + NAME + '"] .cso-small{font-size:11px;fill:var(--fg-soft)!important}[data-learning-lab="' + NAME + '"] .cso-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cso-metric{padding:8px;border-top:2px solid var(--cso-blue)}[data-learning-lab="' + NAME + '"] .cso-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .cso-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '[data-learning-lab="' + NAME + '"] .cso-bar{height:18px;background:var(--cso-blue);margin:5px 0}[data-learning-lab="' + NAME + '"] .cso-bar.cso-offline{background:var(--cso-green)}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cso-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .cso-choices,[data-learning-lab="' + NAME + '"] .cso-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function renderGraph(doc, graph, label) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 560 285", role: "img", "aria-label": "图拉普拉斯与 Fiedler 标注" });
    graph.edges.forEach(function (edge) {
      var first = POSITIONS[edge[0]];
      var second = POSITIONS[edge[1]];
      svg.appendChild(svgElement(doc, "line", { x1: first[0], y1: first[1], x2: second[0], y2: second[1], class: edge[2] < 1 ? "cso-bridge" : "cso-edge" }));
      svg.appendChild(svgElement(doc, "text", { x: (first[0] + second[0]) / 2, y: (first[1] + second[1]) / 2 - 8, class: "cso-value" }, String(edge[2])));
    });
    graph.vector.forEach(function (value, index) {
      var pos = POSITIONS[index];
      svg.appendChild(svgElement(doc, "circle", { cx: pos[0], cy: pos[1], r: 23, class: "cso-node" }));
      svg.appendChild(svgElement(doc, "text", { x: pos[0], y: pos[1] - 4, class: "cso-label" }, String(index)));
      svg.appendChild(svgElement(doc, "text", { x: pos[0], y: pos[1] + 38, class: "cso-small", "text-anchor": "middle" }, value.toFixed(2)));
    });
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 18, class: "cso-small" }, label + "；节点下方为 Fiedler 方向分量"));
    return svg;
  }

  function renderSki(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 560 260", role: "img", "aria-label": "Ski rental 在线成本与离线最优" });
    var max = Math.max(result.online, result.offline, result.B * 2, 1);
    var onWidth = 420 * result.online / max;
    var offWidth = 420 * result.offline / max;
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 30, class: "cso-small" }, "在线：累计租金达到 B 后购买，成本 " + result.online));
    svg.appendChild(svgElement(doc, "rect", { x: 120, y: 15, width: onWidth, height: 28, fill: "var(--cso-gold)" }));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 90, class: "cso-small" }, "离线：事后选择租或买，成本 " + result.offline));
    svg.appendChild(svgElement(doc, "rect", { x: 120, y: 75, width: offWidth, height: 28, fill: "var(--cso-green)" }));
    svg.appendChild(svgElement(doc, "line", { x1: 120 + 420 * result.B / max, y1: 120, x2: 120 + 420 * result.B / max, y2: 218, stroke: "var(--cso-red)", "stroke-dasharray": "6 4" }));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 155, class: "cso-small" }, "红线：购买阈值 B=" + result.B + "；未来 H=" + result.horizon));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 195, class: "cso-small" }, "比值 = " + result.ratio.toFixed(2) + "；最坏在 H=B+1 附近"));
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "谱与在线：能量证书，还是未来对手？" }));
    shell.appendChild(element(doc, "p", { className: "cso-note", text: "先预测两个最坏量，揭示后在图拉普拉斯和 ski rental 两种原生状态之间切换。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { spectrum: null, rental: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "cso-question", text: prompt }));
      var row = element(doc, "div", { className: "cso-choices", role: "group", "aria-label": prompt });
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
    question("spectrum", "断开图的 λ₂？", [["positive", "大于 0"], ["zero", "等于 0"], ["unknown", "无法判断"]]);
    question("rental", "B=5 且 H=6 时租到阈值再买的比值？", [["one", "1"], ["two", "2"], ["five", "5"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "cso-actions" }, [element(doc, "button", { type: "submit", className: "cso-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "cso-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "cso-revealed", hidden: "hidden" });
    var modeActions = element(doc, "div", { className: "cso-actions" });
    var graphMode = element(doc, "button", { type: "button", "aria-pressed": "true", text: "图拉普拉斯" });
    var skiMode = element(doc, "button", { type: "button", "aria-pressed": "false", text: "Ski rental" });
    modeActions.appendChild(graphMode);
    modeActions.appendChild(skiMode);
    revealed.appendChild(modeActions);
    var layout = element(doc, "div", { className: "cso-layout" });
    var controls = element(doc, "div", { className: "cso-controls" });
    var graphSelect = element(doc, "select", { "aria-label": "图预设" });
    Object.keys(GRAPHS).forEach(function (id) { graphSelect.appendChild(element(doc, "option", { value: id, text: GRAPHS[id].label })); });
    var BInput = element(doc, "input", { type: "range", min: "2", max: "8", value: "5", step: "1" });
    var BOutput = element(doc, "output", { text: "5" });
    var HInput = element(doc, "input", { type: "range", min: "1", max: "14", value: "5", step: "1" });
    var HOutput = element(doc, "output", { text: "5" });
    controls.appendChild(element(doc, "label", { className: "cso-control" }, ["图预设 ", graphSelect]));
    controls.appendChild(element(doc, "div", { className: "cso-control" }, [element(doc, "label", {}, ["购买价 B = ", BOutput]), BInput]));
    controls.appendChild(element(doc, "div", { className: "cso-control" }, [element(doc, "label", {}, ["未来长度 H = ", HOutput]), HInput]));
    layout.appendChild(controls);
    var stage = element(doc, "div", { className: "cso-stage" });
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "cso-metrics" });
    var firstMetric = element(doc, "div", { className: "cso-metric" });
    var secondMetric = element(doc, "div", { className: "cso-metric" });
    var thirdMetric = element(doc, "div", { className: "cso-metric" });
    metrics.appendChild(firstMetric);
    metrics.appendChild(secondMetric);
    metrics.appendChild(thirdMetric);
    revealed.appendChild(metrics);
    var note = element(doc, "p", { className: "cso-note" });
    revealed.appendChild(note);
    shell.appendChild(revealed);
    root.appendChild(shell);

    var mode = "graph";
    function render() {
      var graph = GRAPHS[graphSelect.value];
      var spectrum = rayleigh(graph);
      var rental = ski(Number(BInput.value), Number(HInput.value));
      BOutput.textContent = String(rental.B);
      HOutput.textContent = String(rental.horizon);
      graphSelect.disabled = mode !== "graph";
      BInput.disabled = mode !== "ski";
      HInput.disabled = mode !== "ski";
      graphMode.setAttribute("aria-pressed", mode === "graph" ? "true" : "false");
      skiMode.setAttribute("aria-pressed", mode === "ski" ? "true" : "false");
      stage.replaceChildren(mode === "graph" ? renderGraph(doc, graph, GRAPHS[graphSelect.value].label) : renderSki(doc, rental));
      if (mode === "graph") {
        firstMetric.innerHTML = "<span>能量 xᵀLx</span><strong>" + spectrum.energy.toFixed(3) + "</strong>";
        secondMetric.innerHTML = "<span>Rayleigh 商</span><strong>" + spectrum.quotient.toFixed(3) + "</strong>";
        thirdMetric.innerHTML = "<span>模型边权</span><strong>" + graph.edges.length + " 条</strong>";
        note.textContent = "商越小表示标注越平滑；断开图的这条方向能量为 0。它是谱证据，不是任意割的完整枚举。";
      } else {
        firstMetric.innerHTML = "<span>在线成本</span><strong>" + rental.online + "</strong>";
        secondMetric.innerHTML = "<span>离线最优</span><strong>" + rental.offline + "</strong>";
        thirdMetric.innerHTML = "<span>竞争比</span><strong>" + rental.ratio.toFixed(2) + "</strong>";
        note.textContent = "在线策略只看到当前；H=B+1 时恰好付两份 B，构成确定性 2-竞争的紧边界。";
      }
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.spectrum || !answers.rental) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.spectrum === "zero" ? 1 : 0) + (answers.rental === "two" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在切换证据类型。";
      render();
    });
    graphMode.addEventListener("click", function () { mode = "graph"; render(); });
    skiMode.addEventListener("click", function () { mode = "ski"; render(); });
    graphSelect.addEventListener("change", render);
    BInput.addEventListener("input", render);
    HInput.addEventListener("input", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var path = rayleigh(GRAPHS.path);
    var disconnected = rayleigh(GRAPHS.disconnected);
    check(Math.abs(path.quotient - (2 - Math.sqrt(2))) < 0.002, "path Fiedler quotient");
    check(disconnected.quotient === 0, "disconnected graph has zero certificate");
    check(ski(5, 5).online === 5 && ski(5, 5).ratio === 1, "threshold horizon rents exactly B");
    check(ski(5, 6).online === 10 && ski(5, 6).ratio === 2, "first day after threshold gives ratio two");
    check(ski(5, 3).ratio === 1, "short horizon rents optimally");
    check(ski(5, 14).online === 10 && ski(5, 14).offline === 5, "long horizon online cost");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, rayleigh: rayleigh, ski: ski };
});
