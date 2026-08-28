(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-nuclear-decay", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-nuclear-decay self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-nuclear-decay self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-nuclear-decay-styles";
  var STYLE_TEXT = [
    ".pnd-lab{--pnd-blue:var(--cl-blue,#315f9d);--pnd-green:var(--cl-green,#39734d);--pnd-gold:var(--cl-gold,#9b6a12);--pnd-red:var(--cl-red,#b64335);color:var(--fg);line-height:1.55;max-width:100%;min-width:0;overflow-wrap:anywhere}",
    ".pnd-lab *,.pnd-lab *::before,.pnd-lab *::after{box-sizing:border-box}.pnd-lab [hidden]{display:none!important}.pnd-lab h3,.pnd-lab h4{margin:0;letter-spacing:0}.pnd-lab h3{font-size:1.15rem}.pnd-lab p{margin:.65em 0}.pnd-lab button,.pnd-lab input,.pnd-lab select{font:inherit;letter-spacing:0}.pnd-lab button,.pnd-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pnd-lab button:hover{border-color:var(--pnd-blue)}.pnd-lab button:focus-visible,.pnd-lab input:focus-visible,.pnd-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pnd-lab button[aria-pressed=true],.pnd-lab .pnd-primary{background:var(--pnd-blue);border-color:var(--pnd-blue);color:var(--bg);font-weight:750}.pnd-note,.pnd-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.pnd-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pnd-gold);background:var(--block-bg,var(--bg))}.pnd-question{margin:0 0 12px;padding:0;border:0}.pnd-question:last-of-type{margin-bottom:0}.pnd-question legend{max-width:100%;margin-bottom:7px;font-size:13px;font-weight:750;line-height:1.5}.pnd-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pnd-choices button{font-size:12px}.pnd-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.pnd-actions>*{flex:1 1 170px}.pnd-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pnd-pass{color:var(--pnd-green)}.pnd-warn{color:var(--pnd-red)}.pnd-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pnd-modes{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}.pnd-modes button{flex:1 1 150px}.pnd-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0;align-items:end}.pnd-control{display:grid;gap:5px;min-width:0}.pnd-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.pnd-control output{color:var(--pnd-blue);font-variant-numeric:tabular-nums}.pnd-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--pnd-blue)}.pnd-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}.pnd-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pnd-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--fg-soft);font-size:13px}.pnd-stage svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.pnd-stage svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pnd-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.65}.pnd-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.14}.pnd-curve{fill:none;stroke:var(--pnd-blue);stroke-width:2.7}.pnd-secondary{fill:none;stroke:var(--pnd-gold);stroke-width:2.2;stroke-dasharray:6 4}.pnd-marker{fill:var(--pnd-red);stroke:var(--bg);stroke-width:1.5}.pnd-bar{fill:var(--pnd-green);fill-opacity:.76}.pnd-label{font-size:11px;fill:var(--fg-soft)}.pnd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.pnd-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.pnd-metric:nth-child(4n+1){border-color:var(--pnd-blue)}.pnd-metric:nth-child(4n+2){border-color:var(--pnd-gold)}.pnd-metric:nth-child(4n+3){border-color:var(--pnd-green)}.pnd-metric:nth-child(4n+4){border-color:var(--pnd-red)}.pnd-metric span{display:block;color:var(--fg-soft);font-size:11px}.pnd-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pnd-formula{margin:12px 0 0;padding:9px 11px;border-left:3px solid var(--pnd-blue);background:var(--bg);font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65;overflow-x:auto}.pnd-reset{margin-top:10px;color:var(--fg-soft)}@media(max-width:900px){.pnd-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.pnd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.pnd-choices{grid-template-columns:minmax(0,1fr)}.pnd-controls,.pnd-metrics{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.pnd-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  var PRESETS = [
    { id: "fe56", label: "⁵⁶Fe：结构", A: 56, Z: 26, halfLife: 1, unit: "教学选择" },
    { id: "u238", label: "²³⁸U：α 衰变", A: 238, Z: 92, halfLife: 4.468e9, unit: "年" },
    { id: "c14", label: "¹⁴C：β 衰变", A: 14, Z: 6, halfLife: 5730, unit: "年" },
    { id: "i131", label: "¹³¹I：β 衰变", A: 131, Z: 53, halfLife: 8.02, unit: "日" }
  ];
  var COEFFICIENTS = { volume: 15.75, surface: 17.8, coulomb: 0.711, asymmetry: 23.0, pairing: 11.2 };
  var ALPHA_BINDING_ENERGY = 28.2957;
  var ID_SERIAL = 0;

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function uniqueId(prefix) { ID_SERIAL += 1; return prefix + "-" + ID_SERIAL; }
  function finite(value, fallback) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    var text = Math.abs(value) > 0 && Math.abs(value) < 0.001 ? value.toExponential(Math.min(places, 4)) : value.toFixed(places);
    return text.indexOf(".") < 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function appendChildren(node, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }
  function element(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElement(tag), attrs), children); }
  function svgElement(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function installStyles(doc) {
    if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }
  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "pnd-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }
  function presetById(id) { return PRESETS.filter(function (preset) { return preset.id === id; })[0] || PRESETS[0]; }

  function validateNuclide(A, Z) {
    var mass = Number(A);
    var protons = Number(Z);
    if (!Number.isFinite(mass) || Math.round(mass) !== mass || mass < 1) throw new RangeError("A must be a positive integer");
    if (!Number.isFinite(protons) || Math.round(protons) !== protons || protons < 0 || protons > mass) throw new RangeError("Z must be an integer with 0 <= Z <= A");
    return { A: mass, Z: protons };
  }

  function pairingTerm(A, Z) {
    if (A % 2 === 1) return 0;
    return Z % 2 === 0 && (A - Z) % 2 === 0 ? COEFFICIENTS.pairing / Math.sqrt(A) : -COEFFICIENTS.pairing / Math.sqrt(A);
  }

  function binding(A, Z) {
    var nuclide = validateNuclide(A, Z);
    var mass = nuclide.A;
    var protons = nuclide.Z;
    var asymmetry = mass - 2 * protons;
    var volume = COEFFICIENTS.volume * mass;
    var surface = COEFFICIENTS.surface * Math.pow(mass, 2 / 3);
    var coulomb = COEFFICIENTS.coulomb * protons * Math.max(0, protons - 1) / Math.pow(mass, 1 / 3);
    var asymmetryTerm = COEFFICIENTS.asymmetry * asymmetry * asymmetry / mass;
    var pairing = pairingTerm(mass, protons);
    var total = volume - surface - coulomb - asymmetryTerm + pairing;
    return { A: mass, Z: protons, N: mass - protons, volume: volume, surface: surface, coulomb: coulomb, asymmetry: asymmetryTerm, pairing: pairing, total: total, perNucleon: total / mass };
  }

  function alphaQ(A, Z) {
    var parentNuclide = validateNuclide(A, Z);
    if (parentNuclide.A <= 4 || parentNuclide.Z < 2) throw new RangeError("alpha decay requires A > 4 and Z >= 2");
    var daughterNuclide = validateNuclide(parentNuclide.A - 4, parentNuclide.Z - 2);
    var parent = binding(parentNuclide.A, parentNuclide.Z);
    var daughter = binding(daughterNuclide.A, daughterNuclide.Z);
    return daughter.total + ALPHA_BINDING_ENERGY - parent.total;
  }

  function alphaBindingEnergy() { return ALPHA_BINDING_ENERGY; }

  function stableZ(A) {
    var mass = Math.max(4, finite(A, 56));
    return clamp(Math.round(mass / (2 + 0.015 * Math.pow(mass, 2 / 3))), 1, mass - 1);
  }

  function decayFraction(timeInHalfLives) {
    var ratio = Math.max(0, finite(timeInHalfLives, 0));
    return Math.pow(2, -ratio);
  }

  function decayLedger(presetId, ratio) {
    var preset = presetById(presetId);
    var timeRatio = Math.max(0, finite(ratio, 1));
    var fraction = decayFraction(timeRatio);
    return { preset: preset, ratio: timeRatio, fraction: fraction, decayConstantPerHalfLife: Math.log(2), activityRatio: fraction };
  }

  function initialState() {
    return { mode: "structure", A: 56, Z: 26, preset: "u238", timeRatio: 1, predictions: [null, null, null, null], revealed: false };
  }

  function resetState(state) {
    var target = state || {};
    var defaults = initialState();
    Object.keys(defaults).forEach(function (key) { target[key] = Array.isArray(defaults[key]) ? defaults[key].slice() : defaults[key]; });
    return target;
  }

  function makeRange(doc, parent, label, key, min, max, step, digits, suffix, state, onInput) {
    var inputId = uniqueId("pnd-" + key);
    var output = element(doc, "output", { for: inputId, text: format(state[key], digits) + suffix });
    var input = element(doc, "input", { id: inputId, type: "range", min: min, max: max, step: step, value: state[key], "aria-label": label });
    input.addEventListener("input", function () { state[key] = Number(input.value); output.textContent = format(state[key], digits) + suffix; onInput(); });
    var maxScale = element(doc, "span", { text: String(max) + suffix });
    parent.appendChild(element(doc, "div", { className: "pnd-control" }, [element(doc, "label", { "for": inputId, text: label }), output, input, element(doc, "div", { className: "pnd-scale" }, [element(doc, "span", { text: String(min) + suffix }), maxScale])]));
    return { key: key, input: input, output: output, digits: digits, suffix: suffix, maxScale: maxScale };
  }

  function drawChart(doc, chart, mode, state) {
    clear(chart);
    chart.appendChild(svgElement(doc, "title", { text: mode === "structure" ? "半经验质量公式的结合能曲线" : "半衰期衰变曲线" }));
    chart.appendChild(svgElement(doc, "desc", { text: "结构图显示稳定线附近的每核子结合能，衰变图显示剩余比例随半衰期数下降。" }));
    var left = 52;
    var right = 638;
    var top = 34;
    var bottom = 274;
    function line(x1, y1, x2, y2, className) { chart.appendChild(svgElement(doc, "line", { class: className || "pnd-axis", x1: x1, y1: y1, x2: x2, y2: y2 })); }
    function text(x, y, value, attrs) { chart.appendChild(svgElement(doc, "text", Object.assign({ class: "pnd-label", x: x, y: y }, attrs || {}), [value])); }
    if (mode === "structure") {
      function sx(A) { return left + (A - 4) / 236 * (right - left); }
      function sy(value) { return bottom - (value - 2) / 7.5 * (bottom - top); }
      line(left, bottom, right, bottom, "pnd-axis");
      line(left, sy(8), right, sy(8), "pnd-grid");
      var points = [];
      for (var i = 4; i <= 240; i += 2) points.push(sx(i).toFixed(1) + "," + sy(binding(i, stableZ(i)).perNucleon).toFixed(1));
      chart.appendChild(svgElement(doc, "polyline", { class: "pnd-curve", points: points.join(" ") }));
      var selected = binding(state.A, state.Z);
      chart.appendChild(svgElement(doc, "circle", { class: "pnd-marker", cx: sx(selected.A), cy: sy(selected.perNucleon), r: 5 }));
      text(left, top - 8, "蓝：Z≈稳定线；红点：当前核");
      text(right, bottom + 20, "A", { "text-anchor": "end" });
      text(left + 6, sy(selected.perNucleon) - 9, "B/A=" + format(selected.perNucleon, 2) + " MeV");
      text(right - 8, sy(8) - 8, "8 MeV 参考线", { "text-anchor": "end" });
    } else {
      function sxT(ratio) { return left + ratio / 5 * (right - left); }
      function syT(value) { return bottom - value * (bottom - top); }
      var decay = decayLedger(state.preset, state.timeRatio);
      line(left, bottom, right, bottom, "pnd-axis");
      line(left, syT(0.5), right, syT(0.5), "pnd-grid");
      var decayPoints = [];
      for (var j = 0; j <= 100; j += 1) decayPoints.push(sxT(5 * j / 100).toFixed(1) + "," + syT(decayFraction(5 * j / 100)).toFixed(1));
      chart.appendChild(svgElement(doc, "polyline", { class: "pnd-curve", points: decayPoints.join(" ") }));
      line(sxT(state.timeRatio), top, sxT(state.timeRatio), bottom, "pnd-secondary");
      chart.appendChild(svgElement(doc, "circle", { class: "pnd-marker", cx: sxT(Math.min(5, state.timeRatio)), cy: syT(decay.fraction), r: 5 }));
      text(left, top - 8, "N/N₀=2⁻ᵗ/ᵀ¹ᐟ²；蓝：剩余核", {});
      text(right, bottom + 20, "t/T₁/₂", { "text-anchor": "end" });
      text(left + 6, syT(decay.fraction) - 9, "剩余=" + format(decay.fraction * 100, 1) + "%");
      text(right - 8, syT(0.5) - 8, "一个半衰期=50%", { "text-anchor": "end" });
    }
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    root.classList.add("pnd-lab");
    clear(root);
    var state = initialState();
    var questions = [
      { prompt: "半衰期后剩余原子数是多少？", options: ["1/2", "1/4", "0"], answer: 0 },
      { prompt: "α 衰变的核素变化？", options: ["A−4、Z−2", "A−2、Z−1", "A 不变、Z+1"], answer: 0 },
      { prompt: "B/A 最大就自动保证核素立刻稳定吗？", options: ["是，结合能足够就没有衰变", "不是，还要看守恒、量子选择和势垒", "只取决于半衰期单位"], answer: 1 },
      { prompt: "A 固定时把 Z 偏离稳定线，半经验式的非对称项会怎样？", options: ["增加结合", "减小结合", "完全不变"], answer: 1 }
    ];
    root.appendChild(element(doc, "h3", { text: "预测闸门：结合能账本与随机衰变不是同一件事" }));
    root.appendChild(element(doc, "p", { className: "pnd-note", text: "先预测半衰期、α 衰变的核子账和稳定线；揭示后可在结构与衰变视图之间切换。α Q 使用实测 α 粒子结合能 Bα=28.2957 MeV，半经验式只用于母核和子核。" }));
    var prediction = element(doc, "div", { className: "pnd-prediction" });
    var choiceButtons = [];
    questions.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset", { className: "pnd-question" });
      fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
      var choices = element(doc, "div", { className: "pnd-choices" });
      choiceButtons[questionIndex] = [];
      question.options.forEach(function (label, optionIndex) {
        var button = element(doc, "button", { type: "button", text: label, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[questionIndex] = optionIndex; choiceButtons[questionIndex].forEach(function (item) { item.setAttribute("aria-pressed", "false"); }); button.setAttribute("aria-pressed", "true"); });
        choiceButtons[questionIndex].push(button);
        choices.appendChild(button);
      });
      fieldset.appendChild(choices);
      prediction.appendChild(fieldset);
    });
    var feedback = element(doc, "p", { className: "pnd-feedback", "aria-live": "polite" });
    var actions = element(doc, "div", { className: "pnd-actions" });
    var reveal = element(doc, "button", { type: "button", className: "pnd-primary", text: "揭示核账本" });
    var clearPredictions = element(doc, "button", { type: "button", text: "清空预测" });
    actions.appendChild(reveal); actions.appendChild(clearPredictions); prediction.appendChild(actions); prediction.appendChild(feedback); root.appendChild(prediction);

    var revealed = element(doc, "div", { className: "pnd-revealed", hidden: true });
    revealed.appendChild(element(doc, "h4", { text: "核结构与衰变 ledger" }));
    var modes = element(doc, "div", { className: "pnd-modes", role: "group", "aria-label": "选择核物理视图" });
    var modeButtons = {};
    [["structure", "结构：结合能"], ["decay", "衰变：半衰期"]].forEach(function (item) {
      var button = element(doc, "button", { type: "button", text: item[1], "aria-pressed": item[0] === state.mode ? "true" : "false" });
      button.addEventListener("click", function () { state.mode = item[0]; Object.keys(modeButtons).forEach(function (key) { modeButtons[key].setAttribute("aria-pressed", key === state.mode ? "true" : "false"); }); panels.structure.hidden = state.mode !== "structure"; panels.decay.hidden = state.mode !== "decay"; render(); });
      modeButtons[item[0]] = button; modes.appendChild(button);
    });
    revealed.appendChild(modes);
    var panels = { structure: element(doc, "div", { className: "pnd-panel" }), decay: element(doc, "div", { className: "pnd-panel", hidden: true }) };
    var rangeControls = {};
    var zControl;
    rangeControls.A = makeRange(doc, panels.structure, "质量数 A", "A", 8, 240, 1, 0, "", state, function () {
      if (state.Z > state.A) state.Z = state.A;
      updateZBounds();
      render();
    });
    zControl = rangeControls.Z = makeRange(doc, panels.structure, "质子数 Z", "Z", 2, state.A, 1, 0, "", state, render);
    var decaySelectId = uniqueId("pnd-decay-select");
    var decaySelect = element(doc, "select", { id: decaySelectId, "aria-label": "选择核素" });
    PRESETS.slice(1).forEach(function (preset) { decaySelect.appendChild(element(doc, "option", { value: preset.id, text: preset.label })); });
    decaySelect.value = state.preset;
    decaySelect.addEventListener("change", function () { state.preset = decaySelect.value; render(); });
    panels.decay.appendChild(element(doc, "div", { className: "pnd-control" }, [element(doc, "label", { "for": decaySelectId, text: "选择核素" }), decaySelect]));
    rangeControls.timeRatio = makeRange(doc, panels.decay, "经过的半衰期数 t/T₁/₂", "timeRatio", 0, 5, 0.05, 2, "", state, render);
    revealed.appendChild(panels.structure); revealed.appendChild(panels.decay);
    var stage = element(doc, "div", { className: "pnd-stage" });
    var stageTitle = element(doc, "div", { className: "pnd-stage-title" }, [element(doc, "span", { text: "公式直接生成的教学读数" }), element(doc, "span", { className: "pnd-status", text: "" })]);
    var chart = svgElement(doc, "svg", { viewBox: "0 0 680 320", role: "img", "aria-label": "核结构和衰变可视化" });
    stage.appendChild(stageTitle); stage.appendChild(chart); revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "pnd-metrics" });
    var metricNodes = [metric(doc, "总结合能"), metric(doc, "每核子结合能"), metric(doc, "α 衰变 Q"), metric(doc, "当前衰变读数")];
    metricNodes.forEach(function (item) { metrics.appendChild(item.node); });
    revealed.appendChild(metrics);
    var formula = element(doc, "div", { className: "pnd-formula", text: "B=半经验质量公式；Qα=B(A−4,Z−2)+28.2957−B(A,Z)；N/N₀=2⁻ᵗ/ᵀ¹ᐟ²" });
    revealed.appendChild(formula);
    var reset = element(doc, "button", { type: "button", className: "pnd-reset", text: "重置实验" });
    revealed.appendChild(reset); root.appendChild(revealed);

    function updateZBounds() {
      zControl.input.max = state.A;
      zControl.maxScale.textContent = String(state.A);
    }

    function syncControls() {
      updateZBounds();
      Object.keys(rangeControls).forEach(function (key) {
        var control = rangeControls[key];
        control.input.value = state[control.key];
        control.output.textContent = format(state[control.key], control.digits) + control.suffix;
      });
      decaySelect.value = state.preset;
      Object.keys(modeButtons).forEach(function (key) { modeButtons[key].setAttribute("aria-pressed", key === state.mode ? "true" : "false"); });
      panels.structure.hidden = state.mode !== "structure";
      panels.decay.hidden = state.mode !== "decay";
      revealed.hidden = !state.revealed;
    }

    function render() {
      syncControls();
      var structure = binding(state.A, state.Z);
      var decay = decayLedger(state.preset, state.timeRatio);
      var q = alphaQ(state.A, state.Z);
      metricNodes[0].value.textContent = format(structure.total, 2) + " MeV";
      metricNodes[1].value.textContent = format(structure.perNucleon, 3) + " MeV/核子";
      metricNodes[2].value.textContent = Number.isFinite(q) ? format(q, 2) + " MeV" : "不可定义";
      metricNodes[3].value.textContent = format(decay.fraction * 100, 1) + "%（" + format(decay.ratio, 2) + " T₁/₂）";
      stageTitle.querySelector(".pnd-status").textContent = state.mode === "structure" ? (structure.Z === stableZ(structure.A) ? "接近稳定线" : "非对称项在惩罚") : "统计平均的衰变律";
      formula.textContent = state.mode === "structure" ? "B=" + format(structure.total, 2) + " MeV；B/A=" + format(structure.perNucleon, 3) + " MeV/核子；Qα=" + format(q, 2) + " MeV（Bα=28.2957 MeV 实测）" : "N/N₀=2⁻ᵗ/ᵀ¹ᐟ²=" + format(decay.fraction, 5) + "；λT₁/₂=ln2";
      drawChart(doc, chart, state.mode, state);
    }
    reveal.addEventListener("click", function () {
      if (state.predictions.some(function (value) { return value === null; })) { feedback.className = "pnd-feedback pnd-warn"; feedback.textContent = "请先完成四个预测，再揭示核账本。"; return; }
      var score = state.predictions.reduce(function (sum, value, index) { return sum + (value === questions[index].answer ? 1 : 0); }, 0);
      feedback.className = "pnd-feedback " + (score === questions.length ? "pnd-pass" : "pnd-warn");
      feedback.textContent = "预测命中 " + score + "/" + questions.length + "；现在比较结构能量与时间统计。";
      state.revealed = true; render(); announce(api, root, feedback.textContent);
    });
    clearPredictions.addEventListener("click", function () { state.predictions = [null, null, null, null]; choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "pnd-feedback"; feedback.textContent = "预测已清空。"; });
    reset.addEventListener("click", function () { resetState(state); choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "pnd-feedback"; feedback.textContent = "实验已重置并上锁。"; render(); announce(api, root, "核结构与衰变实验已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) { checks += 1; if (!condition) throw new Error("physics-nuclear-decay self-test failed: " + message); }
    function close(left, right, tolerance, message) { assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")"); }
    var iron = binding(56, 26);
    assert(iron.total > 400 && iron.perNucleon > 7, "iron binding scale");
    assert(binding(56, stableZ(56)).perNucleon >= binding(56, 20).perNucleon, "asymmetry penalty near stability");
    close(decayFraction(0), 1, 1e-12, "zero-time fraction");
    close(decayFraction(1), 0.5, 1e-12, "one half-life fraction");
    close(decayFraction(2), 0.25, 1e-12, "two half-lives fraction");
    close(alphaBindingEnergy(), 28.2957, 1e-12, "measured alpha binding energy");
    assert(alphaQ(238, 92) > 0 && Number.isFinite(alphaQ(238, 92)), "alpha Q is positive for uranium");
    var invalidSelection = false;
    try { binding(10, 11); } catch (error) { invalidSelection = error instanceof RangeError; }
    assert(invalidSelection, "invalid Z must be rejected");
    var invalidDaughter = false;
    try { alphaQ(5, 5); } catch (error) { invalidDaughter = error instanceof RangeError; }
    assert(invalidDaughter, "invalid alpha daughter must be rejected");
    assert(decayLedger("u238", 1).preset.halfLife === 4.468e9, "preset half-life");
    assert(stableZ(56) >= 24 && stableZ(56) <= 27, "stability-line estimate");
    var reset = initialState(); reset.mode = "decay"; reset.A = 120; reset.Z = 90; reset.predictions[0] = 1; reset.revealed = true; resetState(reset);
    assert(reset.mode === "structure" && reset.A === 56 && reset.Z === 26 && reset.predictions.every(function (value) { return value === null; }) && reset.revealed === false, "pure reset state");
    return { checks: checks, presets: PRESETS.length };
  }

  return { PRESETS: PRESETS, binding: binding, alphaQ: alphaQ, alphaBindingEnergy: alphaBindingEnergy, validateNuclide: validateNuclide, stableZ: stableZ, decayFraction: decayFraction, decayLedger: decayLedger, initialState: initialState, resetState: resetState, mount: mount, selfTest: selfTest };
});
