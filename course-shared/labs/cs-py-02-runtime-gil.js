(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-py-02-runtime-gil", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-py-02-runtime-gil self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-py-02-runtime-gil self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-py-02-runtime-gil";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function estimate(kind, tasks, cpu, wait, workers) {
    var n = Math.max(1, Math.floor(Number(tasks)));
    var c = Math.max(0, Number(cpu));
    var w = Math.max(0, Number(wait));
    var p = Math.max(1, Math.floor(Number(workers)));
    var overhead = p * 0.5;
    var wall;
    var concurrent;
    if (kind === "cpu-threads") {
      wall = n * c + n * w + overhead;
      concurrent = 1;
    } else if (kind === "processes") {
      wall = Math.ceil(n / p) * c + w + p * 2;
      concurrent = Math.min(n, p);
    } else if (kind === "async-io") {
      wall = Math.ceil(n / p) * w + n * c;
      concurrent = Math.min(n, p);
    } else {
      wall = n * c + n * w;
      concurrent = 1;
    }
    var serial = n * (c + w);
    return { kind: kind, tasks: n, cpu: c, wait: w, workers: p, wall: wall, serial: serial, speedup: serial / Math.max(wall, 0.000001), concurrent: concurrent };
  }

  function timeline(kind, tasks, workers) {
    var rows = [];
    var n = Math.max(1, Math.floor(Number(tasks)));
    var p = Math.max(1, Math.floor(Number(workers)));
    for (var i = 0; i < n; i += 1) {
      var lane = kind === "cpu-threads" ? i % 2 : i % p;
      rows.push({ task: "T" + (i + 1), lane: lane, phase: kind === "async-io" ? "await I/O" : "CPU / interpreter" });
    }
    return rows;
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
      '[data-learning-lab="' + NAME + '"]{--cpg-blue:#245a9b;--cpg-green:#2d7a4b;--cpg-orange:#a86213;--cpg-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cpg-primary{background:var(--cpg-blue);border-color:var(--cpg-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cpg-choices,[data-learning-lab="' + NAME + '"] .cpg-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cpg-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cpg-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cpg-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cpg-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:11px;border:1px solid var(--border);border-radius:7px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cpg-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cpg-blue)}[data-learning-lab="' + NAME + '"] .cpg-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + NAME + '"] .cpg-metric{padding:7px;border-top:3px solid var(--cpg-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cpg-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cpg-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border)}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cpg-controls{grid-template-columns:repeat(2,minmax(0,1fr)}[data-learning-lab="' + NAME + '"] .cpg-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:500px){[data-learning-lab="' + NAME + '"] .cpg-choices,[data-learning-lab="' + NAME + '"] .cpg-actions,[data-learning-lab="' + NAME + '"] .cpg-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "CPython 并发账本：GIL、I/O 与进程" }));
    shell.appendChild(element(doc, "p", { className: "cpg-note", text: "先预测哪部分能重叠，再调工作类型、任务数和 worker 数。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { cpu: null, io: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cpg-choices", role: "group", "aria-label": prompt });
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
    question("cpu", "CPU 密集 Python 两线程会接近？", [["one", "1×附近"], ["two", "2×"]]);
    question("io", "I/O 等待可以被线程/async？", [["overlap", "重叠"], ["block", "完全串行"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cpg-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cpg-actions" }, [element(doc, "button", { type: "submit", className: "cpg-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cpg-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cpg-controls" });
    var kind = element(doc, "select", { "aria-label": "并发方式" });
    [["serial", "单线程"], ["cpu-threads", "Python threads / CPU"], ["processes", "multiprocessing"], ["async-io", "async I/O"]].forEach(function (option) { kind.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var tasks = element(doc, "input", { type: "range", min: "2", max: "12", value: "4", step: "1" });
    var tasksOut = element(doc, "output", { text: "4" });
    var cpu = element(doc, "input", { type: "range", min: "0", max: "100", value: "100", step: "5" });
    var cpuOut = element(doc, "output", { text: "100" });
    var wait = element(doc, "input", { type: "range", min: "0", max: "100", value: "0", step: "5" });
    var waitOut = element(doc, "output", { text: "0" });
    var workers = element(doc, "input", { type: "range", min: "1", max: "8", value: "2", step: "1" });
    var workersOut = element(doc, "output", { text: "2" });
    controls.appendChild(element(doc, "label", { className: "cpg-control" }, ["任务数 = ", tasksOut, tasks]));
    controls.appendChild(element(doc, "label", { className: "cpg-control" }, ["CPU 单位 = ", cpuOut, cpu]));
    controls.appendChild(element(doc, "label", { className: "cpg-control" }, ["等待单位 = ", waitOut, wait]));
    controls.appendChild(element(doc, "label", { className: "cpg-control" }, ["workers = ", workersOut, workers]));
    controls.appendChild(element(doc, "label", { className: "cpg-control" }, ["方式", kind]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cpg-metrics" });
    var metricWall = element(doc, "div", { className: "cpg-metric" });
    var metricSpeed = element(doc, "div", { className: "cpg-metric" });
    var metricConc = element(doc, "div", { className: "cpg-metric" });
    var metricGIL = element(doc, "div", { className: "cpg-metric" });
    [metricWall, metricSpeed, metricConc, metricGIL].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "运行时并发时间线" });
    table.innerHTML = "<thead><tr><th>任务</th><th>lane</th><th>可见阶段</th><th>解释</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var selected = kind.value;
      var data = estimate(selected, Number(tasks.value), Number(cpu.value), Number(wait.value), Number(workers.value));
      tasksOut.textContent = tasks.value;
      cpuOut.textContent = cpu.value;
      waitOut.textContent = wait.value;
      workersOut.textContent = workers.value;
      metricWall.innerHTML = "<span>估计墙钟</span><strong>" + data.wall.toFixed(1) + "</strong>";
      metricSpeed.innerHTML = "<span>相对串行</span><strong>" + data.speedup.toFixed(2) + "×</strong>";
      metricConc.innerHTML = "<span>并发 lane</span><strong>" + data.concurrent + "</strong>";
      metricGIL.innerHTML = "<span>GIL 诊断</span><strong>" + (selected === "cpu-threads" ? "Python bytecode 受限" : selected === "processes" ? "独立解释器" : selected === "async-io" ? "等待可交错" : "基线") + "</strong>";
      table.querySelector("tbody").innerHTML = timeline(selected, Number(tasks.value), Number(workers.value)).map(function (row) {
        return "<tr><th>" + row.task + "</th><td>" + row.lane + "</td><td>" + row.phase + "</td><td>" + (selected === "cpu-threads" ? "共享 GIL 时间片" : selected === "processes" ? "进程隔离地址空间" : selected === "async-io" ? "await 时让出 event loop" : "单一执行流") + "</td></tr>";
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.cpu || !answers.io) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.cpu === "one" ? 1 : 0) + (answers.io === "overlap" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在改变等待比例和执行模型。";
      render();
    });
    [tasks, cpu, wait, workers].forEach(function (input) { input.addEventListener("input", render); });
    kind.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var threaded = estimate("cpu-threads", 2, 100, 0, 2);
    var processes = estimate("processes", 2, 100, 0, 2);
    var async = estimate("async-io", 2, 5, 95, 2);
    var serial = estimate("serial", 2, 100, 0, 2);
    check(threaded.speedup < 1.1, "GIL limits CPU thread speedup");
    check(processes.wall < serial.wall, "processes parallelize CPU work");
    check(async.wall < serial.wall, "async overlaps I/O wait");
    check(timeline("cpu-threads", 4, 2).length === 4, "timeline shape");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, estimate: estimate, timeline: timeline };
});
