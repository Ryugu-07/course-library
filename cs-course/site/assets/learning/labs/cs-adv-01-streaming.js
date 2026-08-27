(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-adv-01-streaming", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-adv-01-streaming self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-adv-01-streaming self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-adv-01-streaming";
  var STREAM = ["a", "b", "a", "c", "d", "b", "a", "e", "c", "b", "f", "a", "d", "c", "b", "a"];
  var KEYS = ["a", "b", "c", "d", "e", "f"];
  var SALTS = [17, 31, 47, 73];

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function hash(key, row, width) {
    var value = SALTS[row] || 11;
    for (var i = 0; i < key.length; i += 1) value = (value * 33 + key.charCodeAt(i)) >>> 0;
    return value % width;
  }

  function exactCounts(stream) {
    var counts = {};
    stream.forEach(function (key) { counts[key] = (counts[key] || 0) + 1; });
    return counts;
  }

  function buildSketch(stream, width, depth) {
    var matrix = [];
    for (var row = 0; row < depth; row += 1) matrix.push(new Array(width).fill(0));
    stream.forEach(function (key) {
      for (var index = 0; index < depth; index += 1) matrix[index][hash(key, index, width)] += 1;
    });
    return { width: width, depth: depth, matrix: matrix };
  }

  function estimate(sketch, key) {
    var values = [];
    for (var row = 0; row < sketch.depth; row += 1) values.push(sketch.matrix[row][hash(key, row, sketch.width)]);
    return { value: Math.min.apply(null, values), rowValues: values };
  }

  function merge(left, right) {
    assert(left.width === right.width && left.depth === right.depth, "sketch shapes must match");
    var matrix = [];
    for (var row = 0; row < left.depth; row += 1) {
      matrix.push(left.matrix[row].map(function (value, column) { return value + right.matrix[row][column]; }));
    }
    return { width: left.width, depth: left.depth, matrix: matrix };
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

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cas-blue:#315f9d;--cas-gold:#a36a16;--cas-green:#39734d;--cas-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cas-primary{background:var(--cas-blue);border-color:var(--cas-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cas-choices,[data-learning-lab="' + NAME + '"] .cas-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cas-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .cas-feedback,[data-learning-lab="' + NAME + '"] .cas-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .cas-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .cas-layout{display:grid;grid-template-columns:minmax(190px,.55fr) minmax(0,1.45fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .cas-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .cas-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .cas-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cas-blue)}' +
      '[data-learning-lab="' + NAME + '"] .cas-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:auto}[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;min-width:430px;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft)}' +
      '[data-learning-lab="' + NAME + '"] .cas-hit{background:color-mix(in srgb,var(--cas-gold) 20%,transparent);font-weight:750}[data-learning-lab="' + NAME + '"] .cas-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cas-metric{padding:8px;border-top:2px solid var(--cas-blue)}[data-learning-lab="' + NAME + '"] .cas-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .cas-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cas-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .cas-choices,[data-learning-lab="' + NAME + '"] .cas-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function matrixTable(doc, sketch, query) {
    var selected = {};
    for (var row = 0; row < sketch.depth; row += 1) selected[hash(query, row, sketch.width)] = true;
    var table = element(doc, "table", { "aria-label": "Count-Min Sketch 计数矩阵" });
    table.innerHTML = "<caption>行 i 与列 j 的计数 C[i,j]；金色格是查询键 " + query + " 读取的位置</caption><thead><tr><th>行 / 列</th>" +
      Array.from({ length: sketch.width }, function (_, index) { return "<th>" + index + "</th>"; }).join("") + "</tr></thead>";
    var body = doc.createElement("tbody");
    for (var index = 0; index < sketch.depth; index += 1) {
      var html = "<tr><th>" + index + "</th>";
      for (var column = 0; column < sketch.width; column += 1) {
        html += "<td" + (column === hash(query, index, sketch.width) ? " class=\"cas-hit\"" : "") + ">" + sketch.matrix[index][column] + "</td>";
      }
      html += "</tr>";
      body.insertAdjacentHTML("beforeend", html);
    }
    table.appendChild(body);
    return table;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "Count-Min Sketch：把碰撞变成单边证据" }));
    shell.appendChild(element(doc, "p", { className: "cas-note", text: "先预测估计值的方向和分片合并性质，揭示后改变宽度、深度和查询键。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { direction: null, merge: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "cas-question", text: prompt }));
      var row = element(doc, "div", { className: "cas-choices", role: "group", "aria-label": prompt });
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
    question("direction", "Count-Min 查询会低估真实频率吗？", [["yes", "可能低估"], ["no", "不会低估"], ["same", "必然相等"]]);
    question("merge", "固定哈希下，分片草图相加等于整流草图？", [["yes", "等于"], ["no", "不等于"], ["random", "取决于机器"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "cas-actions" }, [element(doc, "button", { type: "submit", className: "cas-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "cas-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "cas-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "cas-layout" });
    var controls = element(doc, "div", { className: "cas-controls" });
    var widthInput = element(doc, "input", { type: "range", min: "3", max: "8", step: "1", value: "4" });
    var widthOutput = element(doc, "output", { text: "4" });
    var depthInput = element(doc, "input", { type: "range", min: "2", max: "4", step: "1", value: "3" });
    var depthOutput = element(doc, "output", { text: "3" });
    var query = element(doc, "select", { "aria-label": "查询键" });
    KEYS.forEach(function (key) { query.appendChild(element(doc, "option", { value: key, text: key })); });
    query.value = "b";
    controls.appendChild(element(doc, "div", { className: "cas-control" }, [element(doc, "label", {}, ["宽度 w = ", widthOutput]), widthInput]));
    controls.appendChild(element(doc, "div", { className: "cas-control" }, [element(doc, "label", {}, ["深度 d = ", depthOutput]), depthInput]));
    controls.appendChild(element(doc, "label", { className: "cas-control" }, ["查询键 ", query]));
    layout.appendChild(controls);
    var stage = element(doc, "div", { className: "cas-stage" });
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "cas-metrics" });
    var estimateMetric = element(doc, "div", { className: "cas-metric" });
    var exactMetric = element(doc, "div", { className: "cas-metric" });
    var mergeMetric = element(doc, "div", { className: "cas-metric" });
    metrics.appendChild(estimateMetric);
    metrics.appendChild(exactMetric);
    metrics.appendChild(mergeMetric);
    revealed.appendChild(metrics);
    var note = element(doc, "p", { className: "cas-note" });
    revealed.appendChild(note);
    shell.appendChild(revealed);
    root.appendChild(shell);

    function render() {
      var width = Number(widthInput.value);
      var depth = Number(depthInput.value);
      var sketch = buildSketch(STREAM, width, depth);
      var split = buildSketch(STREAM.slice(0, 8), width, depth);
      var tail = buildSketch(STREAM.slice(8), width, depth);
      var merged = merge(split, tail);
      var item = estimate(sketch, query.value);
      var exact = exactCounts(STREAM)[query.value] || 0;
      widthOutput.textContent = String(width);
      depthOutput.textContent = String(depth);
      stage.replaceChildren(matrixTable(doc, sketch, query.value));
      estimateMetric.innerHTML = "<span>估计 " + query.value + "</span><strong>" + item.value + "（行值 " + item.rowValues.join(" / ") + "）</strong>";
      exactMetric.innerHTML = "<span>精确频率</span><strong>" + exact + "；误差 +" + (item.value - exact) + "</strong>";
      mergeMetric.innerHTML = "<span>分片合并</span><strong>" + (JSON.stringify(merged.matrix) === JSON.stringify(sketch.matrix) ? "逐格相等" : "不相等") + "</strong>";
      note.textContent = "流长度 " + STREAM.length + "；更新只增不减，查询取各行最小值。改变宽度会改变碰撞，但不会改变整流与分片的线性合并关系。";
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.direction || !answers.merge) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.direction === "no" ? 1 : 0) + (answers.merge === "yes" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在查看碰撞矩阵。";
      render();
    });
    widthInput.addEventListener("input", render);
    depthInput.addEventListener("input", render);
    query.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var sketch = buildSketch(STREAM, 4, 3);
    var counts = exactCounts(STREAM);
    KEYS.forEach(function (key) { check(estimate(sketch, key).value >= (counts[key] || 0), "no underestimation for " + key); });
    var merged = merge(buildSketch(STREAM.slice(0, 8), 4, 3), buildSketch(STREAM.slice(8), 4, 3));
    check(JSON.stringify(merged.matrix) === JSON.stringify(sketch.matrix), "mergeable sketch");
    check(STREAM.length === 16 && counts.a === 5 && counts.b === 4, "fixed stream ledger");
    check(estimate(sketch, "a").rowValues.length === 3, "depth controls row evidence");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, buildSketch: buildSketch, estimate: estimate, merge: merge };
});
