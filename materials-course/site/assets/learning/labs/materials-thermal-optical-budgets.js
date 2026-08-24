(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-thermal-optical-budgets", exported.mount);
  }
  if (typeof module === "object" && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-thermal-optical-budgets self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-thermal-optical-budgets self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "materials-thermal-optical-budgets";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-thermal-optical-budgets-styles";
  var DEFAULTS = {
    areaM2: 0.01,
    heatW: 100,
    layer1ThicknessMm: 2,
    layer1K: 2,
    layer2ThicknessMm: 1,
    layer2K: 15,
    interfaceRpp: 0.0002,
    alpha1PerM: 120,
    alpha2PerM: 50
  };
  var STYLE_TEXT = [
    '[data-learning-lab="' + LAB_ID + '"]{--mt-blue:#2563a6;--mt-red:#b64335;--mt-green:#39734d;--mt-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
    '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}',
    '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="' + LAB_ID + '"] .mt-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit}',
    '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mt-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mt-primary{border-color:var(--mt-blue);background:var(--mt-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .mt-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mt-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .mt-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mt-warn{color:var(--mt-red)}',
    '[data-learning-lab="' + LAB_ID + '"] .mt-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;align-items:end;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .mt-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mt-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mt-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mt-blue)}',
    '[data-learning-lab="' + LAB_ID + '"] .mt-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="' + LAB_ID + '"] .mt-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="' + LAB_ID + '"] .mt-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mt-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mt-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mt-grid{grid-template-columns:1fr}}@media(max-width:680px){[data-learning-lab="' + LAB_ID + '"] .mt-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mt-choice-grid{grid-template-columns:1fr}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .mt-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
  ].join("");

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function finite(value, label) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
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
    if (config.areaM2 <= 0 || config.areaM2 > 10) throw new RangeError("area must be in (0, 10] m^2");
    if (config.heatW < 0 || config.heatW > 1e7) throw new RangeError("heat load must be in [0, 1e7] W");
    if (config.layer1ThicknessMm < 0 || config.layer1ThicknessMm > 100 || config.layer2ThicknessMm < 0 || config.layer2ThicknessMm > 100) throw new RangeError("layer thickness must be in [0, 100] mm");
    if (config.layer1K <= 0 || config.layer2K <= 0 || config.layer1K > 1e5 || config.layer2K > 1e5) throw new RangeError("conductivity must be positive in W/(m K)");
    if (config.interfaceRpp < 0 || config.interfaceRpp > 10) throw new RangeError("interface resistance must be in [0, 10] m^2 K/W");
    if (config.alpha1PerM < 0 || config.alpha2PerM < 0 || config.alpha1PerM > 1e8 || config.alpha2PerM > 1e8) throw new RangeError("attenuation coefficient must be non-negative in 1/m");
    return config;
  }

  function thermalBudget(input) {
    var config = normalizeConfig(input);
    var thickness1M = config.layer1ThicknessMm / 1000;
    var thickness2M = config.layer2ThicknessMm / 1000;
    var layer1ResistanceKPerW = thickness1M / (config.layer1K * config.areaM2);
    var interfaceResistanceKPerW = config.interfaceRpp / config.areaM2;
    var layer2ResistanceKPerW = thickness2M / (config.layer2K * config.areaM2);
    var totalResistanceKPerW = layer1ResistanceKPerW + interfaceResistanceKPerW + layer2ResistanceKPerW;
    return {
      areaM2: config.areaM2,
      heatW: config.heatW,
      layer1ResistanceKPerW: layer1ResistanceKPerW,
      interfaceResistanceKPerW: interfaceResistanceKPerW,
      layer2ResistanceKPerW: layer2ResistanceKPerW,
      totalResistanceKPerW: totalResistanceKPerW,
      temperatureRiseK: config.heatW * totalResistanceKPerW
    };
  }

  function opticalBudget(input) {
    var config = normalizeConfig(input);
    var thickness1M = config.layer1ThicknessMm / 1000;
    var thickness2M = config.layer2ThicknessMm / 1000;
    var opticalDepth = config.alpha1PerM * thickness1M + config.alpha2PerM * thickness2M;
    var transmission = Math.exp(-opticalDepth);
    return {
      opticalDepth: opticalDepth,
      transmission: transmission,
      absorbedFraction: 1 - transmission,
      layer1OpticalDepth: config.alpha1PerM * thickness1M,
      layer2OpticalDepth: config.alpha2PerM * thickness2M
    };
  }

  function thermalOpticalLedger(input) {
    var config = normalizeConfig(input);
    return { config: config, thermal: thermalBudget(config), optical: opticalBudget(config) };
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
        key: "series",
        prompt: "两层材料串联传热时，哪一种预算关系正确？",
        expected: "add",
        choices: [
          { value: "add", label: "各层热阻与界面热阻相加" },
          { value: "average", label: "只取两层导热率平均值" },
          { value: "largest", label: "只由最大热阻一层决定" }
        ]
      },
      {
        key: "optical",
        prompt: "在 Beer–Lambert 近似下，厚度增加而衰减系数不变时，I/I0 会怎样？",
        expected: "fall",
        choices: [
          { value: "fall", label: "按 exp(−αd) 下降" },
          { value: "linear", label: "只按 αd 线性下降" },
          { value: "rise", label: "因为路径更长而上升" }
        ]
      },
      {
        key: "boundary",
        prompt: "若接触、散射或表面对流/辐射不可忽略，最合适的读法是？",
        expected: "separate",
        choices: [
          { value: "separate", label: "加入或分开记账，并标明边界" },
          { value: "merge", label: "把光学透过率直接当热阻" },
          { value: "ignore", label: "仍可把一维层内模型当完整系统" }
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
      hostNode.appendChild(element(doc, "fieldset", {}, [element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }), element(doc, "div", { className: "mt-choice-grid" }, buttons)]));
    });
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 840 430", role: "img", "aria-label": "串联热阻与 Beer-Lambert 光学衰减图" });
    svg.appendChild(svgElement(doc, "title", {}, "热阻串联预算与光学透过率衰减"));
    svg.appendChild(svgElement(doc, "desc", {}, "左侧按层显示 K/W 热阻贡献，右侧显示归一化光强随光学深度的指数衰减；两种预算不合并。"));
    var left = { x: 55, y: 58, width: 340, height: 265 };
    var right = { x: 475, y: 58, width: 310, height: 265 };
    svg.appendChild(svgElement(doc, "rect", { x: left.x, y: left.y, width: left.width, height: left.height, fill: "none", stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "rect", { x: right.x, y: right.y, width: right.width, height: right.height, fill: "none", stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "text", { x: left.x + 5, y: 30, "font-size": 15, "font-weight": 700 }, "热预算：Rθ / K·W⁻¹"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + 5, y: 30, "font-size": 15, "font-weight": 700 }, "光学预算：I/I0（无量纲）"));
    var thermal = result.thermal;
    var pieces = [
      { label: "层 1", value: thermal.layer1ResistanceKPerW, color: "#2563a6" },
      { label: "界面", value: thermal.interfaceResistanceKPerW, color: "#9b6a12" },
      { label: "层 2", value: thermal.layer2ResistanceKPerW, color: "#39734d" }
    ];
    var total = Math.max(thermal.totalResistanceKPerW, 1e-12);
    var y = left.y + 55;
    pieces.forEach(function (piece) {
      var width = left.width - 70;
      var barWidth = width * piece.value / total;
      svg.appendChild(svgElement(doc, "rect", { x: left.x + 35, y: y, width: Math.max(1, barWidth), height: 42, fill: piece.color }));
      svg.appendChild(svgElement(doc, "text", { x: left.x + 6, y: y + 27, "font-size": 12 }, piece.label));
      svg.appendChild(svgElement(doc, "text", { x: left.x + 42 + Math.max(1, barWidth), y: y + 27, "font-size": 11 }, format(piece.value, 5) + " K/W"));
      y += 61;
    });
    svg.appendChild(svgElement(doc, "line", { x1: left.x + 35, y1: left.y + left.height - 28, x2: left.x + left.width - 18, y2: left.y + left.height - 28, stroke: "currentColor", "stroke-width": 1.2 }));
    svg.appendChild(svgElement(doc, "text", { x: left.x + left.width - 18, y: left.y + left.height - 8, "font-size": 11, "text-anchor": "end" }, "Rtotal = " + format(thermal.totalResistanceKPerW, 5) + " K/W"));
    var maxDepth = Math.max(0.6, result.optical.opticalDepth * 1.25);
    function mapX(depth) { return right.x + right.width * depth / maxDepth; }
    function mapY(transmission) { return right.y + right.height - right.height * transmission; }
    var path = [];
    for (var index = 0; index <= 80; index += 1) {
      var depth = maxDepth * index / 80;
      path.push((index ? "L" : "M") + mapX(depth).toFixed(2) + " " + mapY(Math.exp(-depth)).toFixed(2));
    }
    svg.appendChild(svgElement(doc, "path", { d: path.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 3 }));
    var currentX = mapX(result.optical.opticalDepth);
    var currentY = mapY(result.optical.transmission);
    svg.appendChild(svgElement(doc, "line", { x1: currentX, y1: right.y, x2: currentX, y2: right.y + right.height, stroke: "#9b6a12", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "circle", { cx: currentX, cy: currentY, r: 5, fill: "#2563a6", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: right.x + 7, y: right.y + 18, "font-size": 11 }, "exp(−τopt)；τopt = ΣαL"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + right.width, y: right.y + right.height + 25, "font-size": 11, "text-anchor": "end" }, "光学深度 τopt（无量纲）"));
    svg.appendChild(svgElement(doc, "text", { x: right.x - 8, y: right.y + 15, "font-size": 11, transform: "rotate(-90 " + (right.x - 8) + " " + (right.y + 15) + ")" }, "I/I0"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + right.width, y: right.y + right.height + 45, "font-size": 11, "text-anchor": "end" }, "当前 T = " + format(result.optical.transmission, 4) + "（无量纲）"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var rows = [
      ["面积 A", format(result.config.areaM2, 5), "m²；热阻按 1/A 缩放"],
      ["热负荷 Q", format(result.config.heatW, 3), "W；一维稳态代理输入"],
      ["层 1 热阻", format(result.thermal.layer1ResistanceKPerW, 6), "K/W；L/(kA)"],
      ["界面热阻", format(result.thermal.interfaceResistanceKPerW, 6), "K/W；R''int/A，界面单独记账"],
      ["层 2 热阻", format(result.thermal.layer2ResistanceKPerW, 6), "K/W；L/(kA)"],
      ["总热阻 / 温升", format(result.thermal.totalResistanceKPerW, 6) + " / " + format(result.thermal.temperatureRiseK, 4), "K/W；温升 ΔT = Q Rθ，K"],
      ["光学深度 τopt", format(result.optical.opticalDepth, 6), "无量纲；Σ αi Li"],
      ["透过率 I/I0", format(result.optical.transmission, 6), "无量纲；Beer–Lambert 代理"],
      ["吸收分数", format(result.optical.absorbedFraction, 6), "无量纲；1 − I/I0，不等于热预算 Q"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "热传导与光学衰减分开记账" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]),
      body
    ]));
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "mt-shell" });
    shell.appendChild(element(doc, "h3", { text: "互动实验：串联热阻与 Beer–Lambert 光学预算" }));
    shell.appendChild(element(doc, "p", { className: "mt-note", text: "先判断两种预算的结构和边界；揭示后调节厚度、导热率、界面与衰减系数。热预算不会把吸收光直接换算成热流。" }));
    var predictionHost = element(doc, "div");
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "mt-actions" });
    var reveal = element(doc, "button", { type: "button", className: "mt-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "mt-feedback", role: "status", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "mt-controls" });
    var inputs = {};

    function addRange(key, label, min, max, step, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = finite(input.value, label);
        state.feedback = state.revealed ? "参数已更新；两种预算已重新计算。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits };
      controls.appendChild(element(doc, "div", { className: "mt-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }

    addRange("areaM2", "面积 A / m²", "0.001", "0.05", "0.001", 3);
    addRange("heatW", "热负荷 Q / W", "0", "400", "10", 0);
    addRange("layer1ThicknessMm", "层 1 厚度 / mm", "0", "6", "0.1", 1);
    addRange("layer1K", "层 1 k / W·m⁻¹·K⁻¹", "0.2", "20", "0.2", 1);
    addRange("layer2ThicknessMm", "层 2 厚度 / mm", "0", "6", "0.1", 1);
    addRange("layer2K", "层 2 k / W·m⁻¹·K⁻¹", "0.2", "40", "0.2", 1);
    addRange("interfaceRpp", "界面 R'' / m²·K·W⁻¹", "0", "0.002", "0.00005", 5);
    addRange("alpha1PerM", "层 1 α / m⁻¹", "0", "400", "10", 0);
    addRange("alpha2PerM", "层 2 α / m⁻¹", "0", "400", "10", 0);
    resultPanel.appendChild(controls);
    var chart = element(doc, "div", { className: "mt-chart" });
    var tableWrap = element(doc, "div", { className: "mt-table-wrap" });
    var note = element(doc, "p", { className: "mt-note" });
    resultPanel.appendChild(element(doc, "div", { className: "mt-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);
    renderPredictions(doc, predictionHost, state);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测；揭示前不显示热阻图、衰减曲线和账本。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。热学与光学仍是两本账。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      renderPredictions(doc, predictionHost, state);
      render();
      announce(api, rootNode, "热光预算、预测和账本已重置。");
    });

    function render() {
      var result = null;
      var error = null;
      try { result = thermalOpticalLedger(state.config); } catch (caught) { error = caught; }
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
      });
      feedback.textContent = error ? "输入超出教学模型范围：" + error.message : state.feedback;
      feedback.className = "mt-feedback" + (error || state.feedback.indexOf("请先") === 0 ? " mt-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed || !result) {
        clear(chart);
        clear(tableWrap);
        note.textContent = error ? "请检查面积、导热率和非负衰减系数。" : "完成三项预测并揭示后显示两种预算。";
        return;
      }
      clear(chart);
      chart.appendChild(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "边界：热侧是均匀截面、稳态、一维串联导热代理；界面项用面热阻 R''int 单独加入。真实系统还可能有接触状态、侧向扩散、对流和表面辐射。光侧是无散射、均匀吸收介质中的 Beer–Lambert 近似；散射、反射、波长依赖和发光会改变透过率。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var base = thermalOpticalLedger(DEFAULTS);
    check(near(base.thermal.layer1ResistanceKPerW, 0.1), "layer resistance uses metres, square metres, and W/(m K)");
    check(near(base.thermal.interfaceResistanceKPerW, 0.02), "interface area resistance is converted to K/W");
    check(near(base.thermal.totalResistanceKPerW, 0.12666666666666668), "series resistance adds layer and interface terms");
    check(near(base.thermal.temperatureRiseK, 12.666666666666668), "temperature rise is Q times total resistance");
    check(near(base.optical.opticalDepth, 0.29), "optical depth is the sum of alpha times thickness");
    check(near(base.optical.transmission, Math.exp(-0.29), 1e-12), "Beer-Lambert transmission is deterministic");
    var thicker = thermalOpticalLedger({ layer1ThicknessMm: 4 });
    check(thicker.thermal.totalResistanceKPerW > base.thermal.totalResistanceKPerW && thicker.optical.transmission < base.optical.transmission, "thicker layer raises thermal resistance and lowers transmission");
    var largerArea = thermalOpticalLedger({ areaM2: 0.02 });
    check(near(largerArea.thermal.totalResistanceKPerW, base.thermal.totalResistanceKPerW / 2), "series thermal resistance scales inversely with area");
    var transparent = thermalOpticalLedger({ alpha1PerM: 0, alpha2PerM: 0 });
    check(near(transparent.optical.transmission, 1) && near(transparent.optical.absorbedFraction, 0), "zero attenuation is transparent");
    var noInterface = thermalOpticalLedger({ interfaceRpp: 0 });
    check(noInterface.thermal.totalResistanceKPerW < base.thermal.totalResistanceKPerW, "interface term can be removed without changing optical budget");
    check(JSON.stringify(base) === JSON.stringify(thermalOpticalLedger(DEFAULTS)), "default ledger is deterministic");
    var threw = false;
    try { normalizeConfig({ areaM2: 0 }); } catch (error) { threw = true; }
    check(threw, "zero area is rejected");
    threw = false;
    try { normalizeConfig({ layer1K: -1 }); } catch (error2) { threw = true; }
    check(threw, "negative conductivity is rejected");
    threw = false;
    try { normalizeConfig({ alpha2PerM: -0.1 }); } catch (error3) { threw = true; }
    check(threw, "negative attenuation is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    normalizeConfig: normalizeConfig,
    thermalBudget: thermalBudget,
    opticalBudget: opticalBudget,
    thermalOpticalLedger: thermalOpticalLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
