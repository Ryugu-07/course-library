(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-gpu-02-optimization", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-gpu-02-optimization self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-gpu-02-optimization self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-gpu-02-optimization";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function idealGlobalReads(m, n, k, tile) {
    var t = Math.max(1, Number(tile));
    return 2 * Number(m) * Number(n) * Number(k) / t;
  }

  function stableSoftmax(values) {
    var max = Math.max.apply(null, values);
    var weights = values.map(function (value) { return Math.exp(value - max); });
    var sum = weights.reduce(function (total, value) { return total + value; }, 0);
    return weights.map(function (value) { return value / sum; });
  }

  function onlineSoftmax(values, blockSize) {
    var m = -Infinity;
    var l = 0;
    var size = Math.max(1, Math.floor(Number(blockSize)));
    for (var start = 0; start < values.length; start += size) {
      var block = values.slice(start, start + size);
      var blockMax = Math.max.apply(null, block);
      var nextMax = Math.max(m, blockMax);
      var oldScale = m === -Infinity ? 0 : Math.exp(m - nextMax);
      var blockSum = block.reduce(function (total, value) { return total + Math.exp(value - nextMax); }, 0);
      l = oldScale * l + blockSum;
      m = nextMax;
    }
    return { max: m, normalizer: l, probabilities: values.map(function (value) { return Math.exp(value - m) / l; }) };
  }

  function occupancy(registers, sharedBytes, blockThreads) {
    var r = Math.max(1, Number(registers));
    var shared = Math.max(1, Number(sharedBytes));
    var threads = Math.max(32, Math.floor(Number(blockThreads)));
    var byRegisters = Math.floor(65536 / (r * threads));
    var byShared = Math.floor(49152 / shared);
    var byThreads = Math.floor(2048 / threads);
    var blocks = Math.max(0, Math.min(16, byRegisters, byShared, byThreads));
    return { blocks: blocks, warps: blocks * Math.ceil(threads / 32), limit: 64, byRegisters: byRegisters, byShared: byShared, byThreads: byThreads };
  }

  function evaluate(options) {
    var tile = Number(options.tile);
    var length = Number(options.length);
    var reads = idealGlobalReads(length, length, length, tile);
    var softmax = onlineSoftmax([2, 1, 0, -1, 3, 2], Math.max(1, Math.floor(length / 4)));
    var occ = occupancy(Number(options.registers), tile * tile * 4, 256);
    return { tile: tile, length: length, naiveReads: 2 * length * length * length, tiledReads: reads, reuse: tile, softmax: softmax, occupancy: occ };
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
      '[data-learning-lab="' + NAME + '"]{--cgo-blue:#245a9b;--cgo-green:#2d7a4b;--cgo-orange:#a86213;--cgo-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cgo-primary{background:var(--cgo-blue);border-color:var(--cgo-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cgo-choices,[data-learning-lab="' + NAME + '"] .cgo-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cgo-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cgo-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cgo-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cgo-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:11px;border:1px solid var(--border);border-radius:7px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cgo-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cgo-blue)}[data-learning-lab="' + NAME + '"] .cgo-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + NAME + '"] .cgo-metric{padding:7px;border-top:3px solid var(--cgo-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cgo-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cgo-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border)}' +
      '@media(max-width:700px){[data-learning-lab="' + NAME + '"] .cgo-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + NAME + '"] .cgo-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .cgo-choices,[data-learning-lab="' + NAME + '"] .cgo-actions,[data-learning-lab="' + NAME + '"] .cgo-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "GPU 优化阶梯：tiling、occupancy 与在线 softmax" }));
    shell.appendChild(element(doc, "p", { className: "cgo-note", text: "先预测 tile 复用和数值稳定性，再观察资源约束。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { reuse: null, stable: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cgo-choices", role: "group", "aria-label": prompt });
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
    question("reuse", "16×16 tile 的元素复用因子约为？", [["sixteen", "16"], ["one", "1"]]);
    question("stable", "新最大值出现时，online softmax 要？", [["rescale", "重缩放旧和"], ["ignore", "忽略"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cgo-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cgo-actions" }, [element(doc, "button", { type: "submit", className: "cgo-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cgo-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cgo-controls" });
    var tile = element(doc, "input", { type: "range", min: "4", max: "32", value: "16", step: "4" });
    var tileOut = element(doc, "output", { text: "16" });
    var length = element(doc, "input", { type: "range", min: "8", max: "128", value: "64", step: "8" });
    var lengthOut = element(doc, "output", { text: "64" });
    var registers = element(doc, "input", { type: "range", min: "16", max: "128", value: "32", step: "8" });
    var registersOut = element(doc, "output", { text: "32" });
    controls.appendChild(element(doc, "label", { className: "cgo-control" }, ["tile = ", tileOut, tile]));
    controls.appendChild(element(doc, "label", { className: "cgo-control" }, ["序列/矩阵边长 = ", lengthOut, length]));
    controls.appendChild(element(doc, "label", { className: "cgo-control" }, ["寄存器/线程 = ", registersOut, registers]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cgo-metrics" });
    var metricNaive = element(doc, "div", { className: "cgo-metric" });
    var metricTiled = element(doc, "div", { className: "cgo-metric" });
    var metricOcc = element(doc, "div", { className: "cgo-metric" });
    var metricSum = element(doc, "div", { className: "cgo-metric" });
    [metricNaive, metricTiled, metricOcc, metricSum].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "online softmax 状态 trace" });
    table.innerHTML = "<thead><tr><th>输入块</th><th>块最大值</th><th>全局 m</th><th>全局 l</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = evaluate({ tile: Number(tile.value), length: Number(length.value), registers: Number(registers.value) });
      tileOut.textContent = tile.value;
      lengthOut.textContent = length.value;
      registersOut.textContent = registers.value;
      metricNaive.innerHTML = "<span>朴素读取</span><strong>" + Math.round(data.naiveReads).toLocaleString() + "</strong>";
      metricTiled.innerHTML = "<span>tile 读取</span><strong>" + Math.round(data.tiledReads).toLocaleString() + "</strong>";
      metricOcc.innerHTML = "<span>驻留 block</span><strong>" + data.occupancy.blocks + "；" + data.occupancy.warps + " warps</strong>";
      metricSum.innerHTML = "<span>online 概率和</span><strong>" + data.softmax.probabilities.reduce(function (sum, value) { return sum + value; }, 0).toFixed(6) + "</strong>";
      var values = [2, 1, 0, -1, 3, 2];
      var size = Math.max(1, Math.floor(data.length / 4));
      var rows = [];
      var m = -Infinity;
      var l = 0;
      for (var start = 0; start < values.length; start += size) {
        var block = values.slice(start, start + size);
        var blockMax = Math.max.apply(null, block);
        var next = Math.max(m, blockMax);
        l = (m === -Infinity ? 0 : Math.exp(m - next) * l) + block.reduce(function (sum, value) { return sum + Math.exp(value - next); }, 0);
        m = next;
        rows.push("<tr><th>[" + block.join(",") + "]</th><td>" + blockMax + "</td><td>" + m.toFixed(3) + "</td><td>" + l.toFixed(5) + "</td></tr>");
      }
      table.querySelector("tbody").innerHTML = rows.join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.reuse || !answers.stable) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.reuse === "sixteen" ? 1 : 0) + (answers.stable === "rescale" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在调 tile 或寄存器预算。";
      render();
    });
    [tile, length, registers].forEach(function (input) { input.addEventListener("input", render); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var values = [2, 1, 0];
    var direct = stableSoftmax(values);
    var online = onlineSoftmax(values, 2);
    check(Math.abs(direct.reduce(function (sum, value) { return sum + value; }, 0) - 1) < 1e-12, "stable softmax normalization");
    check(online.probabilities.every(function (value, index) { return Math.abs(value - direct[index]) < 1e-12; }), "online softmax equivalence");
    check(idealGlobalReads(64, 64, 64, 16) === 32768, "tiled read estimate");
    check(occupancy(32, 16 * 16 * 4, 256).blocks > 0, "occupancy has resident block");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, idealGlobalReads: idealGlobalReads, stableSoftmax: stableSoftmax, onlineSoftmax: onlineSoftmax, occupancy: occupancy, evaluate: evaluate };
});
