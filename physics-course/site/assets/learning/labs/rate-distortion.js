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
    root.CourseLearning.register("rate-distortion", exported.mount);
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
        "rate-distortion self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("rate-distortion self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-rate-distortion-styles";
  var LN2 = Math.LN2;
  var EPS = 1e-10;
  var SOURCE = [0.5, 0.5];
  var DISTORTION = [[0, 1], [1, 0]];

  var STYLE_TEXT = [
    ".cl-rate-distortion-lab{--rd-blue:#315f9d;--rd-gold:#9b6a12;--rd-green:#39734d;--rd-red:#b64335;max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".cl-rate-distortion-lab *,.cl-rate-distortion-lab *::before,.cl-rate-distortion-lab *::after{box-sizing:border-box;}",
    ".cl-rate-distortion-lab [hidden]{display:none!important;}",
    ".cl-rate-distortion-lab h2,.cl-rate-distortion-lab h3{margin:0;color:var(--fg);}.cl-rate-distortion-lab h2{font-size:1.25rem;}.cl-rate-distortion-lab h3{font-size:1.05rem;}",
    ".cl-rate-distortion-lab p{overflow-wrap:anywhere;}.cl-rate-distortion-lab .rd-note,.cl-rate-distortion-lab .rd-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;}",
    ".cl-rate-distortion-lab .rd-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--rd-gold);background:var(--bg);}",
    ".cl-rate-distortion-lab .rd-control{display:grid;gap:6px;min-width:0;}.cl-rate-distortion-lab .rd-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}",
    ".cl-rate-distortion-lab .rd-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.cl-rate-distortion-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".cl-rate-distortion-lab .rd-endpoints{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:9px;}",
    ".cl-rate-distortion-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}",
    ".cl-rate-distortion-lab button:hover{border-color:var(--accent);}.cl-rate-distortion-lab button[aria-pressed=true],.cl-rate-distortion-lab button.rd-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}",
    ".cl-rate-distortion-lab button:focus-visible,.cl-rate-distortion-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".cl-rate-distortion-lab .rd-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:9px;}.cl-rate-distortion-lab .rd-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.cl-rate-distortion-lab .rd-actions>*{flex:1 1 150px;}",
    ".cl-rate-distortion-lab .rd-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.cl-rate-distortion-lab .rd-pass{color:var(--rd-green);}.cl-rate-distortion-lab .rd-warn{color:var(--rd-red);}",
    ".cl-rate-distortion-lab .rd-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.cl-rate-distortion-lab .rd-layout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(240px,.95fr);gap:16px;align-items:start;}",
    ".cl-rate-distortion-lab .rd-stage{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.cl-rate-distortion-lab .rd-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}",
    ".cl-rate-distortion-lab .rd-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.cl-rate-distortion-lab .rd-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.72;}.cl-rate-distortion-lab .rd-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.7;}.cl-rate-distortion-lab .rd-curve{fill:none;stroke:var(--rd-blue);stroke-width:3;}.cl-rate-distortion-lab .rd-point{fill:var(--rd-red);stroke:var(--bg);stroke-width:2;}",
    ".cl-rate-distortion-lab .rd-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0;}.cl-rate-distortion-lab .rd-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.cl-rate-distortion-lab .rd-metric:nth-child(1){border-top-color:var(--rd-blue);}.cl-rate-distortion-lab .rd-metric:nth-child(2){border-top-color:var(--rd-gold);}.cl-rate-distortion-lab .rd-metric:nth-child(3){border-top-color:var(--rd-green);}.cl-rate-distortion-lab .rd-metric:nth-child(4){border-top-color:var(--rd-red);}",
    ".cl-rate-distortion-lab .rd-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.cl-rate-distortion-lab .rd-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".cl-rate-distortion-lab .rd-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}.cl-rate-distortion-lab table{width:100%;min-width:630px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.cl-rate-distortion-lab th,.cl-rate-distortion-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.cl-rate-distortion-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}",
    ".cl-rate-distortion-lab .rd-callout{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--rd-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}.cl-rate-distortion-lab .rd-formula{max-width:100%;overflow-x:auto;padding:9px 11px;border-left:3px solid var(--accent);background:var(--bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.65;}",
    "@media(max-width:780px){.cl-rate-distortion-lab .rd-layout{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:620px){.cl-rate-distortion-lab .rd-choice-row{grid-template-columns:minmax(0,1fr);}.cl-rate-distortion-lab .rd-endpoints{grid-template-columns:repeat(2,minmax(0,1fr));}.cl-rate-distortion-lab .rd-stage{padding:6px;}.cl-rate-distortion-lab table{font-size:11.5px;}.cl-rate-distortion-lab th,.cl-rate-distortion-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.cl-rate-distortion-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function validateProbability(probability) {
    if (!finite(probability) || probability < 0 || probability > 1) {
      throw new RangeError("p must be in [0, 1]");
    }
    return probability;
  }

  function validateDistortion(distortion) {
    if (!finite(distortion) || distortion < 0) {
      throw new RangeError("D must be finite and non-negative");
    }
    return distortion;
  }

  function binaryEntropy(probability) {
    var p = validateProbability(probability);
    if (p === 0 || p === 1) return 0;
    var first = -p * Math.log(p) / LN2;
    var second = -(1 - p) * Math.log1p(-p) / LN2;
    return first + second;
  }

  function rateDistortion(distortion) {
    var D = validateDistortion(distortion);
    if (D >= 0.5) return 0;
    return Math.max(0, 1 - binaryEntropy(D));
  }

  function logSumExp(values) {
    var maximum = Math.max.apply(null, values);
    if (maximum === -Infinity) return -Infinity;
    var total = values.reduce(function (sum, value) {
      return sum + Math.exp(value - maximum);
    }, 0);
    return maximum + Math.log(total);
  }

  function normalise(values) {
    var total = values.reduce(function (sum, value) { return sum + value; }, 0);
    return values.map(function (value) { return value / total; });
  }

  function baAtBeta(beta, maxIterations, tolerance) {
    if (!finite(beta) || beta < 0) throw new RangeError("beta must be finite and non-negative");
    var iterationsLimit = maxIterations || 1000;
    var targetTolerance = tolerance || 1e-13;
    var q = [0.5, 0.5];
    var channel = null;
    var iteration = 0;
    var converged = false;
    for (iteration = 1; iteration <= iterationsLimit; iteration += 1) {
      channel = SOURCE.map(function (unused, x) {
        var logs = q.map(function (value, y) {
          return Math.log(Math.max(value, Number.MIN_VALUE)) - beta * DISTORTION[x][y];
        });
        var normalizer = logSumExp(logs);
        return logs.map(function (value) { return Math.exp(value - normalizer); });
      });
      var nextQ = [0, 0];
      channel.forEach(function (row, x) {
        row.forEach(function (value, y) {
          nextQ[y] += SOURCE[x] * value;
        });
      });
      nextQ = normalise(nextQ.map(function (value) { return Math.max(value, Number.MIN_VALUE); }));
      var delta = Math.max(Math.abs(nextQ[0] - q[0]), Math.abs(nextQ[1] - q[1]));
      q = nextQ;
      if (delta <= targetTolerance) {
        converged = true;
        break;
      }
    }

    var distortion = 0;
    var mutualInformation = 0;
    channel.forEach(function (row, x) {
      row.forEach(function (value, y) {
        distortion += SOURCE[x] * value * DISTORTION[x][y];
        if (value > 0 && q[y] > 0) {
          mutualInformation += SOURCE[x] * value * Math.log(value / q[y]) / LN2;
        }
      });
    });
    return {
      beta: beta,
      q: q,
      channel: channel,
      distortion: distortion,
      mutualInformation: Math.max(0, mutualInformation),
      iterations: iteration,
      converged: converged
    };
  }

  function endpointBA(distortion) {
    if (distortion === 0) {
      return {
        beta: Infinity,
        q: [0.5, 0.5],
        channel: [[1, 0], [0, 1]],
        distortion: 0,
        mutualInformation: 1,
        iterations: 0,
        converged: true,
        endpoint: "D=0"
      };
    }
    return {
      beta: 0,
      q: [0.5, 0.5],
      channel: [[0.5, 0.5], [0.5, 0.5]],
      distortion: 0.5,
      mutualInformation: 0,
      iterations: 0,
      converged: true,
      endpoint: "D≥1/2"
    };
  }

  function solveBA(distortion) {
    var D = validateDistortion(distortion);
    if (D === 0 || D >= 0.5) {
      var endpoint = endpointBA(D);
      endpoint.targetDistortion = D;
      endpoint.exactRate = rateDistortion(D);
      endpoint.rateResidual = Math.abs(endpoint.mutualInformation - endpoint.exactRate);
      endpoint.distortionSlack = D - endpoint.distortion;
      return endpoint;
    }

    var low = 0;
    var high = 1;
    var highResult = baAtBeta(high);
    while (highResult.distortion > D && high < 1024) {
      high *= 2;
      highResult = baAtBeta(high);
    }
    for (var step = 0; step < 60; step += 1) {
      var middle = (low + high) / 2;
      var middleResult = baAtBeta(middle);
      if (middleResult.distortion > D) low = middle;
      else high = middle;
    }
    var result = baAtBeta((low + high) / 2);
    result.targetDistortion = D;
    result.exactRate = rateDistortion(D);
    result.rateResidual = Math.abs(result.mutualInformation - result.exactRate);
    result.distortionSlack = D - result.distortion;
    result.endpoint = "interior BA";
    return result;
  }

  function ledger(distortion) {
    var D = validateDistortion(distortion);
    var result = solveBA(D);
    return {
      targetDistortion: D,
      exactRate: rateDistortion(D),
      ba: result,
      rateResidual: result.rateResidual,
      distortionSlack: result.distortionSlack
    };
  }

  function predictionAnswer(distortion) {
    var current = rateDistortion(distortion);
    var base = rateDistortion(0.2);
    if (current < base - EPS) return "down";
    if (near(current, base, 1e-9)) return "same";
    return "up";
  }

  function formatValue(value, digits) {
    if (!finite(value)) return "∞";
    var places = digits === undefined ? 5 : digits;
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function makeTable(api, headers, rows, label) {
    var table = api.el("table", { "aria-label": label });
    var head = api.el("thead");
    var headRow = api.el("tr");
    headers.forEach(function (header) { headRow.appendChild(api.el("th", { scope: "col" }, header)); });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = api.el("tbody");
    rows.forEach(function (row) {
      var tableRow = api.el("tr");
      row.forEach(function (cell, index) { tableRow.appendChild(api.el(index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell)); });
      body.appendChild(tableRow);
    });
    table.appendChild(body);
    return table;
  }

  function curveChart(api, selectedD) {
    var svg = api.svg("svg", { className: "rd-svg", viewBox: "0 0 760 340", role: "img", "aria-labelledby": "rd-chart-title rd-chart-desc" });
    svg.appendChild(api.svg("title", { id: "rd-chart-title" }, "Bernoulli 半比特率失真曲线"));
    svg.appendChild(api.svg("desc", { id: "rd-chart-desc" }, "显示 R(D)=1-H2(D) 在零到二分之一区间下降到零，并标出当前失真点。"));
    var left = 60;
    var top = 30;
    var width = 650;
    var height = 245;
    var bottom = top + height;
    var x = function (D) { return left + D / 0.75 * width; };
    var y = function (R) { return bottom - R * height; };
    [0, 0.5, 1].forEach(function (tick) {
      var lineY = y(tick);
      svg.appendChild(api.svg("line", { x1: left, y1: lineY, x2: left + width, y2: lineY, className: "rd-grid" }));
      svg.appendChild(api.svg("text", { x: left - 9, y: lineY + 4, "text-anchor": "end", "font-size": "11" }, String(tick)));
    });
    [0, 0.25, 0.5, 0.75].forEach(function (tick) {
      var lineX = x(tick);
      svg.appendChild(api.svg("line", { x1: lineX, y1: top, x2: lineX, y2: bottom, className: "rd-grid" }));
      svg.appendChild(api.svg("text", { x: lineX, y: bottom + 22, "text-anchor": "middle", "font-size": "11" }, String(tick)));
    });
    svg.appendChild(api.svg("line", { x1: left, y1: top, x2: left, y2: bottom, className: "rd-axis" }));
    svg.appendChild(api.svg("line", { x1: left, y1: bottom, x2: left + width, y2: bottom, className: "rd-axis" }));
    var path = "";
    for (var index = 0; index <= 75; index += 1) {
      var D = index / 100;
      var point = x(D) + "," + y(rateDistortion(D));
      path += (index === 0 ? "M" : "L") + point;
    }
    svg.appendChild(api.svg("path", { d: path, className: "rd-curve" }));
    var selectedRate = rateDistortion(selectedD);
    svg.appendChild(api.svg("circle", { cx: x(selectedD), cy: y(selectedRate), r: "6", className: "rd-point" }));
    svg.appendChild(api.svg("text", { x: left + width, y: 18, "text-anchor": "end", "font-size": "12" }, "R(D) / bits per source symbol"));
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !api || typeof api.el !== "function" || typeof api.svg !== "function") return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = { distortion: 0.2, prediction: null, revealed: false };
    var shell = api.el("section", { className: "cl-rate-distortion-lab", "aria-labelledby": "rd-title" });
    shell.appendChild(api.el("h2", { id: "rd-title" }, "率失真台：R(D) 的精确边界与 BA 账本"));
    shell.appendChild(api.el("p", { className: "rd-note" }, "模型固定为 X∼Bernoulli(1/2)、重构字母表 {0,1}、汉明失真。先预测 D 增大时的率，再打开稳定的 Blahut–Arimoto 数值账。"));

    var control = api.el("div", { className: "rd-control" });
    var label = api.el("label", { htmlFor: "rd-distortion" }, "归一化失真 D");
    var output = api.el("output", { id: "rd-distortion-value", htmlFor: "rd-distortion" }, "0.20");
    label.appendChild(api.el("span", {}, "（"));
    label.appendChild(output);
    label.appendChild(api.el("span", {}, "）"));
    var range = api.el("input", { id: "rd-distortion", type: "range", min: "0", max: "0.75", step: "0.01", value: "0.20", "aria-label": "归一化汉明失真 D" });
    control.appendChild(label);
    control.appendChild(range);
    var endpoints = api.el("div", { className: "rd-endpoints", role: "group", "aria-label": "率失真端点预设" });
    [[0, "D=0"], [0.2, "D=0.20"], [0.5, "D=1/2"], [0.6, "D>1/2"]].forEach(function (item) {
      var button = api.el("button", { type: "button", "data-distortion": String(item[0]) }, item[1]);
      button.addEventListener("click", function () {
        state.distortion = item[0];
        range.value = String(item[0]);
        state.prediction = null;
        state.revealed = false;
        render();
      });
      endpoints.appendChild(button);
    });
    control.appendChild(endpoints);
    shell.appendChild(control);

    var prompt = api.el("div", { className: "rd-prompt" });
    prompt.appendChild(api.el("strong", {}, "先预测：从 D=0.20 调到当前 D，R(D) 会怎样？"));
    var choices = api.el("div", { className: "rd-choice-row", role: "group", "aria-label": "率失真趋势预测" });
    var choiceButtons = {};
    [["down", "下降或保持为 0"], ["same", "保持不变"], ["up", "上升"]].forEach(function (item) {
      var button = api.el("button", { type: "button", "data-choice": item[0] }, item[1]);
      button.addEventListener("click", function () { state.prediction = item[0]; renderPrediction(); });
      choices.appendChild(button);
      choiceButtons[item[0]] = button;
    });
    prompt.appendChild(choices);
    var actions = api.el("div", { className: "rd-actions" });
    var check = api.el("button", { type: "button", className: "rd-primary" }, "核对预测");
    var reset = api.el("button", { type: "button" }, "重置");
    var feedback = api.el("p", { className: "rd-feedback" }, "先选一个预测。");
    actions.appendChild(check);
    actions.appendChild(reset);
    prompt.appendChild(actions);
    prompt.appendChild(feedback);
    shell.appendChild(prompt);

    var revealed = api.el("section", { className: "rd-revealed", hidden: true, "aria-live": "polite" });
    shell.appendChild(revealed);
    root.replaceChildren(shell);

    function renderPrediction() {
      Object.keys(choiceButtons).forEach(function (key) { choiceButtons[key].setAttribute("aria-pressed", state.prediction === key ? "true" : "false"); });
    }

    function renderResults(data) {
      revealed.replaceChildren();
      revealed.appendChild(api.el("h3", {}, "透明账本"));
      var metrics = api.el("div", { className: "rd-metrics" });
      [["目标 D", formatValue(data.targetDistortion, 4)], ["精确 R(D)", formatValue(data.exactRate, 6) + " bit"], ["BA E[d]", formatValue(data.ba.distortion, 6)], ["BA I(X;Ŷ)", formatValue(data.ba.mutualInformation, 6) + " bit"]].forEach(function (item) {
        var metric = api.el("div", { className: "rd-metric" });
        metric.appendChild(api.el("span", {}, item[0]));
        metric.appendChild(api.el("strong", {}, item[1]));
        metrics.appendChild(metric);
      });
      revealed.appendChild(metrics);
      revealed.appendChild(api.el("p", { className: "rd-formula" }, "R(D)=1−H₂(D)=" + formatValue(data.exactRate, 6) + "; |I_BA−R(D)|=" + formatValue(data.rateResidual, 3) + "; D−E[d]=" + formatValue(data.distortionSlack, 6)));
      var layout = api.el("div", { className: "rd-layout" });
      var ledgerNode = api.el("div", { className: "rd-ledger" });
      var channel = data.ba.channel;
      ledgerNode.appendChild(makeTable(api, ["账本对象", "数值", "解释"], [
        ["q(ŷ)", "(" + formatValue(data.ba.q[0], 4) + ", " + formatValue(data.ba.q[1], 4) + ")", "BA 的重构边缘"],
        ["W(ŷ|x=0)", "(" + formatValue(channel[0][0], 4) + ", " + formatValue(channel[0][1], 4) + ")", "稳定 log-sum-exp 归一化"],
        ["W(ŷ|x=1)", "(" + formatValue(channel[1][0], 4) + ", " + formatValue(channel[1][1], 4) + ")", "误差概率给出 E[d]"],
        ["β / 迭代", formatValue(data.ba.beta, 5) + " / " + data.ba.iterations, data.ba.endpoint + (data.ba.converged ? "；已收敛" : "；未达迭代容差")]
      ], "Blahut-Arimoto 数值账本"));
      layout.appendChild(ledgerNode);
      var stage = api.el("div", { className: "rd-stage" });
      stage.appendChild(curveChart(api, data.targetDistortion));
      layout.appendChild(stage);
      revealed.appendChild(layout);
      revealed.appendChild(api.el("div", { className: "rd-callout" }, "边界与迁移：D<0 非法；0≤D≤1/2 时公式精确成立；D≥1/2 用常数重构即可得到 0 率。R(D) 是 i.i.d. 源、每符号失真与渐近 operational theorem 的边界，不是某一条有限消息的码长。互信息是测试信道/编码诱导联合分布的下界；单次有限 block code 还要支付整数码字、码本覆盖和 finite-blocklength 波动。"));
    }

    function render() {
      state.distortion = Number(range.value);
      output.textContent = formatValue(state.distortion, 2);
      var data = ledger(state.distortion);
      var correct = state.prediction && state.prediction === predictionAnswer(state.distortion);
      renderPrediction();
      if (!state.revealed) {
        revealed.hidden = true;
        feedback.className = "rd-feedback";
        feedback.textContent = state.prediction ? "预测已记录，点击“核对预测”查看 BA 账本。" : "先选一个预测。";
        return;
      }
      revealed.hidden = false;
      feedback.className = "rd-feedback " + (correct ? "rd-pass" : "rd-warn");
      feedback.textContent = (correct ? "预测命中。" : "预测未命中。") + " 当前 R(D)=" + formatValue(data.exactRate, 5) + " bit。";
      renderResults(data);
      if (api.announce) api.announce(root, feedback.textContent);
    }

    range.addEventListener("input", function () {
      state.distortion = Number(range.value);
      state.prediction = null;
      state.revealed = false;
      render();
    });
    check.addEventListener("click", function () {
      if (!state.prediction) {
        feedback.className = "rd-feedback rd-warn";
        feedback.textContent = "请先作出预测。";
        return;
      }
      state.revealed = true;
      render();
    });
    reset.addEventListener("click", function () {
      state.distortion = 0.2;
      state.prediction = null;
      state.revealed = false;
      range.value = "0.2";
      render();
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    function assertThrows(fn, message) {
      var threw = false;
      try { fn(); } catch (error) { threw = true; }
      assert(threw, message);
    }
    assert(near(binaryEntropy(0), 0, 1e-12), "H2 endpoint zero");
    assert(near(binaryEntropy(0.5), 1, 1e-12), "H2 midpoint");
    assert(near(binaryEntropy(1), 0, 1e-12), "H2 endpoint one");
    assert(near(rateDistortion(0), 1, 1e-12), "R(0)=1");
    assert(near(rateDistortion(0.5), 0, 1e-12), "R(1/2)=0");
    assert(rateDistortion(0.6) === 0, "R(D)=0 above half");
    assertThrows(function () { rateDistortion(-0.01); }, "reject negative D");
    assertThrows(function () { rateDistortion(Infinity); }, "reject infinite D");
    [0.01, 0.2, 0.49].forEach(function (D) {
      var result = solveBA(D);
      assert(result.converged, "BA converges at D=" + D);
      assert(near(result.distortion, D, 1e-8), "BA meets distortion at D=" + D);
      assert(result.rateResidual < 1e-8, "BA meets exact rate at D=" + D);
      assert(result.q.every(finite), "BA q finite at D=" + D);
    });
    var hard = baAtBeta(800);
    assert(hard.q.every(finite) && finite(hard.mutualInformation), "large beta remains finite");
    assert(solveBA(0).mutualInformation === 1, "BA D=0 endpoint");
    assert(solveBA(0.6).mutualInformation === 0, "BA D>=1/2 endpoint");
    assert(predictionAnswer(0.2) === "same", "prediction answer at baseline");
    assert(predictionAnswer(0.4) === "down", "prediction answer at larger D");
    return { checks: checks, presets: 4 };
  }

  return {
    binaryEntropy: binaryEntropy,
    rateDistortion: rateDistortion,
    logSumExp: logSumExp,
    baAtBeta: baAtBeta,
    solveBA: solveBA,
    ledger: ledger,
    predictionAnswer: predictionAnswer,
    mount: mount,
    selfTest: selfTest
  };
});
