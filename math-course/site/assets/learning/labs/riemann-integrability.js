(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("riemann-integrability", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("riemann-integrability self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("riemann-integrability self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "riemann-integrability-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var LIMITS = { n: [2, 64] };
  var MODELS = {
    continuous: {
      label: "连续：x²",
      description: "连续函数 f(x)=x²",
      truth: "可积，积分为 1/3"
    },
    step: {
      label: "阶梯：单跳点",
      description: "f(x)=1 (x<1/2)，2 (x≥1/2)",
      truth: "可积，积分为 3/2"
    },
    thomae: {
      label: "Thomae 型",
      description: "有理点按既约分母衰减，无理点为 0",
      truth: "可积，积分为 0"
    },
    dirichlet: {
      label: "Dirichlet 型",
      description: "有理点为 1，无理点为 0",
      truth: "不可积，上下和不合拢"
    }
  };
  var TAG_MODES = {
    midpoint: "中点（有理）",
    left: "左端点（有理）",
    irrational: "固定无理比例",
    alternating: "有理/无理交替"
  };
  var PRESETS = [
    { id: "continuous", label: "连续函数", modelId: "continuous", n: 8, tagMode: "midpoint" },
    { id: "step", label: "阶梯函数", modelId: "step", n: 8, tagMode: "midpoint" },
    { id: "thomae", label: "Thomae 型", modelId: "thomae", n: 8, tagMode: "midpoint" },
    { id: "dirichlet", label: "Dirichlet 型", modelId: "dirichlet", n: 8, tagMode: "alternating" }
  ];

  var STYLE_TEXT = [
    ".ri-lab{--ri-blue:var(--cl-blue,#315f9d);--ri-gold:var(--cl-gold,#9b6a12);--ri-green:var(--cl-green,#39734d);--ri-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".ri-lab *,.ri-lab *::before,.ri-lab *::after{box-sizing:border-box}",
    ".ri-lab [hidden]{display:none!important}",
    ".ri-lab button,.ri-lab select,.ri-lab input{font:inherit}",
    ".ri-lab button,.ri-lab select{min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}",
    ".ri-lab button:hover,.ri-lab select:hover{border-color:var(--accent)}",
    ".ri-lab button:focus-visible,.ri-lab select:focus-visible,.ri-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".ri-lab button[aria-pressed=true],.ri-lab .ri-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}",
    ".ri-lab .ri-note{color:var(--fg-soft);font-size:13px;line-height:1.65}",
    ".ri-lab .ri-prediction{margin-top:14px;padding:13px 14px;border-left:3px solid var(--ri-gold);background:var(--bg)}",
    ".ri-lab .ri-prediction h3{margin:0 0 10px;font-size:14px}",
    ".ri-lab fieldset{min-width:0;margin:0 0 10px;padding:10px;border:1px solid var(--border);border-radius:6px}",
    ".ri-lab legend{max-width:100%;padding:0 5px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}",
    ".ri-lab .ri-choices,.ri-lab .ri-actions,.ri-lab .ri-presets{display:flex;flex-wrap:wrap;gap:8px}",
    ".ri-lab .ri-choices button,.ri-lab .ri-presets button,.ri-lab .ri-actions>*{flex:1 1 150px}",
    ".ri-lab .ri-feedback{min-height:2em;margin:9px 0 0;color:var(--fg-soft);font-size:13px;font-weight:700}",
    ".ri-lab .ri-pass{color:var(--ri-green)}.ri-lab .ri-warn{color:var(--ri-red)}",
    ".ri-lab .ri-controls{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:12px;margin-top:16px}",
    ".ri-lab .ri-control-group{display:grid;gap:8px;min-width:0;padding:11px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}",
    ".ri-lab .ri-control-group label{color:var(--fg-soft);font-size:12.5px;font-weight:700}",
    ".ri-lab .ri-control-group output{color:var(--accent);font-variant-numeric:tabular-nums}",
    ".ri-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".ri-lab .ri-results{margin-top:18px;padding-top:15px;border-top:1px solid var(--border)}",
    ".ri-lab .ri-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 14px}",
    ".ri-lab .ri-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}",
    ".ri-lab .ri-metric span{display:block;color:var(--fg-soft);font-size:11.5px}",
    ".ri-lab .ri-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ri-lab .ri-stage{min-width:0;overflow:hidden}",
    ".ri-lab svg{display:block;width:100%;height:auto;max-width:100%;border:1px solid var(--border);border-radius:6px;background:var(--bg)}",
    ".ri-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
    ".ri-lab .ri-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.55}",
    ".ri-lab .ri-axis{stroke:currentColor;stroke-width:1.25;opacity:.75}",
    ".ri-lab .ri-target{fill:none;stroke:var(--ri-blue);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}",
    ".ri-lab .ri-rectangle{fill:var(--ri-gold);fill-opacity:.18;stroke:var(--ri-gold);stroke-width:.7}",
    ".ri-lab .ri-tag{fill:var(--ri-red);stroke:var(--bg);stroke-width:1}",
    ".ri-lab .ri-envelope{fill:var(--ri-blue);fill-opacity:.08;stroke:var(--ri-blue);stroke-width:1.5;stroke-dasharray:5 4}",
    ".ri-lab .ri-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:13px}",
    ".ri-lab table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}",
    ".ri-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px}",
    ".ri-lab th,.ri-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;white-space:nowrap}",
    ".ri-lab th{color:var(--fg-soft);font-size:11.5px}",
    "@media(max-width:760px){.ri-lab .ri-controls{grid-template-columns:minmax(0,1fr)}.ri-lab .ri-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:480px){.ri-lab .ri-metrics{grid-template-columns:minmax(0,1fr)}.ri-lab .ri-choices button,.ri-lab .ri-presets button{flex-basis:100%}}",
    "@media(prefers-reduced-motion:reduce){.ri-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function assert(condition, message) {
    if (!condition) throw new Error("riemann-integrability self-test failed: " + message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance === undefined ? 1e-9 : tolerance) * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function integer(value, fallback, min, max) {
    var parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) parsed = fallback;
    return clamp(parsed, min, max);
  }

  function gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) {
      var remainder = a % b;
      a = b;
      b = remainder;
    }
    return a || 1;
  }

  function reduceFraction(numerator, denominator) {
    var sign = denominator < 0 ? -1 : 1;
    var divisor = gcd(numerator, denominator);
    return { numerator: sign * numerator / divisor, denominator: sign * denominator / divisor };
  }

  function uniformPartition(n, left, right) {
    n = integer(n, 8, LIMITS.n[0], LIMITS.n[1]);
    left = Number.isFinite(left) ? left : 0;
    right = Number.isFinite(right) ? right : 1;
    var points = [];
    for (var i = 0; i <= n; i += 1) points.push(left + (right - left) * i / n);
    return points;
  }

  function mesh(partition) {
    var maximum = 0;
    for (var i = 1; i < partition.length; i += 1) {
      maximum = Math.max(maximum, partition[i] - partition[i - 1]);
    }
    return maximum;
  }

  function tagFor(partition, index, mode) {
    var n = partition.length - 1;
    var left = partition[index];
    var right = partition[index + 1];
    var midpoint = (left + right) / 2;
    if (mode === "left") {
      return { x: left, kind: "rational", numerator: index, denominator: n };
    }
    if (mode === "irrational") {
      return { x: left + (right - left) * Math.SQRT2 / 2, kind: "irrational" };
    }
    if (mode === "alternating" && index % 2 === 1) {
      return { x: left + (right - left) * Math.SQRT2 / 2, kind: "irrational" };
    }
    if (mode === "right") {
      return { x: right, kind: "rational", numerator: index + 1, denominator: n };
    }
    return { x: midpoint, kind: "rational", numerator: 2 * index + 1, denominator: 2 * n };
  }

  function thomaeSupremum(left, right) {
    for (var denominator = 1; denominator <= 512; denominator += 1) {
      var first = Math.ceil(left * denominator - EPS);
      var last = Math.floor(right * denominator + EPS);
      for (var numerator = first; numerator <= last; numerator += 1) {
        var reduced = reduceFraction(numerator, denominator);
        if (reduced.numerator / reduced.denominator >= left - EPS &&
            reduced.numerator / reduced.denominator <= right + EPS) {
          return 1 / reduced.denominator;
        }
      }
    }
    return 1 / 513;
  }

  function stepValue(x) {
    return x < 0.5 ? 1 : 2;
  }

  function valueAt(modelId, tag) {
    if (modelId === "continuous") return tag.x * tag.x;
    if (modelId === "step") return stepValue(tag.x);
    if (modelId === "dirichlet") return tag.kind === "irrational" ? 0 : 1;
    if (tag.kind === "irrational") return 0;
    var reduced = reduceFraction(tag.numerator, tag.denominator);
    return 1 / Math.abs(reduced.denominator);
  }

  function rangeOnCell(modelId, left, right) {
    if (modelId === "continuous") return { lower: left * left, upper: right * right };
    if (modelId === "step") {
      if (right < 0.5) return { lower: 1, upper: 1 };
      if (left >= 0.5) return { lower: 2, upper: 2 };
      return { lower: 1, upper: 2 };
    }
    if (modelId === "thomae") return { lower: 0, upper: thomaeSupremum(left, right) };
    return { lower: 0, upper: 1 };
  }

  function upperLowerSums(modelId, partition) {
    var lower = 0;
    var upper = 0;
    var cells = [];
    for (var i = 0; i + 1 < partition.length; i += 1) {
      var left = partition[i];
      var right = partition[i + 1];
      var range = rangeOnCell(modelId, left, right);
      var width = right - left;
      lower += range.lower * width;
      upper += range.upper * width;
      cells.push({ left: left, right: right, lower: range.lower, upper: range.upper });
    }
    return { lower: lower, upper: upper, gap: upper - lower, cells: cells };
  }

  function taggedRiemannSum(modelId, partition, tagMode) {
    var sum = 0;
    var tags = [];
    for (var i = 0; i + 1 < partition.length; i += 1) {
      var tag = tagFor(partition, i, tagMode);
      sum += valueAt(modelId, tag) * (partition[i + 1] - partition[i]);
      tags.push({ x: tag.x, value: valueAt(modelId, tag), kind: tag.kind });
    }
    return { sum: sum, tags: tags };
  }

  function normalizeConfig(config) {
    config = config || {};
    var modelId = MODELS[config.modelId] ? config.modelId : "continuous";
    var tagMode = TAG_MODES[config.tagMode] ? config.tagMode : "midpoint";
    return {
      modelId: modelId,
      tagMode: tagMode,
      n: integer(config.n, 8, LIMITS.n[0], LIMITS.n[1])
    };
  }

  function diagnostic(config) {
    var state = normalizeConfig(config);
    var partition = uniformPartition(state.n, 0, 1);
    var sums = upperLowerSums(state.modelId, partition);
    var tagged = taggedRiemannSum(state.modelId, partition, state.tagMode);
    return {
      modelId: state.modelId,
      tagMode: state.tagMode,
      n: state.n,
      partition: partition,
      mesh: mesh(partition),
      lower: sums.lower,
      upper: sums.upper,
      gap: sums.gap,
      tagged: tagged.sum,
      tags: tagged.tags,
      cells: sums.cells,
      theorem: MODELS[state.modelId].truth
    };
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return "—";
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

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function mapX(value, left, right) {
    return left + value * (right - left);
  }

  function mapY(value, top, bottom, maximum) {
    return bottom - clamp(value / maximum, 0, 1) * (bottom - top);
  }

  function plotSvg(doc, result, prefix) {
    var svg = svgElement(doc, "svg", {
      viewBox: "0 0 640 320",
      role: "img",
      "aria-labelledby": prefix + "-plot-title " + prefix + "-plot-desc"
    });
    svg.appendChild(svgElement(doc, "title", { id: prefix + "-plot-title" }, "Riemann 分割与上下和"));
    svg.appendChild(svgElement(doc, "desc", { id: prefix + "-plot-desc" }, "蓝线是函数或包络，金色矩形是当前分割的 tag 高度，红点是取点。"));
    var left = 48;
    var right = 596;
    var top = 34;
    var bottom = 252;
    var maximum = result.modelId === "continuous" ? 1.15 : 2.15;
    [0, 0.5, 1].forEach(function (value) {
      var y = mapY(value, top, bottom, maximum);
      svg.appendChild(svgElement(doc, "line", { x1: left, x2: right, y1: y, y2: y, className: "ri-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "font-size": 11, "text-anchor": "end" }, formatNumber(value, 1)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, x2: left, y1: top, y2: bottom, className: "ri-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, className: "ri-axis" }));
    result.cells.forEach(function (cell, index) {
      var x = mapX(cell.left, left, right);
      var width = mapX(cell.right, left, right) - x;
      var tag = result.tags[index];
      var y = mapY(tag.value, top, bottom, maximum);
      svg.appendChild(svgElement(doc, "rect", { x: x + 0.3, y: y, width: Math.max(0.7, width - 0.6), height: bottom - y, className: "ri-rectangle" }));
      svg.appendChild(svgElement(doc, "circle", { cx: mapX(tag.x, left, right), cy: y, r: 2.5, className: "ri-tag" }));
    });
    if (result.modelId === "continuous") {
      var path = "";
      for (var i = 0; i <= 80; i += 1) {
        var xValue = i / 80;
        var x = mapX(xValue, left, right);
        var y = mapY(xValue * xValue, top, bottom, maximum);
        path += (i ? " L " : "M ") + x.toFixed(2) + " " + y.toFixed(2);
      }
      svg.appendChild(svgElement(doc, "path", { d: path, className: "ri-target" }));
    } else if (result.modelId === "step") {
      var stepPath = "M " + left + " " + mapY(1, top, bottom, maximum) +
        " L " + mapX(0.5, left, right) + " " + mapY(1, top, bottom, maximum) +
        " L " + mapX(0.5, left, right) + " " + mapY(2, top, bottom, maximum) +
        " L " + right + " " + mapY(2, top, bottom, maximum);
      svg.appendChild(svgElement(doc, "path", { d: stepPath, className: "ri-target" }));
    } else if (result.modelId === "dirichlet") {
      svg.appendChild(svgElement(doc, "rect", {
        x: left,
        y: mapY(1, top, bottom, maximum),
        width: right - left,
        height: mapY(0, top, bottom, maximum) - mapY(1, top, bottom, maximum),
        className: "ri-envelope"
      }));
      svg.appendChild(svgElement(doc, "text", { x: right, y: 25, "font-size": 11, "text-anchor": "end" }, "每格包络 [0,1]"));
    } else {
      svg.appendChild(svgElement(doc, "text", { x: right, y: 25, "font-size": 11, "text-anchor": "end" }, "蓝：有限分母探针包络"));
    }
    svg.appendChild(svgElement(doc, "text", { x: left, y: 286, "font-size": 11 }, "x=0"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: 286, "font-size": 11, "text-anchor": "end" }, "x=1"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: 306, "font-size": 11, "text-anchor": "end" }, "n=" + result.n + "，L=" + formatNumber(result.lower, 4) + "，U=" + formatNumber(result.upper, 4) + "，R=" + formatNumber(result.tagged, 4)));
    return svg;
  }

  function renderTable(doc, parent, result) {
    var wrap = element(doc, "div", { className: "ri-ledger" });
    var table = element(doc, "table", { "aria-label": "有限分割上下和账本" });
    table.appendChild(element(doc, "caption", { text: "有限分割诊断；所有数值都对应当前 n 与 tag 规则" }));
    var head = element(doc, "tr");
    ["样本", "下和 L", "上和 U", "tagged R", "U−L", "定理级状态"].forEach(function (label) {
      head.appendChild(element(doc, "th", { scope: "col", text: label }));
    });
    table.appendChild(element(doc, "thead", {}, [head]));
    var body = element(doc, "tbody");
    Object.keys(MODELS).forEach(function (modelId) {
      var row = diagnostic({ modelId: modelId, n: result.n, tagMode: result.tagMode });
      var values = [
        MODELS[modelId].label,
        formatNumber(row.lower, 6),
        formatNumber(row.upper, 6),
        formatNumber(row.tagged, 6),
        formatNumber(row.gap, 6),
        MODELS[modelId].truth
      ];
      var tr = element(doc, "tr");
      values.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); });
      body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    parent.appendChild(wrap);
  }

  function mount(rootNode, api) {
    if (!rootNode || rootNode.getAttribute("data-ri-mounted") === "true") return;
    rootNode.setAttribute("data-ri-mounted", "true");
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "ri-" + INSTANCE;
    var state = { modelId: PRESETS[0].modelId, n: PRESETS[0].n, tagMode: PRESETS[0].tagMode };
    var activePreset = PRESETS[0].id;
    var answers = [null, null, null];
    var revealed = false;
    var shell = element(doc, "div", { className: "ri-lab" });
    shell.innerHTML = [
      '<p class="ri-note">先完成三项预测，再揭示有限分割账本。金色矩形是有限诊断，蓝色/虚线包络不是无限定理的替身。</p>',
      '<div class="ri-prediction"><h3>预测门：三项都作答后才能揭示</h3>',
      '<fieldset data-question="0"><legend>1. 连续函数的 U−L 随 n 增大怎样？</legend><div class="ri-choices">',
      '<button type="button" data-question="0" data-answer="zero">趋于 0</button><button type="button" data-question="0" data-answer="one">恒为 1</button><button type="button" data-question="0" data-answer="wild">依 tag 任意跳</button>',
      '</div></fieldset>',
      '<fieldset data-question="1"><legend>2. Thomae 型函数的最终命运？</legend><div class="ri-choices">',
      '<button type="button" data-question="1" data-answer="integrable">上下和都趋 0</button><button type="button" data-question="1" data-answer="upper">上和恒为 1</button><button type="button" data-question="1" data-answer="diverge">tagged 和必发散</button>',
      '</div></fieldset>',
      '<fieldset data-question="2"><legend>3. Dirichlet 型全有理/全无理 tag 的结果？</legend><div class="ri-choices">',
      '<button type="button" data-question="2" data-answer="same">相同极限</button><button type="button" data-question="2" data-answer="different">分别为 1 与 0</button><button type="button" data-question="2" data-answer="zero">都为 0</button>',
      '</div></fieldset>',
      '<div class="ri-actions"><button class="ri-primary" type="button" data-action="reveal">核对预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="ri-feedback" role="status" aria-live="polite" aria-atomic="true">请先完成三项预测。</p></div>',
      '<div class="ri-controls" hidden><div class="ri-control-group"><label>样本预设</label><div class="ri-presets" data-presets></div></div>',
      '<div class="ri-control-group"><label for="' + prefix + '-n">均匀分割 n：<output data-output="n">8</output></label><input id="' + prefix + '-n" type="range" min="2" max="64" step="1" value="8" data-input="n">',
      '<label for="' + prefix + '-tag">tag 规则</label><select id="' + prefix + '-tag" data-input="tag" aria-label="tag 取点规则"></select></div></div>',
      '<div class="ri-results" hidden><div data-metrics></div><div class="ri-stage" data-stage></div><div data-table></div><p class="ri-note">有限分割只能作诊断：可积性来自 n→∞ 的夹逼/振幅论证；Dirichlet 型的 U−L=1 与两种 tag 的分歧则在每个有限 n 都已出现。</p></div>'
    ].join("");
    rootNode.replaceChildren(shell);
    var lab = shell;
    var controls = lab.querySelector(".ri-controls");
    var results = lab.querySelector(".ri-results");
    var feedback = lab.querySelector(".ri-feedback");
    var nInput = lab.querySelector('[data-input="n"]');
    var tagInput = lab.querySelector('[data-input="tag"]');
    Object.keys(TAG_MODES).forEach(function (mode) {
      tagInput.appendChild(element(doc, "option", { value: mode, text: TAG_MODES[mode] }));
    });
    var presetRow = lab.querySelector("[data-presets]");
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", text: preset.label, "data-preset": preset.id, "aria-pressed": preset.id === activePreset ? "true" : "false" });
      presetRow.appendChild(button);
    });

    function renderPrediction() {
      lab.querySelectorAll("button[data-question]").forEach(function (button) {
        var question = Number(button.getAttribute("data-question"));
        button.setAttribute("aria-pressed", answers[question] === button.getAttribute("data-answer") ? "true" : "false");
      });
    }

    function render() {
      var result = diagnostic(state);
      var activePresetItem = PRESETS.filter(function (item) { return item.id === activePreset; })[0];
      var activeModelId = activePresetItem ? activePresetItem.modelId : null;
      nInput.value = String(state.n);
      lab.querySelector('[data-output="n"]').textContent = String(state.n);
      tagInput.value = state.tagMode;
      lab.querySelectorAll("button[data-preset]").forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-preset") === activePreset && state.modelId === activeModelId ? "true" : "false");
      });
      controls.hidden = !revealed;
      results.hidden = !revealed;
      renderPrediction();
      if (!revealed) return;
      var metrics = lab.querySelector("[data-metrics]");
      metrics.className = "ri-metrics";
      metrics.innerHTML = [
        ["当前样本", MODELS[result.modelId].label],
        ["mesh ||P||", formatNumber(result.mesh, 5)],
        ["下和 L", formatNumber(result.lower, 6)],
        ["上和 U", formatNumber(result.upper, 6)],
        ["tagged R", formatNumber(result.tagged, 6)],
        ["U−L", formatNumber(result.gap, 6)],
        ["有限 n", String(result.n)],
        ["结论", MODELS[result.modelId].truth]
      ].map(function (item) {
        return '<div class="ri-metric"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>';
      }).join("");
      var stage = lab.querySelector("[data-stage]");
      stage.replaceChildren(plotSvg(doc, result, prefix));
      var table = lab.querySelector("[data-table]");
      table.replaceChildren();
      renderTable(doc, table, result);
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
        state = { modelId: preset.modelId, n: preset.n, tagMode: preset.tagMode };
        render();
        return;
      }
      var action = event.target.closest("button[data-action]");
      if (!action) return;
      if (action.getAttribute("data-action") === "reset") {
        answers = [null, null, null];
        revealed = false;
        activePreset = PRESETS[0].id;
        state = { modelId: PRESETS[0].modelId, n: PRESETS[0].n, tagMode: PRESETS[0].tagMode };
        feedback.className = "ri-feedback";
        feedback.textContent = "请先完成三项预测。";
        render();
        return;
      }
      if (answers.some(function (answer) { return answer === null; })) {
        feedback.className = "ri-feedback ri-warn";
        feedback.textContent = "还差 " + answers.filter(function (answer) { return answer === null; }).length + " 项预测。";
        announce(api, rootNode, feedback.textContent);
        return;
      }
      var expected = ["zero", "integrable", "different"];
      var score = answers.reduce(function (sum, answer, index) { return sum + (answer === expected[index] ? 1 : 0); }, 0);
      revealed = true;
      feedback.className = "ri-feedback " + (score === 3 ? "ri-pass" : "ri-warn");
      feedback.textContent = "预测命中 " + score + "/3；现在把有限证据与极限定理分栏读取。";
      render();
      announce(api, rootNode, feedback.textContent);
    });
    nInput.addEventListener("input", function () {
      state.n = integer(nInput.value, state.n, LIMITS.n[0], LIMITS.n[1]);
      activePreset = "custom";
      render();
    });
    tagInput.addEventListener("change", function () {
      state.tagMode = TAG_MODES[tagInput.value] ? tagInput.value : "midpoint";
      activePreset = "custom";
      render();
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var continuous = diagnostic({ modelId: "continuous", n: 8, tagMode: "midpoint" });
    check(near(continuous.gap, 1 / 8, 1e-12), "continuous U-L");
    check(continuous.lower < 1 / 3 && continuous.upper > 1 / 3, "continuous squeeze");
    check(continuous.tags.every(function (tag) { return tag.x > 0 && tag.x < 1; }), "tags lie in cells");
    var step = diagnostic({ modelId: "step", n: 8, tagMode: "midpoint" });
    check(near(step.lower, 1.5, 1e-12) && near(step.upper, 1.625, 1e-12) && near(step.gap, 0.125, 1e-12), "step boundary alignment");
    var thomae8 = diagnostic({ modelId: "thomae", n: 8, tagMode: "midpoint" });
    var thomae16 = diagnostic({ modelId: "thomae", n: 16, tagMode: "midpoint" });
    var thomae11 = diagnostic({ modelId: "thomae", n: 11, tagMode: "midpoint" });
    var thomae12 = diagnostic({ modelId: "thomae", n: 12, tagMode: "midpoint" });
    check(thomae8.lower === 0 && thomae16.lower === 0, "Thomae lower sums");
    check(thomae8.upper > 0 && thomae16.upper <= thomae8.upper + 1e-12, "Thomae upper sums refine");
    check(thomae12.upper > thomae11.upper, "non-nested uniform partitions need not decrease monotonically");
    check(diagnostic({ modelId: "thomae", n: 32, tagMode: "irrational" }).tagged === 0, "irrational Thomae tags");
    var dirichletRational = diagnostic({ modelId: "dirichlet", n: 12, tagMode: "midpoint" });
    var dirichletIrrational = diagnostic({ modelId: "dirichlet", n: 12, tagMode: "irrational" });
    check(dirichletRational.lower === 0 && dirichletRational.upper === 1, "Dirichlet Darboux bounds");
    check(near(dirichletRational.tagged, 1, 1e-12) && near(dirichletIrrational.tagged, 0, 1e-12), "Dirichlet tag divergence");
    check(Object.keys(MODELS).length === 4 && PRESETS.length === 4, "teaching examples");
    check(mesh(uniformPartition(16, 0, 1)) === 1 / 16, "uniform mesh");
    return { checks: checks, models: Object.keys(MODELS).length };
  }

  return {
    MODELS: MODELS,
    TAG_MODES: TAG_MODES,
    PRESETS: PRESETS,
    uniformPartition: uniformPartition,
    mesh: mesh,
    thomaeSupremum: thomaeSupremum,
    valueAt: valueAt,
    upperLowerSums: upperLowerSums,
    taggedRiemannSum: taggedRiemannSum,
    diagnostic: diagnostic,
    mount: mount,
    selfTest: selfTest
  };
});
