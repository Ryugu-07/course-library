(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-polymer-viscoelasticity", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-polymer-viscoelasticity self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-polymer-viscoelasticity self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-polymer-viscoelasticity-styles";
  var DEFAULTS = {
    eInfGPa: 0.02,
    e1GPa: 2.98,
    tauRefS: 1000,
    temperatureC: 30,
    referenceTemperatureC: 20,
    c1: 17.44,
    c2K: 51.6,
    observationWindowS: 100
  };
  var STYLE_TEXT = [
    '[data-learning-lab="materials-polymer-viscoelasticity"]{--mp-blue:#2563a6;--mp-red:#b64335;--mp-green:#39734d;--mp-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="materials-polymer-viscoelasticity"] *{box-sizing:border-box}[data-learning-lab="materials-polymer-viscoelasticity"] [hidden]{display:none!important}',
    '[data-learning-lab="materials-polymer-viscoelasticity"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-polymer-viscoelasticity"] p{margin:8px 0}',
    '[data-learning-lab="materials-polymer-viscoelasticity"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-polymer-viscoelasticity"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="materials-polymer-viscoelasticity"] .mp-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-polymer-viscoelasticity"] button,[data-learning-lab="materials-polymer-viscoelasticity"] input{font:inherit}',
    '[data-learning-lab="materials-polymer-viscoelasticity"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-polymer-viscoelasticity"] button:hover{border-color:var(--mp-blue)}[data-learning-lab="materials-polymer-viscoelasticity"] button[aria-pressed="true"],[data-learning-lab="materials-polymer-viscoelasticity"] .mp-primary{border-color:var(--mp-blue);background:var(--mp-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="materials-polymer-viscoelasticity"] button:focus-visible,[data-learning-lab="materials-polymer-viscoelasticity"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-actions>*{flex:1 1 170px}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-good{color:var(--mp-green)}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-warn{color:var(--mp-red)}',
    '[data-learning-lab="materials-polymer-viscoelasticity"] .mp-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:end;margin-top:12px}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-control label{font-size:13px;font-weight:700}[data-learning-lab="materials-polymer-viscoelasticity"] output{color:var(--mp-blue);font-variant-numeric:tabular-nums}[data-learning-lab="materials-polymer-viscoelasticity"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mp-blue)}',
    '[data-learning-lab="materials-polymer-viscoelasticity"] .mp-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-polymer-viscoelasticity"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="materials-polymer-viscoelasticity"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="materials-polymer-viscoelasticity"] .mp-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="materials-polymer-viscoelasticity"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-polymer-viscoelasticity"] th,[data-learning-lab="materials-polymer-viscoelasticity"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-polymer-viscoelasticity"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mp-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:900px){[data-learning-lab="materials-polymer-viscoelasticity"] .mp-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-grid{grid-template-columns:1fr}}@media(max-width:560px){[data-learning-lab="materials-polymer-viscoelasticity"] .mp-controls{grid-template-columns:1fr}[data-learning-lab="materials-polymer-viscoelasticity"] .mp-choice-grid{grid-template-columns:1fr}}@media(max-width:430px){[data-learning-lab="materials-polymer-viscoelasticity"] .mp-chart{padding:4px}[data-learning-lab="materials-polymer-viscoelasticity"] table{font-size:11px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-polymer-viscoelasticity"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 5));
    }
    if (places === 0) return value.toFixed(0);
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function copyDefaults() {
    return {
      eInfGPa: DEFAULTS.eInfGPa,
      e1GPa: DEFAULTS.e1GPa,
      tauRefS: DEFAULTS.tauRefS,
      temperatureC: DEFAULTS.temperatureC,
      referenceTemperatureC: DEFAULTS.referenceTemperatureC,
      c1: DEFAULTS.c1,
      c2K: DEFAULTS.c2K,
      observationWindowS: DEFAULTS.observationWindowS
    };
  }

  function normalizeConfig(input) {
    var source = input || {};
    var eInfGPa = parseNumber(source.eInfGPa === undefined ? DEFAULTS.eInfGPa : source.eInfGPa, "E_inf");
    var e1GPa = parseNumber(source.e1GPa === undefined ? DEFAULTS.e1GPa : source.e1GPa, "E_1");
    var tauRefS = parseNumber(source.tauRefS === undefined ? DEFAULTS.tauRefS : source.tauRefS, "tau_ref");
    var temperatureC = parseNumber(source.temperatureC === undefined ? DEFAULTS.temperatureC : source.temperatureC, "temperature");
    var referenceTemperatureC = parseNumber(source.referenceTemperatureC === undefined ? DEFAULTS.referenceTemperatureC : source.referenceTemperatureC, "reference temperature");
    var c1 = parseNumber(source.c1 === undefined ? DEFAULTS.c1 : source.c1, "C1");
    var c2K = parseNumber(source.c2K === undefined ? DEFAULTS.c2K : source.c2K, "C2");
    var observationWindowS = parseNumber(source.observationWindowS === undefined ? DEFAULTS.observationWindowS : source.observationWindowS, "observation window");
    var deltaT = temperatureC - referenceTemperatureC;
    var denominator = c2K + deltaT;
    var log10Shift = -c1 * deltaT / denominator;
    if (eInfGPa <= 0 || eInfGPa > 1000) throw new RangeError("E_inf must be in (0, 1000] GPa");
    if (e1GPa <= 0 || e1GPa > 1000) throw new RangeError("E_1 must be in (0, 1000] GPa");
    if (tauRefS <= 0 || tauRefS > 1e9) throw new RangeError("tau_ref must be in (0, 1e9] s");
    if (temperatureC < -40 || temperatureC > 140 || referenceTemperatureC < -40 || referenceTemperatureC > 140) {
      throw new RangeError("temperatures must be in [-40, 140] C");
    }
    if (c1 <= 0 || c1 > 40 || c2K <= 0 || c2K > 200 || denominator <= 0) {
      throw new RangeError("WLF C1, C2 and denominator are outside the teaching range");
    }
    if (Math.abs(log10Shift) > 12) throw new RangeError("WLF shift must stay within 12 decades");
    if (observationWindowS <= 0 || observationWindowS > 1e9) throw new RangeError("observation window must be in (0, 1e9] s");
    return {
      eInfGPa: eInfGPa,
      e1GPa: e1GPa,
      tauRefS: tauRefS,
      temperatureC: temperatureC,
      referenceTemperatureC: referenceTemperatureC,
      c1: c1,
      c2K: c2K,
      observationWindowS: observationWindowS
    };
  }

  function wlfShift(input) {
    var config = normalizeConfig(input);
    var deltaT = config.temperatureC - config.referenceTemperatureC;
    var log10Shift = -config.c1 * deltaT / (config.c2K + deltaT);
    return { log10Shift: log10Shift, shiftFactor: Math.pow(10, log10Shift) };
  }

  function modulusAt(timeS, tauS, eInfGPa, e1GPa) {
    var time = parseNumber(timeS, "time");
    var tau = parseNumber(tauS, "relaxation time");
    var eInf = parseNumber(eInfGPa, "E_inf");
    var e1 = parseNumber(e1GPa, "E_1");
    if (time < 0 || tau <= 0 || eInf < 0 || e1 < 0) throw new RangeError("time and modulus inputs are outside the model domain");
    return eInf + e1 * Math.exp(-time / tau);
  }

  function polymerLedger(input) {
    var config = normalizeConfig(input);
    var shift = wlfShift(config);
    var tauS = config.tauRefS * shift.shiftFactor;
    var de = tauS / config.observationWindowS;
    var modulusAtObservationGPa = modulusAt(config.observationWindowS, tauS, config.eInfGPa, config.e1GPa);
    var modulusAtTauGPa = modulusAt(tauS, tauS, config.eInfGPa, config.e1GPa);
    var curve = [];
    for (var index = 0; index <= 120; index += 1) {
      var logTime = -3 + 10 * index / 120;
      var timeS = Math.pow(10, logTime);
      curve.push({
        timeS: timeS,
        selectedGPa: modulusAt(timeS, tauS, config.eInfGPa, config.e1GPa),
        referenceGPa: modulusAt(timeS, config.tauRefS, config.eInfGPa, config.e1GPa)
      });
    }
    return {
      config: config,
      log10Shift: shift.log10Shift,
      shiftFactor: shift.shiftFactor,
      tauS: tauS,
      de: de,
      observationWindowS: config.observationWindowS,
      reducedObservationTimeS: config.observationWindowS / shift.shiftFactor,
      modulusAtObservationGPa: modulusAtObservationGPa,
      modulusAtTauGPa: modulusAtTauGPa,
      relaxationFraction: Math.exp(-1 / de),
      initialModulusGPa: config.eInfGPa + config.e1GPa,
      curve: curve
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
        key: "temperature",
        prompt: "在 WLF 经验温区内，把温度升高到高于 Tref，tau(T) 的方向是？",
        expected: "faster",
        choices: [{ value: "faster", label: "变小，松弛更快" }, { value: "slower", label: "变大，松弛更慢" }, { value: "same", label: "不变" }]
      },
      {
        key: "deborah",
        prompt: "若 De = tau / t_obs 远小于 1，观察窗结束时材料更接近哪种状态？",
        expected: "relaxed",
        choices: [{ value: "relaxed", label: "已松弛到低模量" }, { value: "unrelaxed", label: "保持高模量未松弛" }, { value: "zero", label: "模量变为零" }]
      },
      {
        key: "oneTau",
        prompt: "标准线性固体在 t = tau(T) 时，指数项 exp(-t/tau) 等于？",
        expected: "inverseE",
        choices: [{ value: "inverseE", label: "1/e" }, { value: "one", label: "1" }, { value: "zero", label: "0" }]
      }
    ];
  }

  function renderPredictions(doc, hostNode, state) {
    clear(hostNode);
    questionSpecs().forEach(function (spec, index) {
      var buttons = spec.choices.map(function (choice) {
        return element(doc, "button", {
          type: "button",
          text: choice.label,
          "aria-pressed": state.predictions[spec.key] === choice.value ? "true" : "false"
        });
      });
      buttons.forEach(function (button, choiceIndex) {
        button.addEventListener("click", function () {
          state.predictions[spec.key] = spec.choices[choiceIndex].value;
          renderPredictions(doc, hostNode, state);
        });
      });
      hostNode.appendChild(element(doc, "fieldset", {}, [
        element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }),
        element(doc, "div", { className: "mp-choice-grid" }, buttons)
      ]));
    });
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 820 410", role: "img", "aria-label": "标准线性固体在不同温度下的应力松弛模量曲线" });
    svg.appendChild(svgElement(doc, "title", {}, "时间温度位移与标准线性固体模量曲线"));
    svg.appendChild(svgElement(doc, "desc", {}, "横轴是实际时间的对数，红线为当前温度的松弛，蓝色虚线为参考温度主曲线；竖线标出观察窗。"));
    var plot = { x: 66, y: 48, width: 700, height: 275 };
    var minLogTime = -3;
    var maxLogTime = 7;
    var maxModulus = Math.max(result.initialModulusGPa * 1.08, 0.1);
    function mapX(timeS) { return plot.x + plot.width * (Math.log10(timeS) - minLogTime) / (maxLogTime - minLogTime); }
    function mapY(modulus) { return plot.y + plot.height - plot.height * modulus / maxModulus; }
    svg.appendChild(svgElement(doc, "rect", { x: plot.x, y: plot.y, width: plot.width, height: plot.height, fill: "none", stroke: "currentColor" }));
    for (var gridIndex = 0; gridIndex <= 5; gridIndex += 1) {
      var gridY = plot.y + plot.height * gridIndex / 5;
      svg.appendChild(svgElement(doc, "line", { x1: plot.x, y1: gridY, x2: plot.x + plot.width, y2: gridY, stroke: "currentColor", "stroke-opacity": 0.15 }));
    }
    var selectedPath = [];
    var referencePath = [];
    result.curve.forEach(function (point, index) {
      var command = index ? "L" : "M";
      selectedPath.push(command + mapX(point.timeS).toFixed(2) + " " + mapY(point.selectedGPa).toFixed(2));
      referencePath.push(command + mapX(point.timeS).toFixed(2) + " " + mapY(point.referenceGPa).toFixed(2));
    });
    svg.appendChild(svgElement(doc, "path", { d: referencePath.join(" "), fill: "none", stroke: "#2563a6", "stroke-width": 3, "stroke-dasharray": "7 4" }));
    svg.appendChild(svgElement(doc, "path", { d: selectedPath.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 3 }));
    function marker(timeS, color, dash) {
      if (timeS < Math.pow(10, minLogTime) || timeS > Math.pow(10, maxLogTime)) return;
      svg.appendChild(svgElement(doc, "line", { x1: mapX(timeS), y1: plot.y, x2: mapX(timeS), y2: plot.y + plot.height, stroke: color, "stroke-width": 2, "stroke-dasharray": dash || "4 4" }));
    }
    marker(result.observationWindowS, "#39734d", "4 3");
    marker(result.tauS, "#b64335", "2 3");
    marker(result.config.tauRefS, "#2563a6", "2 3");
    svg.appendChild(svgElement(doc, "circle", { cx: mapX(result.observationWindowS), cy: mapY(result.modulusAtObservationGPa), r: 5, fill: "#39734d", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + 4, y: 27, "font-size": 14, "font-weight": 700 }, "标准线性固体：E(t) / GPa"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + 8, y: plot.y + 18, "font-size": 11 }, "红 当前 T，蓝虚线 Tref；绿 t_obs，红/蓝短虚线 tau"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + plot.width, y: plot.y + plot.height + 30, "font-size": 12, "text-anchor": "end" }, "实际时间 t / s（log10）"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x - 10, y: plot.y + 12, "font-size": 12, transform: "rotate(-90 " + (plot.x - 10) + " " + (plot.y + 12) + ")" }, "模量 / GPa"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + plot.width, y: plot.y + plot.height + 52, "font-size": 11, "text-anchor": "end" }, "t_red = t / a_T；观察窗折算为 " + format(result.reducedObservationTimeS, 3) + " s"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var rows = [
      ["E_inf", format(result.config.eInfGPa, 3), "GPa；长时间松弛平台"],
      ["E_1", format(result.config.e1GPa, 3), "GPa；松弛幅度"],
      ["初始模量 E(0)", format(result.initialModulusGPa, 3), "GPa"],
      ["log10(a_T)", format(result.log10Shift, 4), "WLF 无量纲；a_T = tau(T)/tau_ref"],
      ["a_T", format(result.shiftFactor, 5), "无量纲；T > Tref 时通常小于 1"],
      ["tau(T)", format(result.tauS, 4), "s；当前温度松弛时间"],
      ["观察窗 t_obs", format(result.observationWindowS, 4), "s"],
      ["Deborah 数 De", format(result.de, 5), "tau(T) / t_obs；De << 1 表示已松弛"],
      ["E(t_obs)", format(result.modulusAtObservationGPa, 4), "GPa"],
      ["E(tau)", format(result.modulusAtTauGPa, 4), "GPa；E_inf + E_1/e"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })]));
    });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "标准线性固体的时间温度账本" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 读法" })])]),
      body
    ]));
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "mp-shell" });
    shell.appendChild(element(doc, "h3", { text: "互动实验：标准线性固体的应力松弛与时温位移" }));
    shell.appendChild(element(doc, "p", { className: "mp-note", text: "先做三项预测。揭示后可调参；所有曲线是同一组小应变、热流变简单材料教学模型的确定性计算。" }));
    var predictionHost = element(doc, "div", { className: "mp-predictions" });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "mp-actions" });
    var reveal = element(doc, "button", { type: "button", className: "mp-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "mp-feedback", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "mp-controls" });
    var inputs = {};

    function addRange(key, label, min, max, step, digits, special) {
      var output = element(doc, "output", { text: special ? special(state.config[key]) : format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = parseNumber(input.value, label);
        state.feedback = state.revealed ? "参数已更新；预测结果保持揭示。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits, special: special };
      controls.appendChild(element(doc, "div", { className: "mp-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }

    addRange("eInfGPa", "E_inf / GPa", "0.005", "0.2", "0.005", 3);
    addRange("e1GPa", "E_1 / GPa", "0.5", "5", "0.05", 2);
    addRange("temperatureC", "T / °C", "0", "100", "1", 0);
    var observationOutput = element(doc, "output", { text: format(state.config.observationWindowS, 2) });
    var observationInput = element(doc, "input", { type: "range", min: "-2", max: "6", step: "0.1", value: Math.log10(state.config.observationWindowS), "aria-label": "t_obs / s" });
    observationInput.addEventListener("input", function () {
      state.config.observationWindowS = Math.pow(10, parseNumber(observationInput.value, "log10 observation window"));
      state.feedback = state.revealed ? "参数已更新；预测结果保持揭示。" : "";
      render();
    });
    controls.appendChild(element(doc, "div", { className: "mp-control" }, [element(doc, "label", {}, ["t_obs / s", " = ", observationOutput]), observationInput]));
    var tauControl = element(doc, "div", { className: "mp-control" });
    var tauOutput = element(doc, "output", { text: format(state.config.tauRefS, 2) });
    var tauInput = element(doc, "input", { type: "range", min: "-1", max: "6", step: "0.1", value: Math.log10(state.config.tauRefS), "aria-label": "tau_ref / s" });
    tauInput.addEventListener("input", function () {
      state.config.tauRefS = Math.pow(10, parseNumber(tauInput.value, "log10 tau_ref"));
      state.feedback = state.revealed ? "参数已更新；预测结果保持揭示。" : "";
      render();
    });
    tauControl.appendChild(element(doc, "label", {}, ["tau_ref / s", " = ", tauOutput]));
    tauControl.appendChild(tauInput);
    controls.appendChild(tauControl);
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
        state.feedback = "请先完成三项预测；揭示前不显示时温位移曲线和模量账本。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。现在可以调节观察窗与材料参数。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      renderPredictions(doc, predictionHost, state);
      render();
      announce(api, rootNode, "高分子预测、曲线和账本已重置。");
    });

    function render() {
      var result = null;
      var error = null;
      try { result = polymerLedger(state.config); } catch (caught) { error = caught; }
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = inputs[key].special ? inputs[key].special(state.config[key]) : format(state.config[key], inputs[key].digits);
      });
      observationInput.value = String(Math.log10(state.config.observationWindowS));
      observationOutput.textContent = format(state.config.observationWindowS, 2);
      tauInput.value = String(Math.log10(state.config.tauRefS));
      tauOutput.textContent = format(state.config.tauRefS, 2);
      feedback.textContent = error ? "输入超出模型范围：" + error.message : state.feedback;
      feedback.className = "mp-feedback" + (error || (state.feedback.indexOf("请先") === 0) ? " mp-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed || !result) {
        chart.replaceChildren();
        tableWrap.replaceChildren();
        note.textContent = error ? "请把温度、WLF 分母和时间参数调回教学范围。" : "揭示后显示当前温度、参考温度和观察窗的时间温度账本。";
        return;
      }
      chart.replaceChildren(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "边界提示：WLF 只在经验温区内用于热流变简单材料；这里假定线性小应变和单一松弛时间，不能替代多模量主曲线、非线性黏弹性或化学老化模型。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(300, 0) === "300", "integer formatting preserves trailing zeros");
    check(near(parseNumber("2.5", "x"), 2.5), "numeric text is parsed");
    check(copyDefaults().temperatureC === 30 && copyDefaults().tauRefS === 1000, "default values are stable");
    var base = polymerLedger(DEFAULTS);
    check(near(wlfShift({ temperatureC: 20 }).shiftFactor, 1), "WLF factor is one at reference temperature");
    check(base.tauS < base.config.tauRefS, "higher default temperature shortens relaxation time");
    check(base.de < 1 && base.modulusAtObservationGPa < base.initialModulusGPa, "default observation window is longer than tau");
    check(near(modulusAt(base.tauS, base.tauS, base.config.eInfGPa, base.config.e1GPa), base.config.eInfGPa + base.config.e1GPa / Math.E), "one-tau modulus is E_inf + E_1/e");
    var hotter = polymerLedger({ temperatureC: 40, referenceTemperatureC: 20, tauRefS: 1000 });
    var colder = polymerLedger({ temperatureC: 10, referenceTemperatureC: 20, tauRefS: 1000 });
    check(hotter.tauS < base.tauS && colder.tauS > base.tauS, "WLF shift is monotone around Tref");
    check(JSON.stringify(base.curve) === JSON.stringify(polymerLedger(DEFAULTS).curve), "curve generation is deterministic");
    check(normalizeConfig({ temperatureC: -40, referenceTemperatureC: -40 }).temperatureC === -40, "temperature lower boundary is accepted");
    check(normalizeConfig({ temperatureC: 140, referenceTemperatureC: 140 }).temperatureC === 140, "temperature upper boundary is accepted");
    check(normalizeConfig({ temperatureC: 0, referenceTemperatureC: 20 }).temperatureC === 0, "interactive temperature lower bound stays inside the WLF domain");
    var threw = false;
    try { parseNumber("", "blank"); } catch (error) { threw = true; }
    check(threw, "blank input is rejected");
    threw = false;
    try { normalizeConfig({ eInfGPa: 0 }); } catch (error2) { threw = true; }
    check(threw, "non-positive modulus is rejected");
    threw = false;
    try { normalizeConfig({ c2K: 10, temperatureC: -30, referenceTemperatureC: 20 }); } catch (error3) { threw = true; }
    check(threw, "non-positive WLF denominator is rejected");
    threw = false;
    try { normalizeConfig({ temperatureC: -20, referenceTemperatureC: 20 }); } catch (error4) { threw = true; }
    check(threw, "WLF shift beyond 12 decades is rejected");
    threw = false;
    try { modulusAt(-1, 1, 1, 1); } catch (error5) { threw = true; }
    check(threw, "negative time is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    parseNumber: parseNumber,
    normalizeConfig: normalizeConfig,
    wlfShift: wlfShift,
    modulusAt: modulusAt,
    polymerLedger: polymerLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
