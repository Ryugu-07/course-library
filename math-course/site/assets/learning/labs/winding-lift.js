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
  var TAU = 2 * Math.PI;
  var AMPLITUDE = 1;
  var INSTANCE = 0;
  var DEFAULT_STATE = { n: 1, lambda: 0.65, t: 0.5 };
  var PRESETS = [
    { n: -2, label: "n=−2" },
    { n: -1, label: "n=−1" },
    { n: 0, label: "n=0" },
    { n: 1, label: "n=1" },
    { n: 2, label: "n=2" }
  ];

  var STYLE_TEXT = [
    ".winding-lift-lab { --wl-circle: var(--cl-blue, #315f9d); --wl-lift: var(--cl-green, #39734d); --wl-trail: var(--cl-gold, #9b6a12); --wl-current: var(--accent, #315f9d); --wl-endpoint: var(--cl-red, #b64335); --wl-muted: var(--fg-soft, #6f6a60); --wl-grid: currentColor; line-height: 1.5; }",
    "html[data-theme='dark'] .winding-lift-lab { --wl-circle: #83c8ff; --wl-lift: #72bd8b; --wl-trail: #e2b458; --wl-current: #83c8ff; --wl-endpoint: #f08c7d; --wl-muted: #b8b2a7; }",
    ".winding-lift-lab .wl-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; align-items: start; }",
    ".winding-lift-lab .wl-controls, .winding-lift-lab .wl-stage { min-width: 0; }",
    ".winding-lift-lab .wl-controls { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(190px, .7fr) minmax(190px, .7fr); gap: 12px 18px; align-items: end; }",
    ".winding-lift-lab .wl-controls > h4, .winding-lift-lab .wl-controls > .wl-control:first-of-type, .winding-lift-lab .wl-controls > .wl-note { grid-column: 1 / -1; }",
    ".winding-lift-lab .wl-controls > h4 { margin: 0; }",
    ".winding-lift-lab .wl-control { display: grid; gap: 6px; min-width: 0; }",
    ".winding-lift-lab .wl-label { color: var(--fg-soft); font-size: 13px; font-weight: 650; }",
    ".winding-lift-lab .wl-preset-buttons { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }",
    ".winding-lift-lab button { min-height: 44px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.35; cursor: pointer; }",
    ".winding-lift-lab button:hover { border-color: var(--accent); }",
    ".winding-lift-lab button[aria-pressed='true'], .winding-lift-lab .wl-primary { background: var(--accent); border-color: var(--accent); color: var(--bg); font-weight: 700; }",
    ".winding-lift-lab input[type=range] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
    ".winding-lift-lab button:focus-visible, .winding-lift-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".winding-lift-lab .wl-output { color: var(--accent); font-variant-numeric: tabular-nums; }",
    ".winding-lift-lab .wl-note, .winding-lift-lab .wl-status, .winding-lift-lab .wl-boundary { margin: 0; color: var(--wl-muted); font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".winding-lift-lab .wl-status { min-height: 1.65em; color: var(--fg); font-weight: 650; }",
    ".winding-lift-lab .wl-stage-frame { padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); overflow-x: hidden; }",
    ".winding-lift-lab .wl-svg { display: block; width: 100%; min-width: 0; height: auto; color: var(--fg); }",
    ".winding-lift-lab .wl-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".winding-lift-lab .wl-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.2; }",
    ".winding-lift-lab .wl-circle-guide { fill: none; stroke: var(--wl-circle); stroke-width: 2.6; }",
    ".winding-lift-lab .wl-circle-inner { fill: none; stroke: currentColor; stroke-opacity: .14; stroke-width: 1.2; stroke-dasharray: 3 5; }",
    ".winding-lift-lab .wl-trail { fill: none; stroke: var(--wl-trail); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; opacity: .88; }",
    ".winding-lift-lab .wl-radius { stroke: var(--wl-current); stroke-opacity: .55; stroke-width: 1.4; stroke-dasharray: 5 4; }",
    ".winding-lift-lab .wl-lift { fill: none; stroke: var(--wl-lift); stroke-width: 3.1; stroke-linecap: round; stroke-linejoin: round; }",
    ".winding-lift-lab .wl-grid { stroke: var(--wl-grid); stroke-opacity: .14; stroke-width: 1; }",
    ".winding-lift-lab .wl-zero { stroke: var(--wl-grid); stroke-opacity: .48; stroke-width: 1.35; }",
    ".winding-lift-lab .wl-axis { stroke: var(--wl-grid); stroke-opacity: .55; stroke-width: 1.25; }",
    ".winding-lift-lab .wl-current-guide { stroke: var(--wl-current); stroke-opacity: .72; stroke-width: 1.4; stroke-dasharray: 5 4; }",
    ".winding-lift-lab .wl-endpoint-guide { stroke: var(--wl-endpoint); stroke-opacity: .62; stroke-width: 1.5; stroke-dasharray: 5 4; }",
    ".winding-lift-lab .wl-base-point { fill: var(--wl-circle); stroke: var(--bg); stroke-width: 2; }",
    ".winding-lift-lab .wl-current-point { fill: var(--wl-current); stroke: var(--bg); stroke-width: 2.2; }",
    ".winding-lift-lab .wl-start-point { fill: var(--wl-lift); stroke: var(--bg); stroke-width: 2; }",
    ".winding-lift-lab .wl-endpoint { fill: var(--wl-endpoint); stroke: var(--bg); stroke-width: 2.2; }",
    ".winding-lift-lab .wl-panel-title { font-size: 15px; font-weight: 700; }",
    ".winding-lift-lab .wl-axis-label, .winding-lift-lab .wl-caption { fill: var(--wl-muted) !important; font-size: 11px; }",
    ".winding-lift-lab .wl-circle-label, .winding-lift-lab .wl-lift-label, .winding-lift-lab .wl-endpoint-label { font-size: 12px; font-weight: 700; }",
    ".winding-lift-lab .wl-circle-label { fill: var(--wl-circle) !important; }",
    ".winding-lift-lab .wl-lift-label { fill: var(--wl-lift) !important; }",
    ".winding-lift-lab .wl-endpoint-label { fill: var(--wl-endpoint) !important; }",
    ".winding-lift-lab .wl-current-label { fill: var(--wl-current) !important; font-size: 12px; font-weight: 700; }",
    ".winding-lift-lab .wl-legend { display: flex; flex-wrap: wrap; gap: 7px 14px; margin-top: 10px; color: var(--wl-muted); font-size: 12px; }",
    ".winding-lift-lab .wl-legend-item { display: inline-flex; align-items: center; gap: 5px; }",
    ".winding-lift-lab .wl-legend-line { display: inline-block; width: 25px; height: 0; border-top: 3px solid currentColor; }",
    ".winding-lift-lab .wl-legend-circle { color: var(--wl-circle); }",
    ".winding-lift-lab .wl-legend-trail { color: var(--wl-trail); border-top-width: 4px; }",
    ".winding-lift-lab .wl-legend-lift { color: var(--wl-lift); }",
    ".winding-lift-lab .wl-legend-endpoint { color: var(--wl-endpoint); }",
    ".winding-lift-lab .wl-legend-point { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: currentColor; }",
    ".winding-lift-lab .wl-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-top: 12px; }",
    ".winding-lift-lab .wl-metric { min-width: 0; padding: 9px 10px; border-top: 2px solid var(--border); background: var(--bg); }",
    ".winding-lift-lab .wl-metric span { display: block; color: var(--wl-muted); font-size: 11.5px; line-height: 1.4; }",
    ".winding-lift-lab .wl-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".winding-lift-lab .wl-formula { margin-top: 10px; padding: 10px 12px; border-left: 3px solid var(--accent); background: var(--bg); font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".winding-lift-lab .wl-boundary { margin-top: 9px; padding: 8px 10px; border-left: 3px solid var(--wl-endpoint); background: var(--bg); }",
    "@media (max-width: 860px) { .winding-lift-lab .wl-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } .winding-lift-lab .wl-controls > h4, .winding-lift-lab .wl-controls > .wl-control:first-of-type, .winding-lift-lab .wl-controls > .wl-note { grid-column: 1 / -1; } }",
    "@media (max-width: 560px) { .winding-lift-lab .wl-controls { grid-template-columns: minmax(0, 1fr); } .winding-lift-lab .wl-controls > h4, .winding-lift-lab .wl-controls > .wl-control:first-of-type, .winding-lift-lab .wl-controls > .wl-note { grid-column: auto; } .winding-lift-lab .wl-preset-buttons { grid-template-columns: repeat(2, minmax(0, 1fr)); } .winding-lift-lab .wl-stage-frame { padding: 5px; overflow-x: auto; -webkit-overflow-scrolling: touch; } .winding-lift-lab .wl-svg { width: 760px; max-width: none; } }",
    "@media (prefers-reduced-motion: reduce) { .winding-lift-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatNumber(api, value, digits) {
    if (!Number.isFinite(value)) {
      return "—";
    }
    var places = digits === undefined ? 3 : digits;
    var text = api && typeof api.format === "function"
      ? api.format(value, places)
      : value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    return text.replace(/-/g, "−");
  }

  function formatInteger(value) {
    return value < 0 ? "−" + Math.abs(value) : String(value);
  }

  function svgText(api, x, y, text, attrs) {
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
      [text]
    );
  }

  function metric(api, label) {
    var value = makeElement(api, "strong", {}, ["—"]);
    return {
      card: makeElement(api, "div", { className: "wl-metric" }, [
        makeElement(api, "span", {}, [label]),
        value
      ]),
      value: value
    };
  }

  function legendLine(api, className, label) {
    return makeElement(api, "span", { className: "wl-legend-item " + className }, [
      makeElement(api, "span", { className: "wl-legend-line", "aria-hidden": "true" }),
      label
    ]);
  }

  function legendPoint(api, className, label) {
    return makeElement(api, "span", { className: "wl-legend-item " + className }, [
      makeElement(api, "span", { className: "wl-legend-point", "aria-hidden": "true" }),
      label
    ]);
  }

  function liftValue(n, lambda, t) {
    return n * t + lambda * AMPLITUDE * Math.sin(TAU * t);
  }

  function circlePoint(cx, cy, radius, value) {
    var angle = TAU * value;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy - radius * Math.sin(angle)
    };
  }

  function pointPath(points) {
    return points
      .map(function (point, index) {
        return (index === 0 ? "M" : "L") +
          point.x.toFixed(2) + "," + point.y.toFixed(2);
      })
      .join(" ");
  }

  function projectionPath(n, lambda, end, cx, cy, radius) {
    if (end <= 0) {
      return "";
    }
    var samples = Math.max(12, Math.ceil(end * 220));
    var points = [];
    for (var i = 0; i <= samples; i += 1) {
      var t = end * i / samples;
      points.push(circlePoint(cx, cy, radius, liftValue(n, lambda, t)));
    }
    return pointPath(points);
  }

  function liftPath(n, lambda, xMap, yMap) {
    var points = [];
    for (var i = 0; i <= 240; i += 1) {
      var t = i / 240;
      points.push({ x: xMap(t), y: yMap(liftValue(n, lambda, t)) });
    }
    return pointPath(points);
  }

  function graphRange(n, lambda) {
    var wiggle = Math.abs(lambda * AMPLITUDE);
    var low = Math.min(0, n) - wiggle - 0.35;
    var high = Math.max(0, n) + wiggle + 0.35;
    if (high - low < 2.4) {
      var center = (low + high) / 2;
      low = center - 1.2;
      high = center + 1.2;
    }
    return { min: low, max: high };
  }

  function drawCircle(api, children, state) {
    var cx = 220;
    var cy = 282;
    var radius = 150;
    var currentLift = liftValue(state.n, state.lambda, state.t);
    var current = circlePoint(cx, cy, radius, currentLift);
    var base = circlePoint(cx, cy, radius, 0);

    children.push(
      makeSvg(api, "rect", {
        className: "wl-panel",
        x: 14,
        y: 14,
        width: 430,
        height: 492,
        rx: 8
      }),
      svgText(api, 32, 43, "① 圆周投影 p∘ℓ", {
        className: "wl-panel-title",
        "text-anchor": "start"
      }),
      svgText(api, 32, 64, "当前点随 t 移动；颜色轨迹是已走过的投影", {
        className: "wl-caption",
        "text-anchor": "start"
      }),
      makeSvg(api, "circle", {
        className: "wl-circle-inner",
        cx: cx,
        cy: cy,
        r: radius + 11
      }),
      makeSvg(api, "circle", {
        className: "wl-circle-guide",
        cx: cx,
        cy: cy,
        r: radius
      }),
      makeSvg(api, "line", {
        className: "wl-radius",
        x1: cx,
        y1: cy,
        x2: current.x,
        y2: current.y
      })
    );

    var trail = projectionPath(
      state.n,
      state.lambda,
      state.t,
      cx,
      cy,
      radius
    );
    if (trail) {
      children.push(makeSvg(api, "path", { className: "wl-trail", d: trail }));
    }

    children.push(
      makeSvg(api, "circle", {
        className: "wl-base-point",
        cx: base.x,
        cy: base.y,
        r: 7
      }),
      makeSvg(api, "circle", {
        className: "wl-current-point",
        cx: current.x,
        cy: current.y,
        r: 7
      }),
      svgText(api, 408, 270, "基点 1=p(0)", {
        className: "wl-circle-label",
        "text-anchor": "end"
      }),
      svgText(
        api,
        clamp(current.x + (current.x < cx ? -10 : 10), 54, 386),
        clamp(current.y + (current.y < cy ? -14 : 24), 94, 442),
        "当前 p(ℓ(t))",
        {
          className: "wl-current-label",
          "text-anchor": current.x < cx ? "end" : "start"
        }
      ),
      svgText(api, cx, 472, "p(x)=e^(2πix)；p⁻¹(1)=ℤ", {
        className: "wl-caption"
      })
    );
  }

  function drawLift(api, children, state) {
    var panel = { x: 458, y: 14, width: 608, height: 492 };
    var left = 532;
    var right = 1032;
    var top = 104;
    var bottom = 448;
    var range = graphRange(state.n, state.lambda);
    var yMap = function (value) {
      return bottom - (value - range.min) / (range.max - range.min) * (bottom - top);
    };
    var xMap = function (value) {
      return left + value * (right - left);
    };
    var currentLift = liftValue(state.n, state.lambda, state.t);
    var currentX = xMap(state.t);
    var currentY = yMap(currentLift);
    var endpointY = yMap(state.n);

    children.push(
      makeSvg(api, "rect", {
        className: "wl-panel",
        x: panel.x,
        y: panel.y,
        width: panel.width,
        height: panel.height,
        rx: 8
      }),
      svgText(api, panel.x + 20, 43, "② 实线提升 ℓ:[0,1]→ℝ", {
        className: "wl-panel-title",
        "text-anchor": "start"
      }),
      svgText(api, panel.x + 20, 64, "终点固定在整数纤维 p⁻¹(1)=ℤ", {
        className: "wl-caption",
        "text-anchor": "start"
      }),
      svgText(api, right, 86, "整数层", {
        className: "wl-caption",
        "text-anchor": "end"
      })
    );

    var firstInteger = Math.ceil(range.min);
    var lastInteger = Math.floor(range.max);
    for (var integer = firstInteger; integer <= lastInteger; integer += 1) {
      var gridY = yMap(integer);
      children.push(
        makeSvg(api, "line", {
          className: integer === 0 ? "wl-zero" : "wl-grid",
          x1: left,
          y1: gridY,
          x2: right,
          y2: gridY
        }),
        svgText(api, left - 11, gridY + 4, formatInteger(integer), {
          className: "wl-axis-label",
          "text-anchor": "end"
        })
      );
    }

    [0, 0.5, 1].forEach(function (value) {
      var x = xMap(value);
      children.push(
        makeSvg(api, "line", {
          className: "wl-grid",
          x1: x,
          y1: top,
          x2: x,
          y2: bottom
        }),
        svgText(api, x, bottom + 22, formatNumber(null, value, 1), {
          className: "wl-axis-label"
        })
      );
    });

    children.push(
      makeSvg(api, "line", {
        className: "wl-axis",
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom
      }),
      makeSvg(api, "line", {
        className: "wl-axis",
        x1: left,
        y1: top,
        x2: left,
        y2: bottom
      }),
      makeSvg(api, "path", {
        className: "wl-lift",
        d: liftPath(state.n, state.lambda, xMap, yMap)
      }),
      makeSvg(api, "line", {
        className: "wl-current-guide",
        x1: currentX,
        y1: top,
        x2: currentX,
        y2: bottom
      }),
      makeSvg(api, "line", {
        className: "wl-endpoint-guide",
        x1: right,
        y1: top,
        x2: right,
        y2: endpointY
      }),
      makeSvg(api, "circle", {
        className: "wl-start-point",
        cx: xMap(0),
        cy: yMap(0),
        r: 6
      }),
      makeSvg(api, "circle", {
        className: "wl-current-point",
        cx: currentX,
        cy: currentY,
        r: 7
      }),
      makeSvg(api, "circle", {
        className: "wl-endpoint",
        cx: right,
        cy: endpointY,
        r: 7
      }),
      svgText(api, left + 5, yMap(0) - 11, "ℓ(0)=0", {
        className: "wl-lift-label",
        "text-anchor": "start"
      }),
      svgText(api, right - 8, endpointY - 12, "ℓ(1)=" + formatInteger(state.n), {
        className: "wl-endpoint-label",
        "text-anchor": "end"
      }),
      svgText(
        api,
        currentX > right - 112 ? currentX - 10 : currentX + 10,
        clamp(currentY - 12, top + 18, bottom - 18),
        "当前 ℓ(t)",
        {
          className: "wl-current-label",
          "text-anchor": currentX > right - 112 ? "end" : "start"
        }
      ),
      svgText(api, (left + right) / 2, 488, "进度 t", {
        className: "wl-caption"
      }),
      svgText(api, left - 58, top + 12, "提升值", {
        className: "wl-caption",
        "text-anchor": "start"
      })
    );
  }

  function drawScene(api, svg, state, ids) {
    clear(svg);
    var currentLift = liftValue(state.n, state.lambda, state.t);
    var projected = {
      x: Math.cos(TAU * currentLift),
      y: Math.sin(TAU * currentLift)
    };
    var children = [
      makeSvg(api, "title", { id: ids.plotTitle }, [
        "Winding-lift：绕数 " + formatInteger(state.n) +
          "，形变 λ=" + formatNumber(api, state.lambda, 2) +
          "，进度 t=" + formatNumber(api, state.t, 2)
      ]),
      makeSvg(api, "desc", { id: ids.plotDesc }, [
        "左图为覆盖映射 p(x)=e^(2πix) 的圆周投影，右图为从 0 出发的实线提升。当前点同步显示；改变形变时终点仍为整数 n。"
      ])
    ];
    drawCircle(api, children, state);
    drawLift(api, children, state);
    appendChildren(svg, children);
    svg.setAttribute(
      "aria-label",
      "绕数 " + formatInteger(state.n) +
        "；当前提升值 " + formatNumber(api, currentLift, 3) +
        "；投影坐标 (" + formatNumber(api, projected.x, 3) +
        ", " + formatNumber(api, projected.y, 3) + ")；终点提升值 " +
        formatInteger(state.n)
    );
  }

  function buildLab(root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }

    INSTANCE += 1;
    var instanceId = "winding-lift-" + INSTANCE;
    var ids = {
      controlsTitle: instanceId + "-controls-title",
      plotTitle: instanceId + "-plot-title",
      plotDesc: instanceId + "-plot-desc",
      status: instanceId + "-status",
      lambda: instanceId + "-lambda",
      progress: instanceId + "-progress"
    };
    var state = {
      n: DEFAULT_STATE.n,
      lambda: DEFAULT_STATE.lambda,
      t: DEFAULT_STATE.t
    };
    var refs = { presetButtons: [] };

    clear(root);
    root.classList.add("winding-lift-lab");
    var style = document.createElement("style");
    style.textContent = STYLE_TEXT;
    root.appendChild(style);

    var heading = makeElement(api, "h3", {}, [
      "Winding-lift：把圆周的回路抬到实线"
    ]);
    var intro = makeElement(api, "p", { className: "wl-note" }, [
      "固定覆盖映射 p(x)=e^(2πix) 与提升起点 ℓ(0)=0。选择离散绕数 n，调节可消去的回摆 λ，再拖动进度 t；双图和数值账本会同时更新。"
    ]);

    var presetGroup = makeElement(api, "div", {
      className: "wl-preset-buttons",
      role: "group",
      "aria-label": "选择离散绕数预设"
    });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, "button", {
        type: "button",
        "aria-pressed": preset.n === state.n ? "true" : "false",
        "aria-label": "选择绕数 " + formatInteger(preset.n)
      }, [preset.label]);
      button.addEventListener("click", function () {
        state.n = preset.n;
        update();
        announce("已选择绕数 n=" + formatInteger(state.n) +
          "；终点提升值保持为 " + formatInteger(state.n));
      });
      refs.presetButtons.push({ n: preset.n, button: button });
      presetGroup.appendChild(button);
    });

    var lambdaOutput = makeElement(api, "output", {
      htmlFor: ids.lambda,
      className: "wl-output"
    }, [formatNumber(api, state.lambda, 2)]);
    var lambdaLabel = makeElement(api, "label", { htmlFor: ids.lambda }, [
      "形变 λ（固定端点回摆） = ",
      lambdaOutput
    ]);
    var lambdaInput = makeElement(api, "input", {
      id: ids.lambda,
      type: "range",
      min: "0",
      max: "1.8",
      step: "0.05",
      value: String(state.lambda),
      "aria-label": "形变 λ，固定端点回摆幅度",
      "aria-describedby": ids.status
    });

    var progressOutput = makeElement(api, "output", {
      htmlFor: ids.progress,
      className: "wl-output"
    }, [formatNumber(api, state.t, 2)]);
    var progressLabel = makeElement(api, "label", { htmlFor: ids.progress }, [
      "移动进度 t = ",
      progressOutput
    ]);
    var progressInput = makeElement(api, "input", {
      id: ids.progress,
      type: "range",
      min: "0",
      max: "1",
      step: "0.01",
      value: String(state.t),
      "aria-label": "路径移动进度 t",
      "aria-describedby": ids.status
    });

    var resetButton = makeElement(api, "button", {
      type: "button",
      className: "wl-primary",
      "aria-label": "恢复默认绕数、形变和进度"
    }, ["重置"]);
    resetButton.addEventListener("click", function () {
      state.n = DEFAULT_STATE.n;
      state.lambda = DEFAULT_STATE.lambda;
      state.t = DEFAULT_STATE.t;
      update();
      announce("已重置：n=1，λ=0.65，t=0.5；端点提升值为 1");
    });

    var controls = makeElement(api, "section", {
      className: "wl-controls",
      "aria-labelledby": ids.controlsTitle
    }, [
      makeElement(api, "h4", { id: ids.controlsTitle }, ["操作台"]),
      makeElement(api, "div", { className: "wl-control" }, [
        makeElement(api, "span", { className: "wl-label" }, ["离散绕数 n（含负、零、正）"]),
        presetGroup
      ]),
      makeElement(api, "div", { className: "wl-control" }, [
        lambdaLabel,
        lambdaInput
      ]),
      makeElement(api, "div", { className: "wl-control" }, [
        progressLabel,
        progressInput
      ]),
      resetButton,
      makeElement(api, "p", { className: "wl-note" }, [
        "所有曲线由同一条确定性公式采样；重复点击、拖动或切换预设只会重绘当前 SVG，不累积图形节点。"
      ])
    ]);

    var svg = makeSvg(api, "svg", {
      className: "wl-svg",
      viewBox: "0 0 1080 520",
      role: "img",
      "aria-labelledby": ids.plotTitle + " " + ids.plotDesc
    });
    var stageTitle = makeElement(api, "div", { className: "cl-stage-title" }, [
      makeElement(api, "span", {}, ["双图对照"]),
      makeElement(api, "span", { className: "wl-output" }, [
        "左：投影　右：提升与端点"
      ])
    ]);
    var legend = makeElement(api, "div", {
      className: "wl-legend",
      "aria-label": "图例"
    }, [
      legendLine(api, "wl-legend-circle", "圆周 S¹"),
      legendLine(api, "wl-legend-trail", "投影已走轨迹"),
      legendLine(api, "wl-legend-lift", "实线提升 ℓ"),
      legendPoint(api, "wl-legend-endpoint", "端点 ℓ(1)=n")
    ]);

    var nMetric = metric(api, "绕数 n");
    var lambdaMetric = metric(api, "形变 λ");
    var tMetric = metric(api, "当前进度 t");
    var liftMetric = metric(api, "当前提升 ℓ(t)");
    var projectionMetric = metric(api, "投影 p(ℓ(t))");
    var endpointMetric = metric(api, "端点 ℓ(1)");
    var metrics = makeElement(api, "div", {
      className: "wl-metrics",
      "aria-label": "数值账本"
    }, [
      nMetric.card,
      lambdaMetric.card,
      tMetric.card,
      liftMetric.card,
      projectionMetric.card,
      endpointMetric.card
    ]);
    refs.nMetric = nMetric.value;
    refs.lambdaMetric = lambdaMetric.value;
    refs.tMetric = tMetric.value;
    refs.liftMetric = liftMetric.value;
    refs.projectionMetric = projectionMetric.value;
    refs.endpointMetric = endpointMetric.value;

    var formula = makeElement(api, "div", {
      className: "wl-formula",
      "aria-label": "当前提升公式"
    }, []);
    var status = makeElement(api, "p", {
      className: "wl-status",
      id: ids.status,
      role: "status",
      "aria-live": "polite"
    }, []);
    var boundary = makeElement(api, "p", { className: "wl-boundary" }, []);
    refs.lambdaOutput = lambdaOutput;
    refs.progressOutput = progressOutput;
    refs.lambdaInput = lambdaInput;
    refs.progressInput = progressInput;
    refs.formula = formula;
    refs.status = status;
    refs.boundary = boundary;
    refs.svg = svg;

    var stage = makeElement(api, "section", {
      className: "wl-stage",
      "aria-label": "覆盖映射与路径提升双图"
    }, [
      stageTitle,
      makeElement(api, "div", { className: "wl-stage-frame" }, [svg]),
      legend,
      metrics,
      formula,
      status,
      boundary
    ]);
    var layout = makeElement(api, "div", { className: "wl-layout" }, [
      controls,
      stage
    ]);
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(layout);

    function announce(message) {
      if (api && typeof api.announce === "function") {
        api.announce(root, message);
      }
    }

    function update() {
      var currentLift = liftValue(state.n, state.lambda, state.t);
      var projection = {
        x: Math.cos(TAU * currentLift),
        y: Math.sin(TAU * currentLift)
      };
      refs.lambdaOutput.textContent = formatNumber(api, state.lambda, 2);
      refs.progressOutput.textContent = formatNumber(api, state.t, 2);
      refs.lambdaInput.value = String(state.lambda);
      refs.progressInput.value = String(state.t);
      refs.lambdaInput.setAttribute(
        "aria-valuetext",
        "形变 λ=" + formatNumber(api, state.lambda, 2)
      );
      refs.progressInput.setAttribute(
        "aria-valuetext",
        "进度 t=" + formatNumber(api, state.t, 2)
      );
      refs.nMetric.textContent = formatInteger(state.n);
      refs.lambdaMetric.textContent = formatNumber(api, state.lambda, 2);
      refs.tMetric.textContent = formatNumber(api, state.t, 2);
      refs.liftMetric.textContent = formatNumber(api, currentLift, 3);
      refs.projectionMetric.textContent =
        "(" + formatNumber(api, projection.x, 3) + ", " +
        formatNumber(api, projection.y, 3) + ")";
      refs.endpointMetric.textContent = formatInteger(state.n);
      refs.formula.textContent =
        "ℓ(t) = " + formatInteger(state.n) + "·t + " +
        formatNumber(api, state.lambda, 2) +
        "·sin(2πt)（a=1）；p(ℓ(t))=(cos(2πℓ(t)), sin(2πℓ(t)))";
      refs.status.textContent =
        "当前 t=" + formatNumber(api, state.t, 2) +
        "，ℓ(t)=" + formatNumber(api, currentLift, 3) +
        "，p(ℓ(t))=(" + formatNumber(api, projection.x, 3) + ", " +
        formatNumber(api, projection.y, 3) + ")。" +
        (Math.abs(state.t - 1) < 0.0001
          ? " 已到终点：ℓ(1)=" + formatInteger(state.n) + "。"
          : " 拖到 t=1 可检查整数终点。");
      refs.boundary.textContent =
        "端点/基点条件：ℓ(0)=0，p(0)=1；ℓ(1)=" +
        formatInteger(state.n) + "∈p⁻¹(1)=ℤ，且 p(ℓ(1))=1。" +
        " 改变 λ 只改变中间路径，不改变这个终点账本。";
      refs.presetButtons.forEach(function (item) {
        item.button.setAttribute(
          "aria-pressed",
          item.n === state.n ? "true" : "false"
        );
      });
      drawScene(api, refs.svg, state, ids);
    }

    lambdaInput.addEventListener("input", function () {
      var value = Number(lambdaInput.value);
      state.lambda = clamp(Number.isFinite(value) ? value : 0, 0, 1.8);
      update();
    });
    lambdaInput.addEventListener("change", function () {
      announce("形变 λ=" + formatNumber(api, state.lambda, 2) +
        "；端点仍为 " + formatInteger(state.n));
    });
    progressInput.addEventListener("input", function () {
      var value = Number(progressInput.value);
      state.t = clamp(Number.isFinite(value) ? value : 0, 0, 1);
      update();
    });
    progressInput.addEventListener("change", function () {
      announce("进度 t=" + formatNumber(api, state.t, 2) +
        "；当前提升值为 " +
        formatNumber(api, liftValue(state.n, state.lambda, state.t), 3));
    });

    update();
  }

  window.CourseLearning.register("winding-lift", buildLab);
}());
