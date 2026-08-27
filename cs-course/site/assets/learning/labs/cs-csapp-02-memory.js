(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-csapp-02-memory", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-csapp-02-memory self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-csapp-02-memory self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-csapp-02-memory";
  var N = 4;
  var LINE_SIZE = 2;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function accessSequence(order) {
    var sequence = [];
    for (var outer = 0; outer < N; outer += 1) {
      for (var inner = 0; inner < N; inner += 1) {
        var row = order === "row" ? outer : inner;
        var column = order === "row" ? inner : outer;
        sequence.push({ row: row, column: column, index: row * N + column });
      }
    }
    return sequence;
  }

  function simulate(order, capacity) {
    var slots = [];
    var trace = [];
    accessSequence(order).forEach(function (access, step) {
      var block = Math.floor(access.index / LINE_SIZE);
      var hitIndex = slots.indexOf(block);
      var hit = hitIndex >= 0;
      if (hit) slots.splice(hitIndex, 1);
      else if (slots.length >= capacity) slots.pop();
      slots.unshift(block);
      trace.push({ step: step + 1, row: access.row, column: access.column, index: access.index, block: block, hit: hit, slots: slots.slice() });
    });
    return {
      order: order,
      capacity: capacity,
      trace: trace,
      hits: trace.filter(function (item) { return item.hit; }).length,
      misses: trace.filter(function (item) { return !item.hit; }).length
    };
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

  function renderMatrix(doc, result, cursor) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 560 360", role: "img", "aria-label": "矩阵访问顺序与缓存块" });
    var visible = result.trace.slice(0, cursor);
    var status = {};
    visible.forEach(function (item) { status[item.index] = item.hit ? "hit" : "miss"; });
    for (var row = 0; row < N; row += 1) {
      for (var column = 0; column < N; column += 1) {
        var index = row * N + column;
        var kind = status[index] || "none";
        var x = 42 + column * 64;
        var y = 42 + row * 52;
        svg.appendChild(svgElement(doc, "rect", { x: x, y: y, width: 50, height: 38, rx: 4, class: "cmm-cell cmm-" + kind }));
        svg.appendChild(svgElement(doc, "text", { x: x + 25, y: y + 17, class: "cmm-label" }, String(index)));
        svg.appendChild(svgElement(doc, "text", { x: x + 25, y: y + 32, class: "cmm-small", "text-anchor": "middle" }, kind === "none" ? "" : kind));
      }
    }
    var last = visible[visible.length - 1];
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 18, class: "cmm-small" }, "按" + (result.order === "row" ? "行" : "列") + "访问；每行缓存 2 个整数；蓝 hit / 金 miss"));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 270, class: "cmm-small" }, last ? "最近：矩阵[" + last.row + "," + last.column + "] → 块 " + last.block + "，" + (last.hit ? "命中" : "缺失") : "点击下一访问开始记录"));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 305, class: "cmm-small" }, "LRU 缓存槽（MRU → LRU）：" + (last ? last.slots.join("，") : "空")));
    return svg;
  }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cmm-blue:#315f9d;--cmm-gold:#a36a16;--cmm-green:#39734d;--cmm-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cmm-primary{background:var(--cmm-blue);border-color:var(--cmm-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cmm-choices,[data-learning-lab="' + NAME + '"] .cmm-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cmm-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .cmm-feedback,[data-learning-lab="' + NAME + '"] .cmm-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .cmm-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .cmm-layout{display:grid;grid-template-columns:minmax(190px,.55fr) minmax(0,1.45fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .cmm-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .cmm-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .cmm-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cmm-blue)}' +
      '[data-learning-lab="' + NAME + '"] .cmm-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] .cmm-cell{stroke:var(--border);stroke-width:1}[data-learning-lab="' + NAME + '"] .cmm-hit{fill:var(--cmm-blue)}[data-learning-lab="' + NAME + '"] .cmm-miss{fill:var(--cmm-gold)}[data-learning-lab="' + NAME + '"] .cmm-none{fill:var(--bg)}[data-learning-lab="' + NAME + '"] .cmm-label{font-size:14px;font-weight:750;text-anchor:middle}[data-learning-lab="' + NAME + '"] .cmm-hit+.cmm-label,[data-learning-lab="' + NAME + '"] .cmm-label{fill:currentColor}[data-learning-lab="' + NAME + '"] .cmm-small{font-size:11px;fill:var(--fg-soft)!important}' +
      '[data-learning-lab="' + NAME + '"] .cmm-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cmm-metric{padding:8px;border-top:2px solid var(--cmm-blue)}[data-learning-lab="' + NAME + '"] .cmm-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .cmm-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cmm-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .cmm-choices,[data-learning-lab="' + NAME + '"] .cmm-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "缓存追踪：一次搬运能服务多少访问？" }));
    shell.appendChild(element(doc, "p", { className: "cmm-note", text: "先预测行/列扫描的 miss 数，揭示后逐访问观察块号、LRU 槽和命中类型。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { order: null, line: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "cmm-question", text: prompt }));
      var row = element(doc, "div", { className: "cmm-choices", role: "group", "aria-label": prompt });
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
    question("order", "2 行缓存下，哪种扫描更少 miss？", [["column", "按列"], ["row", "按行"], ["same", "一样"]]);
    question("line", "缓存行一次带入 2 个整数意味着？", [["one", "只带当前整数"], ["two", "相邻两个可共享一次 miss"], ["all", "带入整矩阵"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "cmm-actions" }, [element(doc, "button", { type: "submit", className: "cmm-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "cmm-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "cmm-revealed", hidden: "hidden" });
    var layoutShell = element(doc, "div", { className: "cmm-layout" });
    var controls = element(doc, "div", { className: "cmm-controls" });
    var orderSelect = element(doc, "select", { "aria-label": "访问顺序" });
    orderSelect.appendChild(element(doc, "option", { value: "row", text: "按行（连续）" }));
    orderSelect.appendChild(element(doc, "option", { value: "column", text: "按列（跨步）" }));
    var capacity = element(doc, "select", { "aria-label": "缓存行槽数" });
    [2, 4, 8].forEach(function (value) { capacity.appendChild(element(doc, "option", { value: value, text: "缓存槽 " + value })); });
    var stepButton = element(doc, "button", { type: "button", className: "cmm-primary", text: "下一次访问" });
    var runButton = element(doc, "button", { type: "button", text: "跑完整序列" });
    var resetButton = element(doc, "button", { type: "button", text: "重置" });
    controls.appendChild(element(doc, "label", { className: "cmm-control" }, ["访问顺序 ", orderSelect]));
    controls.appendChild(element(doc, "label", { className: "cmm-control" }, ["容量 ", capacity]));
    var actions = element(doc, "div", { className: "cmm-actions" });
    actions.appendChild(stepButton);
    actions.appendChild(runButton);
    actions.appendChild(resetButton);
    controls.appendChild(actions);
    layoutShell.appendChild(controls);
    var stage = element(doc, "div", { className: "cmm-stage" });
    layoutShell.appendChild(stage);
    revealed.appendChild(layoutShell);
    var metrics = element(doc, "div", { className: "cmm-metrics" });
    var missMetric = element(doc, "div", { className: "cmm-metric" });
    var hitMetric = element(doc, "div", { className: "cmm-metric" });
    var blockMetric = element(doc, "div", { className: "cmm-metric" });
    metrics.appendChild(missMetric);
    metrics.appendChild(hitMetric);
    metrics.appendChild(blockMetric);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "最近缓存访问" });
    table.innerHTML = "<thead><tr><th>步</th><th>矩阵项</th><th>块</th><th>结果</th><th>槽</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    var note = element(doc, "p", { className: "cmm-note" });
    revealed.appendChild(note);
    shell.appendChild(revealed);
    root.appendChild(shell);

    var cursor = 0;
    function render() {
      var result = simulate(orderSelect.value, Number(capacity.value));
      cursor = Math.min(cursor, result.trace.length);
      var visible = result.trace.slice(0, cursor);
      var misses = visible.filter(function (item) { return !item.hit; }).length;
      var hits = visible.length - misses;
      stage.replaceChildren(renderMatrix(doc, result, cursor));
      missMetric.innerHTML = "<span>已发生 miss</span><strong>" + misses + "</strong>";
      hitMetric.innerHTML = "<span>已发生 hit</span><strong>" + hits + "</strong>";
      blockMetric.innerHTML = "<span>完整序列</span><strong>" + result.misses + " miss / " + result.hits + " hit</strong>";
      table.querySelector("tbody").innerHTML = visible.slice(-8).map(function (item) {
        return "<tr><th>" + item.step + "</th><td>[" + item.row + "," + item.column + "] / " + item.index + "</td><td>" + item.block + "</td><td>" + (item.hit ? "hit" : "miss") + "</td><td>" + item.slots.join(" → ") + "</td></tr>";
      }).join("");
      note.textContent = "块号 = floor(index / 2)；" + (orderSelect.value === "row" ? "按行让相邻元素共享块。" : "按列在 4 个块间跳跃，容量不足时反复驱逐。");
      stepButton.disabled = cursor === result.trace.length;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.order || !answers.line) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.order === "row" ? 1 : 0) + (answers.line === "two" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在逐访问查看缓存状态。";
      render();
    });
    orderSelect.addEventListener("change", function () { cursor = 0; render(); });
    capacity.addEventListener("change", function () { cursor = 0; render(); });
    stepButton.addEventListener("click", function () { cursor += 1; render(); });
    runButton.addEventListener("click", function () { cursor = 16; render(); });
    resetButton.addEventListener("click", function () { cursor = 0; orderSelect.value = "row"; capacity.value = "2"; render(); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var row = simulate("row", 2);
    var column = simulate("column", 2);
    check(row.trace.length === 16 && column.trace.length === 16, "full matrix trace");
    check(row.misses === 8 && row.hits === 8, "row locality");
    check(column.misses === 16 && column.hits === 0, "column conflict behavior");
    check(Math.floor(5 / LINE_SIZE) === 2, "block mapping");
    check(simulate("column", 8).misses === 8, "capacity removes repeated conflict");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, simulate: simulate, accessSequence: accessSequence };
});
