(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "ito-quadratic-variation-lab-styles";
  var INSTANCE = 0;
  var T = 1;
  var MIN_LEVEL = 0;
  var MAX_LEVEL = 10;
  var DEFAULT_LEVEL = 6;
  var LEVEL_PRESETS = [0, 2, 4, 6, 8, 10];
  var PRESETS = [
    { id: "sample-a", label: "样本 A", seed: 20260722 },
    { id: "sample-b", label: "样本 B", seed: 31415926 },
    { id: "sample-c", label: "样本 C", seed: 27182818 }
  ];

  var STYLE_TEXT = [
    ".ito-qv-lab{--iqv-blue:var(--accent,#315f9d);--iqv-gold:var(--cl-gold,#9b6a12);--iqv-green:var(--cl-green,#39734d);--iqv-red:var(--cl-red,#b64335);--iqv-muted:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.5;overflow-wrap:anywhere;}",
    "html[data-theme='dark'] .ito-qv-lab{--iqv-blue:#83c8ff;--iqv-gold:#e2b458;--iqv-green:#72bd8b;--iqv-red:#ff8b7d;--iqv-muted:#b8b2a7;}",
    ".ito-qv-lab *{box-sizing:border-box;}",
    ".ito-qv-lab [hidden]{display:none!important;}",
    ".ito-qv-lab h3,.ito-qv-lab h4{margin:0 0 8px;line-height:1.35;}",
    ".ito-qv-lab p{margin:8px 0;}",
    ".ito-qv-lab button,.ito-qv-lab select,.ito-qv-lab input{font:inherit;}",
    ".ito-qv-lab button,.ito-qv-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);}",
    ".ito-qv-lab button{padding:8px 11px;cursor:pointer;}",
    ".ito-qv-lab button:hover,.ito-qv-lab select:hover{border-color:var(--accent);}",
    ".ito-qv-lab button:focus-visible,.ito-qv-lab select:focus-visible,.ito-qv-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".ito-qv-lab button[aria-pressed='true'],.ito-qv-lab .iqv-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}",
    ".ito-qv-lab .iqv-intro,.ito-qv-lab .iqv-note{color:var(--iqv-muted);font-size:13px;line-height:1.65;}",
    ".ito-qv-lab .iqv-prediction{margin:14px 0 0;padding:12px 14px;border-left:3px solid var(--iqv-gold);background:var(--bg);}",
    ".ito-qv-lab .iqv-prediction h4{color:var(--accent);}",
    ".ito-qv-lab .iqv-prediction-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}",
    ".ito-qv-lab .iqv-question{min-width:0;margin:0;padding:10px;border:1px solid var(--border);}",
    ".ito-qv-lab .iqv-question legend{max-width:100%;padding:0 5px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5;overflow-wrap:anywhere;}",
    ".ito-qv-lab .iqv-question label{display:grid;gap:5px;min-width:0;color:var(--iqv-muted);font-size:12.5px;}",
    ".ito-qv-lab select{width:100%;padding:7px 9px;}",
    ".ito-qv-lab .iqv-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}",
    ".ito-qv-lab .iqv-feedback{min-height:1.7em;margin:9px 0 0;font-size:13px;font-weight:650;line-height:1.6;}",
    ".ito-qv-lab .iqv-pass{color:var(--iqv-green);}",
    ".ito-qv-lab .iqv-warn{color:var(--iqv-red);}",
    ".ito-qv-lab .iqv-controls{margin-top:16px;padding:12px 14px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border);}",
    ".ito-qv-lab .iqv-control-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}",
    ".ito-qv-lab .iqv-control{display:grid;gap:5px;min-width:0;}",
    ".ito-qv-lab .iqv-control>label,.ito-qv-lab .iqv-control-title{color:var(--iqv-muted);font-size:12.5px;font-weight:700;line-height:1.4;}",
    ".ito-qv-lab .iqv-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".ito-qv-lab input[type='range']{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".ito-qv-lab .iqv-level-buttons,.ito-qv-lab .iqv-path-buttons{display:grid;gap:7px;}",
    ".ito-qv-lab .iqv-path-buttons{grid-template-columns:repeat(2,minmax(0,1fr));}",
    ".ito-qv-lab .iqv-path-buttons button{padding-left:5px;padding-right:5px;font-size:13px;word-break:keep-all;overflow-wrap:normal;}",
    ".ito-qv-lab .iqv-level-buttons{grid-template-columns:repeat(6,minmax(0,1fr));}",
    ".ito-qv-lab .iqv-level-buttons button{min-width:0;padding-left:5px;padding-right:5px;font-size:12px;}",
    ".ito-qv-lab .iqv-stage{margin-top:16px;min-width:0;}",
    ".ito-qv-lab .iqv-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 14px;}",
    ".ito-qv-lab .iqv-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".ito-qv-lab .iqv-metric span{display:block;color:var(--iqv-muted);font-size:11.5px;line-height:1.4;}",
    ".ito-qv-lab .iqv-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".ito-qv-lab .iqv-chart-frame{min-width:0;margin:12px 0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow:hidden;}",
    ".ito-qv-lab .iqv-chart-heading{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 7px;color:var(--iqv-muted);font-size:13px;}",
    ".ito-qv-lab svg{display:block;width:100%;height:auto;max-width:100%;background:var(--bg);}",
    ".ito-qv-lab svg text{fill:var(--fg);font-family:inherit;letter-spacing:0;}",
    ".ito-qv-lab .iqv-panel{fill:var(--bg);stroke:var(--border);stroke-width:1.2;}",
    ".ito-qv-lab .iqv-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1;}",
    ".ito-qv-lab .iqv-axis{stroke:currentColor;stroke-opacity:.58;stroke-width:1.2;}",
    ".ito-qv-lab .iqv-zero{stroke:currentColor;stroke-opacity:.42;stroke-width:1.2;}",
    ".ito-qv-lab .iqv-target{stroke:var(--iqv-green);stroke-width:1.6;stroke-dasharray:5 4;}",
    ".ito-qv-lab .iqv-brownian-level{fill:none;stroke:var(--iqv-blue);stroke-width:1;stroke-linecap:round;stroke-linejoin:round;opacity:.12;}",
    ".ito-qv-lab .iqv-brownian-current{fill:none;stroke:var(--iqv-blue);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round;opacity:.96;}",
    ".ito-qv-lab .iqv-smooth-current{fill:none;stroke:var(--iqv-gold);stroke-width:2.5;stroke-dasharray:7 4;stroke-linecap:round;stroke-linejoin:round;opacity:.96;}",
    ".ito-qv-lab .iqv-brownian-line{fill:none;stroke:var(--iqv-blue);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}",
    ".ito-qv-lab .iqv-smooth-line{fill:none;stroke:var(--iqv-gold);stroke-width:2.2;stroke-dasharray:7 4;stroke-linecap:round;stroke-linejoin:round;}",
    ".ito-qv-lab .iqv-dot{fill:var(--iqv-blue);stroke:var(--bg);stroke-width:1.6;}",
    ".ito-qv-lab .iqv-dot-smooth{fill:var(--iqv-gold);stroke:var(--bg);stroke-width:1.4;}",
    ".ito-qv-lab .iqv-axis-label{fill:var(--iqv-muted)!important;font-size:11px;}",
    ".ito-qv-lab .iqv-chart-label{fill:var(--fg)!important;font-size:12px;font-weight:700;}",
    ".ito-qv-lab .iqv-legend{display:flex;flex-wrap:wrap;gap:7px 15px;margin:8px 2px 0;color:var(--iqv-muted);font-size:12px;}",
    ".ito-qv-lab .iqv-legend-item{display:inline-flex;align-items:center;gap:6px;}",
    ".ito-qv-lab .iqv-swatch{display:inline-block;width:25px;height:0;border-top:3px solid currentColor;}",
    ".ito-qv-lab .iqv-swatch-blue{color:var(--iqv-blue);}",
    ".ito-qv-lab .iqv-swatch-gold{color:var(--iqv-gold);border-top-style:dashed;}",
    ".ito-qv-lab .iqv-swatch-green{color:var(--iqv-green);border-top-style:dashed;}",
    ".ito-qv-lab .iqv-ledger-title{margin:16px 0 7px;color:var(--fg);font-size:14px;font-weight:700;}",
    ".ito-qv-lab .iqv-table-wrap{max-width:100%;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border:1px solid var(--border);}",
    ".ito-qv-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums;}",
    ".ito-qv-lab caption{padding:8px;text-align:left;color:var(--iqv-muted);font-size:12px;}",
    ".ito-qv-lab th,.ito-qv-lab td{padding:8px 9px;border-bottom:1px solid var(--border);text-align:right;white-space:nowrap;vertical-align:top;}",
    ".ito-qv-lab th:first-child,.ito-qv-lab td:first-child,.ito-qv-lab th:last-child,.ito-qv-lab td:last-child{text-align:left;white-space:normal;}",
    ".ito-qv-lab th{color:var(--iqv-muted);font-size:11.5px;font-weight:700;}",
    ".ito-qv-lab td:nth-child(2){color:var(--iqv-blue);font-weight:700;}",
    ".ito-qv-lab td:nth-child(3){color:var(--iqv-gold);font-weight:700;}",
    ".ito-qv-lab .iqv-disclosure{margin-top:11px;padding:9px 10px;border-left:3px solid var(--iqv-green);background:var(--bg);color:var(--iqv-muted);font-size:12.5px;line-height:1.65;}",
    ".ito-qv-lab .iqv-disclosure strong{color:var(--fg);}",
    "@media(max-width:820px){.ito-qv-lab .iqv-prediction-grid,.ito-qv-lab .iqv-control-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.ito-qv-lab .iqv-metrics{grid-template-columns:repeat(3,minmax(0,1fr));}}",
    "@media(max-width:560px){.ito-qv-lab .iqv-prediction-grid,.ito-qv-lab .iqv-control-grid,.ito-qv-lab .iqv-metrics{grid-template-columns:minmax(0,1fr);}.ito-qv-lab .iqv-level-buttons{grid-template-columns:repeat(3,minmax(0,1fr));}.ito-qv-lab .iqv-path-buttons{grid-template-columns:repeat(2,minmax(0,1fr));}.ito-qv-lab .iqv-question{padding:8px;}.ito-qv-lab .iqv-chart-frame{padding:5px;overflow-x:auto;}.ito-qv-lab .iqv-chart-frame svg{min-width:620px;max-width:none;}}",
    "@media(prefers-reduced-motion:reduce){.ito-qv-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important;}}"
  ].join("\n");

  function finite(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function normalizeLevel(value) {
    return clamp(Math.round(finite(Number(value), DEFAULT_LEVEL)), MIN_LEVEL, MAX_LEVEL);
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
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
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

  function installStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) {
      return;
    }
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function formatNumber(api, value, digits) {
    if (!Number.isFinite(value)) {
      return "—";
    }
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function makeRng(seed) {
    var state = Number(seed) >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) | 0;
      var value = Math.imul(state ^ (state >>> 15), 1 | state);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
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

  function pathIncrements(path) {
    var increments = [];
    for (var i = 1; i < path.length; i += 1) {
      increments.push(path[i] - path[i - 1]);
    }
    return increments;
  }

  function analyzePath(path) {
    var totalVariation = 0;
    var quadraticVariation = 0;
    var cubicVariation = 0;
    var leftSum = 0;
    var maxIncrement = 0;
    for (var i = 1; i < path.length; i += 1) {
      var delta = path[i] - path[i - 1];
      var magnitude = Math.abs(delta);
      totalVariation += magnitude;
      quadraticVariation += delta * delta;
      cubicVariation += magnitude * magnitude * magnitude;
      leftSum += 2 * path[i - 1] * delta;
      maxIncrement = Math.max(maxIncrement, magnitude);
    }
    var start = path[0];
    var endpoint = path[path.length - 1];
    var endpointSquareDifference = endpoint * endpoint - start * start;
    var identityResidual = endpointSquareDifference - leftSum - quadraticVariation;
    return {
      start: start,
      endpoint: endpoint,
      totalVariation: totalVariation,
      quadraticVariation: quadraticVariation,
      cubicVariation: cubicVariation,
      leftSum: leftSum,
      endpointSquareDifference: endpointSquareDifference,
      identityResidual: identityResidual,
      maxIncrement: maxIncrement
    };
  }

  function makeSample(seed, maxLevel) {
    var topLevel = normalizeLevel(maxLevel === undefined ? MAX_LEVEL : maxLevel);
    var fineCount = Math.pow(2, topLevel);
    var rng = makeRng(seed);
    var fineIncrements = [];
    var finePath = [0];
    var standardDeviation = Math.sqrt(T / fineCount);
    var running = 0;
    var index;
    for (index = 0; index < fineCount; index += 1) {
      fineIncrements.push(standardDeviation * gaussian(rng));
      running += fineIncrements[index];
      finePath.push(running);
    }

    var levels = [];
    for (var level = 0; level <= topLevel; level += 1) {
      var pointCount = Math.pow(2, level);
      var blockSize = Math.pow(2, topLevel - level);
      var path = [];
      var smoothPath = [];
      for (var point = 0; point <= pointCount; point += 1) {
        path.push(finePath[point * blockSize]);
        smoothPath.push(smoothValue(point / pointCount));
      }
      levels.push({
        level: level,
        path: path,
        increments: pathIncrements(path),
        ledger: analyzePath(path),
        smoothPath: smoothPath,
        smoothIncrements: pathIncrements(smoothPath),
        smoothLedger: analyzePath(smoothPath)
      });
    }

    var smoothFine = [];
    for (index = 0; index <= fineCount; index += 1) {
      smoothFine.push(smoothValue(index / fineCount));
    }
    var allValues = finePath.concat(smoothFine);
    var minimum = Math.min.apply(Math, allValues);
    var maximum = Math.max.apply(Math, allValues);
    var padding = Math.max(0.14, (maximum - minimum) * 0.12);
    return {
      seed: Number(seed) >>> 0,
      maxLevel: topLevel,
      fineIncrements: fineIncrements,
      finePath: finePath,
      endpoint: finePath[finePath.length - 1],
      levels: levels,
      yMin: minimum - padding,
      yMax: maximum + padding
    };
  }

  function pathData(sample, level, pathType) {
    var current = sample.levels[normalizeLevel(level)];
    return pathType === "smooth"
      ? { values: current.smoothPath, ledger: current.smoothLedger, label: "光滑路径" }
      : { values: current.path, ledger: current.ledger, label: "Brownian" };
  }

  function pointPath(values, xMap, yMap) {
    return values.map(function (value, index) {
      return (index === 0 ? "M" : "L") +
        xMap(index, values.length).toFixed(2) + "," +
        yMap(value).toFixed(2);
    }).join(" ");
  }

  function seriesPath(values, xMap, yMap) {
    return values.map(function (value, index) {
      return (index === 0 ? "M" : "L") +
        xMap(index).toFixed(2) + "," +
        yMap(value).toFixed(2);
    }).join(" ");
  }

  function chartFrame(api, width, height, title, description, uid) {
    var svg = makeSvg(api, "svg", {
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc"
    });
    svg.appendChild(makeSvg(api, "title", { id: uid + "-title" }, [title]));
    svg.appendChild(makeSvg(api, "desc", { id: uid + "-desc" }, [description]));
    return svg;
  }

  function svgText(api, x, y, value, attrs) {
    var merged = Object.assign({
      x: x,
      y: y,
      "font-size": "12",
      "text-anchor": "middle",
      fill: "currentColor"
    }, attrs || {});
    return makeSvg(api, "text", merged, [value]);
  }

  function svgLine(api, x1, y1, x2, y2, className) {
    return makeSvg(api, "line", {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      className: className
    });
  }

  function svgCircle(api, cx, cy, radius, className) {
    return makeSvg(api, "circle", {
      cx: cx,
      cy: cy,
      r: radius,
      className: className
    });
  }

  function drawPathChart(api, sample, selectedLevel, pathType, uid) {
    var width = 760;
    var height = 340;
    var left = 54;
    var right = 18;
    var top = 27;
    var bottom = 36;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var range = sample.yMax - sample.yMin;
    var xMap = function (index, count) {
      return left + (index / (count - 1)) * plotWidth;
    };
    var yMap = function (value) {
      return top + ((sample.yMax - value) / range) * plotHeight;
    };
    var current = sample.levels[selectedLevel];
    var currentData = pathType === "smooth" ? current.smoothPath : current.path;
    var svg = chartFrame(
      api,
      width,
      height,
      "同一 Brownian 样本的 nested path",
      "浅蓝线是同一最高层增量聚合出的各个 Brownian 层；当前路径加粗，金色虚线是光滑对照。",
      uid + "-path"
    );
    svg.appendChild(makeSvg(api, "rect", {
      x: left,
      y: top,
      width: plotWidth,
      height: plotHeight,
      className: "iqv-panel"
    }));

    for (var grid = 0; grid <= 4; grid += 1) {
      var gridValue = sample.yMin + (sample.yMax - sample.yMin) * grid / 4;
      var gridY = yMap(gridValue);
      svg.appendChild(svgLine(api, left, gridY, width - right, gridY, "iqv-grid"));
      svg.appendChild(svgText(api, left - 8, gridY + 4, formatNumber(api, gridValue, 2), {
        className: "iqv-axis-label",
        "text-anchor": "end"
      }));
    }
    var zeroY = yMap(0);
    if (zeroY >= top && zeroY <= top + plotHeight) {
      svg.appendChild(svgLine(api, left, zeroY, width - right, zeroY, "iqv-zero"));
    }
    svg.appendChild(svgLine(api, left, top + plotHeight, width - right, top + plotHeight, "iqv-axis"));
    [0, 0.5, 1].forEach(function (tick) {
      var tickX = left + tick * plotWidth;
      svg.appendChild(svgLine(api, tickX, top + plotHeight, tickX, top + plotHeight + 5, "iqv-axis"));
      svg.appendChild(svgText(api, tickX, height - 11, String(tick), {
        className: "iqv-axis-label"
      }));
    });
    svg.appendChild(svgText(api, left, 16, "X(t)", {
      className: "iqv-chart-label",
      "text-anchor": "start"
    }));
    svg.appendChild(svgText(api, width - right, height - 11, "t", {
      className: "iqv-axis-label",
      "text-anchor": "end"
    }));

    for (var level = 0; level <= sample.maxLevel; level += 1) {
      var levelData = sample.levels[level];
      svg.appendChild(makeSvg(api, "path", {
        d: pointPath(levelData.path, xMap, yMap),
        className: pathType === "brownian" && level === selectedLevel
          ? "iqv-brownian-current"
          : "iqv-brownian-level"
      }));
    }
    if (pathType === "smooth") {
      svg.appendChild(makeSvg(api, "path", {
        d: pointPath(currentData, xMap, yMap),
        className: "iqv-smooth-current"
      }));
    }
    if (pathType === "brownian") {
      svg.appendChild(makeSvg(api, "path", {
        d: pointPath(current.smoothPath, xMap, yMap),
        className: "iqv-smooth-line"
      }));
    }
    svg.appendChild(svgCircle(api, left, yMap(currentData[0]), 4, pathType === "smooth" ? "iqv-dot-smooth" : "iqv-dot"));
    svg.appendChild(svgCircle(
      api,
      left + plotWidth,
      yMap(currentData[currentData.length - 1]),
      4,
      pathType === "smooth" ? "iqv-dot-smooth" : "iqv-dot"
    ));
    svg.appendChild(svgText(api, width - right - 2, top + 17,
      (pathType === "smooth" ? "光滑路径" : "Brownian") + " · L=" + selectedLevel, {
        className: "iqv-axis-label",
        "text-anchor": "end"
      }));
    return svg;
  }

  function drawQuadraticChart(api, sample, selectedLevel, uid) {
    var width = 760;
    var height = 270;
    var left = 54;
    var right = 18;
    var top = 26;
    var bottom = 36;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var brownValues = sample.levels.map(function (item) {
      return item.ledger.quadraticVariation;
    });
    var smoothValues = sample.levels.map(function (item) {
      return item.smoothLedger.quadraticVariation;
    });
    var maximum = Math.max.apply(Math, brownValues.concat(smoothValues));
    var yMax = Math.max(T * 1.25, maximum * 1.12, 0.1);
    var xMap = function (level) {
      return left + (level / sample.maxLevel) * plotWidth;
    };
    var yMap = function (value) {
      return top + ((yMax - value) / yMax) * plotHeight;
    };
    var svg = chartFrame(
      api,
      width,
      height,
      "二次变差 Q_L 的逐层账本",
      "蓝线是同一 Brownian 样本的 Q_L，金色虚线是光滑路径，绿色虚线是目标 T。",
      uid + "-qv"
    );
    svg.appendChild(makeSvg(api, "rect", {
      x: left,
      y: top,
      width: plotWidth,
      height: plotHeight,
      className: "iqv-panel"
    }));
    for (var grid = 0; grid <= 4; grid += 1) {
      var gridValue = yMax * grid / 4;
      var gridY = yMap(gridValue);
      svg.appendChild(svgLine(api, left, gridY, width - right, gridY, "iqv-grid"));
      svg.appendChild(svgText(api, left - 8, gridY + 4, formatNumber(api, gridValue, 2), {
        className: "iqv-axis-label",
        "text-anchor": "end"
      }));
    }
    svg.appendChild(svgLine(api, left, yMap(T), width - right, yMap(T), "iqv-target"));
    svg.appendChild(svgLine(api, left, top + plotHeight, width - right, top + plotHeight, "iqv-axis"));
    for (var level = 0; level <= sample.maxLevel; level += 2) {
      var tickX = xMap(level);
      svg.appendChild(svgLine(api, tickX, top + plotHeight, tickX, top + plotHeight + 5, "iqv-axis"));
      svg.appendChild(svgText(api, tickX, height - 11, "L=" + level, {
        className: "iqv-axis-label"
      }));
    }
    if (sample.maxLevel % 2 === 1) {
      var lastX = xMap(sample.maxLevel);
      svg.appendChild(svgLine(api, lastX, top + plotHeight, lastX, top + plotHeight + 5, "iqv-axis"));
      svg.appendChild(svgText(api, lastX, height - 11, "L=" + sample.maxLevel, {
        className: "iqv-axis-label"
      }));
    }
    svg.appendChild(svgText(api, left, 16, "Q_L", {
      className: "iqv-chart-label",
      "text-anchor": "start"
    }));
    svg.appendChild(svgText(api, width - right, height - 11, "分割层数", {
      className: "iqv-axis-label",
      "text-anchor": "end"
    }));
    svg.appendChild(makeSvg(api, "path", {
      d: seriesPath(brownValues, xMap, yMap),
      className: "iqv-brownian-line"
    }));
    svg.appendChild(makeSvg(api, "path", {
      d: seriesPath(smoothValues, xMap, yMap),
      className: "iqv-smooth-line"
    }));
    for (level = 0; level <= sample.maxLevel; level += 1) {
      svg.appendChild(svgCircle(
        api,
        xMap(level),
        yMap(brownValues[level]),
        level === selectedLevel ? 4.7 : 2.5,
        "iqv-dot"
      ));
      svg.appendChild(svgCircle(api, xMap(level), yMap(smoothValues[level]), 2.2, "iqv-dot-smooth"));
    }
    svg.appendChild(svgText(api, width - right - 2, yMap(T) - 7, "目标 T=1", {
      className: "iqv-axis-label",
      "text-anchor": "end"
    }));
    return svg;
  }

  function metric(api, label, value) {
    return makeElement(api, "div", { className: "iqv-metric" }, [
      makeElement(api, "span", {}, [label]),
      makeElement(api, "strong", {}, [value])
    ]);
  }

  function tableRow(api, label, brown, smooth, note) {
    return makeElement(api, "tr", {}, [
      makeElement(api, "th", { scope: "row" }, [label]),
      makeElement(api, "td", {}, [brown]),
      makeElement(api, "td", {}, [smooth]),
      makeElement(api, "td", {}, [note])
    ]);
  }

  function legendItem(api, className, label) {
    return makeElement(api, "span", { className: "iqv-legend-item" }, [
      makeElement(api, "span", {
        className: "iqv-swatch " + className,
        "aria-hidden": "true"
      }),
      label
    ]);
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }
    var doc = root.ownerDocument || document;
    installStyles(doc);
    var uid = "iqv-" + (INSTANCE += 1);
    var state = {
      preset: 0,
      level: DEFAULT_LEVEL,
      pathType: "brownian",
      revealed: false,
      predictions: {
        quadraticVariation: "",
        itoIntegral: "",
        gbmCorrection: ""
      }
    };
    var sampleCache = Object.create(null);
    var questionRefs = {};
    var levelButtons = [];
    var pathButtons = [];
    var refs = {};

    function announce(message) {
      if (api && typeof api.announce === "function") {
        api.announce(root, message);
      }
    }

    function getSample() {
      var preset = PRESETS[state.preset];
      if (!sampleCache[preset.seed]) {
        sampleCache[preset.seed] = makeSample(preset.seed);
      }
      return sampleCache[preset.seed];
    }

    function renderPrediction() {
      Object.keys(questionRefs).forEach(function (key) {
        questionRefs[key].value = state.predictions[key];
      });
      if (!state.revealed) {
        var filled = Object.keys(state.predictions).filter(function (key) {
          return state.predictions[key] !== "";
        }).length;
        refs.feedback.className = "iqv-feedback" + (filled === 3 ? "" : " iqv-warn");
        refs.feedback.textContent = filled === 3
          ? "三项已填写，点击“揭示账本”。"
          : "已记录 " + filled + "/3 项；先完成三项预测。";
        return;
      }
      var correct = Object.keys(state.predictions).filter(function (key) {
        return state.predictions[key] === refs.expected[key];
      }).length;
      refs.feedback.className = "iqv-feedback " + (correct === 3 ? "iqv-pass" : "iqv-warn");
      refs.feedback.textContent = "已揭示：" + correct + "/3 命中。揭示状态保留，仍可切换样本、层数和路径类型。";
    }

    function renderControls() {
      var preset = PRESETS[state.preset];
      refs.presetSelect.value = String(state.preset);
      refs.levelInput.value = String(state.level);
      refs.levelOutput.textContent = String(state.level);
      refs.presetStatus.textContent = preset.label + " · seed=" + preset.seed;
      levelButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.level === state.level ? "true" : "false");
      });
      pathButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.type === state.pathType ? "true" : "false");
      });
    }

    function renderResults() {
      var sample = getSample();
      var currentLevel = sample.levels[state.level];
      var current = pathData(sample, state.level, state.pathType);
      var brown = currentLevel.ledger;
      var smooth = currentLevel.smoothLedger;
      refs.status.textContent = current.label + " · " + PRESETS[state.preset].label +
        " · L=" + state.level + "（N=" + Math.pow(2, state.level) + "）";
      replaceChildren(refs.metrics, [
        metric(api, "当前路径", current.label),
        metric(api, "seed", String(PRESETS[state.preset].seed)),
        metric(api, "分割层数 L", String(state.level)),
        metric(api, "当前 X_T", formatNumber(api, current.ledger.endpoint, 5)),
        metric(api, "当前 Q_L", formatNumber(api, current.ledger.quadraticVariation, 5)),
        metric(api, "当前 I_L", formatNumber(api, current.ledger.leftSum, 5)),
        metric(api, "当前 I_L+Q_L", formatNumber(api,
          current.ledger.leftSum + current.ledger.quadraticVariation, 5)),
        metric(api, "当前残差", formatNumber(api, current.ledger.identityResidual, 5))
      ]);
      replaceChildren(refs.pathHost, [
        makeElement(api, "div", { className: "iqv-chart-heading" }, [
          makeElement(api, "span", {}, ["路径图"]),
          makeElement(api, "span", {}, [
            current.label + " · seed " + PRESETS[state.preset].seed + " · L=" + state.level
          ])
        ]),
        drawPathChart(api, sample, state.level, state.pathType, uid)
      ]);
      replaceChildren(refs.qvHost, [
        makeElement(api, "div", { className: "iqv-chart-heading" }, [
          makeElement(api, "span", {}, ["Q_L 逐层图"]),
          makeElement(api, "span", {}, ["绿色虚线：目标 T=1；曲线不要求单调"])
        ]),
        drawQuadraticChart(api, sample, state.level, uid)
      ]);
      replaceChildren(refs.ledgerBody, [
        tableRow(api, "Q_L = Σ(ΔX)^2",
          formatNumber(api, brown.quadraticVariation, 6),
          formatNumber(api, smooth.quadraticVariation, 6),
          "Brownian 单样本趋向 T 的诊断；光滑路径趋向 0"),
        tableRow(api, "I_L = Σ 2X_left ΔX",
          formatNumber(api, brown.leftSum, 6),
          formatNumber(api, smooth.leftSum, 6),
          "左端点和；Brownian 极限含 −T 修正"),
        tableRow(api, "X_T^2 − X_0^2",
          formatNumber(api, brown.endpointSquareDifference, 6),
          formatNumber(api, smooth.endpointSquareDifference, 6),
          "端点平方差"),
        tableRow(api, "I_L + Q_L",
          formatNumber(api, brown.leftSum + brown.quadraticVariation, 6),
          formatNumber(api, smooth.leftSum + smooth.quadraticVariation, 6),
          "逐层 telescoping 账"),
        tableRow(api, "残差 D − (I_L + Q_L)",
          formatNumber(api, brown.identityResidual, 3),
          formatNumber(api, smooth.identityResidual, 3),
          "只剩浮点舍入误差"),
        tableRow(api, "Σ|ΔX|^3",
          formatNumber(api, brown.cubicVariation, 6),
          formatNumber(api, smooth.cubicVariation, 6),
          "可选高阶诊断，不替代 QV 定理")
      ]);
    }

    function render() {
      renderPrediction();
      renderControls();
      refs.controls.hidden = !state.revealed;
      refs.results.hidden = !state.revealed;
      if (state.revealed) {
        renderResults();
      }
    }

    var shell = makeElement(api, "div", { className: "iqv-shell" });
    shell.appendChild(makeElement(api, "h3", { id: uid + "-title" }, [
      "二次变差实验：先猜普通链式法则缺了什么"
    ]));
    shell.appendChild(makeElement(api, "p", { className: "iqv-intro" }, [
      "先回答三项预测。揭示前只保留选择题；揭示后再打开固定样本、nested dyadic 层、路径图和逐层账本。"
    ]));

    var prediction = makeElement(api, "section", {
      className: "iqv-prediction",
      "aria-labelledby": uid + "-prediction-title"
    });
    prediction.appendChild(makeElement(api, "h4", {
      id: uid + "-prediction-title"
    }, ["预测门：三问都要先回答"]));
    var predictionGrid = makeElement(api, "div", { className: "iqv-prediction-grid" });
    var questions = [
      {
        key: "quadraticVariation",
        prompt: "1. Brownian 的 Q_L 极限",
        expected: "T",
        options: [
          ["", "请选择"],
          ["zero", "0"],
          ["T", "T"],
          ["random", "没有稳定口径"]
        ]
      },
      {
        key: "itoIntegral",
        prompt: "2. ∫ 2B dB 的左端和极限",
        expected: "ito",
        options: [
          ["", "请选择"],
          ["chain", "B_T² − B_0²"],
          ["ito", "B_T² − B_0² − T"],
          ["other", "0"]
        ]
      },
      {
        key: "gbmCorrection",
        prompt: "3. GBM 的 log 漂移",
        expected: "minus",
        options: [
          ["", "请选择"],
          ["none", "μ"],
          ["plus", "μ + σ²/2"],
          ["minus", "μ − σ²/2"]
        ]
      }
    ];
    refs.expected = {};
    questions.forEach(function (question) {
      refs.expected[question.key] = question.expected;
      var fieldset = makeElement(api, "fieldset", { className: "iqv-question" });
      fieldset.appendChild(makeElement(api, "legend", {}, [question.prompt]));
      var selectId = uid + "-" + question.key;
      var select = makeElement(api, "select", {
        id: selectId,
        "aria-label": question.prompt
      });
      question.options.forEach(function (option) {
        select.appendChild(makeElement(api, "option", { value: option[0] }, [option[1]]));
      });
      select.addEventListener("change", function () {
        state.predictions[question.key] = select.value;
        render();
      });
      questionRefs[question.key] = select;
      fieldset.appendChild(makeElement(api, "label", { htmlFor: selectId }, [
        "选择判断",
        select
      ]));
      predictionGrid.appendChild(fieldset);
    });
    prediction.appendChild(predictionGrid);
    var actions = makeElement(api, "div", { className: "iqv-actions" });
    var checkButton = makeElement(api, "button", {
      type: "button",
      className: "iqv-primary"
    }, ["揭示账本"]);
    var resetButton = makeElement(api, "button", { type: "button" }, ["重置"]);
    actions.appendChild(checkButton);
    actions.appendChild(resetButton);
    prediction.appendChild(actions);
    refs.feedback = makeElement(api, "p", {
      className: "iqv-feedback",
      "aria-live": "polite",
      "aria-atomic": "true"
    }, ["已记录 0/3 项；先完成三项预测。"]);
    prediction.appendChild(refs.feedback);
    shell.appendChild(prediction);

    refs.controls = makeElement(api, "section", {
      className: "iqv-controls",
      "aria-labelledby": uid + "-controls-title",
      hidden: true
    });
    refs.controls.appendChild(makeElement(api, "h4", {
      id: uid + "-controls-title"
    }, ["揭示后的参数"]));
    var controlGrid = makeElement(api, "div", { className: "iqv-control-grid" });

    var presetSelect = makeElement(api, "select", {
      id: uid + "-preset",
      "aria-label": "选择固定 Brownian 样本"
    });
    PRESETS.forEach(function (preset, index) {
      presetSelect.appendChild(makeElement(api, "option", {
        value: String(index)
      }, [preset.label]));
    });
    presetSelect.addEventListener("change", function () {
      state.preset = clamp(Math.round(Number(presetSelect.value)), 0, PRESETS.length - 1);
      render();
    });
    refs.presetSelect = presetSelect;
    refs.presetStatus = makeElement(api, "output", {}, [""]);
    controlGrid.appendChild(makeElement(api, "div", { className: "iqv-control" }, [
      makeElement(api, "label", { htmlFor: uid + "-preset" }, ["固定样本"]),
      presetSelect,
      refs.presetStatus
    ]));

    var levelOutput = makeElement(api, "output", {
      htmlFor: uid + "-level"
    }, [String(DEFAULT_LEVEL)]);
    var levelInput = makeElement(api, "input", {
      id: uid + "-level",
      type: "range",
      min: String(MIN_LEVEL),
      max: String(MAX_LEVEL),
      step: "1",
      value: String(DEFAULT_LEVEL),
      "aria-label": "选择 nested dyadic 分割层数"
    });
    levelInput.addEventListener("input", function () {
      state.level = normalizeLevel(levelInput.value);
      render();
    });
    var levelButtonRow = makeElement(api, "div", {
      className: "iqv-level-buttons",
      role: "group",
      "aria-label": "常用分割层数"
    });
    LEVEL_PRESETS.forEach(function (level) {
      var button = makeElement(api, "button", {
        type: "button",
        "aria-label": "选择分割层数 " + level
      }, ["L=" + level]);
      button.addEventListener("click", function () {
        state.level = level;
        render();
      });
      levelButtons.push({ level: level, node: button });
      levelButtonRow.appendChild(button);
    });
    refs.levelInput = levelInput;
    refs.levelOutput = levelOutput;
    controlGrid.appendChild(makeElement(api, "div", { className: "iqv-control" }, [
      makeElement(api, "label", { htmlFor: uid + "-level" }, ["dyadic 层数 L = ", levelOutput]),
      levelInput,
      levelButtonRow
    ]));

    var pathButtonRow = makeElement(api, "div", {
      className: "iqv-path-buttons",
      role: "group",
      "aria-label": "选择路径类型"
    });
    [
      ["brownian", "Brownian 路径"],
      ["smooth", "光滑路径"]
    ].forEach(function (item) {
      var button = makeElement(api, "button", {
        type: "button",
        "aria-label": "选择" + item[1]
      }, [item[1]]);
      button.addEventListener("click", function () {
        state.pathType = item[0];
        render();
      });
      pathButtons.push({ type: item[0], node: button });
      pathButtonRow.appendChild(button);
    });
    controlGrid.appendChild(makeElement(api, "div", { className: "iqv-control" }, [
      makeElement(api, "span", { className: "iqv-control-title" }, ["路径类型"]),
      pathButtonRow
    ]));
    refs.controls.appendChild(controlGrid);
    refs.controls.appendChild(makeElement(api, "p", { className: "iqv-note" }, [
      "最高层固定为 M=" + MAX_LEVEL + "；切换 L 只读取同一批细增量的 nested endpoint。"
    ]));
    refs.status = makeElement(api, "p", {
      className: "iqv-note",
      "aria-live": "polite"
    }, [""]);
    refs.controls.appendChild(refs.status);
    shell.appendChild(refs.controls);

    refs.results = makeElement(api, "section", {
      className: "iqv-stage",
      "aria-label": "揭示后的路径图和二次变差账本",
      hidden: true
    });
    refs.metrics = makeElement(api, "div", { className: "iqv-metrics" });
    refs.results.appendChild(refs.metrics);
    refs.pathHost = makeElement(api, "div", { className: "iqv-chart-frame" });
    refs.qvHost = makeElement(api, "div", { className: "iqv-chart-frame" });
    refs.results.appendChild(refs.pathHost);
    refs.results.appendChild(refs.qvHost);
    refs.results.appendChild(makeElement(api, "div", {
      className: "iqv-legend",
      "aria-label": "图例"
    }, [
      legendItem(api, "iqv-swatch-blue", "蓝：Brownian nested path"),
      legendItem(api, "iqv-swatch-gold", "金色虚线：光滑路径"),
      legendItem(api, "iqv-swatch-green", "绿色虚线：目标 Q=T")
    ]));
    refs.results.appendChild(makeElement(api, "div", {
      className: "iqv-ledger-title"
    }, ["QV / chain-rule 账本（当前层）"]));
    var table = makeElement(api, "table", {
      "aria-label": "Brownian 与光滑路径的二次变差和离散链式法则账本"
    });
    table.appendChild(makeElement(api, "caption", {}, [
      "同一层、同一分割上的逐项数值；Brownian 与光滑路径并列，残差应只剩浮点舍入。"
    ]));
    table.appendChild(makeElement(api, "thead", {}, [
      makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "col" }, ["量"]),
        makeElement(api, "th", { scope: "col" }, ["Brownian"]),
        makeElement(api, "th", { scope: "col" }, ["光滑路径"]),
        makeElement(api, "th", { scope: "col" }, ["解释"])
      ])
    ]));
    refs.ledgerBody = makeElement(api, "tbody");
    table.appendChild(refs.ledgerBody);
    refs.results.appendChild(makeElement(api, "div", { className: "iqv-table-wrap" }, [table]));
    refs.results.appendChild(makeElement(api, "p", { className: "iqv-disclosure" }, [
      makeElement(api, "strong", {}, ["边界："]),
      "图上的 Q_L 是一条固定有限路径的诊断，可能不单调；定理的 Brownian 二次变差收敛是在确定性分割上的 L²/概率收敛，dyadic 情形还可加强为几乎处处。"
    ]));
    shell.appendChild(refs.results);
    root.classList.add("ito-qv-lab");
    root.replaceChildren(shell);

    checkButton.addEventListener("click", function () {
      var missing = Object.keys(state.predictions).filter(function (key) {
        return state.predictions[key] === "";
      });
      if (missing.length) {
        refs.feedback.className = "iqv-feedback iqv-warn";
        refs.feedback.textContent = "还缺 " + missing.length + " 项预测；三问都填写后才能揭示。";
        announce(refs.feedback.textContent);
        return;
      }
      state.revealed = true;
      render();
      announce("账本已揭示；可以切换同一套样本的层数、seed 和路径类型。");
    });

    resetButton.addEventListener("click", function () {
      state.preset = 0;
      state.level = DEFAULT_LEVEL;
      state.pathType = "brownian";
      state.revealed = false;
      Object.keys(state.predictions).forEach(function (key) {
        state.predictions[key] = "";
      });
      render();
      announce("已重置预测和参数，账本重新隐藏。");
    });

    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) {
        throw new Error("ito-quadratic-variation self-test failed: " + message);
      }
    }
    function close(left, right, tolerance, message) {
      assert(Math.abs(left - right) <= tolerance, message + ": " + left + " vs " + right);
    }
    function finiteLedger(ledger, label) {
      Object.keys(ledger).forEach(function (key) {
        assert(Number.isFinite(ledger[key]), label + " has non-finite " + key);
      });
      assert(ledger.quadraticVariation >= 0, label + " QV is nonnegative");
      assert(ledger.totalVariation >= 0, label + " total variation is nonnegative");
      assert(ledger.cubicVariation >= 0, label + " cubic variation is nonnegative");
    }

    assert(PRESETS.length >= 3, "at least three teaching presets");
    assert(LEVEL_PRESETS[0] === MIN_LEVEL, "level presets include lower boundary");
    assert(LEVEL_PRESETS[LEVEL_PRESETS.length - 1] === MAX_LEVEL, "level presets include upper boundary");
    assert(normalizeLevel(-100) === MIN_LEVEL, "lower level clamp");
    assert(normalizeLevel(MAX_LEVEL + 100) === MAX_LEVEL, "upper level clamp");

    var reproducibleA = makeSample(PRESETS[0].seed);
    var reproducibleB = makeSample(PRESETS[0].seed);
    assert(reproducibleA.endpoint === reproducibleB.endpoint, "seeded endpoint reproducibility");
    assert(reproducibleA.fineIncrements.length === reproducibleB.fineIncrements.length, "seeded length reproducibility");
    reproducibleA.fineIncrements.forEach(function (value, index) {
      assert(value === reproducibleB.fineIncrements[index], "seeded increment reproducibility at " + index);
    });
    var otherSample = makeSample(PRESETS[1].seed);
    assert(reproducibleA.fineIncrements.some(function (value, index) {
      return value !== otherSample.fineIncrements[index];
    }), "different seeds produce a different path");

    var testSeeds = [0, PRESETS[0].seed, PRESETS[1].seed, PRESETS[2].seed, 4294967295];
    testSeeds.forEach(function (seed) {
      var sample = makeSample(seed);
      assert(sample.levels.length === MAX_LEVEL + 1, "all levels exist for seed " + seed);
      assert(sample.endpoint === sample.finePath[sample.finePath.length - 1], "fine endpoint for seed " + seed);
      for (var level = MIN_LEVEL; level <= MAX_LEVEL; level += 1) {
        var levelData = sample.levels[level];
        var pointCount = Math.pow(2, level);
        var blockSize = Math.pow(2, MAX_LEVEL - level);
        assert(levelData.path.length === pointCount + 1, "path length at seed " + seed + " L=" + level);
        assert(levelData.path[pointCount] === sample.endpoint, "nested endpoint at seed " + seed + " L=" + level);
        for (var point = 0; point <= pointCount; point += 1) {
          assert(levelData.path[point] === sample.finePath[point * blockSize],
            "nested endpoint value at seed " + seed + " L=" + level + " point=" + point);
        }
        finiteLedger(levelData.ledger, "Brownian seed " + seed + " L=" + level);
        finiteLedger(levelData.smoothLedger, "smooth seed " + seed + " L=" + level);
        var brownScale = 1 + Math.abs(levelData.ledger.endpointSquareDifference) +
          Math.abs(levelData.ledger.leftSum) + levelData.ledger.quadraticVariation;
        var smoothScale = 1 + Math.abs(levelData.smoothLedger.endpointSquareDifference) +
          Math.abs(levelData.smoothLedger.leftSum) + levelData.smoothLedger.quadraticVariation;
        close(levelData.ledger.identityResidual, 0, 1e-9 * brownScale,
          "Brownian telescoping identity at seed " + seed + " L=" + level);
        close(levelData.smoothLedger.identityResidual, 0, 1e-9 * smoothScale,
          "smooth telescoping identity at seed " + seed + " L=" + level);
      }
    });

    var smoothSample = makeSample(PRESETS[0].seed);
    assert(smoothSample.levels[8].smoothLedger.quadraticVariation <
      smoothSample.levels[4].smoothLedger.quadraticVariation,
      "smooth path QV decays from L=4 to L=8");
    assert(smoothSample.levels[MAX_LEVEL].smoothLedger.quadraticVariation <
      smoothSample.levels[8].smoothLedger.quadraticVariation,
      "smooth path QV decays from L=8 to finest level");
    assert(Number.isFinite(reproducibleA.levels[DEFAULT_LEVEL].ledger.quadraticVariation),
      "Brownian QV remains a finite diagnostic without a tight random threshold");

    return {
      checks: checks,
      presets: PRESETS.length,
      levels: MAX_LEVEL + 1,
      seeds: testSeeds.length
    };
  }

  var exported = {
    T: T,
    MIN_LEVEL: MIN_LEVEL,
    MAX_LEVEL: MAX_LEVEL,
    DEFAULT_LEVEL: DEFAULT_LEVEL,
    LEVEL_PRESETS: LEVEL_PRESETS,
    PRESETS: PRESETS,
    makeRng: makeRng,
    gaussian: gaussian,
    smoothValue: smoothValue,
    analyzePath: analyzePath,
    makeSample: makeSample,
    selfTest: selfTest
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") {
    host.CourseLearning.register("ito-quadratic-variation", mount);
  }
  if (typeof module !== "undefined" && module.exports &&
      typeof require !== "undefined" && require.main === module) {
    try {
      var report = selfTest();
      console.log(
        "ito-quadratic-variation self-test: PASS (" +
        report.checks + " checks, " + report.presets + " presets, " +
        report.levels + " levels, " + report.seeds + " seeds)"
      );
    } catch (error) {
      console.error("ito-quadratic-variation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
}(typeof window !== "undefined" ? window : null));
