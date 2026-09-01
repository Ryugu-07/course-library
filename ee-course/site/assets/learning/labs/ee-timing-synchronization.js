(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-timing-synchronization", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-timing-synchronization self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-timing-synchronization self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "ee-timing-synchronization";
  var STYLE_ID = "ee-timing-synchronization-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = {
    periodNs: 100,
    clockToQMaxNs: 8,
    clockToQMinNs: 4,
    logicMaxNs: 25,
    logicMinNs: 5,
    setupNs: 10,
    holdNs: 4,
    skewNs: 2,
    jitterNs: 1,
    synchronizerRoutingNs: 0,
    synchronizerStages: 2,
    metastabilityTauNs: 0.2,
    asyncRateHz: 100
  };
  var QUESTIONS = [
    { key: "skew", prompt: "捕获时钟相对发射时钟变晚（正 skew）时，setup 与 hold 的影响更接近什么？", expected: "opposite", choices: [["opposite", "setup 余量变好、hold 余量变差"], ["same", "两者都变好"], ["none", "两者都不变"]] },
    { key: "sync", prompt: "增加同步器级数对亚稳态风险的描述，哪一个不越过模型边界？", expected: "probability", choices: [["absolute", "从此绝对安全"], ["probability", "在模型中降低概率，但不等于零风险"], ["none", "完全没有作用"]] },
    { key: "window", prompt: "setup 与 hold 要求共同定义的时间区域是什么？", expected: "aperture", choices: [["aperture", "采样危险/敏感窗口"], ["power", "电源纹波窗口"], ["ground", "接地电阻"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) { if (!isFinite(value)) return "-"; var places = digits === undefined ? 2 : digits; if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4)); return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function formatControl(key, value) {
    if (key === "periodNs" || key === "clockToQMaxNs" || key === "clockToQMinNs" || key === "logicMaxNs" || key === "logicMinNs" || key === "setupNs" || key === "holdNs" || key === "skewNs" || key === "jitterNs" || key === "synchronizerRoutingNs") return format(value, 1) + " ns";
    if (key === "synchronizerStages") return format(value, 0) + " 级";
    return format(value, 2);
  }
  function normalize(input) {
    var source = input || {};
    return {
      periodNs: clamp(finite(source.periodNs === undefined ? DEFAULTS.periodNs : source.periodNs, "clock period"), 10, 1000),
      clockToQMaxNs: clamp(finite(source.clockToQMaxNs === undefined ? DEFAULTS.clockToQMaxNs : source.clockToQMaxNs, "clock to Q max"), 0.5, 100),
      clockToQMinNs: clamp(finite(source.clockToQMinNs === undefined ? DEFAULTS.clockToQMinNs : source.clockToQMinNs, "clock to Q min"), 0.1, 50),
      logicMaxNs: clamp(finite(source.logicMaxNs === undefined ? DEFAULTS.logicMaxNs : source.logicMaxNs, "logic max"), 0, 300),
      logicMinNs: clamp(finite(source.logicMinNs === undefined ? DEFAULTS.logicMinNs : source.logicMinNs, "logic min"), 0, 100),
      setupNs: clamp(finite(source.setupNs === undefined ? DEFAULTS.setupNs : source.setupNs, "setup"), 0.1, 100),
      holdNs: clamp(finite(source.holdNs === undefined ? DEFAULTS.holdNs : source.holdNs, "hold"), 0.1, 100),
      skewNs: clamp(finite(source.skewNs === undefined ? DEFAULTS.skewNs : source.skewNs, "skew"), -50, 50),
      jitterNs: clamp(finite(source.jitterNs === undefined ? DEFAULTS.jitterNs : source.jitterNs, "jitter"), 0, 50),
      synchronizerRoutingNs: clamp(finite(source.synchronizerRoutingNs === undefined ? DEFAULTS.synchronizerRoutingNs : source.synchronizerRoutingNs, "synchronizer routing"), 0, 50),
      synchronizerStages: Math.round(clamp(finite(source.synchronizerStages === undefined ? DEFAULTS.synchronizerStages : source.synchronizerStages, "synchronizer stages"), 1, 4)),
      metastabilityTauNs: clamp(finite(source.metastabilityTauNs === undefined ? DEFAULTS.metastabilityTauNs : source.metastabilityTauNs, "metastability time constant"), 0.01, 5),
      asyncRateHz: clamp(finite(source.asyncRateHz === undefined ? DEFAULTS.asyncRateHz : source.asyncRateHz, "asynchronous event rate"), 0.01, 1e6)
    };
  }
  function computeTimingSynchronization(input) {
    var state = normalize(input);
    var setupSlack = state.periodNs + state.skewNs - state.jitterNs - state.clockToQMaxNs - state.logicMaxNs - state.setupNs;
    var holdSlack = state.clockToQMinNs + state.logicMinNs - state.skewNs - state.jitterNs - state.holdNs;
    var requiredPeriod = state.clockToQMaxNs + state.logicMaxNs + state.setupNs + state.jitterNs - state.skewNs;
    var aperture = state.setupNs + state.holdNs + state.jitterNs;
    var windowFraction = clamp(aperture / state.periodNs, 0, 1);
    var phaseEventRate = state.asyncRateHz * windowFraction;
    var resolvePerStage = Math.max(0, state.periodNs + state.skewNs - state.jitterNs - state.clockToQMaxNs - state.synchronizerRoutingNs - state.setupNs);
    var interstageWindowCount = Math.max(0, state.synchronizerStages - 1), resolutionWindows = [];
    for (var stageIndex = 0; stageIndex < interstageWindowCount; stageIndex += 1) {
      resolutionWindows.push({ fromStage: stageIndex + 1, toStage: stageIndex + 2, windowNs: resolvePerStage });
    }
    var resolveTime = resolvePerStage * interstageWindowCount;
    var log10RiskProxy = Math.log(Math.max(windowFraction, 1e-300)) / Math.LN10 - resolveTime / state.metastabilityTauNs / Math.LN10;
    var riskProxy = Math.exp(Math.max(-745, log10RiskProxy * Math.LN10));
    return {
      config: state,
      setupSlackNs: setupSlack,
      holdSlackNs: holdSlack,
      requiredPeriodNs: requiredPeriod,
      setupFiniteLimit: requiredPeriod > 0,
      setupLimitStatus: requiredPeriod > 0 ? "setup 构成有限周期上限" : "requiredPeriod≤0：setup 不构成有限周期上限；hold 独立报告",
      maxClockMHz: requiredPeriod > 0 ? 1000 / requiredPeriod : null,
      apertureNs: aperture,
      windowFraction: windowFraction,
      phaseEventRateHz: phaseEventRate,
      resolvePerStageNs: resolvePerStage,
      resolutionWindowNs: resolvePerStage,
      resolutionWindowsNs: resolutionWindows,
      interstageWindowCount: interstageWindowCount,
      resolveTimeNs: resolveTime,
      log10RiskProxy: log10RiskProxy,
      riskProxy: riskProxy,
      setupPass: setupSlack >= 0,
      holdPass: holdSlack >= 0,
      timingPass: setupSlack >= 0 && holdSlack >= 0
    };
  }
  function element(doc, tag, attrs, children) { var node = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (key === "text") node.textContent = String(value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); }); (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function svgElement(doc, tag, attrs, children) { var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; node.setAttribute(key, String(value)); }); (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function svgText(doc, parent, value, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, value)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--eec-blue:#2b669e;--eec-red:#b7473b;--eec-green:#39734d;--eec-gold:#9a6a10;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .eec-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--eec-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .eec-primary{border-color:var(--eec-blue);background:var(--eec-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .eec-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .eec-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .eec-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eec-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .eec-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .eec-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--eec-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--eec-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .eec-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .eec-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .eec-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .eec-metric{min-width:0;padding:9px;border-top:2px solid var(--eec-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .eec-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eec-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .eec-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .eec-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .eec-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .eec-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eec-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .eec-choice-grid,[data-learning-lab="' + LAB_ID + '"] .eec-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .eec-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-eec-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 780 390"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "建立保持时间、时钟偏斜抖动和同步器亚稳态概率示意");
    node.appendChild(svgElement(doc, "title", {}, "时序窗与同步器风险")); node.appendChild(svgElement(doc, "desc", {}, "左侧画出发射与捕获时钟、数据到达以及 setup/hold 敏感窗口；右侧画出异步输入进入多级同步器，亚稳态风险以概率代理表示而非绝对安全。"));
    var blue = "var(--eec-blue)", red = "var(--eec-red)", green = "var(--eec-green)", gold = "var(--eec-gold)";
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 24, width: 468, height: 224, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "数据路径与 setup / hold 窗口", 30, 46, { "font-size": 13, "font-weight": 700 });
    var launchX = 75, captureX = 405, top = 68, bottom = 214;
    node.appendChild(svgElement(doc, "line", { x1: launchX, y1: top, x2: launchX, y2: bottom, stroke: green, "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: captureX, y1: top, x2: captureX, y2: bottom, stroke: blue, "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "path", { d: "M40 98 L62 98 L62 75 L88 75 L88 98 L145 98 L145 75 L171 75 L171 98 L228 98 L228 75 L254 75 L254 98 L311 98 L311 75 L337 75 L337 98 L394 98 L394 75 L420 75 L420 98 L455 98", fill: "none", stroke: green, "stroke-width": 3 }));
    svgText(doc, node, "CLK发射", 75, 63, { "font-size": 10, "text-anchor": "middle", fill: green }); svgText(doc, node, "CLK捕获", 405, 63, { "font-size": 10, "text-anchor": "middle", fill: blue });
    node.appendChild(svgElement(doc, "path", { d: "M75 168 L118 168 L118 145 L195 145 L195 125 L357 125 L357 102 L405 102", fill: "none", stroke: red, "stroke-width": 3 })); svgText(doc, node, "数据到达", 205, 119, { "font-size": 10, fill: red });
    var setupStart = captureX - result.config.setupNs * 2.5, holdEnd = captureX + (result.config.holdNs + result.config.jitterNs) * 2.5;
    node.appendChild(svgElement(doc, "rect", { x: setupStart, y: 178, width: captureX - setupStart, height: 25, fill: gold, "fill-opacity": ".22", stroke: gold, "stroke-dasharray": "4 3" })); node.appendChild(svgElement(doc, "rect", { x: captureX, y: 178, width: Math.max(18, holdEnd - captureX), height: 25, fill: red, "fill-opacity": ".18", stroke: red, "stroke-dasharray": "4 3" }));
    svgText(doc, node, "setup " + format(result.config.setupNs, 1) + " ns", setupStart + 4, 194, { "font-size": 10, fill: gold }); svgText(doc, node, "hold " + format(result.config.holdNs, 1) + " ns", captureX + 4, 194, { "font-size": 10, fill: red }); svgText(doc, node, "skew=" + format(result.config.skewNs, 1) + " ns，jitter=" + format(result.config.jitterNs, 1) + " ns", 30, 231, { "font-size": 10 });
    node.appendChild(svgElement(doc, "rect", { x: 502, y: 24, width: 262, height: 224, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "异步输入 → 同步器", 518, 46, { "font-size": 13, "font-weight": 700 });
    svgText(doc, node, "async", 516, 91, { "font-size": 10, fill: red }); node.appendChild(svgElement(doc, "path", { d: "M548 86 L565 86 L565 66 L577 66 L577 101 L590 101", fill: "none", stroke: red, "stroke-width": 2 }));
    var stages = result.config.synchronizerStages; for (var i = 0; i < stages; i += 1) { var x = 594 + i * 43; node.appendChild(svgElement(doc, "rect", { x: x, y: 69, width: 32, height: 38, rx: 3, fill: "var(--bg,white)", stroke: i === 0 ? gold : blue, "stroke-width": 2 })); svgText(doc, node, "FF" + (i + 1), x + 16, 92, { "font-size": 9, "text-anchor": "middle" }); if (i < stages - 1) node.appendChild(svgElement(doc, "line", { x1: x + 32, y1: 88, x2: x + 43, y2: 88, stroke: blue, "stroke-width": 2 })); }
    var windowCount = Math.max(1, result.interstageWindowCount), barWidth = 228 / windowCount; for (var windowIndex = 0; windowIndex < result.interstageWindowCount; windowIndex += 1) { var barX = 520 + windowIndex * barWidth; node.appendChild(svgElement(doc, "rect", { x: barX, y: 110, width: Math.max(10, barWidth - 4), height: 8, fill: gold, "fill-opacity": ".65" })); svgText(doc, node, "W" + (windowIndex + 1), barX + Math.max(5, (barWidth - 4) / 2), 117, { "font-size": 7, "text-anchor": "middle" }); }
    svgText(doc, node, "FF1 内可能出现 ~ 亚稳态；N−1 个真实级间窗口", 518, 133, { "font-size": 9, fill: gold }); svgText(doc, node, "tCQ=" + format(result.config.clockToQMaxNs, 1) + " ns，布线=" + format(result.config.synchronizerRoutingNs, 1) + " ns", 518, 151, { "font-size": 9 }); svgText(doc, node, "每窗 = T+skew−jitter−tCQ−布线−setup = " + format(result.resolutionWindowNs, 1) + " ns", 518, 169, { "font-size": 8.5, fill: blue }); svgText(doc, node, "窗口数 N−1=" + result.interstageWindowCount + "，总解析=" + format(result.resolveTimeNs, 1) + " ns", 518, 187, { "font-size": 9 }); svgText(doc, node, "log₁₀ 风险代理 = " + format(result.log10RiskProxy, 1), 518, 208, { "font-size": 10, fill: blue }); svgText(doc, node, "窗口比例 = " + format(result.windowFraction * 100, 2) + "%；事件率=" + format(result.phaseEventRateHz, 2) + " Hz", 518, 228, { "font-size": 8.5 });
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 267, width: 748, height: 95, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "余量读法", 30, 290, { "font-size": 13, "font-weight": 700 }); svgText(doc, node, "setup 余量=" + format(result.setupSlackNs, 1) + " ns", 30, 319, { "font-size": 11, fill: result.setupPass ? green : red }); svgText(doc, node, "hold 余量=" + format(result.holdSlackNs, 1) + " ns", 190, 319, { "font-size": 11, fill: result.holdPass ? green : red }); svgText(doc, node, "同步器级数=" + stages + "，风险仍是概率性", 350, 319, { "font-size": 11, fill: gold }); svgText(doc, node, "仿真代理不是芯片 MTBF 或安全证明", 350, 343, { "font-size": 10, fill: "var(--fg-soft,currentColor)" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "eec-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) { clear(hostNode); var rows = [["setup 余量", format(result.setupSlackNs, 2), "ns；正 skew 使捕获更晚，setup 变好"], ["hold 余量", format(result.holdSlackNs, 2), "ns；独立于 setup 上限，正 skew 使其变差"], ["所需最小周期", format(result.requiredPeriodNs, 2), "ns；tCQ,max + 逻辑 + setup + jitter − skew"], ["setup 上限状态", result.setupLimitStatus, result.setupFiniteLimit ? "可换算最大时钟" : "requiredPeriod≤0"], ["最大时钟代理", result.setupFiniteLimit ? format(result.maxClockMHz, 2) : "无有限上限", "MHz；仅由 setup 周期约束"], ["敏感窗口", format(result.apertureNs, 2), "ns；setup + hold + jitter"], ["窗口占比", format(result.windowFraction * 100, 4), "%；相位均匀假设的代理"], ["级间解析窗口", format(result.resolutionWindowNs, 2), "ns；T + skew − jitter − tCQ,max − 布线 − setup"], ["真实窗口数", String(result.interstageWindowCount), "个；N−1 个同步级间窗口"], ["总解析时间", format(result.resolveTimeNs, 2), "ns；窗口 × (N−1)，不是 N"], ["log10 风险代理", format(result.log10RiskProxy, 2), "相对指标；不是绝对失效率"]]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "时序与同步账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "读数" }), element(doc, "th", { text: "单位 / 解释" })])]), body])); }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument, uid = LAB_ID + "-" + (++INSTANCE), state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; rootNode.textContent = "";
    var shell = element(doc, "div", { className: "eec-shell" }); shell.appendChild(element(doc, "h3", { text: "时序实验：建立、保持、偏斜与同步" })); shell.appendChild(element(doc, "p", { className: "eec-note", text: "先判断 setup/hold 余量与同步器的概率性作用；揭示后调节周期、逻辑延迟、偏斜、抖动和同步器级数。默认值是教学模型，不是具体芯片规格。" }));
    var predictionHost = element(doc, "div"), groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "eec-choice-grid" }), buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "eec-actions" }); var reveal = element(doc, "button", { type: "button", className: "eec-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "eec-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }), controls = element(doc, "div", { className: "eec-controls" }); var specs = [["periodNs", "时钟周期", 20, 300, 5], ["logicMaxNs", "最大逻辑延迟", 5, 100, 5], ["setupNs", "setup 时间", 2, 30, 1], ["skewNs", "时钟 skew", -10, 15, 1], ["jitterNs", "时钟 jitter", 0, 10, 0.5], ["synchronizerRoutingNs", "级间布线延迟", 0, 20, 1], ["synchronizerStages", "同步器级数", 1, 4, 1]]; var inputs = {}, outputs = {};
    specs.forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "eec-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output; }); results.appendChild(controls);
    var layout = element(doc, "div", { className: "eec-layout" }), stage = element(doc, "div", { className: "eec-stage" }), svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"), metrics = element(doc, "div", { className: "eec-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "eec-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "eec-note", text: "真实时序要用器件数据手册中的 clock-to-Q、setup、hold、最小脉宽、时钟源误差与布局测量确认。同步器降低风险但不提供绝对安全保证；异步复位、CDC 结构和失效响应还需单独审查。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeTimingSynchronization(state.config); results.hidden = !state.revealed; specs.forEach(function (spec) { outputs[spec[0]].textContent = formatControl(spec[0], result.config[spec[0]]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "setup 余量", format(result.setupSlackNs, 1) + " ns")); metrics.appendChild(metric(doc, "hold 余量", format(result.holdSlackNs, 1) + " ns")); metrics.appendChild(metric(doc, "窗口占比", format(result.windowFraction * 100, 2) + "%")); metrics.appendChild(metric(doc, "同步级数", format(result.config.synchronizerStages, 0))); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在同时审计确定性的时序余量和概率性的同步风险。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; specs.forEach(function (spec) { inputs[spec[0]].value = state.config[spec[0]]; }); render(); announce(api, rootNode, "时序实验已重置。"); }); rootNode.appendChild(shell); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-eec-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var result = computeTimingSynchronization(DEFAULTS), longer = computeTimingSynchronization({ synchronizerStages: 3 }), routed = computeTimingSynchronization({ synchronizerRoutingNs: 10 }), edge = computeTimingSynchronization({ periodNs: 10, skewNs: 50 }); check(result.setupPass && result.holdPass, "default setup and hold pass"); check(near(result.setupSlackNs, 58), "default setup slack"); check(near(result.holdSlackNs, 2), "default hold slack"); check(near(result.resolutionWindowNs, 83), "default single resolution window"); check(result.interstageWindowCount === 1 && result.resolutionWindowsNs.length === 1, "N-1 real windows"); check(near(result.resolveTimeNs, 83), "default total resolution time"); check(computeTimingSynchronization({ skewNs: 5 }).setupSlackNs > result.setupSlackNs, "positive skew improves setup"); check(computeTimingSynchronization({ skewNs: 5 }).holdSlackNs < result.holdSlackNs, "positive skew hurts hold"); check(longer.resolutionWindowsNs.length === 2 && near(longer.resolveTimeNs, 166), "three stages have two windows"); check(longer.log10RiskProxy < result.log10RiskProxy, "more stages lower risk proxy"); check(routed.resolutionWindowNs < result.resolutionWindowNs, "routing consumes resolution window"); check(result.windowFraction > 0 && result.windowFraction < 1, "finite aperture fraction"); check(edge.requiredPeriodNs <= 0 && edge.maxClockMHz === null && !edge.setupFiniteLimit, "nonpositive required period has no finite setup limit"); check(typeof edge.setupLimitStatus === "string" && edge.setupLimitStatus.indexOf("不构成有限") >= 0, "unbounded setup status is explicit"); check(isFinite(edge.holdSlackNs), "hold remains independently reported"); check(JSON.stringify(result) === JSON.stringify(computeTimingSynchronization(DEFAULTS)), "deterministic result"); return { checks: checks }; }
  return { DEFAULTS: DEFAULTS, normalize: normalize, computeTimingSynchronization: computeTimingSynchronization, compute: computeTimingSynchronization, mount: mount, selfTest: selfTest };
});
