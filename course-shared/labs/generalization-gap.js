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
  var EPSILON = 1e-12;
  var TRAIN = [
    { id: "T1", x: 0, y: 1.10 },
    { id: "T2", x: 1.4, y: 2.00 },
    { id: "T3", x: 2.8, y: 3.70 },
    { id: "T4", x: 4.2, y: 5.37 },
    { id: "T5", x: 5.6, y: 6.48 },
    { id: "T6", x: 7, y: 8.96 },
    { id: "T7", x: 8.4, y: 10.24 },
    { id: "T8", x: 9.8, y: 12.88 }
  ];
  var VALIDATION = [
    { id: "V1", x: 0.7, y: 1.61 },
    { id: "V2", x: 2.1, y: 2.82 },
    { id: "V3", x: 3.5, y: 4.31 },
    { id: "V4", x: 4.9, y: 5.85 },
    { id: "V5", x: 6.3, y: 7.68 },
    { id: "V6", x: 7.7, y: 9.51 },
    { id: "V7", x: 9.1, y: 11.63 }
  ];
  var PRESETS = [
    {
      id: "underfit",
      label: "欠拟合",
      degree: 1,
      lambda: 0,
      note: "一次函数，偏差较大"
    },
    {
      id: "moderate",
      label: "适度拟合",
      degree: 2,
      lambda: 0,
      note: "二次函数，默认预设"
    },
    {
      id: "interpolation",
      label: "插值 / 过拟合",
      degree: 7,
      lambda: 0,
      note: "8 个训练点用 7 次多项式插值"
    },
    {
      id: "regularized",
      label: "正则化",
      degree: 7,
      lambda: 0.01,
      note: "同阶模型加小的权重惩罚"
    }
  ];
  var PLOT = {
    left: 56,
    top: 34,
    width: 516,
    height: 250,
    xMin: 0,
    xMax: 10,
    yMin: 0,
    yMax: 16,
    samples: 160
  };
  var STYLE_TEXT = [
    ".generalization-gap-lab { --gg-train: var(--cl-green, #39734d); --gg-validation: var(--cl-blue, #315f9d); --gg-model: var(--accent, #315f9d); --gg-muted: var(--fg-soft, #6b6557); --gg-border: var(--border, #d7d0c2); line-height: 1.5; }",
    "html[data-theme=\"dark\"] .generalization-gap-lab { --gg-train: #72bd8b; --gg-validation: #83c8ff; --gg-model: #83c8ff; }",
    ".generalization-gap-lab *, .generalization-gap-lab *::before, .generalization-gap-lab *::after { box-sizing: border-box; }",
    ".generalization-gap-lab .gg-shell { min-width: 0; }",
    ".generalization-gap-lab .gg-heading { margin: 0 0 .25rem; color: var(--accent); font-size: 1.25rem; }",
    ".generalization-gap-lab .gg-intro, .generalization-gap-lab .gg-note, .generalization-gap-lab .gg-status { color: var(--gg-muted); }",
    ".generalization-gap-lab .gg-intro { margin: 0 0 1rem; }",
    ".generalization-gap-lab .gg-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }",
    ".generalization-gap-lab .gg-controls, .generalization-gap-lab .gg-stage { min-width: 0; }",
    ".generalization-gap-lab .gg-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; }",
    ".generalization-gap-lab .gg-controls > .gg-control-section:last-child { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 18px; }",
    ".generalization-gap-lab .gg-controls > .gg-control-section:last-child h4 { grid-column: 1 / -1; }",
    ".generalization-gap-lab .gg-control-section { margin: 0; padding-top: .9rem; border-top: 1px solid var(--gg-border); }",
    ".generalization-gap-lab .gg-control-section:first-child { padding-top: 0; border-top: 0; }",
    ".generalization-gap-lab h4 { margin: 0 0 .45rem; font-size: 1rem; }",
    ".generalization-gap-lab .gg-preset-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }",
    ".generalization-gap-lab button { min-width: 0; min-height: 44px; padding: 7px 9px; border: 1px solid var(--gg-border); border-radius: 6px; background: var(--bg); color: inherit; cursor: pointer; font: inherit; line-height: 1.3; overflow-wrap: anywhere; }",
    ".generalization-gap-lab button:hover { border-color: var(--accent); }",
    ".generalization-gap-lab button[aria-pressed=\"true\"], .generalization-gap-lab .gg-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); font-weight: 700; }",
    ".generalization-gap-lab button:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".generalization-gap-lab .gg-button-note { margin: 0; color: var(--gg-muted); font-size: .86em; }",
    ".generalization-gap-lab .gg-recipe { margin: 0; padding: 9px 10px; border-left: 3px solid var(--accent); background: var(--bg); color: var(--gg-muted); font-size: .88em; overflow-wrap: anywhere; }",
    ".generalization-gap-lab .gg-stage-frame { padding: 8px; border: 1px solid var(--gg-border); border-radius: 6px; background: var(--bg); }",
    ".generalization-gap-lab .gg-stage-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 5px; }",
    ".generalization-gap-lab .gg-stage-head h4 { margin: 0; }",
    ".generalization-gap-lab .gg-stage-subtitle { color: var(--gg-muted); font-size: .86em; }",
    ".generalization-gap-lab .gg-chart-scroll { overflow-x: auto; }",
    ".generalization-gap-lab .gg-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--fg); }",
    ".generalization-gap-lab .gg-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".generalization-gap-lab .gg-panel { fill: none; stroke: var(--gg-border); stroke-width: 1; }",
    ".generalization-gap-lab .gg-grid-line { stroke: currentColor; stroke-opacity: .13; stroke-width: 1; }",
    ".generalization-gap-lab .gg-axis-line { stroke: currentColor; stroke-opacity: .52; stroke-width: 1.2; }",
    ".generalization-gap-lab .gg-curve { fill: none; stroke: var(--gg-model); stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }",
    ".generalization-gap-lab .gg-train-point { fill: var(--gg-train); stroke: var(--bg); stroke-width: 1.5; }",
    ".generalization-gap-lab .gg-validation-point { fill: var(--gg-validation); stroke: var(--bg); stroke-width: 1.5; }",
    ".generalization-gap-lab .gg-axis-label, .generalization-gap-lab .gg-tick-label, .generalization-gap-lab .gg-chart-note { fill: var(--gg-muted) !important; }",
    ".generalization-gap-lab .gg-axis-label { font-size: 12px; }",
    ".generalization-gap-lab .gg-tick-label { font-size: 10.5px; }",
    ".generalization-gap-lab .gg-chart-note { font-size: 11px; }",
    ".generalization-gap-lab .gg-legend { display: flex; flex-wrap: wrap; gap: 7px 15px; margin-top: 7px; color: var(--gg-muted); font-size: .86em; }",
    ".generalization-gap-lab .gg-legend-item { display: inline-flex; align-items: center; gap: 5px; }",
    ".generalization-gap-lab .gg-legend-dot, .generalization-gap-lab .gg-legend-square { display: inline-block; width: 11px; height: 11px; }",
    ".generalization-gap-lab .gg-legend-dot { border-radius: 50%; background: var(--gg-train); }",
    ".generalization-gap-lab .gg-legend-square { border-radius: 2px; background: var(--gg-validation); }",
    ".generalization-gap-lab .gg-legend-line { display: inline-block; width: 22px; border-top: 3px solid var(--gg-model); }",
    ".generalization-gap-lab .gg-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-top: 12px; }",
    ".generalization-gap-lab .gg-metric { min-width: 0; padding: 9px; border-top: 2px solid var(--gg-border); background: var(--bg); }",
    ".generalization-gap-lab .gg-metric span { display: block; color: var(--gg-muted); font-size: 11.5px; line-height: 1.35; }",
    ".generalization-gap-lab .gg-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".generalization-gap-lab .gg-metric.gg-gap-negative strong { color: var(--gg-validation); }",
    ".generalization-gap-lab .gg-metric.gg-gap-positive strong { color: var(--cl-gold, #9b6a12); }",
    ".generalization-gap-lab .gg-comparison { display: grid; gap: 8px; margin-top: 12px; }",
    ".generalization-gap-lab .gg-bar-row { display: grid; grid-template-columns: 82px minmax(0, 1fr) 70px; gap: 8px; align-items: center; font-size: .86em; }",
    ".generalization-gap-lab .gg-bar-label { color: var(--gg-muted); }",
    ".generalization-gap-lab .gg-bar-track { position: relative; height: 18px; overflow: hidden; border: 1px solid var(--gg-border); border-radius: 4px; background: var(--block-bg, #f4f1e9); }",
    ".generalization-gap-lab .gg-bar-fill { height: 100%; min-width: 2px; border-radius: 3px; background: var(--gg-model); }",
    ".generalization-gap-lab .gg-bar-fill.gg-train-fill { background: var(--gg-train); }",
    ".generalization-gap-lab .gg-bar-fill.gg-validation-fill { background: var(--gg-validation); }",
    ".generalization-gap-lab .gg-gap-track { overflow: visible; }",
    ".generalization-gap-lab .gg-gap-zero { position: absolute; top: -2px; bottom: -2px; left: 50%; border-left: 2px solid var(--fg); opacity: .55; }",
    ".generalization-gap-lab .gg-gap-fill { position: absolute; top: 0; height: 100%; min-width: 2px; border-radius: 3px; }",
    ".generalization-gap-lab .gg-gap-fill.gg-gap-negative-fill { background: var(--gg-validation); }",
    ".generalization-gap-lab .gg-gap-fill.gg-gap-positive-fill { background: var(--cl-gold, #9b6a12); }",
    ".generalization-gap-lab .gg-bar-value { text-align: right; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".generalization-gap-lab .gg-formula { margin-top: 12px; padding: 9px 10px; border-left: 3px solid var(--accent); background: var(--bg); color: var(--gg-muted); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: .86em; overflow-x: auto; white-space: nowrap; }",
    ".generalization-gap-lab .gg-status { min-height: 1.5em; margin: .75rem 0 0; }",
    "@media (max-width: 700px) { .generalization-gap-lab { margin-left: -8px; margin-right: -8px; padding: 14px; } .generalization-gap-lab .gg-controls,.generalization-gap-lab .gg-controls > .gg-control-section:last-child { grid-template-columns: minmax(0, 1fr); } .generalization-gap-lab .gg-controls > .gg-control-section:last-child { grid-column: auto; } .generalization-gap-lab .gg-controls > .gg-control-section:last-child h4 { grid-column: auto; } .generalization-gap-lab .gg-stage-frame { padding: 5px; } .generalization-gap-lab .gg-svg { min-width: 700px; } .generalization-gap-lab .gg-preset-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .generalization-gap-lab .gg-bar-row { grid-template-columns: 72px minmax(0, 1fr) 62px; gap: 6px; } }",
    "@media (prefers-reduced-motion: reduce) { .generalization-gap-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children) {
    var list;
    if (children === undefined || children === null) return node;
    list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : document.createTextNode(String(child)));
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
    var normalized = Math.abs(value) < EPSILON ? 0 : value;
    if (api && typeof api.format === "function") return api.format(normalized, digits);
    return normalized.toFixed(digits === undefined ? 3 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function signedFormat(api, value, digits) {
    var normalized = Math.abs(value) < EPSILON ? 0 : value;
    if (normalized > 0) return "+" + formatNumber(api, normalized, digits);
    return formatNumber(api, normalized, digits);
  }

  function normalisedX(x) {
    return (x - 5) / 5;
  }

  function basisAt(x, degree) {
    var basis = [1];
    var index;
    for (index = 1; index <= degree; index += 1) {
      basis.push(basis[index - 1] * normalisedX(x));
    }
    return basis;
  }

  function solve(matrix) {
    var size = matrix.length;
    var column;
    var row;
    var pivot;
    var swap;
    var divisor;
    var factor;
    var value;
    for (column = 0; column < size; column += 1) {
      pivot = column;
      for (row = column + 1; row < size; row += 1) {
        if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
      }
      if (Math.abs(matrix[pivot][column]) < EPSILON) return null;
      swap = matrix[column];
      matrix[column] = matrix[pivot];
      matrix[pivot] = swap;
      divisor = matrix[column][column];
      for (value = column; value <= size; value += 1) matrix[column][value] /= divisor;
      for (row = 0; row < size; row += 1) {
        if (row === column) continue;
        factor = matrix[row][column];
        for (value = column; value <= size; value += 1) {
          matrix[row][value] -= factor * matrix[column][value];
        }
      }
    }
    return matrix.map(function (line) { return line[size]; });
  }

  function fitPolynomial(points, degree, lambda) {
    var size = degree + 1;
    var matrix = [];
    var row;
    var column;
    var basis;
    var coefficients;
    for (row = 0; row < size; row += 1) {
      matrix.push([]);
      for (column = 0; column <= size; column += 1) matrix[row].push(0);
    }
    points.forEach(function (point) {
      basis = basisAt(point.x, degree);
      for (row = 0; row < size; row += 1) {
        for (column = 0; column < size; column += 1) {
          matrix[row][column] += basis[row] * basis[column];
        }
        matrix[row][size] += basis[row] * point.y;
      }
    });
    for (row = 0; row < size; row += 1) matrix[row][row] += lambda;
    coefficients = solve(matrix);
    if (!coefficients) throw new Error("无法为该预设求解多项式");
    return coefficients;
  }

  function predict(coefficients, x) {
    var z = normalisedX(x);
    var power = 1;
    var value = 0;
    coefficients.forEach(function (coefficient) {
      value += coefficient * power;
      power *= z;
    });
    return value;
  }

  function mse(coefficients, points) {
    var total = 0;
    points.forEach(function (point) {
      var error = predict(coefficients, point.x) - point.y;
      total += error * error;
    });
    return total / points.length;
  }

  function evaluatePreset(preset) {
    var coefficients = fitPolynomial(TRAIN, preset.degree, preset.lambda);
    var trainMSE = mse(coefficients, TRAIN);
    var validationMSE = mse(coefficients, VALIDATION);
    return {
      preset: preset,
      coefficients: coefficients,
      trainMSE: trainMSE,
      validationMSE: validationMSE,
      gap: validationMSE - trainMSE
    };
  }

  function svgText(api, x, y, text, attrs) {
    var merged = {
      x: x,
      y: y,
      "font-size": "12",
      fill: "currentColor"
    };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, "text", merged, [text]);
  }

  function plotX(x) {
    return PLOT.left + ((x - PLOT.xMin) / (PLOT.xMax - PLOT.xMin)) * PLOT.width;
  }

  function plotY(y) {
    return PLOT.top + PLOT.height - ((y - PLOT.yMin) / (PLOT.yMax - PLOT.yMin)) * PLOT.height;
  }

  function presetById(id) {
    var found = PRESETS[1];
    PRESETS.forEach(function (preset) {
      if (preset.id === id) found = preset;
    });
    return found;
  }

  function injectStyles(doc) {
    var style;
    if (doc.querySelector && doc.querySelector("style[data-gg-style]")) return;
    style = doc.createElement("style");
    style.setAttribute("data-gg-style", "true");
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function makeMetric(api, label, className) {
    var value = makeElement(api, "strong", {}, "-");
    return {
      card: makeElement(api, "div", { className: "gg-metric" + (className ? " " + className : "") }, [
        makeElement(api, "span", {}, label),
        value
      ]),
      value: value
    };
  }

  function makeBarRow(api, label, fillClass, valueLabel) {
    var fill = makeElement(api, "div", { className: "gg-bar-fill " + fillClass });
    var track = makeElement(api, "div", {
      className: "gg-bar-track",
      role: "img",
      "aria-label": valueLabel
    }, fill);
    var value = makeElement(api, "output", { className: "gg-bar-value" }, "-");
    return {
      row: makeElement(api, "div", { className: "gg-bar-row" }, [
        makeElement(api, "span", { className: "gg-bar-label" }, label),
        track,
        value
      ]),
      fill: fill,
      track: track,
      value: value
    };
  }

  function buildLab(root, api) {
    var doc = root.ownerDocument || document;
    var instanceId;
    var titleId;
    var stageTitleId;
    var descId;
    var clipId;
    var state = { presetId: "moderate" };
    var presetButtons = [];
    var stageModel;
    var stageSubtitle;
    var status;
    var svg;
    var svgDesc;
    var drawing;
    var trainMetric;
    var validationMetric;
    var gapMetric;
    var complexityMetric;
    var trainBar;
    var validationBar;
    var gapBar;

    INSTANCE += 1;
    instanceId = "generalization-gap-" + INSTANCE;
    titleId = instanceId + "-title";
    stageTitleId = instanceId + "-stage-title";
    descId = instanceId + "-desc";
    clipId = instanceId + "-clip";
    injectStyles(doc);
    root.classList.add("generalization-gap-lab");

    var shell = makeElement(api, "div", { className: "gg-shell" });
    shell.appendChild(makeElement(api, "h3", { className: "gg-heading" }, "训练误差、验证误差与泛化差"));
    shell.appendChild(makeElement(api, "p", { className: "gg-intro" }, "固定的传感器标定玩具数据：绿色圆点是训练点，蓝色方点是保留的验证点；曲线和三个 MSE 都由本页脚本确定性计算。它是课堂演示器，不是生产训练引擎。"));

    var layout = makeElement(api, "div", { className: "gg-layout" });
    var controls = makeElement(api, "aside", { className: "gg-controls", "aria-label": "泛化差预设控制" });
    var presetSection = makeElement(api, "section", { className: "gg-control-section" });
    presetSection.appendChild(makeElement(api, "h4", {}, "预设模型（主要验收路径）"));
    var presetGrid = makeElement(api, "div", { className: "gg-preset-grid", role: "group", "aria-label": "模型预设" });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, "button", {
        type: "button",
        "aria-pressed": "false"
      }, preset.label);
      button.addEventListener("click", function () {
        state.presetId = preset.id;
        render(true);
      });
      preset.button = button;
      presetButtons.push(button);
      presetGrid.appendChild(button);
    });
    presetSection.appendChild(presetGrid);
    controls.appendChild(presetSection);

    var recipe = makeElement(api, "p", { className: "gg-recipe" }, "模型：f(x)=a₀+a₁z+…+a_d z^d，z=(x−5)/5；d 是多项式次数，λ 是岭式权重惩罚。每个预设都在同一训练点上求解，再在从未参与拟合的验证点上计算 MSE。" );
    controls.appendChild(recipe);

    var readingSection = makeElement(api, "section", { className: "gg-control-section" });
    readingSection.appendChild(makeElement(api, "h4", {}, "读图提示"));
    readingSection.appendChild(makeElement(api, "p", { className: "gg-note" }, "先点“欠拟合”“适度拟合”“插值 / 过拟合”，再点“正则化”。观察训练点附近的曲线、两条 MSE 条和带符号的 R_val − R_train；验证点默认一直可见。"));
    readingSection.appendChild(makeElement(api, "p", { className: "gg-note" }, "本演示只显示训练点与验证点；不提供独立终评数据的查看按钮，验证点始终是本实验用来选预设的保留点。"));
    controls.appendChild(readingSection);

    var stage = makeElement(api, "section", { className: "gg-stage", "aria-labelledby": stageTitleId });
    var stageFrame = makeElement(api, "div", { className: "gg-stage-frame" });
    var stageHead = makeElement(api, "div", { className: "gg-stage-head" });
    stageHead.appendChild(makeElement(api, "h4", { id: stageTitleId }, "传感器标定：训练点、验证点与模型曲线"));
    stageSubtitle = makeElement(api, "span", { className: "gg-stage-subtitle" });
    stageHead.appendChild(stageSubtitle);
    stageFrame.appendChild(stageHead);

    svg = makeSvg(api, "svg", {
      className: "gg-svg",
      viewBox: "0 0 760 345",
      role: "img",
      "aria-label": "传感器标定回归图：训练点、验证点、模型曲线以及训练和验证均方误差",
      "aria-labelledby": titleId + " " + descId
    });
    svg.appendChild(makeSvg(api, "title", { id: titleId }, "训练点、验证点与回归模型曲线"));
    svgDesc = makeSvg(api, "desc", { id: descId }, "图中绿色圆点为训练点，蓝色方点为验证点；模型曲线由当前预设的确定性多项式计算。右侧图例说明两类点，数值 MSE 在图下方显示。" );
    svg.appendChild(svgDesc);
    var defs = makeSvg(api, "defs", {});
    var clip = makeSvg(api, "clipPath", { id: clipId });
    clip.appendChild(makeSvg(api, "rect", {
      x: PLOT.left,
      y: PLOT.top,
      width: PLOT.width,
      height: PLOT.height
    }));
    defs.appendChild(clip);
    svg.appendChild(defs);
    drawing = makeSvg(api, "g", { className: "gg-drawing" });
    svg.appendChild(drawing);
    stageFrame.appendChild(makeElement(api, "div", { className: "gg-chart-scroll" }, svg));

    stageFrame.appendChild(makeElement(api, "div", { className: "gg-legend", "aria-label": "图例" }, [
      makeElement(api, "span", { className: "gg-legend-item" }, [makeElement(api, "i", { className: "gg-legend-dot" }), "训练点" ]),
      makeElement(api, "span", { className: "gg-legend-item" }, [makeElement(api, "i", { className: "gg-legend-square" }), "验证点（保留点）" ]),
      makeElement(api, "span", { className: "gg-legend-item" }, [makeElement(api, "i", { className: "gg-legend-line" }), "模型曲线" ])
    ]));

    trainMetric = makeMetric(api, "训练 MSE（R_train）");
    validationMetric = makeMetric(api, "验证 MSE（R_val）");
    gapMetric = makeMetric(api, "泛化差（R_val − R_train）", "gg-gap");
    complexityMetric = makeMetric(api, "模型复杂度");
    stageFrame.appendChild(makeElement(api, "div", { className: "gg-metrics" }, [
      trainMetric.card,
      validationMetric.card,
      gapMetric.card,
      complexityMetric.card
    ]));

    trainBar = makeBarRow(api, "训练 MSE", "gg-train-fill", "训练 MSE 对照条");
    validationBar = makeBarRow(api, "验证 MSE", "gg-validation-fill", "验证 MSE 对照条");
    var gapTrack = makeElement(api, "div", {
      className: "gg-bar-track gg-gap-track",
      role: "img",
      "aria-label": "带符号泛化差对照条"
    });
    gapTrack.appendChild(makeElement(api, "span", { className: "gg-gap-zero" }));
    gapBar = makeElement(api, "div", { className: "gg-gap-fill" });
    gapTrack.appendChild(gapBar);
    var gapValue = makeElement(api, "output", { className: "gg-bar-value" }, "-");
    var gapRow = makeElement(api, "div", { className: "gg-bar-row" }, [
      makeElement(api, "span", { className: "gg-bar-label" }, "泛化差"),
      gapTrack,
      gapValue
    ]);
    gapBar.value = gapValue;
    gapBar.track = gapTrack;
    gapBar.row = gapRow;
    stageFrame.appendChild(makeElement(api, "div", { className: "gg-comparison", "aria-label": "训练与验证 MSE 对照" }, [
      trainBar.row,
      validationBar.row,
      gapRow
    ]));
    stageFrame.appendChild(makeElement(api, "div", { className: "gg-formula", role: "img", "aria-label": "训练均方误差、验证均方误差和泛化差的计算式" }, "R_train = (1/8)Σ_T(f(x)−y)²；R_val = (1/7)Σ_V(f(x)−y)²；gap = R_val − R_train"));
    status = makeElement(api, "p", { className: "gg-status", "aria-live": "polite", "aria-atomic": "true" });
    stageFrame.appendChild(status);
    stage.appendChild(stageFrame);
    layout.appendChild(controls);
    layout.appendChild(stage);
    shell.appendChild(layout);
    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function drawPoint(point, className, shape, label) {
      var group = makeSvg(api, "g", {
        role: "img",
        "aria-label": label + " " + point.id + "：x=" + point.x + "，y=" + point.y
      });
      group.appendChild(makeSvg(api, "title", {}, label + " " + point.id + "：x=" + point.x + "，y=" + point.y));
      if (shape === "square") {
        group.appendChild(makeSvg(api, "rect", {
          className: className,
          x: plotX(point.x) - 5.5,
          y: plotY(point.y) - 5.5,
          width: 11,
          height: 11,
          rx: 2
        }));
      } else {
        group.appendChild(makeSvg(api, "circle", {
          className: className,
          cx: plotX(point.x),
          cy: plotY(point.y),
          r: 5.5
        }));
      }
      return group;
    }

    function drawChart(result) {
      var grid;
      var curvePath = [];
      var index;
      var x;
      var y;
      clear(drawing);
      drawing.appendChild(makeSvg(api, "rect", {
        className: "gg-panel",
        x: PLOT.left,
        y: PLOT.top,
        width: PLOT.width,
        height: PLOT.height
      }));
      [0, 4, 8, 12, 16].forEach(function (tick) {
        y = plotY(tick);
        drawing.appendChild(makeSvg(api, "line", {
          className: "gg-grid-line",
          x1: PLOT.left,
          y1: y,
          x2: PLOT.left + PLOT.width,
          y2: y
        }));
        drawing.appendChild(svgText(api, PLOT.left - 8, y + 4, String(tick), {
          className: "gg-tick-label",
          "text-anchor": "end"
        }));
      });
      [0, 2, 4, 6, 8, 10].forEach(function (tick) {
        x = plotX(tick);
        drawing.appendChild(makeSvg(api, "line", {
          className: "gg-grid-line",
          x1: x,
          y1: PLOT.top,
          x2: x,
          y2: PLOT.top + PLOT.height
        }));
        drawing.appendChild(svgText(api, x, PLOT.top + PLOT.height + 17, String(tick), {
          className: "gg-tick-label",
          "text-anchor": "middle"
        }));
      });
      drawing.appendChild(makeSvg(api, "line", {
        className: "gg-axis-line",
        x1: PLOT.left,
        y1: PLOT.top + PLOT.height,
        x2: PLOT.left + PLOT.width,
        y2: PLOT.top + PLOT.height
      }));
      drawing.appendChild(makeSvg(api, "line", {
        className: "gg-axis-line",
        x1: PLOT.left,
        y1: PLOT.top,
        x2: PLOT.left,
        y2: PLOT.top + PLOT.height
      }));
      drawing.appendChild(svgText(api, PLOT.left + PLOT.width / 2, 322, "传感器原始读数 x", {
        className: "gg-axis-label",
        "text-anchor": "middle"
      }));
      drawing.appendChild(svgText(api, 14, PLOT.top + PLOT.height / 2, "校准值 y", {
        className: "gg-axis-label",
        transform: "rotate(-90 14 " + (PLOT.top + PLOT.height / 2) + ")",
        "text-anchor": "middle"
      }));
      for (index = 0; index <= PLOT.samples; index += 1) {
        x = PLOT.xMin + ((PLOT.xMax - PLOT.xMin) * index) / PLOT.samples;
        y = plotY(predict(result.coefficients, x));
        curvePath.push((index === 0 ? "M" : "L") + plotX(x).toFixed(2) + "," + y.toFixed(2));
      }
      drawing.appendChild(makeSvg(api, "path", {
        className: "gg-curve",
        d: curvePath.join(" "),
        "clip-path": "url(#" + clipId + ")"
      }));
      grid = makeSvg(api, "g", { "aria-label": "训练点和验证点" });
      TRAIN.forEach(function (point) {
        grid.appendChild(drawPoint(point, "gg-train-point", "circle", "训练点"));
      });
      VALIDATION.forEach(function (point) {
        grid.appendChild(drawPoint(point, "gg-validation-point", "square", "验证点"));
      });
      drawing.appendChild(grid);
      drawing.appendChild(svgText(api, 604, 51, "固定纵轴 0–16", { className: "gg-chart-note" }));
      drawing.appendChild(svgText(api, 604, 78, "训练点：" + TRAIN.length + " 个", { className: "gg-chart-note" }));
      drawing.appendChild(svgText(api, 604, 98, "验证点：" + VALIDATION.length + " 个", { className: "gg-chart-note" }));
      drawing.appendChild(svgText(api, 604, 133, "当前：d=" + result.preset.degree + "，λ=" + formatNumber(api, result.preset.lambda, 2), { className: "gg-chart-note" }));
      drawing.appendChild(svgText(api, 604, 169, "蓝色方点始终是验证集", { className: "gg-chart-note" }));
      drawing.appendChild(svgText(api, 604, 189, "不画独立终评点", { className: "gg-chart-note" }));
      drawing.appendChild(svgText(api, 604, 238, "gap = R_val − R_train", { className: "gg-chart-note" }));
      drawing.appendChild(svgText(api, 604, 258, "可为负", { className: "gg-chart-note" }));
    }

    function render(announceSelection) {
      var preset = presetById(state.presetId);
      var result = evaluatePreset(preset);
      var maxBar = Math.max(result.trainMSE, result.validationMSE, Math.abs(result.gap), 0.001);
      var gapWidth = Math.min(50, (Math.abs(result.gap) / maxBar) * 50);
      var gapClass = result.gap < -EPSILON ? "gg-gap-negative" : (result.gap > EPSILON ? "gg-gap-positive" : "");
      presetButtons.forEach(function (button, index) {
        button.setAttribute("aria-pressed", PRESETS[index].id === preset.id ? "true" : "false");
      });
      stageModel.textContent = preset.label;
      stageSubtitle.textContent = "d=" + preset.degree + "，λ=" + formatNumber(api, preset.lambda, 2);
      trainMetric.value.textContent = formatNumber(api, result.trainMSE, 3);
      validationMetric.value.textContent = formatNumber(api, result.validationMSE, 3);
      gapMetric.value.textContent = signedFormat(api, result.gap, 3);
      complexityMetric.value.textContent = "d=" + preset.degree + "，λ=" + formatNumber(api, preset.lambda, 2);
      gapMetric.card.className = "gg-metric gg-gap" + (gapClass ? " " + gapClass : "");
      trainBar.fill.style.width = Math.max(2, (result.trainMSE / maxBar) * 100) + "%";
      validationBar.fill.style.width = Math.max(2, (result.validationMSE / maxBar) * 100) + "%";
      trainBar.value.textContent = formatNumber(api, result.trainMSE, 3);
      validationBar.value.textContent = formatNumber(api, result.validationMSE, 3);
      trainBar.track.setAttribute("aria-label", "训练 MSE=" + formatNumber(api, result.trainMSE, 3));
      validationBar.track.setAttribute("aria-label", "验证 MSE=" + formatNumber(api, result.validationMSE, 3));
      gapBar.className = "gg-gap-fill " + (result.gap < 0 ? "gg-gap-negative-fill" : "gg-gap-positive-fill");
      gapBar.style.width = gapWidth + "%";
      gapBar.style.left = result.gap < 0 ? (50 - gapWidth) + "%" : "50%";
      gapBar.value.textContent = signedFormat(api, result.gap, 3);
      gapBar.track.setAttribute("aria-label", "泛化差 R_val−R_train=" + signedFormat(api, result.gap, 3));
      drawChart(result);
      svg.setAttribute("aria-label", "当前为" + preset.label + "；训练 MSE=" + formatNumber(api, result.trainMSE, 3) + "；验证 MSE=" + formatNumber(api, result.validationMSE, 3) + "；泛化差 R_val−R_train=" + signedFormat(api, result.gap, 3) + "。图中绿色圆点为训练点，蓝色方点为验证点。" );
      svgDesc.textContent = "当前预设为" + preset.label + "，多项式次数 d=" + preset.degree + "，lambda=" + formatNumber(api, preset.lambda, 2) + "；训练 MSE=" + formatNumber(api, result.trainMSE, 3) + "，验证 MSE=" + formatNumber(api, result.validationMSE, 3) + "，泛化差 R_val−R_train=" + signedFormat(api, result.gap, 3) + "。绿色圆点是训练点，蓝色方点是验证点；没有额外终评数据。";
      status.textContent = preset.label + "：训练 MSE=" + formatNumber(api, result.trainMSE, 3) + "，验证 MSE=" + formatNumber(api, result.validationMSE, 3) + "，泛化差 R_val−R_train=" + signedFormat(api, result.gap, 3) + "。泛化差是两个经验 MSE 的差，不是总体真实风险。";
      if (announceSelection) announce(status.textContent);
    }

    stageModel = makeElement(api, "span", { className: "cl-sr-only" }, "");
    stageHead.insertBefore(stageModel, stageHead.firstChild);
    render(false);
  }

  window.CourseLearning.register("generalization-gap", function (root, api) {
    buildLab(root, api);
  });
}());
