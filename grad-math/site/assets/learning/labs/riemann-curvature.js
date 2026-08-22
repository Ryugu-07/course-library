(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("riemann-curvature", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("riemann-curvature self-test: PASS (" + report.checks + " checks, " + report.models + " models)");
    } catch (error) {
      console.error("riemann-curvature self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "riemann-curvature-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;
  var DIMENSION = 3;

  var MODELS = [
    { id: "sphere", label: "球面模型 K=+1/4", K: 0.25, note: "半径 R=2 的常曲率正模型。" },
    { id: "euclidean", label: "欧氏模型 K=0", K: 0, note: "平直模型；R、Ric、S 都为零。" },
    { id: "hyperbolic", label: "双曲模型 K=−1/4", K: -0.25, note: "曲率为负的常曲率模型。" }
  ];

  var VECTOR_CASES = [
    { id: "orthogonal", label: "正交单位基", X: [1, 0, 0], Y: [0, 1, 0], Z: [0, 1, 0], note: "|X∧Y|²=1，最直接读出符号。" },
    { id: "oblique", label: "斜基（非单位）", X: [1, 0, 0], Y: [1, 1, 0], Z: [0, 1, 0], note: "分子与分母一起缩放，截面曲率仍只由平面决定。" },
    { id: "parallel", label: "退化：X∥Y", X: [1, 0, 0], Y: [2, 0, 0], Z: [0, 1, 0], note: "|X∧Y|²=0，不张成二维截面。" }
  ];

  var STYLE_TEXT = [
    ".rc-lab{--rc-blue:var(--cl-blue,#315f9d);--rc-green:var(--cl-green,#39734d);--rc-gold:var(--cl-gold,#9b6a12);--rc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".rc-lab *,.rc-lab *::before,.rc-lab *::after{box-sizing:border-box}.rc-lab [hidden]{display:none!important}.rc-lab h3,.rc-lab h4{margin:0;color:var(--fg);letter-spacing:0}.rc-lab h3{font-size:1.16rem}.rc-lab h4{margin-top:16px;font-size:1rem}.rc-lab p{margin:8px 0}.rc-lab .rc-note,.rc-lab .rc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.rc-lab button,.rc-lab select,.rc-lab input{font:inherit;letter-spacing:0}.rc-lab button,.rc-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.rc-lab button:hover{border-color:var(--accent)}.rc-lab button:focus-visible,.rc-lab select:focus-visible,.rc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.rc-lab button[aria-pressed=true],.rc-lab button.rc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.rc-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".rc-lab .rc-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0}.rc-lab .rc-control{display:grid;gap:5px;min-width:0}.rc-lab .rc-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.rc-lab .rc-control output{color:var(--accent);font-variant-numeric:tabular-nums}.rc-lab .rc-control select{width:100%}.rc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".rc-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border)}.rc-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.rc-lab .rc-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.rc-lab .rc-options button{font-size:12px}.rc-lab .rc-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--rc-gold);background:var(--block-bg,var(--bg))}.rc-lab .rc-prediction-title{display:block;margin-bottom:7px;font-size:13px}.rc-lab .rc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.rc-lab .rc-actions>*{flex:1 1 170px}.rc-lab .rc-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.rc-lab .rc-pass{color:var(--rc-green)}.rc-lab .rc-warn{color:var(--rc-red)}",
    ".rc-lab .rc-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.rc-lab .rc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:0 0 12px}.rc-lab .rc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.rc-lab .rc-metric:nth-child(4n+1){border-color:var(--rc-blue)}.rc-lab .rc-metric:nth-child(4n+2){border-color:var(--rc-green)}.rc-lab .rc-metric:nth-child(4n+3){border-color:var(--rc-gold)}.rc-lab .rc-metric:nth-child(4n){border-color:var(--rc-red)}.rc-lab .rc-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.rc-lab .rc-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.rc-lab .rc-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.rc-lab .rc-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.rc-lab .rc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.rc-lab .rc-svg .rc-grid{stroke:currentColor;stroke-opacity:.17;stroke-width:1}.rc-lab .rc-svg .rc-axis{stroke:currentColor;stroke-opacity:.55;stroke-width:1.1}.rc-lab .rc-svg .rc-curve{fill:none;stroke:var(--rc-blue);stroke-width:3}.rc-lab .rc-svg .rc-flat{stroke:var(--rc-green);stroke-width:2;stroke-dasharray:6 4}.rc-lab .rc-svg .rc-loop{fill:var(--rc-gold);fill-opacity:.13;stroke:var(--rc-gold);stroke-width:2.5}.rc-lab .rc-svg .rc-arrow{fill:none;stroke:var(--rc-red);stroke-width:2.5}.rc-lab .rc-svg .rc-title{font-size:13px;font-weight:750}.rc-lab .rc-svg .rc-small{font-size:10.5px;fill:var(--fg-soft)!important}.rc-lab .rc-svg .rc-value{font-size:12px;font-weight:750}",
    ".rc-lab .rc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.rc-lab table{width:100%;min-width:920px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.rc-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px}.rc-lab th,.rc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.rc-lab th{color:var(--fg-soft);font-size:11.5px}.rc-lab .rc-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--rc-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.65}.rc-lab .rc-certificate.rc-blocked{border-color:var(--rc-red)}",
    "@media(max-width:900px){.rc-lab .rc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.rc-lab .rc-options{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.rc-lab .rc-controls{grid-template-columns:minmax(0,1fr)}.rc-lab .rc-options{grid-template-columns:minmax(0,1fr)}.rc-lab .rc-prediction{padding:10px}.rc-lab .rc-frame{padding:4px}}@media(prefers-reduced-motion:reduce){.rc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && Number.isFinite(value); }
  function near(left, right, tolerance) { return Math.abs(left - right) <= (tolerance || 1e-8) * Math.max(1, Math.abs(left), Math.abs(right)); }
  function vector(x, y, z) { return [x, y, z]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function scale(a, factor) { return [a[0] * factor, a[1] * factor, a[2] * factor]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(a) { return Math.sqrt(dot(a, a)); }

  function modelById(id) {
    for (var index = 0; index < MODELS.length; index += 1) if (MODELS[index].id === id) return MODELS[index];
    return MODELS[0];
  }

  function vectorCaseById(id) {
    for (var index = 0; index < VECTOR_CASES.length; index += 1) if (VECTOR_CASES[index].id === id) return VECTOR_CASES[index];
    return VECTOR_CASES[0];
  }

  function riemannAction(K, X, Y, Z) {
    return scale(sub(scale(X, dot(Y, Z)), scale(Y, dot(X, Z))), K);
  }

  function wedgeSquared(X, Y) {
    var xx = dot(X, X);
    var yy = dot(Y, Y);
    var xy = dot(X, Y);
    return xx * yy - xy * xy;
  }

  function sectionalData(K, X, Y) {
    var denominator = wedgeSquared(X, Y);
    var numerator = dot(riemannAction(K, X, Y, Y), X);
    return {
      numerator: numerator,
      denominator: denominator,
      value: denominator > EPS ? numerator / denominator : null
    };
  }

  function ricciTensor(K, X, Y, dimension) {
    var n = dimension || DIMENSION;
    return (n - 1) * K * dot(X, Y);
  }

  function ricciSharp(K, X, dimension) {
    var n = dimension || DIMENSION;
    return scale(X, (n - 1) * K);
  }

  function scalarCurvature(K, dimension) {
    var n = dimension || DIMENSION;
    return n * (n - 1) * K;
  }

  function deviationRatio(K, s, amplitude) {
    var a = finite(Number(amplitude)) ? Number(amplitude) : 1;
    var distance = finite(Number(s)) ? Number(s) : 0;
    if (K > EPS) return a * Math.cos(Math.sqrt(K) * distance);
    if (K < -EPS) return a * Math.cosh(Math.sqrt(-K) * distance);
    return a;
  }

  function holonomyAngle(K, side) {
    var length = finite(Number(side)) ? Number(side) : 0;
    return K * length * length;
  }

  function evaluateExperiment(config) {
    var input = config || {};
    var model = modelById(input.modelId || "sphere");
    var vectors = vectorCaseById(input.vectorId || "orthogonal");
    var side = finite(Number(input.side)) ? Math.max(0, Number(input.side)) : 0.6;
    var geodesicS = finite(Number(input.geodesicS)) ? Math.max(0, Number(input.geodesicS)) : 5;
    var sectional = sectionalData(model.K, vectors.X, vectors.Y);
    var RXYZ = riemannAction(model.K, vectors.X, vectors.Y, vectors.Z);
    var ricciX = ricciSharp(model.K, vectors.X, DIMENSION);
    return {
      modelId: model.id,
      modelLabel: model.label,
      K: model.K,
      note: model.note,
      vectorId: vectors.id,
      vectorNote: vectors.note,
      X: vectors.X.slice(),
      Y: vectors.Y.slice(),
      Z: vectors.Z.slice(),
      RXYZ: RXYZ,
      sectional: sectional,
      dimension: DIMENSION,
      ricciSharpX: ricciX,
      ricciXX: ricciTensor(model.K, vectors.X, vectors.X, DIMENSION),
      scalar: scalarCurvature(model.K, DIMENSION),
      side: side,
      area: side * side,
      holonomy: holonomyAngle(model.K, side),
      geodesicS: geodesicS,
      deviation: deviationRatio(model.K, geodesicS, 1)
    };
  }

  function formatNumber(value, digits) {
    if (value === null || !finite(value)) return "—";
    var text = Number(value).toFixed(digits === undefined ? 4 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
  }

  function formatVector(values) {
    return "(" + values.map(function (value) { return formatNumber(value, 4); }).join(", ") + ")";
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function setAttrs(node, attrs) {
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

  function append(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) { return append(setAttrs(doc.createElement(tag), attrs), children, doc); }
  function svgElement(doc, tag, attrs, children) { return append(setAttrs(doc.createElementNS(SVG_NS, tag), attrs), children, doc); }
  function clear(node) { if (typeof node.replaceChildren === "function") node.replaceChildren(); else while (node.firstChild) node.removeChild(node.firstChild); }
  function announce(root, api, message) { if (api && typeof api.announce === "function") api.announce(root, message); }

  function signAnswer(K, sectional) {
    if (sectional.value === null) return "undefined";
    return K > EPS ? "positive" : K < -EPS ? "negative" : "zero";
  }

  function expectedAnswers(report) {
    return {
      sign: signAnswer(report.K, report.sectional),
      ricci: "trace",
      deviation: report.K > EPS ? "oscillate" : report.K < -EPS ? "grow" : "flat",
      holonomy: "K-area"
    };
  }

  function renderDeviationPath(report) {
    var points = [];
    var maxS = Math.max(1, report.geodesicS);
    var yMin = -1.15;
    var yMax = report.K < -EPS ? Math.max(1.2, Math.cosh(Math.sqrt(-report.K) * maxS) * 1.08) : 1.15;
    var left = 58;
    var right = 364;
    var top = 72;
    var bottom = 265;
    for (var index = 0; index <= 48; index += 1) {
      var s = maxS * index / 48;
      var value = deviationRatio(report.K, s, 1);
      var x = left + (right - left) * s / maxS;
      var y = bottom - (value - yMin) / (yMax - yMin) * (bottom - top);
      points.push((index === 0 ? "M " : "L ") + x.toFixed(2) + " " + y.toFixed(2));
    }
    return points.join(" ");
  }

  function renderSvg(doc, report, serial) {
    var svg = svgElement(doc, "svg", { className: "rc-svg", viewBox: "0 0 760 370", role: "img", "aria-labelledby": "rc-svg-title-" + serial + " rc-svg-desc-" + serial });
    svg.appendChild(svgElement(doc, "title", { id: "rc-svg-title-" + serial }, "测地线偏离与小圈和乐尺度"));
    svg.appendChild(svgElement(doc, "desc", { id: "rc-svg-desc-" + serial }, "左图画初始正交分离的归一化 Jacobi 解，右图显示边长 ell 的小方圈及 K 乘面积的和乐角近似。"));
    svg.appendChild(svgElement(doc, "text", { x: "58", y: "35", className: "rc-title" }, "测地线偏离：j'' + K j = 0"));
    svg.appendChild(svgElement(doc, "text", { x: "58", y: "53", className: "rc-small" }, "j(0)=1, j'(0)=0；有限 s 的 toy 轨迹，不是拓扑定理证明"));
    svg.appendChild(svgElement(doc, "line", { x1: "58", y1: "168", x2: "364", y2: "168", className: "rc-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: "58", y1: "72", x2: "58", y2: "265", className: "rc-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: "58", y1: "72", x2: "364", y2: "72", className: "rc-grid" }));
    svg.appendChild(svgElement(doc, "line", { x1: "58", y1: "265", x2: "364", y2: "265", className: "rc-grid" }));
    svg.appendChild(svgElement(doc, "path", { d: renderDeviationPath(report), className: "rc-curve" }));
    svg.appendChild(svgElement(doc, "text", { x: "368", y: "174", className: "rc-small" }, "s"));
    svg.appendChild(svgElement(doc, "text", { x: "42", y: "78", className: "rc-small", "text-anchor": "end" }, "j/a"));
    svg.appendChild(svgElement(doc, "text", { x: "58", y: "285", className: "rc-small" }, "0"));
    svg.appendChild(svgElement(doc, "text", { x: "364", y: "285", className: "rc-small", "text-anchor": "end" }, formatNumber(report.geodesicS, 2)));

    svg.appendChild(svgElement(doc, "text", { x: "440", y: "35", className: "rc-title" }, "小圈和乐：θ ≈ K A"));
    svg.appendChild(svgElement(doc, "text", { x: "440", y: "53", className: "rc-small" }, "A=ℓ²；K 的单位 L⁻²，角度 θ 无量纲；反向绕行反号"));
    svg.appendChild(svgElement(doc, "rect", { x: "480", y: "100", width: "170", height: "130", className: "rc-loop" }));
    svg.appendChild(svgElement(doc, "path", { d: "M 480 100 L 650 100 L 650 230 L 480 230 Z", className: "rc-arrow" }));
    svg.appendChild(svgElement(doc, "path", { d: "M 535 100 L 554 100 L 545 114 Z", className: "rc-arrow" }));
    svg.appendChild(svgElement(doc, "text", { x: "565", y: "170", className: "rc-value", "text-anchor": "middle" }, "A=" + formatNumber(report.area, 3)));
    svg.appendChild(svgElement(doc, "text", { x: "565", y: "188", className: "rc-small", "text-anchor": "middle" }, "θ≈" + formatNumber(report.holonomy, 4) + " rad"));
    svg.appendChild(svgElement(doc, "text", { x: "565", y: "252", className: "rc-small", "text-anchor": "middle" }, "局部平行移动的首阶尺度"));
    svg.appendChild(svgElement(doc, "text", { x: "440", y: "302", className: "rc-small" }, "R(X,Y)Z 的向量值与截面曲率还要看 X,Y,Z；这里只画 K 的量纲账。"));
    return svg;
  }

  function renderResults(doc, hostNode, report, serial) {
    clear(hostNode);
    var metrics = element(doc, "div", { className: "rc-metrics" });
    [
      ["模型 K", formatNumber(report.K, 5)],
      ["R(X,Y)Z", formatVector(report.RXYZ)],
      ["截面曲率", formatNumber(report.sectional.value, 5)],
      ["Ric♯(X)", formatVector(report.ricciSharpX)],
      ["标量 S", formatNumber(report.scalar, 5)],
      ["θ≈Kℓ²", formatNumber(report.holonomy, 5)]
    ].forEach(function (row) { metrics.appendChild(element(doc, "div", { className: "rc-metric" }, [element(doc, "span", {}, row[0]), element(doc, "strong", {}, row[1])])); });
    hostNode.appendChild(metrics);
    var frame = element(doc, "div", { className: "rc-frame" }); frame.appendChild(renderSvg(doc, report, serial)); hostNode.appendChild(frame);
    var tableWrap = element(doc, "div", { className: "rc-table-wrap" });
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", {}, "固定约定下的 R、截面、Ricci、标量与尺度账"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col" }, "对象"), element(doc, "th", { scope: "col" }, "定义/缩并"), element(doc, "th", { scope: "col" }, "当前值"), element(doc, "th", { scope: "col" }, "边界")
    ])));
    var rows = [
      ["R(X,Y)Z", "K(⟨Y,Z⟩X−⟨X,Z⟩Y)", formatVector(report.RXYZ), "本 lab 选 R=∇X∇Y−∇Y∇X−∇[X,Y]；换 convention 会连带改符号"],
      ["|X∧Y|²", "|X|²|Y|²−⟨X,Y⟩²", formatNumber(report.sectional.denominator, 5), report.sectional.denominator > EPS ? "张成二维平面" : "退化，不能定义截面曲率"],
      ["K(σ)", "⟨R(X,Y)Y,X⟩/|X∧Y|²", formatNumber(report.sectional.value, 5), "只在非退化截面上读；这里应等于模型 K"],
      ["Ricci", "Ric(X,Y)=tr[Z↦R(Z,X)Y]", "Ric♯(X)=" + formatVector(report.ricciSharpX), "Ric(X)常表示一形式；升指标后才写成 Ric♯(X) 向量"],
      ["数量曲率 S", "tr_g Ric=n(n−1)K", formatNumber(report.scalar, 5), "n=" + report.dimension + " 的常曲率模型"],
      ["偏离", "D_T²J+R(J,T)T=0；J⊥T 时 j''+Kj=0", "j(" + formatNumber(report.geodesicS, 2) + ")/a=" + formatNumber(report.deviation, 5), "有限 s 的解，不自动给 Bonnet–Myers/Cartan–Hadamard"],
      ["小圈和乐", "Pγv−v≈A R(X,Y)v", "A=" + formatNumber(report.area, 4) + ", θ≈" + formatNumber(report.holonomy, 5), "局部首阶近似；高阶项、绕行方向和全局拓扑另算"]
    ];
    var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", {}, value); }))); });
    table.appendChild(body); tableWrap.appendChild(table); hostNode.appendChild(tableWrap);
    var boundary = report.sectional.value === null
      ? "当前 X∥Y，分母为 0；R(X,Y)Z 仍可计算，但不能把这个退化平面叫作截面。"
      : "有限维常曲率公式的对账通过；这不是对一般流形全局性质的数值证明。";
    hostNode.appendChild(element(doc, "div", { className: "rc-certificate" + (report.sectional.value === null ? " rc-blocked" : "") }, boundary + " 模型标签：" + report.modelLabel + "；" + report.vectorNote));
  }

  function mount(root, api) {
    var doc = root && root.ownerDocument;
    if (!doc) return;
    installStyles(doc); root.classList.add("rc-lab");
    var serial = INSTANCE += 1;
    var state = { modelId: "sphere", vectorId: "orthogonal", side: 0.6, geodesicS: 5, answers: { sign: null, ricci: null, deviation: null, holonomy: null }, revealed: false };
    var shell = element(doc, "div", { className: "rc-shell" });
    shell.appendChild(element(doc, "h3", {}, "黎曼曲率账本：R、截面、Ricci 与两种尺度"));
    shell.appendChild(element(doc, "p", { className: "rc-note" }, "本实验固定 R(X,Y)Z=∇X∇Y Z−∇Y∇X Z−∇[X,Y]Z，并定义 K(σ)=⟨R(X,Y)Y,X⟩/|X∧Y|²。先预测，再看有限常曲率模型的缩并与尺度。"));
    var controls = element(doc, "div", { className: "rc-controls" });
    var modelControl = element(doc, "div", { className: "rc-control" });
    modelControl.appendChild(element(doc, "label", { htmlFor: "rc-model-" + serial }, "常曲率模型"));
    var modelSelect = element(doc, "select", { id: "rc-model-" + serial, "aria-label": "选择常曲率模型" });
    MODELS.forEach(function (model) { modelSelect.appendChild(element(doc, "option", { value: model.id }, model.label)); }); modelControl.appendChild(modelSelect);
    var vectorControl = element(doc, "div", { className: "rc-control" });
    vectorControl.appendChild(element(doc, "label", { htmlFor: "rc-vector-" + serial }, "X,Y,Z"));
    var vectorSelect = element(doc, "select", { id: "rc-vector-" + serial, "aria-label": "选择曲率向量" });
    VECTOR_CASES.forEach(function (item) { vectorSelect.appendChild(element(doc, "option", { value: item.id }, item.label)); }); vectorControl.appendChild(vectorSelect);
    var sideControl = element(doc, "div", { className: "rc-control" });
    var sideLabel = element(doc, "label", {}, "小圈边长 ℓ = "); var sideOutput = element(doc, "output", {}); sideLabel.appendChild(sideOutput);
    var sideInput = element(doc, "input", { type: "range", min: "0.2", max: "1.4", step: "0.1", value: "0.6", "aria-label": "小圈边长" }); sideControl.appendChild(sideLabel); sideControl.appendChild(sideInput);
    var sControl = element(doc, "div", { className: "rc-control" });
    var sLabel = element(doc, "label", {}, "测地线长度 s = "); var sOutput = element(doc, "output", {}); sLabel.appendChild(sOutput);
    var sInput = element(doc, "input", { type: "range", min: "0", max: "8", step: "0.25", value: "5", "aria-label": "测地线长度" }); sControl.appendChild(sLabel); sControl.appendChild(sInput);
    controls.appendChild(modelControl); controls.appendChild(vectorControl); controls.appendChild(sideControl); controls.appendChild(sControl); shell.appendChild(controls);

    var prediction = element(doc, "section", { className: "rc-prediction", "aria-labelledby": "rc-prediction-title-" + serial });
    prediction.appendChild(element(doc, "strong", { className: "rc-prediction-title", id: "rc-prediction-title-" + serial }, "预测门：四项回答后才展开曲率账"));
    var questionList = element(doc, "div"); prediction.appendChild(questionList);
    var reveal = element(doc, "button", { type: "button", className: "rc-primary" }, "核对预测并揭示");
    var reset = element(doc, "button", { type: "button" }, "重置实验"); prediction.appendChild(element(doc, "div", { className: "rc-actions" }, [reveal, reset]));
    var status = element(doc, "p", { className: "rc-feedback", "aria-live": "polite", "aria-atomic": "true" }, "先回答四项预测。"); prediction.appendChild(status); shell.appendChild(prediction);
    var results = element(doc, "section", { className: "rc-results", hidden: true, "aria-live": "polite", "aria-label": "黎曼曲率计算结果" }); shell.appendChild(results); root.replaceChildren(shell);

    function questionSpecs(report) {
      return [
        { key: "sign", prompt: "1. 当前截面曲率的符号？", choices: [{ value: "positive", label: "正" }, { value: "zero", label: "零" }, { value: "negative", label: "负" }, { value: "undefined", label: "未定义（退化）" }] },
        { key: "ricci", prompt: "2. 常曲率 n 维模型的 Ric♯(X)？", choices: [{ value: "trace", label: "(n−1)K X" }, { value: "wrong-k", label: "K X" }, { value: "undefined", label: "不能由曲率缩并" }] },
        { key: "deviation", prompt: "3. 初速度为 0 的正交分离在当前 K 下？", choices: [{ value: "oscillate", label: "K>0：振荡" }, { value: "flat", label: "K=0：保持" }, { value: "grow", label: "K<0：cosh 增长" }] },
        { key: "holonomy", prompt: "4. 小圈和乐角的一阶尺度？", choices: [{ value: "K-area", label: "K × 面积" }, { value: "K-over-area", label: "K / 面积" }, { value: "area-over-K", label: "面积 / K" }] }
      ];
    }

    function renderQuestions(report) {
      clear(questionList);
      questionSpecs(report).forEach(function (question) {
        var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", {}, question.prompt));
        var options = element(doc, "div", { className: "rc-options", role: "group", "aria-label": question.prompt });
        question.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", "aria-pressed": state.answers[question.key] === choice.value ? "true" : "false" }, choice.label);
          button.addEventListener("click", function () { state.answers[question.key] = choice.value; state.revealed = false; results.hidden = true; renderQuestions(report); renderGate(); }); options.appendChild(button);
        });
        fieldset.appendChild(options); questionList.appendChild(fieldset);
      });
    }

    function renderGate() { reveal.disabled = !Object.keys(state.answers).every(function (key) { return state.answers[key] !== null; }); }
    function resetPredictions(message) { state.answers = { sign: null, ricci: null, deviation: null, holonomy: null }; state.revealed = false; results.hidden = true; if (message) { status.className = "rc-feedback rc-warn"; status.textContent = message; announce(root, api, message); } }
    function render() {
      var report = evaluateExperiment(state); modelSelect.value = state.modelId; vectorSelect.value = state.vectorId; sideInput.value = String(state.side); sInput.value = String(state.geodesicS); sideOutput.textContent = formatNumber(state.side, 2); sOutput.textContent = formatNumber(state.geodesicS, 2); renderQuestions(report); renderGate(); results.hidden = !state.revealed; if (state.revealed) renderResults(doc, results, report, serial);
    }
    modelSelect.addEventListener("change", function () { state.modelId = modelSelect.value; resetPredictions("模型已改变，请重新预测。"); render(); });
    vectorSelect.addEventListener("change", function () { state.vectorId = vectorSelect.value; resetPredictions("向量组已改变，请重新预测截面是否退化。"); render(); });
    sideInput.addEventListener("input", function () { state.side = Number(sideInput.value); resetPredictions("小圈尺度已改变，请重新预测 θ 的量纲账。"); render(); });
    sInput.addEventListener("input", function () { state.geodesicS = Number(sInput.value); resetPredictions("测地线长度已改变，请重新预测偏离行为。"); render(); });
    reveal.addEventListener("click", function () {
      var report = evaluateExperiment(state); var expected = expectedAnswers(report); var keys = Object.keys(state.answers);
      if (keys.some(function (key) { return state.answers[key] === null; })) { status.className = "rc-feedback rc-warn"; status.textContent = "请先回答四项预测。"; announce(root, api, status.textContent); return; }
      var score = keys.reduce(function (total, key) { return total + (state.answers[key] === expected[key] ? 1 : 0); }, 0);
      state.revealed = true; results.hidden = false; renderResults(doc, results, report, serial); status.className = "rc-feedback " + (score === keys.length ? "rc-pass" : "rc-warn"); status.textContent = "已揭示：命中 " + score + "/" + keys.length + "；把有限 toy 的账与一般定理的假设分开。"; announce(root, api, status.textContent);
    });
    reset.addEventListener("click", function () { state = { modelId: "sphere", vectorId: "orthogonal", side: 0.6, geodesicS: 5, answers: { sign: null, ricci: null, deviation: null, holonomy: null }, revealed: false }; status.className = "rc-feedback"; status.textContent = "已重置到球面模型；请重新预测。"; render(); announce(root, api, status.textContent); });
    render();
  }

  function assert(condition, message) { if (!condition) throw new Error("riemann-curvature: " + message); }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var e1 = vector(1, 0, 0); var e2 = vector(0, 1, 0); var e3 = vector(0, 0, 1);
    var action = riemannAction(2, e1, e2, e2);
    check(near(action[0], 2) && near(action[1], 0) && near(action[2], 0), "constant curvature R action");
    check(near(dot(riemannAction(2, e1, e2, e3), e1), 0), "orthogonal Z action");
    check(near(wedgeSquared(e1, e2), 1), "unit wedge");
    check(near(sectionalData(2, e1, e2).value, 2), "sectional sign convention");
    check(sectionalData(2, e1, scale(e1, 2)).value === null, "degenerate section rejected");
    check(near(ricciTensor(2, e1, e1, 3), 4), "Ricci tensor contraction");
    var ricci = ricciSharp(-0.25, [1, 2, 3], 3);
    check(near(ricci[0], -0.5) && near(ricci[1], -1) && near(ricci[2], -1.5), "Ricci sharp vector");
    check(near(scalarCurvature(0.25, 3), 1.5), "scalar contraction");
    check(near(deviationRatio(0, 4, 1), 1), "flat deviation");
    check(Math.abs(deviationRatio(0.25, Math.PI, 1)) < 1e-9, "positive deviation oscillation");
    check(deviationRatio(-0.25, 4, 1) > 1, "negative deviation growth");
    check(near(holonomyAngle(0.25, 0.8), 4 * holonomyAngle(0.25, 0.4)), "holonomy area scaling");
    MODELS.forEach(function (model) {
      var report = evaluateExperiment({ modelId: model.id, vectorId: "orthogonal", side: 0.6, geodesicS: 5 });
      check(near(report.sectional.value, model.K), model.id + " sectional model value");
      check(near(report.scalar, 6 * model.K), model.id + " scalar n=3");
    });
    var parallel = evaluateExperiment({ modelId: "sphere", vectorId: "parallel" });
    check(parallel.sectional.value === null && near(norm(parallel.RXYZ), 0), "parallel vectors boundary");
    return { checks: checks, models: MODELS.length };
  }

  return {
    MODELS: MODELS,
    VECTOR_CASES: VECTOR_CASES,
    riemannAction: riemannAction,
    wedgeSquared: wedgeSquared,
    sectionalData: sectionalData,
    ricciTensor: ricciTensor,
    ricciSharp: ricciSharp,
    scalarCurvature: scalarCurvature,
    deviationRatio: deviationRatio,
    holonomyAngle: holonomyAngle,
    evaluateExperiment: evaluateExperiment,
    expectedAnswers: expectedAnswers,
    mount: mount,
    selfTest: selfTest
  };
});
