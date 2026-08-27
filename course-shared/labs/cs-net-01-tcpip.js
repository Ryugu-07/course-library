(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("cs-net-01-tcpip", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log("cs-net-01-tcpip self-test: PASS (" + report.checks + " checks)"); }
    catch (error) { console.error("cs-net-01-tcpip self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var LAB_ID = "cs-net-01-tcpip";
  var STYLE_ID = LAB_ID + "-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var CSS = [
    ".cs-net-tcp{--cs-blue:#315f9d;--cs-green:#39734d;--cs-gold:#9b6a12;--cs-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}",
    ".cs-net-tcp *{box-sizing:border-box}.cs-net-tcp [hidden]{display:none!important}.cs-net-tcp h3{margin:0;font-size:1.16rem}.cs-net-tcp p{margin:8px 0}.cs-net-tcp fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}.cs-net-tcp legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750;line-height:1.5}",
    ".cs-net-tcp .cs-choices,.cs-net-tcp .cs-actions{display:flex;flex-wrap:wrap;gap:8px}.cs-net-tcp button,.cs-net-tcp select,.cs-net-tcp input{font:inherit;letter-spacing:0}.cs-net-tcp button,.cs-net-tcp select{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}.cs-net-tcp button{flex:1 1 150px}.cs-net-tcp button:hover,.cs-net-tcp select:hover{border-color:var(--accent,#315f9d)}.cs-net-tcp button[aria-pressed=true],.cs-net-tcp .cs-primary{background:var(--accent,#315f9d);border-color:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}.cs-net-tcp button:focus-visible,.cs-net-tcp select:focus-visible,.cs-net-tcp input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".cs-net-tcp .cs-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}.cs-net-tcp .cs-warn{color:var(--cs-red)}.cs-net-tcp .cs-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:15px 0}.cs-net-tcp .cs-control{display:grid;gap:5px;min-width:0}.cs-net-tcp .cs-control label{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}.cs-net-tcp input[type=range]{width:100%;min-height:44px;accent-color:var(--accent,#315f9d)}",
    ".cs-net-tcp .cs-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);overflow:hidden}.cs-net-tcp svg{display:block;width:100%;height:auto;max-width:100%}.cs-net-tcp svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.cs-net-tcp .cs-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.cs-net-tcp .cs-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#cbd5e1);background:var(--block-bg,transparent)}.cs-net-tcp .cs-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}.cs-net-tcp .cs-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.cs-net-tcp .cs-table{max-width:100%;overflow-x:auto}.cs-net-tcp table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.cs-net-tcp th,.cs-net-tcp td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;white-space:nowrap}.cs-net-tcp th{color:var(--fg-soft,currentColor);font-size:11px}",
    "@media(max-width:620px){.cs-net-tcp .cs-controls{grid-template-columns:1fr}.cs-net-tcp .cs-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.cs-net-tcp .cs-metrics{grid-template-columns:1fr}.cs-net-tcp button{flex-basis:100%}}@media(prefers-reduced-motion:reduce){.cs-net-tcp *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function assert(condition, message) { if (!condition) throw new Error(LAB_ID + " self-test failed: " + message); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function normalize(options) {
    options = options || {};
    var windowSize = Number(options.window);
    if (!Number.isFinite(windowSize)) windowSize = 6;
    var loss = options.loss === "late" || options.loss === "none" ? options.loss : "early";
    return { window: clamp(Math.round(windowSize), 4, 8), loss: loss };
  }

  function simulate(options) {
    var config = normalize(options);
    var lossAt = config.loss === "none" ? -1 : config.loss === "late" ? config.window - 1 : 2;
    var expected = 0;
    var buffered = Object.create(null);
    var delivered = [];
    var events = [];
    var lastAck = 0;
    var duplicateAcks = 0;
    var observedDuplicateAcks = 0;
    var recovery = lossAt < 0 ? "无丢包" : "timeout";
    var cwnd = config.window;
    function event(type, text, seq, ack) { events.push({ type: type, text: text, seq: seq, ack: ack, cwnd: cwnd }); }
    function receive(seq) {
      if (seq === expected) {
        delivered.push(seq); expected += 1;
        while (buffered[expected]) { delivered.push(expected); delete buffered[expected]; expected += 1; }
      } else if (seq > expected) buffered[seq] = true;
      var ack = expected;
      if (ack === lastAck) duplicateAcks += 1;
      else duplicateAcks = 0;
      lastAck = ack;
      event("recv", "接收 " + seq + "，累计 ACK=" + ack, seq, ack);
    }
    for (var seq = 0; seq < config.window; seq += 1) {
      event("send", "发送 " + seq, seq, lastAck);
      if (seq === lossAt) event("drop", "序号 " + seq + " 丢失", seq, lastAck);
      else receive(seq);
    }
    if (lossAt >= 0) {
      observedDuplicateAcks = duplicateAcks;
      if (duplicateAcks >= 3) { recovery = "fast retransmit"; cwnd = Math.max(2, Math.floor(cwnd / 2)); event("fast", "三个重复 ACK，快速重传并减半 cwnd", lossAt, lastAck); }
      else { recovery = "timeout"; cwnd = Math.max(1, Math.floor(cwnd / 2)); event("timeout", "重复 ACK 不足，超时重传并减半 cwnd", lossAt, lastAck); }
      event("retransmit", "重传缺口 " + lossAt, lossAt, lastAck); receive(lossAt);
    }
    for (var next = config.window; next < 9; next += 1) { event("send", "发送 " + next, next, lastAck); receive(next); }
    return { config: config, lossAt: lossAt, events: events, delivered: delivered, finalAck: expected, duplicateAcks: observedDuplicateAcks, cwnd: cwnd, recovery: recovery };
  }

  function installStyles(doc) { if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return; var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = CSS; doc.head.appendChild(style); }

  function draw(doc, svg, result) {
    clear(svg); var width = 720; var height = 270; var left = 72; var right = 18; var top = 42; var step = (width - left - right) / Math.max(result.events.length - 1, 1); svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    var title = doc.createElementNS(SVG_NS, "title"); title.textContent = "TCP 序号、累计 ACK 与重传 trace"; svg.appendChild(title); var desc = doc.createElementNS(SVG_NS, "desc"); desc.textContent = "上方轨道是发送端事件，下方轨道是接收端事件；丢包和恢复事件用文字标记。"; svg.appendChild(desc);
    ["发送端", "接收端"].forEach(function (label, lane) { var text = doc.createElementNS(SVG_NS, "text"); text.setAttribute("x", 10); text.setAttribute("y", top + lane * 82 + 4); text.setAttribute("font-size", "12"); text.textContent = label; svg.appendChild(text); var line = doc.createElementNS(SVG_NS, "line"); line.setAttribute("x1", left); line.setAttribute("x2", width - right); line.setAttribute("y1", top + lane * 82); line.setAttribute("y2", top + lane * 82); line.setAttribute("stroke", "currentColor"); line.setAttribute("stroke-opacity", ".25"); svg.appendChild(line); });
    result.events.forEach(function (item, index) { var lane = item.type === "recv" ? 1 : 0; var x = left + index * step; var color = item.type === "drop" || item.type === "timeout" ? "#b64335" : item.type === "fast" || item.type === "retransmit" ? "#9b6a12" : item.type === "recv" ? "#39734d" : "#315f9d"; var circle = doc.createElementNS(SVG_NS, "circle"); circle.setAttribute("cx", x); circle.setAttribute("cy", top + lane * 82); circle.setAttribute("r", item.type === "drop" || item.type === "fast" || item.type === "timeout" ? "13" : "9"); circle.setAttribute("fill", color); circle.setAttribute("fill-opacity", ".86"); svg.appendChild(circle); var label = doc.createElementNS(SVG_NS, "text"); label.setAttribute("x", x); label.setAttribute("y", top + lane * 82 + 4); label.setAttribute("text-anchor", "middle"); label.setAttribute("font-size", "9"); label.setAttribute("fill", "#fff"); label.textContent = item.seq === undefined ? "!" : String(item.seq); svg.appendChild(label); if (index % 2 === 0 || item.type === "drop" || item.type === "fast" || item.type === "timeout") { var note = doc.createElementNS(SVG_NS, "text"); note.setAttribute("x", x); note.setAttribute("y", height - 38 - (index % 3) * 13); note.setAttribute("text-anchor", "middle"); note.setAttribute("font-size", "9"); note.textContent = item.type === "recv" ? "ACK " + item.ack : item.type === "drop" ? "丢" : item.type === "fast" ? "快重传" : item.type === "timeout" ? "超时" : item.type === "retransmit" ? "重传" : "发"; svg.appendChild(note); } });
    var caption = doc.createElementNS(SVG_NS, "text"); caption.setAttribute("x", left); caption.setAttribute("y", height - 9); caption.setAttribute("font-size", "12"); caption.textContent = "序号 0–8 · 累计 ACK 只推进连续前缀 · cwnd=" + result.cwnd; svg.appendChild(caption);
  }

  function table(doc, result) { var wrap = doc.createElement("div"); wrap.className = "cs-table"; var tbl = doc.createElement("table"); var cap = doc.createElement("caption"); cap.textContent = "事件 ledger（固定序号实验）"; tbl.appendChild(cap); var head = doc.createElement("thead"); ["#", "事件", "序号", "ACK", "cwnd"].forEach(function (label) { var th = doc.createElement("th"); th.textContent = label; head.appendChild(th); }); tbl.appendChild(head); var body = doc.createElement("tbody"); result.events.forEach(function (item, index) { var tr = doc.createElement("tr"); [index + 1, item.text, item.seq === undefined ? "—" : item.seq, item.ack, item.cwnd].forEach(function (value) { var td = doc.createElement("td"); td.textContent = String(value); tr.appendChild(td); }); body.appendChild(tr); }); tbl.appendChild(body); wrap.appendChild(tbl); return wrap; }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return; var doc = rootNode.ownerDocument; installStyles(doc); var state = { window: 6, loss: "early", predictions: {}, revealed: false, feedback: "" };
    var shell = api.el("div", { className: "cs-net-tcp" }); shell.appendChild(api.el("h3", { text: "TCP trace：累计 ACK 如何穿过丢包" })); shell.appendChild(api.el("p", { className: "cs-note", text: "先判断接收端能交付什么，再逐步观察窗口前沿和拥塞反应。" }));
    var questions = []; [{ key: "ack", prompt: "默认序号 2 丢失时，乱序 3/4/5 产生的 ACK？", expected: "2", choices: [{ value: "2", label: "重复 ACK=2" }, { value: "6", label: "直接 ACK=6" }] }, { key: "recovery", prompt: "窗口 0–5 丢 2，三个重复 ACK 后？", expected: "fast", choices: [{ value: "fast", label: "快速重传" }, { value: "timeout", label: "等超时" }, { value: "none", label: "无需重传" }] }].forEach(function (spec) { var field = doc.createElement("fieldset"); var legend = doc.createElement("legend"); legend.textContent = spec.prompt; field.appendChild(legend); var choices = doc.createElement("div"); choices.className = "cs-choices"; var question = { spec: spec, buttons: [] }; spec.choices.forEach(function (choice) { var button = api.el("button", { type: "button", text: choice.label, "aria-pressed": "false" }); button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); }); question.buttons.push({ choice: choice, node: button }); choices.appendChild(button); }); field.appendChild(choices); questions.push(question); shell.appendChild(field); });
    var actions = doc.createElement("div"); actions.className = "cs-actions"; var reveal = api.el("button", { type: "button", className: "cs-primary", text: "提交预测并重放" }); var reset = api.el("button", { type: "button", text: "重置" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = api.el("p", { className: "cs-feedback", "aria-live": "polite" }); shell.appendChild(feedback);
    var controls = doc.createElement("div"); controls.className = "cs-controls"; var loss = doc.createElement("select"); loss.setAttribute("aria-label", "丢包位置"); [{ value: "early", label: "丢窗口内的序号 2" }, { value: "late", label: "丢窗口末尾序号" }, { value: "none", label: "无丢包" }].forEach(function (item) { var option = doc.createElement("option"); option.value = item.value; option.textContent = item.label; loss.appendChild(option); }); var windowInput = doc.createElement("input"); windowInput.type = "range"; windowInput.min = "4"; windowInput.max = "8"; windowInput.step = "1"; windowInput.value = "6"; windowInput.setAttribute("aria-label", "发送窗口大小"); var windowOutput = doc.createElement("output"); windowOutput.textContent = "6 个序号"; controls.appendChild(api.el("div", { className: "cs-control" }, [api.el("label", { text: "确定性丢包" }), loss])); controls.appendChild(api.el("div", { className: "cs-control" }, [api.el("label", {}, ["发送窗口 = ", windowOutput]), windowInput])); shell.appendChild(controls);
    var resultPane = doc.createElement("div"); resultPane.hidden = true; var stage = doc.createElement("div"); stage.className = "cs-stage"; var svg = doc.createElementNS(SVG_NS, "svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "TCP 序号与 ACK 时间线"); stage.appendChild(svg); resultPane.appendChild(stage); var metrics = doc.createElement("div"); metrics.className = "cs-metrics"; resultPane.appendChild(metrics); var tableHost = doc.createElement("div"); resultPane.appendChild(tableHost); shell.appendChild(resultPane); rootNode.replaceChildren(shell);
    function metric(label, value) { return api.el("div", { className: "cs-metric" }, [api.el("span", { text: label }), api.el("strong", { text: value })]); }
    function render() { loss.value = state.loss; windowInput.value = String(state.window); windowOutput.textContent = state.window + " 个序号"; questions.forEach(function (question) { question.buttons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[question.spec.key] === item.choice.value ? "true" : "false"); }); }); feedback.textContent = state.feedback; feedback.className = "cs-feedback" + (state.feedback.indexOf("请先") === 0 ? " cs-warn" : ""); resultPane.hidden = !state.revealed; if (!state.revealed) return; var result = simulate(state); draw(doc, svg, result); clear(metrics); metrics.appendChild(metric("最终 ACK", String(result.finalAck))); metrics.appendChild(metric("按序交付", result.delivered.join(","))); metrics.appendChild(metric("恢复路径", result.recovery)); metrics.appendChild(metric("最终 cwnd", String(result.cwnd))); clear(tableHost); tableHost.appendChild(table(doc, result)); }
    loss.addEventListener("change", function () { state.loss = loss.value; state.revealed = false; state.feedback = ""; render(); }); windowInput.addEventListener("input", function () { state.window = Number(windowInput.value); state.revealed = false; state.feedback = ""; render(); }); reveal.addEventListener("click", function () { if (!questions.every(function (question) { return state.predictions[question.spec.key] !== undefined; })) { state.feedback = "请先完成两个预测；ACK 和重传 trace 会在揭晓后显示。"; render(); return; } var correct = questions.filter(function (question) { return state.predictions[question.spec.key] === question.spec.expected; }).length; state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + questions.length + " 命中。再观察累计 ACK 与交付边界的区别。"; render(); api.announce(rootNode, state.feedback); }); reset.addEventListener("click", function () { state = { window: 6, loss: "early", predictions: {}, revealed: false, feedback: "" }; render(); api.announce(rootNode, "TCP trace 预测已重置。"); }); render();
  }

  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var early = simulate({ window: 6, loss: "early" }); var late = simulate({ window: 6, loss: "late" }); var clean = simulate({ window: 6, loss: "none" }); check(early.finalAck === 9 && early.delivered.join(",") === "0,1,2,3,4,5,6,7,8", "early loss recovers ordered stream"); check(early.recovery === "fast retransmit", "three duplicate ACK fast path"); check(late.recovery === "timeout", "late loss timeout path"); check(clean.recovery === "无丢包" && clean.finalAck === 9, "clean stream"); check(early.cwnd === 3, "AIMD half from six"); check(JSON.stringify(early) === JSON.stringify(simulate({ window: 6, loss: "early" })), "deterministic TCP trace"); return { checks: checks }; }
  return { normalize: normalize, simulate: simulate, mount: mount, selfTest: selfTest };
});
