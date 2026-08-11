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
  var DIRECTION_STEPS = 1440;
  var ANGLE_STEP = 360 / DIRECTION_STEPS;
  var EPS = 1e-9;
  var X_MIN = -4.5;
  var X_MAX = 4.5;
  var Y_MIN = -4.5;
  var Y_MAX = 4.5;
  var VIEW = { width: 560, height: 420, left: 52, right: 18, top: 24, bottom: 48 };
  var INSTANCE = 0;

  var DATA = [
    { id: "P1", x: 2, y: 2, label: "+1" },
    { id: "P2", x: 2, y: 3, label: "+1" },
    { id: "P3", x: 3, y: 2, label: "+1" },
    { id: "N1", x: -2, y: -2, label: "-1" },
    { id: "N2", x: -2, y: -3, label: "-1" },
    { id: "N3", x: -3, y: -2, label: "-1" }
  ];

  var LABEL_OFFSETS = {
    P1: [8, -10],
    P2: [8, -10],
    P3: [8, 18],
    N1: [8, 18],
    N2: [8, -10],
    N3: [-58, 18]
  };

  var STYLE_TEXT = [
    ".svm-margin-lab { --svm-green: #39734d; --svm-red: #b64335; --svm-gold: #9b6a12; line-height: 1.5; }",
    'html[data-theme="dark"] .svm-margin-lab { --svm-green: #72bd8b; --svm-red: #f08c7d; --svm-gold: #e2b458; }',
    ".svm-margin-lab .svm-margin-layout { display: grid; grid-template-columns: minmax(165px, .72fr) minmax(0, 1.28fr); gap: 18px; align-items: start; }",
    ".svm-margin-lab .svm-margin-controls, .svm-margin-lab .svm-margin-stage { min-width: 0; }",
    ".svm-margin-lab .svm-margin-controls { display: grid; gap: 14px; }",
    ".svm-margin-lab .svm-margin-control { display: grid; gap: 5px; }",
    ".svm-margin-lab .svm-margin-control-label { display: flex; justify-content: space-between; gap: 8px; color: var(--fg-soft); font-size: 13px; font-weight: 650; }",
    ".svm-margin-lab .svm-margin-control output { color: var(--accent); font-variant-numeric: tabular-nums; white-space: nowrap; }",
    ".svm-margin-lab input[type=\"range\"] { width: 100%; min-height: 44px; accent-color: var(--accent); }",
    ".svm-margin-lab button { min-height: 44px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; cursor: pointer; }",
    ".svm-margin-lab button:hover { border-color: var(--accent); }",
    ".svm-margin-lab button:focus-visible, .svm-margin-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".svm-margin-lab .svm-margin-search { border-color: var(--accent); background: var(--accent); color: var(--bg); font-weight: 700; }",
    ".svm-margin-lab .svm-margin-button-row { display: flex; flex-wrap: wrap; gap: 8px; }",
    ".svm-margin-lab .svm-margin-button-row > * { flex: 1 1 150px; }",
    ".svm-margin-lab .svm-margin-note, .svm-margin-lab .svm-margin-search-info { margin: 0; color: var(--fg-soft); font-size: 13px; overflow-wrap: anywhere; }",
    ".svm-margin-lab .svm-margin-search-info { padding-left: 10px; border-left: 3px solid var(--svm-gold); }",
    ".svm-margin-lab .svm-margin-plot { display: block; width: 100%; max-width: 100%; height: auto; color: var(--fg); }",
    ".svm-margin-lab .svm-margin-plot text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".svm-margin-lab .svm-margin-grid { stroke: currentColor; stroke-opacity: .12; stroke-width: 1; }",
    ".svm-margin-lab .svm-margin-axis { stroke: currentColor; stroke-opacity: .48; stroke-width: 1.2; }",
    ".svm-margin-lab .svm-margin-boundary { stroke: var(--accent); stroke-width: 2.5; }",
    ".svm-margin-lab .svm-margin-rail { stroke: var(--svm-gold); stroke-width: 1.8; stroke-dasharray: 7 5; }",
    ".svm-margin-lab .svm-margin-positive { fill: var(--svm-green); }",
    ".svm-margin-lab .svm-margin-negative { fill: var(--svm-red); }",
    ".svm-margin-lab .svm-margin-point { stroke: var(--bg); stroke-width: 1.5; }",
    ".svm-margin-lab .svm-margin-point.svm-margin-support { stroke: var(--svm-gold); stroke-width: 3; }",
    ".svm-margin-lab .svm-margin-point-label { font-size: 10.5px; }",
    ".svm-margin-lab .svm-margin-legend { display: flex; flex-wrap: wrap; gap: 7px 14px; margin-top: 4px; color: var(--fg-soft); font-size: 12.5px; }",
    ".svm-margin-lab .svm-margin-legend-item { display: inline-flex; align-items: center; gap: 5px; }",
    ".svm-margin-lab .svm-margin-legend-line { display: inline-block; width: 22px; border-top: 2px solid currentColor; }",
    ".svm-margin-lab .svm-margin-legend-line.svm-margin-legend-rail { border-top-style: dashed; border-top-color: var(--svm-gold); }",
    ".svm-margin-lab .svm-margin-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }",
    ".svm-margin-lab .svm-margin-dot.svm-margin-dot-positive { background: var(--svm-green); }",
    ".svm-margin-lab .svm-margin-dot.svm-margin-dot-negative { background: var(--svm-red); }",
    ".svm-margin-lab .svm-margin-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 12px; border-top: 1px solid var(--border); }",
    ".svm-margin-lab .svm-margin-metric { min-width: 0; padding: 9px 0; border-bottom: 1px solid var(--border); }",
    ".svm-margin-lab .svm-margin-metric span { display: block; color: var(--fg-soft); font-size: 11.5px; }",
    ".svm-margin-lab .svm-margin-metric strong { display: block; margin-top: 2px; color: var(--fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".svm-margin-lab .svm-margin-formula { margin-top: 13px; padding-left: 10px; border-left: 3px solid var(--accent); color: var(--fg-soft); font-size: 13px; overflow-wrap: anywhere; }",
    ".svm-margin-lab .svm-margin-points { margin-top: 16px; }",
    ".svm-margin-lab .svm-margin-points h4 { margin: 0 0 7px; }",
    ".svm-margin-lab .svm-margin-point-head, .svm-margin-lab .svm-margin-point-row { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(88px, auto) minmax(76px, auto); gap: 8px; align-items: baseline; padding: 5px 0; border-bottom: 1px solid var(--border); font-size: 12.5px; }",
    ".svm-margin-lab .svm-margin-point-head { color: var(--fg-soft); font-size: 11.5px; }",
    ".svm-margin-lab .svm-margin-point-row > span:nth-child(2), .svm-margin-lab .svm-margin-point-row > span:nth-child(3) { font-variant-numeric: tabular-nums; text-align: right; }",
    ".svm-margin-lab .svm-margin-role-support { color: var(--svm-gold); font-weight: 700; }",
    ".svm-margin-lab .svm-margin-role-nearest { color: var(--accent); }",
    ".svm-margin-lab .svm-margin-role-violation { color: var(--svm-red); font-weight: 700; }",
    "@media (max-width: 700px) {",
    "  .svm-margin-lab .svm-margin-layout { grid-template-columns: minmax(0, 1fr); }",
    "  .svm-margin-lab .svm-margin-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }",
    "  .svm-margin-lab .svm-margin-point-head { display: none; }",
    "  .svm-margin-lab .svm-margin-point-row { grid-template-columns: minmax(0, 1fr) auto; gap: 6px 10px; }",
    "  .svm-margin-lab .svm-margin-point-row > span:nth-child(2) { grid-column: 2; grid-row: 1; }",
    "  .svm-margin-lab .svm-margin-point-row > span:nth-child(3) { grid-column: 1 / -1; grid-row: 2; text-align: left; }",
    "}"
  ].join("\n");

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
      } else if (value === true) {
        node.setAttribute(key, "");
      } else {
        node.setAttribute(key, String(value));
      }
    });
    return node;
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
      node.appendChild(
        child && child.nodeType
          ? child
          : document.createTextNode(String(child))
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

  function clear(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function formatNumber(api, value, digits) {
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    if (!Number.isFinite(value)) {
      return "-";
    }
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function signedNumber(api, value, digits) {
    var text = formatNumber(api, value, digits);
    return value >= 0 ? "+" + text : text;
  }

  function svgText(api, x, y, text, attrs) {
    var merged = Object.assign(
      { x: x, y: y, "font-size": "12", "text-anchor": "middle", fill: "currentColor" },
      attrs || {}
    );
    return makeSvg(api, "text", merged, [text]);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function angleDistance(a, b) {
    var distance = Math.abs(a - b) % 360;
    return Math.min(distance, 360 - distance);
  }

  function enumerateBest() {
    var best = null;
    var index;
    for (index = 0; index < DIRECTION_STEPS; index += 1) {
      var theta = index * ANGLE_STEP;
      var radians = theta * Math.PI / 180;
      var nx = Math.cos(radians);
      var ny = Math.sin(radians);
      var positiveMin = Infinity;
      var negativeMax = -Infinity;
      DATA.forEach(function (point) {
        var projection = nx * point.x + ny * point.y;
        if (point.label === "+1") {
          positiveMin = Math.min(positiveMin, projection);
        } else {
          negativeMax = Math.max(negativeMax, projection);
        }
      });
      var gap = positiveMin - negativeMax;
      if (gap <= 0) {
        continue;
      }
      var halfGap = gap / 2;
      if (
        best === null ||
        halfGap > best.halfGap + EPS ||
        (Math.abs(halfGap - best.halfGap) <= EPS && index < best.index)
      ) {
        var threshold = (positiveMin + negativeMax) / 2;
        best = {
          index: index,
          theta: theta,
          nx: nx,
          ny: ny,
          positiveMin: positiveMin,
          negativeMax: negativeMax,
          threshold: threshold,
          b: -threshold,
          gap: gap,
          halfGap: halfGap
        };
      }
    }
    return best;
  }

  var BEST = enumerateBest();

  function evaluate(theta, b) {
    var radians = theta * Math.PI / 180;
    var nx = Math.cos(radians);
    var ny = Math.sin(radians);
    var norm = Math.hypot(nx, ny);
    var points = DATA.map(function (point) {
      var signed = point.label === "+1"
        ? nx * point.x + ny * point.y + b
        : -(nx * point.x + ny * point.y + b);
      return {
        id: point.id,
        x: point.x,
        y: point.y,
        label: point.label,
        signed: signed
      };
    });
    var minSigned = Math.min.apply(Math, points.map(function (point) {
      return point.signed;
    }));
    var allCorrect = points.every(function (point) {
      return point.signed > EPS;
    });
    var isOptimal =
      allCorrect &&
      angleDistance(theta, BEST.theta) <= EPS &&
      Math.abs(b - BEST.b) <= EPS;
    points.forEach(function (point) {
      point.isNearest = Math.abs(point.signed - minSigned) <= 1e-8;
    });
    return {
      theta: theta,
      b: b,
      nx: nx,
      ny: ny,
      norm: norm,
      points: points,
      minSigned: minSigned,
      minGeometry: minSigned / norm,
      allCorrect: allCorrect,
      isOptimal: isOptimal
    };
  }

  function lineSegment(nx, ny, b, level) {
    var points = [];

    function addPoint(x, y) {
      var i;
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      if (
        x < X_MIN - 1e-7 || x > X_MAX + 1e-7 ||
        y < Y_MIN - 1e-7 || y > Y_MAX + 1e-7
      ) {
        return;
      }
      x = clamp(x, X_MIN, X_MAX);
      y = clamp(y, Y_MIN, Y_MAX);
      for (i = 0; i < points.length; i += 1) {
        if (Math.hypot(points[i].x - x, points[i].y - y) < 1e-7) {
          return;
        }
      }
      points.push({ x: x, y: y });
    }

    if (Math.abs(ny) > 1e-10) {
      addPoint(X_MIN, (level - b - nx * X_MIN) / ny);
      addPoint(X_MAX, (level - b - nx * X_MAX) / ny);
    }
    if (Math.abs(nx) > 1e-10) {
      addPoint((level - b - ny * Y_MIN) / nx, Y_MIN);
      addPoint((level - b - ny * Y_MAX) / nx, Y_MAX);
    }
    if (points.length < 2) {
      return null;
    }

    var longest = -1;
    var first = 0;
    var second = 1;
    var i;
    var j;
    for (i = 0; i < points.length; i += 1) {
      for (j = i + 1; j < points.length; j += 1) {
        var distance = Math.hypot(
          points[i].x - points[j].x,
          points[i].y - points[j].y
        );
        if (distance > longest) {
          longest = distance;
          first = i;
          second = j;
        }
      }
    }
    return [points[first], points[second]];
  }

  function sx(x) {
    return VIEW.left + (x - X_MIN) / (X_MAX - X_MIN) *
      (VIEW.width - VIEW.left - VIEW.right);
  }

  function sy(y) {
    return VIEW.top + (Y_MAX - y) / (Y_MAX - Y_MIN) *
      (VIEW.height - VIEW.top - VIEW.bottom);
  }

  function drawPlot(api, svg, result, titleId, descId) {
    clear(svg);
    var children = [
      makeSvg(api, "title", { id: titleId }, [
        "SVM 二维最大间隔实验"
      ]),
      makeSvg(api, "desc", { id: descId }, [
        "固定六个二维点；图中显示当前分界线、两条间隔线、每个点的 signed margin，以及正负类别。"
      ])
    ];
    var tick;
    for (tick = -4; tick <= 4; tick += 2) {
      children.push(
        makeSvg(api, "line", {
          className: "svm-margin-grid",
          x1: sx(tick),
          y1: sy(Y_MIN),
          x2: sx(tick),
          y2: sy(Y_MAX)
        }),
        makeSvg(api, "line", {
          className: "svm-margin-grid",
          x1: sx(X_MIN),
          y1: sy(tick),
          x2: sx(X_MAX),
          y2: sy(tick)
        }),
        svgText(api, sx(tick), sy(Y_MIN) + 20, String(tick), { "font-size": "11" }),
        svgText(api, sx(X_MIN) - 14, sy(tick) + 4, String(tick), {
          "font-size": "11",
          "text-anchor": "end"
        })
      );
    }
    children.push(
      makeSvg(api, "line", {
        className: "svm-margin-axis",
        x1: sx(X_MIN),
        y1: sy(0),
        x2: sx(X_MAX),
        y2: sy(0)
      }),
      makeSvg(api, "line", {
        className: "svm-margin-axis",
        x1: sx(0),
        y1: sy(Y_MIN),
        x2: sx(0),
        y2: sy(Y_MAX)
      }),
      svgText(api, sx(X_MAX) - 4, sy(0) - 8, "x₁", {
        "text-anchor": "end",
        "font-size": "12"
      }),
      svgText(api, sx(0) + 9, sy(Y_MAX) + 12, "x₂", {
        "text-anchor": "start",
        "font-size": "12"
      })
    );

    function addModelLine(level, className) {
      var segment = lineSegment(result.nx, result.ny, result.b, level);
      if (!segment) {
        return;
      }
      children.push(
        makeSvg(api, "line", {
          className: className,
          x1: sx(segment[0].x),
          y1: sy(segment[0].y),
          x2: sx(segment[1].x),
          y2: sy(segment[1].y)
        })
      );
    }

    var railLevel = result.allCorrect ? Math.abs(result.minSigned) : 1;
    addModelLine(-railLevel, "svm-margin-rail");
    addModelLine(railLevel, "svm-margin-rail");
    addModelLine(0, "svm-margin-boundary");

    DATA.forEach(function (dataPoint, index) {
      var point = result.points[index];
      var offset = LABEL_OFFSETS[dataPoint.id] || [8, -8];
      var pointClass = dataPoint.label === "+1"
        ? "svm-margin-positive"
        : "svm-margin-negative";
      if (result.isOptimal && point.isNearest) {
        pointClass += " svm-margin-support";
      }
      children.push(
        makeSvg(api, "circle", {
          className: "svm-margin-point " + pointClass,
          cx: sx(dataPoint.x),
          cy: sy(dataPoint.y),
          r: result.isOptimal && point.isNearest ? 8 : 6
        }),
        svgText(
          api,
          sx(dataPoint.x) + offset[0],
          sy(dataPoint.y) + offset[1],
          dataPoint.id + " m=" + signedNumber(api, point.signed, 2),
          {
            className: "svm-margin-point-label",
            "text-anchor": offset[0] < 0 ? "end" : "start"
          }
        )
      );
    });
    appendChildren(svg, children);
  }

  function buildLab(root, api) {
    INSTANCE += 1;
    var instanceId = "svm-margin-" + INSTANCE;
    var thetaId = instanceId + "-theta";
    var biasId = instanceId + "-bias";
    var titleId = instanceId + "-plot-title";
    var descId = instanceId + "-plot-desc";
    var state = { theta: 0, b: 0, searchRan: false };

    clear(root);
    root.classList.add("svm-margin-lab");

    var style = document.createElement("style");
    style.textContent = STYLE_TEXT;
    root.appendChild(style);

    root.appendChild(
      makeElement(api, "p", {
        className: "svm-margin-note"
      }, [
        "固定数据：正类 P1=(2,2)、P2=(2,3)、P3=(3,2)；负类 N1=(-2,-2)、N2=(-2,-3)、N3=(-3,-2)。"
      ])
    );

    var layout = makeElement(api, "div", { className: "svm-margin-layout" });
    var controls = makeElement(api, "div", {
      className: "svm-margin-controls",
      "aria-label": "SVM 候选线控制"
    });
    var stage = makeElement(api, "div", { className: "svm-margin-stage" });

    var thetaInput = makeElement(api, "input", {
      id: thetaId,
      type: "range",
      min: "0",
      max: "360",
      step: String(ANGLE_STEP),
      value: String(state.theta),
      "aria-label": "单位法向量角度 theta"
    });
    var thetaOutput = makeElement(api, "output", { for: thetaId });
    var thetaControl = makeElement(api, "div", { className: "svm-margin-control" }, [
      makeElement(api, "label", {
        className: "svm-margin-control-label",
        htmlFor: thetaId
      }, ["单位法向量角度 θ", thetaOutput]),
      thetaInput
    ]);

    var biasInput = makeElement(api, "input", {
      id: biasId,
      type: "range",
      min: "-5",
      max: "5",
      step: "0.1",
      value: String(state.b),
      "aria-label": "偏置 b"
    });
    var biasOutput = makeElement(api, "output", { for: biasId });
    var biasControl = makeElement(api, "div", { className: "svm-margin-control" }, [
      makeElement(api, "label", {
        className: "svm-margin-control-label",
        htmlFor: biasId
      }, ["偏置 b", biasOutput]),
      biasInput
    ]);

    var searchButton = makeElement(api, "button", {
      type: "button",
      className: "svm-margin-search"
    }, ["寻找最大间隔"]);
    var resetButton = makeElement(api, "button", {
      type: "button"
    }, ["恢复非最优候选线"]);
    var buttonRow = makeElement(api, "div", {
      className: "svm-margin-button-row"
    }, [searchButton, resetButton]);
    var searchInfo = makeElement(api, "p", {
      className: "svm-margin-search-info",
      "aria-live": "polite"
    });

    appendChildren(controls, [
      makeElement(api, "h4", {}, ["操作"]),
      thetaControl,
      biasControl,
      buttonRow,
      searchInfo,
      makeElement(api, "p", {
        className: "svm-margin-note"
      }, [
        "算法固定枚举 1,440 个单位方向（每 0.25°），不使用随机数。"
      ])
    ]);

    var svg = makeSvg(api, "svg", {
      className: "svm-margin-plot",
      viewBox: "0 0 560 420",
      role: "img",
      "aria-labelledby": titleId + " " + descId
    });
    var plotNote = makeElement(api, "p", {
      className: "svm-margin-note"
    });
    var legend = makeElement(api, "div", {
      className: "svm-margin-legend",
      "aria-label": "图例"
    }, [
      makeElement(api, "span", { className: "svm-margin-legend-item" }, [
        makeElement(api, "span", { className: "svm-margin-legend-line" }),
        "分界线 f=0"
      ]),
      makeElement(api, "span", { className: "svm-margin-legend-item" }, [
        makeElement(api, "span", {
          className: "svm-margin-legend-line svm-margin-legend-rail"
        }),
        "两条间隔线"
      ]),
      makeElement(api, "span", { className: "svm-margin-legend-item" }, [
        makeElement(api, "span", {
          className: "svm-margin-dot svm-margin-dot-positive"
        }),
        "正类"
      ]),
      makeElement(api, "span", { className: "svm-margin-legend-item" }, [
        makeElement(api, "span", {
          className: "svm-margin-dot svm-margin-dot-negative"
        }),
        "负类"
      ])
    ]);

    var metrics = makeElement(api, "div", {
      className: "svm-margin-metrics"
    });
    function makeMetric(label) {
      var value = makeElement(api, "strong");
      metrics.appendChild(
        makeElement(api, "div", { className: "svm-margin-metric" }, [
          makeElement(api, "span", {}, [label]),
          value
        ])
      );
      return value;
    }
    var normMetric = makeMetric("||w||");
    var marginMetric = makeMetric("当前最小几何间隔");
    var correctMetric = makeMetric("全部分类正确");
    var stateMetric = makeMetric("当前线的称呼");

    var formula = makeElement(api, "div", {
      className: "svm-margin-formula"
    }, [
      "w=(cos θ, sin θ), ||w||=1；f(x)=w·x+b；mᵢ=yᵢf(xᵢ)；γ当前=minᵢ mᵢ/||w||。同线缩放 (w,b)→(2w,2b) 不改线，mᵢ 乘 2，但 mᵢ/||w|| 不变。"
    ]);

    var pointsSection = makeElement(api, "div", {
      className: "svm-margin-points"
    });
    var pointsHeading = makeElement(api, "h4", {}, ["每点 signed margin"]);
    var pointList = makeElement(api, "div", {
      role: "list",
      "aria-label": "每个数据点的 signed margin"
    });
    pointsSection.appendChild(pointsHeading);
    pointsSection.appendChild(pointList);

    stage.appendChild(svg);
    stage.appendChild(plotNote);
    stage.appendChild(legend);
    stage.appendChild(metrics);
    stage.appendChild(formula);
    stage.appendChild(pointsSection);
    layout.appendChild(controls);
    layout.appendChild(stage);
    root.appendChild(layout);

    function updateSearchInfo() {
      if (!state.searchRan) {
        searchInfo.textContent =
          "尚未执行搜索；点击“寻找最大间隔”后，将当前线设为枚举结果。";
        return;
      }
      searchInfo.textContent =
        "枚举结果：θ*=" + formatNumber(api, BEST.theta, 2) +
        "°，p_min=" + formatNumber(api, BEST.positiveMin, 3) +
        "，n_max=" + formatNumber(api, BEST.negativeMax, 3) +
        "，t*=" + formatNumber(api, BEST.threshold, 3) +
        "，半间隙=" + formatNumber(api, BEST.halfGap, 3) +
        "。";
    }

    function renderPointList(result) {
      clear(pointList);
      pointList.appendChild(
        makeElement(api, "div", {
          className: "svm-margin-point-head",
          role: "presentation"
        }, ["点（标签，坐标）", "signed margin", "角色"])
      );
      result.points.forEach(function (point) {
        var role = "—";
        var roleClass = "";
        if (result.isOptimal && point.isNearest) {
          role = "支持向量";
          roleClass = "svm-margin-role-support";
        } else if (result.allCorrect && point.isNearest) {
          role = "最近点";
          roleClass = "svm-margin-role-nearest";
        } else if (!result.allCorrect && point.isNearest) {
          role = "最严重违例";
          roleClass = "svm-margin-role-violation";
        }
        pointList.appendChild(
          makeElement(api, "div", {
            className: "svm-margin-point-row",
            role: "listitem"
          }, [
            point.id + " (" + point.label + ") = (" + point.x + "," + point.y + ")",
            signedNumber(api, point.signed, 3),
            makeElement(api, "span", { className: roleClass }, [role])
          ])
        );
      });
    }

    function render() {
      var result = evaluate(state.theta, state.b);
      thetaOutput.textContent = formatNumber(api, state.theta, 2) + "°";
      biasOutput.textContent = formatNumber(api, state.b, 2);
      normMetric.textContent = formatNumber(api, result.norm, 3);
      marginMetric.textContent = formatNumber(api, result.minGeometry, 3);
      correctMetric.textContent = result.allCorrect ? "是" : "否";
      stateMetric.textContent = result.isOptimal ? "最优硬间隔" : "普通候选线";
      if (result.isOptimal) {
        plotNote.textContent =
          "最优硬间隔状态：两条虚线正好给出最大对称间隔；边界点才标为支持向量。";
      } else if (result.allCorrect) {
        plotNote.textContent =
          "普通候选线：虚线按当前最小 signed margin 对称绘制；最小点只称最近点。";
      } else {
        plotNote.textContent =
          "当前有错分，硬间隔不可行；图中虚线是 f=±1 的参考线，最小几何间隔带符号为负。";
      }
      updateSearchInfo();
      renderPointList(result);
      drawPlot(api, svg, result, titleId, descId);
    }

    thetaInput.addEventListener("input", function () {
      state.theta = Number(thetaInput.value);
      state.searchRan = false;
      render();
    });
    biasInput.addEventListener("input", function () {
      state.b = Number(biasInput.value);
      state.searchRan = false;
      render();
    });
    searchButton.addEventListener("click", function () {
      state.theta = BEST.theta;
      state.b = BEST.b;
      state.searchRan = true;
      render();
      if (api && typeof api.announce === "function") {
        api.announce(root, "已枚举单位方向并切换到最大间隔候选线。");
      }
    });
    resetButton.addEventListener("click", function () {
      state.theta = 0;
      state.b = 0;
      state.searchRan = false;
      render();
      if (api && typeof api.announce === "function") {
        api.announce(root, "已恢复非最优候选线 theta=0 度、b=0。");
      }
    });

    render();
  }

  window.CourseLearning.register("svm-margin", buildLab);
})();
