(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-power-tree", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-power-tree self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-power-tree self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "ee-power-tree";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-" + NAME + "-styles";
  var INSTANCE = 0;
  var DEFAULTS = Object.freeze({
    regulator: "LDO",
    vinV: 5,
    voutV: 3.3,
    loadmA: 80,
    iqmA: 0.5,
    dropoutV: 0.2,
    efficiencyPct: 90,
    capUf: 10,
    esrMOhm: 50,
    stepmA: 60,
    holdUs: 20,
    transientBudgetmV: 150
  });
  var QUESTIONS = [
    { key: "loss", prompt: "LDO 的输入输出压差增大且负载不变，耗散功率怎样变化？", expected: "higher", choices: [["higher", "增加"], ["lower", "减少"], ["same", "不变"]] },
    { key: "cap", prompt: "负载阶跃和持续时间不变，电容加倍，理想电容下陷怎样变化？", expected: "half", choices: [["half", "约减半"], ["double", "约加倍"], ["same", "不变"]] },
    { key: "dropout", prompt: "输入低于输出加压降时，LDO 还能保持额定输出吗？", expected: "no", choices: [["no", "不能保证"], ["yes", "仍能保证"], ["unknown", "与输入无关"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(NAME + " self-test failed: " + message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function bounded(value, low, high, label) { return clamp(finite(value, label), low, high); }
  function choice(value, values, fallback) { var text = String(value); return values.indexOf(text) >= 0 ? text : fallback; }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function normalize(input) {
    var source = input || {};
    return {
      regulator: choice(source.regulator === undefined ? DEFAULTS.regulator : source.regulator, ["LDO", "SWITCH"], DEFAULTS.regulator),
      vinV: bounded(source.vinV === undefined ? DEFAULTS.vinV : source.vinV, 2.5, 12, "input voltage"),
      voutV: bounded(source.voutV === undefined ? DEFAULTS.voutV : source.voutV, 1, 5.5, "output voltage"),
      loadmA: bounded(source.loadmA === undefined ? DEFAULTS.loadmA : source.loadmA, 1, 300, "load current"),
      iqmA: bounded(source.iqmA === undefined ? DEFAULTS.iqmA : source.iqmA, 0.01, 5, "quiescent current"),
      dropoutV: bounded(source.dropoutV === undefined ? DEFAULTS.dropoutV : source.dropoutV, 0.05, 1, "dropout"),
      efficiencyPct: bounded(source.efficiencyPct === undefined ? DEFAULTS.efficiencyPct : source.efficiencyPct, 60, 98, "efficiency"),
      capUf: bounded(source.capUf === undefined ? DEFAULTS.capUf : source.capUf, 1, 100, "capacitance"),
      esrMOhm: bounded(source.esrMOhm === undefined ? DEFAULTS.esrMOhm : source.esrMOhm, 5, 300, "ESR"),
      stepmA: bounded(source.stepmA === undefined ? DEFAULTS.stepmA : source.stepmA, 1, 200, "load step"),
      holdUs: bounded(source.holdUs === undefined ? DEFAULTS.holdUs : source.holdUs, 1, 100, "step duration"),
      transientBudgetmV: bounded(source.transientBudgetmV === undefined ? DEFAULTS.transientBudgetmV : source.transientBudgetmV, 20, 400, "transient budget")
    };
  }
  function computePower(input) {
    var config = normalize(input);
    var requestedOutputPowerW = config.voutV * config.loadmA / 1000;
    var inputPowerW;
    var inputCurrentmA;
    var reachableVoutV;
    var deliveredVoutV;
    var ratedOutputValid;
    if (config.regulator === "LDO") {
      reachableVoutV = Math.max(0, config.vinV - config.dropoutV);
      ratedOutputValid = config.vinV >= config.voutV + config.dropoutV;
      deliveredVoutV = Math.min(config.voutV, reachableVoutV);
      inputCurrentmA = config.loadmA + config.iqmA;
      inputPowerW = config.vinV * inputCurrentmA / 1000;
    } else {
      ratedOutputValid = config.vinV > config.voutV;
      reachableVoutV = ratedOutputValid ? config.voutV : 0;
      deliveredVoutV = reachableVoutV;
      inputPowerW = (deliveredVoutV * config.loadmA / 1000) / (config.efficiencyPct / 100) + config.vinV * config.iqmA / 1000;
      inputCurrentmA = inputPowerW / config.vinV * 1000;
    }
    var outputPowerW = deliveredVoutV * config.loadmA / 1000;
    var lossPowerW = inputPowerW - outputPowerW;
    var efficiencyPct = inputPowerW > 0 ? outputPowerW / inputPowerW * 100 : 0;
    var headroomV = config.vinV - config.voutV;
    var dropoutMarginV = headroomV - config.dropoutV;
    var loadResistanceOhm = config.voutV / (config.loadmA / 1000);
    var loadCapacitiveTimescaleMs = loadResistanceOhm * config.capUf / 1000;
    var capacitorDroopmV = config.stepmA * config.holdUs / config.capUf;
    var esrDroopmV = config.stepmA * config.esrMOhm / 1000;
    var totalDroopmV = capacitorDroopmV + esrDroopmV;
    var transientMarginmV = config.transientBudgetmV - totalDroopmV;
    var energyBalancePass = inputPowerW >= outputPowerW && efficiencyPct <= 100;
    return {
      config: config,
      requestedOutputPowerW: requestedOutputPowerW,
      requestedVoutV: config.voutV,
      reachableVoutV: reachableVoutV,
      deliveredVoutV: deliveredVoutV,
      ratedOutputValid: ratedOutputValid,
      outputPowerW: outputPowerW,
      inputPowerW: inputPowerW,
      inputCurrentmA: inputCurrentmA,
      lossPowerW: lossPowerW,
      efficiencyPct: efficiencyPct,
      headroomV: headroomV,
      dropoutMarginV: dropoutMarginV,
      loadResistanceOhm: loadResistanceOhm,
      loadCapacitiveTimescaleMs: loadCapacitiveTimescaleMs,
      capacitorDroopmV: capacitorDroopmV,
      esrDroopmV: esrDroopmV,
      totalDroopmV: totalDroopmV,
      transientMarginmV: transientMarginmV,
      energyBalancePass: energyBalancePass,
      feasible: ratedOutputValid && energyBalancePass,
      transientPass: transientMarginmV >= 0,
      interpretation: !ratedOutputValid ? "额定输出无效；按可达 Vout 记账" : !energyBalancePass ? "能量账本不通过" : transientMarginmV >= 0 ? "教学瞬态预算内" : "超过教学瞬态预算"
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
  function svgText(doc, parent, text, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, text)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--ept-blue:#28659d;--ept-green:#39734d;--ept-gold:#9b6a12;--ept-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] [hidden]{display:none!important}[data-learning-lab="' + NAME + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input,[data-learning-lab="' + NAME + '"] select{font:inherit;letter-spacing:0}[data-learning-lab="' + NAME + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] button:hover{border-color:var(--ept-blue)}[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .ept-primary{background:var(--ept-blue);border-color:var(--ept-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:disabled{cursor:not-allowed;opacity:.55}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .ept-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + NAME + '"] .ept-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + NAME + '"] .ept-actions>*{flex:1 1 180px}[data-learning-lab="' + NAME + '"] .ept-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + NAME + '"] .ept-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + NAME + '"] .ept-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .ept-control label{font-size:12px;font-weight:700;line-height:1.4}[data-learning-lab="' + NAME + '"] .ept-control output{color:var(--ept-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] input[type=range],[data-learning-lab="' + NAME + '"] select{display:block;width:100%;min-height:44px}[data-learning-lab="' + NAME + '"] input[type=range]{accent-color:var(--ept-blue)}' +
      '[data-learning-lab="' + NAME + '"] .ept-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + NAME + '"] .ept-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .ept-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + NAME + '"] .ept-metric{min-width:0;padding:9px;border-top:2px solid var(--ept-blue);background:var(--bg,transparent)}[data-learning-lab="' + NAME + '"] .ept-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .ept-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .ept-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + NAME + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .ept-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + NAME + '"] .ept-layout{grid-template-columns:1fr}}@media(max-width:680px){[data-learning-lab="' + NAME + '"] .ept-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){[data-learning-lab="' + NAME + '"] .ept-choice-grid,[data-learning-lab="' + NAME + '"] .ept-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .ept-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
    var live = rootNode.querySelector("[data-ept-live]"); if (live) live.textContent = message;
  }
  function drawTree(doc, svg, result) {
    svg.appendChild(svgElement(doc, "rect", { x: 14, y: 36, width: 395, height: 284, rx: 6, fill: "var(--bg,transparent)", stroke: "currentColor", "stroke-opacity": ".25" }));
    svgText(doc, svg, "电源树：能量、支路与回流", 28, 61, { "font-size": 13, "font-weight": 700 });
    var boxes = [
      { x: 30, y: 114, w: 84, h: 58, title: "输入", value: format(result.config.vinV, 1) + " V", color: "var(--ept-green)" },
      { x: 145, y: 114, w: 104, h: 58, title: result.config.regulator === "LDO" ? "LDO" : "buck 教学模型", value: format(result.lossPowerW * 1000, 0) + " mW 损耗", color: "var(--ept-blue)" },
      { x: 280, y: 114, w: 104, h: 58, title: "可达输出 rail", value: format(result.deliveredVoutV, 1) + " V", color: "var(--ept-gold)" }
    ];
    boxes.forEach(function (box, index) {
      svg.appendChild(svgElement(doc, "rect", { x: box.x, y: box.y, width: box.w, height: box.h, rx: 5, fill: box.color, "fill-opacity": ".85" }));
      svgText(doc, svg, box.title, box.x + box.w / 2, box.y + 23, { "font-size": 11, "text-anchor": "middle", fill: "#fff" });
      svgText(doc, svg, box.value, box.x + box.w / 2, box.y + 42, { "font-size": 10.5, "text-anchor": "middle", fill: "#fff" });
      if (index < boxes.length - 1) {
        var end = box.x + box.w;
        svg.appendChild(svgElement(doc, "line", { x1: end, y1: 143, x2: end + 26, y2: 143, stroke: "currentColor", "stroke-width": 2 }));
        svg.appendChild(svgElement(doc, "polygon", { points: (end + 26) + ",143 " + (end + 17) + ",137 " + (end + 17) + ",149", fill: "currentColor" }));
      }
    });
    svg.appendChild(svgElement(doc, "line", { x1: 332, y1: 172, x2: 332, y2: 226, stroke: "var(--ept-gold)", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "line", { x1: 332, y1: 226, x2: 96, y2: 226, stroke: "var(--ept-gold)", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "polygon", { points: "96,226 108,219 108,233", fill: "var(--ept-gold)" }));
    svgText(doc, svg, "MCU / 传感器 / 总线负载", 332, 210, { "font-size": 10.5, "text-anchor": "middle", fill: "var(--ept-gold)" });
    svgText(doc, svg, "回流", 96, 246, { "font-size": 10.5, "text-anchor": "middle", fill: "var(--ept-gold)" });
    svg.appendChild(svgElement(doc, "path", { d: "M110 275 C175 248 250 248 330 275", fill: "none", stroke: "var(--ept-blue)", "stroke-width": 2, "stroke-dasharray": "7 5" }));
    svgText(doc, svg, "去耦不是理想短路：ESR/ESL 与位置会进瞬态", 205, 298, { "font-size": 10.5, "text-anchor": "middle" });
  }
  function drawTransient(doc, svg, result) {
    var left = 445, right = 822, high = 108, base = 235;
    svg.appendChild(svgElement(doc, "rect", { x: 430, y: 36, width: 410, height: 284, rx: 6, fill: "var(--bg,transparent)", stroke: "currentColor", "stroke-opacity": ".25" }));
    svgText(doc, svg, "负载阶跃：电容、ESR 与被动时间尺度", 445, 61, { "font-size": 13, "font-weight": 700 });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: base, x2: right, y2: base, stroke: "currentColor", "stroke-opacity": ".4" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: 86, x2: left, y2: base, stroke: "currentColor", "stroke-opacity": ".4" }));
    var span = right - left - 15;
    var scale = Math.max(result.config.transientBudgetmV, result.totalDroopmV, 1);
    var droopY = base - 80 * result.totalDroopmV / scale;
    var esrY = droopY + 80 * result.esrDroopmV / scale;
    var holdFraction = 0.43;
    var startX = left + 24;
    var endX = startX + span * holdFraction;
    svg.appendChild(svgElement(doc, "path", { d: "M" + left + " " + (base - 80) + " L" + startX + " " + (base - 80) + " L" + startX + " " + esrY + " L" + (startX + 5) + " " + droopY + " C" + (startX + 40) + " " + droopY + " " + (endX - 32) + " " + droopY + " " + endX + " " + (droopY + (base - droopY) * 0.2) + " C" + (endX + 35) + " " + (droopY + (base - droopY) * 0.85) + " " + (endX + 56) + " " + (base - 70) + " " + (endX + 76) + " " + (base - 80), fill: "none", stroke: "var(--ept-red)", "stroke-width": 3 }));
    var budgetY = base - 80 * result.config.transientBudgetmV / scale;
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: budgetY, x2: right - 8, y2: budgetY, stroke: "var(--ept-gold)", "stroke-width": 2, "stroke-dasharray": "7 5" }));
    svgText(doc, svg, "额定输出", left + 5, base - 88, { "font-size": 10.5, fill: "var(--ept-green)" });
    svgText(doc, svg, "ESR 瞬时跳变", startX + 8, esrY - 8, { "font-size": 10, fill: "var(--ept-gold)" });
    svgText(doc, svg, "总下陷", startX + 8, droopY - 8, { "font-size": 10, fill: "var(--ept-red)" });
    svgText(doc, svg, "预算 " + format(result.config.transientBudgetmV, 0) + " mV", right - 8, budgetY - 8, { "font-size": 10.5, "text-anchor": "end", fill: "var(--ept-gold)" });
    svgText(doc, svg, "ΔI " + format(result.config.stepmA, 0) + " mA", startX, 278, { "font-size": 10.5 });
    svgText(doc, svg, "保持 " + format(result.config.holdUs, 0) + " μs", endX, 278, { "font-size": 10.5, "text-anchor": "middle" });
    svgText(doc, svg, "Rload·C≈" + format(result.loadCapacitiveTimescaleMs, 3) + " ms", right - 8, 298, { "font-size": 10.5, "text-anchor": "end", fill: "var(--ept-blue)" });
  }
  function draw(doc, svg, result) {
    clear(svg); svg.setAttribute("viewBox", "0 0 860 340"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "低压电源树和负载瞬态下陷示意");
    svg.appendChild(svgElement(doc, "title", {}, "电源树与负载瞬态"));
    svg.appendChild(svgElement(doc, "desc", {}, "左侧从低压输入经过 LDO 或 buck 教学模型到可达输出 rail 和负载回流，右侧显示负载阶跃造成的 ESR 跳变、电容下陷、负载电容被动时间尺度和教学预算。"));
    drawTree(doc, svg, result); drawTransient(doc, svg, result);
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "ept-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, target, result) {
    clear(target);
    var rows = [
      ["稳压器", result.config.regulator === "SWITCH" ? "buck 教学模型" : "LDO", result.feasible ? "输入/压降教学条件可行" : "输入或压降余量不足"],
      ["输入电流", format(result.inputCurrentmA, 2), "mA；含/折算静态电流"],
      ["额定 Vout / 可达 Vout", format(result.requestedVoutV, 2) + " / " + format(result.reachableVoutV, 2), "V；dropout/buck 可达边界"],
      ["额定输出账本", result.ratedOutputValid ? format(result.requestedOutputPowerW, 3) + " W（有效）" : "无效；未按额定 Vout 计能量", "Vout × Iout；无效时只看可达输出"],
      ["实际输出功率", format(result.outputPowerW, 3), "W；可达 Vout × Iout"],
      ["输入功率", format(result.inputPowerW, 3), "W；教学效率/电流模型"],
      ["损耗", format(result.lossPowerW, 3), "W；发热数量级"],
      ["效率", format(result.efficiencyPct, 1), "%；能量守恒账本，不是器件曲线"],
      ["压降余量", format(result.dropoutMarginV, 2), "V；Vin − Vout − Vdropout"],
      ["电容下陷", format(result.capacitorDroopmV, 1), "mV；ΔIΔt/C"],
      ["ESR 下陷", format(result.esrDroopmV, 1), "mV；ΔI·ESR"],
      ["负载电容被动时间尺度", format(result.loadCapacitiveTimescaleMs, 3), "ms；Rload·C，不代表控制环动态响应"],
      ["总下陷 / 余量", format(result.totalDroopmV, 1) + " / " + format(result.transientMarginmV, 1), "mV；预算为教学输入"],
      ["能量账本", result.energyBalancePass ? "通过" : "不通过", "Pin ≥ Pout 且效率 ≤ 100%"]
    ];
    var table = element(doc, "table", { "aria-label": "电源树与瞬态账本" });
    table.appendChild(element(doc, "caption", { text: "电源树与瞬态账本" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])));
    var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    table.appendChild(body); target.appendChild(table);
  }
  function addSelect(doc, controls, state, field, labelText, options, onChange) {
    var id = NAME + "-" + (++INSTANCE) + "-" + field; var label = element(doc, "label", { htmlFor: id, text: labelText }); var select = element(doc, "select", { id: id, "aria-label": labelText });
    options.forEach(function (option) { select.appendChild(element(doc, "option", { value: option[0], text: option[1] })); }); select.value = state[field]; select.addEventListener("change", function () { state[field] = select.value; onChange(); });
    controls.appendChild(element(doc, "div", { className: "ept-control" }, [label, select]));
  }
  function addRange(doc, controls, state, field, labelText, min, max, step, unit, onChange) {
    var id = NAME + "-" + (++INSTANCE) + "-" + field; var output = element(doc, "output", { text: "" }); var label = element(doc, "label", { htmlFor: id, text: labelText }); var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, value: state[field], "aria-label": labelText });
    input.addEventListener("input", function () { state[field] = Number(input.value); onChange(); }); controls.appendChild(element(doc, "div", { className: "ept-control" }, [label, output, input])); return { input: input, output: output, unit: unit };
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc);
    var state = { regulator: DEFAULTS.regulator, vinV: DEFAULTS.vinV, voutV: DEFAULTS.voutV, loadmA: DEFAULTS.loadmA, iqmA: DEFAULTS.iqmA, dropoutV: DEFAULTS.dropoutV, efficiencyPct: DEFAULTS.efficiencyPct, capUf: DEFAULTS.capUf, esrMOhm: DEFAULTS.esrMOhm, stepmA: DEFAULTS.stepmA, holdUs: DEFAULTS.holdUs, transientBudgetmV: DEFAULTS.transientBudgetmV, predictions: {}, revealed: false, feedback: "请先完成三项方向预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "ept-shell" }); shell.appendChild(element(doc, "h3", { text: "电源树实验：效率、静态电流与负载瞬态" })); shell.appendChild(element(doc, "p", { className: "ept-note", text: "先判断压降、功率和电容项的方向，再打开稳压器和负载参数。" }));
    var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) {
      var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "ept-choice-grid", role: "group", "aria-label": question.prompt }); var buttons = [];
      question.choices.forEach(function (item) { var button = element(doc, "button", { type: "button", text: item[1], "aria-pressed": "false" }); button.value = item[0]; button.addEventListener("click", function () { state.predictions[question.key] = item[0]; buttons.forEach(function (other) { other.setAttribute("aria-pressed", other.value === item[0] ? "true" : "false"); }); updateGate(); }); buttons.push(button); grid.appendChild(button); });
      groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "ept-actions" }); var reveal = element(doc, "button", { type: "button", className: "ept-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "ept-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback); shell.appendChild(element(doc, "p", { className: "cl-sr-only", "data-ept-live": true, "aria-live": "polite" }));
    var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "ept-controls" }); addSelect(doc, controls, state, "regulator", "稳压方式", [["LDO", "LDO"], ["SWITCH", "buck 开关稳压器"]], renderResult); var refs = {};
    refs.vinV = addRange(doc, controls, state, "vinV", "输入 Vin", 2.5, 12, 0.1, " V", renderResult); refs.voutV = addRange(doc, controls, state, "voutV", "输出 Vout", 1, 5.5, 0.1, " V", renderResult); refs.loadmA = addRange(doc, controls, state, "loadmA", "负载 Iout", 1, 300, 1, " mA", renderResult); refs.iqmA = addRange(doc, controls, state, "iqmA", "静态 Iq", 0.01, 5, 0.01, " mA", renderResult); refs.dropoutV = addRange(doc, controls, state, "dropoutV", "压降输入", 0.05, 1, 0.05, " V", renderResult); refs.efficiencyPct = addRange(doc, controls, state, "efficiencyPct", "开关效率", 60, 98, 1, " %", renderResult); refs.capUf = addRange(doc, controls, state, "capUf", "输出电容 C", 1, 100, 1, " μF", renderResult); refs.esrMOhm = addRange(doc, controls, state, "esrMOhm", "ESR", 5, 300, 5, " mΩ", renderResult); refs.stepmA = addRange(doc, controls, state, "stepmA", "负载阶跃 ΔI", 1, 200, 1, " mA", renderResult); refs.holdUs = addRange(doc, controls, state, "holdUs", "阶跃持续", 1, 100, 1, " μs", renderResult); refs.transientBudgetmV = addRange(doc, controls, state, "transientBudgetmV", "瞬态教学预算", 20, 400, 5, " mV", renderResult); results.appendChild(controls);
    var layout = element(doc, "div", { className: "ept-layout" }); var stage = element(doc, "div", { className: "ept-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "ept-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "ept-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "ept-note", text: "结果是教学模型；输出电容稳定性、开关节点 EMI 和器件热阻仍需回到实物证据。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function updateGate() { reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() {
      var result = computePower(state); results.hidden = !state.revealed;
      Object.keys(refs).forEach(function (key) { refs[key].output.textContent = format(result.config[key], key === "efficiencyPct" || key === "transientBudgetmV" ? 0 : key === "iqmA" ? 2 : key === "capUf" || key === "stepmA" || key === "holdUs" || key === "loadmA" || key === "esrMOhm" ? 0 : 2) + refs[key].unit; });
      draw(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "损耗", format(result.lossPowerW, 3) + " W")); metrics.appendChild(metric(doc, "效率", format(result.efficiencyPct, 1) + " %")); metrics.appendChild(metric(doc, "总下陷", format(result.totalDroopmV, 1) + " mV")); metrics.appendChild(metric(doc, "状态", result.interpretation)); renderTable(doc, tableWrap, result); feedback.textContent = state.feedback;
    }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) return; var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 项命中。先看可行性，再看瞬态和热。"; renderResult(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { Object.keys(DEFAULTS).forEach(function (key) { state[key] = DEFAULTS[key]; }); state.predictions = {}; state.revealed = false; state.feedback = "请先完成三项方向预测。"; controls.querySelectorAll("select").forEach(function (select) { var field = select.id.slice((NAME + "-").length).split("-").slice(1).join("-"); select.value = state[field]; }); Object.keys(refs).forEach(function (key) { refs[key].input.value = state[key]; }); groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); updateGate(); renderResult(); announce(api, rootNode, "电源树实验已重置。"); });
    renderResult(); updateGate();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var base = computePower(DEFAULTS);
    check(near(base.outputPowerW, 0.264), "output power"); check(near(base.capacitorDroopmV, 120), "capacitive droop"); check(near(base.esrDroopmV, 3), "ESR droop"); check(near(base.totalDroopmV, 123), "total transient droop"); check(near(base.dropoutMarginV, 1.5), "dropout margin"); check(base.feasible && base.ratedOutputValid && base.energyBalancePass && base.transientPass, "default is inside teaching gates");
    check(computePower({ regulator: "SWITCH" }).efficiencyPct > base.efficiencyPct, "buck model improves efficiency at default input"); check(computePower({ capUf: 20 }).capacitorDroopmV < base.capacitorDroopmV, "larger capacitance reduces droop");
    var invalidLdo = computePower({ vinV: 3.3, voutV: 3.3, regulator: "LDO" });
    check(!invalidLdo.ratedOutputValid && near(invalidLdo.reachableVoutV, 3.1), "unadjustable LDO exposes reachable output"); check(invalidLdo.efficiencyPct <= 100 && invalidLdo.outputPowerW <= invalidLdo.inputPowerW, "dropout case preserves energy balance"); check(!invalidLdo.feasible, "dropout boundary fails rated output");
    check(computePower({ vinV: 3.3, voutV: 3.3, regulator: "SWITCH" }).outputPowerW === 0, "buck cannot boost in the teaching model"); check(JSON.stringify(computePower(DEFAULTS)) === JSON.stringify(computePower(DEFAULTS)), "deterministic result");
    return { checks: checks };
  }
  return { NAME: NAME, DEFAULTS: DEFAULTS, compute: computePower, computePower: computePower, mount: mount, selfTest: selfTest };
});
