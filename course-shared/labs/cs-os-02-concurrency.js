(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("cs-os-02-concurrency", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log("cs-os-02-concurrency self-test: PASS (" + report.checks + " checks)"); }
    catch (error) { console.error("cs-os-02-concurrency self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var LAB_ID = "cs-os-02-concurrency";
  var STYLE_ID = LAB_ID + "-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var ACTIONS = ["A-read", "A-write", "B-read", "B-write"];
  var CSS = [
    ".cs-os-race{--cs-blue:#315f9d;--cs-green:#39734d;--cs-gold:#9b6a12;--cs-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}",
    ".cs-os-race *{box-sizing:border-box}.cs-os-race [hidden]{display:none!important}.cs-os-race h3{margin:0;font-size:1.16rem}.cs-os-race p{margin:8px 0}.cs-os-race fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}.cs-os-race legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750;line-height:1.5}",
    ".cs-os-race .cs-choices,.cs-os-race .cs-actions{display:flex;flex-wrap:wrap;gap:8px}.cs-os-race button,.cs-os-race select,.cs-os-race input{font:inherit;letter-spacing:0}.cs-os-race button,.cs-os-race select{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}.cs-os-race button{flex:1 1 150px}.cs-os-race button:hover,.cs-os-race select:hover{border-color:var(--accent,#315f9d)}.cs-os-race button[aria-pressed=true],.cs-os-race .cs-primary{background:var(--accent,#315f9d);border-color:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}.cs-os-race button:focus-visible,.cs-os-race select:focus-visible,.cs-os-race input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".cs-os-race .cs-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}.cs-os-race .cs-warn{color:var(--cs-red)}.cs-os-race .cs-good{color:var(--cs-green)}.cs-os-race .cs-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:15px 0}.cs-os-race .cs-control{display:grid;gap:5px;min-width:0}.cs-os-race .cs-control label{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}.cs-os-race input[type=range]{width:100%;min-height:44px;accent-color:var(--accent,#315f9d)}",
    ".cs-os-race .cs-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);overflow:hidden}.cs-os-race svg{display:block;width:100%;height:auto;max-width:100%}.cs-os-race svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.cs-os-race .cs-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.cs-os-race .cs-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#cbd5e1);background:var(--block-bg,transparent)}.cs-os-race .cs-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}.cs-os-race .cs-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.cs-os-race .cs-table{max-width:100%;overflow-x:auto}.cs-os-race table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.cs-os-race th,.cs-os-race td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;white-space:nowrap}.cs-os-race th{color:var(--fg-soft,currentColor);font-size:11px}",
    "@media(max-width:600px){.cs-os-race .cs-controls{grid-template-columns:1fr}.cs-os-race .cs-metrics{grid-template-columns:1fr}}@media(max-width:480px){.cs-os-race button{flex-basis:100%}}@media(prefers-reduced-motion:reduce){.cs-os-race *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function assert(condition, message) { if (!condition) throw new Error(LAB_ID + " self-test failed: " + message); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function interleavings(left, right, prefix, out) {
    if (!left.length && !right.length) { out.push(prefix.slice()); return; }
    if (left.length) interleavings(left.slice(1), right, prefix.concat(left[0]), out);
    if (right.length) interleavings(left, right.slice(1), prefix.concat(right[0]), out);
    return out;
  }

  function allTraces() { return interleavings(["A-read", "A-write"], ["B-read", "B-write"], [], []); }

  function runTrace(trace, mode) {
    var executedTrace = trace.slice();
    var serialized = [];
    if (mode === "mutex") {
      var order = trace[0].charAt(0) === "A" ? ["A", "B"] : ["B", "A"];
      executedTrace = [];
      order.forEach(function (thread) {
        executedTrace.push(thread + "-read");
        executedTrace.push(thread + "-write");
        serialized.push(thread + " critical section");
      });
    }
    var counter = 5;
    var local = { A: null, B: null };
    var rows = [];
    executedTrace.forEach(function (action, index) {
      var thread = action.charAt(0);
      if (action.indexOf("read") !== -1) local[thread] = counter;
      else counter = local[thread] + 1;
      rows.push({ step: index + 1, action: action, counter: counter, snapshot: local[thread] });
    });
    return { trace: executedTrace, mode: mode, final: counter, rows: rows, serialized: serialized, lostUpdate: mode === "none" && counter === 6 };
  }

  function analyze(index, mode) {
    var traces = allTraces();
    var safeIndex = Math.max(0, Math.min(traces.length - 1, Number(index) || 0));
    return runTrace(traces[safeIndex], mode === "mutex" ? "mutex" : "none");
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = CSS; doc.head.appendChild(style);
  }

  function draw(doc, svg, result, step) {
    clear(svg); var width = 720; var height = 220; var left = 78; var right = 18; var top = 34; var gap = 70; var xStep = (width - left - right) / 3;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    var title = doc.createElementNS(SVG_NS, "title"); title.textContent = "共享 counter 的事件交错"; svg.appendChild(title);
    var desc = doc.createElementNS(SVG_NS, "desc"); desc.textContent = "A 和 B 的读写事件按程序顺序排列，当前步骤以实线圆标记。"; svg.appendChild(desc);
    ["A", "B"].forEach(function (thread, lane) {
      var label = doc.createElementNS(SVG_NS, "text"); label.setAttribute("x", 18); label.setAttribute("y", top + lane * gap + 5); label.setAttribute("font-size", "13"); label.textContent = "线程 " + thread; svg.appendChild(label);
      var line = doc.createElementNS(SVG_NS, "line"); line.setAttribute("x1", left); line.setAttribute("x2", width - right); line.setAttribute("y1", top + lane * gap); line.setAttribute("y2", top + lane * gap); line.setAttribute("stroke", "currentColor"); line.setAttribute("stroke-opacity", ".25"); svg.appendChild(line);
    });
    result.trace.forEach(function (action, index) {
      var thread = action.charAt(0); var lane = thread === "A" ? 0 : 1; var x = left + index * xStep;
      var circle = doc.createElementNS(SVG_NS, "circle"); circle.setAttribute("cx", x); circle.setAttribute("cy", top + lane * gap); circle.setAttribute("r", index < step ? 15 : 11); circle.setAttribute("fill", index < step ? (action.indexOf("read") !== -1 ? "#315f9d" : "#39734d") : "none"); circle.setAttribute("stroke", "currentColor"); circle.setAttribute("stroke-width", index === step - 1 ? "3" : "1"); svg.appendChild(circle);
      var text = doc.createElementNS(SVG_NS, "text"); text.setAttribute("x", x); text.setAttribute("y", top + lane * gap + 4); text.setAttribute("text-anchor", "middle"); text.setAttribute("font-size", "10"); text.textContent = action.slice(2, 3) === "r" ? "读" : "写"; svg.appendChild(text);
      var number = doc.createElementNS(SVG_NS, "text"); number.setAttribute("x", x); number.setAttribute("y", height - 20); number.setAttribute("text-anchor", "middle"); number.setAttribute("font-size", "11"); number.textContent = String(index + 1); svg.appendChild(number);
    });
    var caption = doc.createElementNS(SVG_NS, "text"); caption.setAttribute("x", left); caption.setAttribute("y", height - 4); caption.setAttribute("font-size", "12"); caption.textContent = result.mode === "mutex" ? "mutex：临界区按串行顺序执行" : "无锁：每次写回使用各自读到的快照"; svg.appendChild(caption);
  }

  function renderTable(doc, result, step) {
    var wrap = doc.createElement("div"); wrap.className = "cs-table";
    var tbl = doc.createElement("table"); var caption = doc.createElement("caption"); caption.textContent = "事件状态 trace（初值 counter=5）"; tbl.appendChild(caption);
    var head = doc.createElement("thead"); ["步", "事件", "线程快照", "写后 counter"].forEach(function (label) { var th = doc.createElement("th"); th.textContent = label; head.appendChild(th); }); tbl.appendChild(head);
    var body = doc.createElement("tbody"); result.rows.forEach(function (row, index) { var tr = doc.createElement("tr"); [row.step, row.action, row.snapshot === null ? "—" : row.snapshot, index < step ? row.counter : "等待"].forEach(function (value) { var td = doc.createElement("td"); td.textContent = String(value); tr.appendChild(td); }); body.appendChild(tr); }); tbl.appendChild(body); wrap.appendChild(tbl); return wrap;
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return; var doc = rootNode.ownerDocument; installStyles(doc);
    var traces = allTraces(); var state = { index: 1, mode: "none", step: 0, predictions: {}, revealed: false, feedback: "" };
    var shell = api.el("div", { className: "cs-os-race" }); shell.appendChild(api.el("h3", { text: "交错账本：counter++ 的线性化边界" })); shell.appendChild(api.el("p", { className: "cs-note", text: "每个线程内部仍保持 read 先于 write；你可以逐步推进事件，观察快照何时变成错误。" }));
    var questions = [];
    [{ key: "value", prompt: "默认交错在无锁下最终值？", expected: "6", choices: [{ value: "6", label: "6：丢失一次更新" }, { value: "7", label: "7：两次都生效" }] }, { key: "mutex", prompt: "开启 mutex 后，所有交错的最终值？", expected: "7", choices: [{ value: "6", label: "仍可能是 6" }, { value: "7", label: "固定为 7" }] }].forEach(function (spec) {
      var field = doc.createElement("fieldset"); var legend = doc.createElement("legend"); legend.textContent = spec.prompt; field.appendChild(legend); var choices = doc.createElement("div"); choices.className = "cs-choices"; var question = { spec: spec, buttons: [] };
      spec.choices.forEach(function (choice) { var button = api.el("button", { type: "button", text: choice.label, "aria-pressed": "false" }); button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); }); question.buttons.push({ choice: choice, node: button }); choices.appendChild(button); }); field.appendChild(choices); questions.push(question); shell.appendChild(field);
    });
    var actions = doc.createElement("div"); actions.className = "cs-actions"; var reveal = api.el("button", { type: "button", className: "cs-primary", text: "提交预测并重放" }); var reset = api.el("button", { type: "button", text: "重置" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = api.el("p", { className: "cs-feedback", "aria-live": "polite" }); shell.appendChild(feedback);
    var controls = doc.createElement("div"); controls.className = "cs-controls"; var traceSelect = doc.createElement("select"); traceSelect.setAttribute("aria-label", "事件交错"); traces.forEach(function (trace, index) { var option = doc.createElement("option"); option.value = String(index); option.textContent = index + 1 + ": " + trace.join(" → "); traceSelect.appendChild(option); }); var modeSelect = doc.createElement("select"); modeSelect.setAttribute("aria-label", "同步模式"); [{ value: "none", label: "无锁" }, { value: "mutex", label: "mutex 临界区" }].forEach(function (item) { var option = doc.createElement("option"); option.value = item.value; option.textContent = item.label; modeSelect.appendChild(option); }); var step = doc.createElement("input"); step.type = "range"; step.min = "0"; step.max = "4"; step.step = "1"; step.value = "0"; step.setAttribute("aria-label", "已执行事件数"); var stepOutput = doc.createElement("output"); stepOutput.textContent = "0/4 步";
    controls.appendChild(api.el("div", { className: "cs-control" }, [api.el("label", { text: "选择交错" }), traceSelect])); controls.appendChild(api.el("div", { className: "cs-control" }, [api.el("label", { text: "同步模式" }), modeSelect])); controls.appendChild(api.el("div", { className: "cs-control" }, [api.el("label", {}, ["事件进度 = ", stepOutput]), step])); shell.appendChild(controls);
    var resultPane = doc.createElement("div"); resultPane.hidden = true; var stage = doc.createElement("div"); stage.className = "cs-stage"; var svg = doc.createElementNS(SVG_NS, "svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "并发事件时间线"); stage.appendChild(svg); resultPane.appendChild(stage); var metrics = doc.createElement("div"); metrics.className = "cs-metrics"; resultPane.appendChild(metrics); var tableHost = doc.createElement("div"); resultPane.appendChild(tableHost); shell.appendChild(resultPane); rootNode.replaceChildren(shell);
    function metric(label, value) { return api.el("div", { className: "cs-metric" }, [api.el("span", { text: label }), api.el("strong", { text: value })]); }
    function render() { traceSelect.value = String(state.index); modeSelect.value = state.mode; step.value = String(state.step); stepOutput.textContent = state.step + "/4 步"; questions.forEach(function (question) { question.buttons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[question.spec.key] === item.choice.value ? "true" : "false"); }); }); feedback.textContent = state.feedback; feedback.className = "cs-feedback" + (state.feedback.indexOf("请先") === 0 ? " cs-warn" : ""); resultPane.hidden = !state.revealed; if (!state.revealed) return; var result = analyze(state.index, state.mode); draw(doc, svg, result, state.step); clear(metrics); var shownFinal = state.step === 4 ? String(result.final) : "进行中"; metrics.appendChild(metric("当前 counter", state.step === 4 ? shownFinal : "—")); metrics.appendChild(metric("预测轨迹", result.lostUpdate && state.mode === "none" ? "丢失更新" : state.mode === "mutex" ? "临界区串行" : "待观察")); metrics.appendChild(metric("保持程序顺序", "是")); clear(tableHost); tableHost.appendChild(renderTable(doc, result, state.step)); }
    traceSelect.addEventListener("change", function () { state.index = Number(traceSelect.value); state.step = 0; state.revealed = false; state.feedback = ""; render(); }); modeSelect.addEventListener("change", function () { state.mode = modeSelect.value; state.step = 0; state.revealed = false; state.feedback = ""; render(); }); step.addEventListener("input", function () { state.step = Number(step.value); if (state.revealed) render(); });
    reveal.addEventListener("click", function () { if (!questions.every(function (question) { return state.predictions[question.spec.key] !== undefined; })) { state.feedback = "请先完成两个预测；事件时间线和写回账本会在揭晓后显示。"; render(); return; } var correct = questions.filter(function (question) { return state.predictions[question.spec.key] === question.spec.expected; }).length; state.revealed = true; state.step = 4; state.feedback = "已揭晓：" + correct + "/" + questions.length + " 命中。再拖动进度观察中间状态。"; render(); api.announce(rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { index: 1, mode: "none", step: 0, predictions: {}, revealed: false, feedback: "" }; render(); api.announce(rootNode, "并发交错预测已重置。"); }); render();
  }

  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var traces = allTraces(); check(traces.length === 6, "six legal interleavings"); var results = traces.map(function (trace) { return runTrace(trace, "none").final; }); check(results.filter(function (value) { return value === 6; }).length === 4, "four lost-update interleavings"); check(results.filter(function (value) { return value === 7; }).length === 2, "two serial-equivalent interleavings"); traces.forEach(function (trace) { check(runTrace(trace, "mutex").final === 7, "mutex serializes " + trace.join(",")); }); check(runTrace(traces[0], "none").rows.length === 4, "trace rows"); check(runTrace(traces[1], "mutex").trace.join(",") === "A-read,A-write,B-read,B-write", "mutex displays serialized order"); return { checks: checks }; }
  return { allTraces: allTraces, runTrace: runTrace, analyze: analyze, mount: mount, selfTest: selfTest };
});
