(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-structural-indices", exported.mount);
  }
  if (typeof module === "object" && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-structural-indices self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-structural-indices self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "materials-structural-indices";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-structural-indices-styles";
  var MATERIALS = [
    { id: "al", label: "Al 6061", rhoKgM3: 2700, modulusPa: 69e9, strengthPa: 276e6, maxTempC: 150, manufacture: 0.90, anisotropySensitivity: 0.02 },
    { id: "ti", label: "Ti-6Al-4V", rhoKgM3: 4430, modulusPa: 114e9, strengthPa: 880e6, maxTempC: 350, manufacture: 0.65, anisotropySensitivity: 0.08 },
    { id: "cfrp", label: "准各向同性 CFRP", rhoKgM3: 1600, modulusPa: 70e9, strengthPa: 600e6, maxTempC: 120, manufacture: 0.55, anisotropySensitivity: 0.45 },
    { id: "steel", label: "316L", rhoKgM3: 8000, modulusPa: 193e9, strengthPa: 290e6, maxTempC: 500, manufacture: 0.85, anisotropySensitivity: 0.03 },
    { id: "mg", label: "AZ91 镁合金", rhoKgM3: 1800, modulusPa: 45e9, strengthPa: 160e6, maxTempC: 120, manufacture: 0.88, anisotropySensitivity: 0.15 }
  ];
  var MODES = {
    tie: { label: "拉杆刚度", formula: "E/ρ", unit: "Pa·m³/kg" },
    beam: { label: "梁弯曲刚度", formula: "√E/ρ", unit: "Pa^0.5·m³/kg" },
    strengthBeam: { label: "强度受限梁", formula: "σ^(2/3)/ρ", unit: "Pa^(2/3)·m³/kg" }
  };
  var DEFAULTS = {
    mode: "beam",
    requiredTempC: 100,
    manufacturingMin: 0.50,
    orientationQuality: 0.90
  };
  var STYLE_TEXT = [
    '[data-learning-lab="' + LAB_ID + '"]{--ms-blue:#2563a6;--ms-red:#b64335;--ms-green:#39734d;--ms-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
    '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}',
    '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="' + LAB_ID + '"] .ms-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{font:inherit}',
    '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--ms-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .ms-primary{border-color:var(--ms-blue);background:var(--ms-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible,[data-learning-lab="' + LAB_ID + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .ms-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .ms-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .ms-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .ms-warn{color:var(--ms-red)}',
    '[data-learning-lab="' + LAB_ID + '"] .ms-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;align-items:end;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .ms-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .ms-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--ms-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type="range"],[data-learning-lab="' + LAB_ID + '"] select{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ms-blue)}[data-learning-lab="' + LAB_ID + '"] select{padding:7px 9px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit}',
    '[data-learning-lab="' + LAB_ID + '"] .ms-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(290px,.85fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="' + LAB_ID + '"] .ms-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="' + LAB_ID + '"] .ms-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ms-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--ms-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:920px){[data-learning-lab="' + LAB_ID + '"] .ms-grid{grid-template-columns:1fr}}@media(max-width:720px){[data-learning-lab="' + LAB_ID + '"] .ms-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .ms-choice-grid{grid-template-columns:1fr}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .ms-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
    if (source.mode !== undefined) config.mode = String(source.mode);
    ["requiredTempC", "manufacturingMin", "orientationQuality"].forEach(function (key) {
      if (source[key] !== undefined) config[key] = finite(source[key], key);
    });
    if (!MODES[config.mode]) throw new RangeError("unknown loading geometry");
    if (config.requiredTempC < -100 || config.requiredTempC > 1000) throw new RangeError("required temperature must be in degrees C");
    if (config.manufacturingMin < 0 || config.manufacturingMin > 1) throw new RangeError("manufacturing floor must be in [0, 1]");
    if (config.orientationQuality <= 0 || config.orientationQuality > 1) throw new RangeError("orientation quality must be in (0, 1]");
    return config;
  }

  function effectiveProperties(material, orientationQuality) {
    var quality = finite(orientationQuality, "orientation quality");
    if (quality <= 0 || quality > 1) throw new RangeError("orientation quality must be in (0, 1]");
    var retention = 1 - material.anisotropySensitivity * (1 - quality);
    return { retention: retention, modulusPa: material.modulusPa * retention, strengthPa: material.strengthPa * retention };
  }

  function materialIndex(material, mode, orientationQuality) {
    if (!MODES[mode]) throw new RangeError("unknown loading geometry");
    var effective = effectiveProperties(material, orientationQuality);
    if (mode === "tie") return effective.modulusPa / material.rhoKgM3;
    if (mode === "beam") return Math.sqrt(effective.modulusPa) / material.rhoKgM3;
    return Math.pow(effective.strengthPa, 2 / 3) / material.rhoKgM3;
  }

  function isEligible(material, config) {
    return material.maxTempC >= config.requiredTempC && material.manufacture >= config.manufacturingMin;
  }

  function structuralLedger(input) {
    var config = normalizeConfig(input);
    var raw = MATERIALS.map(function (material) {
      var effective = effectiveProperties(material, config.orientationQuality);
      return {
        material: material,
        effective: effective,
        rawIndex: materialIndex(material, config.mode, config.orientationQuality),
        eligible: isEligible(material, config),
        temperatureMarginC: material.maxTempC - config.requiredTempC,
        manufacturingMargin: material.manufacture - config.manufacturingMin
      };
    });
    var maxRaw = raw.reduce(function (maximum, row) { return Math.max(maximum, row.rawIndex); }, 0);
    var eligibleRows = raw.filter(function (row) { return row.eligible; });
    var maxEligible = eligibleRows.reduce(function (maximum, row) { return Math.max(maximum, row.rawIndex); }, 0);
    raw.forEach(function (row) {
      row.normalizedToAll = maxRaw > 0 ? row.rawIndex / maxRaw : 0;
      row.normalizedToEligible = row.eligible && maxEligible > 0 ? row.rawIndex / maxEligible : null;
    });
    eligibleRows.sort(function (left, right) { return right.rawIndex - left.rawIndex; });
    return {
      config: config,
      mode: MODES[config.mode],
      rows: raw,
      eligibleRows: eligibleRows,
      selected: eligibleRows.length ? eligibleRows[0].material.id : null,
      bestEligibleRawIndex: maxEligible
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
        key: "geometry",
        prompt: "为什么同一组材料换成梁弯曲工况后，指数可能改变？",
        expected: "exponent",
        choices: [
          { value: "exponent", label: "几何自由度和约束变了，指数也会变" },
          { value: "same", label: "任何几何都只用 E/ρ" },
          { value: "density", label: "只由密度决定，载荷不重要" }
        ]
      },
      {
        key: "temperature",
        prompt: "一个归一化指数最高、但达不到服役温度的候选应怎样处理？",
        expected: "exclude",
        choices: [
          { value: "exclude", label: "先因硬约束淘汰，再谈排序" },
          { value: "keep", label: "仍直接选它，因为指数最高" },
          { value: "average", label: "把温度和指数做无单位平均" }
        ]
      },
      {
        key: "anisotropy",
        prompt: "降低取向质量时，方向敏感的 CFRP 在这个教学模型中会怎样？",
        expected: "penalty",
        choices: [
          { value: "penalty", label: "有效 E、σ 受方向惩罚，指数下降" },
          { value: "improve", label: "因为更轻，所有指数必然上升" },
          { value: "none", label: "各向异性完全不影响比较" }
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
      hostNode.appendChild(element(doc, "fieldset", {}, [element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }), element(doc, "div", { className: "ms-choice-grid" }, buttons)]));
    });
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 840 450", role: "img", "aria-label": "候选材料归一化指数和约束状态" });
    svg.appendChild(svgElement(doc, "title", {}, "材料指数归一化比较与硬约束"));
    svg.appendChild(svgElement(doc, "desc", {}, "柱高表示相对于所有候选最高指数的归一化值；灰色或红色柱表示温度或制造门槛不满足，表格给出有效属性和单位。"));
    var plot = { x: 55, y: 58, width: 730, height: 300 };
    svg.appendChild(svgElement(doc, "rect", { x: plot.x, y: plot.y, width: plot.width, height: plot.height, fill: "none", stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + 6, y: 30, "font-size": 15, "font-weight": 700 }, result.mode.label + "：" + result.mode.formula + "，柱高为归一化指数"));
    svg.appendChild(svgElement(doc, "line", { x1: plot.x, y1: plot.y + plot.height - 32, x2: plot.x + plot.width, y2: plot.y + plot.height - 32, stroke: "currentColor" }));
    var step = plot.width / result.rows.length;
    result.rows.forEach(function (row, index) {
      var barWidth = step * 0.55;
      var barHeight = (plot.height - 72) * row.normalizedToAll;
      var x = plot.x + step * index + (step - barWidth) / 2;
      var y = plot.y + plot.height - 32 - barHeight;
      var fill = row.eligible ? (row.material.id === result.selected ? "#2563a6" : "#39734d") : "#b64335";
      svg.appendChild(svgElement(doc, "rect", { x: x, y: y, width: barWidth, height: Math.max(1, barHeight), fill: fill, opacity: row.eligible ? 0.88 : 0.45 }));
      svg.appendChild(svgElement(doc, "text", { x: x + barWidth / 2, y: y - 7, "font-size": 11, "text-anchor": "middle" }, format(row.normalizedToAll, 2)));
      svg.appendChild(svgElement(doc, "text", { x: x + barWidth / 2, y: plot.y + plot.height - 10, "font-size": 11, "text-anchor": "middle" }, row.material.label));
    });
    svg.appendChild(svgElement(doc, "text", { x: plot.x + 6, y: plot.y + 18, "font-size": 11 }, "蓝：当前最高可行；绿：可行；红：硬约束失败"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + plot.width, y: plot.y + plot.height + 35, "font-size": 11, "text-anchor": "end" }, "归一化指数 = raw / 所有候选最高 raw；无量纲"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var body = element(doc, "tbody");
    result.rows.forEach(function (row) {
      var status = row.eligible ? (row.material.id === result.selected ? "可行 / 当前最高" : "可行") : "淘汰：温度或制造门槛";
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { scope: "row", text: row.material.label }),
        element(doc, "td", { text: format(row.effective.modulusPa / 1e9, 1) + " / " + format(row.effective.strengthPa / 1e6, 0) }),
        element(doc, "td", { text: format(row.rawIndex, 5) }),
        element(doc, "td", { text: format(row.normalizedToAll, 3) }),
        element(doc, "td", { text: status })
      ]));
    });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "有效属性、归一化指数和硬约束证据" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "候选" }), element(doc, "th", { text: "Eeff / σeff" }), element(doc, "th", { text: "raw index" }), element(doc, "th", { text: "normalized" }), element(doc, "th", { text: "约束状态" })])]),
      body
    ]));
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "ms-shell" });
    shell.appendChild(element(doc, "h3", { text: "互动实验：按载荷几何和边界比较结构材料" }));
    shell.appendChild(element(doc, "p", { className: "ms-note", text: "先判断指数的几何依赖、硬约束和各向异性；揭示后可切换拉杆/梁工况并调温度、制造门槛与取向质量。" }));
    var predictionHost = element(doc, "div");
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "ms-actions" });
    var reveal = element(doc, "button", { type: "button", className: "ms-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "ms-feedback", role: "status", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "ms-controls" });
    var inputs = {};

    function addRange(key, label, min, max, step, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = finite(input.value, label);
        state.feedback = state.revealed ? "约束参数已更新；候选账本已重新排序。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits };
      controls.appendChild(element(doc, "div", { className: "ms-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }

    var modeSelect = element(doc, "select", { "aria-label": "载荷几何" });
    Object.keys(MODES).forEach(function (key) { modeSelect.appendChild(element(doc, "option", { value: key, text: MODES[key].label + "（" + MODES[key].formula + "）" })); });
    modeSelect.value = state.config.mode;
    modeSelect.addEventListener("change", function () { state.config.mode = modeSelect.value; state.feedback = state.revealed ? "载荷几何已更新；材料指数已重算。" : ""; render(); });
    controls.appendChild(element(doc, "div", { className: "ms-control" }, [element(doc, "label", { text: "载荷几何" }), modeSelect]));
    addRange("requiredTempC", "要求温度 / °C", "20", "450", "10", 0);
    addRange("manufacturingMin", "制造可行下限", "0.4", "0.95", "0.05", 2);
    addRange("orientationQuality", "取向质量", "0.65", "1", "0.01", 2);
    resultPanel.appendChild(controls);
    var chart = element(doc, "div", { className: "ms-chart" });
    var tableWrap = element(doc, "div", { className: "ms-table-wrap" });
    var note = element(doc, "p", { className: "ms-note" });
    resultPanel.appendChild(element(doc, "div", { className: "ms-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);
    renderPredictions(doc, predictionHost, state);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测；揭示前不显示指数柱图和约束账本。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。指数只在声明的几何和边界内可比。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      modeSelect.value = state.config.mode;
      renderPredictions(doc, predictionHost, state);
      render();
      announce(api, rootNode, "结构指数预测、边界和账本已重置。");
    });

    function render() {
      var result = null;
      var error = null;
      try { result = structuralLedger(state.config); } catch (caught) { error = caught; }
      modeSelect.value = state.config.mode;
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
      });
      feedback.textContent = error ? "输入超出教学模型范围：" + error.message : state.feedback;
      feedback.className = "ms-feedback" + (error || state.feedback.indexOf("请先") === 0 ? " ms-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed || !result) {
        clear(chart);
        clear(tableWrap);
        note.textContent = error ? "请检查载荷模式、温度、制造门槛和取向质量。" : "完成三项预测并揭示后显示归一化指数和硬约束状态。";
        return;
      }
      clear(chart);
      chart.appendChild(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "边界：E、σ 和 ρ 是候选材料的简化代表值；orientationQuality 只通过一个方向惩罚因子作用，不能替代 CFRP 铺层、织构、缺口、温度依赖或失效包络。温度和制造门槛是硬约束，归一化指数只是候选内部比较，不是跨工况的性能保证。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var base = structuralLedger(DEFAULTS);
    check(base.rows.length === 5 && base.eligibleRows.length > 0, "candidate ledger is populated and has feasible rows");
    check(base.mode.formula === "√E/ρ", "default mode is the stated beam-stiffness index");
    check(near(materialIndex(MATERIALS[0], "tie", 1), MATERIALS[0].modulusPa / MATERIALS[0].rhoKgM3), "tie index uses E/rho");
    check(near(materialIndex(MATERIALS[0], "beam", 1), Math.sqrt(MATERIALS[0].modulusPa) / MATERIALS[0].rhoKgM3), "beam index uses square-root E/rho");
    check(near(materialIndex(MATERIALS[0], "strengthBeam", 1), Math.pow(MATERIALS[0].strengthPa, 2 / 3) / MATERIALS[0].rhoKgM3), "strength beam index uses sigma^(2/3)/rho");
    check(base.rows.every(function (row) { return row.normalizedToAll >= 0 && row.normalizedToAll <= 1; }), "normalized comparison stays in [0,1]");
    var highTemperature = structuralLedger({ requiredTempC: 400 });
    check(highTemperature.rows.some(function (row) { return !row.eligible; }) && highTemperature.selected === "steel", "temperature is a hard boundary");
    var highManufacturing = structuralLedger({ manufacturingMin: 0.92 });
    check(highManufacturing.rows.filter(function (row) { return row.eligible; }).length === 0, "manufacturing floor can remove every candidate");
    var poorOrientation = effectiveProperties(MATERIALS[2], 0.65);
    var aligned = effectiveProperties(MATERIALS[2], 1);
    check(poorOrientation.modulusPa < aligned.modulusPa && poorOrientation.strengthPa < aligned.strengthPa, "anisotropy-sensitive candidate is penalized by orientation");
    var tieLedger = structuralLedger({ mode: "tie" });
    var strengthLedger = structuralLedger({ mode: "strengthBeam" });
    check(tieLedger.rows.length === 5 && strengthLedger.rows.length === 5 && tieLedger.mode.formula !== strengthLedger.mode.formula, "different well-defined modes are evaluated independently");
    check(JSON.stringify(base) === JSON.stringify(structuralLedger(DEFAULTS)), "candidate comparison is deterministic");
    var threw = false;
    try { normalizeConfig({ mode: "plate" }); } catch (error) { threw = true; }
    check(threw, "unknown loading geometry is rejected");
    threw = false;
    try { normalizeConfig({ orientationQuality: 0 }); } catch (error2) { threw = true; }
    check(threw, "zero orientation quality is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    MATERIALS: MATERIALS,
    MODES: MODES,
    normalizeConfig: normalizeConfig,
    effectiveProperties: effectiveProperties,
    materialIndex: materialIndex,
    isEligible: isEligible,
    structuralLedger: structuralLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
