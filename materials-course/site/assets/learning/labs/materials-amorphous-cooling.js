(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-amorphous-cooling", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-amorphous-cooling self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-amorphous-cooling self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-amorphous-cooling-styles";
  var DEFAULTS = {
    rateLog10: 4,
    criticalRateLog10: 3
  };
  var T_G_REF_K = 520;
  var T_G_SHIFT_PER_DECADE_K = 18;
  var FREEZE_OFFSET_K = 20;
  var FREE_VOLUME_REF = 0.020;
  var FREE_VOLUME_PER_K = 0.00012;
  var STYLE_TEXT = [
    '[data-learning-lab="materials-amorphous-cooling"]{--ma-blue:#2563a6;--ma-red:#b64335;--ma-green:#39734d;--ma-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="materials-amorphous-cooling"] *{box-sizing:border-box}[data-learning-lab="materials-amorphous-cooling"] [hidden]{display:none!important}',
    '[data-learning-lab="materials-amorphous-cooling"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-amorphous-cooling"] p{margin:8px 0}',
    '[data-learning-lab="materials-amorphous-cooling"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-amorphous-cooling"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="materials-amorphous-cooling"] .ma-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-amorphous-cooling"] button,[data-learning-lab="materials-amorphous-cooling"] input{font:inherit}',
    '[data-learning-lab="materials-amorphous-cooling"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-amorphous-cooling"] button:hover{border-color:var(--ma-blue)}[data-learning-lab="materials-amorphous-cooling"] button[aria-pressed="true"],[data-learning-lab="materials-amorphous-cooling"] .ma-primary{border-color:var(--ma-blue);background:var(--ma-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="materials-amorphous-cooling"] button:focus-visible,[data-learning-lab="materials-amorphous-cooling"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-amorphous-cooling"] .ma-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-amorphous-cooling"] .ma-actions>*{flex:1 1 170px}[data-learning-lab="materials-amorphous-cooling"] .ma-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-amorphous-cooling"] .ma-good{color:var(--ma-green)}[data-learning-lab="materials-amorphous-cooling"] .ma-warn{color:var(--ma-red)}',
    '[data-learning-lab="materials-amorphous-cooling"] .ma-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end;margin-top:12px}[data-learning-lab="materials-amorphous-cooling"] .ma-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-amorphous-cooling"] .ma-control label{font-size:13px;font-weight:700}[data-learning-lab="materials-amorphous-cooling"] output{color:var(--ma-blue);font-variant-numeric:tabular-nums}[data-learning-lab="materials-amorphous-cooling"] input[type="range"]{display:block;width:100%;min-height:44px;accent-color:var(--ma-blue)}',
    '[data-learning-lab="materials-amorphous-cooling"] .ma-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="materials-amorphous-cooling"] .ma-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-amorphous-cooling"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="materials-amorphous-cooling"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="materials-amorphous-cooling"] .ma-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="materials-amorphous-cooling"] table{width:100%;min-width:420px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-amorphous-cooling"] th,[data-learning-lab="materials-amorphous-cooling"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-amorphous-cooling"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-amorphous-cooling"] .ma-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--ma-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:760px){[data-learning-lab="materials-amorphous-cooling"] .ma-grid{grid-template-columns:1fr}}@media(max-width:560px){[data-learning-lab="materials-amorphous-cooling"] .ma-controls{grid-template-columns:1fr}[data-learning-lab="materials-amorphous-cooling"] .ma-choice-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-amorphous-cooling"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
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
    return { rateLog10: DEFAULTS.rateLog10, criticalRateLog10: DEFAULTS.criticalRateLog10 };
  }

  function normalizeConfig(input) {
    var source = input || {};
    var rateLog10 = finite(source.rateLog10 === undefined ? DEFAULTS.rateLog10 : source.rateLog10, "cooling-rate exponent");
    var criticalRateLog10 = finite(source.criticalRateLog10 === undefined ? DEFAULTS.criticalRateLog10 : source.criticalRateLog10, "critical-rate exponent");
    if (rateLog10 < -1 || rateLog10 > 6) throw new RangeError("cooling-rate exponent must be in [-1, 6]");
    if (criticalRateLog10 < 0 || criticalRateLog10 > 6) throw new RangeError("critical-rate exponent must be in [0, 6]");
    return { rateLog10: rateLog10, criticalRateLog10: criticalRateLog10 };
  }

  function gaussian(value, center, width) {
    return Math.exp(-0.5 * Math.pow((value - center) / width, 2));
  }

  function rdfSketch(glassScore, count) {
    var score = finite(glassScore, "glass score");
    if (score < 0 || score > 1) throw new RangeError("glass score must be in [0, 1]");
    var samples = count === undefined ? 161 : Math.round(finite(count, "RDF sample count"));
    if (samples < 2) throw new RangeError("RDF sample count must be at least 2");
    var points = [];
    for (var index = 0; index < samples; index += 1) {
      var r = 1.5 + 6.5 * index / (samples - 1);
      var firstWidth = 0.10 + 0.14 * score;
      var secondWidth = 0.16 + 0.20 * score;
      var thirdWidth = 0.20 + 0.28 * score;
      var longRange = (1 - score) * 0.62 * Math.sin((r - 2.1) * 4.4) * Math.exp(-0.13 * (r - 2.2));
      var value = 1 + 1.85 * gaussian(r, 2.55, firstWidth) + 1.08 * gaussian(r, 4.52, secondWidth) + 0.63 * gaussian(r, 6.42, thirdWidth) + longRange;
      points.push({ rAngstrom: r, g: Math.max(0.35, value) });
    }
    return points;
  }

  function amorphousLedger(input) {
    var config = normalizeConfig(input);
    var rateKPerS = Math.pow(10, config.rateLog10);
    var criticalRateKPerS = Math.pow(10, config.criticalRateLog10);
    var tgK = clamp(T_G_REF_K + T_G_SHIFT_PER_DECADE_K * config.rateLog10, 380, 700);
    var fictiveTemperatureK = tgK - FREEZE_OFFSET_K;
    var freeVolumeFraction = clamp(FREE_VOLUME_REF + FREE_VOLUME_PER_K * (fictiveTemperatureK - 500), 0.005, 0.08);
    var glassScore = 1 / (1 + Math.exp(-2 * (config.rateLog10 - config.criticalRateLog10)));
    return {
      config: config,
      rateKPerS: rateKPerS,
      criticalRateKPerS: criticalRateKPerS,
      tgK: tgK,
      tgC: tgK - 273.15,
      fictiveTemperatureK: fictiveTemperatureK,
      fictiveTemperatureC: fictiveTemperatureK - 273.15,
      freeVolumeFraction: freeVolumeFraction,
      freeVolumePct: 100 * freeVolumeFraction,
      glassScore: glassScore,
      stateLabel: glassScore >= 0.5 ? "玻璃样冻结代理" : "结晶倾向代理",
      rdf: rdfSketch(glassScore)
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
    var svg = svgElement(doc, "svg", { viewBox: "0 0 820 390", role: "img", "aria-label": "冷却率、Tg、fictive temperature 与径向分布函数示意" });
    svg.appendChild(svgElement(doc, "title", {}, "冷却率改变 Tg、fictive temperature 与 RDF 远程有序度"));
    svg.appendChild(svgElement(doc, "desc", {}, "左图是教学代理的冷却率扫描，右图是确定性径向分布函数草图；两者都不是材料通用数据库。"));
    var left = { x: 52, y: 48, width: 330, height: 260 };
    var right = { x: 450, y: 48, width: 320, height: 260 };
    function mapRate(logRate) { return left.x + left.width * (logRate + 1) / 7; }
    function mapTemp(temperature) { return left.y + left.height - left.height * (temperature - 380) / 320; }
    function mapR(r) { return right.x + right.width * (r - 1.5) / 6.5; }
    function mapG(g) { return right.y + right.height - right.height * (g - 0.3) / 3.0; }
    [left, right].forEach(function (plot) {
      svg.appendChild(svgElement(doc, "rect", { x: plot.x, y: plot.y, width: plot.width, height: plot.height, fill: "none", stroke: "currentColor", "stroke-width": 1 }));
    });
    var tgPath = [];
    var tfPath = [];
    for (var index = 0; index <= 100; index += 1) {
      var logRate = -1 + 7 * index / 100;
      var tg = clamp(T_G_REF_K + T_G_SHIFT_PER_DECADE_K * logRate, 380, 700);
      var tf = tg - FREEZE_OFFSET_K;
      tgPath.push((index ? "L" : "M") + mapRate(logRate).toFixed(2) + " " + mapTemp(tg).toFixed(2));
      tfPath.push((index ? "L" : "M") + mapRate(logRate).toFixed(2) + " " + mapTemp(tf).toFixed(2));
    }
    svg.appendChild(svgElement(doc, "path", { d: tgPath.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "path", { d: tfPath.join(" "), fill: "none", stroke: "#2563a6", "stroke-width": 3, "stroke-dasharray": "7 4" }));
    svg.appendChild(svgElement(doc, "line", { x1: mapRate(result.config.criticalRateLog10), y1: left.y, x2: mapRate(result.config.criticalRateLog10), y2: left.y + left.height, stroke: "#9b6a12", "stroke-dasharray": "4 4" }));
    svg.appendChild(svgElement(doc, "line", { x1: mapRate(result.config.rateLog10), y1: left.y, x2: mapRate(result.config.rateLog10), y2: left.y + left.height, stroke: "#39734d", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "circle", { cx: mapRate(result.config.rateLog10), cy: mapTemp(result.tgK), r: 5, fill: "#b64335", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "circle", { cx: mapRate(result.config.rateLog10), cy: mapTemp(result.fictiveTemperatureK), r: 5, fill: "#2563a6", stroke: "Canvas", "stroke-width": 2 }));
    var rdfPath = [];
    result.rdf.forEach(function (point, pointIndex) {
      rdfPath.push((pointIndex ? "L" : "M") + mapR(point.rAngstrom).toFixed(2) + " " + mapG(point.g).toFixed(2));
    });
    svg.appendChild(svgElement(doc, "path", { d: rdfPath.join(" "), fill: "none", stroke: "#39734d", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "line", { x1: right.x, y1: mapG(1), x2: right.x + right.width, y2: mapG(1), stroke: "#9b6a12", "stroke-dasharray": "4 4" }));
    svg.appendChild(svgElement(doc, "text", { x: left.x + 4, y: 27, "font-size": 14, "font-weight": 700 }, "左：冷却率扫描"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + 4, y: 27, "font-size": 14, "font-weight": 700 }, "右：RDF 草图 g(r)"));
    svg.appendChild(svgElement(doc, "text", { x: left.x + 8, y: left.y + 18, "font-size": 11 }, "红 Tg　蓝虚线 Tf　绿当前　金临界"));
    svg.appendChild(svgElement(doc, "text", { x: left.x + left.width, y: left.y + left.height + 28, "font-size": 12, "text-anchor": "end" }, "log10 冷却率 q / (K·s^-1)"));
    svg.appendChild(svgElement(doc, "text", { x: left.x - 8, y: left.y + 12, "font-size": 12, transform: "rotate(-90 " + (left.x - 8) + " " + (left.y + 12) + ")" }, "温度 / K"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + right.width, y: right.y + right.height + 28, "font-size": 12, "text-anchor": "end" }, "近邻距离 r / Å"));
    svg.appendChild(svgElement(doc, "text", { x: right.x - 8, y: right.y + 12, "font-size": 12, transform: "rotate(-90 " + (right.x - 8) + " " + (right.y + 12) + ")" }, "g(r)"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var rows = [
      ["冷却率 q", format(result.rateKPerS, 0), "K/s"],
      ["教学临界率 q*", format(result.criticalRateKPerS, 0), "K/s；只用于玻璃样冻结代理"],
      ["Tg*", format(result.tgK, 1), "K；速率依赖的教学代理"],
      ["fictive temperature Tf*", format(result.fictiveTemperatureK, 1), "K；冻结结构所对应的温度代理"],
      ["自由体积 φf*", format(result.freeVolumePct, 3), "%；由 Tf* 映射的教学代理"],
      ["玻璃样分数代理", format(result.glassScore, 3), "无量纲；不是相分数"],
      ["RDF 读法", result.glassScore >= 0.5 ? "近邻峰宽、远程振荡弱" : "峰较尖、远程振荡较强", "g(r) 结构草图"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })]));
    });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "非晶冷却路径有量纲账本" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]),
      body
    ]));
  }

  function questionSpecs() {
    return [
      {
        key: "tg",
        prompt: "同一玻璃体系把冷却率提高几个数量级，教学代理中的 Tg 与 Tf 方向是？",
        expected: "higher",
        choices: [{ value: "higher", label: "都向更高温移动" }, { value: "same", label: "都不变" }, { value: "lower", label: "都向更低温移动" }]
      },
      {
        key: "rdf",
        prompt: "非晶固体的径向分布函数更可能呈现哪种形状？",
        expected: "broad",
        choices: [{ value: "broad", label: "近邻宽峰、远程无锐周期峰" }, { value: "sharp", label: "无限重复的锐峰" }, { value: "flat", label: "所有距离完全平坦" }]
      },
      {
        key: "freeVolume",
        prompt: "在本实验的自由体积教学代理中，更快冷却会怎样？",
        expected: "more",
        choices: [{ value: "more", label: "冻结更多自由体积" }, { value: "same", label: "完全不变" }, { value: "less", label: "冻结更少自由体积" }]
      }
    ];
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "ma-lab" });
    shell.appendChild(element(doc, "h3", { text: "非晶实验：把冷却速率、冻结温度和短程有序放进一张账本" }));
    shell.appendChild(element(doc, "p", { className: "ma-note", text: "先判断速率趋势、RDF 形状和自由体积方向；揭示后再调参，结果会保持可见。" }));
    var predictionHost = element(doc, "div");
    var predictionGroups = [];
    questionSpecs().forEach(function (spec) {
      var fieldset = element(doc, "fieldset");
      fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
      var grid = element(doc, "div", { className: "ma-choice-grid" });
      var group = { key: spec.key, buttons: [] };
      spec.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
        button.addEventListener("click", function () {
          state.predictions[spec.key] = choice.value;
          state.feedback = "";
          render();
        });
        group.buttons.push({ node: button, value: choice.value, label: choice.label });
        grid.appendChild(button);
      });
      predictionGroups.push(group);
      fieldset.appendChild(grid);
      predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "ma-actions" });
    var reveal = element(doc, "button", { type: "button", className: "ma-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "ma-feedback", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "ma-controls" });
    var inputs = {};
    function addRange(key, label, min, max, step, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = Number(input.value);
        state.feedback = state.revealed ? "参数已更新；结果仍保持揭示。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits };
      controls.appendChild(element(doc, "div", { className: "ma-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }
    addRange("rateLog10", "log10 冷却率 q / (K/s)", "-1", "6", "0.1", 1);
    addRange("criticalRateLog10", "log10 教学临界率 q* / (K/s)", "0", "6", "0.1", 1);
    var chart = element(doc, "div", { className: "ma-chart" });
    var tableWrap = element(doc, "div", { className: "ma-table-wrap" });
    var note = element(doc, "p", { className: "ma-note" });
    var grid = element(doc, "div", { className: "ma-grid" }, [chart, tableWrap]);
    resultPanel.appendChild(controls);
    resultPanel.appendChild(grid);
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测；揭示前不显示冷却路径和 RDF 账本。";
        render();
        return;
      }
      var result = amorphousLedger(state.config);
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。" + result.stateLabel + "。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      render();
      announce(api, rootNode, "非晶冷却预测和账本已重置。");
    });

    function render() {
      var result = amorphousLedger(state.config);
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
      });
      predictionGroups.forEach(function (group) {
        group.buttons.forEach(function (button) {
          button.node.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false");
        });
      });
      feedback.textContent = state.feedback;
      feedback.className = "ma-feedback" + (state.feedback.indexOf("请先") === 0 ? " ma-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed) {
        chart.replaceChildren();
        tableWrap.replaceChildren();
        note.textContent = "揭示后显示 Tg*、Tf*、自由体积代理和 RDF 草图。";
        return;
      }
      chart.replaceChildren(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "边界说明：这里用 Tg* = Tg,ref + A log10(q/qref)、Tf* = Tg* - ΔTf 和 φf* 的线性映射做教学代理；真实 Tg、fictive temperature、自由体积和玻璃形成临界冷速依赖化学组成、样品尺寸、压力、热历史与测量协议。RDF 只画确定性短程/远程有序示意，不能替代散射数据。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200" && format(60, 0) === "60", "zero-decimal formatter preserves integer trailing zeros");
    var slow = amorphousLedger({ rateLog10: 0, criticalRateLog10: 3 });
    var fast = amorphousLedger({ rateLog10: 5, criticalRateLog10: 3 });
    check(fast.tgK > slow.tgK && fast.fictiveTemperatureK > slow.fictiveTemperatureK, "faster cooling shifts the teaching temperatures higher");
    check(fast.freeVolumeFraction > slow.freeVolumeFraction, "faster cooling retains more proxy free volume");
    check(fast.glassScore > slow.glassScore, "faster cooling raises glass-like score");
    var rdfA = rdfSketch(0.7, 17);
    var rdfB = rdfSketch(0.7, 17);
    check(JSON.stringify(rdfA) === JSON.stringify(rdfB), "RDF sketch is deterministic");
    check(rdfA.length === 17 && rdfA[0].g > 0, "RDF sketch has positive samples");
    check(amorphousLedger({ rateLog10: 6, criticalRateLog10: 6 }).glassScore === 0.5, "critical-rate boundary is centered");
    var threw = false;
    try { amorphousLedger({ rateLog10: 7 }); } catch (error) { threw = true; }
    check(threw, "out-of-range cooling rate rejected");
    threw = false;
    try { rdfSketch(1.2, 10); } catch (error2) { threw = true; }
    check(threw, "glass score outside [0,1] rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    amorphousLedger: amorphousLedger,
    rdfSketch: rdfSketch,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
