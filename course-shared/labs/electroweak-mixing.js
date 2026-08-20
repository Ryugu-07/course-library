(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("electroweak-mixing", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("electroweak-mixing self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("electroweak-mixing self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "electroweak-mixing-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;

  var PRESETS = [
    { id: "physical", label: "物理角度", g: 0.65, gp: 0.35, v: 246, angleOffset: 0, note: "正确 Weinberg 角：中性质量矩阵被对角化。" },
    { id: "wrong-angle", label: "错误混合角", g: 0.65, gp: 0.35, v: 246, angleOffset: 12, note: "故意偏移 12°：本征值不变，但旋转后出现非对角元。" },
    { id: "zero-vev", label: "v=0 边界", g: 0.65, gp: 0.35, v: 0, angleOffset: 0, note: "整个质量矩阵为零；质量项不选择唯一中性基。" },
    { id: "invalid", label: "非法耦合", g: -0.65, gp: 0.35, v: 246, angleOffset: 0, note: "负规范耦合被拒绝，显示失败状态。" }
  ];

  var STYLE_TEXT = [
    ".ew-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}.ew-lab *,.ew-lab *::before,.ew-lab *::after{box-sizing:border-box}.ew-lab [hidden]{display:none!important}",
    ".ew-lab h3,.ew-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.ew-lab h3{font-size:1.12rem}.ew-lab h4{margin-top:15px;font-size:1rem}.ew-lab p{margin:8px 0}.ew-lab .ew-intro,.ew-lab .ew-note,.ew-lab .ew-feedback{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
    ".ew-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.ew-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.ew-lab .ew-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}",
    ".ew-lab button,.ew-lab select,.ew-lab input{font:inherit}.ew-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ew-lab button:hover{border-color:var(--accent,#1769aa)}.ew-lab button:focus-visible,.ew-lab select:focus-visible,.ew-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ew-lab button[aria-pressed=true],.ew-lab button.ew-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.ew-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".ew-lab .ew-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.ew-lab .ew-actions>*{flex:1 1 170px}.ew-lab .ew-feedback{min-height:2em;margin:8px 0;font-weight:700}.ew-lab .ew-pass{color:var(--cl-green,#2f7547)}.ew-lab .ew-warn{color:var(--cl-red,#b43d32)}",
    ".ew-lab .ew-layout{display:grid;grid-template-columns:minmax(215px,.64fr) minmax(0,1.36fr);gap:14px;align-items:start}.ew-lab .ew-controls,.ew-lab .ew-stage{min-width:0}.ew-lab .ew-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff)}.ew-lab .ew-control{display:grid;gap:5px}.ew-lab .ew-control label{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.ew-lab .ew-control select,.ew-lab .ew-control input[type=number]{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);font-variant-numeric:tabular-nums}.ew-lab .ew-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.ew-lab .ew-presets button{font-size:12px}",
    ".ew-lab .ew-frame{min-width:0;padding:7px;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.ew-lab .ew-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b)}.ew-lab .ew-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ew-lab .ew-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.65}.ew-lab .ew-grid{stroke:var(--border,#c8cdd3);stroke-width:1;stroke-opacity:.75}.ew-lab .ew-a{stroke:var(--cl-green,#347247);fill:var(--cl-green,#347247)}.ew-lab .ew-z{stroke:var(--cl-blue,#2c6aa0);fill:var(--cl-blue,#2c6aa0)}.ew-lab .ew-selected{stroke:var(--cl-red,#b13d32);fill:var(--cl-red,#b13d32);stroke-dasharray:5 4}.ew-lab .ew-vector{fill:none;stroke-width:2.8;stroke-linecap:round}.ew-lab .ew-label{font-size:10.5px}.ew-lab .ew-title{font-size:12px;font-weight:800;text-anchor:middle}.ew-lab .ew-matrix-box{fill:var(--bg,#fff);stroke:var(--border,#c8cdd3);stroke-width:1}",
    ".ew-lab .ew-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:11px 0}.ew-lab .ew-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--bg,#fff)}.ew-lab .ew-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.ew-lab .ew-metric:nth-child(4n+2){border-color:var(--cl-gold,#95670d)}.ew-lab .ew-metric:nth-child(4n+3){border-color:var(--cl-green,#347247)}.ew-lab .ew-metric:nth-child(4n){border-color:var(--cl-red,#b13d32)}.ew-lab .ew-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px}.ew-lab .ew-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ew-lab .ew-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.ew-lab table{width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ew-lab th,.ew-lab td{padding:7px 7px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.ew-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.ew-lab .ew-checks{display:grid;gap:6px;margin:10px 0 0;padding:0;list-style:none}.ew-lab .ew-checks li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:6px;align-items:start}.ew-lab .ew-check{font-weight:800}.ew-lab .ew-check-pass{color:var(--cl-green,#2f7547)}.ew-lab .ew-check-fail{color:var(--cl-red,#b43d32)}.ew-lab .ew-interpretation{margin-top:10px;padding:9px 11px;border-left:3px solid var(--cl-green,#347247);background:var(--block-bg,var(--bg,#fff));color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;line-height:1.65}",
    "@media(max-width:850px){.ew-lab .ew-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){.ew-lab .ew-choice-grid{grid-template-columns:minmax(0,1fr)}.ew-lab .ew-presets{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){.ew-lab .ew-frame{padding:4px}.ew-lab table{font-size:11.5px}.ew-lab th,.ew-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.ew-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function matrixMaxAbs(matrix) { return Math.max.apply(null, matrix.reduce(function (all, row) { return all.concat(row.map(Math.abs)); }, [])); }
  function degrees(radians) { return radians * 180 / Math.PI; }
  function radians(deg) { return deg * Math.PI / 180; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  function matrixVector(matrix, vector) { return [matrix[0][0] * vector[0] + matrix[0][1] * vector[1], matrix[1][0] * vector[0] + matrix[1][1] * vector[1]]; }

  function massMatrix(g, gp, v) {
    g = Number(g); gp = Number(gp); v = Number(v);
    if (!finite(g) || !finite(gp) || !finite(v)) throw new TypeError("g, gp, and v must be finite");
    var factor = v * v / 4;
    return [[factor * g * g, -factor * g * gp], [-factor * g * gp, factor * gp * gp]];
  }

  function diagonalizeSymmetric(matrix) {
    var a = matrix[0][0];
    var b = matrix[0][1];
    var d = matrix[1][1];
    var trace = a + d;
    var radius = Math.hypot(a - d, 2 * b);
    return { low: (trace - radius) / 2, high: (trace + radius) / 2, trace: trace, determinant: a * d - b * b };
  }

  function rotatedMatrix(matrix, theta) {
    var s = Math.sin(theta);
    var c = Math.cos(theta);
    var columns = [[s, c], [c, -s]];
    var first = [dot(columns[0], matrixVector(matrix, columns[0])), dot(columns[0], matrixVector(matrix, columns[1]))];
    var second = [dot(columns[1], matrixVector(matrix, columns[0])), dot(columns[1], matrixVector(matrix, columns[1]))];
    return [first, second];
  }

  function invalid(status, message, extra) {
    var result = { ok: false, status: status, failure: message, message: message };
    Object.keys(extra || {}).forEach(function (key) { result[key] = extra[key]; });
    return result;
  }

  function compute(input) {
    input = input || {};
    var g = Number(input.g);
    var gp = Number(input.gp === undefined ? input.gPrime : input.gp);
    var v = Number(input.v);
    if (!finite(g) || !finite(gp) || !finite(v)) return invalid("invalid-input", "g、g'、v 和混合角必须是有限数。", { g: g, gp: gp, v: v });
    if (g <= 0 || gp <= 0) return invalid("invalid-coupling", "本实验要求 g>0 且 g'>0；非法耦合不进入质量对角化。", { g: g, gp: gp, v: v });
    if (v < 0) return invalid("invalid-vev", "本实验把 v 作为非负真空期望值尺度。", { g: g, gp: gp, v: v });
    var thetaW = Math.atan2(gp, g);
    var thetaDeg = input.thetaDeg === undefined ? degrees(thetaW) : Number(input.thetaDeg);
    if (!finite(thetaDeg)) return invalid("invalid-angle", "混合角必须是有限数。", { g: g, gp: gp, v: v });
    var theta = radians(thetaDeg);
    var matrix = massMatrix(g, gp, v);
    var spectrum = diagonalizeSymmetric(matrix);
    var low = Math.abs(spectrum.low) < 1e-9 ? 0 : spectrum.low;
    var high = Math.max(0, spectrum.high);
    var r = Math.hypot(g, gp);
    var sinW = gp / r;
    var cosW = g / r;
    var analyticZSquared = v * v * r * r / 4;
    var rotation = rotatedMatrix(matrix, theta);
    var rotationAtW = rotatedMatrix(matrix, thetaW);
    var angleError = degrees(theta - thetaW);
    var mW = g * v / 2;
    var mZFormula = v * r / 2;
    var mZNumeric = Math.sqrt(high);
    var mGammaNumeric = Math.sqrt(Math.max(0, low));
    var eFromG = g * sinW;
    var eFromGp = gp * cosW;
    var vZero = v === 0;
    var mixingIdentifiable = !vZero;
    var mixingCorrect = Math.abs(angleError) < 1e-7;
    var status = vZero ? "zero-vev-degenerate" : mixingCorrect ? "ok" : "wrong-mixing-angle";
    return {
      ok: true,
      status: status,
      g: g,
      gp: gp,
      v: v,
      thetaW: thetaW,
      thetaWDeg: degrees(thetaW),
      thetaUsed: theta,
      thetaUsedDeg: thetaDeg,
      angleErrorDeg: angleError,
      sinW: sinW,
      cosW: cosW,
      matrix: matrix,
      rotation: rotation,
      rotationAtW: rotationAtW,
      lowEigenvalue: low,
      highEigenvalue: high,
      analyticPhotonSquared: 0,
      analyticZSquared: analyticZSquared,
      numericSpectrumResidual: Math.max(Math.abs(low), Math.abs(high - analyticZSquared)),
      determinant: spectrum.determinant,
      mGamma: 0,
      mGammaNumeric: mGammaNumeric,
      mW: mW,
      mZ: mZFormula,
      mZNumeric: mZNumeric,
      eFromG: eFromG,
      eFromGp: eFromGp,
      eResidual: Math.abs(eFromG - eFromGp),
      rotatedPhotonEntry: rotation[0][0],
      rotatedOffDiagonal: rotation[0][1],
      rotatedZEntry: rotation[1][1],
      correctRotationResidual: Math.abs(rotationAtW[0][0]) + Math.abs(rotationAtW[0][1]),
      mixingIdentifiable: mixingIdentifiable,
      mixingCorrect: mixingCorrect,
      photonMassless: Math.abs(low) < 1e-8,
      formulaChecks: {
        mW: near(mW, g * v / 2),
        mZ: near(mZFormula, v * r / 2),
        gamma: near(0, 0),
        charge: near(eFromG, eFromGp)
      }
    };
  }

  function assert(condition, message) {
    if (!condition) throw new Error("electroweak-mixing self-test failed: " + message);
  }

  function selfTest() {
    var checks = 0;
    [
      { g: 0.65, gp: 0.35, v: 246 },
      { g: 0.3, gp: 0.7, v: 100 },
      { g: 1.1, gp: 0.2, v: 3 }
    ].forEach(function (input) {
      var result = compute(input);
      checks += 11;
      assert(result.ok && result.status === "ok", "physical input status");
      assert(near(result.lowEigenvalue, 0, 1e-8), "massless photon eigenvalue");
      assert(near(result.highEigenvalue, result.analyticZSquared, 1e-9), "analytic Z eigenvalue");
      assert(near(result.determinant, 0, 1e-8), "rank-one determinant");
      assert(near(result.mGamma, 0), "m_gamma formula");
      assert(near(result.mW, input.g * input.v / 2), "m_W formula");
      assert(near(result.mZ, input.v * Math.hypot(input.g, input.gp) / 2), "m_Z formula");
      assert(near(result.mZNumeric, result.mZ, 1e-9), "numeric m_Z");
      assert(near(result.eFromG, result.eFromGp, 1e-10), "electric charge equality");
      assert(result.correctRotationResidual < 1e-8, "correct rotation diagonalizes");
      assert(result.formulaChecks.charge, "charge formula check");
    });
    var wrong = compute({ g: 0.65, gp: 0.35, v: 246, thetaDeg: 40 });
    var zero = compute({ g: 0.65, gp: 0.35, v: 0, thetaDeg: 40 });
    var invalidCoupling = compute({ g: -0.65, gp: 0.35, v: 246, thetaDeg: 28 });
    var invalidV = compute({ g: 0.65, gp: 0.35, v: -1, thetaDeg: 28 });
    var invalidNumber = compute({ g: NaN, gp: 0.35, v: 246, thetaDeg: 28 });
    checks += 10;
    assert(wrong.ok && wrong.status === "wrong-mixing-angle", "wrong angle status");
    assert(Math.abs(wrong.rotatedOffDiagonal) > 1, "wrong angle leaves off diagonal");
    assert(wrong.photonMassless, "wrong basis does not change spectrum");
    assert(zero.ok && zero.status === "zero-vev-degenerate", "zero vev boundary status");
    assert(matrixMaxAbs(zero.matrix) === 0, "zero mass matrix");
    assert(zero.mW === 0 && zero.mZ === 0 && zero.mGamma === 0, "zero vev masses");
    assert(!zero.mixingIdentifiable, "zero vev mixing not identifiable");
    assert(!invalidCoupling.ok && invalidCoupling.status === "invalid-coupling", "invalid coupling rejection");
    assert(!invalidV.ok && invalidV.status === "invalid-vev", "invalid vev rejection");
    assert(!invalidNumber.ok && invalidNumber.status === "invalid-input", "nonfinite rejection");
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
    var node = api && typeof api.el === "function" ? api.el(tag, attrs || {}) : setAttributes(doc.createElement(tag), attrs || {});
    return appendChildren(node, children);
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    setAttributes(node, attrs || {});
    if (text !== undefined) node.textContent = text;
    return node;
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
    if (!finite(value)) return "—";
    if (Math.abs(value) < 0.0005) value = 0;
    if (api && typeof api.format === "function") return api.format(value, digits === undefined ? 3 : digits);
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.indexOf(".") < 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function metric(api, doc, label) {
    var value = makeElement(api, doc, "strong", {}, ["—"]);
    return { node: makeElement(api, doc, "div", { className: "ew-metric" }, [makeElement(api, doc, "span", {}, [label]), value]), value: value };
  }

  function drawScene(doc, svg, result) {
    replaceChildren(svg, []);
    svg.setAttribute("viewBox", "0 0 760 330");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "W3 B 中性质量矩阵的 A Z 混合向量");
    var plot = { cx: 190, cy: 160, scale: 105 };
    svg.appendChild(svgNode(doc, "text", { x: plot.cx, y: 20, class: "ew-title" }, "中性基底与混合方向"));
    [-1, 0, 1].forEach(function (value) {
      svg.appendChild(svgNode(doc, "line", { x1: plot.cx - plot.scale, y1: plot.cy - value * plot.scale, x2: plot.cx + plot.scale, y2: plot.cy - value * plot.scale, class: value === 0 ? "ew-axis" : "ew-grid" }));
      svg.appendChild(svgNode(doc, "line", { x1: plot.cx + value * plot.scale, y1: plot.cy - plot.scale, x2: plot.cx + value * plot.scale, y2: plot.cy + plot.scale, class: value === 0 ? "ew-axis" : "ew-grid" }));
    });
    svg.appendChild(svgNode(doc, "text", { x: plot.cx + plot.scale + 8, y: plot.cy + 4, class: "ew-label" }, "W³"));
    svg.appendChild(svgNode(doc, "text", { x: plot.cx + 4, y: plot.cy - plot.scale - 8, class: "ew-label" }, "B"));
    if (!result || !result.ok) {
      svg.appendChild(svgNode(doc, "text", { x: 505, y: 95, class: "ew-title" }, "未进行物理对角化"));
      svg.appendChild(svgNode(doc, "text", { x: 505, y: 122, class: "ew-label", "text-anchor": "middle" }, result ? result.message : "invalid input"));
      return;
    }
    function endpoint(vector, scale) { return { x: plot.cx + vector[0] * scale, y: plot.cy - vector[1] * scale }; }
    var actualA = [result.sinW, result.cosW];
    var actualZ = [result.cosW, -result.sinW];
    var selectedA = [Math.sin(result.thetaUsed), Math.cos(result.thetaUsed)];
    var selectedZ = [Math.cos(result.thetaUsed), -Math.sin(result.thetaUsed)];
    [
      { vector: actualA, className: "ew-vector ew-a", label: "A=sinθ W³+cosθ B", offset: [7, -7] },
      { vector: actualZ, className: "ew-vector ew-z", label: "Z=cosθ W³−sinθ B", offset: [7, 15] }
    ].forEach(function (entry) {
      var end = endpoint(entry.vector, plot.scale);
      svg.appendChild(svgNode(doc, "line", { x1: plot.cx, y1: plot.cy, x2: end.x, y2: end.y, class: entry.className }));
      svg.appendChild(svgNode(doc, "text", { x: end.x + entry.offset[0], y: end.y + entry.offset[1], class: "ew-label" }, entry.label));
    });
    if (!result.mixingCorrect && result.v > 0) {
      var selectedEnd = endpoint(selectedA, plot.scale * 0.82);
      svg.appendChild(svgNode(doc, "line", { x1: plot.cx, y1: plot.cy, x2: selectedEnd.x, y2: selectedEnd.y, class: "ew-vector ew-selected" }));
      svg.appendChild(svgNode(doc, "text", { x: selectedEnd.x + 6, y: selectedEnd.y - 7, class: "ew-label" }, "错误 A 方向"));
    }
    var matrixX = 480;
    svg.appendChild(svgNode(doc, "text", { x: 590, y: 20, class: "ew-title" }, "M² 与旋转后非对角元"));
    svg.appendChild(svgNode(doc, "rect", { x: matrixX, y: 47, width: 220, height: 104, rx: "4", class: "ew-matrix-box" }));
    if (result.matrix) {
      svg.appendChild(svgNode(doc, "text", { x: 590, y: 68, class: "ew-label", "text-anchor": "middle" }, "M²(W³,B) / GeV²"));
      svg.appendChild(svgNode(doc, "text", { x: 590, y: 92, class: "ew-label", "text-anchor": "middle" }, "[" + formatNumber(null, result.matrix[0][0], 1) + "  " + formatNumber(null, result.matrix[0][1], 1) + "]"));
      svg.appendChild(svgNode(doc, "text", { x: 590, y: 112, class: "ew-label", "text-anchor": "middle" }, "[" + formatNumber(null, result.matrix[1][0], 1) + "  " + formatNumber(null, result.matrix[1][1], 1) + "]"));
      svg.appendChild(svgNode(doc, "text", { x: 590, y: 137, class: "ew-label", "text-anchor": "middle" }, "旋转后 M_AZ²=" + formatNumber(null, result.rotatedOffDiagonal, 5)));
    }
    svg.appendChild(svgNode(doc, "text", { x: 590, y: 190, class: "ew-label", "text-anchor": "middle" }, result.status === "zero-vev-degenerate" ? "v=0：两个零本征值，混合不由质量项选定" : result.mixingCorrect ? "绿色/蓝色：解析本征方向" : "红虚：用户选定的错误方向"));
  }

  function renderPrediction(api, state, questions, refs) {
    questions.forEach(function (question) { question.choices.forEach(function (choice) { choice.node.setAttribute("aria-pressed", state.predictions[question.key] === choice.value ? "true" : "false"); }); });
    var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
    refs.reveal.disabled = missing.length > 0;
    refs.feedback.className = "ew-feedback" + (state.feedbackClass ? " " + state.feedbackClass : "");
    refs.feedback.textContent = state.feedback || (missing.length ? "还差 " + missing.length + " 项预测；提交前隐藏矩阵与质量结果。" : "五项都已回答，可以揭晓。");
  }

  function makePredictionForm(api, doc, state, refs) {
    var questions = [
      { key: "zero", prompt: "单个 SM Higgs 双重态的中性质量矩阵应有几个零特征值？", choices: [{ value: "one", label: "一个" }, { value: "zero", label: "没有" }, { value: "two", label: "两个" }], expected: "one" },
      { key: "angle", prompt: "取 tan θW=g'/g 的角度，旋转后的 M² 预期怎样？", choices: [{ value: "diagonal", label: "对角" }, { value: "offdiag", label: "仍强耦合" }, { value: "zero", label: "全为零" }], expected: "diagonal" },
      { key: "charge", prompt: "e 的两种计算应如何比较？", choices: [{ value: "same", label: "g sinθ=g' cosθ" }, { value: "different", label: "必不相等" }, { value: "zero", label: "都为 0" }], expected: "same" },
      { key: "vev", prompt: "v=0 时，质量与混合基应是什么状态？", choices: [{ value: "degenerate", label: "全零且基不唯一" }, { value: "zonly", label: "只 Z 有质量" }, { value: "same", label: "与 v=246 相同" }], expected: "degenerate" },
      { key: "wrong", prompt: "故意用错误混合角，最直接的账本信号是什么？", choices: [{ value: "offdiag", label: "旋转后非对角元非零" }, { value: "spectrum", label: "本征谱改变" }, { value: "nothing", label: "没有任何变化" }], expected: "offdiag" }
    ];
    var form = makeElement(api, doc, "form", { className: "ew-prediction", "aria-describedby": "ew-prediction-note" });
    form.appendChild(makeElement(api, doc, "p", { id: "ew-prediction-note", className: "ew-intro" }, ["先押注零模、旋转、荷关系和边界；提交前隐藏数值矩阵、SVG 与质量账本。"]));
    questions.forEach(function (question) {
      var fieldset = makeElement(api, doc, "fieldset", {});
      fieldset.appendChild(makeElement(api, doc, "legend", {}, [question.prompt]));
      var grid = makeElement(api, doc, "div", { className: "ew-choice-grid" });
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; state.feedback = ""; state.feedbackClass = ""; renderPrediction(api, state, questions, refs); });
        choice.node = button;
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      form.appendChild(fieldset);
    });
    refs.questions = questions;
    return form;
  }

  function renderLedger(api, doc, hostNode, result) {
    if (!result.ok) {
      replaceChildren(hostNode, [makeElement(api, doc, "p", { className: "ew-interpretation" }, ["失败状态：" + result.status + "；" + result.message])]);
      return;
    }
    var rows = [
      ["M²₁₁", formatNumber(api, result.matrix[0][0], 7), "v²g²/4"],
      ["M²₁₂=M²₂₁", formatNumber(api, result.matrix[0][1], 7), "−v²gg'/4"],
      ["M²₂₂", formatNumber(api, result.matrix[1][1], 7), "v²g'²/4"],
      ["numeric λγ / λZ", formatNumber(api, result.lowEigenvalue, 8) + " / " + formatNumber(api, result.highEigenvalue, 8), "0 / v²(g²+g'²)/4"],
      ["mγ / mW / mZ", formatNumber(api, result.mGamma, 6) + " / " + formatNumber(api, result.mW, 6) + " / " + formatNumber(api, result.mZ, 6), "0 / gv/2 / vr/2"],
      ["e from g / g'", formatNumber(api, result.eFromG, 8) + " / " + formatNumber(api, result.eFromGp, 8), "difference=" + formatNumber(api, result.eResidual, 8)],
      ["rotated M²_AZ", formatNumber(api, result.rotatedOffDiagonal, 8), result.mixingCorrect ? "correct angle → 0" : "wrong angle warning"]
    ];
    var body = makeElement(api, doc, "tbody", {});
    rows.forEach(function (row) { body.appendChild(makeElement(api, doc, "tr", {}, [makeElement(api, doc, "th", {}, [row[0]]), makeElement(api, doc, "td", {}, [row[1]]), makeElement(api, doc, "td", {}, [row[2]])])); });
    replaceChildren(hostNode, [makeElement(api, doc, "table", {}, [
      makeElement(api, doc, "caption", {}, ["透明账本：原始矩阵、解析谱、数值谱和电荷核对"]),
      makeElement(api, doc, "thead", {}, [makeElement(api, doc, "tr", {}, [makeElement(api, doc, "th", {}, ["量"]), makeElement(api, doc, "th", {}, ["数值"]), makeElement(api, doc, "th", {}, ["解析/判读"])])]),
      body
    ])]);
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") return;
    var doc = root.ownerDocument || document;
    installStyles(doc);
    root.classList.add("ew-lab");
    var state = { presetId: "physical", g: 0.65, gp: 0.35, v: 246, angleOffset: 0, revealed: false, predictions: {}, feedback: "", feedbackClass: "" };
    var refs = {};
    var questions;
    var heading = makeElement(api, doc, "h3", {}, ["电弱混合账本：从 g,g',v 到 A/Z"]);
    var intro = makeElement(api, doc, "p", { className: "ew-intro" }, ["模型固定树级、单个 Higgs 双重态并忽略圈修正；浏览器只展示代数核对，不把参数调节图当作测量或完整标准模型拟合。"]);
    var predictionForm = makePredictionForm(api, doc, state, refs);
    questions = refs.questions;
    var actions = makeElement(api, doc, "div", { className: "ew-actions" });
    var reveal = makeElement(api, doc, "button", { type: "button", className: "ew-primary", text: "核对预测并揭晓" });
    var reset = makeElement(api, doc, "button", { type: "button", text: "重置预测" });
    refs.reveal = reveal;
    refs.feedback = makeElement(api, doc, "p", { className: "ew-feedback", "aria-live": "polite" }, []);
    actions.appendChild(reveal);
    actions.appendChild(reset);

    var presetSelect = makeElement(api, doc, "select", { "aria-label": "电弱场景" }, [makeElement(api, doc, "option", { value: "custom", text: "自定义参数" })].concat(PRESETS.map(function (preset) { return makeElement(api, doc, "option", { value: preset.id, text: preset.label }); })));
    var gInput = makeElement(api, doc, "input", { type: "number", min: "0.01", max: "2", step: "0.01", value: "0.65", "aria-label": "g" });
    var gpInput = makeElement(api, doc, "input", { type: "number", min: "0.01", max: "2", step: "0.01", value: "0.35", "aria-label": "g prime" });
    var vInput = makeElement(api, doc, "input", { type: "number", min: "0", max: "500", step: "1", value: "246", "aria-label": "v" });
    var offsetInput = makeElement(api, doc, "input", { type: "number", min: "-45", max: "45", step: "0.1", value: "0", "aria-label": "mixing angle offset in degrees" });
    var controls = makeElement(api, doc, "div", { className: "ew-controls" }, [
      makeElement(api, doc, "div", { className: "ew-control" }, [makeElement(api, doc, "label", {}, ["场景"]), presetSelect]),
      makeElement(api, doc, "div", { className: "ew-control" }, [makeElement(api, doc, "label", {}, ["g"]), gInput]),
      makeElement(api, doc, "div", { className: "ew-control" }, [makeElement(api, doc, "label", {}, ["g'"]), gpInput]),
      makeElement(api, doc, "div", { className: "ew-control" }, [makeElement(api, doc, "label", {}, ["v / GeV"]), vInput]),
      makeElement(api, doc, "div", { className: "ew-control" }, [makeElement(api, doc, "label", {}, ["相对正确 θW 的偏移 / °"]), offsetInput]),
      makeElement(api, doc, "p", { className: "ew-note" }, ["选定角度为 θW+偏移；正确时 θW=atan2(g',g)。v=0 保留为边界，不强行选择唯一 A/Z 基。"])
    ]);
    var svg = doc.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "ew-svg");
    var frame = makeElement(api, doc, "div", { className: "ew-frame" }, [svg]);
    var metricsHost = makeElement(api, doc, "div", { className: "ew-metrics" });
    var ledgerHost = makeElement(api, doc, "div", { className: "ew-table-wrap" });
    var checksHost = makeElement(api, doc, "ul", { className: "ew-checks" });
    var interpretationHost = makeElement(api, doc, "p", { className: "ew-interpretation" });
    var resultShell = makeElement(api, doc, "div", { hidden: true }, [makeElement(api, doc, "div", { className: "ew-layout" }, [controls, makeElement(api, doc, "div", { className: "ew-stage" }, [frame, metricsHost, ledgerHost, checksHost, interpretationHost])])]);
    replaceChildren(root, [heading, intro, predictionForm, actions, refs.feedback, resultShell]);

    function applyPreset(id) {
      var preset = PRESETS.filter(function (item) { return item.id === id; })[0];
      if (!preset) return;
      state.presetId = id;
      state.g = preset.g;
      state.gp = preset.gp;
      state.v = preset.v;
      state.angleOffset = preset.angleOffset;
    }
    presetSelect.addEventListener("change", function () { if (presetSelect.value !== "custom") applyPreset(presetSelect.value); render(); });
    [[gInput, "g"], [gpInput, "gp"], [vInput, "v"], [offsetInput, "angleOffset"]].forEach(function (pair) {
      pair[0].addEventListener("input", function () { state[pair[1]] = Number(pair[0].value); state.presetId = "custom"; render(); });
    });
    reveal.addEventListener("click", function () {
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭晓：" + correct + "/" + questions.length + " 命中；现在可修改 g、g'、v 和混合角偏移。";
      state.feedbackClass = correct === questions.length ? "ew-pass" : "ew-warn";
      render();
      announce(api, root, state.feedback);
    });
    reset.addEventListener("click", function () {
      state.presetId = "physical";
      state.g = 0.65;
      state.gp = 0.35;
      state.v = 246;
      state.angleOffset = 0;
      state.revealed = false;
      state.predictions = {};
      state.feedback = "";
      state.feedbackClass = "";
      render();
      announce(api, root, "预测和电弱混合账本已重置。");
    });

    function render() {
      renderPrediction(api, state, questions, refs);
      resultShell.hidden = !state.revealed;
      presetSelect.value = state.presetId;
      gInput.value = String(state.g);
      gpInput.value = String(state.gp);
      vInput.value = String(state.v);
      offsetInput.value = String(state.angleOffset);
      if (!state.revealed) return;
      var thetaForInput = finite(state.g) && finite(state.gp) && state.g > 0 && state.gp > 0 ? degrees(Math.atan2(state.gp, state.g)) + state.angleOffset : NaN;
      var result = compute({ g: state.g, gp: state.gp, v: state.v, thetaDeg: thetaForInput });
      drawScene(doc, svg, result);
      var metricValues = result.ok ? [result.thetaWDeg, result.mGamma, result.mW, result.mZ, result.eFromG, result.rotatedOffDiagonal] : ["—", "—", "—", "—", "—", result.status];
      replaceChildren(metricsHost, [metric(api, doc, "θW / °"), metric(api, doc, "mγ / GeV"), metric(api, doc, "mW / GeV"), metric(api, doc, "mZ / GeV"), metric(api, doc, "e"), metric(api, doc, "旋转 M²_AZ")]);
      metricsHost.querySelectorAll("strong").forEach(function (node, index) { node.textContent = typeof metricValues[index] === "number" ? formatNumber(api, metricValues[index], 7) : String(metricValues[index]); });
      renderLedger(api, doc, ledgerHost, result);
      var checks = result.ok ? [
        [result.photonMassless, "零本征值：mγ²≈0，数值谱残差=" + formatNumber(api, result.numericSpectrumResidual, 8)],
        [near(result.mW, result.g * result.v / 2), "mW=gv/2：" + formatNumber(api, result.mW, 7)],
        [near(result.mZ, result.v * Math.hypot(result.g, result.gp) / 2), "mZ=v√(g²+g'²)/2：" + formatNumber(api, result.mZ, 7)],
        [result.eResidual < 1e-8, "e=g sinθW=g' cosθW：差=" + formatNumber(api, result.eResidual, 8)],
        [result.v === 0 ? !result.mixingIdentifiable : result.mixingCorrect ? result.correctRotationResidual < 1e-8 : Math.abs(result.rotatedOffDiagonal) > 1e-7, result.v === 0 ? "v=0：混合基不由质量矩阵唯一确定" : result.mixingCorrect ? "正确角：旋转后对角" : "错误角：非对角元已显现"]
      ] : [[false, "失败状态：" + result.status], [false, result.message]];
      replaceChildren(checksHost, checks.map(function (check) { return makeElement(api, doc, "li", {}, [makeElement(api, doc, "span", { className: "ew-check " + (check[0] ? "ew-check-pass" : "ew-check-fail") }, [check[0] ? "✓" : "×"]), makeElement(api, doc, "span", {}, [check[1]])]); }));
      interpretationHost.textContent = result.ok
        ? (result.status === "zero-vev-degenerate" ? "v=0 边界：三个质量公式都给零，质量矩阵也无法选出唯一的 A/Z 方向。" : result.status === "wrong-mixing-angle" ? "这是错误基底的诊断：物理本征谱仍有零模，但用户指定的 A/Z 旋转留下非零 M_AZ²；不要把它解释成光子真的获得了质量。" : "正确 Weinberg 角把 W³/B 矩阵对角化；解析公式与数值谱、mW/mZ 和电荷两路核对一致。") + " 全部结果都限于树级、单个 Higgs 双重态、无圈修正模型，不能作为实验测量或完整 SM 拟合。"
        : "输入未进入物理对角化：" + result.message + " 迁移到更完整模型时，先重新声明表示、规范荷、圈修正和参数定义。";
    }
    render();
  }

  return {
    EPS: EPS,
    PRESETS: PRESETS,
    massMatrix: massMatrix,
    diagonalizeSymmetric: diagonalizeSymmetric,
    rotatedMatrix: rotatedMatrix,
    compute: compute,
    evaluate: compute,
    selfTest: selfTest,
    mount: mount
  };
});
