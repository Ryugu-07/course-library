(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-beam-torsion", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-beam-torsion self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-beam-torsion self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var LAB_ID = "mech-beam-torsion";
  var STYLE_ID = "cl-mech-beam-torsion-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var DEFAULTS = {
    P: 1200,
    L: 1.2,
    E: 210e9,
    b: 0.04,
    h: 0.08,
    T: 180,
    d: 0.04,
    G: 80e9
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    var scale = Math.max(1, Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
  }

  function finiteNumber(value, name) {
    var number = Number(value);
    if (!isFinite(number)) throw new Error(name + " must be finite");
    return number;
  }

  function positive(value, name) {
    var number = finiteNumber(value, name);
    if (!(number > 0)) throw new Error(name + " must be positive");
    return number;
  }

  function beamConfig(config) {
    config = config || {};
    return {
      P: positive(config.P === undefined ? DEFAULTS.P : config.P, "P"),
      L: positive(config.L === undefined ? DEFAULTS.L : config.L, "L"),
      E: positive(config.E === undefined ? DEFAULTS.E : config.E, "E"),
      b: positive(config.b === undefined ? DEFAULTS.b : config.b, "b"),
      h: positive(config.h === undefined ? DEFAULTS.h : config.h, "h")
    };
  }

  function torsionConfig(config) {
    config = config || {};
    return {
      T: positive(config.T === undefined ? DEFAULTS.T : config.T, "T"),
      L: positive(config.L === undefined ? DEFAULTS.L : config.L, "L"),
      G: positive(config.G === undefined ? DEFAULTS.G : config.G, "G"),
      d: positive(config.d === undefined ? DEFAULTS.d : config.d, "d")
    };
  }

  function computeBeam(config, sampleCount) {
    var c = beamConfig(config);
    var count = Math.max(2, Math.floor(sampleCount === undefined ? 16 : sampleCount));
    var I = c.b * Math.pow(c.h, 3) / 12;
    var rows = [];
    for (var index = 0; index <= count; index += 1) {
      var x = c.L * index / count;
      rows.push({
        x: x,
        V: c.P,
        M: c.P * (c.L - x),
        w: c.P * x * x * (3 * c.L - x) / (6 * c.E * I)
      });
    }
    return {
      config: c,
      I: I,
      rows: rows,
      shearAtSupport: c.P,
      momentAtSupport: c.P * c.L,
      endDeflection: c.P * Math.pow(c.L, 3) / (3 * c.E * I),
      bendingStressAtSupport: c.P * c.L * (c.h / 2) / I
    };
  }

  function computeTorsion(config) {
    var c = torsionConfig(config);
    var J = Math.PI * Math.pow(c.d, 4) / 32;
    var radius = c.d / 2;
    return {
      config: c,
      J: J,
      radius: radius,
      tauMax: c.T * radius / J,
      theta: c.T * c.L / (c.G * J),
      thetaDeg: c.T * c.L / (c.G * J) * 180 / Math.PI
    };
  }

  function computeBeamTorsion(config, sampleCount) {
    config = config || {};
    return {
      beam: computeBeam(config, sampleCount),
      torsion: computeTorsion(config)
    };
  }

  function formatNumber(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (places === 0) return value.toFixed(0);
    if (value !== 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    if (Math.abs(value) >= 10000) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] === undefined || attrs[key] === null) return;
      if (key === "text") node.textContent = String(attrs[key]);
      else if (key === "className") node.setAttribute("class", attrs[key]);
      else if (key === "htmlFor") node.setAttribute("for", attrs[key]);
      else node.setAttribute(key, String(attrs[key]));
    });
    (children || []).forEach(function (child) {
      if (child !== null && child !== undefined) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  function svgText(doc, text, x, y, className) {
    return svgElement(doc, "text", { x: x, y: y, "class": className || "mbt-svg-label" });
  }

  function appendSvgText(doc, parent, text, x, y, className) {
    var node = svgText(doc, text, x, y, className);
    node.textContent = text;
    parent.appendChild(node);
  }

  function drawSvg(doc, svg, result) {
    clear(svg);
    var width = 680;
    var height = 350;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "悬臂梁挠度与弯矩图");
    var x0 = 62;
    var x1 = 630;
    var topY = 92;
    var bottomY = 245;
    var end = result.beam.endDeflection;
    var maxMoment = result.beam.momentAtSupport;
    var defScale = end > EPS ? 64 / end : 0;
    var momentScale = maxMoment > EPS ? 70 / maxMoment : 0;
    var axis = { stroke: "currentColor", "stroke-width": 1.2, opacity: 0.68 };
    svg.appendChild(svgElement(doc, "line", { x1: x0, y1: topY, x2: x1, y2: topY, stroke: "currentColor", "stroke-width": 4, opacity: 0.55 }));
    svg.appendChild(svgElement(doc, "line", { x1: x0 - 10, y1: 42, x2: x0 - 10, y2: 135, stroke: "currentColor", "stroke-width": 4 }));
    for (var hatch = 0; hatch < 7; hatch += 1) {
      svg.appendChild(svgElement(doc, "line", { x1: x0 - 23 + hatch * 4, y1: 42, x2: x0 - 3 + hatch * 4, y2: 22, stroke: "currentColor", "stroke-width": 1, opacity: 0.65 }));
    }
    var forceArrow = svgElement(doc, "path", { d: "M" + x1 + " 34 L" + x1 + " 84 M" + x1 + " 84 L" + (x1 - 8) + " 69 M" + x1 + " 84 L" + (x1 + 8) + " 69", fill: "none", stroke: "var(--mbt-orange)", "stroke-width": 2.5 });
    svg.appendChild(forceArrow);
    appendSvgText(doc, svg, "P", x1 + 12, 40, "mbt-svg-orange");
    var defPath = result.beam.rows.map(function (row, index) {
      var x = x0 + (x1 - x0) * row.x / result.beam.config.L;
      var y = topY + row.w * defScale;
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: defPath, fill: "none", stroke: "var(--mbt-blue)", "stroke-width": 3 }));
    appendSvgText(doc, svg, "挠度 w(x)", x0 + 14, 54, "mbt-svg-blue");
    svg.appendChild(svgElement(doc, "line", { x1: x0, y1: bottomY, x2: x1, y2: bottomY, stroke: axis.stroke, "stroke-width": axis["stroke-width"], opacity: axis.opacity }));
    var momentPath = result.beam.rows.map(function (row, index) {
      var x = x0 + (x1 - x0) * row.x / result.beam.config.L;
      var y = bottomY - row.M * momentScale;
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: momentPath, fill: "none", stroke: "var(--mbt-orange)", "stroke-width": 3 }));
    appendSvgText(doc, svg, "弯矩 M(x)", x0 + 14, 183, "mbt-svg-orange");
    appendSvgText(doc, svg, "x=0", x0 - 14, 318);
    appendSvgText(doc, svg, "x=L", x1 - 14, 318);
    appendSvgText(doc, svg, "V=P，M=P(L-x)", 250, 338, "mbt-svg-muted");
    appendSvgText(doc, svg, "图中挠度按端点归一化显示", 420, 54, "mbt-svg-muted");
  }

  function renderTable(doc, hostNode, headings, rows, className) {
    clear(hostNode);
    var table = element(doc, "table", { className: className || "mbt-table" });
    var thead = element(doc, "thead", {});
    var headRow = element(doc, "tr", {});
    headings.forEach(function (heading) { headRow.appendChild(element(doc, "th", { scope: "col", text: heading })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = element(doc, "tbody", {});
    rows.forEach(function (row) {
      var tr = element(doc, "tr", {});
      row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    hostNode.appendChild(table);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "mbt-metric" }, [
      element(doc, "span", { text: label }),
      element(doc, "strong", { text: value })
    ]);
  }

  function injectStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--mbt-blue:#1d4ed8;--mbt-orange:#b45309;--mbt-good:#18734a;--mbt-warn:#a33b2f;color:var(--fg,inherit);max-width:100%;min-width:0;line-height:1.55}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}' +
      '[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-note,[data-learning-lab="' + LAB_ID + '"] .mbt-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.65}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-prediction{padding:12px 14px;border-left:4px solid var(--mbt-orange);background:var(--block-bg,transparent)}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{border:1px solid var(--border,currentColor);border-radius:6px;margin:12px 0;padding:10px 12px}' +
      '[data-learning-lab="' + LAB_ID + '"] legend{padding:0 4px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-options{display:grid;gap:6px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--mbt-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{min-height:44px;font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=number],[data-learning-lab="' + LAB_ID + '"] select{width:100%;padding:7px 9px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
      '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 13px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--mbt-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-primary{background:var(--mbt-blue);border-color:var(--mbt-blue);color:#fff}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-control{display:grid;gap:5px;min-width:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-control label{font-weight:700;font-size:13px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-control small{color:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-error{min-height:1.6em;color:var(--mbt-warn);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:16px;align-items:start}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-chart{min-width:0;border:1px solid var(--border,currentColor);border-radius:6px;padding:7px;background:var(--bg,Canvas)}' +
      '[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;aspect-ratio:680/350;color:var(--fg,inherit)}' +
      '[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mbt-svg-blue{fill:var(--mbt-blue);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mbt-svg-orange{fill:var(--mbt-orange);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mbt-svg-muted{fill:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-metric{min-width:0;padding:9px;border-top:3px solid var(--mbt-blue);background:var(--bg,Canvas)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-table-wrap{max-width:100%;overflow-x:auto}' +
      '[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:430px;border-collapse:collapse;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top}' +
      '[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mbt-good{color:var(--mbt-good)}' +
      'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--mbt-blue:#7aa7ff;--mbt-orange:#f0b15a;--mbt-good:#79d39a;--mbt-warn:#ff9f91}' +
      '@media(max-width:760px){[data-learning-lab="' + LAB_ID + '"] .mbt-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mbt-grid{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mbt-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
      '@media(max-width:390px){[data-learning-lab="' + LAB_ID + '"] .mbt-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mbt-actions>*{width:100%}[data-learning-lab="' + LAB_ID + '"] .mbt-metrics{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mbt-prediction{padding:10px}}' +
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function predictionQuestion(doc, uid, question, name, choices) {
    var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: question })]);
    var options = element(doc, "div", { className: "mbt-options" });
    choices.forEach(function (choice) {
      var inputId = uid + "-" + name + "-" + choice.value;
      var input = element(doc, "input", { type: "radio", id: inputId, name: uid + "-" + name, value: choice.value });
      var label = element(doc, "label", { htmlFor: inputId }, [input, element(doc, "span", { text: choice.label })]);
      options.appendChild(label);
    });
    fieldset.appendChild(options);
    return fieldset;
  }

  function selected(form, name) {
    var input = form.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : "";
  }

  function inputControl(doc, uid, key, label, value, min, max, step, unit) {
    var id = uid + "-" + key;
    var input = element(doc, "input", { id: id, type: "number", min: min, max: max, step: step, value: value, "data-key": key });
    return { key: key, input: input, node: element(doc, "div", { className: "mbt-control" }, [
      element(doc, "label", { htmlFor: id, text: label }),
      input,
      element(doc, "small", { text: unit })
    ]) };
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    injectStyles(doc);
    INSTANCE += 1;
    var uid = LAB_ID + "-" + INSTANCE;
    var state = { revealed: false, predictions: {} };
    clear(root);
    root.setAttribute("aria-labelledby", uid + "-heading");

    var heading = element(doc, "h3", { id: uid + "-heading", text: "悬臂梁与圆轴的量纲账本" });
    var intro = element(doc, "p", { className: "mbt-note", text: "先完成三项预测。揭示后可改动参数；梁模型与扭转模型会分别重算，避免把 V/M/w 与 tau/theta 混在同一行。" });
    var predictionForm = element(doc, "form", { className: "mbt-prediction" });
    predictionForm.appendChild(predictionQuestion(doc, uid, "悬臂梁自由端受集中力时，沿梁的剪力 V(x) 如何变化？", "shear", [
      { value: "constant", label: "保持常值，弯矩随 x 线性下降" },
      { value: "linear", label: "随 x 线性下降，弯矩保持常值" },
      { value: "zero", label: "整根梁都为零" }
    ]));
    predictionForm.appendChild(predictionQuestion(doc, uid, "矩形梁高 h 加倍、其他量不变，端部挠度约变为多少？", "height", [
      { value: "eight", label: "变为 1/8，因为 I=bh^3/12" },
      { value: "four", label: "变为 1/4，因为强度只含 h^2" },
      { value: "same", label: "不变，挠度只由载荷决定" }
    ]));
    predictionForm.appendChild(predictionQuestion(doc, uid, "圆轴扭转的两个量怎样配对？", "units", [
      { value: "paired", label: "tau=Tr/J 是 Pa；theta=TL/(GJ) 是 rad（无量纲）" },
      { value: "swap", label: "tau 是 rad；theta 是 Pa" },
      { value: "both", label: "两者都是 N/m" }
    ]));
    var feedback = element(doc, "p", { className: "mbt-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
    var actions = element(doc, "div", { className: "mbt-actions" }, [
      element(doc, "button", { type: "submit", className: "mbt-primary", text: "提交预测并揭示" }),
      element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
    ]);
    predictionForm.appendChild(actions);
    predictionForm.appendChild(feedback);
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(predictionForm);

    var bench = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "mbt-controls" });
    var fields = [
      inputControl(doc, uid, "P", "端部力 P", 1.2, 0.001, 1000000, 0.1, "kN"),
      inputControl(doc, uid, "L", "梁长 L", 1.2, 0.1, 10, 0.1, "m"),
      inputControl(doc, uid, "E", "弹性模量 E", 210, 1, 400, 1, "GPa"),
      inputControl(doc, uid, "b", "截面宽 b", 40, 1, 500, 1, "mm"),
      inputControl(doc, uid, "h", "截面高 h", 80, 1, 500, 1, "mm"),
      inputControl(doc, uid, "T", "扭矩 T", 180, 0.1, 1000000, 1, "N m"),
      inputControl(doc, uid, "d", "圆轴直径 d", 40, 1, 500, 1, "mm"),
      inputControl(doc, uid, "G", "剪切模量 G", 80, 1, 200, 1, "GPa")
    ];
    fields.forEach(function (field) { controls.appendChild(field.node); });
    bench.appendChild(controls);
    var error = element(doc, "p", { className: "mbt-error", role: "alert", "aria-live": "polite" });
    bench.appendChild(error);
    var grid = element(doc, "div", { className: "mbt-grid" });
    var chart = element(doc, "div", { className: "mbt-chart" });
    var svg = svgElement(doc, "svg", {});
    chart.appendChild(svg);
    var ledger = element(doc, "div", { className: "mbt-table-wrap" });
    grid.appendChild(chart);
    grid.appendChild(ledger);
    bench.appendChild(grid);
    var metrics = element(doc, "div", { className: "mbt-metrics" });
    bench.appendChild(metrics);
    var samples = element(doc, "div", { className: "mbt-table-wrap" });
    bench.appendChild(element(doc, "h4", { text: "离散采样与平衡检查" }));
    bench.appendChild(samples);
    root.appendChild(bench);

    function uiConfig() {
      var raw = {};
      fields.forEach(function (field) { raw[field.key] = field.input.value.trim(); });
      var values = {};
      fields.forEach(function (field) {
        if (raw[field.key] === "") throw new Error(field.key + " 不能为空");
        var value = Number(raw[field.key]);
        if (!isFinite(value)) throw new Error(field.key + " 必须是有限数字");
        var min = Number(field.input.getAttribute("min"));
        var max = Number(field.input.getAttribute("max"));
        if (value < min || value > max) throw new Error(field.key + " 超出允许范围");
        values[field.key] = value;
      });
      return {
        P: values.P * 1000,
        L: values.L,
        E: values.E * 1e9,
        b: values.b / 1000,
        h: values.h / 1000,
        T: values.T,
        d: values.d / 1000,
        G: values.G * 1e9
      };
    }

    function renderBench() {
      if (!state.revealed) return;
      try {
        var result = computeBeamTorsion(uiConfig(), 16);
        error.textContent = "";
        drawSvg(doc, svg, result);
        clear(metrics);
        metrics.appendChild(metric(doc, "端部挠度 w(L)", formatNumber(result.beam.endDeflection * 1000, 3) + " mm"));
        metrics.appendChild(metric(doc, "支座弯矩 M(0)", formatNumber(result.beam.momentAtSupport, 2) + " N m"));
        metrics.appendChild(metric(doc, "最大剪应力 tau", formatNumber(result.torsion.tauMax / 1e6, 3) + " MPa"));
        metrics.appendChild(metric(doc, "扭转角 theta", formatNumber(result.torsion.theta * 1000, 3) + " mrad"));
        renderTable(doc, ledger, ["账本项", "公式/读数", "单位"], [
          ["I（矩形截面）", formatNumber(result.beam.I * 1e8, 4) + " x10^-8", "m^4"],
          ["J（实心圆轴）", formatNumber(result.torsion.J * 1e8, 4) + " x10^-8", "m^4"],
          ["V(x)", "P = " + formatNumber(result.beam.shearAtSupport, 2), "N，沿 x 常值"],
          ["M(0)", "P L = " + formatNumber(result.beam.momentAtSupport, 2), "N m"],
          ["w(L)", "P L^3/(3 E I) = " + formatNumber(result.beam.endDeflection, 6), "m"],
          ["tau_max", "T(d/2)/J = " + formatNumber(result.torsion.tauMax, 2), "Pa"],
          ["theta", "T L/(G J) = " + formatNumber(result.torsion.theta, 8), "rad"]
        ]);
        var sampleRows = [0, 0.5, 1].map(function (fraction) {
          var row = result.beam.rows[Math.round(fraction * (result.beam.rows.length - 1))];
          return [formatNumber(row.x, 3), formatNumber(row.V, 2), formatNumber(row.M, 2), formatNumber(row.w * 1000, 4)];
        });
        renderTable(doc, samples, ["x (m)", "V (N)", "M (N m)", "w (mm)"], sampleRows);
      } catch (validationError) {
        error.textContent = "输入校验：" + validationError.message;
        clear(metrics);
        clear(ledger);
        clear(samples);
        clear(svg);
      }
    }

    fields.forEach(function (field) {
      field.input.addEventListener("input", renderBench);
      field.input.addEventListener("change", renderBench);
    });
    predictionForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var answers = {
        shear: selected(predictionForm, uid + "-shear"),
        height: selected(predictionForm, uid + "-height"),
        units: selected(predictionForm, uid + "-units")
      };
      if (!answers.shear || !answers.height || !answers.units) {
        feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
        return;
      }
      state.predictions = answers;
      state.revealed = true;
      bench.hidden = false;
      var correct = (answers.shear === "constant" ? 1 : 0) + (answers.height === "eight" ? 1 : 0) + (answers.units === "paired" ? 1 : 0);
      feedback.textContent = "已揭示：" + correct + "/3 命中。现在可改动参数，观察两套公式各自如何重算。";
      renderBench();
      announce(api, root, "梁与扭转预测已揭示，计算账本已显示。");
    });
    predictionForm.querySelector('[data-reset="true"]').addEventListener("click", function () {
      predictionForm.reset();
      state = { revealed: false, predictions: {} };
      bench.hidden = true;
      feedback.textContent = "结果尚未揭示。";
      fields.forEach(function (field) {
        var defaults = { P: 1.2, L: 1.2, E: 210, b: 40, h: 80, T: 180, d: 40, G: 80 };
        field.input.value = defaults[field.key];
      });
      error.textContent = "";
      clear(metrics); clear(ledger); clear(samples); clear(svg);
      announce(api, root, "梁与扭转实验已重置，预测结果再次隐藏。");
    });
    announce(api, root, "梁与扭转实验已加载；先完成三项预测。");
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var result = computeBeamTorsion(DEFAULTS, 8);
    check(result.beam.rows.length === 9, "beam sampling includes both endpoints");
    check(near(result.beam.rows[0].V, DEFAULTS.P), "support shear equals end load");
    check(near(result.beam.rows[result.beam.rows.length - 1].M, 0), "free-end moment is zero");
    check(near(result.beam.endDeflection, DEFAULTS.P * Math.pow(DEFAULTS.L, 3) / (3 * DEFAULTS.E * result.beam.I)), "cantilever deflection formula");
    check(result.beam.endDeflection > 0, "beam deflection is positive");
    check(near(result.torsion.tauMax, 16 * DEFAULTS.T / (Math.PI * Math.pow(DEFAULTS.d, 3))), "solid shaft shear formula");
    check(near(result.torsion.theta, DEFAULTS.T * DEFAULTS.L / (DEFAULTS.G * result.torsion.J)), "torsion angle formula");
    check(near(result.torsion.thetaDeg, result.torsion.theta * 180 / Math.PI), "radian-degree conversion");
    check(result.torsion.tauMax > 1e6, "torsion stress has Pa scale");
    var doubledHeight = computeBeam({ P: DEFAULTS.P, L: DEFAULTS.L, E: DEFAULTS.E, b: DEFAULTS.b, h: DEFAULTS.h * 2 });
    check(near(doubledHeight.endDeflection / result.beam.endDeflection, 1 / 8), "height cubed stiffness scaling");
    var invalidCaught = false;
    try { computeTorsion({ T: 1, L: 1, G: 1, d: 0 }); } catch (error) { invalidCaught = true; }
    check(invalidCaught, "invalid diameter is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: DEFAULTS,
    beamConfig: beamConfig,
    torsionConfig: torsionConfig,
    computeBeam: computeBeam,
    computeTorsion: computeTorsion,
    computeBeamTorsion: computeBeamTorsion,
    mount: mount,
    selfTest: selfTest
  };
});
