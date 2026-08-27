(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-algo-03-random-approx", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-algo-03-random-approx self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-algo-03-random-approx self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-algo-03-random-approx";
  var NODES = [0, 1, 2, 3, 4, 5];
  var POSITIONS = [[50, 55], [190, 35], [330, 55], [470, 55], [155, 220], [390, 220]];
  var EDGES = [[0, 1], [0, 3], [0, 4], [1, 2], [1, 4], [2, 3], [2, 5], [3, 4], [4, 5]];

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function deterministicUnit(seed, index) {
    var x = (Math.imul((seed + index * 97) >>> 0, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  }

  function partition(seed, round) {
    var offset = (Number(seed) + Number(round) * 7919) >>> 0;
    return NODES.map(function (node) { return deterministicUnit(offset, node) >= 0.5 ? 1 : 0; });
  }

  function cutScore(bits) {
    return EDGES.reduce(function (score, edge) {
      return score + (bits[edge[0]] !== bits[edge[1]] ? 1 : 0);
    }, 0);
  }

  function bestCut() {
    var best = { score: -1, bits: null };
    for (var mask = 0; mask < (1 << NODES.length); mask += 1) {
      if (mask & 1) continue;
      var bits = NODES.map(function (node) { return (mask >> node) & 1; });
      var score = cutScore(bits);
      if (score > best.score) best = { score: score, bits: bits };
    }
    return best;
  }

  function samples(seed, repeats) {
    var output = [];
    for (var round = 0; round < repeats; round += 1) {
      var bits = partition(seed, round);
      output.push({ round: round + 1, bits: bits, score: cutScore(bits) });
    }
    return output;
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
      '[data-learning-lab="' + NAME + '"]{--car-blue:#315f9d;--car-gold:#a36a16;--car-green:#39734d;--car-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .car-primary{background:var(--car-blue);border-color:var(--car-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .car-choices,[data-learning-lab="' + NAME + '"] .car-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .car-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .car-feedback,[data-learning-lab="' + NAME + '"] .car-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .car-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .car-layout{display:grid;grid-template-columns:minmax(190px,.55fr) minmax(0,1.45fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .car-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .car-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .car-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--car-blue)}' +
      '[data-learning-lab="' + NAME + '"] .car-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}' +
      '[data-learning-lab="' + NAME + '"] .car-edge{stroke:var(--border);stroke-width:3}[data-learning-lab="' + NAME + '"] .car-edge.car-cross{stroke:var(--car-gold);stroke-width:4}[data-learning-lab="' + NAME + '"] .car-node{stroke:var(--car-blue);stroke-width:2}[data-learning-lab="' + NAME + '"] .car-zero{fill:var(--car-blue)}[data-learning-lab="' + NAME + '"] .car-one{fill:var(--car-green)}[data-learning-lab="' + NAME + '"] .car-label{fill:#fff;font-size:13px;font-weight:750;text-anchor:middle;dominant-baseline:middle}' +
      '[data-learning-lab="' + NAME + '"] .car-small{font-size:11px;fill:var(--fg-soft)!important}[data-learning-lab="' + NAME + '"] .car-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .car-metric{padding:8px;border-top:2px solid var(--car-blue)}[data-learning-lab="' + NAME + '"] .car-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .car-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .car-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .car-choices,[data-learning-lab="' + NAME + '"] .car-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}';
    doc.head.appendChild(style);
  }

  function renderGraph(doc, bits, currentScore, bestScore) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 520 275", role: "img", "aria-label": "随机切分与跨组边" });
    EDGES.forEach(function (edge) {
      var first = POSITIONS[edge[0]];
      var second = POSITIONS[edge[1]];
      svg.appendChild(svgElement(doc, "line", { x1: first[0], y1: first[1], x2: second[0], y2: second[1], class: "car-edge" + (bits[edge[0]] !== bits[edge[1]] ? " car-cross" : "") }));
    });
    NODES.forEach(function (node) {
      var pos = POSITIONS[node];
      svg.appendChild(svgElement(doc, "circle", { cx: pos[0], cy: pos[1], r: 21, class: "car-node " + (bits[node] ? "car-one" : "car-zero") }));
      svg.appendChild(svgElement(doc, "text", { x: pos[0], y: pos[1], class: "car-label" }, String(node)));
    });
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 18, class: "car-small" }, "金色边：当前跨割边　蓝/绿点：组 0 / 组 1　切边 " + currentScore + "，当前最好 " + bestScore));
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "随机切分：让期望变成可观察的下界" }));
    shell.appendChild(element(doc, "p", { className: "car-note", text: "种子不是“真随机”，而是固定的可复现实验输入；先预测，再查看每次切分和最好值。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { expectation: null, repeat: null };
    var groupItems = [];
    function addQuestion(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "car-question", text: prompt }));
      var row = element(doc, "div", { className: "car-choices", role: "group", "aria-label": prompt });
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
    addQuestion("expectation", "9 条边独立切分的期望切边数？", [["low", "低于 4.5"], ["half", "等于 4.5"], ["high", "固定就是 9"]]);
    addQuestion("repeat", "一次成功率 1/2，重复 10 次全失败？", [["likely", "约 1/2"], ["tiny", "2^-10"], ["zero", "不可能"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "car-actions" }, [element(doc, "button", { type: "submit", className: "car-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "car-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "car-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "car-layout" });
    var controls = element(doc, "div", { className: "car-controls" });
    var seedOutput = element(doc, "output", { text: "17" });
    var seedInput = element(doc, "input", { type: "range", min: "1", max: "99", step: "1", value: "17" });
    var repeatOutput = element(doc, "output", { text: "8" });
    var repeatInput = element(doc, "input", { type: "range", min: "1", max: "20", step: "1", value: "8" });
    controls.appendChild(element(doc, "div", { className: "car-control" }, [element(doc, "label", {}, ["固定种子 ", seedOutput]), seedInput]));
    controls.appendChild(element(doc, "div", { className: "car-control" }, [element(doc, "label", {}, ["重复次数 ", repeatOutput]), repeatInput]));
    var actions = element(doc, "div", { className: "car-actions" });
    var previous = element(doc, "button", { type: "button", text: "上一试验" });
    var next = element(doc, "button", { type: "button", className: "car-primary", text: "下一试验" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(previous);
    actions.appendChild(next);
    actions.appendChild(reset);
    controls.appendChild(actions);
    layout.appendChild(controls);
    var stage = element(doc, "div", { className: "car-stage" });
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "car-metrics" });
    var metricCurrent = element(doc, "div", { className: "car-metric" });
    var metricBest = element(doc, "div", { className: "car-metric" });
    var metricExpected = element(doc, "div", { className: "car-metric" });
    metrics.appendChild(metricCurrent);
    metrics.appendChild(metricBest);
    metrics.appendChild(metricExpected);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "随机切分样本" });
    table.innerHTML = "<thead><tr><th>试验</th><th>切边</th><th>组 0 / 组 1</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);

    var state = { seed: 17, repeats: 8, index: 0 };
    function render() {
      var rows = samples(state.seed, state.repeats);
      state.index = Math.min(state.index, rows.length - 1);
      var row = rows[state.index];
      var best = rows.reduce(function (maximum, item) { return Math.max(maximum, item.score); }, 0);
      var optimum = bestCut();
      seedOutput.textContent = String(state.seed);
      repeatOutput.textContent = String(state.repeats);
      stage.replaceChildren(renderGraph(doc, row.bits, row.score, best));
      metricCurrent.innerHTML = "<span>当前切边</span><strong>" + row.score + " / " + EDGES.length + "</strong>";
      metricBest.innerHTML = "<span>本轮最好</span><strong>" + best + "；最优 " + optimum.score + "</strong>";
      metricExpected.innerHTML = "<span>理论期望</span><strong>" + (EDGES.length / 2).toFixed(1) + "</strong>";
      table.querySelector("tbody").innerHTML = rows.map(function (item) {
        return "<tr><th>" + item.round + "</th><td>" + item.score + "</td><td>" + item.bits.join("") + "</td></tr>";
      }).join("");
      previous.disabled = state.index === 0;
      next.disabled = state.index === rows.length - 1;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.expectation || !answers.repeat) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.expectation === "half" ? 1 : 0) + (answers.repeat === "tiny" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在查看固定种子的样本账。";
      render();
    });
    seedInput.addEventListener("input", function () { state.seed = Number(seedInput.value); state.index = 0; render(); });
    repeatInput.addEventListener("input", function () { state.repeats = Number(repeatInput.value); state.index = 0; render(); });
    previous.addEventListener("click", function () { state.index -= 1; render(); });
    next.addEventListener("click", function () { state.index += 1; render(); });
    reset.addEventListener("click", function () { state = { seed: 17, repeats: 8, index: 0 }; seedInput.value = "17"; repeatInput.value = "8"; render(); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var optimum = bestCut();
    check(optimum.score >= EDGES.length / 2, "maximum cut reaches the random expectation lower bound");
    check(cutScore(optimum.bits) === optimum.score, "exhaustive cut certificate");
    var first = samples(17, 8);
    check(first.length === 8 && first[0].bits.length === 6, "deterministic sample shape");
    check(first.every(function (item) { return item.score >= 0 && item.score <= EDGES.length; }), "cut scores are bounded");
    check(samples(17, 8).map(function (item) { return item.score; }).join(",") === first.map(function (item) { return item.score; }).join(","), "seed is reproducible");
    check(Math.pow(0.5, 10) === 1 / 1024, "failure amplification arithmetic");
    return { checks: checks, optimum: optimum.score };
  }

  return { mount: mount, selfTest: selfTest, samples: samples, bestCut: bestCut };
});
