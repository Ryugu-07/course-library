(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("online-regret", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("online-regret self-test: PASS (" + report.checks + " checks)" + String.fromCharCode(10));
    } catch (error) {
      process.stderr.write("online-regret self-test: FAIL" + String.fromCharCode(10) + error.stack + String.fromCharCode(10));
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var STYLE_ID = "cl-online-regret-styles";
  var SERIAL = 0;
  var DEFAULT_STABILITY = { m: 48, lambda: 0.5, L: 1, positiveProbability: 0.5, neighborIndex: 0 };
  var DEFAULT_HEDGE = { sequenceId: "ambush", eta: 0.55 };
  var SEQUENCES = [
    {
      id: "ambush",
      label: "ambush：优势专家中途换位",
      losses: [
        [0.05, 0.45, 0.35],
        [0.08, 0.50, 0.30],
        [0.10, 0.55, 0.25],
        [0.65, 0.10, 0.45],
        [0.70, 0.08, 0.40],
        [0.62, 0.12, 0.35],
        [0.40, 0.35, 0.10],
        [0.35, 0.40, 0.08],
        [0.30, 0.45, 0.06],
        [0.20, 0.40, 0.20],
        [0.15, 0.35, 0.30],
        [0.10, 0.30, 0.40]
      ]
    },
    {
      id: "cycle",
      label: "cycle：循环偏好",
      losses: [
        [0.05, 0.55, 0.45],
        [0.45, 0.05, 0.55],
        [0.55, 0.45, 0.05],
        [0.05, 0.55, 0.45],
        [0.45, 0.05, 0.55],
        [0.55, 0.45, 0.05],
        [0.05, 0.55, 0.45],
        [0.45, 0.05, 0.55],
        [0.55, 0.45, 0.05]
      ]
    },
    {
      id: "steady",
      label: "steady：一个专家始终最好",
      losses: [
        [0.60, 0.20, 0.50],
        [0.55, 0.25, 0.45],
        [0.65, 0.15, 0.40],
        [0.50, 0.30, 0.35],
        [0.62, 0.18, 0.45],
        [0.58, 0.22, 0.30],
        [0.60, 0.20, 0.40],
        [0.55, 0.25, 0.35]
      ]
    }
  ];
  var STYLE_TEXT = [
    ".or-lab{--or-blue:#2f6f9f;--or-green:#39734d;--or-gold:#a36a16;--or-red:#b3483b;--or-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    "html[data-theme=\"dark\"] .or-lab{--or-blue:#82c8ff;--or-green:#7bc48c;--or-gold:#e3b45f;--or-red:#f08d7d;--or-soft:#b8b2a7}",
    ".or-lab *,.or-lab *::before,.or-lab *::after{box-sizing:border-box}.or-lab [hidden]{display:none!important}.or-lab h3,.or-lab h4{margin:0;color:var(--fg);letter-spacing:0}.or-lab h3{font-size:1.18rem}.or-lab h4{font-size:1rem}.or-lab p{margin:.65rem 0}.or-intro,.or-note,.or-feedback,.or-assumption{color:var(--or-soft);font-size:13px;line-height:1.7}.or-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--or-gold);background:var(--bg)}.or-gate fieldset{border:0;min-width:0;margin:12px 0 0;padding:0}.or-gate legend{margin-bottom:7px;font-weight:700;line-height:1.5}.or-choice-row,.or-actions,.or-presets{display:flex;flex-wrap:wrap;gap:7px}.or-actions{margin-top:12px}.or-lab button{font:inherit;line-height:1.3;cursor:pointer;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:7px 10px;min-height:44px}.or-lab button:hover{border-color:var(--or-blue)}.or-lab button[aria-pressed=\"true\"]{border-color:var(--or-blue);background:var(--bg);font-weight:700}.or-lab button:disabled{cursor:default;opacity:.65}.or-primary{border-color:var(--or-blue)!important;background:var(--or-blue)!important;color:#fff!important;font-weight:700}.or-layout{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin:12px 0}.or-panel{min-width:0;border-top:2px solid var(--or-blue);padding-top:9px}.or-panel h4{margin-bottom:7px}.or-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:9px;margin:10px 0}.or-control{min-width:0}.or-control label{display:block;font-size:13px;color:var(--or-soft);margin-bottom:4px}.or-control output{font-weight:700;color:var(--fg)}.or-control input{display:block;width:100%;accent-color:var(--or-blue)}.or-scale{display:flex;justify-content:space-between;color:var(--or-soft);font-size:11px}.or-presets{margin:9px 0}.or-presets button[aria-pressed=\"true\"]{border-color:var(--or-gold);font-weight:700}.or-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:12px 0}.or-metric{border-top:2px solid var(--or-blue);padding:7px 8px;background:var(--bg)}.or-metric span{display:block;color:var(--or-soft);font-size:12px}.or-metric strong{display:block;font-size:1.06rem;color:var(--fg);overflow-wrap:anywhere}.or-frame{border:1px solid var(--border);padding:6px;background:var(--bg);min-width:0}.or-chart{width:100%;height:auto;display:block}.or-chart text{font-family:inherit;fill:var(--fg-soft,#6f6a60);font-size:11px}.or-grid{stroke:var(--border);stroke-width:1;stroke-dasharray:3 4}.or-axis{stroke:var(--border);stroke-width:1}.or-stability{fill:var(--or-gold)}.or-observed{fill:var(--or-blue)}.or-learner{fill:none;stroke:var(--or-blue);stroke-width:2.5}.or-comparator{fill:none;stroke:var(--or-green);stroke-width:2.5}.or-regret{fill:none;stroke:var(--or-red);stroke-width:2}.or-title{fill:var(--fg)!important;font-weight:700}.or-table-wrap{overflow-x:auto;max-width:100%;margin-top:10px}.or-table{border-collapse:collapse;width:100%;min-width:720px;font-size:12px}.or-table caption{text-align:left;color:var(--or-soft);padding:5px 0}.or-table th,.or-table td{border:1px solid var(--border);padding:6px 7px;text-align:right;white-space:nowrap}.or-table th:first-child,.or-table td:first-child{text-align:left}.or-table th{background:var(--block-bg);color:var(--fg)}.or-table td.or-negative{color:var(--or-red)}.or-assumption{border-left:3px solid var(--or-green);padding-left:10px}.or-lab input:focus-visible,.or-lab button:focus-visible{outline:2px solid var(--or-blue);outline-offset:2px}@media(max-width:600px){.or-choice-row,.or-actions{display:grid;grid-template-columns:1fr}.or-choice-row button,.or-actions button{width:100%}.or-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.or-table{font-size:11px}}"
  ].join("");

  function finite(value) {
    return Number.isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function normalizeStability(input) {
    var source = input || {};
    return {
      m: Math.round(clamp(finite(Number(source.m)) ? Number(source.m) : DEFAULT_STABILITY.m, 4, 240)),
      lambda: clamp(finite(Number(source.lambda)) ? Number(source.lambda) : DEFAULT_STABILITY.lambda, 0.05, 3),
      L: clamp(finite(Number(source.L)) ? Number(source.L) : DEFAULT_STABILITY.L, 0.25, 2),
      positiveProbability: clamp(finite(Number(source.positiveProbability)) ? Number(source.positiveProbability) : DEFAULT_STABILITY.positiveProbability, 0, 1),
      neighborIndex: Math.round(clamp(finite(Number(source.neighborIndex)) ? Number(source.neighborIndex) : DEFAULT_STABILITY.neighborIndex, 0, 239))
    };
  }

  function softplus(value) {
    if (value > 30) return value;
    if (value < -30) return Math.exp(value);
    return Math.log1p(Math.exp(value));
  }

  function sigmoid(value) {
    if (value >= 0) {
      var e = Math.exp(-value);
      return 1 / (1 + e);
    }
    var positive = Math.exp(value);
    return positive / (1 + positive);
  }

  function logisticLoss(weight, label, scale) {
    return (scale === undefined ? 1 : scale) * softplus(-label * weight);
  }

  function labelsFor(config) {
    var labels = [];
    var probability = config.positiveProbability;
    var i;
    for (i = 0; i < config.m; i += 1) labels.push(i / config.m < probability ? 1 : -1);
    return labels;
  }

  function replaceOne(labels, index) {
    var result = labels.slice();
    if (result.length) result[index % result.length] = -result[index % result.length];
    return result;
  }

  function solveRerm(labels, lambda, scale) {
    lambda = Math.max(1e-9, Number(lambda));
    scale = scale === undefined ? 1 : Math.max(0, Number(scale));
    var weight = 0;
    var iterations = 0;
    while (iterations < 80) {
      var gradient = lambda * weight;
      var hessian = lambda;
      labels.forEach(function (label) {
        var probability = sigmoid(-label * weight);
        gradient += scale * (-label * probability) / labels.length;
        hessian += scale * probability * (1 - probability) / labels.length;
      });
      var next = clamp(weight - gradient / hessian, -40, 40);
      iterations += 1;
      if (Math.abs(next - weight) < 1e-12) {
        weight = next;
        break;
      }
      weight = next;
    }
    var empiricalRisk = labels.reduce(function (sum, label) { return sum + logisticLoss(weight, label, scale); }, 0) / labels.length;
    return {
      weight: weight,
      empiricalRisk: empiricalRisk,
      objective: empiricalRisk + 0.5 * lambda * weight * weight,
      gradient: lambda * weight + labels.reduce(function (sum, label) { return sum - scale * label * sigmoid(-label * weight); }, 0) / labels.length,
      iterations: iterations
    };
  }

  function stabilityCertificate(input) {
    var config = normalizeStability(input);
    var labels = labelsFor(config);
    var neighbor = replaceOne(labels, config.neighborIndex);
    var fit = solveRerm(labels, config.lambda, config.L);
    var neighborFit = solveRerm(neighbor, config.lambda, config.L);
    var probeLabels = [1, -1];
    var lossDifferences = probeLabels.map(function (label) {
      return Math.abs(logisticLoss(fit.weight, label, config.L) - logisticLoss(neighborFit.weight, label, config.L));
    });
    var populationRisk = config.positiveProbability * logisticLoss(fit.weight, 1, config.L) + (1 - config.positiveProbability) * logisticLoss(fit.weight, -1, config.L);
    var beta = 2 * config.L * config.L / (config.lambda * config.m);
    return {
      config: config,
      labels: labels,
      neighborLabels: neighbor,
      fit: fit,
      neighborFit: neighborFit,
      actualUniformStability: Math.max.apply(null, lossDifferences),
      beta: beta,
      empiricalRisk: fit.empiricalRisk,
      populationRisk: populationRisk,
      realizedGap: populationRisk - fit.empiricalRisk,
      probeLossDifferences: lossDifferences,
      assumptions: [
        "convex loss, L-Lipschitz in the model output",
        "lambda-strongly convex regularized ERM with lambda > 0",
        "iid sample is required for the expected stability generalization statement",
        "beta is a uniform stability certificate, not a realized test-set guarantee"
      ]
    };
  }

  function sequenceById(id) {
    return SEQUENCES.filter(function (sequence) { return sequence.id === id; })[0] || SEQUENCES[0];
  }

  function normalizeHedge(input) {
    var source = input || {};
    var sequence = sequenceById(source.sequenceId || DEFAULT_HEDGE.sequenceId);
    return { sequenceId: sequence.id, eta: clamp(finite(Number(source.eta)) ? Number(source.eta) : DEFAULT_HEDGE.eta, 0.05, 2) };
  }

  function hedge(input) {
    var config = normalizeHedge(input);
    var sequence = sequenceById(config.sequenceId);
    var K = sequence.losses[0].length;
    var weights = [];
    var cumulativeExperts = [];
    var i;
    for (i = 0; i < K; i += 1) {
      weights.push(1);
      cumulativeExperts.push(0);
    }
    var cumulativeLearner = 0;
    var rows = [];
    sequence.losses.forEach(function (losses, index) {
      var totalWeight = weights.reduce(function (sum, weight) { return sum + weight; }, 0);
      var probabilities = weights.map(function (weight) { return weight / totalWeight; });
      var learnerLoss = probabilities.reduce(function (sum, probability, expert) { return sum + probability * losses[expert]; }, 0);
      cumulativeLearner += learnerLoss;
      losses.forEach(function (loss, expert) {
        cumulativeExperts[expert] += loss;
        weights[expert] *= Math.exp(-config.eta * loss);
      });
      rows.push({
        round: index + 1,
        losses: losses.slice(),
        probabilities: probabilities,
        learnerLoss: learnerLoss,
        cumulativeLearner: cumulativeLearner,
        cumulativeExperts: cumulativeExperts.slice(),
        postUpdateWeights: weights.slice()
      });
    });
    var comparatorLoss = Math.min.apply(null, cumulativeExperts);
    var comparator = cumulativeExperts.indexOf(comparatorLoss);
    var regret = cumulativeLearner - comparatorLoss;
    var bound = Math.log(K) / config.eta + config.eta * sequence.losses.length / 8;
    return {
      config: config,
      sequence: sequence,
      K: K,
      T: sequence.losses.length,
      rows: rows,
      cumulativeLearner: cumulativeLearner,
      cumulativeExperts: cumulativeExperts,
      comparator: comparator,
      comparatorLoss: comparatorLoss,
      realizedRegret: regret,
      theoremBound: bound,
      assumptions: [
        "losses are fixed in [0,1] after each prediction",
        "Hedge compares with the best fixed expert in hindsight",
        "the sequence may be adversarial; no iid or distribution assumption is used",
        "the displayed realized regret is this ledger, not a worst-case bound"
      ]
    };
  }

  function format(value, digits) {
    if (!finite(value)) return "-";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function append(node, children) {
    if (children === undefined || children === null) return node;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (child) {
      if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "htmlFor") node.setAttribute("for", value);
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    return append(node, children);
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value !== undefined && value !== null) node.setAttribute(key === "className" ? "class" : key, String(value));
    });
    return append(node, children);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "or-metric" }, [element(doc, "span", {}, label), element(doc, "strong", {}, value)]);
  }

  function drawChart(doc, svg, stability, online, uid) {
    clear(svg);
    var width = 780;
    var height = 390;
    var leftA = 55;
    var rightA = 360;
    var leftB = 430;
    var rightB = 758;
    var top = 34;
    var bottom = 344;
    var split = 185;
    var maxStability = Math.max(stability.beta, stability.actualUniformStability, 0.01) * 1.25;
    var maxLoss = Math.max(1, online.cumulativeLearner, Math.max.apply(null, online.cumulativeExperts)) * 1.12;
    var maxRegret = Math.max(0.1, Math.max.apply(null, online.rows.map(function (row) { return Math.abs(row.cumulativeLearner - Math.min.apply(null, row.cumulativeExperts)); }))) * 1.25;
    function barX(index) { return leftA + 47 + index * 112; }
    function barY(value) { return split - value / maxStability * (split - top); }
    function x(index) { return leftB + (index / Math.max(1, online.T - 1)) * (rightB - leftB); }
    function yLoss(value) { return bottom - value / maxLoss * (bottom - top); }
    function yRegret(value) { return bottom - value / maxRegret * (bottom - split - 25); }
    function line(key, mapper) {
      return online.rows.map(function (row, index) { return (index ? "L" : "M") + x(index).toFixed(2) + "," + mapper(row[key]).toFixed(2); }).join(" ");
    }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-labelledby", uid + "-chart-title " + uid + "-chart-desc");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-chart-title" }, "稳定性证书与 Hedge 累积损失"));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-chart-desc" }, "左侧比较实际邻居稳定性与 beta 证书，右侧比较 Hedge 累积损失、最佳专家和逐轮 realized regret。"));
    [0, maxStability / 2, maxStability].forEach(function (value) {
      var y = barY(value);
      svg.appendChild(svgElement(doc, "line", { x1: leftA, y1: y, x2: rightA, y2: y, className: "or-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: leftA - 8, y: y + 4, "text-anchor": "end" }, format(value, 3)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: leftA, y1: split, x2: rightA, y2: split, className: "or-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: leftA, y1: top, x2: leftA, y2: split, className: "or-axis" }));
    [{ label: "beta 证书", value: stability.beta, className: "or-stability" }, { label: "邻居实测", value: stability.actualUniformStability, className: "or-observed" }].forEach(function (item, index) {
      var y = barY(item.value);
      svg.appendChild(svgElement(doc, "rect", { x: barX(index) - 24, y: y, width: 48, height: split - y, className: item.className }));
      svg.appendChild(svgElement(doc, "text", { x: barX(index), y: split + 17, "text-anchor": "middle" }, item.label));
      svg.appendChild(svgElement(doc, "text", { x: barX(index), y: y - 6, "text-anchor": "middle" }, format(item.value, 4)));
    });
    svg.appendChild(svgElement(doc, "text", { x: leftA, y: 19, className: "or-title" }, "稳定性：证书与一次邻居检查"));
    svg.appendChild(svgElement(doc, "text", { x: rightA, y: 19, "text-anchor": "end" }, "beta 是假设下的上界"));
    [0, maxLoss / 2, maxLoss].forEach(function (value) {
      var y = yLoss(value);
      svg.appendChild(svgElement(doc, "line", { x1: leftB, y1: y, x2: rightB, y2: y, className: "or-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: leftB - 8, y: y + 4, "text-anchor": "end" }, format(value, 1)));
    });
    svg.appendChild(svgElement(doc, "path", { d: line("cumulativeLearner", yLoss), className: "or-learner" }));
    svg.appendChild(svgElement(doc, "path", { d: online.rows.map(function (row, index) { return (index ? "L" : "M") + x(index).toFixed(2) + "," + yLoss(Math.min.apply(null, row.cumulativeExperts)).toFixed(2); }).join(" "), className: "or-comparator" }));
    svg.appendChild(svgElement(doc, "line", { x1: leftB, y1: split, x2: rightB, y2: split, className: "or-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: online.rows.map(function (row, index) { return (index ? "L" : "M") + x(index).toFixed(2) + "," + yRegret(row.cumulativeLearner - Math.min.apply(null, row.cumulativeExperts)).toFixed(2); }).join(" "), className: "or-regret" }));
    svg.appendChild(svgElement(doc, "text", { x: leftB, y: 19, className: "or-title" }, "Hedge：累积损失与逐轮 realized regret"));
    svg.appendChild(svgElement(doc, "text", { x: rightB, y: 19, "text-anchor": "end" }, "蓝 learner；绿 best fixed expert；红 regret"));
    svg.appendChild(svgElement(doc, "text", { x: leftB, y: split + 18, className: "or-title" }, "逐轮 regret（下半图）"));
    svg.appendChild(svgElement(doc, "text", { x: rightB, y: bottom + 25, "text-anchor": "end" }, "round"));
    online.rows.forEach(function (row, index) {
      if (index === 0 || index === online.rows.length - 1 || index % Math.max(1, Math.floor(online.T / 5)) === 0) {
        svg.appendChild(svgElement(doc, "text", { x: x(index), y: bottom + 14, "text-anchor": "middle" }, String(row.round)));
      }
    });
  }

  function stabilityTable(doc, result) {
    var table = element(doc, "table", { className: "or-table" });
    table.appendChild(element(doc, "caption", {}, "正则化 ERM 的邻居替换检查；它是稳定性诊断，不是把一个样本变成 iid 期望的证明。"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["对象", "weight", "empirical risk", "population risk", "说明"].map(function (label) {
      return element(doc, "th", { scope: "col" }, label);
    }))));
    table.appendChild(element(doc, "tbody", {}, [
      element(doc, "tr", {}, [element(doc, "td", {}, "原样本 S"), element(doc, "td", {}, format(result.fit.weight, 5)), element(doc, "td", {}, format(result.empiricalRisk, 5)), element(doc, "td", {}, format(result.populationRisk, 5)), element(doc, "td", {}, "固定两点参考分布")]),
      element(doc, "tr", {}, [element(doc, "td", {}, "替换样本 S(i)"), element(doc, "td", {}, format(result.neighborFit.weight, 5)), element(doc, "td", {}, format(result.neighborFit.empiricalRisk, 5)), element(doc, "td", {}, "-"), element(doc, "td", {}, "只用于邻居敏感度")]),
      element(doc, "tr", {}, [element(doc, "td", {}, "uniform stability"), element(doc, "td", {}, "-"), element(doc, "td", {}, format(result.actualUniformStability, 5)), element(doc, "td", {}, format(result.beta, 5)), element(doc, "td", {}, "实测 max loss diff / beta 证书")])
    ]));
    return table;
  }

  function hedgeTable(doc, result) {
    var table = element(doc, "table", { className: "or-table" });
    table.appendChild(element(doc, "caption", {}, "Hedge 逐轮账本；comparator 是事后最优的固定专家，realized regret 与 theorem bound 分栏。"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["t", "losses", "probabilities", "learner loss", "cum learner", "best cum expert", "cum regret"].map(function (label) {
      return element(doc, "th", { scope: "col" }, label);
    }))));
    var body = element(doc, "tbody");
    result.rows.forEach(function (row) {
      var best = Math.min.apply(null, row.cumulativeExperts);
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "td", {}, String(row.round)),
        element(doc, "td", {}, row.losses.map(function (value) { return format(value, 2); }).join(" / ")),
        element(doc, "td", {}, row.probabilities.map(function (value) { return format(value, 3); }).join(" / ")),
        element(doc, "td", {}, format(row.learnerLoss, 5)),
        element(doc, "td", {}, format(row.cumulativeLearner, 5)),
        element(doc, "td", {}, format(best, 5)),
        element(doc, "td", { className: row.cumulativeLearner - best < 0 ? "or-negative" : "" }, format(row.cumulativeLearner - best, 5))
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || document;
    installStyles(doc);
    SERIAL += 1;
    var uid = "or-" + SERIAL;
    var stabilityConfig = normalizeStability(DEFAULT_STABILITY);
    var hedgeConfig = normalizeHedge(DEFAULT_HEDGE);
    var predictions = { stabilityAssumption: null, generalization: null, online: null, bound: null };
    var questions = [
      { key: "stabilityAssumption", prompt: "稳定性证书 beta 依赖哪些条件？", choices: [["convex", "凸、L-Lipschitz 损失和正则强凸"], ["none", "只要看一次训练误差"], ["adversary", "只要序列对抗"]], answer: "convex" },
      { key: "generalization", prompt: "uniform stability 的泛化说法是什么？", choices: [["expected", "iid 假设下的期望泛化差"], ["distribution-free", "对任意单条数据都无条件成立"], ["regret", "它就是在线 regret"]], answer: "expected" },
      { key: "online", prompt: "Hedge 能处理哪种序列？", choices: [["adversarial", "损失可由对手逐轮给出"], ["iid-only", "必须 iid"], ["test-only", "只能在测试集上"]], answer: "adversarial" },
      { key: "bound", prompt: "一次 realized regret 应怎样标注？", choices: [["ledger", "本序列账本的观测值，不是 worst-case bound"], ["bound", "它本身就是最坏情形界"], ["zero", "应当总为 0"]], answer: "ledger" }
    ];
    var shell = element(doc, "div", { className: "or-lab" });
    shell.appendChild(element(doc, "h3", {}, "稳定性证书与 Hedge 对抗账本"));
    shell.appendChild(element(doc, "p", { className: "or-intro" }, "先分别判断统计泛化和在线 regret 的量词，再打开两台确定性计算器。稳定性和 Hedge 是两条不同的保证路线。"));
    var gate = element(doc, "form", { className: "or-gate", "aria-labelledby": uid + "-gate-title" });
    gate.appendChild(element(doc, "strong", { id: uid + "-gate-title" }, "预测门：假设、对手和 realized 值要分栏"));
    var choiceNodes = [];
    var feedback = element(doc, "p", { className: "or-feedback", "aria-live": "polite" }, "四项预测完成后才揭示结果。");
    questions.forEach(function (question, index) {
      var field = element(doc, "fieldset");
      field.appendChild(element(doc, "legend", {}, (index + 1) + ". " + question.prompt));
      var row = element(doc, "div", { className: "or-choice-row" });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          predictions[question.key] = choice[0];
          choiceNodes.forEach(function (item) {
            if (item.key === question.key) item.button.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false");
          });
          feedback.textContent = "预测已记录；完成四项后提交。";
        });
        choiceNodes.push({ key: question.key, value: choice[0], button: button });
        row.appendChild(button);
      });
      field.appendChild(row);
      gate.appendChild(field);
    });
    var gateActions = element(doc, "div", { className: "or-actions" });
    var reveal = element(doc, "button", { type: "submit", className: "or-primary" }, "提交预测并揭示");
    var resetGate = element(doc, "button", { type: "button" }, "重置");
    gateActions.appendChild(reveal);
    gateActions.appendChild(resetGate);
    gate.appendChild(gateActions);
    gate.appendChild(feedback);
    shell.appendChild(gate);

    var experiment = element(doc, "section", { hidden: "hidden", "aria-labelledby": uid + "-results-title" });
    experiment.appendChild(element(doc, "h3", { id: uid + "-results-title" }, "确定性实验台：两个保证、两本账"));
    experiment.appendChild(element(doc, "p", { className: "or-note" }, "左侧用 logistic loss 的正则化 ERM 做一个邻居替换检查；右侧在固定 [0,1] 损失序列上运行 Hedge。固定参考分布的 gap 和单条序列 regret 都是 diagnostics，不会自动升级成定理量词。"));
    var layout = element(doc, "div", { className: "or-layout" });
    var stabilityPanel = element(doc, "section", { className: "or-panel", "aria-labelledby": uid + "-stability-title" });
    stabilityPanel.appendChild(element(doc, "h4", { id: uid + "-stability-title" }, "A · regularized ERM stability"));
    var stabilityControls = element(doc, "div", { className: "or-controls" });
    var stabilityInputs = {};
    function addStabilityRange(key, label, min, max, step, digits) {
      var id = uid + "-stability-" + key;
      var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, "aria-label": label });
      var output = element(doc, "output", { for: id });
      input.addEventListener("input", function () { stabilityConfig[key] = Number(input.value); render(); });
      stabilityInputs[key] = { input: input, output: output, digits: digits };
      stabilityControls.appendChild(element(doc, "div", { className: "or-control" }, [
        element(doc, "label", { htmlFor: id }, [label + " = ", output]),
        input,
        element(doc, "div", { className: "or-scale" }, [element(doc, "span", {}, String(min)), element(doc, "span", {}, String(max))])
      ]));
    }
    addStabilityRange("m", "样本数 m", 4, 240, 4, 0);
    addStabilityRange("lambda", "正则强度 lambda", 0.05, 3, 0.05, 2);
    addStabilityRange("L", "Lipschitz scale L", 0.25, 2, 0.05, 2);
    addStabilityRange("positiveProbability", "参考 P(y=+1)", 0, 1, 0.05, 2);
    stabilityPanel.appendChild(stabilityControls);
    var hedgePanel = element(doc, "section", { className: "or-panel", "aria-labelledby": uid + "-hedge-title" });
    hedgePanel.appendChild(element(doc, "h4", { id: uid + "-hedge-title" }, "B · experts / Hedge"));
    var presetRow = element(doc, "div", { className: "or-presets", role: "group", "aria-label": "adversarial sequence presets" });
    SEQUENCES.forEach(function (sequence) {
      var button = element(doc, "button", { type: "button", "aria-pressed": sequence.id === hedgeConfig.sequenceId ? "true" : "false" }, sequence.label);
      button.addEventListener("click", function () { hedgeConfig.sequenceId = sequence.id; render(); });
      presetRow.appendChild(button);
    });
    hedgePanel.appendChild(presetRow);
    var hedgeControls = element(doc, "div", { className: "or-controls" });
    var etaId = uid + "-eta";
    var etaInput = element(doc, "input", { id: etaId, type: "range", min: 0.05, max: 2, step: 0.05, "aria-label": "Hedge learning rate eta" });
    var etaOutput = element(doc, "output", { for: etaId });
    etaInput.addEventListener("input", function () { hedgeConfig.eta = Number(etaInput.value); render(); });
    hedgeControls.appendChild(element(doc, "div", { className: "or-control" }, [
      element(doc, "label", { htmlFor: etaId }, ["learning rate eta = ", etaOutput]),
      etaInput,
      element(doc, "div", { className: "or-scale" }, [element(doc, "span", {}, "0.05"), element(doc, "span", {}, "2")])
    ]));
    hedgePanel.appendChild(hedgeControls);
    layout.appendChild(stabilityPanel);
    layout.appendChild(hedgePanel);
    experiment.appendChild(layout);
    var metrics = element(doc, "div", { className: "or-metrics" });
    var assumption = element(doc, "p", { className: "or-assumption", "aria-live": "polite" });
    var frame = element(doc, "div", { className: "or-frame" });
    var svg = svgElement(doc, "svg", { className: "or-chart", viewBox: "0 0 780 390" });
    frame.appendChild(svg);
    var stabilityWrap = element(doc, "div", { className: "or-table-wrap" });
    var hedgeWrap = element(doc, "div", { className: "or-table-wrap" });
    var interpretation = element(doc, "p", { className: "or-note", "aria-live": "polite" });
    var reset = element(doc, "button", { type: "button" }, "重新预测");
    reset.addEventListener("click", resetAll);
    experiment.appendChild(metrics);
    experiment.appendChild(assumption);
    experiment.appendChild(frame);
    experiment.appendChild(element(doc, "h4", {}, "稳定性账本"));
    experiment.appendChild(stabilityWrap);
    experiment.appendChild(element(doc, "h4", {}, "Hedge 逐轮账本"));
    experiment.appendChild(hedgeWrap);
    experiment.appendChild(interpretation);
    experiment.appendChild(reset);
    shell.appendChild(experiment);
    rootNode.replaceChildren(shell);

    function syncControls() {
      Object.keys(stabilityInputs).forEach(function (key) {
        stabilityInputs[key].input.value = String(stabilityConfig[key]);
        stabilityInputs[key].output.textContent = format(stabilityConfig[key], stabilityInputs[key].digits);
      });
      etaInput.value = String(hedgeConfig.eta);
      etaOutput.textContent = format(hedgeConfig.eta, 2);
    }

    function render() {
      var stability = stabilityCertificate(stabilityConfig);
      var online = hedge(hedgeConfig);
      syncControls();
      presetRow.querySelectorAll("button").forEach(function (button, index) { button.setAttribute("aria-pressed", SEQUENCES[index].id === hedgeConfig.sequenceId ? "true" : "false"); });
      metrics.replaceChildren(
        metric(doc, "beta certificate", format(stability.beta, 5)),
        metric(doc, "neighbor max diff", format(stability.actualUniformStability, 5)),
        metric(doc, "realized gap", format(stability.realizedGap, 5)),
        metric(doc, "rounds T", String(online.T)),
        metric(doc, "comparator", "expert " + (online.comparator + 1)),
        metric(doc, "realized regret", format(online.realizedRegret, 5)),
        metric(doc, "Hedge theorem bound", format(online.theoremBound, 5))
      );
      assumption.textContent = "稳定性：在凸、L-Lipschitz、lambda-强凸且 iid 的前提下，beta 控制期望泛化差；本表的 population risk - empirical risk 是固定参考分布上的一次 realized gap。在线：Hedge 只要求 [0,1] 损失并可面对对抗序列；红色 regret 是本序列数值，不是 worst-case bound。";
      drawChart(doc, svg, stability, online, uid);
      stabilityWrap.replaceChildren(stabilityTable(doc, stability));
      hedgeWrap.replaceChildren(hedgeTable(doc, online));
      interpretation.textContent = online.realizedRegret <= online.theoremBound + 1e-10
        ? "当前 realized regret 位于已标注的 Hedge 证书之下；这只说明本次合法 [0,1] 序列通过了该不等式检查。"
        : "当前参数需要重新检查损失范围或实现；不要把单条序列读成 worst-case 结论。";
    }

    function resetAll() {
      stabilityConfig = normalizeStability(DEFAULT_STABILITY);
      hedgeConfig = normalizeHedge(DEFAULT_HEDGE);
      predictions = { stabilityAssumption: null, generalization: null, online: null, bound: null };
      choiceNodes.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); });
      reveal.disabled = false;
      experiment.setAttribute("hidden", "hidden");
      feedback.className = "or-feedback";
      feedback.textContent = "四项预测完成后才揭示结果。";
      syncControls();
    }

    gate.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return predictions[question.key] === null; });
      if (missing.length) {
        feedback.className = "or-feedback or-assumption";
        feedback.textContent = "还缺 " + missing.length + " 项预测。";
        return;
      }
      var correct = questions.reduce(function (sum, question) { return sum + (predictions[question.key] === question.answer ? 1 : 0); }, 0);
      reveal.disabled = true;
      experiment.removeAttribute("hidden");
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项命中；现在可以分别调节两个模型。";
      render();
      if (api && typeof api.announce === "function") api.announce(rootNode, feedback.textContent);
    });
    resetGate.addEventListener("click", resetAll);
    render();
  }

  function predictionAnswers() {
    return { stabilityAssumption: "convex", generalization: "expected", online: "adversarial", bound: "ledger" };
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance);
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    assert(close(softplus(0), Math.log(2), 1e-12), "softplus zero");
    assert(softplus(40) === 40, "softplus large positive stability");
    assert(sigmoid(0) === 0.5, "sigmoid zero");
    var labels = [1, 1, -1, -1, 1, -1];
    var fit = solveRerm(labels, 0.5, 1);
    assert(finite(fit.weight) && finite(fit.objective), "finite ERM solution");
    assert(Math.abs(fit.gradient) < 1e-10, "ERM first-order condition");
    assert(solveRerm(labels, 0.5, 1).weight === fit.weight, "ERM deterministic solve");
    var stability = stabilityCertificate(DEFAULT_STABILITY);
    assert(stability.beta === 2 / (0.5 * 48), "beta formula");
    assert(stability.actualUniformStability <= stability.beta + 1e-10, "neighbor stability below certificate");
    assert(stability.probeLossDifferences.length === 2, "finite probe domain");
    var moreSamples = stabilityCertificate({ m: 96, lambda: 0.5, L: 1, positiveProbability: 0.5 });
    var moreRegularization = stabilityCertificate({ m: 48, lambda: 1, L: 1, positiveProbability: 0.5 });
    assert(moreSamples.beta < stability.beta && moreRegularization.beta < stability.beta, "beta improves with m or lambda");
    assert(close(stability.realizedGap, stability.populationRisk - stability.empiricalRisk, 1e-12), "realized gap identity");
    var first = hedge(DEFAULT_HEDGE);
    var second = hedge(DEFAULT_HEDGE);
    assert(JSON.stringify(first) === JSON.stringify(second), "Hedge deterministic sequence");
    assert(first.K === 3 && first.T === 12 && first.rows.length === first.T, "Hedge ledger dimensions");
    first.rows.forEach(function (row) {
      assert(close(row.probabilities.reduce(function (sum, value) { return sum + value; }, 0), 1, 1e-12), "probability simplex");
      assert(row.losses.every(function (loss) { return loss >= 0 && loss <= 1; }), "loss range");
      assert(close(row.cumulativeLearner, first.rows.slice(0, row.round).reduce(function (sum, item) { return sum + item.learnerLoss; }, 0), 1e-12), "cumulative learner identity");
    });
    assert(first.comparatorLoss === Math.min.apply(null, first.cumulativeExperts), "comparator minimum");
    assert(close(first.realizedRegret, first.cumulativeLearner - first.comparatorLoss, 1e-12), "comparator regret identity");
    assert(first.realizedRegret <= first.theoremBound + 1e-10, "Hedge theorem bound");
    var steady = hedge({ sequenceId: "steady", eta: 0.4 });
    assert(steady.comparator === 1, "steady best expert");
    var answers = predictionAnswers();
    assert(answers.stabilityAssumption === "convex" && answers.generalization === "expected", "stability gate answers");
    assert(answers.online === "adversarial" && answers.bound === "ledger", "online gate answers");
    return { checks: checks, sequences: SEQUENCES.length };
  }

  return {
    DEFAULT_STABILITY: DEFAULT_STABILITY,
    DEFAULT_HEDGE: DEFAULT_HEDGE,
    SEQUENCES: SEQUENCES,
    logisticLoss: logisticLoss,
    solveRerm: solveRerm,
    stabilityCertificate: stabilityCertificate,
    hedge: hedge,
    predictionAnswers: predictionAnswers,
    selfTest: selfTest,
    mount: mount
  };
});
