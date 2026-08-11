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
  var STYLE_ID = "eigen-geometry-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-12;
  var PRESETS = [
    {
      id: "diag",
      label: "diag(2, 0.5)",
      matrix: { a: 2, b: 0, c: 0, d: 0.5 },
      matrixText: "[[2, 0], [0, 0.5]]",
      eigen: [
        { lambda: "2", value: 2, direction: "span{(1,0)ᵀ}", vector: { x: 1, y: 0 } },
        { lambda: "0.5", value: 0.5, direction: "span{(0,1)ᵀ}", vector: { x: 0, y: 1 } }
      ],
      realDirections: [
        { lambda: "2", value: 2, label: "λ=2", vector: { x: 1, y: 0 } },
        { lambda: "0.5", value: 0.5, label: "λ=0.5", vector: { x: 0, y: 1 } }
      ]
    },
    {
      id: "symmetric",
      label: "对称 [[2,1],[1,2]]",
      matrix: { a: 2, b: 1, c: 1, d: 2 },
      matrixText: "[[2, 1], [1, 2]]",
      eigen: [
        { lambda: "3", value: 3, direction: "span{(1,1)ᵀ}", vector: { x: 1, y: 1 } },
        { lambda: "1", value: 1, direction: "span{(1,−1)ᵀ}", vector: { x: 1, y: -1 } }
      ],
      realDirections: [
        { lambda: "3", value: 3, label: "λ=3", vector: { x: 1, y: 1 } },
        { lambda: "1", value: 1, label: "λ=1", vector: { x: 1, y: -1 } }
      ]
    },
    {
      id: "jordan",
      label: "Jordan [[1,1],[0,1]]",
      matrix: { a: 1, b: 1, c: 0, d: 1 },
      matrixText: "[[1, 1], [0, 1]]",
      eigen: [
        { lambda: "1（代数重数 2）", value: 1, direction: "span{(1,0)ᵀ}（仅此实方向）", vector: { x: 1, y: 0 } }
      ],
      realDirections: [
        { lambda: "1", value: 1, label: "λ=1；仅一条方向", vector: { x: 1, y: 0 } }
      ]
    },
    {
      id: "rotation",
      label: "90° 旋转 [[0,−1],[1,0]]",
      matrix: { a: 0, b: -1, c: 1, d: 0 },
      matrixText: "[[0, −1], [1, 0]]",
      eigen: [
        { lambda: "i", value: null, direction: "(1,−i)ᵀ（复特征向量）", vector: { x: 1, y: -1, complex: true } },
        { lambda: "−i", value: null, direction: "(1,i)ᵀ（复特征向量）", vector: { x: 1, y: 1, complex: true } }
      ],
      realDirections: []
    }
  ];

  function makeElement(api, tag, attrs, children) {
    return api.el(tag, attrs, children);
  }

  function makeSvg(api, tag, attrs, children) {
    return api.svg(tag, attrs, children);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function formatNumber(api, value, digits) {
    if (Math.abs(value) < 0.0005) value = 0;
    return api && typeof api.format === "function"
      ? api.format(value, digits === undefined ? 2 : digits)
      : String(value);
  }

  function formatVector(api, vector) {
    return "(" + formatNumber(api, vector.x) + ", " + formatNumber(api, vector.y) + ")ᵀ";
  }

  function applyMatrix(matrix, vector) {
    return {
      x: matrix.a * vector.x + matrix.b * vector.y,
      y: matrix.c * vector.x + matrix.d * vector.y
    };
  }

  function scaleVector(vector, factor) {
    return { x: vector.x * factor, y: vector.y * factor };
  }

  function vectorLength(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  function toSvg(center, scale, point) {
    return { x: center.x + scale * point.x, y: center.y - scale * point.y };
  }

  function pathFromWorld(center, scale, points) {
    return points.map(function (point, index) {
      var svgPoint = toSvg(center, scale, point);
      return (index === 0 ? "M" : "L") + svgPoint.x.toFixed(2) + "," + svgPoint.y.toFixed(2);
    }).join(" ");
  }

  function matrixLabel(preset) {
    return "A=" + preset.matrixText;
  }

  function eigenSummary(preset) {
    if (preset.id === "rotation") {
      return "λ=i：v=(1,−i)ᵀ；λ=−i：v=(1,i)ᵀ；没有非零实特征向量。";
    }
    return preset.eigen.map(function (item) {
      return "λ=" + item.lambda + "，方向 " + item.direction;
    }).join("；") + "。";
  }

  function setDetail(api, node, label, value) {
    node.replaceChildren(
      makeElement(api, "strong", {}, label),
      node.ownerDocument.createTextNode(value)
    );
  }

  function injectStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".eigen-geometry-lab { --eg-eigen: var(--cl-gold, #9b6a12); --eg-input: var(--cl-blue, #315f9d); --eg-output: var(--cl-green, #39734d); --eg-muted: var(--fg-soft, #6f6a60); line-height: 1.5; }",
      "html[data-theme=\"dark\"] .eigen-geometry-lab { --eg-eigen: #e2b458; --eg-input: #83c8ff; --eg-output: #72bd8b; --eg-muted: #b8b2a7; }",
      ".eigen-geometry-lab .eg-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }",
      ".eigen-geometry-lab .eg-controls, .eigen-geometry-lab .eg-stage { min-width: 0; }",
      ".eigen-geometry-lab .eg-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px 18px; }",
      ".eigen-geometry-lab .eg-control-section { display: grid; gap: 7px; }",
      ".eigen-geometry-lab .eg-control-section h4 { margin: 0; }",
      ".eigen-geometry-lab .eg-small, .eigen-geometry-lab .eg-note { margin: 0; color: var(--eg-muted); font-size: 13px; overflow-wrap: anywhere; }",
      ".eigen-geometry-lab .eg-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }",
      ".eigen-geometry-lab .eg-button { min-width: 0; min-height: 44px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: inherit; cursor: pointer; font: inherit; line-height: 1.35; overflow-wrap: anywhere; }",
      ".eigen-geometry-lab .eg-button:hover { border-color: var(--accent); }",
      ".eigen-geometry-lab .eg-button[aria-pressed=true], .eigen-geometry-lab .eg-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); font-weight: 700; }",
      ".eigen-geometry-lab .eg-button:focus-visible, .eigen-geometry-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".eigen-geometry-lab .eg-field { display: grid; gap: 5px; }",
      ".eigen-geometry-lab .eg-field-caption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px; color: var(--eg-muted); font-size: 13px; font-weight: 650; }",
      ".eigen-geometry-lab .eg-output { color: var(--accent); font-variant-numeric: tabular-nums; }",
      ".eigen-geometry-lab input[type=range] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
      ".eigen-geometry-lab .eg-toggle { width: 100%; }",
      ".eigen-geometry-lab .eg-status { grid-column: 1 / -1; min-height: 1.5em; margin: 0; color: var(--eg-output); font-weight: 650; }",
      ".eigen-geometry-lab .eg-stage-frame { padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); }",
      ".eigen-geometry-lab .eg-svg { display: block; width: 100%; max-width: 100%; height: auto; color: inherit; }",
      ".eigen-geometry-lab .eg-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
      ".eigen-geometry-lab .eg-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.2; }",
      ".eigen-geometry-lab .eg-grid { fill: none; stroke: currentColor; stroke-opacity: .13; stroke-width: 1; }",
      ".eigen-geometry-lab .eg-axis { fill: none; stroke: currentColor; stroke-opacity: .52; stroke-width: 1.2; }",
      ".eigen-geometry-lab .eg-circle { fill: none; stroke: var(--accent); stroke-opacity: .82; stroke-width: 2.2; }",
      ".eigen-geometry-lab .eg-eigen-line { fill: none; stroke: var(--eg-eigen); stroke-opacity: .72; stroke-width: 1.5; stroke-dasharray: 6 4; }",
      ".eigen-geometry-lab .eg-eigen-arrow { fill: none; stroke: var(--eg-eigen); stroke-width: 2.4; }",
      ".eigen-geometry-lab .eg-eigen-head { fill: var(--eg-eigen); stroke: var(--eg-eigen); }",
      ".eigen-geometry-lab .eg-input-vector { fill: none; stroke: var(--eg-input); stroke-width: 3; }",
      ".eigen-geometry-lab .eg-input-head { fill: var(--eg-input); stroke: var(--eg-input); }",
      ".eigen-geometry-lab .eg-output-vector { fill: none; stroke: var(--eg-output); stroke-width: 3; }",
      ".eigen-geometry-lab .eg-output-head { fill: var(--eg-output); stroke: var(--eg-output); }",
      ".eigen-geometry-lab .eg-origin { fill: currentColor; }",
      ".eigen-geometry-lab .eg-panel-label { font-size: 14px; font-weight: 700; }",
      ".eigen-geometry-lab .eg-axis-label, .eigen-geometry-lab .eg-eigen-label { font-size: 12px; }",
      ".eigen-geometry-lab .eg-eigen-label { fill: var(--eg-eigen) !important; font-weight: 700; }",
      ".eigen-geometry-lab .eg-vector-label { font-size: 12px; font-weight: 700; }",
      ".eigen-geometry-lab .eg-input-label { fill: var(--eg-input) !important; }",
      ".eigen-geometry-lab .eg-output-label { fill: var(--eg-output) !important; }",
      ".eigen-geometry-lab .eg-no-real { fill: var(--eg-muted) !important; font-size: 13px; }",
      ".eigen-geometry-lab .eg-details { display: grid; gap: 6px; margin-top: 10px; }",
      ".eigen-geometry-lab .eg-detail { margin: 0; padding: 8px 10px; border-left: 3px solid var(--border); background: var(--bg); overflow-wrap: anywhere; }",
      ".eigen-geometry-lab .eg-detail strong { color: var(--eg-muted); }",
      "@media (max-width: 700px) { .eigen-geometry-lab { margin-left: -8px; margin-right: -8px; padding: 14px; } .eigen-geometry-lab .eg-controls { grid-template-columns: minmax(0, 1fr); } .eigen-geometry-lab .eg-status { grid-column: auto; } .eigen-geometry-lab .eg-stage-frame { padding: 5px; overflow-x: auto; } .eigen-geometry-lab .eg-svg { min-width: 700px; } .eigen-geometry-lab .eg-presets { grid-template-columns: repeat(2, minmax(0, 1fr)); } }",
      "@media (prefers-reduced-motion: reduce) { .eigen-geometry-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function makeMarker(api, doc, id, className) {
    var marker = makeSvg(api, "marker", {
      id: id,
      viewBox: "0 0 10 10",
      markerWidth: "10",
      markerHeight: "10",
      refX: "8",
      refY: "5",
      orient: "auto",
      markerUnits: "userSpaceOnUse"
    });
    marker.appendChild(makeSvg(api, "path", { d: "M0,0 L10,5 L0,10 Z", className: className }));
    return marker;
  }

  function addWorldLine(api, parent, className, center, scale, point1, point2, clipId, extra) {
    var first = toSvg(center, scale, point1);
    var second = toSvg(center, scale, point2);
    var attrs = {
      className: className,
      x1: first.x,
      y1: first.y,
      x2: second.x,
      y2: second.y,
      "clip-path": "url(#" + clipId + ")"
    };
    Object.keys(extra || {}).forEach(function (key) { attrs[key] = extra[key]; });
    parent.appendChild(makeSvg(api, "line", attrs));
  }

  function addTransformedLine(api, parent, className, center, scale, matrix, point1, point2, clipId, extra) {
    addWorldLine(api, parent, className, center, scale, applyMatrix(matrix, point1), applyMatrix(matrix, point2), clipId, extra);
  }

  function drawGrid(api, drawing, center, scale, matrix, clipId, transformed) {
    var tick;
    var first;
    var second;
    for (tick = -2; tick <= 2.001; tick += 0.5) {
      first = { x: tick, y: -2.2 };
      second = { x: tick, y: 2.2 };
      if (transformed) addTransformedLine(api, drawing, "eg-grid", center, scale, matrix, first, second, clipId);
      else addWorldLine(api, drawing, "eg-grid", center, scale, first, second, clipId);
      first = { x: -2.2, y: tick };
      second = { x: 2.2, y: tick };
      if (transformed) addTransformedLine(api, drawing, "eg-grid", center, scale, matrix, first, second, clipId);
      else addWorldLine(api, drawing, "eg-grid", center, scale, first, second, clipId);
    }
  }

  function drawAxes(api, drawing, center, scale, matrix, clipId, transformed) {
    var first = { x: -5.5, y: 0 };
    var second = { x: 5.5, y: 0 };
    if (transformed) addTransformedLine(api, drawing, "eg-axis", center, scale, matrix, first, second, clipId);
    else addWorldLine(api, drawing, "eg-axis", center, scale, first, second, clipId);
    first = { x: 0, y: -5.5 };
    second = { x: 0, y: 5.5 };
    if (transformed) addTransformedLine(api, drawing, "eg-axis", center, scale, matrix, first, second, clipId);
    else addWorldLine(api, drawing, "eg-axis", center, scale, first, second, clipId);
  }

  function drawCircle(api, drawing, center, scale, matrix, clipId, transformed) {
    var points = [];
    var index;
    var angle;
    for (index = 0; index <= 96; index += 1) {
      angle = (2 * Math.PI * index) / 96;
      points.push({ x: Math.cos(angle), y: Math.sin(angle) });
    }
    if (transformed) {
      points = points.map(function (point) { return applyMatrix(matrix, point); });
    }
    drawing.appendChild(makeSvg(api, "path", {
      className: "eg-circle",
      d: pathFromWorld(center, scale, points),
      "clip-path": "url(#" + clipId + ")"
    }));
  }

  function drawEigenDirections(api, drawing, preset, center, scale, clipId, transformed, markerId) {
    if (!preset.realDirections.length) {
      drawing.appendChild(makeSvg(api, "text", {
        className: "eg-no-real",
        x: center.x,
        y: center.y + 20,
        "text-anchor": "middle"
      }, "无实特征方向"));
      return;
    }
    preset.realDirections.forEach(function (item) {
      var direction = item.vector;
      var mapped = applyMatrix(preset.matrix, direction);
      var arrowEnd;
      var lineStart;
      var lineEnd;
      var labelPoint;
      if (transformed) {
        lineStart = scaleVector(mapped, -2.0);
        lineEnd = scaleVector(mapped, 2.0);
        arrowEnd = scaleVector(mapped, 1.65 / Math.max(vectorLength(mapped), EPS));
      } else {
        lineStart = scaleVector(direction, -2.0);
        lineEnd = scaleVector(direction, 2.0);
        arrowEnd = scaleVector(direction, 1.65 / Math.max(vectorLength(direction), EPS));
      }
      addWorldLine(api, drawing, "eg-eigen-line", center, scale, lineStart, lineEnd, clipId);
      addWorldLine(api, drawing, "eg-eigen-arrow", center, scale, { x: 0, y: 0 }, arrowEnd, clipId, {
        "marker-end": "url(#" + markerId + ")"
      });
      labelPoint = toSvg(center, scale, scaleVector(arrowEnd, 1.08));
      drawing.appendChild(makeSvg(api, "text", {
        className: "eg-eigen-label",
        x: labelPoint.x,
        y: labelPoint.y,
        "text-anchor": "middle"
      }, transformed ? item.label : "实方向 " + item.label));
    });
  }

  function drawVector(api, drawing, center, scale, vector, className, label, labelClass, markerId, clipId) {
    var endpoint = toSvg(center, scale, vector);
    addWorldLine(api, drawing, className, center, scale, { x: 0, y: 0 }, vector, clipId, {
      "marker-end": "url(#" + markerId + ")"
    });
    drawing.appendChild(makeSvg(api, "circle", { className: "eg-origin", cx: center.x, cy: center.y, r: 3 }));
    drawing.appendChild(makeSvg(api, "text", {
      className: "eg-vector-label " + labelClass,
      x: endpoint.x + (endpoint.x < center.x ? -7 : 7),
      y: endpoint.y - 8,
      "text-anchor": endpoint.x < center.x ? "end" : "start"
    }, label));
  }

  function drawScene(api, svg, drawing, preset, state, ids, title, desc) {
    var left = { x: 205, y: 216 };
    var right = { x: 615, y: 216 };
    /* A shared scale makes lengths comparable across the two panels. */
    var leftScale = 45;
    var rightScale = 45;
    var x;
    var ax;
    var inputPoint;
    var outputPoint;
    clear(drawing);
    drawing.appendChild(makeSvg(api, "rect", { className: "eg-panel", x: 15, y: 36, width: 380, height: 340, rx: 5 }));
    drawing.appendChild(makeSvg(api, "rect", { className: "eg-panel", x: 425, y: 36, width: 380, height: 340, rx: 5 }));
    drawing.appendChild(makeSvg(api, "text", { className: "eg-panel-label", x: 32, y: 59 }, "变换前：x"));
    drawing.appendChild(makeSvg(api, "text", { className: "eg-panel-label", x: 442, y: 59 }, "变换后：Ax"));
    drawGrid(api, drawing, left, leftScale, preset.matrix, ids.leftClip, false);
    drawGrid(api, drawing, right, rightScale, preset.matrix, ids.rightClip, true);
    drawAxes(api, drawing, left, leftScale, preset.matrix, ids.leftClip, false);
    drawAxes(api, drawing, right, rightScale, preset.matrix, ids.rightClip, true);
    drawCircle(api, drawing, left, leftScale, preset.matrix, ids.leftClip, false);
    drawCircle(api, drawing, right, rightScale, preset.matrix, ids.rightClip, true);
    drawEigenDirections(api, drawing, preset, left, leftScale, ids.leftClip, false, ids.eigenMarker);
    drawEigenDirections(api, drawing, preset, right, rightScale, ids.rightClip, true, ids.eigenMarker);
    drawing.appendChild(makeSvg(api, "text", { className: "eg-axis-label", x: left.x + 146, y: left.y + 18 }, "x₁"));
    drawing.appendChild(makeSvg(api, "text", { className: "eg-axis-label", x: left.x + 7, y: left.y - 130 }, "x₂"));
    drawing.appendChild(makeSvg(api, "text", { className: "eg-axis-label", x: right.x + 146, y: right.y + 18 }, "y₁"));
    drawing.appendChild(makeSvg(api, "text", { className: "eg-axis-label", x: right.x + 7, y: right.y - 130 }, "y₂"));
    if (state.showVector) {
      x = scaleVector({ x: Math.cos(state.angle), y: Math.sin(state.angle) }, 1.45);
      ax = applyMatrix(preset.matrix, x);
      drawVector(api, drawing, left, leftScale, x, "eg-input-vector", "x", "eg-input-label", ids.inputMarker, ids.leftClip);
      drawVector(api, drawing, right, rightScale, ax, "eg-output-vector", "Ax", "eg-output-label", ids.outputMarker, ids.rightClip);
    }
    inputPoint = scaleVector({ x: Math.cos(state.angle), y: Math.sin(state.angle) }, 1.45);
    outputPoint = applyMatrix(preset.matrix, inputPoint);
    title.textContent = "eigen-geometry：" + preset.label + " 的方向图像";
    desc.textContent = matrixLabel(preset) + "；左图显示变换前网格与单位圆，右图显示变换后的网格与椭圆。" +
      (state.showVector
        ? "当前向量 x=" + formatVector(api, inputPoint) + "，Ax=" + formatVector(api, outputPoint) + "。"
        : "向量图层当前隐藏。") +
      (preset.realDirections.length
        ? "金色虚线与箭头标出实特征方向。"
        : "该矩阵没有非零实特征向量，因此右图不标出实特征方向。");
    svg.setAttribute("aria-label", "eigen-geometry：" + preset.label + "；" + desc.textContent);
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    var serial;
    var ids;
    var state;
    var shell;
    var controls;
    var stage;
    var presetButtons;
    var angleInput;
    var angleOutput;
    var vectorToggle;
    var status;
    var matrixDetail;
    var eigenDetail;
    var vectorDetail;
    var svg;
    var title;
    var desc;
    var drawing;
    var preset;

    injectStyles(doc);
    INSTANCE += 1;
    serial = INSTANCE;
    ids = {
      svgTitle: "eg-svg-title-" + serial,
      svgDesc: "eg-svg-desc-" + serial,
      eigenMarker: "eg-eigen-marker-" + serial,
      inputMarker: "eg-input-marker-" + serial,
      outputMarker: "eg-output-marker-" + serial,
      leftClip: "eg-left-clip-" + serial,
      rightClip: "eg-right-clip-" + serial,
      angle: "eg-angle-" + serial
    };
    state = { presetId: "diag", angle: (35 * Math.PI) / 180, showVector: true };
    preset = PRESETS[0];

    shell = makeElement(api, "div", { className: "eg-shell" });
    shell.appendChild(makeElement(api, "h3", {}, "eigen-geometry：方向会怎样？"));
    shell.appendChild(makeElement(api, "p", { className: "eg-note" }, "四个固定预设、可选角度滑杆和确定性 SVG；先预测，再比较 x 与 Ax。"));
    var layout = makeElement(api, "div", { className: "eg-layout" });
    controls = makeElement(api, "aside", { className: "eg-controls", "aria-label": "特征几何实验控制" });
    stage = makeElement(api, "section", { className: "eg-stage", "aria-labelledby": ids.svgTitle });

    var presetSection = makeElement(api, "div", { className: "eg-control-section" });
    presetSection.appendChild(makeElement(api, "h4", {}, "选择矩阵预设"));
    presetSection.appendChild(makeElement(api, "p", { className: "eg-small" }, "四个预设覆盖伸缩、对称、Jordan 与无实特征方向。"));
    var presetGroup = makeElement(api, "div", { className: "eg-presets", role: "group", "aria-label": "矩阵预设" });
    presetButtons = [];
    PRESETS.forEach(function (item) {
      var button = makeElement(api, "button", {
        className: "eg-button",
        type: "button",
        "aria-pressed": "false"
      }, item.label);
      button.addEventListener("click", function () {
        state.presetId = item.id;
        preset = item;
        render();
        status.textContent = "当前：" + item.label + "。";
        if (api && typeof api.announce === "function") api.announce(root, "已切换到 " + item.label + "；" + eigenSummary(item));
      });
      presetButtons.push({ item: item, button: button });
      presetGroup.appendChild(button);
    });
    presetSection.appendChild(presetGroup);
    controls.appendChild(presetSection);

    var angleSection = makeElement(api, "div", { className: "eg-control-section" });
    angleSection.appendChild(makeElement(api, "h4", {}, "可选：向量 x 的方向"));
    var angleLabel = makeElement(api, "label", { className: "eg-field", htmlFor: ids.angle });
    var angleCaption = makeElement(api, "span", { className: "eg-field-caption" });
    angleCaption.appendChild(doc.createTextNode("从 x₁ 轴逆时针计角"));
    angleOutput = makeElement(api, "output", { className: "eg-output", htmlFor: ids.angle });
    angleCaption.appendChild(angleOutput);
    angleLabel.appendChild(angleCaption);
    angleInput = makeElement(api, "input", {
      id: ids.angle,
      type: "range",
      min: "0",
      max: "360",
      step: "1",
      value: "35",
      "aria-label": "向量 x 的角度"
    });
    angleLabel.appendChild(angleInput);
    angleSection.appendChild(angleLabel);
    vectorToggle = makeElement(api, "button", {
      className: "eg-button eg-toggle",
      type: "button",
      "aria-pressed": "true"
    });
    vectorToggle.addEventListener("click", function () {
      state.showVector = !state.showVector;
      render();
      if (api && typeof api.announce === "function") api.announce(root, state.showVector ? "已显示向量 x 与 Ax。" : "已隐藏向量 x 与 Ax；网格、单位圆与特征方向仍保留。");
    });
    angleSection.appendChild(vectorToggle);
    controls.appendChild(angleSection);

    status = makeElement(api, "p", { className: "eg-status", "aria-live": "polite", "aria-atomic": "true" });
    controls.appendChild(status);
    layout.appendChild(controls);

    svg = makeSvg(api, "svg", {
      className: "eg-svg",
      viewBox: "0 0 820 400",
      role: "img",
      "aria-label": "eigen-geometry 几何变换图",
      "aria-labelledby": ids.svgTitle + " " + ids.svgDesc
    });
    title = makeSvg(api, "title", { id: ids.svgTitle }, "eigen-geometry 几何变换图");
    desc = makeSvg(api, "desc", { id: ids.svgDesc }, "左侧是变换前网格与单位圆，右侧是变换后结果。");
    svg.appendChild(title);
    svg.appendChild(desc);
    var defs = makeSvg(api, "defs", {});
    var leftClip = makeSvg(api, "clipPath", { id: ids.leftClip });
    leftClip.appendChild(makeSvg(api, "rect", { x: 30, y: 62, width: 350, height: 300 }));
    var rightClip = makeSvg(api, "clipPath", { id: ids.rightClip });
    rightClip.appendChild(makeSvg(api, "rect", { x: 440, y: 62, width: 350, height: 300 }));
    defs.appendChild(leftClip);
    defs.appendChild(rightClip);
    defs.appendChild(makeMarker(api, doc, ids.eigenMarker, "eg-eigen-head"));
    defs.appendChild(makeMarker(api, doc, ids.inputMarker, "eg-input-head"));
    defs.appendChild(makeMarker(api, doc, ids.outputMarker, "eg-output-head"));
    svg.appendChild(defs);
    drawing = makeSvg(api, "g", { "aria-hidden": "true" });
    svg.appendChild(drawing);
    stage.appendChild(makeElement(api, "div", { className: "eg-stage-frame" }, [svg]));
    stage.appendChild(makeElement(api, "p", { className: "eg-note" }, "蓝色箭头是 x，绿色箭头是 Ax；金色虚线是实特征方向。右图的单位圆像是 A 作用后的集合。"));

    var details = makeElement(api, "div", { className: "eg-details", "aria-label": "当前矩阵的精确读数" });
    matrixDetail = makeElement(api, "p", { className: "eg-detail" });
    eigenDetail = makeElement(api, "p", { className: "eg-detail" });
    vectorDetail = makeElement(api, "p", { className: "eg-detail" });
    details.appendChild(matrixDetail);
    details.appendChild(eigenDetail);
    details.appendChild(vectorDetail);
    stage.appendChild(details);
    layout.appendChild(stage);
    shell.appendChild(layout);
    root.classList.add("eigen-geometry-lab");
    root.replaceChildren(shell);

    function render() {
      var angleDegrees;
      var x;
      var ax;
      presetButtons.forEach(function (entry) {
        entry.button.setAttribute("aria-pressed", entry.item.id === state.presetId ? "true" : "false");
      });
      preset = PRESETS.filter(function (item) { return item.id === state.presetId; })[0] || PRESETS[0];
      angleDegrees = Math.round((state.angle * 180) / Math.PI);
      angleInput.value = String(angleDegrees);
      angleOutput.textContent = angleDegrees + "°";
      vectorToggle.setAttribute("aria-pressed", state.showVector ? "true" : "false");
      vectorToggle.textContent = state.showVector ? "隐藏向量 x 与 Ax" : "显示向量 x 与 Ax";
      x = scaleVector({ x: Math.cos(state.angle), y: Math.sin(state.angle) }, 1.45);
      ax = applyMatrix(preset.matrix, x);
      setDetail(api, matrixDetail, "当前矩阵：", matrixLabel(preset));
      setDetail(api, eigenDetail, "精确特征信息：", eigenSummary(preset));
      setDetail(
        api,
        vectorDetail,
        "向量读数：",
        state.showVector
          ? "x=" + formatVector(api, x) + "，Ax=" + formatVector(api, ax) + "；|x|=" + formatNumber(api, vectorLength(x)) + "，|Ax|=" + formatNumber(api, vectorLength(ax))
          : "向量图层已隐藏；可用角度滑杆继续准备下一次预测。"
      );
      status.textContent = "当前：" + preset.label + "；" + (preset.realDirections.length ? "金色方向线为实特征方向。" : "没有实特征方向。");
      drawScene(api, svg, drawing, preset, state, ids, title, desc);
    }

    angleInput.addEventListener("input", function () {
      state.angle = (Number(angleInput.value) * Math.PI) / 180;
      render();
    });
    render();
  }

  window.CourseLearning.register("eigen-geometry", function (root, api) {
    mount(root, api);
  });
}());
