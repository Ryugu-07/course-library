(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("surface-curvature", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("surface-curvature self-test: PASS (" + report.checks + " checks, " + report.surfaces + " surfaces)");
    } catch (error) {
      console.error("surface-curvature self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "surface-curvature-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;

  var SURFACES = [
    {
      id: "plane",
      label: "平面",
      note: "两个主曲率都为 0：这是 K=0 的平面点。",
      u: 0.3,
      v: -0.2,
      uMin: -1,
      uMax: 1,
      step: 0.05
    },
    {
      id: "sphere",
      label: "球面",
      note: "这里取半径 R=2 的外向法向；按 II=⟨rᵢⱼ,n⟩ 约定，H 为负。",
      u: 0.25,
      v: 0.65,
      uMin: -1.05,
      uMax: 1.05,
      step: 0.05
    },
    {
      id: "cylinder",
      label: "圆柱",
      note: "一个主曲率为 0、另一个不为 0：这是 K=0 的抛物点。",
      u: 0.8,
      v: 0.4,
      uMin: -3.14,
      uMax: 3.14,
      step: 0.05
    },
    {
      id: "saddle",
      label: "鞍面",
      note: "原点附近 z=u²−v²；两条主方向反向弯，K<0。",
      u: 0,
      v: 0,
      uMin: -0.8,
      uMax: 0.8,
      step: 0.05
    }
  ];

  var STYLE_TEXT = [
    ".sc-lab{--sc-blue:var(--cl-blue,#315f9d);--sc-green:var(--cl-green,#39734d);--sc-gold:var(--cl-gold,#9b6a12);--sc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".sc-lab *,.sc-lab *::before,.sc-lab *::after{box-sizing:border-box}.sc-lab [hidden]{display:none!important}.sc-lab h3,.sc-lab h4{margin:0;color:var(--fg);letter-spacing:0}.sc-lab h3{font-size:1.16rem}.sc-lab h4{margin-top:16px;font-size:1rem}.sc-lab p{margin:8px 0}.sc-lab .sc-note,.sc-lab .sc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.sc-lab button,.sc-lab select,.sc-lab input{font:inherit;letter-spacing:0}.sc-lab button,.sc-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.sc-lab button:hover{border-color:var(--accent)}.sc-lab button:focus-visible,.sc-lab select:focus-visible,.sc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.sc-lab button[aria-pressed=true],.sc-lab button.sc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.sc-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".sc-lab .sc-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:12px 0}.sc-lab .sc-presets button{font-size:12.5px}.sc-lab .sc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0}.sc-lab .sc-control{display:grid;gap:5px;min-width:0}.sc-lab .sc-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.sc-lab .sc-control output{color:var(--accent);font-variant-numeric:tabular-nums}.sc-lab .sc-control select{width:100%}.sc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".sc-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border)}.sc-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.sc-lab .sc-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.sc-lab .sc-options button{font-size:12px}.sc-lab .sc-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--sc-gold);background:var(--block-bg,var(--bg))}.sc-lab .sc-prediction-title{display:block;margin-bottom:7px;font-size:13px}.sc-lab .sc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.sc-lab .sc-actions>*{flex:1 1 170px}.sc-lab .sc-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.sc-lab .sc-pass{color:var(--sc-green)}.sc-lab .sc-warn{color:var(--sc-red)}",
    ".sc-lab .sc-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.sc-lab .sc-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.sc-lab .sc-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.sc-lab .sc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.sc-lab .sc-svg .sc-grid{stroke:currentColor;stroke-opacity:.17;stroke-width:1}.sc-lab .sc-svg .sc-axis{stroke:currentColor;stroke-opacity:.55;stroke-width:1.2}.sc-lab .sc-svg .sc-shape{fill:var(--sc-blue);fill-opacity:.15;stroke:var(--sc-blue);stroke-width:3}.sc-lab .sc-svg .sc-kbar{fill:var(--sc-blue)}.sc-lab .sc-svg .sc-hbar{fill:var(--sc-red)}.sc-lab .sc-svg .sc-zero{stroke:currentColor;stroke-width:1.5}.sc-lab .sc-svg .sc-title{font-size:13px;font-weight:750}.sc-lab .sc-svg .sc-small{font-size:10.5px;fill:var(--fg-soft)!important}.sc-lab .sc-svg .sc-value{font-size:12px;font-weight:750}.sc-lab .sc-legend{display:flex;flex-wrap:wrap;gap:8px 16px;margin:7px 0 0;color:var(--fg-soft);font-size:12px}.sc-lab .sc-legend span{display:inline-flex;align-items:center;gap:5px}.sc-lab .sc-swatch{display:inline-block;width:18px;height:4px}.sc-lab .sc-swatch-k{background:var(--sc-blue)}.sc-lab .sc-swatch-h{background:var(--sc-red)}",
    "@media(max-width:820px){.sc-lab .sc-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.sc-lab .sc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.sc-lab .sc-options{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.sc-lab .sc-controls{grid-template-columns:minmax(0,1fr)}.sc-lab .sc-options{grid-template-columns:minmax(0,1fr)}.sc-lab .sc-prediction{padding:10px}.sc-lab .sc-frame{padding:4px}}@media(max-width:420px){.sc-lab .sc-presets{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.sc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-8) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function vec(x, y, z) { return [x, y, z]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { return Math.sqrt(dot(a, a)); }
  function scale(a, factor) { return [a[0] * factor, a[1] * factor, a[2] * factor]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }

  function surfaceById(id) {
    for (var index = 0; index < SURFACES.length; index += 1) {
      if (SURFACES[index].id === id) return SURFACES[index];
    }
    return SURFACES[0];
  }

  function evaluateSurface(id, u, v, normalSign) {
    var name = surfaceById(id).id;
    var uu = finite(Number(u)) ? Number(u) : surfaceById(name).u;
    var vv = finite(Number(v)) ? Number(v) : surfaceById(name).v;
    var sign = Number(normalSign) < 0 ? -1 : 1;
    var point;
    var ru;
    var rv;
    var ruu;
    var ruv;
    var rvv;
    var normal;
    var R;
    var a;

    if (name === "sphere") {
      R = 2;
      point = vec(R * Math.cos(uu) * Math.cos(vv), R * Math.cos(uu) * Math.sin(vv), R * Math.sin(uu));
      ru = vec(-R * Math.sin(uu) * Math.cos(vv), -R * Math.sin(uu) * Math.sin(vv), R * Math.cos(uu));
      rv = vec(-R * Math.cos(uu) * Math.sin(vv), R * Math.cos(uu) * Math.cos(vv), 0);
      ruu = vec(-R * Math.cos(uu) * Math.cos(vv), -R * Math.cos(uu) * Math.sin(vv), -R * Math.sin(uu));
      ruv = vec(R * Math.sin(uu) * Math.sin(vv), -R * Math.sin(uu) * Math.cos(vv), 0);
      rvv = vec(-R * Math.cos(uu) * Math.cos(vv), -R * Math.cos(uu) * Math.sin(vv), 0);
      normal = scale(point, sign / R);
    } else if (name === "cylinder") {
      a = 1.5;
      point = vec(a * Math.cos(uu), a * Math.sin(uu), vv);
      ru = vec(-a * Math.sin(uu), a * Math.cos(uu), 0);
      rv = vec(0, 0, 1);
      ruu = vec(-a * Math.cos(uu), -a * Math.sin(uu), 0);
      ruv = vec(0, 0, 0);
      rvv = vec(0, 0, 0);
      normal = vec(sign * Math.cos(uu), sign * Math.sin(uu), 0);
    } else if (name === "saddle") {
      point = vec(uu, vv, uu * uu - vv * vv);
      ru = vec(1, 0, 2 * uu);
      rv = vec(0, 1, -2 * vv);
      ruu = vec(0, 0, 2);
      ruv = vec(0, 0, 0);
      rvv = vec(0, 0, -2);
      normal = scale(cross(ru, rv), sign / norm(cross(ru, rv)));
    } else {
      point = vec(uu, vv, 0);
      ru = vec(1, 0, 0);
      rv = vec(0, 1, 0);
      ruu = vec(0, 0, 0);
      ruv = vec(0, 0, 0);
      rvv = vec(0, 0, 0);
      normal = vec(0, 0, sign);
    }

    var E = dot(ru, ru);
    var F = dot(ru, rv);
    var G = dot(rv, rv);
    var L = dot(ruu, normal);
    var M = dot(ruv, normal);
    var N = dot(rvv, normal);
    var determinant = E * G - F * F;
    var K = (L * N - M * M) / determinant;
    var H = (E * N - 2 * F * M + G * L) / (2 * determinant);
    var discriminant = Math.max(0, H * H - K);
    var root = Math.sqrt(discriminant);
    var k1 = H + root;
    var k2 = H - root;
    var type = classifyPoint(k1, k2, K);
    return {
      id: name,
      u: uu,
      v: vv,
      point: point,
      normal: normal,
      first: { E: E, F: F, G: G, determinant: determinant },
      second: { L: L, M: M, N: N },
      principal: [k1, k2],
      K: K,
      H: H,
      type: type,
      normalSign: sign
    };
  }

  function classifyPoint(k1, k2, K) {
    if (Math.abs(K) <= 1e-8) {
      if (Math.abs(k1) <= 1e-8 && Math.abs(k2) <= 1e-8) return "平面点";
      return "抛物点";
    }
    return K > 0 ? "椭圆点" : "双曲点";
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    var text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
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

  function element(doc, tag, attrs, children) {
    return append(setAttrs(doc.createElement(tag), attrs), children, doc);
  }

  function svgElement(doc, tag, attrs, children) {
    return append(setAttrs(doc.createElementNS(SVG_NS, tag), attrs), children, doc);
  }

  function clear(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") node.replaceChildren();
    else while (node.firstChild) node.removeChild(node.firstChild);
  }

  function announce(root, api, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function expectedAnswers(data) {
    var sign = data.K > EPS ? "positive" : data.K < -EPS ? "negative" : "zero";
    var pattern = data.type === "平面点" ? "both-zero" : data.type === "抛物点" ? "one-zero" : data.K > 0 ? "same-sign" : "opposite-sign";
    return { sign: sign, zeroType: data.type === "平面点" ? "plane" : data.type === "抛物点" ? "parabolic" : "not-zero", pattern: pattern, normal: "flip-h" };
  }

  function renderSvg(doc, data, serial) {
    var width = 760;
    var height = 380;
    var svg = svgElement(doc, "svg", {
      className: "sc-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": "sc-svg-title-" + serial + " sc-svg-desc-" + serial
    });
    svg.appendChild(svgElement(doc, "title", { id: "sc-svg-title-" + serial }, "曲率曲线与 K、H 双账本"));
    svg.appendChild(svgElement(doc, "desc", { id: "sc-svg-desc-" + serial }, "上方是当前曲面的示意剖面，下方分别以蓝色显示内在高斯曲率 K，以红色显示依赖法向的外在平均曲率 H。"));
    var path;
    if (data.id === "sphere") path = "M 55 138 Q 170 18 285 138";
    else if (data.id === "cylinder") path = "M 55 76 Q 170 18 285 76 L 285 135 Q 170 192 55 135 Z";
    else if (data.id === "saddle") path = "M 55 92 Q 112 166 170 92 Q 228 18 285 92";
    else path = "M 55 110 L 285 110";
    svg.appendChild(svgElement(doc, "text", { x: "55", y: "28", className: "sc-title" }, surfaceById(data.id).label + " 点型：" + data.type));
    svg.appendChild(svgElement(doc, "path", { d: path, className: "sc-shape" }));
    svg.appendChild(svgElement(doc, "line", { x1: "55", y1: "142", x2: "285", y2: "142", className: "sc-grid" }));
    svg.appendChild(svgElement(doc, "text", { x: "55", y: "174", className: "sc-small" }, "示意曲面剖面；计算来自 I、II，而非图形像素"));

    var center = 495;
    var barScale = 38;
    var kLength = Math.min(115, Math.abs(data.K) * barScale);
    var hLength = Math.min(115, Math.abs(data.H) * barScale);
    svg.appendChild(svgElement(doc, "text", { x: "345", y: "53", className: "sc-title" }, "内在 K = k₁k₂"));
    svg.appendChild(svgElement(doc, "text", { x: "345", y: "72", className: "sc-small" }, "由第一基本形式及其导数决定；不随法向翻转"));
    svg.appendChild(svgElement(doc, "line", { x1: String(center), y1: "84", x2: String(center), y2: "145", className: "sc-zero" }));
    svg.appendChild(svgElement(doc, "line", { x1: "380", y1: "145", x2: "610", y2: "145", className: "sc-axis" }));
    if (data.K >= 0) svg.appendChild(svgElement(doc, "rect", { x: String(center), y: "108", width: String(kLength), height: "22", className: "sc-kbar" }));
    else svg.appendChild(svgElement(doc, "rect", { x: String(center - kLength), y: "108", width: String(kLength), height: "22", className: "sc-kbar" }));
    svg.appendChild(svgElement(doc, "text", { x: String(center + (data.K >= 0 ? kLength + 7 : -kLength - 7)), y: "124", className: "sc-value", "text-anchor": data.K >= 0 ? "start" : "end" }, formatNumber(data.K, 4)));
    svg.appendChild(svgElement(doc, "text", { x: "345", y: "205", className: "sc-title" }, "外在 H = (k₁+k₂)/2"));
    svg.appendChild(svgElement(doc, "text", { x: "345", y: "224", className: "sc-small" }, "依赖所选法向；翻转 n 会翻转 H、k₁、k₂"));
    svg.appendChild(svgElement(doc, "line", { x1: String(center), y1: "236", x2: String(center), y2: "297", className: "sc-zero" }));
    svg.appendChild(svgElement(doc, "line", { x1: "380", y1: "297", x2: "610", y2: "297", className: "sc-axis" }));
    if (data.H >= 0) svg.appendChild(svgElement(doc, "rect", { x: String(center), y: "260", width: String(hLength), height: "22", className: "sc-hbar" }));
    else svg.appendChild(svgElement(doc, "rect", { x: String(center - hLength), y: "260", width: String(hLength), height: "22", className: "sc-hbar" }));
    svg.appendChild(svgElement(doc, "text", { x: String(center + (data.H >= 0 ? hLength + 7 : -hLength - 7)), y: "276", className: "sc-value", "text-anchor": data.H >= 0 ? "start" : "end" }, formatNumber(data.H, 4)));
    svg.appendChild(svgElement(doc, "text", { x: "380", y: "322", className: "sc-small" }, "负"));
    svg.appendChild(svgElement(doc, "text", { x: String(center), y: "322", className: "sc-small", "text-anchor": "middle" }, "0"));
    svg.appendChild(svgElement(doc, "text", { x: "610", y: "322", className: "sc-small", "text-anchor": "end" }, "正"));
    return svg;
  }

  function renderResults(doc, hostNode, data, serial) {
    clear(hostNode);
    var metrics = element(doc, "div", { className: "sc-metrics" });
    [
      ["点型", data.type],
      ["主曲率 k₁", formatNumber(data.principal[0], 5)],
      ["主曲率 k₂", formatNumber(data.principal[1], 5)],
      ["K（内在）", formatNumber(data.K, 5)],
      ["H（外在）", formatNumber(data.H, 5)]
    ].forEach(function (row) {
      metrics.appendChild(element(doc, "div", { className: "sc-metric" }, [element(doc, "span", {}, row[0]), element(doc, "strong", {}, row[1])]));
    });
    hostNode.appendChild(metrics);
    var frame = element(doc, "div", { className: "sc-frame" });
    frame.appendChild(renderSvg(doc, data, serial));
    frame.appendChild(element(doc, "div", { className: "sc-legend" }, [
      element(doc, "span", {}, [element(doc, "i", { className: "sc-swatch sc-swatch-k" }), "内在 K：I 的曲率账"]),
      element(doc, "span", {}, [element(doc, "i", { className: "sc-swatch sc-swatch-h" }), "外在 H：相对于法向的平均弯曲"])
    ]));
    hostNode.appendChild(frame);
    var tableWrap = element(doc, "div", { className: "sc-table-wrap" });
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", {}, "第一、第二基本形式与主曲率对账"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col" }, "账本"), element(doc, "th", { scope: "col" }, "公式"), element(doc, "th", { scope: "col" }, "当前值"), element(doc, "th", { scope: "col" }, "读法")
    ])));
    var rows = [
      ["I", "E du² + 2F du dv + G dv²", "E=" + formatNumber(data.first.E, 5) + ", F=" + formatNumber(data.first.F, 5) + ", G=" + formatNumber(data.first.G, 5), "长度、角度、面积；内在"],
      ["II", "L du² + 2M du dv + N dv²", "L=" + formatNumber(data.second.L, 5) + ", M=" + formatNumber(data.second.M, 5) + ", N=" + formatNumber(data.second.N, 5), "相对所选 n 的外在弯曲"],
      ["主曲率", "eig(I⁻¹II)", formatNumber(data.principal[0], 5) + ", " + formatNumber(data.principal[1], 5), "法曲率的最大/最小值"],
      ["K", "(LN−M²)/(EG−F²)=k₁k₂", formatNumber(data.K, 5), "内在高斯曲率；n 翻转不变"],
      ["H", "(EN−2FM+GL)/(2(EG−F²))=(k₁+k₂)/2", formatNumber(data.H, 5), "外在平均曲率；n 翻转变号"],
      ["分类", "按 K 与 (k₁,k₂)", data.type, data.K === 0 ? "K=0 还要看零主曲率的个数" : "K 的符号区分椭圆点/双曲点"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", {}, value); }))); });
    table.appendChild(body);
    tableWrap.appendChild(table);
    hostNode.appendChild(tableWrap);
    var boundary = data.type === "平面点"
      ? "当前是平面点：k₁=k₂=0。它不是“可展/抛物”标签的替代品。"
      : data.type === "抛物点"
        ? "当前是抛物点：恰有一个主曲率为 0；圆柱在正则点属于此类。K=0 本身没有告诉你是哪一种。"
        : "这是有限参数点的恒等式对账；它展示公式如何相容，不是由四个模型推出任意曲面的分类定理。";
    hostNode.appendChild(element(doc, "div", { className: "sc-certificate" }, boundary + " 法向 sign=" + data.normalSign + "；若换成 −n，K 保持而 H 与两项主曲率同时变号。"));
  }

  function mount(root, api) {
    var doc = root && root.ownerDocument;
    if (!doc) return;
    installStyles(doc);
    root.classList.add("sc-lab");
    var serial = INSTANCE += 1;
    var state = {
      id: "plane",
      u: surfaceById("plane").u,
      v: surfaceById("plane").v,
      normalSign: 1,
      answers: { sign: null, zeroType: null, pattern: null, normal: null },
      revealed: false
    };
    var shell = element(doc, "div", { className: "sc-shell" });
    shell.appendChild(element(doc, "h3", {}, "曲率对账台：先判点型，再揭示 I、II、K、H"));
    shell.appendChild(element(doc, "p", { className: "sc-note" }, "四个固定模型只做可计算的局部示范。第一基本形式负责内在测量；第二基本形式随法向改变。先预测，结果区会保持隐藏。"));

    var presets = element(doc, "div", { className: "sc-presets" });
    SURFACES.forEach(function (surface) {
      var button = element(doc, "button", { type: "button", "aria-pressed": surface.id === state.id ? "true" : "false" }, surface.label);
      button.addEventListener("click", function () {
        state.id = surface.id;
        state.u = surface.u;
        state.v = surface.v;
        state.answers = { sign: null, zeroType: null, pattern: null, normal: null };
        state.revealed = false;
        render();
        status.textContent = "已切换到" + surface.label + "；请重新预测。";
        announce(root, api, status.textContent);
      });
      presets.appendChild(button);
    });
    shell.appendChild(presets);

    var controls = element(doc, "div", { className: "sc-controls" });
    var uControl = element(doc, "div", { className: "sc-control" });
    var uLabel = element(doc, "label", {}, "参数 u = ");
    var uOutput = element(doc, "output", {});
    var uInput = element(doc, "input", { type: "range", "aria-label": "曲面参数 u" });
    uLabel.appendChild(uOutput); uControl.appendChild(uLabel); uControl.appendChild(uInput);
    var vControl = element(doc, "div", { className: "sc-control" });
    var vLabel = element(doc, "label", {}, "参数 v = ");
    var vOutput = element(doc, "output", {});
    var vInput = element(doc, "input", { type: "range", min: "-3.14", max: "3.14", step: "0.05", "aria-label": "曲面参数 v" });
    vLabel.appendChild(vOutput); vControl.appendChild(vLabel); vControl.appendChild(vInput);
    var normalControl = element(doc, "div", { className: "sc-control" });
    var normalLabel = element(doc, "label", { htmlFor: "sc-normal-" + serial }, "法向方向");
    var normalSelect = element(doc, "select", { id: "sc-normal-" + serial, "aria-label": "选择法向方向" }, [
      element(doc, "option", { value: "1" }, "+n（当前约定）"),
      element(doc, "option", { value: "-1" }, "−n（反向）")
    ]);
    normalControl.appendChild(normalLabel); normalControl.appendChild(normalSelect);
    controls.appendChild(uControl); controls.appendChild(vControl); controls.appendChild(normalControl); shell.appendChild(controls);

    var prediction = element(doc, "section", { className: "sc-prediction", "aria-labelledby": "sc-prediction-title-" + serial });
    prediction.appendChild(element(doc, "strong", { className: "sc-prediction-title", id: "sc-prediction-title-" + serial }, "预测门：四项回答后才揭示曲率账本"));
    var questionList = element(doc, "div");
    prediction.appendChild(questionList);
    var reveal = element(doc, "button", { type: "button", className: "sc-primary" }, "核对预测并揭示");
    var reset = element(doc, "button", { type: "button" }, "重置实验");
    var actionRow = element(doc, "div", { className: "sc-actions" }, [reveal, reset]);
    prediction.appendChild(actionRow);
    var status = element(doc, "p", { className: "sc-feedback", "aria-live": "polite", "aria-atomic": "true" }, "先回答四项预测。");
    prediction.appendChild(status); shell.appendChild(prediction);
    var results = element(doc, "section", { className: "sc-results", hidden: true, "aria-live": "polite", "aria-label": "曲率计算结果" });
    shell.appendChild(results);
    root.replaceChildren(shell);

    function questions(data) {
      return [
        { key: "sign", prompt: "1. 当前 K 的符号？", choices: [{ value: "positive", label: "正" }, { value: "zero", label: "零" }, { value: "negative", label: "负" }] },
        { key: "zeroType", prompt: "2. 若 K=0，当前应区分为？", choices: [{ value: "plane", label: "平面点" }, { value: "parabolic", label: "抛物点" }, { value: "not-zero", label: "本题不适用" }] },
        { key: "pattern", prompt: "3. 两个主曲率的模式？", choices: [{ value: "both-zero", label: "都为 0" }, { value: "one-zero", label: "恰一个为 0" }, { value: "same-sign", label: "同号且非零" }, { value: "opposite-sign", label: "异号" }] },
        { key: "normal", prompt: "4. 把 n 换成 −n 会怎样？", choices: [{ value: "flip-h", label: "H 与 kᵢ 变号，K 不变" }, { value: "flip-k", label: "K 变号，H 不变" }, { value: "nothing", label: "都不变" }] }
      ];
    }

    function renderQuestions(data) {
      clear(questionList);
      questions(data).forEach(function (question, index) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", {}, question.prompt));
        var options = element(doc, "div", { className: "sc-options", role: "group", "aria-label": question.prompt });
        question.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", "aria-pressed": state.answers[question.key] === choice.value ? "true" : "false" }, choice.label);
          button.addEventListener("click", function () {
            state.answers[question.key] = choice.value;
            state.revealed = false;
            results.hidden = true;
            renderQuestions(data);
            renderGate();
          });
          options.appendChild(button);
        });
        fieldset.appendChild(options); questionList.appendChild(fieldset);
      });
    }

    function renderGate() {
      var ready = Object.keys(state.answers).every(function (key) { return state.answers[key] !== null; });
      reveal.disabled = !ready;
    }

    function render() {
      var surface = surfaceById(state.id);
      var data = evaluateSurface(state.id, state.u, state.v, state.normalSign);
      Array.prototype.forEach.call(presets.children, function (button, index) { button.setAttribute("aria-pressed", SURFACES[index].id === state.id ? "true" : "false"); });
      uInput.min = String(surface.uMin); uInput.max = String(surface.uMax); uInput.step = String(surface.step); uInput.value = String(state.u); uOutput.textContent = formatNumber(state.u, 2);
      vInput.value = String(state.v); vOutput.textContent = formatNumber(state.v, 2);
      normalSelect.value = String(state.normalSign);
      renderQuestions(data); renderGate();
      results.hidden = !state.revealed;
      if (state.revealed) renderResults(doc, results, data, serial);
    }

    function resetPredictions(message) {
      state.answers = { sign: null, zeroType: null, pattern: null, normal: null };
      state.revealed = false; results.hidden = true; renderGate();
      if (message) { status.className = "sc-feedback sc-warn"; status.textContent = message; announce(root, api, message); }
    }

    uInput.addEventListener("input", function () { state.u = Number(uInput.value); resetPredictions("参数已改变，请重新预测。"); render(); });
    vInput.addEventListener("input", function () { state.v = Number(vInput.value); resetPredictions("参数已改变，请重新预测。"); render(); });
    normalSelect.addEventListener("change", function () { state.normalSign = Number(normalSelect.value); resetPredictions("法向已改变，请重新预测 H 的符号。"); render(); });
    reveal.addEventListener("click", function () {
      var data = evaluateSurface(state.id, state.u, state.v, state.normalSign);
      var expected = expectedAnswers(data);
      var keys = Object.keys(state.answers);
      if (keys.some(function (key) { return state.answers[key] === null; })) {
        status.className = "sc-feedback sc-warn"; status.textContent = "请先回答四项预测。"; announce(root, api, status.textContent); return;
      }
      var score = keys.reduce(function (total, key) { return total + (state.answers[key] === expected[key] ? 1 : 0); }, 0);
      state.revealed = true; results.hidden = false; renderResults(doc, results, data, serial);
      status.className = "sc-feedback " + (score === keys.length ? "sc-pass" : "sc-warn");
      status.textContent = "已揭示：命中 " + score + "/" + keys.length + "；" + data.type + " 的 K/H 已分别对账。";
      announce(root, api, status.textContent);
    });
    reset.addEventListener("click", function () {
      state.id = "plane"; state.u = surfaceById("plane").u; state.v = surfaceById("plane").v; state.normalSign = 1; state.answers = { sign: null, zeroType: null, pattern: null, normal: null }; state.revealed = false;
      status.className = "sc-feedback"; status.textContent = "已重置到平面点；请重新预测。"; render(); announce(root, api, status.textContent);
    });
    render();
  }

  function assert(condition, message) {
    if (!condition) throw new Error("surface-curvature: " + message);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var expectedTypes = { plane: "平面点", sphere: "椭圆点", cylinder: "抛物点", saddle: "双曲点" };
    SURFACES.forEach(function (surface) {
      var data = evaluateSurface(surface.id, surface.u, surface.v, 1);
      check(finite(data.first.determinant) && data.first.determinant > 0, surface.id + " regular parameterization");
      check(near(data.K, data.principal[0] * data.principal[1], 2e-8), surface.id + " K product");
      check(near(data.H, (data.principal[0] + data.principal[1]) / 2, 2e-8), surface.id + " H average");
      check(data.type === expectedTypes[surface.id], surface.id + " point classification");
      var flipped = evaluateSurface(surface.id, surface.u, surface.v, -1);
      check(near(flipped.K, data.K, 2e-8), surface.id + " K normal invariance");
      check(near(flipped.H, -data.H, 2e-8), surface.id + " H normal sign");
      check(near(flipped.second.L, -data.second.L, 2e-8) && near(flipped.second.N, -data.second.N, 2e-8), surface.id + " II normal sign");
    });
    var saddle = evaluateSurface("saddle", 0, 0, 1);
    check(near(saddle.second.L, 2) && near(saddle.second.N, -2), "saddle II at origin");
    var cylinder = evaluateSurface("cylinder", 0, 0, 1);
    check(Math.abs(cylinder.K) < 1e-10 && ((Math.abs(cylinder.principal[0]) > 1e-6 && Math.abs(cylinder.principal[1]) < 1e-10) || (Math.abs(cylinder.principal[1]) > 1e-6 && Math.abs(cylinder.principal[0]) < 1e-10)), "cylinder separates parabolic from plane");
    return { checks: checks, surfaces: SURFACES.length };
  }

  return {
    SURFACES: SURFACES,
    evaluateSurface: evaluateSurface,
    classifyPoint: classifyPoint,
    expectedAnswers: expectedAnswers,
    mount: mount,
    selfTest: selfTest
  };
});
