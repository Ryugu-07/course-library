(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-os-01-process-sched", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-os-01-process-sched self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-os-01-process-sched self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var LAB_ID = "cs-os-01-process-sched";
  var STYLE_ID = LAB_ID + "-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var WORKLOADS = {
    mixed: {
      label: "同时到达：短任务混在长任务后",
      jobs: [
        { id: "A", arrival: 0, burst: 8 },
        { id: "B", arrival: 0, burst: 2 },
        { id: "C", arrival: 0, burst: 1 },
        { id: "D", arrival: 0, burst: 2 }
      ]
    },
    staggered: {
      label: "交错到达：等待中的任务会加入队列",
      jobs: [
        { id: "A", arrival: 0, burst: 6 },
        { id: "B", arrival: 1, burst: 2 },
        { id: "C", arrival: 2, burst: 1 },
        { id: "D", arrival: 3, burst: 2 }
      ]
    }
  };
  var POLICIES = {
    fifo: "FIFO",
    sjf: "SJF（非抢占）",
    rr: "RR（轮转）"
  };
  var COLORS = { A: "#315f9d", B: "#39734d", C: "#9b6a12", D: "#b64335" };
  var CSS = [
    ".cs-os-sched{--cs-blue:#315f9d;--cs-green:#39734d;--cs-gold:#9b6a12;--cs-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}",
    ".cs-os-sched *{box-sizing:border-box}.cs-os-sched [hidden]{display:none!important}.cs-os-sched h3{margin:0;font-size:1.16rem}.cs-os-sched p{margin:8px 0}",
    ".cs-os-sched fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}.cs-os-sched legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750;line-height:1.5}",
    ".cs-os-sched .cs-choices,.cs-os-sched .cs-actions{display:flex;flex-wrap:wrap;gap:8px}.cs-os-sched button,.cs-os-sched select,.cs-os-sched input{font:inherit;letter-spacing:0}.cs-os-sched button,.cs-os-sched select{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}.cs-os-sched button{flex:1 1 150px}.cs-os-sched button:hover,.cs-os-sched select:hover{border-color:var(--accent,#315f9d)}.cs-os-sched button[aria-pressed=true],.cs-os-sched .cs-primary{background:var(--accent,#315f9d);border-color:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}.cs-os-sched button:focus-visible,.cs-os-sched select:focus-visible,.cs-os-sched input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".cs-os-sched .cs-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}.cs-os-sched .cs-good{color:var(--cs-green)}.cs-os-sched .cs-warn{color:var(--cs-red)}",
    ".cs-os-sched .cs-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(180px,.75fr);gap:10px;margin:15px 0}.cs-os-sched .cs-control{display:grid;gap:5px;min-width:0}.cs-os-sched .cs-control label{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}.cs-os-sched .cs-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}.cs-os-sched input[type=range]{width:100%;min-height:44px;accent-color:var(--accent,#315f9d)}",
    ".cs-os-sched .cs-stage{min-width:0;margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);overflow:hidden}.cs-os-sched svg{display:block;width:100%;height:auto;max-width:100%}.cs-os-sched svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.cs-os-sched .cs-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.cs-os-sched .cs-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#cbd5e1);background:var(--block-bg,transparent)}.cs-os-sched .cs-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}.cs-os-sched .cs-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.cs-os-sched .cs-table{max-width:100%;overflow-x:auto}.cs-os-sched table{width:100%;min-width:480px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.cs-os-sched th,.cs-os-sched td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;white-space:nowrap}.cs-os-sched th{color:var(--fg-soft,currentColor);font-size:11px}",
    "@media(max-width:760px){.cs-os-sched .cs-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.cs-os-sched .cs-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.cs-os-sched .cs-controls{grid-template-columns:1fr}.cs-os-sched .cs-metrics{grid-template-columns:1fr}.cs-os-sched button{flex-basis:100%}}@media(prefers-reduced-motion:reduce){.cs-os-sched *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function assert(condition, message) {
    if (!condition) throw new Error(LAB_ID + " self-test failed: " + message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-9) * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function normalize(options) {
    options = options || {};
    var workload = WORKLOADS[options.workload] ? options.workload : "mixed";
    var policy = POLICIES[options.policy] ? options.policy : "rr";
    var quantum = Number(options.quantum);
    if (!Number.isFinite(quantum)) quantum = 2;
    return { workload: workload, policy: policy, quantum: clamp(Math.round(quantum), 1, 5) };
  }

  function chooseReady(ready, policy) {
    if (policy === "sjf") {
      var best = 0;
      for (var i = 1; i < ready.length; i += 1) {
        if (ready[i].remaining < ready[best].remaining ||
            (ready[i].remaining === ready[best].remaining && ready[i].order < ready[best].order)) best = i;
      }
      return ready.splice(best, 1)[0];
    }
    return ready.shift();
  }

  function simulate(options) {
    var config = normalize(options);
    var jobs = WORKLOADS[config.workload].jobs.map(function (job, order) {
      return { id: job.id, arrival: job.arrival, burst: job.burst, remaining: job.burst, order: order, start: null, finish: null };
    });
    var ready = [];
    var nextArrival = 0;
    var time = 0;
    var current = null;
    var quantumLeft = 0;
    var slices = [];
    while (jobs.some(function (job) { return job.finish === null; })) {
      while (nextArrival < jobs.length && jobs[nextArrival].arrival <= time) ready.push(jobs[nextArrival++]);
      if (!current) {
        if (!ready.length) {
          time = jobs[nextArrival].arrival;
          continue;
        }
        current = chooseReady(ready, config.policy);
        if (current.start === null) current.start = time;
        quantumLeft = config.policy === "rr" ? config.quantum : Infinity;
      }
      var last = slices[slices.length - 1];
      if (last && last.id === current.id && last.end === time) last.end += 1;
      else slices.push({ id: current.id, start: time, end: time + 1 });
      current.remaining -= 1;
      quantumLeft -= 1;
      time += 1;
      while (nextArrival < jobs.length && jobs[nextArrival].arrival <= time) ready.push(jobs[nextArrival++]);
      if (current.remaining === 0) {
        current.finish = time;
        current = null;
      } else if (config.policy === "rr" && quantumLeft === 0) {
        ready.push(current);
        current = null;
      }
    }
    var rows = jobs.map(function (job) {
      return {
        id: job.id,
        arrival: job.arrival,
        burst: job.burst,
        start: job.start,
        finish: job.finish,
        response: job.start - job.arrival,
        turnaround: job.finish - job.arrival
      };
    });
    var response = rows.reduce(function (sum, row) { return sum + row.response; }, 0) / rows.length;
    var turnaround = rows.reduce(function (sum, row) { return sum + row.turnaround; }, 0) / rows.length;
    var switches = slices.reduce(function (count, slice, index) {
      return count + (index > 0 && slices[index - 1].id !== slice.id ? 1 : 0);
    }, 0);
    var work = rows.reduce(function (sum, row) { return sum + row.burst; }, 0);
    return {
      config: config,
      slices: slices,
      rows: rows,
      finishTime: time,
      avgResponse: response,
      avgTurnaround: turnaround,
      switches: switches,
      utilization: time ? work / time : 0
    };
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    doc.head.appendChild(style);
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function draw(doc, svg, result) {
    clear(svg);
    var width = 720;
    var height = 220;
    var left = 42;
    var right = 16;
    var top = 44;
    var barHeight = 54;
    var scale = (width - left - right) / Math.max(result.finishTime, 1);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.appendChild(doc.createElementNS(SVG_NS, "title")).textContent = "调度策略的 CPU 甘特轨迹";
    svg.appendChild(doc.createElementNS(SVG_NS, "desc")).textContent = "每个色块表示一个任务获得 CPU 的连续时间片，横轴是离散时间单位。";
    for (var tick = 0; tick <= result.finishTime; tick += 1) {
      var x = left + tick * scale;
      var line = doc.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", x); line.setAttribute("x2", x); line.setAttribute("y1", top - 15); line.setAttribute("y2", top + barHeight);
      line.setAttribute("stroke", "currentColor"); line.setAttribute("stroke-opacity", tick === 0 ? ".65" : ".13");
      svg.appendChild(line);
      var label = doc.createElementNS(SVG_NS, "text");
      label.setAttribute("x", x + 2); label.setAttribute("y", top - 21); label.setAttribute("font-size", "11"); label.textContent = String(tick);
      svg.appendChild(label);
    }
    result.slices.forEach(function (slice) {
      var rect = doc.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", left + slice.start * scale + 1); rect.setAttribute("y", top);
      rect.setAttribute("width", Math.max(2, (slice.end - slice.start) * scale - 2)); rect.setAttribute("height", barHeight);
      rect.setAttribute("rx", "3"); rect.setAttribute("fill", COLORS[slice.id] || "#315f9d");
      rect.setAttribute("fill-opacity", ".86");
      svg.appendChild(rect);
      var text = doc.createElementNS(SVG_NS, "text");
      text.setAttribute("x", left + (slice.start + slice.end) * scale / 2); text.setAttribute("y", top + 32);
      text.setAttribute("text-anchor", "middle"); text.setAttribute("fill", "#fff"); text.setAttribute("font-size", "12"); text.textContent = slice.id;
      svg.appendChild(text);
    });
    var axis = doc.createElementNS(SVG_NS, "text");
    axis.setAttribute("x", left); axis.setAttribute("y", height - 18); axis.setAttribute("font-size", "12");
    axis.textContent = "时间单位（CPU 工作量） · " + POLICIES[result.config.policy];
    svg.appendChild(axis);
  }

  function table(doc, rows) {
    var wrap = doc.createElement("div");
    wrap.className = "cs-table";
    var tbl = doc.createElement("table");
    var caption = doc.createElement("caption"); caption.textContent = "逐任务调度账本"; tbl.appendChild(caption);
    var head = doc.createElement("thead");
    ["任务", "到达", "工作量", "首次运行", "完成", "响应", "周转"].forEach(function (label) {
      var th = doc.createElement("th"); th.textContent = label; head.appendChild(th);
    });
    tbl.appendChild(head);
    var body = doc.createElement("tbody");
    rows.forEach(function (row) {
      var tr = doc.createElement("tr");
      [row.id, row.arrival, row.burst, row.start, row.finish, row.response, row.turnaround].forEach(function (value) {
        var td = doc.createElement("td"); td.textContent = String(value); tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    tbl.appendChild(body); wrap.appendChild(tbl); return wrap;
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { workload: "mixed", policy: "rr", quantum: 2, predictions: {}, revealed: false, feedback: "" };
    var shell = api.el("div", { className: "cs-os-sched" });
    shell.appendChild(api.el("h3", { text: "调度账本：响应、周转与切换成本" }));
    shell.appendChild(api.el("p", { className: "cs-note", text: "先回答两个时间问题，再让调度器展开同一 workload 的 CPU 轨迹。" }));
    var questions = [];
    [
      { key: "response", prompt: "默认 workload 的平均响应时间最小？", expected: "sjf", choices: [{ value: "fifo", label: "FIFO" }, { value: "sjf", label: "SJF" }, { value: "rr", label: "RR(q=2)" }] },
      { key: "turnaround", prompt: "默认 workload 的平均周转时间最小？", expected: "sjf", choices: [{ value: "fifo", label: "FIFO" }, { value: "sjf", label: "SJF" }, { value: "rr", label: "RR(q=2)" }] }
    ].forEach(function (spec) {
      var field = doc.createElement("fieldset");
      var legend = doc.createElement("legend"); legend.textContent = spec.prompt; field.appendChild(legend);
      var choices = doc.createElement("div"); choices.className = "cs-choices";
      var question = { spec: spec, buttons: [] };
      spec.choices.forEach(function (choice) {
        var button = api.el("button", { type: "button", text: choice.label, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); });
        question.buttons.push({ choice: choice, node: button }); choices.appendChild(button);
      });
      field.appendChild(choices); questions.push(question); shell.appendChild(field);
    });
    var actions = doc.createElement("div"); actions.className = "cs-actions";
    var reveal = api.el("button", { type: "button", className: "cs-primary", text: "提交预测并展开" });
    var reset = api.el("button", { type: "button", text: "重置" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = api.el("p", { className: "cs-feedback", "aria-live": "polite" }); shell.appendChild(feedback);
    var controls = doc.createElement("div"); controls.className = "cs-controls";
    var workloadSelect = doc.createElement("select"); workloadSelect.setAttribute("aria-label", "工作负载");
    Object.keys(WORKLOADS).forEach(function (key) { var option = doc.createElement("option"); option.value = key; option.textContent = WORKLOADS[key].label; workloadSelect.appendChild(option); });
    var policySelect = doc.createElement("select"); policySelect.setAttribute("aria-label", "调度策略");
    Object.keys(POLICIES).forEach(function (key) { var option = doc.createElement("option"); option.value = key; option.textContent = POLICIES[key]; policySelect.appendChild(option); });
    var quantum = doc.createElement("input"); quantum.type = "range"; quantum.min = "1"; quantum.max = "5"; quantum.step = "1"; quantum.value = "2"; quantum.setAttribute("aria-label", "RR 时间片");
    var quantumOutput = doc.createElement("output"); quantumOutput.textContent = "2 单位";
    controls.appendChild(api.el("div", { className: "cs-control" }, [api.el("label", { text: "工作负载" }), workloadSelect]));
    controls.appendChild(api.el("div", { className: "cs-control" }, [api.el("label", { text: "策略" }), policySelect]));
    controls.appendChild(api.el("div", { className: "cs-control" }, [api.el("label", {}, ["RR 时间片 = ", quantumOutput]), quantum])); shell.appendChild(controls);
    var resultPane = doc.createElement("div"); resultPane.hidden = true;
    var stage = doc.createElement("div"); stage.className = "cs-stage";
    var svg = doc.createElementNS(SVG_NS, "svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "调度甘特图"); stage.appendChild(svg); resultPane.appendChild(stage);
    var metrics = doc.createElement("div"); metrics.className = "cs-metrics"; resultPane.appendChild(metrics);
    var rowsHost = doc.createElement("div"); resultPane.appendChild(rowsHost); shell.appendChild(resultPane);
    rootNode.replaceChildren(shell);

    function metric(label, value) { return api.el("div", { className: "cs-metric" }, [api.el("span", { text: label }), api.el("strong", { text: value })]); }
    function render() {
      workloadSelect.value = state.workload; policySelect.value = state.policy; quantum.value = String(state.quantum); quantumOutput.textContent = state.quantum + " 单位";
      questions.forEach(function (question) { question.buttons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[question.spec.key] === item.choice.value ? "true" : "false"); }); });
      feedback.textContent = state.feedback; feedback.className = "cs-feedback" + (state.feedback.indexOf("请先") === 0 ? " cs-warn" : "");
      resultPane.hidden = !state.revealed;
      if (!state.revealed) return;
      var result = simulate(state);
      draw(doc, svg, result); clear(metrics);
      metrics.appendChild(metric("平均响应", result.avgResponse.toFixed(2)));
      metrics.appendChild(metric("平均周转", result.avgTurnaround.toFixed(2)));
      metrics.appendChild(metric("任务切换", String(result.switches)));
      metrics.appendChild(metric("CPU 利用率", (result.utilization * 100).toFixed(1) + "%"));
      clear(rowsHost); rowsHost.appendChild(table(doc, result.rows));
    }
    workloadSelect.addEventListener("change", function () { state.workload = workloadSelect.value; state.revealed = false; state.feedback = ""; render(); });
    policySelect.addEventListener("change", function () { state.policy = policySelect.value; state.revealed = false; state.feedback = ""; render(); });
    quantum.addEventListener("input", function () { state.quantum = Number(quantum.value); state.revealed = false; state.feedback = ""; render(); });
    reveal.addEventListener("click", function () {
      var specs = questions.map(function (question) { return question.spec; });
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成两个预测；甘特图和指标会在揭晓后显示。"; render(); return; }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。注意响应、周转与切换次数的权衡。"; render(); api.announce(rootNode, state.feedback);
    });
    reset.addEventListener("click", function () { state = { workload: "mixed", policy: "rr", quantum: 2, predictions: {}, revealed: false, feedback: "" }; render(); api.announce(rootNode, "调度预测已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var fifo = simulate({ workload: "mixed", policy: "fifo" });
    var sjf = simulate({ workload: "mixed", policy: "sjf" });
    var rr = simulate({ workload: "mixed", policy: "rr", quantum: 2 });
    check(near(fifo.avgResponse, 7.25), "FIFO response");
    check(near(sjf.avgTurnaround, 5.5), "SJF turnaround");
    check(near(sjf.avgResponse, 2.25), "SJF response");
    check(near(rr.avgResponse, 2.75), "RR response");
    [fifo, sjf, rr].forEach(function (result) {
      check(result.rows.reduce(function (sum, row) { return sum + row.burst; }, 0) === result.finishTime, result.config.policy + " work conservation");
      check(result.rows.every(function (row) { return row.finish >= row.start; }), result.config.policy + " completion ordering");
    });
    check(JSON.stringify(rr) === JSON.stringify(simulate({ workload: "mixed", policy: "rr", quantum: 2 })), "deterministic simulation");
    return { checks: checks };
  }

  return { normalize: normalize, simulate: simulate, mount: mount, selfTest: selfTest };
});
