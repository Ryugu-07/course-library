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
  var TWO_PI = 2 * PI;
  var EPSILON = 1e-8;
  var SERIAL = 0;
  var PHASE = {
    left: 54,
    right: 430,
    top: 34,
    bottom: 278,
    pMax: 3.6
  };
  var PRESETS = [
    { id: "swing", theta: 0, p: 1, label: "摆动 E=0.5（θ₀=0，p₀=1）" },
    { id: "separatrix", theta: 0, p: 2, label: "分离曲线（separatrix）E=2（θ₀=0，p₀=2）" },
    { id: "rotation", theta: 0, p: 2.4, label: "转动 E=2.88（θ₀=0，p₀=2.4）" },
    { id: "stable", theta: 0, p: 0, label: "稳定平衡 (0,0)" },
    { id: "unstable", theta: PI, p: 0, label: "不稳定平衡 (π,0)" }
  ];

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
    return appendChildren(
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}),
      children,
      doc
    );
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function format(api, value, digits) {
    if (api && typeof api.format === "function") return api.format(value, digits);
    if (!Number.isFinite(value)) return "-";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    if (text.indexOf(".") === -1) return text;
    while (text.charAt(text.length - 1) === "0") text = text.slice(0, -1);
    if (text.charAt(text.length - 1) === ".") text = text.slice(0, -1);
    return text;
  }

  function closeTo(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-6 : tolerance);
  }

  function normalizeAngle(theta) {
    var value = theta % TWO_PI;
    if (value <= -PI) value += TWO_PI;
    if (value > PI) value -= TWO_PI;
    return value;
  }

  function angleText(theta) {
    var value = normalizeAngle(theta);
    if (closeTo(value, 0, 1e-4)) return "0";
    if (closeTo(Math.abs(value), PI, 1e-4)) return value < 0 ? "−π" : "π";
    if (closeTo(value, PI / 2, 1e-4)) return "π/2";
    if (closeTo(value, -PI / 2, 1e-4)) return "−π/2";
    return format(null, value, 2) + " rad";
  }

  function energy(theta, p) {
    return p * p / 2 + 1 - Math.cos(theta);
  }

  function kinetic(p) {
    return p * p / 2;
  }

  function potential(theta) {
    return 1 - Math.cos(theta);
  }

  function isStable(theta, p) {
    return Math.abs(normalizeAngle(theta)) < 1e-4 && Math.abs(p) < 1e-4;
  }

  function isUnstable(theta, p) {
    return Math.abs(Math.abs(normalizeAngle(theta)) - PI) < 1e-4 && Math.abs(p) < 1e-4;
  }

  function regime(theta, p, value) {
    if (isStable(theta, p)) return "稳定平衡";
    if (isUnstable(theta, p)) return "不稳定平衡（鞍点）";
    if (Math.abs(value - 2) < 1e-6) return "分离曲线（separatrix）";
    return value < 2 ? "摆动" : "转动";
  }

  function regimeNote(theta, p, value) {
    if (isStable(theta, p)) {
      return "(0,0) 是稳定平衡；当前动能与势能都为 0。";
    }
    if (isUnstable(theta, p)) {
      return "(π,0) 是鞍点；θ̇=p=0、ṗ=−sin θ=0，当前不会沿分离曲线（separatrix）自发运动。";
    }
    if (Math.abs(value - 2) < 1e-6) {
      return "E=2 的整个能级集合不是单条轨道：它还包含按 θ 周期识别的鞍点，以及趋近鞍点的分离轨道。";
    }
    return value < 2
      ? "E<2：摆角在两个转向点之间往复，轨道在圆柱上闭合。"
      : "E>2：动量不经过 0，摆越过顶点并持续转动。";
  }

  function phaseX(theta) {
    return PHASE.left + (theta + PI) / TWO_PI * (PHASE.right - PHASE.left);
  }

  function phaseY(p) {
    return PHASE.bottom - (p + PHASE.pMax) / (2 * PHASE.pMax) * (PHASE.bottom - PHASE.top);
  }

  function pathForBranch(value, sign) {
    var thetaMax;
    var start;
    var end;
    var samples;
    var points = [];
    var index;
    var theta;
    var radicand;
    var p;

    if (value < 2) {
      thetaMax = Math.acos(clamp(1 - value, -1, 1));
      if (thetaMax < EPSILON) {
        return "M " + phaseX(0).toFixed(2) + " " + phaseY(0).toFixed(2);
      }
      start = -thetaMax;
      end = thetaMax;
    } else {
      start = -PI;
      end = PI;
    }
    samples = value < 2 ? 160 : 240;
    for (index = 0; index <= samples; index += 1) {
      theta = start + (end - start) * index / samples;
      radicand = Math.max(0, 2 * (value - 1 + Math.cos(theta)));
      p = sign * Math.sqrt(radicand);
      points.push((index === 0 ? "M " : "L ") + phaseX(theta).toFixed(2) + " " + phaseY(p).toFixed(2));
    }
    return points.join(" ");
  }

  function svgText(api, doc, x, y, text, attrs) {
    var merged = Object.assign({
      x: x,
      y: y,
      "font-size": "12",
      fill: "currentColor"
    }, attrs || {});
    return makeSvg(api, doc, "text", merged, [text]);
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-pp-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-pp-style", "true");
    style.textContent = [
      ".pp-lab{--pp-current:#315f9d;--pp-separatrix:var(--cl-red,#b64335);--pp-stable:var(--cl-green,#39734d);--pp-unstable:var(--cl-gold,#9b6a12);color:var(--fg,#292722);font-size:.95em;line-height:1.55;min-width:0}",
      "html[data-theme=dark] .pp-lab{--pp-current:#83c8ff}",
      ".pp-lab *,.pp-lab *::before,.pp-lab *::after{box-sizing:border-box}",
      ".pp-lab .pp-shell{display:grid;gap:14px;min-width:0}",
      ".pp-lab .pp-heading{margin:0 0 .25rem;color:var(--accent,#315f9d);font-size:1.2rem}",
      ".pp-lab .pp-intro,.pp-lab .pp-note{margin:0;color:var(--fg-soft,#6b6557)}",
      ".pp-lab .pp-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;min-width:0}",
      ".pp-lab .pp-controls,.pp-lab .pp-stage{min-width:0}",
      ".pp-lab .pp-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 18px}",
      ".pp-lab .pp-controls>h4,.pp-lab .pp-controls>.pp-note,.pp-lab .pp-controls>.pp-presets{grid-column:1/-1}",
      ".pp-lab .pp-control{display:grid;gap:5px;min-width:0}",
      ".pp-lab .pp-control>span{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;color:var(--fg-soft,#6b6557);font-size:13px;font-weight:650}",
      ".pp-lab .pp-control output{color:var(--pp-current);font-variant-numeric:tabular-nums}",
      ".pp-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--pp-current)}",
      ".pp-lab .pp-presets{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}",
      ".pp-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}",
      ".pp-lab button:hover{border-color:var(--pp-current)}",
      ".pp-lab button[aria-pressed=true]{border-color:var(--pp-current);background:var(--pp-current);color:var(--bg,#fff);font-weight:700}",
      ".pp-lab button:focus-visible,.pp-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".pp-lab .pp-stage{display:grid;gap:12px}",
      ".pp-lab .pp-stage-grid{display:grid;grid-template-columns:minmax(190px,.65fr) minmax(0,1.35fr);gap:12px;min-width:0}",
      ".pp-lab .pp-card{min-width:0;padding:10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff)}",
      ".pp-lab .pp-card h4{margin:0 0 7px;font-size:14px}",
      ".pp-lab .pp-svg{display:block;width:100%;max-width:100%;height:auto;color:inherit;overflow:visible}",
      ".pp-lab .pp-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
      ".pp-lab .pp-guide{stroke:var(--fg-soft,#6b6557);stroke-width:1;stroke-dasharray:4 5;opacity:.6}",
      ".pp-lab .pp-axis{stroke:var(--fg-soft,#6b6557);stroke-width:1.2}",
      ".pp-lab .pp-grid-line{stroke:var(--border,#d7d0c2);stroke-width:1;opacity:.62}",
      ".pp-lab .pp-rod{stroke:var(--pp-current);stroke-width:5;stroke-linecap:round}",
      ".pp-lab .pp-pivot{fill:var(--fg,#292722)}",
      ".pp-lab .pp-bob{fill:var(--pp-current);stroke:var(--bg,#fff);stroke-width:2}",
      ".pp-lab .pp-angle-arc{fill:none;stroke:var(--pp-current);stroke-width:2}",
      ".pp-lab .pp-orbit{fill:none;stroke:var(--pp-current);stroke-width:3.2;stroke-linejoin:round;stroke-linecap:round}",
      ".pp-lab .pp-separatrix{fill:none;stroke:var(--pp-separatrix);stroke-width:2.6;stroke-dasharray:7 5;stroke-linejoin:round;stroke-linecap:round}",
      ".pp-lab .pp-current-point{fill:var(--pp-current);stroke:var(--bg,#fff);stroke-width:2}",
      ".pp-lab .pp-stable-point{fill:var(--pp-stable);stroke:var(--bg,#fff);stroke-width:2}",
      ".pp-lab .pp-unstable-point{fill:var(--pp-unstable);stroke:var(--bg,#fff);stroke-width:2}",
      ".pp-lab .pp-label-current{fill:var(--pp-current)!important;font-weight:750}",
      ".pp-lab .pp-label-separatrix{fill:var(--pp-separatrix)!important;font-weight:700}",
      ".pp-lab .pp-muted{fill:var(--fg-soft,#6b6557)!important;font-size:11px}",
      ".pp-lab .pp-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin-top:7px;color:var(--fg-soft,#6b6557);font-size:12px}",
      ".pp-lab .pp-legend span{display:inline-flex;align-items:center;gap:5px}",
      ".pp-lab .pp-legend i{display:inline-block;width:22px;border-top:3px solid var(--pp-current)}",
      ".pp-lab .pp-legend i.pp-legend-sep{border-top:3px dashed var(--pp-separatrix)}",
      ".pp-lab .pp-legend i.pp-legend-stable{width:10px;height:10px;border:0;border-radius:50%;background:var(--pp-stable)}",
      ".pp-lab .pp-legend i.pp-legend-unstable{width:10px;height:10px;border:0;border-radius:50%;background:var(--pp-unstable)}",
      ".pp-lab .pp-budget{display:grid;gap:8px;margin-top:10px}",
      ".pp-lab .pp-budget-row{display:grid;grid-template-columns:52px minmax(0,1fr) 72px;gap:7px;align-items:center;font-size:12.5px}",
      ".pp-lab .pp-budget-track{height:18px;overflow:hidden;border:1px solid var(--border,#d7d0c2);border-radius:4px;background:var(--block-bg,#f4f1e9)}",
      ".pp-lab .pp-budget-fill{height:100%;width:0;background:var(--pp-current)}",
      ".pp-lab .pp-budget-fill.pp-potential{background:var(--pp-unstable)}",
      ".pp-lab .pp-budget-value{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}",
      ".pp-lab .pp-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}",
      ".pp-lab .pp-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#d7d0c2);background:var(--block-bg,#f4f1e9)}",
      ".pp-lab .pp-metric span{display:block;color:var(--fg-soft,#6b6557);font-size:11px}",
      ".pp-lab .pp-metric strong{display:block;margin-top:2px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".pp-lab .pp-status{margin:0;padding:10px 12px;border-left:3px solid var(--pp-current);background:var(--block-bg,#f4f1e9);line-height:1.6}",
      ".pp-lab .pp-formula{margin:0;padding:9px 11px;border-left:3px solid var(--pp-current);background:var(--bg,#fff);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12.5px;line-height:1.6;overflow-wrap:anywhere}",
      ".pp-lab .pp-small{margin:7px 0 0;color:var(--fg-soft,#6b6557);font-size:12px;line-height:1.6}",
      "@media (max-width:700px){.pp-lab .pp-controls,.pp-lab .pp-stage-grid{grid-template-columns:minmax(0,1fr)}.pp-lab .pp-controls>h4,.pp-lab .pp-controls>.pp-note,.pp-lab .pp-controls>.pp-presets{grid-column:auto}.pp-lab .pp-card{padding:7px}.pp-lab .pp-stage-grid>.pp-card:nth-child(2){overflow-x:auto}.pp-lab .pp-stage-grid>.pp-card:nth-child(2) .pp-svg{min-width:440px}.pp-lab .pp-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.pp-lab .pp-budget-row{grid-template-columns:48px minmax(0,1fr) 68px}}",
      "@media (prefers-reduced-motion:reduce){.pp-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("\n");
    (doc.head || doc.documentElement).appendChild(style);
  }

  function makeRangeControl(api, doc, id, label, min, max, step, value, suffix) {
    var wrapper = makeElement(api, doc, "label", { className: "pp-control", htmlFor: id });
    var caption = makeElement(api, doc, "span", {});
    caption.appendChild(doc.createTextNode(label));
    var output = makeElement(api, doc, "output", { htmlFor: id }, "");
    caption.appendChild(output);
    if (suffix) caption.appendChild(doc.createTextNode(suffix));
    wrapper.appendChild(caption);
    var input = makeElement(api, doc, "input", {
      id: id,
      type: "range",
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(value),
      "aria-label": label
    });
    wrapper.appendChild(input);
    return { wrapper: wrapper, input: input, output: output };
  }

  function makeMetric(api, doc, label, value) {
    var metric = makeElement(api, doc, "div", { className: "pp-metric" });
    metric.appendChild(makeElement(api, doc, "span", {}, label));
    var valueNode = makeElement(api, doc, "strong", {}, value);
    metric.appendChild(valueNode);
    return { node: metric, value: valueNode };
  }

  function makeChart(api, doc, prefix, label) {
    var svg = makeSvg(api, doc, "svg", {
      className: "pp-svg",
      viewBox: "0 0 464 330",
      role: "img",
      "aria-label": label
    });
    var title = makeSvg(api, doc, "title", { id: prefix + "-title" }, label);
    var desc = makeSvg(api, doc, "desc", { id: prefix + "-desc" }, "");
    svg.appendChild(title);
    svg.appendChild(desc);
    return { svg: svg, title: title, desc: desc };
  }

  function drawPendulum(api, doc, chart, state, result) {
    var svg = chart.svg;
    var pivotX = 150;
    var pivotY = 116;
    var length = 100;
    var bobX = pivotX + length * Math.sin(state.theta);
    var bobY = pivotY + length * Math.cos(state.theta);
    var arcRadius = 32;
    var arcPoints = [];
    var index;
    clear(svg);
    svg.appendChild(makeSvg(api, doc, "title", { id: chart.title.id }, "单摆当前姿态与角度"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: chart.desc.id }, "摆杆从向下的稳定方向量取角度 theta；圆点是摆锤，虚线是 theta=0 的参考方向。当前 theta=" + angleText(state.theta) + "，p=" + format(api, state.p, 2) + "。"));
    svg.appendChild(makeSvg(api, doc, "line", {
      className: "pp-guide",
      x1: pivotX,
      y1: pivotY,
      x2: pivotX,
      y2: pivotY + length + 18
    }));
    svg.appendChild(makeSvg(api, doc, "line", {
      className: "pp-rod",
      x1: pivotX,
      y1: pivotY,
      x2: bobX,
      y2: bobY
    }));
    for (index = 0; index <= 32; index += 1) {
      var sample = state.theta * index / 32;
      arcPoints.push(
        (index === 0 ? "M " : "L ") +
        (pivotX + arcRadius * Math.sin(sample)).toFixed(2) + " " +
        (pivotY + arcRadius * Math.cos(sample)).toFixed(2)
      );
    }
    svg.appendChild(makeSvg(api, doc, "path", { className: "pp-angle-arc", d: arcPoints.join(" ") }));
    svg.appendChild(makeSvg(api, doc, "circle", { className: "pp-pivot", cx: pivotX, cy: pivotY, r: 7 }));
    svg.appendChild(makeSvg(api, doc, "circle", { className: "pp-bob", cx: bobX, cy: bobY, r: 15 }));
    svg.appendChild(svgText(api, doc, pivotX + 8, pivotY - 10, "支点", { className: "pp-muted", "text-anchor": "start" }));
    svg.appendChild(svgText(api, doc, pivotX + 8, pivotY + length + 32, "θ=0：稳定向下", { className: "pp-muted", "text-anchor": "start" }));
    svg.appendChild(svgText(api, doc, 18, 28, "物理姿态", { "font-size": "13", "font-weight": "700" }));
    svg.appendChild(svgText(api, doc, 18, 246, "当前 θ₀=" + angleText(state.theta), { className: "pp-label-current", "text-anchor": "start" }));
    svg.appendChild(svgText(api, doc, 18, 266, "当前 p₀=" + format(api, state.p, 2), { className: "pp-label-current", "text-anchor": "start" }));
    chart.desc.textContent = "单摆当前姿态：摆杆相对向下稳定方向的角度为 " + angleText(state.theta) + "，无量纲动量 p=" + format(api, state.p, 2) + "；动能 K=" + format(api, result.kinetic, 3) + "，势能 V=" + format(api, result.potential, 3) + "。";
  }

  function drawGrid(api, doc, svg) {
    var thetaTicks = [-PI, -PI / 2, 0, PI / 2, PI];
    var pTicks = [-3, -2, -1, 0, 1, 2, 3];
    thetaTicks.forEach(function (theta) {
      var x = phaseX(theta);
      svg.appendChild(makeSvg(api, doc, "line", {
        className: "pp-grid-line",
        x1: x,
        y1: PHASE.top,
        x2: x,
        y2: PHASE.bottom
      }));
      svg.appendChild(svgText(api, doc, x, PHASE.bottom + 18, theta === -PI ? "−π" : theta === PI ? "π" : theta === 0 ? "0" : theta < 0 ? "−π/2" : "π/2", { className: "pp-muted", "text-anchor": "middle" }));
    });
    pTicks.forEach(function (p) {
      var y = phaseY(p);
      svg.appendChild(makeSvg(api, doc, "line", {
        className: "pp-grid-line",
        x1: PHASE.left,
        y1: y,
        x2: PHASE.right,
        y2: y
      }));
      svg.appendChild(svgText(api, doc, PHASE.left - 8, y + 4, String(p), { className: "pp-muted", "text-anchor": "end" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", {
      className: "pp-axis",
      x1: PHASE.left,
      y1: phaseY(0),
      x2: PHASE.right,
      y2: phaseY(0)
    }));
    svg.appendChild(makeSvg(api, doc, "line", {
      className: "pp-axis",
      x1: phaseX(0),
      y1: PHASE.top,
      x2: phaseX(0),
      y2: PHASE.bottom
    }));
    svg.appendChild(makeSvg(api, doc, "line", {
      className: "pp-guide",
      x1: PHASE.left,
      y1: PHASE.top,
      x2: PHASE.left,
      y2: PHASE.bottom
    }));
    svg.appendChild(makeSvg(api, doc, "line", {
      className: "pp-guide",
      x1: PHASE.right,
      y1: PHASE.top,
      x2: PHASE.right,
      y2: PHASE.bottom
    }));
    svg.appendChild(svgText(api, doc, PHASE.right, PHASE.bottom + 37, "θ（−π ≡ π）", { className: "pp-muted", "text-anchor": "end" }));
    svg.appendChild(svgText(api, doc, PHASE.left - 4, PHASE.top - 10, "p", { className: "pp-muted", "text-anchor": "start" }));
  }

  function drawPhase(api, doc, chart, state, result) {
    var svg = chart.svg;
    var currentOrbit;
    clear(svg);
    svg.appendChild(makeSvg(api, doc, "title", { id: chart.title.id }, "单摆圆柱相空间：当前等能轨道与分离曲线"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: chart.desc.id }, "横轴 theta 在 −pi 与 pi 处周期识别，纵轴是 p；蓝线为当前能量的解析等能曲线，红色虚线为 E=2 的分离曲线（separatrix），金色点为鞍点 (pi,0)。"));
    svg.appendChild(makeSvg(api, doc, "rect", {
      x: 20,
      y: 20,
      width: 424,
      height: 276,
      rx: 5,
      fill: "none",
      stroke: "var(--border)",
      "stroke-width": "1"
    }));
    drawGrid(api, doc, svg);
    svg.appendChild(svgText(api, doc, 24, 15, "圆柱相空间", { "font-size": "13", "font-weight": "700" }));
    currentOrbit = makeSvg(api, doc, "g", { "aria-label": "当前能量 E=" + format(api, result.energy, 3) + " 的等能轨道" });
    currentOrbit.appendChild(makeSvg(api, doc, "path", { className: "pp-orbit", d: pathForBranch(result.energy, 1) }));
    currentOrbit.appendChild(makeSvg(api, doc, "path", { className: "pp-orbit", d: pathForBranch(result.energy, -1) }));
    svg.appendChild(currentOrbit);
    svg.appendChild(makeSvg(api, doc, "path", { className: "pp-separatrix", d: pathForBranch(2, 1) }));
    svg.appendChild(makeSvg(api, doc, "path", { className: "pp-separatrix", d: pathForBranch(2, -1) }));
    svg.appendChild(makeSvg(api, doc, "circle", { className: "pp-stable-point", cx: phaseX(0), cy: phaseY(0), r: 5.5 }));
    svg.appendChild(makeSvg(api, doc, "circle", { className: "pp-unstable-point", cx: phaseX(-PI), cy: phaseY(0), r: 6 }));
    svg.appendChild(makeSvg(api, doc, "circle", { className: "pp-unstable-point", cx: phaseX(PI), cy: phaseY(0), r: 6 }));
    svg.appendChild(makeSvg(api, doc, "circle", { className: "pp-current-point", cx: phaseX(normalizeAngle(state.theta)), cy: phaseY(state.p), r: 6.5 }));
    svg.appendChild(svgText(api, doc, phaseX(0) + 8, phaseY(0) - 9, "稳定 (0,0)", { className: "pp-muted", "text-anchor": "start" }));
    svg.appendChild(svgText(api, doc, phaseX(PI) - 8, phaseY(0) - 9, "鞍点 (π,0)", { className: "pp-label-separatrix", "text-anchor": "end" }));
    svg.appendChild(svgText(api, doc, phaseX(normalizeAngle(state.theta)) + 8, phaseY(state.p) + 18, "当前", { className: "pp-label-current", "text-anchor": "start" }));
    svg.appendChild(svgText(api, doc, PHASE.left + 8, PHASE.top + 19, "E=2 分离曲线（separatrix）", { className: "pp-label-separatrix", "text-anchor": "start" }));
    chart.desc.textContent = "当前点为 theta=" + angleText(state.theta) + "、p=" + format(api, state.p, 2) + "，E=" + format(api, result.energy, 3) + "；蓝线显示当前等能轨道，红色虚线显示 E=2 的分离曲线（separatrix）。边界 theta=−pi 与 theta=pi 代表同一个鞍点。";
  }

  function makeBudgetRow(api, doc, label, className, ariaLabel) {
    var row = makeElement(api, doc, "div", { className: "pp-budget-row" });
    row.appendChild(makeElement(api, doc, "span", {}, label));
    var track = makeElement(api, doc, "div", {
      className: "pp-budget-track",
      role: "progressbar",
      "aria-label": ariaLabel,
      "aria-valuemin": "0",
      "aria-valuemax": "0",
      "aria-valuenow": "0",
      "aria-valuetext": "0"
    });
    var fill = makeElement(api, doc, "div", { className: "pp-budget-fill" + (className ? " " + className : "") });
    track.appendChild(fill);
    row.appendChild(track);
    var value = makeElement(api, doc, "output", { className: "pp-budget-value" }, "0");
    row.appendChild(value);
    return { row: row, track: track, fill: fill, value: value };
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    var serial;
    var prefix;
    var thetaControl;
    var pControl;
    var state;
    var shell;
    var controls;
    var presetButtons = [];
    var status;
    var energyMetric;
    var kineticMetric;
    var potentialMetric;
    var kineticBudget;
    var potentialBudget;
    var pendulumChart;
    var phaseChart;
    var formula;
    var note;

    injectStyles(doc);
    root.classList.add("pp-lab");
    SERIAL += 1;
    serial = SERIAL;
    prefix = "pp-" + serial;
    state = { theta: 0, p: 1 };

    shell = makeElement(api, doc, "div", { className: "pp-shell" });
    shell.appendChild(makeElement(api, doc, "h3", { className: "pp-heading" }, "一维单摆：相空间与分离曲线（separatrix）"));
    shell.appendChild(makeElement(api, doc, "p", { className: "pp-intro" }, "固定初始点 (θ₀,p₀)，直接由 H= p²/2+1−cos θ 计算能量；相图使用解析等能曲线，不做数值积分或随机抽样。"));

    var layout = makeElement(api, doc, "div", { className: "pp-layout" });
    controls = makeElement(api, doc, "aside", { className: "pp-controls", "aria-label": "单摆相空间控制" });
    controls.appendChild(makeElement(api, doc, "h4", {}, "选择初始状态"));
    thetaControl = makeRangeControl(api, doc, prefix + "-theta", "初始角度 θ₀", -PI, PI, "any", state.theta, "");
    pControl = makeRangeControl(api, doc, prefix + "-p", "初始动量 p₀", -2.8, 2.8, 0.01, state.p, "");
    controls.appendChild(thetaControl.wrapper);
    controls.appendChild(pControl.wrapper);
    controls.appendChild(makeElement(api, doc, "p", { className: "pp-note" }, "角度范围 −π 到 π 只是圆柱的一个切口；两端代表同一条周期方向。"));

    var presetGroup = makeElement(api, doc, "div", { className: "pp-presets", role: "group", "aria-label": "单摆初始状态预设" });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        state.theta = preset.theta;
        state.p = preset.p;
        thetaControl.input.value = String(state.theta);
        pControl.input.value = String(state.p);
        render(true, preset.label);
      });
      preset.button = button;
      presetButtons.push(preset);
      presetGroup.appendChild(button);
    });
    controls.appendChild(presetGroup);
    layout.appendChild(controls);

    var stage = makeElement(api, doc, "section", { className: "pp-stage", "aria-label": "单摆视觉读数" });
    var stageGrid = makeElement(api, doc, "div", { className: "pp-stage-grid" });
    pendulumChart = makeChart(api, doc, prefix + "-pendulum", "单摆当前姿态");
    phaseChart = makeChart(api, doc, prefix + "-phase", "单摆圆柱相空间");
    pendulumChart.svg.setAttribute("viewBox", "0 0 300 300");
    var pendulumCard = makeElement(api, doc, "section", { className: "pp-card", "aria-labelledby": prefix + "-pendulum-card-title" });
    pendulumCard.appendChild(makeElement(api, doc, "h4", { id: prefix + "-pendulum-card-title" }, "实物姿态"));
    pendulumCard.appendChild(pendulumChart.svg);
    stageGrid.appendChild(pendulumCard);
    var phaseCard = makeElement(api, doc, "section", { className: "pp-card", "aria-labelledby": prefix + "-phase-card-title" });
    phaseCard.appendChild(makeElement(api, doc, "h4", { id: prefix + "-phase-card-title" }, "相图：当前等能轨道与分离曲线（separatrix）"));
    phaseCard.appendChild(phaseChart.svg);
    var legend = makeElement(api, doc, "div", { className: "pp-legend", "aria-label": "相图图例" });
    [
      ["", "当前等能轨道"],
      ["pp-legend-sep", "E=2 分离曲线（separatrix）"],
      ["pp-legend-stable", "稳定平衡"],
      ["pp-legend-unstable", "鞍点（不稳定平衡）"]
    ].forEach(function (item) {
      var entry = makeElement(api, doc, "span", {});
      entry.appendChild(makeElement(api, doc, "i", item[0]));
      entry.appendChild(doc.createTextNode(item[1]));
      legend.appendChild(entry);
    });
    phaseCard.appendChild(legend);
    stageGrid.appendChild(phaseCard);
    stage.appendChild(stageGrid);

    var budgetCard = makeElement(api, doc, "section", { className: "pp-card", "aria-labelledby": prefix + "-budget-title" });
    budgetCard.appendChild(makeElement(api, doc, "h4", { id: prefix + "-budget-title" }, "能量预算"));
    kineticBudget = makeBudgetRow(api, doc, "动能 K", "", "动能占当前总能量比例");
    potentialBudget = makeBudgetRow(api, doc, "势能 V", "pp-potential", "势能占当前总能量比例");
    var budget = makeElement(api, doc, "div", { className: "pp-budget" });
    budget.appendChild(kineticBudget.row);
    budget.appendChild(potentialBudget.row);
    budgetCard.appendChild(budget);
    var metrics = makeElement(api, doc, "div", { className: "pp-metrics" });
    kineticMetric = makeMetric(api, doc, "K=p₀²/2", "0");
    potentialMetric = makeMetric(api, doc, "V=1−cos θ₀", "0");
    energyMetric = makeMetric(api, doc, "H=K+V", "0");
    metrics.appendChild(kineticMetric.node);
    metrics.appendChild(potentialMetric.node);
    metrics.appendChild(energyMetric.node);
    budgetCard.appendChild(metrics);
    stage.appendChild(budgetCard);
    layout.appendChild(stage);
    shell.appendChild(layout);

    status = makeElement(api, doc, "p", { className: "pp-status", "aria-live": "polite", "aria-atomic": "true" });
    shell.appendChild(status);
    formula = makeElement(api, doc, "div", { className: "pp-formula", role: "img", "aria-label": "单摆无量纲哈密顿量与 Hamilton 方程" }, "H(θ,p)=p²/2+1−cos θ； θ̇=p， ṗ=−sin θ； p=±√(2(E−1+cos θ))");
    shell.appendChild(formula);
    note = makeElement(api, doc, "p", { className: "pp-small" }, "");
    shell.appendChild(note);
    root.replaceChildren(shell);

    function updateBudget(row, value, total, label) {
      var ratio = total > EPSILON ? clamp(value / total, 0, 1) : 0;
      row.fill.style.width = (ratio * 100).toFixed(2) + "%";
      row.value.textContent = label + "=" + format(api, value, 3);
      row.track.setAttribute("aria-valuemax", format(api, Math.max(total, 0), 3));
      row.track.setAttribute("aria-valuenow", format(api, value, 3));
      row.track.setAttribute("aria-valuetext", label + "=" + format(api, value, 3) + "；占总能量 " + (ratio * 100).toFixed(1) + "%");
    }

    function render(announce, presetLabel) {
      var result;
      state.theta = clamp(number(thetaControl.input.value, state.theta), -PI, PI);
      state.p = clamp(number(pControl.input.value, state.p), -2.8, 2.8);
      thetaControl.input.value = String(state.theta);
      pControl.input.value = String(state.p);
      result = {
        kinetic: kinetic(state.p),
        potential: potential(state.theta),
        energy: energy(state.theta, state.p)
      };
      thetaControl.output.textContent = angleText(state.theta);
      pControl.output.textContent = format(api, state.p, 2);
      kineticMetric.value.textContent = format(api, result.kinetic, 3);
      potentialMetric.value.textContent = format(api, result.potential, 3);
      energyMetric.value.textContent = format(api, result.energy, 3);
      updateBudget(kineticBudget, result.kinetic, result.energy, "K");
      updateBudget(potentialBudget, result.potential, result.energy, "V");
      status.textContent = "当前：" + regime(state.theta, state.p, result.energy) + "；θ₀=" + angleText(state.theta) + "，p₀=" + format(api, state.p, 2) + "，E=" + format(api, result.energy, 3) + "。";
      note.textContent = regimeNote(state.theta, state.p, result.energy) + " 摩擦若加入 ṗ=−sin θ−γp，会破坏能量守恒；此时不能继续把轨迹当作同一二维自治 Hamilton 系统的等能线。";
      presetButtons.forEach(function (preset) {
        var active = closeTo(state.theta, preset.theta, 1e-4) && closeTo(state.p, preset.p, 1e-4);
        preset.button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      drawPendulum(api, doc, pendulumChart, state, result);
      drawPhase(api, doc, phaseChart, state, result);
      if (announce && api && typeof api.announce === "function") {
        api.announce(root, (presetLabel ? "已切换到 " + presetLabel + "。" : "已更新初始状态。") + "当前 E=" + format(api, result.energy, 3) + "，" + regime(state.theta, state.p, result.energy) + "。");
      }
    }

    thetaControl.input.addEventListener("input", function () { render(true); });
    pControl.input.addEventListener("input", function () { render(true); });
    render(false);
  }

  window.CourseLearning.register("pendulum-phase", function (root, api) {
    mount(root, api);
  });
}());
