(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-ceramic-weibull", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-ceramic-weibull self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-ceramic-weibull self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-ceramic-weibull-styles";
  var DEFAULTS = {
    volumeRatio: 0.25,
    weibullModulus: 8,
    scaleStressMPa: 300,
    serviceStressMPa: 240,
    proofStressMPa: 300
  };
  var STYLE_TEXT = [
    '[data-learning-lab="materials-ceramic-weibull"]{--cw-blue:#2563a6;--cw-red:#b64335;--cw-green:#39734d;--cw-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="materials-ceramic-weibull"] *{box-sizing:border-box}[data-learning-lab="materials-ceramic-weibull"] [hidden]{display:none!important}',
    '[data-learning-lab="materials-ceramic-weibull"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-ceramic-weibull"] p{margin:8px 0}',
    '[data-learning-lab="materials-ceramic-weibull"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-ceramic-weibull"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="materials-ceramic-weibull"] .cw-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-ceramic-weibull"] button,[data-learning-lab="materials-ceramic-weibull"] input{font:inherit}',
    '[data-learning-lab="materials-ceramic-weibull"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-ceramic-weibull"] button:hover{border-color:var(--cw-blue)}[data-learning-lab="materials-ceramic-weibull"] button[aria-pressed="true"],[data-learning-lab="materials-ceramic-weibull"] .cw-primary{border-color:var(--cw-blue);background:var(--cw-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="materials-ceramic-weibull"] button:focus-visible,[data-learning-lab="materials-ceramic-weibull"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-ceramic-weibull"] .cw-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-ceramic-weibull"] .cw-actions>*{flex:1 1 170px}[data-learning-lab="materials-ceramic-weibull"] .cw-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-ceramic-weibull"] .cw-warn{color:var(--cw-red)}',
    '[data-learning-lab="materials-ceramic-weibull"] .cw-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end;margin-top:12px}[data-learning-lab="materials-ceramic-weibull"] .cw-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-ceramic-weibull"] .cw-control label{font-size:13px;font-weight:700}[data-learning-lab="materials-ceramic-weibull"] output{color:var(--cw-blue);font-variant-numeric:tabular-nums}[data-learning-lab="materials-ceramic-weibull"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--cw-blue)}',
    '[data-learning-lab="materials-ceramic-weibull"] .cw-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="materials-ceramic-weibull"] .cw-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-ceramic-weibull"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="materials-ceramic-weibull"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="materials-ceramic-weibull"] .cw-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="materials-ceramic-weibull"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-ceramic-weibull"] th,[data-learning-lab="materials-ceramic-weibull"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-ceramic-weibull"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-ceramic-weibull"] .cw-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--cw-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:900px){[data-learning-lab="materials-ceramic-weibull"] .cw-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="materials-ceramic-weibull"] .cw-grid{grid-template-columns:1fr}}@media(max-width:560px){[data-learning-lab="materials-ceramic-weibull"] .cw-controls{grid-template-columns:1fr}[data-learning-lab="materials-ceramic-weibull"] .cw-choice-grid{grid-template-columns:1fr}}@media(max-width:430px){[data-learning-lab="materials-ceramic-weibull"] .cw-chart{padding:4px}[data-learning-lab="materials-ceramic-weibull"] table{font-size:11px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-ceramic-weibull"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
  ].join("");

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function parseNumber(value, label) {
    if (typeof value === "string" && value.trim() === "") throw new RangeError(label + " must not be blank");
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
    return {
      volumeRatio: DEFAULTS.volumeRatio,
      weibullModulus: DEFAULTS.weibullModulus,
      scaleStressMPa: DEFAULTS.scaleStressMPa,
      serviceStressMPa: DEFAULTS.serviceStressMPa,
      proofStressMPa: DEFAULTS.proofStressMPa
    };
  }

  function normalizeConfig(input) {
    var source = input || {};
    var volumeRatio = parseNumber(source.volumeRatio === undefined ? DEFAULTS.volumeRatio : source.volumeRatio, "V/V0");
    var weibullModulus = parseNumber(source.weibullModulus === undefined ? DEFAULTS.weibullModulus : source.weibullModulus, "Weibull modulus");
    var scaleStressMPa = parseNumber(source.scaleStressMPa === undefined ? DEFAULTS.scaleStressMPa : source.scaleStressMPa, "sigma0");
    var serviceStressMPa = parseNumber(source.serviceStressMPa === undefined ? DEFAULTS.serviceStressMPa : source.serviceStressMPa, "service stress");
    var proofStressMPa = parseNumber(source.proofStressMPa === undefined ? DEFAULTS.proofStressMPa : source.proofStressMPa, "proof stress");
    if (volumeRatio <= 0 || volumeRatio > 1000) throw new RangeError("V/V0 must be in (0, 1000]");
    if (weibullModulus <= 0.5 || weibullModulus > 100) throw new RangeError("Weibull modulus m must be in (0.5, 100]");
    if (scaleStressMPa <= 0 || scaleStressMPa > 100000) throw new RangeError("sigma0 must be in (0, 100000] MPa");
    if (serviceStressMPa < 0 || serviceStressMPa > 100000 || proofStressMPa < 0 || proofStressMPa > 100000) {
      throw new RangeError("service and proof stresses must be in [0, 100000] MPa");
    }
    return {
      volumeRatio: volumeRatio,
      weibullModulus: weibullModulus,
      scaleStressMPa: scaleStressMPa,
      serviceStressMPa: serviceStressMPa,
      proofStressMPa: proofStressMPa
    };
  }

  function weibullProbability(stressMPa, volumeRatio, scaleStressMPa, weibullModulus) {
    var stress = parseNumber(stressMPa, "stress");
    var volume = parseNumber(volumeRatio, "V/V0");
    var scale = parseNumber(scaleStressMPa, "sigma0");
    var modulus = parseNumber(weibullModulus, "m");
    if (stress < 0 || volume <= 0 || scale <= 0 || modulus <= 0) throw new RangeError("Weibull inputs are outside the model domain");
    return 1 - Math.exp(-volume * Math.pow(stress / scale, modulus));
  }

  function survivalProbability(stressMPa, volumeRatio, scaleStressMPa, weibullModulus) {
    return 1 - weibullProbability(stressMPa, volumeRatio, scaleStressMPa, weibullModulus);
  }

  function quantileStress(probability, volumeRatio, scaleStressMPa, weibullModulus) {
    var probabilityValue = parseNumber(probability, "failure probability");
    var volume = parseNumber(volumeRatio, "V/V0");
    var scale = parseNumber(scaleStressMPa, "sigma0");
    var modulus = parseNumber(weibullModulus, "m");
    if (probabilityValue < 0 || probabilityValue >= 1 || volume <= 0 || scale <= 0 || modulus <= 0) throw new RangeError("quantile inputs are outside the model domain");
    return scale * Math.pow(-Math.log1p(-probabilityValue) / volume, 1 / modulus);
  }

  function conditionalSurvivalAfterProof(serviceStressMPa, proofStressMPa, volumeRatio, scaleStressMPa, weibullModulus) {
    var service = parseNumber(serviceStressMPa, "service stress");
    var proof = parseNumber(proofStressMPa, "proof stress");
    var volume = parseNumber(volumeRatio, "V/V0");
    var scale = parseNumber(scaleStressMPa, "sigma0");
    var modulus = parseNumber(weibullModulus, "m");
    if (service < 0 || proof < 0 || volume <= 0 || scale <= 0 || modulus <= 0) throw new RangeError("conditional-survival inputs are outside the model domain");
    if (service <= proof) return 1;
    var serviceTerm = Math.pow(service / scale, modulus);
    var proofTerm = Math.pow(proof / scale, modulus);
    return Math.exp(-volume * (serviceTerm - proofTerm));
  }

  function ceramicLedger(input) {
    var config = normalizeConfig(input);
    var serviceFailureProbability = weibullProbability(config.serviceStressMPa, config.volumeRatio, config.scaleStressMPa, config.weibullModulus);
    var proofPassProbability = survivalProbability(config.proofStressMPa, config.volumeRatio, config.scaleStressMPa, config.weibullModulus);
    var conditionalServiceSurvival = conditionalSurvivalAfterProof(config.serviceStressMPa, config.proofStressMPa, config.volumeRatio, config.scaleStressMPa, config.weibullModulus);
    var maxStress = Math.max(500, config.serviceStressMPa, config.proofStressMPa, config.scaleStressMPa * 1.6);
    var cdf = [];
    for (var index = 0; index <= 120; index += 1) {
      var stress = maxStress * index / 120;
      cdf.push({ stressMPa: stress, failureProbability: weibullProbability(stress, config.volumeRatio, config.scaleStressMPa, config.weibullModulus) });
    }
    return {
      config: config,
      serviceFailureProbability: serviceFailureProbability,
      serviceSurvivalProbability: 1 - serviceFailureProbability,
      proofPassProbability: proofPassProbability,
      conditionalServiceSurvival: conditionalServiceSurvival,
      conditionalServiceFailure: 1 - conditionalServiceSurvival,
      p10StressMPa: quantileStress(0.10, config.volumeRatio, config.scaleStressMPa, config.weibullModulus),
      p50StressMPa: quantileStress(0.50, config.volumeRatio, config.scaleStressMPa, config.weibullModulus),
      p90StressMPa: quantileStress(0.90, config.volumeRatio, config.scaleStressMPa, config.weibullModulus),
      cdf: cdf
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

  function questionSpecs() {
    return [
      {
        key: "volume",
        prompt: "在同一 sigma、sigma0 和 m 下，V/V0 增大时失效概率 Pf 如何变化？",
        expected: "higher",
        choices: [{ value: "higher", label: "升高" }, { value: "lower", label: "降低" }, { value: "same", label: "不变" }]
      },
      {
        key: "modulus",
        prompt: "在固定 sigma/sigma0 = 1.1 (>1) 时，把 Weibull 模数 m 增大，Pf 的方向是？",
        expected: "higher",
        choices: [{ value: "higher", label: "升高，分布更集中在低于该比值一侧" }, { value: "lower", label: "降低" }, { value: "same", label: "不变" }]
      },
      {
        key: "proof",
        prompt: "理想静态 weakest-link 模型中，proof stress 高于 service stress 且试件通过 proof test 后，条件存活率是？",
        expected: "one",
        choices: [{ value: "one", label: "1；同一缺陷阈值下不再新增失效" }, { value: "half", label: "约 0.5" }, { value: "zero", label: "0" }]
      }
    ];
  }

  function renderPredictions(doc, hostNode, state) {
    clear(hostNode);
    questionSpecs().forEach(function (spec, index) {
      var buttons = spec.choices.map(function (choice) {
        return element(doc, "button", { type: "button", text: choice.label, "aria-pressed": state.predictions[spec.key] === choice.value ? "true" : "false" });
      });
      buttons.forEach(function (button, choiceIndex) {
        button.addEventListener("click", function () {
          state.predictions[spec.key] = spec.choices[choiceIndex].value;
          renderPredictions(doc, hostNode, state);
        });
      });
      hostNode.appendChild(element(doc, "fieldset", {}, [element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }), element(doc, "div", { className: "cw-choice-grid" }, buttons)]));
    });
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 820 410", role: "img", "aria-label": "陶瓷 Weibull 失效概率 CDF 和 proof test 标记" });
    svg.appendChild(svgElement(doc, "title", {}, "Weibull weakest-link CDF 与 proof test 风险"));
    svg.appendChild(svgElement(doc, "desc", {}, "曲线显示体积尺度下的失效概率；蓝线为 service stress，金线为 proof stress，表格给出 proof 后的条件存活率。"));
    var plot = { x: 66, y: 48, width: 700, height: 275 };
    var maxStress = result.cdf[result.cdf.length - 1].stressMPa;
    function mapX(stress) { return plot.x + plot.width * stress / maxStress; }
    function mapY(probability) { return plot.y + plot.height - plot.height * probability; }
    svg.appendChild(svgElement(doc, "rect", { x: plot.x, y: plot.y, width: plot.width, height: plot.height, fill: "none", stroke: "currentColor" }));
    [0, 0.25, 0.5, 0.75, 1].forEach(function (level) {
      var y = mapY(level);
      svg.appendChild(svgElement(doc, "line", { x1: plot.x, y1: y, x2: plot.x + plot.width, y2: y, stroke: "currentColor", "stroke-opacity": 0.15 }));
      svg.appendChild(svgElement(doc, "text", { x: plot.x - 8, y: y + 4, "font-size": 11, "text-anchor": "end" }, format(level, 2)));
    });
    var path = [];
    result.cdf.forEach(function (point, index) { path.push((index ? "L" : "M") + mapX(point.stressMPa).toFixed(2) + " " + mapY(point.failureProbability).toFixed(2)); });
    svg.appendChild(svgElement(doc, "path", { d: path.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 3 }));
    function marker(stress, color, label, probability) {
      var x = mapX(stress);
      svg.appendChild(svgElement(doc, "line", { x1: x, y1: plot.y, x2: x, y2: plot.y + plot.height, stroke: color, "stroke-width": 2, "stroke-dasharray": "5 4" }));
      svg.appendChild(svgElement(doc, "circle", { cx: x, cy: mapY(probability), r: 5, fill: color, stroke: "Canvas", "stroke-width": 2 }));
      svg.appendChild(svgElement(doc, "text", { x: Math.min(x + 5, plot.x + plot.width - 5), y: plot.y + 19 + (label === "proof" ? 15 : 0), "font-size": 11 }, label + " " + format(stress, 0) + " MPa"));
    }
    marker(result.config.serviceStressMPa, "#2563a6", "service", result.serviceFailureProbability);
    marker(result.config.proofStressMPa, "#9b6a12", "proof", 1 - result.proofPassProbability);
    svg.appendChild(svgElement(doc, "text", { x: plot.x + 4, y: 27, "font-size": 14, "font-weight": 700 }, "Weibull weakest-link：Pf vs stress"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + 8, y: plot.y + 18, "font-size": 11 }, "红 CDF；蓝 service；金 proof；V/V0 = " + format(result.config.volumeRatio, 3) + "，m = " + format(result.config.weibullModulus, 2)));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + plot.width, y: plot.y + plot.height + 30, "font-size": 12, "text-anchor": "end" }, "应力 sigma / MPa"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x - 10, y: plot.y + 12, "font-size": 12, transform: "rotate(-90 " + (plot.x - 10) + " " + (plot.y + 12) + ")" }, "失效概率 Pf"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var rows = [
      ["有效体积比 V/V0", format(result.config.volumeRatio, 4), "无量纲；V 不能裸带量纲"],
      ["Weibull 模数 m", format(result.config.weibullModulus, 3), "无量纲；缺陷离散程度代理"],
      ["尺度应力 sigma0", format(result.config.scaleStressMPa, 3), "MPa；V = V0 时 Pf = 1 - e^-1"],
      ["service 应力", format(result.config.serviceStressMPa, 3), "MPa"],
      ["service 原始 Pf", format(result.serviceFailureProbability, 5), "未 proof test 的 weakest-link CDF"],
      ["proof 应力", format(result.config.proofStressMPa, 3), "MPa"],
      ["proof 通过概率", format(result.proofPassProbability, 5), "P(survive proof)"],
      ["proof 后 service 条件存活", format(result.conditionalServiceSurvival, 5), "P(survive service | survive proof)"],
      ["分位强度 P10 / P50 / P90", format(result.p10StressMPa, 2) + " / " + format(result.p50StressMPa, 2) + " / " + format(result.p90StressMPa, 2), "MPa；对应 Pf = 0.10 / 0.50 / 0.90"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "陶瓷尺寸效应与 proof 风险账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 读法" })])]), body]));
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "cw-shell" });
    shell.appendChild(element(doc, "h3", { text: "互动实验：Weibull weakest-link、体积尺度与 proof test" }));
    shell.appendChild(element(doc, "p", { className: "cw-note", text: "先预测体积、模数和 proof 的方向。揭示后可调节有效体积比与应力，曲线和条件概率始终使用同一静态缺陷模型。" }));
    var predictionHost = element(doc, "div", { className: "cw-predictions" });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "cw-actions" });
    var reveal = element(doc, "button", { type: "button", className: "cw-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "cw-feedback", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "cw-controls" });
    var inputs = {};

    function addRange(key, label, min, max, step, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = parseNumber(input.value, label);
        state.feedback = state.revealed ? "参数已更新；预测结果保持揭示。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits };
      controls.appendChild(element(doc, "div", { className: "cw-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }

    addRange("volumeRatio", "V/V0 / 无量纲", "0.05", "5", "0.05", 2);
    addRange("weibullModulus", "m / 无量纲", "2", "20", "0.5", 1);
    addRange("scaleStressMPa", "sigma0 / MPa", "100", "600", "10", 0);
    addRange("serviceStressMPa", "service sigma / MPa", "0", "500", "10", 0);
    addRange("proofStressMPa", "proof sigma / MPa", "0", "500", "10", 0);
    resultPanel.appendChild(controls);
    var chart = element(doc, "div", { className: "cw-chart" });
    var tableWrap = element(doc, "div", { className: "cw-table-wrap" });
    var note = element(doc, "p", { className: "cw-note" });
    resultPanel.appendChild(element(doc, "div", { className: "cw-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);
    renderPredictions(doc, predictionHost, state);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测；揭示前不显示 CDF、分位强度和 proof 风险账本。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。现在可以调参观察尺寸效应。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      renderPredictions(doc, predictionHost, state);
      render();
      announce(api, rootNode, "陶瓷预测、CDF 和风险账本已重置。");
    });

    function render() {
      var result = null;
      var error = null;
      try { result = ceramicLedger(state.config); } catch (caught) { error = caught; }
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
      });
      feedback.textContent = error ? "输入超出模型范围：" + error.message : state.feedback;
      feedback.className = "cw-feedback" + (error || (state.feedback.indexOf("请先") === 0) ? " cw-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed || !result) {
        chart.replaceChildren();
        tableWrap.replaceChildren();
        note.textContent = error ? "请把体积比、m 和应力调回模型范围。" : "揭示后显示 CDF、分位强度、proof 通过概率和条件存活率。";
        return;
      }
      chart.replaceChildren(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "模型边界：独立同分布缺陷、均匀应力积分和静态 weakest-link 是简化；proof test 只筛掉较大缺陷，不提高剩余材料的本征韧性，也未包含亚临界裂纹增长、残余应力或时变疲劳。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(300, 0) === "300", "integer formatting preserves trailing zeros");
    check(near(parseNumber("0.25", "x"), 0.25), "numeric text is parsed");
    check(copyDefaults().volumeRatio === 0.25 && copyDefaults().weibullModulus === 8, "default values are stable");
    var base = ceramicLedger(DEFAULTS);
    check(base.serviceFailureProbability > 0 && base.serviceFailureProbability < 1, "default CDF is probabilistic");
    check(weibullProbability(240, 0.5, 300, 8) > weibullProbability(240, 0.25, 300, 8), "larger effective volume raises Pf");
    check(weibullProbability(360, 0.25, 300, 8) > weibullProbability(240, 0.25, 300, 8), "larger stress raises Pf");
    check(weibullProbability(330, 0.25, 300, 8) > weibullProbability(330, 0.25, 300, 4), "at stress ratio above one, larger m raises Pf");
    check(quantileStress(0.9, 0.25, 300, 8) > quantileStress(0.1, 0.25, 300, 8), "higher failure quantile has higher stress");
    check(near(conditionalSurvivalAfterProof(240, 300, 0.25, 300, 8), 1), "service below proof has unit conditional survival in static model");
    check(base.cdf.length === 121 && JSON.stringify(base.cdf) === JSON.stringify(ceramicLedger(DEFAULTS).cdf), "CDF is deterministic");
    check(normalizeConfig({ volumeRatio: 1000 }).volumeRatio === 1000, "volume upper boundary is accepted");
    var threw = false;
    try { parseNumber("", "blank"); } catch (error) { threw = true; }
    check(threw, "blank input is rejected");
    threw = false;
    try { normalizeConfig({ volumeRatio: 0 }); } catch (error2) { threw = true; }
    check(threw, "non-positive effective volume is rejected");
    threw = false;
    try { quantileStress(1, 1, 1, 8); } catch (error3) { threw = true; }
    check(threw, "probability one quantile is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    parseNumber: parseNumber,
    normalizeConfig: normalizeConfig,
    weibullProbability: weibullProbability,
    survivalProbability: survivalProbability,
    quantileStress: quantileStress,
    conditionalSurvivalAfterProof: conditionalSurvivalAfterProof,
    ceramicLedger: ceramicLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
