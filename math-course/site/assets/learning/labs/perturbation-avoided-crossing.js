(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("perturbation-avoided-crossing", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("perturbation-avoided-crossing self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("perturbation-avoided-crossing self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-perturbation-avoided-crossing-styles";
  var SERIAL = 0;
  var EPS = 1e-10;
  var DETUNING_LIMIT = 1.5;

  var PRESETS = [
    { id: "far", label: "远离简并", delta: 1.2, v: 0.06, phiDeg: 90 },
    { id: "near", label: "近简并", delta: 0.12, v: 0.06, phiDeg: 90 },
    { id: "degenerate", label: "精确简并", delta: 0, v: 0.12, phiDeg: 135 },
    { id: "crossing", label: "真交叉", delta: 0, v: 0, phiDeg: 25 }
  ];

  var STYLE_TEXT = [
    ".pa-lab{--pa-blue:var(--cl-blue,#315f9d);--pa-gold:var(--cl-gold,#95670d);--pa-green:var(--cl-green,#347247);--pa-red:var(--cl-red,#b13d32);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".pa-lab *,.pa-lab *::before,.pa-lab *::after{box-sizing:border-box;}.pa-lab [hidden]{display:none!important;}",
    ".pa-lab h3,.pa-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.pa-lab h3{font-size:1.16rem;}.pa-lab h4{margin-top:16px;font-size:1rem;}",
    ".pa-lab .pa-intro,.pa-lab .pa-note,.pa-lab .pa-feedback,.pa-lab .pa-interpretation{color:var(--fg-soft);font-size:13px;overflow-wrap:anywhere;}",
    ".pa-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.pa-lab legend{margin-bottom:8px;font-weight:750;}.pa-lab .pa-question{margin:12px 0 6px;font-size:13px;font-weight:700;}",
    ".pa-lab .pa-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.pa-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.pa-lab button:hover{border-color:var(--accent);}.pa-lab button:focus-visible,.pa-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.pa-lab button[aria-pressed=true],.pa-lab button.pa-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.pa-lab button:disabled{opacity:.55;cursor:not-allowed;}",
    ".pa-lab .pa-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.pa-lab .pa-actions>*{flex:1 1 160px;}.pa-lab .pa-feedback{min-height:2em;margin:8px 0;font-weight:700;}.pa-lab .pa-pass{color:var(--pa-green);}.pa-lab .pa-warn{color:var(--pa-red);}",
    ".pa-lab .pa-revealed{margin-top:16px;padding-top:16px;border-top:1px solid var(--border);}.pa-lab .pa-layout{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.32fr);gap:16px;align-items:start;min-width:0;}.pa-lab .pa-controls,.pa-lab .pa-stage{min-width:0;}.pa-lab .pa-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.pa-lab .pa-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.pa-lab .pa-presets button{font-size:12px;}",
    ".pa-lab .pa-control{display:grid;gap:5px;}.pa-lab .pa-control label{font-size:13px;font-weight:700;color:var(--fg-soft);}.pa-lab .pa-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.pa-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.pa-lab .pa-scale{display:flex;justify-content:space-between;color:var(--fg-soft);font-size:11px;}",
    ".pa-lab .pa-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.pa-lab .pa-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.pa-lab .pa-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.pa-lab .pa-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7;}.pa-lab .pa-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.72;}.pa-lab .pa-exact-low{stroke:var(--pa-blue);}.pa-lab .pa-exact-high{stroke:var(--pa-gold);}.pa-lab .pa-approx{stroke:var(--pa-red);stroke-dasharray:6 5;}.pa-lab .pa-unperturbed{stroke:var(--fg-soft);stroke-dasharray:3 5;}.pa-lab .pa-curve{fill:none;stroke-width:2.5;}.pa-lab .pa-current{stroke:var(--pa-green);stroke-width:1.5;stroke-dasharray:4 4;}.pa-lab .pa-dot{stroke:var(--bg);stroke-width:2;}.pa-lab .pa-label{font-size:10.5px;}.pa-lab .pa-title{font-size:12px;font-weight:800;text-anchor:middle;}.pa-lab .pa-bar-bg{fill:var(--border);}.pa-lab .pa-bar-one{fill:var(--pa-blue);}.pa-lab .pa-bar-two{fill:var(--pa-gold);}",
    ".pa-lab .pa-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0;}.pa-lab .pa-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.pa-lab .pa-metric:nth-child(1),.pa-lab .pa-metric:nth-child(4){border-color:var(--pa-blue);}.pa-lab .pa-metric:nth-child(2),.pa-lab .pa-metric:nth-child(5){border-color:var(--pa-gold);}.pa-lab .pa-metric:nth-child(3),.pa-lab .pa-metric:nth-child(6){border-color:var(--pa-red);}.pa-lab .pa-metric span{display:block;color:var(--fg-soft);font-size:11.5px;}.pa-lab .pa-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".pa-lab .pa-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}.pa-lab table{width:100%;min-width:690px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.pa-lab th,.pa-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.pa-lab th{color:var(--fg-soft);font-size:11.5px;}.pa-lab .pa-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--pa-green);background:var(--bg);}",
    "@media(max-width:1180px){.pa-lab .pa-layout{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:680px){.pa-lab .pa-choice-row{grid-template-columns:minmax(0,1fr);}.pa-lab .pa-presets{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:420px){.pa-lab .pa-frame{padding:4px;}.pa-lab table{font-size:11.5px;}.pa-lab th,.pa-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.pa-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function degreesToRadians(value) {
    return value * Math.PI / 180;
  }

  function compute(input) {
    var delta = Number(input.delta);
    var v = Number(input.v);
    var phiDeg = Number(input.phiDeg);
    if (!finite(delta) || !finite(v) || !finite(phiDeg)) throw new RangeError("delta, v, and phiDeg must be finite");
    var radius = Math.hypot(delta / 2, v);
    var ground = -radius;
    var excited = radius;
    var gap = 2 * radius;
    var ratio = Math.abs(delta) > EPS ? Math.abs(v / delta) : null;
    var approxGround = Math.abs(delta) > EPS ? -Math.abs(delta) / 2 - v * v / Math.abs(delta) : null;
    var approxExcited = Math.abs(delta) > EPS ? Math.abs(delta) / 2 + v * v / Math.abs(delta) : null;
    var phi = degreesToRadians(phiDeg);
    var trialEnergy = (delta / 2) * Math.cos(2 * phi) + v * Math.sin(2 * phi);
    var groundP1 = radius > EPS ? 0.5 * (1 - delta / (2 * radius)) : null;
    var groundP2 = groundP1 === null ? null : 1 - groundP1;
    var excitedP1 = groundP1 === null ? null : 1 - groundP1;
    var excitedP2 = excitedP1 === null ? null : 1 - excitedP1;
    var optimumPhiDeg = radius > EPS ? 0.5 * Math.atan2(-2 * v, -delta) * 180 / Math.PI : null;
    var variationalGap = trialEnergy - ground;
    if (variationalGap < 0 && variationalGap > -1e-12) variationalGap = 0;
    return {
      delta: delta,
      v: v,
      phiDeg: phiDeg,
      ground: ground,
      excited: excited,
      gap: gap,
      ratio: ratio,
      approxGround: approxGround,
      approxExcited: approxExcited,
      approxError: approxGround === null ? null : Math.abs(approxGround - ground),
      trialEnergy: trialEnergy,
      variationalGap: variationalGap,
      groundP1: groundP1,
      groundP2: groundP2,
      excitedP1: excitedP1,
      excitedP2: excitedP2,
      optimumPhiDeg: optimumPhiDeg,
      degenerate: Math.abs(delta) <= EPS,
      trueCrossing: radius <= EPS
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
    var deltaIndex;
    var vIndex;
    var phi;
    for (deltaIndex = -50; deltaIndex <= 50; deltaIndex += 1) {
      var delta = 1.5 * deltaIndex / 50;
      for (vIndex = -10; vIndex <= 10; vIndex += 1) {
        var v = 0.3 * vIndex / 10;
        var base = compute({ delta: delta, v: v, phiDeg: 0 });
        checks += 7;
        assert(finite(base.ground) && finite(base.excited) && finite(base.gap), "nonfinite exact spectrum");
        assert(near(base.ground + base.excited, 0, 1e-10), "trace identity failed");
        assert(near(base.ground * base.excited, -((delta / 2) * (delta / 2) + v * v), 1e-10), "determinant identity failed");
        assert(base.gap >= -EPS && near(base.gap, 2 * Math.hypot(delta / 2, v), 1e-10), "gap identity failed");
        assert(base.approxGround === null || finite(base.approxGround), "invalid perturbative output");
        assert(base.groundP1 === null || near(base.groundP1 + base.groundP2, 1, 1e-10), "ground probabilities do not sum to 1");
        assert(base.excitedP1 === null || near(base.excitedP1 + base.excitedP2, 1, 1e-10), "excited probabilities do not sum to 1");
        for (phi = -180; phi <= 180; phi += 30) {
          var trial = compute({ delta: delta, v: v, phiDeg: phi });
          checks += 2;
          assert(finite(trial.trialEnergy), "trial energy is not finite");
          assert(trial.trialEnergy + 1e-10 >= trial.ground, "variational upper bound failed");
        }
      }
    }
    var far = compute({ delta: 4, v: 0.5, phiDeg: 90 });
    var nearCase = compute({ delta: 0.4, v: 0.5, phiDeg: 90 });
    var degenerate = compute({ delta: 0, v: 0.12, phiDeg: 135 });
    var crossing = compute({ delta: 0, v: 0, phiDeg: 17 });
    checks += 9;
    assert(near(far.ground, -2.061552812809, 1e-10), "far exact ground mismatch");
    assert(near(far.approxGround, -2.0625, 1e-10), "far second-order mismatch");
    assert(far.approxError < nearCase.approxError, "approximation should worsen as |v/delta| grows in reference cases");
    assert(near(degenerate.gap, 0.24), "degenerate avoided-crossing gap should be 2|v|");
    assert(degenerate.ratio === null && degenerate.approxGround === null, "nondegenerate formula should be unavailable at delta=0");
    assert(near(degenerate.groundP1, 0.5) && near(degenerate.groundP2, 0.5), "degenerate basis weights should be half-half");
    assert(crossing.trueCrossing && near(crossing.gap, 0), "zero matrix should be a true crossing");
    assert(crossing.groundP1 === null && crossing.optimumPhiDeg === null, "zero matrix eigenbasis should be nonunique");
    assert(near(degenerate.trialEnergy, degenerate.ground, 1e-10), "phi=135 should minimize positive-v degenerate model");
    var rejected = false;
    try { compute({ delta: 0, v: NaN, phiDeg: 0 }); } catch (error) { rejected = true; }
    checks += 1;
    assert(rejected, "nonfinite input should be rejected");
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
    if (value === null || value === undefined) return "不定义";
    if (!finite(value)) return "--";
    var absolute = Math.abs(value);
    if ((absolute > 0 && absolute < 0.001) || absolute >= 10000) return value.toExponential(digits === undefined ? 2 : digits);
    var text = value.toFixed(digits === undefined ? 4 : digits);
    if (text.indexOf(".") >= 0) text = text.replace(/0+$/, "").replace(/\.$/, "");
    return text;
  }

  function metric(doc, label) {
    var value = makeElement(doc, "strong", {}, "--");
    return { node: makeElement(doc, "div", { className: "pa-metric" }, [makeElement(doc, "span", {}, label), value]), value: value };
  }

  function pathFrom(points, mapX, mapY) {
    return points.map(function (point, index) { return (index ? "L" : "M") + mapX(point.x).toFixed(2) + "," + mapY(point.y).toFixed(2); }).join(" ");
  }

  function drawChart(doc, svg, current) {
    clear(svg);
    svg.appendChild(svgNode(doc, "desc", {}, "左图显示精确二能级避免交叉、未耦合能级和远离简并区域的二阶近似；右图显示当前基态和激发态在两个原始基底上的概率。"));
    var plot = { x: 45, y: 45, w: 405, h: 255 };
    var bars = { x: 505, y: 70, w: 135, h: 205 };
    var yLimit = 0.9;
    function mapX(value) { return plot.x + ((value + DETUNING_LIMIT) / (2 * DETUNING_LIMIT)) * plot.w; }
    function mapY(value) { return plot.y + plot.h - ((value + yLimit) / (2 * yLimit)) * plot.h; }
    [-0.6, 0, 0.6].forEach(function (value) {
      svg.appendChild(svgNode(doc, "line", { x1: plot.x, y1: mapY(value), x2: plot.x + plot.w, y2: mapY(value), class: value === 0 ? "pa-axis" : "pa-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: plot.x - 6, y: mapY(value) + 4, class: "pa-label", "text-anchor": "end" }, format(value, 1)));
    });
    svg.appendChild(svgNode(doc, "line", { x1: mapX(0), y1: plot.y, x2: mapX(0), y2: plot.y + plot.h, class: "pa-grid" }));
    svg.appendChild(svgNode(doc, "text", { x: plot.x + plot.w / 2, y: 23, class: "pa-title" }, "能级随 detuning delta 变化"));
    svg.appendChild(svgNode(doc, "text", { x: plot.x, y: plot.y + plot.h + 20, class: "pa-label" }, "-1.5"));
    svg.appendChild(svgNode(doc, "text", { x: plot.x + plot.w, y: plot.y + plot.h + 20, class: "pa-label", "text-anchor": "end" }, "+1.5"));
    svg.appendChild(svgNode(doc, "text", { x: plot.x + plot.w / 2, y: plot.y + plot.h + 20, class: "pa-label", "text-anchor": "middle" }, "delta"));

    var low = [];
    var high = [];
    var unLow = [];
    var unHigh = [];
    var approxLowSegments = [[]];
    var approxHighSegments = [[]];
    var index;
    for (index = 0; index <= 180; index += 1) {
      var delta = -DETUNING_LIMIT + 2 * DETUNING_LIMIT * index / 180;
      var data = compute({ delta: delta, v: current.v, phiDeg: current.phiDeg });
      low.push({ x: delta, y: data.ground });
      high.push({ x: delta, y: data.excited });
      unLow.push({ x: delta, y: -Math.abs(delta) / 2 });
      unHigh.push({ x: delta, y: Math.abs(delta) / 2 });
      if (data.ratio !== null && data.ratio <= 0.3 && Math.abs(data.approxGround) <= yLimit * 1.05) {
        approxLowSegments[approxLowSegments.length - 1].push({ x: delta, y: data.approxGround });
        approxHighSegments[approxHighSegments.length - 1].push({ x: delta, y: data.approxExcited });
      } else if (approxLowSegments[approxLowSegments.length - 1].length) {
        approxLowSegments.push([]); approxHighSegments.push([]);
      }
    }
    svg.appendChild(svgNode(doc, "path", { d: pathFrom(unLow, mapX, mapY), class: "pa-curve pa-unperturbed" }));
    svg.appendChild(svgNode(doc, "path", { d: pathFrom(unHigh, mapX, mapY), class: "pa-curve pa-unperturbed" }));
    svg.appendChild(svgNode(doc, "path", { d: pathFrom(low, mapX, mapY), class: "pa-curve pa-exact-low" }));
    svg.appendChild(svgNode(doc, "path", { d: pathFrom(high, mapX, mapY), class: "pa-curve pa-exact-high" }));
    approxLowSegments.forEach(function (segment, segmentIndex) {
      if (segment.length > 1) svg.appendChild(svgNode(doc, "path", { d: pathFrom(segment, mapX, mapY), class: "pa-curve pa-approx", "data-segment": String(segmentIndex) }));
    });
    approxHighSegments.forEach(function (segment, segmentIndex) {
      if (segment.length > 1) svg.appendChild(svgNode(doc, "path", { d: pathFrom(segment, mapX, mapY), class: "pa-curve pa-approx", "data-segment": String(segmentIndex) }));
    });
    var currentX = mapX(current.delta);
    svg.appendChild(svgNode(doc, "line", { x1: currentX, y1: plot.y, x2: currentX, y2: plot.y + plot.h, class: "pa-current" }));
    svg.appendChild(svgNode(doc, "circle", { cx: currentX, cy: mapY(current.ground), r: "5", class: "pa-dot", fill: "var(--pa-blue)" }));
    svg.appendChild(svgNode(doc, "circle", { cx: currentX, cy: mapY(current.excited), r: "5", class: "pa-dot", fill: "var(--pa-gold)" }));
    svg.appendChild(svgNode(doc, "text", { x: plot.x + 8, y: plot.y + 15, class: "pa-label pa-exact-low" }, "蓝/金：精确；红虚：二阶；灰虚：v=0"));

    svg.appendChild(svgNode(doc, "text", { x: bars.x + bars.w / 2, y: 23, class: "pa-title" }, "当前本征态的基底权重"));
    if (current.groundP1 === null) {
      svg.appendChild(svgNode(doc, "text", { x: bars.x + bars.w / 2, y: bars.y + 82, class: "pa-label", "text-anchor": "middle" }, "H=0：本征基不唯一"));
    } else {
      [
        { label: "基态", y: bars.y + 20, p1: current.groundP1, p2: current.groundP2 },
        { label: "激发态", y: bars.y + 112, p1: current.excitedP1, p2: current.excitedP2 }
      ].forEach(function (entry) {
        svg.appendChild(svgNode(doc, "text", { x: bars.x, y: entry.y - 8, class: "pa-label" }, entry.label));
        svg.appendChild(svgNode(doc, "rect", { x: bars.x, y: entry.y, width: bars.w, height: "30", rx: "3", class: "pa-bar-bg" }));
        svg.appendChild(svgNode(doc, "rect", { x: bars.x, y: entry.y, width: bars.w * entry.p1, height: "30", rx: "3", class: "pa-bar-one" }));
        svg.appendChild(svgNode(doc, "rect", { x: bars.x + bars.w * entry.p1, y: entry.y, width: bars.w * entry.p2, height: "30", rx: "3", class: "pa-bar-two" }));
        svg.appendChild(svgNode(doc, "text", { x: bars.x, y: entry.y + 49, class: "pa-label" }, "|1>: " + format(100 * entry.p1, 1) + "%"));
        svg.appendChild(svgNode(doc, "text", { x: bars.x + bars.w, y: entry.y + 49, class: "pa-label", "text-anchor": "end" }, "|2>: " + format(100 * entry.p2, 1) + "%"));
      });
    }
    svg.appendChild(svgNode(doc, "text", { x: bars.x, y: 313, class: "pa-label" }, "蓝=|1>，金=|2>"));
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
    return { id: preset.id, delta: preset.delta, v: preset.v, phiDeg: preset.phiDeg };
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    injectStyles(doc);
    clear(root);
    var uid = "pa-" + (SERIAL += 1);
    var state = copyPreset(PRESETS[0]);
    var answers = { reliable: null, gap: null, variational: null };
    var shell = makeElement(doc, "div", { className: "pa-lab" });
    shell.appendChild(makeElement(doc, "h3", {}, "二能级微扰：谱隙才是分母"));
    shell.appendChild(makeElement(doc, "p", { className: "pa-intro" }, "同一个小耦合 v，在大谱隙处可能可靠，在近简并处却会强烈混合。先做三项预测，再用精确对角化审计二阶式和变分上界。"));
    var questions = [
      { key: "reliable", prompt: "1. 判断非简并展开可靠性，主要看什么？", expected: "ratio", choices: [["v", "只看 |v|"], ["ratio", "看 |v/delta|"], ["phi", "看试探角 phi"]] },
      { key: "gap", prompt: "2. delta=0 且 v 非零时最小能隙是多少？", expected: "twov", choices: [["zero", "0"], ["v", "|v|"], ["twov", "2|v|"]] },
      { key: "variational", prompt: "3. 归一化试探态能量能低于精确基态吗？", expected: "no", choices: [["yes", "可以"], ["no", "不可以"], ["excited", "只对激发态不可以"]] }
    ];
    var form = makeElement(doc, "form");
    var fieldset = makeElement(doc, "fieldset");
    fieldset.appendChild(makeElement(doc, "legend", {}, "预测门：三项都回答后才显示谱"));
    var choiceButtons = [];
    questions.forEach(function (question) {
      fieldset.appendChild(makeElement(doc, "p", { className: "pa-question" }, question.prompt));
      var row = makeElement(doc, "div", { className: "pa-choice-row", role: "group", "aria-label": question.prompt });
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
    var submit = makeElement(doc, "button", { type: "submit", className: "pa-primary" }, "提交预测并揭示");
    var clearPredictions = makeElement(doc, "button", { type: "button" }, "清空预测");
    form.appendChild(makeElement(doc, "div", { className: "pa-actions" }, [submit, clearPredictions]));
    var feedback = makeElement(doc, "p", { className: "pa-feedback", role: "status", "aria-live": "polite" }, "请完成三项预测。 ");
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = makeElement(doc, "section", { className: "pa-revealed", hidden: "hidden" });
    var layout = makeElement(doc, "div", { className: "pa-layout" });
    var controls = makeElement(doc, "div", { className: "pa-controls" });
    controls.appendChild(makeElement(doc, "h4", {}, "教学预设"));
    var presets = makeElement(doc, "div", { className: "pa-presets", role: "group", "aria-label": "二能级预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () { state = copyPreset(preset); render(); });
      presetButtons.push({ id: preset.id, node: button });
      presets.appendChild(button);
    });
    controls.appendChild(presets);

    function rangeControl(id, label, min, max, step) {
      var output = makeElement(doc, "output", { for: uid + "-" + id }, "");
      var input = makeElement(doc, "input", { id: uid + "-" + id, type: "range", min: String(min), max: String(max), step: String(step) });
      return {
        node: makeElement(doc, "div", { className: "pa-control" }, [
          makeElement(doc, "label", { for: uid + "-" + id }, [label + "：", output]),
          input,
          makeElement(doc, "div", { className: "pa-scale" }, [makeElement(doc, "span", {}, String(min)), makeElement(doc, "span", {}, String(max))])
        ]),
        input: input,
        output: output
      };
    }
    var deltaControl = rangeControl("delta", "detuning delta", -1.5, 1.5, 0.01);
    var vControl = rangeControl("v", "耦合 v", -0.3, 0.3, 0.01);
    var phiControl = rangeControl("phi", "试探角 phi（度）", -180, 180, 1);
    controls.appendChild(deltaControl.node); controls.appendChild(vControl.node); controls.appendChild(phiControl.node);
    var relock = makeElement(doc, "button", { type: "button" }, "重新预测");
    controls.appendChild(relock);
    layout.appendChild(controls);

    var stage = makeElement(doc, "div", { className: "pa-stage" });
    var svg = svgNode(doc, "svg", { class: "pa-svg", width: "680", height: "330", viewBox: "0 0 680 330", role: "img", "aria-label": "二能级避免交叉和基底混合概率图" });
    stage.appendChild(makeElement(doc, "div", { className: "pa-frame" }, svg));
    var metrics = [metric(doc, "控制比 |v/delta|"), metric(doc, "精确 gap"), metric(doc, "精确 E0"), metric(doc, "二阶 E0"), metric(doc, "二阶绝对误差"), metric(doc, "试探值 - E0")];
    stage.appendChild(makeElement(doc, "div", { className: "pa-metrics" }, metrics.map(function (item) { return item.node; })));
    stage.appendChild(makeElement(doc, "h4", {}, "三种方法的当前账本"));
    var table = makeElement(doc, "table");
    var head = makeElement(doc, "thead");
    var headRow = makeElement(doc, "tr");
    ["方法", "当前结果", "需要的条件", "不能推出什么"].forEach(function (label) { headRow.appendChild(makeElement(doc, "th", {}, label)); });
    head.appendChild(headRow); table.appendChild(head);
    var body = makeElement(doc, "tbody"); table.appendChild(body);
    stage.appendChild(makeElement(doc, "div", { className: "pa-table-wrap" }, table));
    var interpretation = makeElement(doc, "p", { className: "pa-interpretation", role: "status", "aria-live": "polite" }, "");
    stage.appendChild(interpretation);
    layout.appendChild(stage);
    revealed.appendChild(layout);
    shell.appendChild(revealed);
    root.appendChild(shell);

    function render() {
      var current = compute(state);
      deltaControl.input.value = String(state.delta); deltaControl.output.textContent = format(state.delta, 2);
      vControl.input.value = String(state.v); vControl.output.textContent = format(state.v, 2);
      phiControl.input.value = String(state.phiDeg); phiControl.output.textContent = format(state.phiDeg, 0) + "°";
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.id ? "true" : "false"); });
      metrics[0].value.textContent = current.ratio === null ? "不定义" : format(current.ratio, 4);
      metrics[1].value.textContent = format(current.gap, 6);
      metrics[2].value.textContent = format(current.ground, 6);
      metrics[3].value.textContent = format(current.approxGround, 6);
      metrics[4].value.textContent = format(current.approxError, 6);
      metrics[5].value.textContent = format(current.variationalGap, 6);
      drawChart(doc, svg, current);
      replaceRows(doc, body, [
        ["精确对角化", "E-= " + format(current.ground, 6) + "；E+= " + format(current.excited, 6), "这个 2x2 模型内无近似", "不能替代多能级真实模型"],
        ["非简并二阶", current.approxGround === null ? "delta=0，公式不定义" : "E0≈" + format(current.approxGround, 6), "delta!=0 且 |v/delta| 足够小", "靠近简并时不能外推"],
        ["简并子空间", current.degenerate ? (current.trueCrossing ? "V=0，本征基不唯一" : "E=±|v|，gap=2|v|") : "当前无需切换", "先在简并块内对角化 V", "不保证块外耦合可忽略"],
        ["变分试探", "E(phi)=" + format(current.trialEnergy, 6), "归一化；这里只审计基态", "不自动给激发态同类上界"]
      ]);
      var reliability = current.ratio === null ? (current.trueCrossing ? "H=0，任何基底都是本征基；非简并分母没有意义。" : "delta=0，必须先做简并对角化。") : (current.ratio <= 0.1 ? "|v/delta| 很小，二阶式在这个模型中表现良好。" : (current.ratio <= 0.3 ? "已进入过渡区，必须用精确谱检查误差。" : "接近简并，非简并二阶式不再可靠。"));
      interpretation.textContent = reliability + " 当前 gap=" + format(current.gap, 6) + "；试探能量比精确基态高 " + format(current.variationalGap, 6) + "。能量只依赖 |v|，但 v 的符号会改变本征向量的相对相位。";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (questions.some(function (question) { return !answers[question.key]; })) {
        feedback.className = "pa-feedback pa-warn"; feedback.textContent = "请先完成三项预测。"; return;
      }
      var correct = questions.filter(function (question) { return answers[question.key] === question.expected; }).length;
      feedback.className = "pa-feedback " + (correct === questions.length ? "pa-pass" : "pa-warn");
      feedback.textContent = "已记录：" + correct + "/" + questions.length + " 项与精确模型一致。现在比较谱、混合与上界。";
      revealed.removeAttribute("hidden"); render();
    });
    clearPredictions.addEventListener("click", function () {
      answers = { reliable: null, gap: null, variational: null };
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); });
      feedback.className = "pa-feedback"; feedback.textContent = "预测已清空。";
    });
    deltaControl.input.addEventListener("input", function () { state.delta = Number(deltaControl.input.value); state.id = "custom"; render(); });
    vControl.input.addEventListener("input", function () { state.v = Number(vControl.input.value); state.id = "custom"; render(); });
    phiControl.input.addEventListener("input", function () { state.phiDeg = Number(phiControl.input.value); state.id = "custom"; render(); });
    relock.addEventListener("click", function () {
      revealed.setAttribute("hidden", "hidden");
      answers = { reliable: null, gap: null, variational: null };
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); });
      feedback.className = "pa-feedback"; feedback.textContent = "已重新上锁，请再做三项预测。";
    });
  }

  return {
    PRESETS: PRESETS,
    compute: compute,
    selfTest: selfTest,
    mount: mount
  };
});
