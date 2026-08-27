(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-rust-01-ownership", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-rust-01-ownership self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-rust-01-ownership self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-rust-01-ownership";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function scenario(kind) {
    if (kind === "move") {
      return [
        { step: 1, code: "let s = String::from(\"hi\")", owner: "s", shared: "—", result: "通过" },
        { step: 2, code: "let t = s", owner: "t", shared: "—", result: "move；s 不可用" },
        { step: 3, code: "drop(t)", owner: "—", shared: "—", result: "buffer 释放一次" }
      ];
    }
    if (kind === "shared") {
      return [
        { step: 1, code: "let s = String::from(\"hi\")", owner: "s", shared: "—", result: "通过" },
        { step: 2, code: "let a = &s; let b = &s", owner: "s", shared: "a,b: &T", result: "多个只读借用" },
        { step: 3, code: "read(a); read(b)", owner: "s", shared: "a,b: &T", result: "通过；不可写" }
      ];
    }
    if (kind === "mutable") {
      return [
        { step: 1, code: "let s = String::from(\"hi\")", owner: "s", shared: "—", result: "通过" },
        { step: 2, code: "let a = &mut s", owner: "s", shared: "a: &mut T", result: "独占借用" },
        { step: 3, code: "a.push('!')", owner: "s", shared: "a: &mut T", result: "通过；写入安全" }
      ];
    }
    return [
      { step: 1, code: "let a = &s", owner: "s", shared: "a: &T", result: "读借用有效" },
      { step: 2, code: "s.push('!')", owner: "s", shared: "a: &T", result: "拒绝：可变与共享冲突" },
      { step: 3, code: "read(a)", owner: "s", shared: "a: &T", result: "不构造该程序" }
    ];
  }

  function evaluate(kind) {
    var rows = scenario(kind);
    return { kind: kind, rows: rows, accepted: kind !== "conflict", owner: rows[rows.length - 1].owner, borrow: rows[rows.length - 1].shared };
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
      '[data-learning-lab="' + NAME + '"]{--cro-blue:#245a9b;--cro-green:#2d7a4b;--cro-orange:#a86213;--cro-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cro-primary{background:var(--cro-blue);border-color:var(--cro-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cro-choices,[data-learning-lab="' + NAME + '"] .cro-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cro-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cro-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cro-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cro-controls{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cro-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] .cro-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cro-metric{padding:7px;border-top:3px solid var(--cro-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cro-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cro-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}' +
      '@media(max-width:500px){[data-learning-lab="' + NAME + '"] .cro-choices,[data-learning-lab="' + NAME + '"] .cro-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .cro-metrics{grid-template-columns:1fr}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "Rust 所有权状态机：move 与借用区间" }));
    shell.appendChild(element(doc, "p", { className: "cro-note", text: "先预测哪些语句通过借用检查，再观察 owner 和引用权限随作用域变化。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { move: null, borrow: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cro-choices", role: "group", "aria-label": prompt });
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
    question("move", "move 后原变量还能读取？", [["no", "不能"], ["yes", "能"]]);
    question("borrow", "共享借用期间可变写入？", [["no", "不能"], ["yes", "能"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cro-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cro-actions" }, [element(doc, "button", { type: "submit", className: "cro-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cro-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cro-controls" });
    var kind = element(doc, "select", { "aria-label": "所有权场景" });
    [["move", "move：s → t"], ["shared", "shared：多个 &T"], ["mutable", "mutable：一个 &mut T"], ["conflict", "conflict：&T + 写入"]].forEach(function (option) { kind.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    controls.appendChild(element(doc, "label", { className: "cro-control" }, ["场景", kind]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cro-metrics" });
    var metricAccepted = element(doc, "div", { className: "cro-metric" });
    var metricOwner = element(doc, "div", { className: "cro-metric" });
    var metricBorrow = element(doc, "div", { className: "cro-metric" });
    [metricAccepted, metricOwner, metricBorrow].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "Rust ownership borrow trace" });
    table.innerHTML = "<thead><tr><th>步</th><th>代码</th><th>owner</th><th>引用</th><th>结论</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = evaluate(kind.value);
      metricAccepted.innerHTML = "<span>编译结果</span><strong>" + (data.accepted ? "通过" : "拒绝") + "</strong>";
      metricOwner.innerHTML = "<span>owner</span><strong>" + data.owner + "</strong>";
      metricBorrow.innerHTML = "<span>引用权限</span><strong>" + data.borrow + "</strong>";
      table.querySelector("tbody").innerHTML = data.rows.map(function (row) {
        return "<tr><th>" + row.step + "</th><td><code>" + row.code + "</code></td><td>" + row.owner + "</td><td>" + row.shared + "</td><td>" + row.result + "</td></tr>";
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.move || !answers.borrow) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.move === "no" ? 1 : 0) + (answers.borrow === "no" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在切换合法与冲突场景。";
      render();
    });
    kind.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(evaluate("move").accepted && evaluate("move").owner === "—", "move releases source");
    check(evaluate("shared").accepted && evaluate("shared").borrow.indexOf("&T") !== -1, "shared borrows");
    check(evaluate("mutable").accepted && evaluate("mutable").borrow.indexOf("&mut") !== -1, "mutable borrow");
    check(!evaluate("conflict").accepted, "borrow conflict rejected");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, scenario: scenario, evaluate: evaluate };
});
