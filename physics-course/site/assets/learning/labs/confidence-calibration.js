(function () {
  "use strict";

  if (
    typeof window === "undefined" ||
    !window.CourseLearning ||
    typeof window.CourseLearning.register !== "function"
  ) {
    return;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-confidence-calibration-styles";
  var INSTANCE_COUNT = 0;
  var EPSILON = 1e-12;
  var MIN_TEMPERATURE = 0.5;
  var MAX_TEMPERATURE = 3.5;

  /*
   * These arrays are deliberately public-in-the-source rather than sampled at
   * runtime.  A learner can copy them into a spreadsheet and reproduce every
   * number in the lab.  `logit` is the score for class 1; `label` is 0 or 1.
   */
  var VALIDATION_LOGITS = [
    3.5, 3.2, 3.0, 2.8, 2.6,
    -3.5, -3.2, -3.0, -2.8, -2.6,
    1.7, -1.7, 1.5, -1.5, 1.3, -1.3
  ];
  var VALIDATION_LABELS = [
    1, 1, 1, 1, 1,
    0, 0, 0, 0, 0,
    1, 0, 0, 1, 0, 1
  ];

  var IN_DOMAIN_LOGITS = [
    4.0, 3.8, 3.6, 3.4, 3.2, 3.0,
    -4.0, -3.8, -3.6, -3.4, -3.2, -3.0,
    2.8, 2.6, 2.4, -2.8, -2.6, -2.4,
    1.7, -1.7, 1.5, -1.5, 1.3, -1.3
  ];
  var IN_DOMAIN_LABELS = [
    1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0,
    1, 1, 1, 0, 0, 0,
    0, 1, 0, 1, 0, 1
  ];

  /*
   * The shift set deliberately contains high-score mistakes.  In particular,
   * the |logit|=2 group contains 7 correct and 2 wrong predictions, while
   * several lower-score examples are correct.  A confidence threshold can
   * therefore discard useful data without reducing selective risk.
   */
  var SHIFT_LOGITS = [
    1.2, -1.2, 1.2, -1.2, 1.2, -1.2, 1.2,
    -1.2, 1.2, -1.2, 1.2, -1.2, 1.2,
    2.0, -2.0, 2.0, -2.0, 2.0, -2.0, 2.0,
    1.0, -1.0, 2.0, -2.0
  ];
  var SHIFT_LABELS = [
    1, 0, 1, 0, 1, 0, 1,
    0, 1, 0, 1, 0, 1,
    1, 0, 1, 0, 1, 0, 1,
    0, 1, 0, 1
  ];

  function makePoints(logits, labels, prefix) {
    var points = [];
    var index;
    for (index = 0; index < logits.length; index += 1) {
      points.push({
        id: prefix + String(index + 1).padStart(2, "0"),
        logit: logits[index],
        label: labels[index]
      });
    }
    return points;
  }

  var VALIDATION = makePoints(VALIDATION_LOGITS, VALIDATION_LABELS, "V");
  var DATASETS = {
    in: {
      label: "分布内测试集",
      description: "与固定验证集共享玩具分布；错误样本主要处在较低 margin。",
      points: makePoints(IN_DOMAIN_LOGITS, IN_DOMAIN_LABELS, "ID")
    },
    shift: {
      label: "shift 测试集",
      description: "标签/得分关系改变；有高 margin 错误，验证集拟合的 T 不自动迁移。",
      points: makePoints(SHIFT_LOGITS, SHIFT_LABELS, "S")
    }
  };

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") {
        node.setAttribute("class", String(value));
      } else if (key === "htmlFor") {
        node.setAttribute("for", String(value));
      } else if (key === "text") {
        node.textContent = String(value);
      } else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) {
        node.setAttribute(key, "");
      } else {
        node.setAttribute(key, String(value));
      }
    });
    return node;
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(
        child && child.nodeType ? child : document.createTextNode(String(child))
      );
    });
    return node;
  }

  function makeElement(api, tag, attrs, children) {
    if (api && typeof api.el === "function") {
      return api.el(tag, attrs || {}, children);
    }
    return appendChildren(
      setAttributes(document.createElement(tag), attrs || {}),
      children
    );
  }

  function makeSvg(api, tag, attrs, children) {
    if (api && typeof api.svg === "function") {
      return api.svg(tag, attrs || {}, children);
    }
    return appendChildren(
      setAttributes(document.createElementNS(SVG_NS, tag), attrs || {}),
      children
    );
  }

  function clear(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren();
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    text = text.replace(/0+$/, "").replace(/\.$/, "");
    return text === "-0" ? "0" : text;
  }

  function formatPercent(value, digits) {
    return finite(value) ? formatNumber(value * 100, digits === undefined ? 1 : digits) + "%" : "—";
  }

  function sigmoid(value) {
    if (value >= 0) {
      var negativeExponent = Math.exp(-value);
      return 1 / (1 + negativeExponent);
    }
    var positiveExponent = Math.exp(value);
    return positiveExponent / (1 + positiveExponent);
  }

  function safeLogProbability(probability) {
    return Math.log(clamp(probability, EPSILON, 1 - EPSILON));
  }

  function evaluate(points, temperature, binCount, threshold) {
    var bins = [];
    var items = [];
    var index;
    var accuracyCount = 0;
    var nllTotal = 0;
    var brierTotal = 0;
    var acceptedCount = 0;
    var acceptedErrors = 0;

    for (index = 0; index < binCount; index += 1) {
      bins.push({
        lower: index / binCount,
        upper: (index + 1) / binCount,
        count: 0,
        confidenceTotal: 0,
        correctCount: 0
      });
    }

    points.forEach(function (point) {
      var probability = sigmoid(point.logit / temperature);
      var prediction = point.logit >= 0 ? 1 : 0;
      var correct = prediction === point.label;
      var confidence = prediction === 1 ? probability : 1 - probability;
      var accepted = confidence + EPSILON >= threshold;
      var binIndex = Math.min(binCount - 1, Math.floor(confidence * binCount));
      var item = {
        id: point.id,
        logit: point.logit,
        label: point.label,
        probability: probability,
        prediction: prediction,
        confidence: confidence,
        correct: correct,
        accepted: accepted
      };

      items.push(item);
      accuracyCount += correct ? 1 : 0;
      nllTotal -= point.label * safeLogProbability(probability);
      nllTotal -= (1 - point.label) * safeLogProbability(1 - probability);
      brierTotal += Math.pow(probability - point.label, 2);
      bins[binIndex].count += 1;
      bins[binIndex].confidenceTotal += confidence;
      bins[binIndex].correctCount += correct ? 1 : 0;
      if (accepted) {
        acceptedCount += 1;
        acceptedErrors += correct ? 0 : 1;
      }
    });

    bins.forEach(function (bin) {
      bin.meanConfidence = bin.count ? bin.confidenceTotal / bin.count : NaN;
      bin.accuracy = bin.count ? bin.correctCount / bin.count : NaN;
      bin.absoluteGap = bin.count ? Math.abs(bin.accuracy - bin.meanConfidence) : NaN;
    });

    var sampleCount = points.length;
    var ece = bins.reduce(function (total, bin) {
      return bin.count ? total + (bin.count / sampleCount) * bin.absoluteGap : total;
    }, 0);

    return {
      items: items,
      bins: bins,
      accuracy: sampleCount ? accuracyCount / sampleCount : NaN,
      nll: sampleCount ? nllTotal / sampleCount : NaN,
      brier: sampleCount ? brierTotal / sampleCount : NaN,
      ece: ece,
      coverage: sampleCount ? acceptedCount / sampleCount : NaN,
      selectiveRisk: acceptedCount ? acceptedErrors / acceptedCount : NaN,
      acceptedCount: acceptedCount,
      acceptedErrors: acceptedErrors,
      sampleCount: sampleCount,
      threshold: threshold,
      temperature: temperature,
      binCount: binCount
    };
  }

  function validationNll(points, temperature) {
    var total = 0;
    points.forEach(function (point) {
      var probability = sigmoid(point.logit / temperature);
      total -= point.label * safeLogProbability(probability);
      total -= (1 - point.label) * safeLogProbability(1 - probability);
    });
    return total / points.length;
  }

  function fitTemperature(points) {
    var bestTemperature = 1;
    var bestNll = Infinity;
    var index;
    /* A fixed grid makes the reported fit reproducible and easy to audit. */
    for (index = 0; index <= 300; index += 1) {
      var temperature = MIN_TEMPERATURE + index * 0.01;
      var nll = validationNll(points, temperature);
      if (nll < bestNll) {
        bestNll = nll;
        bestTemperature = temperature;
      }
    }
    return bestTemperature;
  }

  var VALIDATION_TEMPERATURE = fitTemperature(VALIDATION);
  var PRESETS = [
    {
      id: "raw",
      label: "原始分数",
      dataset: "in",
      temperature: 1,
      threshold: 0.5,
      bins: 10,
      note: "T=1，不拒答；先看没有任何校准/筛选时的基线。"
    },
    {
      id: "validation-fit",
      label: "验证集拟合 T",
      dataset: "in",
      temperature: VALIDATION_TEMPERATURE,
      threshold: 0.5,
      bins: 10,
      note: "在固定验证集上网格最小化 NLL；只改变概率尺度，不改 argmax。"
    },
    {
      id: "shift-trap",
      label: "shift 陷阱",
      dataset: "shift",
      temperature: VALIDATION_TEMPERATURE,
      threshold: 0.75,
      bins: 10,
      note: "把分布内拟合的 T 搬到 shift；NLL/Brier 与选择性风险都要重新检查。"
    },
    {
      id: "bad-score",
      label: "错排分数",
      dataset: "shift",
      temperature: 1,
      threshold: 0.85,
      bins: 10,
      note: "高分错误混入保留集；拒答低分样本未必降低风险。"
    }
  ];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cc-lab { --cc-correct: #39734d; --cc-error: #b44b42; --cc-diagonal: #8b6b20; --cc-muted: var(--fg-soft, #6b6557); --cc-border: var(--border, #d7d0c2); --cc-panel: var(--block-bg, #f4f1e9); min-width: 0; margin: 1.5rem 0 2rem; color: var(--fg); color-scheme: light dark; line-height: 1.5; }",
      "html[data-theme=\"dark\"] .cc-lab { --cc-correct: #82d49e; --cc-error: #f08d83; --cc-diagonal: #e0c173; --cc-panel: #222833; --cc-border: #4b5565; }",
      ".cc-lab *, .cc-lab *::before, .cc-lab *::after { box-sizing: border-box; }",
      ".cc-lab .cc-shell { overflow: hidden; border: 1px solid var(--cc-border); border-radius: 8px; background: var(--bg); }",
      ".cc-lab .cc-header { padding: 1rem 1.1rem .9rem; border-bottom: 1px solid var(--cc-border); background: var(--cc-panel); }",
      ".cc-lab .cc-kicker { margin: 0 0 .2rem; color: var(--accent); font-size: .75rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }",
      ".cc-lab .cc-header h3 { margin: 0; color: var(--fg); font-size: 1.2rem; }",
      ".cc-lab .cc-header p { margin: .4rem 0 0; color: var(--cc-muted); }",
      ".cc-lab .cc-controls { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr); gap: .75rem; padding: .9rem 1.1rem; border-bottom: 1px solid var(--cc-border); background: var(--cc-panel); }",
      ".cc-lab .cc-control-section { min-width: 0; margin: 0; padding: .65rem .7rem .75rem; border: 1px solid var(--cc-border); border-radius: 6px; }",
      ".cc-lab .cc-control-section legend { padding: 0 .25rem; color: var(--cc-muted); font-size: .78rem; font-weight: 750; }",
      ".cc-lab .cc-control-head { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; color: var(--cc-muted); font-size: .85rem; }",
      ".cc-lab .cc-control-head output { color: var(--accent); font-weight: 750; font-variant-numeric: tabular-nums; text-align: right; }",
      ".cc-lab input[type=range] { display: block; width: 100%; min-height: 44px; height: 44px; margin: .15rem 0 0; accent-color: var(--accent); }",
      ".cc-lab select { width: 100%; min-height: 44px; margin-top: .15rem; padding: .45rem .55rem; border: 1px solid var(--cc-border); border-radius: 5px; background: var(--bg); color: var(--fg); font: inherit; }",
      ".cc-lab .cc-scale { display: flex; justify-content: space-between; color: var(--cc-muted); font-size: .72rem; font-variant-numeric: tabular-nums; }",
      ".cc-lab .cc-help { margin: .35rem 0 0; color: var(--cc-muted); font-size: .76rem; }",
      ".cc-lab button { min-width: 0; min-height: 44px; padding: .5rem .7rem; border: 1px solid var(--cc-border); border-radius: 6px; background: var(--bg); color: var(--fg); cursor: pointer; font: inherit; font-size: .83rem; font-weight: 700; line-height: 1.25; overflow-wrap: anywhere; }",
      ".cc-lab button:hover { border-color: var(--accent); }",
      ".cc-lab button[aria-pressed=\"true\"], .cc-lab .cc-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); }",
      ".cc-lab button:focus-visible, .cc-lab input:focus-visible, .cc-lab select:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".cc-lab .cc-preset-grid, .cc-lab .cc-coverage-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; margin-top: .35rem; }",
      ".cc-lab .cc-coverage-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }",
      ".cc-lab .cc-preset-note { min-height: 2.35em; margin: .45rem 0 0; color: var(--cc-muted); font-size: .76rem; }",
      ".cc-lab .cc-body { padding: 1rem 1.1rem 1.1rem; }",
      ".cc-lab .cc-layout { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(260px, .75fr); gap: 1rem; align-items: start; }",
      ".cc-lab .cc-card { min-width: 0; padding: .8rem; border: 1px solid var(--cc-border); border-radius: 6px; background: var(--cc-panel); }",
      ".cc-lab .cc-card-title { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem; margin: 0 0 .55rem; color: var(--fg); font-size: .9rem; }",
      ".cc-lab .cc-card-title small { color: var(--cc-muted); font-size: .75rem; font-weight: 400; }",
      ".cc-lab .cc-chart-scroll { max-width: 100%; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; border: 1px solid var(--cc-border); border-radius: 5px; background: var(--bg); }",
      ".cc-lab .cc-chart { display: block; width: 100%; min-width: 560px; height: auto; color: var(--fg); }",
      ".cc-lab .cc-chart text { fill: currentColor; font-family: inherit; }",
      ".cc-lab .cc-grid-line { stroke: currentColor; stroke-opacity: .14; stroke-width: 1; }",
      ".cc-lab .cc-axis-line { stroke: currentColor; stroke-opacity: .58; stroke-width: 1.2; }",
      ".cc-lab .cc-perfect-diagonal { stroke: var(--cc-diagonal); stroke-width: 2.2; stroke-dasharray: 7 5; }",
      ".cc-lab .cc-bin-bar { fill: var(--cc-correct); fill-opacity: .68; stroke: var(--cc-correct); stroke-width: 1; }",
      ".cc-lab .cc-bin-gap { stroke: var(--cc-error); stroke-width: 1.7; stroke-dasharray: 3 3; }",
      ".cc-lab .cc-bin-point { fill: var(--cc-error); stroke: var(--bg); stroke-width: 1.5; }",
      ".cc-lab .cc-tick, .cc-lab .cc-axis-label { fill: var(--cc-muted) !important; font-size: 11px; }",
      ".cc-lab .cc-axis-label { font-size: 12px; }",
      ".cc-lab .cc-legend { display: flex; flex-wrap: wrap; gap: .55rem 1rem; margin: .55rem 0 0; color: var(--cc-muted); font-size: .78rem; }",
      ".cc-lab .cc-legend-item { display: inline-flex; align-items: center; gap: .35rem; }",
      ".cc-lab .cc-legend-bar { width: 1rem; height: .65rem; border-radius: 2px; background: var(--cc-correct); }",
      ".cc-lab .cc-legend-line { width: 1.15rem; border-top: 2px dashed var(--cc-diagonal); }",
      ".cc-lab .cc-legend-point { width: .65rem; height: .65rem; border-radius: 50%; background: var(--cc-error); }",
      ".cc-lab .cc-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .55rem; }",
      ".cc-lab .cc-metric { min-width: 0; padding: .6rem .65rem; border-top: 2px solid var(--cc-border); background: var(--bg); }",
      ".cc-lab .cc-metric[data-kind=accuracy] { border-top-color: var(--cc-correct); }",
      ".cc-lab .cc-metric[data-kind=error], .cc-lab .cc-metric[data-kind=risk] { border-top-color: var(--cc-error); }",
      ".cc-lab .cc-metric[data-kind=ece] { border-top-color: var(--cc-diagonal); }",
      ".cc-lab .cc-metric span { display: block; color: var(--cc-muted); font-size: .72rem; line-height: 1.35; }",
      ".cc-lab .cc-metric strong { display: block; margin-top: .15rem; color: var(--fg); font-size: 1rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
      ".cc-lab .cc-readout { margin: .8rem 0 0; padding: .65rem .7rem; border-left: 3px solid var(--accent); background: var(--bg); color: var(--cc-muted); font-size: .8rem; }",
      ".cc-lab .cc-formula { margin: .8rem 0 0; padding: .65rem .7rem; border-left: 3px solid var(--accent); background: var(--bg); color: var(--fg); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: .78rem; line-height: 1.55; overflow-x: auto; }",
      ".cc-lab .cc-table-wrap { max-width: 100%; margin-top: .8rem; overflow-x: auto; }",
      ".cc-lab table { width: 100%; border-collapse: collapse; font-size: .74rem; font-variant-numeric: tabular-nums; }",
      ".cc-lab th, .cc-lab td { padding: .32rem .4rem; border-bottom: 1px solid var(--cc-border); text-align: right; white-space: nowrap; }",
      ".cc-lab th:first-child, .cc-lab td:first-child { text-align: left; }",
      ".cc-lab th { color: var(--cc-muted); font-weight: 700; }",
      ".cc-lab .cc-status { min-height: 1.6em; margin: .8rem 0 0; color: var(--cc-muted); font-size: .82rem; }",
      "@media (max-width: 860px) { .cc-lab .cc-layout { grid-template-columns: 1fr; } }",
      "@media (max-width: 620px) { .cc-lab .cc-controls, .cc-lab .cc-body { padding: .75rem; } .cc-lab .cc-controls { grid-template-columns: 1fr; } .cc-lab .cc-preset-grid { grid-template-columns: 1fr 1fr; } .cc-lab .cc-coverage-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }",
      "@media (prefers-reduced-motion: reduce) { .cc-lab *, .cc-lab *::before, .cc-lab *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function svgText(api, x, y, text, attrs) {
    var values = Object.assign(
      { x: x, y: y, "font-size": 11, "aria-hidden": "true" },
      attrs || {}
    );
    return makeSvg(api, "text", values, [text]);
  }

  function metricCard(api, label, kind, valueText, key) {
    var value = makeElement(api, "strong", { text: valueText, "data-metric-value": key });
    return {
      value: value,
      node: makeElement(api, "div", { className: "cc-metric", "data-kind": kind }, [
        makeElement(api, "span", { text: label }),
        value
      ])
    };
  }

  function makeChart(api, instanceId) {
    var titleId = "cc-chart-title-" + instanceId;
    var descId = "cc-chart-desc-" + instanceId;
    var title = makeSvg(api, "title", { id: titleId }, ["置信度可靠性图"]);
    var desc = makeSvg(api, "desc", { id: descId }, ["横轴是平均预测置信度，纵轴是分桶后的实际准确率；虚线是 perfect calibration 对角线。"]);
    var plot = makeSvg(api, "g", { className: "cc-plot" });
    var svg = makeSvg(api, "svg", {
      className: "cc-chart",
      viewBox: "0 0 680 380",
      role: "img",
      "aria-labelledby": titleId + " " + descId,
      preserveAspectRatio: "xMidYMid meet"
    }, [title, desc, plot]);
    return { svg: svg, plot: plot, desc: desc };
  }

  function drawReliability(chart, result, api) {
    var width = 680;
    var height = 380;
    var left = 62;
    var right = 20;
    var top = 20;
    var bottom = 60;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var ticks = [0, 0.25, 0.5, 0.75, 1];
    var binWidth = plotWidth / result.binCount;

    clear(chart.plot);
    chart.desc.textContent =
      "当前为" + result.binCount + "个等宽置信度桶；柱高是分桶准确率，红点是(平均置信度，分桶准确率)，虚线是 perfect calibration。";

    ticks.forEach(function (tick) {
      var x = left + plotWidth * tick;
      var y = top + plotHeight * (1 - tick);
      chart.plot.appendChild(makeSvg(api, "line", {
        className: "cc-grid-line",
        x1: left,
        x2: left + plotWidth,
        y1: y,
        y2: y
      }));
      chart.plot.appendChild(makeSvg(api, "line", {
        className: "cc-grid-line",
        x1: x,
        x2: x,
        y1: top,
        y2: top + plotHeight
      }));
      chart.plot.appendChild(svgText(api, x, top + plotHeight + 19, formatNumber(tick, 2), {
        className: "cc-tick",
        "text-anchor": "middle"
      }));
      chart.plot.appendChild(svgText(api, left - 10, y + 4, formatNumber(tick, 2), {
        className: "cc-tick",
        "text-anchor": "end"
      }));
    });

    chart.plot.appendChild(makeSvg(api, "line", {
      className: "cc-perfect-diagonal",
      x1: left,
      y1: top + plotHeight,
      x2: left + plotWidth,
      y2: top
    }));

    result.bins.forEach(function (bin, index) {
      if (!bin.count) return;
      var barX = left + index * binWidth + 3;
      var barWidth = Math.max(1, binWidth - 6);
      var barY = top + plotHeight * (1 - bin.accuracy);
      var meanX = left + plotWidth * bin.meanConfidence;
      var accuracyY = top + plotHeight * (1 - bin.accuracy);
      var confidenceY = top + plotHeight * (1 - bin.meanConfidence);
      chart.plot.appendChild(makeSvg(api, "rect", {
        className: "cc-bin-bar",
        x: barX,
        y: barY,
        width: barWidth,
        height: Math.max(0, top + plotHeight - barY),
        rx: 2,
        "data-bin": index
      }));
      chart.plot.appendChild(makeSvg(api, "line", {
        className: "cc-bin-gap",
        x1: meanX,
        x2: meanX,
        y1: accuracyY,
        y2: confidenceY
      }));
      chart.plot.appendChild(makeSvg(api, "circle", {
        className: "cc-bin-point",
        cx: meanX,
        cy: accuracyY,
        r: 4,
        "data-bin": index,
        "aria-label": "桶" + (index + 1) + "：平均置信度" + formatPercent(bin.meanConfidence) + "，准确率" + formatPercent(bin.accuracy)
      }));
    });

    chart.plot.appendChild(makeSvg(api, "line", {
      className: "cc-axis-line",
      x1: left,
      x2: left + plotWidth,
      y1: top + plotHeight,
      y2: top + plotHeight
    }));
    chart.plot.appendChild(makeSvg(api, "line", {
      className: "cc-axis-line",
      x1: left,
      x2: left,
      y1: top,
      y2: top + plotHeight
    }));
    chart.plot.appendChild(svgText(api, left + plotWidth / 2, height - 13, "平均预测置信度", {
      className: "cc-axis-label",
      "text-anchor": "middle"
    }));
    chart.plot.appendChild(svgText(api, 16, top + plotHeight / 2, "实际准确率", {
      className: "cc-axis-label",
      "text-anchor": "middle",
      transform: "rotate(-90 16 " + (top + plotHeight / 2) + ")"
    }));
  }

  function thresholdForCoverage(points, temperature, targetCoverage) {
    var scores = points.map(function (point) {
      var probability = sigmoid(point.logit / temperature);
      return point.logit >= 0 ? probability : 1 - probability;
    }).sort(function (a, b) { return b - a; });
    var desiredCount = Math.round(clamp(targetCoverage, 0, 1) * scores.length);
    if (desiredCount >= scores.length) return 0.5;
    if (desiredCount <= 0) return 0.99;
    /* Ties are intentional: the resulting coverage may be above the target. */
    return clamp(scores[desiredCount - 1], 0.5, 0.99);
  }

  function buildLab(root, api) {
    injectStyles();
    root.classList.add("cc-lab");
    INSTANCE_COUNT += 1;
    var instanceId = INSTANCE_COUNT;
    var state = {
      preset: "raw",
      dataset: "in",
      temperature: 1,
      threshold: 0.5,
      bins: 10
    };

    var datasetSelect = makeElement(api, "select", {
      "aria-label": "数据集"
    }, [
      makeElement(api, "option", { value: "in", text: "分布内测试集" }),
      makeElement(api, "option", { value: "shift", text: "shift 测试集" })
    ]);
    var datasetHelp = makeElement(api, "p", { className: "cc-help" });

    var temperatureOutput = makeElement(api, "output", { text: "T=1" });
    var temperatureRange = makeElement(api, "input", {
      type: "range",
      min: MIN_TEMPERATURE,
      max: MAX_TEMPERATURE,
      step: 0.01,
      value: 1,
      "aria-label": "温度 T"
    });
    var thresholdOutput = makeElement(api, "output", { text: "50%" });
    var thresholdRange = makeElement(api, "input", {
      type: "range",
      min: 0.5,
      max: 0.99,
      step: 0.01,
      value: 0.5,
      "aria-label": "拒答置信度阈值"
    });
    var binSelect = makeElement(api, "select", { "aria-label": "ECE 分桶数" }, [
      makeElement(api, "option", { value: 5, text: "5 个桶" }),
      makeElement(api, "option", { value: 10, text: "10 个桶" }),
      makeElement(api, "option", { value: 20, text: "20 个桶" })
    ]);
    var coverageOutput = makeElement(api, "output", { text: "当前覆盖率 100%" });
    var presetNote = makeElement(api, "p", { className: "cc-preset-note" });
    var presetButtons = [];

    var coverageButtons = [];
    [
      { value: 1, label: "100%" },
      { value: 0.75, label: "约 75%" },
      { value: 0.5, label: "约 50%" },
      { value: 0.25, label: "约 25%" }
    ].forEach(function (choice) {
      var button = makeElement(api, "button", {
        type: "button",
        text: choice.label,
        "data-coverage-target": choice.value
      });
      coverageButtons.push({ button: button, value: choice.value });
    });

    var chart = makeChart(api, instanceId);
    var chartLegend = makeElement(api, "div", { className: "cc-legend" }, [
      makeElement(api, "span", { className: "cc-legend-item" }, [
        makeElement(api, "i", { className: "cc-legend-bar", "aria-hidden": true }),
        "分桶实际准确率"
      ]),
      makeElement(api, "span", { className: "cc-legend-item" }, [
        makeElement(api, "i", { className: "cc-legend-point", "aria-hidden": true }),
        "(平均置信度，准确率)"
      ]),
      makeElement(api, "span", { className: "cc-legend-item" }, [
        makeElement(api, "i", { className: "cc-legend-line", "aria-hidden": true }),
        "perfect calibration"
      ])
    ]);
    var chartCard = makeElement(api, "section", { className: "cc-card" }, [
      makeElement(api, "h4", { className: "cc-card-title" }, [
        makeElement(api, "span", { text: "Reliability diagram" }),
        makeElement(api, "small", { text: "越贴近虚线越接近校准" })
      ]),
      makeElement(api, "div", { className: "cc-chart-scroll" }, [chart.svg]),
      chartLegend
    ]);

    var metricAccuracy = metricCard(api, "Accuracy（argmax）", "accuracy", "—", "accuracy");
    var metricNll = metricCard(api, "NLL（越低越好）", "probability", "—", "nll");
    var metricBrier = metricCard(api, "Brier（越低越好）", "probability", "—", "brier");
    var metricEce = metricCard(api, "ECE（依赖分桶）", "ece", "—", "ece");
    var metricCoverage = metricCard(api, "Coverage（保留比例）", "coverage", "—", "coverage");
    var metricRisk = metricCard(api, "Selective risk（保留集错误率）", "risk", "—", "selective-risk");
    var metrics = makeElement(api, "div", { className: "cc-metrics" }, [
      metricAccuracy.node,
      metricNll.node,
      metricBrier.node,
      metricEce.node,
      metricCoverage.node,
      metricRisk.node
    ]);

    var binTableBody = makeElement(api, "tbody");
    var metricsCard = makeElement(api, "section", { className: "cc-card" }, [
      makeElement(api, "h4", { className: "cc-card-title" }, [
        makeElement(api, "span", { text: "数值账本" }),
        makeElement(api, "small", { text: "概率指标与拒答后的风险分开读" })
      ]),
      metrics,
      makeElement(api, "div", { className: "cc-readout", "data-cc-readout": true }),
      makeElement(api, "div", { className: "cc-formula" }, [
        "p=σ(logit/T)；prediction=1[logit≥0]；confidence=max(p,1−p)。",
        makeElement(api, "br"),
        "NLL=−mean log P(y|x)，Brier=mean(p−y)²；ECE=Σ_b(n_b/n)|acc_b−conf_b|。",
        makeElement(api, "br"),
        "coverage=accepted/n；selective risk=accepted errors/accepted。"
      ]),
      makeElement(api, "div", { className: "cc-table-wrap" }, [
        makeElement(api, "table", {}, [
          makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
            makeElement(api, "th", { scope: "col", text: "置信度桶" }),
            makeElement(api, "th", { scope: "col", text: "n" }),
            makeElement(api, "th", { scope: "col", text: "平均 conf" }),
            makeElement(api, "th", { scope: "col", text: "实际 acc" }),
            makeElement(api, "th", { scope: "col", text: "|acc−conf|" })
          ])]),
          binTableBody
        ])
      ])
    ]);

    var status = makeElement(api, "p", { className: "cc-status", role: "status", "aria-live": "polite" });
    var shell = makeElement(api, "div", { className: "cc-shell" }, [
      makeElement(api, "header", { className: "cc-header" }, [
        makeElement(api, "p", { className: "cc-kicker", text: "confidence-calibration" }),
        makeElement(api, "h3", { text: "概率会校准，语气不会自动校准" }),
        makeElement(api, "p", { text: "固定二分类器的 logits/labels；温度只改变概率尺度，拒答只改变保留哪些样本。它不是 LLM 自报“我有多确定”的测量。" })
      ]),
      makeElement(api, "div", { className: "cc-controls" }, [
        makeElement(api, "fieldset", { className: "cc-control-section" }, [
          makeElement(api, "legend", { text: "数据与预设" }),
          makeElement(api, "div", { className: "cc-control-head" }, [
            makeElement(api, "span", { text: "评估数据集" }),
            makeElement(api, "output", { text: "固定数据" })
          ]),
          datasetSelect,
          datasetHelp,
          makeElement(api, "div", { className: "cc-preset-grid" }, presetButtons)
        ]),
        makeElement(api, "fieldset", { className: "cc-control-section" }, [
          makeElement(api, "legend", { text: "温度缩放" }),
          makeElement(api, "div", { className: "cc-control-head" }, [
            makeElement(api, "span", { text: "温度 T" }),
            temperatureOutput
          ]),
          temperatureRange,
          makeElement(api, "div", { className: "cc-scale" }, ["0.50（尖）", "1.00", "3.50（平）"]),
          makeElement(api, "p", { className: "cc-help", text: "T>1 压平概率，T<1 变尖；logit 的正负没有改变。" })
        ]),
        makeElement(api, "fieldset", { className: "cc-control-section" }, [
          makeElement(api, "legend", { text: "拒答与 coverage" }),
          makeElement(api, "div", { className: "cc-control-head" }, [
            makeElement(api, "span", { text: "置信度阈值" }),
            thresholdOutput
          ]),
          thresholdRange,
          makeElement(api, "div", { className: "cc-scale" }, ["50%（全收）", "99%（严）"]),
          coverageOutput,
          makeElement(api, "div", { className: "cc-coverage-grid" }, coverageButtons),
          makeElement(api, "p", { className: "cc-help", text: "快捷键按 score 排序取近似 coverage；同分会使实际 coverage 偏离目标。" })
        ]),
        makeElement(api, "fieldset", { className: "cc-control-section" }, [
          makeElement(api, "legend", { text: "ECE 分桶" }),
          binSelect,
          makeElement(api, "p", { className: "cc-help", text: "等宽桶的数量改变，ECE 数值就可能改变；不要把 ECE 当作无分桶的常数。" }),
          presetNote
        ])
      ]),
      makeElement(api, "div", { className: "cc-body" }, [
        makeElement(api, "div", { className: "cc-layout" }, [chartCard, metricsCard]),
        status
      ])
    ]);
    clear(root);
    root.appendChild(shell);

    function updatePresetButtons() {
      presetButtons.forEach(function (button) {
        button.setAttribute(
          "aria-pressed",
          button.getAttribute("data-preset") === state.preset ? "true" : "false"
        );
      });
    }

    function renderBinTable(result) {
      clear(binTableBody);
      result.bins.forEach(function (bin) {
        var label = "[" + formatNumber(bin.lower, 2) + ", " + formatNumber(bin.upper, 2) + (bin.upper === 1 ? "]" : ")");
        binTableBody.appendChild(makeElement(api, "tr", {}, [
          makeElement(api, "td", { text: label }),
          makeElement(api, "td", { text: String(bin.count) }),
          makeElement(api, "td", { text: bin.count ? formatPercent(bin.meanConfidence) : "—" }),
          makeElement(api, "td", { text: bin.count ? formatPercent(bin.accuracy) : "—" }),
          makeElement(api, "td", { text: bin.count ? formatPercent(bin.absoluteGap) : "—" })
        ]));
      });
    }

    function render() {
      var dataset = DATASETS[state.dataset];
      var result = evaluate(dataset.points, state.temperature, state.bins, state.threshold);
      var rawResult = evaluate(dataset.points, 1, state.bins, 0.5);
      var fullError = 1 - result.accuracy;
      var riskChange = finite(result.selectiveRisk) ? result.selectiveRisk - fullError : NaN;
      var fitApplied = Math.abs(state.temperature - VALIDATION_TEMPERATURE) < 0.005;
      var shiftFitFailure = state.dataset === "shift" && fitApplied;

      datasetSelect.value = state.dataset;
      temperatureRange.value = String(state.temperature);
      thresholdRange.value = String(state.threshold);
      binSelect.value = String(state.bins);
      temperatureOutput.textContent = "T=" + formatNumber(state.temperature, 2);
      thresholdOutput.textContent = formatPercent(state.threshold, 0);
      coverageOutput.textContent = "当前覆盖率 " + formatPercent(result.coverage, 1) + "（" + result.acceptedCount + "/" + result.sampleCount + "）";
      datasetHelp.textContent = dataset.description;
      presetNote.textContent = state.preset
        ? PRESETS.filter(function (preset) { return preset.id === state.preset; })[0].note
        : "当前由滑块/快捷覆盖率按钮控制；没有标记为预设。";
      updatePresetButtons();
      temperatureRange.setAttribute("aria-valuetext", "T=" + formatNumber(state.temperature, 2));
      thresholdRange.setAttribute("aria-valuetext", "拒答阈值 " + formatPercent(state.threshold, 0));

      metricAccuracy.value.textContent = formatPercent(result.accuracy);
      metricNll.value.textContent = formatNumber(result.nll, 4);
      metricBrier.value.textContent = formatNumber(result.brier, 4);
      metricEce.value.textContent = formatPercent(result.ece, 1);
      metricCoverage.value.textContent = formatPercent(result.coverage, 1);
      metricRisk.value.textContent = finite(result.selectiveRisk)
        ? formatPercent(result.selectiveRisk, 1)
        : "—（全拒答）";

      drawReliability(chart, result, api);
      renderBinTable(result);

      var readout = metricsCard.querySelector("[data-cc-readout]");
      var message = "当前 T 不改变 argmax：固定 logits 的正负相同，所以 accuracy=" + formatPercent(result.accuracy) + "；它只改变 NLL、Brier、ECE 和 confidence 的数值。";
      if (shiftFitFailure) {
        var rawShift = evaluate(dataset.points, 1, state.bins, state.threshold);
        message += " 在本固定 shift 上，验证集拟合的 T=" + formatNumber(VALIDATION_TEMPERATURE, 2) + " 与 T=1 对比为 NLL " + formatNumber(result.nll, 4) + " vs " + formatNumber(rawShift.nll, 4) + "、Brier " + formatNumber(result.brier, 4) + " vs " + formatNumber(rawShift.brier, 4) + "；这是一例分布迁移后拟合可能失效。";
      }
      if (result.coverage < 1 - EPSILON) {
        message += " 当前保留 " + result.acceptedCount + "/" + result.sampleCount + "；full error=" + formatPercent(fullError, 1) + "，保留集 selective risk=" + (finite(result.selectiveRisk) ? formatPercent(result.selectiveRisk, 1) : "—") + (riskChange < -EPSILON ? "（本样本上下降）" : riskChange > EPSILON ? "（本样本上上升）" : "（本样本上不变）") + "。";
      }
      readout.textContent = message;

      var statusMessage = dataset.label + "；T=" + formatNumber(state.temperature, 2) + "；拒答阈值=" + formatPercent(state.threshold, 0) + "；coverage=" + formatPercent(result.coverage, 1) + "。ECE 使用 " + state.bins + " 个等宽桶。";
      status.textContent = statusMessage;
    }

    function setStateFromPreset(preset) {
      state.preset = preset.id;
      state.dataset = preset.dataset;
      state.temperature = preset.temperature;
      state.threshold = preset.threshold;
      state.bins = preset.bins;
      render();
    }

    PRESETS.forEach(function (preset) {
      var button = makeElement(api, "button", {
        type: "button",
        className: "cc-preset",
        "data-preset": preset.id,
        "aria-pressed": preset.id === state.preset ? "true" : "false",
        text: preset.label
      });
      button.addEventListener("click", function () { setStateFromPreset(preset); });
      presetButtons.push(button);
    });
    /* The preset buttons are created after the shell; insert them in their grid. */
    var presetGrid = root.querySelector(".cc-preset-grid");
    presetButtons.forEach(function (button) { presetGrid.appendChild(button); });

    datasetSelect.addEventListener("change", function () {
      state.dataset = datasetSelect.value === "shift" ? "shift" : "in";
      state.preset = "";
      render();
    });
    temperatureRange.addEventListener("input", function () {
      state.temperature = clamp(Number(temperatureRange.value), MIN_TEMPERATURE, MAX_TEMPERATURE);
      state.preset = "";
      render();
    });
    thresholdRange.addEventListener("input", function () {
      state.threshold = clamp(Number(thresholdRange.value), 0.5, 0.99);
      state.preset = "";
      render();
    });
    binSelect.addEventListener("change", function () {
      state.bins = Number(binSelect.value) === 5 || Number(binSelect.value) === 20 ? Number(binSelect.value) : 10;
      state.preset = "";
      render();
    });
    coverageButtons.forEach(function (choice) {
      choice.button.addEventListener("click", function () {
        state.threshold = thresholdForCoverage(DATASETS[state.dataset].points, state.temperature, choice.value);
        state.preset = "";
        render();
      });
    });

    render();
  }

  window.CourseLearning.register("confidence-calibration", buildLab);
})();
