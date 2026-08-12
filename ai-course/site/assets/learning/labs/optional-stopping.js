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
  var STYLE_ID = "cl-optional-stopping-style";
  var BASE_SEED = 20260722;
  var CORRIDOR_BATCH = 2200;
  var TRUNCATION_BATCH = 2600;
  var STRATEGY_BATCH = 2200;
  var MAX_CORRIDOR_STEPS = 200000;

  var STYLE_TEXT = [
    ".optional-stopping-lab { --os-blue: var(--cl-blue, #315f9d); --os-green: var(--cl-green, #39734d); --os-gold: var(--cl-gold, #9b6a12); --os-red: var(--cl-red, #b64335); --os-muted: var(--fg-soft, #6f6a60); --os-grid: currentColor; line-height: 1.5; }",
    "html[data-theme='dark'] .optional-stopping-lab { --os-blue: #83c8ff; --os-green: #72bd8b; --os-gold: #e2b458; --os-red: #f08c7d; --os-muted: #b8b2a7; }",
    ".optional-stopping-lab .os-heading { margin: 0; }",
    ".optional-stopping-lab .os-intro, .optional-stopping-lab .os-note, .optional-stopping-lab .os-status, .optional-stopping-lab .os-boundary { margin: 0; color: var(--os-muted); font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".optional-stopping-lab .os-status { min-height: 1.65em; color: var(--fg); font-weight: 650; }",
    ".optional-stopping-lab .os-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 14px; margin: 14px 0 18px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--block-bg, var(--bg)); }",
    ".optional-stopping-lab .os-toolbar-copy { min-width: 0; }",
    ".optional-stopping-lab .os-toolbar-copy strong, .optional-stopping-lab .os-toolbar-copy span { display: block; }",
    ".optional-stopping-lab .os-toolbar-copy span { color: var(--os-muted); font-size: 12.5px; }",
    ".optional-stopping-lab .os-card { margin-top: 18px; padding: 13px; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); }",
    ".optional-stopping-lab .os-card h4 { margin: 0; }",
    ".optional-stopping-lab .os-card > .os-note { margin-top: 5px; }",
    ".optional-stopping-lab .os-controls { display: grid; grid-template-columns: repeat(3, minmax(150px, 1fr)); gap: 11px 15px; margin-top: 13px; align-items: end; }",
    ".optional-stopping-lab .os-control { display: grid; gap: 5px; min-width: 0; }",
    ".optional-stopping-lab .os-control-wide { grid-column: 1 / -1; }",
    ".optional-stopping-lab .os-label { color: var(--fg-soft); font-size: 13px; font-weight: 650; }",
    ".optional-stopping-lab output, .optional-stopping-lab .os-output { color: var(--accent); font-variant-numeric: tabular-nums; }",
    ".optional-stopping-lab input[type='range'] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
    ".optional-stopping-lab select, .optional-stopping-lab button { min-height: 44px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.35; }",
    ".optional-stopping-lab select { width: 100%; padding: 7px 10px; }",
    ".optional-stopping-lab button { padding: 8px 12px; cursor: pointer; }",
    ".optional-stopping-lab button:hover { border-color: var(--accent); }",
    ".optional-stopping-lab button:focus-visible, .optional-stopping-lab select:focus-visible, .optional-stopping-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".optional-stopping-lab .os-primary { background: var(--accent); border-color: var(--accent); color: var(--bg); font-weight: 700; }",
    ".optional-stopping-lab .os-quick-buttons { display: flex; flex-wrap: wrap; gap: 7px; }",
    ".optional-stopping-lab .os-quick-buttons button { min-width: 44px; padding-left: 9px; padding-right: 9px; font-size: 12.5px; }",
    ".optional-stopping-lab .os-quick-buttons button[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); color: var(--bg); font-weight: 700; }",
    ".optional-stopping-lab .os-layout { display: grid; grid-template-columns: minmax(0, 1.22fr) minmax(260px, .78fr); gap: 14px; margin-top: 15px; align-items: start; }",
    ".optional-stopping-lab .os-stage, .optional-stopping-lab .os-ledger-box { min-width: 0; }",
    ".optional-stopping-lab .os-stage-frame { padding: 7px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); overflow: hidden; }",
    ".optional-stopping-lab .os-stage-title { display: flex; justify-content: space-between; gap: 9px; margin: 0 0 7px; color: var(--os-muted); font-size: 13px; }",
    ".optional-stopping-lab .os-svg { display: block; width: 100%; height: auto; color: var(--fg); }",
    ".optional-stopping-lab .os-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".optional-stopping-lab .os-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.2; }",
    ".optional-stopping-lab .os-grid { stroke: var(--os-grid); stroke-opacity: .14; stroke-width: 1; }",
    ".optional-stopping-lab .os-zero { stroke: var(--os-grid); stroke-opacity: .55; stroke-width: 1.35; }",
    ".optional-stopping-lab .os-boundary-line { stroke: var(--os-green); stroke-opacity: .72; stroke-width: 1.6; stroke-dasharray: 5 4; }",
    ".optional-stopping-lab .os-target-line { stroke: var(--os-gold); stroke-opacity: .78; stroke-width: 1.6; stroke-dasharray: 5 4; }",
    ".optional-stopping-lab .os-axis { stroke: var(--os-grid); stroke-opacity: .58; stroke-width: 1.2; }",
    ".optional-stopping-lab .os-path { fill: none; stroke: var(--os-blue); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }",
    ".optional-stopping-lab .os-path-muted { fill: none; stroke: var(--os-blue); stroke-width: 1.35; stroke-linecap: round; stroke-linejoin: round; opacity: .2; }",
    ".optional-stopping-lab .os-path-stopped { stroke: var(--os-green); }",
    ".optional-stopping-lab .os-path-survivor { stroke: var(--os-red); }",
    ".optional-stopping-lab .os-dot { fill: var(--os-blue); stroke: var(--bg); stroke-width: 2; }",
    ".optional-stopping-lab .os-dot-upper { fill: var(--os-green); }",
    ".optional-stopping-lab .os-dot-lower { fill: var(--os-red); }",
    ".optional-stopping-lab .os-axis-label, .optional-stopping-lab .os-caption { fill: var(--os-muted) !important; font-size: 11px; }",
    ".optional-stopping-lab .os-chart-label { fill: var(--fg) !important; font-size: 12px; font-weight: 700; }",
    ".optional-stopping-lab .os-legend { display: flex; flex-wrap: wrap; gap: 7px 14px; margin-top: 8px; color: var(--os-muted); font-size: 12px; }",
    ".optional-stopping-lab .os-legend-item { display: inline-flex; align-items: center; gap: 5px; }",
    ".optional-stopping-lab .os-swatch { display: inline-block; width: 25px; height: 0; border-top: 3px solid currentColor; }",
    ".optional-stopping-lab .os-swatch-blue { color: var(--os-blue); }",
    ".optional-stopping-lab .os-swatch-green { color: var(--os-green); }",
    ".optional-stopping-lab .os-swatch-red { color: var(--os-red); }",
    ".optional-stopping-lab .os-swatch-gold { color: var(--os-gold); border-top-style: dashed; }",
    ".optional-stopping-lab .os-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }",
    ".optional-stopping-lab .os-ledger { width: 100%; min-width: 390px; border-collapse: separate; border-spacing: 0; font-size: 12.5px; font-variant-numeric: tabular-nums; }",
    ".optional-stopping-lab .os-ledger th, .optional-stopping-lab .os-ledger td { padding: 7px 8px; border-bottom: 1px solid var(--border); text-align: right; vertical-align: top; }",
    ".optional-stopping-lab .os-ledger th:first-child, .optional-stopping-lab .os-ledger td:first-child { text-align: left; }",
    ".optional-stopping-lab .os-ledger th { color: var(--os-muted); font-size: 12px; font-weight: 650; }",
    ".optional-stopping-lab .os-ledger td:nth-child(2) { color: var(--os-blue); font-weight: 700; }",
    ".optional-stopping-lab .os-ledger td:nth-child(3) { color: var(--os-green); font-weight: 700; }",
    ".optional-stopping-lab .os-ledger td:nth-child(4) { color: var(--os-muted); }",
    ".optional-stopping-lab .os-footnote, .optional-stopping-lab .os-boundary { margin-top: 10px; padding: 8px 10px; border-left: 3px solid var(--os-gold); background: var(--block-bg, var(--bg)); }",
    ".optional-stopping-lab .os-boundary { border-left-color: var(--os-red); }",
    "@media (max-width: 900px) { .optional-stopping-lab .os-layout { grid-template-columns: minmax(0, 1fr); } .optional-stopping-lab .os-controls { grid-template-columns: repeat(2, minmax(150px, 1fr)); } }",
    "@media (max-width: 560px) { .optional-stopping-lab .os-card { padding: 10px; } .optional-stopping-lab .os-controls { grid-template-columns: minmax(0, 1fr); } .optional-stopping-lab .os-control-wide { grid-column: auto; } .optional-stopping-lab .os-toolbar { align-items: stretch; } .optional-stopping-lab .os-toolbar button { width: 100%; } .optional-stopping-lab .os-stage-frame { padding: 5px; overflow-x: auto; -webkit-overflow-scrolling: touch; } .optional-stopping-lab .os-svg { min-width: 620px; max-width: none; } }",
    "@media (prefers-reduced-motion: reduce) { .optional-stopping-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

  function installStyles() {
    var style;
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    document.head.appendChild(style);
  }

  function appendChildren(node, children) {
    var list;
    if (children === undefined || children === null) {
      return node;
    }
    list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) {
        return;
      }
      node.appendChild(child && child.nodeType ? child : document.createTextNode(String(child)));
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

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatNumber(api, value, digits) {
    var places = digits === undefined ? 3 : digits;
    var text;
    if (!finite(value)) {
      return "—";
    }
    if (api && typeof api.format === "function") {
      text = api.format(value, places);
    } else {
      text = value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }
    return String(text).replace(/-/g, "−");
  }

  function formatInteger(value) {
    if (!finite(value)) {
      return "—";
    }
    return value < 0 ? "−" + Math.abs(Math.round(value)) : String(Math.round(value));
  }

  function makeRng(seed) {
    var state = seed >>> 0;
    return function () {
      var t;
      state = (state + 0x6D2B79F5) | 0;
      t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mixSeed() {
    var value = BASE_SEED >>> 0;
    var i;
    for (i = 0; i < arguments.length; i += 1) {
      value = (value ^ ((Number(arguments[i]) * 2654435761) >>> 0)) >>> 0;
      value = (value + 0x9E3779B9) >>> 0;
      value ^= value >>> 16;
    }
    return value >>> 0;
  }

  function svgText(api, x, y, value, attrs) {
    var merged = {
      x: x,
      y: y,
      "font-size": "12",
      "text-anchor": "middle",
      fill: "currentColor"
    };
    Object.keys(attrs || {}).forEach(function (key) {
      merged[key] = attrs[key];
    });
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

  function pathData(values, xMap, yMap) {
    return values.map(function (value, index) {
      return (index === 0 ? "M" : "L") +
        xMap(index, values.length).toFixed(2) + "," +
        yMap(value).toFixed(2);
    }).join(" ");
  }

  function makeSvgFrame(api, width, height, label, description, uid) {
    var titleId = uid + "-title";
    var descId = uid + "-desc";
    var svg = makeSvg(api, "svg", {
      className: "os-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": titleId + " " + descId
    });
    svg.appendChild(makeSvg(api, "title", { id: titleId }, [label]));
    svg.appendChild(makeSvg(api, "desc", { id: descId }, [description]));
    return svg;
  }

  function legendItem(api, className, label) {
    return makeElement(api, "span", { className: "os-legend-item" }, [
      makeElement(api, "span", {
        className: "os-swatch " + className,
        "aria-hidden": "true"
      }),
      label
    ]);
  }

  function makeRow(api, label, observed, theoretical, note) {
    return makeElement(api, "tr", {}, [
      makeElement(api, "th", { scope: "row" }, [label]),
      makeElement(api, "td", {}, [observed]),
      makeElement(api, "td", {}, [theoretical]),
      makeElement(api, "td", {}, [note || ""])
    ]);
  }

  function controlBlock(api, label, input, output) {
    return makeElement(api, "div", { className: "os-control" }, [
      makeElement(api, "label", { className: "os-label", htmlFor: input.id }, [label, output]),
      input
    ]);
  }

  function makeRangeControl(api, uid, labelText, min, max, step, value, oninput) {
    var input = makeElement(api, "input", {
      id: uid,
      type: "range",
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(value),
      "aria-label": labelText,
      oninput: oninput
    });
    return {
      input: input,
      label: makeElement(api, "label", { className: "os-label", htmlFor: uid }, [labelText])
    };
  }

  function corridorTheory(N, k, p) {
    var q = 1 - p;
    var r;
    var hit;
    if (Math.abs(p - 0.5) < 1e-12) {
      return {
        hit: k / N,
        mean: k * (N - k),
        martingale: true
      };
    }
    r = q / p;
    hit = (1 - Math.pow(r, k)) / (1 - Math.pow(r, N));
    return {
      hit: hit,
      mean: (N * hit - k) / (p - q),
      martingale: false
    };
  }

  function simulateCorridorPath(N, k, p, rng) {
    var x = k;
    var path = [x];
    var steps = 0;
    while (x > 0 && x < N && steps < MAX_CORRIDOR_STEPS) {
      x += rng() < p ? 1 : -1;
      path.push(x);
      steps += 1;
    }
    return {
      path: path,
      endpoint: x,
      steps: steps,
      censored: x !== 0 && x !== N
    };
  }

  function sampleStats(sum, sumSquares, count) {
    var mean = sum / count;
    var variance = Math.max(0, (sumSquares - count * mean * mean) / Math.max(1, count - 1));
    return {
      mean: mean,
      variance: variance,
      se: Math.sqrt(variance / count)
    };
  }

  function simulateCorridorBatch(N, k, p) {
    var rng = makeRng(mixSeed(101, N, k, Math.round(p * 1000), CORRIDOR_BATCH));
    var hits = 0;
    var sumSteps = 0;
    var sumStepsSquares = 0;
    var censored = 0;
    var i;
    var trial;
    for (i = 0; i < CORRIDOR_BATCH; i += 1) {
      trial = simulateCorridorPath(N, k, p, rng);
      if (trial.endpoint === N) {
        hits += 1;
      }
      if (trial.censored) {
        censored += 1;
      }
      sumSteps += trial.steps;
      sumStepsSquares += trial.steps * trial.steps;
    }
    return {
      hit: hits / CORRIDOR_BATCH,
      hitSe: Math.sqrt((hits / CORRIDOR_BATCH) * (1 - hits / CORRIDOR_BATCH) / CORRIDOR_BATCH),
      steps: sampleStats(sumSteps, sumStepsSquares, CORRIDOR_BATCH),
      censored: censored
    };
  }

  function drawCorridorChart(api, data, N, k, p, uid) {
    var width = 760;
    var height = 310;
    var left = 45;
    var right = 18;
    var top = 28;
    var bottom = 35;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var svg = makeSvgFrame(
      api,
      width,
      height,
      "有限走廊中的一条随机游走路径",
      "从 k 出发，在 0 与 N 的边界停止；蓝线是路径，终点圆点显示命中的边界。",
      uid
    );
    var path = data.path;
    var yMap = function (value) {
      return top + (N - value) * plotHeight / N;
    };
    var xMap = function (index, length) {
      return left + (length <= 1 ? 0 : index * plotWidth / (length - 1));
    };
    var i;
    var value;
    var endpointClass = data.endpoint === N ? "os-dot-upper" : "os-dot-lower";

    svg.appendChild(makeSvg(api, "rect", {
      className: "os-panel",
      x: 8,
      y: 8,
      width: width - 16,
      height: height - 16,
      rx: 7
    }));
    svg.appendChild(svgText(api, left, 22, "Sₙ · p=" + formatNumber(api, p, 2), {
      className: "os-chart-label",
      "text-anchor": "start"
    }));
    for (i = 0; i <= N; i += 1) {
      if (N <= 12 || i % Math.ceil(N / 8) === 0 || i === N) {
        value = yMap(i);
        svg.appendChild(line(api, left, value, width - right, value, i === 0 || i === N ? "os-boundary-line" : "os-grid"));
        svg.appendChild(svgText(api, left - 8, value + 4, String(i), {
          className: "os-axis-label",
          "text-anchor": "end"
        }));
      }
    }
    svg.appendChild(line(api, left, top, left, height - bottom, "os-axis"));
    svg.appendChild(line(api, left, height - bottom, width - right, height - bottom, "os-axis"));
    svg.appendChild(svgText(api, left, height - 12, "n=0", {
      className: "os-axis-label",
      "text-anchor": "start"
    }));
    svg.appendChild(svgText(api, width - right, height - 12, "n=" + data.steps, {
      className: "os-axis-label",
      "text-anchor": "end"
    }));
    svg.appendChild(makeSvg(api, "path", {
      className: "os-path",
      d: pathData(path, xMap, yMap)
    }));
    svg.appendChild(makeSvg(api, "circle", {
      className: "os-dot " + endpointClass,
      cx: xMap(path.length - 1, path.length),
      cy: yMap(data.endpoint),
      r: 6
    }));
    svg.appendChild(makeSvg(api, "circle", {
      className: "os-dot",
      cx: xMap(0, path.length),
      cy: yMap(k),
      r: 4.5
    }));
    svg.appendChild(svgText(api, width - right - 2, yMap(data.endpoint) - 9, "终点 " + data.endpoint, {
      className: "os-chart-label",
      "text-anchor": "end"
    }));
    return svg;
  }

  function simulateFirstPassage(T, rng) {
    var x = 0;
    var path = [0];
    var t;
    var extra;
    var hit = false;
    var hitTime = null;
    for (t = 1; t <= T; t += 1) {
      x += rng() < 0.5 ? 1 : -1;
      path.push(x);
      if (x === 1) {
        hit = true;
        hitTime = t;
        break;
      }
    }
    if (hit) {
      extra = T - hitTime;
      while (extra > 0) {
        path.push(1);
        extra -= 1;
      }
    }
    return {
      path: path,
      endpoint: x,
      hit: hit,
      hitTime: hitTime,
      cappedPath: path
    };
  }

  function simulateTruncationBatch(T) {
    var rng = makeRng(mixSeed(202, T, TRUNCATION_BATCH));
    var sum = 0;
    var sumSquares = 0;
    var hits = 0;
    var survivorSum = 0;
    var i;
    var trial;
    for (i = 0; i < TRUNCATION_BATCH; i += 1) {
      trial = simulateFirstPassage(T, rng);
      if (trial.hit) {
        hits += 1;
        sum += 1;
        sumSquares += 1;
      } else {
        survivorSum += trial.endpoint;
        sum += trial.endpoint;
        sumSquares += trial.endpoint * trial.endpoint;
      }
    }
    return {
      count: TRUNCATION_BATCH,
      hitCount: hits,
      hitRate: hits / TRUNCATION_BATCH,
      survivorCount: TRUNCATION_BATCH - hits,
      survivorMean: TRUNCATION_BATCH === hits ? NaN : survivorSum / (TRUNCATION_BATCH - hits),
      capped: sampleStats(sum, sumSquares, TRUNCATION_BATCH)
    };
  }

  function drawTruncationChart(api, samples, T, uid) {
    var width = 760;
    var height = 300;
    var left = 45;
    var right = 18;
    var top = 28;
    var bottom = 35;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var min = 0;
    var max = 1;
    var svg;
    var yMap;
    var xMap;
    var i;
    var j;
    var all;
    var path;
    var endpoint;
    for (i = 0; i < samples.length; i += 1) {
      all = samples[i].cappedPath;
      for (j = 0; j < all.length; j += 1) {
        min = Math.min(min, all[j]);
        max = Math.max(max, all[j]);
      }
    }
    if (max - min < 4) {
      min -= 2;
      max += 2;
    } else {
      min -= 1;
      max += 1;
    }
    svg = makeSvgFrame(
      api,
      width,
      height,
      "首达加一的有限截断路径",
      "绿色路径在 T 前命中加一后保持在一；红色路径到 T 仍未停止，展示被筛掉的负尾部。",
      uid
    );
    yMap = function (value) {
      return top + (max - value) * plotHeight / (max - min);
    };
    xMap = function (index) {
      return left + index * plotWidth / T;
    };
    svg.appendChild(makeSvg(api, "rect", {
      className: "os-panel",
      x: 8,
      y: 8,
      width: width - 16,
      height: height - 16,
      rx: 7
    }));
    svg.appendChild(line(api, left, yMap(0), width - right, yMap(0), "os-zero"));
    svg.appendChild(line(api, left, yMap(1), width - right, yMap(1), "os-target-line"));
    svg.appendChild(svgText(api, left, 22, "Xₙ，截断 T=" + T, {
      className: "os-chart-label",
      "text-anchor": "start"
    }));
    svg.appendChild(svgText(api, left - 8, yMap(1) + 4, "1", {
      className: "os-axis-label",
      "text-anchor": "end"
    }));
    svg.appendChild(svgText(api, left - 8, yMap(0) + 4, "0", {
      className: "os-axis-label",
      "text-anchor": "end"
    }));
    svg.appendChild(svgText(api, width - right, height - 12, "n=T", {
      className: "os-axis-label",
      "text-anchor": "end"
    }));
    for (i = 0; i < samples.length; i += 1) {
      path = samples[i];
      svg.appendChild(makeSvg(api, "path", {
        className: "os-path-muted " + (path.hit ? "os-path-stopped" : "os-path-survivor"),
        d: pathData(path.cappedPath, xMap, yMap)
      }));
      endpoint = path.cappedPath[path.cappedPath.length - 1];
      if (i === 0) {
        svg.appendChild(makeSvg(api, "circle", {
          className: "os-dot " + (path.hit ? "os-dot-upper" : "os-dot-lower"),
          cx: xMap(path.cappedPath.length - 1),
          cy: yMap(endpoint),
          r: 5
        }));
      }
    }
    return svg;
  }

  function strategyName(index) {
    return ["固定下注 bₙ=1", "输后加倍（封顶 8）", "按过去位置反向下注"][index] || "固定下注 bₙ=1";
  }

  function strategyStake(index, position, lossStreak) {
    if (index === 1) {
      return Math.min(8, Math.pow(2, lossStreak));
    }
    if (index === 2) {
      return position > 0 ? -1 : 1;
    }
    return 1;
  }

  function simulateStrategy(horizon, strategy, rng) {
    var wealth = 0;
    var position = 0;
    var lossStreak = 0;
    var path = [0];
    var maxStake = 0;
    var peak = 0;
    var maxDrawdown = 0;
    var n;
    var stake;
    var coin;
    var gain;
    for (n = 0; n < horizon; n += 1) {
      stake = strategyStake(strategy, position, lossStreak);
      coin = rng() < 0.5 ? 1 : -1;
      gain = stake * coin;
      wealth += gain;
      position += coin;
      if (gain < 0) {
        lossStreak += 1;
      } else {
        lossStreak = 0;
      }
      peak = Math.max(peak, wealth);
      maxDrawdown = Math.max(maxDrawdown, peak - wealth);
      maxStake = Math.max(maxStake, Math.abs(stake));
      path.push(wealth);
    }
    return {
      path: path,
      final: wealth,
      maxStake: maxStake,
      maxDrawdown: maxDrawdown
    };
  }

  function simulateStrategyBatch(horizon, strategy) {
    var rng = makeRng(mixSeed(303, horizon, strategy, STRATEGY_BATCH));
    var sum = 0;
    var sumSquares = 0;
    var stakeSum = 0;
    var drawdownSum = 0;
    var i;
    var trial;
    for (i = 0; i < STRATEGY_BATCH; i += 1) {
      trial = simulateStrategy(horizon, strategy, rng);
      sum += trial.final;
      sumSquares += trial.final * trial.final;
      stakeSum += trial.maxStake;
      drawdownSum += trial.maxDrawdown;
    }
    return {
      final: sampleStats(sum, sumSquares, STRATEGY_BATCH),
      averageMaxStake: stakeSum / STRATEGY_BATCH,
      averageMaxDrawdown: drawdownSum / STRATEGY_BATCH
    };
  }

  function drawStrategyChart(api, data, horizon, strategy, uid) {
    var width = 760;
    var height = 280;
    var left = 45;
    var right = 18;
    var top = 28;
    var bottom = 35;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var min = 0;
    var max = 0;
    var i;
    var svg;
    var yMap;
    var xMap;
    for (i = 0; i < data.path.length; i += 1) {
      min = Math.min(min, data.path[i]);
      max = Math.max(max, data.path[i]);
    }
    if (max - min < 4) {
      min -= 2;
      max += 2;
    } else {
      min -= 1;
      max += 1;
    }
    svg = makeSvgFrame(
      api,
      width,
      height,
      "可预测下注策略的财富路径",
      "财富路径只使用过去的硬币结果决定下一次下注；水平线是初始财富零。",
      uid
    );
    yMap = function (value) {
      return top + (max - value) * plotHeight / (max - min);
    };
    xMap = function (index) {
      return left + index * plotWidth / horizon;
    };
    svg.appendChild(makeSvg(api, "rect", {
      className: "os-panel",
      x: 8,
      y: 8,
      width: width - 16,
      height: height - 16,
      rx: 7
    }));
    svg.appendChild(line(api, left, yMap(0), width - right, yMap(0), "os-zero"));
    svg.appendChild(svgText(api, left, 22, strategyName(strategy) + " · H=" + horizon, {
      className: "os-chart-label",
      "text-anchor": "start"
    }));
    svg.appendChild(svgText(api, left - 8, yMap(0) + 4, "0", {
      className: "os-axis-label",
      "text-anchor": "end"
    }));
    svg.appendChild(svgText(api, width - right, height - 12, "n=H", {
      className: "os-axis-label",
      "text-anchor": "end"
    }));
    svg.appendChild(makeSvg(api, "path", {
      className: "os-path",
      d: pathData(data.path, xMap, yMap)
    }));
    svg.appendChild(makeSvg(api, "circle", {
      className: "os-dot",
      cx: xMap(data.path.length - 1),
      cy: yMap(data.final),
      r: 5
    }));
    svg.appendChild(svgText(api, width - right - 2, yMap(data.final) - 9, "W_H=" + formatInteger(data.final), {
      className: "os-chart-label",
      "text-anchor": "end"
    }));
    return svg;
  }

  function renderCorridorLedger(api, body, data, batch, theory, N) {
    var hitError = Math.abs(batch.hit - theory.hit);
    var stepsError = Math.abs(batch.steps.mean - theory.mean);
    replaceChildren(body, [
      makeRow(api, "单条路径终点", formatInteger(data.endpoint), "0 或 " + N, "步数 " + data.steps),
      makeRow(api, "单条路径步数", formatInteger(data.steps), "—", data.censored ? "达到安全上限，已截断" : "已在边界停止"),
      makeRow(api, "命中 N 的经验概率", formatNumber(api, batch.hit, 4), formatNumber(api, theory.hit, 4), "误差 " + formatNumber(api, hitError, 4) + "；±2SE " + formatNumber(api, 2 * batch.hitSe, 3)),
      makeRow(api, "Eτ 的经验值", formatNumber(api, batch.steps.mean, 2), formatNumber(api, theory.mean, 2), "误差 " + formatNumber(api, stepsError, 2) + "；±2SE " + formatNumber(api, 2 * batch.steps.se, 2)),
      makeRow(api, "批量与机制", "M=" + CORRIDOR_BATCH, theory.martingale ? "p=1/2：Sₙ 与 Sₙ²−n 是鞅" : "p≠1/2：Sₙ 有漂移", batch.censored ? "安全上限样本 " + batch.censored : "确定性 PRNG")
    ]);
  }

  function renderStrategyLedger(api, body, data, batch, horizon, strategy) {
    replaceChildren(body, [
      makeRow(api, "单条路径最终财富", formatInteger(data.final), "—", "最大下注 " + formatInteger(data.maxStake)),
      makeRow(api, "批量 E[W_H] 估计", formatNumber(api, batch.final.mean, 3), "0（初始财富为 0）", "±2SE " + formatNumber(api, 2 * batch.final.se, 3)),
      makeRow(api, "策略", strategyName(strategy), "只依赖 Fₙ", "公平硬币；H=" + horizon),
      makeRow(api, "平均最大下注", formatNumber(api, batch.averageMaxStake, 2), "—", strategy === 1 ? "封顶为 8" : "路径依赖"),
      makeRow(api, "平均最大回撤", formatNumber(api, batch.averageMaxDrawdown, 2), "—", "风险不是期望"),
      makeRow(api, "结论", "有限样本 ±2SE", "不能造正期望", "加倍不等于无风险")
    ]);
  }

  function renderTruncationLedger(api, body, batch, T) {
    var survivorContribution = batch.survivorCount / batch.count * batch.survivorMean;
    replaceChildren(body, [
      makeRow(api, "全部样本的 X_{τ∧T}", formatNumber(api, batch.capped.mean, 3), "0（每个有限 T）", "±2SE " + formatNumber(api, 2 * batch.capped.se, 3)),
      makeRow(api, "已停止样本的终点均值", "1.000", "1（条件于 τ≤T）", "选择后不再是全体平均"),
      makeRow(api, "T 前已停止比例", formatNumber(api, batch.hitRate, 3), "随 T 增大趋近 1", "命中 " + batch.hitCount + "/" + batch.count),
      makeRow(api, "未停止样本均值", formatNumber(api, batch.survivorMean, 2), "负尾部", "比例 " + formatNumber(api, batch.survivorCount / batch.count, 3)),
      makeRow(api, "尾部对全体均值的贡献", formatNumber(api, survivorContribution, 3), "约抵消命中贡献", "有限模拟；非极限证明"),
      makeRow(api, "截断声明", "T=" + T + "，M=" + batch.count, "τ<∞ a.s.，Eτ=∞", "Monte Carlo + 截断")
    ]);
  }

  window.CourseLearning.register("optional-stopping", function (root, api) {
    var uid;
    var state;
    var refs = {};
    var heading;
    var intro;
    var resetButton;
    var toolbar;
    var corridorNOutput;
    var corridorKOutput;
    var corridorPOutput;
    var corridorNRange;
    var corridorKRange;
    var corridorPRange;
    var pQuickButtons;
    var corridorStatus;
    var corridorStageHost;
    var corridorLedgerBody;
    var corridorTable;
    var corridorCard;
    var truncTOutput;
    var truncTRange;
    var truncStatus;
    var truncStageHost;
    var truncLedgerBody;
    var truncTable;
    var truncCard;
    var strategyHOutput;
    var strategyHRange;
    var strategySelect;
    var strategyStatus;
    var strategyStageHost;
    var strategyLedgerBody;
    var strategyTable;
    var strategyCard;

    if (!root || typeof document === "undefined") {
      return;
    }

    installStyles();
    uid = "cl-optional-stopping-" + (INSTANCE += 1);
    state = {
      corridor: { N: 10, k: 3, p: 0.5 },
      truncation: { T: 300 },
      strategy: { horizon: 80, index: 0 }
    };

    heading = makeElement(api, "h3", { className: "os-heading" }, ["可选停止实验：三本赌徒破产账"]);
    intro = makeElement(api, "p", { className: "os-intro" }, [
      "同一套固定 PRNG 同时跑有限走廊、无下界首达的有限截断和可预测下注；读图时把“所有样本的终点”与“只保留下来的样本”分开。"
    ]);
    resetButton = makeElement(api, "button", {
      type: "button",
      className: "os-primary",
      text: "重置全部账本",
      onclick: function () {
        state.corridor.N = 10;
        state.corridor.k = 3;
        state.corridor.p = 0.5;
        state.truncation.T = 300;
        state.strategy.horizon = 80;
        state.strategy.index = 0;
        renderAll();
        if (api && typeof api.announce === "function") {
          api.announce(root, "已重置：固定种子与三个实验回到初始账本。");
        }
      }
    });
    toolbar = makeElement(api, "div", { className: "os-toolbar" }, [
      makeElement(api, "div", { className: "os-toolbar-copy" }, [
        makeElement(api, "strong", {}, ["固定种子：" + BASE_SEED]),
        makeElement(api, "span", {}, ["重置会得到同一条路径与同一批统计；2SE 只表示 Monte Carlo 抽样波动。"])
      ]),
      resetButton
    ]);

    corridorNOutput = makeElement(api, "output", { id: uid + "-n-output" }, ["10"]);
    corridorKOutput = makeElement(api, "output", { id: uid + "-k-output" }, ["3"]);
    corridorPOutput = makeElement(api, "output", { id: uid + "-p-output" }, ["0.50"]);
    corridorNRange = makeRangeControl(api, uid + "-n", "走廊上界 N = ", 4, 24, 1, 10, function () {
      state.corridor.N = clamp(Number(this.value), 4, 24);
      state.corridor.k = clamp(state.corridor.k, 1, state.corridor.N - 1);
      renderAll();
    });
    corridorKRange = makeRangeControl(api, uid + "-k", "出发位置 k = ", 1, 23, 1, 3, function () {
      state.corridor.k = clamp(Number(this.value), 1, state.corridor.N - 1);
      renderAll();
    });
    corridorPRange = makeRangeControl(api, uid + "-p", "向上概率 p = ", 0.2, 0.8, 0.05, 0.5, function () {
      state.corridor.p = clamp(Number(this.value), 0.2, 0.8);
      renderAll();
    });
    pQuickButtons = makeElement(api, "div", { className: "os-quick-buttons", role: "group", "aria-label": "向上概率预设" });
    [0.5, 0.65, 0.35].forEach(function (value) {
      pQuickButtons.appendChild(makeElement(api, "button", {
        type: "button",
        text: value === 0.5 ? "对称" : (value > 0.5 ? "向上偏置" : "向下偏置"),
        "data-p-value": String(value),
        onclick: function () {
          state.corridor.p = value;
          renderAll();
        }
      }));
    });
    corridorStatus = makeElement(api, "p", { className: "os-status", "aria-live": "polite" }, [""]);
    corridorStageHost = makeElement(api, "div", { className: "os-stage-frame" });
    corridorLedgerBody = makeElement(api, "tbody", {});
    corridorTable = makeElement(api, "table", { className: "os-ledger" }, [
      makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "col" }, ["账本项"]),
        makeElement(api, "th", { scope: "col" }, ["实验"]),
        makeElement(api, "th", { scope: "col" }, ["理论 / 条件"]),
        makeElement(api, "th", { scope: "col" }, ["误差 / 备注"])
      ])]),
      corridorLedgerBody
    ]);
    corridorCard = makeElement(api, "section", { className: "os-card", "aria-labelledby": uid + "-corridor-title" }, [
      makeElement(api, "h4", { id: uid + "-corridor-title" }, ["① 有限走廊：边界账本"]),
      makeElement(api, "p", { className: "os-note" }, ["单条路径停止在 0 或 N；批量 M=" + CORRIDOR_BATCH + " 用同一确定性核验命中概率和停时均值。"]),
      makeElement(api, "div", { className: "os-controls" }, [
        controlBlock(api, "走廊上界 N = ", corridorNRange.input, corridorNOutput),
        controlBlock(api, "出发位置 k = ", corridorKRange.input, corridorKOutput),
        controlBlock(api, "向上概率 p = ", corridorPRange.input, corridorPOutput),
        makeElement(api, "div", { className: "os-control os-control-wide" }, [
          makeElement(api, "span", { className: "os-label" }, ["快速切换偏置"]),
          pQuickButtons
        ])
      ]),
      corridorStatus,
      makeElement(api, "div", { className: "os-layout" }, [
        makeElement(api, "div", { className: "os-stage" }, [corridorStageHost, makeElement(api, "div", { className: "os-legend" }, [
          legendItem(api, "os-swatch-blue", "蓝：一条路径"),
          legendItem(api, "os-swatch-green", "绿：上边界 N"),
          legendItem(api, "os-swatch-red", "红：下边界 0")
        ])]),
        makeElement(api, "div", { className: "os-ledger-box" }, [
          makeElement(api, "div", { className: "os-stage-title" }, ["批量确定性统计", "对称时应见 k/N 与 k(N−k)"]),
          makeElement(api, "div", { className: "os-table-wrap" }, [corridorTable]),
          makeElement(api, "p", { className: "os-footnote" }, ["偏置时显示的是偏置游走的调和函数公式；不要把它解读成 Sₙ 仍是鞅。"])
        ])
      ])
    ]);

    truncTOutput = makeElement(api, "output", { id: uid + "-t-output" }, ["300"]);
    truncTRange = makeRangeControl(api, uid + "-t", "截断时间 T = ", 50, 800, 50, 300, function () {
      state.truncation.T = clamp(Number(this.value), 50, 800);
      renderAll();
    });
    truncStatus = makeElement(api, "p", { className: "os-status", "aria-live": "polite" }, [""]);
    truncStageHost = makeElement(api, "div", { className: "os-stage-frame" });
    truncLedgerBody = makeElement(api, "tbody", {});
    truncTable = makeElement(api, "table", { className: "os-ledger" }, [
      makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "col" }, ["账本项"]),
        makeElement(api, "th", { scope: "col" }, ["实验"]),
        makeElement(api, "th", { scope: "col" }, ["理论 / 条件"]),
        makeElement(api, "th", { scope: "col" }, ["误差 / 备注"])
      ])]),
      truncLedgerBody
    ]);
    truncCard = makeElement(api, "section", { className: "os-card", "aria-labelledby": uid + "-trunc-title" }, [
      makeElement(api, "h4", { id: uid + "-trunc-title" }, ["② 首达 +1、无下界：截断才是有限停时"]),
      makeElement(api, "p", { className: "os-note" }, ["从 X₀=0 出发，τ=inf{n≥0:Xₙ=1}；图中绿色样本已停止，红色样本在 T 时仍未停止。"]),
      makeElement(api, "div", { className: "os-controls" }, [
        controlBlock(api, "截断时间 T = ", truncTRange.input, truncTOutput),
        makeElement(api, "div", { className: "os-control" }, [
          makeElement(api, "span", { className: "os-label" }, ["批量大小"]),
          makeElement(api, "span", { className: "os-output" }, [String(TRUNCATION_BATCH) + "（固定）"])
        ]),
        makeElement(api, "div", { className: "os-control" }, [
          makeElement(api, "span", { className: "os-label" }, ["目标停止时间"]),
          makeElement(api, "span", { className: "os-output" }, ["τ=首次到达 +1"])
        ])
      ]),
      truncStatus,
      makeElement(api, "div", { className: "os-layout" }, [
        makeElement(api, "div", { className: "os-stage" }, [truncStageHost, makeElement(api, "div", { className: "os-legend" }, [
          legendItem(api, "os-swatch-green", "绿：T 前命中并冻结在 1"),
          legendItem(api, "os-swatch-red", "红：未在 T 前停止"),
          legendItem(api, "os-swatch-gold", "金虚线：首达目标 1")
        ])]),
        makeElement(api, "div", { className: "os-ledger-box" }, [
          makeElement(api, "div", { className: "os-stage-title" }, ["全体 vs 选择后的账", "τ∧T 有界"]),
          makeElement(api, "div", { className: "os-table-wrap" }, [truncTable]),
          makeElement(api, "p", { className: "os-boundary" }, ["结论：τ<∞ a.s. 但 Eτ=∞；有限 T 的平均约 0 不能让你把期望直接送进 T→∞。"])
        ])
      ])
    ]);

    strategyHOutput = makeElement(api, "output", { id: uid + "-h-output" }, ["80"]);
    strategyHRange = makeRangeControl(api, uid + "-h", "固定时域 H = ", 20, 160, 10, 80, function () {
      state.strategy.horizon = clamp(Number(this.value), 20, 160);
      renderAll();
    });
    strategySelect = makeElement(api, "select", {
      id: uid + "-strategy",
      "aria-label": "选择可预测下注策略",
      onchange: function () {
        state.strategy.index = clamp(Number(this.value), 0, 2);
        renderAll();
      }
    }, [
      makeElement(api, "option", { value: "0" }, ["固定下注 bₙ=1"]),
      makeElement(api, "option", { value: "1" }, ["输后加倍（封顶 8）"]),
      makeElement(api, "option", { value: "2" }, ["按过去位置反向下注"])
    ]);
    strategyStatus = makeElement(api, "p", { className: "os-status", "aria-live": "polite" }, [""]);
    strategyStageHost = makeElement(api, "div", { className: "os-stage-frame" });
    strategyLedgerBody = makeElement(api, "tbody", {});
    strategyTable = makeElement(api, "table", { className: "os-ledger" }, [
      makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "col" }, ["账本项"]),
        makeElement(api, "th", { scope: "col" }, ["实验"]),
        makeElement(api, "th", { scope: "col" }, ["理论 / 条件"]),
        makeElement(api, "th", { scope: "col" }, ["误差 / 备注"])
      ])]),
      strategyLedgerBody
    ]);
    strategyCard = makeElement(api, "section", { className: "os-card", "aria-labelledby": uid + "-strategy-title" }, [
      makeElement(api, "h4", { id: uid + "-strategy-title" }, ["③ 可预测策略：过去的信息不能预知下一局"]),
      makeElement(api, "p", { className: "os-note" }, ["每个 bₙ 只由前 n 局决定；固定有限 H 让总账可积。加倍策略封顶为 8，用来展示风险放大而不是宣称赌本无限。"]),
      makeElement(api, "div", { className: "os-controls" }, [
        controlBlock(api, "固定时域 H = ", strategyHRange.input, strategyHOutput),
        makeElement(api, "div", { className: "os-control" }, [
          makeElement(api, "label", { className: "os-label", htmlFor: strategySelect.id }, ["过去可见的下注规则"]),
          strategySelect
        ]),
        makeElement(api, "div", { className: "os-control" }, [
          makeElement(api, "span", { className: "os-label" }, ["硬币模型"]),
          makeElement(api, "span", { className: "os-output" }, ["公平：p=1/2"])
        ])
      ]),
      strategyStatus,
      makeElement(api, "div", { className: "os-layout" }, [
        makeElement(api, "div", { className: "os-stage" }, [strategyStageHost, makeElement(api, "div", { className: "os-legend" }, [
          legendItem(api, "os-swatch-blue", "蓝：财富 Wₙ"),
          legendItem(api, "os-swatch-gold", "金虚线：初始财富 0")
        ])]),
        makeElement(api, "div", { className: "os-ledger-box" }, [
          makeElement(api, "div", { className: "os-stage-title" }, ["策略账本", "M=" + STRATEGY_BATCH]),
          makeElement(api, "div", { className: "os-table-wrap" }, [strategyTable]),
          makeElement(api, "p", { className: "os-footnote" }, ["若把公平硬币换成 p≠1/2，条件期望增量为 (2p−1)bₙ；本面板的“零期望”不适用于那个偏置模型。"])
        ])
      ])
    ]);

    clear(root);
    root.classList.add("optional-stopping-lab");
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(toolbar);
    root.appendChild(corridorCard);
    root.appendChild(truncCard);
    root.appendChild(strategyCard);

    function renderAll() {
      var corridor = state.corridor;
      var corridorPath;
      var corridorBatch;
      var theory;
      var truncBatch;
      var truncSamples = [];
      var truncRng;
      var truncTrial;
      var strategy = state.strategy;
      var strategyPath;
      var strategyBatch;
      var i;

      corridor.N = clamp(Math.round(corridor.N), 4, 24);
      corridor.k = clamp(Math.round(corridor.k), 1, corridor.N - 1);
      corridor.p = clamp(Math.round(corridor.p * 20) / 20, 0.2, 0.8);
      state.truncation.T = clamp(Math.round(state.truncation.T / 50) * 50, 50, 800);
      state.strategy.horizon = clamp(Math.round(state.strategy.horizon / 10) * 10, 20, 160);

      corridorPath = simulateCorridorPath(
        corridor.N,
        corridor.k,
        corridor.p,
        makeRng(mixSeed(111, corridor.N, corridor.k, Math.round(corridor.p * 1000)))
      );
      corridorBatch = simulateCorridorBatch(corridor.N, corridor.k, corridor.p);
      theory = corridorTheory(corridor.N, corridor.k, corridor.p);
      corridorNRange.input.value = String(corridor.N);
      corridorKRange.input.max = String(corridor.N - 1);
      corridorKRange.input.value = String(corridor.k);
      corridorPRange.input.value = String(corridor.p);
      corridorNOutput.textContent = String(corridor.N);
      corridorKOutput.textContent = String(corridor.k);
      corridorPOutput.textContent = formatNumber(api, corridor.p, 2);
      pQuickButtons.querySelectorAll("button").forEach(function (button) {
        button.setAttribute(
          "aria-pressed",
          Math.abs(Number(button.getAttribute("data-p-value")) - corridor.p) < 1e-9 ? "true" : "false"
        );
      });
      corridorStatus.textContent = theory.martingale
        ? "当前是对称游走：有限走廊内停止过程有界，OST 条件安全。"
        : "当前是偏置游走：p=" + formatNumber(api, corridor.p, 2) + "，Sₙ 有漂移；表中使用偏置调和函数。";
      replaceChildren(corridorStageHost, [
        makeElement(api, "div", { className: "os-stage-title" }, [
          makeElement(api, "span", {}, ["一条固定路径"]),
          makeElement(api, "span", { className: "os-output" }, ["seed " + mixSeed(111, corridor.N, corridor.k, Math.round(corridor.p * 1000))])
        ]),
        drawCorridorChart(api, corridorPath, corridor.N, corridor.k, corridor.p, uid + "-corridor-chart")
      ]);
      renderCorridorLedger(api, corridorLedgerBody, corridorPath, corridorBatch, theory, corridor.N);

      truncBatch = simulateTruncationBatch(state.truncation.T);
      truncRng = makeRng(mixSeed(222, state.truncation.T, 19));
      for (i = 0; i < 22; i += 1) {
        truncTrial = simulateFirstPassage(state.truncation.T, truncRng);
        truncSamples.push(truncTrial);
      }
      truncTOutput.textContent = String(state.truncation.T);
      truncTRange.input.value = String(state.truncation.T);
      truncStatus.textContent = "τ<∞ a.s. 但 Eτ=∞；此处只模拟有限 T=" + state.truncation.T + "，全体 capped 平均的理论值仍是 0。";
      replaceChildren(truncStageHost, [
        makeElement(api, "div", { className: "os-stage-title" }, [
          makeElement(api, "span", {}, ["有限截断路径样本"]),
          makeElement(api, "span", { className: "os-output" }, ["绿=已停，红=存活到 T"])
        ]),
        drawTruncationChart(api, truncSamples, state.truncation.T, uid + "-truncation-chart")
      ]);
      renderTruncationLedger(api, truncLedgerBody, truncBatch, state.truncation.T);

      strategyPath = simulateStrategy(
        strategy.horizon,
        strategy.index,
        makeRng(mixSeed(333, strategy.horizon, strategy.index))
      );
      strategyBatch = simulateStrategyBatch(strategy.horizon, strategy.index);
      strategyHOutput.textContent = String(strategy.horizon);
      strategyHRange.input.value = String(strategy.horizon);
      strategySelect.value = String(strategy.index);
      strategyStatus.textContent = strategyName(strategy.index) + " 只看过去；有限时域批量最终财富应在 0 ± 2SE 内波动。";
      replaceChildren(strategyStageHost, [
        makeElement(api, "div", { className: "os-stage-title" }, [
          makeElement(api, "span", {}, ["一条财富路径"]),
          makeElement(api, "span", { className: "os-output" }, ["fair coin · seed " + mixSeed(333, strategy.horizon, strategy.index)])
        ]),
        drawStrategyChart(api, strategyPath, strategy.horizon, strategy.index, uid + "-strategy-chart")
      ]);
      renderStrategyLedger(api, strategyLedgerBody, strategyPath, strategyBatch, strategy.horizon, strategy.index);
    }

    renderAll();
  });
}());
