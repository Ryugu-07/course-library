(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-pl-02-semantics-gc", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-pl-02-semantics-gc self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-pl-02-semantics-gc self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-pl-02-semantics-gc";
  var HEAP = {
    A: ["B"],
    B: ["A"],
    C: ["D"],
    D: []
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function reachable(roots, heap) {
    var seen = Object.create(null);
    var work = roots.slice();
    while (work.length) {
      var node = work.pop();
      if (seen[node] || !heap[node]) continue;
      seen[node] = true;
      heap[node].forEach(function (child) { if (!seen[child]) work.push(child); });
    }
    return Object.keys(seen);
  }

  function referenceCounts(roots, heap) {
    var counts = Object.create(null);
    Object.keys(heap).forEach(function (node) { counts[node] = 0; });
    roots.forEach(function (root) { if (counts[root] !== undefined) counts[root] += 1; });
    Object.keys(heap).forEach(function (node) {
      heap[node].forEach(function (child) { if (counts[child] !== undefined) counts[child] += 1; });
    });
    return counts;
  }

  function evaluate(roots, strategy) {
    var live = reachable(roots, HEAP);
    var liveMap = Object.create(null);
    live.forEach(function (node) { liveMap[node] = true; });
    var counts = referenceCounts(roots, HEAP);
    var garbage;
    if (strategy === "refcount") {
      garbage = Object.keys(counts).filter(function (node) { return counts[node] === 0; });
    } else {
      garbage = Object.keys(HEAP).filter(function (node) { return !liveMap[node]; });
    }
    return { roots: roots.slice(), live: live, garbage: garbage, counts: counts, strategy: strategy, cycleLeak: strategy === "refcount" && garbage.indexOf("A") === -1 && garbage.indexOf("B") === -1 };
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
      '[data-learning-lab="' + NAME + '"]{--cgc-blue:#245a9b;--cgc-green:#2d7a4b;--cgc-orange:#a86213;--cgc-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cgc-primary{background:var(--cgc-blue);border-color:var(--cgc-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cgc-choices,[data-learning-lab="' + NAME + '"] .cgc-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cgc-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cgc-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cgc-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cgc-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cgc-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] .cgc-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cgc-metric{padding:7px;border-top:3px solid var(--cgc-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cgc-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cgc-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}' +
      '@media(max-width:500px){[data-learning-lab="' + NAME + '"] .cgc-choices,[data-learning-lab="' + NAME + '"] .cgc-actions,[data-learning-lab="' + NAME + '"] .cgc-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .cgc-metrics{grid-template-columns:1fr}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "可达性、循环引用与 GC 策略" }));
    shell.appendChild(element(doc, "p", { className: "cgc-note", text: "固定堆图 A↔B、C→D；先预测根失效后的活集，再切换回收器。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { tracer: null, cycle: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cgc-choices", role: "group", "aria-label": prompt });
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
    question("tracer", "根 main 失效后，A↔B 会被追踪式 GC？", [["collect", "回收"], ["keep", "保留"]]);
    question("cycle", "纯引用计数遇到 A↔B 会？", [["leak", "泄漏"], ["collect", "回收"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cgc-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cgc-actions" }, [element(doc, "button", { type: "submit", className: "cgc-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cgc-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cgc-controls" });
    var rootSelect = element(doc, "select", { "aria-label": "根集合" });
    [["C", "root=C（C→D）"], ["A", "root=A（A↔B）"], ["none", "root=∅"]].forEach(function (option) { rootSelect.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var strategySelect = element(doc, "select", { "aria-label": "回收策略" });
    [["trace", "mark-sweep / tracing"], ["refcount", "reference counting"]].forEach(function (option) { strategySelect.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    controls.appendChild(element(doc, "label", { className: "cgc-control" }, ["根集合", rootSelect]));
    controls.appendChild(element(doc, "label", { className: "cgc-control" }, ["策略", strategySelect]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cgc-metrics" });
    var metricLive = element(doc, "div", { className: "cgc-metric" });
    var metricGarbage = element(doc, "div", { className: "cgc-metric" });
    var metricCycle = element(doc, "div", { className: "cgc-metric" });
    [metricLive, metricGarbage, metricCycle].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "堆对象可达性与引用计数" });
    table.innerHTML = "<thead><tr><th>对象</th><th>children</th><th>refcount</th><th>reachable</th><th>动作</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var roots = rootSelect.value === "none" ? [] : [rootSelect.value];
      var data = evaluate(roots, strategySelect.value);
      var liveMap = Object.create(null);
      data.live.forEach(function (node) { liveMap[node] = true; });
      metricLive.innerHTML = "<span>可达活对象</span><strong>" + (data.live.join(", ") || "无") + "</strong>";
      metricGarbage.innerHTML = "<span>本策略回收</span><strong>" + (data.garbage.join(", ") || "无") + "</strong>";
      metricCycle.innerHTML = "<span>环泄漏</span><strong>" + (data.cycleLeak ? "是" : "否") + "</strong>";
      table.querySelector("tbody").innerHTML = Object.keys(HEAP).map(function (node) {
        return "<tr><th>" + node + "</th><td>" + (HEAP[node].join(" → ") || "∅") + "</td><td>" + data.counts[node] + "</td><td>" + (liveMap[node] ? "是" : "否") + "</td><td>" + (data.garbage.indexOf(node) !== -1 ? "回收" : "保留") + "</td></tr>";
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.tracer || !answers.cycle) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.tracer === "collect" ? 1 : 0) + (answers.cycle === "leak" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在改变根或回收策略。";
      render();
    });
    rootSelect.addEventListener("change", render);
    strategySelect.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var trace = evaluate(["C"], "trace");
    var ref = evaluate([], "refcount");
    check(trace.live.indexOf("C") !== -1 && trace.live.indexOf("D") !== -1, "root reachability");
    check(trace.garbage.indexOf("A") !== -1 && trace.garbage.indexOf("B") !== -1, "tracing collects unreachable cycle");
    check(ref.cycleLeak, "reference count cycle leak");
    check(ref.counts.A === 1 && ref.counts.B === 1, "cycle incoming counts");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, reachable: reachable, referenceCounts: referenceCounts, evaluate: evaluate, HEAP: HEAP };
});
