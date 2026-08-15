(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "logistic-chaos-lab-styles";
  var SERIAL = 0;
  var SATURATION_THRESHOLD = 0.95;
  var LOG_FLOOR = -16;
  var PRESETS = [
    {
      id: "fixed",
      label: "稳定不动点 r=2.8",
      r: 2.8,
      x0: 0.2,
      logDelta: -8,
      burnIn: 40,
      steps: 160,
      expected: "fixed"
    },
    {
      id: "period-two",
      label: "稳定周期2 r=3.2",
      r: 3.2,
      x0: 0.2,
      logDelta: -8,
      burnIn: 80,
      steps: 160,
      expected: "period-two"
    },
    {
      id: "period-three-window",
      label: "周期3窗口附近 r=3.83",
      r: 3.83,
      x0: 0.2,
      logDelta: -8,
      burnIn: 140,
      steps: 180,
      expected: "period-three-window"
    },
    {
      id: "chaos",
      label: "典型混沌 r=3.9",
      r: 3.9,
      x0: 0.2,
      logDelta: -8,
      burnIn: 100,
      steps: 320,
      expected: "chaos-diagnostic"
    },
    {
      id: "exceptional",
      label: "r=4 例外初值 x0=.5",
      r: 4,
      x0: 0.5,
      logDelta: -8,
      burnIn: 0,
      steps: 80,
      expected: "exceptional"
    }
  ];

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function nearly(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-10 : tolerance);
  }

  function logisticMap(r, x) {
    return r * x * (1 - x);
  }

  function derivativeFactor(r, x) {
    return Math.abs(r * (1 - 2 * x));
  }

  function logDerivative(r, x) {
    var factor = derivativeFactor(r, x);
    return factor === 0 ? -Infinity : Math.log(factor);
  }

  function iterate(r, x0, count) {
    var steps = Math.max(0, Math.round(count));
    var values = [x0];
    var x = x0;
    for (var index = 0; index < steps; index += 1) {
      x = logisticMap(r, x);
      values.push(x);
    }
    return values;
  }

  function finiteLyapunov(r, x0, count, burnIn) {
    var steps = Math.max(1, Math.round(isFiniteNumber(Number(count)) ? Number(count) : 160));
    var burn = Math.max(0, Math.round(isFiniteNumber(Number(burnIn)) ? Number(burnIn) : 40));
    var x = x0;
    var zeroDuringBurnIn = null;
    var index;

    for (index = 0; index < burn; index += 1) {
      if (derivativeFactor(r, x) === 0 && zeroDuringBurnIn === null) zeroDuringBurnIn = index;
      x = logisticMap(r, x);
    }

    var sum = 0;
    var terms = [];
    var zeroAt = null;
    for (index = 0; index < steps; index += 1) {
      var term = logDerivative(r, x);
      terms.push(term);
      if (term === -Infinity) {
        if (zeroAt === null) zeroAt = index;
        sum = -Infinity;
      } else {
        sum += term;
      }
      x = logisticMap(r, x);
    }

    return {
      r: r,
      x0: x0,
      burnIn: burn,
      steps: steps,
      lambda: zeroAt === null ? sum / steps : -Infinity,
      terms: terms,
      derivativeZeroAt: zeroAt,
      derivativeZeroDuringBurnIn: zeroDuringBurnIn,
      terminal: x
    };
  }

  function simulatePair(r, x0, delta0, count, burnIn) {
    var steps = Math.max(1, Math.round(isFiniteNumber(Number(count)) ? Number(count) : 160));
    var burn = Math.max(0, Math.round(isFiniteNumber(Number(burnIn)) ? Number(burnIn) : 40));
    var first = clamp(x0, 0, 1);
    var second = clamp(first + Math.max(0, delta0), 0, 1);
    var mergedDuringBurnIn = first === second ? 0 : null;
    var index;

    for (index = 0; index < burn; index += 1) {
      first = logisticMap(r, first);
      second = logisticMap(r, second);
      if (first === second && mergedDuringBurnIn === null) mergedDuringBurnIn = index + 1;
    }

    var series = [];
    var mergedAt = first === second ? 0 : null;
    var saturatedAt = null;
    var maximumDistance = 0;
    for (index = 0; index <= steps; index += 1) {
      var distance = Math.abs(first - second);
      series.push({ n: index, first: first, second: second, distance: distance });
      maximumDistance = Math.max(maximumDistance, distance);
      if (distance >= SATURATION_THRESHOLD && saturatedAt === null) saturatedAt = index;
      if (index < steps) {
        first = logisticMap(r, first);
        second = logisticMap(r, second);
        if (first === second && mergedAt === null) mergedAt = index + 1;
      }
    }

    return {
      r: r,
      x0: x0,
      requestedDelta: delta0,
      effectiveDelta: Math.abs(series[0].first - series[0].second),
      burnIn: burn,
      steps: steps,
      series: series,
      maximumDistance: maximumDistance,
      mergedDuringBurnIn: mergedDuringBurnIn,
      mergedAt: mergedAt,
      saturatedAt: saturatedAt,
      bound: 1
    };
  }

  function detectPeriod(values, maximumPeriod, tolerance) {
    var maxPeriod = Math.max(1, Math.round(maximumPeriod || 12));
    var epsilon = tolerance === undefined ? 1e-8 : tolerance;
    if (values.length < 2) return 0;
    for (var period = 1; period <= maxPeriod; period += 1) {
      if (values.length < 2 * period) continue;
      var start = values.length - 2 * period;
      var error = 0;
      for (var index = start + period; index < values.length; index += 1) {
        error = Math.max(error, Math.abs(values[index] - values[index - period]));
      }
      if (error <= epsilon) return period;
    }
    return 0;
  }

  function analyzeOrbit(r, x0, count, burnIn) {
    var steps = Math.max(40, Math.round(isFiniteNumber(Number(count)) ? Number(count) : 160));
    var burn = Math.max(0, Math.round(isFiniteNumber(Number(burnIn)) ? Number(burnIn) : 40));
    var values = iterate(r, x0, burn + steps);
    var afterBurnIn = values.slice(burn);
    var tail = afterBurnIn.slice(Math.max(0, afterBurnIn.length - 80));
    var period = detectPeriod(tail, 12, 1e-8);
    var exceptional = r === 4 && x0 === 0.5;
    var label;

    if (exceptional) {
      label = "r=4 例外轨道：x0=.5 后进入 0";
    } else if (period === 1) {
      label = "有限样本检测：不动点";
    } else if (period === 2) {
      label = "有限样本检测：周期2";
    } else if (period === 3) {
      label = "有限样本检测：周期3窗口";
    } else {
      label = "有限样本未检测到短周期";
    }

    return {
      r: r,
      x0: x0,
      burnIn: burn,
      steps: steps,
      values: afterBurnIn,
      period: period,
      exceptional: exceptional,
      label: label
    };
  }

  function normalizedState(input) {
    var source = input || {};
    var r = clamp(isFiniteNumber(Number(source.r)) ? Number(source.r) : 2.8, 0, 4);
    var x0 = clamp(isFiniteNumber(Number(source.x0)) ? Number(source.x0) : 0.2, 0, 1);
    var logDelta = clamp(
      isFiniteNumber(Number(source.logDelta)) ? Number(source.logDelta) : -8,
      -12,
      -2
    );
    var delta0 = Math.pow(10, logDelta);
    if (x0 + delta0 > 1) x0 = Math.max(0, 1 - delta0);
    return {
      id: source.id || source.presetId || "custom",
      presetId: source.presetId || source.id || "custom",
      r: r,
      x0: x0,
      logDelta: logDelta,
      delta0: delta0,
      burnIn: clamp(Math.round(isFiniteNumber(Number(source.burnIn)) ? Number(source.burnIn) : 40), 0, 300),
      steps: clamp(Math.round(isFiniteNumber(Number(source.steps)) ? Number(source.steps) : 160), 20, 800)
    };
  }

  function copyPreset(preset) {
    return normalizedState({
      id: preset.id,
      presetId: preset.id,
      r: preset.r,
      x0: preset.x0,
      logDelta: preset.logDelta,
      burnIn: preset.burnIn,
      steps: preset.steps
    });
  }

  function evaluate(input) {
    var state = normalizedState(input);
    return {
      state: state,
      lyapunov: finiteLyapunov(state.r, state.x0, state.steps, state.burnIn),
      separation: simulatePair(state.r, state.x0, state.delta0, state.steps, state.burnIn),
      orbit: analyzeOrbit(state.r, state.x0, state.steps, state.burnIn)
    };
  }

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

  function formatNumber(value, digits) {
    if (value === -Infinity) return "-∞";
    if (value === Infinity) return "+∞";
    if (!isFiniteNumber(value)) return "NaN";
    var places = digits === undefined ? 3 : digits;
    if (value !== 0 && Math.abs(value) < Math.pow(10, -Math.max(3, places))) {
      return value.toExponential(Math.min(places + 2, 6));
    }
    var text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatDistance(value) {
    if (value === 0) return "0";
    if (!isFiniteNumber(value)) return formatNumber(value, 3);
    return Math.abs(value) < 0.001 ? value.toExponential(3) : formatNumber(value, 4);
  }

  function ledgerTermText(terms, index) {
    if (!terms || index < 0 || index >= terms.length) return "—（窗外）";
    return formatNumber(terms[index], 4);
  }

  function log10(value) {
    return Math.log(value) / Math.LN10;
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-lc-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-lc-style", "true");
    style.textContent = [
      ".lc-lab{--lc-blue:#2f67a1;--lc-red:#b64335;--lc-gold:#9b6a12;--lc-green:#39734d;--lc-muted:var(--fg-soft,#6b6557);box-sizing:border-box;max-width:100%;min-width:0;color:var(--fg,#292722);font-size:.95em;line-height:1.55;color-scheme:light dark}",
      "html[data-theme=dark] .lc-lab{--lc-blue:#83c8ff;--lc-red:#f08c7d;--lc-gold:#e2b458;--lc-green:#72bd8b;--lc-muted:#b8b2a7}",
      ".lc-lab *,.lc-lab *::before,.lc-lab *::after{box-sizing:border-box}",
      ".lc-lab [hidden]{display:none!important}",
      ".lc-lab button,.lc-lab input{font:inherit;letter-spacing:0}",
      ".lc-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#292722);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}",
      ".lc-lab button:hover{border-color:var(--lc-blue)}.lc-lab button[aria-pressed=true],.lc-lab button.lc-primary{border-color:var(--lc-blue);background:var(--lc-blue);color:var(--bg,#fff);font-weight:700}",
      ".lc-lab button:disabled{cursor:not-allowed;opacity:.58}.lc-lab button:focus-visible,.lc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".lc-lab .lc-heading{margin:0 0 4px;color:var(--lc-blue);font-size:1.2rem}.lc-lab .lc-intro,.lc-lab .lc-note,.lc-lab .lc-feedback,.lc-lab .lc-footnote{margin:0;color:var(--lc-muted);line-height:1.7;overflow-wrap:anywhere}",
      ".lc-lab .lc-prediction{margin:14px 0 0;padding:12px 14px;border-left:3px solid var(--lc-gold);background:var(--block-bg,var(--bg,#fff))}.lc-lab .lc-prediction h4{margin:0 0 8px;font-size:14px}.lc-lab .lc-prediction fieldset{margin:0;padding:0;border:0}.lc-lab .lc-prediction legend{max-width:100%;padding:0;color:var(--fg);font-size:13px;font-weight:700;overflow-wrap:anywhere}",
      ".lc-lab .lc-question{margin:12px 0 6px;color:var(--fg);font-size:13px;font-weight:700}.lc-lab .lc-question:first-child{margin-top:8px}.lc-lab .lc-choice-row,.lc-lab .lc-actions,.lc-lab .lc-legend{display:flex;flex-wrap:wrap;gap:8px}.lc-lab .lc-choice-row button{flex:1 1 190px}.lc-lab .lc-actions{margin-top:12px}.lc-lab .lc-feedback{min-height:1.7em;margin-top:8px;font-weight:700}.lc-lab .lc-pass{color:var(--lc-green)}.lc-lab .lc-warn{color:var(--lc-red)}",
      ".lc-lab .lc-presets{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:14px 0}.lc-lab .lc-presets button{min-height:48px}.lc-lab .lc-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 18px;margin:14px 0}.lc-lab .lc-control{display:grid;gap:5px;min-width:0}.lc-lab .lc-control>span{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;color:var(--lc-muted);font-size:13px;font-weight:700}.lc-lab .lc-control output{color:var(--lc-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.lc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--lc-blue)}",
      ".lc-lab .lc-results{display:grid;gap:12px;margin-top:15px}.lc-lab .lc-status{margin:0;padding:10px 12px;border-left:3px solid var(--lc-blue);background:var(--block-bg,var(--bg,#fff));line-height:1.7;overflow-wrap:anywhere}.lc-lab .lc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px}.lc-lab .lc-metric{min-width:0;padding:9px 10px;border-top:2px solid var(--border);background:var(--bg)}.lc-lab .lc-metric span{display:block;color:var(--lc-muted);font-size:11.5px;line-height:1.4}.lc-lab .lc-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".lc-lab .lc-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;min-width:0}.lc-lab .lc-chart-card{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow:hidden}.lc-lab .lc-chart-card h4{margin:0 0 6px;font-size:13px}.lc-lab .lc-svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.lc-lab .lc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.lc-lab .lc-grid-line{stroke:var(--border);stroke-width:1;stroke-opacity:.62}.lc-lab .lc-axis{stroke:var(--lc-muted);stroke-width:1.2}.lc-lab .lc-series-a{fill:none;stroke:var(--lc-blue);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}.lc-lab .lc-series-b{fill:none;stroke:var(--lc-red);stroke-width:2;stroke-dasharray:6 4;stroke-linejoin:round;stroke-linecap:round}.lc-lab .lc-distance{fill:none;stroke:var(--lc-gold);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}.lc-lab .lc-bound{stroke:var(--lc-green);stroke-width:1.5;stroke-dasharray:5 4}.lc-lab .lc-chart-label{fill:var(--lc-muted)!important;font-size:11px}.lc-lab .lc-legend{color:var(--lc-muted);font-size:12px;line-height:1.4}.lc-lab .lc-legend span{display:inline-flex;align-items:center;gap:5px}.lc-lab .lc-swatch{display:inline-block;width:22px;border-top:3px solid var(--lc-blue)}.lc-lab .lc-swatch-b{border-top-color:var(--lc-red);border-top-style:dashed}.lc-lab .lc-swatch-d{border-top-color:var(--lc-gold)}.lc-lab .lc-swatch-bound{border-top-color:var(--lc-green);border-top-style:dashed}",
      ".lc-lab .lc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.lc-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.lc-lab caption{padding:0 0 7px;text-align:left;color:var(--fg);font-size:13px;font-weight:700}.lc-lab th,.lc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:right;white-space:nowrap}.lc-lab th:first-child,.lc-lab td:first-child{text-align:left}.lc-lab th{color:var(--lc-muted);font-size:11.5px}.lc-lab .lc-formula{margin:0;padding:9px 11px;border-left:3px solid var(--lc-blue);background:var(--block-bg,var(--bg,#fff));font-family:SFMono,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.7;overflow-wrap:anywhere}",
      "@media(max-width:760px){.lc-lab .lc-controls,.lc-lab .lc-chart-grid{grid-template-columns:minmax(0,1fr)}.lc-lab .lc-chart-card{padding:6px}.lc-lab .lc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media(max-width:430px){.lc-lab .lc-prediction{padding:10px}.lc-lab .lc-choice-row button{flex-basis:100%}.lc-lab .lc-metrics{grid-template-columns:minmax(0,1fr)}}",
      "@media(prefers-reduced-motion:reduce){.lc-lab *{animation:none!important;scroll-behavior:auto!important;transition:none!important}}"
    ].join("\n");
    (doc.head || doc.documentElement).appendChild(style);
  }

  function makeRangeControl(api, doc, uid, key, labelText, minimum, maximum, step, value) {
    var inputId = uid + "-" + key;
    var wrapper = makeElement(api, doc, "label", { className: "lc-control", htmlFor: inputId });
    var caption = makeElement(api, doc, "span", {});
    caption.appendChild(doc.createTextNode(labelText));
    var output = makeElement(api, doc, "output", { htmlFor: inputId });
    caption.appendChild(output);
    var input = makeElement(api, doc, "input", {
      id: inputId,
      type: "range",
      min: String(minimum),
      max: String(maximum),
      step: String(step),
      value: String(value),
      "aria-label": labelText
    });
    wrapper.appendChild(caption);
    wrapper.appendChild(input);
    return { node: wrapper, input: input, output: output };
  }

  function makeMetric(api, doc, label, value) {
    return makeElement(api, doc, "div", { className: "lc-metric" }, [
      makeElement(api, doc, "span", {}, label),
      makeElement(api, doc, "strong", {}, value)
    ]);
  }

  function svgText(api, doc, x, y, value, attrs) {
    var textAttrs = Object.assign({ x: x, y: y, "font-size": "11" }, attrs || {});
    return makeSvg(api, doc, "text", textAttrs, [value]);
  }

  function makeSvgChart(api, doc, uid, label) {
    var svg = makeSvg(api, doc, "svg", {
      className: "lc-svg",
      viewBox: "0 0 560 270",
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc"
    });
    svg.appendChild(makeSvg(api, doc, "title", { id: uid + "-title" }, [label]));
    svg.appendChild(makeSvg(api, doc, "desc", { id: uid + "-desc" }, [""]));
    return svg;
  }

  function plotX(index, total, left, right) {
    return total <= 0 ? left : left + index / total * (right - left);
  }

  function plotY(value, minimum, maximum, top, bottom) {
    var ratio = (value - minimum) / (maximum - minimum);
    return bottom - clamp(ratio, 0, 1) * (bottom - top);
  }

  function sampledIndices(length, maximum) {
    if (length <= maximum) {
      var all = [];
      for (var index = 0; index < length; index += 1) all.push(index);
      return all;
    }
    var result = [];
    for (var sample = 0; sample < maximum; sample += 1) {
      result.push(Math.round(sample * (length - 1) / (maximum - 1)));
    }
    return result.filter(function (value, position) {
      return position === 0 || value !== result[position - 1];
    });
  }

  function pathForSeries(series, key, minimum, maximum, left, right, top, bottom, maximumPoints) {
    var indices = sampledIndices(series.length, maximumPoints || 200);
    var total = Math.max(1, series.length - 1);
    var commands = [];
    indices.forEach(function (index, position) {
      var value = series[index][key];
      var x = plotX(index, total, left, right);
      var y = plotY(value, minimum, maximum, top, bottom);
      commands.push((position === 0 ? "M " : "L ") + x.toFixed(2) + " " + y.toFixed(2));
    });
    return commands.join(" ");
  }

  function drawTimeSeries(api, doc, result, uid) {
    var svg = makeSvgChart(api, doc, uid, "烧入后的两条 Logistic 轨道时间序列");
    var left = 43;
    var right = 548;
    var top = 22;
    var bottom = 232;
    var series = result.separation.series;
    var total = Math.max(1, series.length - 1);
    [0, 0.5, 1].forEach(function (value) {
      var y = plotY(value, 0, 1, top, bottom);
      svg.appendChild(makeSvg(api, doc, "line", { className: "lc-grid-line", x1: left, y1: y, x2: right, y2: y }));
      svg.appendChild(svgText(api, doc, left - 8, y + 4, formatNumber(value, 1), { className: "lc-chart-label", "text-anchor": "end" }));
    });
    [0, total].forEach(function (index) {
      var x = plotX(index, total, left, right);
      svg.appendChild(makeSvg(api, doc, "line", { className: "lc-grid-line", x1: x, y1: top, x2: x, y2: bottom }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { className: "lc-axis", x1: left, y1: bottom, x2: right, y2: bottom }));
    svg.appendChild(makeSvg(api, doc, "line", { className: "lc-axis", x1: left, y1: top, x2: left, y2: bottom }));
    svg.appendChild(makeSvg(api, doc, "path", {
      className: "lc-series-a",
      d: pathForSeries(series, "first", 0, 1, left, right, top, bottom, 220)
    }));
    svg.appendChild(makeSvg(api, doc, "path", {
      className: "lc-series-b",
      d: pathForSeries(series, "second", 0, 1, left, right, top, bottom, 220)
    }));
    svg.appendChild(svgText(api, doc, left, 16, "x_n", { className: "lc-chart-label" }));
    svg.appendChild(svgText(api, doc, right, 255, "n（烧入后）", { className: "lc-chart-label", "text-anchor": "end" }));
    svg.appendChild(svgText(api, doc, plotX(total, total, left, right), bottom + 16, String(series[series.length - 1].n), { className: "lc-chart-label", "text-anchor": "end" }));
    svg.querySelector("desc").textContent = "蓝线是初始值 x0 的轨道，红色虚线是 x0+delta0 的轨道；两者由同一个确定性递推计算。纵轴固定为 0 到 1。";
    return svg;
  }

  function drawSeparation(api, doc, result, uid) {
    var svg = makeSvgChart(api, doc, uid, "两条邻近轨道的对数分离度");
    var left = 47;
    var right = 548;
    var top = 22;
    var bottom = 232;
    var series = result.separation.series;
    var total = Math.max(1, series.length - 1);
    [-16, -8, 0].forEach(function (value) {
      var y = plotY(value, LOG_FLOOR, 0, top, bottom);
      svg.appendChild(makeSvg(api, doc, "line", {
        className: value === 0 ? "lc-bound" : "lc-grid-line",
        x1: left,
        y1: y,
        x2: right,
        y2: y
      }));
      svg.appendChild(svgText(api, doc, left - 8, y + 4, String(value), { className: "lc-chart-label", "text-anchor": "end" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { className: "lc-axis", x1: left, y1: bottom, x2: right, y2: bottom }));
    svg.appendChild(makeSvg(api, doc, "line", { className: "lc-axis", x1: left, y1: top, x2: left, y2: bottom }));
    var logSeries = series.map(function (point) {
      return { logDistance: point.distance === 0 ? LOG_FLOOR : Math.max(LOG_FLOOR, log10(point.distance)) };
    });
    svg.appendChild(makeSvg(api, doc, "path", {
      className: "lc-distance",
      d: pathForSeries(logSeries, "logDistance", LOG_FLOOR, 0, left, right, top, bottom, 220)
    }));
    svg.appendChild(svgText(api, doc, left, 16, "log10 D_n", { className: "lc-chart-label" }));
    svg.appendChild(svgText(api, doc, right, 16, "D_n <= 1", { className: "lc-chart-label", "text-anchor": "end" }));
    svg.appendChild(svgText(api, doc, right, 255, "n（烧入后）", { className: "lc-chart-label", "text-anchor": "end" }));
    svg.appendChild(svgText(api, doc, right, plotY(0, LOG_FLOOR, 0, top, bottom) - 5, "区间上限", { className: "lc-chart-label", "text-anchor": "end" }));
    svg.querySelector("desc").textContent = "金色曲线是两条轨道距离 D_n 的 log10；绿色虚线是区间 [0,1] 的距离上限 D=1。距离到达 0 表示当前数值精度下合流。";
    return svg;
  }

  function ledgerIndices(length) {
    var candidates = [0, 1, 2, Math.floor((length - 1) / 2), length - 3, length - 2, length - 1];
    var seen = Object.create(null);
    return candidates.filter(function (value) {
      if (value < 0 || value >= length || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function buildLedger(api, doc, result) {
    var wrapper = makeElement(api, doc, "div", { className: "lc-table-wrap" });
    var table = makeElement(api, doc, "table", {});
    table.appendChild(makeElement(api, doc, "caption", {}, "抽样数值账本：D_n <= 1；log|f'(x_n)| 的 -∞ 表示导数恰为 0。"));
    var headings = ["n", "x_n", "y_n", "D_n", "log10 D_n", "log|f'(x_n)|"];
    var head = makeElement(api, doc, "thead");
    var headRow = makeElement(api, doc, "tr");
    headings.forEach(function (heading) { headRow.appendChild(makeElement(api, doc, "th", {}, heading)); });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = makeElement(api, doc, "tbody");
    ledgerIndices(result.separation.series.length).forEach(function (index) {
      var point = result.separation.series[index];
      var values = [
        point.n,
        formatNumber(point.first, 7),
        formatNumber(point.second, 7),
        formatDistance(point.distance),
        point.distance === 0 ? "-∞" : formatNumber(Math.max(LOG_FLOOR, log10(point.distance)), 3),
        ledgerTermText(result.lyapunov.terms, index)
      ];
      var row = makeElement(api, doc, "tr");
      values.forEach(function (value) { row.appendChild(makeElement(api, doc, "td", {}, value)); });
      body.appendChild(row);
    });
    table.appendChild(body);
    wrapper.appendChild(table);
    return wrapper;
  }

  function replaceChildren(node, children) {
    clear(node);
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
  }

  function predictionAnswerText(question, value) {
    var answer = question.choices.filter(function (choice) { return choice.value === question.expected; })[0];
    return answer ? answer.label : value;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    injectStyles(doc);
    var uid = "lc-" + (SERIAL += 1);
    var state = copyPreset(PRESETS[0]);
    var predictions = { determinism: null, separation: null, windows: null };
    var revealed = false;
    var questions = [
      {
        key: "determinism",
        prompt: "1. 规则完全确定，是否因此保证长期可预测？",
        choices: [
          { value: "yes", label: "是，规则精确就够了" },
          { value: "no", label: "否，初值误差会被放大" }
        ],
        expected: "no",
        explanation: "决定论固定了精确初值对应的精确轨道，却不保证有限精度的观测能长期追上它。"
      },
      {
        key: "separation",
        prompt: "2. 邻轨的指数分离能否无限持续？",
        choices: [
          { value: "forever", label: "能，距离会无限增长" },
          { value: "bounded", label: "不能，区间有界并会饱和" }
        ],
        expected: "bounded",
        explanation: "在 r∈[0,4]、x∈[0,1] 时轨道留在区间内，D_n≤1；指数关系只是局部/有限时间近似。"
      },
      {
        key: "windows",
        prompt: "3. 混沌参数区间是否没有周期窗口？",
        choices: [
          { value: "no-windows", label: "是，没有周期窗口" },
          { value: "has-windows", label: "否，仍有周期窗口" }
        ],
        expected: "has-windows",
        explanation: "Logistic 映射的混沌区间中嵌有周期窗口；r≈3.83 是周期3窗口附近的可见例子。"
      }
    ];

    var shell = makeElement(api, doc, "div", { className: "lc-lab" });
    shell.appendChild(makeElement(api, doc, "h3", { className: "lc-heading" }, "Logistic 映射：先预测，再观察"));
    shell.appendChild(makeElement(api, doc, "p", { className: "lc-intro" }, "同一条确定性递推、两条只差 delta0 的初值；先回答三问，揭示后才打开预设、参数、图和数值账本。"));

    var predictionForm = makeElement(api, doc, "form", {
      className: "lc-prediction",
      "aria-labelledby": uid + "-prediction-title"
    });
    var predictionFieldset = makeElement(api, doc, "fieldset");
    predictionFieldset.appendChild(makeElement(api, doc, "legend", { id: uid + "-prediction-title" }, "预测门：三项都要先回答"));
    var choiceButtons = [];
    questions.forEach(function (question) {
      predictionFieldset.appendChild(makeElement(api, doc, "p", { className: "lc-question" }, question.prompt));
      var row = makeElement(api, doc, "div", { className: "lc-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button" }, choice.label);
        button.addEventListener("click", function () {
          predictions[question.key] = choice.value;
          renderPrediction();
        });
        choiceButtons.push({ key: question.key, value: choice.value, node: button });
        row.appendChild(button);
      });
      predictionFieldset.appendChild(row);
    });
    predictionForm.appendChild(predictionFieldset);
    var actions = makeElement(api, doc, "div", { className: "lc-actions" });
    var checkButton = makeElement(api, doc, "button", { type: "submit", className: "lc-primary" }, "提交预测并揭示");
    var resetButton = makeElement(api, doc, "button", { type: "button" }, "重置并重新预测");
    actions.appendChild(checkButton);
    actions.appendChild(resetButton);
    predictionForm.appendChild(actions);
    var feedback = makeElement(api, doc, "p", { className: "lc-feedback", role: "status", "aria-live": "polite", "aria-atomic": "true" }, "请完成三项预测。");
    predictionForm.appendChild(feedback);
    shell.appendChild(predictionForm);

    var presetGroup = makeElement(api, doc, "div", { className: "lc-presets", role: "group", "aria-label": "Logistic 映射预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { type: "button" }, preset.label);
      button.addEventListener("click", function () {
        state = copyPreset(preset);
        render();
        if (api && typeof api.announce === "function") api.announce(root, "已切换到 " + preset.label + "；预测门保持揭示。");
      });
      presetButtons.push({ id: preset.id, node: button });
      presetGroup.appendChild(button);
    });
    var presetNote = makeElement(api, doc, "p", { className: "lc-note" }, "揭示后可切换预设；切换预设不会重新锁回预测门。滑块则创建 custom 参数。");
    shell.appendChild(presetGroup);
    shell.appendChild(presetNote);

    var controls = makeElement(api, doc, "div", { className: "lc-controls", "aria-label": "揭示后的 Logistic 参数" });
    var rControl = makeRangeControl(api, doc, uid, "r", "参数 r", 0, 4, 0.01, state.r);
    var xControl = makeRangeControl(api, doc, uid, "x0", "初值 x0", 0, 1, 0.001, state.x0);
    var deltaControl = makeRangeControl(api, doc, uid, "log-delta", "log10(delta0)", -12, -2, 0.5, state.logDelta);
    var burnControl = makeRangeControl(api, doc, uid, "burn-in", "烧入步数", 0, 300, 5, state.burnIn);
    var stepsControl = makeRangeControl(api, doc, uid, "steps", "有限窗步数 N", 20, 800, 10, state.steps);
    [rControl, xControl, deltaControl, burnControl, stepsControl].forEach(function (control) { controls.appendChild(control.node); });
    shell.appendChild(controls);

    var results = makeElement(api, doc, "section", { className: "lc-results", "aria-label": "Logistic 映射揭示结果" });
    var status = makeElement(api, doc, "p", { className: "lc-status", role: "status", "aria-live": "polite" }, "");
    var metrics = makeElement(api, doc, "div", { className: "lc-metrics" });
    var chartGrid = makeElement(api, doc, "div", { className: "lc-chart-grid" });
    var legend = makeElement(api, doc, "div", { className: "lc-legend", "aria-label": "图例" }, [
      makeElement(api, doc, "span", {}, [makeElement(api, doc, "i", { className: "lc-swatch", "aria-hidden": "true" }), "蓝：x0 轨道"]),
      makeElement(api, doc, "span", {}, [makeElement(api, doc, "i", { className: "lc-swatch lc-swatch-b", "aria-hidden": "true" }), "红虚线：x0+delta0 轨道"]),
      makeElement(api, doc, "span", {}, [makeElement(api, doc, "i", { className: "lc-swatch lc-swatch-d", "aria-hidden": "true" }), "金：log10 D_n"]),
      makeElement(api, doc, "span", {}, [makeElement(api, doc, "i", { className: "lc-swatch lc-swatch-bound", "aria-hidden": "true" }), "绿虚线：D=1 上限"])
    ]);
    var formula = makeElement(api, doc, "p", { className: "lc-formula" }, "");
    var footnote = makeElement(api, doc, "p", { className: "lc-footnote" }, "图形与读数是当前初值、烧入和有限 N 的数值诊断；正的 lambda_N 不单独证明混沌，未检测到短周期也不单独证明非周期。Logistic 实验是教学模型，不是 Lorenz 或真实天气的替身。");
    results.appendChild(status);
    results.appendChild(metrics);
    results.appendChild(chartGrid);
    results.appendChild(legend);
    results.appendChild(buildLedger(api, doc, evaluate(state)));
    results.appendChild(formula);
    results.appendChild(footnote);
    shell.appendChild(results);
    root.replaceChildren(shell);

    function renderPrediction() {
      choiceButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", predictions[item.key] === item.value ? "true" : "false");
      });
      if (!revealed) {
        var complete = questions.every(function (question) { return predictions[question.key] !== null; });
        feedback.textContent = complete ? "三项预测已记录，点击“提交预测并揭示”。" : "请完成三项预测。";
        feedback.className = "lc-feedback";
      }
    }

    function syncControl(control, value, text) {
      control.input.value = String(value);
      control.output.textContent = text;
      control.input.setAttribute("aria-valuetext", text);
    }

    function renderResult(result) {
      var stateNow = result.state;
      var lyapunov = result.lyapunov;
      var separation = result.separation;
      var eventLabels = [];
      if (lyapunov.derivativeZeroAt !== null) {
        eventLabels.push("采样窗 n=" + lyapunov.derivativeZeroAt + " 命中 f'=0，lambda_N=-∞");
      }
      if (lyapunov.derivativeZeroDuringBurnIn !== null && lyapunov.derivativeZeroAt === null) {
        eventLabels.push("仅烧入第 " + lyapunov.derivativeZeroDuringBurnIn + " 步命中 f'=0，未计入采样窗");
      }
      if (separation.mergedDuringBurnIn !== null || separation.mergedAt !== null) eventLabels.push("机器精度合流");
      if (separation.saturatedAt !== null) eventLabels.push("有界饱和");
      if (!eventLabels.length) eventLabels.push("本窗无特殊事件");
      status.textContent =
        "当前 r=" + formatNumber(stateNow.r, 2) + "，x0=" + formatNumber(stateNow.x0, 5) +
        "，delta0=" + formatDistance(stateNow.delta0) + "；烧入 " + stateNow.burnIn + " 步，采样 N=" + stateNow.steps + "。" +
        " 轨道由 x_{n+1}=r x_n(1-x_n) 逐步精确递推，没有随机噪声。";
      replaceChildren(metrics, [
        makeMetric(api, doc, "轨道读法", result.orbit.label),
        makeMetric(api, doc, "finite lambda_N", formatNumber(lyapunov.lambda, 4)),
        makeMetric(api, doc, "末端 D_N", formatDistance(separation.series[separation.series.length - 1].distance)),
        makeMetric(api, doc, "max D_n", formatDistance(separation.maximumDistance)),
        makeMetric(api, doc, "区间上限", "D_n <= 1"),
        makeMetric(api, doc, "数值事件", eventLabels.join("；"))
      ]);
      replaceChildren(chartGrid, [
        makeElement(api, doc, "div", { className: "lc-chart-card" }, [
          makeElement(api, doc, "h4", {}, "烧入后的时间序列"),
          drawTimeSeries(api, doc, result, uid + "-series")
        ]),
        makeElement(api, doc, "div", { className: "lc-chart-card" }, [
          makeElement(api, doc, "h4", {}, "邻轨分离：log10 D_n"),
          drawSeparation(api, doc, result, uid + "-separation")
        ])
      ]);
      var oldLedger = results.querySelector(".lc-table-wrap");
      var newLedger = buildLedger(api, doc, result);
      if (oldLedger) {
        oldLedger.parentNode.replaceChild(newLedger, oldLedger);
      } else {
        results.insertBefore(newLedger, formula);
      }
      var lambdaNote = lyapunov.derivativeZeroAt !== null
        ? "采样窗中的第 n=" + lyapunov.derivativeZeroAt + " 项命中临界点，因此该项为 -∞。"
        : lyapunov.derivativeZeroDuringBurnIn !== null
          ? "临界点只在烧入第 " + lyapunov.derivativeZeroDuringBurnIn + " 步出现，未计入本次 lambda_N 求和。"
          : "本次采样窗没有命中导数为 0 的临界点。";
      formula.textContent =
        "lambda_N=(1/N) sum log|r(1-2x_n)|；当前 lambda_N=" + formatNumber(lyapunov.lambda, 4) +
        "。" + lambdaNote + " D_n=|x_n-y_n| 在 [0,1] 中有上限，指数段不能越过饱和。";
    }

    function render() {
      if (!revealed) {
        presetGroup.hidden = true;
        presetNote.hidden = true;
        controls.hidden = true;
        results.hidden = true;
        renderPrediction();
        return;
      }
      state = normalizedState(state);
      var result = evaluate(state);
      presetGroup.hidden = false;
      presetNote.hidden = false;
      controls.hidden = false;
      results.hidden = false;
      syncControl(rControl, state.r, formatNumber(state.r, 2));
      syncControl(xControl, state.x0, formatNumber(state.x0, 4));
      syncControl(deltaControl, state.logDelta, "10^" + formatNumber(state.logDelta, 1) + " = " + formatDistance(state.delta0));
      syncControl(burnControl, state.burnIn, String(state.burnIn));
      syncControl(stepsControl, state.steps, String(state.steps));
      presetButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false");
      });
      renderResult(result);
      renderPrediction();
    }

    function setCustom(key, value) {
      state.presetId = "custom";
      state.id = "custom";
      state[key] = Number(value);
      render();
    }

    rControl.input.addEventListener("input", function () { setCustom("r", rControl.input.value); });
    xControl.input.addEventListener("input", function () { setCustom("x0", xControl.input.value); });
    deltaControl.input.addEventListener("input", function () { setCustom("logDelta", deltaControl.input.value); });
    burnControl.input.addEventListener("input", function () { setCustom("burnIn", burnControl.input.value); });
    stepsControl.input.addEventListener("input", function () { setCustom("steps", stepsControl.input.value); });

    predictionForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return predictions[question.key] === null; });
      if (missing.length) {
        feedback.textContent = "请先完成：" + missing.map(function (question) { return question.prompt.split("。")[0]; }).join("、") + "。";
        feedback.className = "lc-feedback lc-warn";
        return;
      }
      revealed = true;
      predictionFieldset.disabled = true;
      checkButton.disabled = true;
      render();
      var correct = questions.filter(function (question) { return predictions[question.key] === question.expected; }).length;
      var explanation = questions.map(function (question) {
        var mark = predictions[question.key] === question.expected ? "对" : "需修正";
        return question.prompt.split("。")[0] + "：" + mark + "；" + question.explanation;
      }).join(" ");
      feedback.textContent = "答案已揭示：" + correct + "/3。" + explanation;
      feedback.className = "lc-feedback " + (correct === 3 ? "lc-pass" : "lc-warn");
      if (api && typeof api.announce === "function") api.announce(root, "预测答案已揭示，实验参数与图形已打开。");
    });

    resetButton.addEventListener("click", function () {
      state = copyPreset(PRESETS[0]);
      predictions = { determinism: null, separation: null, windows: null };
      revealed = false;
      predictionFieldset.disabled = false;
      checkButton.disabled = false;
      feedback.textContent = "请完成三项预测。";
      feedback.className = "lc-feedback";
      render();
      if (api && typeof api.announce === "function") api.announce(root, "实验已重置，预测答案再次隐藏。");
    });

    render();
  }

  function assertTest(condition, message) {
    if (!condition) throw new Error(message);
  }

  function runSelfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assertTest(condition, message);
    }

    [0, 0.5, 1, 2.8, 3.2, 3.83, 3.9, 4].forEach(function (r) {
      [0, 0.1, 0.2, 0.5, 0.9, 1].forEach(function (x) {
        var next = logisticMap(r, x);
        check(next >= -1e-12 && next <= 1 + 1e-12, "invariant interval failed at r=" + r + ", x=" + x);
      });
    });

    var rFixed = 2.8;
    var fixedPoint = (rFixed - 1) / rFixed;
    check(nearly(logisticMap(rFixed, fixedPoint), fixedPoint, 1e-14), "known fixed point is not fixed");
    var fixedTail = iterate(rFixed, 0.2, 180).slice(-1)[0];
    check(nearly(fixedTail, fixedPoint, 1e-10), "r=2.8 did not approach its stable fixed point");
    var fixedLambda = finiteLyapunov(rFixed, fixedPoint, 30, 0);
    check(nearly(fixedLambda.lambda, Math.log(Math.abs(2 - rFixed)), 1e-10), "finite lambda fixed-point calculation failed");

    var rTwo = 3.2;
    var twoCycle = iterate(rTwo, 0.2, 220).slice(-2);
    var expectedTwo = [
      (rTwo + 1 - Math.sqrt((rTwo - 3) * (rTwo + 1))) / (2 * rTwo),
      (rTwo + 1 + Math.sqrt((rTwo - 3) * (rTwo + 1))) / (2 * rTwo)
    ];
    check(Math.abs(twoCycle[0] - twoCycle[1]) > 1e-3, "r=3.2 collapsed to a fixed point unexpectedly");
    check(expectedTwo.some(function (value) { return nearly(twoCycle[0], value, 1e-8); }), "r=3.2 first cycle point mismatch");
    check(expectedTwo.some(function (value) { return nearly(twoCycle[1], value, 1e-8); }), "r=3.2 second cycle point mismatch");
    check(nearly(logisticMap(rTwo, twoCycle[0]), twoCycle[1], 1e-8), "r=3.2 cycle does not map forward");
    check(analyzeOrbit(rTwo, 0.2, 160, 80).period === 2, "period-2 detector failed");
    check(analyzeOrbit(3.83, 0.2, 180, 140).period === 3, "period-3 window detector failed");

    var exceptional = iterate(4, 0.5, 5);
    check(exceptional[0] === 0.5 && exceptional[1] === 1 && exceptional[2] === 0 && exceptional[3] === 0, "r=4 exceptional orbit failed");
    var criticalLambda = finiteLyapunov(4, 0.5, 3, 0);
    check(criticalLambda.lambda === -Infinity && criticalLambda.derivativeZeroAt === 0 && criticalLambda.derivativeZeroDuringBurnIn === null, "derivative-zero/-Infinity handling failed");
    var burnOnlyLambda = finiteLyapunov(4, 0.5, 3, 1);
    check(burnOnlyLambda.derivativeZeroAt === null && burnOnlyLambda.derivativeZeroDuringBurnIn === 0 && isFiniteNumber(burnOnlyLambda.lambda), "burn-in-only critical hit was misclassified");
    var exceptionalResult = evaluate(PRESETS.filter(function (preset) { return preset.id === "exceptional"; })[0]);
    var exceptionalLastIndex = exceptionalResult.separation.series.length - 1;
    check(ledgerTermText(exceptionalResult.lyapunov.terms, exceptionalLastIndex) === "—（窗外）", "ledger last-row placeholder failed");
    check(ledgerTermText(exceptionalResult.lyapunov.terms, exceptionalLastIndex - 1) !== "—（窗外）", "ledger in-window term was marked out of window");

    var pair = simulatePair(3.9, 0.2, 1e-8, 180, 100);
    check(pair.series.every(function (point) { return point.first >= -1e-12 && point.first <= 1 + 1e-12 && point.second >= -1e-12 && point.second <= 1 + 1e-12; }), "pair left invariant interval");
    check(pair.series.every(function (point) { return point.distance <= 1 + 1e-12; }), "separation exceeded bounded interval");
    var initialPair = simulatePair(3.9, 0.2, 1e-8, 20, 0);
    check(nearly(initialPair.effectiveDelta, 1e-8, 1e-15), "initial delta was not preserved");

    var chaos = evaluate(PRESETS.filter(function (preset) { return preset.id === "chaos"; })[0]);
    check(isFiniteNumber(chaos.lyapunov.lambda) && chaos.lyapunov.lambda > 0, "r=3.9 finite lambda diagnostic is not positive");
    PRESETS.forEach(function (preset) {
      var result = evaluate(preset);
      check(result.separation.series.length === result.state.steps + 1, "preset series length failed: " + preset.id);
      check(result.orbit.values.every(function (value) { return value >= -1e-12 && value <= 1 + 1e-12; }), "preset orbit left interval: " + preset.id);
      check(result.lyapunov.lambda === -Infinity || isFiniteNumber(result.lyapunov.lambda), "preset lambda is invalid: " + preset.id);
    });

    var repeatA = evaluate(PRESETS[2]);
    var repeatB = evaluate(PRESETS[2]);
    check(repeatA.lyapunov.lambda === repeatB.lyapunov.lambda, "deterministic recurrence is not repeatable");
    check(repeatA.separation.series[repeatA.separation.series.length - 1].distance === repeatB.separation.series[repeatB.separation.series.length - 1].distance, "deterministic separation is not repeatable");
    return checks;
  }

  var isNode = typeof module !== "undefined" && module.exports;
  if (isNode) {
    module.exports = {
      PRESETS: PRESETS,
      logisticMap: logisticMap,
      iterate: iterate,
      finiteLyapunov: finiteLyapunov,
      simulatePair: simulatePair,
      detectPeriod: detectPeriod,
      analyzeOrbit: analyzeOrbit,
      evaluate: evaluate,
      ledgerTermText: ledgerTermText,
      runSelfTest: runSelfTest
    };
    if (require.main === module) {
      try {
        var totalChecks = runSelfTest();
        process.stdout.write("logistic-chaos self-test: " + totalChecks + " checks passed.\n");
      } catch (error) {
        process.stderr.write("logistic-chaos self-test failed: " + error.message + "\n");
        process.exitCode = 1;
      }
    }
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;
  host.CourseLearning.register("logistic-chaos", mount);
}(typeof window === "undefined" ? null : window));
