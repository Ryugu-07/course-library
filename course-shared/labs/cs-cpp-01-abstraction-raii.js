(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-cpp-01-abstraction-raii", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-cpp-01-abstraction-raii self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-cpp-01-abstraction-raii self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-cpp-01-abstraction-raii";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function lifecycle(path, transfer) {
    var events = [{ step: 1, actor: "A", action: "construct", resource: "fd=7" }];
    var source = "fd=7";
    var destination = "—";
    if (transfer === "move") {
      destination = source;
      source = "—";
      events.push({ step: 2, actor: "B", action: "move-construct from A", resource: destination });
    } else {
      destination = "fd=7b";
      events.push({ step: 2, actor: "B", action: "copy construct", resource: "fd=7 (独立句柄)" });
    }
    if (path === "throw") {
      events.push({ step: 3, actor: "scope", action: "exception / stack unwind", resource: "析构逆序" });
      events.push({ step: 4, actor: "B", action: "destruct", resource: destination === "—" ? "fd=7" : destination });
      events.push({ step: 5, actor: "A", action: "destruct", resource: source });
    } else {
      events.push({ step: 3, actor: "return", action: "scope exit", resource: "析构逆序" });
      events.push({ step: 4, actor: "B", action: "destruct", resource: destination });
      events.push({ step: 5, actor: "A", action: "destruct", resource: source });
    }
    var closes = events.filter(function (event) { return event.action === "destruct" && event.resource !== "—"; }).length;
    return { path: path, transfer: transfer, events: events, source: source, destination: destination, closes: closes };
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
      '[data-learning-lab="' + NAME + '"]{--cra-blue:#245a9b;--cra-green:#2d7a4b;--cra-orange:#a86213;--cra-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cra-primary{background:var(--cra-blue);border-color:var(--cra-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cra-choices,[data-learning-lab="' + NAME + '"] .cra-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cra-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cra-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cra-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cra-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cra-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] .cra-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cra-metric{padding:7px;border-top:3px solid var(--cra-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cra-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cra-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}' +
      '@media(max-width:500px){[data-learning-lab="' + NAME + '"] .cra-choices,[data-learning-lab="' + NAME + '"] .cra-actions,[data-learning-lab="' + NAME + '"] .cra-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .cra-metrics{grid-template-columns:1fr}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "C++ RAII：异常、移动与资源唯一性" }));
    shell.appendChild(element(doc, "p", { className: "cra-note", text: "先预测 fd=7 的最终主人和关闭次数，再切换返回/异常与 copy/move。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { close: null, move: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cra-choices", role: "group", "aria-label": prompt });
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
    question("close", "异常栈展开后 fd=7 应关闭？", [["once", "一次"], ["none", "不关闭"]]);
    question("move", "移动后资源应该？", [["transfer", "转移给 B"], ["copy", "复制给 B"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cra-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cra-actions" }, [element(doc, "button", { type: "submit", className: "cra-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cra-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cra-controls" });
    var path = element(doc, "select", { "aria-label": "控制流路径" });
    [["normal", "正常返回"], ["throw", "构造后抛异常"]].forEach(function (option) { path.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var transfer = element(doc, "select", { "aria-label": "对象传递" });
    [["move", "move 转移"], ["copy", "copy 独立资源"]].forEach(function (option) { transfer.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    controls.appendChild(element(doc, "label", { className: "cra-control" }, ["路径", path]));
    controls.appendChild(element(doc, "label", { className: "cra-control" }, ["传递", transfer]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cra-metrics" });
    var metricSource = element(doc, "div", { className: "cra-metric" });
    var metricDest = element(doc, "div", { className: "cra-metric" });
    var metricCloses = element(doc, "div", { className: "cra-metric" });
    [metricSource, metricDest, metricCloses].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "RAII 生命周期 trace" });
    table.innerHTML = "<thead><tr><th>步骤</th><th>对象</th><th>动作</th><th>资源状态</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = lifecycle(path.value, transfer.value);
      metricSource.innerHTML = "<span>A 终态</span><strong>" + data.source + "</strong>";
      metricDest.innerHTML = "<span>B 终态</span><strong>" + data.destination + "</strong>";
      metricCloses.innerHTML = "<span>关闭次数</span><strong>" + data.closes + "</strong>";
      table.querySelector("tbody").innerHTML = data.events.map(function (event) {
        return "<tr><th>" + event.step + "</th><td>" + event.actor + "</td><td>" + event.action + "</td><td>" + event.resource + "</td></tr>";
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.close || !answers.move) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.close === "once" ? 1 : 0) + (answers.move === "transfer" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在切换路径观察析构顺序。";
      render();
    });
    path.addEventListener("change", render);
    transfer.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var moved = lifecycle("throw", "move");
    var copied = lifecycle("normal", "copy");
    check(moved.source === "—" && moved.destination === "fd=7", "move transfers source resource");
    check(moved.closes === 1, "RAII closes moved handle once");
    check(copied.closes === 2, "copy has two independent handles");
    check(moved.events[2].action.indexOf("exception") !== -1, "exception unwind is traced");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, lifecycle: lifecycle };
});
