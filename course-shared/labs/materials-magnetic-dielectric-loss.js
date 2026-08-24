(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-magnetic-dielectric-loss", exported.mount);
  }
  if (typeof module === "object" && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-magnetic-dielectric-loss self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-magnetic-dielectric-loss self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var MU0_H_PER_M = 4 * Math.PI * 1e-7;
  var STYLE_ID = "materials-magnetic-dielectric-loss-styles";
  var DEFAULTS = {
    epsilonInf: 2.5,
    epsilonStatic: 12,
    tauS: 0.001,
    frequencyHz: 159.15494309189535,
    saturationApm: 100000,
    coerciveApm: 2000,
    branchWidthApm: 500,
    fieldMaxApm: 10000
  };
  var STYLE_TEXT = [
    '[data-learning-lab="materials-magnetic-dielectric-loss"]{--ml-blue:#2563a6;--ml-red:#b64335;--ml-green:#39734d;--ml-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="materials-magnetic-dielectric-loss"] *{box-sizing:border-box}[data-learning-lab="materials-magnetic-dielectric-loss"] [hidden]{display:none!important}',
    '[data-learning-lab="materials-magnetic-dielectric-loss"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-magnetic-dielectric-loss"] p{margin:8px 0}',
    '[data-learning-lab="materials-magnetic-dielectric-loss"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-magnetic-dielectric-loss"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-magnetic-dielectric-loss"] button,[data-learning-lab="materials-magnetic-dielectric-loss"] input{font:inherit}',
    '[data-learning-lab="materials-magnetic-dielectric-loss"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-magnetic-dielectric-loss"] button:hover{border-color:var(--ml-blue)}[data-learning-lab="materials-magnetic-dielectric-loss"] button[aria-pressed="true"],[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-primary{border-color:var(--ml-blue);background:var(--ml-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="materials-magnetic-dielectric-loss"] button:focus-visible,[data-learning-lab="materials-magnetic-dielectric-loss"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-actions>*{flex:1 1 170px}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-warn{color:var(--ml-red)}',
    '[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:end;margin-top:12px}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-control label{font-size:13px;font-weight:700}[data-learning-lab="materials-magnetic-dielectric-loss"] output{color:var(--ml-blue);font-variant-numeric:tabular-nums}[data-learning-lab="materials-magnetic-dielectric-loss"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ml-blue)}',
    '[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-magnetic-dielectric-loss"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="materials-magnetic-dielectric-loss"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="materials-magnetic-dielectric-loss"] table{width:100%;min-width:560px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-magnetic-dielectric-loss"] th,[data-learning-lab="materials-magnetic-dielectric-loss"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-magnetic-dielectric-loss"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--ml-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:1000px){[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-controls{grid-template-columns:repeat(3,minmax(0,1fr))}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-grid{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-choice-grid{grid-template-columns:1fr}}@media(max-width:430px){[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-controls{grid-template-columns:1fr}[data-learning-lab="materials-magnetic-dielectric-loss"] .ml-chart{padding:4px}[data-learning-lab="materials-magnetic-dielectric-loss"] table{font-size:11px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-magnetic-dielectric-loss"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
      epsilonInf: DEFAULTS.epsilonInf,
      epsilonStatic: DEFAULTS.epsilonStatic,
      tauS: DEFAULTS.tauS,
      frequencyHz: DEFAULTS.frequencyHz,
      saturationApm: DEFAULTS.saturationApm,
      coerciveApm: DEFAULTS.coerciveApm,
      branchWidthApm: DEFAULTS.branchWidthApm,
      fieldMaxApm: DEFAULTS.fieldMaxApm
    };
  }

  function normalizeConfig(input) {
    var source = input || {};
    var epsilonInf = parseNumber(source.epsilonInf === undefined ? DEFAULTS.epsilonInf : source.epsilonInf, "epsilon_inf");
    var epsilonStatic = parseNumber(source.epsilonStatic === undefined ? DEFAULTS.epsilonStatic : source.epsilonStatic, "epsilon_s");
    var tauS = parseNumber(source.tauS === undefined ? DEFAULTS.tauS : source.tauS, "tau");
    var frequencyHz = parseNumber(source.frequencyHz === undefined ? DEFAULTS.frequencyHz : source.frequencyHz, "frequency");
    var saturationApm = parseNumber(source.saturationApm === undefined ? DEFAULTS.saturationApm : source.saturationApm, "saturation magnetization");
    var coerciveApm = parseNumber(source.coerciveApm === undefined ? DEFAULTS.coerciveApm : source.coerciveApm, "coercive field");
    var branchWidthApm = parseNumber(source.branchWidthApm === undefined ? DEFAULTS.branchWidthApm : source.branchWidthApm, "branch width");
    var fieldMaxApm = parseNumber(source.fieldMaxApm === undefined ? DEFAULTS.fieldMaxApm : source.fieldMaxApm, "maximum field");
    if (epsilonInf <= 0 || epsilonInf > 100 || epsilonStatic <= epsilonInf || epsilonStatic > 1000) throw new RangeError("require 0 < epsilon_inf < epsilon_s <= 1000");
    if (tauS <= 0 || tauS > 1e6 || frequencyHz <= 0 || frequencyHz > 1e9) throw new RangeError("tau and frequency must be positive and finite in range");
    if (saturationApm <= 0 || saturationApm > 1e8) throw new RangeError("saturation magnetization must be in (0, 1e8] A/m");
    if (coerciveApm < 0 || coerciveApm > 1e7 || branchWidthApm <= 0 || branchWidthApm > 1e7) throw new RangeError("magnetic branch parameters are outside range");
    if (fieldMaxApm <= coerciveApm || fieldMaxApm > 1e8) throw new RangeError("fieldMax must exceed coercive field");
    return {
      epsilonInf: epsilonInf,
      epsilonStatic: epsilonStatic,
      tauS: tauS,
      frequencyHz: frequencyHz,
      saturationApm: saturationApm,
      coerciveApm: coerciveApm,
      branchWidthApm: branchWidthApm,
      fieldMaxApm: fieldMaxApm
    };
  }

  function debyeResponse(input) {
    var config = normalizeConfig(input);
    var omega = 2 * Math.PI * config.frequencyHz;
    var omegaTau = omega * config.tauS;
    var delta = config.epsilonStatic - config.epsilonInf;
    var denominator = 1 + omegaTau * omegaTau;
    var epsilonPrime = config.epsilonInf + delta / denominator;
    var epsilonLoss = delta * omegaTau / denominator;
    return {
      config: config,
      omegaRadPerS: omega,
      omegaTau: omegaTau,
      epsilonPrime: epsilonPrime,
      epsilonLoss: epsilonLoss,
      tanDelta: epsilonLoss / epsilonPrime,
      complexReal: epsilonPrime,
      complexImaginary: -epsilonLoss,
      phaseConvention: "exp(+i omega t): epsilon* = epsilon' - i epsilon''"
    };
  }

  function dielectricSweep(input, count) {
    var config = normalizeConfig(input);
    var samples = count === undefined ? 121 : Math.round(parseNumber(count, "sweep count"));
    if (samples < 3) throw new RangeError("sweep count must be at least 3");
    var points = [];
    for (var index = 0; index < samples; index += 1) {
      var logOmegaTau = -3 + 6 * index / (samples - 1);
      var omegaTau = Math.pow(10, logOmegaTau);
      var delta = config.epsilonStatic - config.epsilonInf;
      var denominator = 1 + omegaTau * omegaTau;
      var epsilonPrime = config.epsilonInf + delta / denominator;
      var epsilonLoss = delta * omegaTau / denominator;
      points.push({ omegaTau: omegaTau, frequencyHz: omegaTau / (2 * Math.PI * config.tauS), epsilonPrime: epsilonPrime, epsilonLoss: epsilonLoss, tanDelta: epsilonLoss / epsilonPrime });
    }
    return points;
  }

  function tanhBranch(fieldApm, branch, saturationApm, coerciveApm, branchWidthApm) {
    var field = parseNumber(fieldApm, "H");
    var saturation = parseNumber(saturationApm, "Ms");
    var coercive = parseNumber(coerciveApm, "Hc");
    var width = parseNumber(branchWidthApm, "branch width");
    if (saturation <= 0 || coercive < 0 || width <= 0) throw new RangeError("tanh branch parameters are outside range");
    if (branch !== "ascending" && branch !== "descending") throw new RangeError("branch must be ascending or descending");
    var center = branch === "ascending" ? coercive : -coercive;
    return saturation * Math.tanh((field - center) / width);
  }

  function loopAreaJm3(points) {
    if (!Array.isArray(points) || points.length < 2) throw new RangeError("at least two loop points are required");
    var integral = 0;
    for (var index = 0; index < points.length - 1; index += 1) {
      var left = points[index];
      var right = points[index + 1];
      integral += MU0_H_PER_M * 0.5 * (left.fieldApm + right.fieldApm) * (right.magnetizationApm - left.magnetizationApm);
    }
    var first = points[0];
    var last = points[points.length - 1];
    if (last.fieldApm !== first.fieldApm || last.magnetizationApm !== first.magnetizationApm) {
      integral += MU0_H_PER_M * 0.5 * (last.fieldApm + first.fieldApm) * (first.magnetizationApm - last.magnetizationApm);
    }
    return Math.abs(integral);
  }

  function branchDifferenceAreaJm3(ascending, descending) {
    if (!Array.isArray(ascending) || !Array.isArray(descending) || ascending.length !== descending.length || ascending.length < 2) {
      throw new RangeError("matching ascending and descending branches are required");
    }
    var integral = 0;
    for (var index = 0; index < ascending.length - 1; index += 1) {
      if (!near(ascending[index].fieldApm, descending[index].fieldApm, 1e-12) || !near(ascending[index + 1].fieldApm, descending[index + 1].fieldApm, 1e-12)) {
        throw new RangeError("ascending and descending branches must share the same increasing H grid");
      }
      var leftDifference = descending[index].magnetizationApm - ascending[index].magnetizationApm;
      var rightDifference = descending[index + 1].magnetizationApm - ascending[index + 1].magnetizationApm;
      var deltaField = ascending[index + 1].fieldApm - ascending[index].fieldApm;
      integral += MU0_H_PER_M * 0.5 * (leftDifference + rightDifference) * deltaField;
    }
    return Math.abs(integral);
  }

  function magneticLoop(input, count) {
    var config = normalizeConfig(input);
    var samples = count === undefined ? 161 : Math.round(parseNumber(count, "loop count"));
    if (samples < 3) throw new RangeError("loop count must be at least 3");
    var ascendingPoints = [];
    for (var index = 0; index < samples; index += 1) {
      var ascendingField = -config.fieldMaxApm + 2 * config.fieldMaxApm * index / (samples - 1);
      ascendingPoints.push({ fieldApm: ascendingField, magnetizationApm: tanhBranch(ascendingField, "ascending", config.saturationApm, config.coerciveApm, config.branchWidthApm), branch: "ascending" });
    }
    var descendingPoints = [];
    for (var descendingIndex = 0; descendingIndex < samples; descendingIndex += 1) {
      var descendingField = config.fieldMaxApm - 2 * config.fieldMaxApm * descendingIndex / (samples - 1);
      descendingPoints.push({ fieldApm: descendingField, magnetizationApm: tanhBranch(descendingField, "descending", config.saturationApm, config.coerciveApm, config.branchWidthApm), branch: "descending" });
    }
    var points = ascendingPoints.concat(descendingPoints);
    points.push({ fieldApm: ascendingPoints[0].fieldApm, magnetizationApm: ascendingPoints[0].magnetizationApm, branch: "closing" });
    var closedAreaJm3 = loopAreaJm3(points);
    var descendingIncreasingH = descendingPoints.slice().reverse();
    var branchAreaJm3 = branchDifferenceAreaJm3(ascendingPoints, descendingIncreasingH);
    return { config: config, points: points, ascending: ascendingPoints, descending: descendingPoints, areaJm3: branchAreaJm3, closedAreaJm3: closedAreaJm3, mu0: MU0_H_PER_M };
  }

  function magneticDielectricLedger(input) {
    var config = normalizeConfig(input);
    var dielectric = debyeResponse(config);
    return {
      config: config,
      dielectric: dielectric,
      sweep: dielectricSweep(config),
      magnetic: magneticLoop(config),
      dielectricPeakOmegaTau: 1
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
        key: "dielectricPeak",
        prompt: "单一 Debye 弛豫的线性介电损耗 epsilon'' 峰位在哪里？",
        expected: "one",
        choices: [{ value: "one", label: "omega tau = 1" }, { value: "zero", label: "omega tau = 0" }, { value: "infinity", label: "omega tau → ∞" }]
      },
      {
        key: "highFrequency",
        prompt: "频率远高于 Debye 峰后，epsilon'' 与 tan delta 的趋势是？",
        expected: "lower",
        choices: [{ value: "lower", label: "都下降，极限趋向低损耗" }, { value: "higher", label: "都继续升高" }, { value: "same", label: "都保持峰值" }]
      },
      {
        key: "magneticArea",
        prompt: "在 Ms、Hmax 和分支宽度固定且仍能闭合的条件下，增大 Hc 对磁回线面积的影响是？",
        expected: "larger",
        choices: [{ value: "larger", label: "回线更宽，面积增大" }, { value: "smaller", label: "面积减小" }, { value: "zero", label: "面积变为零" }]
      }
    ];
  }

  function renderPredictions(doc, hostNode, state) {
    clear(hostNode);
    questionSpecs().forEach(function (spec, index) {
      var buttons = spec.choices.map(function (choice) { return element(doc, "button", { type: "button", text: choice.label, "aria-pressed": state.predictions[spec.key] === choice.value ? "true" : "false" }); });
      buttons.forEach(function (button, choiceIndex) {
        button.addEventListener("click", function () {
          state.predictions[spec.key] = spec.choices[choiceIndex].value;
          renderPredictions(doc, hostNode, state);
        });
      });
      hostNode.appendChild(element(doc, "fieldset", {}, [element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }), element(doc, "div", { className: "ml-choice-grid" }, buttons)]));
    });
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 820 520", role: "img", "aria-label": "Debye 介电损耗谱和 tanh branch 磁滞回线" });
    svg.appendChild(svgElement(doc, "title", {}, "介电 Debye 损耗与磁性 tanh branch 教学回线"));
    svg.appendChild(svgElement(doc, "desc", {}, "左侧显示 epsilon prime、epsilon double-prime 和 tan delta 随 omega tau 的变化；右侧显示上升、下降两个 tanh 教学分支及数值积分回线面积。"));
    var top = { x: 56, y: 44, width: 350, height: 150 };
    var bottom = { x: 56, y: 254, width: 350, height: 150 };
    var magnetic = { x: 462, y: 44, width: 300, height: 360 };
    function mapLogX(logX, plot) { return plot.x + plot.width * (logX + 3) / 6; }
    function mapE(value) { return top.y + top.height - top.height * value / result.config.epsilonStatic; }
    var maxTan = Math.max(1, result.sweep.reduce(function (maximum, point) { return Math.max(maximum, point.tanDelta); }, 0) * 1.12);
    function mapTan(value) { return bottom.y + bottom.height - bottom.height * value / maxTan; }
    [top, bottom, magnetic].forEach(function (plot) { svg.appendChild(svgElement(doc, "rect", { x: plot.x, y: plot.y, width: plot.width, height: plot.height, fill: "none", stroke: "currentColor" })); });
    var primePath = [];
    var lossPath = [];
    var tanPath = [];
    result.sweep.forEach(function (point, index) {
      var command = index ? "L" : "M";
      var logX = Math.log10(point.omegaTau);
      primePath.push(command + mapLogX(logX, top).toFixed(2) + " " + mapE(point.epsilonPrime).toFixed(2));
      lossPath.push(command + mapLogX(logX, top).toFixed(2) + " " + mapE(point.epsilonLoss).toFixed(2));
      tanPath.push(command + mapLogX(logX, bottom).toFixed(2) + " " + mapTan(point.tanDelta).toFixed(2));
    });
    svg.appendChild(svgElement(doc, "path", { d: primePath.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 2.8 }));
    svg.appendChild(svgElement(doc, "path", { d: lossPath.join(" "), fill: "none", stroke: "#2563a6", "stroke-width": 2.8 }));
    svg.appendChild(svgElement(doc, "path", { d: tanPath.join(" "), fill: "none", stroke: "#39734d", "stroke-width": 2.8 }));
    var peakX = mapLogX(0, top);
    svg.appendChild(svgElement(doc, "line", { x1: peakX, y1: top.y, x2: peakX, y2: top.y + top.height, stroke: "#9b6a12", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "line", { x1: mapLogX(0, bottom), y1: bottom.y, x2: mapLogX(0, bottom), y2: bottom.y + bottom.height, stroke: "#9b6a12", "stroke-dasharray": "5 4" }));
    function mapH(field) { return magnetic.x + magnetic.width * (field + result.config.fieldMaxApm) / (2 * result.config.fieldMaxApm); }
    function mapM(magnetization) { return magnetic.y + magnetic.height - magnetic.height * (magnetization + result.config.saturationApm) / (2 * result.config.saturationApm); }
    var ascendingPath = [];
    var descendingPath = [];
    result.magnetic.points.forEach(function (point, index) {
      var command = index ? "L" : "M";
      if (point.branch === "ascending") ascendingPath.push(command + mapH(point.fieldApm).toFixed(2) + " " + mapM(point.magnetizationApm).toFixed(2));
      else if (point.branch === "descending") descendingPath.push((descendingPath.length ? "L" : "M") + mapH(point.fieldApm).toFixed(2) + " " + mapM(point.magnetizationApm).toFixed(2));
    });
    svg.appendChild(svgElement(doc, "path", { d: ascendingPath.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 2.8 }));
    svg.appendChild(svgElement(doc, "path", { d: descendingPath.join(" "), fill: "none", stroke: "#2563a6", "stroke-width": 2.8 }));
    svg.appendChild(svgElement(doc, "line", { x1: mapH(0), y1: magnetic.y, x2: mapH(0), y2: magnetic.y + magnetic.height, stroke: "currentColor", "stroke-opacity": 0.2 }));
    svg.appendChild(svgElement(doc, "line", { x1: magnetic.x, y1: mapM(0), x2: magnetic.x + magnetic.width, y2: mapM(0), stroke: "currentColor", "stroke-opacity": 0.2 }));
    svg.appendChild(svgElement(doc, "text", { x: top.x + 4, y: 25, "font-size": 14, "font-weight": 700 }, "介电：Debye 线性响应"));
    svg.appendChild(svgElement(doc, "text", { x: top.x + 8, y: top.y + 17, "font-size": 11 }, "红 epsilon'；蓝 epsilon''；金虚线 omega tau=1"));
    svg.appendChild(svgElement(doc, "text", { x: bottom.x + 8, y: bottom.y + 17, "font-size": 11 }, "绿 tan delta；峰与 epsilon'' 同在 omega tau=1"));
    svg.appendChild(svgElement(doc, "text", { x: top.x + top.width, y: top.y + top.height + 28, "font-size": 11, "text-anchor": "end" }, "log10(omega tau)"));
    svg.appendChild(svgElement(doc, "text", { x: bottom.x + bottom.width, y: bottom.y + bottom.height + 28, "font-size": 11, "text-anchor": "end" }, "log10(omega tau)"));
    svg.appendChild(svgElement(doc, "text", { x: magnetic.x + 4, y: 25, "font-size": 14, "font-weight": 700 }, "磁性：tanh branch 教学代理"));
    svg.appendChild(svgElement(doc, "text", { x: magnetic.x + 8, y: magnetic.y + 17, "font-size": 11 }, "红上升；蓝下降；非 Jiles-Atherton 拟合"));
    svg.appendChild(svgElement(doc, "text", { x: magnetic.x + magnetic.width, y: magnetic.y + magnetic.height + 28, "font-size": 11, "text-anchor": "end" }, "H / A·m^-1"));
    svg.appendChild(svgElement(doc, "text", { x: magnetic.x - 8, y: magnetic.y + 14, "font-size": 11, transform: "rotate(-90 " + (magnetic.x - 8) + " " + (magnetic.y + 14) + ")" }, "M / A·m^-1"));
    svg.appendChild(svgElement(doc, "text", { x: magnetic.x + magnetic.width, y: magnetic.y + magnetic.height + 48, "font-size": 11, "text-anchor": "end" }, "mu0 integral H dM = " + format(result.magnetic.areaJm3, 3) + " J·m^-3/cycle"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var d = result.dielectric;
    var rows = [
      ["epsilon_inf / epsilon_s", format(result.config.epsilonInf, 3) + " / " + format(result.config.epsilonStatic, 3), "无量纲"],
      ["tau", format(result.config.tauS, 5), "s"],
      ["frequency f", format(result.config.frequencyHz, 5), "Hz；omega = 2 pi f"],
      ["omega tau", format(d.omegaTau, 5), "无量纲；峰位为 1"],
      ["epsilon'", format(d.epsilonPrime, 5), "实部；储能响应"],
      ["epsilon''", format(d.epsilonLoss, 5), "正损耗定义；epsilon* = epsilon' - i epsilon''"],
      ["tan delta", format(d.tanDelta, 5), "epsilon'' / epsilon'；线性介电损耗"],
      ["Ms / Hc", format(result.config.saturationApm, 2) + " / " + format(result.config.coerciveApm, 2), "A/m；磁性教学代理"],
      ["tanh branch width", format(result.config.branchWidthApm, 2), "A/m；数值平滑参数"],
      ["磁滞回线面积", format(result.magnetic.areaJm3, 5), "mu0 integral H dM；J/m^3 per cycle"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "介电损耗与磁滞损耗双面账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 读法" })])]), body]));
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "ml-shell" });
    shell.appendChild(element(doc, "h3", { text: "互动实验：介电 Debye 损耗与磁性 tanh 回线" }));
    shell.appendChild(element(doc, "p", { className: "ml-note", text: "先预测介电峰和磁滞面积。揭示后可调频率、弛豫时间、Hc 与 Ms；磁性曲线是现象学 tanh 分支代理，不是动态材料拟合。" }));
    var predictionHost = element(doc, "div", { className: "ml-predictions" });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "ml-actions" });
    var reveal = element(doc, "button", { type: "button", className: "ml-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "ml-feedback", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "ml-controls" });
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
      controls.appendChild(element(doc, "div", { className: "ml-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }

    addRange("epsilonInf", "epsilon_inf", "1", "8", "0.1", 1);
    addRange("epsilonStatic", "epsilon_s", "5", "30", "0.1", 1);
    addRange("saturationApm", "Ms / A·m^-1", "20000", "200000", "5000", 0);
    addRange("coerciveApm", "Hc / A·m^-1", "0", "8000", "100", 0);
    addRange("branchWidthApm", "tanh width / A·m^-1", "100", "3000", "100", 0);
    addRange("fieldMaxApm", "Hmax / A·m^-1", "3000", "30000", "500", 0);
    var tauOutput = element(doc, "output", { text: format(state.config.tauS, 4) });
    var tauInput = element(doc, "input", { type: "range", min: "-6", max: "1", step: "0.1", value: Math.log10(state.config.tauS), "aria-label": "tau / s" });
    tauInput.addEventListener("input", function () { state.config.tauS = Math.pow(10, parseNumber(tauInput.value, "log10 tau")); state.feedback = state.revealed ? "参数已更新；预测结果保持揭示。" : ""; render(); });
    controls.appendChild(element(doc, "div", { className: "ml-control" }, [element(doc, "label", {}, ["tau / s", " = ", tauOutput]), tauInput]));
    var frequencyOutput = element(doc, "output", { text: format(state.config.frequencyHz, 3) });
    var frequencyInput = element(doc, "input", { type: "range", min: "-1", max: "6", step: "0.05", value: Math.log10(state.config.frequencyHz), "aria-label": "frequency / Hz" });
    frequencyInput.addEventListener("input", function () { state.config.frequencyHz = Math.pow(10, parseNumber(frequencyInput.value, "log10 frequency")); state.feedback = state.revealed ? "参数已更新；预测结果保持揭示。" : ""; render(); });
    controls.appendChild(element(doc, "div", { className: "ml-control" }, [element(doc, "label", {}, ["f / Hz", " = ", frequencyOutput]), frequencyInput]));
    resultPanel.appendChild(controls);
    var chart = element(doc, "div", { className: "ml-chart" });
    var tableWrap = element(doc, "div", { className: "ml-table-wrap" });
    var note = element(doc, "p", { className: "ml-note" });
    resultPanel.appendChild(element(doc, "div", { className: "ml-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);
    renderPredictions(doc, predictionHost, state);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测；揭示前不显示介电谱、磁滞回线和损耗账本。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。现在可以分别调节两种响应。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      renderPredictions(doc, predictionHost, state);
      render();
      announce(api, rootNode, "磁介电预测、谱线和回线账本已重置。");
    });

    function render() {
      var result = null;
      var error = null;
      try { result = magneticDielectricLedger(state.config); } catch (caught) { error = caught; }
      Object.keys(inputs).forEach(function (key) { inputs[key].input.value = String(state.config[key]); inputs[key].output.textContent = format(state.config[key], inputs[key].digits); });
      tauInput.value = String(Math.log10(state.config.tauS));
      tauOutput.textContent = format(state.config.tauS, 4);
      frequencyInput.value = String(Math.log10(state.config.frequencyHz));
      frequencyOutput.textContent = format(state.config.frequencyHz, 3);
      feedback.textContent = error ? "输入超出双面响应模型范围：" + error.message : state.feedback;
      feedback.className = "ml-feedback" + (error || (state.feedback.indexOf("请先") === 0) ? " ml-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed || !result) {
        chart.replaceChildren();
        tableWrap.replaceChildren();
        note.textContent = error ? "请满足 epsilon_s > epsilon_inf 且 Hmax > Hc。" : "揭示后显示 epsilon'、epsilon''、tan delta、omega tau 峰和磁滞积分。";
        return;
      }
      chart.replaceChildren(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "边界提示：介电侧是单一 Debye、线性小信号的相量模型；磁性侧只是明确标注的现象学 tanh branch 教学代理，绝不等同 Jiles-Atherton 或真实材料拟合。频率、温度、多弛豫、畴结构和涡流会改变真实损耗。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(300, 0) === "300", "integer formatting preserves trailing zeros");
    check(near(parseNumber("0.001", "x"), 0.001), "numeric text is parsed");
    check(copyDefaults().tauS === 0.001 && copyDefaults().epsilonStatic === 12, "default values are stable");
    var base = magneticDielectricLedger(DEFAULTS);
    check(near(base.dielectric.omegaTau, 1, 1e-10), "default frequency is at the Debye peak");
    check(near(base.dielectric.epsilonLoss, (DEFAULTS.epsilonStatic - DEFAULTS.epsilonInf) / 2), "epsilon double-prime at x=1 is delta epsilon / 2");
    check(base.dielectric.complexImaginary < 0 && base.dielectric.epsilonLoss > 0, "phase convention keeps positive loss separate from negative imaginary part");
    check(debyeResponse({ frequencyHz: 10 * DEFAULTS.frequencyHz }).epsilonLoss < base.dielectric.epsilonLoss, "high-frequency Debye loss falls after the peak");
    check(base.magnetic.areaJm3 > 0 && near(base.magnetic.areaJm3, base.magnetic.closedAreaJm3, 1e-10), "closed tanh branch loop has positive area");
    var wider = magneticLoop({ coerciveApm: 4000, fieldMaxApm: 10000 });
    check(wider.areaJm3 > base.magnetic.areaJm3, "larger coercive field widens the loop area");
    var noHysteresis = magneticLoop({ coerciveApm: 0, fieldMaxApm: 10000 });
    check(noHysteresis.areaJm3 < base.magnetic.areaJm3, "zero coercive shift reduces loop area");
    var unsaturated = magneticLoop({ coerciveApm: 1000, branchWidthApm: 5000, fieldMaxApm: 3000 });
    check(unsaturated.points[0].fieldApm === unsaturated.points[unsaturated.points.length - 1].fieldApm && near(unsaturated.points[0].magnetizationApm, unsaturated.points[unsaturated.points.length - 1].magnetizationApm), "extreme branch is explicitly closed");
    check(near(unsaturated.areaJm3, unsaturated.closedAreaJm3, 1e-10) && unsaturated.areaJm3 > 0, "closed-path and branch-difference areas agree without saturation");
    var asymptotic = magneticLoop({ saturationApm: 100000, coerciveApm: 200, branchWidthApm: 20, fieldMaxApm: 20000 }, 2001);
    var asymptoticLimit = 4 * MU0_H_PER_M * 100000 * 200;
    check(Math.abs(asymptotic.areaJm3 - asymptoticLimit) / asymptoticLimit < 0.002, "well-saturated loop approaches 4 mu0 Ms Hc");
    var mismatchedDescending = base.magnetic.descending.slice().reverse().map(function (point) {
      return { fieldApm: point.fieldApm, magnetizationApm: point.magnetizationApm };
    });
    mismatchedDescending[0].fieldApm += 1;
    var mismatchRejected = false;
    try { branchDifferenceAreaJm3(base.magnetic.ascending, mismatchedDescending); } catch (error) { mismatchRejected = true; }
    check(mismatchRejected, "oppositely ordered or mismatched H grids are rejected");
    check(base.sweep.length === 121 && JSON.stringify(base.sweep) === JSON.stringify(magneticDielectricLedger(DEFAULTS).sweep), "dielectric sweep is deterministic");
    check(near(tanhBranch(0, "ascending", 1, 0, 1), 0), "zero-coercivity branch crosses origin");
    var threw = false;
    try { parseNumber("", "blank"); } catch (error) { threw = true; }
    check(threw, "blank input is rejected");
    threw = false;
    try { normalizeConfig({ epsilonStatic: 2 }); } catch (error2) { threw = true; }
    check(threw, "epsilon_s <= epsilon_inf is rejected");
    threw = false;
    try { normalizeConfig({ fieldMaxApm: 1000, coerciveApm: 1000 }); } catch (error3) { threw = true; }
    check(threw, "fieldMax <= Hc is rejected");
    threw = false;
    try { tanhBranch(0, "wrong", 1, 0, 1); } catch (error4) { threw = true; }
    check(threw, "unknown tanh branch is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    parseNumber: parseNumber,
    normalizeConfig: normalizeConfig,
    debyeResponse: debyeResponse,
    dielectricSweep: dielectricSweep,
    tanhBranch: tanhBranch,
    loopAreaJm3: loopAreaJm3,
    branchDifferenceAreaJm3: branchDifferenceAreaJm3,
    magneticLoop: magneticLoop,
    magneticDielectricLedger: magneticDielectricLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
