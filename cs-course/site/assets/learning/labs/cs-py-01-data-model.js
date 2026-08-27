(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-py-01-data-model", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-py-01-data-model self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-py-01-data-model self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-py-01-data-model";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function protocolTrace(mode, steps) {
    var rows;
    if (mode === "list") {
      rows = [
        { event: "a=[1,2]", state: "a → L0=[1,2]" },
        { event: "b=a", state: "a,b → L0=[1,2]" },
        { event: "b += [3]", state: "__iadd__ mutates L0" },
        { event: "observe", state: "a=[1,2,3]; b=[1,2,3]" }
      ];
    } else if (mode === "tuple") {
      rows = [
        { event: "t=(1,2)", state: "t → T0=(1,2)" },
        { event: "u=t", state: "t,u → T0=(1,2)" },
        { event: "u += (3,)", state: "__iadd__ unavailable; __add__ creates T1" },
        { event: "observe", state: "t → T0; u → T1=(1,2,3)" }
      ];
    } else {
      rows = [
        { event: "it=iter([10,20,30])", state: "cursor=0" },
        { event: "next(it)", state: "return 10; cursor=1" },
        { event: "next(it)", state: "return 20; cursor=2" },
        { event: "next(it)", state: "return 30; cursor=3" },
        { event: "next(it)", state: "StopIteration; cursor=3" }
      ];
    }
    return rows.slice(0, Math.max(1, Math.min(rows.length, Number(steps) || rows.length)));
  }

  function evaluate(mode, steps) {
    var rows = protocolTrace(mode, steps);
    return {
      mode: mode,
      rows: rows,
      alias: mode === "list",
      dispatch: mode === "list" ? "__iadd__" : mode === "tuple" ? "__add__ after NotImplemented" : "__next__",
      exhausted: mode === "iterator" && rows.length >= 5
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
      '[data-learning-lab="' + NAME + '"]{--cpm-blue:#245a9b;--cpm-green:#2d7a4b;--cpm-orange:#a86213;--cpm-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cpm-primary{background:var(--cpm-blue);border-color:var(--cpm-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cpm-choices,[data-learning-lab="' + NAME + '"] .cpm-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cpm-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cpm-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cpm-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cpm-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cpm-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cpm-blue)}[data-learning-lab="' + NAME + '"] .cpm-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + NAME + '"] .cpm-metric{padding:7px;border-top:3px solid var(--cpm-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cpm-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cpm-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}' +
      '@media(max-width:500px){[data-learning-lab="' + NAME + '"] .cpm-choices,[data-learning-lab="' + NAME + '"] .cpm-actions,[data-learning-lab="' + NAME + '"] .cpm-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .cpm-metrics{grid-template-columns:1fr}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "Python 数据模型：绑定、dunder 与迭代器" }));
    shell.appendChild(element(doc, "p", { className: "cpm-note", text: "先预测身份和协议分派，再逐步打开对象状态账本。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { alias: null, iterator: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cpm-choices", role: "group", "aria-label": prompt });
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
    question("alias", "list 的 b += [3] 后，a 与 b？", [["same", "仍是同一对象"], ["new", "一定是两个对象"]]);
    question("iterator", "迭代器耗尽后再次 next？", [["stop", "继续抛 StopIteration"], ["restart", "自动从头开始"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cpm-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cpm-actions" }, [element(doc, "button", { type: "submit", className: "cpm-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cpm-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cpm-controls" });
    var mode = element(doc, "select", { "aria-label": "数据模型场景" });
    [["list", "list：__iadd__ 原地扩展"], ["tuple", "tuple：__add__ 新对象"], ["iterator", "iterator：游标与 StopIteration"]].forEach(function (option) { mode.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var steps = element(doc, "input", { type: "range", min: "1", max: "5", value: "5", step: "1" });
    var stepsOut = element(doc, "output", { text: "5" });
    controls.appendChild(element(doc, "label", { className: "cpm-control" }, ["场景", mode]));
    controls.appendChild(element(doc, "label", { className: "cpm-control" }, ["trace 步数 = ", stepsOut, steps]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cpm-metrics" });
    var metricDispatch = element(doc, "div", { className: "cpm-metric" });
    var metricAlias = element(doc, "div", { className: "cpm-metric" });
    var metricEnd = element(doc, "div", { className: "cpm-metric" });
    [metricDispatch, metricAlias, metricEnd].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "Python 数据模型状态 trace" });
    table.innerHTML = "<thead><tr><th>步</th><th>事件</th><th>对象/状态</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = evaluate(mode.value, Number(steps.value));
      stepsOut.textContent = steps.value;
      metricDispatch.innerHTML = "<span>协议分派</span><strong>" + data.dispatch + "</strong>";
      metricAlias.innerHTML = "<span>别名仍相同</span><strong>" + (data.alias ? "是" : "否 / 不适用") + "</strong>";
      metricEnd.innerHTML = "<span>终态</span><strong>" + (data.exhausted ? "exhausted" : "可继续") + "</strong>";
      table.querySelector("tbody").innerHTML = data.rows.map(function (row, index) {
        return "<tr><th>" + (index + 1) + "</th><td><code>" + row.event + "</code></td><td>" + row.state + "</td></tr>";
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.alias || !answers.iterator) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.alias === "same" ? 1 : 0) + (answers.iterator === "stop" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在换一个协议场景。";
      render();
    });
    mode.addEventListener("change", render);
    steps.addEventListener("input", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var list = evaluate("list", 5);
    var tuple = evaluate("tuple", 5);
    var iterator = evaluate("iterator", 5);
    check(list.alias && list.dispatch === "__iadd__", "mutable list protocol");
    check(!tuple.alias && tuple.dispatch.indexOf("__add__") !== -1, "immutable tuple fallback");
    check(iterator.exhausted && iterator.rows[4].state.indexOf("StopIteration") !== -1, "iterator exhaustion");
    check(protocolTrace("list", 2).length === 2, "trace limit");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, protocolTrace: protocolTrace, evaluate: evaluate };
});
