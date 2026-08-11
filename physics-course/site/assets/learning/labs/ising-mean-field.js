(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var SERIAL = 0;
  var SCAN_STEPS = 800;
  var ROOT_TOLERANCE = 1e-8;
  var DEDUPE_TOLERANCE = 1e-6;
  var CURVATURE_TOLERANCE = 1e-6;
  var PHI_TOLERANCE = 2e-7;

  function setAttrs(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    return node;
  }

  function makeElement(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeSvgElement(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    if (attrs) setAttrs(node, attrs);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function append(parent, child) {
    parent.appendChild(child);
    return child;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
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
    var end = text.length;
    while (end > 0 && text.charAt(end - 1) === "0") end -= 1;
    if (end > 0 && text.charAt(end - 1) === ".") end -= 1;
    return text.slice(0, end);
  }

  function signed(api, value, digits) {
    if (Math.abs(value) < 0.5 * Math.pow(10, -(digits || 3))) return "0";
    return value > 0 ? "+" + format(api, value, digits) : format(api, value, digits);
  }

  function logTwoCosh(value) {
    var absolute = Math.abs(value);
    return absolute + Math.log1p(Math.exp(-2 * absolute));
  }

  function stableTanh(value) {
    if (value > 20) return 1 - 2 * Math.exp(-2 * value);
    if (value < -20) return -1 + 2 * Math.exp(2 * value);
    return Math.tanh(value);
  }

  function sechSquared(value) {
    var absolute = Math.abs(value);
    if (absolute > 20) return 0;
    var cosh = Math.cosh(value);
    return 1 / (cosh * cosh);
  }

  function phi(m, t, h) {
    return m * m / 2 - t * logTwoCosh((m + h) / t);
  }

  function residual(m, t, h) {
    return stableTanh((m + h) / t) - m;
  }

  function curvature(m, t, h) {
    return 1 - sechSquared((m + h) / t) / t;
  }

  function acosh(value) {
    return Math.log(value + Math.sqrt(value * value - 1));
  }

  function uniqueSorted(values) {
    return values
      .sort(function (a, b) { return a - b; })
      .filter(function (value, index, list) {
        return index === 0 || Math.abs(value - list[index - 1]) > DEDUPE_TOLERANCE;
      });
  }

  /*
   * For t < 1, residual'(m) changes sign at most twice. Splitting at those
   * deterministic turning points makes every interval monotone, so bisection
   * cannot skip a root. The dense sign-change scan is a second deterministic
   * safety net; every candidate is deduplicated against the same root list.
   */
  function criticalPoints(t, h) {
    var points = [-1, 1];
    if (t < 1) {
      var u = acosh(1 / Math.sqrt(t));
      var left = t * (-u) - h;
      var right = t * u - h;
      if (left > -1 && left < 1) points.push(left);
      if (right > -1 && right < 1) points.push(right);
    }
    return uniqueSorted(points);
  }

  function bisect(left, right, leftValue, rightValue, t, h) {
    var a = left;
    var b = right;
    var fa = leftValue;
    var fb = rightValue;
    for (var step = 0; step < 90; step += 1) {
      var middle = (a + b) / 2;
      var fm = residual(middle, t, h);
      if (Math.abs(fm) < ROOT_TOLERANCE) return middle;
      if (fa * fm <= 0) {
        b = middle;
        fb = fm;
      } else {
        a = middle;
        fa = fm;
      }
    }
    return Math.abs(fa) < Math.abs(fb) ? a : b;
  }

  function addRoot(roots, candidate, t, h) {
    if (!Number.isFinite(candidate)) return;
    var value = clamp(candidate, -1, 1);
    if (Math.abs(residual(value, t, h)) > 2e-6) return;
    if (!roots.some(function (root) {
      return Math.abs(root - value) <= DEDUPE_TOLERANCE;
    })) {
      roots.push(value);
    }
  }

  function findRoots(t, h) {
    var cuts = criticalPoints(t, h);
    var roots = [];
    var index;

    for (index = 1; index < cuts.length - 1; index += 1) {
      if (Math.abs(residual(cuts[index], t, h)) < ROOT_TOLERANCE) {
        addRoot(roots, cuts[index], t, h);
      }
    }

    for (index = 0; index < cuts.length - 1; index += 1) {
      var left = cuts[index];
      var right = cuts[index + 1];
      var leftValue = residual(left, t, h);
      var rightValue = residual(right, t, h);
      if (leftValue * rightValue < 0) {
        addRoot(roots, bisect(left, right, leftValue, rightValue, t, h), t, h);
      }
    }

    var previousM = -1;
    var previousValue = residual(previousM, t, h);
    for (index = 1; index <= SCAN_STEPS; index += 1) {
      var currentM = -1 + 2 * index / SCAN_STEPS;
      var currentValue = residual(currentM, t, h);
      if (previousValue * currentValue < 0) {
        addRoot(
          roots,
          bisect(previousM, currentM, previousValue, currentValue, t, h),
          t,
          h
        );
      }
      previousM = currentM;
      previousValue = currentValue;
    }

    return roots.sort(function (a, b) { return a - b; });
  }

  function classifyRoots(t, h) {
    var values = findRoots(t, h);
    var minimumPhi = Infinity;
    values.forEach(function (value) {
      var candidate = phi(value, t, h);
      var second = curvature(value, t, h);
      if (second >= -CURVATURE_TOLERANCE && candidate < minimumPhi) {
        minimumPhi = candidate;
      }
    });

    var roots = values.map(function (value) {
      var second = curvature(value, t, h);
      var kind = second > CURVATURE_TOLERANCE
        ? "minimum"
        : second < -CURVATURE_TOLERANCE ? "maximum" : "marginal";
      var freeEnergy = phi(value, t, h);
      var global = kind !== "maximum" && Math.abs(freeEnergy - minimumPhi) <= PHI_TOLERANCE;
      return {
        m: value,
        phi: freeEnergy,
        curvature: second,
        kind: kind,
        global: global
      };
    });

    return {
      t: t,
      h: h,
      roots: roots,
      minima: roots.filter(function (root) {
        return root.kind === "minimum" || (root.kind === "marginal" && root.global);
      }),
      globals: roots.filter(function (root) { return root.global; })
    };
  }

  function kindLabel(root) {
    if (root.kind === "minimum" && root.global) return "稳定极小值 · 全局平衡";
    if (root.kind === "minimum") return "亚稳极小值";
    if (root.kind === "maximum") return "不稳定极大值";
    if (root.global) return "临界平坦极小值 · 全局平衡";
    return "临界/旋节边界";
  }

  function rootClass(root) {
    if (root.global) return "cl-ising-root-global";
    if (root.kind === "minimum") return "cl-ising-root-meta";
    if (root.kind === "maximum") return "cl-ising-root-unstable";
    return "cl-ising-root-marginal";
  }

  function injectStyles(doc) {
    if (doc.querySelector("style[data-cl-ising-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-cl-ising-style", "");
    style.textContent = [
      ".cl-ising-shell{display:grid;gap:16px;min-width:0}",
      ".cl-ising-controls{display:grid;gap:12px;padding:14px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}",
      ".cl-ising-control-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}",
      ".cl-ising-control{display:grid;gap:5px;min-width:0}",
      ".cl-ising-control > span{color:var(--fg-soft);font-size:13px;font-weight:650}",
      ".cl-ising-control output{color:var(--accent);font-variant-numeric:tabular-nums}",
      ".cl-ising-control input[type=range]{width:100%;min-height:44px}",
      ".cl-ising-presets{display:flex;flex-wrap:wrap;gap:8px}",
      ".cl-ising-presets button{min-height:44px;flex:1 1 160px}",
      ".cl-ising-visuals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;min-width:0}",
      ".cl-ising-chart-card{min-width:0;padding:10px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}",
      ".cl-ising-chart-card h3{margin:0 0 7px;font-size:14px}",
      ".cl-ising-chart-card p{margin:7px 0 0;color:var(--fg-soft);font-size:12px;line-height:1.55}",
      ".cl-ising-chart-card.cl-ising-lattice-card{grid-column:1/-1}",
      ".cl-ising-svg{display:block;width:100%;max-width:100%;height:auto;overflow:visible;color:var(--fg)}",
      ".cl-ising-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
      ".cl-ising-grid-line{stroke:var(--border);stroke-width:1;opacity:.5}",
      ".cl-ising-axis{stroke:var(--fg-soft);stroke-width:1.2}",
      ".cl-ising-zero-line{stroke:var(--fg-soft);stroke-width:1;stroke-dasharray:4 4;opacity:.7}",
      ".cl-ising-free-line{fill:none;stroke:var(--accent);stroke-width:3;stroke-linejoin:round;stroke-linecap:round}",
      ".cl-ising-self-line{fill:none;stroke:var(--accent);stroke-width:2.8;stroke-linejoin:round;stroke-linecap:round}",
      ".cl-ising-diagonal{fill:none;stroke:var(--fg-soft);stroke-width:1.7;stroke-dasharray:6 5}",
      ".cl-ising-root-global{fill:var(--cl-green,#39734d);stroke:var(--bg);stroke-width:2}",
      ".cl-ising-root-meta{fill:var(--cl-gold,#9b6a12);stroke:var(--bg);stroke-width:2}",
      ".cl-ising-root-unstable{fill:var(--cl-red,#b64335);stroke:var(--bg);stroke-width:2}",
      ".cl-ising-root-marginal{fill:var(--fg-soft);stroke:var(--bg);stroke-width:2}",
      ".cl-ising-panel{fill:var(--block-bg,var(--bg));stroke:var(--border);stroke-width:1}",
      ".cl-ising-spin-plus{fill:var(--cl-green,#39734d);stroke:var(--bg);stroke-width:1}",
      ".cl-ising-spin-minus{fill:var(--cl-red,#b64335);stroke:var(--bg);stroke-width:1}",
      ".cl-ising-spin-text{fill:var(--bg)!important;font-size:11px;font-weight:800;text-anchor:middle;dominant-baseline:central}",
      ".cl-ising-muted{fill:var(--fg-soft)!important;font-size:11px}",
      ".cl-ising-small{fill:var(--fg-soft)!important;font-size:11px}",
      ".cl-ising-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:8px;color:var(--fg-soft);font-size:12px}",
      ".cl-ising-legend span{display:inline-flex;align-items:center;gap:5px}",
      ".cl-ising-dot{display:inline-block;width:10px;height:10px;border-radius:50%}",
      ".cl-ising-dot-global{background:var(--cl-green,#39734d)}",
      ".cl-ising-dot-meta{background:var(--cl-gold,#9b6a12)}",
      ".cl-ising-dot-unstable{background:var(--cl-red,#b64335)}",
      ".cl-ising-dot-marginal{background:var(--fg-soft)}",
      ".cl-ising-status{margin:0;padding:10px 12px;border-left:3px solid var(--accent);background:var(--block-bg);line-height:1.6}",
      ".cl-ising-table-wrap{max-width:100%;overflow-x:auto}",
      ".cl-ising-table{width:100%;border-collapse:collapse;font-size:12.5px;table-layout:auto}",
      ".cl-ising-table th,.cl-ising-table td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;font-variant-numeric:tabular-nums}",
      ".cl-ising-table th{color:var(--fg-soft);font-weight:700}",
      ".cl-ising-table td:first-child,.cl-ising-table td:nth-child(2),.cl-ising-table td:nth-child(3){white-space:nowrap}",
      ".cl-ising-note{margin:0;color:var(--fg-soft);font-size:12.5px;line-height:1.65}",
      "@media (max-width:700px){.cl-ising-control-grid{grid-template-columns:minmax(0,1fr)}.cl-ising-visuals{grid-template-columns:minmax(0,1fr)}.cl-ising-chart-card.cl-ising-lattice-card{grid-column:auto}.cl-ising-chart-card{padding:7px}.cl-ising-table{font-size:12px}.cl-ising-table th,.cl-ising-table td{padding:6px 5px}}"
    ].join("");
    (doc.head || doc.documentElement).appendChild(style);
  }

  function makeRangeControl(doc, prefix, label, min, max, step, value, suffix) {
    var wrapper = makeElement(doc, "label", "cl-ising-control");
    var caption = makeElement(doc, "span", "", label + "：");
    var output = makeElement(doc, "output", "", "");
    var input = makeElement(doc, "input");
    input.id = prefix;
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.setAttribute("aria-label", label);
    output.setAttribute("for", prefix);
    caption.appendChild(output);
    if (suffix) caption.appendChild(doc.createTextNode(suffix));
    wrapper.appendChild(caption);
    wrapper.appendChild(input);
    return { wrapper: wrapper, input: input, output: output };
  }

  function makeMetric(doc, label, value, className) {
    var node = makeElement(doc, "div", "cl-metric" + (className ? " " + className : ""));
    node.appendChild(makeElement(doc, "span", "", label));
    var valueNode = makeElement(doc, "strong", "", value);
    node.appendChild(valueNode);
    return { node: node, value: valueNode };
  }

  function makeChart(doc, prefix, title, viewBox) {
    var titleId = prefix + "-title";
    var descId = prefix + "-desc";
    var svg = makeSvgElement(doc, "svg", {
      className: "cl-ising-svg",
      viewBox: viewBox,
      role: "img",
      "aria-labelledby": titleId + " " + descId
    });
    var titleNode = makeSvgElement(doc, "title", { id: titleId }, title);
    var descNode = makeSvgElement(doc, "desc", { id: descId }, "");
    append(svg, titleNode);
    append(svg, descNode);
    return { svg: svg, title: titleNode, desc: descNode };
  }

  function makeChartCard(doc, title, caption, chart, className) {
    var card = makeElement(doc, "section", "cl-ising-chart-card" + (className ? " " + className : ""));
    card.setAttribute("aria-labelledby", chart.title.id);
    card.appendChild(makeElement(doc, "h3", "", title));
    card.appendChild(chart.svg);
    card.appendChild(makeElement(doc, "p", "", caption));
    return card;
  }

  function svgText(doc, parent, x, y, text, className, attrs) {
    var attributes = Object.assign({ x: x, y: y }, attrs || {});
    if (className) attributes.className = className;
    append(parent, makeSvgElement(doc, "text", attributes, text));
  }

  function pathForSamples(samples, sx, sy, fn) {
    return samples.map(function (value, index) {
      return (index === 0 ? "M " : "L ") + sx(value).toFixed(2) + " " + sy(fn(value)).toFixed(2);
    }).join(" ");
  }

  function drawFreeEnergy(doc, chart, result, api) {
    var svg = chart.svg;
    clear(svg);
    append(svg, makeSvgElement(doc, "title", { id: chart.title.id }, "平均场无量纲自由能地形"));
    var description = "曲线显示 phi(m;t,h)，圆点是全部驻点；绿色为全局平衡，金色为亚稳极小值，红色为不稳定极大值。当前 t=" + format(api, result.t, 2) + "，h=" + signed(api, result.h, 2) + "。";
    append(svg, makeSvgElement(doc, "desc", { id: chart.desc.id }, description));

    var left = 48;
    var right = 428;
    var top = 28;
    var bottom = 254;
    var samples = [];
    var minimum = Infinity;
    var maximum = -Infinity;
    for (var index = 0; index <= 200; index += 1) {
      var sample = -1 + 2 * index / 200;
      var value = phi(sample, result.t, result.h);
      samples.push(sample);
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    var span = Math.max(maximum - minimum, 0.04);
    var yMin = Math.min(0, minimum) - span * 0.12;
    var yMax = Math.max(0, maximum) + span * 0.12;
    var sx = function (value) { return left + (value + 1) / 2 * (right - left); };
    var sy = function (value) { return bottom - (value - yMin) / (yMax - yMin) * (bottom - top); };

    [-1, 0, 1].forEach(function (tick) {
      var x = sx(tick);
      append(svg, makeSvgElement(doc, "line", {
        x1: x, y1: top, x2: x, y2: bottom, className: "cl-ising-grid-line"
      }));
      svgText(doc, svg, x, bottom + 18, String(tick), "cl-ising-small", { "text-anchor": "middle" });
    });
    [yMin, (yMin + yMax) / 2, yMax].forEach(function (tick) {
      var y = sy(tick);
      append(svg, makeSvgElement(doc, "line", {
        x1: left, y1: y, x2: right, y2: y, className: "cl-ising-grid-line"
      }));
      svgText(doc, svg, left - 7, y + 4, format(api, tick, 2), "cl-ising-small", { "text-anchor": "end" });
    });
    if (yMin < 0 && yMax > 0) {
      append(svg, makeSvgElement(doc, "line", {
        x1: left, y1: sy(0), x2: right, y2: sy(0), className: "cl-ising-zero-line"
      }));
    }
    append(svg, makeSvgElement(doc, "line", {
      x1: left, y1: bottom, x2: right, y2: bottom, className: "cl-ising-axis"
    }));
    append(svg, makeSvgElement(doc, "line", {
      x1: sx(0), y1: top, x2: sx(0), y2: bottom, className: "cl-ising-axis"
    }));
    append(svg, makeSvgElement(doc, "path", {
      d: pathForSamples(samples, sx, sy, function (value) { return phi(value, result.t, result.h); }),
      className: "cl-ising-free-line"
    }));
    result.roots.forEach(function (root) {
      append(svg, makeSvgElement(doc, "circle", {
        cx: sx(root.m),
        cy: sy(root.phi),
        r: root.global ? 6.5 : 5.5,
        className: rootClass(root)
      }));
    });
    svgText(doc, svg, (left + right) / 2, 292, "平均磁化 m", "cl-ising-small", { "text-anchor": "middle" });
    svgText(doc, svg, 15, top + 2, "φ(m;t,h)", "cl-ising-small");
  }

  function drawSelfConsistency(doc, chart, result, api) {
    var svg = chart.svg;
    clear(svg);
    append(svg, makeSvgElement(doc, "title", { id: chart.title.id }, "自洽方程交点"));
    var description = "虚线是 y=m，蓝线是 y=tanh((m+h)/t)；两者全部交点就是驻点。当前共有 " + result.roots.length + " 个交点。";
    append(svg, makeSvgElement(doc, "desc", { id: chart.desc.id }, description));

    var left = 48;
    var right = 428;
    var top = 28;
    var bottom = 254;
    var sx = function (value) { return left + (value + 1) / 2 * (right - left); };
    var sy = function (value) { return bottom - (value + 1.1) / 2.2 * (bottom - top); };
    [-1, 0, 1].forEach(function (tick) {
      var x = sx(tick);
      var y = sy(tick);
      append(svg, makeSvgElement(doc, "line", {
        x1: x, y1: top, x2: x, y2: bottom, className: "cl-ising-grid-line"
      }));
      append(svg, makeSvgElement(doc, "line", {
        x1: left, y1: y, x2: right, y2: y, className: "cl-ising-grid-line"
      }));
      svgText(doc, svg, x, bottom + 18, String(tick), "cl-ising-small", { "text-anchor": "middle" });
      svgText(doc, svg, left - 7, y + 4, String(tick), "cl-ising-small", { "text-anchor": "end" });
    });
    append(svg, makeSvgElement(doc, "line", {
      x1: left, y1: sy(0), x2: right, y2: sy(0), className: "cl-ising-axis"
    }));
    append(svg, makeSvgElement(doc, "line", {
      x1: sx(0), y1: top, x2: sx(0), y2: bottom, className: "cl-ising-axis"
    }));
    append(svg, makeSvgElement(doc, "path", {
      d: "M " + sx(-1).toFixed(2) + " " + sy(-1).toFixed(2) + " L " + sx(1).toFixed(2) + " " + sy(1).toFixed(2),
      className: "cl-ising-diagonal"
    }));
    var samples = [];
    for (var index = 0; index <= 200; index += 1) {
      samples.push(-1 + 2 * index / 200);
    }
    append(svg, makeSvgElement(doc, "path", {
      d: pathForSamples(samples, sx, sy, function (value) {
        return stableTanh((value + result.h) / result.t);
      }),
      className: "cl-ising-self-line"
    }));
    result.roots.forEach(function (root) {
      append(svg, makeSvgElement(doc, "circle", {
        cx: sx(root.m),
        cy: sy(root.m),
        r: root.global ? 6.5 : 5.5,
        className: rootClass(root)
      }));
    });
    svgText(doc, svg, right - 5, sy(1) - 10, "y=m", "cl-ising-small", { "text-anchor": "end" });
    svgText(doc, svg, right - 5, sy(stableTanh((1 + result.h) / result.t)) + 17, "tanh", "cl-ising-small", { "text-anchor": "end" });
    svgText(doc, svg, (left + right) / 2, 292, "m（输入）", "cl-ising-small", { "text-anchor": "middle" });
    svgText(doc, svg, 15, top + 2, "y（输出）", "cl-ising-small");
  }

  function drawBranch(doc, svg, root, panelX, panelY, panelWidth, api) {
    var panelHeight = 192;
    append(svg, makeSvgElement(doc, "rect", {
      x: panelX, y: panelY, width: panelWidth, height: panelHeight, rx: 5, className: "cl-ising-panel"
    }));
    svgText(doc, svg, panelX + 12, panelY + 21, "分支 m=" + signed(api, root.m, 3), "cl-ising-small");
    svgText(
      doc,
      svg,
      panelX + panelWidth - 12,
      panelY + 21,
      root.global ? (root.kind === "marginal" ? "临界全局平衡" : "全局平衡") : "亚稳极小值",
      "cl-ising-small",
      { "text-anchor": "end" }
    );

    var columns = 10;
    var rows = 4;
    var total = columns * rows;
    var plusCount = Math.round((1 + root.m) / 2 * total);
    var startX = panelX + 17;
    var startY = panelY + 52;
    var cellWidth = Math.min(31, (panelWidth - 30) / columns);
    var cellHeight = 25;
    for (var index = 0; index < total; index += 1) {
      var row = Math.floor(index / columns);
      var column = index % columns;
      var plus = index < plusCount;
      var cx = startX + column * cellWidth + cellWidth / 2;
      var cy = startY + row * cellHeight;
      append(svg, makeSvgElement(doc, "circle", {
        cx: cx, cy: cy, r: 9, className: plus ? "cl-ising-spin-plus" : "cl-ising-spin-minus"
      }));
      svgText(doc, svg, cx, cy + 1, plus ? "+" : "−", "cl-ising-spin-text");
    }
    svgText(
      doc,
      svg,
      panelX + 12,
      panelY + panelHeight - 13,
      "由 m 构造：N₊≈" + plusCount + "，N₋≈" + (total - plusCount),
      "cl-ising-small"
    );
  }

  function drawEmptyBranch(doc, svg, panelX, panelY, panelWidth) {
    var panelHeight = 192;
    append(svg, makeSvgElement(doc, "rect", {
      x: panelX, y: panelY, width: panelWidth, height: panelHeight, rx: 5, className: "cl-ising-panel"
    }));
    svgText(doc, svg, panelX + panelWidth / 2, panelY + 84, "没有第二个局部极小值", "cl-ising-muted", { "text-anchor": "middle" });
    svgText(doc, svg, panelX + panelWidth / 2, panelY + 106, "外场或高温留下唯一分支", "cl-ising-muted", { "text-anchor": "middle" });
  }

  function drawLattice(doc, chart, result, api) {
    var svg = chart.svg;
    clear(svg);
    append(svg, makeSvgElement(doc, "title", { id: chart.title.id }, "由平均磁化构造的示意格点"));
    var description = "示意格点不是 Monte Carlo 构型：每个分支用固定数量的加号和减号表示平均磁化。当前显示 " + result.minima.length + " 个平衡分支。";
    append(svg, makeSvgElement(doc, "desc", { id: chart.desc.id }, description));
    var panelWidth = 438;
    var branches = result.minima.slice(0, 2);
    if (branches[0]) drawBranch(doc, svg, branches[0], 12, 16, panelWidth, api);
    else drawEmptyBranch(doc, svg, 12, 16, panelWidth);
    if (branches[1]) drawBranch(doc, svg, branches[1], 470, 16, panelWidth, api);
    else drawEmptyBranch(doc, svg, 470, 16, panelWidth);
    svgText(doc, svg, 12, 227, "＋/− 仅表示由平均磁化确定的示意自旋；排列固定，不是随机抽样。", "cl-ising-small");
  }

  function globalSummary(result, api) {
    if (!result.globals.length) return "没有可判定的全局极小值";
    return result.globals.map(function (root) {
      return "m=" + signed(api, root.m, 4) + (root.kind === "marginal" ? "（临界平坦）" : "");
    }).join(" 与 ") + (result.globals.length > 1 ? "（简并）" : "");
  }

  function renderTable(doc, body, result, api) {
    clear(body);
    result.roots.forEach(function (root) {
      var row = makeElement(doc, "tr");
      [
        signed(api, root.m, 6),
        format(api, root.phi, 6),
        format(api, root.curvature, 6),
        kindLabel(root),
        root.global ? "是" : "否"
      ].forEach(function (value) {
        row.appendChild(makeElement(doc, "td", "", value));
      });
      body.appendChild(row);
    });
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    injectStyles(doc);
    SERIAL += 1;
    var prefix = "cl-ising-" + SERIAL;
    var state = { t: 0.8, h: 0 };

    var shell = makeElement(doc, "div", "cl-ising-shell");
    var controls = makeElement(doc, "section", "cl-ising-controls");
    controls.setAttribute("aria-labelledby", prefix + "-controls-title");
    controls.appendChild(makeElement(doc, "h3", "", "控制无量纲温度与外场"));
    controls.lastChild.id = prefix + "-controls-title";

    var controlGrid = makeElement(doc, "div", "cl-ising-control-grid");
    var tControl = makeRangeControl(doc, prefix + "-t", "温度 t=T/Tc", 0.1, 2.5, 0.01, state.t, "");
    var hControl = makeRangeControl(doc, prefix + "-h", "外场 h", -0.4, 0.4, 0.01, state.h, "");
    controlGrid.appendChild(tControl.wrapper);
    controlGrid.appendChild(hControl.wrapper);
    controls.appendChild(controlGrid);

    var presets = makeElement(doc, "div", "cl-ising-presets");
    [
      { t: 0.8, h: 0, label: "核对：t=0.80，h=0" },
      { t: 1.2, h: 0, label: "高温：t=1.20，h=0" },
      { t: 0.8, h: 0.05, label: "正场：t=0.80，h=+0.05" },
      { t: 0.8, h: -0.05, label: "负场：t=0.80，h=−0.05" }
    ].forEach(function (preset) {
      var button = makeElement(doc, "button", "", preset.label);
      button.type = "button";
      button.addEventListener("click", function () {
        state.t = preset.t;
        state.h = preset.h;
        tControl.input.value = String(state.t);
        hControl.input.value = String(state.h);
        update(true);
      });
      preset.button = button;
      presets.appendChild(button);
    });
    controls.appendChild(presets);
    shell.appendChild(controls);

    var status = makeElement(doc, "p", "cl-ising-status", "");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    shell.appendChild(status);

    var visuals = makeElement(doc, "div", "cl-ising-visuals");
    var freeChart = makeChart(doc, prefix + "-free", "平均场无量纲自由能地形", "0 0 440 300");
    var selfChart = makeChart(doc, prefix + "-self", "自洽方程的全部交点", "0 0 440 300");
    var latticeChart = makeChart(doc, prefix + "-lattice", "由平均磁化构造的示意格点", "0 0 920 240");
    visuals.appendChild(makeChartCard(
      doc,
      "自由能地形 φ(m;t,h)",
      "圆点标出全部驻点；最低的局部极小值才是全局平衡。",
      freeChart
    ));
    visuals.appendChild(makeChartCard(
      doc,
      "自洽交点 y=m 与 y=tanh((m+h)/t)",
      "交点与左图驻点一一对应；虚线直线不是另一种模型。",
      selfChart
    ));
    visuals.appendChild(makeChartCard(
      doc,
      "由平均磁化构造的示意格点",
      "固定格点数按 m 分配 +/−，用来显示分支，不是 Monte Carlo 微观构型。",
      latticeChart,
      "cl-ising-lattice-card"
    ));
    shell.appendChild(visuals);

    var legend = makeElement(doc, "div", "cl-ising-legend");
    [
      ["cl-ising-dot cl-ising-dot-global", "全局平衡（含临界平坦根）"],
      ["cl-ising-dot cl-ising-dot-meta", "亚稳极小值"],
      ["cl-ising-dot cl-ising-dot-unstable", "不稳定极大值"],
      ["cl-ising-dot cl-ising-dot-marginal", "旋节边界（非全局）"]
    ].forEach(function (item) {
      var entry = makeElement(doc, "span");
      entry.appendChild(makeElement(doc, "i", item[0]));
      entry.appendChild(doc.createTextNode(item[1]));
      legend.appendChild(entry);
    });
    shell.appendChild(legend);

    var tableSection = makeElement(doc, "section", "");
    tableSection.setAttribute("aria-labelledby", prefix + "-table-title");
    var tableTitle = makeElement(doc, "h3", "", "驻点清单（确定性数值核对）");
    tableTitle.id = prefix + "-table-title";
    tableSection.appendChild(tableTitle);
    var tableWrap = makeElement(doc, "div", "cl-ising-table-wrap");
    var table = makeElement(doc, "table", "cl-ising-table");
    var head = makeElement(doc, "thead");
    var headRow = makeElement(doc, "tr");
    ["m", "φ(m)", "φ''(m)", "分类", "全局平衡"].forEach(function (label) {
      headRow.appendChild(makeElement(doc, "th", "", label));
    });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = makeElement(doc, "tbody");
    table.appendChild(body);
    tableWrap.appendChild(table);
    tableSection.appendChild(tableWrap);
    tableSection.appendChild(makeElement(
      doc,
      "p",
      "cl-ising-note",
      "数值求根只在 m∈[−1,1] 内工作；低温时根可能非常靠近边界。若 t<1 且 h=0，两个对称的全局平衡会同时标记，不会任意删去一个。"
    ));
    shell.appendChild(tableSection);
    root.replaceChildren(shell);

    function update(announce) {
      state.t = clamp(number(tControl.input.value, 0.8), 0.1, 2.5);
      state.h = clamp(number(hControl.input.value, 0), -0.4, 0.4);
      var result = classifyRoots(state.t, state.h);
      tControl.output.textContent = format(api, state.t, 2);
      hControl.output.textContent = signed(api, state.h, 2);
      var summary = "t=" + format(api, state.t, 2) + "，h=" + signed(api, state.h, 2) +
        "；找到 " + result.roots.length + " 个驻点。全局平衡：" + globalSummary(result, api) + "。";
      status.textContent = summary;
      renderTable(doc, body, result, api);
      drawFreeEnergy(doc, freeChart, result, api);
      drawSelfConsistency(doc, selfChart, result, api);
      drawLattice(doc, latticeChart, result, api);
      if (announce && api && typeof api.announce === "function") api.announce(root, summary);
    }

    tControl.input.addEventListener("input", function () { update(true); });
    hControl.input.addEventListener("input", function () { update(true); });
    update(false);
  }

  if (window.CourseLearning && typeof window.CourseLearning.register === "function") {
    window.CourseLearning.register("ising-mean-field", function (root, api) {
      mount(root, api);
    });
  }
}());
