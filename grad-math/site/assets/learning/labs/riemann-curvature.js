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
    { id: "sphere", label: "3维球面模型 K=+1/4", K: 0.25, note: "半径 R=2 的常曲率正模型。" },
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
    ".rc-lab *,.rc-lab *::before,.rc-lab *::after{box-sizing:border-box}.rc-lab [hidden]{display:none!important}.rc-lab h3,.rc-lab h4{margin:0;color:var(--fg);letter-spacing:0}.rc-lab h3{font-size:1.16rem}.rc-lab h4{margin-top:16px;font-size:1rem}.rc-lab p{margin:8px 0}.rc-lab .rc-note,.rc-lab .rc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.rc-lab button,.rc-lab select,.rc-lab input{font:inherit;letter-spacing:0}.rc-lab button,.rc-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.rc-lab button:hover{border-color:var(--accent)}.rc-lab [tabindex]:focus-visible,.rc-lab button:focus-visible,.rc-lab select:focus-visible,.rc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.rc-lab button[aria-pressed=true],.rc-lab button.rc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.rc-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".rc-lab .rc-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0}.rc-lab .rc-control{display:grid;gap:5px;min-width:0}.rc-lab .rc-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.rc-lab .rc-control output{color:var(--accent);font-variant-numeric:tabular-nums}.rc-lab .rc-control select{width:100%}.rc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".rc-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border)}.rc-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.rc-lab .rc-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.rc-lab .rc-options button{font-size:12px}.rc-lab .rc-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--rc-gold);background:var(--block-bg,var(--bg))}.rc-lab .rc-prediction-title{display:block;margin-bottom:7px;font-size:13px}.rc-lab .rc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.rc-lab .rc-actions>*{flex:1 1 170px}.rc-lab .rc-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.rc-lab .rc-pass{color:var(--rc-green)}.rc-lab .rc-warn{color:var(--rc-red)}",
    ".rc-lab .rc-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.rc-lab .rc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:0 0 12px}.rc-lab .rc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.rc-lab .rc-metric:nth-child(4n+1){border-color:var(--rc-blue)}.rc-lab .rc-metric:nth-child(4n+2){border-color:var(--rc-green)}.rc-lab .rc-metric:nth-child(4n+3){border-color:var(--rc-gold)}.rc-lab .rc-metric:nth-child(4n){border-color:var(--rc-red)}.rc-lab .rc-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.rc-lab .rc-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.rc-lab .rc-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto}.rc-lab .rc-svg{display:block;width:100%;min-width:760px;height:auto;color:var(--fg)}.rc-lab .rc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.rc-lab .rc-svg .rc-grid{stroke:currentColor;stroke-opacity:.17;stroke-width:1}.rc-lab .rc-svg .rc-axis{stroke:currentColor;stroke-opacity:.55;stroke-width:1.1}.rc-lab .rc-svg .rc-curve{fill:none;stroke:var(--rc-blue);stroke-width:3}.rc-lab .rc-svg .rc-flat{stroke:var(--rc-green);stroke-width:2;stroke-dasharray:6 4}.rc-lab .rc-svg .rc-loop{fill:var(--rc-gold);fill-opacity:.13;stroke:var(--rc-gold);stroke-width:2.5}.rc-lab .rc-svg .rc-arrow{fill:none;stroke:var(--rc-red);stroke-width:2.5}.rc-lab .rc-svg .rc-title{font-size:13px;font-weight:750}.rc-lab .rc-svg .rc-small{font-size:10.5px;fill:var(--fg-soft)!important}.rc-lab .rc-svg .rc-value{font-size:12px;font-weight:750}",
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
    var a = X[1]*Y[2]-X[2]*Y[1], b = X[2]*Y[0]-X[0]*Y[2], c = X[0]*Y[1]-X[1]*Y[0];
    return a*a+b*b+c*c;
  }

  function sectionalData(K, X, Y) {
    var denominator = wedgeSquared(X, Y);
    var numerator = dot(riemannAction(K, X, Y, Y), X);
    return {
      numerator: numerator,
      denominator: denominator,
      value: denominator > 0 ? numerator / denominator : null
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

  function deviationRatio(K, s, amplitude, initialSlope) {
    var a = finite(Number(amplitude)) ? Number(amplitude) : 1;
    var distance = finite(Number(s)) ? Number(s) : 0;
    var b = initialSlope === undefined ? 0 : Number(initialSlope);
    if (![K, distance, a, b].every(finite)) throw new Error("Jacobi inputs must be finite");
    if (K > 0) { var k = Math.sqrt(K); return a * Math.cos(k * distance) + b * Math.sin(k * distance) / k; }
    if (K < 0) { var k = Math.sqrt(-K); return a * Math.cosh(k * distance) + b * Math.sinh(k * distance) / k; }
    return a + b * distance;
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
    var initialMode = input.initialMode === "fan" ? "fan" : "parallel";
    var orientation = input.orientation === -1 ? -1 : 1;
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
      holonomy: orientation * holonomyAngle(model.K, side),
      orientation: orientation,
      initialMode: initialMode,
      firstZero: model.K > 0 ? (initialMode === "fan" ? Math.PI : Math.PI / 2) / Math.sqrt(model.K) : null,
      geodesicS: geodesicS,
      deviation: deviationRatio(model.K, geodesicS, initialMode === "fan" ? 0 : 1, initialMode === "fan" ? 1 : 0)
    };
  }

  function formatNumber(value, digits) {
    if (value === null || !finite(value)) return "—";
    if (value !== 0 && Math.abs(value) < .001) return value.toExponential(2);
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

  function deviationPlot(report) {
    var maxS = Math.max(1, report.geodesicS), points = [];
    for (var i = 0; i <= 160; i += 1) {
      var t = maxS * i / 160;
      points.push([t, deviationRatio(report.K, t, report.initialMode === "fan" ? 0 : 1, report.initialMode === "fan" ? 1 : 0)]);
    }
    var values = points.map(function (p) { return p[1]; });
    var lo = Math.min(0, Math.min.apply(null, values)), hi = Math.max(1, Math.max.apply(null, values));
    var pad = .1 * (hi-lo); lo -= pad; hi += pad;
    function y(v) { return 265 - (v-lo)/(hi-lo)*185; }
    return { maxS:maxS, lo:lo, hi:hi, y:y, path:points.map(function(p,i) {return (i?"L":"M")+(58+300*p[0]/maxS).toFixed(3)+" "+y(p[1]).toFixed(3);}).join(" ") };
  }

  function renderSvg(doc, report, serial) {
    var svg = svgElement(doc, "svg", { className:"rc-svg", viewBox:"0 0 760 425", role:"img", "aria-label":"有符号 Jacobi 分量与定向小圈的和乐近似" });
    function txt(x,y,t,cls,anchor) { svg.appendChild(svgElement(doc,"text",{x:x,y:y,className:cls||"rc-small","text-anchor":anchor||"start"},t)); }
    function line(x1,y1,x2,y2,cls) {svg.appendChild(svgElement(doc,"line",{x1:x1,y1:y1,x2:x2,y2:y2,className:cls||"rc-axis"}));}
    var plot = deviationPlot(report);
    txt(58,30,"Jacobi 分量：j'' + K j = 0","rc-title");
    txt(58,53, report.initialMode === "fan" ? "j(0)=0, j′(0)=1：同点出发、改变初始方向" : "j(0)=1, j′(0)=0：初始分离、初始协变变化为零");
    line(58,plot.y(0),358,plot.y(0)); line(58,80,58,265);
    (plot.hi > 10 ? [0,plot.hi/2,plot.hi] : [0,1,plot.hi]).forEach(function(v) {line(58,plot.y(v),358,plot.y(v),"rc-grid");txt(50,plot.y(v)+4,formatNumber(v,2),null,"end");});
    svg.appendChild(svgElement(doc,"path",{d:plot.path,className:"rc-curve"}));
    txt(58,285,"0");txt(358,285,formatNumber(plot.maxS,2)+"  s",null,"end");
    txt(58,310,"j("+formatNumber(report.geodesicS,2)+")="+formatNumber(report.deviation,4),"rc-value");
    txt(58,333,"j 是有符号分量；ε|j| 才是分离距离的一阶近似。");
    txt(58,356, report.firstZero === null ? "本初值无正时间零点。" : "首次正零点 s="+formatNumber(report.firstZero,4));
    txt(58,379,report.firstZero === null ? "无正零点，不能从此解推出共轭点。" : report.initialMode === "fan" ? "若 j(0)=0 且再次为零，才满足共轭点判据。" : "仅此零点是聚焦；不能据此称与起点共轭。");
    txt(420,30,"定向小圈：θ ≈ K A","rc-title");
    txt(420,53,"另取正交基 e₁ 向右、e₂ 向上；逆时针为正。");
    var side = 82 * report.side, cx = 560, cy = 160, half = side / 2;
    svg.appendChild(svgElement(doc,"rect",{x:cx-half,y:cy-half,width:side,height:side,className:"rc-loop"}));
    var start = report.orientation === 1 ? cx-half : cx+half;
    var end = report.orientation === 1 ? cx+half : cx-half;
    line(start,cy+half,end,cy+half,"rc-arrow");
    var dir=report.orientation;
    svg.appendChild(svgElement(doc,"path",{d:"M"+(end-dir*8)+" "+(cy+half-5)+" L"+end+" "+(cy+half)+" L"+(end-dir*8)+" "+(cy+half+5),className:"rc-arrow"}));
    txt(560,cy+half+24,"ℓ="+formatNumber(report.side,2)+"；A≈"+formatNumber(report.area,3),null,"middle");
    var ax=472,ay=306,r=55,angle=report.holonomy;
    line(ax,ay,ax+r,ay,"rc-flat");line(ax,ay,ax+r*Math.cos(angle),ay-r*Math.sin(angle),"rc-arrow");
    txt(420,338,"绿色：出发向量；红色：近似转回的方向。");
    txt(420,361,"θ≈"+formatNumber(angle,4)+" rad；反向绕行反号。","rc-value");
    txt(420,384,"正向 Pγ−I≈−A R(e₁,e₂)；与左侧向量组选项独立。");
    txt(58,410,"小圈用切平面方形示意；未积分完整平行移动 ODE，有限尺度高阶误差未估计。");
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
    var frame = element(doc, "div", { className: "rc-frame", tabindex: "0", role: "region", "aria-label": "曲率机制图，可横向滚动" }); frame.appendChild(renderSvg(doc, report, serial)); hostNode.appendChild(frame);
    var tableWrap = element(doc, "div", { className: "rc-table-wrap", tabindex: "0", role: "region", "aria-label": "曲率账本，可横向滚动" });
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", {}, "固定约定下的 R、截面、Ricci、标量与尺度账"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col" }, "对象"), element(doc, "th", { scope: "col" }, "定义/缩并"), element(doc, "th", { scope: "col" }, "当前值"), element(doc, "th", { scope: "col" }, "边界")
    ])));
    var rows = [
      ["R(X,Y)Z", "K(⟨Y,Z⟩X−⟨X,Z⟩Y)", formatVector(report.RXYZ), "本 lab 选 R=∇X∇Y−∇Y∇X−∇[X,Y]；换 convention 会连带改符号"],
      ["|X∧Y|²", "|X|²|Y|²−⟨X,Y⟩²", formatNumber(report.sectional.denominator, 5), report.sectional.denominator > 0 ? "张成二维平面" : "退化，不能定义截面曲率"],
      ["K(σ)", "⟨R(X,Y)Y,X⟩/|X∧Y|²", formatNumber(report.sectional.value, 5), "只在非退化截面上读；这里应等于模型 K"],
      ["Ricci", "Ric(X,Y)=tr[Z↦R(Z,X)Y]", "Ric♯(X)=" + formatVector(report.ricciSharpX), "Ric(X)常表示一形式；升指标后才写成 Ric♯(X) 向量"],
      ["标量曲率 S", "tr_g Ric=n(n−1)K", formatNumber(report.scalar, 5), "n=" + report.dimension + " 的常曲率模型"],
      ["偏离", "D_T²J+R(J,T)T=0；J⊥T 时 j''+Kj=0", "j(" + formatNumber(report.geodesicS, 2) + ")=" + formatNumber(report.deviation, 5), "有限 s 的解，不自动给 Bonnet–Myers/Cartan–Hadamard"],
      ["小圈和乐", "正向 Pγv−v≈−A R(e₁,e₂)v", "A=" + formatNumber(report.area, 4) + ", θ≈" + formatNumber(report.holonomy, 5), "另用正交 e₁,e₂ 作局部首阶近似；不是所选 X,Y 的圈"]
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
    var state = { modelId: "sphere", vectorId: "orthogonal", side: 0.6, geodesicS: 5, initialMode: "parallel", orientation: 1, answers: { sign: null, ricci: null, deviation: null, holonomy: null }, revealed: false };
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
    var initialSelect = element(doc,"select",{"aria-label":"Jacobi 初值"},[element(doc,"option",{value:"parallel"},"初始分离：j(0)=1, j′(0)=0"),element(doc,"option",{value:"fan"},"同点扇出：j(0)=0, j′(0)=1")]);
    var directionSelect = element(doc,"select",{"aria-label":"绕行方向"},[element(doc,"option",{value:"1"},"逆时针（正向）"),element(doc,"option",{value:"-1"},"顺时针（反向）")]);
    controls.appendChild(element(doc,"div",{className:"rc-control"},[element(doc,"span",{},"Jacobi 初值"),initialSelect]));
    controls.appendChild(element(doc,"div",{className:"rc-control"},[element(doc,"span",{},"绕行方向"),directionSelect]));
    initialSelect.addEventListener("change",function(){state.initialMode=initialSelect.value;resetPredictions("初值已改变，请重新预测。");render();});
    directionSelect.addEventListener("change",function(){state.orientation=Number(directionSelect.value);resetPredictions("绕行方向已改变，请重新预测。");render();});

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
        { key: "deviation", prompt: "3. 所选初值的 Jacobi 分量在当前 K 下？", choices: [{ value: "oscillate", label: "K>0：振荡" }, { value: "flat", label: "K=0：线性（可为常数）" }, { value: "grow", label: "K<0：双曲函数增长" }] },
        { key: "holonomy", prompt: "4. 小圈和乐角的一阶尺度？", choices: [{ value: "K-area", label: "K × 面积" }, { value: "K-over-area", label: "K / 面积" }, { value: "area-over-K", label: "面积 / K" }] }
      ];
    }

    function renderQuestions(report) {
      clear(questionList);
      questionSpecs(report).forEach(function (question) {
        var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", {}, question.prompt));
        var options = element(doc, "div", { className: "rc-options", role: "group", "aria-label": question.prompt });
        question.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", "data-key":question.key, "data-value":choice.value, "aria-pressed": state.answers[question.key] === choice.value ? "true" : "false" }, choice.label);
          button.addEventListener("click", function () { state.answers[question.key] = choice.value; state.revealed = false; results.hidden = true; renderQuestions(report); renderGate(); questionList.querySelector('[data-key="'+question.key+'"][data-value="'+choice.value+'"]').focus(); }); options.appendChild(button);
        });
        fieldset.appendChild(options); questionList.appendChild(fieldset);
      });
    }

    function renderGate() { reveal.disabled = !Object.keys(state.answers).every(function (key) { return state.answers[key] !== null; }); }
    function resetPredictions(message) { state.answers = { sign: null, ricci: null, deviation: null, holonomy: null }; state.revealed = false; results.hidden = true; if (message) { status.className = "rc-feedback rc-warn"; status.textContent = message; announce(root, api, message); } }
    function render() {
      var report = evaluateExperiment(state); initialSelect.value=state.initialMode; directionSelect.value=String(state.orientation); modelSelect.value = state.modelId; vectorSelect.value = state.vectorId; sideInput.value = String(state.side); sInput.value = String(state.geodesicS); sideOutput.textContent = formatNumber(state.side, 2); sOutput.textContent = formatNumber(state.geodesicS, 2); renderQuestions(report); renderGate(); results.hidden = !state.revealed; if (state.revealed) renderResults(doc, results, report, serial);
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
    reset.addEventListener("click", function () { state = { modelId: "sphere", vectorId: "orthogonal", side: 0.6, geodesicS: 5, initialMode: "parallel", orientation: 1, answers: { sign: null, ricci: null, deviation: null, holonomy: null }, revealed: false }; status.className = "rc-feedback"; status.textContent = "已重置到球面模型；请重新预测。"; render(); announce(root, api, status.textContent); });
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
