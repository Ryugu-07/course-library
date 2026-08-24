(function () {
  "use strict";

  var LAB_ID = "auto-power-converter-ripple";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = LAB_ID + "-styles";
  var DEFAULTS = {
    vin: 24,
    duty: 0.4,
    inductanceUh: 100,
    frequencyKhz: 100,
    capacitanceUf: 220,
    loadA: 0.8,
    cycles: 8
  };
  var CSS = [
    '[data-learning-lab="auto-power-converter-ripple"]{--pc-blue:var(--cl-blue,#315f9d);--pc-orange:var(--cl-gold,#9b6a12);--pc-green:var(--cl-green,#39734d);--pc-red:var(--cl-red,#b64335);display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="auto-power-converter-ripple"] *{box-sizing:border-box}[data-learning-lab="auto-power-converter-ripple"] [hidden]{display:none!important}',
    '[data-learning-lab="auto-power-converter-ripple"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="auto-power-converter-ripple"] p{margin:8px 0}',
    '[data-learning-lab="auto-power-converter-ripple"] .pc-note,[data-learning-lab="auto-power-converter-ripple"] .pc-feedback{font-size:13px;color:var(--fg-soft,currentColor);line-height:1.7}',
    '[data-learning-lab="auto-power-converter-ripple"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-power-converter-ripple"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="auto-power-converter-ripple"] .pc-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-power-converter-ripple"] button,[data-learning-lab="auto-power-converter-ripple"] input{font:inherit;letter-spacing:0}',
    '[data-learning-lab="auto-power-converter-ripple"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-power-converter-ripple"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-power-converter-ripple"] button[aria-pressed="true"],[data-learning-lab="auto-power-converter-ripple"] .pc-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
    '[data-learning-lab="auto-power-converter-ripple"] button:focus-visible,[data-learning-lab="auto-power-converter-ripple"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}',
    '[data-learning-lab="auto-power-converter-ripple"] .pc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-power-converter-ripple"] .pc-actions>*{flex:1 1 170px}[data-learning-lab="auto-power-converter-ripple"] .pc-feedback{min-height:2em;font-weight:700}[data-learning-lab="auto-power-converter-ripple"] .pc-correct{color:var(--pc-green)}[data-learning-lab="auto-power-converter-ripple"] .pc-wrong{color:var(--pc-red)}',
    '[data-learning-lab="auto-power-converter-ripple"] .pc-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start}[data-learning-lab="auto-power-converter-ripple"] .pc-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px}[data-learning-lab="auto-power-converter-ripple"] .pc-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-power-converter-ripple"] .pc-control label{font-size:13px;font-weight:700;color:var(--fg-soft,currentColor)}[data-learning-lab="auto-power-converter-ripple"] output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
    '[data-learning-lab="auto-power-converter-ripple"] input[type="range"]{width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-power-converter-ripple"] .pc-stage-frame{padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;overflow:hidden}[data-learning-lab="auto-power-converter-ripple"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="auto-power-converter-ripple"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="auto-power-converter-ripple"] .pc-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-power-converter-ripple"] .pc-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-power-converter-ripple"] .pc-pwm{stroke:var(--pc-blue);stroke-width:2.8;fill:none}[data-learning-lab="auto-power-converter-ripple"] .pc-current{stroke:var(--pc-orange);stroke-width:2.5;fill:none}[data-learning-lab="auto-power-converter-ripple"] .pc-voltage{stroke:var(--pc-green);stroke-width:2.4;fill:none}[data-learning-lab="auto-power-converter-ripple"] .pc-boundary{stroke:var(--pc-red);stroke-width:1.5;stroke-dasharray:6 4}[data-learning-lab="auto-power-converter-ripple"] .pc-label{font-size:11px}[data-learning-lab="auto-power-converter-ripple"] .pc-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
    '[data-learning-lab="auto-power-converter-ripple"] .pc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-power-converter-ripple"] .pc-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1)}[data-learning-lab="auto-power-converter-ripple"] .pc-metric:nth-child(3n+1){border-color:var(--pc-blue)}[data-learning-lab="auto-power-converter-ripple"] .pc-metric:nth-child(3n+2){border-color:var(--pc-orange)}[data-learning-lab="auto-power-converter-ripple"] .pc-metric:nth-child(3n){border-color:var(--pc-green)}[data-learning-lab="auto-power-converter-ripple"] .pc-metric span{display:block;font-size:11.5px;color:var(--fg-soft,currentColor)}[data-learning-lab="auto-power-converter-ripple"] .pc-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
    '[data-learning-lab="auto-power-converter-ripple"] .pc-table{max-width:100%;overflow-x:auto}[data-learning-lab="auto-power-converter-ripple"] table{width:100%;min-width:720px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-power-converter-ripple"] th,[data-learning-lab="auto-power-converter-ripple"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="auto-power-converter-ripple"] th{font-size:11px;color:var(--fg-soft,currentColor)}[data-learning-lab="auto-power-converter-ripple"] .pc-evidence{margin-top:11px;padding:10px 12px;border-left:3px solid var(--pc-green);font-size:13px;line-height:1.7}',
    '@media(max-width:900px){[data-learning-lab="auto-power-converter-ripple"] .pc-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-power-converter-ripple"] .pc-choices{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-power-converter-ripple"] .pc-stage-frame{padding:4px}[data-learning-lab="auto-power-converter-ripple"] table{font-size:10.8px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-power-converter-ripple"] *{animation:none!important;transition:none!important}}'
  ].join("");

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }
  function nearly(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
  }
  function clamp(value, lower, upper) { return Math.min(upper, Math.max(lower, value)); }
  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }
  function normalize(input) {
    var source = input || {};
    var config = {
      vin: finite(source.vin === undefined ? DEFAULTS.vin : source.vin, "vin"),
      duty: finite(source.duty === undefined ? DEFAULTS.duty : source.duty, "duty"),
      inductanceUh: finite(source.inductanceUh === undefined ? DEFAULTS.inductanceUh : source.inductanceUh, "inductanceUh"),
      frequencyKhz: finite(source.frequencyKhz === undefined ? DEFAULTS.frequencyKhz : source.frequencyKhz, "frequencyKhz"),
      capacitanceUf: finite(source.capacitanceUf === undefined ? DEFAULTS.capacitanceUf : source.capacitanceUf, "capacitanceUf"),
      loadA: finite(source.loadA === undefined ? DEFAULTS.loadA : source.loadA, "loadA"),
      cycles: Math.round(finite(source.cycles === undefined ? DEFAULTS.cycles : source.cycles, "cycles"))
    };
    if (config.vin < 5 || config.vin > 60) throw new RangeError("vin must be in [5, 60] V");
    if (config.duty < 0.1 || config.duty > 0.9) throw new RangeError("duty must be in [0.1, 0.9]");
    if (config.inductanceUh < 20 || config.inductanceUh > 300) throw new RangeError("inductance must be in [20, 300] uH");
    if (config.frequencyKhz < 20 || config.frequencyKhz > 300) throw new RangeError("frequency must be in [20, 300] kHz");
    if (config.capacitanceUf < 47 || config.capacitanceUf > 680) throw new RangeError("capacitance must be in [47, 680] uF");
    if (config.loadA < 0.02 || config.loadA > 8) throw new RangeError("load must be in [0.02, 8] A");
    if (config.cycles < 4 || config.cycles > 12) throw new RangeError("cycles must be in [4, 12]");
    return config;
  }
  function analyze(input) {
    var config = normalize(input);
    var inductance = config.inductanceUh * 1e-6;
    var frequency = config.frequencyKhz * 1000;
    var capacitance = config.capacitanceUf * 1e-6;
    var vout = config.duty * config.vin;
    var ripple = (config.vin - vout) * config.duty / (inductance * frequency);
    var boundary = ripple / 2;
    var voltageRipple = ripple / (8 * capacitance * frequency);
    var mode = config.loadA > boundary + 1e-12 ? "CCM" : config.loadA < boundary - 1e-12 ? "DCM likely" : "CCM boundary";
    return {
      config: config,
      units: { inductance: inductance, frequency: frequency, capacitance: capacitance },
      vout: vout,
      ripple: ripple,
      boundary: boundary,
      voltageRipple: voltageRipple,
      lowCurrent: config.loadA - ripple / 2,
      highCurrent: config.loadA + ripple / 2,
      mode: mode,
      ccm: mode === "CCM"
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function metric(doc, label, value) { return element(doc, "div", { className: "pc-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function pathFor(points) { return points.map(function (point, index) { return (index ? "L" : "M") + point[0].toFixed(2) + " " + point[1].toFixed(2); }).join(" "); }

  function draw(doc, svg, result) {
    clear(svg);
    var width = 720; var height = 400; var left = 52; var right = 18; var top = 24; var panel = 104; var gap = 28;
    var xMax = result.config.cycles; var x = function (cycle) { return left + cycle / xMax * (width - left - right); };
    var topY = function (value) { return top + 72 - value * 56; };
    var iMin = Math.min(0, result.lowCurrent); var iMax = Math.max(result.highCurrent, result.boundary, 0.1); var iPad = Math.max(0.05, (iMax - iMin) * 0.12);
    iMin -= iPad; iMax += iPad;
    var iY = function (value) { return top + panel + gap + 72 - (value - iMin) / (iMax - iMin) * 56; };
    var vMin = Math.max(0, result.vout - Math.max(result.voltageRipple * 3, 0.01)); var vMax = result.vout + Math.max(result.voltageRipple * 3, 0.01);
    var vY = function (value) { return top + 2 * (panel + gap) + 72 - (value - vMin) / (vMax - vMin) * 56; };
    svg.appendChild(svgElement(doc, "title", {}, "Buck PWM、感应电流纹波与输出电压"));
    svg.appendChild(svgElement(doc, "desc", {}, "固定 viewBox 的三段示意图，显示 PWM、理想 CCM 三角纹波、CCM 边界和电容纹波。"));
    [top, top + panel + gap, top + 2 * (panel + gap)].forEach(function (y0) {
      for (var grid = 0; grid <= 2; grid += 1) svg.appendChild(svgElement(doc, "line", { x1: left, y1: y0 + 16 + grid * 28, x2: width - right, y2: y0 + 16 + grid * 28, class: "pc-grid" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y0 + 88, x2: width - right, y2: y0 + 88, class: "pc-axis" }));
    });
    var pwm = []; var current = []; var voltage = [];
    for (var k = 0; k <= result.config.cycles * 4; k += 1) {
      var cycle = k / 4; var phase = cycle - Math.floor(cycle); var on = phase < result.config.duty;
      pwm.push([x(cycle), topY(on ? 1 : 0)]);
      var triangular = phase < result.config.duty
        ? result.config.loadA - result.ripple / 2 + result.ripple * phase / result.config.duty
        : result.config.loadA + result.ripple / 2 - result.ripple * (phase - result.config.duty) / (1 - result.config.duty);
      current.push([x(cycle), iY(triangular)]);
      voltage.push([x(cycle), vY(result.vout + result.voltageRipple * Math.sin(2 * Math.PI * phase))]);
    }
    svg.appendChild(svgElement(doc, "path", { d: pathFor(pwm), class: "pc-pwm" }));
    svg.appendChild(svgElement(doc, "path", { d: pathFor(current), class: "pc-current" }));
    svg.appendChild(svgElement(doc, "path", { d: pathFor(voltage), class: "pc-voltage" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: iY(result.boundary), x2: width - right, y2: iY(result.boundary), class: "pc-boundary" }));
    svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + 13, class: "pc-label" }, "PWM：蓝"));
    svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + panel + gap + 13, class: "pc-label" }, "iL：橙，红虚线为 CCM 边界"));
    svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + 2 * (panel + gap) + 13, class: "pc-label" }, "Vout：绿，理想电容纹波示意"));
    svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 9, "text-anchor": "end", class: "pc-small" }, "时间：开关周期"));
  }
  function renderTable(doc, host, result) {
    var body = element(doc, "tbody");
    for (var index = 0; index < result.config.cycles; index += 1) body.appendChild(element(doc, "tr", {}, [
      element(doc, "th", { text: String(index + 1) }), element(doc, "td", { text: format(result.vout, 3) + " V" }),
      element(doc, "td", { text: format(result.ripple, 3) + " A pp" }), element(doc, "td", { text: format(result.boundary, 3) + " A" }),
      element(doc, "td", { text: result.mode }), element(doc, "td", { text: format(result.voltageRipple * 1000, 3) + " mV pp" })
    ]));
    clear(host); host.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "理想 Buck CCM/DCM 证据 ledger（每行单位已标注）" }), element(doc, "thead", {}, [element(doc, "tr", {}, ["周期", "平均输出", "电感纹波", "边界负载", "模式", "电容纹波"].map(function (label) { return element(doc, "th", { text: label }); }))]), body]));
  }
  function questionSpecs() {
    return [
      { key: "gain", prompt: "理想 CCM 下 D=0.4、Vin=24 V 的输出？", expected: "9.6", choices: [{ value: "9.6", label: "约 9.6 V" }, { value: "14.4", label: "约 14.4 V" }, { value: "24", label: "仍为 24 V" }] },
      { key: "mode", prompt: "负载低于 ΔIL/2 时最应判断？", expected: "dcm", choices: [{ value: "dcm", label: "进入 DCM 可能性高" }, { value: "ccm", label: "仍必然 CCM" }, { value: "boost", label: "自动变成 Boost" }] },
      { key: "frequency", prompt: "在本纹波近似里把 fs 加倍？", expected: "smaller", choices: [{ value: "smaller", label: "ΔIL、ΔVC 都趋于减小" }, { value: "same", label: "两者都不变" }, { value: "double", label: "两者都加倍" }] }
    ];
  }
  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument; installStyles(doc);
    var state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "pc-lab" }); var refs = { questions: [], controls: {} };
    shell.appendChild(element(doc, "h3", { text: "Buck 纹波实验：占空比、CCM 边界与近似电容纹波" }));
    shell.appendChild(element(doc, "p", { className: "pc-note", text: "理想 Buck、稳态 CCM 公式只作为当前工作区间的模型。电压/电流/频率显示 SI 单位；图中的纹波三角形是可解释示意，不替代开关级波形。" }));
    var predictionHost = element(doc, "div");
    questionSpecs().forEach(function (spec) {
      var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
      var grid = element(doc, "div", { className: "pc-choices" }); var question = { spec: spec, buttons: [] };
      spec.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); });
        question.buttons.push({ choice: choice, node: button }); grid.appendChild(button);
      });
      fieldset.appendChild(grid); predictionHost.appendChild(fieldset); refs.questions.push(question);
    });
    var actions = element(doc, "div", { className: "pc-actions" }); var reveal = element(doc, "button", { type: "button", className: "pc-primary", text: "提交预测并揭晓" }); var reset = element(doc, "button", { type: "button", text: "重置" }); actions.appendChild(reveal); actions.appendChild(reset);
    var feedback = element(doc, "p", { className: "pc-feedback", "aria-live": "polite" }); var resultShell = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "pc-controls" });
    function range(key, label, min, max, step, digits, unit) {
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label }); var output = element(doc, "output", { text: format(state.config[key], digits) + unit });
      refs.controls[key] = { input: input, output: output, digits: digits, unit: unit }; input.addEventListener("input", function () { var next = {}; Object.keys(state.config).forEach(function (name) { next[name] = state.config[name]; }); next[key] = Number(input.value); state.config = normalize(next); state.feedback = ""; render(); });
      return element(doc, "div", { className: "pc-control" }, [element(doc, "label", {}, [label + " = ", output]), input]);
    }
    controls.appendChild(range("vin", "输入电压", 5, 60, 1, 0, " V")); controls.appendChild(range("duty", "占空比 D", 0.1, 0.9, 0.01, 2, "")); controls.appendChild(range("inductanceUh", "电感 L", 20, 300, 5, 0, " uH")); controls.appendChild(range("frequencyKhz", "开关频率 fs", 20, 300, 5, 0, " kHz")); controls.appendChild(range("capacitanceUf", "电容 C", 47, 680, 1, 0, " uF")); controls.appendChild(range("loadA", "负载电流", 0.02, 8, 0.02, 2, " A")); controls.appendChild(range("cycles", "观察周期", 4, 12, 1, 0, " 周期"));
    var svg = svgElement(doc, "svg", { viewBox: "0 0 720 400", role: "img", "aria-label": "Buck PWM、电感电流和输出电压" }); var metrics = element(doc, "div", { className: "pc-metrics" }); var table = element(doc, "div", { className: "pc-table" }); var evidence = element(doc, "div", { className: "pc-evidence" });
    resultShell.appendChild(element(doc, "div", { className: "pc-layout" }, [controls, element(doc, "div", { className: "pc-stage" }, [element(doc, "div", { className: "pc-stage-frame" }, [svg]), metrics, table, evidence])]));
    shell.appendChild(predictionHost); shell.appendChild(actions); shell.appendChild(feedback); shell.appendChild(resultShell); clear(root); root.appendChild(shell);
    reveal.addEventListener("click", function () { var specs = questionSpecs(); if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测；揭晓后才显示纹波图和证据账。"; render(); return; } var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length; state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。参数仍可调整，证据会即时重算。"; render(); announce(api, root, state.feedback); });
    reset.addEventListener("click", function () { state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "" }; render(); announce(api, root, "Buck 纹波预测和账本已重置。"); });
    function render() {
      var result = analyze(state.config); Object.keys(refs.controls).forEach(function (key) { var ref = refs.controls[key]; ref.input.value = result.config[key]; ref.output.textContent = format(result.config[key], ref.digits) + ref.unit; });
      refs.questions.forEach(function (question) { question.buttons.forEach(function (item) { var selected = state.predictions[question.spec.key] === item.choice.value; item.node.setAttribute("aria-pressed", selected ? "true" : "false"); item.node.className = state.revealed && item.choice.value === question.spec.expected ? "pc-correct" : state.revealed && selected ? "pc-wrong" : ""; item.node.textContent = state.revealed && item.choice.value === question.spec.expected ? "✓ " + item.choice.label : item.choice.label; }); });
      feedback.textContent = state.feedback; feedback.className = "pc-feedback" + (state.feedback.indexOf("请先") === 0 ? " pc-wrong" : ""); resultShell.hidden = !state.revealed; if (!state.revealed) return;
      draw(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "平均输出", format(result.vout, 3) + " V")); metrics.appendChild(metric(doc, "电感纹波", format(result.ripple, 3) + " A pp")); metrics.appendChild(metric(doc, "CCM 边界", format(result.boundary, 3) + " A")); metrics.appendChild(metric(doc, "电容纹波", format(result.voltageRipple * 1000, 3) + " mV pp")); metrics.appendChild(metric(doc, "工作模式", result.mode)); renderTable(doc, table, result); clear(evidence); evidence.appendChild(element(doc, "p", { text: "证据返回：Vout≈D Vin、ΔIL=(Vin−Vout)D/(L fs)、ΔVC≈ΔIL/(8 C fs) 只在理想稳态 CCM 和忽略 ESR 的近似下使用。当前负载 " + format(result.config.loadA, 2) + " A 与边界 " + format(result.boundary, 3) + " A 比较后为 " + result.mode + "。若进入 DCM，应换用分段模型。" }));
    }
    render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var base = analyze(DEFAULTS); var repeat = analyze(DEFAULTS); var doubled = analyze({ vin: 24, duty: 0.4, inductanceUh: 100, frequencyKhz: 200, capacitanceUf: 220, loadA: 0.8, cycles: 8 });
    check(JSON.stringify(base) === JSON.stringify(repeat), "deterministic buck analysis");
    check(nearly(base.vout, 9.6, 1e-12), "ideal CCM voltage gain");
    check(nearly(base.ripple, 0.576, 1e-12), "inductor ripple formula");
    check(nearly(base.boundary, 0.288, 1e-12), "CCM boundary load");
    check(nearly(base.voltageRipple, 0.0032727272727, 1e-9), "capacitor ripple approximation");
    check(base.mode === "CCM", "default is CCM");
    check(analyze({ vin: 24, duty: 0.4, inductanceUh: 100, frequencyKhz: 100, capacitanceUf: 220, loadA: 0.1, cycles: 8 }).mode === "DCM likely", "light-load DCM boundary");
    check(nearly(doubled.ripple, base.ripple / 2, 1e-12), "frequency halves ripple");
    check(analyze({ vin: 24, duty: 0.4, inductanceUh: 100, frequencyKhz: 100, capacitanceUf: 220, loadA: base.boundary, cycles: 8 }).mode === "CCM boundary", "exact boundary label");
    var rejected = false; try { normalize({ duty: 1.2 }); } catch (error) { rejected = true; } check(rejected, "invalid duty rejected");
    return { checks: checks };
  }
  var exported = { DEFAULTS: DEFAULTS, normalize: normalize, analyze: analyze, mount: mount, selfTest: selfTest };
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (typeof window !== "undefined" && window.CourseLearning && typeof window.CourseLearning.register === "function") window.CourseLearning.register(LAB_ID, exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log(LAB_ID + " self-test: PASS (" + report.checks + " checks)"); } catch (error) { console.error(LAB_ID + " self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})();
