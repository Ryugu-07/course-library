(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("measure-expectation", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("measure-expectation self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("measure-expectation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "measure-expectation-lab-styles";
  var INSTANCE = 0;
  var LIMITS = { K: [4, 400], T: [1, 12], steps: [40, 600] };
  var ZETA_TWO = Math.PI * Math.PI / 6;
  var HARMONIC_NORMALIZER = 1 / ZETA_TWO;
  var ATOMS = [
    { x: 0, p: 0.5 },
    { x: 1, p: 0.25 },
    { x: 2, p: 0.125 },
    { x: 4, p: 0.125 }
  ];
  var MODELS = {
    atoms: {
      label: "原子：有限分布",
      description: "P(X=0,1,2,4)=(1/2,1/4,1/8,1/8)",
      kind: "finite",
      theorem: "原子求和合法，E[X]=1"
    },
    density: {
      label: "密度：Exp(1)",
      description: "f(x)=e^(−x) 1{x≥0}",
      kind: "density",
      theorem: "密度积分与 MCT/尾部账给 E[X]=1"
    },
    tail: {
      label: "尾部：Exp(1)",
      description: "P(X>t)=e^(−t)",
      kind: "tail",
      theorem: "Tonelli layer-cake 给 E[X]=1"
    },
    positive: {
      label: "正重尾：X=k²",
      description: "p_k=c/k²，正部期望发散",
      kind: "positive",
      theorem: "E[X]=+∞，MCT 允许极限为 +∞"
    },
    signed: {
      label: "变号重尾：Y=(−1)^k k",
      description: "p_k=c/k²，正负部都发散",
      kind: "signed",
      theorem: "E[Y] 未定义，不是 0"
    }
  };
  var PRESETS = [
    { id: "atoms", label: "原子账", modelId: "atoms", K: 16, T: 4, steps: 160 },
    { id: "density", label: "密度账", modelId: "density", K: 16, T: 6, steps: 240 },
    { id: "tail", label: "尾积分账", modelId: "tail", K: 16, T: 6, steps: 240 },
    { id: "positive", label: "正发散", modelId: "positive", K: 100, T: 6, steps: 240 },
    { id: "signed", label: "正负双发散", modelId: "signed", K: 100, T: 6, steps: 240 }
  ];

  var STYLE_TEXT = [
    ".me-lab{--me-blue:var(--cl-blue,#315f9d);--me-gold:var(--cl-gold,#9b6a12);--me-green:var(--cl-green,#39734d);--me-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".me-lab *,.me-lab *::before,.me-lab *::after{box-sizing:border-box}",
    ".me-lab [hidden]{display:none!important}",
    ".me-lab button,.me-lab input{font:inherit}",
    ".me-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}",
    ".me-lab button:hover{border-color:var(--accent)}",
    ".me-lab button:focus-visible,.me-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".me-lab button[aria-pressed=true],.me-lab .me-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}",
    ".me-lab .me-note{color:var(--fg-soft);font-size:13px;line-height:1.65}",
    ".me-lab .me-prediction{margin-top:14px;padding:13px 14px;border-left:3px solid var(--me-gold);background:var(--bg)}",
    ".me-lab .me-prediction h3{margin:0 0 10px;font-size:14px}",
    ".me-lab fieldset{min-width:0;margin:0 0 10px;padding:10px;border:1px solid var(--border);border-radius:6px}",
    ".me-lab legend{max-width:100%;padding:0 5px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}",
    ".me-lab .me-choices,.me-lab .me-actions,.me-lab .me-presets{display:flex;flex-wrap:wrap;gap:8px}",
    ".me-lab .me-choices button,.me-lab .me-presets button,.me-lab .me-actions>*{flex:1 1 160px}",
    ".me-lab .me-feedback{min-height:2em;margin:9px 0 0;color:var(--fg-soft);font-size:13px;font-weight:700}",
    ".me-lab .me-pass{color:var(--me-green)}.me-lab .me-warn{color:var(--me-red)}",
    ".me-lab .me-controls{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(220px,.8fr);gap:12px;margin-top:16px}",
    ".me-lab .me-control-group{display:grid;gap:8px;min-width:0;padding:11px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}",
    ".me-lab .me-control-group label{color:var(--fg-soft);font-size:12.5px;font-weight:700}",
    ".me-lab .me-control-group output{color:var(--accent);font-variant-numeric:tabular-nums}",
    ".me-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".me-lab .me-results{margin-top:18px;padding-top:15px;border-top:1px solid var(--border)}",
    ".me-lab .me-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 14px}",
    ".me-lab .me-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}",
    ".me-lab .me-metric span{display:block;color:var(--fg-soft);font-size:11.5px}",
    ".me-lab .me-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".me-lab svg{display:block;width:100%;height:auto;max-width:100%;border:1px solid var(--border);border-radius:6px;background:var(--bg)}",
    ".me-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
    ".me-lab .me-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.55}",
    ".me-lab .me-axis{stroke:currentColor;stroke-width:1.25;opacity:.75}",
    ".me-lab .me-curve{fill:none;stroke:var(--me-blue);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}",
    ".me-lab .me-secondary{fill:none;stroke:var(--me-red);stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}",
    ".me-lab .me-reference{stroke:var(--me-gold);stroke-width:1.6;stroke-dasharray:5 4}",
    ".me-lab .me-bar{fill:var(--me-blue);fill-opacity:.6}",
    ".me-lab .me-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:13px}",
    ".me-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}",
    ".me-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px}",
    ".me-lab th,.me-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;white-space:nowrap}",
    ".me-lab th{color:var(--fg-soft);font-size:11.5px}",
    "@media(max-width:760px){.me-lab .me-controls{grid-template-columns:minmax(0,1fr)}.me-lab .me-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:480px){.me-lab .me-metrics{grid-template-columns:minmax(0,1fr)}.me-lab .me-choices button,.me-lab .me-presets button{flex-basis:100%}}",
    "@media(prefers-reduced-motion:reduce){.me-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function assert(condition, message) {
    if (!condition) throw new Error("measure-expectation self-test failed: " + message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance === undefined ? 1e-8 : tolerance) * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function integer(value, fallback, min, max) {
    var parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) parsed = fallback;
    return clamp(parsed, min, max);
  }

  function atomExpectation(atoms) {
    return (atoms || ATOMS).reduce(function (sum, atom) { return sum + atom.x * atom.p; }, 0);
  }

  function atomProbability(atoms) {
    return (atoms || ATOMS).reduce(function (sum, atom) { return sum + atom.p; }, 0);
  }

  function atomTruncation(cap, atoms) {
    cap = Math.max(0, Number(cap));
    return (atoms || ATOMS).reduce(function (sum, atom) { return sum + Math.min(atom.x, cap) * atom.p; }, 0);
  }

  function densityValue(x) {
    return x < 0 ? 0 : Math.exp(-x);
  }

  function densityExpectation(upper, steps) {
    upper = clamp(Number(upper), LIMITS.T[0], LIMITS.T[1]);
    steps = integer(steps, 240, LIMITS.steps[0], LIMITS.steps[1]);
    var width = upper / steps;
    var sum = 0;
    for (var i = 0; i < steps; i += 1) {
      var x = (i + 0.5) * width;
      sum += x * densityValue(x) * width;
    }
    return {
      upper: upper,
      steps: steps,
      value: sum,
      exactFinite: 1 - (upper + 1) * Math.exp(-upper),
      missingTail: (upper + 1) * Math.exp(-upper),
      exact: 1
    };
  }

  function survivalValue(modelId, t) {
    t = Math.max(0, Number(t));
    if (modelId === "tail" || modelId === "density") return Math.exp(-t);
    return 0;
  }

  function tailIntegral(modelId, upper, steps) {
    upper = clamp(Number(upper), LIMITS.T[0], LIMITS.T[1]);
    steps = integer(steps, 240, LIMITS.steps[0], LIMITS.steps[1]);
    var width = upper / steps;
    var sum = 0;
    for (var i = 0; i < steps; i += 1) {
      sum += survivalValue(modelId, (i + 0.5) * width) * width;
    }
    return {
      upper: upper,
      steps: steps,
      value: sum,
      exactFinite: 1 - Math.exp(-upper),
      missingTail: Math.exp(-upper),
      exact: 1
    };
  }

  function inverseSquarePartial(n) {
    var sum = 0;
    for (var k = 1; k <= n; k += 1) sum += 1 / (k * k);
    return sum;
  }

  function positiveTruncation(cap) {
    cap = Math.max(1, Number(cap));
    var cutoff = Math.floor(Math.sqrt(cap));
    var observed = HARMONIC_NORMALIZER * cutoff;
    var tailMass = Math.max(0, 1 - HARMONIC_NORMALIZER * inverseSquarePartial(cutoff));
    return {
      cap: cap,
      cutoff: cutoff,
      observedTerms: observed,
      tailMass: tailMass,
      value: observed + cap * tailMass,
      exact: Infinity
    };
  }

  function signedPartial(n) {
    n = integer(n, 100, 1, 1000);
    var positive = 0;
    var negativeMagnitude = 0;
    for (var k = 1; k <= n; k += 1) {
      if (k % 2 === 0) positive += HARMONIC_NORMALIZER / k;
      else negativeMagnitude += HARMONIC_NORMALIZER / k;
    }
    return {
      n: n,
      positive: positive,
      negativeMagnitude: negativeMagnitude,
      absolute: positive + negativeMagnitude,
      signed: null,
      exact: null
    };
  }

  function normalizeConfig(config) {
    config = config || {};
    var modelId = MODELS[config.modelId] ? config.modelId : "atoms";
    return {
      modelId: modelId,
      K: integer(config.K, 16, LIMITS.K[0], LIMITS.K[1]),
      T: clamp(Number.isFinite(Number(config.T)) ? Number(config.T) : 6, LIMITS.T[0], LIMITS.T[1]),
      steps: integer(config.steps, 240, LIMITS.steps[0], LIMITS.steps[1])
    };
  }

  function expectationSnapshot(config) {
    var state = normalizeConfig(config);
    var model = MODELS[state.modelId];
    var snapshot = {
      modelId: state.modelId,
      K: state.K,
      T: state.T,
      steps: state.steps,
      label: model.label,
      kind: model.kind,
      theorem: model.theorem,
      atoms: null,
      density: null,
      tail: null,
      finiteValue: null,
      exact: null,
      positive: null,
      signed: null
    };
    if (state.modelId === "atoms") {
      snapshot.atoms = {
        probability: atomProbability(),
        exact: atomExpectation(),
        truncated: atomTruncation(state.K)
      };
      snapshot.finiteValue = snapshot.atoms.truncated;
      snapshot.exact = snapshot.atoms.exact;
    } else if (state.modelId === "density") {
      snapshot.density = densityExpectation(state.T, state.steps);
      snapshot.tail = tailIntegral("density", state.T, state.steps);
      snapshot.finiteValue = snapshot.density.value;
      snapshot.exact = snapshot.density.exact;
    } else if (state.modelId === "tail") {
      snapshot.tail = tailIntegral("tail", state.T, state.steps);
      snapshot.density = densityExpectation(state.T, state.steps);
      snapshot.finiteValue = snapshot.tail.value;
      snapshot.exact = snapshot.tail.exact;
    } else if (state.modelId === "positive") {
      snapshot.positive = positiveTruncation(state.K);
      snapshot.finiteValue = snapshot.positive.value;
      snapshot.exact = Infinity;
    } else {
      snapshot.signed = signedPartial(state.K);
      snapshot.finiteValue = snapshot.signed.signed;
      snapshot.exact = null;
    }
    return snapshot;
  }

  function formatNumber(value, digits) {
    if (value === Infinity) return "+∞";
    if (value === -Infinity) return "−∞";
    if (value === null || value === undefined || !Number.isFinite(value)) return "未定义";
    if (Math.abs(value) < 5e-10) return "0";
    var places = digits === undefined ? 5 : digits;
    if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "htmlFor") node.setAttribute("for", value);
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null) return;
      node.setAttribute(key === "className" ? "class" : key, String(value));
    });
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function installStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
  }

  function mapX(value, left, right, maximum) {
    return left + clamp(value / maximum, 0, 1) * (right - left);
  }

  function mapY(value, top, bottom, maximum) {
    return bottom - clamp(value / maximum, 0, 1) * (bottom - top);
  }

  function linePath(points, xMap, yMap) {
    return points.map(function (point, index) {
      return (index ? "L " : "M ") + xMap(point[0]).toFixed(2) + " " + yMap(point[1]).toFixed(2);
    }).join(" ");
  }

  function plotSvg(doc, snapshot, prefix) {
    var svg = svgElement(doc, "svg", {
      viewBox: "0 0 640 320",
      role: "img",
      "aria-labelledby": prefix + "-plot-title " + prefix + "-plot-desc"
    });
    svg.appendChild(svgElement(doc, "title", { id: prefix + "-plot-title" }, "期望的有限账本"));
    svg.appendChild(svgElement(doc, "desc", { id: prefix + "-plot-desc" }, "蓝线显示非负截断或尾积分；变号重尾显示正部与负部的分开增长。"));
    var left = 52;
    var right = 588;
    var top = 34;
    var bottom = 252;
    var pointsA = [];
    var pointsB = [];
    var xMaximum = snapshot.kind === "positive" || snapshot.kind === "signed" ? snapshot.K : snapshot.kind === "finite" ? 4 : snapshot.T;
    var yMaximum = 1.2;
    if (snapshot.kind === "positive") {
      for (var k = 4; k <= snapshot.K; k += Math.max(1, Math.floor(snapshot.K / 80))) pointsA.push([k, positiveTruncation(k).value]);
      if (pointsA[pointsA.length - 1][0] !== snapshot.K) pointsA.push([snapshot.K, positiveTruncation(snapshot.K).value]);
      yMaximum = Math.max(1, pointsA[pointsA.length - 1][1] * 1.12);
    } else if (snapshot.kind === "signed") {
      for (var j = 4; j <= snapshot.K; j += Math.max(1, Math.floor(snapshot.K / 80))) {
        var signed = signedPartial(j);
        pointsA.push([j, signed.positive]);
        pointsB.push([j, signed.negativeMagnitude]);
      }
      if (pointsA[pointsA.length - 1][0] !== snapshot.K) {
        var last = signedPartial(snapshot.K);
        pointsA.push([snapshot.K, last.positive]);
        pointsB.push([snapshot.K, last.negativeMagnitude]);
      }
      yMaximum = Math.max(1, pointsA[pointsA.length - 1][1], pointsB[pointsB.length - 1][1]) * 1.18;
    } else if (snapshot.kind === "finite") {
      ATOMS.forEach(function (atom) { pointsA.push([atom.x, atom.p]); });
      yMaximum = 0.62;
    } else if (snapshot.kind === "tail") {
      for (var t = 0; t <= 80; t += 1) pointsA.push([snapshot.T * t / 80, survivalValue("tail", snapshot.T * t / 80)]);
      yMaximum = 1.1;
    } else {
      for (var xIndex = 0; xIndex <= 80; xIndex += 1) {
        var x = snapshot.T * xIndex / 80;
        pointsA.push([x, x * densityValue(x)]);
      }
      yMaximum = 1.1;
    }
    [0, 0.5, 1].forEach(function (fraction) {
      var y = mapY(fraction * yMaximum, top, bottom, yMaximum);
      svg.appendChild(svgElement(doc, "line", { x1: left, x2: right, y1: y, y2: y, className: "me-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "font-size": 11, "text-anchor": "end" }, formatNumber(fraction * yMaximum, 2)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, x2: left, y1: top, y2: bottom, className: "me-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, className: "me-axis" }));
    if (snapshot.kind === "finite") {
      var barWidth = 42;
      pointsA.forEach(function (point) {
        var xBar = mapX(point[0], left, right, xMaximum) - barWidth / 2;
        var yBar = mapY(point[1], top, bottom, yMaximum);
        svg.appendChild(svgElement(doc, "rect", { x: xBar, y: yBar, width: barWidth, height: bottom - yBar, className: "me-bar" }));
        svg.appendChild(svgElement(doc, "text", { x: xBar + barWidth / 2, y: bottom + 18, "font-size": 10, "text-anchor": "middle" }, "x=" + point[0]));
      });
    } else {
      svg.appendChild(svgElement(doc, "path", {
        d: linePath(pointsA, function (value) { return mapX(value, left, right, xMaximum); }, function (value) { return mapY(value, top, bottom, yMaximum); }),
        className: "me-curve"
      }));
      if (pointsB.length) {
        svg.appendChild(svgElement(doc, "path", {
          d: linePath(pointsB, function (value) { return mapX(value, left, right, xMaximum); }, function (value) { return mapY(value, top, bottom, yMaximum); }),
          className: "me-secondary"
        }));
      }
    }
    if (snapshot.kind === "positive") {
      svg.appendChild(svgElement(doc, "text", { x: right, y: 24, "font-size": 11, "text-anchor": "end" }, "蓝：E[min(X,K)]，理论极限 +∞"));
    } else if (snapshot.kind === "signed") {
      svg.appendChild(svgElement(doc, "text", { x: right, y: 24, "font-size": 11, "text-anchor": "end" }, "蓝：E[Y⁺]，红：E[Y⁻]，分别发散"));
    } else if (snapshot.kind === "tail") {
      svg.appendChild(svgElement(doc, "text", { x: right, y: 24, "font-size": 11, "text-anchor": "end" }, "蓝：P(X>t)，尾面积是期望"));
    } else if (snapshot.kind === "density") {
      svg.appendChild(svgElement(doc, "text", { x: right, y: 24, "font-size": 11, "text-anchor": "end" }, "蓝：x f(x)，有限 T 仍有尾部"));
    } else {
      svg.appendChild(svgElement(doc, "text", { x: right, y: 24, "font-size": 11, "text-anchor": "end" }, "蓝柱：原子概率 p_k"));
    }
    svg.appendChild(svgElement(doc, "text", { x: left, y: 286, "font-size": 11 }, "有限账本"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: 286, "font-size": 11, "text-anchor": "end" }, "K=" + snapshot.K + "，T=" + formatNumber(snapshot.T, 2)));
    return svg;
  }

  function addLedgerTable(doc, parent, snapshot) {
    var wrap = element(doc, "div", { className: "me-ledger" });
    var table = element(doc, "table", { "aria-label": "期望表示与收敛定理账本" });
    table.appendChild(element(doc, "caption", { text: "有限数值与定理层级分栏；“未定义”不是 0" }));
    var head = element(doc, "tr");
    ["账本", "当前有限值", "极限/结论", "交换条件", "证据层级"].forEach(function (label) {
      head.appendChild(element(doc, "th", { scope: "col", text: label }));
    });
    table.appendChild(element(doc, "thead", {}, [head]));
    var rows = [];
    if (snapshot.kind === "finite") {
      rows = [
        ["原子和 Σxₖpₖ", formatNumber(snapshot.atoms.truncated, 6), "1", "概率和=1；非负", "有限原子 + 精确公式"],
        ["MCT 截断 X∧K", formatNumber(snapshot.atoms.truncated, 6), "1", "X∧K↑X", "有限诊断"]
      ];
    } else if (snapshot.kind === "density" || snapshot.kind === "tail") {
      rows = [
        ["密度 ∫₀ᵀxf(x)dx", formatNumber(snapshot.density.value, 6), "1", "DCT/MCT 需看控制或非负", "中点求积"],
        ["尾账 ∫₀ᵀP(X>t)dt", formatNumber(snapshot.tail.value, 6), "1", "Tonelli layer-cake，X≥0", "中点求积"],
        ["遗漏尾部", formatNumber(snapshot.tail.missingTail, 6), "→0", "T→∞", "解析尾项"]
      ];
    } else if (snapshot.kind === "positive") {
      rows = [
        ["正部截断 E[min(X,K)]", formatNumber(snapshot.positive.value, 6), "+∞", "MCT，非负", "有限诊断 + 定理"],
        ["已见 k≤√K 的项", formatNumber(snapshot.positive.observedTerms, 6), "↑+∞", "Tonelli/MCT", "部分和"],
        ["剩余概率质量", formatNumber(snapshot.positive.tailMass, 6), "—", "分布归一化", "有限诊断"]
      ];
    } else {
      rows = [
        ["E[Y⁺] 截断", formatNumber(snapshot.signed.positive, 6), "+∞", "非负部分单调", "部分和"],
        ["E[Y⁻] 截断", formatNumber(snapshot.signed.negativeMagnitude, 6), "+∞", "非负部分单调", "部分和"],
        ["E[Y⁺]−E[Y⁻]", "未定义", "未定义", "两部均无限", "∞−∞ 禁止"]
      ];
    }
    var body = element(doc, "tbody");
    rows.forEach(function (row) {
      var tr = element(doc, "tr");
      row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); });
      body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    parent.appendChild(wrap);
  }

  function mount(rootNode, api) {
    if (!rootNode || rootNode.getAttribute("data-me-mounted") === "true") return;
    rootNode.setAttribute("data-me-mounted", "true");
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "me-" + INSTANCE;
    var state = { modelId: PRESETS[0].modelId, K: PRESETS[0].K, T: PRESETS[0].T, steps: PRESETS[0].steps };
    var activePreset = PRESETS[0].id;
    var answers = [null, null, null];
    var revealed = false;
    var shell = element(doc, "div", { className: "me-lab" });
    shell.innerHTML = [
      '<p class="me-note">先判断三种非负表示与正负部边界，再揭示有限截断。图是确定性诊断；Tonelli、MCT 和 Lebesgue 期望由条件而不是图形授予合法性。</p>',
      '<div class="me-prediction"><h3>预测门：三项都作答后才能揭示</h3>',
      '<fieldset data-question="0"><legend>1. 原子、密度、尾概率能否给同一个非负期望？</legend><div class="me-choices">',
      '<button type="button" data-question="0" data-answer="same">能，是同一 Lebesgue 积分</button><button type="button" data-question="0" data-answer="different">不能，三种定义互斥</button><button type="button" data-question="0" data-answer="sample">只在抽样时相同</button>',
      '</div></fieldset>',
      '<fieldset data-question="1"><legend>2. MCT/Tonelli 是否要求最终期望有限？</legend><div class="me-choices">',
      '<button type="button" data-question="1" data-answer="allow-infinity">不要求，共同值可为 +∞</button><button type="button" data-question="1" data-answer="finite">必须有限</button><button type="button" data-question="1" data-answer="signed">只要对称即可</button>',
      '</div></fieldset>',
      '<fieldset data-question="2"><legend>3. 若 E[Y⁺]=E[Y⁻]=+∞，应怎样记录 E[Y]？</legend><div class="me-choices">',
      '<button type="button" data-question="2" data-answer="zero">对称所以是 0</button><button type="button" data-question="2" data-answer="boundary">未定义；不能做 ∞−∞</button><button type="button" data-question="2" data-answer="positive">一定是 +∞</button>',
      '</div></fieldset>',
      '<div class="me-actions"><button class="me-primary" type="button" data-action="reveal">核对预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="me-feedback" role="status" aria-live="polite" aria-atomic="true">请先完成三项预测。</p></div>',
      '<div class="me-controls" hidden><div class="me-control-group"><label>教学预设</label><div class="me-presets" data-presets></div></div>',
      '<div class="me-control-group"><label for="' + prefix + '-k">截断级别 K：<output data-output="K">16</output></label><input id="' + prefix + '-k" data-input="K" type="range" min="4" max="400" step="1" value="16">',
      '<label for="' + prefix + '-t">尾部上限 T：<output data-output="T">6</output></label><input id="' + prefix + '-t" data-input="T" type="range" min="1" max="12" step="0.5" value="6">',
      '<label for="' + prefix + '-steps">求积步数：<output data-output="steps">240</output></label><input id="' + prefix + '-steps" data-input="steps" type="range" min="40" max="600" step="20" value="240"></div></div>',
      '<div class="me-results" hidden><div data-metrics></div><div data-stage></div><div data-table></div><p class="me-note">“密度求积”“尾积分”“重尾截断”都是有限证据；表中标出的 MCT/Tonelli、正负部和 UI 条件才决定无限极限能否换序。</p></div>'
    ].join("");
    rootNode.replaceChildren(shell);
    var lab = shell;
    var controls = lab.querySelector(".me-controls");
    var results = lab.querySelector(".me-results");
    var feedback = lab.querySelector(".me-feedback");
    var inputs = {
      K: lab.querySelector('[data-input="K"]'),
      T: lab.querySelector('[data-input="T"]'),
      steps: lab.querySelector('[data-input="steps"]')
    };
    var presetRow = lab.querySelector("[data-presets]");
    PRESETS.forEach(function (preset) {
      presetRow.appendChild(element(doc, "button", {
        type: "button",
        text: preset.label,
        "data-preset": preset.id,
        "aria-pressed": preset.id === activePreset ? "true" : "false"
      }));
    });

    function renderPrediction() {
      lab.querySelectorAll("button[data-question]").forEach(function (button) {
        var question = Number(button.getAttribute("data-question"));
        button.setAttribute("aria-pressed", answers[question] === button.getAttribute("data-answer") ? "true" : "false");
      });
    }

    function render() {
      var snapshot = expectationSnapshot(state);
      var activePresetItem = PRESETS.filter(function (item) { return item.id === activePreset; })[0];
      var activeModelId = activePresetItem ? activePresetItem.modelId : null;
      Object.keys(inputs).forEach(function (key) {
        inputs[key].value = String(state[key]);
        lab.querySelector('[data-output="' + key + '"]').textContent = formatNumber(state[key], key === "T" ? 1 : 0);
      });
      lab.querySelectorAll("button[data-preset]").forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-preset") === activePreset && state.modelId === activeModelId ? "true" : "false");
      });
      controls.hidden = !revealed;
      results.hidden = !revealed;
      renderPrediction();
      if (!revealed) return;
      var metrics = lab.querySelector("[data-metrics]");
      metrics.className = "me-metrics";
      var finite = snapshot.finiteValue;
      var exact = snapshot.exact;
      metrics.innerHTML = [
        ["当前模型", snapshot.label],
        ["有限值", formatNumber(finite, 6)],
        ["理论值", exact === null ? "未定义" : formatNumber(exact, 6)],
        ["K", String(snapshot.K)],
        ["T", formatNumber(snapshot.T, 2)],
        ["步数", String(snapshot.steps)],
        ["正部", snapshot.signed ? formatNumber(snapshot.signed.positive, 5) : "—"],
        ["负部", snapshot.signed ? formatNumber(snapshot.signed.negativeMagnitude, 5) : "—"]
      ].map(function (item) {
        return '<div class="me-metric"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>';
      }).join("");
      var stage = lab.querySelector("[data-stage]");
      stage.replaceChildren(plotSvg(doc, snapshot, prefix));
      var table = lab.querySelector("[data-table]");
      table.replaceChildren();
      addLedgerTable(doc, table, snapshot);
    }

    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-question]");
      if (choice) {
        answers[Number(choice.getAttribute("data-question"))] = choice.getAttribute("data-answer");
        renderPrediction();
        return;
      }
      var presetButton = event.target.closest("button[data-preset]");
      if (presetButton) {
        var preset = PRESETS.filter(function (item) { return item.id === presetButton.getAttribute("data-preset"); })[0];
        if (!preset) return;
        activePreset = preset.id;
        state = { modelId: preset.modelId, K: preset.K, T: preset.T, steps: preset.steps };
        render();
        return;
      }
      var action = event.target.closest("button[data-action]");
      if (!action) return;
      if (action.getAttribute("data-action") === "reset") {
        answers = [null, null, null];
        revealed = false;
        activePreset = PRESETS[0].id;
        state = { modelId: PRESETS[0].modelId, K: PRESETS[0].K, T: PRESETS[0].T, steps: PRESETS[0].steps };
        feedback.className = "me-feedback";
        feedback.textContent = "请先完成三项预测。";
        render();
        return;
      }
      if (answers.some(function (answer) { return answer === null; })) {
        feedback.className = "me-feedback me-warn";
        feedback.textContent = "还差 " + answers.filter(function (answer) { return answer === null; }).length + " 项预测。";
        announce(api, rootNode, feedback.textContent);
        return;
      }
      var expected = ["same", "allow-infinity", "boundary"];
      var score = answers.reduce(function (sum, answer, index) { return sum + (answer === expected[index] ? 1 : 0); }, 0);
      revealed = true;
      feedback.className = "me-feedback " + (score === 3 ? "me-pass" : "me-warn");
      feedback.textContent = "预测命中 " + score + "/3；现在查看非负交换与正负部账本。";
      render();
      announce(api, rootNode, feedback.textContent);
    });
    Object.keys(inputs).forEach(function (key) {
      inputs[key].addEventListener("input", function () {
        if (key === "K" || key === "steps") state[key] = integer(inputs[key].value, state[key], LIMITS[key][0], LIMITS[key][1]);
        else state[key] = clamp(Number(inputs[key].value), LIMITS.T[0], LIMITS.T[1]);
        activePreset = "custom";
        render();
      });
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    check(near(atomProbability(), 1, 1e-12), "atom probabilities normalize");
    check(near(atomExpectation(), 1, 1e-12), "atom expectation");
    check(atomTruncation(1) <= atomTruncation(4) && atomTruncation(4) <= atomExpectation() + 1e-12, "atom truncation monotone");
    var density = densityExpectation(12, 600);
    check(density.value > 0.99 && density.value < 1.01, "density finite quadrature");
    check(near(density.exactFinite + density.missingTail, 1, 1e-12), "density tail ledger");
    var tail = tailIntegral("tail", 12, 600);
    check(tail.value > 0.99 && tail.value < 1.01, "tail finite quadrature");
    check(near(tail.exactFinite + tail.missingTail, 1, 1e-12), "tail complement");
    check(near(survivalValue("tail", 0), 1, 1e-12) && survivalValue("tail", 3) < 1, "survival function");
    var positive4 = positiveTruncation(4);
    var positive100 = positiveTruncation(100);
    check(positive4.value < positive100.value, "positive truncation grows");
    check(positive100.exact === Infinity && positive100.tailMass >= 0, "positive divergence ledger");
    var signed4 = signedPartial(4);
    var signed100 = signedPartial(100);
    check(signed4.positive > 0 && signed4.negativeMagnitude > 0, "signed positive and negative parts");
    check(signed100.positive > signed4.positive && signed100.negativeMagnitude > signed4.negativeMagnitude, "signed parts both grow");
    check(signed100.signed === null && signed100.exact === null, "signed expectation undefined");
    var snapshotA = expectationSnapshot({ modelId: "tail", T: 6, steps: 240 });
    var snapshotB = expectationSnapshot({ modelId: "tail", T: 6, steps: 240 });
    check(snapshotA.finiteValue === snapshotB.finiteValue, "deterministic replay");
    check(Object.keys(MODELS).length === 5 && PRESETS.length === 5, "teaching presets");
    return { checks: checks, models: Object.keys(MODELS).length };
  }

  return {
    ATOMS: ATOMS,
    MODELS: MODELS,
    PRESETS: PRESETS,
    atomExpectation: atomExpectation,
    atomProbability: atomProbability,
    atomTruncation: atomTruncation,
    densityExpectation: densityExpectation,
    survivalValue: survivalValue,
    tailIntegral: tailIntegral,
    positiveTruncation: positiveTruncation,
    signedPartial: signedPartial,
    expectationSnapshot: expectationSnapshot,
    mount: mount,
    selfTest: selfTest
  };
});
