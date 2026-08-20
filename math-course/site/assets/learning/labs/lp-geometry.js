(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("lp-geometry", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("lp-geometry self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("lp-geometry self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "lp-geometry-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var CURVE_P = [1, 2, 4, 8, Infinity];

  var PRESETS = [
    {
      id: "generic",
      label: "一般向量",
      values: [1, 2, 4],
      partner: [2, 1, 3],
      note: "默认比较：两条向量没有特殊等号结构。"
    },
    {
      id: "holder-equality",
      label: "Hölder 等号",
      values: [1, 2, 0],
      partner: [1, 2, 0],
      note: "p=q=2 时两向量同向，Cauchy--Schwarz 取等。"
    },
    {
      id: "minkowski-equality",
      label: "Minkowski 等号",
      values: [1, 2, 0],
      partner: [2, 4, 0],
      note: "第二向量是第一向量的非负倍数，三角不等式取等。"
    },
    {
      id: "counting-counterexample",
      label: "计数反例",
      values: [1, 1, 1],
      partner: [1, -1, 0],
      note: "常数向量暴露未归一化计数测度的维数因子。"
    }
  ];

  var STYLE_TEXT = [
    ".lp-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere;}",
    ".lp-lab *,.lp-lab *::before,.lp-lab *::after{box-sizing:border-box}.lp-lab [hidden]{display:none!important}",
    ".lp-lab h3,.lp-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.lp-lab h3{font-size:1.12rem}.lp-lab h4{margin-top:15px;font-size:1rem}",
    ".lp-lab p{margin:8px 0}.lp-lab .lp-intro,.lp-lab .lp-note,.lp-lab .lp-feedback{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
    ".lp-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.lp-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}",
    ".lp-lab .lp-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.lp-lab button,.lp-lab select{font:inherit}",
    ".lp-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}",
    ".lp-lab button:hover{border-color:var(--accent,#1769aa)}.lp-lab button:focus-visible,.lp-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.lp-lab button[aria-pressed=true],.lp-lab button.lp-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.lp-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".lp-lab .lp-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.lp-lab .lp-actions>*{flex:1 1 170px}.lp-lab .lp-feedback{min-height:2em;margin:8px 0;font-weight:700}.lp-lab .lp-pass{color:var(--cl-green,#2f7547)}.lp-lab .lp-warn{color:var(--cl-red,#b43d32)}",
    ".lp-lab .lp-layout{display:grid;grid-template-columns:minmax(210px,.62fr) minmax(0,1.38fr);gap:14px;align-items:start}.lp-lab .lp-controls,.lp-lab .lp-results{min-width:0}.lp-lab .lp-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff)}.lp-lab .lp-control{display:grid;gap:5px}.lp-lab .lp-control label{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.lp-lab .lp-control select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b)}.lp-lab .lp-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.lp-lab .lp-presets button{font-size:12px}",
    ".lp-lab .lp-stage{min-width:0;padding:7px;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.lp-lab .lp-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b)}.lp-lab .lp-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.lp-lab .lp-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.65}.lp-lab .lp-grid{stroke:var(--border,#c8cdd3);stroke-width:1;stroke-opacity:.75}.lp-lab .lp-prob{stroke:var(--cl-blue,#2c6aa0);fill:var(--cl-blue,#2c6aa0)}.lp-lab .lp-count{stroke:var(--cl-gold,#95670d);fill:var(--cl-gold,#95670d)}.lp-lab .lp-vector-f{fill:var(--cl-green,#347247)}.lp-lab .lp-vector-g{fill:var(--cl-red,#b13d32)}.lp-lab .lp-line{fill:none;stroke-width:2.5}.lp-lab .lp-dot{stroke:var(--bg,#fff);stroke-width:2}.lp-lab .lp-label{font-size:10.5px}.lp-lab .lp-title{font-size:12px;font-weight:800;text-anchor:middle}",
    ".lp-lab .lp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:11px 0}.lp-lab .lp-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--bg,#fff)}.lp-lab .lp-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.lp-lab .lp-metric:nth-child(4n+2){border-color:var(--cl-gold,#95670d)}.lp-lab .lp-metric:nth-child(4n+3){border-color:var(--cl-green,#347247)}.lp-lab .lp-metric:nth-child(4n){border-color:var(--cl-red,#b13d32)}.lp-lab .lp-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px}.lp-lab .lp-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".lp-lab .lp-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.lp-lab table{width:100%;min-width:610px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.lp-lab th,.lp-lab td{padding:7px 7px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.lp-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.lp-lab .lp-checks{display:grid;gap:6px;margin:10px 0 0;padding:0;list-style:none}.lp-lab .lp-checks li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:6px;align-items:start}.lp-lab .lp-check{font-weight:800}.lp-lab .lp-check-pass{color:var(--cl-green,#2f7547)}.lp-lab .lp-check-fail{color:var(--cl-red,#b43d32)}.lp-lab .lp-interpretation{margin-top:10px;padding:9px 11px;border-left:3px solid var(--cl-green,#347247);background:var(--block-bg,var(--bg,#fff));color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;line-height:1.65}",
    "@media(max-width:850px){.lp-lab .lp-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){.lp-lab .lp-choice-grid{grid-template-columns:minmax(0,1fr)}.lp-lab .lp-presets{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){.lp-lab .lp-stage{padding:4px}.lp-lab table{font-size:11.5px}.lp-lab th,.lp-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.lp-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function normalizeP(value) {
    if (value === Infinity || value === "inf" || value === "infinity") return Infinity;
    var p = Number(value);
    if (!finite(p) || p < 1) throw new RangeError("p must be >= 1 or infinity");
    return p;
  }

  function copy(values) {
    return values.slice();
  }

  function validateVector(values, name) {
    if (!Array.isArray(values) || !values.length) throw new TypeError(name + " must be a nonempty array");
    values.forEach(function (value, index) {
      if (!finite(Number(value))) throw new TypeError(name + "[" + index + "] must be finite");
    });
  }

  function measureWeights(length, measure) {
    if (measure !== "probability" && measure !== "counting") {
      throw new RangeError("measure must be probability or counting");
    }
    var weight = measure === "probability" ? 1 / length : 1;
    return Array.apply(null, Array(length)).map(function () { return weight; });
  }

  function lpNorm(values, measure, p) {
    validateVector(values, "values");
    p = normalizeP(p);
    var weights = measureWeights(values.length, measure);
    if (p === Infinity) return Math.max.apply(null, values.map(function (value) { return Math.abs(Number(value)); }));
    var sum = values.reduce(function (total, value, index) {
      return total + weights[index] * Math.pow(Math.abs(Number(value)), p);
    }, 0);
    return Math.pow(sum, 1 / p);
  }

  function conjugate(p) {
    p = normalizeP(p);
    return p === 1 ? Infinity : p === Infinity ? 1 : p / (p - 1);
  }

  function weightedAbsoluteProduct(values, partner, measure) {
    validateVector(values, "values");
    validateVector(partner, "partner");
    if (values.length !== partner.length) throw new RangeError("vectors must have the same length");
    var weights = measureWeights(values.length, measure);
    return values.reduce(function (total, value, index) {
      return total + weights[index] * Math.abs(Number(value) * Number(partner[index]));
    }, 0);
  }

  function holder(values, partner, measure, p) {
    p = normalizeP(p);
    var q = conjugate(p);
    var left = weightedAbsoluteProduct(values, partner, measure);
    var right = lpNorm(values, measure, p) * lpNorm(partner, measure, q);
    return {
      p: p,
      q: q,
      left: left,
      right: right,
      gap: Math.max(0, right - left),
      equality: Math.abs(right - left) <= EPS * Math.max(1, Math.abs(right), Math.abs(left))
    };
  }

  function minkowski(values, partner, measure, p) {
    p = normalizeP(p);
    validateVector(values, "values");
    validateVector(partner, "partner");
    if (values.length !== partner.length) throw new RangeError("vectors must have the same length");
    var sumVector = values.map(function (value, index) { return Number(value) + Number(partner[index]); });
    var left = lpNorm(sumVector, measure, p);
    var right = lpNorm(values, measure, p) + lpNorm(partner, measure, p);
    return {
      p: p,
      left: left,
      right: right,
      gap: Math.max(0, right - left),
      equality: Math.abs(right - left) <= EPS * Math.max(1, Math.abs(right), Math.abs(left))
    };
  }

  function presetById(id) {
    return PRESETS.reduce(function (found, preset) { return found || (preset.id === id ? preset : null); }, null);
  }

  function trend(values, measure) {
    var curve = CURVE_P.map(function (p) { return lpNorm(values, measure, p); });
    var increasing = true;
    var decreasing = true;
    for (var index = 1; index < curve.length; index += 1) {
      increasing = increasing && curve[index] + EPS >= curve[index - 1];
      decreasing = decreasing && curve[index] <= curve[index - 1] + EPS;
    }
    return { values: curve, increasing: increasing, decreasing: decreasing };
  }

  function compute(input) {
    input = input || {};
    var values = copy(input.values || PRESETS[0].values);
    var partner = copy(input.partner || PRESETS[0].partner);
    validateVector(values, "values");
    validateVector(partner, "partner");
    if (values.length !== partner.length) throw new RangeError("vectors must have the same length");
    var measure = input.measure || "probability";
    var p = normalizeP(input.p === undefined ? 2 : input.p);
    var q = conjugate(p);
    var probability = trend(values, "probability");
    var counting = trend(values, "counting");
    var probabilityNorm = lpNorm(values, "probability", p);
    var countingNorm = lpNorm(values, "counting", p);
    var holderResult = holder(values, partner, measure, p);
    var minkowskiResult = minkowski(values, partner, measure, p);
    var dimensionFactor = p === Infinity ? 1 : Math.pow(values.length, 1 / p);
    return {
      values: values,
      partner: partner,
      measure: measure,
      p: p,
      q: q,
      n: values.length,
      norm: measure === "probability" ? probabilityNorm : countingNorm,
      probabilityNorm: probabilityNorm,
      countingNorm: countingNorm,
      infinityNorm: lpNorm(values, measure, Infinity),
      dimensionFactor: dimensionFactor,
      countToProbability: countingNorm / probabilityNorm,
      holder: holderResult,
      minkowski: minkowskiResult,
      curve: CURVE_P.map(function (curveP, index) {
        return { p: curveP, probability: probability.values[index], counting: counting.values[index] };
      }),
      probabilityIncreasing: probability.increasing,
      countingDecreasing: counting.decreasing,
      probabilityTrend: probability,
      countingTrend: counting
    };
  }

  function near(a, b, tolerance) {
    if (a === b) return true;
    if (!finite(a) || !finite(b)) return false;
    return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function assert(condition, message) {
    if (!condition) throw new Error("lp-geometry self-test failed: " + message);
  }

  function selfTest() {
    var checks = 0;
    var vector = [1, 2, 4];
    var partner = [2, 1, 3];
    var probabilityP2 = lpNorm(vector, "probability", 2);
    var countingP2 = lpNorm(vector, "counting", 2);
    checks += 8;
    assert(near(probabilityP2, Math.sqrt(7)), "probability L2");
    assert(near(countingP2, Math.sqrt(21)), "counting L2");
    assert(near(countingP2 / probabilityP2, Math.sqrt(3)), "dimension factor");
    assert(near(lpNorm(vector, "probability", Infinity), 4), "probability endpoint");
    assert(near(lpNorm(vector, "counting", Infinity), 4), "counting endpoint");
    assert(near(conjugate(1), Infinity) && near(conjugate(2), 2), "finite conjugates");
    assert(conjugate(Infinity) === 1, "infinite conjugate");
    assert(compute({ values: vector, partner: partner, measure: "probability", p: 2 }).probabilityIncreasing, "probability monotonicity");

    ["probability", "counting"].forEach(function (measure) {
      [1, 2, 4, Infinity].forEach(function (p) {
        var result = compute({ values: vector, partner: partner, measure: measure, p: p });
        checks += 4;
        assert(result.holder.gap >= -EPS, measure + " Holder bound");
        assert(result.minkowski.gap >= -EPS, measure + " Minkowski bound");
        assert(near(result.countToProbability, result.dimensionFactor), measure + " normalization relation");
        assert(near(result.infinityNorm, 4), measure + " infinity limit");
      });
    });
    var holderEquality = compute({ values: [1, 2, 0], partner: [1, 2, 0], measure: "probability", p: 2 });
    var minkowskiEquality = compute({ values: [1, 2, 0], partner: [2, 4, 0], measure: "counting", p: 4 });
    var counterexample = compute({ values: [1, 1, 1], partner: [1, -1, 0], measure: "counting", p: 1 });
    checks += 6;
    assert(holderEquality.holder.equality, "Holder equality preset");
    assert(minkowskiEquality.minkowski.equality, "Minkowski equality preset");
    assert(counterexample.countingTrend.decreasing, "counting trend counterexample");
    assert(counterexample.probabilityTrend.increasing, "probability normalized trend");
    assert(near(counterexample.curve[0].counting, 3) && near(counterexample.curve[4].counting, 1), "constant counting endpoint");
    assert(near(counterexample.curve[0].probability, 1) && near(counterexample.curve[4].probability, 1), "constant probability endpoint");

    var rejected = 0;
    [
      function () { lpNorm([], "probability", 2); },
      function () { lpNorm([1], "bad", 2); },
      function () { lpNorm([1], "probability", 0); },
      function () { compute({ values: [1], partner: [1, 2], p: 2 }); },
      function () { compute({ values: [NaN], partner: [1], p: 2 }); }
    ].forEach(function (attempt) {
      try { attempt(); } catch (error) { rejected += 1; }
    });
    checks += 1;
    assert(rejected === 5, "illegal inputs rejected");
    return { checks: checks, presets: PRESETS.length };
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function makeElement(api, doc, tag, attrs, children) {
    return appendChildren(setAttributes(api && typeof api.el === "function" ? api.el(tag, attrs || {}) : doc.createElement(tag), attrs && api && typeof api.el === "function" ? {} : attrs), children);
  }

  function makeSvg(api, doc, tag, attrs, children) {
    var node = api && typeof api.svg === "function" ? api.svg(tag, attrs || {}) : doc.createElementNS(SVG_NS, tag);
    if (!(api && typeof api.svg === "function")) setAttributes(node, attrs || {});
    return appendChildren(node, children);
  }

  function replaceChildren(node, children) {
    if (node && typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    while (node && node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children);
  }

  function formatNumber(api, value, digits) {
    if (value === Infinity) return "∞";
    if (!finite(value)) return "—";
    if (Math.abs(value) < 0.0005) value = 0;
    if (api && typeof api.format === "function") return api.format(value, digits === undefined ? 3 : digits);
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.indexOf(".") < 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    setAttributes(node, attrs || {});
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function renderPrediction(api, state, questions, refs) {
    questions.forEach(function (question) {
      question.choices.forEach(function (choice) {
        choice.node.setAttribute("aria-pressed", state.predictions[question.key] === choice.value ? "true" : "false");
      });
    });
    var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
    refs.reveal.disabled = missing.length > 0;
    refs.feedback.className = "lp-feedback" + (state.feedbackClass ? " " + state.feedbackClass : "");
    refs.feedback.textContent = state.feedback || (missing.length ? "先完成 " + missing.length + " 项预测；揭晓前不显示计算账本。" : "四项都已回答，可以揭晓。");
  }

  function makePredictionForm(api, doc, state, refs) {
    var questions = [
      { key: "probability", prompt: "在概率测度（总质量 1）下，固定向量的 Lp 范数随 p 增大怎样？", choices: [{ value: "up", label: "单调不减" }, { value: "down", label: "单调不增" }, { value: "none", label: "没有方向" }], expected: "up" },
      { key: "endpoint", prompt: "p 走向 infinity 时，有限向量的 Lp 范数会靠近什么？", choices: [{ value: "max", label: "最大绝对值" }, { value: "mean", label: "平均绝对值" }, { value: "zero", label: "0" }], expected: "max" },
      { key: "dimension", prompt: "同一 n=3 向量、同一有限 p 下，计数范数相对概率范数多出什么？", choices: [{ value: "factor", label: "n^(1/p) 因子" }, { value: "none", label: "没有因子" }, { value: "inverse", label: "n^(-1/p) 因子" }], expected: "factor" },
      { key: "equality", prompt: "p=2 且两向量同向时，Minkowski 预期怎样？", choices: [{ value: "equal", label: "取等" }, { value: "strict", label: "严格小于" }, { value: "fail", label: "不适用" }], expected: "equal" }
    ];
    var form = makeElement(api, doc, "form", { className: "lp-prediction", "aria-describedby": "lp-prediction-note" });
    form.appendChild(makeElement(api, doc, "p", { id: "lp-prediction-note", className: "lp-intro" }, ["先押注测度归一化与端点；答案和数值表在提交前保持隐藏。"]));
    questions.forEach(function (question) {
      var fieldset = makeElement(api, doc, "fieldset", {});
      fieldset.appendChild(makeElement(api, doc, "legend", {}, [question.prompt]));
      var grid = makeElement(api, doc, "div", { className: "lp-choice-grid" });
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice.value;
          state.feedback = "";
          state.feedbackClass = "";
          renderPrediction(api, state, questions, refs);
        });
        choice.node = button;
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      form.appendChild(fieldset);
    });
    refs.questions = questions;
    return form;
  }

  function metric(api, doc, label) {
    var value = makeElement(api, doc, "strong", {}, ["—"]);
    return { node: makeElement(api, doc, "div", { className: "lp-metric" }, [makeElement(api, doc, "span", {}, [label]), value]), value: value };
  }

  function drawScene(doc, svg, result) {
    replaceChildren(svg, []);
    var width = 760;
    var height = 340;
    var plot = { x: 42, y: 42, w: 405, h: 235 };
    var bars = { x: 505, y: 63, w: 190, h: 185 };
    var maximum = Math.max.apply(null, result.curve.map(function (entry) { return Math.max(entry.probability, entry.counting); })) * 1.12;
    function mapX(index) { return plot.x + index * plot.w / (result.curve.length - 1); }
    function mapY(value) { return plot.y + plot.h - value / maximum * plot.h; }
    [0, maximum / 2, maximum].forEach(function (value) {
      svg.appendChild(svgNode(doc, "line", { x1: plot.x, y1: mapY(value), x2: plot.x + plot.w, y2: mapY(value), class: value === 0 ? "lp-axis" : "lp-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: plot.x - 7, y: mapY(value) + 4, class: "lp-label", "text-anchor": "end" }, formatNumber(null, value, 1)));
    });
    svg.appendChild(svgNode(doc, "text", { x: plot.x + plot.w / 2, y: 21, class: "lp-title" }, "Lp 范数随 p 的几何变化"));
    svg.appendChild(svgNode(doc, "text", { x: plot.x, y: plot.y + plot.h + 20, class: "lp-label" }, "p=1"));
    svg.appendChild(svgNode(doc, "text", { x: plot.x + plot.w, y: plot.y + plot.h + 20, class: "lp-label", "text-anchor": "end" }, "p=∞"));
    function pathFor(key) {
      return result.curve.map(function (entry, index) { return (index ? "L" : "M") + mapX(index).toFixed(2) + "," + mapY(entry[key]).toFixed(2); }).join(" ");
    }
    svg.appendChild(svgNode(doc, "path", { d: pathFor("probability"), class: "lp-line lp-prob", fill: "none" }));
    svg.appendChild(svgNode(doc, "path", { d: pathFor("counting"), class: "lp-line lp-count", fill: "none" }));
    result.curve.forEach(function (entry, index) {
      svg.appendChild(svgNode(doc, "circle", { cx: mapX(index), cy: mapY(entry.probability), r: "4", class: "lp-dot lp-prob" }));
      svg.appendChild(svgNode(doc, "circle", { cx: mapX(index), cy: mapY(entry.counting), r: "4", class: "lp-dot lp-count" }));
      svg.appendChild(svgNode(doc, "text", { x: mapX(index), y: plot.y + plot.h + 35, class: "lp-label", "text-anchor": "middle" }, entry.p === Infinity ? "∞" : String(entry.p)));
    });
    svg.appendChild(svgNode(doc, "text", { x: plot.x + 5, y: plot.y + 14, class: "lp-label lp-prob" }, "蓝：概率测度"));
    svg.appendChild(svgNode(doc, "text", { x: plot.x + 105, y: plot.y + 14, class: "lp-label lp-count" }, "金：计数测度"));

    svg.appendChild(svgNode(doc, "text", { x: bars.x + bars.w / 2, y: 21, class: "lp-title" }, "当前向量的绝对值条目"));
    var all = result.values.concat(result.partner).map(function (value) { return Math.abs(value); });
    var vectorMax = Math.max.apply(null, all) || 1;
    [
      { label: "f", values: result.values, className: "lp-vector-f", y: bars.y },
      { label: "g", values: result.partner, className: "lp-vector-g", y: bars.y + 91 }
    ].forEach(function (vector) {
      svg.appendChild(svgNode(doc, "text", { x: bars.x, y: vector.y - 7, class: "lp-label" }, vector.label));
      var barWidth = bars.w / vector.values.length - 7;
      vector.values.forEach(function (value, index) {
        var x = bars.x + index * (barWidth + 7);
        var h = Math.abs(value) / vectorMax * 55;
        svg.appendChild(svgNode(doc, "rect", { x: x, y: vector.y + 58 - h, width: barWidth, height: h, rx: "2", class: vector.className }));
        svg.appendChild(svgNode(doc, "text", { x: x + barWidth / 2, y: vector.y + 73, class: "lp-label", "text-anchor": "middle" }, String(value)));
      });
    });
    svg.appendChild(svgNode(doc, "text", { x: bars.x, y: 287, class: "lp-label" }, "端点两条曲线都回到 max |f_i|；中间高度受测度归一化影响。"));
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "概率测度和计数测度下 Lp 范数曲线及向量条目");
  }

  function renderLedger(api, doc, hostNode, result) {
    var rows = [
      ["||f||p（当前测度）", formatNumber(api, result.norm, 5)],
      ["||f||∞", formatNumber(api, result.infinityNorm, 5)],
      ["Hölder 左端 / 右端", formatNumber(api, result.holder.left, 5) + " / " + formatNumber(api, result.holder.right, 5)],
      ["Hölder gap", formatNumber(api, result.holder.gap, 7)],
      ["Minkowski 左端 / 右端", formatNumber(api, result.minkowski.left, 5) + " / " + formatNumber(api, result.minkowski.right, 5)],
      ["Minkowski gap", formatNumber(api, result.minkowski.gap, 7)],
      ["计数 / 概率", formatNumber(api, result.countToProbability, 5) + "（理论 n^(1/p)=" + formatNumber(api, result.dimensionFactor, 5) + "）"]
    ];
    var body = makeElement(api, doc, "tbody", {});
    rows.forEach(function (row) {
      body.appendChild(makeElement(api, doc, "tr", {}, [makeElement(api, doc, "th", {}, [row[0]]), makeElement(api, doc, "td", {}, [row[1]])]));
    });
    var table = makeElement(api, doc, "table", {}, [makeElement(api, doc, "caption", {}, ["透明账本：每个数字对应上方的定义或不等式"]), body]);
    replaceChildren(hostNode, [table]);
  }

  function renderCurveLedger(api, doc, hostNode, result) {
    var body = makeElement(api, doc, "tbody", {});
    result.curve.forEach(function (entry) {
      body.appendChild(makeElement(api, doc, "tr", {}, [
        makeElement(api, doc, "th", {}, [entry.p === Infinity ? "∞" : String(entry.p)]),
        makeElement(api, doc, "td", {}, [formatNumber(api, entry.probability, 5)]),
        makeElement(api, doc, "td", {}, [formatNumber(api, entry.counting, 5)]),
        makeElement(api, doc, "td", {}, [entry.p === Infinity ? "1" : formatNumber(api, Math.pow(result.n, 1 / entry.p), 5)])
      ]));
    });
    var table = makeElement(api, doc, "table", {}, [
      makeElement(api, doc, "caption", {}, ["端点表：概率范数单调不减，计数范数单调不增；两者由维数因子相连。"]),
      makeElement(api, doc, "thead", {}, [makeElement(api, doc, "tr", {}, [makeElement(api, doc, "th", {}, ["p"]), makeElement(api, doc, "th", {}, ["概率"]), makeElement(api, doc, "th", {}, ["计数"]), makeElement(api, doc, "th", {}, ["n^(1/p)"])])]),
      body
    ]);
    replaceChildren(hostNode, [table]);
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") return;
    var doc = root.ownerDocument || document;
    installStyles(doc);
    root.classList.add("lp-lab");
    var uid = "lp-" + (INSTANCE += 1);
    var state = { presetId: "generic", measure: "probability", p: 2, revealed: false, predictions: {}, feedback: "", feedbackClass: "" };
    var refs = {};
    var questions;

    var heading = makeElement(api, doc, "h3", {}, ["Lp 几何账本：先猜归一化，再看不等式"]);
    var intro = makeElement(api, doc, "p", { className: "lp-intro" }, ["有限离散模型只呈现范数几何：同一个向量在概率测度与计数测度下的数值不同；它不替代一般测度空间中的 Riesz--Fischer 证明。"]);
    var predictionForm = makePredictionForm(api, doc, state, refs);
    questions = refs.questions;
    var actions = makeElement(api, doc, "div", { className: "lp-actions" });
    var reveal = makeElement(api, doc, "button", { type: "button", className: "lp-primary", text: "核对预测并揭晓" });
    var reset = makeElement(api, doc, "button", { type: "button", text: "重置预测" });
    refs.reveal = reveal;
    refs.feedback = makeElement(api, doc, "p", { className: "lp-feedback", "aria-live": "polite" }, []);
    actions.appendChild(reveal);
    actions.appendChild(reset);

    var presetBox = makeElement(api, doc, "fieldset", { className: "lp-preset-box" });
    presetBox.appendChild(makeElement(api, doc, "legend", {}, ["揭晓后探索固定预设"]));
    var presetGrid = makeElement(api, doc, "div", { className: "lp-presets" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { type: "button", text: preset.label, "aria-pressed": "false" });
      button.addEventListener("click", function () { state.presetId = preset.id; render(); announce(api, root, "已切换到" + preset.label + "。"); });
      presetButtons.push({ id: preset.id, node: button });
      presetGrid.appendChild(button);
    });
    presetBox.appendChild(presetGrid);
    var controls = makeElement(api, doc, "div", { className: "lp-controls" });
    var measureSelect = makeElement(api, doc, "select", { "aria-label": "测度选择" }, [
      makeElement(api, doc, "option", { value: "probability", text: "概率测度：每点权重 1/n" }),
      makeElement(api, doc, "option", { value: "counting", text: "计数测度：每点权重 1" })
    ]);
    var pSelect = makeElement(api, doc, "select", { "aria-label": "p 选择" }, [1, 2, 4, 8].map(function (p) {
      return makeElement(api, doc, "option", { value: String(p), text: "p=" + p });
    }).concat([makeElement(api, doc, "option", { value: "inf", text: "p=∞" })]));
    controls.appendChild(makeElement(api, doc, "div", { className: "lp-control" }, [makeElement(api, doc, "label", {}, ["测度"]), measureSelect]));
    controls.appendChild(makeElement(api, doc, "div", { className: "lp-control" }, [makeElement(api, doc, "label", {}, ["指数"]), pSelect]));
    var svg = doc.createElementNS(SVG_NS, "svg");
    setAttributes(svg, { className: "lp-svg", id: uid + "-svg" });
    var stage = makeElement(api, doc, "div", { className: "lp-stage" }, [svg]);
    var metricsHost = makeElement(api, doc, "div", { className: "lp-metrics" });
    var ledgerHost = makeElement(api, doc, "div", { className: "lp-table-wrap" });
    var curveHost = makeElement(api, doc, "div", { className: "lp-table-wrap" });
    var checksHost = makeElement(api, doc, "ul", { className: "lp-checks" });
    var interpretationHost = makeElement(api, doc, "p", { className: "lp-interpretation" });
    var resultShell = makeElement(api, doc, "div", { className: "lp-results", hidden: true }, [
      presetBox,
      makeElement(api, doc, "div", { className: "lp-layout" }, [controls, makeElement(api, doc, "div", { className: "lp-results" }, [stage, metricsHost, makeElement(api, doc, "h4", {}, ["不等式与端点"]), ledgerHost, curveHost, checksHost, interpretationHost])])
    ]);
    replaceChildren(root, [heading, intro, predictionForm, actions, refs.feedback, resultShell]);

    reveal.addEventListener("click", function () {
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭晓：" + correct + "/" + questions.length + " 命中；现在可切换测度、指数和预设。";
      state.feedbackClass = correct === questions.length ? "lp-pass" : "lp-warn";
      render();
      announce(api, root, state.feedback);
    });
    reset.addEventListener("click", function () {
      state.presetId = "generic";
      state.measure = "probability";
      state.p = 2;
      state.revealed = false;
      state.predictions = {};
      state.feedback = "";
      state.feedbackClass = "";
      render();
      announce(api, root, "预测和计算账本已重置。");
    });
    measureSelect.addEventListener("change", function () { state.measure = measureSelect.value; render(); });
    pSelect.addEventListener("change", function () { state.p = pSelect.value === "inf" ? Infinity : Number(pSelect.value); render(); });

    function render() {
      renderPrediction(api, state, questions, refs);
      resultShell.hidden = !state.revealed;
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false"); });
      measureSelect.value = state.measure;
      pSelect.value = state.p === Infinity ? "inf" : String(state.p);
      if (!state.revealed) return;
      var preset = presetById(state.presetId);
      var result = compute({ values: preset.values, partner: preset.partner, measure: state.measure, p: state.p });
      drawScene(doc, svg, result);
      var metricItems = [
        metric(api, doc, "当前 ||f||p"), metric(api, doc, "概率 ||f||p"), metric(api, doc, "计数 ||f||p"), metric(api, doc, "Hölder q")
      ];
      replaceChildren(metricsHost, metricItems.map(function (item) { return item.node; }));
      metricItems[0].value.textContent = formatNumber(api, result.norm, 5);
      metricItems[1].value.textContent = formatNumber(api, result.probabilityNorm, 5);
      metricItems[2].value.textContent = formatNumber(api, result.countingNorm, 5);
      metricItems[3].value.textContent = formatNumber(api, result.q, 4);
      renderLedger(api, doc, ledgerHost, result);
      renderCurveLedger(api, doc, curveHost, result);
      var checks = [
        [result.holder.gap <= 1e-8, "Hölder：左端 ≤ 右端，gap=" + formatNumber(api, result.holder.gap, 7)],
        [result.minkowski.gap <= 1e-8, "Minkowski：左端 ≤ 右端，gap=" + formatNumber(api, result.minkowski.gap, 7)],
        [near(result.infinityNorm, Math.max.apply(null, result.values.map(function (value) { return Math.abs(value); }))), "p→∞：回到 max |f_i|=" + formatNumber(api, result.infinityNorm, 5)],
        [near(result.countToProbability, result.dimensionFactor), "归一化：计数/概率=" + formatNumber(api, result.countToProbability, 5) + " = n^(1/p)"]
      ];
      replaceChildren(checksHost, checks.map(function (check) {
        return makeElement(api, doc, "li", {}, [makeElement(api, doc, "span", { className: "lp-check " + (check[0] ? "lp-check-pass" : "lp-check-fail") }, [check[0] ? "✓" : "×"]), makeElement(api, doc, "span", {}, [check[1]])]);
      }));
      var equalityText = result.holder.equality
        ? "当前预设达到 Hölder 等号；"
        : "当前预设未达到 Hölder 等号；";
      equalityText += result.minkowski.equality
        ? "Minkowski 也取等。"
        : "Minkowski gap 说明两向量不是同向的等号情形。";
      interpretationHost.textContent = preset.note + " " + equalityText + " 概率测度总质量为 1，所以 p 增大时范数单调不减；计数测度没有这层归一化，n^(1/p) 维数因子会让对应曲线单调不增。一般空间还要另行检查测度有限性，不能把这个有限图形当作 Riesz--Fischer 的证明。";
    }

    render();
  }

  return {
    EPS: EPS,
    CURVE_P: CURVE_P,
    PRESETS: PRESETS,
    lpNorm: lpNorm,
    norm: lpNorm,
    conjugate: conjugate,
    holder: holder,
    minkowski: minkowski,
    compute: compute,
    selfTest: selfTest,
    mount: mount
  };
});
