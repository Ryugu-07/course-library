(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-rust-02-concurrency", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-rust-02-concurrency self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-rust-02-concurrency self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-rust-02-concurrency";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function evaluate(mode, workers, increments) {
    var p = Math.max(1, Math.floor(Number(workers)));
    var n = Math.max(1, Math.floor(Number(increments)));
    var total = p * n;
    var accepted = mode !== "raw";
    var result = mode === "raw" ? total - Math.max(1, Math.floor(total * 0.15)) : total;
    var sync = mode === "channel" ? "owner transfer" : mode === "mutex" ? "Mutex guard" : mode === "atomic" ? "atomic RMW" : "none";
    var race = mode === "raw";
    var steps = [];
    for (var thread = 0; thread < p; thread += 1) {
      steps.push({ thread: "T" + thread, action: mode === "channel" ? "send local=" + n : mode === "raw" ? "write shared counter" : "enter " + sync, conclusion: mode === "raw" ? "data race" : "ordered" });
    }
    return { mode: mode, workers: p, increments: n, total: total, accepted: accepted, result: result, sync: sync, race: race, steps: steps };
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
      '[data-learning-lab="' + NAME + '"]{--crc-blue:#245a9b;--crc-green:#2d7a4b;--crc-orange:#a86213;--crc-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .crc-primary{background:var(--crc-blue);border-color:var(--crc-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .crc-choices,[data-learning-lab="' + NAME + '"] .crc-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .crc-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .crc-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .crc-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .crc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .crc-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--crc-blue)}[data-learning-lab="' + NAME + '"] .crc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + NAME + '"] .crc-metric{padding:7px;border-top:3px solid var(--crc-blue);min-width:0}[data-learning-lab="' + NAME + '"] .crc-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .crc-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}' +
      '@media(max-width:700px){[data-learning-lab="' + NAME + '"] .crc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + NAME + '"] .crc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .crc-choices,[data-learning-lab="' + NAME + '"] .crc-actions,[data-learning-lab="' + NAME + '"] .crc-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "Rust 并发：Send/Sync 与同步原语" }));
    shell.appendChild(element(doc, "p", { className: "crc-note", text: "先预测哪种方案能构造，再观察 ownership transfer、锁和原子 RMW 的时间线。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { raw: null, result: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "crc-choices", role: "group", "aria-label": prompt });
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
    question("raw", "裸共享可变引用跨线程？", [["reject", "编译拒绝"], ["allow", "直接允许"]]);
    question("result", "channel / Mutex / atomic 的 2×100 结果？", [["twohundred", "200"], ["lost", "可能丢失"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "crc-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "crc-actions" }, [element(doc, "button", { type: "submit", className: "crc-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "crc-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "crc-controls" });
    var mode = element(doc, "select", { "aria-label": "并发方案" });
    [["raw", "裸共享引用"], ["channel", "channel 转移"], ["mutex", "Arc<Mutex>"], ["atomic", "AtomicUsize"]].forEach(function (option) { mode.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var workers = element(doc, "input", { type: "range", min: "2", max: "8", value: "2", step: "1" });
    var workersOut = element(doc, "output", { text: "2" });
    var increments = element(doc, "input", { type: "range", min: "10", max: "500", value: "100", step: "10" });
    var incrementsOut = element(doc, "output", { text: "100" });
    controls.appendChild(element(doc, "label", { className: "crc-control" }, ["方案", mode]));
    controls.appendChild(element(doc, "label", { className: "crc-control" }, ["线程数 = ", workersOut, workers]));
    controls.appendChild(element(doc, "label", { className: "crc-control" }, ["每线程次数 = ", incrementsOut, increments]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "crc-metrics" });
    var metricBuild = element(doc, "div", { className: "crc-metric" });
    var metricResult = element(doc, "div", { className: "crc-metric" });
    var metricSync = element(doc, "div", { className: "crc-metric" });
    var metricRace = element(doc, "div", { className: "crc-metric" });
    [metricBuild, metricResult, metricSync, metricRace].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "Rust 并发方案时间线" });
    table.innerHTML = "<thead><tr><th>线程</th><th>动作</th><th>同步/所有权</th><th>结论</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = evaluate(mode.value, Number(workers.value), Number(increments.value));
      workersOut.textContent = workers.value;
      incrementsOut.textContent = increments.value;
      metricBuild.innerHTML = "<span>Send/Sync gate</span><strong>" + (data.accepted ? "可构造" : "拒绝") + "</strong>";
      metricResult.innerHTML = "<span>最终计数</span><strong>" + data.result + " / " + data.total + "</strong>";
      metricSync.innerHTML = "<span>同步协议</span><strong>" + data.sync + "</strong>";
      metricRace.innerHTML = "<span>data race</span><strong>" + (data.race ? "是" : "否") + "</strong>";
      table.querySelector("tbody").innerHTML = data.steps.map(function (row) {
        return "<tr><th>" + row.thread + "</th><td>" + row.action + "</td><td>" + data.sync + "</td><td>" + row.conclusion + "</td></tr>";
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.raw || !answers.result) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.raw === "reject" ? 1 : 0) + (answers.result === "twohundred" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在切换同步方案。";
      render();
    });
    mode.addEventListener("change", render);
    [workers, increments].forEach(function (input) { input.addEventListener("input", render); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var raw = evaluate("raw", 2, 100);
    var mutex = evaluate("mutex", 2, 100);
    var channel = evaluate("channel", 4, 50);
    check(!raw.accepted && raw.race, "raw shared mutable rejected");
    check(mutex.accepted && mutex.result === 200, "mutex preserves count");
    check(channel.result === 200 && channel.sync === "owner transfer", "channel transfers ownership");
    check(evaluate("atomic", 2, 100).sync === "atomic RMW", "atomic protocol");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, evaluate: evaluate };
});
