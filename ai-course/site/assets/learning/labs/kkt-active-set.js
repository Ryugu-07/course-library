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
  var EPS = 1e-9;
  var ACTIVE_EPS = 1e-7;
  var DOMAIN_MIN = -1.5;
  var DOMAIN_MAX = 6.5;
  var CONSTRAINT_LABELS = ["x=0", "y=0", "x+y=R"];

  var STYLE_TEXT = [
    ".kkt-active-set-lab { --kkt-feasible: var(--cl-green, #39734d); --kkt-boundary: var(--cl-gold, #9b6a12); --kkt-target: var(--cl-red, #b64335); --kkt-optimum: var(--cl-blue, #315f9d); --kkt-gradient: var(--cl-red, #b64335); --kkt-balance: #7546a8; --kkt-muted: var(--fg-soft, #6f6a60); line-height: 1.5; min-width: 0; }",
    "html[data-theme=\"dark\"] .kkt-active-set-lab { --kkt-feasible: #72bd8b; --kkt-boundary: #e2b458; --kkt-target: #f08c7d; --kkt-optimum: #83c8ff; --kkt-gradient: #f08c7d; --kkt-balance: #c5a1ff; --kkt-muted: #b8b2a7; }",
    ".kkt-active-set-lab *, .kkt-active-set-lab *::before, .kkt-active-set-lab *::after { box-sizing: border-box; }",
    ".kkt-active-set-lab .kkt-layout { display: grid; grid-template-columns: minmax(210px, .72fr) minmax(0, 1.28fr); gap: 18px; align-items: start; }",
    ".kkt-active-set-lab .kkt-controls, .kkt-active-set-lab .kkt-stage { min-width: 0; }",
    ".kkt-active-set-lab .kkt-controls { display: grid; gap: 12px; }",
    ".kkt-active-set-lab .kkt-controls h4 { margin: 0; }",
    ".kkt-active-set-lab .kkt-control { display: grid; gap: 5px; min-width: 0; }",
    ".kkt-active-set-lab .kkt-label { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; color: var(--fg-soft); font-size: 13px; font-weight: 650; }",
    ".kkt-active-set-lab .kkt-output { color: var(--accent); font-variant-numeric: tabular-nums; white-space: nowrap; }",
    ".kkt-active-set-lab .kkt-preset-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }",
    ".kkt-active-set-lab button { min-height: 44px; min-width: 0; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.3; cursor: pointer; overflow-wrap: anywhere; }",
    ".kkt-active-set-lab button:hover { border-color: var(--accent); }",
    ".kkt-active-set-lab button[aria-pressed=\"true\"], .kkt-active-set-lab .kkt-primary { background: var(--accent); border-color: var(--accent); color: var(--bg); font-weight: 700; }",
    ".kkt-active-set-lab input[type=\"range\"] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
    ".kkt-active-set-lab button:focus-visible, .kkt-active-set-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".kkt-active-set-lab .kkt-note, .kkt-active-set-lab .kkt-boundary-note { margin: 0; color: var(--kkt-muted); font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".kkt-active-set-lab .kkt-stage-title { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; color: var(--kkt-muted); font-size: 13px; }",
    ".kkt-active-set-lab .kkt-stage-frame { max-width: 100%; padding: 7px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); overflow: hidden; }",
    ".kkt-active-set-lab .kkt-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--fg); }",
    ".kkt-active-set-lab .kkt-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".kkt-active-set-lab .kkt-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.2; }",
    ".kkt-active-set-lab .kkt-grid { fill: none; stroke: currentColor; stroke-opacity: .13; stroke-width: 1; }",
    ".kkt-active-set-lab .kkt-axis { fill: none; stroke: currentColor; stroke-opacity: .58; stroke-width: 1.35; }",
    ".kkt-active-set-lab .kkt-axis-label { fill: var(--kkt-muted) !important; font-size: 11px; }",
    ".kkt-active-set-lab .kkt-panel-title { fill: currentColor !important; font-size: 14px; font-weight: 700; }",
    ".kkt-active-set-lab .kkt-contour { fill: none; stroke: var(--kkt-boundary); stroke-width: 1.15; opacity: .42; }",
    ".kkt-active-set-lab .kkt-feasible-region { fill: var(--kkt-feasible); fill-opacity: .12; stroke: var(--kkt-feasible); stroke-width: 1.5; }",
    ".kkt-active-set-lab .kkt-edge { fill: none; stroke-linecap: round; stroke-linejoin: round; }",
    ".kkt-active-set-lab .kkt-edge-active { stroke: var(--kkt-boundary); stroke-width: 4.2; }",
    ".kkt-active-set-lab .kkt-edge-inactive { stroke: var(--kkt-muted); stroke-width: 1.35; stroke-dasharray: 4 4; opacity: .72; }",
    ".kkt-active-set-lab .kkt-edge-label { fill: var(--kkt-boundary) !important; font-size: 11px; font-weight: 700; }",
    ".kkt-active-set-lab .kkt-q-link { fill: none; stroke: var(--kkt-target); stroke-width: 1.25; stroke-dasharray: 4 4; opacity: .72; }",
    ".kkt-active-set-lab .kkt-target-point { fill: var(--kkt-target); stroke: var(--bg); stroke-width: 2; }",
    ".kkt-active-set-lab .kkt-optimum-point { fill: var(--kkt-optimum); stroke: var(--bg); stroke-width: 2.2; }",
    ".kkt-active-set-lab .kkt-target-label { fill: var(--kkt-target) !important; font-size: 11.5px; font-weight: 700; }",
    ".kkt-active-set-lab .kkt-optimum-label { fill: var(--kkt-optimum) !important; font-size: 11.5px; font-weight: 700; }",
    ".kkt-active-set-lab .kkt-gradient-vector { fill: none; stroke: var(--kkt-gradient); stroke-width: 2.5; stroke-linecap: round; }",
    ".kkt-active-set-lab .kkt-balance-vector { fill: none; stroke: var(--kkt-balance); stroke-width: 2.5; stroke-linecap: round; }",
    ".kkt-active-set-lab .kkt-gradient-head { fill: var(--kkt-gradient); }",
    ".kkt-active-set-lab .kkt-balance-head { fill: var(--kkt-balance); }",
    ".kkt-active-set-lab .kkt-vector-label { fill: var(--kkt-gradient) !important; font-size: 11px; font-weight: 700; }",
    ".kkt-active-set-lab .kkt-inset-title { fill: currentColor !important; font-size: 13px; font-weight: 700; }",
    ".kkt-active-set-lab .kkt-inset-copy { fill: var(--kkt-muted) !important; font-size: 10.5px; }",
    ".kkt-active-set-lab .kkt-inset-zero { fill: var(--kkt-balance) !important; font-size: 11px; font-weight: 700; }",
    ".kkt-active-set-lab .kkt-legend { display: flex; flex-wrap: wrap; gap: 7px 14px; margin-top: 10px; color: var(--kkt-muted); font-size: 12px; }",
    ".kkt-active-set-lab .kkt-legend-item { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }",
    ".kkt-active-set-lab .kkt-legend-line { display: inline-block; width: 25px; height: 0; border-top: 3px solid currentColor; flex: 0 0 auto; }",
    ".kkt-active-set-lab .kkt-swatch-contour { color: var(--kkt-boundary); border-top-width: 1px; opacity: .75; }",
    ".kkt-active-set-lab .kkt-swatch-feasible { color: var(--kkt-feasible); }",
    ".kkt-active-set-lab .kkt-swatch-active { color: var(--kkt-boundary); border-top-width: 4px; }",
    ".kkt-active-set-lab .kkt-swatch-target { color: var(--kkt-target); border-top-style: dashed; }",
    ".kkt-active-set-lab .kkt-swatch-gradient { color: var(--kkt-gradient); }",
    ".kkt-active-set-lab .kkt-legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; }",
    ".kkt-active-set-lab .kkt-dot-target { background: var(--kkt-target); }",
    ".kkt-active-set-lab .kkt-dot-optimum { background: var(--kkt-optimum); }",
    ".kkt-active-set-lab .kkt-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 8px; margin-top: 12px; }",
    ".kkt-active-set-lab .kkt-metric { min-width: 0; padding: 9px 10px; border-top: 2px solid var(--border); background: var(--bg); }",
    ".kkt-active-set-lab .kkt-metric span { display: block; color: var(--kkt-muted); font-size: 11.5px; line-height: 1.4; }",
    ".kkt-active-set-lab .kkt-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".kkt-active-set-lab .kkt-table-wrap { max-width: 100%; margin-top: 12px; overflow-x: auto; }",
    ".kkt-active-set-lab .kkt-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12.5px; }",
    ".kkt-active-set-lab .kkt-table th, .kkt-active-set-lab .kkt-table td { padding: 7px 6px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; overflow-wrap: anywhere; }",
    ".kkt-active-set-lab .kkt-table th { color: var(--kkt-muted); font-size: 11.5px; font-weight: 650; }",
    ".kkt-active-set-lab .kkt-table td:nth-child(2), .kkt-active-set-lab .kkt-table td:nth-child(3) { font-variant-numeric: tabular-nums; }",
    ".kkt-active-set-lab .kkt-row-active td:first-child { color: var(--kkt-boundary); font-weight: 700; }",
    ".kkt-active-set-lab .kkt-row-state-active { color: var(--kkt-boundary); font-weight: 700; }",
    ".kkt-active-set-lab .kkt-row-state-slack { color: var(--kkt-muted); }",
    ".kkt-active-set-lab .kkt-checklist { display: grid; gap: 7px; margin: 12px 0 0; padding: 0; list-style: none; }",
    ".kkt-active-set-lab .kkt-checklist li { display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 7px; align-items: start; }",
    ".kkt-active-set-lab .kkt-check-mark { display: inline-block; font-weight: 800; text-align: center; }",
    ".kkt-active-set-lab .kkt-pass { color: var(--kkt-feasible); }",
    ".kkt-active-set-lab .kkt-fail { color: var(--kkt-target); }",
    ".kkt-active-set-lab .kkt-check-detail { min-width: 0; overflow-wrap: anywhere; }",
    ".kkt-active-set-lab .kkt-formula { margin-top: 12px; padding: 10px 12px; border-left: 3px solid var(--accent); background: var(--bg); color: var(--fg); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: 12.5px; line-height: 1.65; overflow-x: auto; }",
    ".kkt-active-set-lab .kkt-status { min-height: 1.65em; margin: 10px 0 0; color: var(--fg); font-size: 13px; font-weight: 650; overflow-wrap: anywhere; }",
    ".kkt-active-set-lab .kkt-boundary-note { margin-top: 8px; padding: 8px 10px; border-left: 3px solid var(--kkt-boundary); background: var(--bg); }",
    "@media (max-width: 700px) { .kkt-active-set-lab .kkt-layout { grid-template-columns: minmax(0, 1fr); } .kkt-active-set-lab .kkt-preset-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .kkt-active-set-lab .kkt-stage-frame { padding: 4px; } .kkt-active-set-lab .kkt-table { font-size: 12px; } .kkt-active-set-lab .kkt-table th, .kkt-active-set-lab .kkt-table td { padding: 6px 4px; } }",
    "@media (prefers-reduced-motion: reduce) { .kkt-active-set-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function makeElement(api, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(document.createElement(tag), attrs || {}), children);
  }

  function makeSvg(api, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(
      setAttributes(document.createElementNS(SVG_NS, tag), attrs || {}),
      children
    );
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function formatNumber(api, value, digits) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) < 0.0005) value = 0;
    var places = digits === undefined ? 3 : digits;
    if (api && typeof api.format === "function") return api.format(value, places);
    var text = value.toFixed(places);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function svgText(api, x, y, text, attrs) {
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
    return makeSvg(api, "text", merged, [text]);
  }

  function formatPoint(api, x, y) {
    return "(" + formatNumber(api, x, 2) + ", " + formatNumber(api, y, 2) + ")";
  }

  function objective(a, b, x, y) {
    var dx = x - a;
    var dy = y - b;
    return 0.5 * (dx * dx + dy * dy);
  }

  function isFeasible(x, y, R) {
    return x >= -ACTIVE_EPS && y >= -ACTIVE_EPS && x + y <= R + ACTIVE_EPS;
  }

  function addCandidate(candidates, a, b, x, y, source) {
    candidates.push({
      x: x,
      y: y,
      source: source,
      value: objective(a, b, x, y)
    });
  }

  function snapPoint(x, y, R) {
    if (Math.abs(x) < ACTIVE_EPS) x = 0;
    if (Math.abs(y) < ACTIVE_EPS) y = 0;
    if (Math.abs(x - R) < ACTIVE_EPS) x = R;
    if (Math.abs(y - R) < ACTIVE_EPS) y = R;
    if (Math.abs(x + y - R) < ACTIVE_EPS) y = R - x;
    return { x: clamp(x, 0, R), y: clamp(y, 0, R) };
  }

  function projectToTriangle(a, b, R) {
    var candidates = [];
    if (isFeasible(a, b, R)) addCandidate(candidates, a, b, a, b, "interior");
    addCandidate(candidates, a, b, 0, clamp(b, 0, R), "x-edge");
    addCandidate(candidates, a, b, clamp(a, 0, R), 0, "y-edge");

    var resourceX = clamp((a - b + R) / 2, 0, R);
    addCandidate(candidates, a, b, resourceX, R - resourceX, "resource-edge");
    addCandidate(candidates, a, b, 0, 0, "origin");
    addCandidate(candidates, a, b, R, 0, "right-corner");
    addCandidate(candidates, a, b, 0, R, "upper-corner");

    var best = candidates[0];
    candidates.forEach(function (candidate) {
      if (candidate.value < best.value - EPS) best = candidate;
    });
    var point = snapPoint(best.x, best.y, R);
    return {
      x: point.x,
      y: point.y,
      source: best.source,
      value: objective(a, b, point.x, point.y)
    };
  }

  function computeMultipliers(point, a, b, R) {
    var x = point.x;
    var y = point.y;
    var atX = Math.abs(x) <= ACTIVE_EPS;
    var atY = Math.abs(y) <= ACTIVE_EPS;
    var atR = Math.abs(x + y - R) <= ACTIVE_EPS;
    var lambdaX = 0;
    var lambdaY = 0;
    var lambdaR = 0;

    if (atX && atR) {
      lambdaR = Math.max(0, b - R);
      lambdaX = Math.max(0, lambdaR - a);
    } else if (atY && atR) {
      lambdaR = Math.max(0, a - R);
      lambdaY = Math.max(0, lambdaR - b);
    } else if (atX && atY) {
      lambdaX = Math.max(0, -a);
      lambdaY = Math.max(0, -b);
    } else if (atR) {
      lambdaR = Math.max(0, ((a - x) + (b - y)) / 2);
    } else if (atX) {
      lambdaX = Math.max(0, x - a);
    } else if (atY) {
      lambdaY = Math.max(0, y - b);
    }

    return { x: lambdaX, y: lambdaY, R: lambdaR };
  }

  function solve(a, b, R) {
    var point = projectToTriangle(a, b, R);
    var g = [-point.x, -point.y, point.x + point.y - R];
    var active = [
      Math.abs(g[0]) <= ACTIVE_EPS,
      Math.abs(g[1]) <= ACTIVE_EPS,
      Math.abs(g[2]) <= ACTIVE_EPS
    ];
    var lambda = computeMultipliers(point, a, b, R);
    var gradient = { x: point.x - a, y: point.y - b };
    var stationarity = {
      x: gradient.x - lambda.x + lambda.R,
      y: gradient.y - lambda.y + lambda.R
    };
    var stationarityResidual = Math.sqrt(
      stationarity.x * stationarity.x + stationarity.y * stationarity.y
    );
    var primalViolation = Math.max(0, g[0], g[1], g[2]);
    var dualViolation = Math.max(0, -lambda.x, -lambda.y, -lambda.R);
    var complementaryResidual = Math.max(
      Math.abs(lambda.x * g[0]),
      Math.abs(lambda.y * g[1]),
      Math.abs(lambda.R * g[2])
    );
    var activeLabels = [];
    var positiveLabels = [];
    [lambda.x, lambda.y, lambda.R].forEach(function (value, index) {
      if (active[index]) activeLabels.push(CONSTRAINT_LABELS[index]);
      if (value > ACTIVE_EPS) positiveLabels.push("λ" + (index === 0 ? "x" : index === 1 ? "y" : "R"));
    });

    return {
      a: a,
      b: b,
      R: R,
      point: point,
      value: point.value,
      g: g,
      active: active,
      activeLabels: activeLabels,
      positiveLabels: positiveLabels,
      lambda: lambda,
      gradient: gradient,
      stationarity: stationarity,
      primalViolation: primalViolation,
      dualViolation: dualViolation,
      stationarityResidual: stationarityResidual,
      complementaryResidual: complementaryResidual,
      okay: Math.max(
        primalViolation,
        dualViolation,
        stationarityResidual,
        complementaryResidual
      ) <= 1e-7
    };
  }

  var PRESETS = [
    { id: "interior", label: "内点", a: 1.2, b: 0.8, R: 3, description: "目标在三角形内部" },
    { id: "resource", label: "资源边", a: 2.2, b: 1.8, R: 3, description: "投影到 x+y=R" },
    { id: "left-edge", label: "左边", a: -0.8, b: 1.1, R: 3, description: "投影到 x=0" },
    { id: "touching", label: "边界零价", a: 1.2, b: 1.8, R: 3, description: "目标恰在资源边" },
    { id: "origin", label: "原点角点", a: -0.8, b: -0.4, R: 3, description: "投影到 (0,0)" },
    { id: "right-corner", label: "右下角", a: 4.1, b: -0.6, R: 3, description: "投影到 (R,0)" },
    { id: "upper-corner", label: "左上角", a: -0.6, b: 4, R: 3, description: "投影到 (0,R)" }
  ];

  function getPreset(id) {
    for (var i = 0; i < PRESETS.length; i += 1) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return PRESETS[0];
  }

  function makeMapper(box) {
    return {
      sx: function (x) {
        return box.left + (x - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN) * (box.right - box.left);
      },
      sy: function (y) {
        return box.bottom - (y - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN) * (box.bottom - box.top);
      }
    };
  }

  function drawGrid(api, children, box, mapper) {
    var ticks = [-1, 0, 2, 4, 6];
    ticks.forEach(function (tick) {
      var x = mapper.sx(tick);
      var y = mapper.sy(tick);
      children.push(
        makeSvg(api, "line", {
          className: "kkt-grid",
          x1: x,
          y1: box.top,
          x2: x,
          y2: box.bottom
        }),
        makeSvg(api, "line", {
          className: "kkt-grid",
          x1: box.left,
          y1: y,
          x2: box.right,
          y2: y
        }),
        svgText(api, x, box.bottom + 17, formatNumber(api, tick, 0), {
          className: "kkt-axis-label"
        }),
        svgText(api, box.left - 8, y + 4, formatNumber(api, tick, 0), {
          className: "kkt-axis-label",
          "text-anchor": "end"
        })
      );
    });

    children.push(
      makeSvg(api, "line", {
        className: "kkt-axis",
        x1: box.left,
        y1: mapper.sy(0),
        x2: box.right,
        y2: mapper.sy(0)
      }),
      makeSvg(api, "line", {
        className: "kkt-axis",
        x1: mapper.sx(0),
        y1: box.top,
        x2: mapper.sx(0),
        y2: box.bottom
      }),
      svgText(api, box.right, box.bottom + 33, "x", {
        className: "kkt-axis-label",
        "text-anchor": "end"
      }),
      svgText(api, box.left - 8, box.top - 9, "y", {
        className: "kkt-axis-label",
        "text-anchor": "end"
      })
    );
  }

  function addLine(api, children, mapper, x1, y1, x2, y2, className, extra) {
    var attrs = {
      className: className,
      x1: mapper.sx(x1),
      y1: mapper.sy(y1),
      x2: mapper.sx(x2),
      y2: mapper.sy(y2)
    };
    Object.keys(extra || {}).forEach(function (key) {
      attrs[key] = extra[key];
    });
    children.push(makeSvg(api, "line", attrs));
  }

  function drawEdges(api, children, mapper, result) {
    var R = result.R;
    addLine(api, children, mapper, 0, 0, 0, R,
      "kkt-edge " + (result.active[0] ? "kkt-edge-active" : "kkt-edge-inactive"));
    addLine(api, children, mapper, 0, 0, R, 0,
      "kkt-edge " + (result.active[1] ? "kkt-edge-active" : "kkt-edge-inactive"));
    addLine(api, children, mapper, 0, R, R, 0,
      "kkt-edge " + (result.active[2] ? "kkt-edge-active" : "kkt-edge-inactive"));

    children.push(
      svgText(api, mapper.sx(-0.17), mapper.sy(R * 0.52), "x=0", {
        className: "kkt-edge-label",
        "text-anchor": "end"
      }),
      svgText(api, mapper.sx(R * 0.53), mapper.sy(-0.2), "y=0", {
        className: "kkt-edge-label"
      }),
      svgText(api, mapper.sx(R * 0.63), mapper.sy(R * 0.37 - 0.2), "x+y=R", {
        className: "kkt-edge-label"
      })
    );
  }

  function addArrowMarker(api, id, headClass) {
    return makeSvg(api, "marker", {
      id: id,
      viewBox: "0 0 10 10",
      refX: "8",
      refY: "5",
      markerWidth: "6",
      markerHeight: "6",
      markerUnits: "userSpaceOnUse",
      orient: "auto"
    }, [
      makeSvg(api, "path", {
        className: headClass,
        d: "M 0 0 L 10 5 L 0 10 z"
      })
    ]);
  }

  function drawPlotVector(api, children, mapper, result, markerId) {
    var norm = Math.sqrt(
      result.gradient.x * result.gradient.x + result.gradient.y * result.gradient.y
    );
    var x = mapper.sx(result.point.x);
    var y = mapper.sy(result.point.y);
    if (norm <= EPS) {
      children.push(
        svgText(api, x + 24, y - 12, "∇f=0", {
          className: "kkt-vector-label",
          "text-anchor": "start"
        })
      );
      return;
    }
    var length = 34;
    var endX = x + result.gradient.x / norm * length;
    var endY = y - result.gradient.y / norm * length;
    children.push(
      makeSvg(api, "line", {
        className: "kkt-gradient-vector",
        x1: x,
        y1: y,
        x2: endX,
        y2: endY,
        "marker-end": "url(#" + markerId + ")"
      }),
      svgText(api, endX + 4, endY - 5, "∇f", {
        className: "kkt-vector-label",
        "text-anchor": "start"
      })
    );
  }

  function drawInset(api, children, result, markerGradient, markerBalance) {
    var x0 = 388;
    var baseX = 458;
    var baseY = 148;
    var norm = Math.sqrt(
      result.gradient.x * result.gradient.x + result.gradient.y * result.gradient.y
    );
    children.push(
      makeSvg(api, "rect", {
        className: "kkt-panel",
        x: x0,
        y: 10,
        width: 142,
        height: 380,
        rx: 7
      }),
      svgText(api, x0 + 12, 34, "stationarity", {
        className: "kkt-inset-title",
        "text-anchor": "start"
      }),
      svgText(api, x0 + 12, 53, "∇f + Σλᵢ∇gᵢ = 0", {
        className: "kkt-inset-copy",
        "text-anchor": "start"
      }),
      svgText(api, x0 + 12, 70, "红：∇f；紫：−∇f", {
        className: "kkt-inset-copy",
        "text-anchor": "start"
      })
    );

    if (norm <= EPS) {
      children.push(
        makeSvg(api, "circle", {
          className: "kkt-optimum-point",
          cx: baseX,
          cy: baseY,
          r: 6
        }),
        svgText(api, baseX, baseY + 27, "∇f=0，λ=0", {
          className: "kkt-inset-zero"
        })
      );
    } else {
      var length = 36;
      var dx = result.gradient.x / norm * length;
      var dy = -result.gradient.y / norm * length;
      children.push(
        makeSvg(api, "line", {
          className: "kkt-gradient-vector",
          x1: baseX,
          y1: baseY,
          x2: baseX + dx,
          y2: baseY + dy,
          "marker-end": "url(#" + markerGradient + ")"
        }),
        makeSvg(api, "line", {
          className: "kkt-balance-vector",
          x1: baseX,
          y1: baseY,
          x2: baseX - dx,
          y2: baseY - dy,
          "marker-end": "url(#" + markerBalance + ")"
        }),
        svgText(api, baseX + dx + 3, baseY + dy - 5, "∇f", {
          className: "kkt-vector-label",
          "text-anchor": "start"
        }),
        svgText(api, baseX - dx - 3, baseY - dy + 13, "−∇f", {
          className: "kkt-inset-zero",
          "text-anchor": "end"
        })
      );
    }

    children.push(
      svgText(api, x0 + 12, 225, "∇f = (" +
        formatNumber(null, result.gradient.x, 2) + ", " +
        formatNumber(null, result.gradient.y, 2) + ")", {
        className: "kkt-inset-copy",
        "text-anchor": "start"
      }),
      svgText(api, x0 + 12, 243, "Σλ∇g = (" +
        formatNumber(null, -result.gradient.x, 2) + ", " +
        formatNumber(null, -result.gradient.y, 2) + ")", {
        className: "kkt-inset-copy",
        "text-anchor": "start"
      }),
      svgText(api, x0 + 12, 261, "residual = " +
        formatNumber(null, result.stationarityResidual, 3), {
        className: "kkt-inset-copy",
        "text-anchor": "start"
      }),
      svgText(api, x0 + 12, 296, "粗边：活动约束", {
        className: "kkt-inset-copy",
        "text-anchor": "start"
      }),
      svgText(api, x0 + 12, 315, "红点：无约束目标", {
        className: "kkt-inset-copy",
        "text-anchor": "start"
      }),
      svgText(api, x0 + 12, 334, "蓝点：唯一最优点", {
        className: "kkt-inset-copy",
        "text-anchor": "start"
      }),
      svgText(api, x0 + 12, 365, "R=" + formatNumber(null, result.R, 1), {
        className: "kkt-inset-title",
        "text-anchor": "start"
      })
    );
  }

  function drawScene(api, svg, result, ids) {
    clear(svg);
    var plot = { left: 44, right: 362, top: 48, bottom: 366 };
    var mapper = makeMapper(plot);
    var scale = (plot.right - plot.left) / (DOMAIN_MAX - DOMAIN_MIN);
    var children = [
      makeSvg(api, "defs", {}, [
        makeSvg(api, "clipPath", { id: ids.clip }, [
          makeSvg(api, "rect", {
            x: plot.left,
            y: plot.top,
            width: plot.right - plot.left,
            height: plot.bottom - plot.top
          })
        ]),
        addArrowMarker(api, ids.gradientMarker, "kkt-gradient-head"),
        addArrowMarker(api, ids.balanceMarker, "kkt-balance-head")
      ]),
      makeSvg(api, "title", { id: ids.title }, [
        "KKT 活动集实验：目标点" + formatPoint(api, result.a, result.b) +
          "，资源 R=" + formatNumber(api, result.R, 1) +
          "，最优点" + formatPoint(api, result.point.x, result.point.y)
      ]),
      makeSvg(api, "desc", { id: ids.desc }, [
        "图中显示二维二次目标的等高线、x 大于等于零、y 大于等于零、x 加 y 小于等于 R 的可行三角形、无约束目标、唯一最优点、活动边和 stationarity 向量。"
      ]),
      makeSvg(api, "rect", {
        className: "kkt-panel",
        x: 10,
        y: 10,
        width: 370,
        height: 380,
        rx: 7
      }),
      svgText(api, 24, 34, "投影几何：等高线与活动边", {
        className: "kkt-panel-title",
        "text-anchor": "start"
      })
    ];

    drawGrid(api, children, plot, mapper);
    var clipped = makeSvg(api, "g", { "clip-path": "url(#" + ids.clip + ")" }, []);
    var radii = [0.55, 0.9, 1.3, 1.8, 2.4, 3.2, 4.2, 5.4, 6.8];
    radii.forEach(function (radius) {
      clipped.appendChild(makeSvg(api, "circle", {
        className: "kkt-contour",
        cx: mapper.sx(result.a),
        cy: mapper.sy(result.b),
        r: radius * scale
      }));
    });
    clipped.appendChild(makeSvg(api, "polygon", {
      className: "kkt-feasible-region",
      points: [
        mapper.sx(0) + "," + mapper.sy(0),
        mapper.sx(result.R) + "," + mapper.sy(0),
        mapper.sx(0) + "," + mapper.sy(result.R)
      ].join(" ")
    }));
    addLine(api, [clipped], mapper, result.a, result.b, result.point.x, result.point.y, "kkt-q-link");
    children.push(clipped);
    drawEdges(api, children, mapper, result);
    drawPlotVector(api, children, mapper, result, ids.gradientMarker);

    children.push(
      makeSvg(api, "circle", {
        className: "kkt-target-point",
        cx: mapper.sx(result.a),
        cy: mapper.sy(result.b),
        r: 5.5
      }),
      svgText(api, mapper.sx(result.a) + 8, mapper.sy(result.b) - 9, "q=" +
        formatPoint(api, result.a, result.b), {
        className: "kkt-target-label",
        "text-anchor": "start"
      }),
      makeSvg(api, "circle", {
        className: "kkt-optimum-point",
        cx: mapper.sx(result.point.x),
        cy: mapper.sy(result.point.y),
        r: 6.5
      }),
      svgText(api, mapper.sx(result.point.x) + 9, mapper.sy(result.point.y) + 17, "z*=" +
        formatPoint(api, result.point.x, result.point.y), {
        className: "kkt-optimum-label",
        "text-anchor": "start"
      })
    );
    drawInset(api, children, result, ids.gradientMarker, ids.balanceMarker);
    appendChildren(svg, children);
    svg.setAttribute(
      "aria-label",
      "目标点" + formatPoint(api, result.a, result.b) +
        "，最优点" + formatPoint(api, result.point.x, result.point.y) +
        "，活动集" + (result.activeLabels.length ? result.activeLabels.join("、") : "为空")
    );
  }

  function makeMetric(api, label) {
    var value = makeElement(api, "strong", {}, ["—"]);
    return {
      card: makeElement(api, "div", { className: "kkt-metric" }, [
        makeElement(api, "span", {}, [label]),
        value
      ]),
      value: value
    };
  }

  function makeLegendItem(api, lineClass, label) {
    return makeElement(api, "span", { className: "kkt-legend-item" }, [
      makeElement(api, "span", {
        className: "kkt-legend-line " + lineClass,
        "aria-hidden": "true"
      }),
      label
    ]);
  }

  function makeDotLegendItem(api, dotClass, label) {
    return makeElement(api, "span", { className: "kkt-legend-item" }, [
      makeElement(api, "span", {
        className: "kkt-legend-dot " + dotClass,
        "aria-hidden": "true"
      }),
      label
    ]);
  }

  function makeCheckItem(api, label) {
    var mark = makeElement(api, "span", {
      className: "kkt-check-mark kkt-pass",
      "aria-hidden": "true"
    }, ["✓"]);
    var detail = makeElement(api, "span", { className: "kkt-check-detail" }, [label]);
    return {
      item: makeElement(api, "li", {}, [mark, detail]),
      mark: mark,
      detail: detail
    };
  }

  function setCheck(ref, good, detail) {
    ref.mark.textContent = good ? "✓" : "!";
    ref.mark.className = "kkt-check-mark " + (good ? "kkt-pass" : "kkt-fail");
    ref.mark.setAttribute("aria-label", good ? "通过" : "需检查");
    ref.detail.textContent = detail;
  }

  function makeSlider(api, id, label, value, min, max, step, statusId) {
    var output = makeElement(api, "output", {
      className: "kkt-output",
      htmlFor: id
    }, [formatNumber(null, value, 1)]);
    var input = makeElement(api, "input", {
      id: id,
      type: "range",
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(value),
      "aria-label": label,
      "aria-describedby": statusId
    });
    return {
      input: input,
      output: output,
      node: makeElement(api, "div", { className: "kkt-control" }, [
        makeElement(api, "label", { className: "kkt-label", htmlFor: id }, [
          label,
          output
        ]),
        input
      ])
    };
  }

  function buildLab(root, api) {
    if (!root || typeof document === "undefined") return;

    INSTANCE += 1;
    var instanceId = "kkt-active-set-" + INSTANCE;
    var ids = {
      title: instanceId + "-plot-title",
      desc: instanceId + "-plot-desc",
      controls: instanceId + "-controls",
      status: instanceId + "-status",
      a: instanceId + "-a",
      b: instanceId + "-b",
      R: instanceId + "-R",
      clip: instanceId + "-clip",
      gradientMarker: instanceId + "-gradient-marker",
      balanceMarker: instanceId + "-balance-marker"
    };
    var first = getPreset("interior");
    var state = { presetId: first.id, a: first.a, b: first.b, R: first.R };
    var refs = { presetButtons: [], rows: [], checks: [] };

    clear(root);
    root.classList.add("kkt-active-set-lab");
    var style = document.createElement("style");
    style.textContent = STYLE_TEXT;
    root.appendChild(style);

    var heading = makeElement(api, "h3", {}, [
      "KKT 活动集：把目标点投影回可行三角形"
    ]);
    var intro = makeElement(api, "p", { className: "kkt-note" }, [
      "目标是 f(x,y)=½((x−a)²+(y−b)²)，约束为 x≥0、y≥0、x+y≤R。所有结果由有限候选投影和精确乘子公式确定；没有随机初始化或迭代误差。"
    ]);

    var presetGroup = makeElement(api, "div", {
      className: "kkt-preset-grid",
      role: "group",
      "aria-label": "选择目标点和资源预设"
    });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, "button", {
        type: "button",
        "aria-pressed": preset.id === state.presetId ? "true" : "false",
        "aria-label": "选择" + preset.description + "，目标点" +
          formatPoint(null, preset.a, preset.b) + "，资源 R=" + preset.R
      }, [preset.label]);
      button.addEventListener("click", function () {
        state.presetId = preset.id;
        state.a = preset.a;
        state.b = preset.b;
        state.R = preset.R;
        setInputs();
        update();
        announce(api, root, "已切换到" + preset.description + "，目标点" +
          formatPoint(api, state.a, state.b) + "，资源 R=" + formatNumber(api, state.R, 1));
      });
      refs.presetButtons.push({ id: preset.id, button: button });
      presetGroup.appendChild(button);
    });

    var controls = makeElement(api, "section", {
      className: "kkt-controls",
      "aria-labelledby": ids.controls
    }, [
      makeElement(api, "h4", { id: ids.controls }, ["操作台"]),
      makeElement(api, "div", { className: "kkt-control" }, [
        makeElement(api, "span", { className: "kkt-label" }, ["预设"]),
        presetGroup
      ])
    ]);

    var sliderA = makeSlider(api, ids.a, "目标 a", state.a, -1.5, 6.5, 0.1, ids.status);
    var sliderB = makeSlider(api, ids.b, "目标 b", state.b, -1.5, 6.5, 0.1, ids.status);
    var sliderR = makeSlider(api, ids.R, "资源 R", state.R, 1, 6, 0.1, ids.status);
    refs.sliderA = sliderA;
    refs.sliderB = sliderB;
    refs.sliderR = sliderR;
    controls.appendChild(sliderA.node);
    controls.appendChild(sliderB.node);
    controls.appendChild(sliderR.node);

    var reset = makeElement(api, "button", {
      type: "button",
      className: "kkt-primary"
    }, ["恢复当前预设"]);
    reset.addEventListener("click", function () {
      var preset = getPreset(state.presetId);
      state.a = preset.a;
      state.b = preset.b;
      state.R = preset.R;
      setInputs();
      update();
      announce(api, root, "已恢复" + preset.label + "预设");
    });
    controls.appendChild(reset);
    controls.appendChild(makeElement(api, "p", { className: "kkt-note" }, [
      "滑块支持 Tab 聚焦和方向键微调；粗边只表示约束等号成立，乘子表会另外显示哪些边真正提供法向量平衡。"
    ]));

    var svg = makeSvg(api, "svg", {
      className: "kkt-svg",
      viewBox: "0 0 540 400",
      role: "img",
      "aria-labelledby": ids.title + " " + ids.desc
    });
    var stageTitle = makeElement(api, "div", { className: "kkt-stage-title" }, [
      makeElement(api, "span", {}, ["确定性几何与 KKT 账本"]),
      makeElement(api, "span", { className: "kkt-output" }, ["严格凸"])
    ]);
    var legend = makeElement(api, "div", { className: "kkt-legend", "aria-label": "图例" }, [
      makeLegendItem(api, "kkt-swatch-contour", "等高线"),
      makeLegendItem(api, "kkt-swatch-feasible", "可行域"),
      makeLegendItem(api, "kkt-swatch-active", "活动边"),
      makeDotLegendItem(api, "kkt-dot-target", "目标 q"),
      makeDotLegendItem(api, "kkt-dot-optimum", "最优 z*"),
      makeLegendItem(api, "kkt-swatch-gradient", "∇f")
    ]);

    var targetMetric = makeMetric(api, "目标 q");
    var optimumMetric = makeMetric(api, "最优 z*");
    var valueMetric = makeMetric(api, "目标值 f(z*)");
    var activeMetric = makeMetric(api, "活动集");
    var metrics = makeElement(api, "div", { className: "kkt-metrics" }, [
      targetMetric.card,
      optimumMetric.card,
      valueMetric.card,
      activeMetric.card
    ]);
    refs.targetMetric = targetMetric.value;
    refs.optimumMetric = optimumMetric.value;
    refs.valueMetric = valueMetric.value;
    refs.activeMetric = activeMetric.value;

    var tableBody = makeElement(api, "tbody", {}, []);
    [
      "g₁=−x（x≥0）",
      "g₂=−y（y≥0）",
      "g₃=x+y−R（x+y≤R）"
    ].forEach(function (label) {
      var stateCell = makeElement(api, "td", { className: "kkt-row-state-slack" }, ["—"]);
      var row = makeElement(api, "tr", {}, [
        makeElement(api, "td", {}, [label]),
        makeElement(api, "td", {}, ["—"]),
        makeElement(api, "td", {}, ["—"]),
        stateCell
      ]);
      refs.rows.push({
        row: row,
        value: row.children[1],
        lambda: row.children[2],
        state: stateCell
      });
      tableBody.appendChild(row);
    });
    var table = makeElement(api, "table", { className: "kkt-table" }, [
      makeElement(api, "thead", {}, [
        makeElement(api, "tr", {}, [
          makeElement(api, "th", {}, ["约束"]),
          makeElement(api, "th", {}, ["gᵢ(z*)"]),
          makeElement(api, "th", {}, ["乘子 λᵢ"]),
          makeElement(api, "th", {}, ["状态"])
        ])
      ]),
      tableBody
    ]);

    var primal = makeCheckItem(api, "primal feasibility：—");
    var dual = makeCheckItem(api, "dual feasibility：—");
    var stationarity = makeCheckItem(api, "stationarity residual：—");
    var complementary = makeCheckItem(api, "complementary slackness：—");
    refs.checks = [primal, dual, stationarity, complementary];
    var checklist = makeElement(api, "ul", { className: "kkt-checklist" }, [
      primal.item,
      dual.item,
      stationarity.item,
      complementary.item
    ]);
    var formula = makeElement(api, "div", { className: "kkt-formula" }, []);
    var status = makeElement(api, "p", {
      className: "kkt-status",
      id: ids.status,
      "aria-live": "polite"
    }, []);
    var boundary = makeElement(api, "p", { className: "kkt-boundary-note" }, []);
    refs.formula = formula;
    refs.status = status;
    refs.boundary = boundary;
    var stage = makeElement(api, "section", {
      className: "kkt-stage",
      "aria-label": "KKT 活动集几何和残差"
    }, [
      stageTitle,
      makeElement(api, "div", { className: "kkt-stage-frame" }, [svg]),
      legend,
      metrics,
      makeElement(api, "div", { className: "kkt-table-wrap" }, [table]),
      checklist,
      formula,
      status,
      boundary
    ]);

    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(makeElement(api, "div", { className: "kkt-layout" }, [
      controls,
      stage
    ]));

    function setInputs() {
      sliderA.input.value = String(state.a);
      sliderB.input.value = String(state.b);
      sliderR.input.value = String(state.R);
    }

    function update() {
      var result = solve(state.a, state.b, state.R);
      sliderA.output.textContent = formatNumber(api, state.a, 1);
      sliderB.output.textContent = formatNumber(api, state.b, 1);
      sliderR.output.textContent = formatNumber(api, state.R, 1);
      refs.presetButtons.forEach(function (item) {
        item.button.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false");
      });
      refs.targetMetric.textContent = formatPoint(api, state.a, state.b);
      refs.optimumMetric.textContent = formatPoint(api, result.point.x, result.point.y);
      refs.valueMetric.textContent = formatNumber(api, result.value, 3);
      refs.activeMetric.textContent = result.activeLabels.length
        ? result.activeLabels.join("、")
        : "∅（内点）";

      result.g.forEach(function (value, index) {
        refs.rows[index].row.className = result.active[index] ? "kkt-row-active" : "";
        refs.rows[index].value.textContent = formatNumber(api, value, 3);
        refs.rows[index].lambda.textContent = formatNumber(
          api,
          index === 0 ? result.lambda.x : index === 1 ? result.lambda.y : result.lambda.R,
          3
        );
        refs.rows[index].state.textContent = result.active[index] ? "活动 / 紧" : "松弛";
        refs.rows[index].state.className = result.active[index]
          ? "kkt-row-state-active"
          : "kkt-row-state-slack";
      });

      setCheck(primal, result.primalViolation <= 1e-7,
        "primal feasibility：max(0,gᵢ)=" + formatNumber(api, result.primalViolation, 3));
      setCheck(dual, result.dualViolation <= 1e-7,
        "dual feasibility：违背量=" + formatNumber(api, result.dualViolation, 3));
      setCheck(stationarity, result.stationarityResidual <= 1e-7,
        "stationarity residual：‖∇f+Σλᵢ∇gᵢ‖₂=" +
          formatNumber(api, result.stationarityResidual, 3));
      setCheck(complementary, result.complementaryResidual <= 1e-7,
        "complementary slackness：max|λᵢgᵢ|=" +
          formatNumber(api, result.complementaryResidual, 3));

      refs.formula.textContent =
        "g=(−x,−y,x+y−R)，∇f+Σλᵢ∇gᵢ=0；z*=" +
        formatPoint(api, result.point.x, result.point.y) +
        "，λ=(" + formatNumber(api, result.lambda.x, 3) + ", " +
        formatNumber(api, result.lambda.y, 3) + ", " +
        formatNumber(api, result.lambda.R, 3) + ")";
      refs.status.textContent =
        "KKT " + (result.okay ? "通过" : "需检查") + "：目标 q=" +
        formatPoint(api, state.a, state.b) + "，最优 z*=" +
        formatPoint(api, result.point.x, result.point.y) + "；活动集 " +
        (result.activeLabels.length ? result.activeLabels.join("、") : "为空") +
        "；正乘子 " + (result.positiveLabels.length ? result.positiveLabels.join("、") : "无") + "。";
      if (!result.activeLabels.length) {
        refs.boundary.textContent =
          "内点情形：∇f(z*)=0，所有约束松弛，乘子全为零。";
      } else if (result.activeLabels.length >= 2) {
        refs.boundary.textContent =
          "角点情形：至少两条边同时紧；法锥中的多个法向量共同平衡目标梯度。活动边不自动意味着对应乘子为正。";
      } else {
        refs.boundary.textContent =
          "边界情形：粗边表示等式约束成立；若目标点恰在边上，该活动边的乘子仍可以是零。";
      }
      drawScene(api, svg, result, ids);
    }

    sliderA.input.addEventListener("input", function () {
      state.presetId = "";
      state.a = clamp(Number(sliderA.input.value), -1.5, 6.5);
      update();
    });
    sliderB.input.addEventListener("input", function () {
      state.presetId = "";
      state.b = clamp(Number(sliderB.input.value), -1.5, 6.5);
      update();
    });
    sliderR.input.addEventListener("input", function () {
      state.presetId = "";
      state.R = clamp(Number(sliderR.input.value), 1, 6);
      update();
    });
    sliderA.input.addEventListener("change", function () {
      announce(api, root, "目标 a=" + formatNumber(api, state.a, 1));
    });
    sliderB.input.addEventListener("change", function () {
      announce(api, root, "目标 b=" + formatNumber(api, state.b, 1));
    });
    sliderR.input.addEventListener("change", function () {
      announce(api, root, "资源 R=" + formatNumber(api, state.R, 1));
    });

    setInputs();
    update();
  }

  window.CourseLearning.register("kkt-active-set", buildLab);
}());
