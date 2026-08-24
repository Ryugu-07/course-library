(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-corrosion-mixed-potential", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-corrosion-mixed-potential self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-corrosion-mixed-potential self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-corrosion-mixed-potential-styles";
  var DEFAULTS = {
    anodicExchangeMAcm2: 0.001,
    cathodicExchangeMAcm2: 0.002,
    areaRatio: 10,
    passive: false,
    passivePotentialV: -0.35,
    passiveCurrentMAcm2: 0.03,
    limitingCurrentMAcm2: 10
  };
  var ANODIC_EQUILIBRIUM_V = -0.50;
  var CATHODIC_EQUILIBRIUM_V = 0.00;
  var ANODIC_TAFEL_V_PER_DEC = 0.12;
  var CATHODIC_TAFEL_V_PER_DEC = 0.18;
  var IRON_EQUIVALENT_WEIGHT = 27.925;
  var IRON_DENSITY_G_CM3 = 7.87;
  var CORROSION_RATE_MM_Y_PER_MA_CM2 = 3.27;
  var STYLE_TEXT = [
    '[data-learning-lab="materials-corrosion-mixed-potential"]{--mc-blue:#2563a6;--mc-red:#b64335;--mc-green:#39734d;--mc-gold:#9b6a12;--mc-purple:#76539b;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="materials-corrosion-mixed-potential"] *{box-sizing:border-box}[data-learning-lab="materials-corrosion-mixed-potential"] [hidden]{display:none!important}',
    '[data-learning-lab="materials-corrosion-mixed-potential"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-corrosion-mixed-potential"] p{margin:8px 0}',
    '[data-learning-lab="materials-corrosion-mixed-potential"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-corrosion-mixed-potential"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="materials-corrosion-mixed-potential"] .mc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-corrosion-mixed-potential"] button,[data-learning-lab="materials-corrosion-mixed-potential"] input,[data-learning-lab="materials-corrosion-mixed-potential"] select{font:inherit}',
    '[data-learning-lab="materials-corrosion-mixed-potential"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-corrosion-mixed-potential"] button:hover{border-color:var(--mc-blue)}[data-learning-lab="materials-corrosion-mixed-potential"] button[aria-pressed="true"],[data-learning-lab="materials-corrosion-mixed-potential"] .mc-primary{border-color:var(--mc-blue);background:var(--mc-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="materials-corrosion-mixed-potential"] button:focus-visible,[data-learning-lab="materials-corrosion-mixed-potential"] input:focus-visible,[data-learning-lab="materials-corrosion-mixed-potential"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-corrosion-mixed-potential"] .mc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-corrosion-mixed-potential"] .mc-actions>*{flex:1 1 170px}[data-learning-lab="materials-corrosion-mixed-potential"] .mc-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-corrosion-mixed-potential"] .mc-good{color:var(--mc-green)}[data-learning-lab="materials-corrosion-mixed-potential"] .mc-warn{color:var(--mc-red)}',
    '[data-learning-lab="materials-corrosion-mixed-potential"] .mc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end;margin-top:12px}[data-learning-lab="materials-corrosion-mixed-potential"] .mc-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-corrosion-mixed-potential"] .mc-control label{font-size:13px;font-weight:700}[data-learning-lab="materials-corrosion-mixed-potential"] output{color:var(--mc-blue);font-variant-numeric:tabular-nums}[data-learning-lab="materials-corrosion-mixed-potential"] input[type="range"],[data-learning-lab="materials-corrosion-mixed-potential"] select{display:block;width:100%;min-height:44px;accent-color:var(--mc-blue)}[data-learning-lab="materials-corrosion-mixed-potential"] select{padding:7px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit}',
    '[data-learning-lab="materials-corrosion-mixed-potential"] .mc-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="materials-corrosion-mixed-potential"] .mc-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-corrosion-mixed-potential"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="materials-corrosion-mixed-potential"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="materials-corrosion-mixed-potential"] .mc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="materials-corrosion-mixed-potential"] table{width:100%;min-width:470px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-corrosion-mixed-potential"] th,[data-learning-lab="materials-corrosion-mixed-potential"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-corrosion-mixed-potential"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-corrosion-mixed-potential"] .mc-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mc-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:800px){[data-learning-lab="materials-corrosion-mixed-potential"] .mc-grid{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="materials-corrosion-mixed-potential"] .mc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="materials-corrosion-mixed-potential"] .mc-choice-grid{grid-template-columns:1fr}}@media(max-width:430px){[data-learning-lab="materials-corrosion-mixed-potential"] .mc-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-corrosion-mixed-potential"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
    return {
      anodicExchangeMAcm2: DEFAULTS.anodicExchangeMAcm2,
      cathodicExchangeMAcm2: DEFAULTS.cathodicExchangeMAcm2,
      areaRatio: DEFAULTS.areaRatio,
      passive: DEFAULTS.passive,
      passivePotentialV: DEFAULTS.passivePotentialV,
      passiveCurrentMAcm2: DEFAULTS.passiveCurrentMAcm2,
      limitingCurrentMAcm2: DEFAULTS.limitingCurrentMAcm2
    };
  }

  function normalizeConfig(input) {
    var source = input || {};
    var anodicExchangeMAcm2 = finite(source.anodicExchangeMAcm2 === undefined ? DEFAULTS.anodicExchangeMAcm2 : source.anodicExchangeMAcm2, "anodic exchange current");
    var cathodicExchangeMAcm2 = finite(source.cathodicExchangeMAcm2 === undefined ? DEFAULTS.cathodicExchangeMAcm2 : source.cathodicExchangeMAcm2, "cathodic exchange current");
    var areaRatio = finite(source.areaRatio === undefined ? DEFAULTS.areaRatio : source.areaRatio, "cathode/anode area ratio");
    var passive = source.passive === undefined ? DEFAULTS.passive : Boolean(source.passive);
    var passivePotentialV = finite(source.passivePotentialV === undefined ? DEFAULTS.passivePotentialV : source.passivePotentialV, "passivation potential");
    var passiveCurrentMAcm2 = finite(source.passiveCurrentMAcm2 === undefined ? DEFAULTS.passiveCurrentMAcm2 : source.passiveCurrentMAcm2, "passive current");
    var limitingCurrentMAcm2 = finite(source.limitingCurrentMAcm2 === undefined ? DEFAULTS.limitingCurrentMAcm2 : source.limitingCurrentMAcm2, "limiting current");
    if (anodicExchangeMAcm2 <= 0 || cathodicExchangeMAcm2 <= 0) throw new RangeError("exchange currents must be positive mA/cm2");
    if (areaRatio <= 0 || areaRatio > 100) throw new RangeError("cathode/anode area ratio must be in (0, 100]");
    if (passivePotentialV < -1 || passivePotentialV > 0.5) throw new RangeError("passivation potential must be in [-1, 0.5] V");
    if (passiveCurrentMAcm2 <= 0 || limitingCurrentMAcm2 <= 0) throw new RangeError("passive and limiting currents must be positive");
    return {
      anodicExchangeMAcm2: anodicExchangeMAcm2,
      cathodicExchangeMAcm2: cathodicExchangeMAcm2,
      areaRatio: areaRatio,
      passive: passive,
      passivePotentialV: passivePotentialV,
      passiveCurrentMAcm2: passiveCurrentMAcm2,
      limitingCurrentMAcm2: limitingCurrentMAcm2
    };
  }

  function tenPow(exponent) {
    return Math.pow(10, clamp(exponent, -30, 30));
  }

  function tafelAnodic(potentialV, config) {
    return config.anodicExchangeMAcm2 * tenPow((potentialV - ANODIC_EQUILIBRIUM_V) / ANODIC_TAFEL_V_PER_DEC);
  }

  function tafelCathodic(potentialV, config) {
    return config.cathodicExchangeMAcm2 * tenPow((CATHODIC_EQUILIBRIUM_V - potentialV) / CATHODIC_TAFEL_V_PER_DEC);
  }

  function effectiveAnodic(potentialV, config) {
    var active = tafelAnodic(potentialV, config);
    if (config.passive && potentialV >= config.passivePotentialV) return config.passiveCurrentMAcm2;
    return active;
  }

  function effectiveCathodic(potentialV, config) {
    return Math.min(tafelCathodic(potentialV, config), config.limitingCurrentMAcm2);
  }

  function activeMixedPotential(configInput) {
    var config = normalizeConfig(configInput);
    var numerator = Math.log10(config.cathodicExchangeMAcm2 / config.anodicExchangeMAcm2) + CATHODIC_EQUILIBRIUM_V / CATHODIC_TAFEL_V_PER_DEC + ANODIC_EQUILIBRIUM_V / ANODIC_TAFEL_V_PER_DEC + Math.log10(config.areaRatio);
    var denominator = 1 / ANODIC_TAFEL_V_PER_DEC + 1 / CATHODIC_TAFEL_V_PER_DEC;
    return numerator / denominator;
  }

  function currentBalance(potentialV, config) {
    return effectiveAnodic(potentialV, config) - config.areaRatio * effectiveCathodic(potentialV, config);
  }

  function mixedPotential(configInput) {
    var config = normalizeConfig(configInput);
    var lower = -2;
    var upper = 1;
    var previousPotential = lower;
    var previousValue = currentBalance(previousPotential, config);
    for (var index = 1; index <= 800; index += 1) {
      var potential = lower + (upper - lower) * index / 800;
      var value = currentBalance(potential, config);
      if (previousValue === 0 || value === 0 || previousValue * value < 0) {
        var left = previousPotential;
        var right = potential;
        for (var iteration = 0; iteration < 80; iteration += 1) {
          var middle = (left + right) / 2;
          var middleValue = currentBalance(middle, config);
          if (previousValue * middleValue <= 0) {
            right = middle;
            value = middleValue;
          } else {
            left = middle;
            previousValue = middleValue;
          }
        }
        return (left + right) / 2;
      }
      previousPotential = potential;
      previousValue = value;
    }
    throw new RangeError("mixed-potential root not found in scan window");
  }

  function corrosionLedger(input) {
    var config = normalizeConfig(input);
    var activePotentialV = activeMixedPotential(config);
    var potentialV = mixedPotential(config);
    var anodicCurrentMAcm2 = effectiveAnodic(potentialV, config);
    var cathodicCurrentMAcm2 = effectiveCathodic(potentialV, config);
    var activeAnodicCurrentMAcm2 = tafelAnodic(activePotentialV, config);
    var anodeAreaCm2 = 1;
    var cathodeAreaCm2 = config.areaRatio;
    var anodeTotalCurrentMA = anodeAreaCm2 * anodicCurrentMAcm2;
    var cathodeTotalCurrentMA = cathodeAreaCm2 * cathodicCurrentMAcm2;
    return {
      config: config,
      anodicEquilibriumV: ANODIC_EQUILIBRIUM_V,
      cathodicEquilibriumV: CATHODIC_EQUILIBRIUM_V,
      anodicTafelVPerDec: ANODIC_TAFEL_V_PER_DEC,
      cathodicTafelVPerDec: CATHODIC_TAFEL_V_PER_DEC,
      activeMixedPotentialV: activePotentialV,
      mixedPotentialV: potentialV,
      anodicCurrentMAcm2: anodicCurrentMAcm2,
      cathodicCurrentMAcm2: cathodicCurrentMAcm2,
      activeAnodicCurrentMAcm2: activeAnodicCurrentMAcm2,
      anodeAreaCm2: anodeAreaCm2,
      cathodeAreaCm2: cathodeAreaCm2,
      anodeTotalCurrentMA: anodeTotalCurrentMA,
      cathodeTotalCurrentMA: cathodeTotalCurrentMA,
      netCurrentMA: anodeTotalCurrentMA - cathodeTotalCurrentMA,
      passivationActive: config.passive && potentialV >= config.passivePotentialV,
      massTransportLimited: tafelCathodic(potentialV, config) > config.limitingCurrentMAcm2 * (1 + 1e-8),
      penetrationRateMmPerYear: CORROSION_RATE_MM_Y_PER_MA_CM2 * anodicCurrentMAcm2 * IRON_EQUIVALENT_WEIGHT / IRON_DENSITY_G_CM3
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
    var svg = svgElement(doc, "svg", { viewBox: "0 0 820 410", role: "img", "aria-label": "Tafel 极化曲线和混合电位交点" });
    svg.appendChild(svgElement(doc, "title", {}, "阳极、阴极极化曲线与混合电位交点"));
    svg.appendChild(svgElement(doc, "desc", {}, "红线为阳极电流，蓝线为阴极总电流；两者交点给出电子守恒的混合电位。钝化与传质边界用虚线标识。"));
    var plot = { x: 58, y: 48, width: 700, height: 290 };
    var minPotential = -0.9;
    var maxPotential = 0.4;
    var minLogCurrent = -5;
    var maxLogCurrent = 2;
    function mapX(potential) { return plot.x + plot.width * (potential - minPotential) / (maxPotential - minPotential); }
    function mapY(logCurrent) { return plot.y + plot.height - plot.height * (logCurrent - minLogCurrent) / (maxLogCurrent - minLogCurrent); }
    function safeLog(value) { return Math.log10(Math.max(value, 1e-5)); }
    svg.appendChild(svgElement(doc, "rect", { x: plot.x, y: plot.y, width: plot.width, height: plot.height, fill: "none", stroke: "currentColor" }));
    var anodicPath = [];
    var cathodicPath = [];
    for (var index = 0; index <= 150; index += 1) {
      var potential = minPotential + (maxPotential - minPotential) * index / 150;
      anodicPath.push((index ? "L" : "M") + mapX(potential).toFixed(2) + " " + mapY(safeLog(effectiveAnodic(potential, result.config))).toFixed(2));
      cathodicPath.push((index ? "L" : "M") + mapX(potential).toFixed(2) + " " + mapY(safeLog(result.config.areaRatio * effectiveCathodic(potential, result.config))).toFixed(2));
    }
    svg.appendChild(svgElement(doc, "path", { d: anodicPath.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "path", { d: cathodicPath.join(" "), fill: "none", stroke: "#2563a6", "stroke-width": 3 }));
    if (result.config.passive) {
      svg.appendChild(svgElement(doc, "line", { x1: mapX(result.config.passivePotentialV), y1: plot.y, x2: mapX(result.config.passivePotentialV), y2: plot.y + plot.height, stroke: "#9b6a12", "stroke-dasharray": "5 4" }));
    }
    svg.appendChild(svgElement(doc, "line", { x1: plot.x, y1: mapY(safeLog(result.config.areaRatio * result.config.limitingCurrentMAcm2)), x2: plot.x + plot.width, y2: mapY(safeLog(result.config.areaRatio * result.config.limitingCurrentMAcm2)), stroke: "#39734d", "stroke-dasharray": "4 4" }));
    svg.appendChild(svgElement(doc, "circle", { cx: mapX(result.mixedPotentialV), cy: mapY(safeLog(result.anodeTotalCurrentMA)), r: 7, fill: "#76539b", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + 5, y: 27, "font-size": 14, "font-weight": 700 }, "红：阳极　蓝：阴极总电流　紫：E_mix　绿虚线：传质上限"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x + plot.width, y: plot.y + plot.height + 29, "font-size": 12, "text-anchor": "end" }, "电位 E / V"));
    svg.appendChild(svgElement(doc, "text", { x: plot.x - 8, y: plot.y + 12, "font-size": 12, transform: "rotate(-90 " + (plot.x - 8) + " " + (plot.y + 12) + ")" }, "log10 |I| / mA"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var rows = [
      ["E_mix（含边界）", format(result.mixedPotentialV, 4), "V；I_a,total = I_c,total"],
      ["E_mix（纯 Tafel 交点）", format(result.activeMixedPotentialV, 4), "V；无钝化/传质截断的解析交点"],
      ["阳极 / 阴极电流密度", format(result.anodicCurrentMAcm2, 4) + " / " + format(result.cathodicCurrentMAcm2, 4), "mA/cm²"],
      ["阳极 / 阴极面积", format(result.anodeAreaCm2, 0) + " / " + format(result.cathodeAreaCm2, 2), "cm²；面积比 Ac/Aa"],
      ["总阳极 / 阴极电流", format(result.anodeTotalCurrentMA, 4) + " / " + format(result.cathodeTotalCurrentMA, 4), "mA；电子守恒账"],
      ["净电流残差", format(result.netCurrentMA, 8), "mA；应接近 0"],
      ["腐蚀穿透率（Fe²⁺代理）", format(result.penetrationRateMmPerYear, 4), "mm/year；由 mA/cm²、当量重和密度换算"],
      ["边界状态", (result.passivationActive ? "钝化平台启用；" : "未启用钝化平台；") + (result.massTransportLimited ? "阴极受传质上限" : "阴极仍在 Tafel 区"), "教学分支"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })]));
    });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "腐蚀混合电位有量纲账本" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]),
      body
    ]));
  }

  function questionSpecs() {
    return [
      {
        key: "area",
        prompt: "在活化 Tafel 区，把阴极面积 Ac 相对阳极面积 Aa 做得更大，其他条件不变，哪个结论最合理？",
        expected: "anode-rise",
        choices: [{ value: "anode-rise", label: "小阳极的腐蚀电流密度会上升" }, { value: "fall", label: "小阳极一定更安全" }, { value: "same", label: "面积比没有作用" }]
      },
      {
        key: "intersection",
        prompt: "在混合电位交点，阳极和阴极的总电流应满足什么？",
        expected: "balance",
        choices: [{ value: "balance", label: "等量反向，净电流为 0" }, { value: "anode", label: "只有阳极电流存在" }, { value: "cathode", label: "只有阴极电流存在" }]
      },
      {
        key: "boundary",
        prompt: "一旦进入钝化或阴极传质限制，如何使用单纯 Tafel 外推？",
        expected: "cap",
        choices: [{ value: "cap", label: "需换成平台/上限边界模型" }, { value: "all", label: "仍可无限外推" }, { value: "zero", label: "电流必然立刻为零" }]
      }
    ];
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "mc-lab" });
    shell.appendChild(element(doc, "h3", { text: "腐蚀实验：让阳极、阴极、面积比和边界一起决定 E_mix" }));
    shell.appendChild(element(doc, "p", { className: "mc-note", text: "先预测面积比、电子守恒和 Tafel 边界；揭示后可打开钝化或压低传质上限，结果保持可见。" }));
    var predictionHost = element(doc, "div");
    var predictionGroups = [];
    questionSpecs().forEach(function (spec) {
      var fieldset = element(doc, "fieldset");
      fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
      var grid = element(doc, "div", { className: "mc-choice-grid" });
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
    var actions = element(doc, "div", { className: "mc-actions" });
    var reveal = element(doc, "button", { type: "button", className: "mc-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "mc-feedback", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "mc-controls" });
    var inputs = {};
    function addRange(key, label, min, max, step, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = Number(input.value);
        state.feedback = state.revealed ? "参数已更新；混合电位账本仍保持揭示。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits };
      controls.appendChild(element(doc, "div", { className: "mc-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }
    addRange("anodicExchangeMAcm2", "阳极 i0,a / mA·cm^-2", "0.0002", "0.005", "0.0001", 4);
    addRange("cathodicExchangeMAcm2", "阴极 i0,c / mA·cm^-2", "0.0002", "0.008", "0.0001", 4);
    addRange("areaRatio", "面积比 Ac/Aa", "0.5", "20", "0.5", 1);
    addRange("passivePotentialV", "钝化起始 Epass / V", "-0.6", "0.1", "0.01", 2);
    addRange("passiveCurrentMAcm2", "钝化平台 ipass / mA·cm^-2", "0.005", "0.2", "0.005", 3);
    addRange("limitingCurrentMAcm2", "阴极传质上限 ilim / mA·cm^-2", "0.01", "10", "0.01", 2);
    var passiveLabel = element(doc, "label", {}, "阳极钝化分支");
    var passiveSelect = element(doc, "select", { "aria-label": "阳极钝化分支" });
    passiveSelect.appendChild(element(doc, "option", { value: "false", text: "关闭：活化 Tafel" }));
    passiveSelect.appendChild(element(doc, "option", { value: "true", text: "开启：Epass 后平台" }));
    passiveLabel.appendChild(passiveSelect);
    controls.appendChild(element(doc, "div", { className: "mc-control" }, [passiveLabel]));
    passiveSelect.addEventListener("change", function () {
      state.config.passive = passiveSelect.value === "true";
      state.feedback = state.revealed ? "边界分支已更新；结果仍保持揭示。" : "";
      render();
    });
    var chart = element(doc, "div", { className: "mc-chart" });
    var tableWrap = element(doc, "div", { className: "mc-table-wrap" });
    var note = element(doc, "p", { className: "mc-note" });
    resultPanel.appendChild(controls);
    resultPanel.appendChild(element(doc, "div", { className: "mc-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项腐蚀预测；揭示前不显示极化曲线和电流账本。";
        render();
        return;
      }
      var result = corrosionLedger(state.config);
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。E_mix = " + format(result.mixedPotentialV, 3) + " V，净电流残差约为 0。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      render();
      announce(api, rootNode, "腐蚀预测和混合电位账本已重置。");
    });

    function render() {
      var result = corrosionLedger(state.config);
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
      });
      passiveSelect.value = String(state.config.passive);
      predictionGroups.forEach(function (group) {
        group.buttons.forEach(function (button) { button.node.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); });
      });
      feedback.textContent = state.feedback;
      feedback.className = "mc-feedback" + (state.feedback.indexOf("请先") === 0 ? " mc-warn" : "");
      resultPanel.hidden = !state.revealed;
      if (!state.revealed) {
        chart.replaceChildren();
        tableWrap.replaceChildren();
        note.textContent = "揭示后显示 Tafel 曲线、面积比后的总电流、混合电位和边界状态。";
        return;
      }
      chart.replaceChildren(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "模型边界：这里用阳极/阴极 Tafel 直线在混合电位处相交，并以 Aa = 1 cm²、Ac/Aa 为面积比；钝化用单平台、阴极用单一传质上限作教学分支，扫描器只返回电位从低到高遇到的第一个电流平衡根，不模拟多稳态或迟滞。真实极化曲线会受溶液电阻、氧浓度、流速、膜破裂/再钝化、多步反应和局部腐蚀影响；PREN、牌号和腐蚀速率仍需环境与试验验证。Fe²⁺穿透率只是把电流换成长度的量纲示例。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200" && format(60, 0) === "60", "zero-decimal formatter preserves integer trailing zeros");
    var active = corrosionLedger({ passive: false, limitingCurrentMAcm2: 10, areaRatio: 10 });
    check(near(active.mixedPotentialV, active.activeMixedPotentialV, 1e-8), "active Tafel root matches analytic mixed potential");
    check(Math.abs(active.netCurrentMA) < 1e-8, "mixed potential conserves total current");
    check(near(active.penetrationRateMmPerYear, 3.27 * active.anodicCurrentMAcm2 * 27.925 / 7.87, 1e-12), "mA/cm2 converts to mm/year with the Faraday-law coefficient");
    var smallCathode = corrosionLedger({ passive: false, limitingCurrentMAcm2: 10, areaRatio: 1 });
    check(active.anodicCurrentMAcm2 > smallCathode.anodicCurrentMAcm2, "larger cathode area raises small-anode current density");
    var transport = corrosionLedger({ passive: false, limitingCurrentMAcm2: 0.01, areaRatio: 10 });
    check(transport.massTransportLimited, "low limiting current activates mass-transport boundary");
    check(transport.anodicCurrentMAcm2 < active.anodicCurrentMAcm2, "transport cap changes corrosion current");
    var passive = corrosionLedger({ passive: true, passivePotentialV: -0.35, passiveCurrentMAcm2: 0.03, limitingCurrentMAcm2: 10, areaRatio: 10 });
    check(passive.passivationActive, "passive branch is visible at mixed potential");
    check(passive.anodicCurrentMAcm2 < active.anodicCurrentMAcm2, "passive platform lowers anodic current in this case");
    var threw = false;
    try { corrosionLedger({ areaRatio: 0 }); } catch (error) { threw = true; }
    check(threw, "zero area ratio rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    tafelAnodic: tafelAnodic,
    tafelCathodic: tafelCathodic,
    activeMixedPotential: activeMixedPotential,
    mixedPotential: mixedPotential,
    corrosionLedger: corrosionLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
