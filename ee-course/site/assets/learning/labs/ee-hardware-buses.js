(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-hardware-buses", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-hardware-buses self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-hardware-buses self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "ee-hardware-buses";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-" + NAME + "-styles";
  var INSTANCE = 0;
  var DEFAULTS = Object.freeze({
    bus: "I2C",
    rateKbps: 400,
    lengthM: 0.5,
    capacitancePf: 80,
    pullupKohm: 2.2,
    nodes: 3,
    topology: "line",
    termination: "auto",
    fault: "none"
  });
  var BUS_SPECS = {
    UART: { label: "UART", layer: "单端 / 推挽", pullup: false, differential: false },
    I2C: { label: "I2C", layer: "单端 / 开漏", pullup: true, differential: false },
    SPI: { label: "SPI", layer: "单端 / 推挽同步", pullup: false, differential: false },
    CAN: { label: "CAN", layer: "差分收发器", pullup: false, differential: true },
    RS485: { label: "RS-485", layer: "差分收发器", pullup: false, differential: true }
  };
  var QUESTIONS = [
    { key: "pullup", prompt: "I2C 上拉电阻减半且电容不变，上升沿怎样变化？", expected: "faster", choices: [["faster", "更快"], ["slower", "更慢"], ["same", "不变"]] },
    { key: "termination", prompt: "CAN/RS-485 线末端缺少终端，反射风险怎样变化？", expected: "higher", choices: [["higher", "升高"], ["lower", "降低"], ["same", "不变"]] },
    { key: "topology", prompt: "SPI 从点对点改成星形，同速率下时序余量通常怎样变化？", expected: "lower", choices: [["lower", "降低"], ["higher", "增加"], ["same", "不变"]] }
  ];

  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }
  function finite(value, label) {
    var number = Number(value);
    if (!isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function bounded(value, low, high, label) { return clamp(finite(value, label), low, high); }
  function choice(value, values, fallback) {
    var text = String(value);
    return values.indexOf(text) >= 0 ? text : fallback;
  }
  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
  }
  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function normalize(input) {
    var source = input || {};
    return {
      bus: choice(source.bus === undefined ? DEFAULTS.bus : source.bus, ["UART", "I2C", "SPI", "CAN", "RS485"], DEFAULTS.bus),
      rateKbps: bounded(source.rateKbps === undefined ? DEFAULTS.rateKbps : source.rateKbps, 10, 2000, "bit rate"),
      lengthM: bounded(source.lengthM === undefined ? DEFAULTS.lengthM : source.lengthM, 0.05, 20, "length"),
      capacitancePf: bounded(source.capacitancePf === undefined ? DEFAULTS.capacitancePf : source.capacitancePf, 10, 500, "bus capacitance"),
      pullupKohm: bounded(source.pullupKohm === undefined ? DEFAULTS.pullupKohm : source.pullupKohm, 0.8, 10, "pull-up resistance"),
      nodes: Math.round(bounded(source.nodes === undefined ? DEFAULTS.nodes : source.nodes, 1, 16, "node count")),
      topology: choice(source.topology === undefined ? DEFAULTS.topology : source.topology, ["point", "line", "star"], DEFAULTS.topology),
      termination: choice(source.termination === undefined ? DEFAULTS.termination : source.termination, ["auto", "matched", "missing"], DEFAULTS.termination),
      fault: choice(source.fault === undefined ? DEFAULTS.fault : source.fault, ["none", "open", "short", "missingTermination", "groundOffset"], DEFAULTS.fault)
    };
  }
  function computeBus(input) {
    var config = normalize(input);
    var spec = BUS_SPECS[config.bus];
    var bitPeriodNs = 1000000 / config.rateKbps;
    var propagationNs = config.lengthM * 5;
    var tdNs = propagationNs;
    var roundTripNs = 2 * tdNs;
    var riseNs;
    if (config.bus === "I2C") riseNs = 2.2 * config.pullupKohm * config.capacitancePf;
    else if (spec.differential) riseNs = 12 + 0.8 * config.lengthM + 0.6 * config.nodes;
    else riseNs = 8 + 0.5 * config.lengthM + 0.4 * config.nodes;
    var budgetNs = 0.35 * bitPeriodNs;
    var topologyPenaltyNs = config.topology === "star" ? 0.08 * bitPeriodNs : config.topology === "line" ? 0.02 * bitPeriodNs : 0;
    var timingUseNs = riseNs + roundTripNs + topologyPenaltyNs;
    var timingMarginNs = budgetNs - timingUseNs;
    var pullupCurrentmA = spec.pullup ? 3.3 / config.pullupKohm : 0;
    var terminationState;
    if (config.termination === "auto") {
      terminationState = spec.differential && config.topology === "line" ? "两端匹配" : spec.pullup ? "上拉" : "按收发器核对";
    } else if (config.termination === "matched") terminationState = "匹配";
    else terminationState = "缺失/未配置";
    var terminationRisk = config.termination === "missing" ? (spec.differential ? 0.65 : 0.35) : spec.differential && config.termination === "auto" && config.topology !== "line" ? 0.65 : 0;
    var topologyRisk = config.topology === "star" ? 0.28 : config.topology === "line" ? 0.08 : 0;
    var faultPenalty = { none: 0, open: 0.9, short: 1, missingTermination: spec.differential ? 0.75 : 0.15, groundOffset: 0.45 }[config.fault];
    var health = clamp(1 - Math.max(0, -timingMarginNs) / Math.max(budgetNs, 1) - terminationRisk - topologyRisk * 0.5 - faultPenalty * 0.5, 0, 1);
    var terminationPass = config.termination !== "missing" && !(spec.differential && config.termination === "auto" && config.topology !== "line") && config.fault !== "missingTermination";
    var faultInjected = config.fault !== "none";
    var forcedStop = config.fault === "open" || config.fault === "short";
    var electricalSafetyPass = !faultInjected && terminationPass;
    var overallSafe = electricalSafetyPass;
    var stop = !overallSafe;
    var safetyStatus = overallSafe ? "SAFE / GO" : "STOP";
    var stopReason;
    if (config.fault === "short") stopReason = "短路故障：限流后立即停止并断电。";
    else if (config.fault === "open") stopReason = "开路故障：停止并断电，接收端没有可证明的闭合路径。";
    else if (!terminationPass) stopReason = "终端配置不通过：停止推进并补齐端点证据。";
    else if (faultInjected) stopReason = "故障注入未清除：停止并保留故障前后证据。";
    else stopReason = "电气安全门通过。";
    var faultText = {
      none: "无故障注入，先观察基线。",
      open: "开路：回路被切断或进入高阻，接收端可能没有可判决边沿。",
      short: "短路：低压教学故障；应看到限流动作并立即停止加电。",
      missingTermination: spec.differential ? "缺终端：差分干线的端点阻抗改变，反射风险上升。" : "单端推挽线没有同样的差分端终端含义，应回到输出/输入模型。",
      groundOffset: "参考偏移：信号幅度未必改变，但共模/判决余量可能减少。"
    }[config.fault];
    return {
      config: config,
      spec: spec,
      bitPeriodNs: bitPeriodNs,
      propagationNs: propagationNs,
      tdNs: tdNs,
      roundTripNs: roundTripNs,
      propagationBudgetNs: roundTripNs,
      riseNs: riseNs,
      budgetNs: budgetNs,
      topologyPenaltyNs: topologyPenaltyNs,
      timingUseNs: timingUseNs,
      timingMarginNs: timingMarginNs,
      pullupCurrentmA: pullupCurrentmA,
      terminationState: terminationState,
      terminationRisk: terminationRisk,
      terminationPass: terminationPass,
      topologyRisk: topologyRisk,
      faultPenalty: faultPenalty,
      faultText: faultText,
      faultInjected: faultInjected,
      forcedStop: forcedStop,
      electricalSafetyPass: electricalSafetyPass,
      overallSafe: overallSafe,
      stop: stop,
      safetyStatus: safetyStatus,
      stopReason: stopReason,
      timingPass: timingMarginNs >= 0,
      health: health,
      allPass: timingMarginNs >= 0 && overallSafe,
      interpretation: timingMarginNs < 0 ? "时序不通过；电气安全门独立显示" : !overallSafe ? "电气安全不通过：STOP" : "时序与电气安全均通过"
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, String(value));
    });
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgText(doc, parent, text, x, y, attrs) {
    var all = attrs || {};
    all.x = x; all.y = y;
    parent.appendChild(svgElement(doc, "text", all, text));
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--eeb-blue:#28659d;--eeb-green:#39734d;--eeb-gold:#9b6a12;--eeb-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] [hidden]{display:none!important}[data-learning-lab="' + NAME + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input,[data-learning-lab="' + NAME + '"] select{font:inherit;letter-spacing:0}[data-learning-lab="' + NAME + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] button:hover{border-color:var(--eeb-blue)}[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .eeb-primary{background:var(--eeb-blue);border-color:var(--eeb-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:disabled{cursor:not-allowed;opacity:.55}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .eeb-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + NAME + '"] .eeb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + NAME + '"] .eeb-actions>*{flex:1 1 180px}[data-learning-lab="' + NAME + '"] .eeb-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + NAME + '"] .eeb-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + NAME + '"] .eeb-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .eeb-control label{font-size:12px;font-weight:700;line-height:1.4}[data-learning-lab="' + NAME + '"] .eeb-control output{color:var(--eeb-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] input[type=range],[data-learning-lab="' + NAME + '"] select{display:block;width:100%;min-height:44px}[data-learning-lab="' + NAME + '"] input[type=range]{accent-color:var(--eeb-blue)}' +
      '[data-learning-lab="' + NAME + '"] .eeb-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + NAME + '"] .eeb-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .eeb-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + NAME + '"] .eeb-metric{min-width:0;padding:9px;border-top:2px solid var(--eeb-blue);background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] .eeb-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .eeb-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .eeb-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + NAME + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .eeb-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + NAME + '"] .eeb-layout{grid-template-columns:1fr}}@media(max-width:680px){[data-learning-lab="' + NAME + '"] .eeb-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){[data-learning-lab="' + NAME + '"] .eeb-choice-grid,[data-learning-lab="' + NAME + '"] .eeb-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .eeb-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
    var live = rootNode.querySelector("[data-eeb-live]");
    if (live) live.textContent = message;
  }
  function drawTopology(doc, svg, result) {
    var config = result.config;
    var x0 = 22, x1 = 392, y = 142;
    svg.appendChild(svgElement(doc, "rect", { x: 14, y: 38, width: 398, height: 278, rx: 6, fill: "var(--bg,transparent)", stroke: "currentColor", "stroke-opacity": ".25" }));
    svgText(doc, svg, "电气拓扑：" + result.spec.label, 28, 62, { "font-size": 13, "font-weight": 700 });
    var busColor = "var(--eeb-blue)";
    if (config.topology === "star") {
      svg.appendChild(svgElement(doc, "line", { x1: 92, y1: y, x2: 218, y2: y, stroke: busColor, "stroke-width": 5 }));
      [90, 154, 218].forEach(function (nodeX, index) {
        var endX = 334, endY = 84 + index * 58;
        svg.appendChild(svgElement(doc, "line", { x1: 218, y1: y, x2: endX, y2: endY, stroke: busColor, "stroke-width": 4, "stroke-dasharray": index === 1 ? "" : "7 4" }));
        svg.appendChild(svgElement(doc, "rect", { x: endX - 34, y: endY - 15, width: 68, height: 30, rx: 4, fill: index === 1 ? "var(--eeb-green)" : "var(--eeb-gold)", "fill-opacity": ".82" }));
        svgText(doc, svg, "节点 " + (index + 1), endX, endY + 4, { "font-size": 10, "text-anchor": "middle", fill: "#fff" });
      });
      svg.appendChild(svgElement(doc, "circle", { cx: 218, cy: y, r: 10, fill: "var(--eeb-red)" }));
      svgText(doc, svg, "星形汇点", 218, y + 31, { "font-size": 11, "text-anchor": "middle", fill: "var(--eeb-red)" });
    } else if (config.topology === "point") {
      svg.appendChild(svgElement(doc, "line", { x1: 108, y1: y, x2: 302, y2: y, stroke: busColor, "stroke-width": 5 }));
      svg.appendChild(svgElement(doc, "rect", { x: 34, y: 111, width: 74, height: 62, rx: 5, fill: "var(--eeb-green)", "fill-opacity": ".82" }));
      svg.appendChild(svgElement(doc, "rect", { x: 302, y: 111, width: 74, height: 62, rx: 5, fill: "var(--eeb-gold)", "fill-opacity": ".82" }));
      svgText(doc, svg, "主控", 71, y + 4, { "font-size": 12, "text-anchor": "middle", fill: "#fff" });
      svgText(doc, svg, "设备", 339, y + 4, { "font-size": 12, "text-anchor": "middle", fill: "#fff" });
      svgText(doc, svg, "点对点", 205, y - 13, { "font-size": 11, "text-anchor": "middle" });
    } else {
      svg.appendChild(svgElement(doc, "line", { x1: x0 + 46, y1: y, x2: x1 - 32, y2: y, stroke: busColor, "stroke-width": 5 }));
      [70, 166, 262, 358].forEach(function (nodeX, index) {
        svg.appendChild(svgElement(doc, "rect", { x: nodeX - 31, y: y - 30, width: 62, height: 60, rx: 5, fill: index === 0 ? "var(--eeb-green)" : "var(--eeb-gold)", "fill-opacity": ".82" }));
        svgText(doc, svg, index === 0 ? "主控" : "节点 " + index, nodeX, y + 4, { "font-size": 10.5, "text-anchor": "middle", fill: "#fff" });
      });
      svgText(doc, svg, "共享干线", 214, y - 42, { "font-size": 11, "text-anchor": "middle" });
      if (result.spec.differential) {
        svg.appendChild(svgElement(doc, "line", { x1: x0 + 46, y1: y + 15, x2: x1 - 32, y2: y + 15, stroke: "var(--eeb-red)", "stroke-width": 2, "stroke-dasharray": "5 4" }));
        svgText(doc, svg, "D+ / D- 差分对", 214, y + 57, { "font-size": 10.5, "text-anchor": "middle", fill: "var(--eeb-red)" });
      } else {
        svgText(doc, svg, config.bus === "I2C" ? "开漏 DATA + 上拉" : "推挽 DATA / CLOCK", 214, y + 57, { "font-size": 10.5, "text-anchor": "middle", fill: "var(--eeb-blue)" });
      }
      if (result.spec.differential) {
        svg.appendChild(svgElement(doc, "rect", { x: 44, y: y - 42, width: 12, height: 84, fill: "var(--eeb-red)", "fill-opacity": ".65" }));
        svg.appendChild(svgElement(doc, "rect", { x: 356, y: y - 42, width: 12, height: 84, fill: "var(--eeb-red)", "fill-opacity": ".65" }));
        svgText(doc, svg, result.terminationState, 205, 286, { "font-size": 11, "text-anchor": "middle", fill: "var(--eeb-red)" });
      }
    }
    svgText(doc, svg, "节点数 " + config.nodes + " · 长度 " + format(config.lengthM, 2) + " m", 28, 302, { "font-size": 11, fill: "var(--fg-soft)" });
  }
  function drawTiming(doc, svg, result) {
    var left = 442, right = 820, high = 102, low = 232;
    svg.appendChild(svgElement(doc, "rect", { x: 430, y: 38, width: 408, height: 278, rx: 6, fill: "var(--bg,transparent)", stroke: "currentColor", "stroke-opacity": ".25" }));
    svgText(doc, svg, "时序预算与故障诊断", 446, 62, { "font-size": 13, "font-weight": 700 });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: 250, x2: right, y2: 250, stroke: "currentColor", "stroke-opacity": ".4" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: 88, x2: left, y2: 250, stroke: "currentColor", "stroke-opacity": ".4" }));
    var period = Math.max(8, right - left - 22);
    var riseFraction = clamp(result.riseNs / result.bitPeriodNs, 0.02, 0.44);
    var d = "M" + left + " " + high + " ";
    for (var i = 0; i < 3; i += 1) {
      var x = left + i * period / 3;
      d += "L" + (x + period / 6 * (1 - riseFraction)) + " " + high + " L" + (x + period / 6) + " " + low + " L" + (x + period / 3) + " " + low + " L" + (x + period / 3 + period / 6 * riseFraction) + " " + high + " ";
    }
    svg.appendChild(svgElement(doc, "path", { d: d, fill: "none", stroke: "var(--eeb-blue)", "stroke-width": 3 }));
    var budgetY = 278 - clamp(result.budgetNs / Math.max(result.bitPeriodNs, 1), 0, 1) * 35;
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: budgetY, x2: right - 8, y2: budgetY, stroke: "var(--eeb-gold)", "stroke-width": 2, "stroke-dasharray": "7 5" }));
    svgText(doc, svg, "DATA / 边沿", left + 8, 92, { "font-size": 11, fill: "var(--eeb-blue)" });
    svgText(doc, svg, "教学预算 " + format(result.budgetNs, 1) + " ns", right - 8, budgetY - 8, { "font-size": 10.5, "text-anchor": "end", fill: "var(--eeb-gold)" });
    svgText(doc, svg, "t_r " + format(result.riseNs, 1) + " ns", left + 8, 276, { "font-size": 11 });
    svgText(doc, svg, "T_b " + format(result.bitPeriodNs / 1000, 3) + " μs", left + 124, 276, { "font-size": 11 });
    svgText(doc, svg, "余量 " + format(result.timingMarginNs, 1) + " ns", left + 232, 276, { "font-size": 11, fill: result.timingPass ? "var(--eeb-green)" : "var(--eeb-red)" });
    svgText(doc, svg, result.faultText, 446, 296, { "font-size": 10.5, fill: result.config.fault === "none" ? "var(--fg-soft)" : "var(--eeb-red)" });
    svgText(doc, svg, "时序 " + (result.timingPass ? "PASS" : "FAIL") + " · 电气安全 " + result.safetyStatus, 446, 314, { "font-size": 10.5, "font-weight": 700, fill: result.allPass ? "var(--eeb-green)" : "var(--eeb-red)" });
    svgText(doc, svg, result.stopReason, 446, 330, { "font-size": 10, fill: result.overallSafe ? "var(--fg-soft)" : "var(--eeb-red)" });
  }
  function draw(doc, svg, result) {
    clear(svg); svg.setAttribute("viewBox", "0 0 860 340"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "UART、I2C、SPI、CAN、RS-485 的总线拓扑与时序预算示意");
    svg.appendChild(svgElement(doc, "title", {}, "总线拓扑与电气时序预算"));
    svg.appendChild(svgElement(doc, "desc", {}, "左侧显示所选总线的点对点、线形或星形拓扑与上拉/终端提示，右侧显示边沿、比特时间、教学预算和故障注入。"));
    drawTopology(doc, svg, result); drawTiming(doc, svg, result);
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "eeb-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, target, result) {
    clear(target);
    var rows = [
      ["电气层", result.spec.layer, result.spec.differential ? "差分" : result.spec.pullup ? "开漏 + 上拉" : "单端"],
      ["上升时间", format(result.riseNs, 1), "ns；教学模型"],
      ["比特时间", format(result.bitPeriodNs / 1000, 3), "μs；1 / f_b"],
      ["传播 t_d / t_rt", format(result.tdNs, 1) + " / " + format(result.roundTripNs, 1), "ns；t_rt = 2t_d"],
      ["预算传播项", format(result.propagationBudgetNs, 1), "ns；只在需往返回证的预算使用"],
      ["终端/上拉", result.terminationState, result.spec.differential ? "位置需按器件/标准核对" : "电气层提示"],
      ["终端门", result.terminationPass ? "通过" : "不通过", "与时序门分开；缺终端不能推进"],
      ["时序余量", format(result.timingMarginNs, 1), "ns；预算减去边沿/传播/拓扑代理"],
      ["时序门", result.timingPass ? "通过" : "不通过", "只表示时间预算"],
      ["电气安全 / STOP", result.safetyStatus, result.stopReason],
      ["故障", result.config.fault, result.faultText]
    ];
    var table = element(doc, "table", { "aria-label": "硬件总线电气账本" });
    table.appendChild(element(doc, "caption", { text: "硬件总线电气账本" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])));
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    table.appendChild(body); target.appendChild(table);
  }
  function addSelect(doc, controls, state, field, labelText, options, onChange) {
    var id = NAME + "-" + (++INSTANCE) + "-" + field;
    var label = element(doc, "label", { htmlFor: id, text: labelText });
    var select = element(doc, "select", { id: id, "aria-label": labelText });
    options.forEach(function (option) { select.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    select.value = state[field];
    select.addEventListener("change", function () { state[field] = select.value; onChange(); });
    controls.appendChild(element(doc, "div", { className: "eeb-control" }, [label, select]));
  }
  function addRange(doc, controls, state, field, labelText, min, max, step, unit, onChange) {
    var id = NAME + "-" + (++INSTANCE) + "-" + field;
    var output = element(doc, "output", { text: "" });
    var label = element(doc, "label", { htmlFor: id, text: labelText });
    var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, value: state[field], "aria-label": labelText });
    input.addEventListener("input", function () { state[field] = Number(input.value); onChange(); });
    controls.appendChild(element(doc, "div", { className: "eeb-control" }, [label, output, input]));
    return { input: input, output: output, unit: unit };
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { bus: DEFAULTS.bus, rateKbps: DEFAULTS.rateKbps, lengthM: DEFAULTS.lengthM, capacitancePf: DEFAULTS.capacitancePf, pullupKohm: DEFAULTS.pullupKohm, nodes: DEFAULTS.nodes, topology: DEFAULTS.topology, termination: DEFAULTS.termination, fault: DEFAULTS.fault, predictions: {}, revealed: false, feedback: "请先完成三项方向预测。" };
    rootNode.textContent = "";
    var shell = element(doc, "div", { className: "eeb-shell" });
    shell.appendChild(element(doc, "h3", { text: "硬件总线实验：拓扑、边沿与故障" }));
    shell.appendChild(element(doc, "p", { className: "eeb-note", text: "先预测电气方向，再改变总线、拓扑和故障；数值均为教学设定。" }));
    var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) {
      var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt }));
      var grid = element(doc, "div", { className: "eeb-choice-grid", role: "group", "aria-label": question.prompt }); var buttons = [];
      question.choices.forEach(function (item) {
        var button = element(doc, "button", { type: "button", text: item[1], "aria-pressed": "false" });
        button.value = item[0];
        button.addEventListener("click", function () { state.predictions[question.key] = item[0]; buttons.forEach(function (other) { other.setAttribute("aria-pressed", other.value === item[0] ? "true" : "false"); }); updateGate(); });
        buttons.push(button); grid.appendChild(button);
      });
      groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "eeb-actions" });
    var reveal = element(doc, "button", { type: "button", className: "eeb-primary", text: "提交预测并揭示", disabled: true });
    var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "eeb-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var live = element(doc, "p", { className: "cl-sr-only", "data-eeb-live": true, "aria-live": "polite" }); shell.appendChild(live);
    var results = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "eeb-controls" });
    addSelect(doc, controls, state, "bus", "总线", [["UART", "UART"], ["I2C", "I2C"], ["SPI", "SPI"], ["CAN", "CAN"], ["RS485", "RS-485"]], renderResult);
    addSelect(doc, controls, state, "topology", "拓扑", [["point", "点对点"], ["line", "线形干线"], ["star", "星形分支"]], renderResult);
    addSelect(doc, controls, state, "termination", "终端状态", [["auto", "自动教学提示"], ["matched", "已匹配"], ["missing", "缺失"]], renderResult);
    addSelect(doc, controls, state, "fault", "故障注入", [["none", "无"], ["open", "开路"], ["short", "短路"], ["missingTermination", "缺终端"], ["groundOffset", "参考偏移"]], renderResult);
    var rangeRefs = {};
    rangeRefs.rateKbps = addRange(doc, controls, state, "rateKbps", "速率 f_b", 10, 2000, 10, " kbit/s", renderResult);
    rangeRefs.lengthM = addRange(doc, controls, state, "lengthM", "线长", 0.05, 20, 0.05, " m", renderResult);
    rangeRefs.capacitancePf = addRange(doc, controls, state, "capacitancePf", "总电容 C_B", 10, 500, 5, " pF", renderResult);
    rangeRefs.pullupKohm = addRange(doc, controls, state, "pullupKohm", "上拉 R_P", 0.8, 10, 0.1, " kΩ", renderResult);
    rangeRefs.nodes = addRange(doc, controls, state, "nodes", "节点数", 1, 16, 1, " 个", renderResult);
    results.appendChild(controls);
    var layout = element(doc, "div", { className: "eeb-layout" }); var stage = element(doc, "div", { className: "eeb-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage);
    var side = element(doc, "div"); var metrics = element(doc, "div", { className: "eeb-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "eeb-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "eeb-note", text: "教学余量只检验本页代理模型；它不证明协议栈、器件额定值或 EMC 合规。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function updateGate() { reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() {
      var result = computeBus(state); results.hidden = !state.revealed;
      rangeRefs.rateKbps.output.textContent = format(result.config.rateKbps, 0) + rangeRefs.rateKbps.unit;
      rangeRefs.lengthM.output.textContent = format(result.config.lengthM, 2) + rangeRefs.lengthM.unit;
      rangeRefs.capacitancePf.output.textContent = format(result.config.capacitancePf, 0) + rangeRefs.capacitancePf.unit;
      rangeRefs.pullupKohm.output.textContent = format(result.config.pullupKohm, 1) + rangeRefs.pullupKohm.unit;
      rangeRefs.nodes.output.textContent = format(result.config.nodes, 0) + rangeRefs.nodes.unit;
      draw(doc, svg, result); clear(metrics);
      metrics.appendChild(metric(doc, "上升时间", format(result.riseNs, 1) + " ns"));
      metrics.appendChild(metric(doc, "时序余量", format(result.timingMarginNs, 1) + " ns"));
      metrics.appendChild(metric(doc, "上拉电流", format(result.pullupCurrentmA, 2) + " mA"));
      metrics.appendChild(metric(doc, "时序门", result.timingPass ? "PASS" : "FAIL"));
      metrics.appendChild(metric(doc, "电气安全", result.safetyStatus));
      metrics.appendChild(metric(doc, "整体判读", result.interpretation));
      renderTable(doc, tableWrap, result); feedback.textContent = state.feedback;
    }
    reveal.addEventListener("click", function () {
      if (Object.keys(state.predictions).length !== QUESTIONS.length) return;
      var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0);
      state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 项命中。现在逐项改变一个电气条件。"; renderResult(); announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state.bus = DEFAULTS.bus; state.rateKbps = DEFAULTS.rateKbps; state.lengthM = DEFAULTS.lengthM; state.capacitancePf = DEFAULTS.capacitancePf; state.pullupKohm = DEFAULTS.pullupKohm; state.nodes = DEFAULTS.nodes; state.topology = DEFAULTS.topology; state.termination = DEFAULTS.termination; state.fault = DEFAULTS.fault; state.predictions = {}; state.revealed = false; state.feedback = "请先完成三项方向预测。";
      controls.querySelectorAll("select").forEach(function (select) { select.value = state[select.id.slice((NAME + "-").length).split("-").slice(1).join("-")] || select.value; });
      rangeRefs.rateKbps.input.value = state.rateKbps; rangeRefs.lengthM.input.value = state.lengthM; rangeRefs.capacitancePf.input.value = state.capacitancePf; rangeRefs.pullupKohm.input.value = state.pullupKohm; rangeRefs.nodes.input.value = state.nodes;
      groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); updateGate(); renderResult(); announce(api, rootNode, "硬件总线实验已重置。");
    });
    renderResult(); updateGate();
  }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var base = computeBus(DEFAULTS);
    check(base.config.bus === "I2C", "default bus normalized");
    check(near(base.riseNs, 387.2), "I2C RC rise time");
    check(near(base.bitPeriodNs, 2500), "bit period");
    check(near(base.roundTripNs, 5), "round-trip propagation is twice one-way");
    check(base.timingMarginNs > 0, "default timing margin");
    check(base.timingPass && base.overallSafe && !base.stop, "timing and safety pass independently at default");
    check(computeBus({ bus: "I2C", pullupKohm: 1.1, capacitancePf: 80 }).riseNs < base.riseNs, "smaller pull-up is faster");
    check(computeBus({ bus: "CAN", topology: "line", termination: "missing" }).terminationRisk > 0, "missing differential termination is visible");
    check(!computeBus({ bus: "CAN", topology: "line", termination: "missing" }).terminationPass, "missing termination fails its own gate");
    check(computeBus({ fault: "open" }).stop && !computeBus({ fault: "open" }).overallSafe, "open fault forces STOP");
    check(computeBus({ fault: "short" }).stop && !computeBus({ fault: "short" }).overallSafe, "short fault forces STOP");
    check(!computeBus({ rateKbps: 2000 }).timingPass && computeBus({ rateKbps: 2000 }).overallSafe, "timing failure is separate from electrical safety");
    check(computeBus({ bus: "SPI", topology: "star" }).timingMarginNs < computeBus({ bus: "SPI", topology: "point" }).timingMarginNs, "star topology costs margin");
    check(computeBus({ lengthM: -10, rateKbps: 1 }).config.lengthM === 0.05, "finite out-of-range inputs are bounded");
    check(JSON.stringify(computeBus(DEFAULTS)) === JSON.stringify(computeBus(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  return { NAME: NAME, DEFAULTS: DEFAULTS, compute: computeBus, computeBus: computeBus, mount: mount, selfTest: selfTest };
});
