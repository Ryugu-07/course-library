(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-defect-vacancy", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "materials-defect-vacancy self-test: PASS (" +
          report.checks +
          " checks)"
      );
    } catch (error) {
      console.error("materials-defect-vacancy self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "materials-defect-vacancy-styles";
    var KB_EV_PER_K = 8.617333262145e-5;
    var EPS = 1e-12;
    var DEFAULTS = {
      formationEnergyEv: 1.00,
      annealTemperatureK: 1200,
      serviceTemperatureK: 300,
      siteLog10: 12,
      mode: "quench"
    };
    var MODE_LABELS = {
      quench: "理想瞬时冻结上界：保留退火态",
      equilibrate: "充分等温松弛：回到服务温度平衡"
    };
    var STYLE_TEXT = [
      '[data-learning-lab="materials-defect-vacancy"]{--md-blue:var(--cl-blue,#315f9d);--md-gold:var(--cl-gold,#9b6a12);--md-green:var(--cl-green,#39734d);--md-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="materials-defect-vacancy"] *{box-sizing:border-box}[data-learning-lab="materials-defect-vacancy"] [hidden]{display:none!important}',
      '[data-learning-lab="materials-defect-vacancy"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-defect-vacancy"] p{margin:8px 0}[data-learning-lab="materials-defect-vacancy"] .md-note,[data-learning-lab="materials-defect-vacancy"] .md-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="materials-defect-vacancy"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-defect-vacancy"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="materials-defect-vacancy"] .md-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-defect-vacancy"] button,[data-learning-lab="materials-defect-vacancy"] select,[data-learning-lab="materials-defect-vacancy"] input{font:inherit}',
      '[data-learning-lab="materials-defect-vacancy"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-defect-vacancy"] button:hover{border-color:var(--md-blue)}[data-learning-lab="materials-defect-vacancy"] button[aria-pressed="true"],[data-learning-lab="materials-defect-vacancy"] .md-primary{border-color:var(--md-blue);background:var(--md-blue);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="materials-defect-vacancy"] button:focus-visible,[data-learning-lab="materials-defect-vacancy"] select:focus-visible,[data-learning-lab="materials-defect-vacancy"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-defect-vacancy"] .md-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-defect-vacancy"] .md-actions>*{flex:1 1 170px}[data-learning-lab="materials-defect-vacancy"] .md-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-defect-vacancy"] .md-pass{color:var(--md-green)}[data-learning-lab="materials-defect-vacancy"] .md-warn{color:var(--md-red)}',
      '[data-learning-lab="materials-defect-vacancy"] .md-layout{display:grid;grid-template-columns:minmax(215px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="materials-defect-vacancy"] .md-controls,[data-learning-lab="materials-defect-vacancy"] .md-stage{min-width:0}[data-learning-lab="materials-defect-vacancy"] .md-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-defect-vacancy"] .md-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-defect-vacancy"] .md-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="materials-defect-vacancy"] .md-control output{color:var(--md-blue);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="materials-defect-vacancy"] input[type="range"],[data-learning-lab="materials-defect-vacancy"] select{display:block;width:100%;min-height:44px;accent-color:var(--md-blue)}[data-learning-lab="materials-defect-vacancy"] select{padding:7px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor)}[data-learning-lab="materials-defect-vacancy"] .md-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="materials-defect-vacancy"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="materials-defect-vacancy"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="materials-defect-vacancy"] .md-site{fill:var(--md-blue);fill-opacity:.2;stroke:var(--md-blue);stroke-width:1.2}[data-learning-lab="materials-defect-vacancy"] .md-vacancy{fill:var(--md-red);stroke:var(--bg,#fff);stroke-width:2}[data-learning-lab="materials-defect-vacancy"] .md-boundary{stroke:var(--md-gold);stroke-width:2;stroke-dasharray:5 4;fill:none}[data-learning-lab="materials-defect-vacancy"] .md-label{font-size:11px}[data-learning-lab="materials-defect-vacancy"] .md-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="materials-defect-vacancy"] .md-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:12px}[data-learning-lab="materials-defect-vacancy"] .md-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="materials-defect-vacancy"] .md-metric:nth-child(3n+1){border-color:var(--md-blue)}[data-learning-lab="materials-defect-vacancy"] .md-metric:nth-child(3n+2){border-color:var(--md-gold)}[data-learning-lab="materials-defect-vacancy"] .md-metric:nth-child(3n){border-color:var(--md-green)}[data-learning-lab="materials-defect-vacancy"] .md-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="materials-defect-vacancy"] .md-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="materials-defect-vacancy"] .md-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}[data-learning-lab="materials-defect-vacancy"] table{width:100%;min-width:540px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-defect-vacancy"] th,[data-learning-lab="materials-defect-vacancy"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-defect-vacancy"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-defect-vacancy"] .md-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--md-gold);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="materials-defect-vacancy"] .md-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="materials-defect-vacancy"] .md-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="materials-defect-vacancy"] .md-stage-frame{padding:4px}[data-learning-lab="materials-defect-vacancy"] table{font-size:11px}[data-learning-lab="materials-defect-vacancy"] th,[data-learning-lab="materials-defect-vacancy"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-defect-vacancy"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
      var copy = {};
      Object.keys(DEFAULTS).forEach(function (key) { copy[key] = DEFAULTS[key]; });
      return copy;
    }

    function normalizeConfig(input) {
      var source = input || {};
      var formationEnergyEv = finite(source.formationEnergyEv === undefined ? DEFAULTS.formationEnergyEv : source.formationEnergyEv, "Qv");
      var annealTemperatureK = finite(source.annealTemperatureK === undefined ? DEFAULTS.annealTemperatureK : source.annealTemperatureK, "anneal temperature");
      var serviceTemperatureK = finite(source.serviceTemperatureK === undefined ? DEFAULTS.serviceTemperatureK : source.serviceTemperatureK, "service temperature");
      var siteLog10 = finite(source.siteLog10 === undefined ? DEFAULTS.siteLog10 : source.siteLog10, "site-count exponent");
      var mode = source.mode === undefined ? DEFAULTS.mode : String(source.mode);
      if (formationEnergyEv < 0 || formationEnergyEv > 10) throw new RangeError("Qv must be in [0, 10] eV");
      if (annealTemperatureK < 0 || annealTemperatureK > 5000) throw new RangeError("anneal temperature must be in [0, 5000] K");
      if (serviceTemperatureK < 0 || serviceTemperatureK > 5000) throw new RangeError("service temperature must be in [0, 5000] K");
      if (siteLog10 < 0 || siteLog10 > 30) throw new RangeError("site-count exponent must be in [0, 30]");
      if (!MODE_LABELS[mode]) throw new RangeError("unknown vacancy history mode");
      return { formationEnergyEv: formationEnergyEv, annealTemperatureK: annealTemperatureK, serviceTemperatureK: serviceTemperatureK, siteLog10: siteLog10, mode: mode };
    }

    function siteCountFromLog10(siteLog10) {
      var exponent = finite(siteLog10, "site-count exponent");
      if (exponent < 0 || exponent > 30) throw new RangeError("site-count exponent must be in [0, 30]");
      return Math.pow(10, exponent);
    }

    function equilibriumVacancyFraction(formationEnergyEv, temperatureK) {
      var energy = finite(formationEnergyEv, "Qv");
      var temperature = finite(temperatureK, "temperature");
      if (energy < 0 || temperature < 0) throw new RangeError("Qv and temperature cannot be negative");
      if (temperature === 0) {
        if (energy === 0) throw new RangeError("T=0 and Qv=0 is indeterminate in this toy expression");
        return 0;
      }
      return Math.exp(-energy / (KB_EV_PER_K * temperature));
    }

    function vacancyLedger(formationEnergyEv, temperatureK, sites) {
      var energy = finite(formationEnergyEv, "Qv");
      var temperature = finite(temperatureK, "temperature");
      var count = finite(sites, "sites");
      if (energy < 0 || temperature < 0 || count <= 0) throw new RangeError("Qv/T/sites outside physical input boundary");
      var fraction = equilibriumVacancyFraction(energy, temperature);
      return {
        formationEnergyEv: energy,
        temperatureK: temperature,
        sites: count,
        kBT_eV: KB_EV_PER_K * temperature,
        fraction: fraction,
        fractionPpm: fraction * 1e6,
        expectedCount: count * fraction,
        prefactor: 1,
        formula: "x_v = A_v exp(-Q_v/(k_B T)), A_v=1 dilute teaching form"
      };
    }

    function historyLedger(input) {
      var config = normalizeConfig(input);
      var sites = siteCountFromLog10(config.siteLog10);
      var anneal = vacancyLedger(config.formationEnergyEv, config.annealTemperatureK, sites);
      var service = vacancyLedger(config.formationEnergyEv, config.serviceTemperatureK, sites);
      var retained = config.mode === "quench" ? anneal : service;
      return {
        config: config,
        sites: sites,
        anneal: anneal,
        service: service,
        retained: retained,
        supersaturationRatio: service.fraction === 0 ? Infinity : retained.fraction / service.fraction,
        modeLabel: MODE_LABELS[config.mode]
      };
    }

    function deterministicUnit(index) {
      var value = Math.sin((index + 1) * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    }

    function vacancySketch(fraction, columns, rows) {
      var p = finite(fraction, "vacancy fraction");
      var width = Math.round(finite(columns, "columns"));
      var height = Math.round(finite(rows, "rows"));
      if (p < 0 || p > 1 || width <= 0 || height <= 0) throw new RangeError("sketch inputs outside [0, 1] or positive grid boundary");
      var sites = [];
      for (var row = 0; row < height; row += 1) {
        for (var column = 0; column < width; column += 1) {
          var index = row * width + column;
          sites.push({ column: column, row: row, vacant: deterministicUnit(index) < p });
        }
      }
      return sites;
    }

    function evaluate(input) {
      return historyLedger(input);
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

    function renderSvg(doc, svg, result) {
      clear(svg);
      var columns = 12;
      var rows = 8;
      var left = 35;
      var top = 42;
      var gapX = 43;
      var gapY = 30;
      var sketch = vacancySketch(result.retained.fraction, columns, rows);
      svg.appendChild(svgElement(doc, "title", {}, "原子位点与空位示意"));
      svg.appendChild(svgElement(doc, "desc", {}, "蓝色圆点是晶格位点，红色圆点是按真实空位分数确定性抽样出的空位；九十六个位点只是放大示意，数量以右侧账本为准。"));
      svg.appendChild(svgElement(doc, "line", { x1: left - 15, y1: top - 18, x2: left + (columns - 1) * gapX + 15, y2: top - 18, class: "md-boundary" }));
      sketch.forEach(function (site) {
        var x = left + site.column * gapX;
        var y = top + site.row * gapY;
        svg.appendChild(svgElement(doc, "circle", { cx: x, cy: y, r: site.vacant ? 7 : 5, class: site.vacant ? "md-vacancy" : "md-site" }));
      });
      svg.appendChild(svgElement(doc, "text", { x: left, y: top + rows * gapY + 28, class: "md-label" }, "红色：空位；蓝色：占位"));
      svg.appendChild(svgElement(doc, "text", { x: 645, y: top - 25, "text-anchor": "end", class: "md-small" }, "淬火冻结的高温位点态"));
      if (!sketch.some(function (site) { return site.vacant; })) {
        svg.appendChild(svgElement(doc, "text", { x: 645, y: top + rows * gapY + 28, "text-anchor": "end", class: "md-small" }, "此 96 位点窗口没有抽到空位；不是把指数小数四舍五入成零"));
      }
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "md-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
    }

    function renderTable(doc, hostNode, result) {
      var rows = [
        ["Qv", format(result.config.formationEnergyEv, 3), "eV；与 kB 使用同一能量单位"],
        ["kB Tanneal", format(result.anneal.kBT_eV, 4), "eV"],
        ["xv,eq(Tanneal)", format(result.anneal.fraction, 5), "无量纲平衡分数"],
        ["N · xv,eq(Tanneal)", format(result.anneal.expectedCount, 5), "期望空位数；不是必然整数"],
        ["xv,eq(Tservice)", format(result.service.fraction, 5), "服务温度若充分平衡"],
        ["保留态空位数", format(result.retained.expectedCount, 5), result.modeLabel],
        ["保留/服务平衡", format(result.supersaturationRatio, 4), "倍；仅对本点缺陷模型"]
      ];
      var body = element(doc, "tbody");
      rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "空位形成能与历史路径透明账本" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "数值" }), element(doc, "th", { text: "单位 / 解释" })])]),
        body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "units",
          prompt: "在 xv = exp(−Qv/(kBT)) 中，若 Qv 用 eV，kB 应用什么单位？",
          expected: "ev",
          choices: [{ value: "ev", label: "eV/K" }, { value: "joule", label: "J/K 但不换算" }, { value: "none", label: "无单位" }]
        },
        {
          key: "temperature",
          prompt: "固定 Qv 时，把温度升高，平衡空位分数会怎样？",
          expected: "rise",
          choices: [{ value: "rise", label: "指数升高" }, { value: "same", label: "不变" }, { value: "fall", label: "指数降低" }]
        },
        {
          key: "quench",
          prompt: "从高温快速淬到低温，短时间内最合理的空位账本是？",
          expected: "retain",
          choices: [{ value: "retain", label: "保留高温过饱和态" }, { value: "service", label: "瞬间变成低温平衡" }, { value: "zero", label: "全部消失" }]
        }
      ];
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      installStyles(doc);
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      var shell = element(doc, "div", { className: "md-lab" });
      shell.appendChild(element(doc, "h3", { text: "缺陷实验：把空位分数、期望计数和淬火历史放在一张账本上" }));
      shell.appendChild(element(doc, "p", { className: "md-note", text: "先判断单位、温度趋势和淬火边界；揭示后再改变形成能、退火温度、服务温度与位点规模。" }));
      var predictionHost = element(doc, "div");
      var predictionGroups = [];
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "md-choice-grid" });
        var group = { key: spec.key, buttons: [] };
        spec.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
          button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); });
          group.buttons.push({ node: button, value: choice.value, label: choice.label }); grid.appendChild(button);
        });
        predictionGroups.push(group); fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
      });
      var actions = element(doc, "div", { className: "md-actions" });
      var reveal = element(doc, "button", { type: "button", className: "md-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal); actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "md-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controls = element(doc, "div", { className: "md-controls" });
      var inputs = {};
      function rangeControl(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
        var output = element(doc, "output", { text: format(state.config[key], digits) });
        inputs[key] = { input: input, output: output, digits: digits };
        controls.appendChild(element(doc, "div", { className: "md-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
      }
      rangeControl("formationEnergyEv", "空位形成能 Qv / eV", "0.20", "2.00", "0.05", 2);
      rangeControl("annealTemperatureK", "退火温度 / K", "400", "1800", "25", 0);
      rangeControl("serviceTemperatureK", "服务温度 / K", "250", "1000", "25", 0);
      rangeControl("siteLog10", "位点规模 log₁₀N", "3", "24", "1", 0);
      var modeSelect = element(doc, "select", { "aria-label": "热历史" });
      Object.keys(MODE_LABELS).forEach(function (key) { modeSelect.appendChild(element(doc, "option", { value: key, text: MODE_LABELS[key] })); });
      controls.appendChild(element(doc, "div", { className: "md-control" }, [element(doc, "label", { text: "热历史" }), modeSelect]));
      var svg = svgElement(doc, "svg", { viewBox: "0 0 680 340", role: "img", "aria-label": "空位晶格示意" });
      var stage = element(doc, "div", { className: "md-stage" }, [element(doc, "div", { className: "md-stage-frame" }, [svg])]);
      var metricsHost = element(doc, "div", { className: "md-metrics" });
      var tableHost = element(doc, "div", { className: "md-table-wrap" });
      var certificate = element(doc, "p", { className: "md-certificate" });
      stage.appendChild(metricsHost); stage.appendChild(tableHost); stage.appendChild(certificate);
      resultShell.appendChild(element(doc, "div", { className: "md-layout" }, [controls, stage]));
      shell.appendChild(predictionHost); shell.appendChild(actions); shell.appendChild(feedback); shell.appendChild(resultShell);
      clear(rootNode); rootNode.appendChild(shell);
      Object.keys(inputs).forEach(function (key) { inputs[key].input.addEventListener("input", function () { state.config[key] = Number(inputs[key].input.value); state.feedback = ""; render(); }); });
      modeSelect.addEventListener("change", function () { state.config.mode = modeSelect.value; state.feedback = ""; render(); });
      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项空位预测；揭示后才显示温度账本和原子示意。"; render(); return; }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。切换淬火与等温松弛，观察历史路径留下的差异。"; render(); announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () { state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" }; render(); announce(api, rootNode, "空位预测和热历史账本已重置。"); });

      function render() {
        var result = evaluate(state.config);
        Object.keys(inputs).forEach(function (key) { inputs[key].input.value = String(state.config[key]); inputs[key].output.textContent = format(state.config[key], inputs[key].digits); });
        modeSelect.value = state.config.mode;
        predictionGroups.forEach(function (group) {
          var spec = questionSpecs().filter(function (item) { return item.key === group.key; })[0];
          group.buttons.forEach(function (button) {
            var selected = state.predictions[group.key] === button.value;
            button.node.setAttribute("aria-pressed", selected ? "true" : "false");
            button.node.textContent = state.revealed && button.value === spec.expected ? "✓ " + button.label : button.label;
            button.node.className = state.revealed && button.value === spec.expected ? "md-pass" : state.revealed && selected ? "md-warn" : "";
          });
        });
        feedback.textContent = state.feedback;
        feedback.className = "md-feedback" + (state.feedback.indexOf("请先") === 0 ? " md-warn" : "");
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        renderSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "位点规模", "10^" + result.config.siteLog10));
        metricsHost.appendChild(metric(doc, "高温平衡分数", format(result.anneal.fraction, 4)));
        metricsHost.appendChild(metric(doc, "保留空位数", format(result.retained.expectedCount, 4)));
        metricsHost.appendChild(metric(doc, "服务平衡比", format(result.supersaturationRatio, 3) + "×"));
        renderTable(doc, tableHost, result);
        certificate.textContent = "边界说明：这里的 exp(−Qv/kBT) 是稀释、单位前因子 Av=1 的教学形式；完整平衡浓度还可含形成熵/简并度前因子。淬火分支是理想瞬时冻结上界，真实保留量会受冷却中扩散到汇的影响。位错是线缺陷、晶界是界面，不能套同一条指数式。";
      }
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      check(format(1350, 0) === "1350" && format(60, 0) === "60", "zero-decimal formatter preserves trailing integer zeros");
      var low = vacancyLedger(1, 300, 1e12);
      var high = vacancyLedger(1, 1200, 1e12);
      check(low.fraction < high.fraction, "temperature raises equilibrium fraction");
      check(near(low.expectedCount, low.sites * low.fraction, 1e-12), "expected count is N times fraction");
      check(vacancyLedger(0, 300, 10).fraction === 1, "zero formation energy boundary");
      check(vacancyLedger(1, 0, 10).fraction === 0, "positive-Q zero-temperature limit");
      var history = historyLedger(DEFAULTS);
      check(history.retained.expectedCount === history.anneal.expectedCount, "quench retains anneal state");
      check(history.anneal.fraction > history.service.fraction, "hot equilibrium exceeds cold equilibrium");
      check(history.supersaturationRatio > 1, "quench creates supersaturation in this case");
      var sketchA = vacancySketch(0.2, 12, 8);
      var sketchB = vacancySketch(0.2, 12, 8);
      check(JSON.stringify(sketchA) === JSON.stringify(sketchB), "visual sampling is deterministic");
      var threw = false;
      try { vacancyLedger(-1, 300, 10); } catch (error) { threw = true; }
      check(threw, "negative formation energy rejected");
      threw = false;
      try { vacancySketch(1.1, 12, 8); } catch (error2) { threw = true; }
      check(threw, "fraction above one rejected");
      threw = false;
      try { equilibriumVacancyFraction(0, 0); } catch (error3) { threw = true; }
      check(threw, "T=0 and Qv=0 indeterminate corner rejected");
      return { checks: checks };
    }

    return {
      DEFAULTS: copyDefaults(),
      KB_EV_PER_K: KB_EV_PER_K,
      equilibriumVacancyFraction: equilibriumVacancyFraction,
      vacancyLedger: vacancyLedger,
      historyLedger: historyLedger,
      vacancySketch: vacancySketch,
      format: format,
      mount: mount,
      selfTest: selfTest
    };
  }
);
