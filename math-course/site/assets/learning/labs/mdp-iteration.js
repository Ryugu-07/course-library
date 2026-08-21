(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mdp-iteration", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "mdp-iteration self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("mdp-iteration self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-mdp-iteration-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var DEFAULT = { presetId: "patient", gamma: 0.8, initial: 0, steps: 24, initialPolicy: [0, 0] };

  var ACTIONS = [
    [
      { id: "collect", label: "采集", reward: 1, transition: [1, 0] },
      { id: "travel", label: "远行", reward: -2, transition: [0, 1] }
    ],
    [
      { id: "harvest", label: "收获", reward: 4, transition: [0.4, 0.6] },
      { id: "return", label: "返回", reward: 2, transition: [1, 0] }
    ]
  ];

  var PRESETS = [
    { id: "myopic", label: "短视 γ=0.2", gamma: 0.2, expected: "collect/harvest" },
    { id: "patient", label: "默认 γ=0.8", gamma: 0.8, expected: "travel/harvest" },
    { id: "long", label: "长视 γ=0.95", gamma: 0.95, expected: "travel/harvest" },
    { id: "boundary", label: "边界 γ=1", gamma: 1, expected: "no-certificate" }
  ];

  var STYLE_TEXT = [
    ".mi-lab{--mi-blue:var(--cl-blue,#315f9d);--mi-gold:var(--cl-gold,#9b6a12);--mi-green:var(--cl-green,#39734d);--mi-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}.mi-lab *,.mi-lab *::before,.mi-lab *::after{box-sizing:border-box;}.mi-lab [hidden]{display:none!important;}.mi-lab h3,.mi-lab h4{margin:0;color:var(--fg);}.mi-lab h3{font-size:1.18rem;}.mi-lab h4{margin-top:16px;font-size:1rem;}",
    ".mi-lab button,.mi-lab input{font:inherit;}.mi-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.mi-lab button:hover{border-color:var(--accent);}.mi-lab button[aria-pressed=\"true\"],.mi-lab button.mi-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}.mi-lab button:disabled{cursor:not-allowed;opacity:.55;}.mi-lab button:focus-visible,.mi-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.mi-lab .mi-note,.mi-lab .mi-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}.mi-lab .mi-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--mi-gold);background:var(--bg);}.mi-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.mi-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750;}.mi-lab .mi-question-list{display:grid;gap:12px;}.mi-lab .mi-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.mi-lab .mi-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.mi-lab .mi-choice-grid button{font-size:12px;}.mi-lab .mi-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.mi-lab .mi-actions>*{flex:1 1 170px;}.mi-lab .mi-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.mi-lab .mi-pass{color:var(--mi-green);}.mi-lab .mi-warn{color:var(--mi-red);}",
    ".mi-lab .mi-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.mi-lab .mi-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0;}.mi-lab .mi-controls,.mi-lab .mi-stage{min-width:0;}.mi-lab .mi-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.mi-lab .mi-control{display:grid;gap:5px;min-width:0;}.mi-lab .mi-control label,.mi-lab .mi-control-title{color:var(--fg-soft);font-size:13px;font-weight:700;}.mi-lab .mi-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.mi-lab .mi-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.mi-lab .mi-option-grid,.mi-lab .mi-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.mi-lab .mi-option-grid button,.mi-lab .mi-preset-grid button{font-size:12px;}",
    ".mi-lab .mi-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px;margin:12px 0;}.mi-lab .mi-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.mi-lab .mi-metric:nth-child(3n+1){border-top-color:var(--mi-blue);}.mi-lab .mi-metric:nth-child(3n+2){border-top-color:var(--mi-gold);}.mi-lab .mi-metric:nth-child(3n){border-top-color:var(--mi-red);}.mi-lab .mi-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.mi-lab .mi-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}.mi-lab .mi-frame{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.mi-lab .mi-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.mi-lab .mi-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.mi-lab .mi-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}.mi-lab .mi-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.72;}.mi-lab .mi-value0{fill:none;stroke:var(--mi-blue);stroke-width:3;}.mi-lab .mi-value1{fill:none;stroke:var(--mi-gold);stroke-width:3;}.mi-lab .mi-bound{fill:none;stroke:var(--mi-red);stroke-width:2;stroke-dasharray:6 4;}.mi-lab .mi-point{stroke:var(--bg);stroke-width:2;}.mi-lab .mi-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.mi-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.mi-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;}.mi-lab th,.mi-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.mi-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.mi-lab .mi-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--mi-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
    "@media(max-width:900px){.mi-lab .mi-layout{grid-template-columns:minmax(0,1fr);}}@media(max-width:760px){.mi-lab .mi-choice-grid{grid-template-columns:minmax(0,1fr);}.mi-lab .mi-preset-grid{grid-template-columns:minmax(0,1fr);}}@media(max-width:420px){.mi-lab .mi-frame{padding:6px;}.mi-lab table{font-size:11.5px;}.mi-lab th,.mi-lab td{padding-left:5px;padding-right:5px;}}@media(prefers-reduced-motion:reduce){.mi-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
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

  function policyKey(policy) {
    return policy[0] + "/" + policy[1];
  }

  function policyLabel(policy) {
    return ACTIONS[0][policy[0]].label + " / " + ACTIONS[1][policy[1]].label;
  }

  function qValues(value, gamma, state) {
    return ACTIONS[state].map(function (action) {
      return action.reward + gamma * (
        action.transition[0] * value[0] + action.transition[1] * value[1]
      );
    });
  }

  function bellman(value, gamma) {
    return [0, 1].map(function (state) {
      return Math.max.apply(null, qValues(value, gamma, state));
    });
  }

  function greedyPolicy(value, gamma) {
    return [0, 1].map(function (state) {
      var q = qValues(value, gamma, state);
      return q[1] > q[0] + EPS ? 1 : 0;
    });
  }

  function normInf(left, right) {
    return Math.max(Math.abs(left[0] - right[0]), Math.abs(left[1] - right[1]));
  }

  function solveLinearSystem(matrix, right) {
    var matrixScale = Math.max(
      1,
      Math.abs(matrix[0][0]),
      Math.abs(matrix[0][1]),
      Math.abs(matrix[1][0]),
      Math.abs(matrix[1][1])
    );
    var pivotTolerance = 64 * Number.EPSILON * matrixScale;
    var a = [
      [matrix[0][0], matrix[0][1], right[0]],
      [matrix[1][0], matrix[1][1], right[1]]
    ];
    for (var pivot = 0; pivot < 2; pivot += 1) {
      var best = pivot;
      if (Math.abs(a[1][pivot]) > Math.abs(a[best][pivot])) best = 1;
      if (Math.abs(a[best][pivot]) <= pivotTolerance) return null;
      if (best !== pivot) {
        var swap = a[pivot];
        a[pivot] = a[best];
        a[best] = swap;
      }
      var divisor = a[pivot][pivot];
      for (var column = pivot; column < 3; column += 1) a[pivot][column] /= divisor;
      for (var row = 0; row < 2; row += 1) {
        if (row === pivot) continue;
        var factor = a[row][pivot];
        for (var eliminate = pivot; eliminate < 3; eliminate += 1) {
          a[row][eliminate] -= factor * a[pivot][eliminate];
        }
      }
    }
    return [a[0][2], a[1][2]];
  }

  function evaluatePolicy(policy, gamma) {
    var selected = [ACTIONS[0][policy[0]], ACTIONS[1][policy[1]]];
    var matrix = [
      [1 - gamma * selected[0].transition[0], -gamma * selected[0].transition[1]],
      [-gamma * selected[1].transition[0], 1 - gamma * selected[1].transition[1]]
    ];
    var rewards = [selected[0].reward, selected[1].reward];
    var value = solveLinearSystem(matrix, rewards);
    if (!value) {
      return { valid: false, policy: policy.slice(), value: null, reason: "I−γP^π 不可逆。" };
    }
    var policyBellman = [
      selected[0].reward + gamma * (selected[0].transition[0] * value[0] + selected[0].transition[1] * value[1]),
      selected[1].reward + gamma * (selected[1].transition[0] * value[0] + selected[1].transition[1] * value[1])
    ];
    return {
      valid: true,
      policy: policy.slice(),
      value: value,
      residual: normInf(policyBellman, value),
      matrix: matrix,
      rewards: rewards
    };
  }

  function optimalSolution(gamma) {
    if (!(gamma >= 0 && gamma < 1)) return null;
    var best = null;
    [[0, 0], [0, 1], [1, 0], [1, 1]].forEach(function (policy) {
      var evaluated = evaluatePolicy(policy, gamma);
      if (!evaluated.valid) return;
      var greedy = greedyPolicy(evaluated.value, gamma);
      if (policyKey(greedy) !== policyKey(policy)) return;
      if (!best || evaluated.value[0] + evaluated.value[1] > best.value[0] + best.value[1]) {
        best = {
          policy: policy.slice(),
          value: evaluated.value.slice(),
          evaluation: evaluated
        };
      }
    });
    return best;
  }

  function valueIteration(options) {
    var settings = options || {};
    var gamma = Number(settings.gamma);
    var steps = clamp(Math.floor(Number(settings.steps === undefined ? 24 : settings.steps)), 1, 60);
    var initialValue = settings.initialValue;
    var value = Array.isArray(initialValue)
      ? [Number(initialValue[0]), Number(initialValue[1])]
      : [Number(settings.initial === undefined ? 0 : settings.initial), Number(settings.initial === undefined ? 0 : settings.initial)];
    if (!finite(value[0]) || !finite(value[1])) value = [0, 0];
    var optimal = optimalSolution(gamma);
    var contractive = gamma >= 0 && gamma < 1;
    var rows = [];
    for (var iteration = 0; iteration <= steps; iteration += 1) {
      var next = bellman(value, gamma);
      var residual = normInf(next, value);
      rows.push({
        iteration: iteration,
        value: value.slice(),
        next: next.slice(),
        policy: greedyPolicy(value, gamma),
        residual: residual,
        valueBound: contractive ? residual / (1 - gamma) : null,
        exactError: optimal ? normInf(value, optimal.value) : null
      });
      value = next;
    }
    return {
      gamma: gamma,
      rows: rows,
      finalValue: value.slice(),
      optimal: optimal,
      contractive: contractive
    };
  }

  function policyIteration(options) {
    var settings = options || {};
    var gamma = Number(settings.gamma);
    var policy = (settings.initialPolicy || [0, 0]).slice();
    var maxIterations = clamp(Math.floor(Number(settings.maxIterations === undefined ? 12 : settings.maxIterations)), 1, 20);
    if (!(gamma >= 0 && gamma < 1)) {
      return { gamma: gamma, valid: false, rows: [], finalPolicy: policy, reason: "γ<1 才给折现评估的可逆性证书。" };
    }
    var rows = [];
    for (var iteration = 0; iteration <= maxIterations; iteration += 1) {
      var evaluated = evaluatePolicy(policy, gamma);
      if (!evaluated.valid) {
        return { gamma: gamma, valid: false, rows: rows, finalPolicy: policy, reason: evaluated.reason };
      }
      var improved = greedyPolicy(evaluated.value, gamma);
      var stable = policyKey(improved) === policyKey(policy);
      rows.push({
        iteration: iteration,
        policy: policy.slice(),
        value: evaluated.value.slice(),
        evaluationResidual: evaluated.residual,
        improvedPolicy: improved.slice(),
        stable: stable
      });
      if (stable) {
        return { gamma: gamma, valid: true, rows: rows, finalPolicy: policy.slice(), value: evaluated.value.slice() };
      }
      policy = improved;
    }
    return { gamma: gamma, valid: true, rows: rows, finalPolicy: policy.slice(), value: null, reason: "达到教学步数上限。" };
  }

  function bellmanInequalityCertificate(value, gamma) {
    var qTable = [qValues(value, gamma, 0), qValues(value, gamma, 1)];
    var slacks = qTable.map(function (q, state) {
      return q.map(function (candidate) { return value[state] - candidate; });
    });
    var scale = Math.max(
      1,
      Math.abs(value[0]),
      Math.abs(value[1]),
      Math.abs(qTable[0][0]),
      Math.abs(qTable[0][1]),
      Math.abs(qTable[1][0]),
      Math.abs(qTable[1][1])
    );
    var comparisonTolerance = Math.max(1e-10, 128 * Number.EPSILON * scale);
    var feasible = slacks.every(function (row) {
      return row.every(function (slack) { return slack >= -comparisonTolerance; });
    });
    var tight = slacks.map(function (row) {
      return row.map(function (slack) { return Math.abs(slack) <= comparisonTolerance; });
    });
    return {
      gamma: gamma,
      value: value.slice(),
      qTable: qTable,
      slacks: slacks,
      feasible: feasible,
      tightByState: tight,
      comparisonTolerance: comparisonTolerance,
      residual: normInf(bellman(value, gamma), value),
      assumption: gamma >= 0 && gamma < 1
        ? "Bellman 不等式的折现有限值证书"
        : "γ<1 假设不满足；不提供最优值证书"
    };
  }

  function lpCertificate(gamma) {
    var optimal = optimalSolution(gamma);
    if (!optimal) {
      return {
        gamma: gamma,
        valid: false,
        candidate: null,
        reason: "γ<1 才使用本页的折现 LP 最优性证书。"
      };
    }
    var certificate = bellmanInequalityCertificate(optimal.value, gamma);
    var valid = certificate.feasible && certificate.tightByState.every(function (row) {
      return row.some(function (tight) { return tight; });
    });
    return {
      gamma: gamma,
      valid: valid,
      candidate: optimal.value.slice(),
      policy: optimal.policy.slice(),
      objective: optimal.value[0] + optimal.value[1],
      qTable: certificate.qTable,
      slacks: certificate.slacks,
      tightByState: certificate.tightByState,
      comparisonTolerance: certificate.comparisonTolerance,
      residual: certificate.residual,
      reason: valid
        ? "所有动作约束在尺度感知容差内可行；每个状态至少一个最优动作约束紧。"
        : "候选值没有通过尺度感知的 Bellman 不等式与紧约束检查。"
    };
  }

  function contractionSample(left, right, gamma) {
    return normInf(bellman(left, gamma), bellman(right, gamma)) <= gamma * normInf(left, right);
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.0005) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
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

  function appendChildren(node, children) {
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
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
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "mi-metric" }, [
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
    return element(doc, "table", {}, [
      element(doc, "caption", {}, [captionText]),
      element(doc, "thead", {}, [head]),
      body
    ]);
  }

  function drawSvg(doc, data, uid) {
    var rows = data.vi.rows;
    var svg = svgElement(doc, "svg", {
      className: "mi-svg",
      viewBox: "0 0 720 340",
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc"
    }, []);
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, ["价值迭代价值与残差证书"]));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" }, [
      "左图显示两个状态的 VI 价值，右图显示 Bellman 残差与折现残差上界。"
    ]));
    var left = 48;
    var right = 350;
    var top = 42;
    var bottom = 250;
    var values = [];
    rows.forEach(function (row) { values.push(row.value[0], row.value[1]); });
    var valueMin = Math.min.apply(null, values.concat([0]));
    var valueMax = Math.max.apply(null, values.concat([0]));
    if (near(valueMin, valueMax, 1e-12)) valueMax = valueMin + 1;
    var mapX = function (index, count, start, end) { return start + (end - start) * index / Math.max(1, count - 1); };
    var mapValueY = function (value) { return bottom - (bottom - top) * (value - valueMin) / (valueMax - valueMin); };
    [valueMin, (valueMin + valueMax) / 2, valueMax].forEach(function (value) {
      var y = mapValueY(value);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, class: "mi-grid" }, []));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "text-anchor": "end", "font-size": 11 }, [format(value, 2)]));
    });
    svg.appendChild(svgElement(doc, "text", { x: left, y: 21, "font-size": 12, "font-weight": 700 }, ["VI 价值"]));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 25, "text-anchor": "end", "font-size": 11 }, ["k"]));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, class: "mi-axis" }, []));
    ["value0", "value1"].forEach(function (className, state) {
      var path = rows.map(function (row, index) {
        return (index === 0 ? "M" : "L") + mapX(index, rows.length, left, right) + " " + mapValueY(row.value[state]);
      }).join(" ");
      svg.appendChild(svgElement(doc, "path", { d: path, class: "mi-" + className }, []));
    });

    var chartLeft = 430;
    var chartRight = 684;
    var residualMax = 0;
    rows.forEach(function (row) { residualMax = Math.max(residualMax, row.residual, row.valueBound || 0); });
    residualMax = residualMax || 1;
    var mapResidualY = function (value) { return bottom - (bottom - top) * value / residualMax; };
    svg.appendChild(svgElement(doc, "text", { x: chartLeft, y: 21, "font-size": 12, "font-weight": 700 }, ["残差与证书"]));
    svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: bottom, x2: chartRight, y2: bottom, class: "mi-axis" }, []));
    [0, residualMax / 2, residualMax].forEach(function (value) {
      var yGrid = mapResidualY(value);
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: yGrid, x2: chartRight, y2: yGrid, class: "mi-grid" }, []));
    });
    var residualPath = rows.map(function (row, index) {
      return (index === 0 ? "M" : "L") + mapX(index, rows.length, chartLeft, chartRight) + " " + mapResidualY(row.residual);
    }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: residualPath, class: "mi-value0" }, []));
    if (rows.some(function (row) { return row.valueBound !== null; })) {
      var boundPath = rows.map(function (row, index) {
        return (index === 0 ? "M" : "L") + mapX(index, rows.length, chartLeft, chartRight) + " " + mapResidualY(row.valueBound || 0);
      }).join(" ");
      svg.appendChild(svgElement(doc, "path", { d: boundPath, class: "mi-bound" }, []));
    }
    svg.appendChild(svgElement(doc, "text", { x: chartLeft, y: bottom + 25, "font-size": 11 }, ["k"]));
    return svg;
  }

  function buttonGroup(doc, label, choices, selected, onSelect, className) {
    var fieldset = element(doc, "fieldset", {});
    fieldset.appendChild(element(doc, "legend", {}, [label]));
    var grid = element(doc, "div", {
      className: className || "mi-option-grid",
      role: "group",
      "aria-label": label
    }, []);
    choices.forEach(function (choice) {
      var button = element(doc, "button", {
        type: "button",
        "aria-pressed": selected === choice.value ? "true" : "false"
      }, [choice.label]);
      button.addEventListener("click", function () { onSelect(choice.value); });
      grid.appendChild(button);
    });
    fieldset.appendChild(grid);
    return fieldset;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !root.appendChild) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var uid = "cl-mi-" + INSTANCE;
    var state = {
      presetId: DEFAULT.presetId,
      gamma: DEFAULT.gamma,
      initial: DEFAULT.initial,
      steps: DEFAULT.steps
    };
    var prediction = { bound: null, policy: null, lp: null, boundary: null };
    var revealed = false;
    var score = 0;
    var shell = element(doc, "div", { className: "mi-lab" }, []);
    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function predictionComplete() {
      return Object.keys(prediction).every(function (key) { return prediction[key] !== null; });
    }

    function addPrediction(container, key, prompt, options) {
      var fieldset = element(doc, "fieldset", { className: "mi-question" }, [
        element(doc, "legend", {}, [prompt])
      ]);
      var grid = element(doc, "div", { className: "mi-choice-grid", role: "group", "aria-label": prompt }, []);
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
      container.appendChild(fieldset);
    }

    function renderGate() {
      clear(shell);
      shell.appendChild(element(doc, "h3", {}, ["MDP 迭代审计：VI、PI 与 LP 对账"]));
      shell.appendChild(element(doc, "p", { className: "mi-note" }, [
        revealed
          ? "预测已提交；现在可以改变 γ、初值和 VI 步数，重新检查残差到价值的证书。"
          : "先完成四项预测。提交前不显示价值、策略、slack 或线性系统结果。"
      ]));
      shell.appendChild(element(doc, "div", { className: "mi-prompt" }, [
        revealed
          ? "当前模型是有限、模型已知的 2×2 toy；这里的精确算术不替代一般 RL 的采样理论。"
          : "预测门：残差上界、策略选择、LP 约束和 γ=1 边界要分别判断。"
      ]));
      var questions = element(doc, "div", { className: "mi-question-list" }, []);
      addPrediction(questions, "bound", "1 · γ<1 时残差的正确读法？", [
        { value: "yes", label: "误差 ≤ r/(1−γ)" },
        { value: "no", label: "残差就是误差" },
        { value: "always", label: "任意 γ 都有" }
      ]);
      addPrediction(questions, "policy", "2 · 默认 γ=0.8 的营地动作？", [
        { value: "collect", label: "采集" },
        { value: "travel", label: "远行" },
        { value: "tie", label: "平局" }
      ]);
      addPrediction(questions, "lp", "3 · LP 要压住哪些 Q？", [
        { value: "all", label: "所有动作" },
        { value: "greedy", label: "只压当前贪心动作" },
        { value: "none", label: "不需约束" }
      ]);
      addPrediction(questions, "boundary", "4 · γ=1 的折现证书？", [
        { value: "none", label: "本页证书失效" },
        { value: "same", label: "仍除以 1−γ" },
        { value: "faster", label: "必然更快" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "mi-actions" }, []);
      var reveal = element(doc, "button", {
        type: "button",
        className: "mi-primary",
        disabled: revealed || !predictionComplete()
      }, [revealed ? "账本已揭示" : "提交预测并揭示"]);
      reveal.addEventListener("click", function () {
        if (!predictionComplete()) return;
        var answers = { bound: "yes", policy: "travel", lp: "all", boundary: "none" };
        score = Object.keys(answers).reduce(function (total, key) {
          return total + (prediction[key] === answers[key] ? 1 : 0);
        }, 0);
        revealed = true;
        renderGate();
        announce("预测已提交；VI、PI 和 LP 账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(reveal);
      actions.appendChild(reset);
      shell.appendChild(actions);
      shell.appendChild(element(doc, "p", {
        className: "mi-feedback " + (revealed ? (score === 4 ? "mi-pass" : "mi-warn") : ""),
        "aria-live": "polite"
      }, [
        !predictionComplete()
          ? "请为四个判断各选一项。"
          : revealed
            ? "预测得分 " + score + "/4；下面打开三路线账本。"
            : "四项预测已记录，点击提交后才显示结果。"
      ]));
      if (revealed) buildRevealed();
    }

    function buildRevealed() {
      var panel = element(doc, "section", { className: "mi-revealed" }, [
        element(doc, "h4", {}, ["结果与透明账本"]),
        element(doc, "p", { className: "mi-note" }, [
          "VI 使用精确 Bellman 扫描；PI 解 2×2 策略评估方程；LP 栏只宣称当前有限 toy 的 Bellman 不等式证书。"
        ])
      ]);
      var layout = element(doc, "div", { className: "mi-layout" }, []);
      var controls = element(doc, "div", { className: "mi-controls" }, []);
      var stage = element(doc, "div", { className: "mi-stage" }, []);
      controls.appendChild(buttonGroup(
        doc,
        "折现预设",
        PRESETS.map(function (preset) { return { value: preset.id, label: preset.label }; }),
        state.presetId,
        function (value) {
          state.presetId = value;
          state.gamma = PRESETS.filter(function (preset) { return preset.id === value; })[0].gamma;
          renderGate();
        },
        "mi-preset-grid"
      ));
      var initialId = uid + "-initial";
      var initialOutput = element(doc, "output", { for: initialId }, [format(state.initial, 1)]);
      var initialInput = element(doc, "input", {
        id: initialId,
        type: "range",
        min: "-5",
        max: "25",
        step: "1",
        value: String(state.initial),
        "aria-label": "共同初始价值"
      });
      initialInput.addEventListener("input", function () {
        state.initial = Number(initialInput.value);
        initialOutput.textContent = format(state.initial, 1);
        renderResults();
      });
      controls.appendChild(element(doc, "div", { className: "mi-control" }, [
        element(doc, "label", { htmlFor: initialId }, ["共同初值 V₀ = ", initialOutput]),
        initialInput
      ]));
      var stepsId = uid + "-steps";
      var stepsOutput = element(doc, "output", { for: stepsId }, [String(state.steps)]);
      var stepsInput = element(doc, "input", {
        id: stepsId,
        type: "range",
        min: "4",
        max: "40",
        step: "1",
        value: String(state.steps),
        "aria-label": "价值迭代步数"
      });
      stepsInput.addEventListener("input", function () {
        state.steps = Number(stepsInput.value);
        stepsOutput.textContent = String(state.steps);
        renderResults();
      });
      controls.appendChild(element(doc, "div", { className: "mi-control" }, [
        element(doc, "label", { htmlFor: stepsId }, ["VI 步数 = ", stepsOutput]),
        stepsInput
      ]));
      var reset = element(doc, "button", { type: "button" }, ["重置实验"]);
      reset.addEventListener("click", resetToGate);
      controls.appendChild(reset);
      layout.appendChild(controls);
      layout.appendChild(stage);
      panel.appendChild(layout);
      shell.appendChild(panel);
      renderResults();

      function renderResults() {
        var vi = valueIteration({ gamma: state.gamma, initial: state.initial, steps: state.steps });
        var pi = policyIteration({ gamma: state.gamma, initialPolicy: [0, 0] });
        var lp = lpCertificate(state.gamma);
        var last = vi.rows[vi.rows.length - 1];
        clear(stage);
        var optimalLabel = vi.optimal ? policyLabel(vi.optimal.policy) : "无本页折现最优解";
        stage.appendChild(element(doc, "div", { className: "mi-metrics" }, [
          metric(doc, "γ", format(state.gamma, 2)),
          metric(doc, "VI 最后残差", format(last.residual, 6)),
          metric(doc, "残差到价值上界", format(last.valueBound, 6)),
          metric(doc, "VI 贪心策略", policyLabel(last.policy)),
          metric(doc, "PI 结果", pi.valid ? policyLabel(pi.finalPolicy) : "无证书"),
          metric(doc, "LP 证书", lp.valid ? "通过" : "不适用"),
          metric(doc, "精确 toy 最优", optimalLabel)
        ]));
        var frame = element(doc, "div", { className: "mi-frame" }, []);
        frame.appendChild(drawSvg(doc, { vi: vi }, uid));
        frame.appendChild(element(doc, "p", { className: "mi-note" }, [
          vi.contractive
            ? "蓝线是 VI 残差；红色虚线是 r/(1−γ)。它是价值误差上界，不是相邻两点差的装饰线。"
            : "γ=1：继续显示有限次算术轨迹，但不绘制折现残差证书。"
        ]));
        stage.appendChild(frame);
        var viRows = vi.rows.filter(function (row, index) {
          var stride = Math.max(1, Math.ceil(vi.rows.length / 10));
          return index % stride === 0 || index === vi.rows.length - 1;
        }).map(function (row) {
          return [
            row.iteration,
            format(row.value[0], 5),
            format(row.value[1], 5),
            policyLabel(row.policy),
            format(row.residual, 6),
            format(row.valueBound, 6),
            format(row.exactError, 6)
          ];
        });
        stage.appendChild(element(doc, "div", { className: "mi-table-wrap" }, [
          tableElement(doc, "价值迭代账本", ["k", "V(营地)", "V(矿区)", "贪心策略", "残差", "r/(1−γ)", "真误差"], viRows)
        ]));
        var piRows = pi.valid
          ? pi.rows.map(function (row) {
            return [
              row.iteration,
              policyLabel(row.policy),
              format(row.value[0], 5) + ", " + format(row.value[1], 5),
              policyLabel(row.improvedPolicy),
              row.stable ? "稳定" : "改进"
            ];
          })
          : [["—", "—", "—", "—", pi.reason || "无评估"]];
        stage.appendChild(element(doc, "div", { className: "mi-table-wrap" }, [
          tableElement(doc, "策略迭代评估与改进", ["轮次", "当前策略", "V^π", "贪心改进", "状态"], piRows)
        ]));
        var lpRows = lp.valid
          ? [
            ["营地 / 采集", format(lp.slacks[0][0], 6), lp.tightByState[0][0] ? "紧" : "松"],
            ["营地 / 远行", format(lp.slacks[0][1], 6), lp.tightByState[0][1] ? "紧" : "松"],
            ["矿区 / 收获", format(lp.slacks[1][0], 6), lp.tightByState[1][0] ? "紧" : "松"],
            ["矿区 / 返回", format(lp.slacks[1][1], 6), lp.tightByState[1][1] ? "紧" : "松"]
          ]
          : [["—", "—", lp.reason || "LP 不适用"]];
        stage.appendChild(element(doc, "div", { className: "mi-table-wrap" }, [
          tableElement(doc, "Bellman 不等式 / LP slack 账本", ["约束 V−Q", "slack", "状态"], lpRows)
        ]));
        stage.appendChild(element(doc, "p", { className: "mi-interpretation", "aria-live": "polite" }, [
          vi.contractive
            ? "当前 γ<1：VI、PI 和 LP 都在同一个有限模型上对账。PI 的轮数和当前数值是 toy 证据；它们不构成一般 MDP 复杂度定理。"
            : "当前 γ=1：折现评估与残差到价值证书没有本页所需的 γ<1 假设；不要把有限步输出解释为一般最优性证明。"
        ]));
      }
    }

    function resetToGate() {
      state = { presetId: DEFAULT.presetId, gamma: DEFAULT.gamma, initial: DEFAULT.initial, steps: DEFAULT.steps };
      prediction = { bound: null, policy: null, lp: null, boundary: null };
      revealed = false;
      score = 0;
      renderGate();
      announce("MDP 迭代实验已重置；请重新完成四项预测。");
    }

    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    assert(near(qValues([0, 0], 0.8, 0)[0], 1, 1e-12), "collect immediate q");
    assert(near(qValues([0, 0], 0.8, 0)[1], -2, 1e-12), "travel immediate q");
    assert(contractionSample([0, 0], [3, -2], 0.7), "Bellman contraction sample");
    var short = valueIteration({ gamma: 0.2, initial: 0, steps: 24 });
    assert(short.optimal && policyKey(short.optimal.policy) === "0/0", "myopic optimal policy");
    assert(policyKey(short.rows[short.rows.length - 1].policy) === "0/0", "myopic VI policy");
    assert(short.rows.every(function (row) {
      return row.valueBound !== null && row.exactError <= row.valueBound + 1e-8;
    }), "myopic residual bounds");
    var patient = valueIteration({ gamma: 0.8, initial: 0, steps: 30 });
    assert(patient.optimal && policyKey(patient.optimal.policy) === "1/0", "patient optimal policy");
    assert(policyKey(patient.rows[patient.rows.length - 1].policy) === "1/0", "patient VI policy");
    assert(patient.rows.every(function (row) {
      return row.exactError <= row.valueBound + 1e-8;
    }), "patient residual bounds");
    var pi = policyIteration({ gamma: 0.8, initialPolicy: [0, 0] });
    assert(pi.valid, "PI valid under gamma less than one");
    assert(policyKey(pi.finalPolicy) === "1/0", "PI reaches optimal policy");
    assert(pi.rows[pi.rows.length - 1].stable, "PI stability row");
    var lp = lpCertificate(0.8);
    assert(lp.valid, "LP certificate valid");
    assert(lp.slacks.every(function (row) { return row.every(function (slack) { return slack >= -1e-8; }); }), "LP slacks feasible");
    assert(lp.tightByState.every(function (row) { return row.some(function (tight) { return tight; }); }), "LP tight action each state");
    var boundary = valueIteration({ gamma: 1, initial: 0, steps: 8 });
    assert(!boundary.contractive, "gamma one not contractive");
    assert(boundary.rows.every(function (row) { return row.valueBound === null; }), "gamma one no residual bound");
    assert(!policyIteration({ gamma: 1, initialPolicy: [0, 0] }).valid, "gamma one PI certificate absent");
    assert(!lpCertificate(1).valid, "gamma one LP certificate absent");
    var evaluation = evaluatePolicy([1, 0], 0.8);
    assert(evaluation.valid, "policy evaluation linear solve");
    assert(near(evaluation.value[0], 8.1818181818, 1e-9), "policy evaluation value");
    var zeroDiscount = optimalSolution(0);
    assert(zeroDiscount && policyKey(zeroDiscount.policy) === "0/0", "gamma zero immediate-reward policy");
    var tie = optimalSolution(5 / 8);
    assert(tie && near(qValues(tie.value, 5 / 8, 0)[0], qValues(tie.value, 5 / 8, 0)[1], 1e-10),
      "gamma five eighths policy tie");
    [0.999999999, 0.99999999999].forEach(function (gamma) {
      var nearOnePolicy = policyIteration({ gamma: gamma, initialPolicy: [0, 0] });
      var nearOneLp = lpCertificate(gamma);
      assert(nearOnePolicy.valid && policyKey(nearOnePolicy.finalPolicy) === "1/0",
        "near-one policy iteration remains numerically valid at " + gamma);
      assert(nearOneLp.valid && nearOneLp.residual <= nearOneLp.comparisonTolerance,
        "near-one LP certificate uses scale-aware residual at " + gamma);
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    ACTIONS: ACTIONS,
    PRESETS: PRESETS,
    qValues: qValues,
    bellman: bellman,
    greedyPolicy: greedyPolicy,
    evaluatePolicy: evaluatePolicy,
    optimalSolution: optimalSolution,
    valueIteration: valueIteration,
    policyIteration: policyIteration,
    bellmanInequalityCertificate: bellmanInequalityCertificate,
    lpCertificate: lpCertificate,
    mount: mount,
    selfTest: selfTest
  };
});
