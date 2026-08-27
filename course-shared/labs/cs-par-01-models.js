(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-par-01-models", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-par-01-models self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-par-01-models self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-par-01-models";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function amdahl(serial, cores) {
    var s = Math.max(0, Math.min(0.999999, Number(serial)));
    var n = Math.max(1, Math.floor(Number(cores)));
    return 1 / (s + (1 - s) / n);
  }

  function gustafson(serial, cores) {
    var s = Math.max(0, Math.min(0.999999, Number(serial)));
    var n = Math.max(1, Math.floor(Number(cores)));
    return n - s * (n - 1);
  }

  function coherenceTrace(cores, layout, rounds) {
    var n = Math.max(1, Math.floor(Number(cores)));
    var count = Math.max(1, Math.floor(Number(rounds)));
    var owners = Object.create(null);
    var events = [];
    for (var round = 0; round < count; round += 1) {
      for (var thread = 0; thread < n; thread += 1) {
        var line = layout === "padded" ? thread : Math.floor(thread / 2);
        var previous = owners[line];
        if (previous !== undefined && previous !== thread) {
          events.push({ round: round + 1, thread: thread, line: line, previous: previous });
        }
        owners[line] = thread;
      }
    }
    return { events: events, invalidations: events.length, writes: n * count };
  }

  function evaluate(options) {
    var cores = Number(options.cores);
    var serial = Number(options.serial);
    var coherence = coherenceTrace(cores, options.layout, 8);
    return {
      cores: cores,
      serial: serial,
      amdahl: amdahl(serial, cores),
      gustafson: gustafson(serial, cores),
      layout: options.layout,
      invalidations: coherence.invalidations,
      writes: coherence.writes
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
      '[data-learning-lab="' + NAME + '"]{--cpp-blue:#245a9b;--cpp-green:#2d7a4b;--cpp-orange:#a86213;--cpp-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cpp-primary{background:var(--cpp-blue);border-color:var(--cpp-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cpp-choices,[data-learning-lab="' + NAME + '"] .cpp-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cpp-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cpp-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cpp-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cpp-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:11px;border:1px solid var(--border);border-radius:7px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cpp-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cpp-blue)}[data-learning-lab="' + NAME + '"] .cpp-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + NAME + '"] .cpp-metric{padding:7px;border-top:3px solid var(--cpp-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cpp-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cpp-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border)}' +
      '@media(max-width:680px){[data-learning-lab="' + NAME + '"] .cpp-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + NAME + '"] .cpp-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:460px){[data-learning-lab="' + NAME + '"] .cpp-choices,[data-learning-lab="' + NAME + '"] .cpp-actions,[data-learning-lab="' + NAME + '"] .cpp-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "Amdahl × MESI：并行规模与缓存行所有权" }));
    shell.appendChild(element(doc, "p", { className: "cpp-note", text: "先预测固定问题的上限和 packed/padded 差异，再查看每一轮写入的失效事件。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { speed: null, layout: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cpp-choices", role: "group", "aria-label": prompt });
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
    question("speed", "s=.1、8 核的加速接近？", [["limit", "4.71×"], ["linear", "8×"]]);
    question("layout", "相邻槽位写入会？", [["ping", "产生乒乓"], ["none", "完全无通信"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cpp-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cpp-actions" }, [element(doc, "button", { type: "submit", className: "cpp-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cpp-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cpp-controls" });
    var cores = element(doc, "input", { type: "range", min: "1", max: "16", value: "8", step: "1" });
    var coresOut = element(doc, "output", { text: "8" });
    var serial = element(doc, "input", { type: "range", min: "0", max: "0.5", value: "0.1", step: "0.05" });
    var serialOut = element(doc, "output", { text: "0.1" });
    var layout = element(doc, "select", { "aria-label": "写布局" });
    [["packed", "packed：共享行"], ["padded", "padded：分离行"]].forEach(function (option) { layout.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    controls.appendChild(element(doc, "label", { className: "cpp-control" }, ["核心数 = ", coresOut, cores]));
    controls.appendChild(element(doc, "label", { className: "cpp-control" }, ["串行比例 = ", serialOut, serial]));
    controls.appendChild(element(doc, "label", { className: "cpp-control" }, ["写布局", layout]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cpp-metrics" });
    var metricA = element(doc, "div", { className: "cpp-metric" });
    var metricG = element(doc, "div", { className: "cpp-metric" });
    var metricI = element(doc, "div", { className: "cpp-metric" });
    var metricRisk = element(doc, "div", { className: "cpp-metric" });
    [metricA, metricG, metricI, metricRisk].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "MESI 写入时间线" });
    table.innerHTML = "<thead><tr><th>轮次</th><th>线程</th><th>缓存行</th><th>前所有者</th><th>动作</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = evaluate({ cores: Number(cores.value), serial: Number(serial.value), layout: layout.value });
      coresOut.textContent = cores.value;
      serialOut.textContent = serial.value;
      metricA.innerHTML = "<span>Amdahl</span><strong>" + data.amdahl.toFixed(2) + "×</strong>";
      metricG.innerHTML = "<span>Gustafson</span><strong>" + data.gustafson.toFixed(2) + "×</strong>";
      metricI.innerHTML = "<span>写入</span><strong>" + data.writes + " 次</strong>";
      metricRisk.innerHTML = "<span>失效事件</span><strong>" + data.invalidations + "</strong>";
      var trace = coherenceTrace(data.cores, data.layout, 8).events.slice(0, 40);
      table.querySelector("tbody").innerHTML = trace.length ? trace.map(function (item) {
        return "<tr><th>" + item.round + "</th><td>T" + item.thread + "</td><td>" + item.line + "</td><td>T" + item.previous + "</td><td>invalidate + ownership transfer</td></tr>";
      }).join("") : "<tr><td colspan=\"5\">没有跨线程写同一缓存行；仍需考虑工作均衡与内存占用。</td></tr>";
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.speed || !answers.layout) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.speed === "limit" ? 1 : 0) + (answers.layout === "ping" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在切换核心数与布局。";
      render();
    });
    [cores, serial].forEach(function (input) { input.addEventListener("input", render); });
    layout.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(Math.abs(amdahl(0.1, 8) - 4.7058823529) < 1e-9, "Amdahl 8-core bound");
    check(gustafson(0.1, 8) === 7.3, "Gustafson estimate");
    check(coherenceTrace(4, "packed", 8).invalidations > 0, "packed false sharing");
    check(coherenceTrace(4, "padded", 8).invalidations === 0, "padded isolation");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, amdahl: amdahl, gustafson: gustafson, coherenceTrace: coherenceTrace, evaluate: evaluate };
});
