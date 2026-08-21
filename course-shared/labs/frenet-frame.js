(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("frenet-frame", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("frenet-frame self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("frenet-frame self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var EPS = 1e-10;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "frenet-frame-lab-styles";
  var INSTANCE = 0;

  var PRESETS = [
    {
      id: "line",
      label: "直线",
      note: "正则但 κ=0：切向量存在，主法向量与副法向量没有 Frenet 定义。",
      parameter: 0.8,
      minimum: -2,
      maximum: 2,
      step: 0.05
    },
    {
      id: "circle",
      label: "圆",
      note: "半径 R=2；speed 与弧长会随参数速度改变，但 κ=1/R、τ=0 不变。",
      parameter: 0.8,
      minimum: -Math.PI,
      maximum: Math.PI,
      step: 0.05
    },
    {
      id: "helix",
      label: "圆柱螺旋线",
      note: "a=2,b=1；κ=2/5、τ=1/5 同时非零，展示真正三维扭转。",
      parameter: 0.8,
      minimum: -Math.PI,
      maximum: Math.PI,
      step: 0.05
    },
    {
      id: "inflection",
      label: "拐点三次曲线",
      note: "r(t)=(t,t³,0) 在 t=0 处正则但 κ=0；这是 N 失败的结构性边界。",
      parameter: 0.8,
      minimum: -1.25,
      maximum: 1.25,
      step: 0.05
    }
  ];

  var STYLE_TEXT = [
    ".ff-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}",
    ".ff-lab *,.ff-lab *::before,.ff-lab *::after{box-sizing:border-box}.ff-lab [hidden]{display:none!important}",
    ".ff-lab h3,.ff-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.ff-lab h3{font-size:1.14rem}.ff-lab h4{font-size:1rem}.ff-lab p{margin:8px 0}",
    ".ff-lab .ff-note,.ff-lab .ff-feedback,.ff-lab .ff-status{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
    ".ff-lab button,.ff-lab input{font:inherit}.ff-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ff-lab button:hover{border-color:var(--accent,#1769aa)}.ff-lab button:focus-visible,.ff-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ff-lab button[aria-pressed=true],.ff-lab button.ff-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.ff-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".ff-lab .ff-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0}.ff-lab .ff-presets button{font-size:12px}",
    ".ff-lab .ff-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin:12px 0}.ff-lab .ff-control{display:grid;gap:4px;min-width:0}.ff-lab .ff-control label{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.ff-lab .ff-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums}.ff-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#1769aa)}",
    ".ff-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.ff-lab legend{max-width:100%;padding:0 4px;color:var(--fg,#20252b);font-size:13px;font-weight:750;line-height:1.5}.ff-lab .ff-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.ff-lab .ff-choice-grid button{font-size:12px}",
    ".ff-lab .ff-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#9a6b12);background:var(--block-bg,var(--bg,#fff))}.ff-lab .ff-prediction-title{display:block;margin-bottom:8px;font-size:13px}.ff-lab .ff-question{margin:10px 0}.ff-lab .ff-question legend{margin-bottom:6px}.ff-lab .ff-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.ff-lab .ff-pass{color:var(--cl-green,#2f7547)}.ff-lab .ff-warn{color:var(--cl-red,#b43d32)}.ff-lab .ff-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.ff-lab .ff-actions>*{flex:1 1 170px}",
    ".ff-lab .ff-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#c8cdd3)}.ff-lab .ff-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.ff-lab .ff-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff))}.ff-lab .ff-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.ff-lab .ff-metric:nth-child(4n+2){border-color:var(--cl-green,#2f7547)}.ff-lab .ff-metric:nth-child(4n+3){border-color:var(--cl-gold,#9a6b12)}.ff-lab .ff-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.ff-lab .ff-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px;line-height:1.4}.ff-lab .ff-metric strong{display:block;margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ff-lab .ff-stage{min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff))}.ff-lab .ff-frame{max-width:100%;overflow-x:auto}.ff-lab .ff-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b)}.ff-lab .ff-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ff-lab .ff-svg .ff-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1}.ff-lab .ff-svg .ff-axis{stroke:currentColor;stroke-opacity:.5;stroke-width:1.1}.ff-lab .ff-svg .ff-curve{fill:none;stroke:var(--cl-blue,#2c6aa0);stroke-width:2.5}.ff-lab .ff-svg .ff-point{fill:var(--cl-red,#b43d32);stroke:var(--bg,#fff);stroke-width:2}.ff-lab .ff-svg .ff-tangent{stroke:var(--cl-blue,#2c6aa0);stroke-width:2.6}.ff-lab .ff-svg .ff-normal{stroke:var(--cl-green,#2f7547);stroke-width:2.6}.ff-lab .ff-svg .ff-binormal{stroke:var(--cl-gold,#9a6b12);stroke-width:2.6}.ff-lab .ff-svg .ff-undefined{stroke:var(--cl-red,#b43d32);stroke-width:1.8;stroke-dasharray:5 4}.ff-lab .ff-svg .ff-label{font-size:12px;font-weight:750}.ff-lab .ff-svg .ff-small{font-size:10px;fill:var(--fg-soft,var(--muted,#5d6873))}.ff-lab .ff-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin:7px 0 0;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.ff-lab .ff-legend span{display:inline-flex;align-items:center;gap:5px}.ff-lab .ff-swatch{display:inline-block;width:18px;height:3px}.ff-lab .ff-swatch-t{background:var(--cl-blue,#2c6aa0)}.ff-lab .ff-swatch-n{background:var(--cl-green,#2f7547)}.ff-lab .ff-swatch-b{background:var(--cl-gold,#9a6b12)}.ff-lab .ff-swatch-p{width:10px;height:10px;border-radius:50%;background:var(--cl-red,#b43d32)}",
    ".ff-lab .ff-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.ff-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ff-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.ff-lab th,.ff-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.ff-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.ff-lab .ff-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--cl-green,#2f7547);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
    "@media(max-width:820px){.ff-lab .ff-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.ff-lab .ff-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.ff-lab .ff-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:560px){.ff-lab .ff-controls{grid-template-columns:minmax(0,1fr)}.ff-lab .ff-choice-grid{grid-template-columns:minmax(0,1fr)}.ff-lab .ff-prediction{padding:10px}.ff-lab .ff-stage{padding:4px}}",
    "@media(max-width:420px){.ff-lab .ff-presets,.ff-lab .ff-metrics{grid-template-columns:minmax(0,1fr)}}",
    "@media(prefers-reduced-motion:reduce){.ff-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance);
  }

  function vector(x, y, z) {
    return [x, y, z];
  }

  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function scale(a, factor) {
    return [a[0] * factor, a[1] * factor, a[2] * factor];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function norm(a) {
    return Math.sqrt(dot(a, a));
  }

  function unit(a) {
    var length = norm(a);
    return length > EPS ? scale(a, 1 / length) : null;
  }

  function presetById(id) {
    var fallback = PRESETS[0];
    PRESETS.forEach(function (preset) {
      if (preset.id === id) fallback = preset;
    });
    return fallback;
  }

  function normalizeRate(value) {
    var rate = Number(value);
    if (!finite(rate) || rate <= EPS) return 1;
    return rate;
  }

  function signedInflectionArcLength(u) {
    var sign = u < 0 ? -1 : 1;
    var end = Math.abs(u);
    if (end === 0) return 0;
    var intervals = Math.max(20, Math.ceil(end * 160));
    if (intervals % 2) intervals += 1;
    var h = end / intervals;
    var total = 0;
    var index;
    for (index = 0; index <= intervals; index += 1) {
      var x = h * index;
      var value = Math.sqrt(1 + 9 * x * x * x * x);
      var weight = index === 0 || index === intervals ? 1 : index % 2 ? 4 : 2;
      total += weight * value;
    }
    return sign * total * h / 3;
  }

  function baseKinematics(id, parameter) {
    var u = Number(parameter);
    if (!finite(u)) throw new Error("curve parameter must be finite");
    var a;
    var b;
    if (id === "line") {
      return {
        point: vector(u, 0, 0),
        first: vector(1, 0, 0),
        second: vector(0, 0, 0),
        third: vector(0, 0, 0),
        arcLength: u,
        arcLengthFormula: "s(u)=u"
      };
    }
    if (id === "circle") {
      a = 2;
      return {
        point: vector(a * Math.cos(u), a * Math.sin(u), 0),
        first: vector(-a * Math.sin(u), a * Math.cos(u), 0),
        second: vector(-a * Math.cos(u), -a * Math.sin(u), 0),
        third: vector(a * Math.sin(u), -a * Math.cos(u), 0),
        arcLength: a * u,
        arcLengthFormula: "s(u)=2u"
      };
    }
    if (id === "helix") {
      a = 2;
      b = 1;
      return {
        point: vector(a * Math.cos(u), a * Math.sin(u), b * u),
        first: vector(-a * Math.sin(u), a * Math.cos(u), b),
        second: vector(-a * Math.cos(u), -a * Math.sin(u), 0),
        third: vector(a * Math.sin(u), -a * Math.cos(u), 0),
        arcLength: Math.sqrt(a * a + b * b) * u,
        arcLengthFormula: "s(u)=√5 u"
      };
    }
    if (id === "inflection") {
      return {
        point: vector(u, u * u * u, 0),
        first: vector(1, 3 * u * u, 0),
        second: vector(0, 6 * u, 0),
        third: vector(0, 6, 0),
        arcLength: signedInflectionArcLength(u),
        arcLengthFormula: "s(u)=∫₀ᵘ √(1+9q⁴)dq"
      };
    }
    throw new Error("unknown curve: " + id);
  }

  function evaluateCurve(id, parameter, speedScale) {
    var rate = normalizeRate(speedScale);
    var t = Number(parameter);
    if (!finite(t)) throw new Error("curve parameter must be finite");
    var u = rate * t;
    var base = baseKinematics(id, u);
    var first = scale(base.first, rate);
    var second = scale(base.second, rate * rate);
    var third = scale(base.third, rate * rate * rate);
    var speed = norm(first);
    var tangent = unit(first);
    var crossValue = cross(first, second);
    var crossNorm = norm(crossValue);
    var curvature = crossNorm / Math.pow(speed, 3);
    var torsion = crossNorm > EPS ? dot(crossValue, third) / (crossNorm * crossNorm) : null;
    var normal = null;
    if (curvature > EPS) {
      var tangentDerivativeNumerator = subtract(scale(second, speed * speed), scale(first, dot(first, second)));
      normal = unit(tangentDerivativeNumerator);
    }
    var binormal = normal ? unit(cross(tangent, normal)) : null;
    var signedCurvature = crossValue[2] / Math.pow(speed, 3);
    // base.arcLength is already evaluated at u=rate*t; do not scale it twice.
    var arcLength = base.arcLength;
    var frameDefined = curvature > EPS;
    return {
      id: id,
      parameter: t,
      baseParameter: u,
      speedScale: rate,
      point: base.point,
      firstDerivative: first,
      secondDerivative: second,
      thirdDerivative: third,
      speed: speed,
      arcLength: arcLength,
      arcLengthFormula: id === "inflection" ? "s(t)=∫₀ᵗ rate·√(1+9(rate·q)⁴)dq" : base.arcLengthFormula.replace(/u/g, "rate·t"),
      curvature: curvature,
      signedCurvature: signedCurvature,
      torsion: torsion,
      tangent: tangent,
      normal: normal,
      binormal: binormal,
      regular: speed > EPS,
      frenetDefined: frameDefined,
      normalStatus: frameDefined ? "N=T′/κ 已定义" : "N 未定义：κ=0，不能把 0/0 静默当成向量",
      torsionStatus: torsion === null ? "τ 未定义：|r′×r″|=0" : "τ 已由混合积给出",
      divisionStatus: frameDefined ? "允许除以 κ" : "拒绝除以 κ=0"
    };
  }

  function parameterizationReport(id, parameter, speedScale) {
    var rate = normalizeRate(speedScale);
    var base = evaluateCurve(id, parameter, 1);
    var changed = evaluateCurve(id, parameter, rate);
    var invariantsValid = base.frenetDefined && changed.frenetDefined;
    var torsionSame = base.torsion === null && changed.torsion === null
      ? true
      : base.torsion !== null && changed.torsion !== null && close(base.torsion, changed.torsion, 1e-9);
    return {
      id: id,
      parameter: parameter,
      speedScale: rate,
      base: base,
      changed: changed,
      invariantsValid: invariantsValid,
      curvatureInvariant: invariantsValid && close(base.curvature, changed.curvature, 1e-9),
      torsionInvariant: invariantsValid && torsionSame,
      speedRatio: changed.speed / base.speed,
      arcLengthRatio: Math.abs(changed.arcLength) <= EPS && Math.abs(base.arcLength) <= EPS
        ? 1
        : changed.arcLength / base.arcLength,
      statement: invariantsValid
        ? "正的正则重参数化改变 speed/弧长坐标，不改变 κ、τ。"
        : "此点没有 Frenet 法向：不能声称 κ、τ 的标架不变量比较有效。"
    };
  }

  function curveSample(id, minimum, maximum, count, speedScale) {
    var points = [];
    var size = Math.max(16, Math.round(count || 96));
    var rate = normalizeRate(speedScale);
    var index;
    for (index = 0; index <= size; index += 1) {
      var parameter = minimum + (maximum - minimum) * index / size;
      points.push(baseKinematics(id, rate * parameter).point);
    }
    return points;
  }

  function finiteVector(value) {
    return Array.isArray(value) && value.length === 3 && value.every(finite);
  }

  function formatNumber(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "未定义";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) < 1e-8) return "0";
    var text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "").replace(/^-0$/, "0");
  }

  function formatVector(value) {
    return value ? "(" + value.map(function (entry) { return formatNumber(entry, 3); }).join(", ") + ")" : "未定义";
  }

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function element(doc, tag, attributes, children) {
    var node = setAttributes(doc.createElement(tag), attributes);
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attributes, children) {
    var node = setAttributes(doc.createElementNS(SVG_NS, tag), attributes);
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = element(doc, "style", { id: STYLE_ID }, STYLE_TEXT);
    (doc.head || doc.documentElement).appendChild(style);
  }

  function projection(point) {
    return [point[0] - 0.32 * point[2], point[1] - 0.18 * point[2]];
  }

  function makeProjection(points) {
    var projected = points.map(projection);
    var xs = projected.map(function (point) { return point[0]; });
    var ys = projected.map(function (point) { return point[1]; });
    var minX = Math.min.apply(null, xs);
    var maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys);
    var maxY = Math.max.apply(null, ys);
    var spanX = Math.max(maxX - minX, 1);
    var spanY = Math.max(maxY - minY, 1);
    return function (point) {
      var value = projection(point);
      return [54 + (value[0] - minX) / spanX * 652, 304 - (value[1] - minY) / spanY * 252];
    };
  }

  function pointPath(points, map) {
    return points.map(function (point, index) {
      var mapped = map(point);
      return (index ? "L" : "M") + mapped[0].toFixed(2) + " " + mapped[1].toFixed(2);
    }).join(" ");
  }

  function curveSvg(doc, data, preset, id) {
    var samples = curveSample(data.id, preset.minimum, preset.maximum, 120, data.speedScale);
    var map = makeProjection(samples);
    var svg = svgElement(doc, "svg", {
      class: "ff-svg",
      viewBox: "0 0 760 350",
      role: "img",
      "aria-labelledby": id + "-title " + id + "-desc"
    });
    svg.appendChild(svgElement(doc, "title", { id: id + "-title" }, preset.label + "及 Frenet 向量"));
    svg.appendChild(svgElement(doc, "desc", { id: id + "-desc" }, "蓝色为曲线，红点为当前参数，蓝绿金三色分别为 T、N、B；κ=0 时 N 与 B 明确标记为未定义。"));
    var defs = svgElement(doc, "defs");
    ["tangent", "normal", "binormal"].forEach(function (name) {
      var color = name === "tangent" ? "#2c6aa0" : name === "normal" ? "#2f7547" : "#9a6b12";
      var marker = svgElement(doc, "marker", { id: id + "-" + name, markerWidth: "7", markerHeight: "7", refX: "6", refY: "3.5", orient: "auto" });
      marker.appendChild(svgElement(doc, "path", { d: "M0,0 L7,3.5 L0,7 z", fill: color }));
      defs.appendChild(marker);
    });
    svg.appendChild(defs);
    [80, 150, 220, 290].forEach(function (y) {
      svg.appendChild(svgElement(doc, "line", { x1: "50", y1: String(y), x2: "710", y2: String(y), class: "ff-grid" }));
    });
    [160, 300, 440, 580].forEach(function (x) {
      svg.appendChild(svgElement(doc, "line", { x1: String(x), y1: "36", x2: String(x), y2: "315", class: "ff-grid" }));
    });
    svg.appendChild(svgElement(doc, "line", { x1: "50", y1: "315", x2: "710", y2: "315", class: "ff-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: pointPath(samples, map), class: "ff-curve" }));
    var current = map(data.point);
    svg.appendChild(svgElement(doc, "circle", { cx: current[0], cy: current[1], r: "6", class: "ff-point" }));
    var vectorScale = Math.max(0.28, Math.min(0.9, (preset.maximum - preset.minimum) / 5));
    function drawVector(value, className, marker, label, direction) {
      if (!finiteVector(value)) return;
      var endpoint = map(add(data.point, scale(value, vectorScale * direction)));
      svg.appendChild(svgElement(doc, "line", {
        x1: current[0], y1: current[1], x2: endpoint[0], y2: endpoint[1],
        class: className, "marker-end": "url(#" + id + "-" + marker + ")"
      }));
      svg.appendChild(svgElement(doc, "text", { x: endpoint[0] + 5, y: endpoint[1] - 4, class: "ff-label" }, label));
    }
    drawVector(data.tangent, "ff-tangent", "tangent", "T", 1);
    drawVector(data.normal, "ff-normal", "normal", "N", 1);
    drawVector(data.binormal, "ff-binormal", "binormal", "B", 1);
    if (!data.frenetDefined) {
      svg.appendChild(svgElement(doc, "line", { x1: current[0] - 18, y1: current[1] - 18, x2: current[0] + 18, y2: current[1] + 18, class: "ff-undefined" }));
      svg.appendChild(svgElement(doc, "line", { x1: current[0] - 18, y1: current[1] + 18, x2: current[0] + 18, y2: current[1] - 18, class: "ff-undefined" }));
      svg.appendChild(svgElement(doc, "text", { x: Math.min(650, current[0] + 22), y: Math.max(25, current[1] - 22), class: "ff-label" }, "κ=0：N、B 未定义"));
    }
    svg.appendChild(svgElement(doc, "text", { x: "54", y: "25", class: "ff-small" }, "当前点 t=" + formatNumber(data.parameter, 3) + "，正投影显示 z 方向"));
    return svg;
  }

  function metricBlock(doc, label, value) {
    return element(doc, "div", { className: "ff-metric" }, [
      element(doc, "span", {}, label),
      element(doc, "strong", {}, value)
    ]);
  }

  function vectorQuestion(doc, key, label, options, state, onChange) {
    var fieldset = element(doc, "fieldset", { className: "ff-question", "data-answer-key": key });
    fieldset.appendChild(element(doc, "legend", {}, label));
    var grid = element(doc, "div", { className: "ff-choice-grid" });
    options.forEach(function (option) {
      var button = element(doc, "button", {
        type: "button",
        "data-answer-value": option.value,
        "aria-pressed": state.answers[key] === option.value ? "true" : "false"
      }, option.label);
      button.addEventListener("click", function () {
        state.answers[key] = option.value;
        Array.prototype.forEach.call(grid.children, function (child) {
          child.setAttribute("aria-pressed", child === button ? "true" : "false");
        });
        onChange();
      });
      grid.appendChild(button);
    });
    fieldset.appendChild(grid);
    return fieldset;
  }

  function expectedAnswers(data) {
    return {
      regular: data.regular ? "yes" : "no",
      invariant: data.frenetDefined ? "yes" : "boundary",
      torsion: data.torsion !== null && Math.abs(data.torsion) > EPS ? "nonzero" : data.torsion === null ? "undefined" : "zero",
      normal: data.frenetDefined ? "defined" : "undefined"
    };
  }

  function ledgerRows(data, report) {
    return [
      ["speed |r′|", formatNumber(data.speed, 6), "参数速度；rate 改变它"],
      ["弧长 s", formatNumber(data.arcLength, 6), data.arcLengthFormula],
      ["κ", formatNumber(data.curvature, 6), data.frenetDefined ? "N=T′/κ 可用" : "κ=0，禁止除法"],
      ["τ", formatNumber(data.torsion, 6), data.torsionStatus],
      ["T", formatVector(data.tangent), "单位切向量"],
      ["N", formatVector(data.normal), data.normalStatus],
      ["B", formatVector(data.binormal), data.frenetDefined ? "T×N" : "随 N 一起未定义"],
      ["重参数化", report.invariantsValid ? (report.curvatureInvariant && report.torsionInvariant ? "κ、τ 不变" : "请检查") : "无 Frenet 不变量可宣称", report.statement]
    ];
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      id: "helix",
      parameter: presetById("helix").parameter,
      speedScale: 1,
      answers: { regular: null, invariant: null, torsion: null, normal: null },
      revealed: false
    };
    var serial = INSTANCE += 1;
    var shell = element(doc, "div", { className: "ff-lab" });
    shell.appendChild(element(doc, "h3", {}, "Frenet 标架：先判断定义域，再读三本几何账"));
    shell.appendChild(element(doc, "p", { className: "ff-note" }, "四个精确曲线共享同一模型。改变正的参数速度后，speed 与弧长坐标会变；只有在 κ>0 的正则点，才比较 Frenet 的 κ、τ 与 N、B。"));

    var presets = element(doc, "div", { className: "ff-presets" });
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": state.id === preset.id ? "true" : "false" }, preset.label);
      button.addEventListener("click", function () {
        state.id = preset.id;
        state.parameter = preset.parameter;
        state.speedScale = 1;
        state.answers = { regular: null, invariant: null, torsion: null, normal: null };
        state.revealed = false;
        render();
      });
      presets.appendChild(button);
    });
    shell.appendChild(presets);

    var controls = element(doc, "div", { className: "ff-controls" });
    var parameterControl = element(doc, "div", { className: "ff-control" });
    var parameterLabel = element(doc, "label", {}, "参数 t = ");
    var parameterOutput = element(doc, "output", {});
    var parameterInput = element(doc, "input", { type: "range", "aria-label": "曲线参数 t" });
    parameterLabel.appendChild(parameterOutput);
    parameterControl.appendChild(parameterLabel);
    parameterControl.appendChild(parameterInput);
    controls.appendChild(parameterControl);
    var rateControl = element(doc, "div", { className: "ff-control" });
    var rateLabel = element(doc, "label", {}, "正参数速度 rate = ");
    var rateOutput = element(doc, "output", {});
    var rateInput = element(doc, "input", { type: "range", min: "0.5", max: "3", step: "0.1", value: "1", "aria-label": "正参数速度 rate" });
    rateLabel.appendChild(rateOutput);
    rateControl.appendChild(rateLabel);
    rateControl.appendChild(rateInput);
    controls.appendChild(rateControl);
    shell.appendChild(controls);

    var prediction = element(doc, "section", { className: "ff-prediction" });
    prediction.appendChild(element(doc, "strong", { className: "ff-prediction-title" }, "预测门：四项都回答后才揭示 Frenet 账本"));
    var questionNodes = [];
    questionNodes.push(vectorQuestion(doc, "regular", "1. 当前参数点的曲线是否正则？", [
      { value: "yes", label: "是，|r′|>0" }, { value: "no", label: "否，速度为 0" }
    ], state, renderPrediction));
    questionNodes.push(vectorQuestion(doc, "invariant", "2. 对正的正则重参数化，κ 是否保持？", [
      { value: "yes", label: "保持" }, { value: "boundary", label: "κ=0 时先谈边界" }
    ], state, renderPrediction));
    questionNodes.push(vectorQuestion(doc, "torsion", "3. 当前曲线的 τ 应读作？", [
      { value: "nonzero", label: "非零" }, { value: "zero", label: "0" }, { value: "undefined", label: "未定义" }
    ], state, renderPrediction));
    questionNodes.push(vectorQuestion(doc, "normal", "4. κ=0 时 N=T′/κ 的结论？", [
      { value: "defined", label: "仍可随便选" }, { value: "undefined", label: "未定义，拒绝除零" }
    ], state, renderPrediction));
    questionNodes.forEach(function (node) { prediction.appendChild(node); });
    var actions = element(doc, "div", { className: "ff-actions" });
    var reveal = element(doc, "button", { type: "button", className: "ff-primary" }, "揭示账本");
    var reset = element(doc, "button", { type: "button" }, "重置本曲线");
    var feedback = element(doc, "p", { className: "ff-feedback", "aria-live": "polite", "aria-atomic": "true" }, "");
    reveal.addEventListener("click", function () {
      var data = evaluateCurve(state.id, state.parameter, state.speedScale);
      var keys = Object.keys(state.answers);
      if (keys.some(function (key) { return state.answers[key] === null; })) {
        feedback.className = "ff-feedback ff-warn";
        feedback.textContent = "还有预测没有作答。";
        return;
      }
      var expected = expectedAnswers(data);
      var correct = keys.filter(function (key) { return expected[key] === state.answers[key]; }).length;
      state.revealed = true;
      feedback.className = "ff-feedback " + (correct === keys.length ? "ff-pass" : "ff-warn");
      feedback.textContent = "已揭示：命中 " + correct + "/" + keys.length + "；" + data.normalStatus + "。";
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
      render();
    });
    reset.addEventListener("click", function () {
      var preset = presetById(state.id);
      state.parameter = preset.parameter;
      state.speedScale = 1;
      state.answers = { regular: null, invariant: null, torsion: null, normal: null };
      state.revealed = false;
      render();
    });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    prediction.appendChild(actions);
    prediction.appendChild(feedback);
    shell.appendChild(prediction);

    var results = element(doc, "section", { className: "ff-results", hidden: true, "aria-live": "polite" });
    shell.appendChild(results);
    root.replaceChildren(shell);

    function resetGate(message) {
      state.answers = { regular: null, invariant: null, torsion: null, normal: null };
      state.revealed = false;
      feedback.className = "ff-feedback ff-warn";
      feedback.textContent = message;
      renderPrediction();
    }

    function renderPrediction() {
      reveal.disabled = Object.keys(state.answers).some(function (key) { return state.answers[key] === null; });
      questionNodes.forEach(function (fieldset) {
        var key = fieldset.getAttribute("data-answer-key");
        Array.prototype.forEach.call(fieldset.querySelectorAll("button"), function (button) {
          button.setAttribute("aria-pressed", state.answers[key] === button.getAttribute("data-answer-value") ? "true" : "false");
        });
      });
    }

    function render() {
      var preset = presetById(state.id);
      parameterInput.min = String(preset.minimum);
      parameterInput.max = String(preset.maximum);
      parameterInput.step = String(preset.step);
      parameterInput.value = String(state.parameter);
      parameterOutput.textContent = formatNumber(state.parameter, 3);
      rateInput.value = String(state.speedScale);
      rateOutput.textContent = formatNumber(state.speedScale, 1);
      Array.prototype.forEach.call(presets.children, function (button, index) {
        button.setAttribute("aria-pressed", PRESETS[index].id === state.id ? "true" : "false");
      });
      renderPrediction();
      if (!state.revealed) {
        results.hidden = true;
        if (!feedback.textContent || feedback.className.indexOf("ff-warn") < 0) feedback.textContent = "先完成四项预测。";
        return;
      }
      results.hidden = false;
      results.replaceChildren();
      var data = evaluateCurve(state.id, state.parameter, state.speedScale);
      var report = parameterizationReport(state.id, state.parameter, state.speedScale);
      results.appendChild(element(doc, "h4", {}, preset.label + "：精确几何账"));
      var metrics = element(doc, "div", { className: "ff-metrics" });
      metrics.appendChild(metricBlock(doc, "speed |r′|", formatNumber(data.speed, 5)));
      metrics.appendChild(metricBlock(doc, "弧长 s", formatNumber(data.arcLength, 5)));
      metrics.appendChild(metricBlock(doc, "曲率 κ", formatNumber(data.curvature, 5)));
      metrics.appendChild(metricBlock(doc, "挠率 τ", formatNumber(data.torsion, 5)));
      results.appendChild(metrics);
      var stageId = "ff-stage-" + serial;
      var stage = element(doc, "div", { className: "ff-stage" });
      stage.appendChild(curveSvg(doc, data, preset, stageId));
      stage.appendChild(element(doc, "div", { className: "ff-legend" }, [
        element(doc, "span", {}, [element(doc, "i", { className: "ff-swatch ff-swatch-t" }), "T 切向"]),
        element(doc, "span", {}, [element(doc, "i", { className: "ff-swatch ff-swatch-n" }), "N 主法向"]),
        element(doc, "span", {}, [element(doc, "i", { className: "ff-swatch ff-swatch-b" }), "B 副法向"]),
        element(doc, "span", {}, [element(doc, "i", { className: "ff-swatch ff-swatch-p" }), "当前点"])
      ]));
      results.appendChild(stage);
      var tableWrap = element(doc, "div", { className: "ff-ledger-wrap" });
      var table = element(doc, "table", { "aria-label": "Frenet 几何账本" });
      table.appendChild(element(doc, "caption", {}, "导数、弧长与标架状态；未定义量保留为“未定义”。"));
      var head = element(doc, "tr");
      ["量", "当前值", "解释 / 边界"].forEach(function (value) {
        head.appendChild(element(doc, "th", { scope: "col" }, value));
      });
      table.appendChild(element(doc, "thead", {}, head));
      var body = element(doc, "tbody");
      ledgerRows(data, report).forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", {}, value); })));
      });
      table.appendChild(body);
      tableWrap.appendChild(table);
      results.appendChild(tableWrap);
      results.appendChild(element(doc, "p", { className: "ff-interpretation" }, data.frenetDefined
        ? "这里的 N、B 来自真实除法与归一化；正 rate 重参数化只改变走过曲线的时间表。"
        : "当前点正则但 κ=0。T 仍然存在，而 N=T′/κ 与 B=T×N 不存在；这不是数值精度问题，而是 Frenet 标架的定义域边界。"));
    }

    parameterInput.addEventListener("input", function () {
      state.parameter = Number(parameterInput.value);
      resetGate("参数改变；请重新作出四项预测。");
      render();
    });
    rateInput.addEventListener("input", function () {
      state.speedScale = normalizeRate(rateInput.value);
      resetGate("参数速度改变；请重新作出四项预测。");
      render();
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var line = evaluateCurve("line", 2, 1);
    assert(line.regular, "line is regular");
    assert(close(line.speed, 1) && close(line.arcLength, 2), "line speed and arc length");
    assert(close(line.curvature, 0) && line.torsion === null, "line curvature/torsion boundary");
    assert(line.normal === null && line.binormal === null && line.divisionStatus.indexOf("拒绝") >= 0, "line Frenet normal must stay undefined");
    assert(close(line.tangent[0], 1) && close(line.tangent[1], 0), "line tangent");

    var circle = evaluateCurve("circle", 0.7, 1);
    assert(close(circle.speed, 2) && close(circle.arcLength, 1.4), "circle speed and arc length");
    assert(close(circle.curvature, 0.5) && close(circle.torsion, 0), "circle curvature/torsion");
    assert(circle.frenetDefined && finiteVector(circle.normal) && finiteVector(circle.binormal), "circle frame");
    var circleReparam = parameterizationReport("circle", 0.7, 2.5);
    assert(circleReparam.speedRatio === 2.5 && circleReparam.arcLengthRatio === 2.5, "circle speed/arc-length reparameterization");
    assert(circleReparam.curvatureInvariant && circleReparam.torsionInvariant, "circle invariants");

    var helix = evaluateCurve("helix", 0.4, 1);
    assert(close(helix.speed, Math.sqrt(5)) && close(helix.arcLength, 0.4 * Math.sqrt(5)), "helix speed and arc length");
    assert(close(helix.curvature, 2 / 5) && close(helix.torsion, 1 / 5), "helix exact invariants");
    assert(close(dot(helix.tangent, helix.normal), 0) && close(dot(helix.tangent, helix.binormal), 0), "helix orthogonality");
    assert(close(norm(helix.tangent), 1) && close(norm(helix.normal), 1) && close(norm(helix.binormal), 1), "helix unit frame");
    var helixReparam = parameterizationReport("helix", 0.4, 3);
    assert(helixReparam.curvatureInvariant && helixReparam.torsionInvariant, "helix reparameterization invariants");
    assert(close(helixReparam.changed.speed, 3 * Math.sqrt(5)), "helix speed changes with rate");

    var inflection = evaluateCurve("inflection", 0, 1);
    assert(inflection.regular && close(inflection.speed, 1), "inflection is regular at zero");
    assert(close(inflection.curvature, 0) && inflection.normal === null && inflection.binormal === null, "inflection normal failure at zero curvature");
    var positive = evaluateCurve("inflection", 0.5, 1);
    var negative = evaluateCurve("inflection", -0.5, 1);
    assert(positive.frenetDefined && negative.frenetDefined, "inflection frame away from zero");
    assert(positive.signedCurvature > 0 && negative.signedCurvature < 0, "inflection signed curvature changes sign");
    assert(close(positive.torsion, 0) && close(negative.torsion, 0), "planar inflection torsion away from zero");
    assert(parameterizationReport("line", 0.5, 2).invariantsValid === false, "line has no Frenet invariant claim");
    assert(parameterizationReport("inflection", 0, 2).invariantsValid === false, "inflection boundary has no Frenet invariant claim");
    assert(signedInflectionArcLength(0.5) > 0 && signedInflectionArcLength(-0.5) < 0, "inflection arc-length orientation");
    var rateSamples = curveSample("helix", -0.5, 0.5, 16, 2);
    assert(close(rateSamples[0][2], -1) && close(rateSamples[rateSamples.length - 1][2], 1), "plot samples apply rate");
    PRESETS.forEach(function (preset) {
      var sample = evaluateCurve(preset.id, preset.parameter, 1);
      assert(sample.regular && finite(sample.speed) && finite(sample.arcLength), preset.id + " preset finite");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    evaluateCurve: evaluateCurve,
    curvePoint: function (id, parameter) { return baseKinematics(id, parameter).point; },
    parameterizationReport: parameterizationReport,
    curveSample: curveSample,
    selfTest: selfTest,
    mount: mount
  };
});
