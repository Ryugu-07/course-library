(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (
    root &&
    root.CourseLearning &&
    typeof root.CourseLearning.register === "function"
  ) {
    root.CourseLearning.register("freezeout-race", exported.mount);
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
        "freezeout-race self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("freezeout-race self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-freezeout-race-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var X_MIN = 0.1;
  var X_MAX = 10;

  var PRESETS = [
    {
      id: "weak-radiation",
      label: "弱作用 × 辐射期",
      m: 5,
      n: 2,
      note: "Γ/H=x^3：冷却后比值下降，作为标准 freeze-out 方向 toy。"
    },
    {
      id: "gentle-freeze",
      label: "温和 freeze-out toy",
      m: 3,
      n: 2,
      note: "Γ/H=x：仍是 freeze-out 方向，但斜率较缓。"
    },
    {
      id: "equal-exponent",
      label: "equal-exponent：m=n",
      m: 2,
      n: 2,
      note: "Γ/H=1 全程恒定，没有孤立 crossing。"
    },
    {
      id: "recoupling",
      label: "recoupling toy：m<n",
      m: 1,
      n: 3,
      note: "Γ/H=x^(-2)：冷却后比值上升，方向与 freeze-out 相反。"
    }
  ];

  var STYLE_TEXT = [
    ".fr-lab{--fr-blue:#315f9d;--fr-gold:#9b6a12;--fr-green:#39734d;--fr-red:#b64335;max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".fr-lab *,.fr-lab *::before,.fr-lab *::after{box-sizing:border-box;}.fr-lab [hidden]{display:none!important;}.fr-lab h2,.fr-lab h3,.fr-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.fr-lab h2{font-size:1.25rem;}.fr-lab h3{font-size:1.05rem;}.fr-lab h4{font-size:1rem;}",
    ".fr-lab p{margin:8px 0;}.fr-lab .fr-note,.fr-lab .fr-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;}.fr-lab .fr-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--fr-gold);background:var(--bg);}",
    ".fr-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);}.fr-lab legend{max-width:100%;padding:0 4px;color:var(--fg-soft);font-size:13px;font-weight:750;line-height:1.5;}.fr-lab .fr-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".fr-lab button,.fr-lab select,.fr-lab input{font:inherit;}.fr-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.fr-lab button:hover{border-color:var(--accent);}.fr-lab button:focus-visible,.fr-lab select:focus-visible,.fr-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.fr-lab button[aria-pressed=true],.fr-lab button.fr-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}",
    ".fr-lab .fr-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;}.fr-lab .fr-actions>*{flex:1 1 170px;}.fr-lab .fr-feedback{min-height:2em;margin:8px 0;font-weight:700;}.fr-lab .fr-pass{color:var(--fr-green);}.fr-lab .fr-warn{color:var(--fr-red);}",
    ".fr-lab .fr-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.fr-lab .fr-layout{display:grid;grid-template-columns:minmax(210px,.62fr) minmax(0,1.38fr);gap:14px;align-items:start;}.fr-lab .fr-controls,.fr-lab .fr-stage{min-width:0;}.fr-lab .fr-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.fr-lab .fr-control{display:grid;gap:5px;}.fr-lab .fr-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700;}.fr-lab .fr-control select,.fr-lab .fr-control input[type=number]{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font-variant-numeric:tabular-nums;}.fr-lab .fr-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.fr-lab output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".fr-lab .fr-stage{display:grid;gap:12px;}.fr-lab .fr-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.fr-lab .fr-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.fr-lab .fr-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.fr-lab .fr-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.68;}.fr-lab .fr-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.75;}.fr-lab .fr-curve{fill:none;stroke:var(--fr-blue);stroke-width:3;stroke-linecap:round;}.fr-lab .fr-crossing{stroke:var(--fr-gold);stroke-width:1.8;stroke-dasharray:6 4;}.fr-lab .fr-current{stroke:var(--fr-red);stroke-width:1.8;stroke-dasharray:3 4;}.fr-lab .fr-crossing-point{fill:var(--fr-gold);stroke:var(--bg);stroke-width:2;}.fr-lab .fr-current-point{fill:var(--fr-red);stroke:var(--bg);stroke-width:2;}",
    ".fr-lab .fr-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:0;}.fr-lab .fr-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg);}.fr-lab .fr-metric:nth-child(4n+1){border-color:var(--fr-blue);}.fr-lab .fr-metric:nth-child(4n+2){border-color:var(--fr-gold);}.fr-lab .fr-metric:nth-child(4n+3){border-color:var(--fr-green);}.fr-lab .fr-metric:nth-child(4n){border-color:var(--fr-red);}.fr-lab .fr-metric span{display:block;color:var(--fg-soft);font-size:11px;line-height:1.4;}.fr-lab .fr-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".fr-lab .fr-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}.fr-lab table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.fr-lab caption{padding:7px 0;text-align:left;color:var(--fg-soft);font-weight:700;}.fr-lab th,.fr-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.fr-lab th{color:var(--fg-soft);font-size:11.5px;}.fr-lab .fr-callout{margin:0;padding:11px 13px;border-left:3px solid var(--fr-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}.fr-lab .fr-boundary{border-left-color:var(--fr-red);}.fr-lab .fr-formula{max-width:100%;overflow-x:auto;padding:9px 11px;border-left:3px solid var(--accent);background:var(--bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.65;}",
    "@media(max-width:850px){.fr-lab .fr-layout{grid-template-columns:minmax(0,1fr);}}@media(max-width:620px){.fr-lab .fr-choice-grid{grid-template-columns:minmax(0,1fr);}.fr-lab .fr-frame{padding:4px;}.fr-lab table{font-size:11.5px;}.fr-lab th,.fr-lab td{padding-left:5px;padding-right:5px;}}@media(prefers-reduced-motion:reduce){.fr-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function validateX(value) {
    value = Number(value);
    if (!finite(value) || value <= 0) {
      throw new RangeError("x must be a finite positive number");
    }
    return value;
  }

  function validateExponent(value, name) {
    value = Number(value);
    if (!finite(value) || value < -20 || value > 20) {
      throw new RangeError((name || "exponent") + " must be finite and in [-20, 20]");
    }
    return value;
  }

  function exponentDelta(m, n) {
    return validateExponent(m, "m") - validateExponent(n, "n");
  }

  function rateRatio(x, m, n) {
    x = validateX(x);
    var delta = exponentDelta(m, n);
    return Math.pow(x, delta);
  }

  function directionKey(delta) {
    if (delta > EPS) return "decrease";
    if (delta < -EPS) return "increase";
    return "flat";
  }

  function directionLabel(delta) {
    var key = directionKey(delta);
    return key === "decrease" ? "下降（freeze-out 方向）" : key === "increase" ? "上升（recoupling 方向）" : "保持为 1（无方向）";
  }

  function regimeLabel(delta) {
    var key = directionKey(delta);
    return key === "decrease" ? "freeze-out 方向" : key === "increase" ? "recoupling 方向" : "equal-exponent：无孤立 crossing";
  }

  function crossing(delta) {
    return directionKey(delta) === "flat" ? null : 1;
  }

  function quantifier(x) {
    x = validateX(x);
    if (near(x, 1, 1e-8)) return "x=1";
    return x > 1 ? "x>1" : "x<1";
  }

  function diagnosis(ratio) {
    if (near(ratio, 1, 1e-9)) return "量级边界：Γ/H≈1";
    return ratio > 1 ? "平衡侧：Γ/H>1" : "脱耦候选：Γ/H<1";
  }

  function analyze(m, n, x) {
    m = validateExponent(m, "m");
    n = validateExponent(n, "n");
    x = validateX(x);
    var delta = m - n;
    var ratio = Math.pow(x, delta);
    return {
      m: m,
      n: n,
      delta: delta,
      x: x,
      ratio: ratio,
      direction: directionLabel(delta),
      directionKey: directionKey(delta),
      regime: regimeLabel(delta),
      crossing: crossing(delta),
      diagnosis: diagnosis(ratio),
      quantifier: quantifier(x)
    };
  }

  function ledger(m, n, currentX) {
    m = validateExponent(m, "m");
    n = validateExponent(n, "n");
    currentX = validateX(currentX);
    var values = [10, 2, 1, 0.5, 0.1];
    if (!values.some(function (value) { return near(value, currentX, 1e-8); })) {
      values.push(currentX);
    }
    values.sort(function (left, right) { return right - left; });
    return values.map(function (x) {
      var result = analyze(m, n, x);
      return {
        x: x,
        ratio: result.ratio,
        diagnosis: result.diagnosis,
        quantifier: result.quantifier
      };
    });
  }

  function predictionAnswers() {
    return {
      direction: "decrease",
      atOne: "one",
      equal: "no",
      recoupling: "recouple"
    };
  }

  function formatValue(value, digits) {
    if (!finite(value)) return "—";
    if (Math.abs(value) < 5e-10) return "0";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function makeTable(api, headers, rows, label, caption) {
    var table = api.el("table", { "aria-label": label });
    if (caption) table.appendChild(api.el("caption", {}, caption));
    var headRow = api.el("tr");
    headers.forEach(function (header) {
      headRow.appendChild(api.el("th", { scope: "col" }, header));
    });
    table.appendChild(api.el("thead", {}, headRow));
    var body = api.el("tbody");
    rows.forEach(function (row) {
      var tableRow = api.el("tr");
      row.forEach(function (cell, index) {
        tableRow.appendChild(api.el(index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell));
      });
      body.appendChild(tableRow);
    });
    table.appendChild(body);
    return table;
  }

  function metric(api, label, value) {
    return api.el("div", { className: "fr-metric" }, [
      api.el("span", {}, label),
      api.el("strong", {}, value)
    ]);
  }

  function mapLinear(value, low, high, pixelLow, pixelHigh) {
    return pixelLow + (value - low) / (high - low) * (pixelHigh - pixelLow);
  }

  function log10(value) {
    return Math.log(value) / Math.LN10;
  }

  function logCurveSvg(api, result) {
    var width = 740;
    var height = 380;
    var left = 68;
    var right = 710;
    var top = 48;
    var bottom = 310;
    var ySpan = Math.max(1.2, Math.abs(result.delta) * 1.25 + 0.35);
    var svg = api.svg("svg", {
      className: "fr-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-label": "log x 与 log Γ/H 的 freeze-out rate-race 曲线"
    });
    svg.appendChild(api.svg("title", {}, "log x / log Γ/H rate-race 曲线"));
    svg.appendChild(api.svg("desc", {}, "蓝线是 Γ/H=x^(m-n)，金线标出 x=1 的归一化 crossing，红线与红点标出当前 x。"));
    function px(logX) { return mapLinear(logX, -1, 1, left, right); }
    function py(logRatio) { return mapLinear(logRatio, -ySpan, ySpan, bottom, top); }

    [-1, 0, 1].forEach(function (tick) {
      var x = px(tick);
      svg.appendChild(api.svg("line", { x1: x, x2: x, y1: top, y2: bottom, className: "fr-grid" }));
      svg.appendChild(api.svg("text", { x: x, y: bottom + 21, "font-size": "11", "text-anchor": "middle" }, "log x=" + tick));
    });
    [-ySpan, 0, ySpan].forEach(function (tick) {
      var y = py(tick);
      svg.appendChild(api.svg("line", { x1: left, x2: right, y1: y, y2: y, className: "fr-grid" }));
      svg.appendChild(api.svg("text", { x: left - 9, y: y + 4, "font-size": "11", "text-anchor": "end" }, formatValue(tick, 2)));
    });
    svg.appendChild(api.svg("line", { x1: left, x2: left, y1: top, y2: bottom, className: "fr-axis" }));
    svg.appendChild(api.svg("line", { x1: left, x2: right, y1: bottom, y2: bottom, className: "fr-axis" }));

    var points = [];
    for (var index = 0; index <= 100; index += 1) {
      var logX = -1 + 2 * index / 100;
      points.push((index ? "L" : "M") + px(logX) + " " + py(result.delta * logX));
    }
    svg.appendChild(api.svg("path", { d: points.join(" "), className: "fr-curve" }));

    var crossingX = px(0);
    svg.appendChild(api.svg("line", { x1: crossingX, x2: crossingX, y1: top, y2: bottom, className: "fr-crossing" }));
    svg.appendChild(api.svg("circle", { cx: crossingX, cy: py(0), r: 5, className: "fr-crossing-point" }));
    svg.appendChild(api.svg("text", { x: crossingX + 8, y: top + 14, "font-size": "11" }, result.crossing === null ? "x=1：全程 Γ/H=1" : "crossing x=1"));

    var currentLogX = log10(result.x);
    var currentLogRatio = log10(result.ratio);
    var currentX = px(currentLogX);
    var currentY = py(currentLogRatio);
    svg.appendChild(api.svg("line", { x1: currentX, x2: currentX, y1: top, y2: bottom, className: "fr-current" }));
    svg.appendChild(api.svg("circle", { cx: currentX, cy: currentY, r: 5.5, className: "fr-current-point" }));
    svg.appendChild(api.svg("text", { x: Math.min(right - 4, currentX + 8), y: Math.max(top + 31, currentY - 9), "font-size": "11" }, "当前 x=" + formatValue(result.x, 3)));
    svg.appendChild(api.svg("text", { x: left, y: 22, "font-size": "13", "font-weight": "700" }, "log(Γ/H)=(m−n)log(x)"));
    svg.appendChild(api.svg("text", { x: right, y: 22, "font-size": "10", "text-anchor": "end" }, "蓝：曲线  金：归一化 crossing  红：当前点"));
    svg.appendChild(api.svg("text", { x: right, y: height - 12, "font-size": "10", "text-anchor": "end" }, "横轴 log x；纵轴 log Γ/H"));
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !api || typeof api.el !== "function" || typeof api.svg !== "function") return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "fr-" + INSTANCE;
    var state = {
      presetId: PRESETS[0].id,
      m: PRESETS[0].m,
      n: PRESETS[0].n,
      x: 0.5,
      predictions: {},
      revealed: false,
      score: null,
      inputError: ""
    };

    root.classList.add("fr-lab");
    var heading = api.el("h2", { id: prefix + "-title" }, "Freeze-out rate race：先猜方向，再看双对数账本");
    var intro = api.el("p", { className: "fr-note" }, "固定无量纲 toy：x=T/T_f，Γ/H=x^(m−n)，并归一化为 x=1 时 Γ/H=1。冷却从 x>1 走向 x<1；实验不直接计算丰度。");
    var prompt = api.el("div", { className: "fr-prompt" });
    prompt.appendChild(api.el("strong", {}, "先过预测门：结果、曲线与 ledger 在揭晓前隐藏。"));
    var questions = [
      {
        key: "direction",
        prompt: "若 m>n，冷却从 x>1 到 x<1 时 Γ/H 会怎样？",
        choices: [["decrease", "下降"], ["flat", "保持不变"], ["increase", "上升"]]
      },
      {
        key: "atOne",
        prompt: "按本实验的归一化，x=1 时 Γ/H 是多少？",
        choices: [["one", "1"], ["zero", "0"], ["depends", "由 m,n 决定"]]
      },
      {
        key: "equal",
        prompt: "m=n 是否足以定义一个冻结时刻？",
        choices: [["yes", "足以定义"], ["no", "不够：全程 Γ/H=1"], ["x", "只在 x=1 足够"]]
      },
      {
        key: "recoupling",
        prompt: "m<n 且冷却后 Γ/H 上升，这是什么方向？",
        choices: [["freeze", "freeze-out"], ["recouple", "recoupling"], ["none", "都不是"]]
      }
    ];
    var choiceButtons = {};
    questions.forEach(function (question) {
      var fieldset = api.el("fieldset");
      fieldset.appendChild(api.el("legend", {}, question.prompt));
      var grid = api.el("div", { className: "fr-choice-grid", role: "group", "aria-label": question.prompt });
      choiceButtons[question.key] = {};
      question.choices.forEach(function (choice) {
        var button = api.el("button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice[0];
          renderPrediction();
        });
        choiceButtons[question.key][choice[0]] = button;
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      prompt.appendChild(fieldset);
    });

    var actions = api.el("div", { className: "fr-actions" });
    var reveal = api.el("button", { type: "button", className: "fr-primary", disabled: true }, "核对预测并揭晓");
    var reset = api.el("button", { type: "button" }, "重置");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    var feedback = api.el("p", { className: "fr-feedback", "aria-live": "polite" }, "四项预测都回答后才能揭晓。");
    prompt.appendChild(actions);
    prompt.appendChild(feedback);

    var presetSelect = api.el("select", { id: prefix + "-preset", "aria-label": "rate-race 预设" });
    PRESETS.forEach(function (preset) {
      presetSelect.appendChild(api.el("option", { value: preset.id }, preset.label));
    });
    presetSelect.appendChild(api.el("option", { value: "custom" }, "自定义 m,n"));
    var mInput = api.el("input", { id: prefix + "-m", type: "number", min: "-20", max: "20", step: "0.5", value: "5", "aria-label": "Γ 的指数 m" });
    var nInput = api.el("input", { id: prefix + "-n", type: "number", min: "-20", max: "20", step: "0.5", value: "2", "aria-label": "H 的指数 n" });
    var xInput = api.el("input", { id: prefix + "-x", type: "range", min: String(X_MIN), max: String(X_MAX), step: "0.1", value: "0.5", "aria-label": "当前 x=T/T_f" });
    var xOutput = api.el("output", { htmlFor: prefix + "-x" }, "0.5");
    var controls = api.el("div", { className: "fr-controls" });
    controls.appendChild(api.el("div", { className: "fr-control" }, [
      api.el("label", { htmlFor: prefix + "-preset" }, "预设"),
      presetSelect
    ]));
    controls.appendChild(api.el("div", { className: "fr-control" }, [
      api.el("label", { htmlFor: prefix + "-m" }, "Γ 指数 m"),
      mInput
    ]));
    controls.appendChild(api.el("div", { className: "fr-control" }, [
      api.el("label", { htmlFor: prefix + "-n" }, "H 指数 n"),
      nInput
    ]));
    var xControl = api.el("div", { className: "fr-control" });
    xControl.appendChild(api.el("label", { htmlFor: prefix + "-x" }, ["当前 x=T/T_f：", xOutput]));
    xControl.appendChild(xInput);
    controls.appendChild(xControl);
    controls.appendChild(api.el("p", { className: "fr-note" }, "m,n 只控制幂律斜率；比例常数已归一化。x=1 是量级参照，不是自动生成的实测冻结温度。"));

    var output = api.el("div", { className: "fr-stage" });
    var resultShell = api.el("section", { className: "fr-results", hidden: true, "aria-live": "polite" }, [
      api.el("div", { className: "fr-layout" }, [controls, output])
    ]);
    root.replaceChildren(heading, intro, prompt, resultShell);

    function currentResult() {
      return analyze(state.m, state.n, state.x);
    }

    function renderPrediction() {
      var answers = predictionAnswers();
      questions.forEach(function (question) {
        Object.keys(choiceButtons[question.key]).forEach(function (key) {
          choiceButtons[question.key][key].setAttribute("aria-pressed", state.predictions[question.key] === key ? "true" : "false");
        });
      });
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      reveal.disabled = missing.length > 0 || state.revealed;
      if (state.revealed) {
        feedback.className = "fr-feedback " + (state.score === questions.length ? "fr-pass" : "fr-warn");
        feedback.textContent = "已揭晓：" + state.score + "/" + questions.length + " 命中；现在可切换预设与当前 x。";
        return answers;
      }
      feedback.className = "fr-feedback" + (state.inputError ? " fr-warn" : "");
      feedback.textContent = state.inputError || (missing.length ? "还差 " + missing.length + " 项预测；提交前隐藏结果。" : "四项都已回答，可以揭晓。");
      return answers;
    }

    function renderResults(result) {
      output.replaceChildren();
      var metrics = api.el("div", { className: "fr-metrics", "aria-label": "rate-race 关键读数" });
      [
        ["m−n", formatValue(result.delta, 3)],
        ["当前 x", formatValue(result.x, 3)],
        ["当前 Γ/H", formatValue(result.ratio, 6)],
        ["冷却方向", result.direction],
        ["crossing", result.crossing === null ? "无孤立 crossing" : "x=1"],
        ["当前诊断", result.diagnosis]
      ].forEach(function (item) { metrics.appendChild(metric(api, item[0], item[1])); });
      output.appendChild(api.el("h3", {}, "透明账本"));
      output.appendChild(metrics);
      output.appendChild(api.el("p", { className: "fr-formula" }, "x=T/T_f；Γ/H=x^(" + formatValue(result.delta, 3) + ")；x=1 时 Γ/H=1；当前量词：" + result.quantifier));
      var frame = api.el("div", { className: "fr-frame" });
      frame.appendChild(logCurveSvg(api, result));
      output.appendChild(frame);
      var rows = ledger(result.m, result.n, result.x).map(function (row) {
        return [formatValue(row.x, 3), formatValue(row.ratio, 6), row.diagnosis, row.quantifier];
      });
      var ledgerWrap = api.el("div", { className: "fr-ledger" });
      ledgerWrap.appendChild(makeTable(api, ["x=T/T_f", "Γ/H", "平衡 / 脱耦诊断", "量词"], rows, "freeze-out rate-race 透明账本", "ledger：当前幂律下的代表性温度行"));
      output.appendChild(ledgerWrap);
      output.appendChild(api.el("div", { className: "fr-callout fr-boundary" }, "边界与迁移：比例常数被归一化；真实 Γ、H 会随 g_*、质量阈值、反应道、化学势和非热分布改变。Γ/H≈1 只是量级判据，不是瞬时开关；本 toy 不直接计算 BBN 丰度、WIMP relic 或 CMB。"));
    }

    function render() {
      presetSelect.value = state.presetId;
      mInput.value = String(state.m);
      nInput.value = String(state.n);
      xInput.value = String(state.x);
      xOutput.textContent = formatValue(state.x, 3);
      renderPrediction();
      if (!state.revealed) {
        resultShell.hidden = true;
        return;
      }
      resultShell.hidden = false;
      renderResults(currentResult());
    }

    function applyPreset(id) {
      var preset = PRESETS.filter(function (item) { return item.id === id; })[0];
      if (!preset) return;
      state.presetId = preset.id;
      state.m = preset.m;
      state.n = preset.n;
      state.inputError = "";
    }

    presetSelect.addEventListener("change", function () {
      if (presetSelect.value !== "custom") applyPreset(presetSelect.value);
      else state.presetId = "custom";
      render();
    });
    [[mInput, "m"], [nInput, "n"]].forEach(function (pair) {
      pair[0].addEventListener("input", function () {
        var value = Number(pair[0].value);
        if (!finite(value) || value < -20 || value > 20) {
          state.inputError = "m、n 必须是 [-20,20] 内的有限数。";
          render();
          return;
        }
        state[pair[1]] = value;
        state.presetId = "custom";
        state.inputError = "";
        render();
      });
    });
    xInput.addEventListener("input", function () {
      state.x = Number(xInput.value);
      state.inputError = "";
      render();
    });
    reveal.addEventListener("click", function () {
      var answers = predictionAnswers();
      var correct = questions.filter(function (question) {
        return state.predictions[question.key] === answers[question.key];
      }).length;
      state.score = correct;
      state.revealed = true;
      render();
      if (api.announce) api.announce(root, feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state.presetId = PRESETS[0].id;
      state.m = PRESETS[0].m;
      state.n = PRESETS[0].n;
      state.x = 0.5;
      state.predictions = {};
      state.revealed = false;
      state.score = null;
      state.inputError = "";
      render();
      if (api.announce) api.announce(root, "rate-race 实验已重置。");
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("freezeout-race self-test failed: " + message);
    }
    function assertThrows(fn, message) {
      var threw = false;
      try { fn(); } catch (error) { threw = true; }
      assert(threw, message);
    }

    assert(near(rateRatio(1, 5, 2), 1, 1e-12), "normalization at x=1");
    assert(near(rateRatio(2, 5, 2), 8, 1e-12), "weak-radiation high-temperature endpoint");
    assert(near(rateRatio(0.5, 5, 2), 0.125, 1e-12), "weak-radiation cooled endpoint");
    assert(directionKey(3) === "decrease", "m>n cooling direction");
    assert(directionKey(0) === "flat", "m=n cooling direction");
    assert(directionKey(-2) === "increase", "m<n cooling direction");
    assert(crossing(3) === 1, "non-equal crossing");
    assert(crossing(0) === null, "equal exponent has no isolated crossing");
    var weak = analyze(5, 2, 0.5);
    assert(weak.regime === "freeze-out 方向", "freeze-out regime");
    assert(weak.diagnosis === "脱耦候选：Γ/H<1", "cooled diagnosis");
    assert(weak.quantifier === "x<1", "cooled quantifier");
    var equal = analyze(2, 2, 0.5);
    assert(near(equal.ratio, 1, 1e-12), "equal exponent ratio");
    assert(equal.diagnosis === "量级边界：Γ/H≈1", "equal exponent diagnosis");
    var recoupling = analyze(1, 3, 0.5);
    assert(near(recoupling.ratio, 4, 1e-12), "recoupling cooled endpoint");
    assert(recoupling.regime === "recoupling 方向", "recoupling regime");
    assert(recoupling.diagnosis === "平衡侧：Γ/H>1", "recoupling diagnosis");
    var rows = ledger(5, 2, 0.3);
    assert(rows.length === 6, "ledger includes current point");
    assert(rows.some(function (row) { return near(row.x, 0.3, 1e-12); }), "ledger current x row");
    var answers = predictionAnswers();
    assert(answers.direction === "decrease" && answers.atOne === "one" && answers.equal === "no" && answers.recoupling === "recouple", "prediction answers");
    assert(predictionAnswers(2, 2).direction === "decrease" && predictionAnswers(1, 3).direction === "decrease", "prediction answers follow the fixed question quantifier");
    PRESETS.forEach(function (preset) {
      var result = analyze(preset.m, preset.n, 1);
      assert(near(result.ratio, 1, 1e-12), preset.id + " normalization");
    });
    assertThrows(function () { rateRatio(0, 5, 2); }, "reject x=0");
    assertThrows(function () { rateRatio(-1, 5, 2); }, "reject negative x");
    assertThrows(function () { rateRatio(NaN, 5, 2); }, "reject non-finite x");
    assertThrows(function () { rateRatio(1, Infinity, 2); }, "reject non-finite m");
    assertThrows(function () { rateRatio(1, 5, -21); }, "reject exponent outside range");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS.map(function (preset) { return Object.assign({}, preset); }),
    rateRatio: rateRatio,
    analyze: analyze,
    ledger: ledger,
    predictionAnswers: predictionAnswers,
    mount: mount,
    selfTest: selfTest
  };
});
