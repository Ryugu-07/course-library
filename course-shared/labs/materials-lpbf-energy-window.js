(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-lpbf-energy-window", exported.mount);
  }
  if (typeof module === "object" && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-lpbf-energy-window self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-lpbf-energy-window self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "materials-lpbf-energy-window";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-lpbf-energy-window-styles";
  var E_LOF = 45;
  var E_KEYHOLE = 110;
  var E_WIDTH = 15;
  var DEFAULTS = {
    powerW: 200,
    speedMmPerS: 800,
    hatchMm: 0.1,
    layerMm: 0.03,
    packingFraction: 0.60
  };
  var STYLE_TEXT = [
    '[data-learning-lab="' + LAB_ID + '"]{--mp-blue:#2563a6;--mp-red:#b64335;--mp-green:#39734d;--mp-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
    '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}',
    '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="' + LAB_ID + '"] .mp-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit}',
    '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mp-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mp-primary{border-color:var(--mp-blue);background:var(--mp-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .mp-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mp-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .mp-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mp-warn{color:var(--mp-red)}',
    '[data-learning-lab="' + LAB_ID + '"] .mp-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;align-items:end;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .mp-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mp-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mp-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mp-blue)}',
    '[data-learning-lab="' + LAB_ID + '"] .mp-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(270px,.75fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="' + LAB_ID + '"] .mp-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="' + LAB_ID + '"] .mp-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:540px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mp-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mp-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mp-grid{grid-template-columns:1fr}}@media(max-width:680px){[data-learning-lab="' + LAB_ID + '"] .mp-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mp-choice-grid{grid-template-columns:1fr}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .mp-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
    if (config.powerW <= 0 || config.powerW > 1e5) throw new RangeError("laser power must be in (0, 1e5] W");
    if (config.speedMmPerS <= 0 || config.speedMmPerS > 1e6) throw new RangeError("scan speed must be in (0, 1e6] mm/s");
    if (config.hatchMm <= 0 || config.hatchMm > 10) throw new RangeError("hatch spacing must be in (0, 10] mm");
    if (config.layerMm <= 0 || config.layerMm > 10) throw new RangeError("layer thickness must be in (0, 10] mm");
    if (config.packingFraction <= 0 || config.packingFraction > 1) throw new RangeError("packing fraction must be in (0, 1]");
    return config;
  }

  function energyDensityJPerMm3(input) {
    var config = normalizeConfig(input);
    return config.powerW / (config.speedMmPerS * config.hatchMm * config.layerMm);
  }

  function defectProxies(energyDensity, packingFraction) {
    var energy = finite(energyDensity, "volumetric energy density");
    var packing = finite(packingFraction, "packing fraction");
    if (energy < 0 || packing <= 0 || packing > 1) throw new RangeError("proxy inputs are outside their domain");
    var lackOfFusionProxy = clamp(1 - packing * (1 - Math.exp(-energy / E_LOF)), 0, 1);
    var keyholeProxy = 1 / (1 + Math.exp(-(energy - E_KEYHOLE) / E_WIDTH));
    var consolidationProxy = clamp((1 - lackOfFusionProxy) * (1 - keyholeProxy), 0, 1);
    return {
      lackOfFusionProxy: lackOfFusionProxy,
      keyholeProxy: keyholeProxy,
      consolidationProxy: consolidationProxy,
      lowerReferenceJPerMm3: E_LOF,
      upperReferenceJPerMm3: E_KEYHOLE
    };
  }

  function lpbfLedger(input) {
    var config = normalizeConfig(input);
    var energyDensity = energyDensityJPerMm3(config);
    return { config: config, energyDensityJPerMm3: energyDensity, proxies: defectProxies(energyDensity, config.packingFraction) };
  }

  function speedSweep(input, count) {
    var config = normalizeConfig(input);
    var samples = count === undefined ? 81 : Math.max(3, Math.round(finite(count, "sweep count")));
    var points = [];
    var minimumSpeed = Math.max(20, config.speedMmPerS * 0.25);
    var maximumSpeed = Math.max(minimumSpeed * 1.1, config.speedMmPerS * 2.25);
    for (var index = 0; index < samples; index += 1) {
      var speed = minimumSpeed + (maximumSpeed - minimumSpeed) * index / (samples - 1);
      var energy = config.powerW / (speed * config.hatchMm * config.layerMm);
      var proxies = defectProxies(energy, config.packingFraction);
      points.push({ speedMmPerS: speed, energyDensityJPerMm3: energy, lackOfFusionProxy: proxies.lackOfFusionProxy, keyholeProxy: proxies.keyholeProxy, consolidationProxy: proxies.consolidationProxy });
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
        key: "speed",
        prompt: "在 P、h、t 固定时，把扫描速度 v 加倍，E_v 会怎样？",
        expected: "half",
        choices: [
          { value: "half", label: "减半" },
          { value: "double", label: "加倍" },
          { value: "same", label: "保持不变" }
        ]
      },
      {
        key: "universal",
        prompt: "对不同粉末、吸收率和热历史，E_v 更合适的身份是？",
        expected: "coarse",
        choices: [
          { value: "coarse", label: "有单位的粗筛指标，不是通用窗口预测器" },
          { value: "universal", label: "任何设备都通用的致密度定律" },
          { value: "irrelevant", label: "与参数完全无关的装饰量" }
        ]
      },
      {
        key: "high",
        prompt: "若 E_v 远高于本实验的上参考值，哪个代理风险会升高？",
        expected: "keyhole",
        choices: [
          { value: "keyhole", label: "匙孔/蒸发反冲代理风险" },
          { value: "lof", label: "未熔合代理一定升高" },
          { value: "none", label: "所有缺陷代理都变成零" }
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
      hostNode.appendChild(element(doc, "fieldset", {}, [element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }), element(doc, "div", { className: "mp-choice-grid" }, buttons)]));
    });
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 840 440", role: "img", "aria-label": "LPBF 体积能量密度和缺陷代理图" });
    svg.appendChild(svgElement(doc, "title", {}, "LPBF 粗体积能量密度与缺陷代理"));
    svg.appendChild(svgElement(doc, "desc", {}, "左侧显示当前 E_v 与低能量和高能量参考区间，右侧显示扫描速度变化时的未熔合、匙孔和固结代理；这些是教学代理而非工艺窗口。"));
    var left = { x: 55, y: 58, width: 300, height: 280 };
    var right = { x: 420, y: 58, width: 360, height: 280 };
    svg.appendChild(svgElement(doc, "rect", { x: left.x, y: left.y, width: left.width, height: left.height, fill: "none", stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "rect", { x: right.x, y: right.y, width: right.width, height: right.height, fill: "none", stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "text", { x: left.x + 5, y: 30, "font-size": 15, "font-weight": 700 }, "当前体积能量密度"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + 5, y: 30, "font-size": 15, "font-weight": 700 }, "速度扫频：proxy（无量纲）"));
    var maxEnergy = Math.max(E_KEYHOLE * 1.5, result.energyDensityJPerMm3 * 1.15);
    function mapEnergy(value) { return left.x + 30 + (left.width - 55) * Math.min(maxEnergy, value) / maxEnergy; }
    var y = left.y + 82;
    var barWidth = left.width - 60;
    [
      { label: "E_v", value: result.energyDensityJPerMm3, color: "#2563a6" },
      { label: "未熔合 proxy", value: result.proxies.lackOfFusionProxy * maxEnergy, color: "#b64335" },
      { label: "匙孔 proxy", value: result.proxies.keyholeProxy * maxEnergy, color: "#9b6a12" }
    ].forEach(function (item) {
      svg.appendChild(svgElement(doc, "text", { x: left.x + 7, y: y + 20, "font-size": 11 }, item.label));
      svg.appendChild(svgElement(doc, "rect", { x: left.x + 30, y: y, width: Math.max(1, barWidth * Math.min(maxEnergy, item.value) / maxEnergy), height: 32, fill: item.color }));
      svg.appendChild(svgElement(doc, "text", { x: left.x + 35 + barWidth * Math.min(maxEnergy, item.value) / maxEnergy, y: y + 21, "font-size": 11 }, item.label === "E_v" ? format(item.value, 2) + " J/mm³" : format(item.value / maxEnergy, 3)));
      y += 57;
    });
    svg.appendChild(svgElement(doc, "line", { x1: mapEnergy(E_LOF), y1: left.y + 42, x2: mapEnergy(E_LOF), y2: left.y + left.height - 25, stroke: "#b64335", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "line", { x1: mapEnergy(E_KEYHOLE), y1: left.y + 42, x2: mapEnergy(E_KEYHOLE), y2: left.y + left.height - 25, stroke: "#9b6a12", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "text", { x: mapEnergy(E_LOF) + 3, y: left.y + 30, "font-size": 10 }, "45 J/mm³ ref"));
    svg.appendChild(svgElement(doc, "text", { x: mapEnergy(E_KEYHOLE) + 3, y: left.y + 30, "font-size": 10 }, "110 J/mm³ ref"));
    var sweep = speedSweep(result.config);
    var minSpeed = sweep[0].speedMmPerS;
    var maxSpeed = sweep[sweep.length - 1].speedMmPerS;
    function mapX(speed) { return right.x + 36 + (right.width - 58) * (speed - minSpeed) / (maxSpeed - minSpeed); }
    function mapY(value) { return right.y + right.height - 35 - (right.height - 70) * value; }
    [
      { key: "lackOfFusionProxy", color: "#b64335", label: "未熔合" },
      { key: "keyholeProxy", color: "#9b6a12", label: "匙孔" },
      { key: "consolidationProxy", color: "#39734d", label: "固结" }
    ].forEach(function (line) {
      var path = [];
      sweep.forEach(function (point, index) { path.push((index ? "L" : "M") + mapX(point.speedMmPerS).toFixed(2) + " " + mapY(point[line.key]).toFixed(2)); });
      svg.appendChild(svgElement(doc, "path", { d: path.join(" "), fill: "none", stroke: line.color, "stroke-width": 2.8 }));
    });
    var currentX = mapX(result.config.speedMmPerS);
    svg.appendChild(svgElement(doc, "line", { x1: currentX, y1: right.y, x2: currentX, y2: right.y + right.height, stroke: "#2563a6", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "text", { x: right.x + 7, y: right.y + 18, "font-size": 11 }, "红未熔合；金匙孔；绿固结；蓝线当前 v"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + right.width, y: right.y + right.height - 12, "font-size": 11, "text-anchor": "end" }, "v / mm·s⁻¹"));
    svg.appendChild(svgElement(doc, "text", { x: right.x - 8, y: right.y + 15, "font-size": 11, transform: "rotate(-90 " + (right.x - 8) + " " + (right.y + 15) + ")" }, "proxy"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + right.width, y: right.y + right.height + 37, "font-size": 11, "text-anchor": "end" }, "阈值为本教学代理的参考，不是设备通用窗口"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var rows = [
      ["激光功率 P", format(result.config.powerW, 2), "W = J/s"],
      ["扫描速度 v", format(result.config.speedMmPerS, 2), "mm/s"],
      ["道间距 h / 层厚 t", format(result.config.hatchMm, 3) + " / " + format(result.config.layerMm, 3), "mm；参数单位不可省略"],
      ["粉末堆积率 φ", format(result.config.packingFraction, 3), "无量纲；粉末床几何代理"],
      ["E_v = P/(vht)", format(result.energyDensityJPerMm3, 5), "J/mm³；粗体积能量密度"],
      ["未熔合风险 proxy", format(result.proxies.lackOfFusionProxy, 5), "无量纲；低 E_v 与低 φ 的教学代理"],
      ["匙孔风险 proxy", format(result.proxies.keyholeProxy, 5), "无量纲；高 E_v logistic 代理"],
      ["固结 proxy", format(result.proxies.consolidationProxy, 5), "无量纲；(1−未熔合)(1−匙孔)"],
      ["参考区间", E_LOF + "–" + E_KEYHOLE, "J/mm³；本脚本的 regime-specific 教学参考"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "LPBF 参数、能量和缺陷代理证据账本" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]),
      body
    ]));
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "mp-shell" });
    shell.appendChild(element(doc, "h3", { text: "互动实验：L-PBF 粗体积能量密度与缺陷代理" }));
    shell.appendChild(element(doc, "p", { className: "mp-note", text: "先预测 E_v 的缩放、适用范围和高能量边界；揭示后调节 P、v、h、t 与粉末堆积率。" }));
    var predictionHost = element(doc, "div");
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "mp-actions" });
    var reveal = element(doc, "button", { type: "button", className: "mp-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "mp-feedback", role: "status", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "mp-controls" });
    var inputs = {};

    function addRange(key, label, min, max, step, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = finite(input.value, label);
        state.feedback = state.revealed ? "参数已更新；能量和缺陷代理已重新计算。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits };
      controls.appendChild(element(doc, "div", { className: "mp-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }

    addRange("powerW", "功率 P / W", "50", "400", "10", 0);
    addRange("speedMmPerS", "速度 v / mm·s⁻¹", "200", "1600", "20", 0);
    addRange("hatchMm", "道间距 h / mm", "0.05", "0.2", "0.005", 3);
    addRange("layerMm", "层厚 t / mm", "0.02", "0.08", "0.002", 3);
    addRange("packingFraction", "堆积率 φ", "0.45", "0.7", "0.01", 2);
    resultPanel.appendChild(controls);
    var chart = element(doc, "div", { className: "mp-chart" });
    var tableWrap = element(doc, "div", { className: "mp-table-wrap" });
    var note = element(doc, "p", { className: "mp-note" });
    resultPanel.appendChild(element(doc, "div", { className: "mp-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);
    renderPredictions(doc, predictionHost, state);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测；揭示前不显示能量曲线和缺陷证据账本。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。E_v 是粗筛指标，不是通用工艺窗口。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      renderPredictions(doc, predictionHost, state);
      render();
      announce(api, rootNode, "LPBF 预测、参数和证据账本已重置。");
    });

    function render() {
      var result = null;
      var error = null;
      try { result = lpbfLedger(state.config); } catch (caught) { error = caught; }
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
      });
      feedback.textContent = error ? "输入超出教学模型范围：" + error.message : state.feedback;
      feedback.className = "mp-feedback" + (error || state.feedback.indexOf("请先") === 0 ? " mp-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed || !result) {
        clear(chart);
        clear(tableWrap);
        note.textContent = error ? "请保持 P、v、h、t 为正，并将 φ 放在 0 与 1 之间。" : "完成三项预测并揭示后显示 E_v、扫频曲线和代理账本。";
        return;
      }
      clear(chart);
      chart.appendChild(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "边界：E_v = P/(vht) 只把激光功率平均到名义扫描体积，未显式包含反射、吸收率、熔池流动、预热、扫描策略、粉末形貌和热历史。45 与 110 J/mm³ 以及三个 proxy 是本实验的 regime-specific 教学参考，不能当作任何设备、粉末或合金的通用工艺窗口。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var base = lpbfLedger(DEFAULTS);
    check(near(base.energyDensityJPerMm3, 83.33333333333333), "default volumetric energy density has J/mm^3 units");
    check(near(energyDensityJPerMm3({ powerW: 400 }), base.energyDensityJPerMm3 * 2), "energy density doubles with power");
    check(near(energyDensityJPerMm3({ speedMmPerS: 1600 }), base.energyDensityJPerMm3 / 2), "energy density halves with scan speed");
    check(base.proxies.lackOfFusionProxy > 0 && base.proxies.keyholeProxy > 0, "defect proxies are finite and nonzero at the default");
    check(defectProxies(20, 0.6).lackOfFusionProxy > defectProxies(100, 0.6).lackOfFusionProxy, "low energy raises lack-of-fusion proxy");
    check(defectProxies(160, 0.6).keyholeProxy > defectProxies(60, 0.6).keyholeProxy, "high energy raises keyhole proxy");
    check(defectProxies(0, 0.6).lackOfFusionProxy === 1 && defectProxies(0, 0.6).consolidationProxy === 0, "zero energy is full lack-of-fusion and zero consolidation");
    check(defectProxies(83.33333333333333, 0.7).lackOfFusionProxy < base.proxies.lackOfFusionProxy, "higher packing reduces the lack-of-fusion proxy");
    check(speedSweep(DEFAULTS).length === 81 && JSON.stringify(speedSweep(DEFAULTS)) === JSON.stringify(speedSweep(DEFAULTS)), "speed sweep is deterministic");
    var nearLow = lpbfLedger({ powerW: 50, speedMmPerS: 1600, hatchMm: 0.2, layerMm: 0.08 });
    check(nearLow.energyDensityJPerMm3 < E_LOF, "low-energy boundary is reachable and visible");
    var nearHigh = lpbfLedger({ powerW: 400, speedMmPerS: 200, hatchMm: 0.05, layerMm: 0.02 });
    check(nearHigh.energyDensityJPerMm3 > E_KEYHOLE && nearHigh.proxies.keyholeProxy > 0.9, "high-energy boundary is reachable and visible");
    var threw = false;
    try { normalizeConfig({ speedMmPerS: 0 }); } catch (error) { threw = true; }
    check(threw, "zero scan speed is rejected");
    threw = false;
    try { normalizeConfig({ packingFraction: 1.2 }); } catch (error2) { threw = true; }
    check(threw, "packing fraction above one is rejected");
    threw = false;
    try { defectProxies(-1, 0.6); } catch (error3) { threw = true; }
    check(threw, "negative energy is rejected by the proxy model");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    normalizeConfig: normalizeConfig,
    energyDensityJPerMm3: energyDensityJPerMm3,
    defectProxies: defectProxies,
    speedSweep: speedSweep,
    lpbfLedger: lpbfLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
