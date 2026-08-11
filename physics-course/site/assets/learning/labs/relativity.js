(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var PLOT = {
    width: 720,
    height: 500,
    originX: 330,
    originY: 330,
    scale: 52,
    xMin: -5.8,
    xMax: 5.8,
    tMin: -3.3,
    tMax: 4.5
  };
  var EVENTS = {
    timelike: { label: "类时", x: 1, t: 2, note: "可以存在某个惯性系，使两事件发生在同一地点。" },
    lightlike: { label: "类光", x: 2, t: 2, note: "在 c=1 下满足 |x|=|t|，只能由光速信号连接。" },
    spacelike: { label: "类空", x: 2, t: 1, note: "任何惯性系都不能让它们由低于光速的信号连接。" }
  };
  var EVENT_ORDER = ["timelike", "lightlike", "spacelike"];
  var TOLERANCE = 0.018;

  function setAttrs(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, value === true ? "" : String(value));
    });
    return node;
  }

  function makeElement(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeSvgElement(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    if (attrs) setAttrs(node, attrs);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function replaceContents(root, child) {
    while (root.firstChild) root.removeChild(root.firstChild);
    root.appendChild(child);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function format(api, value, digits) {
    if (api && typeof api.format === "function") return api.format(value, digits);
    if (!Number.isFinite(value)) return "-";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function classify(x, t) {
    var interval = t * t - x * x;
    if (Math.abs(interval) <= TOLERANCE) return "lightlike";
    return interval > 0 ? "timelike" : "spacelike";
  }

  function transform(x, t, beta) {
    var gamma = 1 / Math.sqrt(1 - beta * beta);
    return {
      gamma: gamma,
      x: gamma * (x - beta * t),
      t: gamma * (t - beta * x)
    };
  }

  function mapPoint(x, t) {
    return {
      x: PLOT.originX + x * PLOT.scale,
      y: PLOT.originY - t * PLOT.scale
    };
  }

  function rayLimit(dx, dy) {
    var candidates = [];
    if (dx > 0) candidates.push(PLOT.xMax / dx);
    if (dx < 0) candidates.push(PLOT.xMin / dx);
    if (dy > 0) candidates.push(PLOT.tMax / dy);
    if (dy < 0) candidates.push(PLOT.tMin / dy);
    if (!candidates.length) return 0;
    return Math.min.apply(Math, candidates.filter(function (value) { return value > 0; }));
  }

  function axisSegment(dx, dy) {
    var positive = rayLimit(dx, dy);
    var negative = rayLimit(-dx, -dy);
    return {
      start: mapPoint(-negative * dx, -negative * dy),
      end: mapPoint(positive * dx, positive * dy)
    };
  }

  function line(doc, attrs) {
    return makeSvgElement(doc, "line", attrs);
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-cl-relativity-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-cl-relativity-style", "true");
    style.textContent = [
      ".cl-sr-lab { --cl-sr-bg: var(--block-bg, #f5f0e3); --cl-sr-deep: var(--code-bg, #f1ece0); --cl-sr-fg: var(--fg, #2c2a26); --cl-sr-muted: var(--fg-soft, #6b6557); --cl-sr-border: var(--border, #e0d7c4); --cl-sr-blue: var(--link, #315f9d); --cl-sr-red: var(--accent, #a03d3d); --cl-sr-green: var(--cl-green, #39734d); color: var(--cl-sr-fg); margin: 2em 0; font-size: .96em; line-height: 1.6; }",
      ".cl-sr-lab *, .cl-sr-lab *::before, .cl-sr-lab *::after { box-sizing: border-box; }",
      ".cl-sr-lab h2 { color: var(--cl-sr-red); font-size: 1.35rem; margin: 0 0 .25rem; }",
      ".cl-sr-lab h3 { font-size: 1rem; margin: 1rem 0 .45rem; }",
      ".cl-sr-intro { color: var(--cl-sr-muted); margin: 0 0 1rem; }",
      ".cl-sr-lab fieldset { border: 1px solid var(--cl-sr-border); border-radius: 6px; margin: 0; min-width: 0; padding: .7rem .75rem .8rem; }",
      ".cl-sr-lab legend { color: var(--cl-sr-muted); font-size: .86em; font-weight: 700; padding: 0 .3rem; }",
      ".cl-sr-controls { min-width: 0; }",
      ".cl-sr-control-panel { background: var(--cl-sr-bg); border: 1px solid var(--cl-sr-border); border-radius: 6px; padding: .8rem; }",
      ".cl-sr-lab label.cl-control { min-width: 0; }",
      ".cl-sr-lab label.cl-control > span { color: var(--cl-sr-muted); }",
      ".cl-sr-lab input[type=range] { accent-color: var(--cl-sr-red); display: block; min-height: 44px; width: 100%; }",
      ".cl-sr-lab output { color: var(--cl-sr-red); font-variant-numeric: tabular-nums; }",
      ".cl-sr-event-buttons { display: grid; gap: .5rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }",
      ".cl-sr-event-buttons button { min-width: 0; }",
      ".cl-sr-lab button { background: var(--bg, #fff); border: 1px solid var(--cl-sr-border); border-radius: 6px; color: var(--cl-sr-fg); cursor: pointer; font: inherit; line-height: 1.35; min-height: 44px; padding: .5rem .7rem; }",
      ".cl-sr-lab button:hover:not(:disabled) { border-color: var(--cl-sr-red); color: var(--cl-sr-red); }",
      ".cl-sr-lab button:focus-visible, .cl-sr-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".cl-sr-lab button[aria-pressed=true], .cl-sr-lab button.cl-primary { background: var(--cl-sr-red); border-color: var(--cl-sr-red); color: var(--bg, #fff); }",
      ".cl-sr-lab button:disabled { cursor: not-allowed; opacity: .55; }",
      ".cl-sr-preset-note, .cl-sr-axis-note { color: var(--cl-sr-muted); font-size: .86em; margin: .5rem 0 0; }",
      ".cl-sr-stage { min-width: 0; }",
      ".cl-sr-stage-frame { background: var(--bg, #fff); border: 1px solid var(--cl-sr-border); border-radius: 6px; padding: .65rem; }",
      ".cl-sr-stage-title { align-items: baseline; color: var(--cl-sr-muted); display: flex; flex-wrap: wrap; gap: .5rem; justify-content: space-between; margin: 0 0 .5rem; }",
      ".cl-sr-figure { border: 1px solid var(--cl-sr-border); border-radius: 6px; margin: 0; overflow: hidden; padding: .35rem; }",
      ".cl-sr-svg { display: block; height: auto; max-width: 100%; width: 100%; }",
      ".cl-sr-svg text { fill: var(--cl-sr-fg); font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; letter-spacing: 0; }",
      ".cl-sr-gridline { stroke: var(--cl-sr-border); stroke-width: 1; }",
      ".cl-sr-cone { fill: none; stroke: var(--cl-sr-red); stroke-dasharray: 7 5; stroke-width: 2; }",
      ".cl-sr-axis { fill: none; stroke: var(--cl-sr-blue); stroke-width: 2.4; }",
      ".cl-sr-axis-prime { fill: none; stroke: var(--cl-sr-red); stroke-width: 2.4; }",
      ".cl-sr-arrow-blue { fill: var(--cl-sr-blue); }",
      ".cl-sr-arrow-red { fill: var(--cl-sr-red); }",
      ".cl-sr-axis-label { fill: var(--cl-sr-blue) !important; font-size: 18px; font-weight: 800; }",
      ".cl-sr-axis-label-prime { fill: var(--cl-sr-red) !important; font-size: 18px; font-weight: 800; }",
      ".cl-sr-small { fill: var(--cl-sr-muted) !important; font-size: 14px; }",
      ".cl-sr-tick { fill: var(--cl-sr-muted) !important; font-size: 12px; }",
      ".cl-sr-sim-s { fill: none; stroke: var(--cl-sr-blue); stroke-dasharray: 3 5; stroke-width: 1.4; }",
      ".cl-sr-sim-prime { fill: none; stroke: var(--cl-sr-red); stroke-dasharray: 3 5; stroke-width: 1.4; }",
      ".cl-sr-event { fill: var(--cl-sr-green); stroke: var(--bg, #fff); stroke-width: 3; }",
      ".cl-sr-event-label { fill: var(--cl-sr-green) !important; font-size: 17px; font-weight: 800; }",
      ".cl-sr-origin { fill: var(--cl-sr-fg); }",
      ".cl-sr-legend { background: var(--cl-sr-deep); border-left: 3px solid var(--cl-sr-red); color: var(--cl-sr-muted); font-size: .86em; margin: .65rem 0 0; padding: .5rem .65rem; }",
      ".cl-sr-metrics { margin-top: .75rem; }",
      ".cl-sr-metric-good strong { color: var(--cl-sr-green); }",
      ".cl-sr-formula { margin-top: .75rem; }",
      ".cl-sr-status { color: var(--cl-sr-muted); font-size: .88em; margin: .65rem 0 0; min-height: 1.4em; }",
      ".cl-sr-reset { margin-top: .75rem; width: 100%; }",
      "@media (max-width: 700px) { .cl-sr-lab .cl-grid { grid-template-columns: minmax(0, 1fr); } .cl-sr-lab { margin-left: -8px; margin-right: -8px; padding: 14px; } .cl-sr-event-buttons { grid-template-columns: 1fr; } .cl-sr-figure { padding: .15rem; } .cl-sr-svg text { font-size: 13px; } .cl-sr-axis-label, .cl-sr-axis-label-prime { font-size: 16px !important; } }",
      "@media (prefers-reduced-motion: reduce) { .cl-sr-lab * { scroll-behavior: auto !important; transition: none !important; } }"
    ].join("\n");
    var host = doc.head || doc.documentElement || doc.body;
    if (host) host.appendChild(style);
  }

  function makeArrowMarker(doc, id, className) {
    var marker = makeSvgElement(doc, "marker", {
      id: id,
      markerWidth: "9",
      markerHeight: "9",
      refX: "8",
      refY: "4.5",
      orient: "auto",
      markerUnits: "userSpaceOnUse"
    });
    marker.appendChild(makeSvgElement(doc, "path", { d: "M0,0 L9,4.5 L0,9 z", "class": className }));
    return marker;
  }

  function makeSvg(doc, ids) {
    var svg = makeSvgElement(doc, "svg", {
      "class": "cl-sr-svg",
      "viewBox": "0 0 " + PLOT.width + " " + PLOT.height,
      "role": "img",
      "aria-labelledby": ids.title + " " + ids.desc,
      "preserveAspectRatio": "xMidYMid meet"
    });
    var title = makeSvgElement(doc, "title", { id: ids.title }, "Minkowski 时空图：两套坐标与同一事件");
    var desc = makeSvgElement(doc, "desc", { id: ids.desc }, "图中显示 c=1 的光锥、S 系的 x/t 轴、S' 系的 x'/t' 轴，以及事件 P 在两套坐标中的数值。改变 beta 时，时空间隔的数值保持不变。");
    var defs = makeSvgElement(doc, "defs");
    defs.appendChild(makeArrowMarker(doc, ids.blueArrow, "cl-sr-arrow-blue"));
    defs.appendChild(makeArrowMarker(doc, ids.redArrow, "cl-sr-arrow-red"));
    svg.appendChild(title);
    svg.appendChild(desc);
    svg.appendChild(defs);
    return { svg: svg, desc: desc };
  }

  function drawStaticGrid(doc, svg) {
    var grid = makeSvgElement(doc, "g", { "aria-hidden": "true" });
    for (var x = Math.ceil(PLOT.xMin); x <= Math.floor(PLOT.xMax); x += 1) {
      var vertical = line(doc, {
        x1: String(mapPoint(x, PLOT.tMin).x),
        y1: String(mapPoint(x, PLOT.tMin).y),
        x2: String(mapPoint(x, PLOT.tMax).x),
        y2: String(mapPoint(x, PLOT.tMax).y),
        "class": "cl-sr-gridline"
      });
      grid.appendChild(vertical);
    }
    for (var t = Math.ceil(PLOT.tMin); t <= Math.floor(PLOT.tMax); t += 1) {
      var horizontal = line(doc, {
        x1: String(mapPoint(PLOT.xMin, t).x),
        y1: String(mapPoint(PLOT.xMin, t).y),
        x2: String(mapPoint(PLOT.xMax, t).x),
        y2: String(mapPoint(PLOT.xMax, t).y),
        "class": "cl-sr-gridline"
      });
      grid.appendChild(horizontal);
    }
    svg.appendChild(grid);
  }

  function drawTickLabels(doc, svg) {
    var labels = makeSvgElement(doc, "g", { "aria-hidden": "true" });
    for (var x = -5; x <= 5; x += 1) {
      if (x === 0) continue;
      var xPoint = mapPoint(x, 0);
      labels.appendChild(makeSvgElement(doc, "text", {
        x: String(xPoint.x), y: String(xPoint.y + 17), "class": "cl-sr-tick", "text-anchor": "middle"
      }, String(x)));
    }
    for (var t = -3; t <= 4; t += 1) {
      if (t === 0) continue;
      var tPoint = mapPoint(0, t);
      labels.appendChild(makeSvgElement(doc, "text", {
        x: String(tPoint.x - 9), y: String(tPoint.y + 4), "class": "cl-sr-tick", "text-anchor": "end"
      }, String(t)));
    }
    svg.appendChild(labels);
  }

  function drawAxes(doc, svg, beta, ids) {
    var coneLeft = axisSegment(-1, 1);
    var coneRight = axisSegment(1, 1);
    svg.appendChild(line(doc, {
      x1: String(coneLeft.start.x), y1: String(coneLeft.start.y),
      x2: String(coneLeft.end.x), y2: String(coneLeft.end.y), "class": "cl-sr-cone"
    }));
    svg.appendChild(line(doc, {
      x1: String(coneRight.start.x), y1: String(coneRight.start.y),
      x2: String(coneRight.end.x), y2: String(coneRight.end.y), "class": "cl-sr-cone"
    }));

    var xAxis = axisSegment(1, 0);
    var tAxis = axisSegment(0, 1);
    var xPrimeAxis = axisSegment(1, beta);
    var tPrimeAxis = axisSegment(beta, 1);
    svg.appendChild(line(doc, {
      x1: String(xAxis.start.x), y1: String(xAxis.start.y), x2: String(xAxis.end.x), y2: String(xAxis.end.y),
      "class": "cl-sr-axis", "marker-end": "url(#" + ids.blueArrow + ")"
    }));
    svg.appendChild(line(doc, {
      x1: String(tAxis.start.x), y1: String(tAxis.start.y), x2: String(tAxis.end.x), y2: String(tAxis.end.y),
      "class": "cl-sr-axis", "marker-end": "url(#" + ids.blueArrow + ")"
    }));
    svg.appendChild(line(doc, {
      x1: String(xPrimeAxis.start.x), y1: String(xPrimeAxis.start.y), x2: String(xPrimeAxis.end.x), y2: String(xPrimeAxis.end.y),
      "class": "cl-sr-axis-prime", "marker-end": "url(#" + ids.redArrow + ")"
    }));
    svg.appendChild(line(doc, {
      x1: String(tPrimeAxis.start.x), y1: String(tPrimeAxis.start.y), x2: String(tPrimeAxis.end.x), y2: String(tPrimeAxis.end.y),
      "class": "cl-sr-axis-prime", "marker-end": "url(#" + ids.redArrow + ")"
    }));

    return { xAxis: xAxis, tAxis: tAxis, xPrimeAxis: xPrimeAxis, tPrimeAxis: tPrimeAxis };
  }

  function axisLabel(doc, svg, point, text, className, dx, dy) {
    svg.appendChild(makeSvgElement(doc, "text", {
      x: String(point.x + dx), y: String(point.y + dy), "class": className
    }, text));
  }

  function drawGuideLine(doc, svg, x1, t1, x2, t2, className) {
    var start = mapPoint(x1, t1);
    var end = mapPoint(x2, t2);
    svg.appendChild(line(doc, {
      x1: String(start.x), y1: String(start.y), x2: String(end.x), y2: String(end.y), "class": className
    }));
  }

  function makeMetric(doc, label, value, className) {
    var metric = makeElement(doc, "div", "cl-metric" + (className ? " " + className : ""));
    metric.appendChild(makeElement(doc, "span", "", label));
    var strong = makeElement(doc, "strong", "", value);
    metric.appendChild(strong);
    return { node: metric, value: strong };
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !root.appendChild) return;
    var doc = root.ownerDocument;
    try {
      injectStyles(doc);
      var shell = makeElement(doc, "section", "cl-lab cl-sr-lab");
      shell.setAttribute("aria-labelledby", "cl-sr-title");
      var title = makeElement(doc, "h2", "", "Minkowski 实验台：β 改变，间隔不变");
      title.id = "cl-sr-title";
      shell.appendChild(title);
      shell.appendChild(makeElement(doc, "p", "cl-sr-intro", "单位固定为 c=1。拖动 |β|<1 的速度，观察 x/t 与 x'/t' 轴、同一事件 P 的两套坐标，以及 s²=t²−x² 的不变性。"));

      var state = { beta: 0.6, x: EVENTS.timelike.x, t: EVENTS.timelike.t };
      var ids = { title: "cl-sr-svg-title", desc: "cl-sr-svg-desc", blueArrow: "cl-sr-blue-arrow", redArrow: "cl-sr-red-arrow" };

      var controls = makeElement(doc, "section", "cl-controls cl-sr-control-panel");
      controls.setAttribute("aria-labelledby", "cl-sr-controls-title");
      var controlsTitle = makeElement(doc, "h3", "cl-sr-controls-title", "控制变量");
      controls.appendChild(controlsTitle);

      var betaLabel = makeElement(doc, "label", "cl-control");
      var betaCaption = makeElement(doc, "span", "", "速度 β=v/c（严格保持 |β|<1，c=1）");
      var betaOutput = makeElement(doc, "output", "", "0.60");
      betaOutput.setAttribute("for", "cl-sr-beta");
      betaCaption.appendChild(doc.createTextNode("："));
      betaCaption.appendChild(betaOutput);
      var betaInput = makeElement(doc, "input");
      setAttrs(betaInput, { id: "cl-sr-beta", type: "range", min: "-0.95", max: "0.95", step: "0.01", value: "0.6", "aria-label": "速度 beta，范围负 0.95 到正 0.95" });
      betaLabel.appendChild(betaCaption);
      betaLabel.appendChild(betaInput);
      controls.appendChild(betaLabel);

      var eventFieldset = makeElement(doc, "fieldset", "");
      eventFieldset.appendChild(makeElement(doc, "legend", "", "事件 P 的类型预设"));
      var eventButtons = makeElement(doc, "div", "cl-sr-event-buttons");
      eventButtons.setAttribute("role", "group");
      eventButtons.setAttribute("aria-label", "事件类型预设");
      var presetButtons = {};
      EVENT_ORDER.forEach(function (key) {
        var info = EVENTS[key];
        var button = makeElement(doc, "button", "", info.label + "（x=" + info.x + "，t=" + info.t + "）");
        button.type = "button";
        button.setAttribute("aria-pressed", key === "timelike" ? "true" : "false");
        button.setAttribute("aria-label", "选择" + info.label + "事件，x 等于 " + info.x + "，t 等于 " + info.t);
        presetButtons[key] = button;
        eventButtons.appendChild(button);
      });
      eventFieldset.appendChild(eventButtons);
      var presetNote = makeElement(doc, "p", "cl-sr-preset-note", "预设会把 P 放在对应区域；也可用下方滑块改成自定义事件。");
      eventFieldset.appendChild(presetNote);
      controls.appendChild(eventFieldset);

      var xLabel = makeElement(doc, "label", "cl-control");
      var xCaption = makeElement(doc, "span", "", "事件坐标 x");
      var xOutput = makeElement(doc, "output", "", "1.00");
      xOutput.setAttribute("for", "cl-sr-x");
      xCaption.appendChild(doc.createTextNode("："));
      xCaption.appendChild(xOutput);
      var xInput = makeElement(doc, "input");
      setAttrs(xInput, { id: "cl-sr-x", type: "range", min: "-3.8", max: "3.8", step: "0.05", value: "1", "aria-label": "事件 P 的 x 坐标" });
      xLabel.appendChild(xCaption);
      xLabel.appendChild(xInput);
      controls.appendChild(xLabel);

      var tLabel = makeElement(doc, "label", "cl-control");
      var tCaption = makeElement(doc, "span", "", "事件坐标 t");
      var tOutput = makeElement(doc, "output", "", "2.00");
      tOutput.setAttribute("for", "cl-sr-t");
      tCaption.appendChild(doc.createTextNode("："));
      tCaption.appendChild(tOutput);
      var tInput = makeElement(doc, "input");
      setAttrs(tInput, { id: "cl-sr-t", type: "range", min: "-2.5", max: "3.8", step: "0.05", value: "2", "aria-label": "事件 P 的 t 坐标" });
      tLabel.appendChild(tCaption);
      tLabel.appendChild(tInput);
      controls.appendChild(tLabel);

      var reset = makeElement(doc, "button", "cl-sr-reset", "重置为 β=0.60、类时事件");
      reset.type = "button";
      controls.appendChild(reset);

      var stage = makeElement(doc, "section", "cl-sr-stage");
      stage.setAttribute("aria-labelledby", "cl-sr-stage-title");
      var stageFrame = makeElement(doc, "div", "cl-stage-frame cl-sr-stage-frame");
      var stageTitle = makeElement(doc, "p", "cl-stage-title");
      var stageTitleStrong = makeElement(doc, "strong", "", "坐标图");
      stageTitleStrong.id = "cl-sr-stage-title";
      stageTitle.appendChild(stageTitleStrong);
      var stageBeta = makeElement(doc, "span", "", "");
      stageTitle.appendChild(stageBeta);
      stageFrame.appendChild(stageTitle);
      var figure = makeElement(doc, "figure", "cl-sr-figure");
      var svgParts = makeSvg(doc, ids);
      var svg = svgParts.svg;
      figure.appendChild(svg);
      figure.appendChild(makeElement(doc, "figcaption", "cl-sr-axis-note", "虚线红色光锥：x=±t（c=1）；蓝/红轴分别是 S 与 S'。同一事件点 P 不移动，坐标标签会改变。图中的同时线只是坐标辅助线，不是欧氏垂线。"));
      stageFrame.appendChild(figure);

      var metrics = makeElement(doc, "div", "cl-metrics cl-sr-metrics");
      var betaMetric = makeMetric(doc, "β", "0.60");
      var gammaMetric = makeMetric(doc, "γ=1/√(1−β²)", "1.25");
      var sMetric = makeMetric(doc, "S： (x,t)", "(1.00, 2.00)");
      var primeMetric = makeMetric(doc, "S'： (x',t')", "(-0.25, 1.75)");
      var intervalMetric = makeMetric(doc, "s²=t²−x²", "3.00", "cl-sr-metric-good");
      var typeMetric = makeMetric(doc, "因果类型", "类时", "cl-sr-metric-good");
      [betaMetric, gammaMetric, sMetric, primeMetric, intervalMetric, typeMetric].forEach(function (metric) { metrics.appendChild(metric.node); });
      stageFrame.appendChild(metrics);

      var formula = makeElement(doc, "div", "cl-formula cl-sr-formula", "");
      formula.setAttribute("role", "img");
      formula.setAttribute("aria-label", "两套坐标中的时空间隔计算");
      stageFrame.appendChild(formula);
      var status = makeElement(doc, "p", "cl-sr-status", "");
      status.setAttribute("aria-live", "polite");
      status.setAttribute("aria-atomic", "true");
      stageFrame.appendChild(status);
      stage.appendChild(stageFrame);

      var grid = makeElement(doc, "div", "cl-grid");
      grid.appendChild(controls);
      grid.appendChild(stage);
      shell.appendChild(grid);
      var boundary = makeElement(doc, "aside", "cl-note cl-sr-legend");
      boundary.appendChild(makeElement(doc, "strong", "", "读图边界："));
      boundary.appendChild(doc.createTextNode("视觉上的轴倾斜不是把 x、t 做普通旋转；只有 s² 的代数值、同时性条件与因果类型是参考系无关的物理判断。"));
      shell.appendChild(boundary);
      replaceContents(root, shell);

      function currentType() {
        return classify(state.x, state.t);
      }

      function setInputValues() {
        betaInput.value = String(state.beta);
        xInput.value = String(state.x);
        tInput.value = String(state.t);
      }

      function setPressedButtons(type) {
        EVENT_ORDER.forEach(function (key) {
          presetButtons[key].setAttribute("aria-pressed", key === type ? "true" : "false");
        });
      }

      function updateGraph() {
        while (svg.childNodes.length > 3) svg.removeChild(svg.lastChild);
        drawStaticGrid(doc, svg);
        drawTickLabels(doc, svg);
        var axes = drawAxes(doc, svg, state.beta, ids);
        var origin = mapPoint(0, 0);
        var eventPoint = mapPoint(state.x, state.t);
        var prime = transform(state.x, state.t, state.beta);
        var interval = state.t * state.t - state.x * state.x;
        var primeInterval = prime.t * prime.t - prime.x * prime.x;
        var type = currentType();

        drawGuideLine(doc, svg, PLOT.xMin, state.t, PLOT.xMax, state.t, "cl-sr-sim-s");
        drawGuideLine(doc, svg, state.x - 5, state.t - state.beta * 5, state.x + 5, state.t + state.beta * 5, "cl-sr-sim-prime");

        svg.appendChild(makeSvgElement(doc, "circle", { cx: String(origin.x), cy: String(origin.y), r: "4", "class": "cl-sr-origin" }));
        svg.appendChild(makeSvgElement(doc, "text", { x: String(origin.x + 7), y: String(origin.y + 17), "class": "cl-sr-small" }, "O"));
        svg.appendChild(makeSvgElement(doc, "circle", { cx: String(eventPoint.x), cy: String(eventPoint.y), r: "7", "class": "cl-sr-event" }));
        svg.appendChild(makeSvgElement(doc, "text", { x: String(eventPoint.x + 10), y: String(eventPoint.y - 10), "class": "cl-sr-event-label" }, "P"));

        axisLabel(doc, svg, axes.xAxis.end, "x", "cl-sr-axis-label", 8, 5);
        axisLabel(doc, svg, axes.tAxis.end, "t", "cl-sr-axis-label", -5, -8);
        axisLabel(doc, svg, axes.xPrimeAxis.end, "x'", "cl-sr-axis-label-prime", 8, 5);
        axisLabel(doc, svg, axes.tPrimeAxis.end, "t'", "cl-sr-axis-label-prime", 7, -8);
        svg.appendChild(makeSvgElement(doc, "text", { x: "20", y: "26", "class": "cl-sr-small" }, "c=1：光锥 x=±t"));
        svg.appendChild(makeSvgElement(doc, "text", { x: "20", y: "48", "class": "cl-sr-small" }, "蓝：S　红：S'　实线点：P"));

        var typeInfo = EVENTS[type] || { label: "自定义", note: "事件类型由 s² 的符号决定。" };
        var description = "β=" + format(api, state.beta, 2) + "，事件 P 为" + typeInfo.label + "；S 中 (x,t)=(" + format(api, state.x, 2) + "," + format(api, state.t, 2) + ")，S' 中 (x',t')=(" + format(api, prime.x, 2) + "," + format(api, prime.t, 2) + ")。s²=" + format(api, interval, 3) + "，两系计算相同。";
        svgParts.desc.textContent = description;
        stageBeta.textContent = "β=" + format(api, state.beta, 2) + "，γ=" + format(api, prime.gamma, 3);
        betaOutput.value = format(api, state.beta, 2);
        betaOutput.textContent = format(api, state.beta, 2);
        xOutput.value = format(api, state.x, 2);
        xOutput.textContent = format(api, state.x, 2);
        tOutput.value = format(api, state.t, 2);
        tOutput.textContent = format(api, state.t, 2);
        betaMetric.value.textContent = format(api, state.beta, 2);
        gammaMetric.value.textContent = format(api, prime.gamma, 3);
        sMetric.value.textContent = "(" + format(api, state.x, 2) + ", " + format(api, state.t, 2) + ")";
        primeMetric.value.textContent = "(" + format(api, prime.x, 2) + ", " + format(api, prime.t, 2) + ")";
        intervalMetric.value.textContent = format(api, interval, 3);
        typeMetric.value.textContent = typeInfo.label;
        formula.textContent = "S：s²=t²−x²=" + format(api, state.t, 3) + "²−" + format(api, state.x, 3) + "²=" + format(api, interval, 3) + "；S'：t'²−x'²=" + format(api, prime.t, 3) + "²−" + format(api, prime.x, 3) + "²=" + format(api, primeInterval, 3);
        status.textContent = typeInfo.note + " 同时线：蓝色为 t=常数，红色为 t'=常数；它们通常不重合。";
        setPressedButtons(type);
      }

      function announce(message) {
        status.textContent = message;
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      betaInput.addEventListener("input", function () {
        state.beta = clamp(number(betaInput.value, 0), -0.95, 0.95);
        updateGraph();
        announce("已将 beta 调为 " + format(api, state.beta, 2) + "；gamma=" + format(api, transform(state.x, state.t, state.beta).gamma, 3) + "，间隔仍为 " + format(api, state.t * state.t - state.x * state.x, 3) + "。 ");
      });
      xInput.addEventListener("input", function () {
        state.x = clamp(number(xInput.value, 0), -3.8, 3.8);
        updateGraph();
      });
      tInput.addEventListener("input", function () {
        state.t = clamp(number(tInput.value, 0), -2.5, 3.8);
        updateGraph();
      });
      EVENT_ORDER.forEach(function (key) {
        presetButtons[key].addEventListener("click", function () {
          state.x = EVENTS[key].x;
          state.t = EVENTS[key].t;
          setInputValues();
          updateGraph();
          announce("已选择" + EVENTS[key].label + "事件；现在检查 s² 的符号与两套坐标。 ");
        });
      });
      reset.addEventListener("click", function () {
        state.beta = 0.6;
        state.x = EVENTS.timelike.x;
        state.t = EVENTS.timelike.t;
        setInputValues();
        updateGraph();
        announce("实验已重置为 beta=0.60 与类时事件。 ");
      });

      setInputValues();
      updateGraph();
    } catch (error) {
      /* CourseLearning 会在外层保留 Markdown fallback；动态绘图失败不应吞掉静态说明。 */
      if (window.console && console.error) console.error("Relativity learning lab failed:", error);
      throw error;
    }
  }

  if (window.CourseLearning && typeof window.CourseLearning.register === "function") {
    window.CourseLearning.register("relativity", function (root, api) {
      mount(root, api);
    });
  }
}());
