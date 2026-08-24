(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-selection-pareto-ledger", exported.mount);
  }
  if (typeof module === "object" && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-selection-pareto-ledger self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-selection-pareto-ledger self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "materials-selection-pareto-ledger";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-selection-pareto-ledger-styles";
  var MATERIALS = [
    { id: "al", label: "Al 6061", rhoKgM3: 2700, modulusPa: 69e9, strengthMPa: 276, costUSDPerKg: 4, embodiedCarbonKgPerKg: 8, maxTempC: 150, manufacture: 0.90 },
    { id: "ti", label: "Ti-6Al-4V", rhoKgM3: 4430, modulusPa: 114e9, strengthMPa: 880, costUSDPerKg: 25, embodiedCarbonKgPerKg: 35, maxTempC: 350, manufacture: 0.65 },
    { id: "cfrp", label: "准各向同性 CFRP", rhoKgM3: 1600, modulusPa: 70e9, strengthMPa: 600, costUSDPerKg: 30, embodiedCarbonKgPerKg: 29, maxTempC: 120, manufacture: 0.55 },
    { id: "steel", label: "316L", rhoKgM3: 8000, modulusPa: 193e9, strengthMPa: 290, costUSDPerKg: 6, embodiedCarbonKgPerKg: 6, maxTempC: 500, manufacture: 0.85 },
    { id: "mg", label: "AZ91 镁合金", rhoKgM3: 1800, modulusPa: 45e9, strengthMPa: 160, costUSDPerKg: 4, embodiedCarbonKgPerKg: 22, maxTempC: 120, manufacture: 0.88 }
  ];
  var DEFAULTS = {
    minStrengthMPa: 250,
    minTempC: 120,
    maxCostUSDPerKg: 40,
    minManufacture: 0.50,
    weightStrength: 0.30,
    weightStiffness: 0.25,
    weightCost: 0.15,
    weightCarbon: 0.30
  };
  var STYLE_TEXT = [
    '[data-learning-lab="' + LAB_ID + '"]{--mc-blue:#2563a6;--mc-red:#b64335;--mc-green:#39734d;--mc-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
    '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}',
    '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="' + LAB_ID + '"] .mc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit}',
    '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mc-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mc-primary{border-color:var(--mc-blue);background:var(--mc-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .mc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mc-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .mc-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mc-warn{color:var(--mc-red)}',
    '[data-learning-lab="' + LAB_ID + '"] .mc-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;align-items:end;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .mc-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mc-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mc-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mc-blue)}',
    '[data-learning-lab="' + LAB_ID + '"] .mc-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(310px,.85fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="' + LAB_ID + '"] .mc-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="' + LAB_ID + '"] .mc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mc-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mc-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:980px){[data-learning-lab="' + LAB_ID + '"] .mc-grid{grid-template-columns:1fr}}@media(max-width:720px){[data-learning-lab="' + LAB_ID + '"] .mc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mc-choice-grid{grid-template-columns:1fr}}@media(max-width:430px){[data-learning-lab="' + LAB_ID + '"] .mc-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
    if (config.minStrengthMPa < 0 || config.minStrengthMPa > 2000) throw new RangeError("minimum strength must be in [0, 2000] MPa");
    if (config.minTempC < -100 || config.minTempC > 1000) throw new RangeError("minimum temperature must be in degrees C");
    if (config.maxCostUSDPerKg <= 0 || config.maxCostUSDPerKg > 1000) throw new RangeError("maximum cost must be positive in USD/kg");
    if (config.minManufacture < 0 || config.minManufacture > 1) throw new RangeError("manufacturing floor must be in [0, 1]");
    ["weightStrength", "weightStiffness", "weightCost", "weightCarbon"].forEach(function (key) {
      if (config[key] < 0 || config[key] > 1) throw new RangeError("weights must be in [0, 1]");
    });
    if (config.weightStrength + config.weightStiffness + config.weightCost + config.weightCarbon <= 0) throw new RangeError("at least one objective weight must be positive");
    return config;
  }

  function specificStrength(material) {
    return material.strengthMPa * 1e6 / material.rhoKgM3;
  }

  function specificStiffness(material) {
    return material.modulusPa / material.rhoKgM3;
  }

  function bounds() {
    var values = {
      strength: MATERIALS.map(specificStrength),
      stiffness: MATERIALS.map(specificStiffness),
      cost: MATERIALS.map(function (material) { return material.costUSDPerKg; }),
      carbon: MATERIALS.map(function (material) { return material.embodiedCarbonKgPerKg; })
    };
    function range(list) { return { min: Math.min.apply(Math, list), max: Math.max.apply(Math, list) }; }
    return { strength: range(values.strength), stiffness: range(values.stiffness), cost: range(values.cost), carbon: range(values.carbon) };
  }

  function normalize(value, range, maximize) {
    if (range.max === range.min) return 1;
    var fraction = (value - range.min) / (range.max - range.min);
    return maximize ? fraction : 1 - fraction;
  }

  function objectiveScores(material, ranges) {
    return {
      strength: normalize(specificStrength(material), ranges.strength, true),
      stiffness: normalize(specificStiffness(material), ranges.stiffness, true),
      cost: normalize(material.costUSDPerKg, ranges.cost, false),
      carbon: normalize(material.embodiedCarbonKgPerKg, ranges.carbon, false)
    };
  }

  function eligible(material, config) {
    return material.strengthMPa >= config.minStrengthMPa && material.maxTempC >= config.minTempC && material.costUSDPerKg <= config.maxCostUSDPerKg && material.manufacture >= config.minManufacture;
  }

  function normalizedWeights(config) {
    var total = config.weightStrength + config.weightStiffness + config.weightCost + config.weightCarbon;
    return { strength: config.weightStrength / total, stiffness: config.weightStiffness / total, cost: config.weightCost / total, carbon: config.weightCarbon / total };
  }

  function weightedScore(scores, weights) {
    return scores.strength * weights.strength + scores.stiffness * weights.stiffness + scores.cost * weights.cost + scores.carbon * weights.carbon;
  }

  function dominates(left, right) {
    var keys = ["strength", "stiffness", "cost", "carbon"];
    var noWorse = keys.every(function (key) { return left.scores[key] >= right.scores[key] - 1e-12; });
    var strictlyBetter = keys.some(function (key) { return left.scores[key] > right.scores[key] + 1e-12; });
    return noWorse && strictlyBetter;
  }

  function scenarioWinner(rows, weights) {
    var feasibleRows = rows.filter(function (row) { return row.eligible; });
    if (!feasibleRows.length) return null;
    feasibleRows.forEach(function (row) { row.scenarioScore = weightedScore(row.scores, weights); });
    feasibleRows.sort(function (left, right) { return right.scenarioScore - left.scenarioScore || left.material.id.localeCompare(right.material.id); });
    return feasibleRows[0].material.id;
  }

  function selectionLedger(input) {
    var config = normalizeConfig(input);
    var ranges = bounds();
    var weights = normalizedWeights(config);
    var rows = MATERIALS.map(function (material) {
      return { material: material, scores: objectiveScores(material, ranges), eligible: eligible(material, config), scenarioScore: 0, pareto: false };
    });
    rows.forEach(function (row) { row.score = weightedScore(row.scores, weights); });
    rows.filter(function (row) { return row.eligible; }).forEach(function (row) {
      row.pareto = !rows.some(function (other) { return other !== row && other.eligible && dominates(other, row); });
    });
    var winner = scenarioWinner(rows, weights);
    var lowCarbonWeights = { strength: 0.15, stiffness: 0.10, cost: 0.10, carbon: 0.65 };
    var highStrengthWeights = { strength: 0.65, stiffness: 0.15, cost: 0.10, carbon: 0.10 };
    var baseWeights = { strength: weights.strength, stiffness: weights.stiffness, cost: weights.cost, carbon: weights.carbon };
    return {
      config: config,
      ranges: ranges,
      weights: weights,
      rows: rows,
      winner: winner,
      scenarios: {
        lowCarbon: scenarioWinner(rows, lowCarbonWeights),
        base: scenarioWinner(rows, baseWeights),
        highStrength: scenarioWinner(rows, highStrengthWeights)
      },
      paretoIds: rows.filter(function (row) { return row.pareto; }).map(function (row) { return row.material.id; })
    };
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
        key: "constraints",
        prompt: "多目标选材的第一步是什么？",
        expected: "hard",
        choices: [
          { value: "hard", label: "先用硬约束淘汰，再对可行者排序" },
          { value: "score", label: "先把所有属性加权成一个分数" },
          { value: "name", label: "先选听起来最先进的材料" }
        ]
      },
      {
        key: "weights",
        prompt: "改变成本/碳/性能权重可能改变什么？",
        expected: "winner",
        choices: [
          { value: "winner", label: "加权胜者可能改变；Pareto 可行集合不由权重决定" },
          { value: "none", label: "所有排序和可行性都永远不变" },
          { value: "constraint", label: "权重会自动放宽硬约束" }
        ]
      },
      {
        key: "carbon",
        prompt: "每 kg embodied carbon 的账本边界是什么？",
        expected: "boundary",
        choices: [
          { value: "boundary", label: "材料生产阶段 proxy，不等于完整生命周期" },
          { value: "lca", label: "已经包含使用、回收和所有系统边界" },
          { value: "ignore", label: "碳数据与选材无关，可以省略单位" }
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
      hostNode.appendChild(element(doc, "fieldset", {}, [element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }), element(doc, "div", { className: "mc-choice-grid" }, buttons)]));
    });
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 840 455", role: "img", "aria-label": "Pareto 选材与碳强度比较图" });
    svg.appendChild(svgElement(doc, "title", {}, "硬约束、多目标归一化与 Pareto 前沿"));
    svg.appendChild(svgElement(doc, "desc", {}, "横轴是 embodied carbon kg CO2e/kg，纵轴是归一化比强度；蓝点是当前加权胜者，金边点在 Pareto 前沿，红色或灰色表示硬约束失败。"));
    var plot = { x: 60, y: 58, width: 720, height: 310 };
    svg.appendChild(svgElement(doc, "rect", { x: plot.x, y: plot.y, width: plot.width, height: plot.height, fill: "none", stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + 5, y: 30, "font-size": 15, "font-weight": 700 }, "选材图：横轴 embodied carbon，纵轴比强度（归一化）"));
    var carbonMin = result.ranges.carbon.min;
    var carbonMax = result.ranges.carbon.max;
    function mapX(value) { return plot.x + 42 + (plot.width - 70) * (value - carbonMin) / (carbonMax - carbonMin); }
    function mapY(value) { return plot.y + plot.height - 36 - (plot.height - 70) * value; }
    result.rows.forEach(function (row) {
      var cx = mapX(row.material.embodiedCarbonKgPerKg);
      var cy = mapY(row.scores.strength);
      var fill = !row.eligible ? "#b64335" : row.material.id === result.winner ? "#2563a6" : "#39734d";
      svg.appendChild(svgElement(doc, "circle", { cx: cx, cy: cy, r: row.pareto ? 9 : 6, fill: fill, stroke: row.pareto ? "#9b6a12" : "Canvas", "stroke-width": row.pareto ? 3 : 2, opacity: row.eligible ? 0.9 : 0.45 }));
      svg.appendChild(svgElement(doc, "text", { x: cx + 8, y: cy - 7, "font-size": 11 }, row.material.label));
    });
    svg.appendChild(svgElement(doc, "text", { x: plot.x + 8, y: plot.y + 18, "font-size": 11 }, "金边：Pareto；蓝：当前胜者；红：硬约束失败"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + plot.width, y: plot.y + plot.height - 11, "font-size": 11, "text-anchor": "end" }, "embodied carbon / kg CO₂e·kg⁻¹"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x - 8, y: plot.y + 15, "font-size": 11, transform: "rotate(-90 " + (plot.x - 8) + " " + (plot.y + 15) + ")" }, "σ/ρ 归一化（无量纲）"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + plot.width, y: plot.y + plot.height + 35, "font-size": 11, "text-anchor": "end" }, "碳值只覆盖材料生产 proxy；不是完整 LCA"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var body = element(doc, "tbody");
    result.rows.forEach(function (row) {
      var status = row.eligible ? (row.pareto ? "可行 / Pareto" : "可行") : "硬约束失败";
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { scope: "row", text: row.material.label }),
        element(doc, "td", { text: format(row.scores.strength, 3) + " / " + format(row.scores.stiffness, 3) }),
        element(doc, "td", { text: format(row.scores.cost, 3) + " / " + format(row.scores.carbon, 3) }),
        element(doc, "td", { text: format(row.score, 3) }),
        element(doc, "td", { text: status })
      ]));
    });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "硬约束、归一化目标、加权分数与 Pareto 证据" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "候选" }), element(doc, "th", { text: "比强度 / 比刚度" }), element(doc, "th", { text: "成本 / 碳分数" }), element(doc, "th", { text: "当前分数" }), element(doc, "th", { text: "状态" })])]),
      body
    ]));
    var scenarioBody = element(doc, "tbody");
    [["低碳权重 0.65", result.scenarios.lowCarbon], ["当前权重", result.scenarios.base], ["高强度权重 0.65", result.scenarios.highStrength]].forEach(function (row) {
      scenarioBody.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] || "无可行候选" }), element(doc, "td", { text: "权重改变胜者，不改变硬约束定义" })]));
    });
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "权重敏感性证据账本" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "情景" }), element(doc, "th", { text: "胜者" }), element(doc, "th", { text: "解释" })])]),
      scenarioBody
    ]));
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "mc-shell" });
    shell.appendChild(element(doc, "h3", { text: "互动实验：多目标选材、Pareto 前沿与权重敏感性" }));
    shell.appendChild(element(doc, "p", { className: "mc-note", text: "先预测硬约束、权重和碳边界；揭示后调节强度、温度、成本、制造门槛与四个目标权重。" }));
    var predictionHost = element(doc, "div");
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "mc-actions" });
    var reveal = element(doc, "button", { type: "button", className: "mc-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "mc-feedback", role: "status", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "mc-controls" });
    var inputs = {};

    function addRange(key, label, min, max, step, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = finite(input.value, label);
        state.feedback = state.revealed ? "约束或权重已更新；Pareto 与胜者已重算。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits };
      controls.appendChild(element(doc, "div", { className: "mc-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }

    addRange("minStrengthMPa", "最低强度 / MPa", "100", "700", "10", 0);
    addRange("minTempC", "最低温度 / °C", "50", "450", "10", 0);
    addRange("maxCostUSDPerKg", "最高成本 / USD·kg⁻¹", "5", "40", "1", 0);
    addRange("minManufacture", "制造下限", "0.4", "0.95", "0.05", 2);
    addRange("weightStrength", "强度权重", "0", "0.6", "0.05", 2);
    addRange("weightStiffness", "刚度权重", "0", "0.6", "0.05", 2);
    addRange("weightCost", "成本权重", "0", "0.6", "0.05", 2);
    addRange("weightCarbon", "碳权重", "0", "0.6", "0.05", 2);
    resultPanel.appendChild(controls);
    var chart = element(doc, "div", { className: "mc-chart" });
    var tableWrap = element(doc, "div", { className: "mc-table-wrap" });
    var note = element(doc, "p", { className: "mc-note" });
    resultPanel.appendChild(element(doc, "div", { className: "mc-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);
    renderPredictions(doc, predictionHost, state);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测；揭示前不显示 Pareto 图、权重情景和选材账本。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。硬约束先于加权排序。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      renderPredictions(doc, predictionHost, state);
      render();
      announce(api, rootNode, "选材约束、权重和 Pareto 账本已重置。");
    });

    function render() {
      var result = null;
      var error = null;
      try { result = selectionLedger(state.config); } catch (caught) { error = caught; }
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
      });
      feedback.textContent = error ? "选材输入错误：" + error.message : state.feedback;
      feedback.className = "mc-feedback" + (error || state.feedback.indexOf("请先") === 0 ? " mc-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed || !result) {
        clear(chart);
        clear(tableWrap);
        note.textContent = error ? "请保持权重非负且至少一个权重为正。" : "完成三项预测并揭示后显示 Pareto、归一化目标和权重敏感性。";
        return;
      }
      clear(chart);
      chart.appendChild(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "边界：强度/密度、刚度/密度、成本/kg 与 embodied carbon/kg 都是当前候选的归一化目标；实际零件质量、几何、连接、使用阶段节能、回收和报废没有被自动纳入。碳值是材料生产阶段 proxy，不能直接宣称完整生命周期最优。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var base = selectionLedger(DEFAULTS);
    check(base.rows.length === 5 && base.winner !== null, "selection ledger has candidates and a winner");
    check(base.rows.filter(function (row) { return row.eligible; }).length === 4, "default strength constraint removes AZ91");
    check(near(base.weights.strength + base.weights.stiffness + base.weights.cost + base.weights.carbon, 1), "objective weights are normalized");
    check(base.rows.every(function (row) { return row.scores.strength >= 0 && row.scores.strength <= 1 && row.scores.carbon >= 0 && row.scores.carbon <= 1; }), "normalization remains in [0,1]");
    check(base.paretoIds.length >= 2, "feasible tradeoffs produce a Pareto set");
    check(base.rows.filter(function (row) { return row.pareto; }).every(function (row) { return row.eligible; }), "infeasible candidates cannot be Pareto choices");
    var strict = selectionLedger({ minStrengthMPa: 700 });
    check(strict.rows.filter(function (row) { return row.eligible; }).length === 1 && strict.winner === "ti", "hard strength constraint is applied before ranking");
    var none = selectionLedger({ minTempC: 600 });
    check(none.winner === null && none.scenarios.base === null, "hard temperature constraint can leave no feasible candidate");
    check(base.scenarios.lowCarbon !== null && base.scenarios.highStrength !== null, "weight sensitivity scenarios are evaluated");
    check(JSON.stringify(base) === JSON.stringify(selectionLedger(DEFAULTS)), "selection ledger is deterministic");
    var threw = false;
    try { normalizeConfig({ weightStrength: 0, weightStiffness: 0, weightCost: 0, weightCarbon: 0 }); } catch (error) { threw = true; }
    check(threw, "all-zero weights are rejected");
    threw = false;
    try { normalizeConfig({ maxCostUSDPerKg: 0 }); } catch (error2) { threw = true; }
    check(threw, "nonpositive cost bound is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    MATERIALS: MATERIALS,
    normalizeConfig: normalizeConfig,
    specificStrength: specificStrength,
    specificStiffness: specificStiffness,
    objectiveScores: objectiveScores,
    eligible: eligible,
    normalizedWeights: normalizedWeights,
    dominates: dominates,
    selectionLedger: selectionLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
