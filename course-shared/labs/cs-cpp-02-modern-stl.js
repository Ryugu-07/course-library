(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-cpp-02-modern-stl", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-cpp-02-modern-stl self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-cpp-02-modern-stl self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-cpp-02-modern-stl";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function evaluate(container, size, capacity, pushes) {
    var n = Math.max(1, Math.floor(Number(size)));
    var cap = Math.max(1, Math.floor(Number(capacity)));
    var p = Math.max(0, Math.floor(Number(pushes)));
    var lines;
    var scan;
    var invalidated;
    if (container === "vector") {
      lines = Math.ceil(n / 8);
      scan = lines + n * 0.05;
      invalidated = p > 0 && cap <= n + p ? "可能 reallocate" : "保留";
    } else if (container === "list") {
      lines = n;
      scan = n * 1.0;
      invalidated = "节点迭代器稳定";
    } else {
      lines = Math.ceil(n / 2);
      scan = n * 0.7;
      invalidated = p > 0 ? "rehash 依实现" : "保留";
    }
    return { container: container, size: n, capacity: cap, pushes: p, cacheLines: lines, scanCost: scan, invalidated: invalidated, complexity: container === "vector" ? "scan O(n); push 摊还 O(1)" : container === "list" ? "scan O(n); splice O(1)" : "lookup 平均 O(1)" };
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
    var id = "cl-" + NAME + "-styles";
    if (doc.getElementById(id)) return;
    var style = doc.createElement("style");
    style.id = id;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cst-blue:#245a9b;--cst-green:#2d7a4b;--cst-orange:#a86213;--cst-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cst-primary{background:var(--cst-blue);border-color:var(--cst-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cst-choices,[data-learning-lab="' + NAME + '"] .cst-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cst-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cst-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cst-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cst-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cst-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cst-blue)}[data-learning-lab="' + NAME + '"] .cst-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + NAME + '"] .cst-metric{padding:7px;border-top:3px solid var(--cst-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cst-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cst-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cst-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + NAME + '"] .cst-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:500px){[data-learning-lab="' + NAME + '"] .cst-choices,[data-learning-lab="' + NAME + '"] .cst-actions,[data-learning-lab="' + NAME + '"] .cst-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "STL 容器账本：局部性、摊还与失效" }));
    shell.appendChild(element(doc, "p", { className: "cst-note", text: "先预测顺序扫描与 push 的代价，再切换容器和容量。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { scan: null, iterator: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cst-choices", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () {
          answers[key] = choice[0];
          buttons.forEach(function (item) { if (item.key === key) item.node.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); });
        });
        buttons.push({ key: key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
    }
    question("scan", "1000 个整数顺序扫描通常谁更友好？", [["vector", "vector"], ["list", "list"]]);
    question("iterator", "vector 扩容后旧迭代器？", [["invalid", "可能失效"], ["stable", "永远稳定"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cst-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cst-actions" }, [element(doc, "button", { type: "submit", className: "cst-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cst-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cst-controls" });
    var container = element(doc, "select", { "aria-label": "容器" });
    [["vector", "vector"], ["list", "list"], ["map", "unordered_map"]].forEach(function (option) { container.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var size = element(doc, "input", { type: "range", min: "8", max: "2000", value: "1000", step: "8" });
    var sizeOut = element(doc, "output", { text: "1000" });
    var capacity = element(doc, "input", { type: "range", min: "8", max: "2048", value: "8", step: "8" });
    var capOut = element(doc, "output", { text: "8" });
    var pushes = element(doc, "input", { type: "range", min: "0", max: "64", value: "1", step: "1" });
    var pushOut = element(doc, "output", { text: "1" });
    controls.appendChild(element(doc, "label", { className: "cst-control" }, ["容器", container]));
    controls.appendChild(element(doc, "label", { className: "cst-control" }, ["元素数 = ", sizeOut, size]));
    controls.appendChild(element(doc, "label", { className: "cst-control" }, ["容量 = ", capOut, capacity]));
    controls.appendChild(element(doc, "label", { className: "cst-control" }, ["尾插次数 = ", pushOut, pushes]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cst-metrics" });
    var metricScan = element(doc, "div", { className: "cst-metric" });
    var metricLines = element(doc, "div", { className: "cst-metric" });
    var metricInvalid = element(doc, "div", { className: "cst-metric" });
    var metricComplexity = element(doc, "div", { className: "cst-metric" });
    [metricScan, metricLines, metricInvalid, metricComplexity].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "STL 容器成本账本" });
    table.innerHTML = "<thead><tr><th>维度</th><th>结果</th><th>原因</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = evaluate(container.value, Number(size.value), Number(capacity.value), Number(pushes.value));
      sizeOut.textContent = size.value;
      capOut.textContent = capacity.value;
      pushOut.textContent = pushes.value;
      metricScan.innerHTML = "<span>扫描成本</span><strong>" + data.scanCost.toFixed(1) + "</strong>";
      metricLines.innerHTML = "<span>近似 cache lines</span><strong>" + data.cacheLines + "</strong>";
      metricInvalid.innerHTML = "<span>迭代器</span><strong>" + data.invalidated + "</strong>";
      metricComplexity.innerHTML = "<span>复杂度</span><strong>" + data.complexity + "</strong>";
      table.querySelector("tbody").innerHTML =
        "<tr><th>元素数</th><td>" + data.size + "</td><td>固定 workload</td></tr>" +
        "<tr><th>连续扫描</th><td>" + data.scanCost.toFixed(1) + "</td><td>" + (container.value === "vector" ? "连续地址/预取" : "节点或 bucket 跳转") + "</td></tr>" +
        "<tr><th>push 后句柄</th><td>" + data.invalidated + "</td><td>扩容/rehash 需要重新取得迭代器</td></tr>";
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.scan || !answers.iterator) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.scan === "vector" ? 1 : 0) + (answers.iterator === "invalid" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在改变容量和容器。";
      render();
    });
    container.addEventListener("change", render);
    [size, capacity, pushes].forEach(function (input) { input.addEventListener("input", render); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var vector = evaluate("vector", 1000, 8, 1);
    var list = evaluate("list", 1000, 8, 1);
    check(vector.cacheLines === 125, "vector contiguous line estimate");
    check(vector.scanCost < list.scanCost, "vector scan locality");
    check(vector.invalidated.indexOf("reallocate") !== -1, "vector iterator invalidation");
    check(evaluate("list", 1000, 8, 1).invalidated.indexOf("稳定") !== -1, "list iterator stability");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, evaluate: evaluate };
});
