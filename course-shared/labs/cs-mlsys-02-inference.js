(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-mlsys-02-inference", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-mlsys-02-inference self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-mlsys-02-inference self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-mlsys-02-inference";
  var TICK = 0.1;
  var TRACE = [
    { id: "R01", at: 0.00, prompt: 18, output: 12 },
    { id: "R02", at: 0.10, prompt: 6, output: 2 },
    { id: "R03", at: 0.22, prompt: 5, output: 3 },
    { id: "R04", at: 0.38, prompt: 7, output: 2 },
    { id: "R05", at: 0.95, prompt: 10, output: 5 },
    { id: "R06", at: 1.08, prompt: 5, output: 2 },
    { id: "R07", at: 1.22, prompt: 6, output: 4 },
    { id: "R08", at: 2.10, prompt: 16, output: 8 }
  ];

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function percentile(values, fraction) {
    if (!values.length) return null;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)];
  }

  function simulate(strategy, rate, batchSize, slo) {
    var factor = Math.max(0.25, Number(rate));
    var requests = TRACE.map(function (item) {
      return { id: item.id, at: item.at / factor, prompt: item.prompt, output: item.output, remaining: item.output, started: false, prefillDone: null, first: null, complete: null };
    });
    var queue = [];
    var active = [];
    var prefill = null;
    var arrivals = 0;
    var events = [];
    var kvPeak = 0;
    var lastArrival = requests[requests.length - 1].at;
    var maxTicks = 220;
    function addEvent(tick, message) { if (events.length < 80) events.push({ tick: tick, time: tick * TICK, message: message }); }
    for (var tick = 0; tick < maxTicks; tick += 1) {
      var now = tick * TICK;
      while (arrivals < requests.length && requests[arrivals].at <= now + 1e-9) {
        queue.push(requests[arrivals]);
        addEvent(tick, "到达 " + requests[arrivals].id);
        arrivals += 1;
      }
      var slots = strategy === "immediate" ? 1 : 3;
      var selected = active.slice(0, slots);
      selected.forEach(function (request) {
        if (!request.started) {
          request.started = true;
          request.first = now;
        }
        request.remaining -= 1;
        addEvent(tick, "decode " + request.id + " token");
        if (request.remaining <= 0) {
          request.complete = now;
          addEvent(tick, "完成 " + request.id);
        }
      });
      active = active.filter(function (request) { return request.complete === null; });
      if (prefill && prefill.doneTick <= tick) {
        prefill.requests.forEach(function (request) {
          request.prefillDone = tick;
          active.push(request);
        });
        addEvent(tick, "prefill 完成 " + prefill.requests.map(function (request) { return request.id; }).join("+"));
        prefill = null;
      }
      if (!prefill && queue.length) {
        var canStart = strategy === "continuous" ? active.length < 3 : active.length === 0;
        if (canStart) {
          var count = strategy === "immediate" ? 1 : Math.max(1, Math.min(Math.floor(Number(batchSize)), queue.length));
          if (strategy === "continuous") count = Math.min(count, 3 - active.length);
          var group = queue.splice(0, count);
          var tokens = group.reduce(function (sum, request) { return sum + request.prompt; }, 0);
          prefill = { requests: group, doneTick: tick + Math.max(1, Math.ceil(tokens / 24)) };
          addEvent(tick, "开始 prefill " + group.map(function (request) { return request.id; }).join("+"));
        }
      }
      var kv = active.reduce(function (sum, request) { return sum + request.prompt + (request.output - request.remaining); }, 0);
      if (prefill) kv += prefill.requests.reduce(function (sum, request) { return sum + request.prompt; }, 0);
      kvPeak = Math.max(kvPeak, kv);
      if (arrivals === requests.length && !queue.length && !active.length && !prefill) break;
    }
    var completed = requests.filter(function (request) { return request.complete !== null; });
    var metrics = completed.map(function (request) {
      var ttft = request.first - request.at;
      var tpot = request.output > 1 ? (request.complete - request.first) / (request.output - 1) : 0;
      var e2e = request.complete - request.at;
      return { id: request.id, at: request.at, ttft: ttft, tpot: tpot, e2e: e2e, good: e2e <= Number(slo) };
    });
    return {
      strategy: strategy,
      requests: requests,
      completed: completed,
      metrics: metrics,
      events: events,
      kvPeak: kvPeak,
      backlog: requests.length - completed.length,
      p50: percentile(metrics.map(function (item) { return item.e2e; }), 0.5),
      p95: percentile(metrics.map(function (item) { return item.e2e; }), 0.95),
      goodput: metrics.filter(function (item) { return item.good; }).length / Math.max(lastArrival + 1.4, TICK),
      slo: Number(slo)
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
      '[data-learning-lab="' + NAME + '"]{--cmi-blue:#245a9b;--cmi-green:#2d7a4b;--cmi-orange:#a86213;--cmi-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cmi-primary{background:var(--cmi-blue);border-color:var(--cmi-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cmi-choices,[data-learning-lab="' + NAME + '"] .cmi-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cmi-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cmi-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cmi-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cmi-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:11px;border:1px solid var(--border);border-radius:7px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cmi-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cmi-blue)}[data-learning-lab="' + NAME + '"] .cmi-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cmi-metric{padding:7px;border-top:3px solid var(--cmi-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cmi-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cmi-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .cmi-table-wrap{overflow-x:auto;max-width:100%}[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;min-width:560px;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cmi-controls{grid-template-columns:repeat(2,minmax(0,1fr)}[data-learning-lab="' + NAME + '"] .cmi-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:500px){[data-learning-lab="' + NAME + '"] .cmi-choices,[data-learning-lab="' + NAME + '"] .cmi-actions,[data-learning-lab="' + NAME + '"] .cmi-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .cmi-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "推理 scheduler：prefill、decode 与 KV-cache" }));
    shell.appendChild(element(doc, "p", { className: "cmi-note", text: "固定请求 ledger；先预测短请求，再切换调度策略和到达率。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { latency: null, batching: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cmi-choices", role: "group", "aria-label": prompt });
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
    question("latency", "长请求旁边的短请求，哪项优先看？", [["ttft", "TTFT / p95"], ["tokens", "平均 token/s"]]);
    question("batching", "continuous batching 的核心是？", [["repack", "每 tick 重组 active"], ["wait", "等整批完成"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cmi-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cmi-actions" }, [element(doc, "button", { type: "submit", className: "cmi-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cmi-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cmi-controls" });
    var strategy = element(doc, "select", { "aria-label": "调度策略" });
    [["immediate", "immediate / 1 slot"], ["static", "static batch"], ["continuous", "continuous batch"]].forEach(function (option) { strategy.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var rate = element(doc, "input", { type: "range", min: "0.5", max: "2", value: "1", step: "0.25" });
    var rateOut = element(doc, "output", { text: "1" });
    var batch = element(doc, "input", { type: "range", min: "1", max: "4", value: "2", step: "1" });
    var batchOut = element(doc, "output", { text: "2" });
    var slo = element(doc, "input", { type: "range", min: "0.5", max: "4", value: "1.5", step: "0.25" });
    var sloOut = element(doc, "output", { text: "1.5" });
    controls.appendChild(element(doc, "label", { className: "cmi-control" }, ["策略", strategy]));
    controls.appendChild(element(doc, "label", { className: "cmi-control" }, ["到达倍率 = ", rateOut, rate]));
    controls.appendChild(element(doc, "label", { className: "cmi-control" }, ["最大 batch = ", batchOut, batch]));
    controls.appendChild(element(doc, "label", { className: "cmi-control" }, ["E2E SLO = ", sloOut, " s", slo]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cmi-metrics" });
    var metricP50 = element(doc, "div", { className: "cmi-metric" });
    var metricP95 = element(doc, "div", { className: "cmi-metric" });
    var metricGood = element(doc, "div", { className: "cmi-metric" });
    var metricBacklog = element(doc, "div", { className: "cmi-metric" });
    var metricKV = element(doc, "div", { className: "cmi-metric" });
    [metricP50, metricP95, metricGood, metricBacklog, metricKV].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "请求级推理指标" });
    table.innerHTML = "<thead><tr><th>请求</th><th>TTFT</th><th>TPOT</th><th>E2E</th><th>SLO</th></tr></thead><tbody></tbody>";
    var eventTable = element(doc, "table", { "aria-label": "scheduler 事件 trace" });
    eventTable.innerHTML = "<thead><tr><th>tick</th><th>时间</th><th>事件</th></tr></thead><tbody></tbody>";
    revealed.appendChild(element(doc, "div", { className: "cmi-table-wrap" }, table));
    revealed.appendChild(element(doc, "div", { className: "cmi-table-wrap" }, eventTable));
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = simulate(strategy.value, Number(rate.value), Number(batch.value), Number(slo.value));
      rateOut.textContent = rate.value;
      batchOut.textContent = batch.value;
      sloOut.textContent = slo.value;
      metricP50.innerHTML = "<span>完成 E2E p50</span><strong>" + (data.p50 === null ? "—" : data.p50.toFixed(2) + " s") + "</strong>";
      metricP95.innerHTML = "<span>完成 E2E p95†</span><strong>" + (data.p95 === null ? "—" : data.p95.toFixed(2) + " s") + "</strong>";
      metricGood.innerHTML = "<span>goodput</span><strong>" + data.goodput.toFixed(2) + " req/s</strong>";
      metricBacklog.innerHTML = "<span>未完成</span><strong>" + data.backlog + "</strong>";
      metricKV.innerHTML = "<span>KV 峰值</span><strong>" + data.kvPeak + " token</strong>";
      table.querySelector("tbody").innerHTML = data.metrics.map(function (item) {
        return "<tr><th>" + item.id + "</th><td>" + item.ttft.toFixed(2) + "</td><td>" + item.tpot.toFixed(2) + "</td><td>" + item.e2e.toFixed(2) + "</td><td>" + (item.good ? "通过" : "超时") + "</td></tr>";
      }).join("") || "<tr><td colspan=\"5\">观察窗内没有完成请求。</td></tr>";
      eventTable.querySelector("tbody").innerHTML = data.events.map(function (item) {
        return "<tr><th>" + item.tick + "</th><td>" + item.time.toFixed(1) + "</td><td>" + item.message + "</td></tr>";
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.latency || !answers.batching) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.latency === "ttft" ? 1 : 0) + (answers.batching === "repack" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在观察请求级账本和事件顺序。";
      render();
    });
    strategy.addEventListener("change", render);
    [rate, batch, slo].forEach(function (input) { input.addEventListener("input", render); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var immediate = simulate("immediate", 1, 2, 1.5);
    var continuous = simulate("continuous", 1, 2, 1.5);
    check(immediate.requests.length === TRACE.length, "fixed request ledger");
    check(immediate.completed.length > 0 && continuous.completed.length > 0, "strategies complete requests");
    check(immediate.kvPeak >= 18 && continuous.kvPeak >= 18, "KV accounting has prompt tokens");
    check(immediate.events.length > 0 && immediate.events[0].message.indexOf("到达") === 0, "event trace starts with arrival");
    check(continuous.metrics.every(function (item) { return item.e2e >= item.ttft; }), "E2E includes TTFT");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, simulate: simulate, TRACE: TRACE };
});
