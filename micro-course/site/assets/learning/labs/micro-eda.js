(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-eda", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-eda self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-eda self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "micro-eda";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "micro-eda-styles";
  var PATHS = [
    { id: "P1", edges: [1.1, 2.0, 1.3], color: "eda-blue" },
    { id: "P2", edges: [1.8, 2.4, 1.2], color: "eda-red" },
    { id: "P3", edges: [2.0, 1.7, 1.5], color: "eda-gold" }
  ];
  var DEFAULTS = { period: 5.5, setup: 0.2, target: "none", repair: 0.6 };
  var STYLE_TEXT = [
    '[data-learning-lab="micro-eda"]{--eda-blue:var(--cl-blue,#315f9d);--eda-red:var(--cl-red,#b64335);--eda-gold:var(--cl-gold,#9b6a12);--eda-green:var(--cl-green,#39734d);display:block;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="micro-eda"] *{box-sizing:border-box}[data-learning-lab="micro-eda"] h3,[data-learning-lab="micro-eda"] h4{margin:0 0 8px;letter-spacing:0}[data-learning-lab="micro-eda"] p{margin:8px 0}',
    '[data-learning-lab="micro-eda"] .eda-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start}[data-learning-lab="micro-eda"] .eda-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="micro-eda"] .eda-control{display:grid;gap:5px}[data-learning-lab="micro-eda"] label{color:var(--fg-soft);font-size:13px;font-weight:700}[data-learning-lab="micro-eda"] output{color:var(--accent);font-variant-numeric:tabular-nums}',
    '[data-learning-lab="micro-eda"] select,[data-learning-lab="micro-eda"] input,[data-learning-lab="micro-eda"] button{font:inherit;letter-spacing:0}[data-learning-lab="micro-eda"] select{width:100%;min-height:44px;padding:7px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}[data-learning-lab="micro-eda"] input[type="range"]{width:100%;min-height:44px;accent-color:var(--accent)}[data-learning-lab="micro-eda"] button{min-height:44px;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer}[data-learning-lab="micro-eda"] button:hover{border-color:var(--accent)}[data-learning-lab="micro-eda"] button:focus-visible,[data-learning-lab="micro-eda"] select:focus-visible,[data-learning-lab="micro-eda"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}',
    '[data-learning-lab="micro-eda"] .eda-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="micro-eda"] svg{display:block;width:100%;height:auto;color:var(--fg,currentColor)}[data-learning-lab="micro-eda"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="micro-eda"] .eda-edge{stroke:var(--border);stroke-width:5;stroke-linecap:round}[data-learning-lab="micro-eda"] .eda-critical{stroke:var(--eda-red);stroke-width:7;stroke-linecap:round}[data-learning-lab="micro-eda"] .eda-node{fill:var(--bg);stroke:currentColor;stroke-width:2}[data-learning-lab="micro-eda"] .eda-good{fill:var(--eda-green)}',
    '[data-learning-lab="micro-eda"] .eda-predict{display:grid;gap:7px;margin:12px 0;padding:11px 12px;border-left:3px solid var(--cl-gold,#9b6a12);background:var(--block-bg,var(--bg))}[data-learning-lab="micro-eda"] .eda-feedback{min-height:1.6em;color:var(--fg-soft);font-size:13px}[data-learning-lab="micro-eda"] .eda-ok{color:var(--eda-green);font-weight:700}[data-learning-lab="micro-eda"] .eda-no{color:var(--eda-red);font-weight:700}[data-learning-lab="micro-eda"] .eda-note{color:var(--fg-soft);font-size:13px;line-height:1.7}',
    '[data-learning-lab="micro-eda"] .eda-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="micro-eda"] .eda-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}[data-learning-lab="micro-eda"] .eda-metric span{display:block;color:var(--fg-soft);font-size:11.5px}[data-learning-lab="micro-eda"] .eda-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="micro-eda"] .eda-table-wrap{max-width:100%;overflow-x:auto}[data-learning-lab="micro-eda"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="micro-eda"] th,[data-learning-lab="micro-eda"] td{padding:7px 6px;border-bottom:1px solid var(--border);text-align:left}[data-learning-lab="micro-eda"] th{color:var(--fg-soft)}',
    '@media(max-width:820px){[data-learning-lab="micro-eda"] .eda-layout{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){[data-learning-lab="micro-eda"] *{transition:none!important;animation:none!important}}'
  ].join("");

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || 1e-9) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function format(value, digits) {
    var places = digits === undefined ? 2 : Number(digits);
    var text = Number(value).toFixed(places);
    return places === 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (key === "text") node.textContent = String(value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key])); });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); }); return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) { if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return; var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style); }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }
  function normalize(input) {
    var source = input || {}; var period = Number(source.period === undefined ? DEFAULTS.period : source.period); var setup = Number(source.setup === undefined ? DEFAULTS.setup : source.setup); var target = source.target === undefined ? DEFAULTS.target : String(source.target); var repair = Number(source.repair === undefined ? DEFAULTS.repair : source.repair);
    if (period < 4 || period > 8 || setup < 0 || setup > 1 || ["none", "P1", "P2", "P3"].indexOf(target) === -1 || repair < 0 || repair > 1.5) throw new RangeError("invalid timing controls");
    return { period: period, setup: setup, target: target, repair: repair };
  }
  function simulate(input) {
    var config = normalize(input);
    var rows = PATHS.map(function (path) {
      var base = path.edges.reduce(function (sum, value) { return sum + value; }, 0);
      var delay = Math.max(0, base - (config.target === path.id ? config.repair : 0));
      return { id: path.id, edges: path.edges.slice(), baseDelay: base, delay: delay, slack: config.period - config.setup - delay };
    });
    var worst = rows.reduce(function (left, right) { return right.delay > left.delay ? right : left; });
    return { config: config, rows: rows, critical: worst.id, maxDelay: worst.delay, worstSlack: worst.slack, passes: worst.slack >= 0 };
  }
  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || document; installStyles(doc); clear(rootNode);
    var title = element(doc, "h3", { text: "EDA timing lab：在 DAG 上修复最坏路径" });
    var note = element(doc, "p", { className: "eda-note", text: "先预测临界路径，再选择一个只作用于该路径的修复。" });
    var predict = element(doc, "div", { className: "eda-predict" }, [
      element(doc, "label", { htmlFor: LAB_ID + "-prediction", text: "默认时序图的临界路径是：" }),
      element(doc, "select", { id: LAB_ID + "-prediction", "aria-label": "临界路径预测" }, [element(doc, "option", { value: "P2", text: "P2" }), element(doc, "option", { value: "P1", text: "P1" }), element(doc, "option", { value: "P3", text: "P3" })]),
      element(doc, "button", { type: "button", text: "检验预测" }),
      element(doc, "div", { className: "eda-feedback", "aria-live": "polite" })
    ]);
    var controls = element(doc, "div", { className: "eda-controls" });
    var periodOutput = element(doc, "output", { for: LAB_ID + "-period", text: "5.5 ns" });
    var period = element(doc, "input", { id: LAB_ID + "-period", type: "range", min: "4", max: "8", step: "0.1", value: "5.5" });
    period.addEventListener("input", function () { periodOutput.textContent = format(Number(period.value), 1) + " ns"; render(); });
    controls.appendChild(element(doc, "div", { className: "eda-control" }, [element(doc, "label", { htmlFor: period.id, text: "时钟周期" }), periodOutput, period]));
    var target = element(doc, "select", { id: LAB_ID + "-target" }, [element(doc, "option", { value: "none", text: "不修复" }), element(doc, "option", { value: "P1", text: "修复 P1（非临界）" }), element(doc, "option", { value: "P2", text: "修复 P2（临界）" }), element(doc, "option", { value: "P3", text: "修复 P3" })]);
    target.value = "none"; target.addEventListener("change", render);
    controls.appendChild(element(doc, "div", { className: "eda-control" }, [element(doc, "label", { htmlFor: target.id, text: "延迟优化对象（减 0.6 ns）" }), target]));
    var stage = element(doc, "div", { className: "eda-stage" }); var result = element(doc, "div");
    rootNode.appendChild(title); rootNode.appendChild(note); rootNode.appendChild(predict); rootNode.appendChild(element(doc, "div", { className: "eda-layout" }, [controls, element(doc, "div", {}, [stage, result])]));
    function renderStage(data) {
      var chart = svgElement(doc, "svg", { viewBox: "0 0 720 280", role: "img", "aria-label": "三条时序路径组成的有向无环图" });
      chart.appendChild(svgElement(doc, "title", {}, "时序 DAG 与临界路径")); chart.appendChild(svgElement(doc, "desc", {}, "P2 默认延迟最大并以红色高亮；每条路径连接 launch、组合逻辑节点和 capture。"));
      ["launch", "logic 1", "logic 2", "capture"].forEach(function (label, index) { var x = 72 + index * 190; chart.appendChild(svgElement(doc, "circle", { cx: x, cy: 138, r: 25, class: "eda-node" })); chart.appendChild(svgElement(doc, "text", { x: x, y: 142, "text-anchor": "middle", "font-size": 11 }, label)); });
      data.rows.forEach(function (row, rowIndex) {
        var y = 55 + rowIndex * 82; var points = [72, 262, 452, 642];
        for (var i = 0; i < 3; i += 1) { chart.appendChild(svgElement(doc, "line", { x1: points[i], y1: y, x2: points[i + 1], y2: y, class: row.id === data.critical ? "eda-critical" : "eda-edge" })); chart.appendChild(svgElement(doc, "text", { x: (points[i] + points[i + 1]) / 2, y: y - 8, "text-anchor": "middle", "font-size": 11 }, format(Math.max(0, row.edges[i] - (row.id === data.config.target ? data.config.repair / 3 : 0)), 1) + " ns")); }
        chart.appendChild(svgElement(doc, "text", { x: 12, y: y + 4, "font-size": 12 }, row.id + (row.id === data.critical ? " critical" : "")));
      });
      chart.appendChild(svgElement(doc, "text", { x: 12, y: 265, "font-size": 11 }, "红线 = 当前最大 arrival 的路径；修复只改变选中路径的总延迟")); stage.replaceChildren(chart);
    }
    function render() {
      var data = simulate({ period: Number(period.value), setup: DEFAULTS.setup, target: target.value, repair: DEFAULTS.repair }); renderStage(data);
      result.replaceChildren(element(doc, "div", { className: "eda-metrics" }, [element(doc, "div", { className: "eda-metric" }, [element(doc, "span", { text: "最坏路径" }), element(doc, "strong", { text: data.critical })]), element(doc, "div", { className: "eda-metric" }, [element(doc, "span", { text: "最大 delay" }), element(doc, "strong", { text: format(data.maxDelay, 2) + " ns" })]), element(doc, "div", { className: "eda-metric" }, [element(doc, "span", { text: "最坏 slack" }), element(doc, "strong", { className: data.passes ? "eda-ok" : "eda-no", text: format(data.worstSlack, 2) + " ns" })])]),
        element(doc, "div", { className: "eda-table-wrap" }, [element(doc, "table", {}, [element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { scope: "col", text: "路径" }), element(doc, "th", { scope: "col", text: "总延迟" }), element(doc, "th", { scope: "col", text: "slack" })])]), element(doc, "tbody", {}, data.rows.map(function (row) { return element(doc, "tr", {}, [element(doc, "td", { text: row.id }), element(doc, "td", { text: format(row.delay, 2) + " ns" }), element(doc, "td", { text: format(row.slack, 2) + " ns" })]); }))])])
      );
    }
    predict.querySelector("button").addEventListener("click", function () { var answer = predict.querySelector("select").value; var data = simulate(DEFAULTS); var feedback = predict.querySelector(".eda-feedback"); var ok = answer === data.critical; feedback.className = "eda-feedback " + (ok ? "eda-ok" : "eda-no"); feedback.textContent = ok ? "正确：P2 的 5.4 ns 是默认图的最长路径。" : "再沿三条边相加：P1=4.4 ns，P2=5.4 ns，P3=5.2 ns。"; announce(api, rootNode, feedback.textContent); });
    render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var base = simulate({ period: 5.5, setup: 0.2, target: "none", repair: 0.6 });
    check(base.critical === "P2", "critical path is P2"); check(near(base.maxDelay, 5.4), "longest delay"); check(near(base.worstSlack, -0.1), "default slack");
    var wrong = simulate({ period: 5.5, setup: 0.2, target: "P1", repair: 0.6 }); check(near(wrong.worstSlack, -0.1), "noncritical repair does not close timing");
    var fixed = simulate({ period: 5.5, setup: 0.2, target: "P2", repair: 0.6 }); check(fixed.critical === "P3", "critical path can move after repair"); check(near(fixed.worstSlack, 0.1), "critical repair slack");
    var relaxed = simulate({ period: 6.0, setup: 0.2, target: "none", repair: 0.6 }); check(near(relaxed.worstSlack, 0.4), "clock period changes slack");
    check(PATHS.every(function (path) { return path.edges.length === 3; }), "three-edge DAG paths");
    return { checks: checks };
  }
  return { simulate: simulate, mount: mount, selfTest: selfTest, PATHS: PATHS };
});
