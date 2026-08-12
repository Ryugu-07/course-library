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
  var INSTANCE = 0;
  var STYLE_ID = "cl-sde-path-distribution-style";
  var CONFIG = {
    T: 2,
    x0: 1.4,
    theta: 1.15,
    sigma: 0.85,
    paths: 256,
    minLevel: 2,
    maxLevel: 8,
    defaultLevel: 5,
    defaultPath: 0,
    seed: 0x5de2026
  };
  var LEVEL_PRESETS = [2, 4, 6, 8];

  var STYLE_TEXT = [
    ".sde-path-distribution-lab { --sde-correct: var(--accent, #315f9d); --sde-wrong: var(--cl-red, #b64335); --sde-analytic: var(--cl-green, #39734d); --sde-weak: var(--cl-gold, #9b6a12); --sde-muted: var(--fg-soft, #6f6a60); --sde-grid: currentColor; line-height: 1.5; }",
    "html[data-theme='dark'] .sde-path-distribution-lab { --sde-correct: #83c8ff; --sde-wrong: #f08c7d; --sde-analytic: #72bd8b; --sde-weak: #e2b458; --sde-muted: #b8b2a7; }",
    ".sde-path-distribution-lab .sde-heading { margin: 0; }",
    ".sde-path-distribution-lab .sde-intro, .sde-path-distribution-lab .sde-note, .sde-path-distribution-lab .sde-status { color: var(--sde-muted); font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".sde-path-distribution-lab .sde-intro { margin: 8px 0 16px; }",
    ".sde-path-distribution-lab .sde-status { min-height: 1.65em; margin: 2px 0 0; color: var(--fg); font-weight: 650; }",
    ".sde-path-distribution-lab .sde-layout { display: grid; grid-template-columns: minmax(220px, .72fr) minmax(0, 1.7fr); gap: 18px; align-items: start; }",
    ".sde-path-distribution-lab .sde-controls, .sde-path-distribution-lab .sde-stage { min-width: 0; }",
    ".sde-path-distribution-lab .sde-controls { display: grid; gap: 13px; }",
    ".sde-path-distribution-lab .sde-control { display: grid; gap: 6px; min-width: 0; }",
    ".sde-path-distribution-lab .sde-control > label, .sde-path-distribution-lab .sde-label { color: var(--fg-soft); font-size: 13px; font-weight: 650; }",
    ".sde-path-distribution-lab .sde-control output { color: var(--accent); font-variant-numeric: tabular-nums; }",
    ".sde-path-distribution-lab input[type='range'] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
    ".sde-path-distribution-lab button { min-height: 44px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.35; padding: 8px 11px; cursor: pointer; }",
    ".sde-path-distribution-lab button:hover { border-color: var(--accent); }",
    ".sde-path-distribution-lab button[aria-pressed='true'], .sde-path-distribution-lab .sde-primary { background: var(--accent); border-color: var(--accent); color: var(--bg); font-weight: 700; }",
    ".sde-path-distribution-lab button:focus-visible, .sde-path-distribution-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".sde-path-distribution-lab .sde-preset-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; }",
    ".sde-path-distribution-lab .sde-preset-grid button { min-width: 0; padding-left: 5px; padding-right: 5px; font-size: 12.5px; }",
    ".sde-path-distribution-lab .sde-reset { width: 100%; }",
    ".sde-path-distribution-lab .sde-stage-frame { min-width: 0; margin: 0 0 14px; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); overflow: hidden; }",
    ".sde-path-distribution-lab .sde-stage-title { display: flex; justify-content: space-between; gap: 10px; margin: 0 0 8px; color: var(--sde-muted); font-size: 13px; }",
    ".sde-path-distribution-lab .sde-svg { display: block; width: 100%; height: auto; color: var(--fg); }",
    ".sde-path-distribution-lab .sde-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".sde-path-distribution-lab .sde-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.2; }",
    ".sde-path-distribution-lab .sde-grid { stroke: var(--sde-grid); stroke-opacity: .14; stroke-width: 1; }",
    ".sde-path-distribution-lab .sde-axis { stroke: var(--sde-grid); stroke-opacity: .58; stroke-width: 1.2; }",
    ".sde-path-distribution-lab .sde-zero { stroke: var(--sde-grid); stroke-opacity: .4; stroke-width: 1.3; }",
    ".sde-path-distribution-lab .sde-correct { fill: none; stroke: var(--sde-correct); stroke-width: 2.7; stroke-linecap: round; stroke-linejoin: round; }",
    ".sde-path-distribution-lab .sde-wrong { fill: none; stroke: var(--sde-wrong); stroke-width: 2.35; stroke-linecap: round; stroke-linejoin: round; }",
    ".sde-path-distribution-lab .sde-analytic { fill: none; stroke: var(--sde-analytic); stroke-width: 2.15; stroke-dasharray: 7 4; stroke-linecap: round; stroke-linejoin: round; }",
    ".sde-path-distribution-lab .sde-strong { fill: none; stroke: var(--sde-correct); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }",
    ".sde-path-distribution-lab .sde-weak { fill: none; stroke: var(--sde-weak); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }",
    ".sde-path-distribution-lab .sde-correct-fill { fill: var(--sde-correct); fill-opacity: .48; stroke: var(--sde-correct); stroke-width: .7; }",
    ".sde-path-distribution-lab .sde-wrong-fill { fill: var(--sde-wrong); fill-opacity: .38; stroke: var(--sde-wrong); stroke-width: .7; }",
    ".sde-path-distribution-lab .sde-dot-correct { fill: var(--sde-correct); stroke: var(--bg); stroke-width: 1.5; }",
    ".sde-path-distribution-lab .sde-dot-wrong { fill: var(--sde-wrong); stroke: var(--bg); stroke-width: 1.5; }",
    ".sde-path-distribution-lab .sde-axis-label { fill: var(--sde-muted) !important; font-size: 11px; }",
    ".sde-path-distribution-lab .sde-chart-label { fill: var(--fg) !important; font-size: 12px; font-weight: 700; }",
    ".sde-path-distribution-lab .sde-legend { display: flex; flex-wrap: wrap; gap: 7px 15px; margin: 7px 2px 0; color: var(--sde-muted); font-size: 12px; }",
    ".sde-path-distribution-lab .sde-legend-item { display: inline-flex; align-items: center; gap: 6px; }",
    ".sde-path-distribution-lab .sde-swatch { display: inline-block; width: 25px; height: 0; border-top: 3px solid currentColor; }",
    ".sde-path-distribution-lab .sde-swatch-correct { color: var(--sde-correct); }",
    ".sde-path-distribution-lab .sde-swatch-wrong { color: var(--sde-wrong); }",
    ".sde-path-distribution-lab .sde-swatch-analytic { color: var(--sde-analytic); border-top-style: dashed; }",
    ".sde-path-distribution-lab .sde-swatch-weak { color: var(--sde-weak); }",
    ".sde-path-distribution-lab .sde-ledger-title { margin: 14px 0 7px; color: var(--fg); font-size: 14px; font-weight: 700; }",
    ".sde-path-distribution-lab .sde-table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }",
    ".sde-path-distribution-lab .sde-table { width: 100%; min-width: 570px; border-collapse: separate; border-spacing: 0; font-size: 13px; font-variant-numeric: tabular-nums; }",
    ".sde-path-distribution-lab .sde-table th, .sde-path-distribution-lab .sde-table td { padding: 8px 9px; border-bottom: 1px solid var(--border); text-align: right; white-space: nowrap; }",
    ".sde-path-distribution-lab .sde-table th:first-child, .sde-path-distribution-lab .sde-table td:first-child { text-align: left; }",
    ".sde-path-distribution-lab .sde-table th { color: var(--sde-muted); font-size: 12px; font-weight: 650; }",
    ".sde-path-distribution-lab .sde-table td:nth-child(2) { color: var(--sde-correct); font-weight: 700; }",
    ".sde-path-distribution-lab .sde-table td:nth-child(3) { color: var(--sde-wrong); font-weight: 700; }",
    ".sde-path-distribution-lab .sde-footnote { margin: 10px 0 0; padding: 8px 10px; border-left: 3px solid var(--sde-analytic); background: var(--block-bg, var(--bg)); color: var(--sde-muted); font-size: 12.5px; line-height: 1.65; }",
    "@media (max-width: 760px) { .sde-path-distribution-lab .sde-layout { grid-template-columns: minmax(0, 1fr); } }",
    "@media (max-width: 500px) { .sde-path-distribution-lab .sde-stage-frame { padding: 5px; overflow-x: auto; } .sde-path-distribution-lab .sde-svg { min-width: 640px; max-width: none; } .sde-path-distribution-lab .sde-preset-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }",
    "@media (prefers-reduced-motion: reduce) { .sde-path-distribution-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

  function installStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    document.head.appendChild(style);
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) {
      return node;
    }
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) {
        return;
      }
      node.appendChild(
        child && child.nodeType ? child : document.createTextNode(String(child))
      );
    });
    return node;
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) {
        return;
      }
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
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function replaceChildren(node, children) {
    clear(node);
    appendChildren(node, children);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatNumber(api, value, digits) {
    if (!Number.isFinite(value)) {
      return "—";
    }
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    var places = digits === undefined ? 3 : digits;
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatStep(value) {
    var text = value.toFixed(5);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function svgText(api, x, y, value, attrs) {
    return makeSvg(
      api,
      "text",
      Object.assign(
        {
          x: x,
          y: y,
          "font-size": "12",
          "text-anchor": "middle",
          fill: "currentColor"
        },
        attrs || {}
      ),
      [value]
    );
  }

  function line(api, x1, y1, x2, y2, className) {
    return makeSvg(api, "line", {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      className: className
    });
  }

  function makeRng(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) | 0;
      var value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(rng) {
    var u1 = 0;
    while (u1 === 0) {
      u1 = rng();
    }
    var u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  function analyticMean(t) {
    return CONFIG.x0 * Math.exp(-CONFIG.theta * t);
  }

  function analyticVariance(t) {
    return (
      (CONFIG.sigma * CONFIG.sigma) /
      (2 * CONFIG.theta) *
      (1 - Math.exp(-2 * CONFIG.theta * t))
    );
  }

  function normalDensity(x, mean, variance) {
    var safeVariance = Math.max(variance, 1e-12);
    return (
      Math.exp(-0.5 * Math.pow((x - mean) / Math.sqrt(safeVariance), 2)) /
      Math.sqrt(2 * Math.PI * safeVariance)
    );
  }

  function makeNoise() {
    var rng = makeRng(CONFIG.seed);
    var fineSteps = 1 << CONFIG.maxLevel;
    var noise = [];
    for (var path = 0; path < CONFIG.paths; path += 1) {
      var row = [];
      for (var step = 0; step < fineSteps; step += 1) {
        row.push(gaussian(rng));
      }
      noise.push(row);
    }
    return noise;
  }

  function simulateLevel(level, noise) {
    var steps = 1 << level;
    var blockSize = 1 << (CONFIG.maxLevel - level);
    var h = CONFIG.T / steps;
    var correctPaths = [];
    var wrongPaths = [];
    var correctEndpoints = [];
    var wrongEndpoints = [];

    for (var pathIndex = 0; pathIndex < CONFIG.paths; pathIndex += 1) {
      var correct = [CONFIG.x0];
      var wrong = [CONFIG.x0];
      var correctValue = CONFIG.x0;
      var wrongValue = CONFIG.x0;
      var fineRow = noise[pathIndex];

      for (var step = 0; step < steps; step += 1) {
        var sum = 0;
        var start = step * blockSize;
        for (var offset = 0; offset < blockSize; offset += 1) {
          sum += fineRow[start + offset];
        }
        var z = sum / Math.sqrt(blockSize);
        correctValue +=
          -CONFIG.theta * correctValue * h +
          CONFIG.sigma * Math.sqrt(h) * z;
        wrongValue +=
          -CONFIG.theta * wrongValue * h +
          CONFIG.sigma * h * z;
        correct.push(correctValue);
        wrong.push(wrongValue);
      }
      correctPaths.push(correct);
      wrongPaths.push(wrong);
      correctEndpoints.push(correctValue);
      wrongEndpoints.push(wrongValue);
    }

    return {
      level: level,
      steps: steps,
      h: h,
      correctPaths: correctPaths,
      wrongPaths: wrongPaths,
      correctEndpoints: correctEndpoints,
      wrongEndpoints: wrongEndpoints,
      correctStats: statistics(correctEndpoints),
      wrongStats: statistics(wrongEndpoints)
    };
  }

  function statistics(values) {
    var sum = 0;
    var sumSquares = 0;
    values.forEach(function (value) {
      sum += value;
      sumSquares += value * value;
    });
    var mean = sum / values.length;
    return {
      mean: mean,
      variance: Math.max(0, sumSquares / values.length - mean * mean)
    };
  }

  function makeDataset() {
    var noise = makeNoise();
    var levels = {};
    for (
      var level = CONFIG.minLevel;
      level <= CONFIG.maxLevel;
      level += 1
    ) {
      levels[level] = simulateLevel(level, noise);
    }
    return {
      noise: noise,
      levels: levels,
      analyticMean: analyticMean(CONFIG.T),
      analyticVariance: analyticVariance(CONFIG.T)
    };
  }

  function pointPath(values, xMap, yMap) {
    return values
      .map(function (value, index) {
        return (index === 0 ? "M" : "L") +
          xMap(index, values.length).toFixed(2) +
          "," +
          yMap(value).toFixed(2);
      })
      .join(" ");
  }

  function chartFrame(api, width, height, titleText, descriptionText, uid) {
    var svg = makeSvg(api, "svg", {
      className: "sde-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc"
    });
    svg.appendChild(makeSvg(api, "title", { id: uid + "-title" }, [titleText]));
    svg.appendChild(
      makeSvg(api, "desc", { id: uid + "-desc" }, [descriptionText])
    );
    return svg;
  }

  function rangeOf(values) {
    var min = Infinity;
    var max = -Infinity;
    values.forEach(function (value) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    });
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { min: -1, max: 1 };
    }
    if (Math.abs(max - min) < 1e-9) {
      min -= 1;
      max += 1;
    }
    var padding = Math.max(0.12, (max - min) * 0.12);
    return { min: min - padding, max: max + padding };
  }

  function drawPathChart(api, result, pathIndex, uid) {
    var width = 760;
    var height = 315;
    var left = 54;
    var right = 18;
    var top = 29;
    var bottom = 38;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var correct = result.correctPaths[pathIndex];
    var wrong = result.wrongPaths[pathIndex];
    var means = [];
    var values = correct.concat(wrong);

    for (var i = 0; i < correct.length; i += 1) {
      means.push(analyticMean((i / (correct.length - 1)) * CONFIG.T));
    }
    values = values.concat(means);
    var bounds = rangeOf(values);
    var xMap = function (index, count) {
      return left + (index / (count - 1)) * plotWidth;
    };
    var yMap = function (value) {
      return top + ((bounds.max - value) / (bounds.max - bounds.min)) * plotHeight;
    };
    var svg = chartFrame(
      api,
      width,
      height,
      "同一噪声下的 OU 单路径账本",
      "蓝线使用正确的平方根步长，红线使用故意错误的线性步长，绿色虚线是解析均值；两条路径共享同一组聚合高斯增量。",
      uid
    );

    svg.appendChild(
      makeSvg(api, "rect", {
        x: left,
        y: top,
        width: plotWidth,
        height: plotHeight,
        className: "sde-panel"
      })
    );
    for (var yTick = 0; yTick <= 4; yTick += 1) {
      var yValue = bounds.min + (yTick / 4) * (bounds.max - bounds.min);
      var y = yMap(yValue);
      svg.appendChild(line(api, left, y, width - right, y, "sde-grid"));
      svg.appendChild(
        svgText(api, left - 8, y + 4, formatNumber(api, yValue, 2), {
          className: "sde-axis-label",
          "text-anchor": "end"
        })
      );
    }
    var zeroY = yMap(0);
    if (zeroY >= top && zeroY <= top + plotHeight) {
      svg.appendChild(line(api, left, zeroY, width - right, zeroY, "sde-zero"));
    }
    for (var xTick = 0; xTick <= 4; xTick += 1) {
      var time = (xTick / 4) * CONFIG.T;
      var x = left + (xTick / 4) * plotWidth;
      svg.appendChild(line(api, x, top, x, top + plotHeight, "sde-grid"));
      svg.appendChild(
        svgText(api, x, height - 12, formatNumber(api, time, 2), {
          className: "sde-axis-label"
        })
      );
    }
    svg.appendChild(line(api, left, top + plotHeight, width - right, top + plotHeight, "sde-axis"));
    svg.appendChild(line(api, left, top, left, top + plotHeight, "sde-axis"));
    svg.appendChild(
      svgText(api, left, 16, "Xₜ", {
        className: "sde-chart-label",
        "text-anchor": "start"
      })
    );
    svg.appendChild(
      svgText(api, width - right, height - 12, "t", {
        className: "sde-axis-label",
        "text-anchor": "end"
      })
    );
    svg.appendChild(
      makeSvg(api, "path", {
        d: pointPath(correct, xMap, yMap),
        className: "sde-correct"
      })
    );
    svg.appendChild(
      makeSvg(api, "path", {
        d: pointPath(wrong, xMap, yMap),
        className: "sde-wrong"
      })
    );
    svg.appendChild(
      makeSvg(api, "path", {
        d: pointPath(means, xMap, yMap),
        className: "sde-analytic"
      })
    );
    svg.appendChild(
      makeSvg(api, "circle", {
        cx: left + plotWidth,
        cy: yMap(correct[correct.length - 1]),
        r: 4.5,
        className: "sde-dot-correct"
      })
    );
    svg.appendChild(
      makeSvg(api, "circle", {
        cx: left + plotWidth,
        cy: yMap(wrong[wrong.length - 1]),
        r: 4.2,
        className: "sde-dot-wrong"
      })
    );
    svg.appendChild(
      svgText(
        api,
        width - right - 2,
        top + 16,
        "L=" + result.level + " · h=" + formatStep(result.h),
        {
          className: "sde-axis-label",
          "text-anchor": "end"
        }
      )
    );
    return svg;
  }

  function histogram(values, min, max, bins) {
    var counts = [];
    for (var i = 0; i < bins; i += 1) {
      counts.push(0);
    }
    values.forEach(function (value) {
      if (value < min || value > max) {
        return;
      }
      var index = Math.floor(((value - min) / (max - min)) * bins);
      index = clamp(index, 0, bins - 1);
      counts[index] += 1;
    });
    return counts;
  }

  function drawDistributionChart(api, dataset, result, uid) {
    var width = 760;
    var height = 335;
    var left = 54;
    var right = 18;
    var top = 29;
    var bottom = 42;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var standardDeviation = Math.sqrt(dataset.analyticVariance);
    var allValues = result.correctEndpoints.concat(result.wrongEndpoints);
    allValues.push(
      dataset.analyticMean - 4 * standardDeviation,
      dataset.analyticMean + 4 * standardDeviation
    );
    var bounds = rangeOf(allValues);
    var bins = 24;
    var binWidth = (bounds.max - bounds.min) / bins;
    var correctCounts = histogram(
      result.correctEndpoints,
      bounds.min,
      bounds.max,
      bins
    );
    var wrongCounts = histogram(
      result.wrongEndpoints,
      bounds.min,
      bounds.max,
      bins
    );
    var maxDensity = 0;
    correctCounts.concat(wrongCounts).forEach(function (count) {
      maxDensity = Math.max(maxDensity, count / CONFIG.paths / binWidth);
    });
    maxDensity = Math.max(
      maxDensity,
      normalDensity(dataset.analyticMean, dataset.analyticMean, dataset.analyticVariance)
    );
    var yMax = Math.max(0.3, maxDensity * 1.22);
    var xMap = function (value) {
      return left + ((value - bounds.min) / (bounds.max - bounds.min)) * plotWidth;
    };
    var yMap = function (value) {
      return top + ((yMax - value) / yMax) * plotHeight;
    };
    var svg = chartFrame(
      api,
      width,
      height,
      "OU 终点的分布账本",
      "蓝色和红色柱形分别是正确与错误步长标度的 256 个终点样本；绿色虚线是解析高斯密度 N(m_T,v_T)，柱高按每单位 x 归一化。",
      uid
    );
    svg.appendChild(
      makeSvg(api, "rect", {
        x: left,
        y: top,
        width: plotWidth,
        height: plotHeight,
        className: "sde-panel"
      })
    );
    for (var yTick = 0; yTick <= 4; yTick += 1) {
      var density = (yTick / 4) * yMax;
      var y = yMap(density);
      svg.appendChild(line(api, left, y, width - right, y, "sde-grid"));
      svg.appendChild(
        svgText(api, left - 8, y + 4, formatNumber(api, density, 2), {
          className: "sde-axis-label",
          "text-anchor": "end"
        })
      );
    }
    for (var xTick = 0; xTick <= 4; xTick += 1) {
      var value = bounds.min + (xTick / 4) * (bounds.max - bounds.min);
      var x = xMap(value);
      svg.appendChild(line(api, x, top, x, top + plotHeight, "sde-grid"));
      svg.appendChild(
        svgText(api, x, height - 15, formatNumber(api, value, 2), {
          className: "sde-axis-label"
        })
      );
    }
    svg.appendChild(line(api, left, top + plotHeight, width - right, top + plotHeight, "sde-axis"));
    svg.appendChild(line(api, left, top, left, top + plotHeight, "sde-axis"));
    var barWidth = (plotWidth / bins) * 0.38;
    for (var bin = 0; bin < bins; bin += 1) {
      var binStart = bounds.min + bin * binWidth;
      var center = xMap(binStart + binWidth / 2);
      var correctDensity = correctCounts[bin] / CONFIG.paths / binWidth;
      var wrongDensity = wrongCounts[bin] / CONFIG.paths / binWidth;
      var correctHeight = top + plotHeight - yMap(correctDensity);
      var wrongHeight = top + plotHeight - yMap(wrongDensity);
      svg.appendChild(
        makeSvg(api, "rect", {
          x: center - barWidth - 1,
          y: yMap(correctDensity),
          width: barWidth,
          height: Math.max(0, correctHeight),
          className: "sde-correct-fill"
        })
      );
      svg.appendChild(
        makeSvg(api, "rect", {
          x: center + 1,
          y: yMap(wrongDensity),
          width: barWidth,
          height: Math.max(0, wrongHeight),
          className: "sde-wrong-fill"
        })
      );
    }
    var densityValues = [];
    for (var sample = 0; sample <= 160; sample += 1) {
      var xValue =
        bounds.min + (sample / 160) * (bounds.max - bounds.min);
      densityValues.push(
        normalDensity(xValue, dataset.analyticMean, dataset.analyticVariance)
      );
    }
    var densityXMap = function (index, count) {
      return left + (index / (count - 1)) * plotWidth;
    };
    svg.appendChild(
      makeSvg(api, "path", {
        d: pointPath(densityValues, densityXMap, yMap),
        className: "sde-analytic"
      })
    );
    var meanX = xMap(dataset.analyticMean);
    svg.appendChild(line(api, meanX, top, meanX, top + plotHeight, "sde-analytic"));
    svg.appendChild(
      svgText(api, meanX + 5, top + 15, "m_T", {
        className: "sde-axis-label",
        "text-anchor": "start"
      })
    );
    svg.appendChild(
      svgText(api, left, 16, "密度（每单位 x）", {
        className: "sde-chart-label",
        "text-anchor": "start"
      })
    );
    svg.appendChild(
      svgText(api, width - right, height - 15, "x_T", {
        className: "sde-axis-label",
        "text-anchor": "end"
      })
    );
    return svg;
  }

  function drawConvergencePanel(
    api,
    svg,
    data,
    top,
    panelHeight,
    yMax,
    title,
    seriesKey,
    className,
    uid
  ) {
    var width = 760;
    var left = 54;
    var right = 18;
    var bottom = 27;
    var plotWidth = width - left - right;
    var plotHeight = panelHeight - bottom - 22;
    var xMap = function (index) {
      return left + (index / (data.length - 1)) * plotWidth;
    };
    var yMap = function (value) {
      return top + 22 + ((yMax - value) / yMax) * plotHeight;
    };
    svg.appendChild(
      makeSvg(api, "rect", {
        x: left,
        y: top + 22,
        width: plotWidth,
        height: plotHeight,
        className: "sde-panel"
      })
    );
    for (var yTick = 0; yTick <= 2; yTick += 1) {
      var yValue = (yTick / 2) * yMax;
      var y = yMap(yValue);
      svg.appendChild(line(api, left, y, width - right, y, "sde-grid"));
      svg.appendChild(
        svgText(api, left - 8, y + 4, formatNumber(api, yValue, 3), {
          className: "sde-axis-label",
          "text-anchor": "end"
        })
      );
    }
    data.forEach(function (item, index) {
      var x = xMap(index);
      svg.appendChild(
        line(api, x, top + 22, x, top + 22 + plotHeight, "sde-grid")
      );
      svg.appendChild(
        svgText(api, x, top + panelHeight - 8, "L=" + item.level, {
          className: "sde-axis-label"
        })
      );
    });
    svg.appendChild(
      line(api, left, top + 22 + plotHeight, width - right, top + 22 + plotHeight, "sde-axis")
    );
    svg.appendChild(
      svgText(api, left, top + 13, title, {
        className: "sde-chart-label",
        "text-anchor": "start"
      })
    );
    var values = data.map(function (item) {
      return item[seriesKey];
    });
    svg.appendChild(
      makeSvg(api, "path", {
        d: pointPath(values, function (index) {
          return xMap(index);
        }, yMap),
        className: className
      })
    );
    values.forEach(function (value, index) {
      svg.appendChild(
        makeSvg(api, "circle", {
          cx: xMap(index),
          cy: yMap(value),
          r: 3.8,
          className: className === "sde-strong"
            ? "sde-dot-correct"
            : "sde-dot-wrong"
        })
      );
    });
  }

  function drawConvergenceChart(api, data, uid) {
    var width = 760;
    var height = 430;
    var svg = chartFrame(
      api,
      width,
      height,
      "EM 步长收敛：强 RMS 与解析弱偏差",
      "上图是同一噪声耦合下相对最高层 EM 的终点强 RMS；下图是测试函数 phi(x)=x 的精确 EM 期望与解析 OU 均值之差，E_EM[X_T]=x0(1-theta*h)^steps。分布账本的经验统计另用有限 ensemble 估计。它们是有限诊断，不是收敛证明。",
      uid
    );
    var strongMax = Math.max.apply(
      Math,
      data.map(function (item) {
        return item.strong;
      })
    );
    var weakMax = Math.max.apply(
      Math,
      data.map(function (item) {
        return item.weak;
      })
    );
    drawConvergencePanel(
      api,
      svg,
      data,
      0,
      190,
      Math.max(0.02, strongMax * 1.18),
      "强诊断：RMS(X_T^(h) − X_T^(L=8))",
      "strong",
      "sde-strong",
      uid + "-strong"
    );
    drawConvergencePanel(
      api,
      svg,
      data,
      215,
      190,
      Math.max(0.02, weakMax * 1.18),
      "弱诊断：| E_EM[X_T] − m_T |，φ(x)=x",
      "weak",
      "sde-weak",
      uid + "-weak"
    );
    return svg;
  }

  function makeLegend(api, items) {
    return makeElement(
      api,
      "div",
      { className: "sde-legend", "aria-label": "图例" },
      items.map(function (item) {
        return makeElement(api, "span", { className: "sde-legend-item" }, [
          makeElement(api, "span", {
            className: "sde-swatch " + item.swatch,
            "aria-hidden": "true"
          }),
          item.label
        ]);
      })
    );
  }

  function metricTable(api, headers, rows, className) {
    var headCells = headers.map(function (header, index) {
      return makeElement(api, "th", {
        scope: "col",
        className: index === 0 ? "" : undefined
      }, [header]);
    });
    var bodyRows = rows.map(function (row) {
      return makeElement(
        api,
        "tr",
        {},
        row.map(function (value, index) {
          return makeElement(api, index === 0 ? "th" : "td", {
            scope: index === 0 ? "row" : undefined
          }, [value]);
        })
      );
    });
    return makeElement(api, "div", { className: "sde-table-wrap" }, [
      makeElement(api, "table", { className: "sde-table " + (className || "") }, [
        makeElement(api, "thead", {}, [
          makeElement(api, "tr", {}, headCells)
        ]),
        makeElement(api, "tbody", {}, bodyRows)
      ])
    ]);
  }

  function stageTitle(api, title, note) {
    return makeElement(api, "div", { className: "sde-stage-title" }, [
      makeElement(api, "span", {}, [title]),
      makeElement(api, "span", {}, [note])
    ]);
  }

  function makeRangeControl(api, uid, labelText, min, max, step, value) {
    var inputId = uid + "-input";
    var output = makeElement(api, "output", { for: inputId }, ["—"]);
    var label = makeElement(api, "label", { htmlFor: inputId }, [
      labelText,
      " ",
      output
    ]);
    var input = makeElement(api, "input", {
      id: inputId,
      type: "range",
      min: min,
      max: max,
      step: step,
      value: value
    });
    var node = makeElement(api, "div", { className: "sde-control" }, [
      label,
      input
    ]);
    return { node: node, input: input, output: output };
  }

  function convergenceData(dataset) {
    var reference = dataset.levels[CONFIG.maxLevel].correctEndpoints;
    var result = [];
    for (
      var level = CONFIG.minLevel;
      level <= CONFIG.maxLevel;
      level += 1
    ) {
      var levelResult = dataset.levels[level];
      var sumSquares = 0;
      levelResult.correctEndpoints.forEach(function (value, index) {
        var difference = value - reference[index];
        sumSquares += difference * difference;
      });
      var strong = Math.sqrt(sumSquares / CONFIG.paths);
      var weak = Math.abs(
        CONFIG.x0 *
          Math.pow(1 - CONFIG.theta * levelResult.h, levelResult.steps) -
          dataset.analyticMean
      );
      result.push({
        level: level,
        h: levelResult.h,
        strong: strong,
        weak: weak
      });
    }
    return result;
  }

  window.CourseLearning.register("sde-path-distribution", function (root, api) {
    installStyles();
    INSTANCE += 1;
    var uid = "sde-lab-" + INSTANCE;
    var state = {
      level: CONFIG.defaultLevel,
      path: CONFIG.defaultPath
    };
    var dataset = makeDataset();
    var convergence = convergenceData(dataset);
    var refs = {};
    var levelControl = makeRangeControl(
      api,
      uid + "-level",
      "步长层级 L",
      CONFIG.minLevel,
      CONFIG.maxLevel,
      1,
      state.level
    );
    var pathControl = makeRangeControl(
      api,
      uid + "-path",
      "显示路径",
      0,
      CONFIG.paths - 1,
      1,
      state.path
    );
    refs.levelInput = levelControl.input;
    refs.levelOutput = levelControl.output;
    refs.pathInput = pathControl.input;
    refs.pathOutput = pathControl.output;

    var presetButtons = LEVEL_PRESETS.map(function (level) {
      var button = makeElement(api, "button", {
        type: "button",
        "data-level": level,
        "aria-pressed": "false"
      }, ["L=" + level]);
      button.addEventListener("click", function () {
        state.level = level;
        render();
      });
      return button;
    });
    var presetGrid = makeElement(api, "div", { className: "sde-preset-grid" }, presetButtons);
    var resetButton = makeElement(api, "button", {
      type: "button",
      className: "sde-primary sde-reset"
    }, ["重置：回到固定噪声"]);
    var status = makeElement(api, "p", {
      className: "sde-status",
      "aria-live": "polite"
    }, [""]);
    refs.status = status;

    var controls = makeElement(api, "div", { className: "sde-controls" }, [
      makeElement(api, "h4", { className: "sde-heading" }, ["控制台"]),
      levelControl.node,
      presetGrid,
      pathControl.node,
      resetButton,
      makeElement(api, "p", { className: "sde-note" }, [
        "固定参数：T=2，x₀=1.4，θ=1.15，σ=0.85；",
        CONFIG.paths,
        " 条轨迹由同一最高层高斯噪声聚合而来。"
      ]),
      status
    ]);

    var pathHost = makeElement(api, "div", { className: "sde-stage-frame" });
    var distributionHost = makeElement(api, "div", {
      className: "sde-stage-frame"
    });
    var convergenceHost = makeElement(api, "div", {
      className: "sde-stage-frame"
    });
    var stage = makeElement(api, "div", { className: "sde-stage" }, [
      pathHost,
      distributionHost,
      convergenceHost
    ]);
    var heading = makeElement(api, "h3", {
      className: "sde-heading",
      id: uid + "-heading"
    }, ["SDE 路径—分布双账本"]);
    var intro = makeElement(api, "p", { className: "sde-intro" }, [
      "先看一条 OU 路径，再看同一噪声账本下的 256 个终点。正确 EM 用 √h·Z，红色对照故意用 h·Z；解析均值/方差只作可核对的定理靶点。"
    ]);

    clear(root);
    root.classList.add("sde-path-distribution-lab");
    root.setAttribute("aria-labelledby", uid + "-heading");
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(
      makeElement(api, "div", { className: "sde-layout" }, [controls, stage])
    );

    function render() {
      var level = clamp(
        Math.round(Number(state.level)),
        CONFIG.minLevel,
        CONFIG.maxLevel
      );
      var path = clamp(
        Math.round(Number(state.path)),
        0,
        CONFIG.paths - 1
      );
      state.level = level;
      state.path = path;
      var result = dataset.levels[level];
      var correctStats = result.correctStats;
      var wrongStats = result.wrongStats;
      var correctEndpoint = result.correctEndpoints[path];
      var wrongEndpoint = result.wrongEndpoints[path];
      refs.levelInput.value = String(level);
      refs.pathInput.value = String(path);
      refs.levelOutput.textContent =
        "L=" + level + " · N=" + result.steps + " · h=" + formatStep(result.h);
      refs.pathOutput.textContent = "第 " + (path + 1) + " / " + CONFIG.paths;
      refs.levelInput.setAttribute("aria-valuetext", refs.levelOutput.textContent);
      refs.pathInput.setAttribute("aria-valuetext", refs.pathOutput.textContent);
      presetButtons.forEach(function (button) {
        button.setAttribute(
          "aria-pressed",
          Number(button.getAttribute("data-level")) === level ? "true" : "false"
        );
      });
      refs.status.textContent =
        "当前路径终点：正确 " +
        formatNumber(api, correctEndpoint, 3) +
        "；错误 " +
        formatNumber(api, wrongEndpoint, 3) +
        "。ensemble 均值/方差：正确 (" +
        formatNumber(api, correctStats.mean, 3) +
        ", " +
        formatNumber(api, correctStats.variance, 3) +
        ")；解析 (" +
        formatNumber(api, dataset.analyticMean, 3) +
        ", " +
        formatNumber(api, dataset.analyticVariance, 3) +
        ")。";

      replaceChildren(pathHost, [
        stageTitle(api, "单路径账本", "路径 " + (path + 1) + " / " + CONFIG.paths),
        drawPathChart(api, result, path, uid + "-path-" + level + "-" + path),
        makeLegend(api, [
          { swatch: "sde-swatch-correct", label: "蓝：√h·Z 的 EM" },
          { swatch: "sde-swatch-wrong", label: "红：错误 h·Z" },
          { swatch: "sde-swatch-analytic", label: "绿虚线：解析均值" }
        ])
      ]);
      replaceChildren(distributionHost, [
        stageTitle(api, "分布账本", "终点 t=T · 每柱为密度"),
        drawDistributionChart(
          api,
          dataset,
          result,
          uid + "-distribution-" + level
        ),
        makeLegend(api, [
          { swatch: "sde-swatch-correct", label: "蓝：正确 EM 直方图" },
          { swatch: "sde-swatch-wrong", label: "红：错误标度直方图" },
          { swatch: "sde-swatch-analytic", label: "绿虚线：N(m_T,v_T)" }
        ]),
        makeElement(api, "div", { className: "sde-ledger-title" }, [
          "终点统计账本（",
          CONFIG.paths,
          " 条固定样本）"
        ]),
        metricTable(
          api,
          ["量", "正确 EM", "错误 h·Z", "解析 OU"],
          [
            [
              "均值 E[X_T]",
              formatNumber(api, correctStats.mean, 4),
              formatNumber(api, wrongStats.mean, 4),
              formatNumber(api, dataset.analyticMean, 4)
            ],
            [
              "方差 Var(X_T)",
              formatNumber(api, correctStats.variance, 4),
              formatNumber(api, wrongStats.variance, 4),
              formatNumber(api, dataset.analyticVariance, 4)
            ]
          ]
        ),
        makeElement(api, "p", { className: "sde-footnote" }, [
          "直方图是有限 Monte Carlo 近似；绿色曲线来自 OU 的解析分布，不是由这 256 个样本拟合出来的。"
        ])
      ]);
      replaceChildren(convergenceHost, [
        stageTitle(api, "收敛账本", "同一噪声耦合 · L=" + CONFIG.minLevel + "…"+ CONFIG.maxLevel),
        drawConvergenceChart(api, convergence, uid + "-convergence"),
        makeLegend(api, [
          { swatch: "sde-swatch-correct", label: "蓝：强 RMS（相对最高层 EM）" },
          { swatch: "sde-swatch-weak", label: "金：解析弱偏差（φ(x)=x）" }
        ]),
        makeElement(api, "div", { className: "sde-ledger-title" }, [
          "步长、强诊断与解析弱偏差"
        ]),
        metricTable(
          api,
          ["层级", "h", "强 RMS", "弱 |E_EM[X_T]−m_T|"],
          convergence.map(function (item) {
            return [
              "L=" + item.level,
              formatStep(item.h),
              formatNumber(api, item.strong, 5),
              formatNumber(api, item.weak, 5)
            ];
          })
        ),
        makeElement(api, "p", { className: "sde-footnote" }, [
          "强 RMS 的参考是同一噪声下的最高层 EM，不是连续时间精确解；弱列是 φ(x)=x 下的解析 EM 弱偏差 |x₀(1−θh)^N−m_T|，不是有限 ensemble 均值。分布账本的经验均值/方差仍是有限 Monte Carlo 估计；这些图显示比较口径，不能单独证明 EM 的渐近阶。"
        ])
      ]);
    }

    levelControl.input.addEventListener("input", function () {
      state.level = Number(levelControl.input.value);
      render();
    });
    pathControl.input.addEventListener("input", function () {
      state.path = Number(pathControl.input.value);
      render();
    });
    resetButton.addEventListener("click", function () {
      state.level = CONFIG.defaultLevel;
      state.path = CONFIG.defaultPath;
      render();
      if (api && typeof api.announce === "function") {
        api.announce(
          root,
          "实验已重置：固定种子、" +
            CONFIG.paths +
            " 条轨迹、L=" +
            CONFIG.defaultLevel +
            "、路径 1。"
        );
      }
    });

    render();
  });
}());
