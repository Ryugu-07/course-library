(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-solidification-path", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-solidification-path self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-solidification-path self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-solidification-path-styles";
  var DEFAULTS = {
    compositionPct: 4,
    partitionCoefficient: 0.25,
    solidFraction: 0.65
  };
  var STYLE_TEXT = [
    '[data-learning-lab="materials-solidification-path"]{--mp-blue:#2563a6;--mp-red:#b64335;--mp-green:#39734d;--mp-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="materials-solidification-path"] *{box-sizing:border-box}[data-learning-lab="materials-solidification-path"] [hidden]{display:none!important}',
    '[data-learning-lab="materials-solidification-path"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-solidification-path"] p{margin:8px 0}',
    '[data-learning-lab="materials-solidification-path"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-solidification-path"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="materials-solidification-path"] .ms-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-solidification-path"] button,[data-learning-lab="materials-solidification-path"] input{font:inherit}',
    '[data-learning-lab="materials-solidification-path"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-solidification-path"] button:hover{border-color:var(--mp-blue)}[data-learning-lab="materials-solidification-path"] button[aria-pressed="true"],[data-learning-lab="materials-solidification-path"] .ms-primary{border-color:var(--mp-blue);background:var(--mp-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="materials-solidification-path"] button:focus-visible,[data-learning-lab="materials-solidification-path"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-solidification-path"] .ms-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-solidification-path"] .ms-actions>*{flex:1 1 170px}[data-learning-lab="materials-solidification-path"] .ms-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-solidification-path"] .ms-good{color:var(--mp-green)}[data-learning-lab="materials-solidification-path"] .ms-warn{color:var(--mp-red)}',
    '[data-learning-lab="materials-solidification-path"] .ms-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end;margin-top:12px}[data-learning-lab="materials-solidification-path"] .ms-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-solidification-path"] .ms-control label{font-size:13px;font-weight:700}[data-learning-lab="materials-solidification-path"] output{color:var(--mp-blue);font-variant-numeric:tabular-nums}[data-learning-lab="materials-solidification-path"] input[type="range"]{display:block;width:100%;min-height:44px;accent-color:var(--mp-blue)}',
    '[data-learning-lab="materials-solidification-path"] .ms-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="materials-solidification-path"] .ms-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-solidification-path"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="materials-solidification-path"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="materials-solidification-path"] .ms-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="materials-solidification-path"] table{width:100%;min-width:470px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-solidification-path"] th,[data-learning-lab="materials-solidification-path"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-solidification-path"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-solidification-path"] .ms-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mp-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:760px){[data-learning-lab="materials-solidification-path"] .ms-grid{grid-template-columns:1fr}}@media(max-width:600px){[data-learning-lab="materials-solidification-path"] .ms-controls{grid-template-columns:1fr}[data-learning-lab="materials-solidification-path"] .ms-choice-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-solidification-path"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
    if (places === 0) return value.toFixed(0);
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 5));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function copyDefaults() {
    return {
      compositionPct: DEFAULTS.compositionPct,
      partitionCoefficient: DEFAULTS.partitionCoefficient,
      solidFraction: DEFAULTS.solidFraction
    };
  }

  function normalizeConfig(input) {
    var source = input || {};
    var compositionPct = finite(source.compositionPct === undefined ? DEFAULTS.compositionPct : source.compositionPct, "initial composition");
    var partitionCoefficient = finite(source.partitionCoefficient === undefined ? DEFAULTS.partitionCoefficient : source.partitionCoefficient, "partition coefficient");
    var solidFraction = finite(source.solidFraction === undefined ? DEFAULTS.solidFraction : source.solidFraction, "solid fraction");
    if (compositionPct <= 0 || compositionPct > 50) throw new RangeError("initial composition must be in (0, 50] wt%");
    if (partitionCoefficient <= 0 || partitionCoefficient > 1) throw new RangeError("partition coefficient k must be in (0, 1]");
    if (solidFraction < 0 || solidFraction >= 1) throw new RangeError("solid fraction fs must be in [0, 1)");
    return { compositionPct: compositionPct, partitionCoefficient: partitionCoefficient, solidFraction: solidFraction };
  }

  function equilibriumPath(compositionPct, partitionCoefficient, solidFraction) {
    var c0 = finite(compositionPct, "initial composition");
    var k = finite(partitionCoefficient, "partition coefficient");
    var fs = finite(solidFraction, "solid fraction");
    if (c0 <= 0 || k <= 0 || k > 1 || fs < 0 || fs >= 1) throw new RangeError("equilibrium path input outside boundary");
    var denominator = 1 - fs * (1 - k);
    var liquidCompositionPct = c0 / denominator;
    var solidCompositionPct = k * liquidCompositionPct;
    var solidAveragePct = fs === 0 ? null : solidCompositionPct;
    var massBalancePct = fs === 0 ? liquidCompositionPct : fs * solidAveragePct + (1 - fs) * liquidCompositionPct;
    return {
      liquidCompositionPct: liquidCompositionPct,
      solidInstantPct: solidCompositionPct,
      solidAveragePct: solidAveragePct,
      massBalancePct: massBalancePct,
      closureErrorPct: massBalancePct - c0
    };
  }

  function scheilPath(compositionPct, partitionCoefficient, solidFraction) {
    var c0 = finite(compositionPct, "initial composition");
    var k = finite(partitionCoefficient, "partition coefficient");
    var fs = finite(solidFraction, "solid fraction");
    if (c0 <= 0 || k <= 0 || k > 1 || fs < 0 || fs >= 1) throw new RangeError("Scheil path input outside boundary");
    var liquidFraction = 1 - fs;
    var liquidCompositionPct = c0 * Math.pow(liquidFraction, k - 1);
    var solidInstantPct = k * liquidCompositionPct;
    var solidAveragePct = fs === 0 ? null : (c0 - liquidFraction * liquidCompositionPct) / fs;
    var massBalancePct = fs === 0 ? liquidCompositionPct : fs * solidAveragePct + liquidFraction * liquidCompositionPct;
    return {
      liquidCompositionPct: liquidCompositionPct,
      solidInstantPct: solidInstantPct,
      solidAveragePct: solidAveragePct,
      massBalancePct: massBalancePct,
      closureErrorPct: massBalancePct - c0
    };
  }

  function terminalBoundary(partitionCoefficient) {
    var k = finite(partitionCoefficient, "partition coefficient");
    if (Math.abs(k - 1) < 1e-12) return "k = 1：fs → 1 时 Cl、Cs 都保持 C0，无分配偏析";
    return "k < 1：理想 Scheil 的 Cl = C0(1 − fs)^(k−1) 在 fs → 1 时发散，实际会先遇到溶解度/共晶/传质边界";
  }

  function solidificationLedger(input) {
    var config = normalizeConfig(input);
    var equilibrium = equilibriumPath(config.compositionPct, config.partitionCoefficient, config.solidFraction);
    var scheil = scheilPath(config.compositionPct, config.partitionCoefficient, config.solidFraction);
    return {
      config: config,
      equilibrium: equilibrium,
      scheil: scheil,
      terminalBoundary: terminalBoundary(config.partitionCoefficient)
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
    if (children !== undefined && children !== null) {
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
      });
    }
    return node;
  }

  function svgElement(doc, tag, attributes, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, String(value));
    });
    if (children !== undefined && children !== null) {
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
      });
    }
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

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 820 410", role: "img", "aria-label": "平衡分配与 Scheil 凝固路径" });
    svg.appendChild(svgElement(doc, "title", {}, "液相和固相成分随固相分数的平衡与 Scheil 路径"));
    svg.appendChild(svgElement(doc, "desc", {}, "蓝绿曲线是平衡常数分配代理，红金曲线是 Scheil 无固相扩散路径；当前点用圆点标出。"));
    var plot = { x: 58, y: 48, width: 700, height: 290 };
    var endFraction = 0.98;
    var maxValue = Math.max(result.config.compositionPct * 1.5, result.scheil.liquidCompositionPct * 1.08, 1);
    function mapX(fs) { return plot.x + plot.width * fs / endFraction; }
    function mapY(value) { return plot.y + plot.height - plot.height * value / maxValue; }
    svg.appendChild(svgElement(doc, "rect", { x: plot.x, y: plot.y, width: plot.width, height: plot.height, fill: "none", stroke: "currentColor" }));
    var paths = [
      { color: "#2563a6", dash: null, get: function (fs) { return equilibriumPath(result.config.compositionPct, result.config.partitionCoefficient, fs).liquidCompositionPct; } },
      { color: "#b64335", dash: null, get: function (fs) { return scheilPath(result.config.compositionPct, result.config.partitionCoefficient, fs).liquidCompositionPct; } },
      { color: "#39734d", dash: "7 4", get: function (fs) { return equilibriumPath(result.config.compositionPct, result.config.partitionCoefficient, fs).solidInstantPct; } },
      { color: "#9b6a12", dash: "3 5", get: function (fs) { return scheilPath(result.config.compositionPct, result.config.partitionCoefficient, fs).solidInstantPct; } }
    ];
    paths.forEach(function (path) {
      var commands = [];
      for (var index = 0; index <= 100; index += 1) {
        var fs = endFraction * index / 100;
        commands.push((index ? "L" : "M") + mapX(fs).toFixed(2) + " " + mapY(path.get(fs)).toFixed(2));
      }
      svg.appendChild(svgElement(doc, "path", { d: commands.join(" "), fill: "none", stroke: path.color, "stroke-width": 3, "stroke-dasharray": path.dash || false }));
    });
    svg.appendChild(svgElement(doc, "line", { x1: plot.x, y1: mapY(result.config.compositionPct), x2: plot.x + plot.width, y2: mapY(result.config.compositionPct), stroke: "#76539b", "stroke-dasharray": "4 4" }));
    var fsX = mapX(result.config.solidFraction);
    svg.appendChild(svgElement(doc, "circle", { cx: fsX, cy: mapY(result.equilibrium.liquidCompositionPct), r: 5, fill: "#2563a6", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "circle", { cx: fsX, cy: mapY(result.scheil.liquidCompositionPct), r: 5, fill: "#b64335", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + 5, y: 27, "font-size": 14, "font-weight": 700 }, "蓝/绿：平衡　红/金：Scheil　紫虚线：C0"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + plot.width, y: plot.y + plot.height + 29, "font-size": 12, "text-anchor": "end" }, "固相分数 fs"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x - 8, y: plot.y + 12, "font-size": 12, transform: "rotate(-90 " + (plot.x - 8) + " " + (plot.y + 12) + ")" }, "溶质成分 / wt%"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var rows = [
      ["初始成分 C0", format(result.config.compositionPct, 2), "wt% 溶质；总质量账本"],
      ["分配系数 k", format(result.config.partitionCoefficient, 3), "Cs/Cl；常数 k 教学代理"],
      ["当前固相分数 fs", format(result.config.solidFraction, 2), "无量纲"],
      ["平衡 Cl / Cs", format(result.equilibrium.liquidCompositionPct, 3) + " / " + format(result.equilibrium.solidInstantPct, 3), "wt%；完全固相扩散代理"],
      ["Scheil Cl / Cs,inst", format(result.scheil.liquidCompositionPct, 3) + " / " + format(result.scheil.solidInstantPct, 3), "wt%；液体混合、固相无扩散"],
      ["Scheil 平均固相 Cs,avg", format(result.scheil.solidAveragePct, 3), "wt%；由质量守恒反算"],
      ["Scheil 质量闭合误差", format(result.scheil.closureErrorPct, 6), "wt%；fs Cs,avg + (1−fs)Cl − C0"],
      ["fs → 1 / k = 1 边界", result.terminalBoundary, "模型边界"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })]));
    });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "凝固路径有量纲账本" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]),
      body
    ]));
  }

  function questionSpecs() {
    return [
      {
        key: "enrichment",
        prompt: "当 k < 1 且 fs 增大时，理想 Scheil 液体中的溶质趋势是？",
        expected: "rise",
        choices: [{ value: "rise", label: "逐渐富集" }, { value: "same", label: "保持 C0" }, { value: "fall", label: "逐渐贫化" }]
      },
      {
        key: "unity",
        prompt: "若 k = 1，平衡路径与 Scheil 路径的偏析结论是？",
        expected: "none",
        choices: [{ value: "none", label: "无分配偏析，Cl = Cs = C0" }, { value: "scheil", label: "Scheil 仍无限富集" }, { value: "solid", label: "只有固相富集" }]
      },
      {
        key: "terminal",
        prompt: "对 k < 1 的理想 Scheil 式，把 fs 推向 1 时应怎样读？",
        expected: "boundary",
        choices: [{ value: "boundary", label: "先遇模型边界，Cl 形式发散" }, { value: "finite", label: "始终有限并等于 C0" }, { value: "zero", label: "Cl 立刻变成 0" }]
      }
    ];
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "ms-lab" });
    shell.appendChild(element(doc, "h3", { text: "凝固实验：沿平衡与 Scheil 路径追踪液体富集，并做质量守恒" }));
    shell.appendChild(element(doc, "p", { className: "ms-note", text: "先预测液体趋势、k = 1 边界和 fs → 1 的含义；揭示后再读两条路径和闭合误差。" }));
    var predictionHost = element(doc, "div");
    var predictionGroups = [];
    questionSpecs().forEach(function (spec) {
      var fieldset = element(doc, "fieldset");
      fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
      var grid = element(doc, "div", { className: "ms-choice-grid" });
      var group = { key: spec.key, buttons: [] };
      spec.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
        button.addEventListener("click", function () {
          state.predictions[spec.key] = choice.value;
          state.feedback = "";
          render();
        });
        group.buttons.push({ node: button, value: choice.value });
        grid.appendChild(button);
      });
      predictionGroups.push(group);
      fieldset.appendChild(grid);
      predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "ms-actions" });
    var reveal = element(doc, "button", { type: "button", className: "ms-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "ms-feedback", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "ms-controls" });
    var inputs = {};
    function addRange(key, label, min, max, step, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = Number(input.value);
        state.feedback = state.revealed ? "参数已更新；凝固账本仍保持揭示。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits };
      controls.appendChild(element(doc, "div", { className: "ms-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }
    addRange("compositionPct", "初始溶质 C0 / wt%", "0.5", "12", "0.5", 1);
    addRange("partitionCoefficient", "分配系数 k", "0.05", "1", "0.05", 2);
    addRange("solidFraction", "固相分数 fs", "0.05", "0.95", "0.05", 2);
    var chart = element(doc, "div", { className: "ms-chart" });
    var tableWrap = element(doc, "div", { className: "ms-table-wrap" });
    var note = element(doc, "p", { className: "ms-note" });
    resultPanel.appendChild(controls);
    resultPanel.appendChild(element(doc, "div", { className: "ms-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项凝固路径预测；揭示前不显示曲线和质量账本。";
        render();
        return;
      }
      var result = solidificationLedger(state.config);
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。Scheil 质量闭合误差为 " + format(result.scheil.closureErrorPct, 6) + " wt%。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      render();
      announce(api, rootNode, "凝固预测、路径和质量账本已重置。");
    });

    function render() {
      var result = solidificationLedger(state.config);
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
      });
      predictionGroups.forEach(function (group) {
        group.buttons.forEach(function (button) { button.node.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); });
      });
      feedback.textContent = state.feedback;
      feedback.className = "ms-feedback" + (state.feedback.indexOf("请先") === 0 ? " ms-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed) {
        chart.replaceChildren();
        tableWrap.replaceChildren();
        note.textContent = "揭示后显示平衡/Scheil 曲线、瞬时固相、平均固相和质量守恒闭合。";
        return;
      }
      chart.replaceChildren(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "模型边界：平衡路径把 k 视为常数并假设固相可完全扩散均匀；Scheil 路径假设液体完全混合、固相无扩散、界面局部平衡。真实合金会受枝晶间距、对流、固相扩散、溶解度/共晶反应、热传递和传质边界限制；k = 1 时两条教学路径退化为无偏析，fs → 1 对 k < 1 的理想式则是警示边界而不是无限可用的浓度预测。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200" && format(60, 0) === "60", "zero-decimal formatter preserves integer trailing zeros");
    var base = solidificationLedger(DEFAULTS);
    check(base.scheil.liquidCompositionPct > base.config.compositionPct, "k below one enriches Scheil liquid");
    check(near(base.scheil.massBalancePct, base.config.compositionPct, 1e-12), "Scheil path closes mass balance");
    check(near(base.equilibrium.massBalancePct, base.config.compositionPct, 1e-12), "equilibrium path closes mass balance");
    var unity = solidificationLedger({ compositionPct: 4, partitionCoefficient: 1, solidFraction: 0.8 });
    check(near(unity.scheil.liquidCompositionPct, 4, 1e-12) && near(unity.scheil.solidInstantPct, 4, 1e-12), "k=1 removes Scheil segregation");
    check(unity.terminalBoundary.indexOf("无分配偏析") !== -1, "k=1 terminal boundary is explicit");
    var nearTerminal = scheilPath(4, 0.25, 0.99);
    check(nearTerminal.liquidCompositionPct > base.scheil.liquidCompositionPct, "Scheil enrichment grows as fs approaches one");
    var threw = false;
    try { solidificationLedger({ partitionCoefficient: 0 }); } catch (error) { threw = true; }
    check(threw, "zero partition coefficient rejected");
    threw = false;
    try { scheilPath(4, 0.25, 1); } catch (error2) { threw = true; }
    check(threw, "fs=1 is outside the finite Scheil input domain");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    equilibriumPath: equilibriumPath,
    scheilPath: scheilPath,
    terminalBoundary: terminalBoundary,
    solidificationLedger: solidificationLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
