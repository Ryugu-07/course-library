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
  var MAX_LEVEL = 10;
  var INSTANCE = 0;
  var STYLE_ID = "cl-brownian-roughness-style";
  var PRESETS = [
    { label: "样本 A · seed 20260722", seed: 20260722 },
    { label: "样本 B · seed 31415926", seed: 31415926 },
    { label: "样本 C · seed 27182818", seed: 27182818 }
  ];
  var LEVEL_PRESETS = [2, 4, 6, 8, 10];

  var STYLE_TEXT = [
    ".brownian-roughness-lab { --br-brownian: var(--accent, #315f9d); --br-smooth: var(--cl-gold, #9b6a12); --br-target: var(--cl-green, #39734d); --br-muted: var(--fg-soft, #6f6a60); --br-grid: currentColor; line-height: 1.5; }",
    "html[data-theme='dark'] .brownian-roughness-lab { --br-brownian: #83c8ff; --br-smooth: #e2b458; --br-target: #72bd8b; --br-muted: #b8b2a7; }",
    ".brownian-roughness-lab .br-layout { display: grid; grid-template-columns: minmax(220px, .72fr) minmax(0, 1.7fr); gap: 18px; align-items: start; }",
    ".brownian-roughness-lab .br-controls, .brownian-roughness-lab .br-stage { min-width: 0; }",
    ".brownian-roughness-lab .br-controls { display: grid; gap: 13px; }",
    ".brownian-roughness-lab .br-control { display: grid; gap: 6px; min-width: 0; }",
    ".brownian-roughness-lab .br-control > label, .brownian-roughness-lab .br-label { color: var(--fg-soft); font-size: 13px; font-weight: 650; }",
    ".brownian-roughness-lab .br-control output { color: var(--accent); font-variant-numeric: tabular-nums; }",
    ".brownian-roughness-lab .br-heading { margin: 0; }",
    ".brownian-roughness-lab select, .brownian-roughness-lab button { min-height: 44px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.35; }",
    ".brownian-roughness-lab select { width: 100%; padding: 7px 10px; }",
    ".brownian-roughness-lab input[type='range'] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
    ".brownian-roughness-lab button { padding: 8px 11px; cursor: pointer; }",
    ".brownian-roughness-lab button:hover { border-color: var(--accent); }",
    ".brownian-roughness-lab button[aria-pressed='true'], .brownian-roughness-lab .br-primary { background: var(--accent); border-color: var(--accent); color: var(--bg); font-weight: 700; }",
    ".brownian-roughness-lab select:focus-visible, .brownian-roughness-lab input:focus-visible, .brownian-roughness-lab button:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".brownian-roughness-lab .br-level-buttons { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 7px; }",
    ".brownian-roughness-lab .br-level-buttons button { min-width: 0; padding-left: 5px; padding-right: 5px; font-size: 12.5px; }",
    ".brownian-roughness-lab .br-note, .brownian-roughness-lab .br-status { margin: 0; color: var(--br-muted); font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".brownian-roughness-lab .br-status { min-height: 1.65em; color: var(--fg); font-weight: 650; }",
    ".brownian-roughness-lab .br-stage-frame { padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); overflow: hidden; }",
    ".brownian-roughness-lab .br-stage-title { display: flex; justify-content: space-between; gap: 10px; margin: 0 0 8px; color: var(--br-muted); font-size: 13px; }",
    ".brownian-roughness-lab .br-svg { display: block; width: 100%; height: auto; color: var(--fg); }",
    ".brownian-roughness-lab .br-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".brownian-roughness-lab .br-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.2; }",
    ".brownian-roughness-lab .br-grid { stroke: var(--br-grid); stroke-opacity: .14; stroke-width: 1; }",
    ".brownian-roughness-lab .br-zero { stroke: var(--br-grid); stroke-opacity: .45; stroke-width: 1.3; }",
    ".brownian-roughness-lab .br-axis { stroke: var(--br-grid); stroke-opacity: .58; stroke-width: 1.2; }",
    ".brownian-roughness-lab .br-target { stroke: var(--br-target); stroke-opacity: .78; stroke-width: 1.5; stroke-dasharray: 5 4; }",
    ".brownian-roughness-lab .br-level { fill: none; stroke: var(--br-brownian); stroke-width: 1.05; stroke-linecap: round; stroke-linejoin: round; opacity: .12; }",
    ".brownian-roughness-lab .br-level-current { stroke-width: 2.8; opacity: .95; }",
    ".brownian-roughness-lab .br-smooth-line { fill: none; stroke: var(--br-smooth); stroke-width: 2.1; stroke-dasharray: 7 4; stroke-linecap: round; stroke-linejoin: round; opacity: .92; }",
    ".brownian-roughness-lab .br-brownian-line, .brownian-roughness-lab .br-qv-line { fill: none; stroke: var(--br-brownian); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }",
    ".brownian-roughness-lab .br-qv-smooth-line { fill: none; stroke: var(--br-smooth); stroke-width: 2.1; stroke-dasharray: 7 4; stroke-linecap: round; stroke-linejoin: round; }",
    ".brownian-roughness-lab .br-dot { fill: var(--br-brownian); stroke: var(--bg); stroke-width: 1.6; }",
    ".brownian-roughness-lab .br-dot-smooth { fill: var(--br-smooth); stroke: var(--bg); stroke-width: 1.5; }",
    ".brownian-roughness-lab .br-dot-current { r: 4.7; }",
    ".brownian-roughness-lab .br-axis-label, .brownian-roughness-lab .br-caption { fill: var(--br-muted) !important; font-size: 11px; }",
    ".brownian-roughness-lab .br-chart-label { fill: var(--fg) !important; font-size: 12px; font-weight: 700; }",
    ".brownian-roughness-lab .br-legend { display: flex; flex-wrap: wrap; gap: 7px 15px; margin: 8px 2px 0; color: var(--br-muted); font-size: 12px; }",
    ".brownian-roughness-lab .br-legend-item { display: inline-flex; align-items: center; gap: 6px; }",
    ".brownian-roughness-lab .br-swatch { display: inline-block; width: 25px; height: 0; border-top: 3px solid currentColor; }",
    ".brownian-roughness-lab .br-swatch-brownian { color: var(--br-brownian); }",
    ".brownian-roughness-lab .br-swatch-smooth { color: var(--br-smooth); border-top-style: dashed; }",
    ".brownian-roughness-lab .br-swatch-target { color: var(--br-target); border-top-style: dashed; }",
    ".brownian-roughness-lab .br-ledger-title { margin: 15px 0 7px; color: var(--fg); font-size: 14px; font-weight: 700; }",
    ".brownian-roughness-lab .br-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }",
    ".brownian-roughness-lab .br-ledger { width: 100%; min-width: 390px; border-collapse: separate; border-spacing: 0; font-size: 13px; font-variant-numeric: tabular-nums; }",
    ".brownian-roughness-lab .br-ledger th, .brownian-roughness-lab .br-ledger td { padding: 8px 9px; border-bottom: 1px solid var(--border); text-align: right; }",
    ".brownian-roughness-lab .br-ledger th:first-child, .brownian-roughness-lab .br-ledger td:first-child { text-align: left; }",
    ".brownian-roughness-lab .br-ledger th { color: var(--br-muted); font-size: 12px; font-weight: 650; }",
    ".brownian-roughness-lab .br-ledger td:nth-child(2) { color: var(--br-brownian); font-weight: 700; }",
    ".brownian-roughness-lab .br-ledger td:nth-child(3) { color: var(--br-smooth); font-weight: 700; }",
    ".brownian-roughness-lab .br-footnote { margin: 10px 0 0; padding: 8px 10px; border-left: 3px solid var(--br-target); background: var(--block-bg, var(--bg)); color: var(--br-muted); font-size: 12.5px; line-height: 1.65; }",
    "@media (max-width: 760px) { .brownian-roughness-lab .br-layout { grid-template-columns: minmax(0, 1fr); } }",
    "@media (max-width: 500px) { .brownian-roughness-lab .br-stage-frame { padding: 5px; } .brownian-roughness-lab .br-level-buttons { grid-template-columns: repeat(3, minmax(0, 1fr)); } .brownian-roughness-lab .br-svg { min-width: 620px; max-width: none; } .brownian-roughness-lab .br-stage-frame { overflow-x: auto; -webkit-overflow-scrolling: touch; } }",
    "@media (prefers-reduced-motion: reduce) { .brownian-roughness-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
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

  function makeElement(api, tag, attrs, children) {
    if (api && typeof api.el === "function") {
      return api.el(tag, attrs || {}, children);
    }
    return appendChildren(setAttributes(document.createElement(tag), attrs || {}), children);
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

  function clear(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function replaceChildren(node, children) {
    if (node && typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
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

  function makeRng(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) | 0;
      var t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(rng) {
    var u = 0;
    while (u === 0) {
      u = rng();
    }
    var v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function smoothValue(t) {
    return 0.75 * Math.sin(2 * Math.PI * t) + 0.25 * Math.sin(6 * Math.PI * t);
  }

  function ledger(path, smoothPath) {
    var totalVariation = 0;
    var quadraticVariation = 0;
    var maxIncrement = 0;
    var smoothTotalVariation = 0;
    var smoothQuadraticVariation = 0;
    var smoothMaxIncrement = 0;
    for (var i = 1; i < path.length; i += 1) {
      var delta = path[i] - path[i - 1];
      var smoothDelta = smoothPath[i] - smoothPath[i - 1];
      totalVariation += Math.abs(delta);
      quadraticVariation += delta * delta;
      maxIncrement = Math.max(maxIncrement, Math.abs(delta));
      smoothTotalVariation += Math.abs(smoothDelta);
      smoothQuadraticVariation += smoothDelta * smoothDelta;
      smoothMaxIncrement = Math.max(smoothMaxIncrement, Math.abs(smoothDelta));
    }
    return {
      totalVariation: totalVariation,
      quadraticVariation: quadraticVariation,
      maxIncrement: maxIncrement,
      smoothTotalVariation: smoothTotalVariation,
      smoothQuadraticVariation: smoothQuadraticVariation,
      smoothMaxIncrement: smoothMaxIncrement
    };
  }

  function makeSample(seed) {
    var finestCount = 1 << MAX_LEVEL;
    var rng = makeRng(seed);
    var fineIncrements = [];
    var finePath = [0];
    var standardDeviation = 1 / Math.sqrt(finestCount);
    for (var i = 0; i < finestCount; i += 1) {
      fineIncrements.push(standardDeviation * gaussian(rng));
      finePath.push(finePath[finePath.length - 1] + fineIncrements[i]);
    }

    var levels = [];
    for (var level = 0; level <= MAX_LEVEL; level += 1) {
      var blockSize = 1 << (MAX_LEVEL - level);
      var path = [0];
      for (var j = 0; j < (1 << level); j += 1) {
        var blockSum = 0;
        var start = j * blockSize;
        for (var r = start; r < start + blockSize; r += 1) {
          blockSum += fineIncrements[r];
        }
        path.push(path[path.length - 1] + blockSum);
      }
      var smoothPath = path.map(function (_value, index) {
        return smoothValue(index / (path.length - 1));
      });
      levels.push({
        level: level,
        path: path,
        smoothPath: smoothPath,
        ledger: ledger(path, smoothPath)
      });
    }

    var values = finePath.slice();
    for (var s = 0; s <= finestCount; s += 1) {
      values.push(smoothValue(s / finestCount));
    }
    var min = Math.min.apply(Math, values);
    var max = Math.max.apply(Math, values);
    var padding = Math.max(0.14, (max - min) * 0.12);
    return {
      seed: seed,
      levels: levels,
      finePath: finePath,
      yMin: min - padding,
      yMax: max + padding
    };
  }

  function pointPath(values, xMap, yMap) {
    return values.map(function (value, index) {
      return (index === 0 ? "M" : "L") +
        xMap(index, values.length).toFixed(2) + "," +
        yMap(value).toFixed(2);
    }).join(" ");
  }

  function text(api, x, y, value, attrs) {
    var merged = Object.assign({
      x: x,
      y: y,
      "font-size": "12",
      "text-anchor": "middle",
      fill: "currentColor"
    }, attrs || {});
    return makeSvg(api, "text", merged, [value]);
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

  function circle(api, cx, cy, radius, className) {
    return makeSvg(api, "circle", {
      cx: cx,
      cy: cy,
      r: radius,
      className: className
    });
  }

  function chartFrame(api, width, height, titleText, descriptionText, uid) {
    var svg = makeSvg(api, "svg", {
      className: "br-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc"
    });
    svg.appendChild(makeSvg(api, "title", { id: uid + "-title" }, [titleText]));
    svg.appendChild(makeSvg(api, "desc", { id: uid + "-desc" }, [descriptionText]));
    return svg;
  }

  function drawPathChart(api, sample, selectedLevel, uid) {
    var width = 760;
    var height = 330;
    var left = 52;
    var right = 18;
    var top = 26;
    var bottom = 34;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var range = sample.yMax - sample.yMin;
    var xMap = function (index, count) {
      return left + (index / (count - 1)) * plotWidth;
    };
    var yMap = function (value) {
      return top + ((sample.yMax - value) / range) * plotHeight;
    };
    var svg = chartFrame(
      api,
      width,
      height,
      "布朗路径逐层折线",
      "浅色实线是不同 dyadic 层的同一固定布朗样本，粗线是当前层，虚线是光滑对照函数。",
      uid + "-path"
    );
    svg.appendChild(makeSvg(api, "rect", {
      x: left,
      y: top,
      width: plotWidth,
      height: plotHeight,
      className: "br-panel"
    }));

    for (var gy = 0; gy <= 4; gy += 1) {
      var value = sample.yMin + (sample.yMax - sample.yMin) * gy / 4;
      var y = yMap(value);
      svg.appendChild(line(api, left, y, width - right, y, "br-grid"));
      svg.appendChild(text(api, left - 8, y + 4, formatNumber(api, value, 2), {
        className: "br-axis-label",
        "text-anchor": "end"
      }));
    }
    var zeroY = yMap(0);
    if (zeroY >= top && zeroY <= top + plotHeight) {
      svg.appendChild(line(api, left, zeroY, width - right, zeroY, "br-zero"));
    }
    svg.appendChild(line(api, left, top + plotHeight, width - right, top + plotHeight, "br-axis"));
    [0, 0.5, 1].forEach(function (tick) {
      var x = left + tick * plotWidth;
      svg.appendChild(line(api, x, top + plotHeight, x, top + plotHeight + 5, "br-axis"));
      svg.appendChild(text(api, x, height - 10, String(tick), {
        className: "br-axis-label"
      }));
    });
    svg.appendChild(text(api, left, 15, "B(t)", {
      className: "br-chart-label",
      "text-anchor": "start"
    }));
    svg.appendChild(text(api, width - right, height - 10, "t", {
      className: "br-axis-label",
      "text-anchor": "end"
    }));

    for (var level = 0; level <= MAX_LEVEL; level += 1) {
      var levelData = sample.levels[level];
      svg.appendChild(makeSvg(api, "path", {
        d: pointPath(levelData.path, xMap, yMap),
        className: level === selectedLevel ? "br-level br-level-current" : "br-level"
      }));
    }
    var current = sample.levels[selectedLevel];
    svg.appendChild(makeSvg(api, "path", {
      d: pointPath(current.smoothPath, xMap, yMap),
      className: "br-smooth-line"
    }));
    svg.appendChild(circle(api, left, yMap(current.path[0]), 4, "br-dot"));
    svg.appendChild(circle(api, left + plotWidth, yMap(current.path[current.path.length - 1]), 4, "br-dot"));
    svg.appendChild(text(api, width - right - 2, top + 17, "当前 L=" + selectedLevel, {
      className: "br-axis-label",
      "text-anchor": "end"
    }));
    return svg;
  }

  function seriesPath(values, xMap, yMap) {
    return values.map(function (value, index) {
      return (index === 0 ? "M" : "L") +
        xMap(index).toFixed(2) + "," + yMap(value).toFixed(2);
    }).join(" ");
  }

  function drawQuadraticChart(api, sample, selectedLevel, uid) {
    var width = 760;
    var height = 250;
    var left = 52;
    var right = 18;
    var top = 25;
    var bottom = 34;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var brownValues = sample.levels.map(function (item) {
      return item.ledger.quadraticVariation;
    });
    var smoothValues = sample.levels.map(function (item) {
      return item.ledger.smoothQuadraticVariation;
    });
    var yMax = Math.max(1.25, Math.max.apply(Math, brownValues) * 1.12);
    var xMap = function (level) {
      return left + (level / MAX_LEVEL) * plotWidth;
    };
    var yMap = function (value) {
      return top + ((yMax - value) / yMax) * plotHeight;
    };
    var svg = chartFrame(
      api,
      width,
      height,
      "二次变差逐层收敛图",
      "蓝线是布朗样本的二次变差，金色虚线是光滑函数，绿色虚线是目标值一。",
      uid + "-qv"
    );
    svg.appendChild(makeSvg(api, "rect", {
      x: left,
      y: top,
      width: plotWidth,
      height: plotHeight,
      className: "br-panel"
    }));
    for (var gy = 0; gy <= 4; gy += 1) {
      var value = yMax * gy / 4;
      var y = yMap(value);
      svg.appendChild(line(api, left, y, width - right, y, "br-grid"));
      svg.appendChild(text(api, left - 8, y + 4, formatNumber(api, value, 2), {
        className: "br-axis-label",
        "text-anchor": "end"
      }));
    }
    svg.appendChild(line(api, left, yMap(1), width - right, yMap(1), "br-target"));
    svg.appendChild(line(api, left, top + plotHeight, width - right, top + plotHeight, "br-axis"));
    for (var level = 0; level <= MAX_LEVEL; level += 2) {
      var x = xMap(level);
      svg.appendChild(line(api, x, top + plotHeight, x, top + plotHeight + 5, "br-axis"));
      svg.appendChild(text(api, x, height - 10, "L=" + level, {
        className: "br-axis-label"
      }));
    }
    svg.appendChild(text(api, left, 15, "Q_L", {
      className: "br-chart-label",
      "text-anchor": "start"
    }));
    svg.appendChild(text(api, width - right, height - 10, "分割层数 L", {
      className: "br-axis-label",
      "text-anchor": "end"
    }));
    svg.appendChild(makeSvg(api, "path", {
      d: seriesPath(brownValues, xMap, yMap),
      className: "br-qv-line"
    }));
    svg.appendChild(makeSvg(api, "path", {
      d: seriesPath(smoothValues, xMap, yMap),
      className: "br-qv-smooth-line"
    }));
    for (var pointLevel = 0; pointLevel <= MAX_LEVEL; pointLevel += 1) {
      svg.appendChild(circle(
        api,
        xMap(pointLevel),
        yMap(brownValues[pointLevel]),
        pointLevel === selectedLevel ? 4.7 : 2.5,
        pointLevel === selectedLevel ? "br-dot br-dot-current" : "br-dot"
      ));
      svg.appendChild(circle(
        api,
        xMap(pointLevel),
        yMap(smoothValues[pointLevel]),
        2.2,
        "br-dot-smooth"
      ));
    }
    svg.appendChild(text(api, width - right - 2, yMap(1) - 7, "目标 1", {
      className: "br-axis-label",
      "text-anchor": "end"
    }));
    return svg;
  }

  function metricRow(api, label, brownValue, smoothValue) {
    return makeElement(api, "tr", {}, [
      makeElement(api, "th", { scope: "row" }, [label]),
      makeElement(api, "td", {}, [brownValue]),
      makeElement(api, "td", {}, [smoothValue])
    ]);
  }

  function legendItem(api, className, label) {
    return makeElement(api, "span", { className: "br-legend-item" }, [
      makeElement(api, "span", {
        className: "br-swatch " + className,
        "aria-hidden": "true"
      }),
      label
    ]);
  }

  window.CourseLearning.register("brownian-roughness", function (root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }

    installStyles();
    var uid = "cl-brownian-" + (INSTANCE += 1);
    var state = { preset: 0, level: 6 };
    var cache = Object.create(null);
    var refs = {};

    function getSample() {
      var preset = PRESETS[state.preset];
      if (!cache[preset.seed]) {
        cache[preset.seed] = makeSample(preset.seed);
      }
      return cache[preset.seed];
    }

    function setLevel(level) {
      state.level = clamp(Number(level), 0, MAX_LEVEL);
      render();
    }

    var heading = makeElement(api, "h3", { className: "br-heading" }, [
      "布朗粗糙度实验：三笔账，两个极限"
    ]);
    var intro = makeElement(api, "p", { className: "br-note" }, [
      "固定种子只用于复现同一份样本；每个分辨率都从最高层增量聚合而来。浅线显示逐层折线，当前层加粗，下面的账本同时列出布朗样本与光滑函数。"
    ]);

    var presetLabel = makeElement(api, "label", { htmlFor: uid + "-preset" }, [
      "固定样本"
    ]);
    var presetSelect = makeElement(api, "select", {
      id: uid + "-preset",
      "aria-label": "选择固定布朗样本",
      onchange: function () {
        state.preset = clamp(Number(presetSelect.value), 0, PRESETS.length - 1);
        render();
      }
    });
    PRESETS.forEach(function (preset, index) {
      presetSelect.appendChild(makeElement(api, "option", {
        value: String(index)
      }, [preset.label]));
    });

    var levelOutput = makeElement(api, "output", {
      htmlFor: uid + "-level"
    }, ["6"]);
    var levelLabel = makeElement(api, "label", { htmlFor: uid + "-level" }, [
      "分割层数 L = ",
      levelOutput
    ]);
    var levelInput = makeElement(api, "input", {
      id: uid + "-level",
      type: "range",
      min: "0",
      max: String(MAX_LEVEL),
      step: "1",
      value: String(state.level),
      "aria-label": "选择 dyadic 分割层数",
      oninput: function () {
        setLevel(levelInput.value);
      }
    });
    var levelButtonRow = makeElement(api, "div", {
      className: "br-level-buttons",
      role: "group",
      "aria-label": "常用分割层数"
    });
    var levelButtons = [];
    LEVEL_PRESETS.forEach(function (level) {
      var button = makeElement(api, "button", {
        type: "button",
        text: "L=" + level,
        "aria-label": "选择分割层数 " + level,
        onclick: function () {
          setLevel(level);
        }
      });
      levelButtons.push({ level: level, node: button });
      levelButtonRow.appendChild(button);
    });

    refs.presetSelect = presetSelect;
    refs.levelInput = levelInput;
    refs.levelOutput = levelOutput;
    refs.levelButtons = levelButtons;

    var controls = makeElement(api, "section", {
      className: "br-controls",
      "aria-labelledby": uid + "-controls-title"
    }, [
      makeElement(api, "h4", { id: uid + "-controls-title" }, ["参数"]),
      makeElement(api, "div", { className: "br-control" }, [
        presetLabel,
        presetSelect
      ]),
      makeElement(api, "div", { className: "br-control" }, [
        levelLabel,
        levelInput,
        levelButtonRow
      ]),
      makeElement(api, "p", { className: "br-note" }, [
        "最高层固定为 M=" + MAX_LEVEL + "；N=2^L 个等长小段。没有重新抽样按钮：换层只聚合同一份细增量。"
      ]),
      makeElement(api, "p", {
        className: "br-status",
        "aria-live": "polite"
      }, [""])
    ]);
    refs.status = controls.querySelector(".br-status");

    var pathHost = makeElement(api, "div", { className: "br-stage-frame" });
    var qvHost = makeElement(api, "div", { className: "br-stage-frame" });
    refs.pathHost = pathHost;
    refs.qvHost = qvHost;

    var ledgerTitle = makeElement(api, "div", {
      className: "br-ledger-title"
    }, ["同一分割上的三笔账"]);
    var ledgerTable = makeElement(api, "table", {
      className: "br-ledger"
    }, [
      makeElement(api, "thead", {}, [
        makeElement(api, "tr", {}, [
          makeElement(api, "th", { scope: "col" }, ["量"]),
          makeElement(api, "th", { scope: "col" }, ["布朗样本"]),
          makeElement(api, "th", { scope: "col" }, ["光滑对照"])
        ])
      ]),
      makeElement(api, "tbody", {})
    ]);
    refs.ledgerBody = ledgerTable.querySelector("tbody");

    var legend = makeElement(api, "div", {
      className: "br-legend",
      "aria-label": "图例"
    }, [
      legendItem(api, "br-swatch-brownian", "蓝：布朗样本（粗线为当前层）"),
      legendItem(api, "br-swatch-smooth", "金色虚线：光滑函数"),
      legendItem(api, "br-swatch-target", "绿色虚线：二次变差目标 1")
    ]);
    var footnote = makeElement(api, "p", { className: "br-footnote" }, [
      "读法边界：图中每一条有限折线都是样本；定理说的是随机变量在确定性分割加细时的收敛。单个样本的有限层波动不构成“几乎处处”的证明。"
    ]);

    var stage = makeElement(api, "section", {
      className: "br-stage",
      "aria-labelledby": uid + "-stage-title"
    }, [
      makeElement(api, "div", {
        className: "br-stage-title",
        id: uid + "-stage-title"
      }, [
        makeElement(api, "span", {}, ["逐层路径"]),
        makeElement(api, "span", { className: "br-note" }, ["[0,1]"])
      ]),
      pathHost,
      legend,
      qvHost,
      ledgerTitle,
      makeElement(api, "div", { className: "br-table-wrap" }, [ledgerTable]),
      footnote
    ]);

    clear(root);
    root.classList.add("brownian-roughness-lab");
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(makeElement(api, "div", { className: "br-layout" }, [
      controls,
      stage
    ]));

    function render() {
      var sample = getSample();
      var current = sample.levels[state.level];
      var preset = PRESETS[state.preset];
      refs.presetSelect.value = String(state.preset);
      refs.levelInput.value = String(state.level);
      refs.levelOutput.textContent = String(state.level);
      refs.levelButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.level === state.level ? "true" : "false");
      });
      refs.status.textContent =
        preset.label + "，L=" + state.level + "（N=" + (1 << state.level) +
        "）：Q=" + formatNumber(api, current.ledger.quadraticVariation, 3) +
        "；最大增量=" + formatNumber(api, current.ledger.maxIncrement, 3);
      replaceChildren(refs.pathHost, [
        makeElement(api, "div", { className: "br-stage-title" }, [
          makeElement(api, "span", {}, ["路径账本"]),
          makeElement(api, "span", { className: "br-note" }, [
            "seed " + preset.seed + " · L=" + state.level
          ])
        ]),
        drawPathChart(api, sample, state.level, uid)
      ]);
      replaceChildren(refs.qvHost, [
        makeElement(api, "div", { className: "br-stage-title" }, [
          makeElement(api, "span", {}, ["二次变差收敛图"]),
          makeElement(api, "span", { className: "br-note" }, [
            "目标：Q_L→1"
          ])
        ]),
        drawQuadraticChart(api, sample, state.level, uid)
      ]);
      replaceChildren(refs.ledgerBody, [
        metricRow(api, "线性变差 Σ|Δ|",
          formatNumber(api, current.ledger.totalVariation, 3),
          formatNumber(api, current.ledger.smoothTotalVariation, 3)),
        metricRow(api, "二次变差 Σ(Δ)^2",
          formatNumber(api, current.ledger.quadraticVariation, 3),
          formatNumber(api, current.ledger.smoothQuadraticVariation, 3)),
        metricRow(api, "最大增量 max|Δ|",
          formatNumber(api, current.ledger.maxIncrement, 3),
          formatNumber(api, current.ledger.smoothMaxIncrement, 3))
      ]);
    }

    render();
  });
}());
