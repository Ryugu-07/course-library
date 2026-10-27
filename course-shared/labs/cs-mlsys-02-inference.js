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
  var OBSERVATION_TAIL = 1.4;
  var EPSILON = 1e-9;
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

  function summarize(requests, observationEnd, slo) {
    var arrived = requests.filter(function (request) { return request.at <= observationEnd + EPSILON; });
    var completed = arrived.filter(function (request) { return request.complete !== null && request.complete <= observationEnd + EPSILON; });
    var ledger = arrived.map(function (request) {
      var finished = request.complete !== null && request.complete <= observationEnd + EPSILON;
      var firstSeen = request.first !== null && request.first <= observationEnd + EPSILON;
      var elapsed = observationEnd - request.at;
      var e2e = finished ? request.complete - request.at : null;
      return {
        id: request.id, at: request.at, completed: finished,
        ttft: firstSeen ? request.first - request.at : null,
        tpot: finished && request.output > 1 ? (request.complete - request.first) / (request.output - 1) : null,
        e2e: e2e, elapsed: elapsed,
        good: finished && e2e <= slo + EPSILON,
        overdue: !finished && elapsed > slo + EPSILON
      };
    });
    var metrics = ledger.filter(function (item) { return item.completed; });
    var goodCount = metrics.filter(function (item) { return item.good; }).length;
    return {
      completed: completed, metrics: metrics, ledger: ledger,
      arrivedCount: arrived.length, goodCount: goodCount,
      backlog: arrived.length - completed.length,
      p50: percentile(metrics.map(function (item) { return item.e2e; }), 0.5),
      p95: percentile(metrics.map(function (item) { return item.e2e; }), 0.95),
      goodput: goodCount / observationEnd,
      qualifiedFraction: arrived.length ? goodCount / arrived.length : null
    };
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
    // Continue the trace after this cutoff, but never count later work in window metrics.
    var observationEnd = lastArrival + OBSERVATION_TAIL;
    var maxTicks = 220;
    function addEvent(tick, message) { events.push({ tick: tick, time: tick * TICK, message: message }); }
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
      if (now <= observationEnd + EPSILON) kvPeak = Math.max(kvPeak, kv);
      if (arrivals === requests.length && !queue.length && !active.length && !prefill) break;
    }
    var summary = summarize(requests, observationEnd, Number(slo));
    return {
      strategy: strategy,
      requests: requests,
      completed: summary.completed,
      metrics: summary.metrics,
      ledger: summary.ledger,
      events: events,
      kvPeak: kvPeak,
      observationEnd: observationEnd,
      arrivedCount: summary.arrivedCount,
      goodCount: summary.goodCount,
      backlog: summary.backlog,
      p50: summary.p50,
      p95: summary.p95,
      goodput: summary.goodput,
      qualifiedFraction: summary.qualifiedFraction,
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
      '[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cmi-blue)}[data-learning-lab="' + NAME + '"] .cmi-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cmi-metric{padding:7px;border-top:3px solid var(--cmi-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cmi-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cmi-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .cmi-table-wrap{overflow-x:auto;max-width:100%}[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;min-width:560px;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cmi-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:500px){[data-learning-lab="' + NAME + '"] .cmi-choices,[data-learning-lab="' + NAME + '"] .cmi-actions,[data-learning-lab="' + NAME + '"] .cmi-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .cmi-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}';
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
    var windowNote = element(doc, "p", { className: "cmi-note" });
    revealed.appendChild(windowNote);
    var metrics = element(doc, "div", { className: "cmi-metrics" });
    var metricP50 = element(doc, "div", { className: "cmi-metric" });
    var metricP95 = element(doc, "div", { className: "cmi-metric" });
    var metricGood = element(doc, "div", { className: "cmi-metric" });
    var metricQualified = element(doc, "div", { className: "cmi-metric" });
    var metricBacklog = element(doc, "div", { className: "cmi-metric" });
    var metricKV = element(doc, "div", { className: "cmi-metric" });
    [metricP50, metricP95, metricGood, metricQualified, metricBacklog, metricKV].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    revealed.appendChild(element(doc, "p", { className: "cmi-note", text: "† p50/p95 只描述窗内完成样本；有未完成请求时，不能当作全部到达请求的延迟分布。合格完成占比 = 窗内完成且 E2E 达标 / 窗内全部到达；未完成仍留在分母，这不是无限等待后的最终 SLO 通过率。" }));
    var table = element(doc, "table", { "aria-label": "请求级推理指标" });
    table.innerHTML = "<thead><tr><th>请求</th><th>TTFT / s</th><th>TPOT / s</th><th>E2E / s</th><th>SLO</th></tr></thead><tbody></tbody>";
    var eventTable = element(doc, "table", { "aria-label": "scheduler 事件 trace" });
    eventTable.innerHTML = "<thead><tr><th>tick</th><th>时间 / s</th><th>事件</th><th>统计范围</th></tr></thead><tbody></tbody>";
    revealed.appendChild(element(doc, "div", { className: "cmi-table-wrap" }, table));
    revealed.appendChild(element(doc, "p", { className: "cmi-note", text: "下方保留完整事件顺序；观察窗后的执行只用于追踪等待与完成，不计入上方统计。" }));
    revealed.appendChild(element(doc, "div", { className: "cmi-table-wrap" }, eventTable));
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = simulate(strategy.value, Number(rate.value), Number(batch.value), Number(slo.value));
      rateOut.textContent = rate.value;
      batchOut.textContent = batch.value;
      sloOut.textContent = slo.value;
      windowNote.textContent = "观察窗 [0, " + data.observationEnd.toFixed(2) + "] s：最后到达时刻 + 1.40 s；改变到达倍率会改变本次 trace 和终点，比较策略时保持倍率相同。窗内到达 " + data.arrivedCount + "，完成 " + data.completed.length + "，达标完成 " + data.goodCount + "。";
      metricP50.innerHTML = "<span>窗内完成 E2E p50†</span><strong>" + (data.p50 === null ? "—" : data.p50.toFixed(2) + " s") + "</strong>";
      metricP95.innerHTML = "<span>窗内完成 E2E p95†</span><strong>" + (data.p95 === null ? "—" : data.p95.toFixed(2) + " s") + "</strong>";
      metricGood.innerHTML = "<span>达标完成 / 观察时长</span><strong>" + data.goodput.toFixed(2) + " req/s</strong>";
      metricQualified.innerHTML = "<span>合格完成占比</span><strong>" + data.goodCount + " / " + data.arrivedCount + "</strong>";
      metricBacklog.innerHTML = "<span>窗末未完成</span><strong>" + data.backlog + "</strong>";
      metricKV.innerHTML = "<span>窗内 KV 峰值</span><strong>" + data.kvPeak + " token</strong>";
      table.querySelector("tbody").innerHTML = data.ledger.map(function (item) {
        var ttft = item.ttft === null ? "> " + item.elapsed.toFixed(2) + "（未见首 token）" : item.ttft.toFixed(2);
        var tpot = item.tpot === null ? "—" : item.tpot.toFixed(2);
        var e2e = item.completed ? item.e2e.toFixed(2) : "> " + item.elapsed.toFixed(2) + "（截尾）";
        var status = item.completed ? (item.good ? "达标完成" : "完成但超时") : (item.overdue ? "未完成；已超时" : "未完成；最终 SLO 尚未判定");
        return "<tr><th>" + item.id + "</th><td>" + ttft + "</td><td>" + tpot + "</td><td>" + e2e + "</td><td>" + status + "</td></tr>";
      }).join("");
      var windowMarked = false;
      var marker = "<tr><th>—</th><td>" + data.observationEnd.toFixed(2) + "</td><td>观察窗结束</td><td>统计截止</td></tr>";
      eventTable.querySelector("tbody").innerHTML = data.events.map(function (item) {
        var inside = item.time <= data.observationEnd + EPSILON;
        var prefix = !inside && !windowMarked ? marker : "";
        if (!inside) windowMarked = true;
        return prefix + "<tr><th>" + item.tick + "</th><td>" + item.time.toFixed(1) + "</td><td>" + item.message + "</td><td>" + (inside ? "窗内" : "窗后；不计统计") + "</td></tr>";
      }).join("") + (windowMarked ? "" : marker);
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
    var compressedImmediate = simulate("immediate", 2, 2, 4);
    var compressedStatic = simulate("static", 2, 2, 4);
    var compressedContinuous = simulate("continuous", 2, 2, 4);
    check(Math.abs(compressedImmediate.observationEnd - 2.45) < EPSILON && compressedImmediate.observationEnd === compressedContinuous.observationEnd, "strategy comparison fixes the observation window");
    check(compressedImmediate.completed.length === 4 && compressedImmediate.backlog === 4 && compressedStatic.completed.length === 5 && compressedStatic.backlog === 3, "late completions remain backlog at the cutoff");
    check(Math.abs(compressedImmediate.goodput - 4 / 2.45) < EPSILON && Math.abs(compressedContinuous.goodput - 8 / 2.45) < EPSILON, "goodput counts only qualified window completions");
    check(compressedImmediate.goodCount === 4 && compressedImmediate.arrivedCount === 8 && compressedImmediate.qualifiedFraction === 0.5, "unfinished arrivals stay in the qualified-completion denominator");
    check(Math.abs(compressedImmediate.p95 - 2.11) < EPSILON, "completed-sample percentile excludes window-late completions");
    check(compressedImmediate.ledger.length === 8 && compressedImmediate.ledger[7].ttft === null && compressedImmediate.ledger[7].e2e === null, "unfinished rows do not leak future metrics");
    check(compressedImmediate.requests[7].complete > compressedImmediate.observationEnd && compressedImmediate.events.some(function (event) { return event.message === "完成 R08"; }), "full post-window trace remains available");
    var boundary = summarize([
      { id: "on", at: 0, first: 0.1, complete: 0.3, output: 3 },
      { id: "after", at: 0, first: 0.1, complete: 0.3001, output: 3 },
      { id: "not-arrived", at: 0.4, first: null, complete: null, output: 1 }
    ], 0.3, 0.3);
    check(boundary.completed.length === 1 && boundary.goodCount === 1 && boundary.arrivedCount === 2 && boundary.backlog === 1, "cutoff is inclusive; later completion and later arrival are distinct");
    var empty = summarize([{ id: "waiting", at: 0, first: null, complete: null, output: 1 }], 0.3, 0.2);
    check(empty.p50 === null && empty.p95 === null && empty.goodput === 0 && empty.backlog === 1 && empty.ledger[0].overdue, "no completion yields no percentile and retains the overdue request");
    var singleToken = summarize([{ id: "one", at: 0, first: 0.2, complete: 0.2, output: 1 }], 0.3, 0.3);
    check(singleToken.metrics[0].tpot === null, "one-token output has no inter-token interval");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, simulate: simulate, TRACE: TRACE };
});
