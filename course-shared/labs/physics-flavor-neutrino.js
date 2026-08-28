(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-flavor-neutrino", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-flavor-neutrino self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-flavor-neutrino self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-flavor-neutrino-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;
  var DM2_REF = 2.5e-3;
  var E_REF = 1;

  var PRESETS = [
    { id: "atmospheric", label: "大气尺度：首次极大", theta: 33, dm2: 0.0025, energy: 1, baseline: 500, coherence: 1000, note: "两味 toy 在 1 GeV、500 km 附近接近首次转换极大。" },
    { id: "long-baseline", label: "长基线：相干性变差", theta: 33, dm2: 0.0025, energy: 1, baseline: 3000, coherence: 1000, note: "相位继续积累，但波包可见度下降，结果向平均值靠近。" },
    { id: "solar-scale", label: "太阳 Δm²", theta: 33, dm2: 0.000075, energy: 0.01, baseline: 330, coherence: 1000, note: "把能量降到 MeV 量级，保持 L/E 的相位尺度。" },
    { id: "no-mixing", label: "无混合边界", theta: 0, dm2: 0.0025, energy: 1, baseline: 500, coherence: 1000, note: "θ=0 时质量基与味基重合，不出现异味。" }
  ];

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
  function format(value, digits) {
    if (!finite(value)) return "—";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function formatLength(value) { return value === Infinity ? "∞" : format(value, 0); }

  function normalize(input) {
    input = input || {};
    var theta = Number(input.theta);
    var dm2 = Number(input.dm2 === undefined ? input.deltaM2 : input.dm2);
    var energy = Number(input.energy === undefined ? input.E : input.energy);
    var baseline = Number(input.baseline === undefined ? input.L : input.baseline);
    var coherenceReference = Number(input.coherenceReference === undefined ? (input.coherence === undefined ? input.coherenceLength : input.coherence) : input.coherenceReference);
    if (!finite(theta) || !finite(dm2) || !finite(energy) || !finite(baseline) || !finite(coherenceReference)) throw new TypeError("θ、Δm²、E、L、Lcoh,ref 必须是有限数");
    if (theta < 0 || theta > 45) throw new RangeError("两味实验要求 0≤θ≤45°");
    if (!(energy > 0) || baseline < 0 || !(coherenceReference > 0)) throw new RangeError("E、Lcoh,ref 必须为正，基线 L 不能为负；Δm² 可取 0");
    return { theta: theta, dm2: dm2, energy: energy, baseline: baseline, coherence: coherenceReference, coherenceReference: coherenceReference };
  }

  function effectiveCoherenceLength(referenceLength, energy, dm2) {
    referenceLength = Number(referenceLength);
    energy = Number(energy);
    dm2 = Number(dm2);
    if (!finite(referenceLength) || !finite(energy) || !finite(dm2) || !(referenceLength > 0) || !(energy > 0)) return NaN;
    var magnitude = Math.abs(dm2);
    if (magnitude === 0) return Infinity;
    return referenceLength * Math.pow(energy / E_REF, 2) * (DM2_REF / magnitude);
  }

  function phase(input) {
    var params = normalize(input);
    return 1.27 * params.dm2 * params.baseline / params.energy;
  }

  function analyze(input) {
    var params;
    try {
      params = normalize(input);
    } catch (error) {
      return { ok: false, status: "invalid-input", message: error.message };
    }
    var phi = 1.27 * params.dm2 * params.baseline / params.energy;
    var amplitude = Math.pow(Math.sin(2 * params.theta * Math.PI / 180), 2);
    var coherenceEffective = effectiveCoherenceLength(params.coherenceReference, params.energy, params.dm2);
    var visibility = coherenceEffective === Infinity ? 1 : Math.exp(-Math.pow(params.baseline / coherenceEffective, 2));
    var coherentProbability = amplitude * Math.pow(Math.sin(phi), 2);
    var averagedProbability = amplitude / 2;
    var probability = averagedProbability * (1 - visibility * Math.cos(2 * phi));
    var splitting = Math.abs(params.dm2);
    return {
      ok: true,
      status: visibility > 0.95 ? "coherent" : visibility < 0.05 ? "averaged" : "partially-coherent",
      theta: params.theta,
      dm2: params.dm2,
      energy: params.energy,
      baseline: params.baseline,
      coherence: coherenceEffective,
      coherenceReference: params.coherenceReference,
      coherenceEffective: coherenceEffective,
      phi: phi,
      amplitude: amplitude,
      visibility: visibility,
      coherentProbability: coherentProbability,
      probability: probability,
      averagedProbability: averagedProbability,
      survivalProbability: 1 - probability,
      firstMaximumBaseline: splitting > 0 ? Math.PI * params.energy / (2 * 1.27 * splitting) : Infinity
    };
  }

  function maximumBaseline(params) {
    var splitting = Math.abs(params.dm2);
    var oscillationSpan = splitting > 0 ? params.energy / splitting * 1.27 * 3.2 : 0;
    return Math.max(2500, params.baseline, oscillationSpan);
  }

  function curve(input, count) {
    var params = normalize(input);
    count = count || 150;
    var maxBaseline = maximumBaseline(params);
    var points = [];
    for (var i = 0; i <= count; i += 1) {
      var baseline = maxBaseline * i / count;
      var result = analyze({ theta: params.theta, dm2: params.dm2, energy: params.energy, baseline: baseline, coherence: params.coherence });
      points.push({ baseline: baseline, coherent: result.coherentProbability, probability: result.probability, average: result.averagedProbability });
    }
    return points;
  }

  function assert(condition, message) {
    if (!condition) throw new Error("physics-flavor-neutrino self-test failed: " + message);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var base = analyze({ theta: 33, dm2: 0.0025, energy: 1, baseline: 500, coherence: 1000 });
    check(base.ok, "reference input valid");
    check(base.amplitude > 0.8 && base.amplitude < 0.9, "mixing amplitude");
    check(base.probability >= 0 && base.probability <= 1, "probability bounds");
    check(base.visibility < 1 && base.visibility > 0, "partial visibility");
    check(near(base.coherenceEffective, 1000, 1e-12) && near(base.coherenceReference, 1000, 1e-12), "reference coherence length is unchanged at dm2_ref and E_ref");
    check(near(effectiveCoherenceLength(1000, 2, 0.005), 2000, 1e-12), "energy and splitting coherence scaling");
    check(effectiveCoherenceLength(1000, 1, 0) === Infinity, "zero splitting coherence limit");
    var zeroSplitting = analyze({ theta: 33, dm2: 0, energy: 1, baseline: 500, coherence: 1000 });
    check(zeroSplitting.ok && zeroSplitting.visibility === 1 && zeroSplitting.probability === 0, "zero splitting has full visibility and no conversion");
    check(analyze({ theta: 0, dm2: 0.0025, energy: 1, baseline: 500, coherence: 1000 }).probability === 0, "zero mixing boundary");
    var max = analyze({ theta: 45, dm2: 0.0025, energy: 1, baseline: 500, coherence: 1e9 });
    check(max.coherentProbability > 0.99, "first maximum is near one for maximal mixing");
    var far = analyze({ theta: 33, dm2: 0.0025, energy: 1, baseline: 5000, coherence: 100 });
    check(near(far.probability, far.averagedProbability, 1e-8), "lost coherence approaches average");
    check(near(base.survivalProbability + base.probability, 1, 1e-12), "two-flavor probability conservation");
    check(near(base.firstMaximumBaseline, 494.7390005653, 1e-10), "first maximum scale");
    var curveA = curve({ theta: 33, dm2: 0.0025, energy: 1, baseline: 500, coherence: 1000 }, 30);
    var curveB = curve({ theta: 33, dm2: 0.0025, energy: 1, baseline: 500, coherence: 1000 }, 30);
    check(JSON.stringify(curveA) === JSON.stringify(curveB), "curve deterministic");
    var longCurve = curve({ theta: 33, dm2: 0.0025, energy: 1, baseline: 3000, coherence: 1000 }, 30);
    check(longCurve[longCurve.length - 1].baseline >= 3000 && longCurve.every(function (point) { return point.baseline >= 0 && point.baseline <= 3000; }), "3000 km preset fits the plotted domain");
    var zeroCurve = curve({ theta: 33, dm2: 0, energy: 1, baseline: 3000, coherence: 1000 }, 10);
    check(zeroCurve.every(function (point) { return point.probability === 0 && point.coherent === 0 && finite(point.average); }), "zero splitting curve remains finite and conversion-free");
    var rejected = false;
    try { normalize({ theta: 50, dm2: 0.0025, energy: 1, baseline: 500, coherence: 1000 }); } catch (error) { rejected = true; }
    check(rejected, "out-of-range angle rejected");
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
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
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
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children, doc);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".pnu-lab{color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}.pnu-lab *{box-sizing:border-box}.pnu-lab [hidden]{display:none!important}.pnu-lab h3{margin:0;color:var(--fg,#20252b);font-size:1.15rem}.pnu-note,.pnu-feedback{color:var(--fg-soft,var(--muted,#5d6873));font-size:.9rem}.pnu-lab fieldset{min-width:0;margin:12px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.pnu-lab legend{max-width:100%;font-weight:750}.pnu-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.pnu-choice{display:flex;gap:7px;align-items:flex-start;min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px}.pnu-choice input{margin-top:3px;accent-color:var(--accent,#1769aa)}",
      ".pnu-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.pnu-lab button,.pnu-lab select,.pnu-lab input{font:inherit}.pnu-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:inherit;cursor:pointer}.pnu-lab button:hover{border-color:var(--accent,#1769aa)}.pnu-lab button:focus-visible,.pnu-lab select:focus-visible,.pnu-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pnu-primary{background:var(--accent,#1769aa)!important;color:var(--bg,#fff)!important;font-weight:750}.pnu-pass{color:var(--cl-green,#2f7547)}.pnu-warn{color:var(--cl-red,#b43d32)}",
      ".pnu-layout{display:grid;grid-template-columns:minmax(200px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.pnu-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border,#c8cdd3);border-radius:7px}.pnu-field{display:grid;gap:5px}.pnu-field label{font-size:.82rem;font-weight:700;color:var(--fg-soft,var(--muted,#5d6873))}.pnu-field select,.pnu-field input{width:100%;min-height:42px;padding:7px 8px;border:1px solid var(--border,#c8cdd3);border-radius:5px;background:var(--bg,#fff);color:inherit}.pnu-field input[type=range]{padding:0;accent-color:var(--accent,#1769aa)}.pnu-output{font-variant-numeric:tabular-nums;color:var(--accent,#1769aa)}",
      ".pnu-frame{min-width:0;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.pnu-svg{display:block;width:100%;height:auto}.pnu-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pnu-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.pnu-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--bg,#fff)}.pnu-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.pnu-metric:nth-child(4n+2){border-color:var(--cl-gold,#95670d)}.pnu-metric:nth-child(4n+3){border-color:var(--cl-green,#347247)}.pnu-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.pnu-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:.73rem}.pnu-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.pnu-table-wrap{max-width:100%;overflow-x:auto;margin-top:10px}.pnu-table{width:100%;min-width:650px;border-collapse:collapse;font-size:.8rem}.pnu-table th,.pnu-table td{padding:7px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.pnu-table th{color:var(--fg-soft,var(--muted,#5d6873));font-size:.74rem}.pnu-interpretation{margin-top:10px;padding:9px 11px;border-left:3px solid var(--cl-blue,#2c6aa0);background:var(--block-bg,var(--bg,#fff));font-size:.86rem}",
      "@media(max-width:760px){.pnu-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:600px){.pnu-choices{grid-template-columns:minmax(0,1fr)}.pnu-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.pnu-lab *{transition:none!important;animation:none!important}}"
    ].join("\n");
    doc.head.appendChild(style);
  }

  function metric(api, doc, label) {
    var value = make(api, doc, "strong", {}, ["—"]);
    return make(api, doc, "div", { className: "pnu-metric" }, [make(api, doc, "span", {}, [label]), value]);
  }

  function drawChart(doc, node, params, current) {
    replaceChildren(node, [], doc);
    node.setAttribute("viewBox", "0 0 760 350");
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", "两味中微子转换概率随基线的振荡与相干性衰减");
    var left = 58;
    var right = 730;
    var top = 30;
    var bottom = 292;
    var maxBaseline = maximumBaseline(params);
    var x = function (value) { return left + value / maxBaseline * (right - left); };
    var y = function (value) { return bottom - clamp(value, 0, 1) * (bottom - top); };
    node.appendChild(svg(doc, "title", { id: "pnu-title" }, "中微子味转换概率曲线"));
    node.appendChild(svg(doc, "desc", { id: "pnu-desc" }, "实线表示含有限相干可见度的转换概率，虚线表示理想相干结果，灰线表示失相干平均值。"));
    node.setAttribute("aria-labelledby", "pnu-title pnu-desc");
    [0, 0.25, 0.5, 0.75, 1].forEach(function (value) {
      node.appendChild(svg(doc, "line", { x1: left, y1: y(value), x2: right, y2: y(value), stroke: "var(--border,#c8cdd3)", "stroke-width": "1" }));
      node.appendChild(svg(doc, "text", { x: left - 8, y: y(value) + 4, "text-anchor": "end", "font-size": "11" }, format(value, 2)));
    });
    [0, maxBaseline / 4, maxBaseline / 2, maxBaseline * 3 / 4, maxBaseline].forEach(function (value) {
      node.appendChild(svg(doc, "line", { x1: x(value), y1: top, x2: x(value), y2: bottom, stroke: "var(--border,#c8cdd3)", "stroke-width": "1", "stroke-opacity": "0.65" }));
      node.appendChild(svg(doc, "text", { x: x(value), y: bottom + 18, "text-anchor": "middle", "font-size": "11" }, format(value, 0)));
    });
    node.appendChild(svg(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-width": "1.2" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", "stroke-width": "1.2" }));
    var points = curve(params, 160);
    var pathCoherent = "";
    var pathObserved = "";
    points.forEach(function (point) {
      var px = x(point.baseline).toFixed(2);
      pathCoherent += (pathCoherent ? " L " : "M ") + px + " " + y(point.coherent).toFixed(2);
      pathObserved += (pathObserved ? " L " : "M ") + px + " " + y(point.probability).toFixed(2);
    });
    node.appendChild(svg(doc, "path", { d: pathCoherent, fill: "none", stroke: "var(--cl-gold,#95670d)", "stroke-width": "2", "stroke-dasharray": "6 4" }));
    node.appendChild(svg(doc, "path", { d: pathObserved, fill: "none", stroke: "var(--cl-blue,#2c6aa0)", "stroke-width": "3", "stroke-linecap": "round" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: y(current.averagedProbability), x2: right, y2: y(current.averagedProbability), stroke: "var(--cl-green,#347247)", "stroke-width": "1.5", "stroke-dasharray": "3 4" }));
    if (current.ok) node.appendChild(svg(doc, "circle", { cx: x(current.baseline), cy: y(current.probability), r: "6", fill: "var(--cl-red,#b43d32)", stroke: "var(--bg,#fff)", "stroke-width": "2" }));
    node.appendChild(svg(doc, "text", { x: left + 6, y: top + 15, "font-size": "11", fill: "var(--cl-blue,#2c6aa0)" }, "蓝：含相干性"));
    node.appendChild(svg(doc, "text", { x: left + 98, y: top + 15, "font-size": "11", fill: "var(--cl-gold,#95670d)" }, "金：理想相干"));
    node.appendChild(svg(doc, "text", { x: left + 190, y: top + 15, "font-size": "11", fill: "var(--cl-green,#347247)" }, "绿：失相干平均"));
    node.appendChild(svg(doc, "text", { x: (left + right) / 2, y: 337, "text-anchor": "middle", "font-size": "12" }, "基线 L / km"));
    node.appendChild(svg(doc, "text", { x: 17, y: (top + bottom) / 2, "text-anchor": "middle", "font-size": "12", transform: "rotate(-90 17 " + ((top + bottom) / 2) + ")" }, "P(νa→νb)"));
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "pnu-" + INSTANCE;
    var state = { presetId: "atmospheric", theta: 33, dm2: 0.0025, energy: 1, baseline: 500, coherence: 1000, revealed: false, predictions: {} };
    var refs = {};
    root.classList.add("pnu-lab");
    var heading = make(api, doc, "h3", { id: prefix + "-heading" }, ["中微子振荡账本：先猜相位，再看相干性"]);
    var intro = make(api, doc, "p", { className: "pnu-note" }, ["实验用两味、真空、相对论中微子 toy；它把“味改变”的观测、质量差与混合的模型推断、以及波包失相干的边界分开。"]);
    var form = make(api, doc, "fieldset", {});
    form.appendChild(make(api, doc, "legend", {}, ["预测门：结果、曲线和账本会在揭晓后出现"]));
    var questions = [
      { key: "baseline", text: "固定 E、Δm² 时，增加 L 会怎样？", expected: "oscillate", options: [["oscillate", "相位增加并振荡"], ["increase", "单调增加"], ["same", "完全不变"]] },
      { key: "mixing", text: "θ=0 时异味转换概率？", expected: "zero", options: [["zero", "为 0"], ["half", "平均为 1/2"], ["one", "达到 1"]] },
      { key: "coherence", text: "完全失相干后的两味平均？", expected: "average", options: [["average", "1/2·sin²2θ"], ["zero", "总是 0"], ["peak", "总是等于相干极大"]] }
    ];
    questions.forEach(function (question) {
      var block = make(api, doc, "div", {});
      block.appendChild(make(api, doc, "p", { className: "pnu-note" }, [question.text]));
      var choices = make(api, doc, "div", { className: "pnu-choices" });
      question.options.forEach(function (option) {
        var radio = make(api, doc, "input", { type: "radio", name: prefix + "-" + question.key, value: option[0] });
        radio.addEventListener("change", function () { state.predictions[question.key] = option[0]; });
        choices.appendChild(make(api, doc, "label", { className: "pnu-choice" }, [radio, make(api, doc, "span", {}, [option[1]])]));
      });
      block.appendChild(choices);
      form.appendChild(block);
    });
    var actions = make(api, doc, "div", { className: "pnu-actions" });
    var reveal = make(api, doc, "button", { type: "button", className: "pnu-primary" }, ["核对预测并揭晓"]);
    var reset = make(api, doc, "button", { type: "button" }, ["重置预测"]);
    actions.appendChild(reveal);
    actions.appendChild(reset);
    refs.feedback = make(api, doc, "p", { className: "pnu-feedback", "aria-live": "polite", "aria-atomic": "true" }, []);
    var shell = make(api, doc, "div", { hidden: true });
    var controls = make(api, doc, "div", { className: "pnu-controls" });
    var preset = make(api, doc, "select", { "aria-label": "中微子教学预设" });
    PRESETS.forEach(function (item) { preset.appendChild(make(api, doc, "option", { value: item.id }, [item.label])); });
    var thetaInput = make(api, doc, "input", { type: "range", min: "0", max: "45", step: "0.5", value: "33", "aria-label": "混合角 θ" });
    var thetaOutput = make(api, doc, "output", { className: "pnu-output" }, ["33°"]);
    var dmInput = make(api, doc, "input", { type: "number", min: "-0.01", max: "0.01", step: "0.00001", value: "0.0025", "aria-label": "质量平方差 Δm² / eV²" });
    var energyInput = make(api, doc, "input", { type: "number", min: "0.001", max: "20", step: "0.001", value: "1", "aria-label": "中微子能量 E / GeV" });
    var baselineInput = make(api, doc, "input", { type: "range", min: "0", max: "4000", step: "1", value: "500", "aria-label": "基线 L / km" });
    var baselineOutput = make(api, doc, "output", { className: "pnu-output" }, ["500 km"]);
    var coherenceInput = make(api, doc, "input", { type: "range", min: "100", max: "10000", step: "10", value: "1000", "aria-label": "参考相干长度 Lcoh,ref / km" });
    var coherenceOutput = make(api, doc, "output", { className: "pnu-output" }, ["1000 km"]);
    function labelled(label, input, output, id) {
      input.id = id;
      return make(api, doc, "div", { className: "pnu-field" }, [make(api, doc, "label", { htmlFor: id }, [label, output]), input]);
    }
    preset.id = prefix + "-preset";
    controls.appendChild(make(api, doc, "div", { className: "pnu-field" }, [make(api, doc, "label", { htmlFor: preset.id }, ["教学预设"]), preset]));
    controls.appendChild(labelled("混合角 θ：", thetaInput, thetaOutput, prefix + "-theta"));
    controls.appendChild(labelled("Δm² / eV²：", dmInput, null, prefix + "-dm2"));
    controls.appendChild(labelled("能量 E / GeV：", energyInput, null, prefix + "-energy"));
    controls.appendChild(labelled("基线 L：", baselineInput, baselineOutput, prefix + "-baseline"));
    controls.appendChild(labelled("参考相干长度 Lcoh,ref：", coherenceInput, coherenceOutput, prefix + "-coherence"));
    controls.appendChild(make(api, doc, "p", { className: "pnu-note" }, ["UI 的 Lcoh 是参考长度：Lcoh,eff = Lcoh,ref × (E / 1 GeV)² × (2.5×10⁻³ eV² / |Δm²|)；Δm²→0 时取 ∞。真实源和探测器还需单独建模。"]));
    var stage = make(api, doc, "div", {});
    var frame = make(api, doc, "div", { className: "pnu-frame" });
    var chart = doc.createElementNS(SVG_NS, "svg");
    chart.setAttribute("class", "pnu-svg");
    frame.appendChild(chart);
    stage.appendChild(frame);
    var metrics = make(api, doc, "div", { className: "pnu-metrics" });
    var tableWrap = make(api, doc, "div", { className: "pnu-table-wrap" });
    var interpretation = make(api, doc, "p", { className: "pnu-interpretation", "aria-live": "polite" }, []);
    stage.appendChild(metrics);
    stage.appendChild(tableWrap);
    stage.appendChild(interpretation);
    shell.appendChild(make(api, doc, "div", { className: "pnu-layout" }, [controls, stage]));
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
      state.theta = selected.theta;
      state.dm2 = selected.dm2;
      state.energy = selected.energy;
      state.baseline = selected.baseline;
      state.coherence = selected.coherence;
    }

    function renderLedger(result) {
      replaceChildren(tableWrap, [], doc);
      var table = make(api, doc, "table", { className: "pnu-table" });
      table.appendChild(make(api, doc, "caption", {}, ["计算账本：相位、可见度与概率"]));
      table.appendChild(make(api, doc, "thead", {}, [make(api, doc, "tr", {}, [make(api, doc, "th", { scope: "col" }, ["量"]), make(api, doc, "th", { scope: "col" }, ["数值"]), make(api, doc, "th", { scope: "col" }, ["解释"])])]));
      var rows = [
        ["φ", result.ok ? format(result.phi, 4) : "—", "1.27 Δm² L/E；无量纲相位"],
        ["sin²2θ", result.ok ? format(result.amplitude, 4) : "—", "混合振幅上限"],
        ["V(L)", result.ok ? format(result.visibility, 4) : "—", "有限相干的可见度"],
        ["Lcoh,eff", result.ok ? formatLength(result.coherenceEffective) + " km" : "—", "由 Lcoh,ref、E 和 |Δm²| 缩放；Δm²→0 时为 ∞"],
        ["P 相干", result.ok ? format(result.coherentProbability, 4) : "—", "理想波包重叠时的值"],
        ["P 当前", result.ok ? format(result.probability, 4) : "—", "含 V 的教学观测模型"],
        ["P 平均", result.ok ? format(result.averagedProbability, 4) : "—", "V→0 后的 1/2·sin²2θ"]
      ];
      var body = make(api, doc, "tbody");
      rows.forEach(function (row) { body.appendChild(make(api, doc, "tr", {}, row.map(function (value) { return make(api, doc, "td", {}, [value]); }))); });
      table.appendChild(body);
      tableWrap.appendChild(table);
    }

    function render() {
      preset.value = state.presetId;
      thetaInput.value = String(state.theta);
      thetaOutput.textContent = format(state.theta, 1) + "°";
      dmInput.value = String(state.dm2);
      energyInput.value = String(state.energy);
      baselineInput.value = String(state.baseline);
      baselineOutput.textContent = format(state.baseline, 0) + " km";
      coherenceInput.value = String(state.coherence);
      coherenceOutput.textContent = format(state.coherence, 0) + " km";
      shell.hidden = !state.revealed;
      if (!state.revealed) return;
      var result = analyze({ theta: state.theta, dm2: state.dm2, energy: state.energy, baseline: state.baseline, coherence: state.coherence });
      if (!result.ok) {
        replaceChildren(chart, [], doc);
        replaceChildren(metrics, [], doc);
        replaceChildren(tableWrap, [], doc);
        replaceChildren(interpretation, ["模型停止：" + result.message], doc);
        interpretation.className = "pnu-interpretation pnu-warn";
        return;
      }
      drawChart(doc, chart, { theta: state.theta, dm2: state.dm2, energy: state.energy, baseline: state.baseline, coherence: state.coherence }, result);
      replaceChildren(metrics, [metric(api, doc, "φ"), metric(api, doc, "V(L)"), metric(api, doc, "P 当前"), metric(api, doc, "P 平均")], doc);
      var values = [result.ok ? format(result.phi, 3) : "—", result.ok ? format(result.visibility, 3) : "—", result.ok ? format(result.probability, 3) : "—", result.ok ? format(result.averagedProbability, 3) : "—"];
      metrics.querySelectorAll("strong").forEach(function (node, index) { node.textContent = values[index]; });
      renderLedger(result);
      interpretation.textContent = result.ok ? "模型读法：" + (result.status === "coherent" ? "波包仍高度重叠，曲线接近理想振荡。" : result.status === "averaged" ? "相位信息被洗掉，结果接近 1/2·sin²2θ。" : "振荡仍存在，但有限可见度把峰谷拉向平均线。") + " 观测到味改变支持质量差与混合的模型推断；本 toy 不测绝对质量，也不含物质效应。" : "模型停止：" + result.message;
      interpretation.className = "pnu-interpretation " + (result.ok ? "pnu-pass" : "pnu-warn");
    }

    preset.addEventListener("change", function () { applyPreset(preset.value); render(); });
    thetaInput.addEventListener("input", function () { state.theta = Number(thetaInput.value); state.presetId = "custom"; render(); });
    dmInput.addEventListener("input", function () { state.dm2 = Number(dmInput.value); state.presetId = "custom"; render(); });
    energyInput.addEventListener("input", function () { state.energy = Number(energyInput.value); state.presetId = "custom"; render(); });
    baselineInput.addEventListener("input", function () { state.baseline = Number(baselineInput.value); state.presetId = "custom"; render(); });
    coherenceInput.addEventListener("input", function () { state.coherence = Number(coherenceInput.value); state.presetId = "custom"; render(); });
    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) {
        var missingMessage = "请先完成全部预测，再揭晓。";
        refs.feedback.textContent = missingMessage;
        refs.feedback.className = "pnu-feedback pnu-warn";
        announce(api, root, missingMessage);
        return;
      }
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      state.revealed = true;
      var message = "已揭晓：" + correct + "/" + questions.length + " 命中。现在可调节 L/E 与相干长度。";
      refs.feedback.textContent = message;
      refs.feedback.className = "pnu-feedback " + (correct === questions.length ? "pnu-pass" : "pnu-warn");
      render();
      announce(api, root, message);
    });
    reset.addEventListener("click", function () {
      state.presetId = "atmospheric";
      state.theta = 33;
      state.dm2 = 0.0025;
      state.energy = 1;
      state.baseline = 500;
      state.coherence = 1000;
      state.revealed = false;
      state.predictions = {};
      form.querySelectorAll("input[type=radio]").forEach(function (radio) { radio.checked = false; });
      refs.feedback.textContent = "";
      render();
      announce(api, root, "中微子振荡预测已重置。");
    });
    render();
  }

  return {
    PRESETS: PRESETS,
    DM2_REF: DM2_REF,
    E_REF: E_REF,
    normalize: normalize,
    phase: phase,
    effectiveCoherenceLength: effectiveCoherenceLength,
    maximumBaseline: maximumBaseline,
    analyze: analyze,
    curve: curve,
    mount: mount,
    selfTest: selfTest
  };
});
