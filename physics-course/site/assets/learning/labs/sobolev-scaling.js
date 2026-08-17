(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("sobolev-scaling", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("sobolev-scaling self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("sobolev-scaling self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-sobolev-scaling-styles";
  var SERIAL = 0;
  var EPS = 1e-10;
  var MIN_LOG_EPSILON = -2;

  var PRESETS = [
    { id: "h1-r3", label: "n=3, p=2", n: 3, p: 2, logEpsilon: -0.6, mode: "critical" },
    { id: "fractional-r2", label: "n=2, p=1.5", n: 2, p: 1.5, logEpsilon: -0.8, mode: "subcritical" },
    { id: "h1-r4", label: "n=4, p=2", n: 4, p: 2, logEpsilon: -1, mode: "critical" },
    { id: "w13-r6", label: "n=6, p=3", n: 6, p: 3, logEpsilon: -1.3, mode: "supercritical" }
  ];

  var MODES = [
    { id: "subcritical", label: "q=p（次临界）", color: "blue" },
    { id: "critical", label: "q=p*（临界）", color: "green" },
    { id: "supercritical", label: "q=p*+2（超临界）", color: "red" }
  ];

  var STYLE_TEXT = [
    ".ss-lab{--ss-blue:var(--cl-blue,#315f9d);--ss-gold:var(--cl-gold,#95670d);--ss-green:var(--cl-green,#347247);--ss-red:var(--cl-red,#b13d32);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".ss-lab *,.ss-lab *::before,.ss-lab *::after{box-sizing:border-box;}.ss-lab [hidden]{display:none!important;}",
    ".ss-lab h3,.ss-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.ss-lab h3{font-size:1.16rem;}.ss-lab h4{margin-top:16px;font-size:1rem;}",
    ".ss-lab .ss-intro,.ss-lab .ss-note,.ss-lab .ss-feedback,.ss-lab .ss-interpretation{color:var(--fg-soft);font-size:13px;overflow-wrap:anywhere;}",
    ".ss-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.ss-lab legend{margin-bottom:8px;font-weight:750;}.ss-lab .ss-question{margin:12px 0 6px;font-size:13px;font-weight:700;}",
    ".ss-lab .ss-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.ss-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}",
    ".ss-lab button:hover{border-color:var(--accent);}.ss-lab button:focus-visible,.ss-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.ss-lab button[aria-pressed=true],.ss-lab button.ss-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.ss-lab button:disabled{opacity:.55;cursor:not-allowed;}",
    ".ss-lab .ss-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.ss-lab .ss-actions>*{flex:1 1 160px;}.ss-lab .ss-feedback{min-height:2em;margin:8px 0;font-weight:700;}.ss-lab .ss-pass{color:var(--ss-green);}.ss-lab .ss-warn{color:var(--ss-red);}",
    ".ss-lab .ss-revealed{margin-top:16px;padding-top:16px;border-top:1px solid var(--border);}.ss-lab .ss-layout{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.32fr);gap:16px;align-items:start;min-width:0;}.ss-lab .ss-controls,.ss-lab .ss-stage{min-width:0;}.ss-lab .ss-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}",
    ".ss-lab .ss-presets,.ss-lab .ss-modes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.ss-lab .ss-modes{grid-template-columns:minmax(0,1fr);}.ss-lab .ss-presets button,.ss-lab .ss-modes button{font-size:12px;}",
    ".ss-lab .ss-control{display:grid;gap:5px;}.ss-lab .ss-control label{font-size:13px;font-weight:700;color:var(--fg-soft);}.ss-lab .ss-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.ss-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.ss-lab .ss-scale{display:flex;justify-content:space-between;color:var(--fg-soft);font-size:11px;}",
    ".ss-lab .ss-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.ss-lab .ss-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.ss-lab .ss-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.ss-lab .ss-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7;}.ss-lab .ss-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.7;}.ss-lab .ss-profile{stroke:var(--ss-gold);stroke-width:3;fill:none;}.ss-lab .ss-reference{stroke:var(--fg-soft);stroke-width:2;stroke-dasharray:6 5;fill:none;}.ss-lab .ss-sub{stroke:var(--ss-blue);}.ss-lab .ss-critical{stroke:var(--ss-green);}.ss-lab .ss-super{stroke:var(--ss-red);}.ss-lab .ss-law{stroke-width:2.5;fill:none;}.ss-lab .ss-dot{stroke:var(--bg);stroke-width:2;}.ss-lab .ss-dot.ss-sub{fill:var(--ss-blue);}.ss-lab .ss-dot.ss-critical{fill:var(--ss-green);}.ss-lab .ss-dot.ss-super{fill:var(--ss-red);}.ss-lab .ss-label{font-size:11px;}.ss-lab .ss-title{font-size:12px;font-weight:800;text-anchor:middle;}",
    ".ss-lab .ss-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px;margin:12px 0;}.ss-lab .ss-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.ss-lab .ss-metric:nth-child(1),.ss-lab .ss-metric:nth-child(4){border-color:var(--ss-blue);}.ss-lab .ss-metric:nth-child(2),.ss-lab .ss-metric:nth-child(5){border-color:var(--ss-green);}.ss-lab .ss-metric:nth-child(3),.ss-lab .ss-metric:nth-child(6){border-color:var(--ss-red);}.ss-lab .ss-metric span{display:block;color:var(--fg-soft);font-size:11.5px;}.ss-lab .ss-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".ss-lab .ss-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}.ss-lab table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.ss-lab th,.ss-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.ss-lab th{color:var(--fg-soft);font-size:11.5px;}.ss-lab .ss-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--ss-green);background:var(--bg);}",
    "@media(max-width:1180px){.ss-lab .ss-layout{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:680px){.ss-lab .ss-choice-row{grid-template-columns:minmax(0,1fr);}.ss-lab .ss-presets{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:420px){.ss-lab .ss-frame{padding:4px;}.ss-lab table{font-size:11.5px;}.ss-lab th,.ss-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.ss-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function logGamma(z) {
    var coefficients = [
      0.9999999999998099,
      676.5203681218851,
      -1259.1392167224028,
      771.3234287776531,
      -176.6150291621406,
      12.5073432786869,
      -0.13857109526572,
      0.00000998436957802,
      0.000000150563273515
    ];
    var index;
    var sum;
    var shifted;
    var t;
    if (!finite(z) || z <= 0) throw new RangeError("logGamma requires z > 0");
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    shifted = z - 1;
    sum = coefficients[0];
    for (index = 1; index < coefficients.length; index += 1) sum += coefficients[index] / (shifted + index);
    t = shifted + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(sum);
  }

  function unitBallVolume(n) {
    if (!finite(n) || n <= 0) throw new RangeError("n must be positive");
    return Math.exp((n / 2) * Math.log(Math.PI) - logGamma(n / 2 + 1));
  }

  function criticalExponent(n, p) {
    if (!finite(n) || !finite(p) || n <= p || p < 1) throw new RangeError("requires 1 <= p < n");
    return (n * p) / (n - p);
  }

  function qForMode(n, p, mode) {
    var pStar = criticalExponent(n, p);
    if (mode === "subcritical") return p;
    if (mode === "critical") return pStar;
    if (mode === "supercritical") return pStar + 2;
    throw new RangeError("unknown q mode: " + mode);
  }

  function compute(input) {
    var n = Number(input.n);
    var p = Number(input.p);
    var q = Number(input.q);
    var epsilon = Number(input.epsilon);
    if (!finite(n) || !finite(p) || n <= p || p < 1) throw new RangeError("requires 1 <= p < n");
    if (!finite(q) || q < 1) throw new RangeError("q must be at least 1");
    if (!finite(epsilon) || epsilon <= 0 || epsilon > 1) throw new RangeError("epsilon must be in (0, 1]");
    var omega = unitBallVolume(n);
    var pStar = criticalExponent(n, p);
    var amplitude = Math.pow(epsilon, 1 - n / p) * Math.pow(omega, -1 / p);
    var supportVolume = omega * Math.pow(epsilon, n);
    var logBeta = logGamma(n) + logGamma(q + 1) - logGamma(n + q + 1);
    var logLq = Math.log(amplitude) + (Math.log(n * omega) + n * Math.log(epsilon) + logBeta) / q;
    var lq = Math.exp(logLq);
    var gradient = Math.pow(Math.pow(amplitude / epsilon, p) * supportVolume, 1 / p);
    var exponent = 1 - n / p + n / q;
    return {
      n: n,
      p: p,
      q: q,
      epsilon: epsilon,
      omega: omega,
      pStar: pStar,
      amplitude: amplitude,
      supportVolume: supportVolume,
      gradientNorm: gradient,
      lq: lq,
      exponent: exponent,
      betaFactor: Math.exp(logBeta),
      classification: Math.abs(exponent) < 1e-9 ? "critical" : (exponent > 0 ? "subcritical" : "supercritical")
    };
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function selfTest() {
    var checks = 0;
    PRESETS.forEach(function (preset) {
      MODES.forEach(function (mode) {
        var q = qForMode(preset.n, preset.p, mode.id);
        var first = compute({ n: preset.n, p: preset.p, q: q, epsilon: 1 });
        [0.5, 0.125, 0.03].forEach(function (epsilon) {
          var current = compute({ n: preset.n, p: preset.p, q: q, epsilon: epsilon });
          checks += 7;
          assert(near(current.gradientNorm, 1, 1e-9), preset.id + " gradient normalization failed");
          assert(finite(current.lq) && current.lq > 0, preset.id + " Lq is invalid");
          assert(finite(current.amplitude) && current.amplitude > 0, preset.id + " amplitude is invalid");
          assert(near(current.lq / first.lq, Math.pow(epsilon, current.exponent), 1e-9), preset.id + " Lq power law failed");
          assert(near(current.supportVolume / first.supportVolume, Math.pow(epsilon, preset.n), 1e-9), preset.id + " support scaling failed");
          assert(near(current.amplitude / first.amplitude, Math.pow(epsilon, 1 - preset.n / preset.p), 1e-9), preset.id + " amplitude scaling failed");
          assert(mode.id !== "critical" || Math.abs(current.exponent) < 1e-9, preset.id + " critical exponent is not zero");
        });
      });
    });
    var reference = compute({ n: 3, p: 2, q: 6, epsilon: 0.125 });
    checks += 4;
    assert(near(reference.pStar, 6), "n=3 p=2 critical exponent should be 6");
    assert(near(reference.lq, 0.296431202579, 1e-9), "n=3 p=2 critical L6 constant mismatch");
    assert(near(reference.gradientNorm, 1, 1e-9), "reference gradient should be 1");
    assert(near(reference.betaFactor, 1 / 252, 1e-9), "B(3,7) should be 1/252");
    [
      { n: 3, p: 3, q: 2, epsilon: 1 },
      { n: 3, p: 2, q: 0.5, epsilon: 1 },
      { n: 3, p: 2, q: 2, epsilon: 0 }
    ].forEach(function (bad, index) {
      var rejected = false;
      try { compute(bad); } catch (error) { rejected = true; }
      checks += 1;
      assert(rejected, "invalid case " + index + " should be rejected");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  function injectStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function makeElement(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "className") node.className = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (!Array.isArray(children)) children = children === undefined ? [] : [children];
    children.forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
    });
    return node;
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function format(value, digits) {
    if (!finite(value)) return "--";
    var absolute = Math.abs(value);
    if ((absolute > 0 && absolute < 0.001) || absolute >= 10000) return value.toExponential(digits === undefined ? 2 : digits);
    var text = value.toFixed(digits === undefined ? 3 : digits);
    if (text.indexOf(".") >= 0) text = text.replace(/0+$/, "").replace(/\.$/, "");
    return text;
  }

  function metric(doc, label) {
    var value = makeElement(doc, "strong", {}, "--");
    return { node: makeElement(doc, "div", { className: "ss-metric" }, [makeElement(doc, "span", {}, label), value]), value: value };
  }

  function drawChart(doc, svg, state, current) {
    clear(svg);
    svg.appendChild(svgNode(doc, "desc", {}, "左图比较 epsilon=1 的参考帽与当前径向帽，纵轴采用 log10(1+u)；右图显示次临界、临界、超临界 Lq 范数随 epsilon 的对数幂律。"));
    var left = { x: 42, y: 46, w: 258, h: 242 };
    var right = { x: 350, y: 46, w: 242, h: 242 };
    svg.appendChild(svgNode(doc, "text", { x: left.x + left.w / 2, y: 24, class: "ss-title" }, "径向截面：纵轴 log10(1+u)"));
    svg.appendChild(svgNode(doc, "text", { x: right.x + right.w / 2, y: 24, class: "ss-title" }, "log10 ||u_epsilon||_q"));

    function profilePath(epsilon, amplitude) {
      var points = [];
      var maxAmplitude = Math.pow(Math.pow(10, MIN_LOG_EPSILON), 1 - state.n / state.p) * Math.pow(unitBallVolume(state.n), -1 / state.p);
      var yMax = Math.log10(1 + maxAmplitude);
      var count = 100;
      var index;
      for (index = 0; index <= count; index += 1) {
        var xValue = -1 + (2 * index) / count;
        var u = Math.abs(xValue) <= epsilon ? amplitude * (1 - Math.abs(xValue) / epsilon) : 0;
        var px = left.x + ((xValue + 1) / 2) * left.w;
        var py = left.y + left.h - (Math.log10(1 + u) / yMax) * left.h;
        points.push((index ? "L" : "M") + px.toFixed(2) + "," + py.toFixed(2));
      }
      return points.join(" ");
    }

    [0, 0.5, 1].forEach(function (fraction) {
      var y = left.y + left.h * fraction;
      svg.appendChild(svgNode(doc, "line", { x1: left.x, y1: y, x2: left.x + left.w, y2: y, class: "ss-grid" }));
    });
    svg.appendChild(svgNode(doc, "line", { x1: left.x, y1: left.y + left.h, x2: left.x + left.w, y2: left.y + left.h, class: "ss-axis" }));
    svg.appendChild(svgNode(doc, "path", { d: profilePath(1, Math.pow(unitBallVolume(state.n), -1 / state.p)), class: "ss-reference" }));
    svg.appendChild(svgNode(doc, "path", { d: profilePath(current.epsilon, current.amplitude), class: "ss-profile" }));
    svg.appendChild(svgNode(doc, "text", { x: left.x, y: left.y + left.h + 19, class: "ss-label" }, "-1"));
    svg.appendChild(svgNode(doc, "text", { x: left.x + left.w / 2, y: left.y + left.h + 19, class: "ss-label", "text-anchor": "middle" }, "r=0"));
    svg.appendChild(svgNode(doc, "text", { x: left.x + left.w, y: left.y + left.h + 19, class: "ss-label", "text-anchor": "end" }, "1"));
    svg.appendChild(svgNode(doc, "text", { x: left.x + 6, y: left.y + 16, class: "ss-label" }, "虚线 epsilon=1；金线当前"));

    var lawSeries = MODES.map(function (mode) {
      var q = qForMode(state.n, state.p, mode.id);
      var points = [];
      var values = [];
      var index;
      for (index = 0; index <= 40; index += 1) {
        var logEpsilon = MIN_LOG_EPSILON + (0 - MIN_LOG_EPSILON) * index / 40;
        var result = compute({ n: state.n, p: state.p, q: q, epsilon: Math.pow(10, logEpsilon) });
        values.push(Math.log10(result.lq));
        points.push({ x: logEpsilon, y: Math.log10(result.lq) });
      }
      return { mode: mode, q: q, points: points, values: values };
    });
    var allValues = [];
    lawSeries.forEach(function (series) { allValues = allValues.concat(series.values); });
    var yMin = Math.min.apply(null, allValues);
    var yMax = Math.max.apply(null, allValues);
    if (Math.abs(yMax - yMin) < 0.2) { yMin -= 0.1; yMax += 0.1; }
    var padding = (yMax - yMin) * 0.08;
    yMin -= padding; yMax += padding;
    function mapX(value) { return right.x + ((value - MIN_LOG_EPSILON) / (0 - MIN_LOG_EPSILON)) * right.w; }
    function mapY(value) { return right.y + right.h - ((value - yMin) / (yMax - yMin)) * right.h; }
    [0, 0.5, 1].forEach(function (fraction) {
      var y = right.y + right.h * fraction;
      svg.appendChild(svgNode(doc, "line", { x1: right.x, y1: y, x2: right.x + right.w, y2: y, class: "ss-grid" }));
    });
    svg.appendChild(svgNode(doc, "line", { x1: right.x, y1: right.y + right.h, x2: right.x + right.w, y2: right.y + right.h, class: "ss-axis" }));
    lawSeries.forEach(function (series) {
      var d = series.points.map(function (point, index) { return (index ? "L" : "M") + mapX(point.x).toFixed(2) + "," + mapY(point.y).toFixed(2); }).join(" ");
      var className = series.mode.id === "subcritical" ? "ss-sub" : (series.mode.id === "critical" ? "ss-critical" : "ss-super");
      svg.appendChild(svgNode(doc, "path", { d: d, class: "ss-law " + className }));
      var selected = compute({ n: state.n, p: state.p, q: series.q, epsilon: current.epsilon });
      svg.appendChild(svgNode(doc, "circle", { cx: mapX(state.logEpsilon), cy: mapY(Math.log10(selected.lq)), r: series.mode.id === state.mode ? "5" : "3.5", class: "ss-dot " + className }));
    });
    svg.appendChild(svgNode(doc, "text", { x: right.x, y: right.y + right.h + 19, class: "ss-label" }, "-2"));
    svg.appendChild(svgNode(doc, "text", { x: right.x + right.w, y: right.y + right.h + 19, class: "ss-label", "text-anchor": "end" }, "0 = log10 epsilon"));
    svg.appendChild(svgNode(doc, "text", { x: right.x + 5, y: right.y + 15, class: "ss-label ss-sub" }, "蓝 q=p"));
    svg.appendChild(svgNode(doc, "text", { x: right.x + 82, y: right.y + 15, class: "ss-label ss-critical" }, "绿 q=p*"));
    svg.appendChild(svgNode(doc, "text", { x: right.x + 164, y: right.y + 15, class: "ss-label ss-super" }, "红 q>p*"));
  }

  function replaceRows(doc, body, rows) {
    clear(body);
    rows.forEach(function (values) {
      var row = makeElement(doc, "tr");
      values.forEach(function (value) { row.appendChild(makeElement(doc, "td", {}, String(value))); });
      body.appendChild(row);
    });
  }

  function copyPreset(preset) {
    return { id: preset.id, n: preset.n, p: preset.p, logEpsilon: preset.logEpsilon, mode: preset.mode };
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    injectStyles(doc);
    clear(root);
    var uid = "ss-" + (SERIAL += 1);
    var state = copyPreset(PRESETS[0]);
    var answers = { peak: null, critical: null, supercritical: null };
    var shell = makeElement(doc, "div", { className: "ss-lab" });
    shell.appendChild(makeElement(doc, "h3", {}, "Sobolev 缩放：固定梯度预算"));
    shell.appendChild(makeElement(doc, "p", { className: "ss-intro" }, "把帽函数的梯度 Lp 范数钉为 1，再缩小支撑。先预测峰值和三种 Lq 命运，揭示后用精确 Beta 因子核对。"));
    var questions = [
      { key: "peak", prompt: "1. 在 p<n 时缩小 epsilon，峰值会怎样？", expected: "grow", choices: [["shrink", "降低"], ["same", "不变"], ["grow", "升高"]] },
      { key: "critical", prompt: "2. q=p* 时 Lq 范数随 epsilon 怎样？", expected: "same", choices: [["zero", "趋于 0"], ["same", "保持尺度"], ["infinity", "发散"]] },
      { key: "supercritical", prompt: "3. q>p* 时 Lq 范数随 epsilon 怎样？", expected: "infinity", choices: [["zero", "趋于 0"], ["same", "保持尺度"], ["infinity", "发散"]] }
    ];
    var form = makeElement(doc, "form");
    var fieldset = makeElement(doc, "fieldset");
    fieldset.appendChild(makeElement(doc, "legend", {}, "预测门：三项都回答后才显示曲线"));
    var choiceButtons = [];
    questions.forEach(function (question) {
      fieldset.appendChild(makeElement(doc, "p", { className: "ss-question" }, question.prompt));
      var row = makeElement(doc, "div", { className: "ss-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          answers[question.key] = choice[0];
          choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); });
        });
        choiceButtons.push({ key: question.key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
    });
    form.appendChild(fieldset);
    var submit = makeElement(doc, "button", { type: "submit", className: "ss-primary" }, "提交预测并揭示");
    var resetPredictions = makeElement(doc, "button", { type: "button" }, "清空预测");
    form.appendChild(makeElement(doc, "div", { className: "ss-actions" }, [submit, resetPredictions]));
    var feedback = makeElement(doc, "p", { className: "ss-feedback", role: "status", "aria-live": "polite" }, "请完成三项预测。 ");
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = makeElement(doc, "section", { className: "ss-revealed", hidden: "hidden" });
    var layout = makeElement(doc, "div", { className: "ss-layout" });
    var controls = makeElement(doc, "div", { className: "ss-controls" });
    controls.appendChild(makeElement(doc, "h4", {}, "维数与可积指数预设"));
    var presetGroup = makeElement(doc, "div", { className: "ss-presets", role: "group", "aria-label": "Sobolev 维数预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () { state = copyPreset(preset); render(); });
      presetButtons.push({ id: preset.id, node: button });
      presetGroup.appendChild(button);
    });
    controls.appendChild(presetGroup);
    controls.appendChild(makeElement(doc, "h4", {}, "选择要审计的 q"));
    var modeGroup = makeElement(doc, "div", { className: "ss-modes", role: "group", "aria-label": "q 相对临界指数的位置" });
    var modeButtons = [];
    MODES.forEach(function (mode) {
      var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, mode.label);
      button.addEventListener("click", function () { state.mode = mode.id; state.id = "custom"; render(); });
      modeButtons.push({ id: mode.id, node: button });
      modeGroup.appendChild(button);
    });
    controls.appendChild(modeGroup);
    var epsilonOutput = makeElement(doc, "output", { for: uid + "-epsilon" }, "");
    var epsilonInput = makeElement(doc, "input", { id: uid + "-epsilon", type: "range", min: String(MIN_LOG_EPSILON), max: "0", step: "0.05", value: String(state.logEpsilon) });
    controls.appendChild(makeElement(doc, "div", { className: "ss-control" }, [
      makeElement(doc, "label", { for: uid + "-epsilon" }, ["支撑半径 epsilon：", epsilonOutput]),
      epsilonInput,
      makeElement(doc, "div", { className: "ss-scale" }, [makeElement(doc, "span", {}, "0.01"), makeElement(doc, "span", {}, "1")])
    ]));
    var relock = makeElement(doc, "button", { type: "button" }, "重新预测");
    controls.appendChild(relock);
    layout.appendChild(controls);

    var stage = makeElement(doc, "div", { className: "ss-stage" });
    var svg = svgNode(doc, "svg", { class: "ss-svg", width: "640", height: "330", viewBox: "0 0 640 330", role: "img", "aria-label": "Sobolev 径向帽与临界缩放图" });
    stage.appendChild(makeElement(doc, "div", { className: "ss-frame" }, svg));
    var metrics = [metric(doc, "临界指数 p*"), metric(doc, "梯度 ||Du||p"), metric(doc, "支撑体积"), metric(doc, "峰值 ||u||inf"), metric(doc, "当前 ||u||q"), metric(doc, "缩放指数 s(q)")];
    stage.appendChild(makeElement(doc, "div", { className: "ss-metrics" }, metrics.map(function (item) { return item.node; })));
    stage.appendChild(makeElement(doc, "h4", {}, "三种 q 的同尺度账本"));
    var table = makeElement(doc, "table");
    var head = makeElement(doc, "thead");
    var headRow = makeElement(doc, "tr");
    ["位置", "q", "s(q)", "当前 ||u||q", "epsilon -> 0", "定理读法"].forEach(function (label) { headRow.appendChild(makeElement(doc, "th", {}, label)); });
    head.appendChild(headRow); table.appendChild(head);
    var body = makeElement(doc, "tbody"); table.appendChild(body);
    stage.appendChild(makeElement(doc, "div", { className: "ss-table-wrap" }, table));
    var interpretation = makeElement(doc, "p", { className: "ss-interpretation", role: "status", "aria-live": "polite" }, "");
    stage.appendChild(interpretation);
    layout.appendChild(stage);
    revealed.appendChild(layout);
    shell.appendChild(revealed);
    root.appendChild(shell);

    function render() {
      var epsilon = Math.pow(10, state.logEpsilon);
      var q = qForMode(state.n, state.p, state.mode);
      var current = compute({ n: state.n, p: state.p, q: q, epsilon: epsilon });
      epsilonInput.value = String(state.logEpsilon);
      epsilonOutput.textContent = format(epsilon, epsilon < 0.1 ? 3 : 2) + "（log10=" + format(state.logEpsilon, 2) + "）";
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.id ? "true" : "false"); });
      modeButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.mode ? "true" : "false"); });
      metrics[0].value.textContent = format(current.pStar, 4);
      metrics[1].value.textContent = format(current.gradientNorm, 8);
      metrics[2].value.textContent = format(current.supportVolume, 4);
      metrics[3].value.textContent = format(current.amplitude, 4);
      metrics[4].value.textContent = format(current.lq, 6);
      metrics[5].value.textContent = format(current.exponent, 6);
      drawChart(doc, svg, state, current);
      replaceRows(doc, body, MODES.map(function (mode) {
        var modeQ = qForMode(state.n, state.p, mode.id);
        var result = compute({ n: state.n, p: state.p, q: modeQ, epsilon: epsilon });
        var limit = result.exponent > EPS ? "趋于 0" : (result.exponent < -EPS ? "发散" : "保持尺度");
        var reading = mode.id === "critical" ? "尺度允许齐次嵌入" : (mode.id === "subcritical" ? "有界域上进入紧性区" : "统一梯度控制不可能");
        return [mode.label, format(modeQ, 4), format(result.exponent, 6), format(result.lq, 6), limit, reading];
      }));
      var verdict = current.exponent > EPS ? "次临界：支撑收缩压过峰值增长，Lq 趋于 0。" : (current.exponent < -EPS ? "超临界：峰值增长压过支撑收缩，Lq 发散。" : "临界：两个效应正好抵消，Lq 保持尺度。 ");
      interpretation.textContent = "n=" + state.n + "，p=" + format(state.p, 2) + "，q=" + format(q, 4) + "。梯度账本恒为 " + format(current.gradientNorm, 8) + "；" + verdict + " 这只解释临界标度，不提供 sharp 常数，也不替代嵌入定理的域与边界条件。";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (questions.some(function (question) { return !answers[question.key]; })) {
        feedback.className = "ss-feedback ss-warn";
        feedback.textContent = "请先完成三项预测。";
        return;
      }
      var correct = questions.filter(function (question) { return answers[question.key] === question.expected; }).length;
      feedback.className = "ss-feedback " + (correct === questions.length ? "ss-pass" : "ss-warn");
      feedback.textContent = "已记录：" + correct + "/" + questions.length + " 项与缩放账本一致。现在用指数 s(q) 核对。";
      revealed.removeAttribute("hidden");
      render();
    });
    resetPredictions.addEventListener("click", function () {
      answers = { peak: null, critical: null, supercritical: null };
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); });
      feedback.className = "ss-feedback"; feedback.textContent = "预测已清空。";
    });
    epsilonInput.addEventListener("input", function () { state.logEpsilon = Number(epsilonInput.value); state.id = "custom"; render(); });
    relock.addEventListener("click", function () {
      revealed.setAttribute("hidden", "hidden");
      answers = { peak: null, critical: null, supercritical: null };
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); });
      feedback.className = "ss-feedback"; feedback.textContent = "已重新上锁，请再做三项预测。";
    });
  }

  return {
    PRESETS: PRESETS,
    MODES: MODES,
    logGamma: logGamma,
    unitBallVolume: unitBallVolume,
    criticalExponent: criticalExponent,
    qForMode: qForMode,
    compute: compute,
    selfTest: selfTest,
    mount: mount
  };
});
