(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "pde-propagation-lab-styles";
  var INSTANCE = 0;
  var DEFAULTS = {
    xTarget: 5,
    time: 3,
    transportSpeed: 1,
    waveSpeed: 1,
    diffusivity: 1
  };
  var AXIS = {
    xMin: -7,
    xMax: 10,
    yMin: 0,
    yMax: 1.05,
    samples: 300
  };
  var MODELS = [
    {
      key: "transport",
      label: "输运：u_t + c u_x = 0",
      shortLabel: "输运",
      colorClass: "pde-transport",
      answer: "zero"
    },
    {
      key: "wave",
      label: "波动：u_tt = a² u_xx，ψ = 0",
      shortLabel: "波动",
      colorClass: "pde-wave",
      answer: "zero"
    },
    {
      key: "heat",
      label: "热：u_t = κ u_xx",
      shortLabel: "热",
      colorClass: "pde-heat",
      answer: "positive"
    }
  ];

  function tent(x) {
    if (!Number.isFinite(x) || Math.abs(x) > 1) {
      return 0;
    }
    return Math.max(0, 1 - Math.abs(x));
  }

  function transportSolution(x, t, c) {
    return tent(x - c * t);
  }

  function waveSolution(x, t, a) {
    return 0.5 * (tent(x - a * t) + tent(x + a * t));
  }

  function heatConvolution(x, t, kappa, steps) {
    if (!Number.isFinite(x) || !Number.isFinite(t) || !Number.isFinite(kappa)) {
      return NaN;
    }
    if (t === 0) {
      return tent(x);
    }
    if (t < 0 || kappa <= 0) {
      return NaN;
    }

    var n = Math.max(2, Math.floor(steps || 400));
    if (n % 2 === 1) {
      n += 1;
    }
    var h = 2 / n;
    var scale = 1 / Math.sqrt(4 * Math.PI * kappa * t);
    var denominator = 4 * kappa * t;
    var sum = 0;
    var i;
    for (i = 0; i <= n; i += 1) {
      var y = -1 + i * h;
      var integrand = tent(y) * scale * Math.exp(-Math.pow(x - y, 2) / denominator);
      var weight = i === 0 || i === n ? 1 : (i % 2 === 0 ? 2 : 4);
      sum += weight * integrand;
    }
    return (h / 3) * sum;
  }

  function fourierDecay(k, t, kappa) {
    return Math.exp(-kappa * k * k * t);
  }

  function normalizedParams(params) {
    var input = params || {};
    return {
      xTarget: Number.isFinite(input.xTarget) ? input.xTarget : DEFAULTS.xTarget,
      time: Number.isFinite(input.time) ? input.time : DEFAULTS.time,
      transportSpeed: Number.isFinite(input.transportSpeed)
        ? input.transportSpeed
        : DEFAULTS.transportSpeed,
      waveSpeed: Number.isFinite(input.waveSpeed) ? input.waveSpeed : DEFAULTS.waveSpeed,
      diffusivity: Number.isFinite(input.diffusivity)
        ? input.diffusivity
        : DEFAULTS.diffusivity
    };
  }

  function evaluate(params) {
    var p = normalizedParams(params);
    var modes = [];
    var k;
    for (k = 0; k <= 8; k += 1) {
      modes.push({ k: k, factor: fourierDecay(k, p.time, p.diffusivity) });
    }
    return {
      params: p,
      point: {
        transport: transportSolution(p.xTarget, p.time, p.transportSpeed),
        wave: waveSolution(p.xTarget, p.time, p.waveSpeed),
        heat: heatConvolution(p.xTarget, p.time, p.diffusivity)
      },
      modes: modes
    };
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
      node.appendChild(child && child.nodeType ? child : document.createTextNode(String(child)));
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
    clear(node);
    appendChildren(node, children);
  }

  function formatNumber(api, value, digits) {
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    if (!Number.isFinite(value)) {
      return "—";
    }
    var places = digits === undefined ? 3 : digits;
    if (value !== 0 && Math.abs(value) < 0.001) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") {
      api.announce(root, message);
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".pde-propagation-lab { --pde-transport: #b64335; --pde-wave: #315f9d; --pde-heat: #39734d; --pde-mode: #9b6a12; --pde-muted: var(--fg-soft); max-width: 100%; min-width: 0; overflow: hidden; color: var(--fg); line-height: 1.55; }",
      "html[data-theme=\"dark\"] .pde-propagation-lab { --pde-transport: #f08c7d; --pde-wave: #83c8ff; --pde-heat: #72bd8b; --pde-mode: #e2b458; }",
      ".pde-propagation-lab *, .pde-propagation-lab *::before, .pde-propagation-lab *::after { box-sizing: border-box; }",
      ".pde-propagation-lab .pde-intro, .pde-propagation-lab .pde-note { color: var(--pde-muted); font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-prompt { margin: 12px 0 16px; padding: 11px 13px; border-left: 3px solid var(--pde-mode); background: var(--block-bg, var(--bg)); line-height: 1.7; }",
      ".pde-propagation-lab .pde-fixed-note { margin: 0 0 14px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--pde-muted); font-size: 13px; overflow-wrap: anywhere; }",
      ".pde-propagation-lab fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }",
      ".pde-propagation-lab .pde-prediction-form { display: grid; gap: 12px; }",
      ".pde-propagation-lab .pde-prediction-form legend { margin-bottom: 7px; color: var(--fg); font-size: 14px; font-weight: 700; }",
      ".pde-propagation-lab .pde-prediction-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }",
      ".pde-propagation-lab .pde-prediction-question { min-width: 0; padding: 9px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); }",
      ".pde-propagation-lab .pde-prediction-question legend { max-width: 100%; color: var(--pde-muted); font-size: 12.5px; line-height: 1.45; overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-choice { display: flex; align-items: flex-start; gap: 7px; min-height: 44px; padding: 7px 5px; color: var(--fg); font-size: 13px; line-height: 1.45; cursor: pointer; }",
      ".pde-propagation-lab .pde-choice input { flex: 0 0 auto; width: 18px; height: 18px; margin: 3px 0 0; accent-color: var(--accent); }",
      ".pde-propagation-lab button { min-width: 0; min-height: 44px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.35; cursor: pointer; overflow-wrap: anywhere; }",
      ".pde-propagation-lab button:hover { border-color: var(--accent); }",
      ".pde-propagation-lab button.pde-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); font-weight: 700; }",
      ".pde-propagation-lab button:disabled { cursor: not-allowed; opacity: .55; }",
      ".pde-propagation-lab button:focus-visible, .pde-propagation-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".pde-propagation-lab .pde-button-row { display: flex; flex-wrap: wrap; gap: 8px; }",
      ".pde-propagation-lab .pde-button-row > * { flex: 1 1 150px; }",
      ".pde-propagation-lab .pde-feedback { min-height: 1.7em; margin: 0; color: var(--pde-muted); font-size: 13px; font-weight: 650; overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-answer { margin: 13px 0 16px; padding: 11px 13px; border-left: 4px solid var(--pde-heat); background: var(--block-bg, var(--bg)); overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-answer h4 { margin: 0 0 6px; }",
      ".pde-propagation-lab .pde-answer ul { margin: 6px 0 0; padding-left: 20px; }",
      ".pde-propagation-lab .pde-answer .pde-correct { color: var(--cl-green, #39734d); font-weight: 700; }",
      ".pde-propagation-lab .pde-answer .pde-wrong { color: var(--cl-red, #b64335); font-weight: 700; }",
      ".pde-propagation-lab .pde-hidden { display: none !important; }",
      ".pde-propagation-lab .pde-layout { display: grid; grid-template-columns: minmax(205px, .72fr) minmax(0, 1.28fr); gap: 16px; align-items: start; min-width: 0; }",
      ".pde-propagation-lab .pde-controls, .pde-propagation-lab .pde-stage { min-width: 0; }",
      ".pde-propagation-lab .pde-controls { display: grid; gap: 12px; padding: 12px; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); }",
      ".pde-propagation-lab .pde-controls h4 { margin: 0; }",
      ".pde-propagation-lab .pde-control { display: grid; gap: 5px; min-width: 0; }",
      ".pde-propagation-lab .pde-control label { color: var(--pde-muted); font-size: 13px; font-weight: 650; overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-control output { color: var(--accent); font-variant-numeric: tabular-nums; }",
      ".pde-propagation-lab .pde-control input[type=range] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
      ".pde-propagation-lab .pde-stage-frame { min-width: 0; padding: 9px; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); overflow: hidden; }",
      ".pde-propagation-lab .pde-status { min-height: 1.7em; margin: 0 0 10px; color: var(--fg); font-size: 13px; font-weight: 650; overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin-bottom: 12px; }",
      ".pde-propagation-lab .pde-metric { min-width: 0; padding: 9px; border-top: 3px solid var(--border); background: var(--block-bg, var(--bg)); }",
      ".pde-propagation-lab .pde-metric.pde-transport { border-top-color: var(--pde-transport); }",
      ".pde-propagation-lab .pde-metric.pde-wave { border-top-color: var(--pde-wave); }",
      ".pde-propagation-lab .pde-metric.pde-heat { border-top-color: var(--pde-heat); }",
      ".pde-propagation-lab .pde-metric span { display: block; color: var(--pde-muted); font-size: 11.5px; line-height: 1.4; overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 16px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-chart-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; min-width: 0; }",
      ".pde-propagation-lab .pde-chart-card { min-width: 0; padding: 7px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); overflow: hidden; }",
      ".pde-propagation-lab .pde-chart-card h4 { margin: 0 0 4px; color: var(--fg); font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--fg); }",
      ".pde-propagation-lab .pde-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
      ".pde-propagation-lab .pde-grid-line { stroke: var(--border); stroke-width: 1; stroke-opacity: .7; }",
      ".pde-propagation-lab .pde-axis-line { stroke: currentColor; stroke-width: 1.1; stroke-opacity: .8; }",
      ".pde-propagation-lab .pde-initial { fill: none; stroke: var(--pde-muted); stroke-width: 1.7; stroke-dasharray: 5 4; opacity: .8; }",
      ".pde-propagation-lab .pde-solution { fill: none; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }",
      ".pde-propagation-lab .pde-solution.pde-transport { stroke: var(--pde-transport); }",
      ".pde-propagation-lab .pde-solution.pde-wave { stroke: var(--pde-wave); }",
      ".pde-propagation-lab .pde-solution.pde-heat { stroke: var(--pde-heat); }",
      ".pde-propagation-lab .pde-target-line { stroke: var(--pde-mode); stroke-width: 1.2; stroke-dasharray: 3 4; opacity: .85; }",
      ".pde-propagation-lab .pde-target-dot { fill: var(--pde-mode); stroke: var(--bg); stroke-width: 1.5; }",
      ".pde-propagation-lab .pde-axis-label { fill: var(--pde-muted) !important; font-size: 10.5px; }",
      ".pde-propagation-lab .pde-legend { display: flex; flex-wrap: wrap; gap: 6px 13px; margin: 8px 2px 0; color: var(--pde-muted); font-size: 12px; line-height: 1.5; }",
      ".pde-propagation-lab .pde-legend-item { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }",
      ".pde-propagation-lab .pde-swatch { display: inline-block; width: 24px; height: 0; border-top: 3px solid currentColor; }",
      ".pde-propagation-lab .pde-swatch-initial { color: var(--pde-muted); border-top-style: dashed; }",
      ".pde-propagation-lab .pde-swatch-transport { color: var(--pde-transport); }",
      ".pde-propagation-lab .pde-swatch-wave { color: var(--pde-wave); }",
      ".pde-propagation-lab .pde-swatch-heat { color: var(--pde-heat); }",
      ".pde-propagation-lab .pde-swatch-mode { color: var(--pde-mode); }",
      ".pde-propagation-lab .pde-section-title { margin: 14px 0 7px; color: var(--fg); font-size: 14px; }",
      ".pde-propagation-lab .pde-formula { margin: 10px 0 0; padding: 9px 11px; border-left: 3px solid var(--pde-mode); background: var(--block-bg, var(--bg)); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: 12.5px; line-height: 1.65; overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-mode-table-wrap { max-width: 100%; overflow-x: hidden; }",
      ".pde-propagation-lab .pde-mode-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12px; font-variant-numeric: tabular-nums; }",
      ".pde-propagation-lab .pde-mode-table caption { margin: 0 0 5px; color: var(--pde-muted); text-align: left; font-size: 12px; }",
      ".pde-propagation-lab .pde-mode-table th, .pde-propagation-lab .pde-mode-table td { padding: 6px 4px; border-bottom: 1px solid var(--border); text-align: center; overflow-wrap: anywhere; }",
      ".pde-propagation-lab .pde-mode-table th { color: var(--pde-muted); font-weight: 650; }",
      ".pde-propagation-lab .pde-mode-bar { fill: var(--pde-mode); fill-opacity: .82; }",
      ".pde-propagation-lab .pde-footnote { margin: 10px 0 0; color: var(--pde-muted); font-size: 12.5px; line-height: 1.65; overflow-wrap: anywhere; }",
      "@media (max-width: 1100px) { .pde-propagation-lab .pde-layout { grid-template-columns: 1fr; } }",
      "@media (max-width: 760px) { .pde-propagation-lab .pde-chart-grid { grid-template-columns: 1fr; } .pde-propagation-lab .pde-chart-card { padding: 8px; } }",
      "@media (max-width: 560px) { .pde-propagation-lab .pde-prediction-grid, .pde-propagation-lab .pde-metrics { grid-template-columns: 1fr; } .pde-propagation-lab .pde-stage-frame { padding: 7px; } }",
      "@media (prefers-reduced-motion: reduce) { .pde-propagation-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    document.head.appendChild(style);
  }

  function svgText(api, x, y, text, attrs) {
    return makeSvg(
      api,
      "text",
      Object.assign(
        {
          x: x,
          y: y,
          "font-size": "11",
          "text-anchor": "middle",
          fill: "currentColor"
        },
        attrs || {}
      ),
      [text]
    );
  }

  function pathForFunction(fn, left, right, top, bottom) {
    var d = "";
    var i;
    for (i = 0; i <= AXIS.samples; i += 1) {
      var ratio = i / AXIS.samples;
      var x = AXIS.xMin + ratio * (AXIS.xMax - AXIS.xMin);
      var value = fn(x);
      if (!Number.isFinite(value)) {
        continue;
      }
      var bounded = clamp(value, AXIS.yMin, AXIS.yMax);
      var px = left + ratio * (right - left);
      var py = bottom - ((bounded - AXIS.yMin) / (AXIS.yMax - AXIS.yMin)) * (bottom - top);
      d += (d ? " L" : "M") + px.toFixed(2) + " " + py.toFixed(2);
    }
    return d;
  }

  function chartPointY(value, top, bottom) {
    var bounded = clamp(value, AXIS.yMin, AXIS.yMax);
    return bottom - ((bounded - AXIS.yMin) / (AXIS.yMax - AXIS.yMin)) * (bottom - top);
  }

  function drawPropagationChart(api, model, data, uid) {
    var width = 620;
    var height = 258;
    var left = 47;
    var right = width - 12;
    var top = 20;
    var bottom = height - 36;
    var titleId = uid + "-title";
    var descId = uid + "-desc";
    var value = data.point[model.key];
    var svg = makeSvg(api, "svg", {
      className: "pde-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": titleId + " " + descId
    });
    var children = [
      makeSvg(api, "title", { id: titleId }, [model.shortLabel + "解，固定坐标轴"]),
      makeSvg(api, "desc", { id: descId }, [
        model.label + "；x 轴固定为 " + AXIS.xMin + " 到 " + AXIS.xMax +
        "，u 轴固定为 0 到 1.05；观测点 x*=5 的值为 " + formatNumber(api, value, 5) + "。"
      ]),
      makeSvg(api, "rect", {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
        fill: "var(--bg)",
        stroke: "var(--border)",
        "stroke-width": "1"
      })
    ];
    [0, 0.5, 1].forEach(function (tick) {
      var y = chartPointY(tick, top, bottom);
      children.push(
        makeSvg(api, "line", {
          className: "pde-grid-line",
          x1: left,
          y1: y,
          x2: right,
          y2: y
        }),
        svgText(api, left - 7, y + 4, String(tick), {
          className: "pde-axis-label",
          "text-anchor": "end"
        })
      );
    });
    [-7, -4, -1, 2, 5, 8, 10].forEach(function (tick) {
      var x = left + ((tick - AXIS.xMin) / (AXIS.xMax - AXIS.xMin)) * (right - left);
      children.push(
        makeSvg(api, "line", {
          className: "pde-grid-line",
          x1: x,
          y1: top,
          x2: x,
          y2: bottom
        }),
        svgText(api, x, bottom + 17, tick === 5 ? "x*=5" : String(tick), {
          className: "pde-axis-label"
        })
      );
    });
    children.push(
      makeSvg(api, "line", {
        className: "pde-axis-line",
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom
      }),
      makeSvg(api, "line", {
        className: "pde-axis-line",
        x1: left,
        y1: top,
        x2: left,
        y2: bottom
      }),
      svgText(api, right, height - 7, "x", {
        className: "pde-axis-label",
        "text-anchor": "end"
      }),
      svgText(api, left - 10, top - 5, "u", {
        className: "pde-axis-label",
        "text-anchor": "end"
      })
    );

    var initialPath = pathForFunction(tent, left, right, top, bottom);
    var solutionFn;
    if (model.key === "transport") {
      solutionFn = function (x) {
        return transportSolution(x, data.params.time, data.params.transportSpeed);
      };
    } else if (model.key === "wave") {
      solutionFn = function (x) {
        return waveSolution(x, data.params.time, data.params.waveSpeed);
      };
    } else {
      solutionFn = function (x) {
        return heatConvolution(x, data.params.time, data.params.diffusivity, 240);
      };
    }
    children.push(
      makeSvg(api, "path", { className: "pde-initial", d: initialPath }),
      makeSvg(api, "path", {
        className: "pde-solution " + model.colorClass,
        d: pathForFunction(solutionFn, left, right, top, bottom)
      })
    );
    var targetX = left + ((data.params.xTarget - AXIS.xMin) / (AXIS.xMax - AXIS.xMin)) * (right - left);
    var targetY = chartPointY(value, top, bottom);
    children.push(
      makeSvg(api, "line", {
        className: "pde-target-line",
        x1: targetX,
        y1: top,
        x2: targetX,
        y2: bottom
      }),
      makeSvg(api, "circle", {
        className: "pde-target-dot",
        cx: targetX,
        cy: targetY,
        r: "3.5"
      })
    );
    replaceChildren(svg, children);
    return svg;
  }

  function drawModeChart(api, data, uid) {
    var width = 620;
    var height = 235;
    var left = 47;
    var right = width - 12;
    var top = 20;
    var bottom = height - 34;
    var titleId = uid + "-title";
    var descId = uid + "-desc";
    var svg = makeSvg(api, "svg", {
      className: "pde-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": titleId + " " + descId
    });
    var children = [
      makeSvg(api, "title", { id: titleId }, ["Fourier 模态衰减"]),
      makeSvg(api, "desc", { id: descId }, [
        "柱高是 exp(-kappa*k^2*t)，k 从 0 到 8；当前时间 " +
        formatNumber(api, data.params.time, 2) + "，扩散率 " +
        formatNumber(api, data.params.diffusivity, 2) + "。"
      ]),
      makeSvg(api, "rect", {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
        fill: "var(--bg)",
        stroke: "var(--border)",
        "stroke-width": "1"
      })
    ];
    [0, 0.5, 1].forEach(function (tick) {
      var y = bottom - tick * (bottom - top);
      children.push(
        makeSvg(api, "line", {
          className: "pde-grid-line",
          x1: left,
          y1: y,
          x2: right,
          y2: y
        }),
        svgText(api, left - 7, y + 4, String(tick), {
          className: "pde-axis-label",
          "text-anchor": "end"
        })
      );
    });
    data.modes.forEach(function (mode) {
      var barWidth = 25;
      var x = left + barWidth / 2 + (mode.k / 8) * (right - left - barWidth);
      var y = bottom - mode.factor * (bottom - top);
      children.push(
        makeSvg(api, "rect", {
          className: "pde-mode-bar",
          x: x - barWidth / 2,
          y: y,
          width: barWidth,
          height: bottom - y,
          rx: "2"
        }),
        svgText(api, x, bottom + 16, String(mode.k), {
          className: "pde-axis-label"
        })
      );
    });
    children.push(
      makeSvg(api, "line", {
        className: "pde-axis-line",
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom
      }),
      makeSvg(api, "line", {
        className: "pde-axis-line",
        x1: left,
        y1: top,
        x2: left,
        y2: bottom
      }),
      svgText(api, right, height - 6, "频率 k", {
        className: "pde-axis-label",
        "text-anchor": "end"
      }),
      svgText(api, left - 10, top - 5, "衰减因子", {
        className: "pde-axis-label",
        "text-anchor": "end"
      })
    );
    replaceChildren(svg, children);
    return svg;
  }

  function makeRangeControl(api, uid, key, label, min, max, step, value) {
    var inputId = uid + "-" + key;
    var outputId = inputId + "-output";
    var output = makeElement(api, "output", { id: outputId, htmlFor: inputId }, [formatNumber(api, value, 2)]);
    var labelNode = makeElement(api, "label", { htmlFor: inputId }, [label + " = ", output]);
    var input = makeElement(api, "input", {
      id: inputId,
      type: "range",
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(value),
      "aria-label": label,
      "aria-valuetext": formatNumber(api, value, 2)
    });
    return {
      input: input,
      output: output,
      node: makeElement(api, "div", { className: "pde-control" }, [labelNode, input])
    };
  }

  function makeMetric(api, model, value, data) {
    var label = model.shortLabel + "在 x*=5";
    var detail;
    if (model.key === "heat") {
      detail = "非负非零初值下严格 > 0";
    } else if (model.key === "transport") {
      detail = value === 0 ? "当前特征脚点在支撑外" : "当前特征脚点落入支撑";
    } else {
      detail = value === 0 ? "当前两个行波脚点均无贡献" : "当前至少一个行波脚点有贡献";
    }
    return makeElement(api, "div", { className: "pde-metric " + model.colorClass }, [
      makeElement(api, "span", {}, [label]),
      makeElement(api, "strong", { "aria-label": label + "的数值" }, [formatNumber(api, value, 5)]),
      makeElement(api, "span", {}, [detail])
    ]);
  }

  function makeModeTable(api, data) {
    var table = makeElement(api, "table", { className: "pde-mode-table" });
    table.appendChild(makeElement(api, "caption", {}, ["Fourier 模态衰减：exp(-kappa*k^2*t)"]));
    var head = makeElement(api, "thead", {}, [
      makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "col" }, ["k"]),
        makeElement(api, "th", { scope: "col" }, ["衰减因子"]),
        makeElement(api, "th", { scope: "col" }, ["读法"])
      ])
    ]);
    table.appendChild(head);
    var body = makeElement(api, "tbody");
    [0, 1, 2, 4, 8].forEach(function (wanted) {
      var mode = data.modes[wanted];
      var reading = wanted === 0 ? "总质量模态" : (wanted >= 4 ? "高频先衰减" : "低频");
      body.appendChild(makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "row" }, [String(wanted)]),
        makeElement(api, "td", {}, [formatNumber(api, mode.factor, 5)]),
        makeElement(api, "td", {}, [reading])
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function renderAnswer(api, hostNode, selections) {
    var lines = [];
    MODELS.forEach(function (model) {
      var correct = selections[model.key] === model.answer;
      var explanation;
      if (model.key === "transport") {
        explanation = "φ(5−1·3)=φ(2)=0";
      } else if (model.key === "wave") {
        explanation = "[φ(5−1·3)+φ(5+1·3)]/2=[φ(2)+φ(8)]/2=0";
      } else {
        explanation = "∫φ(y)G₁(5−y,3)dy>0：φ 在 (−1,1) 为正且 G₁ 始终为正";
      }
      lines.push(makeElement(api, "li", { className: correct ? "pde-correct" : "pde-wrong" }, [
        (correct ? "✓ " : "! ") + model.shortLabel + "：" +
        (model.answer === "zero" ? "严格为 0" : "严格为正") + "。" + explanation
      ]));
    });
    replaceChildren(hostNode, [
      makeElement(api, "h4", {}, ["答案已揭晓"]),
      makeElement(api, "p", {}, ["默认例题的结构结论如下；数值图和参数控制现在开放。"]),
      makeElement(api, "ul", {}, lines)
    ]);
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }
    root.classList.add("pde-propagation-lab");
    installStyles();
    INSTANCE += 1;
    var uid = "pde-propagation-" + INSTANCE;
    var state = {
      revealed: false,
      time: DEFAULTS.time,
      transportSpeed: DEFAULTS.transportSpeed,
      waveSpeed: DEFAULTS.waveSpeed,
      diffusivity: DEFAULTS.diffusivity
    };
    var refs = {};

    var heading = makeElement(api, "h3", {}, ["传播性格实验：搬运、行波与热尾巴"]);
    var intro = makeElement(api, "p", { className: "pde-intro" }, [
      "初值固定为 φ(x)=max(1−|x|,0)，支撑在 [−1,1]。先回答固定例题，再查看三幅同轴图；揭晓后才能调参数。"
    ]);
    var fixedNote = makeElement(api, "p", { className: "pde-fixed-note" }, [
      "预测门固定：x*=5，t=3，输运速度 c=1，波速 a=1，扩散率 κ=1。三幅图的坐标轴固定为 x∈[−7,10]、u∈[0,1.05]；x*=5 的读数不随图形自动缩放。"
    ]);
    var predictionForm = makeElement(api, "form", {
      className: "pde-prediction-form",
      "aria-describedby": uid + "-prediction-note"
    });
    var predictionNote = makeElement(api, "p", { id: uid + "-prediction-note", className: "pde-note" }, [
      "请为每个模型选择一个结论。提交前不显示动态图，也不能调节后续参数。"
    ]);
    var predictionFieldset = makeElement(api, "fieldset");
    predictionFieldset.appendChild(makeElement(api, "legend", {}, ["先预测：x*=5、t=3 的解是？"]));
    var predictionGrid = makeElement(api, "div", { className: "pde-prediction-grid" });
    MODELS.forEach(function (model) {
      var question = makeElement(api, "fieldset", { className: "pde-prediction-question" });
      question.appendChild(makeElement(api, "legend", {}, [model.shortLabel + "："]));
      [
        ["zero", "严格为 0"],
        ["positive", "严格为正"]
      ].forEach(function (option, index) {
        var inputId = uid + "-" + model.key + "-" + option[0];
        var input = makeElement(api, "input", {
          id: inputId,
          type: "radio",
          name: uid + "-" + model.key,
          value: option[0]
        });
        var label = makeElement(api, "label", { className: "pde-choice", htmlFor: inputId }, [input, option[1]]);
        question.appendChild(label);
        if (index === 0) {
          question.setAttribute("aria-label", model.shortLabel + "的严格符号判断");
        }
      });
      predictionGrid.appendChild(question);
    });
    predictionFieldset.appendChild(predictionGrid);
    predictionForm.appendChild(predictionNote);
    predictionForm.appendChild(predictionFieldset);
    var submitButton = makeElement(api, "button", {
      type: "submit",
      className: "pde-primary",
      text: "提交预测并揭晓"
    });
    var resetButton = makeElement(api, "button", {
      type: "button",
      text: "重置"
    });
    predictionForm.appendChild(makeElement(api, "div", { className: "pde-button-row" }, [submitButton, resetButton]));
    var feedback = makeElement(api, "p", { className: "pde-feedback", role: "status", "aria-live": "polite" }, [
      "答案尚未揭晓。"
    ]);
    var answerHost = makeElement(api, "div", { className: "pde-answer", hidden: true });

    var afterReveal = makeElement(api, "section", {
      className: "pde-after-reveal pde-hidden",
      "aria-label": "答案揭晓后的传播比较"
    });
    var controls = makeElement(api, "section", { className: "pde-controls", "aria-label": "传播参数控制" });
    controls.appendChild(makeElement(api, "h4", {}, ["揭晓后调参"]));
    controls.appendChild(makeElement(api, "p", { className: "pde-note" }, [
      "观测点 x*=5 和坐标轴固定；t>0。c 控制输运，a 控制波速，κ 控制热扩散。"
    ]));
    var timeControl = makeRangeControl(api, uid, "time", "时间 t", 0.1, 8, 0.1, state.time);
    var transportControl = makeRangeControl(api, uid, "transport-speed", "输运速度 c", -2, 2, 0.1, state.transportSpeed);
    var waveControl = makeRangeControl(api, uid, "wave-speed", "波速 a", 0.25, 2.5, 0.05, state.waveSpeed);
    var diffusivityControl = makeRangeControl(api, uid, "diffusivity", "扩散率 κ", 0.1, 3, 0.05, state.diffusivity);
    refs.controls = {
      time: timeControl,
      transportSpeed: transportControl,
      waveSpeed: waveControl,
      diffusivity: diffusivityControl
    };
    controls.appendChild(timeControl.node);
    controls.appendChild(transportControl.node);
    controls.appendChild(waveControl.node);
    controls.appendChild(diffusivityControl.node);
    var afterResetButton = makeElement(api, "button", { type: "button", text: "恢复默认参数" });
    controls.appendChild(makeElement(api, "div", { className: "pde-button-row" }, [afterResetButton]));

    var status = makeElement(api, "p", { className: "pde-status", role: "status", "aria-live": "polite" }, [""]);
    var metricsHost = makeElement(api, "div", { className: "pde-metrics", "aria-label": "观测点数值" });
    var chartsHost = makeElement(api, "div", { className: "pde-chart-grid", "aria-label": "三种方程的固定坐标图" });
    var legend = makeElement(api, "div", { className: "pde-legend", "aria-label": "图例" }, [
      makeElement(api, "span", { className: "pde-legend-item" }, [makeElement(api, "span", { className: "pde-swatch pde-swatch-initial", "aria-hidden": "true" }), "虚线：初值 φ"]),
      makeElement(api, "span", { className: "pde-legend-item" }, [makeElement(api, "span", { className: "pde-swatch pde-swatch-transport", "aria-hidden": "true" }), "红：输运"]),
      makeElement(api, "span", { className: "pde-legend-item" }, [makeElement(api, "span", { className: "pde-swatch pde-swatch-wave", "aria-hidden": "true" }), "蓝：波动"]),
      makeElement(api, "span", { className: "pde-legend-item" }, [makeElement(api, "span", { className: "pde-swatch pde-swatch-heat", "aria-hidden": "true" }), "绿：热"]),
      makeElement(api, "span", { className: "pde-legend-item" }, [makeElement(api, "span", { className: "pde-swatch pde-swatch-mode", "aria-hidden": "true" }), "金：Fourier 衰减"])
    ]);
    var modeTitle = makeElement(api, "h4", { className: "pde-section-title" }, ["Fourier 模态：高频先死"]);
    var modeChartHost = makeElement(api, "div");
    var modeTableHost = makeElement(api, "div", { className: "pde-mode-table-wrap" });
    var formulaHost = makeElement(api, "p", { className: "pde-formula" });
    var stage = makeElement(api, "section", { className: "pde-stage" }, [
      makeElement(api, "div", { className: "pde-stage-frame" }, [
        status,
        metricsHost,
        chartsHost,
        legend,
        modeTitle,
        modeChartHost,
        modeTableHost,
        formulaHost,
        makeElement(api, "p", { className: "pde-footnote" }, [
          "图形是固定网格上的数值可视化；严格的零/正结论来自特征线、依赖区间和热核正性，不由四舍五入的像素决定。"
        ])
      ])
    ]);
    var layout = makeElement(api, "div", { className: "pde-layout" }, [controls, stage]);
    afterReveal.appendChild(layout);
    replaceChildren(root, [heading, intro, fixedNote, predictionForm, feedback, answerHost, afterReveal]);

    function selectedPredictions() {
      var selections = {};
      var missing = [];
      MODELS.forEach(function (model) {
        var selected = root.querySelector("input[name='" + uid + "-" + model.key + "']:checked");
        if (!selected) {
          missing.push(model.shortLabel);
        } else {
          selections[model.key] = selected.value;
        }
      });
      return { selections: selections, missing: missing };
    }

    function syncControl(control, value, digits) {
      control.input.value = String(value);
      control.output.textContent = formatNumber(api, value, digits);
      control.input.setAttribute("aria-valuetext", formatNumber(api, value, digits));
    }

    function render() {
      var data = evaluate({
        xTarget: DEFAULTS.xTarget,
        time: state.time,
        transportSpeed: state.transportSpeed,
        waveSpeed: state.waveSpeed,
        diffusivity: state.diffusivity
      });
      syncControl(refs.controls.time, state.time, 2);
      syncControl(refs.controls.transportSpeed, state.transportSpeed, 2);
      syncControl(refs.controls.waveSpeed, state.waveSpeed, 2);
      syncControl(refs.controls.diffusivity, state.diffusivity, 2);
      status.textContent =
        "t=" + formatNumber(api, state.time, 2) + "，c=" + formatNumber(api, state.transportSpeed, 2) +
        "，a=" + formatNumber(api, state.waveSpeed, 2) + "，κ=" + formatNumber(api, state.diffusivity, 2) +
        "；固定观测点 x*=5。三幅图的坐标轴未改变。";
      replaceChildren(metricsHost, MODELS.map(function (model) {
        return makeMetric(api, model, data.point[model.key], data);
      }));
      replaceChildren(chartsHost, MODELS.map(function (model) {
        return makeElement(api, "div", { className: "pde-chart-card" }, [
          makeElement(api, "h4", {}, [model.label]),
          drawPropagationChart(api, model, data, uid + "-" + model.key)
        ]);
      }));
      replaceChildren(modeChartHost, drawModeChart(api, data, uid + "-modes"));
      replaceChildren(modeTableHost, makeModeTable(api, data));
      replaceChildren(formulaHost, [
        "Fourier 模态：exp(-kappa*k^2*t)；当前为 exp(−" +
        formatNumber(api, state.diffusivity, 2) + "·k²·" + formatNumber(api, state.time, 2) + ")。"
      ]);
    }

    function resetAll(announceMessage) {
      state.revealed = false;
      state.time = DEFAULTS.time;
      state.transportSpeed = DEFAULTS.transportSpeed;
      state.waveSpeed = DEFAULTS.waveSpeed;
      state.diffusivity = DEFAULTS.diffusivity;
      predictionForm.reset();
      predictionFieldset.disabled = false;
      submitButton.disabled = false;
      answerHost.hidden = true;
      afterReveal.classList.add("pde-hidden");
      feedback.textContent = "答案尚未揭晓。";
      render();
      announce(api, root, announceMessage || "实验已重置；请重新提交三项预测。");
    }

    predictionForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var result = selectedPredictions();
      if (result.missing.length) {
        feedback.textContent = "请先完成：" + result.missing.join("、") + "。答案仍未揭晓。";
        announce(api, root, feedback.textContent);
        return;
      }
      state.revealed = true;
      predictionFieldset.disabled = true;
      submitButton.disabled = true;
      answerHost.hidden = false;
      renderAnswer(api, answerHost, result.selections);
      afterReveal.classList.remove("pde-hidden");
      feedback.textContent = "答案已揭晓；现在可以调节时间、速度和扩散率。";
      render();
      announce(api, root, "预测答案已揭晓，三种传播模型和 Fourier 模态已显示。");
    });
    resetButton.addEventListener("click", function () {
      resetAll("实验已重置；预测答案再次隐藏。");
    });
    afterResetButton.addEventListener("click", function () {
      state.time = DEFAULTS.time;
      state.transportSpeed = DEFAULTS.transportSpeed;
      state.waveSpeed = DEFAULTS.waveSpeed;
      state.diffusivity = DEFAULTS.diffusivity;
      render();
      announce(api, root, "参数已恢复为 t=3、c=1、a=1、κ=1；预测状态保留。");
    });
    timeControl.input.addEventListener("input", function () {
      state.time = clamp(Number(timeControl.input.value), 0.1, 8);
      render();
    });
    transportControl.input.addEventListener("input", function () {
      state.transportSpeed = clamp(Number(transportControl.input.value), -2, 2);
      render();
    });
    waveControl.input.addEventListener("input", function () {
      state.waveSpeed = clamp(Number(waveControl.input.value), 0.25, 2.5);
      render();
    });
    diffusivityControl.input.addEventListener("input", function () {
      state.diffusivity = clamp(Number(diffusivityControl.input.value), 0.1, 3);
      render();
    });

    render();
    announce(api, root, "传播实验已加载；请先提交固定例题的三项预测。");
  }

  var exported = {
    DEFAULTS: DEFAULTS,
    AXIS: AXIS,
    tent: tent,
    transportSolution: transportSolution,
    waveSolution: waveSolution,
    heatConvolution: heatConvolution,
    fourierDecay: fourierDecay,
    evaluate: evaluate,
    selfTest: selfTest
  };

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) {
        throw new Error("pde-propagation self-test failed: " + message);
      }
    }
    function close(actual, expected, tolerance, message) {
      check(Math.abs(actual - expected) <= tolerance, message + " (got " + actual + ")");
    }

    close(tent(0), 1, 1e-12, "tent peak");
    close(tent(0.5), 0.5, 1e-12, "tent slope");
    close(tent(1), 0, 1e-12, "tent edge");
    close(tent(1.01), 0, 1e-12, "tent support");
    var defaultData = evaluate(DEFAULTS);
    check(defaultData.point.transport === 0, "default transport is strictly zero");
    check(defaultData.point.wave === 0, "default wave is strictly zero");
    check(defaultData.point.heat > 0, "default heat value is strictly positive");
    close(transportSolution(3, 1, 1), tent(2), 1e-12, "characteristic shift");
    close(waveSolution(0, 1, 1), tent(1), 1e-12, "zero-velocity wave symmetry");
    check(heatConvolution(0, 0.5, 1) > 0, "heat positivity near support");
    close(fourierDecay(0, 3, 1), 1, 1e-12, "zero Fourier mode");
    check(fourierDecay(2, 1, 1) < fourierDecay(1, 1, 1), "higher mode decays faster");
    check(fourierDecay(1, 2, 1) < fourierDecay(1, 1, 1), "later time decays more");
    return {
      checks: checks,
      status: "PASS",
      defaultPoint: defaultData.point
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") {
    host.CourseLearning.register("pde-propagation", mount);
  }
  if (
    typeof module !== "undefined" &&
    module.exports &&
    typeof require !== "undefined" &&
    require.main === module &&
    process.argv.indexOf("--self-test") !== -1
  ) {
    try {
      var report = selfTest();
      process.stdout.write(
        "pde-propagation self-test: PASS (" + report.checks + " checks; default heat=" +
        report.defaultPoint.heat + ")\n"
      );
    } catch (error) {
      process.stderr.write("pde-propagation self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
}(typeof window !== "undefined" ? window : null));
