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
  var EPSILON = 1e-9;
  var instanceCount = 0;

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
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(
        child && child.nodeType ? child : doc.createTextNode(String(child))
      );
    });
    return node;
  }

  function makeElement(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children, doc);
  }

  function makeSvg(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}),
      children,
      doc
    );
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function format(api, value, digits) {
    if (api && typeof api.format === "function") return api.format(value, digits);
    var places = digits === undefined ? 3 : digits;
    return Number(value).toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalize(theta) {
    var value = theta % TWO_PI;
    return value < 0 ? value + TWO_PI : value;
  }

  function degree(theta) {
    var value = Math.round((normalize(theta) * 180) / Math.PI);
    return value === 360 ? 0 : value;
  }

  function directionLabel(theta) {
    var value = degree(theta);
    if (value === 0) return "+z";
    if (value === 90) return "+x";
    if (value === 180) return "-z";
    if (value === 270) return "-x";
    return "θ=" + value + "°";
  }

  function probabilities(thetaM, thetaS) {
    var halfDelta = (thetaM - thetaS) / 2;
    return {
      plus: Math.pow(Math.cos(halfDelta), 2),
      minus: Math.pow(Math.sin(halfDelta), 2)
    };
  }

  function percentage(value) {
    return (clamp(value, 0, 1) * 100).toFixed(1) + "%";
  }

  function vector(theta, center, radius) {
    return {
      x: center.x + radius * Math.sin(theta),
      y: center.y - radius * Math.cos(theta)
    };
  }

  function svgText(api, doc, x, y, text, attrs) {
    var merged = {
      x: x,
      y: y,
      "font-size": "14",
      fill: "currentColor"
    };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, doc, "text", merged, [text]);
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-qme-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-qme-style", "true");
    style.textContent = [
      ".qme-lab { --qme-state: var(--cl-green, #39734d); --qme-measure: var(--accent, #315f9d); --qme-muted: var(--fg-soft, #6b6557); --qme-border: var(--border, #d7d0c2); --qme-track: var(--block-bg, #f4f1e9); color: var(--fg, #292722); font-size: .95em; line-height: 1.55; }",
      ".qme-lab *, .qme-lab *::before, .qme-lab *::after { box-sizing: border-box; }",
      ".qme-lab .qme-shell { min-width: 0; }",
      ".qme-lab .qme-heading { margin: 0 0 .25rem; color: var(--accent, #315f9d); font-size: 1.25rem; }",
      ".qme-lab .qme-intro, .qme-lab .qme-note, .qme-lab .qme-status { color: var(--qme-muted); }",
      ".qme-lab .qme-intro { margin: 0 0 1rem; }",
      ".qme-lab .qme-grid { display: grid; grid-template-columns: minmax(190px, .72fr) minmax(0, 1.28fr); gap: 20px; align-items: start; }",
      ".qme-lab .qme-controls, .qme-lab .qme-stage { min-width: 0; }",
      ".qme-lab .qme-section { margin-top: 1rem; padding-top: .9rem; border-top: 1px solid var(--qme-border); }",
      ".qme-lab .qme-section:first-child { margin-top: 0; padding-top: 0; border-top: 0; }",
      ".qme-lab h4 { margin: 0 0 .45rem; font-size: 1rem; }",
      ".qme-lab .qme-section p { margin: .45rem 0; }",
      ".qme-lab .qme-button-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }",
      ".qme-lab .qme-axis-row { grid-template-columns: repeat(4, minmax(0, 1fr)); }",
      ".qme-lab .qme-action-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }",
      ".qme-lab .qme-demo-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }",
      ".qme-lab .qme-button { min-width: 0; min-height: 44px; padding: 7px 9px; border: 1px solid var(--qme-border); border-radius: 6px; background: var(--bg, #fff); color: inherit; cursor: pointer; font: inherit; line-height: 1.35; overflow-wrap: anywhere; }",
      ".qme-lab .qme-button:hover:not(:disabled) { border-color: var(--qme-measure); }",
      ".qme-lab .qme-button[aria-pressed=true], .qme-lab .qme-button.qme-primary { border-color: var(--qme-measure); background: var(--qme-measure); color: var(--bg, #fff); }",
      ".qme-lab .qme-button:disabled { cursor: not-allowed; opacity: .5; }",
      ".qme-lab .qme-button:focus-visible, .qme-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".qme-lab .qme-field { display: grid; gap: 5px; margin-top: .55rem; }",
      ".qme-lab .qme-field-caption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px; color: var(--qme-muted); font-size: .9em; font-weight: 650; }",
      ".qme-lab .qme-output { color: var(--qme-measure); font-variant-numeric: tabular-nums; }",
      ".qme-lab input[type=range] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--qme-measure); }",
      ".qme-lab .qme-small { color: var(--qme-muted); font-size: .86em; }",
      ".qme-lab .qme-state-line { margin: .8rem 0 0; color: var(--qme-state); font-weight: 700; }",
      ".qme-lab .qme-stage-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; }",
      ".qme-lab .qme-svg { display: block; width: 100%; max-width: 100%; height: auto; color: inherit; }",
      ".qme-lab .qme-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
      ".qme-lab .qme-circle { fill: none; stroke: var(--qme-border); stroke-width: 2; }",
      ".qme-lab .qme-axis-line { fill: none; stroke: var(--qme-muted); stroke-dasharray: 4 5; stroke-width: 1.2; }",
      ".qme-lab .qme-state-line { stroke: var(--qme-state); stroke-width: 4; }",
      ".qme-lab .qme-measure-line { stroke: var(--qme-measure); stroke-width: 3; }",
      ".qme-lab .qme-measure-negative { stroke: var(--qme-measure); stroke-dasharray: 5 5; stroke-width: 1.6; }",
      ".qme-lab .qme-state-point { fill: var(--qme-state); }",
      ".qme-lab .qme-center { fill: var(--fg, #292722); }",
      ".qme-lab .qme-state-label { fill: var(--qme-state) !important; font-weight: 750; }",
      ".qme-lab .qme-measure-label { fill: var(--qme-measure) !important; font-weight: 750; }",
      ".qme-lab .qme-muted-label { fill: var(--qme-muted) !important; font-size: 12px; }",
      ".qme-lab .qme-legend-line { stroke-width: 3; }",
      ".qme-lab .qme-beam { fill: none; stroke: var(--qme-muted); stroke-width: 2; }",
      ".qme-lab .qme-split { fill: var(--qme-measure); }",
      ".qme-lab .qme-outcomes { margin-top: .7rem; }",
      ".qme-lab .qme-outcome-row { display: grid; grid-template-columns: 76px minmax(0, 1fr) 64px; gap: 8px; align-items: center; margin-top: 7px; }",
      ".qme-lab .qme-outcome-label { font-weight: 700; }",
      ".qme-lab .qme-bar-track { height: 20px; overflow: hidden; border: 1px solid var(--qme-border); border-radius: 4px; background: var(--qme-track); }",
      ".qme-lab .qme-bar-fill { height: 100%; width: 0; }",
      ".qme-lab .qme-bar-plus { background: var(--qme-state); }",
      ".qme-lab .qme-bar-minus { background: var(--qme-measure); }",
      ".qme-lab .qme-probability { text-align: right; font-variant-numeric: tabular-nums; }",
      ".qme-lab .qme-formula { margin: .8rem 0 0; padding: 8px 10px; overflow-x: auto; border-left: 3px solid var(--qme-measure); background: var(--bg, #fff); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: .88em; }",
      ".qme-lab .qme-status { min-height: 1.5em; margin: .7rem 0 0; }",
      ".qme-lab .qme-history { max-height: 12rem; margin: .45rem 0 0; padding-left: 1.35rem; overflow-y: auto; color: var(--qme-muted); font-size: .88em; }",
      ".qme-lab .qme-history li { margin: .3rem 0; padding-left: 2px; overflow-wrap: anywhere; }",
      ".qme-lab .qme-callout { margin-top: 1rem; padding-top: .75rem; border-top: 1px solid var(--qme-border); color: var(--qme-muted); font-size: .88em; }",
      "@media (max-width: 700px) { .qme-lab { margin-left: -8px; margin-right: -8px; padding: 14px; } .qme-lab .qme-grid { grid-template-columns: minmax(0, 1fr); } .qme-lab .qme-svg { min-width: 0; } .qme-lab .qme-action-row, .qme-lab .qme-demo-row { grid-template-columns: minmax(0, 1fr); } }",
      "@media (prefers-reduced-motion: reduce) { .qme-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    var host = doc.head || doc.documentElement || doc.body;
    if (host) host.appendChild(style);
  }

  function makeMarker(api, doc, id, className) {
    var marker = makeSvg(api, doc, "marker", {
      id: id,
      viewBox: "0 0 8 8",
      markerWidth: "8",
      markerHeight: "8",
      refX: "7",
      refY: "4",
      orient: "auto",
      markerUnits: "userSpaceOnUse"
    });
    marker.appendChild(makeSvg(api, doc, "path", { d: "M0,0 L8,4 L0,8 Z", className: className }));
    return marker;
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    injectStyles(doc);
    root.classList.add("qme-lab");

    instanceCount += 1;
    var serial = instanceCount;
    var ids = {
      analyzer: "qme-analyzer-" + serial,
      svgTitle: "qme-svg-title-" + serial,
      svgDesc: "qme-svg-desc-" + serial,
      stateMarker: "qme-state-marker-" + serial,
      measureMarker: "qme-measure-marker-" + serial
    };
    var center = { x: 157, y: 137 };
    var radius = 102;
    var state = {
      thetaS: 0,
      thetaM: 0,
      preparation: "+z",
      history: [],
      message: "当前显示 +z 沿 z 轴测量的确定性结果。"
    };

    var shell = makeElement(api, doc, "div", { className: "qme-shell" });
    shell.appendChild(makeElement(api, doc, "h3", { className: "qme-heading" }, "Stern–Gerlach：二能级投影测量实验台"));
    shell.appendChild(makeElement(api, doc, "p", { className: "qme-intro" }, "绿色是制备态，蓝色是分析器的 + 方向；概率条按 Born 公式直接计算。选择分支只更新后续状态，不替你抽样一次随机结果。"));

    var grid = makeElement(api, doc, "div", { className: "qme-grid" });
    var controls = makeElement(api, doc, "aside", { className: "qme-controls", "aria-label": "量子测量控制" });
    var stage = makeElement(api, doc, "section", { className: "qme-stage", "aria-labelledby": "qme-stage-title-" + serial });

    var preparationSection = makeElement(api, doc, "div", { className: "qme-section" });
    preparationSection.appendChild(makeElement(api, doc, "h4", {}, "制备态 θ_s"));
    preparationSection.appendChild(makeElement(api, doc, "p", { className: "qme-small" }, "选择一个 Bloch 大圆上的二能级纯态。"));
    var preparationButtons = makeElement(api, doc, "div", { className: "qme-button-row", role: "group", "aria-label": "制备态预设" });
    var preparationPresets = [
      { label: "+z", theta: 0 },
      { label: "+x", theta: Math.PI / 2 },
      { label: "-z", theta: Math.PI }
    ];
    preparationPresets.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { className: "qme-button", type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        state.thetaS = preset.theta;
        state.preparation = preset.label;
        state.history = [];
        state.message = "已重置为 " + preset.label + "；请先预测再调分析器。";
        render();
        announce(state.message);
      });
      preset.button = button;
      preparationButtons.appendChild(button);
    });
    preparationSection.appendChild(preparationButtons);
    controls.appendChild(preparationSection);

    var analyzerSection = makeElement(api, doc, "div", { className: "qme-section" });
    analyzerSection.appendChild(makeElement(api, doc, "h4", {}, "分析器方向 θ_m"));
    var analyzerLabel = makeElement(api, doc, "label", { className: "qme-field", htmlFor: ids.analyzer });
    var analyzerCaption = makeElement(api, doc, "span", { className: "qme-field-caption" });
    analyzerCaption.appendChild(doc.createTextNode("从 +z 朝 +x 计角度"));
    var analyzerOutput = makeElement(api, doc, "output", { className: "qme-output", htmlFor: ids.analyzer }, "0° (+z)");
    analyzerCaption.appendChild(analyzerOutput);
    analyzerLabel.appendChild(analyzerCaption);
    var analyzerInput = makeElement(api, doc, "input", {
      id: ids.analyzer,
      type: "range",
      min: "0",
      max: "360",
      step: "1",
      value: "0",
      "aria-label": "分析器角度 theta_m"
    });
    analyzerLabel.appendChild(analyzerInput);
    analyzerSection.appendChild(analyzerLabel);
    var analyzerButtons = makeElement(api, doc, "div", { className: "qme-button-row qme-axis-row", role: "group", "aria-label": "分析器轴预设" });
    [
      { label: "z", theta: 0 },
      { label: "x", theta: Math.PI / 2 },
      { label: "-z", theta: Math.PI },
      { label: "-x", theta: 3 * Math.PI / 2 }
    ].forEach(function (preset) {
      var button = makeElement(api, doc, "button", { className: "qme-button", type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        state.thetaM = preset.theta;
        state.message = "分析器已调到 " + preset.label + "；现在比较两条概率。";
        render();
        announce(state.message);
      });
      preset.button = button;
      analyzerButtons.appendChild(button);
    });
    analyzerSection.appendChild(analyzerButtons);
    controls.appendChild(analyzerSection);

    var actionSection = makeElement(api, doc, "div", { className: "qme-section" });
    actionSection.appendChild(makeElement(api, doc, "h4", {}, "理想投影测量：条件保留分支"));
    actionSection.appendChild(makeElement(api, doc, "p", { className: "qme-small" }, "按钮代表选择性结果；概率为 0 的分支会被禁用。"));
    var actionButtons = makeElement(api, doc, "div", { className: "qme-action-row", role: "group", "aria-label": "选择投影测量分支" });
    var keepPlus = makeElement(api, doc, "button", { className: "qme-button qme-primary", type: "button" }, "保留 +");
    var keepMinus = makeElement(api, doc, "button", { className: "qme-button", type: "button" }, "保留 -");
    actionButtons.appendChild(keepPlus);
    actionButtons.appendChild(keepMinus);
    actionSection.appendChild(actionButtons);
    controls.appendChild(actionSection);

    var demoSection = makeElement(api, doc, "div", { className: "qme-section" });
    demoSection.appendChild(makeElement(api, doc, "h4", {}, "直接观察两种序列"));
    var demoButtons = makeElement(api, doc, "div", { className: "qme-demo-row", role: "group", "aria-label": "测量序列演示" });
    var repeatDemo = makeElement(api, doc, "button", { className: "qme-button", type: "button" }, "同轴重复：+z → z → z");
    var incompatibleDemo = makeElement(api, doc, "button", { className: "qme-button", type: "button" }, "不相容轴：+z → +x(选+) → z");
    demoButtons.appendChild(repeatDemo);
    demoButtons.appendChild(incompatibleDemo);
    demoSection.appendChild(demoButtons);
    var clearHistory = makeElement(api, doc, "button", { className: "qme-button", type: "button" }, "清除历史（保留当前态）");
    clearHistory.style.marginTop = "8px";
    demoSection.appendChild(clearHistory);
    controls.appendChild(demoSection);

    var stageHead = makeElement(api, doc, "div", { className: "qme-stage-head" });
    var stageTitle = makeElement(api, doc, "h4", { id: "qme-stage-title-" + serial }, "x–z Bloch 大圆与分束");
    var stageState = makeElement(api, doc, "span", { className: "qme-small" });
    stageHead.appendChild(stageTitle);
    stageHead.appendChild(stageState);
    stage.appendChild(stageHead);

    var svg = makeSvg(api, doc, "svg", {
      className: "qme-svg",
      viewBox: "0 0 560 315",
      role: "img",
      "aria-labelledby": ids.svgTitle + " " + ids.svgDesc
    });
    svg.appendChild(makeSvg(api, doc, "title", { id: ids.svgTitle }, "自旋 1/2 的 x-z Bloch 大圆、制备态与分析器方向"));
    var svgDesc = makeSvg(api, doc, "desc", { id: ids.svgDesc }, "二维大圆显示制备方向 theta_s 与分析器方向 theta_m；右侧用两条分束线表示加号和减号输出，概率由下方条形显示。");
    svg.appendChild(svgDesc);
    var defs = makeSvg(api, doc, "defs", {});
    defs.appendChild(makeMarker(api, doc, ids.stateMarker, "qme-state-point"));
    defs.appendChild(makeMarker(api, doc, ids.measureMarker, "qme-split"));
    svg.appendChild(defs);
    var drawing = makeSvg(api, doc, "g", { className: "qme-drawing" });
    svg.appendChild(drawing);
    stage.appendChild(svg);

    var outcomes = makeElement(api, doc, "div", { className: "qme-outcomes", "aria-label": "Born 概率分束" });
    var plusOutcome = makeOutcome(api, doc, "+ 输出", "qme-bar-plus", "+ 结果概率");
    var minusOutcome = makeOutcome(api, doc, "- 输出", "qme-bar-minus", "- 结果概率");
    outcomes.appendChild(plusOutcome.row);
    outcomes.appendChild(minusOutcome.row);
    stage.appendChild(outcomes);

    var formula = makeElement(api, doc, "div", { className: "qme-formula", role: "img", "aria-label": "自旋 1/2 测量的 Born 概率公式" }, "p(+)=cos²((θ_m−θ_s)/2)；p(−)=sin²((θ_m−θ_s)/2)");
    stage.appendChild(formula);
    var status = makeElement(api, doc, "p", { className: "qme-status", "aria-live": "polite", "aria-atomic": "true" });
    stage.appendChild(status);
    var historyTitle = makeElement(api, doc, "h4", { className: "qme-section" }, "测量历史 / 第二次测量");
    stage.appendChild(historyTitle);
    var historyList = makeElement(api, doc, "ol", { className: "qme-history" });
    stage.appendChild(historyList);
    stage.appendChild(makeElement(api, doc, "p", { className: "qme-callout" }, "读图边界：箭头是量子态与投影方向的参数化；条形是 Born 概率。这里没有隐藏的经典自旋箭头，也没有随机样本动画。"));

    grid.appendChild(controls);
    grid.appendChild(stage);
    shell.appendChild(grid);
    root.replaceChildren(shell);

    function makeOutcome(apiValue, docValue, label, fillClass, ariaLabel) {
      var row = makeElement(apiValue, docValue, "div", { className: "qme-outcome-row" });
      row.appendChild(makeElement(apiValue, docValue, "span", { className: "qme-outcome-label" }, label));
      var track = makeElement(apiValue, docValue, "div", {
        className: "qme-bar-track",
        role: "progressbar",
        "aria-label": ariaLabel,
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-valuenow": "0"
      });
      var fill = makeElement(apiValue, docValue, "div", { className: "qme-bar-fill " + fillClass });
      track.appendChild(fill);
      row.appendChild(track);
      var value = makeElement(apiValue, docValue, "output", { className: "qme-probability" }, "0.0%");
      row.appendChild(value);
      return { row: row, track: track, fill: fill, value: value };
    }

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function setHistory(item) {
      state.history.push(item);
      if (state.history.length > 16) state.history.shift();
    }

    function measurementItem(number, from, analyzer, result, tag) {
      return {
        number: number,
        from: from,
        analyzer: analyzer,
        plus: result.plus,
        minus: result.minus,
        tag: tag
      };
    }

    function selectBranch(branch, announceText) {
      var result = probabilities(state.thetaM, state.thetaS);
      var selectedProbability = branch === "+" ? result.plus : result.minus;
      if (selectedProbability < EPSILON) return;
      var measurementNumber = state.history.length + 1;
      setHistory(measurementItem(measurementNumber, state.thetaS, state.thetaM, result, "保留 " + branch));
      state.thetaS = normalize(state.thetaM + (branch === "+" ? 0 : Math.PI));
      state.preparation = directionLabel(state.thetaS) + "（投影后保留 " + branch + "）";
      state.message = announceText || ("已沿 " + directionLabel(state.thetaM) + " 轴测量，并条件保留 " + branch + "；后续态更新为 " + directionLabel(state.thetaS) + "。 ");
      render();
      announce(state.message);
    }

    function renderHistory() {
      clear(historyList);
      if (!state.history.length) {
        historyList.appendChild(makeElement(api, doc, "li", {}, "暂无记录；可点击“保留”或运行一条演示序列。"));
        return;
      }
      state.history.forEach(function (item) {
        var text = "第 " + item.number + " 次：测 " + directionLabel(item.analyzer) + " 轴，p(+)= " + percentage(item.plus) + "，p(-)= " + percentage(item.minus);
        if (item.tag) text += "；" + item.tag;
        historyList.appendChild(makeElement(api, doc, "li", {}, text));
      });
    }

    function drawDiagram(result) {
      clear(drawing);
      var statePoint = vector(state.thetaS, center, radius);
      var measurePoint = vector(state.thetaM, center, radius);
      var negativePoint = vector(state.thetaM + Math.PI, center, radius);
      drawing.appendChild(makeSvg(api, doc, "circle", { className: "qme-circle", cx: center.x, cy: center.y, r: radius }));
      drawing.appendChild(makeSvg(api, doc, "line", { className: "qme-axis-line", x1: center.x - radius, y1: center.y, x2: center.x + radius, y2: center.y }));
      drawing.appendChild(makeSvg(api, doc, "line", { className: "qme-axis-line", x1: center.x, y1: center.y - radius, x2: center.x, y2: center.y + radius }));
      drawing.appendChild(svgText(api, doc, center.x + radius + 8, center.y + 5, "+x", { className: "qme-muted-label" }));
      drawing.appendChild(svgText(api, doc, center.x - radius - 27, center.y + 5, "-x", { className: "qme-muted-label" }));
      drawing.appendChild(svgText(api, doc, center.x + 6, center.y - radius - 10, "+z", { className: "qme-muted-label" }));
      drawing.appendChild(svgText(api, doc, center.x + 6, center.y + radius + 18, "-z", { className: "qme-muted-label" }));
      drawing.appendChild(makeSvg(api, doc, "line", {
        className: "qme-measure-negative",
        x1: negativePoint.x,
        y1: negativePoint.y,
        x2: measurePoint.x,
        y2: measurePoint.y
      }));
      drawing.appendChild(makeSvg(api, doc, "line", {
        className: "qme-measure-line",
        x1: center.x,
        y1: center.y,
        x2: measurePoint.x,
        y2: measurePoint.y,
        "marker-end": "url(#" + ids.measureMarker + ")"
      }));
      drawing.appendChild(makeSvg(api, doc, "line", {
        className: "qme-state-line",
        x1: center.x,
        y1: center.y,
        x2: statePoint.x,
        y2: statePoint.y,
        "marker-end": "url(#" + ids.stateMarker + ")"
      }));
      drawing.appendChild(makeSvg(api, doc, "circle", { className: "qme-center", cx: center.x, cy: center.y, r: 4 }));
      drawing.appendChild(svgText(api, doc, statePoint.x + (statePoint.x < center.x ? -9 : 9), statePoint.y - 9, "θ_s=" + degree(state.thetaS) + "° " + directionLabel(state.thetaS), { className: "qme-state-label", "text-anchor": statePoint.x < center.x ? "end" : "start" }));
      drawing.appendChild(svgText(api, doc, measurePoint.x + (measurePoint.x < center.x ? -9 : 9), measurePoint.y + 18, "θ_m=" + degree(state.thetaM) + "° " + directionLabel(state.thetaM), { className: "qme-measure-label", "text-anchor": measurePoint.x < center.x ? "end" : "start" }));
      drawing.appendChild(svgText(api, doc, negativePoint.x + (negativePoint.x < center.x ? -9 : 9), negativePoint.y + 16, "−", { className: "qme-measure-label", "text-anchor": negativePoint.x < center.x ? "end" : "start" }));
      drawing.appendChild(svgText(api, doc, 314, 30, "同一条 x–z 大圆：y=0", { className: "qme-muted-label" }));

      var splitX = 387;
      var splitY = 153;
      drawing.appendChild(svgText(api, doc, 330, 94, "理想分析器分束", { className: "qme-muted-label" }));
      drawing.appendChild(makeSvg(api, doc, "line", { className: "qme-beam", x1: 300, y1: splitY, x2: splitX, y2: splitY }));
      drawing.appendChild(makeSvg(api, doc, "line", { className: "qme-beam", x1: splitX, y1: splitY, x2: 505, y2: 108, "marker-end": "url(#" + ids.measureMarker + ")" }));
      drawing.appendChild(makeSvg(api, doc, "line", { className: "qme-beam", x1: splitX, y1: splitY, x2: 505, y2: 198, "marker-end": "url(#" + ids.measureMarker + ")" }));
      drawing.appendChild(makeSvg(api, doc, "circle", { className: "qme-split", cx: splitX, cy: splitY, r: 4 }));
      drawing.appendChild(svgText(api, doc, 512, 104, "+", { className: "qme-measure-label" }));
      drawing.appendChild(svgText(api, doc, 512, 202, "−", { className: "qme-measure-label" }));
      drawing.appendChild(svgText(api, doc, 302, 176, "θ_m", { className: "qme-measure-label" }));
      drawing.appendChild(svgText(api, doc, 314, 245, "概率由下方条形给出，不按单次事件动画", { className: "qme-muted-label" }));
      svgDesc.textContent = "x-z 大圆中，制备态为 " + directionLabel(state.thetaS) + "（theta_s=" + degree(state.thetaS) + "°），分析器 + 方向为 " + directionLabel(state.thetaM) + "（theta_m=" + degree(state.thetaM) + "°）；Born 概率为加号 " + percentage(result.plus) + "、减号 " + percentage(result.minus) + "。";
    }

    function render() {
      var result = probabilities(state.thetaM, state.thetaS);
      analyzerInput.value = String(degree(state.thetaM));
      analyzerOutput.textContent = degree(state.thetaM) + "° (" + directionLabel(state.thetaM) + ")";
      stageState.textContent = "当前态：" + state.preparation + "，θ_s=" + degree(state.thetaS) + "°";
      status.textContent = state.message;
      plusOutcome.fill.style.width = percentage(result.plus);
      minusOutcome.fill.style.width = percentage(result.minus);
      plusOutcome.value.textContent = percentage(result.plus);
      minusOutcome.value.textContent = percentage(result.minus);
      plusOutcome.track.setAttribute("aria-valuenow", String((result.plus * 100).toFixed(1)));
      minusOutcome.track.setAttribute("aria-valuenow", String((result.minus * 100).toFixed(1)));
      plusOutcome.track.setAttribute("aria-valuetext", percentage(result.plus));
      minusOutcome.track.setAttribute("aria-valuetext", percentage(result.minus));
      keepPlus.disabled = result.plus < EPSILON;
      keepMinus.disabled = result.minus < EPSILON;
      preparationPresets.forEach(function (preset) {
        preset.button.setAttribute("aria-pressed", Math.abs(normalize(state.thetaS - preset.theta)) < 0.001 ? "true" : "false");
      });
      analyzerButtons.querySelectorAll("button").forEach(function (button, index) {
        var theta = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2][index];
        button.setAttribute("aria-pressed", Math.abs(normalize(state.thetaM - theta)) < 0.001 ? "true" : "false");
      });
      formula.textContent = "p(+)=cos²((θ_m−θ_s)/2)=" + percentage(result.plus) + "；p(−)=sin²((θ_m−θ_s)/2)=" + percentage(result.minus);
      drawDiagram(result);
      renderHistory();
    }

    analyzerInput.addEventListener("input", function () {
      state.thetaM = (Number(analyzerInput.value) * Math.PI) / 180;
      state.message = "分析器角度为 " + degree(state.thetaM) + "°；请比较 p(+) 与 p(-)。";
      render();
    });
    keepPlus.addEventListener("click", function () { selectBranch("+"); });
    keepMinus.addEventListener("click", function () { selectBranch("-"); });
    repeatDemo.addEventListener("click", function () {
      state.thetaS = 0;
      state.thetaM = 0;
      state.preparation = "+z（第一次保留 + 后）";
      state.history = [];
      var first = probabilities(0, 0);
      setHistory(measurementItem(1, 0, 0, first, "第一次保留 +，状态仍为 +z"));
      setHistory(measurementItem(2, 0, 0, first, "同轴重复：p(+)=1，p(-)=0"));
      state.message = "同轴重复：第一次沿 z 轴保留 + 后，第二次沿同一 z 轴仍是 100% 的 +。";
      render();
      announce(state.message);
    });
    incompatibleDemo.addEventListener("click", function () {
      state.thetaS = 0;
      state.thetaM = Math.PI / 2;
      state.preparation = "+z";
      state.history = [];
      var first = probabilities(Math.PI / 2, 0);
      setHistory(measurementItem(1, 0, Math.PI / 2, first, "第一次在 x 轴条件保留 +，状态更新为 +x"));
      state.thetaS = Math.PI / 2;
      state.preparation = "+x（第一次投影后）";
      state.thetaM = 0;
      var second = probabilities(0, Math.PI / 2);
      setHistory(measurementItem(2, Math.PI / 2, 0, second, "插入不相容 x 轴后再测 z，恢复 1/2–1/2"));
      state.message = "+z → 选 +x → 再测 z：当前第二次测量为 1/2、1/2；不相容轴重新带来概率性。";
      render();
      announce(state.message);
    });
    clearHistory.addEventListener("click", function () {
      state.history = [];
      state.message = "历史已清除，当前态与当前分析器没有改变。";
      render();
      announce(state.message);
    });

    render();
  }

  window.CourseLearning.register("quantum-measurement", function (root, api) {
    mount(root, api);
  });
}());
