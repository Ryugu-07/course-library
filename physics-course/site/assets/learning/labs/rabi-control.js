(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("rabi-control", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("rabi-control self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("rabi-control self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var PI = Math.PI;
  var TWO_PI = 2 * PI;
  var MAX_TIME = 4 * PI;
  var STYLE_ID = "cl-rabi-control-styles";
  var SERIAL = 0;
  var DEFAULTS = { omega: 1, delta: 0, t: PI };

  var PRESETS = [
    { id: "resonant-pi", label: "共振 π pulse", omega: 1, delta: 0, t: PI, reading: "理想 π pulse：激发态概率达到 1。" },
    { id: "detuned", label: "失谐 Δ=Ω", omega: 1, delta: 1, t: PI, reading: "相同脉冲时长，但失谐压低振幅上限。" },
    { id: "resonant-two-pi", label: "共振 2π pulse", omega: 1, delta: 0, t: TWO_PI, reading: "完整 Rabi 周期回到基态，Pₑ=0。" }
  ];

  var STYLE_TEXT = [
    ".rc-lab{--rc-blue:var(--cl-blue,#315f9d);--rc-red:var(--cl-red,#b64335);--rc-gold:var(--cl-gold,#9b6a12);--rc-green:var(--cl-green,#39734d);color:var(--fg);line-height:1.55;min-width:0;overflow-wrap:anywhere;}",
    "html[data-theme=dark] .rc-lab{--rc-blue:#83c8ff;--rc-red:#f08c7d;--rc-gold:#e2b458;--rc-green:#72bd8b;}",
    ".rc-lab *,.rc-lab *::before,.rc-lab *::after{box-sizing:border-box}.rc-lab [hidden]{display:none!important}",
    ".rc-lab h3,.rc-lab h4{margin:0;color:var(--fg);letter-spacing:0}.rc-lab h3{font-size:1.18rem}.rc-lab h4{margin-top:15px;font-size:1rem}",
    ".rc-lab .rc-intro,.rc-lab .rc-note,.rc-lab .rc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}",
    ".rc-lab .rc-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--rc-gold);background:var(--bg)}.rc-lab .rc-prediction>strong{display:block;margin-bottom:9px}",
    ".rc-lab fieldset{min-width:0;margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.rc-lab legend{max-width:100%;padding:0 4px;color:var(--fg-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere}",
    ".rc-lab .rc-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.rc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.rc-lab button:hover{border-color:var(--accent)}.rc-lab button[aria-pressed=true],.rc-lab button.rc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.rc-lab button:focus-visible,.rc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".rc-lab .rc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.rc-lab .rc-actions>*{flex:1 1 170px}.rc-lab .rc-feedback{min-height:2em;margin:8px 0;font-weight:700}.rc-lab .rc-pass{color:var(--rc-green)}.rc-lab .rc-warn{color:var(--rc-red)}",
    ".rc-lab .rc-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.rc-lab .rc-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:11px 0}.rc-lab .rc-presets button{font-size:12px}.rc-lab .rc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin:12px 0}.rc-lab .rc-control{display:grid;gap:5px;min-width:0}.rc-lab .rc-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.rc-lab output{color:var(--accent);font-variant-numeric:tabular-nums}.rc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".rc-lab .rc-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0}.rc-lab .rc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.rc-lab .rc-metric:nth-child(1),.rc-lab .rc-metric:nth-child(4){border-top-color:var(--rc-blue)}.rc-lab .rc-metric:nth-child(2),.rc-lab .rc-metric:nth-child(5){border-top-color:var(--rc-gold)}.rc-lab .rc-metric:nth-child(3),.rc-lab .rc-metric:nth-child(6){border-top-color:var(--rc-green)}.rc-lab .rc-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.rc-lab .rc-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}",
    ".rc-lab .rc-chart{min-width:0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.rc-lab svg{display:block;width:100%;height:auto;min-width:620px;color:var(--fg)}.rc-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.rc-lab .rc-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.72}.rc-lab .rc-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72}.rc-lab .rc-ceiling{stroke:var(--rc-gold);stroke-width:1.5;stroke-dasharray:5 4}.rc-lab .rc-curve{stroke:var(--rc-blue);fill:none;stroke-width:3}.rc-lab .rc-current{stroke:var(--rc-red);stroke-width:1.5;stroke-dasharray:5 4}.rc-lab .rc-point{fill:var(--rc-red);stroke:var(--bg);stroke-width:1.5}.rc-lab .rc-chart-label{font-size:11px}.rc-lab .rc-chart-title{font-size:13px;font-weight:750}",
    ".rc-lab .rc-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch}.rc-lab table{width:100%;min-width:820px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.rc-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.rc-lab th,.rc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.rc-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.rc-lab .rc-good{color:var(--rc-green);font-weight:750}.rc-lab .rc-bad{color:var(--rc-red);font-weight:750}.rc-lab .rc-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--rc-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:920px){.rc-lab .rc-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.rc-lab .rc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.rc-lab .rc-choice-row{grid-template-columns:minmax(0,1fr)}}",
    "@media(max-width:650px){.rc-lab .rc-presets,.rc-lab .rc-controls{grid-template-columns:minmax(0,1fr)}.rc-lab .rc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.rc-lab .rc-chart{padding:5px}}",
    "@media(prefers-reduced-motion:reduce){.rc-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function number(value, fallback) {
    if (value === null || value === "") return fallback;
    var parsed = Number(value);
    return finite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-10 : tolerance);
  }

  function format(value, digits) {
    var places = digits === undefined ? 4 : digits;
    if (!finite(value)) return "—";
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function presetById(id) {
    return PRESETS.filter(function (item) { return item.id === id; })[0] || PRESETS[0];
  }

  function normalizeParams(input) {
    var source = input || {};
    return {
      omega: clamp(number(source.omega, DEFAULTS.omega), 0, 3),
      delta: clamp(number(source.delta, DEFAULTS.delta), -3, 3),
      t: clamp(number(source.t, DEFAULTS.t), 0, MAX_TIME)
    };
  }

  function rabiProbability(omega, delta, t) {
    if (!finite(omega) || !finite(delta) || !finite(t)) throw new TypeError("Rabi 参数必须有限");
    if (omega < 0 || t < 0) throw new RangeError("Ω 与 t 不能为负");
    if (omega === 0) return 0;
    var effective = Math.sqrt(omega * omega + delta * delta);
    var amplitude = omega * omega / (omega * omega + delta * delta);
    var value = amplitude * Math.pow(Math.sin(effective * t / 2), 2);
    return clamp(value, 0, 1);
  }

  function classify(params, probability) {
    if (params.omega === 0) return "无耦合";
    if (near(params.delta, 0) && near(params.t, PI / params.omega, 1e-8)) return "共振 π pulse";
    if (near(params.delta, 0) && near(params.t, TWO_PI / params.omega, 1e-8)) return "共振 2π pulse";
    if (Math.abs(params.delta) > 1e-8) return "失谐 Rabi 振荡";
    return probability > 0.5 ? "共振部分脉冲" : "共振短脉冲";
  }

  function evaluate(input) {
    var params = normalizeParams(input);
    var effective = Math.sqrt(params.omega * params.omega + params.delta * params.delta);
    var denominator = params.omega * params.omega + params.delta * params.delta;
    var amplitude = denominator === 0 ? 0 : params.omega * params.omega / denominator;
    var phase = effective * params.t / 2;
    var sineSquared = Math.pow(Math.sin(phase), 2);
    var probability = rabiProbability(params.omega, params.delta, params.t);
    var plotMax = clamp(Math.max(params.t, effective > 0 ? TWO_PI / effective : TWO_PI), 1, MAX_TIME);
    var curve = [];
    var index;
    for (index = 0; index <= 120; index += 1) {
      var time = plotMax * index / 120;
      curve.push({ t: time, probability: rabiProbability(params.omega, params.delta, time) });
    }
    return {
      params: params,
      effectiveOmega: effective,
      denominator: denominator,
      amplitude: amplitude,
      phase: phase,
      sineSquared: sineSquared,
      probability: probability,
      groundProbability: 1 - probability,
      plotMax: plotMax,
      curve: curve,
      classification: classify(params, probability),
      probabilityAtZero: rabiProbability(params.omega, params.delta, 0),
      probabilityAtPi: params.omega === 0 ? 0 : rabiProbability(params.omega, params.delta, PI / params.omega),
      probabilityAtTwoPi: params.omega === 0 ? 0 : rabiProbability(params.omega, params.delta, TWO_PI / params.omega)
    };
  }

  function predictionAnswers() {
    return { resonant: "one", detuned: "ceiling", twoPi: "zero" };
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
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

  function makeElement(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children, doc);
  }

  function makeSvg(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children, doc);
  }

  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function svgText(api, doc, x, y, text, attrs) {
    var merged = { x: x, y: y, className: "rc-chart-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, doc, "text", merged, text);
  }

  function mapLinear(value, min, max, start, end) {
    if (max === min) return (start + end) / 2;
    return start + (value - min) / (max - min) * (end - start);
  }

  function pathFor(points, mapX, mapY) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + mapX(point.t).toFixed(2) + " " + mapY(point.probability).toFixed(2);
    }).join(" ");
  }

  function probabilitySvg(api, doc, result, uid) {
    var width = 760, height = 350, left = 55, right = 22, top = 34, bottom = 48;
    var plotRight = width - right, plotBottom = height - bottom;
    var svg = makeSvg(api, doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-labelledby": uid + "-curve-title " + uid + "-curve-desc" });
    svg.appendChild(makeSvg(api, doc, "title", { id: uid + "-curve-title" }, "二能级 Rabi 激发概率曲线"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: uid + "-curve-desc" }, "蓝线是精确二能级公式，红色虚线标出当前脉冲时间，红点是当前激发态概率，金线是失谐振幅上限。"));
    var x = function (value) { return mapLinear(value, 0, result.plotMax, left, plotRight); };
    var y = function (value) { return mapLinear(value, 0, 1.05, plotBottom, top); };
    [0, 0.5, 1].forEach(function (tick) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: y(tick), x2: plotRight, y2: y(tick), className: tick === 0 ? "rc-axis" : "rc-grid" }));
      svg.appendChild(svgText(api, doc, left - 8, y(tick) + 4, format(tick, 2), { "text-anchor": "end" }));
    });
    [0, result.plotMax / 2, result.plotMax].forEach(function (tick) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: x(tick), y1: top, x2: x(tick), y2: plotBottom, className: "rc-grid" }));
      svg.appendChild(svgText(api, doc, x(tick), plotBottom + 18, format(tick, 2), { "text-anchor": "middle" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: y(result.amplitude), x2: plotRight, y2: y(result.amplitude), className: "rc-ceiling" }));
    svg.appendChild(makeSvg(api, doc, "path", { d: pathFor(result.curve, x, y), className: "rc-curve" }));
    svg.appendChild(makeSvg(api, doc, "line", { x1: x(result.params.t), y1: top, x2: x(result.params.t), y2: plotBottom, className: "rc-current" }));
    svg.appendChild(makeSvg(api, doc, "circle", { cx: x(result.params.t), cy: y(result.probability), r: 5, className: "rc-point" }));
    svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "rc-axis" }));
    svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: top, x2: left, y2: plotBottom, className: "rc-axis" }));
    svg.appendChild(svgText(api, doc, left, 18, "Pₑ(t)：精确二能级模型", { className: "rc-chart-title" }));
    svg.appendChild(svgText(api, doc, plotRight, 18, "蓝：Pₑ　金：Ω²/(Ω²+Δ²)　红：当前 t", { "text-anchor": "end" }));
    svg.appendChild(svgText(api, doc, (left + plotRight) / 2, height - 10, "时间 t（角频率单位）", { "text-anchor": "middle" }));
    svg.appendChild(svgText(api, doc, 15, (top + plotBottom) / 2, "激发态概率", { transform: "rotate(-90 15 " + ((top + plotBottom) / 2) + ")", "text-anchor": "middle" }));
    return svg;
  }

  function metric(api, doc, label, value) {
    return makeElement(api, doc, "div", { className: "rc-metric" }, [
      makeElement(api, doc, "span", { text: label }),
      makeElement(api, doc, "strong", { text: value })
    ]);
  }

  function tableRow(api, doc, cells, header) {
    var row = makeElement(api, doc, "tr", {});
    cells.forEach(function (cell, index) {
      row.appendChild(makeElement(api, doc, header && index === 0 ? "th" : "td", header && index === 0 ? { scope: "row" } : {}, cell));
    });
    return row;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "rc-" + (++SERIAL);
    var state = { omega: DEFAULTS.omega, delta: DEFAULTS.delta, t: DEFAULTS.t };
    var predictions = { resonant: null, detuned: null, twoPi: null };
    var revealed = false;
    var shell = makeElement(api, doc, "div", { className: "rc-lab" });
    shell.appendChild(makeElement(api, doc, "h3", { text: "二能级 Rabi 控制：π、失谐与 2π" }));
    shell.appendChild(makeElement(api, doc, "p", { className: "rc-intro", text: "模型只追踪一个相干二能级原子；先预测三种脉冲，再把有效频率、振幅上限和相位因子逐项打开。" }));

    var presetRow = makeElement(api, doc, "div", { className: "rc-presets", role: "group", "aria-label": "Rabi 预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        state = { omega: preset.omega, delta: preset.delta, t: preset.t };
        lock("已切换脉冲预设，请重新预测。", true);
        render();
      });
      presetButtons.push({ id: preset.id, node: button, preset: preset });
      presetRow.appendChild(button);
    });
    shell.appendChild(presetRow);

    var controls = makeElement(api, doc, "div", { className: "rc-controls" });
    var inputRefs = {};
    [["omega", "Ω 驱动角频率", 0, 3, 0.01], ["delta", "Δ 失谐", -3, 3, 0.01], ["t", "脉冲时间 t", 0, MAX_TIME, 0.01]].forEach(function (definition) {
      var key = definition[0], id = uid + "-" + key;
      var output = makeElement(api, doc, "output", { for: id, text: "" });
      var input = makeElement(api, doc, "input", { id: id, type: "range", min: String(definition[2]), max: String(definition[3]), step: String(definition[4]), "aria-label": definition[1] });
      input.addEventListener("input", function () {
        state[key] = Number(input.value);
        lock("参数已改变，请重新预测。", true);
        render();
      });
      inputRefs[key] = { input: input, output: output };
      controls.appendChild(makeElement(api, doc, "div", { className: "rc-control" }, [
        makeElement(api, doc, "label", { htmlFor: id }, [definition[1] + "：", output]),
        input
      ]));
    });
    shell.appendChild(controls);

    var form = makeElement(api, doc, "form", { className: "rc-prediction", "aria-labelledby": uid + "-prediction-title" });
    form.appendChild(makeElement(api, doc, "strong", { id: uid + "-prediction-title", text: "预测门：先写下三个脉冲的终点" }));
    var questions = [
      { key: "resonant", prompt: "共振 π pulse（Ω=1, Δ=0, t=π）结束时 Pₑ 是？", choices: [["one", "1：完全激发"], ["half", "1/2：一半激发"], ["zero", "0：回到基态"]] },
      { key: "detuned", prompt: "失谐 Δ=Ω、同样 t=π 时，最关键的变化是？", choices: [["one", "仍可达到 1"], ["ceiling", "振幅上限降为 Ω²/(Ω²+Δ²)"], ["zero", "激发概率恒为 0"]] },
      { key: "twoPi", prompt: "共振 2π pulse（Ω=1, Δ=0, t=2π）结束时 Pₑ 是？", choices: [["one", "1：仍在激发态"], ["half", "1/2：相位无关"], ["zero", "0：完成一周期回到基态"]] }
    ];
    var choiceButtons = [];
    questions.forEach(function (question) {
      var fieldset = makeElement(api, doc, "fieldset", {});
      fieldset.appendChild(makeElement(api, doc, "legend", { text: question.prompt }));
      var row = makeElement(api, doc, "div", { className: "rc-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          predictions[question.key] = choice[0];
          updatePredictionButtons();
          if (!revealed) feedback.textContent = "预测已记录，三项都选好后揭示账本。";
        });
        choiceButtons.push({ key: question.key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      form.appendChild(fieldset);
    });
    var actions = makeElement(api, doc, "div", { className: "rc-actions" });
    var reveal = makeElement(api, doc, "button", { type: "submit", className: "rc-primary" }, "提交预测并揭示");
    var reset = makeElement(api, doc, "button", { type: "button" }, "重置");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    form.appendChild(actions);
    var feedback = makeElement(api, doc, "p", { className: "rc-feedback", role: "status", "aria-live": "polite", text: "请完成三项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealedSection = makeElement(api, doc, "section", { className: "rc-revealed", hidden: "hidden", "aria-label": "Rabi 结果账本" });
    var metrics = makeElement(api, doc, "div", { className: "rc-metrics" });
    var chart = makeElement(api, doc, "div", { className: "rc-chart" });
    var ledgerWrap = makeElement(api, doc, "div", { className: "rc-ledger" });
    var table = makeElement(api, doc, "table", {});
    table.appendChild(makeElement(api, doc, "caption", { text: "透明账本：Pₑ = 振幅上限 × sin²(有效角频率 × t / 2)。" }));
    table.appendChild(makeElement(api, doc, "thead", {}, [tableRow(api, doc, ["情形", "Ω", "Δ", "t", "Ω_eff", "振幅上限", "Pₑ", "读法"], false)]));
    var tbody = makeElement(api, doc, "tbody", {});
    table.appendChild(tbody);
    ledgerWrap.appendChild(table);
    var interpretation = makeElement(api, doc, "p", { className: "rc-interpretation", role: "status", "aria-live": "polite" });
    revealedSection.appendChild(metrics);
    revealedSection.appendChild(chart);
    revealedSection.appendChild(ledgerWrap);
    revealedSection.appendChild(interpretation);
    shell.appendChild(revealedSection);
    root.replaceChildren(shell);

    function updatePredictionButtons() {
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", predictions[item.key] === item.value ? "true" : "false"); });
    }

    function lock(message, shouldAnnounce) {
      revealed = false;
      predictions = { resonant: null, detuned: null, twoPi: null };
      updatePredictionButtons();
      revealedSection.setAttribute("hidden", "hidden");
      feedback.className = "rc-feedback";
      feedback.textContent = message || "请完成三项预测。";
      if (shouldAnnounce) announce(api, root, feedback.textContent);
    }

    function render() {
      var result = evaluate(state);
      Object.keys(inputRefs).forEach(function (key) {
        inputRefs[key].input.value = String(state[key]);
        inputRefs[key].output.textContent = format(state[key], 3);
      });
      presetButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", near(item.preset.omega, state.omega, 1e-8) && near(item.preset.delta, state.delta, 1e-8) && near(item.preset.t, state.t, 1e-8) ? "true" : "false");
      });
      if (!revealed) return;
      metrics.replaceChildren(
        metric(api, doc, "分类", result.classification),
        metric(api, doc, "Ω_eff", format(result.effectiveOmega, 5)),
        metric(api, doc, "振幅上限", format(result.amplitude, 5)),
        metric(api, doc, "相位 Ω_eff t/2", format(result.phase, 5)),
        metric(api, doc, "Pₑ(t)", format(result.probability, 5)),
        metric(api, doc, "P_g(t)", format(result.groundProbability, 5))
      );
      chart.replaceChildren(probabilitySvg(api, doc, result, uid));
      tbody.replaceChildren();
      PRESETS.forEach(function (preset) {
        var presetResult = evaluate(preset);
        tbody.appendChild(tableRow(api, doc, [preset.label, format(preset.omega, 2), format(preset.delta, 2), format(preset.t, 4), format(presetResult.effectiveOmega, 4), format(presetResult.amplitude, 4), format(presetResult.probability, 5), preset.reading], true));
      });
      interpretation.textContent = "当前曲线和三行比较都来自精确公式 Pₑ(t)=Ω²/(Ω²+Δ²)·sin²(Ω_eff t/2)。它假设 rotating-wave、相干二能级、无自发辐射/退相干和无耗散；不是完整激光冷却、BEC 或光晶格动力学。";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return !predictions[question.key]; });
      if (missing.length) {
        feedback.className = "rc-feedback rc-warn";
        feedback.textContent = "还差 " + missing.length + " 项预测。";
        return;
      }
      var answers = predictionAnswers();
      var correct = questions.filter(function (question) { return predictions[question.key] === answers[question.key]; }).length;
      revealed = true;
      revealedSection.removeAttribute("hidden");
      render();
      feedback.className = "rc-feedback " + (correct === questions.length ? "rc-pass" : "rc-warn");
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项命中。振幅上限与相位因子已经分账。";
      announce(api, root, feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state = { omega: DEFAULTS.omega, delta: DEFAULTS.delta, t: DEFAULTS.t };
      lock("已重置，请重新完成三项预测。", true);
      render();
    });
    updatePredictionButtons();
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("rabi-control self-test failed: " + message);
    }
    assert(rabiProbability(1, 0, 0) === 0, "t=0 endpoint");
    assert(Math.abs(rabiProbability(1, 0, PI) - 1) < 1e-12, "resonant pi pulse formula");
    assert(Math.abs(rabiProbability(1, 0, TWO_PI)) < 1e-12, "resonant 2pi endpoint");
    assert(Math.abs(rabiProbability(1, 1, PI) - 0.5 * Math.pow(Math.sin(Math.PI / Math.sqrt(2)), 2)) < 1e-12, "detuned formula");
    assert(rabiProbability(1, 1, PI) <= 0.5 + 1e-12, "detuned amplitude ceiling");
    assert(rabiProbability(0, 2, 10) === 0, "zero coupling endpoint");
    assert(Math.abs(rabiProbability(1, -1, PI) - rabiProbability(1, 1, PI)) < 1e-12, "detuning sign symmetry");
    assert(normalizeParams({ omega: -4, delta: Infinity, t: -1 }).omega === 0, "illegal omega clamp");
    assert(normalizeParams({ omega: 99, delta: "bad", t: 99 }).omega === 3, "upper omega and invalid delta");
    assert(normalizeParams({ omega: 1, delta: 0, t: 0 }).t === 0, "time lower endpoint");
    assert(normalizeParams({ omega: 1, delta: 0, t: 99 }).t === MAX_TIME, "time upper endpoint");
    var threwType = false;
    var threwRange = false;
    try { rabiProbability(NaN, 0, 1); } catch (error) { threwType = error instanceof TypeError; }
    try { rabiProbability(-1, 0, 1); } catch (error) { threwRange = error instanceof RangeError; }
    assert(threwType && threwRange, "illegal direct formula inputs");
    var piCase = evaluate(PRESETS[0]);
    var detuned = evaluate(PRESETS[1]);
    var twoPi = evaluate(PRESETS[2]);
    assert(Math.abs(piCase.probability - 1) < 1e-12 && piCase.classification === "共振 π pulse", "pi preset answer");
    assert(detuned.amplitude === 0.5 && detuned.probability < piCase.probability, "detuned preset answer");
    assert(Math.abs(twoPi.probability) < 1e-12 && twoPi.classification === "共振 2π pulse", "2pi preset answer");
    assert(piCase.curve.length === 121 && piCase.curve[0].probability === 0, "curve endpoint and sample count");
    assert(predictionAnswers().resonant === "one" && predictionAnswers().detuned === "ceiling" && predictionAnswers().twoPi === "zero", "prediction answers");
    assert(JSON.stringify(evaluate(DEFAULTS)) === JSON.stringify(evaluate(DEFAULTS)), "deterministic evaluation");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PI: PI,
    TWO_PI: TWO_PI,
    MAX_TIME: MAX_TIME,
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    normalizeParams: normalizeParams,
    rabiProbability: rabiProbability,
    evaluate: evaluate,
    predictionAnswers: predictionAnswers,
    selfTest: selfTest,
    mount: mount
  };
});
