(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("cs-web-02-backend", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log("cs-web-02-backend self-test: PASS (" + report.checks + " checks)"); }
    catch (error) { console.error("cs-web-02-backend self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-web-02-backend";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var TASKS = [
    { id: "db-1", kind: "I/O", duration: 4 },
    { id: "llm", kind: "I/O", duration: 6 },
    { id: "embed", kind: "CPU", duration: 7 },
    { id: "db-2", kind: "I/O", duration: 3 },
    { id: "health", kind: "I/O", duration: 1 }
  ];

  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }
  function simulate(mode, queueLimit) {
    var selectedMode = mode === "thread" ? "thread" : "async";
    var limit = Math.max(1, Math.min(TASKS.length, Number(queueLimit) || TASKS.length));
    var accepted = TASKS.slice(0, limit);
    var rejected = TASKS.length - accepted.length;
    var ioMax = accepted.reduce(function (max, task) { return task.kind === "I/O" ? Math.max(max, task.duration) : max; }, 0);
    var cpuTotal = accepted.reduce(function (sum, task) { return task.kind === "CPU" ? sum + task.duration : sum; }, 0);
    var total = selectedMode === "async" ? Math.max(ioMax, cpuTotal) : Math.ceil(accepted.reduce(function (sum, task) { return sum + task.duration; }, 0) / 2);
    var rows = [];
    var cursor = 0;
    accepted.forEach(function (task, index) {
      var start = selectedMode === "async" ? 0 : Math.floor(index / 2) * 2;
      rows.push({ id: task.id, kind: task.kind, start: start, finish: start + task.duration, blocked: selectedMode === "async" && task.kind === "I/O" && cpuTotal > 0 });
      cursor = Math.max(cursor, start + task.duration);
    });
    return { mode: selectedMode, queueLimit: limit, accepted: accepted.length, rejected: rejected, total: total, ioMax: ioMax, cpuTotal: cpuTotal, rows: rows, backpressure: rejected > 0 ? "有界队列拒绝" : "尚未触顶" };
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { if (key === "text") node.textContent = attrs[key]; else if (key === "className") node.className = attrs[key]; else if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key])); });
    (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key])); });
    (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles"; if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style"); style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cwb-blue:#315f9d;--cwb-green:#39734d;--cwb-gold:#a36a16;--cwb-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0;font-size:1.16rem}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}[data-learning-lab="' + NAME + '"] button{flex:1 1 150px}[data-learning-lab="' + NAME + '"] button[aria-pressed=true],[data-learning-lab="' + NAME + '"] .cwb-primary{background:var(--cwb-blue);border-color:var(--cwb-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .cwb-choices,[data-learning-lab="' + NAME + '"] .cwb-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cwb-feedback,[data-learning-lab="' + NAME + '"] .cwb-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .cwb-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-top:15px}[data-learning-lab="' + NAME + '"] .cwb-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .cwb-control label{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cwb-blue)}' +
      '[data-learning-lab="' + NAME + '"] .cwb-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .cwb-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .cwb-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cwb-metric{min-width:0;padding:8px;border-top:2px solid var(--cwb-blue)}[data-learning-lab="' + NAME + '"] .cwb-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .cwb-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .cwb-table{max-width:100%;overflow-x:auto}[data-learning-lab="' + NAME + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;white-space:nowrap}' +
      '@media(max-width:620px){[data-learning-lab="' + NAME + '"] .cwb-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .cwb-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .cwb-choices,[data-learning-lab="' + NAME + '"] .cwb-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important}}';
    doc.head.appendChild(style);
  }
  function draw(doc, svg, result) {
    clear(svg); var width = 720; var left = 92; var scale = 42; var height = 48 + Math.max(1, result.rows.length) * 34;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height); svg.appendChild(svgElement(doc, "title", {}, "事件循环任务时间线")); svg.appendChild(svgElement(doc, "desc", {}, "I/O 任务可以等待并交错；CPU 任务在 async worker 中占住事件循环。"));
    svg.appendChild(svgElement(doc, "text", { x: left, y: 18, "font-size": 12 }, result.mode === "async" ? "async worker · I/O 可等待，CPU 段占住 loop" : "2-thread pool · 固定两个执行槽"));
    for (var tick = 0; tick <= 14; tick += 2) { var x = left + tick * scale; svg.appendChild(svgElement(doc, "line", { x1: x, x2: x, y1: 27, y2: height - 10, stroke: "currentColor", "stroke-opacity": ".14" })); svg.appendChild(svgElement(doc, "text", { x: x + 2, y: 26, "font-size": 10 }, tick + " ms")); }
    result.rows.forEach(function (row, index) { var y = 35 + index * 34; var fill = row.kind === "CPU" ? "var(--cwb-red)" : "var(--cwb-green)"; svg.appendChild(svgElement(doc, "text", { x: 8, y: y + 15, "font-size": 11 }, row.id + " · " + row.kind)); svg.appendChild(svgElement(doc, "rect", { x: left + row.start * scale, y: y, width: Math.max(5, row.finish - row.start) * scale - 2, height: 22, rx: 3, fill: fill, "fill-opacity": ".84" })); svg.appendChild(svgElement(doc, "text", { x: left + (row.start + row.finish) * scale / 2, y: y + 15, "text-anchor": "middle", "font-size": 10, fill: "#fff" }, row.blocked ? "等待回调" : "运行")); });
  }
  function table(doc, result) {
    var wrap = element(doc, "div", { className: "cwb-table" }); var tbl = element(doc, "table", { "aria-label": "事件循环任务账本" }); tbl.appendChild(element(doc, "caption", { text: "任务与背压账本" }));
    tbl.appendChild(element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "任务" }), element(doc, "th", { text: "类型" }), element(doc, "th", { text: "开始/结束" }), element(doc, "th", { text: "状态" })])]));
    var body = element(doc, "tbody"); result.rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row.id }), element(doc, "td", { text: row.kind }), element(doc, "td", { text: row.start + " / " + row.finish + " ms" }), element(doc, "td", { text: row.blocked ? "I/O 回调被 CPU 延后" : "已接收" })])); });
    if (result.rejected) body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: "入口" }), element(doc, "td", { text: "backpressure" }), element(doc, "td", { text: result.rejected + " 个" }), element(doc, "td", { text: "容量不足，拒绝/限流" })]));
    tbl.appendChild(body); wrap.appendChild(tbl); return wrap;
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return; var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { mode: "async", queueLimit: 4, predictions: {}, revealed: false, feedback: "" }; var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "事件循环与背压：等待不是无限容量" })); shell.appendChild(element(doc, "p", { className: "cwb-note", text: "固定五个任务；先预测 await 与 CPU 的边界，再改变 worker 模型和队列上限。" }));
    var form = element(doc, "form", {}); var fieldset = element(doc, "fieldset", {}); fieldset.appendChild(element(doc, "legend", { text: "预测门" })); var answers = { yield: null, overload: null }; var groups = [];
    function question(key, prompt, choices) { fieldset.appendChild(element(doc, "p", { text: prompt })); var row = element(doc, "div", { className: "cwb-choices", role: "group", "aria-label": prompt }); choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] }); button.addEventListener("click", function () { answers[key] = choice[0]; groups.forEach(function (item) { item.node.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); }); }); groups.push({ key: key, value: choice[0], node: button }); row.appendChild(button); }); fieldset.appendChild(row); }
    question("yield", "数据库 await 进行中，事件循环能否处理别的 I/O？", [["yes", "能交错推进"], ["no", "会一直阻塞"]]); question("overload", "队列达到上限时，入口应怎样保护尾延迟？", [["reject", "拒绝/限流"], ["queue", "无限排队"]]); form.appendChild(fieldset);
    var actions = element(doc, "div", { className: "cwb-actions" }); actions.appendChild(element(doc, "button", { type: "submit", className: "cwb-primary", text: "提交预测并展开" })); actions.appendChild(element(doc, "button", { type: "button", text: "重置", "data-reset": "true" })); form.appendChild(actions); var feedback = element(doc, "p", { className: "cwb-feedback", role: "status", "aria-live": "polite" }); form.appendChild(feedback); shell.appendChild(form);
    var controls = element(doc, "div", { className: "cwb-controls" }); var mode = element(doc, "select", { "aria-label": "后端执行模型" }); mode.appendChild(element(doc, "option", { value: "async", text: "async worker" })); mode.appendChild(element(doc, "option", { value: "thread", text: "2-thread pool" })); var queue = element(doc, "input", { type: "range", min: "1", max: "5", step: "1", value: "4", "aria-label": "入口队列容量" }); var queueOutput = element(doc, "output", { text: "4" }); controls.appendChild(element(doc, "label", { className: "cwb-control" }, [element(doc, "span", { text: "执行模型" }), mode])); controls.appendChild(element(doc, "label", { className: "cwb-control" }, [element(doc, "span", {}, ["队列容量 Q = ", queueOutput]), queue])); shell.appendChild(controls);
    var revealed = element(doc, "section", { className: "cwb-revealed", hidden: "hidden" }); var stage = element(doc, "div", { className: "cwb-stage" }); var svg = doc.createElementNS(SVG_NS, "svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "后端任务时间线"); stage.appendChild(svg); revealed.appendChild(stage); var metrics = element(doc, "div", { className: "cwb-metrics" }); revealed.appendChild(metrics); var tableHost = element(doc, "div"); revealed.appendChild(tableHost); revealed.appendChild(element(doc, "p", { className: "cwb-note", text: "边界提醒：这是固定事件模型；真实服务还要测连接池、取消、重试和 p99，而 async 不会并行同步 CPU。" })); shell.appendChild(revealed); rootNode.replaceChildren(shell);
    function metric(label, value) { return element(doc, "div", { className: "cwb-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
    function render() { var result = simulate(state.mode, state.queueLimit); mode.value = state.mode; queue.value = String(state.queueLimit); queueOutput.textContent = String(state.queueLimit); groups.forEach(function (item) { item.node.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); }); feedback.textContent = state.feedback; revealed.hidden = !state.revealed; if (!state.revealed) return; draw(doc, svg, result); clear(metrics); metrics.appendChild(metric("执行模型", result.mode)); metrics.appendChild(metric("完成账本", result.total + " ms")); metrics.appendChild(metric("已接收", String(result.accepted))); metrics.appendChild(metric("拒绝", String(result.rejected))); clear(tableHost); tableHost.appendChild(table(doc, result)); }
    mode.addEventListener("change", function () { state.mode = mode.value; state.revealed = false; state.feedback = ""; render(); }); queue.addEventListener("input", function () { state.queueLimit = Number(queue.value); state.revealed = false; state.feedback = ""; render(); });
    form.addEventListener("submit", function (event) { event.preventDefault(); if (answers.yield === null || answers.overload === null) { state.feedback = "请先完成两项并发预测。"; render(); return; } var score = (answers.yield === "yes" ? 1 : 0) + (answers.overload === "reject" ? 1 : 0); state.revealed = true; state.feedback = "已揭晓：" + score + " / 2 命中；查看 CPU 段与拒绝数。"; render(); api.announce(rootNode, state.feedback); });
    form.querySelector("[data-reset]").addEventListener("click", function () { state = { mode: "async", queueLimit: 4, predictions: {}, revealed: false, feedback: "" }; answers = { yield: null, overload: null }; render(); api.announce(rootNode, "事件循环预测已重置。"); }); render();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var asyncResult = simulate("async", 4); var threadResult = simulate("thread", 5); check(asyncResult.accepted === 4 && asyncResult.rejected === 1, "bounded queue rejects fifth task"); check(asyncResult.total === 7, "async overlap with CPU bound"); check(threadResult.accepted === 5 && threadResult.total === 11, "two thread deterministic work estimate"); check(asyncResult.rows[3].blocked, "CPU blocks later I/O callback"); check(JSON.stringify(simulate("async", 4)) === JSON.stringify(simulate("async", 4)), "deterministic scheduler"); return { checks: checks }; }
  return { simulate: simulate, mount: mount, selfTest: selfTest };
});
