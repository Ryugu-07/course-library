(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("poisson-process", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("poisson-process self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("poisson-process self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-poisson-process-styles";
  var SERIAL = 0;
  var DEFAULTS = { lambda: 2, horizon: 4, repetitions: 80, seed: 20260822 };

  var STYLE_TEXT = [
    ".pp-lab{--pp-blue:#2b628f;--pp-green:#39734d;--pp-red:#b4493f;--pp-gold:#9a6b16;--pp-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    "html[data-theme=dark] .pp-lab{--pp-blue:#83c8ff;--pp-green:#82d49e;--pp-red:#f08d83;--pp-gold:#e2b458;--pp-soft:#b8b2a7}",
    ".pp-lab *,.pp-lab *::before,.pp-lab *::after{box-sizing:border-box}.pp-lab [hidden]{display:none!important}",
    ".pp-lab h3,.pp-lab h4{margin:0;color:var(--fg);letter-spacing:0}.pp-lab h3{font-size:1.18rem}.pp-lab h4{font-size:1rem}",
    ".pp-lab .pp-intro,.pp-lab .pp-note,.pp-lab .pp-feedback{color:var(--pp-soft);font-size:13px;line-height:1.7}.pp-lab .pp-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pp-gold);background:var(--bg)}",
    ".pp-lab fieldset{min-width:0;margin:0;padding:0;border:0}.pp-lab legend{margin-bottom:8px;color:var(--fg);font-weight:750;line-height:1.5}.pp-lab .pp-question{min-width:0;margin:11px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.pp-lab .pp-question legend{color:var(--pp-soft);font-size:13px;font-weight:650}",
    ".pp-lab .pp-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pp-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.pp-lab button:hover{border-color:var(--accent)}.pp-lab button[aria-pressed=true],.pp-lab button.pp-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.pp-lab button:focus-visible,.pp-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pp-lab .pp-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.pp-lab .pp-actions>*{flex:1 1 180px}.pp-lab .pp-feedback{min-height:2em;margin:8px 0;font-weight:700}.pp-lab .pp-pass{color:var(--pp-green)}.pp-lab .pp-warn{color:var(--pp-red)}",
    ".pp-lab .pp-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pp-lab .pp-layout{display:grid;grid-template-columns:minmax(205px,.62fr) minmax(0,1.38fr);gap:16px;align-items:start;min-width:0}.pp-lab .pp-controls,.pp-lab .pp-stage{min-width:0}.pp-lab .pp-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pp-lab .pp-controls h4{margin:0}.pp-lab .pp-control{display:grid;gap:5px;min-width:0}.pp-lab .pp-control label{color:var(--pp-soft);font-size:13px;font-weight:700}.pp-lab .pp-control output{color:var(--accent);font-variant-numeric:tabular-nums}.pp-lab input[type=range]{display:block;width:100%;min-height:44px;height:44px;margin:0;accent-color:var(--accent)}",
    ".pp-lab .pp-stage-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pp-lab .pp-chart{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.pp-lab .pp-chart text{fill:currentColor;font-family:inherit;letter-spacing:0}.pp-lab .pp-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.65}.pp-lab .pp-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72}.pp-lab .pp-split{stroke:var(--pp-gold);stroke-width:1.8;stroke-dasharray:6 4}.pp-lab .pp-path{fill:none;stroke:var(--pp-blue);stroke-width:2.5;stroke-linejoin:miter}.pp-lab .pp-event{fill:var(--pp-green);stroke:var(--bg);stroke-width:1.2}.pp-lab .pp-label{font-size:11px}.pp-lab .pp-axis-label{font-size:12px}.pp-lab .pp-tick{font-size:11px;fill:var(--pp-soft)!important}.pp-lab .pp-chart-note{font-size:11px;fill:var(--pp-soft)!important}",
    ".pp-lab .pp-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 12px}.pp-lab .pp-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.pp-lab .pp-metric:nth-child(1){border-top-color:var(--pp-blue)}.pp-lab .pp-metric:nth-child(2){border-top-color:var(--pp-green)}.pp-lab .pp-metric:nth-child(3){border-top-color:var(--pp-gold)}.pp-lab .pp-metric:nth-child(4){border-top-color:var(--pp-red)}.pp-lab .pp-metric span{display:block;color:var(--pp-soft);font-size:11.5px;line-height:1.4}.pp-lab .pp-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".pp-lab .pp-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch}.pp-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pp-lab caption{padding:0 0 7px;text-align:left;color:var(--pp-soft);font-size:12px;line-height:1.55}.pp-lab th,.pp-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.pp-lab th{color:var(--pp-soft);font-size:11.5px;font-weight:750}.pp-lab td:nth-child(n+2){white-space:nowrap}.pp-lab .pp-caution{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--pp-gold);background:var(--bg);color:var(--pp-soft);font-size:12.5px;line-height:1.7}",
    "@media(max-width:900px){.pp-lab .pp-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:700px){.pp-lab .pp-choice-row{grid-template-columns:minmax(0,1fr)}.pp-lab .pp-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){.pp-lab .pp-stage-frame{padding:6px}.pp-lab table{font-size:11.5px}.pp-lab th,.pp-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pp-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeRng(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) | 0;
      var value = Math.imul(state ^ (state >>> 15), 1 | state);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function exponential(rng, rate) {
    if (!finite(rate) || rate <= 0) throw new RangeError("lambda 必须为正数。 ");
    var uniform = 0;
    while (uniform === 0) uniform = rng();
    return -Math.log(uniform) / rate;
  }

  function poissonPmf(k, rate) {
    if (!Number.isInteger(k) || k < 0 || !finite(rate) || rate < 0) return NaN;
    if (rate === 0) return k === 0 ? 1 : 0;
    var logFactorial = 0;
    for (var index = 2; index <= k; index += 1) logFactorial += Math.log(index);
    return Math.exp(k * Math.log(rate) - rate - logFactorial);
  }

  function configNumber(value, fallback, label) {
    var number = Number(value === undefined ? fallback : value);
    if (!finite(number)) throw new RangeError(label + " 必须是有限数。 ");
    return number;
  }

  function copyConfig(config) {
    var source = config || DEFAULTS;
    return {
      lambda: clamp(configNumber(source.lambda, DEFAULTS.lambda, "lambda"), 0.5, 8),
      horizon: clamp(configNumber(source.horizon, DEFAULTS.horizon, "horizon"), 1, 12),
      repetitions: Math.round(clamp(configNumber(source.repetitions, DEFAULTS.repetitions, "repetitions"), 40, 180)),
      seed: configNumber(source.seed, DEFAULTS.seed, "seed") >>> 0
    };
  }

  function simulatePath(rate, horizon, rng) {
    if (!finite(horizon) || horizon < 0) throw new RangeError("horizon 必须是有限非负数。 ");
    var time = 0;
    var events = [];
    while (true) {
      time += exponential(rng, rate);
      if (time > horizon) break;
      events.push(time);
    }
    return events;
  }

  function mean(values) {
    return values.length ? values.reduce(function (total, value) { return total + value; }, 0) / values.length : NaN;
  }

  function variance(values) {
    if (values.length < 2) return NaN;
    var center = mean(values);
    return values.reduce(function (total, value) { return total + Math.pow(value - center, 2); }, 0) / (values.length - 1);
  }

  function covariance(left, right) {
    if (left.length !== right.length || left.length < 2) return NaN;
    var leftMean = mean(left);
    var rightMean = mean(right);
    return left.reduce(function (total, value, index) { return total + (value - leftMean) * (right[index] - rightMean); }, 0) / (left.length - 1);
  }

  function simulate(config) {
    var settings = copyConfig(config);
    var rng = makeRng(settings.seed);
    var half = settings.horizon / 2;
    var firstPath = null;
    var firstHalf = [];
    var secondHalf = [];
    var fullCounts = [];
    var waits = [];
    for (var repetition = 0; repetition < settings.repetitions; repetition += 1) {
      var path = simulatePath(settings.lambda, settings.horizon, rng);
      if (firstPath === null) firstPath = path.slice();
      var leftCount = path.filter(function (time) { return time <= half; }).length;
      firstHalf.push(leftCount);
      secondHalf.push(path.length - leftCount);
      fullCounts.push(path.length);
      waits.push(exponential(rng, settings.lambda));
    }
    var u = 0.4 / settings.lambda;
    var v = 0.6 / settings.lambda;
    var survivesU = waits.filter(function (wait) { return wait > u; }).length;
    var survivesUV = waits.filter(function (wait) { return wait > u + v; }).length;
    var survivesV = waits.filter(function (wait) { return wait > v; }).length;
    return {
      config: settings,
      half: half,
      firstPath: firstPath,
      firstHalf: firstHalf,
      secondHalf: secondHalf,
      fullCounts: fullCounts,
      waits: waits,
      expectedHalf: settings.lambda * half,
      expectedFull: settings.lambda * settings.horizon,
      empiricalHalf: mean(firstHalf),
      empiricalSecondHalf: mean(secondHalf),
      empiricalFull: mean(fullCounts),
      empiricalVariance: variance(fullCounts),
      incrementCovariance: covariance(firstHalf, secondHalf),
      meanWait: mean(waits),
      expectedWait: 1 / settings.lambda,
      memorylessConditional: survivesU ? survivesUV / survivesU : NaN,
      memorylessTail: survivesV / settings.repetitions,
      memorylessTheoretical: Math.exp(-settings.lambda * v),
      survivesU: survivesU,
      survivesUV: survivesUV
    };
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
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
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function element(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children);
  }

  function svgElement(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children);
  }

  function replaceChildren(node, children) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "").replace(/^-0$/, "0");
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function chart(api, doc, result, prefix) {
    var left = 56;
    var top = 28;
    var width = 680;
    var height = 235;
    var maximum = Math.max(1, result.firstPath.length + 1);
    function xMap(time) { return left + time / result.config.horizon * width; }
    function yMap(count) { return top + (maximum - count) / maximum * height; }
    var children = [
      svgElement(api, doc, "title", { id: prefix + "-chart-title" }, "Poisson 计数过程的一条固定 seed 路径"),
      svgElement(api, doc, "desc", { id: prefix + "-chart-desc" }, "阶梯线每跳一次表示一个到达；金色虚线把时间区间分成两个不重叠增量。"),
      svgElement(api, doc, "line", { className: "pp-axis", x1: left, y1: top + height, x2: left + width, y2: top + height }),
      svgElement(api, doc, "line", { className: "pp-axis", x1: left, y1: top, x2: left, y2: top + height }),
      svgElement(api, doc, "line", { className: "pp-split", x1: xMap(result.half), y1: top, x2: xMap(result.half), y2: top + height }),
      svgElement(api, doc, "text", { className: "pp-axis-label", x: left, y: top - 10 }, "N(t)：计数"),
      svgElement(api, doc, "text", { className: "pp-axis-label", x: left + width, y: top + height + 27, "text-anchor": "end" }, "t"),
      svgElement(api, doc, "text", { className: "pp-label", x: xMap(result.half) + 6, y: top + 15 }, "T/2"),
      svgElement(api, doc, "text", { className: "pp-chart-note", x: left + width, y: top + 14, "text-anchor": "end" }, "固定 seed；总事件数 " + result.firstPath.length)
    ];
    [0, .5, 1].forEach(function (fraction) {
      var x = left + fraction * width;
      var time = result.config.horizon * fraction;
      children.push(svgElement(api, doc, "line", { className: "pp-grid", x1: x, y1: top, x2: x, y2: top + height }));
      children.push(svgElement(api, doc, "text", { className: "pp-tick", x: x, y: top + height + 16, "text-anchor": "middle" }, format(time, 1)));
    });
    var path = [{ time: 0, count: 0 }];
    result.firstPath.forEach(function (time, index) { path.push({ time: time, count: index }); path.push({ time: time, count: index + 1 }); });
    path.push({ time: result.config.horizon, count: result.firstPath.length });
    var d = path.map(function (point, index) { return (index === 0 ? "M" : "L") + " " + xMap(point.time).toFixed(2) + " " + yMap(point.count).toFixed(2); }).join(" ");
    children.push(svgElement(api, doc, "path", { className: "pp-path", d: d }));
    result.firstPath.forEach(function (time, index) {
      children.push(svgElement(api, doc, "circle", { className: "pp-event", cx: xMap(time), cy: yMap(index + 1), r: 4 }));
    });
    return svgElement(api, doc, "svg", { className: "pp-chart", viewBox: "0 0 760 295", role: "img", "aria-labelledby": prefix + "-chart-title " + prefix + "-chart-desc" }, children);
  }

  function row(api, doc, cells) {
    return element(api, doc, "tr", {}, cells.map(function (cell, index) {
      return element(api, doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell);
    }));
  }

  function metric(api, doc, label, value) {
    return element(api, doc, "div", { className: "pp-metric" }, [element(api, doc, "span", {}, label), element(api, doc, "strong", {}, value)]);
  }

  function mount(root, api) {
    var doc = root && root.ownerDocument;
    if (!doc) return;
    installStyles(doc);
    SERIAL += 1;
    var prefix = "pp-" + SERIAL;
    var state = { config: copyConfig(DEFAULTS), revealed: false, predictions: { rate: null, increments: null, memoryless: null, proof: null } };
    var questions = [
      {
        key: "rate",
        prompt: "λ=2 次/小时首先表示什么？",
        choices: [
          { value: "rate", label: "单位时间平均计数率" },
          { value: "probability", label: "每小时恰好来一次的概率" },
          { value: "wait", label: "每次等待时间都等于 1/2" }
        ],
        expected: "rate"
      },
      {
        key: "increments",
        prompt: "Poisson 过程在两个不重叠区间上的计数增量怎样？",
        choices: [
          { value: "independent", label: "独立，且只看区间长度" },
          { value: "same", label: "一定相等" },
          { value: "dependent", label: "前一段越多后一段越少" }
        ],
        expected: "independent"
      },
      {
        key: "memoryless",
        prompt: "已经等了 u 仍未到达，再等 v 的条件尾概率怎样读？",
        choices: [
          { value: "memoryless", label: "等于直接等 v 的尾概率" },
          { value: "sum", label: "一定等于两次尾概率之和" },
          { value: "zero", label: "知道 u 后必为零" }
        ],
        expected: "memoryless"
      },
      {
        key: "proof",
        prompt: "一条有限 seed 模拟路径能证明 Poisson 过程公理吗？",
        choices: [
          { value: "no-proof", label: "不能，只能作直觉/校准" },
          { value: "proof", label: "能，路径就是公理证明" },
          { value: "exact", label: "能证明每个样本都服从公理" }
        ],
        expected: "no-proof"
      }
    ];
    var gate = element(api, doc, "section", { className: "pp-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(api, doc, "h3", { id: prefix + "-gate-title" }, "预测门：先分开计数、增量和等待时间"));
    gate.appendChild(element(api, doc, "p", { className: "pp-intro" }, "先完成四项预测；提交前不显示阶梯路径、计数均值、增量协方差或无记忆性结果。"));
    questions.forEach(function (question) {
      var fieldset = element(api, doc, "fieldset", { className: "pp-question" });
      fieldset.appendChild(element(api, doc, "legend", {}, question.prompt));
      var choiceRow = element(api, doc, "div", { className: "pp-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; renderPrediction(); });
        choice.button = button;
        choiceRow.appendChild(button);
      });
      fieldset.appendChild(choiceRow);
      gate.appendChild(fieldset);
    });
    var actions = element(api, doc, "div", { className: "pp-actions" });
    var reveal = element(api, doc, "button", { type: "button", className: "pp-primary" }, "提交预测并揭示");
    var reset = element(api, doc, "button", { type: "button" }, "重置");
    var feedback = element(api, doc, "p", { className: "pp-feedback", "aria-live": "polite" }, "");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);

    var stage = element(api, doc, "section", { className: "pp-revealed", hidden: true, "aria-labelledby": prefix + "-result-title" });
    stage.appendChild(element(api, doc, "h4", { id: prefix + "-result-title" }, "揭示实验：计数路径、增量账本与等待尾部"));
    stage.appendChild(element(api, doc, "p", { className: "pp-note" }, "切换 λ、观察时长或重复次数后，固定 seed 的一条路径与重复抽样表格同步重算。有限模拟不是过程公理的证明。"));
    var layout = element(api, doc, "div", { className: "pp-layout" });
    var controls = element(api, doc, "section", { className: "pp-controls", "aria-labelledby": prefix + "-controls-title" });
    controls.appendChild(element(api, doc, "h4", { id: prefix + "-controls-title" }, "参数"));
    function rangeControl(label, key, min, max, step, digits) {
      var output = element(api, doc, "output", {}, format(state.config[key], digits));
      var input = element(api, doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
      input.addEventListener("input", function () { state.config[key] = Number(input.value); output.textContent = format(state.config[key], digits); renderResult(); });
      return element(api, doc, "div", { className: "pp-control" }, [element(api, doc, "label", {}, [label + " = ", output]), input]);
    }
    controls.appendChild(rangeControl("计数率 λ", "lambda", 0.5, 8, 0.5, 1));
    controls.appendChild(rangeControl("观察时长 T", "horizon", 1, 12, 0.5, 1));
    controls.appendChild(rangeControl("重复次数", "repetitions", 40, 180, 10, 0));
    controls.appendChild(element(api, doc, "p", { className: "pp-note" }, "λ 是单位时间的平均计数率；等待时间的均值是 1/λ。T/2 两侧是不重叠区间。"));
    layout.appendChild(controls);

    var stageFrame = element(api, doc, "div", { className: "pp-stage-frame" });
    var chartHost = element(api, doc, "div", {});
    var metrics = element(api, doc, "div", { className: "pp-metrics", "aria-label": "Poisson 指标" });
    var ledger = element(api, doc, "div", { className: "pp-ledger" });
    stageFrame.appendChild(chartHost);
    stageFrame.appendChild(metrics);
    stageFrame.appendChild(ledger);
    layout.appendChild(stageFrame);
    stage.appendChild(layout);
    stage.appendChild(element(api, doc, "p", { className: "pp-caution" }, "边界读法：计数率不等于“每个单位时间恰好一次的概率”；独立平稳增量是过程定义的一部分；指数等待时间与无记忆性是等价刻画；有限路径只能帮助校准这些公式，不能从样本图证明公理。"));
    root.replaceChildren(gate, stage);
    if (root.classList) root.classList.add("pp-lab");

    function renderPrediction() {
      questions.forEach(function (question) {
        question.choices.forEach(function (choice) { choice.button.setAttribute("aria-pressed", state.predictions[question.key] === choice.value ? "true" : "false"); });
      });
    }

    function syncControls() {
      controls.querySelectorAll("input[type=range]").forEach(function (input) {
        var label = input.getAttribute("aria-label");
        var key = label === "计数率 λ" ? "lambda" : label === "观察时长 T" ? "horizon" : "repetitions";
        input.value = String(state.config[key]);
        var output = input.parentNode.querySelector("output");
        if (output) output.textContent = format(state.config[key], key === "repetitions" ? 0 : 1);
      });
    }

    function renderResult() {
      if (!state.revealed) return;
      var result = simulate(state.config);
      state.config = result.config;
      replaceChildren(chartHost, chart(api, doc, result, prefix));
      replaceChildren(metrics, [
        metric(api, doc, "理论 E[N(T)]", format(result.expectedFull, 2)),
        metric(api, doc, "经验 Var[N(T)]", format(result.empiricalVariance, 2)),
        metric(api, doc, "理论 E[W]", format(result.expectedWait, 3)),
        metric(api, doc, "无记忆条件尾", format(result.memorylessConditional, 3))
      ]);
      var table = element(api, doc, "table", {});
      table.appendChild(element(api, doc, "caption", {}, "重复抽样结果；两段计数使用同一组固定 seed。"));
      table.appendChild(element(api, doc, "thead", {}, [row(api, doc, ["量", "实验", "理论/基准", "读法"]) ]));
      var rows = [
        ["N(T/2)", format(result.empiricalHalf, 3), format(result.expectedHalf, 3), "第一段计数均值"],
        ["N(T)-N(T/2)", format(result.empiricalSecondHalf, 3), format(result.expectedHalf, 3), "第二段计数均值"],
        ["Cov(两段增量)", format(result.incrementCovariance, 3), "0", "独立增量的协方差基准"],
        ["N(T)", format(result.empiricalFull, 3), format(result.expectedFull, 3), "计数率 λ 乘时长 T"],
        ["W 首次等待", format(result.meanWait, 3), format(result.expectedWait, 3), "指数等待均值 1/λ"],
        ["无记忆尾部", format(result.memorylessConditional, 3), format(result.memorylessTheoretical, 3), "P(W>u+v 条件于 W>u) 与 P(W>v) 的比较"]
      ];
      table.appendChild(element(api, doc, "tbody", {}, rows.map(function (items) { return row(api, doc, items); })));
      replaceChildren(ledger, table);
    }

    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return state.predictions[question.key] === null; });
      if (missing.length) {
        feedback.textContent = "请先完成四个预测。";
        feedback.className = "pp-feedback pp-warn";
        return;
      }
      state.revealed = true;
      stage.hidden = false;
      syncControls();
      renderResult();
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中；现在可以改变 λ 与 T，观察计数和等待两本账。";
      feedback.className = "pp-feedback " + (correct === questions.length ? "pp-pass" : "pp-warn");
      announce(api, root, feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state.config = copyConfig(DEFAULTS);
      state.revealed = false;
      state.predictions = { rate: null, increments: null, memoryless: null, proof: null };
      stage.hidden = true;
      feedback.textContent = "已重置；答案与过程账本再次隐藏。";
      feedback.className = "pp-feedback";
      renderPrediction();
      syncControls();
      announce(api, root, "Poisson 过程预测与实验已重置。");
    });
    renderPrediction();
    syncControls();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("poisson-process self-test failed: " + message);
    }
    function close(left, right, tolerance, message) {
      assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")");
    }
    close(poissonPmf(0, 2), Math.exp(-2), 1e-12, "Poisson zero mass");
    close(poissonPmf(2, 2), 2 * Math.exp(-2), 1e-12, "Poisson mass");
    close(exponential(function () { return Math.exp(-1); }, 2), 0.5, 1e-12, "exponential inverse");
    var rngA = makeRng(7);
    var rngB = makeRng(7);
    assert(rngA() === rngB() && rngA() === rngB(), "fixed RNG reproducibility");
    var path = simulatePath(2, 4, makeRng(11));
    assert(path.every(function (time, index) { return time > 0 && time <= 4 && (index === 0 || time > path[index - 1]); }), "path event ordering");
    var resultA = simulate(DEFAULTS);
    var resultB = simulate(DEFAULTS);
    assert(JSON.stringify(resultA) === JSON.stringify(resultB), "fixed seed simulation reproducibility");
    assert(resultA.firstPath.length === resultA.firstPath.filter(function (time) { return time <= DEFAULTS.horizon; }).length, "path horizon");
    assert(resultA.fullCounts.length === DEFAULTS.repetitions, "replication count");
    assert(resultA.expectedFull === DEFAULTS.lambda * DEFAULTS.horizon, "count rate bridge");
    assert(resultA.expectedWait === 1 / DEFAULTS.lambda, "waiting rate bridge");
    assert(resultA.memorylessTheoretical === Math.exp(-0.6), "memoryless benchmark");
    var fast = simulate({ lambda: 8, horizon: 1, repetitions: 40, seed: 3 });
    assert(fast.expectedFull === 8 && fast.expectedWait === 0.125, "parameter linkage");
    var threw = false;
    try { exponential(makeRng(1), 0); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "nonpositive rate rejected");
    threw = false;
    try { simulatePath(2, Infinity, makeRng(1)); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "infinite horizon rejected");
    threw = false;
    try { copyConfig({ horizon: NaN }); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "nonfinite config rejected");
    assert(poissonPmf(-1, 2) !== poissonPmf(-1, 2), "invalid mass is NaN");
    assert(copyConfig({ lambda: 99, horizon: 0, repetitions: 2 }).lambda === 8, "config rate clamp");
    return { checks: checks };
  }

  return {
    DEFAULTS: DEFAULTS,
    makeRng: makeRng,
    exponential: exponential,
    poissonPmf: poissonPmf,
    simulatePath: simulatePath,
    simulate: simulate,
    selfTest: selfTest,
    mount: mount
  };
});
