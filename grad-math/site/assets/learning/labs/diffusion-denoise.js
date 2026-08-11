(function () {
  "use strict";

  if (
    typeof window === "undefined" ||
    !window.CourseLearning ||
    typeof window.CourseLearning.register !== "function"
  ) {
    return;
  }

  var GRID_SIZE = 12;
  var MAX_T = 0.96;
  var STYLE_ID = "diffusion-denoise-lab-styles";
  var INSTANCE = 0;
  var X0_ROWS = [
    "000011000000",
    "000111100000",
    "001100110000",
    "011000011000",
    "011000011000",
    "110000001100",
    "110000001100",
    "111111111100",
    "110000001100",
    "110000001100",
    "110000001100",
    "110000001100"
  ];
  var TOY_U_ROWS = [
    "00111100",
    "01100110",
    "11000011",
    "11000011",
    "11000011",
    "11000011",
    "01100110",
    "00111100"
  ];
  var TOY_C_ROWS = [
    "00010000",
    "00110000",
    "01110000",
    "11111111",
    "11111111",
    "01110000",
    "00110000",
    "00010000"
  ];
  var CFG_U = [1.1, 0.35];
  var CFG_C = [2.3, 1.7];
  var EPSILON = makeGaussianField(GRID_SIZE * GRID_SIZE, 20260810);
  var ERROR_FIELD = normalizeRms(makeGaussianField(GRID_SIZE * GRID_SIZE, 16082026));
  var X0 = rowsToValues(X0_ROWS, -0.86, 0.86);
  var TOY_U = rowsToValues(TOY_U_ROWS, -0.72, 0.72);
  var TOY_C = rowsToValues(TOY_C_ROWS, -0.72, 0.72);

  var STYLE_TEXT = [
    ".diffusion-denoise-lab { --dd-blue: #315f9d; --dd-orange: #b6533b; --dd-green: #39734d; --dd-purple: #7652a5; --dd-muted: var(--fg-soft, #6f6a60); --dd-panel: var(--bg, #fff); --dd-border: var(--border, #c9c3b8); max-width: 100%; min-width: 0; color: var(--fg); line-height: 1.5; }",
    "html[data-theme=\"dark\"] .diffusion-denoise-lab { --dd-blue: #83c8ff; --dd-orange: #f08c7d; --dd-green: #72bd8b; --dd-purple: #c7a6ff; --dd-muted: #b8b2a7; }",
    ".diffusion-denoise-lab * { box-sizing: border-box; }",
    ".diffusion-denoise-lab .dd-shell { min-width: 0; }",
    ".diffusion-denoise-lab .dd-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; padding: 14px 16px; border: 1px solid var(--dd-border); border-radius: 8px; background: var(--dd-panel); }",
    ".diffusion-denoise-lab .dd-kicker { margin: 0; color: var(--dd-muted); font-size: 12px; letter-spacing: .05em; text-transform: uppercase; }",
    ".diffusion-denoise-lab h3, .diffusion-denoise-lab h4 { margin-top: 0; }",
    ".diffusion-denoise-lab .dd-header h3 { margin: 2px 0 5px; font-size: 1.08rem; }",
    ".diffusion-denoise-lab .dd-header p:last-child { margin: 0; color: var(--dd-muted); font-size: 13px; }",
    ".diffusion-denoise-lab button { min-height: 44px; padding: 8px 12px; border: 1px solid var(--dd-border); border-radius: 6px; background: var(--dd-panel); color: var(--fg); font: inherit; line-height: 1.3; cursor: pointer; }",
    ".diffusion-denoise-lab button:hover { border-color: var(--accent); }",
    ".diffusion-denoise-lab button[aria-pressed=\"true\"], .diffusion-denoise-lab button.dd-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); font-weight: 700; }",
    ".diffusion-denoise-lab button:focus-visible, .diffusion-denoise-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".diffusion-denoise-lab .dd-reset { flex: 0 0 auto; white-space: nowrap; }",
    ".diffusion-denoise-lab .dd-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 12px; }",
    ".diffusion-denoise-lab .dd-tab { flex: 1 1 220px; }",
    ".diffusion-denoise-lab .dd-panel[hidden] { display: none; }",
    ".diffusion-denoise-lab .dd-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; margin-bottom: 14px; }",
    ".diffusion-denoise-lab .dd-control { min-width: 0; display: grid; gap: 6px; }",
    ".diffusion-denoise-lab .dd-control-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }",
    ".diffusion-denoise-lab .dd-control label, .diffusion-denoise-lab .dd-control legend { color: var(--dd-muted); font-size: 13px; font-weight: 650; }",
    ".diffusion-denoise-lab .dd-control output { color: var(--accent); font-variant-numeric: tabular-nums; white-space: nowrap; }",
    ".diffusion-denoise-lab input[type=\"range\"] { width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
    ".diffusion-denoise-lab .dd-scale { display: flex; justify-content: space-between; gap: 8px; color: var(--dd-muted); font-size: 11px; }",
    ".diffusion-denoise-lab .dd-presets { display: flex; flex-wrap: wrap; gap: 8px; grid-column: 1 / -1; }",
    ".diffusion-denoise-lab .dd-presets-label { flex: 0 0 100%; margin: 0; color: var(--dd-muted); font-size: 13px; font-weight: 650; }",
    ".diffusion-denoise-lab .dd-stage-card { min-width: 0; padding: 10px; border: 1px solid var(--dd-border); border-radius: 7px; background: var(--dd-panel); }",
    ".diffusion-denoise-lab .dd-stage-title { display: flex; justify-content: space-between; gap: 10px; margin: 0 0 8px; color: var(--dd-muted); font-size: 13px; }",
    ".diffusion-denoise-lab .dd-scroll { max-width: 100%; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; }",
    ".diffusion-denoise-lab .dd-noise-svg { display: block; width: 100%; min-width: 0; height: auto; color: var(--fg); }",
    ".diffusion-denoise-lab .dd-cfg-svg { display: block; width: 100%; min-width: 680px; height: auto; color: var(--fg); }",
    ".diffusion-denoise-lab .dd-toy-svg { display: block; width: 100%; max-width: 360px; height: auto; color: var(--fg); }",
    ".diffusion-denoise-lab svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".diffusion-denoise-lab .dd-panel-box { fill: var(--dd-panel); stroke: var(--dd-border); stroke-width: 1.2; }",
    ".diffusion-denoise-lab .dd-grid-line { stroke: currentColor; stroke-opacity: .14; stroke-width: 1; }",
    ".diffusion-denoise-lab .dd-axis { stroke: currentColor; stroke-opacity: .55; stroke-width: 1.25; }",
    ".diffusion-denoise-lab .dd-axis-label, .diffusion-denoise-lab .dd-tick { fill: var(--dd-muted) !important; font-size: 11px; }",
    ".diffusion-denoise-lab .dd-vector-u { stroke: var(--dd-blue); fill: none; }",
    ".diffusion-denoise-lab .dd-vector-c { stroke: var(--dd-green); fill: none; }",
    ".diffusion-denoise-lab .dd-vector-guided { stroke: var(--dd-orange); fill: none; }",
    ".diffusion-denoise-lab .dd-vector-difference { stroke: var(--dd-purple); fill: none; stroke-dasharray: 6 5; opacity: .9; }",
    ".diffusion-denoise-lab .dd-arrow-u { fill: var(--dd-blue); stroke: none; }",
    ".diffusion-denoise-lab .dd-arrow-c { fill: var(--dd-green); stroke: none; }",
    ".diffusion-denoise-lab .dd-arrow-guided { fill: var(--dd-orange); stroke: none; }",
    ".diffusion-denoise-lab .dd-point { stroke: var(--dd-panel); stroke-width: 2; }",
    ".diffusion-denoise-lab .dd-label-u { fill: var(--dd-blue) !important; font-weight: 700; }",
    ".diffusion-denoise-lab .dd-label-c { fill: var(--dd-green) !important; font-weight: 700; }",
    ".diffusion-denoise-lab .dd-label-guided { fill: var(--dd-orange) !important; font-weight: 700; }",
    ".diffusion-denoise-lab .dd-label-difference { fill: var(--dd-purple) !important; font-size: 11px; }",
    ".diffusion-denoise-lab .dd-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 9px; color: var(--dd-muted); font-size: 12px; }",
    ".diffusion-denoise-lab .dd-legend-item { display: inline-flex; align-items: center; gap: 6px; }",
    ".diffusion-denoise-lab .dd-swatch { display: inline-block; width: 23px; height: 10px; border-radius: 2px; background: currentColor; }",
    ".diffusion-denoise-lab .dd-swatch-dashed { height: 0; border-top: 2px dashed currentColor; border-radius: 0; background: transparent; }",
    ".diffusion-denoise-lab .dd-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); gap: 8px; margin-top: 12px; }",
    ".diffusion-denoise-lab .dd-metric { min-width: 0; padding: 9px 10px; border-top: 2px solid var(--dd-border); background: var(--dd-panel); }",
    ".diffusion-denoise-lab .dd-metric span { display: block; color: var(--dd-muted); font-size: 11.5px; line-height: 1.4; }",
    ".diffusion-denoise-lab .dd-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".diffusion-denoise-lab .dd-equation { margin-top: 12px; padding: 9px 11px; border-left: 3px solid var(--accent); background: var(--dd-panel); color: var(--fg); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: 12px; line-height: 1.6; overflow-x: auto; }",
    ".diffusion-denoise-lab .dd-status, .diffusion-denoise-lab .dd-note { margin: 10px 0 0; color: var(--dd-muted); font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".diffusion-denoise-lab .dd-status { min-height: 1.65em; color: var(--fg); font-weight: 650; }",
    ".diffusion-denoise-lab .dd-cfg-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; align-items: start; }",
    ".diffusion-denoise-lab .dd-cfg-layout > * { min-width: 0; }",
    ".diffusion-denoise-lab .dd-cfg-side { min-width: 0; padding: 10px; border: 1px solid var(--dd-border); border-radius: 7px; background: var(--dd-panel); }",
    ".diffusion-denoise-lab .dd-cfg-side h4 { margin-bottom: 8px; font-size: 14px; }",
    ".diffusion-denoise-lab .dd-cfg-side p { margin: 8px 0 0; color: var(--dd-muted); font-size: 12.5px; line-height: 1.6; }",
    ".diffusion-denoise-lab .dd-cfg-chart { min-width: 0; padding: 10px; border: 1px solid var(--dd-border); border-radius: 7px; background: var(--dd-panel); }",
    ".diffusion-denoise-lab .dd-cfg-chart .dd-scroll { margin: -2px; }",
    ".diffusion-denoise-lab .dd-cfg-formula { margin-top: 12px; }",
    ".diffusion-denoise-lab .dd-cfg-controls { grid-template-columns: minmax(0, 1fr); }",
    ".diffusion-denoise-lab .dd-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }",
    "@media (max-width: 720px) { .diffusion-denoise-lab .dd-header { display: grid; } .diffusion-denoise-lab .dd-reset { justify-self: start; } .diffusion-denoise-lab .dd-controls { grid-template-columns: minmax(0, 1fr); } .diffusion-denoise-lab .dd-presets { grid-column: auto; } .diffusion-denoise-lab .dd-cfg-layout { grid-template-columns: minmax(0, 1fr); } }",
    "@media (max-width: 560px) { .diffusion-denoise-lab .dd-noise-svg { width: 780px; max-width: none; } }",
    "@media (max-width: 460px) { .diffusion-denoise-lab .dd-header, .diffusion-denoise-lab .dd-stage-card, .diffusion-denoise-lab .dd-cfg-chart, .diffusion-denoise-lab .dd-cfg-side { padding: 9px; } .diffusion-denoise-lab .dd-tab { flex-basis: 100%; } }",
    "@media (prefers-reduced-motion: reduce) { .diffusion-denoise-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (document.head || document.documentElement).appendChild(style);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) {
      return value === Infinity ? "∞" : "—";
    }
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatVector(vector) {
    return "(" + format(vector[0], 2) + ", " + format(vector[1], 2) + ")";
  }

  function makeGaussianField(length, seed) {
    var random = mulberry32(seed);
    var values = [];
    while (values.length < length) {
      var u = Math.max(random(), 1e-12);
      var v = Math.max(random(), 1e-12);
      var radius = Math.sqrt(-2 * Math.log(u));
      var angle = 2 * Math.PI * v;
      values.push(radius * Math.cos(angle));
      if (values.length < length) {
        values.push(radius * Math.sin(angle));
      }
    }
    return values;
  }

  function mulberry32(seed) {
    var value = seed >>> 0;
    return function () {
      var t = (value += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalizeRms(values) {
    var sum = values.reduce(function (total, value) {
      return total + value * value;
    }, 0);
    var rms = Math.sqrt(sum / values.length);
    return values.map(function (value) {
      return value / rms;
    });
  }

  function rowsToValues(rows, background, foreground) {
    return rows.reduce(function (values, row) {
      row.split("").forEach(function (mark) {
        values.push(mark === "1" ? foreground : background);
      });
      return values;
    }, []);
  }

  function alphaBar(t) {
    return Math.pow(Math.cos((Math.PI * t) / 2), 2);
  }

  function meanSquaredError(left, right) {
    var total = 0;
    for (var index = 0; index < left.length; index += 1) {
      var difference = left[index] - right[index];
      total += difference * difference;
    }
    return total / left.length;
  }

  function computeNoise(t, delta) {
    var alpha = alphaBar(t);
    var noiseWeight = Math.sqrt(1 - alpha);
    var signalWeight = Math.sqrt(alpha);
    var xT = [];
    var epsilonHat = [];
    var xHat = [];
    for (var index = 0; index < X0.length; index += 1) {
      var predictedNoise = EPSILON[index] + delta * ERROR_FIELD[index];
      xT.push(signalWeight * X0[index] + noiseWeight * EPSILON[index]);
      epsilonHat.push(predictedNoise);
      xHat.push(
        (signalWeight * X0[index] + noiseWeight * EPSILON[index] -
          noiseWeight * predictedNoise) /
          signalWeight
      );
    }
    var mseEpsilon = meanSquaredError(EPSILON, epsilonHat);
    var gain = Math.sqrt((1 - alpha) / alpha);
    return {
      alpha: alpha,
      snr: alpha / (1 - alpha),
      gain: gain,
      xT: xT,
      epsilonHat: epsilonHat,
      xHat: xHat,
      mseEpsilon: mseEpsilon,
      mseX0: meanSquaredError(X0, xHat)
    };
  }

  function colorFor(value, domain) {
    var normalized = clamp(value / domain, -1, 1);
    var negative = [35, 83, 135];
    var neutral = [245, 242, 233];
    var positive = [181, 77, 55];
    var start;
    var end;
    var amount;
    if (normalized < 0) {
      start = negative;
      end = neutral;
      amount = normalized + 1;
    } else {
      start = neutral;
      end = positive;
      amount = normalized;
    }
    var rgb = start.map(function (channel, index) {
      return Math.round(channel + (end[index] - channel) * amount);
    });
    return "rgb(" + rgb.join(",") + ")";
  }

  function svgText(api, x, y, value, attrs) {
    return api.svg(
      "text",
      Object.assign(
        {
          x: x,
          y: y,
          "font-size": 12,
          "aria-hidden": "true"
        },
        attrs || {}
      ),
      [value]
    );
  }

  function buildNoiseSvg(api, result, instanceId) {
    var width = 948;
    var height = 338;
    var panelWidth = 300;
    var panelGap = 16;
    var cell = 17;
    var gridSize = cell * GRID_SIZE;
    var svgTitleId = instanceId + "-noise-title";
    var svgDescId = instanceId + "-noise-desc";
    var svg = api.svg("svg", {
      className: "dd-noise-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": svgTitleId + " " + svgDescId,
      preserveAspectRatio: "xMinYMin meet"
    });
    svg.appendChild(api.svg("title", { id: svgTitleId }, ["固定像素图上的闭式加噪与重建"]));
    svg.appendChild(
      api.svg("desc", { id: svgDescId }, [
        "左为固定的 x0，中为按 cosine 教学 schedule 加噪得到的 xt，右为用 epsilon hat 重建的 x0 hat。"
      ])
    );
    var panels = [
      {
        label: "x₀ · 固定图案",
        subtitle: "clean target",
        values: X0,
        domain: 1
      },
      {
        label: "xₜ · 闭式加噪",
        subtitle: "√ᾱ x₀ + √(1−ᾱ) ε",
        values: result.xT,
        domain: 2.5
      },
      {
        label: "x̂₀ · ε̂ 重建",
        subtitle: "ε̂ = ε + δe",
        values: result.xHat,
        domain: 1.5
      }
    ];
    panels.forEach(function (panel, panelIndex) {
      var x = 8 + panelIndex * (panelWidth + panelGap);
      var group = api.svg("g", {
        role: "group",
        "aria-label": panel.label + "；" + panel.subtitle
      });
      group.appendChild(
        api.svg("rect", {
          className: "dd-panel-box",
          x: x,
          y: 8,
          width: panelWidth,
          height: 312,
          rx: 6
        })
      );
      group.appendChild(
        svgText(api, x + panelWidth / 2, 32, panel.label, {
          "text-anchor": "middle",
          "font-size": 15,
          "font-weight": 700
        })
      );
      group.appendChild(
        svgText(api, x + panelWidth / 2, 51, panel.subtitle, {
          "text-anchor": "middle",
          "font-size": 11,
          fill: "var(--dd-muted)"
        })
      );
      var gridX = x + (panelWidth - gridSize) / 2;
      var gridY = 68;
      panel.values.forEach(function (value, index) {
        var row = Math.floor(index / GRID_SIZE);
        var column = index % GRID_SIZE;
        group.appendChild(
          api.svg("rect", {
            x: gridX + column * cell,
            y: gridY + row * cell,
            width: cell - 1,
            height: cell - 1,
            rx: 1,
            fill: colorFor(value, panel.domain),
            stroke: "var(--dd-border)",
            "stroke-width": 0.65,
            "aria-hidden": "true"
          })
        );
      });
      group.appendChild(
        svgText(api, x + panelWidth / 2, 290, panelIndex === 1 ? "颜色范围：约 −2.5…2.5" : "颜色范围：约 −1.5…1.5", {
          "text-anchor": "middle",
          "font-size": 10,
          fill: "var(--dd-muted)"
        })
      );
      svg.appendChild(group);
    });
    svg.appendChild(
      svgText(
        api,
        width - 12,
        height - 8,
        "固定 seed · 只演示误差传播",
        {
          "text-anchor": "end",
          "font-size": 11,
          fill: "var(--dd-muted)"
        }
      )
    );
    return svg;
  }

  function vectorLength(vector) {
    return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
  }

  function subtract(left, right) {
    return [left[0] - right[0], left[1] - right[1]];
  }

  function addScaled(left, direction, scale) {
    return [left[0] + scale * direction[0], left[1] + scale * direction[1]];
  }

  function buildCfgSvg(api, w, instanceId) {
    var width = 720;
    var height = 420;
    var originX = 105;
    var originY = 335;
    var scale = 24;
    var difference = subtract(CFG_C, CFG_U);
    var guided = addScaled(CFG_U, difference, w);
    var titleId = instanceId + "-cfg-title";
    var descId = instanceId + "-cfg-desc";
    var svg = api.svg("svg", {
      className: "dd-cfg-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": titleId + " " + descId,
      preserveAspectRatio: "xMinYMin meet"
    });
    svg.appendChild(api.svg("title", { id: titleId }, ["CFG 二维向量几何"]));
    svg.appendChild(
      api.svg("desc", { id: descId }, [
        "无条件向量 epsilon u、条件向量 epsilon c，以及由 w 控制的 guided 向量。w 大于 1 时 guided 越过条件点。"
      ])
    );
    var defs = api.svg("defs");
    [
      ["dd-arrow-u-" + instanceId, "dd-arrow-u"],
      ["dd-arrow-c-" + instanceId, "dd-arrow-c"],
      ["dd-arrow-guided-" + instanceId, "dd-arrow-guided"]
    ].forEach(function (definition) {
      var marker = api.svg("marker", {
        id: definition[0],
        markerWidth: 10,
        markerHeight: 10,
        refX: 9,
        refY: 5,
        orient: "auto",
        markerUnits: "userSpaceOnUse"
      });
      marker.appendChild(
        api.svg("path", {
          d: "M 0 0 L 10 5 L 0 10 z",
          className: definition[1]
        })
      );
      defs.appendChild(marker);
    });
    svg.appendChild(defs);
    function mapPoint(vector) {
      return [originX + vector[0] * scale, originY - vector[1] * scale];
    }
    var grid = api.svg("g", { "aria-hidden": "true" });
    for (var xTick = 0; xTick <= 12; xTick += 4) {
      var xPosition = originX + xTick * scale;
      grid.appendChild(
        api.svg("line", {
          className: "dd-grid-line",
          x1: xPosition,
          y1: 25,
          x2: xPosition,
          y2: originY
        })
      );
      grid.appendChild(
        svgText(api, xPosition, originY + 18, String(xTick), {
          "text-anchor": "middle",
          className: "dd-tick"
        })
      );
    }
    for (var yTick = -4; yTick <= 12; yTick += 4) {
      var yPosition = originY - yTick * scale;
      grid.appendChild(
        api.svg("line", {
          className: "dd-grid-line",
          x1: originX,
          y1: yPosition,
          x2: originX + 12 * scale,
          y2: yPosition
        })
      );
      grid.appendChild(
        svgText(api, originX - 9, yPosition + 4, String(yTick), {
          "text-anchor": "end",
          className: "dd-tick"
        })
      );
    }
    svg.appendChild(grid);
    svg.appendChild(
      api.svg("line", {
        className: "dd-axis",
        x1: originX,
        y1: originY,
        x2: originX + 12 * scale,
        y2: originY
      })
    );
    svg.appendChild(
      api.svg("line", {
        className: "dd-axis",
        x1: originX,
        y1: originY,
        x2: originX,
        y2: 25
      })
    );
    svg.appendChild(
      svgText(api, originX + 6 * scale, originY + 40, "语义轴 1", {
        "text-anchor": "middle",
        className: "dd-axis-label"
      })
    );
    svg.appendChild(
      svgText(api, originX - 48, 46, "语义轴 2", {
        "text-anchor": "middle",
        className: "dd-axis-label",
        transform: "rotate(-90 " + (originX - 48) + " 46)"
      })
    );
    var originPoint = mapPoint([0, 0]);
    var uPoint = mapPoint(CFG_U);
    var cPoint = mapPoint(CFG_C);
    var guidedPoint = mapPoint(guided);
    svg.appendChild(
      api.svg("line", {
        className: "dd-vector-difference",
        x1: uPoint[0],
        y1: uPoint[1],
        x2: cPoint[0],
        y2: cPoint[1]
      })
    );
    [
      ["dd-vector-u", CFG_U, "dd-arrow-u-" + instanceId, "εu", "dd-label-u", 12, -8],
      ["dd-vector-c", CFG_C, "dd-arrow-c-" + instanceId, "εc", "dd-label-c", 12, -8],
      ["dd-vector-guided", guided, "dd-arrow-guided-" + instanceId, "εguided", "dd-label-guided", 12, 16]
    ].forEach(function (item) {
      var point = mapPoint(item[1]);
      svg.appendChild(
        api.svg("line", {
          className: item[0],
          x1: originPoint[0],
          y1: originPoint[1],
          x2: point[0],
          y2: point[1],
          "stroke-width": item[0] === "dd-vector-guided" ? 3.4 : 2.8,
          "stroke-linecap": "round",
          "marker-end": "url(#" + item[2] + ")"
        })
      );
      svg.appendChild(
        api.svg("circle", {
          className: "dd-point " + item[4],
          cx: point[0],
          cy: point[1],
          r: 5,
          fill: "currentColor"
        })
      );
      svg.appendChild(
        svgText(api, point[0] + item[5], point[1] + item[6], item[3], {
          className: item[4],
          "font-size": 13
        })
      );
    });
    svg.appendChild(
      svgText(api, (uPoint[0] + cPoint[0]) / 2 + 8, (uPoint[1] + cPoint[1]) / 2 - 8, "εc − εu", {
        className: "dd-label-difference"
      })
    );
    svg.appendChild(
      api.svg("circle", {
        cx: originPoint[0],
        cy: originPoint[1],
        r: 4,
        fill: "currentColor"
      })
    );
    var statusLines = w === 0
      ? ["w=0：guided 与 εu 重合", "位于无条件端点"]
      : w === 1
        ? ["w=1：guided 与 εc 重合", "恰好到达条件端点"]
        : ["w>1：guided 越过 εc", "沿条件方向继续外推"];
    svg.appendChild(
      api.svg("rect", {
        className: "dd-panel-box",
        x: 470,
        y: 30,
        width: 226,
        height: 190,
        rx: 6
      })
    );
    svg.appendChild(
      svgText(api, 486, 56, "当前几何读法", {
        "font-size": 14,
        "font-weight": 700
      })
    );
    statusLines.forEach(function (line, index) {
      svg.appendChild(
        svgText(api, 486, 80 + index * 18, line, {
          "font-size": 12,
          fill: "var(--dd-muted)"
        })
      );
    });
    svg.appendChild(
      svgText(api, 486, 126, "w = " + format(w, 1), {
        "font-size": 13,
        "font-weight": 700
      })
    );
    svg.appendChild(
      svgText(api, 486, 151, "εu = " + formatVector(CFG_U), {
        className: "dd-label-u",
        "font-size": 12
      })
    );
    svg.appendChild(
      svgText(api, 486, 174, "εc = " + formatVector(CFG_C), {
        className: "dd-label-c",
        "font-size": 12
      })
    );
    svg.appendChild(
      svgText(api, 486, 207, "虚线是 εc−εu；橙色是最终组合。", {
        "font-size": 11,
        fill: "var(--dd-muted)"
      })
    );
    return svg;
  }

  function buildToySvg(api, w, instanceId) {
    var width = 350;
    var height = 245;
    var cell = 22;
    var values = TOY_U.map(function (value, index) {
      return value + w * (TOY_C[index] - value);
    });
    var titleId = instanceId + "-toy-title";
    var descId = instanceId + "-toy-desc";
    var svg = api.svg("svg", {
      className: "dd-toy-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": titleId + " " + descId,
      preserveAspectRatio: "xMinYMin meet"
    });
    svg.appendChild(api.svg("title", { id: titleId }, ["CFG 玩具输出图案"]));
    svg.appendChild(
      api.svg("desc", { id: descId }, [
        "用两个固定的八乘八玩具模板按 u 加 w 乘以 c 减 u 组合；这不是图片质量指标。"
      ])
    );
    svg.appendChild(
      api.svg("rect", {
        className: "dd-panel-box",
        x: 5,
        y: 5,
        width: width - 10,
        height: height - 10,
        rx: 6
      })
    );
    svg.appendChild(
      svgText(api, width / 2, 28, "toy = u + w(c−u)", {
        "text-anchor": "middle",
        "font-size": 14,
        "font-weight": 700
      })
    );
    values.forEach(function (value, index) {
      var row = Math.floor(index / 8);
      var column = index % 8;
      svg.appendChild(
        api.svg("rect", {
          x: 84 + column * cell,
          y: 48 + row * cell,
          width: cell - 1,
          height: cell - 1,
          rx: 1,
          fill: colorFor(value, 4),
          stroke: "var(--dd-border)",
          "stroke-width": 0.7,
          "aria-hidden": "true"
        })
      );
    });
    svg.appendChild(
      svgText(api, width / 2, 236, "固定玩具信号；w>1 的饱和不是“质量变好”。", {
        "text-anchor": "middle",
        "font-size": 10,
        fill: "var(--dd-muted)"
      })
    );
    return svg;
  }

  function metric(api, label) {
    var value = api.el("strong", { text: "—" });
    return {
      card: api.el("div", { className: "dd-metric" }, [
        api.el("span", { text: label }),
        value
      ]),
      value: value
    };
  }

  function rangeControl(api, id, label, minimum, maximum, step, value, minimumLabel, maximumLabel) {
    var input = api.el("input", {
      type: "range",
      id: id,
      min: minimum,
      max: maximum,
      step: step,
      value: value
    });
    var output = api.el("output", {
      htmlFor: id,
      "aria-live": "polite",
      text: "—"
    });
    return {
      input: input,
      output: output,
      wrapper: api.el("div", { className: "dd-control" }, [
        api.el("div", { className: "dd-control-head" }, [
          api.el("label", { htmlFor: id, text: label }),
          output
        ]),
        input,
        api.el("div", { className: "dd-scale" }, [
          api.el("span", { text: minimumLabel }),
          api.el("span", { text: maximumLabel })
        ])
      ])
    };
  }

  function presetGroup(api, label, definitions, onSelect) {
    var buttons = [];
    var group = api.el("div", {
      className: "dd-presets",
      role: "group",
      "aria-label": label
    });
    group.appendChild(api.el("p", { className: "dd-presets-label", text: label }));
    definitions.forEach(function (definition) {
      var button = api.el("button", {
        type: "button",
        text: definition.label,
        "data-preset": definition.key,
        "aria-pressed": "false",
        onclick: function () {
          onSelect(definition);
        }
      });
      buttons.push(button);
      group.appendChild(button);
    });
    return { group: group, buttons: buttons };
  }

  function buildLab(root, api) {
    installStyles();
    INSTANCE += 1;
    var instanceId = "dd-" + INSTANCE;
    var state = {
      mode: "noise",
      t: 0.8,
      delta: 0.1,
      w: 1
    };

    root.classList.add("diffusion-denoise-lab");

    var resetButton = api.el("button", {
      type: "button",
      className: "dd-reset",
      text: "重置",
      "aria-label": "重置两个实验的教学参数"
    });
    var header = api.el("header", { className: "dd-header" }, [
      api.el("div", {}, [
        api.el("p", { className: "dd-kicker", text: "deterministic toy · no model · no API" }),
        api.el("h3", { text: "扩散误差账本与 CFG 几何" }),
        api.el("p", {
          text: "固定像素数组、固定 seed、原生 SVG；切换 tab 或拖动会重绘视图，但节点数量不会累积。"
        })
      ]),
      resetButton
    ]);

    var tabList = api.el("div", {
      className: "dd-tabs",
      role: "tablist",
      "aria-label": "扩散教学实验模式"
    });
    var noiseTab = api.el("button", {
      type: "button",
      className: "dd-tab",
      role: "tab",
      id: instanceId + "-tab-noise",
      "aria-controls": instanceId + "-panel-noise",
      "aria-selected": "true",
      text: "A · 加噪与重建"
    });
    var cfgTab = api.el("button", {
      type: "button",
      className: "dd-tab",
      role: "tab",
      id: instanceId + "-tab-cfg",
      "aria-controls": instanceId + "-panel-cfg",
      "aria-selected": "false",
      text: "B · CFG 几何"
    });
    tabList.append(noiseTab, cfgTab);

    var tControl = rangeControl(api, instanceId + "-t", "噪声时刻 t", "0", String(MAX_T), "0.01", String(state.t), "0（几乎无噪声）", "0.96（高噪声）");
    var deltaControl = rangeControl(api, instanceId + "-delta", "噪声预测误差 δ", "0", "0.20", "0.01", String(state.delta), "0", "0.20");
    tControl.input.setAttribute("aria-valuetext", "噪声时刻");
    deltaControl.input.setAttribute("aria-valuetext", "噪声预测误差");
    var noisePreset = presetGroup(
      api,
      "加噪预设",
      [
        { key: "low", label: "低噪声", t: 0.25, delta: 0.1 },
        { key: "high", label: "高噪声", t: 0.9, delta: 0.1 },
        { key: "perfect", label: "理想预测", t: 0.9, delta: 0 }
      ],
      function (definition) {
        state.t = definition.t;
        state.delta = definition.delta;
        tControl.input.value = String(state.t);
        deltaControl.input.value = String(state.delta);
        renderNoise();
        api.announce(root, "已切换到" + definition.label + "加噪预设。");
      }
    );
    var noiseControls = api.el("div", { className: "dd-controls" }, [
      tControl.wrapper,
      deltaControl.wrapper,
      noisePreset.group
    ]);
    var noiseStage = api.el("div", { className: "dd-scroll" });
    var noiseStageCard = api.el("section", { className: "dd-stage-card" }, [
      api.el("p", { className: "dd-stage-title" }, [
        api.el("span", { text: "三个像素网格：x₀、xₜ、由 ε̂ 重建的 x̂₀" }),
        api.el("span", { text: "12 × 12" })
      ]),
      noiseStage,
      api.el("div", { className: "dd-legend", "aria-label": "像素图颜色说明" }, [
        api.el("span", { className: "dd-legend-item" }, [
          api.el("i", { className: "dd-swatch", style: "background:#235387" }),
          api.el("span", { text: "负值" })
        ]),
        api.el("span", { className: "dd-legend-item" }, [
          api.el("i", { className: "dd-swatch", style: "background:#f5f2e9" }),
          api.el("span", { text: "接近 0" })
        ]),
        api.el("span", { className: "dd-legend-item" }, [
          api.el("i", { className: "dd-swatch", style: "background:#b54d37" }),
          api.el("span", { text: "正值" })
        ])
      ])
    ]);
    var noiseMetrics = {
      alpha: metric(api, "ᾱ(t)"),
      snr: metric(api, "SNR"),
      mseEpsilon: metric(api, "MSE(ε, ε̂)"),
      gain: metric(api, "误差放大因子"),
      mseX0: metric(api, "MSE(x₀, x̂₀)")
    };
    var noiseMetricHost = api.el("div", { className: "dd-metrics" }, [
      noiseMetrics.alpha.card,
      noiseMetrics.snr.card,
      noiseMetrics.mseEpsilon.card,
      noiseMetrics.gain.card,
      noiseMetrics.mseX0.card
    ]);
    var noiseEquation = api.el("div", { className: "dd-equation", "aria-live": "polite" });
    var noiseStatus = api.el("p", { className: "dd-status", "aria-live": "polite" });
    var noisePanel = api.el("section", {
      className: "dd-panel",
      id: instanceId + "-panel-noise",
      role: "tabpanel",
      "aria-labelledby": noiseTab.id,
      tabindex: "0"
    }, [
      noiseControls,
      noiseStageCard,
      noiseMetricHost,
      noiseEquation,
      noiseStatus,
      api.el("p", {
        className: "dd-note",
        text: "schedule 固定为 ᾱ(t)=cos²(πt/2)，t≤0.96；它是教学方便的闭式通道，不是产品调度器。ε̂ 使用固定 ε 加 δ 倍的固定误差方向。"
      })
    ]);

    var wControl = rangeControl(api, instanceId + "-w", "guidance scale w", "0", "8", "0.1", String(state.w), "0（无条件）", "8（强外推）");
    var cfgPreset = presetGroup(
      api,
      "CFG 预设",
      [
        { key: "unconditional", label: "w=0 · 无条件", w: 0 },
        { key: "conditional", label: "w=1 · 条件", w: 1 },
        { key: "extrapolate", label: "w=4 · 外推", w: 4 }
      ],
      function (definition) {
        state.w = definition.w;
        wControl.input.value = String(state.w);
        renderCfg();
        api.announce(root, "已切换到" + definition.label + "CFG 预设。");
      }
    );
    var cfgControls = api.el("div", { className: "dd-controls dd-cfg-controls" }, [
      wControl.wrapper,
      cfgPreset.group
    ]);
    var cfgStage = api.el("div", { className: "dd-scroll" });
    var cfgChart = api.el("section", { className: "dd-cfg-chart" }, [
      api.el("p", { className: "dd-stage-title" }, [
        api.el("span", { text: "εu、εc 与 εguided 的二维语义平面" }),
        api.el("span", { text: "纯几何" })
      ]),
      cfgStage
    ]);
    var toyStage = api.el("div", { className: "dd-scroll" });
    var toyCard = api.el("section", { className: "dd-cfg-side" }, [
      api.el("h4", { text: "玩具输出图案" }),
      toyStage,
      api.el("p", {
        text: "图案只是把两个固定 8×8 信号套入同一条外推公式，不能当作真实图片、质量分数或产品比较。"
      })
    ]);
    var cfgMetrics = {
      w: metric(api, "w"),
      ratio: metric(api, "‖εg−εu‖ / ‖εc−εu‖"),
      norm: metric(api, "‖εguided‖"),
      regime: metric(api, "几何状态")
    };
    var cfgMetricHost = api.el("div", { className: "dd-metrics" }, [
      cfgMetrics.w.card,
      cfgMetrics.ratio.card,
      cfgMetrics.norm.card,
      cfgMetrics.regime.card
    ]);
    var cfgEquation = api.el("div", { className: "dd-equation dd-cfg-formula", "aria-live": "polite" });
    var cfgStatus = api.el("p", { className: "dd-status", "aria-live": "polite" });
    var cfgPanel = api.el("section", {
      className: "dd-panel",
      id: instanceId + "-panel-cfg",
      role: "tabpanel",
      "aria-labelledby": cfgTab.id,
      tabindex: "0",
      hidden: true
    }, [
      cfgControls,
      api.el("div", { className: "dd-cfg-layout" }, [cfgChart, toyCard]),
      cfgMetricHost,
      cfgEquation,
      cfgStatus,
      api.el("p", {
        className: "dd-note",
        text: "固定 εu=(1.1,0.35)、εc=(2.3,1.7)。w=0 为无条件，w=1 为条件预测，w>1 为沿条件方向外推；高 w 的多样性/伪影提醒只属于一般性边界，不由本玩具实验测量。"
      })
    ]);

    root.replaceChildren(
      api.el("div", { className: "dd-shell" }, [
        header,
        tabList,
        noisePanel,
        cfgPanel
      ])
    );

    function updatePresetButtons(buttons, activeKey) {
      buttons.forEach(function (button) {
        button.setAttribute(
          "aria-pressed",
          button.getAttribute("data-preset") === activeKey ? "true" : "false"
        );
      });
    }

    function setMode(mode) {
      state.mode = mode === "cfg" ? "cfg" : "noise";
      var noiseActive = state.mode === "noise";
      noiseTab.setAttribute("aria-selected", noiseActive ? "true" : "false");
      cfgTab.setAttribute("aria-selected", noiseActive ? "false" : "true");
      noisePanel.hidden = !noiseActive;
      cfgPanel.hidden = noiseActive;
    }

    function renderNoise() {
      var result = computeNoise(
        clamp(Number(state.t), 0, MAX_T),
        clamp(Number(state.delta), 0, 0.2)
      );
      tControl.output.textContent = "t=" + format(state.t, 2);
      deltaControl.output.textContent = "δ=" + format(state.delta, 2);
      tControl.input.setAttribute("aria-valuetext", tControl.output.textContent);
      deltaControl.input.setAttribute("aria-valuetext", deltaControl.output.textContent);
      noiseMetrics.alpha.value.textContent = format(result.alpha, 4);
      noiseMetrics.snr.value.textContent = format(result.snr, 4);
      noiseMetrics.mseEpsilon.value.textContent = format(result.mseEpsilon, 5);
      noiseMetrics.gain.value.textContent = format(result.gain, 3) + "×";
      noiseMetrics.mseX0.value.textContent = format(result.mseX0, 5);
      noiseEquation.textContent =
        "x̂₀=(xₜ−√(1−ᾱ)ε̂)/√ᾱ；ε̂=ε+δe；" +
        "理论误差系数 √((1−ᾱ)/ᾱ)=" +
        format(result.gain, 3) +
        "，MSE 比例≈" +
        format(result.gain * result.gain, 3);
      noiseStatus.textContent =
        state.t >= 0.8 && state.delta > 0
          ? "高噪声区：ᾱ 很小；同样的 ε 预测误差会被更大的因子带入 x̂₀。"
          : state.delta === 0
            ? "理想预测：ε̂=ε，闭式重建回到固定的 x₀（仅受浮点数误差影响）。"
            : "观察 δ 不变时拖动 t：放大因子只由 schedule 的 ᾱ 决定。";
      noiseStage.replaceChildren(buildNoiseSvg(api, result, instanceId));
      var activeNoisePreset = "custom";
      if (state.t === 0.25 && state.delta === 0.1) activeNoisePreset = "low";
      if (state.t === 0.9 && state.delta === 0.1) activeNoisePreset = "high";
      if (state.t === 0.9 && state.delta === 0) activeNoisePreset = "perfect";
      updatePresetButtons(noisePreset.buttons, activeNoisePreset);
    }

    function renderCfg() {
      var w = clamp(Number(state.w), 0, 8);
      var difference = subtract(CFG_C, CFG_U);
      var guided = addScaled(CFG_U, difference, w);
      var differenceNorm = vectorLength(difference);
      var distanceFromU = vectorLength(subtract(guided, CFG_U));
      var regime = w === 0 ? "无条件" : w === 1 ? "条件点" : "外推";
      wControl.output.textContent = "w=" + format(w, 1);
      wControl.input.setAttribute("aria-valuetext", wControl.output.textContent);
      cfgMetrics.w.value.textContent = format(w, 1);
      cfgMetrics.ratio.value.textContent = format(distanceFromU / differenceNorm, 2) + "×";
      cfgMetrics.norm.value.textContent = format(vectorLength(guided), 3);
      cfgMetrics.regime.value.textContent = regime;
      cfgEquation.textContent =
        "εguided=" +
        formatVector(CFG_U) +
        " + " +
        format(w, 1) +
        "×" +
        formatVector(difference) +
        " = " +
        formatVector(guided);
      cfgStatus.textContent =
        w === 0
          ? "w=0：组合结果就是 εu，无条件分支。"
          : w === 1
            ? "w=1：组合结果就是 εc，正好到达条件预测。"
            : "w>1：组合点越过 εc；这是沿条件方向的外推，不是把概率简单乘以 w。";
      cfgStage.replaceChildren(buildCfgSvg(api, w, instanceId));
      toyStage.replaceChildren(buildToySvg(api, w, instanceId));
      var activeCfgPreset = "custom";
      if (w === 0) activeCfgPreset = "unconditional";
      if (w === 1) activeCfgPreset = "conditional";
      if (w === 4) activeCfgPreset = "extrapolate";
      updatePresetButtons(cfgPreset.buttons, activeCfgPreset);
    }

    noiseTab.addEventListener("click", function () {
      setMode("noise");
      api.announce(root, "已切换到加噪与重建。");
    });
    cfgTab.addEventListener("click", function () {
      setMode("cfg");
      api.announce(root, "已切换到 CFG 几何。");
    });
    tControl.input.addEventListener("input", function () {
      state.t = clamp(Number(tControl.input.value), 0, MAX_T);
      renderNoise();
    });
    deltaControl.input.addEventListener("input", function () {
      state.delta = clamp(Number(deltaControl.input.value), 0, 0.2);
      renderNoise();
    });
    wControl.input.addEventListener("input", function () {
      state.w = clamp(Number(wControl.input.value), 0, 8);
      renderCfg();
    });
    resetButton.addEventListener("click", function () {
      state.t = 0.8;
      state.delta = 0.1;
      state.w = 1;
      tControl.input.value = String(state.t);
      deltaControl.input.value = String(state.delta);
      wControl.input.value = String(state.w);
      renderNoise();
      renderCfg();
      api.announce(root, "实验已重置为固定 seed、t=0.80、δ=0.10、w=1。");
    });

    setMode(state.mode);
    renderNoise();
    renderCfg();
  }

  window.CourseLearning.register("diffusion-denoise", buildLab);
})();
