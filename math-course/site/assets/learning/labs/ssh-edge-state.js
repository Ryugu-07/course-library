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
  var EPSILON = 1e-10;
  var INSTANCE = 0;
  var STYLE_ID = "ssh-edge-state-style";

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
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(
        child && child.nodeType ? child : doc.createTextNode(String(child))
      );
    });
    return node;
  }

  function makeElement(doc, tag, attrs, children) {
    return appendChildren(
      setAttributes(doc.createElement(tag), attrs || {}),
      children,
      doc
    );
  }

  function makeSvg(doc, tag, attrs, children) {
    return appendChildren(
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}),
      children,
      doc
    );
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatNumber(api, value, digits) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) < 0.0005) value = 0;
    if (api && typeof api.format === "function") {
      return api.format(value, digits === undefined ? 3 : digits);
    }
    return value.toFixed(digits === undefined ? 3 : digits)
      .replace(/0+$/, "")
      .replace(/\.$/, "");
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-ssh-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-ssh-style", "true");
    style.id = STYLE_ID;
    style.textContent = [
      ".ssh-lab{--ssh-fg:var(--fg,#292722);--ssh-muted:var(--fg-soft,#6b6557);--ssh-bg:var(--bg,#fff);--ssh-panel:var(--block-bg,#f4f1e9);--ssh-border:var(--border,#ded7c7);--ssh-accent:var(--accent,#315f9d);--ssh-t1:var(--cl-blue,#315f9d);--ssh-t2:var(--cl-gold,#9b6a12);--ssh-green:var(--cl-green,#39734d);--ssh-red:var(--cl-red,#b64335);box-sizing:border-box;color:var(--ssh-fg);font-size:.96em;line-height:1.55;min-width:0}",
      ".ssh-lab *,.ssh-lab *::before,.ssh-lab *::after{box-sizing:border-box}",
      ".ssh-lab .ssh-shell{display:grid;gap:14px;min-width:0}",
      ".ssh-lab .ssh-heading{color:var(--ssh-accent);font-size:1.25rem;margin:0}",
      ".ssh-lab .ssh-intro,.ssh-lab .ssh-note,.ssh-lab .ssh-status,.ssh-lab .ssh-live{color:var(--ssh-muted);margin:0}",
      ".ssh-lab .ssh-layout{align-items:start;display:grid;gap:16px;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);min-width:0}",
      ".ssh-lab .ssh-controls,.ssh-lab .ssh-stage{min-width:0}",
      ".ssh-lab .ssh-controls{display:grid;gap:11px}",
      ".ssh-lab .ssh-control-heading{font-size:1rem;margin:0}",
      ".ssh-lab .ssh-formula{background:var(--ssh-bg);border-left:3px solid var(--ssh-accent);font-family:'SF Mono',Menlo,Consolas,monospace;font-size:.86em;line-height:1.65;margin:0;overflow-x:auto;padding:8px 10px;white-space:nowrap}",
      ".ssh-lab .ssh-field{display:grid;gap:5px;min-width:0}",
      ".ssh-lab .ssh-field-caption{align-items:baseline;color:var(--ssh-muted);display:flex;flex-wrap:wrap;font-size:.88em;font-weight:650;gap:6px;justify-content:space-between}",
      ".ssh-lab .ssh-output{color:var(--ssh-accent);font-variant-numeric:tabular-nums}",
      ".ssh-lab input[type=range]{accent-color:var(--ssh-accent);display:block;margin:0;min-height:44px;width:100%}",
      ".ssh-lab select{background:var(--ssh-bg);border:1px solid var(--ssh-border);border-radius:6px;color:var(--ssh-fg);font:inherit;min-height:44px;padding:7px 10px;width:100%}",
      ".ssh-lab .ssh-preset-label{color:var(--ssh-muted);font-size:.88em;font-weight:650}",
      ".ssh-lab .ssh-preset-grid{display:grid;gap:7px;grid-template-columns:repeat(3,minmax(0,1fr))}",
      ".ssh-lab .ssh-button{background:var(--ssh-bg);border:1px solid var(--ssh-border);border-radius:6px;color:var(--ssh-fg);cursor:pointer;font:inherit;line-height:1.35;min-height:44px;min-width:0;overflow-wrap:anywhere;padding:7px 9px}",
      ".ssh-lab .ssh-button:hover{border-color:var(--ssh-accent)}",
      ".ssh-lab .ssh-button[aria-pressed=true],.ssh-lab .ssh-button.ssh-primary{background:var(--ssh-accent);border-color:var(--ssh-accent);color:var(--ssh-bg);font-weight:700}",
      ".ssh-lab .ssh-button:focus-visible,.ssh-lab select:focus-visible,.ssh-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".ssh-lab .ssh-stage-frame{background:var(--ssh-bg);border:1px solid var(--ssh-border);border-radius:7px;min-width:0;padding:9px}",
      ".ssh-lab .ssh-stage-title{align-items:baseline;color:var(--ssh-muted);display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;margin:0 0 7px}",
      ".ssh-lab .ssh-figure{border:1px solid var(--ssh-border);border-radius:5px;margin:0;overflow:hidden;padding:3px}",
      ".ssh-lab .ssh-svg{color:var(--ssh-fg);display:block;height:auto;max-width:100%;width:100%}",
      ".ssh-lab .ssh-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
      ".ssh-lab .ssh-panel-bg{fill:var(--ssh-bg);stroke:var(--ssh-border);stroke-width:1}",
      ".ssh-lab .ssh-gridline{fill:none;stroke:var(--ssh-border);stroke-opacity:.62;stroke-width:1}",
      ".ssh-lab .ssh-axis{fill:none;stroke:var(--ssh-fg);stroke-opacity:.55;stroke-width:1.2}",
      ".ssh-lab .ssh-zero{fill:none;stroke:var(--ssh-muted);stroke-dasharray:5 4;stroke-width:1.2}",
      ".ssh-lab .ssh-tick{fill:var(--ssh-muted)!important;font-size:11px}",
      ".ssh-lab .ssh-axis-label{fill:var(--ssh-muted)!important;font-size:12px;font-weight:650}",
      ".ssh-lab .ssh-panel-title{fill:var(--ssh-fg)!important;font-size:14px;font-weight:750}",
      ".ssh-lab .ssh-callout{fill:var(--ssh-accent)!important;font-size:12px;font-weight:750}",
      ".ssh-lab .ssh-bond-t1{stroke:var(--ssh-t1);stroke-linecap:round}",
      ".ssh-lab .ssh-bond-t2{stroke:var(--ssh-t2);stroke-linecap:round}",
      ".ssh-lab .ssh-site-a{fill:var(--ssh-accent);stroke:var(--ssh-bg);stroke-width:2}",
      ".ssh-lab .ssh-site-b{fill:var(--ssh-green);stroke:var(--ssh-bg);stroke-width:2}",
      ".ssh-lab .ssh-spectrum-level{stroke:var(--ssh-muted);stroke-linecap:round;stroke-width:2}",
      ".ssh-lab .ssh-spectrum-edge{stroke:var(--ssh-t2);stroke-linecap:round;stroke-width:3.2}",
      ".ssh-lab .ssh-spectrum-selected{stroke:var(--ssh-accent);stroke-linecap:round;stroke-width:4.5}",
      ".ssh-lab .ssh-prob-a{fill:var(--ssh-accent);fill-opacity:.82}",
      ".ssh-lab .ssh-prob-b{fill:var(--ssh-green);fill-opacity:.82}",
      ".ssh-lab .ssh-qpath{fill:none;stroke:var(--ssh-accent);stroke-linejoin:round;stroke-width:3}",
      ".ssh-lab .ssh-q-marker{fill:var(--ssh-t2);stroke:var(--ssh-bg);stroke-width:1.5}",
      ".ssh-lab .ssh-origin{fill:none;stroke:var(--ssh-red);stroke-width:2}",
      ".ssh-lab .ssh-metrics{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));margin-top:10px}",
      ".ssh-lab .ssh-metric{background:var(--ssh-panel);border-top:2px solid var(--ssh-border);min-width:0;padding:8px}",
      ".ssh-lab .ssh-metric-label{color:var(--ssh-muted);display:block;font-size:.76em;line-height:1.35}",
      ".ssh-lab .ssh-metric-value{color:var(--ssh-fg);display:block;font-size:1rem;font-variant-numeric:tabular-nums;margin-top:3px;overflow-wrap:anywhere}",
      ".ssh-lab .ssh-legend{color:var(--ssh-muted);display:flex;flex-wrap:wrap;font-size:.82em;gap:10px;margin-top:8px}",
      ".ssh-lab .ssh-legend-item{align-items:center;display:inline-flex;gap:5px}",
      ".ssh-lab .ssh-swatch{border-top:3px solid var(--ssh-muted);display:inline-block;height:0;width:22px}",
      ".ssh-lab .ssh-swatch-t1{border-color:var(--ssh-t1)}",
      ".ssh-lab .ssh-swatch-t2{border-color:var(--ssh-t2)}",
      ".ssh-lab .ssh-swatch-edge{border-color:var(--ssh-accent);border-top-width:4px}",
      ".ssh-lab .ssh-checks{color:var(--ssh-muted);font-size:.84em;line-height:1.55;margin:8px 0 0}",
      ".ssh-lab .ssh-checks strong{color:var(--ssh-fg)}",
      "@media (max-width:820px){.ssh-lab .ssh-layout{grid-template-columns:minmax(0,1fr)}.ssh-lab .ssh-stage-frame{padding:7px}.ssh-lab .ssh-figure{padding:2px}}",
      "@media (max-width:520px){.ssh-lab .ssh-preset-grid{grid-template-columns:minmax(0,1fr)}.ssh-lab .ssh-figure{overflow-x:auto;-webkit-overflow-scrolling:touch}.ssh-lab .ssh-svg{min-width:720px;max-width:none}.ssh-lab .ssh-svg text{font-size:10px}.ssh-lab .ssh-panel-title{font-size:12px}.ssh-lab .ssh-axis-label,.ssh-lab .ssh-callout{font-size:11px}}",
      "@media (prefers-reduced-motion:reduce){.ssh-lab *{scroll-behavior:auto!important;transition:none!important}}"
    ].join("\n");
    var host = doc.head || doc.documentElement || doc.body;
    if (host) host.appendChild(style);
  }

  function rangeField(doc, label, min, max, step, value) {
    var wrapper = makeElement(doc, "label", { className: "ssh-field" });
    var caption = makeElement(doc, "span", { className: "ssh-field-caption" });
    var text = makeElement(doc, "span", { text: label });
    var output = makeElement(doc, "output", { className: "ssh-output" });
    caption.appendChild(text);
    caption.appendChild(output);
    var input = makeElement(doc, "input", {
      type: "range",
      min: min,
      max: max,
      step: step,
      value: value,
      "aria-label": label
    });
    wrapper.appendChild(caption);
    wrapper.appendChild(input);
    return { wrapper: wrapper, input: input, output: output };
  }

  function selectField(doc, label, options, value) {
    var wrapper = makeElement(doc, "label", { className: "ssh-field" });
    var caption = makeElement(doc, "span", { className: "ssh-field-caption" }, label);
    var select = makeElement(doc, "select", { "aria-label": label });
    options.forEach(function (option) {
      select.appendChild(makeElement(doc, "option", {
        value: option.value,
        text: option.label
      }));
    });
    select.value = value;
    wrapper.appendChild(caption);
    wrapper.appendChild(select);
    return { wrapper: wrapper, select: select };
  }

  function actionButton(doc, label) {
    return makeElement(doc, "button", {
      type: "button",
      className: "ssh-button",
      text: label
    });
  }

  function metricGrid(doc, items) {
    var grid = makeElement(doc, "div", { className: "ssh-metrics" });
    var refs = {};
    items.forEach(function (item) {
      var card = makeElement(doc, "div", { className: "ssh-metric" });
      card.appendChild(makeElement(doc, "span", {
        className: "ssh-metric-label",
        text: item.label
      }));
      var value = makeElement(doc, "strong", {
        className: "ssh-metric-value",
        text: "—"
      });
      card.appendChild(value);
      grid.appendChild(card);
      refs[item.id] = value;
    });
    return { node: grid, refs: refs };
  }

  function svgText(doc, svg, x, y, value, attrs) {
    var merged = {
      x: x,
      y: y,
      "font-size": "11",
      className: "ssh-tick"
    };
    Object.keys(attrs || {}).forEach(function (key) {
      merged[key] = attrs[key];
    });
    svg.appendChild(makeSvg(doc, "text", merged, value));
  }

  function svgLine(doc, svg, x1, y1, x2, y2, className, extra) {
    var attrs = { x1: x1, y1: y1, x2: x2, y2: y2, className: className };
    Object.keys(extra || {}).forEach(function (key) { attrs[key] = extra[key]; });
    svg.appendChild(makeSvg(doc, "line", attrs));
  }

  function svgRect(doc, svg, x, y, width, height, className, extra) {
    var attrs = { x: x, y: y, width: width, height: height, className: className };
    Object.keys(extra || {}).forEach(function (key) { attrs[key] = extra[key]; });
    svg.appendChild(makeSvg(doc, "rect", attrs));
  }

  function svgCircle(doc, svg, cx, cy, radius, className, extra) {
    var attrs = { cx: cx, cy: cy, r: radius, className: className };
    Object.keys(extra || {}).forEach(function (key) { attrs[key] = extra[key]; });
    svg.appendChild(makeSvg(doc, "circle", attrs));
  }

  function svgPath(doc, svg, d, className, extra) {
    var attrs = { d: d, className: className };
    Object.keys(extra || {}).forEach(function (key) { attrs[key] = extra[key]; });
    svg.appendChild(makeSvg(doc, "path", attrs));
  }

  function makeMatrix(siteCount, t1, t2, termination) {
    var matrix = [];
    var i;
    for (i = 0; i < siteCount; i += 1) {
      matrix.push(new Array(siteCount).fill(0));
    }
    for (i = 0; i < siteCount - 1; i += 1) {
      var first = termination === "t1" ? t1 : t2;
      var second = termination === "t1" ? t2 : t1;
      var hopping = i % 2 === 0 ? first : second;
      matrix[i][i + 1] = hopping;
      matrix[i + 1][i] = hopping;
    }
    return matrix;
  }

  /* Symmetric Jacobi rotations: no numerical package is needed for this small H_N. */
  function jacobiSymmetric(input) {
    var n = input.length;
    var matrix = input.map(function (row) { return row.slice(); });
    var vectors = [];
    var i;
    var j;
    for (i = 0; i < n; i += 1) {
      vectors.push(new Array(n).fill(0));
      vectors[i][i] = 1;
    }
    var rotations = 0;
    var limit = Math.max(80, 30 * n * n);
    for (var iteration = 0; iteration < limit; iteration += 1) {
      var p = 0;
      var q = 1;
      var largest = 0;
      for (i = 0; i < n; i += 1) {
        for (j = i + 1; j < n; j += 1) {
          if (Math.abs(matrix[i][j]) > largest) {
            largest = Math.abs(matrix[i][j]);
            p = i;
            q = j;
          }
        }
      }
      if (largest < 1e-12) break;
      var app = matrix[p][p];
      var aqq = matrix[q][q];
      var apq = matrix[p][q];
      var tau = (aqq - app) / (2 * apq);
      var tangent = (tau >= 0 ? 1 : -1) /
        (Math.abs(tau) + Math.sqrt(1 + tau * tau));
      var cosine = 1 / Math.sqrt(1 + tangent * tangent);
      var sine = tangent * cosine;
      for (i = 0; i < n; i += 1) {
        if (i === p || i === q) continue;
        var aip = matrix[i][p];
        var aiq = matrix[i][q];
        matrix[i][p] = cosine * aip - sine * aiq;
        matrix[p][i] = matrix[i][p];
        matrix[i][q] = sine * aip + cosine * aiq;
        matrix[q][i] = matrix[i][q];
      }
      matrix[p][p] = cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
      matrix[q][q] = sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
      matrix[p][q] = 0;
      matrix[q][p] = 0;
      for (i = 0; i < n; i += 1) {
        var vip = vectors[i][p];
        var viq = vectors[i][q];
        vectors[i][p] = cosine * vip - sine * viq;
        vectors[i][q] = sine * vip + cosine * viq;
      }
      rotations += 1;
    }
    var order = [];
    for (i = 0; i < n; i += 1) order.push(i);
    order.sort(function (left, right) { return matrix[left][left] - matrix[right][right]; });
    var values = order.map(function (index) { return matrix[index][index]; });
    var sortedVectors = order.map(function (index) {
      var vector = [];
      for (var row = 0; row < n; row += 1) vector.push(vectors[row][index]);
      return vector;
    });
    return { values: values, vectors: sortedVectors, rotations: rotations };
  }

  function symmetryChecks(matrix, eigensystem) {
    var n = matrix.length;
    var pairResidual = 0;
    var chiralResidual = 0;
    var symmetricResidual = 0;
    var eigenResidual = 0;
    var normalizationResidual = 0;
    var i;
    var j;
    var k;
    for (i = 0; i < n; i += 1) {
      for (j = 0; j < n; j += 1) {
        var gammaI = i % 2 === 0 ? 1 : -1;
        var gammaJ = j % 2 === 0 ? 1 : -1;
        chiralResidual = Math.max(
          chiralResidual,
          Math.abs((gammaI + gammaJ) * matrix[i][j])
        );
        symmetricResidual = Math.max(
          symmetricResidual,
          Math.abs(matrix[i][j] - matrix[j][i])
        );
      }
    }
    for (i = 0; i < n; i += 1) {
      pairResidual = Math.max(pairResidual, Math.abs(
        eigensystem.values[i] + eigensystem.values[n - 1 - i]
      ));
      var norm = 0;
      for (j = 0; j < n; j += 1) {
        norm += eigensystem.vectors[i][j] * eigensystem.vectors[i][j];
        var residual = 0;
        for (k = 0; k < n; k += 1) {
          residual += matrix[j][k] * eigensystem.vectors[i][k];
        }
        eigenResidual = Math.max(eigenResidual, Math.abs(
          residual - eigensystem.values[i] * eigensystem.vectors[i][j]
        ));
      }
      normalizationResidual = Math.max(normalizationResidual, Math.abs(norm - 1));
    }
    return {
      pairResidual: pairResidual,
      chiralResidual: chiralResidual,
      symmetricResidual: symmetricResidual,
      eigenResidual: eigenResidual,
      normalizationResidual: normalizationResidual
    };
  }

  function phaseData(t1, t2) {
    var difference = t2 - t1;
    if (Math.abs(difference) < EPSILON) {
      return { winding: null, label: "未定义（gap 闭合）", phase: "临界" };
    }
    if (difference > 0) {
      return { winding: 1, label: "1（拓扑）", phase: "拓扑" };
    }
    return { winding: 0, label: "0（平庸）", phase: "平庸" };
  }

  function computeState(state) {
    var siteCount = 2 * state.cells;
    var matrix = makeMatrix(siteCount, state.t1, state.t2, state.termination);
    var eigensystem = jacobiSymmetric(matrix);
    var checks = symmetryChecks(matrix, eigensystem);
    var phase = phaseData(state.t1, state.t2);
    var selected = clamp(Math.round(state.selected), 1, siteCount) - 1;
    var probabilities = eigensystem.vectors[selected].map(function (value) {
      return value * value;
    });
    var lowerEdgeIndex = Math.floor(siteCount / 2) - 1;
    var upperEdgeIndex = Math.floor(siteCount / 2);
    var lowerEdgeEnergy = eigensystem.values[lowerEdgeIndex];
    var upperEdgeEnergy = eigensystem.values[upperEdgeIndex];
    var edgeSplitting = Math.abs(upperEdgeEnergy - lowerEdgeEnergy);
    var leftWeight = probabilities[0] + probabilities[1];
    var rightWeight = probabilities[siteCount - 2] + probabilities[siteCount - 1];
    var sublatticePolarization = probabilities.reduce(function (sum, value, index) {
      return sum + (index % 2 === 0 ? value : -value);
    }, 0);
    var phaseHasEdges = state.termination === "t1"
      ? phase.winding === 1
      : phase.winding === 0;
    return {
      matrix: matrix,
      values: eigensystem.values,
      vectors: eigensystem.vectors,
      selected: selected,
      probabilities: probabilities,
      phase: phase,
      bulkGap: 2 * Math.abs(state.t2 - state.t1),
      edgeSplitting: edgeSplitting,
      edgeEnergy: Math.max(Math.abs(lowerEdgeEnergy), Math.abs(upperEdgeEnergy)),
      leftWeight: leftWeight,
      rightWeight: rightWeight,
      edgeWeight: leftWeight + rightWeight,
      sublatticePolarization: sublatticePolarization,
      phaseHasEdges: phaseHasEdges,
      checks: checks,
      selectedEnergy: eigensystem.values[selected],
      rotations: eigensystem.rotations
    };
  }

  function panel(doc, svg, x, y, width, height, title) {
    svgRect(doc, svg, x, y, width, height, "ssh-panel-bg");
    svgText(doc, svg, x + 12, y + 22, title, { className: "ssh-panel-title" });
  }

  function drawChain(doc, svg, state, data, x, y, width, height) {
    panel(doc, svg, x, y, width, height, "① 开边界链：交替键与终止");
    var left = x + 22;
    var right = x + width - 22;
    var lineY = y + 116;
    var siteCount = state.cells * 2;
    var spacing = (right - left) / Math.max(1, siteCount - 1);
    var positions = [];
    var maxT = Math.max(state.t1, state.t2);
    var i;
    for (i = 0; i < siteCount; i += 1) positions.push(left + i * spacing);
    for (i = 0; i < siteCount - 1; i += 1) {
      var first = state.termination === "t1" ? state.t1 : state.t2;
      var second = state.termination === "t1" ? state.t2 : state.t1;
      var hopping = i % 2 === 0 ? first : second;
      var className = i % 2 === 0
        ? (state.termination === "t1" ? "ssh-bond-t1" : "ssh-bond-t2")
        : (state.termination === "t1" ? "ssh-bond-t2" : "ssh-bond-t1");
      svgLine(doc, svg, positions[i], lineY, positions[i + 1], lineY, className, {
        "stroke-width": (2 + 5 * hopping / maxT).toFixed(2)
      });
    }
    for (i = 0; i < siteCount; i += 1) {
      svgCircle(doc, svg, positions[i], lineY, siteCount > 28 ? 5 : 6,
        i % 2 === 0 ? "ssh-site-a" : "ssh-site-b");
      if (i < 2 || i >= siteCount - 2) {
        svgText(doc, svg, positions[i], lineY + 23, i % 2 === 0 ? "A" : "B", {
          className: "ssh-tick",
          "text-anchor": "middle"
        });
      }
    }
    svgText(doc, svg, left, y + 66, state.termination === "t1" ? "t1 端" : "t2 端", {
      className: "ssh-callout"
    });
    svgText(doc, svg, right, y + 66, state.termination === "t1" ? "t1 端" : "t2 端", {
      className: "ssh-callout",
      "text-anchor": "end"
    });
    svgText(doc, svg, x + 12, y + height - 43,
      "t1=" + formatNumber(null, state.t1, 2) + "（" +
      (state.t1 < state.t2 ? "弱" : state.t1 > state.t2 ? "强" : "等") +
      "） · t2=" + formatNumber(null, state.t2, 2) + "（" +
      (state.t2 < state.t1 ? "弱" : state.t2 > state.t1 ? "强" : "等") + "）", {
        className: "ssh-axis-label"
      });
    svgText(doc, svg, x + 12, y + height - 19,
      state.termination === "t1"
        ? "默认：A1—B1 的胞内键为 t1，左右均以 t1 截断"
        : "反向切口：左右均以 t2 截断；bulk 参数不变，边界对应改变", {
        className: "ssh-tick"
      });
  }

  function drawSpectrum(doc, svg, state, data, x, y, width, height) {
    panel(doc, svg, x, y, width, height, "② 有限链本征谱：E ↔ −E");
    var plotLeft = x + 72;
    var plotRight = x + width - 16;
    var plotTop = y + 39;
    var plotBottom = y + height - 31;
    var maxEnergy = Math.max(0.5, Math.max.apply(null, data.values.map(Math.abs)) * 1.08);
    var mapY = function (energy) {
      return plotTop + (maxEnergy - energy) / (2 * maxEnergy) * (plotBottom - plotTop);
    };
    [-maxEnergy, 0, maxEnergy].forEach(function (tick) {
      svgLine(doc, svg, plotLeft, mapY(tick), plotRight, mapY(tick),
        tick === 0 ? "ssh-zero" : "ssh-gridline");
      svgText(doc, svg, plotLeft - 8, mapY(tick) + 4, formatNumber(null, tick, 2), {
        "text-anchor": "end"
      });
    });
    svgLine(doc, svg, plotLeft, plotTop, plotLeft, plotBottom, "ssh-axis");
    var levelLeft = plotLeft + 18;
    var levelRight = plotRight - 10;
    data.values.forEach(function (energy, index) {
      var className = index === data.selected
        ? "ssh-spectrum-selected"
        : data.phaseHasEdges && (index === Math.floor(data.values.length / 2) - 1 ||
          index === Math.floor(data.values.length / 2))
          ? "ssh-spectrum-edge"
          : "ssh-spectrum-level";
      svgLine(doc, svg, levelLeft, mapY(energy), levelRight, mapY(energy), className);
    });
    svgText(doc, svg, plotRight, y + 24,
      data.phaseHasEdges
        ? "金色：有限尺寸边界对；彩色：当前选中"
        : "彩色：当前选中；金色边界对不在此切口出现", {
        className: "ssh-tick",
        "text-anchor": "end"
      });
    svgText(doc, svg, x + 12, y + height - 10,
      "选中 j=" + (data.selected + 1) + "，E=" + formatNumber(null, data.selectedEnergy, 4), {
        className: "ssh-callout"
      });
    svgText(doc, svg, plotLeft - 8, plotTop - 8, "E", {
      className: "ssh-axis-label",
      "text-anchor": "end"
    });
  }

  function drawProbability(doc, svg, state, data, x, y, width, height) {
    panel(doc, svg, x, y, width, height, "③ 选中态：格点概率 |ψj|²");
    var plotLeft = x + 43;
    var plotRight = x + width - 15;
    var plotTop = y + 47;
    var plotBottom = y + height - 48;
    var maxProbability = Math.max.apply(null, data.probabilities);
    var probabilityTop = Math.max(0.08, maxProbability * 1.14);
    var mapY = function (probability) {
      return plotBottom - probability / probabilityTop * (plotBottom - plotTop);
    };
    [0, probabilityTop / 2, probabilityTop].forEach(function (tick) {
      svgLine(doc, svg, plotLeft, mapY(tick), plotRight, mapY(tick),
        tick === 0 ? "ssh-axis" : "ssh-gridline");
      svgText(doc, svg, plotLeft - 7, mapY(tick) + 4, formatNumber(null, tick, 2), {
        "text-anchor": "end"
      });
    });
    var spacing = (plotRight - plotLeft) / data.probabilities.length;
    var barWidth = Math.max(2, spacing * 0.66);
    data.probabilities.forEach(function (probability, index) {
      var barX = plotLeft + index * spacing + (spacing - barWidth) / 2;
      svgRect(doc, svg, barX, mapY(probability), barWidth,
        plotBottom - mapY(probability), index % 2 === 0 ? "ssh-prob-a" : "ssh-prob-b");
    });
    svgText(doc, svg, plotLeft, plotBottom + 20, "A1", {
      className: "ssh-tick",
      "text-anchor": "middle"
    });
    svgText(doc, svg, plotRight, plotBottom + 20, "B" + state.cells, {
      className: "ssh-tick",
      "text-anchor": "middle"
    });
    svgText(doc, svg, plotRight, y + 25,
      "左右两端权重=" + formatNumber(null, data.edgeWeight, 3), {
        className: "ssh-callout",
        "text-anchor": "end"
      });
    svgText(doc, svg, x + 12, y + height - 14,
      "Σ|ψj|²=1 · A/B 颜色交替 · 选中态通常是左右端态的 ± 混合", {
        className: "ssh-axis-label"
      });
  }

  function drawBulkQ(doc, svg, state, data, x, y, width, height) {
    panel(doc, svg, x, y, width, height, "④ bulk q(k)：圆是否包围原点？");
    var centerX = x + width / 2 + 12;
    var centerY = y + height / 2 - 5;
    var halfWidth = width / 2 - 56;
    var halfHeight = height / 2 - 55;
    var range = Math.max(1.15, (state.t1 + state.t2) * 1.24);
    var scale = Math.min(halfWidth, halfHeight) / range;
    var mapX = function (value) { return centerX + value * scale; };
    var mapY = function (value) { return centerY - value * scale; };
    svgLine(doc, svg, mapX(-range), centerY, mapX(range), centerY, "ssh-axis");
    svgLine(doc, svg, centerX, mapY(-range), centerX, mapY(range), "ssh-axis");
    svgLine(doc, svg, mapX(-range), mapY(0), mapX(range), mapY(0), "ssh-gridline");
    svgLine(doc, svg, mapX(0), mapY(-range), mapX(0), mapY(range), "ssh-gridline");
    var path = "";
    var samples = 220;
    for (var i = 0; i <= samples; i += 1) {
      var k = 2 * Math.PI * i / samples;
      var qx = state.t1 + state.t2 * Math.cos(k);
      var qy = state.t2 * Math.sin(k);
      path += (i === 0 ? "M" : "L") + mapX(qx).toFixed(2) + "," + mapY(qy).toFixed(2) + " ";
    }
    svgPath(doc, svg, path.trim(), "ssh-qpath");
    [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach(function (k) {
      svgCircle(doc, svg, mapX(state.t1 + state.t2 * Math.cos(k)),
        mapY(state.t2 * Math.sin(k)), 4, "ssh-q-marker");
    });
    svgLine(doc, svg, centerX - 6, centerY, centerX + 6, centerY, "ssh-origin");
    svgLine(doc, svg, centerX, centerY - 6, centerX, centerY + 6, "ssh-origin");
    if (data.phase.winding === null) {
      svgCircle(doc, svg, centerX, centerY, 7, "ssh-origin");
      svgText(doc, svg, centerX + 10, centerY - 10, "q(π)=0：gap 闭合", {
        className: "ssh-callout"
      });
    }
    svgText(doc, svg, x + width - 13, y + 24,
      "w=" + (data.phase.winding === null ? "未定义" : data.phase.winding), {
        className: "ssh-callout",
        "text-anchor": "end"
      });
    svgText(doc, svg, mapX(range), centerY - 8, "Re q", {
      className: "ssh-axis-label",
      "text-anchor": "end"
    });
    svgText(doc, svg, centerX + 8, mapY(range) + 14, "Im q", {
      className: "ssh-axis-label"
    });
    svgText(doc, svg, x + 12, y + height - 14,
      "q(k)=(t1+t2 cos k, t2 sin k)，k: 0→2π 为逆时针方向", {
        className: "ssh-axis-label"
      });
  }

  function drawDashboard(doc, stage, state, data) {
    var svg = stage.svg;
    clear(svg);
    var titleId = stage.id + "-title";
    var descId = stage.id + "-desc";
    svg.appendChild(makeSvg(doc, "title", { id: titleId }, "SSH 二聚化链的开边界、谱、选中态与 bulk winding"));
    svg.appendChild(makeSvg(doc, "desc", { id: descId },
      "t1=" + state.t1 + "，t2=" + state.t2 + "，N=" + state.cells +
      "，终止为 " + state.termination + "；winding=" +
      (data.phase.winding === null ? "未定义" : data.phase.winding) +
      "；图中同时显示交替开链、有限链本征能级、选中本征态的格点概率与 bulk q 轨迹。"));
    svgRect(doc, svg, 0, 0, 900, 760, "ssh-panel-bg", { stroke: "none" });
    drawChain(doc, svg, state, data, 12, 12, 426, 258);
    drawSpectrum(doc, svg, state, data, 462, 12, 426, 258);
    drawProbability(doc, svg, state, data, 12, 286, 426, 462);
    drawBulkQ(doc, svg, state, data, 462, 286, 426, 462);
  }

  function buildLab(root, api) {
    var doc = root.ownerDocument || document;
    injectStyles(doc);
    root.classList.add("ssh-lab");
    INSTANCE += 1;
    var id = "ssh-" + INSTANCE;
    var state = {
      t1: 0.45,
      t2: 1.10,
      cells: 8,
      selected: 8,
      termination: "t1"
    };
    var presets = [
      { id: "trivial", label: "平庸 t1>t2", t1: 1.10, t2: 0.45 },
      { id: "critical", label: "临界 t1=t2", t1: 0.80, t2: 0.80 },
      { id: "topological", label: "拓扑 t2>t1", t1: 0.45, t2: 1.10 }
    ];
    var shell = makeElement(doc, "div", { className: "ssh-shell" });
    shell.appendChild(makeElement(doc, "h3", {
      className: "ssh-heading",
      text: "SSH edge-state lab：从局部键到 bulk winding"
    }));
    shell.appendChild(makeElement(doc, "p", {
      className: "ssh-intro",
      text: "正的 t1、t2 控制同一条二聚化链；四个视图每次随参数重算。默认原胞与终止固定为 A1—B1—A2…—BN，故 t2>t1 对应 winding=1 与边界态。"
    }));

    var layout = makeElement(doc, "div", { className: "ssh-layout" });
    var controls = makeElement(doc, "div", { className: "ssh-controls" });
    controls.appendChild(makeElement(doc, "h4", {
      className: "ssh-control-heading",
      text: "控制变量与可判决预设"
    }));
    controls.appendChild(makeElement(doc, "p", {
      className: "ssh-formula",
      text: "q(k)=t1+t2 e^{ik}；Δbulk=2|t2−t1|；ΓHΓ=−H"
    }));
    var t1Field = rangeField(doc, "胞内跃迁 t1（正值）", 0.10, 1.50, 0.01, state.t1);
    var t2Field = rangeField(doc, "跨胞跃迁 t2（正值）", 0.10, 1.50, 0.01, state.t2);
    var cellsField = rangeField(doc, "原胞数 N（奇偶可切换）", 3, 18, 1, state.cells);
    var selectedField = rangeField(doc, "选中本征态 j（按能量排序）", 1, 2 * state.cells, 1, state.selected);
    var terminationField = selectField(doc, "开链终止方式", [
      { value: "t1", label: "默认 t1 端：A1—B1…BN" },
      { value: "t2", label: "反向 t2 端：平移一个格点的切口" }
    ], state.termination);
    controls.appendChild(t1Field.wrapper);
    controls.appendChild(t2Field.wrapper);
    controls.appendChild(cellsField.wrapper);
    controls.appendChild(selectedField.wrapper);
    controls.appendChild(terminationField.wrapper);
    controls.appendChild(makeElement(doc, "span", {
      className: "ssh-preset-label",
      text: "确定性预设（先预测，再点击）"
    }));
    var presetGrid = makeElement(doc, "div", { className: "ssh-preset-grid" });
    var presetButtons = {};
    presets.forEach(function (preset) {
      var button = actionButton(doc, preset.label);
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        state.t1 = preset.t1;
        state.t2 = preset.t2;
        state.termination = "t1";
        state.selected = Math.floor(state.cells);
        render("已切换到“" + preset.label + "”：请重新观察 gap、winding 和有限链近零对。");
      });
      presetButtons[preset.id] = button;
      presetGrid.appendChild(button);
    });
    controls.appendChild(presetGrid);
    var resetButton = actionButton(doc, "重置为默认拓扑链");
    resetButton.addEventListener("click", function () {
      state.t1 = 0.45;
      state.t2 = 1.10;
      state.cells = 8;
      state.selected = 8;
      state.termination = "t1";
      render("已重置为默认拓扑链：N=8、t1=0.45、t2=1.10、默认 t1 终止。");
    });
    controls.appendChild(resetButton);
    controls.appendChild(makeElement(doc, "p", {
      className: "ssh-note",
      text: "t2>t1 时本约定的 winding=1；t1>t2 时 winding=0；相等时 bulk gap 闭合，winding 不定义。有限链两端态会指数混合，谱上看到的是 ±ε 而非精确 0。"
    }));

    var stage = makeElement(doc, "div", { className: "ssh-stage" });
    var stageFrame = makeElement(doc, "div", { className: "ssh-stage-frame" });
    var stageTitle = makeElement(doc, "div", { className: "ssh-stage-title" }, [
      makeElement(doc, "strong", { text: "四图对账：局部 · 谱 · 波函数 · bulk" }),
      makeElement(doc, "span", { text: "纯原生 SVG，单节点重绘" })
    ]);
    var figure = makeElement(doc, "figure", { className: "ssh-figure" });
    var svg = makeSvg(doc, "svg", {
      className: "ssh-svg",
      viewBox: "0 0 900 760",
      role: "img",
      preserveAspectRatio: "xMidYMid meet"
    });
    figure.appendChild(svg);
    stageFrame.appendChild(stageTitle);
    stageFrame.appendChild(figure);
    stage.appendChild(stageFrame);
    var metrics = metricGrid(doc, [
      { id: "phase", label: "相位：winding" },
      { id: "gap", label: "bulk gap" },
      { id: "edge", label: "中间近零对 ±ε" },
      { id: "edgeWeight", label: "选中态两端权重" },
      { id: "pair", label: "E ↔ −E 配对残差" },
      { id: "chiral", label: "‖{Γ,H}‖∞ 残差" },
      { id: "eigen", label: "本征方程残差" },
      { id: "parity", label: "原胞与子晶格" }
    ]);
    stage.appendChild(metrics.node);
    var legend = makeElement(doc, "div", { className: "ssh-legend" }, [
      makeElement(doc, "span", { className: "ssh-legend-item" }, [
        makeElement(doc, "i", { className: "ssh-swatch ssh-swatch-t1" }), "t1 键"
      ]),
      makeElement(doc, "span", { className: "ssh-legend-item" }, [
        makeElement(doc, "i", { className: "ssh-swatch ssh-swatch-t2" }), "t2 键"
      ]),
      makeElement(doc, "span", { className: "ssh-legend-item" }, [
        makeElement(doc, "i", { className: "ssh-swatch ssh-swatch-edge" }), "边界近零对"
      ])
    ]);
    stage.appendChild(legend);
    var checks = makeElement(doc, "p", { className: "ssh-checks" });
    stage.appendChild(checks);
    var live = makeElement(doc, "p", {
      className: "ssh-live",
      "data-cl-live": true,
      "aria-live": "polite",
      text: "拓扑预设已准备：先写下你的预测。"
    });
    stage.appendChild(live);
    layout.appendChild(controls);
    layout.appendChild(stage);
    shell.appendChild(layout);
    root.replaceChildren(shell);

    var refs = {
      doc: doc,
      stage: { svg: svg, id: id },
      t1Field: t1Field,
      t2Field: t2Field,
      cellsField: cellsField,
      selectedField: selectedField,
      terminationField: terminationField,
      metrics: metrics.refs,
      checks: checks,
      live: live
    };

    function presetId() {
      for (var i = 0; i < presets.length; i += 1) {
        if (Math.abs(state.t1 - presets[i].t1) < EPSILON &&
            Math.abs(state.t2 - presets[i].t2) < EPSILON &&
            state.termination === "t1") return presets[i].id;
      }
      return "";
    }

    function render(message) {
      state.t1 = clamp(number(state.t1, 0.45), 0.10, 1.50);
      state.t2 = clamp(number(state.t2, 1.10), 0.10, 1.50);
      state.cells = clamp(Math.round(number(state.cells, 8)), 3, 18);
      state.selected = clamp(Math.round(number(state.selected, state.cells)), 1, 2 * state.cells);
      state.termination = state.termination === "t2" ? "t2" : "t1";
      var data = computeState(state);
      t1Field.input.value = String(state.t1);
      t2Field.input.value = String(state.t2);
      cellsField.input.value = String(state.cells);
      selectedField.input.max = String(2 * state.cells);
      selectedField.input.value = String(data.selected + 1);
      terminationField.select.value = state.termination;
      t1Field.output.textContent = formatNumber(api, state.t1, 2);
      t2Field.output.textContent = formatNumber(api, state.t2, 2);
      cellsField.output.textContent = String(state.cells) +
        (state.cells % 2 === 0 ? "（偶数）" : "（奇数）");
      selectedField.output.textContent = "j=" + (data.selected + 1) +
        "，E=" + formatNumber(api, data.selectedEnergy, 4);
      metrics.refs.phase.textContent = data.phase.label;
      metrics.refs.gap.textContent = formatNumber(api, data.bulkGap, 3);
      metrics.refs.edge.textContent = data.phaseHasEdges
        ? "±" + formatNumber(api, data.edgeEnergy, 5) +
          "（Δ=" + formatNumber(api, data.edgeSplitting, 5) + "）"
        : data.phase.winding === null ? "gap 闭合" : "无受拓扑要求的近零对";
      metrics.refs.edgeWeight.textContent = formatNumber(api, data.edgeWeight, 3) +
        "（左 " + formatNumber(api, data.leftWeight, 3) +
        " / 右 " + formatNumber(api, data.rightWeight, 3) + "）";
      metrics.refs.pair.textContent = formatNumber(api, data.checks.pairResidual, 2);
      metrics.refs.chiral.textContent = formatNumber(api, data.checks.chiralResidual, 2);
      metrics.refs.eigen.textContent = formatNumber(api, data.checks.eigenResidual, 2);
      metrics.refs.parity.textContent = state.cells + " 个 " +
        (state.cells % 2 === 0 ? "偶数" : "奇数") + "原胞；N A + N B";
      checks.innerHTML = "";
      checks.appendChild(doc.createTextNode(
        "数值核对：" + data.rotations + " 次 Jacobi 旋转；"
      ));
      var checkStrong = makeElement(doc, "strong", {
        text: "归一化 " + formatNumber(api, data.checks.normalizationResidual, 2) +
          " · 对称矩阵 " + formatNumber(api, data.checks.symmetricResidual, 2)
      });
      checks.appendChild(checkStrong);
      checks.appendChild(doc.createTextNode(
        "。残差越接近 0 越好；E↔−E 来自手征对称，不是有限链把边界能级强行设成零。"
      ));
      drawDashboard(doc, refs.stage, state, data);
      var active = presetId();
      presets.forEach(function (preset) {
        presetButtons[preset.id].setAttribute("aria-pressed", preset.id === active ? "true" : "false");
      });
      if (message) {
        live.textContent = message;
        if (api && typeof api.announce === "function") api.announce(root, message);
      } else {
      live.textContent = data.phase.winding === null
          ? "临界：q(k) 穿过原点，bulk gap 闭合，winding 不定义。"
          : data.phaseHasEdges
            ? (state.termination === "t1"
              ? "拓扑且为默认 t1 终止：观察两端近零态的指数混合与有限尺寸劈裂。"
              : "反向 t2 终止暴露另一种切口的边界近零对；这不改变当前 q(k) 约定下的 bulk winding。")
            : "当前切口没有边界近零对；比较 q(k)、终止方式与谱的对应。";
      }
    }

    t1Field.input.addEventListener("input", function () {
      state.t1 = number(t1Field.input.value, state.t1);
      render("");
    });
    t2Field.input.addEventListener("input", function () {
      state.t2 = number(t2Field.input.value, state.t2);
      render("");
    });
    cellsField.input.addEventListener("input", function () {
      state.cells = number(cellsField.input.value, state.cells);
      state.selected = Math.min(state.selected, 2 * Math.round(state.cells));
      render("");
    });
    selectedField.input.addEventListener("input", function () {
      state.selected = number(selectedField.input.value, state.selected);
      render("");
    });
    terminationField.select.addEventListener("change", function () {
      state.termination = terminationField.select.value;
      render(state.termination === "t1"
        ? "已切回默认 t1 终止：t2>t1 时边界态应出现。"
        : "已切到反向 t2 终止：同一 bulk 的边界切口改变，比较端点态是否暴露。");
    });
    render("");
  }

  window.CourseLearning.register("ssh-edge-state", buildLab);
}());
