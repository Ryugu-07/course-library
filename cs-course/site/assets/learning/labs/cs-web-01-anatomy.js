(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("cs-web-01-anatomy", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log("cs-web-01-anatomy self-test: PASS (" + report.checks + " checks)"); }
    catch (error) { console.error("cs-web-01-anatomy self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-web-01-anatomy";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var PRESETS = {
    asset: { label: "JS bundle · edge 命中", kind: "静态资源", cache: "warm", stages: [["DNS", 20], ["TLS", 50], ["edge cache", 35], ["render", 18]], db: false, origin: false },
    apiWarm: { label: "API · edge 命中", kind: "动态 API", cache: "warm", stages: [["DNS", 20], ["TLS", 50], ["edge cache", 28], ["render", 18]], db: false, origin: false },
    apiCold: { label: "API · cache miss", kind: "动态 API", cache: "cold", stages: [["DNS", 20], ["TLS", 50], ["edge", 12], ["tunnel", 20], ["FastAPI", 24], ["Postgres", 120], ["response", 36], ["render", 18]], db: true, origin: true },
    offline: { label: "schtasks · 离线生产", kind: "离线写入", cache: "n/a", stages: [["scheduler", 10], ["fetch", 45], ["analyze", 90], ["DB write", 160]], db: true, origin: true }
  };

  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function analyze(preset) {
    var key = PRESETS[preset] ? preset : "apiCold";
    var source = PRESETS[key];
    var total = source.stages.reduce(function (sum, stage) { return sum + stage[1]; }, 0);
    var critical = source.stages.reduce(function (best, stage) { return stage[1] > best[1] ? stage : best; }, source.stages[0]);
    return { key: key, label: source.label, kind: source.kind, cache: source.cache, stages: source.stages.map(function (stage) { return { name: stage[0], ms: stage[1] }; }), totalMs: total, critical: critical[0], criticalMs: critical[1], db: source.db, origin: source.origin };
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else if (key === "className") node.className = attrs[key];
      else if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
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
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cwa-blue:#315f9d;--cwa-green:#39734d;--cwa-gold:#a36a16;--cwa-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0;font-size:1.16rem}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}[data-learning-lab="' + NAME + '"] button{flex:1 1 150px}[data-learning-lab="' + NAME + '"] button[aria-pressed=true],[data-learning-lab="' + NAME + '"] .cwa-primary{background:var(--cwa-blue);border-color:var(--cwa-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .cwa-choices,[data-learning-lab="' + NAME + '"] .cwa-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cwa-feedback,[data-learning-lab="' + NAME + '"] .cwa-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .cwa-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}[data-learning-lab="' + NAME + '"] .cwa-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .cwa-control label{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] .cwa-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .cwa-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .cwa-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cwa-metric{min-width:0;padding:8px;border-top:2px solid var(--cwa-blue);background:var(--block-bg,transparent)}[data-learning-lab="' + NAME + '"] .cwa-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .cwa-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .cwa-table{max-width:100%;overflow-x:auto}[data-learning-lab="' + NAME + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;white-space:nowrap}' +
      '@media(max-width:620px){[data-learning-lab="' + NAME + '"] .cwa-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .cwa-metrics{grid-template-columns:repeat(2,minmax(0,1fr)}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .cwa-choices,[data-learning-lab="' + NAME + '"] .cwa-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important}}';
    doc.head.appendChild(style);
  }

  function draw(doc, svg, result) {
    clear(svg);
    var width = 740;
    var left = 112;
    var scale = 1.8;
    var height = 58 + result.stages.length * 30;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.appendChild(svgElement(doc, "title", {}, "请求路径时间账本"));
    svg.appendChild(svgElement(doc, "desc", {}, "每一行显示一个阶段的固定耗时；Postgres 和 DB write 只有在对应路径中出现。"));
    svg.appendChild(svgElement(doc, "text", { x: left, y: 18, "font-size": 12 }, result.label + " · 总计 " + result.totalMs + " ms"));
    for (var tick = 0; tick <= Math.ceil(result.totalMs / 100) * 100; tick += 100) {
      var x = left + tick * scale;
      svg.appendChild(svgElement(doc, "line", { x1: x, x2: x, y1: 28, y2: height - 12, stroke: "currentColor", "stroke-opacity": ".14" }));
      svg.appendChild(svgElement(doc, "text", { x: x + 2, y: 27, "font-size": 10 }, tick + "ms"));
    }
    result.stages.forEach(function (stage, index) {
      var y = 37 + index * 30;
      var fill = stage.name === result.critical ? "var(--cwa-red)" : stage.name === "Postgres" || stage.name === "DB write" ? "var(--cwa-gold)" : "var(--cwa-blue)";
      svg.appendChild(svgElement(doc, "text", { x: 8, y: y + 15, "font-size": 11 }, stage.name));
      svg.appendChild(svgElement(doc, "rect", { x: left, y: y, width: Math.max(5, stage.ms * scale), height: 20, rx: 3, fill: fill, "fill-opacity": ".84" }));
      svg.appendChild(svgElement(doc, "text", { x: left + stage.ms * scale / 2, y: y + 14, "text-anchor": "middle", "font-size": 10, fill: "#fff" }, stage.ms + " ms"));
    });
  }

  function table(doc, result) {
    var wrap = element(doc, "div", { className: "cwa-table" });
    var tbl = element(doc, "table", { "aria-label": "请求阶段账本" });
    tbl.appendChild(element(doc, "caption", { text: "阶段证据账本" }));
    tbl.appendChild(element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "阶段" }), element(doc, "th", { text: "耗时" }), element(doc, "th", { text: "解释" })])]));
    var body = element(doc, "tbody");
    result.stages.forEach(function (stage) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: stage.name }), element(doc, "td", { text: stage.ms + " ms" }), element(doc, "td", { text: stage.name === result.critical ? "当前路径的最大阶段" : "路径中的固定账本项" })])); });
    tbl.appendChild(body); wrap.appendChild(tbl); return wrap;
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { preset: "apiCold", predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "请求路径账本：命中、回源与离线写入" }));
    shell.appendChild(element(doc, "p", { className: "cwa-note", text: "固定阶段耗时；先预测是否回源和是否触达 Postgres，再展开 trace。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset", {});
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { db: null, origin: null };
    var groups = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cwa-choices", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () { answers[key] = choice[0]; groups.forEach(function (item) { item.node.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); }); });
        groups.push({ key: key, value: choice[0], node: button }); row.appendChild(button);
      });
      fieldset.appendChild(row);
    }
    question("db", "API 冷缓存是否触达 Postgres？", [["yes", "会"], ["no", "不会"]]);
    question("origin", "JS 边缘命中是否回到 FastAPI？", [["yes", "会回源"], ["no", "不会"]]);
    form.appendChild(fieldset);
    var actions = element(doc, "div", { className: "cwa-actions" });
    var reveal = element(doc, "button", { type: "submit", className: "cwa-primary", text: "提交预测并展开" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal); actions.appendChild(reset); form.appendChild(actions);
    var feedback = element(doc, "p", { className: "cwa-feedback", role: "status", "aria-live": "polite" }); form.appendChild(feedback); shell.appendChild(form);
    var controls = element(doc, "div", { className: "cwa-controls" });
    var preset = element(doc, "select", { "aria-label": "请求轨迹" });
    Object.keys(PRESETS).forEach(function (key) { preset.appendChild(element(doc, "option", { value: key, text: PRESETS[key].label })); });
    controls.appendChild(element(doc, "label", { className: "cwa-control" }, [element(doc, "span", { text: "固定轨迹" }), preset])); shell.appendChild(controls);
    var revealed = element(doc, "section", { className: "cwa-revealed", hidden: "hidden" });
    var stage = element(doc, "div", { className: "cwa-stage" });
    var svg = doc.createElementNS(SVG_NS, "svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "请求阶段时间线"); stage.appendChild(svg); revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "cwa-metrics" }); revealed.appendChild(metrics);
    var tableHost = element(doc, "div"); revealed.appendChild(tableHost);
    revealed.appendChild(element(doc, "p", { className: "cwa-note", text: "边界提醒：toy trace 只展示路径归属，不模拟真实 CDN TTL、连接复用或浏览器调度。" })); shell.appendChild(revealed);
    rootNode.replaceChildren(shell);
    function metric(label, value) { return element(doc, "div", { className: "cwa-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
    function render() {
      var result = analyze(state.preset);
      preset.value = state.preset;
      groups.forEach(function (item) { item.node.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); });
      feedback.textContent = state.feedback;
      revealed.hidden = !state.revealed;
      if (!state.revealed) return;
      draw(doc, svg, result); clear(metrics);
      metrics.appendChild(metric("路径", result.kind)); metrics.appendChild(metric("总耗时", result.totalMs + " ms")); metrics.appendChild(metric("最大阶段", result.critical)); metrics.appendChild(metric("Postgres", result.db ? "触达" : "跳过"));
      clear(tableHost); tableHost.appendChild(table(doc, result));
    }
    preset.addEventListener("change", function () { state.preset = preset.value; state.revealed = false; state.feedback = ""; render(); });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (answers.db === null || answers.origin === null) { state.feedback = "请先完成两项路径预测。"; render(); return; }
      var score = (answers.db === "yes" ? 1 : 0) + (answers.origin === "no" ? 1 : 0);
      state.revealed = true; state.feedback = "已揭晓：" + score + " / 2 命中；现在沿阶段账本找证据。"; render(); api.announce(rootNode, state.feedback);
    });
    reset.addEventListener("click", function () { state = { preset: "apiCold", predictions: {}, revealed: false, feedback: "" }; answers = { db: null, origin: null }; render(); api.announce(rootNode, "请求路径预测已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var cold = analyze("apiCold");
    check(cold.db && cold.origin, "cold API reaches origin and database");
    check(cold.critical === "Postgres" && cold.totalMs === 300, "cold path bottleneck and total");
    check(!analyze("asset").db && !analyze("asset").origin, "edge asset hit skips origin");
    check(analyze("offline").kind === "离线写入", "offline path is distinct");
    check(JSON.stringify(analyze("apiCold")) === JSON.stringify(analyze("apiCold")), "deterministic trace");
    check(clamp(9, 0, 5) === 5 && clamp(-1, 0, 5) === 0, "bounded control helper");
    return { checks: checks };
  }

  return { analyze: analyze, mount: mount, selfTest: selfTest };
});
