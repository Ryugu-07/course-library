(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-battery-ragone-ledger", exported.mount);
  }
  if (typeof module === "object" && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-battery-ragone-ledger self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-battery-ragone-ledger self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "materials-battery-ragone-ledger";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-battery-ragone-ledger-styles";
  var R_g = 8.31446261815324;
  var FARADAY = 96485.33212;
  var DEFAULTS = {
    standardVoltageV: 3.7,
    temperatureK: 298.15,
    electrons: 1,
    reactionQuotient: 1,
    currentA: 60,
    internalResistanceMOhm: 8,
    nominalCapacityAh: 50,
    massKg: 1,
    cycles: 400,
    fadeCoeffPerSqrtCycle: 0.005
  };
  var STYLE_TEXT = [
    '[data-learning-lab="' + LAB_ID + '"]{--mb-blue:#2563a6;--mb-red:#b64335;--mb-green:#39734d;--mb-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
    '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}',
    '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="' + LAB_ID + '"] .mb-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit}',
    '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mb-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mb-primary{border-color:var(--mb-blue);background:var(--mb-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .mb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mb-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .mb-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mb-warn{color:var(--mb-red)}',
    '[data-learning-lab="' + LAB_ID + '"] .mb-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;align-items:end;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .mb-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mb-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mb-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mb-blue)}',
    '[data-learning-lab="' + LAB_ID + '"] .mb-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(270px,.75fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="' + LAB_ID + '"] .mb-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="' + LAB_ID + '"] .mb-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:560px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mb-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mb-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mb-grid{grid-template-columns:1fr}}@media(max-width:700px){[data-learning-lab="' + LAB_ID + '"] .mb-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mb-choice-grid{grid-template-columns:1fr}}@media(max-width:430px){[data-learning-lab="' + LAB_ID + '"] .mb-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
  ].join("");

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function finite(value, label) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 5));
    if (places === 0) return value.toFixed(0);
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function copyDefaults() {
    var copy = {};
    Object.keys(DEFAULTS).forEach(function (key) { copy[key] = DEFAULTS[key]; });
    return copy;
  }

  function normalizeConfig(input) {
    var source = input || {};
    var config = copyDefaults();
    Object.keys(config).forEach(function (key) {
      if (source[key] !== undefined) config[key] = finite(source[key], key);
    });
    if (config.standardVoltageV <= 0 || config.standardVoltageV > 10) throw new RangeError("standard voltage must be in (0, 10] V");
    if (config.temperatureK <= 0 || config.temperatureK > 1000) throw new RangeError("temperature must be positive in K");
    if (config.electrons <= 0 || config.electrons > 10) throw new RangeError("electron number must be in (0, 10]");
    if (config.reactionQuotient <= 0 || config.reactionQuotient > 1e6) throw new RangeError("reaction quotient must be positive");
    if (config.currentA < 0 || config.currentA > 1000) throw new RangeError("current must be in [0, 1000] A");
    if (config.internalResistanceMOhm < 0 || config.internalResistanceMOhm > 1000) throw new RangeError("internal resistance must be in [0, 1000] mOhm");
    if (config.nominalCapacityAh <= 0 || config.nominalCapacityAh > 1e6) throw new RangeError("capacity must be positive in Ah");
    if (config.massKg <= 0 || config.massKg > 1e6) throw new RangeError("mass must be positive in kg");
    if (config.cycles < 0 || config.cycles > 1e8) throw new RangeError("cycle count must be non-negative");
    if (config.fadeCoeffPerSqrtCycle < 0 || config.fadeCoeffPerSqrtCycle > 1) throw new RangeError("fade coefficient must be in [0, 1] per sqrt cycle");
    return config;
  }

  function reversibleVoltageV(input) {
    var config = normalizeConfig(input);
    return config.standardVoltageV - (R_g * config.temperatureK / (config.electrons * FARADAY)) * Math.log(config.reactionQuotient);
  }

  function fadeProxy(input) {
    var config = normalizeConfig(input);
    return clamp(config.fadeCoeffPerSqrtCycle * Math.sqrt(config.cycles), 0, 0.95);
  }

  function batteryLedger(input) {
    var config = normalizeConfig(input);
    var reversible = reversibleVoltageV(config);
    var ohmicDrop = config.currentA * config.internalResistanceMOhm / 1000;
    var loadedVoltage = reversible - ohmicDrop;
    if (loadedVoltage <= 0) throw new RangeError("loaded voltage is non-positive; reduce current or resistance");
    var fade = fadeProxy(config);
    var effectiveCapacity = config.nominalCapacityAh * (1 - fade);
    var energyWh = loadedVoltage * effectiveCapacity;
    var powerW = loadedVoltage * config.currentA;
    return {
      config: config,
      reversibleVoltageV: reversible,
      ohmicDropV: ohmicDrop,
      loadedVoltageV: loadedVoltage,
      fadeProxy: fade,
      nominalCapacityAh: config.nominalCapacityAh,
      effectiveCapacityAh: effectiveCapacity,
      energyWh: energyWh,
      powerW: powerW,
      specificEnergyWhPerKg: energyWh / config.massKg,
      specificPowerWPerKg: powerW / config.massKg,
      workingPointProxy: "rectangular constant-voltage working point: V_load held over C_eff"
    };
  }

  function ragoneSweep(input, count) {
    var config = normalizeConfig(input);
    var samples = count === undefined ? 61 : Math.max(3, Math.round(finite(count, "sweep count")));
    var reversible = reversibleVoltageV(config);
    var resistanceOhm = config.internalResistanceMOhm / 1000;
    var fade = fadeProxy(config);
    var capacity = config.nominalCapacityAh * (1 - fade);
    var points = [];
    for (var index = 0; index < samples; index += 1) {
      var cRate = 0.05 + 1.95 * index / (samples - 1);
      var current = cRate * config.nominalCapacityAh;
      var voltage = Math.max(0, reversible - current * resistanceOhm);
      points.push({ cRate: cRate, currentA: current, loadedVoltageV: voltage, specificEnergyWhPerKg: voltage * capacity / config.massKg, specificPowerWPerKg: voltage * current / config.massKg });
    }
    return points;
  }

  function element(doc, tag, attributes, children) {
    var node = doc.createElement(tag);
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attributes, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
  }

  function questionSpecs() {
    return [
      {
        key: "current",
        prompt: "在可用工作区内提高电流，加载电压 Vload 的趋势是？",
        expected: "fall",
        choices: [
          { value: "fall", label: "因 IR 压降增大而下降" },
          { value: "rise", label: "因功率增大而上升" },
          { value: "same", label: "与电流无关，等于 Erev" }
        ]
      },
      {
        key: "nernst",
        prompt: "在这个分离的模型中，改变电流首先改变哪一项？",
        expected: "loaded",
        choices: [
          { value: "loaded", label: "加载电压；Nernst 可逆电压由 T 和 Q 给定" },
          { value: "reversible", label: "直接改变可逆电压，电阻不起作用" },
          { value: "capacity", label: "立刻把名义容量变成零" }
        ]
      },
      {
        key: "fade",
        prompt: "提高循环数时，脚本中明确标注的 fade proxy 主要影响什么？",
        expected: "capacity",
        choices: [
          { value: "capacity", label: "有效容量，进而影响能量账本" },
          { value: "reversible", label: "直接把 Erev 当成衰减后的实测电压" },
          { value: "none", label: "什么也不影响，因为循环只是标签" }
        ]
      }
    ];
  }

  function renderPredictions(doc, hostNode, state) {
    clear(hostNode);
    questionSpecs().forEach(function (spec, index) {
      var buttons = spec.choices.map(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": state.predictions[spec.key] === choice.value ? "true" : "false" });
        button.addEventListener("click", function () {
          state.predictions[spec.key] = choice.value;
          renderPredictions(doc, hostNode, state);
        });
        return button;
      });
      hostNode.appendChild(element(doc, "fieldset", {}, [element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }), element(doc, "div", { className: "mb-choice-grid" }, buttons)]));
    });
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 840 450", role: "img", "aria-label": "电池加载电压和 Ragone 权衡图" });
    svg.appendChild(svgElement(doc, "title", {}, "电池 Nernst/欧姆电压分解与 Ragone 代理"));
    svg.appendChild(svgElement(doc, "desc", {}, "左侧显示可逆电压、加载电压和欧姆压降随电流的关系，右侧显示比能量与比功率的电流权衡。"));
    var left = { x: 55, y: 58, width: 340, height: 285 };
    var right = { x: 465, y: 58, width: 320, height: 285 };
    svg.appendChild(svgElement(doc, "rect", { x: left.x, y: left.y, width: left.width, height: left.height, fill: "none", stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "rect", { x: right.x, y: right.y, width: right.width, height: right.height, fill: "none", stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "text", { x: left.x + 5, y: 30, "font-size": 15, "font-weight": 700 }, "电压分解：V / V"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + 5, y: 30, "font-size": 15, "font-weight": 700 }, "Ragone：比能量 / 比功率"));
    var sweep = ragoneSweep(result.config);
    var maxCurrent = sweep[sweep.length - 1].currentA;
    var maxVoltage = Math.max(result.reversibleVoltageV * 1.08, 1);
    function mapLeftX(current) { return left.x + 40 + (left.width - 62) * current / maxCurrent; }
    function mapLeftY(voltage) { return left.y + left.height - 35 - (left.height - 70) * voltage / maxVoltage; }
    var voltagePath = [];
    sweep.forEach(function (point, index) { voltagePath.push((index ? "L" : "M") + mapLeftX(point.currentA).toFixed(2) + " " + mapLeftY(point.loadedVoltageV).toFixed(2)); });
    svg.appendChild(svgElement(doc, "path", { d: voltagePath.join(" "), fill: "none", stroke: "#2563a6", "stroke-width": 3 }));
    var reversibleY = mapLeftY(result.reversibleVoltageV);
    svg.appendChild(svgElement(doc, "line", { x1: left.x + 40, y1: reversibleY, x2: left.x + left.width - 22, y2: reversibleY, stroke: "#39734d", "stroke-dasharray": "5 4" }));
    var currentX = mapLeftX(result.config.currentA);
    var currentY = mapLeftY(result.loadedVoltageV);
    svg.appendChild(svgElement(doc, "line", { x1: currentX, y1: left.y, x2: currentX, y2: left.y + left.height, stroke: "#9b6a12", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "circle", { cx: currentX, cy: currentY, r: 5, fill: "#b64335", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: left.x + 8, y: left.y + 18, "font-size": 11 }, "蓝 Vload；绿 Erev；金当前 I"));
    svg.appendChild(svgElement(doc, "text", { x: left.x + left.width, y: left.y + left.height - 11, "font-size": 11, "text-anchor": "end" }, "I / A"));
    svg.appendChild(svgElement(doc, "text", { x: left.x - 8, y: left.y + 15, "font-size": 11, transform: "rotate(-90 " + (left.x - 8) + " " + (left.y + 15) + ")" }, "电压 / V"));
    var maxPower = sweep.reduce(function (maximum, point) { return Math.max(maximum, point.specificPowerWPerKg); }, 0) * 1.08;
    var maxEnergy = sweep.reduce(function (maximum, point) { return Math.max(maximum, point.specificEnergyWhPerKg); }, 0) * 1.08;
    function mapRightX(power) { return right.x + 38 + (right.width - 58) * power / Math.max(maxPower, 1); }
    function mapRightY(energy) { return right.y + right.height - 35 - (right.height - 70) * energy / Math.max(maxEnergy, 1); }
    var ragonePath = [];
    sweep.forEach(function (point, index) { ragonePath.push((index ? "L" : "M") + mapRightX(point.specificPowerWPerKg).toFixed(2) + " " + mapRightY(point.specificEnergyWhPerKg).toFixed(2)); });
    svg.appendChild(svgElement(doc, "path", { d: ragonePath.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 3 }));
    var selectedPoint = sweep.reduce(function (best, point) { return Math.abs(point.currentA - result.config.currentA) < Math.abs(best.currentA - result.config.currentA) ? point : best; }, sweep[0]);
    svg.appendChild(svgElement(doc, "circle", { cx: mapRightX(selectedPoint.specificPowerWPerKg), cy: mapRightY(selectedPoint.specificEnergyWhPerKg), r: 5, fill: "#2563a6", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: right.x + 8, y: right.y + 18, "font-size": 11 }, "红线：改变电流的简化 Ragone 轨迹"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + right.width, y: right.y + right.height - 11, "font-size": 11, "text-anchor": "end" }, "比功率 / W·kg⁻¹"));
    svg.appendChild(svgElement(doc, "text", { x: right.x - 8, y: right.y + 15, "font-size": 11, transform: "rotate(-90 " + (right.x - 8) + " " + (right.y + 15) + ")" }, "比能量 / Wh·kg⁻¹"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + right.width, y: right.y + right.height + 34, "font-size": 11, "text-anchor": "end" }, "fade proxy = " + format(result.fadeProxy, 3) + "（无量纲）"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var rows = [
      ["可逆电压 Erev", format(result.reversibleVoltageV, 5), "V；Nernst：E0 − R_g T ln(Q_rxn)/(nF)"],
      ["欧姆压降 I R_int", format(result.ohmicDropV, 5), "V；I / A × R_int / Ω"],
      ["带载电压 Vload", format(result.loadedVoltageV, 5), "V；Erev − I R_int，不等于 Erev"],
      ["名义容量 C_nom", format(result.nominalCapacityAh, 4), "Ah；输入容量"],
      ["fade proxy", format(result.fadeProxy, 5), "无量纲；c√N 代理，不是实测衰减定律"],
      ["有效容量 C_eff", format(result.effectiveCapacityAh, 4), "Ah；C_nom × (1 − fade proxy)"],
      ["账本能量", format(result.energyWh, 4), "Wh；Vload × 有效容量"],
      ["比能量", format(result.specificEnergyWhPerKg, 4), "Wh/kg；以输入质量归一化"],
      ["比功率", format(result.specificPowerWPerKg, 4), "W/kg；Vload × I / mass"],
      ["工作点代理", "矩形恒压", "以 Vload 在 C_eff 上保持不变；不是完整放电瞬态"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "可逆、加载、容量与功率分离账本" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]),
      body
    ]));
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "mb-shell" });
    shell.appendChild(element(doc, "h3", { text: "互动实验：电池 Nernst/欧姆极化与 Ragone 账本" }));
    shell.appendChild(element(doc, "p", { className: "mb-note", text: "先区分 Erev、IR 压降、Vload、容量和 fade proxy；揭示后调节电流、温度、反应商、内阻与循环数。" }));
    var predictionHost = element(doc, "div");
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "mb-actions" });
    var reveal = element(doc, "button", { type: "button", className: "mb-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "mb-feedback", role: "status", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "mb-controls" });
    var inputs = {};

    function addRange(key, label, min, max, step, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = finite(input.value, label);
        state.feedback = state.revealed ? "电池参数已更新；电压、容量和 Ragone 账本已重算。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits };
      controls.appendChild(element(doc, "div", { className: "mb-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }

    addRange("standardVoltageV", "E0 / V", "3", "4.5", "0.05", 2);
    addRange("temperatureK", "温度 T / K", "250", "360", "1", 1);
    addRange("reactionQuotient", "反应商 Q_rxn", "0.1", "10", "0.1", 2);
    addRange("currentA", "电流 I / A", "0", "100", "2", 0);
    addRange("internalResistanceMOhm", "内阻 R_int / mΩ", "0", "20", "0.5", 1);
    addRange("nominalCapacityAh", "名义容量 C_nom / Ah", "10", "100", "2", 0);
    addRange("massKg", "质量 / kg", "0.25", "20", "0.25", 2);
    addRange("cycles", "循环数 N", "0", "1600", "50", 0);
    addRange("fadeCoeffPerSqrtCycle", "fade 系数 / √cycle", "0", "0.01", "0.0005", 4);
    resultPanel.appendChild(controls);
    var chart = element(doc, "div", { className: "mb-chart" });
    var tableWrap = element(doc, "div", { className: "mb-table-wrap" });
    var note = element(doc, "p", { className: "mb-note" });
    resultPanel.appendChild(element(doc, "div", { className: "mb-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);
    renderPredictions(doc, predictionHost, state);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测；揭示前不显示电压曲线、Ragone 图和分离账本。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。Erev、Vload、容量和 fade proxy 仍分开。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      renderPredictions(doc, predictionHost, state);
      render();
      announce(api, rootNode, "电池预测、参数和 Ragone 账本已重置。");
    });

    function render() {
      var result = null;
      var error = null;
      try { result = batteryLedger(state.config); } catch (caught) { error = caught; }
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
      });
      feedback.textContent = error ? "输入超出工作区：" + error.message : state.feedback;
      feedback.className = "mb-feedback" + (error || state.feedback.indexOf("请先") === 0 ? " mb-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed || !result) {
        clear(chart);
        clear(tableWrap);
        note.textContent = error ? "请降低电流/内阻，或调回可用的正加载电压。" : "完成三项预测并揭示后显示电压分解与比能量/比功率。";
        return;
      }
      clear(chart);
      chart.appendChild(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "边界：Nernst 式只表示给定 Q_rxn 和温度下的可逆电压；R_int 只提供最简单的欧姆极化，忽略电荷转移、扩散、温升和倍率相关容量。能量/功率使用矩形恒压工作点 proxy：把 Vload 在 C_eff 上视作不变，不是完整放电瞬态。fade proxy = c√N 是明确标注的教学衰减代理，不是某种电芯的寿命定律。比能量/比功率还受质量定义、热管理、封装和截止电压影响。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var base = batteryLedger(DEFAULTS);
    check(near(base.reversibleVoltageV, 3.7, 1e-12), "Q=1 gives standard reversible voltage");
    check(near(base.ohmicDropV, 0.48, 1e-12), "mOhm is converted to ohms for IR");
    check(near(base.loadedVoltageV, 3.22, 1e-12), "loaded voltage separates reversible voltage and IR drop");
    check(near(base.fadeProxy, 0.1, 1e-12) && near(base.effectiveCapacityAh, 45), "fade proxy changes effective capacity only");
    check(near(base.specificEnergyWhPerKg, 144.9, 1e-12), "specific energy uses loaded voltage and effective capacity at 1 kg");
    check(near(base.specificPowerWPerKg, 193.2, 1e-12), "specific power uses loaded voltage and current at 1 kg");
    check(base.workingPointProxy.indexOf("rectangular constant-voltage") !== -1, "energy ledger declares its rectangular constant-voltage proxy");
    check(reversibleVoltageV({ reactionQuotient: 2 }) < base.reversibleVoltageV, "Nernst reaction quotient changes reversible voltage");
    check(reversibleVoltageV({ temperatureK: 350, reactionQuotient: 2 }) < reversibleVoltageV({ temperatureK: 298.15, reactionQuotient: 2 }), "Nernst temperature term has the expected sign for Q>1");
    check(near(batteryLedger({ currentA: 0 }).loadedVoltageV, batteryLedger({ currentA: 0 }).reversibleVoltageV), "zero current removes ohmic drop");
    check(near(fadeProxy({ cycles: 0 }), 0), "zero cycles gives zero fade proxy");
    check(ragoneSweep(DEFAULTS).length === 61 && ragoneSweep(DEFAULTS)[0].specificPowerWPerKg < ragoneSweep(DEFAULTS)[60].specificPowerWPerKg, "Ragone sweep is deterministic and power increases with current");
    check(JSON.stringify(base) === JSON.stringify(batteryLedger(DEFAULTS)), "battery ledger is deterministic");
    var threw = false;
    try { normalizeConfig({ reactionQuotient: 0 }); } catch (error) { threw = true; }
    check(threw, "nonpositive reaction quotient is rejected");
    threw = false;
    try { batteryLedger({ currentA: 1000, internalResistanceMOhm: 1000 }); } catch (error2) { threw = true; }
    check(threw, "nonpositive loaded-voltage boundary is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    normalizeConfig: normalizeConfig,
    reversibleVoltageV: reversibleVoltageV,
    fadeProxy: fadeProxy,
    batteryLedger: batteryLedger,
    ragoneSweep: ragoneSweep,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
