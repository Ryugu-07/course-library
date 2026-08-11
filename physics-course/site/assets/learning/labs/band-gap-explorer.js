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
  var TWO_PI = 2 * Math.PI;
  var EPSILON = 1e-8;
  var INSTANCE = 0;
  var STYLE_ID = "bge-lab-style";

  var A_PLOT = {
    width: 760,
    height: 430,
    left: 62,
    right: 24,
    top: 26,
    bottom: 52,
    qMin: -1.25,
    qMax: 1.25,
    eMin: -0.3,
    eMax: 5.5
  };

  var A_PRESETS = [
    { id: "edge", label: "区界最小隙", V: 0.25, q: 0 },
    { id: "away", label: "离开区界", V: 0.25, q: 0.6 },
    { id: "uncoupled", label: "关闭耦合", V: 0, q: 0 },
    { id: "negative", label: "反号耦合", V: -0.25, q: 0 }
  ];

  var B_PRESETS = [
    { id: "empty", label: "空带", t: 1, fill: 0, probe: 0, shift: 0 },
    { id: "quarter", label: "四分之一填充", t: 1, fill: 0.25, probe: 0, shift: 0.12 },
    { id: "half", label: "半填充", t: 1, fill: 0.5, probe: 0, shift: 0.12 },
    { id: "full", label: "满带", t: 1, fill: 1, probe: Math.PI, shift: 0.25 }
  ];

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

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(
        child && child.nodeType ? child : doc.createTextNode(String(child))
      );
    });
    return node;
  }

  function makeElement(doc, tag, attrs, children) {
    return appendChildren(
      setAttributes(doc.createElement(tag), attrs || {}),
      children,
      doc
    );
  }

  function makeSvg(doc, tag, attrs, children) {
    return appendChildren(
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}),
      children,
      doc
    );
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatNumber(api, value, digits) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) < 0.0005) value = 0;
    if (api && typeof api.format === "function") {
      return api.format(value, digits === undefined ? 3 : digits);
    }
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatAngle(api, value) {
    var ratio = value / Math.PI;
    if (Math.abs(ratio) < 0.005) return "0";
    if (Math.abs(ratio - 1) < 0.005) return "π";
    if (Math.abs(ratio + 1) < 0.005) return "−π";
    if (Math.abs(ratio - 0.5) < 0.005) return "π/2";
    if (Math.abs(ratio + 0.5) < 0.005) return "−π/2";
    return formatNumber(api, value, 2) + " rad";
  }

  function closeTo(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-6);
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-bge-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-bge-style", "true");
    style.id = STYLE_ID;
    style.textContent = [
      ".bge-lab{--bge-fg:var(--fg,#292722);--bge-muted:var(--fg-soft,#6b6557);--bge-bg:var(--bg,#fff);--bge-panel:var(--block-bg,#f4f1e9);--bge-border:var(--border,#ded7c7);--bge-accent:var(--accent,#315f9d);--bge-green:var(--cl-green,#39734d);--bge-gold:var(--cl-gold,#9b6a12);--bge-red:var(--cl-red,#b64335);--bge-blue:var(--cl-blue,#315f9d);box-sizing:border-box;color:var(--bge-fg);font-size:.96em;line-height:1.55;min-width:0}",
      ".bge-lab *,.bge-lab *::before,.bge-lab *::after{box-sizing:border-box}",
      ".bge-lab .bge-shell{display:grid;gap:14px;min-width:0}",
      ".bge-lab .bge-heading{color:var(--bge-accent);font-size:1.25rem;margin:0}",
      ".bge-lab .bge-intro,.bge-lab .bge-note,.bge-lab .bge-status{color:var(--bge-muted);margin:0}",
      ".bge-lab .bge-tabs{display:grid;gap:8px;grid-template-columns:repeat(2,minmax(0,1fr))}",
      ".bge-lab .bge-tab{background:var(--bge-bg);border:1px solid var(--bge-border);border-radius:7px;color:var(--bge-fg);cursor:pointer;font:inherit;line-height:1.35;min-height:44px;overflow-wrap:anywhere;padding:8px 10px}",
      ".bge-lab .bge-tab:hover{border-color:var(--bge-accent)}",
      ".bge-lab .bge-tab[aria-selected=true]{background:var(--bge-accent);border-color:var(--bge-accent);color:var(--bge-bg);font-weight:750}",
      ".bge-lab .bge-tab:focus-visible,.bge-lab .bge-button:focus-visible,.bge-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".bge-lab .bge-panel{min-width:0}",
      ".bge-lab .bge-layout{align-items:start;display:grid;gap:16px;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);min-width:0}",
      ".bge-lab .bge-controls,.bge-lab .bge-stage{min-width:0}",
      ".bge-lab .bge-controls{display:grid;gap:11px}",
      ".bge-lab .bge-control-heading{font-size:1rem;margin:0}",
      ".bge-lab .bge-formula{background:var(--bge-bg);border-left:3px solid var(--bge-accent);font-family:'SF Mono',Menlo,Consolas,monospace;font-size:.88em;line-height:1.65;margin:0;overflow-x:auto;padding:8px 10px;white-space:nowrap}",
      ".bge-lab .bge-field{display:grid;gap:5px;min-width:0}",
      ".bge-lab .bge-field-caption{align-items:baseline;color:var(--bge-muted);display:flex;flex-wrap:wrap;font-size:.88em;font-weight:650;gap:6px;justify-content:space-between}",
      ".bge-lab .bge-output{color:var(--bge-accent);font-variant-numeric:tabular-nums}",
      ".bge-lab input[type=range]{accent-color:var(--bge-accent);display:block;margin:0;min-height:44px;width:100%}",
      ".bge-lab .bge-preset-grid{display:grid;gap:7px;grid-template-columns:repeat(2,minmax(0,1fr))}",
      ".bge-lab .bge-button{background:var(--bge-bg);border:1px solid var(--bge-border);border-radius:6px;color:var(--bge-fg);cursor:pointer;font:inherit;line-height:1.35;min-height:44px;min-width:0;overflow-wrap:anywhere;padding:7px 9px}",
      ".bge-lab .bge-button:hover{border-color:var(--bge-accent)}",
      ".bge-lab .bge-button.bge-primary{background:var(--bge-accent);border-color:var(--bge-accent);color:var(--bge-bg);font-weight:700}",
      ".bge-lab .bge-stage-frame{background:var(--bge-bg);border:1px solid var(--bge-border);border-radius:7px;min-width:0;padding:9px}",
      ".bge-lab .bge-stage-title{align-items:baseline;color:var(--bge-muted);display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;margin:0 0 7px}",
      ".bge-lab .bge-figure{border:1px solid var(--bge-border);border-radius:5px;margin:0;overflow:hidden;padding:4px}",
      ".bge-lab .bge-figure figcaption{color:var(--bge-muted);font-size:.84em;line-height:1.45;margin:.5rem .25rem .15rem}",
      ".bge-lab .bge-svg{color:var(--bge-fg);display:block;height:auto;max-width:100%;width:100%}",
      ".bge-lab .bge-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
      ".bge-lab .bge-plot-bg{fill:var(--bge-bg)}",
      ".bge-lab .bge-gridline{fill:none;stroke:var(--bge-border);stroke-opacity:.64;stroke-width:1}",
      ".bge-lab .bge-axis{fill:none;stroke:var(--bge-fg);stroke-opacity:.55;stroke-width:1.25}",
      ".bge-lab .bge-zone-line{fill:none;stroke:var(--bge-gold);stroke-dasharray:4 4;stroke-opacity:.8;stroke-width:1.2}",
      ".bge-lab .bge-free{fill:none;stroke:var(--bge-muted);stroke-dasharray:7 5;stroke-width:2}",
      ".bge-lab .bge-lower{fill:none;stroke:var(--bge-green);stroke-width:3}",
      ".bge-lab .bge-upper{fill:none;stroke:var(--bge-red);stroke-width:3}",
      ".bge-lab .bge-gap{fill:none;stroke:var(--bge-gold);stroke-width:2.3}",
      ".bge-lab .bge-current-line{fill:none;stroke:var(--bge-accent);stroke-dasharray:3 4;stroke-width:1.5}",
      ".bge-lab .bge-current-lower{fill:var(--bge-green);stroke:var(--bge-bg);stroke-width:2}",
      ".bge-lab .bge-current-upper{fill:var(--bge-red);stroke:var(--bge-bg);stroke-width:2}",
      ".bge-lab .bge-tick{fill:var(--bge-muted)!important;font-size:12px}",
      ".bge-lab .bge-axis-label{fill:var(--bge-muted)!important;font-size:13px;font-weight:650}",
      ".bge-lab .bge-callout{fill:var(--bge-gold)!important;font-size:13px;font-weight:750}",
      ".bge-lab .bge-band{fill:none;stroke:var(--bge-blue);stroke-width:3}",
      ".bge-lab .bge-occupied{fill:var(--bge-accent);fill-opacity:.16;stroke:none}",
      ".bge-lab .bge-fermi{fill:none;stroke:var(--bge-gold);stroke-dasharray:7 4;stroke-width:1.8}",
      ".bge-lab .bge-occupy-edge{fill:none;stroke:var(--bge-accent);stroke-dasharray:3 4;stroke-width:1.5}",
      ".bge-lab .bge-shift-edge{fill:none;stroke:var(--bge-red);stroke-dasharray:2 3;stroke-width:1.7}",
      ".bge-lab .bge-probe{fill:var(--bge-red);stroke:var(--bge-bg);stroke-width:2}",
      ".bge-lab .bge-metrics{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));margin-top:10px}",
      ".bge-lab .bge-metric{background:var(--bge-panel);border-top:2px solid var(--bge-border);min-width:0;padding:8px}",
      ".bge-lab .bge-metric-label{color:var(--bge-muted);display:block;font-size:.76em;line-height:1.35}",
      ".bge-lab .bge-metric-value{color:var(--bge-fg);display:block;font-size:1rem;font-variant-numeric:tabular-nums;margin-top:3px;overflow-wrap:anywhere}",
      ".bge-lab .bge-weight-note{color:var(--bge-muted);font-size:.86em;margin:9px 0 0;min-height:1.45em}",
      ".bge-lab .bge-legend{color:var(--bge-muted);display:flex;flex-wrap:wrap;font-size:.82em;gap:10px;margin-top:8px}",
      ".bge-lab .bge-legend-item{align-items:center;display:inline-flex;gap:5px}",
      ".bge-lab .bge-swatch{border-top:3px solid var(--bge-muted);display:inline-block;height:0;width:22px}",
      ".bge-lab .bge-swatch-free{border-top-style:dashed;border-top-width:2px}",
      ".bge-lab .bge-swatch-lower{border-color:var(--bge-green)}",
      ".bge-lab .bge-swatch-upper{border-color:var(--bge-red)}",
      ".bge-lab .bge-swatch-band{border-color:var(--bge-blue)}",
      ".bge-lab .bge-swatch-fill{background:var(--bge-accent);height:10px;opacity:.25;width:22px}",
      ".bge-lab .bge-ledger-wrap{border:1px solid var(--bge-border);border-radius:6px;margin-top:10px;overflow-x:auto}",
      ".bge-lab .bge-ledger{border-collapse:collapse;font-size:.84em;margin:0;min-width:500px;width:100%}",
      ".bge-lab .bge-ledger th,.bge-lab .bge-ledger td{border-bottom:1px solid var(--bge-border);padding:7px 8px;text-align:left;vertical-align:top}",
      ".bge-lab .bge-ledger th{color:var(--bge-muted);font-weight:650;white-space:nowrap}",
      ".bge-lab .bge-ledger tr:last-child th,.bge-lab .bge-ledger tr:last-child td{border-bottom:0}",
      ".bge-lab .bge-ledger-note{color:var(--bge-muted);font-size:.83em;margin:8px 0 0}",
      ".bge-lab .bge-live{color:var(--bge-muted);font-size:.86em;margin:0;min-height:1.35em}",
      "@media (max-width:760px){.bge-lab .bge-layout{grid-template-columns:minmax(0,1fr)}.bge-lab .bge-stage-frame{padding:7px}.bge-lab .bge-figure{padding:2px}}",
      "@media (max-width:520px){.bge-lab .bge-preset-grid{grid-template-columns:minmax(0,1fr)}.bge-lab .bge-svg text{font-size:11px}.bge-lab .bge-axis-label,.bge-lab .bge-callout{font-size:12px}}",
      "@media (prefers-reduced-motion:reduce){.bge-lab *{scroll-behavior:auto!important;transition:none!important}}"
    ].join("\n");
    var host = doc.head || doc.documentElement || doc.body;
    if (host) host.appendChild(style);
  }

  function rangeField(doc, label, min, max, step, value, suffix) {
    var wrapper = makeElement(doc, "label", { className: "bge-field" });
    var caption = makeElement(doc, "span", { className: "bge-field-caption" });
    var labelText = makeElement(doc, "span", { text: label });
    var output = makeElement(doc, "output", { className: "bge-output" });
    caption.appendChild(labelText);
    caption.appendChild(output);
    var input = makeElement(doc, "input", {
      type: "range",
      min: min,
      max: max,
      step: step,
      value: value,
      "aria-label": label
    });
    wrapper.appendChild(caption);
    wrapper.appendChild(input);
    return { wrapper: wrapper, input: input, output: output, suffix: suffix || "" };
  }

  function actionButton(doc, label, className) {
    return makeElement(doc, "button", {
      type: "button",
      className: "bge-button" + (className ? " " + className : ""),
      text: label
    });
  }

  function stageFrame(doc, id, title, description, caption) {
    var frame = makeElement(doc, "div", { className: "bge-stage-frame" });
    var heading = makeElement(doc, "div", { className: "bge-stage-title" }, [
      makeElement(doc, "strong", { text: title }),
      makeElement(doc, "span", { text: "SVG 状态图" })
    ]);
    var figure = makeElement(doc, "figure", { className: "bge-figure" });
    var titleId = id + "-svg-title";
    var descId = id + "-svg-desc";
    var svg = makeSvg(doc, "svg", {
      className: "bge-svg",
      viewBox: "0 0 760 430",
      role: "img",
      "aria-labelledby": titleId + " " + descId,
      preserveAspectRatio: "xMidYMid meet"
    });
    var titleNode = makeSvg(doc, "title", { id: titleId }, title);
    var descNode = makeSvg(doc, "desc", { id: descId }, description);
    svg.appendChild(titleNode);
    svg.appendChild(descNode);
    figure.appendChild(svg);
    figure.appendChild(makeElement(doc, "figcaption", { text: caption }));
    frame.appendChild(heading);
    frame.appendChild(figure);
    return {
      frame: frame,
      svg: svg,
      titleNode: titleNode,
      descNode: descNode
    };
  }

  function metricGrid(doc, labels) {
    var grid = makeElement(doc, "div", { className: "bge-metrics" });
    var refs = {};
    labels.forEach(function (item) {
      var card = makeElement(doc, "div", { className: "bge-metric" });
      var label = makeElement(doc, "span", {
        className: "bge-metric-label",
        text: item.label
      });
      var value = makeElement(doc, "strong", {
        className: "bge-metric-value",
        text: "—"
      });
      card.appendChild(label);
      card.appendChild(value);
      grid.appendChild(card);
      refs[item.id] = value;
    });
    return { node: grid, refs: refs };
  }

  function svgLine(doc, svg, x1, y1, x2, y2, className, extra) {
    var attrs = {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      className: className
    };
    Object.keys(extra || {}).forEach(function (key) {
      attrs[key] = extra[key];
    });
    svg.appendChild(makeSvg(doc, "line", attrs));
  }

  function svgRect(doc, svg, x, y, width, height, className, extra) {
    var attrs = {
      x: x,
      y: y,
      width: width,
      height: height,
      className: className
    };
    Object.keys(extra || {}).forEach(function (key) {
      attrs[key] = extra[key];
    });
    svg.appendChild(makeSvg(doc, "rect", attrs));
  }

  function svgCircle(doc, svg, cx, cy, radius, className) {
    svg.appendChild(makeSvg(doc, "circle", {
      cx: cx,
      cy: cy,
      r: radius,
      className: className
    }));
  }

  function svgText(doc, svg, x, y, value, attrs) {
    var merged = {
      x: x,
      y: y,
      "font-size": "13",
      className: "bge-tick"
    };
    Object.keys(attrs || {}).forEach(function (key) {
      merged[key] = attrs[key];
    });
    svg.appendChild(makeSvg(doc, "text", merged, [value]));
  }

  function pathFor(fn, low, high, samples, mapX, mapY) {
    var d = "";
    var drawing = false;
    for (var index = 0; index <= samples; index += 1) {
      var x = low + (high - low) * index / samples;
      var y = fn(x);
      if (!Number.isFinite(y)) {
        drawing = false;
        continue;
      }
      d += (drawing ? "L" : "M") + mapX(x).toFixed(2) + "," + mapY(y).toFixed(2) + " ";
      drawing = true;
    }
    return d.trim();
  }

  function plotX(plot, x) {
    return plot.left + (x - plot.qMin) / (plot.qMax - plot.qMin) *
      (plot.width - plot.left - plot.right);
  }

  function plotY(plot, y) {
    return plot.height - plot.bottom - (y - plot.eMin) / (plot.eMax - plot.eMin) *
      (plot.height - plot.top - plot.bottom);
  }

  function resetSvg(info, title, description) {
    clear(info.svg);
    info.titleNode.textContent = title;
    info.descNode.textContent = description;
    info.svg.appendChild(info.titleNode);
    info.svg.appendChild(info.descNode);
  }

  function computeA(V, q) {
    var base = q * q + 1;
    var radius = Math.sqrt(4 * q * q + V * V);
    var ratio = radius > EPSILON ? 2 * q / radius : 0;
    var lowerPlusWeight = (1 - ratio) / 2;
    var upperPlusWeight = (1 + ratio) / 2;
    return {
      lower: base - radius,
      upper: base + radius,
      freePlus: (q + 1) * (q + 1),
      freeMinus: (q - 1) * (q - 1),
      gap: 2 * Math.abs(V),
      splitting: 2 * radius,
      lowerPlusWeight: clamp(lowerPlusWeight, 0, 1),
      upperPlusWeight: clamp(upperPlusWeight, 0, 1)
    };
  }

  function drawA(doc, info, state, data, api) {
    var plot = A_PLOT;
    var mapX = function (value) { return plotX(plot, value); };
    var mapY = function (value) { return plotY(plot, value); };
    resetSvg(
      info,
      "区界二能级 avoided crossing",
      "虚线为未耦合的两条抛物线，绿色和红色实线为耦合能带；q=0 的竖向金色括号标记 gap=2|V|。"
    );
    svgRect(doc, info.svg, 0, 0, plot.width, plot.height, "bge-plot-bg");

    var qTicks = [-1, -0.5, 0, 0.5, 1];
    var eTicks = [0, 1, 2, 3, 4, 5];
    eTicks.forEach(function (tick) {
      svgLine(doc, info.svg, mapX(plot.qMin), mapY(tick), mapX(plot.qMax), mapY(tick), "bge-gridline");
      svgText(doc, info.svg, plot.left - 9, mapY(tick) + 4, String(tick), {
        "text-anchor": "end"
      });
    });
    qTicks.forEach(function (tick) {
      svgLine(doc, info.svg, mapX(tick), mapY(plot.eMin), mapX(tick), mapY(plot.eMax), "bge-gridline");
      svgText(doc, info.svg, mapX(tick), plot.height - plot.bottom + 19, String(tick), {
        "text-anchor": "middle"
      });
    });
    svgLine(doc, info.svg, mapX(plot.qMin), mapY(0), mapX(plot.qMax), mapY(0), "bge-axis");
    svgLine(doc, info.svg, mapX(plot.qMin), mapY(plot.eMin), mapX(plot.qMin), mapY(plot.eMax), "bge-axis");
    svgLine(doc, info.svg, mapX(0), mapY(plot.eMin), mapX(0), mapY(plot.eMax), "bge-zone-line");

    var freePlus = pathFor(function (q) {
      return (q + 1) * (q + 1);
    }, plot.qMin, plot.qMax, 240, mapX, mapY);
    var freeMinus = pathFor(function (q) {
      return (q - 1) * (q - 1);
    }, plot.qMin, plot.qMax, 240, mapX, mapY);
    var lower = pathFor(function (q) {
      return computeA(state.V, q).lower;
    }, plot.qMin, plot.qMax, 240, mapX, mapY);
    var upper = pathFor(function (q) {
      return computeA(state.V, q).upper;
    }, plot.qMin, plot.qMax, 240, mapX, mapY);
    info.svg.appendChild(makeSvg(doc, "path", { d: freePlus, className: "bge-free" }));
    info.svg.appendChild(makeSvg(doc, "path", { d: freeMinus, className: "bge-free" }));
    info.svg.appendChild(makeSvg(doc, "path", { d: lower, className: "bge-lower" }));
    info.svg.appendChild(makeSvg(doc, "path", { d: upper, className: "bge-upper" }));

    var currentX = mapX(state.q);
    svgLine(doc, info.svg, currentX, mapY(plot.eMin), currentX, mapY(plot.eMax), "bge-current-line");
    svgCircle(doc, info.svg, currentX, mapY(data.lower), 5, "bge-current-lower");
    svgCircle(doc, info.svg, currentX, mapY(data.upper), 5, "bge-current-upper");

    var zeroX = mapX(0);
    var lowerZero = computeA(state.V, 0).lower;
    var upperZero = computeA(state.V, 0).upper;
    svgLine(doc, info.svg, zeroX, mapY(lowerZero), zeroX, mapY(upperZero), "bge-gap");
    svgLine(doc, info.svg, zeroX - 7, mapY(lowerZero), zeroX + 7, mapY(lowerZero), "bge-gap");
    svgLine(doc, info.svg, zeroX - 7, mapY(upperZero), zeroX + 7, mapY(upperZero), "bge-gap");
    svgText(doc, info.svg, zeroX + 11, (mapY(lowerZero) + mapY(upperZero)) / 2 + 4,
      "gap=" + formatNumber(api, data.gap, 2), { className: "bge-callout" });

    svgText(doc, info.svg, plot.width - plot.right, plot.height - 10, "q = k − G/2", {
      className: "bge-axis-label",
      "text-anchor": "end"
    });
    svgText(doc, info.svg, plot.left - 8, plot.top - 7, "E（无量纲）", {
      className: "bge-axis-label",
      "text-anchor": "start"
    });
  }

  function makeA(doc, id, state, onChange) {
    var panel = makeElement(doc, "section", {
      className: "bge-panel",
      id: id + "-panel-a",
      role: "tabpanel",
      "aria-labelledby": id + "-tab-a"
    });
    var layout = makeElement(doc, "div", { className: "bge-layout" });
    var controls = makeElement(doc, "div", { className: "bge-controls" });
    controls.appendChild(makeElement(doc, "h4", {
      className: "bge-control-heading",
      text: "A · 近自由电子区界"
    }));
    controls.appendChild(makeElement(doc, "p", {
      className: "bge-formula",
      text: "E±(q)=q²+1±√(4q²+V²)；区界 gap=2|V|"
    }));
    var vField = rangeField(doc, "耦合 V（可为负）", -0.8, 0.8, 0.01, state.V);
    var qField = rangeField(doc, "区界偏移 q", -1.25, 1.25, 0.01, state.q);
    controls.appendChild(vField.wrapper);
    controls.appendChild(qField.wrapper);
    controls.appendChild(makeElement(doc, "span", {
      className: "bge-field-caption",
      text: "确定性预设"
    }));
    var presets = makeElement(doc, "div", { className: "bge-preset-grid" });
    A_PRESETS.forEach(function (preset) {
      var button = actionButton(doc, preset.label);
      button.addEventListener("click", function () {
        state.V = preset.V;
        state.q = preset.q;
        onChange("A 已切换到“" + preset.label + "”。");
      });
      presets.appendChild(button);
    });
    controls.appendChild(presets);
    controls.appendChild(makeElement(doc, "p", {
      className: "bge-note",
      text: "虚线是 V=0 的基底色散；实线是二能级本征值。权重显示 |±G/2⟩ 基底的模方，V 的符号只改变相对相位。"
    }));

    var stage = makeElement(doc, "div", { className: "bge-stage" });
    var frame = stageFrame(
      doc,
      id + "-a",
      "A · avoided crossing",
      "区界附近两条未耦合抛物线被 V 耦合后打开 gap。",
      "绿色/红色实线：E−/E+；灰色虚线：未耦合色散；金色括号：q=0 的 gap。"
    );
    stage.appendChild(frame.frame);
    var metrics = metricGrid(doc, [
      { id: "gap", label: "区界 gap 2|V|" },
      { id: "lower", label: "当前 E−(q)" },
      { id: "upper", label: "当前 E+(q)" },
      { id: "split", label: "当前分裂 ΔE(q)" },
      { id: "lowerWeight", label: "E− 中 |+G/2⟩" },
      { id: "upperWeight", label: "E+ 中 |+G/2⟩" }
    ]);
    stage.appendChild(metrics.node);
    var weightNote = makeElement(doc, "p", {
      className: "bge-weight-note",
      text: "—"
    });
    stage.appendChild(weightNote);
    var legend = makeElement(doc, "div", { className: "bge-legend" }, [
      makeElement(doc, "span", { className: "bge-legend-item" }, [
        makeElement(doc, "i", { className: "bge-swatch bge-swatch-free" }),
        "未耦合"
      ]),
      makeElement(doc, "span", { className: "bge-legend-item" }, [
        makeElement(doc, "i", { className: "bge-swatch bge-swatch-lower" }),
        "E−"
      ]),
      makeElement(doc, "span", { className: "bge-legend-item" }, [
        makeElement(doc, "i", { className: "bge-swatch bge-swatch-upper" }),
        "E+"
      ])
    ]);
    stage.appendChild(legend);
    var status = makeElement(doc, "p", { className: "bge-status", text: "—" });
    controls.appendChild(status);
    layout.appendChild(controls);
    layout.appendChild(stage);
    panel.appendChild(layout);

    vField.input.addEventListener("input", function () {
      state.V = number(vField.input.value, state.V);
      onChange("");
    });
    qField.input.addEventListener("input", function () {
      state.q = number(qField.input.value, state.q);
      onChange("");
    });

    return {
      panel: panel,
      state: state,
      vField: vField,
      qField: qField,
      stage: frame,
      metrics: metrics.refs,
      weightNote: weightNote,
      status: status
    };
  }

  function updateA(api, refs) {
    var state = refs.state;
    state.V = clamp(number(state.V, 0.25), -0.8, 0.8);
    state.q = clamp(number(state.q, 0), -1.25, 1.25);
    refs.vField.input.value = String(state.V);
    refs.qField.input.value = String(state.q);
    refs.vField.output.textContent = formatNumber(api, state.V, 2);
    refs.qField.output.textContent = formatNumber(api, state.q, 2);
    var data = computeA(state.V, state.q);
    refs.metrics.gap.textContent = formatNumber(api, data.gap, 2);
    refs.metrics.lower.textContent = formatNumber(api, data.lower, 3);
    refs.metrics.upper.textContent = formatNumber(api, data.upper, 3);
    refs.metrics.split.textContent = formatNumber(api, data.splitting, 3);
    refs.metrics.lowerWeight.textContent =
      (100 * data.lowerPlusWeight).toFixed(1) + "%";
    refs.metrics.upperWeight.textContent =
      (100 * data.upperPlusWeight).toFixed(1) + "%";
    refs.weightNote.textContent =
      "当前 q=" + formatNumber(api, state.q, 2) +
      "：E− 的 |+G/2⟩ / |−G/2⟩ 权重为 " +
      (100 * data.lowerPlusWeight).toFixed(1) + "% / " +
      (100 * (1 - data.lowerPlusWeight)).toFixed(1) + "%；E+ 为 " +
      (100 * data.upperPlusWeight).toFixed(1) + "% / " +
      (100 * (1 - data.upperPlusWeight)).toFixed(1) + "%。" +
      (data.splitting < EPSILON ? " 恰好简并时本征基底不唯一，50/50 只是连续极限的显示。" : "");
    refs.status.textContent =
      "区界 gap=2|V|=" + formatNumber(api, data.gap, 2) +
      "；当前分裂 ΔE(q)=" + formatNumber(api, data.splitting, 3) + "。";
    drawA(refs.doc, refs.stage, state, data, api);
  }

  function computeB(t, fill, probe, shift) {
    var xF = Math.PI * fill;
    var fermi = -2 * t * Math.cos(xF);
    var curvature = 2 * t * Math.cos(probe);
    var mass = Math.abs(curvature) > EPSILON ? 1 / curvature : null;
    var velocity = 2 * t * Math.sin(probe);
    var toyVelocityIntegral = 4 * t * Math.sin(xF) * Math.sin(shift);
    return {
      t: t,
      fill: fill,
      probe: probe,
      shift: shift,
      xF: xF,
      fermi: fermi,
      bandwidth: 4 * t,
      curvature: curvature,
      mass: mass,
      velocity: velocity,
      toyVelocityIntegral: toyVelocityIntegral
    };
  }

  function massSign(value) {
    if (value === null) return "曲率 0：m* 发散/变号";
    if (value > 0) return "正";
    if (value < 0) return "负";
    return "0";
  }

  function periodicSegments(center, halfWidth) {
    if (halfWidth >= Math.PI - EPSILON) return [[-Math.PI, Math.PI]];
    var start = center - halfWidth;
    var end = center + halfWidth;
    while (start < -Math.PI) {
      start += TWO_PI;
      end += TWO_PI;
    }
    while (start > Math.PI) {
      start -= TWO_PI;
      end -= TWO_PI;
    }
    if (end <= Math.PI) return [[start, end]];
    return [[start, Math.PI], [-Math.PI, end - TWO_PI]];
  }

  function drawB(doc, info, state, data, api) {
    var plot = {
      width: 760,
      height: 430,
      left: 62,
      right: 24,
      top: 26,
      bottom: 52,
      qMin: -Math.PI,
      qMax: Math.PI,
      eMin: -2.35 * data.t,
      eMax: 2.35 * data.t
    };
    var mapX = function (value) { return plotX(plot, value); };
    var mapY = function (value) { return plotY(plot, value); };
    resetSvg(
      info,
      "一维紧束缚余弦带",
      "蓝色曲线是 E(k)=-2t cos(ka)，蓝色半透明区域标出平衡占据的 k 区间，金色虚线是 Fermi level，红点是曲率探针。"
    );
    svgRect(doc, info.svg, 0, 0, plot.width, plot.height, "bge-plot-bg");

    var xTicks = [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI];
    [-2 * data.t, 0, 2 * data.t].forEach(function (tick) {
      svgLine(doc, info.svg, mapX(plot.qMin), mapY(tick), mapX(plot.qMax), mapY(tick), "bge-gridline");
      svgText(doc, info.svg, plot.left - 9, mapY(tick) + 4, formatNumber(api, tick, 2), {
        "text-anchor": "end"
      });
    });
    xTicks.forEach(function (tick) {
      svgLine(doc, info.svg, mapX(tick), mapY(plot.eMin), mapX(tick), mapY(plot.eMax), "bge-gridline");
      svgText(doc, info.svg, mapX(tick), plot.height - plot.bottom + 19, formatAngle(api, tick), {
        "text-anchor": "middle"
      });
    });
    svgLine(doc, info.svg, mapX(plot.qMin), mapY(0), mapX(plot.qMax), mapY(0), "bge-axis");
    svgLine(doc, info.svg, mapX(plot.qMin), mapY(plot.eMin), mapX(plot.qMin), mapY(plot.eMax), "bge-axis");

    var xF = data.xF;
    var xLeft = mapX(-xF);
    var xRight = mapX(xF);
    var fermiY = mapY(data.fermi);
    if (xRight - xLeft > 0.8) {
      svgRect(doc, info.svg, xLeft, fermiY, xRight - xLeft, mapY(plot.eMin) - fermiY, "bge-occupied");
    }
    svgLine(doc, info.svg, mapX(plot.qMin), fermiY, mapX(plot.qMax), fermiY, "bge-fermi");
    svgText(doc, info.svg, plot.width - plot.right, fermiY - 7,
      "EF=" + formatNumber(api, data.fermi, 2), {
        className: "bge-callout",
        "text-anchor": "end"
      });
    if (data.fill > EPSILON) {
      svgLine(doc, info.svg, xLeft, mapY(plot.eMin), xLeft, mapY(plot.eMax), "bge-occupy-edge");
      svgLine(doc, info.svg, xRight, mapY(plot.eMin), xRight, mapY(plot.eMax), "bge-occupy-edge");
    }

    var bandPath = pathFor(function (x) {
      return -2 * data.t * Math.cos(x);
    }, plot.qMin, plot.qMax, 300, mapX, mapY);
    info.svg.appendChild(makeSvg(doc, "path", { d: bandPath, className: "bge-band" }));

    var probeX = mapX(data.probe);
    var probeY = mapY(-2 * data.t * Math.cos(data.probe));
    svgLine(doc, info.svg, probeX, mapY(plot.eMin), probeX, mapY(plot.eMax), "bge-current-line");
    svgCircle(doc, info.svg, probeX, probeY, 5, "bge-probe");

    var segments = periodicSegments(data.shift, xF);
    if (data.fill > EPSILON && data.fill < 1 - EPSILON && Math.abs(data.shift) > EPSILON) {
      segments.forEach(function (segment) {
        svgLine(doc, info.svg, mapX(segment[0]), mapY(plot.eMin), mapX(segment[0]), mapY(plot.eMax), "bge-shift-edge");
        svgLine(doc, info.svg, mapX(segment[1]), mapY(plot.eMin), mapX(segment[1]), mapY(plot.eMax), "bge-shift-edge");
      });
      svgText(doc, info.svg, mapX(data.shift), plot.top + 17, "试探分布位移 δ", {
        className: "bge-callout",
        "text-anchor": "middle"
      });
    }

    svgText(doc, info.svg, plot.width - plot.right, plot.height - 10, "ka", {
      className: "bge-axis-label",
      "text-anchor": "end"
    });
    svgText(doc, info.svg, plot.left - 8, plot.top - 7, "E / t", {
      className: "bge-axis-label",
      "text-anchor": "start"
    });
  }

  function makeLedger(doc) {
    var wrap = makeElement(doc, "div", { className: "bge-ledger-wrap" });
    var table = makeElement(doc, "table", {
      className: "bge-ledger",
      "aria-label": "k 空间速度账本"
    });
    var head = makeElement(doc, "thead");
    head.appendChild(makeElement(doc, "tr", {}, [
      makeElement(doc, "th", { scope: "col", text: "账本项" }),
      makeElement(doc, "th", { scope: "col", text: "占据集合" }),
      makeElement(doc, "th", { scope: "col", text: "速度积分 / 读法" })
    ]));
    var body = makeElement(doc, "tbody");
    var fullRange = makeElement(doc, "td", { text: "−π ≤ ka ≤ π" });
    var fullValue = makeElement(doc, "td", { text: "∫BZ vg dk = 0；整区周期抵消" });
    body.appendChild(makeElement(doc, "tr", {}, [
      makeElement(doc, "th", { scope: "row", text: "满带基准" }),
      fullRange,
      fullValue
    ]));
    var currentRange = makeElement(doc, "td", { text: "—" });
    var currentValue = makeElement(doc, "td", { text: "—" });
    body.appendChild(makeElement(doc, "tr", {}, [
      makeElement(doc, "th", { scope: "row", text: "当前填充" }),
      currentRange,
      currentValue
    ]));
    var conclusion = makeElement(doc, "td", {
      colspan: 2,
      text: "—"
    });
    body.appendChild(makeElement(doc, "tr", {}, [
      makeElement(doc, "th", { scope: "row", text: "结论边界" }),
      conclusion
    ]));
    table.appendChild(head);
    table.appendChild(body);
    wrap.appendChild(table);
    return {
      node: wrap,
      currentRange: currentRange,
      currentValue: currentValue,
      conclusion: conclusion
    };
  }

  function makeB(doc, id, state, onChange) {
    var panel = makeElement(doc, "section", {
      className: "bge-panel",
      id: id + "-panel-b",
      role: "tabpanel",
      "aria-labelledby": id + "-tab-b",
      hidden: true
    });
    var layout = makeElement(doc, "div", { className: "bge-layout" });
    var controls = makeElement(doc, "div", { className: "bge-controls" });
    controls.appendChild(makeElement(doc, "h4", {
      className: "bge-control-heading",
      text: "B · 紧束缚余弦带"
    }));
    controls.appendChild(makeElement(doc, "p", {
      className: "bge-formula",
      text: "E(k)=−2t cos(ka)；W=4t；kF a=πf；ħ=a=1"
    }));
    var tField = rangeField(doc, "跳跃尺度 t", 0.25, 1.5, 0.01, state.t);
    var fillField = rangeField(doc, "填充率 f", 0, 1, 0.01, state.fill);
    var probeField = rangeField(doc, "曲率探针 ka", -Math.PI, Math.PI, 0.01, state.probe);
    var shiftField = rangeField(doc, "试探分布位移 δ(ka)", -0.35, 0.35, 0.01, state.shift);
    controls.appendChild(tField.wrapper);
    controls.appendChild(fillField.wrapper);
    controls.appendChild(probeField.wrapper);
    controls.appendChild(shiftField.wrapper);
    controls.appendChild(makeElement(doc, "span", {
      className: "bge-field-caption",
      text: "确定性预设"
    }));
    var presets = makeElement(doc, "div", { className: "bge-preset-grid" });
    B_PRESETS.forEach(function (preset) {
      var button = actionButton(doc, preset.label);
      button.addEventListener("click", function () {
        state.t = preset.t;
        state.fill = preset.fill;
        state.probe = preset.probe;
        state.shift = preset.shift;
        onChange("B 已切换到“" + preset.label + "”。");
      });
      presets.appendChild(button);
    });
    controls.appendChild(presets);
    controls.appendChild(makeElement(doc, "p", {
      className: "bge-note",
      text: "曲率与 m* 使用 ħ=a=1 的显示单位；红点是局部探针。δ 只测试占据区间平移后的速度积分，不是电导率或输运求解。"
    }));

    var stage = makeElement(doc, "div", { className: "bge-stage" });
    var frame = stageFrame(
      doc,
      id + "-b",
      "B · 带宽、曲率与 Fermi level",
      "余弦带、平衡占据区间、Fermi level 与曲率探针。",
      "蓝线：E(k)；蓝色阴影：平衡占据的 k 区间；金色虚线：EF；红点：曲率探针。"
    );
    stage.appendChild(frame.frame);
    var metrics = metricGrid(doc, [
      { id: "bandwidth", label: "带宽 W=4t" },
      { id: "fermi", label: "Fermi level EF" },
      { id: "curvature", label: "探针曲率" },
      { id: "mass", label: "有效质量 m*" },
      { id: "velocity", label: "探针群速度 vg" },
      { id: "response", label: "toy 速度积分" }
    ]);
    stage.appendChild(metrics.node);
    var legend = makeElement(doc, "div", { className: "bge-legend" }, [
      makeElement(doc, "span", { className: "bge-legend-item" }, [
        makeElement(doc, "i", { className: "bge-swatch bge-swatch-band" }),
        "E(k)"
      ]),
      makeElement(doc, "span", { className: "bge-legend-item" }, [
        makeElement(doc, "i", { className: "bge-swatch bge-swatch-fill" }),
        "平衡占据 k 区间"
      ]),
      makeElement(doc, "span", { className: "bge-legend-item" }, [
        makeElement(doc, "i", { className: "bge-swatch" }),
        "金色虚线：EF"
      ])
    ]);
    stage.appendChild(legend);
    var ledger = makeLedger(doc);
    stage.appendChild(ledger.node);
    stage.appendChild(makeElement(doc, "p", {
      className: "bge-ledger-note",
      text: "在这个独立电子单带里，平衡的对称占据速度和也为 0；“可响应”指部分填充在试探位移后有空态可重新分配。"
    }));
    var status = makeElement(doc, "p", { className: "bge-status", text: "—" });
    controls.appendChild(status);
    layout.appendChild(controls);
    layout.appendChild(stage);
    panel.appendChild(layout);

    tField.input.addEventListener("input", function () {
      state.t = number(tField.input.value, state.t);
      onChange("");
    });
    fillField.input.addEventListener("input", function () {
      state.fill = number(fillField.input.value, state.fill);
      onChange("");
    });
    probeField.input.addEventListener("input", function () {
      state.probe = number(probeField.input.value, state.probe);
      onChange("");
    });
    shiftField.input.addEventListener("input", function () {
      state.shift = number(shiftField.input.value, state.shift);
      onChange("");
    });

    return {
      panel: panel,
      state: state,
      tField: tField,
      fillField: fillField,
      probeField: probeField,
      shiftField: shiftField,
      stage: frame,
      metrics: metrics.refs,
      ledger: ledger,
      status: status
    };
  }

  function updateB(api, refs) {
    var state = refs.state;
    state.t = clamp(number(state.t, 1), 0.25, 1.5);
    state.fill = clamp(number(state.fill, 0.5), 0, 1);
    state.probe = clamp(number(state.probe, 0), -Math.PI, Math.PI);
    state.shift = clamp(number(state.shift, 0), -0.35, 0.35);
    refs.tField.input.value = String(state.t);
    refs.fillField.input.value = String(state.fill);
    refs.probeField.input.value = String(state.probe);
    refs.shiftField.input.value = String(state.shift);
    refs.tField.output.textContent = formatNumber(api, state.t, 2);
    refs.fillField.output.textContent = (100 * state.fill).toFixed(0) + "%";
    refs.probeField.output.textContent = formatAngle(api, state.probe);
    refs.shiftField.output.textContent = formatNumber(api, state.shift, 2);
    var data = computeB(state.t, state.fill, state.probe, state.shift);
    refs.metrics.bandwidth.textContent = formatNumber(api, data.bandwidth, 2);
    refs.metrics.fermi.textContent = formatNumber(api, data.fermi, 3);
    refs.metrics.curvature.textContent = formatNumber(api, data.curvature, 3);
    refs.metrics.mass.textContent =
      data.mass === null ? "∞；" + massSign(data.mass) : formatNumber(api, data.mass, 3) + "（" + massSign(data.mass) + "）";
    refs.metrics.velocity.textContent = formatNumber(api, data.velocity, 3);
    refs.metrics.response.textContent = formatNumber(api, data.toyVelocityIntegral, 3);

    var rangeText;
    if (state.fill <= EPSILON) {
      rangeText = "空带";
    } else if (state.fill >= 1 - EPSILON) {
      rangeText = "整个 BZ：−π≤ka≤π";
    } else {
      rangeText = "平衡：−" + formatAngle(api, data.xF) +
        "≤ka≤" + formatAngle(api, data.xF);
    }
    refs.ledger.currentRange.textContent = rangeText;
    refs.ledger.currentValue.textContent =
      "平衡积分=0；δ=" + formatNumber(api, state.shift, 2) +
      " 时 toy ∫occ vg dk=" + formatNumber(api, data.toyVelocityIntegral, 3);
    refs.ledger.conclusion.textContent = state.fill >= 1 - EPSILON
      ? "满带覆盖整个周期 BZ，试探位移后的速度积分仍为 0；这不是说每个 k 态的 vg 都为 0。"
      : state.fill <= EPSILON
        ? "空带没有占据态；没有可计算的载流子分布响应。"
        : "部分填充保留空态；对称平衡仍可为 0，但分布位移可改变速度账本。";
    refs.status.textContent =
      "W=4t=" + formatNumber(api, data.bandwidth, 2) +
      "；EF=" + formatNumber(api, data.fermi, 3) +
      "；探针 ka=" + formatAngle(api, state.probe) +
      " 的 m* 为 " + massSign(data.mass) + "。";
    drawB(refs.doc, refs.stage, state, data, api);
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    injectStyles(doc);
    INSTANCE += 1;
    var id = "bge-" + INSTANCE;
    var state = {
      mode: "a",
      a: { V: 0.25, q: 0 },
      b: { t: 1, fill: 0.5, probe: 0, shift: 0.12 }
    };

    var shell = makeElement(doc, "div", { className: "bge-shell" });
    shell.appendChild(makeElement(doc, "h3", {
      className: "bge-heading",
      text: "Band-gap explorer：区界劈裂与余弦带账本"
    }));
    shell.appendChild(makeElement(doc, "p", {
      className: "bge-intro",
      text: "两个确定性玩具模型：A 只看区界二能级耦合，B 只看一维独立电子紧束缚带。每次拖动都由同一组公式重算。"
    }));

    var tabs = makeElement(doc, "div", {
      className: "bge-tabs",
      role: "tablist",
      "aria-label": "能带实验模式"
    });
    var tabA = makeElement(doc, "button", {
      type: "button",
      className: "bge-tab",
      id: id + "-tab-a",
      role: "tab",
      "aria-selected": "true",
      "aria-controls": id + "-panel-a",
      text: "A · 区界 avoided crossing"
    });
    var tabB = makeElement(doc, "button", {
      type: "button",
      className: "bge-tab",
      id: id + "-tab-b",
      role: "tab",
      "aria-selected": "false",
      "aria-controls": id + "-panel-b",
      text: "B · 紧束缚带与填充"
    });
    tabs.appendChild(tabA);
    tabs.appendChild(tabB);
    shell.appendChild(tabs);

    var live = makeElement(doc, "p", {
      className: "bge-live",
      "data-cl-live": true,
      "aria-live": "polite",
      text: "A 模式：区界 gap 与当前能级已准备。"
    });

    var aRefs;
    var bRefs;

    function announce(message) {
      live.textContent = message;
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function render() {
      updateA(api, aRefs);
      updateB(api, bRefs);
      var isA = state.mode === "a";
      tabA.setAttribute("aria-selected", isA ? "true" : "false");
      tabB.setAttribute("aria-selected", isA ? "false" : "true");
      aRefs.panel.hidden = !isA;
      bRefs.panel.hidden = isA;
    }

    function changed(message) {
      render();
      if (message) announce(message);
    }

    aRefs = makeA(doc, id, state.a, changed);
    bRefs = makeB(doc, id, state.b, changed);
    aRefs.doc = doc;
    bRefs.doc = doc;
    shell.appendChild(aRefs.panel);
    shell.appendChild(bRefs.panel);
    shell.appendChild(live);
    root.replaceChildren(shell);

    function chooseMode(mode) {
      state.mode = mode === "b" ? "b" : "a";
      render();
      announce(state.mode === "a"
        ? "已切换到 A：观察区界 avoided crossing 与 gap=2|V|。"
        : "已切换到 B：观察带宽、曲率、Fermi level 与 k 空间账本。");
    }

    tabA.addEventListener("click", function () { chooseMode("a"); });
    tabB.addEventListener("click", function () { chooseMode("b"); });
    tabA.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        tabB.focus();
        chooseMode("b");
      }
    });
    tabB.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        tabA.focus();
        chooseMode("a");
      }
    });

    render();
  }

  window.CourseLearning.register("band-gap-explorer", function (root, api) {
    mount(root, api);
  });
}());
