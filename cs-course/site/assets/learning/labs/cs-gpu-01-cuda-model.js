(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-gpu-01-cuda-model", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-gpu-01-cuda-model self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-gpu-01-cuda-model self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-gpu-01-cuda-model";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function globalIndex(block, thread, blockDim) {
    return Math.floor(Number(block)) * Math.floor(Number(blockDim)) + Math.floor(Number(thread));
  }

  function transactionTrace(stride, start, elementBytes, segmentBytes) {
    var lines = Object.create(null);
    var rows = [];
    for (var lane = 0; lane < 32; lane += 1) {
      var element = Math.floor(Number(start)) + lane * Math.max(1, Math.floor(Number(stride)));
      var address = element * elementBytes;
      var segment = Math.floor(address / segmentBytes);
      lines[segment] = true;
      rows.push({ lane: lane, element: element, address: address, segment: segment });
    }
    return { rows: rows, transactions: Object.keys(lines).length };
  }

  function divergence(branch) {
    var paths = branch === "half" ? 2 : 1;
    return { paths: paths, efficiency: 1 / paths, serialized: paths > 1 };
  }

  function evaluate(options) {
    var transaction = transactionTrace(options.stride, options.start, 4, 128);
    var branch = divergence(options.branch);
    return {
      block: Number(options.block),
      thread: Number(options.thread),
      blockDim: Number(options.blockDim),
      index: globalIndex(options.block, options.thread, options.blockDim),
      stride: Number(options.stride),
      transactions: transaction.transactions,
      rows: transaction.rows,
      branch: branch
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
      '[data-learning-lab="' + NAME + '"]{--cgm-blue:#245a9b;--cgm-green:#2d7a4b;--cgm-orange:#a86213;--cgm-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cgm-primary{background:var(--cgm-blue);border-color:var(--cgm-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cgm-choices,[data-learning-lab="' + NAME + '"] .cgm-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cgm-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cgm-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cgm-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cgm-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:11px;border:1px solid var(--border);border-radius:7px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cgm-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cgm-blue)}[data-learning-lab="' + NAME + '"] .cgm-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + NAME + '"] .cgm-metric{padding:7px;border-top:3px solid var(--cgm-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cgm-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cgm-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .cgm-table-wrap{overflow-x:auto;max-width:100%}[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;min-width:450px;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border)}' +
      '@media(max-width:700px){[data-learning-lab="' + NAME + '"] .cgm-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + NAME + '"] .cgm-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .cgm-choices,[data-learning-lab="' + NAME + '"] .cgm-actions,[data-learning-lab="' + NAME + '"] .cgm-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "CUDA 坐标、合并访存与 warp 发散" }));
    shell.appendChild(element(doc, "p", { className: "cgm-note", text: "先预测一个线程的索引和 warp 事务，再改变 stride 与分支。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { index: null, memory: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cgm-choices", role: "group", "aria-label": prompt });
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
    question("index", "第 3 block、第 10 thread 的索引？", [["521", "521"], ["778", "778"]]);
    question("memory", "stride=32 的 warp 事务数相对连续访问？", [["many", "更多"], ["same", "相同"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cgm-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cgm-actions" }, [element(doc, "button", { type: "submit", className: "cgm-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cgm-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cgm-controls" });
    var blockDim = element(doc, "input", { type: "range", min: "64", max: "512", value: "256", step: "32" });
    var blockOut = element(doc, "output", { text: "256" });
    var thread = element(doc, "input", { type: "range", min: "0", max: "31", value: "9", step: "1" });
    var threadOut = element(doc, "output", { text: "9" });
    var stride = element(doc, "input", { type: "range", min: "1", max: "32", value: "1", step: "1" });
    var strideOut = element(doc, "output", { text: "1" });
    var branch = element(doc, "select", { "aria-label": "分支模式" });
    [["uniform", "warp 同一路径"], ["half", "16/16 发散"]].forEach(function (option) { branch.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    controls.appendChild(element(doc, "label", { className: "cgm-control" }, ["blockDim = ", blockOut, blockDim]));
    controls.appendChild(element(doc, "label", { className: "cgm-control" }, ["thread = ", threadOut, thread]));
    controls.appendChild(element(doc, "label", { className: "cgm-control" }, ["warp stride = ", strideOut, stride]));
    controls.appendChild(element(doc, "label", { className: "cgm-control" }, ["分支模式", branch]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cgm-metrics" });
    var metricIndex = element(doc, "div", { className: "cgm-metric" });
    var metricTx = element(doc, "div", { className: "cgm-metric" });
    var metricPath = element(doc, "div", { className: "cgm-metric" });
    var metricEff = element(doc, "div", { className: "cgm-metric" });
    [metricIndex, metricTx, metricPath, metricEff].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "warp 前 8 lanes 地址 trace" });
    table.innerHTML = "<thead><tr><th>lane</th><th>element</th><th>byte address</th><th>segment</th></tr></thead><tbody></tbody>";
    revealed.appendChild(element(doc, "div", { className: "cgm-table-wrap" }, table));
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = evaluate({ block: 2, thread: Number(thread.value), blockDim: Number(blockDim.value), stride: Number(stride.value), start: 0, branch: branch.value });
      blockOut.textContent = blockDim.value;
      threadOut.textContent = thread.value;
      strideOut.textContent = stride.value;
      metricIndex.innerHTML = "<span>全局索引</span><strong>" + data.index + "</strong>";
      metricTx.innerHTML = "<span>128B 事务</span><strong>" + data.transactions + "</strong>";
      metricPath.innerHTML = "<span>warp 路径</span><strong>" + data.branch.paths + "</strong>";
      metricEff.innerHTML = "<span>路径效率</span><strong>" + (data.branch.efficiency * 100).toFixed(0) + "%</strong>";
      table.querySelector("tbody").innerHTML = data.rows.slice(0, 8).map(function (row) {
        return "<tr><th>" + row.lane + "</th><td>" + row.element + "</td><td>" + row.address + "</td><td>" + row.segment + "</td></tr>";
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.index || !answers.memory) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.index === "521" ? 1 : 0) + (answers.memory === "many" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在改变 stride 或分支模式。";
      render();
    });
    [blockDim, thread, stride].forEach(function (input) { input.addEventListener("input", render); });
    branch.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(globalIndex(2, 9, 256) === 521, "CUDA global index");
    check(transactionTrace(1, 0, 4, 128).transactions === 1, "coalesced warp");
    check(transactionTrace(32, 0, 4, 128).transactions === 32, "strided warp");
    check(divergence("half").serialized && divergence("half").efficiency === 0.5, "warp divergence");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, globalIndex: globalIndex, transactionTrace: transactionTrace, divergence: divergence, evaluate: evaluate };
});
