(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-perf-02-cache-practice", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-perf-02-cache-practice self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-perf-02-cache-practice self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-perf-02-cache-practice";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function addresses(order, n, tile) {
    var result = [];
    var i;
    var j;
    if (order === "row") {
      for (i = 0; i < n; i += 1) for (j = 0; j < n; j += 1) result.push(i * n + j);
    } else if (order === "col") {
      for (j = 0; j < n; j += 1) for (i = 0; i < n; i += 1) result.push(i * n + j);
    } else {
      var block = Math.max(1, Math.floor(tile));
      for (var bi = 0; bi < n; bi += block) {
        for (var bj = 0; bj < n; bj += block) {
          for (i = bi; i < Math.min(n, bi + block); i += 1) {
            for (j = bj; j < Math.min(n, bj + block); j += 1) result.push(i * n + j);
          }
        }
      }
    }
    return result;
  }

  function simulate(order, n, lineElements, capacity, tile) {
    var lines = [];
    var trace = [];
    var hits = 0;
    var misses = 0;
    addresses(order, n, tile).forEach(function (address) {
      var line = Math.floor(address / lineElements);
      var index = lines.indexOf(line);
      var hit = index !== -1;
      if (hit) {
        hits += 1;
        lines.splice(index, 1);
      } else {
        misses += 1;
        if (lines.length >= capacity) lines.shift();
      }
      lines.push(line);
      if (trace.length < 56) trace.push({ address: address, line: line, hit: hit, resident: lines.slice() });
    });
    return { hits: hits, misses: misses, total: hits + misses, trace: trace, missRate: misses / (hits + misses) };
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
      '[data-learning-lab="' + NAME + '"]{--cpc-blue:#245a9b;--cpc-green:#2d7a4b;--cpc-orange:#a86213;--cpc-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cpc-primary{background:var(--cpc-blue);border-color:var(--cpc-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cpc-choices,[data-learning-lab="' + NAME + '"] .cpc-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cpc-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cpc-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cpc-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cpc-layout{display:grid;grid-template-columns:minmax(180px,.65fr) minmax(0,1.35fr);gap:14px;align-items:start;margin-top:14px}[data-learning-lab="' + NAME + '"] .cpc-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border);border-radius:7px}' +
      '[data-learning-lab="' + NAME + '"] .cpc-control{display:grid;gap:4px;font-size:13px;font-weight:700}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cpc-blue)}[data-learning-lab="' + NAME + '"] .cpc-stage{min-width:0;border:1px solid var(--border);padding:6px;overflow:auto}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums;min-width:420px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border)}' +
      '[data-learning-lab="' + NAME + '"] .cpc-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cpc-metric{padding:7px;border-top:3px solid var(--cpc-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cpc-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cpc-metric strong{display:block;overflow-wrap:anywhere}' +
      '@media(max-width:720px){[data-learning-lab="' + NAME + '"] .cpc-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .cpc-choices,[data-learning-lab="' + NAME + '"] .cpc-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .cpc-metrics{grid-template-columns:1fr}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "缓存访问 trace：行优先、列优先与 tiling" }));
    shell.appendChild(element(doc, "p", { className: "cpc-note", text: "固定 8×8 行存矩阵；先预测 miss，再逐次观察 LRU 工作集。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { order: null, tile: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cpc-choices", role: "group", "aria-label": prompt });
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
    question("order", "冷启动后，哪种顺序 miss 更少？", [["row", "行优先"], ["col", "列优先"]]);
    question("tile", "2×2 tile 会让工作集？", [["help", "受控并复用"], ["hurt", "必然更差"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cpc-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cpc-actions" }, [element(doc, "button", { type: "submit", className: "cpc-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cpc-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "cpc-layout" });
    var controls = element(doc, "div", { className: "cpc-controls" });
    var orderSelect = element(doc, "select", { "aria-label": "访问顺序" });
    [["row", "行优先"], ["col", "列优先"], ["blocked", "2×2 分块"]].forEach(function (option) { orderSelect.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var line = element(doc, "input", { type: "range", min: "2", max: "8", value: "4", step: "1" });
    var lineOut = element(doc, "output", { text: "4" });
    var capacity = element(doc, "input", { type: "range", min: "2", max: "16", value: "4", step: "1" });
    var capacityOut = element(doc, "output", { text: "4" });
    var tile = element(doc, "input", { type: "range", min: "1", max: "4", value: "2", step: "1" });
    var tileOut = element(doc, "output", { text: "2" });
    controls.appendChild(element(doc, "label", { className: "cpc-control" }, ["访问顺序", orderSelect]));
    controls.appendChild(element(doc, "label", { className: "cpc-control" }, ["每行元素 = ", lineOut, line]));
    controls.appendChild(element(doc, "label", { className: "cpc-control" }, ["缓存行数 = ", capacityOut, capacity]));
    controls.appendChild(element(doc, "label", { className: "cpc-control" }, ["tile 边长 = ", tileOut, tile]));
    var stage = element(doc, "div", { className: "cpc-stage" });
    layout.appendChild(controls);
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "cpc-metrics" });
    var missMetric = element(doc, "div", { className: "cpc-metric" });
    var hitMetric = element(doc, "div", { className: "cpc-metric" });
    var rateMetric = element(doc, "div", { className: "cpc-metric" });
    [missMetric, hitMetric, rateMetric].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var kind = orderSelect.value;
      var result = simulate(kind, 8, Number(line.value), Number(capacity.value), Number(tile.value));
      lineOut.textContent = line.value;
      capacityOut.textContent = capacity.value;
      tileOut.textContent = tile.value;
      missMetric.innerHTML = "<span>miss</span><strong>" + result.misses + " / " + result.total + "</strong>";
      hitMetric.innerHTML = "<span>hit</span><strong>" + result.hits + "</strong>";
      rateMetric.innerHTML = "<span>miss rate</span><strong>" + (result.missRate * 100).toFixed(1) + "%</strong>";
      var body = result.trace.map(function (item, index) {
        return "<tr><th>" + (index + 1) + "</th><td>" + item.address + "</td><td>" + item.line + "</td><td>" + (item.hit ? "hit" : "MISS") + "</td><td>" + item.resident.join(",") + "</td></tr>";
      }).join("");
      stage.replaceChildren(element(doc, "table", { "aria-label": "前 56 次缓存访问 trace" }, [
        element(doc, "caption", { text: "前 " + result.trace.length + " 次访问；行号从 0 计" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "#" }), element(doc, "th", { text: "元素地址" }), element(doc, "th", { text: "cache line" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "LRU 驻留" })])]),
        element(doc, "tbody", { html: body })
      ]));
      var tbody = stage.querySelector("tbody");
      if (tbody) tbody.innerHTML = body;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.order || !answers.tile) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.order === "row" ? 1 : 0) + (answers.tile === "help" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在切换顺序或缓存容量观察反例。";
      render();
    });
    orderSelect.addEventListener("change", render);
    [line, capacity, tile].forEach(function (input) { input.addEventListener("input", render); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var row = simulate("row", 8, 4, 4, 2);
    var col = simulate("col", 8, 4, 4, 2);
    var blocked = simulate("blocked", 8, 4, 4, 2);
    check(row.misses === 16, "row-major cold misses");
    check(col.misses === 64, "column-major capacity misses");
    check(blocked.misses <= col.misses, "tiling reduces misses");
    check(addresses("row", 2, 2).join(",") === "0,1,2,3", "row trace shape");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, addresses: addresses, simulate: simulate };
});
