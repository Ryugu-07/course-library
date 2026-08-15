(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "noether-symmetry-lab-styles";
  var EPSILON = 1e-10;
  var SERIAL = 0;
  var INITIAL = { x: 1, y: 0.7, vx: 0.35, vy: 0.8 };
  var AXIS_INITIAL = { x: 1, y: 0, vx: 0.35, vy: 0 };
  var PRESETS = [
    {
      id: "isotropic",
      label: "各向同性 r=1",
      wx: 1,
      wy: 1,
      horizon: 12,
      initial: INITIAL
    },
    {
      id: "weak-breaking",
      label: "弱破缺 r=1.2",
      wx: 1,
      wy: 1.2,
      horizon: 12,
      initial: INITIAL
    },
    {
      id: "strong-breaking",
      label: "强破缺 r=1.8",
      wx: 1,
      wy: 1.8,
      horizon: 12,
      initial: INITIAL
    },
    {
      id: "axis-exception",
      label: "轴轨道例外",
      wx: 1,
      wy: 1.8,
      horizon: 12,
      initial: AXIS_INITIAL
    }
  ];
  var EXPECTED = {
    symmetry: "isotropic-constant",
    energy: "energy-constant",
    angular: "angular-oscillates"
  };

  var STYLE_TEXT = [
    ".ns-lab{--ns-blue:var(--accent,#315f9d);--ns-gold:var(--cl-gold,#9b6a12);--ns-green:var(--cl-green,#39734d);--ns-red:var(--cl-red,#b64335);--ns-muted:var(--fg-soft,#6b6557);box-sizing:border-box;max-width:100%;min-width:0;color:var(--fg);font-size:.95em;line-height:1.55;color-scheme:light dark}",
    "html[data-theme=dark] .ns-lab{--ns-blue:#83c8ff;--ns-gold:#e2b458;--ns-green:#72bd8b;--ns-red:#f08c7d;--ns-muted:#b8b2a7}",
    ".ns-lab *,.ns-lab *::before,.ns-lab *::after{box-sizing:border-box}",
    ".ns-lab [hidden]{display:none!important}",
    ".ns-lab .ns-note,.ns-lab .ns-feedback,.ns-lab .ns-interpretation{margin:0;color:var(--ns-muted);font-size:13px;line-height:1.7;overflow-wrap:anywhere}",
    ".ns-lab .ns-presets,.ns-lab .ns-actions,.ns-lab .ns-choice-row{display:flex;flex-wrap:wrap;gap:8px}",
    ".ns-lab .ns-presets{margin:12px 0}",
    ".ns-lab .ns-presets button{flex:1 1 145px}",
    ".ns-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}",
    ".ns-lab button:hover{border-color:var(--ns-blue)}",
    ".ns-lab button[aria-pressed=true],.ns-lab button.ns-primary{border-color:var(--ns-blue);background:var(--ns-blue);color:var(--bg);font-weight:700}",
    ".ns-lab button:focus-visible,.ns-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".ns-lab .ns-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 18px;margin:14px 0}",
    ".ns-lab .ns-control{display:grid;gap:5px;min-width:0}",
    ".ns-lab .ns-control label{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;color:var(--ns-muted);font-size:13px;font-weight:700}",
    ".ns-lab .ns-control output{color:var(--ns-blue);font-variant-numeric:tabular-nums}",
    ".ns-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ns-blue)}",
    ".ns-lab .ns-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--ns-gold);background:var(--block-bg,var(--bg))}",
    ".ns-lab .ns-predict h3{margin:0 0 10px;font-size:14px}",
    ".ns-lab .ns-question{margin:12px 0 6px;color:var(--fg);font-size:13px;font-weight:700}",
    ".ns-lab .ns-question:first-of-type{margin-top:0}",
    ".ns-lab .ns-choice-row button{flex:1 1 170px}",
    ".ns-lab .ns-actions{margin-top:12px}",
    ".ns-lab .ns-feedback{min-height:1.7em;margin-top:9px;font-weight:700}",
    ".ns-lab .ns-pass{color:var(--ns-green)}.ns-lab .ns-warn{color:var(--ns-red)}",
    ".ns-lab .ns-results{display:grid;gap:12px;margin-top:15px}",
    ".ns-lab .ns-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px}",
    ".ns-lab .ns-metric{min-width:0;padding:9px 10px;border-top:2px solid var(--border);background:var(--bg)}",
    ".ns-lab .ns-metric span{display:block;color:var(--ns-muted);font-size:11.5px}",
    ".ns-lab .ns-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ns-lab .ns-chart-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow:hidden}",
    ".ns-lab .ns-chart-title{margin:0 0 6px;color:var(--fg);font-size:14px;font-weight:700}",
    ".ns-lab .ns-svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}",
    ".ns-lab .ns-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
    ".ns-lab .ns-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.6}",
    ".ns-lab .ns-axis{stroke:var(--ns-muted);stroke-width:1.2}",
    ".ns-lab .ns-orbit{fill:none;stroke:var(--ns-blue);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}",
    ".ns-lab .ns-start{fill:var(--ns-green);stroke:var(--bg);stroke-width:2}",
    ".ns-lab .ns-end{fill:var(--ns-red);stroke:var(--bg);stroke-width:2}",
    ".ns-lab .ns-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}",
    ".ns-lab table{width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}",
    ".ns-lab caption{padding:0 0 7px;text-align:left;color:var(--fg);font-size:14px;font-weight:700}",
    ".ns-lab th,.ns-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:right;white-space:nowrap}",
    ".ns-lab th:first-child,.ns-lab td:first-child{text-align:left}",
    ".ns-lab th{color:var(--ns-muted);font-size:11.5px}",
    ".ns-lab .ns-formula{margin:0;padding:9px 11px;border-left:3px solid var(--ns-blue);background:var(--block-bg,var(--bg));color:var(--fg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12.5px;line-height:1.7;overflow-wrap:anywhere}",
    "@media(max-width:720px){.ns-lab .ns-controls{grid-template-columns:minmax(0,1fr)}.ns-lab .ns-chart-frame{padding:6px}.ns-lab .ns-svg{min-width:460px}.ns-lab .ns-chart-frame{overflow-x:auto}}",
    "@media(prefers-reduced-motion:reduce){.ns-lab *{animation:none!important;scroll-behavior:auto!important;transition:none!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function nearly(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function frequency(model, axis) {
    var direct = axis === "x" ? model.wx : model.wy;
    var alternate = axis === "x" ? model.omegaX : model.omegaY;
    var value = finite(Number(direct)) ? Number(direct) : Number(alternate);
    return finite(value) && value > 0 ? value : 1;
  }

  function initialComponent(model, key) {
    var initial = model.initial || {};
    var direct = initial[key];
    if (finite(Number(direct))) return Number(direct);
    var named = model[key + "0"];
    return finite(Number(named)) ? Number(named) : 0;
  }

  function copyInitial(initial) {
    return {
      x: Number(initial.x),
      y: Number(initial.y),
      vx: Number(initial.vx),
      vy: Number(initial.vy)
    };
  }

  function copyPreset(preset) {
    return {
      id: preset.id,
      baseId: preset.id,
      label: preset.label,
      wx: preset.wx,
      wy: preset.wy,
      horizon: preset.horizon,
      initial: copyInitial(preset.initial)
    };
  }

  function exactState(model, time) {
    var t = finite(Number(time)) ? Number(time) : 0;
    var wx = frequency(model, "x");
    var wy = frequency(model, "y");
    var x0 = initialComponent(model, "x");
    var y0 = initialComponent(model, "y");
    var vx0 = initialComponent(model, "vx");
    var vy0 = initialComponent(model, "vy");
    var cx = Math.cos(wx * t);
    var sx = Math.sin(wx * t);
    var cy = Math.cos(wy * t);
    var sy = Math.sin(wy * t);
    return {
      t: t,
      x: x0 * cx + vx0 / wx * sx,
      y: y0 * cy + vy0 / wy * sy,
      vx: -x0 * wx * sx + vx0 * cx,
      vy: -y0 * wy * sy + vy0 * cy
    };
  }

  function energyAt(model, time) {
    var point = exactState(model, time);
    var wx = frequency(model, "x");
    var wy = frequency(model, "y");
    return 0.5 * (point.vx * point.vx + point.vy * point.vy) +
      0.5 * (wx * wx * point.x * point.x + wy * wy * point.y * point.y);
  }

  function angularMomentumAt(model, time) {
    var point = exactState(model, time);
    return point.x * point.vy - point.y * point.vx;
  }

  function torqueAt(model, time) {
    var point = exactState(model, time);
    var wx = frequency(model, "x");
    var wy = frequency(model, "y");
    return (wx * wx - wy * wy) * point.x * point.y;
  }

  function buildLedger(model, count) {
    var samples = Math.max(2, Math.round(finite(Number(count)) ? Number(count) : 9));
    var horizon = finite(Number(model.horizon)) ? Math.max(0, Number(model.horizon)) : 12;
    var rows = [];
    for (var index = 0; index < samples; index += 1) {
      var time = horizon * index / (samples - 1);
      var point = exactState(model, time);
      rows.push({
        t: time,
        x: point.x,
        y: point.y,
        vx: point.vx,
        vy: point.vy,
        energy: energyAt(model, time),
        lz: point.x * point.vy - point.y * point.vx,
        torque: torqueAt(model, time)
      });
    }
    return rows;
  }

  function trajectory(model, count) {
    var samples = Math.max(2, Math.round(finite(Number(count)) ? Number(count) : 240));
    var horizon = finite(Number(model.horizon)) ? Math.max(0, Number(model.horizon)) : 12;
    var points = [];
    for (var index = 0; index < samples; index += 1) {
      var time = horizon * index / (samples - 1);
      var point = exactState(model, time);
      points.push({ t: time, x: point.x, y: point.y });
    }
    return points;
  }

  function isRotationallySymmetric(model) {
    return nearly(frequency(model, "x"), frequency(model, "y"), EPSILON);
  }

  function isAxisException(model) {
    return Math.abs(initialComponent(model, "y")) <= EPSILON &&
      Math.abs(initialComponent(model, "vy")) <= EPSILON;
  }

  function analyze(model, count) {
    var rows = buildLedger(model, count);
    var initialEnergy = rows[0].energy;
    var initialLz = rows[0].lz;
    var minimumEnergy = initialEnergy;
    var maximumEnergy = initialEnergy;
    var minimumLz = initialLz;
    var maximumLz = initialLz;
    rows.forEach(function (row) {
      minimumEnergy = Math.min(minimumEnergy, row.energy);
      maximumEnergy = Math.max(maximumEnergy, row.energy);
      minimumLz = Math.min(minimumLz, row.lz);
      maximumLz = Math.max(maximumLz, row.lz);
    });
    var axis = isAxisException(model);
    var isotropic = isRotationallySymmetric(model);
    return {
      rows: rows,
      initialEnergy: initialEnergy,
      initialLz: initialLz,
      energyDrift: Math.max(Math.abs(maximumEnergy - initialEnergy), Math.abs(minimumEnergy - initialEnergy)),
      lzMinimum: minimumLz,
      lzMaximum: maximumLz,
      lzSpan: maximumLz - minimumLz,
      rotationalSymmetry: isotropic,
      axisException: axis,
      lzBehavior: isotropic ? "constant" : axis ? "axis-exception" : "oscillatory"
    };
  }

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

  function makeElement(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children, doc);
  }

  function makeSvg(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children, doc);
  }

  function svgText(api, doc, x, y, value, attrs) {
    var merged = Object.assign({ x: x, y: y, "font-size": "12", fill: "currentColor" }, attrs || {});
    return makeSvg(api, doc, "text", merged, [value]);
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) < Math.pow(10, -places) / 2) value = 0;
    var text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(api, doc, label, value) {
    var node = makeElement(api, doc, "div", { className: "ns-metric" });
    node.appendChild(makeElement(api, doc, "span", {}, label));
    node.appendChild(makeElement(api, doc, "strong", {}, value));
    return node;
  }

  function chartShell(api, doc, title, svg) {
    var frame = makeElement(api, doc, "div", { className: "ns-chart-frame" });
    frame.appendChild(makeElement(api, doc, "h3", { className: "ns-chart-title" }, title));
    frame.appendChild(svg);
    return frame;
  }

  function axisTick(value, digits) {
    return formatNumber(value, digits === undefined ? 1 : digits);
  }

  function orbitSvg(api, doc, model, points, serial) {
    var width = 520;
    var height = 360;
    var left = 58;
    var right = 20;
    var top = 28;
    var bottom = 45;
    var maxX = 1;
    var maxY = 1;
    points.forEach(function (point) {
      maxX = Math.max(maxX, Math.abs(point.x));
      maxY = Math.max(maxY, Math.abs(point.y));
    });
    maxX *= 1.15;
    maxY *= 1.15;
    var mapX = function (value) { return left + (value + maxX) / (2 * maxX) * (width - left - right); };
    var mapY = function (value) { return height - bottom - (value + maxY) / (2 * maxY) * (height - top - bottom); };
    var titleId = "ns-orbit-title-" + serial;
    var descId = "ns-orbit-desc-" + serial;
    var svg = makeSvg(api, doc, "svg", {
      className: "ns-svg",
      width: width,
      height: height,
      viewBox: "0 0 " + width + " " + height,
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-labelledby": titleId + " " + descId
    });
    svg.appendChild(makeSvg(api, doc, "title", { id: titleId }, "各向异性振子的固定坐标轴轨道"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: descId }, "横轴为 x，纵轴为 y；曲线由解析正弦余弦解生成，绿色点为 t=0，红色点为 t=T。"));
    [-maxX, 0, maxX].forEach(function (value) {
      var x = mapX(value);
      svg.appendChild(makeSvg(api, doc, "line", { className: "ns-grid", x1: x, y1: top, x2: x, y2: height - bottom }));
      svg.appendChild(svgText(api, doc, x, height - bottom + 17, axisTick(value), { "text-anchor": "middle", "font-size": "11" }));
    });
    [-maxY, 0, maxY].forEach(function (value) {
      var y = mapY(value);
      svg.appendChild(makeSvg(api, doc, "line", { className: "ns-grid", x1: left, y1: y, x2: width - right, y2: y }));
      svg.appendChild(svgText(api, doc, left - 8, y + 4, axisTick(value), { "text-anchor": "end", "font-size": "11" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { className: "ns-axis", x1: left, y1: mapY(0), x2: width - right, y2: mapY(0) }));
    svg.appendChild(makeSvg(api, doc, "line", { className: "ns-axis", x1: mapX(0), y1: top, x2: mapX(0), y2: height - bottom }));
    var path = points.map(function (point, index) {
      return (index === 0 ? "M" : "L") + mapX(point.x).toFixed(2) + " " + mapY(point.y).toFixed(2);
    }).join(" ");
    svg.appendChild(makeSvg(api, doc, "path", { className: "ns-orbit", d: path }));
    svg.appendChild(makeSvg(api, doc, "circle", { className: "ns-start", cx: mapX(points[0].x), cy: mapY(points[0].y), r: 5 }));
    svg.appendChild(makeSvg(api, doc, "circle", { className: "ns-end", cx: mapX(points[points.length - 1].x), cy: mapY(points[points.length - 1].y), r: 5 }));
    svg.appendChild(svgText(api, doc, width - right, top - 8, "x-y 轨道", { "text-anchor": "end", "font-size": "13", "font-weight": "700" }));
    svg.appendChild(svgText(api, doc, width - right, height - 9, "x", { "text-anchor": "end", "font-size": "12" }));
    svg.appendChild(svgText(api, doc, left - 12, top + 2, "y", { "text-anchor": "end", "font-size": "12" }));
    svg.appendChild(svgText(api, doc, mapX(points[0].x) + 8, mapY(points[0].y) - 8, "t=0", { "text-anchor": "start", "font-size": "11" }));
    svg.appendChild(svgText(api, doc, mapX(points[points.length - 1].x) + 8, mapY(points[points.length - 1].y) + 15, "t=T", { "text-anchor": "start", "font-size": "11" }));
    return svg;
  }

  function buildLedgerTable(api, doc, rows) {
    var wrapper = makeElement(api, doc, "div", { className: "ns-ledger" });
    var table = makeElement(api, doc, "table", { "aria-label": "能量与角动量精确时间账本" });
    table.appendChild(makeElement(api, doc, "caption", {}, "精确时间账本：E 与 Lz"));
    var head = makeElement(api, doc, "tr");
    ["t", "x(t)", "y(t)", "E(t)", "Lz(t)", "dLz/dt"].forEach(function (label) {
      var th = makeElement(api, doc, "th", { scope: "col" }, label);
      head.appendChild(th);
    });
    var thead = makeElement(api, doc, "thead");
    thead.appendChild(head);
    table.appendChild(thead);
    var body = makeElement(api, doc, "tbody");
    rows.forEach(function (row) {
      var tr = makeElement(api, doc, "tr");
      [formatNumber(row.t, 2), formatNumber(row.x, 5), formatNumber(row.y, 5), formatNumber(row.energy, 5), formatNumber(row.lz, 5), formatNumber(row.torque, 5)].forEach(function (value) {
        tr.appendChild(makeElement(api, doc, "td", {}, value));
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
    wrapper.appendChild(table);
    return wrapper;
  }

  function interpretation(result) {
    if (result.rotationalSymmetry) {
      return "各向同性时，势能只依赖 x²+y²；平面旋转是精确对称，Noether 量 Lz 在整条轨迹上恒定。";
    }
    if (result.axisException) {
      return "这是各向异性模型中的轴轨道例外：y=vy=0 使 xy=0，所以 Lz 与扭矩都为 0；这只是初态选在不变轴上的结果，不是旋转对称。";
    }
    return "各向异性破坏了旋转对称，故一般 dLz/dt=(wx²−wy²)xy 不为零；Lz 会有界振荡而非单调漂移。时间不显含仍使 E 保持常数。";
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = copyPreset(PRESETS[0]);
    var prediction = { symmetry: null, energy: null, angular: null };
    var revealed = false;
    var serial = SERIAL += 1;
    var shell = makeElement(api, doc, "div", { className: "ns-lab" });
    shell.appendChild(makeElement(api, doc, "p", { className: "ns-note" }, "固定初值与解析解：先提交三项判断；核对前不显示预设、参数、轨道、读数或结果账本。"));

    var presetGroup = makeElement(api, doc, "div", { className: "ns-presets", role: "group", "aria-label": "振子预设" });
    presetGroup.hidden = true;
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { type: "button" }, preset.label);
      button.addEventListener("click", function () {
        state = copyPreset(preset);
        render();
      });
      presetButtons.push({ id: preset.id, node: button });
      presetGroup.appendChild(button);
    });
    shell.appendChild(presetGroup);

    var controls = makeElement(api, doc, "div", { className: "ns-controls" });
    controls.hidden = true;
    var ratioControl = makeElement(api, doc, "label", { className: "ns-control" });
    var ratioCaption = makeElement(api, doc, "span", {}, "频率比 wy/wx：");
    var ratioOutput = makeElement(api, doc, "output", {});
    ratioCaption.appendChild(ratioOutput);
    var ratioInput = makeElement(api, doc, "input", { type: "range", min: "0.5", max: "2", step: "0.05", "aria-label": "频率比 wy 除以 wx" });
    ratioControl.appendChild(ratioCaption);
    ratioControl.appendChild(ratioInput);
    controls.appendChild(ratioControl);

    var horizonControl = makeElement(api, doc, "label", { className: "ns-control" });
    var horizonCaption = makeElement(api, doc, "span", {}, "时间视窗 T：");
    var horizonOutput = makeElement(api, doc, "output", {});
    horizonCaption.appendChild(horizonOutput);
    var horizonInput = makeElement(api, doc, "input", { type: "range", min: "4", max: "20", step: "0.5", "aria-label": "时间视窗 T" });
    horizonControl.appendChild(horizonCaption);
    horizonControl.appendChild(horizonInput);
    controls.appendChild(horizonControl);
    shell.appendChild(controls);

    var predict = makeElement(api, doc, "section", { className: "ns-predict", "aria-labelledby": "ns-predict-title-" + serial });
    predict.appendChild(makeElement(api, doc, "h3", { id: "ns-predict-title-" + serial }, "先预测：对称性、能量与角动量"));
    var choiceButtons = [];

    function addQuestion(key, prompt, choices) {
      predict.appendChild(makeElement(api, doc, "p", { className: "ns-question" }, prompt));
      var row = makeElement(api, doc, "div", { className: "ns-choice-row", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button" }, choice.label);
        button.addEventListener("click", function () {
          prediction[key] = choice.value;
          renderPrediction();
        });
        choiceButtons.push({ key: key, value: choice.value, node: button });
        row.appendChild(button);
      });
      predict.appendChild(row);
    }

    addQuestion("symmetry", "1. 各向同性时，Lz 会怎样？", [
      { value: "isotropic-constant", label: "保持常数" },
      { value: "isotropic-varies", label: "仍会变化" }
    ]);
    addQuestion("energy", "2. 各向异性但 wx、wy 不随时间变时，能量会怎样？", [
      { value: "energy-constant", label: "仍保持常数" },
      { value: "energy-drifts", label: "随时间漂移" }
    ]);
    addQuestion("angular", "3. 一般各向异性轨迹的 Lz 会怎样？", [
      { value: "angular-oscillates", label: "有界振荡，非单调" },
      { value: "angular-monotone", label: "单调变化" },
      { value: "angular-constant", label: "保持常数" }
    ]);

    var actions = makeElement(api, doc, "div", { className: "ns-actions" });
    var checkButton = makeElement(api, doc, "button", { className: "ns-primary", type: "button" }, "核对三项预测");
    var resetButton = makeElement(api, doc, "button", { type: "button" }, "重置并重新预测");
    actions.appendChild(checkButton);
    actions.appendChild(resetButton);
    predict.appendChild(actions);
    var feedback = makeElement(api, doc, "p", { className: "ns-feedback", "aria-live": "polite", "aria-atomic": "true" }, "请完成三项预测。");
    predict.appendChild(feedback);
    shell.appendChild(predict);

    var results = makeElement(api, doc, "div", { className: "ns-results" });
    results.hidden = true;
    shell.appendChild(results);
    root.replaceChildren(shell);

    function renderPrediction() {
      choiceButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", prediction[item.key] === item.value ? "true" : "false");
      });
      if (!revealed) {
        var complete = prediction.symmetry !== null && prediction.energy !== null && prediction.angular !== null;
        feedback.textContent = complete ? "三项预测已记录，点击“核对三项预测”打开精确账本。" : "请完成三项预测。";
        feedback.className = "ns-feedback";
      }
    }

    function resetPrediction() {
      prediction = { symmetry: null, energy: null, angular: null };
      revealed = false;
    }

    function setCustomValue(key, value) {
      if (state.id !== "custom") state.baseId = state.id;
      state.id = "custom";
      state[key] = Number(value);
      render();
    }

    ratioInput.addEventListener("input", function () { setCustomValue("wy", clamp(Number(ratioInput.value), 0.5, 2)); });
    horizonInput.addEventListener("input", function () { setCustomValue("horizon", clamp(Number(horizonInput.value), 4, 20)); });
    checkButton.addEventListener("click", function () {
      if (prediction.symmetry === null || prediction.energy === null || prediction.angular === null) {
        feedback.textContent = "请先完成三项预测。";
        feedback.className = "ns-feedback ns-warn";
        return;
      }
      revealed = true;
      render();
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
    });
    resetButton.addEventListener("click", function () {
      var preset = PRESETS.filter(function (item) { return item.id === state.baseId || item.id === state.id; })[0] || PRESETS[0];
      state = copyPreset(preset);
      resetPrediction();
      render();
    });

    function renderResults(result) {
      results.replaceChildren();
      var metrics = makeElement(api, doc, "div", { className: "ns-metrics" });
      metrics.appendChild(metric(api, doc, "wx、wy", formatNumber(state.wx, 2) + "，" + formatNumber(state.wy, 2)));
      metrics.appendChild(metric(api, doc, "旋转对称", result.rotationalSymmetry ? "是" : "否"));
      metrics.appendChild(metric(api, doc, "E(0)", formatNumber(result.initialEnergy, 5)));
      metrics.appendChild(metric(api, doc, "max |E−E(0)|", formatNumber(result.energyDrift, 10)));
      metrics.appendChild(metric(api, doc, "Lz(0)", formatNumber(result.initialLz, 5)));
      metrics.appendChild(metric(api, doc, "Lz 范围", "[" + formatNumber(result.lzMinimum, 5) + ", " + formatNumber(result.lzMaximum, 5) + "]"));
      metrics.appendChild(metric(api, doc, "轨迹判读", result.axisException ? "轴例外" : result.lzBehavior === "constant" ? "恒定" : "振荡"));
      results.appendChild(metrics);

      var points = trajectory(state, 240);
      results.appendChild(chartShell(api, doc, "固定坐标轴的 x-y 轨道（解析解）", orbitSvg(api, doc, state, points, serial)));
      results.appendChild(buildLedgerTable(api, doc, result.rows));
      results.appendChild(makeElement(api, doc, "p", { className: "ns-formula" }, "x(t)、y(t) 用闭式正弦余弦解；E=1/2(vx²+vy²)+1/2(wx²x²+wy²y²)，Lz=x·vy−y·vx，dLz/dt=(wx²−wy²)xy。这里没有数值积分器。"));
    }

    function render() {
      var ratio = clamp(finite(Number(state.wy)) ? Number(state.wy) : 1, 0.5, 2);
      state.wy = ratio;
      state.horizon = clamp(finite(Number(state.horizon)) ? Number(state.horizon) : 12, 4, 20);
      ratioInput.value = String(state.wy / state.wx);
      horizonInput.value = String(state.horizon);
      ratioOutput.textContent = formatNumber(state.wy / state.wx, 2);
      horizonOutput.textContent = formatNumber(state.horizon, 1);
      ratioInput.setAttribute("aria-valuetext", "wy 除以 wx 等于 " + formatNumber(state.wy / state.wx, 2));
      horizonInput.setAttribute("aria-valuetext", "时间视窗 T 等于 " + formatNumber(state.horizon, 1));
      presetButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.id === state.id ? "true" : "false");
      });
      renderPrediction();
      presetGroup.hidden = !revealed;
      controls.hidden = !revealed;
      results.hidden = !revealed;
      if (!revealed) return;
      var result = analyze(state, 9);
      var correct = 0;
      if (prediction.symmetry === EXPECTED.symmetry) correct += 1;
      if (prediction.energy === EXPECTED.energy) correct += 1;
      if (prediction.angular === EXPECTED.angular) correct += 1;
      feedback.textContent = correct === 3 ? "三项预测都命中。" : "命中 " + correct + "/3；请用三本账分开读取对称性、能量和特殊轨迹。";
      feedback.className = "ns-feedback " + (correct === 3 ? "ns-pass" : "ns-warn");
      renderResults(result);
    }

    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    function close(actual, expected, tolerance, message) {
      assert(finite(actual) && Math.abs(actual - expected) <= tolerance, message + ": " + actual);
    }
    function allFinite(point, message) {
      [point.x, point.y, point.vx, point.vy].forEach(function (value) { assert(finite(value), message); });
    }

    var initialPoint = exactState(PRESETS[0], 0);
    close(initialPoint.x, 1, 1e-12, "exact initial x");
    close(initialPoint.y, 0.7, 1e-12, "exact initial y");
    close(initialPoint.vx, 0.35, 1e-12, "exact initial vx");
    close(initialPoint.vy, 0.8, 1e-12, "exact initial vy");
    close(energyAt(PRESETS[0], 0), 1.12625, 1e-12, "exact isotropic initial energy");
    close(angularMomentumAt(PRESETS[0], 0), 0.555, 1e-12, "exact initial Lz");
    assert(isRotationallySymmetric(PRESETS[0]), "isotropic symmetry");
    assert(!isRotationallySymmetric(PRESETS[1]), "weak breaking is anisotropic");

    PRESETS.forEach(function (preset) {
      var initialEnergy = energyAt(preset, 0);
      var rows = buildLedger(preset, 17);
      rows.forEach(function (row) {
        allFinite(row, preset.id + " finite state");
        [row.energy, row.lz, row.torque].forEach(function (value) { assert(finite(value), preset.id + " finite ledger"); });
        close(row.energy, initialEnergy, 1e-10, preset.id + " energy conservation");
      });
      close(rows[0].x, initialComponent(preset, "x"), 1e-12, preset.id + " initial x in ledger");
      close(rows[0].y, initialComponent(preset, "y"), 1e-12, preset.id + " initial y in ledger");
      close(rows[0].vx, initialComponent(preset, "vx"), 1e-12, preset.id + " initial vx in ledger");
      close(rows[0].vy, initialComponent(preset, "vy"), 1e-12, preset.id + " initial vy in ledger");
    });

    for (var index = 0; index < 9; index += 1) {
      var time = 0.37 * index;
      close(angularMomentumAt(PRESETS[0], time), 0.555, 1e-9, "isotropic Lz conservation");
    }

    var derivativeModel = PRESETS[2];
    for (var sample = 0; sample < 7; sample += 1) {
      var sampleTime = 0.41 + sample * 0.63;
      var point = exactState(derivativeModel, sampleTime);
      var analytic = (derivativeModel.wx * derivativeModel.wx - derivativeModel.wy * derivativeModel.wy) * point.x * point.y;
      close(torqueAt(derivativeModel, sampleTime), analytic, 1e-12, "analytic torque formula");
      var h = 1e-5;
      var finiteDifference = (angularMomentumAt(derivativeModel, sampleTime + h) - angularMomentumAt(derivativeModel, sampleTime - h)) / (2 * h);
      close(finiteDifference, analytic, 1e-8, "finite-check torque derivative");
    }

    var axis = PRESETS[3];
    assert(isAxisException(axis), "axis exception recognized");
    for (var axisIndex = 0; axisIndex < 12; axisIndex += 1) {
      var axisTime = axisIndex * 0.73;
      var axisPoint = exactState(axis, axisTime);
      close(axisPoint.y, 0, 1e-12, "axis y stays zero");
      close(axisPoint.vy, 0, 1e-12, "axis vy stays zero");
      close(angularMomentumAt(axis, axisTime), 0, 1e-12, "axis Lz stays zero");
      close(torqueAt(axis, axisTime), 0, 1e-12, "axis torque stays zero");
    }

    var generic = analyze(PRESETS[2], 101);
    assert(generic.lzSpan > 0.1, "generic anisotropic Lz varies");
    assert(generic.lzBehavior === "oscillatory", "generic anisotropic behavior");
    assert(analyze(PRESETS[3], 17).lzBehavior === "axis-exception", "axis behavior label");
    return { checks: checks, presets: PRESETS.length };
  }

  var exported = {
    INITIAL: copyInitial(INITIAL),
    AXIS_INITIAL: copyInitial(AXIS_INITIAL),
    PRESETS: PRESETS,
    EXPECTED: EXPECTED,
    exactState: exactState,
    solutionAt: exactState,
    stateAt: exactState,
    energyAt: energyAt,
    energy: energyAt,
    angularMomentumAt: angularMomentumAt,
    angularMomentum: angularMomentumAt,
    lzAt: angularMomentumAt,
    torqueAt: torqueAt,
    torque: torqueAt,
    buildLedger: buildLedger,
    ledger: buildLedger,
    trajectory: trajectory,
    analyze: analyze,
    isRotationallySymmetric: isRotationallySymmetric,
    isAxisException: isAxisException,
    selfTest: selfTest
  };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") {
    host.CourseLearning.register("noether-symmetry", mount);
  }
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) {
    try {
      var report = selfTest();
      console.log("noether-symmetry self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("noether-symmetry self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null);
