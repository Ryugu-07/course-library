(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("physics-collider-detector", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log("physics-collider-detector self-test: PASS (" + report.checks + " checks)"); }
    catch (error) { console.error("physics-collider-detector self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-collider-detector-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;
  var MASS_DOMAIN_MIN = 0;
  var MASS_DOMAIN_MAX = 500;
  var MASS_MIN = 20;
  var MASS_MAX = 450;
  var HISTOGRAM_BINS = 32;
  var DEFAULTS = { mass: 125, resolution: 0.04, signal: 240, background: 720, window: 10, seed: 17 };
  var PRESETS = [
    { id: "higgs-like", label: "窄峰：125 GeV", mass: 125, resolution: 0.04, signal: 240, background: 720, window: 10, seed: 17 },
    { id: "poor-resolution", label: "差分辨率", mass: 125, resolution: 0.11, signal: 240, background: 720, window: 15, seed: 17 },
    { id: "background-heavy", label: "背景主导", mass: 180, resolution: 0.05, signal: 120, background: 1400, window: 12, seed: 29 },
    { id: "calibration-check", label: "理想校准", mass: 100, resolution: 0, signal: 80, background: 300, window: 6, seed: 7 }
  ];

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
  function format(value, digits) {
    if (!finite(value)) return "—";
    return value.toFixed(digits === undefined ? 2 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function normalize(input) {
    input = input || {};
    var mass = Number(input.mass);
    var resolution = Number(input.resolution);
    var signal = Number(input.signal);
    var background = Number(input.background);
    var window = Number(input.window);
    var seed = Number(input.seed === undefined ? DEFAULTS.seed : input.seed);
    if (!finite(mass) || !finite(resolution) || !finite(signal) || !finite(background) || !finite(window) || !finite(seed)) throw new TypeError("质量、分辨率、计数、窗口和 seed 必须是有限数");
    if (!(mass >= MASS_MIN && mass <= MASS_MAX)) throw new RangeError("共振质量应在 20 到 450 GeV 之间");
    if (resolution < 0 || resolution > 0.25) throw new RangeError("相对质量分辨率应在 0 到 25% 之间");
    if (!(signal >= 0 && signal <= 2000 && Math.round(signal) === signal)) throw new RangeError("信号事件数必须是 0 到 2000 的整数");
    if (!(background >= 0 && background <= 5000 && Math.round(background) === background)) throw new RangeError("背景事件数必须是 0 到 5000 的整数");
    if (!(window > 0 && window < 100)) throw new RangeError("质量窗口必须为正且小于 100 GeV");
    return { mass: mass, resolution: resolution, signal: signal, background: background, window: window, seed: Math.floor(seed) >>> 0 };
  }

  function reconstructMass(event) {
    var pT1 = Number(event.pT1);
    var pT2 = Number(event.pT2);
    var eta1 = Number(event.eta1);
    var eta2 = Number(event.eta2);
    var phi1 = Number(event.phi1);
    var phi2 = Number(event.phi2);
    if (!finite(pT1) || !finite(pT2) || !finite(eta1) || !finite(eta2) || !finite(phi1) || !finite(phi2)) return NaN;
    return Math.sqrt(Math.max(0, 2 * pT1 * pT2 * (Math.cosh(eta1 - eta2) - Math.cos(phi1 - phi2))));
  }

  function randomGenerator(seed) {
    var state = (Math.floor(Number(seed)) >>> 0) || 1;
    return function () { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
  }

  function gaussian(random) {
    var u = 0;
    var v = 0;
    while (u <= 1e-12) u = random();
    while (v <= 1e-12) v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function makeEvent(kind, targetMass, resolution, random) {
    var rapidity = (random() - 0.5) * 1.6;
    var massScale = resolution > 0 ? Math.max(0.01, 1 + resolution * gaussian(random)) : 1;
    var measuredMass = targetMass * massScale;
    var pT = measuredMass / (2 * Math.cosh(rapidity));
    var event = {
      kind: kind,
      targetMass: targetMass,
      pT1: pT,
      pT2: pT,
      eta1: rapidity,
      eta2: -rapidity,
      phi1: 0,
      phi2: Math.PI
    };
    event.mass = reconstructMass(event);
    return event;
  }

  function generateDataset(input) {
    var params = normalize(input);
    var random = randomGenerator(params.seed);
    var events = [];
    var i;
    for (i = 0; i < params.signal; i += 1) events.push(makeEvent("signal", params.mass, params.resolution, random));
    for (i = 0; i < params.background; i += 1) {
      var target = clamp(28 - 38 * Math.log(Math.max(1e-8, 1 - random())), 18, 245);
      events.push(makeEvent("background", target, params.resolution, random));
    }
    return events;
  }

  function histogram(events, bins, minimum, maximum) {
    bins = bins || 32;
    minimum = minimum === undefined ? 0 : minimum;
    maximum = maximum === undefined ? MASS_DOMAIN_MAX : maximum;
    var rows = [];
    var i;
    for (i = 0; i < bins; i += 1) rows.push({ low: minimum + (maximum - minimum) * i / bins, high: minimum + (maximum - minimum) * (i + 1) / bins, signal: 0, background: 0, total: 0 });
    events.forEach(function (event) {
      if (!finite(event.mass) || event.mass < minimum || event.mass >= maximum) return;
      var index = Math.min(bins - 1, Math.floor((event.mass - minimum) / (maximum - minimum) * bins));
      rows[index][event.kind] += 1;
      rows[index].total += 1;
    });
    return rows;
  }

  function asimovSignificance(signal, background) {
    signal = Number(signal);
    background = Number(background);
    if (!finite(signal) || !finite(background) || signal < 0 || background <= 0) return NaN;
    if (!(signal > 0)) return 0;
    return Math.sqrt(2 * ((signal + background) * Math.log(1 + signal / background) - signal));
  }

  function windowStatistics(events, mass, width) {
    var low = mass - width;
    var high = mass + width;
    var signal = 0;
    var background = 0;
    events.forEach(function (event) {
      if (event.mass < low || event.mass > high) return;
      if (event.kind === "signal") signal += 1;
      else background += 1;
    });
    return { low: low, high: high, signal: signal, background: background, total: signal + background, sOverRootB: background > 0 ? signal / Math.sqrt(background) : NaN, asimov: asimovSignificance(signal, background), significanceStatus: background > 0 ? "defined" : "requires-positive-background" };
  }

  function analyze(input) {
    var params;
    try { params = normalize(input); } catch (error) { return { ok: false, status: "invalid-input", message: error.message }; }
    var events = generateDataset(params);
    var rows = histogram(events, HISTOGRAM_BINS, MASS_DOMAIN_MIN, MASS_DOMAIN_MAX);
    var windowStats = windowStatistics(events, params.mass, params.window);
    var peak = rows.reduce(function (best, row) { return row.signal > best.signal ? row : best; }, rows[0]);
    var example = events.filter(function (event) { return event.kind === "signal"; })[0] || events[0];
    return { ok: true, status: "synthetic-sample", params: params, events: events, histogram: rows, window: windowStats, signalPeak: peak.low + (peak.high - peak.low) / 2, example: example, total: events.length, observationNote: "合成观测：四动量经过有限响应后形成质量直方图。", inferenceNote: "模型推断：峰位置、窗口计数和显著性依赖选择、背景和系统误差。" };
  }

  function assert(condition, message) { if (!condition) throw new Error("physics-collider-detector self-test failed: " + message); }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var ideal = reconstructMass({ pT1: 62.5, pT2: 62.5, eta1: 0, eta2: 0, phi1: 0, phi2: Math.PI });
    check(near(ideal, 125, 1e-12), "ideal two-body mass");
    var first = generateDataset(DEFAULTS);
    var second = generateDataset(DEFAULTS);
    check(first.length === DEFAULTS.signal + DEFAULTS.background, "event count");
    check(JSON.stringify(first) === JSON.stringify(second), "seeded sample deterministic");
    var result = analyze(DEFAULTS);
    check(result.ok && result.window.total >= 0, "default analysis");
    check(result.window.signal <= DEFAULTS.signal && result.window.background <= DEFAULTS.background, "window counts bounded");
    check(result.histogram.reduce(function (sum, row) { return sum + row.total; }, 0) <= result.total, "histogram visible count bounded");
    check(asimovSignificance(240, 720) > 0, "Asimov significance");
    check(!finite(asimovSignificance(240, 0)), "zero-background Asimov significance is undefined");
    var zeroBackground = windowStatistics([], 125, 10);
    check(!finite(zeroBackground.sOverRootB) && !finite(zeroBackground.asimov) && zeroBackground.significanceStatus === "requires-positive-background", "zero-background window requires positive B");
    check(near(reconstructMass({ pT1: 50, pT2: 50, eta1: 0, eta2: 0, phi1: 0, phi2: Math.PI }), 100, 1e-12), "second ideal mass");
    var perfect = generateDataset({ mass: 450, resolution: 0, signal: 40, background: 0, window: 10, seed: 17 });
    check(perfect.every(function (event) { return near(event.mass, 450, 1e-12); }), "zero resolution reconstructs the true mass");
    var smeared = generateDataset({ mass: 125, resolution: 0.08, signal: 512, background: 0, window: 10, seed: 17 });
    var mean = smeared.reduce(function (sum, event) { return sum + event.mass; }, 0) / smeared.length;
    var relativeWidth = Math.sqrt(smeared.reduce(function (sum, event) { return sum + Math.pow(event.mass - mean, 2); }, 0) / smeared.length) / mean;
    check(Math.abs(relativeWidth - 0.08) < 0.015, "resolution control is sigma_m over M");
    var highMass = analyze({ mass: 450, resolution: 0, signal: 40, background: 20, window: 10, seed: 17 });
    check(highMass.ok && highMass.histogram.reduce(function (sum, row) { return sum + row.signal; }, 0) === 40 && highMass.signalPeak >= MASS_DOMAIN_MIN && highMass.signalPeak <= MASS_DOMAIN_MAX, "450 GeV signal is inside the histogram domain");
    var massRejected = false;
    try { normalize({ mass: 451, resolution: 0, signal: 1, background: 1, window: 5, seed: 17 }); } catch (error) { massRejected = true; }
    check(massRejected, "mass above the legal 450 GeV limit rejected");
    var rejected = false;
    try { normalize({ mass: 125, resolution: 0.04, signal: 2.5, background: 720, window: 10, seed: 17 }); } catch (error) { rejected = true; }
    check(rejected, "fractional event count rejected");
    return { checks: checks, presets: PRESETS.length };
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
    (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null && child !== false) node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function make(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children, doc);
  }
  function svg(doc, tag, attrs, text) {
    var node = setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {});
    if (text !== undefined) node.textContent = String(text);
    return node;
  }
  function replaceChildren(node, children, doc) {
    if (typeof node.replaceChildren === "function") { node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]); return; }
    while (node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children, doc);
  }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".pcd-lab{color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}.pcd-lab *{box-sizing:border-box}.pcd-lab [hidden]{display:none!important}.pcd-lab h3{margin:0;color:var(--fg,#20252b);font-size:1.15rem}.pcd-note,.pcd-feedback{color:var(--fg-soft,var(--muted,#5d6873));font-size:.9rem}.pcd-lab fieldset{min-width:0;margin:12px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.pcd-lab legend{max-width:100%;font-weight:750}.pcd-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.pcd-choice{display:flex;gap:7px;align-items:flex-start;min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px}.pcd-choice input{margin-top:3px;accent-color:var(--accent,#1769aa)}",
      ".pcd-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.pcd-lab button,.pcd-lab select,.pcd-lab input{font:inherit}.pcd-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:inherit;cursor:pointer}.pcd-lab button:hover{border-color:var(--accent,#1769aa)}.pcd-lab button:focus-visible,.pcd-lab select:focus-visible,.pcd-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pcd-primary{background:var(--accent,#1769aa)!important;color:var(--bg,#fff)!important;font-weight:750}.pcd-pass{color:var(--cl-green,#2f7547)}.pcd-warn{color:var(--cl-red,#b43d32)}",
      ".pcd-layout{display:grid;grid-template-columns:minmax(200px,.7fr) minmax(0,1.3fr);gap:14px;align-items:start}.pcd-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border,#c8cdd3);border-radius:7px}.pcd-field{display:grid;gap:5px}.pcd-field label{font-size:.82rem;font-weight:700;color:var(--fg-soft,var(--muted,#5d6873))}.pcd-field select,.pcd-field input{width:100%;min-height:42px;padding:7px 8px;border:1px solid var(--border,#c8cdd3);border-radius:5px;background:var(--bg,#fff);color:inherit}.pcd-field input[type=range]{padding:0;accent-color:var(--accent,#1769aa)}.pcd-output{font-variant-numeric:tabular-nums;color:var(--accent,#1769aa)}",
      ".pcd-frame{min-width:0;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.pcd-svg{display:block;width:100%;height:auto}.pcd-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pcd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.pcd-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--bg,#fff)}.pcd-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.pcd-metric:nth-child(4n+2){border-color:var(--cl-gold,#95670d)}.pcd-metric:nth-child(4n+3){border-color:var(--cl-green,#347247)}.pcd-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.pcd-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:.73rem}.pcd-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.pcd-table-wrap{max-width:100%;overflow-x:auto;margin-top:10px}.pcd-table{width:100%;min-width:660px;border-collapse:collapse;font-size:.8rem}.pcd-table th,.pcd-table td{padding:7px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.pcd-table th{color:var(--fg-soft,var(--muted,#5d6873));font-size:.74rem}.pcd-interpretation{margin-top:10px;padding:9px 11px;border-left:3px solid var(--cl-blue,#2c6aa0);background:var(--block-bg,var(--bg,#fff));font-size:.86rem}",
      "@media(max-width:760px){.pcd-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:600px){.pcd-choices{grid-template-columns:minmax(0,1fr)}.pcd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.pcd-lab *{transition:none!important;animation:none!important}}"
    ].join("\n");
    doc.head.appendChild(style);
  }
  function metric(api, doc, label) {
    var value = make(api, doc, "strong", {}, ["—"]);
    return make(api, doc, "div", { className: "pcd-metric" }, [make(api, doc, "span", {}, [label]), value]);
  }

  function drawChart(doc, node, result) {
    replaceChildren(node, [], doc);
    node.setAttribute("viewBox", "0 0 860 390");
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", "合成碰撞事件的不变质量直方图与两体事件示意");
    var left = 56, right = 565, top = 42, bottom = 295, min = MASS_DOMAIN_MIN, max = MASS_DOMAIN_MAX;
    var x = function (value) { return left + (value - min) / (max - min) * (right - left); };
    var peakCount = Math.max.apply(null, result.histogram.map(function (row) { return row.total; }).concat([1]));
    var y = function (value) { return bottom - value / peakCount * (bottom - top) * 0.88; };
    node.appendChild(svg(doc, "title", { id: "pcd-title" }, "重建不变质量与事件统计"));
    node.appendChild(svg(doc, "desc", { id: "pcd-desc" }, "左侧按重建质量分箱，蓝色为信号、金色为背景；右侧显示一个两体事件的横向动量与角度信息。"));
    node.setAttribute("aria-labelledby", "pcd-title pcd-desc");
    var windowLow = clamp(result.window.low, min, max);
    var windowHigh = clamp(result.window.high, min, max);
    node.appendChild(svg(doc, "rect", { x: x(windowLow), y: top, width: Math.max(0, x(windowHigh) - x(windowLow)), height: bottom - top, fill: "var(--cl-green,#2f7547)", "fill-opacity": "0.08" }));
    [0, 0.25, 0.5, 0.75, 1].forEach(function (fraction) {
      var value = Math.round(peakCount * fraction);
      node.appendChild(svg(doc, "line", { x1: left, y1: y(value), x2: right, y2: y(value), stroke: "var(--border,#c8cdd3)", "stroke-width": "1" }));
      node.appendChild(svg(doc, "text", { x: left - 8, y: y(value) + 4, "text-anchor": "end", "font-size": "11" }, String(value)));
    });
    [0, 100, 200, 300, 400, 500].forEach(function (value) {
      node.appendChild(svg(doc, "line", { x1: x(value), y1: top, x2: x(value), y2: bottom, stroke: "var(--border,#c8cdd3)", "stroke-width": "1", "stroke-opacity": "0.6" }));
      node.appendChild(svg(doc, "text", { x: x(value), y: bottom + 18, "text-anchor": "middle", "font-size": "11" }, String(value)));
    });
    node.appendChild(svg(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-width": "1.2" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", "stroke-width": "1.2" }));
    result.histogram.forEach(function (row) {
      var x0 = x(row.low) + 1;
      var width = Math.max(1, x(row.high) - x(row.low) - 2);
      var backgroundTop = y(row.background);
      var totalTop = y(row.total);
      node.appendChild(svg(doc, "rect", { x: x0, y: backgroundTop, width: width, height: bottom - backgroundTop, fill: "var(--cl-gold,#95670d)", "fill-opacity": "0.65" }));
      node.appendChild(svg(doc, "rect", { x: x0, y: totalTop, width: width, height: Math.max(0, backgroundTop - totalTop), fill: "var(--cl-blue,#2c6aa0)", "fill-opacity": "0.85" }));
    });
    var massMarkerX = x(clamp(result.params.mass, min, max));
    node.appendChild(svg(doc, "line", { x1: massMarkerX, y1: top, x2: massMarkerX, y2: bottom, stroke: "var(--cl-red,#b43d32)", "stroke-width": "2", "stroke-dasharray": "6 4" }));
    node.appendChild(svg(doc, "text", { x: clamp(massMarkerX + 6, left + 4, right - 4), y: top + 15, "font-size": "11" }, "真值 M=" + format(result.params.mass, 1) + " GeV"));
    node.appendChild(svg(doc, "text", { x: left, y: 23, "font-size": "13", "font-weight": "700" }, "重建不变质量 mrec"));
    node.appendChild(svg(doc, "text", { x: right, y: 23, "text-anchor": "end", "font-size": "11" }, "蓝：信号叠加层　金：背景　绿：窗口"));
    node.appendChild(svg(doc, "text", { x: (left + right) / 2, y: 342, "text-anchor": "middle", "font-size": "12" }, "mrec / GeV"));
    var cx = 710, cy = 176, event = result.example;
    if (!event) {
      node.appendChild(svg(doc, "text", { x: cx, y: cy, "text-anchor": "middle", "font-size": "13", "font-weight": "700" }, "当前没有合成事件"));
      return;
    }
    node.appendChild(svg(doc, "text", { x: cx, y: 30, "text-anchor": "middle", "font-size": "13", "font-weight": "700" }, "一个合成两体事件"));
    [42, 68, 94].forEach(function (radius) { node.appendChild(svg(doc, "circle", { cx: cx, cy: cy, r: radius, fill: "none", stroke: "var(--border,#c8cdd3)", "stroke-width": "1" })); });
    var r1 = 95 * clamp(event.pT1 / (result.params.mass / 2), 0.45, 1.2);
    var r2 = 95 * clamp(event.pT2 / (result.params.mass / 2), 0.45, 1.2);
    node.appendChild(svg(doc, "line", { x1: cx, y1: cy, x2: cx + r1 * Math.cos(event.phi1), y2: cy - r1 * Math.sin(event.phi1), stroke: "var(--cl-blue,#2c6aa0)", "stroke-width": "5", "stroke-linecap": "round" }));
    node.appendChild(svg(doc, "line", { x1: cx, y1: cy, x2: cx + r2 * Math.cos(event.phi2), y2: cy - r2 * Math.sin(event.phi2), stroke: "var(--cl-red,#b43d32)", "stroke-width": "5", "stroke-linecap": "round" }));
    node.appendChild(svg(doc, "circle", { cx: cx, cy: cy, r: "4", fill: "currentColor" }));
    node.appendChild(svg(doc, "text", { x: 610, y: 302, "font-size": "11" }, "pT1=" + format(event.pT1, 1) + " GeV, η1=" + format(event.eta1, 2)));
    node.appendChild(svg(doc, "text", { x: 610, y: 321, "font-size": "11" }, "pT2=" + format(event.pT2, 1) + " GeV, η2=" + format(event.eta2, 2)));
    node.appendChild(svg(doc, "text", { x: 610, y: 340, "font-size": "11" }, "mrec=" + format(event.mass, 2) + " GeV"));
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "pcd-" + INSTANCE;
    var state = { presetId: "higgs-like", mass: DEFAULTS.mass, resolution: DEFAULTS.resolution, signal: DEFAULTS.signal, background: DEFAULTS.background, window: DEFAULTS.window, seed: DEFAULTS.seed, revealed: false, predictions: {} };
    var refs = {};
    root.classList.add("pcd-lab");
    var heading = make(api, doc, "h3", { id: prefix + "-heading" }, ["碰撞事件账本：从四动量到峰与显著性"]);
    var intro = make(api, doc, "p", { className: "pcd-note" }, ["这里的样本是确定性合成数据：先用可重建的四动量形成质量直方图，再在一个质量窗口中统计信号与背景。显著性是模型化的统计摘要，不是自动发现。"]);
    var form = make(api, doc, "fieldset", {});
    form.appendChild(make(api, doc, "legend", {}, ["预测门：先写公式结论，再揭晓样本"]));
    var questions = [
      { key: "mass", text: "pT1=pT2=62.5 GeV、Δη=0、Δφ=π 时，mrec？", expected: "125", options: [["125", "125 GeV"], ["62.5", "62.5 GeV"], ["250", "250 GeV"]] },
      { key: "resolution", text: "相对分辨率变大时，窄峰怎样变化？", expected: "broader", options: [["broader", "变宽"], ["higher", "必然更高"], ["same", "完全不变"]] },
      { key: "statistics", text: "S、B 同时加倍且系统误差忽略时，S/√B？", expected: "sqrt", options: [["sqrt", "乘 √2"], ["double", "乘 2"], ["same", "保持不变"]] }
    ];
    questions.forEach(function (question) {
      var block = make(api, doc, "div", {});
      block.appendChild(make(api, doc, "p", { className: "pcd-note" }, [question.text]));
      var choices = make(api, doc, "div", { className: "pcd-choices" });
      question.options.forEach(function (option) {
        var radio = make(api, doc, "input", { type: "radio", name: prefix + "-" + question.key, value: option[0] });
        radio.addEventListener("change", function () { state.predictions[question.key] = option[0]; });
        choices.appendChild(make(api, doc, "label", { className: "pcd-choice" }, [radio, make(api, doc, "span", {}, [option[1]])]));
      });
      block.appendChild(choices);
      form.appendChild(block);
    });
    var actions = make(api, doc, "div", { className: "pcd-actions" });
    var reveal = make(api, doc, "button", { type: "button", className: "pcd-primary" }, ["核对预测并揭晓"]);
    var reset = make(api, doc, "button", { type: "button" }, ["重置预测"]);
    actions.appendChild(reveal);
    actions.appendChild(reset);
    refs.feedback = make(api, doc, "p", { className: "pcd-feedback", "aria-live": "polite", "aria-atomic": "true" }, []);
    var shell = make(api, doc, "div", { hidden: true });
    var controls = make(api, doc, "div", { className: "pcd-controls" });
    var preset = make(api, doc, "select", { "aria-label": "碰撞统计预设" });
    PRESETS.forEach(function (item) { preset.appendChild(make(api, doc, "option", { value: item.id }, [item.label])); });
    var massInput = make(api, doc, "input", { type: "number", min: "20", max: "450", step: "1", value: String(DEFAULTS.mass), "aria-label": "真值质量 / GeV" });
    var resolutionInput = make(api, doc, "input", { type: "range", min: "0", max: "0.2", step: "0.005", value: String(DEFAULTS.resolution), "aria-label": "相对质量分辨率 σm/M" });
    var resolutionOutput = make(api, doc, "output", { className: "pcd-output" }, ["4%"]);
    var signalInput = make(api, doc, "input", { type: "range", min: "0", max: "600", step: "10", value: String(DEFAULTS.signal), "aria-label": "信号事件数 Nsig" });
    var signalOutput = make(api, doc, "output", { className: "pcd-output" }, [String(DEFAULTS.signal)]);
    var backgroundInput = make(api, doc, "input", { type: "range", min: "0", max: "2000", step: "20", value: String(DEFAULTS.background), "aria-label": "背景事件数 Nbkg" });
    var backgroundOutput = make(api, doc, "output", { className: "pcd-output" }, [String(DEFAULTS.background)]);
    var windowInput = make(api, doc, "input", { type: "range", min: "2", max: "35", step: "1", value: String(DEFAULTS.window), "aria-label": "质量窗口半宽 / GeV" });
    var windowOutput = make(api, doc, "output", { className: "pcd-output" }, ["±10 GeV"]);
    function labelled(label, input, output, id) {
      input.id = id;
      return make(api, doc, "div", { className: "pcd-field" }, [make(api, doc, "label", { htmlFor: id }, [label, output]), input]);
    }
    preset.id = prefix + "-preset";
    controls.appendChild(make(api, doc, "div", { className: "pcd-field" }, [make(api, doc, "label", { htmlFor: preset.id }, ["教学预设"]), preset]));
    controls.appendChild(labelled("真值质量 / GeV：", massInput, null, prefix + "-mass"));
    controls.appendChild(labelled("相对质量分辨率 σm/M：", resolutionInput, resolutionOutput, prefix + "-resolution"));
    controls.appendChild(labelled("信号事件 Nsig：", signalInput, signalOutput, prefix + "-signal"));
    controls.appendChild(labelled("背景事件 Nbkg：", backgroundInput, backgroundOutput, prefix + "-background"));
    controls.appendChild(labelled("窗口半宽：", windowInput, windowOutput, prefix + "-window"));
    controls.appendChild(make(api, doc, "p", { className: "pcd-note" }, ["随机种子固定为每次刷新相同的合成样本；现实分析还要把触发、选择、校准和系统误差加入似然。"]));
    var stage = make(api, doc, "div", {});
    var frame = make(api, doc, "div", { className: "pcd-frame" });
    var chart = doc.createElementNS(SVG_NS, "svg");
    chart.setAttribute("class", "pcd-svg");
    frame.appendChild(chart);
    stage.appendChild(frame);
    var metrics = make(api, doc, "div", { className: "pcd-metrics" });
    var tableWrap = make(api, doc, "div", { className: "pcd-table-wrap" });
    var interpretation = make(api, doc, "p", { className: "pcd-interpretation", "aria-live": "polite" }, []);
    stage.appendChild(metrics);
    stage.appendChild(tableWrap);
    stage.appendChild(interpretation);
    shell.appendChild(make(api, doc, "div", { className: "pcd-layout" }, [controls, stage]));
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(form);
    root.appendChild(actions);
    root.appendChild(refs.feedback);
    root.appendChild(shell);

    function applyPreset(id) {
      var selected = PRESETS.filter(function (item) { return item.id === id; })[0];
      if (!selected) return;
      state.presetId = selected.id;
      state.mass = selected.mass;
      state.resolution = selected.resolution;
      state.signal = selected.signal;
      state.background = selected.background;
      state.window = selected.window;
      state.seed = selected.seed;
    }
    function renderTable(result) {
      replaceChildren(tableWrap, [], doc);
      var table = make(api, doc, "table", { className: "pcd-table" });
      table.appendChild(make(api, doc, "caption", {}, ["统计账本：窗口计数与显著性摘要"]));
      table.appendChild(make(api, doc, "thead", {}, [make(api, doc, "tr", {}, [make(api, doc, "th", { scope: "col" }, ["量"]), make(api, doc, "th", { scope: "col" }, ["数值"]), make(api, doc, "th", { scope: "col" }, ["状态"]), make(api, doc, "th", { scope: "col" }, ["解释"])])]));
      var rows = [
        ["质量窗口", format(result.window.low, 1) + "–" + format(result.window.high, 1) + " GeV", "选择", "围绕真值的分析窗口"],
        ["S window", String(result.window.signal), "合成计数", "窗口内的 signal 标签数"],
        ["B window", String(result.window.background), "合成计数", "窗口内的 background 标签数"],
        ["S/√B", format(result.window.sOverRootB, 3), result.window.background > 0 ? "近似" : "未定义", result.window.background > 0 ? "大 B、无系统误差时的快速摘要" : "需要窗口内 B>0；没有背景时不报告有限值"],
        ["Z_A", format(result.window.asimov, 3), result.window.background > 0 ? "近似" : "未定义", result.window.background > 0 ? "Poisson 计数的 Asimov 近似，仍未含 nuisance" : "需要窗口内 B>0；没有背景时不伪造有限显著性"]
      ];
      var body = make(api, doc, "tbody");
      rows.forEach(function (row) { body.appendChild(make(api, doc, "tr", {}, row.map(function (value) { return make(api, doc, "td", {}, [value]); }))); });
      table.appendChild(body);
      tableWrap.appendChild(table);
    }
    function render() {
      preset.value = state.presetId;
      massInput.value = String(state.mass);
      resolutionInput.value = String(state.resolution);
      resolutionOutput.textContent = format(state.resolution * 100, 1) + "%";
      signalInput.value = String(state.signal);
      signalOutput.textContent = String(state.signal);
      backgroundInput.value = String(state.background);
      backgroundOutput.textContent = String(state.background);
      windowInput.value = String(state.window);
      windowOutput.textContent = "±" + format(state.window, 0) + " GeV";
      shell.hidden = !state.revealed;
      if (!state.revealed) return;
      var result = analyze({ mass: state.mass, resolution: state.resolution, signal: state.signal, background: state.background, window: state.window, seed: state.seed });
      if (!result.ok) {
        replaceChildren(chart, [], doc);
        replaceChildren(metrics, [], doc);
        replaceChildren(tableWrap, [], doc);
        replaceChildren(interpretation, ["模型停止：" + result.message], doc);
        interpretation.className = "pcd-interpretation pcd-warn";
        return;
      }
      drawChart(doc, chart, result);
      replaceChildren(metrics, [metric(api, doc, "信号峰 / GeV"), metric(api, doc, "S window"), metric(api, doc, "B window"), metric(api, doc, "Z_A")], doc);
      [format(result.signalPeak, 1), String(result.window.signal), String(result.window.background), format(result.window.asimov, 3)].forEach(function (value, index) { metrics.querySelectorAll("strong")[index].textContent = value; });
      renderTable(result);
      interpretation.textContent = "观测层：" + result.observationNote + " 模型层：" + result.inferenceNote + " 当前峰位置和窗口计数会随响应、选择和样本量变化；把 Z_A 当作发现阈值前，必须建立完整的背景与系统误差模型。";
    }
    preset.addEventListener("change", function () { applyPreset(preset.value); render(); });
    massInput.addEventListener("input", function () { state.mass = Number(massInput.value); state.presetId = "custom"; render(); });
    resolutionInput.addEventListener("input", function () { state.resolution = Number(resolutionInput.value); state.presetId = "custom"; render(); });
    signalInput.addEventListener("input", function () { state.signal = Number(signalInput.value); state.presetId = "custom"; render(); });
    backgroundInput.addEventListener("input", function () { state.background = Number(backgroundInput.value); state.presetId = "custom"; render(); });
    windowInput.addEventListener("input", function () { state.window = Number(windowInput.value); state.presetId = "custom"; render(); });
    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) {
        var missingMessage = "请先完成全部预测，再揭晓。";
        refs.feedback.textContent = missingMessage;
        refs.feedback.className = "pcd-feedback pcd-warn";
        announce(api, root, missingMessage);
        return;
      }
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      state.revealed = true;
      var message = "已揭晓：" + correct + "/" + questions.length + " 命中。现在可改变响应、信号、背景和窗口。";
      refs.feedback.textContent = message;
      refs.feedback.className = "pcd-feedback " + (correct === questions.length ? "pcd-pass" : "pcd-warn");
      render();
      announce(api, root, message);
    });
    reset.addEventListener("click", function () {
      state.presetId = "higgs-like";
      state.mass = DEFAULTS.mass;
      state.resolution = DEFAULTS.resolution;
      state.signal = DEFAULTS.signal;
      state.background = DEFAULTS.background;
      state.window = DEFAULTS.window;
      state.seed = DEFAULTS.seed;
      state.revealed = false;
      state.predictions = {};
      form.querySelectorAll("input[type=radio]").forEach(function (radio) { radio.checked = false; });
      refs.feedback.textContent = "";
      render();
      announce(api, root, "碰撞事件预测已重置。");
    });
    render();
  }
  return { DEFAULTS: DEFAULTS, PRESETS: PRESETS, MASS_DOMAIN_MIN: MASS_DOMAIN_MIN, MASS_DOMAIN_MAX: MASS_DOMAIN_MAX, normalize: normalize, reconstructMass: reconstructMass, generateDataset: generateDataset, histogram: histogram, asimovSignificance: asimovSignificance, windowStatistics: windowStatistics, analyze: analyze, mount: mount, selfTest: selfTest };
});
