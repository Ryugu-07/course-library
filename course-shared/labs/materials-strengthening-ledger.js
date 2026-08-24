(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-strengthening-ledger", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-strengthening-ledger self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-strengthening-ledger self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-strengthening-ledger-styles";
  var DEFAULTS = {
    grainSizeUm: 20,
    dislocationLog10: 14,
    solutePct: 1.5,
    particleSpacingNm: 100
  };
  var SIGMA_0_MPA = 70;
  var HALL_PETCH_K_MPA_SQRT_M = 0.70;
  var TAYLOR_M = 3;
  var TAYLOR_ALPHA = 0.25;
  var SHEAR_MODULUS_GPA = 26;
  var BURGERS_NM = 0.286;
  var SOLUTE_COEFFICIENT = 120;
  var ORowan_FACTOR = 0.40;
  var STYLE_TEXT = [
    '[data-learning-lab="materials-strengthening-ledger"]{--ms-blue:#2563a6;--ms-red:#b64335;--ms-green:#39734d;--ms-gold:#9b6a12;--ms-purple:#76539b;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="materials-strengthening-ledger"] *{box-sizing:border-box}[data-learning-lab="materials-strengthening-ledger"] [hidden]{display:none!important}',
    '[data-learning-lab="materials-strengthening-ledger"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-strengthening-ledger"] p{margin:8px 0}',
    '[data-learning-lab="materials-strengthening-ledger"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-strengthening-ledger"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="materials-strengthening-ledger"] .ms-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-strengthening-ledger"] button,[data-learning-lab="materials-strengthening-ledger"] input{font:inherit}',
    '[data-learning-lab="materials-strengthening-ledger"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-strengthening-ledger"] button:hover{border-color:var(--ms-blue)}[data-learning-lab="materials-strengthening-ledger"] button[aria-pressed="true"],[data-learning-lab="materials-strengthening-ledger"] .ms-primary{border-color:var(--ms-blue);background:var(--ms-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="materials-strengthening-ledger"] button:focus-visible,[data-learning-lab="materials-strengthening-ledger"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-strengthening-ledger"] .ms-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-strengthening-ledger"] .ms-actions>*{flex:1 1 170px}[data-learning-lab="materials-strengthening-ledger"] .ms-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-strengthening-ledger"] .ms-good{color:var(--ms-green)}[data-learning-lab="materials-strengthening-ledger"] .ms-warn{color:var(--ms-red)}',
    '[data-learning-lab="materials-strengthening-ledger"] .ms-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end;margin-top:12px}[data-learning-lab="materials-strengthening-ledger"] .ms-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-strengthening-ledger"] .ms-control label{font-size:13px;font-weight:700}[data-learning-lab="materials-strengthening-ledger"] output{color:var(--ms-blue);font-variant-numeric:tabular-nums}[data-learning-lab="materials-strengthening-ledger"] input[type="range"]{display:block;width:100%;min-height:44px;accent-color:var(--ms-blue)}',
    '[data-learning-lab="materials-strengthening-ledger"] .ms-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="materials-strengthening-ledger"] .ms-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-strengthening-ledger"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="materials-strengthening-ledger"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="materials-strengthening-ledger"] .ms-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="materials-strengthening-ledger"] table{width:100%;min-width:450px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-strengthening-ledger"] th,[data-learning-lab="materials-strengthening-ledger"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-strengthening-ledger"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-strengthening-ledger"] .ms-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--ms-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:760px){[data-learning-lab="materials-strengthening-ledger"] .ms-grid{grid-template-columns:1fr}}@media(max-width:560px){[data-learning-lab="materials-strengthening-ledger"] .ms-controls{grid-template-columns:1fr}[data-learning-lab="materials-strengthening-ledger"] .ms-choice-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-strengthening-ledger"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
      grainSizeUm: DEFAULTS.grainSizeUm,
      dislocationLog10: DEFAULTS.dislocationLog10,
      solutePct: DEFAULTS.solutePct,
      particleSpacingNm: DEFAULTS.particleSpacingNm
    };
  }

  function normalizeConfig(input) {
    var source = input || {};
    var grainSizeUm = finite(source.grainSizeUm === undefined ? DEFAULTS.grainSizeUm : source.grainSizeUm, "grain size");
    var dislocationLog10 = finite(source.dislocationLog10 === undefined ? DEFAULTS.dislocationLog10 : source.dislocationLog10, "dislocation-density exponent");
    var solutePct = finite(source.solutePct === undefined ? DEFAULTS.solutePct : source.solutePct, "solute concentration");
    var particleSpacingNm = finite(source.particleSpacingNm === undefined ? DEFAULTS.particleSpacingNm : source.particleSpacingNm, "particle spacing");
    if (grainSizeUm <= 0 || grainSizeUm > 500) throw new RangeError("grain size must be in (0, 500] um");
    if (dislocationLog10 < 8 || dislocationLog10 > 16) throw new RangeError("dislocation-density exponent must be in [8, 16]");
    if (solutePct < 0 || solutePct > 10) throw new RangeError("solute concentration must be in [0, 10] wt% proxy");
    if (particleSpacingNm <= 0 || particleSpacingNm > 2000) throw new RangeError("particle spacing must be in (0, 2000] nm");
    return { grainSizeUm: grainSizeUm, dislocationLog10: dislocationLog10, solutePct: solutePct, particleSpacingNm: particleSpacingNm };
  }

  function hallPetchIncrement(grainSizeM) {
    var d = finite(grainSizeM, "grain size");
    if (d <= 0) throw new RangeError("grain size must be positive");
    return HALL_PETCH_K_MPA_SQRT_M / Math.sqrt(d);
  }

  function taylorIncrement(dislocationDensityM2) {
    var density = finite(dislocationDensityM2, "dislocation density");
    if (density < 0) throw new RangeError("dislocation density cannot be negative");
    var shearModulusPa = SHEAR_MODULUS_GPA * 1e9;
    var burgersM = BURGERS_NM * 1e-9;
    return TAYLOR_M * TAYLOR_ALPHA * shearModulusPa * burgersM * Math.sqrt(density) / 1e6;
  }

  function solidSolutionIncrement(solutePct) {
    var concentration = finite(solutePct, "solute concentration");
    if (concentration < 0) throw new RangeError("solute concentration cannot be negative");
    return SOLUTE_COEFFICIENT * Math.sqrt(concentration);
  }

  function orowanIncrement(spacingM) {
    var spacing = finite(spacingM, "particle spacing");
    if (spacing <= 0) throw new RangeError("particle spacing must be positive");
    var shearModulusPa = SHEAR_MODULUS_GPA * 1e9;
    var burgersM = BURGERS_NM * 1e-9;
    return ORowan_FACTOR * TAYLOR_M * shearModulusPa * burgersM / spacing / 1e6;
  }

  function strengtheningLedger(input) {
    var config = normalizeConfig(input);
    var grainSizeM = config.grainSizeUm * 1e-6;
    var dislocationDensityM2 = Math.pow(10, config.dislocationLog10);
    var particleSpacingM = config.particleSpacingNm * 1e-9;
    var hallPetchMPa = hallPetchIncrement(grainSizeM);
    var taylorMPa = taylorIncrement(dislocationDensityM2);
    var solidSolutionMPa = solidSolutionIncrement(config.solutePct);
    var orowanMPa = orowanIncrement(particleSpacingM);
    var yieldStrengthMPa = SIGMA_0_MPA + hallPetchMPa + taylorMPa + solidSolutionMPa + orowanMPa;
    return {
      config: config,
      grainSizeM: grainSizeM,
      dislocationDensityM2: dislocationDensityM2,
      particleSpacingM: particleSpacingM,
      sigma0MPa: SIGMA_0_MPA,
      hallPetchMPa: hallPetchMPa,
      taylorMPa: taylorMPa,
      solidSolutionMPa: solidSolutionMPa,
      orowanMPa: orowanMPa,
      yieldStrengthMPa: yieldStrengthMPa,
      superposition: "linear additivity teaching ledger",
      closureResidualMPa: yieldStrengthMPa - (SIGMA_0_MPA + hallPetchMPa + taylorMPa + solidSolutionMPa + orowanMPa)
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
    var svg = svgElement(doc, "svg", { viewBox: "0 0 820 390", role: "img", "aria-label": "强化机制贡献和 Hall-Petch 曲线" });
    svg.appendChild(svgElement(doc, "title", {}, "Hall-Petch、Taylor、固溶和 Orowan 贡献账本"));
    svg.appendChild(svgElement(doc, "desc", {}, "左图比较线性叠加的强度贡献，右图显示晶粒尺寸减小时 Hall-Petch 项的上升。"));
    var left = { x: 48, y: 52, width: 340, height: 250 };
    var right = { x: 470, y: 52, width: 300, height: 250 };
    var contributions = [
      { label: "σ0", value: result.sigma0MPa, color: "#9b6a12" },
      { label: "HP", value: result.hallPetchMPa, color: "#2563a6" },
      { label: "Taylor", value: result.taylorMPa, color: "#b64335" },
      { label: "SS", value: result.solidSolutionMPa, color: "#39734d" },
      { label: "Orowan", value: result.orowanMPa, color: "#76539b" }
    ];
    var maxValue = Math.max(result.yieldStrengthMPa * 1.12, 100);
    function mapBarY(value) { return left.y + left.height - left.height * value / maxValue; }
    svg.appendChild(svgElement(doc, "rect", { x: left.x, y: left.y, width: left.width, height: left.height, fill: "none", stroke: "currentColor" }));
    var barWidth = 45;
    contributions.forEach(function (item, index) {
      var x = left.x + 20 + index * 62;
      var y = mapBarY(item.value);
      svg.appendChild(svgElement(doc, "rect", { x: x, y: y, width: barWidth, height: left.y + left.height - y, fill: item.color, opacity: ".82" }));
      svg.appendChild(svgElement(doc, "text", { x: x + barWidth / 2, y: left.y + left.height + 19, "font-size": 11, "text-anchor": "middle" }, item.label));
      svg.appendChild(svgElement(doc, "text", { x: x + barWidth / 2, y: Math.max(left.y + 12, y - 6), "font-size": 10, "text-anchor": "middle" }, format(item.value, 0)));
    });
    var maxHP = HALL_PETCH_K_MPA_SQRT_M / Math.sqrt(2e-6);
    function mapD(grainUm) { return right.x + right.width * (Math.log(grainUm) - Math.log(2)) / (Math.log(100) - Math.log(2)); }
    function mapS(value) { return right.y + right.height - right.height * value / maxHP; }
    svg.appendChild(svgElement(doc, "rect", { x: right.x, y: right.y, width: right.width, height: right.height, fill: "none", stroke: "currentColor" }));
    var hpPath = [];
    for (var index = 0; index <= 100; index += 1) {
      var grainUm = 2 * Math.pow(100 / 2, index / 100);
      var hp = hallPetchIncrement(grainUm * 1e-6);
      hpPath.push((index ? "L" : "M") + mapD(grainUm).toFixed(2) + " " + mapS(hp).toFixed(2));
    }
    svg.appendChild(svgElement(doc, "path", { d: hpPath.join(" "), fill: "none", stroke: "#2563a6", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "circle", { cx: mapD(result.config.grainSizeUm), cy: mapS(result.hallPetchMPa), r: 6, fill: "#b64335", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: left.x + 4, y: 30, "font-size": 14, "font-weight": 700 }, "左：线性叠加的 MPa 贡献"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + 4, y: 30, "font-size": 14, "font-weight": 700 }, "右：Hall-Petch 项"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + right.width, y: right.y + right.height + 28, "font-size": 12, "text-anchor": "end" }, "晶粒尺寸 d / μm（对数轴）"));
    svg.appendChild(svgElement(doc, "text", { x: right.x - 8, y: right.y + 12, "font-size": 12, transform: "rotate(-90 " + (right.x - 8) + " " + (right.y + 12) + ")" }, "Δσ_HP / MPa"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var rows = [
      ["基体 σ0", format(result.sigma0MPa, 0), "MPa"],
      ["Hall-Petch Δσ", format(result.hallPetchMPa, 2), "MPa；0.70 MPa√m / √d(m)"],
      ["Taylor Δσ", format(result.taylorMPa, 2), "MPa；MαGb√ρ"],
      ["固溶 Δσ", format(result.solidSolutionMPa, 2), "MPa；120√c(wt% proxy)"],
      ["Orowan Δσ", format(result.orowanMPa, 2), "MPa；0.40MGb/λ"],
      ["σy 教学总账", format(result.yieldStrengthMPa, 2), "MPa；σ0 + 各项，线性叠加"],
      ["闭合残差", format(result.closureResidualMPa, 3), "MPa；应为 0"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })]));
    });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "强化机制有量纲账本" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 公式" })])]),
      body
    ]));
  }

  function questionSpecs() {
    return [
      {
        key: "grain",
        prompt: "其他条件不变，把晶粒尺寸 d 减半时，Hall-Petch 项如何变化？",
        expected: "rise",
        choices: [{ value: "rise", label: "升高，按 d^-1/2" }, { value: "same", label: "不变" }, { value: "fall", label: "降低" }]
      },
      {
        key: "dislocation",
        prompt: "位错密度 ρ 增加 4 倍，Taylor 项的教学代理如何变化？",
        expected: "double",
        choices: [{ value: "double", label: "增加约 2 倍" }, { value: "four", label: "增加 4 倍" }, { value: "same", label: "不变" }]
      },
      {
        key: "particle",
        prompt: "硬质析出物间距 λ 变小且仍适用 Orowan 绕过时，Δσ_Orowan 如何变化？",
        expected: "rise",
        choices: [{ value: "rise", label: "升高，约按 1/λ" }, { value: "same", label: "不变" }, { value: "fall", label: "降低" }]
      }
    ];
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "ms-lab" });
    shell.appendChild(element(doc, "h3", { text: "强化实验：把晶界、位错、溶质和析出物放进同一张 MPa 账本" }));
    shell.appendChild(element(doc, "p", { className: "ms-note", text: "先预测三个标度关系；揭示后可继续调参。默认模型采用线性叠加，方便对账，不把它当作所有合金的本构定律。" }));
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
    function addRange(key, label, min, max, step, digits, special) {
      var output = element(doc, "output", { text: special ? special(state.config[key]) : format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = Number(input.value);
        state.feedback = state.revealed ? "参数已更新；强化账本仍保持揭示。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits, special: special };
      controls.appendChild(element(doc, "div", { className: "ms-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }
    addRange("grainSizeUm", "晶粒尺寸 d / μm", "2", "100", "1", 0);
    addRange("dislocationLog10", "log10 位错密度 ρ / m^-2", "11", "15", "1", 0, function (value) { return "10^" + format(value, 0); });
    addRange("solutePct", "固溶浓度 c / wt% 代理", "0", "4", "0.1", 1);
    addRange("particleSpacingNm", "析出物间距 λ / nm", "30", "250", "5", 0);
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
        state.feedback = "请先完成三项强化趋势预测；揭示前不显示 MPa 贡献账本。";
        render();
        return;
      }
      var result = strengtheningLedger(state.config);
      var correct = specs.filter(function (spec) {
        if (spec.key === "grain") return state.predictions[spec.key] === spec.expected;
        if (spec.key === "dislocation") return state.predictions[spec.key] === spec.expected;
        return state.predictions[spec.key] === spec.expected;
      }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。当前教学总账 σy = " + format(result.yieldStrengthMPa, 1) + " MPa。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      render();
      announce(api, rootNode, "强化预测和 MPa 账本已重置。");
    });

    function render() {
      var result = strengtheningLedger(state.config);
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = inputs[key].special ? inputs[key].special(state.config[key]) : format(state.config[key], inputs[key].digits);
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
        note.textContent = "揭示后显示 Hall-Petch、Taylor、固溶和 Orowan 四项贡献及线性闭合。";
        return;
      }
      chart.replaceChildren(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "模型边界：Hall-Petch、Taylor、固溶平方根和 Orowan 关系都需要材料、温度、组织尺度与机制区间的校准；这里把障碍视为独立并采用线性叠加 σy = σ0 + ΔσHP + ΔσTaylor + ΔσSS + ΔσOrowan。真实合金可能存在障碍相互作用、切过/绕过转换、反 Hall-Petch、回复和高温粗化。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200" && format(60, 0) === "60", "zero-decimal formatter preserves integer trailing zeros");
    var base = strengtheningLedger(DEFAULTS);
    check(base.yieldStrengthMPa > base.sigma0MPa, "default strengthening ledger adds positive obstacles");
    check(base.superposition.indexOf("linear") !== -1, "superposition rule is declared");
    check(near(base.closureResidualMPa, 0, 1e-12), "linear ledger closes exactly");
    check(hallPetchIncrement(4e-6) > hallPetchIncrement(16e-6), "smaller grains raise Hall-Petch term");
    check(near(taylorIncrement(4e14) / taylorIncrement(1e14), 2, 1e-12), "Taylor term follows square-root density");
    check(near(orowanIncrement(50e-9) / orowanIncrement(100e-9), 2, 1e-12), "Orowan term follows inverse spacing");
    check(solidSolutionIncrement(4) === 2 * solidSolutionIncrement(1), "solid-solution proxy follows square-root concentration");
    var threw = false;
    try { strengtheningLedger({ grainSizeUm: 0 }); } catch (error) { threw = true; }
    check(threw, "invalid grain size rejected");
    threw = false;
    try { orowanIncrement(0); } catch (error2) { threw = true; }
    check(threw, "zero particle spacing rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    hallPetchIncrement: hallPetchIncrement,
    taylorIncrement: taylorIncrement,
    solidSolutionIncrement: solidSolutionIncrement,
    orowanIncrement: orowanIncrement,
    strengtheningLedger: strengtheningLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});
