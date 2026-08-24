(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-pn-junction", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-pn-junction self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-pn-junction self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-pn-junction-styles";
  var Q_C = 1.602176634e-19;
  var K_B_J_PER_K = 1.380649e-23;
  var EPSILON_0_F_PER_CM = 8.8541878128e-14;
  var BAND_GAP_EV = 1.12;
  var DEFAULTS = {
    temperatureK: 300,
    naLog10Cm3: 16,
    ndLog10Cm3: 17,
    ni300Log10Cm3: 10,
    relativePermittivity: 11.7,
    appliedBiasV: 0.2
  };
  var STYLE_TEXT = [
    '[data-learning-lab="materials-pn-junction"]{--pj-blue:#2563a6;--pj-red:#b64335;--pj-green:#39734d;--pj-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="materials-pn-junction"] *{box-sizing:border-box}[data-learning-lab="materials-pn-junction"] [hidden]{display:none!important}',
    '[data-learning-lab="materials-pn-junction"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-pn-junction"] p{margin:8px 0}',
    '[data-learning-lab="materials-pn-junction"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-pn-junction"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="materials-pn-junction"] .pj-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-pn-junction"] button,[data-learning-lab="materials-pn-junction"] input{font:inherit}',
    '[data-learning-lab="materials-pn-junction"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-pn-junction"] button:hover{border-color:var(--pj-blue)}[data-learning-lab="materials-pn-junction"] button[aria-pressed="true"],[data-learning-lab="materials-pn-junction"] .pj-primary{border-color:var(--pj-blue);background:var(--pj-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="materials-pn-junction"] button:focus-visible,[data-learning-lab="materials-pn-junction"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-pn-junction"] .pj-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-pn-junction"] .pj-actions>*{flex:1 1 170px}[data-learning-lab="materials-pn-junction"] .pj-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-pn-junction"] .pj-warn{color:var(--pj-red)}',
    '[data-learning-lab="materials-pn-junction"] .pj-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end;margin-top:12px}[data-learning-lab="materials-pn-junction"] .pj-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-pn-junction"] .pj-control label{font-size:13px;font-weight:700}[data-learning-lab="materials-pn-junction"] output{color:var(--pj-blue);font-variant-numeric:tabular-nums}[data-learning-lab="materials-pn-junction"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--pj-blue)}',
    '[data-learning-lab="materials-pn-junction"] .pj-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="materials-pn-junction"] .pj-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-pn-junction"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="materials-pn-junction"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="materials-pn-junction"] .pj-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="materials-pn-junction"] table{width:100%;min-width:560px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-pn-junction"] th,[data-learning-lab="materials-pn-junction"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-pn-junction"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-pn-junction"] .pj-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--pj-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:900px){[data-learning-lab="materials-pn-junction"] .pj-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="materials-pn-junction"] .pj-grid{grid-template-columns:1fr}}@media(max-width:560px){[data-learning-lab="materials-pn-junction"] .pj-controls{grid-template-columns:1fr}[data-learning-lab="materials-pn-junction"] .pj-choice-grid{grid-template-columns:1fr}}@media(max-width:430px){[data-learning-lab="materials-pn-junction"] .pj-chart{padding:4px}[data-learning-lab="materials-pn-junction"] table{font-size:11px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-pn-junction"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
      temperatureK: DEFAULTS.temperatureK,
      naLog10Cm3: DEFAULTS.naLog10Cm3,
      ndLog10Cm3: DEFAULTS.ndLog10Cm3,
      ni300Log10Cm3: DEFAULTS.ni300Log10Cm3,
      relativePermittivity: DEFAULTS.relativePermittivity,
      appliedBiasV: DEFAULTS.appliedBiasV
    };
  }

  function cm3ToM3(value) {
    var number = parseNumber(value, "concentration");
    if (number < 0) throw new RangeError("concentration cannot be negative");
    return number * 1e6;
  }

  function intrinsicCarrierCm3(temperatureK, ni300Cm3) {
    var temperature = parseNumber(temperatureK, "temperature");
    var reference = parseNumber(ni300Cm3, "ni(300 K)");
    if (temperature <= 0 || reference <= 0) throw new RangeError("temperature and ni(300 K) must be positive");
    var egJ = BAND_GAP_EV * Q_C;
    return reference * Math.pow(temperature / 300, 1.5) * Math.exp(-egJ / (2 * K_B_J_PER_K) * (1 / temperature - 1 / 300));
  }

  function normalizeConfig(input) {
    var source = input || {};
    var temperatureK = parseNumber(source.temperatureK === undefined ? DEFAULTS.temperatureK : source.temperatureK, "temperature");
    var naLog10Cm3 = source.naLog10Cm3 === undefined ? Math.log10(parseNumber(source.NAcm3 === undefined ? Math.pow(10, DEFAULTS.naLog10Cm3) : source.NAcm3, "NA")) : parseNumber(source.naLog10Cm3, "log10 NA");
    var ndLog10Cm3 = source.ndLog10Cm3 === undefined ? Math.log10(parseNumber(source.NDcm3 === undefined ? Math.pow(10, DEFAULTS.ndLog10Cm3) : source.NDcm3, "ND")) : parseNumber(source.ndLog10Cm3, "log10 ND");
    var ni300Log10Cm3 = source.ni300Log10Cm3 === undefined ? Math.log10(parseNumber(source.ni300Cm3 === undefined ? Math.pow(10, DEFAULTS.ni300Log10Cm3) : source.ni300Cm3, "ni(300 K)")) : parseNumber(source.ni300Log10Cm3, "log10 ni(300 K)");
    var relativePermittivity = parseNumber(source.relativePermittivity === undefined ? DEFAULTS.relativePermittivity : source.relativePermittivity, "relative permittivity");
    var appliedBiasV = parseNumber(source.appliedBiasV === undefined ? DEFAULTS.appliedBiasV : source.appliedBiasV, "applied bias");
    if (temperatureK < 250 || temperatureK > 450) throw new RangeError("temperature must be in [250, 450] K");
    if (naLog10Cm3 < 14 || naLog10Cm3 > 19 || ndLog10Cm3 < 14 || ndLog10Cm3 > 19) throw new RangeError("doping exponents must be in [14, 19] cm^-3");
    if (ni300Log10Cm3 < 8 || ni300Log10Cm3 > 12) throw new RangeError("log10 ni(300 K) must be in [8, 12]");
    if (relativePermittivity < 1 || relativePermittivity > 30) throw new RangeError("relative permittivity must be in [1, 30]");
    if (appliedBiasV < -5 || appliedBiasV > 1.5) throw new RangeError("applied bias must be in [-5, 1.5] V");
    var naCm3 = Math.pow(10, naLog10Cm3);
    var ndCm3 = Math.pow(10, ndLog10Cm3);
    var ni300Cm3 = Math.pow(10, ni300Log10Cm3);
    var niCm3 = intrinsicCarrierCm3(temperatureK, ni300Cm3);
    var thermalVoltageV = K_B_J_PER_K * temperatureK / Q_C;
    var ratio = naCm3 * ndCm3 / (niCm3 * niCm3);
    if (!(ratio > 1)) throw new RangeError("NA*ND must exceed ni(T)^2 for a positive built-in potential");
    var builtInPotentialV = thermalVoltageV * Math.log(ratio);
    if (!(appliedBiasV < builtInPotentialV)) throw new RangeError("Va must be smaller than Vbi in the depletion approximation");
    return {
      temperatureK: temperatureK,
      naLog10Cm3: naLog10Cm3,
      ndLog10Cm3: ndLog10Cm3,
      ni300Log10Cm3: ni300Log10Cm3,
      relativePermittivity: relativePermittivity,
      appliedBiasV: appliedBiasV,
      NAcm3: naCm3,
      NDcm3: ndCm3,
      ni300Cm3: ni300Cm3,
      niCm3: niCm3,
      thermalVoltageV: thermalVoltageV,
      builtInPotentialV: builtInPotentialV
    };
  }

  function abruptPNJunction(input) {
    var config = normalizeConfig(input);
    var epsFPerCm = EPSILON_0_F_PER_CM * config.relativePermittivity;
    var depletionVoltageV = config.builtInPotentialV - config.appliedBiasV;
    var widthCm = Math.sqrt(2 * epsFPerCm / Q_C * (1 / config.NAcm3 + 1 / config.NDcm3) * depletionVoltageV);
    var xpCm = widthCm * config.NDcm3 / (config.NAcm3 + config.NDcm3);
    var xnCm = widthCm * config.NAcm3 / (config.NAcm3 + config.NDcm3);
    var emaxVPerCm = Q_C * config.NAcm3 * xpCm / epsFPerCm;
    var potentialAtJunctionV = Q_C * config.NAcm3 * xpCm * xpCm / (2 * epsFPerCm);
    var profiles = [];
    for (var index = 0; index <= 120; index += 1) {
      var xCm = -xpCm + widthCm * index / 120;
      var rhoCPerCm3;
      var fieldVPerCm;
      var potentialV;
      if (xCm <= 0) {
        rhoCPerCm3 = -Q_C * config.NAcm3;
        fieldVPerCm = -Q_C * config.NAcm3 * (xCm + xpCm) / epsFPerCm;
        potentialV = Q_C * config.NAcm3 * Math.pow(xCm + xpCm, 2) / (2 * epsFPerCm);
      } else {
        rhoCPerCm3 = Q_C * config.NDcm3;
        fieldVPerCm = Q_C * config.NDcm3 * (xCm - xnCm) / epsFPerCm;
        potentialV = potentialAtJunctionV + Q_C * config.NDcm3 * (xnCm * xCm - xCm * xCm / 2) / epsFPerCm;
      }
      profiles.push({ xCm: xCm, xUm: xCm * 1e4, rhoCPerCm3: rhoCPerCm3, fieldVPerCm: fieldVPerCm, potentialV: potentialV });
    }
    return {
      config: config,
      epsilonFPerCm: epsFPerCm,
      depletionVoltageV: depletionVoltageV,
      widthCm: widthCm,
      widthUm: widthCm * 1e4,
      xpCm: xpCm,
      xnCm: xnCm,
      xpUm: xpCm * 1e4,
      xnUm: xnCm * 1e4,
      emaxVPerCm: emaxVPerCm,
      chargeBalanceCPerCm2: Q_C * config.NAcm3 * xpCm,
      profiles: profiles
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
        key: "reverseBias",
        prompt: "把 Va 调得更负（反向偏压增强）时，耗尽层宽度 W 的方向是？",
        expected: "wider",
        choices: [{ value: "wider", label: "变宽，电场峰值也增大" }, { value: "narrower", label: "变窄" }, { value: "same", label: "不变" }]
      },
      {
        key: "doping",
        prompt: "固定 ND、T 和 Va，升高 NA 后，突变结近似的总 W 通常怎样？",
        expected: "narrower",
        choices: [{ value: "narrower", label: "变窄，电荷平衡重新分配" }, { value: "wider", label: "变宽" }, { value: "same", label: "不变" }]
      },
      {
        key: "units",
        prompt: "浓度从 cm^-3 换成 m^-3 时，数值应乘以多少？",
        expected: "million",
        choices: [{ value: "million", label: "10^6" }, { value: "hundred", label: "10^2" }, { value: "billion", label: "10^9" }]
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
      hostNode.appendChild(element(doc, "fieldset", {}, [element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }), element(doc, "div", { className: "pj-choice-grid" }, buttons)]));
    });
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 820 520", role: "img", "aria-label": "pn 结空间电荷、电场和势分布" });
    svg.appendChild(svgElement(doc, "title", {}, "突变 pn 结耗尽近似的三段剖面"));
    svg.appendChild(svgElement(doc, "desc", {}, "上图为空间电荷密度，中图为电场，下图为势；横轴从 p 侧耗尽边界经过结面到 n 侧耗尽边界。"));
    var plots = [
      { x: 66, y: 44, width: 700, height: 115, min: -Math.max(Math.abs(result.profiles[0].rhoCPerCm3), Math.abs(result.profiles[result.profiles.length - 1].rhoCPerCm3)) * 1.15, max: Math.max(Math.abs(result.profiles[0].rhoCPerCm3), Math.abs(result.profiles[result.profiles.length - 1].rhoCPerCm3)) * 1.15, label: "rho / C·cm^-3" },
      { x: 66, y: 205, width: 700, height: 115, min: -result.emaxVPerCm * 1.12, max: result.emaxVPerCm * 0.12, label: "E / V·cm^-1" },
      { x: 66, y: 366, width: 700, height: 115, min: 0, max: result.depletionVoltageV * 1.08, label: "potential / V" }
    ];
    var minX = -result.xpUm;
    var maxX = result.xnUm;
    function mapX(xUm) { return plots[0].x + plots[0].width * (xUm - minX) / (maxX - minX); }
    plots.forEach(function (plot) {
      svg.appendChild(svgElement(doc, "rect", { x: plot.x, y: plot.y, width: plot.width, height: plot.height, fill: "none", stroke: "currentColor" }));
      svg.appendChild(svgElement(doc, "text", { x: plot.x + 5, y: plot.y + 16, "font-size": 12, "font-weight": 700 }, plot.label));
      var zeroY = plot.y + plot.height - plot.height * (0 - plot.min) / (plot.max - plot.min);
      if (zeroY >= plot.y && zeroY <= plot.y + plot.height) svg.appendChild(svgElement(doc, "line", { x1: plot.x, y1: zeroY, x2: plot.x + plot.width, y2: zeroY, stroke: "currentColor", "stroke-opacity": 0.2 }));
    });
    function mapY(plot, value) { return plot.y + plot.height - plot.height * (value - plot.min) / (plot.max - plot.min); }
    var paths = [[], [], []];
    result.profiles.forEach(function (point, index) {
      var command = index ? "L" : "M";
      paths[0].push(command + mapX(point.xUm).toFixed(2) + " " + mapY(plots[0], point.rhoCPerCm3).toFixed(2));
      paths[1].push(command + mapX(point.xUm).toFixed(2) + " " + mapY(plots[1], point.fieldVPerCm).toFixed(2));
      paths[2].push(command + mapX(point.xUm).toFixed(2) + " " + mapY(plots[2], point.potentialV).toFixed(2));
    });
    svg.appendChild(svgElement(doc, "path", { d: paths[0].join(" "), fill: "none", stroke: "#b64335", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "path", { d: paths[1].join(" "), fill: "none", stroke: "#2563a6", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "path", { d: paths[2].join(" "), fill: "none", stroke: "#39734d", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "line", { x1: mapX(0), y1: plots[0].y, x2: mapX(0), y2: plots[2].y + plots[2].height, stroke: "#9b6a12", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "text", { x: plots[0].x + plots[0].width, y: plots[2].y + plots[2].height + 29, "font-size": 12, "text-anchor": "end" }, "x / µm（p 侧 ← 0 → n 侧）"));
    svg.appendChild(svgElement(doc, "text", { x: plots[0].x + 4, y: 26, "font-size": 14, "font-weight": 700 }, "突变 pn 结耗尽区；金虚线为冶金结面"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var rows = [
      ["T", format(result.config.temperatureK, 2), "K；ni(T) 使用 300 K 归一化简化式"],
      ["NA / ND", format(result.config.NAcm3, 4) + " / " + format(result.config.NDcm3, 4), "cm^-3；计算全程使用 cm 制"],
      ["ni(T)", format(result.config.niCm3, 4), "cm^-3；非固定的 300 K 数值"],
      ["epsilon_s", format(result.epsilonFPerCm, 5), "F/cm；epsilon0 = 8.8541878128e-14 F/cm"],
      ["Vbi", format(result.config.builtInPotentialV, 5), "V"],
      ["Vbi - Va", format(result.depletionVoltageV, 5), "V；要求 Va < Vbi"],
      ["W", format(result.widthUm, 5), "µm；由 cm 结果乘 1e4"],
      ["xp / xn", format(result.xpUm, 5) + " / " + format(result.xnUm, 5), "µm；NA·xp = ND·xn"],
      ["|Emax|", format(result.emaxVPerCm, 5), "V/cm"],
      ["界面电荷平衡", format(result.chargeBalanceCPerCm2, 5), "C/cm^2；p、n 两侧绝对值相等"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "pn 结单位与耗尽近似账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 读法" })])]), body]));
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "pj-shell" });
    shell.appendChild(element(doc, "h3", { text: "互动实验：突变 pn 结的耗尽宽度、电场与势" }));
    shell.appendChild(element(doc, "p", { className: "pj-note", text: "浓度输入是 log10(cm^-3)；模型在 F/cm 与 cm^-3 中计算，输出 W 用 µm、Emax 用 V/cm。温度变化会同步更新 ni(T)。" }));
    var predictionHost = element(doc, "div", { className: "pj-predictions" });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "pj-actions" });
    var reveal = element(doc, "button", { type: "button", className: "pj-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "pj-feedback", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "pj-controls" });
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
      controls.appendChild(element(doc, "div", { className: "pj-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }

    addRange("temperatureK", "T / K", "250", "450", "1", 0);
    addRange("naLog10Cm3", "log10 NA / cm^-3", "14", "19", "0.1", 1);
    addRange("ndLog10Cm3", "log10 ND / cm^-3", "14", "19", "0.1", 1);
    addRange("ni300Log10Cm3", "log10 ni(300 K) / cm^-3", "9", "11", "0.1", 1);
    addRange("relativePermittivity", "epsilon_r", "8", "16", "0.1", 1);
    addRange("appliedBiasV", "Va / V", "-1", "0.7", "0.01", 2);
    resultPanel.appendChild(controls);
    var chart = element(doc, "div", { className: "pj-chart" });
    var tableWrap = element(doc, "div", { className: "pj-table-wrap" });
    var note = element(doc, "p", { className: "pj-note" });
    resultPanel.appendChild(element(doc, "div", { className: "pj-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);
    renderPredictions(doc, predictionHost, state);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测；揭示前不显示空间电荷、电场、势和单位账本。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。现在可以调节掺杂、温度和偏压。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      renderPredictions(doc, predictionHost, state);
      render();
      announce(api, rootNode, "pn 结预测、剖面和单位账本已重置。");
    });

    function render() {
      var result = null;
      var error = null;
      try { result = abruptPNJunction(state.config); } catch (caught) { error = caught; }
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = inputs[key].special ? inputs[key].special(state.config[key]) : format(state.config[key], inputs[key].digits);
      });
      feedback.textContent = error ? "输入超出突变结边界：" + error.message : state.feedback;
      feedback.className = "pj-feedback" + (error || (state.feedback.indexOf("请先") === 0) ? " pj-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed || !result) {
        chart.replaceChildren();
        tableWrap.replaceChildren();
        note.textContent = error ? "请满足 NA·ND > ni(T)^2 且 Va < Vbi；强正偏时本近似不适用。" : "揭示后显示三段剖面和可核查的 cm/F/cm 单位账本。";
        return;
      }
      chart.replaceChildren(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "模型边界：突变耗尽近似要求非简并、突变掺杂、Va < Vbi 且忽略复合、串联电阻、击穿和高注入；简化 ni(T) 只用于教学量级，不是完整温度材料数据库。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(300, 0) === "300", "integer formatting preserves trailing zeros");
    check(near(parseNumber("16", "x"), 16), "numeric text is parsed");
    check(copyDefaults().temperatureK === 300 && copyDefaults().naLog10Cm3 === 16, "default values are stable");
    var base = abruptPNJunction(DEFAULTS);
    check(base.config.niCm3 === base.config.ni300Cm3, "300 K intrinsic carrier value matches normalization");
    check(base.config.builtInPotentialV > 0 && base.widthUm > 0 && base.emaxVPerCm > 0, "default depletion result is positive");
    check(near(base.config.NAcm3 * base.xpCm, base.config.NDcm3 * base.xnCm), "depletion charge balance holds");
    check(near(cm3ToM3(1), 1e6), "cm^-3 to m^-3 conversion is 10^6");
    var reverse = abruptPNJunction({ appliedBiasV: -1 });
    check(reverse.widthCm > base.widthCm && reverse.emaxVPerCm > base.emaxVPerCm, "reverse bias widens depletion and raises field");
    var higherNA = abruptPNJunction({ naLog10Cm3: 17, ndLog10Cm3: 17, appliedBiasV: 0.2 });
    check(higherNA.widthCm < base.widthCm, "higher NA at fixed ND narrows the depletion width");
    check(intrinsicCarrierCm3(400, 1e10) > intrinsicCarrierCm3(300, 1e10), "temperature-dependent ni increases with temperature");
    check(base.profiles.length === 121 && JSON.stringify(base.profiles) === JSON.stringify(abruptPNJunction(DEFAULTS).profiles), "profiles are deterministic");
    check(normalizeConfig({ temperatureK: 250, appliedBiasV: -1 }).temperatureK === 250, "temperature lower boundary is accepted");
    var threw = false;
    try { parseNumber("", "blank"); } catch (error) { threw = true; }
    check(threw, "blank input is rejected");
    threw = false;
    try { abruptPNJunction({ appliedBiasV: 2 }); } catch (error2) { threw = true; }
    check(threw, "Va >= Vbi is rejected");
    threw = false;
    try { normalizeConfig({ naLog10Cm3: 14, ndLog10Cm3: 14, temperatureK: 450, ni300Log10Cm3: 12 }); } catch (error3) { threw = true; }
    check(threw, "non-positive built-in-potential domain is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    parseNumber: parseNumber,
    normalizeConfig: normalizeConfig,
    cm3ToM3: cm3ToM3,
    intrinsicCarrierCm3: intrinsicCarrierCm3,
    abruptPNJunction: abruptPNJunction,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
