(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("continuum-conservation", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("continuum-conservation self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("continuum-conservation self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-continuum-conservation-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var DEFAULT = { densityMode: "constant", samples: 21, massFlow: 1, x0: 0.2, x1: 0.8 };
  var PRESETS = [
    { id: "constant", label: "恒密度：不可压 toy", densityMode: "constant" },
    { id: "variable", label: "变密度：仍守恒质量", densityMode: "variable" }
  ];

  var STYLE_TEXT = [
    ".cc-lab{--cc-blue:var(--cl-blue,#315f9d);--cc-gold:var(--cl-gold,#9b6a12);--cc-green:var(--cl-green,#39734d);--cc-red:var(--cl-red,#b64335);--cc-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".cc-lab *,.cc-lab *::before,.cc-lab *::after{box-sizing:border-box;}.cc-lab [hidden]{display:none!important;}.cc-lab h3,.cc-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.cc-lab h3{font-size:1.18rem;}.cc-lab h4{font-size:1rem;}.cc-lab .cc-note,.cc-lab .cc-feedback{color:var(--cc-soft);font-size:13px;line-height:1.7;}.cc-lab .cc-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cc-gold);background:var(--bg);}.cc-lab fieldset{min-width:0;margin:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.cc-lab legend{max-width:100%;padding:0 4px;color:var(--cc-soft);font-size:13px;line-height:1.5;}.cc-lab .cc-question-list{display:grid;gap:10px;}.cc-lab .cc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".cc-lab button,.cc-lab input{font:inherit;}.cc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.cc-lab button:hover{border-color:var(--accent);}.cc-lab button[aria-pressed=\"true\"],.cc-lab button.cc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.cc-lab button:disabled{cursor:not-allowed;opacity:.55;}.cc-lab button:focus-visible,.cc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.cc-lab .cc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.cc-lab .cc-actions>*{flex:1 1 170px;}.cc-lab .cc-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.cc-lab .cc-pass{color:var(--cc-green);}.cc-lab .cc-warn{color:var(--cc-red);}",
    ".cc-lab .cc-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.cc-lab .cc-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0 12px;}.cc-lab .cc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;align-items:end;}.cc-lab .cc-control{display:grid;gap:5px;min-width:0;}.cc-lab .cc-control label{color:var(--cc-soft);font-size:13px;font-weight:700;}.cc-lab .cc-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.cc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".cc-lab .cc-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:13px 0;}.cc-lab .cc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.cc-lab .cc-metric:nth-child(3n+1){border-top-color:var(--cc-blue);}.cc-lab .cc-metric:nth-child(3n+2){border-top-color:var(--cc-gold);}.cc-lab .cc-metric:nth-child(3n){border-top-color:var(--cc-green);}.cc-lab .cc-metric span{display:block;color:var(--cc-soft);font-size:11.5px;line-height:1.4;}.cc-lab .cc-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums;}",
    ".cc-lab .cc-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch;}.cc-lab .cc-svg{display:block;width:100%;min-width:720px;height:auto;color:var(--fg);}.cc-lab .cc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.cc-lab .cc-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}.cc-lab .cc-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.cc-lab .cc-area{fill:var(--cc-blue);fill-opacity:.2;stroke:var(--cc-blue);stroke-width:2;}.cc-lab .cc-velocity{fill:none;stroke:var(--cc-green);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}.cc-lab .cc-density{fill:none;stroke:var(--cc-gold);stroke-width:2;stroke-dasharray:5 4;}.cc-lab .cc-bar-mass{fill:var(--cc-blue);fill-opacity:.72;}.cc-lab .cc-bar-momentum{fill:var(--cc-red);fill-opacity:.72;}.cc-lab .cc-bar-force{fill:var(--cc-green);fill-opacity:.72;}.cc-lab .cc-title{font-size:13px;font-weight:750;}.cc-lab .cc-label{font-size:11px;}",
    ".cc-lab .cc-table-wrap{max-width:100%;margin-top:13px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.cc-lab table{width:100%;min-width:900px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.cc-lab caption{padding:0 0 7px;text-align:left;color:var(--cc-soft);font-size:12px;}.cc-lab th,.cc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.cc-lab th{color:var(--cc-soft);font-size:11.5px;font-weight:750;}.cc-lab .cc-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--cc-green);background:var(--bg);font-size:13px;line-height:1.7;}",
    "@media(max-width:980px){.cc-lab .cc-metrics{grid-template-columns:repeat(3,minmax(0,1fr));}.cc-lab .cc-controls{grid-template-columns:repeat(2,minmax(0,1fr));}}@media(max-width:680px){.cc-lab .cc-choice-grid,.cc-lab .cc-preset-grid,.cc-lab .cc-controls,.cc-lab .cc-metrics{grid-template-columns:minmax(0,1fr);}.cc-lab .cc-frame{padding:5px;}}@media(prefers-reduced-motion:reduce){.cc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function findPreset(id) {
    return PRESETS.filter(function (preset) { return preset.id === id; })[0] || PRESETS[0];
  }

  function normalizeConfig(input) {
    var source = input || {};
    var mode = ["constant", "variable"].indexOf(source.densityMode) >= 0 ? source.densityMode : DEFAULT.densityMode;
    var samples = Math.floor(Number(source.samples));
    var x0 = Number(source.x0);
    var x1 = Number(source.x1);
    if (!finite(samples)) samples = DEFAULT.samples;
    if (!finite(x0)) x0 = DEFAULT.x0;
    if (!finite(x1)) x1 = DEFAULT.x1;
    x0 = clamp(x0, 0.05, 0.85);
    x1 = clamp(x1, x0 + 0.05, 0.95);
    return {
      densityMode: mode,
      samples: Math.round(clamp(samples, 9, 41)),
      massFlow: 1,
      x0: x0,
      x1: x1
    };
  }

  function area(x) {
    var z = (x - 0.5) / 0.22;
    return 1 - 0.45 * Math.exp(-z * z);
  }

  function areaDerivative(x) {
    var z = (x - 0.5) / 0.22;
    return 0.9 * (x - 0.5) / (0.22 * 0.22) * Math.exp(-z * z);
  }

  function density(mode, x) {
    return mode === "variable" ? 1 + 0.2 * x : 1;
  }

  function densityDerivative(mode) {
    return mode === "variable" ? 0.2 : 0;
  }

  function velocity(mode, x, massFlow) {
    var flow = finite(Number(massFlow)) ? Number(massFlow) : DEFAULT.massFlow;
    return flow / (density(mode, x) * area(x));
  }

  function velocityDerivative(mode, x, massFlow) {
    var speed = velocity(mode, x, massFlow);
    return -speed * (densityDerivative(mode) / density(mode, x) + areaDerivative(x) / area(x));
  }

  function materialDerivativeDensity(mode, x, massFlow) {
    return velocity(mode, x, massFlow) * densityDerivative(mode);
  }

  function quasiOneDDivergence(mode, x, massFlow) {
    var speed = velocity(mode, x, massFlow);
    var derivative = velocityDerivative(mode, x, massFlow);
    return areaDerivative(x) / area(x) * speed + derivative;
  }

  function continuityResidual(mode, x, massFlow) {
    return materialDerivativeDensity(mode, x, massFlow) + density(mode, x) * quasiOneDDivergence(mode, x, massFlow);
  }

  function pressure(x) {
    return 1.4 - 0.3 * x;
  }

  function momentumFlux(mode, x, massFlow) {
    return density(mode, x) * area(x) * velocity(mode, x, massFlow) * velocity(mode, x, massFlow);
  }

  function controlVolumeLedger(input) {
    var config = normalizeConfig(input);
    var rhoIn = density(config.densityMode, config.x0);
    var rhoOut = density(config.densityMode, config.x1);
    var speedIn = velocity(config.densityMode, config.x0, config.massFlow);
    var speedOut = velocity(config.densityMode, config.x1, config.massFlow);
    var massIn = rhoIn * area(config.x0) * speedIn;
    var massOut = rhoOut * area(config.x1) * speedOut;
    var momentumIn = momentumFlux(config.densityMode, config.x0, config.massFlow);
    var momentumOut = momentumFlux(config.densityMode, config.x1, config.massFlow);
    var pressureForce = pressure(config.x0) * area(config.x0) - pressure(config.x1) * area(config.x1);
    var momentumChange = momentumOut - momentumIn;
    var wallForce = momentumChange - pressureForce;
    return {
      x0: config.x0,
      x1: config.x1,
      massIn: massIn,
      massOut: massOut,
      accumulation: 0,
      massResidual: massOut - massIn,
      momentumIn: momentumIn,
      momentumOut: momentumOut,
      momentumChange: momentumChange,
      pressureForce: pressureForce,
      wallForce: wallForce,
      bodyForce: 0,
      momentumResidual: pressureForce + wallForce - momentumChange
    };
  }

  function sampleField(input) {
    var config = normalizeConfig(input);
    var rows = [];
    var index;
    var x;
    for (index = 0; index < config.samples; index += 1) {
      x = index / (config.samples - 1);
      rows.push({
        x: x,
        area: area(x),
        rho: density(config.densityMode, x),
        velocity: velocity(config.densityMode, x, config.massFlow),
        massFlux: density(config.densityMode, x) * area(x) * velocity(config.densityMode, x, config.massFlow),
        materialDensityRate: materialDerivativeDensity(config.densityMode, x, config.massFlow),
        divergence: quasiOneDDivergence(config.densityMode, x, config.massFlow),
        continuityResidual: continuityResidual(config.densityMode, x, config.massFlow)
      });
    }
    return rows;
  }

  function compute(input) {
    var config = normalizeConfig(input);
    var field = sampleField(config);
    var ledger = controlVolumeLedger(config);
    var maxResidual = field.reduce(function (maximum, row) { return Math.max(maximum, Math.abs(row.continuityResidual)); }, 0);
    var massFluxRange = field.reduce(function (range, row) {
      return [Math.min(range[0], row.massFlux), Math.max(range[1], row.massFlux)];
    }, [Infinity, -Infinity]);
    var throat = field[Math.floor((field.length - 1) / 2)];
    return {
      config: config,
      field: field,
      throat: throat,
      ledger: ledger,
      maxContinuityResidual: maxResidual,
      massFluxRange: massFluxRange,
      incompressibleModel: config.densityMode === "constant",
      evidenceLabel: "有限网格与控制体积算术：数值证据，不是连续介质定理证明"
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.0005) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function appendChildren(node, children) {
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children || []);
  }

  function svgElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children || []);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "cc-metric" }, [element(doc, "span", {}, [label]), element(doc, "strong", {}, [value])]);
  }

  function tableElement(doc, captionText, headers, rows) {
    var head = element(doc, "tr", {}, headers.map(function (header) { return element(doc, "th", { scope: "col" }, [header]); }));
    var body = element(doc, "tbody", {}, rows.map(function (row) {
      return element(doc, "tr", {}, row.map(function (cell, index) { return element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, [cell]); }));
    }));
    return element(doc, "table", {}, [element(doc, "caption", {}, [captionText]), element(doc, "thead", {}, [head]), body]);
  }

  function svgText(doc, x, y, text, attrs) {
    var merged = { x: x, y: y, className: "cc-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return svgElement(doc, "text", merged, [text]);
  }

  function pathFor(rows, field, x, y) {
    return rows.map(function (row, index) { return (index ? "L" : "M") + x(row.x) + " " + y(row[field]); }).join(" ");
  }

  function drawSvg(doc, result, uid) {
    var svg = svgElement(doc, "svg", { className: "cc-svg", viewBox: "0 0 820 390", role: "img", "aria-labelledby": uid + "-title " + uid + "-desc" }, []);
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, ["连续介质喷管的质量与动量通量账本"]));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" }, ["左图显示截面积、速度和密度剖面，右图比较控制体积的质量、动量与外力项。"]));
    var rows = result.field;
    var left = 54;
    var split = 410;
    var top = 52;
    var bottom = 300;
    var right = 790;
    function x(value) { return left + value * (split - left - 24); }
    var maxSpeed = Math.max.apply(null, rows.map(function (row) { return row.velocity; })) * 1.1;
    var maxArea = 1.1;
    function ySpeed(value) { return bottom - value / maxSpeed * (bottom - top); }
    function yArea(value) { return bottom - value / maxArea * (bottom - top); }
    [0, maxSpeed / 2, maxSpeed].forEach(function (value) {
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: ySpeed(value), x2: split - 24, y2: ySpeed(value), className: "cc-grid" }));
      svg.appendChild(svgText(doc, left - 8, ySpeed(value) + 4, format(value, 2), { "text-anchor": "end" }));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: split - 24, y2: bottom, className: "cc-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, className: "cc-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: pathFor(rows, "velocity", x, ySpeed), className: "cc-velocity" }));
    svg.appendChild(svgElement(doc, "path", { d: pathFor(rows, "area", x, yArea), className: "cc-area" }));
    if (result.config.densityMode === "variable") {
      var maxDensity = 1.3;
      function yDensity(value) { return bottom - (value - 1) / (maxDensity - 1) * (bottom - top); }
      svg.appendChild(svgElement(doc, "path", { d: pathFor(rows, "rho", x, yDensity), className: "cc-density" }));
    }
    svg.appendChild(svgText(doc, (left + split) / 2, 25, "一维喷管：A(x)、u(x) 与 ρ(x)", { className: "cc-title", "text-anchor": "middle" }));
    svg.appendChild(svgText(doc, split - 28, bottom + 22, "x", { "text-anchor": "end" }));
    var bars = [
      { label: "质量入", value: result.ledger.massIn, className: "cc-bar-mass" },
      { label: "质量出", value: result.ledger.massOut, className: "cc-bar-mass" },
      { label: "动量入", value: result.ledger.momentumIn, className: "cc-bar-momentum" },
      { label: "动量出", value: result.ledger.momentumOut, className: "cc-bar-momentum" },
      { label: "压力力", value: result.ledger.pressureForce, className: "cc-bar-force" },
      { label: "壁面力", value: result.ledger.wallForce, className: "cc-bar-force" }
    ];
    var maxBar = Math.max(1, Math.max.apply(null, bars.map(function (bar) { return Math.abs(bar.value); })) * 1.25);
    var barLeft = 470;
    var barRight = right - 22;
    var barWidth = (barRight - barLeft) / bars.length * 0.56;
    function yBar(value) { return bottom - value / maxBar * (bottom - top); }
    svg.appendChild(svgElement(doc, "line", { x1: barLeft, y1: bottom, x2: barRight, y2: bottom, className: "cc-axis" }));
    bars.forEach(function (bar, index) {
      var center = barLeft + (index + 0.5) / bars.length * (barRight - barLeft);
      var y = yBar(Math.max(0, bar.value));
      var height = Math.max(1, bottom - y);
      svg.appendChild(svgElement(doc, "rect", { x: center - barWidth / 2, y: y, width: barWidth, height: height, className: bar.className }));
      svg.appendChild(svgText(doc, center, bottom + 18, bar.label, { "text-anchor": "middle" }));
      svg.appendChild(svgText(doc, center, y - 6, format(bar.value, 3), { "text-anchor": "middle" }));
    });
    svg.appendChild(svgText(doc, (barLeft + barRight) / 2, 25, "控制体积通量与外力", { className: "cc-title", "text-anchor": "middle" }));
    svg.appendChild(svgText(doc, 410, 370, "质量：积累 + 净流出；动量：净通量 = 压力 + 壁面 + 体力", { "text-anchor": "middle" }));
    return svg;
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
    var status = root.querySelector("[data-cc-status]");
    if (status) status.textContent = message;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "cc-" + (++INSTANCE);
    var state = { densityMode: DEFAULT.densityMode, samples: DEFAULT.samples, x0: DEFAULT.x0, x1: DEFAULT.x1 };
    var prediction = { speed: null, density: null, momentum: null };
    var revealed = false;
    var score = 0;
    var shell = element(doc, "div", { className: "cc-lab" }, []);
    clear(root);
    root.appendChild(shell);

    function addPrediction(list, key, legendText, options) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", {}, [legendText])]);
      var grid = element(doc, "div", { className: "cc-choice-grid" }, []);
      options.forEach(function (option) {
        var button = element(doc, "button", { type: "button", "aria-pressed": prediction[key] === option.value ? "true" : "false", disabled: revealed }, [option.label]);
        button.addEventListener("click", function () {
          if (!revealed) {
            prediction[key] = option.value;
            renderGate();
          }
        });
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      list.appendChild(fieldset);
    }

    function complete() {
      return prediction.speed !== null && prediction.density !== null && prediction.momentum !== null;
    }

    function renderGate() {
      clear(shell);
      shell.appendChild(element(doc, "h3", {}, ["连续介质守恒审计：随体与控制体积"]));
      shell.appendChild(element(doc, "p", { className: "cc-note" }, [revealed ? "预测已提交；可以切换恒密度/变密度模式和控制体积端点。" : "先判断喷管速度、不可压条件和动量通量，再打开数值账本。"]));
      shell.appendChild(element(doc, "div", { className: "cc-prompt" }, [revealed ? "这里是平滑准一维喷管的有限算术；图形展示守恒账如何对账，不把采样点当作连续方程的证明。" : "预测门：物质导数与散度、恒密度与不可压、控制体积动量通量分别判断。"]));
      var questions = element(doc, "div", { className: "cc-question-list" }, []);
      addPrediction(questions, "speed", "1 · 恒密度喷管变窄且质量流率不变时，速度？", [
        { value: "up", label: "变大" },
        { value: "down", label: "变小" },
        { value: "none", label: "不由连续性决定" }
      ]);
      addPrediction(questions, "density", "2 · Dρ/Dt=0 是否无条件等价于 div u=0？", [
        { value: "yes", label: "无条件等价" },
        { value: "coupled", label: "需看连续性与 ρ" },
        { value: "opposite", label: "总是相反" }
      ]);
      addPrediction(questions, "momentum", "3 · 控制体积动量账是否必须列净通量？", [
        { value: "flux", label: "必须列 ρu²A" },
        { value: "pressure", label: "只列压力" },
        { value: "local", label: "只列 ρDu/Dt" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "cc-actions" }, []);
      var reveal = element(doc, "button", { type: "button", className: "cc-primary", disabled: revealed || !complete() }, [revealed ? "账本已揭示" : "提交预测并揭示"]);
      reveal.addEventListener("click", function () {
        if (!complete()) return;
        score = (prediction.speed === "up" ? 1 : 0) + (prediction.density === "coupled" ? 1 : 0) + (prediction.momentum === "flux" ? 1 : 0);
        revealed = true;
        renderGate();
        announce(api, root, "预测已提交；连续介质质量与动量账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(reveal);
      actions.appendChild(reset);
      shell.appendChild(actions);
      shell.appendChild(element(doc, "p", { className: "cc-feedback " + (revealed ? (score === 3 ? "cc-pass" : "cc-warn") : ""), "aria-live": "polite", "data-cc-status": true }, [
        !complete() ? "请为三个判断各选一项。" : revealed ? "预测得分 " + score + "/3；下面显示场量和两个控制体积账。" : "三项预测已记录，点击提交后才显示结果。"
      ]));
      if (revealed) buildResults();
    }

    function buildResults() {
      var panel = element(doc, "section", { className: "cc-revealed" }, [
        element(doc, "h4", {}, ["结果与透明账本"]),
        element(doc, "p", { className: "cc-note" }, ["恒密度模式把 ρ 固定为 1；变密度模式仍固定质量流率，但让 Dρ/Dt 与准一维散度分别显示出来。"])
      ]);
      var presetGrid = element(doc, "div", { className: "cc-preset-grid" }, []);
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", "aria-pressed": state.densityMode === preset.densityMode ? "true" : "false" }, [preset.label]);
        button.addEventListener("click", function () { state.densityMode = preset.densityMode; renderGate(); });
        presetGrid.appendChild(button);
      });
      panel.appendChild(presetGrid);
      var controls = element(doc, "div", { className: "cc-controls" }, []);
      var sampleId = uid + "-samples";
      var sampleOutput = element(doc, "output", { for: sampleId }, [String(state.samples)]);
      var sampleInput = element(doc, "input", { id: sampleId, type: "range", min: "9", max: "41", step: "2", value: String(state.samples), "aria-label": "空间采样点数" });
      sampleInput.addEventListener("input", function () { state.samples = Number(sampleInput.value); sampleOutput.textContent = String(state.samples); renderResults(); });
      controls.appendChild(element(doc, "div", { className: "cc-control" }, [element(doc, "label", { htmlFor: sampleId }, ["采样点 = ", sampleOutput]), sampleInput]));
      var x0Id = uid + "-x0";
      var x0Output = element(doc, "output", { for: x0Id }, [format(state.x0, 2)]);
      var x0Input = element(doc, "input", { id: x0Id, type: "range", min: "0.05", max: "0.8", step: "0.05", value: String(state.x0), "aria-label": "控制体积入口位置" });
      x0Input.addEventListener("input", function () { state.x0 = Number(x0Input.value); if (state.x1 <= state.x0) state.x1 = Math.min(0.95, state.x0 + 0.05); x0Output.textContent = format(state.x0, 2); renderResults(); });
      controls.appendChild(element(doc, "div", { className: "cc-control" }, [element(doc, "label", { htmlFor: x0Id }, ["入口 x₀ = ", x0Output]), x0Input]));
      var x1Id = uid + "-x1";
      var x1Output = element(doc, "output", { for: x1Id }, [format(state.x1, 2)]);
      var x1Input = element(doc, "input", { id: x1Id, type: "range", min: "0.2", max: "0.95", step: "0.05", value: String(state.x1), "aria-label": "控制体积出口位置" });
      x1Input.addEventListener("input", function () { state.x1 = Math.max(Number(x1Input.value), state.x0 + 0.05); x1Output.textContent = format(state.x1, 2); renderResults(); });
      controls.appendChild(element(doc, "div", { className: "cc-control" }, [element(doc, "label", { htmlFor: x1Id }, ["出口 x₁ = ", x1Output]), x1Input]));
      panel.appendChild(controls);
      var stage = element(doc, "div", { className: "cc-stage" }, []);
      panel.appendChild(stage);
      shell.appendChild(panel);

      function renderResults() {
        var result = compute(state);
        clear(stage);
        stage.appendChild(element(doc, "div", { className: "cc-metrics" }, [
          metric(doc, "最大连续性残差", format(result.maxContinuityResidual, 6)),
          metric(doc, "质量流率范围", format(result.massFluxRange[0], 4) + "–" + format(result.massFluxRange[1], 4)),
          metric(doc, "喉部速度", format(result.throat.velocity, 4)),
          metric(doc, "Dρ/Dt（喉部）", format(result.throat.materialDensityRate, 4)),
          metric(doc, "动量净流出", format(result.ledger.momentumChange, 4)),
          metric(doc, "动量账残差", format(result.ledger.momentumResidual, 6))
        ]));
        var frame = element(doc, "div", { className: "cc-frame" }, []);
        frame.appendChild(drawSvg(doc, result, uid));
        frame.appendChild(element(doc, "p", { className: "cc-note" }, [result.incompressibleModel ? "恒密度模式：Dρ/Dt=0 与准一维散度为零在本 toy 中同时出现。" : "变密度模式：质量通量仍恒定，但 Dρ/Dt 与散度项相互抵消；这不是恒密度不可压模型。"]));
        stage.appendChild(frame);
        var stride = Math.max(1, Math.ceil(result.field.length / 10));
        var fieldRows = result.field.filter(function (row, index) { return index % stride === 0 || index === result.field.length - 1; }).map(function (row) {
          return [format(row.x, 2), format(row.area, 4), format(row.rho, 4), format(row.velocity, 4), format(row.massFlux, 4), format(row.materialDensityRate, 5), format(row.divergence, 5), format(row.continuityResidual, 6)];
        });
        stage.appendChild(element(doc, "div", { className: "cc-table-wrap" }, [tableElement(doc, "场量与连续性账", ["x", "A", "ρ", "u", "ρAu", "Dρ/Dt", "准一维 div", "残差"], fieldRows)]));
        var ledger = result.ledger;
        var ledgerRows = [
          ["质量入口/出口", format(ledger.massIn, 5), format(ledger.massOut, 5), format(ledger.massResidual, 6), "稳态积累 = 0"],
          ["动量净流出", format(ledger.momentumIn, 5), format(ledger.momentumOut, 5), format(ledger.momentumChange, 5), "出口 − 入口"],
          ["外力账", format(ledger.pressureForce, 5), format(ledger.wallForce, 5), format(ledger.bodyForce, 5), "压力 + 壁面 + 体力"],
          ["动量平衡残差", "—", "—", format(ledger.momentumResidual, 6), "外力 − 动量净流出"]
        ];
        stage.appendChild(element(doc, "div", { className: "cc-table-wrap" }, [tableElement(doc, "固定控制体积质量/动量 ledger", ["项目", "入口或压力", "出口或壁面", "数值", "含义"], ledgerRows)]));
        stage.appendChild(element(doc, "p", { className: "cc-interpretation", "aria-live": "polite" }, [
          result.incompressibleModel
            ? "当前恒密度只是一种更强的 toy 假设；连续性方程的本体仍是 Dρ/Dt + ρ div u = 0。控制体积动量账同时需要净通量，不能只看局部物质导数。"
            : "当前变密度模式直接展示不可压与恒密度的区别：质量守恒不要求 ρ 在所有位置相同。图表/有限差分是数值证据，连续介质定律还依赖光滑场、准一维和无激波等模型边界。"
        ]));
      }
      renderResults();
    }

    function resetToGate() {
      state = { densityMode: DEFAULT.densityMode, samples: DEFAULT.samples, x0: DEFAULT.x0, x1: DEFAULT.x1 };
      prediction = { speed: null, density: null, momentum: null };
      revealed = false;
      score = 0;
      renderGate();
      announce(api, root, "连续介质实验已重置；请重新完成三个预测。");
    }

    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    assert(area(0.5) < area(0.1), "throat has smaller area");
    assert(near(density("constant", 0.7), 1), "constant density");
    assert(near(density("variable", 0.7), 1.14), "variable density");
    assert(near(materialDerivativeDensity("constant", 0.5, 1), 0), "constant material density rate");
    assert(materialDerivativeDensity("variable", 0.5, 1) > 0, "variable material density rate");
    var constant = compute({ densityMode: "constant", samples: 21, x0: 0.2, x1: 0.8 });
    assert(constant.incompressibleModel, "constant model label");
    assert(constant.maxContinuityResidual < 1e-8, "constant continuity residual");
    assert(constant.throat.velocity > constant.field[0].velocity, "narrow nozzle accelerates flow");
    assert(constant.massFluxRange[1] - constant.massFluxRange[0] < 1e-12, "constant mass flux");
    assert(near(constant.ledger.massIn, constant.ledger.massOut), "constant mass ledger");
    assert(Math.abs(constant.ledger.momentumResidual) < 1e-10, "constant momentum ledger");
    var variable = compute({ densityMode: "variable", samples: 21, x0: 0.2, x1: 0.8 });
    assert(!variable.incompressibleModel, "variable model label");
    assert(variable.maxContinuityResidual < 1e-8, "variable continuity residual");
    assert(variable.throat.materialDensityRate > 0, "variable density material rate");
    assert(variable.throat.divergence < 0, "variable divergence compensates density increase at throat");
    assert(variable.massFluxRange[1] - variable.massFluxRange[0] < 1e-12, "variable mass flux");
    assert(Math.abs(variable.ledger.massResidual) < 1e-12, "variable mass ledger");
    assert(Math.abs(variable.ledger.momentumResidual) < 1e-10, "variable momentum ledger");
    assert(near(momentumFlux("constant", 0.4, 1), velocity("constant", 0.4, 1)), "momentum flux relation");
    assert(normalizeConfig({ samples: 999 }).samples === 41, "sample clamp");
    assert(JSON.stringify(compute({ densityMode: "variable" })) === JSON.stringify(compute({ densityMode: "variable" })), "deterministic field");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    normalizeConfig: normalizeConfig,
    area: area,
    areaDerivative: areaDerivative,
    density: density,
    densityDerivative: densityDerivative,
    velocity: velocity,
    velocityDerivative: velocityDerivative,
    materialDerivativeDensity: materialDerivativeDensity,
    quasiOneDDivergence: quasiOneDDivergence,
    continuityResidual: continuityResidual,
    momentumFlux: momentumFlux,
    controlVolumeLedger: controlVolumeLedger,
    sampleField: sampleField,
    compute: compute,
    mount: mount,
    selfTest: selfTest
  };
});
