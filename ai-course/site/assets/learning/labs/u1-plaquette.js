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
  var PI = Math.PI;
  var TAU = 2 * PI;
  var TOLERANCE = 1e-9;
  var SERIAL = 0;
  var PRESET_ORDER = ["zero", "nonzero", "fixed"];
  var VERTICES = [
    { x: 170, y: 115, labelY: 47, thetaY: 65 },
    { x: 550, y: 115, labelY: 47, thetaY: 65 },
    { x: 550, y: 315, labelY: 391, thetaY: 409 },
    { x: 170, y: 315, labelY: 391, thetaY: 409 }
  ];
  var LINKS = [
    { id: "12", i: 0, j: 1, labelX: 360, labelY: 66, labelW: 142 },
    { id: "23", i: 1, j: 2, labelX: 650, labelY: 215, labelW: 132 },
    { id: "34", i: 2, j: 3, labelX: 360, labelY: 365, labelW: 142 },
    { id: "41", i: 3, j: 0, labelX: 82, labelY: 215, labelW: 132 }
  ];
  var PRESETS = {
    zero: {
      label: "零通量",
      psi: [0, PI / 2, PI, -PI / 2],
      links: [0.8, -1.2, 0.6, -0.2]
    },
    nonzero: {
      label: "非零通量",
      psi: [0.35, -0.8, 1.2, -2.0],
      links: [0.7, -0.4, 1.1, 0.9]
    },
    fixed: {
      label: "随机但固定",
      psi: [2.4, -1.7, 0.25, -2.65],
      links: [-2.4, 1.25, 2.05, -0.55]
    }
  };

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

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function makeElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs), children, doc);
  }

  function makeSvg(doc, tag, attrs, children) {
    return appendChildren(
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs),
      children,
      doc
    );
  }

  function replaceChildren(node) {
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren();
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-cl-u1-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-cl-u1-style", "true");
    style.textContent = [
      ".cl-u1-lab { --u1-panel: var(--block-bg, #f4f1e9); --u1-bg: var(--bg, #fff); --u1-fg: var(--fg, #292722); --u1-muted: var(--fg-soft, #6b6557); --u1-border: var(--border, #d7d0c2); --u1-accent: var(--cl-blue, #315f9d); --u1-good: var(--cl-green, #39734d); --u1-warn: var(--cl-red, #b64335); color: var(--u1-fg); font-size: .95em; line-height: 1.55; }",
      "html[data-theme=\"dark\"] .cl-u1-lab { --u1-accent: #83c8ff; --u1-good: #72bd8b; --u1-warn: #f08c7d; }",
      ".cl-u1-lab *, .cl-u1-lab *::before, .cl-u1-lab *::after { box-sizing: border-box; }",
      ".cl-u1-heading { margin: 0 0 .25rem; color: var(--u1-accent); font-size: 1.25rem; }",
      ".cl-u1-intro, .cl-u1-note, .cl-u1-status { color: var(--u1-muted); }",
      ".cl-u1-intro { margin: 0 0 1rem; }",
      ".cl-u1-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; align-items: start; }",
      ".cl-u1-controls, .cl-u1-stage { min-width: 0; }",
      ".cl-u1-controls { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, .9fr) minmax(0, 1.2fr); gap: 16px; align-items: start; }",
      ".cl-u1-section, .cl-u1-section:first-child { margin: 0; padding-top: .75rem; border-top: 1px solid var(--u1-border); }",
      ".cl-u1-section h4 { margin: 0 0 .45rem; font-size: 1rem; }",
      ".cl-u1-button-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }",
      ".cl-u1-vertex-row { grid-template-columns: repeat(4, minmax(0, 1fr)); }",
      ".cl-u1-action-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }",
      ".cl-u1-button { min-width: 0; min-height: 44px; padding: 7px 8px; border: 1px solid var(--u1-border); border-radius: 6px; background: var(--u1-bg); color: inherit; cursor: pointer; font: inherit; line-height: 1.35; overflow-wrap: anywhere; }",
      ".cl-u1-button:hover:not(:disabled) { border-color: var(--u1-accent); }",
      ".cl-u1-button[aria-pressed=true], .cl-u1-primary { border-color: var(--u1-accent); background: var(--u1-accent); color: var(--u1-bg); font-weight: 700; }",
      ".cl-u1-button:disabled { cursor: not-allowed; opacity: .5; }",
      ".cl-u1-button:focus-visible, .cl-u1-input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".cl-u1-field { display: grid; gap: 5px; margin-top: .65rem; }",
      ".cl-u1-field-caption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px; color: var(--u1-muted); font-size: .9em; font-weight: 650; }",
      ".cl-u1-output { color: var(--u1-accent); font-variant-numeric: tabular-nums; }",
      ".cl-u1-input[type=range] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--u1-accent); }",
      ".cl-u1-small { color: var(--u1-muted); font-size: .86em; }",
      ".cl-u1-selection { margin: .75rem 0 0; color: var(--u1-good); font-weight: 700; }",
      ".cl-u1-stage-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; }",
      ".cl-u1-stage-title { color: var(--u1-muted); font-size: .9em; }",
      ".cl-u1-svg-scroll { max-width: 100%; overflow-x: auto; border: 1px solid var(--u1-border); border-radius: 6px; background: var(--u1-bg); -webkit-overflow-scrolling: touch; }",
      ".cl-u1-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--u1-fg); }",
      ".cl-u1-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
      ".cl-u1-square { fill: none; stroke: var(--u1-border); stroke-width: 2; }",
      ".cl-u1-link { fill: none; stroke: var(--u1-accent); stroke-linecap: round; stroke-width: 3; }",
      ".cl-u1-link-hot { stroke: var(--u1-warn); stroke-width: 4; }",
      ".cl-u1-arrow { fill: var(--u1-accent); }",
      ".cl-u1-phase { fill: none; stroke: var(--u1-good); stroke-linecap: round; stroke-width: 4; }",
      ".cl-u1-phase-arrow { fill: var(--u1-good); }",
      ".cl-u1-ring { fill: var(--u1-panel); stroke: var(--u1-border); stroke-width: 2; }",
      ".cl-u1-center { fill: var(--u1-fg); }",
      ".cl-u1-selected { fill: none; stroke: var(--u1-warn); stroke-dasharray: 5 4; stroke-width: 3; }",
      ".cl-u1-vertex-label { fill: var(--u1-accent) !important; font-size: 18px; font-weight: 750; }",
      ".cl-u1-angle-label { fill: var(--u1-muted) !important; font-size: 13px; }",
      ".cl-u1-link-box, .cl-u1-w-box { fill: var(--u1-panel); stroke: var(--u1-border); stroke-width: 1; }",
      ".cl-u1-link-label { fill: var(--u1-fg) !important; font-size: 14px; font-weight: 650; }",
      ".cl-u1-w-label { fill: var(--u1-accent) !important; font-size: 15px; font-weight: 750; }",
      ".cl-u1-w-small { fill: var(--u1-muted) !important; font-size: 13px; }",
      ".cl-u1-legend { fill: var(--u1-muted) !important; font-size: 13px; }",
      ".cl-u1-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin-top: 10px; }",
      ".cl-u1-metric { min-width: 0; padding: 9px; border-top: 2px solid var(--u1-border); background: var(--u1-panel); }",
      ".cl-u1-metric span { display: block; color: var(--u1-muted); font-size: 11.5px; }",
      ".cl-u1-metric strong { display: block; margin-top: 3px; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }",
      ".cl-u1-check-wrap { max-width: 100%; overflow-x: auto; margin-top: 10px; }",
      ".cl-u1-check { width: 100%; min-width: 430px; border-collapse: collapse; font-size: .86em; }",
      ".cl-u1-check caption { margin-bottom: 5px; color: var(--u1-muted); text-align: left; }",
      ".cl-u1-check th, .cl-u1-check td { border-bottom: 1px solid var(--u1-border); padding: 6px 5px; text-align: left; vertical-align: top; }",
      ".cl-u1-check th { color: var(--u1-muted); font-weight: 650; }",
      ".cl-u1-pass { color: var(--u1-good); font-weight: 750; }",
      ".cl-u1-fail { color: var(--u1-warn); font-weight: 750; }",
      ".cl-u1-status { min-height: 1.5em; margin: .7rem 0 0; }",
      "@media (max-width: 700px) { .cl-u1-lab { margin-left: -8px; margin-right: -8px; padding: 14px; } .cl-u1-controls { grid-template-columns: minmax(0, 1fr); } .cl-u1-section { margin-top: 1rem; padding-top: .85rem; } .cl-u1-section:first-child { margin-top: 0; padding-top: 0; border-top: 0; } .cl-u1-svg { width: 690px; min-width: 690px; max-width: none; } .cl-u1-action-row { grid-template-columns: minmax(0, 1fr); } .cl-u1-metrics { grid-template-columns: minmax(0, 1fr); } }",
      "@media (prefers-reduced-motion: reduce) { .cl-u1-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    var host = doc.head || doc.documentElement || doc.body;
    if (host) host.appendChild(style);
  }

  function wrapAngle(value) {
    var result = value % TAU;
    if (result >= PI) result -= TAU;
    if (result < -PI) result += TAU;
    return result;
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatNumber(api, value, digits) {
    if (api && typeof api.format === "function") return api.format(value, digits);
    if (!Number.isFinite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    var text = value.toFixed(places);
    while (text.indexOf(".") >= 0 && text.charAt(text.length - 1) === "0") text = text.slice(0, -1);
    if (text.charAt(text.length - 1) === ".") text = text.slice(0, -1);
    return text;
  }

  function angleText(api, value) {
    var angle = wrapAngle(value);
    if (Math.abs(angle) < 0.0005) return "0";
    if (Math.abs(Math.abs(angle) - PI) < 0.0005) return "π";
    return (angle > 0 ? "+" : "−") + formatNumber(api, Math.abs(angle), 2) + " rad";
  }

  function cloneArray(values) {
    return values.map(function (value) { return wrapAngle(value); });
  }

  function complex(angle) {
    return { re: Math.cos(angle), im: Math.sin(angle) };
  }

  function multiply(left, right) {
    return {
      re: left.re * right.re - left.im * right.im,
      im: left.re * right.im + left.im * right.re
    };
  }

  function conjugate(value) {
    return { re: value.re, im: -value.im };
  }

  function magnitude(value) {
    return Math.sqrt(value.re * value.re + value.im * value.im);
  }

  function phase(value) {
    return wrapAngle(Math.atan2(value.im, value.re));
  }

  function distance(left, right) {
    return magnitude({ re: left.re - right.re, im: left.im - right.im });
  }

  function snapshot(state) {
    var psi = state.vertexPhases.map(complex);
    var links = state.linkAngles.map(complex);
    var plaquette = { re: 1, im: 0 };
    links.forEach(function (link) {
      plaquette = multiply(plaquette, link);
    });
    var matter = LINKS.map(function (link, index) {
      return multiply(
        conjugate(psi[link.i]),
        multiply(links[index], psi[link.j])
      );
    });
    return { plaquette: plaquette, matter: matter };
  }

  function stateFromPreset(id) {
    var preset = PRESETS[id];
    var state = {
      presetId: id,
      vertexPhases: cloneArray(preset.psi),
      linkAngles: cloneArray(preset.links),
      selected: 0,
      chi: PI / 3,
      lastAction: "已载入“" + preset.label + "”预设；等待施加局域变换。"
    };
    var initial = snapshot(state);
    state.lastCheck = { before: initial, after: initial };
    return state;
  }

  function makeMarker(doc, id, className) {
    var marker = makeSvg(doc, "marker", {
      id: id,
      viewBox: "0 0 8 8",
      markerWidth: "8",
      markerHeight: "8",
      refX: "7",
      refY: "4",
      orient: "auto",
      markerUnits: "userSpaceOnUse"
    });
    marker.appendChild(makeSvg(doc, "path", { d: "M0,0 L8,4 L0,8 Z", className: className }));
    return marker;
  }

  function segmentFor(link) {
    var source = VERTICES[link.j];
    var target = VERTICES[link.i];
    var dx = target.x - source.x;
    var dy = target.y - source.y;
    var length = Math.sqrt(dx * dx + dy * dy);
    var inset = 43;
    var ux = dx / length;
    var uy = dy / length;
    return {
      x1: source.x + ux * inset,
      y1: source.y + uy * inset,
      x2: target.x - ux * inset,
      y2: target.y - uy * inset
    };
  }

  function mount(root, api) {
    var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    injectStyles(doc);
    root.classList.add("cl-u1-lab");
    SERIAL += 1;
    var serial = SERIAL;
    var ids = {
      chi: "cl-u1-chi-" + serial,
      svgTitle: "cl-u1-svg-title-" + serial,
      svgDesc: "cl-u1-svg-desc-" + serial,
      arrow: "cl-u1-arrow-" + serial,
      phaseArrow: "cl-u1-phase-arrow-" + serial
    };
    var state = stateFromPreset("zero");
    var refs = {
      presetButtons: Object.create(null),
      vertexButtons: []
    };

    var shell = makeElement(doc, "div", { className: "cl-u1-shell" });
    shell.appendChild(makeElement(doc, "h3", { className: "cl-u1-heading" }, "U(1) 格点：局域重标相后什么不变？"));
    shell.appendChild(makeElement(doc, "p", { className: "cl-u1-intro" }, "四顶点方格用单位复数 ψᵢ 表示顶点相位，用 Uᵢⱼ=e^{iaᵢⱼ} 连接相邻点。选一个顶点、调 χᵢ，再施加 ψᵢ→e^{iχᵢ}ψᵢ 与 Uᵢⱼ→e^{iχᵢ}Uᵢⱼe^{-iχⱼ}；观察局部记号改变而规范不变量不变。"));

    var grid = makeElement(doc, "div", { className: "cl-u1-grid" });
    var controls = makeElement(doc, "div", { className: "cl-u1-controls" });
    var stage = makeElement(doc, "div", { className: "cl-u1-stage" });
    grid.appendChild(controls);
    grid.appendChild(stage);
    shell.appendChild(grid);

    var presetSection = makeElement(doc, "section", { className: "cl-u1-section" });
    presetSection.appendChild(makeElement(doc, "h4", {}, "预设：固定的链路角度"));
    var presetRow = makeElement(doc, "div", { className: "cl-u1-button-row", role: "group", "aria-label": "方格预设" });
    PRESET_ORDER.forEach(function (id) {
      var button = makeElement(doc, "button", { type: "button", className: "cl-u1-button", "aria-pressed": id === state.presetId ? "true" : "false" }, PRESETS[id].label);
      button.addEventListener("click", function () { loadPreset(id); });
      refs.presetButtons[id] = button;
      presetRow.appendChild(button);
    });
    presetSection.appendChild(presetRow);
    controls.appendChild(presetSection);

    var vertexSection = makeElement(doc, "section", { className: "cl-u1-section" });
    vertexSection.appendChild(makeElement(doc, "h4", {}, "选择施加 χ 的顶点"));
    var vertexRow = makeElement(doc, "div", { className: "cl-u1-button-row cl-u1-vertex-row", role: "group", "aria-label": "选择顶点" });
    for (var vertexIndex = 0; vertexIndex < 4; vertexIndex += 1) {
      (function (index) {
        var button = makeElement(doc, "button", { type: "button", className: "cl-u1-button", "aria-pressed": index === state.selected ? "true" : "false", "aria-label": "选择顶点 " + (index + 1) }, "ψ" + (index + 1));
        button.addEventListener("click", function () { selectVertex(index); });
        button.addEventListener("keydown", function (event) {
          var key = event.key;
          if (key !== "ArrowRight" && key !== "ArrowDown" && key !== "ArrowLeft" && key !== "ArrowUp") return;
          event.preventDefault();
          var next = (index + (key === "ArrowRight" || key === "ArrowDown" ? 1 : 3)) % 4;
          selectVertex(next);
          refs.vertexButtons[next].focus();
        });
        refs.vertexButtons[index] = button;
        vertexRow.appendChild(button);
      }(vertexIndex));
    }
    vertexSection.appendChild(vertexRow);
    controls.appendChild(vertexSection);

    var chiSection = makeElement(doc, "section", { className: "cl-u1-section" });
    chiSection.appendChild(makeElement(doc, "h4", {}, "调节局域相位"));
    var chiCaption = makeElement(doc, "div", { className: "cl-u1-field-caption" });
    chiCaption.appendChild(makeElement(doc, "label", { htmlFor: ids.chi }, "χᵢ（rad）"));
    refs.chiOutput = makeElement(doc, "output", { className: "cl-u1-output", htmlFor: ids.chi }, angleText(api, state.chi));
    chiCaption.appendChild(refs.chiOutput);
    var chiField = makeElement(doc, "div", { className: "cl-u1-field" });
    chiField.appendChild(chiCaption);
    refs.chi = makeElement(doc, "input", { id: ids.chi, className: "cl-u1-input", type: "range", min: String(-PI), max: String(PI), step: "0.01", value: String(state.chi), "aria-label": "局域相位 χ" });
    refs.chi.addEventListener("input", function () {
      state.chi = wrapAngle(number(refs.chi.value, 0));
      render();
    });
    chiField.appendChild(refs.chi);
    chiField.appendChild(makeElement(doc, "p", { className: "cl-u1-small" }, "角度按模 2π 归一化；只在点击“施加局域变换”后改写格点数据。"));
    chiSection.appendChild(chiField);
    refs.selection = makeElement(doc, "p", { className: "cl-u1-selection", "aria-live": "polite" });
    chiSection.appendChild(refs.selection);
    var actionRow = makeElement(doc, "div", { className: "cl-u1-action-row" });
    refs.apply = makeElement(doc, "button", { type: "button", className: "cl-u1-button cl-u1-primary" }, "施加局域变换");
    refs.apply.addEventListener("click", applyTransform);
    actionRow.appendChild(refs.apply);
    refs.reset = makeElement(doc, "button", { type: "button", className: "cl-u1-button" }, "重置");
    refs.reset.addEventListener("click", function () { loadPreset("zero", true); });
    actionRow.appendChild(refs.reset);
    chiSection.appendChild(actionRow);
    controls.appendChild(chiSection);

    var stageHead = makeElement(doc, "div", { className: "cl-u1-stage-head" });
    stageHead.appendChild(makeElement(doc, "strong", {}, "四顶点方格"));
    stageHead.appendChild(makeElement(doc, "span", { className: "cl-u1-stage-title" }, "W = U12 U23 U34 U41；箭头方向为 j → i"));
    stage.appendChild(stageHead);
    var svgScroll = makeElement(doc, "div", { className: "cl-u1-svg-scroll" });
    refs.svg = makeSvg(doc, "svg", { className: "cl-u1-svg", viewBox: "0 0 720 435", role: "img", "aria-labelledby": ids.svgTitle + " " + ids.svgDesc });
    svgScroll.appendChild(refs.svg);
    stage.appendChild(svgScroll);
    refs.metrics = makeElement(doc, "div", { className: "cl-u1-metrics", "aria-label": "Wilson 回路数值" });
    stage.appendChild(refs.metrics);
    var checkWrap = makeElement(doc, "div", { className: "cl-u1-check-wrap" });
    refs.checkTable = makeElement(doc, "table", { className: "cl-u1-check" });
    checkWrap.appendChild(refs.checkTable);
    stage.appendChild(checkWrap);
    refs.status = makeElement(doc, "p", { className: "cl-u1-status", role: "status", "aria-live": "polite" });
    stage.appendChild(refs.status);
    refs.note = makeElement(doc, "p", { className: "cl-u1-note" }, "数值检验比较施加前后的复数，而不是比较被模 2π 折回的角度；因此跨过 −π/π 边界时仍能正确判断“不变”。");
    stage.appendChild(refs.note);

    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function selectVertex(index) {
      state.selected = index;
      state.lastAction = "已选择顶点 " + (index + 1) + "；尚未施加新的局域变换。";
      render();
      announce(state.lastAction);
    }

    function loadPreset(id, resetControls) {
      var next = stateFromPreset(id);
      if (!resetControls) {
        next.selected = state.selected;
        next.chi = state.chi;
      }
      state.presetId = next.presetId;
      state.vertexPhases = next.vertexPhases;
      state.linkAngles = next.linkAngles;
      state.selected = next.selected;
      state.chi = next.chi;
      state.lastCheck = next.lastCheck;
      state.lastAction = next.lastAction;
      render();
      announce(state.lastAction);
    }

    function applyTransform() {
      var before = snapshot(state);
      var charges = [0, 0, 0, 0];
      charges[state.selected] = state.chi;
      state.vertexPhases = state.vertexPhases.map(function (angle, index) {
        return wrapAngle(angle + charges[index]);
      });
      state.linkAngles = state.linkAngles.map(function (angle, index) {
        var link = LINKS[index];
        return wrapAngle(angle + charges[link.i] - charges[link.j]);
      });
      var after = snapshot(state);
      state.lastCheck = { before: before, after: after };
      state.lastAction = "已在顶点 " + (state.selected + 1) + " 施加 χ=" + angleText(api, state.chi) + "；检查 W 与四条带联络双线性组合。";
      render();
      announce(state.lastAction);
    }

    function renderControls() {
      PRESET_ORDER.forEach(function (id) {
        refs.presetButtons[id].setAttribute("aria-pressed", id === state.presetId ? "true" : "false");
      });
      refs.vertexButtons.forEach(function (button, index) {
        button.setAttribute("aria-pressed", index === state.selected ? "true" : "false");
      });
      refs.chi.value = String(state.chi);
      refs.chiOutput.textContent = angleText(api, state.chi);
      refs.selection.textContent = "当前选择：顶点 " + (state.selected + 1) + "（ψ" + (state.selected + 1) + "）；将施加 χ" + (state.selected + 1) + "=" + angleText(api, state.chi) + "。";
    }

    function renderSvg() {
      var current = snapshot(state);
      replaceChildren(refs.svg);
      var defs = makeSvg(doc, "defs");
      defs.appendChild(makeMarker(doc, ids.arrow, "cl-u1-arrow"));
      defs.appendChild(makeMarker(doc, ids.phaseArrow, "cl-u1-phase-arrow"));
      refs.svg.appendChild(defs);
      refs.svg.appendChild(makeSvg(doc, "title", { id: ids.svgTitle }, "U(1) 四顶点格点与局域规范变换"));
      refs.svg.appendChild(makeSvg(doc, "desc", { id: ids.svgDesc }, "四个带相位箭头的顶点和四条有向链路；显示 link angle、Wilson plaquette 相位以及选定顶点的局域变换。"));
      refs.svg.appendChild(makeSvg(doc, "text", { x: "18", y: "24", className: "cl-u1-legend" }, "Uij 的箭头表示 j → i；选中顶点的虚线圆环表示施加 χ 的位置"));
      refs.svg.appendChild(makeSvg(doc, "rect", { x: "126", y: "71", width: "468", height: "288", rx: "6", className: "cl-u1-square" }));

      LINKS.forEach(function (link, index) {
        var segment = segmentFor(link);
        var hot = link.i === state.selected || link.j === state.selected;
        refs.svg.appendChild(makeSvg(doc, "line", {
          x1: segment.x1,
          y1: segment.y1,
          x2: segment.x2,
          y2: segment.y2,
          className: "cl-u1-link" + (hot ? " cl-u1-link-hot" : ""),
          "marker-end": "url(#" + ids.arrow + ")"
        }));
        var boxX = link.labelX - link.labelW / 2;
        var boxY = link.labelY - 18;
        refs.svg.appendChild(makeSvg(doc, "rect", { x: boxX, y: boxY, width: link.labelW, height: "30", rx: "4", className: "cl-u1-link-box" }));
        refs.svg.appendChild(makeSvg(doc, "text", { x: link.labelX, y: link.labelY + 2, "text-anchor": "middle", className: "cl-u1-link-label" }, "U" + link.id + " · a" + link.id + "=" + angleText(api, state.linkAngles[index])));
      });

      VERTICES.forEach(function (vertex, index) {
        var angle = state.vertexPhases[index];
        var endX = vertex.x + 28 * Math.cos(angle);
        var endY = vertex.y - 28 * Math.sin(angle);
        refs.svg.appendChild(makeSvg(doc, "circle", { cx: vertex.x, cy: vertex.y, r: "35", className: "cl-u1-ring" }));
        if (index === state.selected) {
          refs.svg.appendChild(makeSvg(doc, "circle", { cx: vertex.x, cy: vertex.y, r: "45", className: "cl-u1-selected" }));
        }
        refs.svg.appendChild(makeSvg(doc, "line", { x1: vertex.x, y1: vertex.y, x2: endX, y2: endY, className: "cl-u1-phase", "marker-end": "url(#" + ids.phaseArrow + ")" }));
        refs.svg.appendChild(makeSvg(doc, "circle", { cx: vertex.x, cy: vertex.y, r: "4", className: "cl-u1-center" }));
        refs.svg.appendChild(makeSvg(doc, "text", { x: vertex.x, y: vertex.labelY, "text-anchor": "middle", className: "cl-u1-vertex-label" }, "ψ" + (index + 1)));
        refs.svg.appendChild(makeSvg(doc, "text", { x: vertex.x, y: vertex.thetaY, "text-anchor": "middle", className: "cl-u1-angle-label" }, "θ" + (index + 1) + "=" + angleText(api, angle)));
      });

      refs.svg.appendChild(makeSvg(doc, "rect", { x: "258", y: "178", width: "204", height: "75", rx: "6", className: "cl-u1-w-box" }));
      refs.svg.appendChild(makeSvg(doc, "text", { x: "360", y: "201", "text-anchor": "middle", className: "cl-u1-w-label" }, "W = U12 U23 U34 U41"));
      refs.svg.appendChild(makeSvg(doc, "text", { x: "360", y: "224", "text-anchor": "middle", className: "cl-u1-w-small" }, "arg W = " + angleText(api, phase(current.plaquette))));
      refs.svg.appendChild(makeSvg(doc, "text", { x: "360", y: "244", "text-anchor": "middle", className: "cl-u1-w-small" }, "|W| = " + formatNumber(api, magnitude(current.plaquette), 6)));
      refs.svg.appendChild(makeSvg(doc, "text", { x: "360", y: "423", "text-anchor": "middle", className: "cl-u1-legend" }, "局域变换会重新分配顶点相位与相邻 link angle，但闭合回路相位不变"));
    }

    function metric(label, value, good) {
      var card = makeElement(doc, "div", { className: "cl-u1-metric" });
      card.appendChild(makeElement(doc, "span", {}, label));
      card.appendChild(makeElement(doc, "strong", { className: good === false ? "cl-u1-fail" : "cl-u1-pass" }, value));
      return card;
    }

    function renderChecks() {
      var current = snapshot(state);
      var before = state.lastCheck.before;
      var after = state.lastCheck.after;
      var plaquetteDelta = distance(before.plaquette, after.plaquette);
      var matterDeltas = after.matter.map(function (value, index) {
        return distance(before.matter[index], value);
      });
      var allPass = plaquetteDelta <= TOLERANCE && matterDeltas.every(function (value) { return value <= TOLERANCE; });
      replaceChildren(refs.metrics);
      refs.metrics.appendChild(metric("当前 arg W", angleText(api, phase(current.plaquette)), true));
      refs.metrics.appendChild(metric("当前 |W|", formatNumber(api, magnitude(current.plaquette), 6), Math.abs(magnitude(current.plaquette) - 1) <= TOLERANCE));
      refs.metrics.appendChild(metric("本次 |ΔW|", formatNumber(api, plaquetteDelta, 3), plaquetteDelta <= TOLERANCE));

      replaceChildren(refs.checkTable);
      var caption = makeElement(doc, "caption", {}, "规范不变量数值核对（复数差的模；阈值 1e−9）");
      refs.checkTable.appendChild(caption);
      var head = makeElement(doc, "thead");
      var headRow = makeElement(doc, "tr");
      ["对象", "施加前相位 → 施加后相位", "|Δ|", "结果"].forEach(function (label) {
        headRow.appendChild(makeElement(doc, "th", { scope: "col" }, label));
      });
      head.appendChild(headRow);
      refs.checkTable.appendChild(head);
      var body = makeElement(doc, "tbody");
      var wRow = makeElement(doc, "tr");
      [
        "W = U12U23U34U41",
        angleText(api, phase(before.plaquette)) + " → " + angleText(api, phase(after.plaquette)),
        formatNumber(api, plaquetteDelta, 3),
        plaquetteDelta <= TOLERANCE ? "✓ 不变" : "需检查"
      ].forEach(function (value, index) {
        wRow.appendChild(makeElement(doc, index === 3 ? "td" : "td", { className: index === 3 ? (plaquetteDelta <= TOLERANCE ? "cl-u1-pass" : "cl-u1-fail") : "" }, value));
      });
      body.appendChild(wRow);
      LINKS.forEach(function (link, index) {
        var delta = matterDeltas[index];
        var row = makeElement(doc, "tr");
        [
          "ψ" + (link.i + 1) + "* U" + link.id + " ψ" + (link.j + 1),
          angleText(api, phase(before.matter[index])) + " → " + angleText(api, phase(after.matter[index])),
          formatNumber(api, delta, 3),
          delta <= TOLERANCE ? "✓ 不变" : "需检查"
        ].forEach(function (value, cellIndex) {
          row.appendChild(makeElement(doc, "td", { className: cellIndex === 3 ? (delta <= TOLERANCE ? "cl-u1-pass" : "cl-u1-fail") : "" }, value));
        });
        body.appendChild(row);
      });
      refs.checkTable.appendChild(body);
      refs.status.className = "cl-u1-status " + (allPass ? "cl-u1-pass" : "cl-u1-fail");
      refs.status.textContent = state.lastAction + " 数值验证：" + (allPass ? "通过，W 与 ψᵢ*Uᵢⱼψⱼ 均不变。" : "未通过，请检查角度约定。");
    }

    function render() {
      renderControls();
      renderSvg();
      renderChecks();
    }

    render();
  }

  window.CourseLearning.register("u1-plaquette", function (root, api) {
    mount(root, api);
  });
}());
