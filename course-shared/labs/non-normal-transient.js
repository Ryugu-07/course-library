(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "non-normal-transient-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-12;
  var Z_PROBE = 1.3;
  var DEFAULTS = { r: 0.9, g: 10, k: 10, theta: 90 };
  var PRESETS = [
    {
      id: "amplify",
      label: "放大案例",
      values: { r: 0.9, g: 10, k: 10, theta: 90 }
    },
    {
      id: "normal",
      label: "g=0 正规边界",
      values: { r: 0.9, g: 0, k: 10, theta: 90 }
    },
    {
      id: "eigen",
      label: "e₁ 特征方向",
      values: { r: 0.9, g: 10, k: 10, theta: 0 }
    },
    {
      id: "critical",
      label: "r=1 临界",
      values: { r: 1, g: 10, k: 10, theta: 90 }
    },
    {
      id: "unstable",
      label: "r=1.1 不稳定",
      values: { r: 1.1, g: 10, k: 10, theta: 90 }
    },
    {
      id: "nilpotent",
      label: "r=0 幂零",
      values: { r: 0, g: 10, k: 4, theta: 90 }
    }
  ];

  var STYLE_TEXT = [
    ".nnt-lab { --nnt-main: var(--accent, #315f9d); --nnt-selected: var(--cl-gold, #9b6a12); --nnt-normal: var(--cl-green, #39734d); --nnt-muted: var(--fg-soft); --nnt-grid: var(--border); max-width: 100%; min-width: 0; overflow: hidden; }",
    ".nnt-lab .nnt-intro, .nnt-lab .nnt-note { color: var(--nnt-muted); font-size: 13px; line-height: 1.7; }",
    ".nnt-lab .nnt-prompt { margin: 12px 0 16px; padding: 11px 13px; border-left: 3px solid var(--nnt-selected); background: var(--block-bg, var(--bg)); line-height: 1.7; }",
    ".nnt-lab .nnt-preset-box { margin: 0 0 16px; padding: 0; border: 0; min-width: 0; }",
    ".nnt-lab .nnt-preset-box legend { margin-bottom: 7px; color: var(--fg-soft); font-size: 13px; font-weight: 700; }",
    ".nnt-lab .nnt-preset-row { display: flex; flex-wrap: wrap; gap: 7px; }",
    ".nnt-lab .nnt-preset-row button { flex: 1 1 135px; }",
    ".nnt-lab .nnt-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; align-items: start; min-width: 0; }",
    ".nnt-lab .nnt-controls, .nnt-lab .nnt-stage { min-width: 0; }",
    ".nnt-lab .nnt-controls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; padding: 12px; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); }",
    ".nnt-lab .nnt-control { display: grid; gap: 5px; min-width: 0; }",
    ".nnt-lab .nnt-control label { color: var(--fg-soft); font-size: 13px; font-weight: 650; }",
    ".nnt-lab .nnt-control output { color: var(--accent); font-variant-numeric: tabular-nums; }",
    ".nnt-lab .nnt-control input[type=range] { width: 100%; min-height: 44px; accent-color: var(--accent); }",
    ".nnt-lab .nnt-button-row { display: flex; flex-wrap: wrap; grid-column: 1 / -1; gap: 7px; }",
    ".nnt-lab .nnt-button-row button { flex: 1 1 120px; }",
    ".nnt-lab .nnt-stage-frame { min-width: 0; padding: 9px; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); overflow: hidden; }",
    ".nnt-lab .nnt-stage-title { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin: 0 0 8px; color: var(--nnt-muted); font-size: 13px; }",
    ".nnt-lab .nnt-status { min-height: 1.7em; margin: 0 0 8px; color: var(--fg); font-size: 13px; font-weight: 650; line-height: 1.7; }",
    ".nnt-lab .nnt-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--fg); }",
    ".nnt-lab .nnt-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".nnt-lab .nnt-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.1; }",
    ".nnt-lab .nnt-grid-line { stroke: var(--nnt-grid); stroke-opacity: .45; stroke-width: 1; }",
    ".nnt-lab .nnt-axis { stroke: var(--nnt-grid); stroke-opacity: .8; stroke-width: 1.25; }",
    ".nnt-lab .nnt-horizon { stroke: var(--nnt-selected); stroke-opacity: .8; stroke-width: 1.5; stroke-dasharray: 5 4; }",
    ".nnt-lab .nnt-envelope { fill: none; stroke: var(--nnt-main); stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }",
    ".nnt-lab .nnt-selected-line { fill: none; stroke: var(--nnt-selected); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }",
    ".nnt-lab .nnt-normal-line { fill: none; stroke: var(--nnt-normal); stroke-width: 2; stroke-dasharray: 7 4; stroke-linecap: round; stroke-linejoin: round; }",
    ".nnt-lab .nnt-dot { stroke: var(--bg); stroke-width: 1.7; }",
    ".nnt-lab .nnt-dot-envelope { fill: var(--nnt-main); }",
    ".nnt-lab .nnt-dot-selected { fill: var(--nnt-selected); }",
    ".nnt-lab .nnt-dot-normal { fill: var(--nnt-normal); }",
    ".nnt-lab .nnt-bar-main { fill: var(--nnt-main); fill-opacity: .82; }",
    ".nnt-lab .nnt-bar-normal { fill: var(--nnt-normal); fill-opacity: .76; }",
    ".nnt-lab .nnt-axis-label { fill: var(--nnt-muted) !important; font-size: 11px; }",
    ".nnt-lab .nnt-chart-label { fill: var(--fg) !important; font-size: 12px; font-weight: 700; }",
    ".nnt-lab .nnt-legend { display: flex; flex-wrap: wrap; gap: 6px 15px; margin: 7px 2px 0; color: var(--nnt-muted); font-size: 12px; line-height: 1.5; }",
    ".nnt-lab .nnt-legend-item { display: inline-flex; align-items: center; gap: 6px; }",
    ".nnt-lab .nnt-swatch { display: inline-block; width: 24px; height: 0; border-top: 3px solid currentColor; }",
    ".nnt-lab .nnt-swatch-envelope { color: var(--nnt-main); }",
    ".nnt-lab .nnt-swatch-selected { color: var(--nnt-selected); }",
    ".nnt-lab .nnt-swatch-normal { color: var(--nnt-normal); border-top-style: dashed; }",
    ".nnt-lab .nnt-subtitle { margin: 16px 0 7px; color: var(--fg); font-size: 14px; font-weight: 700; }",
    ".nnt-lab .nnt-metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 7px; margin-top: 11px; }",
    ".nnt-lab .nnt-metric { min-width: 0; padding: 9px; border-top: 2px solid var(--border); background: var(--bg); }",
    ".nnt-lab .nnt-metric span, .nnt-lab .nnt-metric small { display: block; color: var(--nnt-muted); line-height: 1.45; }",
    ".nnt-lab .nnt-metric span { font-size: 11.5px; }",
    ".nnt-lab .nnt-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".nnt-lab .nnt-metric small { margin-top: 3px; font-size: 11px; }",
    ".nnt-lab .nnt-formula { max-width: 100%; overflow-x: auto; padding: 10px 12px; border-left: 3px solid var(--nnt-main); background: var(--bg); color: var(--fg); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: 12.5px; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }",
    ".nnt-lab .nnt-resolvent-note { margin: 7px 0 0; color: var(--nnt-muted); font-size: 12.5px; line-height: 1.65; }",
    ".nnt-lab .nnt-table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }",
    ".nnt-lab .nnt-ledger { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; font-size: 12.5px; font-variant-numeric: tabular-nums; }",
    ".nnt-lab .nnt-ledger caption { padding: 0 0 7px; text-align: left; color: var(--nnt-muted); font-size: 12.5px; }",
    ".nnt-lab .nnt-ledger th, .nnt-lab .nnt-ledger td { padding: 7px 6px; border-bottom: 1px solid var(--border); text-align: right; overflow-wrap: anywhere; }",
    ".nnt-lab .nnt-ledger th:first-child, .nnt-lab .nnt-ledger td:first-child { width: 12%; text-align: center; }",
    ".nnt-lab .nnt-ledger th { color: var(--nnt-muted); font-size: 11.5px; font-weight: 650; }",
    ".nnt-lab .nnt-ledger tr.nnt-current td { background: color-mix(in srgb, var(--accent) 12%, var(--bg)); font-weight: 700; }",
    ".nnt-lab .nnt-ledger td:nth-child(2) { color: var(--nnt-selected); }",
    ".nnt-lab .nnt-ledger td:nth-child(3) { color: var(--nnt-normal); }",
    ".nnt-lab .nnt-ledger td:nth-child(4) { color: var(--nnt-main); }",
    ".nnt-lab .nnt-footnote { margin: 10px 0 0; padding: 9px 11px; border-left: 3px solid var(--nnt-selected); background: var(--block-bg, var(--bg)); color: var(--nnt-muted); font-size: 12.5px; line-height: 1.7; }",
    ".nnt-lab button:focus-visible, .nnt-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    "@media (max-width: 760px) { .nnt-lab .nnt-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } }",
    "@media (max-width: 480px) { .nnt-lab .nnt-controls { grid-template-columns: minmax(0, 1fr); } .nnt-lab .nnt-stage-frame { padding: 6px; } .nnt-lab .nnt-ledger { font-size: 11.5px; } .nnt-lab .nnt-ledger th, .nnt-lab .nnt-ledger td { padding-left: 3px; padding-right: 3px; } }",
    "@media (prefers-reduced-motion: reduce) { .nnt-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
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

  function replaceChildren(node, children) {
    if (node && typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
    appendChildren(node, children);
  }

  function formatNumber(api, value, digits) {
    if (!Number.isFinite(value)) {
      return "∞";
    }
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    var places = digits === undefined ? 3 : digits;
    var text = value.toFixed(places);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function copyValues(values) {
    return { r: values.r, g: values.g, k: values.k, theta: values.theta };
  }

  function powerData(r, g, j) {
    if (j === 0) {
      return { a: 1, b: 0 };
    }
    if (r === 0) {
      return j === 1
        ? { a: 0, b: g }
        : { a: 0, b: 0 };
    }
    return {
      a: Math.pow(r, j),
      b: j * g * Math.pow(r, j - 1)
    };
  }

  function triangularNorm(a, b) {
    var aa = Math.abs(a) * Math.abs(a);
    var bb = Math.abs(b) * Math.abs(b);
    var discriminant = bb + 4 * aa;
    var lambdaMax = (2 * aa + bb + Math.abs(b) * Math.sqrt(discriminant)) / 2;
    return Math.sqrt(Math.max(0, lambdaMax));
  }

  function vectorAt(r, g, j, theta) {
    var radians = theta * Math.PI / 180;
    var c = Math.cos(radians);
    var s = Math.sin(radians);
    var power = powerData(r, g, j);
    return {
      x: power.a * c + power.b * s,
      y: power.a * s
    };
  }

  function vectorNorm(vector) {
    return Math.hypot(vector.x, vector.y);
  }

  function buildData(state) {
    var k = Math.round(clamp(Number(state.k), 0, 30));
    var r = Number(state.r);
    var g = Number(state.g);
    var theta = Number(state.theta);
    var selected = [];
    var normal = [];
    var envelope = [];
    var ledger = [];
    var selectedPeak = -Infinity;
    var selectedPeakJ = 0;
    var envelopePeak = -Infinity;
    var envelopePeakJ = 0;

    for (var j = 0; j <= k; j += 1) {
      var vector = vectorAt(r, g, j, theta);
      var selectedNorm = vectorNorm(vector);
      var normalNorm = Math.pow(Math.abs(r), j);
      var power = powerData(r, g, j);
      var envelopeNorm = triangularNorm(power.a, power.b);
      selected.push(selectedNorm);
      normal.push(normalNorm);
      envelope.push(envelopeNorm);
      ledger.push({
        j: j,
        selected: selectedNorm,
        normal: normalNorm,
        envelope: envelopeNorm
      });
      if (selectedNorm > selectedPeak) {
        selectedPeak = selectedNorm;
        selectedPeakJ = j;
      }
      if (envelopeNorm > envelopePeak) {
        envelopePeak = envelopeNorm;
        envelopePeakJ = j;
      }
    }

    return {
      r: r,
      g: g,
      k: k,
      theta: theta,
      rho: Math.abs(r),
      x0: vectorAt(1, 0, 0, theta),
      selected: selected,
      normal: normal,
      envelope: envelope,
      ledger: ledger,
      selectedPeak: selectedPeak,
      selectedPeakJ: selectedPeakJ,
      envelopePeak: envelopePeak,
      envelopePeakJ: envelopePeakJ,
      power: powerData(r, g, k),
      resolvent: resolventData(r, g, k)
    };
  }

  function resolventData(r, g, k) {
    var partialA = 0;
    var partialB = 0;
    var partialNormal = 0;
    for (var j = 0; j <= k; j += 1) {
      var factor = Math.pow(Z_PROBE, -j - 1);
      var power = powerData(r, g, j);
      partialA += factor * power.a;
      partialB += factor * power.b;
      partialNormal += factor * Math.pow(r, j);
    }
    var gap = Z_PROBE - r;
    var exactA = 1 / gap;
    var exactB = g / (gap * gap);
    var exactNorm = triangularNorm(exactA, exactB);
    return {
      z: Z_PROBE,
      partialNorm: triangularNorm(partialA, partialB),
      exactNorm: exactNorm,
      partialNormal: Math.abs(partialNormal),
      exactNormal: 1 / Math.abs(gap),
      epsilon: 1 / exactNorm
    };
  }

  function svgText(api, x, y, value, attrs) {
    var merged = Object.assign(
      {
        x: x,
        y: y,
        "font-size": "12",
        "text-anchor": "middle",
        fill: "currentColor"
      },
      attrs || {}
    );
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

  function seriesPath(values, xMap, yMap) {
    return values.map(function (value, index) {
      return (index === 0 ? "M" : "L") + xMap(index).toFixed(2) + " " + yMap(value).toFixed(2);
    }).join(" ");
  }

  function chartWithTitle(api, width, height, titleId, titleText, description) {
    var svg = makeSvg(api, "svg", {
      className: "nnt-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      focusable: "false",
      "aria-labelledby": titleId
    });
    svg.appendChild(makeSvg(api, "title", { id: titleId }, [titleText]));
    if (description) {
      svg.appendChild(makeSvg(api, "desc", {}, [description]));
    }
    return svg;
  }

  function renderTrajectory(api, data, uid) {
    var width = 760;
    var height = 320;
    var left = 52;
    var right = 16;
    var top = 27;
    var bottom = 38;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var xMax = Math.max(1, data.k);
    var maxValue = Math.max.apply(null, data.envelope.concat(data.selected, data.normal));
    var yMax = Math.max(1, maxValue) * 1.1;
    var xMap = function (j) { return left + j / xMax * plotWidth; };
    var yMap = function (value) { return top + (yMax - value) / yMax * plotHeight; };
    var svg = chartWithTitle(
      api,
      width,
      height,
      uid + "-trajectory-title",
      "非正规矩阵与正规控制的有限时间增益",
      "金色实线是所选初始方向的轨迹范数，蓝线是二范数增益包络，绿色虚线是同谱正规控制。"
    );

    svg.appendChild(makeSvg(api, "rect", {
      x: left,
      y: top,
      width: plotWidth,
      height: plotHeight,
      className: "nnt-panel"
    }));
    for (var gy = 0; gy <= 4; gy += 1) {
      var yValue = yMax * gy / 4;
      var y = yMap(yValue);
      svg.appendChild(line(api, left, y, width - right, y, "nnt-grid-line"));
      svg.appendChild(svgText(api, left - 8, y + 4, formatNumber(api, yValue, 2), {
        className: "nnt-axis-label",
        "text-anchor": "end"
      }));
    }
    svg.appendChild(line(api, left, top + plotHeight, width - right, top + plotHeight, "nnt-axis"));
    for (var gx = 0; gx <= data.k; gx += Math.max(1, Math.ceil(data.k / 6))) {
      var xTick = xMap(gx);
      svg.appendChild(line(api, xTick, top + plotHeight, xTick, top + plotHeight + 5, "nnt-axis"));
      svg.appendChild(svgText(api, xTick, height - 13, "j=" + gx, { className: "nnt-axis-label" }));
    }
    if (data.k > 0 && data.k % Math.max(1, Math.ceil(data.k / 6)) !== 0) {
      svg.appendChild(svgText(api, xMap(data.k), height - 13, "j=" + data.k, { className: "nnt-axis-label" }));
    }
    var horizonX = xMap(data.k);
    svg.appendChild(line(api, horizonX, top, horizonX, top + plotHeight, "nnt-horizon"));
    svg.appendChild(svgText(api, left, 16, "范数", {
      className: "nnt-chart-label",
      "text-anchor": "start"
    }));
    svg.appendChild(svgText(api, width - right, height - 13, "步数 j", {
      className: "nnt-axis-label",
      "text-anchor": "end"
    }));
    svg.appendChild(makeSvg(api, "path", {
      d: seriesPath(data.envelope, xMap, yMap),
      className: "nnt-envelope"
    }));
    svg.appendChild(makeSvg(api, "path", {
      d: seriesPath(data.selected, xMap, yMap),
      className: "nnt-selected-line"
    }));
    svg.appendChild(makeSvg(api, "path", {
      d: seriesPath(data.normal, xMap, yMap),
      className: "nnt-normal-line"
    }));
    svg.appendChild(circle(api, horizonX, yMap(data.envelope[data.k]), 4.6, "nnt-dot nnt-dot-envelope"));
    svg.appendChild(circle(api, horizonX, yMap(data.selected[data.k]), 4.2, "nnt-dot nnt-dot-selected"));
    svg.appendChild(circle(api, horizonX, yMap(data.normal[data.k]), 3.8, "nnt-dot nnt-dot-normal"));
    return svg;
  }

  function renderResolvent(api, data, uid) {
    var width = 700;
    var height = 235;
    var left = 48;
    var right = 15;
    var top = 28;
    var bottom = 52;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var values = [
      data.resolvent.partialNorm,
      data.resolvent.exactNorm,
      data.resolvent.partialNormal,
      data.resolvent.exactNormal
    ];
    var labels = ["A, Rₖ", "A, R∞", "rI, Rₖ", "rI, R∞"];
    var maxValue = Math.max.apply(null, values);
    var yMax = Math.max(1, maxValue) * 1.12;
    var svg = chartWithTitle(
      api,
      width,
      height,
      uid + "-resolvent-title",
      "有限步 Neumann resolvent 与完整 resolvent 对比",
      "R_k(z) 是从零阶到当前 horizon 的有限 Neumann 和；R∞ 是精确 resolvent，左组为非正规矩阵，右组为正规控制。"
    );
    var yMap = function (value) { return top + (yMax - value) / yMax * plotHeight; };
    svg.appendChild(makeSvg(api, "rect", {
      x: left,
      y: top,
      width: plotWidth,
      height: plotHeight,
      className: "nnt-panel"
    }));
    for (var gy = 0; gy <= 4; gy += 1) {
      var yValue = yMax * gy / 4;
      var y = yMap(yValue);
      svg.appendChild(line(api, left, y, width - right, y, "nnt-grid-line"));
      svg.appendChild(svgText(api, left - 7, y + 4, formatNumber(api, yValue, 2), {
        className: "nnt-axis-label",
        "text-anchor": "end"
      }));
    }
    var barWidth = Math.min(86, plotWidth / 7);
    var gap = (plotWidth - 4 * barWidth) / 5;
    values.forEach(function (value, index) {
      var x = left + gap + index * (barWidth + gap);
      var y = yMap(value);
      var className = index < 2 ? "nnt-bar-main" : "nnt-bar-normal";
      svg.appendChild(makeSvg(api, "rect", {
        x: x,
        y: y,
        width: barWidth,
        height: Math.max(0, top + plotHeight - y),
        className: className
      }));
      svg.appendChild(svgText(api, x + barWidth / 2, Math.max(top + 14, y - 6), formatNumber(api, value, 2), {
        className: "nnt-axis-label"
      }));
      svg.appendChild(svgText(api, x + barWidth / 2, height - 26, labels[index], {
        className: "nnt-axis-label"
      }));
    });
    svg.appendChild(svgText(api, left, 16, "resolvent 范数", {
      className: "nnt-chart-label",
      "text-anchor": "start"
    }));
    svg.appendChild(svgText(api, width - right, height - 9, "z=" + formatNumber(api, data.resolvent.z, 2) + "；Rₖ=Σ₀ᵏ z⁻ʲ⁻¹Aʲ", {
      className: "nnt-axis-label",
      "text-anchor": "end"
    }));
    return svg;
  }

  function metric(api, label, value, note) {
    return makeElement(api, "div", { className: "nnt-metric" }, [
      makeElement(api, "span", {}, [label]),
      makeElement(api, "strong", {}, [value]),
      note ? makeElement(api, "small", {}, [note]) : null
    ]);
  }

  function statusText(data) {
    if (data.rho < 1 - EPS) {
      if (data.selectedPeak > 1 + EPS) {
        return "ρ(A)<1：所选方向先放大，之后仍会渐近衰减。";
      }
      if (data.envelopePeak > 1 + EPS) {
        return "ρ(A)<1：所选方向未放大，但算子包络显示其他方向存在瞬态增益。";
      }
      return "ρ(A)<1：渐近稳定；本方向在当前窗口没有超过初始范数。";
    }
    if (Math.abs(data.rho - 1) <= EPS) {
      return data.g > EPS
        ? "ρ(A)=1：不渐近稳定；Jordan 耦合的 kg 项阻止衰减。"
        : "ρ(A)=1：临界，A^k=I，不衰减也不放大。";
    }
    return "ρ(A)>1：系统不稳定，最终的指数增长已不是纯粹的瞬态。";
  }

  function eigenvectorText(data) {
    return data.g <= EPS
      ? "A=rI；可取正交特征基，κ₂(V)=1"
      : "缺陷 Jordan 块；无特征基，κ(V) 不定义/可视为∞";
  }

  function renderFormula(api, data) {
    var p = data.power;
    var text;
    if (data.k === 0) {
      text = "k=0：A⁰=I，||A⁰||₂=1。\n";
    } else if (data.r === 0) {
      text = data.k === 1
        ? "r=0 且 k=1：A¹=[[0,g],[0,0]]，所以 a=0，b=g。\n"
        : "r=0 且 k≥2：Aᵏ=0（幂零指数 2），所以 a=0，b=0。\n";
    } else {
      text = "Aᵏ = [[a,b],[0,a]]，其中 a=rᵏ=" + formatNumber(api, p.a, 6) +
        "，b=kgrᵏ⁻¹=" + formatNumber(api, p.b, 6) + "。\n";
    }
    text += "||Aᵏ||₂ = sqrt((2a²+b²+|b|sqrt(b²+4a²))/2) = " +
      formatNumber(api, data.envelope[data.k], 6) + "。\n";
    text += "x₀=(cos θ,sin θ)，θ=" + formatNumber(api, data.theta, 0) +
      "°；||Aᵏx₀||₂=" + formatNumber(api, data.selected[data.k], 6) +
      "，同谱正规控制 ||(rI)ᵏx₀||₂=|r|ᵏ=" + formatNumber(api, data.normal[data.k], 6) + "。";
    return makeElement(api, "div", { className: "nnt-formula" }, [text]);
  }

  function renderLedger(api, data) {
    var table = makeElement(api, "table", { className: "nnt-ledger" });
    table.appendChild(makeElement(api, "caption", {}, [
      "确定性账本：每一行都是同一个 x₀ 在第 j 步的可复核数值；当前 horizon 以色块标出。"
    ]));
    var thead = makeElement(api, "thead", {}, [
      makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "col" }, ["j"]),
        makeElement(api, "th", { scope: "col" }, ["||Aʲx₀||₂"]),
        makeElement(api, "th", { scope: "col" }, ["正规 |r|ʲ"]),
        makeElement(api, "th", { scope: "col" }, ["||Aʲ||₂"])
      ])
    ]);
    table.appendChild(thead);
    var tbody = makeElement(api, "tbody");
    data.ledger.forEach(function (row) {
      tbody.appendChild(makeElement(api, "tr", {
        className: row.j === data.k ? "nnt-current" : ""
      }, [
        makeElement(api, "th", { scope: "row" }, [String(row.j)]),
        makeElement(api, "td", {}, [formatNumber(api, row.selected, 5)]),
        makeElement(api, "td", {}, [formatNumber(api, row.normal, 5)]),
        makeElement(api, "td", {}, [formatNumber(api, row.envelope, 5)])
      ]));
    });
    table.appendChild(tbody);
    return table;
  }

  function renderMetrics(api, data) {
    var nonNormality = data.g * data.g;
    return makeElement(api, "div", { className: "nnt-metric-grid" }, [
      metric(api, "渐近状态", data.rho < 1 - EPS ? "ρ<1，最终衰减" : (data.rho > 1 + EPS ? "ρ>1，最终增长" : "ρ=1，临界"), statusText(data)),
      metric(api, "谱半径 ρ(A)", formatNumber(api, data.rho, 4), "两个特征值都等于 r"),
      metric(api, "当前方向增益", formatNumber(api, data.selected[data.k], 5), "||Aᵏx₀||₂ / ||x₀||₂"),
      metric(api, "算子增益包络", formatNumber(api, data.envelope[data.k], 5), "精确的 ||Aᵏ||₂"),
      metric(api, "正规控制", formatNumber(api, data.normal[data.k], 5), "同谱 N=rI 的 ||Nᵏ||₂"),
      metric(api, "窗口内方向峰值", formatNumber(api, data.selectedPeak, 5), "j=" + data.selectedPeakJ),
      metric(api, "窗口内算子峰值", formatNumber(api, data.envelopePeak, 5), "j=" + data.envelopePeakJ),
      metric(api, "非正规性缺陷", formatNumber(api, nonNormality, 4), "||AA*−A*A||₂=g²"),
      metric(api, "特征向量条件", eigenvectorText(data), "不要把它与奇异值或 resolvent 混为一谈"),
      metric(api, "ε-resolvent 尺度", formatNumber(api, data.resolvent.epsilon, 6), "σmin(zI−A)，z=" + formatNumber(api, Z_PROBE, 2))
    ]);
  }

  var pureModel = {
    defaults: copyValues(DEFAULTS),
    probe: Z_PROBE,
    powerData: powerData,
    triangularNorm: triangularNorm,
    vectorAt: vectorAt,
    buildData: buildData,
    resolventData: resolventData
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    return;
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") {
    return;
  }

  host.CourseLearning.register("non-normal-transient", function (root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }

    installStyles();
    root.classList.add("nnt-lab");
    var uid = "cl-nnt-" + (INSTANCE += 1);
    var state = copyValues(DEFAULTS);
    var refs = {};
    var presetButtons = [];

    var heading = makeElement(api, "h3", {}, [
      "非正规瞬态：谱半径之外的短期账本"
    ]);
    var intro = makeElement(api, "p", { className: "nnt-intro" }, [
      "系统 xₙ₊₁=Axₙ 采用 A=[[r,g],[0,r]]；正规控制 N=rI 与它有完全相同的两个特征值。拖动参数，观察同样的 ρ(A)=|r| 如何允许完全不同的有限时间增益。"
    ]);
    var prompt = makeElement(api, "div", { className: "nnt-prompt" }, [
      "先预测：当 r=0.9、g=10、x₀=e₂ 时，Aᵏx₀ 会不会超过 1？再切到 e₁；e₁ 是特征方向，耦合项是否还会出现？"
    ]);

    var presetBox = makeElement(api, "fieldset", { className: "nnt-preset-box" });
    presetBox.appendChild(makeElement(api, "legend", {}, ["快速边界与对照"]));
    var presetRow = makeElement(api, "div", { className: "nnt-preset-row" });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, "button", {
        type: "button",
        text: preset.label,
        "data-preset": preset.id,
        "aria-pressed": "false"
      });
      button.addEventListener("click", function () {
        state = copyValues(preset.values);
        syncControls();
        render();
        if (api && typeof api.announce === "function") {
          api.announce(root, "已切换到" + preset.label + "。" + statusText(buildData(state)));
        }
      });
      presetButtons.push({ button: button, values: preset.values });
      presetRow.appendChild(button);
    });
    presetBox.appendChild(presetRow);

    function addRange(key, label, min, max, step, value, digits, suffix) {
      var id = uid + "-" + key;
      var output = makeElement(api, "output", { id: id + "-output", htmlFor: id }, [""]);
      var labelNode = makeElement(api, "label", { htmlFor: id }, [
        label + " = ",
        output,
        suffix || ""
      ]);
      var input = makeElement(api, "input", {
        id: id,
        type: "range",
        min: String(min),
        max: String(max),
        step: String(step),
        value: String(value),
        "aria-label": label
      });
      input.addEventListener("input", function () {
        state[key] = Number(input.value);
        render();
      });
      refs[key] = input;
      refs[key + "Output"] = output;
      refs[key + "Digits"] = digits;
      return makeElement(api, "div", { className: "nnt-control" }, [labelNode, input]);
    }

    var controls = makeElement(api, "div", { className: "nnt-controls" }, [
      addRange("r", "收缩因子 r", 0, 1.1, 0.01, state.r, 2, ""),
      addRange("g", "非正规耦合 g", 0, 20, 0.5, state.g, 1, ""),
      addRange("k", "观察 horizon k", 0, 30, 1, state.k, 0, ""),
      addRange("theta", "初始角 θ", -180, 180, 5, state.theta, 0, "°"),
      makeElement(api, "p", { className: "nnt-note" }, [
        "x₀=(cos θ,sin θ)。θ=0° 取 e₁（特征方向）；θ=90° 取 e₂（把耦合送入第一坐标）。"
      ])
    ]);
    var resetButton = makeElement(api, "button", {
      type: "button",
      className: "cl-primary",
      text: "重置默认参数",
      "aria-label": "重置非正规瞬态实验参数"
    });
    resetButton.addEventListener("click", function () {
      state = copyValues(DEFAULTS);
      syncControls();
      render();
      if (api && typeof api.announce === "function") {
        api.announce(root, "已重置。" + statusText(buildData(state)));
      }
    });
    controls.appendChild(makeElement(api, "div", { className: "nnt-button-row" }, [resetButton]));

    var status = makeElement(api, "p", { className: "nnt-status", "aria-live": "polite" }, [""]);
    refs.status = status;
    var chartHost = makeElement(api, "div");
    var legend = makeElement(api, "div", { className: "nnt-legend" }, [
      makeElement(api, "span", { className: "nnt-legend-item" }, [
        makeElement(api, "span", { className: "nnt-swatch nnt-swatch-selected", "aria-hidden": "true" }),
        "所选方向 ||Aʲx₀||₂"
      ]),
      makeElement(api, "span", { className: "nnt-legend-item" }, [
        makeElement(api, "span", { className: "nnt-swatch nnt-swatch-envelope", "aria-hidden": "true" }),
        "算子包络 ||Aʲ||₂"
      ]),
      makeElement(api, "span", { className: "nnt-legend-item" }, [
        makeElement(api, "span", { className: "nnt-swatch nnt-swatch-normal", "aria-hidden": "true" }),
        "正规控制 |r|ʲ"
      ])
    ]);
    var metricsHost = makeElement(api, "div");
    var formulaHost = makeElement(api, "div");
    var resolventHost = makeElement(api, "div");
    var ledgerHost = makeElement(api, "div", { className: "nnt-table-wrap" });
    var stage = makeElement(api, "div", { className: "nnt-stage" }, [
      makeElement(api, "div", { className: "nnt-stage-frame" }, [
        makeElement(api, "div", { className: "nnt-stage-title" }, [
          makeElement(api, "span", {}, ["轨迹范数与有限时间增益"]),
          makeElement(api, "span", {}, ["虚线 horizon = k"])
        ]),
        status,
        chartHost,
        legend,
        metricsHost,
        makeElement(api, "h4", { className: "nnt-subtitle" }, ["本步的精确公式"]),
        formulaHost,
        makeElement(api, "h4", { className: "nnt-subtitle" }, ["有限 horizon 的 resolvent 诊断"]),
        resolventHost,
        makeElement(api, "p", { className: "nnt-resolvent-note" }, [
          "固定探针 z=1.30 位于所有滑块谱的外侧。Rₖ(z)=Σⱼ₌₀ᵏ z⁻ʲ⁻¹Aʲ 是有限 Neumann 部分和；它不是伪谱本身。完整 resolvent 的 ε 尺度是 εres=1/||(zI−A)⁻¹||₂=σmin(zI−A)：它精确表示让 z 成为某个谱点所需的最小谱范数扰动。"
        ]),
        makeElement(api, "h4", { className: "nnt-subtitle" }, ["逐步 ledger"]),
        ledgerHost,
        makeElement(api, "p", { className: "nnt-footnote" }, [
          "读法提醒：蓝线只是每一步的最大单位向量增益，不保证随 j 单调；Gelfand 公式只描述 k→∞ 的根速率，不能替 finite-time monotonicity 背书。"
        ])
      ])
    ]);
    var layout = makeElement(api, "div", { className: "nnt-layout" }, [controls, stage]);
    replaceChildren(root, [heading, intro, prompt, presetBox, layout]);

    function syncControls() {
      refs.r.value = String(state.r);
      refs.g.value = String(state.g);
      refs.k.value = String(state.k);
      refs.theta.value = String(state.theta);
      refs.rOutput.textContent = formatNumber(api, state.r, 2);
      refs.gOutput.textContent = formatNumber(api, state.g, 1);
      refs.kOutput.textContent = formatNumber(api, state.k, 0);
      refs.thetaOutput.textContent = formatNumber(api, state.theta, 0);
      presetButtons.forEach(function (item) {
        var active = item.values.r === state.r && item.values.g === state.g &&
          item.values.k === state.k && item.values.theta === state.theta;
        item.button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function render() {
      state.r = clamp(Number(state.r), 0, 1.1);
      state.g = clamp(Number(state.g), 0, 20);
      state.k = Math.round(clamp(Number(state.k), 0, 30));
      state.theta = Math.round(clamp(Number(state.theta), -180, 180) / 5) * 5;
      var data = buildData(state);
      refs.status.textContent = statusText(data) + " 当前 x₀=(" +
        formatNumber(api, data.x0.x, 3) + ", " + formatNumber(api, data.x0.y, 3) + ")。";
      replaceChildren(chartHost, renderTrajectory(api, data, uid));
      replaceChildren(metricsHost, renderMetrics(api, data));
      replaceChildren(formulaHost, renderFormula(api, data));
      replaceChildren(resolventHost, renderResolvent(api, data, uid));
      replaceChildren(ledgerHost, renderLedger(api, data));
      syncControls();
    }

    syncControls();
    render();
  });
})(typeof window !== "undefined" ? window : null);
