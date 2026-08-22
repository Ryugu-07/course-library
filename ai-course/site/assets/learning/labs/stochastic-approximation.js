(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("stochastic-approximation", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("stochastic-approximation self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("stochastic-approximation self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-stochastic-approximation-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var DEFAULT = { alphaKind: "harmonic", replayMode: "full", steps: 48, gamma: 0.8, theta0: 0, thetaStar: 2 };
  var ALPHA_PRESETS = [
    { id: "harmonic", label: "逐访问 1/(n+1)", short: "1/n" },
    { id: "root", label: "逐访问 1/√(n+1)", short: "1/√n" },
    { id: "constant", label: "常数 0.15", short: "常数" }
  ];
  var REPLAY_PRESETS = [
    { id: "full", label: "完整覆盖：4 个 (s,a)" },
    { id: "sparse", label: "稀疏覆盖：漏掉两项" }
  ];
  var NOISE_REPLAY = [0.8, -0.6, 0.4, -0.2, -0.8, 0.6, -0.4, 0.2];
  var FULL_REPLAY = [
    { state: 0, action: 0, reward: 1, nextState: 1, terminal: false },
    { state: 0, action: 1, reward: 0, nextState: 1, terminal: false },
    { state: 1, action: 0, reward: 2, nextState: 1, terminal: false },
    { state: 1, action: 1, reward: -1, nextState: 1, terminal: false }
  ];
  var SPARSE_REPLAY = [FULL_REPLAY[0], FULL_REPLAY[2]];

  var STYLE_TEXT = [
    ".sa-lab{--sa-blue:var(--cl-blue,#315f9d);--sa-gold:var(--cl-gold,#9b6a12);--sa-green:var(--cl-green,#39734d);--sa-red:var(--cl-red,#b64335);--sa-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".sa-lab *,.sa-lab *::before,.sa-lab *::after{box-sizing:border-box;}.sa-lab [hidden]{display:none!important;}.sa-lab h3,.sa-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.sa-lab h3{font-size:1.18rem;}.sa-lab h4{font-size:1rem;}.sa-lab .sa-note,.sa-lab .sa-feedback{color:var(--sa-soft);font-size:13px;line-height:1.7;}.sa-lab .sa-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--sa-gold);background:var(--bg);}.sa-lab fieldset{min-width:0;margin:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.sa-lab legend{max-width:100%;padding:0 4px;color:var(--sa-soft);font-size:13px;line-height:1.5;}.sa-lab .sa-question-list{display:grid;gap:10px;}.sa-lab .sa-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".sa-lab button,.sa-lab input{font:inherit;}.sa-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.sa-lab button:hover{border-color:var(--accent);}.sa-lab button[aria-pressed=\"true\"],.sa-lab button.sa-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.sa-lab button:disabled{cursor:not-allowed;opacity:.55;}.sa-lab button:focus-visible,.sa-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.sa-lab .sa-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.sa-lab .sa-actions>*{flex:1 1 170px;}.sa-lab .sa-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.sa-lab .sa-pass{color:var(--sa-green);}.sa-lab .sa-warn{color:var(--sa-red);}",
    ".sa-lab .sa-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.sa-lab .sa-preset-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0 12px;}.sa-lab .sa-replay-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0 12px;}.sa-lab .sa-preset-grid button,.sa-lab .sa-replay-grid button{font-size:12px;}.sa-lab .sa-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;align-items:end;}.sa-lab .sa-control{display:grid;gap:5px;min-width:0;}.sa-lab .sa-control label{color:var(--sa-soft);font-size:13px;font-weight:700;}.sa-lab .sa-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.sa-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".sa-lab .sa-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:13px 0;}.sa-lab .sa-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.sa-lab .sa-metric:nth-child(3n+1){border-top-color:var(--sa-blue);}.sa-lab .sa-metric:nth-child(3n+2){border-top-color:var(--sa-gold);}.sa-lab .sa-metric:nth-child(3n){border-top-color:var(--sa-green);}.sa-lab .sa-metric span{display:block;color:var(--sa-soft);font-size:11.5px;line-height:1.4;}.sa-lab .sa-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums;}",
    ".sa-lab .sa-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch;}.sa-lab .sa-svg{display:block;width:100%;min-width:720px;height:auto;color:var(--fg);}.sa-lab .sa-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.sa-lab .sa-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}.sa-lab .sa-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.sa-lab .sa-rm{fill:none;stroke:var(--sa-blue);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}.sa-lab .sa-target{stroke:var(--sa-gold);stroke-width:1.6;stroke-dasharray:5 4;}.sa-lab .sa-error{fill:var(--sa-red);fill-opacity:.76;}.sa-lab .sa-cover{fill:var(--sa-green);fill-opacity:.72;}.sa-lab .sa-title{font-size:13px;font-weight:750;}.sa-lab .sa-label{font-size:11px;}",
    ".sa-lab .sa-table-wrap{max-width:100%;margin-top:13px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.sa-lab table{width:100%;min-width:850px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.sa-lab caption{padding:0 0 7px;text-align:left;color:var(--sa-soft);font-size:12px;}.sa-lab th,.sa-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.sa-lab th{color:var(--sa-soft);font-size:11.5px;font-weight:750;}.sa-lab .sa-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--sa-green);background:var(--bg);font-size:13px;line-height:1.7;}",
    "@media(max-width:980px){.sa-lab .sa-metrics{grid-template-columns:repeat(3,minmax(0,1fr));}.sa-lab .sa-controls{grid-template-columns:repeat(2,minmax(0,1fr));}}@media(max-width:680px){.sa-lab .sa-choice-grid,.sa-lab .sa-preset-grid,.sa-lab .sa-replay-grid,.sa-lab .sa-controls,.sa-lab .sa-metrics{grid-template-columns:minmax(0,1fr);}.sa-lab .sa-frame{padding:5px;}}@media(prefers-reduced-motion:reduce){.sa-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function alphaValue(kind, visitIndex) {
    if (kind === "root") return 1 / Math.sqrt(visitIndex + 1);
    if (kind === "constant") return 0.15;
    return 1 / (visitIndex + 1);
  }

  function scheduleTheory(kind) {
    if (kind === "harmonic") {
      return { sum: "发散", squareSum: "收敛", theorem: "满足经典 RM 两条步长条件" };
    }
    if (kind === "root") {
      return { sum: "发散", squareSum: "发散", theorem: "平方不可和；不能直接套经典噪声结论" };
    }
    return { sum: "发散", squareSum: "发散", theorem: "常数步长用于跟踪/邻域震荡，不给精确 a.s. 收敛" };
  }

  function stepSums(kind, visits) {
    var count = Math.max(0, Math.floor(Number(visits) || 0));
    var sum = 0;
    var squareSum = 0;
    var index;
    for (index = 0; index < count; index += 1) {
      var alpha = alphaValue(kind, index);
      sum += alpha;
      squareSum += alpha * alpha;
    }
    return {
      kind: kind,
      visits: count,
      sum: sum,
      squareSum: squareSum,
      theory: scheduleTheory(kind)
    };
  }

  function cloneTable(table) {
    return table.map(function (row) { return row.slice(); });
  }

  function zeroTable() {
    return [[0, 0], [0, 0]];
  }

  function maxRow(row) {
    return Math.max(row[0], row[1]);
  }

  function qUpdate(table, transition, alpha, gamma) {
    var next = cloneTable(table);
    var oldValue = table[transition.state][transition.action];
    var future = transition.terminal ? 0 : maxRow(table[transition.nextState]);
    var target = transition.reward + gamma * future;
    var newValue = oldValue + alpha * (target - oldValue);
    next[transition.state][transition.action] = newValue;
    return {
      table: next,
      oldValue: oldValue,
      target: target,
      newValue: newValue,
      temporalDifference: target - oldValue
    };
  }

  function bellmanQ(table, gamma) {
    return FULL_REPLAY.map(function (transition) {
      var future = transition.terminal ? 0 : maxRow(table[transition.nextState]);
      return transition.reward + gamma * future;
    }).reduce(function (result, value, index) {
      var transition = FULL_REPLAY[index];
      result[transition.state][transition.action] = value;
      return result;
    }, zeroTable());
  }

  function fixedPointQ(gamma, iterations) {
    var table = zeroTable();
    var count = Math.max(1, Math.floor(Number(iterations) || 80));
    var index;
    for (index = 0; index < count; index += 1) table = bellmanQ(table, gamma);
    return table;
  }

  function tableError(left, right) {
    var error = 0;
    left.forEach(function (row, state) {
      row.forEach(function (value, action) {
        error = Math.max(error, Math.abs(value - right[state][action]));
      });
    });
    return error;
  }

  function rmTrace(options) {
    var settings = options || {};
    var kind = settings.alphaKind || DEFAULT.alphaKind;
    var steps = Math.max(1, Math.floor(Number(settings.steps) || DEFAULT.steps));
    var theta = finite(Number(settings.theta0)) ? Number(settings.theta0) : DEFAULT.theta0;
    var thetaStar = finite(Number(settings.thetaStar)) ? Number(settings.thetaStar) : DEFAULT.thetaStar;
    var noiseScale = finite(Number(settings.noiseScale)) ? Number(settings.noiseScale) : 1;
    var rows = [{ iteration: 0, theta: theta, alpha: null, noise: null, drift: thetaStar - theta }];
    var index;
    for (index = 0; index < steps; index += 1) {
      var alpha = alphaValue(kind, index);
      var noise = NOISE_REPLAY[index % NOISE_REPLAY.length] * noiseScale;
      var drift = thetaStar - theta;
      theta += alpha * (drift + noise);
      rows.push({ iteration: index + 1, theta: theta, alpha: alpha, noise: noise, drift: drift });
    }
    return {
      kind: kind,
      thetaStar: thetaStar,
      rows: rows,
      finalTheta: theta,
      replay: NOISE_REPLAY.slice(),
      evidenceLabel: "固定有限回放：数值证据，不是鞅收敛证明"
    };
  }

  function visitMatrix() {
    return [[0, 0], [0, 0]];
  }

  function qTrace(options) {
    var settings = options || {};
    var kind = settings.alphaKind || DEFAULT.alphaKind;
    var mode = settings.replayMode || DEFAULT.replayMode;
    var steps = Math.max(1, Math.floor(Number(settings.steps) || DEFAULT.steps));
    var gamma = clamp(Number(settings.gamma), 0, 0.99);
    if (!finite(gamma)) gamma = DEFAULT.gamma;
    var replay = mode === "sparse" ? SPARSE_REPLAY : FULL_REPLAY;
    var table = zeroTable();
    var visits = visitMatrix();
    var rows = [];
    var index;
    for (index = 0; index < steps; index += 1) {
      var transition = replay[index % replay.length];
      var visit = visits[transition.state][transition.action];
      var alpha = alphaValue(kind, visit);
      visits[transition.state][transition.action] += 1;
      var update = qUpdate(table, transition, alpha, gamma);
      table = update.table;
      rows.push({
        iteration: index + 1,
        state: transition.state,
        action: transition.action,
        visit: visit + 1,
        alpha: alpha,
        reward: transition.reward,
        target: update.target,
        oldValue: update.oldValue,
        newValue: update.newValue,
        td: update.temporalDifference
      });
    }
    var reference = fixedPointQ(gamma, 120);
    return {
      kind: kind,
      replayMode: mode,
      gamma: gamma,
      rows: rows,
      finalTable: table,
      referenceTable: reference,
      errorToReference: tableError(table, reference),
      visits: visits,
      covered: visits.every(function (row) { return row.every(function (count) { return count > 0; }); }),
      evidenceLabel: "固定有限回放：逐项更新证据，不是 Q-learning a.s. 定理"
    };
  }

  function normalizeConfig(input) {
    var source = input || {};
    var alphaKind = ["harmonic", "root", "constant"].indexOf(source.alphaKind) >= 0 ? source.alphaKind : DEFAULT.alphaKind;
    var replayMode = ["full", "sparse"].indexOf(source.replayMode) >= 0 ? source.replayMode : DEFAULT.replayMode;
    var steps = Math.floor(Number(source.steps));
    var gamma = Number(source.gamma);
    if (!finite(steps)) steps = DEFAULT.steps;
    if (!finite(gamma)) gamma = DEFAULT.gamma;
    return {
      alphaKind: alphaKind,
      replayMode: replayMode,
      steps: clamp(steps, 8, 96),
      gamma: clamp(gamma, 0, 0.99),
      theta0: DEFAULT.theta0,
      thetaStar: DEFAULT.thetaStar
    };
  }

  function compute(input) {
    var config = normalizeConfig(input);
    var rm = rmTrace(config);
    var q = qTrace(config);
    var sums = stepSums(config.alphaKind, Math.max(1, Math.floor(config.steps / 4)));
    return {
      config: config,
      rm: rm,
      q: q,
      sums: sums,
      theoremEligible: config.alphaKind === "harmonic" && config.replayMode === "full" && config.gamma < 1,
      theoremConditions: scheduleTheory(config.alphaKind)
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.0005) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function appendChildren(node, children) {
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
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
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children || []);
  }

  function svgElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children || []);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "sa-metric" }, [
      element(doc, "span", {}, [label]),
      element(doc, "strong", {}, [value])
    ]);
  }

  function tableElement(doc, captionText, headers, rows) {
    var head = element(doc, "tr", {}, headers.map(function (header) {
      return element(doc, "th", { scope: "col" }, [header]);
    }));
    var body = element(doc, "tbody", {}, rows.map(function (row) {
      return element(doc, "tr", {}, row.map(function (cell, index) {
        return element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, [cell]);
      }));
    }));
    return element(doc, "table", {}, [element(doc, "caption", {}, [captionText]), element(doc, "thead", {}, [head]), body]);
  }

  function svgText(doc, x, y, text, attrs) {
    var merged = { x: x, y: y, className: "sa-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return svgElement(doc, "text", merged, [text]);
  }

  function linePath(points, x, y) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + x(point) + " " + y(point);
    }).join(" ");
  }

  function drawSvg(doc, result, uid) {
    var svg = svgElement(doc, "svg", {
      className: "sa-svg",
      viewBox: "0 0 820 380",
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc"
    }, []);
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, ["随机逼近与 Q-learning 有限回放账本"]));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" }, ["左图显示固定噪声下的 Robbins-Monro 轨迹，右图显示 Q 表误差与访问覆盖。"]));
    var top = 42;
    var bottom = 292;
    var left = 54;
    var split = 398;
    var right = 780;
    var rmRows = result.rm.rows;
    var values = rmRows.map(function (row) { return row.theta; }).concat([result.rm.thetaStar]);
    var minValue = Math.min.apply(null, values) - 0.2;
    var maxValue = Math.max.apply(null, values) + 0.2;
    if (near(minValue, maxValue)) maxValue = minValue + 1;
    function xRm(row) { return left + row.iteration / Math.max(1, rmRows.length - 1) * (split - left - 20); }
    function yRm(value) { return bottom - (value - minValue) / (maxValue - minValue) * (bottom - top); }
    [minValue, (minValue + maxValue) / 2, maxValue].forEach(function (value) {
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: yRm(value), x2: split - 20, y2: yRm(value), className: "sa-grid" }));
      svg.appendChild(svgText(doc, left - 8, yRm(value) + 4, format(value, 2), { "text-anchor": "end" }));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: split - 20, y2: bottom, className: "sa-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, className: "sa-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: linePath(rmRows, xRm, function (row) { return yRm(row.theta); }), className: "sa-rm" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: yRm(result.rm.thetaStar), x2: split - 20, y2: yRm(result.rm.thetaStar), className: "sa-target" }));
    svg.appendChild(svgText(doc, (left + split) / 2, 22, "RM 固定回放：轨迹证据", { className: "sa-title", "text-anchor": "middle" }));
    svg.appendChild(svgText(doc, split - 28, yRm(result.rm.thetaStar) - 7, "θ*=2", { "text-anchor": "end" }));
    var barLeft = 470;
    var barRight = right - 24;
    var barBottom = bottom;
    var barTop = 100;
    var errors = result.q.finalTable.reduce(function (list, row, state) {
      row.forEach(function (value, action) { list.push({ label: "Q" + state + action, value: Math.abs(value - result.q.referenceTable[state][action]) }); });
      return list;
    }, []);
    var maxError = Math.max(0.1, Math.max.apply(null, errors.map(function (item) { return item.value; })) * 1.2);
    var barWidth = (barRight - barLeft) / errors.length * 0.58;
    errors.forEach(function (item, index) {
      var center = barLeft + (index + 0.5) / errors.length * (barRight - barLeft);
      var height = item.value / maxError * (barBottom - barTop);
      svg.appendChild(svgElement(doc, "rect", { x: center - barWidth / 2, y: barBottom - height, width: barWidth, height: Math.max(1, height), className: "sa-error" }));
      svg.appendChild(svgText(doc, center, barBottom + 18, item.label, { "text-anchor": "middle" }));
      svg.appendChild(svgText(doc, center, barBottom - height - 6, format(item.value, 3), { "text-anchor": "middle" }));
    });
    var coverage = result.q.visits.reduce(function (sum, row) { return sum + row.reduce(function (rowSum, count) { return rowSum + count; }, 0); }, 0);
    var coverageWidth = Math.min(230, Math.max(12, coverage / Math.max(1, result.config.steps) * 230));
    svg.appendChild(svgElement(doc, "rect", { x: barLeft, y: 58, width: 230, height: 16, className: "sa-grid" }));
    svg.appendChild(svgElement(doc, "rect", { x: barLeft, y: 58, width: coverageWidth, height: 16, className: "sa-cover" }));
    svg.appendChild(svgText(doc, barLeft, 48, "Q 表有限误差与总访问次数 " + coverage, { className: "sa-title" }));
    svg.appendChild(svgText(doc, (barLeft + barRight) / 2, 22, "表格对照：有限误差 / 覆盖", { className: "sa-title", "text-anchor": "middle" }));
    return svg;
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
    var status = root.querySelector("[data-sa-status]");
    if (status) status.textContent = message;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "sa-" + (++INSTANCE);
    var state = { alphaKind: DEFAULT.alphaKind, replayMode: DEFAULT.replayMode, steps: DEFAULT.steps, gamma: DEFAULT.gamma };
    var prediction = { sums: null, trajectory: null, offpolicy: null };
    var revealed = false;
    var score = 0;
    var shell = element(doc, "div", { className: "sa-lab" }, []);
    clear(root);
    root.appendChild(shell);

    function addPrediction(list, key, legendText, options) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", {}, [legendText])]);
      var grid = element(doc, "div", { className: "sa-choice-grid" }, []);
      options.forEach(function (option) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": prediction[key] === option.value ? "true" : "false",
          disabled: revealed
        }, [option.label]);
        button.addEventListener("click", function () {
          if (!revealed) {
            prediction[key] = option.value;
            renderGate();
          }
        });
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      list.appendChild(fieldset);
    }

    function complete() {
      return prediction.sums !== null && prediction.trajectory !== null && prediction.offpolicy !== null;
    }

    function renderGate() {
      clear(shell);
      shell.appendChild(element(doc, "h3", {}, ["随机逼近审计：级数、访问与噪声"]));
      shell.appendChild(element(doc, "p", { className: "sa-note" }, [revealed ? "预测已提交；可以切换步长、回放覆盖和折现因子，重新核对有限账本。" : "先判断两条级数、有限轨迹的证据等级和 off-policy 的真正边界。"]));
      shell.appendChild(element(doc, "div", { className: "sa-prompt" }, [revealed ? "回放序列固定且有限；下面的参考 Q 表只用于当前 toy 对照，不把一条轨迹提升为 a.s. 收敛证明。" : "预测门：步长平方和、有限样本证据、逐状态动作覆盖分别判断。"]));
      var questions = element(doc, "div", { className: "sa-question-list" }, []);
      addPrediction(questions, "sums", "1 · 哪个步长同时满足两条经典级数条件？", [
        { value: "harmonic", label: "1/(t+1)" },
        { value: "root", label: "1/√(t+1)" },
        { value: "constant", label: "常数步长" }
      ]);
      addPrediction(questions, "trajectory", "2 · 固定有限轨迹接近目标能否证明 a.s. 收敛？", [
        { value: "proof", label: "可以证明" },
        { value: "evidence", label: "只是有限证据" },
        { value: "noise", label: "说明无噪声" }
      ]);
      addPrediction(questions, "offpolicy", "3 · off-policy 表格 Q-learning 仍需要什么？", [
        { value: "none", label: "不需访问条件" },
        { value: "coverage", label: "每个(s,a)无穷访问" },
        { value: "function", label: "函数逼近自动稳定" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "sa-actions" }, []);
      var reveal = element(doc, "button", { type: "button", className: "sa-primary", disabled: revealed || !complete() }, [revealed ? "账本已揭示" : "提交预测并揭示"]);
      reveal.addEventListener("click", function () {
        if (!complete()) return;
        score = (prediction.sums === "harmonic" ? 1 : 0) + (prediction.trajectory === "evidence" ? 1 : 0) + (prediction.offpolicy === "coverage" ? 1 : 0);
        revealed = true;
        renderGate();
        announce(api, root, "预测已提交；随机逼近与 Q-learning 账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(reveal);
      actions.appendChild(reset);
      shell.appendChild(actions);
      shell.appendChild(element(doc, "p", { className: "sa-feedback " + (revealed ? (score === 3 ? "sa-pass" : "sa-warn") : ""), "aria-live": "polite", "data-sa-status": true }, [
        !complete() ? "请为三个判断各选一项。" : revealed ? "预测得分 " + score + "/3；下面显示 RM、Q 表和访问账本。" : "三项预测已记录，点击提交后才显示结果。"
      ]));
      if (revealed) buildResults();
    }

    function buildResults() {
      var panel = element(doc, "section", { className: "sa-revealed" }, [
        element(doc, "h4", {}, ["结果与透明账本"]),
        element(doc, "p", { className: "sa-note" }, ["Q-learning 的 alpha 按每个 (s,a) 自己的访问次数计算；完整覆盖和稀疏覆盖会因此给出不同的逐项步长。"])
      ]);
      var alphaGrid = element(doc, "div", { className: "sa-preset-grid" }, []);
      ALPHA_PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", "aria-pressed": state.alphaKind === preset.id ? "true" : "false" }, [preset.label]);
        button.addEventListener("click", function () { state.alphaKind = preset.id; renderGate(); });
        alphaGrid.appendChild(button);
      });
      panel.appendChild(element(doc, "p", { className: "sa-note" }, ["步长方案"]));
      panel.appendChild(alphaGrid);
      var replayGrid = element(doc, "div", { className: "sa-replay-grid" }, []);
      REPLAY_PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", "aria-pressed": state.replayMode === preset.id ? "true" : "false" }, [preset.label]);
        button.addEventListener("click", function () { state.replayMode = preset.id; renderGate(); });
        replayGrid.appendChild(button);
      });
      panel.appendChild(element(doc, "p", { className: "sa-note" }, ["行为数据回放"]));
      panel.appendChild(replayGrid);
      var controls = element(doc, "div", { className: "sa-controls" }, []);
      var stepsId = uid + "-steps";
      var stepsOutput = element(doc, "output", { for: stepsId }, [String(state.steps)]);
      var stepsInput = element(doc, "input", { id: stepsId, type: "range", min: "8", max: "96", step: "1", value: String(state.steps), "aria-label": "回放步数" });
      stepsInput.addEventListener("input", function () { state.steps = Number(stepsInput.value); stepsOutput.textContent = String(state.steps); renderResults(); });
      controls.appendChild(element(doc, "div", { className: "sa-control" }, [element(doc, "label", { htmlFor: stepsId }, ["回放步数 = ", stepsOutput]), stepsInput]));
      var gammaId = uid + "-gamma";
      var gammaOutput = element(doc, "output", { for: gammaId }, [format(state.gamma, 2)]);
      var gammaInput = element(doc, "input", { id: gammaId, type: "range", min: "0", max: "0.99", step: "0.01", value: String(state.gamma), "aria-label": "折现因子" });
      gammaInput.addEventListener("input", function () { state.gamma = Number(gammaInput.value); gammaOutput.textContent = format(state.gamma, 2); renderResults(); });
      controls.appendChild(element(doc, "div", { className: "sa-control" }, [element(doc, "label", { htmlFor: gammaId }, ["γ = ", gammaOutput]), gammaInput]));
      controls.appendChild(element(doc, "p", { className: "sa-note" }, ["固定噪声回放，不使用运行时随机数。"]));
      panel.appendChild(controls);
      var stage = element(doc, "div", { className: "sa-stage" }, []);
      panel.appendChild(stage);
      shell.appendChild(panel);

      function renderResults() {
        var result = compute(state);
        clear(stage);
        var totalVisits = result.q.visits.reduce(function (total, row) { return total + row[0] + row[1]; }, 0);
        stage.appendChild(element(doc, "div", { className: "sa-metrics" }, [
          metric(doc, "RM 最终 θ", format(result.rm.finalTheta, 4)),
          metric(doc, "部分和 Σα", format(result.sums.sum, 4)),
          metric(doc, "部分和 Σα²", format(result.sums.squareSum, 4)),
          metric(doc, "Q 表最大误差", format(result.q.errorToReference, 4)),
          metric(doc, "访问总数", String(totalVisits)),
          metric(doc, "四项全覆盖", result.q.covered ? "是" : "否")
        ]));
        var frame = element(doc, "div", { className: "sa-frame" }, []);
        frame.appendChild(drawSvg(doc, result, uid));
        frame.appendChild(element(doc, "p", { className: "sa-note" }, [
          result.theoremEligible
            ? "当前设置接近表格定理的步长/覆盖前提，但这里仍只显示有限回放的数值证据；a.s. 结论需要随机过程假设。"
            : "当前设置至少缺少一个经典前提（平方可和步长、完整覆盖或 γ<1）；有限曲线不能补上缺失的定理条件。"
        ]));
        stage.appendChild(frame);
        var traceRows = result.q.rows.filter(function (row, index) { var stride = Math.max(1, Math.ceil(result.q.rows.length / 12)); return index % stride === 0 || index === result.q.rows.length - 1; }).map(function (row) {
          return [row.iteration, "(" + row.state + "," + row.action + ")", row.visit, format(row.alpha, 4), format(row.target, 4), format(row.newValue, 4), format(row.td, 4)];
        });
        stage.appendChild(element(doc, "div", { className: "sa-table-wrap" }, [tableElement(doc, "Q-learning 逐状态动作更新（固定回放）", ["t", "(s,a)", "该项访问 n", "α_n", "target", "新 Q", "TD"], traceRows)]));
        var visitRows = result.q.visits.map(function (row, stateIndex) {
          return ["状态 " + stateIndex, row[0], row[1], row[0] > 0 && row[1] > 0 ? "当前有限回放全覆盖" : "缺少至少一项；不能宣称全覆盖"];
        });
        stage.appendChild(element(doc, "div", { className: "sa-table-wrap" }, [tableElement(doc, "访问与步长前提账", ["分量", "动作 0 访问", "动作 1 访问", "解释"], visitRows)]));
        stage.appendChild(element(doc, "p", { className: "sa-interpretation", "aria-live": "polite" }, [
          result.q.covered
            ? "完整回放只证明本次四个分量都被有限次触碰；定理要求每个 (s,a) 无穷访问，并且每个分量自己的 α 序列满足级数条件。off-policy 不会删除这条要求；函数逼近、bootstrapping 和分布偏移还可能破坏表格压缩性。"
            : "稀疏回放明确展示访问缺口：漏掉的 Q 分量没有被学习。即便已访问分量的有限误差下降，也不能把它升级成全表 Q* 收敛结论。"
        ]));
      }
      renderResults();
    }

    function resetToGate() {
      state = { alphaKind: DEFAULT.alphaKind, replayMode: DEFAULT.replayMode, steps: DEFAULT.steps, gamma: DEFAULT.gamma };
      prediction = { sums: null, trajectory: null, offpolicy: null };
      revealed = false;
      score = 0;
      renderGate();
      announce(api, root, "随机逼近实验已重置；请重新完成三个预测。");
    }

    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    assert(near(alphaValue("harmonic", 0), 1), "harmonic first step");
    assert(near(alphaValue("root", 3), 0.5), "root step");
    assert(near(alphaValue("constant", 10), 0.15), "constant step");
    var harmonic = stepSums("harmonic", 10000);
    var root = stepSums("root", 10000);
    assert(harmonic.sum > 8, "harmonic partial sum grows");
    assert(harmonic.squareSum < 2, "harmonic square partial sum bounded in audit");
    assert(root.squareSum > 8, "root square partial sum grows");
    assert(scheduleTheory("harmonic").squareSum === "收敛", "harmonic theory label");
    assert(scheduleTheory("root").squareSum === "发散", "root theory label");
    var rmA = rmTrace({ alphaKind: "harmonic", steps: 24 });
    var rmB = rmTrace({ alphaKind: "harmonic", steps: 24 });
    assert(JSON.stringify(rmA) === JSON.stringify(rmB), "fixed RM replay deterministic");
    assert(rmA.rows.length === 25, "RM trace rows");
    assert(finite(rmA.finalTheta), "RM finite final value");
    var update = qUpdate([[0, 0], [0, 0]], FULL_REPLAY[0], 0.5, 0.8);
    assert(near(update.target, 1), "Q immediate target");
    assert(near(update.newValue, 0.5), "Q update equation");
    var full = qTrace({ alphaKind: "harmonic", replayMode: "full", steps: 16, gamma: 0.8 });
    assert(full.covered, "full replay covers every state-action");
    assert(full.visits[0][0] === 4 && full.visits[1][1] === 4, "per state-action visit counts");
    assert(full.rows[4].visit === 2 && near(full.rows[4].alpha, 0.5), "per component step schedule");
    var sparse = qTrace({ alphaKind: "harmonic", replayMode: "sparse", steps: 16, gamma: 0.8 });
    assert(!sparse.covered, "sparse replay has coverage gap");
    assert(sparse.visits[0][1] === 0 && sparse.visits[1][1] === 0, "sparse missing components");
    assert(finite(full.errorToReference), "finite Q reference error");
    var computed = compute({ alphaKind: "constant", replayMode: "full", steps: 10, gamma: 0.8 });
    assert(computed.config.steps === 10, "config step clamp");
    assert(computed.theoremEligible === false, "constant step not theorem eligible");
    assert(compute({ alphaKind: "harmonic", replayMode: "full", steps: 10, gamma: 0.8 }).theoremEligible, "eligible assumptions label");
    assert(computed.q.rows.length === 10, "Q trace row count");
    return { checks: checks, alphaPresets: ALPHA_PRESETS.length, replayPresets: REPLAY_PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    ALPHA_PRESETS: ALPHA_PRESETS,
    REPLAY_PRESETS: REPLAY_PRESETS,
    NOISE_REPLAY: NOISE_REPLAY,
    FULL_REPLAY: FULL_REPLAY,
    SPARSE_REPLAY: SPARSE_REPLAY,
    alphaValue: alphaValue,
    scheduleTheory: scheduleTheory,
    stepSums: stepSums,
    rmTrace: rmTrace,
    qUpdate: qUpdate,
    bellmanQ: bellmanQ,
    fixedPointQ: fixedPointQ,
    qTrace: qTrace,
    normalizeConfig: normalizeConfig,
    compute: compute,
    mount: mount,
    selfTest: selfTest
  };
});
