(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-par-02-lockfree", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-par-02-lockfree self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-par-02-lockfree self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-par-02-lockfree";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function abaTrace(tagged) {
    var current = { id: "A", version: 0 };
    var expected = { id: current.id, version: current.version };
    var rows = [{ actor: "T1", action: "read top", before: "A0", after: "pause" }];
    current = tagged ? { id: "B", version: 1 } : { id: "B", version: 0 };
    rows.push({ actor: "T2", action: "pop A", before: "A0", after: tagged ? "B1" : "B" });
    current = tagged ? { id: "A", version: 2 } : { id: "A", version: 0 };
    rows.push({ actor: "T2", action: "pop B; push A", before: tagged ? "B1" : "B", after: tagged ? "A2" : "A" });
    var success = tagged ? current.id === expected.id && current.version === expected.version : current.id === expected.id;
    rows.push({ actor: "T1", action: "CAS expected A", before: tagged ? "A2" : "A", after: success ? "C" : "retry" });
    return { tagged: tagged, rows: rows, casSuccess: success, safe: !success };
  }

  function publishTrace(order) {
    var release = order === "release-acquire";
    return {
      order: order,
      producer: release ? ["payload=42", "flag=1 (release)"] : ["flag=1 (relaxed)", "payload=42"],
      consumer: release ? ["acquire flag=1", "read payload=42"] : ["relaxed flag=1", "payload may be stale"]
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

  function installStyles(doc) {
    var id = "cl-" + NAME + "-styles";
    if (doc.getElementById(id)) return;
    var style = doc.createElement("style");
    style.id = id;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cla-blue:#245a9b;--cla-green:#2d7a4b;--cla-orange:#a86213;--cla-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cla-primary{background:var(--cla-blue);border-color:var(--cla-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cla-choices,[data-learning-lab="' + NAME + '"] .cla-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cla-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cla-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cla-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cla-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:11px;border:1px solid var(--border);border-radius:7px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cla-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}' +
      '[data-learning-lab="' + NAME + '"] .cla-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cla-metric{padding:7px;border-top:3px solid var(--cla-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cla-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cla-metric strong{display:block;overflow-wrap:anywhere}' +
      '@media(max-width:520px){[data-learning-lab="' + NAME + '"] .cla-choices,[data-learning-lab="' + NAME + '"] .cla-actions,[data-learning-lab="' + NAME + '"] .cla-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .cla-metrics{grid-template-columns:1fr}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "ABA 与 release/acquire：无锁正确性的两条账" }));
    shell.appendChild(element(doc, "p", { className: "cla-note", text: "先预测 CAS 是否真的发现变化，再切换版本标记和内存序。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { aba: null, order: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cla-choices", role: "group", "aria-label": prompt });
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
    question("aba", "T1 的未标记 CAS 会？", [["bad", "错误成功"], ["retry", "发现变化并重试"]]);
    question("order", "发布 payload 的正确配对是？", [["ra", "release → acquire"], ["relaxed", "relaxed → relaxed"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cla-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cla-actions" }, [element(doc, "button", { type: "submit", className: "cla-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cla-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cla-controls" });
    var tagSelect = element(doc, "select", { "aria-label": "指针表示" });
    [["plain", "未标记 A"], ["tagged", "地址 + 版本"]].forEach(function (option) { tagSelect.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var orderSelect = element(doc, "select", { "aria-label": "内存序" });
    [["release-acquire", "release / acquire"], ["relaxed", "relaxed / relaxed"]].forEach(function (option) { orderSelect.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    controls.appendChild(element(doc, "label", { className: "cla-control" }, ["CAS 表示", tagSelect]));
    controls.appendChild(element(doc, "label", { className: "cla-control" }, ["发布协议", orderSelect]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cla-metrics" });
    var metricCas = element(doc, "div", { className: "cla-metric" });
    var metricSafe = element(doc, "div", { className: "cla-metric" });
    var metricPublish = element(doc, "div", { className: "cla-metric" });
    [metricCas, metricSafe, metricPublish].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "ABA 线程交错时间线" });
    table.innerHTML = "<thead><tr><th>线程</th><th>动作</th><th>看到/产生</th><th>状态</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    var publishTable = element(doc, "table", { "aria-label": "发布订阅时间线" });
    publishTable.innerHTML = "<thead><tr><th>生产者</th><th>消费者</th></tr></thead><tbody></tbody>";
    revealed.appendChild(publishTable);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var tagged = tagSelect.value === "tagged";
      var aba = abaTrace(tagged);
      var publication = publishTrace(orderSelect.value);
      metricCas.innerHTML = "<span>CAS 结果</span><strong>" + (aba.casSuccess ? "成功" : "失败重试") + "</strong>";
      metricSafe.innerHTML = "<span>ABA 安全性</span><strong>" + (aba.safe ? "版本揭示变化" : "有风险") + "</strong>";
      metricPublish.innerHTML = "<span>可见性</span><strong>" + (orderSelect.value === "release-acquire" ? "happens-before" : "未建立") + "</strong>";
      table.querySelector("tbody").innerHTML = aba.rows.map(function (row) {
        return "<tr><th>" + row.actor + "</th><td>" + row.action + "</td><td>" + row.before + " → " + row.after + "</td><td>" + (row.after === "retry" ? "重读" : "继续") + "</td></tr>";
      }).join("");
      publishTable.querySelector("tbody").innerHTML = "<tr><td>" + publication.producer.join("；") + "</td><td>" + publication.consumer.join("；") + "</td></tr>";
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.aba || !answers.order) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.aba === "bad" ? 1 : 0) + (answers.order === "ra" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在切换表示并观察线性化点。";
      render();
    });
    tagSelect.addEventListener("change", render);
    orderSelect.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var plain = abaTrace(false);
    var tagged = abaTrace(true);
    check(plain.casSuccess && !plain.safe, "plain ABA succeeds unsafely");
    check(!tagged.casSuccess && tagged.safe, "tagged ABA retries");
    check(publishTrace("release-acquire").consumer[1] === "read payload=42", "release acquire publishes");
    check(publishTrace("relaxed").consumer[1] === "payload may be stale", "relaxed has no visibility guarantee");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, abaTrace: abaTrace, publishTrace: publishTrace };
});
